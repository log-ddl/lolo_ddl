import type { WebSocket } from 'ws'
import type { FlowCredentialSlot } from './protocol'

/** Internal shapes for the Google Flow runtime: sockets, lanes and bindings. */

export type RuntimeOptions = { userDataPath: string; mediaRoot: string; extensionPath?: string; port?: number };
export type PendingRequest = {
  credentialId: string;
  url: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};
export type SocketState = { socket: WebSocket; slot: FlowCredentialSlot; protocol: 'native' | 'flowkit-legacy' };
export type Lane = { credentialId: string; slot: number; kind: 'image' | 'video'; queued: number; chain: Promise<void> };

export type FlowMediaRefInput = {
  source: string;
  mediaId?: string;
  ownerScopeId?: string;
  flowProjectId?: string;
  credentialId?: string;
};
export type FlowImageInput = {
  taskId?: string; projectId: string; sceneId?: string; prompt: string; model: string; aspectRatio: string;
  baseImage?: FlowMediaRefInput; references?: FlowMediaRefInput[]; preferredCredentialId?: string;
};
export type FlowVideoInput = {
  taskId?: string; projectId: string; sceneId: string; prompt: string; model: string; aspectRatio: string; duration?: number;
  startImage?: FlowMediaRefInput; endImage?: FlowMediaRefInput; references?: FlowMediaRefInput[]; preferredCredentialId?: string;
};

export type ProjectBinding = {
  longddProjectId: string; flowProjectId: string; ownerScopeId: string; accountId?: string;
  lastCredentialId: string; createdAt: number; lastVerifiedAt: number; title?: string; active?: boolean;
};

export type FlowProjectBindingInfo = ProjectBinding & {
  active: boolean;
  connected: boolean;
  credentialId?: string;
  extensionInstanceId?: string;
};

export type GenerationResult = {
  taskId: string; provider: 'googleflow'; credentialId: string; accountId?: string; ownerScopeId: string;
  flowProjectId: string; mediaId?: string; remoteUrl?: string; localUrl?: string;
};

export const safeMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/captcha/i.test(message)) return `CAPTCHA: ${message}`;
  if (/401|403|token|flow_key/i.test(message)) return `TOKEN: ${message}`;
  if (/429|quota|credit/i.test(message)) return `QUOTA: ${message}`;
  if (/moderation|safety/i.test(message)) return `MODERATION: ${message}`;
  return message;
}

