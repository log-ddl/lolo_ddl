import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { msToPx, pxToMs } from "../../store/timeline-view-store";
import type { TrackType, TransitionConfig } from "../../types";
import { trackColor } from "./theme";

/**
 * A transition straddles the cut: half of the crossfade eats into the outgoing
 * clip and half into the incoming one, so the marker is centred on the boundary
 * (DaVinci/Premiere convention) rather than tucked inside the outgoing clip.
 *
 * It renders as a sibling of the clips in the track row — not inside the clip —
 * because a clip clips its own overflow and the marker has to spill past the cut.
 *
 * Dragging either edge resizes the crossfade symmetrically about the cut, which is
 * why one drag handler serves both sides: the duration is twice the distance from
 * the pointer to the boundary.
 */
export function TransitionMarker({
  boundaryMs,
  transition,
  trackType,
  zoomLevel,
  maxDurationMs,
  minDurationMs,
  isSelected,
  onSelect,
  onResize,
  onRemove,
}: {
  /** Timeline time of the cut the transition sits on. */
  boundaryMs: number;
  transition: TransitionConfig;
  trackType: TrackType;
  zoomLevel: number;
  /** Longest crossfade the neighbouring clips can absorb. */
  maxDurationMs: number;
  minDurationMs: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (durationMs: number) => void;
  onRemove?: () => void;
}) {
  const [draftMs, setDraftMs] = useState<number | null>(null);
  const isResizing = useRef(false);
  /** Mirrors `draftMs` so the pointerup handler can commit without reading state. */
  const draftRef = useRef<number | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const durationMs = draftMs ?? transition.durationMs;
  const width = Math.max(14, msToPx(durationMs, zoomLevel));
  const center = msToPx(boundaryMs, zoomLevel);
  const color = trackColor(trackType);

  // Resize is driven from window listeners so the drag survives the pointer
  // leaving the (narrow) marker.
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      if (!isResizing.current) return;
      // The track content element is the time origin (x = 0 is timeline time 0).
      const host = hostRef.current?.parentElement;
      if (!host) return;
      const pointerMs = pxToMs(e.clientX - host.getBoundingClientRect().left, zoomLevel);
      const next = Math.round(Math.abs(pointerMs - boundaryMs) * 2);
      const clamped = Math.max(minDurationMs, Math.min(next, maxDurationMs));
      draftRef.current = clamped;
      setDraftMs(clamped);
    };
    const onUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      const committed = draftRef.current;
      draftRef.current = null;
      setDraftMs(null);
      if (committed != null) onResize?.(committed);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [zoomLevel, boundaryMs, minDurationMs, maxDurationMs, onResize]);

  const beginResize = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    draftRef.current = transition.durationMs;
    setDraftMs(transition.durationMs);
  };

  return (
    <div
      ref={hostRef}
      className={cn(
        "group/transition absolute top-1 bottom-1 z-20 flex items-center justify-center rounded",
        "border border-dashed",
        isSelected ? "border-primary" : "border-foreground/40 hover:border-primary/70",
      )}
      style={{
        left: center - width / 2,
        width,
        background: `linear-gradient(to right, transparent, ${trackColor(trackType, 0.6)}, transparent)`,
      }}
      title={`${transition.type} · ${Math.round(durationMs)}ms`}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* The two crossing diagonals that read as "crossfade" at a glance. */}
      <svg
        className="pointer-events-none absolute inset-0 size-full opacity-60"
        preserveAspectRatio="none"
        viewBox="0 0 10 10"
      >
        <line x1="0" y1="10" x2="10" y2="0" stroke={color} strokeWidth="0.6" />
        <line x1="0" y1="0" x2="10" y2="10" stroke={color} strokeWidth="0.6" />
      </svg>

      {/* Resize handles on both edges. */}
      <div
        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-white/25"
        onPointerDown={beginResize}
      />
      <div
        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize hover:bg-white/25"
        onPointerDown={beginResize}
      />

      {onRemove && (
        <button
          type="button"
          aria-label="Remove transition"
          className={cn(
            "relative z-10 flex size-4 items-center justify-center rounded-full bg-background/85 text-foreground/80",
            "opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground",
            "group-hover/transition:opacity-100",
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-2.5" />
        </button>
      )}

      {/* Live duration readout while dragging. */}
      {draftMs != null && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-background/90 px-1 font-mono text-2xs tabular-nums text-foreground">
          {Math.round(draftMs)}ms
        </span>
      )}
    </div>
  );
}
