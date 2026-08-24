"use strict";
const node_events = require("node:events");
const READY_STATE = { CONNECTING: 0, OPEN: 1, CLOSED: 3 };
class FakeSocket extends node_events.EventEmitter {
  constructor(onSend) {
    super();
    this.onSend = onSend;
  }
  readyState = READY_STATE.CONNECTING;
  open() {
    if (this.readyState === READY_STATE.CLOSED) return;
    this.readyState = READY_STATE.OPEN;
  }
  send(data) {
    if (this.readyState !== READY_STATE.OPEN) return;
    this.onSend(data);
  }
  close(code, reason) {
    if (this.readyState === READY_STATE.CLOSED) return;
    this.readyState = READY_STATE.CLOSED;
    this.emit("close", code, reason);
  }
  // Feed an inbound message (as if the extension had sent it over the wire)
  // into whatever runtime.attachSocket() wired up via `.on('message', ...)`.
  receive(json) {
    if (this.readyState !== READY_STATE.OPEN) return;
    this.emit("message", Buffer.from(json, "utf8"));
  }
}
const AUTO_MINIMIZE_DELAY_MS = 4e3;
class InAppAccountManager {
  constructor(providerId, loginUrl, displayName, sessionManager, runtime, createBridge) {
    this.providerId = providerId;
    this.loginUrl = loginUrl;
    this.displayName = displayName;
    this.sessionManager = sessionManager;
    this.runtime = runtime;
    this.createBridge = createBridge;
  }
  bridges = /* @__PURE__ */ new Map();
  listAccounts() {
    return this.sessionManager.listAccounts(this.providerId);
  }
  async addAccount() {
    const handle = await this.sessionManager.addAccount(this.providerId, { loginUrl: this.loginUrl });
    this.bridges.set(handle.accountSlotId, this.createBridge(handle, () => {
      setTimeout(() => {
        void handle.hide();
      }, AUTO_MINIMIZE_DELAY_MS);
    }));
    const record = this.listAccounts().find((a) => a.accountSlotId === handle.accountSlotId);
    if (!record) throw new Error(`${this.displayName} account record missing right after creation`);
    return record;
  }
  async restoreAccounts() {
    const handles = await this.sessionManager.restoreAll(this.providerId, { loginUrl: this.loginUrl });
    for (const handle of handles) {
      this.bridges.set(handle.accountSlotId, this.createBridge(handle, () => {
        setTimeout(() => {
          void handle.hide();
        }, AUTO_MINIMIZE_DELAY_MS);
      }));
    }
  }
  async removeAccount(accountSlotId) {
    this.bridges.get(accountSlotId)?.dispose();
    this.bridges.delete(accountSlotId);
    this.runtime.forgetInAppCredential(accountSlotId);
    await this.sessionManager.removeAccount(accountSlotId);
  }
  showAccount(accountSlotId) {
    return this.sessionManager.showAccountWindow(accountSlotId);
  }
  async refreshAccounts() {
    await Promise.all([...this.bridges.values()].map(async (bridge) => {
      const refresh = bridge.refreshToken;
      if (refresh) await refresh.call(bridge);
    }));
  }
}
exports.FakeSocket = FakeSocket;
exports.InAppAccountManager = InAppAccountManager;
