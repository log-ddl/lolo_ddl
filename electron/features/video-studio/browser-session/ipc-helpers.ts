import { BrowserWindow, ipcMain } from 'electron'
import type { EventEmitter } from 'node:events'

type InAppAccountManagerLike = {
  listAccounts(): unknown
  addAccount(): Promise<unknown>
  removeAccount(accountSlotId: string): Promise<unknown>
  showAccount(accountSlotId: string): Promise<unknown>
}

// Shared IPC registration for the in-app account flows (list/add/remove/show).
// Used by both the Google Flow and Grok providers — identical except for the
// channel prefix.
export function registerInAppAccountIpc(prefix: string, accountManager?: InAppAccountManagerLike): void {
  ipcMain.handle(`${prefix}:list-inapp-accounts`, () => accountManager?.listAccounts() ?? [])
  ipcMain.handle(`${prefix}:add-inapp-account`, () => {
    if (!accountManager) throw new Error('In-app account manager is not available')
    return accountManager.addAccount()
  })
  ipcMain.handle(`${prefix}:remove-inapp-account`, (_event, accountSlotId: string) => {
    if (!accountManager) throw new Error('In-app account manager is not available')
    return accountManager.removeAccount(accountSlotId)
  })
  ipcMain.handle(`${prefix}:show-inapp-account`, (_event, accountSlotId: string) => accountManager?.showAccount(accountSlotId))
}

// Bridges a runtime EventEmitter to the renderer ('status'/'task' events) and
// returns the unregister function that tears down listeners and handlers.
export function bridgeRuntimeEvents(prefix: string, runtime: EventEmitter, channels: readonly string[]): () => void {
  const send = (channel: string, payload: unknown) => {
    for (const window of BrowserWindow.getAllWindows()) if (!window.webContents.isDestroyed()) window.webContents.send(channel, payload)
  }
  const onStatus = (payload: unknown) => send(`${prefix}:status-event`, payload)
  const onTask = (payload: unknown) => send(`${prefix}:task-event`, payload)
  runtime.on('status', onStatus)
  runtime.on('task', onTask)
  return () => {
    runtime.off('status', onStatus)
    runtime.off('task', onTask)
    for (const channel of channels) ipcMain.removeHandler(channel)
  }
}
