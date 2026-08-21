import type { EpisodeRawScript, ScriptCharacter, ScriptData, ScriptScene, Shot } from '@/features/video-studio/types/script';
import { normalizeRefImageIndexes, normalizeVideoLength } from '@/features/video-studio/types/script';
import type { ScriptSkillMergeMode, ScriptSkillOutputTarget } from '@/features/video-studio/types/script-skill';

export interface ScriptSkillMergeInput {
  currentScriptData: ScriptData | null;
  currentEpisodes: EpisodeRawScript[];
  currentShots: Shot[];
  incomingScriptData: ScriptData;
  incomingEpisodes: EpisodeRawScript[];
  incomingShots: Shot[];
  outputs: ScriptSkillOutputTarget[];
  mergeMode?: ScriptSkillMergeMode;
}

export interface ScriptSkillMergeResult {
  scriptData: ScriptData;
  episodes: EpisodeRawScript[];
  shots: Shot[];
}

function cleanAnchorName(value: unknown): string {
  return String(value || '').trim().replace(/[,.!?;:，。！？；：]+$/, '');
}

function stripAnchor(value: unknown): string {
  const raw = cleanAnchorName(value);
  const scene = raw.match(/^@scene\[([^\]]+)\]$/iu);
  if (scene) return cleanAnchorName(scene[1]);
  const character = raw.match(/^@\[([^\]]+)\]$/u);
  if (character) return cleanAnchorName(character[1]);
  const bareCharacter = raw.match(/^@(?!scene\[)([\p{L}\p{N}_-]+)$/iu);
  if (bareCharacter) return cleanAnchorName(bareCharacter[1]);
  return raw;
}

const normalizeKey = (value: string | undefined) => stripAnchor(value).toLowerCase();

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function mergePromptField<T extends Record<string, any>>(current: T, incoming: T, field: keyof T, replaceExisting: boolean): T {
  const incomingValue = incoming[field];
  if (typeof incomingValue !== 'string' || !incomingValue.trim()) return current;
  if (!replaceExisting && hasValue(current[field])) return current;
  return { ...current, [field]: incomingValue };
}

function mergeCharacters(current: ScriptCharacter[], incoming: ScriptCharacter[], outputs: ScriptSkillOutputTarget[], replaceExisting: boolean): ScriptCharacter[] {
  const next = [...current];
  const shouldMergePrompt = outputs.includes('characterPrompt');

  incoming.forEach((incomingCharacter) => {
    const key = normalizeKey(incomingCharacter.name);
    if (!key) return;
    const index = next.findIndex((character) => normalizeKey(character.name) === key);
    if (index === -1) {
      const idExists = next.some((character) => character.id === incomingCharacter.id);
      next.push(idExists ? { ...incomingCharacter, id: `char_${next.length + 1}` } : incomingCharacter);
      return;
    }
    if (shouldMergePrompt) {
      next[index] = mergePromptField(next[index], incomingCharacter, 'characterPrompt', replaceExisting);
    }
  });

  return next;
}

function mergeScenes(current: ScriptScene[], incoming: ScriptScene[], outputs: ScriptSkillOutputTarget[], replaceExisting: boolean): ScriptScene[] {
  const next = [...current];

  incoming.forEach((incomingScene) => {
    const incomingKey = normalizeKey(incomingScene.name);
    if (!incomingKey) return;
    const index = next.findIndex((scene) => normalizeKey(scene.name) === incomingKey);
    if (index === -1) {
      const idExists = next.some((scene) => scene.id === incomingScene.id);
      next.push(idExists ? { ...incomingScene, id: `scene_${next.length + 1}` } : incomingScene);
      return;
    }
    const mergedBase = {
      ...next[index],
      description: hasValue(next[index].description) ? next[index].description : incomingScene.description,
      atmosphere: hasValue(next[index].atmosphere) ? next[index].atmosphere : incomingScene.atmosphere,
      notes: hasValue(next[index].notes) ? next[index].notes : incomingScene.notes,
    };
    next[index] = outputs.includes('scenePrompt')
      ? mergePromptField(mergedBase, incomingScene, 'scenePrompt', replaceExisting)
      : mergedBase;
  });

  return next;
}

function getSceneKey(scriptData: ScriptData, sceneId: string): string {
  const scene = scriptData.scenes.find((item) => item.id === sceneId);
  return normalizeKey(scene?.name || sceneId);
}

function findMatchingSceneId(currentScriptData: ScriptData, incomingScriptData: ScriptData, incomingSceneId: string): string | undefined {
  if (!incomingSceneId) return undefined;
  const incomingKey = getSceneKey(incomingScriptData, incomingSceneId);
  if (!incomingKey) return undefined;
  return currentScriptData.scenes.find((scene) => normalizeKey(scene.name) === incomingKey)?.id;
}

function nextShotId(shots: Shot[]): string {
  const max = shots.reduce((acc, shot) => {
    const value = Number(String(shot.id).match(/(\d+)$/)?.[1] || 0);
    return Math.max(acc, value);
  }, shots.length);
  return `shot-${max + 1}`;
}

function createShotForScene(source: Shot, sceneRefId: string, index: number, id: string): Shot {
  return {
    ...source,
    id,
    index,
    sceneRefId,
    keyframes: source.imagePrompt ? [{ id: `kf-${id}-start`, type: 'start', imagePrompt: source.imagePrompt, imageUrl: '', status: 'idle' }] : [],
    imageStatus: 'idle',
    imageProgress: 0,
    videoStatus: 'idle',
    videoProgress: 0,
  };
}

function mergeShotPrompts(current: Shot, incoming: Shot, outputs: ScriptSkillOutputTarget[], replaceExisting: boolean): Shot {
  let next = current;
  const incomingRefs = normalizeRefImageIndexes(incoming.ref_image);
  if (incomingRefs.length > 0 && (replaceExisting || !normalizeRefImageIndexes(current.ref_image).length)) {
    next = { ...next, ref_image: incomingRefs };
  }
  if (outputs.includes('imagePrompt')) {
    next = mergePromptField(next, incoming, 'imagePrompt', replaceExisting);
    if (next !== current && next.imagePrompt?.trim()) {
      next = {
        ...next,
        keyframes: [{ id: `kf-${next.id}-start`, type: 'start', imagePrompt: next.imagePrompt, imageUrl: '', status: 'idle' }],
      };
    }
  }
  if (outputs.includes('videoPrompt')) {
    next = mergePromptField(next, incoming, 'videoPrompt', replaceExisting);
    if ((replaceExisting || !hasValue(next.voiceOver)) && hasValue(incoming.voiceOver)) {
      next = { ...next, voiceOver: incoming.voiceOver };
    }
  }
  if (outputs.includes('videoLength')) {
    next = { ...next, videoLength: normalizeVideoLength(incoming.videoLength) };
  }
  return next;
}

function mergeShotsByPosition(input: ScriptSkillMergeInput, replaceExisting: boolean, appendOnly: boolean): Shot[] {
  if (!input.currentScriptData) return input.incomingShots;
  const next = [...input.currentShots];

  input.incomingShots.forEach((incomingShot) => {
    const targetSceneId = findMatchingSceneId(input.currentScriptData!, input.incomingScriptData, incomingShot.sceneRefId);
    const targetEpisodeId = incomingShot.episodeId;
    if (!targetSceneId && incomingShot.sceneRefId) return;

    const currentGroupShots = next
      .filter((shot) => targetSceneId ? shot.sceneRefId === targetSceneId : !shot.sceneRefId && shot.episodeId === targetEpisodeId)
      .sort((a, b) => a.index - b.index);
    const incomingGroupShots = input.incomingShots
      .filter((shot) => targetSceneId ? shot.sceneRefId === incomingShot.sceneRefId : !shot.sceneRefId && shot.episodeId === targetEpisodeId)
      .sort((a, b) => a.index - b.index);
    const position = incomingGroupShots.findIndex((shot) => shot.id === incomingShot.id);

    if (!appendOnly && currentGroupShots[position]) {
      const targetIndex = next.findIndex((shot) => shot.id === currentGroupShots[position].id);
      next[targetIndex] = mergeShotPrompts(next[targetIndex], incomingShot, input.outputs, replaceExisting);
      return;
    }

    const id = nextShotId(next);
    next.push(createShotForScene(incomingShot, targetSceneId || '', next.length + 1, id));
  });

  return next.map((shot, index) => ({ ...shot, index: index + 1 }));
}

export function mergeScriptSkillResult(input: ScriptSkillMergeInput): ScriptSkillMergeResult {
  const mode = input.mergeMode || 'replace-missing';
  if (mode === 'replace-all' || !input.currentScriptData) {
    return {
      scriptData: input.incomingScriptData,
      episodes: input.incomingEpisodes,
      shots: input.incomingShots,
    };
  }

  const replaceExisting = mode === 'update-prompts-only';
  const appendOnly = mode === 'append-shots';
  const scriptData: ScriptData = {
    ...input.currentScriptData,
    characters: mergeCharacters(input.currentScriptData.characters || [], input.incomingScriptData.characters || [], input.outputs, replaceExisting),
    scenes: mergeScenes(input.currentScriptData.scenes || [], input.incomingScriptData.scenes || [], input.outputs, replaceExisting),
  };

  return {
    scriptData,
    episodes: input.currentEpisodes.length > 0 ? input.currentEpisodes : input.incomingEpisodes,
    shots: mergeShotsByPosition({ ...input, currentScriptData: scriptData }, replaceExisting, appendOnly),
  };
}
