import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const STATIC_CLAUDE_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
]

function resolveCliPathEnv(): string {
  const nvmVersionsDir = path.join(os.homedir(), '.nvm', 'versions', 'node')
  const nvmBinDirs = fs.existsSync(nvmVersionsDir)
    ? fs.readdirSync(nvmVersionsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(nvmVersionsDir, entry.name, 'bin'))
    : []

  const entries = [
    process.env.PATH,
    '/opt/homebrew/bin',
    '/usr/local/bin',
    path.join(os.homedir(), '.local', 'bin'),
    path.join(os.homedir(), '.npm-global', 'bin'),
    path.join(os.homedir(), '.bun', 'bin'),
    path.join(os.homedir(), '.claude', 'bin'),
    path.join(os.homedir(), '.claude', 'local'),
    path.join(os.homedir(), '.codex', 'bin'),
    path.join(os.homedir(), '.opencode', 'bin'),
    path.join(os.homedir(), 'Library', 'pnpm'),
    path.join(os.homedir(), '.config', 'yarn', 'global', 'node_modules', '.bin'),
    path.join(os.homedir(), 'anaconda3', 'bin'),
    path.join(os.homedir(), 'miniconda3', 'bin'),
    '/opt/anaconda3/bin',
    '/opt/miniconda3/bin',
    ...nvmBinDirs,
  ].filter(Boolean) as string[]

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    entries.push(
      path.join(appData, 'npm'),
      path.join(os.homedir(), 'scoop', 'shims'),
      path.join(process.env.ChocolateyInstall || 'C:\\ProgramData\\chocolatey', 'bin'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs'),
      path.join(localAppData, 'Programs', 'nodejs'),
      path.join(os.homedir(), '.logdd', 'runtime', 'node-v22.14.0-win-x64'),
      path.join(os.homedir(), '.logdd', 'runtime', 'node-v22.14.0-win-arm64'),
      path.join(os.homedir(), '.logdd', 'cli', 'node_modules', '.bin'),
    )
  }

  return [...new Set(entries.flatMap((entry) => entry.split(path.delimiter)).filter(Boolean))]
    .join(path.delimiter)
}

export const CLI_PATH_ENV = resolveCliPathEnv()

export function detectCliPath(command: string): string | null {
  if (!/^[a-z0-9_-]+$/i.test(command)) return null

  const candidates = [
    path.join(os.homedir(), '.local', 'bin', command),
    path.join(os.homedir(), '.claude', 'bin', command),
    path.join(os.homedir(), '.claude', 'local', command),
    path.join(os.homedir(), '.codex', 'bin', command),
    path.join(os.homedir(), '.opencode', 'bin', command),
    path.join(os.homedir(), '.bun', 'bin', command),
  ]
  if (process.platform === 'darwin' && command === 'codex') {
    candidates.push(
      '/Applications/ChatGPT.app/Contents/Resources/codex',
      '/Applications/Codex.app/Contents/Resources/codex',
      path.join(os.homedir(), 'Applications', 'ChatGPT.app', 'Contents', 'Resources', 'codex'),
      path.join(os.homedir(), 'Applications', 'Codex.app', 'Contents', 'Resources', 'codex'),
    )
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    const windowsCandidates = [
      path.join(appData, 'npm', command),
      path.join(os.homedir(), 'scoop', 'shims', command),
      path.join(process.env.ChocolateyInstall || 'C:\\ProgramData\\chocolatey', 'bin', command),
      path.join(os.homedir(), '.logdd', 'cli', 'node_modules', '.bin', command),
    ]
    candidates.push(...windowsCandidates)
    candidates.push(...candidates.flatMap((candidate) => [`${candidate}.cmd`, `${candidate}.exe`, `${candidate}.bat`]))
  }
  const direct = candidates.find((candidate) => fs.existsSync(candidate))
  if (direct) return direct

  try {
    const lookupCommand = process.platform === 'win32' ? 'where.exe' : 'which'
    const result = execFileSync(lookupCommand, [command], {
      timeout: 3000,
      encoding: 'utf8',
      env: { ...process.env, PATH: CLI_PATH_ENV },
    }).trim().split('\n')[0].trim()
    return result || null
  } catch {}

  // Electron launched from Finder/Dock does not inherit the user's interactive
  // shell PATH. Ask the login shell as a final source of truth on macOS/Linux.
  if (process.platform !== 'win32') {
    try {
      const shell = process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/sh')
      const result = execFileSync(shell, ['-lic', `command -v ${command}`], {
        timeout: 5000,
        encoding: 'utf8',
        env: process.env,
      }).trim().split(/\r?\n/).filter(Boolean).pop()?.trim()
      if (result && path.isAbsolute(result) && fs.existsSync(result)) return result
    } catch {}
  }

  return null
}

export function normalizeOpenCodeModel(model?: string): string | undefined {
  if (!model) return undefined
  return model.includes('/') ? model : `anthropic/${model}`
}

export function parseOpenCodeModels(stdout: string): string[] {
  const models: string[] = []
  const seen = new Set<string>()
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const firstToken = line.split(/\s+/)[0]?.trim() ?? ''
    if (!firstToken.includes('/')) continue
    const [provider, ...rest] = firstToken.split('/')
    const model = rest.join('/')
    if (!provider || !model) continue
    const id = `${provider}/${model}`
    if (!seen.has(id)) {
      seen.add(id)
      models.push(id)
    }
  }
  return models.sort((a, b) => a.localeCompare(b, 'en', {
    numeric: true,
    sensitivity: 'base',
  }))
}

export function parseCodexModels(stdout: string): string[] {
  try {
    const payload = JSON.parse(stdout) as { models?: Array<{ slug?: unknown; visibility?: unknown }> }
    return (payload.models ?? [])
      .filter((model) => model.visibility === undefined || model.visibility === 'list')
      .map((model) => typeof model.slug === 'string' ? model.slug.trim() : '')
      .filter((model, index, all) => Boolean(model) && all.indexOf(model) === index)
  } catch {
    return []
  }
}

export function parseCodexModelEfforts(stdout: string): Record<string, string[]> {
  try {
    const payload = JSON.parse(stdout) as {
      models?: Array<{
        slug?: unknown
        supported_reasoning_levels?: Array<{ effort?: unknown }>
      }>
    }
    return Object.fromEntries((payload.models ?? []).flatMap((model) => {
      if (typeof model.slug !== 'string' || !model.slug.trim()) return []
      const efforts = (model.supported_reasoning_levels ?? [])
        .map((level) => typeof level.effort === 'string' ? level.effort.trim() : '')
        .filter((effort, index, all) => Boolean(effort) && all.indexOf(effort) === index)
      return [[model.slug.trim(), efforts]]
    }))
  } catch {
    return {}
  }
}
