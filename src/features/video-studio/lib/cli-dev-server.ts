import { spawn } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { cancelCliTextTask, runCliTextTask } from '../../../../electron/features/video-studio/cli-runtime'
import {
  CLI_PATH_ENV as cliPathEnv,
  STATIC_CLAUDE_MODELS,
  detectCliPath,
  normalizeOpenCodeModel,
  parseCodexModelEfforts,
  parseCodexModels,
  parseOpenCodeModels,
} from './cli-runtime-shared'

export { STATIC_CLAUDE_MODELS }

let openCodeModelsCache: string[] | null = null
let openCodeModelsCacheExpiry = 0
let codexModelsCache: string[] | null = null
let codexModelsCacheExpiry = 0
let codexModelEffortsCache: Record<string, string[]> = {}

const CLAUDE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']

function getOpenCodeEfforts(model: string): string[] {
  const normalized = model.toLocaleLowerCase()
  if (normalized.startsWith('anthropic/') || normalized.includes('claude')) return ['high', 'max']
  if (normalized.startsWith('google/') || normalized.includes('gemini')) return ['low', 'high']
  if (normalized.startsWith('openai/') || /(?:^|\/)(?:gpt|o[134])/.test(normalized)) {
    return ['none', 'minimal', 'low', 'medium', 'high', 'xhigh']
  }
  return ['low', 'medium', 'high']
}

function writeJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function handleOptions(res: ServerResponse): void {
  writeJson(res, 204, {})
}

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
    req.on('end', () => {
      try {
        const text = chunks.length ? Buffer.concat(chunks).toString('utf8') : '{}'
        resolve(JSON.parse(text))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function detectCli(command: string, args: string[] = ['--version']): Promise<{ available: boolean; version?: string; error?: string; path?: string | null }> {
  return new Promise((resolve) => {
    const cliPath = detectCliPath(command)
    const child = spawn(cliPath || command, args, {
      shell: process.platform === 'win32',
      windowsHide: true,
      env: { ...process.env, PATH: cliPathEnv },
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (available: boolean, version?: string, error?: string) => {
      if (settled) return
      settled = true
      resolve({ available, version, error, path: cliPath })
    }

    child.stdout?.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr?.on('data', (data: Buffer) => { stderr += data.toString() })
    child.on('error', (error) => finish(false, undefined, error.message))
    child.on('close', (code) => {
      const output = `${stdout}\n${stderr}`.trim()
      if (code === 0) finish(true, output.split(/\r?\n/)[0]?.trim() || 'OK')
      else finish(false, undefined, output || `${command} exited with code ${code}`)
    })
  })
}

async function discoverOpenCodeModelsCli(): Promise<string[]> {
  const now = Date.now()
  if (openCodeModelsCache && now < openCodeModelsCacheExpiry) {
    return openCodeModelsCache
  }

  return new Promise((resolve) => {
    let stdout = ''
    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        proc.kill()
        resolve(openCodeModelsCache ?? [])
      }
    }, 20000)

    const opencodePath = detectCliPath('opencode') || 'opencode'
    const proc = spawn(opencodePath, ['models'], {
      env: { ...process.env, PATH: cliPathEnv, OPENCODE_DISABLE_PROJECT_CONFIG: 'true' },
      shell: process.platform === 'win32',
      windowsHide: true,
    })

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.on('close', () => {
      if (done) return
      done = true
      clearTimeout(timer)
      const models = parseOpenCodeModels(stdout)
      if (models.length > 0) {
        openCodeModelsCache = models
        openCodeModelsCacheExpiry = Date.now() + 60000
      }
      resolve(models)
    })
    proc.on('error', () => {
      if (!done) {
        done = true
        clearTimeout(timer)
        resolve(openCodeModelsCache ?? [])
      }
    })
  })
}

async function discoverCodexModelsCli(): Promise<string[]> {
  const now = Date.now()
  if (codexModelsCache && now < codexModelsCacheExpiry) return codexModelsCache

  return new Promise((resolve) => {
    let stdout = ''
    let done = false
    const codexPath = detectCliPath('codex') || 'codex'
    const proc = spawn(codexPath, ['debug', 'models', '--bundled'], {
      env: { ...process.env, PATH: cliPathEnv },
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    const timer = setTimeout(() => {
      if (done) return
      done = true
      proc.kill()
      resolve(codexModelsCache ?? [])
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    proc.on('close', () => {
      if (done) return
      done = true
      clearTimeout(timer)
      const models = parseCodexModels(stdout)
      codexModelEffortsCache = parseCodexModelEfforts(stdout)
      if (models.length > 0) {
        codexModelsCache = models
        codexModelsCacheExpiry = Date.now() + 60000
      }
      resolve(models)
    })
    proc.on('error', () => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(codexModelsCache ?? [])
    })
  })
}

async function cliJsonTest(cli: string, model?: string) {
  const testPrompt = 'Reply with exactly one word: OK'
  let command: string
  let args: string[]
  let stdinText: string | undefined
  let env: Record<string, string> | undefined

  if (cli === 'claude') {
    command = 'claude'
    args = ['--output-format', 'stream-json', '--verbose', '--print', '-', '--dangerously-skip-permissions']
    if (model) args.push('--model', model)
    stdinText = testPrompt
  } else if (cli === 'opencode') {
    command = detectCliPath('opencode') || 'opencode'
    args = ['run', '--format', 'json']
    if (model) args.push('--model', normalizeOpenCodeModel(model)!)
    stdinText = testPrompt
    env = { OPENCODE_DISABLE_PROJECT_CONFIG: 'true' }
  } else if (cli === 'codex') {
    command = detectCliPath('codex') || 'codex'
    args = ['exec', '--json', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-']
    if (model) args.splice(args.length - 1, 0, '--model', model)
    stdinText = testPrompt
  } else {
    return { ok: false, error: `Unknown CLI: ${cli}` }
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: process.platform === 'win32',
      windowsHide: true,
      env: { ...process.env, PATH: cliPathEnv, ...(env ?? {}) },
    })
    let stdout = ''
    let stderr = ''
    if (stdinText) {
      child.stdin?.write(stdinText)
      child.stdin?.end()
    }
    child.stdout?.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr?.on('data', (data: Buffer) => { stderr += data.toString() })
    child.on('close', (code) => {
      resolve({
        ok: code === 0 || stdout.length > 0,
        exitCode: code,
        rawLines: stdout.split(/\r?\n/).filter(Boolean).slice(0, 5),
        errors: stderr.split(/\r?\n/).filter(Boolean).slice(0, 3),
      })
    })
    child.on('error', (error) => resolve({ ok: false, error: error.message }))
  })
}

export async function handleCliDevRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!req.url) return false
  const url = new URL(req.url, 'http://localhost')
  if (!url.pathname.startsWith('/__cli')) return false

  if (req.method === 'OPTIONS') {
    handleOptions(res)
    return true
  }

  if (req.method === 'GET' && url.pathname === '/__cli/status') {
    const [claude, opencode, codex] = await Promise.all([
      detectCli('claude'),
      detectCli('opencode'),
      detectCli('codex'),
    ])
    writeJson(res, 200, { claude, opencode, codex, transport: 'http' })
    return true
  }

  if (req.method === 'GET' && url.pathname === '/__cli/models') {
    const cli = url.searchParams.get('cli') || ''
    if (cli === 'claude') {
      writeJson(res, 200, { models: STATIC_CLAUDE_MODELS, source: 'static', efforts: CLAUDE_EFFORTS })
      return true
    }
    if (cli === 'opencode') {
      const models = await discoverOpenCodeModelsCli()
      writeJson(res, 200, {
        models,
        source: 'cli',
        efforts: ['low', 'medium', 'high'],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)])),
      })
      return true
    }
    if (cli === 'codex') {
      const models = await discoverCodexModelsCli()
      writeJson(res, 200, {
        models,
        source: 'cli',
        efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
        effortsByModel: codexModelEffortsCache,
      })
      return true
    }
    writeJson(res, 400, { models: [], error: 'Unknown CLI' })
    return true
  }

  if (req.method === 'POST' && url.pathname === '/__cli/json-test') {
    const body = await readJsonBody(req)
    const result = await cliJsonTest(body.cli, body.model)
    writeJson(res, 200, result)
    return true
  }

  if (req.method === 'POST' && url.pathname === '/__cli/run-text') {
    const body = await readJsonBody(req)
    const requestId = typeof body.requestId === 'string' ? body.requestId : undefined
    let finished = false
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })

    const sendEvent = (event: unknown) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    req.on('close', () => {
      if (!finished && requestId) {
        cancelCliTextTask(requestId)
      }
    })

    try {
      const result = await runCliTextTask({
        adapter: body.adapter,
        prompt: body.prompt,
        systemPrompt: body.systemPrompt,
        model: body.model,
        effort: body.effort,
        sessionKey: body.sessionKey,
        requestId,
        timeoutMs: body.timeoutMs,
        workingDirectory: body.workingDirectory,
        enableContentMcp: body.enableContentMcp,
        onChunk: (chunk) => sendEvent({ type: 'chunk', chunk }),
        onSessionId: (sessionId) => sendEvent({ type: 'session', sessionId }),
      })
      sendEvent({ type: 'result', ...result })
      finished = true
      res.end()
    } catch (error) {
      sendEvent({ type: 'result', success: false, timedOut: false, exitCode: -1, error: error instanceof Error ? error.message : String(error) })
      finished = true
      res.end()
    }
    return true
  }

  writeJson(res, 404, { error: 'Not found' })
  return true
}
