export interface SrtSegment {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface CsvRow {
  index: number;
  text: string;
  imagePath: string;
  videoPath: string;
  voice: string;
}

export interface MappedSegment {
  // 1-based ordinal position in the rendered video.
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  // Image to show during this segment. Empty string = render black.
  imagePath: string;
  // Video to show during this segment in video mode. Empty string = fallback to imagePath.
  videoPath: string;
  // Match score 0..1 between SRT text and CSV text. 1 = exact, 0 = no match.
  // null when there is no CSV at all.
  confidence: number | null;
  mediaEffect?: AutoVideoMediaEffect;
  transitionToNext?: AutoVideoTransition;
  sfxPath?: string;
}

export type AutoVideoMediaMode = 'image' | 'video';
export const AUTO_VIDEO_MEDIA_EFFECTS = [
  'none',
  'zoom_in',
  'zoom_out',
  'pan_left',
  'pan_right',
  'pan_up',
  'pan_down',
  'zoom_pan_left',
  'zoom_pan_right',
] as const;

export const AUTO_VIDEO_TRANSITIONS = [
  'none',
  'fade',
  'fade_slow',
  'dip_white',
  'flash_white',
  'dissolve',
  'fade_black',
  'fade_white',
  'wipe_left',
  'wipe_right',
  'wipe_up',
  'wipe_down',
  'slide_left',
  'slide_right',
  'smooth_left',
  'smooth_right',
  'circle_open',
  'circle_close',
  'pixelize',
  'zoom_in',
] as const;

export type AutoVideoMediaEffect = typeof AUTO_VIDEO_MEDIA_EFFECTS[number];
export type AutoVideoTransition = typeof AUTO_VIDEO_TRANSITIONS[number];

export type RenderResolution = '1280x720' | '1920x1080' | '3840x2160';
export type RenderFps = 24 | 30 | 60;
export type RenderCodec = 'libx264' | 'libx265' | 'h264_nvenc';

export interface RenderSettings {
  resolution: RenderResolution;
  fps: RenderFps;
  codec: RenderCodec;
  crf: number;
  /** Burn segment text as subtitles onto the video. */
  burnSubtitles: boolean;
  /** Subtitle font size in ASS units (0 = auto from resolution). */
  subtitleFontSize: number;
  /** Background music file path. Empty string = no BGM. */
  bgmPath: string;
  /** BGM volume 0..1. */
  bgmVolume: number;
  /** Duck BGM while the voice track plays. */
  bgmDuckVoice: boolean;
  /** Normalize final audio to -14 LUFS (YouTube standard). */
  audioNormalize: boolean;
  /** Keep original video audio at this volume 0..1. 0 = mute. */
  videoAudioVolume: number;
}

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  resolution: '1920x1080',
  fps: 30,
  codec: 'libx264',
  crf: 23,
  burnSubtitles: false,
  subtitleFontSize: 0,
  bgmPath: '',
  bgmVolume: 0.25,
  bgmDuckVoice: true,
  audioNormalize: false,
  videoAudioVolume: 0,
};
