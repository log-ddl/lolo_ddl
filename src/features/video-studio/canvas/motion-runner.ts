import { mediaBlob } from './archive';
import { nodeValues } from './graph';
import { getSpace, useCanvasStore } from './canvas-store';
import { isMotionKind, motionMode } from './motion-math';
import type { CanvasNodeState } from './types';
export async function runMotionNode(spaceId: string, node: CanvasNodeState, signal?: AbortSignal) {
  const api = window.canvasMotion;
  const { updateNode } = useCanvasStore.getState();
  const jobId = crypto.randomUUID();
  let offStarted: (() => void) | undefined;
  const cancel = () => { void api?.cancel(jobId).catch(() => {}); };
  try {
    if (!api) throw new Error('Motion video requires the desktop app. Restart the app after updating.');
    if (!isMotionKind(node.kind)) throw new Error('Invalid motion kind');
    signal?.throwIfAborted();
    const space = getSpace(spaceId)!;
    // Preserve edge order and repeated frames; do not deduplicate a frame cycle.
    const sources = [...node.refs, ...space.edges.filter((edge) => edge.target === node.id && edge.targetHandle === 'refs').flatMap((edge) => {
      const values = nodeValues(space.nodes, space.edges, edge.source);
      if (!values.length) throw new Error('INPUT_REQUIRED');
      return values;
    })];
    const mode = motionMode(node.kind, node.motionMode);
    if (mode === 'frames' ? sources.length < 2 || sources.length > 60 : sources.length !== 1) throw new Error(mode === 'frames' ? 'Connect 2–60 images in frame order.' : 'Connect exactly one image.');
    updateNode(spaceId, node.id, { status: 'running', error: undefined, phase: 'queued', startedAt: Date.now() });
    const images: ArrayBuffer[] = [];
    for (const url of sources) { signal?.throwIfAborted(); images.push(await (await mediaBlob(url)).arrayBuffer()); }
    signal?.throwIfAborted();
    offStarted = api.onStarted((id) => { if (id === jobId && !signal?.aborted) updateNode(spaceId, node.id, { status: 'running', phase: 'polling', phaseStartedAt: Date.now() }); });
    const resultPromise = api.render({ jobId, kind: node.kind, mode, entrance: node.motionEntrance ?? 'none', intensity: node.motionIntensity ?? 1, speed: node.motionSpeed ?? 1, duration: node.motionDuration ?? 5, images });
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    const result = await resultPromise;
    signal?.throwIfAborted();
    updateNode(spaceId, node.id, { status: 'done', stale: false, batchOutputs: undefined, batchProgress: undefined, output: { kind: 'video', url: result.url, model: 'Local motion · 30 fps', createdAt: Date.now() } });
  } catch (error) {
    updateNode(spaceId, node.id, { status: signal?.aborted ? 'idle' : 'failed', stale: true, error: signal?.aborted ? undefined : error instanceof Error ? error.message : String(error) });
    throw error;
  } finally { offStarted?.(); signal?.removeEventListener('abort', cancel); updateNode(spaceId, node.id, { phase: undefined }); }
}
