import type {
  GenerationOutput,
  ImageGenerationInput,
  MediaGenerationProvider,
  ProviderMediaRef,
  VideoGenerationInput,
} from '@/features/video-studio/packages/ai-core/providers/media-provider';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { taskMetadata, type TaskMetadata } from '@/shared/task-metadata';

async function normalizeSource(ref: ProviderMediaRef): Promise<ProviderMediaRef> {
  if (!ref.source.startsWith('local-image://')) return ref;
  const result = await window.imageStorage?.readAsBase64(ref.source);
  if (!result?.success || !result.base64) throw new Error(result?.error || 'Không thể đọc ảnh đầu vào cho Grok');
  const dataUrl = result.base64.startsWith('data:')
    ? result.base64
    : `data:${result.mimeType || 'image/jpeg'};base64,${result.base64}`;
  return { ...ref, source: dataUrl };
}

async function withCancellation<T extends GenerationOutput>(
  signal: AbortSignal | undefined,
  call: (taskId: string) => Promise<T>,
  onSubmitted?: () => void,
  metadata?: Omit<TaskMetadata, 'id' | 'queuedAt' | 'status'>,
): Promise<T> {
  const taskId = crypto.randomUUID();
  if (metadata) taskMetadata.begin({ ...metadata, id: taskId, queuedAt: Date.now(), status: 'queued' });
  const onAbort = () => { void window.grokVideoRuntime?.cancelTask(taskId); };
  let submitted = false;
  const offTask = metadata || onSubmitted
    ? window.grokVideoRuntime?.onTask((task) => {
      if (task.taskId !== taskId) return;
      if (!submitted && task.taskId === taskId && task.status === 'submitting') {
        submitted = true;
        taskMetadata.submitted(taskId);
        onSubmitted?.();
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
    taskMetadata.completed(taskId, result.localUrl || result.remoteUrl, { mediaId: result.mediaId });
    return result;
  } catch (error) {
    taskMetadata.failed(taskId, error);
    throw error;
  }
  finally {
    offTask?.();
    signal?.removeEventListener('abort', onAbort);
  }
}

export const grokVideoProvider: MediaGenerationProvider = {
  id: 'grok',
  async generateImage(_input: ImageGenerationInput) {
    throw new Error('Grok trong logdd hiện chỉ dùng cho tạo video.');
  },
  async generateVideo(input: VideoGenerationInput) {
    const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
    const videoLanesPerExtension = Math.max(1, settings.videoLanesPerJwt || 1);
    await window.grokVideoRuntime?.updateSettings({
      videoLanesPerExtension,
      videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
      extensionStartStaggerMinMs: settings.jwtStartStaggerMinMs,
      extensionStartStaggerMaxMs: settings.jwtStartStaggerMaxMs,
    });
    if (!window.grokVideoRuntime) throw new Error('Grok Video chỉ hoạt động trong ứng dụng logdd desktop.');
    const startImage = input.startImage ? await normalizeSource(input.startImage) : undefined;
    const endImage = input.endImage ? await normalizeSource(input.endImage) : undefined;
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      (taskId) => window.grokVideoRuntime!.generateVideo({ ...runtimeInput, taskId, startImage, endImage }),
      onSubmitted,
      {
        kind: 'video',
        provider: 'Grok',
        model: 'Grok Video',
        prompt: input.prompt,
        details: {
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          mode: endImage ? 'start-end' : startImage ? 'start' : 'text',
        },
      },
    );
  },
  async cancel(taskId: string) { await window.grokVideoRuntime?.cancelTask(taskId); },
};
