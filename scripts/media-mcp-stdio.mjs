// Run with Node 20+: node scripts/media-mcp-stdio.mjs [path/to/mcp-connection.json]
// Only JSON-RPC goes to stdout. The app retains all provider credentials.
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import readline from 'node:readline'

const dataRoot = process.platform === 'win32' ? process.env.APPDATA
  : process.platform === 'darwin' ? path.join(homedir(), 'Library', 'Application Support')
    : process.env.XDG_CONFIG_HOME || path.join(homedir(), '.config')
const connectionFile = process.argv[2] || process.env.LOGDD_MCP_CONNECTION_FILE || path.join(dataRoot || homedir(), 'logdd', 'mcp-connection.json')
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`)
lines.on('line', (line) => {
  if (!line.trim()) return
  void forward(line)
})
async function forward(line) {
  let message
  try {
    message = JSON.parse(line)
    const connection = JSON.parse(await readFile(connectionFile, 'utf8'))
    const url = new URL(connection.url)
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/mcp') throw new Error('Invalid local MCP connection address')
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${connection.token}` },
      body: JSON.stringify(message), signal: AbortSignal.timeout(11 * 60 * 1000),
    })
    if (response.status === 202) return
    if (!response.ok) throw new Error(`App MCP returned HTTP ${response.status}`)
    emit(await response.json())
  } catch (error) {
    const requests = Array.isArray(message) ? message : [message]
    const responses = requests.filter((m) => m?.id !== undefined || message === undefined).map((m) => ({
      jsonrpc: '2.0', id: m?.id ?? null,
      error: { code: message === undefined ? -32700 : -32000, message: `Open and sign in to logdd. ${error.message}` },
    }))
    if (responses.length) emit(Array.isArray(message) ? responses : responses[0])
  }
}
