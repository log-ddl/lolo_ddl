import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fileStorage } from "@/shared/lib/indexed-db-storage";

/**
 * Editor panel UI state — which tabs are open and whether the side panels are
 * collapsed. Persisted so the user's layout survives restarts.
 */

export type AssetsTab =
  | "media"
  | "text"
  | "effects"
  | "transitions"
  | "captions"
  | "auto";
export type PropertiesTab = "transform" | "audio" | "speed" | "blending" | "masks" | "effects";

interface PanelState {
  assetsTab: AssetsTab;
  propertiesTab: PropertiesTab;
  isAssetsPanelOpen: boolean;
  isPropertiesPanelOpen: boolean;
  /** Which element id is being inspected, if any. */
  inspectedElementId: string | null;

  setAssetsTab: (tab: AssetsTab) => void;
  setPropertiesTab: (tab: PropertiesTab) => void;
  setAssetsPanelOpen: (open: boolean) => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  setInspectedElementId: (id: string | null) => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      assetsTab: "media",
      propertiesTab: "transform",
      isAssetsPanelOpen: true,
      isPropertiesPanelOpen: true,
      inspectedElementId: null,

      setAssetsTab: (assetsTab) => set({ assetsTab }),
      setPropertiesTab: (propertiesTab) => set({ propertiesTab }),
      setAssetsPanelOpen: (isAssetsPanelOpen) => set({ isAssetsPanelOpen }),
      setPropertiesPanelOpen: (isPropertiesPanelOpen) => set({ isPropertiesPanelOpen }),
      setInspectedElementId: (inspectedElementId) => set({ inspectedElementId }),
    }),
    {
      name: "logdd-auto-edit-panel-store",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        assetsTab: state.assetsTab,
        propertiesTab: state.propertiesTab,
        isAssetsPanelOpen: state.isAssetsPanelOpen,
        isPropertiesPanelOpen: state.isPropertiesPanelOpen,
      }),
    },
  ),
);
