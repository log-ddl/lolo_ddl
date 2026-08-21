import type {
  DirectorEditorPrefs,
  DirectorProjectData,
  DirectorScreenplayDraft,
  SplitScene,
} from "../director-types";
import { cleanVoiceOverText, mergeVideoPromptVoiceOver, splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import type { DirectorState } from "./types";

/**
 * Factory defaults plus the rehydration guards that bring persisted projects
 * from older versions up to the current shape.
 */

// ==================== Default Project Data ====================

export const defaultProjectData = (): DirectorProjectData => ({
  storyboardImage: null,
  storyboardImageMediaId: null,
  storyboardStatus: 'editing',
  storyboardError: null,
  splitScenes: [],
  projectFolderId: null,
  storyboardConfig: {
    aspectRatio: '9:16',
    resolution: '2K',
    videoResolution: '480p',
    sceneCount: 5,
    storyPrompt: '',
    styleTokens: [],
    characterReferenceImages: [],
    characterDescriptions: [],
    voiceMode: 'off',
  },
  screenplayDraft: {
    prompt: '',
    selectedCharacterIds: [],
    updatedAt: 0,
  },
  editorPrefs: {
    imageGenMode: 'merged',
    frameMode: 'first',
    refStrategy: 'cluster',
    useExemplar: true,
    activeTab: 'editing',
    episodeViewScope: 'episode',
  },
});

export const defaultScreenplayDraft: DirectorScreenplayDraft = {
  prompt: '',
  selectedCharacterIds: [],
  updatedAt: 0,
};

export const defaultEditorPrefs: DirectorEditorPrefs = {
  imageGenMode: 'merged',
  frameMode: 'first',
  refStrategy: 'cluster',
  useExemplar: true,
  activeTab: 'editing',
  episodeViewScope: 'episode',
};

export const normalizeSplitSceneVoiceFields = <T extends { videoPrompt?: string; voiceOver?: string; voiceOverSynced?: boolean }>(scene: T): T => {
  const parts = splitVideoPromptVoiceOver(scene.videoPrompt);
  const voiceOver = cleanVoiceOverText(scene.voiceOver) || parts.voiceOver;
  if (scene.voiceOverSynced) {
    return {
      ...scene,
      videoPrompt: scene.videoPrompt?.trim() || mergeVideoPromptVoiceOver(parts.videoPrompt, voiceOver),
      voiceOver,
      voiceOverSynced: Boolean(voiceOver),
    };
  }
  return {
    ...scene,
    videoPrompt: parts.videoPrompt,
    voiceOver,
  };
};

export const normalizeDirectorProjectData = (project: any): DirectorProjectData => {
  const defaults = defaultProjectData();
  return {
    ...defaults,
    ...project,
    storyboardConfig: {
      ...defaults.storyboardConfig,
      ...(project?.storyboardConfig || {}),
    },
    screenplayDraft: {
      ...defaultScreenplayDraft,
      ...(project?.screenplayDraft || {}),
    },
    editorPrefs: {
      ...defaultEditorPrefs,
      ...(project?.editorPrefs || {}),
    },
    splitScenes: (project?.splitScenes || []).map((scene: SplitScene) => normalizeSplitSceneVoiceFields({
      ...scene,
      videoLength: normalizeVideoLength(scene.videoLength),
      ref_image: normalizeRefImageIndexes((scene as any).ref_image ?? (scene as any).refImage),
      sourceShotIndex: scene.sourceShotIndex ?? scene.id + 1,
    })),
  };
};

// ==================== Initial State ====================

export const initialState: DirectorState = {
  activeProjectId: null,
  projects: {},
  isExpanded: true,
  selectedSceneId: null,
};

