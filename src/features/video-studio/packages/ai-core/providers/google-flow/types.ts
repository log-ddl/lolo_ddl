import type { GenerationOutput, ImageGenerationInput, VideoGenerationInput } from '../media-provider';

/**
 * Machine-readable prefixes the runtime puts on lane-selection failures, so a
 * caller can react to "this exact model is out everywhere" without parsing prose.
 * Mirrors electron/features/video-studio/google-flow/quota-locks.ts — the two
 * must stay identical; main and renderer cannot share a module.
 */
export const FLOW_ALL_ACCOUNTS_QUOTA_LOCKED = 'FLOW_ALL_ACCOUNTS_QUOTA_LOCKED';
export const FLOW_NO_ALLOWED_ACCOUNT = 'FLOW_NO_ALLOWED_ACCOUNT';

/** True when every allowed account has burned its daily quota for the requested model. */
export function isAllAccountsQuotaLocked(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(FLOW_ALL_ACCOUNTS_QUOTA_LOCKED);
}

/** True when none of the accounts the caller allowed is connected right now. */
export function isNoAllowedAccount(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(FLOW_NO_ALLOWED_ACCOUNT);
}

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
  /** Models this account is out of daily quota for, with their reset time. */
  quotaLocks?: Array<{ modelKey: string; until: number }>;
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
