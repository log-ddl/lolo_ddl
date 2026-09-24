const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const { EventEmitter } = require('node:events');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
function load(file) {
  const output = buildSync({ entryPoints: [path.join(root, file)], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const compiled = new Module(path.join(root, 'flow-migration-test.cjs'), module);
  compiled.filename = path.join(root, 'flow-migration-test.cjs');
  compiled.paths = module.paths;
  compiled._compile(output.outputFiles[0].text, compiled.filename);
  return compiled.exports;
}
const { attachSocket, proxyRequest } = load('electron/features/video-studio/google-flow/socket-transport.ts');
const { GoogleFlowRuntime } = load('electron/features/video-studio/google-flow/runtime.ts');
const { GoogleFlowInAppBridge } = load('electron/features/video-studio/google-flow/in-app-bridge.ts');
const { GOOGLE_FLOW_DEFAULT_PORT } = load('electron/features/video-studio/google-flow/protocol.ts');
const { getGoogleFlowUserFacingError } = load('src/features/video-studio/lib/ai/google-flow-errors.ts');

async function main() {
  const projectId = '11111111-1111-4111-8111-111111111111';
  const mediaId = '22222222-2222-4222-8222-222222222222';
  const sent = [];
  const requests = [];
  let responseText = 'batch-response';
  let responseStatus = 200;
  let minted = 0;
  let activeMints = 0;
  let maxMints = 0;
  let renders = 0;
  let renderFailure = false;
  const widgetOptions = [];
  const page = vm.createContext({
    URLSearchParams, AbortSignal, setTimeout,
    location: { origin: 'https://flow.google.com', pathname: `/project/${projectId}` },
    document: {
      documentElement: { lang: 'vi-VN', innerHTML: '', appendChild: host => { host.isConnected = true; } },
      createElement: () => ({ style: {}, isConnected: false, remove() { this.isConnected = false; } }),
    },
    ___grecaptcha_cfg: { clients: { current: { sitekey: 'current-page-site-key' } } },
    navigator: { language: 'en-US' },
    WIZ_global_data: { SNlM0e: 'page-csrf', FdrFJe: 'page-session', cfb2h: 'page-build' },
    grecaptcha: { enterprise: {
      ready: fn => fn(),
      render: (_host, options) => {
        if (renderFailure) throw new Error('render failed');
        widgetOptions.push(options);
        return renders++;
      },
      execute: async (widgetId, options) => {
        assert.equal(typeof widgetId, 'number', 'execute must receive a widget id, never the site key');
        assert.ok(['IMAGE_GENERATION', 'VIDEO_GENERATION'].includes(options.action));
        activeMints++; maxMints = Math.max(maxMints, activeMints);
        await new Promise(resolve => setTimeout(resolve, 5));
        activeMints--; return `captcha-${++minted}`;
      },
    } },
    fetch: async (url, init) => {
      requests.push({ url, init });
      return { status: responseStatus, ok: responseStatus < 400, text: async () => responseText };
    },
  });
  let navigations = 0;
  const extension = vm.createContext({
    URL, Set, Promise, console,
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    sendToAgent: reply => sent.push(reply),
    chrome: {
      tabs: {
        query: async () => [{ id: 7, url: `https://flow.google.com/project/${projectId}` }],
        create: async () => { throw new Error('must reuse existing project tab'); },
        update: async () => { navigations++; throw new Error('must not navigate active project'); },
      },
      scripting: { executeScript: async ({ func, args = [] }) => {
        page.args = args;
        return [{ result: await vm.runInContext(`(${func.toString()})(...args)`, page) }];
      } },
    },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'extensions/logdd/flow-batch-bridge.js'), 'utf8'), extension);
  const params = { rpcid: 'ogiZ0b', freq: '["__CAPTCHA__"]', captchaAction: 'IMAGE_GENERATION', flowProjectId: projectId };
  await Promise.all([extension.handleFlowBatchRpc({ id: 'a', params }), extension.handleFlowBatchRpc({ id: 'b', params })]);
  assert.equal(sent.length, 2);
  assert.ok(sent.every(reply => reply.data === 'batch-response' && reply.status === 200));
  assert.equal(maxMints, 1, 'parallel lanes serialize captcha mint only');
  assert.equal(renders, 1, 'concurrent submits reuse widget id zero');
  assert.equal(widgetOptions[0].sitekey, 'current-page-site-key');
  assert.equal(widgetOptions[0].size, 'invisible');
  assert.equal(navigations, 0);
  for (const request of requests) {
    const url = new URL(request.url, 'https://flow.google.com');
    assert.equal(url.searchParams.get('source-path'), `/project/${projectId}`);
    assert.equal(url.searchParams.get('hl'), 'vi');
    assert.equal(request.init.credentials, 'include');
    assert.equal(request.init.body.get('at'), 'page-csrf');
    assert.ok(!request.init.body.get('f.req').includes('__CAPTCHA__'));
  }
  assert.notEqual(requests[0].init.body.get('f.req'), requests[1].init.body.get('f.req'));
  await extension.handleFlowProjects({ id: 'projects' });
  assert.deepEqual(Array.from(sent.at(-1).result.projectIds), [projectId]);
  await extension.handleFlowBatchRpc({ id: 'bad', params: { ...params, rpcid: 'untrusted' } });
  assert.equal(sent.at(-1).status, 400);
  responseStatus = 401; responseText = 'auth error';
  await extension.handleFlowBatchRpc({ id: 'auth', params: { ...params, captchaAction: null, match: 'missing-op' } });
  assert.equal(sent.at(-1).status, 401);
  assert.equal(sent.at(-1).data, 'auth error', 'listing trim must preserve HTTP errors');

  // Exercise the actual generated CDP expression as well as the extension.
  const bridge = Object.create(GoogleFlowInAppBridge.prototype);
  bridge.ensureFlowAppLoaded = async () => {};
  bridge.solveCaptcha = async () => 'native-captcha';
  bridge.handle = { cdp: { send: async (method, { expression }) => {
    assert.equal(method, 'Runtime.evaluate');
    return { result: { value: await vm.runInContext(expression, page) } };
  } } };
  responseStatus = 200;
  responseText = `"op","metadata"\n${'x'.repeat(5000)}["op",null,null,["title",[1,0],null,null,"${mediaId}"]]`;
  const native = await bridge.runBatchRpc({ ...params, match: 'op' });
  assert.ok(native.text.includes(mediaId), 'later listing occurrence survives page-side reduction');
  assert.equal(new URL(requests.at(-1).url, 'https://flow.google.com').searchParams.get('source-path'), `/project/${projectId}`);

  // Run the real native mint expression, not the runBatchRpc stub above.
  page.window = page;
  bridge.hasRecaptcha = async () => true;
  bridge.extractApiKeyFromTab = async () => {};
  delete bridge.solveCaptcha;
  const nativeTokens = await Promise.all([
    bridge.solveCaptcha('VIDEO_GENERATION', projectId),
    bridge.solveCaptcha('IMAGE_GENERATION', projectId),
  ]);
  assert.notEqual(nativeTokens[0], nativeTokens[1]);
  assert.equal(renders, 1, 'native and extension paths share the page widget');
  assert.equal(maxMints, 1);

  page.__logddCaptchaWidget.host.remove();
  renderFailure = true;
  await assert.rejects(bridge.solveCaptcha('VIDEO_GENERATION', projectId), /render failed/);
  renderFailure = false;
  delete page.___grecaptcha_cfg.clients.current;
  assert.ok(await bridge.solveCaptcha('VIDEO_GENERATION', projectId));
  assert.equal(renders, 2, 'failed rendering releases the lock and the next mint recovers');
  assert.equal(widgetOptions.at(-1).sitekey, '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV');

  // Exercise the legacy extension message path against the same page state.
  const events = new Map();
  const captchaReplies = [];
  page.window = page;
  page.addEventListener = (name, fn) => events.set(name, fn);
  page.dispatchEvent = event => captchaReplies.push(event.detail);
  page.CustomEvent = function (name, options) { this.type = name; this.detail = options.detail; };
  vm.runInContext(fs.readFileSync(path.join(root, 'extensions/logdd/injected.js'), 'utf8'), page);
  await events.get('GET_CAPTCHA')({ detail: { requestId: 'legacy', pageAction: 'VIDEO_GENERATION' } });
  assert.equal(captchaReplies.at(-1).requestId, 'legacy');
  assert.ok(captchaReplies.at(-1).token);
  assert.equal(renders, 2, 'legacy path also reuses the same widget');

  const socket = new EventEmitter(); socket.readyState = 1; socket.send = msg => sent.push(JSON.parse(msg)); socket.close = () => {};
  const ctx = {
    protocolVersion: 1, sessionSecret: 'test-secret', sockets: new Map(), credentials: new Map(),
    instanceToCredential: new Map(), pending: new Map(), abortControllers: new Map(),
    emitStatus() {}, hashIdentity: value => value, apiRequest: async () => { throw new Error('batch must not fetch REST credits'); },
    apiUrl: (_slot, url) => url,
  };
  attachSocket(ctx, socket);
  socket.emit('message', Buffer.from(JSON.stringify({ type: 'extension_ready', legacyInstanceId: projectId,
    flowKeyPresent: false, flowUrlSupported: true, capabilities: ['flow_projects', 'batch_rpc'] })));
  const slot = [...ctx.credentials.values()][0];
  assert.equal(slot.state, 'ready'); assert.equal(slot.transport, 'batch');
  assert.equal(slot.tokenCapturedAt, undefined); assert.equal(slot.canListProjects, true);
  const pending = proxyRequest(ctx, slot, 'flow_projects', {}, 1000);
  const outbound = sent.at(-1);
  socket.emit('message', Buffer.from(JSON.stringify({ id: outbound.id, result: { projectIds: [projectId] } })));
  assert.deepEqual(await pending, { projectIds: [projectId] });
  assert.equal(ctx.pending.size, 0);
  await assert.rejects(proxyRequest(ctx, { ...slot, supportsBatchRpc: false }, 'batch_rpc', params, 1000), /Cập nhật/, 'old extensions fail fast instead of silently timing out');
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(proxyRequest(ctx, slot, 'batch_rpc', params, 1000, cancelled.signal), /Cancelled/);
  assert.equal(ctx.pending.size, 0);

  const runtime = Object.create(GoogleFlowRuntime.prototype);
  runtime.credentials = ctx.credentials; runtime.sockets = ctx.sockets;
  runtime.deadLegacyAccounts = new Set(); runtime.accountEmails = new Map();
  runtime.options = {};
  runtime.quotaLocks = { list: () => [] }; runtime.videoLanesPerToken = 1; runtime.imageLanesPerToken = 1;
  slot.tokenCapturedAt = Date.now() - 120 * 60_000;
  assert.equal(runtime.getStatus().credentials[0].state, 'ready', 'batch session does not expire with the old bearer');
  runtime.inAppBridges = new Map(); runtime.bindings = []; runtime.saveBindings = () => {};
  // socketContext is a getter on the real runtime.
  Object.defineProperty(runtime, 'socketContext', { value: ctx });
  socket.send = raw => {
    const msg = JSON.parse(raw);
    if (msg.method === 'flow_projects') queueMicrotask(() => socket.emit('message', Buffer.from(JSON.stringify({ id: msg.id, result: { projectIds: [projectId] } }))));
  };
  assert.equal((await runtime.resolveProjectBinding('local-project', slot)).flowProjectId, projectId);
  socket.send = raw => {
    const msg = JSON.parse(raw);
    queueMicrotask(() => socket.emit('message', Buffer.from(JSON.stringify({ id: msg.id, result: { projectIds: [] } }))));
  };
  await assert.rejects(runtime.resolveProjectBinding('empty', slot), /chưa có project/, 'missing project does not call retired tRPC');
  assert.equal(GOOGLE_FLOW_DEFAULT_PORT, 9224);
  assert.match(getGoogleFlowUserFacingError(new Error('PUBLIC_ERROR_MODEL_ACCESS_DENIED')), /model video/);
  assert.match(getGoogleFlowUserFacingError(new Error('PUBLIC_ERROR_UNUSUAL_ACTIVITY')), /kiểm tra bảo mật/);
  assert.match(fs.readFileSync(path.join(root, 'extensions/logdd/background.js'), 'utf8'), /ws:\/\/127\.0\.0\.1:9224/);
  console.log('Flow migration: extension, CDP, session readiness, project discovery and WS replies passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
