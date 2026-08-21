import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import { resolveLaneCount, syncRuntimeLaneSettings } from "@/features/video-studio/lib/ai/lane-manager";

export type ViewMode = "grid" | "list";

export async function getUploadLaneConfig(): Promise<{ laneCount: number }> {
  const featureConfig = getFeatureConfig('character_generation');
  await syncRuntimeLaneSettings();
  // Concurrency = accounts × lanes per account. Google Flow uses in-app accounts
  // (no JWTs), so its lane count comes from the runtime; Max Studio counts JWTs.
  const laneCount = await resolveLaneCount('image', featureConfig?.platform);
  return { laneCount };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Strips characters that are unsafe in a filename, keeping Latin and CJK letters. */
export function safeSceneFileName(name: string): string {
  return (name || 'scene').replace(/[^a-zA-Z0-9一-龥]/g, '_');
}
