import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import {
  duplicateElementsCommand,
  moveElementToTrackCommand,
  moveElementsByDeltaCommand,
  removeElementsCommand,
  splitElementCommand,
  trimElementCommand,
  updateTransitionCommand,
} from "../../commands";
import { createTextElement, createTextTrack } from "../../defaults";
import {
  targetsExistingClip,
  type DragPayloadKind,
} from "../../lib/dnd";
import { resolveNonOverlappingStart } from "../../lib/placement";
import { newId } from "../../lib/id";
import { importMediaFiles, pickedFromDroppedFiles } from "../../lib/import-media";
import {
  getElement,
  getScene,
  getTrack,
  insertElement,
  nextVisualSibling,
  updateTracks,
} from "../../lib/mutate";
import { getProjectDurationMs } from "../../lib/project";
import { frameDurationMs, snapToFrame } from "../../lib/time";
import { useEditorStore } from "../../store/editor-store";
import { BASE_PPS, msToPx, pxToMs, useTimelineViewStore } from "../../store/timeline-view-store";
import { trackTypeForElement } from "../../types";
import type {
  ElementRef,
  TextTrack,
  TimelineTrack,
  TProject,
} from "../../types";
import { Clip, type ClipDragOverride } from "./clip";
import {
  CONTENT_RIGHT_PADDING_PX,
  MIN_CONTENT_MS,
  RULER_HEIGHT,
  TRACK_GAP,
  TRACK_HEADER_WIDTH,
  trackHeight,
} from "./layout";
import {
  EDGE_SCROLL_PX,
  EDGE_SCROLL_SPEED_PX,
  SNAP_THRESHOLD_PX,
  computeDrag,
  type DragState,
  type MoveMember,
} from "./drag-types";
import { TimelineToolbar } from "./timeline-toolbar";
import { TrackHeader } from "./track-header";
import { useTimelineDrop } from "./use-timeline-drop";
import { Ruler } from "./ruler";
import { trackColor } from "./theme";
import { TransitionMarker } from "./transition-marker";

export function Timeline() {
  const project = useEditorStore((s) => s.project);
  if (!project) {
    return <div className="h-full bg-panel" />;
  }
  return <TimelineCanvas project={project} />;
}

function TimelineCanvas({ project }: { project: TProject }) {
  const { t } = useI18n();
  const selection = useEditorStore((s) => s.selection);
  const execute = useEditorStore((s) => s.execute);
  const setSelection = useEditorStore((s) => s.setSelection);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const rippleEnabled = useEditorStore((s) => s.rippleEnabled);
  const setRippleEnabled = useEditorStore((s) => s.setRippleEnabled);
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const zoomLevel = useTimelineViewStore((s) => s.zoomLevel);
  const setPlayhead = useTimelineViewStore((s) => s.setPlayhead);
  const zoomBy = useTimelineViewStore((s) => s.zoomBy);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const trackRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Time the current drag is snapped to, for the indicator line (null = no snap). */
  const [snapMs, setSnapMs] = useState<number | null>(null);
  /** Where an in-flight external drag (asset panel / OS files) would land. */
  const [dropTarget, setDropTarget] = useState<{
    trackId: string | null;
    ms: number;
    /** Clip the payload would attach to, for effect/motion drags. */
    clip: ElementRef | null;
    /** Cut a transition drag would land on (the outgoing clip owns it). */
    cut: { ref: ElementRef; ms: number } | null;
    kind: DragPayloadKind | null;
  } | null>(null);

  const scene = getScene(project);
  const tracks: TimelineTrack[] = [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio];

  /**
   * Track row bounds captured at drag start. Measuring every row on every
   * pointermove forces a layout each frame, which is what made vertical dragging
   * feel sticky; the rows cannot move mid-drag, so one snapshot is enough.
   */
  const trackBoundsRef = useRef<Array<{ id: string; top: number; bottom: number }>>([]);

  const captureTrackBounds = useCallback(() => {
    trackBoundsRef.current = [...trackRowRefs.current.entries()].map(([id, el]) => {
      const rect = el.getBoundingClientRect();
      return { id, top: rect.top, bottom: rect.bottom };
    });
  }, []);

  // Resolve which track row a client Y coordinate sits over (for vertical drag).
  const trackIdAtClientY = useCallback((clientY: number): string | null => {
    const bounds = trackBoundsRef.current;
    if (bounds.length === 0) {
      for (const [id, el] of trackRowRefs.current) {
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) return id;
      }
      return null;
    }
    for (const b of bounds) {
      if (clientY >= b.top && clientY <= b.bottom) return b.id;
    }
    return null;
  }, []);

  // Convert a viewport client X to a timeline time, accounting for the sticky
  // header and horizontal scroll.
  const clientXToMs = useCallback(
    (clientX: number): number => {
      const container = scrollRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const contentX = clientX - rect.left - TRACK_HEADER_WIDTH + container.scrollLeft;
      return Math.max(0, pxToMs(contentX, zoomLevel));
    },
    [zoomLevel],
  );
  // The ruler and track lanes are absolutely-positioned children of a fixed-width
  // box, so they do not inherit the parent's `min-width: 100%`. Without measuring
  // the viewport they stop at the project's duration and leave the rest of the
  // panel blank.
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fps = project.settings.fps;
  const frameDur = Math.max(1, Math.round(frameDurationMs(fps)));
  const durationMs = Math.max(MIN_CONTENT_MS, getProjectDurationMs(project));
  const contentWidth = Math.max(
    msToPx(durationMs, zoomLevel) + CONTENT_RIGHT_PADDING_PX,
    Math.max(0, viewportWidth - TRACK_HEADER_WIDTH),
  );
  const totalWidth = TRACK_HEADER_WIDTH + contentWidth;

  const snap = useCallback((ms: number) => snapToFrame(ms, fps), [fps]);

  /** Zoom so the whole project fits the visible lane width (Shift+Z). */
  const fitToWindow = useCallback(() => {
    const lane = Math.max(0, viewportWidth - TRACK_HEADER_WIDTH) - CONTENT_RIGHT_PADDING_PX;
    const seconds = Math.max(MIN_CONTENT_MS, getProjectDurationMs(project)) / 1000;
    if (lane <= 0 || seconds <= 0) return;
    useTimelineViewStore.getState().setZoom(lane / seconds / BASE_PPS);
    scrollRef.current?.scrollTo({ left: 0 });
  }, [viewportWidth, project]);

  // Cmd/Ctrl + wheel zooms about the cursor: the time under the pointer stays put,
  // which is what makes wheel-zoom feel anchored rather than jumpy.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      const view = useTimelineViewStore.getState();
      const rect = container.getBoundingClientRect();
      const laneX = e.clientX - rect.left - TRACK_HEADER_WIDTH + container.scrollLeft;
      const anchorMs = pxToMs(Math.max(0, laneX), view.zoomLevel);

      const factor = Math.exp(-e.deltaY * 0.002);
      view.zoomBy(factor);

      const next = useTimelineViewStore.getState().zoomLevel;
      const pointerOffset = e.clientX - rect.left - TRACK_HEADER_WIDTH;
      container.scrollLeft = Math.max(0, msToPx(anchorMs, next) - pointerOffset);
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (target?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        fitToWindow();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fitToWindow]);

  // Snap a time to the nearest clip edge / playhead / timeline origin, then the frame
  // grid. `hit` reports whether an actual edge was caught (as opposed to plain frame
  // rounding) so the caller can draw the snap indicator only when it means something.
  const snapEdgeDetail = useCallback(
    (ms: number, excludeRef?: ElementRef): { ms: number; hit: boolean } => {
      const thresholdMs = Math.max(frameDur, Math.round(pxToMs(SNAP_THRESHOLD_PX, zoomLevel)));
      let best = ms;
      let bestDist = thresholdMs;
      const consider = (candidate: number) => {
        const d = Math.abs(candidate - ms);
        if (d < bestDist) {
          bestDist = d;
          best = candidate;
        }
      };
      consider(0);
      consider(playheadMs);
      for (const track of tracks) {
        for (const el of track.elements) {
          if (excludeRef && track.id === excludeRef.trackId && el.id === excludeRef.elementId) continue;
          consider(el.startTime);
          consider(el.startTime + el.duration);
        }
      }
      if (bestDist < thresholdMs) return { ms: Math.max(0, Math.round(best)), hit: true };
      return { ms: snapToFrame(ms, fps), hit: false };
    },
    [frameDur, zoomLevel, playheadMs, tracks, fps],
  );

  const snapEdge = useCallback(
    (ms: number, excludeRef?: ElementRef) => snapEdgeDetail(ms, excludeRef).ms,
    [snapEdgeDetail],
  );

  const beginDrag = useCallback(
    (state: DragState) => {
      captureTrackBounds();
      dragRef.current = state;
      setDrag(state);
    },
    [captureTrackBounds],
  );

  const commitDrag = useCallback(
    (d: DragState) => {
      if (d.mode === "seek") return;
      if (d.mode === "marquee") {
        const minMs = clientXToMs(Math.min(d.startClientX, d.currentClientX));
        const maxMs = clientXToMs(Math.max(d.startClientX, d.currentClientX));
        const y1 = Math.min(d.startClientY, d.currentClientY);
        const y2 = Math.max(d.startClientY, d.currentClientY);
        const refs: ElementRef[] = [];
        const allTracks: TimelineTrack[] = [
          ...scene.tracks.overlay,
          scene.tracks.main,
          ...scene.tracks.audio,
        ];
        for (const track of allTracks) {
          const rowEl = trackRowRefs.current.get(track.id);
          if (!rowEl) continue;
          const rect = rowEl.getBoundingClientRect();
          if (rect.bottom < y1 || rect.top > y2) continue;
          for (const el of track.elements) {
            if (el.startTime < maxMs && el.startTime + el.duration > minMs) {
              refs.push({ trackId: track.id, elementId: el.id });
            }
          }
        }
        if (refs.length > 0) setSelection({ elements: refs, keyframes: [] });
        return;
      }
      const { ref } = d;
      if (d.mode === "move") {
        const requested = snapEdge(d.newStart, ref);
        const movedTrack = d.targetTrackId !== ref.trackId;

        // A group move keeps each clip on its own track (vertical drop only applies
        // to a single dragged clip).
        if (d.group.length > 1) {
          const delta = requested - snapEdge(d.startTime, ref);
          if (delta === 0) return;
          // All-or-nothing: if any member would land on top of another clip, the
          // whole group move is abandoned rather than silently stacking clips.
          const blocked = d.group.some((m) => {
            const el = getElement(scene.tracks, m.ref);
            const track = getTrack(scene.tracks, m.ref.trackId);
            if (!el || !track) return false;
            const movingIds = new Set(
              d.group.filter((x) => x.ref.trackId === m.ref.trackId).map((x) => x.ref.elementId),
            );
            const start = m.startTime + delta;
            return (
              start < 0 ||
              track.elements.some(
                (other) =>
                  !movingIds.has(other.id) &&
                  start < other.startTime + other.duration &&
                  start + el.duration > other.startTime,
              )
            );
          });
          if (blocked) return;
          execute(moveElementsByDeltaCommand(d.group.map((m) => m.ref), delta));
          return;
        }

        const el = getElement(scene.tracks, ref);
        const targetTrack = getTrack(scene.tracks, d.targetTrackId);
        if (!el || !targetTrack) return;
        const start = resolveNonOverlappingStart({
          track: targetTrack,
          startTime: requested,
          duration: el.duration,
          excludeElementId: ref.elementId,
        });
        if (start == null) return; // nowhere to put it — leave the clip where it was

        if (movedTrack) {
          execute(moveElementToTrackCommand(ref, d.targetTrackId, start));
        } else if (start !== d.startTime) {
          execute(moveElementsByDeltaCommand([ref], start - d.startTime));
        }
      } else if (d.mode === "trim-left") {
        // Right edge stays fixed; snap the moving left edge.
        const end = d.startTime + d.duration;
        const start = snapEdge(d.newStart, ref);
        execute(
          trimElementCommand(ref, {
            startTime: start,
            duration: Math.max(frameDur, end - start),
            trimStart: Math.max(0, Math.round(d.newTrimStart + (start - d.newStart))),
          }),
        );
      } else {
        // Left edge stays fixed; snap the moving right edge.
        const el = getElement(scene.tracks, ref);
        const startTime = el?.startTime ?? 0;
        const end = snapEdge(startTime + d.newDuration, ref);
        execute(
          trimElementCommand(ref, {
            duration: Math.max(frameDur, end - startTime),
            trimEnd: Math.max(0, Math.round(d.newTrimEnd)),
          }),
        );
      }
    },
    [execute, snapEdge, scene, frameDur, clientXToMs, setSelection],
  );

  // The pointer position is mirrored into a ref so the auto-scroll loop can keep
  // the drag advancing while the pointer is held still at the edge.
  const pointerRef = useRef({ x: 0, y: 0 });

  const applyDragAt = useCallback(
    (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.mode === "marquee") {
        dragRef.current = { ...d, currentClientX: clientX, currentClientY: clientY };
        setDrag(dragRef.current);
        return;
      }
      const deltaMs = Math.round(pxToMs(clientX - d.startClientX, zoomLevel));
      if (d.mode === "seek") {
        const ms = snap(Math.max(0, d.baseMs + deltaMs));
        setPlayhead(ms);
        return;
      }
      let next = computeDrag(d, deltaMs, frameDur);

      // Snap while dragging (not only on release) so the clip visibly locks onto
      // neighbouring edges and the indicator can show what it caught.
      if (next.mode === "move") {
        const snapped = snapEdgeDetail(next.newStart, next.ref);
        next = { ...next, newStart: snapped.ms };
        setSnapMs(snapped.hit ? snapped.ms : null);

        // Vertical (cross-track) drop only applies to a single dragged clip.
        if (next.group.length === 1) {
          const hoveredId = trackIdAtClientY(clientY);
          const el = getElement(scene.tracks, d.ref);
          const hovered = hoveredId ? getTrack(scene.tracks, hoveredId) : null;
          const compatible = el && hovered && trackTypeForElement(el.type) === hovered.type;
          next = { ...next, targetTrackId: compatible ? hoveredId! : d.ref.trackId };
        } else {
          next = { ...next, targetTrackId: d.ref.trackId };
        }
      } else if (next.mode === "trim-left") {
        const end = next.startTime + next.duration;
        const snapped = snapEdgeDetail(next.newStart, next.ref);
        const start = Math.min(snapped.ms, end - frameDur);
        next = {
          ...next,
          newStart: start,
          newDuration: Math.max(frameDur, end - start),
          newTrimStart: Math.max(0, Math.round(next.newTrimStart + (start - next.newStart))),
        };
        setSnapMs(snapped.hit ? start : null);
      } else if (next.mode === "trim-right") {
        const el = getElement(scene.tracks, next.ref);
        const startTime = el?.startTime ?? 0;
        const snapped = snapEdgeDetail(startTime + next.newDuration, next.ref);
        const duration = Math.max(frameDur, snapped.ms - startTime);
        next = {
          ...next,
          newTrimEnd: Math.max(0, Math.round(next.newTrimEnd + (next.newDuration - duration))),
          newDuration: duration,
        };
        setSnapMs(snapped.hit ? startTime + duration : null);
      }

      dragRef.current = next;
      setDrag(next);
    },
    [
      zoomLevel,
      snap,
      frameDur,
      setPlayhead,
      snapEdgeDetail,
      trackIdAtClientY,
      scene,
    ],
  );

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      applyDragAt(e.clientX, e.clientY);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d) commitDrag(d);
      dragRef.current = null;
      setDrag(null);
      setSnapMs(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [applyDragAt, commitDrag]);

  // Edge auto-scroll: holding a drag near either end of the viewport scrolls the
  // timeline. `startClientX` is shifted by the scrolled amount so the clip keeps
  // travelling under a stationary pointer instead of freezing at the edge.
  useEffect(() => {
    if (!drag || drag.mode === "seek") return;
    let raf = 0;
    const step = () => {
      const container = scrollRef.current;
      const d = dragRef.current;
      if (container && d) {
        const rect = container.getBoundingClientRect();
        const x = pointerRef.current.x;
        let dx = 0;
        if (x < rect.left + TRACK_HEADER_WIDTH + EDGE_SCROLL_PX) {
          dx = -EDGE_SCROLL_SPEED_PX;
        } else if (x > rect.right - EDGE_SCROLL_PX) {
          dx = EDGE_SCROLL_SPEED_PX;
        }
        if (dx !== 0) {
          const before = container.scrollLeft;
          container.scrollLeft = before + dx;
          const applied = container.scrollLeft - before;
          if (applied !== 0 && dragRef.current) {
            dragRef.current = {
              ...dragRef.current,
              startClientX: dragRef.current.startClientX - applied,
            };
            captureTrackBounds();
            applyDragAt(pointerRef.current.x, pointerRef.current.y);
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [drag, applyDragAt, captureTrackBounds]);

  const selectRef = useCallback(
    (ref: ElementRef, additive: boolean) => {
      const current = useEditorStore.getState().selection;
      const isSelected = current.elements.some(
        (r) => r.trackId === ref.trackId && r.elementId === ref.elementId,
      );
      // Clicking an already-selected clip keeps the selection so a multi-selection
      // can be dragged as a group; shift-click toggles membership.
      if (isSelected && !additive) return;
      const elements = additive
        ? isSelected
          ? current.elements.filter(
              (r) => !(r.trackId === ref.trackId && r.elementId === ref.elementId),
            )
          : [...current.elements, ref]
        : [ref];
      setSelection({ elements, keyframes: [] });
    },
    [setSelection],
  );

  const beginSeek = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ms = snap(Math.max(0, pxToMs(x, zoomLevel)));
    setPlayhead(ms);
    beginDrag({ mode: "seek", startClientX: e.clientX, baseMs: ms });
  };

  const beginMarquee = (e: PointerEvent<HTMLDivElement>) => {
    const ms = clientXToMs(e.clientX);
    setPlayhead(ms);
    beginDrag({
      mode: "marquee",
      startClientX: e.clientX,
      startClientY: e.clientY,
      currentClientX: e.clientX,
      currentClientY: e.clientY,
    });
  };

  const onCanvasPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    beginMarquee(e);
    setSelection({ elements: [], keyframes: [] });
  };

  const beginMove = (ref: ElementRef, e: PointerEvent) => {
    const el = getElement(scene.tracks, ref);
    if (!el) return;
    e.preventDefault();
    // If the grabbed clip is part of a multi-selection, move the whole group.
    const selectionRefs = useEditorStore.getState().selection.elements;
    const inSelection = selectionRefs.some(
      (r) => r.trackId === ref.trackId && r.elementId === ref.elementId,
    );
    const refs = inSelection && selectionRefs.length > 1 ? selectionRefs : [ref];
    const group: MoveMember[] = refs.flatMap((r) => {
      const member = getElement(scene.tracks, r);
      return member ? [{ ref: r, startTime: member.startTime }] : [];
    });
    beginDrag({
      mode: "move",
      ref,
      startClientX: e.clientX,
      startTime: el.startTime,
      duration: el.duration,
      newStart: el.startTime,
      newDuration: el.duration,
      targetTrackId: ref.trackId,
      group,
    });
  };

  const beginTrim = (ref: ElementRef, edge: "trim-left" | "trim-right", e: PointerEvent) => {
    const el = getElement(scene.tracks, ref);
    if (!el) return;
    e.preventDefault();
    if (edge === "trim-left") {
      beginDrag({
        mode: "trim-left",
        ref,
        startClientX: e.clientX,
        startTime: el.startTime,
        duration: el.duration,
        trimStart: el.trimStart ?? 0,
        newStart: el.startTime,
        newDuration: el.duration,
        newTrimStart: el.trimStart ?? 0,
      });
    } else {
      beginDrag({
        mode: "trim-right",
        ref,
        startClientX: e.clientX,
        duration: el.duration,
        trimEnd: el.trimEnd ?? 0,
        newDuration: el.duration,
        newTrimEnd: el.trimEnd ?? 0,
      });
    }
  };

  const overrideFor = (trackId: string, elementId: string): ClipDragOverride | undefined => {
    if (!drag || drag.mode === "seek" || drag.mode === "marquee") return undefined;
    if (drag.mode === "move") {
      // Every member of a group shifts by the same delta during a move (each keeps
      // its own duration — only the start time shifts).
      const member = drag.group.find(
        (m) => m.ref.trackId === trackId && m.ref.elementId === elementId,
      );
      if (!member) return undefined;
      const delta = drag.newStart - drag.startTime;
      return { startTime: member.startTime + delta };
    }
    if (drag.ref.trackId !== trackId || drag.ref.elementId !== elementId) return undefined;
    if (drag.mode === "trim-left") {
      return { startTime: drag.newStart, duration: drag.newDuration };
    }
    return { duration: drag.newDuration };
  };

  const isSelected = (trackId: string, elementId: string) =>
    selection.elements.some((r) => r.trackId === trackId && r.elementId === elementId);

  /** True while this element is being dragged onto a different track. */
  const isTravelling = (trackId: string, elementId: string) =>
    drag?.mode === "move" &&
    drag.ref.trackId === trackId &&
    drag.ref.elementId === elementId &&
    drag.targetTrackId !== trackId;

  /**
   * The preview of a clip mid-flight to `trackId`. Rendered as a plain box rather
   * than a real `Clip` so it cannot capture pointer events during the drag.
   */
  const ghostFor = (trackId: string) => {
    if (drag?.mode !== "move" || drag.targetTrackId !== trackId) return null;
    if (drag.ref.trackId === trackId) return null;
    const element = getElement(scene.tracks, drag.ref);
    if (!element) return null;
    const source = getTrack(scene.tracks, drag.ref.trackId);
    return (
      <div
        className="pointer-events-none absolute top-1 bottom-1 z-30 flex items-center overflow-hidden rounded-md px-2.5 ring-2 ring-primary"
        style={{
          left: msToPx(drag.newStart, zoomLevel),
          width: Math.max(2, msToPx(element.duration, zoomLevel)),
          background: trackColor(source?.type ?? "video", 0.35),
        }}
      >
        <span className="truncate text-[11px] font-medium text-foreground">{element.name}</span>
      </div>
    );
  };

  /* --- toolbar actions --- */

  const addText = () => {
    const startTime = snap(playheadMs);
    execute({
      id: newId("cmd"),
      label: t("autoEdit.addText"),
      apply: (project) => {
        const current = getScene(project);
        let textTrack = current.tracks.overlay.find(
          (tr): tr is TextTrack => tr.type === "text",
        );
        if (!textTrack) {
          textTrack = createTextTrack();
          project = updateTracks(project, current.id, (tracks) => ({
            ...tracks,
            overlay: [...tracks.overlay, textTrack!],
          }));
        }
        const el = createTextElement({ startTime });
        return updateTracks(project, project.currentSceneId, (tracks) =>
          insertElement(tracks, textTrack!.id, el),
        );
      },
    });
  };

  const deleteSelected = () => {
    if (selection.elements.length === 0) return;
    execute(removeElementsCommand(selection.elements, t("autoEdit.delete")));
    setSelection({ elements: [], keyframes: [] });
  };

  const splitSelected = () => {
    for (const ref of selection.elements) {
      execute(splitElementCommand(ref, playheadMs, t("autoEdit.split")));
    }
  };

  const duplicateSelected = () => {
    if (selection.elements.length === 0) return;
    const { command, refs } = duplicateElementsCommand(
      selection.elements,
      t("autoEdit.duplicate"),
    );
    execute(command, { elements: refs, keyframes: [] });
  };


  const { onDragOver, onDragLeave, onDrop } = useTimelineDrop({
    scene,
    mediaAssets,
    zoomLevel,
    execute,
    setSelection,
    setDropTarget,
    clientXToMs,
    trackIdAtClientY,
    snapEdge,
    importMediaFiles,
    pickedFromDroppedFiles,
    t,
  });

  return (
    <div className="flex h-full min-w-0 flex-col border-t border-border/60 bg-panel">
      <TimelineToolbar
        selectionEmpty={selection.elements.length === 0}
        rippleEnabled={rippleEnabled}
        setRippleEnabled={setRippleEnabled}
        zoomBy={zoomBy}
        addText={addText}
        splitSelected={splitSelected}
        duplicateSelected={duplicateSelected}
        deleteSelected={deleteSelected}
        t={t}
      />

      {/* Scrollable canvas */}
      <div
        ref={scrollRef}
        className="relative flex-1 min-h-0 overflow-auto"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
          {/* Snap / drop indicator: a full-height line at the time being locked onto.
              Effect and transition drags land on a clip, not at a time, so they get
              the clip highlight instead of this line. */}
          {/* Where a transition drag would land: a bracket straddling the cut. */}
          {dropTarget?.cut && (
            <div
              className="pointer-events-none absolute inset-y-0 z-40 border-x-2 border-emerald-400 bg-emerald-400/20"
              style={{
                left: TRACK_HEADER_WIDTH + msToPx(dropTarget.cut.ms, zoomLevel) - 14,
                width: 28,
              }}
            />
          )}

          {(snapMs != null ||
            (dropTarget != null &&
              !targetsExistingClip(dropTarget.kind) &&
              dropTarget.kind !== "transition")) && (
            // Amber, not primary — the playhead is already primary-coloured, and a
            // snap line the same colour is invisible as feedback.
            <div
              className="pointer-events-none absolute inset-y-0 z-40 w-0.5 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              style={{ left: TRACK_HEADER_WIDTH + msToPx(snapMs ?? dropTarget!.ms, zoomLevel) }}
            >
              <div className="absolute -left-[3px] top-0 size-2 rotate-45 bg-amber-400" />
              <div className="absolute -left-[3px] bottom-0 size-2 rotate-45 bg-amber-400" />
            </div>
          )}
          {/* Ruler row */}
          <div className="sticky top-0 z-30 flex bg-panel" style={{ height: RULER_HEIGHT }}>
            <div
              className="sticky left-0 z-40 shrink-0 border-r border-border/60 bg-panel"
              style={{ width: TRACK_HEADER_WIDTH }}
            />
            <div className="relative shrink-0" style={{ width: contentWidth, height: RULER_HEIGHT }}>
              <Ruler widthPx={contentWidth} zoomLevel={zoomLevel} onPointerDown={beginSeek} />
              <div
                className="pointer-events-none absolute top-0 h-full"
                style={{ left: msToPx(playheadMs, zoomLevel) }}
              >
                <div className="absolute -left-[5px] top-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-primary" />
              </div>
            </div>
          </div>

          {/* Track rows */}
          {tracks.map((track) => (
            <div
              key={track.id}
              ref={(el) => {
                if (el) trackRowRefs.current.set(track.id, el);
                else trackRowRefs.current.delete(track.id);
              }}
              className={cn(
                "flex rounded-sm",
                drag?.mode === "move" &&
                  drag.targetTrackId === track.id &&
                  drag.ref.trackId !== track.id &&
                  "ring-2 ring-inset ring-primary/70",
                dropTarget?.trackId === track.id &&
                  !targetsExistingClip(dropTarget.kind) &&
                  "ring-2 ring-inset ring-primary/70",
              )}
              style={{ height: trackHeight(track.type), marginTop: TRACK_GAP }}
            >
              <div
                className="sticky left-0 z-20 shrink-0 border-r border-border/60 bg-panel"
                style={{ width: TRACK_HEADER_WIDTH }}
              >
                <TrackHeader track={track} isMain={track.id === scene.tracks.main.id} />
              </div>
              <div
                className="relative shrink-0"
                style={{ width: contentWidth }}
                onPointerDown={onCanvasPointerDown}
              >
                {/* Transitions sit on the cut between two clips. A transition with no
                    incoming clip has nothing to fade into, so it is not drawn. */}
                {track.elements.map((element) => {
                  if (element.type !== "video" && element.type !== "image") return null;
                  const transition = element.transitionToNext;
                  if (!transition || transition.type === "none") return null;
                  const next = nextVisualSibling(track, element.id);
                  if (!next) return null;
                  const ref: ElementRef = { trackId: track.id, elementId: element.id };
                  return (
                    <TransitionMarker
                      key={`tr-${element.id}`}
                      boundaryMs={element.startTime + element.duration}
                      transition={transition}
                      trackType={track.type}
                      zoomLevel={zoomLevel}
                      minDurationMs={frameDur}
                      maxDurationMs={Math.min(element.duration, next.duration)}
                      isSelected={isSelected(track.id, element.id)}
                      onSelect={() => setSelection({ elements: [ref], keyframes: [] })}
                      onResize={(durationMs) =>
                        execute(
                          updateTransitionCommand(ref, { type: transition.type, durationMs }),
                        )
                      }
                      onRemove={() => execute(updateTransitionCommand(ref, null))}
                    />
                  );
                })}
                {/* A clip being dragged to another track is drawn in the row under
                    the cursor, so it follows the pointer vertically instead of
                    staying behind while only a highlight moves. */}
                {ghostFor(track.id)}

                {track.elements.map((element) => (
                  <Clip
                    key={element.id}
                    trackId={track.id}
                    element={element}
                    trackType={track.type}
                    zoomLevel={zoomLevel}
                    isSelected={isSelected(track.id, element.id)}
                    isTravelling={isTravelling(track.id, element.id)}
                    previewUrl={
                      "mediaPath" in element
                        ? mediaAssets[element.mediaPath]?.previewUrl
                        : undefined
                    }
                    isDropTarget={
                      dropTarget?.clip?.trackId === track.id &&
                      dropTarget.clip.elementId === element.id
                    }
                    override={overrideFor(track.id, element.id)}
                    onSelect={selectRef}
                    onBodyPointerDown={beginMove}
                    onTrimPointerDown={beginTrim}
                  />
                ))}
                {/* Playhead */}
                <div
                  className="pointer-events-none absolute inset-y-0 z-20"
                  style={{ left: msToPx(playheadMs, zoomLevel) }}
                >
                  <div className="absolute inset-y-0 w-px bg-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee box-select overlay (viewport coords → fixed). */}
      {drag?.mode === "marquee" && (
        <div
          className="pointer-events-none fixed z-50 rounded-sm border border-primary bg-primary/10"
          style={{
            left: Math.min(drag.startClientX, drag.currentClientX),
            top: Math.min(drag.startClientY, drag.currentClientY),
            width: Math.abs(drag.currentClientX - drag.startClientX),
            height: Math.abs(drag.currentClientY - drag.startClientY),
          }}
        />
      )}
    </div>
  );
}


