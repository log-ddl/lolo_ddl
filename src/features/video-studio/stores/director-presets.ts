/**
 * Director presets.
 *
 * Shared constants and derived types extracted from director-store.ts.
 */

// ==================== Sound Effect Presets ====================

export const SOUND_EFFECT_PRESETS = {
  // Nature
  nature: [
    { id: 'wind', label: 'Wind', promptToken: 'wind blowing sound' },
    { id: 'rain', label: 'Rain', promptToken: 'rain falling sound' },
    { id: 'thunder', label: 'Thunder', promptToken: 'thunder rumbling' },
    { id: 'birds', label: 'Birds', promptToken: 'birds chirping' },
    { id: 'water', label: 'Water Flow', promptToken: 'water flowing sound' },
    { id: 'waves', label: 'Ocean Waves', promptToken: 'ocean waves crashing' },
  ],
  // Action
  action: [
    { id: 'footsteps', label: 'Footsteps', promptToken: 'footsteps sound' },
    { id: 'breathing', label: 'Breathing', promptToken: 'heavy breathing' },
    { id: 'heartbeat', label: 'Heartbeat', promptToken: 'heartbeat pounding' },
    { id: 'fighting', label: 'Fighting', promptToken: 'fighting impact sounds' },
    { id: 'running', label: 'Running', promptToken: 'running footsteps' },
  ],
  // Atmosphere
  atmosphere: [
    { id: 'suspense', label: 'Suspense', promptToken: 'suspenseful ambient sound' },
    { id: 'dramatic', label: 'Dramatic', promptToken: 'dramatic sound effect' },
    { id: 'peaceful', label: 'Peaceful', promptToken: 'peaceful ambient sound' },
    { id: 'tense', label: 'Tense', promptToken: 'tense atmosphere sound' },
    { id: 'epic', label: 'Epic', promptToken: 'epic cinematic sound' },
  ],
  // Urban
  urban: [
    { id: 'traffic', label: 'Traffic', promptToken: 'traffic noise' },
    { id: 'crowd', label: 'Crowd', promptToken: 'crowd murmuring' },
    { id: 'siren', label: 'Siren', promptToken: 'siren wailing' },
    { id: 'horn', label: 'Horn', promptToken: 'car horn honking' },
  ],
} as const;

export type SoundEffectTag =
  | typeof SOUND_EFFECT_PRESETS.nature[number]['id']
  | typeof SOUND_EFFECT_PRESETS.action[number]['id']
  | typeof SOUND_EFFECT_PRESETS.atmosphere[number]['id']
  | typeof SOUND_EFFECT_PRESETS.urban[number]['id'];

// ==================== Emotion Tag Presets ====================

export const EMOTION_PRESETS = {
  // Basic emotions
  basic: [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'angry', label: 'Angry', emoji: '😠' },
    { id: 'surprised', label: 'Surprised', emoji: '😲' },
    { id: 'fearful', label: 'Fearful', emoji: '😨' },
    { id: 'calm', label: 'Calm', emoji: '😐' },
  ],
  // Atmosphere emotions
  atmosphere: [
    { id: 'tense', label: 'Tense', emoji: '😰' },
    { id: 'excited', label: 'Excited', emoji: '🤩' },
    { id: 'mysterious', label: 'Mysterious', emoji: '🤔' },
    { id: 'romantic', label: 'Romantic', emoji: '🥰' },
    { id: 'funny', label: 'Funny', emoji: '😂' },
    { id: 'touching', label: 'Touching', emoji: '🥹' },
  ],
  // Tone emotions
  tone: [
    { id: 'serious', label: 'Serious', emoji: '😑' },
    { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
    { id: 'playful', label: 'Playful', emoji: '😜' },
    { id: 'gentle', label: 'Gentle', emoji: '😇' },
    { id: 'passionate', label: 'Passionate', emoji: '🔥' },
    { id: 'low', label: 'Low', emoji: '😔' },
  ],
} as const;

export type EmotionTag = typeof EMOTION_PRESETS.basic[number]['id']
  | typeof EMOTION_PRESETS.atmosphere[number]['id']
  | typeof EMOTION_PRESETS.tone[number]['id'];
