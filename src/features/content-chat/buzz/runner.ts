import { generateUUID } from '@/shared/lib/utils';
import { runCliTextTask } from '@/features/video-studio/lib/cli-runtime';
import { useBuzzStore } from './buzz-store';
import {
  MAX_STEP_RUNS,
  MAX_STORED_OUTPUT,
  type BuzzConnection,
  type BuzzFunctionNode,
  type BuzzPipeline,
  type BuzzRun,
  type BuzzRunInputManifest,
  type BuzzStep,
  type RunStepState,
} from './types';
import {
  buildHandoffBlock,
  createNodeFingerprints,
  createPipelineFingerprint,
  prepareRunInputManifest,
  renderPrompt,
  truncate,
} from './runner/prompt';
import { evaluateGate } from './runner/gates';
import {
  STEP_TIMEOUT_MS,
  assertAlive,
  getSignal,
  setActiveRun,
  setHumanGateResolver,
} from './runner/state';

export { abortRun, getActiveRunId, isAwaitingHumanGate, resolveHumanGate } from './runner/state';
import { isRunnerBusy } from './runner/state';
export { isRunnerBusy };
export { evaluateConditionNode, parseJsonCandidate } from './runner/graph';
import {
  executionRoots,
  orderedAgentSteps,
  resolveGraphInputs,
  upstreamAgentIds,
  validateControlFlow,
  evaluateConditionNode,
} from './runner/graph';

/**
 * Bộ chạy pipeline.
 *
 * Chỉ MỘT run được chạy tại một thời điểm — các CLI agent đều nặng, và toàn bộ
 * pipeline dùng chung một workspace nên chạy song song sẽ giẫm file của nhau.
 */

class RunAborted extends Error {
  constructor() {
    super('Đã dừng');
    this.name = 'RunAborted';
  }
}

export interface StartRunOptions {
  pipeline: BuzzPipeline;
  topic: string;
  workspacePath: string | null;
  /** Có giá trị thì chỉ chạy riêng Agent node này. */
  targetStepId?: string;
  onStepChunk?: (stepId: string, text: string) => void;
}

export async function startRun(options: StartRunOptions): Promise<string | null> {
  if (isRunnerBusy()) return null;

  const store = useBuzzStore.getState();
  validateControlFlow(options.pipeline)
  const inputManifest = await prepareRunInputManifest(options.pipeline, options.workspacePath)
  const pipelineFingerprint = createPipelineFingerprint(options.pipeline, store.agents, inputManifest)
  const nodeFingerprints = createNodeFingerprints(options.pipeline, store.agents, inputManifest)
  const orderedSteps = orderedAgentSteps(options.pipeline)
    .map((step) => ({ ...step, gate: { ...step.gate, kind: 'none' as const } }));
  /** Chạy thử một node Function: chạy upstream còn thiếu rồi đánh giá node đúng một lượt. */
  const targetFunctionNode = options.targetStepId
    ? (options.pipeline.functionNodes ?? []).find((node) => node.id === options.targetStepId)
    : undefined;

  const seedStepOutputs = new Map<string, string>();
  if (options.targetStepId) {
    for (const previousRun of store.runs) {
      if (previousRun.pipelineId !== options.pipeline.id) continue
      for (const step of previousRun.steps) {
        if (step.status !== 'passed' || !step.output || seedStepOutputs.has(step.stepId)) continue
        const sourceStep = options.pipeline.steps.find((candidate) => candidate.id === step.stepId)
        if (!sourceStep) continue
        // So theo fingerprint chuỗi của từng node: sửa node khác không làm mất seed của node này.
        if (!step.inputFingerprint || step.inputFingerprint !== nodeFingerprints.get(step.stepId)) continue
        const outputKind = sourceStep.outputKind ?? (sourceStep.outputFile.trim() ? 'file' : 'text')
        if (outputKind === 'text' && (step.artifact?.totalBytes ?? 0) > MAX_STORED_OUTPUT) continue
        if (outputKind !== 'text') {
          if (!sourceStep || !step.artifact?.fingerprint || !window.contentWorkspace?.verifyBuzzOutput) continue
          const currentArtifact = await window.contentWorkspace.verifyBuzzOutput(
            options.workspacePath,
            outputKind,
            sourceStep.outputFile,
            '',
          )
          if (!currentArtifact.valid || currentArtifact.fingerprint !== step.artifact.fingerprint) continue
        }
        seedStepOutputs.set(step.stepId, step.output)
      }
    }
  }
  const upstreamIds = options.targetStepId ? upstreamAgentIds(options.pipeline, options.targetStepId) : new Set<string>()
  const steps = options.targetStepId
    ? orderedSteps.filter((step) => step.id === options.targetStepId || (upstreamIds.has(step.id) && !seedStepOutputs.has(step.id)))
    : orderedSteps;
  if (!targetFunctionNode && (steps.length === 0 || (options.targetStepId && !steps.some((step) => step.id === options.targetStepId)))) return null;
  const runFunctionNodes = targetFunctionNode
    ? [targetFunctionNode]
    : options.targetStepId ? [] : (options.pipeline.functionNodes ?? []);

  const runId = generateUUID();
  const run: BuzzRun = {
    id: runId,
    pipelineId: options.pipeline.id,
    pipelineName: options.pipeline.name,
    topic: options.topic,
    workspacePath: options.workspacePath,
    status: 'running',
    currentStepId: null,
    startedAt: Date.now(),
    stepRuns: 0,
    pipelineFingerprint,
    inputManifest,
    steps: [
      ...steps.map<RunStepState>((step) => ({
        stepId: step.id,
        name: step.name,
        agentName: store.agents.find((agent) => agent.id === step.agentId)?.name ?? '(chưa chọn agent)',
        status: 'pending',
        attempt: 0,
        output: '',
      })),
      ...runFunctionNodes.map<RunStepState>((node) => ({
        stepId: node.id,
        name: node.name,
        agentName: node.kind === 'condition' ? 'Điều kiện' : node.kind === 'loop' ? 'Vòng lặp' : 'Gộp',
        status: 'pending',
        attempt: 0,
        output: '',
      })),
    ],
  };
  store.createRun(run);

  const controller = new AbortController();
  setActiveRun(runId, controller);

  try {
    if (options.targetStepId) {
      const stepOutputs = await executeSteps(runId, steps, options, seedStepOutputs, inputManifest, nodeFingerprints);
      if (targetFunctionNode) evaluateFunctionNodeOnce(runId, targetFunctionNode, options, stepOutputs, inputManifest);
    } else {
      await executeGraph(runId, orderedSteps, runFunctionNodes, options, seedStepOutputs, inputManifest, nodeFingerprints);
    }
    const finished = useBuzzStore.getState().runs.find((item) => item.id === runId);
    const anyFailed = finished?.steps.some((step) => step.status === 'failed');
    useBuzzStore.getState().setRunStatus(runId, anyFailed ? 'failed' : 'done');
  } catch (error) {
    if (error instanceof RunAborted) {
      const current = useBuzzStore.getState().runs.find((item) => item.id === runId);
      useBuzzStore.getState().patchRun(runId, {
        status: 'paused',
        steps: current?.steps.map((step) => (step.status === 'running' || step.status === 'checking' || step.status === 'awaiting'
          ? { ...step, status: 'pending' as const }
          : step)),
      });
    } else {
      useBuzzStore.getState().setRunStatus(runId, 'failed', error instanceof Error ? error.message : String(error));
    }
  } finally {
    setActiveRun(null, null);
    setHumanGateResolver(null);
    useBuzzStore.getState().patchRun(runId, { currentStepId: null });
  }

  return runId;
}

type ExecutionCounter = { value: number }

/**
 * Chạy thử một node Function đơn lẻ: đánh giá đúng MỘT lượt trên output của các
 * node upstream (Loop vì thế luôn báo iteration 1). Kết quả rẽ nhánh được ghi
 * vào lịch sử chạy để user kiểm tra field/điều kiện có đọc đúng dữ liệu không.
 */
function evaluateFunctionNodeOnce(
  runId: string,
  node: BuzzFunctionNode,
  options: StartRunOptions,
  stepOutputs: Map<string, string>,
  manifests: BuzzRunInputManifest[],
): void {
  const store = useBuzzStore.getState();
  const upstreamFailed = store.runs.find((run) => run.id === runId)?.steps
    .some((step) => step.stepId !== node.id && step.status === 'failed');
  if (upstreamFailed) {
    store.patchRunStep(runId, node.id, { status: 'skipped', error: 'Node phía trước không hoàn thành.', finishedAt: Date.now() });
    return;
  }
  store.patchRun(runId, { currentStepId: node.id });
  store.patchRunStep(runId, node.id, { status: 'running', attempt: 1, startedAt: Date.now(), error: undefined, output: '' });
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]));
  const graphInput = resolveGraphInputs(options.pipeline, node.id, options.topic, stepOutputs, inputManifest);
  try {
    let output = '';
    if (node.kind === 'condition') {
      const rawInput = graphInput.texts.map((item) => item.value).join('\n\n') || graphInput.files.join('\n');
      const result = evaluateConditionNode(node, rawInput);
      output = JSON.stringify({ branch: result.passed ? 'true' : 'false', field: node.field ?? '', value: result.value ?? null }, null, 2);
    } else if (node.kind === 'loop') {
      const maxIterations = Math.max(1, Math.min(MAX_STEP_RUNS, node.maxIterations ?? 3));
      output = JSON.stringify({ branch: 'loop', iteration: 1, maxIterations }, null, 2);
    } else {
      output = JSON.stringify({ merged: true, inputs: graphInput.texts.length + graphInput.files.length }, null, 2);
    }
    store.patchRunStep(runId, node.id, { status: 'passed', output, gateVerdict: 'pass', finishedAt: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.patchRunStep(runId, node.id, { status: 'failed', error: message, finishedAt: Date.now() });
    throw error;
  }
}

async function executeGraph(
  runId: string,
  agentSteps: BuzzStep[],
  functionNodes: BuzzFunctionNode[],
  options: StartRunOptions,
  seedStepOutputs: Map<string, string>,
  manifests: BuzzRunInputManifest[],
  nodeFingerprints: Map<string, string>,
): Promise<void> {
  const agentsById = new Map(agentSteps.map((step) => [step.id, step]))
  const functionsById = new Map(functionNodes.map((node) => [node.id, node]))
  const executableIds = new Set([...agentsById.keys(), ...functionsById.keys()])
  const outputs = new Map(seedStepOutputs)
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]))
  const attempts = new Map<string, number>()
  const counter: ExecutionCounter = { value: 0 }
  const functionVisits = new Map<string, number>()
  const loopCounts = new Map<string, number>()
  const queue: string[] = []
  const queued = new Set<string>()

  const enqueue = (id: string) => {
    if (!executableIds.has(id) || queued.has(id)) return
    queue.push(id)
    queued.add(id)
  }
  for (const id of executionRoots(options.pipeline)) enqueue(id)

  while (queue.length > 0) {
    assertAlive()
    const nodeId = queue.shift()!
    queued.delete(nodeId)
    const agentStep = agentsById.get(nodeId)

    if (agentStep) {
      const nextOutputs = await executeSteps(
        runId,
        [agentStep],
        options,
        outputs,
        manifests,
        nodeFingerprints,
        attempts,
        counter,
      )
      outputs.clear()
      for (const [id, value] of nextOutputs) outputs.set(id, value)
      const runStep = useBuzzStore.getState().runs.find((run) => run.id === runId)?.steps.find((step) => step.stepId === nodeId)
      if (runStep?.status === 'failed') throw new Error(`Node “${agentStep.name}” không hoàn thành.`)
      for (const connection of options.pipeline.connections ?? []) if (connection.source === nodeId) enqueue(connection.target)
      continue
    }

    const functionNode = functionsById.get(nodeId)
    if (!functionNode) continue
    counter.value += 1
    if (counter.value > MAX_STEP_RUNS) throw new Error(`Workflow vượt quá ${MAX_STEP_RUNS} lượt thực thi và đã bị dừng.`)
    const visit = (functionVisits.get(nodeId) ?? 0) + 1
    functionVisits.set(nodeId, visit)
    const maxVisits = Math.max(1, Math.min(MAX_STEP_RUNS, functionNode.maxIterations ?? (functionNode.kind === 'condition' ? 10 : 3)))
    if (functionNode.kind === 'condition' && visit > maxVisits) {
      useBuzzStore.getState().patchRunStep(runId, nodeId, { status: 'failed', attempt: visit, error: `Điều kiện đã chạy quá ${maxVisits} lần.`, finishedAt: Date.now() })
      throw new Error(`Node điều kiện “${functionNode.name}” vượt giới hạn ${maxVisits} lần.`)
    }

    useBuzzStore.getState().patchRun(runId, { currentStepId: nodeId, stepRuns: counter.value })
    useBuzzStore.getState().patchRunStep(runId, nodeId, { status: 'running', attempt: visit, startedAt: Date.now(), error: undefined, output: '' })
    const graphInput = resolveGraphInputs(options.pipeline, nodeId, options.topic, outputs, inputManifest)
    let branch: BuzzConnection['sourceHandle'] = null
    let output = ''

    try {
      if (functionNode.kind === 'condition') {
        const rawInput = graphInput.texts.map((item) => item.value).join('\n\n') || graphInput.files.join('\n')
        const result = evaluateConditionNode(functionNode, rawInput)
        branch = result.passed ? 'true' : 'false'
        output = JSON.stringify({ branch, field: functionNode.field ?? '', value: result.value ?? null }, null, 2)
      } else if (functionNode.kind === 'loop') {
        const count = (loopCounts.get(nodeId) ?? 0) + 1
        loopCounts.set(nodeId, count)
        branch = count <= maxVisits ? 'loop' : 'done'
        output = JSON.stringify({ branch, iteration: count, maxIterations: maxVisits }, null, 2)
      } else {
        output = JSON.stringify({ merged: true, inputs: graphInput.texts.length + graphInput.files.length }, null, 2)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      useBuzzStore.getState().patchRunStep(runId, nodeId, { status: 'failed', error: message, finishedAt: Date.now() })
      throw error
    }

    outputs.set(nodeId, output)
    useBuzzStore.getState().patchRunStep(runId, nodeId, { status: 'passed', output, gateVerdict: 'pass', finishedAt: Date.now() })
    const outgoing = (options.pipeline.connections ?? []).filter((connection) => connection.source === nodeId)
    const selected = functionNode.kind === 'merge'
      ? outgoing
      : outgoing.filter((connection) => !connection.sourceHandle || connection.sourceHandle === branch)
    for (const connection of selected) enqueue(connection.target)
  }

  const finishedRun = useBuzzStore.getState().runs.find((run) => run.id === runId)
  for (const step of finishedRun?.steps ?? []) {
    if (step.status === 'pending') useBuzzStore.getState().patchRunStep(runId, step.stepId, { status: 'skipped', finishedAt: Date.now() })
  }
}

async function executeSteps(
  runId: string,
  steps: BuzzStep[],
  options: StartRunOptions,
  seedStepOutputs = new Map<string, string>(),
  manifests: BuzzRunInputManifest[] = [],
  nodeFingerprints = new Map<string, string>(),
  attempts = new Map<string, number>(),
  executionCounter: ExecutionCounter = { value: 0 },
): Promise<Map<string, string>> {
  /** Số lần đã chạy của từng step, dùng để chặn retry/goto lặp vô hạn. */
  /** Feedback QC của lần fail gần nhất, bơm vào prompt lần chạy lại. */
  const feedback = new Map<string, string>();
  /** Kết quả thật của agent trước để node sau nhận được khi output là text. */
  const stepOutputs = new Map(seedStepOutputs);
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]));
  let index = 0;

  while (index < steps.length) {
    assertAlive();
    const step = steps[index];
    const store = useBuzzStore.getState();

    if (executionCounter.value >= MAX_STEP_RUNS) {
      store.patchRunStep(runId, step.id, {
        status: 'failed',
        error: `Đã chạm trần ${MAX_STEP_RUNS} lượt chạy step — nghi ngờ pipeline lặp vô tận.`,
      });
      throw new Error(`Pipeline vượt quá ${MAX_STEP_RUNS} lượt chạy step và đã bị dừng.`);
    }

    const agent = store.agents.find((item) => item.id === step.agentId);
    if (!agent) {
      store.patchRunStep(runId, step.id, { status: 'failed', error: 'Bước này chưa gán agent.' });
      if (step.onFail === 'continue') {
        index += 1;
        continue;
      }
      throw new Error(`Bước "${step.name}" chưa gán agent.`);
    }

    const attempt = (attempts.get(step.id) ?? 0) + 1;
    attempts.set(step.id, attempt);
    executionCounter.value += 1;

    const graphInput = resolveGraphInputs(options.pipeline, step.id, options.topic, stepOutputs, inputManifest);
    const inputFingerprint = nodeFingerprints.get(step.id);

    store.patchRun(runId, { currentStepId: step.id, stepRuns: executionCounter.value });
    store.patchRunStep(runId, step.id, {
      status: 'running',
      attempt,
      startedAt: Date.now(),
      error: undefined,
      gateVerdict: undefined,
      gateReason: undefined,
      output: '',
      inputFingerprint,
      artifact: undefined,
    });

    const inputFiles = graphInput.files;

    const workspacePath = options.workspacePath ?? '';
    const promptWithNodeInputs = step.prompt.replace(/\{\{\s*node:([^}\s]+)\s*\}\}/g, (_match, nodeId: string) => graphInput.values[nodeId] ?? '');
    const prompt = renderPrompt(promptWithNodeInputs, {
      topic: graphInput.texts.map((item) => item.value).join('\n\n'),
      input: inputFiles.join(', '),
      output: step.outputFile,
      feedback: feedback.get(step.id) ?? '',
    }) + buildHandoffBlock(step, inputFiles, graphInput.texts, workspacePath, graphInput.manifests);

    let output = '';
    let artifact: RunStepState['artifact'];
    const outputKind = step.outputKind ?? (step.outputFile.trim() ? 'file' : 'text');
    const previousArtifact = outputKind === 'text' || !window.contentWorkspace?.verifyBuzzOutput
      ? null
      : await window.contentWorkspace.verifyBuzzOutput(options.workspacePath, outputKind, step.outputFile, '');
    try {
      output = await runCliTextTask({
        adapter: agent.adapter,
        prompt,
        systemPrompt: agent.systemPrompt || undefined,
        model: agent.model || undefined,
        effort: agent.effort || undefined,
        // Mỗi lượt chạy là một session sạch: step sau không thừa hưởng context step
        // trước, và lần chạy lại không mang theo bài cũ đã bị chấm trượt.
        sessionKey: `buzz:${runId}:${step.id}:${attempt}`,
        timeoutMs: STEP_TIMEOUT_MS,
        workingDirectory: options.workspacePath ?? undefined,
        enableContentMcp: true,
        signal: getSignal(),
        onChunk: (chunk) => {
          output += chunk;
          options.onStepChunk?.(step.id, output);
        },
      });
      assertAlive();
      if (!window.contentWorkspace?.verifyBuzzOutput) throw new Error('Runtime hiện tại chưa hỗ trợ xác minh đầu ra.');
      const verified = await window.contentWorkspace.verifyBuzzOutput(
        options.workspacePath,
        outputKind,
        step.outputFile,
        output,
      );
      if (!verified.valid || !verified.fingerprint) {
        throw new Error(`Đầu ra không hợp lệ: ${verified.error || 'không xác minh được sản phẩm'}`);
      }
      if (outputKind !== 'text' && previousArtifact?.valid && previousArtifact.fingerprint === verified.fingerprint) {
        throw new Error(`Đầu ra không hợp lệ: Agent chưa tạo hoặc cập nhật ${outputKind === 'file' ? 'file' : 'folder'} đầu ra trong lượt chạy này.`);
      }
      artifact = {
        kind: outputKind,
        path: verified.path,
        fingerprint: verified.fingerprint,
        fileCount: verified.fileCount ?? 0,
        totalBytes: verified.totalBytes ?? 0,
      };
    } catch (error) {
      assertAlive();
      const message = error instanceof Error ? error.message : String(error);
      useBuzzStore.getState().patchRunStep(runId, step.id, {
        status: 'failed',
        error: message,
        finishedAt: Date.now(),
      });
      const next = decideAfterFailure(step, steps, index, attempt);
      if (next.action === 'abort') throw new Error(`Bước "${step.name}" lỗi: ${message}`);
      if (next.action === 'continue') { index += 1; continue; }
      if (next.action === 'goto') {
        resetFrom(runId, steps, next.index, index);
        index = next.index;
        continue;
      }
      continue; // retry: chạy lại chính step này
    }

    assertAlive();
    stepOutputs.set(step.id, output);
    useBuzzStore.getState().patchRunStep(runId, step.id, {
      status: 'checking',
      output: truncate(output, MAX_STORED_OUTPUT),
      artifact,
    });

    const run = useBuzzStore.getState().runs.find((item) => item.id === runId)!;
    const gate = await evaluateGate(step, run, attempt, output);
    assertAlive();

    if (gate.pass) {
      useBuzzStore.getState().patchRunStep(runId, step.id, {
        status: 'passed',
        gateVerdict: 'pass',
        gateReason: gate.reason,
        finishedAt: Date.now(),
      });
      feedback.delete(step.id);
      index += 1;
      continue;
    }

    useBuzzStore.getState().patchRunStep(runId, step.id, {
      status: 'failed',
      gateVerdict: 'fail',
      gateReason: gate.reason,
      finishedAt: Date.now(),
    });
    feedback.set(step.id, gate.reason);

    const next = decideAfterFailure(step, steps, index, attempt);
    if (next.action === 'abort') {
      useBuzzStore.getState().patchRun(runId, { error: `Bước "${step.name}" không đạt QC: ${gate.reason}` });
      return stepOutputs;
    }
    if (next.action === 'continue') { index += 1; continue; }
    if (next.action === 'goto') {
      resetFrom(runId, steps, next.index, index);
      index = next.index;
      continue;
    }
    // retry: giữ nguyên index, vòng lặp chạy lại step này với feedback vừa lưu
  }
  return stepOutputs;
}

type FailureDecision =
  | { action: 'abort' }
  | { action: 'continue' }
  | { action: 'retry' }
  | { action: 'goto'; index: number };

function decideAfterFailure(step: BuzzStep, steps: BuzzStep[], index: number, attempt: number): FailureDecision {
  if (step.onFail === 'continue') return { action: 'continue' };
  if (step.onFail === 'stop') return { action: 'abort' };
  // Hết lượt thử thì dừng, dù cấu hình là retry hay goto.
  if (attempt > step.maxRetries) return { action: 'abort' };
  if (step.onFail === 'retry') return { action: 'retry' };
  const target = steps.findIndex((item) => item.id === step.gotoStepId);
  // Chỉ cho quay LÙI. Nhảy tới sẽ bỏ qua bước, nhảy vào chính nó thì thành retry.
  if (target < 0 || target >= index) return { action: 'abort' };
  return { action: 'goto', index: target };
}

/**
 * Quay lui thì phải dọn trạng thái các step ở giữa, nếu không UI vẫn hiện chúng
 * "đã đạt" trong khi đầu vào của chúng sắp bị ghi đè.
 */
function resetFrom(runId: string, steps: BuzzStep[], from: number, to: number): void {
  const store = useBuzzStore.getState();
  for (let i = from; i <= to && i < steps.length; i += 1) {
    store.patchRunStep(runId, steps[i].id, {
      status: 'pending',
      gateVerdict: undefined,
      gateReason: undefined,
      error: undefined,
    });
  }
}
