"use client";

/**
 * Right-hand control panel for the split-scenes view: generation mode, style,
 * aspect ratio, voice sync, and the batch action buttons with their progress bar.
 */

import type { RefObject } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Clapperboard,
  FolderOpen,
  ImageIcon,
  Loader2,
  Monitor,
  Play,
  Smartphone,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { DirectorProjectData, SplitScene } from "@/features/video-studio/stores/director-store";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { ProjectVoiceControls } from "@/features/video-studio/components/voice/project-voice-controls";
import { DEFAULT_STYLE_ID } from "@/features/video-studio/lib/constants/visual-styles";
import { DIRECTOR_IMAGE_EXTS, formatDuration, type DirectorBatchProgress } from "./split-scenes-helpers";

function BatchProgressBar({ progress }: { progress: DirectorBatchProgress | null }) {
  if (!progress) return null;
  const finishedCount = progress.completed + progress.failed;
  const percent = progress.total > 0 ? Math.min(100, Math.round((finishedCount / progress.total) * 100)) : 0;
  const statusLabel = progress.active ? progress.label : 'Hoàn tất batch';

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">
          {statusLabel}: {progress.completed}/{progress.total}
        </span>
        {progress.failed > 0 && (
          <span className="text-destructive">Lỗi {progress.failed}</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progress.phase === 'images' ? "bg-blue-500" : "bg-emerald-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface BatchActionsProps {
  splitScenes: SplitScene[];
  isRefToVideo: boolean;
  isGenerating: boolean;
  isMergedRunning: boolean;
  onGenerateAllFlow: () => void;
  onGenerateAllImages: () => void;
  onGenerateVideos: () => void;
  t: Translate;
}

function BatchActions({
  splitScenes,
  isRefToVideo,
  isGenerating,
  isMergedRunning,
  onGenerateAllFlow,
  onGenerateAllImages,
  onGenerateVideos,
  t,
}: BatchActionsProps) {
  if (isRefToVideo) {
    const scenesNeedVideo = splitScenes.filter(s => s.videoStatus === 'idle' || s.videoStatus === 'failed').length;
    return (
      <div className="grid min-w-0 grid-cols-1 gap-2">
        <Button
          onClick={onGenerateVideos}
          disabled={isGenerating || splitScenes.length === 0 || scenesNeedVideo === 0}
          className="min-w-0"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("freedom.generating")}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t("director.generateVideosButton", { ready: scenesNeedVideo, total: splitScenes.length })}
            </>
          )}
        </Button>
      </div>
    );
  }

  const scenesWithImages = splitScenes.filter(s => s.imageDataUrl).length;
  const scenesNeedImage = splitScenes.filter(s => !s.imageDataUrl).length;
  const scenesNeedVideo = splitScenes.filter(s => (
    (s.videoStatus === 'idle' || s.videoStatus === 'failed')
    && !!s.videoPrompt?.trim()
    && (!!s.imageDataUrl || !s.imagePrompt?.trim())
  )).length;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2">
      <Button
        onClick={onGenerateAllFlow}
        disabled={isGenerating || isMergedRunning || splitScenes.length === 0}
        className="min-w-0"
        size="lg"
      >
        {(isGenerating || isMergedRunning) ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("freedom.generating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("director.generateAll")}
          </>
        )}
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onGenerateAllImages}
              disabled={isGenerating || isMergedRunning || splitScenes.length === 0 || scenesNeedImage === 0}
              className="min-w-0"
              size="lg"
            >
              {(isGenerating || isMergedRunning) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("freedom.generating")}
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t("director.generateImagesButton", { ready: splitScenes.length - scenesNeedImage, total: splitScenes.length })}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("director.imageReadyCounts", { ready: splitScenes.length - scenesNeedImage, needImage: scenesNeedImage })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onGenerateVideos}
              disabled={isGenerating || isMergedRunning || splitScenes.length === 0 || scenesNeedVideo === 0}
              className="min-w-0"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("freedom.generating")}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t("director.generateVideosButton", { ready: scenesNeedVideo, total: splitScenes.length })}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("director.videoReadyCounts", { withImages: scenesWithImages, needVideo: scenesNeedVideo })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export interface SplitScenesControlPanelProps {
  splitScenes: SplitScene[];
  storyboardConfig: DirectorProjectData['storyboardConfig'];
  videoGenerationMode: 'image-to-video' | 'ref-to-video';
  frameMode: string;
  isRefToVideo: boolean;
  currentStyleId: string | null;
  isGenerating: boolean;
  isMergedRunning: boolean;
  isGeneratingPrompts: boolean;
  isFillingShotImages: boolean;
  selectedShotCount: number;
  syncableVoiceOverCount: number;
  unsyncableVoiceOverCount: number;
  batchProgress: DirectorBatchProgress | null;
  completedGenerationSeconds: number | null;
  imageFolderInputRef: RefObject<HTMLInputElement>;
  onFillShotImagesFromFolder: (files: FileList | null) => void;
  onRelinkReferences: () => void;
  onAutoGeneratePrompts: () => void;
  onBack: () => void;
  onVideoGenerationModeChange: (mode: 'image-to-video' | 'ref-to-video') => void;
  onFrameModeChange: (mode: 'first' | 'both') => void;
  onStyleChange: (styleId: string) => void;
  onAspectRatioChange: (ratio: '16:9' | '9:16') => void;
  onVoiceModeChange: (voiceMode: DirectorProjectData['storyboardConfig']['voiceMode']) => void;
  onNarratorVoiceChange: (narratorVoice: DirectorProjectData['storyboardConfig']['narratorVoice']) => void;
  onSyncVoiceOver: () => void;
  onUnsyncVoiceOver: () => void;
  onClearShotSelection: () => void;
  onStopAllGeneration: () => void;
  onGenerateAllFlow: () => void;
  onGenerateAllImages: () => void;
  onGenerateVideos: () => void;
  t: Translate;
}

export function SplitScenesControlPanel(props: SplitScenesControlPanelProps) {
  const {
    splitScenes,
    storyboardConfig,
    videoGenerationMode,
    frameMode,
    isRefToVideo,
    currentStyleId,
    isGenerating,
    isMergedRunning,
    isGeneratingPrompts,
    isFillingShotImages,
    selectedShotCount,
    syncableVoiceOverCount,
    unsyncableVoiceOverCount,
    batchProgress,
    completedGenerationSeconds,
    imageFolderInputRef,
    onFillShotImagesFromFolder,
    onRelinkReferences,
    onAutoGeneratePrompts,
    onBack,
    onVideoGenerationModeChange,
    onFrameModeChange,
    onStyleChange,
    onAspectRatioChange,
    onVoiceModeChange,
    onNarratorVoiceChange,
    onSyncVoiceOver,
    onUnsyncVoiceOver,
    onClearShotSelection,
    onStopAllGeneration,
    onGenerateAllFlow,
    onGenerateAllImages,
    onGenerateVideos,
    t,
  } = props;

  return (
    <div className="space-y-4">
      <input
        ref={imageFolderInputRef}
        type="file"
        multiple
        accept={DIRECTOR_IMAGE_EXTS.map((ext) => `.${ext}`).join(",")}
        // @ts-expect-error - Chromium/Electron supports folder picking via webkitdirectory
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(event) => {
          onFillShotImagesFromFolder(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("director.editingHeader")}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {t("director.shotCount", { count: splitScenes.length })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isRefToVideo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageFolderInputRef.current?.click()}
                disabled={isGenerating || isMergedRunning || isFillingShotImages || splitScenes.length === 0}
                className="h-7 px-2 text-xs"
              >
                {isFillingShotImages ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <FolderOpen className="h-3 w-3 mr-1" />
                )}
                {isFillingShotImages ? t("director.fillImagesBusy") : t("director.fillImagesFromFolder")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRelinkReferences}
              disabled={isGenerating}
              className="h-7 px-2 text-xs"
            >
              <Clapperboard className="h-3 w-3 mr-1" />
              Liên kết tham chiếu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoGeneratePrompts}
              disabled={isGeneratingPrompts || isGenerating}
              className="hidden h-7 px-2 text-xs"
            >
              {isGeneratingPrompts ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
              )}
              {t("director.autoFillPrompts")}
            </Button>
            <Button
              variant="text"
              size="sm"
              onClick={onBack}
              className="hidden h-7 px-2 text-xs"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              {t("director.regenerateStoryboard")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0 space-y-1.5">
              <span className="text-xs text-muted-foreground">{t("director.videoModeLabel")}</span>
              <Select
                value={videoGenerationMode}
                onValueChange={(value) => onVideoGenerationModeChange(value as 'image-to-video' | 'ref-to-video')}
                disabled={isGenerating || isMergedRunning}
              >
                <SelectTrigger className="h-9 w-full min-w-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image-to-video">{t("director.imageToVideoOption")}</SelectItem>
                  <SelectItem
                    value="ref-to-video"
                    disabled
                    className="text-muted-foreground data-disabled:opacity-100"
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{t("director.refToVideoOption")}</span>
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        {t("director.betaLabel")}
                      </span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <span className="text-xs text-muted-foreground">{t("director.frameInputLabel")}</span>
              {isRefToVideo ? (
                <Select value="references" disabled>
                  <SelectTrigger className="h-9 w-full min-w-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="references">{t("director.referenceImagesOption")}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={frameMode === 'both' ? 'start-end' : 'start'}
                  onValueChange={(value) => onFrameModeChange(value === 'start-end' ? 'both' : 'first')}
                  disabled={isGenerating || isMergedRunning}
                >
                  <SelectTrigger className="h-9 w-full min-w-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">{t("director.startFrameOption")}</SelectItem>
                    <SelectItem value="start-end">{t("director.startEndFrameOption")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Phong cách hình ảnh</span>
            <StylePicker
              value={currentStyleId || DEFAULT_STYLE_ID}
              onChange={onStyleChange}
              disabled={isGenerating}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t("director.aspectRatio")}</span>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => onAspectRatioChange('16:9')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                  storyboardConfig.aspectRatio === '16:9'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                {t("director.aspectHorizontal")}
              </button>
              <button
                onClick={() => onAspectRatioChange('9:16')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-l",
                  storyboardConfig.aspectRatio === '9:16'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                {t("director.aspectVertical")}
              </button>
            </div>
          </div>

          <ProjectVoiceControls
            voiceMode={storyboardConfig.voiceMode}
            narratorVoice={storyboardConfig.narratorVoice}
            onVoiceModeChange={onVoiceModeChange}
            onNarratorVoiceChange={onNarratorVoiceChange}
            disabled={isGenerating}
            compact
          />

          <Button
            variant="outline"
            className="h-8 min-w-0 px-3 text-xs"
            disabled={isGenerating || syncableVoiceOverCount === 0}
            onClick={onSyncVoiceOver}
            title={selectedShotCount > 0 ? "Đồng bộ voiceOver vào prompt video của shot đang chọn" : "Đồng bộ voiceOver vào prompt video"}
          >
            <Volume2 className="h-3.5 w-3.5 mr-1.5" />
            Đồng bộ voice
          </Button>

          <Button
            variant="outline"
            className="h-8 min-w-0 px-3 text-xs"
            disabled={isGenerating || unsyncableVoiceOverCount === 0}
            onClick={onUnsyncVoiceOver}
            title={selectedShotCount > 0 ? "Gỡ Voice Over khỏi prompt video của shot đang chọn" : "Gỡ Voice Over khỏi prompt video"}
          >
            <VolumeX className="h-3.5 w-3.5 mr-1.5" />
            Tắt đồng bộ
          </Button>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {!isRefToVideo && (
              <Button
                className="h-8 min-w-0 px-4 text-xs font-medium"
                disabled={isGenerating || isMergedRunning || splitScenes.length === 0}
                onClick={onGenerateAllImages}
              >
                {isMergedRunning
                  ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("director.mergedRunning")}</>)
                  : (<><Sparkles className="h-3.5 w-3.5 mr-1.5" />{t("director.generateAllImages")}</>)
                }
              </Button>
            )}
            <Button
              variant="outline"
              className="h-8 min-w-0 px-3 text-xs"
              disabled={selectedShotCount === 0}
              onClick={onClearShotSelection}
            >
              {t("director.clearShotSelection")}
            </Button>
            {(isMergedRunning || isGenerating) && (
              <Button
                variant="destructive"
                className="h-8 min-w-0 px-3 text-xs"
                onClick={onStopAllGeneration}
              >
                <Square className="h-3.5 w-3.5 mr-1" />{t("director.card.stop")}
              </Button>
            )}
          </div>
        </div>

        <BatchActions
          splitScenes={splitScenes}
          isRefToVideo={isRefToVideo}
          isGenerating={isGenerating}
          isMergedRunning={isMergedRunning}
          onGenerateAllFlow={onGenerateAllFlow}
          onGenerateAllImages={onGenerateAllImages}
          onGenerateVideos={onGenerateVideos}
          t={t}
        />

        <BatchProgressBar progress={batchProgress} />

        {completedGenerationSeconds !== null && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Hoàn tất trong {formatDuration(completedGenerationSeconds)}
          </div>
        )}

        {splitScenes.some(s => !s.videoPrompt?.trim()) && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              <p>{t("director.missingPromptWarning")}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          <p>💡 {t("director.bottomHint")}</p>
        </div>
      </div>
    </div>
  );
}
