import { app, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import { spawn } from 'node:child_process'

const PYTHON_VERSION = '3.12.10'
const PYTHON_WIN_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-amd64.exe`
const PYTHON_DEPS = ['numpy', 'scipy', 'Pillow', 'opencv-python']
const DEPS_MARKER = 'deps-ok'

function runtimeRoot() {
  return path.join(app.getPath('userData'), 'runtimes', 'watermark')
}

function bundledPython() {
  return process.platform === 'win32' ? path.join(runtimeRoot(), 'python', 'python.exe') : ''
}

function depsOkMarker() {
  return path.join(runtimeRoot(), DEPS_MARKER)
}

function scriptDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'watermark')
    : path.join(process.env.APP_ROOT || process.cwd(), 'electron', 'features', 'video-studio', 'python')
}

export function watermarkScriptPath() {
  return path.join(scriptDir(), 'wm_remove.py')
}

function utf8Environment() {
  return {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  }
}

function spawnCapture(command: string, args: string[], timeoutMs?: number): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    let output = ''
    let settled = false
    const finish = (result: { ok: boolean; output: string }) => {
      if (!settled) resolve(result)
      settled = true
    }
    try {
      const child = spawn(command, args, { windowsHide: true, env: utf8Environment() })
      const timer = timeoutMs
        ? setTimeout(() => {
            try {
              child.kill()
            } catch {
              // ignore
            }
            finish({ ok: false, output: `${output}\n[timeout]` })
          }, timeoutMs)
        : null
      child.stdout.on('data', (chunk) => {
        output += String(chunk)
      })
      child.stderr.on('data', (chunk) => {
        output += String(chunk)
      })
      child.on('error', (error) => {
        if (timer) clearTimeout(timer)
        finish({ ok: false, output: output || `Failed to start ${command}: ${error.message}` })
      })
      child.on('close', (code) => {
        if (timer) clearTimeout(timer)
        finish({ ok: code === 0, output })
      })
    } catch (error) {
      finish({ ok: false, output: String(error) })
    }
  })
}

async function hasDeps(python: string): Promise<boolean> {
  const result = await spawnCapture(python, ['-c', 'import cv2, numpy, scipy, PIL'], 30_000)
  return result.ok
}

/**
 * Find a Python interpreter that already has the required deps installed.
 * Tries our bundled runtime first, then the legacy Qwen runtime, then any
 * system Python.
 */
async function findUsablePython(): Promise<string | null> {
  const candidates: string[] = []
  if (bundledPython() && fs.existsSync(bundledPython())) candidates.push(bundledPython())
  const legacy = path.join(app.getPath('userData'), 'runtimes', 'qwen-tts', 'python', 'python.exe')
  if (fs.existsSync(legacy)) candidates.push(legacy)
  for (const candidate of candidates) {
    if (await hasDeps(candidate)) return candidate
  }

  const systemCandidates =
    process.platform === 'win32'
      ? [{ command: 'py', args: ['-3'] }, { command: 'python', args: [] }]
      : [{ command: 'python3', args: [] }, { command: 'python', args: [] }]
  for (const candidate of systemCandidates) {
    // Probe the interpreter once to find its absolute path, then check deps.
    const probe = await spawnCapture(candidate.command, [...candidate.args, '-c', 'import sys; print(sys.executable)'], 30_000)
    if (!probe.ok) continue
    const exe = probe.output.trim().split(/\r?\n/).at(-1)
    if (!exe) continue
    if (await hasDeps(exe)) return exe
  }
  return null
}

function downloadFile(url: string, dest: string, onProgress?: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    let current = url
    let redirects = 0
    const fetchOnce = (target: string) => {
      https
        .get(target, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            if (redirects >= 3) {
              reject(new Error('Quá nhiều chuyển hướng khi tải Python'))
              return
            }
            const next = new URL(response.headers.location, target)
            if (next.protocol !== 'https:' || !next.hostname.endsWith('.python.org')) {
              reject(new Error('Nguồn tải Python chuyển hướng tới địa chỉ không được phép'))
              return
            }
            redirects += 1
            fetchOnce(next.href)
            return
          }
          if (!response.statusCode || response.statusCode !== 200) {
            reject(new Error(`Không thể tải Python (HTTP ${response.statusCode})`))
            return
          }
          const total = Number(response.headers['content-length'] || 0)
          let received = 0
          const file = fs.createWriteStream(dest)
          response.on('data', (chunk) => {
            received += chunk.length
            if (total > 0) onProgress?.(Math.min(0.99, received / total))
          })
          response.pipe(file)
          file.on('finish', () => {
            file.close(() => {
              onProgress?.(1)
              resolve()
            })
          })
          file.on('error', reject)
        })
        .on('error', reject)
    }
    fetchOnce(current)
  })
}

/**
 * Install our own Python runtime (downloaded from python.org) plus the
 * required deps, then verify everything works. Safe to call concurrently —
 * only the first caller performs the install.
 */
let runtimePromise: Promise<string | null> | null = null

export function ensureWatermarkRuntime(
  onProgress?: (stage: string, ratio: number, message: string) => void,
): Promise<string | null> {
  if (!runtimePromise) {
    runtimePromise = (async (): Promise<string | null> => {
      try {
        // Fast path: a Python with deps already exists.
        const existing = await findUsablePython()
        if (existing) return existing

        if (process.platform !== 'win32') {
          return null
        }

        onProgress?.('download', 0, `Đang tải Python ${PYTHON_VERSION}...`)
        const root = runtimeRoot()
        fs.mkdirSync(root, { recursive: true })
        const installer = path.join(root, `python-${PYTHON_VERSION}-amd64.exe`)
        if (!fs.existsSync(installer)) {
          await downloadFile(PYTHON_WIN_URL, installer, (ratio) => {
            onProgress?.('download', ratio, `Đang tải Python ${PYTHON_VERSION} (${Math.round(ratio * 100)}%)...`)
          })
        }
        onProgress?.('install', 0.25, 'Đang cài Python...')
        const installArgs = [
          '/quiet',
          'InstallAllUsers=0',
          'PrependPath=0',
          'Include_launcher=0',
          'Include_pip=1',
          `TargetDir=${root}\\python`,
        ]
        const install = await spawnCapture(installer, installArgs, 5 * 60_000)
        if (!install.ok) throw new Error(`Cài Python thất bại: ${install.output.slice(-800)}`)

        const python = bundledPython()
        if (!python || !fs.existsSync(python)) throw new Error('Không tìm thấy Python sau khi cài')

        onProgress?.('pip', 0, `Đang cài thư viện (${PYTHON_DEPS.join(', ')})...`)
        const pip = await spawnCapture(
          python,
          ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-warn-script-location', ...PYTHON_DEPS],
          15 * 60_000,
        )
        if (!pip.ok) throw new Error(`Cài thư viện thất bại: ${pip.output.slice(-800)}`)

        const verify = await hasDeps(python)
        if (!verify) throw new Error('Kiểm tra thư viện thất bại')
        fs.writeFileSync(depsOkMarker(), PYTHON_VERSION, 'utf8')

        try {
          fs.rmSync(installer, { force: true })
        } catch {
          // Ignore cleanup failures.
        }
        onProgress?.('ready', 1, 'Runtime Python sẵn sàng')
        return python
      } catch (error) {
        console.error('[WatermarkRuntime] Bootstrap failed:', error)
        return null
      }
    })()
  }
  return runtimePromise
}

/**
 * Run the Python watermark remover on an image file using the best available
 * interpreter. `box` is an optional "x,y,w,h" string pinning the exact
 * watermark location (fixed placement); when omitted the script auto-detects.
 * Returns { ok, output }.
 */
export async function runWatermarkRemoval(
  inputPath: string,
  outputPath: string,
  box?: string,
  onProgress?: (stage: string, ratio: number, message: string) => void,
): Promise<{ ok: boolean; output: string }> {
  const script = watermarkScriptPath()
  if (!fs.existsSync(script)) {
    return { ok: false, output: `Watermark script not found: ${script}` }
  }

  const python = await ensureWatermarkRuntime(onProgress)
  if (!python) {
    return { ok: false, output: 'Không thể khởi tạo runtime Python (xem log phía trên)' }
  }

  const scriptArgs = [script, inputPath, '-o', outputPath]
  if (box) scriptArgs.push('--box', box)
  const result = await spawnCapture(python, scriptArgs, 120_000)
  if (!result.ok && !fs.existsSync(outputPath)) {
    return { ok: false, output: result.output }
  }
  return result
}

export function registerWatermarkIpc(getMediaRoot: () => string) {
  ipcMain.handle('watermark-remove', async (event, localPath: string, box?: string) => {
    const emit = (stage: string, ratio: number, message: string) => {
      try {
        event.sender.send('watermark-runtime-progress', { stage, ratio, message })
      } catch {
        // Window may be gone.
      }
    }
    try {
      const match = localPath.match(/^local-image:\/\/(.+)\/(.+)$/)
      if (!match) return { success: false, error: 'Invalid local path' }
      const [, category, filename] = match
      if (category !== 'shots' && category !== 'scenes' && category !== 'characters') {
        return { success: false, error: `Unsupported media category: ${category}` }
      }
      const filePath = path.join(getMediaRoot(), category, decodeURIComponent(filename))
      if (!fs.existsSync(filePath)) return { success: false, error: 'Source image not found' }

      const validBox = box && /^\d+,\d+,\d+,\d+$/.test(box) ? box : undefined

      const dir = path.join(getMediaRoot(), 'shots')
      fs.mkdirSync(dir, { recursive: true })
      const outName = `cleaned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`
      const outPath = path.join(dir, outName)

      const result = await runWatermarkRemoval(filePath, outPath, validBox, emit)
      if (!result.ok || !fs.existsSync(outPath)) {
        if (result.output) console.warn('[WatermarkRemoval]', result.output)
        return { success: false, output: result.output, error: 'Watermark removal failed' }
      }
      return { success: true, localPath: `local-image://shots/${outName}`, output: result.output }
    } catch (error) {
      console.error('Failed to remove watermark:', error)
      return { success: false, error: String(error) }
    }
  })
}
