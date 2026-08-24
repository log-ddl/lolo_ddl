"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const node_events = require("node:events");
const ws = require("ws");
const protocol = require("./protocol-DX51u8o5.cjs");
const runtimeUtils = require("./runtime-utils-CnaWxr36.cjs");
function safeMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/anti[- ]?bot|x-statsig|captcha/i.test(message)) return `ANTIBOT: ${message}`;
  if (/401|403|sign|login|session/i.test(message)) return `SESSION: ${message}`;
  if (/429|quota|limit/i.test(message)) return `QUOTA: ${message}`;
  if (/moderated|moderation|safety/i.test(message)) return `MODERATION: ${message}`;
  return message;
}
function isQuotaExhaustionError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /HTTP 429|HTTP 402|quota|rate.?limit|usage.?limit|limit.{0,30}(?:reached|exceeded|exhausted)|(?:reached|exceeded|exhausted).{0,30}limit|no.{0,20}(?:video )?(?:generations?|credits?) left|insufficient.{0,20}credits?|run.{0,10}out of credits?/i.test(message);
}
class GrokVideoRuntime extends node_events.EventEmitter {
  protocolVersion = protocol.GROK_PROTOCOL_VERSION;
  port;
  options;
  server;
  stopped = false;
  connections = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Map();
  taskToRequest = /* @__PURE__ */ new Map();
  browserDownloads = /* @__PURE__ */ new Map();
  // Tasks cancelled while still queued (before they acquired a lane / got a
  // requestId). generateVideoOnLane consults this so a queued shot never
  // submits after the user pressed Stop.
  cancelledTaskIds = /* @__PURE__ */ new Set();
  videoLanes = /* @__PURE__ */ new Map();
  videoLanesPerExtension = 1;
  videoSubmitDelayMinMs = 1500;
  videoSubmitDelayMaxMs = 1800;
  extensionStartStaggerMinMs = 1300;
  extensionStartStaggerMaxMs = 1500;
  submissionGate = Promise.resolve();
  lastSubmitAt = 0;
  lastSubmitCredentialId = "";
  nextLaneCursor = 0;
  quotaRefreshWaiters = /* @__PURE__ */ new Map();
  constructor(options) {
    super();
    this.options = options;
    this.port = options.port ?? protocol.GROK_DEFAULT_PORT;
  }
  start() {
    if (this.server) return;
    this.stopped = false;
    this.server = new ws.WebSocketServer({
      host: "127.0.0.1",
      port: this.port,
      // Reference images travel as base64 so the signed-in Grok tab can upload
      // them. Leave room for the roughly 33% base64 expansion.
      maxPayload: 40 * 1024 * 1024,
      verifyClient: ({ origin }) => typeof origin === "string" && origin.startsWith("chrome-extension://")
    });
    this.server.on("connection", (socket) => this.attachSocket(socket));
    this.server.on("error", (error) => this.emit("runtime-error", safeMessage(error)));
    this.emitStatus();
  }
  stop() {
    this.stopped = true;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error("Grok runtime stopped"));
    }
    this.pending.clear();
    this.taskToRequest.clear();
    this.browserDownloads.clear();
    for (const item of this.connections.values()) item.socket.close(1001, "Runtime stopped");
    this.connections.clear();
    this.server?.close();
    this.server = void 0;
    this.emitStatus();
  }
  getStatus() {
    const credentials = [...this.connections.values()].map((connection) => ({
      credentialId: connection.credentialId,
      extensionInstanceId: connection.extensionInstanceId,
      state: connection.socket.readyState !== ws.WebSocket.OPEN ? "disconnected" : !connection.grokReady ? "stale" : !connection.quotaSeen ? "checking" : connection.videoAvailable ? "ready" : "exhausted",
      videoAvailable: connection.quotaSeen ? connection.videoAvailable === true : void 0,
      weeklyUsagePercent: connection.weeklyUsagePercent,
      quotaCheckedAt: connection.quotaCheckedAt,
      pageUrl: connection.pageUrl
    }));
    const ready = credentials.filter((item) => item.state === "ready").length;
    return {
      running: Boolean(this.server) && !this.stopped,
      port: this.port,
      protocolVersion: this.protocolVersion,
      readyCredentialCount: ready,
      videoLaneCount: ready * this.videoLanesPerExtension,
      videoLanesPerExtension: this.videoLanesPerExtension,
      extensionPath: this.options.extensionPath,
      credentials
    };
  }
  async refreshQuotaStatus() {
    const credentialIds = [...this.connections.values()].filter((connection) => connection.socket.readyState === ws.WebSocket.OPEN && connection.grokReady).map((connection) => connection.credentialId);
    await Promise.all(credentialIds.map((credentialId) => this.requestFreshQuotaStatus(credentialId)));
    return this.getStatus();
  }
  updateSettings(input) {
    const next = Math.max(1, Math.min(16, Math.round(Number(input.videoLanesPerExtension) || this.videoLanesPerExtension)));
    if (next !== this.videoLanesPerExtension) {
      this.videoLanesPerExtension = next;
      this.videoLanes.clear();
    }
    [this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs] = runtimeUtils.normalizeDelayRange(
      input.videoSubmitDelayMinMs,
      input.videoSubmitDelayMaxMs,
      this.videoSubmitDelayMinMs,
      this.videoSubmitDelayMaxMs
    );
    [this.extensionStartStaggerMinMs, this.extensionStartStaggerMaxMs] = runtimeUtils.normalizeDelayRange(
      input.extensionStartStaggerMinMs,
      input.extensionStartStaggerMaxMs,
      this.extensionStartStaggerMinMs,
      this.extensionStartStaggerMaxMs
    );
    this.emitStatus();
    return {
      videoLanesPerExtension: this.videoLanesPerExtension,
      videoSubmitDelayMinMs: this.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: this.videoSubmitDelayMaxMs,
      extensionStartStaggerMinMs: this.extensionStartStaggerMinMs,
      extensionStartStaggerMaxMs: this.extensionStartStaggerMaxMs
    };
  }
  async generateVideo(input) {
    this.validateVideoInput(input);
    const taskId = input.taskId || crypto.randomUUID();
    const attemptedCredentialIds = /* @__PURE__ */ new Set();
    while (true) {
      const lane = this.selectVideoLane(attemptedCredentialIds);
      try {
        return await this.generateVideoOnLane(input, taskId, lane);
      } catch (error) {
        const connection = this.connections.get(lane.credentialId);
        let quotaExhausted = connection?.videoAvailable === false || isQuotaExhaustionError(error);
        if (!quotaExhausted && connection) {
          await this.requestFreshQuotaStatus(connection.credentialId);
          quotaExhausted = connection.videoAvailable === false;
        }
        if (!quotaExhausted) throw error;
        this.markQuotaExhausted(lane.credentialId);
        attemptedCredentialIds.add(lane.credentialId);
      }
    }
  }
  // Sends a refresh-quota command to the given credential's page connection
  // and waits (briefly, best-effort) for a fresh grok_quota_status update to
  // land before returning. Never throws — a timeout just means the caller
  // falls back to whatever connection.videoAvailable already holds.
  requestFreshQuotaStatus(credentialId, timeoutMs = 4e3) {
    const connection = this.connections.get(credentialId);
    if (!connection || connection.socket.readyState !== ws.WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(), timeoutMs);
      const waiters = this.quotaRefreshWaiters.get(credentialId) || [];
      waiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
      this.quotaRefreshWaiters.set(credentialId, waiters);
      try {
        connection.socket.send(JSON.stringify({ type: "grok_refresh_quota" }));
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });
  }
  resolveQuotaWaiters(credentialId) {
    const waiters = this.quotaRefreshWaiters.get(credentialId);
    if (!waiters) return;
    this.quotaRefreshWaiters.delete(credentialId);
    for (const resolve of waiters) resolve();
  }
  async generateVideoOnLane(input, taskId, lane) {
    lane.queued += 1;
    const previous = lane.chain;
    let releaseLane = () => {
    };
    lane.chain = new Promise((resolve) => {
      releaseLane = resolve;
    });
    await previous.catch(() => void 0);
    try {
      if (this.cancelledTaskIds.has(taskId)) throw new Error("Cancelled by user");
      const connection = this.connections.get(lane.credentialId);
      if (!connection?.grokReady || connection.socket.readyState !== ws.WebSocket.OPEN) throw new Error("Grok extension lane is no longer ready.");
      if (!connection.quotaSeen || connection.videoAvailable !== true) throw new Error("Tài khoản Grok đã hết lượt tạo video.");
      await this.waitForSubmissionWindow(connection.credentialId);
      if (this.cancelledTaskIds.has(taskId)) throw new Error("Cancelled by user");
      if (!connection.grokReady || connection.socket.readyState !== ws.WebSocket.OPEN) throw new Error("Grok extension lane is no longer ready.");
      if (!connection.quotaSeen || connection.videoAvailable !== true) throw new Error("Tài khoản Grok đã hết lượt tạo video.");
      if (!connection) throw new Error("Mở Grok Imagine trong Chrome và đăng nhập bằng extension logdd trước.");
      const requestId = crypto.randomUUID();
      this.emitTask({ taskId, kind: "video", status: "queued", progress: 0, credentialId: connection.credentialId });
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(requestId);
          this.taskToRequest.delete(taskId);
          this.browserDownloads.delete(requestId);
          reject(new Error("Grok video timed out after 5 minutes"));
          this.emitTask({ taskId, kind: "video", status: "failed", message: "Timed out", credentialId: connection.credentialId });
        }, 5 * 6e4);
        this.pending.set(requestId, { requestId, taskId, credentialId: connection.credentialId, resolve, reject, timer });
        this.taskToRequest.set(taskId, requestId);
        connection.socket.send(JSON.stringify({
          type: "grok_generate_video",
          requestId,
          taskId,
          payload: {
            prompt: input.prompt,
            model: input.model,
            aspectRatio: input.aspectRatio,
            duration: input.duration,
            startImage: input.startImage,
            endImage: input.endImage
          }
        }));
        this.emitTask({ taskId, kind: "video", status: "submitting", progress: 1, credentialId: connection.credentialId });
      });
    } finally {
      this.cancelledTaskIds.delete(taskId);
      lane.queued = Math.max(0, lane.queued - 1);
      const cooldownMs = runtimeUtils.randomBetween(this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs);
      if (cooldownMs > 0) setTimeout(releaseLane, cooldownMs);
      else releaseLane();
    }
  }
  cancelTask(taskId) {
    const requestId = this.taskToRequest.get(taskId);
    if (!requestId) {
      this.cancelledTaskIds.add(taskId);
      this.emitTask({ taskId, kind: "video", status: "cancelled" });
      return true;
    }
    const pending = this.pending.get(requestId);
    if (!pending) return false;
    const connection = this.connections.get(pending.credentialId);
    connection?.socket.send(JSON.stringify({ type: "grok_cancel_video", requestId, taskId }));
    clearTimeout(pending.timer);
    pending.reject(new Error("Cancelled by user"));
    this.pending.delete(requestId);
    this.taskToRequest.delete(taskId);
    this.browserDownloads.delete(requestId);
    this.emitTask({ taskId, kind: "video", status: "cancelled", credentialId: pending.credentialId });
    return true;
  }
  // Entry point for the in-app CDP-driven Chrome login transport (see
  // browser-session/fake-socket.ts). Accepts anything duck-typed like a
  // `ws` WebSocket — attachSocket() only touches readyState/send/close and
  // the 'message'/'close' events.
  registerInAppConnection(socket) {
    this.attachSocket(socket);
  }
  // Removing an in-app account should drop its connection entirely.
  forgetInAppCredential(extensionInstanceId) {
    for (const [credentialId, connection] of this.connections) {
      if (connection.extensionInstanceId !== extensionInstanceId) continue;
      connection.socket.close(4e3, "Account removed");
      this.connections.delete(credentialId);
      this.videoLanes.delete(credentialId);
      this.emitStatus();
      return;
    }
  }
  attachSocket(socket) {
    let credentialId = "";
    socket.on("message", (bytes) => {
      let message;
      try {
        message = JSON.parse(bytes.toString());
      } catch {
        return;
      }
      if (message.type === "grok_extension_ready") {
        if (Number(message.protocolVersion) !== this.protocolVersion) {
          socket.close(4002, "Unsupported protocol");
          return;
        }
        protocol.assertString(message.extensionInstanceId, "extensionInstanceId", 128);
        const extensionInstanceId = String(message.extensionInstanceId);
        credentialId = `grok-${crypto.createHash("sha256").update(extensionInstanceId).digest("hex").slice(0, 12)}`;
        const previous = this.connections.get(credentialId);
        if (previous?.socket !== socket) previous?.socket.close(4001, "Replaced by reconnect");
        this.connections.set(credentialId, {
          socket,
          extensionInstanceId,
          credentialId,
          grokReady: message.grokReady === true,
          quotaSeen: message.quotaSeen === true || typeof message.videoAvailable === "boolean",
          videoAvailable: typeof message.videoAvailable === "boolean" ? message.videoAvailable : void 0,
          weeklyUsagePercent: typeof message.weeklyUsagePercent === "number" ? message.weeklyUsagePercent : void 0,
          quotaCheckedAt: typeof message.quotaCheckedAt === "number" ? message.quotaCheckedAt : void 0,
          pageUrl: typeof message.pageUrl === "string" ? message.pageUrl : void 0
        });
        socket.send(JSON.stringify({ type: "grok_credential_assigned", credentialId, protocolVersion: this.protocolVersion }));
        this.emitStatus();
        return;
      }
      if (!credentialId) return;
      if (message.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }
      if (message.type === "grok_page_ready") {
        const connection = this.connections.get(credentialId);
        if (connection) {
          connection.grokReady = true;
          this.updateQuotaFromMessage(connection, message);
          connection.pageUrl = typeof message.pageUrl === "string" ? message.pageUrl : connection.pageUrl;
          this.emitStatus();
        }
        return;
      }
      if (message.type === "grok_page_state") {
        const connection = this.connections.get(credentialId);
        if (connection) {
          connection.grokReady = message.grokReady === true;
          this.updateQuotaFromMessage(connection, message);
          connection.pageUrl = typeof message.pageUrl === "string" && message.pageUrl ? message.pageUrl : void 0;
          this.emitStatus();
        }
        return;
      }
      if (message.type === "grok_quota_status") {
        const connection = this.connections.get(credentialId);
        if (connection) {
          this.updateQuotaFromMessage(connection, message);
          this.resolveQuotaWaiters(connection.credentialId);
          if (connection.videoAvailable === false) this.videoLanes.delete(credentialId);
          this.emitStatus();
        }
        return;
      }
      if (message.type !== "grok_task_event") return;
      void this.handleTaskEvent(message, credentialId);
    });
    socket.on("close", () => {
      if (!credentialId || this.connections.get(credentialId)?.socket !== socket) return;
      this.connections.delete(credentialId);
      this.videoLanes.delete(credentialId);
      for (const [requestId, pending] of this.pending) {
        if (pending.credentialId !== credentialId) continue;
        clearTimeout(pending.timer);
        pending.reject(new Error("Grok extension disconnected"));
        this.pending.delete(requestId);
        this.taskToRequest.delete(pending.taskId);
        this.browserDownloads.delete(requestId);
      }
      this.emitStatus();
    });
  }
  async handleTaskEvent(message, credentialId) {
    const requestId = typeof message.requestId === "string" ? message.requestId : "";
    const pending = this.pending.get(requestId);
    if (!pending || pending.credentialId !== credentialId) return;
    const progress = typeof message.progress === "number" ? message.progress : void 0;
    const status = String(message.status || "polling");
    if (typeof message.downloadChunk === "string") {
      try {
        const sequence = Number(message.downloadSequence);
        if (!Number.isInteger(sequence) || sequence < 0 || sequence > 1e5) throw new Error("Invalid Grok video chunk sequence");
        if (message.downloadChunk.length > 4e6) throw new Error("Grok video chunk exceeds transport limit");
        const chunk = Buffer.from(message.downloadChunk, "base64");
        if (!chunk.length || chunk.length > 3e6) throw new Error("Invalid Grok video chunk");
        const transfer = this.browserDownloads.get(requestId) || { chunks: /* @__PURE__ */ new Map(), byteLength: 0 };
        if (!transfer.chunks.has(sequence)) {
          transfer.chunks.set(sequence, chunk);
          transfer.byteLength += chunk.length;
        }
        if (transfer.byteLength > 5e8) throw new Error("Grok video exceeds 500 MB");
        this.browserDownloads.set(requestId, transfer);
        this.emitTask({ taskId: pending.taskId, kind: "video", status: "downloading", progress, credentialId });
      } catch (error) {
        clearTimeout(pending.timer);
        this.pending.delete(requestId);
        this.taskToRequest.delete(pending.taskId);
        this.browserDownloads.delete(requestId);
        const failure = error instanceof Error ? error : new Error(String(error));
        pending.reject(failure);
        this.emitTask({ taskId: pending.taskId, kind: "video", status: "failed", message: safeMessage(failure), credentialId });
      }
      return;
    }
    if (status === "failed" || status === "cancelled") {
      clearTimeout(pending.timer);
      this.pending.delete(requestId);
      this.taskToRequest.delete(pending.taskId);
      this.browserDownloads.delete(requestId);
      const error = new Error(typeof message.error === "string" ? message.error : `Grok video ${status}`);
      if (isQuotaExhaustionError(error)) this.markQuotaExhausted(credentialId);
      pending.reject(error);
      this.emitTask({ taskId: pending.taskId, kind: "video", status, progress, message: safeMessage(error), credentialId });
      return;
    }
    if (status !== "completed") {
      this.emitTask({ taskId: pending.taskId, kind: "video", status: status === "submitting" ? "submitting" : "polling", progress, credentialId });
      return;
    }
    try {
      protocol.assertRecord(message.result, "Grok video result");
      const remoteUrl = typeof message.result.remoteUrl === "string" ? message.result.remoteUrl : "";
      if (!protocol.isAllowedGrokMediaUrl(remoteUrl)) throw new Error("Grok returned an invalid video URL");
      this.emitTask({ taskId: pending.taskId, kind: "video", status: "downloading", progress: 98, credentialId });
      const mediaId = typeof message.result.mediaId === "string" ? message.result.mediaId : crypto.randomUUID();
      const browserDownload = message.result.browserDownload;
      let localUrl;
      const providedLocalUrl = typeof message.result.localUrl === "string" ? message.result.localUrl : "";
      if (providedLocalUrl) {
        localUrl = providedLocalUrl;
      } else if (browserDownload && typeof browserDownload === "object" && !Array.isArray(browserDownload)) {
        const metadata = browserDownload;
        const chunkCount = Number(metadata.chunkCount);
        const expectedBytes = Number(metadata.byteLength);
        const transfer = this.browserDownloads.get(requestId);
        if (!transfer || !Number.isInteger(chunkCount) || chunkCount < 1 || transfer.chunks.size !== chunkCount) {
          throw new Error("Grok browser video download is incomplete");
        }
        const ordered = [];
        for (let index = 0; index < chunkCount; index += 1) {
          const chunk = transfer.chunks.get(index);
          if (!chunk) throw new Error(`Grok browser video chunk ${index} is missing`);
          ordered.push(chunk);
        }
        const bytes = Buffer.concat(ordered);
        if (Number.isFinite(expectedBytes) && expectedBytes > 0 && bytes.length !== expectedBytes) {
          throw new Error("Grok browser video size does not match");
        }
        localUrl = this.saveVideoBytes(bytes, mediaId);
      } else {
        throw new Error("Grok browser download bridge is outdated. Reload extension logdd, reload the Grok tab, then restart Electron.");
      }
      clearTimeout(pending.timer);
      this.pending.delete(requestId);
      this.taskToRequest.delete(pending.taskId);
      this.browserDownloads.delete(requestId);
      pending.resolve({ taskId: pending.taskId, provider: "grok", credentialId, mediaId, remoteUrl, localUrl });
      this.emitTask({ taskId: pending.taskId, kind: "video", status: "completed", progress: 100, credentialId });
    } catch (error) {
      clearTimeout(pending.timer);
      this.pending.delete(requestId);
      this.taskToRequest.delete(pending.taskId);
      this.browserDownloads.delete(requestId);
      pending.reject(error instanceof Error ? error : new Error(String(error)));
      this.emitTask({ taskId: pending.taskId, kind: "video", status: "failed", message: safeMessage(error), credentialId });
    }
  }
  saveVideoBytes(bytes, id) {
    if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") throw new Error("Grok result is not a valid MP4");
    const outputDir = path.join(this.options.mediaRoot, "videos");
    fs.mkdirSync(outputDir, { recursive: true });
    const safeId = id.replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || crypto.randomUUID();
    const filename = `grok-${safeId}-${Date.now()}.mp4`;
    fs.writeFileSync(path.join(outputDir, filename), bytes);
    return `local-image://videos/${encodeURIComponent(filename)}`;
  }
  selectVideoLane(excludedCredentialIds = /* @__PURE__ */ new Set()) {
    const ready = [...this.connections.values()].filter((connection) => connection.grokReady && connection.quotaSeen && connection.videoAvailable === true && connection.socket.readyState === ws.WebSocket.OPEN && !excludedCredentialIds.has(connection.credentialId));
    if (!ready.length) {
      const pageReady = [...this.connections.values()].filter((connection) => connection.grokReady && connection.socket.readyState === ws.WebSocket.OPEN);
      if (pageReady.length && pageReady.every((connection) => connection.quotaSeen && connection.videoAvailable === false)) {
        throw new Error("Tất cả tài khoản Grok đã hết lượt tạo video.");
      }
      if (pageReady.some((connection) => !connection.quotaSeen)) {
        throw new Error("Đang chờ Grok kiểm tra lượt tạo video của tài khoản.");
      }
      throw new Error("Mở Grok Imagine trong Chrome và đăng nhập bằng extension logdd trước.");
    }
    const all = [];
    for (const connection of ready) {
      let lanes = this.videoLanes.get(connection.credentialId);
      if (!lanes || lanes.length !== this.videoLanesPerExtension) {
        lanes = Array.from({ length: this.videoLanesPerExtension }, (_, index) => ({
          credentialId: connection.credentialId,
          slot: index + 1,
          queued: 0,
          chain: Promise.resolve()
        }));
        this.videoLanes.set(connection.credentialId, lanes);
      }
      all.push(...lanes);
    }
    const offset = this.nextLaneCursor % all.length;
    const ordered = [...all.slice(offset), ...all.slice(0, offset)];
    const selected = ordered.reduce((best, current) => current.queued < best.queued ? current : best, ordered[0]);
    this.nextLaneCursor = (all.indexOf(selected) + 1) % all.length;
    return selected;
  }
  updateQuotaFromMessage(connection, message) {
    if (message.quotaSeen !== true && typeof message.videoAvailable !== "boolean") return;
    const nextCheckedAt = typeof message.quotaCheckedAt === "number" ? message.quotaCheckedAt : Date.now();
    if (typeof connection.quotaCheckedAt === "number" && nextCheckedAt <= connection.quotaCheckedAt) return;
    connection.quotaSeen = true;
    connection.videoAvailable = message.videoAvailable === true;
    if (typeof message.weeklyUsagePercent === "number") {
      connection.weeklyUsagePercent = Math.max(0, Math.min(100, message.weeklyUsagePercent));
    }
    connection.quotaCheckedAt = nextCheckedAt;
  }
  markQuotaExhausted(credentialId) {
    const connection = this.connections.get(credentialId);
    if (!connection) return;
    connection.quotaSeen = true;
    connection.videoAvailable = false;
    connection.quotaCheckedAt = Date.now();
    this.videoLanes.delete(credentialId);
    this.emitStatus();
  }
  async waitForSubmissionWindow(credentialId) {
    const previousGate = this.submissionGate;
    let releaseGate = () => {
    };
    this.submissionGate = new Promise((resolve) => {
      releaseGate = resolve;
    });
    await previousGate;
    try {
      const now = Date.now();
      const submitDelay = this.lastSubmitAt ? runtimeUtils.randomBetween(this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs) : 0;
      const switchedExtension = Boolean(this.lastSubmitCredentialId && this.lastSubmitCredentialId !== credentialId);
      const extensionDelay = switchedExtension ? runtimeUtils.randomBetween(this.extensionStartStaggerMinMs, this.extensionStartStaggerMaxMs) : 0;
      const allowedAt = this.lastSubmitAt + Math.max(submitDelay, extensionDelay);
      if (allowedAt > now) await new Promise((resolve) => setTimeout(resolve, allowedAt - now));
      const submittedAt = Date.now();
      this.lastSubmitAt = submittedAt;
      this.lastSubmitCredentialId = credentialId;
    } finally {
      releaseGate();
    }
  }
  validateVideoInput(input) {
    protocol.assertRecord(input, "Grok video payload");
    protocol.assertString(input.projectId, "projectId", 256);
    protocol.assertString(input.sceneId, "sceneId", 256);
    protocol.assertString(input.prompt, "prompt");
    protocol.assertString(input.model, "model", 256);
    protocol.assertString(input.aspectRatio, "aspectRatio", 16);
    if (input.startImage) {
      protocol.assertRecord(input.startImage, "startImage");
      protocol.assertString(input.startImage.source, "startImage.source", 3e7);
    }
  }
  emitTask(event) {
    this.emit("task", event);
  }
  emitStatus() {
    this.emit("status", this.getStatus());
  }
}
exports.GrokVideoRuntime = GrokVideoRuntime;
