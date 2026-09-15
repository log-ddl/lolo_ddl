/**
 * Gemini watermark remover — Python implementation.
 *
 * The actual removal runs in the main process through a Python script
 * (wm_remove.py): detects a calibrated logo across scales, verifies reverse
 * alpha restoration, and uses silhouette inpainting only on strong matches.
 *
 * This renderer module only resolves the image to a `local-image://` path and
 * asks the main process to clean it.
 */

export type WatermarkProfile = "v1" | "v2";

export interface RemoveWatermarkOptions {
  profile?: WatermarkProfile;
}

// Surface Python runtime bootstrap progress (download/install/pip) from the
// main process as a DOM event so the UI can react without coupling.
if (window.ipcRenderer) {
  window.ipcRenderer.on("watermark-runtime-progress", (_event, payload) => {
    window.dispatchEvent(
      new CustomEvent("watermark-runtime-progress", { detail: payload }),
    );
  });
}

function isLocalImageUrl(imageUrl: string): boolean {
  return imageUrl.startsWith("local-image://");
}

/**
 * Persist a raw (still watermarked) image through imageStorage so the main
 * process can reach it on disk, then run the Python remover.
 */
async function saveRawImage(imageUrl: string): Promise<string | null> {
  if (!window.imageStorage) return null;
  const saved = await window.imageStorage.saveImage(
    imageUrl,
    "shots",
    `raw_watermarked_${Date.now()}.png`,
  );
  return saved.success && saved.localPath ? saved.localPath : null;
}

export interface WatermarkRemovalOutcome {
  /** Cleaned `local-image://` path, or null when removal did not happen. */
  localPath: string | null;
  /** Why removal did not happen — for UI feedback instead of a silent no-op. */
  error?: string;
}

/**
 * Remove the Gemini watermark from a generated image and return the cleaned
 * image URL (a `local-image://` path) — or `null` when the image cannot be
 * processed, so callers keep the original.
 */
export async function removeWatermarkFromUrl(
  imageUrl: string,
  options: RemoveWatermarkOptions = {},
): Promise<string | null> {
  return (await removeWatermarkWithDiagnostics(imageUrl, options)).localPath;
}

/**
 * Same as `removeWatermarkFromUrl`, but reports why removal failed so callers
 * that are user-driven can show the actual reason (missing Python runtime,
 * unreadable image, script error).
 */
export async function removeWatermarkWithDiagnostics(
  imageUrl: string,
  options: RemoveWatermarkOptions = {},
): Promise<WatermarkRemovalOutcome> {
  try {
    let localPath: string | null = null;
    if (isLocalImageUrl(imageUrl)) {
      localPath = imageUrl;
    } else if (imageUrl.startsWith("data:")) {
      localPath = await saveRawImage(imageUrl);
    } else if (/^https?:\/\//i.test(imageUrl)) {
      // Remote http(s) URL. Direct fetch from the renderer is often blocked
      // by CORS (Google Flow image hosts send no Access-Control-Allow-Origin),
      // so download through the main process (no CORS) first.
      localPath = await saveRawImage(imageUrl);
    }
    if (!localPath) return { localPath: null, error: "Không đọc được ảnh nguồn để xoá watermark" };

    // Detection runs on native image pixels in Python across logo scales.
    // Do not pin a box derived from one aspect ratio.
    if (options.profile === "v1") {
      return { localPath: null, error: "Chưa có mẫu watermark V1 để xoá an toàn" };
    }

    if (!window.watermarkRemoval) {
      return { localPath: null, error: "Xoá watermark chỉ chạy trong ứng dụng LONGDD trên máy tính" };
    }
    const result = await window.watermarkRemoval.remove(localPath);
    if (result?.success && result.localPath) return { localPath: result.localPath };
    if (result?.output) console.warn("[WatermarkRemover] Python output:", result.output);
    if (result?.error) console.warn("[WatermarkRemover] Error:", result.error);
    return { localPath: null, error: result?.error || "Xoá watermark thất bại" };
  } catch (error) {
    console.warn("[WatermarkRemover] Skipping removal:", error);
    return { localPath: null, error: error instanceof Error ? error.message : String(error) };
  }
}
