import { mediaBlob } from './archive';

export async function extractVideoFrame(source: string, time: number | 'last'): Promise<Blob> {
  const url = URL.createObjectURL(await mediaBlob(source));
  const video = document.createElement('video');
  video.muted = true; video.preload = 'auto';
  const wait = (name: string) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Video frame timed out')), 20000);
    const ready = () => finish(); const failed = () => finish(new Error('Cannot decode video'));
    const finish = (error?: Error) => { clearTimeout(timer); video.removeEventListener(name, ready); video.removeEventListener('error', failed); error ? reject(error) : resolve(); };
    video.addEventListener(name, ready, { once: true }); video.addEventListener('error', failed, { once: true });
  });
  try {
    const loaded = wait('loadeddata'); video.src = url; await loaded;
    if (!Number.isFinite(video.duration)) throw new Error('Invalid video duration');
    const seconds = Math.max(0, Math.min(time === 'last' ? video.duration - 0.05 : time, video.duration - 0.05));
    if (seconds > 0) { const seeked = wait('seeked'); video.currentTime = seconds; await seeked; }
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Cannot extract frame')), 'image/png'));
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
}
