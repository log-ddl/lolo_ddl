export type TtsMode = 'clone' | 'design' | 'auto' | 'preset';
export type TtsSplitMode = 'default' | 'line' | 'sentence';
export type TtsCapability = 'voice-clone' | 'voice-design' | 'auto-voice' | 'preset-voice';
export type TtsProviderId = 'omnivoice-local' | 'vieneu-local' | 'capcut-online' | 'gemini-online' | 'vbee-online';
export type TtsModelStatusValue = 'not-installed' | 'downloading' | 'ready' | 'incompatible' | 'error';

export interface TtsSavedLanguage {
  code: string;
  name: string;
}

export interface TtsAdvancedSettings {
  audioChunkDuration: number;
  audioChunkThreshold: number;
  guidanceScale: number;
  tShift: number;
  positionTemperature: number;
  classTemperature: number;
  layerPenaltyFactor: number;
  denoise: boolean;
  preprocessPrompt: boolean;
  postprocessOutput: boolean;
  padDuration: number;
  fadeDuration: number;
}

export interface TtsSpeaker {
  id: string;
  name: string;
  descriptionKey: string;
}

export interface TtsModelDefinition {
  id: string;
  providerId: TtsProviderId;
  runtimeCapability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu';
  runtimeKind: 'local' | 'online';
  repository: string;
  name: string;
  descriptionKey: string;
  parameterSize: string;
  estimatedDownloadGb: number;
  capabilities: TtsCapability[];
}

export interface TtsModelGroup {
  id: string;
  name: string;
  descriptionKey: string;
  models: TtsModelDefinition[];
}

export interface TtsModelStatus {
  modelId: string;
  status: TtsModelStatusValue;
  installedPath?: string;
  runtimeReady: boolean;
  pythonAvailable: boolean;
  cudaAvailable?: boolean;
  accelerator?: 'cuda' | 'mps' | 'cpu';
  message?: string;
  messageKey?: string;
}

export interface TtsProgressEvent {
  jobId: string;
  kind: 'install' | 'generate';
  stage: string;
  percent?: number;
  message: string;
}

export interface TtsGenerateRequest {
  jobId: string;
  modelId: string;
  text: string;
  mode: TtsMode;
  splitMode?: TtsSplitMode;
  language?: string;
  speed?: number;
  numStep?: number;
  advancedSettings?: TtsAdvancedSettings;
  capcutVoiceType?: string;
  capcutResourceId?: string;
  geminiVoiceName?: string;
  geminiStyle?: string;
  geminiTemperature?: number;
  vbeeVoiceCode?: string;
  vbeeAudioType?: 'mp3' | 'wav';
  vbeeBitrate?: number;
  vieneuVoice?: string;
  vieneuStyle?: 'tu_nhien' | 'tin_tuc' | 'doc_truyen';
  instruction?: string;
  profileId?: string;
  referenceAudioPath?: string;
  referenceText?: string;
}

export interface CapCutVoice {
  voiceType: string;
  displayName: string;
  resourceId: string;
  language: string;
  languageCode: string;
  provider: 'capcut' | 'edge';
}

export interface GeminiVoice {
  name: string;
  description: string;
  gender: 'F' | 'M';
}

export interface VbeeVoice {
  code: string;
  name: string;
  gender: string;
  languageCode: string;
  demo?: string;
  creditFactor?: number;
  ownership: 'VBEE' | 'COMMUNITY' | 'PERSONAL';
}

export interface VieneuVoice {
  id: string;
  label: string;
}

export interface TtsGenerateResult {
  success: boolean;
  outputPath?: string;
  sampleRate?: number;
  durationSec?: number;
  canceled?: boolean;
  error?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  providerId: string;
  modelId: string;
  referenceAudioPath: string;
  referenceText: string;
  createdAt: number;
}

export interface TtsHistoryItem {
  id: string;
  name?: string;
  modelId: string;
  text: string;
  mode: TtsMode;
  voiceLabel: string;
  outputPath: string;
  createdAt: number;
}
