import { app } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import readline from 'node:readline'
import os from 'node:os'
import { ensureManagedPython } from './managed-python'
import { assertAllowedModel, canceledJobs, jobs, type Emit } from './omnivoice/constants'
import type { TtsGeneratePayload, TtsModelDescriptor } from './omnivoice-runtime'

const VERSION = 1
const MLX_RUNTIME_VERSION = 1
const MLX_ENGINE = 'qwen3-mlx'
const installingJobs = new Set<string>()
let generationInProgress = false

export function cancelLocalInstall(jobId: string) {
  if (!installingJobs.has(jobId)) return false
  canceledJobs.add(jobId)
  jobs.get(jobId)?.kill()
  return true
}

export function cancelAllLocalInstalls() {
  for (const jobId of installingJobs) cancelLocalInstall(jobId)
}
const root = (engine: string) => path.join(app.getPath('userData'), 'runtimes', engine)
const modelPath = (model: TtsModelDescriptor) => path.join(app.getPath('userData'), 'models', model.capability, model.id)
const pythonPath = (engine: string) => path.join(root(engine), '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
// MLX needs native Apple Silicon and macOS 14+. Base cloning keeps the
// official SDK because the MLX ICL implementation changes decoding settings.
const usesMlx = (model: TtsModelDescriptor) => process.platform === 'darwin' && process.arch === 'arm64'
  && Number(os.release().split('.')[0]) >= 23 && model.capability === 'qwen3'
  && /-(VoiceDesign|CustomVoice)$/.test(model.repository)
function mlxReady() {
  try {
    return fs.existsSync(pythonPath(MLX_ENGINE))
      && JSON.parse(fs.readFileSync(path.join(root(MLX_ENGINE), '.runtime-ready'), 'utf8')).version === MLX_RUNTIME_VERSION
  } catch { return false }
}
const modelPython = (model: TtsModelDescriptor) => pythonPath(usesMlx(model) ? MLX_ENGINE : model.capability)
const workerPath = () => app.isPackaged
  ? path.join(process.resourcesPath, 'tts-worker', 'local_models_worker.py')
  : path.join(process.env.APP_ROOT || process.cwd(), 'electron/features/tts-voice/python/local_models_worker.py')

function checkCanceled(jobId: string) {
  if (canceledJobs.has(jobId)) throw new Error('Tác vụ đã hủy')
}

/** All child processes use the common registry, including pip and model downloads. */
function run(jobId: string, command: string, args: string[], model: TtsModelDescriptor, emit: Emit,
  kind: 'install' | 'generate', stage: string, request?: Record<string, unknown>) {
  checkCanceled(jobId)
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true, cwd: root(model.capability),
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8',
        ...(model.capability === 'cosyvoice' ? { PYTORCH_ENABLE_MPS_FALLBACK: '1' } : {}),
        HF_HOME: path.join(root(model.capability), 'cache'), PYTHONUNBUFFERED: '1' },
    })
    jobs.set(jobId, child)
    let tail = ''
    let result: Record<string, unknown> | undefined
    const lines = readline.createInterface({ input: child.stdout })
    lines.on('line', (line) => {
      try {
        const event = JSON.parse(line)
        if (event.type === 'result') { result = event; return }
        if (event.type === 'progress') {
          emit({ jobId, kind, stage: event.stage || stage, percent: event.percent, message: event.message || stage })
          return
        }
      } catch { /* Dependency logs need not be JSON. */ }
      tail = `${tail}\n${line}`.slice(-6000)
      if (kind === 'install') emit({ jobId, kind, stage, message: line.slice(-500) })
    })
    child.stderr.on('data', (data) => {
      tail = `${tail}${data}`.slice(-6000)
      if (kind === 'install') emit({ jobId, kind, stage, message: String(data).trim().slice(-500) })
    })
    child.on('error', (error) => {
      if (jobs.get(jobId) === child) jobs.delete(jobId)
      reject(error)
    })
    child.on('close', (code) => {
      lines.close()
      if (jobs.get(jobId) === child) jobs.delete(jobId)
      if (canceledJobs.has(jobId)) reject(new Error('Tác vụ đã hủy'))
      else if (code !== 0 || result?.success === false) reject(new Error(String(result?.error || tail || `Worker exited: ${code}`)))
      else if (request && !result) reject(new Error('Worker không trả kết quả'))
      else resolve(result || {})
    })
    child.stdin.on('error', () => { /* close/error handlers report process failure. */ })
    child.stdin.end(request ? JSON.stringify(request) + '\n' : undefined)
  })
}

function worker(jobId: string, model: TtsModelDescriptor, request: Record<string, unknown>, emit: Emit, kind: 'install' | 'generate') {
  return run(jobId, modelPython(model), ['-X', 'utf8', workerPath()], model, emit, kind,
    kind === 'install' ? 'model.download' : 'generating', {
      ...request, engine: model.capability, repository: model.repository,
      modelPath: modelPath(model), sourcePath: path.join(root(model.capability), 'source'),
      backend: usesMlx(model) ? 'mlx' : undefined,
    })
}

interface PendingGeneration {
  jobId: string
  emit: Emit
  resolve: (result: Record<string, unknown>) => void
  reject: (error: Error) => void
}

/** Keep one model loaded at a time; release it after five minutes without work. */
class LocalModelWorker {
  private child: ReturnType<typeof spawn> | null = null
  private modelId: string | null = null
  private pending: PendingGeneration | null = null
  private idleTimer: ReturnType<typeof setTimeout> | undefined

  stop() {
    clearTimeout(this.idleTimer)
    const child = this.child
    this.child = null
    this.modelId = null
    if (this.pending) {
      jobs.delete(this.pending.jobId)
      this.pending.reject(new Error('Worker đã dừng'))
      this.pending = null
    }
    child?.kill()
  }

  releaseIdle() {
    if (this.pending) throw new Error('Model đang tạo giọng. Hãy đợi hoặc hủy tác vụ trước.')
    this.stop()
  }

  request(model: TtsModelDescriptor, payload: Record<string, unknown>, jobId: string, emit: Emit) {
    checkCanceled(jobId)
    if (this.pending) return Promise.reject(new Error('Model đang bận tạo giọng'))
    clearTimeout(this.idleTimer)
    if (this.modelId !== model.id || !this.child || this.child.killed) {
      this.stop()
      const child = spawn(modelPython(model), ['-X', 'utf8', workerPath(), '--serve'], {
        windowsHide: true, cwd: root(model.capability),
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1',
          ...(model.capability === 'cosyvoice' ? { PYTORCH_ENABLE_MPS_FALLBACK: '1' } : {}),
          HF_HOME: path.join(root(model.capability), 'cache') },
      })
      this.child = child
      this.modelId = model.id
      let tail = ''
      const lines = readline.createInterface({ input: child.stdout })
      lines.on('line', (line) => {
        if (this.child !== child) return
        let event: Record<string, unknown>
        try { event = JSON.parse(line) } catch { return }
        const pending = this.pending
        if (!pending || event.jobId !== pending.jobId) return
        if (event.type === 'progress') {
          pending.emit({ jobId: pending.jobId, kind: 'generate', stage: String(event.stage || 'generating'),
            percent: typeof event.percent === 'number' ? event.percent : undefined, message: String(event.message || ''),
            audioChunkPath: typeof event.audioChunkPath === 'string' ? event.audioChunkPath : undefined })
        }
        if (event.type === 'result') {
          this.pending = null
          jobs.delete(pending.jobId)
          if (canceledJobs.has(pending.jobId)) pending.reject(new Error('Tác vụ đã hủy'))
          else if (!event.success) pending.reject(new Error(String(event.error || 'Không thể tạo audio')))
          else pending.resolve(event)
          this.idleTimer = setTimeout(() => this.stop(), 5 * 60_000)
          this.idleTimer.unref()
        }
      })
      child.stderr.on('data', (data) => { tail = `${tail}${data}`.slice(-6000) })
      const fail = (message: string) => {
        if (this.child !== child) return
        const pending = this.pending
        this.pending = null
        this.child = null
        this.modelId = null
        clearTimeout(this.idleTimer)
        if (pending) { jobs.delete(pending.jobId); pending.reject(new Error(message)) }
      }
      child.on('error', (error) => fail(error.message))
      child.on('close', (code) => { lines.close(); fail(tail || `Worker exited: ${code}`) })
      child.stdin.on('error', (error) => { fail(error.message); child.kill() })
    }
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      this.pending = { jobId, emit, resolve, reject }
      const child = this.child!
      jobs.set(jobId, child as import('node:child_process').ChildProcessWithoutNullStreams)
      child.stdin!.write(JSON.stringify({ ...payload, jobId, engine: model.capability, repository: model.repository,
        modelPath: modelPath(model), sourcePath: path.join(root(model.capability), 'source'),
        backend: usesMlx(model) ? 'mlx' : undefined }) + '\n')
    })
  }
}

const generationWorker = new LocalModelWorker()
export function stopLocalModelWorker() { generationWorker.stop() }

export function getLocalModelStatus(model: TtsModelDescriptor) {
  assertAllowedModel(model)
  let marker: { version?: number; accelerator?: 'cuda' | 'cpu' | 'mlx' | 'mps'; repository?: string } = {}
  try { marker = JSON.parse(fs.readFileSync(path.join(modelPath(model), '.model-ready'), 'utf8')) } catch { /* not installed */ }
  // Old installations remain usable: the small MLX runtime is installed on
  // their next generation; their existing model weights are reused unchanged.
  const runtimeReady = usesMlx(model)
    ? mlxReady() || fs.existsSync(pythonPath(model.capability))
    : fs.existsSync(pythonPath(model.capability))
  const ready = marker.version === VERSION && marker.repository === model.repository && runtimeReady
  const accelerator = usesMlx(model) && mlxReady() ? 'mlx' : marker.accelerator
  return {
    modelId: model.id, status: ready ? 'ready' : 'not-installed', runtimeReady: ready,
    pythonAvailable: true, installedPath: ready ? modelPath(model) : undefined,
    accelerator,
    messageKey: ready && accelerator === 'cpu' ? 'tts.local.cpuHint' : undefined,
  }
}

async function ensureMlxRuntime(jobId: string, model: TtsModelDescriptor, emit: Emit, kind: 'install' | 'generate') {
  if (mlxReady()) return
  checkCanceled(jobId)
  fs.mkdirSync(root(MLX_ENGINE), { recursive: true })
  emit({ jobId, kind, stage: 'runtime.dependencies', message: 'Preparing Apple GPU runtime (MLX)…' })
  const python = await ensureManagedPython((stage, percent, message) => {
    checkCanceled(jobId)
    emit({ jobId, kind, stage, percent, message })
  })
  await run(jobId, python, ['-m', 'venv', path.join(root(MLX_ENGINE), '.venv')], model, emit, kind, 'runtime.venv')
  // A separate environment prevents MLX's newer Transformers from changing
  // the official Qwen SDK or CosyVoice dependencies.
  await run(jobId, pythonPath(MLX_ENGINE), ['-m', 'pip', 'install',
    'mlx-audio==0.5.7', 'mlx==0.32.3', 'transformers==5.17.0', 'soundfile==0.13.1'],
  model, emit, kind, 'runtime.dependencies')
  await run(jobId, pythonPath(MLX_ENGINE), ['-c',
    'import mlx.core as mx; from mlx_audio.tts.utils import load_model; import soundfile; assert mx.metal.is_available(); mx.eval(mx.ones(1) + 1)'],
  model, emit, kind, 'runtime.accelerator')
  checkCanceled(jobId)
  fs.writeFileSync(path.join(root(MLX_ENGINE), '.runtime-ready'), JSON.stringify({ version: MLX_RUNTIME_VERSION }))
}

export async function installLocalModel(jobId: string, model: TtsModelDescriptor, emit: Emit) {
  assertAllowedModel(model)
  if (generationInProgress || installingJobs.size) throw new Error('Model đang bận. Hãy đợi hoặc hủy tác vụ trước.')
  generationWorker.releaseIdle()
  installingJobs.add(jobId)
  try {
    const engine = model.capability
    fs.mkdirSync(root(engine), { recursive: true })
    fs.mkdirSync(modelPath(model), { recursive: true })
    fs.rmSync(path.join(modelPath(model), '.model-ready'), { force: true })
    if (usesMlx(model)) {
      await ensureMlxRuntime(jobId, model, emit, 'install')
    } else {
      const python = await ensureManagedPython((stage, percent, message) => {
        checkCanceled(jobId)
        emit({ jobId, kind: 'install', stage, percent, message })
      })
      await run(jobId, python, ['-m', 'venv', path.join(root(engine), '.venv')], model, emit, 'install', 'runtime.venv')
      const pip = async (packages: string[]) => run(jobId, pythonPath(engine), ['-m', 'pip', 'install', ...packages], model, emit, 'install', 'runtime.dependencies')
      await pip(['--upgrade', 'pip', 'wheel', 'setuptools<81'])
      if (engine === 'qwen3') {
        await pip(['torch==2.8.0', 'torchaudio==2.8.0', 'qwen-tts==0.1.1'])
      } else {
        await pip(['torch==2.3.1', 'torchaudio==2.3.1', 'numpy==1.26.4', 'transformers==4.51.3',
          'conformer==0.3.2', 'diffusers==0.29.0', 'hydra-core==1.3.2', 'HyperPyYAML==1.2.3',
          'inflect==7.3.1', 'librosa==0.10.2', 'lightning==2.2.4', 'modelscope==1.20.0',
          'onnxruntime==1.18.0', 'rich==13.7.1', 'soundfile==0.12.1',
          'x-transformers==2.11.24', 'wetext==0.0.4', 'wget==3.2', 'pyarrow==18.1.0',
          'gdown==5.1.0', 'matplotlib==3.9.4', 'Cython==3.0.12'])
        // These older source distributions need pkg_resources from the pinned
        // setuptools in this venv; pip's isolated build would install a newer one.
        await pip(['--no-build-isolation', 'openai-whisper==20231117', 'pyworld==0.3.4'])
      }
    }
    const result = await worker(jobId, model, { command: 'prepare' }, emit, 'install')
    checkCanceled(jobId)
    fs.writeFileSync(path.join(modelPath(model), '.model-ready'), JSON.stringify({
      version: VERSION, repository: model.repository, accelerator: result.accelerator,
    }))
    emit({ jobId, kind: 'install', stage: 'done', percent: 100, message: `${model.id} đã sẵn sàng` })
    return { success: true }
  } finally { installingJobs.delete(jobId) }
}

export async function generateLocalModel(payload: TtsGeneratePayload, emit: Emit) {
  const { model, jobId } = payload
  assertAllowedModel(model)
  if (!getLocalModelStatus(model).runtimeReady) return { success: false, error: 'Model chưa được cài đặt' }
  if (generationInProgress || installingJobs.size) return { success: false, error: 'Model đang bận tạo giọng' }
  const outputRoot = path.join(app.getPath('userData'), 'tts', 'outputs')
  fs.mkdirSync(outputRoot, { recursive: true })
  // Do not use a renderer-provided job ID as a filesystem path.
  const outputPath = path.join(outputRoot, `${randomUUID()}.wav`)
  const chunks: string[] = []
  const streamEmit: Emit = (event) => {
    if (event.audioChunkPath) {
      // Only expose chunks belonging to this output, inside the audio directory.
      const chunk = path.resolve(event.audioChunkPath)
      if (path.dirname(chunk) !== outputRoot || !path.basename(chunk).startsWith(path.basename(outputPath, '.wav') + '-chunk-')) return
      chunks.push(chunk)
    }
    emit(event)
  }
  try {
    generationInProgress = true
    if (usesMlx(model)) await ensureMlxRuntime(jobId, model, emit, 'generate')
    const result = await generationWorker.request(model, { ...payload, command: 'generate', outputPath }, jobId, streamEmit)
    if (!fs.existsSync(outputPath)) throw new Error('Worker không tạo được file audio')
    if (['cuda', 'cpu', 'mps', 'mlx'].includes(String(result.accelerator))) {
      // Existing Cosy installations discover MPS during their first load.
      // Record the backend that actually produced audio, not a platform guess.
      try {
        fs.writeFileSync(path.join(modelPath(model), '.model-ready'), JSON.stringify({
          version: VERSION, repository: model.repository, accelerator: result.accelerator,
        }))
      } catch { /* Status persistence must not discard successfully generated audio. */ }
    }
    return { success: true, outputPath, sampleRate: Number(result.sampleRate), durationSec: Number(result.durationSec) }
  } catch (error) {
    fs.rmSync(outputPath, { force: true })
    return { success: false, canceled: canceledJobs.delete(jobId), error: error instanceof Error ? error.message : String(error) }
  } finally {
    generationInProgress = false
    const cleanup = setTimeout(() => { for (const chunk of chunks) fs.rmSync(chunk, { force: true }) }, 15 * 60_000)
    cleanup.unref()
  }
}

export async function removeLocalModel(model: TtsModelDescriptor) {
  assertAllowedModel(model)
  if (generationInProgress || installingJobs.size) throw new Error('Model đang bận. Hãy đợi hoặc hủy tác vụ trước.')
  generationWorker.releaseIdle()
  await fs.promises.rm(modelPath(model), { recursive: true, force: true })
  return { success: true }
}
