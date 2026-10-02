import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'clone-batch-'));
const require = createRequire(import.meta.url);
const bundle = await build({ entryPoints: ['electron/features/tts-voice/omnivoice/text-split.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['electron'], plugins: [{ name: 'ffmpeg', setup(build) {
  build.onLoad({ filter: /ffmpeg-runtime\.ts$/ }, () => ({ contents: 'export const probeMediaDuration = async () => 1; export const runFFmpeg = async () => ({success: true});', loader: 'ts' }));
} }] });
const module = { exports: {} };
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require: name => name === 'electron' ? { app: { getPath: () => root } } : require(name), process, Buffer, console });
const { generateSplit, canceledSplitJobs, lineJobs } = module.exports;
try {
  const payload = { jobId: 'parent', text: 'full text', mode: 'clone', model: { capability: 'qwen3' }, referenceAudioPath: '/reference.wav', referenceText: 'Original sample', splitMode: 'default' };
  let active = 0, calls = [];
  const generate = async (request) => {
    assert.equal(active++, 0, 'Sequential, not concurrent');
    assert.equal(request.referenceAudioPath, payload.referenceAudioPath);
    assert.equal(request.referenceText, payload.referenceText);
    calls.push(request.text);
    await new Promise(resolve => setTimeout(resolve, 1));
    const outputPath = path.join(root, request.jobId + '.wav');
    fs.writeFileSync(outputPath, 'audio');
    active--;
    return { success: true, outputPath, durationSec: 1 };
  };
  const result = await generateSplit(generate, payload, ['one', 'two', 'three'], () => {});
  assert.equal(result.success, true);
  assert.equal(calls.join(','), 'one,two,three');
  assert.equal(result.partGapSec, 0.25);
  assert.equal(result.partDurationsSec.length, 3);
  assert.equal(lineJobs.size, 0);
  calls = [];
  const canceled = await generateSplit(async request => {
    const result = await generate(request);
    canceledSplitJobs.add(payload.jobId);
    return result;
  }, payload, ['one', 'two'], () => {});
  assert.equal(canceled.canceled, true);
  assert.equal(calls.length, 1, 'Cancellation must stop later segments');
  assert.equal(canceledSplitJobs.size, 0);
  console.log('PASS: local sequential segments, identical clone reference, merge timeline and cancellation.');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
