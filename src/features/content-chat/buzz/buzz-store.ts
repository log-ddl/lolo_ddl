import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { debouncedFileStorage } from '@/shared/lib/debounced-storage';
import { generateUUID } from '@/shared/lib/utils';
import {
  emptyGate,
  type BuzzAgent,
  type BuzzPipeline,
  type BuzzRun,
  type BuzzStep,
  type RunStepState,
  type RunStatus,
} from './types';

/**
 * Không có agent/pipeline dựng sẵn. Vai trò là thứ user tự định nghĩa — Buzz chỉ
 * cung cấp khung để xếp và chạy.
 */

function now() {
  return Date.now();
}

export function newStep(agentId: string, index: number): BuzzStep {
  return {
    id: generateUUID(),
    name: `Bước ${index + 1}`,
    position: { x: 80 + index * 300, y: 120 },
    topicInput: index === 0,
    agentId,
    prompt: '',
    outputKind: 'text',
    outputFile: '',
    inputStepIds: [],
    gate: { ...emptyGate(), position: { x: 350 + index * 300, y: 120 } },
    onFail: 'stop',
    maxRetries: 2,
    gotoStepId: '',
  };
}

interface BuzzState {
  agents: BuzzAgent[];
  pipelines: BuzzPipeline[];
  runs: BuzzRun[];
  activePipelineId: string | null;
  activeRunId: string | null;
  /**
   * fileStorage đọc bất đồng bộ (file + localStorage + IndexedDB), nên có một
   * khoảng store còn rỗng. UI phải chờ cờ này, nếu không màn hình sẽ nháy
   * "chưa có gì" và user tưởng dữ liệu bị mất — tệ hơn là bấm tạo mới trong
   * khoảng đó thì thao tác sẽ bị hydrate ghi đè.
   */
  hydrated: boolean;

  createAgent: (agent?: Partial<BuzzAgent>) => string;
  updateAgent: (id: string, patch: Partial<BuzzAgent>) => void;
  deleteAgent: (id: string) => void;

  createPipeline: (name?: string) => string;
  updatePipeline: (id: string, patch: Partial<BuzzPipeline>) => void;
  deletePipeline: (id: string) => void;
  duplicatePipeline: (id: string) => string | null;
  selectPipeline: (id: string | null) => void;

  addStep: (pipelineId: string) => void;
  updateStep: (pipelineId: string, stepId: string, patch: Partial<BuzzStep>) => void;
  removeStep: (pipelineId: string, stepId: string) => void;
  moveStep: (pipelineId: string, stepId: string, direction: 'up' | 'down') => void;

  createRun: (run: BuzzRun) => void;
  patchRun: (runId: string, patch: Partial<BuzzRun>) => void;
  patchRunStep: (runId: string, stepId: string, patch: Partial<RunStepState>) => void;
  setRunStatus: (runId: string, status: RunStatus, error?: string) => void;
  deleteRun: (runId: string) => void;
  clearRuns: () => void;
  selectRun: (id: string | null) => void;
}

export const useBuzzStore = create<BuzzState>()(
  persist(
    (set, get) => ({
      agents: [],
      pipelines: [],
      runs: [],
      activePipelineId: null,
      activeRunId: null,
      hydrated: false,

      createAgent: (agent) => {
        const id = generateUUID();
        set((state) => ({
          agents: [
            ...state.agents,
            {
              id,
              name: 'Agent mới',
              role: '',
              adapter: 'claude',
              model: '',
              effort: '',
              systemPrompt: '',
              createdAt: now(),
              updatedAt: now(),
              ...agent,
            },
          ],
        }));
        return id;
      },

      updateAgent: (id, patch) => set((state) => ({
        agents: state.agents.map((agent) => (agent.id === id ? { ...agent, ...patch, updatedAt: now() } : agent)),
      })),

      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== id),
        // Gỡ agent khỏi mọi step/gate đang trỏ tới nó để pipeline không trỏ vào khoảng không.
        pipelines: state.pipelines.map((pipeline) => ({
          ...pipeline,
          steps: pipeline.steps.map((step) => ({
            ...step,
            agentId: step.agentId === id ? '' : step.agentId,
            gate: step.gate.judgeAgentId === id ? { ...step.gate, judgeAgentId: '' } : step.gate,
          })),
        })),
      })),

      createPipeline: (name) => {
        const id = generateUUID();
        set((state) => ({
          pipelines: [
            ...state.pipelines,
            {
              id,
              name: name || 'Pipeline mới',
              description: '',
              steps: [],
              inputNodes: [],
              functionNodes: [],
              connections: [],
              workspacePath: null,
              createdAt: now(),
              updatedAt: now(),
            },
          ],
          activePipelineId: id,
        }));
        return id;
      },

      updatePipeline: (id, patch) => set((state) => ({
        pipelines: state.pipelines.map((pipeline) => (pipeline.id === id
          ? { ...pipeline, ...patch, updatedAt: now() }
          : pipeline)),
      })),

      deletePipeline: (id) => set((state) => {
        const pipelines = state.pipelines.filter((pipeline) => pipeline.id !== id);
        return {
          pipelines,
          activePipelineId: state.activePipelineId === id ? pipelines[0]?.id ?? null : state.activePipelineId,
        };
      }),

      duplicatePipeline: (id) => {
        const source = get().pipelines.find((pipeline) => pipeline.id === id);
        if (!source) return null;
        const newId = generateUUID();
        // Mọi node phải sinh id mới, đồng thời map lại toàn bộ connection.
        const allNodeIds = [
          ...source.steps.map((step) => step.id),
          ...(source.inputNodes ?? []).map((node) => node.id),
          ...(source.functionNodes ?? []).map((node) => node.id),
        ];
        const idMap = new Map(allNodeIds.map((nodeId) => [nodeId, generateUUID()]));
        set((state) => ({
          pipelines: [
            ...state.pipelines,
            {
              ...source,
              id: newId,
              name: `${source.name} (bản sao)`,
              createdAt: now(),
              updatedAt: now(),
              inputNodes: (source.inputNodes ?? []).map((node) => ({ ...node, id: idMap.get(node.id)! })),
              functionNodes: (source.functionNodes ?? []).map((node) => ({ ...node, id: idMap.get(node.id)! })),
              connections: (source.connections ?? []).flatMap((connection) => {
                const mappedSource = idMap.get(connection.source);
                const mappedTarget = idMap.get(connection.target);
                return mappedSource && mappedTarget
                  ? [{ ...connection, id: generateUUID(), source: mappedSource, target: mappedTarget }]
                  : [];
              }),
              steps: source.steps.map((step) => ({
                ...step,
                id: idMap.get(step.id)!,
                inputStepIds: step.inputStepIds.map((stepId) => idMap.get(stepId)).filter((v): v is string => Boolean(v)),
                gotoStepId: idMap.get(step.gotoStepId) ?? '',
              })),
            },
          ],
          activePipelineId: newId,
        }));
        return newId;
      },

      selectPipeline: (activePipelineId) => set({ activePipelineId }),

      addStep: (pipelineId) => set((state) => ({
        pipelines: state.pipelines.map((pipeline) => {
          if (pipeline.id !== pipelineId) return pipeline;
          const fallbackAgent = state.agents[0]?.id ?? '';
          return {
            ...pipeline,
            steps: [...pipeline.steps, newStep(fallbackAgent, pipeline.steps.length)],
            updatedAt: now(),
          };
        }),
      })),

      updateStep: (pipelineId, stepId, patch) => set((state) => ({
        pipelines: state.pipelines.map((pipeline) => (pipeline.id === pipelineId
          ? {
            ...pipeline,
            updatedAt: now(),
            steps: pipeline.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
          }
          : pipeline)),
      })),

      removeStep: (pipelineId, stepId) => set((state) => ({
        pipelines: state.pipelines.map((pipeline) => (pipeline.id === pipelineId
          ? {
            ...pipeline,
            updatedAt: now(),
            steps: pipeline.steps
              .filter((step) => step.id !== stepId)
              // Dọn tham chiếu tới step vừa xoá.
              .map((step) => ({
                ...step,
                inputStepIds: step.inputStepIds.filter((id) => id !== stepId),
                gotoStepId: step.gotoStepId === stepId ? '' : step.gotoStepId,
              })),
          }
          : pipeline)),
      })),

      moveStep: (pipelineId, stepId, direction) => set((state) => ({
        pipelines: state.pipelines.map((pipeline) => {
          if (pipeline.id !== pipelineId) return pipeline;
          const index = pipeline.steps.findIndex((step) => step.id === stepId);
          const target = direction === 'up' ? index - 1 : index + 1;
          if (index < 0 || target < 0 || target >= pipeline.steps.length) return pipeline;
          const steps = [...pipeline.steps];
          [steps[index], steps[target]] = [steps[target], steps[index]];
          return { ...pipeline, steps, updatedAt: now() };
        }),
      })),

      createRun: (run) => set((state) => ({
        // Giữ 20 lần chạy gần nhất, cũ hơn thì bỏ để store không phình.
        runs: [run, ...state.runs].slice(0, 20),
        activeRunId: run.id,
      })),

      patchRun: (runId, patch) => set((state) => ({
        runs: state.runs.map((run) => (run.id === runId ? { ...run, ...patch } : run)),
      })),

      patchRunStep: (runId, stepId, patch) => set((state) => ({
        runs: state.runs.map((run) => (run.id === runId
          ? { ...run, steps: run.steps.map((step) => (step.stepId === stepId ? { ...step, ...patch } : step)) }
          : run)),
      })),

      setRunStatus: (runId, status, error) => set((state) => ({
        runs: state.runs.map((run) => (run.id === runId
          ? {
            ...run,
            status,
            error: error ?? run.error,
            finishedAt: status === 'done' || status === 'failed' ? now() : run.finishedAt,
          }
          : run)),
      })),

      deleteRun: (runId) => set((state) => ({
        runs: state.runs.filter((run) => run.id !== runId),
        activeRunId: state.activeRunId === runId ? null : state.activeRunId,
      })),

      clearRuns: () => set({ runs: [], activeRunId: null }),

      selectRun: (activeRunId) => set({ activeRunId }),
    }),
    {
      name: 'longdd-buzz',
      storage: createJSONStorage(() => debouncedFileStorage),
      version: 5,
      migrate: (persisted) => {
        const state = persisted as Partial<BuzzState> | undefined;
        return {
          ...state,
          pipelines: (state?.pipelines ?? []).map((pipeline) => {
            const legacyInputId = `input-topic:${pipeline.id}`;
            const steps = (pipeline.steps ?? []).map((step, index) => {
              const position = step.position ?? { x: 80 + index * 300, y: 120 };
              return {
                ...step,
                position,
                outputKind: step.outputKind ?? (step.outputFile?.trim() ? 'file' : 'text'),
                topicInput: step.topicInput ?? /\{\{\s*topic\s*\}\}/.test(step.prompt),
                gate: {
                  ...step.gate,
                  position: step.gate.position ?? { x: position.x + 300, y: position.y },
                },
              };
            });
            const legacyPosition = (pipeline as BuzzPipeline & { inputPosition?: { x: number; y: number } }).inputPosition;
            const needsLegacyInput = !pipeline.inputNodes && steps.some((step) => step.topicInput);
            const inputNodes = pipeline.inputNodes ?? (needsLegacyInput ? [{
              id: legacyInputId,
              type: 'input' as const,
              kind: 'text' as const,
              name: 'Đề bài',
              position: legacyPosition ?? { x: -240, y: 120 },
              value: '',
              path: '',
            }] : []);
            const legacyConnections = pipeline.connections ?? [
              ...steps.filter((step) => step.topicInput).map((step) => ({
                id: generateUUID(), source: legacyInputId, target: step.id,
              })),
              ...steps.flatMap((step) => step.inputStepIds.map((source) => ({
                id: generateUUID(), source, target: step.id,
              }))),
            ];
            const validNodeIds = new Set([
              ...steps.map((step) => step.id),
              ...inputNodes.map((node) => node.id),
              ...(pipeline.functionNodes ?? []).map((node) => node.id),
            ]);
            const seenConnections = new Set<string>();
            const connections = legacyConnections.flatMap((connection) => {
              if (connection.target.startsWith('gate:')) return [];
              const rawSource = connection.source === 'input:topic'
                ? legacyInputId
                : connection.source.startsWith('gate:') ? connection.source.slice(5) : connection.source;
              if (!validNodeIds.has(rawSource) || !validNodeIds.has(connection.target)) return [];
              const key = `${rawSource}>${connection.target}`;
              if (seenConnections.has(key)) return [];
              seenConnections.add(key);
              return [{ ...connection, id: generateUUID(), source: rawSource, target: connection.target }];
            });
            return {
              ...pipeline,
              steps,
              inputNodes,
              functionNodes: (pipeline.functionNodes ?? []).map((node) => ({
                ...node,
                field: node.field ?? '',
                operator: node.operator ?? 'truthy',
                compareValue: node.compareValue ?? '',
                maxIterations: node.maxIterations ?? (node.kind === 'condition' ? 10 : 3),
              })),
              connections,
            };
          }),
        };
      },
      partialize: (state) => ({
        agents: state.agents,
        pipelines: state.pipelines,
        runs: state.runs,
        activePipelineId: state.activePipelineId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('[Buzz] Không đọc được dữ liệu đã lưu:', error);
        // Luôn bật cờ, kể cả khi lỗi — nếu không UI sẽ kẹt ở màn hình chờ mãi.
        useBuzzStore.setState({
          hydrated: true,
          // Tiến trình chạy chết theo process. Đánh dấu lại để user biết cần chạy lại.
          // Dùng ?? [] vì file cũ có thể thiếu khoá — thiếu guard là hydrate ném lỗi
          // và store rơi về rỗng, đúng nghĩa mất dữ liệu.
          runs: (state?.runs ?? []).map((run) => (run.status === 'running' || run.status === 'awaiting'
            ? {
              ...run,
              status: 'paused' as const,
              steps: (run.steps ?? []).map((step) => (step.status === 'running' || step.status === 'checking' || step.status === 'awaiting'
                ? { ...step, status: 'pending' as const }
                : step)),
            }
            : run)),
          agents: state?.agents ?? [],
          pipelines: state?.pipelines ?? [],
        });
      },
    },
  ),
);
