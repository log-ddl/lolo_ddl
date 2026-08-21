import type { ContentSlashCommand } from '../../content-chat/slash-command-runtime'

/** Shared types for the CLI runtime adapters. */

export type CliAdapter = 'claude' | 'opencode' | 'codex'

export const CLAUDE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']

export interface CliModelsResult {
  models: string[]
  source: 'static' | 'cli'
  efforts: string[]
  effortsByModel?: Record<string, string[]>
}

export interface CliStatusResult {
  claude: { available: boolean; version?: string; error?: string; path?: string | null }
  opencode: { available: boolean; version?: string; error?: string; path?: string | null }
  codex: { available: boolean; version?: string; error?: string; path?: string | null }
}

export interface CliInstallResult {
  success: boolean
  output?: string
  error?: string
  status?: CliStatusResult[CliAdapter]
}

export interface RunCliTextPayload {
  adapter: CliAdapter
  prompt: string
  systemPrompt?: string
  model?: string
  effort?: string
  sessionKey?: string
  requestId?: string
  timeoutMs?: number
  workingDirectory?: string
  enableContentMcp?: boolean
  onChunk?: (chunk: string) => void
  onSessionId?: (sessionId: string) => void
  onCommands?: (commands: ContentSlashCommand[]) => void
}

export interface RunCliTextResult {
  success: boolean
  outputText?: string
  sessionId?: string
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  timedOut: boolean
  exitCode: number | null
  canceled?: boolean
  error?: string
}

export interface SpawnConfig {
  command: string
  args: string[]
  direct?: boolean
  cwd?: string
  env?: Record<string, string>
  stdinText?: string
  timeoutMs?: number
  requestId?: string
  onStdoutLine: (line: string) => void
  onStderrLine: (line: string) => void
}

export interface AdapterExecutionContext {
  prompt: string
  systemPrompt?: string
  model?: string
  effort?: string
  sessionId?: string
  timeoutMs?: number
  workingDirectory?: string
  enableContentMcp?: boolean
  requestId?: string
  onChunk?: (chunk: string) => void
  onSessionId?: (sessionId: string) => void
  onCommands?: (commands: ContentSlashCommand[]) => void
}

export interface AdapterExecutionResult {
  sessionId?: string
  outputText?: string
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  exitCode: number | null
  timedOut: boolean
  canceled?: boolean
  error?: string
}

export interface SessionState {
  adapter: CliAdapter
  sessionId?: string
  workingDirectory?: string
  systemPrompt?: string
}

