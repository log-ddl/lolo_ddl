import { useTtsStore } from '@/features/tts-voice/stores/tts-store'
import { getTtsModel, TTS_MODELS } from '@/features/tts-voice/lib/model-registry'
import { CAPCUT_VOICES } from '@/features/tts-voice/lib/capcut-voices'
import { GEMINI_VOICES } from '@/features/tts-voice/lib/gemini-voices'
import { toRuntimeModel, toLocalTtsAudioUrl } from '@/features/tts-voice/lib/runtime-model'
import type { TtsCapability, TtsMode } from '@/features/tts-voice/types'
import type { MediaTasks } from './media-tasks'

type Args = Record<string, unknown>
const value = (args: Args, key: string) => typeof args[key] === 'string' ? args[key].trim() : undefined
function runtime() {
  if (!window.ttsRuntime) throw new Error('TTS requires the desktop app')
  return window.ttsRuntime
}
function modelFor(args: Args) {
  const id = value(args, 'modelId') || useTtsStore.getState().selectedModelId
  const model = getTtsModel(id)
  if (!model) throw new Error(`Unknown TTS model: ${id}`)
  return model
}
function audioPath(path: string) {
  if (!/^(?:[a-z]:[\\/]|\/|\\\\)/i.test(path) || !/\.(wav|mp3|flac|m4a|ogg|aac|webm)$/i.test(path)) {
    throw new Error('referenceAudioPath must be an absolute audio file path')
  }
  return path
}
export async function listTtsModels() {
  const statuses = await runtime().getModelStatuses(TTS_MODELS.map(toRuntimeModel))
  return TTS_MODELS.map(({ id, name, providerId, capabilities }) => ({
    id, name, providerId, capabilities, status: statuses.find((s) => s.modelId === id),
  }))
}
export async function listVoices(args: Args) {
  const model = modelFor(args)
  const language = value(args, 'language')
  let voices: { id: string; name: string; language?: string }[] = []
  if (model.runtimeCapability === 'capcut') voices = CAPCUT_VOICES.map((v) => ({ id: v.voiceType, name: v.displayName, language: v.languageCode }))
  if (model.runtimeCapability === 'gemini') voices = GEMINI_VOICES.map((v) => ({ id: v.name, name: v.name }))
  if (model.runtimeCapability === 'vbee') {
    const result = await runtime().getVbeeVoices()
    if (!result.success) throw new Error(result.error || 'Unable to load Vbee voices')
    voices = result.voices.map((v) => ({ id: v.code, name: v.name, language: v.languageCode }))
  }
  if (model.runtimeCapability === 'vieneu') {
    const result = await runtime().getVieneuVoices()
    if (!result.success) throw new Error(result.error || 'Unable to load VieNeu voices')
    voices = result.voices.map((v) => ({ id: v.id, name: v.label }))
  }
  return {
    modelId: model.id, capabilities: model.capabilities,
    voices: voices.filter((v) => !language || !v.language || v.language.toLowerCase().startsWith(language.toLowerCase())),
    profiles: useTtsStore.getState().voiceProfiles.filter((p) => p.providerId === model.providerId).map(({ id, name, modelId }) => ({ id, name, modelId })),
  }
}
export function createVoiceProfile(args: Args, tasks: MediaTasks) {
  const model = modelFor(args)
  if (!model.capabilities.includes('voice-clone')) throw new Error('This model does not support voice cloning')
  const referenceAudioPath = audioPath(String(args.referenceAudioPath))
  const referenceText = value(args, 'referenceText') || ''
  if (model.runtimeCapability === 'omnivoice' && !referenceText) throw new Error('OmniVoice requires referenceText')
  return tasks.start('create_voice_profile', args, async ({ taskId }) => {
    const profile = { id: taskId, name: String(args.name).trim(), modelId: model.id, providerId: model.providerId, referenceAudioPath, referenceText, createdAt: Date.now() }
    useTtsStore.getState().addVoiceProfile(profile)
    return { voiceProfileId: profile.id, name: profile.name, modelId: profile.modelId }
  })
}
export function createSpeech(args: Args, tasks: MediaTasks) {
  const model = modelFor(args)
  const store = useTtsStore.getState()
  const profileId = value(args, 'voiceProfileId')
  const profile = profileId ? store.voiceProfiles.find((p) => p.id === profileId) : undefined
  if (profileId && !profile) throw new Error('Unknown voiceProfileId')
  if (profile && profile.providerId !== model.providerId) throw new Error('Voice profile belongs to a different TTS engine')
  const referenceAudioPath = value(args, 'referenceAudioPath') || profile?.referenceAudioPath
  const referenceText = value(args, 'referenceText') || profile?.referenceText
  const instruction = value(args, 'voiceDesignDescription')
  const mode = (args.mode || (referenceAudioPath ? 'clone' : instruction ? 'design' : model.capabilities.includes('preset-voice') ? 'preset' : 'auto')) as TtsMode
  const capabilities: Record<TtsMode, TtsCapability> = { clone: 'voice-clone', design: 'voice-design', auto: 'auto-voice', preset: 'preset-voice' }
  if (!model.capabilities.includes(capabilities[mode])) throw new Error(`Model ${model.id} does not support ${mode}`)
  if (mode === 'clone') {
    if (!referenceAudioPath) throw new Error('Clone mode requires voiceProfileId or referenceAudioPath')
    audioPath(referenceAudioPath)
    if (model.runtimeCapability === 'omnivoice' && !referenceText) throw new Error('OmniVoice clone requires referenceText')
  } else if (referenceAudioPath || profileId || referenceText) throw new Error('Audio references require clone mode')
  if (mode === 'design' && !instruction) throw new Error('Design mode requires voiceDesignDescription')
  if (instruction && mode !== 'design') throw new Error('voiceDesignDescription requires design mode')
  if (args.voiceId && mode !== 'preset') throw new Error('voiceId requires preset mode')
  if (profileId && args.referenceAudioPath) throw new Error('Use either voiceProfileId or referenceAudioPath')
  const cap = model.runtimeCapability
  const voiceId = value(args, 'voiceId') || (cap === 'capcut' ? store.capcutVoiceType : cap === 'gemini' ? store.geminiVoiceName : cap === 'vbee' ? store.vbeeVoiceCode : store.vieneuVoice)
  const api = runtime()
  return tasks.start('create_tts_audio', args, async ({ taskId, signal, progress }) => {
    const statuses = await api.getModelStatuses([toRuntimeModel(model)])
    if (statuses[0]?.status !== 'ready') throw new Error(statuses[0]?.message || 'Configure or install the selected TTS model in the app first')
    if (mode === 'preset') {
      const catalog = await listVoices({ modelId: model.id })
      if (!catalog.voices.some((v) => v.id === voiceId)) throw new Error(`Unknown voiceId for ${model.id}: ${voiceId}`)
    }
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    const cancel = () => { void api.cancel(taskId).catch(() => undefined) }
    signal.addEventListener('abort', cancel, { once: true })
    const off = api.onEvent((event) => { if (event.jobId === taskId) progress(event.stage, event.percent) })
    try {
      const result = await api.generate({
        jobId: taskId, model: toRuntimeModel(model), text: String(args.text).trim(), mode,
        language: value(args, 'language') || (cap === 'capcut' ? store.capcutLanguage : cap === 'gemini' ? store.geminiLanguage : store.language),
        speed: typeof args.speed === 'number' ? args.speed : store.speed,
        splitMode: store.splitMode, numStep: store.numStep,
        advancedSettings: store.advancedEnabled ? store.advancedSettings : undefined,
        capcutVoiceType: cap === 'capcut' ? voiceId : undefined,
        capcutResourceId: cap === 'capcut' ? CAPCUT_VOICES.find((v) => v.voiceType === voiceId)?.resourceId : undefined,
        geminiVoiceName: cap === 'gemini' ? voiceId : undefined,
        geminiStyle: store.geminiStyle, geminiTemperature: store.geminiTemperature,
        vbeeVoiceCode: cap === 'vbee' ? voiceId : undefined, vbeeAudioType: store.vbeeAudioType, vbeeBitrate: store.vbeeBitrate,
        vieneuVoice: cap === 'vieneu' ? voiceId : undefined, vieneuStyle: store.vieneuStyle,
        instruction, profileId, referenceAudioPath, referenceText,
      })
      if (!result.success || !result.outputPath) throw new Error(result.error || (result.canceled ? 'Cancelled' : 'TTS returned no audio'))
      useTtsStore.getState().addHistory({ id: taskId, name: String(args.text).slice(0, 80), modelId: model.id, text: String(args.text), mode, voiceLabel: profile?.name || voiceId || mode, outputPath: result.outputPath, createdAt: Date.now() })
      return { assetId: `asset-${taskId}`, kind: 'audio', source: toLocalTtsAudioUrl(result.outputPath), outputPath: result.outputPath, durationSec: result.durationSec, model: model.id, provider: model.providerId }
    } finally { off(); signal.removeEventListener('abort', cancel) }
  })
}
