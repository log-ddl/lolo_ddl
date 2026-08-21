/**
 * Prompt Builder
 *
 * Assembles the final video-generation prompt from a SplitScene.
 *
 * Layers:
 * 1. Setting (scene name/location)
 * 2. Base video prompt (user-written)
 */

import type { SplitScene } from '@/features/video-studio/stores/director-store';
import { buildPromptVoiceOverSuffix, splitVideoPromptVoiceOver } from '@/features/video-studio/lib/script/voice-over';

/**
 * Build the final video-generation prompt.
 */
export function buildVideoPrompt(
  scene: SplitScene,
  options: { includeVoiceOver?: boolean } = {},
): string {
  const parts: string[] = [];

  // Setting — dedupe so a scene whose name and location are the same value
  // renders as "Setting: CourseStage" instead of "Setting: CourseStage - CourseStage".
  if (scene.sceneName || scene.sceneLocation) {
    const info = [...new Set([scene.sceneName, scene.sceneLocation].map((value) => value?.trim()).filter(Boolean))].join(' - ');
    parts.push(`Setting: ${info}`);
  }

  const promptParts = splitVideoPromptVoiceOver(scene.videoPrompt);
  const base = promptParts.videoPrompt;
  if (base) parts.push(base);

  if (options.includeVoiceOver) {
    const voiceOver = buildPromptVoiceOverSuffix(scene.voiceOver || promptParts.voiceOver);
    if (voiceOver) parts.push(voiceOver);
  }

  return parts.join('. ');
}
