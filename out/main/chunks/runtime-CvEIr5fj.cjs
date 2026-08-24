"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const node_events = require("node:events");
const ws = require("ws");
const protocol = require("./protocol-Ct8MHPdL.cjs");
const runtimeUtils = require("./runtime-utils-CnaWxr36.cjs");
const GOOGLE_FLOW_IMAGE_MODELS = {
  GEM_PIX_2: "GEM_PIX_2",
  NARWHAL: "NARWHAL",
  Nano_Banana_Pro: "GEM_PIX_2",
  Nano_Banana_2: "NARWHAL"
};
const OMNI_FLASH_DURATIONS = /* @__PURE__ */ new Set([4, 6, 8, 10]);
function omniFlashModel(duration) {
  return `abra_i2v_${duration && OMNI_FLASH_DURATIONS.has(duration) ? duration : 8}s`;
}
const VIDEO_MODELS = {
  LITE_LOW_PRIORITY: {
    frame: {
      4: "veo_3_1_i2v_s_lite_4s_low_priority",
      6: "veo_3_1_i2v_s_lite_6s_low_priority",
      8: "veo_3_1_i2v_lite_low_priority"
    },
    startEnd: {
      4: "veo_3_1_i2v_s_lite_4s_low_priority",
      6: "veo_3_1_i2v_s_lite_6s_low_priority",
      8: "veo_3_1_i2v_lite_low_priority"
    },
    reference: { landscape: "veo_3_1_r2v_fast_landscape_ultra_relaxed", portrait: "veo_3_1_r2v_fast_landscape_ultra_relaxed" }
  },
  FAST: {
    frame: {
      4: "veo_3_1_i2v_s_fast_4s",
      6: "veo_3_1_i2v_s_fast_6s",
      8: "veo_3_1_i2v_s_fast"
    },
    startEnd: {
      4: "veo_3_1_i2v_s_fast_4s_fl",
      6: "veo_3_1_i2v_s_fast_6s_fl",
      8: "veo_3_1_i2v_s_fast_fl"
    },
    reference: { landscape: "veo_3_1_r2v_fast", portrait: "veo_3_1_r2v_fast_portrait" }
  },
  LITE: {
    frame: {
      4: "veo_3_1_i2v_s_lite_4s",
      6: "veo_3_1_i2v_s_lite_6s",
      8: "veo_3_1_i2v_s_lite"
    },
    startEnd: {
      4: "veo_3_1_i2v_s_lite_4s_fl",
      6: "veo_3_1_i2v_s_lite_6s_fl",
      8: "veo_3_1_i2v_s_lite_fl"
    },
    reference: { landscape: "veo_3_1_r2v_lite", portrait: "veo_3_1_r2v_lite_portrait" }
  }
};
function isOmniFlashRequest(requestedModel) {
  const canonical = (requestedModel || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return canonical === "gemini_omni_flash" || canonical === "omni_flash" || canonical.startsWith("abra");
}
function resolveRequestedProfile(requestedModel, accountTier) {
  const normalized = (requestedModel || "").toLowerCase();
  const canonical = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (isOmniFlashRequest(requestedModel)) {
    return "OMNI_FLASH";
  }
  if (canonical.includes("lite_lower_priority") || canonical.includes("lite_low_priority") || canonical.includes("ultra_relaxed")) {
    return "LITE_LOW_PRIORITY";
  }
  if (canonical.includes("lite")) {
    return "LITE";
  }
  if (canonical.includes("fast")) {
    return "FAST";
  }
  return accountTier === "PAYGATE_TIER_ONE" ? "FAST" : "LITE_LOW_PRIORITY";
}
function flowImageRatio(ratio) {
  if (ratio === "16:9" || ratio === "4:3" || ratio === "3:2" || ratio === "21:9") return "IMAGE_ASPECT_RATIO_LANDSCAPE";
  if (ratio === "1:1") return "IMAGE_ASPECT_RATIO_SQUARE";
  return "IMAGE_ASPECT_RATIO_PORTRAIT";
}
function flowVideoRatio(ratio) {
  return ratio === "9:16" || ratio === "3:4" || ratio === "2:3" ? "VIDEO_ASPECT_RATIO_PORTRAIT" : "VIDEO_ASPECT_RATIO_LANDSCAPE";
}
function flowVideoEndpoint(mode) {
  if (mode === "reference") return "/v1/video:batchAsyncGenerateVideoReferenceImages";
  if (mode === "startEnd") return "/v1/video:batchAsyncGenerateVideoStartAndEndImage";
  return "/v1/video:batchAsyncGenerateVideoStartImage";
}
function resolveFlowVideoModel(tier, mode, ratio, requestedModel, requestedDuration) {
  const profile = resolveRequestedProfile(requestedModel, tier);
  if (profile === "OMNI_FLASH") {
    if (mode === "reference") {
      throw new Error("Gemini Omni Flash does not support reference images. Pick a Veo 3.1 model for reference-to-video.");
    }
    return omniFlashModel(requestedDuration);
  }
  const orientation = flowVideoRatio(ratio) === "VIDEO_ASPECT_RATIO_PORTRAIT" ? "portrait" : "landscape";
  if (mode === "reference") return VIDEO_MODELS[profile].reference[orientation];
  const duration = requestedDuration === 4 || requestedDuration === 6 ? requestedDuration : 8;
  return VIDEO_MODELS[profile][mode][duration];
}
function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walk(item, visitor);
      if (found) return found;
    }
    return void 0;
  }
  if (!value || typeof value !== "object") return void 0;
  const record = value;
  const direct = visitor(record);
  if (direct) return direct;
  for (const child of Object.values(record)) {
    const found = walk(child, visitor);
    if (found) return found;
  }
  return void 0;
}
function extractFlowProjectId(value) {
  return walk(value, (record) => {
    for (const key of ["projectId", "project_id", "id"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.length >= 8) return candidate;
    }
    return void 0;
  });
}
function extractFlowMediaId(value) {
  return walk(value, (record) => {
    for (const key of ["mediaId", "name"]) {
      const candidate = record[key];
      if (protocol.isUuid(candidate)) return candidate;
    }
    return void 0;
  });
}
function extractFlowUrl(value) {
  return walk(value, (record) => {
    for (const key of ["fifeUrl", "servingUri", "fileUrl", "url"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && /^https:\/\//i.test(candidate)) return candidate;
    }
    return void 0;
  });
}
function extractFlowOperations(value) {
  const root = value && typeof value === "object" ? value : {};
  const data = root.data && typeof root.data === "object" ? root.data : root;
  if (Array.isArray(data.operations)) {
    return data.operations.filter((item) => Boolean(item && typeof item === "object")).map((raw) => ({ raw, workflowMode: false }));
  }
  if (!Array.isArray(data.workflows)) return [];
  return data.workflows.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const workflow = item;
    const metadata = workflow.metadata && typeof workflow.metadata === "object" ? workflow.metadata : {};
    const primaryMediaId = metadata.primaryMediaId;
    if (!protocol.isUuid(primaryMediaId)) return [];
    return [{
      workflowMode: true,
      primaryMediaId,
      raw: {
        operation: { name: workflow.name, metadata: { video: { mediaId: primaryMediaId } } },
        status: "MEDIA_GENERATION_STATUS_PENDING"
      }
    }];
  });
}
function operationStatus(operation) {
  return typeof operation.status === "string" ? operation.status : "";
}
function decodeVerifiedMp4(encoded) {
  if (typeof encoded !== "string" || encoded.length > 3e8) return void 0;
  try {
    const bytes = Buffer.from(encoded, "base64");
    return bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp" ? bytes : void 0;
  } catch {
    return void 0;
  }
}
const safeMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/captcha/i.test(message)) return `CAPTCHA: ${message}`;
  if (/401|403|token|flow_key/i.test(message)) return `TOKEN: ${message}`;
  if (/429|quota|credit/i.test(message)) return `QUOTA: ${message}`;
  if (/moderation|safety/i.test(message)) return `MODERATION: ${message}`;
  return message;
};
function hashIdentity(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}
function saveVideoBytes(mediaRoot, bytes, id) {
  const outputDir = path.join(mediaRoot, "videos");
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `google-flow-${id}-${Date.now()}.mp4`;
  fs.writeFileSync(path.join(outputDir, filename), bytes);
  return `local-image://videos/${encodeURIComponent(filename)}`;
}
async function downloadVideo(mediaRoot, url, id, signal) {
  return saveVideoBytes(mediaRoot, await downloadVideoBytes(url, signal), id);
}
async function downloadVideoBytes(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Google Flow video download failed (${response.status})`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 5e8) throw new Error("Google Flow video exceeds 500 MB");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") throw new Error("Google Flow result is not a valid MP4");
  return bytes;
}
async function createVideoThumbnail(mediaRoot, localUrl, taskId) {
  const match = /^local-image:\/\/videos\/(.+)$/i.exec(localUrl);
  if (!match) return void 0;
  let filename;
  try {
    filename = decodeURIComponent(match[1]);
  } catch {
    return void 0;
  }
  const inputPath = path.resolve(mediaRoot, "videos", filename);
  const videoRoot = path.resolve(mediaRoot, "videos");
  if (!inputPath.startsWith(`${videoRoot}${path.sep}`) || !fs.existsSync(inputPath)) return void 0;
  const thumbnailDir = path.join(mediaRoot, "thumbnails");
  fs.mkdirSync(thumbnailDir, { recursive: true });
  const outputPath = path.join(thumbnailDir, `google-flow-${hashIdentity(taskId)}-${Date.now()}.jpg`);
  try {
    const { runFFmpeg } = await Promise.resolve().then(() => require("../index.cjs")).then((n) => n.ffmpegRuntime);
    const result = await runFFmpeg({
      jobId: `google-flow-thumbnail-${taskId}-${crypto.randomUUID()}`,
      args: ["-y", "-ss", "0.1", "-i", inputPath, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "5", outputPath]
    });
    if (!result.success || !fs.existsSync(outputPath)) return void 0;
    const bytes = fs.readFileSync(outputPath);
    if (!bytes.length || bytes.length > 25e4) return void 0;
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return void 0;
  } finally {
    try {
      fs.unlinkSync(outputPath);
    } catch {
    }
  }
}
async function readImageSource(mediaRootPath, source, signal) {
  if (source.startsWith("data:image/")) {
    const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(source);
    if (!match || match[2].length > 4e7) throw new Error("Invalid or oversized image data URL");
    return { mimeType: match[1], base64: match[2], fileName: `image-${Date.now()}.${match[1].split("/")[1] || "jpg"}` };
  }
  if (source.startsWith("local-image://")) {
    const match = /^local-image:\/\/([^/]+)\/(.+)$/i.exec(source);
    if (!match) throw new Error("Invalid local image URL");
    const mediaRoot = path.resolve(mediaRootPath);
    const category = decodeURIComponent(match[1]);
    const fileName = path.basename(decodeURIComponent(match[2]));
    const filePath = path.resolve(mediaRoot, category, fileName);
    if (filePath !== mediaRoot && !filePath.startsWith(`${mediaRoot}${path.sep}`)) throw new Error("Local image path is outside media storage");
    const bytes2 = fs.readFileSync(filePath);
    if (!bytes2.length || bytes2.length > 2e7) throw new Error("Reference image exceeds 20 MB");
    const extension = path.extname(fileName).slice(1).toLowerCase();
    const mimeType2 = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "gif" ? "image/gif" : "image/jpeg";
    return { mimeType: mimeType2, base64: bytes2.toString("base64"), fileName };
  }
  if (!/^https:\/\//i.test(source)) throw new Error("Local image must be converted to a data URL before Google Flow upload");
  const response = await fetch(source, { signal });
  if (!response.ok) throw new Error(`Unable to download reference image (${response.status})`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 2e7) throw new Error("Reference image exceeds 20 MB");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2e7) throw new Error("Reference image exceeds 20 MB");
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (!mimeType.startsWith("image/")) throw new Error("Reference URL is not an image");
  return { mimeType, base64: bytes.toString("base64"), fileName: `image-${Date.now()}.${mimeType.split("/")[1] || "jpg"}` };
}
function validateImageInput(input) {
  protocol.assertRecord(input, "image payload");
  protocol.assertString(input.projectId, "projectId", 256);
  protocol.assertString(input.prompt, "prompt", 1e5);
  protocol.assertString(input.model, "model", 256);
  protocol.assertString(input.aspectRatio, "aspectRatio", 16);
  if ((input.references?.length || 0) > 10) throw new Error("Google Flow supports at most 10 image references");
}
function validateVideoInput(input) {
  protocol.assertRecord(input, "video payload");
  protocol.assertString(input.projectId, "projectId", 256);
  protocol.assertString(input.sceneId, "sceneId", 256);
  protocol.assertString(input.prompt, "prompt", 1e5);
  protocol.assertString(input.model, "model", 256);
  protocol.assertString(input.aspectRatio, "aspectRatio", 16);
  if ((input.references?.length || 0) > 3) throw new Error("Google Flow supports at most 3 video references");
}
function attachSocket(ctx, socket) {
  let assignedCredentialId;
  socket.on("message", (bytes) => {
    try {
      const message = JSON.parse(bytes.toString());
      if (message.type === "extension_ready") {
        const isLegacyFlowKit = message.protocolVersion === void 0 && message.extensionInstanceId === void 0;
        const protocolVersion = isLegacyFlowKit ? ctx.protocolVersion : Number(message.protocolVersion);
        if (!isLegacyFlowKit) protocol.assertString(message.extensionInstanceId, "extensionInstanceId", 128);
        if (protocolVersion !== ctx.protocolVersion) throw new Error(`Protocol ${protocolVersion} is not supported`);
        const legacyInstanceId = typeof message.legacyInstanceId === "string" && protocol.isUuid(message.legacyInstanceId) ? message.legacyInstanceId : void 0;
        const instanceId = isLegacyFlowKit ? `flowkit-${legacyInstanceId || crypto.randomUUID()}` : String(message.extensionInstanceId);
        const previousId = ctx.instanceToCredential.get(instanceId);
        const credentialId = previousId || `flow-${ctx.hashIdentity(instanceId)}`;
        const previous = previousId ? ctx.sockets.get(previousId) : void 0;
        previous?.socket.close(4001, "Replaced by reconnect");
        const accountId = typeof message.accountId === "string" ? ctx.hashIdentity(message.accountId) : void 0;
        const legacyTokenAge = typeof message.tokenAge === "number" ? Math.max(0, message.tokenAge) : void 0;
        const slot = {
          credentialId,
          extensionInstanceId: instanceId,
          connectionId: crypto.randomUUID(),
          accountId,
          ownerScopeId: accountId || credentialId,
          tokenCapturedAt: typeof message.tokenCapturedAt === "number" ? message.tokenCapturedAt : message.flowKeyPresent ? Date.now() - (legacyTokenAge || 0) : void 0,
          state: message.flowKeyPresent ? "ready" : "stale"
        };
        assignedCredentialId = credentialId;
        ctx.instanceToCredential.set(instanceId, credentialId);
        ctx.credentials.set(credentialId, slot);
        ctx.sockets.set(credentialId, { socket, slot, protocol: isLegacyFlowKit ? "flowkit-legacy" : "native" });
        socket.send(JSON.stringify({
          type: "credential_assigned",
          protocolVersion: ctx.protocolVersion,
          requestId: message.requestId,
          extensionInstanceId: instanceId,
          credentialId,
          connectionId: slot.connectionId,
          sessionSecret: ctx.sessionSecret
        }));
        if (isLegacyFlowKit) {
          socket.send(JSON.stringify({ type: "callback_secret", secret: ctx.sessionSecret }));
        }
        ctx.emitStatus();
        void refreshCredits(ctx, slot);
        return;
      }
      if (!assignedCredentialId) throw new Error("Extension must handshake first");
      const state = ctx.sockets.get(assignedCredentialId);
      if (!state || state.protocol === "native" && (message.sessionSecret !== ctx.sessionSecret || message.credentialId !== assignedCredentialId)) {
        throw new Error("Invalid Google Flow extension session");
      }
      if (message.type === "token_updated" || message.type === "token_captured") {
        state.slot.tokenCapturedAt = Date.now();
        state.slot.state = "ready";
        if (typeof message.accountId === "string") {
          state.slot.accountId = ctx.hashIdentity(message.accountId);
          state.slot.ownerScopeId = state.slot.accountId;
        }
        ctx.emitStatus();
        return;
      }
      if (message.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }
      if (message.type === "pong") return;
      const requestId = typeof message.requestId === "string" ? message.requestId : typeof message.id === "string" ? message.id : "";
      const pending = ctx.pending.get(requestId);
      if (!pending || pending.credentialId !== assignedCredentialId) return;
      clearTimeout(pending.timer);
      ctx.pending.delete(requestId);
      if (message.error || typeof message.status === "number" && message.status >= 400) {
        const endpoint = (() => {
          try {
            return new URL(pending.url).pathname;
          } catch {
            return pending.url;
          }
        })();
        const rawDetail = message.error || message.data;
        let detail = "";
        if (typeof rawDetail === "string") detail = rawDetail;
        else if (rawDetail !== void 0) {
          try {
            detail = JSON.stringify(rawDetail);
          } catch {
            detail = String(rawDetail);
          }
        }
        if (detail.length > 500) detail = `${detail.slice(0, 500)}...`;
        const statusText = typeof message.status === "number" ? `HTTP ${message.status}` : "request failed";
        pending.reject(new Error(`Google Flow ${statusText}${endpoint ? ` (${endpoint})` : ""}${detail ? `: ${detail}` : ""}`));
      } else {
        pending.resolve(message.data ?? message.result ?? message);
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: "protocol_error", error: safeMessage(error) }));
    }
  });
  socket.on("close", () => {
    if (!assignedCredentialId) return;
    const current = ctx.sockets.get(assignedCredentialId);
    if (current?.socket !== socket) return;
    current.slot.state = "disconnected";
    ctx.sockets.delete(assignedCredentialId);
    for (const [requestId, pending] of ctx.pending) {
      if (pending.credentialId !== assignedCredentialId) continue;
      clearTimeout(pending.timer);
      pending.reject(new Error("Google Flow extension disconnected"));
      ctx.pending.delete(requestId);
    }
    ctx.emitStatus();
  });
}
async function runOnLane(ctx, kind, taskId, preferredCredentialId, executor) {
  const lane = ctx.selectLane(kind, preferredCredentialId);
  const state = ctx.sockets.get(lane.credentialId);
  if (!state) throw new Error("No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.");
  const controller = new AbortController();
  ctx.abortControllers.set(taskId, controller);
  lane.queued += 1;
  ctx.emitLaneTask(taskId, kind, "queued", state.slot, lane, 0);
  return new Promise((resolve, reject) => {
    lane.chain = lane.chain.catch(() => void 0).then(async () => {
      try {
        resolve(await executor(state.slot, lane, controller.signal));
      } catch (error) {
        const cancelled = controller.signal.aborted;
        ctx.emitLaneTask(taskId, kind, cancelled ? "cancelled" : "failed", state.slot, lane, void 0, safeMessage(error));
        reject(error);
      } finally {
        lane.queued = Math.max(0, lane.queued - 1);
        ctx.abortControllers.delete(taskId);
        if (kind === "video") {
          const cooldownMs = runtimeUtils.randomBetween(ctx.videoSubmitDelayMinMs, ctx.videoSubmitDelayMaxMs);
          if (cooldownMs > 0) await new Promise((done) => setTimeout(done, cooldownMs));
        }
      }
    });
  });
}
function proxyRequest(ctx, slot, type, params, timeout, signal) {
  const state = ctx.sockets.get(slot.credentialId);
  if (!state || state.socket.readyState !== ws.WebSocket.OPEN) return Promise.reject(new Error("Google Flow extension disconnected"));
  const url = String(params.url || "");
  if (!protocol.isAllowedFlowUrl(url)) return Promise.reject(new Error("Google Flow URL is not allowed"));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ctx.pending.delete(requestId);
      reject(new Error(`Google Flow request timed out after ${timeout}ms`));
    }, timeout);
    ctx.pending.set(requestId, { credentialId: slot.credentialId, url, resolve, reject, timer });
    signal?.addEventListener("abort", () => {
      const pending = ctx.pending.get(requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      ctx.pending.delete(requestId);
      reject(new Error("Cancelled by user"));
    }, { once: true });
    state.socket.send(JSON.stringify({
      type,
      method: type,
      protocolVersion: ctx.protocolVersion,
      requestId,
      id: requestId,
      sessionSecret: ctx.sessionSecret,
      extensionInstanceId: slot.extensionInstanceId,
      credentialId: slot.credentialId,
      params
    }));
  });
}
async function pollOperations(ctx, slot, initial, taskId, lane, signal) {
  let operations = initial;
  let lastTemporaryError = "";
  for (let attempt = 0; attempt < 84; attempt += 1) {
    await runtimeUtils.sleep(5e3, signal);
    let response;
    try {
      response = await ctx.apiRequest(slot, {
        url: ctx.apiUrl("/v1/video:batchCheckAsyncVideoGenerationStatus"),
        method: "POST",
        body: { operations }
      }, 3e4, signal);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const explicitlyFatal = /INVALID_ARGUMENT|PERMISSION_DENIED|FAILED_PRECONDITION|moderation|safety|quota|credit|model.{0,30}(?:access|unsupported|not available)/i.test(message);
      if (!explicitlyFatal && /HTTP (400|404|409|425|429|500|502|503|504)/i.test(message)) {
        lastTemporaryError = message;
        ctx.emitLaneTask(taskId, "video", "polling", slot, lane, Math.min(25 + Math.round((attempt + 1) / 84 * 68), 93), message);
        continue;
      }
      throw error;
    }
    const parsed = extractFlowOperations(response).map((item) => item.raw);
    if (!parsed.length) continue;
    operations = parsed;
    if (operations.some((item) => operationStatus(item) === "MEDIA_GENERATION_STATUS_FAILED")) throw new Error("Google Flow video operation failed");
    const progress = Math.min(25 + Math.round((attempt + 1) / 84 * 68), 93);
    ctx.emitLaneTask(taskId, "video", "polling", slot, lane, progress);
    if (operations.every((item) => operationStatus(item) === "MEDIA_GENERATION_STATUS_SUCCESSFUL")) return { operations };
  }
  throw new Error(`Google Flow video generation timed out${lastTemporaryError ? `. Last status response: ${lastTemporaryError}` : ""}`);
}
async function pollWorkflowVideo(ctx, slot, operations, taskId, lane, signal) {
  for (let attempt = 0; attempt < 84; attempt += 1) {
    await runtimeUtils.sleep(5e3, signal);
    for (const operation of operations) {
      if (!operation.primaryMediaId) continue;
      let response;
      try {
        response = await ctx.apiRequest(slot, {
          url: ctx.apiUrl(`/v1/media/${operation.primaryMediaId}`, "&clientContext.tool=PINHOLE"),
          method: "GET"
        }, 3e4, signal);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/HTTP (400|404)/i.test(message)) {
          ctx.emitLaneTask(taskId, "video", "polling", slot, lane, Math.min(25 + Math.round((attempt + 1) / 84 * 68), 93), message);
          response = void 0;
        } else {
          throw error;
        }
      }
      const root = response && typeof response === "object" ? response : {};
      const data = root.data && typeof root.data === "object" ? root.data : root;
      const video = data.video && typeof data.video === "object" ? data.video : {};
      const bytes = decodeVerifiedMp4(video.encodedVideo);
      if (bytes) return bytes;
      try {
        const redirect = await proxyRequest(ctx, slot, "trpc_request", {
          url: `${protocol.GOOGLE_FLOW_TRPC_ROOT}/media.getMediaUrlRedirect?name=${encodeURIComponent(operation.primaryMediaId)}`,
          method: "GET",
          headers: { accept: "video/mp4,*/*" },
          responseMode: "final-url"
        }, 3e4, signal);
        const redirectRecord = redirect && typeof redirect === "object" ? redirect : {};
        const finalUrl = typeof redirectRecord.url === "string" ? redirectRecord.url : "";
        if (/^https:\/\/flow-content\.google\/video\//i.test(finalUrl)) {
          return await downloadVideoBytes(finalUrl, signal);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/HTTP (400|404|409|425|429|500|502|503|504)|Failed to fetch|network|REQUEST_FAILED|TRPC_FETCH_FAILED/i.test(message)) throw error;
      }
    }
    ctx.emitLaneTask(taskId, "video", "polling", slot, lane, Math.min(25 + Math.round((attempt + 1) / 84 * 68), 93));
  }
  throw new Error("Google Flow low-priority video generation timed out");
}
async function refreshCredits(ctx, slot) {
  try {
    const response = await ctx.apiRequest(slot, { url: ctx.apiUrl("/v1/credits"), method: "GET" }, 15e3);
    const record = response && typeof response === "object" ? response : {};
    const text = JSON.stringify(record);
    const tier = /PAYGATE_TIER_(ONE|TWO)/.exec(text)?.[0];
    const creditsMatch = /"(?:credits|balance|subscriptionCredits)"\s*:\s*(\d+)/i.exec(text);
    if (tier) slot.tier = tier;
    if (creditsMatch) slot.credits = Number(creditsMatch[1]);
    ctx.emitStatus();
  } catch {
  }
}
class GoogleFlowRuntime extends node_events.EventEmitter {
  protocolVersion = protocol.GOOGLE_FLOW_PROTOCOL_VERSION;
  port;
  options;
  sessionSecret = crypto.randomUUID();
  sockets = /* @__PURE__ */ new Map();
  credentials = /* @__PURE__ */ new Map();
  instanceToCredential = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Map();
  abortControllers = /* @__PURE__ */ new Map();
  lanes = /* @__PURE__ */ new Map();
  bindingsPath;
  mediaCachePath;
  bindings = [];
  mediaCache = {};
  server;
  nextLaneCursor = 0;
  stopped = false;
  imageLanesPerToken = 4;
  videoLanesPerToken = 4;
  imageSubmitDelayMinMs = 1400;
  imageSubmitDelayMaxMs = 1600;
  videoSubmitDelayMinMs = 1500;
  videoSubmitDelayMaxMs = 1800;
  accountStartStaggerMinMs = 1300;
  accountStartStaggerMaxMs = 1500;
  submitGates = {
    image: Promise.resolve(),
    video: Promise.resolve()
  };
  lastSubmitAt = { image: 0, video: 0 };
  lastSubmitCredentialId = { image: "", video: "" };
  constructor(options) {
    super();
    this.options = options;
    this.port = options.port ?? protocol.GOOGLE_FLOW_DEFAULT_PORT;
    this.bindingsPath = path.join(options.userDataPath, "google-flow-bindings.json");
    this.mediaCachePath = path.join(options.userDataPath, "google-flow-media-cache.json");
    this.loadBindings();
    try {
      this.mediaCache = JSON.parse(fs.readFileSync(this.mediaCachePath, "utf8"));
    } catch {
      this.mediaCache = {};
    }
  }
  start() {
    if (this.server) return;
    this.stopped = false;
    this.server = new ws.WebSocketServer({
      host: "127.0.0.1",
      port: this.port,
      maxPayload: 32 * 1024 * 1024,
      verifyClient: ({ origin }) => typeof origin === "string" && origin.startsWith("chrome-extension://")
    });
    this.server.on("connection", (socket) => this.attachSocket(socket));
    this.server.on("error", (error) => this.emit("runtime-error", safeMessage(error)));
    this.emitStatus();
  }
  stop() {
    this.stopped = true;
    for (const controller of this.abortControllers.values()) controller.abort();
    this.abortControllers.clear();
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error("Google Flow runtime stopped"));
    }
    this.pending.clear();
    for (const { socket } of this.sockets.values()) socket.close(1001, "Runtime stopped");
    for (const slot of this.credentials.values()) slot.state = "disconnected";
    this.sockets.clear();
    this.server?.close();
    this.server = void 0;
    this.emitStatus();
  }
  getStatus() {
    const credentials = [...this.credentials.values()].map((slot) => {
      const tokenAgeMs = slot.tokenCapturedAt ? Date.now() - slot.tokenCapturedAt : void 0;
      return {
        ...slot,
        state: slot.state === "ready" && tokenAgeMs && tokenAgeMs > 70 * 6e4 ? "stale" : slot.state,
        tokenAgeMs,
        tokenFingerprint: void 0
      };
    });
    const ready = credentials.filter((item) => item.state === "ready" && this.sockets.has(item.credentialId)).length;
    return {
      running: Boolean(this.server) && !this.stopped,
      port: this.port,
      protocolVersion: this.protocolVersion,
      readyCredentialCount: ready,
      imageLaneCount: ready * this.imageLanesPerToken,
      videoLaneCount: ready * this.videoLanesPerToken,
      extensionPath: this.options.extensionPath,
      credentials
    };
  }
  listCredentials() {
    return this.getStatus().credentials;
  }
  listProjectBindings(longddProjectId) {
    protocol.assertString(longddProjectId, "longddProjectId", 256);
    return this.bindings.filter((binding) => binding.longddProjectId === longddProjectId).map((binding) => {
      const connected = [...this.sockets.values()].find(({ slot }) => slot.ownerScopeId === binding.ownerScopeId);
      return {
        ...binding,
        active: binding.active === true,
        connected: Boolean(connected),
        credentialId: connected?.slot.credentialId,
        extensionInstanceId: connected?.slot.extensionInstanceId
      };
    }).sort((left, right) => Number(right.active) - Number(left.active) || right.createdAt - left.createdAt);
  }
  async createProjectBinding(input) {
    protocol.assertRecord(input, "create project binding payload");
    protocol.assertString(input.longddProjectId, "longddProjectId", 256);
    protocol.assertString(input.credentialId, "credentialId", 128);
    const state = this.sockets.get(input.credentialId);
    if (!state || state.socket.readyState !== ws.WebSocket.OPEN || state.slot.state !== "ready") {
      throw new Error("Tiện ích Google Flow đã chọn hiện không sẵn sàng");
    }
    const binding = await this.createFlowProject(input.longddProjectId, state.slot, void 0, input.title);
    return this.toProjectBindingInfo(binding);
  }
  activateProjectBinding(input) {
    protocol.assertRecord(input, "activate project binding payload");
    protocol.assertString(input.longddProjectId, "longddProjectId", 256);
    protocol.assertString(input.credentialId, "credentialId", 128);
    protocol.assertString(input.flowProjectId, "flowProjectId", 128);
    const state = this.sockets.get(input.credentialId);
    if (!state) throw new Error("Tiện ích Google Flow đã chọn không còn kết nối");
    const binding = this.bindings.find((item) => item.longddProjectId === input.longddProjectId && item.ownerScopeId === state.slot.ownerScopeId && item.flowProjectId === input.flowProjectId);
    if (!binding) throw new Error("Flow project không thuộc dự án và tiện ích đã chọn");
    for (const item of this.bindings) {
      if (item.longddProjectId === input.longddProjectId && item.ownerScopeId === state.slot.ownerScopeId) item.active = item === binding;
    }
    binding.lastCredentialId = state.slot.credentialId;
    binding.lastVerifiedAt = Date.now();
    this.saveBindings();
    return this.toProjectBindingInfo(binding);
  }
  updateSettings(input) {
    const clamp = (value, fallback) => Math.max(1, Math.min(16, Math.round(Number(value) || fallback)));
    const nextImageLanes = clamp(input.imageLanesPerToken, this.imageLanesPerToken);
    const nextVideoLanes = clamp(input.videoLanesPerToken, this.videoLanesPerToken);
    const laneCountsChanged = nextImageLanes !== this.imageLanesPerToken || nextVideoLanes !== this.videoLanesPerToken;
    this.imageLanesPerToken = nextImageLanes;
    this.videoLanesPerToken = nextVideoLanes;
    [this.imageSubmitDelayMinMs, this.imageSubmitDelayMaxMs] = runtimeUtils.normalizeDelayRange(
      input.imageSubmitDelayMinMs,
      input.imageSubmitDelayMaxMs,
      this.imageSubmitDelayMinMs,
      this.imageSubmitDelayMaxMs
    );
    [this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs] = runtimeUtils.normalizeDelayRange(
      input.videoSubmitDelayMinMs,
      input.videoSubmitDelayMaxMs,
      this.videoSubmitDelayMinMs,
      this.videoSubmitDelayMaxMs
    );
    [this.accountStartStaggerMinMs, this.accountStartStaggerMaxMs] = runtimeUtils.normalizeDelayRange(
      input.accountStartStaggerMinMs,
      input.accountStartStaggerMaxMs,
      this.accountStartStaggerMinMs,
      this.accountStartStaggerMaxMs
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
      accountStartStaggerMaxMs: this.accountStartStaggerMaxMs
    };
  }
  async syncReferences(input) {
    protocol.assertRecord(input, "sync references payload");
    protocol.assertString(input.projectId, "projectId", 256);
    if (input.projectTitle !== void 0) protocol.assertString(input.projectTitle, "projectTitle", 80);
    if (!Array.isArray(input.sources) || input.sources.length > 500) throw new Error("Reference sources are invalid");
    const sources = [...new Map(input.sources.map((item) => {
      protocol.assertRecord(item, "reference source");
      protocol.assertString(item.sourceKey, "reference source key", 128);
      protocol.assertString(item.source, "reference source", 4e7);
      return [item.sourceKey, item];
    })).values()];
    if (!sources.length) throw new Error("No reference images to sync");
    const ready = [...this.sockets.values()].filter(({ slot, socket }) => slot.state === "ready" && socket.readyState === ws.WebSocket.OPEN && (!slot.tokenCapturedAt || Date.now() - slot.tokenCapturedAt <= 70 * 6e4));
    if (!ready.length) throw new Error("No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.");
    const credentials = await Promise.all(ready.map(async ({ slot }) => {
      let flowProjectId;
      let syncedReferenceCount = 0;
      let uploadedCount = 0;
      let skippedCount = 0;
      const mediaIdsBySource = {};
      const activityId = `sync-${crypto.randomUUID()}`;
      try {
        const binding = await this.ensureProject(input.projectId, slot, new AbortController().signal, input.projectTitle);
        flowProjectId = binding.flowProjectId;
        this.sendActivityUpdate(slot.credentialId, {
          activityId,
          kind: "sync",
          status: "uploading",
          phase: "checking_media",
          progress: 0,
          message: `Kiểm tra ${sources.length} ảnh tham chiếu`
        });
        const concurrency = Math.max(1, this.imageLanesPerToken);
        let cursor = 0;
        let completed = 0;
        const runNext = async () => {
          const index = cursor;
          cursor += 1;
          if (index >= sources.length) return;
          const item = sources[index];
          const existing = item.mediaIdsByOwnerScope?.[slot.ownerScopeId];
          let uploaded = false;
          const mediaId = await this.resolveMedia({
            source: item.source,
            mediaId: existing?.mediaId,
            ownerScopeId: existing ? slot.ownerScopeId : void 0,
            flowProjectId: existing?.flowProjectId
          }, binding.flowProjectId, slot, new AbortController().signal, () => {
            uploaded = true;
          });
          mediaIdsBySource[item.sourceKey] = mediaId;
          syncedReferenceCount += 1;
          if (uploaded) uploadedCount += 1;
          else skippedCount += 1;
          completed += 1;
          this.sendActivityUpdate(slot.credentialId, {
            activityId,
            kind: "sync",
            status: "uploading",
            phase: uploaded ? "uploading_media" : "checking_media",
            progress: Math.round(completed / sources.length * 100),
            message: `Đã có ${skippedCount} · tải mới ${uploadedCount} · ${completed}/${sources.length}`
          });
          await runNext();
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => runNext()));
        this.sendActivityUpdate(slot.credentialId, {
          activityId,
          kind: "sync",
          status: "completed",
          phase: "completed",
          progress: 100,
          message: `Hoàn tất · tải mới ${uploadedCount} · bỏ qua ${skippedCount}`
        });
        return {
          credentialId: slot.credentialId,
          ownerScopeId: slot.ownerScopeId,
          flowProjectId,
          syncedReferenceCount,
          uploadedCount,
          skippedCount,
          mediaIdsBySource
        };
      } catch (error) {
        this.sendActivityUpdate(slot.credentialId, {
          activityId,
          kind: "sync",
          status: "failed",
          phase: "failed",
          message: safeMessage(error)
        });
        return {
          credentialId: slot.credentialId,
          ownerScopeId: slot.ownerScopeId,
          flowProjectId,
          syncedReferenceCount,
          uploadedCount,
          skippedCount,
          mediaIdsBySource,
          error: safeMessage(error)
        };
      }
    }));
    return {
      credentialCount: ready.length,
      sourceCount: sources.length,
      syncedReferenceCount: credentials.reduce((total, item) => total + item.syncedReferenceCount, 0),
      uploadedCount: credentials.reduce((total, item) => total + item.uploadedCount, 0),
      skippedCount: credentials.reduce((total, item) => total + item.skippedCount, 0),
      credentials
    };
  }
  cancelTask(taskId) {
    const controller = this.abortControllers.get(taskId);
    if (!controller) return false;
    controller.abort();
    this.emitTask({ taskId, kind: "video", status: "cancelled", message: "Cancelled by user" });
    return true;
  }
  async generateImage(input) {
    validateImageInput(input);
    const taskId = input.taskId || crypto.randomUUID();
    return this.runOnLane("image", taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      const hasMediaInput = Boolean(input.baseImage || input.references?.length);
      const reportUpload = () => this.emitLaneTask(taskId, "image", "uploading", slot, lane, 20, void 0, "uploading_media");
      for (let attempt = 0; ; attempt += 1) {
        const forceReupload = attempt > 0;
        if (hasMediaInput) this.emitLaneTask(taskId, "image", "uploading", slot, lane, 10, void 0, "checking_media");
        const baseMediaId = input.baseImage ? await this.resolveMedia(input.baseImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : void 0;
        const referenceIds = await Promise.all((input.references || []).slice(0, 10).map((ref) => this.resolveMedia(ref, binding.flowProjectId, slot, signal, reportUpload, forceReupload)));
        if (hasMediaInput) this.emitLaneTask(taskId, "image", "uploading", slot, lane, 30, void 0, "media_ready");
        await this.reserveSubmitWindow(slot.credentialId, "image", signal);
        this.emitLaneTask(taskId, "image", "submitting", slot, lane, 35);
        const context = this.clientContext(binding.flowProjectId, slot.tier);
        const imageInputs = [
          ...baseMediaId ? [{ name: baseMediaId, imageInputType: "IMAGE_INPUT_TYPE_BASE_IMAGE" }] : [],
          ...referenceIds.map((name) => ({ name, imageInputType: "IMAGE_INPUT_TYPE_REFERENCE" }))
        ];
        const now = Date.now();
        const request = {
          clientContext: { ...context, sessionId: `;${now}` },
          seed: now % 1e6,
          structuredPrompt: { parts: [{ text: input.prompt }] },
          imageAspectRatio: flowImageRatio(input.aspectRatio),
          imageModelName: GOOGLE_FLOW_IMAGE_MODELS[input.model] || input.model || "GEM_PIX_2"
        };
        if (imageInputs.length) request.imageInputs = imageInputs;
        const body = { clientContext: context, requests: [request] };
        if (imageInputs.length) {
          body.mediaGenerationContext = { batchId: crypto.randomUUID() };
          body.useNewMedia = true;
        }
        let response;
        try {
          response = await this.apiRequest(slot, {
            url: this.apiUrl(`/v1/projects/${encodeURIComponent(binding.flowProjectId)}/flowMedia:batchGenerateImages`),
            method: "POST",
            body,
            captchaAction: "IMAGE_GENERATION",
            activityId: taskId,
            activityKind: "image"
          }, 18e4, signal);
        } catch (error) {
          if (attempt === 0 && hasMediaInput && !signal.aborted && this.isStaleMediaError(error)) continue;
          throw error;
        }
        const mediaId = extractFlowMediaId(response);
        const remoteUrl = extractFlowUrl(response);
        if (!mediaId && !remoteUrl) throw new Error("Google Flow image response contained no media ID or URL");
        this.sendActivityUpdate(slot.credentialId, {
          activityId: taskId,
          kind: "image",
          status: "completed",
          progress: 100,
          thumbnailUrl: remoteUrl,
          outputUrl: remoteUrl,
          mediaId
        });
        this.emitLaneTask(taskId, "image", "completed", slot, lane, 100);
        return {
          taskId,
          provider: "googleflow",
          credentialId: slot.credentialId,
          accountId: slot.accountId,
          ownerScopeId: slot.ownerScopeId,
          flowProjectId: binding.flowProjectId,
          mediaId,
          remoteUrl
        };
      }
    });
  }
  async generateVideo(input) {
    validateVideoInput(input);
    const taskId = input.taskId || crypto.randomUUID();
    return this.runOnLane("video", taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      const reportUpload = () => this.emitLaneTask(taskId, "video", "uploading", slot, lane, 12, void 0, "uploading_media");
      const hasMediaInput = Boolean(input.references?.length || input.startImage || input.endImage);
      let submit;
      for (let attempt = 0; ; attempt += 1) {
        const forceReupload = attempt > 0;
        this.emitLaneTask(taskId, "video", "uploading", slot, lane, 8, void 0, "checking_media");
        const refs = await Promise.all((input.references || []).slice(0, 3).map((ref) => this.resolveMedia(ref, binding.flowProjectId, slot, signal, reportUpload, forceReupload)));
        const startId = input.startImage ? await this.resolveMedia(input.startImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : void 0;
        const endId = input.endImage ? await this.resolveMedia(input.endImage, binding.flowProjectId, slot, signal, reportUpload, forceReupload) : void 0;
        if (!refs.length && !startId) throw new Error("Google Flow requires a start image or reference images for video generation");
        this.emitLaneTask(taskId, "video", "uploading", slot, lane, 18, void 0, "media_ready");
        const mode = refs.length ? "reference" : endId ? "startEnd" : "frame";
        const resolvedVideoModel = resolveFlowVideoModel(slot.tier, mode, input.aspectRatio, input.model, input.duration);
        const endpoint = flowVideoEndpoint(mode);
        console.log("[GoogleFlow] Resolved video model", {
          requestedModel: input.model,
          resolvedVideoModel,
          mode,
          endpoint,
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          accountTier: slot.tier
        });
        const isOmniFlash = isOmniFlashRequest(input.model);
        const request = {
          aspectRatio: flowVideoRatio(input.aspectRatio),
          seed: Math.floor(Date.now() / 1e3) % 1e4,
          textInput: { structuredPrompt: { parts: [{ text: input.prompt }] } },
          videoModelKey: resolvedVideoModel,
          metadata: { sceneId: input.sceneId }
        };
        if (isOmniFlash) request.outputSpec = { resolution: "VIDEO_RESOLUTION_720P" };
        if (refs.length) request.referenceImages = refs.map((mediaId2) => ({ mediaId: mediaId2, imageUsageType: "IMAGE_USAGE_TYPE_ASSET" }));
        else request.startImage = { mediaId: startId };
        if (endId) request.endImage = { mediaId: endId };
        await this.reserveSubmitWindow(slot.credentialId, "video", signal);
        this.emitLaneTask(taskId, "video", "submitting", slot, lane, 20);
        try {
          submit = await this.apiRequest(slot, {
            url: this.apiUrl(endpoint),
            method: "POST",
            captchaAction: "VIDEO_GENERATION",
            activityId: taskId,
            activityKind: "video",
            body: {
              mediaGenerationContext: isOmniFlash ? { batchId: crypto.randomUUID(), audioFailurePreference: "BLOCK_SILENCED_VIDEOS" } : { batchId: crypto.randomUUID() },
              clientContext: this.clientContext(binding.flowProjectId, slot.tier),
              requests: [request],
              useV2ModelConfig: true
            }
          }, 9e4, signal);
        } catch (error) {
          if (attempt === 0 && hasMediaInput && !signal.aborted && this.isStaleMediaError(error)) continue;
          throw error;
        }
        break;
      }
      const operations = extractFlowOperations(submit);
      if (!operations.length) throw new Error("Google Flow video response contained no operation");
      this.emitLaneTask(taskId, "video", "polling", slot, lane, 25);
      const result = operations.every((item) => item.workflowMode) ? await this.pollWorkflowVideo(slot, operations, taskId, lane, signal) : await this.pollOperations(slot, operations.map((item) => item.raw), taskId, lane, signal);
      const mediaId = extractFlowMediaId(result);
      let remoteUrl = extractFlowUrl(result);
      let localUrl;
      if (Buffer.isBuffer(result)) {
        localUrl = saveVideoBytes(this.options.mediaRoot, result, mediaId || crypto.randomUUID());
      } else if (remoteUrl) {
        this.emitLaneTask(taskId, "video", "downloading", slot, lane, 96);
        localUrl = await downloadVideo(this.options.mediaRoot, remoteUrl, mediaId || crypto.randomUUID(), signal);
      }
      if (!localUrl && !remoteUrl) throw new Error("Google Flow video completed without a usable result");
      const thumbnailUrl = localUrl ? await createVideoThumbnail(this.options.mediaRoot, localUrl, taskId) : void 0;
      this.sendActivityUpdate(slot.credentialId, {
        activityId: taskId,
        kind: "video",
        status: "completed",
        progress: 100,
        thumbnailUrl,
        outputUrl: remoteUrl,
        mediaId
      });
      this.emitLaneTask(taskId, "video", "completed", slot, lane, 100);
      return {
        taskId,
        provider: "googleflow",
        credentialId: slot.credentialId,
        accountId: slot.accountId,
        ownerScopeId: slot.ownerScopeId,
        flowProjectId: binding.flowProjectId,
        mediaId,
        remoteUrl,
        localUrl
      };
    });
  }
  async upscaleVideo(input) {
    if (!protocol.isUuid(input.mediaId)) throw new Error("A UUID video media ID is required for upscale");
    const taskId = input.taskId || crypto.randomUUID();
    return this.runOnLane("video", taskId, input.preferredCredentialId, async (slot, lane, signal) => {
      const binding = await this.ensureProject(input.projectId, slot, signal);
      this.emitLaneTask(taskId, "video", "submitting", slot, lane, 10);
      await this.reserveSubmitWindow(slot.credentialId, "video", signal);
      const submit = await this.apiRequest(slot, {
        url: this.apiUrl("/v1/video:batchAsyncGenerateVideoUpsampleVideo"),
        method: "POST",
        captchaAction: "VIDEO_GENERATION",
        activityId: taskId,
        activityKind: "upscale",
        body: {
          clientContext: this.clientContext(binding.flowProjectId, slot.tier),
          requests: [{
            aspectRatio: flowVideoRatio(input.aspectRatio),
            resolution: "VIDEO_RESOLUTION_4K",
            seed: Date.now() % 1e5,
            metadata: { sceneId: input.sceneId },
            videoInput: { mediaId: input.mediaId },
            videoModelKey: "veo_3_1_upsampler_4k"
          }]
        }
      }, 9e4, signal);
      const operations = extractFlowOperations(submit);
      if (!operations.length) throw new Error("Google Flow upscale response contained no operation");
      const result = operations.every((item) => item.workflowMode) ? await this.pollWorkflowVideo(slot, operations, taskId, lane, signal) : await this.pollOperations(slot, operations.map((item) => item.raw), taskId, lane, signal);
      const mediaId = extractFlowMediaId(result) || input.mediaId;
      const remoteUrl = extractFlowUrl(result);
      const localUrl = Buffer.isBuffer(result) ? saveVideoBytes(this.options.mediaRoot, result, mediaId) : remoteUrl ? await downloadVideo(this.options.mediaRoot, remoteUrl, mediaId, signal) : void 0;
      if (!localUrl && !remoteUrl) throw new Error("Google Flow upscale completed without a usable result");
      const thumbnailUrl = localUrl ? await createVideoThumbnail(this.options.mediaRoot, localUrl, taskId) : void 0;
      this.sendActivityUpdate(slot.credentialId, {
        activityId: taskId,
        kind: "upscale",
        status: "completed",
        progress: 100,
        thumbnailUrl,
        outputUrl: remoteUrl,
        mediaId
      });
      this.emitLaneTask(taskId, "video", "completed", slot, lane, 100);
      return {
        taskId,
        provider: "googleflow",
        credentialId: slot.credentialId,
        accountId: slot.accountId,
        ownerScopeId: slot.ownerScopeId,
        flowProjectId: binding.flowProjectId,
        mediaId,
        remoteUrl,
        localUrl
      };
    });
  }
  // Entry point for the in-app CDP-driven Chrome login transport (see
  // browser-session/fake-socket.ts). Accepts anything duck-typed like a
  // `ws` WebSocket — attachSocket() only ever touches readyState/send/close
  // and the 'message'/'close' events, so this needs no changes below.
  registerInAppConnection(socket) {
    this.attachSocket(socket);
  }
  // Removing an in-app account should make it disappear from getStatus()
  // entirely, not just go 'disconnected' — attachSocket()'s close handler
  // only drops the live socket, since the extension flow never needed a way
  // to permanently forget a credential (users don't "uninstall" a browser tab).
  forgetInAppCredential(extensionInstanceId) {
    const credentialId = this.instanceToCredential.get(extensionInstanceId);
    if (!credentialId) return;
    const state = this.sockets.get(credentialId);
    state?.socket.close(4e3, "Account removed");
    this.sockets.delete(credentialId);
    this.credentials.delete(credentialId);
    this.instanceToCredential.delete(extensionInstanceId);
    this.emitStatus();
  }
  get socketContext() {
    return this;
  }
  attachSocket(socket) {
    attachSocket(this.socketContext, socket);
  }
  runOnLane(kind, taskId, preferredCredentialId, executor) {
    return runOnLane(this.socketContext, kind, taskId, preferredCredentialId, executor);
  }
  selectLane(kind, preferredCredentialId) {
    const ready = [...this.sockets.values()].filter(({ slot, socket }) => slot.state === "ready" && socket.readyState === ws.WebSocket.OPEN && (!slot.tokenCapturedAt || Date.now() - slot.tokenCapturedAt <= 70 * 6e4));
    if (!ready.length) throw new Error("No ready Google Flow extension. Open Google Flow in Chrome and connect the extension.");
    const preferred = preferredCredentialId ? ready.filter(({ slot }) => slot.credentialId === preferredCredentialId) : [];
    const eligible = preferred.length ? preferred : ready;
    const all = [];
    for (const { slot } of eligible) {
      const key = `${kind}:${slot.credentialId}`;
      let lanes = this.lanes.get(key);
      const count = kind === "image" ? this.imageLanesPerToken : this.videoLanesPerToken;
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
  async ensureProject(longddProjectId, slot, signal, requestedTitle) {
    const existing = this.bindings.find((item) => item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId && item.active === true) || this.bindings.find((item) => item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId);
    if (existing) {
      existing.lastCredentialId = slot.credentialId;
      existing.lastVerifiedAt = Date.now();
      this.saveBindings();
      return existing;
    }
    return this.createFlowProject(longddProjectId, slot, signal, requestedTitle);
  }
  async createFlowProject(longddProjectId, slot, signal, requestedTitle) {
    const cleanTitle = requestedTitle?.replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, 80);
    const projectTitle = cleanTitle || `LONGDD ${longddProjectId}`;
    const response = await this.proxyRequest(slot, "trpc_request", {
      url: `${protocol.GOOGLE_FLOW_TRPC_ROOT}/project.createProject`,
      method: "POST",
      headers: { "content-type": "application/json", accept: "*/*" },
      body: { json: { projectTitle, toolName: "PINHOLE" } }
    }, 3e4, signal);
    const flowProjectId = extractFlowProjectId(response);
    if (!flowProjectId) throw new Error("Google Flow did not return a project ID");
    for (const item of this.bindings) {
      if (item.longddProjectId === longddProjectId && item.ownerScopeId === slot.ownerScopeId) item.active = false;
    }
    const binding = {
      longddProjectId,
      flowProjectId,
      ownerScopeId: slot.ownerScopeId,
      accountId: slot.accountId,
      lastCredentialId: slot.credentialId,
      createdAt: Date.now(),
      lastVerifiedAt: Date.now(),
      title: projectTitle,
      active: true
    };
    this.bindings.push(binding);
    this.saveBindings();
    return binding;
  }
  toProjectBindingInfo(binding) {
    const connected = [...this.sockets.values()].find(({ slot }) => slot.ownerScopeId === binding.ownerScopeId);
    return {
      ...binding,
      active: binding.active === true,
      connected: Boolean(connected),
      credentialId: connected?.slot.credentialId,
      extensionInstanceId: connected?.slot.extensionInstanceId
    };
  }
  async resolveMedia(ref, flowProjectId, slot, signal, onUpload, forceReupload = false) {
    const sameOwner = Boolean(ref.ownerScopeId) && ref.ownerScopeId === slot.ownerScopeId;
    const sameProject = Boolean(ref.flowProjectId) && ref.flowProjectId === flowProjectId;
    const fingerprint = crypto.createHash("sha256").update(`${slot.ownerScopeId}\0${flowProjectId}\0${ref.source}`).digest("hex");
    if (forceReupload) {
      if (this.mediaCache[fingerprint]) {
        delete this.mediaCache[fingerprint];
        try {
          fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), "utf8");
        } catch {
        }
      }
    } else if (ref.mediaId && protocol.isUuid(ref.mediaId) && sameOwner && sameProject) {
      if (this.mediaCache[fingerprint] !== ref.mediaId) {
        this.mediaCache[fingerprint] = ref.mediaId;
        try {
          fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), "utf8");
        } catch {
        }
      }
      return ref.mediaId;
    }
    const cached = forceReupload ? void 0 : this.mediaCache[fingerprint];
    if (protocol.isUuid(cached)) {
      return cached;
    }
    onUpload?.();
    const { base64, mimeType, fileName } = await readImageSource(this.options.mediaRoot, ref.source, signal);
    const response = await this.apiRequest(slot, {
      url: this.apiUrl("/v1/flow/uploadImage"),
      method: "POST",
      body: { clientContext: { projectId: flowProjectId, tool: "PINHOLE" }, fileName, imageBytes: base64, isHidden: false, isUserUploaded: true, mimeType }
    }, 9e4, signal);
    const mediaId = extractFlowMediaId(response);
    if (!mediaId) throw new Error("Google Flow upload did not return a UUID media ID");
    this.mediaCache[fingerprint] = mediaId;
    fs.writeFileSync(this.mediaCachePath, JSON.stringify(this.mediaCache, null, 2), "utf8");
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
  isStaleMediaError(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/quota|credit|429|RESOURCE_EXHAUSTED|safety|moderation|blocked|captcha|permission|PERMISSION_DENIED|UNAUTHENTICATED|401|403|404|NOT_FOUND/i.test(message)) return false;
    return /HTTP 400|INVALID_ARGUMENT/i.test(message);
  }
  async reserveSubmitWindow(credentialId, kind, signal) {
    const previousGate = this.submitGates[kind];
    let releaseGate = () => {
    };
    this.submitGates[kind] = new Promise((resolve) => {
      releaseGate = resolve;
    });
    await previousGate;
    try {
      const [submitMinMs, submitMaxMs] = kind === "image" ? [this.imageSubmitDelayMinMs, this.imageSubmitDelayMaxMs] : [this.videoSubmitDelayMinMs, this.videoSubmitDelayMaxMs];
      const hasPreviousSubmit = this.lastSubmitAt[kind] > 0;
      const switchedAccount = Boolean(
        this.lastSubmitCredentialId[kind] && this.lastSubmitCredentialId[kind] !== credentialId
      );
      const submitDelayMs = hasPreviousSubmit ? runtimeUtils.randomBetween(submitMinMs, submitMaxMs) : 0;
      const accountDelayMs = switchedAccount ? runtimeUtils.randomBetween(this.accountStartStaggerMinMs, this.accountStartStaggerMaxMs) : 0;
      const allowedAt = this.lastSubmitAt[kind] + Math.max(submitDelayMs, accountDelayMs);
      if (allowedAt > Date.now()) await runtimeUtils.sleep(allowedAt - Date.now(), signal);
      this.lastSubmitAt[kind] = Date.now();
      this.lastSubmitCredentialId[kind] = credentialId;
    } finally {
      releaseGate();
    }
  }
  apiRequest(slot, params, timeout, signal) {
    return this.proxyRequest(slot, "api_request", { headers: { "content-type": "application/json", accept: "*/*" }, ...params }, timeout, signal);
  }
  proxyRequest(slot, type, params, timeout, signal) {
    return proxyRequest(this.socketContext, slot, type, params, timeout, signal);
  }
  pollOperations(slot, initial, taskId, lane, signal) {
    return pollOperations(this.socketContext, slot, initial, taskId, lane, signal);
  }
  pollWorkflowVideo(slot, operations, taskId, lane, signal) {
    return pollWorkflowVideo(this.socketContext, slot, operations, taskId, lane, signal);
  }
  refreshCredits(slot) {
    return refreshCredits(this.socketContext, slot);
  }
  clientContext(projectId, tier) {
    return {
      projectId,
      recaptchaContext: { applicationType: "RECAPTCHA_APPLICATION_TYPE_WEB", token: "" },
      sessionId: `;${Date.now()}`,
      tool: "PINHOLE",
      userPaygateTier: tier || "PAYGATE_TIER_TWO"
    };
  }
  apiUrl(endpoint, extra = "") {
    return `${protocol.GOOGLE_FLOW_API_ROOT}${endpoint}?key=${protocol.GOOGLE_FLOW_BROWSER_API_KEY}${extra}`;
  }
  emitLaneTask(taskId, kind, status, slot, lane, progress, message, phase) {
    this.emitTask({ taskId, kind, status, progress, credentialId: slot.credentialId, extensionInstanceId: slot.extensionInstanceId, laneSlot: lane.slot, totalLanes: this.getStatus()[kind === "image" ? "imageLaneCount" : "videoLaneCount"], submittedAt: status === "submitting" ? Date.now() : void 0, message, phase });
    this.sendActivityUpdate(slot.credentialId, { activityId: taskId, kind, status, progress, message, phase });
  }
  sendActivityUpdate(credentialId, update) {
    const state = this.sockets.get(credentialId);
    if (!state || state.socket.readyState !== ws.WebSocket.OPEN) return;
    try {
      state.socket.send(JSON.stringify({ type: "generation_update", ...update }));
    } catch {
    }
  }
  emitTask(event) {
    this.emit("task", event);
  }
  emitStatus() {
    this.emit("status", this.getStatus());
  }
  hashIdentity(value) {
    return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
  }
  loadBindings() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.bindingsPath, "utf8"));
      this.bindings = Array.isArray(parsed) ? parsed : [];
      const groups = /* @__PURE__ */ new Map();
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
    } catch {
      this.bindings = [];
    }
  }
  saveBindings() {
    fs.mkdirSync(path.dirname(this.bindingsPath), { recursive: true });
    fs.writeFileSync(this.bindingsPath, JSON.stringify(this.bindings, null, 2), "utf8");
  }
}
exports.GoogleFlowRuntime = GoogleFlowRuntime;
exports.safeMessage = safeMessage;
