export const GROK_PROTOCOL_VERSION = 6;
export const GROK_DEFAULT_PORT = 9223;

export type GrokTaskStatus = 'queued' | 'submitting' | 'polling' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export type GrokTaskEvent = {
  taskId: string;
  kind: 'video';
  status: GrokTaskStatus;
  progress?: number;
  message?: string;
  credentialId?: string;
};

export function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

export function assertString(value: unknown, label: string, max = 100_000): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} is invalid`);
}

export function isAllowedGrokMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'assets.grok.com' || url.hostname.endsWith('.grok.com'));
  } catch {
    return false;
  }
}
