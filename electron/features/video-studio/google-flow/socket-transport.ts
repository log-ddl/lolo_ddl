import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import {
  type FlowCredentialSlot,
  type FlowTaskEvent,
  assertString,
  isAllowedFlowUrl,
  isUuid,
} from './protocol';
import { randomBetween, sleep } from '../browser-session/runtime-utils';
import { decodeVerifiedMp4, extractFlowOperations, operationStatus } from './result-parser';
import { downloadVideoBytes } from './media-io';
import { safeMessage, type Lane, type PendingRequest, type SocketState } from './runtime-types';

/**
 * WebSocket transport for the Google Flow runtime: the handshake and message
 * loop for a connected browser extension, and the request/response bridge that
 * proxies API and tRPC calls through that socket.
 *
 * Both functions take a {@link FlowSocketContext} instead of `this` so the
 * transport can live outside the runtime class while still sharing its state.
 */

export interface FlowSocketContext {
  readonly protocolVersion: number;
  readonly sessionSecret: string;
  readonly sockets: Map<string, SocketState>;
  readonly credentials: Map<string, FlowCredentialSlot>;
  readonly instanceToCredential: Map<string, string>;
  readonly pending: Map<string, PendingRequest>;
  readonly abortControllers: Map<string, AbortController>;
  videoSubmitDelayMinMs: number;
  videoSubmitDelayMaxMs: number;
  /** Root-relative tRPC mount that last answered, shared by every caller. */
  trpcPath: string;
  refreshCredits(slot: FlowCredentialSlot): Promise<void>;
  emitLaneTask(
    taskId: string,
    kind: 'image' | 'video',
    status: FlowTaskEvent['status'],
    slot: FlowCredentialSlot,
    lane: Lane,
    progress?: number,
    message?: string,
    phase?: FlowTaskEvent['phase'],
  ): void;
  emitStatus(): void;
  hashIdentity(value: string): string;
  apiRequest(
    slot: FlowCredentialSlot,
    params: Record<string, unknown>,
    timeout: number,
    signal?: AbortSignal,
  ): Promise<unknown>;
  apiUrl(endpoint: string, extra?: string): string;
}

export function attachSocket(ctx: FlowSocketContext, socket: WebSocket): void {
  let assignedCredentialId: string | undefined;
  socket.on('message', (bytes) => {
    try {
      const message = JSON.parse(bytes.toString()) as Record<string, unknown>;
      if (message.type === 'extension_ready') {
        const isLegacyFlowKit = message.protocolVersion === undefined && message.extensionInstanceId === undefined;
        const protocolVersion = isLegacyFlowKit ? ctx.protocolVersion : Number(message.protocolVersion);
        if (!isLegacyFlowKit) assertString(message.extensionInstanceId, 'extensionInstanceId', 128);
        if (protocolVersion !== ctx.protocolVersion) throw new Error(`Protocol ${protocolVersion} is not supported`);
        // FlowKit 0.2 did not send an instance id. A per-connection id keeps it
        // compatible without weakening validation for the native bridge.
        const legacyInstanceId = typeof message.legacyInstanceId === 'string' && isUuid(message.legacyInstanceId)
          ? message.legacyInstanceId
          : undefined;
        const instanceId = isLegacyFlowKit ? `flowkit-${legacyInstanceId || randomUUID()}` : String(message.extensionInstanceId);
        const previousId = ctx.instanceToCredential.get(instanceId);
        const credentialId = previousId || `flow-${ctx.hashIdentity(instanceId)}`;
        const previous = previousId ? ctx.sockets.get(previousId) : undefined;
        previous?.socket.close(4001, 'Replaced by reconnect');
        const accountId = typeof message.accountId === 'string' ? ctx.hashIdentity(message.accountId) : undefined;
        const legacyTokenAge = typeof message.tokenAge === 'number' ? Math.max(0, message.tokenAge) : undefined;
        const slot: FlowCredentialSlot = {
          credentialId, extensionInstanceId: instanceId, connectionId: randomUUID(), accountId,
          ownerScopeId: accountId || credentialId,
          tokenCapturedAt: typeof message.tokenCapturedAt === 'number'
            ? message.tokenCapturedAt
            : message.flowKeyPresent ? Date.now() - (legacyTokenAge || 0) : undefined,
          state: message.flowKeyPresent ? 'ready' : 'stale',
        };
        assignedCredentialId = credentialId;
        ctx.instanceToCredential.set(instanceId, credentialId);
        ctx.credentials.set(credentialId, slot);
        ctx.sockets.set(credentialId, { socket, slot, protocol: isLegacyFlowKit ? 'flowkit-legacy' : 'native' });
        socket.send(JSON.stringify({
          type: 'credential_assigned', protocolVersion: ctx.protocolVersion, requestId: message.requestId,
          extensionInstanceId: instanceId, credentialId, connectionId: slot.connectionId, sessionSecret: ctx.sessionSecret,
        }));
        if (isLegacyFlowKit) {
          socket.send(JSON.stringify({ type: 'callback_secret', secret: ctx.sessionSecret }));
        }
        ctx.emitStatus();
        void refreshCredits(ctx, slot);
        return;
      }
      if (!assignedCredentialId) throw new Error('Extension must handshake first');
      const state = ctx.sockets.get(assignedCredentialId);
      if (!state || (state.protocol === 'native'
        && (message.sessionSecret !== ctx.sessionSecret || message.credentialId !== assignedCredentialId))) {
        throw new Error('Invalid Google Flow extension session');
      }
      if (message.type === 'token_updated' || message.type === 'token_captured') {
        state.slot.tokenCapturedAt = Date.now();
        state.slot.state = 'ready';
        if (typeof message.accountId === 'string') {
          state.slot.accountId = ctx.hashIdentity(message.accountId);
          state.slot.ownerScopeId = state.slot.accountId;
        }
        ctx.emitStatus();
        return;
      }
      if (message.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      if (message.type === 'pong') return;
      const requestId = typeof message.requestId === 'string' ? message.requestId : typeof message.id === 'string' ? message.id : '';
      const pending = ctx.pending.get(requestId);
      if (!pending || pending.credentialId !== assignedCredentialId) return;
      clearTimeout(pending.timer);
      ctx.pending.delete(requestId);
      if (message.error || (typeof message.status === 'number' && message.status >= 400)) {
        const endpoint = (() => {
          try { return new URL(pending.url).pathname; } catch { return pending.url; }
        })();
        const rawDetail = message.error || message.data;
        let detail = '';
        if (typeof rawDetail === 'string') detail = rawDetail;
        else if (rawDetail !== undefined) {
          try { detail = JSON.stringify(rawDetail); } catch { detail = String(rawDetail); }
        }
        if (detail.length > 500) detail = `${detail.slice(0, 500)}...`;
        const statusText = typeof message.status === 'number' ? `HTTP ${message.status}` : 'request failed';
        pending.reject(new Error(`Google Flow ${statusText}${endpoint ? ` (${endpoint})` : ''}${detail ? `: ${detail}` : ''}`));
      } else {
        pending.resolve(message.data ?? message.result ?? message);
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: 'protocol_error', error: safeMessage(error) }));
    }
  });
  socket.on('close', () => {
    if (!assignedCredentialId) return;
    const current = ctx.sockets.get(assignedCredentialId);
    if (current?.socket !== socket) return;
    current.slot.state = 'disconnected';
    ctx.sockets.delete(assignedCredentialId);
    for (const [requestId, pending] of ctx.pending) {
      if (pending.credentialId !== assignedCredentialId) continue;
      clearTimeout(pending.timer);
      pending.reject(new Error('Google Flow extension disconnected'));
      ctx.pending.delete(requestId);
    }
    ctx.emitStatus();
  });
}

/**
 * Runs one attempt on an already-chosen lane. Lane selection lives in the
 * runtime because it owns the quota locks and the failover loop that retries
 * this call on another account.
 *
 * `retryable` marks failures the caller will retry elsewhere (a daily-quota
 * 429): those must not emit a `failed` task event, or the UI would flash a
 * dead task for a shot that is about to run fine on the next account.
 *
 * `queuedMessage` rides along on the `queued` event so a task that moved after
 * a quota failure says which account it left, instead of silently reappearing.
 */
export async function runOnLane<T>(ctx: FlowSocketContext, kind: 'image' | 'video', taskId: string, lane: Lane,
  executor: (slot: FlowCredentialSlot, lane: Lane, signal: AbortSignal) => Promise<T>,
  retryable: (error: unknown) => boolean = () => false, queuedMessage?: string): Promise<T> {
  const state = ctx.sockets.get(lane.credentialId);
  if (!state) throw new Error('No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.');
  const controller = new AbortController();
  ctx.abortControllers.set(taskId, controller);
  lane.queued += 1;
  ctx.emitLaneTask(taskId, kind, 'queued', state.slot, lane, 0, queuedMessage);
  return new Promise<T>((resolve, reject) => {
    lane.chain = lane.chain.catch(() => undefined).then(async () => {
      try { resolve(await executor(state.slot, lane, controller.signal)); }
      catch (error) {
        const cancelled = controller.signal.aborted;
        if (cancelled) ctx.emitLaneTask(taskId, kind, 'cancelled', state.slot, lane, undefined, safeMessage(error));
        else if (!retryable(error)) ctx.emitLaneTask(taskId, kind, 'failed', state.slot, lane, undefined, safeMessage(error));
        reject(error);
      } finally {
        lane.queued = Math.max(0, lane.queued - 1);
        ctx.abortControllers.delete(taskId);
        // Keep a completed/failed video lane unavailable for the configured
        // video-delay window before its next queued job. The caller is
        // already resolved/rejected above, so this cooldown does not delay
        // reporting the finished task to the UI.
        if (kind === 'video') {
          const cooldownMs = randomBetween(ctx.videoSubmitDelayMinMs, ctx.videoSubmitDelayMaxMs);
          if (cooldownMs > 0) await new Promise<void>((done) => setTimeout(done, cooldownMs));
        }
      }
    });
  });
}


export function proxyRequest(ctx: FlowSocketContext, slot: FlowCredentialSlot, type: 'api_request' | 'trpc_request', params: Record<string, unknown>, timeout: number, signal?: AbortSignal): Promise<unknown> {
  const state = ctx.sockets.get(slot.credentialId);
  if (!state || state.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Google Flow extension disconnected'));
  const url = String(params.url || '');
  if (!isAllowedFlowUrl(url)) return Promise.reject(new Error('Google Flow URL is not allowed'));
  const requestId = randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ctx.pending.delete(requestId); reject(new Error(`Google Flow request timed out after ${timeout}ms`)); }, timeout);
    ctx.pending.set(requestId, { credentialId: slot.credentialId, url, resolve, reject, timer });
    signal?.addEventListener('abort', () => {
      const pending = ctx.pending.get(requestId);
      if (!pending) return;
      clearTimeout(pending.timer); ctx.pending.delete(requestId); reject(new Error('Cancelled by user'));
    }, { once: true });
    state.socket.send(JSON.stringify({
      type, method: type, protocolVersion: ctx.protocolVersion, requestId, id: requestId,
      sessionSecret: ctx.sessionSecret, extensionInstanceId: slot.extensionInstanceId, credentialId: slot.credentialId, params,
    }));
  });
}

export async function pollOperations(ctx: FlowSocketContext, slot: FlowCredentialSlot, initial: Record<string, unknown>[], taskId: string, lane: Lane, signal: AbortSignal): Promise<unknown> {
  let operations = initial;
  let lastTemporaryError = '';
  for (let attempt = 0; attempt < 84; attempt += 1) {
    await sleep(5_000, signal);
    let response: unknown;
    try {
      response = await ctx.apiRequest(slot, {
        url: ctx.apiUrl('/v1/video:batchCheckAsyncVideoGenerationStatus'), method: 'POST', body: { operations },
      }, 30_000, signal);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // FlowKit treats temporary status-check errors as a pending operation.
      // In particular, Flow may answer 400 before the async operation becomes
      // queryable even though the video submit request was accepted.
      const explicitlyFatal = /INVALID_ARGUMENT|PERMISSION_DENIED|FAILED_PRECONDITION|moderation|safety|quota|credit|model.{0,30}(?:access|unsupported|not available)/i.test(message);
      if (!explicitlyFatal && /HTTP (400|404|409|425|429|500|502|503|504)/i.test(message)) {
        lastTemporaryError = message;
        ctx.emitLaneTask(taskId, 'video', 'polling', slot, lane, Math.min(25 + Math.round(((attempt + 1) / 84) * 68), 93), message);
        continue;
      }
      throw error;
    }
    const parsed = extractFlowOperations(response).map((item) => item.raw);
    if (!parsed.length) continue;
    operations = parsed;
    if (operations.some((item) => operationStatus(item) === 'MEDIA_GENERATION_STATUS_FAILED')) throw new Error('Google Flow video operation failed');
    const progress = Math.min(25 + Math.round(((attempt + 1) / 84) * 68), 93);
    ctx.emitLaneTask(taskId, 'video', 'polling', slot, lane, progress);
    if (operations.every((item) => operationStatus(item) === 'MEDIA_GENERATION_STATUS_SUCCESSFUL')) return { operations };
  }
  throw new Error(`Google Flow video generation timed out${lastTemporaryError ? `. Last status response: ${lastTemporaryError}` : ''}`);
}

/**
 * Reads one workflow's media entry out of Flow's authenticated project snapshot.
 * `/v1/media/<primaryMediaId>` answers INVALID_ARGUMENT for workflow-backed
 * media, so the old poller spent every attempt on a request that could not
 * succeed and only ever finished through the redirect fallback below.
 */
async function fetchWorkflowMedia(
  ctx: FlowSocketContext, slot: FlowCredentialSlot, projectId: string,
  operation: { primaryMediaId?: string; workflowName?: string }, signal: AbortSignal,
): Promise<Record<string, unknown> | undefined> {
  const input = encodeURIComponent(JSON.stringify({ json: { projectId } }));
  const response = await proxyRequest(ctx, slot, 'trpc_request', {
    url: `${ctx.trpcPath}/flow.projectInitialData?input=${input}`,
    method: 'GET', headers: { 'content-type': 'application/json' },
  }, 30_000, signal);
  const envelope = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  const result = (envelope.result && typeof envelope.result === 'object' ? envelope.result : {}) as Record<string, unknown>;
  const resultData = (result.data && typeof result.data === 'object' ? result.data : {}) as Record<string, unknown>;
  const json = (resultData.json && typeof resultData.json === 'object' ? resultData.json : {}) as Record<string, unknown>;
  const contents = (json.projectContents && typeof json.projectContents === 'object' ? json.projectContents : {}) as Record<string, unknown>;
  const media = Array.isArray(contents.media) ? contents.media : [];
  return media
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .find((item) => (operation.primaryMediaId && item.name === operation.primaryMediaId)
      || (operation.workflowName && item.workflowId === operation.workflowName));
}

export async function pollWorkflowVideo(ctx: FlowSocketContext, slot: FlowCredentialSlot, operations: ReturnType<typeof extractFlowOperations>, taskId: string, lane: Lane, signal: AbortSignal, projectId: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 84; attempt += 1) {
    await sleep(5_000, signal);
    for (const operation of operations) {
      if (!operation.primaryMediaId) continue;
      let data: Record<string, unknown> = {};
      try {
        data = (projectId ? await fetchWorkflowMedia(ctx, slot, projectId, operation, signal) : undefined) || {};
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // A snapshot that is not ready yet is a pending state, not a failure.
        if (/HTTP (400|404|409|425|429|500|502|503|504)|Failed to fetch|network|REQUEST_FAILED/i.test(message)) {
          ctx.emitLaneTask(taskId, 'video', 'polling', slot, lane, Math.min(25 + Math.round(((attempt + 1) / 84) * 68), 93), message);
        } else {
          throw error;
        }
      }
      const status = typeof data.status === 'string' ? data.status : '';
      if (/FAILED|FAILURE/i.test(status)) {
        throw new Error(`Google Flow workflow thất bại: ${status}`);
      }
      const video = (data.video && typeof data.video === 'object' ? data.video : {}) as Record<string, unknown>;
      const bytes = decodeVerifiedMp4(video.encodedVideo);
      if (bytes) return bytes;
      const mediaUrl = typeof data.url === 'string' ? data.url : '';
      if (/^https:\/\/flow-content\.google\/video\//i.test(mediaUrl)) {
        return await downloadVideoBytes(mediaUrl, signal);
      }
      try {
        const redirect = await proxyRequest(ctx, slot, 'trpc_request', {
          url: `${ctx.trpcPath}/media.getMediaUrlRedirect?name=${encodeURIComponent(operation.primaryMediaId)}`,
          method: 'GET', headers: { accept: 'video/mp4,*/*' }, responseMode: 'final-url',
        }, 30_000, signal);
        const redirectRecord = (redirect && typeof redirect === 'object' ? redirect : {}) as Record<string, unknown>;
        const finalUrl = typeof redirectRecord.url === 'string' ? redirectRecord.url : '';
        if (/^https:\/\/flow-content\.google\/video\//i.test(finalUrl)) {
          return await downloadVideoBytes(finalUrl, signal);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/HTTP (400|404|409|425|429|500|502|503|504)|Failed to fetch|network|REQUEST_FAILED|TRPC_FETCH_FAILED/i.test(message)) throw error;
      }
    }
    ctx.emitLaneTask(taskId, 'video', 'polling', slot, lane, Math.min(25 + Math.round(((attempt + 1) / 84) * 68), 93));
  }
  throw new Error('Google Flow low-priority video generation timed out');
}

export async function refreshCredits(ctx: FlowSocketContext, slot: FlowCredentialSlot): Promise<void> {
  try {
    const response = await ctx.apiRequest(slot, { url: ctx.apiUrl('/v1/credits'), method: 'GET' }, 15_000);
    const record = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
    const text = JSON.stringify(record);
    const tier = /PAYGATE_TIER_(ONE|TWO)/.exec(text)?.[0];
    const creditsMatch = /"(?:credits|balance|subscriptionCredits)"\s*:\s*(\d+)/i.exec(text);
    if (tier) slot.tier = tier;
    if (creditsMatch) slot.credits = Number(creditsMatch[1]);
    ctx.emitStatus();
  } catch { /* status remains usable without credits */ }
}

