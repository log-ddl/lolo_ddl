import { planCloneParts } from './clone-chunks'
import { createHash, randomUUID } from 'node:crypto'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { TtsGeneratePayload } from './omnivoice-runtime'

export const MAX_ZIP_BYTES = 256 * 1024 * 1024
export const COLAB_MODELS: Record<string, { repository: string; engine: string; mode: string }> = {
  'cosyvoice3-0.5b': { repository: 'FunAudioLLM/Fun-CosyVoice3-0.5B-2512', engine: 'cosyvoice', mode: 'clone' },
}
for (const size of ['0.6B', '1.7B']) {
  for (const [variant, mode] of [['Base', 'clone'], ['CustomVoice', 'preset']]) {
    COLAB_MODELS[`qwen3-${size.toLowerCase()}-${variant === 'Base' ? 'base' : 'custom'}`] = {
      repository: `Qwen/Qwen3-TTS-12Hz-${size}-${variant}`, engine: 'qwen3', mode,
    }
  }
}
COLAB_MODELS['qwen3-1.7b-design'] = { repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', engine: 'qwen3', mode: 'design' }
export const hash = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex')
export const safeId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)
export function safeEntry(name: string) {
  return Boolean(name) && !name.includes('\\') && !name.includes(':') && !name.startsWith('/') && name.split('/').every(p => p !== '..' && p !== '.')
}
export function readPackage(bytes: Uint8Array) {
  if (bytes.length > MAX_ZIP_BYTES) throw new Error('ZIP vượt giới hạn 256 MB.')
  let total = 0, count = 0
  const seen = new Set<string>()
  return unzipSync(bytes, { filter(entry) {
    if (!safeEntry(entry.name) || seen.has(entry.name) || ++count > 1000 || (total += entry.originalSize) > MAX_ZIP_BYTES) throw new Error('ZIP không hợp lệ hoặc quá lớn.')
    seen.add(entry.name)
    return true
  } })
}
export interface ColabTask {
  id: string; name: string; text: string; parts: string[]; voiceLabel: string
  mode: 'clone' | 'design' | 'preset'; language: string; instruction: string; localStyle: string; qwenSpeaker: string
  referenceAudioPath?: string; referenceText: string
}
export interface ColabManifest {
  format: 'logdd-tts-tasks'; version: 1; packId: string; createdAt: number
  modelId: string; repository: string; engine: string; jobs: ColabTask[]
}
export function buildManifest(payload: TtsGeneratePayload, inputs: { name: string; text: string }[], voiceLabel: string): ColabManifest {
  const model = COLAB_MODELS[payload.model?.id]
  if (!model || payload.model.repository !== model.repository || payload.mode !== model.mode) throw new Error('Colab hỗ trợ Qwen3 và CosyVoice với đúng chế độ giọng.')
  if (!inputs.length || inputs.length > 100) throw new Error('Mỗi gói cần từ 1 đến 100 tác vụ.')
  if (payload.mode === 'design' && !payload.instruction?.trim()) throw new Error('Hãy nhập mô tả giọng thiết kế.')
  if (payload.mode === 'clone' && !payload.referenceAudioPath) throw new Error('Hãy chọn giọng mẫu để nhân bản.')
  if (model.engine === 'qwen3' && !['auto', 'zh', 'en', 'ja', 'ko', 'de', 'fr', 'ru', 'pt', 'es', 'it'].includes(payload.language || 'auto')) throw new Error('Qwen3 không hỗ trợ ngôn ngữ này.')
  if (model.engine === 'qwen3' && payload.mode === 'preset') {
    if (!['Vivian', 'Serena', 'Uncle_Fu', 'Dylan', 'Eric', 'Ryan', 'Aiden', 'Ono_Anna', 'Sohee'].includes(payload.qwenSpeaker || 'Ryan')) throw new Error('Giọng Qwen3 không hợp lệ.')
    if (payload.model.id === 'qwen3-0.6b-custom' && payload.localStyle?.trim()) throw new Error('Điều khiển cảm xúc cần CustomVoice 1.7B.')
  }
  return {
    format: 'logdd-tts-tasks', version: 1, packId: randomUUID(), createdAt: Date.now(),
    modelId: payload.model.id, repository: model.repository, engine: model.engine,
    jobs: inputs.map(input => {
      const text = input.text.replace(/^\uFEFF/, '').trim()
      if (!text || text.length > 100_000) throw new Error(`Nội dung rỗng hoặc vượt 100.000 ký tự: ${input.name}`)
      const parts = payload.mode === 'clone' ? planCloneParts(text, payload.splitMode) : (payload.splitMode === 'line' ? text.split(/\r?\n/) : payload.splitMode === 'sentence' ? text.split(/(?<=[.!?…。！？])\s+|\n+/u) : [text]).map(p => p.trim()).filter(Boolean)
      return { id: randomUUID(), name: input.name.slice(0, 160), text, parts, mode: payload.mode as ColabTask['mode'],
        voiceLabel: voiceLabel.slice(0, 200), language: payload.language || 'auto', instruction: payload.instruction?.trim() || '',
        localStyle: payload.localStyle?.trim() || '', qwenSpeaker: payload.qwenSpeaker || 'Ryan',
        referenceText: payload.mode === 'clone' ? payload.referenceText?.trim() || '' : '' }
    }),
  }
}
export function encodeTasks(manifest: ColabManifest, files: Record<string, Uint8Array>) {
  const raw = JSON.stringify(manifest)
  return { raw, requestHash: hash(raw), zip: zipSync({ ...files, 'tasks.json': strToU8(raw) }, { level: 0 }) }
}
export function parseJson(files: Record<string, Uint8Array>, name: string) {
  const data = files[name]
  if (!data || data.length > 16 * 1024 * 1024) throw new Error(`Thiếu hoặc sai ${name}.`)
  return JSON.parse(strFromU8(data))
}
/** Accept only complete PCM16 WAV output, never trust the duration in an imported JSON. */
export function inspectWav(bytes: Uint8Array) {
  const b = Buffer.from(bytes)
  if (b.length < 44 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE' || b.readUInt32LE(4) + 8 !== b.length) throw new Error('WAV không hợp lệ.')
  let rate = 0, align = 0, data = 0
  for (let pos = 12; pos + 8 <= b.length;) {
    const tag = b.toString('ascii', pos, pos + 4), size = b.readUInt32LE(pos + 4), start = pos + 8
    if (start + size > b.length) throw new Error('WAV bị thiếu dữ liệu.')
    if (tag === 'fmt ') {
      if (size < 16 || b.readUInt16LE(start) !== 1 || b.readUInt16LE(start + 14) !== 16) throw new Error('Cần WAV PCM16.')
      const channels = b.readUInt16LE(start + 2)
      rate = b.readUInt32LE(start + 4); align = b.readUInt16LE(start + 12)
      if (channels < 1 || channels > 2 || rate < 8000 || rate > 192000 || align !== channels * 2) throw new Error('Thông số WAV không hợp lệ.')
    }
    if (tag === 'data') data += size
    pos = start + size + (size % 2)
  }
  if (!rate || !align || !data || data % align) throw new Error('WAV rỗng hoặc không hợp lệ.')
  return { sampleRate: rate, durationSec: data / align / rate }
}
export function validateResults(files: Record<string, Uint8Array>, manifest: ColabManifest, requestHash: string) {
  const report = parseJson(files, 'results.json')
  if (report.format !== 'logdd-tts-results' || report.version !== 1 || report.packId !== manifest.packId || report.requestHash !== requestHash || !Array.isArray(report.jobs) || report.jobs.length > manifest.jobs.length) throw new Error('Kết quả không khớp gói đã xuất từ app này.')
  const seen = new Set<string>()
  let failed = 0
  const audio: { task: ColabTask; bytes: Uint8Array; durationSec: number; sampleRate: number }[] = []
  for (const row of report.jobs) {
    const task = manifest.jobs.find(j => j.id === row.id)
    if (!task || seen.has(row.id)) throw new Error('Mã tác vụ lạ hoặc trùng lặp.')
    seen.add(row.id)
    if (row.status === 'error') { failed++; continue }
    const name = `audio/${task.id}.wav`, bytes = files[name]
    if (row.status !== 'done' || row.file !== name || !bytes || hash(bytes) !== row.sha256) throw new Error('Audio bị thiếu hoặc sai mã kiểm tra.')
    audio.push({ task, bytes, ...inspectWav(bytes) })
  }
  return { audio, failed, missing: manifest.jobs.length - seen.size }
}
