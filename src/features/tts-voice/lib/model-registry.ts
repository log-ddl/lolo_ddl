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

const COSYVOICE_MODELS: TtsModelDefinition[] = [{
  id: 'cosyvoice3-0.5b', providerId: 'cosyvoice-local', runtimeCapability: 'cosyvoice',
  runtimeKind: 'local', repository: 'FunAudioLLM/Fun-CosyVoice3-0.5B-2512',
  name: 'CosyVoice 3 · 0.5B', descriptionKey: 'tts.model.cosyvoice',
  parameterSize: '0.5B', estimatedDownloadGb: 5, capabilities: ['voice-clone'],
}];

const QWEN3_MODELS: TtsModelDefinition[] = [
  ...(['0.6B', '1.7B'] as const).flatMap((size): TtsModelDefinition[] => [
    {
      id: `qwen3-${size.toLowerCase()}-custom`, providerId: 'qwen3-local', runtimeCapability: 'qwen3',
      runtimeKind: 'local', repository: `Qwen/Qwen3-TTS-12Hz-${size}-CustomVoice`,
      name: `Qwen3-TTS · ${size} CustomVoice`, descriptionKey: 'tts.model.qwenCustom',
      parameterSize: size, estimatedDownloadGb: size === '0.6B' ? 2.5 : 4.5, capabilities: ['preset-voice'],
    },
    {
      id: `qwen3-${size.toLowerCase()}-base`, providerId: 'qwen3-local', runtimeCapability: 'qwen3',
      runtimeKind: 'local', repository: `Qwen/Qwen3-TTS-12Hz-${size}-Base`,
      name: `Qwen3-TTS · ${size} Base`, descriptionKey: 'tts.model.qwenBase',
      parameterSize: size, estimatedDownloadGb: size === '0.6B' ? 2.5 : 4.5, capabilities: ['voice-clone'],
    },
  ]),
  {
    id: 'qwen3-1.7b-design', providerId: 'qwen3-local', runtimeCapability: 'qwen3',
    runtimeKind: 'local', repository: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign',
    name: 'Qwen3-TTS · 1.7B VoiceDesign', descriptionKey: 'tts.model.qwenDesign',
    parameterSize: '1.7B', estimatedDownloadGb: 4.5, capabilities: ['voice-design'],
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
  { id: 'cosyvoice', name: 'CosyVoice', descriptionKey: 'tts.engine.cosyvoice', models: COSYVOICE_MODELS },
  { id: 'qwen3', name: 'Qwen3-TTS', descriptionKey: 'tts.engine.qwen3', models: QWEN3_MODELS },
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
