import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Single source of truth for where user data lives on disk, plus the cache
 * maintenance that runs against it. Every other main-process module resolves
 * paths through here instead of joining `userData` itself.
 */

export type StorageConfig = {
  // Single base path for all data (projects + media)
  basePath?: string
  // Legacy fields (for migration)
  projectPath?: string
  mediaPath?: string
  autoCleanEnabled?: boolean
  autoCleanDays?: number
}

const DEFAULT_STORAGE_CONFIG: Required<StorageConfig> = {
  basePath: '',
  projectPath: '',
  mediaPath: '',
  autoCleanEnabled: false,
  autoCleanDays: 30,
}

const storageConfigPath = path.join(app.getPath('userData'), 'storage-config.json')
let autoCleanInterval: NodeJS.Timeout | null = null

function loadStorageConfig(): StorageConfig {
  try {
    if (fs.existsSync(storageConfigPath)) {
      const raw = fs.readFileSync(storageConfigPath, 'utf-8')
      const parsed = JSON.parse(raw) as StorageConfig
      return { ...DEFAULT_STORAGE_CONFIG, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load storage config:', error)
  }
  return { ...DEFAULT_STORAGE_CONFIG }
}

let storageConfig: StorageConfig = loadStorageConfig()

export function saveStorageConfig() {
  try {
    fs.writeFileSync(storageConfigPath, JSON.stringify(storageConfig, null, 2), 'utf-8')
  } catch (error) {
    console.warn('Failed to save storage config:', error)
  }
}

/** Repoints all data at `basePath` and drops the legacy split project/media paths. */
export function setStorageBasePath(basePath: string) {
  storageConfig.basePath = basePath
  storageConfig.projectPath = ''
  storageConfig.mediaPath = ''
  saveStorageConfig()
}

export function updateStorageConfig(patch: Pick<StorageConfig, 'autoCleanEnabled' | 'autoCleanDays'>) {
  storageConfig = { ...storageConfig, ...patch }
  saveStorageConfig()
}

export function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function normalizePath(inputPath: string) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(inputPath)
}

// Check if childPath is inside parentPath (subdirectory)
function isSubdirectory(parentPath: string, childPath: string): boolean {
  const normalizedParent = path.resolve(parentPath).toLowerCase() + path.sep
  const normalizedChild = path.resolve(childPath).toLowerCase() + path.sep
  return normalizedChild.startsWith(normalizedParent)
}

// Check if two paths are the same or one contains the other
export function pathsConflict(source: string, dest: string): string | null {
  const normalizedSource = path.resolve(source).toLowerCase()
  const normalizedDest = path.resolve(dest).toLowerCase()

  if (normalizedSource === normalizedDest) {
    return null // Same path is OK, handled elsewhere
  }
  if (isSubdirectory(source, dest)) {
    return 'The target path cannot be inside the current path'
  }
  if (isSubdirectory(dest, source)) {
    return 'The current path cannot be inside the target path'
  }
  return null
}

// Get the base storage path (contains both projects and media)
export function getStorageBasePath() {
  // Check new basePath first, then fall back to legacy projectPath parent
  const configured = storageConfig.basePath?.trim()
  if (configured) {
    return normalizePath(configured)
  }
  // Legacy migration: if projectPath exists, use its parent
  const legacyProject = storageConfig.projectPath?.trim()
  if (legacyProject) {
    return path.dirname(normalizePath(legacyProject))
  }
  return app.getPath('userData')
}

export function getProjectDataRoot() {
  const base = path.join(getStorageBasePath(), 'projects')
  ensureDir(base)
  return base
}

export function getMediaRoot() {
  const base = path.join(getStorageBasePath(), 'media')
  ensureDir(base)
  return base
}

export function getCacheDirs() {
  const userData = app.getPath('userData')
  return [
    path.join(userData, 'Cache'),
    path.join(userData, 'Code Cache'),
    path.join(userData, 'GPUCache'),
  ]
}

export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    let total = 0
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += await getDirectorySize(fullPath)
      } else {
        const stat = await fs.promises.stat(fullPath)
        total += stat.size
      }
    }
    return total
  } catch {
    return 0
  }
}

export async function copyDir(source: string, destination: string) {
  ensureDir(destination)
  await fs.promises.cp(source, destination, { recursive: true, force: true })
}

export async function removeDir(dirPath: string) {
  await fs.promises.rm(dirPath, { recursive: true, force: true })
}

async function deleteOldFiles(dirPath: string, cutoffTime: number): Promise<number> {
  let cleared = 0
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        cleared += await deleteOldFiles(fullPath, cutoffTime)
        const remaining = await fs.promises.readdir(fullPath)
        if (remaining.length === 0) {
          await fs.promises.rmdir(fullPath).catch(() => { })
        }
      } else {
        const stat = await fs.promises.stat(fullPath)
        if (stat.mtimeMs < cutoffTime) {
          await fs.promises.unlink(fullPath).catch(() => { })
          cleared += stat.size
        }
      }
    }
  } catch {
    // ignore
  }
  return cleared
}

export async function clearCache(olderThanDays?: number): Promise<number> {
  const dirs = getCacheDirs()
  let cleared = 0
  if (olderThanDays && olderThanDays > 0) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    for (const dir of dirs) {
      cleared += await deleteOldFiles(dir, cutoff)
    }
    return cleared
  }
  for (const dir of dirs) {
    cleared += await getDirectorySize(dir)
    await removeDir(dir).catch(() => { })
    ensureDir(dir)
  }
  return cleared
}

export function scheduleAutoClean() {
  if (autoCleanInterval) {
    clearInterval(autoCleanInterval)
    autoCleanInterval = null
  }
  if (storageConfig.autoCleanEnabled) {
    const days = storageConfig.autoCleanDays || DEFAULT_STORAGE_CONFIG.autoCleanDays
    clearCache(days).catch(() => { })
    autoCleanInterval = setInterval(() => {
      clearCache(days).catch(() => { })
    }, 24 * 60 * 60 * 1000)
  }
}

// Get user data path for storing images
export const getImagesDir = (subDir: string) => {
  const imagesDir = path.join(getMediaRoot(), subDir)
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }
  return imagesDir
}
