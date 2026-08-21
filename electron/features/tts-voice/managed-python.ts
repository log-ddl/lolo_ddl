import { app } from 'electron'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'

type Progress = (stage: string, percent: number, message: string) => void

const UV_VERSION = '0.12.3'
const UV_ASSETS: Record<string, { file: string; sha256: string }> = {
  'darwin-arm64': { file: 'uv-aarch64-apple-darwin.tar.gz', sha256: '546f7f8a6c70ff13a3a9d2bc958db3427298cebf3e0cb756f9177133b7068843' },
  'darwin-x64': { file: 'uv-x86_64-apple-darwin.tar.gz', sha256: '4c9f52262a14da336e4a42ed24992d12d0c956acde87619e4611d321dffa602b' },
  'win32-x64': { file: 'uv-x86_64-pc-windows-msvc.zip', sha256: 'b23350c79e8ad0192b8124af13a0f17e8d4e4549524785e1aef389ae5a06990e' },
  'win32-arm64': { file: 'uv-aarch64-pc-windows-msvc.zip', sha256: '4343217d668727b8a8eb5cad92389a1d2eeead93c89940d1b955ba1bb15462eb' },
  'linux-x64': { file: 'uv-x86_64-unknown-linux-gnu.tar.gz', sha256: '600cf9a742aca00d292673b16b5acffaa7b8c269a364ad0c2e79498dcb1fe101' },
  'linux-arm64': { file: 'uv-aarch64-unknown-linux-gnu.tar.gz', sha256: 'bb66cb52e7b1823aed1183630d8d8e5c958840d584a4c55ec10a4cfc168dcca2' },
}

function managedRoot() { return path.join(app.getPath('userData'), 'runtimes', 'managed-python') }
function uvRoot() { return path.join(managedRoot(), 'uv') }
function pythonRoot() { return path.join(managedRoot(), 'python') }
function cacheRoot() { return path.join(managedRoot(), 'cache') }

function run(command: string, args: string[], env?: NodeJS.ProcessEnv) {
  return new Promise<{ ok: boolean; output: string }>((resolve) => {
    let output = ''
    let settled = false
    const child = spawn(command, args, { windowsHide: true, env: { ...process.env, ...env } })
    child.stdout.on('data', (chunk) => { output += String(chunk) })
    child.stderr.on('data', (chunk) => { output += String(chunk) })
    child.on('error', (error) => {
      if (!settled) resolve({ ok: false, output: `${output}\n${error.message}` })
      settled = true
    })
    child.on('close', (code) => {
      if (!settled) resolve({ ok: code === 0, output })
      settled = true
    })
  })
}

function download(url: string, destination: string, redirects = 0): Promise<void> {
  if (redirects > 6) return Promise.reject(new Error('Quá nhiều chuyển hướng khi tải Python runtime'))
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        const next = new URL(response.headers.location, url)
        if (next.protocol !== 'https:') return reject(new Error('Nguồn Python runtime không an toàn'))
        return download(next.toString(), destination, redirects + 1).then(resolve, reject)
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error(`Không thể tải Python runtime (HTTP ${response.statusCode})`))
      }
      const stream = fs.createWriteStream(destination)
      response.pipe(stream)
      stream.on('finish', () => stream.close(() => resolve()))
      stream.on('error', reject)
    })
    request.on('error', reject)
  })
}

function findFile(root: string, filename: string): string | null {
  if (!fs.existsSync(root)) return null
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name)
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return candidate
    if (entry.isDirectory()) {
      const nested = findFile(candidate, filename)
      if (nested) return nested
    }
  }
  return null
}

function findManagedPython() {
  return findFile(pythonRoot(), process.platform === 'win32' ? 'python.exe' : 'python3.12')
    || findFile(pythonRoot(), process.platform === 'win32' ? 'python.exe' : 'python3')
}

async function ensureUv(progress: Progress) {
  const existing = findFile(uvRoot(), process.platform === 'win32' ? 'uv.exe' : 'uv')
  if (existing) return existing
  const asset = UV_ASSETS[`${process.platform}-${process.arch}`]
  if (!asset) throw new Error(`Chưa hỗ trợ Python tự động cho ${process.platform}/${process.arch}`)
  fs.mkdirSync(uvRoot(), { recursive: true })
  const archive = path.join(managedRoot(), asset.file)
  progress('runtime.python.download', 3, 'Đang tải trình quản lý Python...')
  await download(`https://releases.astral.sh/github/uv/releases/download/${UV_VERSION}/${asset.file}`, archive)
  const digest = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex')
  if (digest !== asset.sha256) {
    fs.rmSync(archive, { force: true })
    throw new Error('Python bootstrap không vượt qua kiểm tra toàn vẹn SHA-256')
  }
  progress('runtime.python.install', 6, 'Đang giải nén trình quản lý Python...')
  const extracted = process.platform === 'win32'
    ? await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive', '-LiteralPath', archive, '-DestinationPath', uvRoot(), '-Force'])
    : await run('tar', ['-xzf', archive, '-C', uvRoot()])
  fs.rmSync(archive, { force: true })
  if (!extracted.ok) throw new Error(extracted.output || 'Không thể giải nén Python bootstrap')
  const executable = findFile(uvRoot(), process.platform === 'win32' ? 'uv.exe' : 'uv')
  if (!executable) throw new Error('Không tìm thấy uv sau khi giải nén')
  if (process.platform !== 'win32') fs.chmodSync(executable, 0o755)
  return executable
}

export async function ensureManagedPython(progress: Progress): Promise<string> {
  const existing = findManagedPython()
  if (existing) return existing
  const uv = await ensureUv(progress)
  fs.mkdirSync(pythonRoot(), { recursive: true })
  fs.mkdirSync(cacheRoot(), { recursive: true })
  progress('runtime.python.download', 7, 'Đang tải Python 3.12 phù hợp với thiết bị...')
  const managedEnv = {
    UV_PYTHON_INSTALL_DIR: pythonRoot(),
    UV_CACHE_DIR: cacheRoot(),
    UV_NO_PROGRESS: '1',
  }
  const installed = await run(uv, ['python', 'install', '3.12', '--install-dir', pythonRoot(), '--no-bin', '--managed-python', '--no-config'], managedEnv)
  if (!installed.ok) throw new Error(installed.output || 'Không thể cài Python 3.12 tự động')
  const executable = findManagedPython()
  if (!executable) throw new Error('Đã tải Python 3.12 nhưng không tìm thấy interpreter')
  const verified = await run(executable, ['-c', 'import sys; assert sys.version_info[:2] == (3, 12); print(sys.version)'])
  if (!verified.ok) throw new Error('Python runtime tải về không hợp lệ')
  progress('runtime.python.install', 9, 'Python 3.12 đã sẵn sàng')
  return executable
}
