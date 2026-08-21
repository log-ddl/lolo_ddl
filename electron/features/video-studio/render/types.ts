/** Shared shapes for the auto-video render pipeline. */

export type RenderMediaEffect =
  | 'none'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'zoom_pan_left'
  | 'zoom_pan_right'

export type RenderTransition =
  | 'none'
  | 'fade'
  | 'fade_slow'
  | 'dip_white'
  | 'flash_white'
  | 'dissolve'
  | 'fade_black'
  | 'fade_white'
  | 'wipe_left'
  | 'wipe_right'
  | 'wipe_up'
  | 'wipe_down'
  | 'slide_left'
  | 'slide_right'
  | 'smooth_left'
  | 'smooth_right'
  | 'circle_open'
  | 'circle_close'
  | 'pixelize'
  | 'zoom_in'

export type RenderOverlayPlacement = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center'

export interface RenderSegmentInput {
  index: number
  startMs: number
  endMs: number
  text: string
  imagePath: string // empty = render black
  videoPath?: string // used in video mode; empty = fallback to imagePath
  /** Trim offset into the source video when a layered clip is sliced. */
  sourceStartMs?: number
  mediaEffect?: RenderMediaEffect
  /** Motion-effect window relative to this segment. */
  effectStartMs?: number
  effectEndMs?: number
  transitionToNext?: RenderTransition
  transitionDurationMs?: number
  /** Optional researched still composited as a smaller editorial insert. */
  overlayImagePath?: string
  overlayPlacement?: RenderOverlayPlacement
  sfxPath?: string
}

export interface RenderCaptionInput {
  index: number
  startMs: number
  endMs: number
  text: string
}

export type AutoVideoMediaMode = 'image' | 'video'

export type RenderResolution = '1280x720' | '1920x1080' | '3840x2160'
export type RenderFps = 24 | 30 | 60
export type RenderCodec = 'libx264' | 'libx265' | 'h264_nvenc'

export interface RenderJobRequest {
  jobId: string
  audioPath: string
  /** Optional source-audio window used by checkpointed long-form chapter renders. */
  audioStartMs?: number
  audioEndMs?: number
  segments: RenderSegmentInput[]
  /** Caption timing is independent from visual cuts. Defaults to segments for compatibility. */
  captionSegments?: RenderCaptionInput[]
  mediaMode?: AutoVideoMediaMode
  resolution: RenderResolution
  fps: RenderFps
  codec: RenderCodec
  crf: number
  outputPath?: string // optional explicit output; otherwise saved next to audio
  /** Filesystem root for resolving local-image:// URLs. Provided by main. */
  mediaRoot: string
  /** Burn segment.text as subtitles onto the video (libass). Default false. */
  burnSubtitles?: boolean
  /** Subtitle font size in ASS PlayRes units. Defaults to ~5% of the video height. */
  subtitleFontSize?: number
  /** Background music file (mp3/wav/m4a/...). Optional. */
  bgmPath?: string
  /** BGM volume 0..1. Default 0.25. */
  bgmVolume?: number
  /** Duck BGM automatically while the voice track plays. Default true. */
  bgmDuckVoice?: boolean
  /** Normalize the final audio mix to -14 LUFS (YouTube standard). Default false. */
  audioNormalize?: boolean
  /** Keep original video audio at this volume 0..1. 0 = mute (default). */
  videoAudioVolume?: number
  /** Long-form final concat only: the segments are pre-rendered chapter clips that
   * already contain the finished audio (narration + video). Use their own audio as
   * master instead of re-laying `audioPath`, which would double the narration. */
  masterFromSegments?: boolean
}

export interface RenderProgressEvent {
  jobId: string
  type: 'stage' | 'segment-start' | 'segment-done' | 'concat-progress' | 'log'
  stage?: 'preparing' | 'building-segments' | 'concatenating' | 'done' | 'error'
  segmentIndex?: number
  segmentTotal?: number
  percent?: number
  message?: string
}

export interface RenderJobResponse {
  success: boolean
  outputPath?: string
  error?: string
  canceled?: boolean
}

export interface FrameTimelineItem {
  startFrame: number
  endFrame: number
  durationFrames: number
  durationSec: number
}

export interface XfadeTimelineItem {
  transition: RenderTransition
  ffmpegName: string
  durationFrames: number
  durationSec: number
  inputDurationSec: number
}

export type Emit = (event: RenderProgressEvent) => void
