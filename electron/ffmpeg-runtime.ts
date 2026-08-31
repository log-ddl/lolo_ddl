import { spawn, ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ffmpegStaticPath from 'ffmpeg-static'
import { spawnManagedProcess, terminateManagedProcess } from './process-supervisor'

export interface FFmpegRunOptions {
  jobId: string
  args: string[]
  totalDurationSec?: number
  onProgress?: (progress: { percent: number; timeSec: number; raw: string }) => void
  onLog?: (line: string) => void
}

export interface FFmpegRunResult {
  success: boolean
  exitCode: number | null
  stderr: string
  canceled: boolean
  error?: string
}

const activeJobs = new Map<string, ChildProcess>()

export function getFFmpegPath(): string {
  if (!ffmpegStaticPath) {
    throw new Error('ffmpeg-static did not provide a binary path for this platform')
  }
  // In dev: ffmpegStaticPath points into node_modules/ffmpeg-static/ffmpeg.exe directly.
  // In packaged build: asar packs node_modules but asarUnpack moves the binary to
  // app.asar.unpacked/. Rewrite the path so spawn finds the real exe on disk.
  const unpacked = ffmpegStaticPath.replace(/[\\/]app\.asar[\\/]/, path.sep + 'app.asar.unpacked' + path.sep)
  if (fs.existsSync(unpacked)) return unpacked
  if (fs.existsSync(ffmpegStaticPath)) return ffmpegStaticPath
  throw new Error(`ffmpeg binary not found at ${unpacked} or ${ffmpegStaticPath}`)
}

function parseFFmpegTime(line: string): number | null {
  // ffmpeg stderr emits "time=00:01:23.45" or "time=N/A"
  const match = line.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) return null
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const s = parseFloat(match[3])
  return h * 3600 + m * 60 + s
}

export function runFFmpeg(opts: FFmpegRunOptions): Promise<FFmpegRunResult> {
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath()
    let stderrBuf = ''
    let canceled = false

    const child = spawnManagedProcess(`ffmpeg-${opts.jobId}`, `FFmpeg Job (${opts.jobId})`, ffmpegPath, opts.args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    activeJobs.set(opts.jobId, child)

    child.stdout?.setEncoding('utf-8')
    child.stderr?.setEncoding('utf-8')

    let stderrTail = ''
    child.stderr?.on('data', (chunk: string) => {
      stderrBuf += chunk
      stderrTail += chunk
      // ffmpeg flushes progress on \r, not \n. Split on either.
      const lines = stderrTail.split(/[\r\n]/)
      stderrTail = lines.pop() ?? ''
      for (const line of lines) {
        if (!line) continue
        opts.onLog?.(line)
        const timeSec = parseFFmpegTime(line)
        if (timeSec != null && opts.onProgress) {
          const percent = opts.totalDurationSec && opts.totalDurationSec > 0
            ? Math.min(100, (timeSec / opts.totalDurationSec) * 100)
            : 0
          opts.onProgress({ percent, timeSec, raw: line })
        }
      }
    })

    child.on('error', (err) => {
      activeJobs.delete(opts.jobId)
      resolve({
        success: false,
        exitCode: null,
        stderr: stderrBuf,
        canceled,
        error: err.message,
      })
    })

    child.on('close', (code) => {
      activeJobs.delete(opts.jobId)
      resolve({
        success: code === 0 && !canceled,
        exitCode: code,
        stderr: stderrBuf,
        canceled,
        error: canceled ? 'canceled' : code !== 0 ? `ffmpeg exited with code ${code}` : undefined,
      })
    })

    // expose cancel via closure into activeJobs map; mark canceled flag here
    const originalKill = child.kill.bind(child)
    ;(child as ChildProcess & { _markCanceled?: () => void })._markCanceled = () => {
      canceled = true
      originalKill('SIGKILL')
    }
  })
}

export function cancelFFmpeg(jobId: string): boolean {
  terminateManagedProcess(`ffmpeg-${jobId}`)
  const child = activeJobs.get(jobId) as (ChildProcess & { _markCanceled?: () => void }) | undefined
  if (!child) return false
  if (child._markCanceled) child._markCanceled()
  else child.kill('SIGKILL')
  activeJobs.delete(jobId)
  return true
}

export function cancelAllFFmpeg(): void {
  for (const [jobId, child] of activeJobs.entries()) {
    terminateManagedProcess(`ffmpeg-${jobId}`)
    const c = child as ChildProcess & { _markCanceled?: () => void }
    if (c._markCanceled) c._markCanceled()
    else child.kill('SIGKILL')
    activeJobs.delete(jobId)
  }
}

export async function probeMediaDuration(mediaPath: string): Promise<number | null> {
  // Use ffmpeg -i to get duration (no separate ffprobe binary in ffmpeg-static).
  // Parse "Duration: 00:09:18.05," from stderr.
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath()
    let stderrBuf = ''
    const child = spawn(ffmpegPath, ['-i', mediaPath, '-f', 'null', '-'], {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    })
    child.stderr?.setEncoding('utf-8')
    child.stderr?.on('data', (chunk: string) => { stderrBuf += chunk })
    child.on('error', () => resolve(null))
    child.on('close', () => {
      const match = stderrBuf.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/)
      if (!match) return resolve(null)
      const h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const s = parseFloat(match[3])
      resolve(h * 3600 + m * 60 + s)
    })
  })
}

export async function probeAudioDuration(audioPath: string): Promise<number | null> {
  return probeMediaDuration(audioPath)
}

export async function probeMediaDimensions(mediaPath: string): Promise<{ width: number; height: number } | null> {
  // Parse the first video stream's dimensions from `ffmpeg -i` stderr,
  // e.g. "Stream #0:0 ... Video: h264 ... 1920x1080 ...".
  return new Promise((resolve) => {
    let ffmpegPath: string
    try {
      ffmpegPath = getFFmpegPath()
    } catch {
      return resolve(null)
    }
    let stderrBuf = ''
    const child = spawn(ffmpegPath, ['-i', mediaPath, '-t', '0', '-f', 'null', '-'], {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    })
    child.stderr?.setEncoding('utf-8')
    child.stderr?.on('data', (chunk: string) => { stderrBuf += chunk })
    child.on('error', () => resolve(null))
    child.on('close', () => {
      const match = stderrBuf.match(/Video:.*?(\d{2,5})x(\d{2,5})/)
      if (!match) return resolve(null)
      const width = parseInt(match[1], 10)
      const height = parseInt(match[2], 10)
      if (!width || !height) return resolve(null)
      resolve({ width, height })
    })
  })
}

export async function probeHasAudioStream(mediaPath: string): Promise<boolean> {
  // Detect whether a media file carries at least one audio stream by scanning
  // ffmpeg -i stderr for an "Audio:" stream line. Used before referencing a
  // segment's [idx:a] in a filtergraph — referencing a missing stream makes
  // ffmpeg abort with "matches no streams / Invalid argument".
  return new Promise((resolve) => {
    let ffmpegPath: string
    try {
      ffmpegPath = getFFmpegPath()
    } catch {
      return resolve(false)
    }
    let stderrBuf = ''
    // -t 0 stops right after the header is parsed: the stream list is already
    // printed, so this costs a header read instead of a full decode pass.
    const child = spawn(ffmpegPath, ['-i', mediaPath, '-t', '0', '-f', 'null', '-'], {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    })
    child.stderr?.setEncoding('utf-8')
    child.stderr?.on('data', (chunk: string) => { stderrBuf += chunk })
    child.on('error', () => resolve(false))
    child.on('close', () => resolve(/Stream #\d+:\d+.*: Audio:/.test(stderrBuf)))
  })
}
