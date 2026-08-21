import { create } from "zustand";
import { createDefaultProject } from "../defaults";
import { getScene, updateCurrentScene } from "../lib/mutate";
import { applyRippleAdjustments, computeRippleAdjustments } from "../lib/ripple";
import type { EditorSelection, MediaAsset, TProject } from "../types";
import {
  emptyHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type EditorCommand,
  type HistoryState,
} from "./history";

/**
 * The Auto Edit editor store — the single source of truth for the open project,
 * its undo/redo history, the imported-media registry, and the current selection.
 *
 * Every mutation goes through `execute(command)` so it is recorded for undo.
 * Ephemeral UI state (playhead, zoom, panel sizes) lives in separate stores.
 */

interface EditorState {
  project: TProject | null;
  history: HistoryState;
  mediaAssets: Record<string, MediaAsset>;
  selection: EditorSelection;
  /** Label of the most recent command, for the undo button tooltip. */
  lastCommandLabel: string | null;
  /** Ripple mode: when on, deleting/trimming slides later clips left to close the gap. */
  rippleEnabled: boolean;

  /* --- project lifecycle --- */
  newProject: (name?: string) => void;
  loadProject: (project: TProject) => void;

  /* --- command / undo-redo --- */
  execute: (command: EditorCommand, selection?: EditorSelection) => void;
  undo: () => void;
  redo: () => void;
  resetHistory: () => void;

  /* --- selection --- */
  setSelection: (selection: EditorSelection) => void;
  setRippleEnabled: (enabled: boolean) => void;

  /* --- scenes --- */
  setCurrentScene: (sceneId: string) => void;

  /* --- media registry --- */
  registerMediaAsset: (asset: MediaAsset) => void;
  removeMediaAsset: (path: string) => void;
  clearMediaAssets: () => void;
}

const EMPTY_SELECTION: EditorSelection = { elements: [], keyframes: [] };

export const useEditorStore = create<EditorState>()((set) => ({
  project: null,
  history: emptyHistory(),
  mediaAssets: {},
  selection: EMPTY_SELECTION,
  lastCommandLabel: null,
  rippleEnabled: true,

  newProject: (name) =>
    set({
      project: createDefaultProject(name),
      history: emptyHistory(),
      selection: EMPTY_SELECTION,
      lastCommandLabel: null,
    }),

  loadProject: (project) =>
    set({
      project,
      history: emptyHistory(),
      selection: EMPTY_SELECTION,
      lastCommandLabel: null,
    }),

  execute: (command, selection) =>
    set((state) => {
      if (!state.project) return state;
      const beforeTracks = state.rippleEnabled
        ? getScene(state.project).tracks
        : null;
      const applied = command.apply(state.project);
      const next = beforeTracks
        ? applyRipple({
            project: applied,
            beforeTracks,
            afterTracks: getScene(applied).tracks,
          })
        : applied;
      return {
        project: next,
        history: pushHistory(state.history, state.project),
        selection: selection ?? state.selection,
        lastCommandLabel: command.label,
      };
    }),

  undo: () =>
    set((state) => {
      if (!state.project) return state;
      const result = undoHistory(state.history, state.project);
      if (!result) return state;
      return { project: result.project, history: result.history };
    }),

  redo: () =>
    set((state) => {
      if (!state.project) return state;
      const result = redoHistory(state.history, state.project);
      if (!result) return state;
      return { project: result.project, history: result.history };
    }),

  resetHistory: () => set({ history: emptyHistory() }),

  setSelection: (selection) => set({ selection }),

  setRippleEnabled: (rippleEnabled) => set({ rippleEnabled }),

  setCurrentScene: (sceneId) =>
    set((state) => {
      if (!state.project || !state.project.scenes.some((s) => s.id === sceneId)) {
        return state;
      }
      return {
        project: { ...state.project, currentSceneId: sceneId },
        // Selection refers to elements in the previous scene.
        selection: EMPTY_SELECTION,
      };
    }),

  registerMediaAsset: (asset) =>
    set((state) => ({ mediaAssets: { ...state.mediaAssets, [asset.path]: asset } })),

  removeMediaAsset: (path) =>
    set((state) => {
      const mediaAssets = { ...state.mediaAssets };
      delete mediaAssets[path];
      return { mediaAssets };
    }),

  clearMediaAssets: () => set({ mediaAssets: {} }),
}));

/* ------------------------------------------------------------------ */
/* Ripple                                                             */
/* ------------------------------------------------------------------ */

/**
 * After a command mutates the active scene, slide later clips left to fill any
 * space the command freed (deleted/trimmed). Returns the project unchanged when
 * there is nothing to ripple.
 */
function applyRipple({
  project,
  beforeTracks,
  afterTracks,
}: {
  project: TProject;
  beforeTracks: ReturnType<typeof getScene>["tracks"];
  afterTracks: ReturnType<typeof getScene>["tracks"];
}): TProject {
  const adjustments = computeRippleAdjustments({ beforeTracks, afterTracks });
  if (adjustments.length === 0) {
    return project;
  }
  const tracksWithRipple = applyRippleAdjustments({ tracks: afterTracks, adjustments });
  return updateCurrentScene(project, (scene) => ({ ...scene, tracks: tracksWithRipple }));
}

/* ------------------------------------------------------------------ */
/* Selectors (derived)                                                */
/* ------------------------------------------------------------------ */

export function getProject(): TProject | null {
  return useEditorStore.getState().project;
}

export function useCanUndo(): boolean {
  return useEditorStore((s) => s.history.past.length > 0);
}

export function useCanRedo(): boolean {
  return useEditorStore((s) => s.history.future.length > 0);
}

export function useUndoLabel(): string | null {
  return useEditorStore((s) =>
    s.history.past.length > 0 ? s.lastCommandLabel : null,
  );
}
