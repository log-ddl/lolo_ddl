import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { runFFmpeg, probeAudioDuration } from '../../ffmpeg-runtime'

export type WhisperProvider = 'openai' | 'groq'

const PROVIDER_BASE_URL: Record<WhisperProvider, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
}

const PROVIDER_DEFAULT_MODEL: Record<WhisperProvider, string> = {
  openai: 'whisper-1',
  groq: 'whisper-large-v3-turbo',
}

// 25MB hard cap for both providers; we leave headroom for FormData overhead.
const PROVIDER_MAX_BYTES = 24 * 1024 * 1024

export interface TranscribeRequest {
  jobId: string
  audioPath: string
  provider: WhisperProvider
  apiKey: string
  model?: string
  language?: string
  prompt?: string
  chunkDurationSec?: number
}

export interface TranscribeProgressEvent {
  jobId: string
  type: 'stage' | 'chunk-start' | 'chunk-done' | 'log'
  stage?: 'probing' | 'chunking' | 'uploading' | 'merging' | 'done'
  chunkIndex?: number
  chunkTotal?: number
  percent?: number
  message?: string
}

export interface TranscribeResponse {
  success: boolean
  srt?: string
  durationSec?: number
  chunks?: number
  error?: string
  status?: number
  canceled?: boolean
}

type Emit = (event: TranscribeProgressEvent) => void

interface JobState {
  controller: AbortController
  tempDir: string | null
}

const activeTranscribes = new Map<string, JobState>()

export function cancelTranscribe(jobId: string): boolean {
  const state = activeTranscribes.get(jobId)
  if (!state) return false
  state.controller.abort()
  return true
}

export function cancelAllTranscribes(): void {
  for (const [, state] of activeTranscribes) {
    state.controller.abort()
  }
  activeTranscribes.clear()
}

export async function transcribeAudio(req: TranscribeRequest, emit: Emit): Promise<TranscribeResponse> {
  if (!req.apiKey) return { success: false, error: 'Missing API key' }
  if (!fs.existsSync(req.audioPath)) return { success: false, error: `Audio not found: ${req.audioPath}` }

  const baseUrl = PROVIDER_BASE_URL[req.provider]
  const model = req.model || PROVIDER_DEFAULT_MODEL[req.provider]
  if (!baseUrl) return { success: false, error: `Unknown provider: ${req.provider}` }

  const controller = new AbortController()
  const state: JobState = { controller, tempDir: null }
  activeTranscribes.set(req.jobId, state)

  try {
    emit({ jobId: req.jobId, type: 'stage', stage: 'probing', message: 'Probing audio duration' })
    const totalDuration = await probeAudioDuration(req.audioPath)

    const audioStat = fs.statSync(req.audioPath)
    const needChunk = audioStat.size > PROVIDER_MAX_BYTES

    let chunkPaths: { path: string; offsetSec: number }[]

    if (!needChunk) {
      chunkPaths = [{ path: req.audioPath, offsetSec: 0 }]
    } else {
      emit({ jobId: req.jobId, type: 'stage', stage: 'chunking', message: 'Splitting audio into chunks' })
      const tempDir = makeTempDir(req.jobId)
      state.tempDir = tempDir
      const chunkSec = req.chunkDurationSec ?? 600
      chunkPaths = await splitAudio({
        jobId: req.jobId,
        audioPath: req.audioPath,
        outDir: tempDir,
        chunkDurationSec: chunkSec,
        totalDurationSec: totalDuration ?? undefined,
      })
    }

    emit({
      jobId: req.jobId,
      type: 'stage',
      stage: 'uploading',
      message: `Transcribing ${chunkPaths.length} chunk(s)`,
      chunkTotal: chunkPaths.length,
    })

    const srtParts: string[] = []
    let cumulativeIndex = 0

    for (let i = 0; i < chunkPaths.length; i += 1) {
      if (controller.signal.aborted) {
        return { success: false, canceled: true, error: 'canceled' }
      }
      const chunk = chunkPaths[i]
      emit({
        jobId: req.jobId,
        type: 'chunk-start',
        chunkIndex: i,
        chunkTotal: chunkPaths.length,
        percent: Math.round((i / chunkPaths.length) * 100),
      })

      const result = await uploadChunk({
        baseUrl,
        apiKey: req.apiKey,
        model,
        language: req.language,
        prompt: req.prompt,
        chunkPath: chunk.path,
        signal: controller.signal,
      })
      if (!result.ok) {
        return {
          success: false,
          error: result.error,
          status: result.status,
        }
      }
      const { adjusted, lastIndex } = offsetSrt(result.srt, chunk.offsetSec, cumulativeIndex)
      cumulativeIndex = lastIndex
      srtParts.push(adjusted)

      emit({
        jobId: req.jobId,
        type: 'chunk-done',
        chunkIndex: i,
        chunkTotal: chunkPaths.length,
        percent: Math.round(((i + 1) / chunkPaths.length) * 100),
      })
    }

    emit({ jobId: req.jobId, type: 'stage', stage: 'merging', message: 'Merging chunks' })
    const finalSrt = srtParts.join('\n\n').trim() + '\n'

    emit({ jobId: req.jobId, type: 'stage', stage: 'done', percent: 100 })

    return {
      success: true,
      srt: finalSrt,
      durationSec: totalDuration ?? undefined,
      chunks: chunkPaths.length,
    }
  } catch (err) {
    if (controller.signal.aborted) {
      return { success: false, canceled: true, error: 'canceled' }
    }
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    activeTranscribes.delete(req.jobId)
    if (state.tempDir) {
      cleanupTempDir(state.tempDir)
    }
  }
}

function makeTempDir(jobId: string): string {
  const slug = jobId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'job'
  const dir = path.join(os.tmpdir(), `whisper-${slug}-${crypto.randomBytes(4).toString('hex')}`)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

interface SplitOptions {
  jobId: string
  audioPath: string
  outDir: string
  chunkDurationSec: number
  totalDurationSec?: number
}

async function splitAudio(opts: SplitOptions): Promise<{ path: string; offsetSec: number }[]> {
  // Use stream copy where possible, transcoding to mp3 only if codec is incompatible.
  // We force mp3 output to keep upload size predictable and supported by Whisper.
  const ext = '.mp3'
  const total = opts.totalDurationSec ?? 0
  const count = total > 0 ? Math.ceil(total / opts.chunkDurationSec) : 0
  // ffmpeg segment muxer handles chunking in one pass; we ask for sequential .mp3 outputs.
  const pattern = path.join(opts.outDir, `chunk_%03d${ext}`)
  const args = [
    '-y',
    '-i', opts.audioPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'libmp3lame',
    '-b:a', '64k',
    '-f', 'segment',
    '-segment_time', String(opts.chunkDurationSec),
    '-reset_timestamps', '1',
    pattern,
  ]
  const result = await runFFmpeg({
    jobId: `${opts.jobId}-split`,
    args,
    totalDurationSec: opts.totalDurationSec,
  })
  if (!result.success) {
    throw new Error(`Audio chunking failed: ${result.error || 'unknown ffmpeg error'}`)
  }
  // Enumerate produced files in order
  const entries = fs.readdirSync(opts.outDir)
    .filter((f) => f.startsWith('chunk_') && f.endsWith(ext))
    .sort()
  const parts: { path: string; offsetSec: number }[] = []
  for (let i = 0; i < entries.length; i += 1) {
    parts.push({
      path: path.join(opts.outDir, entries[i]),
      offsetSec: i * opts.chunkDurationSec,
    })
  }
  if (parts.length === 0) {
    throw new Error(`Chunking produced no output (count=${count})`)
  }
  return parts
}

interface UploadOptions {
  baseUrl: string
  apiKey: string
  model: string
  language?: string
  prompt?: string
  chunkPath: string
  signal: AbortSignal
}

interface UploadResult {
  ok: boolean
  srt: string
  status?: number
  error?: string
}

async function uploadChunk(opts: UploadOptions): Promise<UploadResult> {
  const fileBuffer = await fs.promises.readFile(opts.chunkPath)
  const fileBlob = new Blob([fileBuffer], { type: guessMimeType(opts.chunkPath) })

  const form = new FormData()
  form.append('file', fileBlob, path.basename(opts.chunkPath))
  form.append('model', opts.model)
  form.append('response_format', 'srt')
  if (opts.language) form.append('language', opts.language)
  if (opts.prompt) form.append('prompt', opts.prompt)

  let res: Response
  try {
    res = await fetch(`${opts.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      body: form,
      signal: opts.signal,
    })
  } catch (err) {
    return {
      ok: false,
      srt: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }

  if (!res.ok) {
    let bodyText = ''
    try { bodyText = await res.text() } catch { /* ignore */ }
    return {
      ok: false,
      srt: '',
      status: res.status,
      error: extractErrorMessage(bodyText) || `${res.status} ${res.statusText}`,
    }
  }

  const srt = await res.text()
  return { ok: true, srt }
}

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.mp3': return 'audio/mpeg'
    case '.wav': return 'audio/wav'
    case '.m4a': return 'audio/mp4'
    case '.flac': return 'audio/flac'
    case '.ogg': return 'audio/ogg'
    default: return 'application/octet-stream'
  }
}

function extractErrorMessage(body: string): string | null {
  if (!body) return null
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } | string; message?: string }
    if (typeof parsed.error === 'string') return parsed.error
    if (typeof parsed.error === 'object' && parsed.error && typeof parsed.error.message === 'string') {
      return parsed.error.message
    }
    if (typeof parsed.message === 'string') return parsed.message
  } catch {
    // not json
  }
  return body.slice(0, 500)
}

const SRT_TIME_RE = /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/

function offsetSrt(srt: string, offsetSec: number, startIndex: number): { adjusted: string; lastIndex: number } {
  // Parse blocks separated by blank lines.
  const blocks = srt.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  let nextIndex = startIndex
  const offsetMs = Math.round(offsetSec * 1000)
  const out: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length < 2) continue
    // Detect time line: it is the first line that matches the time regex.
    const timeIdx = lines.findIndex((l) => SRT_TIME_RE.test(l))
    if (timeIdx < 0) continue
    const timeLine = lines[timeIdx].replace(SRT_TIME_RE, (...m) => {
      const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = m as unknown as string[]
      const startMs = toMs(h1, m1, s1, ms1) + offsetMs
      const endMs = toMs(h2, m2, s2, ms2) + offsetMs
      return `${fromMs(startMs)} --> ${fromMs(endMs)}`
    })
    nextIndex += 1
    const textLines = lines.slice(timeIdx + 1).join('\n')
    out.push(`${nextIndex}\n${timeLine}\n${textLines}`)
  }

  return { adjusted: out.join('\n\n'), lastIndex: nextIndex }
}

function toMs(h: string, m: string, s: string, ms: string): number {
  return ((parseInt(h, 10) * 3600) + (parseInt(m, 10) * 60) + parseInt(s, 10)) * 1000 + parseInt(ms, 10)
}

function fromMs(totalMs: number): string {
  const ms = Math.max(0, Math.round(totalMs))
  const h = Math.floor(ms / 3600000)
  const rem1 = ms - h * 3600000
  const mi = Math.floor(rem1 / 60000)
  const rem2 = rem1 - mi * 60000
  const s = Math.floor(rem2 / 1000)
  const milli = rem2 - s * 1000
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0')
  return `${pad(h)}:${pad(mi)}:${pad(s)},${pad(milli, 3)}`
}
