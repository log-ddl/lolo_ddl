import { app, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'
import { focusMainWindow, getMainWindow, sendToMainWindow } from './app-window'
import { sanitizeExternalUrl } from './url-utils'

/**
 * OAuth deep-link handling. The browser redirects to `logdd://auth/callback`,
 * which reaches the app either as a second-instance argv, a macOS `open-url`,
 * or the argv of a cold start; all three funnel into `deliverAuthCallback`.
 */

export const AUTH_CALLBACK_SCHEME = 'logdd'

let pendingAuthCallbackUrl: string | null = null

export function deliverAuthCallback(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== `${AUTH_CALLBACK_SCHEME}:` || url.hostname !== 'auth' || url.pathname !== '/callback') {
      return
    }
    pendingAuthCallbackUrl = url.toString()
    if (getMainWindow()) {
      sendToMainWindow('auth-oauth-callback', pendingAuthCallbackUrl)
      pendingAuthCallbackUrl = null
      focusMainWindow()
    }
  } catch {
    // Ignore malformed protocol URLs.
  }
}

/** Replays a callback that arrived before the renderer was listening. */
export function flushPendingAuthCallback() {
  if (!pendingAuthCallbackUrl) return
  sendToMainWindow('auth-oauth-callback', pendingAuthCallbackUrl)
}

/** Picks up a `logdd://auth/callback` argument from a process argv list. */
export function findAuthCallbackArg(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${AUTH_CALLBACK_SCHEME}://`))
}

function getOrCreateAuthDeviceInfo() {
  const deviceIdPath = path.join(app.getPath('userData'), 'auth-device-id')
  let localId = ''
  try {
    localId = fs.readFileSync(deviceIdPath, 'utf8').trim()
  } catch {
    // The file is created on first use.
  }
  if (!localId) {
    localId = crypto.randomUUID()
    fs.writeFileSync(deviceIdPath, localId, { encoding: 'utf8', mode: 0o600 })
  }
  const deviceHash = crypto
    .createHash('sha256')
    .update(`${localId}:${process.platform}:${process.arch}`)
    .digest('hex')
  return {
    deviceHash,
    deviceName: os.hostname() || `${process.platform}-${process.arch}`,
  }
}

export function registerAuthIpc() {
  ipcMain.handle('auth-open-external', async (_event, url: string) => {
    const safeUrl = sanitizeExternalUrl(url)
    if (!safeUrl) return { success: false, error: 'Invalid authentication URL' }
    try {
      await shell.openExternal(safeUrl)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
  ipcMain.handle('auth-get-device-info', async () => getOrCreateAuthDeviceInfo())
  ipcMain.handle('auth-consume-pending-callback', async () => {
    const callbackUrl = pendingAuthCallbackUrl
    pendingAuthCallbackUrl = null
    return callbackUrl
  })
}
