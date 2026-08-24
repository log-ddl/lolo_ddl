"use client";

/**
 * Read-only progress views for a job: the step timeline, the long-form chapter
 * grid, and the raw engine log.
 */

import { useEffect, useRef, useState } from "react";
import { Circle, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/components/ui/progress";
import { autopilotEngine } from "@/features/video-studio/stores/autopilot-store";
import type { AutopilotJobListItem } from "@/features/video-studio/autopilot/types";

const JOB_STEPS = [
  ["audio", "Voice"],
  ["shots", "Chia shot"],
  ["research", "Tư liệu"],
  ["references", "Tham chiếu"],
  ["images", "Ảnh"],
  ["videos", "Video"],
  ["render", "Ghép/Xuất"],
] as const;

export function JobStageTimeline({ job }: { job: AutopilotJobListItem }) {
  const completed = new Set(job.completedSteps || []);
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
      {JOB_STEPS.map(([step, label]) => {
        const done = completed.has(step);
        const active = !done && (job.nextStep === step || job.stage === step || (step === "references" && (job.stage === "characters" || job.stage === "scenes")));
        return (
          <div key={step} className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-2xs", done ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400" : active ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground")}>
            {done ? <CircleCheck className="h-3 w-3 shrink-0" /> : active && job.status === "running" ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <Circle className="h-3 w-3 shrink-0" />}
            <span className="truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LongFormChapterProgress({ job }: { job: AutopilotJobListItem }) {
  const chapters = job.longFormMode ? job.chapters || [] : [];
  if (chapters.length === 0) return null;
  const done = chapters.filter((chapter) => chapter.status === "done").length;
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>Long-form chapters</span>
        <span className="text-muted-foreground">{done}/{chapters.length} checkpoint</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {chapters.map((chapter) => {
          const durationSec = Math.max(0, Math.round((chapter.endMs - chapter.startMs) / 1000));
          const planning = chapter.status === "queued" || chapter.status === "running";
          const rendering = chapter.renderStatus === "queued" || chapter.renderStatus === "running";
          const active = planning || rendering;
          const failed = chapter.status === "failed" || chapter.renderStatus === "failed";
          const visibleProgress = rendering || chapter.renderStatus === "done"
            ? chapter.renderProgress || 0
            : chapter.progress;
          return (
            <div key={chapter.id} className={cn(
              "rounded-lg border p-2 text-2xs space-y-1.5",
              failed ? "border-red-500/50 bg-red-500/5" : active ? "border-primary/60 bg-primary/5" : "border-border bg-card",
            )}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Chương {chapter.index}</span>
                <span className="text-muted-foreground">{Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, "0")}</span>
              </div>
              <Progress value={visibleProgress} className="h-1" />
              <div className="flex items-center gap-1 text-muted-foreground">
                {active && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                {!active && chapter.status === "done" && <CircleCheck className="h-3 w-3 text-green-600" />}
                {failed && <CircleX className="h-3 w-3 text-red-500" />}
                <span>{chapter.outputVideoPath ? "MP4 checkpoint sẵn sàng" : rendering ? "đang render MP4" : chapter.status}</span>
              </div>
              {(chapter.renderError || chapter.error) && <div className="line-clamp-2 text-red-500" title={chapter.renderError || chapter.error}>{chapter.renderError || chapter.error}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function JobLog({ jobId }: { jobId: string }) {
  const [, forceUpdate] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const job = autopilotEngine.getJob(jobId);
  const logLength = job?.log.length ?? 0;
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logLength]);
  useEffect(() => {
    const off = autopilotEngine.onEvent((event) => {
      if (event.type === 'log' && event.jobId === jobId) forceUpdate((n) => n + 1);
    });
    return () => off();
  }, [jobId]);
  if (!job) return null;
  return (
    <div ref={logRef} className="max-h-48 overflow-y-auto bg-muted/30 border border-border rounded-lg p-2 font-mono text-2xs space-y-1">
      {job.log.map((entry, index) => (
        <div key={index} className="flex gap-2">
          <span className="text-muted-foreground shrink-0">
            {new Date(entry.ts).toLocaleTimeString()}
          </span>
          <span className={entry.stage === "error" ? "text-red-500" : "text-foreground/80"}>
            [{entry.stage}] {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
