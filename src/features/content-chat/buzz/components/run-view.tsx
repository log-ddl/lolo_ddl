import { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  ExternalLink,
  Files,
  Loader2,
  ScanEye,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { useBuzzStore } from "../buzz-store";
import { resolveHumanGate } from "../runner";
import type { BuzzRun, RunStepStatus } from "../types";

const STATUS_META: Record<RunStepStatus, { icon: typeof CircleCheck; className: string; label: string }> = {
  pending: { icon: CircleDashed, className: "text-muted-foreground", label: "Chờ" },
  running: { icon: Loader2, className: "text-primary animate-spin", label: "Đang chạy" },
  checking: { icon: ScanEye, className: "text-amber-500", label: "Đang xác minh" },
  awaiting: { icon: UserCheck, className: "text-amber-500", label: "Chờ bạn duyệt" },
  passed: { icon: CircleCheck, className: "text-emerald-500", label: "Đạt" },
  failed: { icon: CircleX, className: "text-destructive", label: "Không đạt" },
  skipped: { icon: CircleAlert, className: "text-muted-foreground", label: "Bỏ qua" },
};

export function RunView({
  run,
  liveOutput,
  onOpenFile,
}: {
  run: BuzzRun | null;
  liveOutput: { stepId: string; text: string } | null;
  onOpenFile: (filePath: string) => void;
}) {
  const { pipelines } = useBuzzStore();
  const [rejectReason, setRejectReason] = useState("");
  const [expandedStepId, setExpandedStepId] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [run?.currentStepId, liveOutput?.text]);

  if (!run) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <p className="text-sm font-medium">Chưa có lần chạy nào</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Chuẩn bị các Input node trên canvas rồi bấm Chạy. Tiến trình từng agent sẽ hiện ở đây.
          </p>
        </div>
      </div>
    );
  }

  const pipeline = pipelines.find((item) => item.id === run.pipelineId);
  const awaitingStep = run.steps.find((step) => step.status === "awaiting");
  const agentStepIds = new Set(pipeline?.steps.map((step) => step.id) ?? []);
  const finalStep = [...run.steps].reverse().find((step) => agentStepIds.has(step.stepId) && (step.output || step.status === "passed"));
  const finalStepConfig = pipeline?.steps.find((step) => step.id === finalStep?.stepId);
  const finalOutputKind = finalStepConfig?.outputKind ?? (finalStepConfig?.outputFile?.trim() ? "file" : "text");

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto w-full max-w-4xl space-y-3 px-6 py-6">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{run.pipelineName}</span>
            <RunStatusBadge run={run} />
          </div>
          {run.topic && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{run.topic}</p>}
          {run.error && (
            <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{run.error}</p>
          )}
        </div>

        {(run.inputManifest?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Files className="size-4 text-primary" /> Đầu vào đã chuẩn hóa</div>
            <div className="space-y-1.5">
              {run.inputManifest!.map((input) => (
                <div key={input.nodeId} className="flex items-center gap-2 rounded-lg bg-muted/45 px-3 py-2 text-[10px]">
                  <span className="min-w-0 flex-1 truncate font-medium" title={input.resolvedPath}>{input.name}</span>
                  <span className="text-muted-foreground">{input.fileCount} file · {formatBytes(input.totalBytes)}</span>
                  {input.staged && <Badge variant="secondary" className="text-[9px] font-normal">đã đưa vào workspace</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {run.status === "done" && finalStep && (
          <div className="rounded-xl border border-primary/35 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold">Đầu ra cuối cùng</p><p className="mt-0.5 text-[10px] text-muted-foreground">{finalStep.name}</p></div>
              {finalOutputKind === "file" && finalStepConfig?.outputFile && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onOpenFile(finalStepConfig.outputFile)}><ExternalLink className="size-3" /> Mở {finalStepConfig.outputFile}</Button>}
              {finalOutputKind === "folder" && finalStepConfig?.outputFile && <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px]">{finalStepConfig.outputFile}</span>}
            </div>
            {finalStep.output && <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/80 p-3 font-mono text-[11px] leading-5">{finalStep.output}</pre>}
          </div>
        )}

        {awaitingStep && (
          <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
            <p className="text-sm font-medium">Bước “{awaitingStep.name}” đang chờ bạn duyệt</p>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Nhận xét (bắt buộc nếu từ chối — agent sẽ đọc để sửa)"
              className="min-h-20 resize-y text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  resolveHumanGate(true, rejectReason.trim() || "Người dùng đã duyệt");
                  setRejectReason("");
                }}
              >
                <ThumbsUp className="size-4" />
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  resolveHumanGate(false, rejectReason.trim());
                  setRejectReason("");
                }}
              >
                <ThumbsDown className="size-4" />
                Từ chối
              </Button>
            </div>
          </div>
        )}

        {run.steps.map((step, index) => {
          const meta = STATUS_META[step.status];
          const StatusIcon = meta.icon;
          const isLive = liveOutput?.stepId === step.stepId && step.status === "running";
          const body = isLive ? liveOutput.text : step.output;
          const outputFile = pipeline?.steps.find((item) => item.id === step.stepId)?.outputFile;
          const outputKind = pipeline?.steps.find((item) => item.id === step.stepId)?.outputKind ?? (outputFile?.trim() ? "file" : "text");
          const expanded = expandedStepId === step.stepId;

          return (
            <div
              key={step.stepId}
              className={cn(
                "rounded-xl border bg-card transition-colors",
                step.status === "failed" ? "border-destructive/40"
                  : step.status === "passed" ? "border-emerald-500/30"
                    : step.stepId === run.currentStepId ? "border-primary/40 shadow-sm"
                      : "border-border",
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {index + 1}
                </span>
                <StatusIcon className={cn("size-4 shrink-0", meta.className)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{step.name}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">{step.agentName}</Badge>
                    {step.attempt > 1 && (
                      <Badge variant="outline" className="shrink-0 text-[10px] font-normal">lần {step.attempt}</Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                  {step.artifact && step.status === "passed" && <span className="mt-0.5 block text-[9px] text-emerald-500">Đầu ra đã xác minh · {step.artifact.fileCount || 1} {step.artifact.kind === "folder" ? "file" : step.artifact.kind === "file" ? "tệp" : "phản hồi"} · {formatBytes(step.artifact.totalBytes)}</span>}
                </div>
                {outputFile && outputKind === "file" && (step.status === "passed" || step.status === "failed") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-[11px] font-normal text-muted-foreground"
                    onClick={() => onOpenFile(outputFile)}
                  >
                    <ExternalLink className="size-3.5" />
                    {outputFile}
                  </Button>
                )}
                {outputFile && outputKind === "folder" && (step.status === "passed" || step.status === "failed") && <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">{outputFile}</span>}
                {(body || step.error) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-[11px] font-normal text-muted-foreground"
                    onClick={() => setExpandedStepId(expanded ? "" : step.stepId)}
                  >
                    {expanded ? "Ẩn log" : "Xem log"}
                  </Button>
                )}
              </div>

              {step.gateReason && (
                <div className={cn(
                  "mx-4 mb-3 rounded-lg px-3 py-2 text-xs leading-5",
                  step.gateVerdict === "fail" ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}>
                  <span className="font-medium">{step.gateVerdict === "fail" ? "QC không đạt: " : "QC đạt: "}</span>
                  {step.gateReason}
                </div>
              )}

              {step.error && (
                <div className="mx-4 mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {step.error}
                </div>
              )}

              {(isLive || expanded) && body && (
                <pre className="mx-4 mb-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-5">
                  {body}
                  {isLive && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary align-middle" />}
                </pre>
              )}
            </div>
          );
        })}
        <div ref={endRef} />

        {run.status === "done" && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Xong. Kết quả nằm trong workspace — bấm tên file ở từng bước để mở.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RunStatusBadge({ run }: { run: BuzzRun }) {
  const map: Record<BuzzRun["status"], { label: string; className: string }> = {
    running: { label: "Đang chạy", className: "bg-primary/15 text-primary" },
    awaiting: { label: "Chờ duyệt", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    paused: { label: "Đã dừng", className: "bg-muted text-muted-foreground" },
    done: { label: "Hoàn tất", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Thất bại", className: "bg-destructive/15 text-destructive" },
  };
  const meta = map[run.status];
  return <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", meta.className)}>{meta.label}</span>;
}
