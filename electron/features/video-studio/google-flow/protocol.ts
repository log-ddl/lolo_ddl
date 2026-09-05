export const GOOGLE_FLOW_PROTOCOL_VERSION = 1;
export const GOOGLE_FLOW_DEFAULT_PORT = 9222;
export const GOOGLE_FLOW_API_ROOT = 'https://aisandbox-pa.googleapis.com';
// tRPC is called with a ROOT-RELATIVE path, never an absolute URL, because the
// fetch runs inside the app-spawned Chrome tab (see in-app-bridge performFetch).
// Google moved the signed-in Flow app off labs.google onto flow.google.com, so a
// hard-coded https://labs.google/... became cross-origin the moment the tab
// followed that move and every call died as "TypeError: Failed to fetch".
// A relative path resolves against whatever origin the tab is on, so it stays
// same-origin across the move — and any future one.
// Ordered by likelihood: /fx/api/trpc is what labs.google serves today.
export const GOOGLE_FLOW_TRPC_PATHS = ['/fx/api/trpc', '/api/trpc'] as const;
// tRPC still lives on labs.google even though the signed-in UI moved to
// flow.google.com. The bridge sends these from the Electron main process, where
// there is no CORS at all, so the origin split stops mattering.
export const GOOGLE_FLOW_TRPC_ORIGIN = 'https://labs.google';
// Where the signed-in Flow app now lives. Its project page is the only page that
// loads reCAPTCHA Enterprise, which every generation request needs.
export const GOOGLE_FLOW_APP_ORIGIN = 'https://flow.google.com';
// Legacy browser-restricted public key from labs.google.
export const GOOGLE_FLOW_LEGACY_API_KEY = 'AIzaSyBtrm0o5ab1c-Ec8ZuLcGt3oJAA5VWt3pY';
// Browser-restricted public key used by the Google Flow web application (flow.google.com).
export const GOOGLE_FLOW_BROWSER_API_KEY = 'AIzaSyDSjGxWlo68HcGt6mbaIq9YbkKhFQnt3sk';

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
  // Root-relative tRPC path: resolved by the tab against its own origin, so it
  // can never leave the Flow app. `//host` is protocol-relative and WOULD leave,
  // so it must stay rejected.
  if (value.startsWith('/') && !value.startsWith('//')) {
    return GOOGLE_FLOW_TRPC_PATHS.some((path) => value.startsWith(`${path}/`));
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (
      url.hostname === 'aisandbox-pa.googleapis.com'
      || ((url.hostname === 'labs.google' || url.hostname === 'flow.google.com')
        && GOOGLE_FLOW_TRPC_PATHS.some((path) => url.pathname.startsWith(`${path}/`)))
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
