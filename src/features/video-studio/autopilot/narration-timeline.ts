import type { AutopilotSrtSegment } from './types';

const TARGET_BEAT_MS = 5_000;
const MIN_BEAT_MS = 2_500;
const MAX_BEAT_MS = 7_000;

export interface TimedNarrationBeat {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

function cleanNarrationText(value: string): string {
  return value
    .replace(/^\s*["“”']|["“”']\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract spoken text without trusting a later creative AI response. */
export function extractNarrationBlocks(scriptText: string): string[] {
  const lines = scriptText.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let collecting = false;
  let current: string[] = [];
  const flush = () => {
    const text = cleanNarrationText(current.join(' '));
    if (text) blocks.push(text);
    current = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\*\*/g, '').trim();
    const narration = line.match(/^(?:thuyết\s*minh|lời\s*dẫn|narration|voice[-\s]?over)\s*:\s*(.*)$/iu);
    if (narration) {
      if (collecting) flush();
      collecting = true;
      if (narration[1]) current.push(narration[1]);
      continue;
    }
    if (/^(?:cảnh|scene)\s*\d+|^(?:hình\s*ảnh|visual)\s*:/iu.test(line)) {
      if (collecting) flush();
      collecting = false;
      continue;
    }
    if (collecting && line) current.push(line);
  }
  if (collecting) flush();

  if (blocks.length > 0) return blocks;

  return scriptText
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((part) => cleanNarrationText(part.replace(/^#+\s*/gm, '')))
    .filter((part) => part.length > 0 && !/^(?:cảnh|scene|hình ảnh|visual)\b/iu.test(part));
}

function wordCount(text: string): number {
  return Math.max(1, text.trim().split(/\s+/u).filter(Boolean).length);
}

function splitText(text: string, parts: number): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (parts <= 1 || words.length <= 1) return [text.trim()];
  const result: string[] = [];
  for (let i = 0; i < parts; i += 1) {
    const start = Math.round((i / parts) * words.length);
    const end = Math.round(((i + 1) / parts) * words.length);
    const chunk = words.slice(start, Math.max(start + 1, end)).join(' ').trim();
    if (chunk) result.push(chunk);
  }
  return result;
}

function splitLongSegment(segment: AutopilotSrtSegment): AutopilotSrtSegment[] {
  const duration = Math.max(1, segment.endMs - segment.startMs);
  const parts = Math.max(1, Math.ceil(duration / MAX_BEAT_MS));
  if (parts === 1) return [segment];
  const texts = splitText(segment.text, parts);
  return texts.map((text, index) => ({
    index,
    startMs: Math.round(segment.startMs + (duration * index) / texts.length),
    endMs: Math.round(segment.startMs + (duration * (index + 1)) / texts.length),
    text,
  }));
}

function mergeToVisualBeats(segments: AutopilotSrtSegment[]): TimedNarrationBeat[] {
  const expanded = segments.flatMap(splitLongSegment).filter((seg) => seg.text.trim() && seg.endMs > seg.startMs);
  const beats: TimedNarrationBeat[] = [];
  let current: TimedNarrationBeat | null = null;

  const pushCurrent = () => {
    if (!current) return;
    beats.push({ ...current, index: beats.length + 1, text: cleanNarrationText(current.text) });
    current = null;
  };

  for (const seg of expanded) {
    if (!current) {
      current = { index: beats.length + 1, startMs: seg.startMs, endMs: seg.endMs, text: seg.text };
      continue;
    }
    const combinedDuration = seg.endMs - current.startMs;
    const currentDuration = current.endMs - current.startMs;
    if (combinedDuration > MAX_BEAT_MS && currentDuration >= MIN_BEAT_MS) pushCurrent();
    if (!current) {
      current = { index: beats.length + 1, startMs: seg.startMs, endMs: seg.endMs, text: seg.text };
      continue;
    }
    current.endMs = seg.endMs;
    current.text = `${current.text} ${seg.text}`;
    const duration = current.endMs - current.startMs;
    if (duration >= TARGET_BEAT_MS && /[.!?…]$/u.test(seg.text.trim())) pushCurrent();
    else if (duration >= MAX_BEAT_MS) pushCurrent();
  }
  pushCurrent();

  if (beats.length > 1) {
    const last = beats[beats.length - 1];
    const previous = beats[beats.length - 2];
    if (last.endMs - last.startMs < MIN_BEAT_MS && last.endMs - previous.startMs <= MAX_BEAT_MS + 1_000) {
      previous.endMs = last.endMs;
      previous.text = cleanNarrationText(`${previous.text} ${last.text}`);
      beats.pop();
    }
  }
  return beats.map((beat, index) => ({ ...beat, index: index + 1 }));
}

function applyShotSafetyCap(beats: TimedNarrationBeat[], maxShots?: number): TimedNarrationBeat[] {
  const limit = Math.floor(maxShots || 0);
  if (limit <= 0 || beats.length <= limit) return beats;
  const result = beats.map((beat) => ({ ...beat }));
  while (result.length > limit) {
    let best = -1;
    let bestDuration = Number.POSITIVE_INFINITY;
    for (let i = 0; i < result.length - 1; i += 1) {
      const duration = result[i + 1].endMs - result[i].startMs;
      if (duration <= MAX_BEAT_MS + 1_000 && duration < bestDuration) {
        best = i;
        bestDuration = duration;
      }
    }
    if (best < 0) break;
    result[best] = {
      ...result[best],
      endMs: result[best + 1].endMs,
      text: cleanNarrationText(`${result[best].text} ${result[best + 1].text}`),
    };
    result.splice(best + 1, 1);
  }
  return result.map((beat, index) => ({ ...beat, index: index + 1 }));
}

function attachLockedNarration(beats: TimedNarrationBeat[], narrationBlocks: string[]): TimedNarrationBeat[] {
  if (beats.length === 0 || narrationBlocks.length === 0) return beats;
  const words = narrationBlocks.join(' ').trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return beats;
  const totalDuration = Math.max(1, beats.at(-1)!.endMs - beats[0].startMs);
  let wordCursor = 0;
  return beats.map((beat, index) => {
    const isLast = index === beats.length - 1;
    const elapsed = beat.endMs - beats[0].startMs;
    const target = isLast ? words.length : Math.max(wordCursor + 1, Math.round((elapsed / totalDuration) * words.length));
    const text = words.slice(wordCursor, Math.min(words.length, target)).join(' ');
    wordCursor = Math.min(words.length, target);
    return { ...beat, text };
  });
}

/**
 * Lay blocks end to end on their measured lengths. The last block absorbs any
 * leftover so the timeline always ends exactly on the audio, and returns
 * undefined when the measurements do not cover the blocks we were given.
 */
function segmentsFromMeasuredBlocks(
  blocks: string[],
  blockDurationsMs: number[] | undefined,
  safeDuration: number,
): AutopilotSrtSegment[] | undefined {
  if (!blockDurationsMs || blockDurationsMs.length !== blocks.length || blocks.length === 0) return undefined;
  if (!blockDurationsMs.every((value) => Number.isFinite(value) && value > 0)) return undefined;
  let cursor = 0;
  return blocks.map((text, index) => {
    const isLast = index === blocks.length - 1;
    const endMs = isLast ? Math.max(cursor + 1, safeDuration) : cursor + blockDurationsMs[index];
    const segment = { index, startMs: cursor, endMs: Math.max(cursor + 1, endMs), text };
    cursor = segment.endMs;
    return segment;
  });
}

/**
 * Cut the blocks on subtitle timings instead of on a flat words-per-second guess.
 *
 * Every boundary is placed by asking the captions when that share of the narration
 * has been spoken, so it is anchored to a real timestamp on every caption line and
 * only interpolated inside the line it lands in. The share is a fraction of the
 * total rather than an absolute word index, so captions that spell things
 * differently from the script (digits vs words, a Whisper transcript) still map.
 *
 * A boundary that falls on a caption's first word lands on that caption's start,
 * which puts any silence before it at the end of the previous shot — the image
 * changes when the next line is spoken, not during the pause.
 */
function segmentsFromSubtitleAlignment(
  blocks: string[],
  subtitles: AutopilotSrtSegment[],
  safeDuration: number,
): AutopilotSrtSegment[] | undefined {
  if (blocks.length === 0) return undefined;
  const captions = subtitles
    .filter((seg) => seg.text.trim() && seg.endMs > seg.startMs)
    .map((seg) => ({ startMs: seg.startMs, endMs: seg.endMs, words: wordCount(seg.text) }))
    .sort((a, b) => a.startMs - b.startMs);
  if (captions.length === 0) return undefined;
  const captionWords = captions.reduce((sum, caption) => sum + caption.words, 0);
  const blockWords = blocks.map(wordCount);
  const totalBlockWords = blockWords.reduce((sum, count) => sum + count, 0);
  if (captionWords === 0 || totalBlockWords === 0) return undefined;

  const timeAtWord = (target: number): number => {
    if (target <= 0) return captions[0].startMs;
    let consumed = 0;
    for (const caption of captions) {
      if (target <= consumed + caption.words) {
        const within = (target - consumed) / caption.words;
        return caption.startMs + within * (caption.endMs - caption.startMs);
      }
      consumed += caption.words;
    }
    return captions[captions.length - 1].endMs;
  };

  let spokenWords = 0;
  let cursor = 0;
  return blocks.map((text, index) => {
    spokenWords += blockWords[index];
    const isLast = index === blocks.length - 1;
    // Every later block still needs a millisecond of its own, so a run of boundaries
    // landing on the same caption cannot eat the rest of the film.
    const remaining = blocks.length - index - 1;
    const endMs = isLast
      ? Math.max(cursor + 1, safeDuration)
      : Math.min(
          Math.max(cursor + 1, Math.round(timeAtWord((spokenWords / totalBlockWords) * captionWords))),
          Math.max(cursor + 1, safeDuration - remaining),
        );
    const segment = { index, startMs: cursor, endMs, text };
    cursor = segment.endMs;
    return segment;
  });
}

export function buildNarrationTimeline(
  narrationBlocks: string[],
  durationMs: number,
  subtitles: AutopilotSrtSegment[],
  maxShots?: number,
  blockDurationsMs?: number[],
): TimedNarrationBeat[] {
  const safeDuration = Math.max(1_000, Math.round(durationMs));
  const blocks = narrationBlocks.filter((text) => text.trim());
  const measured = segmentsFromMeasuredBlocks(blocks, blockDurationsMs, safeDuration);
  let source: AutopilotSrtSegment[];
  if (subtitles.length > 0) {
    source = subtitles.map((seg, index) => ({ ...seg, index }));
    source[0].startMs = 0;
    source[source.length - 1].endMs = Math.max(source[source.length - 1].endMs, safeDuration);
  } else if (measured) {
    source = measured;
  } else {
    const totalWords = blocks.reduce((sum, text) => sum + wordCount(text), 0) || 1;
    let cursor = 0;
    source = blocks.map((text, index) => {
      const isLast = index === blocks.length - 1;
      const endMs = isLast ? safeDuration : Math.round(cursor + (wordCount(text) / totalWords) * safeDuration);
      const segment = { index, startMs: cursor, endMs: Math.max(cursor + 1, endMs), text };
      cursor = segment.endMs;
      return segment;
    });
  }
  const beats = applyShotSafetyCap(mergeToVisualBeats(source), maxShots);
  // Only Whisper needs its beats re-worded: its transcript is its own text, so the
  // script has to be redistributed over it. Estimated and measured sources already
  // carry the script's own words.
  return subtitles.length > 0 ? attachLockedNarration(beats, narrationBlocks) : beats;
}

/** Preserve exactly one timed beat per imported JSON shot. */
export function buildImportedPlanTimeline(
  voiceOvers: string[],
  durationMs: number,
  blockDurationsMs?: number[],
  subtitles: AutopilotSrtSegment[] = [],
): TimedNarrationBeat[] {
  const blocks = voiceOvers.map(cleanNarrationText).filter(Boolean);
  if (blocks.length === 0) return [];
  const safeDuration = Math.max(1_000, Math.round(durationMs));
  // Best available truth first: parts we measured ourselves (exact), then the
  // caption timings (anchored per line), and only then a words-per-second guess.
  // An imported voice file has no parts to measure, so captions are all it gets.
  const timed = segmentsFromMeasuredBlocks(blocks, blockDurationsMs, safeDuration)
    || segmentsFromSubtitleAlignment(blocks, subtitles, safeDuration);
  if (timed) {
    return timed.map((segment, index) => ({
      index: index + 1,
      startMs: segment.startMs,
      endMs: segment.endMs,
      text: segment.text,
    }));
  }
  const weights = blocks.map(wordCount);
  const total = weights.reduce((sum, count) => sum + count, 0) || blocks.length;
  let words = 0;
  let cursor = 0;
  return blocks.map((text, index) => {
    words += weights[index];
    const remaining = blocks.length - index - 1;
    const endMs = index === blocks.length - 1
      ? safeDuration
      : Math.max(cursor + 1, Math.min(safeDuration - remaining, Math.round((words / total) * safeDuration)));
    const beat = { index: index + 1, startMs: cursor, endMs, text };
    cursor = endMs;
    return beat;
  });
}
