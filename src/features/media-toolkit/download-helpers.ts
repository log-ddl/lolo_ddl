import type { MediaDownloadKind } from "./types";

/** Small shared bits for the download panel and the batch queue. */

export function durationLabel(seconds?: number) {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  return [hours, minutes, rest].filter((_, index) => index > 0 || hours > 0).map((value) => String(value).padStart(2, "0")).join(":");
}

export function nextJob(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface QueueDownloadConfig {
  kinds: MediaDownloadKind[];
  quality: "best" | "1080" | "720" | "480";
  audioFormat: "mp3" | "m4a" | "wav";
  subtitleLanguage: string;
  /** Start time for a `--download-sections` cut, e.g. `0:30`. Empty = from the beginning. */
  startTime?: string;
  /** End time for a `--download-sections` cut, e.g. `2:45`. Empty = until the end. */
  endTime?: string;
}

export function configDownloadTasks(config: QueueDownloadConfig) {
  return config.kinds.map((kind) => ({ kind }));
}

/** True when `value` is a time like `45`, `1:30` or `01:02:03` (optional fraction). */
export function isValidTime(value: string): boolean {
  return /^\d+(?::[0-5]?\d){1,2}(?:\.\d+)?$/.test(value.trim());
}

/**
 * Split a batch line like `https://… 1:23-2:45` into its URL and the optional
 * trailing time-range token (whitespace-separated).
 */
export function splitTimeRange(line: string): { url: string; range: string } {
  const trimmed = line.trim();
  const space = trimmed.search(/\s/);
  if (space === -1) return { url: trimmed, range: "" };
  return { url: trimmed.slice(0, space).trim(), range: trimmed.slice(space + 1).trim() };
}

/**
 * Parse a time-range token into `startTime`/`endTime`. Accepts `1:23-2:45`,
 * `1:23` (start only), or the colon forms `1:23:2:45` / `1:23:45:2:30:45`.
 * Returns null when the token is empty or not a valid range.
 */
export function parseTimeRange(token: string): { startTime: string; endTime: string } | null {
  const value = token.trim();
  if (!value) return null;
  const dash = value.split("-");
  if (dash.length === 2 && isValidTime(dash[0]) && (dash[1] === "" || isValidTime(dash[1]))) {
    return { startTime: dash[0], endTime: dash[1] || "" };
  }
  const parts = value.split(":");
  if (parts.length === 4) {
    const start = parts.slice(0, 2).join(":");
    const end = parts.slice(2).join(":");
    if (isValidTime(start) && isValidTime(end)) return { startTime: start, endTime: end };
  }
  if (parts.length === 6) {
    const start = parts.slice(0, 3).join(":");
    const end = parts.slice(3).join(":");
    if (isValidTime(start) && isValidTime(end)) return { startTime: start, endTime: end };
  }
  if (isValidTime(value)) return { startTime: value, endTime: "" };
  return null;
}

