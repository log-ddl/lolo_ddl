/**
 * Render plan IR — shared between the renderer (which resolves the project into
 * this plan) and the main-process ffmpeg pipeline (which consumes it).
 *
 * Pure types only (no runtime imports) so `electron/` can `import type` from here
 * without dragging renderer code into the main bundle.
 *
 * Time is in seconds for ffmpeg (the editor's integer-ms model is converted at
 * plan-build time). `posX`/`posY` are the element center offset from the canvas
 * center, in logical pixels — the same convention as `lib/transform.ts`.
 */

import type { MotionEffectType } from "../types";

export interface LayerLayout {
  /** Timeline start, seconds. */
  startSec: number;
  /** Timeline duration, seconds. */
  durSec: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  posX: number;
  posY: number;
  opacity: number;
  /** Gaussian blur sigma (0 = none). */
  blurSigma: number;
  blendMode: string;
}

export interface MediaVisualLayer extends LayerLayout {
  kind: "video" | "image";
  path: string;
  /** Source seek point, seconds. */
  trimStartSec: number;
  /** Source duration to read after the seek, seconds. */
  srcDurSec: number;
  /** Retime rate (1 = normal). Images always use 1. */
  rate: number;
  /** How the media fills the canvas: contain | cover | stretch. */
  fit: "contain" | "cover" | "stretch";
  /** Ken Burns–style motion effect (zoom/pan), or "none". */
  motionEffect: MotionEffectType;
  /** Crossfade into the next layer (same track) — ffmpeg `xfade` transition name. */
  transitionToNext?: { xfade: string; durationSec: number };
}

export interface TextVisualLayer extends LayerLayout {
  kind: "text";
  /** Rasterized RGBA PNG data URL, laid out at the text's intrinsic size. */
  pngDataUrl: string;
}

export type VisualLayer = MediaVisualLayer | TextVisualLayer;

export interface RenderAudioInput {
  path: string;
  trimStartSec: number;
  srcDurSec: number;
  rate: number;
  /** Timeline start in milliseconds (adelay). */
  startMs: number;
  volume: number;
}

/**
 * An effect living on its own timeline track rather than on a clip. It applies to
 * the *composited* frame — everything stacked below it — for its time window, so
 * the pipeline appends it after all overlays instead of into a layer's chain.
 */
export interface SceneEffect {
  type: string;
  startSec: number;
  durSec: number;
  /** Gaussian blur sigma (0 = none). */
  blurSigma: number;
}

export interface RenderPlan {
  width: number;
  height: number;
  /** Frames per second (float, e.g. 30 or 29.97). */
  fps: number;
  /** Background color as `0xRRGGBB`. */
  backgroundColor: string;
  durationSec: number;
  visual: VisualLayer[];
  audio: RenderAudioInput[];
  /** Track-level effects applied to the finished composite, in stacking order. */
  sceneEffects: SceneEffect[];
}

export interface RenderProgressEvent {
  jobId: string;
  type: "stage" | "progress" | "log";
  stage?: "preparing" | "rendering" | "done" | "error";
  percent?: number;
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Export settings                                                    */
/* ------------------------------------------------------------------ */

export type ExportCodec = "libx264" | "libx265" | "h264_nvenc";

/** Encode-level overrides applied on top of the resolved `RenderPlan`. */
export interface ExportOptions {
  codec: ExportCodec;
  /** Quality: CRF for x264/x265 (0–51), CQ for nvenc (0–51). */
  crf: number;
  /** Explicit output resolution in px (already even). Omit = canvas size. */
  outputWidth?: number;
  outputHeight?: number;
}
