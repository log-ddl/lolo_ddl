import {
  type BuzzAgent,
  type BuzzConnection,
  type BuzzPipeline,
  type BuzzRunInputManifest,
  type BuzzStep,
} from '../types';

/**
 * Fingerprints and prompt assembly.
 *
 * A run is only reusable when the pipeline, its agents and every input file are
 * byte-identical, so each of those is hashed into a stable fingerprint. The
 * handoff block is the text an agent actually receives about its upstream work.
 */


export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}\n…(đã cắt bớt)` : value;
}

export function stableFingerprint(value: unknown): string {
  const input = JSON.stringify(value)
  let first = 0x811c9dc5
  let second = 0x9e3779b9
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193)
    second = Math.imul(second ^ code, 0x85ebca6b)
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`
}

export async function prepareRunInputManifest(pipeline: BuzzPipeline, workspacePath: string | null): Promise<BuzzRunInputManifest[]> {
  const connectedSources = new Set((pipeline.connections ?? []).map((connection) => connection.source))
  const pathInputs = (pipeline.inputNodes ?? [])
    .filter((input) => input.kind !== 'text' && input.path.trim() && connectedSources.has(input.id))
    .map((input) => ({ id: input.id, name: input.name, kind: input.kind as 'file' | 'folder', path: input.path.trim() }))
  if (pathInputs.length === 0) return []
  if (!window.contentWorkspace?.prepareBuzzInputs) throw new Error('Runtime hiện tại chưa hỗ trợ quét file/folder đầu vào.')
  return window.contentWorkspace.prepareBuzzInputs(workspacePath, pathInputs)
}

export function createPipelineFingerprint(pipeline: BuzzPipeline, agents: BuzzAgent[], manifest: BuzzRunInputManifest[]): string {
  const usedAgentIds = new Set(pipeline.steps.flatMap((step) => [step.agentId, step.gate.judgeAgentId]).filter(Boolean))
  return stableFingerprint({
    pipelineId: pipeline.id,
    workspacePath: pipeline.workspacePath,
    inputs: (pipeline.inputNodes ?? []).map(({ id, kind, name, value, path }) => ({ id, kind, name, value, path })),
    inputArtifacts: manifest.map(({ nodeId, fingerprint, resolvedPath }) => ({ nodeId, fingerprint, resolvedPath })),
    functions: (pipeline.functionNodes ?? []).map(({ id, kind, name, field, operator, compareValue, maxIterations }) => ({ id, kind, name, field, operator, compareValue, maxIterations })),
    connections: (pipeline.connections ?? []).map(({ source, target, sourceHandle, loop }) => ({ source, target, sourceHandle, loop })),
    steps: pipeline.steps.map(({ position: _position, gate, ...step }) => ({ ...step, gate: { ...gate, position: undefined } })),
    agents: agents.filter((agent) => usedAgentIds.has(agent.id)).map(({ updatedAt: _updatedAt, createdAt: _createdAt, ...agent }) => agent),
  })
}

/**
 * Fingerprint theo CHUỖI của từng node: băm config của node + đệ quy upstream
 * của chính nó (bỏ qua dây loop). Dùng để quyết định seed khi chạy lẻ một node —
 * kết quả cũ của node X còn giá trị chừng nào X và upstream của X chưa đổi;
 * sửa một node không liên quan thì không làm mất seed như fingerprint toàn pipeline.
 */
export function createNodeFingerprints(pipeline: BuzzPipeline, agents: BuzzAgent[], manifest: BuzzRunInputManifest[]): Map<string, string> {
  const manifestByNode = new Map(manifest.map((item) => [item.nodeId, item.fingerprint]))
  const incoming = new Map<string, BuzzConnection[]>()
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue
    incoming.set(connection.target, [...(incoming.get(connection.target) ?? []), connection])
  }
  const inputsById = new Map((pipeline.inputNodes ?? []).map((node) => [node.id, node]))
  const functionsById = new Map((pipeline.functionNodes ?? []).map((node) => [node.id, node]))
  const stepsById = new Map(pipeline.steps.map((step) => [step.id, step]))
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))
  const memo = new Map<string, string>()
  const visit = (id: string, trail: Set<string>): string => {
    const cached = memo.get(id)
    if (cached) return cached
    if (trail.has(id)) return 'cycle'
    trail.add(id)
    const sources = (incoming.get(id) ?? [])
      .map((connection) => `${visit(connection.source, trail)}:${connection.sourceHandle ?? ''}`)
      .sort()
    trail.delete(id)
    const input = inputsById.get(id)
    const fn = functionsById.get(id)
    const step = stepsById.get(id)
    const payload = input
      ? { kind: input.kind, name: input.name, value: input.value, path: input.path, artifact: manifestByNode.get(id) ?? '' }
      : fn
        ? { kind: fn.kind, name: fn.name, field: fn.field, operator: fn.operator, compareValue: fn.compareValue, maxIterations: fn.maxIterations, sources }
        : step
          ? (() => {
            const { position: _position, gate: _gate, ...config } = step
            const agent = agentsById.get(step.agentId)
            return {
              ...config,
              agent: agent ? { name: agent.name, adapter: agent.adapter, model: agent.model, effort: agent.effort, systemPrompt: agent.systemPrompt } : null,
              sources,
            }
          })()
          : { missing: id }
    const fingerprint = stableFingerprint(payload)
    memo.set(id, fingerprint)
    return fingerprint
  }
  for (const id of [...inputsById.keys(), ...functionsById.keys(), ...stepsById.keys()]) visit(id, new Set())
  return memo
}

/** Thay biến trong prompt template. */
export function renderPrompt(
  template: string,
  vars: { topic: string; input: string; output: string; feedback: string },
): string {
  return template
    .replace(/\{\{\s*topic\s*\}\}/g, vars.topic)
    .replace(/\{\{\s*input\s*\}\}/g, vars.input)
    .replace(/\{\{\s*output\s*\}\}/g, vars.output)
    .replace(/\{\{\s*feedback\s*\}\}/g, vars.feedback);
}

export async function readArtifact(workspacePath: string | null, file: string): Promise<string | null> {
  if (!window.contentWorkspace || !file.trim()) return null;
  try {
    const result = await window.contentWorkspace.previewFile(workspacePath, file);
    if (result.kind !== 'text' || typeof result.content !== 'string') return null;
    return result.content;
  } catch {
    return null;
  }
}

export function buildHandoffBlock(step: BuzzStep, inputFiles: string[], inputTexts: Array<{ name: string; value: string }>, workspacePath: string, manifests: BuzzRunInputManifest[]): string {
  const lines = [
    '',
    '---',
    'BỐI CẢNH HỆ THỐNG (do Buzz thêm vào, không phải lời người dùng)',
    `Thư mục làm việc: ${workspacePath}`,
  ];
  if (inputFiles.length > 0) {
    lines.push(`Đọc các file đầu vào trước khi làm: ${inputFiles.join(', ')}`);
  }
  if (manifests.length > 0) {
    lines.push('', 'MANIFEST ĐẦU VÀO:')
    for (const manifest of manifests) {
      lines.push(`- ${manifest.name} (${manifest.kind}): ${manifest.resolvedPath}`)
      lines.push(`  ${manifest.fileCount} file, ${manifest.totalBytes} byte${manifest.staged ? ', đã đưa vào workspace' : ''}`)
      for (const file of manifest.files) lines.push(`  • ${file}`)
      if (manifest.filesTruncated) lines.push('  • … danh sách đã rút gọn; hãy tự duyệt tiếp trong folder')
    }
  }
  if (inputTexts.length > 0) {
    lines.push('', 'DỮ LIỆU TEXT ĐẦU VÀO:');
    for (const input of inputTexts) lines.push(`[${input.name}]`, input.value);
  }
  const outputKind = step.outputKind ?? (step.outputFile.trim() ? 'file' : 'text');
  if (outputKind === 'file' && step.outputFile.trim()) {
    lines.push(
      `Ghi toàn bộ kết quả vào file: ${step.outputFile}`,
      'Ghi đè file nếu đã tồn tại. Chỉ ghi nội dung thành phẩm, không ghi lời dẫn hay ghi chú quá trình.',
    );
  } else if (outputKind === 'folder' && step.outputFile.trim()) {
    lines.push(
      `Ghi các tệp kết quả vào thư mục: ${step.outputFile}`,
      'Tự tạo thư mục nếu chưa tồn tại. Chỉ ghi sản phẩm cần bàn giao vào thư mục này.',
    );
  } else {
    lines.push('Trả toàn bộ kết quả thành phẩm trực tiếp trong phản hồi. Không bắt buộc ghi file.');
  }
  return lines.join('\n');
}

