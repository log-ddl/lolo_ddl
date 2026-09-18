import type { VideoLength } from '@/features/video-studio/types/script';
export function videoDurations(model: string): VideoLength[] {
  const key = model.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (key === 'gemini_omni_flash' || key === 'omni_flash' || key.startsWith('abra')) return [4, 6, 8, 10];
  // The runtime restricts short Veo requests to manually marked Ultra accounts.
  return [4, 6, 8];
}
export function videoDuration(model: string, value?: number): VideoLength {
  return videoDurations(model).includes(value as VideoLength) ? value as VideoLength : 8;
}
