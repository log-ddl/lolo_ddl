import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fileStorage } from "@/shared/lib/indexed-db-storage";

export type UILanguage = "en" | "vi";

interface UIPreferencesState {
  uiLanguage: UILanguage;
  setUILanguage: (language: UILanguage) => void;
}

const UI_PREFERENCES_KEY = "longdd-ui-preferences";
const LEGACY_APP_SETTINGS_KEY = "longdd-app-settings";

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      uiLanguage: "en",
      setUILanguage: (uiLanguage) => set({ uiLanguage }),
    }),
    {
      name: UI_PREFERENCES_KEY,
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({ uiLanguage: state.uiLanguage }),
    },
  ),
);

/** Preserve the language selected before Video Studio settings were separated. */
export async function migrateUIPreferencesFromLegacy(): Promise<void> {
  await useUIPreferencesStore.persist.rehydrate();
  const current = await fileStorage.getItem(UI_PREFERENCES_KEY);
  if (current) return;

  const legacy = await fileStorage.getItem(LEGACY_APP_SETTINGS_KEY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy);
    const language = parsed?.state?.uiLanguage ?? parsed?.uiLanguage;
    if (language === "en" || language === "vi") {
      useUIPreferencesStore.getState().setUILanguage(language);
    }
  } catch (error) {
    console.warn("[UIPreferences] Could not migrate legacy language:", error);
  }
}
