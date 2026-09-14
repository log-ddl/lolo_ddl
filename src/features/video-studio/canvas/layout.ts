import type { CanvasSpace } from './types';

/** Layout selected units only. A group moves with its children as one unit. */
export function arrangeNodes(space: CanvasSpace, selected: string[]) {
  const requested = new Set(selected.length ? selected : space.nodes.map((node) => node.id));
  const units = space.nodes.filter((node) => requested.has(node.id) && (!node.groupId || !requested.has(node.groupId)));
  if (!units.length) return [];
  const unitId = (id: string) => { const node = space.nodes.find((node) => node.id === id); return node?.groupId && units.some((unit) => unit.id === node.groupId) ? node.groupId : id; };
  const ranks = new Map<string, number>();
  const visit = (id: string, seen = new Set<string>()): number => {
    if (ranks.has(id)) return ranks.get(id)!;
    if (seen.has(id)) return 0;
    const upstream = space.edges.filter((edge) => unitId(edge.target) === id && unitId(edge.source) !== id).map((edge) => unitId(edge.source)).filter((id) => units.some((unit) => unit.id === id));
    const rank = upstream.length ? 1 + Math.max(...upstream.map((parent) => visit(parent, new Set(seen).add(id)))) : 0;
    ranks.set(id, rank); return rank;
  };
  units.forEach((node) => visit(node.id));
  const widths = new Map<number, number>();
  for (const node of units) widths.set(ranks.get(node.id)!, Math.max(widths.get(ranks.get(node.id)!) || 0, node.kind === 'group' && !node.collapsed ? node.width || 320 : 280));
  const startX = Math.min(...units.map((node) => node.position.x));
  const startY = Math.min(...units.map((node) => node.position.y));
  const rows = new Map<number, number>();
  const fixed = space.nodes.filter((node) => node.kind !== 'group' && !units.some((unit) => unit.id === node.id || unit.id === node.groupId));
  return units.sort((a, b) => a.position.y - b.position.y).map((node) => {
    const rank = ranks.get(node.id)!;
    const position = { x: startX + [...widths].filter(([r]) => r < rank).reduce((sum, [, w]) => sum + w + 110, 0), y: rows.get(rank) || startY };
    const width = node.kind === 'group' && !node.collapsed ? node.width || 320 : 280;
    const height = node.kind === 'group' && !node.collapsed ? node.height || 360 : 360;
    for (let attempt = 0; attempt <= fixed.length; attempt++) {
      const collisions = fixed.filter((other) => position.x < other.position.x + 320 && position.x + width + 40 > other.position.x && position.y < other.position.y + 400 && position.y + height + 40 > other.position.y);
      if (!collisions.length) break;
      position.y = Math.max(...collisions.map((other) => other.position.y + 440));
    }
    rows.set(rank, position.y + (node.kind === 'group' && !node.collapsed ? node.height || 360 : 360) + 80);
    return { id: node.id, position };
  });
}
