import fs from 'node:fs'
import { crfArgs } from './codec-args'
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

/** Ken Burns style motion as a zoompan filter fragment, or '' for no motion. */
export function buildMotionFilter(effect: RenderMediaEffect, width: number, height: number, fps: RenderFps, durationFrames: number, effectStartMs = 0, effectEndMs = Number.POSITIVE_INFINITY): string {
  if (effect === 'none') return ''

  const last = Math.max(1, durationFrames - 1)
  const startFrame = Math.max(0, Math.min(last, Math.round((effectStartMs / 1000) * fps)))
  const endFrame = Math.max(startFrame + 1, Math.min(last, Math.round((effectEndMs / 1000) * fps)))
  const progress = durationFrames > 1 ? `max(0,min(1,(on-${startFrame})/${Math.max(1, endFrame - startFrame)}))` : '0'
  const centerX = 'iw/2-(iw/zoom/2)'
  const centerY = 'ih/2-(ih/zoom/2)'
  const rightX = 'iw-iw/zoom'
  const bottomY = 'ih-ih/zoom'

  let z = '1.08'
  let x = centerX
  let y = centerY

  switch (effect) {
    case 'zoom_in':
      z = `1+0.12*${progress}`
      break
    case 'zoom_out':
      z = `1.12-0.12*${progress}`
      break
    case 'pan_left':
      z = '1.12'
      x = `(${rightX})*(1-${progress})`
      break
    case 'pan_right':
      z = '1.12'
      x = `(${rightX})*${progress}`
      break
    case 'pan_up':
      z = '1.12'
      y = `(${bottomY})*(1-${progress})`
      break
    case 'pan_down':
      z = '1.12'
      y = `(${bottomY})*${progress}`
      break
    case 'zoom_pan_left':
      // Start zoom raised from 1.04 so the pan never moves sub-pixel per frame
      // (which caused visible jitter at the start of the effect).
      z = `1.08+0.06*${progress}`
      x = `(${rightX})*(1-${progress})`
      break
    case 'zoom_pan_right':
      z = `1.08+0.06*${progress}`
      x = `(${rightX})*${progress}`
      break
  }

  return `,zoompan=z='${z}':d=1:x='${x}':y='${y}':s=${width}x${height}:fps=${fps}`
}

export function buildSegmentArgs(input: SegmentArgsInput): string[] {
  const { mediaType, imagePath, videoPath, sourceStartSec, overlayImagePath, overlayPlacement, sourceDurationSec, durationSec, durationFrames, width, height, fps, codec, crf, mediaEffect, effectStartMs, effectEndMs, outputPath, keepVideoAudio } = input
  const baseScale = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`
  const zoom = buildMotionFilter(mediaEffect, width, height, fps, durationFrames, effectStartMs, effectEndMs)
  // setsar=1 normalizes every segment to square pixels (SAR 1:1) so the final
  // concat/xfade filter sees identical stream params. Without it, a video clip
  // with an anamorphic SAR (e.g. 2881:2880) mixed with image-fallback segments
  // (SAR 1:1) makes ffmpeg's concat fail: "Failed to configure output pad".
  const vf = `${baseScale}${zoom},fps=${fps},format=yuv420p,setsar=1`
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
