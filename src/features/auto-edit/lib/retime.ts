import type { RetimeConfig } from "../types";

/**
 * Retime (speed) helpers.
 *
 * Invariant (from opencut `retime/resolve.ts`):
 *   duration ≈ (sourceDuration - trimStart - trimEnd) / rate
 *
 * `rate` is a playback multiplier: 1 = normal, 2 = double speed, 0.5 = half speed.
 * Trims are always expressed in *source* time; retime only affects how long the
 * trimmed source takes to play on the timeline.
 */

export const DEFAULT_RETIME: RetimeConfig = { rate: 1, maintainPitch: true };

export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  // Match the ffmpeg `atempo` range (0.5–2.0 per pass); cap to a sane window.
  return Math.min(8, Math.max(0.1, rate));
}

export function hasRetime(config?: RetimeConfig): boolean {
  return !!config && Math.abs(config.rate - 1) > 1e-6;
}

/** Source length consumed by the trimmed region (source-time ms). */
export function trimmedSourceDuration(
  sourceDuration: number,
  trimStart: number,
  trimEnd: number,
): number {
  return Math.max(0, sourceDuration - trimStart - trimEnd);
}

/**
 * Timeline duration produced by a trimmed+retimed source.
 * `duration = trimmedSourceDuration / rate`.
 */
export function resolveDuration(
  sourceDuration: number,
  trimStart: number,
  trimEnd: number,
  retime?: RetimeConfig,
): number {
  const rate = retime?.rate ?? 1;
  return Math.round(trimmedSourceDuration(sourceDuration, trimStart, trimEnd) / rate);
}

/**
 * Inverse of `resolveDuration`: given a desired timeline duration, compute the
 * source duration required (used when the user drags a clip's edge).
 */
export function resolveSourceDuration(
  duration: number,
  trimStart: number,
  trimEnd: number,
  retime?: RetimeConfig,
): number {
  const rate = retime?.rate ?? 1;
  return Math.round(duration * rate + trimStart + trimEnd);
}
