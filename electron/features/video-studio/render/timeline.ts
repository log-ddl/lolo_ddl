import type { FrameTimelineItem, RenderFps, RenderSegmentInput, RenderTransition, XfadeTimelineItem } from './types'

/**
 * Frame-exact planning. Everything downstream works in frames so segment
 * durations, transition offsets and the final output length can never drift
 * apart from rounding.
 */

export function buildFrameTimeline(segments: RenderSegmentInput[], fps: RenderFps, audioDurationSec: number | null): FrameTimelineItem[] {
  const frameFromMs = (ms: number) => Math.max(0, Math.round((ms / 1000) * fps))
  const startFrames = segments.map((segment) => frameFromMs(segment.startMs))
  if (startFrames.length === 0) return []

  startFrames[0] = 0
  for (let i = 1; i < startFrames.length; i += 1) {
    startFrames[i] = Math.max(startFrames[i], startFrames[i - 1] + 1)
  }

  const lastSegment = segments[segments.length - 1]
  const lastCaptionEndFrame = frameFromMs(Math.max(lastSegment.endMs, lastSegment.startMs))
  const audioEndFrame = audioDurationSec && Number.isFinite(audioDurationSec)
    ? Math.max(0, Math.round(audioDurationSec * fps))
    : 0
  const finalEndFrame = Math.max(lastCaptionEndFrame, audioEndFrame, startFrames[startFrames.length - 1] + 1)

  return segments.map((_segment, index) => {
    const startFrame = startFrames[index]
    const nextStartFrame = startFrames[index + 1] ?? startFrame + 1
    const endFrame = index < segments.length - 1
      ? Math.max(startFrame + 1, nextStartFrame)
      : Math.max(startFrame + 1, finalEndFrame)
    const durationFrames = Math.max(1, endFrame - startFrame)

    return {
      startFrame,
      endFrame,
      durationFrames,
      durationSec: durationFrames / fps,
    }
  })
}

export function getXfadeProfile(transition: RenderTransition): { ffmpegName: string; durationSec: number } {
  switch (transition) {
    case 'fade': return { ffmpegName: 'fade', durationSec: 0.35 }
    case 'fade_slow': return { ffmpegName: 'fadeslow', durationSec: 0.65 }
    case 'dip_white': return { ffmpegName: 'fadewhite', durationSec: 0.35 }
    case 'flash_white': return { ffmpegName: 'fadewhite', durationSec: 0.14 }
    case 'dissolve': return { ffmpegName: 'dissolve', durationSec: 0.45 }
    case 'fade_black': return { ffmpegName: 'fadeblack', durationSec: 0.45 }
    case 'fade_white': return { ffmpegName: 'fadewhite', durationSec: 0.4 }
    case 'wipe_left': return { ffmpegName: 'wipeleft', durationSec: 0.4 }
    case 'wipe_right': return { ffmpegName: 'wiperight', durationSec: 0.4 }
    case 'wipe_up': return { ffmpegName: 'wipeup', durationSec: 0.4 }
    case 'wipe_down': return { ffmpegName: 'wipedown', durationSec: 0.4 }
    case 'slide_left': return { ffmpegName: 'slideleft', durationSec: 0.45 }
    case 'slide_right': return { ffmpegName: 'slideright', durationSec: 0.45 }
    case 'smooth_left': return { ffmpegName: 'smoothleft', durationSec: 0.5 }
    case 'smooth_right': return { ffmpegName: 'smoothright', durationSec: 0.5 }
    case 'circle_open': return { ffmpegName: 'circleopen', durationSec: 0.45 }
    case 'circle_close': return { ffmpegName: 'circleclose', durationSec: 0.45 }
    case 'pixelize': return { ffmpegName: 'pixelize', durationSec: 0.35 }
    case 'zoom_in': return { ffmpegName: 'zoomin', durationSec: 0.45 }
    case 'none': return { ffmpegName: 'fade', durationSec: 0 }
  }
}

/**
 * Per-segment transition plan. Each entry describes the transition AFTER that
 * segment; a transition is capped at 45% of either neighbour so a short clip can
 * never be swallowed by its own crossfade.
 */
export function buildXfadeTimeline(
  segments: RenderSegmentInput[],
  frames: FrameTimelineItem[],
  fps: RenderFps,
): XfadeTimelineItem[] {
  return segments.map((segment, index) => {
    const transition = index < segments.length - 1 ? (segment.transitionToNext ?? 'none') : 'none'
    const profile = getXfadeProfile(transition)
    if (transition === 'none' || !frames[index] || !frames[index + 1]) {
      return {
        transition: 'none',
        ffmpegName: 'fade',
        durationFrames: 0,
        durationSec: 0,
        inputDurationSec: frames[index]?.durationSec ?? 0,
      }
    }
    const requestedDurationSec = segment.transitionDurationMs == null
      ? profile.durationSec
      : Math.max(0.1, Math.min(2, segment.transitionDurationMs / 1000))
    const requestedFrames = Math.max(1, Math.round(requestedDurationSec * fps))
    const maxFrames = Math.max(1, Math.min(
      Math.floor(frames[index].durationFrames * 0.45),
      Math.floor(frames[index + 1].durationFrames * 0.45),
    ))
    const durationFrames = Math.min(requestedFrames, maxFrames)
    const durationSec = durationFrames / fps
    return {
      transition,
      ffmpegName: profile.ffmpegName,
      durationFrames,
      durationSec,
      inputDurationSec: frames[index].durationSec + durationSec,
    }
  })
}
