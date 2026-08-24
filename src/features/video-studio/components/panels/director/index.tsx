"use client";

/**
 * Director View
 * AI-powered screenplay generation and video creation panel
 * 
 * New workflow: Story Input -> Storyboard Generation -> Smart Split -> Scene Editing -> Video Generation
 */

import { useEffect } from "react";
import { useDirectorStore, useActiveDirectorProject } from "@/features/video-studio/stores/director-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { ScreenplayInput } from "./screenplay-input";
import { StoryboardPreview } from "./storyboard-preview";
import { SplitScenes } from "./split-scenes";
// ContextPanel moved to global RightPanel
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback } from "react";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { generateStoryboardImage, generateSceneVideos } from "@/features/video-studio/lib/storyboard";
import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { setProjectVisualStyleId, useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

export function DirectorView() {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  // Sync active project ID from project-store
  const { activeProjectId } = useProjectStore();
  const { setActiveProjectId, ensureProject } = useDirectorStore();
  
  useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
      ensureProject(activeProjectId);
    }
  }, [activeProjectId, setActiveProjectId, ensureProject]);

  useEffect(() => {
    if (activeProjectId) setProjectVisualStyleId(projectVisualStyleId);
  }, [activeProjectId, projectVisualStyleId]);
  
  // Get current project data
  const projectData = useActiveDirectorProject();
  
  const {
    // Storyboard actions
    setStoryboardImage,
    setStoryboardStatus,
    setStoryboardError,
    setStoryboardConfig,
    resetStoryboard,
  } = useDirectorStore();
  
  // Read from project data (with defaults for when project is not yet loaded)
  const storyboardStatus = projectData?.storyboardStatus || 'editing';
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardError = projectData?.storyboardError || null;
  const storyboardConfig = projectData?.storyboardConfig || {
    aspectRatio: '9:16' as const,
    resolution: '2K' as const,
    sceneCount: 5,
    storyPrompt: '',
  };
  const splitScenes = projectData?.splitScenes || [];

  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const libraryCharacters = useCharacterLibraryStore((state) => state.characters);
  const { pendingDirectorData, setPendingDirectorData } = useMediaPanelStore();
  const [storyboardProgress, setStoryboardProgress] = useState(0);

  useEffect(() => {
    if (!pendingDirectorData?.prebuiltScenes?.length) return;

    const resolveCharacterIds = (ids?: string[], names?: string[]) => {
      if (ids?.length) return ids;
      if (!names?.length) return [];
      const resolved: string[] = [];
      const seen = new Set<string>();
      for (const name of names) {
        const character = libraryCharacters.find((c) => c.name === name || c.name.includes(name) || name.includes(c.name));
        if (character && !seen.has(character.id)) {
          resolved.push(character.id);
          seen.add(character.id);
        }
      }
      return resolved;
    };

    const importedScenes = pendingDirectorData.prebuiltScenes.map((s, idx) => ({
      id: idx + 1,
      sceneName: s.sceneName || '',
      sceneLocation: s.sceneLocation || '',
      imageDataUrl: '',
      imageHttpUrl: null,
      width: 0,
      height: 0,
      imagePrompt: s.imagePrompt || '',
      imageStatus: 'idle' as const,
      imageProgress: 0,
      imageError: null,
      videoPrompt: s.videoPrompt || '',
      voiceOver: s.voiceOver || '',
      videoLength: normalizeVideoLength(s.videoLength),
      videoStatus: 'idle' as const,
      videoProgress: 0,
      videoUrl: null,
      videoError: null,
      videoMediaId: null,
      characterIds: resolveCharacterIds(s.characterIds, s.characterNames),
      characterNames: s.characterNames || [],
      emotionTags: [],
      dialogue: s.dialogue || '',
      soundEffectText: '',
      ambientSound: s.ambientSound || '',
      soundEffects: [],
      row: 0,
      col: 0,
      sourceRect: { x: 0, y: 0, width: 0, height: 0 },
      sceneLibraryId: s.sceneLibraryId,
      sceneReferenceImage: s.sceneReferenceImage || undefined,
      sceneMasterReferenceImage: s.sceneMasterReferenceImage || undefined,
      ref_image: normalizeRefImageIndexes((s as any).ref_image ?? (s as any).refImage),
      sourceShotId: s.sourceShotId,
      sourceShotIndex: s.sourceShotIndex ?? idx + 1,
    }));

    useDirectorStore.getState().setSplitScenes(importedScenes as any);
    setProjectVisualStyleId(projectVisualStyleId);
    setStoryboardConfig({
      storyPrompt: pendingDirectorData.storyPrompt || '',
      sceneCount: pendingDirectorData.sceneCount || importedScenes.length,
    });
    setStoryboardStatus('editing');
    setPendingDirectorData(null);
  }, [pendingDirectorData, setPendingDirectorData, setStoryboardConfig, setStoryboardStatus, libraryCharacters, projectVisualStyleId]);

  // Step definitions for navigation
  const STEPS = [
    { id: 'idle', name: t('director.step.storyInput'), storyboardStatus: 'idle' as const },
    { id: 'preview', name: t('director.step.previewStoryboard'), storyboardStatus: 'preview' as const },
    { id: 'editing', name: t('director.step.editScenes'), storyboardStatus: 'editing' as const },
  ];

  // Get current step index
  const getCurrentStepIndex = () => {
    if (storyboardStatus === 'idle') return 0;
    if (storyboardStatus === 'preview') return 1;
    if (storyboardStatus === 'editing') return 2;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Navigation handlers
  const goToPrevStep = () => {
    if (currentStepIndex === 0) return;
    const prevStep = STEPS[currentStepIndex - 1];
    if (prevStep.storyboardStatus === 'idle') {
      resetStoryboard();
    } else {
      setStoryboardStatus(prevStep.storyboardStatus);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex >= STEPS.length - 1) return;
    // Can only go forward if conditions are met
    if (currentStepIndex === 0 && !storyboardImage) {
      toast.error('Generate a storyboard first');
      return;
    }
    if (currentStepIndex === 1 && splitScenes.length === 0) {
      toast.error('Split the scenes first');
      return;
    }
    const nextStep = STEPS[currentStepIndex + 1];
    setStoryboardStatus(nextStep.storyboardStatus);
  };

  const canGoPrev = currentStepIndex > 0 && !['generating', 'splitting'].includes(storyboardStatus);
  const canGoNext = currentStepIndex < STEPS.length - 1 && 
    !['generating', 'splitting'].includes(storyboardStatus) &&
    ((currentStepIndex === 0 && storyboardImage) || 
     (currentStepIndex === 1 && splitScenes.length > 0));


  // Handle storyboard generation from ScreenplayInput
  const handleGenerateStoryboard = useCallback(async (config: {
    storyPrompt: string;
    sceneCount: number;
    aspectRatio: '16:9' | '9:16';
    resolution: '2K' | '4K';
    styleTokens: string[];
    visualStyleId?: string;
    characterDescriptions?: string[];
    characterReferenceImages?: string[];
  }) => {
    if (config.visualStyleId) setProjectVisualStyleId(config.visualStyleId);
    setStoryboardStatus('generating');
    setStoryboardConfig({
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
      sceneCount: config.sceneCount,
      storyPrompt: config.storyPrompt,
      visualStyleId: config.visualStyleId,
      styleTokens: config.styleTokens,
      characterDescriptions: config.characterDescriptions,
      characterReferenceImages: config.characterReferenceImages,
    });
    setStoryboardProgress(0);

    try {
      // Load image-generation config from the service mapping.
      const featureConfig = getFeatureConfig('character_generation');
      if (!featureConfig) {
          throw new Error('Configure image generation in Settings first');
      }
      const apiKey = featureConfig.apiKey;
      const provider = featureConfig.platform as string;
      const model = featureConfig.models[0]; // Use the first configured model.
      const baseUrl = featureConfig.baseUrl;
      
      console.log('[DirectorView] Using image generation config:', { provider, model, baseUrl });

      const result = await generateStoryboardImage(
        {
          storyPrompt: config.storyPrompt,
          sceneCount: config.sceneCount,
          aspectRatio: config.aspectRatio,
          resolution: config.resolution,
          styleTokens: config.styleTokens,
          characterDescriptions: config.characterDescriptions,
          characterReferenceImages: config.characterReferenceImages,
          apiKey,
          provider,
          model,
          baseUrl,
        },
        (progress) => setStoryboardProgress(progress)
      );

      // Save to the AI image system folder in the media library.
      const folderId = getOrCreateCategoryFolder('ai-image');
      const mediaId = addMediaFromUrl({
        url: result.imageUrl,
        name: `Storyboard-${config.sceneCount}-scene`,
        type: 'image',
        source: 'ai-image',
        folderId,
        projectId: activeProjectId || undefined,
      });
      console.log('[DirectorView] Saved storyboard image to AI image folder:', mediaId);

      setStoryboardImage(result.imageUrl, mediaId);
      setStoryboardStatus('preview');
      toast.success('Storyboard generated and saved to Assets');
    } catch (error) {
      const err = error as Error;
      console.error('[DirectorView] Storyboard generation failed:', err);
      setStoryboardError(err.message);
      setStoryboardStatus('error');
      toast.error(`Storyboard generation failed: ${err.message}`);
    }
  }, [setStoryboardImage, setStoryboardStatus, setStoryboardError, setStoryboardConfig, getOrCreateCategoryFolder, addMediaFromUrl, activeProjectId]);

  // Handle video generation from split scenes
  const handleGenerateVideos = useCallback(async () => {
    if (splitScenes.length === 0) {
      toast.error('No scenes available for generation');
      return;
    }

    // Load video-generation config from the service mapping.
    const videoConfig = getFeatureConfig('video_generation');
    if (!videoConfig) {
      toast.error('Configure video generation in Settings first');
      return;
    }
    const apiKey = videoConfig.apiKey;
    const provider = videoConfig.platform as string;
    const model = videoConfig.models[0]; // Use the first configured model.
    const baseUrl = videoConfig.baseUrl;
    
    console.log('[DirectorView] Using video generation config:', { provider, model, baseUrl });

    toast.info(`Starting video generation for ${splitScenes.length} scenes... (${provider} ${model || ''})`);

    await generateSceneVideos(
      splitScenes.map(s => ({
        id: s.id,
        imageDataUrl: s.imageDataUrl,
        videoPrompt: s.videoPrompt,
      })),
      {
        aspectRatio: storyboardConfig.aspectRatio,
        apiKey,
        provider, // Pass through the provider selected in the service mapping.
        model,
        baseUrl,
      },
      (sceneId, progress) => {
        console.log(`[DirectorView] Scene ${sceneId} progress: ${progress}%`);
      },
      (sceneId) => {
        toast.success(t("director.videoDoneSaved", { index: sceneId }));
        // TODO: Add video to media library
      },
      (sceneId, error) => {
        toast.error(t("director.shotFailed", { index: sceneId, message: error }));
      }
    );

    toast.success(t("director.allVideosDone"));
  }, [splitScenes, storyboardConfig, t]);

  // Render based on current status (prioritize storyboard workflow)
  const renderContent = () => {
    // New storyboard workflow takes priority
    if (storyboardStatus !== 'idle') {
      switch (storyboardStatus) {
        case 'generating':
          return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">{t("director.generatingStoryboard")} {storyboardProgress}%</p>
              <p className="text-xs text-muted-foreground/60">
                {t("director.sceneCount", { count: storyboardConfig.sceneCount })} · {storyboardConfig.aspectRatio} · {storyboardConfig.resolution}
              </p>
            </div>
          );

        case 'preview':
          return (
            <StoryboardPreview
              onBack={() => resetStoryboard()}
              onSplitComplete={() => {}}
            />
          );

        case 'splitting':
          return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">{t("director.splitting")}</p>
            </div>
          );

        case 'editing':
          return (
            <SplitScenes
              onBack={() => resetStoryboard()}
              onGenerateVideos={handleGenerateVideos}
            />
          );

        case 'error':
          return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="text-4xl">😕</div>
              <p className="text-sm text-destructive">{storyboardError}</p>
              <Button onClick={() => resetStoryboard()} variant="outline">
                {t("director.retry")}
              </Button>
            </div>
          );
      }
    }

    // Fallback: storyboard workflow not started yet.
    // With existing shots, go straight to the editing view; otherwise show the storyboard input.
    if (splitScenes.length > 0) {
      return (
        <SplitScenes
          onBack={() => resetStoryboard()}
          onGenerateVideos={handleGenerateVideos}
        />
      );
    }
    return <ScreenplayInput onGenerateStoryboard={handleGenerateStoryboard} />;
  };

  const showHeaderStatus = storyboardStatus !== "idle";

  return (
    <div className="h-full min-w-0 flex flex-col">
      {/* Header */}
      <div className="p-3 pb-2 bg-panel">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{t("director.title")}</h2>
          <div className="flex items-center gap-2">
            {showHeaderStatus && (
              <span className={storyboardStatus === "editing" ? "hidden" : "text-xs text-muted-foreground capitalize"}>
                {storyboardStatus === "generating" && t("director.storyboardProgress", { progress: storyboardProgress })}
                {storyboardStatus === "preview" && t("director.previewStatus")}
                {storyboardStatus === "splitting" && t("director.splitting")}
                {storyboardStatus === "editing" && t("director.editingStatus")}
                {storyboardStatus === "error" && t("director.errorStatus")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {renderContent()}
      </div>

      {/* Step Navigation Footer - hidden: storyboard generation workflow no longer used */}
      {storyboardStatus !== 'editing' && storyboardStatus !== 'idle' && (
      <div className="p-3 pt-2 border-t bg-panel">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-1 text-xs ${
                idx === currentStepIndex
                  ? 'text-primary font-medium'
                  : idx < currentStepIndex
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                idx === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : idx < currentStepIndex
                  ? 'bg-muted-foreground/30 text-muted-foreground'
                  : 'bg-muted text-muted-foreground/50'
              }`}>
                {idx + 1}
              </span>
              <span className="hidden sm:inline">{step.name}</span>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevStep}
            disabled={!canGoPrev}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("director.previousStep")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextStep}
            disabled={!canGoNext}
            className="flex-1"
          >
            {t("director.nextStep")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
