import type { TProject } from "../types";

/**
 * Undo/redo — snapshot-stack command model.
 *
 * Every mutation is expressed as a pure `apply(project) => project` transformer.
 * The store keeps `past`/`future` stacks of full project snapshots (they are
 * small JSON documents — path references, not media blobs), so undo/redo is a
 * simple pointer swap with no inverse functions to keep in sync.
 */

export const HISTORY_LIMIT = 100;

export interface EditorCommand {
  id: string;
  /** Human-readable label for the undo/redo tooltip. */
  label: string;
  /** Pure transform. Must not mutate the input project. */
  apply: (project: TProject) => TProject;
}

export interface HistoryState {
  past: TProject[];
  future: TProject[];
}

export function emptyHistory(): HistoryState {
  return { past: [], future: [] };
}

/** Execute a command against the current project, pushing a snapshot onto `past`. */
export function pushHistory(
  history: HistoryState,
  project: TProject,
): HistoryState {
  const past = [...history.past, project].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

/** Undo: move present → future, restore latest past. Returns null if nothing to undo. */
export function undoHistory(
  history: HistoryState,
  project: TProject,
): { project: TProject; history: HistoryState } | null {
  if (history.past.length === 0) return null;
  const past = history.past.slice();
  const previous = past.pop()!;
  const future = [project, ...history.future];
  return { project: previous, history: { past, future } };
}

/** Redo: move present → past, restore earliest future. Returns null if nothing to redo. */
export function redoHistory(
  history: HistoryState,
  project: TProject,
): { project: TProject; history: HistoryState } | null {
  if (history.future.length === 0) return null;
  const [next, ...rest] = history.future;
  const past = [...history.past, project].slice(-HISTORY_LIMIT);
  return { project: next, history: { past, future: rest } };
}
