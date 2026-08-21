import { create } from "zustand";

/** Auto Edit top-level view: the project dashboard or the editor. */
export type AutoEditView = "dashboard" | "editor";

interface ViewState {
  view: AutoEditView;
  setView: (view: AutoEditView) => void;
}

export const useAutoEditViewStore = create<ViewState>()((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
}));
