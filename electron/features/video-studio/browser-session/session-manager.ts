import { type ChildProcess, execFile, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { CdpSession, type CdpTarget, waitForCdpEndpoint } from './cdp-client'
import { findChromeExecutable } from './find-chrome'

// SW_HIDE = 0 (removes the window from screen AND taskbar), SW_RESTORE = 9
// (shows + un-minimizes). Used to fully hide the login Chrome after sign-in
// when the user enables that option, rather than just minimizing it.
const SW_HIDE = 0
const SW_RESTORE = 9

// Show/hide every top-level titled window owned by the given Chrome process
// (or its children) at the OS level. Windows-only; a no-op elsewhere. Best
// effort — falls back silently if the window can't be found.
function setChromeWindowVisibilityNative(pid: number | undefined, visible: boolean): Promise<boolean> {
  if (!pid || process.platform !== 'win32') return Promise.resolve(false)
  const cmd = visible ? SW_RESTORE : SW_HIDE
  const script = [
    `$root=${pid};$cmd=${cmd};`,
    '$pids=New-Object System.Collections.Generic.HashSet[int];',
    '$q=New-Object System.Collections.Queue;[void]$q.Enqueue($root);',
    'while($q.Count -gt 0){$p=[int]$q.Dequeue();if($pids.Add($p)){Get-CimInstance Win32_Process -Filter "ParentProcessId=$p" -ErrorAction SilentlyContinue|%{[void]$q.Enqueue([int]$_.ProcessId)}}}',
    'Add-Type @"',
    'using System;using System.Collections.Generic;using System.Runtime.InteropServices;',
    'public class VsWin{',
    '[DllImport("user32.dll")]static extern bool EnumWindows(EnumWindowsProc cb,IntPtr l);',
    'delegate bool EnumWindowsProc(IntPtr h,IntPtr l);',
    '[DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);',
    '[DllImport("user32.dll")]static extern bool ShowWindow(IntPtr h,int c);',
    '[DllImport("user32.dll")]static extern int GetWindowTextLength(IntPtr h);',
    'public static void Apply(int[] pids,int cmd){var s=new HashSet<uint>();foreach(var p in pids)s.Add((uint)p);EnumWindows((h,l)=>{uint wp;GetWindowThreadProcessId(h,out wp);if(s.Contains(wp)&&GetWindowTextLength(h)>0){ShowWindow(h,cmd);}return true;},IntPtr.Zero);}',
    '}',
    '"@;',
    '[VsWin]::Apply([int[]]@($pids),$cmd)|Out-Null',
  ].join('\n')
  return new Promise((resolve) => {
    try {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { windowsHide: true },
        (error) => resolve(!error),
      )
    } catch {
      resolve(false)
    }
  })
}

export type ProviderId = 'google-flow' | 'grok'

export type InAppAccountRecord = {
  accountSlotId: string
  provider: ProviderId
  label: string
  createdAt: number
}

export type AccountSessionHandle = {
  accountSlotId: string
  provider: ProviderId
  /** The live CDP session. Replaced transparently after a background respawn — read it fresh each time, don't cache. */
  readonly cdp: CdpSession
  /** Fires with the new CDP session whenever the account's Chrome was respawned (e.g. the user closed the window). */
  onReconnect(listener: (cdp: CdpSession) => void): () => void
  show(): Promise<void>
  hide(): Promise<void>
}

export type OpenAccountOptions = {
  loginUrl: string
  windowSize?: { width: number; height: number }
  startMinimized?: boolean
}

type AccountSession = {
  record: InAppAccountRecord
  options: OpenAccountOptions
  process?: ChildProcess
  cdp?: CdpSession
  targetId?: string
  removed: boolean
  respawning: boolean
  lastConnectedAt: number
  fastCrashes: number
  autoHidden: boolean
  readonly reconnectListeners: Set<(cdp: CdpSession) => void>
}

// If Chrome dies within this window of connecting, count it as a crash rather
// than a deliberate user close, and give up after a few in a row instead of
// respawning forever.
const FAST_CRASH_WINDOW_MS = 8000
const MAX_FAST_CRASHES = 3
const BROWSER_CLOSE_GRACE_MS = 800
const PROCESS_EXIT_GRACE_MS = 1200

function waitForChildExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.removeListener('exit', finish)
      resolve()
    }
    const timer = setTimeout(finish, timeoutMs)
    child.once('exit', finish)
  })
}

async function terminateChromeProcessTree(child: ChildProcess): Promise<void> {
  const pid = child.pid
  if (!pid || child.exitCode !== null || child.signalCode !== null) return

  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => {
      try {
        // /T includes all renderer/GPU subprocesses. /F is necessary because
        // Node's child.kill() on Windows only targets the root process.
        execFile('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => resolve())
      } catch {
        resolve()
      }
    })
    return
  }

  try { child.kill('SIGTERM') } catch { /* already gone */ }
  await waitForChildExit(child, PROCESS_EXIT_GRACE_MS)
  if (child.exitCode === null && child.signalCode === null) {
    try { child.kill('SIGKILL') } catch { /* already gone */ }
  }
}

// Owns the lifecycle of the app-spawned Chrome processes used to log into
// Google Flow / Grok without a browser extension. One real, externally
// spawned Chrome (or Edge) + dedicated --user-data-dir per account,
// controlled over the DevTools protocol (see cdp-client.ts). The page-side
// work the extension used to do (token capture, captcha solving, API calls,
// Grok DOM automation) is driven directly over CDP by the per-provider
// bridge classes instead.
//
// Why a real spawned Chrome and not Electron's own BrowserWindow, and why
// CDP instead of --load-extension:
//   * Google's OAuth consent screen blocks Electron's embedded Chromium
//     outright ("This browser or app may not be secure") — only a genuine,
//     separately-installed browser gets through.
//   * Modern Chrome (137+, and the user's Chrome 150) has permanently
//     disabled the --load-extension command-line switch, so auto-loading the
//     logdd extension is no longer possible. Driving the page over CDP needs
//     no extension — the same approach the reference `fix/` desktop app uses.
//
// The Chrome window is the account's "engine": all future requests run in it.
// If it dies (the user closes it, Chrome self-restarts, a crash), the session
// is respawned in the background from the persistent profile — cookies persist
// so no re-login is needed — and onReconnect fires so the bridge can re-wire.
export class InAppBrowserSessionManager {
  private readonly accountsPath: string
  private readonly settingsPath: string
  private readonly profilesDir: string
  private accounts: InAppAccountRecord[] = []
  private readonly sessions = new Map<string, AccountSession>()
  // When true, a login window is fully hidden (SW_HIDE, gone from the taskbar)
  // once it reports ready, instead of just minimized. Controlled by a UI toggle.
  private hideAfterLogin = false

  constructor(userDataPath: string) {
    this.accountsPath = path.join(userDataPath, 'vs-inapp-accounts.json')
    this.settingsPath = path.join(userDataPath, 'vs-browser-settings.json')
    this.profilesDir = path.join(userDataPath, 'vs-inapp-profiles')
    this.loadAccounts()
    this.loadSettings()
  }

  async setHideAfterLogin(value: boolean): Promise<void> {
    this.hideAfterLogin = value
    this.saveSettings()
    if (value) {
      await Promise.allSettled(
        [...this.sessions.values()]
          .filter((session) => session.autoHidden)
          .map((session) => this.hideSession(session)),
      )
    }
  }

  // Bring an account's login window back on screen (used by the "Hiện" button).
  async showAccountWindow(accountSlotId: string): Promise<void> {
    const session = this.sessions.get(accountSlotId)
    if (!session) return
    await setChromeWindowVisibilityNative(session.process?.pid, true)
    if (session.cdp && session.targetId) {
      try {
        const { windowId } = await session.cdp.send<{ windowId: number }>('Browser.getWindowForTarget', { targetId: session.targetId })
        await session.cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } })
      } catch { /* best-effort */ }
    }
  }

  private loadAccounts(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.accountsPath, 'utf8'))
      this.accounts = Array.isArray(parsed) ? parsed : []
    } catch {
      this.accounts = []
    }
  }

  private loadSettings(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8')) as { hideAfterLogin?: unknown }
      this.hideAfterLogin = parsed.hideAfterLogin === true
    } catch {
      this.hideAfterLogin = false
    }
  }

  private saveSettings(): void {
    try {
      fs.mkdirSync(path.dirname(this.settingsPath), { recursive: true })
      fs.writeFileSync(this.settingsPath, JSON.stringify({ hideAfterLogin: this.hideAfterLogin }, null, 2))
    } catch (error) {
      console.warn('[video-studio][in-app-session] failed to persist browser settings:', error)
    }
  }

  private saveAccounts(): void {
    try {
      fs.mkdirSync(path.dirname(this.accountsPath), { recursive: true })
      fs.writeFileSync(this.accountsPath, JSON.stringify(this.accounts, null, 2))
    } catch { /* best-effort persistence */ }
  }

  listAccounts(provider: ProviderId): InAppAccountRecord[] {
    return this.accounts.filter((a) => a.provider === provider)
  }

  async addAccount(provider: ProviderId, options: OpenAccountOptions): Promise<AccountSessionHandle> {
    const accountSlotId = randomUUID()
    const record: InAppAccountRecord = { accountSlotId, provider, label: 'Đang đăng nhập…', createdAt: Date.now() }
    this.accounts.push(record)
    this.saveAccounts()
    const session: AccountSession = { record, options, removed: false, respawning: false, lastConnectedAt: 0, fastCrashes: 0, autoHidden: false, reconnectListeners: new Set() }
    this.sessions.set(accountSlotId, session)
    await this.launch(session, options)
    return this.makeHandle(session)
  }

  async restoreAll(provider: ProviderId, options: OpenAccountOptions): Promise<AccountSessionHandle[]> {
    const handles: AccountSessionHandle[] = []
    for (const record of this.listAccounts(provider)) {
      const session: AccountSession = { record, options, removed: false, respawning: false, lastConnectedAt: 0, fastCrashes: 0, autoHidden: false, reconnectListeners: new Set() }
      this.sessions.set(record.accountSlotId, session)
      try {
        await this.launch(session, { ...options, startMinimized: true })
        const handle = this.makeHandle(session)
        if (this.hideAfterLogin) await handle.hide()
        handles.push(handle)
      } catch (error) {
        console.error(`[video-studio][in-app-session] failed to restore account ${record.accountSlotId}:`, error)
      }
    }
    return handles
  }

  async removeAccount(accountSlotId: string): Promise<void> {
    const session = this.sessions.get(accountSlotId)
    if (session) {
      session.removed = true
      this.sessions.delete(accountSlotId)
      try { session.cdp?.close() } catch { /* already closing */ }
      try { session.process?.kill() } catch { /* already gone */ }
    }
    this.accounts = this.accounts.filter((a) => a.accountSlotId !== accountSlotId)
    this.saveAccounts()
    try {
      fs.rmSync(path.join(this.profilesDir, accountSlotId), { recursive: true, force: true })
    } catch { /* best-effort cleanup */ }
  }

  /**
   * Stops every app-owned browser without deleting its persisted login.
   * Mark sessions removed first so a closing CDP socket cannot schedule a
   * background respawn while Electron is quitting.
   */
  async shutdownAll(): Promise<void> {
    const sessions = [...this.sessions.values()]
    for (const session of sessions) {
      session.removed = true
      session.respawning = false
      session.reconnectListeners.clear()
    }

    await Promise.allSettled(sessions.map(async (session) => {
      const cdp = session.cdp
      const child = session.process
      if (cdp && !cdp.isClosed) {
        // Ask the whole browser to close cleanly first, preserving its profile.
        await Promise.race([
          cdp.send('Browser.close').catch(() => undefined),
          new Promise<void>((resolve) => setTimeout(resolve, BROWSER_CLOSE_GRACE_MS)),
        ])
      }
      try { cdp?.close() } catch { /* already closed */ }
      if (child) await terminateChromeProcessTree(child)
    }))

    this.sessions.clear()
  }

  private async launch(session: AccountSession, options: OpenAccountOptions): Promise<void> {
    const chromePath = findChromeExecutable()
    if (!chromePath) {
      throw new Error('Không tìm thấy Chrome hoặc Edge trên máy — cần cài Google Chrome để đăng nhập trong ứng dụng.')
    }
    const { record } = session
    const profileDir = path.join(this.profilesDir, record.accountSlotId)
    fs.mkdirSync(profileDir, { recursive: true })
    const port = await findFreePort()
    const width = options.windowSize?.width ?? 1200
    const height = options.windowSize?.height ?? 840
    const args = [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${port}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-blink-features=AutomationControlled',
      `--window-size=${width},${height}`,
    ]
    if (options.startMinimized) args.push('--start-minimized')
    args.push(options.loginUrl)
    console.log(`[video-studio][in-app-session] spawning ${chromePath} on CDP port ${port} (account=${record.accountSlotId})`)
    const child = spawn(chromePath, args, { stdio: 'ignore', detached: false })
    session.process = child
    child.on('exit', (code) => {
      console.log(`[video-studio][in-app-session] chrome exited (account=${record.accountSlotId}, code=${code})`)
      if (session.process === child) session.process = undefined
    })
    child.on('error', (error) => {
      console.error(`[video-studio][in-app-session] failed to spawn chrome for account ${record.accountSlotId}:`, error)
    })

    let targets: CdpTarget[]
    try {
      targets = await waitForCdpEndpoint(port, 20_000)
    } catch (error) {
      try { child.kill() } catch { /* already gone */ }
      throw error
    }
    const pageTarget = targets.find((t) => t.type === 'page') ?? targets[0]
    if (!pageTarget) {
      try { child.kill() } catch { /* already gone */ }
      throw new Error('Chrome không mở được tab nào để kết nối')
    }
    const cdp = await CdpSession.connect(pageTarget.webSocketDebuggerUrl)
    session.cdp = cdp
    session.targetId = pageTarget.id
    session.lastConnectedAt = Date.now()
    console.log(`[video-studio][in-app-session] CDP connected (account=${record.accountSlotId})`)

    // When this Chrome dies for any reason other than an intentional
    // removal, bring it back in the background so the account keeps working.
    cdp.onClose(() => { if (!session.removed) this.scheduleRespawn(session) })
  }

  private scheduleRespawn(session: AccountSession): void {
    if (session.removed || session.respawning) return
    if (session.lastConnectedAt && Date.now() - session.lastConnectedAt < FAST_CRASH_WINDOW_MS) {
      session.fastCrashes += 1
      if (session.fastCrashes >= MAX_FAST_CRASHES) {
        console.error(`[video-studio][in-app-session] account ${session.record.accountSlotId} Chrome keeps crashing on launch — giving up respawn. Gỡ và thêm lại tài khoản.`)
        return
      }
    } else {
      session.fastCrashes = 0
    }
    session.respawning = true
    console.log(`[video-studio][in-app-session] chrome for account ${session.record.accountSlotId} is gone — respawning in background`)
    const attempt = (retriesLeft: number): void => {
      setTimeout(async () => {
        if (session.removed) { session.respawning = false; return }
        try {
          await this.launch(session, { ...session.options, startMinimized: true })
          session.respawning = false
          if (session.autoHidden) await this.hideSession(session)
          if (session.cdp) {
            for (const listener of session.reconnectListeners) {
              try { listener(session.cdp) } catch (error) { console.error('[video-studio][in-app-session] reconnect listener error:', error) }
            }
          }
        } catch (error) {
          console.error(`[video-studio][in-app-session] respawn failed for account ${session.record.accountSlotId} (retries left ${retriesLeft}):`, error)
          if (retriesLeft > 0 && !session.removed) attempt(retriesLeft - 1)
          else session.respawning = false
        }
      }, 1500)
    }
    attempt(5)
  }

  private makeHandle(session: AccountSession): AccountSessionHandle {
    return {
      accountSlotId: session.record.accountSlotId,
      provider: session.record.provider,
      get cdp() {
        if (!session.cdp) throw new Error('CDP session is not connected')
        return session.cdp
      },
      onReconnect: (listener) => {
        session.reconnectListeners.add(listener)
        return () => { session.reconnectListeners.delete(listener) }
      },
      show: async () => {
        await setChromeWindowVisibilityNative(session.process?.pid, true)
        await this.setWindowState(session, 'normal')
      },
      // Called once the account reports ready: fully hide (gone from taskbar)
      // when the user opted in, otherwise just minimize as before.
      hide: async () => {
        await this.hideSession(session)
      },
    }
  }

  private async setWindowState(session: AccountSession, windowState: 'normal' | 'minimized'): Promise<boolean> {
    const cdp = session.cdp
    if (!cdp || !session.targetId) return false
    try {
      const { windowId } = await cdp.send<{ windowId: number }>('Browser.getWindowForTarget', { targetId: session.targetId })
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState } })
      return true
    } catch {
      return false
    }
  }

  private async hideSession(session: AccountSession): Promise<void> {
    session.autoHidden = true
    if (this.hideAfterLogin) {
      const hidden = await setChromeWindowVisibilityNative(session.process?.pid, false)
      if (hidden) return
    }
    // Native full hiding currently exists only on Windows. Always minimize as
    // a cross-platform fallback so enabling the option can never leave the
    // browser visibly open on macOS/Linux or after a native hide failure.
    await this.setWindowState(session, 'minimized')
  }
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}
