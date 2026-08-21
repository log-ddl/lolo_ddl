import type { AutopilotImportedPlan } from './types';

const optionalText = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined;

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} phải là object`);
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, label: string): string {
  const result = optionalText(value);
  if (!result) throw new Error(`${label} không được để trống`);
  return result;
}

export function parseAutopilotImportedPlan(text: string): AutopilotImportedPlan {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (error) {
    throw new Error(`JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
  }
  const root = asObject(raw, 'JSON');
  if (!Array.isArray(root.shots) || root.shots.length === 0) throw new Error('shots phải là mảng có ít nhất 1 shot');
  if (root.shots.length > 500) throw new Error('JSON vượt quá giới hạn 500 shot');
  const shots = root.shots.map((value, index) => {
    const shot = asObject(value, `shots[${index}]`);
    if (shot.characterNames !== undefined && (!Array.isArray(shot.characterNames) || shot.characterNames.some((name) => typeof name !== 'string'))) {
      throw new Error(`shots[${index}].characterNames phải là mảng chuỗi`);
    }
    return {
      voiceOver: requiredText(shot.voiceOver ?? shot.narration, `shots[${index}].voiceOver`),
      imagePrompt: requiredText(shot.imagePrompt, `shots[${index}].imagePrompt`),
      videoPrompt: optionalText(shot.videoPrompt),
      characterNames: Array.isArray(shot.characterNames) ? shot.characterNames.map((name) => String(name).trim()).filter(Boolean) : [],
      sceneName: optionalText(shot.sceneName ?? shot.sceneRefId),
      transitionToNext: optionalText(shot.transitionToNext),
      realImageQuery: optionalText(shot.realImageQuery),
    };
  });
  const parseReferences = (value: unknown, kind: 'characters' | 'scenes') => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new Error(`${kind} phải là mảng`);
    return value.map((entry, index) => asObject(entry, `${kind}[${index}]`));
  };
  const characters = parseReferences(root.characters, 'characters').map((item, index) => ({
    name: requiredText(item.name, `characters[${index}].name`),
    description: optionalText(item.description),
    characterPrompt: requiredText(item.characterPrompt, `characters[${index}].characterPrompt`),
  }));
  const scenes = parseReferences(root.scenes, 'scenes').map((item, index) => ({
    name: requiredText(item.name, `scenes[${index}].name`),
    description: optionalText(item.description),
    scenePrompt: requiredText(item.scenePrompt, `scenes[${index}].scenePrompt`),
  }));
  return {
    version: typeof root.version === 'number' ? root.version : undefined,
    title: optionalText(root.title),
    aspectRatio: optionalText(root.aspectRatio),
    allowRealImageResearch: root.allowRealImageResearch === true || shots.some((shot) => Boolean(shot.realImageQuery)),
    characters,
    scenes,
    shots,
  };
}

export function scriptFromImportedPlan(plan: AutopilotImportedPlan): string {
  return plan.shots.map((shot) => shot.voiceOver).join('\n\n');
}
