"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const ipcHelpers = require("./ipc-helpers-DDkDu8KN.cjs");
const PREFIX = "grok";
const CHANNELS = [
  "grok:get-status",
  "grok:refresh-quota",
  "grok:get-capacity",
  "grok:update-settings",
  "grok:open",
  "grok:generate-video",
  "grok:cancel-task",
  "grok:list-inapp-accounts",
  "grok:add-inapp-account",
  "grok:remove-inapp-account",
  "grok:show-inapp-account"
];
function registerGrokIpc(runtime, accountManager) {
  ipcHelpers.registerInAppAccountIpc(PREFIX, accountManager);
  electron.ipcMain.handle("grok:get-status", () => runtime.getStatus());
  electron.ipcMain.handle("grok:refresh-quota", () => runtime.refreshQuotaStatus());
  electron.ipcMain.handle("grok:get-capacity", () => ({ videoLanes: runtime.getStatus().videoLaneCount }));
  electron.ipcMain.handle("grok:update-settings", (_event, payload) => runtime.updateSettings(payload));
  electron.ipcMain.handle("grok:open", async () => {
    await electron.shell.openExternal("https://grok.com/imagine");
    return { ok: true };
  });
  electron.ipcMain.handle("grok:generate-video", (_event, payload) => runtime.generateVideo(payload));
  electron.ipcMain.handle("grok:cancel-task", (_event, taskId) => ({ cancelled: runtime.cancelTask(taskId) }));
  return ipcHelpers.bridgeRuntimeEvents(PREFIX, runtime, CHANNELS);
}
exports.registerGrokIpc = registerGrokIpc;
