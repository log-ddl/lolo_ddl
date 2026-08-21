import type { MotionEffectType } from "../types";

/**
 * Ken Burns–style motion effects (zoom/pan), ported from video-studio's
 * `AUTO_VIDEO_MEDIA_EFFECTS` + `buildMotionFilter`. Each effect is a single
 * per-clip choice; the ffmpeg renderer maps it to a `zoompan` filter and the DOM
 * preview reproduces it with a CSS `scale` + `transform-origin`.
 */

export interface MotionEffectDefinition {
  type: MotionEffectType;
  label: string;
}

export const MOTION_EFFECTS: MotionEffectDefinition[] = [
  { type: "none", label: "None" },
  { type: "zoom_in", label: "Zoom in" },
  { type: "zoom_out", label: "Zoom out" },
  { type: "pan_left", label: "Pan left" },
  { type: "pan_right", label: "Pan right" },
  { type: "pan_up", label: "Pan up" },
  { type: "pan_down", label: "Pan down" },
  { type: "zoom_pan_left", label: "Zoom + pan left" },
  { type: "zoom_pan_right", label: "Zoom + pan right" },
];

export function motionEffectLabel(type: MotionEffectType | undefined): string {
  return MOTION_EFFECTS.find((m) => m.type === type)?.label ?? "None";
}

/** The fixed zoom level for pan-only effects (matches ffmpeg's `z=1.12`). */
const PAN_ZOOM = 1.12;
/** Zoom-pan effect's zoom range. Start at 1.08 instead of 1.04 so the pan's
 * per-frame x displacement never drops below one pixel — sub-pixel steps made
 * the start of zoom_pan_* jitter in the zoompan render. */
const ZOOM_PAN_START = 1.08;
const ZOOM_PAN_END = 1.14;

/**
 * Resolve a motion effect into a CSS `scale` + `transform-origin` at progress
 * `p` (0..1), mirroring the `zoompan` expressions so the DOM preview matches the
 * render. `originX`/`originY` are normalized crop-centre coordinates (0..1).
 */
export function resolveMotionTransform(
  effect: MotionEffectType | undefined,
  p: number,
): { scale: number; originX: number; originY: number } {
  const t = Math.max(0, Math.min(1, p));
  let z = 1;
  let cx = 0.5;
  let cy = 0.5;

  switch (effect) {
    case "none":
    case undefined:
      break;
    case "zoom_in":
      z = 1 + 0.12 * t;
      break;
    case "zoom_out":
      z = 1.12 - 0.12 * t;
      break;
    case "pan_left":
      z = PAN_ZOOM;
      cx = (1 - 1 / z) * (1 - t) + 1 / (2 * z);
      break;
    case "pan_right":
      z = PAN_ZOOM;
      cx = (1 - 1 / z) * t + 1 / (2 * z);
      break;
    case "pan_up":
      z = PAN_ZOOM;
      cy = (1 - 1 / z) * (1 - t) + 1 / (2 * z);
      break;
    case "pan_down":
      z = PAN_ZOOM;
      cy = (1 - 1 / z) * t + 1 / (2 * z);
      break;
    case "zoom_pan_left":
      z = ZOOM_PAN_START + (ZOOM_PAN_END - ZOOM_PAN_START) * t;
      cx = (1 - 1 / z) * (1 - t) + 1 / (2 * z);
      break;
    case "zoom_pan_right":
      z = ZOOM_PAN_START + (ZOOM_PAN_END - ZOOM_PAN_START) * t;
      cx = (1 - 1 / z) * t + 1 / (2 * z);
      break;
  }

  return { scale: z, originX: cx, originY: cy };
}
