import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store'
import type { AIFeature } from '@/features/video-studio/stores/api-config-store'

export const CLI_TEXT_FEATURES = new Set<AIFeature>(['script_analysis', 'chat'])

const DEV_CLI_BASE_PATH = '/__cli'

export interface CliStatusInfo {
  available: boolean
  version?: string
  error?: string
  path?: string | null
}

export interface CliRuntimeStatus {
  claude: CliStatusInfo
  opencode: CliStatusInfo
  codex: CliStatusInfo
  transport: 'electron' | 'http'
  host?: string
  port?: number
}

export interface CliSlashCommand {
  name: string
  description: string
  provider: 'claude' | 'opencode' | 'codex'
  kind: 'skill' | 'command'
  source: 'user' | 'workspace' | 'session'
}

export async function getCliCommands(adapter: 'claude' | 'opencode' | 'codex', workingDirectory?: string): Promise<{ commands: CliSlashCommand[] }> {
  if (window.cliRuntime?.getCommands) return window.cliRuntime.getCommands(adapter, workingDirectory)
  return { commands: [] }
}

export interface CliModelsResult {
  models: string[]
  source?: string
  error?: string
  efforts: string[]
  effortsByModel?: Record<string, string[]>
}

export async function getCliModels(adapter: 'claude' | 'opencode' | 'codex'): Promise<CliModelsResult> {
  if (window.cliRuntime?.getModels) {
    return window.cliRuntime.getModels(adapter)
  }

  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/models?cli=${encodeURIComponent(adapter)}`)
    return await response.json() as CliModelsResult
  } catch (error) {
    return { models: [], efforts: [], error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cliJsonTest(adapter: 'claude' | 'opencode' | 'codex', model?: string): Promise<{ ok?: boolean; error?: string }> {
  if (window.cliRuntime) {
    try {
      const text = await runViaElectron({
        adapter,
        prompt: 'Reply with exactly one word: OK',
        model,
        timeoutMs: 30000,
      })
      return { ok: text.trim().length > 0 }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/json-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cli: adapter, model }),
    })
    return await response.json() as { ok?: boolean; error?: string }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function isCliFeatureEnabled(feature?: AIFeature): boolean {
  const settings = useVideoStudioSettingsStore.getState().cliRuntime
  if (!settings.enabled) return false
  if (!feature) return true
  return CLI_TEXT_FEATURES.has(feature)
}

export function getCliProviderPlatform(adapter: 'claude' | 'opencode'): 'claude-cli' | 'opencode-cli' {
  return adapter === 'claude' ? 'claude-cli' : 'opencode-cli'
}

export function isCliProvider(platformOrProvider?: string): boolean {
  return platformOrProvider === 'claude-cli' || platformOrProvider === 'opencode-cli'
}

export async function getCliRuntimeStatus(): Promise<CliRuntimeStatus | null> {
  if (window.cliRuntime) {
    const status = await window.cliRuntime.getStatus()
    return { ...status, transport: 'electron' }
  }

  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/status`)
    if (!response.ok) return null
    const status = await response.json() as CliRuntimeStatus
    return status
  } catch {
    return null
  }
}

export async function installCliRuntime(adapter: 'claude' | 'opencode' | 'codex'): Promise<{
  success: boolean
  output?: string
  error?: string
  status?: CliStatusInfo
}> {
  if (!window.cliRuntime?.install) {
    return { success: false, error: 'Tự động cài CLI chỉ khả dụng trong ứng dụng desktop.' }
  }
  return window.cliRuntime.install(adapter)
}

async function runViaElectron(params: {
  adapter: 'claude' | 'opencode' | 'codex'
  prompt: string
  systemPrompt?: string
  model?: string
  effort?: string
  sessionKey?: string
  timeoutMs: number
  workingDirectory?: string
  enableContentMcp?: boolean
  onChunk?: (chunk: string) => void
  onCommands?: (commands: CliSlashCommand[]) => void
  signal?: AbortSignal
}): Promise<string> {
  if (params.signal?.aborted) {
    throw new Error('Cancelled by user')
  }

  const requestId = params.onChunk || params.onCommands || params.signal ? crypto.randomUUID() : undefined
  const unsubscribe = requestId && window.cliRuntime?.onTaskEvent
    ? window.cliRuntime.onTaskEvent((event) => {
        if (event.requestId !== requestId) return
        if (event.type === 'chunk' && event.chunk) params.onChunk?.(event.chunk)
        if (event.type === 'commands' && event.commands) params.onCommands?.(event.commands)
      })
    : undefined
  const abortHandler = requestId
    ? () => {
        void window.cliRuntime?.cancelTextTask?.(requestId)
      }
    : undefined

  if (abortHandler) {
    params.signal?.addEventListener('abort', abortHandler, { once: true })
  }

  const result = await (async () => {
    try {
      return await window.cliRuntime!.runTextTask({
        adapter: params.adapter,
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        model: params.model,
        effort: params.effort,
        sessionKey: params.sessionKey,
        requestId,
        timeoutMs: params.timeoutMs,
        workingDirectory: params.workingDirectory,
        enableContentMcp: params.enableContentMcp,
      })
    } finally {
      if (abortHandler) {
        params.signal?.removeEventListener('abort', abortHandler)
      }
      unsubscribe?.()
    }
  })()

  if (params.signal?.aborted || result.canceled) {
    throw new Error('Cancelled by user')
  }

  if (!result.success || !result.outputText) {
    throw new Error(result.error || 'CLI text generation failed')
  }

  return result.outputText
}

async function runViaHttpBridge(params: {
  adapter: 'claude' | 'opencode' | 'codex'
  prompt: string
  systemPrompt?: string
  model?: string
  effort?: string
  sessionKey?: string
  timeoutMs: number
  workingDirectory?: string
  enableContentMcp?: boolean
  onChunk?: (chunk: string) => void
  onCommands?: (commands: CliSlashCommand[]) => void
  signal?: AbortSignal
}): Promise<string> {
  if (params.signal?.aborted) {
    throw new Error('Cancelled by user')
  }

  const requestId = params.onChunk || params.signal ? crypto.randomUUID() : undefined
  const response = await fetch(`${DEV_CLI_BASE_PATH}/run-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      adapter: params.adapter,
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: params.model,
      effort: params.effort,
      sessionKey: params.sessionKey,
      requestId,
      timeoutMs: params.timeoutMs,
      workingDirectory: params.workingDirectory,
      enableContentMcp: params.enableContentMcp,
    }),
  }).catch((error) => {
    if (params.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('Cancelled by user')
    }
    throw error
  })

  if (!response.ok || !response.body) {
    throw new Error(`CLI bridge request failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalText = ''
  let finalError = ''
  let finalSuccess = false
  let finalCanceled = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        let event: any
        try {
          event = JSON.parse(trimmed)
        } catch {
          continue
        }

        if (event.type === 'chunk' && event.chunk) {
          finalText += event.chunk
          params.onChunk?.(event.chunk)
        }

        if (event.type === 'result') {
          finalSuccess = Boolean(event.success)
          finalCanceled = Boolean(event.canceled)
          if (event.outputText && !finalText) {
            finalText = event.outputText
          }
          finalError = event.error || ''
        }
      }
    }
  } catch (error) {
    if (params.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('Cancelled by user')
    }
    throw error
  }

  if (params.signal?.aborted || finalCanceled) {
    throw new Error('Cancelled by user')
  }

  if (!finalSuccess || !finalText) {
    throw new Error(finalError || 'CLI bridge text generation failed')
  }

  return finalText
}

export async function runCliTextCompletion(params: {
  feature?: AIFeature
  systemPrompt: string
  userPrompt: string
  model?: string
  effort?: string
  sessionKey?: string
  onChunk?: (chunk: string) => void
  onCommands?: (commands: CliSlashCommand[]) => void
  signal?: AbortSignal
}): Promise<string> {
  const settings = useVideoStudioSettingsStore.getState().cliRuntime

  if (!settings.enabled) {
    throw new Error('CLI runtime is disabled')
  }

  return runCliTextTask({
    adapter: settings.adapter,
    prompt: params.userPrompt,
    systemPrompt: params.systemPrompt,
    model: params.model || settings.model,
    effort: params.effort,
    sessionKey: params.sessionKey || params.feature || 'chat',
    timeoutMs: settings.timeoutMs,
    onChunk: params.onChunk,
    onCommands: params.onCommands,
    signal: params.signal,
  })
}

/** Runs a raw CLI turn. Callers decide the prompt and no system prompt is added here. */
export async function runCliTextTask(params: {
  adapter: 'claude' | 'opencode' | 'codex'
  prompt: string
  systemPrompt?: string
  model?: string
  effort?: string
  sessionKey?: string
  timeoutMs?: number
  workingDirectory?: string
  enableContentMcp?: boolean
  onChunk?: (chunk: string) => void
  onCommands?: (commands: CliSlashCommand[]) => void
  signal?: AbortSignal
}): Promise<string> {
  const sharedParams = {
    ...params,
    timeoutMs: params.timeoutMs ?? 120000,
  }

  if (window.cliRuntime) {
    return runViaElectron(sharedParams)
  }

  return runViaHttpBridge(sharedParams)
}
