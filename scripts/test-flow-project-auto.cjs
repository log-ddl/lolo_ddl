const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const bundle = buildSync({
  entryPoints: [path.join(root, 'electron/features/video-studio/google-flow/runtime.ts')],
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
});
const compiled = new Module(path.join(root, 'flow-project-test.cjs'), module);
compiled.filename = path.join(root, 'flow-project-test.cjs');
compiled.paths = module.paths;
compiled._compile(bundle.outputFiles[0].text, compiled.filename);
const { GoogleFlowRuntime } = compiled.exports;

async function main() {
  const runtime = Object.create(GoogleFlowRuntime.prototype);
  const old = { longddProjectId: 'project', ownerScopeId: 'owner', active: true, flowProjectId: 'old' };
  runtime.bindings = [old];
  runtime.preparedProjectBindings = new Set();
  runtime.preparingProjectBindings = new Map();
  runtime.saveBindings = () => {};
  const slot = { ownerScopeId: 'owner', credentialId: 'credential', connectionId: 'connection', extensionInstanceId: 'account' };
  let calls = 0;
  let finish;
  runtime.resolveProjectBinding = async () => {
    calls++;
    await new Promise(resolve => { finish = resolve; });
    const binding = { ...old, flowProjectId: `new-${calls}` };
    runtime.bindings = [binding];
    return binding;
  };
  const firstController = new AbortController();
  const signal = new AbortController().signal;
  const first = runtime.ensureProject('project', slot, firstController.signal);
  const second = runtime.ensureProject('project', slot, signal);
  assert.equal(calls, 1, 'concurrent lanes share one refresh even with a saved binding');
  firstController.abort();
  finish();
  await assert.rejects(first, /Cancelled by user/);
  assert.equal((await second).flowProjectId, 'new-1', 'another lane survives cancellation');
  assert.equal((await runtime.ensureProject('project', slot, signal)).flowProjectId, 'new-1');
  assert.equal(calls, 1, 'later shots reuse the prepared project');
  const reconnected = { ...slot, connectionId: 'reconnected' };
  const third = runtime.ensureProject('project', reconnected, signal);
  assert.equal(calls, 2, 'reconnection refreshes the project again');
  finish();
  await third;
  runtime.resolveProjectBinding = async () => { throw new Error('lookup failed'); };
  await assert.rejects(runtime.ensureProject('other', slot, signal), /lookup failed/);
  runtime.resolveProjectBinding = async () => ({ ...old, longddProjectId: 'other' });
  assert.equal((await runtime.ensureProject('other', slot, signal)).longddProjectId, 'other', 'failed refresh can be retried');
  console.log('Flow project automatic preparation checks passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
