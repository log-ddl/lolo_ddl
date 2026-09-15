import type { CliStatusResult, RunCliTextPayload, RunCliTextResult, SessionState } from './cli/types'
import { detectCli } from './cli/process'
import { executeAdapter, isExpiredSessionError } from './cli/adapters'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { nativeImage } from 'electron'

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
  if (!payload.images?.length) return runText({ ...payload, imagePaths: undefined })
  if (payload.images.length > 8 || payload.images.reduce((size, image) => size + image.length, 0) > 40_000_000) throw new Error('Maximum 8 images / 30 MB per AI request')
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'logdd-canvas-ai-'))
  try {
    const imagePaths: string[] = []
    for (const [index, image] of payload.images.entries()) {
      const match = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image)
      if (!match) throw new Error('Invalid AI image attachment')
      const target = path.join(directory, `image-${index + 1}.png`)
      const decoded = nativeImage.createFromBuffer(Buffer.from(match[1], 'base64'))
      const size = decoded.getSize()
      if (decoded.isEmpty() || size.width * size.height > 40_000_000) throw new Error('Invalid or oversized AI image')
      await fs.writeFile(target, decoded.toPNG())
      imagePaths.push(target)
    }
    return await runText({ ...payload, imagePaths })
  } finally { await fs.rm(directory, { recursive: true, force: true }) }
}

async function runText(payload: RunCliTextPayload): Promise<RunCliTextResult> {
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
      imagePaths: payload.imagePaths,
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
