import { app } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { probeMediaDuration } from '../../ffmpeg-runtime'
import { ensureManagedPython } from './managed-python'

interface EmitEvent { jobId: string; kind: 'install' | 'generate'; stage: string; percent?: number; message: string }
type Emit = (event: EmitEvent) => void

export interface VieneuGenerateInput {
  jobId: string
  text: string
  mode: 'clone' | 'preset'
  voice?: string
  style?: string
  referenceAudioPath?: string
}

const jobs = new Map<string, ChildProcessWithoutNullStreams>()
const RUNTIME_VERSION = 1

function runtimeRoot() { return path.join(app.getPath('userData'), 'runtimes', 'vieneu') }
function modelRoot() { return path.join(app.getPath('userData'), 'models', 'vieneu', 'vieneu-v3-turbo') }
function markerPath() { return path.join(modelRoot(), '.model-ready') }
function venvPython() {
  return process.platform === 'win32'
    ? path.join(runtimeRoot(), '.venv', 'Scripts', 'python.exe')
    : path.join(runtimeRoot(), '.venv', 'bin', 'python')
}
function workerPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tts-worker', 'vieneu_worker.py')
    : path.join(process.env.APP_ROOT || process.cwd(), 'electron', 'features', 'tts-voice', 'python', 'vieneu_worker.py')
}
function outputRoot() { return path.join(app.getPath('userData'), 'tts', 'outputs') }
function env() {
  return { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', HF_HOME: path.join(modelRoot(), 'huggingface') }
}

function spawnCapture(command: string, args: string[]) {
  return new Promise<{ ok: boolean; output: string }>((resolve) => {
    let output = ''
    const child = spawn(command, args, { windowsHide: true, env: env() })
    child.stdout.on('data', (chunk) => { output += String(chunk) })
    child.stderr.on('data', (chunk) => { output += String(chunk) })
    child.on('error', () => resolve({ ok: false, output }))
    child.on('close', (code) => resolve({ ok: code === 0, output }))
  })
}

async function findPython() {
  const candidates = process.platform === 'win32'
    ? [{ command: 'py', args: ['-3.12'] }, { command: 'py', args: ['-3'] }, { command: 'python', args: [] }]
    : [{ command: 'python3', args: [] }, { command: 'python', args: [] }]
  for (const candidate of candidates) {
    const result = await spawnCapture(candidate.command, [...candidate.args, '-c', 'import sys; print(int(sys.version_info >= (3, 10)))'])
    if (result.ok && result.output.trim().split(/\r?\n/).at(-1) === '1') return candidate
  }
  return null
}

async function isCompatiblePython(command: string) {
  if (!fs.existsSync(command)) return false
  const result = await spawnCapture(command, ['-c', 'import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))'])
  return result.ok && result.output.trim().split(/\r?\n/).at(-1) === '1'
}

function run(jobId: string, kind: 'install' | 'generate', request: Record<string, unknown>, emit: Emit) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(venvPython(), ['-X', 'utf8', workerPath()], { windowsHide: true, env: env() })
    jobs.set(jobId, child)
    let stderr = ''
    let buffer = ''
    let result: Record<string, unknown> | undefined
    child.stdout.on('data', (chunk) => {
      buffer += String(chunk)
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) {
        try {
          const message = JSON.parse(line) as Record<string, unknown>
          if (message.type === 'progress') emit({ jobId, kind, stage: String(message.stage || 'default'), percent: Number(message.percent), message: String(message.message || '') })
          if (message.type === 'result') result = message
        } catch { stderr += `${line}\n` }
      }
    })
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.on('error', reject)
    child.on('close', (code) => {
      jobs.delete(jobId)
      if (result) resolve(result)
      else reject(new Error(stderr.trim() || `VieNeu worker kết thúc với mã ${code}`))
    })
    child.stdin.end(`${JSON.stringify(request)}\n`)
  })
}

export async function getVieneuStatus() {
  const pythonAvailable = true
  const ready = fs.existsSync(markerPath()) && fs.existsSync(venvPython())
  return {
    modelId: 'vieneu-v3-turbo', status: ready ? 'ready' : 'not-installed',
    installedPath: ready ? modelRoot() : undefined, runtimeReady: ready, pythonAvailable, accelerator: 'cpu' as const,
    messageKey: ready ? undefined : 'tts.runtime.pythonAutoInstall',
  }
}

export async function installVieneu(jobId: string, emit: Emit) {
  let python = await findPython()
  if (!python) {
    const command = await ensureManagedPython((stage, percent, message) => emit({ jobId, kind: 'install', stage, percent, message }))
    python = { command, args: [] }
  }
  fs.mkdirSync(runtimeRoot(), { recursive: true })
  fs.mkdirSync(modelRoot(), { recursive: true })
  if (fs.existsSync(venvPython()) && !(await isCompatiblePython(venvPython()))) {
    emit({ jobId, kind: 'install', stage: 'runtime.venv', percent: 2, message: 'Đang thay runtime Python cũ bằng Python 3.12...' })
    fs.rmSync(path.join(runtimeRoot(), '.venv'), { recursive: true, force: true })
  }
  emit({ jobId, kind: 'install', stage: 'runtime.venv', percent: 5, message: 'Đang tạo môi trường VieNeu riêng...' })
  let step = await spawnCapture(python.command, [...python.args, '-m', 'venv', path.join(runtimeRoot(), '.venv')])
  if (!step.ok) throw new Error(step.output || 'Không thể tạo VieNeu runtime')
  emit({ jobId, kind: 'install', stage: 'runtime.pip', percent: 15, message: 'Đang cập nhật pip...' })
  step = await spawnCapture(venvPython(), ['-m', 'pip', 'install', '--upgrade', 'pip'])
  if (!step.ok) throw new Error(step.output || 'Không thể cập nhật pip')
  emit({ jobId, kind: 'install', stage: 'runtime.dependencies', percent: 25, message: 'Đang cài VieNeu CPU/ONNX...' })
  step = await spawnCapture(venvPython(), ['-m', 'pip', 'install', 'vieneu==3.2.4'])
  if (!step.ok) throw new Error(step.output || 'Không thể cài package vieneu')
  emit({ jobId, kind: 'install', stage: 'model.download', percent: 65, message: 'Đang tải VieNeu v3 Turbo...' })
  const prepared = await run(jobId, 'install', { command: 'prepare' }, emit)
  if (!prepared.success) throw new Error(String(prepared.error || 'Không thể chuẩn bị VieNeu'))
  fs.writeFileSync(markerPath(), JSON.stringify({ version: RUNTIME_VERSION, installedAt: Date.now() }), 'utf8')
  emit({ jobId, kind: 'install', stage: 'done', percent: 100, message: 'VieNeu đã sẵn sàng' })
  return { success: true }
}

export async function removeVieneu() {
  await fs.promises.rm(modelRoot(), { recursive: true, force: true })
  await fs.promises.rm(runtimeRoot(), { recursive: true, force: true })
  return { success: true }
}

export async function listVieneuVoices() {
  if (!fs.existsSync(markerPath())) return []
  const result = await run(`voices-${Date.now()}`, 'generate', { command: 'voices' }, () => {})
  return Array.isArray(result.voices) ? result.voices : []
}

export async function generateVieneu(input: VieneuGenerateInput, emit: Emit) {
  if (!fs.existsSync(markerPath())) return { success: false, error: 'Model VieNeu chưa được cài đặt' }
  const outputPath = path.join(outputRoot(), `${input.jobId}.wav`)
  fs.mkdirSync(outputRoot(), { recursive: true })
  const result = await run(input.jobId, 'generate', { command: 'generate', outputPath, ...input }, emit)
  if (!result.success) return { success: false, error: String(result.error || 'VieNeu không thể tạo audio') }
  return { success: true, outputPath, sampleRate: 48000, durationSec: await probeMediaDuration(outputPath) }
}

export function cancelVieneu(jobId: string) {
  const child = jobs.get(jobId)
  if (!child) return false
  child.kill()
  jobs.delete(jobId)
  return true
}
