import { app, ipcMain } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ensureManagedPython } from '../../tts-voice/managed-python'
import { getImagesDir } from '../../../storage-paths'

const MODEL = 'Qwen/Qwen-Image-2.1'
const MODEL_REVISION = '790c92633540aa0cb11d9abf19eb46d861714758'
const DIFFUSERS_REVISION = '9f1246971270c84dcbe71233edb7a519596a5d02'
const CUDA_TORCH = '2.14.0+cu126'
const CUDA_TORCHVISION = '0.29.0+cu126'
const VERSION = '1'
const root = () => path.join(app.getPath('userData'), 'runtimes', 'qwen-image-2.1')
const modelDir = () => path.join(root(), 'model')
const python = () => path.join(root(), 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
const marker = () => path.join(root(), 'ready.json')
const worker = () => app.isPackaged
  ? path.join(process.resourcesPath, 'qwen-image-worker', 'worker.py')
  : path.join(app.getAppPath(), 'electron', 'features', 'video-studio', 'qwen-image', 'worker.py')

type Event = { kind: 'install' | 'generate'; stage: string; percent?: number; message?: string; taskId?: string }
const jobs = new Map<string, ChildProcessWithoutNullStreams>()
const pendingTasks = new Set<string>()
const cancelledTasks = new Set<string>()
let gpuQueue: Promise<void> = Promise.resolve()
let installing = false
let installChild: ChildProcessWithoutNullStreams | null = null

function status() {
  let installed = false
  try {
    const recorded = JSON.parse(fs.readFileSync(marker(), 'utf8')) as { model?: string; revision?: string; version?: string }
    installed = recorded.model === MODEL && recorded.revision === MODEL_REVISION && recorded.version === VERSION
      && fs.existsSync(python()) && fs.existsSync(path.join(modelDir(), 'model_index.json'))
  } catch { /* An interrupted install has no ready marker. */ }
  return { installed, installing, platform: process.platform, architecture: process.arch, path: modelDir() }
}

function run(command: string, args: string[], onLine?: (line: string) => void, stdin?: string, env?: Record<string, string>, taskId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, env: {
      ...process.env, PYTHONUTF8: '1', HF_HOME: path.join(root(), 'hf-cache'),
      PIP_CACHE_DIR: path.join(root(), 'pip-cache'), ...env,
    } })
    if (taskId) jobs.set(taskId, child)
    else if (installing) installChild = child
    let output = ''
    let captured = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      captured = (captured + chunk).slice(-8000)
      output += chunk
      let end: number
      while ((end = output.indexOf('\n')) >= 0) {
        onLine?.(output.slice(0, end).trim())
        output = output.slice(end + 1)
      }
    })
    child.stderr.on('data', (chunk: string) => { stderr = (stderr + chunk).slice(-8000) })
    child.on('error', reject)
    child.on('close', (code) => {
      if (taskId) jobs.delete(taskId)
      if (installChild === child) installChild = null
      if (code === 0) resolve(captured)
      else reject(new Error(stderr.trim() || captured.trim() || `Qwen process exited with ${code}`))
    })
    if (stdin) child.stdin.end(stdin)
    else child.stdin.end()
  })
}

function emit(sender: Electron.WebContents, event: Event) {
  if (!sender.isDestroyed()) sender.send('qwen-image:event', event)
}

function directoryBytes(directory: string): number {
  if (!fs.existsSync(directory)) return 0
  let total = 0
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    if (entry.isDirectory()) total += directoryBytes(item)
    else if (entry.isFile()) total += fs.statSync(item).size
  }
  return total
}

async function install(sender: Electron.WebContents) {
  if (installing) throw new Error('Qwen Image 2.1 đang được cài đặt')
  if (status().installed) return status()
  installing = true
  fs.mkdirSync(root(), { recursive: true })
  try {
    const available = fs.statfsSync(root())
    const freeGiB = available.bavail * available.bsize / (1024 ** 3)
    if (freeGiB < 50) throw new Error(`Cần khoảng 50 GiB trống để cài Qwen Image 2.1; hiện có ${freeGiB.toFixed(1)} GiB`)
    emit(sender, { kind: 'install', stage: 'python', percent: 2, message: 'Đang chuẩn bị Python 3.12' })
    const base = await ensureManagedPython((_stage, percent, message) => emit(sender, { kind: 'install', stage: 'python', percent: Math.min(15, percent), message }))
    if (!fs.existsSync(python())) await run(base, ['-m', 'venv', path.join(root(), 'venv')])
    emit(sender, { kind: 'install', stage: 'packages', percent: 18, message: 'Đang cài PyTorch và thư viện tạo ảnh' })
    await run(python(), ['-m', 'pip', 'install', '--upgrade', 'pip'])
    if (process.platform === 'win32' || process.platform === 'linux') {
      // PyPI's Windows wheel is CPU-only. Use the matching official CUDA wheel
      // and replace an earlier CPU install when resuming an interrupted setup.
      await run(python(), ['-m', 'pip', 'install', '--index-url', 'https://download.pytorch.org/whl/cu126', `torch==${CUDA_TORCH}`, `torchvision==${CUDA_TORCHVISION}`])
    } else {
      await run(python(), ['-m', 'pip', 'install', 'torch>=2.4', 'torchvision'])
    }
    await run(python(), ['-m', 'pip', 'install', 'accelerate', 'pillow', 'huggingface_hub', 'transformers>=5.17', `https://github.com/huggingface/diffusers/archive/${DIFFUSERS_REVISION}.zip`])
    const gpu = await run(python(), ['-c', "import torch; print(('cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')) + '|' + torch.__version__ + '|' + str(torch.version.cuda))"])
    const [device, torchVersion, cudaVersion] = gpu.trim().split('|')
    if (device === 'cpu') throw new Error(`PyTorch ${torchVersion} (CUDA ${cudaVersion}) không sử dụng được GPU. Kiểm tra driver NVIDIA hoặc hỗ trợ MPS; đã dừng trước khi tải model 31 GiB.`)
    emit(sender, { kind: 'install', stage: 'model', percent: 45, message: 'Đang tải model Qwen Image 2.1; có thể mất nhiều thời gian' })
    const script = 'from huggingface_hub import snapshot_download; import sys; snapshot_download(repo_id=sys.argv[1], revision=sys.argv[2], local_dir=sys.argv[3])'
    const progress = setInterval(() => {
      try {
        const gib = directoryBytes(modelDir()) / (1024 ** 3)
        emit(sender, { kind: 'install', stage: 'model', percent: Math.min(95, Math.round(45 + gib / 31 * 50)), message: `Đã tải khoảng ${gib.toFixed(1)} / 31 GiB` })
      } catch { /* A file may be renamed while the download runs. */ }
    }, 5000)
    try {
      await run(python(), ['-c', script, MODEL, MODEL_REVISION, modelDir()])
    } finally { clearInterval(progress) }
    if (!fs.existsSync(path.join(modelDir(), 'model_index.json'))) throw new Error('Tải model chưa hoàn tất')
    fs.writeFileSync(marker(), JSON.stringify({ model: MODEL, revision: MODEL_REVISION, diffusers: DIFFUSERS_REVISION, version: VERSION, installedAt: new Date().toISOString() }))
    emit(sender, { kind: 'install', stage: 'ready', percent: 100, message: 'Qwen Image 2.1 đã sẵn sàng' })
    installing = false
    return status()
  } finally {
    installing = false
  }
}

type Generate = { taskId: string; prompt: string; aspectRatio: string; references?: string[] }
async function generate(sender: Electron.WebContents, input: Generate) {
  if (!status().installed) throw new Error('Hãy tải Qwen Image 2.1 trong Cài đặt trước')
  if (!input.taskId || !input.prompt?.trim()) throw new Error('Thiếu mã tác vụ hoặc prompt')
  if (jobs.has(input.taskId) || pendingTasks.has(input.taskId)) throw new Error('Tác vụ đã chạy')
  if ((input.references?.length || 0) > 10) throw new Error('Qwen Image 2.1 hỗ trợ tối đa 10 ảnh tham chiếu')
  pendingTasks.add(input.taskId)
  const previous = gpuQueue
  let release!: () => void
  gpuQueue = new Promise<void>((resolve) => { release = resolve })
  emit(sender, { kind: 'generate', taskId: input.taskId, stage: 'queued' })
  await previous
  try {
    if (cancelledTasks.has(input.taskId)) throw new Error('Tác vụ đã hủy')
    const file = `qwen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.png`
    const output = path.join(getImagesDir('shots'), file)
    const payload = JSON.stringify({ model_dir: modelDir(), output, prompt: input.prompt, aspect_ratio: input.aspectRatio, references: input.references || [] })
    let reportedError = ''
    await run(python(), [worker()], (line) => {
      try {
        const message = JSON.parse(line) as { stage: string; device?: string; error?: string }
        if (message.error) reportedError = message.error
        emit(sender, { kind: 'generate', taskId: input.taskId, stage: message.stage, message: message.error || message.device })
      } catch { /* Ignore library logging. */ }
    }, payload, { HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' }, input.taskId).catch((error) => {
      throw new Error(reportedError || (error instanceof Error ? error.message : String(error)))
    })
    if (!fs.existsSync(output) || fs.statSync(output).size === 0) throw new Error('Qwen không tạo được file ảnh')
    return { taskId: input.taskId, localUrl: `local-image://shots/${file}`, provider: 'qwen-local' as const }
  } finally {
    pendingTasks.delete(input.taskId)
    cancelledTasks.delete(input.taskId)
    release()
  }
}

export function cancelAllQwenJobs() {
  installChild?.kill()
  for (const taskId of pendingTasks) cancelledTasks.add(taskId)
  for (const child of jobs.values()) child.kill()
  jobs.clear()
}

export function registerQwenImageIpc() {
  ipcMain.handle('qwen-image:status', () => status())
  ipcMain.handle('qwen-image:install', (event) => install(event.sender))
  ipcMain.handle('qwen-image:remove', () => {
    if (installing || pendingTasks.size) throw new Error('Hãy đợi tác vụ Qwen hiện tại hoàn tất')
    fs.rmSync(root(), { recursive: true, force: true })
    return status()
  })
  ipcMain.handle('qwen-image:generate', (event, input: Generate) => generate(event.sender, input))
  ipcMain.handle('qwen-image:cancel', (_event, taskId: string) => {
    if (!pendingTasks.has(taskId)) return false
    cancelledTasks.add(taskId)
    jobs.get(taskId)?.kill()
    return true
  })
}
