import { app, dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import {
  clearCache,
  copyDir,
  ensureDir,
  getCacheDirs,
  getDirectorySize,
  getMediaRoot,
  getProjectDataRoot,
  getStorageBasePath,
  normalizePath,
  pathsConflict,
  removeDir,
  scheduleAutoClean,
  setStorageBasePath,
  updateStorageConfig,
} from '../storage-paths'

/** Settings-screen operations over the data directory: relocate, export, import, cache. */
export function registerStorageManagerIpc() {
  ipcMain.handle('storage-get-paths', async () => {
    return {
      basePath: getStorageBasePath(),
      projectPath: getProjectDataRoot(),
      mediaPath: getMediaRoot(),
      cachePath: path.join(app.getPath('userData'), 'Cache'),
    }
  })

  ipcMain.handle('storage-select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('export-write-files', async (_event, payload: { baseDir: string; files: Array<{ relativePath: string; data: ArrayBuffer | Uint8Array; text?: never } | { relativePath: string; text: string; data?: never }> }) => {
    try {
      const baseDir = normalizePath(payload.baseDir)
      await fs.promises.mkdir(baseDir, { recursive: true })

      for (const file of payload.files) {
        const targetPath = path.resolve(baseDir, file.relativePath)
        if (!targetPath.startsWith(baseDir + path.sep) && targetPath !== baseDir) {
          throw new Error(`Invalid export path: ${file.relativePath}`)
        }

        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
        if (typeof file.text === 'string') {
          await fs.promises.writeFile(targetPath, file.text, 'utf8')
        } else {
          const data = file.data instanceof ArrayBuffer ? new Uint8Array(file.data) : file.data
          await fs.promises.writeFile(targetPath, data)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[Export] Failed to write files:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Validate if a directory contains valid data (projects/ subfolder with .json files or _p/ dirs)
  ipcMain.handle('storage-validate-data-dir', async (_event, dirPath: string) => {
    try {
      if (!dirPath) return { valid: false, error: 'Path is required' }
      const target = normalizePath(dirPath)
      if (!fs.existsSync(target)) return { valid: false, error: 'Directory does not exist' }

      // Check for projects/ subfolder with .json files or _p/ per-project dirs
      const projectsDir = path.join(target, 'projects')
      const mediaDir = path.join(target, 'media')

      let projectCount = 0
      let mediaCount = 0

      if (fs.existsSync(projectsDir)) {
        const files = await fs.promises.readdir(projectsDir)
        // Count root .json files (global stores)
        projectCount = files.filter(f => f.endsWith('.json')).length
        // Also count per-project directories under _p/
        const perProjectDir = path.join(projectsDir, '_p')
        if (fs.existsSync(perProjectDir)) {
          const projectDirs = await fs.promises.readdir(perProjectDir, { withFileTypes: true })
          const dirCount = projectDirs.filter(d => d.isDirectory() && !d.name.startsWith('.')).length
          if (dirCount > 0) projectCount = Math.max(projectCount, dirCount)
        }
      }

      if (fs.existsSync(mediaDir)) {
        const entries = await fs.promises.readdir(mediaDir)
        mediaCount = entries.length
      }

      if (projectCount === 0 && mediaCount === 0) {
        return { valid: false, error: 'This directory does not contain valid data (expected projects/ or media/)' }
      }

      return { valid: true, projectCount, mediaCount }
    } catch (error) {
      return { valid: false, error: String(error) }
    }
  })

  // Link to existing data directory (no data movement)
  ipcMain.handle('storage-link-data', async (_event, dirPath: string) => {
    try {
      if (!dirPath) return { success: false, error: 'Path is required' }
      const target = normalizePath(dirPath)
      if (!fs.existsSync(target)) return { success: false, error: 'Directory does not exist' }

      // Validate it has data
      const projectsDir = path.join(target, 'projects')
      const mediaDir = path.join(target, 'media')

      const hasProjects = fs.existsSync(projectsDir)
      const hasMedia = fs.existsSync(mediaDir)

      if (!hasProjects && !hasMedia) {
        return { success: false, error: 'This directory does not contain valid data (expected projects/ or media/)' }
      }

      // Update config to point to this directory
      setStorageBasePath(target)
      return { success: true, path: target }
    } catch (error) {
      console.error('Failed to link data:', error)
      return { success: false, error: String(error) }
    }
  })

  // Move all data to new location (single operation)
  ipcMain.handle('storage-move-data', async (_event, newPath: string) => {
    try {
      if (!newPath) return { success: false, error: 'Path is required' }
      const target = normalizePath(newPath)
      const currentBase = getStorageBasePath()

      if (currentBase === target) return { success: true, path: currentBase }

      // Check for path conflicts
      const conflictError = pathsConflict(currentBase, target)
      if (conflictError) {
        return { success: false, error: conflictError }
      }

      // Ensure target directories exist
      const targetProjectsDir = path.join(target, 'projects')
      const targetMediaDir = path.join(target, 'media')
      ensureDir(targetProjectsDir)
      ensureDir(targetMediaDir)

      // Move projects
      const currentProjectsDir = getProjectDataRoot()
      if (fs.existsSync(currentProjectsDir)) {
        const files = await fs.promises.readdir(currentProjectsDir)
        for (const file of files) {
          const src = path.join(currentProjectsDir, file)
          const dest = path.join(targetProjectsDir, file)
          await fs.promises.cp(src, dest, { recursive: true, force: true })
        }
      }

      // Move media
      const currentMediaDir = getMediaRoot()
      if (fs.existsSync(currentMediaDir)) {
        const files = await fs.promises.readdir(currentMediaDir)
        for (const file of files) {
          const src = path.join(currentMediaDir, file)
          const dest = path.join(targetMediaDir, file)
          await fs.promises.cp(src, dest, { recursive: true, force: true })
        }
      }

      // Update config
      setStorageBasePath(target)

      // Clean up old directories (only if different from userData)
      const userData = app.getPath('userData')
      if (!currentProjectsDir.startsWith(userData)) {
        await removeDir(currentProjectsDir).catch(() => { })
      }
      if (!currentMediaDir.startsWith(userData)) {
        await removeDir(currentMediaDir).catch(() => { })
      }

      return { success: true, path: target }
    } catch (error) {
      console.error('Failed to move data:', error)
      return { success: false, error: String(error) }
    }
  })

  // Export all data
  ipcMain.handle('storage-export-data', async (_event, targetPath: string) => {
    try {
      if (!targetPath) return { success: false, error: 'Path is required' }
      const exportDir = path.join(
        normalizePath(targetPath),
        `longdd-data-${new Date().toISOString().replace(/[:.]/g, '-')}`
      )

      // Create export structure
      const exportProjectsDir = path.join(exportDir, 'projects')
      const exportMediaDir = path.join(exportDir, 'media')
      ensureDir(exportProjectsDir)
      ensureDir(exportMediaDir)

      // Copy projects
      await copyDir(getProjectDataRoot(), exportProjectsDir)
      // Copy media
      await copyDir(getMediaRoot(), exportMediaDir)

      return { success: true, path: exportDir }
    } catch (error) {
      console.error('Failed to export data:', error)
      return { success: false, error: String(error) }
    }
  })

  // Import all data (with backup for safety)
  ipcMain.handle('storage-import-data', async (_event, sourcePath: string) => {
    try {
      if (!sourcePath) return { success: false, error: 'Path is required' }
      const source = normalizePath(sourcePath)

      const sourceProjectsDir = path.join(source, 'projects')
      const sourceMediaDir = path.join(source, 'media')

      // Validate source has data
      const hasProjects = fs.existsSync(sourceProjectsDir)
      const hasMedia = fs.existsSync(sourceMediaDir)
      if (!hasProjects && !hasMedia) {
        return { success: false, error: 'Source directory does not contain valid data (expected projects/ or media/)' }
      }

      // Create temporary backup for rollback
      const backupDir = path.join(os.tmpdir(), `longdd-backup-${Date.now()}`)
      const currentProjectsDir = getProjectDataRoot()
      const currentMediaDir = getMediaRoot()

      try {
        // Backup existing data
        if (hasProjects && fs.existsSync(currentProjectsDir)) {
          const files = await fs.promises.readdir(currentProjectsDir)
          if (files.length > 0) {
            await copyDir(currentProjectsDir, path.join(backupDir, 'projects'))
          }
        }
        if (hasMedia && fs.existsSync(currentMediaDir)) {
          const files = await fs.promises.readdir(currentMediaDir)
          if (files.length > 0) {
            await copyDir(currentMediaDir, path.join(backupDir, 'media'))
          }
        }

        // Import new data
        if (hasProjects) {
          await removeDir(currentProjectsDir).catch(() => { })
          await copyDir(sourceProjectsDir, currentProjectsDir)
        }
        if (hasMedia) {
          await removeDir(currentMediaDir).catch(() => { })
          await copyDir(sourceMediaDir, currentMediaDir)
        }

        // Clear migration flag so migration re-evaluates imported data on next startup
        const migrationFlagPath = path.join(currentProjectsDir, '_p', '_migrated.json')
        if (fs.existsSync(migrationFlagPath)) {
          fs.unlinkSync(migrationFlagPath)
          console.log('Cleared migration flag for re-evaluation after import')
        }

        // Success - clean up backup
        await removeDir(backupDir).catch(() => { })
        return { success: true }
      } catch (importError) {
        // Rollback: restore from backup
        console.error('Import failed, rolling back:', importError)
        const backupProjectsDir = path.join(backupDir, 'projects')
        const backupMediaDir = path.join(backupDir, 'media')

        if (fs.existsSync(backupProjectsDir)) {
          await removeDir(currentProjectsDir).catch(() => { })
          await copyDir(backupProjectsDir, currentProjectsDir).catch(() => { })
        }
        if (fs.existsSync(backupMediaDir)) {
          await removeDir(currentMediaDir).catch(() => { })
          await copyDir(backupMediaDir, currentMediaDir).catch(() => { })
        }
        await removeDir(backupDir).catch(() => { })

        throw importError
      }
    } catch (error) {
      console.error('Failed to import data:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('storage-get-cache-size', async () => {
    const dirs = getCacheDirs()
    const details = await Promise.all(
      dirs.map(async (dirPath) => ({
        path: dirPath,
        size: await getDirectorySize(dirPath),
      }))
    )
    const total = details.reduce((sum, item) => sum + item.size, 0)
    return { total, details }
  })

  ipcMain.handle('storage-clear-cache', async (_event, options?: { olderThanDays?: number }) => {
    try {
      const clearedBytes = await clearCache(options?.olderThanDays)
      return { success: true, clearedBytes }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('storage-update-config', async (_event, config: { autoCleanEnabled?: boolean; autoCleanDays?: number }) => {
    updateStorageConfig(config)
    scheduleAutoClean()
    return true
  })
}
