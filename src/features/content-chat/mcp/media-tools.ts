import { validateMediaArguments } from './media-tool-definitions'
import { MediaTasks, type MediaAsset } from './media-tasks'
import { createSpeech, createVoiceProfile, listTtsModels, listVoices } from './voice-tools'
import { GOOGLE_FLOW_IMAGE_MODELS, GOOGLE_FLOW_VIDEO_MODELS, GROK_VIDEO_MODELS, QWEN_LOCAL_IMAGE_MODEL } from '@/features/video-studio/lib/api-key-manager'
import { configuredImageModel, configuredVideoModel, resolveSettingsMediaRouting } from '@/features/video-studio/lib/ai/media-routing'
import { generateImageWithSelectedProvider } from '@/features/video-studio/lib/ai/qwen-local-provider'
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider'
import { grokVideoProvider } from '@/features/video-studio/lib/ai/grok-video-provider'
import { videoDuration, videoDurations } from '@/features/video-studio/lib/ai/video-duration'
import { getAbsoluteImagePath, readImageAsBase64 } from '@/features/video-studio/lib/image-storage'
import { useProjectStore } from '@/features/video-studio/stores/project-store'
import { useLicenseStore } from '@/shared/stores/license-store'
import { hasPlanAccess } from '@/shared/lib/license-client'
import type { GenerationOutput, ProviderMediaRef } from '@/features/video-studio/packages/ai-core/providers/media-provider'

let registry: MediaTasks | undefined
const tasks = () => registry ||= new MediaTasks(window.localStorage)
const text = (args: Record<string, unknown>, key: string) => typeof args[key] === 'string' ? args[key].trim() : undefined

async function imageRef(source: string): Promise<ProviderMediaRef> {
  if (source.startsWith('asset-')) {
    const asset = tasks().asset(source)
    if (asset.kind !== 'image') throw new Error('References must be image assets')
    return { source: asset.source, ownerScopeId: asset.ownerScopeId, flowProjectId: asset.flowProjectId, mediaId: asset.mediaId, credentialId: asset.credentialId }
  }
  if (source.startsWith('local-image://')) {
    const decoded = decodeURIComponent(source.slice('local-image://'.length))
    if (!/^[\w-]+\/[^/\\]+\.(png|jpe?g|webp|gif)$/i.test(decoded) || decoded.includes('..')) throw new Error('Invalid local image reference')
    return { source }
  }
  if (/^(https?:\/\/|idb-image:\/\/|data:image\/)/i.test(source)) return { source }
  if (/^(?:[a-z]:[\\/]|\/|\\\\)/i.test(source)) {
    if (!/\.(png|jpe?g|webp|gif)$/i.test(source)) throw new Error('Reference file must be PNG, JPEG, WebP or GIF')
    const result = await window.imageStorage?.readAsBase64(source)
    if (!result?.success || !result.base64) throw new Error(result?.error || 'Cannot read reference image')
    if (result.mimeType && !result.mimeType.startsWith('image/')) throw new Error('Reference must be an image')
    return { source: result.base64.startsWith('data:') ? result.base64 : `data:${result.mimeType || 'image/png'};base64,${result.base64}` }
  }
  throw new Error('Use an image assetId, image URL or absolute file path')
}
async function outputAsset(taskId: string, kind: 'image' | 'video', model: string, output: GenerationOutput): Promise<MediaAsset> {
  const source = output.localUrl || output.remoteUrl
  if (!source) throw new Error('Provider returned no media')
  return {
    assetId: `asset-${taskId}`, kind, source, model, provider: output.provider,
    outputPath: source.startsWith('local-image://') ? await getAbsoluteImagePath(source) || undefined : undefined,
    mediaId: output.mediaId, ownerScopeId: output.ownerScopeId, flowProjectId: output.flowProjectId, credentialId: output.credentialId,
  }
}

export async function executeMediaTool(name: string, input: unknown): Promise<unknown> {
  const args = validateMediaArguments(name, input)
  const license = useLicenseStore.getState()
  if (!license.userId || !license.deviceAllowed || license.status !== 'active') throw new Error('Sign in to an active app account before using media tools')
  if ((name === 'generate_image' || name === 'generate_video') && !hasPlanAccess(license.plan, 'pro')) throw new Error('Video Studio requires the same plan as the app interface')
  if (name === 'get_media_task') return tasks().get(String(args.taskId))
  if (name === 'list_media_tasks') return tasks().list()
  if (name === 'cancel_media_task') return tasks().cancel(String(args.taskId))
  if (name === 'list_voice_profiles') return listVoices(args)
  if (name === 'create_voice_profile') return createVoiceProfile(args, tasks())
  if (name === 'create_tts_audio') return createSpeech(args, tasks())
  if (name === 'get_media_asset') {
    const asset = tasks().asset(String(args.assetId))
    if (!args.includePreview) return asset
    if (asset.kind !== 'image') throw new Error('Preview is available for image assets only')
    const data = await readImageAsBase64(asset.source)
    const match = data && /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(data)
    if (!match) throw new Error('Unable to read image preview')
    if (match[2].length > 12_000_000) throw new Error('Image exceeds the 9 MB preview limit; use outputPath to inspect it locally')
    return { asset, imageContent: { type: 'image', mimeType: match[1], data: match[2] } }
  }
  if (name === 'list_media_capabilities') {
    let tts: unknown
    try { tts = await listTtsModels() } catch (error) { tts = { error: error instanceof Error ? error.message : String(error) } }
    const connectionStatus = async (runtime: typeof window.googleFlowRuntime | typeof window.grokVideoRuntime) => {
      try {
        const status = await runtime?.getStatus()
        return status ? { running: status.running, readyAccounts: status.readyCredentialCount, videoLanes: status.videoLaneCount } : { running: false, readyAccounts: 0 }
      } catch { return { running: false, readyAccounts: 0 } }
    }
    return {
      connections: { googleflow: await connectionStatus(window.googleFlowRuntime), grok: await connectionStatus(window.grokVideoRuntime) },
      images: [...GOOGLE_FLOW_IMAGE_MODELS, QWEN_LOCAL_IMAGE_MODEL].map((model) => ({ model, provider: model === QWEN_LOCAL_IMAGE_MODEL ? 'qwen-local' : 'googleflow', maxReferences: 10 })),
      videos: [...GOOGLE_FLOW_VIDEO_MODELS, ...GROK_VIDEO_MODELS].map((model) => ({
        model, provider: GROK_VIDEO_MODELS.includes(model) ? 'grok' : 'googleflow', durations: videoDurations(model),
        modes: GROK_VIDEO_MODELS.includes(model) ? ['text-to-video', 'image-to-video'] : ['text-to-video', 'image-to-video', 'reference-to-video'],
        maxReferences: GROK_VIDEO_MODELS.includes(model) ? 0 : 3,
      })),
      defaults: { image: configuredImageModel('scene_generation'), video: configuredVideoModel() },
      tts, note: 'Model availability depends on app account sessions, quota and installed local models. No models are installed automatically. Media tasks require the app to remain open.',
    }
  }
  const kind = name === 'generate_image' ? 'image' : 'video'
  const model = text(args, 'model') || (kind === 'image' ? configuredImageModel('scene_generation') : configuredVideoModel())
  if (!model) throw new Error('Choose a model or configure the generation feature in app settings')
  const models = kind === 'image' ? [...GOOGLE_FLOW_IMAGE_MODELS, QWEN_LOCAL_IMAGE_MODEL] : [...GOOGLE_FLOW_VIDEO_MODELS, ...GROK_VIDEO_MODELS]
  if (!models.includes(model)) throw new Error(`Unsupported ${kind} model: ${model}`)
  const grok = GROK_VIDEO_MODELS.includes(model)
  const references = (args.references || []) as string[]
  const start = text(args, 'startImage'), end = text(args, 'endImage')
  if (kind === 'video') {
    if (args.mode === 'text-to-video' && (start || end || references.length)) throw new Error('text-to-video does not accept images')
    if (args.mode === 'image-to-video' && (!start || references.length)) throw new Error('image-to-video requires startImage and does not accept references')
    if (args.mode === 'reference-to-video' && (!references.length || start || end)) throw new Error('reference-to-video requires references and does not accept startImage/endImage')
    if (grok && args.mode === 'reference-to-video') throw new Error('Grok does not support reference-to-video in this app; choose a Google Flow model')
    if (args.duration && !videoDurations(model).some((duration) => duration === args.duration)) throw new Error('Unsupported duration for this model')
    if (args.mode === 'reference-to-video' && model !== 'Gemini_Omni_Flash' && args.duration && args.duration !== 8) throw new Error('Veo reference-to-video requires 8 seconds')
  }
  const projectId = text(args, 'projectId') || useProjectStore.getState().activeProjectId || 'mcp-media'
  return tasks().start(name, args, async ({ taskId, signal, progress }) => {
    if (model !== QWEN_LOCAL_IMAGE_MODEL) {
      progress('starting-runtime')
      if (!window.videoStudioBrowser) throw new Error('Browser generation requires the desktop app')
      await window.videoStudioBrowser.startRuntimes()
      // Startup registers IPC immediately, while saved browser sessions restore asynchronously.
      // Wait for the provider handshake instead of failing the first external MCP call.
      const runtime = grok ? window.grokVideoRuntime : window.googleFlowRuntime
      if (!runtime) throw new Error('The selected browser provider is unavailable')
      progress('connecting-account')
      const deadline = Date.now() + 60_000
      while (!signal.aborted) {
        if ((await runtime.getStatus()).readyCredentialCount > 0) break
        if (Date.now() >= deadline) throw new Error(`No connected ${grok ? 'Grok' : 'Google Flow'} account. Connect an account in Video Studio and retry with a new requestKey.`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    }
    progress('preparing-references')
    const refs = await Promise.all(references.map(imageRef))
    const startImage = start ? await imageRef(start) : undefined
    const endImage = end ? await imageRef(end) : undefined
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    const routing = grok ? undefined : await resolveSettingsMediaRouting(kind, model)
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    const common = {
      taskId, projectId, model, prompt: String(args.prompt).trim(), aspectRatio: text(args, 'aspectRatio') || '16:9',
      references: refs, signal,
      allowedOwnerScopeIds: routing?.accountsFor(model),
      onSubmitted: () => progress('submitted'),
    }
    progress('queued')
    const output = kind === 'image'
      ? await generateImageWithSelectedProvider(common)
      : await (grok ? grokVideoProvider : googleFlowProvider).generateVideo({ ...common, sceneId: taskId, startImage, endImage, duration: videoDuration(model, args.duration as number | undefined) })
    return outputAsset(taskId, kind, model, output)
  })
}
