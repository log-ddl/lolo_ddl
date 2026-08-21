"use client";

/**
 * Split scenes component.
 * Shows shot-splitting results and supports prompt editing, end-frame upload,
 * character library selection, and emotion tagging.
 *
 * This file wires the panel together; the heavy lifting lives in siblings:
 * - split-scenes-generate-image.ts / split-scenes-generate-video.ts (providers)
 * - split-scenes-runtime.ts (busy flags + abort controllers)
 * - split-scenes-timers.ts (elapsed timers + batch progress)
 * - split-scenes-references.ts (character/scene/shot reference resolution)
 * - split-scenes-control-panel.tsx / split-scenes-shot-list.tsx (UI)
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/utils";
import { ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import {
  useDirectorStore,
  useActiveDirectorProject,
  type DirectorProjectData,
  type SplitScene,
} from "@/features/video-studio/stores/director-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { generateScenePrompts } from "@/features/video-studio/lib/storyboard/scene-prompt-generator";
import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { SplitSceneCard } from "./split-scene-card";
import {
  VISUAL_STYLE_PRESETS,
  getStyleById,
  getStylePrompt,
} from "@/features/video-studio/lib/constants/visual-styles";
import { splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { resolveSceneAudioVoice, resolveAllSceneVoices } from "@/features/video-studio/lib/ai/voice-selection";
import { setProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
import {
  directorImageSortCollator,
  getDirectorImageExtension,
  getDirectorImageSortKey,
  getPersistableImageSource,
  isSupportedDirectorImageFile,
  normalizeReferenceName,
  toggleShotSelection,
} from "./split-scenes-helpers";
import { useShotGenerationTimers, useGenerationElapsed } from "./split-scenes-timers";
import { useShotReferences } from "./split-scenes-references";
import { useGenerationRuntime } from "./split-scenes-runtime";
import { useImageGeneration } from "./split-scenes-generate-image";
import { useVideoGeneration } from "./split-scenes-generate-video";
import { SplitScenesControlPanel } from "./split-scenes-control-panel";
import { CompactShotCard, PreparingShotsOverlay } from "./split-scenes-shot-list";

interface SplitScenesProps {
  onBack?: () => void;
  onGenerateVideos?: () => void;
}

const DEFAULT_STORYBOARD_CONFIG: DirectorProjectData['storyboardConfig'] = {
  aspectRatio: '9:16' as const,
  resolution: '2K' as const,
  videoResolution: '480p' as const,
  sceneCount: 5,
  storyPrompt: '',
  styleTokens: [],
  characterReferenceImages: [],
  characterDescriptions: [],
  voiceMode: 'off',
};

export function SplitScenes({ onBack }: SplitScenesProps) {
  const { t } = useI18n();
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isPreparingView, setIsPreparingView] = useState(true);
  const [selectedShotIds, setSelectedShotIds] = useState<Set<number>>(new Set());
  const [expandedShotIds, setExpandedShotIds] = useState<Set<number>>(new Set());
  const [directorControlsRoot, setDirectorControlsRoot] = useState<HTMLElement | null>(null);
  const [isFillingShotImages, setIsFillingShotImages] = useState(false);
  const imageFolderInputRef = useRef<HTMLInputElement>(null);

  // Get current project data
  const projectData = useActiveDirectorProject();
  const allCharacters = useCharacterLibraryStore((state) => state.characters);
  const allSceneRefs = useSceneStore((state) => state.scenes);

  const promptLanguage = 'en' as const;

  // Read from project data (with defaults)
  const splitScenes = projectData?.splitScenes || [];
  const storyboardStatus = projectData?.storyboardStatus || 'idle';
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardConfig = projectData?.storyboardConfig || DEFAULT_STORYBOARD_CONFIG;
  const videoGenerationMode = storyboardConfig.videoGenerationMode || 'image-to-video';
  const frameMode = projectData?.editorPrefs?.frameMode || 'first';
  const isRefToVideo = videoGenerationMode === 'ref-to-video';

  useEffect(() => {
    let frameId = 0;
    let cancelled = false;
    const findControlsRoot = () => {
      if (cancelled) return;
      const root = document.getElementById('director-right-panel-controls');
      setDirectorControlsRoot(root);
      if (!root) {
        frameId = window.requestAnimationFrame(findControlsRoot);
      }
    };
    findControlsRoot();
    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    let firstFrameId = 0;
    let secondFrameId = 0;
    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => setIsPreparingView(false));
    });

    return () => {
      if (firstFrameId) window.cancelAnimationFrame(firstFrameId);
      if (secondFrameId) window.cancelAnimationFrame(secondFrameId);
    };
  }, []);

  // Debug: log raw data on every render (dev only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[SplitScenes] Raw data:', {
      storyboardStatus,
      splitScenesLength: splitScenes.length,
      splitScenesIds: splitScenes.map(s => s.id),
      styleTokens: storyboardConfig.styleTokens,
      aspectRatio: storyboardConfig.aspectRatio,
      sceneCount: storyboardConfig.sceneCount,
    });
  }

  const {
    activeProjectId,
    setStoryboardConfig,
    // Three-tier prompt methods
    updateSplitSceneImagePrompt,
    updateSplitSceneVideoPrompt,
    // Other scene update methods
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneVideo,
    updateSplitSceneCharacters,
    updateSplitSceneCharacterVariationMap,
    // Scene-library association update methods
    updateSplitSceneReference,
    // Generic field update method (used for double-click editing)
    updateSplitSceneField,
    syncVoiceOverToVideoPrompts,
    unsyncVoiceOverFromVideoPrompts,
    deleteSplitScene,
    addBlankSplitScene,
    setEditorPrefs,
    resetStoryboard,
  } = useDirectorStore();
  const mediaProjectId = activeProjectId || undefined;

  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();

  // Get system category folder IDs for auto-saving generated images and videos.
  const getImageFolderId = useCallback(() => getOrCreateCategoryFolder('ai-image'), [getOrCreateCategoryFolder]);
  const getVideoFolderId = useCallback(() => getOrCreateCategoryFolder('ai-video'), [getOrCreateCategoryFolder]);

  // Auto-save video to media library and return mediaId
  const autoSaveVideoToLibrary = useCallback((sceneId: number, videoUrl: string, thumbnailUrl?: string, duration?: number): string => {
    const folderId = getVideoFolderId();

    const mediaId = addMediaFromUrl({
      url: videoUrl,
      name: `Shot ${sceneId + 1} - AI Video`,
      type: 'video',
      source: 'ai-video',
      thumbnailUrl,
      duration: duration || 5,
      folderId,
      projectId: mediaProjectId,
    });

    console.log('[SplitScenes] Auto-saved video to AI video folder:', mediaId);
    return mediaId;
  }, [addMediaFromUrl, getVideoFolderId, mediaProjectId]);

  // Auto-save image to media library
  const autoSaveImageToLibrary = useCallback((sceneId: number, imageUrl: string): string => {
    const folderId = getImageFolderId();

    const mediaId = addMediaFromUrl({
      url: imageUrl,
      name: `Shot ${sceneId + 1} - AI Image`,
      type: 'image',
      source: 'ai-image',
      folderId,
      projectId: mediaProjectId,
    });

    console.log('[SplitScenes] Auto-saved image to AI image folder:', mediaId);
    return mediaId;
  }, [addMediaFromUrl, getImageFolderId, mediaProjectId]);

  // Get current style from config
  // Prefer the stored visualStyleId directly; fall back to inferring it from styleTokens for older projects.
  // Use null when unset so no style is forced by default.
  const currentStyleId = useMemo(() => {
    if (storyboardConfig.visualStyleId) {
      return storyboardConfig.visualStyleId;
    }
    // Backward compatibility: match by merged styleTokens prompt prefix.
    if (storyboardConfig.styleTokens && storyboardConfig.styleTokens.length > 0) {
      const joinedTokens = storyboardConfig.styleTokens.join(', ');
      const found = VISUAL_STYLE_PRESETS.find(s => s.prompt.startsWith(joinedTokens));
      return found?.id || null;
    }
    return null;
  }, [storyboardConfig.visualStyleId, storyboardConfig.styleTokens]);

  // ========== Generation engine ==========
  const timers = useShotGenerationTimers();
  const references = useShotReferences(splitScenes);
  const runtime = useGenerationRuntime({
    splitScenes,
    updateSplitSceneImageStatus,
    updateSplitSceneVideo,
    timers,
    t,
  });
  const { isGenerating, isMergedRunning } = runtime;
  const completedGenerationSeconds = useGenerationElapsed(isMergedRunning || isGenerating);

  const { handleGenerateSingleImage, handleGenerateAllImages } = useImageGeneration({
    splitScenes,
    storyboardConfig,
    currentStyleId,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneField,
    autoSaveImageToLibrary,
    references,
    timers,
    runtime,
    t,
  });

  const { handleGenerateSingleVideo, generateVideosForScenes, handleGenerateVideos } = useVideoGeneration({
    splitScenes,
    storyboardConfig,
    frameMode,
    isRefToVideo,
    allCharacters,
    updateSplitSceneVideo,
    updateSplitSceneField,
    autoSaveVideoToLibrary,
    references,
    timers,
    runtime,
    t,
  });

  const handleGenerateAllFlow = useCallback(async () => {
    const imagesNeeded = splitScenes.some((scene) => !!scene.imagePrompt?.trim() && !scene.imageDataUrl);

    if (splitScenes.length === 0) {
      toast.error(t("director.noShotsToGenerate"));
      return;
    }

    if (imagesNeeded) {
      await handleGenerateAllImages();
    }

    const state = useDirectorStore.getState();
    const currentProjectId = state.activeProjectId;
    const refreshedScenes = currentProjectId ? state.projects[currentProjectId]?.splitScenes || [] : [];
    const scenesReadyForVideo = refreshedScenes.filter(
      (scene) => !!scene.videoPrompt?.trim() && (isRefToVideo || !!scene.imageDataUrl || !scene.imagePrompt?.trim()) && (scene.videoStatus === 'idle' || scene.videoStatus === 'failed')
    );
    if (scenesReadyForVideo.length === 0) {
      toast.warning(t("director.allImagesRequiredBeforeVideo"));
      return;
    }

    await generateVideosForScenes(scenesReadyForVideo);
  }, [splitScenes, handleGenerateAllImages, generateVideosForScenes, isRefToVideo, t]);

  // ========== Voice-over sync ==========
  const syncableVoiceOverCount = useMemo(() => (
    splitScenes.filter((scene) => {
      if (selectedShotIds.size > 0 && !selectedShotIds.has(scene.id)) return false;
      return Boolean(scene.voiceOver?.trim());
    }).length
  ), [splitScenes, selectedShotIds]);

  const unsyncableVoiceOverCount = useMemo(() => (
    splitScenes.filter((scene) => {
      if (selectedShotIds.size > 0 && !selectedShotIds.has(scene.id)) return false;
      return Boolean(scene.voiceOverSynced || splitVideoPromptVoiceOver(scene.videoPrompt).voiceOver);
    }).length
  ), [splitScenes, selectedShotIds]);

  const handleSyncVoiceOverToPrompts = useCallback(() => {
    const sceneIds = selectedShotIds.size > 0 ? Array.from(selectedShotIds) : undefined;
    const synced = syncVoiceOverToVideoPrompts(sceneIds);
    if (synced === 0) {
      toast.info(selectedShotIds.size > 0
        ? 'Các shot đang chọn không có voiceOver để đồng bộ.'
        : 'Không có voiceOver nào để đồng bộ.');
      return;
    }
    toast.success(selectedShotIds.size > 0
      ? `Đã đồng bộ voiceOver vào ${synced} prompt video đã chọn.`
      : `Đã đồng bộ voiceOver vào ${synced} prompt video.`);
  }, [selectedShotIds, syncVoiceOverToVideoPrompts]);

  const handleUnsyncVoiceOverFromPrompts = useCallback(() => {
    const sceneIds = selectedShotIds.size > 0 ? Array.from(selectedShotIds) : undefined;
    const unsynced = unsyncVoiceOverFromVideoPrompts(sceneIds);
    if (unsynced === 0) {
      toast.info(selectedShotIds.size > 0
        ? 'Các shot đang chọn không có Voice Over trong prompt video.'
        : 'Không có Voice Over nào trong prompt video để gỡ.');
      return;
    }
    toast.success(selectedShotIds.size > 0
      ? `Đã gỡ Voice Over khỏi ${unsynced} prompt video đã chọn.`
      : `Đã gỡ Voice Over khỏi ${unsynced} prompt video.`);
  }, [selectedShotIds, unsyncVoiceOverFromVideoPrompts]);

  const relinkReferencesFromPrompts = useCallback(() => {
    let characterHits = 0;
    let sceneHits = 0;

    for (const scene of splitScenes) {
      const promptText = `${scene.imagePrompt || ''}\n${scene.videoPrompt || ''}`;
      const promptNames = Array.from(promptText.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu))
          .map((match) => (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, ""))
          .filter(Boolean);
      const names = Array.from(new Set([...(scene.characterNames || []), ...promptNames]));
      const characterIds = names
        .map((name) => {
          const normalizedName = normalizeReferenceName(name);
          return allCharacters.find((character) => normalizeReferenceName(character.name) === normalizedName)?.id;
        })
        .filter((id): id is string => !!id);
      if (characterIds.length > 0) {
        updateSplitSceneCharacters(scene.id, characterIds);
        characterHits += characterIds.length;
      }

      const sceneMarker = Array.from(promptText.matchAll(/@scene\[([^\]]+)\]/giu))
        .map((match) => match[1].trim())
        .find(Boolean);
      const sceneName = (sceneMarker || scene.sceneName || scene.sceneLocation || '').trim().toLowerCase();
      if (sceneName) {
        const normalizedSceneName = normalizeReferenceName(sceneName);
        const sceneRef = allSceneRefs.find((item) => normalizeReferenceName(item.name) === normalizedSceneName);
        if (sceneRef) {
          updateSplitSceneReference(scene.id, sceneRef.id, sceneRef.referenceImage || sceneRef.referenceImageBase64);
          sceneHits += 1;
        }
      }
    }

    toast.success(`Đã liên kết ${characterHits} nhân vật và ${sceneHits} cảnh.`);
  }, [splitScenes, allCharacters, allSceneRefs, updateSplitSceneCharacters, updateSplitSceneReference]);

  // ========== Per-shot edits ==========
  const handleUpdateImagePrompt = useCallback((id: number, prompt: string) => {
    updateSplitSceneImagePrompt(id, prompt);
  }, [updateSplitSceneImagePrompt]);

  const handleUpdateVideoPrompt = useCallback((id: number, prompt: string) => {
    updateSplitSceneVideoPrompt(id, prompt);
  }, [updateSplitSceneVideoPrompt]);

  const handleUpdateSceneReferenceFromCard = useCallback((id: number, sceneLibId?: string, refImage?: string) => {
    updateSplitSceneReference(id, sceneLibId, refImage);
  }, [updateSplitSceneReference]);

  const handleUpdateSceneField = useCallback((id: number, field: keyof SplitScene, value: any) => {
    updateSplitSceneField(id, field, value);
  }, [updateSplitSceneField]);

  // Update style
  const handleStyleChange = useCallback((styleId: string) => {
    const style = getStyleById(styleId);
    if (style && setProjectVisualStyleId(styleId)) {
      toast.success(t("director.styleSwitched", { name: style.name }));
    }
  }, [t]);

  // Update aspect ratio
  const handleAspectRatioChange = useCallback((ratio: '16:9' | '9:16') => {
    setStoryboardConfig({ aspectRatio: ratio });
    toast.success(t("director.aspectSwitched", { mode: ratio === '16:9' ? t("director.aspectHorizontal") : t("director.aspectVertical") }));
  }, [setStoryboardConfig, t]);

  const handleVideoGenerationModeChange = useCallback((mode: 'image-to-video' | 'ref-to-video') => {
    setStoryboardConfig({ videoGenerationMode: mode });
    if (activeProjectId) {
      useScriptStore.getState().setVideoGenerationMode(activeProjectId, mode);
    }
  }, [activeProjectId, setStoryboardConfig]);

  // Handle update characters
  const handleUpdateCharacters = useCallback((sceneId: number, characterIds: string[]) => {
    updateSplitSceneCharacters(sceneId, characterIds);
    const currentScene = splitScenes.find((s) => s.id === sceneId);
    const currentMap = currentScene?.characterVariationMap;
    if (!currentMap) return;

    const selectedSet = new Set(characterIds);
    const prunedMap: Record<string, string> = {};
    Object.entries(currentMap).forEach(([charId, variationId]) => {
      if (selectedSet.has(charId) && variationId) {
        prunedMap[charId] = variationId;
      }
    });

    const hasChanged =
      Object.keys(prunedMap).length !== Object.keys(currentMap).length ||
      Object.entries(prunedMap).some(([charId, variationId]) => currentMap[charId] !== variationId);
    if (hasChanged) {
      updateSplitSceneCharacterVariationMap(sceneId, prunedMap);
    }
  }, [splitScenes, updateSplitSceneCharacters, updateSplitSceneCharacterVariationMap]);

  const handleUpdateCharacterVariationMap = useCallback((sceneId: number, characterVariationMap: Record<string, string>) => {
    updateSplitSceneCharacterVariationMap(sceneId, characterVariationMap);
  }, [updateSplitSceneCharacterVariationMap]);

  // Handle delete scene
  const handleDeleteScene = useCallback((sceneId: number) => {
    deleteSplitScene(sceneId);
    toast.success(t("director.sceneDeleted", { index: sceneId + 1 }));
  }, [deleteSplitScene, t]);

  // Handle remove first frame image
  const handleRemoveImage = useCallback((sceneId: number) => {
    // Reset image to empty and clear status
    updateSplitSceneImage(sceneId, '', undefined, undefined, undefined);
    updateSplitSceneField(sceneId, 'imageSource', undefined);
    updateSplitSceneField(sceneId, 'imageProviderState', undefined);
    updateSplitSceneImageStatus(sceneId, {
      imageStatus: 'idle',
      imageProgress: 0,
      imageError: null,
    });
  }, [updateSplitSceneField, updateSplitSceneImage, updateSplitSceneImageStatus]);

  // Handle upload first frame image
  const handleUploadImage = useCallback(async (sceneId: number, imageDataUrl: string) => {
    const localPath = await saveImageToLocal(
      imageDataUrl,
      'shots',
      `scene_${sceneId}_first_${Date.now()}.png`,
    );
    updateSplitSceneImage(sceneId, localPath, undefined, undefined, undefined);
    updateSplitSceneField(sceneId, 'imageSource', 'upload');
    updateSplitSceneField(sceneId, 'imageProviderState', undefined);
  }, [updateSplitSceneField, updateSplitSceneImage]);

  const handleFillShotImagesFromFolder = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || isFillingShotImages) return;

    const imageFiles = Array.from(files)
      .filter(isSupportedDirectorImageFile)
      .sort((a, b) => directorImageSortCollator.compare(getDirectorImageSortKey(a), getDirectorImageSortKey(b)));

    if (imageFiles.length === 0) {
      toast.error(t("director.fillImagesNoImages"));
      return;
    }

    const targetScenes = splitScenes.filter((scene) => !scene.imageDataUrl);
    if (targetScenes.length === 0) {
      toast.info(t("director.fillImagesNoMissingShots"));
      return;
    }

    const fillCount = Math.min(imageFiles.length, targetScenes.length);
    let filled = 0;
    let failed = 0;

    setIsFillingShotImages(true);
    try {
      let nextIndex = 0;
      const fillNext = async (): Promise<void> => {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= fillCount) return;

        const file = imageFiles[index];
        const scene = targetScenes[index];

        updateSplitSceneImageStatus(scene.id, {
          imageStatus: 'uploading',
          imageProgress: 0,
          imageError: null,
        });

        try {
          const source = await getPersistableImageSource(file);
          const extension = getDirectorImageExtension(file) || 'png';
          const localPath = await saveImageToLocal(
            source,
            'shots',
            `scene_${scene.id}_first_${Date.now()}.${extension}`,
          );
          updateSplitSceneImage(scene.id, localPath, scene.width, scene.height, undefined);
          updateSplitSceneField(scene.id, 'imageSource', 'upload');
          // A filled image is a new source. Clear Google Flow metadata from any
          // previous/generated image so resolveMedia uploads this local image.
          updateSplitSceneField(scene.id, 'imageProviderState', undefined);
          filled += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error || 'Unknown error');
          updateSplitSceneImageStatus(scene.id, {
            imageStatus: 'failed',
            imageProgress: 0,
            imageError: message,
          });
        }
        await fillNext();
      };

      await Promise.all(
        Array.from(
          { length: Math.min(Math.max(1, useVideoStudioSettingsStore.getState().maxStudioLanes.imageLanesPerJwt || 1), fillCount) },
          () => fillNext(),
        ),
      );

      if (filled > 0) {
        toast.success(t("director.fillImagesDone", { count: filled }));
      }
      if (failed > 0) {
        toast.error(t("director.fillImagesFailed", { count: failed }));
      }
      if (imageFiles.length > targetScenes.length) {
        toast.info(t("director.fillImagesExtra", { count: imageFiles.length - targetScenes.length }));
      }
      const remaining = Math.max(0, targetScenes.length - filled);
      if (remaining > 0) {
        toast.info(t("director.fillImagesRemaining", { count: remaining }));
      }
    } finally {
      setIsFillingShotImages(false);
    }
  }, [
    isFillingShotImages,
    splitScenes,
    t,
    updateSplitSceneField,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
  ]);

  // Handle go back
  const handleBack = useCallback(() => {
    resetStoryboard();
    onBack?.();
  }, [resetStoryboard, onBack]);

  const handleShotSelectedChange = useCallback((sceneId: number, checked: boolean) => {
    setSelectedShotIds((prev) => toggleShotSelection(prev, sceneId, checked));
  }, []);

  const toggleShotExpanded = useCallback((sceneId: number) => {
    setExpandedShotIds((current) => {
      const next = new Set(current);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  // Handle auto-generate prompts using Gemini Vision
  const handleAutoGeneratePrompts = useCallback(async () => {
    if (!storyboardImage || splitScenes.length === 0) {
      toast.error(t("director.cannotGeneratePrompts"));
      return;
    }

    // Try to get image-understanding config (needed only when some shots lack text descriptions).
    const featureConfig = getFeatureConfig('image_understanding');
    const apiKey = featureConfig?.apiKey || '';
    const provider = featureConfig?.platform || '';
    const model = featureConfig?.models?.[0] || '';
    const baseUrl = featureConfig?.baseUrl?.replace(/\/+$/, '') || '';
    // Note: API config is optional - if scenes have text descriptions, no API is needed

    setIsGeneratingPrompts(true);
    toast.info(t("director.generatingPrompts"));

    try {
      // Get story prompt from storyboard config
      const storyPrompt = storyboardConfig.storyPrompt || t("director.videoStoryboardFallback");

      const prompts = await generateScenePrompts({
        storyboardImage,
        storyPrompt,
        scenes: splitScenes.map(s => ({
          id: s.id,
          row: s.row,
          col: s.col,
          dialogue: s.dialogue,
          // Additional fields for text-based generation
          sceneName: s.sceneName,
          sceneDescription: s.sceneLocation,
        })),
        apiKey,
        provider: provider as any,
        baseUrl,
        model,
      });

      // Update store with generated three-tier prompts
      let updatedCount = 0;

      prompts.forEach(p => {
        if (p.videoPrompt || p.imagePrompt) {
          // Update first frame prompt (static)
          updateSplitSceneImagePrompt(p.id, p.imagePrompt);

          // Update video prompt (dynamic action)
          updateSplitSceneVideoPrompt(p.id, p.videoPrompt);

          updatedCount++;
        }
      });

      toast.success(t("director.generatedPrompts", { count: updatedCount }));
    } catch (error) {
      const err = error as Error;
      console.error("[SplitScenes] Prompt generation failed:", err);
      toast.error(t("scriptView.scriptGenerationFailed", { message: err.message }));
    } finally {
      setIsGeneratingPrompts(false);
    }
  }, [storyboardImage, splitScenes, storyboardConfig, t, updateSplitSceneImagePrompt, updateSplitSceneVideoPrompt]);

  // Save to media library (image or video) - uses system category folders
  const handleSaveToLibrary = useCallback(async (scene: SplitScene, type: 'image' | 'video') => {
    try {
      if (type === 'video') {
        if (!scene.videoUrl) {
          toast.error(t("director.noVideoToSave"));
          return;
        }
        const folderId = getVideoFolderId();
        addMediaFromUrl({
          url: scene.videoUrl,
          name: `Shot ${scene.id + 1} - AI Video`,
          type: 'video',
          source: 'ai-video',
          thumbnailUrl: scene.imageDataUrl,
          duration: 5,
          folderId,
          projectId: mediaProjectId,
        });
        toast.success(t("director.videoSaved", { index: scene.id + 1 }));
      } else {
        if (!scene.imageDataUrl) {
          toast.error(t("director.noImageToSave"));
          return;
        }
        const folderId = getImageFolderId();
        addMediaFromUrl({
          url: scene.imageDataUrl,
          name: `Shot ${scene.id + 1} - AI Image`,
          type: 'image',
          source: 'ai-image',
          folderId,
          projectId: mediaProjectId,
        });
        toast.success(t("director.imageSaved", { index: scene.id + 1 }));
      }
    } catch (error) {
      const err = error as Error;
      toast.error(t("director.saveFailed", { message: err.message }));
    }
  }, [addMediaFromUrl, getImageFolderId, getVideoFolderId, mediaProjectId, t]);

  // Show empty state
  if (splitScenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("director.noSplitScenes")}</p>
      </div>
    );
  }

  const controlPanel = (
    <SplitScenesControlPanel
      splitScenes={splitScenes}
      storyboardConfig={storyboardConfig}
      videoGenerationMode={videoGenerationMode}
      frameMode={frameMode}
      isRefToVideo={isRefToVideo}
      currentStyleId={currentStyleId}
      isGenerating={isGenerating}
      isMergedRunning={isMergedRunning}
      isGeneratingPrompts={isGeneratingPrompts}
      isFillingShotImages={isFillingShotImages}
      selectedShotCount={selectedShotIds.size}
      syncableVoiceOverCount={syncableVoiceOverCount}
      unsyncableVoiceOverCount={unsyncableVoiceOverCount}
      batchProgress={timers.batchProgress}
      completedGenerationSeconds={completedGenerationSeconds}
      imageFolderInputRef={imageFolderInputRef}
      onFillShotImagesFromFolder={handleFillShotImagesFromFolder}
      onRelinkReferences={relinkReferencesFromPrompts}
      onAutoGeneratePrompts={handleAutoGeneratePrompts}
      onBack={handleBack}
      onVideoGenerationModeChange={handleVideoGenerationModeChange}
      onFrameModeChange={(mode) => setEditorPrefs({ frameMode: mode })}
      onStyleChange={handleStyleChange}
      onAspectRatioChange={handleAspectRatioChange}
      onVoiceModeChange={(voiceMode) => setStoryboardConfig({ voiceMode })}
      onNarratorVoiceChange={(narratorVoice) => setStoryboardConfig({ narratorVoice })}
      onSyncVoiceOver={handleSyncVoiceOverToPrompts}
      onUnsyncVoiceOver={handleUnsyncVoiceOverFromPrompts}
      onClearShotSelection={() => setSelectedShotIds(new Set())}
      onStopAllGeneration={runtime.handleStopAllGeneration}
      onGenerateAllFlow={handleGenerateAllFlow}
      onGenerateAllImages={handleGenerateAllImages}
      onGenerateVideos={handleGenerateVideos}
      t={t}
    />
  );

  const resolveShotLiveStatus = (scene: SplitScene) => ({
    imageElapsedSeconds: timers.runningImageStartedAtBySceneId[scene.id]
      ? Math.max(0, Math.floor((timers.compactNow - timers.runningImageStartedAtBySceneId[scene.id]) / 1000))
      : 0,
    videoElapsedSeconds: timers.runningVideoStartedAtBySceneId[scene.id]
      ? Math.max(0, Math.floor((timers.compactNow - timers.runningVideoStartedAtBySceneId[scene.id]) / 1000))
      : 0,
    imagePhase: runtime.googleFlowTasks[runtime.googleFlowTaskIdBySceneId[scene.id]]?.phase,
    videoPhase: runtime.googleFlowTasks[runtime.googleFlowVideoTaskIdBySceneId[scene.id]]?.phase,
  });

  return (
    <div className="flex flex-col gap-4">
      {directorControlsRoot ? createPortal(controlPanel, directorControlsRoot) : null}
      <div className="relative order-2 min-w-0 space-y-3">
        {isPreparingView && <PreparingShotsOverlay />}
        {/* Scene list */}
        <div className="flex flex-col gap-3">
          {splitScenes.map((scene, sceneIndex) => {
            const expanded = expandedShotIds.has(scene.id);
            return (
              <div key={scene.id} className="space-y-2">
                <CompactShotCard
                  scene={scene}
                  nextScene={splitScenes[sceneIndex + 1]}
                  expanded={expanded}
                  selected={selectedShotIds.has(scene.id)}
                  frameMode={frameMode}
                  isRefToVideo={isRefToVideo}
                  status={resolveShotLiveStatus(scene)}
                  onToggle={toggleShotExpanded}
                  t={t}
                />
                {expanded && (
                  <SplitSceneCard
                    scene={scene}
                    resolvedVoice={resolveSceneAudioVoice(scene, allCharacters, storyboardConfig)}
                    allVoices={resolveAllSceneVoices(scene, allCharacters, storyboardConfig)}
                    voiceMode={storyboardConfig.voiceMode}
                    imageStylePrompt={currentStyleId ? getStylePrompt(currentStyleId) : ''}
                    promptLanguage={promptLanguage}
                    onUpdateImagePrompt={handleUpdateImagePrompt}
                    onUpdateVideoPrompt={handleUpdateVideoPrompt}
                    onUpdateCharacters={handleUpdateCharacters}
                    onUpdateCharacterVariationMap={handleUpdateCharacterVariationMap}
                    onUpdateSceneReference={handleUpdateSceneReferenceFromCard}
                    onDelete={handleDeleteScene}
                    onSaveToLibrary={handleSaveToLibrary}
                    onGenerateImage={handleGenerateSingleImage}
                    onGenerateVideo={handleGenerateSingleVideo}
                    onRemoveImage={handleRemoveImage}
                    onUploadImage={handleUploadImage}
                    onUpdateField={handleUpdateSceneField}
                    onStopImageGeneration={runtime.handleStopImageGeneration}
                    onStopVideoGeneration={runtime.handleStopVideoGeneration}
                    imageStartedAt={timers.runningImageStartedAtBySceneId[scene.id]}
                    videoStartedAt={timers.runningVideoStartedAtBySceneId[scene.id]}
                    isGeneratingAny={isMergedRunning}
                    videoGenerationMode={videoGenerationMode}
                    selectable
                    selected={selectedShotIds.has(scene.id)}
                    onSelectedChange={(checked) => handleShotSelectedChange(scene.id, checked)}
                    allScenes={splitScenes}
                  />
                )}
              </div>
            );
          })}

          {/* Add blank shot button */}
          <button
            type="button"
            onClick={addBlankSplitScene}
            disabled={isGenerating}
            className={cn(
              "w-full rounded-lg border-2 border-dashed border-muted-foreground/25",
              "flex items-center justify-center gap-2 py-6",
              "text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5",
              "transition-colors cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Plus className="h-5 w-5" />
            <span>{t("director.addBlankShot")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
