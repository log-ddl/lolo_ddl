import voiceCatalog from '../data/voice_capcut.json';
import type { CapCutVoice } from '../types';

interface RawCapCutVoice {
  voice_type: string;
  display_name: string;
  resource_id: string;
  lang: string;
  lan: string;
}

const rawVoices = voiceCatalog as RawCapCutVoice[];
const seen = new Set<string>();

export const CAPCUT_VOICES: CapCutVoice[] = rawVoices
  .map((voice) => ({
    voiceType: voice.voice_type,
    displayName: voice.display_name,
    resourceId: voice.resource_id,
    language: voice.lang,
    languageCode: voice.lan,
    provider: voice.voice_type.includes('Neural') ? 'edge' as const : 'capcut' as const,
  }))
  .filter((voice) => {
    const key = `${voice.voiceType}:${voice.resourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

export const CAPCUT_API_VOICES = CAPCUT_VOICES.filter((voice) => voice.provider === 'capcut');
export const CAPCUT_LANGUAGES = Array.from(new Set(CAPCUT_API_VOICES.map((voice) => voice.language))).sort();

export function getCapCutVoice(voiceType: string) {
  return CAPCUT_API_VOICES.find((voice) => voice.voiceType === voiceType);
}
