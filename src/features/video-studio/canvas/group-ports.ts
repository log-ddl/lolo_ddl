import { nodeSpec, type CanvasSpace, type PortType } from './types';
export interface GroupPort { id: string; nodeId: string; portId?: string; type: PortType; label: string; direction: 'source' | 'target' }
export function groupPorts(space: CanvasSpace, groupId: string): GroupPort[] {
  const members = space.nodes.filter((node) => node.groupId === groupId);
  return members.flatMap((node) => {
    const spec = nodeSpec(node); const label = node.name || `${node.kind} #${node.index}`;
    const ports: GroupPort[] = spec.inputs.filter((port) => port.multi || !space.edges.some((edge) => edge.target === node.id && edge.targetHandle === port.id && members.some((member) => member.id === edge.source))).map((port) => ({ id: `in:${node.id}:${port.id}`, nodeId: node.id, portId: port.id, type: port.type, label, direction: 'target' }));
    if (spec.output && (!space.edges.some((edge) => edge.source === node.id) || space.edges.some((edge) => edge.source === node.id && !members.some((member) => member.id === edge.target)))) ports.push({ id: `out:${node.id}`, nodeId: node.id, type: spec.output, label, direction: 'source' });
    return ports;
  });
}
export function expandConnection<T extends { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }>(connection: T): T {
  const [, source] = connection.sourceHandle?.startsWith('out:') ? connection.sourceHandle.split(':') : [];
  const [, target, port] = connection.targetHandle?.startsWith('in:') ? connection.targetHandle.split(':') : [];
  return { ...connection, source: source || connection.source, target: target || connection.target, sourceHandle: source ? 'out' : connection.sourceHandle, targetHandle: target ? port : connection.targetHandle };
}
