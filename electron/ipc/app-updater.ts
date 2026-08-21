import { app, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { AvailableUpdateInfo, OpenExternalResult, UpdateCheckResult, UpdateDownloadResult } from '../../src/shared/types/update'
import { sanitizeExternalUrl } from '../url-utils'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function normalizeVersionParts(version: string) {
  return version
    .replace(/^v/i, '')
    .split('.')
    .map((part) => {
      const match = part.match(/\d+/)
      return match ? Number(match[0]) : 0
    })
}

function compareVersions(left: string, right: string) {
  const leftParts = normalizeVersionParts(left)
  const rightParts = normalizeVersionParts(right)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0
    if (leftPart > rightPart) return 1
    if (leftPart < rightPart) return -1
  }

  return 0
}

async function resolveAvailableUpdate(currentVersion: string): Promise<AvailableUpdateInfo | null> {
  if (!app.isPackaged) {
    throw new Error('Auto update is only available in the packaged desktop app')
  }

  const result = await autoUpdater.checkForUpdates()
  const updateInfo = result?.updateInfo
  if (!updateInfo?.version || compareVersions(updateInfo.version, currentVersion) <= 0) {
    return null
  }

  return {
    currentVersion,
    latestVersion: updateInfo.version,
    releaseNotes: Array.isArray(updateInfo.releaseNotes)
      ? updateInfo.releaseNotes.map((note) => note.note).filter(Boolean).join('\n\n')
      : typeof updateInfo.releaseNotes === 'string'
        ? updateInfo.releaseNotes
        : undefined,
    publishedAt: updateInfo.releaseDate,
  }
}

export function registerAppUpdaterIpc() {
  ipcMain.handle('app-updater-get-current-version', async () => {
    return app.getVersion()
  })

  ipcMain.handle('app-updater-check', async (): Promise<UpdateCheckResult> => {
    const currentVersion = app.getVersion()
    try {
      const update = await resolveAvailableUpdate(currentVersion)
      return {
        success: true,
        currentVersion,
        hasUpdate: !!update,
        update,
      }
    } catch (error) {
      console.error('Failed to check updates:', error)
      return {
        success: false,
        currentVersion,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  ipcMain.handle('app-updater-download-and-install', async (): Promise<UpdateDownloadResult> => {
    if (!app.isPackaged) {
      return { success: false, error: 'Auto update is only available in the packaged desktop app' }
    }

    try {
      await autoUpdater.downloadUpdate()
      autoUpdater.quitAndInstall(false, true)
      return { success: true }
    } catch (error) {
      console.error('Failed to download and install update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  ipcMain.handle('app-updater-open-link', async (_event, url: string): Promise<OpenExternalResult> => {
    const safeUrl = sanitizeExternalUrl(url)
    if (!safeUrl) {
      return { success: false, error: 'Invalid download link' }
    }

    try {
      await shell.openExternal(safeUrl)
      return { success: true }
    } catch (error) {
      console.error('Failed to open external link:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
