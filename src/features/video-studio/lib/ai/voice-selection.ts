import type { Character } from '@/features/video-studio/stores/character-library-store';
import type { SplitScene } from '@/features/video-studio/stores/director-store';

export type ProjectVoiceMode = 'off' | 'selective' | 'ref' | 'full';

export type StoryboardVoiceConfig = {
  voiceMode?: ProjectVoiceMode;
  narratorVoice?: string;
};

export function resolveSceneAudioVoice(
  scene: Pick<SplitScene, 'dialogue' | 'voiceOver' | 'characterIds'>,
  characters: Character[],
  config?: StoryboardVoiceConfig,
): string | undefined {
  const voiceMode = config?.voiceMode || 'off';
  const narratorVoice = config?.narratorVoice?.trim();
  const spokenText = scene.dialogue?.trim() || scene.voiceOver?.trim() || '';

  if (voiceMode === 'full') {
    return narratorVoice || undefined;
  }

  // 'ref': resolve voice directly from character, no dialogue check needed
  // 'selective': only resolve if scene has dialogue
  if (voiceMode !== 'ref' && voiceMode !== 'selective') {
    return undefined;
  }
  if (voiceMode === 'selective' && !spokenText) {
    return undefined;
  }

  const sceneCharacters = (scene.characterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  // If dialogue exists, try to match the speaker first: "SpeakerName: line..."
  if (spokenText) {
    const speakerMatch = spokenText.match(/^([^:(]+)(?:\s*\([^)]*\))?\s*:/);
    if (speakerMatch) {
      const speakerName = speakerMatch[1].trim().toLowerCase();
      const speakerVoice = sceneCharacters.find(
        (c) => c.name.trim().toLowerCase() === speakerName && c.voiceId?.trim()
      )?.voiceId?.trim();
      if (speakerVoice) return speakerVoice;
    }
  }

  // Fallback: first character with a voiceId
  return sceneCharacters.find((c) => c.voiceId?.trim())?.voiceId?.trim() ?? undefined;
}

/**
 * Returns all voices for all characters in the scene (for display purposes).
 * Ordered: resolved (active) voice first, rest after.
 */
export function resolveAllSceneVoices(
  scene: Pick<SplitScene, 'dialogue' | 'voiceOver' | 'characterIds'>,
  characters: Character[],
  config?: StoryboardVoiceConfig,
): Array<{ voiceId: string; active: boolean }> {
  const voiceMode = config?.voiceMode || 'off';
  if (voiceMode === 'off') return [];
  if (voiceMode === 'full') {
    const v = config?.narratorVoice?.trim();
    return v ? [{ voiceId: v, active: true }] : [];
  }

  const activeVoice = resolveSceneAudioVoice(scene, characters, config);
  const sceneCharacters = (scene.characterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const seen = new Set<string>();
  const result: Array<{ voiceId: string; active: boolean }> = [];

  // Active voice first
  if (activeVoice) {
    seen.add(activeVoice);
    result.push({ voiceId: activeVoice, active: true });
  }

  // Remaining voices
  for (const char of sceneCharacters) {
    const v = char.voiceId?.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      result.push({ voiceId: v, active: false });
    }
  }

  return result;
}
