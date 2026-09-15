import { mediaBlob } from './archive';
export interface ImageEditSettings {
  crop: boolean; x: number; y: number; width: number; height: number; ratio: string;
  chroma: boolean; color: string; threshold: number; softness: number;
  autoBackground?: boolean;
  aiBackground?: boolean;
}
export const DEFAULT_IMAGE_EDIT: ImageEditSettings = { crop: false, x: 0, y: 0, width: 100, height: 100, ratio: 'free', chroma: false, autoBackground: false, aiBackground: true, color: '#00ff00', threshold: 80, softness: 40 };
export function imageEditSettings(settings?: Partial<ImageEditSettings>): ImageEditSettings {
  // Existing saved settings predate automatic background removal.
  return { ...DEFAULT_IMAGE_EDIT, ...(settings ? { aiBackground: false, autoBackground: false, ...settings } : {}) };
}
export function cropRect(w: number, h: number, s: ImageEditSettings) {
  if (!s.crop) return { x: 0, y: 0, width: w, height: h };
  const x = Math.min(w - 1, Math.max(0, Math.floor(w * s.x / 100)));
  const y = Math.min(h - 1, Math.max(0, Math.floor(h * s.y / 100)));
  let width = Math.min(w - x, Math.max(1, Math.floor(w * s.width / 100)));
  let height = Math.min(h - y, Math.max(1, Math.floor(h * s.height / 100)));
  const ratios: Record<string, number> = { '1:1': 1, '16:9': 16 / 9, '9:16': 9 / 16, '4:3': 4 / 3, '3:4': 3 / 4 };
  const ratio = ratios[s.ratio];
  if (ratio) { if (width / height > ratio) width = Math.max(1, Math.round(height * ratio)); else height = Math.max(1, Math.round(width / ratio)); }
  return { x, y, width, height };
}
export function chromaKey(data: Uint8ClampedArray, s: ImageEditSettings) {
  const rgb = [1, 3, 5].map((offset) => parseInt(s.color.slice(offset, offset + 2), 16));
  const threshold = Math.max(0, s.threshold), softness = Math.max(0, s.softness);
  for (let i = 0; i < data.length; i += 4) {
    const distance = Math.hypot(data[i] - rgb[0], data[i + 1] - rgb[1], data[i + 2] - rgb[2]);
    const alpha = distance <= threshold ? 0 : softness ? Math.min(1, (distance - threshold) / softness) : 1;
    data[i + 3] = Math.round(data[i + 3] * alpha);
  }
}
/** Conservative border consensus, then four-connected flood fill. Enclosed matching
 * colors are preserved (for example, white eyes inside a black outline). */
export function removeSolidBackground(data: Uint8ClampedArray, width: number, height: number, s: ImageEditSettings): boolean {
  const border: number[] = [];
  for (let x = 0; x < width; x++) { border.push(x); if (height > 1) border.push((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { border.push(y * width); if (width > 1) border.push(y * width + width - 1); }
  const samples = border.filter((_, i) => i % Math.max(1, Math.ceil(border.length / 512)) === 0).filter((p) => data[p * 4 + 3] >= 240);
  if (samples.length < 4) return false;
  const distance = (p: number, rgb: number[]) => Math.hypot(data[p * 4] - rgb[0], data[p * 4 + 1] - rgb[1], data[p * 4 + 2] - rgb[2]);
  // Detection tolerance is independent of removal tolerance: increasing the
  // latter must not turn a multicolored border into a confident background.
  let cluster: number[] = [];
  for (let i = 0; i < samples.length; i += Math.max(1, Math.floor(samples.length / 64))) {
    const offset = samples[i] * 4;
    const rgb = [data[offset], data[offset + 1], data[offset + 2]];
    const matches = samples.filter((p) => distance(p, rgb) <= 24);
    if (matches.length > cluster.length) cluster = matches;
  }
  if (cluster.length / samples.length < 0.8) return false;
  const rgb = [0, 1, 2].map((c) => cluster.reduce((sum, p) => sum + data[p * 4 + c], 0) / cluster.length);
  const threshold = Math.max(0, s.threshold), softness = Math.max(0, s.softness);
  // Separate trusted background growth from edge matting (also used by
  // BorderCut's classification/feather stages). Soft pixels must never become
  // flood seeds: a pale outline otherwise opens the entire subject interior.
  const deviations = cluster.map((p) => distance(p, rgb)).sort((a, b) => a - b);
  const noise = deviations[Math.floor((deviations.length - 1) * 0.95)];
  const growthThreshold = Math.min(threshold, Math.min(32, Math.max(8, noise + 4)));
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0, tail = 0;
  const visit = (p: number) => {
    if (visited[p]) return;
    if (data[p * 4 + 3] === 0 || distance(p, rgb) <= growthThreshold) {
      visited[p] = 1;
      queue[tail++] = p;
    } else visited[p] = 2; // One-pixel edge band, never traversed.
  };
  border.forEach(visit);
  while (head < tail) {
    const p = queue[head++];
    if (p % width > 0) visit(p - 1);
    if (p % width < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < width * (height - 1)) visit(p + width);
  }
  // Apply alpha only after the mask is complete so source pixels remain stable
  // during classification. Interior pixels retain their exact original alpha.
  for (let p = 0; p < visited.length; p++) {
    if (visited[p] === 1) data[p * 4 + 3] = 0;
    else if (visited[p] === 2) {
      const d = distance(p, rgb);
      const alpha = d <= threshold ? 0 : softness ? Math.min(1, (d - threshold) / softness) : 1;
      data[p * 4 + 3] = Math.round(data[p * 4 + 3] * alpha);
    }
  }
  return true;
}
export async function processImage(source: string, settings?: Partial<ImageEditSettings>, onWarning?: () => void, signal?: AbortSignal, onProgress?: (percent?: number) => void): Promise<Blob> {
  const s = imageEditSettings(settings);
  if (![s.x, s.y, s.width, s.height, s.threshold, s.softness].every(Number.isFinite) || !/^#[0-9a-f]{6}$/i.test(s.color)) throw new Error('Invalid image edit settings');
  const bitmap = await createImageBitmap(await mediaBlob(source));
  try {
    const rect = cropRect(bitmap.width, bitmap.height, s);
    if (rect.width * rect.height > 40_000_000) throw new Error('Image is too large (maximum 40 megapixels)');
    const canvas = document.createElement('canvas');
    canvas.width = rect.width; canvas.height = rect.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: s.chroma || s.autoBackground });
    if (!ctx) throw new Error('Cannot create image canvas');
    ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    if (!s.aiBackground && (s.autoBackground || s.chroma)) {
      const pixels = ctx.getImageData(0, 0, rect.width, rect.height);
      if (s.autoBackground) {
        if (!removeSolidBackground(pixels.data, rect.width, rect.height, s)) onWarning?.();
      } else chromaKey(pixels.data, s);
      ctx.putImageData(pixels, 0, 0);
    }
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Cannot encode PNG')), 'image/png'));
    if (!s.aiBackground) return blob;
    const { removeAiBackground } = await import('./ai-background');
    return await removeAiBackground(blob, JSON.stringify([source, rect]), signal, onProgress);
  } finally { bitmap.close(); }
}
