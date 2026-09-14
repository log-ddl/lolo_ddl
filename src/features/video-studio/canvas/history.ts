import type { CanvasSpace } from './types';
import { descendants } from './graph';

export interface CanvasEdit { before: CanvasSpace; after: CanvasSpace }

/** Replay only fields changed by the edit, preserving later generation results. */
export function replayEdit(current: CanvasSpace, edit: CanvasEdit, undo: boolean): CanvasSpace {
  const from = undo ? edit.after : edit.before;
  const to = undo ? edit.before : edit.after;
  const invalidated = new Set<string>();
  const nodes = current.nodes.filter((node) => !from.nodes.some((n) => n.id === node.id) || to.nodes.some((n) => n.id === node.id));
  for (const target of to.nodes) {
    const source = from.nodes.find((node) => node.id === target.id);
    const index = nodes.findIndex((node) => node.id === target.id);
    if (!source) {
      if (index < 0) nodes.push({ ...target, status: target.status === 'running' ? 'idle' : target.status });
      continue;
    }
    if (index < 0) continue;
    const patch: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(source), ...Object.keys(target)])) {
      if (JSON.stringify(source[key as keyof typeof source]) !== JSON.stringify(target[key as keyof typeof target])) {
        patch[key] = target[key as keyof typeof target];
      }
    }
    nodes[index] = { ...nodes[index], ...patch };
    // A result generated after an input edit must not become silently reusable on undo.
    if (['prompt', 'refs', 'model', 'videoDuration', 'videoMode', 'aspectRatio', 'items', 'valueType', 'selectedValue', 'selectedItem'].some((key) => key in patch) && nodes[index].output) nodes[index] = { ...nodes[index], stale: true };
    if (['prompt', 'refs', 'model', 'videoDuration', 'videoMode', 'aspectRatio', 'output', 'items', 'valueType', 'selectedValue', 'selectedItem'].some((key) => key in patch)) {
      for (const id of descendants([...from.edges, ...to.edges], target.id)) invalidated.add(id);
    }
  }
  const edges = current.edges.filter((edge) => !from.edges.some((e) => e.id === edge.id) || to.edges.some((e) => e.id === edge.id));
  for (const edge of to.edges) if (!from.edges.some((e) => e.id === edge.id) && !edges.some((e) => e.id === edge.id)) edges.push(edge);
  for (const edge of [...from.edges, ...to.edges]) {
    if (from.edges.some((e) => e.id === edge.id) === to.edges.some((e) => e.id === edge.id)) continue;
    invalidated.add(edge.target);
    for (const id of descendants(edges, edge.target)) invalidated.add(id);
  }
  return { ...current, name: from.name !== to.name ? to.name : current.name,
    nodes: nodes.map((node) => ({ ...node, groupId: node.groupId && !nodes.some((group) => group.id === node.groupId) ? undefined : node.groupId, stale: invalidated.has(node.id) && node.output ? true : node.stale })), edges, updatedAt: Date.now() };
}
