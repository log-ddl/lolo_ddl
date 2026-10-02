import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { zipSync, strToU8 } from 'fflate';
const require = createRequire(import.meta.url);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'colab-tts-test-'));
let selection;
const electron = { app: { isPackaged: false, getPath: () => root }, dialog: { showOpenDialog: async () => Array.isArray(selection) ? selection.shift() : selection }, shell: { showItemInFolder() {} } };
async function load(entry) {
  const bundle = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['electron'] });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require: name => name === 'electron' ? electron : require(name), Buffer, process, TextEncoder, TextDecoder, Uint8Array, console, setTimeout, clearTimeout });
  return module.exports;
}
const api = await load('electron/features/tts-voice/colab-package.ts');
const { splitCloneText, planCloneParts } = await load('electron/features/tts-voice/clone-chunks.ts');
const runtime = await load('electron/features/tts-voice/colab-runtime.ts');
function wav() {
  const b = Buffer.alloc(44 + 480);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(24000, 24); b.writeUInt32LE(48000, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(480, 40); return b;
}
try {
  for (const text of [
    'A marketing story with clear examples. '.repeat(200),
    'Một câu chuyện tài chính rất dài, không có dấu chấm '.repeat(200),
    '这是一个测试句子。'.repeat(200),
    '語'.repeat(1200),
    'word '.repeat(2000),
    '😀'.repeat(2000),
  ]) {
    const parts = splitCloneText(text);
    assert.ok(parts.length > 1);
    assert.equal(parts.join('').replace(/\s/gu, ''), text.replace(/\s/gu, ''), 'No lost or reordered text');
    for (const part of parts) {
      assert.ok(Array.from(part).length <= 900);
      assert.equal(splitCloneText(part).length, 1, 'No recursive re-splitting locally');
      assert.ok(!/[\uD800-\uDBFF]$/.test(part), 'No cut surrogate pairs');
    }
  }
  assert.equal(splitCloneText('Short text.')[0], 'Short text.');
  assert.equal(planCloneParts('First. Second.', 'sentence').length, 2);
  assert.equal(planCloneParts('First.\nSecond.', 'line').length, 2);
  const reference = path.join(root, 'ref.wav'); fs.writeFileSync(reference, wav());
  for (const [id, model] of Object.entries(api.COLAB_MODELS)) {
    const payload = { jobId: 'test', model: { id, ...model }, mode: model.mode, text: 'First. Second.', instruction: 'Young male voice', referenceAudioPath: reference, language: 'en', splitMode: 'sentence' };
    const manifest = api.buildManifest(payload, [{ name: 'Sample', text: payload.text }], 'Test voice');
    assert.equal(manifest.jobs[0].parts.length, 2);
    assert.equal(manifest.repository, model.repository);
  }
  const request = { jobId: 'test', model: { id: 'qwen3-1.7b-design', repository: api.COLAB_MODELS['qwen3-1.7b-design'].repository, capability: 'qwen3' }, text: 'First. Second.', mode: 'design', instruction: 'Young male voice', language: 'en', splitMode: 'sentence' };
  selection = { canceled: false, filePaths: [root] };
  const exported = await runtime.exportColab({ request, source: 'editor', voiceLabel: 'Designed voice' });
  assert.equal(exported.success, true, exported.error);
  const archive = api.readPackage(fs.readFileSync(path.join(exported.folder, 'tts-tasks.zip')));
  const manifest = api.parseJson(archive, 'tasks.json');
  assert.equal(manifest.jobs[0].instruction, request.instruction);
  assert.equal(JSON.stringify(manifest).includes(root), false, 'No local paths in manifest');
  const notebook = JSON.parse(fs.readFileSync(path.join(exported.folder, 'logdd-tts.ipynb')));
  // Compile every generated Python cell, including the escaping in the embedded code.
  for (const [i, cell] of notebook.cells.entries()) if (cell.cell_type === 'code') {
    const filename = path.join(root, `cell-${i}.py`); fs.writeFileSync(filename, cell.source);
    execFileSync('python3', ['-c', 'import ast,sys; ast.parse(open(sys.argv[1]).read())', filename]);
  }
  // Execute the actual upload cell with a fake Colab file picker (no install/network).
  const uploadSource = notebook.cells.find(c => c.cell_type === 'code').source.split('# --- NEXT STAGE ---')[0].replace('def run_logdd_tts():\n', '').split('\n').map(line => line.startsWith('    ') ? line.slice(4) : line).join('\n').replace("Path('/content/logdd-tts')", `Path(${JSON.stringify(path.join(root, 'uploaded'))})`);
  const uploadTest = path.join(root, 'upload-test.py');
  fs.writeFileSync(uploadTest, `import sys, types\nfrom pathlib import Path\ngoogle = types.ModuleType('google')\ncolab = types.ModuleType('google.colab')\ncolab.files = types.SimpleNamespace(upload=lambda: {'tasks.zip': Path(${JSON.stringify(path.join(exported.folder, 'tts-tasks.zip'))}).read_bytes()})\nsys.modules['google'] = google\nsys.modules['google.colab'] = colab\n${uploadSource}\nassert (ROOT / 'tasks.json').is_file()\n`);
  execFileSync('python3', [uploadTest]);
  const textPath = path.join(root, 'batch.txt'); fs.writeFileSync(textPath, '\uFEFFHello clone.');
  selection = [{ canceled: false, filePaths: [textPath] }, { canceled: false, filePaths: [root] }];
  const cloneRequest = { ...request, model: { id: 'cosyvoice3-0.5b', repository: api.COLAB_MODELS['cosyvoice3-0.5b'].repository, capability: 'cosyvoice' }, mode: 'clone', referenceAudioPath: reference, referenceText: 'Reference speech', localStyle: 'Speak gently.' };
  const cloneExport = await runtime.exportColab({ request: cloneRequest, source: 'files', voiceLabel: 'Clone' });
  assert.equal(cloneExport.success, true, cloneExport.error);
  execFileSync('python3', ['scripts/test-colab-notebook.py', path.join(exported.folder, 'logdd-tts.ipynb'), path.join(exported.folder, 'tts-tasks.zip'), path.join(cloneExport.folder, 'tts-tasks.zip'), root]);
  const cloneFiles = api.readPackage(fs.readFileSync(path.join(cloneExport.folder, 'tts-tasks.zip')));
  const cloneManifest = api.parseJson(cloneFiles, 'tasks.json');
  assert.equal(cloneManifest.jobs[0].text, 'Hello clone.');
  const longText = 'A clear sentence about finance. '.repeat(100);
  const planned = api.buildManifest(cloneRequest, [{ name: 'Long', text: longText }], 'Clone');
  assert.equal(JSON.stringify(planned.jobs[0].parts), JSON.stringify(planCloneParts(longText, cloneRequest.splitMode)));
  assert.equal(cloneManifest.jobs[0].localStyle, 'Speak gently.');
  assert.equal(cloneManifest.jobs[0].referenceText, 'Reference speech');
  assert.equal(api.hash(cloneFiles[cloneManifest.jobs[0].referenceAudioPath]), api.hash(wav()));
  assert.equal(fs.readFileSync(textPath, 'utf8'), '\uFEFFHello clone.');
  const job = manifest.jobs[0];
  const bytes = wav();
  const report = { format: 'logdd-tts-results', version: 1, packId: manifest.packId, requestHash: api.hash(archive['tasks.json']), jobs: [{ id: job.id, status: 'done', file: `audio/${job.id}.wav`, sha256: api.hash(bytes) }] };
  const resultFiles = { 'results.json': strToU8(JSON.stringify(report)), [`audio/${job.id}.wav`]: bytes };
  assert.equal(api.validateResults(resultFiles, manifest, report.requestHash).audio.length, 1);
  for (const mutated of [{ ...report, requestHash: 'wrong' }, { ...report, jobs: [...report.jobs, ...report.jobs] }, { ...report, jobs: [{ ...report.jobs[0], id: 'unknown' }] }]) {
    assert.throws(() => api.validateResults({ ...resultFiles, 'results.json': strToU8(JSON.stringify(mutated)) }, manifest, report.requestHash));
  }
  assert.throws(() => api.validateResults({ ...resultFiles, [`audio/${job.id}.wav`]: Buffer.alloc(10) }, manifest, report.requestHash));
  assert.throws(() => api.inspectWav(bytes.subarray(0, bytes.length - 2)));
  assert.throws(() => api.readPackage(zipSync({ '../evil': strToU8('bad') })));
  const resultPath = path.join(root, 'results.zip'); fs.writeFileSync(resultPath, zipSync(resultFiles));
  selection = { canceled: false, filePaths: [resultPath] };
  const imported = await runtime.importColab(); assert.equal(imported.success, true, imported.error);
  assert.equal(imported.items[0].text, request.text);
  assert.equal(imported.items[0].mode, 'design');
  assert.deepEqual(fs.readFileSync(imported.items[0].outputPath), bytes);
  const repeated = await runtime.importColab(); assert.equal(repeated.items[0].id, imported.items[0].id);
  assert.equal(fs.readdirSync(path.dirname(imported.items[0].outputPath)).length, 1);
  const conflicting = Buffer.from(bytes); conflicting[44] = 1;
  fs.writeFileSync(resultPath, zipSync({ ...resultFiles, [`audio/${job.id}.wav`]: conflicting, 'results.json': strToU8(JSON.stringify({ ...report, jobs: [{ ...report.jobs[0], sha256: api.hash(conflicting) }] })) }));
  assert.equal((await runtime.importColab()).success, false);
  assert.deepEqual(fs.readFileSync(imported.items[0].outputPath), bytes);
  // Returned JSON cannot supply history text, local paths or execution metadata.
  const partial = { ...report, jobs: [{ id: job.id, status: 'error', error: 'GPU out of memory' }] };
  const checked = api.validateResults({ 'results.json': strToU8(JSON.stringify(partial)) }, manifest, report.requestHash);
  assert.equal(checked.failed, 1); assert.equal(checked.audio.length, 0);
  selection = { canceled: true, filePaths: [] };
  assert.equal((await runtime.importColab()).canceled, true);
  assert.equal((await runtime.exportColab({ request, source: 'editor', voiceLabel: 'Test' })).canceled, true);
  console.log('PASS: model variants, export/notebook syntax, round-trip import, reimport, invalid IDs/hash/WAV/path, partial failure and cancellation.');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
