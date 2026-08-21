import { spawn } from 'node:child_process'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { RUNTIME_VERSION, TORCH_CUDA_INDEX, TORCH_VERSION, downloadControllers, jobs } from './constants'
import type { Emit, RuntimeProbe } from './constants'
import { ensureManagedPython } from '../managed-python'
import { getFFmpegPath } from '../../../ffmpeg-runtime'
import {
  bundledPython,
  isRuntimeCurrent,
  legacyQwenPython,
  runtimeMarker,
  runtimeRoot,
  sourceRoot,
  sourceVersion,
  venvPython,
} from './paths'

/**
 * Getting a working Python runtime on the user's machine: find or download an
 * interpreter, create the venv, install torch (CUDA when a GPU is present) and
 * the worker's dependencies, then stamp a marker so we can skip all of it next
 * time.
 */

export function utf8Environment() {
  const delimiter = process.platform === 'win32' ? ';' : ':'
  const ffmpegPath = getFFmpegPath()
  return {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTORCH_ENABLE_MPS_FALLBACK: '1',
    PYTHONPATH: [sourceRoot(), process.env.PYTHONPATH].filter(Boolean).join(delimiter),
    FFMPEG_BINARY: ffmpegPath,
    IMAGEIO_FFMPEG_EXE: ffmpegPath,
    PATH: [path.dirname(ffmpegPath), process.env.PATH].filter(Boolean).join(delimiter),
  }
}

export function spawnCapture(command: string, args: string[]) {
  return new Promise<{ ok: boolean; output: string }>((resolve) => {
    let output = ''
    let settled = false
    try {
      const child = spawn(command, args, { windowsHide: true, env: utf8Environment() })
      child.stdout.on('data', (chunk) => { output += String(chunk) })
      child.stderr.on('data', (chunk) => { output += String(chunk) })
      child.on('error', () => {
        if (!settled) resolve({ ok: false, output })
        settled = true
      })
      child.on('close', (code) => {
        if (!settled) resolve({ ok: code === 0, output })
        settled = true
      })
    } catch {
      resolve({ ok: false, output })
    }
  })
}

export async function findSystemPython(): Promise<{ command: string; prefix: string[] } | null> {
  const candidates = [
    ...(bundledPython() && fs.existsSync(bundledPython()) ? [{ command: bundledPython(), prefix: [] }] : []),
    ...(legacyQwenPython() && fs.existsSync(legacyQwenPython()) ? [{ command: legacyQwenPython(), prefix: [] }] : []),
    ...(process.platform === 'win32'
      ? [{ command: 'py', prefix: ['-3.12'] }, { command: 'py', prefix: ['-3'] }, { command: 'python', prefix: [] }]
      : [{ command: 'python3.12', prefix: [] }, { command: 'python3', prefix: [] }, { command: 'python', prefix: [] }]),
  ]
  for (const candidate of candidates) {
    const result = await spawnCapture(candidate.command, [...candidate.prefix, '-c', "import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))"])
    if (result.ok && result.output.trim().split(/\r?\n/).at(-1) === '1') return candidate
  }
  return null
}

export async function isCompatiblePython(command: string) {
  if (!command || !fs.existsSync(command)) return false
  const result = await spawnCapture(command, ['-c', "import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))"])
  return result.ok && result.output.trim().split(/\r?\n/).at(-1) === '1'
}

export async function migrateLegacyPython(jobId: string, emit: Emit) {
  const legacyExe = legacyQwenPython()
  if (!legacyExe || !fs.existsSync(legacyExe) || fs.existsSync(bundledPython())) return

  const legacyRoot = path.dirname(legacyExe)
  const targetRoot = path.dirname(bundledPython())
  emit({
    jobId,
    kind: 'install',
    stage: 'runtime.python.migrate',
    percent: 7,
    message: 'Đang tái sử dụng Python nền từ runtime cũ...',
  })
  fs.mkdirSync(targetRoot, { recursive: true })
  await fs.promises.cp(legacyRoot, targetRoot, {
    recursive: true,
    force: false,
    filter: (source) => {
      const relative = path.relative(legacyRoot, source)
      return relative !== 'Scripts'
        && !relative.startsWith(`Scripts${path.sep}`)
        && relative !== path.join('Lib', 'site-packages')
        && !relative.startsWith(`${path.join('Lib', 'site-packages')}${path.sep}`)
    },
  })
  if (!fs.existsSync(bundledPython())) {
    throw new Error('Không thể sao chép Python nền từ runtime cũ')
  }
}

export async function hasNvidiaGpu() {
  if (process.platform === 'darwin') return false
  const result = await spawnCapture('nvidia-smi', ['-L'])
  return result.ok && /GPU\s+\d+/i.test(result.output)
}

export async function probeRuntime(): Promise<RuntimeProbe | null> {
  if (!fs.existsSync(venvPython())) return null
  const script = [
    'import json, torch',
    "backend = 'cuda' if torch.cuda.is_available() else ('xpu' if hasattr(torch, 'xpu') and torch.xpu.is_available() else ('mps' if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available() else 'cpu'))",
    "print(json.dumps({'backend': backend, 'torchVersion': torch.__version__, 'cudaBuild': torch.version.cuda}))",
  ].join('; ')
  const result = await spawnCapture(venvPython(), ['-X', 'utf8', '-c', script])
  if (!result.ok) return null
  try {
    return JSON.parse(result.output.trim().split(/\r?\n/).at(-1) || '') as RuntimeProbe
  } catch {
    return null
  }
}

export function downloadFile(jobId: string, url: string, destination: string, emit: Emit, redirects = 0): Promise<void> {
  if (redirects > 5) return Promise.reject(new Error('Quá nhiều chuyển hướng khi tải Python'))
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    downloadControllers.set(jobId, controller)
    const request = https.get(url, { signal: controller.signal }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        downloadControllers.delete(jobId)
        const nextUrl = new URL(response.headers.location, url)
        if (nextUrl.protocol !== 'https:' || (nextUrl.hostname !== 'python.org' && !nextUrl.hostname.endsWith('.python.org'))) {
          reject(new Error('Nguồn tải Python chuyển hướng tới địa chỉ không được phép'))
          return
        }
        downloadFile(jobId, nextUrl.toString(), destination, emit, redirects + 1).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`Không thể tải Python (HTTP ${response.statusCode})`))
        return
      }
      const total = Number(response.headers['content-length'] || 0)
      let received = 0
      const stream = fs.createWriteStream(destination)
      response.on('data', (chunk: Buffer) => {
        received += chunk.length
        const ratio = total > 0 ? received / total : 0
        emit({
          jobId,
          kind: 'install',
          stage: 'runtime.python.download',
          percent: Math.round(2 + ratio * 6),
          message: total > 0 ? `Đang tải Python ${Math.round(ratio * 100)}%` : 'Đang tải Python...',
        })
      })
      response.pipe(stream)
      stream.on('finish', () => {
        stream.close()
        downloadControllers.delete(jobId)
        resolve()
      })
      stream.on('error', reject)
    })
    request.on('error', (error) => {
      downloadControllers.delete(jobId)
      if (fs.existsSync(destination)) fs.rmSync(destination, { force: true })
      reject(error)
    })
  })
}

export function runStep(jobId: string, command: string, args: string[], emit: Emit, stage: string, percent: number) {
  return new Promise<void>((resolve, reject) => {
    emit({ jobId, kind: 'install', stage, percent, message: stage })
    const child = spawn(command, args, {
      windowsHide: true,
      cwd: runtimeRoot(),
      env: utf8Environment(),
    })
    jobs.set(jobId, child)
    let stderr = ''
    let stdoutBuffer = ''
    const emitOutputLine = (rawLine: string) => {
      const line = rawLine.trim()
      if (!line) return
      try {
        const event = JSON.parse(line) as { type?: string; percent?: number; message?: string }
        if (event.type === 'progress') {
          emit({
            jobId,
            kind: 'install',
            stage,
            percent: typeof event.percent === 'number' ? event.percent : percent,
            message: event.message || line,
          })
          return
        }
      } catch {
        // Regular pip/Hugging Face output.
      }
      emit({ jobId, kind: 'install', stage, percent, message: line.slice(-500) })
    }
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += String(chunk)
      const lines = stdoutBuffer.split(/\r?\n/)
      stdoutBuffer = lines.pop() || ''
      lines.forEach(emitOutputLine)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
      const line = String(chunk).trim().split(/\r?\n/).at(-1)
      if (line) {
        const progressMatch = stage === 'model.download' ? line.match(/(\d{1,3})%\|/) : null
        const livePercent = progressMatch
          ? Math.min(95, 50 + Math.round(Number(progressMatch[1]) * 0.45))
          : percent
        emit({ jobId, kind: 'install', stage, percent: livePercent, message: line.slice(-500) })
      }
    })
    child.on('error', reject)
    child.on('close', (code) => {
      emitOutputLine(stdoutBuffer)
      jobs.delete(jobId)
      if (code === 0) resolve()
      else reject(new Error(code === null ? 'Đã hủy' : stderr.slice(-2500) || `${stage} thất bại (${code})`))
    })
  })
}

export async function bootstrapPython(jobId: string, emit: Emit) {
  return ensureManagedPython((stage, percent, message) => emit({ jobId, kind: 'install', stage, percent, message }))
}

export async function ensureRuntime(jobId: string, emit: Emit) {
  fs.mkdirSync(runtimeRoot(), { recursive: true })
  if (fs.existsSync(venvPython()) && !(await isCompatiblePython(venvPython()))) {
    emit({ jobId, kind: 'install', stage: 'runtime.venv', percent: 2, message: 'Đang thay runtime Python cũ bằng Python 3.12...' })
    fs.rmSync(path.join(runtimeRoot(), '.venv'), { recursive: true, force: true })
  }
  if (!fs.existsSync(venvPython())) {
    await migrateLegacyPython(jobId, emit)
    let python = await findSystemPython()
    if (!python) {
      python = { command: await bootstrapPython(jobId, emit), prefix: [] }
    }
    await runStep(jobId, python.command, [...python.prefix, '-m', 'venv', path.join(runtimeRoot(), '.venv')], emit, 'runtime.venv', 10)
  }

  if (!isRuntimeCurrent()) {
    await runStep(jobId, venvPython(), ['-m', 'pip', 'install', '--disable-pip-version-check', '--upgrade', 'pip'], emit, 'runtime.pip', 14)
    const torchArgs = ['-m', 'pip', 'install', '--disable-pip-version-check', `torch==${TORCH_VERSION}`, `torchaudio==${TORCH_VERSION}`]
    if (await hasNvidiaGpu()) torchArgs.push('--index-url', TORCH_CUDA_INDEX)
    await runStep(jobId, venvPython(), torchArgs, emit, 'runtime.accelerator', 22)
    await runStep(jobId, venvPython(), [
      '-m', 'pip', 'install', '--disable-pip-version-check',
      'transformers==5.3.0', 'accelerate', 'huggingface-hub>=0.34,<2',
      'pydub', 'numpy', 'soundfile>=0.12', 'librosa', 'num2words',
    ], emit, 'runtime.dependencies', 35)
  }

  const nvidiaAvailable = await hasNvidiaGpu()
  let probe = await probeRuntime()
  if (nvidiaAvailable && probe?.backend !== 'cuda') {
    await runStep(jobId, venvPython(), [
      '-m', 'pip', 'install', '--disable-pip-version-check', '--force-reinstall',
      `torch==${TORCH_VERSION}`, `torchaudio==${TORCH_VERSION}`, '--index-url', TORCH_CUDA_INDEX,
    ], emit, 'runtime.accelerator', 38)
    probe = await probeRuntime()
  }
  if (!probe) throw new Error('Không thể kiểm tra OmniVoice runtime')
  if (nvidiaAvailable && probe.backend !== 'cuda') {
    throw new Error('Không thể bật CUDA cho OmniVoice runtime')
  }
  fs.writeFileSync(runtimeMarker(), JSON.stringify({
    version: RUNTIME_VERSION,
    sourceVersion: sourceVersion(),
    torch: probe.torchVersion,
    backend: probe.backend,
  }, null, 2), 'utf8')
}

