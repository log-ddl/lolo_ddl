import type { SrtSegment } from './types';

const TIME_RE = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/;

export interface SrtParseError {
  blockIndex: number;
  message: string;
}

export interface SrtParseResult {
  segments: SrtSegment[];
  errors: SrtParseError[];
}

export function parseSrt(raw: string): SrtParseResult {
  // Strip BOM and normalize line endings.
  const cleaned = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = cleaned.split(/\n\s*\n/);
  const segments: SrtSegment[] = [];
  const errors: SrtParseError[] = [];

  let nextIndex = 1;
  for (let bi = 0; bi < blocks.length; bi += 1) {
    const block = blocks[bi].trim();
    if (!block) continue;
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) continue;

    // First line might be index, or might be the time line if numbering is missing.
    let timeLineIdx = 0;
    if (TIME_RE.test(lines[0])) {
      timeLineIdx = 0;
    } else if (lines.length >= 2 && TIME_RE.test(lines[1])) {
      timeLineIdx = 1;
    } else {
      errors.push({ blockIndex: bi, message: 'No time line in block' });
      continue;
    }

    const m = lines[timeLineIdx].match(TIME_RE);
    if (!m) {
      errors.push({ blockIndex: bi, message: 'Failed to parse time line' });
      continue;
    }
    const startMs = toMs(m[1], m[2], m[3], m[4]);
    const endMs = toMs(m[5], m[6], m[7], m[8]);
    if (endMs < startMs) {
      errors.push({ blockIndex: bi, message: `End before start: ${lines[timeLineIdx]}` });
      continue;
    }
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join(' ').trim();
    if (!text) continue;

    segments.push({
      index: nextIndex,
      startMs,
      endMs,
      text,
    });
    nextIndex += 1;
  }

  return { segments, errors };
}

function toMs(h: string, m: string, s: string, frac: string): number {
  const hour = parseInt(h, 10) || 0;
  const min = parseInt(m, 10) || 0;
  const sec = parseInt(s, 10) || 0;
  // Pad/truncate fraction to milliseconds (3 digits).
  const fracMs = parseInt((frac + '000').slice(0, 3), 10) || 0;
  return ((hour * 3600 + min * 60 + sec) * 1000) + fracMs;
}

export function totalDurationMs(segments: SrtSegment[]): number {
  if (segments.length === 0) return 0;
  return segments[segments.length - 1].endMs;
}
