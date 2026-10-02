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
  ['cosyvoice3-0.5b', { repository: 'FunAudioLLM/Fun-CosyVoice3-0.5B-2512', capability: 'cosyvoice' }],
  ['omnivoice-main', { repository: 'k2-fsa/OmniVoice', capability: 'omnivoice' }],
  ['vieneu-v3-turbo', { repository: 'pnnbao97/VieNeu-TTS', capability: 'vieneu' }],
])

ALLOWED_MODELS.set('qwen3-0.6b-custom', { repository: 'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice', capability: 'qwen3' })

ALLOWED_MODELS.set('qwen3-0.6b-base', { repository: 'Qwen/Qwen3-TTS-12Hz-0.6B-Base', capability: 'qwen3' })

ALLOWED_MODELS.set('qwen3-1.7b-custom', { repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice', capability: 'qwen3' })

ALLOWED_MODELS.set('qwen3-1.7b-base', { repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-Base', capability: 'qwen3' })

ALLOWED_MODELS.set('qwen3-1.7b-design', { repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', capability: 'qwen3' })

export function assertAllowedModel(model: TtsModelDescriptor) {
  const allowed = ALLOWED_MODELS.get(model.id)
  if (!allowed || allowed.repository !== model.repository || allowed.capability !== model.capability) {
    throw new Error('Model TTS không được phép')
  }
}

