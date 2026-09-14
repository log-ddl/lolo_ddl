import { mediaBlob } from './archive';
export interface ImageEditSettings {
  crop: boolean; x: number; y: number; width: number; height: number; ratio: string;
  chroma: boolean; color: string; threshold: number; softness: number;
}
export const DEFAULT_IMAGE_EDIT: ImageEditSettings = { crop: false, x: 0, y: 0, width: 100, height: 100, ratio: 'free', chroma: false, color: '#00ff00', threshold: 80, softness: 40 };
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
export async function processImage(source: string, settings?: Partial<ImageEditSettings>): Promise<Blob> {
  const s = { ...DEFAULT_IMAGE_EDIT, ...settings };
  if (![s.x, s.y, s.width, s.height, s.threshold, s.softness].every(Number.isFinite) || !/^#[0-9a-f]{6}$/i.test(s.color)) throw new Error('Invalid image edit settings');
  const bitmap = await createImageBitmap(await mediaBlob(source));
  try {
    const rect = cropRect(bitmap.width, bitmap.height, s);
    if (rect.width * rect.height > 40_000_000) throw new Error('Image is too large (maximum 40 megapixels)');
    const canvas = document.createElement('canvas');
    canvas.width = rect.width; canvas.height = rect.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: s.chroma });
    if (!ctx) throw new Error('Cannot create image canvas');
    ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    if (s.chroma) { const pixels = ctx.getImageData(0, 0, rect.width, rect.height); chromaKey(pixels.data, s); ctx.putImageData(pixels, 0, 0); }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Cannot encode PNG')), 'image/png'));
  } finally { bitmap.close(); }
}
