import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { CliAdapter, CliInstallResult } from './types'
import { createHash } from 'node:crypto'
import { detectCliPath } from '../../../../src/features/video-studio/lib/cli-runtime-shared'
import { cliEnvironment, detectCli, resolveSpawnArgs } from './process'

/**
 * One-click CLI installation.
 *
 * Unix just runs the vendor install script. Windows has no shell for it, so we
 * bootstrap Git Bash and a managed Node/npm first, then install the npm package.
 */

export const CLI_INSTALLERS: Record<CliAdapter, { unix: string; npmPackage: string }> = {
  claude: {
    unix: 'curl -fsSL https://claude.ai/install.sh | bash',
    npmPackage: '@anthropic-ai/claude-code',
  },
  opencode: {
    unix: 'curl -fsSL https://opencode.ai/install | bash',
    npmPackage: 'opencode-ai',
  },
  codex: {
    unix: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh',
    npmPackage: '@openai/codex',
  },
}

export interface InstallerProcessResult {
  ok: boolean
  output: string
  code: number | null
}

export function runInstallerProcess(command: string, args: string[], timeoutMs = 10 * 60_000): Promise<InstallerProcessResult> {
  return new Promise((resolve) => {
    const resolved = resolveSpawnArgs(command, args)
    const child = spawn(resolved.command, resolved.args, {
      shell: false,
      windowsHide: true,
      env: cliEnvironment(),
    })
    let output = ''
    let settled = false
    const append = (data: Buffer) => {
      output = `${output}${data.toString()}`.slice(-16000)
    }
    child.stdout?.on('data', append)
    child.stderr?.on('data', append)
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { child.kill('SIGTERM') } catch {}
      resolve({ ok: false, output: `${output}\nCài đặt quá thời gian cho phép.`.trim(), code: null })
    }, timeoutMs)
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: false, output: `${output}\n${error.message}`.trim(), code: null })
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: code === 0, output: output.trim(), code })
    })
  })
}

export function windowsGitBashPath(): string | null {
  if (process.platform !== 'win32') return null
  const candidates = [
    process.env.CLAUDE_CODE_GIT_BASH_PATH,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'bin', 'bash.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Git', 'bin', 'bash.exe'),
    path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Git', 'bin', 'bash.exe'),
    path.join(os.homedir(), 'scoop', 'apps', 'git', 'current', 'bin', 'bash.exe'),
  ].filter(Boolean) as string[]
  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

export async function ensureWindowsGitBash(): Promise<{ ok: boolean; output: string }> {
  if (windowsGitBashPath()) return { ok: true, output: 'Git Bash đã sẵn sàng.' }
  const installers: Array<{ command: string; args: string[] }> = [
    { command: 'winget', args: ['install', '--id', 'Git.Git', '--exact', '--silent', '--accept-package-agreements', '--accept-source-agreements'] },
    { command: 'choco', args: ['install', 'git', '-y'] },
    { command: 'scoop', args: ['install', 'git'] },
  ]
  for (const candidate of installers) {
    const executable = detectCliPath(candidate.command)
    if (!executable) continue
    const result = await runInstallerProcess(executable, candidate.args)
    if (result.ok && windowsGitBashPath()) return { ok: true, output: result.output }
  }
  return {
    ok: false,
    output: 'Claude Code trên Windows cần Git Bash. Không tìm thấy winget, Chocolatey hoặc Scoop để tự cài Git for Windows.',
  }
}

export async function ensureManagedWindowsNode(): Promise<{ npmPath?: string; output: string }> {
  const systemNpm = detectCliPath('npm')
  if (systemNpm) return { npmPath: systemNpm, output: 'Đang dùng npm có sẵn trên máy.' }

  const version = '22.14.0'
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const expectedSha256 = arch === 'arm64'
    ? '2d71f5f9b2fffa33baa108c07d74b0d24e0c3dd8f441d567772ae0e3dd4b1a22'
    : '55b639295920b219bb2acbcfa00f90393a2789095b7323f79475c9f34795f217'
  const folderName = `node-v${version}-win-${arch}`
  const runtimeRoot = path.join(os.homedir(), '.logdd', 'runtime')
  const nodeRoot = path.join(runtimeRoot, folderName)
  const npmPath = path.join(nodeRoot, 'npm.cmd')
  if (fs.existsSync(npmPath)) return { npmPath, output: `Đang dùng Node.js riêng của logdd (${version}).` }

  fs.mkdirSync(runtimeRoot, { recursive: true })
  const zipPath = path.join(runtimeRoot, `${folderName}.zip`)
  try {
    const response = await fetch(`https://nodejs.org/dist/v${version}/${folderName}.zip`)
    if (!response.ok) throw new Error(`Tải Node.js thất bại (${response.status}).`)
    const archive = Buffer.from(await response.arrayBuffer())
    const actualSha256 = createHash('sha256').update(archive).digest('hex')
    if (actualSha256 !== expectedSha256) throw new Error('Gói Node.js tải về không vượt qua kiểm tra an toàn SHA-256.')
    fs.writeFileSync(zipPath, archive)
    const quote = (value: string) => value.replace(/'/g, "''")
    const extracted = await runInstallerProcess('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Expand-Archive -LiteralPath '${quote(zipPath)}' -DestinationPath '${quote(runtimeRoot)}' -Force`,
    ])
    if (!extracted.ok || !fs.existsSync(npmPath)) {
      return { output: extracted.output || 'Không thể giải nén Node.js tự quản lý.' }
    }
    return { npmPath, output: `Đã chuẩn bị Node.js riêng cho logdd (${version}).` }
  } catch (error) {
    return { output: error instanceof Error ? error.message : String(error) }
  } finally {
    try { fs.unlinkSync(zipPath) } catch {}
  }
}

export async function installCliOnWindows(adapter: CliAdapter): Promise<InstallerProcessResult> {
  let preparation = ''
  if (adapter === 'claude') {
    const git = await ensureWindowsGitBash()
    preparation = git.output
    if (!git.ok) return { ok: false, output: git.output, code: null }
  }

  const node = await ensureManagedWindowsNode()
  preparation = `${preparation}\n${node.output}`.trim()
  if (!node.npmPath) return { ok: false, output: preparation, code: null }

  const managedCliRoot = path.join(os.homedir(), '.logdd', 'cli')
  fs.mkdirSync(managedCliRoot, { recursive: true })
  const installed = await runInstallerProcess(node.npmPath, [
    'install',
    '--prefix', managedCliRoot,
    CLI_INSTALLERS[adapter].npmPackage,
    '--no-audit',
    '--no-fund',
  ])
  return { ...installed, output: `${preparation}\n${installed.output}`.trim() }
}

/** Installs only from each CLI vendor's official installer/package. */
export async function installCli(adapter: CliAdapter): Promise<CliInstallResult> {
  const installer = CLI_INSTALLERS[adapter]
  const result = process.platform === 'win32'
    ? await installCliOnWindows(adapter)
    : await runInstallerProcess('/bin/sh', ['-lc', installer.unix])
  const status = await detectCli(adapter)
  if (result.ok && status.available) return { success: true, output: result.output, status }
  return {
    success: false,
    output: result.output,
    status,
    error: result.output || `Installer kết thúc với mã ${result.code ?? 'không xác định'}.`,
  }
}

