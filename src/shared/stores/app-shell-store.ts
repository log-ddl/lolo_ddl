import { create } from "zustand";

export type AppFeatureId = "video-studio" | "content-chat" | "research-monitor" | "tts-voice" | "auto-edit";

interface AppShellState {
  activeFeatureId: AppFeatureId | null;
  settingsOpen: boolean;
  openFeature: (featureId: AppFeatureId) => void;
  goHome: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
}

/** Global navigation only. Each feature owns its own internal tabs and projects. */
export const useAppShellStore = create<AppShellState>((set) => ({
  activeFeatureId: null,
  settingsOpen: false,
  openFeature: (activeFeatureId) => set({ activeFeatureId, settingsOpen: false }),
  goHome: () => set({ activeFeatureId: null, settingsOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
