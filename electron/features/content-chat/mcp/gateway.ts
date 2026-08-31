import { BrowserWindow, ipcMain, type WebContents } from 'electron'
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
const token = crypto.randomBytes(32).toString('hex')
const pending = new Map<string, PendingToolCall>()

function findRenderer(): WebContents | null {
  if (renderer && !renderer.isDestroyed()) return renderer
  const window = BrowserWindow.getAllWindows().find((item) => !item.isDestroyed())
  return window?.webContents ?? null
}

function callRenderer(name: string, args: unknown): Promise<unknown> {
  const target = findRenderer()
  if (!target) return Promise.reject(new Error('Content Chat is not open'))
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
  switch (message?.method) {
    case 'initialize':
      return jsonRpcResult(id, {
        protocolVersion: '2025-03-26',
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
        } else {
          result = await callRenderer(name, message?.params?.arguments)
        }
        return jsonRpcResult(id, {
          content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
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
      if (request.url !== '/mcp' || request.method !== 'POST') {
        response.writeHead(404).end()
        return
      }
      if (request.headers.authorization !== `Bearer ${token}`) {
        response.writeHead(401).end()
        return
      }
      const chunks: Buffer[] = []
      let byteLength = 0
      request.on('data', (chunk: Buffer) => {
        byteLength += chunk.length
        if (byteLength > 1024 * 1024) {
          request.destroy(new Error('MCP request exceeds 1 MB'))
          return
        }
        chunks.push(chunk)
      })
      request.on('end', async () => {
        try {
          const message = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (Array.isArray(message)) {
            const results = (await Promise.all(message.map(handleRpc))).filter(Boolean)
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
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server?.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start Content MCP gateway'))
        return
      }
      resolve({ url: `http://127.0.0.1:${address.port}/mcp`, token })
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
}
