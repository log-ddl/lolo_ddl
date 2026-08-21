import type { SrtSegment, CsvRow, MappedSegment } from './types';

/**
 * Build render segments from CSV rows and use SRT only as the timing source.
 *
 * CSV is the source of truth for segment count, text, order, and image path.
 * SRT text is only used to decide how many consecutive SRT entries belong to
 * each CSV row; the final segment text always comes from CSV.
 *
 * If csvRows is empty, we fall back to SRT-driven segments for manual image
 * assignment.
 */
export function fuzzyMatch(
  srtSegments: SrtSegment[],
  csvRows: CsvRow[],
): MappedSegment[] {
  if (csvRows.length === 0) {
    return srtSegments.map((s, i) => ({
      index: i + 1,
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
      imagePath: '',
      videoPath: '',
      confidence: null,
    }));
  }

  if (srtSegments.length === 0) {
    return csvRows.map((row, i) => ({
      index: i + 1,
      startMs: 0,
      endMs: 0,
      text: row.voice || row.text,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? '',
      confidence: 0,
    }));
  }

  const timeline = buildTokenTimeline(srtSegments);
  if (timeline.length > 0) {
    return alignCsvRowsToTokenTimeline(csvRows, timeline, srtSegments);
  }

  const result: MappedSegment[] = [];
  let srtPointer = 0;
  let lastEndMs = srtSegments[0]?.startMs ?? 0;

  for (let ci = 0; ci < csvRows.length; ci += 1) {
    const row = csvRows[ci];
    const csvText = row.voice || row.text;

    if (srtPointer >= srtSegments.length) {
      result.push({
        index: ci + 1,
        startMs: lastEndMs,
        endMs: lastEndMs,
        text: csvText,
        imagePath: row.imagePath,
        videoPath: row.videoPath ?? '',
        confidence: 0,
      });
      continue;
    }

    const remainingCsvRows = csvRows.length - ci - 1;
    const remainingSrt = srtSegments.length - srtPointer;
    const maxEnd = remainingSrt > remainingCsvRows
      ? srtSegments.length - remainingCsvRows - 1
      : srtPointer;

    const csvNorm = normalize(csvText);
    let bestEnd = srtPointer;
    let bestScore = -1;
    let combined = '';

    for (let si = srtPointer; si <= maxEnd; si += 1) {
      combined = combined ? `${combined} ${srtSegments[si].text}` : srtSegments[si].text;
      const score = similarity(normalize(combined), csvNorm);
      if (score > bestScore) {
        bestScore = score;
        bestEnd = si;
      }
    }

    const startMs = srtSegments[srtPointer].startMs;
    const endMs = srtSegments[bestEnd].endMs;
    lastEndMs = endMs;

    result.push({
      index: ci + 1,
      startMs,
      endMs,
      text: csvText,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? '',
      confidence: Math.max(0, bestScore),
    });

    srtPointer = bestEnd + 1;
  }

  return result;
}

interface TimedToken {
  text: string;
  startMs: number;
  endMs: number;
  isSegmentEnd: boolean;
}

function buildTokenTimeline(srtSegments: SrtSegment[]): TimedToken[] {
  const timeline: TimedToken[] = [];

  for (const segment of srtSegments) {
    const tokens = tokenize(segment.text);
    if (tokens.length === 0) continue;

    const duration = Math.max(0, segment.endMs - segment.startMs);
    for (let i = 0; i < tokens.length; i += 1) {
      const startMs = segment.startMs + Math.round((duration * i) / tokens.length);
      const endMs = segment.startMs + Math.round((duration * (i + 1)) / tokens.length);
      timeline.push({ text: tokens[i], startMs, endMs, isSegmentEnd: i === tokens.length - 1 });
    }
  }

  return timeline;
}

function alignCsvRowsToTokenTimeline(
  csvRows: CsvRow[],
  timeline: TimedToken[],
  srtSegments: SrtSegment[],
): MappedSegment[] {
  const result: MappedSegment[] = [];
  let tokenPointer = 0;
  let lastEndMs = timeline[0]?.startMs ?? srtSegments[0]?.startMs ?? 0;
  const csvTokenRows = csvRows.map((row) => tokenize(row.voice || row.text));

  for (let ci = 0; ci < csvRows.length; ci += 1) {
    const row = csvRows[ci];
    const csvText = row.voice || row.text;

    if (tokenPointer >= timeline.length) {
      result.push({
        index: ci + 1,
        startMs: lastEndMs,
        endMs: lastEndMs,
        text: csvText,
        imagePath: row.imagePath,
        videoPath: row.videoPath ?? '',
        confidence: 0,
      });
      continue;
    }

    const remainingCsvRows = csvRows.length - ci - 1;
    const remainingTokens = timeline.length - tokenPointer;
    const takeCount = ci === csvRows.length - 1
      ? remainingTokens
      : findBestTokenCount({
          timeline,
          start: tokenPointer,
          maxCount: Math.max(1, remainingTokens - remainingCsvRows),
          currentTokens: csvTokenRows[ci],
          nextTokens: csvTokenRows[ci + 1] ?? [],
        });
    const startToken = timeline[tokenPointer];
    const endToken = timeline[tokenPointer + takeCount - 1];
    const consumedTokens = sliceTokenText(timeline, tokenPointer, takeCount);

    lastEndMs = endToken.endMs;
    result.push({
      index: ci + 1,
      startMs: startToken.startMs,
      endMs: endToken.endMs,
      text: csvText,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? '',
      confidence: similarity(consumedTokens, csvTokenRows[ci].join(' ')),
    });

    tokenPointer += takeCount;
  }

  return result;
}

function findBestTokenCount(input: {
  timeline: TimedToken[];
  start: number;
  maxCount: number;
  currentTokens: string[];
  nextTokens: string[];
}): number {
  const { timeline, start, maxCount, currentTokens, nextTokens } = input;
  const desiredCount = Math.max(1, currentTokens.length);
  const nextDesiredCount = Math.max(1, nextTokens.length);
  const lower = Math.max(1, Math.min(maxCount, Math.floor(desiredCount * 0.45) - 2));
  const upper = Math.min(maxCount, Math.max(desiredCount + 8, Math.ceil(desiredCount * 2.2)));
  const exactCount = findExactTokenSequenceCount(timeline, start, maxCount, currentTokens);
  const candidates = new Set<number>([1, Math.min(desiredCount, maxCount), maxCount]);

  for (let count = lower; count <= upper; count += 1) candidates.add(count);
  if (exactCount != null) {
    candidates.add(exactCount);
    candidates.add(Math.max(1, exactCount - 1));
    candidates.add(Math.min(maxCount, exactCount + 1));
  }

  let bestCount = Math.min(desiredCount, maxCount);
  let bestScore = -Infinity;
  for (const count of candidates) {
    if (count < 1 || count > maxCount) continue;

    const currentText = sliceTokenText(timeline, start, count);
    const currentScore = similarity(currentText, currentTokens.join(' '));
    const nextScore = nextTokens.length > 0
      ? similarity(sliceTokenText(timeline, start + count, Math.min(nextDesiredCount, timeline.length - start - count)), nextTokens.join(' '))
      : 0;
    const lengthScore = Math.min(count, desiredCount) / Math.max(count, desiredCount);
    const boundaryBonus = timeline[start + count - 1]?.isSegmentEnd ? 0.035 : 0;
    const exactBonus = exactCount === count ? 0.08 : 0;
    const score = currentScore * 0.78 + nextScore * 0.12 + lengthScore * 0.10 + boundaryBonus + exactBonus;

    if (score > bestScore) {
      bestScore = score;
      bestCount = count;
    }
  }

  return bestCount;
}

function findExactTokenSequenceCount(
  timeline: TimedToken[],
  start: number,
  maxCount: number,
  targetTokens: string[],
): number | null {
  if (targetTokens.length === 0) return null;
  const limit = Math.min(maxCount, Math.max(targetTokens.length * 2, targetTokens.length + 12));

  for (let offset = 0; offset <= Math.min(4, limit - targetTokens.length); offset += 1) {
    let ok = true;
    for (let i = 0; i < targetTokens.length; i += 1) {
      if (timeline[start + offset + i]?.text !== targetTokens[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return offset + targetTokens.length;
  }

  return null;
}

function sliceTokenText(timeline: TimedToken[], start: number, count: number): string {
  if (count <= 0) return '';
  return timeline
    .slice(start, start + count)
    .map((token) => token.text)
    .join(' ');
}

function tokenize(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // keep letters/digits across scripts
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token-based Jaccard similarity with length penalty.
 * Faster than full Levenshtein for sentence-length comparisons,
 * good enough for matching transcribed-audio sentences vs script.
 */
function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const tokensA = a.split(' ').filter(Boolean);
  const tokensB = b.split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect += 1;
  const union = setA.size + setB.size - intersect;
  const jaccard = union === 0 ? 0 : intersect / union;

  // Length similarity: 1 when same length, decays with ratio.
  const lenA = tokensA.length;
  const lenB = tokensB.length;
  const lenRatio = Math.min(lenA, lenB) / Math.max(lenA, lenB);

  return jaccard * 0.7 + lenRatio * 0.3;
}
