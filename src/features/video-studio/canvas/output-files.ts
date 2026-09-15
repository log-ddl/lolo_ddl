import { mediaBlob } from './archive';
import { incomingEdges, nodeValues } from './graph';
import { nodeSpec, outputTypeOf, type CanvasSpace } from './types';
import { mediaFileStem } from './media-filename';
import { translate } from '@/shared/i18n';
import { useUIPreferencesStore } from '@/shared/stores/ui-preferences-store';

export function outputMedia(space: CanvasSpace, nodeId: string) {
  const seen = new Set<string>();
  return incomingEdges(space.edges, nodeId).flatMap((edge) => {
    const source = space.nodes.find((node) => node.id === edge.source);
    if (!source) return [];
    const kind = outputTypeOf(source);
    if (kind !== 'image' && kind !== 'video') return [];
    return nodeValues(space.nodes, space.edges, source.id).filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url); return true;
    }).map((url) => ({ url, kind, name: source.name || `${translate(useUIPreferencesStore.getState().uiLanguage, nodeSpec(source).labelKey)} #${source.index}` }));
  });
}

export async function saveOutputMedia(space: CanvasSpace, nodeId: string, directory: string, signal: AbortSignal | undefined, progress: (files: string[], total: number) => void) {
  if (!window.exportStorage?.writeFiles) throw new Error('OUTPUT_DESKTOP_REQUIRED');
  const media = outputMedia(space, nodeId);
  if (!media.length) throw new Error('INPUT_REQUIRED');
  const files: string[] = [];
  for (const item of media) {
    signal?.throwIfAborted();
    const blob = await mediaBlob(item.url);
    signal?.throwIfAborted();
    const mime = blob.type.split(';')[0].toLowerCase();
    const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
    const urlExt = item.url.split(/[?#]/)[0].match(/\.(png|jpe?g|webp|gif|avif|mp4|webm|mov)$/i)?.[1]?.toLowerCase();
    const extension = extensions[mime] || urlExt;
    if (!extension) throw new Error('OUTPUT_FORMAT_UNKNOWN');
    const filename = `${mediaFileStem(item.name)}.${extension}`;
    const data = await blob.arrayBuffer();
    signal?.throwIfAborted();
    const result = await window.exportStorage.writeFiles({ baseDir: directory, uniqueNames: true, files: [{ relativePath: filename, data }] });
    if (!result.success) throw new Error(result.error || 'OUTPUT_SAVE_FAILED');
    files.push(result.writtenFiles?.[0] || filename);
    progress([...files], media.length);
  }
}
