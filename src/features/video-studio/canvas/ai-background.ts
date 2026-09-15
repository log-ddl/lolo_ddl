let worker: Worker | undefined;
let device: 'cpu' | 'gpu' | undefined;
let tail = Promise.resolve();
const cache = new Map<string, Blob>();

export async function removeAiBackground(blob: Blob, key: string, signal?: AbortSignal, progress?: (percent?: number) => void): Promise<Blob> {
  const previous = tail;
  let release!: () => void;
  tail = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    signal?.throwIfAborted();
    const cached = cache.get(key);
    if (cached) return cached;
    if (!device) {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
      device = gpu && await gpu.requestAdapter().catch(() => null) ? 'gpu' : 'cpu';
    }
    const attempt = () => new Promise<Blob>((resolve, reject) => {
      signal?.throwIfAborted();
      worker ||= new Worker(new URL('./ai-background.worker.ts', import.meta.url), { type: 'module' });
      const active = worker;
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); active.onmessage = null; active.onerror = null; };
      const fail = (error: Error) => { cleanup(); active.terminate(); worker = undefined; reject(error); };
      const abort = () => fail(new DOMException('Cancelled', 'AbortError'));
      const timer = setTimeout(() => fail(new Error('AI background removal timed out')), 600_000);
      signal?.addEventListener('abort', abort, { once: true });
      active.onmessage = (event) => {
        if (event.data.error) fail(new Error(event.data.error));
        else if (event.data.blob) { cleanup(); resolve(event.data.blob); }
        else progress?.(event.data.progress);
      };
      active.onerror = (event) => fail(new Error(event.message));
      active.postMessage({ blob, device });
    });
    let result: Blob;
    try { result = await attempt(); }
    catch (error) {
      signal?.throwIfAborted();
      if (device !== 'gpu') throw error;
      device = 'cpu'; result = await attempt();
    }
    cache.set(key, result);
    while (cache.size > 2) cache.delete(cache.keys().next().value!);
    return result;
  } finally { release(); }
}
