/**
 * Renderer-side facade for Whisper transcription.
 * Heavy lifting (FormData upload, audio chunking, SRT merge) happens in the
 * main process via IPC. See `electron/features/video-studio/whisper-runtime.ts`.
 */

export type WhisperProvider = 'openai' | 'groq';

export interface WhisperProviderConfig {
  id: WhisperProvider;
  label: string;
  baseUrl: string;
  defaultModel: string;
  apiKeyHint: string;
  apiKeyDocsUrl: string;
  maxFileBytes: number;
}

export const WHISPER_PROVIDERS: Record<WhisperProvider, WhisperProviderConfig> = {
  groq: {
    id: 'groq',
    label: 'Groq Whisper Turbo',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'whisper-large-v3-turbo',
    apiKeyHint: 'gsk_...',
    apiKeyDocsUrl: 'https://console.groq.com/keys',
    maxFileBytes: 25 * 1024 * 1024,
  },
  openai: {
    id: 'openai',
    label: 'OpenAI Whisper',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'whisper-1',
    apiKeyHint: 'sk-...',
    apiKeyDocsUrl: 'https://platform.openai.com/api-keys',
    maxFileBytes: 25 * 1024 * 1024,
  },
};

export const WHISPER_PROVIDER_ORDER: WhisperProvider[] = ['groq', 'openai'];

export interface TranscribeRequest {
  jobId: string;
  audioPath: string;
  provider: WhisperProvider;
  apiKey: string;
  model?: string;
  language?: string;
  prompt?: string;
  // Soft cap below provider limit; chunks longer than this are split.
  // Default 600s (10 min) keeps individual uploads well under 25MB at 128kbps.
  chunkDurationSec?: number;
}

export interface TranscribeResponse {
  success: boolean;
  srt?: string;
  durationSec?: number;
  chunks?: number;
  error?: string;
  status?: number;
  canceled?: boolean;
}

export interface TranscribeProgressEvent {
  jobId: string;
  type: 'stage' | 'chunk-start' | 'chunk-done' | 'log';
  stage?: 'probing' | 'chunking' | 'uploading' | 'merging' | 'done';
  chunkIndex?: number;
  chunkTotal?: number;
  percent?: number;
  message?: string;
}

export async function transcribeAudio(req: TranscribeRequest): Promise<TranscribeResponse> {
  const api = window.whisperRuntime;
  if (!api) {
    return { success: false, error: 'Whisper runtime not available (not running in Electron?)' };
  }
  return api.transcribe(req);
}

export function cancelTranscribe(jobId: string): Promise<{ canceled: boolean }> {
  const api = window.whisperRuntime;
  if (!api) return Promise.resolve({ canceled: false });
  return api.cancel(jobId);
}

export function onTranscribeProgress(listener: (event: TranscribeProgressEvent) => void): () => void {
  const api = window.whisperRuntime;
  if (!api) return () => {};
  return api.onProgress(listener);
}
