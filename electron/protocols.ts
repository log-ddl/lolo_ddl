import { app, net, protocol } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { getMediaRoot } from './storage-paths'
import { getAutoEditMediaPath } from './ipc/auto-edit'
import { serveFile } from './media-file-response'

/**
 * Custom schemes the renderer loads media through. `registerPrivilegedSchemes`
 * must run before the app is ready; `registerAppProtocols` after.
 */

export function registerPrivilegedSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'local-image',
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    },
    {
      scheme: 'local-tts',
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    },
    {
      scheme: 'auto-edit-media',
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    },
  ])
}

function handleAutoEditMedia() {
  protocol.handle('auto-edit-media', async (request) => {
    try {
      const token = new URL(request.url).hostname
      const filePath = getAutoEditMediaPath(token)
      if (!filePath || !fs.existsSync(filePath)) return new Response('Media not found', { status: 404 })
      return net.fetch(pathToFileURL(filePath).toString())
    } catch {
      return new Response('Media not found', { status: 404 })
    }
  })
}

function handleLocalTts() {
  protocol.handle('local-tts', async (request) => {
    try {
      const url = new URL(request.url)
      const filename = path.basename(decodeURIComponent(url.pathname.slice(1)))
      const extension = path.extname(filename).toLowerCase()
      const audioMimeTypes: Record<string, string> = {
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
      }
      if (!audioMimeTypes[extension]) return new Response('Unsupported audio', { status: 415 })
      const outputDir = path.resolve(app.getPath('userData'), 'tts', 'outputs')
      const filePath = path.resolve(outputDir, filename)
      if (!filePath.startsWith(`${outputDir}${path.sep}`)) return new Response('Invalid path', { status: 400 })
      const data = fs.readFileSync(filePath)
      const range = request.headers.get('range')
      const commonHeaders = {
        'Accept-Ranges': 'bytes',
        'Content-Type': audioMimeTypes[extension],
      }
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim())
        const start = match?.[1] ? Number(match[1]) : 0
        const requestedEnd = match?.[2] ? Number(match[2]) : data.length - 1
        const end = Math.min(requestedEnd, data.length - 1)
        if (!match || !Number.isSafeInteger(start) || start < 0 || start > end) {
          return new Response(null, {
            status: 416,
            headers: { ...commonHeaders, 'Content-Range': `bytes */${data.length}` },
          })
        }
        const chunk = data.subarray(start, end + 1)
        return new Response(chunk, {
          status: 206,
          headers: {
            ...commonHeaders,
            'Content-Length': String(chunk.length),
            'Content-Range': `bytes ${start}-${end}/${data.length}`,
          },
        })
      }
      return new Response(data, {
        headers: { ...commonHeaders, 'Content-Length': String(data.length) },
      })
    } catch {
      return new Response('Audio not found', { status: 404 })
    }
  })
}

function handleLocalImage() {
  protocol.handle('local-image', async (request) => {
    try {
      // URL format: local-image://category/filename
      const url = new URL(request.url)
      const category = url.hostname
      const filename = decodeURIComponent(url.pathname.slice(1)) // Remove leading / and decode
      const mediaRoot = getMediaRoot()
      const filePath = path.resolve(mediaRoot, category, filename)
      if (!filePath.startsWith(path.resolve(mediaRoot) + path.sep)) {
        return new Response('Invalid path', { status: 400 })
      }

      return await serveFile(filePath, request)
    } catch (error) {
      console.error('Failed to load local image:', error)
      return new Response('Image not found', { status: 404 })
    }
  })
}

export function registerAppProtocols() {
  handleAutoEditMedia()
  handleLocalTts()
  handleLocalImage()
}
