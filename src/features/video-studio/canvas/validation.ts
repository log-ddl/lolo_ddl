import { canConnect } from './graph';
import { NODE_SPECS, portSpec, type CanvasSpace, type CanvasNodeState, type CanvasEdgeState } from './types';

export function validateGraph(nodes: CanvasNodeState[], edges: CanvasEdgeState[]): void {
  if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length > 1000 || edges.length > 5000) throw new Error('Invalid graph size');
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || ids.has(node.id) || !Object.prototype.hasOwnProperty.call(NODE_SPECS, node.kind)) throw new Error('Invalid or duplicate node');
    ids.add(node.id);
    if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y) || typeof node.prompt !== 'string' || typeof node.model !== 'string' || typeof node.aspectRatio !== 'string' || !Array.isArray(node.refs) || node.refs.some((ref) => typeof ref !== 'string')) throw new Error('Invalid node fields');
    if (node.videoDuration !== undefined && ![4, 6, 8, 10].includes(node.videoDuration)) throw new Error('Invalid video duration');
    if (node.videoMode !== undefined && !['first', 'ref'].includes(node.videoMode)) throw new Error('Invalid video mode');
    if (node.promptIsFinal !== undefined && typeof node.promptIsFinal !== 'boolean') throw new Error('Invalid prompt mode');
    if (node.accountOwnerScopeId !== undefined && typeof node.accountOwnerScopeId !== 'string') throw new Error('Invalid account');
    if (node.accountLabel !== undefined && typeof node.accountLabel !== 'string') throw new Error('Invalid account label');
    if (node.name !== undefined && typeof node.name !== 'string') throw new Error('Invalid name');
    if (node.textOutput !== undefined && typeof node.textOutput !== 'string') throw new Error('Invalid AI output');
    if (node.aiAdapter !== undefined && !['claude', 'opencode', 'codex'].includes(node.aiAdapter)) throw new Error('Invalid AI adapter');
    if (node.outputDirectory !== undefined && typeof node.outputDirectory !== 'string') throw new Error('Invalid output directory');
    if (node.savedFiles !== undefined && (!Array.isArray(node.savedFiles) || node.savedFiles.some((file) => typeof file !== 'string'))) throw new Error('Invalid saved files');
    if (!Number.isInteger(node.index) || node.index < 1 || !['idle', 'running', 'done', 'failed'].includes(node.status) || typeof node.stale !== 'boolean') throw new Error('Invalid node state');
    if (node.outputs !== undefined && !Array.isArray(node.outputs)) throw new Error('Invalid media history');
    if (node.valueType !== undefined && !['text', 'image', 'video'].includes(node.valueType)) throw new Error('Invalid list type');
    if (node.kind === 'selectResult' && node.valueType === 'text') throw new Error('Result selection requires media');
    if (node.items !== undefined && (!Array.isArray(node.items) || node.items.length > 100 || node.items.some((item) => typeof item !== 'string'))) throw new Error('Invalid list');
    if (node.selectedItem !== undefined && (!Number.isInteger(node.selectedItem) || node.selectedItem < 0)) throw new Error('Invalid item selection');
    if (node.selectedValue !== undefined && typeof node.selectedValue !== 'string') throw new Error('Invalid selected value');
    if (node.batchOutputs !== undefined && (!Array.isArray(node.batchOutputs) || node.batchOutputs.length > 100)) throw new Error('Invalid batch outputs');
    for (const output of [...(node.outputs || []), ...(node.batchOutputs || []), ...(node.output ? [node.output] : [])]) {
      if (!output || !['image', 'video'].includes(output.kind) || typeof output.url !== 'string' || typeof output.model !== 'string' || !Number.isFinite(output.createdAt)) throw new Error('Invalid media');
    }
  }
  for (const node of nodes) if (node.groupId && (node.kind === 'group' || !nodes.some((group) => group.id === node.groupId && group.kind === 'group'))) throw new Error('Invalid group');
  const accepted: CanvasEdgeState[] = [];
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (!edge || typeof edge.id !== 'string' || edgeIds.has(edge.id) || !canConnect(nodes, accepted, edge)) throw new Error('Invalid connection');
    const port = portSpec(nodes.find((node) => node.id === edge.target)!, edge.targetHandle)!;
    if (!port.multi && accepted.some((item) => item.target === edge.target && item.targetHandle === edge.targetHandle)) throw new Error('Input already connected');
    edgeIds.add(edge.id); accepted.push(edge);
  }
}

export function validateSpace(space: CanvasSpace): void {
  if (!space || typeof space.name !== 'string') throw new Error('Invalid space');
  validateGraph(space.nodes, space.edges);
  if (space.viewport && (!Number.isFinite(space.viewport.x) || !Number.isFinite(space.viewport.y) || !Number.isFinite(space.viewport.zoom) || space.viewport.zoom < 0.2 || space.viewport.zoom > 1.8)) throw new Error('Invalid viewport');
}
