import type {
  GenerationOutput,
  ImageGenerationInput,
  MediaGenerationProvider,
  ProviderMediaRef,
  VideoGenerationInput,
} from '@/features/video-studio/packages/ai-core/providers/media-provider';
import { getGoogleFlowUserFacingError } from './google-flow-errors';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { removeWatermarkFromUrl } from './watermark-remover';
import { useLicenseStore } from '@/shared/stores/license-store';
import { hasPlanAccess } from '@/shared/lib/license-client';
import { taskMetadata, type TaskMetadata } from '@/shared/task-metadata';

async function cleanGeneratedWatermark(imageUrl: string): Promise<string | null> {
  const settings = useVideoStudioSettingsStore.getState();
  if (!settings.watermarkRemovalEnabled) return null;
  const plan = useLicenseStore.getState().plan;
  if (!hasPlanAccess(plan, 'pro')) return null;
  return removeWatermarkFromUrl(imageUrl);
}

async function syncRuntimeSettings(): Promise<void> {
  const runtime = window.googleFlowRuntime;
  if (!runtime) return;
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  await runtime.updateSettings({
    imageLanesPerToken: settings.imageLanesPerJwt,
    videoLanesPerToken: settings.videoLanesPerJwt,
    imageSubmitDelayMinMs: settings.imageSubmitDelayMinMs,
    imageSubmitDelayMaxMs: settings.imageSubmitDelayMaxMs,
    videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
    videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
    accountStartStaggerMinMs: settings.jwtStartStaggerMinMs,
    accountStartStaggerMaxMs: settings.jwtStartStaggerMaxMs,
  });
}

async function normalizeSource(ref: ProviderMediaRef): Promise<ProviderMediaRef> {
  if (!ref.source.startsWith('local-image://')) return ref;
  const result = await window.imageStorage?.readAsBase64(ref.source);
  if (!result?.success || !result.base64) throw new Error(result?.error || 'Unable to read local reference image');
  const dataUrl = result.base64.startsWith('data:')
    ? result.base64
    : `data:${result.mimeType || 'image/jpeg'};base64,${result.base64}`;
  return { ...ref, source: dataUrl };
}

async function normalizeRefs(refs?: ProviderMediaRef[]): Promise<ProviderMediaRef[] | undefined> {
  if (!refs?.length) return undefined;
  return Promise.all(refs.map(normalizeSource));
}

async function withCancellation<T extends GenerationOutput>(
  signal: AbortSignal | undefined,
  call: (taskId: string) => Promise<T>,
  onSubmitted?: (submittedAt?: number) => void,
  presetTaskId?: string,
  metadata?: Omit<TaskMetadata, 'id' | 'status' | 'queuedAt'>,
): Promise<T> {
  const taskId = presetTaskId || crypto.randomUUID();
  if (metadata) taskMetadata.begin({ ...metadata, id: taskId, status: 'queued', queuedAt: Date.now() });
  const onAbort = () => { void window.googleFlowRuntime?.cancelTask(taskId); };
  let submitted = false;
  const offTask = metadata || onSubmitted
    ? window.googleFlowRuntime?.onTask((task) => {
      if (task.taskId !== taskId) return;
      if (!submitted && task.taskId === taskId && task.status === 'submitting') {
        submitted = true;
        taskMetadata.submitted(taskId, task.submittedAt || Date.now());
        onSubmitted?.(task.submittedAt);
      }
      if (task.status === 'polling' || task.status === 'downloading') {
        taskMetadata.update(taskId, { status: 'running' });
      }
    })
    : undefined;
  if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const result = await call(taskId);
    taskMetadata.completed(taskId, result.localUrl || result.remoteUrl, {
      mediaId: result.mediaId,
      credentialId: result.credentialId,
      flowProjectId: result.flowProjectId,
    });
    return result;
  }
  catch (error) {
    taskMetadata.failed(taskId, error);
    throw new Error(getGoogleFlowUserFacingError(error));
  }
  finally {
    offTask?.();
    signal?.removeEventListener('abort', onAbort);
  }
}

export const googleFlowProvider: MediaGenerationProvider = {
  id: 'googleflow',
  async generateImage(input: ImageGenerationInput) {
    if (!window.googleFlowRuntime) throw new Error('Google Flow chỉ hoạt động trong ứng dụng LONGDD trên máy tính');
    await syncRuntimeSettings();
    const baseImage = input.baseImage ? await normalizeSource(input.baseImage) : undefined;
    const references = await normalizeRefs(input.references);
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      async (taskId) => {
        const result = await window.googleFlowRuntime!.generateImage({ ...runtimeInput, taskId, baseImage, references });
        const imageUrl = result.localUrl || result.remoteUrl;
        if (imageUrl) {
          const cleaned = await cleanGeneratedWatermark(imageUrl);
          // The cleaned file no longer matches the media Flow still holds under
          // result.mediaId. Drop the id so nothing downstream (start frames,
          // character/scene references) can silently reuse the watermarked
          // original — every caller re-uploads the cleaned image instead.
          if (cleaned) return { ...result, localUrl: cleaned, mediaId: undefined };
        }
        return result;
      },
      onSubmitted,
      input.taskId,
      {
        kind: 'image', provider: 'Google Flow', model: runtimeInput.model, prompt: runtimeInput.prompt,
        details: { aspectRatio: runtimeInput.aspectRatio, referenceCount: references?.length || 0 },
      },
    );
  },
  async generateVideo(input: VideoGenerationInput) {
    if (!window.googleFlowRuntime) throw new Error('Google Flow chỉ hoạt động trong ứng dụng LONGDD trên máy tính');
    await syncRuntimeSettings();
    const startImage = input.startImage ? await normalizeSource(input.startImage) : undefined;
    const endImage = input.endImage ? await normalizeSource(input.endImage) : undefined;
    const references = await normalizeRefs(input.references);
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      (taskId) => window.googleFlowRuntime!.generateVideo({ ...runtimeInput, taskId, startImage, endImage, references }),
      onSubmitted,
      input.taskId,
      {
        kind: 'video', provider: 'Google Flow', model: runtimeInput.model, prompt: runtimeInput.prompt,
        details: {
          aspectRatio: runtimeInput.aspectRatio,
          duration: runtimeInput.duration,
          mode: references?.length ? 'reference-to-video' : endImage ? 'start-end' : 'start-frame',
          referenceCount: references?.length || 0,
        },
      },
    );
  },
  async cancel(taskId: string) { await window.googleFlowRuntime?.cancelTask(taskId); },
};

export async function upscaleGoogleFlowVideo(input: {
  projectId: string;
  sceneId: string;
  mediaId: string;
  aspectRatio: string;
  preferredCredentialId?: string;
  signal?: AbortSignal;
}): Promise<GenerationOutput> {
  if (!window.googleFlowRuntime) throw new Error('Google Flow chỉ hoạt động trong ứng dụng LONGDD trên máy tính');
  await syncRuntimeSettings();
  return withCancellation(input.signal, (taskId) => window.googleFlowRuntime!.upscaleVideo({ ...input, taskId }));
}
