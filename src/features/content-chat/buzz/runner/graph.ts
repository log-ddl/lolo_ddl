import {
  type BuzzConnection,
  type BuzzFunctionNode,
  type BuzzInputNode,
  type BuzzPipeline,
  type BuzzRunInputManifest,
  type BuzzStep,
} from '../types';

/**
 * Static analysis of a pipeline graph: execution order, which agents feed a
 * given node, and the validation that rejects cycles or unreachable steps
 * before anything is spawned.
 */

export function orderedAgentSteps(pipeline: BuzzPipeline): BuzzStep[] {
  const inputIds = (pipeline.inputNodes ?? []).map((node) => node.id);
  const functionIds = (pipeline.functionNodes ?? []).map((node) => node.id);
  const stepIds = pipeline.steps.map((step) => step.id);
  const ids = [...inputIds, ...functionIds, ...stepIds];
  const known = new Set(ids);
  const connections = (pipeline.connections ?? []).filter((item) => !item.loop && known.has(item.source) && known.has(item.target));
  const incoming = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const connection of connections) {
    incoming.set(connection.target, (incoming.get(connection.target) ?? 0) + 1);
    outgoing.set(connection.source, [...(outgoing.get(connection.source) ?? []), connection.target]);
  }
  const queue = ids.filter((id) => (incoming.get(id) ?? 0) === 0);
  const ordered: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const target of outgoing.get(id) ?? []) {
      const count = (incoming.get(target) ?? 1) - 1;
      incoming.set(target, count);
      if (count === 0) queue.push(target);
    }
  }
  for (const id of ids) if (!ordered.includes(id)) ordered.push(id);
  const byId = new Map(pipeline.steps.map((step) => [step.id, step]));
  return ordered.map((id) => byId.get(id)).filter((step): step is BuzzStep => Boolean(step));
}

export function upstreamAgentIds(pipeline: BuzzPipeline, targetId: string): Set<string> {
  const incoming = new Map<string, string[]>()
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue
    incoming.set(connection.target, [...(incoming.get(connection.target) ?? []), connection.source])
  }
  const agentIds = new Set(pipeline.steps.map((step) => step.id))
  const result = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    for (const source of incoming.get(id) ?? []) {
      if (agentIds.has(source)) result.add(source)
      visit(source)
    }
  }
  visit(targetId)
  return result
}

export function resolveGraphInputs(
  pipeline: BuzzPipeline,
  targetId: string,
  runTopic: string,
  stepOutputs: Map<string, string>,
  inputManifest: Map<string, BuzzRunInputManifest>,
): { files: string[]; texts: Array<{ name: string; value: string }>; values: Record<string, string>; manifests: BuzzRunInputManifest[] } {
  const connections: BuzzConnection[] = pipeline.connections ?? [];
  const inputs = new Map<string, BuzzInputNode>((pipeline.inputNodes ?? []).map((node) => [node.id, node]));
  const functions = new Map((pipeline.functionNodes ?? []).map((node) => [node.id, node]));
  const steps = new Map(pipeline.steps.map((step) => [step.id, step]));
  const files: string[] = [];
  const texts: Array<{ name: string; value: string }> = [];
  const values: Record<string, string> = {};
  const manifests: BuzzRunInputManifest[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const input = inputs.get(id);
    if (input) {
      if (input.kind === 'text') {
        const value = input.value.trim() || runTopic.trim();
        if (value) {
          texts.push({ name: input.name || 'Text', value });
          values[input.id] = value;
        }
      } else if (input.path.trim()) {
        const manifest = inputManifest.get(input.id)
        const value = manifest?.resolvedPath ?? input.path.trim();
        files.push(value);
        values[input.id] = value;
        if (manifest) manifests.push(manifest)
      }
      return;
    }
    const sourceStep = steps.get(id);
    if (sourceStep) {
      const outputKind = sourceStep.outputKind ?? (sourceStep.outputFile.trim() ? 'file' : 'text');
      const runtimeOutput = stepOutputs.get(sourceStep.id)?.trim() ?? '';
      if (outputKind === 'text' && runtimeOutput) {
        texts.push({ name: sourceStep.name || 'Agent', value: runtimeOutput });
        values[sourceStep.id] = runtimeOutput;
      } else if (sourceStep.outputFile.trim() && stepOutputs.has(sourceStep.id)) {
        const value = sourceStep.outputFile.trim();
        files.push(value);
        values[sourceStep.id] = value;
      } else if (runtimeOutput) {
        texts.push({ name: sourceStep.name || 'Agent', value: runtimeOutput });
        values[sourceStep.id] = runtimeOutput;
      }
      return;
    }
    if (functions.has(id)) {
      const runtimeOutput = stepOutputs.get(id)?.trim()
      if (runtimeOutput) values[id] = runtimeOutput
      for (const connection of connections) if (connection.target === id) visit(connection.source);
    }
  };

  for (const connection of connections) if (connection.target === targetId) visit(connection.source);
  return { files: [...new Set(files)], texts, values, manifests: [...new Map(manifests.map((item) => [item.nodeId, item])).values()] };
}

export function parseJsonCandidate(raw: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)?.[1]
  const candidate = (fenced ?? raw).trim()
  if (!candidate) return undefined
  try { return JSON.parse(candidate) } catch { /* thử tiếp bên dưới */ }
  // Agent hay kèm lời dẫn quanh JSON — bóc khối {...} hoặc [...] ngoài cùng rồi parse lại.
  const start = candidate.search(/[{[]/)
  if (start >= 0) {
    const end = candidate.lastIndexOf(candidate[start] === '{' ? '}' : ']')
    if (end > start) {
      try { return JSON.parse(candidate.slice(start, end + 1)) } catch { return undefined }
    }
  }
  return undefined
}

export function readObjectPath(value: unknown, field: string): unknown {
  if (!field.trim()) return value
  let current = value
  for (const part of field.trim().split('.').filter(Boolean)) {
    if (!current || typeof current !== 'object' || !(part in current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function parseComparable(value: string): unknown {
  const trimmed = value.trim()
  if (/^(true|false|null)$/i.test(trimmed)) return JSON.parse(trimmed.toLowerCase())
  if (trimmed !== '' && Number.isFinite(Number(trimmed))) return Number(trimmed)
  return trimmed
}

export function isTruthyValue(value: unknown): boolean {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized || ['false', '0', 'no', 'fail', 'null', 'undefined'].includes(normalized)) return false
  }
  return Boolean(value)
}

export function evaluateConditionNode(node: BuzzFunctionNode, rawInput: string): { passed: boolean; value: unknown } {
  const parsed = parseJsonCandidate(rawInput)
  const source = node.field?.trim() ? parsed : (parsed ?? rawInput)
  const value = readObjectPath(source, node.field ?? '')
  const expected = parseComparable(node.compareValue ?? '')
  const operator = node.operator ?? 'truthy'
  switch (operator) {
    case 'exists': return { passed: value !== undefined && value !== null, value }
    case 'truthy': return { passed: isTruthyValue(value), value }
    case 'equals': return { passed: value === expected || String(value) === String(expected), value }
    case 'notEquals': return { passed: !(value === expected || String(value) === String(expected)), value }
    case 'contains': return { passed: String(value ?? '').includes(String(expected ?? '')), value }
    case 'notContains': return { passed: !String(value ?? '').includes(String(expected ?? '')), value }
    case 'regex': {
      try { return { passed: new RegExp(String(expected ?? ''), 'i').test(String(value ?? '')), value } }
      catch { throw new Error(`Regex không hợp lệ trong node “${node.name}”.`) }
    }
    case 'gt': return { passed: Number(value) > Number(expected), value }
    case 'gte': return { passed: Number(value) >= Number(expected), value }
    case 'lt': return { passed: Number(value) < Number(expected), value }
    case 'lte': return { passed: Number(value) <= Number(expected), value }
    default: return { passed: false, value }
  }
}

export function executionRoots(pipeline: BuzzPipeline): string[] {
  const executableIds = new Set([
    ...pipeline.steps.map((step) => step.id),
    ...(pipeline.functionNodes ?? []).map((node) => node.id),
  ])
  const inputIds = new Set((pipeline.inputNodes ?? []).map((node) => node.id))
  const roots: string[] = []
  for (const connection of pipeline.connections ?? []) {
    if (inputIds.has(connection.source) && executableIds.has(connection.target) && !roots.includes(connection.target)) roots.push(connection.target)
  }
  for (const id of executableIds) {
    const hasForwardIncoming = (pipeline.connections ?? []).some((connection) => connection.target === id
      && !connection.loop
      && (executableIds.has(connection.source) || inputIds.has(connection.source)))
    if (!hasForwardIncoming && !roots.includes(id)) roots.push(id)
  }
  return roots
}

export function validateControlFlow(pipeline: BuzzPipeline): void {
  const nodeIds = new Set([
    ...(pipeline.inputNodes ?? []).map((node) => node.id),
    ...(pipeline.functionNodes ?? []).map((node) => node.id),
    ...pipeline.steps.map((step) => step.id),
  ])
  for (const connection of pipeline.connections ?? []) {
    if (!nodeIds.has(connection.source) || !nodeIds.has(connection.target)) throw new Error('Workflow có dây nối tới node không còn tồn tại.')
  }
  for (const node of pipeline.functionNodes ?? []) {
    const outgoing = (pipeline.connections ?? []).filter((connection) => connection.source === node.id)
    if (node.kind === 'condition') {
      if (outgoing.some((connection) => connection.sourceHandle !== 'true' && connection.sourceHandle !== 'false')) throw new Error(`Dây ra khỏi node “${node.name}” phải dùng cổng Đúng hoặc Sai.`)
    }
    if (node.kind === 'loop') {
      if (outgoing.some((connection) => connection.sourceHandle !== 'loop' && connection.sourceHandle !== 'done')) throw new Error(`Dây ra khỏi node “${node.name}” phải dùng cổng Lặp hoặc Xong.`)
    }
  }

  const forwardOutgoing = new Map<string, string[]>()
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue
    forwardOutgoing.set(connection.source, [...(forwardOutgoing.get(connection.source) ?? []), connection.target])
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error('Workflow có vòng lặp không đi qua cổng điều khiển If/Loop.')
    if (visited.has(id)) return
    visiting.add(id)
    for (const target of forwardOutgoing.get(id) ?? []) visit(target)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of nodeIds) visit(id)
}

