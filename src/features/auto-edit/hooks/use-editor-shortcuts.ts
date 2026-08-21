import { useEffect } from "react";
import { translate } from "@/shared/i18n";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";
import {
  duplicateElementsCommand,
  removeElementsCommand,
  splitElementCommand,
} from "../commands";
import { loadProject, newProject, saveProject } from "../lib/project-io";
import { useEditorStore } from "../store/editor-store";
import { useTimelineViewStore } from "../store/timeline-view-store";

function t(key: string): string {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}

function deleteSelected(): void {
  const state = useEditorStore.getState();
  const refs = state.selection.elements;
  if (refs.length === 0 || !state.project) return;
  state.execute(removeElementsCommand(refs, t("autoEdit.delete")), {
    elements: [],
    keyframes: [],
  });
}

function splitSelected(): void {
  const state = useEditorStore.getState();
  if (!state.project || state.selection.elements.length === 0) return;
  const playheadMs = useTimelineViewStore.getState().playheadMs;
  for (const ref of state.selection.elements) {
    state.execute(splitElementCommand(ref, playheadMs, t("autoEdit.split")));
  }
}

function duplicateSelected(): void {
  const state = useEditorStore.getState();
  const refs = state.selection.elements;
  if (refs.length === 0 || !state.project) return;
  const { command, refs: copies } = duplicateElementsCommand(refs, t("autoEdit.duplicate"));
  state.execute(command, { elements: copies, keyframes: [] });
}

/**
 * Global keyboard shortcuts for the Auto Edit editor. Mounted once by the shell.
 * Ignores events originating from editable fields so typing is never hijacked.
 */
export function useEditorShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) useEditorStore.getState().redo();
        else useEditorStore.getState().undo();
        return;
      }
      if (mod && key === "y") {
        event.preventDefault();
        useEditorStore.getState().redo();
        return;
      }
      if (mod && key === "s") {
        event.preventDefault();
        void saveProject();
        return;
      }
      if (mod && key === "o") {
        event.preventDefault();
        void loadProject();
        return;
      }
      if (mod && key === "n") {
        event.preventDefault();
        newProject();
        return;
      }
      if (mod && key === "d") {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (editable) return;
      if (event.key === " ") {
        event.preventDefault();
        const store = useTimelineViewStore.getState();
        store.setPlaying(!store.isPlaying);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (key === "s") {
        event.preventDefault();
        splitSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
