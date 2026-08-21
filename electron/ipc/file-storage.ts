import { ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { ensureDir, getProjectDataRoot } from '../storage-paths'

/**
 * Key/value store the renderer persists its zustand slices into, one JSON file
 * per key under the project data root.
 */

const getDataDir = () => {
  const dataDir = getProjectDataRoot()
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return dataDir
}

/**
 * Hàng đợi ghi theo từng khoá.
 *
 * Ghi bất đồng bộ nên hai lượt ghi cùng khoá có thể đan vào nhau; nối đuôi để lượt
 * sau luôn về đích sau lượt trước, tránh file cuối cùng lại là bản cũ.
 */
const fileStorageWriteQueues = new Map<string, Promise<void>>()

async function writeFileStorageAtomic(filePath: string, value: string): Promise<void> {
  ensureDir(path.dirname(filePath))
  // Ghi ra file tạm rồi rename: rename là thao tác nguyên tử trên cùng ổ đĩa, nên
  // mất điện giữa chừng cũng không để lại file JSON cụt. writeFileSync cũ thì có.
  const tempPath = `${filePath}.${process.pid}.tmp`
  try {
    await fs.promises.writeFile(tempPath, value, 'utf-8')
    await fs.promises.rename(tempPath, filePath)
  } catch (error) {
    await fs.promises.rm(tempPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export function registerFileStorageIpc() {
  ipcMain.handle('file-storage-get', async (_event, key: string) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`)
      // Async: đọc store lớn (lịch sử chat vài trăm KB) bằng readFileSync sẽ chặn
      // main process, tức là chặn cả cửa sổ.
      return await fs.promises.readFile(filePath, 'utf-8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return null
      console.error('Failed to read file storage:', error)
      return null
    }
  })

  ipcMain.handle('file-storage-set', async (_event, key: string, value: string) => {
    const filePath = path.join(getDataDir(), `${key}.json`)
    const queued = (fileStorageWriteQueues.get(key) ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => writeFileStorageAtomic(filePath, value))
    fileStorageWriteQueues.set(key, queued.catch(() => undefined))
    try {
      await queued
      return true
    } catch (error) {
      console.error('Failed to write file storage:', error)
      return false
    }
  })

  ipcMain.handle('file-storage-remove', async (_event, key: string) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return true
    } catch (error) {
      console.error('Failed to remove file storage:', error)
      return false
    }
  })

  // Check if a storage key exists
  ipcMain.handle('file-storage-exists', async (_event, key: string) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`)
      return fs.existsSync(filePath)
    } catch {
      return false
    }
  })

  // List sub-directories under a directory prefix (used to discover project IDs under _p/)
  ipcMain.handle('file-storage-list-dirs', async (_event, prefix: string) => {
    try {
      const dirPath = path.join(getDataDir(), prefix)
      if (!fs.existsSync(dirPath)) return []
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== '_migrated')
        .map(e => e.name)
    } catch {
      return []
    }
  })

  // List all JSON keys under a directory prefix
  ipcMain.handle('file-storage-list', async (_event, prefix: string) => {
    try {
      const dirPath = path.join(getDataDir(), prefix)
      if (!fs.existsSync(dirPath)) return []
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter(e => e.isFile() && e.name.endsWith('.json'))
        .map(e => `${prefix}/${e.name.replace('.json', '')}`)
    } catch {
      return []
    }
  })

  // Remove an entire directory (for project deletion)
  ipcMain.handle('file-storage-remove-dir', async (_event, prefix: string) => {
    try {
      const dirPath = path.join(getDataDir(), prefix)
      if (fs.existsSync(dirPath)) {
        await fs.promises.rm(dirPath, { recursive: true, force: true })
      }
      return true
    } catch (error) {
      console.error('Failed to remove directory:', error)
      return false
    }
  })
}
