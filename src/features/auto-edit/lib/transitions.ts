import type { TransitionType } from "../types";

/**
 * Crossfade transitions between adjacent clips. Ported from video-studio's
 * `AUTO_VIDEO_TRANSITIONS` + `getXfadeProfile`: `xfade` is the ffmpeg `transition=`
 * name used at render time, and `durationMs` is the default crossfade length
 * (overridable in the inspector). The editor preview approximates every transition
 * with an opacity crossfade.
 */
export interface TransitionDefinition {
  type: TransitionType;
  /** Human-readable label. */
  label: string;
  /** ffmpeg `xfade` transition name. */
  xfade: string;
  /** Default crossfade length (ms). */
  durationMs: number;
}

export const TRANSITIONS: TransitionDefinition[] = [
  { type: "none", label: "None", xfade: "", durationMs: 0 },
  { type: "fade", label: "Fade", xfade: "fade", durationMs: 350 },
  { type: "fade_slow", label: "Fade (slow)", xfade: "fadeslow", durationMs: 650 },
  { type: "dip_white", label: "Dip to white", xfade: "fadewhite", durationMs: 350 },
  { type: "flash_white", label: "Flash white", xfade: "fadewhite", durationMs: 140 },
  { type: "dissolve", label: "Dissolve", xfade: "dissolve", durationMs: 450 },
  { type: "fade_black", label: "Fade to black", xfade: "fadeblack", durationMs: 450 },
  { type: "fade_white", label: "Fade to white", xfade: "fadewhite", durationMs: 400 },
  { type: "wipe_left", label: "Wipe left", xfade: "wipeleft", durationMs: 400 },
  { type: "wipe_right", label: "Wipe right", xfade: "wiperight", durationMs: 400 },
  { type: "wipe_up", label: "Wipe up", xfade: "wipeup", durationMs: 400 },
  { type: "wipe_down", label: "Wipe down", xfade: "wipedown", durationMs: 400 },
  { type: "slide_left", label: "Slide left", xfade: "slideleft", durationMs: 450 },
  { type: "slide_right", label: "Slide right", xfade: "slideright", durationMs: 450 },
  { type: "smooth_left", label: "Smooth left", xfade: "smoothleft", durationMs: 500 },
  { type: "smooth_right", label: "Smooth right", xfade: "smoothright", durationMs: 500 },
  { type: "circle_open", label: "Circle open", xfade: "circleopen", durationMs: 450 },
  { type: "circle_close", label: "Circle close", xfade: "circleclose", durationMs: 450 },
  { type: "pixelize", label: "Pixelize", xfade: "pixelize", durationMs: 350 },
  { type: "zoom_in", label: "Zoom in", xfade: "zoomin", durationMs: 450 },
];

export function transitionDefinition(type: TransitionType): TransitionDefinition {
  return TRANSITIONS.find((t) => t.type === type) ?? TRANSITIONS[0];
}

export function xfadeName(type: TransitionType): string {
  return transitionDefinition(type).xfade || "fade";
}

/** Default crossfade length for a transition type. */
export function defaultDurationMs(type: TransitionType): number {
  return transitionDefinition(type).durationMs;
}

export const DEFAULT_TRANSITION_DURATION_MS = 500;
