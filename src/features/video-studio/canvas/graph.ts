/**
 * Graph maths for the canvas: what may connect, what feeds what, and what goes
 * stale when something changes. Pure functions over plain arrays — the store
 * owns the state, the runner owns the side effects, this file owns neither.
 */

import {
  outputTypeOf,
  portSpec,
  isGenerator,
  type CanvasEdgeState,
  type CanvasNodeState,
} from './types';

export function nodeById(nodes: CanvasNodeState[], id: string): CanvasNodeState | undefined {
  return nodes.find((node) => node.id === id);
}

/**
 * A wire is legal when the source hands over the type the target port takes,
 * and when it does not close a loop. Both checks matter: a cycle would make
 * `upstreamOrder` recurse forever and there is no UI affordance to break one.
 */
export function canConnect(
  nodes: CanvasNodeState[],
  edges: CanvasEdgeState[],
  connection: { source: string; target: string; targetHandle?: string | null },
): boolean {
  const { source, target, targetHandle } = connection;
  if (!source || !target || source === target || !targetHandle) return false;
  const sourceNode = nodeById(nodes, source);
  const targetNode = nodeById(nodes, target);
  if (!sourceNode || !targetNode) return false;
  const produced = outputTypeOf(sourceNode);
  const port = portSpec(targetNode, targetHandle);
  if (!produced || !port || !(port.accepts || [port.type]).includes(produced)) return false;
  return !wouldCycle(edges, source, target);
}

/** True when wiring source → target makes target reachable from itself. */
function wouldCycle(edges: CanvasEdgeState[], source: string, target: string): boolean {
  if (source === target) return true;
  const seen = new Set<string>();
  const stack = [source];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === target) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const edge of edges) {
      if (edge.target === current) stack.push(edge.source);
    }
  }
  return false;
}

export function incomingEdges(edges: CanvasEdgeState[], nodeId: string): CanvasEdgeState[] {
  return edges.filter((edge) => edge.target === nodeId);
}

/**
 * Every ancestor of `nodeId`, upstream-first. The runner walks this list before
 * touching the node itself, so a node never generates from a missing input.
 */
export function upstreamOrder(
  nodes: CanvasNodeState[],
  edges: CanvasEdgeState[],
  nodeId: string,
): string[] {
  const order: string[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string) => {
    if (state.get(id) === 'done' || state.get(id) === 'visiting') return;
    state.set(id, 'visiting');
    for (const edge of incomingEdges(edges, id)) visit(edge.source);
    state.set(id, 'done');
    if (id !== nodeId) order.push(id);
  };

  visit(nodeId);
  return order.filter((id) => nodeById(nodes, id));
}

/** Every node downstream of `nodeId`. Used to spread staleness after an edit. */
export function descendants(edges: CanvasEdgeState[], nodeId: string): string[] {
  const found = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const edge of edges) {
      if (edge.source !== current || found.has(edge.target)) continue;
      found.add(edge.target);
      stack.push(edge.target);
    }
  }
  return [...found];
}

export interface ResolvedInputs {
  batches: { port: string; values: string[]; text: boolean }[];
  /** Text arriving on the `prompt` port, in wire order. */
  promptParts: string[];
  /** Media URLs per port id, in wire order. Ports with no wire are absent. */
  mediaByPort: Record<string, string[]>;
  /** Ancestors that were expected to carry media but have no output yet. */
  missing: string[];
}

/**
 * Read what actually arrives at a node's ports from the last run of its
 * ancestors. Text nodes carry their value in `prompt`, generator nodes carry
 * theirs in `output.url`.
 */
export function resolveInputs(
  nodes: CanvasNodeState[],
  edges: CanvasEdgeState[],
  nodeId: string,
): ResolvedInputs {
  const promptParts: string[] = [];
  const mediaByPort: Record<string, string[]> = {};
  const missing: string[] = [];
  const batches: ResolvedInputs['batches'] = [];

  for (const edge of incomingEdges(edges, nodeId)) {
    const source = nodeById(nodes, edge.source);
    if (!source) continue;
    const referencePrompt = source.kind === 'reference' ? source.prompt.trim() : '';
    if (referencePrompt) promptParts.push(referencePrompt);
    const values = nodeValues(nodes, edges, source.id);
    if (!values.length) {
      if (referencePrompt) continue;
      missing.push(source.id);
      continue;
    }
    const text = outputTypeOf(source) === 'text';
    if (source.kind === 'list' || (isGenerator(source.kind) && (source.batchOutputs?.length || 0) > 1)) batches.push({ port: edge.targetHandle, values, text });
    else if (text) { if (!nodes.find((node) => node.id === nodeId)?.prompt.includes(`@{${source.id}}`)) promptParts.push(...values); }
    else (mediaByPort[edge.targetHandle] ||= []).push(...values);
  }

  return { promptParts, mediaByPort, missing, batches };
}

/** Utility values are resolved from their live sources; no duplicated media state. */
export function nodeValues(nodes: CanvasNodeState[], edges: CanvasEdgeState[], id: string, seen = new Set<string>()): string[] {
  if (seen.has(id)) return [];
  const node = nodeById(nodes, id);
  if (!node) return [];
  const next = new Set(seen).add(id);
  if (node.kind === 'text') return node.prompt.trim() ? [node.prompt.trim()] : [];
  if (node.kind === 'ai') return node.textOutput?.trim() ? [node.textOutput] : [];
  if (['list', 'router', 'selectResult', 'reference'].includes(node.kind)) {
    const upstream = incomingEdges(edges, id).flatMap((edge) => {
      const source = nodeById(nodes, edge.source);
      if (node.kind === 'selectResult' && source?.outputs?.length) return source.outputs.map((output) => output.url);
      return nodeValues(nodes, edges, edge.source, next);
    });
    const all = node.kind === 'reference' ? [...node.refs, ...upstream] : [...(node.items || []), ...upstream];
    if (node.kind === 'router' || node.kind === 'selectResult') {
      const value = node.selectedValue ? all.find((value) => value === node.selectedValue) : all[node.selectedItem || 0];
      return value ? [value] : [];
    }
    return all;
  }
  return node.batchOutputs?.length ? node.batchOutputs.map((output) => output.url) : node.output?.url ? [node.output.url] : [];
}

export function resolvedRuns(input: ResolvedInputs): { promptParts: string[]; mediaByPort: Record<string, string[]> }[] {
  const count = Math.max(1, ...input.batches.map((batch) => batch.values.length));
  if (count > 100 || input.batches.some((batch) => batch.values.length !== 1 && batch.values.length !== count)) throw new Error('LIST_LENGTH_MISMATCH');
  return Array.from({ length: count }, (_, index) => {
    const promptParts = [...input.promptParts];
    const mediaByPort = Object.fromEntries(Object.entries(input.mediaByPort).map(([key, values]) => [key, [...values]]));
    for (const batch of input.batches) {
      const value = batch.values[batch.values.length === 1 ? 0 : index];
      if (batch.text) promptParts.push(value); else (mediaByPort[batch.port] ||= []).push(value);
    }
    return { promptParts, mediaByPort };
  });
}

export function nodeCandidates(nodes: CanvasNodeState[], edges: CanvasEdgeState[], node: CanvasNodeState): string[] {
  return [...(node.kind === 'reference' ? node.refs : node.items || []), ...incomingEdges(edges, node.id).flatMap((edge) => {
    const source = nodeById(nodes, edge.source);
    return node.kind === 'selectResult' && source?.outputs?.length ? source.outputs.map((output) => output.url) : nodeValues(nodes, edges, edge.source);
  })];
}

/**
 * The prompt a generator node actually sends: text wired in first, then the
 * node's own box. Both are kept rather than one overriding the other, so a
 * shared Text node can hold the style while each node adds its own subject.
 */
export function effectivePrompt(node: CanvasNodeState, promptParts: string[]): string {
  if (node.promptIsFinal) return node.prompt.trim();
  return [...promptParts, node.prompt.trim()].filter((part) => part.length > 0).join('\n');
}
