/**
 * Export Service
 * Packages shot assets into a structured folder for external video editors
 */

import type { Shot } from "@/features/video-studio/types/script";
import type { SplitScene } from '@/features/video-studio/stores/director-store';
import { readImageAsBase64 } from '@/features/video-studio/lib/image-storage';

declare global {
  interface Window {
    exportStorage?: {
      writeFiles: (payload: { baseDir: string; files: Array<{ relativePath: string; data: ArrayBuffer } | { relativePath: string; text: string }> }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const EXPORT_ASSET_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = EXPORT_ASSET_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

export type ExportImageSource = 'director' | 'character' | 'scene' | 'autopilot' | 'media';

export type ExportMediaType = 'image' | 'video';

export interface ExportMediaAsset {
  id: string;
  source: ExportImageSource;
  type: ExportMediaType;
  name: string;
  url: string;
}

/**
 * Download a file from any URL type (HTTP, local-image://, data:) as Blob
 */
async function downloadFile(url: string): Promise<Blob> {
  if (!url) throw new Error('Empty URL');

  // local-image:// protocol (Electron local storage) → read via IPC then convert
  if (url.startsWith('local-image://')) {
    const base64 = await withTimeout(
      readImageAsBase64(url),
      `Timed out reading local file: ${url}`
    );
    if (!base64) throw new Error(`Failed to read local file: ${url}`);
    const resp = await fetch(base64);
    return resp.blob();
  }

  // data: URLs
  if (url.startsWith('data:')) {
    const resp = await fetch(url);
    return resp.blob();
  }

  // Standard HTTP(S) fetch
  if (/^https?:\/\//i.test(url)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_ASSET_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Timed out downloading: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }
    return withTimeout(response.blob(), `Timed out reading download: ${url}`);
  }

  // Raw absolute paths — used by final AutoPilot renders (e.g. C:\...\output.mp4).
  const base64 = await withTimeout(
    readImageAsBase64(url),
    `Timed out reading local file: ${url}`,
  );
  if (!base64) throw new Error(`Failed to read local file: ${url}`);
  const localResp = await fetch(base64);
  return localResp.blob();
}

function getShotImageUrl(shot: Shot): string | undefined {
  return shot.imageUrl || shot.keyframes?.find((keyframe) => keyframe.type === 'start')?.imageUrl;
}

function sanitizeImageAssetName(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}

function getImageExtension(blob: Blob): string {
  const mime = blob.type.toLowerCase();
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('avif')) return '.avif';
  return '.png';
}

function getMediaExtension(asset: ExportMediaAsset, blob: Blob): string {
  if (asset.type === 'image') return getImageExtension(blob);

  const mime = blob.type.toLowerCase();
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('quicktime')) return '.mov';
  if (mime.includes('x-matroska')) return '.mkv';

  const urlExtension = asset.url.match(/\.(mp4|webm|mov|mkv)(?:[?#].*)?$/i)?.[1];
  return urlExtension ? `.${urlExtension.toLowerCase()}` : '.mp4';
}

function getImageSourceFolder(source: ExportImageSource): string {
  if (source === 'character') return 'characters';
  if (source === 'scene') return 'scenes';
  if (source === 'autopilot') return 'autopilot';
  if (source === 'media') return 'media-library';
  return 'director';
}

function createUniqueMediaFilename(
  asset: ExportMediaAsset,
  blob: Blob,
  counts: Map<string, number>,
): string {
  const baseName = sanitizeImageAssetName(asset.name, asset.id);
  const key = `${asset.source}:${asset.type}:${baseName.toLocaleLowerCase()}`;
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  const suffix = count > 1 ? `_${count}` : '';
  return `${baseName}${suffix}${getMediaExtension(asset, blob)}`;
}

function getMediaAssetFolder(asset: ExportMediaAsset): string {
  const sourceFolder = getImageSourceFolder(asset.source);
  return asset.type === 'video' ? `${sourceFolder}/videos` : sourceFolder;
}

async function writeFilesToElectronFolder(
  baseDir: string,
  files: Array<{ relativePath: string; blob?: Blob; text?: string }>,
): Promise<void> {
  if (!window.exportStorage?.writeFiles) {
    throw new Error('Electron export storage is not available');
  }

  const payloadFiles = await Promise.all(files.map(async (file) => {
    if (typeof file.text === 'string') {
      return { relativePath: file.relativePath, text: file.text };
    }
    if (!file.blob) throw new Error(`Missing export data for ${file.relativePath}`);
    return { relativePath: file.relativePath, data: await file.blob.arrayBuffer() };
  }));

  const result = await window.exportStorage.writeFiles({ baseDir, files: payloadFiles });
  if (!result.success) {
    throw new Error(result.error || 'Failed to write export files');
  }
}

/**
 * Download file and trigger browser download
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSelectedMediaToFolder(
  projectName: string,
  assets: ExportMediaAsset[],
  onProgress?: (progress: ExportProgress) => void,
): Promise<boolean> {
  const selectedDir = window.storageManager?.selectDirectory
    ? await window.storageManager.selectDirectory()
    : null;
  if (!selectedDir) return false;
  if (!window.exportStorage?.writeFiles) {
    throw new Error('Native folder export is not available');
  }

  const files: Array<{ relativePath: string; blob: Blob }> = [];
  const filenameCounts = new Map<string, number>();

  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    onProgress?.({
      current: index,
      total: assets.length,
      message: `Preparing ${asset.name}`,
    });
    const blob = await downloadFile(asset.url);
    const filename = createUniqueMediaFilename(asset, blob, filenameCounts);
    files.push({
      relativePath: `${projectName}/${getMediaAssetFolder(asset)}/${filename}`,
      blob,
    });
  }

  await writeFilesToElectronFolder(selectedDir, files);
  onProgress?.({ current: assets.length, total: assets.length, message: 'Export complete' });
  return true;
}

export async function downloadSelectedMedia(
  assets: ExportMediaAsset[],
  onProgress?: (progress: ExportProgress) => void,
): Promise<void> {
  const filenameCounts = new Map<string, number>();

  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    onProgress?.({
      current: index,
      total: assets.length,
      message: `Downloading ${asset.name}`,
    });
    const blob = await downloadFile(asset.url);
    const filename = createUniqueMediaFilename(asset, blob, filenameCounts);
    triggerDownload(blob, filename);
    if (index < assets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  onProgress?.({ current: assets.length, total: assets.length, message: 'Export complete' });
}

/**
 * Get export stats for UI display
 */
export function getExportStats(shots: Shot[]): {
  totalShots: number;
  imagesReady: number;
  videosReady: number;
  canExport: boolean;
} {
  const imagesReady = shots.filter(s => s.imageStatus === 'completed' && getShotImageUrl(s)).length;
  const videosReady = shots.filter(s => s.videoStatus === 'completed' && s.videoUrl).length;
  
  return {
    totalShots: shots.length,
    imagesReady,
    videosReady,
    canExport: imagesReady > 0 || videosReady > 0,
  };
}

// ==================== Director SplitScene Export ====================

/**
 * Get export stats for Director SplitScene data
 */
export function getDirectorExportStats(scenes: SplitScene[]): {
  totalScenes: number;
  imagesReady: number;
  videosReady: number;
  canExport: boolean;
} {
  const imagesReady = scenes.filter(s =>
    s.imageStatus === 'completed' && (s.imageDataUrl || s.imageHttpUrl)
  ).length;
  const videosReady = scenes.filter(s =>
    s.videoStatus === 'completed' && !!s.videoUrl
  ).length;
  return {
    totalScenes: scenes.length,
    imagesReady,
    videosReady,
    canExport: imagesReady > 0 || videosReady > 0,
  };
}
