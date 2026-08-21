import { app } from 'electron'
import { constants, createHash, publicEncrypt, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import voiceCatalog from '../../../src/features/tts-voice/data/voice_capcut.json'
import { cancelFFmpeg, probeMediaDuration, runFFmpeg } from '../../ffmpeg-runtime'

interface CapCutVoiceRecord {
  voice_type: string
  display_name: string
  resource_id: string
}

export interface CapCutGeneratePayload {
  jobId: string
  text: string
  speed?: number
  capcutVoiceType?: string
  capcutResourceId?: string
}

interface ProgressEvent {
  jobId: string
  kind: 'generate'
  stage: string
  percent?: number
  message: string
}

type Emit = (event: ProgressEvent) => void

const BASE_URL = 'https://editor-api-sg.capcutapi.com'
const DEVICE = {
  aid: '359289', app_name: 'CapCut', appvr: '8.7.0', version_name: '8.7.0', version_code: '8.7.0',
  channel: 'capcutpc_google', device_platform: 'mac', device_type: 'MacBookPro17,4',
  device_brand: 'MacBookPro17,4', os_version: '15.7.4', device_id: '76471456455646328721',
  iid: '76471456455646328721', region: 'VN', loc: 'VN', lan: 'vi-VN', pf: '3',
  tdid: '76471456455646328721',
}
const TTS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmTd34Lw4b7IuldSXh/zY
CMla+ITdGG5TeWz6ad+OySd4r+IrY45AoqrYUxhQ2dl+7z+i7r/5vEa8rr39BYfB
8AGMQLmZA8HmgpWBsqrn/V6daUALkKnkLb70Fn32CJigIuGXAYqxUdGuI340aC+0
v5Es3puJsHyzf01/AelE4Cdc6bZhQrASJLBh8R3BQToYClmDVSDUQk28o8sl/guA
Z4n303Vj+6Siv1HayPCdV6kpVVnMBAG4+umUbwGmn132N3fgpzLarFF3XyWmS1zh
D/J07iM/rP8GDO9IskHNHd2phrO0G6KzrcFAnTBHjVv+hCBEfzN/no3FNA9AuC36
mwIDAQAB
-----END PUBLIC KEY-----`

const activeControllers = new Map<string, AbortController>()
const catalog = voiceCatalog as CapCutVoiceRecord[]

function outputRoot() {
  return path.join(app.getPath('userData'), 'tts', 'outputs')
}

function md5(value: string) {
  return createHash('md5').update(value, 'utf8').digest('hex')
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function traceId() {
  const seed = randomUUID().replace(/-/g, '').slice(0, 32)
  return `00-${seed}-${seed.slice(0, 16)}-01`
}

function baseHeaders(bodyText: string, url: string) {
  const now = String(Math.floor(Date.now() / 1000))
  const pathOnly = url.split('?', 1)[0]
  const signInput = `9e2c|${pathOnly.slice(-7)}|3|${DEVICE.appvr}|${now}|${DEVICE.tdid}|11ac`
  return {
    'content-type': 'application/json',
    appvr: DEVICE.appvr,
    ch: DEVICE.channel,
    'device-time': now,
    lan: DEVICE.lan,
    loc: DEVICE.loc,
    pf: DEVICE.pf,
    'sign-ver': '1',
    tdid: DEVICE.tdid,
    'x-ss-stub': md5(bodyText),
    'x-ss-dp': DEVICE.aid,
    'x-khronos': now,
    'x-tt-trace-id': traceId(),
    'user-agent': 'Cronet/TTNetVersion:1d7cc3b1 2025-07-16 QuicVersion:52c2b40d 2025-04-03',
    'store-country-code': DEVICE.loc.toLowerCase(),
    'store-country-code-src': 'did',
    'is-dispatch-us-ttp': '0',
    'is-app-region-us-ttp': '0',
    'app-sdk-version': DEVICE.appvr,
    appid: DEVICE.aid,
    sign: md5(signInput),
  }
}

function commonQuery(includeRegion: boolean, babi?: Record<string, string>) {
  const query: Record<string, string> = {
    app_name: DEVICE.app_name,
    device_type: DEVICE.device_type,
    os_version: DEVICE.os_version,
    channel: DEVICE.channel,
    version_name: DEVICE.version_name,
    device_brand: DEVICE.device_brand,
    device_id: DEVICE.device_id,
    iid: DEVICE.iid,
    version_code: DEVICE.version_code,
    device_platform: DEVICE.device_platform,
    aid: DEVICE.aid,
  }
  if (includeRegion) query.region = DEVICE.region
  if (babi) query.babi_param = JSON.stringify(babi)
  return query
}

function payloadSignature(ssml: string, extraInfo: string) {
  const signInput = `appid:${DEVICE.aid}&did:${DEVICE.device_id}&creditDisable:false&ssml:${md5(ssml)}&extraInfo:${extraInfo}`
  return publicEncrypt(
    { key: TTS_PUBLIC_KEY, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(signInput, 'utf8'),
  ).toString('base64')
}

function resolveVoice(voiceType?: string, resourceId?: string) {
  const requested = voiceType || 'BV074_streaming'
  const voice = catalog.find((item) => item.voice_type === requested && !item.voice_type.includes('Neural'))
  if (!voice) throw new Error('Giọng CapCut không hợp lệ hoặc không được hỗ trợ')
  if (resourceId && resourceId !== voice.resource_id) throw new Error('Mã tài nguyên giọng CapCut không hợp lệ')
  return { voiceType: voice.voice_type, resourceId: voice.resource_id }
}

async function postJson(url: string, body: Record<string, unknown>, signal: AbortSignal) {
  const bodyText = JSON.stringify(body)
  const response = await fetch(url, {
    method: 'POST',
    headers: baseHeaders(bodyText, url),
    body: bodyText,
    signal,
  })
  const text = await response.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(`CapCut trả về dữ liệu không hợp lệ (HTTP ${response.status})`)
  }
  if (!response.ok) throw new Error(`CapCut HTTP ${response.status}`)
  return data
}

function buildCreateRequest(text: string, voiceType: string, resourceId: string, rate: number) {
  const babi = {
    feature_entrance: 'editor',
    feature_entrance_detail: 'editor-feature-text_to_speech',
    feature_key: 'text_to_speech',
    scenario: 'video_editor',
  }
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">\n`
    + `    <voice name="${voiceType}" mock_tone_info="" platform="sami" resource_id="${resourceId}" emotion="" emotion_scale="0" style="" role="" moyin_emotion="" is_clone_tone="false" need_subtitle_timestamp="false">\n`
    + `        <prosody rate="${rate.toFixed(1)}">${escapeXml(text)}</prosody>\n`
    + '    </voice>\n</speak>'
  const extraInfo = JSON.stringify({ benefit_info: {} })
  const payload: Record<string, unknown> = {
    audio_format: 'mp3',
    babi_param: JSON.stringify(babi),
    credit_disable: false,
    extra_info: extraInfo,
    need_merge_voice: false,
    need_subtitle_timestamp: false,
    scene: 'text_to_speech',
    ssml,
  }
  payload.sign = payloadSignature(ssml, extraInfo)
  const body = {
    bind_id: randomUUID(),
    can_queue: true,
    enter_from: 'text_to_speech',
    tasks: [{
      context: randomUUID(),
      payload: JSON.stringify(payload),
      req_key: 'sami_text_to_speech',
      task_version: 'v3',
    }],
  }
  const query = new URLSearchParams(commonQuery(true, babi)).toString()
  return { url: `${BASE_URL}/lv/v1/common_task/new?${query}`, body }
}

function buildQueryRequest(taskId: string, token: string) {
  const body = {
    tasks: [{ bind_id: '', id: taskId, req_key: 'sami_text_to_speech', task_version: 'v3', token }],
  }
  const query = new URLSearchParams(commonQuery(false)).toString()
  return { url: `${BASE_URL}/lv/v1/common_task/query?${query}`, body }
}

function tasksFrom(response: Record<string, unknown>) {
  const data = response.data as { tasks?: Array<Record<string, unknown>> } | undefined
  return data?.tasks || []
}

async function wait(milliseconds: number, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

async function generateChunk(text: string, voiceType: string, resourceId: string, rate: number, signal: AbortSignal) {
  const create = buildCreateRequest(text, voiceType, resourceId, rate)
  const created = await postJson(create.url, create.body, signal)
  const task = tasksFrom(created)[0]
  if (!task?.id || !task?.token) throw new Error('CapCut không tạo được tác vụ giọng nói')

  const started = Date.now()
  while (Date.now() - started < 600_000) {
    await wait(1_500, signal)
    const query = buildQueryRequest(String(task.id), String(task.token))
    const result = await postJson(query.url, query.body, signal)
    const current = tasksFrom(result)[0]
    const status = String(current?.status || '')
    if (['failed', 'error', 'fail'].includes(status)) throw new Error('CapCut không thể tạo giọng đã chọn')
    if (['succeed', 'success', 'completed', 'done', 'finish'].includes(status)) {
      const rawPayload = current?.payload
      const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
      const subtitles = (payload as { audio_subtitles?: Array<{ speech_url?: string }> } | undefined)?.audio_subtitles
      const audioUrl = subtitles?.[0]?.speech_url
      if (!audioUrl) throw new Error('CapCut đã xử lý xong nhưng không trả về đường dẫn audio')
      return audioUrl
    }
  }
  throw new Error('CapCut phản hồi quá thời gian 600 giây')
}

function splitText(text: string, maxLength = 450) {
  const sentences = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?…。！？])\s+|\n+/u)
    .map((part) => part.trim())
    .filter(Boolean)
  const chunks: string[] = []
  let current = ''
  const push = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }
  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      push()
      const words = sentence.split(/\s+/)
      for (const word of words) {
        if (current && `${current} ${word}`.length > maxLength) push()
        current = current ? `${current} ${word}` : word
      }
      push()
    } else if (!current) {
      current = sentence
    } else if (`${current} ${sentence}`.length <= maxLength) {
      current += ` ${sentence}`
    } else {
      push()
      current = sentence
    }
  }
  push()
  return chunks.length ? chunks : [text]
}

async function downloadFile(url: string, target: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Không thể tải audio CapCut (HTTP ${response.status})`)
  fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()))
}

async function mergeChunks(jobId: string, inputs: string[], outputPath: string) {
  const listPath = path.join(path.dirname(inputs[0]), 'concat.txt')
  const list = inputs.map((item) => `file '${item.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
  fs.writeFileSync(listPath, list, 'utf8')
  const result = await runFFmpeg({
    jobId,
    args: ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-vn', '-c:a', 'pcm_s16le', outputPath],
  })
  if (!result.success) throw new Error(result.canceled ? 'Đã hủy tạo giọng' : 'Không thể ghép các đoạn audio CapCut')
}

export async function generateCapCutTts(payload: CapCutGeneratePayload, emit: Emit) {
  const controller = new AbortController()
  activeControllers.set(payload.jobId, controller)
  const safeJobId = payload.jobId.replace(/[^a-zA-Z0-9_-]/g, '')
  const root = outputRoot()
  const tempRoot = path.join(root, '.capcut-temp', safeJobId)
  const outputPath = path.join(root, `${safeJobId}.wav`)
  try {
    const voice = resolveVoice(payload.capcutVoiceType, payload.capcutResourceId)
    const chunks = splitText(payload.text)
    const rate = Math.min(2, Math.max(0.5, payload.speed || 1))
    fs.mkdirSync(tempRoot, { recursive: true })
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'chunking', percent: 5, message: `Đã chia văn bản thành ${chunks.length} đoạn` })
    const audioFiles: string[] = []

    for (let index = 0; index < chunks.length; index += 1) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const basePercent = 8 + (index / chunks.length) * 78
      emit({
        jobId: payload.jobId,
        kind: 'generate',
        stage: 'generating',
        percent: basePercent,
        message: `CapCut đang tạo đoạn ${index + 1}/${chunks.length}...`,
      })
      const url = await generateChunk(chunks[index], voice.voiceType, voice.resourceId, rate, controller.signal)
      const audioPath = path.join(tempRoot, `chunk-${String(index + 1).padStart(3, '0')}.mp3`)
      await downloadFile(url, audioPath, controller.signal)
      audioFiles.push(audioPath)
    }

    emit({ jobId: payload.jobId, kind: 'generate', stage: 'merging', percent: 90, message: 'Đang ghép các đoạn audio...' })
    fs.mkdirSync(root, { recursive: true })
    await mergeChunks(payload.jobId, audioFiles, outputPath)
    const durationSec = await probeMediaDuration(outputPath)
    emit({ jobId: payload.jobId, kind: 'generate', stage: 'saving', percent: 98, message: 'Đã lưu audio CapCut' })
    return { success: true, outputPath, durationSec: durationSec || undefined }
  } catch (error) {
    const canceled = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')
    return { success: false, canceled, error: canceled ? 'Đã hủy tạo giọng' : error instanceof Error ? error.message : String(error) }
  } finally {
    activeControllers.delete(payload.jobId)
    const resolvedTemp = path.resolve(tempRoot)
    const resolvedParent = path.resolve(path.join(root, '.capcut-temp'))
    if (resolvedTemp.startsWith(`${resolvedParent}${path.sep}`)) {
      fs.rmSync(resolvedTemp, { recursive: true, force: true })
    }
  }
}

export function cancelCapCutJob(jobId: string) {
  const controller = activeControllers.get(jobId)
  controller?.abort()
  const ffmpegCanceled = cancelFFmpeg(jobId)
  return Boolean(controller) || ffmpegCanceled
}

export function cancelAllCapCutJobs() {
  for (const controller of activeControllers.values()) controller.abort()
  activeControllers.clear()
}
