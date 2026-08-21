import type { GenerationOutput, VideoGenerationInput } from '../media-provider';

export type GrokCredential = {
  credentialId: string;
  extensionInstanceId: string;
  state: 'ready' | 'checking' | 'exhausted' | 'stale' | 'disconnected';
  videoAvailable?: boolean;
  weeklyUsagePercent?: number;
  quotaCheckedAt?: number;
  pageUrl?: string;
};

export type GrokStatus = {
  running: boolean;
  port: number;
  protocolVersion: number;
  readyCredentialCount: number;
  videoLaneCount: number;
  videoLanesPerExtension: number;
  extensionPath?: string;
  credentials: GrokCredential[];
};

export type GrokTaskEvent = {
  taskId: string;
  kind: 'video';
  status: 'queued' | 'submitting' | 'polling' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  credentialId?: string;
};

export type GrokGenerateVideoPayload = Omit<VideoGenerationInput, 'signal' | 'onSubmitted'> & { taskId?: string };
export type GrokGenerationResult = GenerationOutput;
