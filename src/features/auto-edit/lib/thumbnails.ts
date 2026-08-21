/**
 * Clip thumbnails for the timeline filmstrip.
 *
 * Images already have a usable preview URL, so they are returned as-is. Videos
 * need a frame: rather than shelling out to ffmpeg, a hidden <video> is seeked
 * once and painted to a canvas. That keeps this entirely in the renderer, and a
 * single decoded frame per media path is cheap enough to cache forever.
 */

const THUMB_WIDTH = 160;
/** Where to sample the frame from — far enough in to skip black leader frames. */
const SAMPLE_AT_SEC = 1;

const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();
const listeners = new Set<() => void>();

export function getCachedThumbnail(mediaPath: string): string | null {
  return cache.get(mediaPath) ?? null;
}

/** Subscribe to cache fills so components can re-render when a frame arrives. */
export function subscribeThumbnails(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(mediaPath: string, dataUrl: string): void {
  cache.set(mediaPath, dataUrl);
  inFlight.delete(mediaPath);
  for (const listener of listeners) listener();
}

/** How many frames make up a clip's filmstrip. */
const STRIP_FRAMES = 12;

/**
 * Decode a horizontal filmstrip of `previewUrl` — `STRIP_FRAMES` frames sampled at
 * even intervals across the source — into a single data URL, at most once per
 * media path. Resolves to `null` when the video cannot be decoded (missing codec,
 * bad path).
 *
 * Frames are seeked one at a time rather than in parallel because a single
 * `<video>` element has one playback position; the seeks are chained through the
 * `seeked` event.
 */
export function ensureVideoThumbnail(
  mediaPath: string,
  previewUrl: string,
): Promise<string | null> {
  const cached = cache.get(mediaPath);
  if (cached) return Promise.resolve(cached);
  const existing = inFlight.get(mediaPath);
  if (existing) return existing;

  const task = new Promise<string | null>((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    let settled = false;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let frameWidth = THUMB_WIDTH;
    let frameHeight = Math.round((THUMB_WIDTH * 9) / 16);
    let index = 0;
    let times: number[] = [];

    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      video.removeAttribute("src");
      video.load();
      if (result) publish(mediaPath, result);
      else inFlight.delete(mediaPath);
      resolve(result);
    };

    /** Emit whatever has been painted so far — a partial strip beats none. */
    const flush = () => {
      if (!canvas || index === 0) return finish(null);
      try {
        finish(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        // Tainted canvas (cross-origin source) — no thumbnail is available.
        finish(null);
      }
    };

    const drawCurrent = () => {
      if (!ctx || settled) return;
      try {
        ctx.drawImage(video, index * frameWidth, 0, frameWidth, frameHeight);
      } catch {
        return finish(null);
      }
      index += 1;
      if (index >= times.length) return flush();
      video.currentTime = times[index];
    };

    video.addEventListener("loadeddata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const ratio = video.videoWidth > 0 ? video.videoHeight / video.videoWidth : 9 / 16;
      frameHeight = Math.max(1, Math.round(THUMB_WIDTH * ratio));
      frameWidth = THUMB_WIDTH;

      // A source too short to sample across gets a single frame.
      const count = duration > 0.5 ? STRIP_FRAMES : 1;
      times =
        count === 1
          ? [Math.min(SAMPLE_AT_SEC, duration / 2) || 0]
          : Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * duration);

      canvas = document.createElement("canvas");
      canvas.width = frameWidth * count;
      canvas.height = frameHeight;
      ctx = canvas.getContext("2d");
      if (!ctx) return finish(null);

      index = 0;
      video.currentTime = times[0];
    });
    video.addEventListener("seeked", drawCurrent);
    video.addEventListener("error", () => finish(null));
    // Never leave a clip waiting on a video that will not decode; keep partial work.
    setTimeout(flush, 15000);

    video.src = previewUrl;
  });

  inFlight.set(mediaPath, task);
  return task;
}

/** Escape a URL for safe interpolation into a CSS `url("…")` value. */
export function cssUrl(url: string): string {
  return `url("${url.replace(/["\\]/g, "\\$&")}")`;
}
