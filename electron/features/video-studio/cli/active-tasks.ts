import type { ChildProcess } from 'node:child_process'

/**
 * In-flight CLI processes, keyed by the renderer's requestId so a single chat
 * can be cancelled without touching the others.
 */

export interface ActiveCliTask {
  child: ChildProcess
  canceled: boolean
  killTimer?: NodeJS.Timeout
}

export const activeTasks = new Map<string, ActiveCliTask>()

export function cancelCliTextTask(requestId: string): { canceled: boolean } {
  const task = activeTasks.get(requestId)
  if (!task) return { canceled: false }

  task.canceled = true
  try {
    task.child.kill('SIGTERM')
  } catch {}

  // SIGTERM is a request; a wedged CLI can ignore it. Escalate after a grace period.
  task.killTimer = setTimeout(() => {
    try {
      task.child.kill('SIGKILL')
    } catch {}
  }, 3000)

  return { canceled: true }
}
