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
  const fs = require('node:fs'), os = require('node:os');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-upload-test-'));
  const slot = { ownerScopeId: 'owner', extensionInstanceId: 'account' };
  const ref = { source: 'data:image/png;base64,YQ==', fileName: 'Brand logo' };
  const mediaId = '11111111-1111-4111-8111-111111111111';
  function setup(error) {
    const runtime = Object.create(GoogleFlowRuntime.prototype);
    runtime.options = { mediaRoot: folder };
    runtime.mediaCache = {};
    runtime.mediaCachePath = path.join(folder, 'cache.json');
    runtime.deadLegacyAccounts = new Set();
    runtime.apiUrl = (_slot, suffix) => suffix;
    runtime.markLegacyTransportDead = (id) => runtime.deadLegacyAccounts.add(id);
    runtime.restCalls = 0; runtime.batchCalls = 0;
    runtime.apiRequest = async () => { runtime.restCalls++; throw error; };
    runtime.batchUploadMedia = async (_slot, project, bytes, mime, name) => {
      runtime.batchCalls++; assert.equal(project, 'project'); assert.equal(bytes, 'YQ==');
      assert.equal(mime, 'image/png'); assert.equal(name, 'Brand logo.png'); return mediaId;
    };
    return runtime;
  }
  const auth = new Error('Google Flow HTTP 401 (/v1/flow/uploadImage): UNAUTHENTICATED');
  const signal = new AbortController().signal;
  try {
    const runtime = setup(auth);
    runtime.runOnLane = () => { throw new Error('should not select an account'); };
    const video = { projectId: 'project', sceneId: 'scene', prompt: 'animate', model: 'Gemini_Omni_Flash', aspectRatio: '16:9' };
    await assert.rejects(runtime.generateVideo(video), /requires a start image/);
    await assert.rejects(runtime.generateVideo({ ...video, endImage: ref }), /requires a start image/);

    const results = await Promise.all([runtime.resolveMedia(ref, 'project', slot, signal), runtime.resolveMedia(ref, 'project', slot, signal)]);
    assert.deepEqual(results, [mediaId, mediaId]); assert.equal(runtime.restCalls, 2); assert.equal(runtime.batchCalls, 2);
    assert.equal(runtime.usesBatchTransport(slot), true);
    await runtime.resolveMedia(ref, 'project', slot, signal);
    assert.equal(runtime.batchCalls, 2, 'successful fallback is cached');
    for (const message of ['HTTP 403 PERMISSION_DENIED', 'HTTP 429 quota', 'HTTP 500 server error']) {
      const rejected = setup(new Error(message));
      await assert.rejects(rejected.resolveMedia(ref, 'project', slot, signal), new RegExp(message));
      assert.equal(rejected.batchCalls, 0);
    }
    const controller = new AbortController(); const cancelled = setup(auth);
    cancelled.apiRequest = async () => { controller.abort(); throw auth; };
    await assert.rejects(cancelled.resolveMedia(ref, 'project', slot, controller.signal));
    assert.equal(cancelled.batchCalls, 0, 'cancellation does not retry');
    const failedBatch = setup(auth);
    failedBatch.batchUploadMedia = async () => { failedBatch.batchCalls++; throw new Error('batch failed'); };
    await assert.rejects(failedBatch.resolveMedia(ref, 'project', slot, signal), /batch failed/);
    assert.equal(failedBatch.batchCalls, 1, 'fallback is bounded');
    assert.deepEqual(failedBatch.mediaCache, {});
    const cachedVideo = setup(auth);
    cachedVideo.runOnLane = async (_kind, _task, _preferred, run) => run(slot, {}, signal);
    cachedVideo.ensureProject = async () => ({ flowProjectId: 'project' });
    cachedVideo.emitLaneTask = () => {};
    cachedVideo.reserveSubmitWindow = async () => {};
    cachedVideo.clientContext = () => ({});
    cachedVideo.pickAccountModel = (_slot, _chain, resolve, requested) => resolve(requested);
    let cachedReads = 0;
    cachedVideo.resolveMedia = async (_ref, _project, _slot, _signal, _report, force) => {
      assert.equal(force, false, 'auth fallback must not re-upload cached media');
      cachedReads++; return mediaId;
    };
    cachedVideo.batchSubmitVideo = async (_slot, _project, input) => {
      cachedVideo.batchCalls++;
      assert.equal(input.model, 'abra_r2v_4s', 'Ref batch payload keeps Omni and duration');
      assert.deepEqual(input.referenceMediaIds, [mediaId], 'references must not degrade to a start frame');
      assert.equal(input.sourceMediaId, mediaId);
      throw new Error('test batch rejection');
    };
    await assert.rejects(cachedVideo.generateVideo({ ...video, references: [ref], duration: 4 }), /test batch rejection/);
    assert.equal(cachedVideo.restCalls, 1);
    assert.equal(cachedVideo.batchCalls, 1, 'submit fallback is bounded on the same account');
    assert.equal(cachedReads, 2);
    console.log('Flow upload: 401 fallback, concurrent uploads, cache, filename, cancellation and non-auth errors passed.');
  } finally {
    const cache = path.join(folder, 'cache.json'); if (fs.existsSync(cache)) fs.unlinkSync(cache); fs.rmdirSync(folder);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
