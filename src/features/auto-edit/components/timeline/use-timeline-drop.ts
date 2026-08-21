"use client";

/**
 * Everything that can be dropped onto the timeline: media from the asset panel
 * or the OS, effects and motions that attach to a clip, and transitions that
 * attach to a cut between two clips.
 *
 * `onDragOver` also computes the drop indicator so the user sees exactly where
 * the payload will land before releasing.
 */

import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import {
  addEffectCommand,
  addEffectLayerCommand,
  updateMotionEffectCommand,
  updateTransitionCommand,
} from "../../commands";
import { DND_EFFECT, DND_MEDIA, DND_MOTION, DND_TRANSITION, dragPayloadKind, targetsExistingClip, type DragPayloadKind } from "../../lib/dnd";
import { getElement, getTrack, nextVisualSibling } from "../../lib/mutate";
import type { ElementRef, MediaAsset, MotionEffectType, TransitionType, TScene } from "../../types";
import { pxToMs } from "../../store/timeline-view-store";
import { transitionDefinition } from "../../lib/transitions";
import { CUT_SNAP_PX } from "./drag-types";

export interface DropTargetState {
  trackId: string | null;
  ms: number;
  clip: ElementRef | null;
  cut: { ref: ElementRef; ms: number } | null;
  kind: DragPayloadKind | null;
}

export interface TimelineDropDeps {
  scene: TScene;
  mediaAssets: Record<string, MediaAsset>;
  setSelection: (selection: any) => void;
  zoomLevel: number;
  execute: (command: any, selection?: any) => void;
  setDropTarget: (target: DropTargetState | null) => void;
  clientXToMs: (clientX: number) => number;
  trackIdAtClientY: (clientY: number) => string | null;
  snapEdge: (ms: number) => number;
  importMediaFiles: (files: any[], options: { startMs: number; trackId?: string }) => Promise<void>;
  pickedFromDroppedFiles: (files: File[]) => Promise<any[]>;
  t: Translate;
}

export function useTimelineDrop({
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
}: TimelineDropDeps) {
  // `clientXToMs` accounts for the sticky track header *and* horizontal scroll, so a
  // drop lands where the cursor is even when the timeline is scrolled.
  const dropMs = (e: React.DragEvent) => snapEdge(clientXToMs(e.clientX));

  /** The clip under the cursor, for drags that attach to an existing element. */
  const clipAt = (trackId: string | null, ms: number): ElementRef | null => {
    if (!trackId) return null;
    const track = getTrack(scene.tracks, trackId);
    const hit = track?.elements.find(
      (el) => ms >= el.startTime && ms < el.startTime + el.duration,
    );
    return hit ? { trackId, elementId: hit.id } : null;
  };

  /**
   * The cut nearest the cursor: a transition belongs *between* two clips, so a
   * transition drag targets the boundary rather than whichever clip happens to be
   * under the pointer. `ref` is the outgoing clip, which owns the transition.
   */
  const cutAt = (
    trackId: string | null,
    ms: number,
  ): { ref: ElementRef; ms: number } | null => {
    if (!trackId) return null;
    const track = getTrack(scene.tracks, trackId);
    if (!track) return null;
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
    const threshold = pxToMs(CUT_SNAP_PX, zoomLevel);

    let best: { ref: ElementRef; ms: number } | null = null;
    let bestDist = threshold;
    for (let i = 0; i < sorted.length - 1; i++) {
      const outgoing = sorted[i];
      const incoming = sorted[i + 1];
      const bothVisual =
        (outgoing.type === "video" || outgoing.type === "image") &&
        (incoming.type === "video" || incoming.type === "image");
      if (!bothVisual) continue;
      const boundary = outgoing.startTime + outgoing.duration;
      const dist = Math.abs(boundary - ms);
      if (dist < bestDist) {
        bestDist = dist;
        best = { ref: { trackId, elementId: outgoing.id }, ms: boundary };
      }
    }
    return best;
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = dragPayloadKind(e.dataTransfer);
    const trackId = trackIdAtClientY(e.clientY);
    // Effects/transitions need a clip underneath; show "no drop" when there isn't one
    // so the cursor tells the user before they release.
    if (kind === "transition") {
      const ms = clientXToMs(e.clientX);
      const cut = cutAt(trackId, ms);
      e.dataTransfer.dropEffect = cut ? "copy" : "none";
      setDropTarget({ trackId, ms: cut?.ms ?? ms, clip: null, cut, kind });
      return;
    }
    if (targetsExistingClip(kind)) {
      const ms = clientXToMs(e.clientX);
      const target = clipAt(trackId, ms);
      e.dataTransfer.dropEffect = target ? "copy" : "none";
      setDropTarget({ trackId, ms, clip: target, cut: null, kind });
      return;
    }
    e.dataTransfer.dropEffect = "copy";
    setDropTarget({ trackId, ms: dropMs(e), clip: null, cut: null, kind });
  };

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear when the pointer actually leaves the canvas, not on child boundaries.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropTarget(null);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const startMs = dropMs(e);
    // The row under the cursor becomes the preferred track; placement falls back to
    // the automatic search when it is the wrong type or already occupied.
    const trackId = trackIdAtClientY(e.clientY) ?? undefined;
    setDropTarget(null);

    // Effects / motion / transitions attach to the clip under the cursor.
    const effectType = e.dataTransfer.getData(DND_EFFECT);
    const motionType = e.dataTransfer.getData(DND_MOTION);
    const transitionType = e.dataTransfer.getData(DND_TRANSITION);
    // A transition goes on the cut *between* two clips, so it targets the nearest
    // boundary rather than whichever clip is under the pointer.
    if (transitionType) {
      const cut = cutAt(trackId ?? null, clientXToMs(e.clientX));
      if (!cut) {
        toast.error(t("autoEdit.drop.noCut"));
        return;
      }
      const track = getTrack(scene.tracks, cut.ref.trackId);
      const next = track ? nextVisualSibling(track, cut.ref.elementId) : null;
      const outgoing = getElement(scene.tracks, cut.ref);
      if (!next || !outgoing) {
        toast.error(t("autoEdit.transition.needsNext"));
        return;
      }
      const def = transitionDefinition(transitionType as TransitionType);
      setSelection({ elements: [cut.ref], keyframes: [] });
      execute(
        updateTransitionCommand(cut.ref, {
          type: def.type,
          durationMs: Math.min(def.durationMs, outgoing.duration, next.duration),
        }),
      );
      return;
    }

    if (effectType || motionType) {
      const target = clipAt(trackId ?? null, clientXToMs(e.clientX));

      // Dropping a filter effect on empty space makes it a *layer*: it applies to
      // everything composited below it for its span, instead of to one clip.
      if (!target && effectType) {
        execute(addEffectLayerCommand(effectType, startMs, t("autoEdit.effects")));
        return;
      }
      if (!target) {
        toast.error(t("autoEdit.drop.noClip"));
        return;
      }
      setSelection({ elements: [target], keyframes: [] });
      if (effectType) execute(addEffectCommand(target, effectType));
      else execute(updateMotionEffectCommand(target, motionType as MotionEffectType));
      return;
    }

    const mediaPath = e.dataTransfer.getData(DND_MEDIA);
    if (mediaPath) {
      const asset = mediaAssets[mediaPath];
      if (asset) {
        await importMediaFiles(
          [{ path: asset.path, name: asset.name, kind: asset.kind, previewUrl: asset.previewUrl }],
          { startMs, trackId },
        );
      }
      return;
    }
    if (e.dataTransfer.files.length > 0) {
      const picked = await pickedFromDroppedFiles(Array.from(e.dataTransfer.files));
      if (picked.length > 0) await importMediaFiles(picked, { startMs, trackId });
    }
  };

  return { onDragOver, onDragLeave, onDrop };
}
