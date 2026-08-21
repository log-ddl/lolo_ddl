import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  STATIC_CLAUDE_MODELS,
  parseCodexModelEfforts,
  parseCodexModels,
  parseOpenCodeModels,
} from '../../../../src/features/video-studio/lib/cli-runtime-shared'
import type { CliAdapter, CliModelsResult } from './types'
import { CLAUDE_EFFORTS } from './types'
import { resolveCliCommand, resolveSpawnArgs, cliEnvironment } from './process'

/**
 * Model discovery per adapter. Each CLI is asked for its model list once and the
 * answer is cached for a while — spawning the CLI on every dropdown open is slow.
 */

let openCodeModelsCache: string[] | null = null
let openCodeModelsCacheExpiry = 0
let codexModelsCache: string[] | null = null
let codexModelsCacheExpiry = 0
let codexModelEffortsCache: Record<string, string[]> = {}

export function writeSystemPromptFile(systemPrompt: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'longdd-claude-'))
  const filePath = path.join(dir, 'system-prompt.txt')
  fs.writeFileSync(filePath, systemPrompt, 'utf-8')
  return filePath
}

export function getOpenCodeEfforts(model: string): string[] {
  const normalized = model.toLocaleLowerCase()
  if (normalized.startsWith('anthropic/') || normalized.includes('claude')) return ['high', 'max']
  if (normalized.startsWith('google/') || normalized.includes('gemini')) return ['low', 'high']
  if (normalized.startsWith('openai/') || /(?:^|\/)(?:gpt|o[134])/.test(normalized)) {
    return ['none', 'minimal', 'low', 'medium', 'high', 'xhigh']
  }
  return ['low', 'medium', 'high']
}

export async function getCliModels(adapter: CliAdapter): Promise<CliModelsResult> {
  if (adapter === 'claude') {
    return { models: STATIC_CLAUDE_MODELS, source: 'static', efforts: CLAUDE_EFFORTS }
  }

  if (adapter === 'codex') {
    const now = Date.now()
    if (codexModelsCache && now < codexModelsCacheExpiry) {
      return {
        models: codexModelsCache,
        source: 'cli',
        efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
        effortsByModel: codexModelEffortsCache,
      }
    }

    return new Promise((resolve) => {
      let stdout = ''
      let settled = false
      const resolvedCodex = resolveSpawnArgs(resolveCliCommand('codex'), ['debug', 'models', '--bundled'])
      const proc = spawn(resolvedCodex.command, resolvedCodex.args, {
        env: cliEnvironment(),
        shell: false,
        windowsHide: true,
      })
      const timeout = setTimeout(() => {
        if (settled) return
        settled = true
        try { proc.kill() } catch {}
        resolve({
          models: codexModelsCache ?? [],
          source: 'cli',
          efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
          effortsByModel: codexModelEffortsCache,
        })
      }, 20000)

      proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
      proc.on('close', () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        const models = parseCodexModels(stdout)
        const effortsByModel = parseCodexModelEfforts(stdout)
        if (models.length > 0) {
          codexModelsCache = models
          codexModelEffortsCache = effortsByModel
          codexModelsCacheExpiry = Date.now() + 60000
        }
        resolve({
          models,
          source: 'cli',
          efforts: [...new Set(Object.values(effortsByModel).flat())],
          effortsByModel,
        })
      })
      proc.on('error', () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        resolve({
          models: codexModelsCache ?? [],
          source: 'cli',
          efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
          effortsByModel: codexModelEffortsCache,
        })
      })
    })
  }

  const now = Date.now()
  if (openCodeModelsCache && now < openCodeModelsCacheExpiry) {
    return {
      models: openCodeModelsCache,
      source: 'cli',
      efforts: ['low', 'medium', 'high'],
      effortsByModel: Object.fromEntries(openCodeModelsCache.map((model) => [model, getOpenCodeEfforts(model)])),
    }
  }

  return new Promise((resolve) => {
    let stdout = ''
    let settled = false
    const resolvedOC = resolveSpawnArgs(resolveCliCommand('opencode'), ['models'])
    const proc = spawn(resolvedOC.command, resolvedOC.args, {
      env: cliEnvironment({ OPENCODE_DISABLE_PROJECT_CONFIG: 'true' }),
      shell: false,
      windowsHide: true,
    })
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      try { proc.kill() } catch {}
      const models = openCodeModelsCache ?? []
      resolve({
        models,
        source: 'cli',
        efforts: ['low', 'medium', 'high'],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)])),
      })
    }, 20000)

    proc.stdout.on('data', (d: Buffer) => {
      stdout += d.toString()
    })
    proc.on('close', () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      const models = parseOpenCodeModels(stdout)
      if (models.length > 0) {
        openCodeModelsCache = models
        openCodeModelsCacheExpiry = Date.now() + 60000
      }
      resolve({
        models,
        source: 'cli',
        efforts: ['low', 'medium', 'high'],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)])),
      })
    })
    proc.on('error', () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      const models = openCodeModelsCache ?? []
      resolve({
        models,
        source: 'cli',
        efforts: ['low', 'medium', 'high'],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)])),
      })
    })
  })
}

