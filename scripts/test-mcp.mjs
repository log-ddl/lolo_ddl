// Real HTTP gateway integration tests, with only Electron and provider runtimes stubbed.
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { EventEmitter } from 'node:events';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'logdd-mcp-test-'));
const handlers = new Map();
const listeners = new Map();
globalThis.__mcpTest = { handlers, listeners, temporary };
let gateway;
const bundle = async (entry, name, stubs) => {
  const outfile = path.join(temporary, `${name}.mjs`);
  await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node', format: 'esm', plugins: [{ name: 'stubs', setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => stubs[args.path] ? { path: args.path, namespace: 'stub' } : undefined);
    b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: stubs[args.path], loader: 'js' }));
  } }] });
  return import(pathToFileURL(outfile).href);
};
try {
  const stubs = {
    electron: `const state = globalThis.__mcpTest;
      export const app = { getPath: () => state.temporary, whenReady: () => Promise.resolve() };
      export const ipcMain = { handle: (name, fn) => state.handlers.set(name, fn), on: (name, fn) => state.listeners.set(name, fn) };
      export const BrowserWindow = { getAllWindows: () => [] };`,
    '../../../resource-monitor': 'export const getSystemResourceMetrics = () => ({ cpu: 12, memory: 34 })',
    './media-tools': 'export const executeMediaTool = async () => ({ stub: true })',
  };
  gateway = await bundle('electron/features/content-chat/mcp/gateway.ts', 'gateway', stubs);
  gateway.registerContentMcpGateway();
  const connection = await gateway.getContentMcpConnection();
  const headers = { Authorization: `Bearer ${connection.token}`, 'Content-Type': 'application/json' };
  const request = (body, extras = {}) => fetch(connection.url, { method: 'POST', headers, body: JSON.stringify(body), ...extras });
  const rpc = (method, params = {}) => request({ jsonrpc: '2.0', id: 1, method, params }).then(r => r.json());
  assert.equal((await request({}, { headers: { 'Content-Type': 'application/json' } })).status, 401);
  assert.equal((await request({}, { headers: { ...headers, Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await fetch(connection.url, { headers })).status, 405);
  assert.equal((await request({}, { headers: { ...headers, 'MCP-Protocol-Version': 'invalid' } })).status, 400);
  assert.equal((await request({}, { body: '{' })).status, 400);
  assert.equal((await request([])).status, 400);
  assert.equal((await rpc('initialize', { protocolVersion: '2025-11-25', clientInfo: { name: 'integration-test' } })).result.protocolVersion, '2025-11-25');
  assert.equal((await request({ jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202);
  const tools = (await rpc('tools/list')).result.tools;
  assert.ok(tools.some(t => t.name === 'generate_image'));
  assert.ok(tools.some(t => t.name === 'generate_video'));
  assert.ok(tools.some(t => t.name === 'create_tts_audio'));
  assert.equal(new Set(tools.map(t => t.name)).size, tools.length);
  assert.equal((await rpc('tools/call', { name: 'missing' })).error.code, -32602);
  assert.deepEqual(JSON.parse((await rpc('tools/call', { name: 'get_system_resource_metrics' })).result.content[0].text), { cpu: 12, memory: 34 });
  assert.equal((await handlers.get('content-mcp-test')()).count, tools.length);
  assert.equal(handlers.get('content-mcp-status')().lastClient, 'integration-test');
  const next = handlers.get('content-mcp-rotate')();
  assert.notEqual(next.token, connection.token);
  assert.equal((await request({})).status, 401);
  headers.Authorization = `Bearer ${next.token}`;
  assert.ok((await rpc('tools/list')).result);
  assert.equal((await handlers.get('content-mcp-enabled')({}, false)).running, false);
  await assert.rejects(gateway.getContentMcpConnection(), /disabled/);
  const restarted = await handlers.get('content-mcp-enabled')({}, true);
  assert.equal(restarted.url, connection.url);
  assert.equal(restarted.token, next.token);
  gateway.closeContentMcpGateway();
  gateway = await bundle('electron/features/content-chat/mcp/gateway.ts', 'reloaded-gateway', stubs);
  const reloaded = await gateway.getContentMcpConnection();
  assert.deepEqual(reloaded, { url: restarted.url, token: restarted.token });
  assert.equal((await fs.stat(path.join(temporary, 'mcp-connection.json'))).mode & 0o777, 0o600);
  gateway.closeContentMcpGateway();
  console.log('PASS: HTTP auth/origin/version, handshake, tools, rotation, disable/enable, restart persistence');

  const runtime = new EventEmitter();
  let resolveJob;
  let rejectJob;
  let lastInput;
  runtime.generateImage = runtime.generateVideo = (input) => {
    lastInput = input;
    return new Promise((resolve, reject) => { resolveJob = resolve; rejectJob = reject; });
  };
  runtime.cancelTask = (taskId) => { runtime.emit('task', { taskId, status: 'cancelled' }); rejectJob(new Error('Cancelled')); return true; };
  globalThis.__mcpRuntime = runtime;
  const media = await bundle('electron/features/content-chat/mcp/media-tools.ts', 'media', {
    '../../../browser-runtimes': 'export const getMcpMediaRuntime = async () => globalThis.__mcpRuntime',
  });
  const invoke = media.executeMediaTool;
  const capabilities = await invoke('get_media_capabilities', {});
  const model = capabilities.googleflow.imageModels[0];
  await assert.rejects(invoke('generate_image', { prompt: 'A tree', model, provider: 'invalid' }), /Unsupported provider/);
  const job = await invoke('generate_image', { prompt: 'A tree', model });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(lastInput.taskId, job.taskId);
  runtime.emit('task', { taskId: job.taskId, status: 'polling', progress: 50 });
  assert.equal((await invoke('get_media_task', { taskId: job.taskId })).progress, 50);
  resolveJob({ localUrl: '/tmp/output.png' });
  await new Promise(resolve => setImmediate(resolve));
  const completed = await invoke('get_media_task', { taskId: job.taskId });
  assert.equal(completed.status, 'completed');
  assert.equal(completed.result.localUrl, '/tmp/output.png');
  const video = await invoke('generate_video', { prompt: 'A moving tree', model: capabilities.googleflow.videoModels[0], provider: 'googleflow' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await invoke('cancel_media_task', { taskId: video.taskId })).cancelled, true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await invoke('get_media_task', { taskId: video.taskId })).status, 'cancelled');
  assert.equal(runtime.listenerCount('task'), 0);
  console.log('PASS: media validation, capabilities, dispatch, progress, output, cancellation and listener cleanup');
} finally {
  gateway?.closeContentMcpGateway();
  await fs.rm(temporary, { recursive: true, force: true });
}
