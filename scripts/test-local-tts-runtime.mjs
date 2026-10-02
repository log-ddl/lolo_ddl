import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { build } from 'esbuild';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';

const require = createRequire(import.meta.url);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-runtime-test-'));
const bundle = await build({
  entryPoints: ['electron/features/tts-voice/local-model-runtime.ts'],
  bundle: true, platform: 'node', format: 'cjs', write: false, external: ['electron'],
  plugins: [{ name: 'managed-python-stub', setup(build) {
    build.onLoad({ filter: /managed-python\.ts$/ }, () => ({
      contents: 'export async function ensureManagedPython() { return "/mock/python" }', loader: 'ts',
    }));
  } }],
});
const children = [];
let failDependencyInstall = false;
function fakeSpawn(command, args, options) {
  const child = new EventEmitter();
  child.command = command;
  child.args = args;
  child.options = options;
  child.killed = false;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new Writable({ write(bytes, _encoding, done) {
    const request = JSON.parse(bytes.toString());
    child.request = request;
    setTimeout(() => {
      if (child.killed) return;
      fs.writeFileSync(request.outputPath, 'mock WAV');
      if (request.streamPreview) {
        const chunk = request.outputPath.replace('.wav', '-chunk-1.wav');
        fs.writeFileSync(chunk, 'mock chunk');
        child.stdout.write(JSON.stringify({ type: 'progress', jobId: request.jobId, audioChunkPath: '/outside.wav' }) + '\n');
        child.stdout.write(JSON.stringify({ type: 'progress', jobId: request.jobId, audioChunkPath: chunk }) + '\n');
      }
      child.stdout.write(JSON.stringify({ type: 'result', jobId: 'wrong-job', success: false }) + '\n');
      child.stdout.write(JSON.stringify({ type: 'result', jobId: request.jobId, success: true, sampleRate: 24000, durationSec: 1,
        accelerator: request.engine === 'cosyvoice' ? 'mps' : request.backend || 'cpu' }) + '\n');
    }, 10);
    done();
  } });
  if (!args.includes('--serve')) {
    child.stdin.on('finish', () => setImmediate(() => {
      if (args.includes('venv')) {
        const python = path.join(args.at(-1), 'bin/python');
        fs.mkdirSync(path.dirname(python), { recursive: true });
        fs.writeFileSync(python, '');
      }
      child.emit('close', failDependencyInstall && args.includes('pip') ? 1 : 0);
    }));
  }
  child.kill = () => { child.killed = true; setImmediate(() => child.emit('close', null)); return true; };
  children.push(child);
  return child;
}
const module = { exports: {} };
vm.runInNewContext(bundle.outputFiles[0].text, {
  module, exports: module.exports, process, console, Buffer, setTimeout, clearTimeout,
  require: (name) => name === 'electron' ? { app: { getPath: () => userData } } : name === 'node:child_process' ? { spawn: fakeSpawn } : require(name),
});
const api = module.exports;
const model = { id: 'qwen3-0.6b-base', repository: 'Qwen/Qwen3-TTS-12Hz-0.6B-Base', capability: 'qwen3' };
try {
  assert.equal(api.getLocalModelStatus(model).status, 'not-installed');
  assert.throws(() => api.getLocalModelStatus({ ...model, id: '../../outside' }));
  assert.throws(() => api.getLocalModelStatus({ ...model, repository: 'other/repo' }));
  const root = path.join(userData, 'models/qwen3', model.id);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, '.model-ready'), JSON.stringify({ version: 1, repository: model.repository, accelerator: 'cpu' }));
  assert.equal(api.getLocalModelStatus(model).status, 'not-installed', 'marker alone cannot mark a missing runtime ready');
  const python = path.join(userData, 'runtimes/qwen3/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  fs.mkdirSync(path.dirname(python), { recursive: true });
  fs.writeFileSync(python, '');
  assert.equal(api.getLocalModelStatus(model).status, 'ready');
  assert.equal(api.getLocalModelStatus(model).accelerator, 'cpu');
  const payload = { model, jobId: 'one', text: 'Hello', mode: 'clone' };
  assert.equal((await api.generateLocalModel(payload, () => {})).success, true);
  assert.equal((await api.generateLocalModel({ ...payload, jobId: 'two' }, () => {})).success, true);
  assert.equal(children.length, 1, 'same model reuses the worker');
  const events = [];
  assert.equal((await api.generateLocalModel({ ...payload, jobId: 'stream', streamPreview: true }, (event) => events.push(event))).success, true);
  assert.equal(events.length, 1, 'chunks outside the output path are not exposed');
  assert.ok(events[0].audioChunkPath.endsWith('-chunk-1.wav'));
  const running = api.generateLocalModel({ ...payload, jobId: 'busy' }, () => {});
  assert.equal((await api.generateLocalModel({ ...payload, jobId: 'parallel' }, () => {})).success, false, 'concurrent requests cannot replace an active worker');
  assert.equal((await running).success, true);
  const stopped = api.generateLocalModel({ ...payload, jobId: 'stop' }, () => {});
  api.stopLocalModelWorker();
  assert.equal((await stopped).success, false);
  assert.ok(children[0].killed);
  assert.equal((await api.generateLocalModel({ ...payload, jobId: 'restart' }, () => {})).success, true);
  assert.equal(children.length, 2, 'worker restarts after being stopped');
  const other = { id: 'qwen3-1.7b-base', repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-Base', capability: 'qwen3' };
  const otherRoot = path.join(userData, 'models/qwen3', other.id);
  fs.mkdirSync(otherRoot, { recursive: true });
  fs.writeFileSync(path.join(otherRoot, '.model-ready'), JSON.stringify({ version: 1, repository: other.repository }));
  assert.equal((await api.generateLocalModel({ ...payload, model: other, jobId: 'switch' }, () => {})).success, true);
  assert.ok(children[1].killed, 'switching models releases the old process');
  assert.equal(children.length, 3);
  const crashed = api.generateLocalModel({ ...payload, model: other, jobId: 'crash' }, () => {});
  children[2].kill();
  assert.equal((await crashed).success, false, 'worker exit settles pending requests');
  const sibling = path.join(userData, 'models/qwen3/qwen3-1.7b-base');
  fs.mkdirSync(sibling, { recursive: true });
  await api.removeLocalModel(model);
  assert.equal(api.getLocalModelStatus(model).status, 'not-installed');
  assert.ok(fs.existsSync(sibling), 'removing one variant preserves the other');
  assert.ok(fs.existsSync(python), 'shared runtime is preserved');
  const result = await api.generateLocalModel({ model, jobId: 'test', text: 'Hello', mode: 'clone' }, () => {});
  assert.equal(result.success, false, 'generation is blocked before installation');
  assert.equal(api.cancelLocalInstall('unknown'), false);

  const design = { id: 'qwen3-1.7b-design', repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', capability: 'qwen3' };
  const designRoot = path.join(userData, 'models/qwen3', design.id);
  fs.mkdirSync(designRoot, { recursive: true });
  fs.writeFileSync(path.join(designRoot, '.model-ready'), JSON.stringify({ version: 1, repository: design.repository, accelerator: 'cpu' }));
  const loadPlatform = (platform, arch, release) => {
    const module = { exports: {} };
    vm.runInNewContext(bundle.outputFiles[0].text, {
      module, exports: module.exports, process: { platform, arch, env: process.env, cwd: () => process.cwd() },
      console, Buffer, setTimeout, clearTimeout,
      require: (name) => name === 'electron' ? { app: { getPath: () => userData } }
        : name === 'node:child_process' ? { spawn: fakeSpawn }
        : name === 'node:os' ? { release: () => release } : require(name),
    });
    return module.exports;
  };
  const apple = loadPlatform('darwin', 'arm64', '26.0.0');
  try {
    assert.equal(apple.getLocalModelStatus(design).status, 'ready', 'existing weights remain installed before MLX migration');
    failDependencyInstall = true;
    const designPayload = { model: design, jobId: 'mlx-failure', text: 'Hello', mode: 'design', instruction: 'Young male' };
    assert.equal((await apple.generateLocalModel(designPayload, () => {})).success, false);
    const marker = path.join(userData, 'runtimes/qwen3-mlx/.runtime-ready');
    assert.equal(fs.existsSync(marker), false, 'failed dependency setup must not be marked ready');
    failDependencyInstall = false;
    const migrating = apple.generateLocalModel({ ...designPayload, jobId: 'mlx-upgrade' }, () => {});
    assert.equal((await apple.generateLocalModel({ ...designPayload, jobId: 'mlx-parallel' }, () => {})).success, false,
      'runtime migration holds the generation lock');
    await assert.rejects(apple.removeLocalModel(design), /Model đang bận/);
    assert.equal((await migrating).success, true);
    assert.equal(apple.getLocalModelStatus(design).accelerator, 'mlx');
    assert.equal(children.at(-1).request.backend, 'mlx');
    assert.ok(children.at(-1).command.includes('qwen3-mlx'));
    assert.equal(children.at(-1).request.modelPath, designRoot, 'original model weights are reused');
    const count = children.length;
    await apple.generateLocalModel({ ...designPayload, jobId: 'mlx-reuse' }, () => {});
    assert.equal(children.length, count, 'MLX worker and runtime are reused');
  } finally { apple.stopLocalModelWorker(); }
  for (const [platform, arch, release] of [['darwin', 'x64', '26.0.0'], ['darwin', 'arm64', '22.0.0'], ['linux', 'x64', '6.0.0']]) {
    const runtime = loadPlatform(platform, arch, release);
    try {
      assert.equal((await runtime.generateLocalModel({ model: design, jobId: platform + arch, text: 'Hello', mode: 'design' }, () => {})).success, true);
      assert.equal(children.at(-1).request.backend, undefined, 'unsupported platforms keep official SDK');
      assert.ok(!children.at(-1).command.includes('qwen3-mlx'));
    } finally { runtime.stopLocalModelWorker(); }
  }
  const cosy = { id: 'cosyvoice3-0.5b', repository: 'FunAudioLLM/Fun-CosyVoice3-0.5B-2512', capability: 'cosyvoice' };
  const cosyRoot = path.join(userData, 'models/cosyvoice', cosy.id);
  fs.mkdirSync(cosyRoot, { recursive: true });
  fs.writeFileSync(path.join(cosyRoot, '.model-ready'), JSON.stringify({ version: 1, repository: cosy.repository, accelerator: 'cpu' }));
  const cosyPython = path.join(userData, 'runtimes/cosyvoice/.venv/bin/python');
  fs.mkdirSync(path.dirname(cosyPython), { recursive: true });
  fs.writeFileSync(cosyPython, '');
  const cosyRuntime = loadPlatform('darwin', 'arm64', '26.0.0');
  try {
    assert.equal(cosyRuntime.getLocalModelStatus(cosy).accelerator, 'cpu', 'no GPU claim before the worker confirms it');
    const result = await cosyRuntime.generateLocalModel({ model: cosy, jobId: 'cosy-mps', mode: 'clone', text: 'Hello' }, () => {});
    assert.equal(result.success, true);
    assert.equal(children.at(-1).options.env.PYTORCH_ENABLE_MPS_FALLBACK, '1');
    assert.equal(children.at(-1).command, cosyPython, 'Cosy reuses its existing environment and weights');
    assert.equal(cosyRuntime.getLocalModelStatus(cosy).accelerator, 'mps', 'successful generation updates old CPU markers');
  } finally { cosyRuntime.stopLocalModelWorker(); }
  console.log('Local TTS runtime checks passed: allowlist, readiness, removal isolation, uninstalled generation, worker reuse, concurrent rejection, chunk isolation and restart.');
  console.log('MLX checks passed: platform routing, migration, failed setup, concurrency, original weight reuse and worker reuse.');
  console.log('Cosy MPS checks passed: worker environment, existing installation reuse and verified backend status.');
} finally {
  api.stopLocalModelWorker();
  fs.rmSync(userData, { recursive: true, force: true });
}
