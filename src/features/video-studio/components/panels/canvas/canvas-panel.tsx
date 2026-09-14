"use client";

import { connectedMentionNodes } from '@/features/video-studio/canvas/mentions';

import { groupPorts, expandConnection } from "@/features/video-studio/canvas/group-ports";
import { arrangeNodes } from "@/features/video-studio/canvas/layout";
import { groupDragMoves } from "@/features/video-studio/canvas/drag";
import { TemplateLibrary } from "./template-library";

/**
 * The Canvas tab.
 *
 * A space is a DAG of generation nodes: each node holds its own prompt, model
 * and ratio, and hands its result to whatever is wired downstream. Running a
 * node pulls in the upstream work it needs and reuses anything still valid, so
 * pressing play on the last node never silently regenerates the reference the
 * earlier nodes were built against.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ConnectionLineType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStore,
  type Connection,
  type Edge,
  type FinalConnectionState,
} from "@xyflow/react";
import { LayoutGrid, Square, Sparkles, Group, Ungroup, Undo2, Redo2, ChevronLeft, Loader2, Maximize, MousePointer2, Play, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/features/video-studio/canvas/canvas-store";
import { canConnect, resolveInputs, nodeCandidates, nodeValues } from "@/features/video-studio/canvas/graph";
import { cancelNode, cancelSpace, runNodes, EMPTY_PROMPT, runNode, runSpace } from "@/features/video-studio/canvas/runner";
import { NODE_SPECS, nodeSpec, isGenerator, outputTypeOf, type CanvasNodeKind, type CanvasNodeState, type CanvasEdgeState, type PortType } from "@/features/video-studio/canvas/types";
import { saveBlobToBrowserStorage } from "@/features/video-studio/lib/browser-image-storage";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { Button } from "@/shared/components/ui/button";
import { useI18n } from "@/shared/i18n";
import { CanvasGraphEdge, CanvasGraphNode, PORT_TONES, type CanvasFlowEdge, type CanvasFlowNode } from "./canvas-node";
import { NodePicker, PICKER_HEIGHT, PICKER_WIDTH } from "./node-picker";
import { SpaceList } from "./space-list";
import { CanvasAssistantPanel } from "./assistant-panel";
import { SpaceTransfer } from "./space-transfer";
import "./canvas.css";

let copiedGraph: { token: string; nodes: CanvasNodeState[]; edges: CanvasEdgeState[]; pastes: number } | null = null;
const nodeTypes = { canvasNode: CanvasGraphNode };
const edgeTypes = { canvasEdge: CanvasGraphEdge };

/** Where a node dropped from the picker lands relative to the node it came from. */
const NEXT_NODE_OFFSET = { x: 360, y: 0 };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

interface PickerState {
  /** Screen position inside the canvas wrapper. */
  at: { x: number; y: number };
  /** Where the new node is placed, in flow coordinates. */
  flowPosition: { x: number; y: number };
  /** Set when the picker was opened by dropping a wire. */
  from?: { nodeId: string; type: PortType };
}

export function CanvasPanel() {
  const activeSpaceId = useCanvasStore((state) => state.activeSpaceId);
  const exists = useCanvasStore((state) => state.spaces.some((candidate) => candidate.id === state.activeSpaceId));

  if (!activeSpaceId || !exists) return <SpaceList />;

  return (
    <ReactFlowProvider key={activeSpaceId}>
      <SpaceEditor spaceId={activeSpaceId} />
    </ReactFlowProvider>
  );
}

function SpaceEditor({ spaceId }: { spaceId: string }) {
  const { t } = useI18n();
  const space = useCanvasStore((state) => state.spaces.find((candidate) => candidate.id === spaceId));
  const undoCount = useCanvasStore((state) => state.undoStacks[spaceId]?.length || 0);
  const redoCount = useCanvasStore((state) => state.redoStacks[spaceId]?.length || 0);
  const openSpace = useCanvasStore((state) => state.openSpace);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, screenToFlowPosition, flowToScreenPosition, setCenter, getZoom } = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<CanvasFlowNode>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<CanvasFlowEdge>([]);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [dropping, setDropping] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const pastedSelection = useRef<Set<string> | null>(null);
  const editingText = (target: EventTarget | null) => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="listbox"]');
  const copyNodes = (event: React.ClipboardEvent) => {
    if (editingText(event.target) || !space) return;
    const ids = new Set(rfNodes.filter((node) => node.selected).map((node) => node.id));
    for (const node of space.nodes) if (node.groupId && ids.has(node.groupId)) ids.add(node.id);
    if (!ids.size) return;
    const token = `video-studio-canvas:${crypto.randomUUID()}`;
    copiedGraph = { token, nodes: structuredClone(space.nodes.filter((node) => ids.has(node.id))),
      edges: structuredClone(space.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))), pastes: 0 };
    event.preventDefault();
    event.clipboardData.setData("text/plain", token);
  };
  const pasteNodes = (event: React.ClipboardEvent) => {
    if (editingText(event.target) || !copiedGraph || event.clipboardData.getData("text/plain") !== copiedGraph.token) return;
    event.preventDefault();
    pastedSelection.current = new Set(useCanvasStore.getState().pasteNodes(spaceId, copiedGraph.nodes, copiedGraph.edges, 48 * ++copiedGraph.pastes));
  };

  const selectedIds = rfNodes.filter((node) => node.selected).map((node) => node.id);
  const highlightedIds = new Set([...selectedIds, ...(space?.nodes.filter((node) => node.groupId && selectedIds.includes(node.groupId)).map((node) => node.id) || [])]);
  const focusSource = useCallback((id: string) => {
    const current = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
    const node = current?.nodes.find((node) => node.id === id);
    if (!node) return;
    if (node.groupId) useCanvasStore.getState().updateNode(spaceId, node.groupId, { collapsed: false });
    pastedSelection.current = new Set([id]);
    setRfNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === id })));
    void setCenter(node.position.x + 130, node.position.y + 100, { zoom: Math.max(getZoom(), 0.85), duration: 180 });
  }, [spaceId, setRfNodes, setCenter, getZoom]);
  const movePreview = (moves: CanvasFlowNode[]) => {
    const current = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
    if (!current || !moves.some((node) => node.data.state.kind === 'group')) return;
    const expanded = groupDragMoves(current.nodes, moves);
    setRfNodes((nodes) => nodes.map((node) => { const move = expanded.find((move) => move.id === node.id); return move ? { ...node, position: move.position, dragging: true } : node; }));
  };
  const finishMove = (moves: CanvasFlowNode[]) => {
    setRfNodes((nodes) => nodes.map((node) => node.dragging ? { ...node, dragging: false } : node));
    useCanvasStore.getState().moveNodes(spaceId, moves.map((node) => ({ id: node.id, position: node.position })));
  };

  const run = useCallback(async (nodeId: string) => {
    try {
      await runNode(spaceId, nodeId);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message === "VIDEO_REF_INPUT_INVALID" ? t("canvas.videoRefInvalid") : message === "VIDEO_REF_UNAVAILABLE" ? t("canvas.videoRefUnavailable") : message === "VIDEO_START_REQUIRED" ? t("canvas.videoStartRequired") : message === "INPUT_REQUIRED" ? t("canvas.error.inputRequired") : message === "LIST_LENGTH_MISMATCH" ? t("canvas.error.listMismatch") : message === "LOCAL_IMAGE_REQUIRED" ? t("canvas.error.localImageRequired") : message === EMPTY_PROMPT ? t("canvas.error.emptyPrompt") : t("canvas.error.runFailed", { message }));
    }
  }, [spaceId, t]);

  /**
   * Store the picked files and hang their paths on the node.
   *
   * Saved through imageStorage rather than kept as base64: a space lives in
   * localStorage, and two attached photos of any size would blow that budget.
   */
  const attach = useCallback(async (nodeId: string, files: FileList) => {
    try {
      const node = useCanvasStore.getState().spaces.find((space) => space.id === spaceId)?.nodes.find((node) => node.id === nodeId);
      if (!node) return;
      const kind = node.kind;
      const isLocal = kind === "localImage" || kind === "localVideo";
      const video = kind === "localVideo" || (kind === "list" && node.valueType === "video");
      const chosen = isLocal ? [...files].slice(0, 1) : [...files];
      if (chosen.some((file) => !file.type.startsWith(video ? "video/" : "image/"))) throw new Error(t("canvas.error.mediaOnly", { name: '' }));
      const paths = await Promise.all(chosen.map(async (file) => video ? saveBlobToBrowserStorage(file, file.name) : saveImageToLocal(await readFileAsDataUrl(file), "canvas", file.name)));
      const store = useCanvasStore.getState();
      if (isLocal && paths[0]) store.setLocalImage(spaceId, nodeId, paths[0]);
      else if (kind === "list") {
        const current = store.spaces.find((space) => space.id === spaceId)?.nodes.find((node) => node.id === nodeId);
        store.updateNode(spaceId, nodeId, { items: [...(current?.items || []), ...paths].slice(0, 100) });
      } else store.addRefs(spaceId, nodeId, paths);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("canvas.error.uploadFailed", { message }));
    }
  }, [spaceId, t]);

  const dropMedia = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    setDropping(false);
    const files = [...event.dataTransfer.files];
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setPicker(null);
    for (const [index, file] of files.entries()) {
      const kind = file.type.startsWith("image/") ? "localImage" : file.type.startsWith("video/") ? "localVideo" : null;
      if (!kind) { toast.error(t("canvas.error.mediaOnly", { name: file.name })); continue; }
      try {
        const url = kind === "localVideo" ? await saveBlobToBrowserStorage(file, file.name)
          : await saveImageToLocal(await readFileAsDataUrl(file), "canvas", file.name);
        const store = useCanvasStore.getState();
        if (!store.spaces.some((space) => space.id === spaceId)) return;
        const id = store.addNode(spaceId, kind, { x: position.x + index * 280, y: position.y });
        store.setLocalImage(spaceId, id, url);
      } catch (error) {
        toast.error(t("canvas.error.uploadFailed", { message: `${file.name}: ${error instanceof Error ? error.message : String(error)}` }));
      }
    }
  };

  /**
   * Place the palette at the flow point the node will land on, then pull it back
   * inside the canvas so a drop near the right or bottom edge does not open a
   * palette half off screen.
   */
  const openPicker = useCallback((flowPosition: { x: number; y: number }, from?: PickerState["from"]) => {
    const bounds = wrapperRef.current?.getBoundingClientRect();
    const screen = flowToScreenPosition(flowPosition);
    const raw = bounds ? { x: screen.x - bounds.left, y: screen.y - bounds.top } : { x: 80, y: 80 };
    const at = bounds
      ? {
        x: Math.max(8, Math.min(raw.x, bounds.width - PICKER_WIDTH - 8)),
        y: Math.max(8, Math.min(raw.y, bounds.height - PICKER_HEIGHT - 8)),
      }
      : raw;
    setPicker({ at, flowPosition, from });
  }, [flowToScreenPosition]);

  const openContextPicker = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPicker({
      at: {
        x: Math.max(8, Math.min(event.clientX - bounds.left + 8, bounds.width - PICKER_WIDTH - 8)),
        y: Math.max(8, Math.min(event.clientY - bounds.top, bounds.height - PICKER_HEIGHT - 8)),
      },
      flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    });
  }, [screenToFlowPosition]);

  // Rebuild the React Flow arrays whenever the stored graph changes, carrying
  // the current selection across so an edit does not deselect what the user is
  // working on. Positions are not carried: a drag in progress has not reached
  // the store yet, and a drag that finished already wrote to it.
  useEffect(() => {
    if (!space) return;
    const store = useCanvasStore.getState();
    const newSelection = pastedSelection.current;
    pastedSelection.current = null;
    setRfNodes((current) => {
      const selected = newSelection ?? new Set(current.filter((node) => node.selected).map((node) => node.id));
      for (const group of space.nodes.filter((node) => node.kind === 'group' && node.collapsed)) {
        const children = space.nodes.filter((node) => node.groupId === group.id);
        if (children.some((node) => selected.has(node.id))) selected.add(group.id);
        children.forEach((node) => selected.delete(node.id));
      }
      return space.nodes.map((node) => {
        const { mediaByPort } = resolveInputs(space.nodes, space.edges, node.id);
        return {
          id: node.id,
          type: "canvasNode",
          zIndex: node.kind === "group" ? -1 : 0,
          hidden: !!node.groupId && !!space.nodes.find((group) => group.id === node.groupId)?.collapsed,
          style: node.kind === "group" ? { width: node.collapsed ? 280 : node.width || 320, height: node.collapsed ? 65 + 28 * Math.max(groupPorts(space, node.id).filter((p) => p.direction === "source").length, groupPorts(space, node.id).filter((p) => p.direction === "target").length) : node.height || 200 } : undefined,
          dragging: current.find((item) => item.id === node.id)?.dragging,
          position: current.find((item) => item.id === node.id && item.dragging)?.position ?? node.position,
          selected: selected.has(node.id),
          data: {
            state: node,
            mentionOptions: connectedMentionNodes(space.nodes, space.edges, node.id).map((source) => ({ id: source.id, label: source.name || `${t(NODE_SPECS[source.kind].labelKey)} #${source.index}` })),
            groupPorts: node.kind === "group" ? groupPorts(space, node.id).map((port) => { const member = space.nodes.find((n) => n.id === port.nodeId)!; return { ...port, label: member.name || `${t(NODE_SPECS[member.kind].labelKey)} #${member.index}` }; }) : undefined,
            onExtractFrame: async (blob) => {
              const url = await saveBlobToBrowserStorage(blob, "video-frame.png");
              const current = useCanvasStore.getState();
              const id = current.addNode(spaceId, "localImage", { x: node.position.x + 350, y: node.position.y });
              current.setLocalImage(spaceId, id, url);
            },
            values: nodeCandidates(space.nodes, space.edges, node),
            hasOutgoing: space.edges.some((edge) => edge.source === node.id),
            connectedPorts: space.edges.filter((edge) => edge.target === node.id).map((edge) => edge.targetHandle),
            inputPreviews: Object.values(mediaByPort).flat(),
            textInputs: space.edges
              .filter((edge) => edge.target === node.id && edge.targetHandle === "prompt")
              .flatMap((edge) => {
                const source = space.nodes.find((candidate) => candidate.id === edge.source);
                return source && outputTypeOf(source) === "text"
                  ? [{ edgeId: edge.id, index: source.index, name: source.name || `${t(NODE_SPECS[source.kind].labelKey)} #${source.index}`, prompt: nodeValues(space.nodes, space.edges, source.id).join("\n") }]
                  : [];
              }),
            onDisconnectInput: (edgeId) => store.disconnect(spaceId, edgeId),
            onFocusInput: (edgeId) => { const edge = space.edges.find((edge) => edge.id === edgeId); if (edge) focusSource(edge.source); },
            onFocusMedia: (url) => { const edge = space.edges.find((edge) => edge.target === node.id && nodeValues(space.nodes, space.edges, edge.source).includes(url)); if (edge) focusSource(edge.source); },
            onChange: (patch) => store.updateNode(spaceId, node.id, patch),
            onUpload: (files) => void attach(node.id, files),
            onRemoveRef: (path) => store.removeRef(spaceId, node.id, path),
            onRun: () => void run(node.id),
            onCancel: () => cancelNode(node.id),
            onSelectOutput: (output) => store.selectOutput(spaceId, node.id, output),
            onDuplicate: () => store.duplicateNode(spaceId, node.id),
            onDelete: () => { cancelNode(node.id); store.removeNode(spaceId, node.id); },
            onAddNext: () => {
              const produced = outputTypeOf(node);
              openPicker(
                { x: node.position.x + NEXT_NODE_OFFSET.x, y: node.position.y + NEXT_NODE_OFFSET.y },
                produced ? { nodeId: node.id, type: produced } : undefined,
              );
            },
          },
        };
      });
    });
    setRfEdges((current) => {
      const selected = new Set(current.filter((edge) => edge.selected).map((edge) => edge.id));
      return space.edges.map((edge) => {
        const source = space.nodes.find((node) => node.id === edge.source);
        const carried = source ? outputTypeOf(source) : null;
        const target = space.nodes.find((node) => node.id === edge.target);
        const sourceGroup = source?.groupId && space.nodes.find((node) => node.id === source.groupId && node.collapsed);
        const targetGroup = target?.groupId && space.nodes.find((node) => node.id === target.groupId && node.collapsed);
        return {
          id: edge.id,
          source: sourceGroup ? sourceGroup.id : edge.source,
          target: targetGroup ? targetGroup.id : edge.target,
          hidden: !!sourceGroup && !!targetGroup && sourceGroup.id === targetGroup.id,
          sourceHandle: sourceGroup ? `out:${edge.source}` : "out",
          targetHandle: targetGroup ? `in:${edge.target}:${edge.targetHandle}` : edge.targetHandle,
          type: "canvasEdge",
          selected: selected.has(edge.id),
          style: { stroke: carried ? PORT_TONES[carried].wire : undefined, strokeWidth: 1.5, strokeDasharray: source?.kind === "list" ? "5 4" : undefined },
          data: { onDelete: (id: string) => store.disconnect(spaceId, id) },
        };
      });
    });
  }, [space, spaceId, run, attach, openPicker, setRfNodes, setRfEdges, t, focusSource]);

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const current = useCanvasStore.getState().spaces.find((candidate) => candidate.id === spaceId);
    if (!current) return false;
    return canConnect(current.nodes, current.edges, {
      ...expandConnection(connection),
    });
  }, [spaceId]);

  const onConnect = useCallback((connection: Connection) => {
    useCanvasStore.getState().connect(spaceId, expandConnection(connection));
  }, [spaceId]);

  /**
   * A wire let go over empty canvas is a request for a node, not a mistake —
   * offer the kinds that can actually take what the wire carries.
   */
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
    if (state.isValid || state.fromHandle?.type !== "source" || !state.fromNode) return;
    const current = useCanvasStore.getState().spaces.find((candidate) => candidate.id === spaceId);
    const sourceId = state.fromHandle?.id?.startsWith("out:") ? state.fromHandle.id.split(":")[1] : state.fromNode!.id;
    const source = current?.nodes.find((node) => node.id === sourceId);
    const produced = source ? outputTypeOf(source) : null;
    if (!source || !produced) return;
    const point = "changedTouches" in event ? event.changedTouches[0] : event;
    openPicker(
      screenToFlowPosition({ x: point.clientX, y: point.clientY }),
      { nodeId: source.id, type: produced },
    );
  }, [spaceId, openPicker, screenToFlowPosition]);

  const handlePick = useCallback((kind: CanvasNodeKind) => {
    if (!picker) return;
    const store = useCanvasStore.getState();
    const nodeId = store.addNode(spaceId, kind, picker.flowPosition);
    if (picker.from) {
      if (["list", "router", "selectResult"].includes(kind)) store.updateNode(spaceId, nodeId, { valueType: picker.from.type });
      const added = useCanvasStore.getState().spaces.find((space) => space.id === spaceId)?.nodes.find((node) => node.id === nodeId);
      const port = (added ? nodeSpec({ ...added, valueType: picker.from.type }) : NODE_SPECS[kind]).inputs.find((candidate) => candidate.type === picker.from!.type);
      if (port) store.connect(spaceId, { source: picker.from.nodeId, target: nodeId, targetHandle: port.id });
    }
    setPicker(null);
  }, [picker, spaceId]);

  const handleRunAll = useCallback(async (selected?: string[]) => {
    setRunningAll(true);
    try {
      if (selected) {
        const current = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
        const ids = current?.nodes.filter((node) => selected.includes(node.id) || (node.groupId && selected.includes(node.groupId))).filter((node) => isGenerator(node.kind)).map((node) => node.id) || [];
        await runNodes(spaceId, ids);
      } else await runSpace(spaceId);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message === "VIDEO_REF_INPUT_INVALID" ? t("canvas.videoRefInvalid") : message === "VIDEO_REF_UNAVAILABLE" ? t("canvas.videoRefUnavailable") : message === "VIDEO_START_REQUIRED" ? t("canvas.videoStartRequired") : message === "INPUT_REQUIRED" ? t("canvas.error.inputRequired") : message === "LIST_LENGTH_MISMATCH" ? t("canvas.error.listMismatch") : message === "LOCAL_IMAGE_REQUIRED" ? t("canvas.error.localImageRequired") : message === EMPTY_PROMPT ? t("canvas.error.emptyPrompt") : t("canvas.error.runFailed", { message }));
    } finally {
      setRunningAll(false);
    }
  }, [spaceId, t]);

  const addFromToolbar = useCallback(() => {
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    openPicker(screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 3,
    }));
  }, [openPicker, screenToFlowPosition]);

  const busy = useMemo(
    () => runningAll || (space?.nodes.some((node) => node.status === "running") ?? false),
    [runningAll, space],
  );

  if (!space) return <SpaceList />;

  return (
    <div className="canvas-workspace flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => openSpace(null)}>
          <ChevronLeft className="mr-1 size-4" />
          {t("canvas.spaces.back")}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {space.name || t("canvas.spaces.untitled")}
        </span>
        {selectedIds.length > 0 && <>
          <Button variant="ghost" size="icon" title={t("canvas.group")} aria-label={t("canvas.group")} disabled={busy} onClick={() => useCanvasStore.getState().groupNodes(spaceId, selectedIds, t("canvas.node.group"))}><Group className="size-4" /></Button>
          <Button variant="ghost" size="icon" title={t("canvas.ungroup")} aria-label={t("canvas.ungroup")} disabled={busy} onClick={() => useCanvasStore.getState().ungroupNodes(spaceId, selectedIds)}><Ungroup className="size-4" /></Button>
          <Button variant="secondary" size="sm" disabled={busy || !space.nodes.some((node) => (isGenerator(node.kind)) && (selectedIds.includes(node.id) || (node.groupId && selectedIds.includes(node.groupId))))} onClick={() => void handleRunAll(selectedIds)}>{t("canvas.runSelected")}</Button>
        </>}
        {busy && <Button variant="destructive" size="sm" onClick={() => cancelSpace(spaceId)}><Square className="mr-1 size-3" />{t("canvas.stop")}</Button>}
        <Button
          size="sm"
          onClick={() => void handleRunAll()}
          disabled={busy || space.nodes.length === 0}
        >
          {runningAll ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Play className="mr-1.5 size-3.5 fill-current" />}
          {t("canvas.toolbar.runAll")}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <div ref={wrapperRef} tabIndex={0}
        onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDropping(true); } }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false); }}
        onDrop={(event) => void dropMedia(event)}
        onKeyDown={(event) => {
          if (!editingText(event.target) && !event.ctrlKey && !event.metaKey && event.key === '/') { event.preventDefault(); addFromToolbar(); return; }
          if (editingText(event.target) || !(event.ctrlKey || event.metaKey)) return;
          const key = event.key.toLowerCase();
          if (key !== "z" && key !== "y") return;
          event.preventDefault(); event.stopPropagation();
          if (key === "y" || event.shiftKey) useCanvasStore.getState().redo(spaceId);
          else useCanvasStore.getState().undo(spaceId);
        }}
        onCopy={copyNodes} onPaste={pasteNodes}
        onPointerDownCapture={(event) => { if (!editingText(event.target)) event.currentTarget.focus({ preventScroll: true }); }}
        className="relative min-h-0 flex-1 outline-none">
        <ReactFlow<CanvasFlowNode, CanvasFlowEdge>
          nodes={rfNodes.map((node) => node.data.state.kind === 'group' ? node : { ...node, zIndex: node.selected ? 10 : 0 })}
          elevateNodesOnSelect={false}
          edges={rfEdges.map((edge) => ({ ...edge, style: { ...edge.style, opacity: selectedIds.length && !highlightedIds.has(edge.source) && !highlightedIds.has(edge.target) ? 0.18 : 1 } }))}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDrag={(_event, _node, nodes) => movePreview(nodes)}
          onSelectionDrag={(_event, nodes) => movePreview(nodes)}
          onNodeDragStop={(_event, _node, nodes) => finishMove(nodes)}
          onSelectionDragStop={(_event, nodes) => finishMove(nodes)}
          onDelete={({ nodes, edges }) => { for (const node of nodes) cancelNode(node.id); useCanvasStore.getState().removeElements(spaceId, nodes.map((node) => node.id), edges.map((edge) => edge.id)); }}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          isValidConnection={isValidConnection}
          onPaneClick={() => setPicker(null)}
          onPaneContextMenu={openContextPicker}
          connectOnClick={false}
          panOnDrag={[1]}
          panActivationKeyCode={null}
          selectionOnDrag
          nodeDragThreshold={5}
          nodeClickDistance={5}
          selectionMode={SelectionMode.Partial}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultViewport={space.viewport}
          onMoveEnd={(_event, viewport) => useCanvasStore.getState().setViewport(spaceId, viewport)}
          fitView={!space.viewport}
          fitViewOptions={{ padding: 0.4, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={1.8}
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
          proOptions={{ hideAttribution: true }}
          className={zoom < 0.55 ? "canvas-surface canvas-zoom-far" : "canvas-surface"}
        >
          <Background gap={28} size={0.7} color="hsl(var(--foreground) / 0.18)" />

          <Panel position="top-left" className="canvas-tool-rail m-3">
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-lg">
              <RailButton title={t("canvas.toolbar.add")} onClick={addFromToolbar}>
                <Plus className="size-4" />
              </RailButton>
              <span className="my-0.5 h-px w-6 bg-border/60" />
              <span title={t("canvas.toolbar.hint")} className="flex size-7 items-center justify-center rounded-full bg-accent text-foreground">
                <MousePointer2 className="size-3.5" />
              </span>
              <span className="my-0.5 h-px w-6 bg-border/60" />
              <RailButton title={t("canvas.toolbar.fit")} onClick={() => void fitView({ padding: 0.3, duration: 200 })}>
                <Maximize className="size-4" />
              </RailButton>
              <RailButton title={t("canvas.toolbar.zoomIn")} onClick={() => void zoomIn({ duration: 150 })}>
                <ZoomIn className="size-4" />
              </RailButton>
              <RailButton title={t("canvas.toolbar.zoomOut")} onClick={() => void zoomOut({ duration: 150 })}>
                <ZoomOut className="size-4" />
              </RailButton>
              <span className="my-0.5 h-px w-6 bg-border/60" />
        <Button variant="ghost" size="icon" title={t("canvas.undo")} aria-label={t("canvas.undo")} disabled={!undoCount || busy} onClick={() => useCanvasStore.getState().undo(spaceId)}><Undo2 className="size-4" /></Button>
        <Button variant="ghost" size="icon" title={t("canvas.redo")} aria-label={t("canvas.redo")} disabled={!redoCount || busy} onClick={() => useCanvasStore.getState().redo(spaceId)}><Redo2 className="size-4" /></Button>
        <SpaceTransfer spaceId={spaceId} vertical />
        <TemplateLibrary spaceId={spaceId} selected={selectedIds} position={() => { const bounds = wrapperRef.current?.getBoundingClientRect(); return screenToFlowPosition({ x: (bounds?.left || 0) + 150, y: (bounds?.top || 0) + 100 }); }} onInsert={(ids) => { pastedSelection.current = new Set(ids); }} />
        <Button variant="ghost" size="icon" disabled={busy} aria-label={t("canvas.arrange")} title={t("canvas.arrange")} onClick={() => useCanvasStore.getState().moveNodes(spaceId, arrangeNodes(space, selectedIds))}><LayoutGrid className="size-4" /></Button>
        <Button variant="ghost" size="icon" title={t("canvas.ai.title")} aria-label={t("canvas.ai.title")} onClick={() => setAssistantOpen((open) => !open)}><Sparkles className="size-4" /></Button>
            </div>
          </Panel>

          <Panel position="bottom-left" className="m-3">
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
              {t(space.nodes.length === 1 ? "canvas.spaces.nodeCountOne" : "canvas.spaces.nodeCount", { count: space.nodes.length })}
            </span>
          </Panel>

          <Panel position="bottom-right" className="m-3">
            <span className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground shadow-sm">
              {Math.round(zoom * 100)}%
            </span>
          </Panel>
        </ReactFlow>

        {dropping && <div className="pointer-events-none absolute inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-background/80 text-sm font-medium">{t("canvas.dropMedia")}</div>}
        {picker && (
          <NodePicker
            key={`${picker.at.x}:${picker.at.y}`}
            at={picker.at}
            accepts={picker.from?.type}
            onPick={handlePick}
            onClose={() => setPicker(null)}
            onContextMenu={openContextPicker}
          />
        )}
      </div>
      {assistantOpen && <CanvasAssistantPanel spaceId={spaceId} selected={selectedIds} onClose={() => setAssistantOpen(false)} />}
      </div>
    </div>
  );
}

function RailButton({ title, onClick, active, children }: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={
        active
          ? "flex size-9 items-center justify-center rounded-xl bg-accent text-foreground transition"
          : "flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
