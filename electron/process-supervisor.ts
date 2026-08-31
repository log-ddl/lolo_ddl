import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'

interface ManagedProcess {
  id: string
  name: string
  pid: number
  startTime: number
  process: ChildProcess
}

const activeProcesses = new Map<string, ManagedProcess>()

/**
 * Spawns a supervised child process with detached process-group semantics
 * to allow complete subtree termination upon cancellation or application exit.
 */
export function spawnManagedProcess(
  id: string,
  name: string,
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): ChildProcess {
  // If a previous instance with same id is running, kill it first
  if (activeProcesses.has(id)) {
    terminateManagedProcess(id)
  }

  const child = spawn(command, args, {
    ...options,
    // Detach on Unix so process.kill(-pid) terminates all descendants
    detached: process.platform !== 'win32',
  })

  if (child.pid) {
    const record: ManagedProcess = {
      id,
      name,
      pid: child.pid,
      startTime: Date.now(),
      process: child,
    }
    activeProcesses.set(id, record)

    const cleanup = () => {
      activeProcesses.delete(id)
    }

    child.on('exit', cleanup)
    child.on('error', cleanup)
  }

  return child
}

/**
 * Terminates a managed process and its entire descendant process tree.
 */
export function terminateManagedProcess(id: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
  const record = activeProcesses.get(id)
  if (!record || !record.pid) return false

  const pid = record.pid
  activeProcesses.delete(id)

  if (process.platform === 'win32') {
    try {
      const killer = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      killer.unref()
    } catch {
      try {
        record.process.kill()
      } catch {}
    }
    return true
  }

  // Unix: Kill process group
  try {
    process.kill(-pid, signal)
  } catch (error: any) {
    if (error?.code !== 'ESRCH') {
      try {
        record.process.kill(signal)
      } catch {}
    }
  }

  return true
}

/**
 * Terminates all active child processes immediately.
 */
export function terminateAllManagedProcesses(): void {
  for (const id of Array.from(activeProcesses.keys())) {
    terminateManagedProcess(id, 'SIGKILL')
  }
  activeProcesses.clear()
}

export function getActiveProcessCount(): number {
  return activeProcesses.size
}

export function getActiveProcessList(): Array<{ id: string; name: string; pid: number; runtimeMs: number }> {
  const now = Date.now()
  return Array.from(activeProcesses.values()).map((proc) => ({
    id: proc.id,
    name: proc.name,
    pid: proc.pid,
    runtimeMs: now - proc.startTime,
  }))
}
