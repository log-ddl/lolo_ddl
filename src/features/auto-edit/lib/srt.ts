/**
 * SRT subtitle parsing — ported from opencut `subtitles/srt.ts`, adapted to the
 * app's integer-millisecond time model. Returns caption cues with `startTime`/`duration`
 * in ms so they map directly onto TextElement timeline placement.
 */

export interface SubtitleCue {
  text: string;
  /** Cue start on the timeline, in ms. */
  startTime: number;
  /** Cue length, in ms. */
  duration: number;
}

const TIMESTAMP_RE =
  /(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{1,3})/;

export function parseSrt(input: string): SubtitleCue[] {
  const normalized = input.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) continue;

    // The timestamp line is either the first line or right after the cue index.
    const tsIndex = TIMESTAMP_RE.test(lines[0]) ? 0 : 1;
    const tsLine = lines[tsIndex];
    if (!tsLine) continue;

    const match = tsLine.match(TIMESTAMP_RE);
    if (!match) continue;

    const text = lines.slice(tsIndex + 1).join("\n").trim();
    if (!text) continue;

    const start = parseTimestamp(match[1]);
    const end = parseTimestamp(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start <= 0) continue;

    cues.push({ text, startTime: start, duration: end - start });
  }

  return cues;
}

function parseTimestamp(input: string): number {
  const normalized = input.trim().replace(",", ".");
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/);
  if (!match) return Number.NaN;

  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    (Number.parseInt(hours, 10) * 3600 +
      Number.parseInt(minutes, 10) * 60 +
      Number.parseInt(seconds, 10)) *
      1000 +
    Number.parseInt(milliseconds.padEnd(3, "0"), 10)
  );
}
