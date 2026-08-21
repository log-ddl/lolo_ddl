import {
  createAudioElement,
  createAudioTrack,
  createEffectElement,
  createEffectTrack,
  createImageElement,
  createScene,
  createTextTrack,
  createVideoElement,
  createVideoTrack,
} from "../defaults";
import { newId } from "../lib/id";
import { mergeParams, type ParamValues } from "../lib/params";
import { cloneAnimations, removeKeyframeAt, upsertScalarKeyframe } from "../lib/animation";
import { buildDefaultEffect, getEffectDefinition } from "../lib/effects";
import { buildDefaultMask, type MaskDef } from "../lib/masks";
import { clampRate } from "../lib/retime";
import { defaultDurationMs as defaultTransitionDurationMs } from "../lib/transitions";
import {
  getElement,
  getScene,
  getTrack,
  insertElement,
  prependTrack,
  removeElement,
  replaceElement,
  updateElement,
  updateTracks,
  updateTrack,
} from "../lib/mutate";
import { canPlaceOnTrack, findFirstAvailableTrack } from "../lib/placement";
import type {
  AudioTrack,
  CreateTimelineElement,
  EffectTrack,
  ElementRef,
  MotionEffectType,
  TextTrack,
  TimelineElement,
  TrackType,
  TransitionConfig,
  TransitionType,
  VideoTrack,
} from "../types";
import { findTrackContainer } from "../lib/mutate";
import type { EditorCommand } from "../store/history";

/* ------------------------------------------------------------------ */
/* Elements                                                           */
/* ------------------------------------------------------------------ */

/** Create a new element in a track (id assigned once at construction). */
export function addElementCommand(
  trackId: string,
  element: CreateTimelineElement,
  index?: number,
  label = "Add element",
): EditorCommand {
  const withId = { ...element, id: newId("el") } as TimelineElement;
  return {
    id: newId("cmd"),
    label,
    apply: (project) =>
      updateTracks(project, project.currentSceneId, (tracks) =>
        insertElement(tracks, trackId, withId, index),
      ),
  };
}

/**
 * Drop a ready-made element onto the timeline with opencut's automatic placement:
 * it lands on the first existing track of its type that has free space at its start
 * time; otherwise a new track is created (overlay tracks stack above, audio tracks
 * mix in). No manual "add track" step is needed.
 *
 * `preferredTrackId` (the track the user actually dropped on) wins whenever it is
 * the right type and has room; otherwise placement falls back to the search order.
 */
export function addElementToTrackOfTypeCommand(
  element: TimelineElement,
  trackType: TrackType,
  label = "Add media",
  preferredTrackId?: string,
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const scene = getScene(project);
      const preferred = preferredTrackId ? getTrack(scene.tracks, preferredTrackId) : null;
      const preferredUsable =
        preferred != null &&
        preferred.type === trackType &&
        canPlaceOnTrack(preferred, element.startTime, element.duration)
          ? preferred
          : null;
      const existing =
        preferredUsable ??
        findFirstAvailableTrack(
          scene.tracks,
          trackType,
          element.startTime,
          element.duration,
        );
      if (existing) {
        return updateTracks(project, project.currentSceneId, (tracks) =>
          insertElement(tracks, existing.id, element),
        );
      }
      const track = createTrackForType(trackType);
      return updateTracks(project, project.currentSceneId, (tracks) =>
        insertElement(prependTrack(tracks, track), track.id, element),
      );
    },
  };
}

/**
 * Add a filter effect as its own timeline layer. It lands on the first effect
 * track with room at that time, or a new effect track stacked on top — so a
 * dropped effect never silently replaces one that is already there.
 */
export function addEffectLayerCommand(
  effectType: string,
  startTime: number,
  label = "Add effect layer",
): EditorCommand {
  const def = getEffectDefinition(effectType);
  const params: ParamValues = {};
  for (const p of def?.params ?? []) params[p.key] = p.default;

  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const element = createEffectElement({
        effectType,
        name: def?.name ?? effectType,
        startTime: Math.max(0, Math.round(startTime)),
        params,
      });
      const scene = getScene(project);
      const existing = findFirstAvailableTrack(
        scene.tracks,
        "effect",
        element.startTime,
        element.duration,
      );
      if (existing) {
        return updateTracks(project, project.currentSceneId, (tracks) =>
          insertElement(tracks, existing.id, element),
        );
      }
      const track = createEffectTrack();
      return updateTracks(project, project.currentSceneId, (tracks) =>
        insertElement(prependTrack(tracks, track), track.id, element),
      );
    },
  };
}

/* ------------------------------------------------------------------ */
/* Auto import                                                        */
/* ------------------------------------------------------------------ */

/** One resolved shot from an imported JSON/CSV shot list. */
export interface AutoShot {
  mediaPath: string;
  kind: "video" | "image";
  name: string;
  /** Slot length on the timeline (ms). */
  duration: number;
  /** Real source length, when known — used to clamp a video's trim. */
  sourceDurationMs?: number;
  voicePath?: string;
  voiceDurationMs?: number;
  motionEffect?: MotionEffectType;
  transition?: TransitionType;
}

/**
 * Lay an imported shot list onto the timeline as one undoable step: visuals butt
 * up against each other on the main track, each voice-over sits under its own
 * shot on a single audio track.
 *
 * This replaces the current scene's contents rather than appending, because an
 * imported list describes a whole edit, not an addition to one.
 */
export function buildAutoTimelineCommand(
  shots: AutoShot[],
  label = "Auto import",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const mainTrack = createVideoTrack({ name: "Main" });
      const audioTrack = createAudioTrack();
      let cursor = 0;

      for (const [index, shot] of shots.entries()) {
        const isLast = index === shots.length - 1;
        const element =
          shot.kind === "video"
            ? createVideoElement({
                mediaPath: shot.mediaPath,
                name: shot.name,
                duration: shot.duration,
                startTime: cursor,
                sourceDuration: shot.sourceDurationMs,
                motionEffect: shot.motionEffect,
                // A transition on the final shot has nothing to fade into.
                transitionToNext:
                  !isLast && shot.transition && shot.transition !== "none"
                    ? {
                        type: shot.transition,
                        durationMs: Math.min(
                          defaultTransitionDurationMs(shot.transition),
                          shot.duration,
                          shots[index + 1]?.duration ?? shot.duration,
                        ),
                      }
                    : undefined,
              })
            : createImageElement({
                mediaPath: shot.mediaPath,
                name: shot.name,
                duration: shot.duration,
                startTime: cursor,
                motionEffect: shot.motionEffect,
                transitionToNext:
                  !isLast && shot.transition && shot.transition !== "none"
                    ? {
                        type: shot.transition,
                        durationMs: Math.min(
                          defaultTransitionDurationMs(shot.transition),
                          shot.duration,
                          shots[index + 1]?.duration ?? shot.duration,
                        ),
                      }
                    : undefined,
              });
        mainTrack.elements.push(element);

        if (shot.voicePath) {
          audioTrack.elements.push(
            createAudioElement({
              mediaPath: shot.voicePath,
              name: shot.name,
              duration: shot.voiceDurationMs ?? shot.duration,
              startTime: cursor,
            }),
          );
        }

        cursor += shot.duration;
      }

      return updateTracks(project, project.currentSceneId, (tracks) => ({
        ...tracks,
        overlay: [],
        main: mainTrack,
        audio: audioTrack.elements.length > 0 ? [audioTrack] : tracks.audio,
      }));
    },
  };
}

export function removeElementsCommand(
  refs: ElementRef[],
  label = "Delete element",
): EditorCommand {
  return {
    id: newId("cmd"),
    label: refs.length > 1 ? `Delete ${refs.length} elements` : label,
    apply: (project) => {
      let next = project;
      for (const ref of refs) {
        next = updateTracks(next, next.currentSceneId, (tracks) => removeElement(tracks, ref));
      }
      return next;
    },
  };
}

export interface DuplicateResult {
  command: EditorCommand;
  /** Populated with the duplicated elements' refs once `apply` runs. */
  refs: ElementRef[];
}

/**
 * Duplicate the selected elements onto a fresh track of their type (opencut's
 * "always new track" strategy), keeping their start times. Returns the command
 * plus the new refs so the caller can select the copies.
 */
export function duplicateElementsCommand(
  refs: ElementRef[],
  label = "Duplicate element",
): DuplicateResult {
  const duplicatedRefs: ElementRef[] = [];
  const command: EditorCommand = {
    id: newId("cmd"),
    label: refs.length > 1 ? `Duplicate ${refs.length} elements` : label,
    apply: (project) => {
      duplicatedRefs.length = 0;
      const tracks = getScene(project).tracks;

      // Group refs by source track: each group duplicates onto one new track.
      const byTrack = new Map<string, ElementRef[]>();
      for (const ref of refs) {
        const list = byTrack.get(ref.trackId) ?? [];
        list.push(ref);
        byTrack.set(ref.trackId, list);
      }

      let next = project;
      for (const [trackId, trackRefs] of byTrack) {
        const sourceTrack = getTrack(tracks, trackId);
        if (!sourceTrack) continue;

        const newTrackId = newId("trk");
        const clones: TimelineElement[] = [];
        for (const ref of trackRefs) {
          const element = sourceTrack.elements.find((e) => e.id === ref.elementId);
          if (!element) continue;
          const newElementId = newId("el");
          clones.push({
            ...element,
            id: newElementId,
            name: `${element.name} (copy)`,
            animations: cloneAnimations(element.animations),
          });
          duplicatedRefs.push({ trackId: newTrackId, elementId: newElementId });
        }
        if (clones.length === 0) continue;

        const newTrack = createTrackForType(sourceTrack.type, newTrackId);
        next = updateTracks(next, next.currentSceneId, (current) => {
          let nextTracks = prependTrack(current, newTrack);
          for (const clone of clones) nextTracks = insertElement(nextTracks, newTrackId, clone);
          return nextTracks;
        });
      }

      return next;
    },
  };
  return { command, refs: duplicatedRefs };
}

export function updateElementCommand(
  ref: ElementRef,
  updater: (element: TimelineElement) => TimelineElement,
  label = "Edit element",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => updateElement(project, ref, updater),
  };
}

export function updateElementParamsCommand(
  ref: ElementRef,
  patch: Record<string, number | string | boolean>,
  label = "Edit",
): EditorCommand {
  return updateElementCommand(
    ref,
    (element) => ({ ...element, params: mergeParams(element.params, patch) }),
    label,
  );
}

/** Set the project canvas size (used to auto-fit the canvas to the first media). */
export function updateCanvasSizeCommand(
  width: number,
  height: number,
  label = "Fit canvas",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => ({
      ...project,
      settings: { ...project.settings, canvasSize: { width, height } },
    }),
  };
}

export function updateRetimeCommand(
  ref: ElementRef,
  rate: number,
  label = "Speed",
): EditorCommand {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "audio") return element;
      return {
        ...element,
        retime: { ...(element.retime ?? { rate: 1 }), rate: clampRate(rate) },
      };
    },
    label,
  );
}

/** Set or clear the crossfade into the next clip on the same track. */
export function updateTransitionCommand(
  ref: ElementRef,
  transition: TransitionConfig | null,
  label = "Transition",
): EditorCommand {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "image") return element;
      return { ...element, transitionToNext: transition ?? undefined };
    },
    label,
  );
}

/** Set the Ken Burns–style motion effect (zoom/pan) on a media clip. */
export function updateMotionEffectCommand(
  ref: ElementRef,
  motionEffect: MotionEffectType,
  label = "Motion",
): EditorCommand {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "image") return element;
      const effect = motionEffect === "none" ? undefined : motionEffect;
      return { ...element, motionEffect: effect };
    },
    label,
  );
}

export function moveElementCommand(
  ref: ElementRef,
  newStartTime: number,
  label = "Move element",
): EditorCommand {
  return updateElementCommand(
    ref,
    (element) => ({ ...element, startTime: Math.max(0, Math.round(newStartTime)) }),
    label,
  );
}

/**
 * Shift a group of elements (one undo step) by a time delta, each staying on its
 * own track. Used by multi-select group move.
 */
export function moveElementsByDeltaCommand(
  refs: ElementRef[],
  deltaMs: number,
  label = "Move elements",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      let next = project;
      for (const ref of refs) {
        next = updateElement(next, ref, (element) => ({
          ...element,
          startTime: Math.max(0, Math.round(element.startTime + deltaMs)),
        }));
      }
      return next;
    },
  };
}

/** Move an element to another track (and optionally a new time) in one undoable step. */
export function moveElementToTrackCommand(
  ref: ElementRef,
  targetTrackId: string,
  newStartTime: number,
  label = "Move element",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const tracks = getScene(project).tracks;
      const element = getElement(tracks, ref);
      if (!element) return project;
      const startTime = Math.max(0, Math.round(newStartTime));

      if (ref.trackId === targetTrackId) {
        return updateElement(project, ref, (e) => ({ ...e, startTime }));
      }

      const moved = { ...element, startTime };
      return updateTracks(project, project.currentSceneId, (t) => {
        const without = removeElement(t, ref);
        return insertElement(without, targetTrackId, moved);
      });
    },
  };
}

export interface TrimPatch {
  startTime?: number;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
}

export function trimElementCommand(
  ref: ElementRef,
  patch: TrimPatch,
  label = "Trim element",
): EditorCommand {
  return updateElementCommand(ref, (element) => ({ ...element, ...patch }), label);
}

/** Split an element at a timeline time into two elements. */
export function splitElementCommand(
  ref: ElementRef,
  splitMs: number,
  label = "Split element",
): EditorCommand {
  const rightId = newId("el");
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const tracks = getScene(project).tracks;
      const element = getElement(tracks, ref);
      if (!element) return project;

      const offset = Math.round(splitMs - element.startTime);
      if (offset <= 0 || offset >= element.duration) return project;

      // Source-time offset scales with retime rate (retimed clips play faster/slower).
      const rate =
        element.type === "video" || element.type === "audio"
          ? element.retime?.rate ?? 1
          : 1;
      const sourceOffset = Math.round(offset * rate);
      const remaining = element.duration - offset;
      const remainingSource = Math.round(remaining * rate);

      const left = {
        ...element,
        duration: offset,
        trimEnd: (element.trimEnd ?? 0) + remainingSource,
      };
      const right = {
        ...element,
        id: rightId,
        startTime: splitMs,
        duration: remaining,
        trimStart: (element.trimStart ?? 0) + sourceOffset,
      };

      return updateTracks(project, project.currentSceneId, (tracks) =>
        replaceElement(tracks, ref, [left, right]),
      );
    },
  };
}

/* ------------------------------------------------------------------ */
/* Tracks                                                             */
/* ------------------------------------------------------------------ */

export function removeTrackCommand(trackId: string, label = "Remove track"): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) =>
      updateTracks(project, project.currentSceneId, (tracks) => {
        const container = findTrackContainer(tracks, trackId);
        if (!container) return tracks;
        if (container === "main") return tracks; // main track is permanent
        if (container === "overlay")
          return { ...tracks, overlay: tracks.overlay.filter((t) => t.id !== trackId) };
        return { ...tracks, audio: tracks.audio.filter((t) => t.id !== trackId) };
      }),
  };
}

export function toggleTrackHiddenCommand(
  trackId: string,
  label = "Toggle track",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) =>
      updateTrack(project, trackId, (track) => {
        if ("hidden" in track) return { ...track, hidden: !track.hidden } as typeof track;
        return track;
      }),
  };
}

export function toggleTrackMutedCommand(
  trackId: string,
  label = "Mute track",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) =>
      updateTrack(project, trackId, (track) => {
        if ("muted" in track) return { ...track, muted: !track.muted } as typeof track;
        return track;
      }),
  };
}

/* ------------------------------------------------------------------ */
/* Scenes                                                             */
/* ------------------------------------------------------------------ */

/** Create a new scene and make it active (opencut scenes are separate compositions). */
export function createSceneCommand(name = "Scene", label = "Add scene"): EditorCommand {
  const scene = createScene({ name, isMain: false });
  return {
    id: newId("cmd"),
    label,
    apply: (project) => ({
      ...project,
      scenes: [...project.scenes, scene],
      currentSceneId: scene.id,
    }),
  };
}

export function renameSceneCommand(
  sceneId: string,
  name: string,
  label = "Rename scene",
): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => ({
      ...project,
      scenes: project.scenes.map((s) => (s.id === sceneId ? { ...s, name } : s)),
    }),
  };
}

export function deleteSceneCommand(sceneId: string, label = "Delete scene"): EditorCommand {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const scene = project.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.isMain) return project;
      const scenes = project.scenes.filter((s) => s.id !== sceneId);
      if (scenes.length === 0) return project;
      const currentSceneId =
        project.currentSceneId === sceneId
          ? (scenes.find((s) => s.isMain) ?? scenes[0]).id
          : project.currentSceneId;
      return { ...project, scenes, currentSceneId };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Effects / masks / keyframes                                        */
/* ------------------------------------------------------------------ */

export function addEffectCommand(
  ref: ElementRef,
  effectType: string,
  label = "Add effect",
): EditorCommand {
  const effect = buildDefaultEffect(effectType);
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return { ...element, effects: [...(element.effects ?? []), effect] };
  }, label);
}

export function removeEffectCommand(
  ref: ElementRef,
  effectId: string,
  label = "Remove effect",
): EditorCommand {
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return { ...element, effects: (element.effects ?? []).filter((e) => e.id !== effectId) };
  }, label);
}

export function updateEffectCommand(
  ref: ElementRef,
  effectId: string,
  patch: { enabled?: boolean; params?: ParamValues },
  label = "Edit effect",
): EditorCommand {
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return {
      ...element,
      effects: (element.effects ?? []).map((e) =>
        e.id === effectId
          ? { ...e, ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}), params: { ...e.params, ...(patch.params ?? {}) } }
          : e,
      ),
    };
  }, label);
}

export function addMaskCommand(
  ref: ElementRef,
  maskType: MaskDef["type"],
  label = "Add mask",
): EditorCommand {
  const mask = buildDefaultMask(maskType);
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return { ...element, masks: [...(element.masks ?? []), mask] };
  }, label);
}

export function removeMaskCommand(
  ref: ElementRef,
  maskId: string,
  label = "Remove mask",
): EditorCommand {
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return { ...element, masks: (element.masks ?? []).filter((m) => m.id !== maskId) };
  }, label);
}

export function updateMaskCommand(
  ref: ElementRef,
  maskId: string,
  patch: { feather?: number; inverted?: boolean },
  label = "Edit mask",
): EditorCommand {
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return {
      ...element,
      masks: (element.masks ?? []).map((m) =>
        m.id === maskId ? ({ ...m, params: { ...m.params, ...patch } } as typeof m) : m,
      ),
    };
  }, label);
}

export function addKeyframeCommand(
  ref: ElementRef,
  propertyPath: string,
  time: number,
  value: number,
  label = "Add keyframe",
): EditorCommand {
  return updateElementCommand(ref, (element) => ({
    ...element,
    animations: upsertScalarKeyframe(element.animations, propertyPath, time, value),
  }), label);
}

export function removeKeyframeCommand(
  ref: ElementRef,
  propertyPath: string,
  time: number,
  label = "Remove keyframe",
): EditorCommand {
  return updateElementCommand(ref, (element) => ({
    ...element,
    animations: removeKeyframeAt(element.animations, propertyPath, time),
  }), label);
}

function createTrackForType(
  type: TrackType,
  id?: string,
): VideoTrack | TextTrack | AudioTrack | EffectTrack {
  switch (type) {
    case "video":
      return createVideoTrack(id ? { id } : undefined);
    case "text":
      return createTextTrack(id ? { id } : undefined);
    case "audio":
      return createAudioTrack(id ? { id } : undefined);
    case "effect":
      return createEffectTrack(id ? { id } : undefined);
  }
}
