/**
 * Shared plumbing for the AI worker modules: the API base URL, the cancellation
 * flag, event posting, and the request/response bridge used to hand image and
 * video jobs to the desktop browser runtime on the main thread.
 */

import type { WorkerEvent } from '@/features/video-studio/packages/ai-core/protocol';
import type { AICharacter, CharacterBibleLike } from '@/features/video-studio/packages/ai-core';
import { PromptCompiler } from '@/features/video-studio/packages/ai-core/services/prompt-compiler';

export const WORKER_VERSION = '0.3.1';

// Base URL for API requests (passed from main thread)
let apiBaseUrl = '';

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
}

// Helper to build API URL
export function buildApiUrl(path: string): string {
  if (apiBaseUrl) {
    return `${apiBaseUrl}${path}`;
  }
  // Fallback: try to get from location if available
  if (typeof self !== 'undefined' && (self as any).location?.origin) {
    return `${(self as any).location.origin}${path}`;
  }
  // Last resort: use relative URL (may not work in all workers)
  return path;
}

// API Response types
export interface ImageAPIResponse {
  taskId?: string;
  imageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface VideoAPIResponse {
  taskId?: string;
  videoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface TaskStatusResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    url?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  error?: string;
}

// Prompt compiler instance
export const promptCompiler = new PromptCompiler();

export function getBibleCharacters(characterBible?: CharacterBibleLike | string, fallback: AICharacter[] = []): AICharacter[] {
  if (!characterBible || typeof characterBible === 'string') {
    return fallback;
  }
  return Array.isArray(characterBible.characters) ? characterBible.characters : fallback;
}

// ==================== Cancellation ====================

let cancelled = false;

export function isCancelled(): boolean {
  return cancelled;
}

/** Every new generation request resets this; `handleCancel` sets it. */
export function setCancelled(value: boolean): void {
  cancelled = value;
}

// ==================== Desktop runtime bridge ====================

const pendingRuntimeRequests = new Map<string, { resolve: (value: string) => void; reject: (error: Error) => void }>();

/** Resolves a pending runtime request from a RUNTIME_RESPONSE message. */
export function resolveRuntimeRequest(payload: { requestId?: string; error?: string; url?: string }): boolean {
  const pending = payload?.requestId ? pendingRuntimeRequests.get(payload.requestId) : undefined;
  if (!pending) return false;
  pendingRuntimeRequests.delete(payload.requestId!);
  if (payload.error) pending.reject(new Error(payload.error));
  else pending.resolve(payload.url as string);
  return true;
}

export function requestDesktopRuntime(kind: 'image' | 'video', payload: Record<string, unknown>): Promise<string> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    pendingRuntimeRequests.set(requestId, { resolve, reject });
    self.postMessage({ type: 'RUNTIME_REQUEST', payload: { requestId, kind, ...payload } });
    setTimeout(() => {
      if (!pendingRuntimeRequests.has(requestId)) return;
      pendingRuntimeRequests.delete(requestId);
      reject(new Error('Desktop browser runtime request timed out'));
    }, kind === 'video' ? 480_000 : 240_000);
  });
}

// ==================== Helpers ====================

export function postEvent(event: WorkerEvent): void {
  self.postMessage(event);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch media: ${response.status}`);
  return response.blob();
}
