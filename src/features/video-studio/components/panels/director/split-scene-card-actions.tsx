"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import { Button } from "@/shared/components/ui/button";
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  Square,
} from "lucide-react";

/**
 * Second row of a split scene card: the generate/regenerate buttons for the
 * start frame and the video, the video thumbnail with its drag handle, and the
 * progress or error state for both jobs.
 */

export interface SplitSceneCardActionsProps {
  scene: SplitScene;
  resolvedImageUrl: string | null;
  shouldRenderMedia: boolean;
  canDragVideo: string | boolean | null | undefined;
  hasImage: boolean;
  hasImagePrompt: boolean;
  imageElapsedSeconds: number;
  videoElapsedSeconds: number;
  isRefToVideo: boolean;
  isGeneratingAny?: boolean;
  isImageGenerating: boolean;
  isImagePreparing: boolean;
  isImageQueued: boolean;
  isVideoFailed: boolean;
  isVideoGenerating: boolean;
  isVideoModerationSkipped: boolean | undefined;
  isVideoPreparing: boolean;
  isVideoQueued: boolean;
  isVideoReady: string | boolean | null | undefined;
  setPreviewItem: (item: any) => void;
  onGenerateImage?: (id: number) => void;
  onGenerateVideo?: (id: number) => void;
  onStopImageGeneration?: (id: number) => void;
  onStopVideoGeneration?: (id: number) => void;
  handleVideoDragStart: (e: React.DragEvent) => void;
  t: Translate;
}

export function SplitSceneCardActions(props: SplitSceneCardActionsProps) {
  const {
    scene, resolvedImageUrl, shouldRenderMedia, canDragVideo, hasImage,
    hasImagePrompt, imageElapsedSeconds, videoElapsedSeconds, isRefToVideo,
    isGeneratingAny, isImageGenerating, isImagePreparing, isImageQueued,
    isVideoFailed, isVideoGenerating, isVideoModerationSkipped, isVideoPreparing,
    isVideoQueued, isVideoReady, setPreviewItem, onGenerateImage, onGenerateVideo,
    onStopImageGeneration, onStopVideoGeneration, handleVideoDragStart, t,
  } = props;

  return (
    <>
        {/* Row 2: generation buttons plus video preview/status */}
        <div className="flex flex-wrap items-center gap-2">
          {!isRefToVideo && hasImagePrompt && !hasImage ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => onGenerateImage?.(scene.id)}
                disabled={isGeneratingAny || isImageGenerating || isImagePreparing || isImageQueued}
              >
                {isImageGenerating ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang tạo {imageElapsedSeconds}s</>
                ) : isImagePreparing || isImageQueued ? (
                  <>{isImagePreparing ? 'Đang chuẩn bị ảnh' : t("director.pendingStatus")}</>
                ) : (
                  <><ImageIcon className="h-3 w-3 mr-1" />{t("director.card.generateImage")}</>
                )}
              </Button>
              {isImageGenerating && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs px-2"
                  onClick={() => onStopImageGeneration?.(scene.id)}
                  title={t("director.card.stop")}
                >
                  <Square className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={isVideoReady ? "outline" : "default"}
                className="h-7 text-xs"
                onClick={() => onGenerateVideo?.(scene.id)}
                disabled={isGeneratingAny || isVideoGenerating || isVideoPreparing || isVideoQueued}
              >
                {isVideoGenerating ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t("director.card.generatingElapsed", { seconds: videoElapsedSeconds })}</>
                ) : isVideoPreparing || isVideoQueued ? (
                  <>{isVideoPreparing ? 'Đang chuẩn bị video' : t("director.pendingStatus")}</>
                ) : isVideoReady ? (
                  <><RefreshCw className="h-3 w-3 mr-1" />{t("director.card.regenerate")}</>
                ) : (
                  <><Play className="h-3 w-3 mr-1" />{t("director.card.generateVideo")}</>
                )}
              </Button>
              {isVideoGenerating && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs px-2"
                  onClick={() => onStopVideoGeneration?.(scene.id)}
                  title={t("director.card.stop")}
                >
                  <Square className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {isVideoReady && scene.videoUrl && shouldRenderMedia && (
            <div className="flex items-center gap-1">
              <div
                className="flex-1 aspect-video max-w-[120px] bg-muted rounded overflow-hidden cursor-pointer relative"
                onClick={() => setPreviewItem({ type: 'video', url: scene.videoUrl!, name: t("director.preview.shotVideo", { index: scene.id + 1 }) })}
                draggable={!!canDragVideo}
                onDragStart={handleVideoDragStart}
              >
                <video src={scene.videoUrl} className="w-full h-full object-cover" muted preload="none" poster={resolvedImageUrl || undefined} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 text-white" />
                </div>
                {canDragVideo && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-green-600 text-white px-1 rounded">{t("director.card.dragTimeline")}</span>
                )}
              </div>
            </div>
          )}

          {isVideoFailed && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isVideoModerationSkipped
                ? "text-amber-500"
                : "text-destructive"
            )}>
              <AlertCircle className="h-3 w-3" />
              {isVideoModerationSkipped
                ? t("director.card.moderationSkipped")
                : (scene.videoError || t("director.generationFailed"))}
            </span>
          )}
        </div>
    </>
  );
}
