import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { net } from 'electron'
import type { WebSocket } from 'ws'
import { FakeSocket } from '../browser-session/fake-socket'
import type { AccountSessionHandle } from '../browser-session/session-manager'
import type { GrokVideoRuntime } from './runtime'
import { GROK_PROTOCOL_VERSION, isAllowedGrokMediaUrl } from './protocol'

const COMMAND_CHANNEL = 'LOGDD_GROK_COMMAND_V1'
const EVENT_CHANNEL = 'LOGDD_GROK_EVENT_V1'
const BINDING_NAME = '__logddGrokToNode'
const POLL_INTERVAL_MS = 2500

// MAIN-world adapter that replaces extensions/logdd/grok-content.js: relays
// the page-bridge's EVENT_CHANNEL postMessages (task events + download
// chunks) up to Node via a CDP binding. The Node→page direction (commands)
// is driven from handleOutgoing() via Runtime.evaluate, and readiness is
// polled from Node, so the adapter only needs the page→Node event half.
const ADAPTER_SCRIPT = `(function () {
  if (window.__logddGrokCdpAdapter) return;
  window.__logddGrokCdpAdapter = true;
  var EVENT_CHANNEL = ${JSON.stringify(EVENT_CHANNEL)};
  // Two concurrent lanes on one account emit task-events back to back. A
  // fire-and-forget try/catch around the CDP binding call used to silently
  // drop an event (e.g. a transient binding-not-ready race) — losing a
  // 'completed' event this way means Node never learns the video is done and
  // the task hangs until its 5-minute timeout. Queue instead, and retry the
  // whole FIFO queue until the binding call stops throwing, so no event is
  // ever silently lost.
  var pendingToNode = [];
  var flushScheduled = false;
  function flushToNode() {
    flushScheduled = false;
    while (pendingToNode.length) {
      try {
        window[${JSON.stringify(BINDING_NAME)}](pendingToNode[0]);
        pendingToNode.shift();
      } catch (e) {
        if (!flushScheduled) { flushScheduled = true; setTimeout(flushToNode, 100); }
        return;
      }
    }
  }
  function toNode(obj) {
    pendingToNode.push(JSON.stringify(obj));
    flushToNode();
  }
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var d = event.data;
    if (!d || d.channel !== EVENT_CHANNEL) return;
    if (d.type === 'task-event') toNode({ kind: 'task-event', event: d.event });
    else if (d.type === 'quota-status') toNode({ kind: 'quota-status', quota: d.quota });
  });
})();`

function isUsableGrokPageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const isApiDocument = /^\/(?:rest|api|grok_api|grok_api_v2)(?:\/|\.|$)/i.test(url.pathname)
    return url.protocol === 'https:'
      && (url.hostname === 'grok.com' || url.hostname.endsWith('.grok.com'))
      && !isApiDocument
  } catch {
    return false
  }
}

// Stands in for extensions/logdd's grok-background.js + grok-content.js, for
// one Grok account logged into an app-spawned, CDP-controlled real Chrome.
// The heavy page-side work (statsig capture, Grok UI DOM automation,
// streaming download) is done by the unchanged grok-page-bridge.js, injected
// into the page over CDP instead of by the extension. Feeds
// GrokVideoRuntime.attachSocket() the exact same wire protocol the extension
// used to send over its WebSocket — the runtime itself is untouched.
export class GrokInAppBridge {
  private readonly socket: FakeSocket
  private readonly pageBridgeSource: string
  private grokReady = false
  private disposed = false
  // Real login proof: the Grok Imagine page calls /rest/media/imagine/quota_info
  // (an authenticated endpoint) on load, and the injected page bridge reports
  // its response as a quota-status event. Seeing one means we are genuinely
  // signed in — whether video quota is left or exhausted — which a bare URL
  // check cannot tell us.
  private quotaSeen = false
  private videoAvailable: boolean | undefined
  private video720pAvailable: boolean | undefined
  private weeklyUsagePercent: number | undefined
  private quotaCheckedAt: number | undefined
  private usablePollsWithoutQuota = 0
  private reloadTriggered = false
  private pollTimer: ReturnType<typeof setInterval> | undefined
  private readonly unsubscribers: Array<() => void> = []

  constructor(private readonly handle: AccountSessionHandle, runtime: GrokVideoRuntime, extensionPath: string, private readonly mediaRoot: string, private readonly onFirstReady?: () => void) {
    this.pageBridgeSource = fs.readFileSync(path.join(extensionPath, 'grok-page-bridge.js'), 'utf8')
    this.socket = new FakeSocket((json) => { void this.handleOutgoing(json) })
    this.socket.open()

    void this.wireCdp()
    handle.onReconnect(() => {
      console.log(`[video-studio][grok] reconnected to respawned Chrome for account ${handle.accountSlotId}`)
      this.grokReady = false
      this.quotaSeen = false
      this.videoAvailable = undefined
      this.video720pAvailable = undefined
      this.weeklyUsagePercent = undefined
      this.quotaCheckedAt = undefined
      this.usablePollsWithoutQuota = 0
      this.reloadTriggered = false
      void this.wireCdp()
    })

    runtime.registerInAppConnection(this.socket as unknown as WebSocket)
    this.socket.receive(JSON.stringify({
      type: 'grok_extension_ready',
      protocolVersion: GROK_PROTOCOL_VERSION,
      extensionInstanceId: handle.accountSlotId,
      grokReady: false,
      pageUrl: '',
    }))
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.pollTimer) clearInterval(this.pollTimer)
    for (const unsubscribe of this.unsubscribers) unsubscribe()
    this.socket.close()
  }

  private async wireCdp(): Promise<void> {
    for (const unsubscribe of this.unsubscribers) unsubscribe()
    this.unsubscribers.length = 0
    const cdp = this.handle.cdp
    this.unsubscribers.push(cdp.on('Runtime.bindingCalled', (params) => this.onBinding(params)))
    // Diagnostics only: surface the page's own console.warn/error calls and
    // uncaught exceptions in the Node log, prefixed per account. Two lanes
    // sharing one Grok tab is new territory — if a video still gets stuck
    // after the queued-delivery fix above, this is what will show why.
    this.unsubscribers.push(cdp.on('Runtime.consoleAPICalled', (params) => this.onConsoleMessage(params)))
    this.unsubscribers.push(cdp.on('Runtime.exceptionThrown', (params) => this.onExceptionThrown(params)))
    try {
      await cdp.send('Runtime.enable')
      await cdp.send('Page.enable')
      await cdp.send('Runtime.addBinding', { name: BINDING_NAME })
      // Future full navigations (the OAuth/login hops) install the scripts at
      // document_start, matching the extension's run_at.
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: this.pageBridgeSource })
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: ADAPTER_SCRIPT })
    } catch (error) {
      console.error('[video-studio][grok] failed to wire CDP:', error)
    }
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => { void this.pollReady() }, POLL_INTERVAL_MS)
    void this.pollReady()
  }

  // Readiness is polled rather than driven off navigation events (Grok's login
  // bounces through cross-origin redirects and event pings raced/flickered).
  // Being on grok.com/imagine is necessary but NOT sufficient — the page shows
  // even when signed out. The real gate is having observed a quota_info
  // response (this.quotaSeen), which only succeeds while authenticated. If we
  // sit on /imagine without a quota signal, reload once to re-trigger the
  // page's own quota_info call so the page bridge can capture it.
  private async pollReady(): Promise<void> {
    if (this.disposed) return
    const cdp = this.handle.cdp
    let value: { href?: string; installed?: boolean; adapter?: boolean } | undefined
    try {
      const result = await cdp.send<{ result?: { value?: { href?: string; installed?: boolean; adapter?: boolean } } }>('Runtime.evaluate', {
        expression: '({ href: location.href, installed: !!window.__logddGrokPageBridgeInstalled, adapter: !!window.__logddGrokCdpAdapter })',
        returnByValue: true,
      })
      value = result?.result?.value
    } catch {
      return // page mid-navigation — try again next tick
    }
    if (!value) return
    const href = String(value.href || '')
    if (!value.installed || !value.adapter) {
      try {
        await cdp.send('Runtime.evaluate', { expression: this.pageBridgeSource })
        await cdp.send('Runtime.evaluate', { expression: ADAPTER_SCRIPT })
      } catch { /* retry next tick */ }
    }
    if (!isUsableGrokPageUrl(href)) {
      // Off grok.com (e.g. still on the sign-in page) — not ready, and reset so
      // a later return to /imagine re-checks quota from scratch.
      this.usablePollsWithoutQuota = 0
      this.reloadTriggered = false
      this.quotaSeen = false
      this.videoAvailable = undefined
      this.video720pAvailable = undefined
      this.weeklyUsagePercent = undefined
      this.quotaCheckedAt = undefined
      if (this.grokReady) { console.log(`[video-studio][grok] left grok page (${href}) for account ${this.handle.accountSlotId}`); this.grokReady = false }
      this.socket.receive(JSON.stringify({ type: 'grok_page_state', grokReady: false, quotaSeen: false, pageUrl: href }))
      return
    }
    if (this.quotaSeen) {
      if (!this.grokReady) {
        console.log(`[video-studio][grok] logged in — quota seen (720p ${this.videoAvailable && this.video720pAvailable ? 'available' : 'exhausted/unknown'}) for account ${this.handle.accountSlotId}`)
        this.grokReady = true
        this.onFirstReady?.()
      }
      this.socket.receive(JSON.stringify({
        type: 'grok_page_ready',
        pageUrl: href,
        quotaSeen: true,
        videoAvailable: this.videoAvailable === true && this.video720pAvailable === true,
        weeklyUsagePercent: this.weeklyUsagePercent,
        quotaCheckedAt: this.quotaCheckedAt,
      }))
      return
    }
    // On /imagine but no quota response observed yet — likely mid-login, or the
    // page loaded before our interceptor was in place. Nudge it once.
    this.usablePollsWithoutQuota += 1
    if (this.usablePollsWithoutQuota >= 2 && !this.reloadTriggered) {
      this.reloadTriggered = true
      console.log(`[video-studio][grok] on /imagine without quota yet — reloading once to re-trigger quota_info (account ${this.handle.accountSlotId})`)
      void cdp.send('Page.reload', { ignoreCache: false }).catch(() => { /* best-effort */ })
    }
    this.socket.receive(JSON.stringify({ type: 'grok_page_state', grokReady: false, pageUrl: href }))
  }

  private onConsoleMessage(params: { type?: string; args?: Array<{ value?: unknown; description?: unknown }> }): void {
    if (params.type !== 'warning' && params.type !== 'error') return
    const text = (params.args || [])
      .map((arg) => (arg?.value !== undefined ? String(arg.value) : String(arg?.description ?? '')))
      .join(' ')
      .trim()
    if (!text) return
    console.warn(`[video-studio][grok][page:${this.handle.accountSlotId}] ${text}`)
  }

  private onExceptionThrown(params: { exceptionDetails?: { text?: string; exception?: { description?: unknown } } }): void {
    const detail = params.exceptionDetails
    const message = detail?.exception?.description ?? detail?.text ?? 'unknown error'
    console.error(`[video-studio][grok][page:${this.handle.accountSlotId}] uncaught: ${String(message)}`)
  }

  private onBinding(params: { name?: string; payload?: string }): void {
    if (params.name !== BINDING_NAME || !params.payload) return
    let message: { kind?: string; event?: Record<string, unknown>; quota?: { videoAvailable?: boolean; video720pAvailable?: boolean; weeklyUsagePercent?: number; checkedAt?: number } }
    try { message = JSON.parse(params.payload) } catch { return }
    if (message.kind === 'task-event' && message.event) {
      const event = message.event
      const result = event.result as { remoteUrl?: string; mediaId?: string; localUrl?: string } | undefined
      // The page reports completion with just the video URL now — download it
      // here in Node (using the page's cookies) instead of streaming the whole
      // file back as base64 chunks. Forward the completed event only once the
      // file is on disk, with localUrl filled in.
      if (event.status === 'completed' && result?.remoteUrl && !result.localUrl) {
        void this.downloadAndForward(event, result.remoteUrl, result.mediaId)
        return
      }
      this.socket.receive(JSON.stringify({ type: 'grok_task_event', ...event }))
      return
    }
    if (message.kind === 'quota-status') {
      // A quota_info response came back — proof we are authenticated. The next
      // poll flips readiness on.
      this.quotaSeen = true
      this.videoAvailable = message.quota?.videoAvailable === true
      this.video720pAvailable = message.quota?.video720pAvailable === true
      this.weeklyUsagePercent = typeof message.quota?.weeklyUsagePercent === 'number'
        ? Math.max(0, Math.min(100, message.quota.weeklyUsagePercent))
        : undefined
      this.quotaCheckedAt = typeof message.quota?.checkedAt === 'number' ? message.quota.checkedAt : Date.now()
      this.socket.receive(JSON.stringify({
        type: 'grok_quota_status',
        quotaSeen: true,
        // Grok runtime uses this as the lane eligibility flag. Video Studio
        // never falls back to 480p, so only a 720p-capable account is ready.
        videoAvailable: this.videoAvailable && this.video720pAvailable,
        weeklyUsagePercent: this.weeklyUsagePercent,
        quotaCheckedAt: this.quotaCheckedAt,
      }))
    }
  }

  private async downloadAndForward(event: Record<string, unknown>, remoteUrl: string, mediaId: unknown): Promise<void> {
    const requestId = event.requestId
    const taskId = event.taskId
    try {
      this.socket.receive(JSON.stringify({ type: 'grok_task_event', requestId, taskId, status: 'downloading', progress: 98 }))
      const localUrl = await this.downloadVideo(remoteUrl, typeof mediaId === 'string' ? mediaId : randomUUID())
      const result = { ...(event.result as Record<string, unknown>), localUrl }
      this.socket.receive(JSON.stringify({ type: 'grok_task_event', ...event, status: 'completed', result }))
    } catch (error) {
      this.socket.receive(JSON.stringify({
        type: 'grok_task_event', requestId, taskId,
        status: 'failed', error: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  // Download the finished video in the main process, authenticating with the
  // account's own Grok cookies (read over CDP). This replaces streaming the
  // whole file back as base64 chunks over the CDP binding, which stalled on
  // large videos and blocked the account's single lane.
  private async downloadVideo(remoteUrl: string, mediaId: string): Promise<string> {
    if (!isAllowedGrokMediaUrl(remoteUrl)) throw new Error('Grok returned an invalid video URL')
    const { cookies } = await this.handle.cdp.send<{ cookies: Array<{ name: string; value: string }> }>('Network.getCookies', { urls: [remoteUrl] })
    const cookieHeader = (cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')
    // Previously unbounded: a stalled fetch (e.g. two lanes downloading at
    // once) would silently hang until the task's outer 5-minute timeout,
    // giving no clue what actually happened. Fail fast with a specific error.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4 * 60_000)
    let response: Response
    try {
      response = await net.fetch(remoteUrl, { headers: cookieHeader ? { Cookie: cookieHeader } : {}, signal: controller.signal })
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Grok video download timed out after 4 minutes')
      throw error
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) throw new Error(`Grok video download failed (${response.status})`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 500_000_000) throw new Error('Grok video exceeds 500 MB')
    if (bytes.length < 12 || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Grok result is not a valid MP4')
    const outputDir = path.join(this.mediaRoot, 'videos')
    fs.mkdirSync(outputDir, { recursive: true })
    const safeId = mediaId.replace(/[^a-z0-9_-]/gi, '').slice(0, 80) || randomUUID()
    const filename = `grok-${safeId}-${Date.now()}.mp4`
    fs.writeFileSync(path.join(outputDir, filename), bytes)
    return `local-image://videos/${encodeURIComponent(filename)}`
  }

  private async handleOutgoing(json: string): Promise<void> {
    let message: { type?: string; requestId?: string; taskId?: string; payload?: unknown }
    try { message = JSON.parse(json) } catch { return }
    if (message.type === 'grok_generate_video' || message.type === 'grok_cancel_video') {
      const command = {
        channel: COMMAND_CHANNEL,
        type: message.type === 'grok_generate_video' ? 'generate-video' : 'cancel-video',
        requestId: message.requestId,
        taskId: message.taskId,
        payload: message.payload,
      }
      const expression = `window.postMessage(${JSON.stringify(command)}, window.location.origin)`
      try {
        await this.handle.cdp.send('Runtime.evaluate', { expression })
      } catch (error) {
        // If the page/CDP is momentarily gone, report the task as failed so
        // the runtime's pending promise doesn't hang until timeout.
        if (message.type === 'grok_generate_video' && message.requestId) {
          this.socket.receive(JSON.stringify({
            type: 'grok_task_event', requestId: message.requestId, taskId: message.taskId,
            status: 'failed', error: error instanceof Error ? error.message : String(error),
          }))
        }
      }
    }
    if (message.type === 'grok_refresh_quota') {
      const command = { channel: COMMAND_CHANNEL, type: 'refresh-quota' }
      const expression = `window.postMessage(${JSON.stringify(command)}, window.location.origin)`
      try {
        await this.handle.cdp.send('Runtime.evaluate', { expression })
      } catch { /* best-effort — the caller only waits with a timeout */ }
    }
    // grok_credential_assigned / pong need no action.
  }
}
