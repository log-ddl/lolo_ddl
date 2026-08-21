import http from 'node:http'
import { WebSocket } from 'ws'

export type CdpTarget = { id: string; type: string; url: string; webSocketDebuggerUrl: string }

// Minimal Chrome DevTools Protocol client — just enough to drive an
// app-spawned real Chrome (Network domain for passive header capture,
// Runtime.evaluate for running page JS, Page domain for reloads) without
// pulling in playwright or puppeteer as a dependency. Talks to the
// --remote-debugging-port endpoint over the same `ws` package the
// google-flow / grok runtimes already depend on.
export function fetchCdpTargets(port: number): Promise<CdpTarget[]> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/json/list', timeout: 3000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data) as CdpTarget[]) } catch (error) { reject(error as Error) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('CDP target discovery timed out')))
  })
}

export async function waitForCdpEndpoint(port: number, timeoutMs: number): Promise<CdpTarget[]> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const targets = await fetchCdpTargets(port)
      if (targets.some((t) => t.type === 'page')) return targets
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`Chrome DevTools endpoint on port ${port} never came up: ${String(lastError)}`)
}

type PendingCall = { resolve: (value: unknown) => void; reject: (error: Error) => void }

export class CdpSession {
  private nextId = 1
  private readonly pending = new Map<number, PendingCall>()
  private readonly eventListeners = new Map<string, Set<(params: any) => void>>()
  private readonly closeListeners = new Set<() => void>()
  private closed = false

  private constructor(private readonly ws: WebSocket) {
    ws.on('message', (raw) => {
      let message: { id?: number; method?: string; params?: unknown; result?: unknown; error?: { message?: string } }
      try { message = JSON.parse(raw.toString()) } catch { return }
      if (typeof message.id === 'number') {
        const call = this.pending.get(message.id)
        if (!call) return
        this.pending.delete(message.id)
        if (message.error) call.reject(new Error(message.error.message || 'CDP call failed'))
        else call.resolve(message.result)
        return
      }
      if (typeof message.method === 'string') {
        const listeners = this.eventListeners.get(message.method)
        if (listeners) for (const listener of listeners) listener(message.params)
      }
    })
    ws.on('close', () => { this.markClosed() })
  }

  private markClosed(): void {
    if (this.closed) return
    this.closed = true
    for (const call of this.pending.values()) call.reject(new Error('CDP session is closed'))
    this.pending.clear()
    for (const listener of this.closeListeners) listener()
  }

  onClose(listener: () => void): () => void {
    if (this.closed) { listener(); return () => {} }
    this.closeListeners.add(listener)
    return () => { this.closeListeners.delete(listener) }
  }

  static connect(webSocketDebuggerUrl: string): Promise<CdpSession> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
      ws.once('open', () => resolve(new CdpSession(ws)))
      ws.once('error', reject)
    })
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (this.closed) return Promise.reject(new Error('CDP session is closed'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(method: string, listener: (params: any) => void): () => void {
    let set = this.eventListeners.get(method)
    if (!set) { set = new Set(); this.eventListeners.set(method, set) }
    set.add(listener)
    return () => { set!.delete(listener) }
  }

  get isClosed(): boolean { return this.closed }

  close(): void {
    if (this.closed) { try { this.ws.close() } catch { /* already closing */ } ; return }
    this.markClosed()
    try { this.ws.close() } catch { /* already closing */ }
  }
}
