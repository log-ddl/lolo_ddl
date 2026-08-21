import type { TtsModelDefinition } from '../types';

export function createTtsJobId(prefix: 'install' | 'generate' | 'voice') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toRuntimeModel(model: TtsModelDefinition) {
  return {
    id: model.id,
    repository: model.repository,
    capability: model.runtimeCapability,
  };
}

export function toLocalTtsAudioUrl(outputPath: string) {
  const filename = outputPath.split(/[\\/]/).pop() || '';
  return `local-tts://audio/${encodeURIComponent(filename)}`;
}
