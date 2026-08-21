/**
 * AI Worker Bridge
 * Communication layer between main thread and AI Worker
 * Handles message routing, promise management, and store updates
 */

import type {
  WorkerCommand,
  WorkerEvent,
  EventHandlers,
  AIScreenplay,
  AIScene,
  GenerationConfig,
  SceneCompletedEvent,
  SceneFailedEvent,
} from '@/features/video-studio/packages/ai-core';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import { useDirectorStore } from '@/features/video-studio/stores/director-store';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { grokVideoProvider } from '@/features/video-studio/lib/ai/grok-video-provider';

type PromiseCallbacks = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class AIWorkerBridge {
  private worker: Worker | null = null;
  private eventHandlers: Partial<EventHandlers> = {};
  private pendingPromises: Map<string, PromiseCallbacks> = new Map();
  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | null = null;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
  }

  /**
   * Initialize the worker
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      console.warn('[WorkerBridge] Worker already initialized');
      return;
    }

    // Create worker using Next.js worker loader
    this.worker = new Worker(
      new URL('../../workers/ai-worker.ts', import.meta.url)
    );

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);

    // Wait for worker to signal ready
    await this.readyPromise;
    console.log('[WorkerBridge] Worker initialized and ready');
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Register event handlers
   */
  on<K extends keyof EventHandlers>(
    eventType: K,
    handler: EventHandlers[K]
  ): void {
    this.eventHandlers[eventType] = handler;
  }

  /**
   * Remove event handler
   */
  off(eventType: keyof EventHandlers): void {
    delete this.eventHandlers[eventType];
  }

  /**
   * Send a ping to test worker connectivity
   */
  async ping(): Promise<number> {
    const timestamp = Date.now();
    return new Promise((resolve, reject) => {
      const id = `ping_${timestamp}`;
      this.pendingPromises.set(id, {
        resolve: (payload: unknown) => {
          const p = payload as { workerTimestamp: number };
          resolve(p.workerTimestamp - timestamp);
        },
        reject,
      });

      this.sendCommand({ type: 'PING', payload: { timestamp } });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingPromises.has(id)) {
          this.pendingPromises.delete(id);
          reject(new Error('Ping timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Generate a screenplay from a prompt
   */
  async generateScreenplay(
    prompt: string,
    referenceImages?: File[],
    config?: Partial<GenerationConfig>
  ): Promise<AIScreenplay> {
    // Convert files to ArrayBuffer for transfer
    const imageBuffers = referenceImages
      ? await Promise.all(referenceImages.map((f) => f.arrayBuffer()))
      : undefined;

    return new Promise((resolve, reject) => {
      const id = `screenplay_${Date.now()}`;
      this.pendingPromises.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.sendCommand({
        type: 'GENERATE_SCREENPLAY',
        payload: {
          prompt,
          referenceImages: imageBuffers,
          config: config || {},
        },
      });
    });
  }

  /**
   * Execute a single scene
   * @param characterReferenceImages - Array of character reference image URLs or base64 strings
   */
  executeScene(
    screenplayId: string,
    scene: AIScene,
    config: GenerationConfig,
    characterBible?: string,
    characterReferenceImages?: string[]
  ): void {
    this.sendCommand({
      type: 'EXECUTE_SCENE',
      payload: {
        screenplayId,
        scene,
        config,
        characterBible,
        characterReferenceImages,
      },
    });
  }

  /**
   * Execute entire screenplay (images + videos)
   */
  executeScreenplay(screenplay: AIScreenplay, config: GenerationConfig): void {
    this.sendCommand({
      type: 'EXECUTE_SCREENPLAY',
      payload: { screenplay, config },
    });
  }

  /**
   * Execute screenplay images only (Step 1)
   * Generates images for all scenes without videos
   */
  executeScreenplayImages(screenplay: AIScreenplay, config: GenerationConfig): void {
    this.sendCommand({
      type: 'EXECUTE_SCREENPLAY_IMAGES',
      payload: { screenplay, config },
    });
  }

  /**
   * Execute screenplay videos only (Step 2)
   * Generates videos from existing scene images
   */
  executeScreenplayVideos(screenplay: AIScreenplay, config: GenerationConfig): void {
    this.sendCommand({
      type: 'EXECUTE_SCREENPLAY_VIDEOS',
      payload: { screenplay, config },
    });
  }

  /**
   * Retry a failed scene
   */
  retryScene(screenplayId: string, sceneId: number): void {
    this.sendCommand({
      type: 'RETRY_SCENE',
      payload: { screenplayId, sceneId },
    });
  }

  /**
   * Cancel all or specific operations
   */
  cancel(screenplayId?: string, sceneId?: number): void {
    this.sendCommand({
      type: 'CANCEL',
      payload: screenplayId || sceneId ? { screenplayId, sceneId } : undefined,
    });
  }

  // ==================== Private Methods ====================

  private sendCommand(command: WorkerCommand): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    this.worker.postMessage(command);
  }

  private handleWorkerMessage(e: MessageEvent<WorkerEvent | { type: 'RUNTIME_REQUEST'; payload: any }>): void {
    const event = e.data;

    switch (event.type) {
      case 'RUNTIME_REQUEST':
        void this.handleRuntimeRequest(event.payload);
        break;
      case 'WORKER_READY':
        this.readyResolve?.();
        console.log(`[WorkerBridge] Worker ready, version ${event.payload.version}`);
        break;

      case 'PONG':
        // Resolve the oldest pending ping
        for (const [id, callbacks] of this.pendingPromises) {
          if (id.startsWith('ping_')) {
            callbacks.resolve(event.payload);
            this.pendingPromises.delete(id);
            break;
          }
        }
        break;

      case 'SCREENPLAY_READY':
        // Resolve pending screenplay promise
        for (const [id, callbacks] of this.pendingPromises) {
          if (id.startsWith('screenplay_')) {
            callbacks.resolve(event.payload);
            this.pendingPromises.delete(id);
            break;
          }
        }
        // Also call registered handler
        this.eventHandlers.SCREENPLAY_READY?.(event.payload);
        break;

      case 'SCREENPLAY_ERROR':
        // Reject pending screenplay promise
        for (const [id, callbacks] of this.pendingPromises) {
          if (id.startsWith('screenplay_')) {
            callbacks.reject(new Error(event.payload.error));
            this.pendingPromises.delete(id);
            break;
          }
        }
        break;

      case 'SCENE_PROGRESS':
        this.eventHandlers.SCENE_PROGRESS?.(event.payload);
        break;

      case 'SCENE_IMAGE_COMPLETED':
        // Image-only completion (Step 1 of two-step flow)
        this.eventHandlers.SCENE_IMAGE_COMPLETED?.(event.payload);
        break;

      case 'ALL_IMAGES_COMPLETED':
        // All images generated (Step 1 complete)
        this.eventHandlers.ALL_IMAGES_COMPLETED?.(event.payload);
        break;

      case 'SCENE_COMPLETED':
        // Inject completed scene into media store and replace ghost
        this.handleSceneCompleted(event.payload);
        this.eventHandlers.SCENE_COMPLETED?.(event.payload);
        break;

      case 'SCENE_FAILED':
        // Update ghost status to failed
        this.handleSceneFailed(event.payload);
        this.eventHandlers.SCENE_FAILED?.(event.payload);
        break;

      case 'ALL_SCENES_COMPLETED':
        this.eventHandlers.ALL_SCENES_COMPLETED?.(event.payload);
        break;

      case 'WORKER_ERROR':
        console.error('[WorkerBridge] Worker error:', event.payload.message);
        this.eventHandlers.WORKER_ERROR?.(event.payload);
        break;

      default:
        console.warn('[WorkerBridge] Unhandled event type:', (event as WorkerEvent).type);
    }
  }

  private async handleRuntimeRequest(payload: {
    requestId: string;
    kind: 'image' | 'video';
    prompt: string;
    model: string;
    aspectRatio: string;
    imageUrl?: string;
    referenceImages?: string[];
    duration?: number;
    provider?: string;
  }): Promise<void> {
    try {
      const projectId = useProjectStore.getState().activeProjectId || 'default-project';
      const result = payload.kind === 'image'
        ? await googleFlowProvider.generateImage({
          projectId, prompt: payload.prompt, model: payload.model, aspectRatio: payload.aspectRatio,
          references: payload.referenceImages?.map((source) => ({ source, provider: 'googleflow' })),
        })
        : payload.provider === 'grok'
          ? await grokVideoProvider.generateVideo({
            projectId, sceneId: payload.requestId, prompt: payload.prompt, model: payload.model,
            aspectRatio: payload.aspectRatio, duration: payload.duration,
            startImage: payload.imageUrl ? { source: payload.imageUrl, provider: 'grok' } : undefined,
          })
          : await googleFlowProvider.generateVideo({
            projectId, sceneId: payload.requestId, prompt: payload.prompt, model: payload.model,
            aspectRatio: payload.aspectRatio, duration: payload.duration,
            startImage: payload.imageUrl ? { source: payload.imageUrl, provider: 'googleflow' } : undefined,
            references: payload.referenceImages?.map((source) => ({ source, provider: 'googleflow' })),
          });
      const url = result.localUrl || result.remoteUrl;
      if (!url) throw new Error(`${payload.provider === 'grok' ? 'Grok' : 'Google Flow'} returned no media URL`);
      this.worker?.postMessage({ type: 'RUNTIME_RESPONSE', payload: { requestId: payload.requestId, url } });
    } catch (error) {
      this.worker?.postMessage({
        type: 'RUNTIME_RESPONSE',
        payload: { requestId: payload.requestId, error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('[WorkerBridge] Worker error event:', error);
    
    // Reject all pending promises
    for (const callbacks of this.pendingPromises.values()) {
      callbacks.reject(new Error(`Worker error: ${error.message}`));
    }
    this.pendingPromises.clear();
  }

  /**
   * Handle completed scene: inject media and replace ghost
   */
  private async handleSceneCompleted(
    payload: SceneCompletedEvent['payload']
  ): Promise<void> {
    const { sceneId, mediaBlob, metadata } = payload;
    
    console.log(`[WorkerBridge] Scene ${sceneId} completed, injecting media...`);
    
    try {
      const projectId = useProjectStore.getState().activeProject?.id;
      if (!projectId) {
        console.error('[WorkerBridge] No active project');
        return;
      }
      
      // 1. Convert Blob to File
      const file = new File(
        [mediaBlob],
        `ai-scene-${sceneId}.mp4`,
        { type: metadata.mimeType || 'video/mp4' }
      );
      
      // 2. Add the file to the media store under the AI video system folder
      const videoFolderId = useMediaStore.getState().getOrCreateCategoryFolder('ai-video');
      const mediaFile = await useMediaStore.getState().addMediaFile(projectId, {
        name: file.name,
        type: 'video',
        file,
        url: URL.createObjectURL(file),
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        folderId: videoFolderId,
        source: 'ai-video',
        projectId,
      });
      
      // 3. Update director store
      const directorStore = useDirectorStore.getState();
      if (mediaFile) {
        directorStore.onSceneCompleted(sceneId, mediaFile.id);
        console.log(`[WorkerBridge] Scene ${sceneId} media injected: ${mediaFile.id}`);
      }
      
    } catch (error) {
      console.error('[WorkerBridge] Failed to inject scene media:', error);
    }
  }

  /**
   * Handle failed scene: update ghost status
   */
  private async handleSceneFailed(
    payload: SceneFailedEvent['payload']
  ): Promise<void> {
    const { sceneId, error } = payload;
    
    console.log(`[WorkerBridge] Scene ${sceneId} failed:`, error);
    
    try {
      // Update director store
      const directorStore = useDirectorStore.getState();
      directorStore.onSceneFailed(sceneId, error);
      
    } catch (err) {
      console.error('[WorkerBridge] Failed to handle scene failure:', err);
    }
  }
}

// Singleton instance
let bridgeInstance: AIWorkerBridge | null = null;

/**
 * Get or create the singleton worker bridge instance
 */
export function getWorkerBridge(): AIWorkerBridge {
  if (!bridgeInstance) {
    bridgeInstance = new AIWorkerBridge();
  }
  return bridgeInstance;
}

/**
 * Initialize the worker bridge (call once at app startup)
 */
export async function initializeWorkerBridge(): Promise<AIWorkerBridge> {
  const bridge = getWorkerBridge();
  await bridge.initialize();
  return bridge;
}
