import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * Turns the many source forms the renderer receives (local-image:// URLs, data
 * URLs, http URLs, file:// URLs, absolute or relative paths) into an absolute
 * path ffmpeg can open — downloading or decoding into the job's temp dir when
 * that is the only way.
 */

interface ResolveMediaOptions {
  tempDir?: string
  tempName?: string
  allowDataUrl: boolean
  allowRemote: boolean
  remoteAccept?: string
}

export function imageExtFromMime(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim()
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg'
  if (normalized.includes('webp')) return '.webp'
  if (normalized.includes('gif')) return '.gif'
  if (normalized.includes('bmp')) return '.bmp'
  if (normalized.includes('svg')) return '.svg'
  return '.png'
}

async function resolveMediaSrc(src: string, mediaRoot: string, candidateDirs: string[], options: ResolveMediaOptions): Promise<string> {
  const cleaned = src.trim().replace(/^['"]|['"]$/g, '')
  if (!cleaned) return ''

  if (cleaned.startsWith('data:')) {
    if (!options.allowDataUrl || !options.tempDir || !options.tempName) return ''
    const match = cleaned.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s)
    if (!match) return ''
    const mimeType = match[1] || 'image/png'
    const ext = imageExtFromMime(mimeType)
    const filePath = path.join(options.tempDir, `${options.tempName}${ext}`)
    fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'))
    return fs.existsSync(filePath) ? filePath : ''
  }

  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    if (!options.allowRemote || !options.tempDir || !options.tempName) return ''
    try {
      const response = await fetch(cleaned, { headers: { Accept: options.remoteAccept || '*/*' } })
      if (!response.ok) return ''
      const mimeType = response.headers.get('content-type') || 'image/png'
      const ext = imageExtFromMime(mimeType)
      const filePath = path.join(options.tempDir, `${options.tempName}${ext}`)
      fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()))
      return fs.existsSync(filePath) ? filePath : ''
    } catch {
      return ''
    }
  }

  if (cleaned.startsWith('local-image://') || cleaned.startsWith('local-video://')) {
    const match = cleaned.match(/^local-(?:image|video):\/\/([^/]+)\/(.+)$/)
    if (!match) return ''
    const [, category, filename] = match
    const filePath = path.join(mediaRoot, decodeURIComponent(category), decodeURIComponent(filename))
    return fs.existsSync(filePath) ? filePath : ''
  }

  if (cleaned.startsWith('file://')) {
    try {
      const filePath = fileURLToPath(cleaned)
      return fs.existsSync(filePath) ? filePath : ''
    } catch {
      const decoded = decodeURIComponent(cleaned.replace(/^file:\/\/\/?/, ''))
      return fs.existsSync(decoded) ? decoded : ''
    }
  }

  if (path.isAbsolute(cleaned)) {
    return fs.existsSync(cleaned) ? cleaned : ''
  }

  for (const dir of candidateDirs) {
    const filePath = path.resolve(dir, cleaned)
    if (fs.existsSync(filePath)) return filePath
  }

  return ''
}

/**
 * Resolve image source to an absolute filesystem path that ffmpeg can read.
 * Accepts: local-image://category/filename, file:// URL, raw absolute path.
 * Returns empty string for unsupported formats (data:, blob:, http(s):) or
 * when the resolved file does not exist on disk.
 */
export async function resolveImageSrc(src: string, mediaRoot: string, candidateDirs: string[], tempDir: string, index: number): Promise<string> {
  return resolveMediaSrc(src, mediaRoot, candidateDirs, {
    tempDir,
    tempName: `img_${index.toString().padStart(4, '0')}`,
    allowDataUrl: true,
    allowRemote: true,
    remoteAccept: 'image/*,*/*;q=0.8',
  })
}

export async function resolveVideoSrc(src: string, mediaRoot: string, candidateDirs: string[]): Promise<string> {
  return resolveMediaSrc(src, mediaRoot, candidateDirs, {
    allowDataUrl: false,
    allowRemote: false,
  })
}

export function resolveAudioPath(src: string, candidateDirs: string[]): string {
  const cleaned = src.trim().replace(/^['"]|['"]$/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('file://')) {
    try {
      const filePath = fileURLToPath(cleaned)
      return fs.existsSync(filePath) ? filePath : ''
    } catch {
      const decoded = decodeURIComponent(cleaned.replace(/^file:\/\/\/?/, ''))
      return fs.existsSync(decoded) ? decoded : ''
    }
  }
  if (path.isAbsolute(cleaned)) return fs.existsSync(cleaned) ? cleaned : ''
  for (const dir of candidateDirs) {
    const filePath = path.resolve(dir, cleaned)
    if (fs.existsSync(filePath)) return filePath
  }
  return ''
}

export function makeTempDir(jobId: string): string {
  const slug = jobId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'job'
  const dir = path.join(os.tmpdir(), `autovideo-${slug}-${crypto.randomBytes(4).toString('hex')}`)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}
