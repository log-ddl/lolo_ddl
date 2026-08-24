"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const ipcHelpers = require("./ipc-helpers-DDkDu8KN.cjs");
const PREFIX = "google-flow";
const CHANNELS = [
  "google-flow:get-status",
  "google-flow:list-credentials",
  "google-flow:get-capacity",
  "google-flow:open-flow",
  "google-flow:update-settings",
  "google-flow:generate-image",
  "google-flow:generate-video",
  "google-flow:upscale-video",
  "google-flow:cancel-task",
  "google-flow:list-project-bindings",
  "google-flow:create-project-binding",
  "google-flow:activate-project-binding",
  "google-flow:sync-references",
  "google-flow:list-inapp-accounts",
  "google-flow:add-inapp-account",
  "google-flow:remove-inapp-account",
  "google-flow:show-inapp-account",
  "google-flow:refresh-inapp-accounts"
];
function registerGoogleFlowIpc(runtime, accountManager) {
  ipcHelpers.registerInAppAccountIpc(PREFIX, accountManager);
  electron.ipcMain.handle("google-flow:get-status", () => runtime.getStatus());
  electron.ipcMain.handle("google-flow:list-credentials", () => runtime.listCredentials());
  electron.ipcMain.handle("google-flow:get-capacity", () => {
    const status = runtime.getStatus();
    return { imageLanes: status.imageLaneCount, videoLanes: status.videoLaneCount };
  });
  electron.ipcMain.handle("google-flow:list-project-bindings", (_event, longddProjectId) => runtime.listProjectBindings(longddProjectId));
  electron.ipcMain.handle("google-flow:create-project-binding", (_event, payload) => runtime.createProjectBinding(payload));
  electron.ipcMain.handle("google-flow:activate-project-binding", (_event, payload) => runtime.activateProjectBinding(payload));
  electron.ipcMain.handle("google-flow:sync-references", (_event, payload) => runtime.syncReferences(payload));
  electron.ipcMain.handle("google-flow:refresh-inapp-accounts", async () => {
    await accountManager?.refreshAccounts();
    return { ok: true };
  });
  electron.ipcMain.handle("google-flow:open-flow", async () => {
    await electron.shell.openExternal("https://labs.google/fx/tools/flow");
    return { ok: true };
  });
  electron.ipcMain.handle("google-flow:generate-image", (_event, payload) => runtime.generateImage(payload));
  electron.ipcMain.handle("google-flow:update-settings", (_event, payload) => runtime.updateSettings(payload));
  electron.ipcMain.handle("google-flow:generate-video", (_event, payload) => runtime.generateVideo(payload));
  electron.ipcMain.handle("google-flow:upscale-video", (_event, payload) => runtime.upscaleVideo(payload));
  electron.ipcMain.handle("google-flow:cancel-task", (_event, taskId) => ({ cancelled: runtime.cancelTask(taskId) }));
  return ipcHelpers.bridgeRuntimeEvents(PREFIX, runtime, CHANNELS);
}
exports.registerGoogleFlowIpc = registerGoogleFlowIpc;
