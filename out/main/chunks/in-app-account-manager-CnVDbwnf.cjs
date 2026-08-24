"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const electron = require("electron");
const inAppAccountManager = require("./in-app-account-manager-CDuKfh8q.cjs");
const protocol = require("./protocol-DX51u8o5.cjs");
require("node:events");
const COMMAND_CHANNEL = "LOGDD_GROK_COMMAND_V1";
const EVENT_CHANNEL = "LOGDD_GROK_EVENT_V1";
const BINDING_NAME = "__logddGrokToNode";
const POLL_INTERVAL_MS = 2500;
const ADAPTER_SCRIPT = `(function () {
  if (window.__logddGrokCdpAdapter) return;
  window.__logddGrokCdpAdapter = true;
  var EVENT_CHANNEL = ${JSON.stringify(EVENT_CHANNEL)};
  // Two concurrent lanes on one account emit task-events back to back. A
  // fire-and-forget try/catch around the CDP binding call used to silently
  // drop an event (e.g. a transient binding-not-ready race) — losing a
  // 'completed' event this way means Node never learns the video is done and
  // the task hangs until its 5-minute timeout. Queue instead, and retry the
  // whole FIFO queue until the binding call stops throwing, so no event is
  // ever silently lost.
  var pendingToNode = [];
  var flushScheduled = false;
  function flushToNode() {
    flushScheduled = false;
    while (pendingToNode.length) {
      try {
        window[${JSON.stringify(BINDING_NAME)}](pendingToNode[0]);
        pendingToNode.shift();
      } catch (e) {
        if (!flushScheduled) { flushScheduled = true; setTimeout(flushToNode, 100); }
        return;
      }
    }
  }
  function toNode(obj) {
    pendingToNode.push(JSON.stringify(obj));
    flushToNode();
  }
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var d = event.data;
    if (!d || d.channel !== EVENT_CHANNEL) return;
    if (d.type === 'task-event') toNode({ kind: 'task-event', event: d.event });
    else if (d.type === 'quota-status') toNode({ kind: 'quota-status', quota: d.quota });
  });
})();`;
function isUsableGrokPageUrl(value) {
  try {
    const url = new URL(value);
    const isApiDocument = /^\/(?:rest|api|grok_api|grok_api_v2)(?:\/|\.|$)/i.test(url.pathname);
    return url.protocol === "https:" && (url.hostname === "grok.com" || url.hostname.endsWith(".grok.com")) && !isApiDocument;
  } catch {
    return false;
  }
}
class GrokInAppBridge {
  constructor(handle, runtime, extensionPath, mediaRoot, onFirstReady) {
    this.handle = handle;
    this.mediaRoot = mediaRoot;
    this.onFirstReady = onFirstReady;
    this.pageBridgeSource = fs.readFileSync(path.join(extensionPath, "grok-page-bridge.js"), "utf8");
    this.socket = new inAppAccountManager.FakeSocket((json) => {
      void this.handleOutgoing(json);
    });
    this.socket.open();
    void this.wireCdp();
    handle.onReconnect(() => {
      console.log(`[video-studio][grok] reconnected to respawned Chrome for account ${handle.accountSlotId}`);
      this.grokReady = false;
      this.quotaSeen = false;
      this.videoAvailable = void 0;
      this.video720pAvailable = void 0;
      this.weeklyUsagePercent = void 0;
      this.quotaCheckedAt = void 0;
      this.usablePollsWithoutQuota = 0;
      this.reloadTriggered = false;
      void this.wireCdp();
    });
    runtime.registerInAppConnection(this.socket);
    this.socket.receive(JSON.stringify({
      type: "grok_extension_ready",
      protocolVersion: protocol.GROK_PROTOCOL_VERSION,
      extensionInstanceId: handle.accountSlotId,
      grokReady: false,
      pageUrl: ""
    }));
  }
  socket;
  pageBridgeSource;
  grokReady = false;
  disposed = false;
  // Real login proof: the Grok Imagine page calls /rest/media/imagine/quota_info
  // (an authenticated endpoint) on load, and the injected page bridge reports
  // its response as a quota-status event. Seeing one means we are genuinely
  // signed in — whether video quota is left or exhausted — which a bare URL
  // check cannot tell us.
  quotaSeen = false;
  videoAvailable;
  video720pAvailable;
  weeklyUsagePercent;
  quotaCheckedAt;
  usablePollsWithoutQuota = 0;
  reloadTriggered = false;
  pollTimer;
  unsubscribers = [];
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.socket.close();
  }
  async wireCdp() {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers.length = 0;
    const cdp = this.handle.cdp;
    this.unsubscribers.push(cdp.on("Runtime.bindingCalled", (params) => this.onBinding(params)));
    this.unsubscribers.push(cdp.on("Runtime.consoleAPICalled", (params) => this.onConsoleMessage(params)));
    this.unsubscribers.push(cdp.on("Runtime.exceptionThrown", (params) => this.onExceptionThrown(params)));
    try {
      await cdp.send("Runtime.enable");
      await cdp.send("Page.enable");
      await cdp.send("Runtime.addBinding", { name: BINDING_NAME });
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: this.pageBridgeSource });
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: ADAPTER_SCRIPT });
    } catch (error) {
      console.error("[video-studio][grok] failed to wire CDP:", error);
    }
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      void this.pollReady();
    }, POLL_INTERVAL_MS);
    void this.pollReady();
  }
  // Readiness is polled rather than driven off navigation events (Grok's login
  // bounces through cross-origin redirects and event pings raced/flickered).
  // Being on grok.com/imagine is necessary but NOT sufficient — the page shows
  // even when signed out. The real gate is having observed a quota_info
  // response (this.quotaSeen), which only succeeds while authenticated. If we
  // sit on /imagine without a quota signal, reload once to re-trigger the
  // page's own quota_info call so the page bridge can capture it.
  async pollReady() {
    if (this.disposed) return;
    const cdp = this.handle.cdp;
    let value;
    try {
      const result = await cdp.send("Runtime.evaluate", {
        expression: "({ href: location.href, installed: !!window.__logddGrokPageBridgeInstalled, adapter: !!window.__logddGrokCdpAdapter })",
        returnByValue: true
      });
      value = result?.result?.value;
    } catch {
      return;
    }
    if (!value) return;
    const href = String(value.href || "");
    if (!value.installed || !value.adapter) {
      try {
        await cdp.send("Runtime.evaluate", { expression: this.pageBridgeSource });
        await cdp.send("Runtime.evaluate", { expression: ADAPTER_SCRIPT });
      } catch {
      }
    }
    if (!isUsableGrokPageUrl(href)) {
      this.usablePollsWithoutQuota = 0;
      this.reloadTriggered = false;
      this.quotaSeen = false;
      this.videoAvailable = void 0;
      this.video720pAvailable = void 0;
      this.weeklyUsagePercent = void 0;
      this.quotaCheckedAt = void 0;
      if (this.grokReady) {
        console.log(`[video-studio][grok] left grok page (${href}) for account ${this.handle.accountSlotId}`);
        this.grokReady = false;
      }
      this.socket.receive(JSON.stringify({ type: "grok_page_state", grokReady: false, quotaSeen: false, pageUrl: href }));
      return;
    }
    if (this.quotaSeen) {
      if (!this.grokReady) {
        console.log(`[video-studio][grok] logged in — quota seen (720p ${this.videoAvailable && this.video720pAvailable ? "available" : "exhausted/unknown"}) for account ${this.handle.accountSlotId}`);
        this.grokReady = true;
        this.onFirstReady?.();
      }
      this.socket.receive(JSON.stringify({
        type: "grok_page_ready",
        pageUrl: href,
        quotaSeen: true,
        videoAvailable: this.videoAvailable === true && this.video720pAvailable === true,
        weeklyUsagePercent: this.weeklyUsagePercent,
        quotaCheckedAt: this.quotaCheckedAt
      }));
      return;
    }
    this.usablePollsWithoutQuota += 1;
    if (this.usablePollsWithoutQuota >= 2 && !this.reloadTriggered) {
      this.reloadTriggered = true;
      console.log(`[video-studio][grok] on /imagine without quota yet — reloading once to re-trigger quota_info (account ${this.handle.accountSlotId})`);
      void cdp.send("Page.reload", { ignoreCache: false }).catch(() => {
      });
    }
    this.socket.receive(JSON.stringify({ type: "grok_page_state", grokReady: false, pageUrl: href }));
  }
  onConsoleMessage(params) {
    if (params.type !== "warning" && params.type !== "error") return;
    const text = (params.args || []).map((arg) => arg?.value !== void 0 ? String(arg.value) : String(arg?.description ?? "")).join(" ").trim();
    if (!text) return;
    console.warn(`[video-studio][grok][page:${this.handle.accountSlotId}] ${text}`);
  }
  onExceptionThrown(params) {
    const detail = params.exceptionDetails;
    const message = detail?.exception?.description ?? detail?.text ?? "unknown error";
    console.error(`[video-studio][grok][page:${this.handle.accountSlotId}] uncaught: ${String(message)}`);
  }
  onBinding(params) {
    if (params.name !== BINDING_NAME || !params.payload) return;
    let message;
    try {
      message = JSON.parse(params.payload);
    } catch {
      return;
    }
    if (message.kind === "task-event" && message.event) {
      const event = message.event;
      const result = event.result;
      if (event.status === "completed" && result?.remoteUrl && !result.localUrl) {
        void this.downloadAndForward(event, result.remoteUrl, result.mediaId);
        return;
      }
      this.socket.receive(JSON.stringify({ type: "grok_task_event", ...event }));
      return;
    }
    if (message.kind === "quota-status") {
      this.quotaSeen = true;
      this.videoAvailable = message.quota?.videoAvailable === true;
      this.video720pAvailable = message.quota?.video720pAvailable === true;
      this.weeklyUsagePercent = typeof message.quota?.weeklyUsagePercent === "number" ? Math.max(0, Math.min(100, message.quota.weeklyUsagePercent)) : void 0;
      this.quotaCheckedAt = typeof message.quota?.checkedAt === "number" ? message.quota.checkedAt : Date.now();
      this.socket.receive(JSON.stringify({
        type: "grok_quota_status",
        quotaSeen: true,
        // Grok runtime uses this as the lane eligibility flag. Video Studio
        // never falls back to 480p, so only a 720p-capable account is ready.
        videoAvailable: this.videoAvailable && this.video720pAvailable,
        weeklyUsagePercent: this.weeklyUsagePercent,
        quotaCheckedAt: this.quotaCheckedAt
      }));
    }
  }
  async downloadAndForward(event, remoteUrl, mediaId) {
    const requestId = event.requestId;
    const taskId = event.taskId;
    try {
      this.socket.receive(JSON.stringify({ type: "grok_task_event", requestId, taskId, status: "downloading", progress: 98 }));
      const localUrl = await this.downloadVideo(remoteUrl, typeof mediaId === "string" ? mediaId : crypto.randomUUID());
      const result = { ...event.result, localUrl };
      this.socket.receive(JSON.stringify({ type: "grok_task_event", ...event, status: "completed", result }));
    } catch (error) {
      this.socket.receive(JSON.stringify({
        type: "grok_task_event",
        requestId,
        taskId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }
  // Download the finished video in the main process, authenticating with the
  // account's own Grok cookies (read over CDP). This replaces streaming the
  // whole file back as base64 chunks over the CDP binding, which stalled on
  // large videos and blocked the account's single lane.
  async downloadVideo(remoteUrl, mediaId) {
    if (!protocol.isAllowedGrokMediaUrl(remoteUrl)) throw new Error("Grok returned an invalid video URL");
    const { cookies } = await this.handle.cdp.send("Network.getCookies", { urls: [remoteUrl] });
    const cookieHeader = (cookies || []).map((c) => `${c.name}=${c.value}`).join("; ");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4 * 6e4);
    let response;
    try {
      response = await electron.net.fetch(remoteUrl, { headers: cookieHeader ? { Cookie: cookieHeader } : {}, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) throw new Error("Grok video download timed out after 4 minutes");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`Grok video download failed (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5e8) throw new Error("Grok video exceeds 500 MB");
    if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") throw new Error("Grok result is not a valid MP4");
    const outputDir = path.join(this.mediaRoot, "videos");
    fs.mkdirSync(outputDir, { recursive: true });
    const safeId = mediaId.replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || crypto.randomUUID();
    const filename = `grok-${safeId}-${Date.now()}.mp4`;
    fs.writeFileSync(path.join(outputDir, filename), bytes);
    return `local-image://videos/${encodeURIComponent(filename)}`;
  }
  async handleOutgoing(json) {
    let message;
    try {
      message = JSON.parse(json);
    } catch {
      return;
    }
    if (message.type === "grok_generate_video" || message.type === "grok_cancel_video") {
      const command = {
        channel: COMMAND_CHANNEL,
        type: message.type === "grok_generate_video" ? "generate-video" : "cancel-video",
        requestId: message.requestId,
        taskId: message.taskId,
        payload: message.payload
      };
      const expression = `window.postMessage(${JSON.stringify(command)}, window.location.origin)`;
      try {
        await this.handle.cdp.send("Runtime.evaluate", { expression });
      } catch (error) {
        if (message.type === "grok_generate_video" && message.requestId) {
          this.socket.receive(JSON.stringify({
            type: "grok_task_event",
            requestId: message.requestId,
            taskId: message.taskId,
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
          }));
        }
      }
    }
    if (message.type === "grok_refresh_quota") {
      const command = { channel: COMMAND_CHANNEL, type: "refresh-quota" };
      const expression = `window.postMessage(${JSON.stringify(command)}, window.location.origin)`;
      try {
        await this.handle.cdp.send("Runtime.evaluate", { expression });
      } catch {
      }
    }
  }
}
const LOGIN_URL = "https://grok.com/imagine";
class GrokInAppAccountManager extends inAppAccountManager.InAppAccountManager {
  constructor(sessionManager, runtime, extensionPath, mediaRoot) {
    super("grok", LOGIN_URL, "Grok", sessionManager, runtime, (handle, onFirstReady) => {
      return new GrokInAppBridge(handle, runtime, extensionPath, mediaRoot, onFirstReady);
    });
  }
}
exports.GrokInAppAccountManager = GrokInAppAccountManager;
