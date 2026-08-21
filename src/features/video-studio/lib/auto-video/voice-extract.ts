import { cleanVoiceOverText, splitVideoPromptVoiceOver } from '@/features/video-studio/lib/script/voice-over';

export function extractVoiceFromPrompt(prompt: string | undefined | null): string | null {
  const text = splitVideoPromptVoiceOver(prompt).voiceOver;
  return text.length > 0 ? text : null;
}

export interface ShotForVoiceExtract {
  index: number;
  voiceOver?: string;
  videoPrompt?: string;
  /** Pre-resolved absolute file path or empty string. Image linking happens in
   * the caller (Script tab handler) which has access to `getAbsoluteImagePath`. */
  imagePath?: string;
  videoPath?: string;
}

export interface VoiceExtractRow {
  index: number;
  text: string;
  imagePath: string;
  videoPath: string;
  voice: string;
}

export interface VoiceExtractResult {
  rows: VoiceExtractRow[];
  totalShots: number;
  matched: number;
  skipped: number;
}

/**
 * Convert a list of shots into Auto Video CSV rows from each shot's voiceOver.
 * The videoPrompt fallback only exists to migrate old projects that still have
 * `Voice Over:` embedded in the video prompt.
 */
export function shotsToVoiceRows(shots: ShotForVoiceExtract[]): VoiceExtractResult {
  const rows: VoiceExtractRow[] = [];
  let matched = 0;
  let skipped = 0;

  for (const shot of shots) {
    const voice = cleanVoiceOverText(shot.voiceOver) || extractVoiceFromPrompt(shot.videoPrompt);
    if (!voice) {
      skipped += 1;
      continue;
    }
    rows.push({
      index: shot.index,
      text: voice,
      imagePath: shot.imagePath ?? '',
      videoPath: shot.videoPath ?? '',
      voice,
    });
    matched += 1;
  }

  return {
    rows,
    totalShots: shots.length,
    matched,
    skipped,
  };
}
