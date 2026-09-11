/**
 * Flow's `batchexecute` wire format — the transport Google moved to in the
 * September 2026 migration.
 *
 * The old world was a REST call to aisandbox-pa carrying a `Bearer ya29.…` that
 * the bridge read off labs.google's session endpoint. That endpoint now answers
 * ACCESS_TOKEN_REFRESH_NEEDED and hands back a dead token, so every account
 * stops working the hour its last good token lapses. The rebuilt frontend on
 * flow.google.com signs each call with the session cookie plus a per-page `at`
 * token instead, against one batchexecute endpoint.
 *
 * Nothing here touches the network. This module only builds request envelopes
 * and reads responses; issuing the request is the tab's job, because the `at`
 * token and the single-use reCAPTCHA only exist inside the page.
 *
 * Wire shape:
 *   f.req = [[[rpcid, "<inner payload as a JSON string>", null, "generic"]]]
 * and the reply is a `)]}'` sentinel followed by length-prefixed chunks of
 *   ["wrb.fr", rpcid, "<payload as a JSON string>", …]
 *
 * The rpc ids, slot positions and the constants below are not guessable — they
 * come from FlowKit (github.com/crisng95/flowkit), which captured them off real
 * UI actions. Every comment marking a slot is load-bearing: a reference image in
 * the wrong position is accepted and then silently ignored.
 */

export const FLOW_BATCH_PATH = '/_/AiSandboxAngularFrontend/data/batchexecute';
export const FLOW_MEDIA_HOST = 'flow-content.google';

export const RPC_GEN_IMAGE = 'ogiZ0b';
export const RPC_GEN_VIDEO = 'eb1hJf';
export const RPC_OPERATION = 'jwpduf';
export const RPC_PROJECT_MEDIA = 'Zzl0ze';
export const RPC_MEDIA = 'as29s';
export const RPC_UPLOAD_IMAGE = 'maseQ';

/**
 * Replaced with a freshly minted reCAPTCHA token immediately before the request
 * leaves. It has to be a placeholder rather than a real token because the mint
 * must happen in the page moments before the call — a replayed token comes back
 * PUBLIC_ERROR_UNUSUAL_ACTIVITY.
 */
export const CAPTCHA_SLOT = '__CAPTCHA__';

/** Surface id the web client stamps on every call. Constant in every capture. */
const SURFACE_ID = 22;

/** Terminal state of an operation. Anything else means still working. */
export const STATUS_DONE = 'CAE';

/**
 * Outcome code 4 carries a message like "Media not found." — but it is NOT a
 * verdict: jobs that report it still finish and the media appears in the project
 * listing seconds later. Quote it on a timeout, never stop waiting on it.
 */
const OUTCOME_COMPLAINT = 4;

/**
 * Crop box on the reference image, verbatim from the UI when nothing was
 * reframed by hand: a hair inside the edges, spanning 128/129 of the frame.
 */
const FULL_FRAME_CROP: Array<number | null> = [null, 0.0038759689922481244, 1, 0.9961240310077519];

/** A reference image carries its media id FIRST and a type flag four slots later. */
const REF_TYPE_IMAGE = 1;

/** Wire names this path accepts. Everything else is rejected outright by Flow. */
export const BATCH_IMAGE_MODELS = new Set(['GEM_PIX_2', 'NARWHAL']);
const DEFAULT_IMAGE_MODEL = 'GEM_PIX_2';

/**
 * Image aspect slots. This was mistaken for a variant count at first — 1 means
 * square, which is why a `count=1` request looked like it was working.
 */
export const IMAGE_ASPECT: Record<string, number> = {
  '1:1': 1,          // 1024x1024
  '9:16': 2,         // 768x1376
  '16:9': 3,         // 1376x768
  '3:4': 4,          // 896x1200
  '4:3': 5,          // 1200x896
};

/**
 * Video aspect does NOT share the image encoding: here 1 is portrait, where for
 * an image 1 is square.
 */
export const VIDEO_ASPECT: Record<string, number> = {
  '9:16': 1,
  '16:9': 2,
};

/**
 * Video models this path accepts. The REST-era keys encoded tier, quality and
 * aspect in the name (`…_portrait`, `…_fl`, `…_relaxed`); aspect is its own slot
 * now and the suffixed names are rejected, so only the tier/quality intent
 * survives the mapping.
 */
export const BATCH_VIDEO_MODELS = new Set([
  'veo_3_1_i2v_lite_low_priority',
  'veo_3_1_i2v_lite',
  'veo_3_1_i2v_s_fast_ultra',
]);
const DEFAULT_VIDEO_MODEL = 'veo_3_1_i2v_lite_low_priority';

export interface RpcResult {
  rpcid: string;
  data: unknown;
  error?: unknown;
}

export interface GeneratedImage {
  mediaId: string;
  url: string;
}

export interface BatchOperation {
  operationId: string;
  projectId?: string;
  status?: string;
  /** A complaint attached to the operation. Survivable — diagnostic only. */
  complaint?: string;
}

export interface MediaUrls {
  mediaId: string;
  video?: string;
  image?: string;
}

// ==================== model / aspect resolvers ====================

/** Nickname or wire name in, wire name out; anything unknown coerces. */
export function resolveBatchImageModel(key: string | undefined): string {
  const value = (key || '').trim();
  if (BATCH_IMAGE_MODELS.has(value)) return value;
  // The names the rest of the app speaks.
  if (/nano.?banana.?pro|GEM_PIX/i.test(value)) return 'GEM_PIX_2';
  if (/nano.?banana.?2|NARWHAL/i.test(value)) return 'NARWHAL';
  return DEFAULT_IMAGE_MODEL;
}

export function resolveBatchVideoModel(key: string | undefined): string {
  const value = (key || '').trim();
  if (BATCH_VIDEO_MODELS.has(value)) return value;
  if (/ultra/i.test(value)) return 'veo_3_1_i2v_s_fast_ultra';
  if (/lite_low_priority|lower.?priority/i.test(value)) return 'veo_3_1_i2v_lite_low_priority';
  if (/lite/i.test(value)) return 'veo_3_1_i2v_lite';
  return DEFAULT_VIDEO_MODEL;
}

/**
 * Ratios the app speaks are a wider set than the five slots this path has, so
 * unknown ones are grouped exactly the way flowImageRatio groups them for the
 * REST path — otherwise the same job would be framed differently depending on
 * which transport happened to carry it.
 */
export function resolveImageAspect(aspect: string | undefined): number {
  const value = (aspect || '').trim();
  const exact = IMAGE_ASPECT[value];
  if (exact) return exact;
  if (value === '2:3') return IMAGE_ASPECT['9:16'];
  return IMAGE_ASPECT['16:9'];
}

export function resolveVideoAspect(aspect: string | undefined): number {
  const value = (aspect || '').trim();
  if (value === '9:16' || value === '3:4' || value === '2:3') return VIDEO_ASPECT['9:16'];
  return VIDEO_ASPECT['16:9'];
}

// ==================== envelope codec ====================

/** Wrap an inner payload as the `f.req` string batchexecute expects. */
export function buildEnvelope(rpcid: string, inner: unknown): string {
  return JSON.stringify([[[rpcid, JSON.stringify(inner), null, 'generic']]]);
}

/**
 * Unwrap the `)]}'` sentinel and the length-prefixed chunks.
 *
 * The chunk lengths count characters, but a payload can disagree with them by a
 * byte or two once escapes are involved, so the JSON is decoded by scanning for
 * balanced brackets rather than by trusting the prefix.
 */
export function parseEnvelope(text: string): RpcResult[] {
  if (!text) return [];
  const body = text.startsWith(")]}'") ? text.slice(text.indexOf('\n') + 1) : text;
  const results: RpcResult[] = [];
  let index = 0;
  while (index < body.length) {
    const start = body.indexOf('[', index);
    if (start === -1) break;
    const decoded = decodeArrayAt(body, start);
    if (!decoded) {
      // Step past this `[` and keep scanning — a chunk boundary landing
      // mid-token must not cost us the envelopes that follow it.
      index = start + 1;
      continue;
    }
    index = decoded.end;
    if (!Array.isArray(decoded.value)) continue;
    for (const entry of decoded.value) {
      if (!Array.isArray(entry) || entry[0] !== 'wrb.fr') continue;
      const rpcid = typeof entry[1] === 'string' ? entry[1] : '?';
      const payload = entry.length > 2 ? entry[2] : null;
      if (payload === null || payload === undefined) {
        // Index 5 is the error slot; it holds `[5]`-style codes, not text.
        results.push({ rpcid, data: null, error: entry.length > 5 ? entry[5] : true });
        continue;
      }
      results.push({ rpcid, data: typeof payload === 'string' ? safeJsonParse(payload) : payload });
    }
  }
  return results;
}

/**
 * Decode the JSON array starting at `start`, returning where it ended.
 *
 * JSON.parse cannot be pointed at an offset, so the extent is found by counting
 * brackets while skipping over string literals (which may contain brackets and
 * escaped quotes of their own).
 */
function decodeArrayAt(text: string, start: number): { value: unknown; end: number } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        try {
          return { value: JSON.parse(text.slice(start, i + 1)), end: i + 1 };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export class FlowRpcError extends Error {
  // Declared and assigned rather than a parameter property: this module is run
  // directly by `node --experimental-strip-types` in its test, which rejects the
  // shorthand.
  readonly rpcid: string;
  readonly detail: unknown;

  constructor(rpcid: string, detail: unknown) {
    super(`Google Flow RPC ${rpcid} lỗi: ${JSON.stringify(detail)?.slice(0, 300)}`);
    this.rpcid = rpcid;
    this.detail = detail;
  }
}

/** The payload of the first matching envelope, or throw what went wrong. */
export function firstPayload(text: string, rpcid: string): unknown {
  const results = parseEnvelope(text);
  for (const result of results) {
    if (result.rpcid !== rpcid) continue;
    if (result.error !== undefined) throw new FlowRpcError(rpcid, result.error);
    return result.data;
  }
  throw new Error(`Không có envelope ${rpcid} trong phản hồi (${results.length} envelope khác)`);
}

// ==================== request builders ====================

/** Client-side request ids. The UI sends them upper-case; match it. */
function clientUuid(): string {
  // randomUUID is available on Node 19+ and in Electron's main process.
  return globalThis.crypto.randomUUID().toUpperCase();
}

/** The surface/project/captcha envelope every generate call repeats. */
function context(projectId: string): unknown[] {
  return [null, SURFACE_ID, null, null, null, projectId, null, null, null, null, [CAPTCHA_SLOT, 1]];
}

function reference(mediaId: string): unknown[] {
  return [mediaId, null, null, null, REF_TYPE_IMAGE];
}

/**
 * One request item per variant, exactly as the REST payload did it. There is no
 * "how many" field: Flow returns one image per item, so `count` replicates the
 * item under fresh seeds.
 */
export function imageRequest(input: {
  prompt: string;
  projectId: string;
  count?: number;
  aspect?: string;
  seed?: number;
  model?: string;
  referenceMediaIds?: string[];
}): string {
  const ratio = resolveImageAspect(input.aspect);
  const model = resolveBatchImageModel(input.model);
  const base = input.seed ?? Math.floor(Math.random() * 1_000_000_000) + 1;
  const refs = (input.referenceMediaIds || []).map(reference);
  const items: unknown[] = [];
  for (let index = 0; index < Math.max(1, input.count ?? 1); index += 1) {
    items.push([
      null, null, refs.length ? refs : null, base + index * 9973, ratio, model, null,
      context(input.projectId), [[[input.prompt]]], null, null, null,
      clientUuid(), clientUuid(),
    ]);
  }
  return buildEnvelope(RPC_GEN_IMAGE, [null, items, 1, context(input.projectId), [clientUuid()]]);
}

export function videoRequest(input: {
  prompt: string;
  projectId: string;
  sourceMediaId: string;
  aspect?: string;
  model?: string;
  crop?: Array<number | null>;
}): string {
  const inner = [
    [[
      [null, null, [[[input.prompt]]]],
      resolveBatchVideoModel(input.model),
      resolveVideoAspect(input.aspect),
      null,
      [null, input.sourceMediaId, null, null, null, input.crop ?? FULL_FRAME_CROP],
      [null, null, null, null, clientUuid(), clientUuid()],
    ]],
    context(input.projectId),
    [clientUuid(), 2],
  ];
  return buildEnvelope(RPC_GEN_VIDEO, inner);
}

/**
 * Put a local image into the project so it can be used as a reference. The bytes
 * ride inside the RPC as plain base64 — no data: prefix, no separate upload
 * endpoint — and the call carries a captcha like a generate does.
 */
export function uploadRequest(input: {
  imageBase64: string;
  projectId: string;
  mimeType?: string;
  fileName?: string;
}): string {
  return buildEnvelope(RPC_UPLOAD_IMAGE, [
    context(input.projectId), input.imageBase64, input.mimeType || 'image/jpeg', 1,
    null, null, null, null, input.fileName || 'upload.jpg', null, clientUuid(), clientUuid(),
  ]);
}

export function operationRequest(operationId: string): string {
  return buildEnvelope(RPC_OPERATION, [null, null, [[operationId]]]);
}

export function projectMediaRequest(projectId: string): string {
  return buildEnvelope(RPC_PROJECT_MEDIA, [`projects/${projectId}`, null, null, null, [1]]);
}

export function mediaRequest(mediaId: string): string {
  return buildEnvelope(RPC_MEDIA, [mediaId]);
}

// ==================== response readers ====================

function* walkStrings(node: unknown): Generator<string> {
  if (typeof node === 'string') yield node;
  else if (Array.isArray(node)) for (const item of node) yield* walkStrings(item);
}

function* walkLists(node: unknown): Generator<unknown[]> {
  if (Array.isArray(node)) {
    yield node;
    for (const item of node) yield* walkLists(item);
  }
}

/**
 * Signed CDN urls come back inline on the image call — one per variant. The
 * media id is read out of the url path rather than from a fixed index: the url
 * is the thing we actually need, and pairing them at the source keeps a
 * reshuffled response from mismatching ids to pictures.
 */
export function readImages(payload: unknown): GeneratedImage[] {
  const images: GeneratedImage[] = [];
  const seen = new Set<string>();
  for (const text of walkStrings(payload)) {
    const marker = `${FLOW_MEDIA_HOST}/image/`;
    if (!text.includes(marker)) continue;
    const mediaId = text.split(marker, 2)[1]?.split('?', 1)[0];
    if (!mediaId || seen.has(mediaId)) continue;
    seen.add(mediaId);
    images.push({ mediaId, url: text });
  }
  return images;
}

/** `[[mediaId, projectId, operationId, "CAE", …]]` — the id a later generate references. */
export function readUploadedMediaId(payload: unknown): string {
  const record = Array.isArray(payload) ? payload[0] : undefined;
  const mediaId = Array.isArray(record) ? record[0] : undefined;
  if (typeof mediaId !== 'string' || !mediaId) throw new Error('Upload không trả về media id');
  return mediaId;
}

/**
 * `[null, 50, [[opId, projectId, sceneId, status, …]]]`.
 *
 * Note the third uuid is the SCENE, not the media. Reading it as a media id is
 * what made every media lookup answer NOT_FOUND.
 */
export function readOperation(payload: unknown): BatchOperation {
  const records = Array.isArray(payload) && payload.length > 2 ? payload[2] : undefined;
  const record = Array.isArray(records) ? records[0] : undefined;
  if (!Array.isArray(record) || record.length === 0) throw new Error('Operation không có bản ghi nào');
  return {
    operationId: String(record[0]),
    projectId: typeof record[1] === 'string' ? record[1] : undefined,
    status: typeof record[3] === 'string' ? record[3] : undefined,
    complaint: readOperationComplaint(record),
  };
}

/**
 * The complaint attached to this operation, if it carries one. It hides in the
 * detail block's status slot as `[4, [null, "Media not found."], [...]]`.
 * Measured behaviour: an operation can report exactly that and still deliver a
 * finished clip, so this is a diagnostic string and nothing more.
 */
function readOperationComplaint(record: unknown[]): string | undefined {
  const detail = record.length > 5 ? record[5] : undefined;
  if (!Array.isArray(detail) || detail.length <= 8) return undefined;
  const block = detail[8];
  if (!Array.isArray(block) || block.length === 0 || block[0] !== OUTCOME_COMPLAINT) return undefined;
  for (const text of walkStrings(block)) return text;
  return 'operation lỗi nhưng không kèm thông báo';
}

/**
 * Look an operation up in the project listing and take its media id. Entries are
 * `[opId, null, null, [title, created, null, null, mediaId, clientUuid, done], projectId]`.
 */
export function findMediaId(payload: unknown, operationId: string): string | undefined {
  for (const node of walkLists(payload)) {
    if (node.length < 4 || node[0] !== operationId) continue;
    const detail = node[3];
    if (Array.isArray(detail) && detail.length > 4 && typeof detail[4] === 'string') return detail[4];
  }
  return undefined;
}

/**
 * The media slot in a listing entry, matched straight off the wire: a title, a
 * timestamp pair, two nulls, then the media id. Escaped or not, both forms
 * appear depending on whether the text has been through a JSON decode.
 */
const MEDIA_SLOT_RE = /null,null,\\?"([0-9a-fA-F-]{36})\\?"/;

/**
 * Same lookup as findMediaId, but on an unparsed listing. The project listing
 * has no page size, grows with every generation and will outrun any response
 * cap — and a truncated tail cannot be JSON-decoded even though the entry we
 * want is sitting in it intact. Scanning the text finds it anyway.
 */
export function findMediaIdInText(text: string, operationId: string): string | undefined {
  const start = text.indexOf(operationId);
  if (start === -1) return undefined;
  const match = MEDIA_SLOT_RE.exec(text.slice(start, start + 800));
  return match ? match[1] : undefined;
}

export function readMediaUrls(payload: unknown, mediaId: string): MediaUrls {
  let video: string | undefined;
  let image: string | undefined;
  for (const text of walkStrings(payload)) {
    if (!text.startsWith('https://')) continue;
    if (text.includes(`${FLOW_MEDIA_HOST}/video/`) && !video) video = text;
    else if (text.includes(`${FLOW_MEDIA_HOST}/image/`) && !image) image = text;
  }
  return { mediaId, video, image };
}
