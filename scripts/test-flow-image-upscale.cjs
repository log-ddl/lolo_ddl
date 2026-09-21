const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
const bundle = buildSync({ entryPoints: [path.join(root, 'electron/features/video-studio/google-flow/runtime.ts')], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const compiled = new Module(path.join(root, 'image-upscale-test.cjs'), module);
compiled.filename = path.join(root, 'image-upscale-test.cjs'); compiled.paths = module.paths;
compiled._compile(bundle.outputFiles[0].text, compiled.filename);
const { GoogleFlowRuntime } = compiled.exports;
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

async function main() {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-upscale-'));
  const runtime = Object.create(GoogleFlowRuntime.prototype);
  runtime.options = { mediaRoot: folder };
  const slot = { ownerScopeId: 'owner', credentialId: 'credential', tier: 'PAYGATE_TIER_ONE' };
  let controller = new AbortController();
  let sent = 0;
  let expectedResolution = 1;
  runtime.runOnLane = async (kind, taskId, preferred, executor, modelKey, allowed) => {
    assert.equal(kind, 'image'); assert.deepEqual(allowed, ['owner'], 'upscale stays on the image owner');
    return executor(slot, {}, controller.signal);
  };
  runtime.reserveSubmitWindow = async () => {};
  runtime.emitLaneTask = () => {};
  runtime.batchRpc = async (_slot, input) => {
    sent++;
    assert.equal(input.rpcid, 'SPrCad');
    const outer = JSON.parse(input.freq);
    const body = JSON.parse(outer[0][0][1]);
    assert.equal(body[0], '11111111-1111-4111-8111-111111111111');
    assert.equal(body[1], expectedResolution);
    assert.equal(body[2][5], null, 'captured upscale context has no project in this slot');
    return JSON.stringify([['wrb.fr', 'SPrCad', JSON.stringify([null, png]), null]]);
  };
  const input = { projectId: 'canvas-space', mediaId: '11111111-1111-4111-8111-111111111111', ownerScopeId: 'owner', flowProjectId: '22222222-2222-4222-8222-222222222222', resolution: '2K' };
  try {
    const result = await runtime.upscaleImage(input);
    assert.equal(result.ownerScopeId, 'owner');
    assert.match(result.localUrl, /^local-image:\/\/images\/.+\.png$/);
    assert.deepEqual(fs.readFileSync(path.join(folder, 'images', result.localUrl.split('/').pop())), Buffer.from(png, 'base64'));
    await assert.rejects(runtime.upscaleImage({ ...input, resolution: '4K' }), /Google AI Ultra/);
    assert.equal(sent, 1, 'regular 4K is refused before network submission');
    expectedResolution = 2;
    await runtime.upscaleImage({ ...input, resolution: '4K', ultraOwnerScopeIds: ['owner'] });
    slot.tier = 'PAYGATE_TIER_TWO';
    await runtime.upscaleImage({ ...input, resolution: '4K' });
    await assert.rejects(runtime.upscaleImage({ ...input, resolution: '8K' }), /2K or 4K/);
    const fileCount = fs.readdirSync(path.join(folder, 'images')).length;
    runtime.batchRpc = async () => { controller.abort(); return 'ignored'; };
    await assert.rejects(runtime.upscaleImage(input), /Cancelled/);
    assert.equal(fs.readdirSync(path.join(folder, 'images')).length, fileCount, 'cancelled response is not saved');
    controller = new AbortController();
    runtime.batchRpc = async () => JSON.stringify([['wrb.fr', 'SPrCad', JSON.stringify([null, 'x'.repeat(150)]), null]]);
    await assert.rejects(runtime.upscaleImage(input), /not a valid image/);
    assert.equal(fs.readdirSync(path.join(folder, 'images')).length, fileCount);
    console.log('Image upscale: 2K, Ultra 4K, ownership, wire format, local bytes and cancellation passed.');
  } finally {
    const images = path.join(folder, 'images');
    if (fs.existsSync(images)) { for (const name of fs.readdirSync(images)) fs.unlinkSync(path.join(images, name)); fs.rmdirSync(images); }
    fs.rmdirSync(folder);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
