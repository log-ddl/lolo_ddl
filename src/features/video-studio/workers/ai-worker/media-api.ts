/**
 * Provider calls the worker makes for a single asset: submit an image or video
 * job, then poll the task endpoint until it finishes. Desktop builds hand the
 * job to the browser runtime on the main thread instead of calling HTTP.
 */

import type { GenerationConfig } from '@/features/video-studio/packages/ai-core';
import {
  buildApiUrl,
  isCancelled,
  requestDesktopRuntime,
  sleep,
  type ImageAPIResponse,
  type TaskStatusResponse,
  type VideoAPIResponse,
} from './runtime';

export async function generateImage(
  prompt: string,
  negativePrompt: string,
  config: Partial<GenerationConfig> & { apiKey?: string },
  onProgress?: (progress: number) => void,
  referenceImages?: string[]
): Promise<string> {
  const apiKey = config.apiKey || (config as any).imageApiKey || '';
  const provider = (config as any).imageProvider || 'mock';
  if (provider === 'googleflow') {
    return requestDesktopRuntime('image', {
      provider,
      prompt, negativePrompt, aspectRatio: config.aspectRatio || '9:16',
      model: (config as any).imageModel || 'GEM_PIX_2', referenceImages,
    });
  }
  
  if (!apiKey) {
    throw new Error('Image-generation API key is not configured');
  }
  
  // Submit image generation task
  const submitResponse = await fetch(buildApiUrl('/api/ai/image'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      negativePrompt,
      aspectRatio: config.aspectRatio || '9:16',
      apiKey,
      provider,
      // Pass character reference images for consistency
      referenceImages: referenceImages && referenceImages.length > 0 ? referenceImages : undefined,
    }),
  });
  
  if (!submitResponse.ok) {
    const errorData = await submitResponse.json().catch(() => ({}));
    const errorMsg = errorData.message || errorData.error || `Image API request failed: ${submitResponse.status}`;
    console.error('[AI Worker] Image API error:', submitResponse.status, errorData);
    throw new Error(errorMsg);
  }
  
  const submitData: ImageAPIResponse = await submitResponse.json();
  
  // If image URL is returned directly (synchronous API)
  if (submitData.imageUrl && submitData.status === 'completed') {
    return submitData.imageUrl;
  }
  
  // If taskId is returned, poll for completion
  if (submitData.taskId) {
    return await pollTaskCompletion(submitData.taskId, 'image', apiKey, provider, onProgress);
  }
  
  throw new Error('Invalid API response: no taskId or imageUrl');
}

/**
 * Helper: Generate video via API
 * Returns video URL after polling for completion
 * @param referenceImages - Character reference images (URL) for consistency
 */
export async function generateVideo(
  imageUrl: string,
  prompt: string,
  config: Partial<GenerationConfig> & { apiKey?: string },
  onProgress?: (progress: number) => void,
  referenceImages?: string[]
): Promise<string> {
  const apiKey = config.apiKey || (config as any).videoApiKey || '';
  const provider = (config as any).videoProvider || 'mock';
  if (provider === 'googleflow' || provider === 'grok') {
    return requestDesktopRuntime('video', {
      provider,
      imageUrl, prompt, aspectRatio: config.aspectRatio || '9:16', duration: (config as any).duration || 5,
      model: (config as any).videoModel || (provider === 'grok' ? 'Grok Imagine Video' : 'Veo_3.1-Fast'), referenceImages,
    });
  }
  
  if (!apiKey) {
    throw new Error('Video-generation API key is not configured');
  }
  
  // Submit video generation task
  const submitResponse = await fetch(buildApiUrl('/api/ai/video'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      prompt,
      aspectRatio: config.aspectRatio || '9:16',
      duration: (config as any).duration || 5,
      apiKey,
      provider,
      // Pass character reference images for video generation
      referenceImages: referenceImages && referenceImages.length > 0 ? referenceImages : undefined,
    }),
  });
  
  if (!submitResponse.ok) {
    const errorData = await submitResponse.json().catch(() => ({}));
    throw new Error(errorData.error || `Video API request failed: ${submitResponse.status}`);
  }
  
  const submitData: VideoAPIResponse = await submitResponse.json();
  
  // If video URL is returned directly (synchronous API)
  if (submitData.videoUrl && submitData.status === 'completed') {
    return submitData.videoUrl;
  }
  
  // If taskId is returned, poll for completion
  if (submitData.taskId) {
    return await pollTaskCompletion(submitData.taskId, 'video', apiKey, provider, onProgress);
  }
  
  throw new Error('Invalid API response: no taskId or videoUrl');
}

/**
 * Helper: Poll task status until completion
 */
export async function pollTaskCompletion(
  taskId: string,
  type: 'image' | 'video',
  apiKey: string,
  provider: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const maxAttempts = type === 'video' ? 120 : 60; // Video takes longer
  const pollInterval = 2000; // 2 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isCancelled()) {
      throw new Error('Cancelled');
    }
    
    // Pass the API key in the Authorization header so it does not appear in URLs, logs, or history.
    const statusResponse = await fetch(
      buildApiUrl(`/api/ai/task/${taskId}?provider=${provider}&type=${type}`),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    if (!statusResponse.ok) {
      console.warn(`[AI Worker] Task status check failed: ${statusResponse.status}`);
      await sleep(pollInterval);
      continue;
    }
    
    const statusData: TaskStatusResponse = await statusResponse.json();
    
    console.log(`[AI Worker] Task ${taskId} status:`, statusData.status, statusData.error ? `error: ${JSON.stringify(statusData.error)}` : '');
    
    // Report progress if available
    if (statusData.progress && onProgress) {
      onProgress(statusData.progress);
    }
    
    switch (statusData.status) {
      case 'completed':
        const url = statusData.result?.url || 
                    statusData.result?.imageUrl || 
                    statusData.result?.videoUrl;
        // Also check top-level resultUrl from our API
        const resultUrl = url || (statusData as any).resultUrl;
        if (!resultUrl) {
          throw new Error('Task completed but no URL in result');
        }
        return resultUrl;
        
      case 'failed':
        // Handle error that might be an object
        let errorMsg = 'Task failed';
        if (statusData.error) {
          errorMsg = typeof statusData.error === 'string' 
            ? statusData.error 
            : JSON.stringify(statusData.error);
        }
        throw new Error(errorMsg);
        
      case 'pending':
      case 'processing':
        // Continue polling
        await sleep(pollInterval);
        break;
    }
  }
  
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * pollInterval / 1000}s`);
}

/**
 * Helper: Download URL content as Blob
 */

