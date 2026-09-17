import { processImage } from './image-processing';
import { saveOutputMedia } from './output-files';
import { runAiNode } from './ai-node-runner';
import { saveBlobToBrowserStorage } from '../lib/browser-image-storage';
import { videoDuration } from '@/features/video-studio/lib/ai/video-duration';
import { expandMentions, referenceName, mentionIds } from './mentions';
/**
 * Running a canvas node.
 *
 * No new provider and no new settings: this composes the same primitives the
 * Scenes and Characters panels go through — Settings routing, the account
 * allowlist, the model fallback chain — so a canvas run rotates accounts and
 * drops to a weaker model exactly the way every other manual run in the app
 * does. The one difference is that the head model comes from the node instead
 * of from the feature binding, which is the whole point of a per-node picker.
 */

import { runWithModelFallback } from '@/features/video-studio/autopilot/model-fallback';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { googleFlowBoundModel, resolveSettingsMediaRouting } from '@/features/video-studio/lib/ai/media-routing';
import { generateProviderVideo } from '@/features/video-studio/lib/ai/video-generator';
import { getSpace, useCanvasStore } from './canvas-store';
import { effectivePrompt, nodeById, resolveInputs, resolvedRuns, upstreamOrder } from './graph';
import { isGenerator, type CanvasNodeState, type NodeOutput } from './types';
import { generationPhase } from './progress';

const FALLBACK_IMAGE_MODEL = 'GEM_PIX_2';
const FALLBACK_VIDEO_MODEL = 'Veo_3.1-Fast';

/**
 * Sentinel rather than a sentence: the runner has no locale, so the UI decides
 * the wording. Any other error carries the provider's own message through.
 */
export const EMPTY_PROMPT = 'EMPTY_PROMPT';

/** Nodes currently in flight, so a double click cannot spend quota twice. */
const inFlight = new Set<string>();
const executions = new Map<string, { spaceId: string; controller: AbortController; promise: Promise<void> }>();
const runs = new Set<{ spaceId: string; controller: AbortController }>();
export function cancelNode(nodeId: string) { executions.get(nodeId)?.controller.abort(); }
export function cancelSpace(spaceId: string) {
  for (const run of runs) if (run.spaceId === spaceId) run.controller.abort();
  for (const run of executions.values()) if (run.spaceId === spaceId) run.controller.abort();
}
function checkCancelled(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); }
async function executeNode(spaceId: string, nodeId: string, signal?: AbortSignal): Promise<void> {
  checkCancelled(signal);
  const existing = executions.get(nodeId);
  if (existing) return existing.promise;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const promise = executeSingleNode(spaceId, nodeId, controller.signal).finally(() => {
    signal?.removeEventListener('abort', abort); executions.delete(nodeId);
  });
  executions.set(nodeId, { spaceId, controller, promise });
  return promise;
}

export function isNodeRunning(nodeId: string): boolean {
  return inFlight.has(nodeId);
}

export class CanvasRunError extends Error {
  constructor(message: string, readonly nodeId: string) {
    super(message);
    this.name = 'CanvasRunError';
  }
}

async function generateImage(input: {
  spaceId: string;
  node: CanvasNodeState;
  prompt: string;
  references: string[];
  taskId: string;
  signal?: AbortSignal;
}): Promise<NodeOutput> {
  const head = input.node.model || googleFlowBoundModel('scene_generation') || FALLBACK_IMAGE_MODEL;
  const { chain, accountsFor, modelChains } = await resolveSettingsMediaRouting('image', head, input.node.accountOwnerScopeId);
  const { result, model } = await runWithModelFallback(chain, (attemptModel) =>
    googleFlowProvider.generateImage({
      taskId: input.taskId,
      projectId: input.spaceId,
      sceneId: input.node.id,
      prompt: input.prompt,
      model: attemptModel,
      aspectRatio: input.node.aspectRatio,
      references: input.references.map((source) => ({ source, fileName: referenceName(getSpace(input.spaceId)!.nodes, getSpace(input.spaceId)!.edges, input.node.id, source), provider: 'googleflow' as const })),
      allowedOwnerScopeIds: accountsFor(attemptModel),
      modelChainByOwnerScope: modelChains,
      signal: input.signal,
    }),
  );
  const url = result.localUrl || result.remoteUrl;
  if (!url) throw new Error('Google Flow returned no image URL');
  return { kind: 'image', url, model, taskId: result.taskId, mediaId: result.mediaId, createdAt: Date.now() };
}

async function generateVideo(input: {
  spaceId: string;
  node: CanvasNodeState;
  prompt: string;
  startImageUrl?: string;
  endImageUrl?: string;
  references: string[];
  taskId: string;
  signal?: AbortSignal;
}): Promise<NodeOutput> {
  const model = input.node.model || googleFlowBoundModel('video_generation') || FALLBACK_VIDEO_MODEL;
  const result = await generateProviderVideo({
    platform: 'googleflow',
    accountOwnerScopeId: input.node.accountOwnerScopeId,
    length: videoDuration(model, input.node.videoDuration),
    taskId: input.taskId,
    projectId: input.spaceId,
    sceneId: input.node.id,
    prompt: input.prompt,
    model,
    aspectRatio: input.node.aspectRatio,
    imageFileNames: Object.fromEntries([input.startImageUrl, input.endImageUrl, ...input.references].filter((url): url is string => !!url).flatMap((url) => { const space = getSpace(input.spaceId)!; const name = referenceName(space.nodes, space.edges, input.node.id, url); return name ? [[url, name]] : []; })),
    startImageUrl: input.startImageUrl,
    endImageUrl: input.endImageUrl,
    referenceImageUrls: input.references.length > 0 ? input.references : undefined,
    signal: input.signal,
  });
  return {
    kind: 'video',
    url: result.videoUrl,
    model,
    taskId: result.taskId,
    mediaId: result.mediaId,
    createdAt: Date.now(),
  };
}

/** One node, assuming its upstream is already resolved. */
async function executeSingleNode(spaceId: string, nodeId: string, signal?: AbortSignal): Promise<void> {
  const space = getSpace(spaceId);
  const node = space && nodeById(space.nodes, nodeId);
  if (!space || !node || !isGenerator(node.kind)) return;

  const { updateNode } = useCanvasStore.getState();
  if (node.kind === 'ai') {
    inFlight.add(nodeId);
    updateNode(spaceId, nodeId, { status: 'running', error: undefined });
    try {
      const textOutput = await runAiNode(space, node, signal);
      checkCancelled(signal);
      updateNode(spaceId, nodeId, { status: 'done', textOutput, stale: false });
    } catch (error) {
      if (signal?.aborted) { updateNode(spaceId, nodeId, { status: 'idle', stale: true, error: undefined }); throw error; }
      const message = error instanceof Error ? error.message : String(error);
      updateNode(spaceId, nodeId, { status: 'failed', error: message });
      throw new CanvasRunError(message, nodeId);
    } finally { inFlight.delete(nodeId); }
    return;
  }
  if (node.kind === 'output') {
    inFlight.add(nodeId);
    updateNode(spaceId, nodeId, { status: 'running', error: undefined, savedFiles: [], batchProgress: undefined });
    try {
      if (!node.outputDirectory) throw new Error('OUTPUT_FOLDER_REQUIRED');
      const resolved = resolveInputs(space.nodes, space.edges, nodeId);
      if (resolved.missing.length) throw new Error('INPUT_REQUIRED');
      await saveOutputMedia(space, nodeId, node.outputDirectory, signal, (files, total) => updateNode(spaceId, nodeId, { status: 'running', savedFiles: files, batchProgress: { done: files.length, total } }));
      updateNode(spaceId, nodeId, { status: 'done', stale: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateNode(spaceId, nodeId, { status: signal?.aborted ? 'idle' : 'failed', error: signal?.aborted ? undefined : message });
      throw new CanvasRunError(message, nodeId);
    } finally { inFlight.delete(nodeId); }
    return;
  }
  const inputs = resolveInputs(space.nodes, space.edges, nodeId);
  if (inputs.missing.length || node.kind !== 'imageEdit' && mentionIds(node.prompt).some((id) => !space.edges.some((edge) => edge.source === id && edge.target === nodeId))) {
    updateNode(spaceId, nodeId, { status: 'failed', error: 'INPUT_REQUIRED' });
    throw new CanvasRunError('INPUT_REQUIRED', nodeId);
  }
  const batches = resolvedRuns(inputs);
  const videoRefs = (media: Record<string, string[]>) => [...new Set([...node.refs, ...(media.start || []), ...(media.refs || [])])];
  if (node.kind === 'videoGenerator' && node.videoMode === 'ref' && batches.some((batch) => videoRefs(batch.mediaByPort).length > 3 || batch.mediaByPort.end?.length)) {
    updateNode(spaceId, nodeId, { status: 'failed', error: 'VIDEO_REF_INPUT_INVALID' });
    throw new CanvasRunError('VIDEO_REF_INPUT_INVALID', nodeId);
  }
  if (node.kind !== 'imageEdit' && batches.some((batch) => !effectivePrompt(node, batch.promptParts))) {
    updateNode(spaceId, nodeId, { status: 'failed', error: EMPTY_PROMPT });
    throw new CanvasRunError(EMPTY_PROMPT, nodeId);
  }
  if (node.kind === 'videoGenerator' && batches.some((batch) => !node.refs.length && !batch.mediaByPort.start?.length)) {
    updateNode(spaceId, nodeId, { status: 'failed', error: 'VIDEO_START_REQUIRED' });
    throw new CanvasRunError('VIDEO_START_REQUIRED', nodeId);
  }
  if (node.kind === 'imageEdit' && batches.some((batch) => !node.refs.length && !batch.mediaByPort.refs?.length)) {
    updateNode(spaceId, nodeId, { status: 'failed', error: 'INPUT_REQUIRED' });
    throw new CanvasRunError('INPUT_REQUIRED', nodeId);
  }

  if (node.kind === 'imageEdit') {
    inFlight.add(nodeId);
    updateNode(spaceId, nodeId, { status: 'running', error: undefined, batchOutputs: [], startedAt: Date.now(), accountEmail: undefined, phase: undefined });
    try {
      const sources = [...new Set(batches.flatMap((batch) => [...node.refs, ...(batch.mediaByPort.refs || [])]))];
      const results: NodeOutput[] = [];
      for (const source of sources) {
        checkCancelled(signal);
        let backgroundSkipped = false;
        const blob = await processImage(source, node.imageEdit, () => { backgroundSkipped = true; }, signal);
        checkCancelled(signal);
        const url = await saveBlobToBrowserStorage(blob, 'canvas-edit.png');
        checkCancelled(signal);
        const output: NodeOutput = { kind: 'image', url, model: node.imageEdit?.aiBackground || !node.imageEdit ? 'IS-Net · Local AI' : 'Local image processing', createdAt: Date.now(), backgroundSkipped };
        results.push(output);
        updateNode(spaceId, nodeId, { status: results.length === sources.length ? 'done' : 'running', output, batchOutputs: [...results], batchProgress: { done: results.length, total: sources.length }, stale: results.length !== sources.length });
      }
    } catch (error) {
      if (signal?.aborted) { updateNode(spaceId, nodeId, { status: 'idle', stale: true, error: undefined }); throw error; }
      const message = error instanceof Error ? error.message : String(error);
      updateNode(spaceId, nodeId, { status: 'failed', error: message });
      throw new CanvasRunError(message, nodeId);
    } finally { inFlight.delete(nodeId); }
    return;
  }

  inFlight.add(nodeId);
  let taskId = crypto.randomUUID();
  const runtime = window.googleFlowRuntime;
  let disposed = false;
  let credentialId: string | undefined;
  let credentials: import('@/features/video-studio/packages/ai-core/providers/google-flow/types').GoogleFlowCredential[] = [];
  let accountEmail: string | undefined;
  const syncAccount = () => {
    const email = credentials.find((credential) => credential.credentialId === credentialId)?.email;
    if (disposed || email === accountEmail) return;
    accountEmail = email;
    updateNode(spaceId, nodeId, { status: 'running', accountEmail: email });
  };
  const batchOutputs: NodeOutput[] = [];
  updateNode(spaceId, nodeId, { status: 'running', batchOutputs: [], error: undefined, startedAt: Date.now(), phaseStartedAt: Date.now(), phase: 'queued', accountEmail: undefined });
  const offStatus = runtime?.onStatus((status) => { credentials = status.credentials; syncAccount(); });
  const offTask = runtime?.onTask((task) => {
    if (task.taskId !== taskId) return;
    const phase = generationPhase(getSpace(spaceId)?.nodes.find((item) => item.id === nodeId), task);
    if (phase) updateNode(spaceId, nodeId, { status: 'running', ...phase });
    if (task.credentialId) { credentialId = task.credentialId; syncAccount(); }
  });
  void runtime?.getStatus().then((status) => { if (!disposed) { credentials = status.credentials; syncAccount(); } }).catch(() => {});
  try {
    for (const [index, batch] of batches.entries()) {
    checkCancelled(signal);
    taskId = crypto.randomUUID();
    credentialId = undefined; accountEmail = undefined;
    const { promptParts, mediaByPort } = batch;
    const references = [...new Set([...node.refs, ...(mediaByPort.refs || [])])];
    const prompt = expandMentions(effectivePrompt(node, promptParts), space.nodes, space.edges,
      node.kind === 'videoGenerator' ? node.videoMode === 'ref' ? videoRefs(mediaByPort) : [mediaByPort.start?.[0] || node.refs[0], mediaByPort.end?.[0]].filter((url): url is string => !!url) : references, promptParts);
    updateNode(spaceId, nodeId, { status: 'running', batchProgress: { done: index, total: batches.length } });
    const output = node.kind !== 'videoGenerator'
      ? await generateImage({ spaceId, node, prompt, references, signal, taskId })
      : await generateVideo({
        spaceId,
        taskId,
        node,
        prompt,
        startImageUrl: node.videoMode === 'ref' ? undefined : mediaByPort.start?.[0] || node.refs[0],
        endImageUrl: node.videoMode === 'ref' ? undefined : mediaByPort.end?.[0],
        references: node.videoMode === 'ref' ? videoRefs(mediaByPort) : [],
        signal,
      });
    checkCancelled(signal);
    const result = { ...output, prompt, aspectRatio: node.aspectRatio, accountEmail };
    batchOutputs.push(result);
    updateNode(spaceId, nodeId, { status: index === batches.length - 1 ? 'done' : 'running', batchOutputs: [...batchOutputs], batchProgress: { done: index + 1, total: batches.length }, output: result, error: undefined, stale: index !== batches.length - 1 });
    }
  } catch (error) {
    if (signal?.aborted) { updateNode(spaceId, nodeId, { status: 'idle', stale: true, phase: undefined, error: undefined }); throw new DOMException('Cancelled', 'AbortError'); }
    const message = error instanceof Error ? error.message : String(error);
    updateNode(spaceId, nodeId, { status: 'failed', error: message });
    throw new CanvasRunError(message, nodeId);
  } finally {
    disposed = true;
    offTask?.();
    offStatus?.();
    inFlight.delete(nodeId);
  }
}

/**
 * Run a node, pulling in whatever upstream work it needs first.
 *
 * An ancestor with a clean result is reused rather than regenerated — quota is
 * the scarce thing here, and regenerating a reference image would change the
 * very thing downstream nodes were matched against. The node the user actually
 * pressed always runs, clean or not, because that press means "make it again".
 */
export async function runNode(spaceId: string, nodeId: string, signal?: AbortSignal): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const run = { spaceId, controller }; runs.add(run);
  try { await runNodePlan(spaceId, nodeId, controller.signal); }
  finally { runs.delete(run); signal?.removeEventListener('abort', abort); }
}
async function runNodePlan(spaceId: string, nodeId: string, signal?: AbortSignal): Promise<void> {
  const space = getSpace(spaceId);
  if (!space) return;
  const target = nodeById(space.nodes, nodeId);
  if (target?.kind === 'output' && (!target.outputDirectory || !window.exportStorage?.writeFiles)) {
    const error = !target.outputDirectory ? 'OUTPUT_FOLDER_REQUIRED' : 'OUTPUT_DESKTOP_REQUIRED';
    useCanvasStore.getState().updateNode(spaceId, nodeId, { status: 'failed', error });
    throw new CanvasRunError(error, nodeId);
  }

  const plan = [...upstreamOrder(space.nodes, space.edges, nodeId), nodeId];
  for (const id of plan) {
    checkCancelled(signal);
    const current = getSpace(spaceId);
    const node = current && nodeById(current.nodes, id);
    if (!node || (!isGenerator(node.kind) && node.kind !== 'localImage' && node.kind !== 'localVideo')) continue;
    if ((node.kind === 'localImage' || node.kind === 'localVideo')) {
      if (!node.output?.url) {
        useCanvasStore.getState().updateNode(spaceId, id, { status: 'failed', error: 'LOCAL_IMAGE_REQUIRED' });
        throw new CanvasRunError('LOCAL_IMAGE_REQUIRED', id);
      }
      continue;
    }
    const reusable = id !== nodeId && (node.output || node.textOutput) && !node.stale;
    if (reusable) continue;
    await executeNode(spaceId, id, signal);
  }
}

/** Every node with no downstream wire, i.e. the ends of the graph. */
export function terminalNodeIds(spaceId: string): string[] {
  const space = getSpace(spaceId);
  if (!space) return [];
  return space.nodes
    .filter((node) => isGenerator(node.kind) && !space.nodes.some((other) => isGenerator(other.kind) && upstreamOrder(space.nodes, space.edges, other.id).includes(node.id)))
    .map((node) => node.id);
}

/** Run the whole space by running each end node, which pulls its own chain. */
export async function runNodes(spaceId: string, nodeIds: string[]): Promise<void> {
  const run = { spaceId, controller: new AbortController() }; runs.add(run);
  try {
    // Selected ancestors are pulled by their descendants, avoiding duplicate work.
    const space = getSpace(spaceId);
    if (!space) return;
    const ends = nodeIds.filter((id) => !nodeIds.some((other) => other !== id && upstreamOrder(space.nodes, space.edges, other).includes(id)));
    for (const id of ends) { checkCancelled(run.controller.signal); await runNode(spaceId, id, run.controller.signal); }
  } finally { runs.delete(run); }
}
export async function runSpace(spaceId: string): Promise<void> { await runNodes(spaceId, terminalNodeIds(spaceId)); }
