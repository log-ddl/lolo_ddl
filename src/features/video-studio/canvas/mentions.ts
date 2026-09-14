import { outputTypeOf, type CanvasNodeState, type CanvasEdgeState } from './types';
import { nodeValues } from './graph';
export const mentionPattern = /@\{(node_[\w-]+)\}/g;
export function mentionIds(value: string) { return [...new Set([...value.matchAll(mentionPattern)].map((m) => m[1]))]; }
export function remapMentions(value: string, ids: Map<string, string>) { return value.replace(mentionPattern, (token, id) => ids.has(id) ? `@{${ids.get(id)}}` : token); }
/** Mentions name existing inputs; they never create connections. */
export function connectedMentionNodes(nodes: CanvasNodeState[], edges: CanvasEdgeState[], targetId: string) {
  const sources = new Set(edges.filter((edge) => edge.target === targetId).map((edge) => edge.source));
  return nodes.filter((node) => sources.has(node.id));
}
export function expandMentions(value: string, nodes: CanvasNodeState[], edges: CanvasEdgeState[], images: string[], batchText: string[] = []) {
  return value.replace(mentionPattern, (_token, id) => {
    const source = nodes.find((n) => n.id === id);
    if (!source) throw new Error('INPUT_REQUIRED');
    const values = nodeValues(nodes, edges, id);
    if (!values.length) throw new Error('INPUT_REQUIRED');
    const name = source.name || `${source.kind} #${source.index}`;
    if (outputTypeOf(source) === 'text') { const text = source.kind === 'list' ? values.filter((value) => batchText.includes(value)) : values; if (!text.length) throw new Error('INPUT_REQUIRED'); return `${name}: ${text.join('\n')}`; }
    const positions = values.map((url) => images.indexOf(url) + 1).filter((n) => n > 0);
    if (!positions.length) throw new Error('INPUT_REQUIRED');
    return `${name} (reference image ${positions.join(', ')})`;
  });
}
export function referenceName(nodes: CanvasNodeState[], edges: CanvasEdgeState[], target: string, url: string) {
  const edge = edges.find((e) => e.target === target && nodeValues(nodes, edges, e.source).includes(url));
  const source = nodes.find((n) => n.id === edge?.source);
  return source ? source.name || `${source.kind}-${source.index}` : undefined;
}
