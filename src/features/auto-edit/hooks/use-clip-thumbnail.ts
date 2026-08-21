import { useEffect, useSyncExternalStore } from "react";
import {
  ensureVideoThumbnail,
  getCachedThumbnail,
  subscribeThumbnails,
} from "../lib/thumbnails";

export interface ClipThumbnail {
  url: string;
  /**
   * `tile` repeats one still across the clip (images — every frame is identical).
   * `strip` stretches a multi-frame filmstrip over the clip, so each frame sits
   * roughly where it occurs in time.
   */
  mode: "tile" | "strip";
}

/**
 * The imagery a clip paints across its body. Images use their own preview
 * directly; videos get a decoded filmstrip, which arrives asynchronously — hence
 * the external store subscription so the clip repaints once frames are cached.
 */
export function useClipThumbnail(
  kind: "video" | "image" | null,
  mediaPath: string | null,
  previewUrl: string | null,
): ClipThumbnail | null {
  const cached = useSyncExternalStore(
    subscribeThumbnails,
    () => (mediaPath ? getCachedThumbnail(mediaPath) : null),
    () => null,
  );

  useEffect(() => {
    if (kind !== "video" || !mediaPath || !previewUrl) return;
    void ensureVideoThumbnail(mediaPath, previewUrl);
  }, [kind, mediaPath, previewUrl]);

  if (kind === "image") return previewUrl ? { url: previewUrl, mode: "tile" } : null;
  return cached ? { url: cached, mode: "strip" } : null;
}
