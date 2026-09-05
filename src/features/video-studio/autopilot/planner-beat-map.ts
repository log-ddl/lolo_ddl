/**
 * Maps a planner's shots[] onto the locked audio beats a single planning call was
 * given. Pure and dependency-free so it can be unit tested directly.
 *
 * A chapter planner only ever sees its own slice of the film, so its shots[] is
 * positional: item 0 belongs to the first beat handed to THAT call, whose global
 * index may be 36, not 1. Trusting a chapter-local 1..N numbering against global
 * beat indexes stranded every beat of every chapter after the first on a generic
 * fallback prompt, which then tripped the "planner returned no shots" guard.
 */

import type { PlannerItem } from './prompts';

/** Only the field this mapping needs, so tests don't have to build full beats. */
export interface BeatIndexRef {
  index: number;
}

/**
 * `beatIndex` is honoured only when every item declares a distinct index that
 * really belongs to this slice — that is the one case where the planner provably
 * used the supplied global numbering. Anything else (missing indexes, a
 * chapter-local 1..N run, duplicates, partial overlap) maps by position, which is
 * the order both the beats payload and the JSON contract are defined in.
 */
export function mapPlannerItemsToBeats<T extends Partial<PlannerItem>>(
  items: T[],
  beats: BeatIndexRef[],
): Map<number, T> {
  const beatIndexes = new Set(beats.map((beat) => beat.index));
  const declared = items.map((item) => Number(item.beatIndex));
  const trustDeclared = items.length > 0
    && declared.every((index) => Number.isInteger(index) && beatIndexes.has(index))
    && new Set(declared).size === declared.length;
  const byBeat = new Map<number, T>();
  items.forEach((item, position) => {
    const beatIndex = trustDeclared ? declared[position] : beats[position]?.index;
    if (beatIndex === undefined || byBeat.has(beatIndex)) return;
    byBeat.set(beatIndex, item);
  });
  return byBeat;
}
