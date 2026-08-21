/**
 * Time model — integer milliseconds.
 *
 * opencut uses `MediaTime` (integer ticks at 120000/s). We use integer milliseconds
 * instead so the editor maps 1:1 onto the existing ffmpeg render pipeline, which is
 * already millisecond-based (`render-pipeline.ts`).
 */

/** Timeline time in milliseconds (always a non-negative integer). */
export type TimeMs = number;

export const ZERO_MS: TimeMs = 0;

/** FrameRate as a rational, so 23.976 / 29.97 / 60 are exact. */
export interface FrameRate {
  numerator: number;
  denominator: number;
}

export const FPS_24: FrameRate = { numerator: 24, denominator: 1 };
export const FPS_30: FrameRate = { numerator: 30, denominator: 1 };
export const FPS_60: FrameRate = { numerator: 60, denominator: 1 };

export function frameRateToFloat(fps: FrameRate): number {
  return fps.numerator / fps.denominator;
}

/** Duration of one frame in milliseconds (float). */
export function frameDurationMs(fps: FrameRate): number {
  return (fps.denominator / fps.numerator) * 1000;
}

/** Round a millisecond value down to the nearest frame boundary. */
export function roundMsToFrame(ms: number, fps: FrameRate): number {
  const dur = frameDurationMs(fps);
  return Math.max(0, Math.round(ms / dur) * dur);
}

/** Snapped integer milliseconds to the frame grid (exact, avoids float drift). */
export function snapToFrame(ms: number, fps: FrameRate): number {
  const dur = frameDurationMs(fps);
  return Math.max(0, Math.round(ms / dur) * Math.round(dur));
}

export function secondsToMs(seconds: number): number {
  return Math.round(seconds * 1000);
}

export function msToSeconds(ms: number): number {
  return ms / 1000;
}

export function clampMs(value: number, min = 0, max = Number.POSITIVE_INFINITY): number {
  return Math.max(min, Math.min(max, value));
}

/** Format milliseconds as `mm:ss.cs` (centiseconds) for compact timecode. */
export function formatTimecodeCompact(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** Format milliseconds as `hh:mm:ss:ff` (frames) for editable timecode. */
export function formatTimecodeFrames(ms: number, fps: FrameRate): string {
  const total = Math.max(0, Math.round(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const dur = frameDurationMs(fps);
  const frames = Math.floor((total % 1000) / Math.max(1, dur));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}
