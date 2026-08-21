import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export interface ContentSlashCommand {
  name: string
  description: string
  provider: 'claude' | 'opencode' | 'codex'
  kind: 'skill' | 'command'
  source: 'user' | 'workspace' | 'session'
}

interface MarkdownCommand extends ContentSlashCommand {
  template: string
  agent?: string
  model?: string
  subtask?: boolean
}

function unquote(value: string) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseMarkdown(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  const match = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(content)
  const frontmatter = match?.[1] ?? ''
  const body = match ? content.slice(match[0].length).trim() : content.trim()
  const field = (name: string) => {
    const value = new RegExp(`^${name}:\\s*(.+)$`, 'mi').exec(frontmatter)?.[1]
    return value ? unquote(value) : undefined
  }
  return {
    body,
    name: field('name'),
    description: field('description') || '',
    agent: field('agent'),
    model: field('model'),
    subtask: field('subtask') === 'true' ? true : field('subtask') === 'false' ? false : undefined,
    userInvocable: field('user-invocable') !== 'false',
  }
}

function markdownFiles(root: string): string[] {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return []
  const files: string[] = []
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(candidate)
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) files.push(candidate)
    }
  }
  visit(root)
  return files
}

function workspaceRoots(workingDirectory: string | undefined, configFolder: string): string[] {
  if (!workingDirectory) return []
  const start = path.resolve(workingDirectory)
  const chain: string[] = []
  let current = start
  let gitRootFound = false
  while (true) {
    chain.push(current)
    if (fs.existsSync(path.join(current, '.git'))) {
      gitRootFound = true
      break
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  const scoped = gitRootFound ? chain.reverse() : [start]
  return scoped.map((directory) => path.join(directory, configFolder))
}

function addSkills(
  target: Map<string, MarkdownCommand>,
  root: string,
  provider: 'claude' | 'opencode' | 'codex',
  source: 'user' | 'workspace',
) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const skillFile = path.join(root, entry.name, 'SKILL.md')
    if (!fs.existsSync(skillFile)) continue
    const parsed = parseMarkdown(skillFile)
    if (!parsed.userInvocable) continue
    const name = parsed.name || entry.name
    target.set(name.toLocaleLowerCase(), {
      name,
      description: parsed.description || `${provider === 'claude' ? 'Claude' : provider === 'opencode' ? 'OpenCode' : 'Codex'} skill from ${source}`,
      provider,
      kind: 'skill',
      source,
      template: parsed.body,
    })
  }
}

function addMarkdownCommands(
  target: Map<string, MarkdownCommand>,
  root: string,
  provider: 'claude' | 'opencode' | 'codex',
  source: 'user' | 'workspace',
) {
  for (const filePath of markdownFiles(root)) {
    const parsed = parseMarkdown(filePath)
    const relative = path.relative(root, filePath).replace(/\.md$/i, '').split(path.sep).join(':')
    const name = parsed.name || relative
    target.set(name.toLocaleLowerCase(), {
      name,
      description: parsed.description || `${provider === 'claude' ? 'Claude' : provider === 'opencode' ? 'OpenCode' : 'Codex'} command from ${source}`,
      provider,
      kind: 'command',
      source,
      template: parsed.body,
      agent: parsed.agent,
      model: parsed.model,
      subtask: parsed.subtask,
    })
  }
}

function discoverClaude(workingDirectory?: string) {
  const commands = new Map<string, MarkdownCommand>()
  const userRoot = path.join(os.homedir(), '.claude')
  addSkills(commands, path.join(userRoot, 'skills'), 'claude', 'user')
  addMarkdownCommands(commands, path.join(userRoot, 'commands'), 'claude', 'user')
  for (const root of workspaceRoots(workingDirectory, '.claude')) {
    addSkills(commands, path.join(root, 'skills'), 'claude', 'workspace')
    addMarkdownCommands(commands, path.join(root, 'commands'), 'claude', 'workspace')
  }
  return [...commands.values()]
}

function discoverOpenCode(workingDirectory?: string) {
  const commands = new Map<string, MarkdownCommand>()
  const home = os.homedir()
  const globalOpenCode = path.join(home, '.config', 'opencode')
  addSkills(commands, path.join(globalOpenCode, 'skills'), 'opencode', 'user')
  addSkills(commands, path.join(home, '.claude', 'skills'), 'opencode', 'user')
  addSkills(commands, path.join(home, '.agents', 'skills'), 'opencode', 'user')
  addMarkdownCommands(commands, path.join(globalOpenCode, 'commands'), 'opencode', 'user')
  for (const root of workspaceRoots(workingDirectory, '.opencode')) {
    addSkills(commands, path.join(root, 'skills'), 'opencode', 'workspace')
    addMarkdownCommands(commands, path.join(root, 'commands'), 'opencode', 'workspace')
  }
  for (const root of workspaceRoots(workingDirectory, '.claude')) {
    addSkills(commands, path.join(root, 'skills'), 'opencode', 'workspace')
  }
  for (const root of workspaceRoots(workingDirectory, '.agents')) {
    addSkills(commands, path.join(root, 'skills'), 'opencode', 'workspace')
  }
  return [...commands.values()]
}

function discoverCodex(workingDirectory?: string) {
  const commands = new Map<string, MarkdownCommand>()
  const home = os.homedir()
  // Current Codex uses .agents/skills; .codex/skills remains supported for
  // existing personal and system skills installed by earlier releases.
  addSkills(commands, path.join(home, '.codex', 'skills'), 'codex', 'user')
  addSkills(commands, path.join(home, '.agents', 'skills'), 'codex', 'user')
  for (const root of workspaceRoots(workingDirectory, '.codex')) {
    addSkills(commands, path.join(root, 'skills'), 'codex', 'workspace')
  }
  for (const root of workspaceRoots(workingDirectory, '.agents')) {
    addSkills(commands, path.join(root, 'skills'), 'codex', 'workspace')
  }
  return [...commands.values()]
}

/**
 * Các thư mục gốc mà một provider sẽ đọc. Dùng để đặt watcher — biết chính xác chỗ
 * nào đổi thì mới huỷ cache đúng chỗ.
 */
function rootsFor(provider: 'claude' | 'opencode' | 'codex', workingDirectory?: string): string[] {
  const home = os.homedir()
  const roots: string[] = []
  if (provider === 'claude') {
    roots.push(path.join(home, '.claude', 'skills'), path.join(home, '.claude', 'commands'))
    for (const root of workspaceRoots(workingDirectory, '.claude')) {
      roots.push(path.join(root, 'skills'), path.join(root, 'commands'))
    }
  } else if (provider === 'opencode') {
    const globalOpenCode = path.join(home, '.config', 'opencode')
    roots.push(
      path.join(globalOpenCode, 'skills'),
      path.join(globalOpenCode, 'commands'),
      path.join(home, '.claude', 'skills'),
      path.join(home, '.agents', 'skills'),
    )
    for (const configFolder of ['.opencode', '.claude', '.agents']) {
      for (const root of workspaceRoots(workingDirectory, configFolder)) {
        roots.push(path.join(root, 'skills'), path.join(root, 'commands'))
      }
    }
  } else {
    roots.push(path.join(home, '.codex', 'skills'), path.join(home, '.agents', 'skills'))
    for (const configFolder of ['.codex', '.agents']) {
      for (const root of workspaceRoots(workingDirectory, configFolder)) {
        roots.push(path.join(root, 'skills'))
      }
    }
  }
  return [...new Set(roots)]
}

/**
 * Cache kết quả quét + watcher tự huỷ cache.
 *
 * Quét là thao tác đắt: đệ quy readdirSync và đọc frontmatter từng file .md, đồng
 * bộ trên main process. Trước đây nó chạy lại mỗi lần đổi hội thoại và mỗi lần bật
 * menu `/`. Giờ chỉ chạy lại khi thư mục skill/command thật sự thay đổi — nhanh mà
 * vẫn không bao giờ cũ.
 */
const commandCache = new Map<string, ContentSlashCommand[]>()
const definitionCache = new Map<string, ReturnType<typeof buildOpenCodeDefinitions>>()
const watchedKeys = new Set<string>()

function cacheKey(provider: string, workingDirectory?: string) {
  return `${provider} ${workingDirectory ?? ''}`
}

/** Thư mục chưa tồn tại thì theo dõi tổ tiên gần nhất, để lúc nó được tạo cũng bắt được. */
function nearestExistingDir(candidate: string): string | null {
  let current = candidate
  for (let depth = 0; depth < 10; depth += 1) {
    if (fs.existsSync(current)) return current
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
  return null
}

function watchRoots(key: string, roots: string[]): void {
  if (watchedKeys.has(key)) return
  watchedKeys.add(key)
  const targets = new Set<string>()
  for (const root of roots) {
    const target = nearestExistingDir(root)
    if (target) targets.add(target)
  }
  for (const target of targets) {
    const invalidate = () => {
      commandCache.delete(key)
      definitionCache.delete(key)
    }
    try {
      // persistent: false để watcher không giữ process sống.
      const watcher = fs.watch(target, { recursive: true, persistent: false }, invalidate)
      watcher.on('error', invalidate)
    } catch {
      try {
        const watcher = fs.watch(target, { persistent: false }, invalidate)
        watcher.on('error', invalidate)
      } catch {
        // Không đặt được watcher (ổ mạng, quyền hạn…) thì bỏ cache cho khoá này
        // để lần sau quét lại, thà chậm còn hơn hiện danh sách cũ.
        commandCache.delete(key)
        watchedKeys.delete(key)
      }
    }
  }
}

export function discoverContentSlashCommands(provider: 'claude' | 'opencode' | 'codex', workingDirectory?: string): ContentSlashCommand[] {
  const key = cacheKey(provider, workingDirectory)
  const cached = commandCache.get(key)
  if (cached) return cached

  const commands = provider === 'claude'
    ? discoverClaude(workingDirectory)
    : provider === 'opencode'
      ? discoverOpenCode(workingDirectory)
      : discoverCodex(workingDirectory)
  const result = commands
    .map(({ template: _template, agent: _agent, model: _model, subtask: _subtask, ...command }) => command)
    .sort((a, b) => a.name.localeCompare(b.name))

  commandCache.set(key, result)
  watchRoots(key, rootsFor(provider, workingDirectory))
  return result
}

function buildOpenCodeDefinitions(workingDirectory?: string) {
  return Object.fromEntries(discoverOpenCode(workingDirectory).map((command) => [command.name, {
    template: command.template,
    description: command.description,
    ...(command.agent ? { agent: command.agent } : {}),
    ...(command.model ? { model: command.model } : {}),
    ...(command.subtask !== undefined ? { subtask: command.subtask } : {}),
  }]))
}

export function getOpenCodeCommandDefinitions(workingDirectory?: string) {
  const key = cacheKey('opencode', workingDirectory)
  const cached = definitionCache.get(key)
  if (cached) return cached
  const definitions = buildOpenCodeDefinitions(workingDirectory)
  definitionCache.set(key, definitions)
  watchRoots(key, rootsFor('opencode', workingDirectory))
  return definitions
}
