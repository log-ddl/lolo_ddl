/**
 * Gemini watermark remover — Python implementation.
 *
 * The actual removal runs in the main process through a Python script
 * (wm_remove.py): it fits a polynomial background model around the watermark
 * location, builds a mask from the residual and inpaints with OpenCV. This
 * works even on resized/re-encoded images where reverse alpha blending fails.
 *
 * This renderer module only resolves the image to a `local-image://` path and
 * asks the main process to clean it.
 */

export type WatermarkProfile = "v1" | "v2";

export interface RemoveWatermarkOptions {
  profile?: WatermarkProfile;
}

export interface WatermarkPositionConfig {
  marginRight: number;
  marginBottom: number;
  logoSize: number;
}

/**
 * Deterministic bottom-right placement for a given image size and profile,
 * mirroring `get_watermark_config` from the C++ engine, with the V2 small
 * margin corrected from hand-measured output (71px, not 96px). Hand-measured
 * and stable, so the Python script gets an exact --box instead of searching.
 */
export function getWatermarkPositionConfig(
  width: number,
  height: number,
  profile: WatermarkProfile,
): WatermarkPositionConfig {
  const isLarge = width > 1024 && height > 1024;
  if (profile === "v1") {
    return isLarge
      ? { marginRight: 64, marginBottom: 64, logoSize: 96 }
      : { marginRight: 32, marginBottom: 32, logoSize: 48 };
  }
  if (isLarge) return { marginRight: 192, marginBottom: 192, logoSize: 96 };

  // V2 "small" outputs scale from a canonical large source (2752/2816/2848
  // wide). Hand measurement on 1376x768 output: the watermark is 48-50px,
  // anchored at (1255, 647) = margin 71, so keep the margin constant at 71
  // and scale only the logo size.
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  let sourceLongDim: number;
  if (longSide > 1100) {
    const doubled = 2 * longSide;
    sourceLongDim = 2752;
    for (const candidate of [2816, 2848]) {
      if (Math.abs(doubled - candidate) < Math.abs(doubled - sourceLongDim)) sourceLongDim = candidate;
    }
  } else if (shortSide >= 566) {
    sourceLongDim = 2752;
  } else if (shortSide >= 550) {
    sourceLongDim = 2816;
  } else {
    sourceLongDim = 2848;
  }
  const scale = longSide / sourceLongDim;
  const ideal = Math.round(96 * scale);
  return { marginRight: 71, marginBottom: 71, logoSize: ideal <= 40 ? 36 : 50 };
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

/**
 * Read an image's pixel dimensions through imageStorage so the deterministic
 * watermark position can be computed. Returns null when the image cannot be
 * read — the Python script then falls back to auto-detection.
 */
async function getImageSize(
  localPath: string,
): Promise<{ width: number; height: number } | null> {
  const result = await window.imageStorage?.readAsBase64(localPath);
  if (!result?.success || !result.base64) return null;
  const dataUrl = result.base64.startsWith("data:")
    ? result.base64
    : `data:${result.mimeType || "image/png"};base64,${result.base64}`;
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
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

    // Fixed, hand-measured placement — pass the exact box so the Python
    // script does not have to search for the watermark.
    const profile = options.profile ?? "v2";
    let box: string | null = null;
    const size = await getImageSize(localPath);
    if (size) {
      const config = getWatermarkPositionConfig(size.width, size.height, profile);
      const x = size.width - config.marginRight - config.logoSize;
      const y = size.height - config.marginBottom - config.logoSize;
      if (x >= 0 && y >= 0) box = `${x},${y},${config.logoSize},${config.logoSize}`;
    }

    if (!window.watermarkRemoval) {
      return { localPath: null, error: "Xoá watermark chỉ chạy trong ứng dụng LONGDD trên máy tính" };
    }
    const result = await window.watermarkRemoval.remove(localPath, box ?? undefined);
    if (result?.success && result.localPath) return { localPath: result.localPath };
    if (result?.output) console.warn("[WatermarkRemover] Python output:", result.output);
    if (result?.error) console.warn("[WatermarkRemover] Error:", result.error);
    return { localPath: null, error: result?.error || "Xoá watermark thất bại" };
  } catch (error) {
    console.warn("[WatermarkRemover] Skipping removal:", error);
    return { localPath: null, error: error instanceof Error ? error.message : String(error) };
  }
}
