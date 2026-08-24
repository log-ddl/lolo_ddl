import fs from 'node:fs'
import { crfArgs } from './codec-args'
import { buildMotionPlan } from './motion'
import type { RenderCodec, RenderFps, RenderMediaEffect, RenderOverlayPlacement } from './types'

/**
 * ffmpeg arguments for rendering ONE segment to its own intermediate mp4.
 * Every segment is normalized to the same resolution, fps, pixel format and
 * SAR so the final concat/xfade sees identical stream parameters.
 */

export interface SegmentArgsInput {
  mediaType: 'image' | 'video'
  imagePath: string
  videoPath: string
  sourceStartSec: number
  overlayImagePath: string
  overlayPlacement: RenderOverlayPlacement
  sourceDurationSec?: number | null
  durationSec: number
  width: number
  height: number
  fps: RenderFps
  codec: RenderCodec
  crf: number
  mediaEffect: RenderMediaEffect
  effectStartMs: number
  effectEndMs: number
  durationFrames: number
  outputPath: string
  /** When > 0, preserve the original video audio track. */
  keepVideoAudio: boolean
}

export function buildSegmentArgs(input: SegmentArgsInput): string[] {
  const { mediaType, imagePath, videoPath, sourceStartSec, overlayImagePath, overlayPlacement, sourceDurationSec, durationSec, durationFrames, width, height, fps, codec, crf, mediaEffect, effectStartMs, effectEndMs, outputPath, keepVideoAudio } = input
  // A Ken Burns move crops on whole input pixels, so it is built from a
  // supersampled frame and scaled back down to the segment size by `zoompan`
  // itself. Without motion the frame is scaled straight to its final size.
  const motion = buildMotionPlan(mediaEffect, width, height, fps, durationFrames, effectStartMs, effectEndMs)
  const scaleW = width * motion.supersample
  const scaleH = height * motion.supersample
  const baseScale = `scale=${scaleW}:${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:color=black`
  // setsar=1 normalizes every segment to square pixels (SAR 1:1) so the final
  // concat/xfade filter sees identical stream params. Without it, a video clip
  // with an anamorphic SAR (e.g. 2881:2880) mixed with image-fallback segments
  // (SAR 1:1) makes ffmpeg's concat fail: "Failed to configure output pad".
  const vf = `${baseScale}${motion.filter},fps=${fps},format=yuv420p,setsar=1`
  const hasOverlay = !!overlayImagePath && fs.existsSync(overlayImagePath)
  const buildOverlayFilter = (basePrefix = '') => {
    const centered = overlayPlacement === 'center'
    const insertWidth = Math.max(240, Math.round(width * (centered ? 0.48 : 0.36)))
    const insertHeight = Math.max(160, Math.round(height * (centered ? 0.54 : 0.4)))
    const border = Math.max(6, Math.round(width * 0.004))
    const framedWidth = insertWidth + border * 2
    const framedHeight = insertHeight + border * 2
    const marginX = Math.round(width * 0.045)
    const marginY = Math.round(height * 0.06)
    const positions: Record<RenderOverlayPlacement, [string, string]> = {
      top_left: [String(marginX), String(marginY)],
      top_right: [`W-w-${marginX}`, String(marginY)],
      bottom_left: [String(marginX), `H-h-${marginY}`],
      bottom_right: [`W-w-${marginX}`, `H-h-${marginY}`],
      center: ['(W-w)/2', '(H-h)/2'],
    }
    const [x, y] = positions[overlayPlacement]
    const fadeOutStart = Math.max(0.25, durationSec - 0.3).toFixed(3)
    return [
      `[0:v]${basePrefix}${vf}[base]`,
      `[1:v]scale=${insertWidth}:${insertHeight}:force_original_aspect_ratio=increase,crop=${insertWidth}:${insertHeight},setsar=1,pad=${framedWidth}:${framedHeight}:${border}:${border}:color=white,format=rgba,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=${fadeOutStart}:d=0.25:alpha=1[insert]`,
      `[base][insert]overlay=x='${x}':y='${y}':format=auto,format=yuv420p[vout]`,
    ].join(';')
  }
  if (mediaType === 'video' && videoPath && fs.existsSync(videoPath)) {
    const shouldSlowVideo = !!sourceDurationSec && sourceDurationSec > 0 && sourceDurationSec < durationSec
    const videoPrefix = shouldSlowVideo
      ? `setpts=${(durationSec / sourceDurationSec).toFixed(6)}*PTS,trim=duration=${durationSec.toFixed(3)},${vf}`
      : vf
    if (hasOverlay) {
      const basePrefix = shouldSlowVideo
        ? `setpts=${(durationSec / sourceDurationSec!).toFixed(6)}*PTS,trim=duration=${durationSec.toFixed(3)},`
        : `trim=duration=${durationSec.toFixed(3)},setpts=PTS-STARTPTS,`
      return [
        '-y',
        ...(sourceStartSec > 0 ? ['-ss', sourceStartSec.toFixed(3)] : []), '-i', videoPath,
        '-loop', '1', '-framerate', String(fps), '-i', overlayImagePath,
        '-filter_complex', buildOverlayFilter(basePrefix),
        '-map', '[vout]',
        '-r', String(fps),
        '-frames:v', String(durationFrames),
        '-c:v', codec,
        ...crfArgs(codec, crf),
        '-pix_fmt', 'yuv420p',
        ...(keepVideoAudio ? [] : ['-an']),
        outputPath,
      ]
    }
    return [
      '-y',
      ...(sourceStartSec > 0 ? ['-ss', sourceStartSec.toFixed(3)] : []), '-i', videoPath,
      ...(shouldSlowVideo ? [] : ['-t', String(durationSec.toFixed(3))]),
      '-vf', videoPrefix,
      '-r', String(fps),
      '-frames:v', String(durationFrames),
      '-c:v', codec,
      ...crfArgs(codec, crf),
      '-pix_fmt', 'yuv420p',
      ...(keepVideoAudio ? [] : ['-an']),
      outputPath,
    ]
  }
  if (imagePath && fs.existsSync(imagePath)) {
    if (hasOverlay) {
      return [
        '-y',
        '-loop', '1', '-framerate', String(fps), '-i', imagePath,
        '-loop', '1', '-framerate', String(fps), '-i', overlayImagePath,
        '-filter_complex', buildOverlayFilter('setpts=PTS-STARTPTS,'),
        '-map', '[vout]',
        '-r', String(fps),
        '-frames:v', String(durationFrames),
        '-c:v', codec,
        ...crfArgs(codec, crf),
        '-pix_fmt', 'yuv420p',
        '-an',
        outputPath,
      ]
    }
    return [
      '-y',
      '-loop', '1',
      '-framerate', String(fps),
      '-i', imagePath,
      '-t', String(durationSec.toFixed(3)),
      '-vf', vf,
      '-r', String(fps),
      '-frames:v', String(durationFrames),
      '-c:v', codec,
      ...crfArgs(codec, crf),
      '-pix_fmt', 'yuv420p',
      '-an',
      outputPath,
    ]
  }
  // Black frame fallback
  return [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=black:s=${width}x${height}:r=${fps}:d=${durationSec.toFixed(3)}`,
    '-frames:v', String(durationFrames),
    '-c:v', codec,
    ...crfArgs(codec, crf),
    '-pix_fmt', 'yuv420p',
    '-an',
    outputPath,
  ]
}
