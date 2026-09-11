import type { WebSocket } from 'ws'
import { FakeSocket } from '../browser-session/fake-socket'
import type { AccountSessionHandle } from '../browser-session/session-manager'
import type { GoogleFlowRuntime } from './runtime'
import {
  GOOGLE_FLOW_API_ROOT,
  GOOGLE_FLOW_APP_ORIGIN,
  GOOGLE_FLOW_LEGACY_API_KEY,
  GOOGLE_FLOW_PROTOCOL_VERSION,
  GOOGLE_FLOW_TRPC_ORIGIN,
} from './protocol'
import { CAPTCHA_SLOT as BATCH_CAPTCHA_SLOT, FLOW_BATCH_PATH } from './flow-batch'

/** The project listing alone runs past 17 MB, so the cap has to be generous. */
const BATCH_MAX_RESPONSE_CHARS = 32_000_000

// Same site key extensions/logdd/injected.js uses — it's the public,
// browser-restricted reCAPTCHA Enterprise key Google Flow's own web app
// ships, not a secret.
const FLOW_SITE_KEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV'
// flow.google.com is where Google moved the signed-in Flow app; without it the
// bearer token is never captured on that origin and the account sits on "Cần làm mới".
const TOKEN_URL_PREFIXES = ['https://aisandbox-pa.googleapis.com/', 'https://labs.google/', 'https://flow.google.com/']
const MAX_RELOAD_RETRIES = 4
const RELOAD_RETRY_DELAY_MS = 6000
/**
 * Where the token actually comes from now.
 *
 * Google rebuilt the signed-in app: flow.google.com is an Angular/WIZ frontend
 * that talks to `/_/AiSandboxAngularFrontend/data/batchexecute` using cookies,
 * and puts NO `Authorization: Bearer ya29...` on the wire at all. The Network
 * listener below therefore waits forever and every account stays "Cần làm mới"
 * — which is exactly how a working account "goes dead" after any tab reload.
 *
 * The backend the runtime talks to is untouched: aisandbox-pa and the
 * labs.google tRPC mount both still answer, and this NextAuth session endpoint
 * still hands the account's OAuth token to whoever holds the profile's cookies.
 * So the token is fetched directly instead of overheard; the sniffing path is
 * kept as a fallback in case Google puts it back on the wire.
 */
const FLOW_SESSION_URL = 'https://labs.google/fx/api/auth/session'
// The token lasts ~60 min and the session endpoint reports its expiry, so poll
// often enough to renew before it lapses (and to recover an account that had no
// token at all) while staying far below one request per minute per account.
const TOKEN_POLL_INTERVAL_MS = 10 * 60 * 1000
const TOKEN_RENEW_MARGIN_MS = 15 * 60 * 1000
// Fallback cadence when the session endpoint gave no expiry.
const TOKEN_REFRESH_INTERVAL_MS = 40 * 60 * 1000

type OutgoingMessage = {
  type: string
  requestId?: string
  sessionSecret?: string
  credentialId?: string
  params?: {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: unknown
    captchaAction?: string
    responseMode?: 'json' | 'final-url'
    /** batch_rpc only — see runBatchRpc. */
    rpcid?: string
    freq?: string
    flowProjectId?: string
    match?: string
  }
}

type EvaluateResult<T> = { result?: { value?: T }; exceptionDetails?: { text?: string } }

/**
 * The Flow project a request belongs to, so the captcha step can park the tab on
 * that project's page. Image generation carries it in the path, video generation
 * only in clientContext.
 */
function flowProjectIdOf(url: string, body: unknown): string | undefined {
  const fromPath = /\/v1\/projects\/([^/]+)\//.exec(url || '')
  if (fromPath) return decodeURIComponent(fromPath[1])
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : undefined
  const context = record?.clientContext as { projectId?: unknown } | undefined
  return typeof context?.projectId === 'string' && context.projectId ? context.projectId : undefined
}

/**
 * The browser API key, but only when it is genuinely Flow's own.
 *
 * A tab does far more than call Flow: it walks through the Google sign-in
 * pages, may still be sitting on labs.google, and Chrome itself talks to a
 * handful of *.googleapis.com services — all with their own `key=AIzaSy...`
 * that is restricted to a different origin or service. Accepting one of those
 * used to break every generation on this account (and, back when the key was
 * shared, on every other account too). Only the Flow media API is ever called
 * with an explicit key, so that is the only URL worth reading one from; the
 * legacy labs.google key is rejected as well since it is already dead and
 * handleOutgoing exists precisely to replace it.
 */
function sniffFlowApiKey(url: string): string | undefined {
  if (!url.startsWith(`${GOOGLE_FLOW_API_ROOT}/`)) return undefined
  const key = /[?&]key=(AIzaSy[A-Za-z0-9_-]+)/.exec(url)?.[1]
  return key && key !== GOOGLE_FLOW_LEGACY_API_KEY ? key : undefined
}

function findAuthHeader(headers: Record<string, string> | undefined): string | undefined {
  if (!headers) return undefined
  const key = Object.keys(headers).find((name) => name.toLowerCase() === 'authorization')
  return key ? headers[key] : undefined
}

// Stands in for extensions/logdd's background.js, for one Google Flow
// account logged into an app-spawned, CDP-controlled real Chrome (see
// browser-session/session-manager.ts) instead of the user's own Chrome + a
// manually installed extension. Feeds GoogleFlowRuntime's attachSocket()
// the exact same wire protocol the extension used to send over its
// WebSocket — the runtime itself is untouched.
export class GoogleFlowInAppBridge {
  private readonly socket: FakeSocket
  private flowKey: string | undefined
  // Assigned by the runtime in its `credential_assigned` reply to our
  // handshake. Every message we send after the handshake must echo both
  // back, or attachSocket() rejects it as an "Invalid Google Flow extension
  // session" (see runtime.ts) — which is what kept the credential 'stale'.
  private sessionSecret: string | undefined
  private credentialId: string | undefined
  private disposed = false
  private readyAnnounced = false
  private reloadAttempts = 0
  private reloadTimer: ReturnType<typeof setTimeout> | undefined
  private refreshTimer: ReturnType<typeof setInterval> | undefined
  /** Expiry reported by the session endpoint, so renewal is scheduled off the real deadline. */
  private tokenExpiresAt: number | undefined
  private tokenFetchedAt = 0
  // In-flight api/trpc requests routed through this bridge. The periodic token
  // refresh reloads the page, which would abort an in-flight page fetch — so we
  // only refresh while idle.
  private pendingRequests = 0
  private readonly requestUrlById = new Map<string, string>()
  private readonly unsubscribers: Array<() => void> = []

  constructor(private readonly handle: AccountSessionHandle, private readonly runtime: GoogleFlowRuntime, private readonly onFirstReady?: () => void) {
    this.socket = new FakeSocket((json) => { void this.handleOutgoing(json) })
    this.socket.open()

    this.wireCdp()
    this.startRefreshTimer()
    // The account's Chrome can be respawned in the background (user closed
    // the window, crash, ...). Re-wire onto the fresh CDP session and force a
    // token refresh; the FakeSocket→runtime credential stays alive throughout.
    handle.onReconnect(() => {
      console.log(`[video-studio][google-flow] reconnected to respawned Chrome for account ${handle.accountSlotId}`)
      // The token belongs to the signed-in profile, not to this CDP connection,
      // so it is renewed below rather than thrown away — dropping it here is
      // what used to leave the account "ready" in the UI but failing on
      // NO_FLOW_KEY when no replacement ever arrived.
      this.reloadAttempts = 0
      if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
      this.requestUrlById.clear()
      this.wireCdp()
      this.startRefreshTimer()
      void this.fetchSessionToken()
    })

    runtime.registerInAppConnection(this.socket as unknown as WebSocket)
    // So the runtime can reach this account's own tab — the only place a
    // batch-transport account can find a Flow project id.
    runtime.registerInAppBridge(handle.accountSlotId, this)
    this.socket.receive(JSON.stringify({
      type: 'extension_ready',
      protocolVersion: GOOGLE_FLOW_PROTOCOL_VERSION,
      extensionInstanceId: handle.accountSlotId,
      flowKeyPresent: false,
    }))
    // Ask for the token straight away instead of waiting for page traffic that
    // the rebuilt Flow app no longer produces. Runs after the handshake above so
    // the credential id it echoes is already assigned.
    void this.fetchSessionToken()
  }

  private wireCdp(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe()
    this.unsubscribers.length = 0
    const cdp = this.handle.cdp
    this.unsubscribers.push(cdp.on('Network.requestWillBeSent', (params) => this.onRequestWillBeSent(params)))
    this.unsubscribers.push(cdp.on('Network.requestWillBeSentExtraInfo', (params) => this.onRequestExtraInfo(params)))
    this.unsubscribers.push(cdp.on('Page.frameNavigated', (params) => this.onFrameNavigated(params)))
    void cdp.send('Network.enable').catch(() => { /* best-effort */ })
    void cdp.send('Page.enable').catch(() => { /* best-effort */ })
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    for (const unsubscribe of this.unsubscribers) unsubscribe()
    this.runtime.unregisterInAppBridge(this.handle.accountSlotId)
    this.socket.close()
  }

  /**
   * Get a fresh bearer token for this account now.
   *
   * The session endpoint is asked first because it is the only reliable source
   * since the Flow frontend stopped sending bearer tokens. A page reload is kept
   * as the fallback for the day Google puts them back. The current token is NOT
   * dropped up front: an account that still holds a valid token must not be
   * knocked offline just because a refresh attempt failed.
   */
  async refreshToken(): Promise<void> {
    if (this.disposed) return
    if (await this.fetchSessionToken()) return
    this.reloadAttempts = 0
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
    await this.handle.cdp.send('Page.reload', { ignoreCache: false })
  }

  /**
   * Reads this profile's OAuth token off the labs.google session endpoint using
   * the account's own cookies (fetched over CDP, used for this request only and
   * never logged or persisted). Returns false when the profile is not signed in.
   */
  private async fetchSessionToken(): Promise<boolean> {
    if (this.disposed) return false
    try {
      const { cookies } = await this.handle.cdp.send<{ cookies: Array<{ name: string; value: string }> }>(
        'Network.getCookies', { urls: [FLOW_SESSION_URL] },
      )
      const cookie = (cookies || []).map((item) => `${item.name}=${item.value}`).join('; ')
      if (!cookie) return false
      const response = await fetch(FLOW_SESSION_URL, { headers: { cookie, accept: 'application/json' } })
      if (!response.ok) return false
      const session = await response.json() as { access_token?: unknown; expires?: unknown; error?: unknown; user?: { email?: unknown } }
      // Reported before the token is validated on purpose: an account whose token
      // is unusable is exactly the one the user needs to recognise by name.
      const email = typeof session.user?.email === 'string' ? session.user.email : ''
      if (email) this.runtime.updateAccountEmail(this.handle.accountSlotId, email)
      const token = typeof session.access_token === 'string' ? session.access_token : ''
      const usable = token.startsWith('ya29.')
      const who = email || this.handle.accountSlotId.slice(0, 8)
      // ACCESS_TOKEN_REFRESH_NEEDED means Google will not RENEW the bearer — not
      // that the current one is dead. Accounts carrying that flag have been seen
      // generating normally right up to the hour their token lapses, so the flag
      // alone is a warning, and only the absence of a token is a verdict. The
      // reactive switch on a real 401 catches the rest.
      if (session.error) {
        console.warn(`[video-studio][google-flow] session của ${who} báo "${String(session.error)}" — token hiện tại dùng tiếp được nhưng sẽ không được gia hạn`)
      }
      // Judged BEFORE the token guard below, not after. The old order returned on
      // the missing token first, so the accounts that most needed the switch were
      // the only ones that never got it.
      if (!usable) {
        const reason = session.error ? String(session.error) : 'session không còn access_token'
        console.warn(`[video-studio][google-flow] tài khoản ${who} không còn bearer token — chuyển sang batchexecute`)
        this.runtime.markLegacyTransportDead(this.handle.accountSlotId, reason)
        // No bearer to report, but the account is not offline: batchexecute signs
        // with the page's own session, so let the runtime treat it as connected
        // instead of leaving it parked on "Cần làm mới" forever.
        this.socket.receive(JSON.stringify({ type: 'token_captured', sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
        this.announceReadyOnce()
        return false
      }
      const expiresAt = typeof session.expires === 'string' ? Date.parse(session.expires) : Number.NaN
      this.applyToken(token, expiresAt)
      return true
    } catch {
      return false
    }
  }

  // Renew shortly before the token lapses, and keep retrying for an account that
  // has none at all — the old timer bailed out on `!this.flowKey`, so an account
  // that missed its token once stayed dead until the user poked it by hand.
  private startRefreshTimer(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    this.refreshTimer = setInterval(() => {
      if (this.disposed) return
      const expiringSoon = this.tokenExpiresAt
        ? this.tokenExpiresAt - Date.now() <= TOKEN_RENEW_MARGIN_MS
        : Date.now() - this.tokenFetchedAt >= TOKEN_REFRESH_INTERVAL_MS
      if (this.flowKey && !expiringSoon) return
      void this.fetchSessionToken()
    }, TOKEN_POLL_INTERVAL_MS)
  }

  private captureToken(auth: string | undefined): void {
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ya29.')) return
    this.applyToken(auth.slice('Bearer '.length).trim(), Number.NaN)
  }

  private applyToken(token: string, expiresAt: number): void {
    const isFirstToken = !this.flowKey
    this.flowKey = token
    this.tokenExpiresAt = Number.isFinite(expiresAt) ? expiresAt : undefined
    this.tokenFetchedAt = Date.now()
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
    this.socket.receive(JSON.stringify({ type: 'token_captured', sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
    if (isFirstToken) {
      console.log(`[video-studio][google-flow] bearer token captured for account ${this.handle.accountSlotId}`)
      this.announceReadyOnce()
    }
  }

  /**
   * Hide the login window the first time this account becomes usable — by either
   * route. Fired once: the token poll runs every ten minutes, and a bearer-less
   * account would otherwise ask for a hide on every one of them.
   */
  private announceReadyOnce(): void {
    if (this.readyAnnounced) return
    this.readyAnnounced = true
    this.onFirstReady?.()
  }

  private onRequestWillBeSent(params: { requestId?: string; request?: { url?: string; headers?: Record<string, string> } }): void {
    const url = params.request?.url || ''
    if (params.requestId) this.requestUrlById.set(params.requestId, url)
    const apiKey = sniffFlowApiKey(url)
    if (apiKey) {
      this.runtime.updateApiKey(this.handle.accountSlotId, apiKey)
    }
    if (!TOKEN_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) return
    this.captureToken(findAuthHeader(params.request?.headers))
  }

  // Network.requestWillBeSent's header snapshot is the renderer's *intent* —
  // some headers (Authorization among them, depending on Chrome version and
  // how the page set it) only show up reliably on the wire-level companion
  // event, so both are checked.
  private onRequestExtraInfo(params: { requestId?: string; headers?: Record<string, string> }): void {
    if (this.flowKey) return
    const url = params.requestId ? this.requestUrlById.get(params.requestId) : undefined
    if (url && TOKEN_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      this.captureToken(findAuthHeader(params.headers))
    }
  }

  // The token only ever shows up on a request the page makes on its own — we
  // never synthesize one. The most reliable moment to see that happen is
  // right after the user finishes signing in and lands back on the Flow app:
  // force a reload so the page's own bootstrap calls (credits, projects, ...)
  // fire while we're already listening, instead of hoping we caught them
  // during the original page load.
  private onFrameNavigated(params: { frame?: { parentId?: string; url?: string } }): void {
    if (this.flowKey || params.frame?.parentId) return
    const url = params.frame?.url || ''
    if (!/^https:\/\/(?:labs\.google\/fx\/(?:[^/]+\/)?tools\/flow|flow\.google\.com)/.test(url)) return
    // Landing here is the moment a sign-in just finished, so the session
    // endpoint has a token to give even though the page itself will never put
    // one on the wire. The reload retries below stay as the fallback.
    void this.fetchSessionToken()
    if (this.reloadTimer || this.reloadAttempts >= MAX_RELOAD_RETRIES) return
    this.reloadAttempts += 1
    const delay = this.reloadAttempts === 1 ? 2500 : RELOAD_RETRY_DELAY_MS
    this.reloadTimer = setTimeout(() => {
      this.reloadTimer = undefined
      if (this.flowKey || this.disposed) return
      console.log(`[video-studio][google-flow] reloading Flow tab to trigger token (attempt ${this.reloadAttempts}, account ${this.handle.accountSlotId})`)
      void this.handle.cdp.send('Page.reload', { ignoreCache: false }).catch(() => { /* best-effort */ })
    }, delay)
  }

  // Same rule as sniffFlowApiKey: read the page's key only while the tab is
  // actually on the signed-in Flow app, never off a sign-in or labs.google page.
  private async extractApiKeyFromTab(): Promise<void> {
    try {
      const result = await this.handle.cdp.send<EvaluateResult<string>>('Runtime.evaluate', {
        expression: `(window.location.origin === ${JSON.stringify(GOOGLE_FLOW_APP_ORIGIN)} && window.WIZ_global_data?.K21R3e) || ""`,
        returnByValue: true,
      })
      const key = result.result?.value
      if (key && typeof key === 'string' && key.startsWith('AIzaSy') && key !== GOOGLE_FLOW_LEGACY_API_KEY) {
        this.runtime.updateApiKey(this.handle.accountSlotId, key)
      }
    } catch {
      // best effort
    }
  }

  private async solveCaptcha(action: string, projectId?: string): Promise<string> {
    // Only ONE page loads reCAPTCHA now: flow.google.com/project/<id>. Since the
    // signed-in app moved off labs.google the tab lands on the site root, which
    // ships the site key in its markup but never loads the library, so every
    // generation died on "grecaptcha not available". Injecting the library is
    // not an option either — the page's CSP blocks script-src-elem for
    // www.google.com/recaptcha. So park the tab on the project page instead and
    // let Flow's own bundle load it.
    if (projectId && !(await this.hasRecaptcha())) {
      const target = `${GOOGLE_FLOW_APP_ORIGIN}/project/${encodeURIComponent(projectId)}`
      console.log(`[video-studio][google-flow] điều hướng tab sang ${target} để nạp reCAPTCHA`)
      await this.handle.cdp.send('Page.navigate', { url: target })
    }
    void this.extractApiKeyFromTab().catch(() => {})
    const expression = `(async () => {
      const key = ${JSON.stringify(FLOW_SITE_KEY)};
      const ready = () => Boolean(window.grecaptcha && window.grecaptcha.enterprise && window.grecaptcha.enterprise.execute);
      const start = Date.now();
      while (!ready()) {
        if (Date.now() - start > 30000) throw new Error('grecaptcha not available');
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await new Promise((resolve) => window.grecaptcha.enterprise.ready(resolve));
      return await window.grecaptcha.enterprise.execute(key, { action: ${JSON.stringify(action)} });
    })()`
    const result = await this.handle.cdp.send<EvaluateResult<string>>('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'CAPTCHA_FAILED')
    const token = result.result?.value
    if (!token) throw new Error('CAPTCHA_FAILED')
    return token
  }

  /**
   * Run one batchexecute RPC inside the Flow tab.
   *
   * It cannot be sent from here: the call is signed with a per-page `at` token
   * (WIZ_global_data.SNlM0e) that only exists in the loaded app, and a generate
   * also carries a single-use reCAPTCHA minted moments before. So the envelope is
   * built in the main process and the POST is executed in the page's own context.
   *
   * `match` exists because the project listing is tens of megabytes and all we
   * ever want from it is one entry — cutting it down in the page keeps that
   * payload from crossing the CDP bridge on every poll.
   */
  private async runBatchRpc(params: NonNullable<OutgoingMessage['params']>): Promise<{ status: number; text: string }> {
    const rpcid = (params.rpcid || '').trim()
    let freq = params.freq || ''
    if (!rpcid || !freq) throw new Error('batch_rpc thiếu rpcid hoặc f.req')
    if (params.captchaAction) {
      const token = await this.solveCaptcha(params.captchaAction, params.flowProjectId)
      freq = freq.split(BATCH_CAPTCHA_SLOT).join(token)
    } else {
      // No captcha to mint, so nothing has parked the tab on the app yet. The
      // token only exists once flow.google.com has actually booted.
      await this.ensureFlowAppLoaded(params.flowProjectId)
    }
    const expression = `(async () => {
      const wiz = globalThis.WIZ_global_data || {};
      const at = wiz.SNlM0e;
      if (!at) return { error: 'NO_AT_TOKEN' };
      const reqid = Math.floor(Math.random() * 900000) + 100000;
      const url = ${JSON.stringify(FLOW_BATCH_PATH)}
        + '?rpcids=' + encodeURIComponent(${JSON.stringify(rpcid)})
        + '&f.sid=' + encodeURIComponent(wiz.FdrFJe || '')
        + '&bl=' + encodeURIComponent(wiz.cfb2h || '')
        + '&hl=en&_reqid=' + reqid + '&rt=c';
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'x-same-domain': '1',
        },
        body: new URLSearchParams({ 'f.req': ${JSON.stringify(freq)}, at }),
      });
      const text = await response.text();
      const match = ${JSON.stringify(params.match ?? null)};
      if (match) {
        const found = text.indexOf(match);
        return { status: response.status, text: found === -1 ? '' : text.slice(found, found + 800) };
      }
      return { status: response.status, text: text.slice(0, ${BATCH_MAX_RESPONSE_CHARS}) };
    })()`
    const result = await this.handle.cdp.send<EvaluateResult<{ status?: number; text?: string; error?: string }>>('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'BATCH_RPC_FAILED')
    const value = result.result?.value
    if (!value) throw new Error('BATCH_RPC_FAILED')
    if (value.error) throw new Error(value.error)
    return { status: value.status ?? 0, text: value.text ?? '' }
  }

  /**
   * Flow project ids this account already owns, newest first where the page says so.
   *
   * Creating a project needs the labs.google tRPC mount, which answers 401 for any
   * account whose session Google stopped renewing — so for those the only way to
   * get a project id without making the user paste one is to read the ones the
   * Flow app itself is showing. Matched by url shape rather than by any selector,
   * so a redesign of the page cannot break it.
   */
  async listPageProjectIds(): Promise<string[]> {
    // Deliberately NOT ensureFlowAppLoaded: that waits for the `at` token, which
    // only matters for signing a request. Reading ids out of the markup needs the
    // page and nothing else, and demanding a token here made discovery fail on
    // exactly the accounts it exists to rescue.
    await this.ensureOnFlowApp()
    const expression = `(() => {
      const found = [];
      const seen = new Set();
      const push = (value) => {
        const match = /\\/project\\/([0-9a-fA-F-]{36})/.exec(value || '');
        if (match && !seen.has(match[1])) { seen.add(match[1]); found.push(match[1]); }
      };
      push(location.pathname);
      for (const anchor of document.querySelectorAll('a[href*="/project/"]')) push(anchor.getAttribute('href'));
      // The app renders its list client-side, so the ids can be in the markup
      // without ever becoming an <a href>.
      const html = document.documentElement.innerHTML;
      const re = /\\/project\\/([0-9a-fA-F-]{36})/g;
      let m;
      while ((m = re.exec(html)) !== null) { if (!seen.has(m[1])) { seen.add(m[1]); found.push(m[1]); } }
      return found.slice(0, 50);
    })()`
    const result = await this.handle.cdp.send<EvaluateResult<string[]>>('Runtime.evaluate', { expression, returnByValue: true })
    if (result.exceptionDetails) return []
    return Array.isArray(result.result?.value) ? result.result.value : []
  }

  /**
   * Park the tab on the Flow app and wait for its bootstrap data. Same reason the
   * captcha step navigates: the site root ships no `at` token, so a tab that has
   * not loaded the app cannot sign anything.
   */
  /**
   * Last resort for an account that owns no Flow project at all: press the app's
   * own "New project" button and read the id out of the url it lands on.
   *
   * Google retired the create-project API, so this is the only way left to make
   * one without the user doing it by hand. It is best-effort by nature — it
   * matches the button by its visible text, and a redesign can rename it — so
   * every caller must cope with undefined rather than depend on it.
   */
  async createPageProject(): Promise<string | undefined> {
    await this.ensureOnFlowApp()
    const before = await this.currentUrl()
    const clicked = await this.handle.cdp.send<EvaluateResult<boolean>>('Runtime.evaluate', {
      expression: `(() => {
        const wanted = /^(new project|create project|dự án mới|tạo dự án)$/i;
        const nodes = document.querySelectorAll('button, a, [role="button"]');
        for (const node of nodes) {
          const text = (node.innerText || node.textContent || '').trim();
          if (!wanted.test(text)) continue;
          node.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    }).catch(() => ({ result: { value: false } }) as EvaluateResult<boolean>)
    if (clicked.result?.value !== true) {
      console.warn(`[video-studio][google-flow] ${this.handle.accountSlotId.slice(0, 8)}: không tìm thấy nút tạo project trên trang Flow`)
      return undefined
    }
    // The app routes to /project/<uuid> once the project exists.
    const deadline = Date.now() + 20_000
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const url = await this.currentUrl()
      const match = /\/project\/([0-9a-fA-F-]{36})/.exec(url)
      if (match && url !== before) return match[1]
    }
    return undefined
  }

  /**
   * Make sure the tab is showing the Flow app, without caring whether it has
   * finished handing out a signing token. Used by the read-only page scrapes.
   */
  private async ensureOnFlowApp(): Promise<void> {
    const current = await this.currentUrl()
    if (current.startsWith(GOOGLE_FLOW_APP_ORIGIN)) {
      // Already there, but the project list is rendered client-side, so a tab that
      // only just arrived may still be an empty shell.
      await this.waitForProjectMarkup()
      return
    }
    console.log(`[video-studio][google-flow] điều hướng tab sang ${GOOGLE_FLOW_APP_ORIGIN} để đọc danh sách project`)
    await this.handle.cdp.send('Page.navigate', { url: GOOGLE_FLOW_APP_ORIGIN })
    await this.waitForProjectMarkup()
  }

  private async currentUrl(): Promise<string> {
    try {
      const result = await this.handle.cdp.send<EvaluateResult<string>>('Runtime.evaluate', {
        expression: 'String(location.href || "")', returnByValue: true,
      })
      return result.result?.value || ''
    } catch {
      return ''
    }
  }

  /** Wait until the app has rendered at least one project link, or give up quietly. */
  private async waitForProjectMarkup(): Promise<void> {
    const deadline = Date.now() + 20_000
    for (;;) {
      try {
        const result = await this.handle.cdp.send<EvaluateResult<boolean>>('Runtime.evaluate', {
          expression: '/\\/project\\/[0-9a-fA-F-]{36}/.test(document.documentElement.innerHTML || "")',
          returnByValue: true,
        })
        if (result.result?.value === true) return
      } catch {
        // Navigating tabs drop evaluations; try again until the deadline.
      }
      if (Date.now() >= deadline) return
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  private async ensureFlowAppLoaded(projectId?: string): Promise<void> {
    if (await this.hasAtToken()) return
    const target = projectId
      ? `${GOOGLE_FLOW_APP_ORIGIN}/project/${encodeURIComponent(projectId)}`
      : GOOGLE_FLOW_APP_ORIGIN
    console.log(`[video-studio][google-flow] điều hướng tab sang ${target} để nạp token trang`)
    await this.handle.cdp.send('Page.navigate', { url: target })
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (await this.hasAtToken()) return
    }
    throw new Error('NO_AT_TOKEN')
  }

  private async hasAtToken(): Promise<boolean> {
    try {
      const result = await this.handle.cdp.send<EvaluateResult<boolean>>('Runtime.evaluate', {
        expression: 'Boolean(globalThis.WIZ_global_data && globalThis.WIZ_global_data.SNlM0e)',
        returnByValue: true,
      })
      return result.result?.value === true
    } catch {
      return false
    }
  }

  /** True when the current page already exposes reCAPTCHA Enterprise. */
  private async hasRecaptcha(): Promise<boolean> {
    try {
      const result = await this.handle.cdp.send<EvaluateResult<boolean>>('Runtime.evaluate', {
        expression: 'Boolean(window.grecaptcha && window.grecaptcha.enterprise && window.grecaptcha.enterprise.execute)',
        returnByValue: true,
      })
      return result.result?.value === true
    } catch {
      return false
    }
  }

  /**
   * Sends a tRPC call from the Electron main process instead of the Flow tab.
   * Cookies are read from the tab's own profile over CDP and used only for this
   * request — they are never logged or persisted.
   */
  private async performTrpcFetch(url: string, method: string, headers: Record<string, string>, body: unknown, responseMode?: 'json' | 'final-url'): Promise<{ status: number; data: unknown }> {
    const absolute = url.startsWith('/') ? `${GOOGLE_FLOW_TRPC_ORIGIN}${url}` : url
    const origin = new URL(absolute).origin
    const { cookies } = await this.handle.cdp.send<{ cookies: Array<{ name: string; value: string }> }>(
      'Network.getCookies', { urls: [`${origin}/`] },
    )
    const cookieHeader = (cookies || []).map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
    const response = await fetch(absolute, {
      method,
      headers: {
        ...headers,
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        origin,
        referer: `${origin}/fx/tools/flow`,
      },
      body: method === 'GET' || body === undefined ? undefined : JSON.stringify(body),
      redirect: 'follow',
    })
    if (responseMode === 'final-url') {
      // Same contract as the in-tab path: hand back the signed URL and drop the
      // body so a whole MP4 never buffers in the main process.
      await response.body?.cancel().catch(() => {})
      return { status: response.status, data: { url: response.url, contentType: response.headers.get('content-type') } }
    }
    const text = await response.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = text }
    return { status: response.status, data }
  }

  private async performFetch(url: string, method: string, headers: Record<string, string>, body: unknown, responseMode?: 'json' | 'final-url'): Promise<{ status: number; data: unknown }> {
    if (responseMode === 'final-url') return this.performFinalUrlFetch(url, method, headers, body)
    const bodyLiteral = method === 'GET' ? 'undefined' : JSON.stringify(JSON.stringify(body))
    const expression = `(async () => {
      const response = await fetch(${JSON.stringify(url)}, {
        method: ${JSON.stringify(method)},
        headers: ${JSON.stringify(headers)},
        credentials: 'include',
        body: ${bodyLiteral},
      });
      const text = await response.text();
      return { status: response.status, text: text };
    })()`
    const result = await this.handle.cdp.send<EvaluateResult<{ status: number; text: string }>>('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'REQUEST_FAILED')
    const value = result.result?.value
    if (!value) throw new Error('REQUEST_FAILED')
    let data: unknown
    try { data = JSON.parse(value.text) } catch { data = value.text }
    return { status: value.status, data }
  }

  private async performFinalUrlFetch(url: string, method: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; data: unknown }> {
    const bodyLiteral = method === 'GET' ? 'undefined' : JSON.stringify(JSON.stringify(body))
    let redirectRequestId: string | undefined
    let unsubscribe = () => {}
    let timer: ReturnType<typeof setTimeout> | undefined

    const redirectedUrl = new Promise<string>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('MEDIA_REDIRECT_TIMEOUT')), 15_000)
      unsubscribe = this.handle.cdp.on('Network.requestWillBeSent', (params: {
        requestId?: string
        request?: { url?: string }
      }) => {
        const requestUrl = params.request?.url || ''
        if (!redirectRequestId && requestUrl === url) {
          redirectRequestId = params.requestId
          return
        }
        if (redirectRequestId && params.requestId === redirectRequestId && /^https:\/\/flow-content\.google\/video\//i.test(requestUrl)) {
          resolve(requestUrl)
        }
      })
    })

    const expression = `(async () => {
      try {
        const response = await fetch(${JSON.stringify(url)}, {
          method: ${JSON.stringify(method)},
          headers: ${JSON.stringify(headers)},
          credentials: 'include',
          body: ${bodyLiteral},
        });
        const result = { status: response.status, finalUrl: response.url };
        if (response.body) await response.body.cancel().catch(() => {});
        return result;
      } catch (error) {
        return { error: String(error) };
      }
    })()`

    try {
      const evaluated = this.handle.cdp.send<EvaluateResult<{ status?: number; finalUrl?: string; error?: string }>>('Runtime.evaluate', {
        expression, awaitPromise: true, returnByValue: true,
      }).then((result) => {
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'REQUEST_FAILED')
        const value = result.result?.value
        if (!value) throw new Error('REQUEST_FAILED')
        if (value.finalUrl && /^https:\/\/flow-content\.google\/video\//i.test(value.finalUrl)) return value.finalUrl
        if (value.error) throw new Error(value.error)
        return { status: value.status || 500, url: value.finalUrl || url }
      })
      const result = await Promise.race([redirectedUrl, evaluated])
      if (typeof result === 'string') return { status: 200, data: { url: result } }
      return { status: result.status, data: { url: result.url } }
    } finally {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }

  private async handleOutgoing(json: string): Promise<void> {
    let message: OutgoingMessage
    try { message = JSON.parse(json) } catch { return }
    // The runtime's handshake reply carries the session secret we must echo
    // on every later message.
    if (message.type === 'credential_assigned') {
      this.sessionSecret = message.sessionSecret
      this.credentialId = message.credentialId
      return
    }
    if (message.type !== 'api_request' && message.type !== 'trpc_request' && message.type !== 'batch_rpc') return
    const requestId = message.requestId
    const params = message.params
    if (!requestId || !params) return
    this.pendingRequests += 1
    if (message.type === 'batch_rpc') {
      try {
        const result = await this.runBatchRpc(params)
        this.socket.receive(JSON.stringify({ id: requestId, status: result.status, data: result.text, sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
      } catch (error) {
        this.socket.receive(JSON.stringify({ id: requestId, error: error instanceof Error ? error.message : String(error), sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
      } finally {
        this.pendingRequests = Math.max(0, this.pendingRequests - 1)
      }
      return
    }
    // Only batch_rpc is url-less, and it returned above.
    const url = params.url
    if (!url) {
      this.socket.receive(JSON.stringify({ id: requestId, error: 'Google Flow request thiếu url', sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
      this.pendingRequests = Math.max(0, this.pendingRequests - 1)
      return
    }
    try {
      let captchaToken: string | undefined
      if (params.captchaAction) captchaToken = await this.solveCaptcha(params.captchaAction, flowProjectIdOf(url, params.body))

      let body = params.body
      if (captchaToken && body && typeof body === 'object') {
        body = JSON.parse(JSON.stringify(body))
        const record = body as Record<string, unknown>
        const context = record.clientContext as { recaptchaContext?: { token?: string } } | undefined
        if (context?.recaptchaContext) context.recaptchaContext.token = captchaToken
        const requests = record.requests as Array<{ clientContext?: { recaptchaContext?: { token?: string } } }> | undefined
        if (Array.isArray(requests)) {
          for (const item of requests) {
            if (item.clientContext?.recaptchaContext) item.clientContext.recaptchaContext.token = captchaToken
          }
        }
      }

      // Last-chance recovery: an account whose token never arrived (or expired
      // between polls) fixes itself here instead of failing the generation.
      if (!this.flowKey) await this.fetchSessionToken()
      if (!this.flowKey) throw new Error('NO_FLOW_KEY')
      const headers: Record<string, string> = { ...(params.headers || {}), authorization: `Bearer ${this.flowKey}` }
      const method = params.method || 'POST'
      let requestUrl = url
      // This account's own key (never another account's), and never the legacy
      // one — updateApiKey refuses to store it — so the swap below can no longer
      // degrade into replacing the dead key with itself.
      const currentApiKey = this.runtime.getApiKey(this.handle.accountSlotId)
      if (requestUrl.includes(GOOGLE_FLOW_LEGACY_API_KEY)) {
        requestUrl = requestUrl.replace(GOOGLE_FLOW_LEGACY_API_KEY, currentApiKey)
      }

      // tRPC goes out from Node, everything else stays in the tab. Google moved
      // the signed-in app to flow.google.com while tRPC stayed on labs.google,
      // so an in-tab fetch is now cross-origin and dies as "Failed to fetch".
      // The main process has no CORS, and the tab's own cookies + captured
      // bearer token are all the authentication these endpoints need.
      let { status, data } = message.type === 'trpc_request'
        ? await this.performTrpcFetch(requestUrl, method, headers, body, params.responseMode)
        : await this.performFetch(requestUrl, method, headers, body, params.responseMode)

      if (message.type !== 'trpc_request' && this.isReferrerBlocked(status, data)) {
        console.warn(`[video-studio][google-flow] in-tab fetch bị chặn Referer (HTTP ${status}), chuyển sang gửi từ Node main process`)
        const fallback = await this.performNodeApiFetch(requestUrl, method, headers, body, params.responseMode)
        status = fallback.status
        data = fallback.data
      }

      this.socket.receive(JSON.stringify({ id: requestId, status, data, sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
    } catch (error) {
      this.socket.receive(JSON.stringify({ id: requestId, error: error instanceof Error ? error.message : String(error), sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
    } finally {
      this.pendingRequests = Math.max(0, this.pendingRequests - 1)
    }
  }

  private isReferrerBlocked(status: number, data: unknown): boolean {
    if (status !== 403 || !data) return false
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return str.includes('API_KEY_HTTP_REFERRER_BLOCKED') || str.includes('Requests from referer')
  }

  private async performNodeApiFetch(url: string, method: string, headers: Record<string, string>, body: unknown, responseMode?: 'json' | 'final-url'): Promise<{ status: number; data: unknown }> {
    const origin = 'https://labs.google'
    const { cookies } = await this.handle.cdp.send<{ cookies: Array<{ name: string; value: string }> }>(
      'Network.getCookies', { urls: ['https://aisandbox-pa.googleapis.com/', 'https://labs.google/', 'https://flow.google.com/'] },
    ).catch(() => ({ cookies: [] }))
    const cookieHeader = (cookies || []).map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
    const reqHeaders: Record<string, string> = {
      ...headers,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      origin,
      referer: `${origin}/fx/tools/flow`,
    }
    const response = await fetch(url, {
      method,
      headers: reqHeaders,
      body: method === 'GET' || body === undefined ? undefined : JSON.stringify(body),
      redirect: 'follow',
    })
    if (responseMode === 'final-url') {
      await response.body?.cancel().catch(() => {})
      return { status: response.status, data: { url: response.url, contentType: response.headers.get('content-type') } }
    }
    const text = await response.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = text }
    return { status: response.status, data }
  }
}
