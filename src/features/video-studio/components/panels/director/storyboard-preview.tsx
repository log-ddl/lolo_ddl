"use client";

/**
 * Storyboard Preview Component
 * Displays the generated storyboard grid with options to regenerate or proceed to split.
 * Uses the FIXED UNIFORM GRID approach (strategy D) - coordinates are deterministic.
 */

import { useState, useCallback } from "react";
import { Button } from "@/shared/components/ui/button";
import { useDirectorStore, useActiveDirectorProject } from "@/features/video-studio/stores/director-store";
import { splitStoryboardImage, type SplitResult } from "@/features/video-studio/lib/storyboard/image-splitter";
import { persistSceneImage } from '@/features/video-studio/lib/utils/image-persist';
import { 
  RefreshCw, 
  Scissors, 
  ArrowLeft, 
  Loader2, 
  ImageIcon,
  AlertCircle,
  CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface StoryboardPreviewProps {
  onBack?: () => void;
  onSplitComplete?: () => void;
}

export function StoryboardPreview({ onBack, onSplitComplete }: StoryboardPreviewProps) {
  const { t } = useI18n();
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const pendingDirectorData = useMediaPanelStore((state) => state.pendingDirectorData);

  // Get current project data
  const projectData = useActiveDirectorProject();
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardStatus = projectData?.storyboardStatus || 'idle';
  const storyboardError = projectData?.storyboardError || null;
  const storyboardConfig = projectData?.storyboardConfig || {
    aspectRatio: '9:16' as const,
    resolution: '2K' as const,
    sceneCount: 5,
    storyPrompt: '',
  };

  const {
    setStoryboardStatus,
    setStoryboardError,
    setSplitScenes,
    resetStoryboard,
  } = useDirectorStore();

  // Handle regenerate storyboard
  const handleRegenerate = useCallback(() => {
    resetStoryboard();
    onBack?.();
  }, [resetStoryboard, onBack]);

  // Handle split storyboard into individual scenes
  // Or directly use the image as single scene when sceneCount is 1
  const handleSplit = useCallback(async () => {
    if (!storyboardImage) {
      toast.error(t("director.noStoryboard"));
      return;
    }

    setIsSplitting(true);
    setSplitError(null);
    setStoryboardStatus('splitting');

    try {
      // If only 1 scene, skip splitting and use the whole image directly
      if (storyboardConfig.sceneCount === 1) {
        // Persist to local-image:// to survive store serialization (base64 gets stripped)
        const singlePersist = await persistSceneImage(storyboardImage, 1, 'first');
        const singleScene = {
          id: 1,
          sceneName: '',
          sceneLocation: '',
          imageDataUrl: singlePersist.localPath,
          imageHttpUrl: null,
          width: 0, // Will be determined when image loads
          height: 0,
          imagePrompt: '',
          videoPrompt: '',
          voiceOver: '',
          videoLength: 4 as const,
          row: 0,
          col: 0,
          sourceRect: { x: 0, y: 0, width: 0, height: 0 },
          characterIds: [],
          sceneLibraryId: pendingDirectorData?.sceneLibraryId,
          sceneReferenceImage: pendingDirectorData?.sceneReferenceImage,
          ambientSound: '',
          soundEffects: [],
          soundEffectText: '',
          dialogue: '',
          imageStatus: 'completed' as const,
          imageProgress: 100,
          imageError: null,
          videoStatus: 'idle' as const,
          videoProgress: 0,
          videoUrl: null,
          videoError: null,
          videoMediaId: null,
        };

        setSplitScenes([singleScene]);
        setStoryboardStatus('editing');
        toast.success(t("director.enterSceneEditing"));
        onSplitComplete?.();
        return;
      }

      // Split using a fixed uniform grid (strategy D)
      // Coordinates are calculated deterministically, no image detection needed
      const splitResults = await splitStoryboardImage(storyboardImage, {
        aspectRatio: storyboardConfig.aspectRatio,
        resolution: storyboardConfig.resolution === '1K' ? '2K' : storyboardConfig.resolution,
        sceneCount: storyboardConfig.sceneCount,
        options: {
          filterEmpty: true,
          threshold: 30,
          edgeMarginPercent: 0.03, // 3% edge crop for separator line tolerance
        },
      });

      if (splitResults.length === 0) {
        throw new Error(t("director.emptySplitResult"));
      }

      // Convert split results to SplitScene format
      // Persist each split image to local-image:// so they survive store serialization
      // (base64 data URLs get stripped by partialize to avoid huge JSON files)
      const splitScenes = await Promise.all(splitResults.map(async (result: SplitResult, index: number) => {
        const sceneId = index + 1;
        const persistResult = await persistSceneImage(result.dataUrl, sceneId, 'first', 'shots');
        return {
          id: sceneId,
          sceneName: '',
          sceneLocation: '',
          imageDataUrl: persistResult.localPath,
          imageHttpUrl: persistResult.httpUrl,
          width: result.width,
          height: result.height,
          imagePrompt: '',
          videoPrompt: '', // English prompt, populated after AI generation
          voiceOver: '',
          videoLength: 4 as const,
          row: result.row,
          col: result.col,
          sourceRect: result.sourceRect,
          characterIds: [],
          sceneLibraryId: pendingDirectorData?.sceneLibraryId,
          sceneReferenceImage: pendingDirectorData?.sceneReferenceImage,
          ambientSound: '',
          soundEffects: [],
          soundEffectText: '',
          dialogue: '',
          imageStatus: 'completed' as const,
          imageProgress: 100,
          imageError: null,
          videoStatus: 'idle' as const,
          videoProgress: 0,
          videoUrl: null,
          videoError: null,
          videoMediaId: null,
        };
      }));

      setSplitScenes(splitScenes);
      setStoryboardStatus('editing');
      toast.success(t("director.splitDone", { count: splitScenes.length }));
      onSplitComplete?.();
    } catch (error) {
      const err = error as Error;
      console.error("[StoryboardPreview] Split failed:", err);
      setSplitError(err.message);
      setStoryboardError(err.message);
      setStoryboardStatus('error');
      toast.error(t("director.splitFailed", { message: err.message }));
    } finally {
      setIsSplitting(false);
    }
  }, [
    storyboardImage,
    storyboardConfig,
    setSplitScenes,
    setStoryboardStatus,
    setStoryboardError,
    onSplitComplete,
    pendingDirectorData,
  ]);

  // Show loading state
  if (storyboardStatus === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("director.generatingStoryboard")}</p>
        <p className="text-xs text-muted-foreground/60">
          {t("director.sceneCount", { count: storyboardConfig.sceneCount })} · {storyboardConfig.aspectRatio} · {storyboardConfig.resolution}
        </p>
      </div>
    );
  }

  // Show error state
  if (storyboardStatus === 'error' || storyboardError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-destructive">{t("director.generationFailed")}</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">
            {storyboardError || splitError || t("director.unknownError")}
          </p>
        </div>
        <Button variant="outline" onClick={handleRegenerate} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("director.regenerate")}
        </Button>
      </div>
    );
  }

  // Show empty state
  if (!storyboardImage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("director.noStoryboardImage")}</p>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("director.backToInput")}
          </Button>
        )}
      </div>
    );
  }

  // Show preview with actions
  return (
    <div className="space-y-4">
      {/* Header with info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{t("director.storyboardReady")}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("director.sceneCount", { count: storyboardConfig.sceneCount })} · {storyboardConfig.aspectRatio} · {storyboardConfig.resolution}
        </span>
      </div>

      {/* Storyboard image preview */}
      <div className="relative rounded-lg border overflow-hidden bg-muted/30">
        <img
          src={storyboardImage}
          alt={t("director.storyboardReady")}
          className="w-full h-auto object-contain"
          style={{ maxHeight: '400px' }}
        />
        
        {/* Splitting overlay */}
        {isSplitting && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t("director.splitting")}</p>
          </div>
        )}
      </div>

      {/* Split error message */}
      {splitError && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-xs text-destructive">
            <p className="font-medium">{t("director.splitFailedTitle")}</p>
            <p>{splitError}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isSplitting}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go back to the input step and regenerate the storyboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSplit}
                disabled={isSplitting}
                className="flex-1"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {storyboardConfig.sceneCount === 1 ? 'Processing...' : 'Splitting...'}
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4 mr-2" />
                    {storyboardConfig.sceneCount === 1 ? 'Next' : 'Split Scenes'}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{storyboardConfig.sceneCount === 1 ? 'Jump straight into scene editing' : 'Split into separate scenes using the fixed grid'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
        <p>💡 {storyboardConfig.sceneCount === 1 
          ? 'Click "Next" to go straight into scene editing, where you can edit prompts and generate videos.'
          : `Click "Split Scenes" to divide the storyboard into ${storyboardConfig.sceneCount} evenly sized grid cells and automatically trim border separators. After that, you can edit each scene prompt.`
        }</p>
      </div>
    </div>
  );
}
