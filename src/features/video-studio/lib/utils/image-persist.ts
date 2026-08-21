/**
 * Image Persist Utility
 * Saves scene images to local storage and optionally uploads to image host.
 * Eliminates base64 data from Zustand state persistence.
 */

import { saveImageToLocal, type ImageCategory } from '@/features/video-studio/lib/image-storage';
import { isIdbImagePath } from '@/features/video-studio/lib/browser-image-storage';
import { uploadToImageHost, isImageHostConfigured } from '@/features/video-studio/lib/image-host';

export interface PersistResult {
  /** local-image:// path for state storage */
  localPath: string;
  /** HTTP URL from image host (null if not configured or upload failed) */
  httpUrl: string | null;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
};

function getImageExtension(imageData: string): string {
  const dataMime = imageData.match(/^data:([^;,]+)/)?.[1]?.toLowerCase();
  if (dataMime && MIME_EXTENSIONS[dataMime]) {
    return MIME_EXTENSIONS[dataMime];
  }

  const cleanSource = imageData.split(/[?#]/)[0] || '';
  const sourceExtension = cleanSource.match(/\.([a-z0-9]{2,8})$/i)?.[1]?.toLowerCase();
  if (sourceExtension && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'avif'].includes(sourceExtension)) {
    return sourceExtension === 'jpeg' ? 'jpg' : sourceExtension;
  }

  return 'png';
}

/**
 * Persist a scene image: save to local filesystem + optionally upload to image host.
 *
 * Input can be:
 * - base64 data URI (data:image/...)
 * - HTTP URL (will be downloaded then saved locally)
 * - local-image:// (already persisted, skip save)
 * - file:// or absolute local path (copied into app storage in Electron)
 *
 * @param imageData - The image data (base64 / URL / local-image:// / local path)
 * @param sceneId - Scene index for filename generation
 * @param frameType - 'first' for main image, 'end' for end-frame image
 * @param category - Storage category, defaults to 'shots'
 */
export async function persistSceneImage(
  imageData: string,
  sceneId: number,
  frameType: 'first' | 'end' = 'first',
  category: ImageCategory = 'shots'
): Promise<PersistResult> {
  // Already persisted locally — skip saving
  if (imageData.startsWith('local-image://') || isIdbImagePath(imageData)) {
    return { localPath: imageData, httpUrl: null };
  }

  // Empty or invalid
  if (!imageData) {
    return { localPath: '', httpUrl: null };
  }

  const timestamp = Date.now();
  const filename = `scene_${sceneId}_${frameType}_${timestamp}.${getImageExtension(imageData)}`;

  // Save to local filesystem (returns local-image:// or original URL as fallback)
  const localPath = await saveImageToLocal(imageData, category, filename);

  // Optionally upload to image host (non-blocking, best-effort)
  let httpUrl: string | null = null;
  if (isImageHostConfigured()) {
    try {
      const result = await uploadToImageHost(imageData, {
        name: filename,
        expiration: 15552000, // 180 days
      });
      if (result.success && result.url) {
        httpUrl = result.url;
      }
    } catch (error) {
      console.warn('[persistSceneImage] Image host upload failed:', error);
    }
  }

  return { localPath, httpUrl };
}

/**
 * Persist a reference image (e.g. scene reference, wardrobe reference).
 * Thin wrapper with 'scenes' as default category.
 */
export async function persistReferenceImage(
  imageData: string,
  label: string,
  category: ImageCategory = 'scenes'
): Promise<PersistResult> {
  if (imageData.startsWith('local-image://') || isIdbImagePath(imageData)) {
    return { localPath: imageData, httpUrl: null };
  }

  if (!imageData) {
    return { localPath: '', httpUrl: null };
  }

  const timestamp = Date.now();
  const filename = `ref_${label}_${timestamp}.${getImageExtension(imageData)}`;

  const localPath = await saveImageToLocal(imageData, category, filename);

  let httpUrl: string | null = null;
  if (isImageHostConfigured()) {
    try {
      const result = await uploadToImageHost(imageData, {
        name: filename,
        expiration: 15552000,
      });
      if (result.success && result.url) {
        httpUrl = result.url;
      }
    } catch (error) {
      console.warn('[persistReferenceImage] Image host upload failed:', error);
    }
  }

  return { localPath, httpUrl };
}
