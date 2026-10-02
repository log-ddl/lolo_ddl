import { GOOGLE_FLOW_IMAGE_MODELS, GOOGLE_FLOW_VIDEO_MODELS } from '../../../../src/features/video-studio/lib/api-key-manager'
import crypto from 'node:crypto'
import { getMcpMediaRuntime } from '../../../browser-runtimes'
import type { GoogleFlowRuntime } from '../../video-studio/google-flow/runtime'

type Job = { taskId: string; status: string; progress?: number; result?: unknown; error?: string }
const jobs = new Map<string, Job>()
const cancellations = new Map<string, () => boolean>()
export async function executeMediaTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'get_media_capabilities') return { googleflow: { imageModels: GOOGLE_FLOW_IMAGE_MODELS, videoModels: GOOGLE_FLOW_VIDEO_MODELS }, instructions: 'Sign in to Google Flow in Video Studio first. Pass a model from this list. Jobs may consume credits.' }
  if (name === 'get_media_task' || name === 'cancel_media_task') {
    const id = String(args.taskId || '')
    const job = jobs.get(id)
    if (!job) throw new Error('Task not found. MCP jobs are available until logdd closes.')
    if (name === 'cancel_media_task') return { taskId: id, cancelled: cancellations.get(id)?.() ?? false }
    return { ...job }
  }
  if (typeof args.prompt !== 'string' || !args.prompt.trim() || args.prompt.length > 20000) throw new Error('prompt must contain 1–20000 characters')
  if (typeof args.model !== 'string' || !args.model.trim() || args.model.length > 256) throw new Error('model is required')
  if (args.provider !== undefined && args.provider !== 'googleflow') throw new Error('Unsupported provider')
  const provider = 'googleflow'
  const models = name === 'generate_image' ? GOOGLE_FLOW_IMAGE_MODELS : GOOGLE_FLOW_VIDEO_MODELS
  if (!models.includes(args.model)) throw new Error('Unsupported model. Call get_media_capabilities first.')
  if (args.aspectRatio !== undefined && !['16:9', '9:16', '1:1'].includes(String(args.aspectRatio))) throw new Error('Invalid aspectRatio')
  if (args.duration !== undefined && (typeof args.duration !== 'number' || !Number.isFinite(args.duration) || args.duration < 1 || args.duration > 30)) throw new Error('Invalid duration')
  if (args.startImage !== undefined && (typeof args.startImage !== 'string' || !args.startImage.trim())) throw new Error('Invalid startImage')
  if (cancellations.size >= 8) throw new Error('Eight media jobs are already running. Wait for completion.')
  const runtime = await getMcpMediaRuntime(provider)
  if (cancellations.size >= 8) throw new Error('Eight media jobs are already running. Wait for completion.')
  const taskId = crypto.randomUUID()
  const job: Job = { taskId, status: 'queued', progress: 0 }
  // Retain the most recent 100 completed jobs, without evicting running jobs.
  if (jobs.size >= 100) for (const [id] of jobs) { if (!cancellations.has(id)) { jobs.delete(id); break } }
  jobs.set(taskId, job)
  cancellations.set(taskId, () => runtime.cancelTask(taskId))
  const listener = (event: { taskId: string; status: string; progress?: number }) => {
    if (event.taskId === taskId) { job.status = event.status; job.progress = event.progress }
  }
  runtime.on('task', listener)
  const input = { taskId, projectId: 'mcp-external', sceneId: taskId, prompt: args.prompt, model: args.model,
    aspectRatio: String(args.aspectRatio || '16:9'), duration: args.duration as number | undefined,
    startImage: args.startImage ? { source: String(args.startImage) } : undefined }
  void Promise.resolve().then<unknown>(() => name === 'generate_image'
    ? (runtime as GoogleFlowRuntime).generateImage(input)
    : runtime.generateVideo(input)).then((result) => {
    job.status = 'completed'; job.progress = 100; job.result = result
  }).catch((error) => {
    if (job.status !== 'cancelled') job.status = 'failed'
    job.error = error instanceof Error ? error.message : String(error)
  }).finally(() => { runtime.off('task', listener); cancellations.delete(taskId) })
  return { ...job }
}
