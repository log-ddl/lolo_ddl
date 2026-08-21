import { resolveAnimatedParams } from "../lib/animation";
import { blurIntensityToPx } from "../lib/effects";
import { getScene } from "../lib/mutate";
import { getProjectDurationMs } from "../lib/project";
import { frameRateToFloat } from "../lib/time";
import { getElementTransform, getMediaFit } from "../lib/transform";
import { xfadeName } from "../lib/transitions";
import type {
  AudioElement,
  ImageElement,
  TextElement,
  TProject,
  VideoElement,
  VisualElement,
} from "../types";
import type { MediaVisualLayer, RenderAudioInput, RenderPlan, SceneEffect } from "./types";

/**
 * Text layers are rasterized to a PNG in a second async pass (canvas), so the
 * plan builder emits a text "spec" carrying its style + layout. `render.ts`
 * rasterizes each spec into a `TextVisualLayer` (see `rasterize.ts`).
 */
export interface TextLayerSpec {
  content: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  startSec: number;
  durSec: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  posX: number;
  posY: number;
  opacity: number;
  blurSigma: number;
  blendMode: string;
}

export interface RenderPlanDraft {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
  durationSec: number;
  /** Media layers in composite order (main first = bottom, overlays stacked above). */
  visual: Array<MediaVisualLayer | TextLayerSpec>;
  audio: RenderAudioInput[];
  /** Effect-track entries applied to the finished composite. */
  sceneEffects: SceneEffect[];
}

/** Build a render plan from the current project. Text layers come back as specs. */
export function buildRenderPlan(project: TProject): RenderPlanDraft {
  const scene = getScene(project);
  const tracks = scene.tracks;
  const canvas = project.settings.canvasSize;
  const fps = frameRateToFloat(project.settings.fps);
  // Give an otherwise-empty project at least 1s so ffmpeg has something to encode.
  const durationMs = Math.max(1000, getProjectDurationMs(project));
  const backgroundColor =
    project.settings.background.type === "color"
      ? hexToFfmpegColor(project.settings.background.color)
      : "0x000000";

  const visual: Array<MediaVisualLayer | TextLayerSpec> = [];
  const audio: RenderAudioInput[] = [];

  // Visual tracks in composite order (bottom→top): the main track is the base,
  // overlay tracks stack above it (overlay[0] is topmost, matching opencut).
  const visibleOverlays = tracks.overlay.filter((t) => !t.hidden);
  const visualTracks = [
    ...(tracks.main.hidden ? [] : [tracks.main]),
    ...visibleOverlays.slice().reverse(),
  ];

  for (const track of visualTracks) {
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);

    // Track the previous media layer so a `transitionToNext` on it can be attached
    // to the outgoing layer in the plan.
    let prevMediaEl: VideoElement | ImageElement | null = null;
    let prevMediaIndex = -1;
    const linkTransition = (from: VideoElement | ImageElement, to: VideoElement | ImageElement) => {
      const tr = from.transitionToNext;
      if (!tr || tr.type === "none" || prevMediaIndex < 0) return;
      const dSec = Math.max(0, Math.min(tr.durationMs, from.duration, to.duration)) / 1000;
      if (dSec <= 0) return;
      const layer = visual[prevMediaIndex] as MediaVisualLayer | undefined;
      if (layer && (layer.kind === "video" || layer.kind === "image")) {
        visual[prevMediaIndex] = {
          ...layer,
          transitionToNext: { xfade: xfadeName(tr.type), durationSec: dSec },
        };
      }
    };

    for (const el of sorted) {
      if (el.hidden) continue;

      if (el.type === "video") {
        const layer = videoLayer(el);
        if (layer) {
          if (prevMediaEl) linkTransition(prevMediaEl, el);
          prevMediaIndex = visual.length;
          prevMediaEl = el;
          visual.push(layer);
        }
        if (el.isSourceAudioEnabled !== false && track.type === "video" && !track.muted) {
          const a = audioOf(el, el.mediaPath);
          if (a) audio.push(a);
        }
      } else if (el.type === "image") {
        const layer = imageLayer(el);
        if (layer) {
          if (prevMediaEl) linkTransition(prevMediaEl, el);
          prevMediaIndex = visual.length;
          prevMediaEl = el;
          visual.push(layer);
        }
      } else if (el.type === "text") {
        visual.push(textSpec(el));
      }
    }
  }

  // Audio tracks.
  for (const track of tracks.audio) {
    if (track.muted) continue;
    for (const el of track.elements) {
      if (el.sourceType !== "upload" || !el.mediaPath) continue;
      const a = audioOf(el, el.mediaPath);
      if (a) audio.push(a);
    }
  }

  // Effect tracks apply to the composited frame (everything below them), not to a
  // single clip, so they are collected separately from the per-layer chains.
  const sceneEffects: SceneEffect[] = [];
  for (const track of tracks.overlay) {
    if (track.type !== "effect" || track.hidden) continue;
    for (const el of track.elements) {
      if (el.hidden || el.duration <= 0) continue;
      sceneEffects.push({
        type: el.effectType,
        startSec: el.startTime / 1000,
        durSec: el.duration / 1000,
        blurSigma:
          el.effectType === "blur" ? blurIntensityToPx(num(el.params.intensity, 0)) / 2 : 0,
      });
    }
  }

  return {
    width: canvas.width,
    height: canvas.height,
    fps,
    backgroundColor,
    durationSec: durationMs / 1000,
    visual,
    audio,
    sceneEffects,
  };
}

/** Assemble the final (IPC-ready) plan given rasterized text layer data URLs. */
export function finalizePlan(draft: RenderPlanDraft, textDataUrls: string[]): RenderPlan {
  let textIndex = 0;
  const visual = draft.visual.map((layer) => {
    if (isTextSpec(layer)) {
      const pngDataUrl = textDataUrls[textIndex++];
      return {
        kind: "text" as const,
        pngDataUrl,
        startSec: layer.startSec,
        durSec: layer.durSec,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        rotateDeg: layer.rotateDeg,
        posX: layer.posX,
        posY: layer.posY,
        opacity: layer.opacity,
        blurSigma: layer.blurSigma,
        blendMode: layer.blendMode,
      };
    }
    return layer;
  });

  return {
    width: draft.width,
    height: draft.height,
    fps: draft.fps,
    backgroundColor: draft.backgroundColor,
    durationSec: draft.durationSec,
    visual,
    audio: draft.audio,
    sceneEffects: draft.sceneEffects,
  };
}

/* ------------------------------------------------------------------ */
/* Layer builders                                                      */
/* ------------------------------------------------------------------ */

export function isTextSpec(layer: MediaVisualLayer | TextLayerSpec): layer is TextLayerSpec {
  return !("kind" in layer);
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function resolveSourceDuration(
  el: { duration: number; trimStart: number; trimEnd: number; sourceDuration?: number },
  rate: number,
): number {
  if (el.sourceDuration != null && el.sourceDuration > 0) return el.sourceDuration;
  return el.duration * rate + el.trimStart + el.trimEnd;
}

/** Gaussian blur intensity (0–100) → ffmpeg `gblur` sigma, mirroring the CSS preview. */
function blurSigmaOf(el: VisualElement): number {
  const intensity = (el.effects ?? [])
    .filter((e) => e.enabled && e.type === "blur")
    .reduce((m, e) => Math.max(m, num(e.params.intensity, 0)), 0);
  // CSS `filter: blur(Rpx)` is ~2σ, so σ ≈ R/2.
  return blurIntensityToPx(intensity) / 2;
}

function videoLayer(el: VideoElement): MediaVisualLayer | null {
  const params = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(params);
  const rate = el.retime?.rate ?? 1;
  const sourceDurationMs = resolveSourceDuration(el, rate);
  const trimmedMs = sourceDurationMs - el.trimStart - el.trimEnd;
  if (!el.mediaPath || trimmedMs <= 0 || el.duration <= 0) return null;
  return {
    kind: "video",
    path: el.mediaPath,
    trimStartSec: el.trimStart / 1000,
    srcDurSec: trimmedMs / 1000,
    rate,
    fit: getMediaFit(params),
    motionEffect: el.motionEffect ?? "none",
    startSec: el.startTime / 1000,
    durSec: el.duration / 1000,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode,
  };
}

function imageLayer(el: ImageElement): MediaVisualLayer | null {
  const params = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(params);
  if (!el.mediaPath || el.duration <= 0) return null;
  return {
    kind: "image",
    path: el.mediaPath,
    trimStartSec: 0,
    srcDurSec: el.duration / 1000,
    rate: 1,
    fit: getMediaFit(params),
    motionEffect: el.motionEffect ?? "none",
    startSec: el.startTime / 1000,
    durSec: el.duration / 1000,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode,
  };
}

function textSpec(el: TextElement): TextLayerSpec {
  const p = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(p);
  return {
    content: typeof p.content === "string" ? p.content : "",
    fontSize: num(p.fontSize, 96),
    color: typeof p.color === "string" ? p.color : "#ffffff",
    fontFamily: typeof p.fontFamily === "string" ? p.fontFamily : "Arial",
    fontWeight: typeof p.fontWeight === "string" ? p.fontWeight : "normal",
    fontStyle: typeof p.fontStyle === "string" ? p.fontStyle : "normal",
    textAlign: typeof p.textAlign === "string" ? p.textAlign : "center",
    startSec: el.startTime / 1000,
    durSec: el.duration / 1000,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode,
  };
}

function audioOf(
  el: AudioElement | VideoElement,
  path: string,
): RenderAudioInput | null {
  const rate = el.retime?.rate ?? 1;
  const sourceDurationMs = resolveSourceDuration(el, rate);
  const trimmedMs = sourceDurationMs - el.trimStart - el.trimEnd;
  if (!path || trimmedMs <= 0 || el.duration <= 0) return null;
  return {
    path,
    trimStartSec: el.trimStart / 1000,
    srcDurSec: trimmedMs / 1000,
    rate,
    startMs: el.startTime,
    volume: elementVolume(el),
  };
}

/** Per-clip volume in dB (`params.volume`, opencut scale −60…20), mapped to linear gain. */
function elementVolume(el: AudioElement | VideoElement): number {
  if (el.params.muted === true) return 0;
  const db = typeof el.params.volume === "number" ? el.params.volume : 0;
  const clamped = Math.min(20, Math.max(-60, db));
  return Math.pow(10, clamped / 20);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function hexToFfmpegColor(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex.trim());
  if (!m) return "0x000000";
  return `0x${m[1]}`;
}
