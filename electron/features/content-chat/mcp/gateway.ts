import { app, ipcMain, type WebContents } from 'electron'
import crypto from 'node:crypto'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
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
const token = crypto.randomBytes(32).toString('hex')
const pending = new Map<string, PendingToolCall>()

function findRenderer(): WebContents | null {
  if (renderer && !renderer.isDestroyed()) return renderer
  return null
}

function callRenderer(name: string, args: unknown): Promise<unknown> {
  const target = findRenderer()
  if (!target) return Promise.reject(new Error('Open and sign in to logdd; the MCP tool host is not ready'))
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
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return jsonRpcError(id, -32600, 'Invalid JSON-RPC request')
  if (message.id === undefined) return null
  switch (message?.method) {
    case 'initialize':
      return jsonRpcResult(id, {
        protocolVersion: '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'logdd-content-tools', version: '0.2.0' },
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
        } else {
          result = await callRenderer(name, message?.params?.arguments)
        }
        const preview = name === 'get_media_asset' ? result as { asset?: unknown; imageContent?: unknown } : undefined
        return jsonRpcResult(id, {
          content: preview?.imageContent
            ? [{ type: 'text', text: JSON.stringify(preview.asset) }, preview.imageContent]
            : [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
          isError: false,
        })
      } catch (error) {
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
  ipcMain.on('content-mcp-ready', (event) => {
    renderer = event.sender
    void getContentMcpConnection().catch((error) => console.error('Unable to start media MCP:', error.message))
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
  if (connectionPromise) return connectionPromise
  connectionPromise = new Promise((resolve, reject) => {
    server = http.createServer(async (request, response) => {
      if (request.url !== '/mcp') {
        response.writeHead(404).end()
        return
      }
      if (request.headers.origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.origin)) {
        response.writeHead(403).end()
        return
      }
      if (request.headers.authorization !== `Bearer ${token}`) {
        response.writeHead(401).end()
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405, { Allow: 'POST' }).end()
        return
      }
      const chunks: Buffer[] = []
      let byteLength = 0
      let oversized = false
      request.on('data', (chunk: Buffer) => {
        if (oversized) return
        byteLength += chunk.length
        if (byteLength > 1024 * 1024) {
          oversized = true
          chunks.length = 0
          writeJson(response, 413, jsonRpcError(null, -32600, 'MCP request exceeds 1 MB; use file paths or asset IDs for references'))
          return
        }
        chunks.push(chunk)
      })
      request.on('end', async () => {
        if (oversized) return
        try {
          const message = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (Array.isArray(message)) {
            if (!message.length) { writeJson(response, 400, jsonRpcError(null, -32600, 'Empty batch')); return }
            const results = (await Promise.all(message.map(handleRpc))).filter(Boolean)
            if (!results.length) { response.writeHead(202).end(); return }
            writeJson(response, 200, results)
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
      request.on('error', () => {
        if (!response.headersSent) response.writeHead(400).end()
      })
    })
    server.once('error', (error) => { connectionPromise = null; reject(error) })
    server.listen(0, '127.0.0.1', () => {
      const address = server?.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start Content MCP gateway'))
        return
      }
      const connection = { url: `http://127.0.0.1:${address.port}/mcp`, token }
      try {
        fs.mkdirSync(app.getPath('userData'), { recursive: true })
        fs.writeFileSync(path.join(app.getPath('userData'), 'mcp-connection.json'), JSON.stringify(connection), { mode: 0o600 })
        resolve(connection)
      } catch (error) { server?.close(); connectionPromise = null; reject(error) }
    })
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
  server = null
  connectionPromise = null
  renderer = null
  try { fs.unlinkSync(path.join(app.getPath('userData'), 'mcp-connection.json')) } catch { /* Already removed. */ }
}
