import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Maximize, Minimize, Pause, Play } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { resolveAnimatedParams } from "../../lib/animation";
import { blurIntensityToPx } from "../../lib/effects";
import { resolveMaskClipPath } from "../../lib/masks";
import { resolveMotionTransform } from "../../lib/motion";
import { getScene } from "../../lib/mutate";
import { formatTimecodeCompact } from "../../lib/time";
import { getElementTransform, fitSize, getMediaFit, resolveElementRect } from "../../lib/transform";
import { useEditorStore } from "../../store/editor-store";
import { useTimelineViewStore } from "../../store/timeline-view-store";
import type {
  ImageElement,
  SceneTracks,
  TimelineElement,
  TProject,
  VideoElement,
  VisualElement,
} from "../../types";

/**
 * Center preview. Phase 2 uses a DOM composite (native <video>/<img> + styled text)
 * so playback and transforms are cheap. Phase 6 will replace it with a canvas
 * rasterizer shared with the ffmpeg renderer — the transform math here is already
 * shared via `lib/transform.ts`.
 */
export function PreviewPanel() {
  const project = useEditorStore((s) => s.project);
  if (!project) return <div className="h-full bg-background" />;
  return <PreviewCanvas project={project} />;
}

function PreviewCanvas({ project }: { project: TProject }) {
  const { t } = useI18n();
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const setPlayhead = useTimelineViewStore((s) => s.setPlayhead);
  const isPlaying = useTimelineViewStore((s) => s.isPlaying);
  const setPlaying = useTimelineViewStore((s) => s.setPlaying);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);

  const canvas = project.settings.canvasSize;
  const background = project.settings.background;
  const scene = getScene(project);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [fit, setFit] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (fit) {
        const availW = Math.max(0, rect.width - 24);
        const availH = Math.max(0, rect.height - 24);
        const scale = Math.min(availW / canvas.width, availH / canvas.height);
        setStage({ w: Math.max(1, canvas.width * scale), h: Math.max(1, canvas.height * scale) });
      } else {
        // 1:1 pixels, scroll if larger than the panel.
        setStage({ w: canvas.width, h: canvas.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.width, canvas.height, fit]);

  // Track fullscreen state so the button can toggle back.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  // Playback loop.
  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setPlayhead(useTimelineViewStore.getState().playheadMs + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, setPlayhead]);

  const stageScale = stage.w > 0 ? stage.w / canvas.width : 0;

  // Visual layers in render order: the main track is the base (bottom), overlay
  // tracks stack above it (overlay[0] is topmost — matching the ffmpeg composite).
  const visualElements: VisualElement[] = [];
  if (!scene.tracks.main.hidden) {
    for (const el of scene.tracks.main.elements) {
      if (el.type === "video" || el.type === "image") {
        visualElements.push(el as VisualElement);
      }
    }
  }
  for (const track of [...scene.tracks.overlay].reverse()) {
    if (track.hidden) continue;
    for (const el of track.elements) {
      if (el.type === "video" || el.type === "image" || el.type === "text") {
        visualElements.push(el as VisualElement);
      }
    }
  }

  // Crossfade between adjacent clips: an outgoing clip lingers for `outD` ms past
  // its end (fading out), while the incoming clip fades in over its first `inD` ms.
  const { inD, outD } = buildTransitionMaps(scene.tracks);

  // Effects living on their own track affect everything below them, so they are
  // resolved once for the whole stage rather than per element.
  const sceneFilter = (() => {
    let blurPx = 0;
    for (const track of scene.tracks.overlay) {
      if (track.type !== "effect" || track.hidden) continue;
      for (const el of track.elements) {
        if (el.hidden) continue;
        if (playheadMs < el.startTime || playheadMs >= el.startTime + el.duration) continue;
        if (el.effectType === "blur") {
          const intensity = typeof el.params.intensity === "number" ? el.params.intensity : 0;
          blurPx = Math.max(blurPx, blurIntensityToPx(intensity));
        }
      }
    }
    return blurPx > 0 ? `blur(${blurPx}px)` : undefined;
  })();

  const visible = visualElements
    .map((element) => {
      const out = outD.get(element.id) ?? 0;
      const end = element.startTime + element.duration + out;
      if (playheadMs < element.startTime || playheadMs >= end) return null;
      const rel = playheadMs - element.startTime;
      let opacityScale = 1;
      const inMs = inD.get(element.id) ?? 0;
      if (inMs > 0) opacityScale = Math.min(opacityScale, clamp01(rel / inMs));
      if (out > 0) opacityScale = Math.min(opacityScale, clamp01(1 - (rel - element.duration) / out));
      return { element, opacityScale };
    })
    .filter((x): x is { element: VisualElement; opacityScale: number } => x !== null);

  return (
    <div ref={panelRef} className="flex h-full min-w-0 flex-col bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/60 px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("autoEdit.panels.preview")}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatTimecodeCompact(playheadMs)}
          </span>
          <button
            type="button"
            onClick={() => setPlaying(!isPlaying)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => setFit((f) => !f)}
            className={cn(
              "flex h-6 items-center rounded-md px-1.5 text-[11px] font-medium transition-colors",
              fit ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
            )}
            title={t("autoEdit.preview.fit")}
          >
            {fit ? "Fit" : "100%"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
            aria-label={t("autoEdit.preview.fullscreen")}
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto p-3">
        <div className="grid min-h-full min-w-full place-items-center">
          <div
            className="relative overflow-hidden rounded-sm bg-black shadow-sm"
            style={{
              width: stage.w,
              height: stage.h,
              background: background.type === "color" ? background.color : "#000",
              // Effect-track effects apply to the whole composite, matching the
              // ffmpeg pass that runs after all overlays.
              filter: sceneFilter,
            }}
          >
          {visible.map(({ element, opacityScale }) => {
            return (
              <VisualLayer
                key={element.id}
                element={element}
                stageScale={stageScale}
                canvas={canvas}
                sourceTimeMs={playheadMs - element.startTime}
                playing={isPlaying}
                opacityScale={opacityScale}
                previewUrl={
                  element.type === "text"
                    ? undefined
                    : mediaAssets[(element as { mediaPath: string }).mediaPath]?.previewUrl
                }
              />
            );
          })}
          {visualElements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 text-xs text-white/40">
                {t("autoEdit.emptyProject")}
              </span>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VisualLayerProps {
  element: VisualElement;
  stageScale: number;
  canvas: { width: number; height: number };
  sourceTimeMs: number;
  playing: boolean;
  previewUrl?: string;
  /** Multiplier applied on top of the element's own opacity (crossfade). */
  opacityScale?: number;
}

function VisualLayer({
  element,
  stageScale,
  canvas,
  sourceTimeMs,
  playing,
  previewUrl,
  opacityScale = 1,
}: VisualLayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const isMedia = element.type === "video" || element.type === "image";

  // Resolve keyframe animation + effects/masks at the current local time.
  const localTime = Math.max(0, Math.min(sourceTimeMs, element.duration));
  const effective = resolveAnimatedParams(element.params, element.animations, localTime);
  const transform = getElementTransform(effective);

  const blurPx = (element.effects ?? [])
    .filter((e) => e.enabled && e.type === "blur")
    .reduce((max, e) => {
      const intensity = typeof e.params.intensity === "number" ? e.params.intensity : 0;
      return Math.max(max, blurIntensityToPx(intensity));
    }, 0);
  const filter = blurPx > 0 ? `blur(${blurPx}px)` : undefined;

  const mask =
    element.type === "video" || element.type === "image"
      ? (element.masks ?? [])[0]
      : undefined;
  const clipPath = mask ? resolveMaskClipPath(mask) ?? undefined : undefined;

  // Track media intrinsic size for contain-fit.
  useEffect(() => {
    if (!isMedia) return;
    setNatural({ w: 0, h: 0 });
    const el = mediaRef.current;
    if (!el) return;
    const onMeta = () => {
      if (el instanceof HTMLVideoElement) setNatural({ w: el.videoWidth, h: el.videoHeight });
      else if (el instanceof HTMLImageElement) setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    };
    if (el instanceof HTMLVideoElement) el.addEventListener("loadedmetadata", onMeta);
    else el.addEventListener("load", onMeta);
    // Fire immediately if already loaded.
    onMeta();
    return () => {
      if (el instanceof HTMLVideoElement) el.removeEventListener("loadedmetadata", onMeta);
      else el.removeEventListener("load", onMeta);
    };
  }, [isMedia, previewUrl]);

  // Seek video to the current source time and sync play/pause.
  useEffect(() => {
    if (element.type !== "video") return;
    const v = mediaRef.current as HTMLVideoElement | null;
    if (!v) return;
    const target = Math.max(0, sourceTimeMs) / 1000;
    if (Math.abs(v.currentTime - target) > 0.08) {
      try { v.currentTime = target; } catch { /* ignore */ }
    }
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [element.type, sourceTimeMs, playing]);

  if (element.type === "text") {
    const content = typeof effective.content === "string" ? effective.content : "";
    const fontSize = typeof effective.fontSize === "number" ? effective.fontSize : 96;
    const color = typeof effective.color === "string" ? effective.color : "#ffffff";
    const fontFamily = typeof effective.fontFamily === "string" ? effective.fontFamily : "Arial";
    const fontWeight = (typeof effective.fontWeight === "string" ? effective.fontWeight : "normal") as CSSProperties["fontWeight"];
    const fontStyle = (typeof effective.fontStyle === "string" ? effective.fontStyle : "normal") as CSSProperties["fontStyle"];
    const textAlign = (typeof effective.textAlign === "string" ? effective.textAlign : "center") as CSSProperties["textAlign"];
    const cx = (canvas.width / 2 + transform.positionX) * stageScale;
    const cy = (canvas.height / 2 + transform.positionY) * stageScale;
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) rotate(${transform.rotate}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
          opacity: transform.opacity * opacityScale,
          mixBlendMode: toCssBlendMode(transform.blendMode),
          filter,
        }}
      >
        <div
          className="whitespace-pre-wrap"
          style={{ fontSize: fontSize * stageScale, color, fontFamily, fontWeight, fontStyle, textAlign, lineHeight: 1.2 }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Media: natural size (unknown → skip until metadata arrives), fit per `transform.fit`.
  // `object-fill` lets the fit mode drive the geometry: `contain` keeps the media's
  // aspect ratio (letterboxed), `cover` overflows and is clipped by the stage, and
  // `stretch` distorts to the canvas aspect.
  const fit = getMediaFit(effective);
  const fitted = natural.w > 0 ? fitSize(fit, natural.w, natural.h, canvas.width, canvas.height) : null;
  const rect = fitted
    ? resolveElementRect(transform, canvas, fitted.width, fitted.height)
    : null;

  // Ken Burns motion effect → CSS scale + transform-origin (mirrors the zoompan).
  const motion = resolveMotionTransform(
    (element as VideoElement | ImageElement).motionEffect,
    element.duration > 0 ? localTime / element.duration : 0,
  );

  return (
    <div
      className="absolute"
      style={{
        width: rect ? rect.width * stageScale : 0,
        height: rect ? rect.height * stageScale : 0,
        left: rect ? (rect.centerX - rect.width / 2) * stageScale : 0,
        top: rect ? (rect.centerY - rect.height / 2) * stageScale : 0,
        transform: `rotate(${transform.rotate}deg) scale(${motion.scale})`,
        opacity: transform.opacity * opacityScale,
        mixBlendMode: toCssBlendMode(transform.blendMode),
        transformOrigin: `${motion.originX * 100}% ${motion.originY * 100}%`,
        pointerEvents: "none",
        filter,
        clipPath,
      }}
    >
      {element.type === "video" ? (
        <video
          ref={(el) => { mediaRef.current = el; }}
          src={previewUrl}
          muted
          playsInline
          className="size-full object-fill"
        />
      ) : (
        <img
          ref={(el) => { mediaRef.current = el; }}
          src={previewUrl}
          alt={element.name}
          draggable={false}
          className="size-full object-fill"
        />
      )}
    </div>
  );
}

function toCssBlendMode(blendMode: string): CSSProperties["mixBlendMode"] {
  if (blendMode === "normal") return "normal";
  return blendMode.replace(/_/g, "-") as CSSProperties["mixBlendMode"];
}

/**
 * Resolve crossfade transitions between adjacent clips on the same track into
 * per-element fade-in/out durations (ms). An outgoing clip with `transitionToNext`
 * fades out over `outD`, and the following clip fades in over the same `inD`.
 */
function buildTransitionMaps(tracks: SceneTracks): {
  inD: Map<string, number>;
  outD: Map<string, number>;
} {
  const inD = new Map<string, number>();
  const outD = new Map<string, number>();
  const visualTracks = [
    ...tracks.overlay.filter((t) => !t.hidden),
    ...(tracks.main.hidden ? [] : [tracks.main]),
  ];
  for (const track of visualTracks) {
    const elements = track.elements as TimelineElement[];
    const media = elements
      .filter((e): e is VideoElement | ImageElement => e.type === "video" || e.type === "image")
      .sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < media.length - 1; i++) {
      const a = media[i];
      const b = media[i + 1];
      const tr = a.transitionToNext;
      if (!tr || tr.type === "none") continue;
      const d = Math.max(0, Math.min(tr.durationMs, a.duration, b.duration));
      if (d <= 0) continue;
      outD.set(a.id, d);
      inD.set(b.id, d);
    }
  }
  return { inD, outD };
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
