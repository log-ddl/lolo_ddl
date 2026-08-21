/**
 * AI Worker
 * Background worker for AI generation tasks
 * Handles screenplay generation, image/video creation, and media processing
 *
 * This file only dispatches messages; the work lives in ./ai-worker/*.
 */

import type {
  WorkerCommand,
  PingCommand,
  CancelCommand,
} from '@/features/video-studio/packages/ai-core/protocol';
import {
  WORKER_VERSION,
  postEvent,
  resolveRuntimeRequest,
  setCancelled,
} from './ai-worker/runtime';
import { handleExecuteScene } from './ai-worker/scene-runner';
import {
  handleExecuteScreenplay,
  handleExecuteScreenplayImages,
  handleExecuteScreenplayVideos,
  handleGenerateScreenplay,
} from './ai-worker/screenplay';

// ==================== Message Handler ====================

self.onmessage = async (e: MessageEvent<WorkerCommand>) => {
  const rawCommand = e.data as unknown as { type: string; payload?: any };
  if (rawCommand.type === 'RUNTIME_RESPONSE') {
    resolveRuntimeRequest(rawCommand.payload);
    return;
  }
  const command = e.data;

  try {
    switch (command.type) {
      case 'PING':
        handlePing(command);
        break;

      case 'GENERATE_SCREENPLAY':
        await handleGenerateScreenplay(command);
        break;

      case 'EXECUTE_SCENE':
        await handleExecuteScene(command);
        break;

      case 'EXECUTE_SCREENPLAY':
        await handleExecuteScreenplay(command);
        break;

      case 'EXECUTE_SCREENPLAY_IMAGES':
        await handleExecuteScreenplayImages(command);
        break;

      case 'EXECUTE_SCREENPLAY_VIDEOS':
        await handleExecuteScreenplayVideos(command);
        break;

      case 'CANCEL':
        handleCancel(command);
        break;

      default:
        console.warn('[AI Worker] Unknown command type:', (command as WorkerCommand).type);
    }
  } catch (error) {
    const err = error as Error;
    postEvent({
      type: 'WORKER_ERROR',
      payload: {
        message: err.message,
        stack: err.stack,
      },
    });
  }
};

// ==================== Command Handlers ====================

function handlePing(command: PingCommand): void {
  postEvent({
    type: 'PONG',
    payload: {
      timestamp: command.payload.timestamp,
      workerTimestamp: Date.now(),
    },
  });
}

function handleCancel(_command: CancelCommand): void {
  console.log('[AI Worker] Cancelling operations');
  setCancelled(true);
  // Do not auto-reset the cancellation flag; the next generation request resets it.
}

// ==================== Initialization ====================

// Signal that worker is ready
postEvent({
  type: 'WORKER_READY',
  payload: { version: WORKER_VERSION },
});

console.log(`[AI Worker] Initialized, version ${WORKER_VERSION}`);
