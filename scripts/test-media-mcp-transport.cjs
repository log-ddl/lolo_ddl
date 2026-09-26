const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');
const readline = require('node:readline');

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'logdd-mcp-test-'));
  const ipc = new EventEmitter();
  global.__mcpElectron = { app: { getPath: () => temp }, ipcMain: ipc };
  const entry = path.resolve('electron/features/content-chat/mcp/gateway.ts');
  const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{ name: 'mock-electron', setup(build) {
    build.onResolve({ filter: /^electron$/ }, () => ({ path: 'electron', namespace: 'mock' }));
    build.onResolve({ filter: /resource-monitor$/ }, () => ({ path: 'metrics', namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: args.path === 'electron' ? 'export const app=globalThis.__mcpElectron.app;export const ipcMain=globalThis.__mcpElectron.ipcMain;' : 'export const getSystemResourceMetrics=()=>({cpu:0});', loader: 'js' }));
  } }] });
  const loaded = new Module(entry, module); loaded.filename = entry; loaded.paths = Module._nodeModulePaths(process.cwd()); loaded._compile(built.outputFiles[0].text, entry);
  const gateway = loaded.exports;
  let child;
  try {
    gateway.registerContentMcpGateway();
    const sender = { id: 7, isDestroyed: () => false, send: (_channel, request) => {
      const result = request.name === 'get_media_asset'
        ? { asset: { assetId: 'asset-test' }, imageContent: { type: 'image', mimeType: 'image/png', data: 'YQ==' } }
        : { taskId: 'mock-task', status: 'running' };
      queueMicrotask(() => ipc.emit('content-mcp-tool-result', { sender }, { requestId: request.requestId, success: true, result }));
    } };
    ipc.emit('content-mcp-ready', { sender });
    const connection = await gateway.getContentMcpConnection();
    const headers = { Authorization: `Bearer ${connection.token}`, 'Content-Type': 'application/json' };
    const rpc = (body, extra = {}) => fetch(connection.url, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
    assert.equal((await fetch(connection.url, { method: 'POST' })).status, 401);
    assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await fetch(connection.url, { headers })).status, 405);
    assert.equal((await rpc({ jsonrpc: '2.0', id: 20, method: 'ping', padding: 'x'.repeat(1024 * 1024) })).status, 413);
    assert.equal((await rpc({ jsonrpc: '2.0', id: 21, method: 'ping' })).status, 200);
    assert.equal((await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202);
    assert.equal((await rpc([{ jsonrpc: '2.0', method: 'notifications/initialized' }])).status, 202);
    assert.equal((await (await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize' })).json()).result.protocolVersion, '2025-03-26');
    const listed = await (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
    const names = listed.result.tools.map((tool) => tool.name);
    assert.equal(names.length, new Set(names).size);
    for (const name of ['generate_image', 'generate_video', 'create_tts_audio', 'create_voice_profile', 'cancel_media_task']) assert.ok(names.includes(name));
    const preview = await (await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_media_asset', arguments: { assetId: 'asset-test', includePreview: true } } })).json();
    assert.equal(preview.result.content[1].type, 'image');
    const unknown = await (await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'unknown' } })).json();
    assert.equal(unknown.error.code, -32602);
    child = spawn(process.execPath, ['scripts/media-mcp-stdio.mjs', path.join(temp, 'mcp-connection.json')], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const lines = readline.createInterface({ input: child.stdout });
    const receive = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('stdio bridge timed out')), 5000);
      child.once('error', reject);
      lines.once('line', (line) => { clearTimeout(timer); resolve(JSON.parse(line)); });
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'tools/list' })}\n`);
    const response = await receive;
    assert.equal(response.id, 8);
    assert.ok(response.result.tools.some((tool) => tool.name === 'generate_video'));
    lines.close();
    console.log('MCP transport tests passed: auth, origin, lifecycle, discovery, tool list, image preview and external stdio client.');
  } finally {
    child?.kill();
    gateway.closeContentMcpGateway();
    assert.equal(fs.existsSync(path.join(temp, 'mcp-connection.json')), false);
    fs.rmdirSync(temp);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
