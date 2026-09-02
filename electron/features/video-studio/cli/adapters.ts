import fs from 'node:fs'
import path from 'node:path'
import { getContentMcpConnection } from '../../content-chat/mcp/gateway'
import { discoverContentSlashCommands, getOpenCodeCommandDefinitions } from '../../content-chat/slash-command-runtime'
import type { AdapterExecutionContext, AdapterExecutionResult, CliAdapter } from './types'
import { normalizeOpenCodeModel } from '../../../../src/features/video-studio/lib/cli-runtime-shared'
import { resolveCliCommand, spawnAndStream } from './process'
import { commandCacheKey, getCliCommands, normalizeRuntimeCommands, runtimeCommands } from './commands'
import { writeSystemPromptFile } from './models'

/**
 * One execution function per CLI. They differ in flags, streaming format and how
 * a resumable session id is threaded through, but all return the same shape.
 */

export function isExpiredSessionError(errorText?: string): boolean {
  if (!errorText) return false
  return /unknown session|session.*expired|invalid session|could not find session/i.test(errorText)
}

export async function executeClaude(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const args = [
    '--output-format', 'stream-json',
    '--verbose',
    '--print', '-',
    '--dangerously-skip-permissions',
  ]

  if (ctx.model) args.push('--model', ctx.model)
  if (ctx.effort) args.push('--effort', ctx.effort)
  if (ctx.sessionId) args.push('--resume', ctx.sessionId)
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection()
    args.push('--mcp-config', JSON.stringify({
      mcpServers: {
        logdd: {
          type: 'http',
          url: mcp.url,
          headers: { Authorization: `Bearer ${mcp.token}` },
        },
      },
    }))
  }

  let promptFilePath: string | null = null
  if (ctx.systemPrompt && !ctx.sessionId) {
    promptFilePath = writeSystemPromptFile(ctx.systemPrompt)
    args.push('--append-system-prompt-file', promptFilePath)
  }

  let resultSessionId: string | undefined
  let outputText = ''
  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0
  const stderrLines: string[] = []
  // A failed turn usually reports the real reason on stdout as a stream-json
  // result event (errors / is_error / api_error_status), which this adapter
  // would otherwise drop — leaving only startup warnings (e.g. the claude.ai
  // connectors notice) in stderr as the whole error message.
  let resultError = ''

  try {
    const { exitCode, timedOut, canceled } = await spawnAndStream({
      command: resolveCliCommand('claude'),
      args,
      stdinText: ctx.prompt,
      cwd: ctx.workingDirectory,
      timeoutMs: ctx.timeoutMs,
      requestId: ctx.requestId,
      onStdoutLine: (line) => {
        let event: any
        try {
          event = JSON.parse(line)
        } catch {
          return
        }

        if (event.type === 'system' && event.subtype === 'init' && event.session_id) {
          resultSessionId = event.session_id
          ctx.onSessionId?.(event.session_id)
        }
        if (event.type === 'system' && event.subtype === 'init') {
          const commands = normalizeRuntimeCommands(event.slash_commands ?? event.slashCommands)
          if (commands.length > 0) {
            runtimeCommands.set(commandCacheKey('claude', ctx.workingDirectory), commands)
            ctx.onCommands?.(getCliCommands('claude', ctx.workingDirectory).commands)
          }
        }

        if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              outputText += block.text
              ctx.onChunk?.(block.text)
            }
          }
        }

        if (event.type === 'result') {
          if (event.session_id) resultSessionId = event.session_id
          inputTokens = (event.usage?.input_tokens ?? 0) + (event.usage?.cache_read_input_tokens ?? 0)
          outputTokens = event.usage?.output_tokens ?? 0
          costUsd = event.total_cost_usd ?? 0
          if (event.errors?.length) resultError = String(event.errors[0])
          else if (event.error) resultError = String(event.error)
          else if (event.is_error || event.subtype === 'error') {
            resultError = event.error_text || event.api_error_status || event.message || 'claude reported an error'
          }
        }
      },
      onStderrLine: (line) => {
        stderrLines.push(line)
      },
    })

    const stderrText = stderrLines.join('\n').trim()
    let error: string | undefined
    if (canceled) {
      error = 'Cancelled by user'
    } else if (exitCode !== 0 && !outputText) {
      // Surface the real reason, not the incidental startup warning on stderr.
      if (timedOut) {
        error = `CLI timed out after ${Math.round((ctx.timeoutMs ?? 120000) / 1000)}s before producing any output${stderrText ? ` — ${stderrText}` : ''}`
      } else {
        error = resultError || stderrText || `claude exited with code ${exitCode}`
      }
    }

    return {
      sessionId: resultSessionId,
      outputText,
      inputTokens: inputTokens || undefined,
      outputTokens: outputTokens || undefined,
      costUsd: costUsd || undefined,
      exitCode,
      timedOut,
      canceled,
      error,
    }
  } finally {
    if (promptFilePath) {
      try {
        fs.unlinkSync(promptFilePath)
        fs.rmdirSync(path.dirname(promptFilePath))
      } catch {}
    }
  }
}

export async function executeOpenCode(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const args = ['run', '--format', 'json']
  const model = normalizeOpenCodeModel(ctx.model)
  if (model) args.push('--model', model)
  if (ctx.effort) args.push('--variant', ctx.effort)
  if (ctx.sessionId) args.push('--session', ctx.sessionId)

  let resultSessionId: string | undefined
  let outputText = ''
  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0
  const stderrLines: string[] = []
  const commandDefinitions = getOpenCodeCommandDefinitions(ctx.workingDirectory)
  const discoveredCommands = discoverContentSlashCommands('opencode', ctx.workingDirectory)
  const slashMatch = /^\/([^\s]+)(?:\s+([\s\S]*))?$/.exec(ctx.prompt.trim())
  const discoveredSlashCommand = slashMatch
    ? discoveredCommands.find((command) => command.name.toLocaleLowerCase() === slashMatch[1].toLocaleLowerCase())
    : undefined
  const commandName = discoveredSlashCommand?.name
  if (commandName) args.push('--command', commandName)
  const commandArguments = commandName ? slashMatch?.[2] ?? '' : ctx.prompt
  if (commandName && commandDefinitions[commandName] && ctx.systemPrompt) {
    commandDefinitions[commandName] = {
      ...commandDefinitions[commandName],
      template: `${ctx.systemPrompt}\n\n---\n\n${commandDefinitions[commandName].template}`,
    }
  }
  const stdinText = !commandName && ctx.systemPrompt
    ? `${ctx.systemPrompt}\n\n---\n\n${commandArguments}`
    : commandArguments
  const env: Record<string, string> = ctx.enableContentMcp ? {} : { OPENCODE_DISABLE_PROJECT_CONFIG: 'true' }
  const inlineConfig: Record<string, unknown> = {}
  if (commandName && commandDefinitions[commandName]) inlineConfig.command = commandDefinitions
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection()
    inlineConfig.mcp = {
        logdd: {
          type: 'remote',
          url: mcp.url,
          enabled: true,
          headers: { Authorization: `Bearer ${mcp.token}` },
        },
      }
  }
  if (Object.keys(inlineConfig).length > 0) env.OPENCODE_CONFIG_CONTENT = JSON.stringify(inlineConfig)

  const { exitCode, timedOut, canceled } = await spawnAndStream({
    command: resolveCliCommand('opencode'),
    args,
    stdinText,
    cwd: ctx.workingDirectory,
    timeoutMs: ctx.timeoutMs,
    requestId: ctx.requestId,
    env,
    onStdoutLine: (line) => {
      let event: any
      try {
        event = JSON.parse(line)
      } catch {
        return
      }

      if (event.sessionID && !resultSessionId) {
        resultSessionId = event.sessionID
        ctx.onSessionId?.(event.sessionID)
      }

      if (event.type === 'text' && event.part?.text) {
        outputText += event.part.text
        ctx.onChunk?.(event.part.text)
      }

      if (event.type === 'step_finish' && event.part?.tokens) {
        inputTokens += (event.part.tokens.input ?? 0) + (event.part.tokens.cache?.read ?? 0)
        outputTokens += (event.part.tokens.output ?? 0) + (event.part.tokens.reasoning ?? 0)
        costUsd += event.part.cost ?? 0
      }
    },
    onStderrLine: (line) => {
      stderrLines.push(line)
    },
  })

  return {
    sessionId: resultSessionId,
    outputText,
    inputTokens: inputTokens || undefined,
    outputTokens: outputTokens || undefined,
    costUsd: costUsd || undefined,
    exitCode,
    timedOut,
    canceled,
    error: canceled ? 'Cancelled by user' : exitCode !== 0 && !outputText ? stderrLines.join('\n').trim() || `opencode exited with code ${exitCode}` : undefined,
  }
}

export async function executeCodex(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const args = ctx.sessionId
    ? ['exec', 'resume', '--json', '--skip-git-repo-check']
    : ['exec', '--json', '--sandbox', 'workspace-write', '--skip-git-repo-check']
  if (ctx.model) args.push('--model', ctx.model)
  if (ctx.effort) args.push('--config', `model_reasoning_effort=${JSON.stringify(ctx.effort)}`)

  const env: Record<string, string> = {}
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection()
    const tokenEnvName = 'LOGDD_CONTENT_MCP_TOKEN'
    env[tokenEnvName] = mcp.token
    args.push(
      '--config', `mcp_servers.logdd.url=${JSON.stringify(mcp.url)}`,
      '--config', `mcp_servers.logdd.bearer_token_env_var=${JSON.stringify(tokenEnvName)}`,
      '--config', 'mcp_servers.logdd.required=true',
      '--config', 'mcp_servers.logdd.default_tools_approval_mode="auto"',
    )
  }

  if (ctx.sessionId) args.push(ctx.sessionId)
  args.push('-')

  const discoveredCommands = discoverContentSlashCommands('codex', ctx.workingDirectory)
  const slashMatch = /^\/([^\s]+)(?:\s+([\s\S]*))?$/.exec(ctx.prompt.trim())
  const skill = slashMatch
    ? discoveredCommands.find((command) => command.kind === 'skill'
      && command.name.toLocaleLowerCase() === slashMatch[1].toLocaleLowerCase())
    : undefined
  const prompt = skill
    ? `$${skill.name}${slashMatch?.[2] ? ` ${slashMatch[2]}` : ''}`
    : ctx.prompt
  const stdinText = ctx.systemPrompt && !ctx.sessionId
    ? `${ctx.systemPrompt}\n\n---\n\n${prompt}`
    : prompt

  let resultSessionId: string | undefined
  let outputText = ''
  let inputTokens = 0
  let outputTokens = 0
  const stderrLines: string[] = []

  const { exitCode, timedOut, canceled } = await spawnAndStream({
    command: resolveCliCommand('codex'),
    args,
    direct: process.platform === 'win32',
    stdinText,
    cwd: ctx.workingDirectory,
    env,
    timeoutMs: ctx.timeoutMs,
    requestId: ctx.requestId,
    onStdoutLine: (line) => {
      let event: any
      try {
        event = JSON.parse(line)
      } catch {
        return
      }

      if (event.type === 'thread.started' && event.thread_id) {
        resultSessionId = event.thread_id
        ctx.onSessionId?.(event.thread_id)
      }
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
        outputText += event.item.text
        ctx.onChunk?.(event.item.text)
      }
      if (event.type === 'turn.completed' && event.usage) {
        inputTokens = (event.usage.input_tokens ?? 0) + (event.usage.cached_input_tokens ?? 0)
        outputTokens = event.usage.output_tokens ?? 0
      }
      if ((event.type === 'error' || event.type === 'turn.failed') && event.message) {
        stderrLines.push(String(event.message))
      }
    },
    onStderrLine: (line) => { stderrLines.push(line) },
  })

  return {
    sessionId: resultSessionId,
    outputText,
    inputTokens: inputTokens || undefined,
    outputTokens: outputTokens || undefined,
    exitCode,
    timedOut,
    canceled,
    error: canceled ? 'Cancelled by user' : exitCode !== 0 && !outputText
      ? stderrLines.join('\n').trim() || `codex exited with code ${exitCode}`
      : undefined,
  }
}

export async function executeAdapter(adapter: CliAdapter, ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  if (adapter === 'claude') {
    return executeClaude(ctx)
  }
  if (adapter === 'opencode') {
    return executeOpenCode(ctx)
  }
  return executeCodex(ctx)
}
