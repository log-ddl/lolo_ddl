import { readImageAsBase64 } from '../lib/image-storage';
import { isIdbImagePath, readBlobFromBrowserStorage, saveBlobToBrowserStorage, deleteFromBrowserStorage } from '../lib/browser-image-storage';
import { validateSpace } from './validation';
import type { CanvasSpace } from './types';

export async function mediaBlob(url: string): Promise<Blob> {
  if (isIdbImagePath(url)) {
    const blob = await readBlobFromBrowserStorage(url);
    if (!blob) throw new Error('Media file is missing');
    return blob;
  }
  if (/^(local-image|file):/.test(url)) {
    const data = await readImageAsBase64(url);
    if (!data) throw new Error('Cannot read local media');
    return (await fetch(data)).blob();
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot read media (${response.status})`);
  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function mapMedia(space: CanvasSpace, map: (url: string) => string): CanvasSpace {
  return { ...space, nodes: space.nodes.map((node) => ({ ...node, refs: node.refs.map(map),
    items: node.valueType && node.valueType !== 'text' ? node.items?.map(map) : node.items,
    selectedValue: node.selectedValue && node.valueType !== 'text' && (node.valueType || node.kind === 'selectResult') ? map(node.selectedValue) : node.selectedValue,
    output: node.output ? { ...node.output, url: map(node.output.url) } : undefined,
    outputs: node.outputs?.map((output) => ({ ...output, url: map(output.url) })),
    batchOutputs: node.batchOutputs?.map((output) => ({ ...output, url: map(output.url) })),
  })) };
}

/** Binary bundle: magic + manifest length + JSON manifest + raw media blobs. */
export async function exportSpace(space: CanvasSpace, progress: (done: number, total: number) => void): Promise<Blob> {
  const sources = new Map<string, string>();
  const graph = mapMedia(space, (url) => { if (!sources.has(url)) sources.set(url, `asset:${sources.size}`); return sources.get(url)!; });
  const blobs: Blob[] = [];
  const assets: { id: string; offset: number; size: number; type: string }[] = [];
  let offset = 0;
  for (const [url, id] of sources) {
    const blob = await mediaBlob(url);
    assets.push({ id, offset, size: blob.size, type: blob.type }); offset += blob.size; blobs.push(blob);
    progress(blobs.length, sources.size);
  }
  const manifest = new TextEncoder().encode(JSON.stringify({ version: 1, space: graph, assets }));
  const prefix = new Uint8Array(12); prefix.set(new TextEncoder().encode('CANVAS01')); new DataView(prefix.buffer).setUint32(8, manifest.byteLength, true);
  return new Blob([prefix, manifest, ...blobs], { type: 'application/octet-stream' });
}

export async function importSpaceArchive(file: File, progress: (done: number, total: number) => void): Promise<CanvasSpace> {
  const prefix = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (prefix.length !== 12 || new TextDecoder().decode(prefix.slice(0, 8)) !== 'CANVAS01') throw new Error('Invalid .canvas file');
  const length = new DataView(prefix.buffer).getUint32(8, true);
  if (length > 16 * 1024 * 1024 || length + 12 > file.size) throw new Error('Invalid manifest size');
  const manifest = JSON.parse(await file.slice(12, 12 + length).text());
  if (manifest.version !== 1 || !Array.isArray(manifest.assets)) throw new Error('Unsupported archive version');
  validateSpace(manifest.space);
  const base = 12 + length;
  const known = new Set<string>();
  for (const asset of manifest.assets) {
    if (typeof asset.id !== 'string' || known.has(asset.id) || !Number.isSafeInteger(asset.offset) || !Number.isSafeInteger(asset.size) || asset.offset < 0 || asset.size < 0 || base + asset.offset + asset.size > file.size || typeof asset.type !== 'string') throw new Error('Invalid asset');
    known.add(asset.id);
  }
  mapMedia(manifest.space, (id) => { if (!known.has(id)) throw new Error('Missing asset'); return id; });
  const urls = new Map<string, string>();
  try {
    for (const asset of manifest.assets) {
      const blob = file.slice(base + asset.offset, base + asset.offset + asset.size, asset.type);
      urls.set(asset.id, await saveBlobToBrowserStorage(blob, asset.id.replace(':', '-')));
      progress(urls.size, manifest.assets.length);
    }
    return mapMedia(manifest.space, (id) => urls.get(id)!);
  } catch (error) {
    await Promise.allSettled([...urls.values()].map(deleteFromBrowserStorage)); throw error;
  }
}
