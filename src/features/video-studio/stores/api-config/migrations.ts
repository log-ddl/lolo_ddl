import type { ProviderId } from '@/features/video-studio/packages/ai-core';
import {
  type IProvider,
  GOOGLE_FLOW_MODELS,
  GROK_VIDEO_MODELS,
  DEFAULT_PROVIDERS,
  generateId,
} from '@/features/video-studio/lib/api-key-manager';
import {
  createDefaultImageHostProviders,
  normalizeImageHostProviders,
  type ImageHostProvider,
  type LegacyImageHostConfig,
} from './image-hosts';
import { DEFAULT_FEATURE_BINDINGS, type AIFeature, type APIConfigState, type FeatureBindings } from './types';

/**
 * Chained persisted-state migration for `opencut-api-config`.
 *
 * Each step mutates `result` and falls through to the next, so a store saved at
 * any old version reaches the current shape in one pass. Steps that only changed
 * image-host defaults are no-ops here — the final normalization block rebuilds
 * those from `resolveImageHostProviders`.
 */
export const API_CONFIG_STORE_VERSION = 21;

type MigrationResult = Partial<APIConfigState> & { imageHostConfig?: LegacyImageHostConfig };

export function migrateApiConfig(persistedState: unknown, version: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = { ...(persistedState as any) } as MigrationResult;
  console.log(`[APIConfig] Chained migration: v${version} → v19`);

  const defaultBindings: FeatureBindings = { ...DEFAULT_FEATURE_BINDINGS };

  const resolveImageHostProviders = (): ImageHostProvider[] => {
    const legacyConfig = result?.imageHostConfig;
    let imageHostProviders: ImageHostProvider[] = normalizeImageHostProviders(result?.imageHostProviders || []);

    if (!imageHostProviders || imageHostProviders.length === 0) {
      if (legacyConfig) {
        if (legacyConfig.type === 'custom' && legacyConfig.custom) {
          imageHostProviders = [
            {
              id: generateId(),
              platform: 'custom',
              name: 'Custom Image Host',
              baseUrl: legacyConfig.custom.uploadUrl || '',
              uploadPath: '',
              apiKey: legacyConfig.custom.apiKey || '',
              enabled: true,
            },
          ];
        }
      }

      if (!imageHostProviders || imageHostProviders.length === 0) {
        imageHostProviders = createDefaultImageHostProviders();
      }
    }

    return normalizeImageHostProviders(imageHostProviders);
  };

  // v0/v1 → v2: Migrate apiKeys to providers
  if (version <= 1) {
    const oldApiKeys = result?.apiKeys || {};
    const providers: IProvider[] = [];

    for (const template of DEFAULT_PROVIDERS) {
      const existingKey = oldApiKeys[template.platform as ProviderId] || '';
      providers.push({
        id: generateId(),
        ...template,
        apiKey: existingKey,
      });
    }

    console.log(`[APIConfig] v0/v1→v2: Migrated ${providers.length} providers from apiKeys`);
    result.providers = providers;
    result.featureBindings = defaultBindings;
    result.apiKeys = oldApiKeys;
    version = 2; // continue to next step
  }

  // v2 → v3: Ensure providers and featureBindings exist
  if (version <= 2) {
    result.providers = result.providers || [];
    result.featureBindings = { ...defaultBindings, ...(result.featureBindings || {}) };
    version = 3;
  }

  // v3 → v4: (no-op, pass through)
  if (version <= 3) {
    result.featureBindings = { ...defaultBindings, ...(result.featureBindings || {}) };
    version = 4;
  }

  // v4/v5 → v6: Convert featureBindings from string to string[] (multi-select)
  if (version <= 5) {
    const oldBindings = result.featureBindings || {};
    const newBindings: FeatureBindings = { ...defaultBindings };

    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key as AIFeature;
      if (typeof value === 'string' && value) {
        newBindings[feature] = [value];
        console.log(`[APIConfig] v5→v6: Migrated ${feature}: "${value}" -> ["${value}"]`);
      } else if (Array.isArray(value)) {
        newBindings[feature] = value;
      } else {
        newBindings[feature] = null;
      }
    }

    result.featureBindings = newBindings;
    console.log(`[APIConfig] v5→v6: Migrated featureBindings to multi-select format`);
    version = 6;
  }

  // v6 → v7: Remove deprecated providers (dik3, nanohajimi, apimart, zhipu)
  if (version <= 6) {
    const DEPRECATED_PLATFORMS = ['dik3', 'nanohajimi', 'apimart', 'zhipu'];
    const oldProviders: IProvider[] = result.providers || [];
    const cleanedProviders = oldProviders.filter(
      (p: IProvider) => !DEPRECATED_PLATFORMS.includes(p.platform)
    );
    const removedCount = oldProviders.length - cleanedProviders.length;
    if (removedCount > 0) {
      console.log(`[APIConfig] v6→v7: Removed ${removedCount} deprecated providers`);
    }

    const oldBindings = result.featureBindings || {};
    const cleanedBindings: FeatureBindings = { ...defaultBindings };
    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key as AIFeature;
      if (Array.isArray(value)) {
        const filtered = value.filter(
          (b: string) => !DEPRECATED_PLATFORMS.some((dp) => b.startsWith(dp + ':'))
        );
        cleanedBindings[feature] = filtered.length > 0 ? filtered : null;
      } else {
        cleanedBindings[feature] = null;
      }
    }

    result.providers = cleanedProviders;
    result.featureBindings = cleanedBindings;
    version = 7;
  }

  // v7 → v8: (no-op, pass through)
  if (version <= 7) {
    version = 8;
  }

  // v8 → v9: Convert platform:model bindings to id:model format
  if (version <= 8) {
    const providers: IProvider[] = result.providers || [];
    const oldBindings = result.featureBindings || {};
    const newBindings: FeatureBindings = { ...defaultBindings };
    let convertedCount = 0;
    let removedCount = 0;

    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key as AIFeature;
      if (!Array.isArray(value)) {
        newBindings[feature] = value ? [value as unknown as string] : null;
        continue;
      }
      const converted: string[] = [];
      for (const binding of value) {
        const idx = binding.indexOf(':');
        if (idx <= 0) { converted.push(binding); continue; }
        const platformOrId = binding.slice(0, idx);
        const model = binding.slice(idx + 1);

        if (providers.some(p => p.id === platformOrId)) {
          converted.push(binding);
          continue;
        }

        const matches = providers.filter(p => p.platform === platformOrId);
        if (matches.length === 1) {
          const newBinding = `${matches[0].id}:${model}`;
          converted.push(newBinding);
          convertedCount++;
          console.log(`[APIConfig] v8→v9: Converted binding "${binding}" -> "${newBinding}"`);
        } else if (matches.length > 1) {
          removedCount++;
          console.warn(`[APIConfig] v8→v9: Removed ambiguous binding "${binding}" (${matches.length} providers with platform "${platformOrId}")`);
        } else {
          converted.push(binding);
        }
      }
      newBindings[feature] = converted.length > 0 ? converted : null;
    }

    if (convertedCount > 0 || removedCount > 0) {
      console.log(`[APIConfig] v8→v9: Converted ${convertedCount} bindings, removed ${removedCount} ambiguous`);
    }

    result.featureBindings = newBindings;
    version = 9;
  }

  // v9 → v12: image-host default changes only; handled by resolveImageHostProviders at the end.
  if (version <= 11) {
    version = 12;
  }

  // v12 → v13: Clear stale API metadata caches to force fresh sync on startup
  // This fixes the issue where cached modelEndpointTypes / modelEnableGroups / modelTypes / modelTags
  // from an old version could cause incorrect API routing after an in-place upgrade
  if (version <= 12) {
    console.log(`[APIConfig] v12→v13: Clearing stale API metadata caches (modelEndpointTypes, modelTypes, modelTags, modelEnableGroups, discoveredModelLimits)`);
    result.modelEndpointTypes = {};
    result.modelTypes = {};
    result.modelTags = {};
    result.modelEnableGroups = {};
    result.discoveredModelLimits = {};

    // Backfill missing provider defaults without overwriting user-edited values.
    if (Array.isArray(result.providers)) {
      result.providers = result.providers.map((p: IProvider) => {
        const template = DEFAULT_PROVIDERS.find(t => t.platform === p.platform);
        if (template) {
          const updated = {
            ...p,
            baseUrl: p.baseUrl?.trim() ? p.baseUrl : template.baseUrl,
            name: p.name?.trim() ? p.name : template.name,
          };
          if (updated.baseUrl !== p.baseUrl || updated.name !== p.name) {
            console.log(`[APIConfig] v12→v13: Updated ${p.platform} baseUrl: "${p.baseUrl}" -> "${template.baseUrl}"`);
          }
          return updated;
        }
        return p;
      });
    }

    version = 13;
  }

  // v14-v16 → v17: add the runtime-backed Google Flow provider without
  // changing any existing binding.
  if (version <= 16) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    if (!providers.some((provider: IProvider) => provider.platform === 'googleflow')) {
      const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === 'googleflow');
      if (template) providers.push({ id: generateId(), ...template, apiKey: '' });
    }
    result.providers = providers;
    version = 17;
  }

  // v17 → v18: keep Google Flow as a core provider. Preserve OpenRouter
  // when it has credentials or is bound to a feature, but remove the
  // untouched empty default left by older installations.
  if (version <= 17) {
    let providers: IProvider[] = Array.isArray(result.providers) ? result.providers : [];
    const rawBindings = Object.values(result.featureBindings || {}).flatMap((binding) =>
      Array.isArray(binding) ? binding : typeof binding === 'string' && binding ? [binding] : [],
    );
    const boundProviderIds = new Set(rawBindings.map((binding) => {
      const separator = binding.indexOf(':');
      return separator > 0 ? binding.slice(0, separator) : binding;
    }));

    providers = providers.filter((provider) => !(
      provider.platform === 'openrouter'
      && !provider.apiKey?.trim()
      && provider.name === 'OpenRouter'
      && provider.baseUrl === 'https://openrouter.ai/api/v1'
      && !boundProviderIds.has(provider.id)
    ));

    for (const platform of ['googleflow']) {
      if (!providers.some((provider) => provider.platform === platform)) {
        const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === platform);
        if (template) providers.push({ id: generateId(), ...template, apiKey: '' });
      }
    }
    result.providers = providers;
    version = 18;
  }

  // v18 -> v19: expose stable Google Flow choices instead of
  // mode-specific backend keys. Runtime still resolves i2v/r2v and ratio.
  if (version <= 18) {
    const modelAliases: Record<string, string> = {
      'veo_3_1_i2v_s_fast': 'Veo_3.1-Fast',
      'veo_3_1_r2v_fast': 'Veo_3.1-Fast',
      'veo_3_1_i2v_lite_low_priority': 'Veo_3.1-Lite_Lower_Priority',
      'Veo_3.1-Fast_Lower_Priority': 'Veo_3.1-Lite_Lower_Priority',
    };
    const bindings = result.featureBindings || {};
    for (const [feature, value] of Object.entries(bindings)) {
      const items = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
      const migrated = items.map((binding) => {
        const separator = binding.indexOf(':');
        if (separator < 0) return binding;
        const providerId = binding.slice(0, separator);
        const model = binding.slice(separator + 1);
        return `${providerId}:${modelAliases[model] || model}`;
      });
      (bindings as FeatureBindings)[feature as AIFeature] = migrated.length
        ? Array.from(new Set(migrated))
        : null;
    }
    result.featureBindings = bindings as FeatureBindings;
    version = 19;
  }

  // v19 -> v20: add the Grok video provider backed by the unified logdd extension.
  if (version <= 19) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    if (!providers.some((provider: IProvider) => provider.platform === 'grok')) {
      const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === 'grok');
      if (template) providers.push({ id: generateId(), ...template, apiKey: '' });
    }
    result.providers = providers;
    version = 20;
  }

  // v20 → v21: drop the removed Max Studio provider and any feature
  // bindings that reference it.
  if (version <= 20) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    const removedIds = new Set(
      providers.filter((provider) => provider.platform === 'maxstudio').map((provider) => provider.id),
    );
    if (removedIds.size > 0) {
      result.providers = providers.filter((provider) => provider.platform !== 'maxstudio');
      const bindings = result.featureBindings || {};
      for (const [feature, value] of Object.entries(bindings)) {
        const items = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
        const cleaned = items.filter((binding) => {
          const separator = binding.indexOf(':');
          const providerId = separator > 0 ? binding.slice(0, separator) : binding;
          return !removedIds.has(providerId);
        });
        (bindings as FeatureBindings)[feature as AIFeature] = cleaned.length ? cleaned : null;
      }
      result.featureBindings = bindings as FeatureBindings;
    }
    version = 21;
  }

  // ========== Final normalization (always runs) ==========

  // Ensure all feature binding keys exist and normalize string → string[]
  const finalBindings: FeatureBindings = { ...defaultBindings };
  if (result.featureBindings) {
    for (const [key, value] of Object.entries(result.featureBindings)) {
      const feature = key as AIFeature;
      if (typeof value === 'string' && value) {
        finalBindings[feature] = [value];
      } else if (Array.isArray(value)) {
        finalBindings[feature] = value;
      } else {
        finalBindings[feature] = null;
      }
    }
  }
  result.featureBindings = finalBindings;

  if (Array.isArray(result.providers)) {
    const supportedPlatforms = new Set(['googleflow', 'grok', 'openai', 'openrouter', 'custom']);
    const normalizedProviders: IProvider[] = result.providers
      .filter((provider: IProvider) => supportedPlatforms.has(provider.platform))
      .map((provider: IProvider): IProvider => {
        if (provider.platform === 'googleflow') {
          return {
            ...provider,
            name: 'Google Flow',
            apiKey: '',
            baseUrl: 'local://google-flow',
            model: GOOGLE_FLOW_MODELS,
            capabilities: ['image_generation', 'video_generation'],
          };
        }
        if (provider.platform === 'grok') {
          return {
            ...provider,
            name: 'Grok',
            apiKey: '',
            baseUrl: 'local://grok',
            model: GROK_VIDEO_MODELS,
            capabilities: ['video_generation'],
          };
        }
        return provider;
      })
      .sort((left: IProvider, right: IProvider) => {
        const coreOrder: Record<string, number> = { googleflow: 0, grok: 1 };
        return (coreOrder[left.platform] ?? 2) - (coreOrder[right.platform] ?? 2);
      });
    result.providers = normalizedProviders;
    const providerIds = new Set(normalizedProviders.map((provider) => provider.id));
    for (const feature of Object.keys(finalBindings) as AIFeature[]) {
      const bindings = finalBindings[feature];
      const valid = bindings?.filter((binding) => {
        const separator = binding.indexOf(':');
        const providerId = separator > 0 ? binding.slice(0, separator) : binding;
        return providerIds.has(providerId);
      }) || [];
      finalBindings[feature] = valid.length ? valid : null;
    }
  }

  // Resolve image host providers (handles all legacy formats)
  result.imageHostProviders = resolveImageHostProviders();

  console.log(`[APIConfig] Migration complete: v${version}`);
  return result;
}
