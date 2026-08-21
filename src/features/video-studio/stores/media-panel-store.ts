import {
  ClapperboardIcon,
  UsersIcon,
  VideoIcon,
  SettingsIcon,
  MapPinIcon,
  FileTextIcon,
  TableIcon,
  FilmIcon,
  WandSparklesIcon,
  LayoutDashboardIcon,
  RocketIcon,
  LucideIcon,
} from "lucide-react";
import { create } from "zustand";
import type { CharacterNegativePrompt } from "@/features/video-studio/types/script";
import { usePreviewStore } from "@/features/video-studio/stores/preview-store";

// Tab-based navigation (simpler flat structure)
export type Tab = "dashboard" | "overview" | "script" | "promptImport" | "characters" | "scenes" | "director" | "media" | "export" | "autoVideo" | "autopilot" | "settings";

export interface NavItem {
  id: Tab;
  labelKey: string;
  icon: LucideIcon;
  phase?: string; // Optional phase indicator
  requiresPlan?: 'pro' | 'unlimited' | 'dev'; // Hide tab unless user's license plan matches
}

// Temporary product switches. Keep the implementation available while hiding
// unfinished or paused features from normal navigation.
export const VIDEO_STUDIO_FEATURE_FLAGS = {
  autoVideoVisible: false,
} as const;

// Main navigation items (top section)
export const mainNavItems: NavItem[] = [
  { id: "overview", labelKey: "nav.overview", icon: LayoutDashboardIcon },
  { id: "script", labelKey: "nav.script", icon: FileTextIcon, phase: "01" },
  { id: "promptImport", labelKey: "nav.promptImport", icon: TableIcon, phase: "01" },
  { id: "characters", labelKey: "nav.characters", icon: UsersIcon, phase: "02" },
  { id: "scenes", labelKey: "nav.scenes", icon: MapPinIcon, phase: "02" },
  { id: "director", labelKey: "nav.director", icon: ClapperboardIcon, phase: "03" },
  { id: "export", labelKey: "nav.export", icon: FilmIcon, phase: "04" },
  ...(VIDEO_STUDIO_FEATURE_FLAGS.autoVideoVisible
    ? [{ id: "autoVideo", labelKey: "nav.autoVideo", icon: WandSparklesIcon, phase: "05", requiresPlan: 'dev' } as NavItem]
    : []),
  { id: "autopilot", labelKey: "nav.autopilot", icon: RocketIcon, phase: "06", requiresPlan: 'dev' },
];

// Bottom navigation items
export const bottomNavItems: NavItem[] = [
  { id: "settings", labelKey: "nav.settings", icon: SettingsIcon },
];

// Legacy exports for compatibility
export type Stage = "script" | "assets" | "director" | "export";
export interface StageConfig {
  id: Stage;
  labelKey: string;
  phase: string;
  icon: LucideIcon;
  tabs: Tab[];
}
export const stages: StageConfig[] = [
  { id: "script", labelKey: "stage.script", phase: "stage.phase01", icon: FileTextIcon, tabs: ["script", "promptImport"] },
  { id: "assets", labelKey: "stage.assets", phase: "stage.phase02", icon: UsersIcon, tabs: ["characters", "scenes"] },
  { id: "director", labelKey: "stage.director", phase: "stage.phase03", icon: ClapperboardIcon, tabs: ["director"] },
  { id: "export", labelKey: "stage.export", phase: "stage.phase04", icon: FilmIcon, tabs: ["export"] },
];

export const tabs: { [key in Tab]: { icon: LucideIcon; label: string; stage?: Stage } } = {
  dashboard: { icon: FileTextIcon, label: "Projects" },
  overview: { icon: LayoutDashboardIcon, label: "Overview" },
  script: { icon: FileTextIcon, label: "Script", stage: "script" },
  promptImport: { icon: TableIcon, label: "Prompt Import", stage: "script" },
  characters: { icon: UsersIcon, label: "Characters", stage: "assets" },
  scenes: { icon: MapPinIcon, label: "Scenes", stage: "assets" },

  director: { icon: ClapperboardIcon, label: "Director", stage: "director" },
  media: { icon: VideoIcon, label: "Media" },
  export: { icon: FilmIcon, label: "Export", stage: "export" },
  autoVideo: { icon: WandSparklesIcon, label: "Auto Video" },
  autopilot: { icon: RocketIcon, label: "AutoPilot" },
  settings: { icon: SettingsIcon, label: "Settings" },
};

// Data passed from script panel to director
export interface PrebuiltDirectorScene {
  imagePrompt: string;
  videoPrompt: string;
  voiceOver?: string;
  videoLength?: import('@/features/video-studio/types/script').VideoLength;
  characterIds?: string[];
  characterNames?: string[];
  sceneName?: string;
  sceneLocation?: string;
  sceneLibraryId?: string;
  sceneReferenceImage?: string;
  sceneMasterReferenceImage?: string;
  ref_image?: number[];
  sourceShotId?: string;
  sourceShotIndex?: number;
  ambientSound?: string;
  dialogue?: string;
}

export interface PendingDirectorData {
  storyPrompt: string; // Combined action + dialogue
  characterNames?: string[];
  characterLibraryIds?: string[];
  sceneLocation?: string;
  sceneTime?: string;
  sceneLibraryId?: string;
  sceneReferenceImage?: string;
  sceneMasterReferenceImage?: string;
  shotId?: string; // Source shot ID for reference
  // Auto-fill parameters
  sceneCount?: number; // 1 for single shot, N for scene with N shots
  styleId?: string; // Visual style from script
  sourceType?: 'shot' | 'scene' | 'episode'; // What triggered this jump
  // Episode-scope pass-through
  sourceEpisodeIndex?: number;
  sourceEpisodeId?: string;
  // Pre-built scenes from script: skip storyboard generation, go directly to editing
  prebuiltScenes?: PrebuiltDirectorScene[];
}

// Data passed from script panel to character library
export interface PendingCharacterData {
  name: string;
  gender?: string;
  age?: string;
  styleId?: string;
  // Episode-scope pass-through
  sourceEpisodeIndex?: number;
  sourceEpisodeId?: string;
  // === Core prompt fields ===
  description?: string;
  characterPrompt?: string;
  // === Prompts ===
  negativePrompt?: CharacterNegativePrompt;    // Negative prompt
}

// Data passed from script panel to scene library
export interface PendingSceneData {
  // === Basic information ===
  name: string;
  description?: string;
  time?: string;
  atmosphere?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  styleId?: string;
  tags?: string[];        // Scene tags
  notes?: string;         // Scene notes
  // Episode-scope pass-through
  sourceEpisodeIndex?: number;
  sourceEpisodeId?: string;
  // Prompt language preference
  promptLanguage?: import('@/features/video-studio/types/script').PromptLanguage;
  
  // === Scene prompt field ===
  scenePrompt?: string;
}

interface MediaPanelStore {
  activeTab: Tab;
  activeStage: Stage;
  inProject: boolean; // Whether viewing a project or dashboard
  setActiveTab: (tab: Tab) => void;
  setActiveStage: (stage: Stage) => void;
  setInProject: (inProject: boolean) => void;
  // Episode scope (subproject scope)
  activeEpisodeIndex: number | null;
  activeEpisodeScopeKey: string | null; // `${projectId}::ep-${episodeIndex}`
  enterEpisode: (index: number, projectId?: string) => void;
  backToSeries: () => void;
  highlightMediaId: string | null;
  requestRevealMedia: (mediaId: string) => void;
  clearHighlight: () => void;
  // Cross-panel data passing
  pendingDirectorData: PendingDirectorData | null;
  setPendingDirectorData: (data: PendingDirectorData | null) => void;
  goToDirectorWithData: (data: PendingDirectorData) => void;
  // Character library data passing
  pendingCharacterData: PendingCharacterData | null;
  setPendingCharacterData: (data: PendingCharacterData | null) => void;
  goToCharacterWithData: (data: PendingCharacterData) => void;
  // Scene library data passing
  pendingSceneData: PendingSceneData | null;
  setPendingSceneData: (data: PendingSceneData | null) => void;
  goToSceneWithData: (data: PendingSceneData) => void;
}

export const useMediaPanelStore = create<MediaPanelStore>((set) => ({
  activeTab: "dashboard",
  activeStage: "script",
  inProject: false,
  setActiveTab: (tab) => {
    // Auto-update stage based on tab
    const tabConfig = tabs[tab];
    if (tabConfig?.stage) {
      set({ activeTab: tab, activeStage: tabConfig.stage, inProject: true });
    } else if (tab === "dashboard") {
      set({ activeTab: tab, inProject: false, activeEpisodeIndex: null, activeEpisodeScopeKey: null });
    } else if (tab === "overview") {
      // Project-level tabs that do not belong to a workflow stage but still live inside a project.
      set({ activeTab: tab, inProject: true });
    } else {
      set({ activeTab: tab });
    }
  },
  setActiveStage: (stage) => {
    // Switch to first tab of the stage
    const stageConfig = stages.find(s => s.id === stage);
    if (stageConfig && stageConfig.tabs.length > 0) {
      set({ activeStage: stage, activeTab: stageConfig.tabs[0], inProject: true });
    }
  },
  setInProject: (inProject) => {
    if (!inProject) {
      set({ inProject: false, activeTab: "dashboard", activeEpisodeIndex: null, activeEpisodeScopeKey: null });
    } else {
      set({ inProject: true });
    }
  },
  // Episode scope
  activeEpisodeIndex: null,
  activeEpisodeScopeKey: null,
  enterEpisode: (index, projectId) => set({
    activeEpisodeIndex: index,
    activeEpisodeScopeKey: projectId ? `${projectId}::ep-${index}` : `default::ep-${index}`,
    activeTab: "script",
    activeStage: "script",
    inProject: true,
  }),
  backToSeries: () => set({
    activeEpisodeIndex: null,
    activeEpisodeScopeKey: null,
    activeTab: "overview",
  }),
  highlightMediaId: null,
  requestRevealMedia: (mediaId) =>
    set({ activeTab: "media", highlightMediaId: mediaId }),
  clearHighlight: () => set({ highlightMediaId: null }),
  // Cross-panel data passing
  pendingDirectorData: null,
  setPendingDirectorData: (data) => set({ pendingDirectorData: data }),
  goToDirectorWithData: (data) => set({
    pendingDirectorData: data,
    activeTab: "director",
    activeStage: "director",
    inProject: true,
  }),
  // Character library data passing
  pendingCharacterData: null,
  setPendingCharacterData: (data) => set({ pendingCharacterData: data }),
  goToCharacterWithData: (data) => set({
    pendingCharacterData: data,
    activeTab: "characters",
    activeStage: "assets",
    inProject: true,
  }),
  // Scene library data passing
  pendingSceneData: null,
  setPendingSceneData: (data) => set({ pendingSceneData: data }),
  goToSceneWithData: (data) => set({
    pendingSceneData: data,
    activeTab: "scenes",
    activeStage: "assets",
    inProject: true,
  }),
}));

// Reset the middle preview column whenever the active tab changes.
// Catches every path that flips activeTab (setActiveTab, setActiveStage, enterEpisode,
// backToSeries, requestRevealMedia, goTo*WithData) without sprinkling resets at each call site.
useMediaPanelStore.subscribe((state, prev) => {
  if (state.activeTab !== prev.activeTab) {
    // setPreviewItem(null) also clears the playlist, so one call covers both.
    usePreviewStore.getState().setPreviewItem(null);
  }
});
