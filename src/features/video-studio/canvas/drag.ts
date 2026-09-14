import type { CanvasNodeState } from './types';
export type NodeMove = { id: string; position: { x: number; y: number } };
export function groupDragMoves(nodes: CanvasNodeState[], moves: NodeMove[]): NodeMove[] {
  const result = new Map(moves.map((move) => [move.id, move]));
  for (const node of nodes) {
    if (!node.groupId || result.has(node.id)) continue;
    const move = moves.find((move) => move.id === node.groupId);
    const group = move && nodes.find((group) => group.id === node.groupId);
    if (move && group) result.set(node.id, { id: node.id, position: { x: node.position.x + move.position.x - group.position.x, y: node.position.y + move.position.y - group.position.y } });
  }
  return [...result.values()];
}
