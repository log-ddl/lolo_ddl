import { strict as assert } from 'node:assert';
import {
  CAPTCHA_SLOT,
  RPC_GEN_IMAGE,
  RPC_GEN_VIDEO,
  RPC_OPERATION,
  STATUS_DONE,
  buildEnvelope,
  findMediaId,
  findMediaIdInText,
  firstPayload,
  imageRequest,
  operationRequest,
  parseEnvelope,
  readImages,
  readMediaUrls,
  readOperation,
  readUploadedMediaId,
  resolveBatchImageModel,
  resolveBatchVideoModel,
  resolveImageAspect,
  resolveVideoAspect,
  videoRequest,
} from './flow-batch.ts';

// ==================== envelope codec ====================

const envelope = buildEnvelope('abc123', [1, 'two', null]);
assert.deepEqual(JSON.parse(envelope), [[['abc123', '[1,"two",null]', null, 'generic']]]);

/** One `["wrb.fr", rpcid, "<payload as a JSON string>", …]` envelope. */
function wrb(rpcid: string, payload: unknown): unknown[] {
  return ['wrb.fr', rpcid, JSON.stringify(payload), null, null, null, 'generic'];
}

/** One length-prefixed chunk: a flat list of envelopes, mixed with Google's own bookkeeping rows. */
function chunk(...envelopes: unknown[][]): string {
  return JSON.stringify(envelopes);
}

// A real reply: the `)]}'` sentinel, then length-prefixed chunks. The lengths are
// deliberately wrong here — the parser must not trust them.
const reply = [
  ")]}'",
  '99',
  chunk(wrb('ogiZ0b', [['hello']]), ['di', 53], ['af.httprm', 53, '-1', 4]),
  '17',
  chunk(wrb('jwpduf', [null, 50, [['op-1']]])),
].join('\n');
const parsed = parseEnvelope(reply);
assert.equal(parsed.length, 2, 'both envelopes are read despite bogus length prefixes');
assert.equal(parsed[0].rpcid, 'ogiZ0b');
assert.deepEqual(parsed[0].data, [['hello']]);
assert.deepEqual(firstPayload(reply, 'jwpduf'), [null, 50, [['op-1']]], 'Google\'s own `di` / `af.httprm` rows are ignored');

// The error slot is index 5 and holds codes, not text.
const failed = [")]}'", '55', chunk(['wrb.fr', 'ogiZ0b', null, null, null, [7], 'generic'])].join('\n');
assert.deepEqual(parseEnvelope(failed)[0].error, [7]);
assert.throws(() => firstPayload(failed, 'ogiZ0b'), /ogiZ0b/, 'a failed envelope throws, never returns null data');
assert.throws(() => firstPayload(reply, 'as29s'), /Không có envelope/, 'a missing rpcid is not silently empty');

// Brackets and quotes inside string payloads must not fool the bracket counter.
const tricky = [")]}'", '10', chunk(wrb('as29s', ['a]b[c', 'd"e', 'f\\g']))].join('\n');
assert.deepEqual(parseEnvelope(tricky)[0].data, ['a]b[c', 'd"e', 'f\\g']);

assert.deepEqual(parseEnvelope(''), [], 'empty body is empty, not a crash');
assert.deepEqual(parseEnvelope(')]}\'\n0\n'), [], 'sentinel with no chunks is empty');

// ==================== request builders ====================

const imageFreq = imageRequest({
  prompt: 'a lighthouse',
  projectId: 'proj-1',
  aspect: '16:9',
  seed: 42,
  model: 'NANO_BANANA_PRO',
  referenceMediaIds: ['media-a', 'media-b'],
});
const imageOuter = JSON.parse(imageFreq) as unknown[][][];
assert.equal(imageOuter[0][0][0], RPC_GEN_IMAGE);
const imageInner = JSON.parse(imageOuter[0][0][1] as unknown as string) as unknown[];
const imageItems = imageInner[1] as unknown[][];
assert.equal(imageItems.length, 1, 'one item per variant');
assert.equal(imageItems[0][3], 42, 'seed sits in slot 3');
assert.equal(imageItems[0][4], 3, '16:9 is aspect 3 for images');
assert.equal(imageItems[0][5], 'GEM_PIX_2', 'nickname resolves to the wire name');
assert.deepEqual(imageItems[0][8], [[['a lighthouse']]], 'the prompt is triple-nested');
assert.deepEqual(
  imageItems[0][2],
  [['media-a', null, null, null, 1], ['media-b', null, null, null, 1]],
  'a reference carries its media id FIRST and the type flag four slots later',
);
assert.ok(imageFreq.includes(CAPTCHA_SLOT), 'the captcha placeholder survives into f.req');

// count replicates the item under fresh seeds rather than setting a "how many" field.
const twoUp = JSON.parse(JSON.parse(imageRequest({ prompt: 'x', projectId: 'p', count: 2, seed: 1 }))[0][0][1]) as unknown[];
const twoItems = twoUp[1] as unknown[][];
assert.equal(twoItems.length, 2);
assert.notEqual(twoItems[0][3], twoItems[1][3], 'each variant gets its own seed');
assert.notEqual(twoItems[0][12], twoItems[1][12], 'each variant gets its own client uuid');

const videoFreq = videoRequest({
  prompt: 'push in slowly',
  projectId: 'proj-1',
  sourceMediaId: 'media-a',
  aspect: '16:9',
  model: 'veo_3_1_i2v_lite',
});
const videoInner = JSON.parse(JSON.parse(videoFreq)[0][0][1]) as unknown[];
assert.equal(JSON.parse(videoFreq)[0][0][0], RPC_GEN_VIDEO);
const videoItem = (videoInner[0] as unknown[][])[0];
assert.equal(videoItem[1], 'veo_3_1_i2v_lite');
assert.equal(videoItem[2], 2, '16:9 is aspect 2 for video — it does NOT share the image encoding');
assert.equal((videoItem[4] as unknown[])[1], 'media-a', 'the still is the second slot of the source block');

assert.deepEqual(JSON.parse(JSON.parse(operationRequest('op-9'))[0][0][1]), [null, null, [['op-9']]]);
assert.equal(JSON.parse(operationRequest('op-9'))[0][0][0], RPC_OPERATION);

// ==================== resolvers ====================

assert.equal(resolveBatchImageModel('GEM_PIX_2'), 'GEM_PIX_2');
assert.equal(resolveBatchImageModel('Nano Banana 2'), 'NARWHAL');
assert.equal(resolveBatchImageModel('something else'), 'GEM_PIX_2', 'unknown coerces to the default');
assert.equal(resolveBatchVideoModel('veo_3_1_i2v_s_fast_ultra_relaxed'), 'veo_3_1_i2v_s_fast_ultra', 'REST-era suffixes map onto the surviving intent');
assert.equal(resolveBatchVideoModel('Veo 3.1 Lite - Lower Priority'), 'veo_3_1_i2v_lite_low_priority');
assert.equal(resolveImageAspect('1:1'), 1);
assert.equal(resolveImageAspect('9:16'), 2);
assert.equal(resolveImageAspect('3:4'), 4);
assert.equal(resolveImageAspect('4:3'), 5, '3:4 and 4:3 have their own slots — they are not the landscape/portrait pair');
assert.equal(resolveImageAspect(undefined), 3, 'default is landscape');
// Ratios with no slot of their own must group the way the REST path groups them,
// or the same job is framed differently depending on which transport carried it.
assert.equal(resolveImageAspect('2:3'), 2, '2:3 is portrait on both paths');
assert.equal(resolveImageAspect('21:9'), 3, 'anything wide lands on landscape');
assert.equal(resolveVideoAspect('9:16'), 1, 'video portrait is 1 where image portrait is 2');
assert.equal(resolveVideoAspect('3:4'), 1, 'video has only two slots, so 3:4 is portrait here');
assert.equal(resolveVideoAspect('16:9'), 2);
assert.equal(resolveVideoAspect('4:3'), 2);

// ==================== response readers ====================

const imagePayload = [[['https://flow-content.google/image/abc-123?sig=x'], ['https://flow-content.google/image/abc-123?sig=x'], ['https://flow-content.google/image/def-456?sig=y']]];
const images = readImages(imagePayload);
assert.deepEqual(images.map((item) => item.mediaId), ['abc-123', 'def-456'], 'duplicates collapse, order kept');
assert.ok(images[0].url.includes('sig=x'), 'the signed url is kept whole');
assert.deepEqual(readImages([['https://example.com/image/nope']]), [], 'only the Flow media host counts');

assert.equal(readUploadedMediaId([['media-up', 'proj', 'op', 'CAE']]), 'media-up');
assert.throws(() => readUploadedMediaId([[]]), /media id/);

const opPayload = [null, 50, [['op-1', 'proj-1', 'scene-1', STATUS_DONE]]];
const op = readOperation(opPayload);
assert.equal(op.operationId, 'op-1');
assert.equal(op.projectId, 'proj-1');
assert.equal(op.status, STATUS_DONE);
assert.equal(op.complaint, undefined);

// A complaint is a diagnostic, not a verdict: the operation still reports done.
const complaining = [null, 50, [['op-2', 'proj-1', 'scene-2', STATUS_DONE, null,
  [null, null, null, null, null, null, null, null, [4, [null, 'Media not found.'], ['Media not found.']]]]]];
const complained = readOperation(complaining);
assert.equal(complained.complaint, 'Media not found.');
assert.equal(complained.status, STATUS_DONE, 'a complaint does not change the status');

const listing = [[['op-1', null, null, ['Title', 1700, null, null, 'media-xyz', 'uuid', true], 'proj-1']]];
assert.equal(findMediaId(listing, 'op-1'), 'media-xyz');
assert.equal(findMediaId(listing, 'op-missing'), undefined);

// The listing outruns any response cap, so the text scan has to work on a tail
// that can no longer be JSON-decoded.
const rawTail = '...,["op-7",null,null,["Title",1700,null,null,"11112222-3333-4444-5555-666677778888"';
assert.equal(findMediaIdInText(rawTail, 'op-7'), '11112222-3333-4444-5555-666677778888');
assert.equal(findMediaIdInText(rawTail, 'op-nope'), undefined);

const urls = readMediaUrls([['https://flow-content.google/video/v1?x'], ['https://flow-content.google/image/i1?y']], 'media-1');
assert.equal(urls.video, 'https://flow-content.google/video/v1?x');
assert.equal(urls.image, 'https://flow-content.google/image/i1?y');

console.log('flow-batch: all assertions passed');
