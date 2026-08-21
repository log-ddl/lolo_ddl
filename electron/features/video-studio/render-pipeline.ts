import { app, dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { runFFmpeg, cancelFFmpeg, probeMediaDuration, probeHasAudioStream } from '../../ffmpeg-runtime'
import {
  cleanupTempDir,
  makeTempDir,
  resolveAudioPath,
  resolveImageSrc,
  resolveVideoSrc,
} from './render/media-resolver'
import { buildFrameTimeline, buildXfadeTimeline } from './render/timeline'
import { buildSegmentArgs } from './render/segment-args'
import { writeAssSubtitleFile } from './render/subtitles'
import {
  MAX_XFADE_INPUTS,
  buildFinalConcatArgs,
  buildFinalXfadeArgs,
  collapseXfadeSegments,
} from './render/final-args'
import type { Emit, RenderJobRequest, RenderJobResponse } from './render/types'

/**
 * Auto-video render orchestration: render each segment to its own clip, then
 * fold them into the final MP4 with the audio chain. The ffmpeg argument
 * building lives in ./render.
 */

export type {
  AutoVideoMediaMode,
  RenderCaptionInput,
  RenderCodec,
  RenderFps,
  RenderJobRequest,
  RenderJobResponse,
  RenderProgressEvent,
  RenderResolution,
  RenderSegmentInput,
} from './render/types'

interface JobState {
  canceled: boolean
  childJobIds: Set<string>
  tempDir: string | null
}

const activeJobs = new Map<string, JobState>()

export function cancelRender(jobId: string): boolean {
  const state = activeJobs.get(jobId)
  if (!state) return false
  state.canceled = true
  for (const cid of state.childJobIds) cancelFFmpeg(cid)
  return true
}

export function cancelAllRenders(): void {
  for (const [, state] of activeJobs) {
    state.canceled = true
    for (const cid of state.childJobIds) cancelFFmpeg(cid)
  }
  activeJobs.clear()
}

export async function pickOutputVideoPath(defaultName: string): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Save rendered video',
    defaultPath: path.join(app.getPath('videos'), defaultName),
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
}

export async function renderVideo(req: RenderJobRequest, emit: Emit): Promise<RenderJobResponse> {
  if (!fs.existsSync(req.audioPath)) {
    return { success: false, error: `Audio not found: ${req.audioPath}` }
  }
  if (req.segments.length === 0) {
    return { success: false, error: 'No segments to render' }
  }

  const state: JobState = { canceled: false, childJobIds: new Set(), tempDir: null }
  activeJobs.set(req.jobId, state)

  try {
    emit({ jobId: req.jobId, type: 'stage', stage: 'preparing', message: 'Preparing temp folder', percent: 0 })

    const outputPath = req.outputPath
      ?? path.join(path.dirname(req.audioPath), `${path.parse(req.audioPath).name}.auto.mp4`)
    const imageCandidateDirs = [
      path.dirname(req.audioPath),
      path.dirname(outputPath),
      process.cwd(),
      req.mediaRoot,
    ]
    const tempDir = makeTempDir(req.jobId)
    state.tempDir = tempDir

    emit({ jobId: req.jobId, type: 'log', message: `mediaRoot: ${req.mediaRoot}` })
    emit({ jobId: req.jobId, type: 'log', message: `tempDir: ${tempDir}` })
    emit({ jobId: req.jobId, type: 'log', message: `mediaMode: ${req.mediaMode ?? 'image'}` })
    emit({ jobId: req.jobId, type: 'log', message: `segments with image: ${req.segments.filter((s) => s.imagePath).length}/${req.segments.length}` })
    emit({ jobId: req.jobId, type: 'log', message: `segments with video: ${req.segments.filter((s) => s.videoPath).length}/${req.segments.length}` })

    // ---- Build segments ----
    emit({
      jobId: req.jobId,
      type: 'stage',
      stage: 'building-segments',
      message: `Building ${req.segments.length} segment(s)`,
      percent: 0,
      segmentTotal: req.segments.length,
    })

    const segmentFiles: string[] = []
    const segmentHasAudio: boolean[] = []
    const [width, height] = req.resolution.split('x').map((n) => parseInt(n, 10))
    const sourceAudioDurationSec = await probeMediaDuration(req.audioPath)
    const audioStartSec = Math.max(0, (req.audioStartMs ?? 0) / 1000)
    const requestedAudioEndSec = req.audioEndMs != null ? Math.max(audioStartSec, req.audioEndMs / 1000) : null
    const audioDurationSec = requestedAudioEndSec != null
      ? Math.max(0.1, requestedAudioEndSec - audioStartSec)
      : sourceAudioDurationSec != null
        ? Math.max(0.1, sourceAudioDurationSec - audioStartSec)
        : null
    const framePlan = buildFrameTimeline(req.segments, req.fps, audioDurationSec)
    const transitionPlan = buildXfadeTimeline(req.segments, framePlan, req.fps)
    const finalFrame = framePlan[framePlan.length - 1]?.endFrame ?? 0
    const totalDurationSec = Math.max(0.1, finalFrame / req.fps)
    const captionSegments = req.captionSegments ?? req.segments
    const assSubtitlePath = req.burnSubtitles
      ? writeAssSubtitleFile(captionSegments, width, height, req.subtitleFontSize, tempDir)
      : null
    const bgmResolvedPath = resolveAudioPath(req.bgmPath ?? '', imageCandidateDirs)
    const bgmVolume = Math.min(1, Math.max(0, req.bgmVolume ?? 0.25))
    const duckBgm = req.bgmDuckVoice !== false
    const audioNormalize = req.audioNormalize === true
    const videoAudioVolume = Math.min(1, Math.max(0, req.videoAudioVolume ?? 0))
    const masterFromSegments = req.masterFromSegments === true
    emit({
      jobId: req.jobId,
      type: 'log',
      message: `frame plan: fps=${req.fps}, audio=${audioDurationSec?.toFixed(3) ?? 'unknown'}s, finalFrame=${finalFrame}, duration=${(finalFrame / req.fps).toFixed(3)}s`,
    })
    emit({
      jobId: req.jobId,
      type: 'log',
      message: `xfade plan: ${transitionPlan.filter((item) => item.durationFrames > 0).map((item, index) => `${index + 1}:${item.ffmpegName}/${item.durationSec.toFixed(3)}s`).join(', ') || 'hard cuts only'}`,
    })
    emit({
      jobId: req.jobId,
      type: 'log',
      message: `subtitles: ${assSubtitlePath ? `burning (${captionSegments.filter((s) => s.text?.trim()).length} captions)` : 'off'}`,
    })
    emit({
      jobId: req.jobId,
      type: 'log',
      message: `bgm: ${bgmResolvedPath ? `${bgmResolvedPath} (volume=${bgmVolume}, duck=${duckBgm})` : 'off'}`,
    })
    emit({
      jobId: req.jobId,
      type: 'log',
      message: `audioNormalize: ${audioNormalize ? '-14 LUFS' : 'off'}, videoAudioVolume: ${videoAudioVolume}`,
    })

    for (let i = 0; i < req.segments.length; i += 1) {
      if (state.canceled) return { success: false, canceled: true, error: 'canceled' }
      const seg = req.segments[i]
      const plan = framePlan[i]
      // xfade overlaps adjacent inputs. Extend the outgoing clip by exactly
      // the overlap so the composed visual stream still ends with the audio.
      const durationFrames = plan.durationFrames + transitionPlan[i].durationFrames
      const durationSec = durationFrames / req.fps

      emit({
        jobId: req.jobId,
        type: 'segment-start',
        segmentIndex: i,
        segmentTotal: req.segments.length,
        percent: Math.round((i / req.segments.length) * 50),
      })

      const segOutPath = path.join(tempDir, `seg_${i.toString().padStart(4, '0')}.mp4`)
      const childJobId = `${req.jobId}-seg-${i}`
      state.childJobIds.add(childJobId)

      const useVideo = req.mediaMode === 'video' && !!seg.videoPath
      const resolvedVideoPath = useVideo
        ? await resolveVideoSrc(seg.videoPath || '', req.mediaRoot, imageCandidateDirs)
        : ''

      if (useVideo && !resolvedVideoPath) {
        return {
          success: false,
          error: [
            `Segment ${i + 1}: video not found/readable, render stopped.`,
            `videoPath: ${seg.videoPath}`,
            `mediaRoot: ${req.mediaRoot}`,
            `tried relative dirs: ${imageCandidateDirs.join(' | ')}`,
          ].join('\n'),
        }
      }

      // Resolve local-image:// to a real file path. Empty result triggers the
      // black-frame fallback inside buildSegmentArgs.
      const resolvedImagePath = await resolveImageSrc(seg.imagePath, req.mediaRoot, imageCandidateDirs, tempDir, i)
      if (seg.imagePath && !resolvedImagePath) {
        return {
          success: false,
          error: [
            `Segment ${i + 1}: image not found/readable, render stopped.`,
            `imagePath: ${seg.imagePath}`,
            `mediaRoot: ${req.mediaRoot}`,
            `tried relative dirs: ${imageCandidateDirs.join(' | ')}`,
          ].join('\n'),
        }
      }
      if (resolvedImagePath) {
        const stat = fs.statSync(resolvedImagePath)
        emit({
          jobId: req.jobId,
          type: 'log',
          message: `Segment ${i + 1}: using image ${resolvedImagePath} (${stat.size} bytes)`,
        })
      }
      const resolvedOverlayImagePath = seg.overlayImagePath
        ? await resolveImageSrc(seg.overlayImagePath, req.mediaRoot, imageCandidateDirs, tempDir, 10_000 + i)
        : ''
      if (seg.overlayImagePath && !resolvedOverlayImagePath) {
        emit({
          jobId: req.jobId,
          type: 'log',
          message: `Segment ${i + 1}: researched overlay unavailable, continuing without it`,
        })
      } else if (resolvedOverlayImagePath) {
        emit({
          jobId: req.jobId,
          type: 'log',
          message: `Segment ${i + 1}: overlay ${resolvedOverlayImagePath} at ${seg.overlayPlacement ?? 'top_right'}`,
        })
      }
      if (resolvedVideoPath) {
        const stat = fs.statSync(resolvedVideoPath)
        emit({
          jobId: req.jobId,
          type: 'log',
          message: `Segment ${i + 1}: using video ${resolvedVideoPath} (${stat.size} bytes)`,
        })
      }

      const keepVideoAudio = !!resolvedVideoPath && videoAudioVolume > 0
      const sourceDurationSec = resolvedVideoPath ? await probeMediaDuration(resolvedVideoPath) : null
      // The segment file will carry audio only when we keep it AND the source
      // actually has an audio stream. Probed only for video segments that keep
      // audio, so image-only timelines add no extra ffmpeg calls.
      const segHasAudio = keepVideoAudio ? await probeHasAudioStream(resolvedVideoPath) : false

      const args = buildSegmentArgs({
        mediaType: resolvedVideoPath ? 'video' : 'image',
        imagePath: resolvedImagePath,
        videoPath: resolvedVideoPath,
        sourceStartSec: Math.max(0, (seg.sourceStartMs ?? 0) / 1000),
        overlayImagePath: resolvedOverlayImagePath,
        overlayPlacement: seg.overlayPlacement ?? 'top_right',
        sourceDurationSec,
        durationSec,
        width,
        height,
        fps: req.fps,
        codec: req.codec,
        crf: req.crf,
        mediaEffect: seg.mediaEffect ?? 'none',
        effectStartMs: seg.effectStartMs ?? 0,
        effectEndMs: seg.effectEndMs ?? durationSec * 1000,
        durationFrames,
        outputPath: segOutPath,
        keepVideoAudio,
      })

      const result = await runFFmpeg({
        jobId: childJobId,
        args,
        totalDurationSec: durationSec,
      })

      state.childJobIds.delete(childJobId)

      if (state.canceled) return { success: false, canceled: true, error: 'canceled' }
      if (!result.success) {
        return {
          success: false,
          error: `Segment ${i + 1} failed: ${result.error || 'unknown'}\n${result.stderr.slice(-500)}`,
        }
      }
      segmentFiles.push(segOutPath)
      segmentHasAudio.push(segHasAudio)

      emit({
        jobId: req.jobId,
        type: 'segment-done',
        segmentIndex: i,
        segmentTotal: req.segments.length,
        percent: Math.round(((i + 1) / req.segments.length) * 50),
      })
    }

    // ---- Concat list ----
    const concatList = path.join(tempDir, 'concat.txt')
    const concatLines = segmentFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n')
    fs.writeFileSync(concatList, concatLines, 'utf-8')

    // ---- Final concat with audio ----
    emit({
      jobId: req.jobId,
      type: 'stage',
      stage: 'concatenating',
      message: 'Concatenating segments + audio',
      percent: 50,
    })

    const concatJobId = `${req.jobId}-concat`
    state.childJobIds.add(concatJobId)

    const sfxInputs = req.segments
      .map((seg) => ({ path: resolveAudioPath(seg.sfxPath ?? '', imageCandidateDirs), startMs: seg.startMs }))
      .filter((item) => item.path)
    for (const item of sfxInputs) {
      emit({ jobId: req.jobId, type: 'log', message: `SFX at ${(item.startMs / 1000).toFixed(3)}s: ${item.path}` })
    }

    const hasXfade = transitionPlan.some((item) => item.durationFrames > 0)
    const anySegmentHasAudio = segmentHasAudio.some(Boolean)

    // xfade opens one -i per segment; past MAX_XFADE_INPUTS the single command
    // overflows the OS command-line limit (spawn ENAMETOOLONG). Collapse the
    // segments in bounded batches first, then run the final xfade on the few
    // resulting clips. Batching drops per-segment audio, so it only runs when no
    // segment carries an audio stream (covers image timelines even when
    // videoAudioVolume > 0). With real clip audio to preserve, stay on the single
    // command (GP1 keeps its filtergraph off the command line).
    let finalSegmentFiles = segmentFiles
    let finalTransitionPlan = transitionPlan
    let finalSegmentHasAudio = segmentHasAudio
    if (hasXfade && !anySegmentHasAudio && segmentFiles.length > MAX_XFADE_INPUTS) {
      emit({
        jobId: req.jobId,
        type: 'log',
        message: `xfade batching: ${segmentFiles.length} segments > ${MAX_XFADE_INPUTS}, collapsing in batches`,
      })
      const collapse = await collapseXfadeSegments({
        segmentFiles,
        transitionPlan,
        codec: req.codec,
        crf: req.crf,
        tempDir,
        jobIdBase: req.jobId,
        onLevel: (level, chunkTotal) => emit({
          jobId: req.jobId,
          type: 'log',
          message: `xfade batching level ${level}: ${chunkTotal} batch(es)`,
        }),
        runChunk: async (args, jobId) => {
          if (state.canceled) return { success: false, canceled: true }
          state.childJobIds.add(jobId)
          const r = await runFFmpeg({ jobId, args })
          state.childJobIds.delete(jobId)
          if (state.canceled) return { success: false, canceled: true }
          if (!r.success) return { success: false, error: `${r.error || 'unknown'}\n${r.stderr.slice(-400)}` }
          return { success: true }
        },
      })
      if (collapse.canceled || state.canceled) return { success: false, canceled: true, error: 'canceled' }
      if (!collapse.success) return { success: false, error: `Xfade batching failed: ${collapse.error || 'unknown'}` }
      finalSegmentFiles = collapse.files
      finalTransitionPlan = collapse.plan
      // Collapsed chunk clips are rendered with -an, so none carry audio.
      finalSegmentHasAudio = finalSegmentFiles.map(() => false)
      emit({
        jobId: req.jobId,
        type: 'log',
        message: `xfade batching done: collapsed to ${finalSegmentFiles.length} clip(s) for final render`,
      })
    }

    const concatArgs = hasXfade
      ? buildFinalXfadeArgs({
          segmentFiles: finalSegmentFiles,
          transitionPlan: finalTransitionPlan,
          audioPath: req.audioPath,
          audioStartSec,
          sfxInputs,
          bgmPath: bgmResolvedPath,
          bgmVolume,
          duckBgm,
          assSubtitlePath,
          totalDurationSec,
          codec: req.codec,
          crf: req.crf,
          outputPath,
          audioNormalize,
          videoAudioVolume,
          segmentCount: finalSegmentFiles.length,
          tempDir,
          segmentHasAudio: finalSegmentHasAudio,
        })
      : buildFinalConcatArgs({
          concatList,
          audioPath: req.audioPath,
          audioStartSec,
          sfxInputs,
          bgmPath: bgmResolvedPath,
          bgmVolume,
          duckBgm,
          assSubtitlePath,
          totalDurationSec,
          codec: req.codec,
          crf: req.crf,
          outputPath,
          audioNormalize,
          videoAudioVolume,
          masterFromSegments,
          anySegmentHasAudio,
        })

    const concatResult = await runFFmpeg({
      jobId: concatJobId,
      args: concatArgs,
      totalDurationSec,
      onProgress: (p) => {
        // Concat phase reports 50..100% of overall.
        const overall = 50 + (p.percent / 2)
        emit({
          jobId: req.jobId,
          type: 'concat-progress',
          percent: overall,
        })
      },
    })

    state.childJobIds.delete(concatJobId)

    if (state.canceled) return { success: false, canceled: true, error: 'canceled' }
    if (!concatResult.success) {
      return {
        success: false,
        error: `Concat failed: ${concatResult.error || 'unknown'}\n${concatResult.stderr.slice(-500)}`,
      }
    }

    emit({ jobId: req.jobId, type: 'stage', stage: 'done', percent: 100, message: 'Render complete' })

    return { success: true, outputPath }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    if (state.tempDir) cleanupTempDir(state.tempDir)
    activeJobs.delete(req.jobId)
  }
}
