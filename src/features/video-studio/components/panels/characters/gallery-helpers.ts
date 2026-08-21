import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import { resolveLaneCount, syncRuntimeLaneSettings } from "@/features/video-studio/lib/ai/lane-manager";

export type ViewMode = "grid" | "list";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function getImageGenerationLaneConfig(): Promise<{ laneCount: number }> {
  const featureConfig = getFeatureConfig('character_generation');
  await syncRuntimeLaneSettings();
  // Concurrency = number of accounts x lanes per account. Google Flow uses
  // in-app accounts (no JWTs in the apiKey), so its lane count comes from the
  // runtime (readyCredentialCount x imageLanesPerToken). Counting JWTs like Max
  // Studio would always collapse Flow to a single account -> only 4 lanes even
  // with two accounts connected.
  const laneCount = await resolveLaneCount('image', featureConfig?.platform);
  return { laneCount };
}
