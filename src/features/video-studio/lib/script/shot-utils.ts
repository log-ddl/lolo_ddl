/**
 * Shot utilities.
 * Extracted from duplicated logic that previously lived in episode-tree.tsx,
 * property-panel.tsx, and context-panel.tsx.
 */

import type { CompletionStatus, Shot } from "@/features/video-studio/types/script";
import type { ScriptSkillOutputTarget } from "@/features/video-studio/types/script-skill";

export type PromptTargetStatus = 'ready' | 'missing' | 'not-required';

/** Compute completion status from a Shot's image/video status. */
export function getShotCompletionStatus(shot: Shot): CompletionStatus {
  const hasCorePrompts = !!(shot.imagePrompt?.trim() && shot.videoPrompt?.trim());
  if (!hasCorePrompts) {
    return "pending";
  }
  if (shot.imageStatus === "completed" && shot.videoStatus === "completed") {
    return "completed";
  }
  if (shot.imageStatus === "completed" || shot.videoStatus === "completed") {
    return "in_progress";
  }
  return "pending";
}

/** Build a progress string for items carrying a status field. */
export function calculateProgress(items: { status?: CompletionStatus }[]): string {
  const completed = items.filter((i) => i.status === "completed").length;
  return `${completed}/${items.length}`;
}

export function getPromptTargetStatus(
  shot: Pick<Shot, 'imagePrompt' | 'videoPrompt'>,
  target: Extract<ScriptSkillOutputTarget, 'imagePrompt' | 'videoPrompt'>,
  requiredTargets?: ScriptSkillOutputTarget[]
): PromptTargetStatus {
  if (requiredTargets && !requiredTargets.includes(target)) return 'not-required';
  const value = target === 'imagePrompt' ? shot.imagePrompt : shot.videoPrompt;
  return value?.trim() ? 'ready' : 'missing';
}

