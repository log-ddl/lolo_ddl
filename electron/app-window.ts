import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import packageMetadata from '../package.json'
import { APP_ROOT, RENDERER_DIST, VITE_DEV_SERVER_URL } from './app-paths'

let win: BrowserWindow | null = null
// Kept across re-creations so the macOS `activate` path also runs the hook.
let onDidFinishLoadHook: (() => void) | null = null

const appIconPath = VITE_DEV_SERVER_URL
  ? path.join(APP_ROOT, 'build', 'icon.ico')
  : path.join(process.resourcesPath, 'build', 'icon.ico')

export function getMainWindow(): BrowserWindow | null {
  return win && !win.isDestroyed() ? win : null
}

/** Un-minimizes, shows and focuses the main window if it still exists. */
export function focusMainWindow() {
  const target = getMainWindow()
  if (!target) return
  if (target.isMinimized()) target.restore()
  target.show()
  target.focus()
}

export function sendToMainWindow(channel: string, ...args: unknown[]) {
  getMainWindow()?.webContents.send(channel, ...args)
}

export function broadcastToWindows(channel: string, ...args: unknown[]) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, ...args)
  }
}

/** Picks the window running the app itself, preferring the renderer entry page. */
export function findAppWebContents() {
  const windows = BrowserWindow.getAllWindows()
  return windows.find((item) => !item.isDestroyed() && item.webContents.getURL().includes('index.html'))?.webContents
    ?? windows.find((item) => !item.isDestroyed())?.webContents
    ?? null
}

export function createMainWindow(onDidFinishLoad?: () => void) {
  if (onDidFinishLoad) onDidFinishLoadHook = onDidFinishLoad
  win = new BrowserWindow({
    title: packageMetadata.productName || 'LONGDD',
    icon: appIconPath,
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    // autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      // devTools: Boolean(VITE_DEV_SERVER_URL),
    },
  })

  // win.removeMenu()
  // win.setMenuBarVisibility(false)

  // if (!VITE_DEV_SERVER_URL) {
  //   win.webContents.on('before-input-event', (event, input) => {
  //     const opensDevTools = input.key === 'F12'
  //       || (input.control && input.shift && input.key.toLowerCase() === 'i')
  //     if (opensDevTools) event.preventDefault()
  //   })
  // }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    onDidFinishLoadHook?.()
  })

  // Open external links in system browser instead of inside Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    // Allow navigating to the app itself (dev server or local file)
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) return
    if (url.startsWith('file://')) return
    // Block and open externally
    event.preventDefault()
    shell.openExternal(url)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

export function registerWindowLifecycle() {
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
      win = null
    }
  })

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
}
