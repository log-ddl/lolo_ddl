import { validateSpace } from './validation';
import type { CanvasNodeState, CanvasSpace } from './types';

const MAX_JSON_BYTES = 16 * 1024 * 1024;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid workflow object');
  return value as Record<string, unknown>;
}

/** Accept a plain workflow or the JSON manifest shape used by .canvas exports.
 * JSON imports are templates: runtime results are never restored or executed. */
export function parseWorkflowJson(text: string): CanvasSpace {
  const document = object(JSON.parse(text.replace(/^\uFEFF/, '')));
  if (document.version !== undefined && document.version !== 1) throw new Error('Unsupported workflow version');
  if (document.assets !== undefined && (!Array.isArray(document.assets) || document.assets.length)) {
    throw new Error('Use a .canvas file to import bundled media');
  }
  const source = document.space === undefined ? document : object(document.space);
  if (!Array.isArray(source.nodes) || !Array.isArray(source.edges) || source.nodes.length > 1000 || source.edges.length > 5000) throw new Error('Invalid workflow nodes or edges');
  const counts = new Map<string, number>();
  const nodes = source.nodes.map((value, i) => {
    const raw = object(value);
    if (typeof raw.id !== 'string' || !raw.id.trim() || typeof raw.kind !== 'string') throw new Error('Each node requires an id and kind');
    const index = (counts.get(raw.kind) || 0) + 1;
    counts.set(raw.kind, index);
    const node = { ...raw, index: raw.index ?? index, position: raw.position ?? { x: (i % 4) * 360, y: Math.floor(i / 4) * 400 },
      prompt: raw.prompt ?? '', refs: raw.refs ?? [], model: raw.model ?? '', aspectRatio: raw.aspectRatio ?? '1:1', status: 'idle', stale: false,
    } as unknown as CanvasNodeState;
    for (const key of ['output', 'outputs', 'batchOutputs', 'batchProgress', 'textOutput', 'savedFiles', 'error', 'phase', 'phaseStartedAt', 'startedAt', 'accountEmail'] as const) delete node[key];
    if (!Number.isInteger(node.index) || node.index < 1) throw new Error('Invalid node index');
    // asset: URLs only have meaning when accompanied by binary archive data.
    const media = [...(Array.isArray(node.refs) ? node.refs : []), ...(node.valueType && node.valueType !== 'text' && Array.isArray(node.items) ? node.items : []), ...(node.selectedValue && node.valueType !== 'text' ? [node.selectedValue] : [])];
    if (media.some((url) => typeof url === 'string' && url.startsWith('asset:'))) throw new Error('Use a .canvas file to import bundled media');
    return node;
  });
  const now = Date.now();
  const space = { id: 'json-workflow', name: source.name ?? 'Imported workflow', nodes,
    edges: source.edges.map((value, i) => ({ ...object(value), id: object(value).id ?? `edge-${i + 1}` })),
    createdAt: now, updatedAt: now, ...(source.viewport === undefined ? {} : { viewport: source.viewport }),
  } as CanvasSpace;
  validateSpace(space);
  return space;
}

export async function importWorkflowJson(file: Blob): Promise<CanvasSpace> {
  if (file.size > MAX_JSON_BYTES) throw new Error('Workflow JSON exceeds 16 MB');
  return parseWorkflowJson(await file.text());
}
