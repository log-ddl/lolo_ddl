import { ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { getImagesDir, getMediaRoot } from '../storage-paths'
import {
  downloadImage,
  fetchBuffer,
  isHttpUrl,
  resolveImageSourcePath,
  searchBingWebImages,
  uploadImageHostFromMain,
  type ImageHostUploadRequest,
} from '../image-service'

/** Parses `local-image://category/filename` into its two segments. */
function parseLocalImageUrl(localPath: string): { category: string, filename: string } | null {
  const match = localPath.match(/^local-image:\/\/(.+)\/(.+)$/)
  if (!match) return null
  return { category: match[1], filename: match[2] }
}

export function registerImageIpc() {
  ipcMain.handle('search-web-images', async (_event, payload: { query?: unknown; limit?: unknown }) => {
    const query = typeof payload?.query === 'string' ? payload.query.trim().slice(0, 180) : ''
    if (!query) return []
    const limit = Math.min(30, Math.max(1, Number(payload?.limit) || 12))
    try {
      return await searchBingWebImages(query, limit)
    } catch (error) {
      console.warn('[WebImageSearch] Bing search failed:', error)
      return []
    }
  })

  ipcMain.handle('save-image', async (_event, { url, category, filename, sourcePageUrl }) => {
    try {
      const imagesDir = getImagesDir(category)
      const ext = path.extname(filename) || '.png'
      const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
      const filePath = path.join(imagesDir, safeName)

      // For data URLs, decode the base64 payload directly and write the file.
      if (url.startsWith('data:')) {
        const matches = url.match(/^data:[^;]+;base64,(.+)$/s)
        if (!matches) {
          return { success: false, error: 'Invalid data URL format' }
        }
        const buffer = Buffer.from(matches[1], 'base64')
        if (buffer.length === 0) {
          return { success: false, error: 'Decoded base64 data is empty (0 bytes)' }
        }
        fs.writeFileSync(filePath, buffer)
      } else {
        const sourcePath = resolveImageSourcePath(url)
        if (sourcePath) {
          if (!fs.existsSync(sourcePath)) {
            return { success: false, error: 'Source image file not found' }
          }
          fs.copyFileSync(sourcePath, filePath)
        } else {
          await downloadImage(url, filePath, 5, typeof sourcePageUrl === 'string' ? sourcePageUrl : undefined)
        }
      }

      // Validate file was written successfully with non-zero size
      const stat = fs.statSync(filePath)
      if (stat.size === 0) {
        fs.unlinkSync(filePath) // Clean up empty file
        return { success: false, error: 'Saved file is 0 bytes' }
      }

      // Return local path that can be used in the app
      return { success: true, localPath: `local-image://${category}/${safeName}` }
    } catch (error) {
      console.error('Failed to save image:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('get-image-path', async (_event, localPath: string) => {
    // Convert local-image://category/filename to actual file path
    const parsed = parseLocalImageUrl(localPath)
    if (!parsed) return null

    const filePath = path.join(getMediaRoot(), parsed.category, parsed.filename)

    if (fs.existsSync(filePath)) {
      // Windows example: file:///H:/path/to/file.png (triple slash + forward slashes).
      return `file:///${filePath.replace(/\\/g, '/')}`
    }
    return null
  })

  ipcMain.handle('delete-image', async (_event, localPath: string) => {
    const parsed = parseLocalImageUrl(localPath)
    if (!parsed) return false

    const filePath = path.join(getMediaRoot(), parsed.category, parsed.filename)

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return true
    } catch {
      return false
    }
  })

  // Read local image as base64 (for AI API calls)
  ipcMain.handle('read-image-base64', async (_event, localPath: string) => {
    try {
      if (isHttpUrl(localPath)) {
        const { buffer, mimeType } = await fetchBuffer(localPath)
        const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
        return { success: true, base64, mimeType, size: buffer.length }
      }

      let filePath: string

      // Handle local-image:// protocol
      const parsed = parseLocalImageUrl(localPath)
      if (parsed) {
        filePath = path.join(getMediaRoot(), parsed.category, decodeURIComponent(parsed.filename))
      } else if (localPath.startsWith('file://')) {
        filePath = localPath.replace('file://', '')
      } else {
        filePath = localPath
      }

      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' }
      }

      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
      }
      const mimeType = mimeTypes[ext] || 'image/png'
      const base64 = `data:${mimeType};base64,${data.toString('base64')}`

      return { success: true, base64, mimeType, size: data.length }
    } catch (error) {
      console.error('Failed to read image:', error)
      return { success: false, error: String(error) }
    }
  })

  // Get absolute file path for a local-image:// URL
  ipcMain.handle('get-absolute-path', async (_event, localPath: string) => {
    const parsed = parseLocalImageUrl(localPath)
    if (!parsed) return null

    const filePath = path.join(getMediaRoot(), parsed.category, decodeURIComponent(parsed.filename))

    if (fs.existsSync(filePath)) {
      return filePath
    }
    return null
  })

  ipcMain.handle('image-host-upload', async (_event, payload: ImageHostUploadRequest) => {
    return uploadImageHostFromMain(payload)
  })
}
