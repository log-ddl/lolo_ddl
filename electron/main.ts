// Must come first: seeds process.env.APP_ROOT / VITE_PUBLIC for every module below.
import './app-paths'

import { app } from 'electron'
import path from 'node:path'

import { broadcastToWindows, createMainWindow, focusMainWindow, registerWindowLifecycle } from './app-window'
import { AUTH_CALLBACK_SCHEME, deliverAuthCallback, findAuthCallbackArg, flushPendingAuthCallback, registerAuthIpc } from './auth'
import { registerBrowserRuntimeIpc, stopBrowserRuntimes } from './browser-runtimes'
import { registerAppProtocols, registerPrivilegedSchemes } from './protocols'
import { getMediaRoot, scheduleAutoClean } from './storage-paths'

import { registerImageIpc } from './ipc/images'
import { registerFileStorageIpc } from './ipc/file-storage'
import { registerStorageManagerIpc } from './ipc/storage-manager'
import { registerAppUpdaterIpc } from './ipc/app-updater'
import { registerAutopilotIpc, startAutopilotServer } from './ipc/autopilot'
import { registerAutoEditIpc, registerAutoEditProjectsIpc, registerFileExportIpc } from './ipc/auto-edit'
import {
  registerCliRuntimeIpc,
  registerFFmpegIpc,
  registerRenderIpc,
  registerTtsIpc,
  registerWhisperIpc,
} from './ipc/media-runtime'

import { cancelAllFFmpeg } from './ffmpeg-runtime'
import { cancelAllTranscribes } from './features/video-studio/whisper-runtime'
import { cancelAllRenders } from './features/video-studio/render-pipeline'
import { cancelAllTtsJobs } from './features/tts-voice/omnivoice-runtime'
import { closeResearchDatabase, registerResearchDatabaseIpc } from './features/research-monitor/database'
import { autoUpdateYtDlp, cancelAllMediaToolkitJobs, registerMediaToolkitIpc } from './features/media-toolkit/runtime'
import { registerWatermarkIpc } from './features/video-studio/watermark-runtime'
import { registerContentWorkspaceIpc } from './features/content-chat/workspace-runtime'
import { closeContentMcpGateway, registerContentMcpGateway } from './features/content-chat/mcp/gateway'

export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL } from './app-paths'

let quitCleanupStarted = false
const gotSingleInstanceLock = app.requestSingleInstanceLock()

// ==================== Single instance & deep links ====================
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const callbackUrl = findAuthCallbackArg(commandLine)
    if (callbackUrl) deliverAuthCallback(callbackUrl)
    focusMainWindow()
  })
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  deliverAuthCallback(url)
})

// ==================== IPC registration ====================
registerResearchDatabaseIpc()
registerMediaToolkitIpc()
registerWatermarkIpc(getMediaRoot)
registerContentWorkspaceIpc()
registerContentMcpGateway()

registerImageIpc()
registerFileStorageIpc()
registerStorageManagerIpc()
registerAppUpdaterIpc()
registerCliRuntimeIpc()
registerFFmpegIpc()
registerWhisperIpc()
registerTtsIpc()
registerRenderIpc()
registerAutopilotIpc()
registerFileExportIpc()
registerAutoEditIpc()
registerAutoEditProjectsIpc()

registerWindowLifecycle()

// ==================== Shutdown ====================
app.on('before-quit', (event) => {
  // Chrome/Edge processes spawned for Flow and Grok are independent OS
  // processes, so Electron exiting does not automatically terminate them.
  // Hold the first quit request briefly while their complete process trees are
  // closed. The second app.quit() is allowed through by the guard below.
  if (quitCleanupStarted) return
  quitCleanupStarted = true
  event.preventDefault()

  // Quit đã bị hoãn sẵn ở đây, nên tranh thủ bảo renderer ghi nốt phần còn treo
  // trong bộ gộp ghi. Không có bước này thì thao tác trong ~400ms cuối sẽ mất.
  broadcastToWindows('app-flush-storage')

  const sessionManager = stopBrowserRuntimes()
  cancelAllFFmpeg()
  cancelAllTranscribes()
  cancelAllTtsJobs()
  cancelAllRenders()
  cancelAllMediaToolkitJobs()
  closeResearchDatabase()
  closeContentMcpGateway()

  void sessionManager?.shutdownAll()
    .catch((error) => console.error('[video-studio][in-app-session] shutdown failed:', error))
    .finally(() => app.quit())
  if (!sessionManager) app.quit()
})

// Custom schemes must be declared before the app becomes ready.
registerPrivilegedSchemes()

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return

  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(AUTH_CALLBACK_SCHEME, process.execPath, [path.resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient(AUTH_CALLBACK_SCHEME)
  }

  registerAuthIpc()
  registerBrowserRuntimeIpc()
  registerAppProtocols()
  scheduleAutoClean()

  createMainWindow(flushPendingAuthCallback)
  startAutopilotServer()
  // Update the managed yt-dlp in the background at launch; if a newer version
  // was installed, the user is asked to restart the app.
  void autoUpdateYtDlp()
  const startupCallbackUrl = findAuthCallbackArg(process.argv)
  if (startupCallbackUrl) deliverAuthCallback(startupCallbackUrl)
})
