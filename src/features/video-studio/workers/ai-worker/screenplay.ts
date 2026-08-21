/**
 * Whole-screenplay jobs: AI screenplay generation, and running every scene —
 * either fully, images-only, or videos-only.
 */

import type { GenerateScreenplayCommand } from '@/features/video-studio/packages/ai-core/protocol';
import type { AIScreenplay, GenerationConfig } from '@/features/video-studio/packages/ai-core';
import { buildApiUrl, isCancelled, postEvent, setApiBaseUrl, setCancelled } from './runtime';
import { executeSceneInternal, generateSceneImageOnly, generateSceneVideoOnly, reportSceneFailed } from './scene-runner';

export async function handleGenerateScreenplay(command: GenerateScreenplayCommand): Promise<void> {
  const { prompt, config } = command.payload;
  
  console.log('[AI Worker] Generating screenplay for prompt:', prompt.substring(0, 100));
  console.log('[AI Worker] Config received:', JSON.stringify(config, null, 2));
  
  try {
    // Check for mock mode
    const mockMode = (config as any).mockMode || false;
    
    // Set baseUrl if provided
    if ((config as any).baseUrl) {
      setApiBaseUrl((config as any).baseUrl);
    }
    
    // Note: API key should be passed from main thread in config
    // The main thread gets it from useAPIConfigStore
    const apiKey = (config as any).apiKey || '';
    const provider = (config as any).chatProvider || 'openrouter';
    const sceneCount = config.sceneCount || 5;
    
    console.log('[AI Worker] Using sceneCount:', sceneCount);
    
    // Only require API key if not in mock mode
    if (!apiKey && !mockMode) {
      throw new Error('API key is not configured. Add one in Settings or enable mock mode.');
    }
    
    // Call the backend API with correct schema
    // Note: Pass raw prompt, API route will compile it with sceneCount
    const response = await fetch(buildApiUrl('/api/ai/screenplay'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        sceneCount,
        aspectRatio: config.aspectRatio || '9:16',
        apiKey,
        provider,
        mockMode,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.error || `API request failed: ${response.status}`;
      console.error('[AI Worker] Screenplay API error:', response.status, errorData);
      throw new Error(errorMsg);
    }
    
    // API returns screenplay directly, not wrapped in { screenplay: ... }
    const screenplay: AIScreenplay = await response.json();
    
    postEvent({
      type: 'SCREENPLAY_READY',
      payload: screenplay,
    });
  } catch (error) {
    const err = error as Error;
    console.error('[AI Worker] Screenplay generation error:', err);
    postEvent({
      type: 'SCREENPLAY_ERROR',
      payload: {
        error: err.message,
        details: err.stack,
      },
    });
  }
}

/**
 * Helper: Generate image via API
 * Returns image URL after polling for completion
 * @param referenceImages - Character reference images (base64 or URL) for consistency
 */
export async function handleExecuteScreenplay(command: { type: string; payload: { screenplay: AIScreenplay; config: GenerationConfig } }): Promise<void> {
  const { screenplay, config } = command.payload;
  setCancelled(false); // Reset the cancellation flag when a new operation starts

  console.log(`[AI Worker] Executing screenplay ${screenplay.id} with ${screenplay.scenes.length} scenes`);
  
  // Set baseUrl if provided
  if ((config as any).baseUrl) {
    setApiBaseUrl((config as any).baseUrl);
  }
  
  // Check for mock modes
  const mockImage = (config as any).mockImage || false;
  const mockVideo = (config as any).mockVideo || false;
  
  const concurrency = config.concurrency || 1;
  
  // Get character reference images from config
  const characterReferenceImages = (config as any).characterReferenceImages || [];
  console.log(`[AI Worker] Using ${characterReferenceImages.length} character reference images from config`);
  
  // Prepare extended config with API keys
  const extendedConfig = {
    ...config,
    apiKey: (config as any).apiKey || '',
    imageApiKey: (config as any).imageApiKey || '',
    videoApiKey: (config as any).videoApiKey || '',
    mockImage,
    mockVideo,
    characterReferenceImages,
  };
  
  // Execute scenes with concurrency control
  const scenes = screenplay.scenes;
  let completedCount = 0;
  let failedCount = 0;
  
  // Process scenes in batches
  for (let i = 0; i < scenes.length; i += concurrency) {
    if (isCancelled()) {
      console.log('[AI Worker] Screenplay execution cancelled');
      break;
    }
    
    const batch = scenes.slice(i, i + concurrency);
    
    // Execute batch in parallel
    await Promise.allSettled(
      batch.map(async (scene) => {
        try {
          await executeSceneInternal(screenplay.id, scene, extendedConfig, screenplay.characterBible, characterReferenceImages);
          completedCount++;
        } catch (error) {
          failedCount++;
          const err = error as Error;
          console.error(`[AI Worker] Scene ${scene.sceneId} failed:`, err.message);
        }
      })
    );
  }
  
  // Report all scenes completed
  postEvent({
    type: 'ALL_SCENES_COMPLETED',
    payload: {
      screenplayId: screenplay.id,
      completedCount,
      failedCount,
      totalCount: scenes.length,
    },
  });
  
  console.log(`[AI Worker] Screenplay execution complete: ${completedCount} completed, ${failedCount} failed`);
}

/**
 * Handle EXECUTE_SCREENPLAY_IMAGES command
 * Generates images for all scenes (Step 1 of two-step flow)
 */
export async function handleExecuteScreenplayImages(command: { type: string; payload: { screenplay: AIScreenplay; config: GenerationConfig } }): Promise<void> {
  const { screenplay, config } = command.payload;
  setCancelled(false); // Reset the cancellation flag when a new operation starts

  console.log(`[AI Worker] Generating images for screenplay ${screenplay.id} with ${screenplay.scenes.length} scenes`);
  
  // Set baseUrl if provided
  if ((config as any).baseUrl) {
    setApiBaseUrl((config as any).baseUrl);
  }
  
  // Check for mock mode
  const mockImage = (config as any).mockImage || false;
  
  const apiKeys = (config as any).apiKeys || {};
  const concurrency = config.concurrency || 1;
  
  console.log('[AI Worker] Config apiKeys:', JSON.stringify(apiKeys));
  console.log('[AI Worker] Config keys:', Object.keys(config as any));
  
  // Validate API key (required for image generation)
  const imageKey = (config as any).imageApiKey || (config as any).apiKey || '';
  if (!imageKey && !mockImage) {
    console.error('[AI Worker] Image API Key not configured');
    postEvent({
      type: 'ALL_IMAGES_COMPLETED',
      payload: {
        screenplayId: screenplay.id,
        completedCount: 0,
        failedCount: screenplay.scenes.length,
        totalCount: screenplay.scenes.length,
        error: 'Image-generation API key is not configured. Configure it in service mapping.',
      },
    });
    // Also report failure for each scene
    for (const scene of screenplay.scenes) {
      reportSceneFailed(screenplay.id, scene.sceneId, 'Image-generation API key is not configured', false);
    }
    return;
  }
  
  // Get character reference images from config
  const characterReferenceImages = (config as any).characterReferenceImages || [];
  console.log(`[AI Worker] Using ${characterReferenceImages.length} character reference images`);
  console.log(`[AI Worker] Image API Key: ${imageKey ? imageKey.substring(0, 10) + '...' : 'NOT SET'}`);
  
  // Prepare extended config with API keys
  const extendedConfig = {
    ...config,
    apiKey: imageKey,
    imageApiKey: imageKey,
    mockImage,
    characterReferenceImages,
  };
  
  // Execute image generation for all scenes
  const scenes = screenplay.scenes;
  let completedCount = 0;
  let failedCount = 0;
  
  // Process scenes in batches
  for (let i = 0; i < scenes.length; i += concurrency) {
    if (isCancelled()) {
      console.log('[AI Worker] Image generation cancelled');
      break;
    }
    
    const batch = scenes.slice(i, i + concurrency);
    
    // Execute batch in parallel
    await Promise.allSettled(
      batch.map(async (scene) => {
        try {
          await generateSceneImageOnly(screenplay.id, scene, extendedConfig, screenplay.characterBible, characterReferenceImages);
          completedCount++;
        } catch (error) {
          failedCount++;
          const err = error as Error;
          console.error(`[AI Worker] Scene ${scene.sceneId} image failed:`, err.message);
        }
      })
    );
  }
  
  // Report all images completed
  postEvent({
    type: 'ALL_IMAGES_COMPLETED',
    payload: {
      screenplayId: screenplay.id,
      completedCount,
      failedCount,
      totalCount: scenes.length,
    },
  });
  
  console.log(`[AI Worker] Image generation complete: ${completedCount} completed, ${failedCount} failed`);
}

/**
 * Handle EXECUTE_SCREENPLAY_VIDEOS command
 * Generates videos from existing scene images (Step 2 of two-step flow)
 */
export async function handleExecuteScreenplayVideos(command: { type: string; payload: { screenplay: AIScreenplay; config: GenerationConfig } }): Promise<void> {
  const { screenplay, config } = command.payload;
  setCancelled(false); // Reset the cancellation flag when a new operation starts

  console.log(`[AI Worker] Generating videos for screenplay ${screenplay.id} with ${screenplay.scenes.length} scenes`);
  
  // Debug: Log each scene's imageUrl
  for (const scene of screenplay.scenes) {
    console.log(`[AI Worker] Scene ${scene.sceneId} imageUrl: ${scene.imageUrl || 'NOT SET'}`);
  }
  
  // Set baseUrl if provided
  if ((config as any).baseUrl) {
    setApiBaseUrl((config as any).baseUrl);
  }
  
  // Check for mock mode
  const mockVideo = (config as any).mockVideo || false;
  
  const concurrency = config.concurrency || 1;
  
  // Get character reference images from config
  const characterReferenceImages = (config as any).characterReferenceImages || [];
  
  // Prepare extended config with API keys
  const extendedConfig = {
    ...config,
    apiKey: (config as any).videoApiKey || (config as any).apiKey || '',
    videoApiKey: (config as any).videoApiKey || (config as any).apiKey || '',
    mockVideo,
    characterReferenceImages,
  };
  
  // Execute video generation for all scenes
  const scenes = screenplay.scenes;
  let completedCount = 0;
  let failedCount = 0;
  
  // Process scenes in batches
  for (let i = 0; i < scenes.length; i += concurrency) {
    if (isCancelled()) {
      console.log('[AI Worker] Video generation cancelled');
      break;
    }
    
    const batch = scenes.slice(i, i + concurrency);
    
    // Execute batch in parallel
    await Promise.allSettled(
      batch.map(async (scene) => {
        try {
          // Scene must have imageUrl from Step 1
          if (!scene.imageUrl) {
            throw new Error(`Scene ${scene.sceneId} has no image, cannot generate video`);
          }
          await generateSceneVideoOnly(screenplay.id, scene, extendedConfig, screenplay.characterBible, characterReferenceImages);
          completedCount++;
        } catch (error) {
          failedCount++;
          const err = error as Error;
          console.error(`[AI Worker] Scene ${scene.sceneId} video failed:`, err.message);
        }
      })
    );
  }
  
  // Report all scenes completed
  postEvent({
    type: 'ALL_SCENES_COMPLETED',
    payload: {
      screenplayId: screenplay.id,
      completedCount,
      failedCount,
      totalCount: scenes.length,
    },
  });
  
  console.log(`[AI Worker] Video generation complete: ${completedCount} completed, ${failedCount} failed`);
}

/**
 * Generate image only for a scene (used in two-step flow)
 */
