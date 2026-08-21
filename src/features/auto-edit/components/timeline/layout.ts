/**
 * Timeline layout constants (pixels / milliseconds).
 *
 * The measurements mirror opencut-classic's `timeline/components/layout.ts` so the
 * timeline reads at the same density: a narrow label column, a short ruler, and
 * per-type track heights (video rows are tall enough for thumbnails, text/effect
 * rows are thin lanes).
 */

import type { TrackType } from "../../types";

export const RULER_HEIGHT = 22;
export const TRACK_HEADER_WIDTH = 112;
export const TRACK_GAP = 6;
export const CLIP_RADIUS = 6;
/** Trim handle width on each clip edge. */
export const TRIM_HANDLE_WIDTH = 8;
/** Minimum number of milliseconds of content shown even on an empty timeline. */
export const MIN_CONTENT_MS = 10000;
/** Extra horizontal padding so the last clip isn't flush against the edge. */
export const CONTENT_RIGHT_PADDING_PX = 240;

export const TRACK_HEIGHTS: Record<TrackType, number> = {
  video: 65,
  audio: 50,
  text: 25,
  effect: 25,
};

export function trackHeight(type: TrackType): number {
  return TRACK_HEIGHTS[type];
}
