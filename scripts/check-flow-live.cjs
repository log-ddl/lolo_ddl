// Uses an already-open app-managed Flow tab. Default is read-only; --generate
// creates one image and one four-second Omni video to verify the complete path.
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
const WebSocket = require('ws');
const root = path.resolve(__dirname, '..');
function load(file) {
  const output = buildSync({ entryPoints: [path.join(root, file)], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const compiled = new Module(path.join(root, 'flow-live-check.cjs'), module);
  compiled.filename = path.join(root, 'flow-live-check.cjs'); compiled.paths = module.paths;
  compiled._compile(output.outputFiles[0].text, compiled.filename);
  return compiled.exports;
}
async function main() {
  const port = Number(process.argv[2]);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Usage: node scripts/check-flow-live.cjs <CDP port> [--generate]');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab = tabs.find(t => t.type === 'page' && /^https:\/\/flow\.google\.com\/project\/[0-9a-f-]{36}/i.test(t.url));
  if (!tab) throw new Error('Open a project in this app-managed Flow profile first.');
  const projectId = /\/project\/([0-9a-f-]{36})/i.exec(tab.url)[1];
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  const pending = new Map(); let sequence = 0;
  socket.on('message', raw => {
    const message = JSON.parse(raw);
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id); clearTimeout(call.timer);
    if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
  });
  const cdp = { send: (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 185_000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  }) };
  try {
    const inspected = await cdp.send('Runtime.evaluate', {
      expression: '({hasSession: !!globalThis.WIZ_global_data?.SNlM0e, hasCaptcha: !!globalThis.grecaptcha?.enterprise?.execute})', returnByValue: true,
    });
    console.log(JSON.stringify({ stage: 'page', ...inspected.result?.value }));
    const modelArg = process.argv.find(arg => arg.startsWith('--video-model='))?.slice('--video-model='.length);
    const sourceArg = process.argv.find(arg => arg.startsWith('--source-media='))?.slice('--source-media='.length);
    if (!process.argv.includes('--generate') && !(modelArg && sourceArg)) return;
    const { GoogleFlowInAppBridge } = load('electron/features/video-studio/google-flow/in-app-bridge.ts');
    const { GoogleFlowRuntime } = load('electron/features/video-studio/google-flow/runtime.ts');
    const bridge = Object.create(GoogleFlowInAppBridge.prototype);
    bridge.handle = { cdp, accountSlotId: 'live-check' };
    bridge.runtime = { updateApiKey() {} };
    const runtime = Object.create(GoogleFlowRuntime.prototype);
    runtime.batchRpc = async (_slot, params) => {
      const out = await bridge.runBatchRpc(params);
      if (out.status >= 400) throw new Error(`Flow HTTP ${out.status}: ${out.text.slice(0, 500)}`);
      return out.text;
    };
    let lastPhase = '';
    runtime.emitLaneTask = (_task, _kind, status) => {
      if (status !== lastPhase) { console.log(JSON.stringify({ stage: status })); lastPhase = status; }
    };
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 7 * 60_000);
    try {
      const image = sourceArg ? { mediaId: sourceArg } : await runtime.batchGenerateImage({}, projectId, {
        prompt: 'A small red wooden toy boat on a calm blue pond, soft daylight, clean realistic photograph, no text.',
        aspectRatio: '16:9', model: 'GEM_PIX_2', referenceMediaIds: [],
      }, controller.signal);
      console.log(JSON.stringify({ stage: sourceArg ? 'existing-image' : 'image', mediaId: image.mediaId, hasUrl: !!image.remoteUrl }));
      const operationId = await runtime.batchSubmitVideo({}, projectId, {
        prompt: 'The small wooden boat gently floats on the still pond. Subtle ripples, static camera.',
        sourceMediaId: image.mediaId, aspectRatio: '16:9', model: modelArg || 'abra_i2v_4s',
      }, controller.signal);
      console.log(JSON.stringify({ stage: 'video-submitted', operationId }));
      const video = await runtime.batchPollVideo({}, operationId, projectId, 'live-check', {}, controller.signal);
      const response = await fetch(video.remoteUrl, { headers: { Range: 'bytes=0-31' } });
      const contentType = response.headers.get('content-type');
      await response.body?.cancel();
      if (!response.ok || !contentType?.startsWith('video/')) throw new Error(`Video download returned ${response.status} ${contentType}`);
      console.log(JSON.stringify({ stage: 'video-completed', mediaId: video.mediaId, contentType }));
    } finally { clearTimeout(deadline); }
  } finally {
    for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error('Closed')); }
    socket.close();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
