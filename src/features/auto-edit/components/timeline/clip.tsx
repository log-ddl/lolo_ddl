import type { PointerEvent } from "react";
import { Move, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useClipThumbnail } from "../../hooks/use-clip-thumbnail";
import { cssUrl } from "../../lib/thumbnails";
import { msToPx } from "../../store/timeline-view-store";
import type { ElementRef, TimelineElement, TrackType } from "../../types";
import { trackColor } from "./theme";
import { CLIP_RADIUS, TRIM_HANDLE_WIDTH } from "./layout";

export type ClipDragMode = "move" | "trim-left" | "trim-right";

export interface ClipDragOverride {
  startTime?: number;
  duration?: number;
}

interface ClipProps {
  trackId: string;
  element: TimelineElement;
  trackType: TrackType;
  zoomLevel: number;
  isSelected: boolean;
  /** An effect/transition drag is hovering this clip and would attach to it. */
  isDropTarget?: boolean;
  /** This clip is mid-drag towards a different track; its ghost is drawn there. */
  isTravelling?: boolean;
  /** Preview URL of the clip's media, used to build the filmstrip. */
  previewUrl?: string;
  override?: ClipDragOverride;
  onSelect: (ref: ElementRef, additive: boolean) => void;
  onBodyPointerDown: (ref: ElementRef, e: PointerEvent<HTMLDivElement>) => void;
  onTrimPointerDown: (
    ref: ElementRef,
    mode: "trim-left" | "trim-right",
    e: PointerEvent<HTMLDivElement>,
  ) => void;
}

export function Clip({
  trackId,
  element,
  trackType,
  zoomLevel,
  isSelected,
  isDropTarget,
  isTravelling,
  previewUrl,
  override,
  onSelect,
  onBodyPointerDown,
  onTrimPointerDown,
}: ClipProps) {
  const startTime = override?.startTime ?? element.startTime;
  const duration = override?.duration ?? element.duration;
  const left = msToPx(startTime, zoomLevel);
  const width = Math.max(2, msToPx(duration, zoomLevel));
  const color = trackColor(trackType);
  const ref: ElementRef = { trackId, elementId: element.id };

  // What is attached to this clip, surfaced as badges so the timeline shows at a
  // glance that an effect / motion / transition is in play.
  const effectCount = "effects" in element ? (element.effects?.length ?? 0) : 0;
  const motion =
    element.type === "video" || element.type === "image" ? element.motionEffect : undefined;
  const hasMotion = motion != null && motion !== "none";
  // Badges compete for space with the name; drop the duration on short clips.
  const showDuration = width > 120;

  const mediaPath = "mediaPath" in element ? element.mediaPath : null;
  const thumbKind =
    element.type === "video" || element.type === "image" ? element.type : null;
  const thumbnail = useClipThumbnail(thumbKind, mediaPath, previewUrl ?? null);

  return (
    <div
      className={cn(
        "group absolute top-1 bottom-1 select-none overflow-hidden rounded-md",
        "cursor-grab active:cursor-grabbing",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isDropTarget && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background",
        // Faded placeholder while the clip itself is being dragged to another track.
        isTravelling && "opacity-25",
      )}
      style={{
        left,
        width,
        background: trackColor(trackType, 0.18),
        borderLeft: `3px solid ${color}`,
        borderRadius: CLIP_RADIUS,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(ref, e.shiftKey);
        onBodyPointerDown(ref, e);
      }}
    >
      {/* Filmstrip: the media preview tiled across the clip, like opencut's clips.
          `repeat-x` at track height draws the strip with a single painted layer
          instead of one <img> per frame, so wide clips stay cheap to scroll. */}
      {thumbnail && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: cssUrl(thumbnail.url),
              // A filmstrip is stretched across the clip so each frame lands near
              // its own moment; a still is tiled, since every frame is the same.
              backgroundRepeat: thumbnail.mode === "strip" ? "no-repeat" : "repeat-x",
              backgroundSize: thumbnail.mode === "strip" ? "100% 100%" : "auto 100%",
            }}
          />
          {/* Scrim so the clip name stays readable over any frame. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 to-background/70" />
        </>
      )}

      {/* Trim handles */}
      <div
        className="absolute inset-y-0 left-0 z-10 cursor-ew-resize bg-transparent hover:bg-white/10"
        style={{ width: TRIM_HANDLE_WIDTH }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(ref, e.shiftKey);
          onTrimPointerDown(ref, "trim-left", e);
        }}
      />
      <div
        className="absolute inset-y-0 right-0 z-10 cursor-ew-resize bg-transparent hover:bg-white/10"
        style={{ width: TRIM_HANDLE_WIDTH }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(ref, e.shiftKey);
          onTrimPointerDown(ref, "trim-right", e);
        }}
      />

      {/* Label + attachment badges */}
      <div
        className="pointer-events-none flex h-full items-center gap-1.5 px-2.5"
        style={{ color }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate text-[11px] font-medium leading-tight text-foreground">
          {element.name}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1">
          {hasMotion && (
            <span
              title={motion}
              className="flex size-4 items-center justify-center rounded bg-background/70"
            >
              <Move className="size-2.5 text-foreground/80" />
            </span>
          )}
          {effectCount > 0 && (
            <span className="flex h-4 items-center gap-0.5 rounded bg-background/70 px-1">
              <Sparkles className="size-2.5 text-foreground/80" />
              {effectCount > 1 && (
                <span className="text-[9px] font-semibold text-foreground/80">{effectCount}</span>
              )}
            </span>
          )}
          {/* Clip length, hidden on clips too narrow to read it. */}
          {showDuration && (
            <span className="rounded bg-background/70 px-1 font-mono text-[9px] tabular-nums text-foreground/80">
              {formatClipDuration(duration)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/** `m:ss.d` for clip badges — short enough to sit inside a narrow clip. */
function formatClipDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`
    : `${seconds.toFixed(1)}s`;
}
