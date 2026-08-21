import type { CliStatusResult, RunCliTextPayload, RunCliTextResult, SessionState } from './cli/types'
import { detectCli } from './cli/process'
import { executeAdapter, isExpiredSessionError } from './cli/adapters'

export { getCliCommands } from './cli/commands'
export { cancelCliTextTask } from './cli/active-tasks'

export type { CliAdapter, CliInstallResult, CliModelsResult, CliStatusResult, RunCliTextPayload, RunCliTextResult } from './cli/types'
export { installCli } from './cli/install'
export { getCliModels } from './cli/models'

const sessions = new Map<string, SessionState>()



export async function getCliStatus(): Promise<CliStatusResult> {
  const [claude, opencode, codex] = await Promise.all([
    detectCli('claude'),
    detectCli('opencode', ['--version']),
    detectCli('codex', ['--version']),
  ])

  return { claude, opencode, codex }
}

export async function runCliTextTask(payload: RunCliTextPayload): Promise<RunCliTextResult> {
  const timeoutMs = payload.timeoutMs ?? 120000
  const existingSession = payload.sessionKey ? sessions.get(payload.sessionKey) : undefined
  const canResume = existingSession?.adapter === payload.adapter
    && existingSession.workingDirectory === payload.workingDirectory
    && existingSession.systemPrompt === payload.systemPrompt
    ? existingSession.sessionId
    : undefined

  const execute = async (sessionId?: string) => {
    return executeAdapter(payload.adapter, {
      prompt: payload.prompt,
      systemPrompt: payload.systemPrompt,
      model: payload.model,
      effort: payload.effort,
      sessionId,
      timeoutMs,
      workingDirectory: payload.workingDirectory,
      enableContentMcp: payload.enableContentMcp,
      requestId: payload.requestId,
      onChunk: payload.onChunk,
      onSessionId: payload.onSessionId,
      onCommands: payload.onCommands,
    })
  }

  let result = await execute(canResume)

  if (canResume && result.error && isExpiredSessionError(result.error)) {
    if (payload.sessionKey) {
      sessions.delete(payload.sessionKey)
    }
    result = await execute(undefined)
  }

  if (payload.sessionKey) {
    if (result.error || result.canceled) {
      sessions.delete(payload.sessionKey)
    } else if (result.sessionId) {
      sessions.set(payload.sessionKey, {
        adapter: payload.adapter,
        sessionId: result.sessionId,
        workingDirectory: payload.workingDirectory,
        systemPrompt: payload.systemPrompt,
      })
    }
  }

  return {
    success: !result.error && Boolean(result.outputText),
    outputText: result.outputText,
    sessionId: result.sessionId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.costUsd,
    timedOut: result.timedOut,
    exitCode: result.exitCode,
    canceled: result.canceled,
    error: result.error,
  }
}
