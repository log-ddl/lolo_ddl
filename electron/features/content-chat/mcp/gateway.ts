import fs from 'node:fs'
import path from 'node:path'
import { executeMediaTool } from './media-tools'
import { app, BrowserWindow, ipcMain, type WebContents } from 'electron'
import crypto from 'node:crypto'
import http from 'node:http'
import { CONTENT_MCP_TOOLS } from './tool-definitions'
import { getSystemResourceMetrics } from '../../../resource-monitor'

type JsonRpcId = string | number | null

interface PendingToolCall {
  senderId: number
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

let server: http.Server | null = null
let connectionPromise: Promise<{ url: string; token: string }> | null = null
let renderer: WebContents | null = null
type Settings = { token: string; port: number; enabled: boolean }
let settings: Settings | null = null
let lastError: string | null = null
let lastClient: string | null = null
let lastSeen: string | null = null
const activity: Array<{ name: string; time: string; ok: boolean }> = []
function getSettings(): Settings {
  if (settings) return settings
  const file = path.join(app.getPath('userData'), 'mcp-connection.json')
  if (fs.existsSync(file)) {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (saved.port === undefined && saved.url) { saved.port = Number(new URL(saved.url).port); saved.enabled = true }
    if (!/^[a-f0-9]{64}$/.test(saved.token) || !Number.isInteger(saved.port) || saved.port < 0 || saved.port > 65535 || typeof saved.enabled !== 'boolean') throw new Error('Invalid MCP settings file')
    settings = saved
  } else {
    settings = { token: crypto.randomBytes(32).toString('hex'), port: 0, enabled: true }
    saveSettings()
  }
  return settings!
}
function saveSettings() {
  const file = path.join(app.getPath('userData'), 'mcp-connection.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file + '.tmp', JSON.stringify({ ...settings, url: settings?.port ? `http://127.0.0.1:${settings.port}/mcp` : undefined }), { mode: 0o600 })
  fs.renameSync(file + '.tmp', file)
  fs.chmodSync(file, 0o600)
}
function status() {
  const config = getSettings()
  return { enabled: config.enabled, running: Boolean(server?.listening), url: config.port ? `http://127.0.0.1:${config.port}/mcp` : '',
    token: config.token, error: lastError, lastClient, lastSeen, activity: [...activity], tools: CONTENT_MCP_TOOLS.map((tool) => tool.name) }
}
function record(name: string, ok: boolean) {
  activity.unshift({ name, ok, time: new Date().toISOString() })
  activity.splice(20)
}
const pending = new Map<string, PendingToolCall>()

function findRenderer(): WebContents | null {
  if (renderer && !renderer.isDestroyed()) return renderer
  const window = BrowserWindow.getAllWindows().find((item) => !item.isDestroyed())
  return window?.webContents ?? null
}

function callRenderer(name: string, args: unknown): Promise<unknown> {
  const target = findRenderer()
  if (!target) return Promise.reject(new Error('The logdd window is not ready. Wait for the app to finish loading.'))
  const requestId = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId)
      reject(new Error(`Tool ${name} timed out`))
    }, 10 * 60 * 1000)
    pending.set(requestId, { senderId: target.id, resolve, reject, timer })
    target.send('content-mcp-tool-call', { requestId, name, arguments: args ?? {} })
  })
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id, result }
}

function jsonRpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

async function handleRpc(message: any): Promise<unknown | null> {
  const id: JsonRpcId = message?.id ?? null
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return jsonRpcError(id, -32600, 'Invalid request')
  if (message.id === undefined) return null
  switch (message?.method) {
    case 'initialize':
      lastClient = String(message.params?.clientInfo?.name || 'MCP client').slice(0, 100)
      return jsonRpcResult(id, {
        protocolVersion: ['2025-03-26', '2025-06-18', '2025-11-25'].includes(message.params?.protocolVersion) ? message.params.protocolVersion : '2025-11-25',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'logdd-content-tools', version: '0.1.0' },
      })
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null
    case 'ping':
      return jsonRpcResult(id, {})
    case 'tools/list':
      return jsonRpcResult(id, { tools: CONTENT_MCP_TOOLS })
    case 'tools/call': {
      const name = String(message?.params?.name ?? '')
      if (!CONTENT_MCP_TOOLS.some((tool) => tool.name === name)) {
        return jsonRpcError(id, -32602, `Unknown tool: ${name}`)
      }
      try {
        let result: unknown
        if (name === 'get_system_resource_metrics') {
          result = getSystemResourceMetrics()
        } else if (name === 'get_media_capabilities') {
          result = await executeMediaTool(name, message?.params?.arguments ?? {})
        } else {
          result = await callRenderer(name, message?.params?.arguments)
        }
        record(name, true)
        const preview = name === 'get_media_asset' ? result as { asset?: unknown; imageContent?: unknown } : undefined
        return jsonRpcResult(id, {
          content: preview?.imageContent ? [{ type: 'text', text: JSON.stringify(preview.asset) }, preview.imageContent] : [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
          isError: false,
        })
      } catch (error) {
        record(name, false)
        return jsonRpcResult(id, {
          content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
          isError: true,
        })
      }
    }
    case 'resources/list':
      return jsonRpcResult(id, { resources: [] })
    case 'prompts/list':
      return jsonRpcResult(id, { prompts: [] })
    default:
      return jsonRpcError(id, -32601, `Method not found: ${String(message?.method ?? '')}`)
  }
}

function writeJson(response: http.ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

export function registerContentMcpGateway(): void {
  ipcMain.handle('content-mcp-status', () => status())
  ipcMain.handle('content-mcp-enabled', async (_event, enabled: boolean) => {
    getSettings().enabled = Boolean(enabled)
    saveSettings()
    if (!enabled) { await connectionPromise?.catch(() => undefined); closeContentMcpGateway() }
    else { try { await getContentMcpConnection() } catch { /* status contains actionable error */ } }
    return status()
  })
  ipcMain.handle('content-mcp-rotate', () => {
    getSettings().token = crypto.randomBytes(32).toString('hex')
    saveSettings()
    lastClient = null; lastSeen = null
    return status()
  })
  ipcMain.handle('content-mcp-test', async () => {
    const { url, token } = await getContentMcpConnection()
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), signal: AbortSignal.timeout(5000) })
    const result = await response.json() as { result?: { tools?: unknown[] } }
    if (!response.ok || !result.result?.tools) throw new Error('MCP self-test failed')
    return { count: result.result.tools.length }
  })
  void app.whenReady().then(async () => {
    if (getSettings().enabled) await getContentMcpConnection()
  }).catch((error) => { lastError = String(error) })
  ipcMain.on('content-mcp-ready', (event) => {
    renderer = event.sender
  })
  ipcMain.on('content-mcp-tool-result', (event, payload: { requestId?: string; success?: boolean; result?: unknown; error?: string }) => {
    const requestId = String(payload?.requestId ?? '')
    const item = pending.get(requestId)
    if (!item || item.senderId !== event.sender.id) return
    pending.delete(requestId)
    clearTimeout(item.timer)
    if (payload.success) item.resolve(payload.result)
    else item.reject(new Error(payload.error || 'Tool call failed'))
  })
}

export function getContentMcpConnection(): Promise<{ url: string; token: string }> {
  if (!getSettings().enabled) return Promise.reject(new Error('MCP is disabled. Enable it in Settings > AI Connections.'))
  if (connectionPromise) return connectionPromise
  connectionPromise = new Promise((resolve, reject) => {
    server = http.createServer(async (request, response) => {
      if (request.url !== '/mcp') { response.writeHead(404).end(); return }
      const origin = request.headers.origin
      if (origin && origin !== `http://127.0.0.1:${getSettings().port}`) { response.writeHead(403).end(); return }
      if (request.headers.authorization !== `Bearer ${getSettings().token}`) { response.writeHead(401).end(); return }
      if (request.method !== 'POST') { response.writeHead(405, { Allow: 'POST' }).end(); return }
      if (!String(request.headers['content-type']).startsWith('application/json')) { response.writeHead(415).end(); return }
      const version = request.headers['mcp-protocol-version']
      if (version && !['2025-03-26', '2025-06-18', '2025-11-25'].includes(String(version))) { response.writeHead(400).end(); return }
      lastSeen = new Date().toISOString()
      const chunks: Buffer[] = []
      let byteLength = 0
      request.on('data', (chunk: Buffer) => {
        byteLength += chunk.length
        if (byteLength > 1024 * 1024) {
          response.writeHead(413).end()
          request.destroy()
          return
        }
        chunks.push(chunk)
      })
      request.on('end', async () => {
        try {
          const message = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (Array.isArray(message)) {
            writeJson(response, 400, jsonRpcError(null, -32600, 'Batch requests are not supported'))
            return
          }
          const result = await handleRpc(message)
          if (result === null) {
            response.writeHead(202).end()
            return
          }
          writeJson(response, 200, result)
        } catch (error) {
          writeJson(response, 400, jsonRpcError(null, -32700, error instanceof Error ? error.message : String(error)))
        }
      })
    })
    server.once('error', reject)
    server.listen(getSettings().port, '127.0.0.1', () => {
      const address = server?.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start Content MCP gateway'))
        return
      }
      try {
        getSettings().port = address.port
        saveSettings()
        lastError = null
        resolve({ url: `http://127.0.0.1:${address.port}/mcp`, token: getSettings().token })
      } catch (error) { reject(error) }
    })
  })
  connectionPromise = connectionPromise.catch((error) => {
    server?.close(); server = null; connectionPromise = null
    lastError = error instanceof Error ? error.message : String(error)
    throw error
  })
  return connectionPromise
}

export function closeContentMcpGateway(): void {
  for (const item of pending.values()) {
    clearTimeout(item.timer)
    item.reject(new Error('Content MCP gateway closed'))
  }
  pending.clear()
  server?.close()
  server?.closeAllConnections()
  server = null
  connectionPromise = null
}
