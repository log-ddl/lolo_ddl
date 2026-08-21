import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ConnectionLineType,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
} from "@xyflow/react";

const nodeTypes = { buzzNode: BuzzGraphNode };
const edgeTypes = { buzzEdge: BuzzGraphEdge };
import {
  Loader2,
  Maximize,
  Paintbrush,
  Play,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { useI18n } from "@/shared/i18n";
import { generateUUID } from "@/shared/lib/utils";
import { newStep, useBuzzStore } from "../buzz-store";
import {
  PICKER_ITEMS,
  localizedNodeName,
  type CanvasEdgeData,
  type CanvasNodeData,
  type EditorInputSource,
  type PickerItem,
} from "./pipeline/types";
import { BuzzGraphEdge, BuzzGraphNode, CanvasControl } from "./pipeline/canvas-nodes";
import { NodePicker } from "./pipeline/node-picker";
import { NodeInspector } from "./pipeline/node-inspector";
import {
  type BuzzConnection,
  type BuzzFunctionNode,
  type BuzzInputKind,
  type BuzzInputNode,
  type BuzzPipeline,
  type BuzzRun,
  type BuzzStep,
} from "../types";



export function PipelineEditor({ pipeline, run, busy, runningNodeId, resultPanelOpen, onExecute, onExecuteNode, onStop }: {
  pipeline: BuzzPipeline;
  run?: BuzzRun | null;
  busy: boolean;
  runningNodeId: string | null;
  resultPanelOpen: boolean;
  onExecute: () => void;
  onExecuteNode: (stepId: string) => void;
  onStop: () => void;
}) {
  return (
    <ReactFlowProvider>
      <PipelineCanvas pipeline={pipeline} run={run} busy={busy} runningNodeId={runningNodeId} resultPanelOpen={resultPanelOpen} onExecute={onExecute} onExecuteNode={onExecuteNode} onStop={onStop} />
    </ReactFlowProvider>
  );
}

function PipelineCanvas({ pipeline, run, busy, runningNodeId, resultPanelOpen, onExecute, onExecuteNode, onStop }: {
  pipeline: BuzzPipeline;
  run?: BuzzRun | null;
  busy: boolean;
  runningNodeId: string | null;
  resultPanelOpen: boolean;
  onExecute: () => void;
  onExecuteNode: (stepId: string) => void;
  onStop: () => void;
}) {
  const { agents, runs, createAgent, updateAgent: updateAgentPreset, updatePipeline } = useBuzzStore();
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set());
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"picker" | "inspector" | null>(null);
  const [pendingSource, setPendingSource] = useState<{ id: string; handle?: BuzzConnection['sourceHandle'] } | null>(null);
  const [query, setQuery] = useState("");
  const inputs = pipeline.inputNodes ?? [];
  const functions = pipeline.functionNodes ?? [];
  const connections = pipeline.connections ?? [];
  const runForPipeline = run?.pipelineId === pipeline.id ? run : null;
  const latestNodeOutputs = useMemo(() => {
    const result = new Map<string, string>();
    for (const item of runs) {
      if (item.pipelineId !== pipeline.id) continue;
      for (const step of item.steps) if (step.output && !result.has(step.stepId)) result.set(step.stepId, step.output);
    }
    return result;
  }, [pipeline.id, runs]);
  const totalNodes = inputs.length + functions.length + pipeline.steps.length;

  useEffect(() => {
    setSelectedNodeId(null);
    setSelectedNodeIds(new Set());
    setSelectedEdgeId(null);
    setPendingSource(null);
    setPanelMode(null);
  }, [pipeline.id]);

  const openPicker = useCallback((sourceId?: string, sourceHandle?: BuzzConnection['sourceHandle']) => {
    setPendingSource(sourceId ? { id: sourceId, handle: sourceHandle } : null);
    setQuery("");
    setPanelMode("picker");
  }, []);

  const openInspector = useCallback((id: string) => {
    setSelectedNodeId(id);
    setSelectedNodeIds(new Set([id]));
    setPanelMode("inspector");
  }, []);

  const removeNode = useCallback((id: string) => {
    updatePipeline(pipeline.id, {
      inputNodes: inputs.filter((item) => item.id !== id),
      functionNodes: functions.filter((item) => item.id !== id),
      steps: pipeline.steps.filter((item) => item.id !== id),
      connections: connections.filter((item) => item.source !== id && item.target !== id),
    });
    setSelectedNodeId(null);
    setSelectedNodeIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setPanelMode(null);
  }, [connections, functions, inputs, pipeline.id, pipeline.steps, updatePipeline]);

  const buildNodes = useCallback((): Node<CanvasNodeData>[] => {
    const inputNodes = inputs.map<Node<CanvasNodeData>>((item) => ({
      id: item.id,
      type: "buzzNode",
      position: item.position,
      selected: selectedNodeIds.has(item.id),
      deletable: false,
      data: {
        family: "input",
        kind: item.kind,
        title: localizedNodeName(item.name, vietnamese),
        subtitle: item.kind === "text"
          ? (item.value.trim() ? "Đã có nội dung" : "Chưa có nội dung")
          : item.path.split(/[\\/]/).filter(Boolean).pop() || (item.kind === "file" ? "Chưa chọn file" : "Chưa chọn folder"),
        runningLabel: vietnamese ? "Đang chạy…" : "Running…",
        status: "pending",
        onAddNext: () => openPicker(item.id),
        onOpen: () => openInspector(item.id),
        onDelete: () => removeNode(item.id),
        onRun: () => {},
      },
    }));
    const functionNodes = functions.map<Node<CanvasNodeData>>((item) => {
      const runStep = runForPipeline?.steps.find((step) => step.stepId === item.id);
      return ({
      id: item.id,
      type: "buzzNode",
      position: item.position,
      selected: selectedNodeIds.has(item.id),
      deletable: false,
      data: {
        family: "function",
        kind: item.kind,
        title: localizedNodeName(item.name, vietnamese),
        subtitle: item.kind === "condition"
          ? (vietnamese ? "Rẽ nhánh Đúng / Sai" : "Branch True / False")
          : item.kind === "loop" ? (vietnamese ? `Lặp tối đa ${item.maxIterations ?? 3} lượt` : `Repeat up to ${item.maxIterations ?? 3} times`)
            : (vietnamese ? "Gộp mọi đầu vào" : "Merge all inputs"),
        runningLabel: vietnamese ? "Đang xử lý…" : "Processing…",
        status: runStep?.status ?? "pending",
        onAddNext: (handle) => openPicker(item.id, handle),
        onOpen: () => openInspector(item.id),
        onDelete: () => removeNode(item.id),
        onRun: () => onExecuteNode(item.id),
      },
    })});
    const agentNodes = pipeline.steps.map<Node<CanvasNodeData>>((step) => {
      const runStep = runForPipeline?.steps.find((item) => item.stepId === step.id);
      const agent = agents.find((item) => item.id === step.agentId);
      return {
        id: step.id,
        type: "buzzNode",
        position: step.position ?? { x: 80, y: 120 },
        selected: selectedNodeIds.has(step.id),
        deletable: false,
        data: {
          family: "agent",
          kind: "agent",
          title: localizedNodeName(step.name || "Agent", vietnamese),
          subtitle: agent ? `${agent.name} · ${agent.adapter}` : "Chưa gán agent",
          runningLabel: vietnamese ? "Đang chạy…" : "Running…",
          status: runStep?.status ?? "pending",
          onAddNext: () => openPicker(step.id),
          onOpen: () => openInspector(step.id),
          onDelete: () => removeNode(step.id),
          onRun: () => onExecuteNode(step.id),
        },
      };
    });
    return [...inputNodes, ...functionNodes, ...agentNodes];
  }, [agents, functions, inputs, onExecuteNode, openInspector, openPicker, pipeline.steps, removeNode, runForPipeline?.steps, selectedNodeIds, vietnamese]);

  const [nodes, setNodes] = useState<Node<CanvasNodeData>[]>(buildNodes);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => {
    const nextNodes = buildNodes();
    setNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node) => [node.id, node]));
      return nextNodes.map((nextNode) => {
        const currentNode = currentById.get(nextNode.id);
        if (!currentNode) return nextNode;

        // Giữ nguyên instance/measurement nội bộ của React Flow khi chỉ có trạng
        // thái chạy thay đổi. Dựng lại toàn bộ node ở mỗi chunk khiến handle mất
        // measurement trong một frame và các edge biến mất khỏi canvas.
        return {
          ...currentNode,
          position: nextNode.position,
          selected: nextNode.selected,
          deletable: nextNode.deletable,
          data: nextNode.data,
        };
      });
    });
  }, [buildNodes]);

  const fitAllNodes = useCallback((duration = 300) => {
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0) return;
    void fitView({
      nodes: currentNodes.map(({ id }) => ({ id })),
      padding: 0.22,
      maxZoom: 1.1,
      duration,
    });
  }, [fitView]);

  useEffect(() => {
    // Chờ cột kết quả đóng/mở xong để React Flow đo đúng phần canvas còn lại.
    let timer: number | undefined;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => fitAllNodes(250), 40);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [fitAllNodes, resultPanelOpen]);

  const deleteConnection = useCallback((id: string) => {
    if (busy) return;
    updatePipeline(pipeline.id, { connections: connections.filter((connection) => connection.id !== id) });
    setSelectedEdgeId(null);
  }, [busy, connections, pipeline.id, updatePipeline]);

  useEffect(() => {
    if (selectedEdgeId && !connections.some((connection) => connection.id === selectedEdgeId)) setSelectedEdgeId(null);
  }, [connections, selectedEdgeId]);

  useEffect(() => {
    if (!selectedEdgeId || busy) return;
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      deleteConnection(selectedEdgeId);
    };
    window.addEventListener("keydown", handleDeleteKey);
    return () => window.removeEventListener("keydown", handleDeleteKey);
  }, [busy, deleteConnection, selectedEdgeId]);

  const edges = useMemo<Edge<CanvasEdgeData>[]>(() => connections.map((connection) => {
    const branchLabel = connection.sourceHandle === "true" ? (vietnamese ? "Đúng" : "True")
      : connection.sourceHandle === "false" ? (vietnamese ? "Sai" : "False")
        : connection.sourceHandle === "loop" ? (vietnamese ? "Lặp" : "Loop")
          : connection.sourceHandle === "done" ? (vietnamese ? "Xong" : "Done") : undefined;
    const branchTone = connection.sourceHandle === "true" ? "success"
      : connection.sourceHandle === "false" ? "danger"
        : connection.sourceHandle === "loop" ? "loop"
          : connection.sourceHandle === "done" ? "done" : undefined;
    return ({
    id: connection.id,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? undefined,
    type: "buzzEdge",
    markerEnd: { type: MarkerType.ArrowClosed },
    deletable: !busy,
    selectable: !busy,
    selected: selectedEdgeId === connection.id,
    interactionWidth: 36,
    data: { onDelete: deleteConnection, branchLabel, branchTone },
    style: { stroke: connection.loop ? "hsl(var(--primary) / 0.8)" : "hsl(var(--muted-foreground) / 0.75)", strokeWidth: connection.loop ? 2 : 1.75, strokeDasharray: connection.loop ? "6 4" : undefined },
  })}), [busy, connections, deleteConnection, selectedEdgeId, vietnamese]);

  const nodeExists = useCallback((id: string) => inputs.some((item) => item.id === id)
    || functions.some((item) => item.id === id)
    || pipeline.steps.some((item) => item.id === id), [functions, inputs, pipeline.steps]);

  const wouldCreateCycle = useCallback((source: string, target: string) => {
    const outgoing = new Map<string, string[]>();
    for (const connection of connections) {
      outgoing.set(connection.source, [...(outgoing.get(connection.source) ?? []), connection.target]);
    }
    const stack = [target];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === source) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      stack.push(...(outgoing.get(current) ?? []));
    }
    return false;
  }, [connections]);

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return false;
    if (!nodeExists(connection.source) || !nodeExists(connection.target)) return false;
    if (inputs.some((item) => item.id === connection.target)) return false;
    if (connections.some((item) => item.source === connection.source && item.target === connection.target && (item.sourceHandle ?? null) === (connection.sourceHandle ?? null))) return false;
    const createsCycle = wouldCreateCycle(connection.source, connection.target);
    if (!createsCycle) return true;
    const sourceFunction = functions.find((item) => item.id === connection.source);
    const targetFunction = functions.find((item) => item.id === connection.target);
    if (sourceFunction?.kind === "condition") return true;
    if (sourceFunction?.kind === "loop" && connection.sourceHandle === "loop") return true;
    return targetFunction?.kind === "loop";
  }, [connections, functions, inputs, nodeExists, wouldCreateCycle]);

  const addConnection = useCallback((source: string, target: string, sourceHandle?: BuzzConnection['sourceHandle']) => {
    const connection: BuzzConnection = {
      id: generateUUID(),
      source,
      target,
      sourceHandle: sourceHandle ?? null,
      loop: wouldCreateCycle(source, target),
    };
    updatePipeline(pipeline.id, { connections: [...connections, connection] });
  }, [connections, pipeline.id, updatePipeline, wouldCreateCycle]);

  const onConnect = useCallback((connection: Connection) => {
    if (!isValidConnection(connection)) {
      toast.error("Không thể tạo connection này.");
      return;
    }
    addConnection(connection.source!, connection.target!, connection.sourceHandle as BuzzConnection['sourceHandle']);
  }, [addConnection, isValidConnection]);

  const nextPosition = useCallback(() => {
    if (pendingSource) {
      const source = nodes.find((node) => node.id === pendingSource.id);
      if (source) {
        const branchOffset = pendingSource.handle === "true" || pendingSource.handle === "loop" ? -110
          : pendingSource.handle === "false" || pendingSource.handle === "done" ? 110 : 0;
        return { x: source.position.x + 260, y: source.position.y + branchOffset };
      }
    }
    return { x: 80 + (totalNodes % 3) * 260, y: 100 + Math.floor(totalNodes / 3) * 190 };
  }, [nodes, pendingSource, totalNodes]);

  const addNode = useCallback((item: PickerItem) => {
    const position = nextPosition();
    let newId = "";
    if (item.id === "agent") {
      // Mỗi node Agent mới bắt đầu bằng một preset riêng. User vẫn có thể đổi
      // sang preset cũ ở tab Tham số nếu muốn dùng chung cấu hình.
      const agentId = createAgent();
      const step = newStep(agentId, pipeline.steps.length);
      newId = step.id;
      updatePipeline(pipeline.id, {
        steps: [...pipeline.steps, { ...step, name: "Agent", position, topicInput: false, gate: { ...step.gate, kind: "none" } }],
      });
    } else if (item.family === "input") {
      const kind = item.id.replace("input-", "") as BuzzInputKind;
      const node: BuzzInputNode = { id: generateUUID(), type: "input", kind, name: item.title, position, value: "", path: "" };
      newId = node.id;
      updatePipeline(pipeline.id, { inputNodes: [...inputs, node] });
    } else {
      const kind = item.id === "function-condition" ? "condition" : item.id === "function-loop" ? "loop" : "merge";
      const node: BuzzFunctionNode = {
        id: generateUUID(),
        type: "function",
        kind,
        name: kind === "condition" ? "If" : kind === "loop" ? "Loop" : "Merge",
        position,
        field: "",
        operator: "truthy",
        compareValue: "",
        maxIterations: 3,
      };
      newId = node.id;
      updatePipeline(pipeline.id, { functionNodes: [...functions, node] });
    }
    if (pendingSource && pendingSource.id !== newId) addConnection(pendingSource.id, newId, pendingSource.handle);
    setSelectedNodeId(newId);
    setSelectedNodeIds(new Set([newId]));
    setPendingSource(null);
    setPanelMode("inspector");
  }, [addConnection, createAgent, functions, inputs, nextPosition, pendingSource, pipeline.id, pipeline.steps, updatePipeline]);

  const updateInputNode = useCallback((id: string, patch: Partial<BuzzInputNode>) => {
    updatePipeline(pipeline.id, { inputNodes: inputs.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }, [inputs, pipeline.id, updatePipeline]);

  const updateFunctionNode = useCallback((id: string, patch: Partial<BuzzFunctionNode>) => {
    updatePipeline(pipeline.id, { functionNodes: functions.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }, [functions, pipeline.id, updatePipeline]);

  const updateAgentNode = useCallback((id: string, patch: Partial<BuzzStep>) => {
    updatePipeline(pipeline.id, { steps: pipeline.steps.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }, [pipeline.id, pipeline.steps, updatePipeline]);

  const onNodesChange = useCallback<OnNodesChange<Node<CanvasNodeData>>>((changes) => {
    const selectionChanges = changes.filter((change) => change.type === "select");
    if (selectionChanges.length > 0) {
      setSelectedNodeIds((current) => {
        const next = new Set(current);
        for (const change of selectionChanges) {
          if (change.selected) next.add(change.id);
          else next.delete(change.id);
        }
        return next;
      });
    }
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const autoLayout = useCallback(() => {
    const order = [...inputs, ...functions, ...pipeline.steps];
    const ids = new Set(order.map((item) => item.id));
    const forward = connections.filter((connection) => !connection.loop && ids.has(connection.source) && ids.has(connection.target));
    const incoming = new Map(order.map((item) => [item.id, 0]));
    const outgoing = new Map<string, string[]>();
    for (const connection of forward) {
      incoming.set(connection.target, (incoming.get(connection.target) ?? 0) + 1);
      outgoing.set(connection.source, [...(outgoing.get(connection.source) ?? []), connection.target]);
    }
    const queue = order.filter((item) => (incoming.get(item.id) ?? 0) === 0).map((item) => item.id);
    const depth = new Map(queue.map((id) => [id, 0]));
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const target of outgoing.get(id) ?? []) {
        depth.set(target, Math.max(depth.get(target) ?? 0, (depth.get(id) ?? 0) + 1));
        const nextIncoming = (incoming.get(target) ?? 1) - 1;
        incoming.set(target, nextIncoming);
        if (nextIncoming === 0) queue.push(target);
      }
    }
    const groups = new Map<number, string[]>();
    for (const item of order) {
      const level = depth.get(item.id) ?? 0;
      groups.set(level, [...(groups.get(level) ?? []), item.id]);
    }
    const positions = new Map<string, { x: number; y: number }>();
    for (const [level, group] of groups) {
      group.forEach((id, index) => positions.set(id, { x: 80 + level * 260, y: 100 + (index - (group.length - 1) / 2) * 190 }));
    }
    updatePipeline(pipeline.id, {
      inputNodes: inputs.map((item) => ({ ...item, position: positions.get(item.id)! })),
      functionNodes: functions.map((item) => ({ ...item, position: positions.get(item.id)! })),
      steps: pipeline.steps.map((item) => ({ ...item, position: positions.get(item.id)! })),
    });
    requestAnimationFrame(() => fitAllNodes(300));
  }, [connections, fitAllNodes, functions, inputs, pipeline.id, pipeline.steps, updatePipeline]);

  const selectedInput = inputs.find((item) => item.id === selectedNodeId) ?? null;
  const selectedFunction = functions.find((item) => item.id === selectedNodeId) ?? null;
  const selectedAgent = pipeline.steps.find((item) => item.id === selectedNodeId) ?? null;
  const filteredItems = PICKER_ITEMS.filter((item) => !query.trim()
    || `${item.title} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const editorInputSources = useMemo(() => {
    if (!selectedNodeId) return [];
    const result: EditorInputSource[] = [];
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const input = inputs.find((item) => item.id === id);
      if (input) {
        result.push({
          id: input.id,
          kind: input.kind,
          field: input.kind === "text" ? (vietnamese ? "nội dung" : "content") : (vietnamese ? "đường dẫn" : "path"),
          dataType: input.kind === "text" ? "text" : "path",
          value: input.kind === "text" ? input.value : input.path,
          token: `{{node:${input.id}}}`,
        });
        return;
      }
      const sourceAgent = pipeline.steps.find((item) => item.id === id);
      if (sourceAgent) {
        const outputKind = sourceAgent.outputKind ?? (sourceAgent.outputFile.trim() ? "file" : "text");
        result.push({ id: sourceAgent.id, kind: "agent", field: outputKind === "text" ? (vietnamese ? "kết quả trước" : "previous result") : outputKind === "folder" ? (vietnamese ? "thư mục đầu ra" : "output folder") : (vietnamese ? "tệp đầu ra" : "output file"), dataType: outputKind === "text" ? "text" : "path", value: outputKind === "text" ? (latestNodeOutputs.get(sourceAgent.id) ?? "") : sourceAgent.outputFile, token: `{{node:${sourceAgent.id}}}` });
        return;
      }
      if (functions.some((item) => item.id === id)) {
        connections.filter((connection) => connection.target === id).forEach((connection) => visit(connection.source));
      }
    };
    connections.filter((connection) => connection.target === selectedNodeId).forEach((connection) => visit(connection.source));
    return result;
  }, [connections, functions, inputs, latestNodeOutputs, pipeline.steps, selectedNodeId, vietnamese]);

  return (
    <div className="relative flex h-full min-h-0 bg-background">
      <div className="relative min-w-0 flex-1">
        {totalNodes === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <button type="button" onClick={() => openPicker()} className="pointer-events-auto group text-center">
              <span className="flex size-36 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/70 bg-card/40 text-muted-foreground shadow-sm transition group-hover:border-primary group-hover:text-primary"><Plus className="size-14 stroke-[1.5]" /></span>
              <span className="mt-4 block text-lg font-medium">Thêm node đầu tiên…</span>
            </button>
          </div>
        )}
        <ReactFlow<Node<CanvasNodeData>, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          nodesDraggable={!busy}
          nodesConnectable={!busy}
          panOnDrag={false}
          panActivationKeyCode="Space"
          selectionOnDrag={!busy}
          selectionMode={SelectionMode.Partial}
          onSelectionStart={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setPanelMode(null);
          }}
          onNodeClick={(_event, node) => {
            setSelectedEdgeId(null);
            setSelectedNodeId(node.id);
            setSelectedNodeIds(new Set([node.id]));
            setPanelMode(null);
          }}
          onNodeDoubleClick={(_event, node) => openInspector(node.id)}
          onEdgeClick={(event, edge) => {
            if (busy) return;
            event.stopPropagation();
            setSelectedNodeId(null);
            setSelectedNodeIds(new Set());
            setPanelMode(null);
            setSelectedEdgeId(edge.id);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedNodeIds(new Set());
            setSelectedEdgeId(null);
            setPanelMode(null);
          }}
          onNodeDragStop={(_event, node) => {
            const positions = new Map(
              nodesRef.current
                .filter((item) => item.selected || item.id === node.id)
                .map((item) => [item.id, item.id === node.id ? node.position : item.position]),
            );
            updatePipeline(pipeline.id, {
              inputNodes: inputs.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item),
              functionNodes: functions.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item),
              steps: pipeline.steps.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item),
            });
          }}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onEdgesDelete={(deleted) => { if (!busy) updatePipeline(pipeline.id, { connections: connections.filter((item) => !deleted.some((edge) => edge.id === item.id)) }); }}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
          minZoom={0.25}
          maxZoom={1.8}
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 1.75 }}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background gap={20} size={1} color="hsl(var(--border))" />
          <Panel position="bottom-left" className="m-3 flex gap-2">
            <CanvasControl title="Vừa màn hình" onClick={() => fitAllNodes()}><Maximize className="size-4" /></CanvasControl>
            <CanvasControl title="Phóng to" onClick={() => void zoomIn({ duration: 150 })}><ZoomIn className="size-4" /></CanvasControl>
            <CanvasControl title="Thu nhỏ" onClick={() => void zoomOut({ duration: 150 })}><ZoomOut className="size-4" /></CanvasControl>
            <CanvasControl title="Xếp tự động" onClick={autoLayout} disabled={totalNodes === 0}><Paintbrush className="size-4" /></CanvasControl>
          </Panel>
          <Panel position="bottom-center" className="m-4">
            {busy ? (
              <Button className="h-10 bg-primary px-5 text-primary-foreground shadow-lg hover:bg-primary/90" onClick={onStop}><Loader2 className="size-4 animate-spin" /> {vietnamese ? "Đang chạy…" : "Running…"}</Button>
            ) : (
              <Button className="h-10 bg-primary px-5 text-primary-foreground shadow-lg hover:bg-primary/90" onClick={onExecute} disabled={pipeline.steps.length === 0}><Play className="size-4 fill-current" /> {vietnamese ? "Chạy quy trình" : "Execute workflow"}</Button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {panelMode === "picker" && (
        <NodePicker vietnamese={vietnamese} query={query} onQueryChange={setQuery} items={filteredItems} onPick={addNode} onClose={() => { setPanelMode(null); setPendingSource(null); }} />
      )}
      {panelMode === "inspector" && (selectedInput || selectedFunction || selectedAgent) && (
        <NodeInspector
          inputNode={selectedInput}
          functionNode={selectedFunction}
          agentNode={selectedAgent}
          agents={agents}
          workspacePath={pipeline.workspacePath}
          onUpdateInput={updateInputNode}
          onUpdateFunction={updateFunctionNode}
          onUpdateAgent={updateAgentNode}
          onCreateAgent={createAgent}
          onUpdateAgentPreset={updateAgentPreset}
          inputSources={editorInputSources}
          output={selectedAgent ? (latestNodeOutputs.get(selectedAgent.id) ?? "") : selectedFunction ? (latestNodeOutputs.get(selectedFunction.id) ?? "") : selectedInput?.kind === "text" ? selectedInput.value : selectedInput?.path ?? ""}
          busy={busy}
          running={Boolean((selectedAgent ?? selectedFunction) && busy && runningNodeId === (selectedAgent ?? selectedFunction)?.id)}
          onExecute={() => { const target = selectedAgent ?? selectedFunction; if (target) onExecuteNode(target.id); }}
          onDelete={removeNode}
          onClose={() => { setPanelMode(null); setSelectedNodeId(null); }}
        />
      )}
    </div>
  );
}
