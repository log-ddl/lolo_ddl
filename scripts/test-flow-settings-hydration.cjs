const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { build } = require('esbuild');

async function main() {
  const result = await build({
    entryPoints: ['src/features/video-studio/stores/video-studio-settings-store.ts'],
    bundle: true, platform: 'node', format: 'cjs', write: false,
    plugins: [{ name: 'memory-settings', setup(build) {
      build.onResolve({ filter: /indexed-db-storage$/ }, () => ({ path: 'storage', namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const fileStorage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };' }));
    } }],
  });
  const compiled = new Module(path.resolve('settings-hydration-test.cjs'), module);
  compiled.filename = path.resolve('settings-hydration-test.cjs');
  compiled.paths = module.paths;
  compiled._compile(result.outputFiles[0].text, compiled.filename);
  const store = compiled.exports.useVideoStudioSettingsStore;
  const options = store.persist.getOptions();
  const oldRouting = { flowAccounts: ['account'], accountVideoModels: { account: ['Veo_3.1-Lite'] }, routingMode: 'speed' };
  store.persist.setOptions({ storage: {
    getItem: async () => ({ version: options.version, state: { mediaRouting: oldRouting } }),
    setItem: async () => {}, removeItem: async () => {},
  } });
  await store.persist.rehydrate();
  const hydrated = store.getState().mediaRouting;
  assert.deepEqual(hydrated.ultraOwnerScopeIds, [], 'same-version old saves get the new nested default');
  assert.deepEqual(hydrated.flowAccounts, ['account']);
  assert.deepEqual(hydrated.accountVideoModels, oldRouting.accountVideoModels);
  assert.equal(hydrated.routingMode, 'speed');
  assert.doesNotThrow(() => [...hydrated.ultraOwnerScopeIds]);
  assert.equal(hydrated.ultraOwnerScopeIds.includes('account'), false);
  const marked = options.merge({ mediaRouting: { ...oldRouting, ultraOwnerScopeIds: ['account'] } }, store.getState());
  assert.deepEqual(marked.mediaRouting.ultraOwnerScopeIds, ['account']);
  assert.deepEqual(options.merge({}, store.getState()).mediaRouting.ultraOwnerScopeIds, []);
  console.log('Flow settings: same-version hydration, Ultra defaults and saved account preferences passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
