"use client";

/**
 * Presentational pieces of the split-scenes shot list: the collapsed shot row,
 * its status pill, and the skeleton shown while the panel warms up.
 */

import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
import { formatDuration } from "./split-scenes-helpers";

const GOOGLE_FLOW_PHASE_SUFFIX: Record<string, string> = {
  checking_media: 'kiểm tra ảnh đã lưu',
  uploading_media: 'đang tải ảnh mới lên',
  media_ready: 'đã dùng lại ảnh',
};

/** Live timing/phase for one shot, resolved by the panel from its runtime maps. */
export interface ShotLiveStatus {
  imageElapsedSeconds: number;
  videoElapsedSeconds: number;
  imagePhase?: string;
  videoPhase?: string;
}

export function ShotStatusPill({ scene, status }: { scene: SplitScene; status: ShotLiveStatus }) {
  const { imageElapsedSeconds, videoElapsedSeconds, imagePhase, videoPhase } = status;

  if (scene.imageStatus === 'generating') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300"><Loader2 className="h-3 w-3 animate-spin" />Đang tạo ảnh {imageElapsedSeconds}s</span>;
  }
  if (scene.imageStatus === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang chuẩn bị ảnh{imagePhase && GOOGLE_FLOW_PHASE_SUFFIX[imagePhase] ? ` · ${GOOGLE_FLOW_PHASE_SUFFIX[imagePhase]}` : ''}
      </span>
    );
  }
  if (scene.videoStatus === 'generating' || scene.videoStatus === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang tạo video {videoElapsedSeconds}s{videoPhase && GOOGLE_FLOW_PHASE_SUFFIX[videoPhase] ? ` · ${GOOGLE_FLOW_PHASE_SUFFIX[videoPhase]}` : ''}
      </span>
    );
  }
  if (scene.imageStatus === 'queued' || scene.videoStatus === 'queued') {
    return <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Đang chờ</span>;
  }
  if (scene.imageStatus === 'failed' || scene.videoStatus === 'failed') {
    return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">Lỗi</span>;
  }
  if (scene.videoStatus === 'completed' && scene.videoUrl) {
    return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">Đã có video</span>;
  }
  if (scene.imageDataUrl) {
    return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">Đã có ảnh</span>;
  }
  return <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Chưa tạo</span>;
}

export interface CompactShotCardProps {
  scene: SplitScene;
  nextScene?: SplitScene;
  expanded: boolean;
  selected: boolean;
  frameMode: string;
  isRefToVideo: boolean;
  status: ShotLiveStatus;
  onToggle: (sceneId: number) => void;
  t: Translate;
}

export function CompactShotCard({
  scene,
  nextScene,
  expanded,
  selected,
  frameMode,
  isRefToVideo,
  status,
  onToggle,
  t,
}: CompactShotCardProps) {
  const hasImage = !!scene.imageDataUrl;
  const hasVideo = scene.videoStatus === 'completed' && !!scene.videoUrl;
  const assetColor = hasImage && hasVideo
    ? 'bg-emerald-500'
    : hasImage || hasVideo
      ? 'bg-amber-500'
      : 'bg-red-500';
  const sceneTitle = scene.sceneName || scene.sceneLocation;
  const shotDuration = formatDuration(normalizeVideoLength(scene.videoLength));
  const canLinkNextFrame = frameMode === 'both'
    && !isRefToVideo
    && Boolean(nextScene?.imageDataUrl || nextScene?.imageHttpUrl)
    && !(
      scene.sourceEpisodeId
      && nextScene?.sourceEpisodeId
      && scene.sourceEpisodeId !== nextScene.sourceEpisodeId
    );

  return (
    <button
      type="button"
      onClick={() => onToggle(scene.id)}
      className={cn(
        "w-full rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/20",
        expanded && "border-primary/40 bg-muted/20",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {selected && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">Shot {scene.id + 1}</span>
            {sceneTitle && <span className="truncate text-sm font-medium">{sceneTitle}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", assetColor)} />Asset
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {shotDuration}
            </span>

            <ShotStatusPill scene={scene} status={status} />
            {frameMode === 'both' && !isRefToVideo && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                canLinkNextFrame
                  ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "bg-muted text-muted-foreground",
              )}>
                <ArrowRight className="h-2.5 w-2.5" />
                {canLinkNextFrame
                  ? t("director.endFrameUsesShot", { index: nextScene!.id + 1 })
                  : t("director.noLinkedEndFrame")}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
      </div>
    </button>
  );
}

export function PreparingShotsOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col gap-3 rounded-lg bg-background/90 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Đang mở Đạo diễn...</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-3">
            <div className="mb-3 h-3 w-24 rounded bg-muted" />
            <div className="flex gap-3">
              <div className="aspect-video w-36 rounded bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-8 w-full rounded bg-muted/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
