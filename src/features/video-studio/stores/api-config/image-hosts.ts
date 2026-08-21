import { generateId } from '@/features/video-studio/lib/api-key-manager';

/**
 * Image-host providers: the upload targets used to turn a local image into a
 * public URL for AI providers that only accept remote references.
 */

/** Supported image-host platforms. */
export type ImageHostPlatform = 'scdn' | 'custom';

/** Image-host provider configuration. */
export interface ImageHostProvider {
  id: string;
  platform: ImageHostPlatform;
  name: string;
  baseUrl: string;
  uploadPath: string; // Full URL or relative path
  apiKey: string; // Supports multiple keys (comma/newline separated); optional for guest-upload providers
  enabled: boolean;
  apiKeyParam?: string; // Query parameter name, e.g. key
  apiKeyHeader?: string; // Header name (optional)
  apiKeyFormField?: string; // Form field name that carries the key, e.g. userhash
  apiKeyOptional?: boolean; // Whether guest upload is allowed without a key
  expirationParam?: string; // Expiration parameter name, e.g. expiration
  imageField?: string; // Image field name, defaults to image
  imagePayloadType?: 'base64' | 'file'; // Image payload mode
  nameField?: string; // Name field name, defaults to name
  staticFormFields?: Record<string, string>; // Additional fixed form fields
  responseUrlField?: string; // Response URL path, e.g. data.url
  responseDeleteUrlField?: string; // Response delete URL path
}

/** Image-host presets that are still in active use. */
export const IMAGE_HOST_PRESETS: Omit<ImageHostProvider, 'id' | 'apiKey'>[] = [
  {
    platform: 'scdn',
    name: 'SCDN Image Host',
    baseUrl: 'https://img.scdn.io',
    uploadPath: '/api/v1.php',
    enabled: true,
    apiKeyOptional: true,
    imageField: 'image',
    imagePayloadType: 'file',
    responseUrlField: 'url',
  },
  {
    platform: 'custom',
    name: 'Custom Image Host',
    baseUrl: '',
    uploadPath: '',
    enabled: false,
  },
];

/** Default image hosts created on first launch. All start disabled — user enables manually if needed. */
export const DEFAULT_IMAGE_HOST_PROVIDERS: Omit<ImageHostProvider, 'id' | 'apiKey'>[] =
  IMAGE_HOST_PRESETS.filter((preset) => preset.platform === 'scdn');

const ACTIVE_IMAGE_HOST_PLATFORMS = new Set<ImageHostPlatform>(['scdn', 'custom']);

export function isVisibleImageHostPlatform(platform: string): platform is ImageHostPlatform {
  return ACTIVE_IMAGE_HOST_PLATFORMS.has(platform as ImageHostPlatform);
}

export function isVisibleImageHostProvider(
  provider: Pick<ImageHostProvider, 'platform'>,
): boolean {
  return isVisibleImageHostPlatform(provider.platform);
}

export function findImageHostPreset(
  platform: ImageHostPlatform,
): Omit<ImageHostProvider, 'id' | 'apiKey'> | undefined {
  return IMAGE_HOST_PRESETS.find((preset) => preset.platform === platform);
}

export function createDefaultImageHostProviders(): ImageHostProvider[] {
  return DEFAULT_IMAGE_HOST_PROVIDERS.map((provider) => ({
    ...provider,
    id: generateId(),
    apiKey: '',
  }));
}

type ImageHostProviderDefaults = Partial<Omit<ImageHostProvider, 'id' | 'name' | 'apiKey' | 'enabled'>>;

const IMAGE_HOST_PLATFORM_DEFAULTS: Partial<Record<ImageHostPlatform, ImageHostProviderDefaults>> = {
  scdn: {
    baseUrl: 'https://img.scdn.io',
    uploadPath: '/api/v1.php',
    apiKeyOptional: true,
    imageField: 'image',
    imagePayloadType: 'file',
    responseUrlField: 'url',
  },
};

/** Fills in the fixed protocol fields a known platform requires, keeping user-set URLs. */
export function normalizeImageHostProvider(provider: ImageHostProvider): ImageHostProvider {
  const defaults = IMAGE_HOST_PLATFORM_DEFAULTS[provider.platform];
  if (!defaults) {
    return provider;
  }

  if (provider.platform === 'scdn') {
    return {
      ...provider,
      baseUrl: provider.baseUrl || defaults.baseUrl || '',
      uploadPath: provider.uploadPath || defaults.uploadPath || '',
      apiKeyOptional: true,
      imageField: 'image',
      imagePayloadType: 'file',
      responseUrlField: 'url',
      responseDeleteUrlField: undefined,
    };
  }

  return provider;
}

export function normalizeImageHostProviders(providers: ImageHostProvider[] | undefined | null): ImageHostProvider[] {
  return (providers || []).filter(isVisibleImageHostProvider).map(normalizeImageHostProvider);
}

/** Legacy image-host config used only for migration. */
export interface LegacyImageHostConfig {
  type: ImageHostPlatform | string;
  custom?: {
    uploadUrl: string;
    apiKey: string;
  };
}
