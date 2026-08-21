/**
 * API Config Store v2
 * Manages API providers and keys with localStorage persistence
 * Supports multi-key rotation and IProvider interface (AionUi pattern)
 *
 * Types live in ./api-config/types, image-host handling in ./api-config/image-hosts,
 * and the persisted-state migration chain in ./api-config/migrations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderId } from '@/features/video-studio/packages/ai-core';
import {
  type IProvider,
  DEFAULT_PROVIDERS,
  generateId,
  parseApiKeys,
  isProviderCredentialConfigured,
  maskApiKey as maskKey,
  updateProviderKeys,
} from '@/features/video-studio/lib/api-key-manager';
import { injectDiscoveryCache, type DiscoveredModelLimits } from '@/features/video-studio/lib/ai/model-registry';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import {
  createDefaultImageHostProviders,
  isVisibleImageHostProvider,
  normalizeImageHostProvider,
  normalizeImageHostProviders,
} from './api-config/image-hosts';
import {
  DEFAULT_ADVANCED_OPTIONS,
  DEFAULT_FEATURE_BINDINGS,
  PROVIDER_INFO,
  type APIConfigState,
  type APIConfigStore,
} from './api-config/types';
import { API_CONFIG_STORE_VERSION, migrateApiConfig } from './api-config/migrations';

// Re-export IProvider for convenience
export type { IProvider } from '@/features/video-studio/lib/api-key-manager';

export {
  AI_FEATURES,
  DEFAULT_ADVANCED_OPTIONS,
  type AdvancedGenerationOptions,
  type AIFeature,
  type APIConfigStatus,
  type FeatureBindings,
} from './api-config/types';

export {
  DEFAULT_IMAGE_HOST_PROVIDERS,
  findImageHostPreset,
  IMAGE_HOST_PRESETS,
  isVisibleImageHostPlatform,
  isVisibleImageHostProvider,
  type ImageHostPlatform,
  type ImageHostProvider,
  type LegacyImageHostConfig,
} from './api-config/image-hosts';

// ==================== Initial State ====================

const initialState: APIConfigState = {
  providers: DEFAULT_PROVIDERS.map((provider) => ({ id: generateId(), ...provider, apiKey: '' })),
  featureBindings: { ...DEFAULT_FEATURE_BINDINGS },
  apiKeys: {},
  aspectRatio: '16:9',
  orientation: 'landscape',
  advancedOptions: { ...DEFAULT_ADVANCED_OPTIONS },
  imageHostProviders: createDefaultImageHostProviders(),
  modelEndpointTypes: {},
  modelTypes: {},
  modelTags: {},
  modelEnableGroups: {},
  discoveredModelLimits: {},
};

// ==================== Store ====================

export const useAPIConfigStore = create<APIConfigStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================== Provider Management (v2) ====================

      addProvider: (providerData) => {
        const newProvider: IProvider = {
          ...providerData,
          id: generateId(),
        };
        set((state) => ({
          providers: [...state.providers, newProvider],
        }));
        // Update key manager
        updateProviderKeys(newProvider.id, newProvider.apiKey);
        console.log(`[APIConfig] Added provider: ${newProvider.name}`);
        return newProvider;
      },

      updateProvider: (provider) => {
        set((state) => ({
          providers: state.providers.map(p => p.id === provider.id ? provider : p),
        }));
        // Update key manager
        updateProviderKeys(provider.id, provider.apiKey);
        console.log(`[APIConfig] Updated provider: ${provider.name}`);
      },

      removeProvider: (id) => {
        const provider = get().providers.find(p => p.id === id);
        set((state) => ({
          providers: state.providers.filter(p => p.id !== id),
        }));
        if (provider) {
          console.log(`[APIConfig] Removed provider: ${provider.name}`);
        }
      },

      getProviderByPlatform: (platform) => {
        return get().providers.find(p => p.platform === platform);
      },

      getProviderById: (id) => {
        return get().providers.find(p => p.id === id);
      },

      syncProviderModels: async (providerId) => {
        const provider = get().providers.find(p => p.id === providerId);
        if (!provider) return { success: false, count: 0, error: 'Provider not found' };

        const keys = parseApiKeys(provider.apiKey);
        if (keys.length === 0) return { success: false, count: 0, error: 'Configure an API key first' };

        const baseUrl = provider.baseUrl?.replace(/\/+$/, '');
        if (!baseUrl) return { success: false, count: 0, error: 'Base URL is not configured' };

        try {
          // Collect models from all keys with a Set for automatic deduplication.
          const allModelIds = new Set<string>();
          {
            // Standard OpenAI-compatible flow: query /v1/models per key and merge results.
            const modelsUrl = /\/v\d+$/.test(baseUrl)
              ? `${baseUrl}/models`
              : `${baseUrl}/v1/models`;

            const endpointUpdates: Record<string, string[]> = {};
            let anySuccess = false;
            let lastError = '';

            for (let ki = 0; ki < keys.length; ki++) {
              try {
                const response = await fetch(modelsUrl, {
                  headers: { 'Authorization': `Bearer ${keys[ki]}` },
                });

                if (!response.ok) {
                  lastError = `key#${ki + 1} API returned ${response.status}`;
                  console.warn(`[APIConfig] ${lastError}`);
                  continue;
                }

                const json = await response.json();
                const data: Array<{ id: string; [key: string]: unknown }> = json.data || json;
                if (!Array.isArray(data) || data.length === 0) {
                  console.warn(`[APIConfig] key#${ki + 1} returned empty model list`);
                  continue;
                }

                anySuccess = true;
                for (const m of data) {
                  const id = typeof m === 'string' ? m : m.id;
                  if (typeof id === 'string' && id.length > 0) allModelIds.add(id);
                  // Capture endpoint_types metadata.
                  if (typeof m !== 'string' && m.id && Array.isArray(m.supported_endpoint_types)) {
                    endpointUpdates[m.id] = m.supported_endpoint_types as string[];
                  }
                }
                console.log(`[APIConfig] key#${ki + 1} contributed models, total so far: ${allModelIds.size}`);
              } catch (e) {
                lastError = `key#${ki + 1} network request failed`;
                console.warn(`[APIConfig] ${lastError}:`, e);
              }
            }

            if (Object.keys(endpointUpdates).length > 0) {
              set((state) => ({
                modelEndpointTypes: {
                  ...state.modelEndpointTypes,
                  ...endpointUpdates,
                },
              }));
            }

            if (!anySuccess) {
              return { success: false, count: 0, error: lastError || 'Unexpected API response' };
            }
          }

          const modelIds = Array.from(allModelIds);
          if (modelIds.length === 0) {
            return { success: false, count: 0, error: 'No models were returned' };
          }

          // Replace provider model list with merged & deduped data
          get().updateProvider({ ...provider, model: modelIds });

          console.log(`[APIConfig] Synced ${modelIds.length} models for ${provider.name} (from ${keys.length} keys)`);
          return { success: true, count: modelIds.length };
        } catch (error) {
          console.error('[APIConfig] Model sync failed:', error);
          return { success: false, count: 0, error: 'Network request failed. Check your connection.' };
        }
      },

      // ==================== Feature Binding Management (Multi-Select) ====================

      // Replace all bindings for a feature.
      setFeatureBindings: (feature, bindings) => {
        set((state) => ({
          featureBindings: { ...state.featureBindings, [feature]: bindings },
        }));
        console.log(`[APIConfig] Set ${feature} -> [${bindings?.join(', ') || 'none'}]`);
      },

      // Toggle a single binding on or off.
      toggleFeatureBinding: (feature, binding) => {
        const current = get().featureBindings[feature] || [];
        const exists = current.includes(binding);

        // Also check whether a legacy platform:model binding exists.
        // For example, binding = "{id}:model-name" while current may contain a legacy platform:model binding.
        let legacyMatch: string | null = null;
        const idx = binding.indexOf(':');
        if (idx > 0) {
          const providerId = binding.slice(0, idx);
          const model = binding.slice(idx + 1);
          const provider = get().providers.find(p => p.id === providerId);
          if (provider) {
            const legacyKey = `${provider.platform}:${model}`;
            if (legacyKey !== binding && current.includes(legacyKey)) {
              legacyMatch = legacyKey;
            }
          }
        }

        if (exists || legacyMatch) {
          // Remove both exact and legacy-format matches.
          const newBindings = current.filter(b => b !== binding && b !== legacyMatch);
          set((state) => ({
            featureBindings: { ...state.featureBindings, [feature]: newBindings.length > 0 ? newBindings : null },
          }));
          console.log(`[APIConfig] Toggle ${feature}: ${binding} -> removed${legacyMatch ? ` (also removed legacy: ${legacyMatch})` : ''}`);
        } else {
          // Add binding.
          const newBindings = [...current, binding];
          set((state) => ({
            featureBindings: { ...state.featureBindings, [feature]: newBindings.length > 0 ? newBindings : null },
          }));
          console.log(`[APIConfig] Toggle ${feature}: ${binding} -> added`);
        }
      },

      // Get all bindings for a feature.
      getFeatureBindings: (feature) => {
        const bindings = get().featureBindings;
        const value = bindings?.[feature];
        // Backward compatibility: convert legacy string values into arrays.
        if (typeof value === 'string') return [value];
        return value || [];
      },

      // Resolve all provider/model pairs for a feature.
      getProvidersForFeature: (feature) => {
        const bindings = get().getFeatureBindings(feature);
        const results: Array<{ provider: IProvider; model: string }> = [];

        for (const binding of bindings) {
          const idx = binding.indexOf(':');
          if (idx <= 0) continue;
          const platformOrId = binding.slice(0, idx);
          const model = binding.slice(idx + 1);
          // 1. Prefer exact provider.id matching.
          let provider = get().providers.find(p => p.id === platformOrId);
          // 2. Fallback to platform matching only when that platform has exactly one provider,
          //    to avoid picking the wrong provider among multiple custom entries.
          if (!provider) {
            const platformMatches = get().providers.filter(p => p.platform === platformOrId);
            if (platformMatches.length === 1) {
              provider = platformMatches[0];
            } else if (platformMatches.length > 1) {
              console.warn(`[APIConfig] Ambiguous platform binding "${binding}" matches ${platformMatches.length} providers, skipping`);
            }
          }
          if (!provider || !isProviderCredentialConfigured(provider.platform, provider.apiKey)) {
            continue;
          }

          // Skip stale hidden bindings that no longer exist in the provider's synced model list.
          // This prevents runtime from executing models that the service-mapping UI can no longer display.
          if (provider.model.length > 0 && !provider.model.includes(model)) {
            console.warn(
              `[APIConfig] Skipping stale binding "${binding}" for ${feature}: model "${model}" is not in provider "${provider.name}" model list`
            );
            continue;
          }

          results.push({ provider, model });
        }
        return results;
      },

      isFeatureConfigured: (feature) => {
        const cliRuntime = useVideoStudioSettingsStore.getState().cliRuntime;
        if (cliRuntime.enabled && (feature === 'script_analysis' || feature === 'chat')) {
          return true;
        }
        return get().getProvidersForFeature(feature).length > 0;
      },

      // Legacy single-select compatibility (deprecated).
      setFeatureBinding: (feature, providerId) => {
        // Single-select compatibility: wrap in a one-element array.
        get().setFeatureBindings(feature, providerId ? [providerId] : null);
      },

      getFeatureBinding: (feature) => {
        const bindings = get().getFeatureBindings(feature);
        return bindings[0] || null;
      },

      getProviderForFeature: (feature) => {
        const providers = get().getProvidersForFeature(feature);
        return providers[0]?.provider;
      },

      // ==================== Legacy API Key management (v1 compat) ====================

      setApiKey: (provider, key) => {
        // Update legacy apiKeys
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        }));

        // Also update provider if exists
        const existingProvider = get().getProviderByPlatform(provider);
        if (existingProvider) {
          get().updateProvider({ ...existingProvider, apiKey: key });
        }

        console.log(`[APIConfig] Updated ${provider} API key: ${get().maskApiKey(key)}`);
      },

      getApiKey: (provider) => {
        // First check providers (v2)
        const prov = get().getProviderByPlatform(provider);
        if (prov?.apiKey) {
          // Return first key for compatibility
          const keys = parseApiKeys(prov.apiKey);
          return keys[0] || '';
        }
        // Fallback to legacy apiKeys
        return get().apiKeys[provider] || '';
      },

      clearApiKey: (provider) => {
        // Clear from legacy
        set((state) => {
          const newKeys = { ...state.apiKeys };
          delete newKeys[provider];
          return { apiKeys: newKeys };
        });

        // Also clear from provider if exists
        const existingProvider = get().getProviderByPlatform(provider);
        if (existingProvider) {
          get().updateProvider({ ...existingProvider, apiKey: '' });
        }

        console.log(`[APIConfig] Cleared ${provider} API key`);
      },

      clearAllApiKeys: () => {
        // Clear legacy
        set({ apiKeys: {} });

        // Clear all provider keys
        const { providers, updateProvider } = get();
        providers.forEach(p => {
          updateProvider({ ...p, apiKey: '' });
        });

        console.log('[APIConfig] Cleared all API keys');
      },

      // ==================== Aspect ratio ====================

      setAspectRatio: (ratio) => {
        set({
          aspectRatio: ratio,
          orientation: ratio === '16:9' ? 'landscape' : 'portrait',
        });
        console.log(`[APIConfig] Set aspect ratio to ${ratio}`);
      },

      toggleOrientation: () => {
        const { aspectRatio } = get();
        const newRatio = aspectRatio === '16:9' ? '9:16' : '16:9';
        get().setAspectRatio(newRatio);
      },

      // ==================== Advanced Generation Options ====================

      setAdvancedOption: (key, value) => {
        set((state) => ({
          advancedOptions: { ...state.advancedOptions, [key]: value },
        }));
        console.log(`[APIConfig] Set advanced option ${key} = ${value}`);
      },

      resetAdvancedOptions: () => {
        set({ advancedOptions: { ...DEFAULT_ADVANCED_OPTIONS } });
        console.log('[APIConfig] Reset advanced options to defaults');
      },

      // ==================== Image Host Providers (independent) ====================

      addImageHostProvider: (providerData) => {
        const newProvider = normalizeImageHostProvider({
          ...providerData,
          id: generateId(),
        });
        set((state) => ({
          imageHostProviders: [...state.imageHostProviders, newProvider],
        }));
        console.log(`[APIConfig] Added image host: ${newProvider.name}`);
        return newProvider;
      },

      updateImageHostProvider: (provider) => {
        const normalizedProvider = normalizeImageHostProvider(provider);
        set((state) => ({
          imageHostProviders: state.imageHostProviders.map(p => p.id === normalizedProvider.id ? normalizedProvider : p),
        }));
        console.log(`[APIConfig] Updated image host: ${normalizedProvider.name}`);
      },

      removeImageHostProvider: (id) => {
        const provider = get().imageHostProviders.find(p => p.id === id);
        set((state) => ({
          imageHostProviders: state.imageHostProviders.filter(p => p.id !== id),
        }));
        if (provider) {
          console.log(`[APIConfig] Removed image host: ${provider.name}`);
        }
      },

      getImageHostProviderById: (id) => {
        const provider = get().imageHostProviders.find(p => p.id === id);
        return provider && isVisibleImageHostProvider(provider)
          ? normalizeImageHostProvider(provider)
          : undefined;
      },

      getEnabledImageHostProviders: () => {
        return normalizeImageHostProviders(get().imageHostProviders).filter(p => p.enabled);
      },

      isImageHostConfigured: () => {
        const providers = normalizeImageHostProviders(get().imageHostProviders);
        return providers.some(p => {
          const hasKey = parseApiKeys(p.apiKey).length > 0;
          const hasUrl = !!(p.baseUrl || p.uploadPath);
          return p.enabled && hasUrl && (p.apiKeyOptional || hasKey);
        });
      },

      // ==================== Validation ====================

      isConfigured: (provider) => {
        // Check v2 providers first
        const prov = get().getProviderByPlatform(provider);
        if (prov) {
          return isProviderCredentialConfigured(prov.platform, prov.apiKey);
        }
        // Fallback to legacy
        const key = get().apiKeys[provider];
        return !!key && key.length > 0;
      },

      isPlatformConfigured: (platform) => {
        const provider = get().getProviderByPlatform(platform);
        return !!provider && isProviderCredentialConfigured(provider.platform, provider.apiKey);
      },

      checkRequiredKeys: (services) => {
        const missing: string[] = [];
        const { isConfigured } = get();

        for (const service of services) {
          // Find provider for this service
          for (const [providerId, info] of Object.entries(PROVIDER_INFO)) {
            if (info.services.includes(service) && !isConfigured(providerId as ProviderId)) {
              if (!missing.includes(info.name)) {
                missing.push(info.name);
              }
            }
          }
        }

        return {
          isAllConfigured: missing.length === 0,
          missingKeys: missing,
          friendlyMessage: missing.length === 0
            ? 'All API keys are configured'
            : `Missing API keys for: ${missing.join(', ')}`,
        };
      },

      checkChatKeys: () => {
        return get().checkRequiredKeys(['chat']);
      },

      checkVideoGenerationKeys: () => {
        return get().checkRequiredKeys(['chat', 'image', 'video']);
      },

      // ==================== Display helpers ====================

      maskApiKey: (key) => {
        return maskKey(key);
      },

      getAllConfigs: () => {
        const { apiKeys, maskApiKey, isConfigured } = get();
        return (Object.keys(PROVIDER_INFO) as ProviderId[]).map((provider) => ({
          provider,
          configured: isConfigured(provider),
          masked: maskApiKey(apiKeys[provider] || ''),
        }));
      },

      // ==================== Model limits discovery ====================

      getDiscoveredModelLimits: (model) => {
        return get().discoveredModelLimits[model];
      },

      setDiscoveredModelLimits: (model, limits) => {
        set((state) => ({
          discoveredModelLimits: {
            ...state.discoveredModelLimits,
            [model]: {
              ...state.discoveredModelLimits[model],
              ...limits,
              discoveredAt: Date.now(),
            } as DiscoveredModelLimits,
          },
        }));
        console.log(`[APIConfig] Discovered model limits for ${model}:`, limits);
      },
    }),
    {
      name: 'opencut-api-config',  // localStorage key
      version: API_CONFIG_STORE_VERSION,
      migrate: migrateApiConfig,
      partialize: (state) => ({
        // Persist these fields
        providers: state.providers,
        featureBindings: state.featureBindings,
        apiKeys: state.apiKeys, // Keep for backward compat
        aspectRatio: state.aspectRatio,
        orientation: state.orientation,
        advancedOptions: state.advancedOptions,
        imageHostProviders: state.imageHostProviders,
        modelEndpointTypes: state.modelEndpointTypes,
        modelTypes: state.modelTypes,
        modelTags: state.modelTags,
        modelEnableGroups: state.modelEnableGroups,
        discoveredModelLimits: state.discoveredModelLimits,
      }),
    }
  )
);

// ==================== Selectors ====================

/**
 * Check if all required APIs for video generation are configured
 */
export const useIsVideoGenerationReady = (): boolean => {
  return useAPIConfigStore((state) => {
    const status = state.checkVideoGenerationKeys();
    return status.isAllConfigured;
  });
};

// ==================== Model Registry Cache Injection ====================

// Inject discovery cache into model-registry (avoids circular dependency)
// This runs once when the module is loaded
injectDiscoveryCache(
  (model: string) => useAPIConfigStore.getState().getDiscoveredModelLimits(model),
  (model: string, limits: Partial<DiscoveredModelLimits>) => useAPIConfigStore.getState().setDiscoveredModelLimits(model, limits),
);
