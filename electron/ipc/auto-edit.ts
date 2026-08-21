import { app, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { getMediaRoot } from '../storage-paths'

/**
 * Auto Edit desktop integration: file pickers, the save dialog used to export
 * generated media, and the project files under Documents/Logdd.
 *
 * Picked files are handed to the renderer as `auto-edit-media://<token>` URLs
 * rather than raw paths, so the renderer never needs filesystem access; the
 * protocol handler resolves tokens back through `getAutoEditMediaPath`.
 */

const autoEditMediaTokens = new Map<string, string>()

export function getAutoEditMediaPath(token: string): string | undefined {
  return autoEditMediaTokens.get(token)
}

function registerAutoEditMedia(filePath: string): string {
  const token = crypto.randomUUID()
  autoEditMediaTokens.set(token, path.resolve(filePath))
  return `auto-edit-media://${token}`
}

function autoEditProjectsDir(): string {
  const dir = path.join(app.getPath('documents'), 'Logdd', 'AutoEdit Projects')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function registerFileExportIpc() {
  ipcMain.handle('save-file-dialog', async (_event, { localPath, defaultPath, filters }: { localPath: string, defaultPath: string, filters: { name: string, extensions: string[] }[] }) => {
    try {
      // Resolve the source file path
      let sourcePath: string | null = null

      // Handle local-image:// and local-video:// protocols
      const imageMatch = localPath.match(/^local-image:\/\/(.+)\/(.+)$/)
      const videoMatch = localPath.match(/^local-video:\/\/(.+)\/(.+)$/)

      if (imageMatch) {
        const [, category, filename] = imageMatch
        sourcePath = path.join(getMediaRoot(), category, decodeURIComponent(filename))
      } else if (videoMatch) {
        const [, category, filename] = videoMatch
        sourcePath = path.join(getMediaRoot(), category, decodeURIComponent(filename))
      } else if (localPath.startsWith('file://')) {
        sourcePath = localPath.replace('file://', '')
      } else {
        sourcePath = localPath
      }

      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source file not found' }
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: filters,
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // Copy file to destination
      fs.copyFileSync(sourcePath, result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Failed to save file:', error)
      return { success: false, error: String(error) }
    }
  })
}

export function registerAutoEditIpc() {
  ipcMain.handle('auto-edit-pick-media', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn video hoặc audio để Auto Edit',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'm4a', 'aac', 'png', 'jpg', 'jpeg', 'webp'] },
        { name: 'All files', extensions: ['*'] },
      ],
    })
    if (result.canceled) return { canceled: true, files: [] }
    const files = result.filePaths.map((filePath) => {
      const previewUrl = registerAutoEditMedia(filePath)
      const extension = path.extname(filePath).toLowerCase()
      const kind = ['.mp3', '.wav', '.m4a', '.aac'].includes(extension)
        ? 'audio'
        : ['.png', '.jpg', '.jpeg', '.webp'].includes(extension) ? 'image' : 'video'
      return { path: filePath, name: path.basename(filePath), previewUrl, kind }
    })
    return { canceled: false, files }
  })

  ipcMain.handle('auto-edit-pick-json', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Nhập Auto Edit JSON / CSV', properties: ['openFile'],
      filters: [
        { name: 'JSON / CSV', extensions: ['json', 'csv', 'tsv'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv', 'tsv'] },
      ],
    })
    if (result.canceled || !result.filePaths[0]) return { canceled: true }
    const filePath = result.filePaths[0]
    return { canceled: false, filePath, content: await fs.promises.readFile(filePath, 'utf8') }
  })

  ipcMain.handle('auto-edit-register-media-paths', async (_event, paths: string[]) => {
    const result: Record<string, string> = {}
    for (const candidate of paths.slice(0, 2000)) {
      if (typeof candidate !== 'string' || !candidate.trim()) continue
      const resolved = path.resolve(candidate)
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) continue
      result[candidate] = registerAutoEditMedia(resolved)
    }
    return result
  })

  ipcMain.handle('auto-edit-save-text', async (_event, payload: { content: string; defaultName: string; extension: string }) => {
    const extension = payload.extension.replace(/[^a-z0-9]/gi, '') || 'txt'
    const result = await dialog.showSaveDialog({
      title: 'Xuất timeline',
      defaultPath: payload.defaultName,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }
    await fs.promises.writeFile(result.filePath, payload.content, 'utf8')
    return { success: true, filePath: result.filePath }
  })
}

/* ------------------------------------------------------------------ */
/* Auto Edit project dashboard (documents/Logdd/AutoEdit Projects)     */
/* ------------------------------------------------------------------ */

export function registerAutoEditProjectsIpc() {
  ipcMain.handle('auto-edit-projects-list', async () => {
    const dir = autoEditProjectsDir()
    let entries: import('node:fs').Dirent[] = []
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true })
    } catch {
      return { success: true, projects: [] }
    }
    const projects: Array<{ id: string; name: string; filePath: string; updatedAt: number; durationMs: number }> = []
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      const filePath = path.join(dir, entry.name)
      try {
        const stat = await fs.promises.stat(filePath)
        const raw = await fs.promises.readFile(filePath, 'utf8')
        const parsed = JSON.parse(raw) as { metadata?: { name?: unknown; duration?: unknown } }
        const id = entry.name.replace(/\.json$/, '')
        const name = typeof parsed?.metadata?.name === 'string' && parsed.metadata.name.trim()
          ? parsed.metadata.name
          : id
        const durationMs = typeof parsed?.metadata?.duration === 'number' ? parsed.metadata.duration : 0
        projects.push({ id, name, filePath, updatedAt: stat.mtimeMs, durationMs })
      } catch {
        // Skip unreadable/corrupt project files.
      }
    }
    projects.sort((a, b) => b.updatedAt - a.updatedAt)
    return { success: true, projects }
  })

  ipcMain.handle('auto-edit-project-save', async (_event, payload: { id: string; content: string }) => {
    try {
      const dir = autoEditProjectsDir()
      const safeId = payload.id.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project'
      const filePath = path.join(dir, `${safeId}.json`)
      await fs.promises.writeFile(filePath, payload.content, 'utf8')
      return { success: true, filePath }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('auto-edit-project-load', async (_event, filePath: string) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('auto-edit-project-delete', async (_event, filePath: string) => {
    try {
      await fs.promises.unlink(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('auto-edit-project-rename', async (_event, payload: { filePath: string; name: string }) => {
    try {
      const name = payload.name.trim()
      if (!name) return { success: false, error: 'Empty name' }
      const raw = await fs.promises.readFile(payload.filePath, 'utf8')
      const parsed = JSON.parse(raw) as { metadata?: { name?: string; updatedAt?: number } }
      if (parsed && typeof parsed === 'object' && parsed.metadata) {
        parsed.metadata.name = name
        parsed.metadata.updatedAt = Date.now()
      }
      await fs.promises.writeFile(payload.filePath, JSON.stringify(parsed, null, 2), 'utf8')
      return { success: true, name }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('auto-edit-project-reveal', async (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) shell.showItemInFolder(filePath)
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}
