import fs from 'node:fs'
import path from 'node:path'
import { crfArgs } from './codec-args'
import { buildSubtitleFilter } from './subtitles'
import type { RenderCodec, XfadeTimelineItem } from './types'

/**
 * The final pass: fold the per-segment clips into one video (concat for hard
 * cuts, xfade when there are transitions) and lay the audio chain over it —
 * narration, SFX, ducked BGM, optional original clip audio, optional loudnorm.
 */

export interface FinalConcatInputs {
  concatList: string
  audioPath: string
  audioStartSec: number
  sfxInputs: Array<{ path: string; startMs: number }>
  bgmPath: string
  bgmVolume: number
  duckBgm: boolean
  assSubtitlePath: string | null
  totalDurationSec: number
  codec: RenderCodec
  crf: number
  outputPath: string
  audioNormalize: boolean
  videoAudioVolume: number
  masterFromSegments: boolean
  /** True when at least one concatenated segment carries an audio stream. */
  anySegmentHasAudio: boolean
}

export interface FinalXfadeInputs {
  segmentFiles: string[]
  transitionPlan: XfadeTimelineItem[]
  audioPath: string
  audioStartSec: number
  sfxInputs: Array<{ path: string; startMs: number }>
  bgmPath: string
  bgmVolume: number
  duckBgm: boolean
  assSubtitlePath: string | null
  totalDurationSec: number
  codec: RenderCodec
  crf: number
  outputPath: string
  audioNormalize: boolean
  videoAudioVolume: number
  segmentCount: number
  tempDir: string
  /** Per-segment flag: true when that segment file actually carries an audio stream. */
  segmentHasAudio: boolean[]
}

/**
 * Above this many segment inputs, a single xfade command (one -i per segment)
 * overflows the OS command-line limit, so the segments are collapsed in batches
 * of this size. Kept well under Windows' 32767-char cap even with long paths.
 */
export const MAX_XFADE_INPUTS = 60

export function buildAudioMixArgs(sfxStartMs: number[]): string[] {
  if (sfxStartMs.length === 0) return ['-c:a', 'aac']
  const delayed = sfxStartMs.map((startMs, idx) => {
    const inputIndex = idx + 2
    const delayMs = Math.max(0, Math.round(startMs))
    return `[${inputIndex}:a]adelay=${delayMs}:all=1[sfx${idx}]`
  })
  const inputs = ['[1:a]', ...sfxStartMs.map((_, idx) => `[sfx${idx}]`)].join('')
  return [
    '-filter_complex',
    `${delayed.join(';')};${inputs}amix=inputs=${sfxStartMs.length + 1}:duration=first:dropout_transition=0:normalize=0[aout]`,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:a', 'aac',
  ]
}

/**
 * Build the video half of an xfade chain: per-input timebase normalization, then
 * a left-folding chain of xfade (transition) / concat (hard cut) filters. Shared
 * by the final render and the batched-chunk render so their offset math can never
 * drift apart. `plan[i].durationSec` is the transition AFTER input i; the last
 * input's transition is never consumed here (there is no input after it).
 */
function buildXfadeVideoChain(
  count: number,
  plan: XfadeTimelineItem[],
): { parts: string[]; finalLabel: string; composedDurationSec: number } {
  const parts: string[] = []
  for (let index = 0; index < count; index += 1) {
    parts.push(`[${index}:v]settb=AVTB,setpts=PTS-STARTPTS[v${index}]`)
  }
  let currentLabel = 'v0'
  let composedDurationSec = plan[0]?.inputDurationSec ?? 0
  for (let index = 1; index < count; index += 1) {
    const cut = plan[index - 1]
    const outputLabel = `vx${index}`
    if (cut?.durationSec > 0) {
      const offset = Math.max(0, composedDurationSec - cut.durationSec)
      parts.push(
        `[${currentLabel}][v${index}]xfade=transition=${cut.ffmpegName}:duration=${cut.durationSec.toFixed(6)}:offset=${offset.toFixed(6)}[${outputLabel}]`,
      )
      composedDurationSec += (plan[index]?.inputDurationSec ?? 0) - cut.durationSec
    } else {
      parts.push(`[${currentLabel}][v${index}]concat=n=2:v=1:a=0[${outputLabel}]`)
      composedDurationSec += plan[index]?.inputDurationSec ?? 0
    }
    currentLabel = outputLabel
  }
  return { parts, finalLabel: currentLabel, composedDurationSec }
}

/**
 * Render one batch of segments into a single intermediate video file via xfade,
 * with no audio. Only transitions *inside* the batch are applied; the batch's
 * outgoing (boundary) transition is deferred to the next collapse level. Returns
 * the intermediate's exact composed duration so the next level offsets correctly.
 */
function buildChunkXfadeArgs(input: {
  files: string[]
  plan: XfadeTimelineItem[]
  codec: RenderCodec
  crf: number
  outputPath: string
  tempDir: string
  chunkId: string
}): { args: string[]; composedDurationSec: number } {
  const { files, plan, codec, crf, outputPath, tempDir, chunkId } = input
  const args: string[] = ['-y']
  for (const file of files) args.push('-i', file)
  const { parts, finalLabel, composedDurationSec } = buildXfadeVideoChain(files.length, plan)
  parts.push(`[${finalLabel}]format=yuv420p[vout]`)
  const filterScriptPath = path.join(tempDir, `xfade-chunk-${chunkId}.txt`)
  fs.writeFileSync(filterScriptPath, parts.join(';'), 'utf-8')
  args.push(
    '-filter_complex_script', filterScriptPath,
    '-map', '[vout]',
    '-an',
    '-c:v', codec,
    ...crfArgs(codec, crf),
    outputPath,
  )
  return { args, composedDurationSec }
}

/**
 * Collapse a long list of xfade segments into at most MAX_XFADE_INPUTS files by
 * folding them in batches, level by level, until few enough remain for a single
 * final xfade command. Each level runs bounded ffmpeg commands, so this scales to
 * thousands of segments. The returned plan carries each intermediate's real
 * duration and its boundary transition, so the final render stays offset-accurate.
 *
 * Only used when segments carry no audio (videoAudioVolume <= 0); mixing per-clip
 * audio through multiple xfade levels is not attempted here.
 */
export async function collapseXfadeSegments(input: {
  segmentFiles: string[]
  transitionPlan: XfadeTimelineItem[]
  codec: RenderCodec
  crf: number
  tempDir: string
  jobIdBase: string
  runChunk: (args: string[], jobId: string) => Promise<{ success: boolean; error?: string; canceled?: boolean }>
  onLevel?: (level: number, chunkTotal: number) => void
}): Promise<{ success: boolean; files: string[]; plan: XfadeTimelineItem[]; error?: string; canceled?: boolean }> {
  const { segmentFiles, transitionPlan, codec, crf, tempDir, jobIdBase, runChunk, onLevel } = input
  let files = segmentFiles
  let plan = transitionPlan
  let level = 0
  while (files.length > MAX_XFADE_INPUTS) {
    const chunkTotal = Math.ceil(files.length / MAX_XFADE_INPUTS)
    onLevel?.(level, chunkTotal)
    const nextFiles: string[] = []
    const nextPlan: XfadeTimelineItem[] = []
    for (let c = 0; c < chunkTotal; c += 1) {
      const start = c * MAX_XFADE_INPUTS
      const end = Math.min(start + MAX_XFADE_INPUTS, files.length)
      const chunkFiles = files.slice(start, end)
      const chunkPlan = plan.slice(start, end)
      // The transition after this chunk's last segment is the boundary to the next
      // chunk — carried up, not applied inside the chunk.
      const boundaryItem = plan[end - 1]
      if (chunkFiles.length === 1) {
        nextFiles.push(chunkFiles[0])
        nextPlan.push(boundaryItem)
        continue
      }
      const chunkOut = path.join(tempDir, `xfade_l${level}_c${c.toString().padStart(4, '0')}.mp4`)
      const { args, composedDurationSec } = buildChunkXfadeArgs({
        files: chunkFiles, plan: chunkPlan, codec, crf, outputPath: chunkOut, tempDir,
        chunkId: `l${level}_c${c}`,
      })
      const res = await runChunk(args, `${jobIdBase}-xl${level}-c${c}`)
      if (res.canceled) return { success: false, files, plan, canceled: true }
      if (!res.success) return { success: false, files, plan, error: `batch l${level} c${c}: ${res.error || 'unknown'}` }
      nextFiles.push(chunkOut)
      nextPlan.push({ ...boundaryItem, inputDurationSec: composedDurationSec })
    }
    files = nextFiles
    plan = nextPlan
    level += 1
  }
  return { success: true, files, plan }
}

export function buildFinalXfadeArgs(input: FinalXfadeInputs): string[] {
  const {
    segmentFiles, transitionPlan, audioPath, audioStartSec, sfxInputs, bgmPath, bgmVolume,
    duckBgm, assSubtitlePath, totalDurationSec, codec, crf, outputPath, audioNormalize,
    videoAudioVolume, tempDir, segmentHasAudio,
  } = input
  const args: string[] = ['-y']
  for (const file of segmentFiles) args.push('-i', file)
  const audioInputIndex = segmentFiles.length
  if (audioStartSec > 0) args.push('-ss', audioStartSec.toFixed(3))
  args.push('-t', totalDurationSec.toFixed(3), '-i', audioPath)
  const sfxStartIdx = audioInputIndex + 1
  for (const item of sfxInputs) args.push('-i', item.path)
  const hasBgm = !!bgmPath
  const bgmInputIndex = sfxStartIdx + sfxInputs.length
  if (hasBgm) args.push('-stream_loop', '-1', '-i', bgmPath)

  const { parts: videoChainParts, finalLabel } = buildXfadeVideoChain(segmentFiles.length, transitionPlan)
  const parts: string[] = [...videoChainParts]
  if (assSubtitlePath) {
    parts.push(`[${finalLabel}]${buildSubtitleFilter(assSubtitlePath)},format=yuv420p[vout]`)
  } else {
    parts.push(`[${finalLabel}]format=yuv420p[vout]`)
  }

  if (sfxInputs.length > 0) {
    const delayed = sfxInputs.map((item, idx) => `[${sfxStartIdx + idx}:a]adelay=${Math.max(0, Math.round(item.startMs))}:all=1[sfx${idx}]`)
    const amixInputs = [`[${audioInputIndex}:a]`, ...sfxInputs.map((_, idx) => `[sfx${idx}]`)].join('')
    parts.push(`${delayed.join(';')};${amixInputs}amix=inputs=${sfxInputs.length + 1}:duration=first:dropout_transition=0:normalize=0[voiceMix]`)
  } else {
    parts.push(`[${audioInputIndex}:a]anull[voiceMix]`)
  }

  if (hasBgm) {
    parts.push(`[${bgmInputIndex}:a]volume=${bgmVolume.toFixed(3)}[bgm0]`)
    if (duckBgm) {
      parts.push('[bgm0][voiceMix]sidechaincompress=threshold=0.05:ratio=8:attack=50:release=500[bgmDucked]')
      parts.push('[voiceMix][bgmDucked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMaster]')
    } else {
      parts.push('[voiceMix][bgm0]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMaster]')
    }
  } else {
    parts.push('[voiceMix]anull[preMaster]')
  }

  // Mix in original video audio at reduced volume when videoAudioVolume > 0.
  // Only segments that actually carry an audio stream can be referenced as
  // [idx:a]; image / silent segments would make the concat filter abort with
  // "matches no streams: Invalid argument". For those, synthesize silence of the
  // segment's own duration so the concatenated video-audio track stays aligned.
  // Every branch is normalized to the same rate/format/layout so concat accepts them.
  const anySegmentAudio = segmentHasAudio.some(Boolean)
  if (videoAudioVolume > 0 && anySegmentAudio) {
    const AUDIO_FMT = 'aformat=sample_fmts=fltp:channel_layouts=stereo:sample_rates=48000'
    const segAudioParts = segmentFiles.map((_, idx) => {
      if (segmentHasAudio[idx]) {
        return `[${idx}:a]${AUDIO_FMT},volume=${videoAudioVolume.toFixed(3)}[va${idx}]`
      }
      const durSec = (transitionPlan[idx]?.inputDurationSec ?? 0).toFixed(6)
      return `anullsrc=r=48000:cl=stereo,atrim=duration=${durSec},${AUDIO_FMT}[va${idx}]`
    })
    const segAudioLabels = segmentFiles.map((_, idx) => `[va${idx}]`).join('')
    parts.push(...segAudioParts)
    parts.push(`${segAudioLabels}concat=n=${segmentFiles.length}:v=0:a=1[vidAudio]`)
    parts.push('[preMaster][vidAudio]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preNorm]')
  } else {
    parts.push('[preMaster]anull[preNorm]')
  }

  // Optional loudnorm for YouTube -14 LUFS
  if (audioNormalize) {
    parts.push('[preNorm]loudnorm=I=-14:TP=-1:LRA=11[aout]')
  } else {
    parts.push('[preNorm]anull[aout]')
  }

  // Write the filtergraph to a file and pass it via -filter_complex_script instead
  // of -filter_complex. With one -i per segment plus a filtergraph that grows with
  // the segment count, the inline command line overflows the OS limit (Windows caps
  // it at 32767 chars) and spawn throws ENAMETOOLONG. A script file keeps the graph
  // off the command line and produces a byte-identical result.
  const filterScriptPath = path.join(tempDir, 'xfade-filter.txt')
  fs.writeFileSync(filterScriptPath, parts.join(';'), 'utf-8')

  args.push(
    '-filter_complex_script', filterScriptPath,
    '-map', '[vout]',
    '-map', '[aout]',
    '-c:v', codec,
    ...crfArgs(codec, crf),
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', totalDurationSec.toFixed(3),
    '-shortest',
    outputPath,
  )
  return args
}

export function buildFinalConcatArgs(input: FinalConcatInputs): string[] {
  const {
    concatList, audioPath, audioStartSec, sfxInputs, bgmPath, bgmVolume, duckBgm,
    assSubtitlePath, totalDurationSec, codec, crf, outputPath, audioNormalize,
    videoAudioVolume, masterFromSegments, anySegmentHasAudio,
  } = input

  // Long-form final: the pre-rendered chapter clips already carry the finished audio
  // (narration + video), correctly timed. Use their own audio and never re-lay the
  // narration track. With nothing else to mix, this is a pure stream copy.
  if (masterFromSegments && !assSubtitlePath && !bgmPath && !audioNormalize) {
    return [
      '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
      '-map', '0:v', '-map', '0:a',
      '-c', 'copy',
      '-t', totalDurationSec.toFixed(3),
      '-shortest', outputPath,
    ]
  }
  // Voice master comes from the clips' own audio ([0:a]) when master-from-segments,
  // otherwise from the separate narration input ([1:a]).
  const voiceInput = masterFromSegments ? '0:a' : '1:a'

  const base = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatList,
  ]
  if (audioStartSec > 0) base.push('-ss', audioStartSec.toFixed(3))
  base.push('-t', totalDurationSec.toFixed(3), '-i', audioPath)
  const sfxStartIdx = 2
  for (const item of sfxInputs) base.push('-i', item.path)

  const hasBgm = !!bgmPath
  const bgmInputIndex = sfxStartIdx + sfxInputs.length
  if (hasBgm) base.push('-stream_loop', '-1', '-i', bgmPath)

  // Fast path: no subtitles, no BGM, no normalization, no video audio — keep the cheap copy concat.
  if (!assSubtitlePath && !hasBgm && !audioNormalize && videoAudioVolume <= 0) {
    return [
      ...base,
      ...buildAudioMixArgs(sfxInputs.map((item) => item.startMs)),
      '-c:v', 'copy',
      '-b:a', '192k',
      '-shortest',
      outputPath,
    ]
  }

  const parts: string[] = []
  if (assSubtitlePath) {
    parts.push(`[0:v]${buildSubtitleFilter(assSubtitlePath)}[vout]`)
  }

  // ---- Audio chain ----
  if (sfxInputs.length > 0) {
    const delayed = sfxInputs.map((item, idx) => `[${sfxStartIdx + idx}:a]adelay=${Math.max(0, Math.round(item.startMs))}:all=1[sfx${idx}]`)
    const amixInputs = [`[${voiceInput}]`, ...sfxInputs.map((_, idx) => `[sfx${idx}]`)].join('')
    parts.push(`${delayed.join(';')};${amixInputs}amix=inputs=${sfxInputs.length + 1}:duration=first:dropout_transition=0:normalize=0[voiceMix]`)
  } else {
    parts.push(`[${voiceInput}]anull[voiceMix]`)
  }

  if (hasBgm) {
    parts.push(`[${bgmInputIndex}:a]volume=${bgmVolume.toFixed(3)}[bgm0]`)
    if (duckBgm) {
      parts.push('[bgm0][voiceMix]sidechaincompress=threshold=0.05:ratio=8:attack=50:release=500[bgmDucked]')
      parts.push('[voiceMix][bgmDucked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMasterC]')
    } else {
      parts.push('[voiceMix][bgm0]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMasterC]')
    }
  } else {
    parts.push('[voiceMix]anull[preMasterC]')
  }

  // Mix in original video audio at reduced volume (concat mode: audio from concat input [0:a]).
  // Skipped when master-from-segments, because [0:a] is already the master voice above.
  // Also skipped when no segment has an audio stream — [0:a] would not exist and the
  // filtergraph would abort with "matches no streams".
  if (videoAudioVolume > 0 && !masterFromSegments && anySegmentHasAudio) {
    parts.push(`[0:a]volume=${videoAudioVolume.toFixed(3)}[vidAudioC]`)
    parts.push('[preMasterC][vidAudioC]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preNormC]')
  } else {
    parts.push('[preMasterC]anull[preNormC]')
  }

  // Optional loudnorm for YouTube -14 LUFS
  if (audioNormalize) {
    parts.push('[preNormC]loudnorm=I=-14:TP=-1:LRA=11[aout]')
  } else {
    parts.push('[preNormC]anull[aout]')
  }

  const args: string[] = [...base, '-filter_complex', parts.join(';')]
  if (assSubtitlePath) {
    args.push('-map', '[vout]', '-map', '[aout]')
    args.push('-c:v', codec, ...crfArgs(codec, crf))
  } else {
    args.push('-map', '0:v', '-map', '[aout]')
    args.push('-c:v', 'copy')
  }
  args.push('-c:a', 'aac', '-b:a', '192k')
  // A looped BGM input never ends on its own; cap the output explicitly.
  if (hasBgm) args.push('-t', totalDurationSec.toFixed(3))
  args.push('-shortest', outputPath)
  return args
}
