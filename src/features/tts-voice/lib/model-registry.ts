import type { TtsModelDefinition, TtsModelGroup } from '../types';

const OMNIVOICE_MODELS: TtsModelDefinition[] = [
  {
    id: 'omnivoice-main',
    providerId: 'omnivoice-local',
    runtimeCapability: 'omnivoice',
    runtimeKind: 'local',
    repository: 'k2-fsa/OmniVoice',
    name: 'OmniVoice',
    descriptionKey: 'tts.model.omnivoice',
    parameterSize: 'Omnilingual',
    estimatedDownloadGb: 3.3,
    capabilities: ['voice-clone', 'voice-design', 'auto-voice'],
  },
];

const VIENEU_MODELS: TtsModelDefinition[] = [
  {
    id: 'vieneu-v3-turbo',
    providerId: 'vieneu-local',
    runtimeCapability: 'vieneu',
    runtimeKind: 'local',
    repository: 'pnnbao97/VieNeu-TTS',
    name: 'VieNeu v3 Turbo',
    descriptionKey: 'tts.model.vieneu',
    parameterSize: '48 kHz • ONNX',
    estimatedDownloadGb: 1.5,
    capabilities: ['preset-voice', 'voice-clone'],
  },
];

const CAPCUT_MODELS: TtsModelDefinition[] = [
  {
    id: 'capcut-online',
    providerId: 'capcut-online',
    runtimeCapability: 'capcut',
    runtimeKind: 'online',
    repository: 'https://editor-api-sg.capcutapi.com',
    name: 'CapCut Online',
    descriptionKey: 'tts.model.capcut',
    parameterSize: '126 voices',
    estimatedDownloadGb: 0,
    capabilities: ['preset-voice'],
  },
];

const GEMINI_MODELS: TtsModelDefinition[] = [
  {
    id: 'gemini-3.1-flash-tts-preview',
    providerId: 'gemini-online',
    runtimeCapability: 'gemini',
    runtimeKind: 'online',
    repository: 'https://generativelanguage.googleapis.com',
    name: 'Gemini 3.1 Flash TTS',
    descriptionKey: 'tts.model.gemini31',
    parameterSize: 'Preview',
    estimatedDownloadGb: 0,
    capabilities: ['preset-voice'],
  },
  {
    id: 'gemini-2.5-flash-preview-tts',
    providerId: 'gemini-online',
    runtimeCapability: 'gemini',
    runtimeKind: 'online',
    repository: 'https://generativelanguage.googleapis.com',
    name: 'Gemini 2.5 Flash TTS',
    descriptionKey: 'tts.model.gemini25',
    parameterSize: 'Preview',
    estimatedDownloadGb: 0,
    capabilities: ['preset-voice'],
  },
];

const VBEE_MODELS: TtsModelDefinition[] = [
  {
    id: 'vbee-api',
    providerId: 'vbee-online',
    runtimeCapability: 'vbee',
    runtimeKind: 'online',
    repository: 'https://vbee.vn/api/v1/tts',
    name: 'Vbee API',
    descriptionKey: 'tts.model.vbee',
    parameterSize: 'API',
    estimatedDownloadGb: 0,
    capabilities: ['preset-voice'],
  },
];

export const TTS_MODEL_GROUPS: TtsModelGroup[] = [
  {
    id: 'omnivoice',
    name: 'OmniVoice',
    descriptionKey: 'tts.engine.omnivoice',
    models: OMNIVOICE_MODELS,
  },
  {
    id: 'vieneu',
    name: 'VieNeu',
    descriptionKey: 'tts.engine.vieneu',
    models: VIENEU_MODELS,
  },
  {
    id: 'capcut',
    name: 'CapCut',
    descriptionKey: 'tts.engine.capcut',
    models: CAPCUT_MODELS,
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    descriptionKey: 'tts.engine.gemini',
    models: GEMINI_MODELS,
  },
  {
    id: 'vbee',
    name: 'Vbee',
    descriptionKey: 'tts.engine.vbee',
    models: VBEE_MODELS,
  },
];

export const TTS_MODELS = TTS_MODEL_GROUPS.flatMap((group) => group.models);

export function getTtsModel(modelId: string) {
  return TTS_MODELS.find((model) => model.id === modelId);
}

export function getTtsModelGroup(groupId: string) {
  return TTS_MODEL_GROUPS.find((group) => group.id === groupId);
}
