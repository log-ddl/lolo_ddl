import type { GenerationOutput, ImageGenerationInput } from '@/features/video-studio/packages/ai-core/providers/media-provider';
import { readImageAsBase64 } from '../image-storage';
import { QWEN_LOCAL_IMAGE_MODEL } from '../api-key-manager';

export async function generateQwenLocalImage(input: ImageGenerationInput): Promise<GenerationOutput> {
  if (input.model !== QWEN_LOCAL_IMAGE_MODEL) throw new Error(`Qwen local không hỗ trợ model ${input.model}`);
  const runtime = window.qwenImage;
  if (!runtime) throw new Error('Qwen local chỉ chạy trong ứng dụng desktop');
  const current = await runtime.status();
  if (!current.installed) throw new Error('Hãy tải Qwen Image 2.1 trong Cài đặt trước');
  if (input.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const taskId = input.taskId || crypto.randomUUID();
  const sources = [input.baseImage?.source, ...(input.references || []).map((item) => item.source)]
    .filter((source): source is string => !!source);
  if (sources.length > 10) throw new Error('Qwen Image 2.1 hỗ trợ tối đa 10 ảnh tham chiếu');
  const references = await Promise.all(sources.map(async (source) => {
    const data = await readImageAsBase64(source);
    if (!data) throw new Error(`Không đọc được ảnh tham chiếu: ${source.slice(0, 80)}`);
    return data;
  }));
  const abort = () => { void runtime.cancel(taskId); };
  input.signal?.addEventListener('abort', abort, { once: true });
  let submitted = false;
  const offEvent = runtime.onEvent((event) => {
    if (event.kind !== 'generate' || event.taskId !== taskId || submitted || event.stage === 'queued') return;
    submitted = true;
    input.onSubmitted?.(Date.now());
  });
  try {
    return await runtime.generate({ taskId, prompt: input.prompt, aspectRatio: input.aspectRatio, references });
  } catch (error) {
    if (input.signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
    throw error;
  } finally {
    offEvent();
    input.signal?.removeEventListener('abort', abort);
  }
}

export function isQwenImageModel(model: string) { return model === QWEN_LOCAL_IMAGE_MODEL; }

export function imageModelChain(head: string, fallbacks: string[]): string[] {
  return isQwenImageModel(head) ? [head] : [head, ...fallbacks.filter((model) => model && model !== head && !isQwenImageModel(model))];
}

export function generateImageWithSelectedProvider(input: ImageGenerationInput): Promise<GenerationOutput> {
  if (isQwenImageModel(input.model)) return generateQwenLocalImage(input);
  return import('./google-flow-provider').then(({ googleFlowProvider }) => googleFlowProvider.generateImage(input));
}
