import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import http from 'node:http'
import { getMediaRoot } from './storage-paths'

/**
 * Image plumbing shared by the image IPC handlers: downloading, reading from
 * any of the app's source forms (http / data URL / local-image:// / absolute
 * path), Bing image search, and uploads to a user-configured image host.
 */

const WEB_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
}

export const downloadImage = (url: string, filePath: string, maxRedirects: number = 5, sourcePageUrl?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'))
      return
    }
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(filePath)

    protocol.get(url, {
      headers: {
        ...WEB_BROWSER_HEADERS,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ...(sourcePageUrl ? { Referer: sourcePageUrl } : {}),
      },
    }, (response) => {
      const status = response.statusCode ?? 0
      if ([301, 302, 303, 307, 308].includes(status)) {
        file.close()
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          const resolvedRedirect = new URL(redirectUrl, url).toString()
          downloadImage(resolvedRedirect, filePath, maxRedirects - 1, sourcePageUrl).then(resolve).catch(reject)
          return
        }
      }

      if (status !== 200) {
        file.close()
        fs.unlink(filePath, () => { })
        reject(new Error(`Failed to download: ${status}`))
        return
      }

      const contentType = String(response.headers['content-type'] || '').toLowerCase()
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        file.close()
        fs.unlink(filePath, () => { })
        reject(new Error(`Image URL returned ${contentType || 'non-image content'}`))
        return
      }
      const contentLength = Number(response.headers['content-length'] || 0)
      if (contentLength > 40 * 1024 * 1024) {
        file.close()
        fs.unlink(filePath, () => { })
        reject(new Error('Image exceeds 40 MB download limit'))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlink(filePath, () => { })
      reject(err)
    })
  })
}

const fetchWebPage = (url: string, maxRedirects: number = 5): Promise<string> => new Promise((resolve, reject) => {
  if (maxRedirects <= 0) return reject(new Error('Too many redirects'))
  const client = url.startsWith('https') ? https : http
  client.get(url, {
    headers: {
      ...WEB_BROWSER_HEADERS,
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    },
  }, (response) => {
    const status = response.statusCode ?? 0
    if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
      response.resume()
      const redirect = new URL(response.headers.location, url).toString()
      void fetchWebPage(redirect, maxRedirects - 1).then(resolve, reject)
      return
    }
    if (status !== 200) {
      response.resume()
      reject(new Error(`Web search failed (${status})`))
      return
    }
    const chunks: Buffer[] = []
    response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  }).on('error', reject)
})

export type WebImageSearchResult = {
  imageUrl: string
  sourcePageUrl: string
  title?: string
  width?: number
  height?: number
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export async function searchBingWebImages(query: string, limit: number): Promise<WebImageSearchResult[]> {
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&scenario=ImageBasicHover`
  const html = await fetchWebPage(searchUrl)
  const results: WebImageSearchResult[] = []
  const anchorPattern = /<a\b[^>]*class="[^"]*\biusc\b[^"]*"[^>]*>/giu
  for (const anchor of html.match(anchorPattern) || []) {
    const metadataMatch = anchor.match(/\bm="([^"]+)"/iu)
    if (!metadataMatch) continue
    try {
      const metadata = JSON.parse(decodeHtmlAttribute(metadataMatch[1])) as Record<string, unknown>
      const imageUrl = typeof metadata.murl === 'string' ? metadata.murl : ''
      const sourcePageUrl = typeof metadata.purl === 'string' ? metadata.purl : ''
      if (!/^https?:\/\//i.test(imageUrl) || !/^https?:\/\//i.test(sourcePageUrl)) continue
      if (/\.svg(?:$|\?)/i.test(imageUrl)) continue
      results.push({
        imageUrl,
        sourcePageUrl,
        title: typeof metadata.t === 'string' ? metadata.t : undefined,
        width: Number.isFinite(Number(metadata.w)) ? Number(metadata.w) : undefined,
        height: Number.isFinite(Number(metadata.h)) ? Number(metadata.h) : undefined,
      })
      if (results.length >= limit) break
    } catch {
      // Ignore malformed search cards and continue scanning the page.
    }
  }
  return results
}

export type ImageHostUploadProvider = {
  name: string
  platform: string
  baseUrl?: string
  uploadPath?: string
  apiKeyParam?: string
  apiKeyHeader?: string
  apiKeyFormField?: string
  expirationParam?: string
  imageField?: string
  imagePayloadType?: 'base64' | 'file'
  nameField?: string
  staticFormFields?: Record<string, string>
  responseUrlField?: string
  responseDeleteUrlField?: string
}

export type ImageHostUploadOptions = {
  name?: string
  expiration?: number
}

export type ImageHostUploadRequest = {
  provider: ImageHostUploadProvider
  apiKey: string
  imageData: string
  options?: ImageHostUploadOptions
}

export type ImageHostUploadResponse = {
  success: boolean
  url?: string
  deleteUrl?: string
  error?: string
}

export function isHttpUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://')
}

function resolveImageHostUploadUrl(provider: ImageHostUploadProvider) {
  const uploadPath = (provider.uploadPath || '').trim()
  if (uploadPath && isHttpUrl(uploadPath)) {
    return uploadPath
  }
  const baseUrl = (provider.baseUrl || '').trim().replace(/\/*$/, '')
  if (!baseUrl && !uploadPath) return ''
  if (!baseUrl && uploadPath) return ''
  if (!uploadPath) return baseUrl
  const normalizedPath = uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`
  return `${baseUrl}${normalizedPath}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getByPath(obj: unknown, objectPath?: string): unknown {
  if (!isRecord(obj) || !objectPath) return undefined
  return objectPath.split('.').reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) return undefined
    return acc[key]
  }, obj)
}

function extractFirstHttpUrl(value: string): string | undefined {
  const match = value.match(/https?:\/\/[^\s"'<>]+/i)
  return match?.[0]
}

function getExtensionFromMimeType(mimeType?: string) {
  switch ((mimeType || '').toLowerCase()) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    case 'image/bmp':
      return 'bmp'
    case 'image/avif':
      return 'avif'
    case 'image/png':
    default:
      return 'png'
  }
}

export function getMimeTypeFromExtension(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  }
  return mimeTypes[extension] || 'image/png'
}

function parseDataUrl(dataUrl: string): { buffer: Buffer, mimeType: string } | null {
  const matches = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s)
  if (!matches) return null
  const mimeType = matches[1] || 'image/png'
  const buffer = Buffer.from(matches[2], 'base64')
  if (buffer.length === 0) return null
  return { buffer, mimeType }
}

export function resolveImageSourcePath(imagePath: string): string | null {
  const localImageMatch = imagePath.match(/^local-image:\/\/(.+)\/(.+)$/)
  if (localImageMatch) {
    const [, category, filename] = localImageMatch
    return path.join(getMediaRoot(), category, decodeURIComponent(filename))
  }

  if (imagePath.startsWith('file://')) {
    return imagePath.replace(/^file:\/\/\/?/, '')
  }

  if (path.isAbsolute(imagePath)) {
    return imagePath
  }

  return null
}

export async function fetchBuffer(url: string, timeoutMs: number = 45000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'image/*, */*;q=0.8',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.length === 0) {
      throw new Error('Fetched image is empty')
    }

    return {
      buffer,
      mimeType: response.headers.get('content-type') || 'image/png',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out (${Math.round(timeoutMs / 1000)}s)`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function readImageSource(imageData: string): Promise<{ buffer: Buffer, mimeType: string }> {
  if (isHttpUrl(imageData)) {
    return fetchBuffer(imageData)
  }

  const parsedDataUrl = parseDataUrl(imageData)
  if (parsedDataUrl) {
    return parsedDataUrl
  }

  const resolvedPath = resolveImageSourcePath(imageData)
  if (resolvedPath) {
    if (!fs.existsSync(resolvedPath)) {
      throw new Error('Local image does not exist')
    }
    const buffer = fs.readFileSync(resolvedPath)
    if (buffer.length === 0) {
      throw new Error('Local image file is empty')
    }
    return {
      buffer,
      mimeType: getMimeTypeFromExtension(resolvedPath),
    }
  }

  const rawBuffer = Buffer.from(imageData, 'base64')
  if (rawBuffer.length === 0) {
    throw new Error('Invalid image data')
  }
  return {
    buffer: rawBuffer,
    mimeType: 'image/png',
  }
}

async function toUploadFilePayload(imageData: string, name?: string) {
  const { buffer, mimeType } = await readImageSource(imageData)
  const baseName = (name || 'upload').trim() || 'upload'
  const hasExtension = /\.[a-z0-9]{2,8}$/i.test(baseName)
  const filename = hasExtension ? baseName : `${baseName}.${getExtensionFromMimeType(mimeType)}`
  return {
    blob: new Blob([new Uint8Array(buffer)], { type: mimeType }),
    filename,
    mimeType,
  }
}

async function toBase64Payload(imageData: string) {
  if (imageData.startsWith('data:')) {
    const parsed = parseDataUrl(imageData)
    if (!parsed) {
      throw new Error('Invalid image data')
    }
    return parsed.buffer.toString('base64')
  }

  if (isHttpUrl(imageData) || imageData.startsWith('local-image://') || imageData.startsWith('file://') || path.isAbsolute(imageData)) {
    const { buffer } = await readImageSource(imageData)
    return buffer.toString('base64')
  }

  return imageData
}

export async function uploadImageHostFromMain({
  provider,
  apiKey,
  imageData,
  options,
}: ImageHostUploadRequest): Promise<ImageHostUploadResponse> {
  try {
    const uploadUrl = resolveImageHostUploadUrl(provider)
    if (!uploadUrl) {
      return { success: false, error: 'Image host upload URL is not configured' }
    }

    const fieldName = provider.imageField || 'image'
    const nameField = provider.nameField || 'name'
    const payloadType = provider.imagePayloadType || 'base64'
    const staticFormFields = provider.staticFormFields || {}

    const formData = new FormData()
    Object.entries(staticFormFields).forEach(([key, value]) => {
      formData.append(key, value)
    })
    if (provider.apiKeyFormField && apiKey) {
      formData.append(provider.apiKeyFormField, apiKey)
    }

    if (payloadType === 'file') {
      const { blob, filename } = await toUploadFilePayload(imageData, options?.name)
      formData.append(fieldName, blob, filename)
    } else {
      const base64Data = await toBase64Payload(imageData)
      formData.append(fieldName, base64Data)
    }

    if (options?.name) {
      formData.append(nameField, options.name)
    }

    const url = new URL(uploadUrl)
    if (provider.apiKeyParam && apiKey) {
      url.searchParams.set(provider.apiKeyParam, apiKey)
    }
    if (provider.expirationParam && options?.expiration) {
      url.searchParams.set(provider.expirationParam, String(options.expiration))
    }

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    }
    if (provider.apiKeyHeader && apiKey) {
      headers[provider.apiKeyHeader] = apiKey
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      })

      const text = await response.text()
      let data: unknown = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }

      if (!response.ok) {
        const errorMessage = getByPath(data, 'error.message')
        const messageField = getByPath(data, 'message')
        const message = typeof errorMessage === 'string'
          ? errorMessage
          : typeof messageField === 'string'
            ? messageField
            : text || `Upload failed: ${response.status}`
        return { success: false, error: message }
      }

      const urlField = getByPath(data, provider.responseUrlField || 'url')
      const deleteField = getByPath(data, provider.responseDeleteUrlField || 'delete_url')
      const trimmedText = text.trim()
      const extractedTextUrl = extractFirstHttpUrl(trimmedText)

      if (urlField) {
        return {
          success: true,
          url: typeof urlField === 'string' ? urlField : String(urlField),
          deleteUrl: deleteField ? (typeof deleteField === 'string' ? deleteField : String(deleteField)) : undefined,
        }
      }

      if (extractedTextUrl) {
        return { success: true, url: extractedTextUrl }
      }

      console.warn('[ImageHost/Main] Upload succeeded but no URL was detected in the response', {
        provider: provider.name,
        platform: provider.platform,
        responsePreview: trimmedText.substring(0, 200),
      })
      return { success: false, error: `Image host ${provider.name} succeeded but returned no URL` }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Upload timed out. Please try again.' }
      }
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}
