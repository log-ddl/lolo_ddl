import { NodeAccountPicker } from './node-account-picker';
import { effectivePrompt } from '@/features/video-studio/canvas/graph';
"use client";

import { ImageEditControls } from "./image-edit-controls";
import { ImageDownloadMenu } from './image-download-menu';
import { UpscaleNodeControls } from './upscale-node-controls';

import { videoDuration, videoDurations } from '@/features/video-studio/lib/ai/video-duration';
import { configuredImageModel, configuredVideoModel, videoPlatformForModel } from '@/features/video-studio/lib/ai/media-routing';
import { CompareResults } from "./compare-results";
import { extractVideoFrame } from "@/features/video-studio/canvas/video-frame";
import type { GroupPort } from "@/features/video-studio/canvas/group-ports";

/**
 * How a canvas node and a canvas wire are drawn.
 *
 * The node mirrors what it will actually send: the preview shows the last
 * result, the chips above the prompt show the references arriving through
 * wires, and the prompt box shows only what this node adds on top. The
 * Generation controls remain visible so running and configuring a node do not
 * require discovering a hidden selection toolbar.
 */

import { MentionEditor, type MentionOption } from "./mention-editor";
import { PromptBox } from "./prompt-box";
import { UtilityNode } from "./utility-node";
import { OutputNode } from "./output-node";
import { AiNodeControls } from './ai-node';
import { mediaFileStem } from '@/features/video-studio/canvas/media-filename';
import { memo, useEffect, useRef, useState } from "react";
import {
  BaseEdge, useUpdateNodeInternals,
  EdgeLabelRenderer,
  Handle,
  Position,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Pencil, Maximize2, Square, History, Copy, Download, ImageIcon, Loader2, Play, Plus, Trash2, TypeIcon, VideoIcon, X } from "lucide-react";
import { EMPTY_PROMPT } from "@/features/video-studio/canvas/runner";
import {
  CANVAS_ASPECT_RATIOS,
  nodeSpec,
  type CanvasNodeKind,
  type CanvasNodeState,
  type NodeOutput,
  type PortType,
} from "@/features/video-studio/canvas/types";
import { GOOGLE_FLOW_IMAGE_MODELS, GOOGLE_FLOW_VIDEO_MODELS, GROK_VIDEO_MODELS, QWEN_LOCAL_IMAGE_MODEL, getModelDisplayName } from "@/features/video-studio/lib/api-key-manager";
import { toast } from "sonner";
import { mediaBlob, downloadBlob } from "@/features/video-studio/canvas/archive";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { LocalImage } from "@/shared/components/ui/local-image";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

/** Radix and native selects both reject an empty option value, so Auto travels under a sentinel. */
const AUTO_VALUE = "__auto__";
const FRAME_ACTION_CLASS = "min-h-9 cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 enabled:hover:border-primary enabled:hover:bg-primary/15 enabled:hover:shadow-md enabled:active:scale-[0.97] enabled:active:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none motion-reduce:transform-none";

/** Vertical spacing of the input ports down the left edge. */
const PORT_TOP = 20;
const PORT_GAP = 34;

const KIND_ICONS: Record<CanvasNodeKind, typeof ImageIcon> = {
  imageUpscale: Maximize2,
  ai: TypeIcon,
  output: Download,
  reference: ImageIcon, list: TypeIcon, router: TypeIcon, selectResult: ImageIcon, imageEdit: ImageIcon,
  note: TypeIcon,
  group: TypeIcon,
  localVideo: VideoIcon,
  localImage: ImageIcon,
  imageGenerator: ImageIcon,
  videoGenerator: VideoIcon,
  text: TypeIcon,
};

const PORT_ICONS: Record<PortType, typeof ImageIcon> = {
  text: TypeIcon,
  image: ImageIcon,
  video: VideoIcon,
};

/** Wire and port colours by what travels through them. */
const PORT_TONES: Record<PortType, { on: string; wire: string }> = {
  text: { on: "!border-violet-500 !text-violet-500", wire: "#8b5cf6" },
  image: { on: "!border-blue-500 !text-blue-500", wire: "#3b82f6" },
  video: { on: "!border-emerald-500 !text-emerald-500", wire: "#10b981" },
};

export interface CanvasNodeRenderData extends Record<string, unknown> {
  mentionOptions: MentionOption[];
  state: CanvasNodeState;
  upscaleSources?: NodeOutput[];
  values?: string[];
  hasOutgoing?: boolean;
  groupPorts?: GroupPort[];
  onExtractFrame?: (blob: Blob) => Promise<void>;
  /** Input ports that currently have a wire. Drives the filled/hollow port. */
  connectedPorts: string[];
  /** Reference media arriving through wires, shown as chips above the prompt. */
  inputPreviews: string[];
  textInputs: { edgeId: string; index: number; name?: string; prompt: string }[];
  onDisconnectInput: (edgeId: string) => void;
  onFocusInput?: (edgeId: string) => void;
  onFocusMedia?: (url: string) => void;
  onChange: (patch: Partial<CanvasNodeState>) => void;
  onUpload: (files: FileList) => void;
  onRemoveRef: (path: string) => void;
  onRun: () => void;
  onUpscaleImage?: (resolution: '2K' | '4K', download: (output: NodeOutput) => Promise<void>) => Promise<void>;
  onCancel: () => void;
  onSelectOutput: (output: NodeOutput) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddNext: () => void;
}

export type CanvasFlowNode = Node<CanvasNodeRenderData>;
export type CanvasFlowEdge = Edge<{ onDelete: (id: string) => void }>;

export const CanvasGraphNode = memo(function CanvasGraphNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { t } = useI18n();
  const { state, connectedPorts, inputPreviews, textInputs, onDisconnectInput, onChange, onUpload, onRemoveRef, onRun, onCancel, onSelectOutput, onDuplicate, onDelete, onAddNext } = data;
  const usesFinalPrompt = ['ai', 'imageGenerator', 'videoGenerator'].includes(state.kind);
  const displayedPrompt = usesFinalPrompt ? effectivePrompt(state, textInputs.map((input) => input.prompt)) : state.prompt;
  const commitPrompt = (prompt: string) => {
    if (prompt === displayedPrompt) return;
    onChange({ prompt, ...(usesFinalPrompt ? { promptIsFinal: true } : {}) });
  };
  const spec = nodeSpec(state);
  const updateInternals = useUpdateNodeInternals();
  const portsKey = data.groupPorts?.map((port) => port.id).join(",");
  useEffect(() => { const frame = requestAnimationFrame(() => updateInternals(state.id)); return () => cancelAnimationFrame(frame); }, [state.id, state.collapsed, state.valueType, portsKey, updateInternals]);
  const Icon = KIND_ICONS[state.kind];
  const outputPress = useRef<{ x: number; y: number } | null>(null);
  const imagePress = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [extracting, setExtracting] = useState(false);
  const captureFrame = async (time: number | "last") => {
    if (!state.output || extracting) return;
    setExtracting(true);
    try { await data.onExtractFrame?.(await extractVideoFrame(state.output.url, time)); } catch (error) { toast.error(error instanceof Error ? error.message : String(error)); } finally { setExtracting(false); }
  };
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [naming, setNaming] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ url: string; width: number; height: number } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const download = async (output = state.output) => {
    if (!output || downloading) return;
    setDownloading(true);
    try {
      const blob = await mediaBlob(output.url);
      const extension = blob.type.split("/")[1]?.split(";")[0] || (output.kind === "video" ? "mp4" : "png");
      const suffix = output.upscaleResolution ? `-${output.upscaleResolution}` : '';
      downloadBlob(blob, `${mediaFileStem(state.name || `${t(spec.labelKey)} #${state.index}`)}${suffix}.${extension}`);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("canvas.error.downloadFailed"));
    } finally { setDownloading(false); }
  };
  const running = state.status === "running";
  const isLocalVideo = state.kind === "localVideo";
  const isLocal = state.kind === "localImage" || isLocalVideo;
  const resolvedOutput = useResolvedImageUrl(state.output?.url);
  const resolvedPreview = useResolvedImageUrl(preview);
  const isImageEdit = state.kind === "imageEdit";
  const isUpscale = state.kind === 'imageUpscale';
  const isAi = state.kind === 'ai';
  const isText = state.kind === "text" || state.kind === "note";
  const [qwenReady, setQwenReady] = useState(false);
  useEffect(() => {
    void window.qwenImage?.status().then((status) => setQwenReady(status.installed));
  }, []);
  const models = state.kind === "videoGenerator" ? [...GOOGLE_FLOW_VIDEO_MODELS, ...GROK_VIDEO_MODELS] : qwenReady ? [...GOOGLE_FLOW_IMAGE_MODELS, QWEN_LOCAL_IMAGE_MODEL] : GOOGLE_FLOW_IMAGE_MODELS;
  const selectedVideoModel = state.kind === 'videoGenerator' ? state.model || configuredVideoModel() || 'Veo_3.1-Fast' : '';
  const isGrokVideo = state.kind === 'videoGenerator' && videoPlatformForModel(selectedVideoModel) === 'grok';
  const isQwenImage = state.kind === 'imageGenerator' && (state.model || configuredImageModel('scene_generation')) === QWEN_LOCAL_IMAGE_MODEL;

  if (state.kind === 'output') return <OutputNode data={data} selected={selected} />;
  if (["reference", "list", "router", "selectResult"].includes(state.kind)) return <UtilityNode data={data} selected={selected} />;

  if (state.kind === "group") return (
    <div className="h-full w-full rounded-2xl border border-dashed border-primary/40 bg-card/80">
      <div className="flex items-center gap-1 p-2"><input defaultValue={state.name || t("canvas.node.group")} key={state.name} aria-label={t("canvas.rename")} onBlur={(event) => onChange({ name: event.target.value.trim() })} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") event.currentTarget.blur(); }} className="nodrag nopan min-w-0 flex-1 rounded bg-background/80 px-2 py-1 text-xs font-medium outline-none" />
      <button className="nodrag nopan rounded p-1 text-xs" aria-label={t(state.collapsed ? "canvas.expand" : "canvas.collapse")} title={t(state.collapsed ? "canvas.expand" : "canvas.collapse")} onClick={() => onChange({ collapsed: !state.collapsed })}>{state.collapsed ? '＋' : '−'}</button></div>
      {state.collapsed && <div className="flex justify-between px-3 text-[10px] text-muted-foreground">{(['target', 'source'] as const).map((direction) => <div key={direction} className="w-[45%]">{data.groupPorts?.filter((port) => port.direction === direction).map((port, index) => <div key={port.id} className="h-7 truncate" title={port.label}>{port.label}<Handle id={port.id} type={direction} position={direction === 'source' ? Position.Right : Position.Left} style={{ top: 50 + index * 28 }} className={`!size-5 !border-2 !bg-card ${PORT_TONES[port.type].on}`} title={port.label} /></div>)}</div>)}</div>}
    </div>
  );

  return (
    <div className={cn("canvas-compact-node relative", selected && "is-selected", state.kind === "note" && "canvas-note", !state.output && "is-empty", isText ? "canvas-text-node w-[240px]" : isLocal ? "canvas-local-node w-[220px]" : "w-[280px]")}>

      <div className="canvas-node-title absolute -top-7 left-0 flex h-7 w-full cursor-grab select-none items-center gap-1.5 px-3 text-[10px] font-medium active:cursor-grabbing">
        <Icon className="size-3" />
        {naming ? <input autoFocus defaultValue={state.name || `${t(spec.labelKey)} #${state.index}`} className="nodrag nopan w-full rounded bg-card px-1 outline-none" aria-label={t("canvas.rename")} onBlur={(event) => { onChange({ name: event.target.value.trim() }); setNaming(false); }} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setNaming(false); }} />
          : <span title={t("canvas.rename")} onDoubleClick={(event) => { event.stopPropagation(); setNaming(true); }} className="truncate">{state.name || `${t(spec.labelKey)} #${state.index}`}</span>}
      </div>
      {selected && (
        <div className="canvas-node-actions nodrag nopan absolute -top-16 left-0 z-20 flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-lg">
          {!isText && !isLocal && (
            <NodeToolButton title={t("canvas.node.run")} onClick={onRun} disabled={running}>
              {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />}
            </NodeToolButton>
          )}
          <NodeToolButton title={t("canvas.rename")} onClick={() => setNaming(true)}><Pencil className="size-3.5" /></NodeToolButton>
          {!isLocal && !isImageEdit && !isUpscale && <NodeToolButton title={t("canvas.promptEditor")} onClick={() => { setEditPrompt(displayedPrompt); setEditorOpen(true); }}><Maximize2 className="size-3.5" /></NodeToolButton>}
          {running && <NodeToolButton title={t("canvas.stop")} onClick={onCancel}><Square className="size-3.5" /></NodeToolButton>}
          <NodeToolButton title={t("canvas.node.duplicate")} onClick={onDuplicate}>
            <Copy className="size-3.5" />
          </NodeToolButton>
          <NodeToolButton title={t("canvas.node.delete")} onClick={onDelete} destructive>
            <Trash2 className="size-3.5" />
          </NodeToolButton>
        </div>
      )}

      {spec.inputs.map((port, index) => {
        const PortIcon = PORT_ICONS[port.type];
        const live = connectedPorts.includes(port.id);
        return (
          <Handle
            key={port.id}
            id={port.id}
            type="target"
            position={Position.Left}
            title={t(port.labelKey)}
            style={isText ? { top: PORT_TOP } : { top: "auto", bottom: 42 + (spec.inputs.length - 1 - index) * PORT_GAP, left: -18 }}
            className={cn(
              "!flex !size-6 !items-center !justify-center !rounded-full !border-2 !bg-card shadow",
              live ? PORT_TONES[port.type].on : "!border-border !text-muted-foreground",
            )}
          >
            <PortIcon className="pointer-events-none size-3" />
          </Handle>
        );
      })}
      {spec.output && (
        <Handle
          id="out"
          title={t("canvas.node.outputHint")}
          onPointerDown={(event) => { if (event.button === 0) outputPress.current = { x: event.clientX, y: event.clientY }; }}
          onClick={(event) => {
            const start = outputPress.current;
            outputPress.current = null;
            event.stopPropagation();
            if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) onAddNext();
          }}
          type="source"
          position={Position.Right}
          style={{ top: PORT_TOP, right: -18 }}
          className={cn(
            "canvas-output-handle !flex !size-6 !items-center !justify-center !rounded-full !border-2 !bg-card shadow",
            PORT_TONES[spec.output].on,
          )}
        >
          {(() => {
            const OutIcon = PORT_ICONS[spec.output];
            return <><OutIcon className="canvas-output-icon pointer-events-none size-3" /><Plus className="canvas-output-plus pointer-events-none size-3" /></>;
          })()}
        </Handle>
      )}

      <div className={cn(
        "canvas-node-card overflow-hidden rounded-2xl border-2 bg-card",
        running ? "border-primary shadow-[0_0_28px_hsl(var(--primary)/0.22)]"
          : state.status === "failed" ? "border-destructive/60"
            : selected ? "border-primary" : "border-border",
      )}>

        {isAi && <div className="relative min-h-[140px] p-3">
          {state.textOutput ? <div className="nodrag nopan nowheel max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed select-text">{state.textOutput}</div> : <div className="flex h-[116px] items-center justify-center text-xs text-muted-foreground">{t('canvas.node.empty')}</div>}
          {running && <span className="text-xs text-muted-foreground">{t('canvas.ai.run')}…</span>}
          {state.stale && state.textOutput && !running && <span className="mt-2 block text-[10px] text-muted-foreground">{t('canvas.node.stale')}</span>}
        </div>}
        {!isText && !isAi && (
          <div className={cn("canvas-node-media relative flex cursor-grab items-center justify-center active:cursor-grabbing", isLocal ? "h-[150px]" : "h-[180px]")}>
            {state.output ? (
              state.output.kind === "video" ? (
                <video src={resolvedOutput || ""} muted playsInline draggable={false} role="button" tabIndex={0}
                  aria-label={t("canvas.node.openOutput")}
                  className="size-full cursor-grab object-contain"
                  onPointerDown={(event) => { imagePress.current = event.button === 0 ? { x: event.clientX, y: event.clientY, dragged: false } : null; }}
                  onPointerMove={(event) => { const press = imagePress.current; if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 5) press.dragged = true; }}
                  onClick={(event) => { event.stopPropagation(); const press = imagePress.current; imagePress.current = null; if (press && !press.dragged && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 5) setPreview(state.output!.url); }}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setPreview(state.output!.url); } }} />
              ) : (
                <LocalImage
                  src={resolvedOutput || ""}
                  alt={t("canvas.node.openOutput")}
                  title={t("canvas.node.openOutput")}
                  role="button"
                  tabIndex={0}
                  draggable={false}
                  className="block h-auto max-h-full w-auto max-w-full cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(event) => { imagePress.current = event.button === 0 ? { x: event.clientX, y: event.clientY, dragged: false } : null; }}
                  onPointerMove={(event) => { const press = imagePress.current; if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 5) press.dragged = true; }}
                  onClick={(event) => { event.stopPropagation(); const press = imagePress.current; imagePress.current = null; if (press && !press.dragged && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 5) setPreview(state.output!.url); }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      setPreview(state.output!.url);
                    }
                  }}
                />
              )
            ) : (
              <span className="text-xs text-muted-foreground">
                {isLocal ? t(isLocalVideo ? "canvas.node.uploadVideo" : "canvas.node.uploadImage") : running ? "" : t("canvas.node.empty")}
              </span>
            )}
            {running && (
              <RunningNodeStatus startedAt={state.phaseStartedAt ?? state.startedAt} phase={state.phase} email={state.accountEmail} />
            )}
            {state.output && state.stale && !running && (
              <span
                title={t(isImageEdit ? "canvas.node.editPendingHint" : "canvas.node.staleHint")}
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-border bg-background/95 px-2 py-1 text-2xs font-medium text-muted-foreground shadow-sm"
              >
                <History className="size-3" />{t(isImageEdit ? "canvas.node.editPending" : "canvas.node.stale")}
              </span>
            )}
          </div>
        )}

        {(state.outputs?.length || 0) > 1 && !running && (
          <button type="button" title={t("canvas.history")} onClick={() => setHistoryOpen(true)} className="canvas-download-row nodrag nopan absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[10px]"><History className="size-3" />{state.outputs!.length}</button>
        )}
        {state.output && (
          <div className="canvas-download-row absolute right-2 z-10 flex items-center gap-2 text-xs" style={{ top: running ? 38 : 8 }}>
            {state.output.kind === "video" && <button type="button" title={t("canvas.node.openOutput")} onClick={() => { setDuration(null); setPreview(state.output!.url); }}><Maximize2 className="size-3.5" /></button>}
            {state.output.kind === 'image' ? <ImageDownloadMenu state={state} downloading={downloading} onDownload={download} onUpscale={data.onUpscaleImage} />
              : <button type="button" disabled={downloading} onClick={() => void download()} className="nodrag nopan ml-auto flex items-center gap-1.5 hover:text-primary disabled:opacity-50">{downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}<span className="sr-only">{t("canvas.downloadVideo")}</span></button>}
          </div>
        )}
        {!isText && !isLocal && !isUpscale && (
          <div className="canvas-node-refs flex min-h-7 flex-wrap items-center gap-1.5 px-3">
            <label
              title={t("canvas.node.attach")}
              className="nodrag nopan flex size-6 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3.5" /><span className="sr-only">{t("canvas.node.attach")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files;
                  if (files?.length) onUpload(files);
                  // Cleared so picking the same file twice in a row still fires.
                  event.target.value = "";
                }}
              />
            </label>
            {textInputs.map((input) => (
              <span key={input.edgeId} className="canvas-text-chip nodrag nopan relative inline-flex items-center" title={`${input.name || `${t("canvas.node.text")} #${input.index}`}\n${input.prompt}`}>
                <button type="button" onClick={() => data.onFocusInput?.(input.edgeId)} className="flex size-6 items-center justify-center rounded-md bg-violet-400 text-white" aria-label={`${t('canvas.focusSource')}: ${input.name || `${t("canvas.node.text")} #${input.index}`}`}>
                  <TypeIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  title={t("canvas.edge.delete")}
                  aria-label={`${t("canvas.edge.delete")}: ${input.name || `${t("canvas.node.text")} #${input.index}`}`}
                  onClick={(event) => { event.stopPropagation(); onDisconnectInput(input.edgeId); }}
                  className="canvas-text-chip-remove absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-foreground text-background hover:bg-violet-200"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {state.refs.map((path) => (
              <span key={path} className="group/ref relative">
                {/* Fixed box with the image clipped inside it: a thumbnail that
                    fails to load renders a message, and an unclipped message
                    would push the prompt off the node. */}
                <span className="block size-7 overflow-hidden rounded-lg border border-amber-500/60">
                  <CanvasReferenceImage src={path} alt="" className="size-full object-cover" />
                </span>
                <button
                  type="button"
                  title={t("canvas.node.removeRef")}
                  onClick={() => onRemoveRef(path)}
                  className="nodrag absolute -right-1 -top-1 hidden size-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover/ref:flex"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {inputPreviews.slice(0, 4).map((url) => (
              <button type="button" onClick={() => data.onFocusMedia?.(url)}
                key={url}
                title={t("canvas.focusSource")} aria-label={t('canvas.focusSource')}
                className="nodrag nopan block size-7 overflow-hidden rounded-lg border border-blue-500/60"
              >
                <CanvasReferenceImage src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
            {inputPreviews.length > 4 && (
              <span className="text-2xs text-muted-foreground">+{inputPreviews.length - 4}</span>
            )}
          </div>
        )}

        {isLocal && (
          <label className="canvas-local-upload nodrag nopan mx-2 my-1 flex h-6 cursor-pointer items-center justify-center gap-1.5 rounded-md text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Plus className="size-3.5" />{t(isLocalVideo ? (state.output ? "canvas.node.replaceVideo" : "canvas.node.uploadVideo") : (state.output ? "canvas.node.replaceImage" : "canvas.node.uploadImage"))}
            <input type="file" accept={isLocalVideo ? "video/*" : "image/*"} className="hidden" onChange={(event) => { if (event.target.files?.length) onUpload(event.target.files); event.target.value = ""; }} />
          </label>
        )}
        {isUpscale ? <UpscaleNodeControls data={data} /> : isImageEdit ? <ImageEditControls data={data} /> : !isLocal && !isText && state.kind !== 'note' ? <MentionEditor value={displayedPrompt} onCommit={commitPrompt} placeholder={t(state.kind === 'videoGenerator' ? 'canvas.node.videoPromptPlaceholder' : 'canvas.node.promptPlaceholder') + ' (@)'} rows={textInputs.length ? 3 : 1} options={data.mentionOptions} /> :
!isLocal && <PromptBox dragToMove={isText || state.kind === "note"}
          value={state.prompt}
          onCommit={(prompt) => onChange({ prompt })}
          placeholder={t(
            state.kind === "note" ? "canvas.node.notePlaceholder" : isText ? "canvas.node.textPlaceholder"
              : textInputs.length > 0 ? "canvas.node.connectedPromptPlaceholder"
              : state.kind === "videoGenerator" ? "canvas.node.videoPromptPlaceholder"
                : "canvas.node.promptPlaceholder",
          )}
          rows={isText ? 5 : 1}
        /> }

        {isAi && <AiNodeControls data={data} />}
        {!isText && !isLocal && !isImageEdit && !isUpscale && !isAi && (
          <>
          {!isQwenImage && <NodeAccountPicker state={state} onChange={onChange} disabled={running} platform={isGrokVideo ? 'grok' : 'googleflow'} model={state.kind === 'videoGenerator' ? selectedVideoModel : state.model || configuredImageModel('scene_generation') || 'GEM_PIX_2'} kind={state.kind === 'videoGenerator' ? 'video' : 'image'} />}
          {state.kind === 'videoGenerator' && <div className="canvas-node-controls flex items-center gap-2 px-3 pb-1">
            <select aria-label={t('canvas.videoMode')} title={t('canvas.videoMode')}
              value={state.videoMode || 'first'} disabled={running}
              onChange={(event) => onChange({ videoMode: event.target.value as 'first' | 'ref' })}
              className="nodrag nopan shrink-0 rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none">
              <option value="first">{t('canvas.videoMode.first')}</option>
              {isGrokVideo && state.videoMode === 'ref' && <option value="ref" disabled>{t('canvas.videoMode.ref')}</option>}
              {!isGrokVideo && <option value="ref">{t('canvas.videoMode.ref')}</option>}
            </select>
            <span className="text-2xs text-muted-foreground">{isGrokVideo ? 'Grok: tạo từ chữ hoặc ảnh khung đầu/cuối' : t(state.videoMode === 'ref' ? 'canvas.videoMode.refHint' : 'canvas.videoMode.hint')}</span>
          </div>}
          <div className="canvas-node-controls flex h-9 items-center gap-1.5 px-3 pb-2">
            <select
              value={state.model || AUTO_VALUE}
              onChange={(event) => {
                const model = event.target.value === AUTO_VALUE ? '' : event.target.value;
                const effectiveModel = model || configuredVideoModel() || 'Veo_3.1-Fast';
                onChange({ model, ...(state.kind === 'videoGenerator' ? {
                  videoDuration: videoDuration(effectiveModel, state.videoDuration),
                  ...(videoPlatformForModel(effectiveModel) === 'grok' ? { videoMode: 'first' as const } : {}),
                } : {}) });
              }}
              title={t("canvas.node.modelAutoHint")}
              className="nodrag min-w-0 flex-1 truncate rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none"
            >
              <option value={AUTO_VALUE}>{t("canvas.node.modelAuto")}</option>
              {models.map((model) => (
                <option key={model} value={model}>{getModelDisplayName(model)}</option>
              ))}
            </select>
            <select
              value={state.aspectRatio}
              onChange={(event) => onChange({ aspectRatio: event.target.value })}
              className="nodrag rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none"
            >
              {CANVAS_ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
            {state.kind === 'videoGenerator' && <select aria-label={t('canvas.duration')} title={t('canvas.duration')}
              value={videoDuration(selectedVideoModel, state.videoDuration)}
              onChange={(event) => onChange({ videoDuration: Number(event.target.value) })}
              className="nodrag nopan shrink-0 rounded-full bg-muted/50 px-1 py-1 text-2xs outline-none">
              {videoDurations(selectedVideoModel).map((seconds) => <option key={seconds} value={seconds}>{seconds}s</option>)}
            </select>}
            <button
              type="button"
              title={t("canvas.node.run")}
              onClick={onRun}
              disabled={running}
              className="nodrag nopan ml-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground disabled:opacity-40"
            >
              {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3 fill-current" />}
            </button>
          </div>
          </>
        )}

        {state.batchProgress && state.batchProgress.total > 1 && <p className="px-3 py-1 text-[10px] text-muted-foreground">{state.batchProgress.done}/{state.batchProgress.total} {t("canvas.items")}</p>}
        {state.status === "failed" && state.error && (
          <p className="nowheel max-h-16 overflow-y-auto border-t border-destructive/30 bg-destructive/5 px-3 py-1.5 text-2xs leading-4 text-destructive">
            {state.error === "VIDEO_REF_INPUT_INVALID" ? t("canvas.videoRefInvalid") : state.error === "VIDEO_REF_UNAVAILABLE" ? t("canvas.videoRefUnavailable") : state.error === "VIDEO_START_REQUIRED" ? t("canvas.videoStartRequired") : state.error === "INPUT_REQUIRED" ? t("canvas.error.inputRequired") : state.error === "LIST_LENGTH_MISMATCH" ? t("canvas.error.listMismatch") : state.error === "LOCAL_IMAGE_REQUIRED" ? t("canvas.error.localImageRequired") : state.error === "VIDEO_START_REQUIRED" ? t("canvas.videoStartRequired") : state.error === EMPTY_PROMPT ? t("canvas.error.emptyPrompt") : state.error}
          </p>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="nodrag nopan max-w-3xl" aria-describedby={undefined} onKeyDown={(event) => event.stopPropagation()}>
          <DialogTitle>{t("canvas.promptEditor")}</DialogTitle>
          {!isText && state.kind !== 'note' ? <MentionEditor value={editPrompt} onCommit={setEditPrompt} placeholder={t('canvas.promptEditor')} rows={16} options={data.mentionOptions} /> : <textarea autoFocus rows={16} value={editPrompt} onChange={(event) => setEditPrompt(event.target.value)} className="max-h-[65vh] w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary" />}
          <button onClick={() => { commitPrompt(editPrompt); setEditorOpen(false); }} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">{t("canvas.save")}</button>
        </DialogContent>
      </Dialog>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="nodrag nopan max-h-[85vh] max-w-2xl overflow-y-auto" aria-describedby={undefined} onKeyDown={(event) => event.stopPropagation()}>
          <DialogTitle>{t("canvas.history")}</DialogTitle>
          <CompareResults outputs={state.outputs || []} onSelect={onSelectOutput} disabled={running} />
          <p className="text-xs text-muted-foreground">{t("canvas.historyHint")}</p>
          <div className="grid grid-cols-2 gap-3">
            {(state.outputs || []).map((output) => (
              <div key={output.url} className="overflow-hidden rounded-lg border border-border">
                <HistoryMedia output={output} />
                <div className="space-y-2 p-3 text-xs">
                  <p>{new Date(output.createdAt).toLocaleString()} · {getModelDisplayName(output.model)}</p>
                  <p className="max-h-16 overflow-y-auto whitespace-pre-wrap break-words text-muted-foreground">{output.prompt}</p>
                  <button type="button" disabled={running || output.url === state.output?.url} onClick={() => { onSelectOutput(output); setHistoryOpen(false); }} className="w-full rounded-md bg-primary px-2 py-1.5 text-primary-foreground disabled:opacity-50">{t(output.url === state.output?.url ? "canvas.currentOutput" : "canvas.useOutput")}</button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="nodrag nopan max-h-[92vh] max-w-[92vw] overflow-y-auto" onKeyDown={(event) => event.stopPropagation()} aria-describedby={undefined}>
          <DialogTitle>{t("canvas.node.openOutput")}</DialogTitle>
          <div className="grid min-h-0 gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 items-center justify-center rounded-xl bg-muted/20">
              {preview && (state.output?.kind === "video" ? <video ref={videoRef} src={resolvedPreview || undefined} controls className="max-h-[75vh] w-full object-contain" onLoadedMetadata={(event) => { setImageSize({ url: preview, width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight }); setDuration(event.currentTarget.duration); }} />
                : <LocalImage src={resolvedPreview || ""} alt={t("canvas.node.openOutput")} className="max-h-[75vh] w-full object-contain"
                onLoad={(event) => setImageSize({ url: preview, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />)}
            </div>
            <aside className="flex min-h-0 flex-col gap-4 text-sm">
              {state.output?.kind === "video" && <div className="flex flex-wrap gap-2" aria-busy={extracting}>
                <button type="button" disabled={extracting} className={FRAME_ACTION_CLASS} onClick={() => void captureFrame(videoRef.current?.currentTime || 0)}>{t("canvas.extractFrame")}</button>
                <button type="button" disabled={extracting} className={FRAME_ACTION_CLASS} onClick={() => void captureFrame("last")}>{t("canvas.lastFrame")}</button>
              </div>}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-xl border border-border p-3 text-xs">
                <dt className="text-muted-foreground">{t("canvas.preview.dimensions")}</dt>
                <dd className="text-right tabular-nums">{imageSize?.url === preview ? `${imageSize.width} × ${imageSize.height} px` : "—"}</dd>
                {state.output?.accountEmail && <>
                  <dt className="text-muted-foreground">{t("canvas.preview.account")}</dt>
                  <dd className="break-all text-right">{state.output.accountEmail.replace(/@gmail\.com$/i, "")}</dd>
                </>}
                <dt className="text-muted-foreground">{t("canvas.preview.model")}</dt>
                <dd className="break-words text-right">{state.output?.model ? getModelDisplayName(state.output.model) : "—"}</dd>
                {state.output?.kind === "video" && <><dt className="text-muted-foreground">{t("canvas.duration")}</dt><dd className="text-right">{duration !== null && Number.isFinite(duration) ? `${duration.toFixed(1)}s` : "—"}</dd></>}
                <dt className="text-muted-foreground">{t("canvas.preview.ratio")}</dt>
                <dd className="text-right">{state.output?.aspectRatio || "—"}</dd>
                <dt className="text-muted-foreground">{t("canvas.preview.created")}</dt>
                <dd className="text-right">{state.output?.createdAt ? new Date(state.output.createdAt).toLocaleString() : "—"}</dd>
              </dl>
              {!isLocal && <div className="min-h-0">
                <p className="mb-2 text-xs font-medium">{t(state.output?.prompt !== undefined ? "canvas.preview.prompt" : "canvas.preview.currentPrompt")}</p>
                {state.output?.prompt === undefined && <p className="mb-2 text-xs text-muted-foreground">{t("canvas.preview.legacyPrompt")}</p>}
                <p className="nowheel max-h-[36vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/20 p-3 text-xs leading-5 select-text">
                  {(state.output?.prompt ?? displayedPrompt) || "—"}
                </p>
              </div>}
              {state.output?.kind === 'image' ? <ImageDownloadMenu state={state} downloading={downloading} onDownload={download} onUpscale={data.onUpscaleImage} expanded />
                : <button type="button" disabled={downloading} onClick={() => void download()} className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">{downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}{t("canvas.downloadVideo")}</button>}
            </aside>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
});

function CanvasReferenceImage(props: { src: string; alt: string; className: string }) {
  const url = useResolvedImageUrl(props.src);
  return <LocalImage {...props} src={url || ""} />;
}

function HistoryMedia({ output }: { output: NodeOutput }) {
  const url = useResolvedImageUrl(output.url);
  return output.kind === "video" ? <video src={url || undefined} controls className="h-36 w-full object-contain" />
    : <LocalImage src={url || ""} alt="" className="h-36 w-full object-contain" />;
}

function RunningNodeStatus({ startedAt, email, phase }: { startedAt?: number; email?: string; phase?: CanvasNodeState["phase"] }) {
  const { t } = useI18n();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - (startedAt ?? now)) / 1000));
  return (
    <span className="pointer-events-none absolute inset-x-2 top-2 flex min-w-0 items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[10px] text-foreground shadow-sm">
      <Loader2 className="size-3 shrink-0 animate-spin" />
      <span className="shrink-0 tabular-nums">{t(`canvas.phase.${phase || "queued"}`, { seconds })}</span>
      {email && <span className="truncate">· {email.replace(/@gmail\.com$/i, "")}</span>}
    </span>
  );
}

/** Keep keystrokes local: persisting the whole graph during typing stalls IME input.
 * Blur commits synchronously before toolbar actions read the store. */

function NodeToolButton({ title, onClick, disabled, destructive, children }: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center rounded-lg text-muted-foreground transition disabled:opacity-40",
        destructive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CanvasGraphEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, selected, data }: EdgeProps<CanvasFlowEdge>) {
  const { t } = useI18n();
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "hsl(var(--primary))" : style?.stroke,
          strokeWidth: selected ? 2.5 : style?.strokeWidth,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            title={t("canvas.edge.delete")}
            className="nodrag nopan pointer-events-auto absolute flex size-7 items-center justify-center rounded-lg border border-primary/50 bg-card text-primary shadow-lg transition hover:bg-destructive hover:text-destructive-foreground"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); data?.onDelete(id); }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export { PORT_TONES };
