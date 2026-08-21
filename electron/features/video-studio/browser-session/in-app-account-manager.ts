import type { AccountSessionHandle, InAppAccountRecord, InAppBrowserSessionManager } from './session-manager'

const AUTO_MINIMIZE_DELAY_MS = 4000

type InAppRuntimeLike = { forgetInAppCredential(extensionInstanceId: string): void }

// Orchestrates "log in to a provider inside the app" — one CDP-driven Chrome
// + provider bridge per account, backed by the shared session manager.
// Shared by the Google Flow and Grok runtimes (they differ only in provider
// id, login URL and bridge construction).
export class InAppAccountManager<B extends { dispose(): void }> {
  private readonly bridges = new Map<string, B>()

  constructor(
    private readonly providerId: 'google-flow' | 'grok',
    private readonly loginUrl: string,
    private readonly displayName: string,
    private readonly sessionManager: InAppBrowserSessionManager,
    private readonly runtime: InAppRuntimeLike,
    private readonly createBridge: (handle: AccountSessionHandle, onFirstReady: () => void) => B,
  ) {}

  listAccounts(): InAppAccountRecord[] {
    return this.sessionManager.listAccounts(this.providerId)
  }

  async addAccount(): Promise<InAppAccountRecord> {
    const handle = await this.sessionManager.addAccount(this.providerId, { loginUrl: this.loginUrl })
    this.bridges.set(handle.accountSlotId, this.createBridge(handle, () => {
      setTimeout(() => { void handle.hide() }, AUTO_MINIMIZE_DELAY_MS)
    }))
    const record = this.listAccounts().find((a) => a.accountSlotId === handle.accountSlotId)
    if (!record) throw new Error(`${this.displayName} account record missing right after creation`)
    return record
  }

  async restoreAccounts(): Promise<void> {
    const handles = await this.sessionManager.restoreAll(this.providerId, { loginUrl: this.loginUrl })
    for (const handle of handles) {
      this.bridges.set(handle.accountSlotId, this.createBridge(handle, () => {
        setTimeout(() => { void handle.hide() }, AUTO_MINIMIZE_DELAY_MS)
      }))
    }
  }

  async removeAccount(accountSlotId: string): Promise<void> {
    this.bridges.get(accountSlotId)?.dispose()
    this.bridges.delete(accountSlotId)
    this.runtime.forgetInAppCredential(accountSlotId)
    await this.sessionManager.removeAccount(accountSlotId)
  }

  showAccount(accountSlotId: string): Promise<void> {
    return this.sessionManager.showAccountWindow(accountSlotId)
  }

  async refreshAccounts(): Promise<void> {
    await Promise.all([...this.bridges.values()].map(async (bridge) => {
      const refresh = (bridge as B & { refreshToken?: () => Promise<void> }).refreshToken
      if (refresh) await refresh.call(bridge)
    }))
  }
}
