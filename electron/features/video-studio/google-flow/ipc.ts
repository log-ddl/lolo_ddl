import { ipcMain, shell } from 'electron';
import type { GoogleFlowRuntime, FlowImageInput, FlowVideoInput } from './runtime';
import type { GoogleFlowInAppAccountManager } from './in-app-account-manager';
import { registerInAppAccountIpc, bridgeRuntimeEvents } from '../browser-session/ipc-helpers';

const PREFIX = 'google-flow';

const CHANNELS = [
  'google-flow:get-status', 'google-flow:list-credentials', 'google-flow:get-capacity',
  'google-flow:open-flow', 'google-flow:update-settings', 'google-flow:generate-image', 'google-flow:generate-video', 'google-flow:upscale-video', 'google-flow:cancel-task',
  'google-flow:list-project-bindings', 'google-flow:create-project-binding', 'google-flow:activate-project-binding',
  'google-flow:sync-references',
  'google-flow:list-inapp-accounts', 'google-flow:add-inapp-account', 'google-flow:remove-inapp-account', 'google-flow:show-inapp-account',
  'google-flow:refresh-inapp-accounts',
] as const;

export function registerGoogleFlowIpc(runtime: GoogleFlowRuntime, accountManager?: GoogleFlowInAppAccountManager): () => void {
  registerInAppAccountIpc(PREFIX, accountManager);
  ipcMain.handle('google-flow:get-status', () => runtime.getStatus());
  ipcMain.handle('google-flow:list-credentials', () => runtime.listCredentials());
  ipcMain.handle('google-flow:get-capacity', () => {
    const status = runtime.getStatus();
    return { imageLanes: status.imageLaneCount, videoLanes: status.videoLaneCount };
  });
  ipcMain.handle('google-flow:list-project-bindings', (_event, longddProjectId: string) => runtime.listProjectBindings(longddProjectId));
  ipcMain.handle('google-flow:create-project-binding', (_event, payload) => runtime.createProjectBinding(payload));
  ipcMain.handle('google-flow:activate-project-binding', (_event, payload) => runtime.activateProjectBinding(payload));
  ipcMain.handle('google-flow:sync-references', (_event, payload) => runtime.syncReferences(payload));
  ipcMain.handle('google-flow:refresh-inapp-accounts', async () => {
    await accountManager?.refreshAccounts();
    return { ok: true };
  });
  ipcMain.handle('google-flow:open-flow', async () => {
    await shell.openExternal('https://labs.google/fx/tools/flow');
    return { ok: true };
  });
  ipcMain.handle('google-flow:generate-image', (_event, payload: FlowImageInput) => runtime.generateImage(payload));
  ipcMain.handle('google-flow:update-settings', (_event, payload) => runtime.updateSettings(payload));
  ipcMain.handle('google-flow:generate-video', (_event, payload: FlowVideoInput) => runtime.generateVideo(payload));
  ipcMain.handle('google-flow:upscale-video', (_event, payload) => runtime.upscaleVideo(payload));
  ipcMain.handle('google-flow:cancel-task', (_event, taskId: string) => ({ cancelled: runtime.cancelTask(taskId) }));
  return bridgeRuntimeEvents(PREFIX, runtime, CHANNELS);
}
