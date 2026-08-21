import { ipcMain, shell } from 'electron';
import type { GrokVideoRuntime, GrokVideoInput } from './runtime';
import type { GrokInAppAccountManager } from './in-app-account-manager';
import { registerInAppAccountIpc, bridgeRuntimeEvents } from '../browser-session/ipc-helpers';

const PREFIX = 'grok';

const CHANNELS = [
  'grok:get-status', 'grok:refresh-quota', 'grok:get-capacity', 'grok:update-settings', 'grok:open', 'grok:generate-video', 'grok:cancel-task',
  'grok:list-inapp-accounts', 'grok:add-inapp-account', 'grok:remove-inapp-account', 'grok:show-inapp-account',
] as const;

export function registerGrokIpc(runtime: GrokVideoRuntime, accountManager?: GrokInAppAccountManager): () => void {
  registerInAppAccountIpc(PREFIX, accountManager);
  ipcMain.handle('grok:get-status', () => runtime.getStatus());
  ipcMain.handle('grok:refresh-quota', () => runtime.refreshQuotaStatus());
  ipcMain.handle('grok:get-capacity', () => ({ videoLanes: runtime.getStatus().videoLaneCount }));
  ipcMain.handle('grok:update-settings', (_event, payload) => runtime.updateSettings(payload));
  ipcMain.handle('grok:open', async () => {
    await shell.openExternal('https://grok.com/imagine');
    return { ok: true };
  });
  ipcMain.handle('grok:generate-video', (_event, payload: GrokVideoInput) => runtime.generateVideo(payload));
  ipcMain.handle('grok:cancel-task', (_event, taskId: string) => ({ cancelled: runtime.cancelTask(taskId) }));
  return bridgeRuntimeEvents(PREFIX, runtime, CHANNELS);
}
