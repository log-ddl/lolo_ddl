import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import type { TtsModelDescriptor, TtsRuntimeProgress } from '../omnivoice-runtime'

/** Shared constants and in-flight job registries for the OmniVoice runtime. */

export type Emit = (event: TtsRuntimeProgress) => void
export type TtsAccelerator = 'cuda' | 'mps' | 'xpu' | 'cpu'

export interface RuntimeProbe {
  backend: TtsAccelerator
  torchVersion: string
  cudaBuild: string | null
}

export const jobs = new Map<string, ChildProcessWithoutNullStreams>()
export const downloadControllers = new Map<string, AbortController>()
export const canceledJobs = new Set<string>()
export const RUNTIME_VERSION = 2
export const TORCH_VERSION = '2.8.0'
export const TORCH_CUDA_INDEX = 'https://download.pytorch.org/whl/cu128'
export const ALLOWED_MODELS = new Map<string, Omit<TtsModelDescriptor, 'id'>>([
  ['omnivoice-main', { repository: 'k2-fsa/OmniVoice', capability: 'omnivoice' }],
  ['vieneu-v3-turbo', { repository: 'pnnbao97/VieNeu-TTS', capability: 'vieneu' }],
])

export function assertAllowedModel(model: TtsModelDescriptor) {
  const allowed = ALLOWED_MODELS.get(model.id)
  if (!allowed || allowed.repository !== model.repository || allowed.capability !== model.capability) {
    throw new Error('Model TTS không được phép')
  }
}

