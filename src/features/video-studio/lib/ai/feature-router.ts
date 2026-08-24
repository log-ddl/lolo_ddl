/**
 * AI Feature Router
 * Routes AI requests to the bound provider based on feature bindings
 * 
 * v2: supports multi-model bindings and polling-based scheduling
 * 
 * Usage:
 *   const config = getFeatureConfig('character_generation');
 *   if (!config) {
 *     toast.error('Please configure an API provider for character generation in settings first');
 *     return;
 *   }
 *   // Use config.apiKey and config.provider in API call
 */

import { useAPIConfigStore, type AIFeature, type IProvider, AI_FEATURES } from '@/features/video-studio/stores/api-config-store';
import { parseApiKeys, getProviderKeyManager, ApiKeyManager, getRuntimeProviderModels } from '@/features/video-studio/lib/api-key-manager';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { getCliProviderPlatform, isCliFeatureEnabled, isCliProvider, runCliTextCompletion } from '@/features/video-studio/lib/cli-runtime';

function formatCliLogBlock(label: string, value: string, max = 4000): string {
  const text = value || '';
  const suffix = text.length > max ? `\n... [truncated ${text.length - max} chars]` : '';
  return `[CLI] ${label} (${text.length} chars)\n${text.slice(0, max)}${suffix}`;
}

export interface FeatureConfig {
  feature: AIFeature;
  featureName: string;
  provider: IProvider;
  apiKey: string;
  allApiKeys: string[]; // All available API keys
  keyManager: ApiKeyManager; // For key rotation
  platform: string;
  baseUrl: string;
  models: string[];
  model: string; // Currently selected model
}

// Round-robin scheduler for multi-model features.
const featureRoundRobinIndex: Map<AIFeature, number> = new Map();

/**
 * Default mapping for features to platforms (fallback when not explicitly bound)
 */
const FEATURE_PLATFORM_MAP: Partial<Record<AIFeature, string>> = {
  script_analysis: 'openrouter',
  character_generation: 'googleflow',
  scene_generation: 'googleflow',
  video_generation: 'googleflow',
  image_understanding: 'openrouter',
  chat: 'openrouter',
};

/**
 * Default model mapping used when the provider does not explicitly bind a model.
 * This is only used in fallback paths, after explicit user bindings.
 */
const FEATURE_DEFAULT_MODEL: Partial<Record<AIFeature, Record<string, string>>> = {
  character_generation: {
    googleflow: 'GEM_PIX_2',
  },
  scene_generation: {
    googleflow: 'GEM_PIX_2',
  },
  image_understanding: {
    openrouter: 'anthropic/claude-sonnet-4-6',
  },
  video_generation: {
    googleflow: 'Veo_3.1-Fast',
    grok: 'Grok Imagine Video',
  },
};

function isBrowserRuntimePlatform(platform: string): boolean {
  return platform === 'googleflow' || platform === 'grok';
}

function getFeatureProviderKeys(provider: IProvider): string[] {
  if (isBrowserRuntimePlatform(provider.platform)) {
    return ['__local_runtime__'];
  }
  return parseApiKeys(provider.apiKey);
}

function getCliFeatureConfig(feature: AIFeature): FeatureConfig | null {
  if (!isCliFeatureEnabled(feature)) {
    return null;
  }

  const cliRuntime = useVideoStudioSettingsStore.getState().cliRuntime;
  const featureInfo = AI_FEATURES.find((f) => f.key === feature);
  const platform = getCliProviderPlatform(cliRuntime.adapter);
  const model = cliRuntime.model?.trim() || '';
  const provider: IProvider = {
    id: `__${platform}`,
    platform,
    name: cliRuntime.adapter === 'claude' ? 'Claude CLI' : 'OpenCode CLI',
    baseUrl: 'cli://local',
    apiKey: '',
    model: model ? [model] : [],
    capabilities: ['text'],
  };

  return {
    feature,
    featureName: featureInfo?.name || feature,
    provider,
    apiKey: '',
    allApiKeys: [],
    keyManager: new ApiKeyManager(''),
    platform,
    baseUrl: provider.baseUrl,
    models: provider.model,
    model,
  };
}


/**
 * Get all available configurations for a feature, including multi-model bindings.
 */
function getAllFeatureConfigs(feature: AIFeature): FeatureConfig[] {
  const cliConfig = getCliFeatureConfig(feature);
  if (cliConfig) {
    return [cliConfig];
  }

  const store = useAPIConfigStore.getState();
  const providersWithModels = store.getProvidersForFeature(feature);
  const featureInfo = AI_FEATURES.find(f => f.key === feature);
  
  const configs: FeatureConfig[] = [];
  
  for (const { provider, model } of providersWithModels) {
    const keys = getFeatureProviderKeys(provider);
    if (keys.length === 0) continue;
    
    const scopeKey = `${feature}:${model || 'default'}`;
    const keyManager = isBrowserRuntimePlatform(provider.platform)
      ? new ApiKeyManager('')
      : getProviderKeyManager(provider.id, provider.apiKey, scopeKey);
    
    configs.push({
      feature,
      featureName: featureInfo?.name || feature,
      provider,
      apiKey: isBrowserRuntimePlatform(provider.platform) ? '' : keyManager.getCurrentKey() || keys[0],
      allApiKeys: keys,
      keyManager,
      platform: provider.platform,
      baseUrl: provider.baseUrl,
      models: [model],
      model,
    });
  }
  
  return configs;
}

/**
 * Get configuration for an AI feature (with round-robin for multi-model)
 * Returns null if feature is not configured (no provider bound or no API key)
 * 
 * v2 supports multi-model round-robin selection.
 */
export function getFeatureConfig(feature: AIFeature): FeatureConfig | null {
  const cliConfig = getCliFeatureConfig(feature);
  if (cliConfig) {
    return cliConfig;
  }

  const configs = getAllFeatureConfigs(feature);
  
  if (configs.length === 0) {
    const store = useAPIConfigStore.getState();

    // Runtime-backed Google Flow does not persist an API key. Resolve an
    // explicit binding directly so a temporarily disconnected extension is
    // reported as a connection problem instead of a missing-provider problem.
    for (const binding of store.getFeatureBindings(feature)) {
      const separator = binding.indexOf(':');
      if (separator <= 0) continue;
      const providerIdOrPlatform = binding.slice(0, separator);
      const model = binding.slice(separator + 1);
      const provider = store.providers.find((item) => item.id === providerIdOrPlatform)
        || store.providers.find((item) => item.platform === providerIdOrPlatform);
      if (!provider || !isBrowserRuntimePlatform(provider.platform)) continue;
      // Model list comes from code for these platforms; a persisted provider can be stale.
      const knownModels = getRuntimeProviderModels(provider.platform) || provider.model;
      if (!knownModels.includes(model)) continue;
      const featureInfo = AI_FEATURES.find((item) => item.key === feature);
      return {
        feature,
        featureName: featureInfo?.name || feature,
        provider,
        apiKey: '',
        allApiKeys: ['__local_runtime__'],
        keyManager: new ApiKeyManager(''),
        platform: provider.platform,
        baseUrl: provider.baseUrl,
        models: [model],
        model,
      };
    }

    // Fallback: try the default platform mapping.
    const defaultPlatform = FEATURE_PLATFORM_MAP[feature];
    if (defaultPlatform) {
      const mediaFeature = feature === 'character_generation' || feature === 'scene_generation' || feature === 'video_generation';
      const provider = store.providers.find(p => p.platform === defaultPlatform)
        || (mediaFeature ? store.providers.find(p => isBrowserRuntimePlatform(p.platform)) : undefined);
      if (provider) {
        const keys = getFeatureProviderKeys(provider);
        if (keys.length > 0) {
          const fallbackModel = FEATURE_DEFAULT_MODEL[feature]?.[provider.platform] || provider.model?.[0] || '';
          const scopeKey = `${feature}:${fallbackModel || 'default'}`;
          const keyManager = isBrowserRuntimePlatform(provider.platform)
            ? new ApiKeyManager('')
            : getProviderKeyManager(provider.id, provider.apiKey, scopeKey);
          const featureInfo = AI_FEATURES.find(f => f.key === feature);
          // Prefer the feature default model, then fall back to the provider's first model.
          const defaultModel = FEATURE_DEFAULT_MODEL[feature]?.[provider.platform];
          const model = defaultModel || provider.model?.[0] || '';
          return {
            feature,
            featureName: featureInfo?.name || feature,
            provider,
            apiKey: isBrowserRuntimePlatform(provider.platform) ? '' : keyManager.getCurrentKey() || keys[0],
            allApiKeys: keys,
            keyManager,
            platform: provider.platform,
            baseUrl: provider.baseUrl,
            models: provider.model || [],
            model,
          };
        }
      }
    }
    if (feature === 'script_analysis') {
      const chatConfig = getFeatureConfig('chat');
      if (chatConfig) {
        const featureInfo = AI_FEATURES.find(f => f.key === feature);
        return {
          ...chatConfig,
          feature,
          featureName: featureInfo?.name || feature,
        };
      }
    }

    console.warn(`[FeatureRouter] No provider bound for feature: ${feature}`);
    return null;
  }
  
  // Return immediately when there is only one model.
  if (configs.length === 1) {
    return configs[0];
  }
  
  // Round-robin across multiple models.
  const currentIndex = featureRoundRobinIndex.get(feature) || 0;
  const config = configs[currentIndex % configs.length];
  
  // Advance the index for the next call.
  featureRoundRobinIndex.set(feature, currentIndex + 1);
  
  console.log(`[FeatureRouter] Multi-model rotation: ${feature} -> ${config.provider.name}:${config.model} (${currentIndex % configs.length + 1}/${configs.length})`);
  
  return config;
}

/**
 * Get error message for unconfigured feature
 */
export function getFeatureNotConfiguredMessage(feature: AIFeature): string {
  const featureInfo = AI_FEATURES.find(f => f.key === feature);
  const featureName = featureInfo?.name || feature;
  return `Hãy chọn nhà cung cấp và mô hình cho “${featureName}” trong phần cài đặt trước.`;
}

// ==================== Unified API Entry ====================

import { callChatAPI } from '@/features/video-studio/lib/script/script-parser';
import { taskMetadata } from '@/shared/task-metadata';

export interface CallFeatureAPIOptions {
  /** Custom temperature, default 0.7 */
  temperature?: number;
  /** Custom max output tokens, default 4096. Reasoning models often need a higher value. */
  maxTokens?: number;
  /** Force a specific model override. Usually not needed. */
  modelOverride?: string;
  /** Force a specific config object, useful for batched scheduling. */
  configOverride?: FeatureConfig;
  /** Disable deeper reasoning mode for reasoning models such as GLM-4.7/4.5. Default true. */
  disableThinking?: boolean;
  /** Optional UI/debug log sink for CLI requests. */
  onCliLog?: (message: string) => void;
}

/**
 * Unified AI call entry that resolves config automatically from the service map.
 *
 * v2 supports multi-model round-robin selection.
 *
 * Usage:
 *   const result = await callFeatureAPI('script_analysis', systemPrompt, userPrompt);
 * 
 * apiKey, baseUrl, and model are resolved automatically from the feature mapping.
 */
export async function callFeatureAPI(
  feature: AIFeature,
  systemPrompt: string,
  userPrompt: string,
  options?: CallFeatureAPIOptions
): Promise<string> {
  // Use the provided config override or resolve one via round-robin.
  const config = options?.configOverride || getFeatureConfig(feature);
  
  if (!config) {
    throw new Error(getFeatureNotConfiguredMessage(feature));
  }
  
  // Resolve the model from feature config.
  const model = options?.modelOverride || config.model || config.models?.[0];
  const metadataTaskId = crypto.randomUUID();
  const beginMetadata = () => taskMetadata.begin({
    id: metadataTaskId,
    kind: feature === 'script_analysis' ? 'script' : 'other',
    status: 'queued',
    title: config.featureName,
    provider: config.provider.name || config.platform,
    model,
    prompt: `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${userPrompt}`,
    queuedAt: Date.now(),
    details: { feature, temperature: options?.temperature, maxTokens: options?.maxTokens },
  });
  if (isCliProvider(config.platform)) {
    beginMetadata();
    options?.onCliLog?.(`[CLI] Request start feature=${feature} provider=${config.platform} model=${model || '(default)'} session=${feature}`);
    options?.onCliLog?.(formatCliLogBlock('INPUT system prompt', systemPrompt));
    options?.onCliLog?.(formatCliLogBlock('INPUT user prompt', userPrompt));
    try {
      taskMetadata.submitted(metadataTaskId);
      const output = await runCliTextCompletion({
        feature,
        systemPrompt,
        userPrompt,
        model,
        sessionKey: feature,
      });
      options?.onCliLog?.(formatCliLogBlock('OUTPUT response', output, 6000));
      options?.onCliLog?.(`[CLI] Request done feature=${feature} provider=${config.platform} model=${model || '(default)'} session=${feature} output=${output.length} chars`);
      taskMetadata.completed(metadataTaskId, undefined, { responseCharacters: output.length });
      return output;
    } catch (error) {
      options?.onCliLog?.(`[CLI] Request failed session=${feature}: ${error instanceof Error ? error.message : String(error)}`);
      taskMetadata.failed(metadataTaskId, error);
      throw error;
    }
  }

  const baseUrl = config.baseUrl?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('Please configure a Base URL in settings first');
  }
  if (!model) {
    throw new Error('Please configure a model in settings first');
  }
  beginMetadata();
  
  console.log(`[callFeatureAPI] Feature: ${feature}`);
  console.log(`[callFeatureAPI] Provider: ${config.provider.name} (${config.platform})`);
  console.log(`[callFeatureAPI] Model: ${model}`);
  console.log(`[callFeatureAPI] BaseURL: ${baseUrl}`);
  
  // Call the underlying API.
  // Structured JSON output tasks disable deeper reasoning by default to avoid wasting tokens.
  const disableThinking = options?.disableThinking ?? true;
  try {
    taskMetadata.submitted(metadataTaskId);
    const output = await callChatAPI(systemPrompt, userPrompt, {
      apiKey: config.allApiKeys.join(','),
      provider: 'openai',
      baseUrl,
      model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      keyManager: config.keyManager,
      disableThinking,
    });
    taskMetadata.completed(metadataTaskId, undefined, { responseCharacters: output.length });
    return output;
  } catch (error) {
    taskMetadata.failed(metadataTaskId, error);
    throw error;
  }
}
