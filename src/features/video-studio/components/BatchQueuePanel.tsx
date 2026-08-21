"use client";

/**
 * Batch Queue Panel — shown on the project dashboard.
 *
 * Global controls (start / pause / resume all, between-project delay) plus the
 * ordered list of queued projects with live per-project progress. Lets the user
 * watch every project run without opening any of them.
 */

import { useState } from "react";
import { useBatchQueueStore } from "@/features/video-studio/stores/batch-queue-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import {
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  ListChecks,
  Loader2,
  CircleCheck,
  CircleX,
  Circle,
  Clock,
  CalendarClock,
  Trash2,
} from "lucide-react";
import type { BatchEntry, BatchEntryStatus } from "@/features/video-studio/stores/batch-queue-store";
import type { AutopilotStep } from "@/features/video-studio/autopilot/types";

/** Same labels/order as the AutoPilot tab's stage timeline. */
const JOB_STEPS: [AutopilotStep, string][] = [
  ["audio", "Voice"],
  ["shots", "Chia shot"],
  ["research", "Tư liệu"],
  ["references", "Tham chiếu"],
  ["images", "Ảnh"],
  ["videos", "Video"],
  ["render", "Ghép/Xuất"],
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatSchedule(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Combine a date string (YYYY-MM-DD) with hour/minute into a local epoch ms. */
function buildScheduleTs(dateStr: string, hour: number, minute: number): number | null {
  if (!dateStr) return null;
  const [y, m, day] = dateStr.split("-").map(Number);
  if (!y || !m || !day) return null;
  const ts = new Date(y, m - 1, day, hour, minute, 0, 0).getTime();
  return Number.isNaN(ts) ? null : ts;
}

const STATUS_META: Record<BatchEntryStatus, { label: string; className: string; Icon: typeof Circle }> = {
  pending: { label: "Đang chờ", className: "text-muted-foreground", Icon: Circle },
  running: { label: "Đang chạy", className: "text-sky-600 dark:text-sky-400", Icon: Loader2 },
  done: { label: "Xong", className: "text-green-600 dark:text-green-400", Icon: CircleCheck },
  failed: { label: "Lỗi", className: "text-red-600 dark:text-red-400", Icon: CircleX },
  paused: { label: "Tạm dừng", className: "text-amber-600 dark:text-amber-400", Icon: Pause },
};

export function BatchQueuePanel() {
  const entries = useBatchQueueStore((s) => s.entries);
  const running = useBatchQueueStore((s) => s.running);
  const waiting = useBatchQueueStore((s) => s.waiting);
  const activeEntryId = useBatchQueueStore((s) => s.activeEntryId);
  const betweenDelayMinSec = useBatchQueueStore((s) => s.betweenDelayMinSec);
  const betweenDelayMaxSec = useBatchQueueStore((s) => s.betweenDelayMaxSec);
  const startAll = useBatchQueueStore((s) => s.startAll);
  const pauseAll = useBatchQueueStore((s) => s.pauseAll);
  const resumeAll = useBatchQueueStore((s) => s.resumeAll);
  const setBetweenDelayRange = useBatchQueueStore((s) => s.setBetweenDelayRange);
  const setEntrySchedule = useBatchQueueStore((s) => s.setEntrySchedule);
  const resumeEntry = useBatchQueueStore((s) => s.resumeEntry);
  const removeEntry = useBatchQueueStore((s) => s.removeEntry);
  const moveEntry = useBatchQueueStore((s) => s.moveEntry);
  const clearFinished = useBatchQueueStore((s) => s.clearFinished);
  const clearAll = useBatchQueueStore((s) => s.clearAll);

  if (entries.length === 0) return null;

  const activeEntry = entries.find((e) => e.id === activeEntryId);
  const waitingForSchedule = waiting && !!activeEntry?.scheduledAt && activeEntry.scheduledAt > Date.now();

  const counts = entries.reduce(
    (acc, entry) => {
      acc[entry.status] += 1;
      return acc;
    },
    { pending: 0, running: 0, done: 0, failed: 0, paused: 0 } as Record<BatchEntryStatus, number>,
  );
  const hasRunnable = entries.some((e) => e.status === "pending" || e.status === "paused" || e.status === "failed");
  const hasFinished = counts.done + counts.failed > 0;

  return (
    <div className="mb-6 rounded-xl border border-border/60 bg-card/80 shadow-sm">
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ListChecks className="h-4 w-4 text-primary" />
          Hàng chờ dự án
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {counts.pending > 0 && <span>{counts.pending} đang chờ</span>}
          {counts.running > 0 && <span className="text-sky-600 dark:text-sky-400">· {counts.running} đang chạy</span>}
          {counts.done > 0 && <span className="text-green-600 dark:text-green-400">· {counts.done} xong</span>}
          {counts.failed > 0 && <span className="text-red-600 dark:text-red-400">· {counts.failed} lỗi</span>}
          {counts.paused > 0 && <span className="text-amber-600 dark:text-amber-400">· {counts.paused} tạm dừng</span>}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <label className="text-xs text-muted-foreground">Nghỉ giữa dự án</label>
            <Input
              type="number"
              min={0}
              value={betweenDelayMinSec}
              onChange={(e) => setBetweenDelayRange(parseInt(e.target.value, 10) || 0, betweenDelayMaxSec)}
              className="h-8 w-[72px] px-2 text-xs"
              title="Nghỉ tối thiểu (giây)"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              value={betweenDelayMaxSec}
              onChange={(e) => setBetweenDelayRange(betweenDelayMinSec, parseInt(e.target.value, 10) || 0)}
              className="h-8 w-[72px] px-2 text-xs"
              title="Nghỉ tối đa (giây) — thời gian nghỉ sẽ random trong khoảng này"
            />
            <span className="text-xs text-muted-foreground">giây</span>
          </div>

          {running ? (
            <Button size="sm" variant="outline" onClick={pauseAll}>
              <Pause className="mr-1.5 h-3.5 w-3.5" />Dừng tất cả
            </Button>
          ) : counts.paused > 0 ? (
            <Button size="sm" onClick={resumeAll} disabled={!hasRunnable}>
              <Play className="mr-1.5 h-3.5 w-3.5" />Tiếp tục tất cả
            </Button>
          ) : (
            <Button size="sm" onClick={startAll} disabled={!hasRunnable}>
              <Play className="mr-1.5 h-3.5 w-3.5" />Bắt đầu tất cả
            </Button>
          )}
        </div>
      </div>

      {waiting && (
        <div className="border-b border-border/50 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400">
          {waitingForSchedule
            ? `Chờ đến giờ hẹn ${formatSchedule(activeEntry!.scheduledAt!)} để chạy "${activeEntry!.projectName}"…`
            : `Đang nghỉ (ngẫu nhiên ${betweenDelayMinSec}–${betweenDelayMaxSec}s) trước khi chạy dự án tiếp theo…`}
        </div>
      )}

      {/* Queue list */}
      <div className="divide-y divide-border/40">
        {entries.map((entry, index) => (
          <QueueRow
            key={entry.id}
            entry={entry}
            first={index === 0}
            last={index === entries.length - 1}
            order={index + 1}
            onUp={() => moveEntry(entry.id, "up")}
            onDown={() => moveEntry(entry.id, "down")}
            onRemove={() => removeEntry(entry.id)}
            onSchedule={(ts) => setEntrySchedule(entry.id, ts)}
            onResume={() => resumeEntry(entry.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-2">
        {hasFinished && (
          <Button size="sm" variant="ghost" onClick={clearFinished}>
            Xóa mục đã xong
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearAll}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Xóa hàng chờ
        </Button>
      </div>
    </div>
  );
}

function QueueRow({
  entry,
  first,
  last,
  order,
  onUp,
  onDown,
  onRemove,
  onSchedule,
  onResume,
}: {
  entry: BatchEntry;
  first: boolean;
  last: boolean;
  order: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  onSchedule: (ts: number | null) => void;
  onResume: () => void;
}) {
  const meta = STATUS_META[entry.status];
  const { Icon } = meta;
  // Scheduling only makes sense before an entry has finished.
  const canSchedule = entry.status === "pending" || entry.status === "paused";
  // A failed/paused entry can be continued from its checkpoint (after a manual fix).
  const canResume = entry.status === "failed" || entry.status === "paused";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex flex-col">
        <button
          type="button"
          disabled={first}
          onClick={onUp}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Lên"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={last}
          onClick={onDown}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Xuống"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">#{order}</span>

      <Icon className={cn("h-4 w-4 shrink-0", meta.className, entry.status === "running" && "animate-spin")} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">{entry.projectName}</span>
          {entry.scheduledAt && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
              <CalendarClock className="h-3 w-3" />
              {formatSchedule(entry.scheduledAt)}
            </span>
          )}
        </div>
        {(entry.status === "running" || entry.progress > 0) && (
          <div className="mt-1 flex items-center gap-2">
            <Progress value={entry.progress} className="h-1.5 flex-1" />
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{Math.round(entry.progress)}%</span>
          </div>
        )}
        {(entry.status === "running" || (entry.completedSteps?.length ?? 0) > 0) && <StageTimeline entry={entry} />}
        <div className={cn("mt-0.5 truncate text-[11px]", entry.status === "failed" ? "text-red-500" : "text-muted-foreground")}>
          {entry.error || entry.message || meta.label}
        </div>
      </div>

      {canResume && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={onResume}
          title="Tiếp tục dự án này từ chỗ dừng (giữ phần đã làm + phần bạn vừa sửa)"
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Tiếp tục
        </Button>
      )}

      {canSchedule && <SchedulePicker scheduledAt={entry.scheduledAt} onSchedule={onSchedule} />}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
        title="Xóa khỏi hàng chờ"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Compact mirror of the AutoPilot tab's stage timeline. */
function StageTimeline({ entry }: { entry: BatchEntry }) {
  const completed = new Set(entry.completedSteps || []);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {JOB_STEPS.map(([step, label]) => {
        const done = completed.has(step);
        const active =
          !done &&
          entry.status === "running" &&
          (entry.nextStep === step ||
            entry.stage === step ||
            (step === "references" && (entry.stage === "characters" || entry.stage === "scenes")));
        return (
          <span
            key={step}
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px]",
              done
                ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                : active
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground",
            )}
          >
            {done ? (
              <CircleCheck className="h-2.5 w-2.5 shrink-0" />
            ) : active ? (
              <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
            ) : (
              <Circle className="h-2.5 w-2.5 shrink-0" />
            )}
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** Time picker with hour/minute sliders. Applies only on "Xác nhận". */
function SchedulePicker({
  scheduledAt,
  onSchedule,
}: {
  scheduledAt?: number;
  onSchedule: (ts: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Seed from the existing schedule, or default to one hour from now.
      const seed = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60 * 1000);
      setDateStr(toDateInputValue(seed));
      setHour(seed.getHours());
      setMinute(seed.getMinutes());
    }
    setOpen(next);
  };

  const preview = buildScheduleTs(dateStr, hour, minute);
  const isPast = preview !== null && preview <= Date.now();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 shrink-0" title="Hẹn giờ chạy dự án này">
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
          {scheduledAt ? formatSchedule(scheduledAt) : "Hẹn giờ"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider">Hẹn giờ chạy</div>

        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">Ngày</div>
          <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="h-8 text-xs" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Giờ</span>
            <span className="tabular-nums font-medium">{pad2(hour)}</span>
          </div>
          <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full accent-primary" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Phút</span>
            <span className="tabular-nums font-medium">{pad2(minute)}</span>
          </div>
          <input type="range" min={0} max={59} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full accent-primary" />
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-2 text-center text-xs">
          Chạy lúc:{" "}
          <span className="font-semibold text-primary">{preview ? formatSchedule(preview) : "—"}</span>
          {isPast && <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">Giờ đã qua — sẽ chạy ngay khi tới lượt.</div>}
        </div>

        <div className="flex gap-2">
          {scheduledAt && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onSchedule(null);
                setOpen(false);
              }}
            >
              Bỏ hẹn
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1"
            disabled={preview === null}
            onClick={() => {
              if (preview !== null) {
                onSchedule(preview);
                setOpen(false);
              }
            }}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Xác nhận
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
