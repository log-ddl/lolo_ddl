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

export function buildNarrationTimeline(
  narrationBlocks: string[],
  durationMs: number,
  subtitles: AutopilotSrtSegment[],
  maxShots?: number,
): TimedNarrationBeat[] {
  const safeDuration = Math.max(1_000, Math.round(durationMs));
  let source: AutopilotSrtSegment[];
  if (subtitles.length > 0) {
    source = subtitles.map((seg, index) => ({ ...seg, index }));
    source[0].startMs = 0;
    source[source.length - 1].endMs = Math.max(source[source.length - 1].endMs, safeDuration);
  } else {
    const blocks = narrationBlocks.filter((text) => text.trim());
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
  return subtitles.length > 0 ? attachLockedNarration(beats, narrationBlocks) : beats;
}

/** Preserve exactly one timed beat per imported JSON shot. */
export function buildImportedPlanTimeline(voiceOvers: string[], durationMs: number): TimedNarrationBeat[] {
  const blocks = voiceOvers.map(cleanNarrationText).filter(Boolean);
  if (blocks.length === 0) return [];
  const safeDuration = Math.max(1_000, Math.round(durationMs));
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
