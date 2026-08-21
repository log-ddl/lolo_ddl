/**
 * Run lifecycle state.
 *
 * Only ONE pipeline runs at a time — CLI agents are heavy and the whole
 * pipeline shares one workspace, so parallel runs would clobber each other's
 * files. This module owns the abort controller, the active run id and the
 * pending human-gate resolver.
 */

export const STEP_TIMEOUT_MS = 20 * 60 * 1000;
export const JUDGE_TIMEOUT_MS = 5 * 60 * 1000;

let controller: AbortController | null = null;
let activeRunId: string | null = null;
/** Resolver for a "waiting for approval" gate that is currently blocking. */
let humanGateResolver: ((verdict: { pass: boolean; reason: string }) => void) | null = null;

export function isRunnerBusy(): boolean {
  return activeRunId !== null;
}

export function getActiveRunId(): string | null {
  return activeRunId;
}

export function setActiveRun(runId: string | null, next: AbortController | null): void {
  activeRunId = runId;
  controller = next;
}

export function getSignal(): AbortSignal | undefined {
  return controller?.signal;
}

export function abortRun(): void {
  controller?.abort();
  humanGateResolver?.({ pass: false, reason: 'Người dùng đã dừng pipeline' });
  humanGateResolver = null;
}

export function resolveHumanGate(pass: boolean, reason: string): void {
  humanGateResolver?.({ pass, reason });
  humanGateResolver = null;
}

export function isAwaitingHumanGate(): boolean {
  return humanGateResolver !== null;
}

export function setHumanGateResolver(resolver: ((verdict: { pass: boolean; reason: string }) => void) | null): void {
  humanGateResolver = resolver;
}

/** Throws as soon as the run has been aborted, so a step stops at its next checkpoint. */
export function assertAlive(): void {
  if (controller?.signal.aborted) throw new Error('aborted');
}
