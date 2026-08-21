export interface LongFormTimedUnit {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface LongFormChapterBoundary {
  id: string;
  index: number;
  title: string;
  startMs: number;
  endMs: number;
  startUnitIndex: number;
  endUnitIndex: number;
  unitIndexes: number[];
}

export interface LongFormCoverageResult {
  valid: boolean;
  missingIndexes: number[];
  duplicateIndexes: number[];
  outOfOrder: boolean;
}

export function splitTimedUnitsIntoChapters(
  units: LongFormTimedUnit[],
  options: { targetMs?: number; minMs?: number; maxMs?: number } = {},
): LongFormChapterBoundary[] {
  if (units.length === 0) return [];
  const targetMs = Math.max(30_000, options.targetMs ?? 180_000);
  const minMs = Math.min(targetMs, Math.max(15_000, options.minMs ?? 120_000));
  const maxMs = Math.max(targetMs, options.maxMs ?? 240_000);
  const chapters: LongFormChapterBoundary[] = [];
  let start = 0;

  while (start < units.length) {
    let end = start;
    let bestEnd = start;
    while (end < units.length) {
      const duration = units[end].endMs - units[start].startMs;
      const sentenceBoundary = /[.!?…]["'”’)]?\s*$/u.test(units[end].text.trim());
      if (duration >= minMs && sentenceBoundary) bestEnd = end;
      // Cut at a real sentence boundary once past target. If none was found yet
      // (bestEnd still == start — common for imported SRT with no end punctuation),
      // keep extending to maxMs instead of collapsing to a single-beat chapter.
      if (duration >= targetMs && bestEnd > start) {
        end = bestEnd;
        break;
      }
      if (duration >= maxMs) break;
      end += 1;
    }
    end = Math.min(end, units.length - 1);
    if (end === units.length - 1 || units[end].endMs - units[start].startMs < minMs) {
      end = Math.min(units.length - 1, Math.max(end, bestEnd));
    }
    const slice = units.slice(start, end + 1);
    const index = chapters.length + 1;
    chapters.push({
      id: `chapter-${String(index).padStart(2, '0')}`,
      index,
      title: `Chapter ${index}`,
      startMs: slice[0].startMs,
      endMs: slice[slice.length - 1].endMs,
      startUnitIndex: slice[0].index,
      endUnitIndex: slice[slice.length - 1].index,
      unitIndexes: slice.map((unit) => unit.index),
    });
    start = end + 1;
  }

  return chapters;
}

export function validateLongFormCoverage(
  sourceIndexes: number[],
  chapterIndexes: number[][],
): LongFormCoverageResult {
  const expected = new Set(sourceIndexes);
  const seen = new Map<number, number>();
  const flattened = chapterIndexes.flat();
  flattened.forEach((index) => seen.set(index, (seen.get(index) || 0) + 1));
  const missingIndexes = sourceIndexes.filter((index) => !seen.has(index));
  const duplicateIndexes = [...seen.entries()].filter(([, count]) => count > 1).map(([index]) => index);
  const relevant = flattened.filter((index) => expected.has(index));
  const outOfOrder = relevant.some((index, position) => position > 0 && index < relevant[position - 1]);
  return {
    valid: missingIndexes.length === 0 && duplicateIndexes.length === 0 && !outOfOrder,
    missingIndexes,
    duplicateIndexes,
    outOfOrder,
  };
}

export async function runConcurrentOrdered<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, Math.floor(concurrency)), items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}
