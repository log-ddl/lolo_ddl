"use strict";
const electron = require("electron");
function registerInAppAccountIpc(prefix, accountManager) {
  electron.ipcMain.handle(`${prefix}:list-inapp-accounts`, () => accountManager?.listAccounts() ?? []);
  electron.ipcMain.handle(`${prefix}:add-inapp-account`, () => {
    if (!accountManager) throw new Error("In-app account manager is not available");
    return accountManager.addAccount();
  });
  electron.ipcMain.handle(`${prefix}:remove-inapp-account`, (_event, accountSlotId) => {
    if (!accountManager) throw new Error("In-app account manager is not available");
    return accountManager.removeAccount(accountSlotId);
  });
  electron.ipcMain.handle(`${prefix}:show-inapp-account`, (_event, accountSlotId) => accountManager?.showAccount(accountSlotId));
}
function bridgeRuntimeEvents(prefix, runtime, channels) {
  const send = (channel, payload) => {
    for (const window of electron.BrowserWindow.getAllWindows()) if (!window.webContents.isDestroyed()) window.webContents.send(channel, payload);
  };
  const onStatus = (payload) => send(`${prefix}:status-event`, payload);
  const onTask = (payload) => send(`${prefix}:task-event`, payload);
  runtime.on("status", onStatus);
  runtime.on("task", onTask);
  return () => {
    runtime.off("status", onStatus);
    runtime.off("task", onTask);
    for (const channel of channels) electron.ipcMain.removeHandler(channel);
  };
}
exports.bridgeRuntimeEvents = bridgeRuntimeEvents;
exports.registerInAppAccountIpc = registerInAppAccountIpc;
