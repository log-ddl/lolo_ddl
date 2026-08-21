import type { ProviderId, ServiceType } from '@/features/video-studio/packages/ai-core';
import type { IProvider } from '@/features/video-studio/lib/api-key-manager';
import type { DiscoveredModelLimits } from '@/features/video-studio/lib/ai/model-registry';
import type { ImageHostProvider } from './image-hosts';

// ==================== AI Feature Types ====================

/**
 * AI feature module types.
 * Each feature can bind one or more API providers.
 */
export type AIFeature =
  | 'script_analysis'       // script analysis
  | 'character_generation'  // character image generation
  | 'scene_generation'      // scene image generation
  | 'video_generation'      // video generation
  | 'image_understanding'   // image understanding/analysis
  | 'chat';                 // general chat

/**
 * Feature binding configuration.
 * Each feature can bind multiple provider/model pairs.
 * Format: providerId:model array, e.g. ['provider-1:anthropic/claude-sonnet-4-6']
 */
export type FeatureBindings = Record<AIFeature, string[] | null>;

/** Feature metadata. */
export const AI_FEATURES: Array<{
  key: AIFeature;
  name: string;
  description: string;
}> = [
  { key: 'script_analysis', name: 'Script Analysis', description: 'Break story text into a structured screenplay' },
  { key: 'character_generation', name: 'Character Generation', description: 'Generate character reference images and outfit variants' },
  { key: 'scene_generation', name: 'Scene Generation', description: 'Generate scene environment reference images' },
  { key: 'video_generation', name: 'Video Generation', description: 'Convert images into video' },
  { key: 'image_understanding', name: 'Image Understanding', description: 'Analyze image content' },
  { key: 'chat', name: 'General Chat', description: 'AI conversation and text generation' },
];

/** Advanced generation options that control video-generation behavior. */
export interface AdvancedGenerationOptions {
  /** Pass the previous shot's end frame into the next shot as reference. */
  enableVisualContinuity: boolean;
  /** Resume batch generation from the last completed position after interruption. */
  enableResumeGeneration: boolean;
  /** Skip moderated content automatically and continue generating other shots. */
  enableContentModeration: boolean;
  /** Use t2v for the first shot and i2v for the remaining shots automatically. */
  enableAutoModelSwitch: boolean;
}

/** Default advanced-generation options. */
export const DEFAULT_ADVANCED_OPTIONS: AdvancedGenerationOptions = {
  enableVisualContinuity: true,
  enableResumeGeneration: true,
  enableContentModeration: true,
  enableAutoModelSwitch: false,
};

export interface APIConfigStatus {
  isAllConfigured: boolean;
  missingKeys: string[];
  friendlyMessage: string;
}

export interface APIConfigState {
  // Provider-based storage (v2)
  providers: IProvider[];

  // Feature bindings - which provider to use for each feature
  featureBindings: FeatureBindings;

  // Legacy: API Keys (v1, for migration)
  apiKeys: Partial<Record<ProviderId, string>>;

  // Aspect ratio preference
  aspectRatio: '16:9' | '9:16';
  orientation: 'landscape' | 'portrait';

  // Advanced generation options
  advancedOptions: AdvancedGenerationOptions;

  // Image host providers (independent mapping)
  imageHostProviders: ImageHostProvider[];

  // Model endpoint types from API sync (model ID -> supported_endpoint_types)
  modelEndpointTypes: Record<string, string[]>;

  // Model metadata from provider API
  // model_name -> model_type: "text" | "image" | "audio-video" | "retrieval"
  modelTypes: Record<string, string>;
  // model_name -> tags: ["chat", "vision", "tools"], etc.
  modelTags: Record<string, string[]>;
  // model_name -> enable_groups: ["official", "pure-AZ", "default"]
  modelEnableGroups: Record<string, string[]>;

  // Discovered model limits (Error-driven Discovery)
  // model_name -> { maxOutput?, contextWindow?, discoveredAt }
  discoveredModelLimits: Record<string, DiscoveredModelLimits>;
}

export interface APIConfigActions {
  // Provider management (v2)
  addProvider: (provider: Omit<IProvider, 'id'>) => IProvider;
  updateProvider: (provider: IProvider) => void;
  removeProvider: (id: string) => void;
  getProviderByPlatform: (platform: string) => IProvider | undefined;
  getProviderById: (id: string) => IProvider | undefined;
  syncProviderModels: (providerId: string) => Promise<{ success: boolean; count: number; error?: string }>;

  // Feature binding management (multi-select)
  setFeatureBindings: (feature: AIFeature, bindings: string[] | null) => void;
  toggleFeatureBinding: (feature: AIFeature, binding: string) => void;
  getFeatureBindings: (feature: AIFeature) => string[];
  getProvidersForFeature: (feature: AIFeature) => Array<{ provider: IProvider; model: string }>;
  isFeatureConfigured: (feature: AIFeature) => boolean;
  // Legacy single-select compat (deprecated)
  setFeatureBinding: (feature: AIFeature, providerId: string | null) => void;
  getFeatureBinding: (feature: AIFeature) => string | null;
  getProviderForFeature: (feature: AIFeature) => IProvider | undefined;

  // Legacy API Key management (v1 compat)
  setApiKey: (provider: ProviderId, key: string) => void;
  getApiKey: (provider: ProviderId) => string;
  clearApiKey: (provider: ProviderId) => void;
  clearAllApiKeys: () => void;

  // Aspect ratio
  setAspectRatio: (ratio: '16:9' | '9:16') => void;
  toggleOrientation: () => void;

  // Advanced generation options
  setAdvancedOption: <K extends keyof AdvancedGenerationOptions>(key: K, value: AdvancedGenerationOptions[K]) => void;
  resetAdvancedOptions: () => void;

  // Image host provider management
  addImageHostProvider: (provider: Omit<ImageHostProvider, 'id'>) => ImageHostProvider;
  updateImageHostProvider: (provider: ImageHostProvider) => void;
  removeImageHostProvider: (id: string) => void;
  getImageHostProviderById: (id: string) => ImageHostProvider | undefined;
  getEnabledImageHostProviders: () => ImageHostProvider[];
  isImageHostConfigured: () => boolean;

  // Validation
  isConfigured: (provider: ProviderId) => boolean;
  isPlatformConfigured: (platform: string) => boolean;
  checkRequiredKeys: (services: ServiceType[]) => APIConfigStatus;
  checkChatKeys: () => APIConfigStatus;
  checkVideoGenerationKeys: () => APIConfigStatus;

  // Display helpers
  maskApiKey: (key: string) => string;
  getAllConfigs: () => { provider: ProviderId; configured: boolean; masked: string }[];

  // Model limits discovery
  getDiscoveredModelLimits: (model: string) => DiscoveredModelLimits | undefined;
  setDiscoveredModelLimits: (model: string, limits: Partial<DiscoveredModelLimits>) => void;
}

export type APIConfigStore = APIConfigState & APIConfigActions;

/** Default feature bindings (all unbound). */
export const DEFAULT_FEATURE_BINDINGS: FeatureBindings = {
  script_analysis: null,
  character_generation: null,
  scene_generation: null,
  video_generation: null,
  image_understanding: null,
  chat: null,
};

/** Provider metadata mapping. */
export const PROVIDER_INFO: Record<ProviderId, { name: string; services: ServiceType[] }> = {
  googleflow: { name: 'Google Flow', services: ['image', 'video'] },
  grok: { name: 'Grok', services: ['video'] },
  openai: { name: 'OpenAI', services: [] },
  openrouter: { name: 'OpenRouter', services: ['chat', 'vision'] },
  custom: { name: 'Custom', services: [] },
};
