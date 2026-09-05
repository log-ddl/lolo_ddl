import type { WebSocket } from 'ws'
import { FakeSocket } from '../browser-session/fake-socket'
import type { AccountSessionHandle } from '../browser-session/session-manager'
import type { GoogleFlowRuntime } from './runtime'
import {
  GOOGLE_FLOW_APP_ORIGIN,
  GOOGLE_FLOW_BROWSER_API_KEY,
  GOOGLE_FLOW_LEGACY_API_KEY,
  GOOGLE_FLOW_PROTOCOL_VERSION,
  GOOGLE_FLOW_TRPC_ORIGIN,
} from './protocol'

// Same site key extensions/logdd/injected.js uses — it's the public,
// browser-restricted reCAPTCHA Enterprise key Google Flow's own web app
// ships, not a secret.
const FLOW_SITE_KEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV'
// flow.google.com is where Google moved the signed-in Flow app; without it the
// bearer token is never captured on that origin and the account sits on "Cần làm mới".
const TOKEN_URL_PREFIXES = ['https://aisandbox-pa.googleapis.com/', 'https://labs.google/', 'https://flow.google.com/']
const MAX_RELOAD_RETRIES = 4
const RELOAD_RETRY_DELAY_MS = 6000
// The Google OAuth bearer token (ya29...) lasts ~60 min. Reload the hidden
// Flow tab a bit before that so the page re-fetches a fresh token (which the
// Network listener captures) — otherwise the account goes "Cần làm mới" and
// the user has to poke it manually.
const TOKEN_REFRESH_INTERVAL_MS = 40 * 60 * 1000

type OutgoingMessage = {
  type: string
  requestId?: string
  sessionSecret?: string
  credentialId?: string
  params?: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: unknown
    captchaAction?: string
    responseMode?: 'json' | 'final-url'
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
  private reloadAttempts = 0
  private reloadTimer: ReturnType<typeof setTimeout> | undefined
  private refreshTimer: ReturnType<typeof setInterval> | undefined
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
      this.flowKey = undefined
      this.reloadAttempts = 0
      if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
      this.requestUrlById.clear()
      this.wireCdp()
      this.startRefreshTimer()
    })

    runtime.registerInAppConnection(this.socket as unknown as WebSocket)
    this.socket.receive(JSON.stringify({
      type: 'extension_ready',
      protocolVersion: GOOGLE_FLOW_PROTOCOL_VERSION,
      extensionInstanceId: handle.accountSlotId,
      flowKeyPresent: false,
    }))
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
    this.socket.close()
  }

  /** Force the hidden Flow page to fetch a fresh bearer token now. */
  async refreshToken(): Promise<void> {
    if (this.disposed) return
    this.flowKey = undefined
    this.reloadAttempts = 0
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
    await this.handle.cdp.send('Page.reload', { ignoreCache: false })
  }

  // Periodically reload the hidden Flow tab so its bootstrap requests carry a
  // fresh OAuth token before the current one expires. Skips while a request is
  // in flight (a reload would abort it) — the next tick, or that request's own
  // page traffic, refreshes the token instead.
  private startRefreshTimer(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    this.refreshTimer = setInterval(() => {
      if (this.disposed || !this.flowKey || this.pendingRequests > 0 || this.reloadTimer) return
      console.log(`[video-studio][google-flow] periodic token refresh — reloading Flow tab for account ${this.handle.accountSlotId}`)
      void this.handle.cdp.send('Page.reload', { ignoreCache: false }).catch(() => { /* best-effort */ })
    }, TOKEN_REFRESH_INTERVAL_MS)
  }

  private captureToken(auth: string | undefined): void {
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ya29.')) return
    const isFirstToken = !this.flowKey
    this.flowKey = auth.slice('Bearer '.length).trim()
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = undefined }
    this.socket.receive(JSON.stringify({ type: 'token_captured', sessionSecret: this.sessionSecret, credentialId: this.credentialId }))
    if (isFirstToken) {
      console.log(`[video-studio][google-flow] bearer token captured for account ${this.handle.accountSlotId}`)
      this.onFirstReady?.()
    }
  }

  private onRequestWillBeSent(params: { requestId?: string; request?: { url?: string; headers?: Record<string, string> } }): void {
    const url = params.request?.url || ''
    if (params.requestId) this.requestUrlById.set(params.requestId, url)
    const keyMatch = /[?&]key=(AIzaSy[A-Za-z0-9_-]+)/.exec(url)
    if (keyMatch) {
      this.runtime.updateApiKey(keyMatch[1])
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

  private async extractApiKeyFromTab(): Promise<void> {
    try {
      const result = await this.handle.cdp.send<EvaluateResult<string>>('Runtime.evaluate', {
        expression: 'window.WIZ_global_data?.K21R3e || ""',
        returnByValue: true,
      })
      const key = result.result?.value
      if (key && typeof key === 'string' && key.startsWith('AIzaSy')) {
        this.runtime.updateApiKey(key)
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
    if (message.type !== 'api_request' && message.type !== 'trpc_request') return
    const requestId = message.requestId
    const params = message.params
    if (!requestId || !params) return
    this.pendingRequests += 1
    try {
      let captchaToken: string | undefined
      if (params.captchaAction) captchaToken = await this.solveCaptcha(params.captchaAction, flowProjectIdOf(params.url, params.body))

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

      if (!this.flowKey) throw new Error('NO_FLOW_KEY')
      const headers: Record<string, string> = { ...(params.headers || {}), authorization: `Bearer ${this.flowKey}` }
      const method = params.method || 'POST'
      let requestUrl = params.url
      const currentApiKey = this.runtime.getCurrentApiKey() || GOOGLE_FLOW_BROWSER_API_KEY
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
