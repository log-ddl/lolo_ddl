import type { RenderCodec } from './types'

export function crfArgs(codec: RenderCodec, crf: number): string[] {
  // h264_nvenc uses -cq instead of -crf
  if (codec === 'h264_nvenc') return ['-cq', String(crf), '-preset', 'p4']
  return ['-crf', String(crf), '-preset', 'medium']
}
