import type { GenerationOutput, ImageGenerationInput, VideoGenerationInput } from '../media-provider';

export type GoogleFlowCredentialState = 'ready' | 'stale' | 'disconnected' | 'blocked';

export type GoogleFlowCredential = {
  credentialId: string;
  extensionInstanceId: string;
  connectionId: string;
  ownerScopeId: string;
  accountId?: string;
  tokenAgeMs?: number;
  state: GoogleFlowCredentialState;
  tier?: string;
  credits?: number;
};

export type GoogleFlowStatus = {
  running: boolean;
  port: number;
  protocolVersion: number;
  readyCredentialCount: number;
  imageLaneCount: number;
  videoLaneCount: number;
  extensionPath?: string;
  credentials: GoogleFlowCredential[];
};

export type GoogleFlowProjectBinding = {
  longddProjectId: string;
  flowProjectId: string;
  ownerScopeId: string;
  accountId?: string;
  lastCredentialId: string;
  createdAt: number;
  lastVerifiedAt: number;
  title?: string;
  active: boolean;
  connected: boolean;
  credentialId?: string;
  extensionInstanceId?: string;
};

export type GoogleFlowTaskEvent = {
  taskId: string;
  kind: 'image' | 'video' | 'upscale';
  status: 'queued' | 'uploading' | 'submitting' | 'polling' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  phase?: 'checking_media' | 'uploading_media' | 'media_ready';
  credentialId?: string;
  extensionInstanceId?: string;
  laneSlot?: number;
  totalLanes?: number;
  submittedAt?: number;
  message?: string;
};

export type GoogleFlowGenerateImagePayload = Omit<ImageGenerationInput, 'signal' | 'onSubmitted'> & { taskId?: string };
export type GoogleFlowGenerateVideoPayload = Omit<VideoGenerationInput, 'signal' | 'onSubmitted'> & { taskId?: string };
export type GoogleFlowGenerationResult = GenerationOutput;

export type GoogleFlowStoredMedia = {
  mediaId: string;
  flowProjectId: string;
};

export type GoogleFlowMediaIdsBySource = Record<string, Record<string, GoogleFlowStoredMedia>>;

export type GoogleFlowReferenceSyncSource = {
  sourceKey: string;
  source: string;
  mediaIdsByOwnerScope?: Record<string, GoogleFlowStoredMedia>;
};

export type GoogleFlowReferenceSyncResult = {
  credentialCount: number;
  sourceCount: number;
  syncedReferenceCount: number;
  uploadedCount: number;
  skippedCount: number;
  credentials: Array<{
    credentialId: string;
    ownerScopeId: string;
    flowProjectId?: string;
    syncedReferenceCount: number;
    uploadedCount: number;
    skippedCount: number;
    mediaIdsBySource: Record<string, string>;
    error?: string;
  }>;
};
