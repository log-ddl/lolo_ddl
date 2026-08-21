/**
 * Shared generation-status vocabulary for every asset pipeline (Director scenes,
 * AutoPilot media outputs, uploads, retries).
 *
 * Single vocabulary:
 *   idle       - not started / reset
 *   queued     - accepted into a lane queue, waiting for a free slot
 *   uploading  - asset bytes being uploaded to the provider
 *   generating - provider task in flight
 *   completed  - asset ready
 *   failed     - stopped after retries (or non-retryable error)
 *
 * 'skipped' stays a local extension where a pipeline intentionally bypasses an
 * asset (e.g. AutoPilot real-image research) — it is never persisted as a
 * transient state.
 */

export type GenerationStatus = 'idle' | 'queued' | 'uploading' | 'generating' | 'completed' | 'failed';

export const INFLIGHT_GENERATION_STATUSES: ReadonlySet<GenerationStatus> = new Set<GenerationStatus>([
  'queued',
  'uploading',
  'generating',
]);

export const TERMINAL_GENERATION_STATUSES: ReadonlySet<GenerationStatus> = new Set<GenerationStatus>([
  'completed',
  'failed',
]);

export function isInflightStatus(status: GenerationStatus | undefined | null): boolean {
  return status ? INFLIGHT_GENERATION_STATUSES.has(status) : false;
}

export function isTerminalStatus(status: GenerationStatus | undefined | null): boolean {
  return status ? TERMINAL_GENERATION_STATUSES.has(status) : false;
}

export function isSuccessfulStatus(status: GenerationStatus | undefined | null): boolean {
  return status === 'completed';
}

export function isFailedStatus(status: GenerationStatus | undefined | null): boolean {
  return status === 'failed';
}

/**
 * Persisted "generating/queued/uploading" states die with the process (in-flight
 * HTTP requests are gone), so they must be normalized back to idle on restore.
 */
export function resetInflightStatus(status: GenerationStatus): GenerationStatus {
  return isInflightStatus(status) ? 'idle' : status;
}

export function toGenerationStatus(value: unknown): GenerationStatus {
  if (value === 'queued' || value === 'uploading' || value === 'generating' || value === 'completed' || value === 'failed') {
    return value;
  }
  return 'idle';
}
