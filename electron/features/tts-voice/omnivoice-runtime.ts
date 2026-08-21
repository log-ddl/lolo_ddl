import { dialog, shell } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { cancelFFmpeg } from '../../ffmpeg-runtime'
import { cancelAllCapCutJobs, cancelCapCutJob, generateCapCutTts } from './capcut-runtime'
import { cancelAllGeminiJobs, cancelGeminiJob, generateGeminiTts } from './gemini-runtime'
import { cancelAllVbeeJobs, cancelVbeeJob, generateVbeeTts } from './vbee-runtime'
import { cancelVieneu, generateVieneu, getVieneuStatus, installVieneu, removeVieneu } from './vieneu-runtime'

import {
  ALLOWED_MODELS,
  assertAllowedModel,
  canceledJobs,
  downloadControllers,
  jobs,
  type Emit,
} from './omnivoice/constants'
import {
  isInstalled,
  isRuntimeCurrent,
  sourceRoot,
  modelPath,
  modelRoot,
  outputRoot,
  venvPython,
  workerPath,
} from './omnivoice/paths'
import { ensureRuntime, hasNvidiaGpu, probeRuntime, runStep, utf8Environment } from './omnivoice/bootstrap'
import { generateSplit, lineJobs, safeProfilePromptPath, splitLines, splitSentences, splitVbeeText } from './omnivoice/text-split'

export interface TtsModelDescriptor {
  id: string
  repository: string
  capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu'
}

export interface TtsRuntimeProgress {
  jobId: string
  kind: 'install' | 'generate'
  stage: string
  percent?: number
  message: string
}

export interface TtsGeneratePayload {
  jobId: string
  model: TtsModelDescriptor
  text: string
  mode: 'clone' | 'design' | 'auto' | 'preset'
  splitMode?: 'default' | 'line' | 'sentence'
  language?: string
  speed?: number
  numStep?: number
  capcutVoiceType?: string
  capcutResourceId?: string
  geminiVoiceName?: string
  geminiStyle?: string
  geminiTemperature?: number
  vbeeVoiceCode?: string
  vbeeAudioType?: 'mp3' | 'wav'
  vbeeBitrate?: number
  vieneuVoice?: string
  vieneuStyle?: 'tu_nhien' | 'tin_tuc' | 'doc_truyen'
  advancedSettings?: {
    audioChunkDuration?: number
    audioChunkThreshold?: number
    guidanceScale?: number
    tShift?: number
    positionTemperature?: number
    classTemperature?: number
    layerPenaltyFactor?: number
    denoise?: boolean
    preprocessPrompt?: boolean
    postprocessOutput?: boolean
    padDuration?: number
    fadeDuration?: number
  }
  instruction?: string
  profileId?: string
  referenceAudioPath?: string
  referenceText?: string
}

export async function getTtsModelStatuses(models: TtsModelDescriptor[]) {
  models.filter((model) => model.capability === 'omnivoice').forEach(assertAllowedModel)
  models.filter((model) => model.capability === 'vieneu').forEach(assertAllowedModel)
  const vieneuStatus = models.some((model) => model.capability === 'vieneu') ? await getVieneuStatus() : null
  // Supported desktop targets bootstrap a private Python 3.12 when needed.
  const pythonAvailable = true
  const runtimeReady = fs.existsSync(venvPython()) && isRuntimeCurrent()
  const [probe, nvidiaAvailable] = await Promise.all([
    runtimeReady ? probeRuntime() : Promise.resolve(null),
    hasNvidiaGpu(),
  ])
  const runtimeNeedsRepair = !runtimeReady || (nvidiaAvailable && probe?.backend !== 'cuda')
  return models.map((model) => model.capability === 'vieneu' && vieneuStatus ? vieneuStatus : model.capability === 'capcut' || model.capability === 'gemini' || model.capability === 'vbee' ? ({
    modelId: model.id,
    status: 'ready',
    runtimeReady: true,
    pythonAvailable: true,
    accelerator: undefined,
  }) : ({
    modelId: model.id,
    status: isInstalled(model.id) ? (runtimeNeedsRepair ? 'incompatible' : 'ready') : 'not-installed',
    installedPath: isInstalled(model.id) ? modelPath(model.id) : undefined,
    runtimeReady,
    pythonAvailable,
    cudaAvailable: probe ? probe.backend === 'cuda' : undefined,
    accelerator: probe?.backend,
    messageKey: !pythonAvailable
      ? (process.platform === 'win32' ? 'tts.runtime.pythonAutoInstall' : 'tts.runtime.pythonRequiredMac')
      : runtimeNeedsRepair
        ? 'tts.runtime.cudaRepairRequired'
        : probe?.backend === 'mps'
          ? 'tts.runtime.mpsExperimental'
          : runtimeReady && probe?.backend === 'cpu'
            ? 'tts.runtime.cpuOnly'
            : undefined,
  }))
}

export async function installTtsModel(jobId: string, model: TtsModelDescriptor, emit: Emit) {
  try {
    assertAllowedModel(model)
    if (model.capability === 'vieneu') return await installVieneu(jobId, emit)
    if (!fs.existsSync(path.join(sourceRoot(), 'omnivoice'))) {
      throw new Error('Không tìm thấy source OmniVoice đi kèm ứng dụng')
    }
    await ensureRuntime(jobId, emit)
    fs.mkdirSync(modelRoot(), { recursive: true })
    await runStep(
      jobId,
      venvPython(),
      ['-X', 'utf8', workerPath(), 'download', '--repository', model.repository, '--output', modelPath(model.id)],
      emit,
      'model.download',
      50,
    )
    fs.writeFileSync(path.join(modelPath(model.id), '.model-ready'), `${model.repository}\n`, 'utf8')
    emit({ jobId, kind: 'install', stage: 'done', percent: 100, message: 'OmniVoice đã sẵn sàng' })
    return { success: true }
  } catch (error) {
    const canceled = canceledJobs.delete(jobId)
    return { success: false, canceled, error: error instanceof Error ? error.message : String(error) }
  }
}

interface PendingWorkerRequest {
  resolve: (result: Record<string, unknown>) => void
  emit: Emit
}

class PersistentOmniVoiceWorker {
  private child: ChildProcessWithoutNullStreams | null = null
  private pending = new Map<string, PendingWorkerRequest>()
  private stderr = ''

  private start() {
    if (this.child && !this.child.killed) return
    const child = spawn(venvPython(), ['-X', 'utf8', workerPath(), 'serve'], {
      windowsHide: true,
      env: utf8Environment(),
    })
    this.child = child
    this.stderr = ''
    const lines = readline.createInterface({ input: child.stdout })
    lines.on('line', (line) => this.handleLine(line))
    child.stderr.on('data', (chunk) => { this.stderr = `${this.stderr}${String(chunk)}`.slice(-6000) })
    child.on('error', (error) => this.failAll(error.message))
    child.on('close', (code) => {
      if (this.child === child) this.child = null
      this.failAll(this.stderr || `OmniVoice worker dừng với mã ${code}`)
    })
  }

  private handleLine(line: string) {
    try {
      const event = JSON.parse(line) as Record<string, unknown>
      const jobId = String(event.jobId || '')
      const pending = this.pending.get(jobId)
      if (!pending) return
      if (event.type === 'progress') {
        pending.emit({
          jobId,
          kind: 'generate',
          stage: String(event.stage || 'generating'),
          percent: typeof event.percent === 'number' ? event.percent : undefined,
          message: String(event.message || 'Đang tạo giọng'),
        })
      } else if (event.type === 'result') {
        this.pending.delete(jobId)
        pending.resolve(event)
      }
    } catch {
      // Native libraries may write non-JSON logs to stdout.
    }
  }

  private failAll(message: string) {
    for (const [jobId, pending] of this.pending) {
      this.pending.delete(jobId)
      pending.resolve({
        success: false,
        canceled: canceledJobs.delete(jobId),
        error: message,
      })
    }
  }

  request(jobId: string, payload: Record<string, unknown>, emit: Emit) {
    this.start()
    return new Promise<Record<string, unknown>>((resolve) => {
      this.pending.set(jobId, { resolve, emit })
      this.child?.stdin.write(`${JSON.stringify({ ...payload, jobId })}\n`)
    })
  }

  stop(jobId?: string) {
    if (jobId && !this.pending.has(jobId)) return false
    if (jobId) canceledJobs.add(jobId)
    if (this.child) {
      this.child.kill()
      this.child = null
    }
    return true
  }
}

const omniWorker = new PersistentOmniVoiceWorker()

export async function generateTts(payload: TtsGeneratePayload, emit: Emit) {
  if (payload.model.capability === 'vbee') {
    const parts = splitVbeeText(payload.text)
    if (parts.length > 1) {
      emit({
        jobId: payload.jobId,
        kind: 'generate',
        stage: 'chunking',
        percent: 3,
        message: `Văn bản vượt 50.000 ký tự, đã chia thành ${parts.length} phần`,
      })
      return generateSplit(
        generateTts,
        { ...payload, splitMode: 'default' },
        parts,
        emit,
        { unitLabel: 'phần', stage: 'vbee-part-generating', gapSec: 0 },
      )
    }
    return generateVbeeTts({
      jobId: payload.jobId,
      text: parts[0] || '',
      voiceCode: payload.vbeeVoiceCode || '',
      speed: payload.speed,
      audioType: payload.vbeeAudioType,
      bitrate: payload.vbeeBitrate,
    }, emit)
  }

  if (payload.splitMode && payload.splitMode !== 'default') {
    const parts = payload.splitMode === 'line' ? splitLines(payload.text) : splitSentences(payload.text)
    if (parts.length > 1) return generateSplit(generateTts, payload, parts, emit)
  }
  if (payload.model.capability === 'vieneu') {
    assertAllowedModel(payload.model)
    return generateVieneu({
      jobId: payload.jobId,
      text: payload.text,
      mode: payload.mode === 'clone' ? 'clone' : 'preset',
      voice: payload.vieneuVoice,
      style: payload.vieneuStyle,
      referenceAudioPath: payload.referenceAudioPath,
    }, emit)
  }
  if (payload.model.capability === 'capcut') {
    return generateCapCutTts({
      jobId: payload.jobId,
      text: payload.text,
      speed: payload.speed,
      capcutVoiceType: payload.capcutVoiceType,
      capcutResourceId: payload.capcutResourceId,
    }, emit)
  }
  if (payload.model.capability === 'gemini') {
    return generateGeminiTts({
      jobId: payload.jobId,
      text: payload.text,
      modelId: payload.model.id,
      language: payload.language,
      voiceName: payload.geminiVoiceName,
      style: payload.geminiStyle,
      temperature: payload.geminiTemperature,
    }, emit)
  }
  assertAllowedModel(payload.model)
  if (!isInstalled(payload.model.id)) return { success: false, error: 'Model chưa được tải' }
  if (!fs.existsSync(venvPython())) return { success: false, error: 'OmniVoice runtime chưa được cài đặt' }
  if (payload.mode === 'clone' && (!payload.referenceAudioPath || !payload.referenceText)) {
    return { success: false, error: 'Voice Clone cần audio và transcript tham chiếu' }
  }
  if (payload.mode === 'design' && !payload.instruction?.trim()) {
    return { success: false, error: 'Voice Design cần mô tả giọng' }
  }

  fs.mkdirSync(outputRoot(), { recursive: true })
  const outputPath = path.join(outputRoot(), `${payload.jobId}.wav`)
  const advanced = payload.advancedSettings
  const clamp = (value: number | undefined, min: number, max: number, fallback: number) =>
    Math.min(max, Math.max(min, Number.isFinite(value) ? Number(value) : fallback))
  const advancedSettings = advanced ? {
    audioChunkDuration: clamp(advanced.audioChunkDuration, 5, 60, 15),
    audioChunkThreshold: clamp(advanced.audioChunkThreshold, 5, 120, 30),
    guidanceScale: clamp(advanced.guidanceScale, 0, 5, 2),
    tShift: clamp(advanced.tShift, 0, 1, 0.1),
    positionTemperature: clamp(advanced.positionTemperature, 0, 10, 5),
    classTemperature: clamp(advanced.classTemperature, 0, 10, 0),
    layerPenaltyFactor: clamp(advanced.layerPenaltyFactor, 0, 10, 5),
    denoise: advanced.denoise !== false,
    preprocessPrompt: advanced.preprocessPrompt !== false,
    postprocessOutput: advanced.postprocessOutput !== false,
    padDuration: clamp(advanced.padDuration, 0, 2, 0.1),
    fadeDuration: clamp(advanced.fadeDuration, 0, 2, 0.1),
  } : undefined
  if (advancedSettings && advancedSettings.audioChunkThreshold < advancedSettings.audioChunkDuration) {
    advancedSettings.audioChunkThreshold = advancedSettings.audioChunkDuration
  }

  return omniWorker.request(payload.jobId, {
    command: 'generate',
    modelPath: modelPath(payload.model.id),
    outputPath,
    promptPath: safeProfilePromptPath(payload.profileId),
    text: payload.text,
    mode: payload.mode,
    language: payload.language === 'auto' ? null : payload.language || 'vi',
    speed: Math.min(1.5, Math.max(0.75, payload.speed || 1)),
    numStep: [8, 12, 16, 24, 32].includes(payload.numStep || 24) ? payload.numStep : 24,
    advancedSettings,
    instruction: payload.instruction,
    referenceAudioPath: payload.referenceAudioPath,
    referenceText: payload.referenceText,
  }, emit)
}

export async function removeTtsModel(modelId: string) {
  if (!ALLOWED_MODELS.has(modelId)) throw new Error('Model TTS không được phép')
  if (modelId === 'vieneu-v3-turbo') return removeVieneu()
  omniWorker.stop()
  const target = path.resolve(modelPath(modelId))
  const root = path.resolve(modelRoot())
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Đường dẫn model không hợp lệ')
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
  return { success: true }
}

export function cancelTtsJob(jobId: string) {
  if (cancelVieneu(jobId)) return { canceled: true }
  const subs = lineJobs.get(jobId)
  if (subs && subs.length) {
    let canceled = cancelFFmpeg(jobId)
    for (const sub of subs) {
      canceled = cancelCapCutJob(sub) || canceled
      canceled = cancelGeminiJob(sub) || canceled
      canceled = cancelVbeeJob(sub) || canceled
      if (omniWorker.stop(sub)) canceled = true
    }
    return { canceled }
  }
  const capcutCanceled = cancelCapCutJob(jobId)
  const geminiCanceled = cancelGeminiJob(jobId)
  const vbeeCanceled = cancelVbeeJob(jobId)
  const download = downloadControllers.get(jobId)
  if (download) {
    canceledJobs.add(jobId)
    download.abort()
    downloadControllers.delete(jobId)
    return { canceled: true }
  }
  const child = jobs.get(jobId)
  if (child) {
    canceledJobs.add(jobId)
    child.kill()
    jobs.delete(jobId)
    return { canceled: true }
  }
  return { canceled: capcutCanceled || geminiCanceled || vbeeCanceled || omniWorker.stop(jobId) }
}

export async function pickReferenceAudio(title?: string) {
  const result = await dialog.showOpenDialog({
    title,
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['wav', 'mp3', 'm4a', 'aac', 'flac', 'ogg'] }],
  })
  return { path: result.canceled ? null : result.filePaths[0] || null }
}

export async function exportTtsAudio(sourcePath: string, title?: string) {
  if (!fs.existsSync(sourcePath)) return { success: false, error: 'Không tìm thấy file audio' }
  const extension = path.extname(sourcePath).toLowerCase() === '.mp3' ? 'mp3' : 'wav'
  const result = await dialog.showSaveDialog({
    title,
    defaultPath: path.basename(sourcePath),
    filters: [{ name: extension === 'mp3' ? 'MP3 audio' : 'Wave audio', extensions: [extension] }],
  })
  if (result.canceled || !result.filePath) return { success: false, canceled: true }
  fs.copyFileSync(sourcePath, result.filePath)
  return { success: true, filePath: result.filePath }
}

export async function revealTtsAudio(filePath: string) {
  if (fs.existsSync(filePath)) shell.showItemInFolder(filePath)
  return { success: fs.existsSync(filePath) }
}

export function cancelAllTtsJobs() {
  cancelAllCapCutJobs()
  cancelAllGeminiJobs()
  cancelAllVbeeJobs()
  for (const [jobId, controller] of downloadControllers) {
    canceledJobs.add(jobId)
    controller.abort()
    downloadControllers.delete(jobId)
  }
  for (const [jobId, child] of jobs) {
    canceledJobs.add(jobId)
    child.kill()
    jobs.delete(jobId)
  }
  omniWorker.stop()
}
