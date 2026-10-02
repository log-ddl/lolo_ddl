import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { runFFmpeg, cancelFFmpeg } from '../../ffmpeg-runtime';
import { isMotionKind, motionAt, motionMode, motionBounds, motionMatrix, MOTION_ENTRANCES, type MotionEntrance, MOTION_MODES, type MotionMode, type MotionKind } from '../../../src/features/video-studio/canvas/motion-math';

export interface MotionRequest { jobId: string; kind: MotionKind; mode?: MotionMode; entrance?: MotionEntrance; intensity?: number; speed?: number; duration: number; images: ArrayBuffer[] }
const jobs = new Map<string, AbortController>();
let queue: Promise<unknown> = Promise.resolve();
export function cancelMotion(jobId: string) { jobs.get(jobId)?.abort(); cancelFFmpeg(`motion-${jobId}`); }
export function renderMotion(input: MotionRequest, mediaRoot: string, onStart?: () => void): Promise<{ url: string; duration: number }> {
  if (!input || !/^[\w-]{1,100}$/.test(input.jobId) || !isMotionKind(input.kind) || !Number.isFinite(input.duration) || input.duration < 0.1 || input.duration > 60) return Promise.reject(new Error('Invalid motion request (0.1–60 seconds)'));
  const mode = motionMode(input.kind, input.mode);
  if (!MOTION_ENTRANCES.includes(input.entrance ?? 'none') || !MOTION_MODES.includes(mode) || !Number.isFinite(input.intensity ?? 1) || (input.intensity ?? 1) < 0 || (input.intensity ?? 1) > 3 || !Number.isFinite(input.speed ?? 1) || (input.speed ?? 1) < 0.25 || (input.speed ?? 1) > 3) return Promise.reject(new Error('Invalid motion controls'));
  if (!Array.isArray(input.images) || input.images.length < (mode === 'frames' ? 2 : 1) || input.images.length > 60 || (mode !== 'frames' && input.images.length !== 1) || input.images.some((image) => !(image instanceof ArrayBuffer)) || input.images.reduce((n, image) => n + image.byteLength, 0) > 128 * 1024 * 1024) return Promise.reject(new Error('Invalid motion images'));
  if (jobs.has(input.jobId)) return Promise.reject(new Error('Motion job already exists'));
  const controller = new AbortController(); jobs.set(input.jobId, controller);
  const pending = queue.catch(() => {}).then(() => { controller.signal.throwIfAborted(); onStart?.(); return render(input, mediaRoot, controller.signal); });
  queue = pending.catch(() => {});
  return pending.finally(() => jobs.delete(input.jobId));
}
async function render(input: MotionRequest, mediaRoot: string, signal: AbortSignal) {
  signal.throwIfAborted();
  let output: string | undefined;
  try {
    const images: Buffer[] = [];
    let width = 0, height = 0;
    for (const source of input.images) {
      signal.throwIfAborted();
      const image = sharp(Buffer.from(source), { limitInputPixels: 40_000_000 }).rotate();
      if (!width) {
        const normalized = await image.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).ensureAlpha().png().toBuffer({ resolveWithObject: true });
        width = normalized.info.width; height = normalized.info.height; images.push(normalized.data);
      } else images.push(await image.resize(width, height, { fit: 'contain', background: '#00000000' }).ensureAlpha().png().toBuffer());
    }
    const frames = Math.max(1, Math.round(input.duration * 30));
    const mode = motionMode(input.kind, input.mode);
    const intensity = input.intensity ?? 1, speed = input.speed ?? 1;
    const { width: canvasWidth, height: canvasHeight, originX, originY } = motionBounds(width, height, mode, frames, intensity, speed, input.entrance);
    const encoded = images.map(image => image.toString('base64'));
    // Produce only as fast as FFmpeg consumes; no frame files or whole-video buffer.
    async function* framePngs() {
      for (let frame = 0; frame < frames; frame++) {
        signal.throwIfAborted();
        const motion = motionAt(mode, frame, images.length, intensity, speed, input.entrance);
        const svg = motionFrameSvg(width, height, canvasWidth, canvasHeight, originX, originY, motion, encoded[motion.imageIndex]);
        // PNG compression affects transport size only, never pixels.
        const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 0 }).toBuffer();
        signal.throwIfAborted();
        yield png;
      }
    }
    signal.throwIfAborted();
    await fs.mkdir(path.join(mediaRoot, 'videos'), { recursive: true });
    const filename = `motion-${randomUUID()}.webm`; output = path.join(mediaRoot, 'videos', filename);
    const result = await runFFmpeg({ jobId: `motion-${input.jobId}`, totalDurationSec: frames / 30, input: framePngs(), args: ['-y', '-f', 'image2pipe', '-framerate', '30', '-vcodec', 'png', '-i', 'pipe:0', '-frames:v', String(frames), '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-lossless', '1', '-auto-alt-ref', '0', '-threads', '2', output] });
    signal.throwIfAborted();
    if (!result.success) throw new Error(result.error || result.stderr.slice(-1200) || 'Motion render failed');
    return { url: `local-image://videos/${filename}`, duration: frames / 30 };
  } catch (error) { if (output) await fs.rm(output, { force: true }); throw error; }
}

/** Shared by every mode: no integer translation/resize or per-frame recentering. */
export function motionFrameSvg(width: number, height: number, canvasWidth: number, canvasHeight: number, originX: number, originY: number, motion: ReturnType<typeof motionAt>, imageBase64: string) {
  const m = motionMatrix(width, height, motion);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasWidth}" height="${canvasHeight}"><image width="${width}" height="${height}" opacity="${motion.opacity}" transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e + originX} ${m.f + originY})" xlink:href="data:image/png;base64,${imageBase64}"/></svg>`;
}
