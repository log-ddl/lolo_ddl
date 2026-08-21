export const GOOGLE_FLOW_PROTOCOL_VERSION = 1;
export const GOOGLE_FLOW_DEFAULT_PORT = 9222;
export const GOOGLE_FLOW_API_ROOT = 'https://aisandbox-pa.googleapis.com';
export const GOOGLE_FLOW_TRPC_ROOT = 'https://labs.google/fx/api/trpc';
// Browser-restricted public key used by the Google Flow web application.
export const GOOGLE_FLOW_BROWSER_API_KEY = 'AIzaSyBtrm0o5ab1c-Ec8ZuLcGt3oJAA5VWt3pY';

export type FlowCredentialState = 'ready' | 'stale' | 'disconnected' | 'blocked';

export type FlowCredentialSlot = {
  credentialId: string;
  extensionInstanceId: string;
  connectionId: string;
  ownerScopeId: string;
  accountId?: string;
  tokenFingerprint?: string;
  tokenCapturedAt?: number;
  state: FlowCredentialState;
  tier?: string;
  credits?: number;
};

export type FlowTaskStatus = 'queued' | 'uploading' | 'submitting' | 'polling' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export type FlowTaskEvent = {
  taskId: string;
  kind: 'image' | 'video' | 'upscale';
  status: FlowTaskStatus;
  progress?: number;
  phase?: 'checking_media' | 'uploading_media' | 'media_ready';
  credentialId?: string;
  extensionInstanceId?: string;
  laneSlot?: number;
  totalLanes?: number;
  submittedAt?: number;
  message?: string;
};

export function isAllowedFlowUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (
      url.hostname === 'aisandbox-pa.googleapis.com'
      || (url.hostname === 'labs.google' && url.pathname.startsWith('/fx/api/trpc/'))
    );
  } catch {
    return false;
  }
}

export function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

export function assertString(value: unknown, label: string, max = 100_000): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} is invalid`);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
