/**
 * API Key Manager with rotation and blacklist support
 * Based on AionUi's ApiKeyManager pattern
 */

// ==================== Types ====================

export type ModelCapability = 
  | 'text' 
  | 'vision' 
  | 'function_calling' 
  | 'image_generation' 
  | 'video_generation'
  | 'web_search' 
  | 'reasoning' 
  | 'embedding';

export interface IProvider {
  id: string;
  platform: string;
  name: string;
  baseUrl: string;
  apiKey: string; // Supports comma or newline separated multiple keys
  model: string[];
  capabilities?: ModelCapability[];
  contextLimit?: number;
}

export const GOOGLE_FLOW_IMAGE_MODELS = ['GEM_PIX_2', 'NARWHAL'];
export const GOOGLE_FLOW_VIDEO_MODELS = [
  'Veo_3.1-Fast',
  'Veo_3.1-Lite',
  'Veo_3.1-Lite_Lower_Priority',
];
export const GOOGLE_FLOW_MODELS = [...GOOGLE_FLOW_IMAGE_MODELS, ...GOOGLE_FLOW_VIDEO_MODELS];
export const GROK_VIDEO_MODELS = ['Grok Imagine Video'];

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  GEM_PIX_2: 'Google Nano Banana Pro',
  NARWHAL: 'Nano Banana 2',
  'Veo_3.1-Fast': 'Veo 3.1 Fast',
  'Veo_3.1-Lite': 'Veo 3.1 Lite',
  'Veo_3.1-Lite_Lower_Priority': 'Veo 3.1 Lite – Lower Priority',
};

/** UI-only model label. Internal model ids sent to providers stay unchanged. */
export function getModelDisplayName(model: string): string {
  return MODEL_DISPLAY_NAMES[model] || model;
}

/**
 * Default provider templates.
 *
 * Core providers shown on a fresh Video Studio install.
 * Other providers (OpenRouter and custom endpoints) can still be added manually.
 */
export const DEFAULT_PROVIDERS: Omit<IProvider, 'id' | 'apiKey'>[] = [
  {
    platform: 'googleflow',
    name: 'Google Flow',
    baseUrl: 'local://google-flow',
    model: GOOGLE_FLOW_MODELS,
    capabilities: ['image_generation', 'video_generation'],
  },
  {
    platform: 'grok',
    name: 'Grok',
    baseUrl: 'local://grok',
    model: GROK_VIDEO_MODELS,
    capabilities: ['video_generation'],
  },
];

// ==================== Model Classification ====================

/**
 * Infer model capabilities from model-name patterns.
 * Used to auto-classify the dynamically synced 552+ models.
 */
export function classifyModelByName(modelName: string): ModelCapability[] {
  const name = modelName.toLowerCase();

  // ---- Video generation models ----
  const videoPatterns = [
    'veo', 'sora', 'wan', 'kling', 'runway', 'luma', 'seedance',
    'cogvideo', 'hunyuan-video', 'minimax-video', 'hailuo', 'pika',
    'gen-3', 'gen3', 'mochi', 'ltx',
  ];
  // Exact match: grok-video style models
  if (/grok.*video/.test(name)) return ['video_generation'];
  if (videoPatterns.some(p => name.includes(p))) return ['video_generation'];

  // ---- Image generation models ----
  const imageGenPatterns = [
    'dall-e', 'dalle', 'flux', 'midjourney', 'niji', 'imagen', 'cogview',
    'gpt-image', 'ideogram', 'sd3', 'stable-diffusion', 'sdxl',
    'playground', 'recraft', 'kolors', 'seedream',
  ];
  if (imageGenPatterns.some(p => name.includes(p))) return ['image_generation'];
  // "xxx-image-preview" family, e.g. gemini-3-pro-image-preview
  if (/image[- ]?preview/.test(name)) return ['image_generation'];

  // ---- Vision / image-understanding models ----
  if (/vision/.test(name)) return ['text', 'vision'];

  // ---- TTS / audio models (kept under text for now) ----
  if (/tts|whisper|audio/.test(name)) return ['text'];

  // ---- Embedding models ----
  if (/embed/.test(name)) return ['embedding'];

  // ---- Reasoning / thinking models (still classified under text) ----
  if (/[- ](r1|thinking|reasoner|reason)/.test(name) || /^o[1-9]/.test(name)) return ['text', 'reasoning'];

  // ---- Default: chat models ----
  return ['text'];
}

// ==================== Endpoint Routing ====================

/**
 * Model API format.
 * Based on the supported_endpoint_types field returned by OpenAI-compatible providers from /v1/models.
 */
export type ModelApiFormat =
  | 'openai_chat'        // /v1/chat/completions (text/chat, also used for some Gemini image generation)
  | 'openai_images'      // /v1/images/generations (standard image generation)
  | 'openai_video'       // /v1/videos/generations (standard video generation)
  | 'kling_image'        // /kling/v1/images/generations or /kling/v1/images/omni-image
  | 'unsupported';       // Unsupported endpoint format

// Map supported_endpoint_types values to the image API format we use.
const IMAGE_ENDPOINT_MAP: Record<string, ModelApiFormat> = {
  'image-generation': 'openai_images',
  'dall-e-3': 'openai_images',  // e.g. z-image-turbo, qwen-image-max use /v1/images/generations
  'aigc-image': 'openai_images', // e.g. aigc-image-gem, aigc-image-qwen
  'openai': 'openai_chat',  // e.g. gpt-image-1-all uses chat completions for image generation
};

// Map supported_endpoint_types values to our video-generation capability bucket.
// Note: these all map to 'openai_video' only to indicate video capability;
// the actual route is chosen by VIDEO_FORMAT_MAP in use-video-generation.ts.
const VIDEO_ENDPOINT_MAP: Record<string, ModelApiFormat> = {
  'unified-video-format': 'openai_video',
  'openai-video-format': 'openai_video',
  'openai-official-video-format': 'openai_video',
  'async': 'openai_video',            // wan family
  'doubao-video-async': 'openai_video',    // doubao-seedance family
  'grok-video': 'openai_video',          // grok-video
  'text-to-video': 'openai_video',          // kling text-to-video
  'image-to-video': 'openai_video',          // kling image-to-video
  'video-extension': 'openai_video',          // kling video extension
  'hailuo-video-generation': 'openai_video',    // MiniMax-Hailuo
  'luma-video-generation': 'openai_video',     // luma_video_api
  'luma-video-extension': 'openai_video',     // luma_video_extend
  'runway-image-to-video': 'openai_video',   // runwayml image-to-video
  'aigc-video': 'openai_video',       // aigc-video-hailuo/kling/vidu
  'minimax/video-01-async': 'openai_video', // minimax/video-01
  'openai-response': 'openai_video',  // e.g. veo3-pro
};

/**
 * Determine the image-generation API format from supported_endpoint_types.
 * Fall back to model-name heuristics when endpoint metadata is unavailable.
 */
export function resolveImageApiFormat(endpointTypes: string[] | undefined, modelName?: string): ModelApiFormat {
  // 1. Use endpoint metadata returned by the API.
  if (endpointTypes && endpointTypes.length > 0) {
    // Prefer image-generation endpoints first.
    for (const t of endpointTypes) {
      if (IMAGE_ENDPOINT_MAP[t] === 'openai_images') return 'openai_images';
    }
    // Then try chat completions (for Gemini multimodal image generation).
    for (const t of endpointTypes) {
      if (IMAGE_ENDPOINT_MAP[t] === 'openai_chat') return 'openai_chat';
    }
    return 'unsupported';
  }

  // 2. Fallback: infer the API format from the model name.
  if (modelName) {
    const name = modelName.toLowerCase();
    // Kling image models -> native /kling/v1/images/* endpoint
    if (/^kling-(image|omni-image)$/i.test(name)) {
      return 'kling_image';
    }
    // Gemini image models -> chat-completions multimodal flow
    if (name.includes('gemini') && (name.includes('image') || name.includes('imagen'))) {
      return 'openai_chat';
    }
    // GPT image, flux, DALL-E, Ideogram, SD, Recraft -> standard images API
    if (/gpt-image|flux|dall-e|dalle|ideogram|stable-diffusion|sdxl|sd3|recraft|kolors|cogview/.test(name)) {
      return 'openai_images';
    }
    // sora_image -> OpenAI chat
    if (name.includes('sora') && name.includes('image')) {
      return 'openai_chat';
    }
  }

  return 'openai_images'; // ultimate fallback
}

/**
 * Determine the video-generation API format from supported_endpoint_types.
 */
export function resolveVideoApiFormat(endpointTypes: string[] | undefined): ModelApiFormat {
  if (!endpointTypes || endpointTypes.length === 0) return 'openai_video'; // fallback
  for (const t of endpointTypes) {
    const mapped = VIDEO_ENDPOINT_MAP[t];
    if (mapped) return mapped;
  }
  // If an OpenAI-style endpoint is present, also try the video endpoint.
  if (endpointTypes.includes('openai')) return 'openai_video';
  return 'unsupported';
}

// ==================== Utilities ====================

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Parse API keys from a string (comma or newline separated)
 */
export function parseApiKeys(apiKey: string): string[] {
  if (!apiKey) return [];
  return apiKey
    .split(/[,\n]/)
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

export function getProviderCredentialCount(platform: string, apiKey: string): number {
  if (platform === 'googleflow' || platform === 'grok') return 0;
  return parseApiKeys(apiKey).length;
}

export function isProviderCredentialConfigured(platform: string, apiKey: string): boolean {
  // Google Flow is backed by the local Electron/extension runtime. Readiness is
  // checked when the task is submitted; it intentionally has no persisted key.
  if (platform === 'googleflow' || platform === 'grok') return true;
  return parseApiKeys(apiKey).length > 0;
}

/**
 * Get the count of API keys
 */
export function getApiKeyCount(apiKey: string): number {
  return parseApiKeys(apiKey).length;
}

/**
 * Mask an API key for display
 */
export function maskApiKey(key: string): string {
  if (!key || key.length === 0) return 'Not set';
  if (key.length <= 10) return `${key.substring(0, 4)}***`;
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

// ==================== ApiKeyManager ====================

interface BlacklistedKey {
  key: string;
  blacklistedAt: number;
  reason?: 'rate_limit' | 'auth' | 'service_unavailable' | 'model_incompatible' | 'unknown';
  durationMs?: number;
}

const BLACKLIST_DURATION_MS = 90 * 1000; // 90 seconds
const MODEL_MISMATCH_BLACKLIST_DURATION_MS = 15 * 1000; // short cooldown for model mismatch

function isModelIncompatibleError(errorText?: string): boolean {
  if (!errorText) return false;
  const text = errorText.toLowerCase();
  return (
    text.includes('not support') ||
    text.includes('unsupported') ||
    text.includes('model') && text.includes('invalid') ||
    text.includes('model') && text.includes('not available') ||
    text.includes('model') && text.includes('unavailable')
  );
}

/**
 * API Key Manager with rotation and blacklist support
 * Manages multiple API keys per provider with automatic rotation on failures
 */
export class ApiKeyManager {
  private keys: string[];
  private currentIndex: number;
  private blacklist: Map<string, BlacklistedKey> = new Map();

  constructor(apiKeyString: string) {
    this.keys = parseApiKeys(apiKeyString);
    // Start with a random index for load balancing
    this.currentIndex = this.keys.length > 0 ? Math.floor(Math.random() * this.keys.length) : 0;
  }

  /**
   * Get the current API key
   */
  getCurrentKey(): string | null {
    this.cleanupBlacklist();
    
    if (this.keys.length === 0) return null;

    // Find a non-blacklisted key starting from current index
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];
      
      if (!this.blacklist.has(key)) {
        this.currentIndex = index;
        return key;
      }
    }

    // All keys are blacklisted, return null or the first key anyway
    return this.keys.length > 0 ? this.keys[0] : null;
  }

  /**
   * Rotate to the next available key
   */
  rotateKey(): string | null {
    this.cleanupBlacklist();
    
    if (this.keys.length <= 1) return this.getCurrentKey();

    // Move to next key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    // Find next non-blacklisted key
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];
      
      if (!this.blacklist.has(key)) {
        this.currentIndex = index;
        return key;
      }
    }

    return this.keys[this.currentIndex];
  }

  /**
   * Mark the current key as failed and blacklist it temporarily
   */
  markCurrentKeyFailed(reason: BlacklistedKey['reason'] = 'unknown', durationMs: number = BLACKLIST_DURATION_MS): void {
    const key = this.keys[this.currentIndex];
    if (key) {
      this.blacklist.set(key, {
        key,
        blacklistedAt: Date.now(),
        reason,
        durationMs,
      });
    }
    this.rotateKey();
  }

  /**
   * Handle API errors and decide whether to rotate
   * Returns true if key was rotated
   */
  handleError(statusCode: number, errorText?: string): boolean {
    if (statusCode === 429) {
      this.markCurrentKeyFailed('rate_limit');
      return true;
    }
    if (statusCode === 401 || statusCode === 403) {
      this.markCurrentKeyFailed('auth');
      return true;
    }
    // Rotate on all 5xx server errors; 500 often indicates a temporary backend issue.
    if (statusCode >= 500) {
      this.markCurrentKeyFailed('service_unavailable');
      return true;
    }

    if (statusCode === 400 && isModelIncompatibleError(errorText)) {
      this.markCurrentKeyFailed('model_incompatible', MODEL_MISMATCH_BLACKLIST_DURATION_MS);
      return true;
    }
    return false;
  }

  /**
   * Get the number of available (non-blacklisted) keys
   */
  getAvailableKeyCount(): number {
    this.cleanupBlacklist();
    return this.keys.filter(k => !this.blacklist.has(k)).length;
  }

  /**
   * Get total key count
   */
  getTotalKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Check if manager has any keys
   */
  hasKeys(): boolean {
    return this.keys.length > 0;
  }

  /**
   * Clean up expired blacklist entries
   */
  private cleanupBlacklist(): void {
    const now = Date.now();
    for (const [key, entry] of this.blacklist.entries()) {
      const ttl = entry.durationMs ?? BLACKLIST_DURATION_MS;
      if (now - entry.blacklistedAt >= ttl) {
        this.blacklist.delete(key);
      }
    }
  }

  /**
   * Reset the manager with new keys
   */
  reset(apiKeyString: string): void {
    this.keys = parseApiKeys(apiKeyString);
    this.currentIndex = this.keys.length > 0 ? Math.floor(Math.random() * this.keys.length) : 0;
    this.blacklist.clear();
  }
}

// ==================== Provider Key Managers ====================

// Global map of ApiKeyManagers per provider
const providerManagers = new Map<string, ApiKeyManager>();

function getScopedProviderKey(providerId: string, scopeKey?: string): string {
  return scopeKey ? `${providerId}::${scopeKey}` : providerId;
}

/**
 * Get or create an ApiKeyManager for a provider
 */
export function getProviderKeyManager(providerId: string, apiKey: string, scopeKey?: string): ApiKeyManager {
  const managerKey = getScopedProviderKey(providerId, scopeKey);
  let manager = providerManagers.get(managerKey);
  
  if (!manager) {
    manager = new ApiKeyManager(apiKey);
    providerManagers.set(managerKey, manager);
  }
  
  return manager;
}

/**
 * Update the keys for a provider's manager
 */
export function updateProviderKeys(providerId: string, apiKey: string, scopeKey?: string): void {
  const managerKey = getScopedProviderKey(providerId, scopeKey);
  const manager = providerManagers.get(managerKey);
  if (manager) {
    manager.reset(apiKey);
  } else {
    providerManagers.set(managerKey, new ApiKeyManager(apiKey));
  }
}

/**
 * Clear all provider managers
 */
export function clearAllManagers(): void {
  providerManagers.clear();
}
