import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { WebSocket, WebSocketServer } from 'ws';
import {
  GOOGLE_FLOW_API_ROOT,
  GOOGLE_FLOW_BROWSER_API_KEY,
  GOOGLE_FLOW_DEFAULT_PORT,
  GOOGLE_FLOW_PROTOCOL_VERSION,
  GOOGLE_FLOW_TRPC_PATHS,
  type FlowCredentialSlot,
  type FlowTaskEvent,
  assertRecord,
  assertString,
  isUuid,
} from './protocol';
import { GOOGLE_FLOW_IMAGE_MODELS, flowImageRatio, flowVideoEndpoint, flowVideoRatio, isOmniFlashRequest, resolveFlowVideoModel } from './models';
import {
  extractFlowMediaId,
  extractFlowOperations,
  extractFlowProjectId,
  extractFlowUrl,
} from './result-parser';
import { normalizeDelayRange, randomBetween, sleep } from '../browser-session/runtime-utils';

import {
  safeMessage,
  type FlowImageInput,
  type FlowMediaRefInput,
  type FlowProjectBindingInfo,
  type FlowVideoInput,
  type GenerationResult,
  type Lane,
  type PendingRequest,
  type ProjectBinding,
  type RuntimeOptions,
  type SocketState,
} from './runtime-types';

export * from './runtime-types';
import {
  createVideoThumbnail,
  downloadVideo,
  readImageSource,
  saveVideoBytes,
  validateImageInput,
  validateVideoInput,
} from './media-io';
import {
  attachSocket,
  pollOperations,
  pollWorkflowVideo,
  proxyRequest,
  refreshCredits,
  runOnLane,
  type FlowSocketContext,
} from './socket-transport';
import { FlowQuotaLockStore, isDailyQuotaError } from './quota-locks';

const UPSCALE_MODEL_KEY = 'veo_3_1_upsampler_4k';

export class GoogleFlowRuntime extends EventEmitter implements FlowSocketContext {
  readonly protocolVersion = GOOGLE_FLOW_PROTOCOL_VERSION;
  readonly port: number;
  private readonly options: RuntimeOptions;
  readonly sessionSecret = randomUUID();
  readonly sockets = new Map<string, SocketState>();
  readonly credentials = new Map<string, FlowCredentialSlot>();
  readonly instanceToCredential = new Map<string, string>();
  readonly pending = new Map<string, PendingRequest>();
  readonly abortControllers = new Map<string, AbortController>();
  private readonly lanes = new Map<string, Lane[]>();
  private readonly bindingsPath: string;
  private readonly mediaCachePath: string;
  readonly quotaLocks: FlowQuotaLockStore;
  private bindings: ProjectBinding[] = [];
  private mediaCache: Record<string, string> = {};
  private server?: WebSocketServer;
  private nextLaneCursor = 0;
  private stopped = false;
  // Which tRPC mount the signed-in Flow app actually serves. Probed on the first
  // project creation and reused after that; see GOOGLE_FLOW_TRPC_PATHS.
  trpcPath: string = GOOGLE_FLOW_TRPC_PATHS[0];
  private imageLanesPerToken = 4;
  private videoLanesPerToken = 4;
  private imageSubmitDelayMinMs = 1_400;
  private imageSubmitDelayMaxMs = 1_600;
  videoSubmitDelayMinMs = 1_500;
  videoSubmitDelayMaxMs = 1_800;
  private accountStartStaggerMinMs = 1_300;
  private accountStartStaggerMaxMs = 1_500;
  private readonly submitGates: Record<'image' | 'video', Promise<void>> = {
    image: Promise.resolve(),
    video: Promise.resolve(),
  };
  private readonly lastSubmitAt: Record<'image' | 'video', number> = { image: 0, video: 0 };
  private readonly lastSubmitCredentialId: Record<'image' | 'video', string> = { image: '', video: '' };

  constructor(options: RuntimeOptions) {
    super();
    this.options = options;
    this.port = options.port ?? GOOGLE_FLOW_DEFAULT_PORT;
    this.bindingsPath = path.join(options.userDataPath, 'google-flow-bindings.json');
    this.mediaCachePath = path.join(options.userDataPath, 'google-flow-media-cache.json');
    this.quotaLocks = new FlowQuotaLockStore(path.join(options.userDataPath, 'google-flow-quota-locks.json'));
    this.loadBindings();
    try { this.mediaCache = JSON.parse(fs.readFileSync(this.mediaCachePath, 'utf8')); } catch { this.mediaCache = {}; }
  }

  start(): void {
    if (this.server) return;
    this.stopped = false;
    this.server = new WebSocketServer({
      host: '127.0.0.1',
      port: this.port,
      maxPayload: 32 * 1024 * 1024,
      verifyClient: ({ origin }) => typeof origin === 'string' && origin.startsWith('chrome-extension://'),
    });
    this.server.on('connection', (socket) => this.attachSocket(socket));
    this.server.on('error', (error) => this.emit('runtime-error', safeMessage(error)));
    this.emitStatus();
  }

  stop(): void {
    this.stopped = true;
    for (const controller of this.abortControllers.values()) controller.abort();
    this.abortControllers.clear();
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error('Google Flow runtime stopped'));
    }
    this.pending.clear();
    for (const { socket } of this.sockets.values()) socket.close(1001, 'Runtime stopped');
    for (const slot of this.credentials.values()) slot.state = 'disconnected';
    this.sockets.clear();
    this.server?.close();
    this.server = undefined;
    this.emitStatus();
  }

  getStatus() {
    const credentials = [...this.credentials.values()].map((slot) => {
      const tokenAgeMs = slot.tokenCapturedAt ? Date.now() - slot.tokenCapturedAt : undefined;
      return ({
      ...slot,
      state: slot.state === 'ready' && tokenAgeMs && tokenAgeMs > 70 * 60_000 ? 'stale' as const : slot.state,
      tokenAgeMs,
      tokenFingerprint: undefined,
      quotaLocks: this.quotaLocks.list(slot.ownerScopeId).map(({ modelKey, until }) => ({ modelKey, until })),
    }); });
    const ready = credentials.filter((item) => item.state === 'ready' && this.sockets.has(item.credentialId)).length;
    return {
      running: Boolean(this.server) && !this.stopped,
      port: this.port,
      protocolVersion: this.protocolVersion,
      readyCredentialCount: ready,
      imageLaneCount: ready * this.imageLanesPerToken,
      videoLaneCount: ready * this.videoLanesPerToken,
      extensionPath: this.options.extensionPath,
      credentials,
    };
  }

  listCredentials() { return this.getStatus().credentials; }

  /**
   * Drops daily-quota locks by hand. The lock expiry is our best guess at
   * Google's reset boundary; if an account frees up sooner the user should not
   * have to wait it out.
   */
  clearQuotaLocks(input?: { credentialId?: string; modelKey?: string }) {
    const ownerScopeId = input?.credentialId
      ? this.credentials.get(input.credentialId)?.ownerScopeId || input.credentialId
      : undefined;
    const cleared = this.quotaLocks.clear(ownerScopeId, input?.modelKey);
    if (cleared) this.emitStatus();
    return { cleared };
  }

  listProjectBindings(longddProjectId: string): FlowProjectBindingInfo[] {
    assertString(longddProjectId, 'longddProjectId', 256);
    return this.bindings
      .filter((binding) => binding.longddProjectId === longddProjectId)
      .map((binding) => {
        const connected = [...this.sockets.values()].find(({ slot }) => slot.ownerScopeId === binding.ownerScopeId);
        return {
          ...binding,
          active: binding.active === true,
          connected: Boolean(connected),
          credentialId: connected?.slot.credentialId,
          extensionInstanceId: connected?.slot.extensionInstanceId,
        };
      })
      .sort((left, right) => Number(right.active) - Number(left.active) || right.createdAt - left.createdAt);
  }

  async createProjectBinding(input: { longddProjectId: string; credentialId: string; title?: string }): Promise<FlowProjectBindingInfo> {
    assertRecord(input, 'create project binding payload');
    assertString(input.longddProjectId, 'longddProjectId', 256);
    assertString(input.credentialId, 'credentialId', 128);
    const state = this.sockets.get(input.credentialId);
    if (!state || state.socket.readyState !== WebSocket.OPEN || state.slot.state !== 'ready') {
      throw new Error('Tiện ích Google Flow đã chọn hiện không sẵn sàng');
    }
    const binding = await this.createFlowProject(input.longddProjectId, state.slot, undefined, input.title);
    return this.toProjectBindingInfo(binding);
  }

  activateProjectBinding(input: { longddProjectId: string; credentialId: string; flowProjectId: string }): FlowProjectBindingInfo {
    assertRecord(input, 'activate project binding payload');
    assertString(input.longddProjectId, 'longddProjectId', 256);
    assertString(input.credentialId, 'credentialId', 128);
    assertString(input.flowProjectId, 'flowProjectId', 128);
    const state = this.sockets.get(input.credentialId);
    if (!state) throw new Error('Tiện ích Google Flow đã chọn không còn kết nối');
    const binding = this.bindings.find((item) => (
      item.longddProjectId === input.longddProjectId
      && item.ownerScopeId === state.slot.ownerScopeId
      && item.flowProjectId === input.flowProjectId
    ));
    if (!binding) throw new Error('Flow project không thuộc dự án và tiện ích đã chọn');
    for (const item of this.bindings) {
      if (item.longddProjectId === input.longddProjectId && item.ownerScopeId === state.slot.ownerScopeId) item.active = item === binding;
    }
    binding.lastCredentialId = state.slot.credentialId;
    binding.lastVerifiedAt = Date.now();
    this.saveBindings();
    return this.toProjectBindingInfo(binding);
  }

  updateSettings(input: {
    imageLanesPerToken?: number;
    videoLanesPerToken?: number;
    imageSubmitDelayMinMs?: number;
    imageSubmitDelayMaxMs?: number;
    videoSubmitDelayMinMs?: number;
    videoSubmitDelayMaxMs?: number;
    accountStartStaggerMinMs?: number;
    accountStartStaggerMaxMs?: number;
  }) {
    const clamp = (value: unknown, fallback: number) => Math.max(1, Math.min(16, Math.round(Number(value) || fallback)));
    const nextImageLanes = clamp(input.imageLanesPerToken, this.imageLanesPerToken);
    const nextVideoLanes = clamp(input.videoLanesPerToken, this.videoLanesPerToken);
    const laneCountsChanged = nextImageLanes !== this.imageLanesPerToken || nextVideoLanes !== this.videoLanesPerToken;
    this.imageLanesPerToken = nextImageLanes;
    this.videoLanesPerToken = nextVideoLanes;
    [this.imageSubmitDelayMinMs, this.imageSubmitDelayMaxMs] = normalizeDelayRange(
      input.imageSubmitDelayMinMs, input.imageSubmitDelayMaxMs,
      this.imageSubmitDelayMinMs, this.imageSubmitDelayMaxMs,
    );
    [this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs] = normalizeDelayRange(
      input.videoSubmitDelayMinMs, input.videoSubmitDelayMaxMs,
      this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs,
    );
    [this.accountStartStaggerMinMs, this.accountStartStaggerMaxMs] = normalizeDelayRange(
      input.accountStartStaggerMinMs, input.accountStartStaggerMaxMs,
      this.accountStartStaggerMinMs, this.accountStartStaggerMaxMs,
    );
    if (laneCountsChanged) this.lanes.clear();
    this.emitStatus();
    return {
      imageLanesPerToken: this.imageLanesPerToken,
      videoLanesPerToken: this.videoLanesPerToken,
      imageSubmitDelayMinMs: this.imageSubmitDelayMinMs,
      imageSubmitDelayMaxMs: this.imageSubmitDelayMaxMs,
      videoSubmitDelayMinMs: this.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: this.videoSubmitDelayMaxMs,
      accountStartStaggerMinMs: this.accountStartStaggerMinMs,
      accountStartStaggerMaxMs: this.accountStartStaggerMaxMs,
    };
  }

  async syncReferences(input: { projectId: string; projectTitle?: string; sources: Array<{
    sourceKey: string;
    source: string;
    mediaIdsByOwnerScope?: Record<string, { mediaId: string; flowProjectId: string }>;
  }> }) {
    assertRecord(input, 'sync references payload');
    assertString(input.projectId, 'projectId', 256);
    if (input.projectTitle !== undefined) assertString(input.projectTitle, 'projectTitle', 80);
    if (!Array.isArray(input.sources) || input.sources.length > 500) throw new Error('Reference sources are invalid');
    const sources = [...new Map(input.sources.map((item) => {
      assertRecord(item, 'reference source');
      assertString(item.sourceKey, 'reference source key', 128);
      assertString(item.source, 'reference source', 40_000_000);
      return [item.sourceKey, item] as const;
    })).values()];
    if (!sources.length) throw new Error('No reference images to sync');

    const ready = [...this.sockets.values()].filter(({ slot, socket }) => (
      slot.state === 'ready'
      && socket.readyState === WebSocket.OPEN
      && (!slot.tokenCapturedAt || Date.now() - slot.tokenCapturedAt <= 70 * 60_000)
    ));
    if (!ready.length) throw new Error('No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.');

    const credentials = await Promise.all(ready.map(async ({ slot }) => {
      let flowProjectId: string | undefined;
      let syncedReferenceCount = 0;
      let uploadedCount = 0;
      let skippedCount = 0;
      const mediaIdsBySource: Record<string, string> = {};
      const activityId = `sync-${randomUUID()}`;
      try {
        const binding = await this.ensureProject(input.projectId, slot, new AbortController().signal, input.projectTitle);
        flowProjectId = binding.flowProjectId;
        this.sendActivityUpdate(slot.credentialId, {
          activityId, kind: 'sync', status: 'uploading', phase: 'checking_media', progress: 0,
          message: `Kiểm tra ${sources.length} ảnh tham chiếu`,
        });
        // Upload the account's missing references with bounded concurrency
        // (= its lane count) instead of one-at-a-time. The old serial loop made
        // sync as slow as a single lane even though each account has several.
        const concurrency = Math.max(1, this.imageLanesPerToken);
        let cursor = 0;
        let completed = 0;
        const runNext = async (): Promise<void> => {
          const index = cursor;
          cursor += 1;
          if (index >= sources.length) return;
          const item = sources[index];
          const existing = item.mediaIdsByOwnerScope?.[slot.ownerScopeId];
          let uploaded = false;
          const mediaId = await this.resolveMedia({
            source: item.source,
            mediaId: existing?.mediaId,
            ownerScopeId: existing ? slot.ownerScopeId : undefined,
            flowProjectId: existing?.flowProjectId,
          }, binding.flowProjectId, slot, new AbortController().signal, () => { uploaded = true; });
          mediaIdsBySource[item.sourceKey] = mediaId;
          syncedReferenceCount += 1;
          if (uploaded) uploadedCount += 1;
          else skippedCount += 1;
          completed += 1;
          this.sendActivityUpdate(slot.credentialId, {
            activityId, kind: 'sync', status: 'uploading', phase: uploaded ? 'uploading_media' : 'checking_media',
            progress: Math.round(completed / sources.length * 100),
            message: `Đã có ${skippedCount} · tải mới ${uploadedCount} · ${completed}/${sources.length}`,
          });
          await runNext();
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => runNext()));
        this.sendActivityUpdate(slot.credentialId, {
          activityId, kind: 'sync', status: 'completed', phase: 'completed', progress: 100,
          message: `Hoàn tất · tải mới ${uploadedCount} · bỏ qua ${skippedCount}`,
        });
        return {
          credentialId: slot.credentialId, ownerScopeId: slot.ownerScopeId, flowProjectId,
          syncedReferenceCount, uploadedCount, skippedCount, mediaIdsBySource,
        };
      } catch (error) {
        this.sendActivityUpdate(slot.credentialId, {
          activityId, kind: 'sync', status: 'failed', phase: 'failed',
          message: safeMessage(error),
        });
        return {
          credentialId: slot.credentialId,
          ownerScopeId: slot.ownerScopeId,
          flowProjectId,
          syncedReferenceCount,
          uploadedCount,
          skippedCount,
          mediaIdsBySource,
          error: safeMessage(error),
        };
      }
    }));

    return {
      credentialCount: ready.length,
      sourceCount: sources.length,
      syncedReferenceCount: credentials.reduce((total, item) => total + item.syncedReferenceCount, 0),
      uploadedCount: credentials.reduce((total, item) => total + item.uploadedCount, 0),
      skippedCount: credentials.reduce((total, item) => total + item.skippedCount, 0),
      credentials,
    };
  }

  cancelTask(taskId: string): boolean {
    const controller = this.abortControllers.get(taskId);
    if (!controller) return false;
    controller.abort();
    this.emitTask({ taskId, kind: 'video', status: 'cancelled', message: 'Cancelled by user' });
    return true;
  }

  async generateImage(input: FlowImageInput): Promise<GenerationResult> {
    validateImageInput(input);
    const taskId = input.taskId || randomUUID();
    // Same key the request below sends as imageModelName, so a daily-quota lock
    // covers exactly the model Google rejected.
    const imageModelName = GOOGLE_FLOW_IMAGE_MODELS[input.model] || input.model || 'GEM_PIX_2';
    return this.runOnLane('image', taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      const hasMediaInput = Boolean(input.baseImage || input.references?.length);
      const reportUpload = () => this.emitLaneTask(taskId, 'image', 'uploading', slot, lane, 20, undefined, 'uploading_media');
      // Try once trusting the media cache; if the submit fails because a cached
      // reference id is stale, re-upload every reference and retry once (the
      // "always upload" fallback, paid only on the rare failure).
      for (let attempt = 0; ; attempt += 1) {
        const forceReupload = attempt > 0;
        if (hasMediaInput) this.emitLaneTask(taskId, 'image', 'uploading', slot, lane, 10, undefined, 'checking_media');
        const baseMediaId = input.baseImage ? await this.resolveMedia(input.baseImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : undefined;
        const referenceIds = await Promise.all((input.references || []).slice(0, 10).map((ref) => this.resolveMedia(ref, binding.flowProjectId, slot, signal, reportUpload, forceReupload)));
        if (hasMediaInput) this.emitLaneTask(taskId, 'image', 'uploading', slot, lane, 30, undefined, 'media_ready');
        await this.reserveSubmitWindow(slot.credentialId, 'image', signal);
        this.emitLaneTask(taskId, 'image', 'submitting', slot, lane, 35);
        const context = this.clientContext(binding.flowProjectId, slot.tier);
        const imageInputs = [
          ...(baseMediaId ? [{ name: baseMediaId, imageInputType: 'IMAGE_INPUT_TYPE_BASE_IMAGE' }] : []),
          ...referenceIds.map((name) => ({ name, imageInputType: 'IMAGE_INPUT_TYPE_REFERENCE' })),
        ];
        const now = Date.now();
        const request: Record<string, unknown> = {
          clientContext: { ...context, sessionId: `;${now}` },
          seed: now % 1_000_000,
          structuredPrompt: { parts: [{ text: input.prompt }] },
          imageAspectRatio: flowImageRatio(input.aspectRatio),
          imageModelName,
        };
        if (imageInputs.length) request.imageInputs = imageInputs;
        const body: Record<string, unknown> = { clientContext: context, requests: [request] };
        if (imageInputs.length) {
          body.mediaGenerationContext = { batchId: randomUUID() };
          body.useNewMedia = true;
        }
        let response: unknown;
        try {
          response = await this.apiRequest(slot, {
            url: this.apiUrl(`/v1/projects/${encodeURIComponent(binding.flowProjectId)}/flowMedia:batchGenerateImages`),
            method: 'POST', body, captchaAction: 'IMAGE_GENERATION', activityId: taskId, activityKind: 'image',
          }, 180_000, signal);
        } catch (error) {
          if (attempt === 0 && hasMediaInput && !signal.aborted && this.isStaleMediaError(error)) continue;
          throw error;
        }
        const mediaId = extractFlowMediaId(response);
        const remoteUrl = extractFlowUrl(response);
        if (!mediaId && !remoteUrl) throw new Error('Google Flow image response contained no media ID or URL');
        this.sendActivityUpdate(slot.credentialId, {
          activityId: taskId, kind: 'image', status: 'completed', progress: 100,
          thumbnailUrl: remoteUrl, outputUrl: remoteUrl, mediaId,
        });
        this.emitLaneTask(taskId, 'image', 'completed', slot, lane, 100);
        return {
          taskId, provider: 'googleflow', credentialId: slot.credentialId, accountId: slot.accountId,
          ownerScopeId: slot.ownerScopeId, flowProjectId: binding.flowProjectId, mediaId, remoteUrl,
        };
      }
    }, () => imageModelName);
  }

  async generateVideo(input: FlowVideoInput): Promise<GenerationResult> {
    validateVideoInput(input);
    const taskId = input.taskId || randomUUID();
    // The mode follows the inputs: the start+end route rejects a body with no
    // endImage, so a lone start image goes to the start-image route for every
    // model, Omni Flash included. Resolved up here because the model key (and
    // therefore the daily-quota lock key) depends on it — the executor below
    // reuses this exact value.
    const mode: 'frame' | 'startEnd' | 'reference' = input.references?.length ? 'reference' : input.endImage ? 'startEnd' : 'frame';
    // The resolved key varies per account: the same request lands on a Fast key
    // for a paid tier and a Lite/low-priority key for a free one, and Google
    // meters each key separately.
    const videoModelKeyFor = (slot: FlowCredentialSlot) => resolveFlowVideoModel(slot.tier, mode, input.aspectRatio, input.model, input.duration);
    return this.runOnLane('video', taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      const reportUpload = () => this.emitLaneTask(taskId, 'video', 'uploading', slot, lane, 12, undefined, 'uploading_media');
      const hasMediaInput = Boolean(input.references?.length || input.startImage || input.endImage);
      // Trust the media cache first; on a stale-media submit failure re-upload
      // every reference/frame and retry once before giving up.
      let submit: unknown;
      for (let attempt = 0; ; attempt += 1) {
        const forceReupload = attempt > 0;
        this.emitLaneTask(taskId, 'video', 'uploading', slot, lane, 8, undefined, 'checking_media');
        const refs = await Promise.all((input.references || []).slice(0, 3).map((ref) => this.resolveMedia(ref, binding.flowProjectId, slot, signal, reportUpload, forceReupload)));
        const startId = input.startImage ? await this.resolveMedia(input.startImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : undefined;
        const endId = input.endImage ? await this.resolveMedia(input.endImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : undefined;
        if (!refs.length && !startId) throw new Error('Google Flow requires a start image or reference images for video generation');
        this.emitLaneTask(taskId, 'video', 'uploading', slot, lane, 18, undefined, 'media_ready');
        const resolvedVideoModel = videoModelKeyFor(slot);
        const endpoint = flowVideoEndpoint(mode);
        console.log('[GoogleFlow] Resolved video model', {
          requestedModel: input.model,
          resolvedVideoModel,
          mode,
          endpoint,
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          accountTier: slot.tier,
        });
        const isOmniFlash = isOmniFlashRequest(input.model);
        const request: Record<string, unknown> = {
          aspectRatio: flowVideoRatio(input.aspectRatio),
          seed: Math.floor(Date.now() / 1000) % 10_000,
          textInput: { structuredPrompt: { parts: [{ text: input.prompt }] } },
          videoModelKey: resolvedVideoModel,
          metadata: { sceneId: input.sceneId },
        };
        // Flow always sends an output spec for Omni Flash. Veo has worked
        // without one for a long time, so it keeps the leaner body.
        if (isOmniFlash) request.outputSpec = { resolution: 'VIDEO_RESOLUTION_720P' };
        if (refs.length) request.referenceImages = refs.map((mediaId) => ({ mediaId, imageUsageType: 'IMAGE_USAGE_TYPE_ASSET' }));
        else request.startImage = { mediaId: startId };
        if (endId) request.endImage = { mediaId: endId };
        await this.reserveSubmitWindow(slot.credentialId, 'video', signal);
        this.emitLaneTask(taskId, 'video', 'submitting', slot, lane, 20);
        try {
          submit = await this.apiRequest(slot, {
            url: this.apiUrl(endpoint), method: 'POST', captchaAction: 'VIDEO_GENERATION', activityId: taskId, activityKind: 'video',
            body: {
              mediaGenerationContext: isOmniFlash
                ? { batchId: randomUUID(), audioFailurePreference: 'BLOCK_SILENCED_VIDEOS' }
                : { batchId: randomUUID() },
              clientContext: this.clientContext(binding.flowProjectId, slot.tier),
              requests: [request], useV2ModelConfig: true,
            },
          }, 90_000, signal);
        } catch (error) {
          if (attempt === 0 && hasMediaInput && !signal.aborted && this.isStaleMediaError(error)) continue;
          throw error;
        }
        break;
      }
      const operations = extractFlowOperations(submit);
      if (!operations.length) throw new Error('Google Flow video response contained no operation');
      this.emitLaneTask(taskId, 'video', 'polling', slot, lane, 25);
      const result = operations.every((item) => item.workflowMode)
        ? await this.pollWorkflowVideo(slot, operations, taskId, lane, signal, binding.flowProjectId)
        : await this.pollOperations(slot, operations.map((item) => item.raw), taskId, lane, signal);
      const mediaId = extractFlowMediaId(result);
      let remoteUrl = extractFlowUrl(result);
      let localUrl: string | undefined;
      if (Buffer.isBuffer(result)) {
        localUrl = saveVideoBytes(this.options.mediaRoot, result, mediaId || randomUUID());
      } else if (remoteUrl) {
        this.emitLaneTask(taskId, 'video', 'downloading', slot, lane, 96);
        localUrl = await downloadVideo(this.options.mediaRoot, remoteUrl, mediaId || randomUUID(), signal);
      }
      if (!localUrl && !remoteUrl) throw new Error('Google Flow video completed without a usable result');
      const thumbnailUrl = localUrl ? await createVideoThumbnail(this.options.mediaRoot, localUrl, taskId) : undefined;
      this.sendActivityUpdate(slot.credentialId, {
        activityId: taskId, kind: 'video', status: 'completed', progress: 100,
        thumbnailUrl, outputUrl: remoteUrl, mediaId,
      });
      this.emitLaneTask(taskId, 'video', 'completed', slot, lane, 100);
      return {
        taskId, provider: 'googleflow', credentialId: slot.credentialId, accountId: slot.accountId,
        ownerScopeId: slot.ownerScopeId, flowProjectId: binding.flowProjectId, mediaId, remoteUrl, localUrl,
      };
    }, videoModelKeyFor);
  }

  async upscaleVideo(input: { taskId?: string; projectId: string; sceneId: string; mediaId: string; aspectRatio: string; preferredCredentialId?: string }): Promise<GenerationResult> {
    if (!isUuid(input.mediaId)) throw new Error('A UUID video media ID is required for upscale');
    const taskId = input.taskId || randomUUID();
    return this.runOnLane('video', taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      this.emitLaneTask(taskId, 'video', 'submitting', slot, lane, 10);
      await this.reserveSubmitWindow(slot.credentialId, 'video', signal);
      const submit = await this.apiRequest(slot, {
        url: this.apiUrl('/v1/video:batchAsyncGenerateVideoUpsampleVideo'), method: 'POST', captchaAction: 'VIDEO_GENERATION',
        activityId: taskId, activityKind: 'upscale',
        body: {
          clientContext: this.clientContext(binding.flowProjectId, slot.tier),
          requests: [{
            aspectRatio: flowVideoRatio(input.aspectRatio), resolution: 'VIDEO_RESOLUTION_4K', seed: Date.now() % 100_000,
            metadata: { sceneId: input.sceneId }, videoInput: { mediaId: input.mediaId }, videoModelKey: UPSCALE_MODEL_KEY,
          }],
        },
      }, 90_000, signal);
      const operations = extractFlowOperations(submit);
      if (!operations.length) throw new Error('Google Flow upscale response contained no operation');
      const result = operations.every((item) => item.workflowMode)
        ? await this.pollWorkflowVideo(slot, operations, taskId, lane, signal, binding.flowProjectId)
        : await this.pollOperations(slot, operations.map((item) => item.raw), taskId, lane, signal);
      const mediaId = extractFlowMediaId(result) || input.mediaId;
      const remoteUrl = extractFlowUrl(result);
      const localUrl = Buffer.isBuffer(result)
        ? saveVideoBytes(this.options.mediaRoot, result, mediaId)
        : remoteUrl ? await downloadVideo(this.options.mediaRoot, remoteUrl, mediaId, signal) : undefined;
      if (!localUrl && !remoteUrl) throw new Error('Google Flow upscale completed without a usable result');
      const thumbnailUrl = localUrl ? await createVideoThumbnail(this.options.mediaRoot, localUrl, taskId) : undefined;
      this.sendActivityUpdate(slot.credentialId, {
        activityId: taskId, kind: 'upscale', status: 'completed', progress: 100,
        thumbnailUrl, outputUrl: remoteUrl, mediaId,
      });
      this.emitLaneTask(taskId, 'video', 'completed', slot, lane, 100);
      return {
        taskId, provider: 'googleflow', credentialId: slot.credentialId, accountId: slot.accountId,
        ownerScopeId: slot.ownerScopeId, flowProjectId: binding.flowProjectId, mediaId, remoteUrl, localUrl,
      };
    }, () => UPSCALE_MODEL_KEY);
  }

  // Entry point for the in-app CDP-driven Chrome login transport (see
  // browser-session/fake-socket.ts). Accepts anything duck-typed like a
  // `ws` WebSocket — attachSocket() only ever touches readyState/send/close
  // and the 'message'/'close' events, so this needs no changes below.
  registerInAppConnection(socket: WebSocket): void {
    this.attachSocket(socket);
  }

  // Removing an in-app account should make it disappear from getStatus()
  // entirely, not just go 'disconnected' — attachSocket()'s close handler
  // only drops the live socket, since the extension flow never needed a way
  // to permanently forget a credential (users don't "uninstall" a browser tab).
  forgetInAppCredential(extensionInstanceId: string): void {
    const credentialId = this.instanceToCredential.get(extensionInstanceId);
    if (!credentialId) return;
    const state = this.sockets.get(credentialId);
    state?.socket.close(4000, 'Account removed');
    this.sockets.delete(credentialId);
    this.credentials.delete(credentialId);
    this.instanceToCredential.delete(extensionInstanceId);
    this.emitStatus();
  }

  private get socketContext(): FlowSocketContext {
    return this;
  }

  private attachSocket(socket: WebSocket): void {
    attachSocket(this.socketContext, socket);
  }

  /**
   * Runs a generation, failing over to another account when Google answers
   * PUBLIC_ERROR_PER_MODEL_DAILY_QUOTA_REACHED. The account that hit the wall is
   * locked for that one model until the next daily reset (other models on it
   * stay in rotation), then the same task is re-queued on the next account whose
   * lock list does not already cover this model.
   */
  private async runOnLane<T>(kind: 'image' | 'video', taskId: string, preferredCredentialId: string | undefined,
    executor: (slot: FlowCredentialSlot, lane: Lane, signal: AbortSignal) => Promise<T>,
    modelKeyFor: (slot: FlowCredentialSlot) => string): Promise<T> {
    const exhausted = new Set<string>();
    let lastAttempt: { slot: FlowCredentialSlot; lane: Lane } | undefined;
    let queuedMessage: string | undefined;
    for (;;) {
      let lane: Lane;
      try {
        lane = this.selectLane(kind, preferredCredentialId, { modelKeyFor, exclude: exhausted });
      } catch (error) {
        // On the first pass nothing was queued yet, so the thrown error is the
        // caller's whole story. After a failover the UI already shows this task
        // sitting on a lane — mark it failed now that no account is left.
        if (lastAttempt) this.emitLaneTask(taskId, kind, 'failed', lastAttempt.slot, lastAttempt.lane, undefined, safeMessage(error));
        throw error;
      }
      const slot = this.sockets.get(lane.credentialId)?.slot;
      if (!slot) throw new Error('No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.');
      lastAttempt = { slot, lane };
      try {
        // A batch fills every lane up front, so when one account hits its daily
        // wall there are already jobs sitting in that account's queue. Re-check
        // the lock at the head of the queue instead of at lane-selection time:
        // otherwise each of those jobs spends a real request to be told the same
        // thing Google just told us. Throwing Google's own reason keeps this on
        // the failover path below.
        return await runOnLane(this.socketContext, kind, taskId, lane, (laneSlot, currentLane, signal) => {
          const modelKey = modelKeyFor(laneSlot);
          if (this.quotaLocks.isLocked(laneSlot.ownerScopeId, modelKey)) {
            throw new Error(`Google Flow PER_MODEL_DAILY_QUOTA_REACHED (${modelKey}) trên tài khoản ${laneSlot.extensionInstanceId.slice(0, 8)}`);
          }
          return executor(laneSlot, currentLane, signal);
        }, isDailyQuotaError, queuedMessage);
      } catch (error) {
        if (!isDailyQuotaError(error)) throw error;
        const modelKey = modelKeyFor(slot);
        // Only the first job through the wall records the lock. The rest of that
        // account's in-flight batch lands here too, and re-locking each time
        // would just repeat the same line dozens of times in the log.
        if (!this.quotaLocks.isLocked(slot.ownerScopeId, modelKey)) {
          const lock = this.quotaLocks.lock(slot.ownerScopeId, slot.credentialId, modelKey);
          console.log('[GoogleFlow] Daily quota reached, locking account for this model', {
            account: slot.extensionInstanceId, credentialId: slot.credentialId,
            modelKey, until: new Date(lock.until).toISOString(),
          });
          this.emitStatus();
        }
        // The lane group stays put: it is keyed per kind+account, not per model,
        // so other models still generating on this account keep their queue
        // depth and chaining. selectLane's lock filter is what keeps this model
        // off these lanes.
        exhausted.add(lane.credentialId);
        queuedMessage = `Tài khoản ${slot.extensionInstanceId.slice(0, 8)} hết hạn mức ngày cho ${modelKey} — đã chuyển sang tài khoản khác`;
      }
    }
  }
  selectLane(kind: 'image' | 'video', preferredCredentialId?: string,
    options?: { modelKeyFor?: (slot: FlowCredentialSlot) => string; exclude?: ReadonlySet<string> }): Lane {
    const connected = [...this.sockets.values()].filter(({ slot, socket }) => (
      slot.state === 'ready'
      && socket.readyState === WebSocket.OPEN
      && (!slot.tokenCapturedAt || Date.now() - slot.tokenCapturedAt <= 70 * 60_000)
    ));
    if (!connected.length) throw new Error('No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.');
    const modelKeyFor = options?.modelKeyFor;
    const ready = connected.filter(({ slot }) => (
      !options?.exclude?.has(slot.credentialId)
      && !(modelKeyFor && this.quotaLocks.isLocked(slot.ownerScopeId, modelKeyFor(slot)))
    ));
    if (!ready.length) {
      // Every connected account is out of daily quota for this exact model.
      // Name the model and the reset time so the failure is actionable instead
      // of looking like a generic "no extension" problem.
      const modelKey = modelKeyFor ? modelKeyFor(connected[0].slot) : '';
      const until = Math.min(...connected.map(({ slot }) => this.quotaLocks.lockedUntil(slot.ownerScopeId, modelKeyFor ? modelKeyFor(slot) : '') || Infinity));
      const resetAt = Number.isFinite(until) ? new Date(until).toLocaleString('vi-VN') : '';
      throw new Error(`Mọi tài khoản Google Flow đã hết hạn mức ngày cho model ${modelKey || 'này'}${resetAt ? ` (mở lại khoảng ${resetAt})` : ''}. Hãy đổi model hoặc thêm tài khoản.`);
    }
    const preferred = preferredCredentialId ? ready.filter(({ slot }) => slot.credentialId === preferredCredentialId) : [];
    // A stored credential id can become stale after an extension reinstall. In
    // that case use another ready account; resolveMedia will reject cross-owner
    // media ids and transparently upload the source image for the new account.
    const eligible = preferred.length ? preferred : ready;
    const all: Lane[] = [];
    for (const { slot } of eligible) {
      const key = `${kind}:${slot.credentialId}`;
      let lanes = this.lanes.get(key);
      const count = kind === 'image' ? this.imageLanesPerToken : this.videoLanesPerToken;
      if (!lanes || lanes.length !== count) {
        lanes = Array.from({ length: count }, (_, index) => ({ credentialId: slot.credentialId, slot: index + 1, kind, queued: 0, chain: Promise.resolve() }));
        this.lanes.set(key, lanes);
      }
      all.push(...lanes);
    }
    const ordered = [...all.slice(this.nextLaneCursor % all.length), ...all.slice(0, this.nextLaneCursor % all.length)];
    const selected = ordered.reduce((best, current) => current.queued < best.queued ? current : best, ordered[0]);
    this.nextLaneCursor = (all.indexOf(selected) + 1) % all.length;
    return selected;
  }

  private async ensureProject(longddProjectId: string, slot: FlowCredentialSlot, signal: AbortSignal, requestedTitle?: string): Promise<ProjectBinding> {
    const existing = this.bindings.find((item) => item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId && item.active === true)
      || this.bindings.find((item) => item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId);
    if (existing) { existing.lastCredentialId = slot.credentialId; existing.lastVerifiedAt = Date.now(); this.saveBindings(); return existing; }
    return this.createFlowProject(longddProjectId, slot, signal, requestedTitle);
  }

  private async createFlowProject(longddProjectId: string, slot: FlowCredentialSlot, signal?: AbortSignal, requestedTitle?: string): Promise<ProjectBinding> {
    const cleanTitle = requestedTitle?.replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, 80);
    const projectTitle = cleanTitle || `LONGDD ${longddProjectId}`;
    // Try each known tRPC mount until one answers with a real project. A path the
    // app does not serve returns its HTML shell (or a 404 page), never a project
    // id, so a wrong guess costs one request and creates nothing. The winner is
    // remembered so later projects go straight to it.
    const paths = this.trpcPath ? [this.trpcPath, ...GOOGLE_FLOW_TRPC_PATHS.filter((path) => path !== this.trpcPath)] : [...GOOGLE_FLOW_TRPC_PATHS];
    let flowProjectId: string | undefined;
    let lastError: unknown;
    for (const path of paths) {
      let response: unknown;
      try {
        response = await this.proxyRequest(slot, 'trpc_request', {
          url: `${path}/project.createProject`, method: 'POST',
          headers: { 'content-type': 'application/json', accept: '*/*' },
          body: { json: { projectTitle, toolName: 'PINHOLE' } },
        }, 30_000, signal);
      } catch (error) {
        lastError = error;
        continue;
      }
      flowProjectId = extractFlowProjectId(response);
      if (flowProjectId) { this.trpcPath = path; break; }
      lastError = response;
    }
    if (!flowProjectId) {
      const detail = lastError instanceof Error ? `: ${lastError.message}` : '';
      throw new Error(`Google Flow không trả về project ID (đã thử ${paths.join(', ')})${detail}`);
    }
    for (const item of this.bindings) {
      if (item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId) item.active = false;
    }
    const binding: ProjectBinding = {
      longddProjectId, flowProjectId, ownerScopeId: slot.ownerScopeId, accountId: slot.accountId,
      lastCredentialId: slot.credentialId, createdAt: Date.now(), lastVerifiedAt: Date.now(), title: projectTitle, active: true,
    };
    this.bindings.push(binding); this.saveBindings(); return binding;
  }

  private toProjectBindingInfo(binding: ProjectBinding): FlowProjectBindingInfo {
    const connected = [...this.sockets.values()].find(({ slot }) => slot.ownerScopeId === binding.ownerScopeId);
    return {
      ...binding,
      active: binding.active === true,
      connected: Boolean(connected),
      credentialId: connected?.slot.credentialId,
      extensionInstanceId: connected?.slot.extensionInstanceId,
    };
  }

  private async resolveMedia(ref: FlowMediaRefInput, flowProjectId: string, slot: FlowCredentialSlot, signal: AbortSignal, onUpload?: () => void, forceReupload = false): Promise<string> {
    const sameOwner = Boolean(ref.ownerScopeId) && ref.ownerScopeId === slot.ownerScopeId;
    const sameProject = Boolean(ref.flowProjectId) && ref.flowProjectId === flowProjectId;
    const fingerprint = createHash('sha256').update(`${slot.ownerScopeId}\0${flowProjectId}\0${ref.source}`).digest('hex');
    if (forceReupload) {
      // Self-heal path: a previous generate attempt failed with a stale-media
      // error, so drop whatever this fingerprint pointed at and upload fresh.
      // Skipping both trust branches below guarantees we do not hand the same
      // dead media id back to the retry.
      if (this.mediaCache[fingerprint]) {
        delete this.mediaCache[fingerprint];
        try { fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), 'utf8'); } catch { /* best-effort */ }
      }
    } else if (ref.mediaId && isUuid(ref.mediaId) && sameOwner && sameProject) {
      // Trust the per-account media id recorded when this image was generated
      // (or previously synced) for this same account + project. Skipping the
      // /v1/media verification GET removes one round-trip per (image × account),
      // so a sync only uploads the images an account is genuinely missing.
      //
      // Also index it under the source fingerprint. Later resolves that only
      // know the source (the Director tab passes references as plain sources,
      // not per-account media ids) then hit this cache and reuse it for the
      // same account + project instead of re-uploading — which is what makes
      // pressing "Đồng bộ" actually skip uploads during shot generation.
      if (this.mediaCache[fingerprint] !== ref.mediaId) {
        this.mediaCache[fingerprint] = ref.mediaId;
        try { fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), 'utf8'); } catch { /* best-effort */ }
      }
      return ref.mediaId;
    }
    const cached = forceReupload ? undefined : this.mediaCache[fingerprint];
    if (isUuid(cached)) {
      // Trust a fingerprint cache hit directly, the same way the ref.mediaId
      // fast-path above does. The fingerprint already pins ownerScopeId +
      // flowProjectId + source, so a hit means this exact account+project has
      // uploaded this exact image before. We deliberately do NOT verify it with
      // a GET /v1/media/{id} first: that endpoint returns 400 INVALID_ARGUMENT
      // for uploaded reference-image media (it only serves generated media),
      // so verifying turned every cache hit into a forced re-upload — the exact
      // waste the cache exists to avoid. If a cached id is ever genuinely stale
      // the downstream generate call surfaces it; that's cheaper than
      // re-uploading every reference on every shot.
      return cached;
    }
    onUpload?.();
    const { base64, mimeType, fileName } = await readImageSource(this.options.mediaRoot, ref.source, signal);
    const response = await this.apiRequest(slot, {
      url: this.apiUrl('/v1/flow/uploadImage'), method: 'POST',
      body: { clientContext: { projectId: flowProjectId, tool: 'PINHOLE' }, fileName, imageBytes: base64, isHidden: false, isUserUploaded: true, mimeType },
    }, 90_000, signal);
    const mediaId = extractFlowMediaId(response);
    if (!mediaId) throw new Error('Google Flow upload did not return a UUID media ID');
    this.mediaCache[fingerprint] = mediaId;
    fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), 'utf8');
    return mediaId;
  }

  // A generate submit that references a cached media id can fail if that id has
  // gone stale server-side (the trusted cache is wrong). In practice that
  // surfaces as 400 INVALID_ARGUMENT, so that is the only signature we retry on.
  // We deliberately exclude 404 NOT_FOUND: on the video endpoints that means the
  // selected model key is not available for the account tier (e.g. Veo Fast/Lite
  // on a free account), which re-uploading cannot fix. Quota, safety, captcha and
  // auth errors are excluded for the same reason — retrying would only waste a
  // second, credit-charged generation.
  private isStaleMediaError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    if (/quota|credit|429|RESOURCE_EXHAUSTED|safety|moderation|blocked|captcha|permission|PERMISSION_DENIED|UNAUTHENTICATED|401|403|404|NOT_FOUND/i.test(message)) return false;
    return /HTTP 400|INVALID_ARGUMENT/i.test(message);
  }

  private async reserveSubmitWindow(credentialId: string, kind: 'image' | 'video', signal: AbortSignal) {
    const previousGate = this.submitGates[kind];
    let releaseGate = () => {};
    this.submitGates[kind] = new Promise<void>((resolve) => { releaseGate = resolve; });
    await previousGate;
    try {
      const [submitMinMs, submitMaxMs] = kind === 'image'
        ? [this.imageSubmitDelayMinMs, this.imageSubmitDelayMaxMs]
        : [this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs];
      const hasPreviousSubmit = this.lastSubmitAt[kind] > 0;
      const switchedAccount = Boolean(
        this.lastSubmitCredentialId[kind]
        && this.lastSubmitCredentialId[kind] !== credentialId,
      );
      const submitDelayMs = hasPreviousSubmit ? randomBetween(submitMinMs, submitMaxMs) : 0;
      const accountDelayMs = switchedAccount
        ? randomBetween(this.accountStartStaggerMinMs, this.accountStartStaggerMaxMs)
        : 0;
      const allowedAt = this.lastSubmitAt[kind] + Math.max(submitDelayMs, accountDelayMs);
      if (allowedAt > Date.now()) await sleep(allowedAt - Date.now(), signal);
      this.lastSubmitAt[kind] = Date.now();
      this.lastSubmitCredentialId[kind] = credentialId;
    } finally {
      releaseGate();
    }
  }

  apiRequest(slot: FlowCredentialSlot, params: Record<string, unknown>, timeout: number, signal?: AbortSignal) {
    return this.proxyRequest(slot, 'api_request', { headers: { 'content-type': 'application/json', accept: '*/*' }, ...params }, timeout, signal);
  }

  private proxyRequest(slot: FlowCredentialSlot, type: 'api_request' | 'trpc_request', params: Record<string, unknown>, timeout: number, signal?: AbortSignal): Promise<unknown> {
    return proxyRequest(this.socketContext, slot, type, params, timeout, signal);
  }

  private pollOperations(slot: FlowCredentialSlot, initial: Record<string, unknown>[], taskId: string, lane: Lane, signal: AbortSignal): Promise<unknown> {
    return pollOperations(this.socketContext, slot, initial, taskId, lane, signal);
  }

  private pollWorkflowVideo(slot: FlowCredentialSlot, operations: ReturnType<typeof extractFlowOperations>, taskId: string, lane: Lane, signal: AbortSignal, projectId: string): Promise<Buffer> {
    return pollWorkflowVideo(this.socketContext, slot, operations, taskId, lane, signal, projectId);
  }

  refreshCredits(slot: FlowCredentialSlot): Promise<void> {
    return refreshCredits(this.socketContext, slot);
  }
  private clientContext(projectId: string, tier?: string) {
    return {
      projectId, recaptchaContext: { applicationType: 'RECAPTCHA_APPLICATION_TYPE_WEB', token: '' },
      sessionId: `;${Date.now()}`, tool: 'PINHOLE', userPaygateTier: tier || 'PAYGATE_TIER_TWO',
    };
  }

  private currentApiKey: string = GOOGLE_FLOW_BROWSER_API_KEY;

  getCurrentApiKey(): string {
    return this.currentApiKey;
  }

  updateApiKey(key: string): void {
    if (key && typeof key === 'string' && key.startsWith('AIzaSy') && key !== this.currentApiKey) {
      console.log(`[video-studio][google-flow] API key updated to ${key}`);
      this.currentApiKey = key;
    }
  }

  apiUrl(endpoint: string, extra = ''): string {
    return `${GOOGLE_FLOW_API_ROOT}${endpoint}?key=${this.currentApiKey}${extra}`;
  }

  emitLaneTask(taskId: string, kind: 'image' | 'video', status: FlowTaskEvent['status'], slot: FlowCredentialSlot, lane: Lane, progress?: number, message?: string, phase?: FlowTaskEvent['phase']) {
    this.emitTask({ taskId, kind, status, progress, credentialId: slot.credentialId, extensionInstanceId: slot.extensionInstanceId, laneSlot: lane.slot, totalLanes: this.getStatus()[kind === 'image' ? 'imageLaneCount' : 'videoLaneCount'], submittedAt: status === 'submitting' ? Date.now() : undefined, message, phase });
    this.sendActivityUpdate(slot.credentialId, { activityId: taskId, kind, status, progress, message, phase });
  }

  private sendActivityUpdate(credentialId: string, update: Record<string, unknown>): void {
    const state = this.sockets.get(credentialId);
    if (!state || state.socket.readyState !== WebSocket.OPEN) return;
    try { state.socket.send(JSON.stringify({ type: 'generation_update', ...update })); } catch { /* UI update is best-effort */ }
  }

  private emitTask(event: FlowTaskEvent) { this.emit('task', event); }
  emitStatus() { this.emit('status', this.getStatus()); }
  hashIdentity(value: string): string { return createHash('sha256').update(value).digest('hex').slice(0, 24); }
  private loadBindings() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.bindingsPath, 'utf8')) as ProjectBinding[];
      this.bindings = Array.isArray(parsed) ? parsed : [];
      const groups = new Map<string, ProjectBinding[]>();
      for (const binding of this.bindings) {
        const key = `${binding.longddProjectId}\0${binding.ownerScopeId}`;
        const group = groups.get(key) || [];
        group.push(binding);
        groups.set(key, group);
      }
      for (const group of groups.values()) {
        const selected = group.find((binding) => binding.active === true) || group[0];
        for (const binding of group) binding.active = binding === selected;
      }
    } catch { this.bindings = []; }
  }
  private saveBindings() { fs.mkdirSync(path.dirname(this.bindingsPath), { recursive: true }); fs.writeFileSync(this.bindingsPath, JSON.stringify(this.bindings, null, 2), 'utf8'); }
}
