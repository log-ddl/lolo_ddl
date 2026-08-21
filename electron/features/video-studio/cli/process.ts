import { spawn } from 'node:child_process'
import { CLI_PATH_ENV as cliPathEnv, detectCliPath } from '../../../../src/features/video-studio/lib/cli-runtime-shared'
import type { SpawnConfig } from './types'
import { activeTasks, type ActiveCliTask } from './active-tasks'
import { windowsGitBashPath } from './install'

/**
 * Spawning CLI processes: PATH resolution, the Windows shell wrapper, the
 * streaming runner used by every adapter, and the `--version` probe that backs
 * the availability check.
 */

export function resolveCliCommand(command: string): string {
  return detectCliPath(command) || command
}

export function resolveSpawnArgs(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform === 'win32') {
    return { command: 'cmd', args: ['/c', command, ...args] }
  }
  return { command, args }
}

export function cliEnvironment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const gitBash = windowsGitBashPath()
  return {
    ...process.env,
    PATH: cliPathEnv,
    ...(gitBash ? { CLAUDE_CODE_GIT_BASH_PATH: gitBash } : {}),
    ...extra,
  }
}

export function spawnAndStream(cfg: SpawnConfig): Promise<{ exitCode: number | null; timedOut: boolean; canceled: boolean }> {
  return new Promise((resolve) => {
    const resolved = cfg.direct ? { command: cfg.command, args: cfg.args } : resolveSpawnArgs(cfg.command, cfg.args)
    const child = spawn(resolved.command, resolved.args, {
      shell: false,
      cwd: cfg.cwd,
      env: cliEnvironment(cfg.env),
      windowsHide: true,
    })

    let stdoutBuf = ''
    let stderrBuf = ''
    let timedOut = false
    let settled = false
    let timeoutHandle: NodeJS.Timeout | null = null
    let activeTask: ActiveCliTask | undefined

    if (cfg.requestId) {
      activeTask = { child, canceled: false }
      activeTasks.set(cfg.requestId, activeTask)
    }

    const finish = (code: number | null) => {
      if (settled) return
      settled = true
      if (timeoutHandle) clearTimeout(timeoutHandle)
      const currentTask = cfg.requestId ? activeTasks.get(cfg.requestId) : undefined
      const canceled = Boolean((currentTask || activeTask)?.canceled)
      const killTimer = (currentTask || activeTask)?.killTimer
      if (killTimer) clearTimeout(killTimer)
      if (cfg.requestId && currentTask === activeTask) {
        activeTasks.delete(cfg.requestId)
      }
      if (stdoutBuf.trim()) cfg.onStdoutLine(stdoutBuf.trim())
      if (stderrBuf.trim()) cfg.onStderrLine(stderrBuf.trim())
      resolve({ exitCode: code, timedOut, canceled })
    }

    if (cfg.timeoutMs) {
      timeoutHandle = setTimeout(() => {
        timedOut = true
        try {
          child.kill('SIGTERM')
        } catch {}
        setTimeout(() => {
          try {
            if (!child.killed) child.kill('SIGKILL')
          } catch {}
        }, 3000)
      }, cfg.timeoutMs)
    }

    if (cfg.stdinText !== undefined) {
      try {
        child.stdin?.write(cfg.stdinText)
        child.stdin?.end()
      } catch {}
    }

    child.stdout?.on('data', (data: Buffer) => {
      stdoutBuf += data.toString()
      const lines = stdoutBuf.split(/\r?\n/)
      stdoutBuf = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) cfg.onStdoutLine(trimmed)
      }
    })

    child.stderr?.on('data', (data: Buffer) => {
      stderrBuf += data.toString()
      const lines = stderrBuf.split(/\r?\n/)
      stderrBuf = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) cfg.onStderrLine(trimmed)
      }
    })

    child.on('close', finish)
    child.on('error', () => finish(-1))
  })
}

export function detectCli(command: string, args: string[] = ['--version']): Promise<{ available: boolean; version?: string; error?: string; path?: string | null }> {
  const cliPath = detectCliPath(command)
  return new Promise((resolve) => {
    const resolved = resolveSpawnArgs(cliPath || command, args)
    const child = spawn(resolved.command, resolved.args, {
      shell: false,
      windowsHide: true,
      env: cliEnvironment(),
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (available: boolean, version?: string, error?: string) => {
      if (settled) return
      settled = true
      resolve({ available, version, error, path: cliPath })
    }

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString()
    })
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })
    child.on('error', (error) => finish(false, undefined, error.message))
    child.on('close', (code) => {
      const output = `${stdout}\n${stderr}`.trim()
      if (code === 0) {
        finish(true, output.split(/\r?\n/)[0]?.trim() || 'OK')
      } else {
        finish(false, undefined, output || `${command} exited with code ${code}`)
      }
    })
  })
}

