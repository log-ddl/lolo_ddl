import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { assertRecord, assertString } from './protocol'
import type { FlowImageInput, FlowVideoInput } from './runtime-types'

/**
 * Filesystem and payload helpers for the Google Flow runtime: writing generated
 * videos into the media root, deriving a poster frame, reading a reference image
 * into base64, and validating request payloads before they leave the app.
 */

function hashIdentity(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

export function saveVideoBytes(mediaRoot: string, bytes: Buffer, id: string): string {
  const outputDir = path.join(mediaRoot, 'videos');
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `google-flow-${id}-${Date.now()}.mp4`;
  fs.writeFileSync(path.join(outputDir, filename), bytes);
  return `local-image://videos/${encodeURIComponent(filename)}`;
}

export async function downloadVideo(mediaRoot: string, url: string, id: string, signal: AbortSignal): Promise<string> {
  return saveVideoBytes(mediaRoot, await downloadVideoBytes(url, signal), id);
}

export async function downloadVideoBytes(url: string, signal: AbortSignal): Promise<Buffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Google Flow video download failed (${response.status})`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 500_000_000) throw new Error('Google Flow video exceeds 500 MB');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 12 || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Google Flow result is not a valid MP4');
  return bytes;
}

export async function createVideoThumbnail(mediaRoot: string, localUrl: string, taskId: string): Promise<string | undefined> {
  const match = /^local-image:\/\/videos\/(.+)$/i.exec(localUrl);
  if (!match) return undefined;
  let filename: string;
  try { filename = decodeURIComponent(match[1]); } catch { return undefined; }
  const inputPath = path.resolve(mediaRoot, 'videos', filename);
  const videoRoot = path.resolve(mediaRoot, 'videos');
  if (!inputPath.startsWith(`${videoRoot}${path.sep}`) || !fs.existsSync(inputPath)) return undefined;
  const thumbnailDir = path.join(mediaRoot, 'thumbnails');
  fs.mkdirSync(thumbnailDir, { recursive: true });
  const outputPath = path.join(thumbnailDir, `google-flow-${hashIdentity(taskId)}-${Date.now()}.jpg`);
  try {
    // Load FFmpeg only after a video has completed so app startup stays fast.
    const { runFFmpeg } = await import('../../../ffmpeg-runtime');
    const result = await runFFmpeg({
      jobId: `google-flow-thumbnail-${taskId}-${randomUUID()}`,
      args: ['-y', '-ss', '0.1', '-i', inputPath, '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '5', outputPath],
    });
    if (!result.success || !fs.existsSync(outputPath)) return undefined;
    const bytes = fs.readFileSync(outputPath);
    if (!bytes.length || bytes.length > 250_000) return undefined;
    return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  } catch {
    return undefined;
  } finally {
    try { fs.unlinkSync(outputPath); } catch { /* thumbnail is best-effort */ }
  }
}

export async function readImageSource(mediaRootPath: string, source: string, signal: AbortSignal): Promise<{ base64: string; mimeType: string; fileName: string }> {
  if (source.startsWith('data:image/')) {
    const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(source);
    if (!match || match[2].length > 40_000_000) throw new Error('Invalid or oversized image data URL');
    return { mimeType: match[1], base64: match[2], fileName: `image-${Date.now()}.${match[1].split('/')[1] || 'jpg'}` };
  }
  if (source.startsWith('local-image://')) {
    const match = /^local-image:\/\/([^/]+)\/(.+)$/i.exec(source);
    if (!match) throw new Error('Invalid local image URL');
    const mediaRoot = path.resolve(mediaRootPath);
    const category = decodeURIComponent(match[1]);
    const fileName = path.basename(decodeURIComponent(match[2]));
    const filePath = path.resolve(mediaRoot, category, fileName);
    if (filePath !== mediaRoot && !filePath.startsWith(`${mediaRoot}${path.sep}`)) throw new Error('Local image path is outside media storage');
    const bytes = fs.readFileSync(filePath);
    if (!bytes.length || bytes.length > 20_000_000) throw new Error('Reference image exceeds 20 MB');
    const extension = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = extension === 'png' ? 'image/png'
      : extension === 'webp' ? 'image/webp'
        : extension === 'gif' ? 'image/gif'
          : 'image/jpeg';
    return { mimeType, base64: bytes.toString('base64'), fileName };
  }
  if (!/^https:\/\//i.test(source)) throw new Error('Local image must be converted to a data URL before Google Flow upload');
  const response = await fetch(source, { signal });
  if (!response.ok) throw new Error(`Unable to download reference image (${response.status})`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 20_000_000) throw new Error('Reference image exceeds 20 MB');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 20_000_000) throw new Error('Reference image exceeds 20 MB');
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  if (!mimeType.startsWith('image/')) throw new Error('Reference URL is not an image');
  return { mimeType, base64: bytes.toString('base64'), fileName: `image-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}` };
}

export function validateImageInput(input: FlowImageInput): void {
  assertRecord(input, 'image payload'); assertString(input.projectId, 'projectId', 256); assertString(input.prompt, 'prompt', 100_000);
  assertString(input.model, 'model', 256); assertString(input.aspectRatio, 'aspectRatio', 16);
  if ((input.references?.length || 0) > 10) throw new Error('Google Flow supports at most 10 image references');
}

export function validateVideoInput(input: FlowVideoInput): void {
  assertRecord(input, 'video payload'); assertString(input.projectId, 'projectId', 256); assertString(input.sceneId, 'sceneId', 256);
  assertString(input.prompt, 'prompt', 100_000); assertString(input.model, 'model', 256); assertString(input.aspectRatio, 'aspectRatio', 16);
  if ((input.references?.length || 0) > 3) throw new Error('Google Flow supports at most 3 video references');
}

