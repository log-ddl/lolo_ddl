import { getFeatureConfig } from '../lib/ai/feature-router';
import { useVideoStudioSettingsStore } from '../stores/video-studio-settings-store';
import { mediaBlob } from './archive';
import { effectivePrompt, nodeValues } from './graph';
import { outputTypeOf, type CanvasSpace, type CanvasNodeState } from './types';
import { expandMentions, mentionIds } from './mentions';

export async function runAiNode(space: CanvasSpace, node: CanvasNodeState, signal?: AbortSignal): Promise<string> {
  const runtime = window.cliRuntime;
  if (!runtime) throw new Error('AI_CLI_DESKTOP_REQUIRED');
  const edges = space.edges.filter((edge) => edge.target === node.id);
  if (mentionIds(node.prompt).some((id) => !edges.some((edge) => edge.source === id))) throw new Error('INPUT_REQUIRED');
  const texts: string[] = [], images = [...node.refs];
  for (const edge of edges) {
    const source = space.nodes.find((source) => source.id === edge.source)!;
    const values = nodeValues(space.nodes, space.edges, source.id);
    if (!values.length) throw new Error('INPUT_REQUIRED');
    if (outputTypeOf(source) === 'text') { if (!mentionIds(node.prompt).includes(source.id)) texts.push(...values); }
    else images.push(...values);
  }
  const refs = [...new Set(images)];
  if (refs.length > 8) throw new Error('AI_IMAGE_LIMIT');
  const prompt = expandMentions(effectivePrompt(node, texts), space.nodes, space.edges, refs, texts);
  if (!prompt.trim()) throw new Error('EMPTY_PROMPT');
  const attachments: string[] = [];
  for (const url of refs) {
    signal?.throwIfAborted();
    const blob = await mediaBlob(url).catch((error) => {
      throw new Error(`Không thể đọc hoặc tải ảnh đầu vào cho AI. Hãy tải ảnh về và đính kèm lại. ${error instanceof Error ? error.message : String(error)}`);
    });
    if (blob.size > 10_000_000) throw new Error('AI_IMAGE_LIMIT');
    attachments.push(await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
    }));
  }
  const settings = useVideoStudioSettingsStore.getState().cliRuntime;
  const config = getFeatureConfig('chat');
  const defaultAdapter = config?.cliAdapter || settings.adapter;
  const adapter = node.aiAdapter || defaultAdapter;
  const model = node.model || (adapter === defaultAdapter ? (config?.cliAdapter ? config.model : settings.model) : '');
  const requestId = crypto.randomUUID();
  const abort = () => { void runtime.cancelTextTask(requestId); };
  signal?.throwIfAborted();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const result = await runtime.runTextTask({
      adapter, model, requestId, images: attachments,
      prompt, systemPrompt: 'You are a text-processing node in a media canvas. Follow the user instruction using the supplied text and attached images. Return only the requested text, without tool logs or a preamble. Do not modify files, run commands, or take external actions. If you cannot inspect an image, say so instead of inventing its contents.',
      timeoutMs: config?.cliTimeoutMs || settings.timeoutMs,
      effort: adapter === defaultAdapter ? config?.cliEffort : undefined,
      enableContentMcp: false,
    });
    signal?.throwIfAborted();
    if (!result.success || !result.outputText?.trim()) throw new Error(result.error || 'AI_EMPTY_OUTPUT');
    return result.outputText.trim();
  } finally { signal?.removeEventListener('abort', abort); }
}
