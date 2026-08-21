/**
 * LaneManager — the single queue/lane/concurrency/retry module for every
 * generation pipeline (Director, AutoPilot, galleries, batch processor).
 *
 * One config source: useVideoStudioSettingsStore.maxStudioLanes.
 * One queue engine: runLaneQueue / runOrdered (jwt-pinned lanes + stagger).
 * One retry helper: withRetry.
 *
 * Google Flow and Grok runtimes remain the authoritative submit gates (they
 * own account rotation and rate limiting); this module just syncs settings
 * into them and reads back their capacity, with the configured lane count as
 * the fallback.
 */

import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';

// ==================== Shared small helpers ====================

export type LaneMediaKind = 'image' | 'video';

export function randomBetween(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export function isAbortLikeError(error: unknown): boolean {
  const err = error as Error;
  return err?.name === 'AbortError' || err?.message === 'Cancelled by user';
}

export function delayOrAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Cancelled by user'));
      return;
    }
    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Cancelled by user'));
    }, { once: true });
  });
}

// ==================== Lane workers ====================

export type LaneJob<T> = {
  item: T;
  /** Provider JWT hash; pinned jobs are only taken by workers of the same JWT. */
  jwtHash?: string;
};

export type LaneWorker = {
  jwtHash?: string;
  slot: number;
};

/**
 * Build the worker set for a batch: lanesPerJwt × jwtHashes.
 * With no JWT hashes, falls back to lanesPerJwt anonymous slots.
 */
export function buildLaneWorkers(jwtHashes: string[], lanesPerJwt: number): LaneWorker[] {
  const safeLanesPerJwt = Math.max(lanesPerJwt || 1, 1);
  if (jwtHashes.length === 0) {
    return Array.from({ length: safeLanesPerJwt }, (_, index) => ({ slot: index + 1 }));
  }
  return Array.from({ length: safeLanesPerJwt }).flatMap((_, index) =>
    jwtHashes.map((jwtHash) => ({ jwtHash, slot: index + 1 }))
  );
}

/**
 * Run jobs through a fixed worker pool (lane model).
 *
 * - A worker with a jwtHash first takes a job pinned to the same JWT, then a
 *   flexible job (no JWT), so per-account lane limits are respected.
 * - Submit spacing/stagger is owned SOLELY by the provider runtimes
 *   (GoogleFlowRuntime / GrokRuntime `reserveSubmitWindow`). This queue adds no
 *   start delay of its own, so callers can never double-sleep. Do NOT reintroduce
 *   a renderer-side start-delay parameter here — that regression made AutoPilot
 *   stack a second stagger on top of the runtime gate (delays compounding to
 *   7-8s when several lanes freed at once) while Director stayed correct.
 * - Abortable via `signal`; aborted workers exit between jobs and before runJob.
 */
export async function runLaneQueue<T>(
  jobs: LaneJob<T>[],
  workers: LaneWorker[],
  runJob: (job: LaneJob<T>, worker: LaneWorker) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const pending = [...jobs];
  const activeWorkers = workers.length > 0 ? workers : [{ slot: 1 }];

  const takeNextJob = (worker: LaneWorker): LaneJob<T> | undefined => {
    const exactIndex = pending.findIndex((job) => !!worker.jwtHash && job.jwtHash === worker.jwtHash);
    if (exactIndex >= 0) return pending.splice(exactIndex, 1)[0];

    const flexibleIndex = pending.findIndex((job) => !job.jwtHash);
    if (flexibleIndex >= 0) return pending.splice(flexibleIndex, 1)[0];

    if (!worker.jwtHash && pending.length > 0) return pending.shift();
    return undefined;
  };

  await Promise.all(activeWorkers.map(async (worker) => {
    while (!signal?.aborted) {
      const job = takeNextJob(worker);
      if (!job) return;
      if (signal?.aborted) return;
      await runJob(job, worker);
    }
  }));
}

/**
 * Generic bounded pool that keeps input order in the results — the engine
 * behind long-form chapter planning and gallery image fills.
 */
export async function runOrdered<T, R>(
  items: T[],
  concurrency: number,
  runItem: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(Math.max(1, Math.floor(concurrency)), items.length) },
    async () => {
      while (!signal?.aborted) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= items.length) return;
        results[currentIndex] = await runItem(items[currentIndex], currentIndex);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

// ==================== Lane config (single source: maxStudioLanes) ====================

export interface GenerationFlowSettings {
  imageTimeoutMinMs: number;
  imageTimeoutMaxMs: number;
  videoTimeoutMinMs: number;
  videoTimeoutMaxMs: number;
  retryAttempts: number;
}

export const IMAGE_GENERATION_TIMEOUT_MIN_MS = 150 * 1000;
export const IMAGE_GENERATION_TIMEOUT_MAX_MS = 200 * 1000;
export const VIDEO_GENERATION_TIMEOUT_MIN_MS = 6 * 60 * 1000;
export const VIDEO_GENERATION_TIMEOUT_MAX_MS = 7 * 60 * 1000;
export const FLOW_GENERATION_MAX_RETRIES = 1;

function getOrderedDelay(minMs: number, maxMs: number): [number, number] {
  const min = Math.max(0, minMs || 0);
  const max = Math.max(0, maxMs || 0);
  return [Math.min(min, max), Math.max(min, max)];
}

export function getGenerationFlowSettings(): GenerationFlowSettings {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const [imageTimeoutMinMs, imageTimeoutMaxMs] = getOrderedDelay(
    settings.imageGenerationTimeoutMinMs ?? IMAGE_GENERATION_TIMEOUT_MIN_MS,
    settings.imageGenerationTimeoutMaxMs ?? IMAGE_GENERATION_TIMEOUT_MAX_MS,
  );
  const [videoTimeoutMinMs, videoTimeoutMaxMs] = getOrderedDelay(
    settings.videoGenerationTimeoutMinMs ?? VIDEO_GENERATION_TIMEOUT_MIN_MS,
    settings.videoGenerationTimeoutMaxMs ?? VIDEO_GENERATION_TIMEOUT_MAX_MS,
  );

  return {
    imageTimeoutMinMs,
    imageTimeoutMaxMs,
    videoTimeoutMinMs,
    videoTimeoutMaxMs,
    retryAttempts: Math.max(0, Math.floor(settings.generationRetryAttempts ?? FLOW_GENERATION_MAX_RETRIES)),
  };
}

export function getSubmitDelayMs(kind: LaneMediaKind): number {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const min = kind === 'image' ? settings.imageSubmitDelayMinMs : settings.videoSubmitDelayMinMs;
  const max = kind === 'image' ? settings.imageSubmitDelayMaxMs : settings.videoSubmitDelayMaxMs;
  return randomBetween(Math.max(0, min || 0), Math.max(0, max || 0));
}

/**
 * Push maxStudioLanes into the Google Flow / Grok runtimes (idempotent). The
 * runtimes stay the authoritative submit gates; this keeps every caller in sync
 * without double-sleeping.
 */
export async function syncRuntimeLaneSettings(): Promise<void> {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  if (window.googleFlowRuntime) {
    try {
      await window.googleFlowRuntime.updateSettings({
        imageLanesPerToken: settings.imageLanesPerJwt,
        videoLanesPerToken: settings.videoLanesPerJwt,
        imageSubmitDelayMinMs: settings.imageSubmitDelayMinMs,
        imageSubmitDelayMaxMs: settings.imageSubmitDelayMaxMs,
        videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
        videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
        accountStartStaggerMinMs: settings.jwtStartStaggerMinMs,
        accountStartStaggerMaxMs: settings.jwtStartStaggerMaxMs,
      });
    } catch (error) {
      console.warn('[LaneManager] Could not sync Google Flow lane settings:', error);
    }
  }
  if (window.grokVideoRuntime) {
    try {
      await window.grokVideoRuntime.updateSettings({
        videoLanesPerExtension: settings.videoLanesPerJwt,
        videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
        videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
        extensionStartStaggerMinMs: settings.jwtStartStaggerMinMs,
        extensionStartStaggerMaxMs: settings.jwtStartStaggerMaxMs,
      });
    } catch (error) {
      console.warn('[LaneManager] Could not sync Grok lane settings:', error);
    }
  }
}

/**
 * Resolve how many lanes a media kind may use for the active platform.
 * - googleflow: runtime capacity (accounts × lanes per account)
 * - grok: runtime capacity (video only; image falls back to settings)
 * - other / runtime unavailable: configured lanes per JWT
 */
export async function resolveLaneCount(kind: LaneMediaKind, platform?: string): Promise<number> {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const configured = Math.max(1, kind === 'image' ? settings.imageLanesPerJwt : settings.videoLanesPerJwt);

  if (platform === 'googleflow' && window.googleFlowRuntime) {
    try {
      const capacity = await window.googleFlowRuntime.getCapacity();
      const lanes = kind === 'image' ? capacity.imageLanes : capacity.videoLanes;
      return Math.max(1, lanes || configured);
    } catch {
      return configured;
    }
  }

  if (kind === 'video' && platform === 'grok' && window.grokVideoRuntime) {
    try {
      const capacity = await window.grokVideoRuntime.getCapacity();
      return Math.max(1, capacity.videoLanes || configured);
    } catch {
      return configured;
    }
  }

  return configured;
}

// ==================== Central retry (single implementation) ====================

export interface WithRetryOptions {
  /** Total attempts including the first one. */
  attempts: number;
  /** Base delay for exponential backoff (delay = baseDelayMs * 2^(attempt-1)). */
  baseDelayMs?: number;
  signal?: AbortSignal;
  /** Return false to stop retrying and rethrow immediately. */
  retryable?: (error: unknown) => boolean;
  onRetry?: (nextAttempt: number, error: unknown) => void;
}

/**
 * The one retry loop for every pipeline. Aborts propagate immediately.
 */
export async function withRetry<T>(
  options: WithRetryOptions,
  run: (attempt: number, totalAttempts: number) => Promise<T>,
): Promise<T> {
  const totalAttempts = Math.max(1, Math.floor(options.attempts));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 0);
  let lastError: unknown = new Error('Operation failed');

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    if (options.signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
    try {
      return await run(attempt, totalAttempts);
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (isAbortLikeError(error)) throw error;
      lastError = error;
      if (attempt >= totalAttempts) break;
      if (options.retryable && !options.retryable(error)) throw error;
      options.onRetry?.(attempt + 1, error);
      if (baseDelayMs > 0) {
        await delayOrAbort(baseDelayMs * Math.pow(2, attempt - 1), options.signal);
      }
    }
  }

  throw lastError;
}
