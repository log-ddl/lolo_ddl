import { CAPCUT_API_VOICES } from "@/features/tts-voice/lib/capcut-voices";

/** Accepted media types, TTS engine choices and small formatters for the import stage. */

export const AUDIO_EXTS = ["mp3", "wav", "m4a", "flac", "ogg"];
export const VIDEO_EXTS = ["mp4", "mov", "mkv", "webm"];

export type TtsEngineId = "omnivoice" | "capcut" | "gemini";

export const TTS_ENGINE_OPTIONS: Array<{
  id: TtsEngineId;
  labelKey: string;
  model: {
    id: string;
    repository: string;
    capability: "omnivoice" | "capcut" | "gemini";
    mode: "auto" | "preset";
  };
}> = [
  {
    id: "omnivoice",
    labelKey: "autoVideo.ttsGen.omnivoice",
    model: { id: "omnivoice-main", repository: "k2-fsa/OmniVoice", capability: "omnivoice", mode: "auto" },
  },
  {
    id: "capcut",
    labelKey: "autoVideo.ttsGen.capcut",
    model: { id: "capcut-online", repository: "https://editor-api-sg.capcutapi.com", capability: "capcut", mode: "preset" },
  },
  {
    id: "gemini",
    labelKey: "autoVideo.ttsGen.gemini",
    model: { id: "gemini-3.1-flash-tts-preview", repository: "https://generativelanguage.googleapis.com", capability: "gemini", mode: "preset" },
  },
];

export const CAPCUT_VI_VOICES = CAPCUT_API_VOICES.filter((voice) => voice.languageCode?.toLowerCase().startsWith("vi"));
export const DEFAULT_CAPCUT_VOICE = CAPCUT_VI_VOICES[0]?.voiceType ?? "";

export function getCapCutVoice(voiceType: string) {
  return CAPCUT_API_VOICES.find((voice) => voice.voiceType === voiceType);
}

export function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

