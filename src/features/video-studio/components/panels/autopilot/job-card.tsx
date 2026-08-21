"use client";

/**
 * One row in the AutoPilot job list: status, progress, stage timeline, output
 * actions, and — when expanded — the script, media workspace and engine log.
 */

import { ChevronDown, ChevronRight, Copy, Download, FolderOpen, Play, Square, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import type { AutopilotJobListItem } from "@/features/video-studio/autopilot/types";
import { STATUS_ICONS, STATUS_STYLES } from "./panel-shared";
import { JobLog, JobStageTimeline, LongFormChapterProgress } from "./job-progress";
import { JobMediaGallery } from "./job-media-gallery";
import { ExportFcpxmlButton, RerenderControl } from "./job-actions";

export interface JobCardProps {
  job: AutopilotJobListItem;
  expanded: boolean;
  now: number;
  onToggleExpand: () => void;
  onCancel: () => void;
  onResume: () => void;
  onRemove: () => void;
  onCopyPath: (path: string) => void;
  onSaveVideo: (path: string, title: string) => void;
  t: Translate;
}

/** Statuses where the job is not doing work and can be resumed or discarded. */
const IDLE_STATUSES = ["failed", "paused", "interrupted", "cancelled"] as const;

export function JobCard({
  job,
  expanded,
  now,
  onToggleExpand,
  onCancel,
  onResume,
  onRemove,
  onCopyPath,
  onSaveVideo,
  t,
}: JobCardProps) {
  const Icon = STATUS_ICONS[job.status];
  const isBusy = job.status === "running" || job.status === "queued";
  const isIdle = (IDLE_STATUSES as readonly string[]).includes(job.status);

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4 shrink-0", STATUS_STYLES[job.status], job.status === "running" && "animate-spin")} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{job.title}</div>
          <div className="text-[10px] text-muted-foreground truncate">{job.id}</div>
        </div>
        <span className="text-xs text-muted-foreground">{job.stage}</span>
        <div className="flex items-center gap-1">
          {isBusy && (
            <Button variant="outline" size="sm" title={t("autopilot.panel.pause")} onClick={onCancel}>
              <Square className="w-3.5 h-3.5" />
            </Button>
          )}
          {isIdle && (
            <Button variant="outline" size="sm" title={t("autopilot.panel.resume")} onClick={onResume}>
              <Play className="w-3.5 h-3.5" />
              {job.awaitingNextStep && <span className="ml-1.5">Bước tiếp theo</span>}
            </Button>
          )}
          {job.completedSteps?.includes("videos") && !isBusy && (
            <>
              <RerenderControl job={job} />
              <ExportFcpxmlButton job={job} />
            </>
          )}
          {(job.status === "done" || isIdle) && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={job.progress} className="flex-1" />
        {job.status === "running" && (
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {Math.max(0, Math.floor((now - job.createdAt) / 1000))}s
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{job.message}</div>
      <JobStageTimeline job={job} />
      {job.error && (
        <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2">{job.error}</div>
      )}
      {job.outputVideoPath && (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground truncate flex-1">{job.outputVideoPath}</span>
            <Button variant="ghost" size="sm" title={t("autopilot.panel.copyPath")} onClick={() => onCopyPath(job.outputVideoPath!)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" title={t("autopilot.panel.openOutput")} onClick={() => void window.autoVideoRuntime?.openFile(job.outputVideoPath!)}>
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
            <Button variant="default" size="sm" onClick={() => onSaveVideo(job.outputVideoPath!, job.title)}>
              <Download className="w-3.5 h-3.5 mr-1" />
              {t("autopilot.panel.saveMp4")}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("autopilot.panel.savedInLibrary")}</p>
        </div>
      )}
      {expanded && <LongFormChapterProgress job={job} />}
      {expanded && job.input?.script && (
        <details className="rounded-md border border-border bg-muted/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">Kịch bản</summary>
          <div className="border-t border-border p-3">
            <pre className="whitespace-pre-wrap text-xs text-foreground/80 max-h-60 overflow-y-auto">{job.input.script}</pre>
          </div>
        </details>
      )}
      {expanded && <JobMediaGallery job={job} />}
      {expanded && (
        <details className="rounded-md border border-border bg-muted/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">Nhật ký kỹ thuật</summary>
          <div className="border-t border-border p-2"><JobLog jobId={job.id} /></div>
        </details>
      )}
    </div>
  );
}
