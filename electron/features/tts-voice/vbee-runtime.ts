import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { probeMediaDuration } from '../../ffmpeg-runtime'

interface VbeeSettingsFile {
  encryptedAppId: string
  encryptedToken: string
}

export interface VbeeCredentials {
  appId: string
  token: string
  expiresAt?: number
}

export interface VbeeGeneratePayload {
  jobId: string
  text: string
  voiceCode: string
  speed?: number
  audioType?: 'mp3' | 'wav'
  bitrate?: number
}

export interface VbeeVoice {
  code: string
  name: string
  gender: 'male' | 'female' | string
  languageCode: string
  demo?: string
  creditFactor?: number
  ownership: 'VBEE' | 'COMMUNITY' | 'PERSONAL'
}

type Emit = (event: { jobId: string; kind: 'generate'; stage: string; percent?: number; message: string }) => void

const BASE_URL = 'https://vbee.vn/api/v1/tts'
const VOICES_URL = 'https://vbee.vn/api/public/v1/voices'
const controllers = new Map<string, AbortController>()
let voicesCache: { key: string; at: number; voices: VbeeVoice[] } | undefined

interface VbeeVoicesCacheFile {
  version: 1
  accountKey: string
  updatedAt: number
  voices: VbeeVoice[]
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'tts', 'vbee-credentials.json')
}

function outputRoot() {
  return path.join(app.getPath('userData'), 'tts', 'outputs')
}

function voicesCachePath() {
  return path.join(app.getPath('userData'), 'tts', 'vbee-voices.json')
}

function accountCacheKey(appId: string) {
  return crypto.createHash('sha256').update(appId).digest('hex')
}

function readVoicesCache(key: string) {
  try {
    const data = JSON.parse(fs.readFileSync(voicesCachePath(), 'utf8')) as VbeeVoicesCacheFile
    if (data.version !== 1 || data.accountKey !== key || !Array.isArray(data.voices)) return undefined
    return { key, at: Number(data.updatedAt) || 0, voices: data.voices }
  } catch {
    return undefined
  }
}

function writeVoicesCache(cache: { key: string; at: number; voices: VbeeVoice[] }) {
  const target = voicesCachePath()
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const data: VbeeVoicesCacheFile = {
    version: 1,
    accountKey: cache.key,
    updatedAt: cache.at,
    voices: cache.voices,
  }
  fs.writeFileSync(target, JSON.stringify(data), 'utf8')
}

function decodeJwtExpiry(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
    return Number.isFinite(parsed.exp) ? Number(parsed.exp) * 1000 : undefined
  } catch {
    return undefined
  }
}

export function getVbeeCredentials(): VbeeCredentials {
  const target = settingsPath()
  if (!fs.existsSync(target)) return { appId: '', token: '' }
  try {
    const data = JSON.parse(fs.readFileSync(target, 'utf8')) as VbeeSettingsFile
    const appId = safeStorage.decryptString(Buffer.from(data.encryptedAppId, 'base64'))
    const token = safeStorage.decryptString(Buffer.from(data.encryptedToken, 'base64'))
    return { appId, token, expiresAt: decodeJwtExpiry(token) }
  } catch {
    return { appId: '', token: '' }
  }
}

export function setVbeeCredentials(input: { appId?: string; token?: string }) {
  const appId = String(input.appId || '').trim()
  const token = String(input.token || '').trim()
  voicesCache = undefined
  if ((appId || token) && (!appId || !token)) throw new Error('Vui lòng nhập đủ App ID và Token Vbee')
  if ((appId || token) && !safeStorage.isEncryptionAvailable()) {
    throw new Error('Thiết bị chưa hỗ trợ lưu thông tin Vbee an toàn')
  }
  const target = settingsPath()
  fs.mkdirSync(path.dirname(target), { recursive: true })
  if (!appId && !token) {
    fs.rmSync(target, { force: true })
    return { success: true, configured: false }
  }
  const data: VbeeSettingsFile = {
    encryptedAppId: safeStorage.encryptString(appId).toString('base64'),
    encryptedToken: safeStorage.encryptString(token).toString('base64'),
  }
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8')
  return { success: true, configured: true, expiresAt: decodeJwtExpiry(token) }
}

async function fetchVoiceOwnership(credentials: VbeeCredentials, ownership: VbeeVoice['ownership']) {
  const voices: VbeeVoice[] = []
  let cursor = ''
  for (let page = 0; page < 30; page += 1) {
    const url = new URL(VOICES_URL)
    url.searchParams.set('voiceOwnership', ownership)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, {
      headers: {
        'app-id': credentials.appId,
        Authorization: `Bearer ${credentials.token}`,
        Accept: 'application/json',
      },
    })
    const body = await readJson(response) as {
      status?: number
      error_message?: string
      result?: {
        pagination?: { has_next_page?: boolean; next_cursor?: string | null }
        voices?: Array<{
          code?: string
          name?: string
          gender?: string
          language_code?: string
          demo?: string
          credit_factor?: number
        }>
      }
    }
    if (!response.ok) throw new Error(apiError(response.status, body))
    if (body.status === 0) throw new Error(body.error_message || 'Không thể lấy danh sách giọng Vbee')
    for (const voice of body.result?.voices || []) {
      if (!voice.code || !voice.name) continue
      voices.push({
        code: voice.code,
        name: voice.name,
        gender: voice.gender || '',
        languageCode: voice.language_code || '',
        demo: voice.demo,
        creditFactor: voice.credit_factor,
        ownership,
      })
    }
    const pagination = body.result?.pagination
    if (!pagination?.has_next_page || !pagination.next_cursor) break
    cursor = pagination.next_cursor
  }
  return voices
}

export async function getVbeeVoices(force = false) {
  const credentials = getVbeeCredentials()
  if (!credentials.appId || !credentials.token) return { success: false, voices: [], error: 'Chưa nhập App ID và Token Vbee.' }
  const cacheKey = accountCacheKey(credentials.appId)
  if (!force) {
    const cached = voicesCache?.key === cacheKey ? voicesCache : readVoicesCache(cacheKey)
    if (cached?.voices.length) {
      voicesCache = cached
      return { success: true, voices: cached.voices, updatedAt: cached.at }
    }
  }
  try {
    const groups = await Promise.all((['VBEE', 'PERSONAL', 'COMMUNITY'] as const).map((ownership) => (
      fetchVoiceOwnership(credentials, ownership).catch((error) => {
        if (ownership === 'VBEE') throw error
        return []
      })
    )))
    const unique = new Map<string, VbeeVoice>()
    for (const voice of groups.flat()) if (!unique.has(voice.code)) unique.set(voice.code, voice)
    const voices = [...unique.values()].sort((left, right) => (
      left.languageCode.localeCompare(right.languageCode) || left.name.localeCompare(right.name)
    ))
    voicesCache = { key: cacheKey, at: Date.now(), voices }
    writeVoicesCache(voicesCache)
    return { success: true, voices, updatedAt: voicesCache.at }
  } catch (error) {
    return { success: false, voices: [], error: error instanceof Error ? error.message : String(error) }
  }
}

function findString(value: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 6 || value === null || value === undefined) return undefined
  if (typeof value === 'string') {
    if (keys.includes('$value') && /^https:\/\//i.test(value)) return value
    return undefined
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item, keys, depth + 1)
      if (found) return found
    }
    return undefined
  }
  if (typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const item = record[key]
    if (typeof item === 'string' && item.trim()) return item.trim()
  }
  for (const item of Object.values(record)) {
    const found = findString(item, keys, depth + 1)
    if (found) return found
  }
  return undefined
}

function findNumber(value: unknown, keys: string[], depth = 0): number | undefined {
  if (depth > 6 || value === null || value === undefined || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumber(item, keys, depth + 1)
      if (found !== undefined) return found
    }
    return undefined
  }
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const item = record[key]
    if (typeof item === 'number' && Number.isFinite(item)) return item
  }
  for (const item of Object.values(record)) {
    const found = findNumber(item, keys, depth + 1)
    if (found !== undefined) return found
  }
  return undefined
}

function responseError(body: unknown) {
  if (!body || typeof body !== 'object') return ''
  const record = body as Record<string, unknown>
  const statusFailed = record.status === 0 || record.success === false
  const message = findString(body, ['error_message', 'message', 'error', 'detail'])
  return statusFailed ? message || 'Vbee từ chối yêu cầu' : ''
}

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) as unknown } catch { return { message: text.slice(0, 500) } }
}

function apiError(status: number, body: unknown) {
  const detail = responseError(body) || findString(body, ['error_message', 'message', 'error', 'detail']) || ''
  if (status === 401 || status === 403) return `App ID hoặc Token Vbee không hợp lệ, hết hạn hoặc chưa được cấp quyền API${detail ? `: ${detail}` : ''}`
  if (status === 429) return `Vbee đang giới hạn số yêu cầu hoặc tài khoản đã hết hạn mức${detail ? `: ${detail}` : ''}`
  if (/callback/i.test(detail)) return `Gói Vbee này đang bắt buộc Callback URL và chưa hỗ trợ nhận kết quả trực tiếp: ${detail}`
  return `Vbee API lỗi HTTP ${status}${detail ? `: ${detail}` : ''}`
}

async function pollResult(requestId: string, token: string, controller: AbortController, payload: VbeeGeneratePayload, emit: Emit) {
  const startedAt = Date.now()
  const timeoutMs = 15 * 60 * 1000
  let attempt = 0
  while (Date.now() - startedAt < timeoutMs) {
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 2500)
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
    attempt += 1
    const elapsedRatio = Math.min(1, (Date.now() - startedAt) / timeoutMs)
    emit({
      jobId: payload.jobId,
      kind: 'generate',
      stage: 'vbee-processing',
      percent: Math.round(18 + elapsedRatio * 58),
      message: `Vbee đang xử lý audio... (${attempt})`,
    })
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    })
    const body = await readJson(response)
    if (!response.ok) {
      if ([404, 409, 425].includes(response.status)) continue
      throw new Error(apiError(response.status, body))
    }
    const failed = responseError(body)
    if (failed && !/pending|processing|wait|đang xử lý/i.test(failed)) throw new Error(failed)
    const taskStatus = findString(body, ['status'])?.toUpperCase()
    if (taskStatus === 'FAILURE' || taskStatus === 'FAILED' || taskStatus === 'ERROR') {
      throw new Error(findString(body, ['error_message', 'message', 'error', 'detail']) || 'Vbee không thể tạo audio')
    }
    const remoteProgress = findNumber(body, ['progress'])
    if (remoteProgress !== undefined) {
      emit({
        jobId: payload.jobId,
        kind: 'generate',
        stage: 'vbee-processing',
        percent: Math.min(78, Math.max(18, Math.round(18 + remoteProgress * 0.6))),
        message: `Vbee đang tạo giọng... ${Math.round(remoteProgress)}%`,
      })
    }
    const audioLink = findString(body, ['audio_link', 'audio_url', 'file_url', 'url'])
    if (audioLink && /^https:\/\//i.test(audioLink)) return audioLink
  }
  throw new Error('Vbee xử lý quá 15 phút. Hãy kiểm tra lại tác vụ trong tài khoản Vbee.')
}

async function downloadAudio(url: string, destination: string, controller: AbortController, payload: VbeeGeneratePayload, emit: Emit) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:') throw new Error('Vbee trả về đường dẫn audio không an toàn')
  emit({ jobId: payload.jobId, kind: 'generate', stage: 'vbee-downloading', percent: 82, message: 'Đang tải audio Vbee về máy...' })
  const response = await fetch(parsed, { signal: controller.signal, redirect: 'follow' })
  if (!response.ok) throw new Error(`Không thể tải audio Vbee (HTTP ${response.status})`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.length) throw new Error('File audio Vbee trả về bị rỗng')
  fs.writeFileSync(destination, bytes)
}

export async function generateVbeeTts(payload: VbeeGeneratePayload, emit: Emit) {
  const credentials = getVbeeCredentials()
  if (!credentials.appId || !credentials.token) return { success: false, error: 'Chưa nhập App ID và Token Vbee trong Cài đặt.' }
  if (credentials.expiresAt && credentials.expiresAt <= Date.now()) return { success: false, error: 'Token Vbee đã hết hạn. Hãy tạo hoặc nhập Token mới.' }
  const voiceCode = String(payload.voiceCode || '').trim()
  if (!voiceCode) return { success: false, error: 'Hãy nhập mã giọng Vbee.' }
  if (!/^[a-zA-Z0-9_.-]{2,200}$/.test(voiceCode)) return { success: false, error: 'Mã giọng Vbee không hợp lệ.' }
  const audioType = payload.audioType === 'wav' ? 'wav' : 'mp3'
  const bitrate = [8, 16, 32, 64, 128].includes(Number(payload.bitrate)) ? Number(payload.bitrate) : 128
  const speed = Math.round(Math.min(1.9, Math.max(0.1, Number(payload.speed) || 1)) * 10) / 10
  const controller = new AbortController()
  const requestStartedAt = Date.now()
  let timedOut = false
  const requestProgressTimer = setInterval(() => {
    const elapsedSec = Math.round((Date.now() - requestStartedAt) / 1000)
    const percent = Math.min(70, 10 + Math.round(elapsedSec / 12))
    emit({
      jobId: payload.jobId,
      kind: 'generate',
      stage: 'vbee-processing',
      percent,
      message: `Vbee đang tạo giọng... (${elapsedSec} giây)`,
    })
  }, 3000)
  const requestTimeoutTimer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 15 * 60 * 1000)
  controllers.set(payload.jobId, controller)
  try {
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'vbee-submitting', percent: 6, message: 'Đang gửi văn bản tới Vbee...' })
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        app_id: credentials.appId,
        response_type: 'indirect',
        callback_url: 'https://vbee.vn/api/v1/tts/callback-disabled',
        input_text: payload.text,
        voice_code: voiceCode,
        audio_type: audioType,
        bitrate,
        speed_rate: speed,
      }),
    })
    const body = await readJson(response)
    clearInterval(requestProgressTimer)
    clearTimeout(requestTimeoutTimer)
    if (!response.ok) throw new Error(apiError(response.status, body))
    const failed = responseError(body)
    if (failed) throw new Error(failed)
    let audioLink = findString(body, ['audio_link', 'audio_url', 'file_url', 'url'])
    if (!audioLink) {
      const requestId = findString(body, ['request_id', 'requestId', 'id'])
      if (!requestId) throw new Error('Vbee không trả về đường dẫn audio hoặc mã yêu cầu.')
      emit({ jobId: payload.jobId, kind: 'generate', stage: 'vbee-processing', percent: 16, message: 'Vbee đã nhận yêu cầu và đang tạo giọng...' })
      audioLink = await pollResult(requestId, credentials.token, controller, payload, emit)
    }
    fs.mkdirSync(outputRoot(), { recursive: true })
    const outputPath = path.join(outputRoot(), `${payload.jobId}.${audioType}`)
    await downloadAudio(audioLink, outputPath, controller, payload, emit)
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'saving', percent: 96, message: 'Đang lưu audio Vbee...' })
    const durationSec = await probeMediaDuration(outputPath)
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'vbee-done', percent: 100, message: 'Đã tạo xong audio Vbee' })
    return { success: true, outputPath, durationSec: durationSec || undefined }
  } catch (error) {
    const canceled = controller.signal.aborted && !timedOut
    return {
      success: false,
      canceled,
      error: timedOut
        ? 'Vbee xử lý quá 15 phút. Hãy kiểm tra tác vụ trong tài khoản Vbee.'
        : canceled ? 'Đã hủy tạo giọng Vbee' : error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearInterval(requestProgressTimer)
    clearTimeout(requestTimeoutTimer)
    controllers.delete(payload.jobId)
  }
}

export function cancelVbeeJob(jobId: string) {
  const controller = controllers.get(jobId)
  if (!controller) return false
  controller.abort()
  controllers.delete(jobId)
  return true
}

export function cancelAllVbeeJobs() {
  for (const controller of controllers.values()) controller.abort()
  controllers.clear()
}
