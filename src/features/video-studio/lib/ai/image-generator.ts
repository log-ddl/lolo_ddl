/**
 * Image Generator Service
 * Routes image generation to the configured provider (Google Flow only)
 */

import { getFeatureConfig, getFeatureNotConfiguredMessage } from '@/features/video-studio/lib/ai/feature-router';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { useProjectStore } from '@/features/video-studio/stores/project-store';

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9';
  referenceImages?: string[];
  existingMediaIdsBySource?: Record<string, Record<string, string>>;
  onReferenceMediaIdResolved?: (source: string, mediaId: string, jwtHash: string) => void | Promise<void>;
  styleId?: string;
  preferredJwtHash?: string;
  preferredCredentialId?: string;
  onSubmitted?: (submittedAt?: number) => void;
  signal?: AbortSignal;
}

export interface ImageGenerationResult {
  imageUrl: string;
  taskId?: string;
  mediaId?: string;
  jwtHash?: string;
  credentialId?: string;
  accountId?: string;
  ownerScopeId?: string;
  flowProjectId?: string;
}

/**
 * Core image generation — Google Flow
 */
async function generateImage(
  params: ImageGenerationParams,
  feature: 'character_generation' | 'scene_generation',
): Promise<ImageGenerationResult> {
  const featureConfig = getFeatureConfig(feature);
  if (!featureConfig) throw new Error(getFeatureNotConfiguredMessage(feature));

  if (featureConfig.platform !== 'googleflow') {
    throw new Error(`Unsupported image platform: ${featureConfig.platform}. Only "googleflow" is supported.`);
  }

  const projectId = useProjectStore.getState().activeProjectId || 'default-project';
  const result = await googleFlowProvider.generateImage({
    projectId,
    prompt: params.prompt,
    model: featureConfig.model || featureConfig.models?.[0] || 'GEM_PIX_2',
    aspectRatio: params.aspectRatio || '1:1',
    references: params.referenceImages?.map((source) => ({ source, provider: 'googleflow' })),
    preferredCredentialId: params.preferredCredentialId,
    onSubmitted: params.onSubmitted,
    signal: params.signal,
  });
  const imageUrl = result.localUrl || result.remoteUrl;
  if (!imageUrl) throw new Error('Google Flow returned no image URL');
  return {
    imageUrl, taskId: result.taskId, mediaId: result.mediaId,
    credentialId: result.credentialId, accountId: result.accountId, ownerScopeId: result.ownerScopeId,
    flowProjectId: result.flowProjectId,
  };
}

/**
 * Generate image for character
 */
export async function generateCharacterImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  return generateImage(params, 'character_generation');
}

/**
 * Generate image for scene
 */
export async function generateSceneImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  return generateImage(params, 'scene_generation');
}

/**
 * Submit image generation request.
 * Used by merged generation and quad grid in director and scene panels.
 */
export async function submitGridImageRequest(params: {
  model: string;
  prompt: string;
  apiKey: string;
  baseUrl: string;
  platform?: string;
  aspectRatio: string;
  referenceImages?: string[];
  referenceMediaHints?: Record<string, { mediaId: string; ownerScopeId: string; flowProjectId?: string }>;
  preferredCredentialId?: string;
  taskId?: string;
  onSubmitted?: (submittedAt?: number) => void;
  signal?: AbortSignal;
}): Promise<{ imageUrl?: string; taskId?: string; mediaId?: string; jwtHash?: string; credentialId?: string; accountId?: string; ownerScopeId?: string; flowProjectId?: string }> {
  const { model, prompt, aspectRatio, referenceImages, onSubmitted, signal } = params;

  if (params.platform !== 'googleflow') {
    throw new Error(`Unsupported image platform: ${params.platform}. Only "googleflow" is supported.`);
  }

  const projectId = useProjectStore.getState().activeProjectId || 'default-project';
  const result = await googleFlowProvider.generateImage({
    projectId,
    prompt,
    model,
    aspectRatio,
    references: referenceImages?.map((source) => {
      const hint = params.referenceMediaHints?.[source];
      return hint
        ? { source, provider: 'googleflow' as const, mediaId: hint.mediaId, ownerScopeId: hint.ownerScopeId, flowProjectId: hint.flowProjectId }
        : { source, provider: 'googleflow' as const };
    }),
    preferredCredentialId: params.preferredCredentialId,
    taskId: params.taskId,
    onSubmitted,
    signal,
  });
  return {
    imageUrl: result.localUrl || result.remoteUrl,
    taskId: result.taskId,
    mediaId: result.mediaId,
    credentialId: result.credentialId,
    accountId: result.accountId,
    ownerScopeId: result.ownerScopeId,
    flowProjectId: result.flowProjectId,
  };
}

/**
 * Convert image URL to persistent format.
 * In Electron: saves to local file system and returns local-image:// path.
 * In browser: converts to base64.
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:image/') || url.startsWith('local-image://')) return url;

  if (typeof window !== 'undefined' && window.imageStorage) {
    try {
      const filename = `image_${Date.now()}.png`;
      const result = await window.imageStorage.saveImage(url, 'shots', filename);
      if (result.success && result.localPath) return result.localPath;
    } catch (error) {
      console.warn('[ImageGenerator] Local save failed, falling back to base64:', error);
    }
  }

  const convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) return await convertBlobToBase64(await response.blob());
  } catch (error) {
    console.warn('[ImageGenerator] Direct fetch failed:', error);
  }

  throw new Error(`Failed to convert image URL to base64: ${url}`);
}
