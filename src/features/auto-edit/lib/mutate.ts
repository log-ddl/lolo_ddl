import type {
  AudioTrack,
  ElementRef,
  OverlayTrack,
  SceneTracks,
  TimelineElement,
  TimelineTrack,
  TrackType,
  TProject,
  TScene,
} from "../types";
import { allTracks } from "../types";

/**
 * Immutable project / track / element accessors and updaters.
 * All updaters return a fresh project; nothing is mutated in place.
 */

/* ------------------------------------------------------------------ */
/* Lookups                                                            */
/* ------------------------------------------------------------------ */

export function getScene(project: TProject, sceneId?: string): TScene {
  const id = sceneId ?? project.currentSceneId;
  return project.scenes.find((s) => s.id === id) ?? project.scenes[0];
}

export function getSceneIndex(project: TProject, sceneId?: string): number {
  const id = sceneId ?? project.currentSceneId;
  return Math.max(0, project.scenes.findIndex((s) => s.id === id));
}

export function getTrack(tracks: SceneTracks, trackId: string): TimelineTrack | null {
  return allTracks(tracks).find((t) => t.id === trackId) ?? null;
}

export function getElement(tracks: SceneTracks, ref: ElementRef): TimelineElement | null {
  const track = getTrack(tracks, ref.trackId);
  return track?.elements.find((e) => e.id === ref.elementId) ?? null;
}

/** Locate the container that holds a track, for immutable replacement. */
export type TrackContainer = "overlay" | "main" | "audio";

export function findTrackContainer(tracks: SceneTracks, trackId: string): TrackContainer | null {
  if (tracks.main.id === trackId) return "main";
  if (tracks.overlay.some((t) => t.id === trackId)) return "overlay";
  if (tracks.audio.some((t) => t.id === trackId)) return "audio";
  return null;
}

/* ------------------------------------------------------------------ */
/* Project / scene / track updaters                                   */
/* ------------------------------------------------------------------ */

export function mapScenes(project: TProject, fn: (scene: TScene) => TScene): TProject {
  return { ...project, scenes: project.scenes.map(fn) };
}

export function updateScene(
  project: TProject,
  sceneId: string | undefined,
  fn: (scene: TScene) => TScene,
): TProject {
  const id = sceneId ?? project.currentSceneId;
  return {
    ...project,
    scenes: project.scenes.map((s) => (s.id === id ? fn(s) : s)),
  };
}

export function updateCurrentScene(
  project: TProject,
  fn: (scene: TScene) => TScene,
): TProject {
  return updateScene(project, project.currentSceneId, fn);
}

export function updateTracks(
  project: TProject,
  sceneId: string | undefined,
  fn: (tracks: SceneTracks) => SceneTracks,
): TProject {
  return updateScene(project, sceneId, (scene) => ({ ...scene, tracks: fn(scene.tracks) }));
}

export function updateTrack(
  project: TProject,
  trackId: string,
  fn: (track: TimelineTrack) => TimelineTrack,
): TProject {
  return updateTracks(project, undefined, (tracks) => {
    const container = findTrackContainer(tracks, trackId);
    if (!container) return tracks;
    const map = (t: TimelineTrack) => (t.id === trackId ? fn(t) : t);
    if (container === "main") return { ...tracks, main: map(tracks.main) as typeof tracks.main };
    if (container === "overlay")
      return { ...tracks, overlay: tracks.overlay.map(map) as typeof tracks.overlay };
    return { ...tracks, audio: tracks.audio.map(map) as typeof tracks.audio };
  });
}

/* ------------------------------------------------------------------ */
/* Element updaters                                                   */
/* ------------------------------------------------------------------ */

function mapTrackElements(
  track: TimelineTrack,
  elementId: string,
  fn: (element: TimelineElement) => TimelineElement,
): TimelineTrack {
  return {
    ...track,
    elements: track.elements.map((e) => (e.id === elementId ? fn(e) : e)),
  } as TimelineTrack;
}

export function updateElement(
  project: TProject,
  ref: ElementRef,
  fn: (element: TimelineElement) => TimelineElement,
): TProject {
  return updateTrack(project, ref.trackId, (track) =>
    mapTrackElements(track, ref.elementId, fn),
  );
}

/** Update a specific element with a typed updater (caller asserts the element kind). */
export function updateTypedElement<T extends TimelineElement>(
  project: TProject,
  ref: ElementRef,
  fn: (element: T) => T,
): TProject {
  return updateElement(project, ref, (e) => fn(e as T) as TimelineElement);
}

/* ------------------------------------------------------------------ */
/* Batch element ops                                                  */
/* ------------------------------------------------------------------ */

export function mapAllElements(
  tracks: SceneTracks,
  fn: (element: TimelineElement) => TimelineElement,
): SceneTracks {
  const map = (t: TimelineTrack) => ({
    ...t,
    elements: t.elements.map(fn),
  }) as TimelineTrack;
  return {
    overlay: tracks.overlay.map(map),
    main: map(tracks.main),
    audio: tracks.audio.map(map),
  } as SceneTracks;
}

export function removeElement(tracks: SceneTracks, ref: ElementRef): SceneTracks {
  const filter = (t: TimelineTrack) =>
    t.id === ref.trackId
      ? ({ ...t, elements: t.elements.filter((e) => e.id !== ref.elementId) } as TimelineTrack)
      : t;
  return {
    overlay: tracks.overlay.map(filter),
    main: filter(tracks.main),
    audio: tracks.audio.map(filter),
  } as SceneTracks;
}

/** Replace one element with several in place (used by split). */
export function replaceElement(
  tracks: SceneTracks,
  ref: ElementRef,
  replacements: TimelineElement[],
): SceneTracks {
  const map = (t: TimelineTrack) =>
    t.id !== ref.trackId
      ? t
      : ({
          ...t,
          elements: t.elements.flatMap((e) =>
            e.id === ref.elementId ? replacements : [e],
          ),
        } as TimelineTrack);
  return {
    overlay: tracks.overlay.map(map),
    main: map(tracks.main),
    audio: tracks.audio.map(map),
  } as SceneTracks;
}

/** First track of a given type in render order, if any. */
export function findTrackOfType(tracks: SceneTracks, type: TrackType): TimelineTrack | null {
  return allTracks(tracks).find((t) => t.type === type) ?? null;
}

/** Append a track to its container (overlay for visual/effect, audio for audio). */
export function appendTrack(tracks: SceneTracks, track: TimelineTrack): SceneTracks {
  if (track.type === "audio") {
    return { ...tracks, audio: [...tracks.audio, track as AudioTrack] };
  }
  return { ...tracks, overlay: [...tracks.overlay, track as OverlayTrack] };
}

/**
 * Prepend a track to its container — used when auto-creating a track for an
 * overlapping drop, so the new overlay stacks *on top* of existing ones
 * (`overlay[0]` is topmost) and the new audio track mixes in first.
 */
export function prependTrack(tracks: SceneTracks, track: TimelineTrack): SceneTracks {
  if (track.type === "audio") {
    return { ...tracks, audio: [track as AudioTrack, ...tracks.audio] };
  }
  return { ...tracks, overlay: [track as OverlayTrack, ...tracks.overlay] };
}

/** Insert an element into a track at a given index (defaults to end). */
export function insertElement(
  tracks: SceneTracks,
  trackId: string,
  element: TimelineElement,
  index?: number,
): SceneTracks {
  const put = (t: TimelineTrack) => {
    if (t.id !== trackId) return t;
    const elements: TimelineElement[] = t.elements.slice();
    const at = index === undefined ? elements.length : Math.max(0, Math.min(index, elements.length));
    elements.splice(at, 0, element);
    return { ...t, elements } as TimelineTrack;
  };
  return {
    overlay: tracks.overlay.map(put),
    main: put(tracks.main),
    audio: tracks.audio.map(put),
  } as SceneTracks;
}

/**
 * The visual clip that follows `elementId` on the same track — the clip a
 * transition would fade into. `null` when the element is last on its track, which
 * is why a transition cannot be applied there.
 */
export function nextVisualSibling(
  track: TimelineTrack,
  elementId: string,
): TimelineElement | null {
  const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
  const index = sorted.findIndex((e) => e.id === elementId);
  if (index < 0) return null;
  const next = sorted[index + 1];
  return next && (next.type === "video" || next.type === "image") ? next : null;
}
