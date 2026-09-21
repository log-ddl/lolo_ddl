const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const { WebSocket } = require('ws');

async function main() {
  const entry = path.resolve('electron/features/video-studio/grok/runtime.ts');
  const result = await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const loaded = new Module(entry, module);
  loaded.filename = entry;
  loaded.paths = Module._nodeModulePaths(process.cwd());
  loaded._compile(result.outputFiles[0].text, entry);
  const runtime = new loaded.exports.GrokVideoRuntime({ mediaRoot: process.cwd() });
  const connected = (id) => ({ credentialId: id, socket: { readyState: WebSocket.OPEN }, grokReady: true, quotaSeen: true, videoAvailable: true });
  runtime.connections.set('grok-a', connected('grok-a'));
  runtime.connections.set('grok-b', connected('grok-b'));

  assert.equal(runtime.selectVideoLane(new Set(), 'grok-b').credentialId, 'grok-b');
  assert.equal(runtime.selectVideoLane(new Set(), 'grok-a').credentialId, 'grok-a');
  runtime.connections.get('grok-b').videoAvailable = false;
  assert.throws(() => runtime.selectVideoLane(new Set(), 'grok-b'), /Tài khoản Grok đã chọn hết lượt/);
  assert.equal(runtime.selectVideoLane(new Set()).credentialId, 'grok-a', 'Auto may use another ready account');
  runtime.connections.delete('grok-b');
  assert.throws(() => runtime.selectVideoLane(new Set(), 'grok-b'), /không còn kết nối/);
  runtime.connections.set('grok-b', connected('grok-b'));
  const attempts = [];
  runtime.generateVideoOnLane = async (_input, _taskId, lane) => {
    attempts.push(lane.credentialId);
    throw new Error('quota exhausted');
  };
  await assert.rejects(runtime.generateVideo({ projectId: 'test', sceneId: 'node', prompt: 'cat', model: 'Grok Imagine Video', aspectRatio: '16:9', preferredCredentialId: 'grok-b' }), /Tài khoản Grok đã chọn hết lượt/);
  assert.deepEqual(attempts, ['grok-b'], 'A fixed account must never retry on another account');
  console.log('Grok fixed-account and Auto lane routing passed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
