"use client";

/**
 * Canvas graphics for the Buzz pipeline: the node and edge renderers React Flow
 * draws, plus the condition-node data preview that lets the user click a JSON
 * path straight out of the upstream output.
 */

import { useMemo, type ReactNode } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Bot, FileText, FolderOpen, GitBranch, Loader2, Merge, MoreHorizontal, Play, Plus, Repeat2, Trash2, Type } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { Label } from "@/shared/components/ui/label";
import { evaluateConditionNode, parseJsonCandidate } from "../../runner";
import type { BuzzFunctionNode } from "../../types";
import { STATUS_COLORS, type CanvasEdgeData, type CanvasNodeData, type EditorInputSource } from "./types";

export function CanvasControl({ title, onClick, disabled, children }: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:border-muted-foreground hover:bg-accent disabled:opacity-40">{children}</button>;
}

export function BuzzGraphEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, selected, data }: EdgeProps<Edge<CanvasEdgeData>>) {
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
      {(selected || data?.branchLabel) && (
        <EdgeLabelRenderer>
          {data?.branchLabel && <span className={cn(
            "pointer-events-none absolute rounded-md border bg-card px-1.5 py-0.5 text-[8px] font-semibold shadow-sm",
            data.branchTone === "success" ? "border-emerald-500/40 text-emerald-500"
              : data.branchTone === "danger" ? "border-rose-500/40 text-rose-500"
                : data.branchTone === "loop" ? "border-cyan-500/40 text-cyan-500"
                  : "border-blue-500/40 text-blue-500",
          )} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{data.branchLabel}</span>}
          {selected && (
          <button
            type="button"
            title="Xóa dây nối"
            aria-label="Xóa dây nối"
            className="nodrag nopan pointer-events-auto absolute flex size-7 items-center justify-center rounded-lg border border-primary/50 bg-card text-primary shadow-lg transition hover:bg-destructive hover:text-destructive-foreground"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - (data?.branchLabel ? 24 : 0)}px)` }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); data?.onDelete(id); }}
          >
            <Trash2 className="size-3.5" />
          </button>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function BuzzGraphNode({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const trueLabel = vietnamese ? "Đúng" : "True";
  const falseLabel = vietnamese ? "Sai" : "False";
  const loopLabel = vietnamese ? "Lặp" : "Loop";
  const doneLabel = vietnamese ? "Xong" : "Done";
  const running = data.status === "running";
  const meta = data.family === "input"
    ? { Icon: data.kind === "text" ? Type : data.kind === "file" ? FileText : FolderOpen, color: "text-blue-500", surface: "bg-blue-500/10", border: "border-blue-500" }
    : data.family === "function"
      ? data.kind === "condition"
        ? { Icon: GitBranch, color: "text-violet-500", surface: "bg-violet-500/10", border: "border-violet-500" }
        : data.kind === "loop"
          ? { Icon: Repeat2, color: "text-cyan-500", surface: "bg-cyan-500/10", border: "border-cyan-500" }
          : { Icon: Merge, color: "text-amber-500", surface: "bg-amber-500/10", border: "border-amber-500" }
      : { Icon: Bot, color: "text-primary", surface: "bg-primary/10", border: "border-primary" };
  return (
    <div className="relative w-24 text-center">
      {selected && (
        <div className="nodrag nopan absolute -top-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-md">
          {data.family !== "input" && <button type="button" title="Chạy node" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onRun(); }} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">{data.status === "running" ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3 fill-current" />}</button>}
          <button type="button" title="Xóa node" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onDelete(); }} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
          <button type="button" title="Mở cài đặt" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onOpen(); }} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><MoreHorizontal className="size-3.5" /></button>
        </div>
      )}
      {data.family !== "input" && <Handle type="target" position={Position.Left} className="!top-12 !size-3 !border-2 !border-background !bg-muted-foreground" />}
      <div className={cn(
        "relative flex size-24 items-center justify-center rounded-2xl border-2 bg-card shadow-sm transition",
        running
          ? "border-primary shadow-[0_0_28px_hsl(var(--primary)/0.28)] ring-4 ring-primary/15"
          : selected ? `${meta.border} shadow-lg ring-4 ring-primary/10` : "border-border hover:border-muted-foreground/60",
      )}>
        {running && <span className="pointer-events-none absolute -inset-1.5 animate-pulse rounded-[20px] border-2 border-primary/60" />}
        <span className={cn("relative flex size-12 items-center justify-center rounded-xl", meta.surface, meta.color)}>
          {running ? <><Loader2 className="absolute size-9 animate-spin stroke-[1.5]" /><meta.Icon className="size-5" /></> : <meta.Icon className="size-6" />}
        </span>
        {running
          ? <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><Loader2 className="size-2.5 animate-spin" /></span>
          : <span className={cn("absolute right-2 top-2 size-2 rounded-full", STATUS_COLORS[data.status])} />}
      </div>
      <div className="-ml-6 mt-2 w-36">
        <span className="block truncate text-xs font-semibold">{data.title}</span>
        <span className={cn("mt-0.5 block truncate text-[9px]", running ? "font-medium text-primary" : "text-muted-foreground")}>{running ? data.runningLabel : data.subtitle}</span>
      </div>
      {data.kind === "condition" ? <>
        <Handle id="true" type="source" position={Position.Right} className="!top-8 !size-3 !border-2 !border-background !bg-emerald-500" />
        <Handle id="false" type="source" position={Position.Right} className="!top-16 !size-3 !border-2 !border-background !bg-rose-500" />
        <span className="pointer-events-none absolute -right-8 top-[27px] text-[8px] font-medium text-emerald-500">{trueLabel}</span>
        <span className="pointer-events-none absolute -right-7 top-[59px] text-[8px] font-medium text-rose-500">{falseLabel}</span>
      </> : data.kind === "loop" ? <>
        <Handle id="loop" type="source" position={Position.Right} className="!top-8 !size-3 !border-2 !border-background !bg-cyan-500" />
        <Handle id="done" type="source" position={Position.Right} className="!top-16 !size-3 !border-2 !border-background !bg-blue-500" />
        <span className="pointer-events-none absolute -right-7 top-[27px] text-[8px] font-medium text-cyan-500">{loopLabel}</span>
        <span className="pointer-events-none absolute -right-8 top-[59px] text-[8px] font-medium text-blue-500">{doneLabel}</span>
      </> : <Handle type="source" position={Position.Right} className={cn("!top-12 !size-3 !border-2 !border-background", data.family === "input" ? "!bg-blue-500" : data.family === "function" ? "!bg-amber-500" : "!bg-primary")} />}
      {selected && data.kind !== "condition" && data.kind !== "loop" && (
        <>
          <span className="pointer-events-none absolute left-full top-12 h-px w-5 bg-muted-foreground/50" />
          <button
            type="button"
            aria-label="Thêm node tiếp theo"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); data.onAddNext(); }}
            className="nodrag nopan absolute -right-12 top-12 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </>
      )}
      {selected && data.kind === "condition" && <>
        <BranchAddButton className="-right-16 top-8 border-emerald-500/50 text-emerald-500" label={trueLabel} onClick={() => data.onAddNext("true")} />
        <BranchAddButton className="-right-16 top-16 border-rose-500/50 text-rose-500" label={falseLabel} onClick={() => data.onAddNext("false")} />
      </>}
      {selected && data.kind === "loop" && <>
        <BranchAddButton className="-right-16 top-8 border-cyan-500/50 text-cyan-500" label={loopLabel} onClick={() => data.onAddNext("loop")} />
        <BranchAddButton className="-right-16 top-16 border-blue-500/50 text-blue-500" label={doneLabel} onClick={() => data.onAddNext("done")} />
      </>}
    </div>
  );
}

export function BranchAddButton({ className, label, onClick }: { className?: string; label: string; onClick: () => void }) {
  return <button type="button" title={`Thêm nhánh ${label}`} aria-label={`Thêm nhánh ${label}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onClick(); }} className={cn("nodrag nopan absolute z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-md border bg-card shadow-sm transition hover:bg-accent", className)}><Plus className="size-3" /></button>;
}

/**
 * Cho node If: hiện dữ liệu thật từ lần chạy gần nhất của upstream — parse JSON,
 * liệt kê field bấm-để-chọn, và chạy thử điều kiện ngay trong editor (cùng hàm
 * evaluateConditionNode với runtime nên kết quả thử = kết quả khi chạy thật).
 */
export function ConditionDataPreview({ node, inputSources, onPickField }: {
  node: BuzzFunctionNode;
  inputSources: EditorInputSource[];
  onPickField: (path: string) => void;
}) {
  const rawInput = useMemo(() => {
    // Ghép đúng như runtime: text upstream nối bằng dòng trống, không có text thì rơi về đường dẫn file.
    const texts = inputSources.filter((source) => source.dataType === "text" && source.value.trim()).map((source) => source.value);
    const paths = inputSources.filter((source) => source.dataType === "path" && source.value.trim()).map((source) => source.value);
    return texts.join("\n\n") || paths.join("\n");
  }, [inputSources]);
  const parsed = useMemo(() => parseJsonCandidate(rawInput), [rawInput]);
  const fields = useMemo(() => flattenJsonPaths(parsed), [parsed]);
  const verdict = useMemo(() => {
    if (!rawInput.trim()) return null;
    try {
      return { ...evaluateConditionNode(node, rawInput), error: "" };
    } catch (error) {
      return { passed: false, value: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [node, rawInput]);

  if (!rawInput.trim()) {
    return (
      <div className="rounded-xl border border-border bg-muted/25 p-3 text-[11px] leading-5 text-muted-foreground">
        Chưa có dữ liệu từ node trước. Chạy node phía trước một lần để xem field và thử điều kiện ngay tại đây.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {fields.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Field trong dữ liệu nhận được <span className="font-normal text-muted-foreground">(bấm để dùng)</span></Label>
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-card">
            {fields.map((field) => (
              <button
                key={field.path}
                type="button"
                onClick={() => onPickField(field.path)}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-border/60 px-2.5 py-1.5 text-left last:border-b-0 hover:bg-muted/40",
                  (node.field ?? "").trim() === field.path && "bg-primary/10",
                )}
              >
                <span className="shrink-0 font-mono text-[10px] font-semibold text-primary">{field.path}</span>
                <span className="min-w-0 flex-1 truncate text-right font-mono text-[10px] text-muted-foreground" title={field.preview}>{field.preview}</span>
              </button>
            ))}
          </div>
        </div>
      ) : parsed !== undefined ? (
        <div className="rounded-xl border border-border bg-muted/25 p-3 text-[11px] leading-5 text-muted-foreground">
          JSON nhận được không có field con (mảng hoặc giá trị đơn). Với mảng có thể điền chỉ số, ví dụ <code className="font-mono">0.title</code>.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-[11px] leading-5 text-muted-foreground">
          <p className="font-medium text-amber-600 dark:text-amber-400">Output của node trước không đọc được thành JSON.</p>
          <p className="mt-1">Điền "Trường JSON" sẽ luôn ra rỗng — hãy yêu cầu agent trả JSON thuần, hoặc để trống field để so sánh trên toàn bộ text.</p>
          <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background/70 p-2 font-mono text-[9px] leading-4">{rawInput.slice(0, 400)}</pre>
        </div>
      )}
      {verdict && (
        <div className={cn(
          "rounded-xl border p-3 text-[11px] leading-5",
          verdict.error ? "border-destructive/40 bg-destructive/5 text-destructive"
            : verdict.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5",
        )}>
          {verdict.error ? <span>{verdict.error}</span> : <>
            <span className="font-semibold">Thử với dữ liệu hiện có: </span>
            <span className={cn("font-semibold", verdict.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {verdict.passed ? "rẽ nhánh Đúng" : "rẽ nhánh Sai"}
            </span>
            <span className="text-muted-foreground"> · giá trị đọc được: </span>
            <code className="font-mono text-[10px]">{previewJsonValue(verdict.value)}</code>
          </>}
        </div>
      )}
    </div>
  );
}

export function previewJsonValue(value: unknown): string {
  if (value === undefined) return "không có (undefined)";
  try {
    const text = JSON.stringify(value);
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  } catch {
    return String(value);
  }
}

export function flattenJsonPaths(value: unknown, prefix = "", depth = 0, out: Array<{ path: string; preview: string }> = []): Array<{ path: string; preview: string }> {
  if (depth > 3 || out.length >= 50 || !value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (out.length >= 50) break;
    const path = prefix ? `${prefix}.${key}` : key;
    out.push({ path, preview: previewJsonValue(child) });
    flattenJsonPaths(child, path, depth + 1, out);
  }
  return out;
}

