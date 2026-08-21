import type { Shot } from '@/features/video-studio/types/script';
import { normalizeRefImageIndexes } from '@/features/video-studio/types/script';
import type { ScriptSkillMeta, ScriptSkillOutputTarget } from '@/features/video-studio/types/script-skill';
import { DEFAULT_SCRIPT_SKILL_OUTPUTS, SCRIPT_SKILL_OUTPUT_TARGETS } from '@/features/video-studio/types/script-skill';

export function normalizeScriptSkillOutputs(outputs: unknown): ScriptSkillOutputTarget[] {
  if (!Array.isArray(outputs)) return [...DEFAULT_SCRIPT_SKILL_OUTPUTS];

  const normalized = outputs.filter((output): output is ScriptSkillOutputTarget =>
    SCRIPT_SKILL_OUTPUT_TARGETS.includes(output as ScriptSkillOutputTarget)
  );

  return normalized.length > 0 ? normalized : [...DEFAULT_SCRIPT_SKILL_OUTPUTS];
}

export function normalizeScriptSkillMeta(meta: unknown): ScriptSkillMeta {
  const value = meta && typeof meta === 'object' ? meta as Record<string, unknown> : {};
  const workflowName = typeof value.workflowName === 'string' ? value.workflowName : undefined;
  const mergeMode = typeof value.mergeMode === 'string' ? value.mergeMode as ScriptSkillMeta['mergeMode'] : undefined;

  return {
    workflowName,
    outputs: normalizeScriptSkillOutputs(value.outputs),
    mergeMode,
  };
}

export function hasRequestedShotPrompt(shot: Pick<Shot, 'imagePrompt' | 'videoPrompt' | 'ref_image'>, outputs: ScriptSkillOutputTarget[]): boolean {
  if (outputs.includes('imagePrompt') && shot.imagePrompt?.trim()) return true;
  if (outputs.includes('videoPrompt') && shot.videoPrompt?.trim()) return true;
  if (outputs.includes('ref_image') && normalizeRefImageIndexes(shot.ref_image).length > 0) return true;
  return false;
}

export function isShotCompleteForTargets(shot: Pick<Shot, 'imagePrompt' | 'videoPrompt'>, outputs: ScriptSkillOutputTarget[]): boolean {
  if (outputs.includes('imagePrompt') && !shot.imagePrompt?.trim()) return false;
  if (outputs.includes('videoPrompt') && !shot.videoPrompt?.trim()) return false;
  return true;
}

export function isPromptGenerationCompleteForTargets(shots: Pick<Shot, 'imagePrompt' | 'videoPrompt'>[], outputs: ScriptSkillOutputTarget[]): boolean {
  const requiresShotPrompt = outputs.includes('imagePrompt') || outputs.includes('videoPrompt');
  if (!requiresShotPrompt) return true;
  return shots.length === 0 || shots.every((shot) => isShotCompleteForTargets(shot, outputs));
}
