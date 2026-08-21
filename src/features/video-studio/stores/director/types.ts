import type {
  DirectorEditorPrefs,
  DirectorProjectData,
  DirectorScreenplayDraft,
  SplitScene,
  StoryboardStatus,
} from "../director-types";
import type { SoundEffectTag } from "../director-presets";
import type { VideoLength } from "@/features/video-studio/types/script";

/** State shape and action signatures for the Director store. */

export interface DirectorState {
  // Active project tracking
  activeProjectId: string | null;
  
  // Per-project data storage
  projects: Record<string, DirectorProjectData>;
  
  // UI state - global
  isExpanded: boolean;
  selectedSceneId: number | null;
}

export interface DirectorActions {
  // Project management
  setActiveProjectId: (projectId: string | null) => void;
  ensureProject: (projectId: string) => void;
  getProjectData: (projectId: string) => DirectorProjectData;
  
  // UI
  setExpanded: (expanded: boolean) => void;
  setSelectedScene: (sceneId: number | null) => void;
  
  // Storyboard actions (new workflow)
  setStoryboardImage: (imageUrl: string | null, mediaId?: string | null) => void;
  setStoryboardStatus: (status: StoryboardStatus) => void;
  setStoryboardError: (error: string | null) => void;
  setProjectFolderId: (folderId: string | null) => void;
  setSplitScenes: (scenes: SplitScene[]) => void;
  
  // Update first-frame prompt (static image description)
  updateSplitSceneImagePrompt: (sceneId: number, prompt: string) => void;
  // Update video prompt (dynamic motion/action description)
  updateSplitSceneVideoPrompt: (sceneId: number, prompt: string) => void;
  // Legacy compatibility API: actually updates videoPrompt
  updateSplitScenePrompt: (sceneId: number, prompt: string) => void;
  
  updateSplitSceneImage: (sceneId: number, imageDataUrl: string, width?: number, height?: number, httpUrl?: string) => void;
  updateSplitSceneImageStatus: (sceneId: number, updates: Partial<Pick<SplitScene, 'imageStatus' | 'imageProgress' | 'imageError'>>) => void;
  updateSplitSceneVideo: (sceneId: number, updates: Partial<Pick<SplitScene, 'videoStatus' | 'videoProgress' | 'videoUrl' | 'videoError' | 'videoMediaId'>>) => void;
  // Character-library updates
  updateSplitSceneCharacters: (sceneId: number, characterIds: string[]) => void;
  updateSplitSceneCharacterVariationMap: (sceneId: number, characterVariationMap: Record<string, string>) => void;
  // Ambient and sound-effect updates
  updateSplitSceneAmbientSound: (sceneId: number, ambientSound: string) => void;
  updateSplitSceneSoundEffects: (sceneId: number, soundEffects: SoundEffectTag[]) => void;
  // Scene-library association updates
  updateSplitSceneReference: (sceneId: number, sceneLibraryId?: string, referenceImage?: string) => void;
  // Generic field update helper used by inline editing
  updateSplitSceneField: (sceneId: number, field: keyof SplitScene, value: any) => void;
  syncVoiceOverToVideoPrompts: (sceneIds?: number[]) => number;
  unsyncVoiceOverFromVideoPrompts: (sceneIds?: number[]) => number;
  deleteSplitScene: (sceneId: number) => void;
  addBlankSplitScene: () => void;
  setStoryboardConfig: (config: Partial<DirectorProjectData['storyboardConfig']>) => void;
  setScreenplayDraft: (draft: Partial<DirectorScreenplayDraft>) => void;
  clearScreenplayDraft: () => void;
  setEditorPrefs: (prefs: Partial<DirectorEditorPrefs>) => void;
  resetStoryboard: () => void;
  
  // Mode 2: Add scenes from script directly (skip storyboard generation)
  addScenesFromScript: (scenes: Array<{
    promptEn?: string;
    // Two-layer prompt fields
    imagePrompt?: string;      // First-frame prompt (English)
    videoPrompt?: string;      // Video prompt (English)
    voiceOver?: string;        // Spoken voice-over/narration text
    videoLength?: VideoLength;
    characterIds?: string[];
    characterNames?: string[];
    ambientSound?: string;
    soundEffects?: SoundEffectTag[];
    soundEffectText?: string;
    dialogue?: string;
    sceneName?: string;
    sceneLocation?: string;
    backgroundMusic?: string;
    // Scene-library associations (auto-matched when available)
    sceneLibraryId?: string;
    sceneReferenceImage?: string;
    ref_image?: number[];
    sourceShotId?: string;
    sourceShotIndex?: number;
    // Episode scope
    sourceEpisodeIndex?: number;
    sourceEpisodeId?: string;
  }>) => void;
  
  // Reset any in-flight (queued/uploading/generating) statuses to idle. Called once on app start
  // because in-flight HTTP requests die with the process; persisted "generating" is misleading.
  resetInflightStatuses: () => void;
}

export type DirectorStore = DirectorState & DirectorActions;
