import type { VideoLength } from '@/features/video-studio/types/script';
import { googleFlowProvider } from './google-flow-provider';
import { grokVideoProvider } from './grok-video-provider';
import { useProjectStore } from '@/features/video-studio/stores/project-store';

export type GoogleFlowSourceState = {
  preferredCredentialId?: string;
  ownerScopeId?: string;
  projectId?: string;
  mediaIdsByOwnerScope?: Record<string, string>;
};

export type VideoGenerationParams = {
  platform: string;
  projectId?: string;
  sceneId: string | number;
  prompt: string;
  model: string;
  aspectRatio?: string;
  length?: VideoLength;
  startImageUrl?: string;
  endImageUrl?: string;
  referenceImageUrls?: string[];
  referenceImageFlowStates?: Record<string, GoogleFlowSourceState>;
  preferredCredentialId?: string;
  taskId?: string;
  startImageFlowState?: GoogleFlowSourceState;
  endImageFlowState?: GoogleFlowSourceState;
  audioVoice?: string;
  onProgress?: (progress: number) => void;
  onSubmitted?: (submittedAt?: number) => void;
  signal?: AbortSignal;
};

function toGoogleFlowMediaRef(source: string, state?: GoogleFlowSourceState) {
  const ownerScopeId = state?.ownerScopeId;
  return {
    source,
    provider: 'googleflow' as const,
    ownerScopeId,
    flowProjectId: state?.projectId,
    mediaId: ownerScopeId ? state?.mediaIdsByOwnerScope?.[ownerScopeId] : undefined,
  };
}

export async function generateProviderVideo(params: VideoGenerationParams): Promise<{ videoUrl: string; taskId: string; mediaId?: string; credentialId?: string; accountId?: string; ownerScopeId?: string; flowProjectId?: string }> {
  if (params.platform === 'grok') {
    const projectId = params.projectId || useProjectStore.getState().activeProjectId || 'default-project';
    const result = await grokVideoProvider.generateVideo({
      projectId,
      sceneId: String(params.sceneId),
      prompt: params.prompt,
      model: params.model,
      aspectRatio: params.aspectRatio || '16:9',
      duration: Number(params.length as VideoLength | undefined) || undefined,
      startImage: params.startImageUrl ? { source: params.startImageUrl, provider: 'grok' } : undefined,
      endImage: params.endImageUrl ? { source: params.endImageUrl, provider: 'grok' } : undefined,
      onSubmitted: params.onSubmitted,
      signal: params.signal,
    });
    const videoUrl = result.localUrl || result.remoteUrl;
    if (!videoUrl) throw new Error('Grok returned no video URL');
    return { videoUrl, taskId: result.taskId, mediaId: result.mediaId, credentialId: result.credentialId };
  }
  if (params.platform !== 'googleflow') {
    throw new Error(`Unsupported video platform: ${params.platform}. Only "googleflow" and "grok" are supported.`);
  }
  const projectId = params.projectId || useProjectStore.getState().activeProjectId || 'default-project';
  const result = await googleFlowProvider.generateVideo({
    projectId,
    sceneId: String(params.sceneId),
    prompt: params.prompt,
    model: params.model,
    aspectRatio: params.aspectRatio || '16:9',
    duration: Number(params.length as VideoLength | undefined) || undefined,
    startImage: params.startImageUrl ? toGoogleFlowMediaRef(params.startImageUrl, params.startImageFlowState) : undefined,
    endImage: params.endImageUrl ? toGoogleFlowMediaRef(params.endImageUrl, params.endImageFlowState) : undefined,
    references: params.referenceImageUrls?.map((source) => toGoogleFlowMediaRef(source, params.referenceImageFlowStates?.[source])),
    preferredCredentialId: params.preferredCredentialId
      || params.startImageFlowState?.preferredCredentialId
      || params.referenceImageUrls?.map((source) => params.referenceImageFlowStates?.[source]?.preferredCredentialId).find(Boolean),
    taskId: params.taskId,
    onSubmitted: params.onSubmitted,
    signal: params.signal,
  });
  const videoUrl = result.localUrl || result.remoteUrl;
  if (!videoUrl) throw new Error('Google Flow returned no video URL');
  return {
    videoUrl, taskId: result.taskId, mediaId: result.mediaId, credentialId: result.credentialId,
    accountId: result.accountId, ownerScopeId: result.ownerScopeId, flowProjectId: result.flowProjectId,
  };
}
