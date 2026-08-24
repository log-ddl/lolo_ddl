/**
 * useResolvedImageUrl — Resolve image URLs for display in <img> tags.
 *
 * Handles URL formats:
 * - `https://...` / `http://...` → pass through
 * - `data:image/...` → pass through (legacy base64)
 * - `local-image://...` → pass through (Electron custom protocol handles directly)
 * - `idb-image://...` → resolved async from IndexedDB to a temporary blob URL
 * - `null/undefined/''` → null
 */

import { useState, useEffect } from 'react';
import { readBlobFromBrowserStorage, isIdbImagePath } from '@/features/video-studio/lib/browser-image-storage';

/**
 * React hook to resolve an image URL for rendering.
 * Synchronous for all formats except `idb-image://` which resolves async from IndexedDB.
 */
export function useResolvedImageUrl(rawUrl: string | null | undefined): string | null {
  // Only `idb-image://` needs async work, and its blob URL is stored together
  // with the raw URL it belongs to so a stale blob is never handed back.
  const [blob, setBlob] = useState<{ rawUrl: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!rawUrl || !isIdbImagePath(rawUrl)) return;

    // idb-image://: resolve from IndexedDB → temporary blob URL
    let blobUrl: string | null = null;
    let cancelled = false;

    readBlobFromBrowserStorage(rawUrl).then((storedBlob) => {
      if (cancelled) return;
      if (!storedBlob) { setBlob({ rawUrl, url: null }); return; }
      blobUrl = URL.createObjectURL(storedBlob);
      setBlob({ rawUrl, url: blobUrl });
    });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [rawUrl]);

  if (!rawUrl) return null;
  // Resolved during render, not in an effect: returning null for one commit
  // makes consumers render an <img src="">, which fails to load and can leave
  // the image stuck in an error state.
  if (!isIdbImagePath(rawUrl)) return rawUrl;
  return blob?.rawUrl === rawUrl ? blob.url : null;
}
