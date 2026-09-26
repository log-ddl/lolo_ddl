import assert from 'node:assert/strict'
import { MediaTasks } from './media-tasks'
import { validateMediaArguments } from './media-tool-definitions'
import { executeMediaTool } from './media-tools'

declare global { var __mcpTest: any }
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const memory = new Map<string, string>()
const storage = { getItem: (key: string) => memory.get(key) || null, setItem: (key: string, value: string) => { memory.set(key, value) } }

async function main() {
  assert.throws(() => validateMediaArguments('generate_image', { prompt: 'x' }), /requestKey/)
  assert.throws(() => validateMediaArguments('generate_image', { requestKey: 'x', prompt: 'x', apiKey: 'secret' }), /Unknown argument/)
  assert.throws(() => validateMediaArguments('generate_video', { requestKey: 'x', prompt: 'x', mode: 'invalid' }), /Unsupported/)
  assert.throws(() => validateMediaArguments('create_tts_audio', { requestKey: 'x', text: 'x', speed: Infinity }), /number/)
  const registry = new MediaTasks(storage)
  let calls = 0
  const job = registry.start('image', { requestKey: 'same' }, async () => { calls++; return { assetId: 'image-a', kind: 'image', source: 'local-image://images/a.png' } })
  assert.equal(registry.start('image', { requestKey: 'same' }, async () => { calls++; return {} }).taskId, job.taskId)
  assert.throws(() => registry.start('video', { requestKey: 'same' }, async () => ({})), /different arguments/)
  await tick()
  assert.equal(calls, 1)
  assert.equal(registry.get(job.taskId).status, 'completed')
  assert.equal(new MediaTasks(storage).asset('image-a').kind, 'image')
  const pending = registry.start('video', { requestKey: 'cancel' }, async ({ signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))))
  await tick()
  assert.equal(new MediaTasks(storage).get(pending.taskId).status, 'interrupted')
  registry.cancel(pending.taskId)
  await tick()
  assert.equal(registry.get(pending.taskId).status, 'cancelled')
  let finish!: (result: Record<string, unknown>) => void
  const race = registry.start('video', { requestKey: 'race' }, async () => new Promise((resolve) => { finish = resolve }))
  await tick(); registry.cancel(race.taskId); finish({ assetId: 'late-output', source: 'video.mp4', kind: 'video' }); await tick()
  assert.equal(registry.get(race.taskId).status, 'completed', 'Preserve media that completes while cancellation is in flight')

  globalThis.__mcpTest = { calls: [], history: [], profiles: [], plan: 'pro', cancelCalls: [], ttsListeners: new Set() }
  const state = globalThis.__mcpTest
  ;(globalThis as any).window = {
    videoStudioBrowser: { startRuntimes: async () => { state.runtimeStarted = true; return { ok: true } } },
    googleFlowRuntime: { getStatus: async () => ({ readyCredentialCount: 1 }) },
    grokVideoRuntime: { getStatus: async () => ({ readyCredentialCount: 1 }) },
    localStorage: { getItem: () => null, setItem: () => undefined },
    imageStorage: { readAsBase64: async () => ({ success: true, base64: 'data:image/png;base64,YQ==', mimeType: 'image/png' }) },
    ttsRuntime: {
      getModelStatuses: async (models: any[]) => models.map((m) => ({ modelId: m.id, status: 'ready' })),
      getVbeeVoices: async () => ({ success: true, voices: [{ code: 'vbee-one', name: 'Vbee', languageCode: 'vi' }] }),
      getVieneuVoices: async () => ({ success: true, voices: [{ id: 'Trúc Ly', label: 'Trúc Ly' }] }),
      onEvent: (listener: unknown) => { state.ttsListeners.add(listener); return () => state.ttsListeners.delete(listener) },
      cancel: async (id: string) => { state.cancelCalls.push(id); state.rejectTts?.(new Error('Cancelled')); return { canceled: true } },
      generate: async (payload: any) => {
        state.calls.push({ kind: 'tts', ...payload })
        if (state.waitTts) return new Promise((_, reject) => { state.rejectTts = reject })
        return { success: true, outputPath: 'D:\\audio.wav', durationSec: 2 }
      },
    },
  }
  const call = async (name: string, args: Record<string, unknown> = {}): Promise<any> => executeMediaTool(name, args)
  const done = async (job: any) => {
    for (let i = 0; i < 20; i++) {
      const status = await call('get_media_task', { taskId: job.taskId })
      if (status.status !== 'running' && status.status !== 'cancelling') return status
      await tick()
    }
    throw new Error('Test task did not finish')
  }
  const imageArgs = { requestKey: 'image-1', prompt: 'A character', model: 'GEM_PIX_2' }
  const first = await call('generate_image', imageArgs)
  const image = await done(first)
  assert.equal(image.status, 'completed')
  assert.equal(state.runtimeStarted, true, 'MCP starts lazy browser runtimes before generation')
  assert.equal((await call('generate_image', imageArgs)).taskId, first.taskId)
  assert.equal(state.calls.filter((c: any) => c.kind === 'image').length, 1)
  await done(await call('generate_image', { ...imageArgs, requestKey: 'image-2', references: [image.result.assetId] }))
  assert.equal(state.calls.at(-1).references[0].source, 'local-image://images/result.png')
  assert.equal(state.calls.at(-1).references[0].ownerScopeId, 'owner-a')
  const preview = await call('get_media_asset', { assetId: image.result.assetId, includePreview: true })
  assert.equal(preview.imageContent.type, 'image')
  for (const mode of ['text-to-video', 'image-to-video', 'reference-to-video']) {
    const extras = mode === 'image-to-video' ? { startImage: image.result.assetId } : mode === 'reference-to-video' ? { references: [image.result.assetId] } : {}
    const result = await done(await call('generate_video', { requestKey: mode, prompt: 'Walk', mode, model: 'Veo_3.1-Fast', ...extras }))
    assert.equal(result.status, 'completed', mode)
  }
  await assert.rejects(call('generate_video', { requestKey: 'bad-video', prompt: 'x', mode: 'image-to-video', model: 'Veo_3.1-Fast' }), /startImage/)
  await assert.rejects(call('generate_video', { requestKey: 'bad-grok', prompt: 'x', mode: 'reference-to-video', model: 'Grok Imagine Video', references: [image.result.assetId] }), /does not support/)
  const profileJob = await call('create_voice_profile', { requestKey: 'clone-profile', name: 'Narrator', modelId: 'omnivoice-main', referenceAudioPath: 'D:\\sample.wav', referenceText: 'Hello' })
  const profile = await done(profileJob)
  const cloned = await done(await call('create_tts_audio', { requestKey: 'clone', text: 'Hello world', modelId: 'omnivoice-main', voiceProfileId: profile.result.voiceProfileId }))
  assert.equal(cloned.status, 'completed')
  assert.equal(state.calls.at(-1).referenceAudioPath, 'D:\\sample.wav')
  for (const modelId of ['capcut-online', 'gemini-2.5-flash-preview-tts', 'vbee-api', 'vieneu-v3-turbo']) {
    const catalog = await call('list_voice_profiles', { modelId })
    const result = await done(await call('create_tts_audio', { requestKey: modelId, text: 'Hello', modelId, voiceId: catalog.voices[0].id }))
    assert.equal(result.status, 'completed', JSON.stringify(result))
    assert.equal(state.calls.at(-1).mode, 'preset')
  }
  await assert.rejects(call('create_tts_audio', { requestKey: 'wrong-engine', text: 'x', modelId: 'capcut-online', voiceProfileId: profile.result.voiceProfileId }), /different TTS engine/)
  state.waitTts = true
  const audioJob = await call('create_tts_audio', { requestKey: 'cancel-audio', text: 'x', modelId: 'omnivoice-main' })
  await tick(); await call('cancel_media_task', { taskId: audioJob.taskId }); await tick()
  assert.equal((await done(audioJob)).status, 'cancelled')
  assert.ok(state.cancelCalls.includes(audioJob.taskId))
  assert.equal(state.ttsListeners.size, 0)
  state.plan = 'free'
  await assert.rejects(call('generate_image', { ...imageArgs, requestKey: 'blocked' }), /same plan/)
  console.log('MCP media tests passed: validation, deduplication, recovery, cancellation, image chaining, 3 video modes, clone and 4 preset engines.')
}
void main().catch((error) => { console.error(error); process.exitCode = 1 })
