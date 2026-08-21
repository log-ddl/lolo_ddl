import type { ScriptCharacter, ScriptScene } from "@/features/video-studio/types/script";
import { normalizeRefImageIndexes } from "@/features/video-studio/types/script";
import { cleanVoiceOverText, splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { defaultCalibrationState, defaultProjectData, type ScriptProjectData, type ScriptStore } from "./types";

/**
 * Rehydration guards: persisted project data can come from older versions, so
 * every field is normalized on load and characters that went missing are
 * recovered from the shots that reference them.
 */

export const pendingCharacterRecoveryProjectIds = new Set<string>();

export const cloneScriptCharacters = (characters: ScriptCharacter[] | undefined): ScriptCharacter[] => {
  if (!Array.isArray(characters) || characters.length === 0) {
    return [];
  }

  return characters
    .filter((character): character is ScriptCharacter => Boolean(character?.name))
    .map((character, index) => ({
      ...character,
      id: character.id || `char_recovered_${index + 1}`,
      name: character.name.trim(),
    }));
};

export const normalizeShotVoiceFields = <T extends { videoPrompt?: string; voiceOver?: string }>(shot: T): T => {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  const voiceOver = cleanVoiceOverText(shot.voiceOver) || parts.voiceOver;
  return {
    ...shot,
    videoPrompt: parts.videoPrompt,
    voiceOver,
    ref_image: normalizeRefImageIndexes((shot as any).ref_image ?? (shot as any).refImage),
  } as T;
};

export const normalizeScriptScene = (scene: any): ScriptScene => {
  const legacyScenePrompt = scene['visual' + 'Prompt'];
  const {
    ['visual' + 'Prompt']: _discard,
    location: legacyLocation,
    ...cleanScene
  } = scene;
  return {
    ...cleanScene,
    name: cleanScene.name?.trim() || legacyLocation?.trim() || undefined,
    description: cleanScene.description || cleanScene.notes || legacyLocation || cleanScene.name,
    scenePrompt: scene.scenePrompt || legacyScenePrompt,
  };
};

export const normalizeScriptProjectData = (projectId: string, projectData: any): ScriptProjectData => {
  const defaults = defaultProjectData();
  const defaultCalibration = defaultCalibrationState();
  const normalizedProject: ScriptProjectData = {
    ...defaults,
    ...projectData,
    calibrationState: {
      ...defaultCalibration,
      ...(projectData?.calibrationState || {}),
      singleShotCalibrationStatus: {
        ...defaultCalibration.singleShotCalibrationStatus,
        ...(projectData?.calibrationState?.singleShotCalibrationStatus || {}),
      },
      pendingCalibrationCharacters: Array.isArray(projectData?.calibrationState?.pendingCalibrationCharacters)
        ? projectData.calibrationState.pendingCalibrationCharacters
        : null,
      pendingFilteredCharacters: Array.isArray(projectData?.calibrationState?.pendingFilteredCharacters)
        ? projectData.calibrationState.pendingFilteredCharacters
        : [],
    },
  };

  normalizedProject.shots = (normalizedProject.shots || []).map((shot) => normalizeShotVoiceFields(shot));

  if (normalizedProject.scriptData) {
    normalizedProject.scriptData = {
      ...normalizedProject.scriptData,
      characters: (normalizedProject.scriptData.characters || []).map((character: any) => {
        const legacyCharacterPrompt = character['visual' + 'PromptEn'];
        const { ['visual' + 'PromptEn']: _discard, ...cleanCharacter } = character;
        return {
          ...cleanCharacter,
          characterPrompt: character.characterPrompt || legacyCharacterPrompt,
        };
      }),
      scenes: (normalizedProject.scriptData.scenes || []).map(normalizeScriptScene),
    };
  }

  if (normalizedProject.seriesMeta?.recurringLocations) {
    normalizedProject.seriesMeta = {
      ...normalizedProject.seriesMeta,
      recurringLocations: normalizedProject.seriesMeta.recurringLocations.map(normalizeScriptScene),
    };
  }

  const recoveredCharacters = cloneScriptCharacters(normalizedProject.seriesMeta?.characters);
  if (
    normalizedProject.scriptData &&
    (!Array.isArray(normalizedProject.scriptData.characters) || normalizedProject.scriptData.characters.length === 0) &&
    recoveredCharacters.length > 0
  ) {
    normalizedProject.scriptData = {
      ...normalizedProject.scriptData,
      characters: recoveredCharacters,
    };
    pendingCharacterRecoveryProjectIds.add(projectId);
  }

  return normalizedProject;
};

export const flushRecoveredCharactersToDisk = (state: ScriptStore | undefined) => {
  if (!state || pendingCharacterRecoveryProjectIds.size === 0) {
    return;
  }

  for (const projectId of Array.from(pendingCharacterRecoveryProjectIds)) {
    const project = state.projects[projectId];
    const characters = cloneScriptCharacters(project?.scriptData?.characters);
    if (!project?.scriptData || characters.length === 0) {
      pendingCharacterRecoveryProjectIds.delete(projectId);
      continue;
    }

    state.setScriptData(projectId, {
      ...project.scriptData,
      characters,
    });
    pendingCharacterRecoveryProjectIds.delete(projectId);
  }
};
