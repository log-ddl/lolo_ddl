import path from 'node:path'
import fs from 'node:fs'
import { Readable } from 'node:stream'

/**
 * Streamed file responses for the app's custom media protocols. Kept free of
 * Electron imports so the range handling can be exercised on its own.
 */

const MEDIA_MIME_TYPES: Record<string, string> = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
}

/**
 * Serve a file as a streamed response with byte-range support.
 *
 * Media files here reach tens of MB, so the body is piped from disk instead of
 * being read into a Buffer on the main process: a synchronous whole-file read
 * blocks every other protocol request and IPC call, and `<video>` seeking
 * re-requests the resource, which without `Accept-Ranges` means re-sending the
 * whole file from byte 0 each time.
 */
export async function serveFile(filePath: string, request: Request): Promise<Response> {
  const stats = await fs.promises.stat(filePath)
  if (!stats.isFile()) return new Response('Not a file', { status: 404 })

  const mimeType = MEDIA_MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  const size = stats.size
  const commonHeaders = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    // Generated media is never rewritten in place (each render writes a new
    // filename), so the renderer may reuse what it already has.
    'Cache-Control': 'private, max-age=3600',
  }

  const range = request.headers.get('range')
  const match = range ? /^bytes=(\d*)-(\d*)$/i.exec(range.trim()) : null
  if (range && !match) {
    return new Response(null, { status: 416, headers: { ...commonHeaders, 'Content-Range': `bytes */${size}` } })
  }

  let start = 0
  let end = size - 1
  if (match) {
    // Suffix form ("bytes=-500") asks for the last N bytes.
    if (!match[1] && match[2]) start = Math.max(0, size - Number(match[2]))
    else {
      start = match[1] ? Number(match[1]) : 0
      if (match[2]) end = Math.min(Number(match[2]), size - 1)
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...commonHeaders, 'Content-Range': `bytes */${size}` } })
    }
  }

  // An empty file has no valid byte range to stream.
  if (size === 0) return new Response(null, { headers: { ...commonHeaders, 'Content-Length': '0' } })

  const stream = fs.createReadStream(filePath, { start, end })
  const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>
  const length = end - start + 1
  if (match) {
    return new Response(body, {
      status: 206,
      headers: { ...commonHeaders, 'Content-Length': String(length), 'Content-Range': `bytes ${start}-${end}/${size}` },
    })
  }
  return new Response(body, { headers: { ...commonHeaders, 'Content-Length': String(length) } })
}
