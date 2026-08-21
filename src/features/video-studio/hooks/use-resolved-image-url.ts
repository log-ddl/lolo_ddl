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
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (!rawUrl || isIdbImagePath(rawUrl)) return null;
    return rawUrl;
  });

  useEffect(() => {
    if (!rawUrl) {
      setResolvedUrl(null);
      return;
    }

    // Non-idb formats resolve synchronously
    if (!isIdbImagePath(rawUrl)) {
      setResolvedUrl(rawUrl);
      return;
    }

    // idb-image://: resolve from IndexedDB → temporary blob URL
    let blobUrl: string | null = null;
    let cancelled = false;

    readBlobFromBrowserStorage(rawUrl).then((blob) => {
      if (cancelled) return;
      if (!blob) { setResolvedUrl(null); return; }
      blobUrl = URL.createObjectURL(blob);
      setResolvedUrl(blobUrl);
    });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [rawUrl]);

  return resolvedUrl;
}
