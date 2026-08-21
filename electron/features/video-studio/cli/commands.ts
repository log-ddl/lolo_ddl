import { discoverContentSlashCommands, type ContentSlashCommand } from '../../content-chat/slash-command-runtime'
import type { CliAdapter } from './types'

/**
 * Slash commands available to a chat: the ones discovered on disk, merged with
 * any the CLI reported during a live session (cached per adapter + workspace).
 */

export const runtimeCommands = new Map<string, ContentSlashCommand[]>()

export function commandCacheKey(adapter: CliAdapter, workingDirectory?: string) {
  return `${adapter}:${workingDirectory || ''}`
}

export function getCliCommands(adapter: CliAdapter, workingDirectory?: string): { commands: ContentSlashCommand[] } {
  const commands = new Map<string, ContentSlashCommand>()
  for (const command of discoverContentSlashCommands(adapter, workingDirectory)) {
    commands.set(command.name.toLocaleLowerCase(), command)
  }
  for (const command of runtimeCommands.get(commandCacheKey(adapter, workingDirectory)) ?? []) {
    const key = command.name.toLocaleLowerCase()
    if (!commands.has(key)) commands.set(key, command)
  }
  return { commands: [...commands.values()].sort((a, b) => a.name.localeCompare(b.name)) }
}

export function normalizeRuntimeCommands(value: unknown): ContentSlashCommand[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): ContentSlashCommand[] => {
    if (typeof item === 'string') {
      const name = item.replace(/^\//, '').trim()
      return name ? [{ name, description: 'Claude session command', provider: 'claude', kind: 'command', source: 'session' }] : []
    }
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const name = String(record.name ?? record.command ?? '').replace(/^\//, '').trim()
    if (!name) return []
    return [{
      name,
      description: String(record.description ?? 'Claude session command'),
      provider: 'claude',
      kind: String(record.type ?? '').toLowerCase().includes('skill') ? 'skill' : 'command',
      source: 'session',
    }]
  })
}
