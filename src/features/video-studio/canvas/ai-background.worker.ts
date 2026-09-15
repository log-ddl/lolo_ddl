import { removeBackground } from '@imgly/background-removal';

self.onmessage = async (event: MessageEvent<{ blob: Blob; device: 'cpu' | 'gpu' }>) => {
  try {
    const blob = await removeBackground(event.data.blob, {
      model: 'isnet', device: event.data.device, proxyToWorker: false, rescale: true,
      output: { format: 'image/png', quality: 1 },
      progress: (key, current, total) => self.postMessage({ progress: key.startsWith('fetch:') && total ? Math.round(current / total * 100) : undefined }),
    });
    // IS-Net supplies the mask; retain original RGB and never increase source alpha.
    const [mask, original] = await Promise.all([createImageBitmap(blob), createImageBitmap(event.data.blob)]);
    try {
      const canvas = new OffscreenCanvas(original.width, original.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create image canvas');
      ctx.drawImage(mask, 0, 0, original.width, original.height);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(original, 0, 0);
      self.postMessage({ blob: await canvas.convertToBlob({ type: 'image/png' }) });
    } finally { mask.close(); original.close(); }
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : String(error) }); }
};
