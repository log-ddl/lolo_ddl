export type MediaAsset = {
  assetId: string; kind: 'image' | 'video' | 'audio'; source: string;
  provider?: string; model?: string; outputPath?: string; durationSec?: number;
  mediaId?: string; ownerScopeId?: string; flowProjectId?: string; credentialId?: string;
}
export type MediaTask = {
  taskId: string; tool: string; requestKey: string; fingerprint: string;
  status: 'running' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted';
  createdAt: number; updatedAt: number; stage?: string; percent?: number; error?: string;
  result?: MediaAsset | Record<string, unknown>;
}
type Context = { taskId: string; signal: AbortSignal; progress: (stage: string, percent?: number) => void }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  return JSON.stringify(value)
}

export class MediaTasks {
  private tasks = new Map<string, MediaTask>()
  private controllers = new Map<string, AbortController>()
  constructor(private storage?: Pick<Storage, 'getItem' | 'setItem'>) {
    try {
      const saved: MediaTask[] = JSON.parse(storage?.getItem('logdd-mcp-media-v1') || '[]')
      for (const task of saved) {
        if (task.status === 'running' || task.status === 'cancelling') {
          task.status = 'interrupted'
          task.error = 'App restarted or reloaded. Check provider history before submitting a new request.'
        }
        this.tasks.set(task.taskId, task)
      }
    } catch { /* A corrupt cache must not prevent app startup. */ }
  }
  private save() {
    try { this.storage?.setItem('logdd-mcp-media-v1', JSON.stringify([...this.tasks.values()])) } catch { /* Current session still works if storage is full. */ }
  }
  list() { return [...this.tasks.values()].reverse().map(({ fingerprint: _fingerprint, ...task }) => ({ ...task })) }
  get(id: string) {
    const task = this.list().find((item) => item.taskId === id)
    if (!task) throw new Error(`Unknown taskId: ${id}`)
    return task
  }
  asset(id: string): MediaAsset {
    const task = [...this.tasks.values()].find((item) => item.status === 'completed' && item.result?.assetId === id)
    if (!task) throw new Error(`Unknown assetId: ${id}`)
    return { ...task.result } as MediaAsset
  }
  start(tool: string, args: Record<string, unknown>, work: (context: Context) => Promise<MediaTask['result']>) {
    const requestKey = String(args.requestKey)
    const fingerprint = canonical({ tool, args })
    const existing = [...this.tasks.values()].find((item) => item.requestKey === requestKey)
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new Error('requestKey already used with different arguments')
      return this.get(existing.taskId)
    }
    if (this.controllers.size >= 8) throw new Error('Too many active MCP tasks. Wait for an existing task to finish.')
    // Keep idempotency records and reference assets: never silently evict them.
    if (this.tasks.size >= 1000) throw new Error('MCP task history is full (1000 tasks). Archive/reset the MCP cache before submitting more work.')
    const taskId = `mcp-${crypto.randomUUID()}`
    const task: MediaTask = { taskId, tool, requestKey, fingerprint, status: 'running', createdAt: Date.now(), updatedAt: Date.now(), stage: 'starting' }
    const controller = new AbortController()
    this.tasks.set(taskId, task)
    this.controllers.set(taskId, controller)
    this.save()
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError')
      return work({ taskId, signal: controller.signal, progress: (stage, percent) => {
        if (task.status !== 'running') return
        Object.assign(task, { stage, percent, updatedAt: Date.now() }); this.save()
      } })
    }).then((result) => {
      // A provider may finish before cancellation reaches it. Preserve the output.
      task.result = result; task.status = 'completed'; task.stage = 'completed'; task.percent = 100
    }).catch((error) => {
      task.status = controller.signal.aborted ? 'cancelled' : 'failed'
      task.error = error instanceof Error ? error.message : String(error)
    }).finally(() => { task.updatedAt = Date.now(); this.controllers.delete(taskId); this.save() })
    return this.get(taskId)
  }
  cancel(id: string) {
    this.get(id)
    const controller = this.controllers.get(id)
    if (controller) {
      const task = this.tasks.get(id)!
      task.status = 'cancelling'; task.updatedAt = Date.now(); this.save()
      controller.abort()
    }
    return this.get(id)
  }
}
