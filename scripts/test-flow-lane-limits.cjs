const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
function load(file) {
  const result = buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const m = new Module(path.resolve(file + '.cjs'), module); m.filename = path.resolve(file + '.cjs'); m.paths = module.paths;
  m._compile(result.outputFiles[0].text, m.filename); return m.exports;
}
const { GoogleFlowRuntime } = load('electron/features/video-studio/google-flow/runtime.ts');
const { runOnLane } = load('electron/features/video-studio/google-flow/socket-transport.ts');
async function scenario(accounts, allowed) {
  const runtime = Object.create(GoogleFlowRuntime.prototype);
  Object.assign(runtime, { lanes: new Map(), sockets: new Map(), nextLaneCursor: 0, imageLanesPerToken: 4, videoLanesPerToken: 4 });
  runtime.usesBatchTransport = () => true;
  for (let i = 0; i < accounts; i++) runtime.sockets.set(`c${i}`, { slot: { state: 'ready', credentialId: `c${i}`, ownerScopeId: `a${i}` }, socket: { readyState: 1 } });
  const events = [], active = new Map(), peaks = new Map(); let total = 0, peak = 0;
  const ctx = { sockets: runtime.sockets, abortControllers: new Map(), emitLaneTask: (...args) => events.push(args) };
  const jobs = Array.from({ length: 20 }, (_, i) => {
    const lane = runtime.selectLane('image', undefined, { allowedOwnerScopeIds: allowed });
    return runOnLane(ctx, 'image', `task-${i}`, lane, async (slot) => {
      const n = (active.get(slot.credentialId) || 0) + 1;
      active.set(slot.credentialId, n); peaks.set(slot.credentialId, Math.max(peaks.get(slot.credentialId) || 0, n));
      total++; peak = Math.max(peak, total);
      await new Promise(resolve => setTimeout(resolve, 10));
      active.set(slot.credentialId, active.get(slot.credentialId) - 1);
      total--;
    });
  });
  await Promise.all(jobs);
  assert.equal(peak, 4 * (allowed ? allowed.length : accounts));
  for (const n of peaks.values()) assert.ok(n <= 4);
  assert.equal(events.filter(event => event[2] === 'queued').length, 20);
  console.log(`${accounts} account(s), ${allowed ? allowed.length : accounts} eligible: peak ${peak}, 20 queued jobs complete`);
}
(async () => { await scenario(1); await scenario(2); await scenario(2, ['a0']); })().catch(error => { console.error(error); process.exitCode = 1; });
