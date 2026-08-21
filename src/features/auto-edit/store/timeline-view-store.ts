import { create } from "zustand";
import { ZERO_MS } from "../lib/time";

/**
 * Ephemeral timeline view state — playhead, zoom, and transient drag flags.
 * Deliberately NOT part of the editor store (and never in undo history).
 */

/** Pixels per second at 1x zoom. */
export const BASE_PPS = 50;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 8;

export function pixelsPerSecond(zoomLevel: number): number {
  return BASE_PPS * zoomLevel;
}

export function msToPx(ms: number, zoomLevel: number): number {
  return (ms / 1000) * pixelsPerSecond(zoomLevel);
}

export function pxToMs(px: number, zoomLevel: number): number {
  return (px / pixelsPerSecond(zoomLevel)) * 1000;
}

interface TimelineViewState {
  playheadMs: number;
  zoomLevel: number;
  isPlaying: boolean;
  /** Element currently being dragged (trackId:elementId), if any. */
  draggingRef: string | null;

  setPlayhead: (ms: number) => void;
  setZoom: (level: number) => void;
  zoomBy: (factor: number) => void;
  setPlaying: (playing: boolean) => void;
  setDraggingRef: (ref: string | null) => void;
  reset: () => void;
}

export const useTimelineViewStore = create<TimelineViewState>()((set) => ({
  playheadMs: ZERO_MS,
  zoomLevel: 1,
  isPlaying: false,
  draggingRef: null,

  setPlayhead: (ms) => set({ playheadMs: Math.max(0, ms) }),
  setZoom: (level) => set({ zoomLevel: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level)) }),
  zoomBy: (factor) =>
    set((state) => ({
      zoomLevel: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoomLevel * factor)),
    })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setDraggingRef: (draggingRef) => set({ draggingRef }),
  reset: () => set({ playheadMs: ZERO_MS, zoomLevel: 1, isPlaying: false, draggingRef: null }),
}));
