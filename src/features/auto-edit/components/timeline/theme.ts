import type { TrackType } from "../../types";

/** Maps each track type to the app's `--timeline-*` HSL triple token. */
export const TRACK_COLOR_VAR: Record<TrackType, string> = {
  video: "--timeline-video",
  audio: "--timeline-audio",
  text: "--timeline-text",
  effect: "--timeline-effect",
};

/** Resolve a track type to a CSS `hsl()` color, with optional alpha. */
export function trackColor(type: TrackType, alpha = 1): string {
  return `hsl(var(${TRACK_COLOR_VAR[type]}) / ${alpha})`;
}
