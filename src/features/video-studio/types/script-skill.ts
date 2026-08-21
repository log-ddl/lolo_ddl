export type ScriptSkillOutputTarget =
  | 'characterPrompt'
  | 'scenePrompt'
  | 'imagePrompt'
  | 'videoPrompt'
  | 'videoLength'
  | 'ref_image';

export type ScriptSkillMergeMode =
  | 'replace-all'
  | 'replace-missing'
  | 'update-prompts-only'
  | 'append-shots';

export interface ScriptSkillMeta {
  workflowName?: string;
  outputs: ScriptSkillOutputTarget[];
  mergeMode?: ScriptSkillMergeMode;
}

export interface ScriptSkillAsset {
  id: string;
  name: string;
  content: string;
  outputs: ScriptSkillOutputTarget[];
  mergeMode?: ScriptSkillMergeMode;
  createdAt: number;
  updatedAt: number;
}

export const SCRIPT_SKILL_OUTPUT_TARGETS: ScriptSkillOutputTarget[] = [
  'characterPrompt',
  'scenePrompt',
  'imagePrompt',
  'videoPrompt',
  'videoLength',
  'ref_image',
];

export const DEFAULT_SCRIPT_SKILL_OUTPUTS: ScriptSkillOutputTarget[] = [
  'characterPrompt',
  'scenePrompt',
  'imagePrompt',
  'videoPrompt',
  'videoLength',
  'ref_image',
];
