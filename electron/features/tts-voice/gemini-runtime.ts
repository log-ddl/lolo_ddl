import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

interface GeminiSettingsFile {
  encryptedKeys: string[]
}

export interface GeminiGeneratePayload {
  jobId: string
  text: string
  modelId: string
  language?: string
  voiceName?: string
  style?: string
  temperature?: number
}

type Emit = (event: { jobId: string; kind: 'generate'; stage: string; percent?: number; message: string }) => void

const ALLOWED_MODELS = new Set(['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'])
const ALLOWED_VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe',
  'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
])
const REQUEST_TIMEOUT_MS = 180_000
const controllers = new Map<string, AbortController>()

function settingsPath() {
  return path.join(app.getPath('userData'), 'tts', 'gemini-keys.json')
}

function outputRoot() {
  return path.join(app.getPath('userData'), 'tts', 'outputs')
}

function normalizeKeys(keys: string[]) {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))].slice(0, 20)
}

export function getGeminiApiKeys() {
  const target = settingsPath()
  if (!fs.existsSync(target)) return []
  try {
    const data = JSON.parse(fs.readFileSync(target, 'utf8')) as GeminiSettingsFile
    return (data.encryptedKeys || []).map((value) => safeStorage.decryptString(Buffer.from(value, 'base64')))
  } catch {
    return []
  }
}

export function setGeminiApiKeys(keys: string[]) {
  const normalized = normalizeKeys(keys)
  if (normalized.length && !safeStorage.isEncryptionAvailable()) {
    throw new Error('Thiết bị chưa hỗ trợ lưu API key an toàn')
  }
  const target = settingsPath()
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const encryptedKeys = normalized.map((key) => safeStorage.encryptString(key).toString('base64'))
  fs.writeFileSync(target, JSON.stringify({ encryptedKeys } satisfies GeminiSettingsFile, null, 2), 'utf8')
  return { success: true, keyCount: normalized.length }
}

function splitText(text: string, maxChars = 3500) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (normalized.length <= maxChars) return [normalized]
  const sentences = normalized.split(/(?<=[.!?。！？])\s+|\n+/).filter(Boolean)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) chunks.push(current)
      for (let offset = 0; offset < sentence.length; offset += maxChars) chunks.push(sentence.slice(offset, offset + maxChars))
      current = ''
    } else if (!current || current.length + sentence.length + 1 <= maxChars) {
      current = current ? `${current} ${sentence}` : sentence
    } else {
      chunks.push(current)
      current = sentence
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function wavBuffer(pcm: Buffer, sampleRate = 24000) {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

function apiErrorMessage(status: number, body: unknown) {
  const message = typeof body === 'object' && body && 'error' in body
    ? String((body as { error?: { message?: string } }).error?.message || '')
    : ''
  if (status === 429) return `Gemini đã đạt giới hạn sử dụng${message ? `: ${message}` : ''}`
  if (status === 401 || status === 403) return `Gemini API key không hợp lệ hoặc chưa có quyền dùng TTS${message ? `: ${message}` : ''}`
  return `Gemini API lỗi HTTP ${status}${message ? `: ${message}` : ''}`
}

async function requestAudio(
  payload: GeminiGeneratePayload,
  text: string,
  keys: string[],
  controller: AbortController,
  emit: Emit,
  chunkIndex: number,
  chunkCount: number,
) {
  const temperature = Math.min(2, Math.max(0, Number.isFinite(payload.temperature) ? payload.temperature! : 1))
  let lastError: Error | undefined
  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    if (controller.signal.aborted) throw new DOMException('Đã hủy tạo giọng', 'AbortError')
    const key = keys[attempt]
    const requestController = new AbortController()
    let timedOut = false
    const abortRequest = () => requestController.abort(controller.signal.reason)
    controller.signal.addEventListener('abort', abortRequest, { once: true })
    const timeout = setTimeout(() => {
      timedOut = true
      requestController.abort()
    }, REQUEST_TIMEOUT_MS)
    const startPercent = 8 + Math.round(((chunkIndex + 0.05) / chunkCount) * 84)
    emit({
      jobId: payload.jobId,
      kind: 'generate',
      stage: 'generating',
      percent: startPercent,
      message: `Đã gửi đoạn ${chunkIndex + 1}/${chunkCount} tới Gemini · đang chờ tạo audio${keys.length > 1 ? ` · API ${attempt + 1}/${keys.length}` : ''}`,
    })
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(payload.modelId)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: requestController.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: payload.style?.trim() ? `${payload.style.trim()}\n\n${text}` : text }] }],
          generationConfig: {
            temperature,
            responseModalities: ['AUDIO'],
            speechConfig: {
              languageCode: payload.language || 'vi-VN',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voiceName || 'Puck' } },
            },
          },
        }),
      })
      const body = await response.json().catch(() => ({})) as {
        candidates?: Array<{
          finishReason?: string
          content?: { parts?: Array<{ inlineData?: { data?: string } }> }
        }>
      }
      if (response.ok) {
        const candidate = body.candidates?.[0]
        const base64 = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data
        if (base64) {
          const audio = Buffer.from(base64, 'base64')
          if (audio.length > 0) {
            const receivedPercent = 8 + Math.round(((chunkIndex + 0.9) / chunkCount) * 84)
            emit({ jobId: payload.jobId, kind: 'generate', stage: 'generating', percent: receivedPercent, message: `Đã nhận audio đoạn ${chunkIndex + 1}/${chunkCount}` })
            return audio
          }
        }
        lastError = new Error(`Gemini đã phản hồi nhưng không có audio${candidate?.finishReason ? ` (lý do: ${candidate.finishReason})` : ''}`)
        if (attempt + 1 < keys.length) continue
        throw lastError
      }
      lastError = new Error(apiErrorMessage(response.status, body))
      if (![429, 500, 503].includes(response.status) || attempt + 1 >= keys.length) throw lastError
    } catch (error) {
      if (controller.signal.aborted) throw error
      if (timedOut) {
        lastError = new Error(`Gemini không phản hồi sau ${REQUEST_TIMEOUT_MS / 1000} giây${keys.length > 1 ? ` với API ${attempt + 1}` : ''}`)
        if (attempt + 1 < keys.length) continue
        throw lastError
      }
      throw error
    } finally {
      clearTimeout(timeout)
      controller.signal.removeEventListener('abort', abortRequest)
    }
  }
  throw lastError || new Error('Không thể kết nối Gemini TTS')
}

export async function generateGeminiTts(payload: GeminiGeneratePayload, emit: Emit) {
  if (!ALLOWED_MODELS.has(payload.modelId)) return { success: false, error: 'Model Gemini TTS không được hỗ trợ' }
  if (!ALLOWED_VOICES.has(payload.voiceName || 'Puck')) return { success: false, error: 'Giọng Gemini không được hỗ trợ' }
  const keys = getGeminiApiKeys()
  if (!keys.length) return { success: false, error: 'Chưa có Gemini API key. Hãy thêm key trong Cài đặt.' }
  const controller = new AbortController()
  controllers.set(payload.jobId, controller)
  try {
    const chunks = splitText(payload.text)
    const pcmParts: Buffer[] = []
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'chunking', percent: 5, message: chunks.length === 1 ? 'Văn bản được gửi trong một lượt' : `Đã chia thành ${chunks.length} đoạn` })
    for (let index = 0; index < chunks.length; index += 1) {
      pcmParts.push(await requestAudio(payload, chunks[index], keys, controller, emit, index, chunks.length))
    }
    const pcm = Buffer.concat(pcmParts)
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'saving', percent: 96, message: 'Đang lưu audio Gemini...' })
    fs.mkdirSync(outputRoot(), { recursive: true })
    const outputPath = path.join(outputRoot(), `${payload.jobId}.wav`)
    fs.writeFileSync(outputPath, wavBuffer(pcm))
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'saving', percent: 100, message: 'Đã lưu audio Gemini' })
    return { success: true, outputPath, sampleRate: 24000, durationSec: pcm.length / 2 / 24000 }
  } catch (error) {
    const canceled = controller.signal.aborted
    return { success: false, canceled, error: canceled ? 'Đã hủy tạo giọng' : error instanceof Error ? error.message : String(error) }
  } finally {
    controllers.delete(payload.jobId)
  }
}

export function cancelGeminiJob(jobId: string) {
  const controller = controllers.get(jobId)
  if (!controller) return false
  controller.abort()
  controllers.delete(jobId)
  return true
}

export function cancelAllGeminiJobs() {
  for (const controller of controllers.values()) controller.abort()
  controllers.clear()
}
