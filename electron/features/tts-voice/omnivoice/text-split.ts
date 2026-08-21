import fs from 'node:fs'
import path from 'node:path'
import type { Emit } from './constants'
import { probeMediaDuration, runFFmpeg } from '../../../ffmpeg-runtime'
import type { TtsGeneratePayload, TtsRuntimeProgress } from '../omnivoice-runtime'
import { outputRoot, voicePromptRoot } from './paths'

/**
 * Long text is synthesized in pieces: split it into lines or sentences, generate
 * each piece, then concatenate the audio with a small gap so the result sounds
 * continuous.
 */

export function safeProfilePromptPath(profileId?: string) {
  if (!profileId) return undefined
  const safeId = profileId.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safeId) return undefined
  fs.mkdirSync(voicePromptRoot(), { recursive: true })
  return path.join(voicePromptRoot(), `${safeId}.pt`)
}

// ==================== Read line by line ====================

// Parent jobId -> per-line sub jobIds, so cancel can stop every line.
/** Sub-job ids spawned for each split line, keyed by the parent job id. */
export const lineJobs = new Map<string, string[]>()

export function splitLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?…。！？])\s+|\n+/u)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function mergeLineAudios(jobId: string, inputs: string[], outputPath: string, gapSec = 0.25, sampleRate = 24000): Promise<{ ok: boolean; canceled: boolean }> {
  const graphParts = inputs.map((_input, index) => {
    const pad = index < inputs.length - 1 ? `,apad=pad_dur=${gapSec}` : ''
    return `[${index}:a]aresample=${sampleRate},aformat=sample_fmts=s16:channel_layouts=mono${pad}[a${index}]`
  })
  const concatInputs = inputs.map((_input, index) => `[a${index}]`).join('')
  const filter = `${graphParts.join(';')};${concatInputs}concat=n=${inputs.length}:v=0:a=1[out]`
  return runFFmpeg({
    jobId,
    args: [
      '-y',
      ...inputs.flatMap((input) => ['-i', input]),
      '-filter_complex', filter,
      '-map', '[out]',
      '-c:a', 'pcm_s16le',
      outputPath,
    ],
  }).then((result) => ({ ok: result.success, canceled: result.canceled }))
}

export async function generateSplit(
  generateTts: (payload: TtsGeneratePayload, emit: Emit) => Promise<any>,
  payload: TtsGeneratePayload,
  parts: string[],
  emit: Emit,
  options?: { unitLabel?: string; stage?: string; gapSec?: number },
) {
  const parentJobId = payload.jobId
  const isLine = payload.splitMode === 'line'
  const unitLabel = options?.unitLabel || (isLine ? 'dòng' : 'câu')
  const stage = options?.stage || (isLine ? 'line-generating' : 'sentence-generating')
  const subIds = parts.map((_part, index) => `${parentJobId}-${index}`)
  lineJobs.set(parentJobId, subIds)
  try {
    fs.mkdirSync(outputRoot(), { recursive: true })
    const emitParent = (event: TtsRuntimeProgress) => emit({ ...event, jobId: parentJobId })
    const outputs: string[] = []
    for (let index = 0; index < parts.length; index += 1) {
      emit({
        jobId: parentJobId,
        kind: 'generate',
        stage,
        percent: Math.round(4 + (index / parts.length) * 86),
        message: `Đang đọc ${unitLabel} ${index + 1}/${parts.length}...`,
      })
      const result = await generateTts({ ...payload, jobId: subIds[index], text: parts[index], splitMode: 'default' }, emitParent)
      if (!result.success || !result.outputPath) {
        return { success: false, canceled: result.canceled, error: result.error || `Không thể đọc ${unitLabel} ${index + 1}` }
      }
      outputs.push(result.outputPath)
    }
    const outputPath = path.join(outputRoot(), `${parentJobId}.wav`)
    emit({ jobId: parentJobId, kind: 'generate', stage: 'merging', percent: 94, message: 'Đang ghép các phần lại...' })
    const merged = await mergeLineAudios(parentJobId, outputs, outputPath, options?.gapSec, payload.model.capability === 'vieneu' ? 48000 : 24000)
    if (!merged.ok) {
      return { success: false, canceled: merged.canceled, error: merged.canceled ? 'Đã hủy tạo giọng' : 'Không thể ghép các phần audio' }
    }
    for (const output of outputs) fs.rmSync(output, { force: true })
    const durationSec = await probeMediaDuration(outputPath)
    emit({ jobId: parentJobId, kind: 'generate', stage: 'saving', percent: 100, message: 'Đã lưu audio' })
    return { success: true, outputPath, durationSec: durationSec || undefined }
  } finally {
    lineJobs.delete(parentJobId)
  }
}

const VBEE_MAX_TEXT_CHARS = 50_000

/**
 * Keep Vbee requests as large as possible. Text at or below the API limit stays
 * intact; longer text is cut near a paragraph/sentence boundary, falling back to
 * a hard character boundary only when no useful separator exists.
 */
export function splitVbeeText(text: string): string[] {
  let remaining = text.replace(/\r\n/g, '\n').trim()
  if (remaining.length <= VBEE_MAX_TEXT_CHARS) return remaining ? [remaining] : []

  const chunks: string[] = []
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '… ', '; ', ', ', ' ']
  const preferredFloor = Math.floor(VBEE_MAX_TEXT_CHARS * 0.7)

  while (remaining.length > VBEE_MAX_TEXT_CHARS) {
    const window = remaining.slice(0, VBEE_MAX_TEXT_CHARS + 1)
    let cutAt = VBEE_MAX_TEXT_CHARS
    let bestBoundary = -1
    let bestSeparatorLength = 0

    for (const separator of separators) {
      const boundary = window.lastIndexOf(separator, VBEE_MAX_TEXT_CHARS)
      if (boundary >= preferredFloor && boundary > bestBoundary) {
        bestBoundary = boundary
        bestSeparatorLength = separator.length
      }
    }
    if (bestBoundary >= preferredFloor) cutAt = bestBoundary + bestSeparatorLength

    const chunk = remaining.slice(0, cutAt).trim()
    if (chunk) chunks.push(chunk)
    remaining = remaining.slice(cutAt).trimStart()
  }

  if (remaining.trim()) chunks.push(remaining.trim())
  return chunks
}

