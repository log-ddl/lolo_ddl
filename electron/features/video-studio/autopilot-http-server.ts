import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import type { WebContents } from 'electron'

export const AUTOPILOT_DEFAULT_PORT = 8787
export const AUTOPILOT_HOST = '127.0.0.1'

interface PendingRequest {
  res: ServerResponse
  isSse: boolean
}

/**
 * Local HTTP server exposing the AutoPilot engine to external agents
 * (CLI tools, browser extensions, other apps on the same machine).
 * Binds to 127.0.0.1 only. Requests are forwarded to the renderer via IPC;
 * the renderer routes them to the engine and existing runtimes.
 */
export class AutopilotHttpServer {
  private server: ReturnType<typeof createServer> | null = null
  private port = AUTOPILOT_DEFAULT_PORT
  private pending = new Map<string, PendingRequest>()
  private getWebContents: (() => WebContents | null) | null = null

  start(getWebContents: () => WebContents | null): void {
    if (this.server) return
    this.getWebContents = getWebContents
    this.server = createServer((req, res) => { void this.handleRequest(req, res) })
    this.server.listen(this.port, AUTOPILOT_HOST)
  }

  stop(): void {
    if (!this.server) return
    for (const pending of this.pending.values()) {
      try { pending.res.end() } catch { /* ignore */ }
    }
    this.pending.clear()
    this.server.close()
    this.server = null
  }

  getPort(): number {
    return this.port
  }

  isRunning(): boolean {
    return this.server !== null
  }

  handleSseEvent(requestId: string, event: unknown): void {
    const pending = this.pending.get(requestId)
    if (!pending || !pending.isSse) return
    try {
      pending.res.write(`data: ${JSON.stringify(event)}\n\n`)
    } catch { /* client gone */ }
  }

  handleResponse(requestId: string, status: number, body: unknown): void {
    const pending = this.pending.get(requestId)
    if (!pending) return
    this.pending.delete(requestId)
    try {
      if (pending.isSse) {
        pending.res.write(`data: ${JSON.stringify({ type: 'done', status, body })}\n\n`)
        pending.res.end()
        return
      }
      const text = JSON.stringify(body ?? {})
      pending.res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(text),
        'Access-Control-Allow-Origin': '*',
      })
      pending.res.end(text)
    } catch { /* client gone */ }
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const webContents = this.getWebContents?.() ?? null
    const url = new URL(req.url ?? '/', `http://${AUTOPILOT_HOST}:${this.port}`)
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => { query[key] = value })

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    // ---- Local file serving (GET /autopilot/file?path=...) ----
    if (req.method === 'GET' && url.pathname === '/autopilot/file') {
      const filePath = query.path
      if (!filePath || !path.isAbsolute(filePath)) {
        res.writeHead(400, { 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify({ error: 'path must be an absolute path' }))
        return
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404, { 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify({ error: 'file not found' }))
        return
      }
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`,
        'Access-Control-Allow-Origin': '*',
      })
      fs.createReadStream(filePath).pipe(res)
      return
    }

    // ---- Main-side status without renderer ----
    if (req.method === 'GET' && url.pathname === '/autopilot/server-status') {
      const text = JSON.stringify({ port: this.port, running: this.isRunning() })
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text), 'Access-Control-Allow-Origin': '*' })
      res.end(text)
      return
    }

    if (!webContents || webContents.isDestroyed()) {
      const text = JSON.stringify({ error: 'Renderer not ready' })
      res.writeHead(503, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text), 'Access-Control-Allow-Origin': '*' })
      res.end(text)
      return
    }

    // ---- Read body ----
    const bodyText = await new Promise<string>((resolve) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => { chunks.push(chunk) })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })

    const requestId = `http-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const isSse = url.pathname.endsWith('/events')

    if (isSse) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      })
      res.write(': connected\n\n')
      res.flushHeaders?.()
      this.pending.set(requestId, { res, isSse: true })
      req.on('close', () => { this.pending.delete(requestId) })
    } else {
      this.pending.set(requestId, { res, isSse: false })
    }

    let body: unknown
    if (bodyText) {
      try {
        body = JSON.parse(bodyText)
      } catch {
        body = undefined
      }
    }

    webContents.send('autopilot:http-request', {
      requestId,
      method: req.method ?? 'GET',
      path: url.pathname,
      query,
      body,
    })
  }
}

export const autopilotHttpServer = new AutopilotHttpServer()
