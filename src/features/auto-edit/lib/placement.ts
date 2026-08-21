import { allTracks } from "../types";
import type { SceneTracks, TimelineTrack, TrackType } from "../types";

/**
 * Automatic track placement — ported from opencut-classic
 * (`timeline/placement/overlap.ts` + `resolve.ts` "firstAvailable" strategy).
 *
 * Media dropped on the timeline is placed on the first existing track of its type
 * that has free space at the drop time; if none does, a new track is created. This
 * means video/image clips land on the main track (or an existing overlay video
 * track) and auto-stack onto a *new* overlay track when their time range overlaps
 * existing clips — no manual "add track" step.
 */

interface TimeSpanLike {
  startTime: number;
  duration: number;
}

/** Whether `[startTime, startTime + duration)` overlaps any element on the track. */
export function canPlaceOnTrack(
  track: { elements: TimeSpanLike[] },
  startTime: number,
  duration: number,
): boolean {
  const endTime = startTime + duration;
  return !track.elements.some((element) => {
    const elementEnd = element.startTime + element.duration;
    return startTime < elementEnd && endTime > element.startTime;
  });
}

/**
 * Find a start time at or near `startTime` where `duration` fits on `track`
 * without overlapping, ignoring `excludeElementId` (the element being moved).
 *
 * A track holds a sequence, not a stack: two clips on the same track occupying the
 * same time would both claim the frame. Rather than rejecting the drag outright,
 * this snaps the clip flush against whichever side of the blocking clip is closer
 * — the usual intent when dropping next to something. Returns `null` when neither
 * side has room, and the caller should abandon the move.
 */
export function resolveNonOverlappingStart({
  track,
  startTime,
  duration,
  excludeElementId,
}: {
  track: { elements: Array<TimeSpanLike & { id: string }> };
  startTime: number;
  duration: number;
  excludeElementId?: string;
}): number | null {
  const others = track.elements.filter((e) => e.id !== excludeElementId);
  const free = (start: number) =>
    start >= 0 &&
    !others.some(
      (e) => start < e.startTime + e.duration && start + duration > e.startTime,
    );

  if (free(startTime)) return startTime;

  // Gather the candidate slots flush against every blocking clip, nearest first.
  const candidates: number[] = [];
  for (const other of others) {
    const otherEnd = other.startTime + other.duration;
    if (startTime < otherEnd && startTime + duration > other.startTime) {
      candidates.push(otherEnd, other.startTime - duration);
    }
  }
  candidates.sort((a, b) => Math.abs(a - startTime) - Math.abs(b - startTime));
  return candidates.find(free) ?? null;
}

/**
 * First track of `trackType` with free space at the given time span, in opencut's
 * search order (overlay top→bottom, then main, then audio), or `null`.
 */
export function findFirstAvailableTrack(
  tracks: SceneTracks,
  trackType: TrackType,
  startTime: number,
  duration: number,
): TimelineTrack | null {
  return (
    allTracks(tracks).find(
      (track) => track.type === trackType && canPlaceOnTrack(track, startTime, duration),
    ) ?? null
  );
}
