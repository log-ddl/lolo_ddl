/**
 * Per-scene execution: compile the prompts, generate the first frame, animate
 * it, and report progress / failure back to the main thread.
 */

import type { ExecuteSceneCommand } from '@/features/video-studio/packages/ai-core/protocol';
import type { AIScene, CharacterBibleLike, GenerationConfig } from '@/features/video-studio/packages/ai-core';
import {
  fetchAsBlob,
  getBibleCharacters,
  isCancelled,
  postEvent,
  promptCompiler,
  setCancelled,
  sleep,
} from './runtime';
import { generateImage, generateVideo } from './media-api';

export async function handleExecuteScene(command: ExecuteSceneCommand): Promise<void> {
  const { screenplayId, scene, config, characterBible, characterReferenceImages } = command.payload;
  setCancelled(false); // Reset the cancellation flag when a new operation starts

  console.log(`[AI Worker] Executing scene ${scene.sceneId} for screenplay ${screenplayId}`);
  
  // Check cancellation
  if (isCancelled()) {
    reportSceneFailed(screenplayId, scene.sceneId, 'Cancelled', false);
    return;
  }
  
  // Report progress: starting image generation
  reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', 0);
  
  try {
    // Extract characters from bible for consistency
    const characters = getBibleCharacters(characterBible);
    
    // Get character reference images (base64 or URL)
    // These are used to maintain visual consistency across scenes
    const refImages = characterReferenceImages || [];
    console.log(`[AI Worker] Using ${refImages.length} character reference images`);
    
    // ========== Stage 1: Image Generation ==========
    const imagePrompt = promptCompiler.compileSceneImagePrompt(
      scene,
      characters,
      config
    );
    const negativePrompt = promptCompiler.getNegativePrompt();
    
    console.log('[AI Worker] Image prompt:', imagePrompt.substring(0, 100));
    
    // Generate image with progress tracking
    // Pass character reference images for visual consistency
    const imageUrl = await generateImage(
      imagePrompt,
      negativePrompt,
      config,
      (progress) => {
        // Map image progress to 0-45%
        const mappedProgress = Math.floor(progress * 0.45);
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', mappedProgress);
      },
      refImages // Character reference images
    );
    
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', 45);
    console.log('[AI Worker] Image generated:', imageUrl);
    
    // ========== Stage 2: Video Generation ==========
    const videoPrompt = promptCompiler.compileSceneVideoPrompt(scene, characters);
    
    console.log('[AI Worker] Video prompt:', videoPrompt.substring(0, 100));
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 50);
    
    // Generate video with progress tracking
    // Pass character reference images for visual consistency in video
    const videoUrl = await generateVideo(
      imageUrl,
      videoPrompt,
      config,
      (progress) => {
        // Map video progress to 50-95%
        const mappedProgress = 50 + Math.floor(progress * 0.45);
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', mappedProgress);
      },
      refImages // Character reference images
    );
    
    console.log('[AI Worker] Video generated:', videoUrl);
    
    // ========== Stage 3: Download and Create Blob ==========
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 95);
    
    // Download the video as blob
    const videoBlob = await fetchAsBlob(videoUrl);
    
    // ========== Complete ==========
    reportSceneProgress(screenplayId, scene.sceneId, 'completed', 'done', 100);
    
    // Send the completed scene with media blob
    postEvent({
      type: 'SCENE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        mediaBlob: videoBlob,
        metadata: {
          duration: config.duration || 5,
          width: config.aspectRatio === '9:16' ? 720 : 1280,
          height: config.aspectRatio === '9:16' ? 1280 : 720,
          mimeType: 'video/mp4',
        },
      },
    });
    
  } catch (error) {
    const err = error as Error;
    const isCancelled = err.message === 'Cancelled';
    console.error(`[AI Worker] Scene ${scene.sceneId} failed:`, err);
    reportSceneFailed(screenplayId, scene.sceneId, err.message, !isCancelled);
  }
}

/**
 * Helper: Report scene progress
 */
export function reportSceneProgress(
  screenplayId: string,
  sceneId: number,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  stage: 'idle' | 'image' | 'video' | 'audio' | 'done',
  progress: number
): void {
  postEvent({
    type: 'SCENE_PROGRESS',
    payload: {
      screenplayId,
      sceneId,
      progress: {
        sceneId,
        status,
        stage,
        progress,
      },
    },
  });
}

/**
 * Helper: Report scene failed
 */
export function reportSceneFailed(
  screenplayId: string,
  sceneId: number,
  error: string,
  retryable: boolean
): void {
  postEvent({
    type: 'SCENE_FAILED',
    payload: {
      screenplayId,
      sceneId,
      error,
      retryable,
    },
  });
}


/**
 * Handle EXECUTE_SCREENPLAY command
 * Executes all scenes in the screenplay sequentially (or with limited concurrency)
 */
export async function generateSceneImageOnly(
  screenplayId: string,
  scene: AIScene,
  config: GenerationConfig & { mockImage?: boolean },
  characterBible?: CharacterBibleLike | string,
  characterReferenceImages?: string[]
): Promise<void> {
  console.log(`[AI Worker] Generating image for scene ${scene.sceneId}`);
  
  // Check cancellation
  if (isCancelled()) {
    reportSceneFailed(screenplayId, scene.sceneId, 'Cancelled', false);
    throw new Error('Cancelled');
  }
  
  // Report progress: starting image generation
  reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', 0);
  
  // Mock mode check
  if (config.mockImage) {
    console.log('[AI Worker] Mock mode - simulating image generation');
    
    // Simulate progress
    for (let p = 0; p <= 100; p += 25) {
      if (isCancelled()) throw new Error('Cancelled');
      await sleep(200);
      reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', p / 2);
    }
    
    const mockImageUrl = `https://picsum.photos/seed/${scene.sceneId}/1280/720`;
    
    // Report image completed
    postEvent({
      type: 'SCENE_IMAGE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        imageUrl: mockImageUrl,
      },
    });
    
    return;
  }
  
  try {
    // Extract characters from bible for consistency
    const characters = getBibleCharacters(characterBible);
    
    // Get character reference images
    const refImages = characterReferenceImages || (config as any).characterReferenceImages || [];
    console.log(`[AI Worker] Scene ${scene.sceneId}: Using ${refImages.length} reference images`);
    
    // Compile image prompt
    const imagePrompt = promptCompiler.compileSceneImagePrompt(
      scene,
      characters,
      config
    );
    const negativePrompt = promptCompiler.getNegativePrompt();
    
    console.log('[AI Worker] Image prompt:', imagePrompt.substring(0, 100));
    
    // Generate image with progress tracking
    const imageUrl = await generateImage(
      imagePrompt,
      negativePrompt,
      config,
      (progress) => {
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', Math.floor(progress * 0.5));
      },
      refImages
    );
    
    console.log('[AI Worker] Image generated:', imageUrl);
    
    // Report image completed
    postEvent({
      type: 'SCENE_IMAGE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        imageUrl,
      },
    });
    
  } catch (error) {
    const err = error as Error;
    const isCancelled = err.message === 'Cancelled';
    console.error(`[AI Worker] Scene ${scene.sceneId} image failed:`, err);
    reportSceneFailed(screenplayId, scene.sceneId, err.message, !isCancelled);
    throw error;
  }
}

/**
 * Generate video only for a scene (used in two-step flow)
 */
export async function generateSceneVideoOnly(
  screenplayId: string,
  scene: AIScene,
  config: GenerationConfig & { mockVideo?: boolean },
  characterBible?: CharacterBibleLike | string,
  characterReferenceImages?: string[]
): Promise<void> {
  console.log(`[AI Worker] Generating video for scene ${scene.sceneId}`);
  
  // Check cancellation
  if (isCancelled()) {
    reportSceneFailed(screenplayId, scene.sceneId, 'Cancelled', false);
    throw new Error('Cancelled');
  }
  
  // Report progress: starting video generation
  reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 50);
  
  // Mock mode check
  if (config.mockVideo) {
    console.log('[AI Worker] Mock mode - simulating video generation');
    
    // Simulate progress
    for (let p = 50; p <= 100; p += 10) {
      if (isCancelled()) throw new Error('Cancelled');
      await sleep(200);
      reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', p);
    }
    
    // Create a mock video blob
    const mockBlob = new Blob(['mock video data'], { type: 'video/mp4' });
    
    reportSceneProgress(screenplayId, scene.sceneId, 'completed', 'done', 100);
    
    postEvent({
      type: 'SCENE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        mediaBlob: mockBlob,
        metadata: {
          duration: (config as any).duration || 5,
          width: config.aspectRatio === '9:16' ? 720 : 1280,
          height: config.aspectRatio === '9:16' ? 1280 : 720,
          mimeType: 'video/mp4',
        },
      },
    });
    
    return;
  }
  
  try {
    // Extract characters from bible for consistency
    const characters = getBibleCharacters(characterBible);
    
    // Get character reference images
    const refImages = characterReferenceImages || (config as any).characterReferenceImages || [];
    
    // Compile video prompt
    const videoPrompt = promptCompiler.compileSceneVideoPrompt(scene, characters);
    
    console.log('[AI Worker] Video prompt:', videoPrompt.substring(0, 100));
    
    // Generate video with progress tracking
    const videoUrl = await generateVideo(
      scene.imageUrl!,
      videoPrompt,
      config,
      (progress) => {
        const mappedProgress = 50 + Math.floor(progress * 0.45);
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', mappedProgress);
      },
      refImages
    );
    
    console.log('[AI Worker] Video generated:', videoUrl);
    
    // Download and create blob
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 95);
    const videoBlob = await fetchAsBlob(videoUrl);
    
    // Complete
    reportSceneProgress(screenplayId, scene.sceneId, 'completed', 'done', 100);
    
    postEvent({
      type: 'SCENE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        mediaBlob: videoBlob,
        metadata: {
          duration: (config as any).duration || 5,
          width: config.aspectRatio === '9:16' ? 720 : 1280,
          height: config.aspectRatio === '9:16' ? 1280 : 720,
          mimeType: 'video/mp4',
        },
      },
    });
    
  } catch (error) {
    const err = error as Error;
    const isCancelled = err.message === 'Cancelled';
    console.error(`[AI Worker] Scene ${scene.sceneId} video failed:`, err);
    reportSceneFailed(screenplayId, scene.sceneId, err.message, !isCancelled);
    throw error;
  }
}

/**
 * Internal scene execution (used by both EXECUTE_SCENE and EXECUTE_SCREENPLAY)
 */
export async function executeSceneInternal(
  screenplayId: string,
  scene: AIScene,
  config: GenerationConfig & { mockImage?: boolean; mockVideo?: boolean },
  characterBible?: CharacterBibleLike | string,
  characterReferenceImages?: string[]
): Promise<void> {
  console.log(`[AI Worker] Executing scene ${scene.sceneId} for screenplay ${screenplayId}`);
  
  // Check cancellation
  if (isCancelled()) {
    reportSceneFailed(screenplayId, scene.sceneId, 'Cancelled', false);
    throw new Error('Cancelled');
  }
  
  // Report progress: starting image generation
  reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', 0);
  
  // Mock mode check
  if (config.mockImage && config.mockVideo) {
    console.log('[AI Worker] Mock mode - simulating scene execution');
    
    // Simulate progress
    for (let p = 0; p <= 100; p += 20) {
      if (isCancelled()) throw new Error('Cancelled');
      await sleep(300);
      const stage = p < 50 ? 'image' : 'video';
      reportSceneProgress(screenplayId, scene.sceneId, 'generating', stage as any, p);
    }
    
    // Create a mock video blob
    const mockBlob = new Blob(['mock video data'], { type: 'video/mp4' });
    
    reportSceneProgress(screenplayId, scene.sceneId, 'completed', 'done', 100);
    
    postEvent({
      type: 'SCENE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        mediaBlob: mockBlob,
        metadata: {
          duration: config.duration || 5,
          width: config.aspectRatio === '9:16' ? 720 : 1280,
          height: config.aspectRatio === '9:16' ? 1280 : 720,
          mimeType: 'video/mp4',
        },
      },
    });
    
    return;
  }
  
  try {
    // Extract characters from bible for consistency
    const characters = getBibleCharacters(characterBible);
    
    // Get character reference images
    const refImages = characterReferenceImages || (config as any).characterReferenceImages || [];
    console.log(`[AI Worker] Scene ${scene.sceneId}: Using ${refImages.length} reference images`);
    
    // ========== Stage 1: Image Generation ==========
    const imagePrompt = promptCompiler.compileSceneImagePrompt(
      scene,
      characters,
      config
    );
    const negativePrompt = promptCompiler.getNegativePrompt();
    
    console.log('[AI Worker] Image prompt:', imagePrompt.substring(0, 100));
    
    // Generate image with progress tracking
    // Pass character reference images for visual consistency
    const imageUrl = await generateImage(
      imagePrompt,
      negativePrompt,
      config,
      (progress) => {
        const mappedProgress = Math.floor(progress * 0.45);
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', mappedProgress);
      },
      refImages
    );
    
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'image', 45);
    console.log('[AI Worker] Image generated:', imageUrl);
    
    // ========== Stage 2: Video Generation ==========
    const videoPrompt = promptCompiler.compileSceneVideoPrompt(scene, characters);
    
    console.log('[AI Worker] Video prompt:', videoPrompt.substring(0, 100));
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 50);
    
    // Generate video with progress tracking
    // Pass character reference images for visual consistency in video
    const videoUrl = await generateVideo(
      imageUrl,
      videoPrompt,
      config,
      (progress) => {
        const mappedProgress = 50 + Math.floor(progress * 0.45);
        reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', mappedProgress);
      },
      refImages
    );
    
    console.log('[AI Worker] Video generated:', videoUrl);
    
    // ========== Stage 3: Download and Create Blob ==========
    reportSceneProgress(screenplayId, scene.sceneId, 'generating', 'video', 95);
    
    // Download the video as blob
    const videoBlob = await fetchAsBlob(videoUrl);
    
    // ========== Complete ==========
    reportSceneProgress(screenplayId, scene.sceneId, 'completed', 'done', 100);
    
    postEvent({
      type: 'SCENE_COMPLETED',
      payload: {
        screenplayId,
        sceneId: scene.sceneId,
        mediaBlob: videoBlob,
        metadata: {
          duration: config.duration || 5,
          width: config.aspectRatio === '9:16' ? 720 : 1280,
          height: config.aspectRatio === '9:16' ? 1280 : 720,
          mimeType: 'video/mp4',
        },
      },
    });
    
  } catch (error) {
    const err = error as Error;
    const isCancelled = err.message === 'Cancelled';
    console.error(`[AI Worker] Scene ${scene.sceneId} failed:`, err);
    reportSceneFailed(screenplayId, scene.sceneId, err.message, !isCancelled);
    throw error;
  }
}

