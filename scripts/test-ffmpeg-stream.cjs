const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
const m = new Module(path.resolve('ffmpeg-stream-test.cjs'), module);
m.filename = path.resolve('ffmpeg-stream-test.cjs'); m.paths = module.paths;
m._compile(buildSync({ entryPoints: ['electron/ffmpeg-runtime.ts'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false }).outputFiles[0].text, m.filename);
const { runFFmpeg, cancelFFmpeg } = m.exports;
const args = ['-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', '16x16', '-framerate', '30', '-i', 'pipe:0', '-f', 'null', '-'];
(async () => {
  const plain = await runFFmpeg({ jobId: 'plain', args: ['-version'] });
  assert.ok(plain.success);
  const good = await runFFmpeg({ jobId: 'stream-good', args, input: (async function* () { for (let i = 0; i < 5; i++) yield Buffer.alloc(1024); })() });
  assert.ok(good.success, good.error);
  const bad = await runFFmpeg({ jobId: 'stream-bad', args, input: (async function* () { yield Buffer.alloc(1024); throw new Error('frame generation failed'); })() });
  assert.equal(bad.success, false); assert.match(bad.error, /frame generation failed/);
  const early = await runFFmpeg({ jobId: 'stream-early', args: ['-invalid-option'], input: (async function* () { for (let i = 0; i < 100; i++) yield Buffer.alloc(65536); })() });
  assert.equal(early.success, false);
  let finalized = false;
  const canceled = await runFFmpeg({ jobId: 'stream-cancel', args, input: (async function* () {
    try { for (let i = 0; i < 100; i++) { if (i === 2) cancelFFmpeg('stream-cancel'); yield Buffer.alloc(1024); } }
    finally { finalized = true; }
  })() });
  assert.equal(canceled.success, false); assert.equal(canceled.canceled, true); assert.ok(finalized);
  console.log('FFmpeg: fileless input, producer failure, early exit, cancellation and normal invocation passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
