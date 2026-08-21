import { app, ipcMain } from 'electron'
import path from 'node:path'
import { APP_ROOT } from './app-paths'
import { getMediaRoot } from './storage-paths'
import { InAppBrowserSessionManager } from './features/video-studio/browser-session/session-manager'
import type { GoogleFlowRuntime } from './features/video-studio/google-flow/runtime'
import type { GrokVideoRuntime } from './features/video-studio/grok/runtime'
import type { GoogleFlowInAppAccountManager } from './features/video-studio/google-flow/in-app-account-manager'
import type { GrokInAppAccountManager } from './features/video-studio/grok/in-app-account-manager'

/**
 * Google Flow and Grok drive a real Chrome instance, so their runtimes are
 * loaded lazily (only once the renderer asks) and torn down explicitly on quit
 * — Electron exiting does not kill those separate OS processes on its own.
 */

let googleFlowRuntime: GoogleFlowRuntime | null = null
let unregisterGoogleFlowIpc: (() => void) | null = null
let googleFlowStartupPromise: Promise<void> | null = null
let grokVideoRuntime: GrokVideoRuntime | null = null
let unregisterGrokIpc: (() => void) | null = null
let grokStartupPromise: Promise<void> | null = null
let inAppSessionManager: InAppBrowserSessionManager | null = null
let googleFlowAccountManager: GoogleFlowInAppAccountManager | null = null
let grokAccountManager: GrokInAppAccountManager | null = null

function getInAppSessionManager(): InAppBrowserSessionManager {
  if (!inAppSessionManager) {
    inAppSessionManager = new InAppBrowserSessionManager(app.getPath('userData'))
  }
  return inAppSessionManager
}

function getExtensionPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'extensions', 'logdd')
    : path.join(APP_ROOT, 'extensions', 'logdd')
}

function startGoogleFlowRuntime(): Promise<void> {
  if (googleFlowRuntime) return Promise.resolve()
  if (googleFlowStartupPromise) return googleFlowStartupPromise
  googleFlowStartupPromise = Promise.all([
    import('./features/video-studio/google-flow/runtime'),
    import('./features/video-studio/google-flow/ipc'),
    import('./features/video-studio/google-flow/in-app-account-manager'),
  ]).then(async ([runtimeModule, ipcModule, accountManagerModule]) => {
    if (googleFlowRuntime) return
    googleFlowRuntime = new runtimeModule.GoogleFlowRuntime({
      userDataPath: app.getPath('userData'),
      mediaRoot: getMediaRoot(),
      extensionPath: getExtensionPath(),
    })
    googleFlowAccountManager = new accountManagerModule.GoogleFlowInAppAccountManager(getInAppSessionManager(), googleFlowRuntime)
    unregisterGoogleFlowIpc = ipcModule.registerGoogleFlowIpc(googleFlowRuntime, googleFlowAccountManager)
    googleFlowRuntime.start()
    void googleFlowAccountManager.restoreAccounts().catch((error) => {
      console.error('[video-studio] Google Flow account restore failed:', error)
    })
  }).finally(() => {
    googleFlowStartupPromise = null
  })
  return googleFlowStartupPromise
}

function startGrokRuntime(): Promise<void> {
  if (grokVideoRuntime) return Promise.resolve()
  if (grokStartupPromise) return grokStartupPromise
  grokStartupPromise = Promise.all([
    import('./features/video-studio/grok/runtime'),
    import('./features/video-studio/grok/ipc'),
    import('./features/video-studio/grok/in-app-account-manager'),
  ]).then(async ([runtimeModule, ipcModule, accountManagerModule]) => {
    if (grokVideoRuntime) return
    const extensionPath = getExtensionPath()
    grokVideoRuntime = new runtimeModule.GrokVideoRuntime({
      mediaRoot: getMediaRoot(),
      extensionPath,
    })
    grokAccountManager = new accountManagerModule.GrokInAppAccountManager(getInAppSessionManager(), grokVideoRuntime, extensionPath, getMediaRoot())
    unregisterGrokIpc = ipcModule.registerGrokIpc(grokVideoRuntime, grokAccountManager)
    grokVideoRuntime.start()
    void grokAccountManager.restoreAccounts().catch((error) => {
      console.error('[video-studio] Grok account restore failed:', error)
    })
  }).finally(() => {
    grokStartupPromise = null
  })
  return grokStartupPromise
}

export function registerBrowserRuntimeIpc() {
  ipcMain.handle('vs-browser:start-runtimes', async () => {
    await Promise.all([startGoogleFlowRuntime(), startGrokRuntime()])
    return { ok: true }
  })
  // Toggle: fully hide (vs. minimize) the in-app login Chrome windows after
  // they report ready. The main process also persists this preference so it is
  // available before restored browser sessions are launched.
  ipcMain.handle('vs-browser:set-hide-after-login', async (_event, value: boolean) => {
    await getInAppSessionManager().setHideAfterLogin(Boolean(value))
    return { ok: true }
  })
}

/** Stops both runtimes and returns the session manager still needing shutdown, if any. */
export function stopBrowserRuntimes(): InAppBrowserSessionManager | null {
  unregisterGoogleFlowIpc?.()
  unregisterGoogleFlowIpc = null
  googleFlowRuntime?.stop()
  googleFlowRuntime = null
  unregisterGrokIpc?.()
  unregisterGrokIpc = null
  grokVideoRuntime?.stop()
  grokVideoRuntime = null

  const sessionManager = inAppSessionManager
  inAppSessionManager = null
  googleFlowAccountManager = null
  grokAccountManager = null
  return sessionManager
}
