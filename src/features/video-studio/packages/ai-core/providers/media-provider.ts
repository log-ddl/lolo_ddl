export type MediaProviderId = 'googleflow' | 'grok';

export type ProviderMediaRef = {
  source: string;
  provider?: MediaProviderId;
  ownerScopeId?: string;
  accountId?: string;
  credentialId?: string;
  flowProjectId?: string;
  mediaId?: string;
};

export type ImageGenerationInput = {
  projectId: string;
  sceneId?: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  baseImage?: ProviderMediaRef;
  references?: ProviderMediaRef[];
  preferredCredentialId?: string;
  // Caller-supplied task id, so the caller can correlate this call's live
  // phase updates (useGoogleFlowRuntimeStore tasks[taskId]) before the
  // promise resolves. Falls back to an internally generated id when unset.
  taskId?: string;
  onSubmitted?: (submittedAt?: number) => void;
  signal?: AbortSignal;
};

export type VideoGenerationInput = {
  projectId: string;
  sceneId: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  duration?: number;
  startImage?: ProviderMediaRef;
  endImage?: ProviderMediaRef;
  references?: ProviderMediaRef[];
  preferredCredentialId?: string;
  taskId?: string;
  onSubmitted?: () => void;
  signal?: AbortSignal;
};

export type GenerationOutput = {
  taskId: string;
  provider: MediaProviderId;
  credentialId?: string;
  accountId?: string;
  ownerScopeId?: string;
  flowProjectId?: string;
  mediaId?: string;
  remoteUrl?: string;
  localUrl?: string;
};

export interface MediaGenerationProvider {
  id: MediaProviderId;
  generateImage(input: ImageGenerationInput): Promise<GenerationOutput>;
  generateVideo(input: VideoGenerationInput): Promise<GenerationOutput>;
  cancel(taskId: string): Promise<void>;
}
