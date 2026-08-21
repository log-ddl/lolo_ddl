/**
 * First-frame image generation for the split-scenes panel: single-shot
 * submit-and-poll against the configured image provider, plus the batch runner
 * (ordered when shots reference each other, lane-queued otherwise).
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import { useDirectorStore, type DirectorProjectData, type SplitScene } from "@/features/video-studio/stores/director-store";
import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import { submitGridImageRequest } from "@/features/video-studio/lib/ai/image-generator";
import { resolveGoogleFlowReferenceBias } from "@/features/video-studio/lib/ai/google-flow-reference-bias";
import { persistSceneImage } from "@/features/video-studio/lib/utils/image-persist";
import { getStylePrompt } from "@/features/video-studio/lib/constants/visual-styles";
import { normalizeRefImageIndexes } from "@/features/video-studio/types/script";
import {
  buildLaneWorkers,
  runLaneQueue,
  syncRuntimeLaneSettings,
  resolveLaneCount,
  withRetry,
  getGenerationFlowSettings,
} from "@/features/video-studio/lib/ai/lane-manager";
import {
  MAX_REFERENCE_IMAGES,
  createTimeoutSignal,
  expandLinkedPromptMarkers,
  getSceneByIdFromStore,
  isAbortLikeError,
  linkAbortSignals,
  randomBetween,
  type SceneGenerationOptions,
  type UpdateSplitSceneField,
  type UpdateSplitSceneImage,
  type UpdateSplitSceneImageStatus,
} from "./split-scenes-helpers";
import type { ShotReferences } from "./split-scenes-references";
import type { ShotGenerationTimers } from "./split-scenes-timers";
import type { GenerationRuntime } from "./split-scenes-runtime";

export interface ImageGenerationDeps {
  splitScenes: SplitScene[];
  storyboardConfig: DirectorProjectData['storyboardConfig'];
  currentStyleId: string | null;
  updateSplitSceneImage: UpdateSplitSceneImage;
  updateSplitSceneImageStatus: UpdateSplitSceneImageStatus;
  updateSplitSceneField: UpdateSplitSceneField;
  autoSaveImageToLibrary: (sceneId: number, imageUrl: string) => string;
  references: ShotReferences;
  timers: ShotGenerationTimers;
  runtime: GenerationRuntime;
  t: Translate;
}

export interface ImageGeneration {
  handleGenerateSingleImage: (sceneId: number, options?: SceneGenerationOptions) => Promise<void>;
  handleGenerateAllImages: () => Promise<void>;
}

/** Providers may hand back a bare string or a single-element array. */
const normalizeUrlValue = (url: any): string | undefined => {
  if (!url) return undefined;
  if (Array.isArray(url)) return url[0] || undefined;
  if (typeof url === 'string') return url;
  return undefined;
};

export function useImageGeneration(deps: ImageGenerationDeps): ImageGeneration {
  const {
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
  } = deps;

  const {
    getCharacterReferenceDetails,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    getSceneShotIndex,
    processReferenceImagesForApi,
  } = references;
  const { markImageTimerStarted, clearImageTimer, startBatchProgress, incrementBatchProgress, finishBatchProgress } = timers;
  const {
    setIsGenerating,
    setIsMergedRunning,
    activeImageControllersRef,
    activeVideoControllersRef,
    imageAbortRef,
    batchAbortRef,
    setGoogleFlowTaskIdBySceneId,
  } = runtime;

  // Generate image for a single scene using image API
  const handleGenerateSingleImage = useCallback(async (sceneId: number, options: SceneGenerationOptions = {}) => {
    const scene = getSceneByIdFromStore(sceneId) || splitScenes.find(s => s.id === sceneId);
    if (!scene) return;
    const { manageRunState = true, suppressSuccessToast = false, signal } = options;

    // Use the service mapping configuration only; no hardcoded fallback.
    const featureConfig = getFeatureConfig('character_generation');
    if (!featureConfig) {
      toast.error(t("director.configureImageMapping"));
      return;
    }

    const keyManager = featureConfig.keyManager;
    const apiKey = keyManager.getCurrentKey() || featureConfig.apiKey || '';
    if (!apiKey && featureConfig.platform !== 'googleflow') {
      toast.error(t("director.configureImageMapping"));
      return;
    }
    const platform = featureConfig.platform;
    const model = featureConfig.models?.[0];
    if (!model) {
      toast.error(t("director.configureImageModel"));
      return;
    }

    const imageBaseUrl = featureConfig.baseUrl?.replace(/\/+$/, '');
    if (!imageBaseUrl) {
      toast.error(t("director.configureImageMapping"));
      return;
    }
    console.log('[SingleImage] Using config:', { platform, model, imageBaseUrl });

    const rawPromptToUse = scene.imagePrompt?.trim() || '';
    if (!rawPromptToUse) {
      toast.warning(t("director.fillStartPromptFirst"));
      return;
    }
    const latestDirectorState = useDirectorStore.getState();
    const latestProject = latestDirectorState.activeProjectId
      ? latestDirectorState.projects[latestDirectorState.activeProjectId]
      : null;
    const latestStyleId = latestProject?.storyboardConfig?.visualStyleId || currentStyleId;
    const stylePrompt = latestStyleId ? getStylePrompt(latestStyleId) : '';
    const promptToUse = [expandLinkedPromptMarkers(rawPromptToUse), stylePrompt]
      .filter(Boolean)
      .join(', ');

    const missingShotRefs = getMissingShotReferenceLabels(scene);
    if (missingShotRefs.length > 0) {
      const message = t("director.missingShotRefs", { refs: missingShotRefs.join(', ') });
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: 'failed',
        imageProgress: 0,
        imageError: message,
      });
      toast.error(message);
      return;
    }

    if (manageRunState) {
      setIsGenerating(true);
    }
    // Create an AbortController for this run so the stop button can cancel it.
    const imageController = new AbortController();
    linkAbortSignals(imageController, signal);
    activeImageControllersRef.current.set(sceneId, imageController);
    if (manageRunState) {
      imageAbortRef.current = imageController;
    }
    const imageSignal = imageController.signal;

    try {
      // Update status
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: 'uploading',
        imageProgress: 0,
        imageError: null,
      });

      // Collect reference images: scene background first, then characters
      const characterRefDetails = getCharacterReferenceDetails(scene.characterIds || []);
      const characterRefs = characterRefDetails.map((item) => item.value);
      const shotRefDetails = getShotReferenceDetails(scene).filter((item) => item.value);
      const shotRefs = shotRefDetails.map((item) => item.value);
      const rawRefs = [
        (scene as any).sceneMasterReferenceImage,
        scene.sceneReferenceImage,
        ...shotRefs,
        ...characterRefs,
      ].filter(Boolean) as string[];
      const trimmedRawRefs = rawRefs.slice(0, MAX_REFERENCE_IMAGES);
      const referenceBias = platform === 'googleflow' ? resolveGoogleFlowReferenceBias(trimmedRawRefs) : { hints: {}, preferredCredentialId: undefined as string | undefined };
      const referenceImages = await processReferenceImagesForApi(trimmedRawRefs, '[SingleImage]');
      const imageGenerationMode = referenceImages.length > 0 ? 'i2i' : 't2i';

      console.log('[SingleImage][Refs] Scene reference summary:', {
        sceneId,
        sceneName: scene.sceneName,
        characterIds: scene.characterIds || [],
        characterVariationMap: scene.characterVariationMap || {},
        shotRefIndexes: normalizeRefImageIndexes(scene.ref_image),
        shotRefCount: shotRefs.length,
        shotRefPreviews: shotRefDetails.map((detail) => ({
          shotIndex: detail.shotIndex,
          sceneId: detail.sceneId,
          preview: detail.value.slice(0, 120),
        })),
        characterRefDetails,
        hasSceneReferenceImage: !!scene.sceneReferenceImage,
        sceneReferenceImageType: !scene.sceneReferenceImage
          ? 'missing'
          : String(scene.sceneReferenceImage).startsWith('http://') || String(scene.sceneReferenceImage).startsWith('https://')
            ? 'http'
            : String(scene.sceneReferenceImage).startsWith('data:image/')
              ? 'base64'
              : String(scene.sceneReferenceImage).startsWith('local-image://')
                ? 'local-image'
                : 'unknown',
        sceneReferenceImagePreview: scene.sceneReferenceImage ? String(scene.sceneReferenceImage).slice(0, 120) : '',
        characterRefCount: characterRefs.length,
        characterRefPreviews: characterRefDetails.map((detail, idx) => ({
          index: idx,
          characterId: detail.characterId,
          characterName: detail.characterName,
          source: detail.source,
          valueType: detail.valueType,
          preview: detail.preview,
        })),
        rawRefCount: rawRefs.length,
        processedRefCount: referenceImages.length,
        processedRefPreviews: referenceImages.map((ref, idx) => ({
          index: idx,
          preview: String(ref).slice(0, 120),
        })),
        generationMode: imageGenerationMode,
      });

      console.log('[SplitScenes] Generating image:', {
        sceneId,
        prompt: promptToUse.substring(0, 100),
        refCount: referenceImages.length,
        generationMode: imageGenerationMode,
        platform,
        model,
      });

      // Call image generation API
      const googleFlowTaskId = platform === 'googleflow' ? crypto.randomUUID() : undefined;
      if (googleFlowTaskId) {
        setGoogleFlowTaskIdBySceneId((current) => ({ ...current, [sceneId]: googleFlowTaskId }));
      }
      const apiResult = await submitGridImageRequest({
        platform,
        model,
        prompt: promptToUse,
        apiKey,
        baseUrl: imageBaseUrl,
        aspectRatio: storyboardConfig.aspectRatio || '9:16',
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        referenceMediaHints: referenceBias.hints,
        preferredCredentialId: referenceBias.preferredCredentialId,
        taskId: googleFlowTaskId,
        onSubmitted: (submittedAt) => {
          if (imageSignal.aborted) return;
          updateSplitSceneImageStatus(sceneId, {
            imageStatus: 'generating',
            imageProgress: 0,
            imageError: null,
          });
          markImageTimerStarted(sceneId, submittedAt);
        },
        signal: imageSignal,
      });

      // Direct URL result
      if (apiResult.imageUrl) {
        const persistResult = await persistSceneImage(apiResult.imageUrl, sceneId, 'first');
        updateSplitSceneImage(sceneId, persistResult.localPath, scene.width, scene.height, persistResult.httpUrl || undefined);
        if (platform === 'googleflow') {
          updateSplitSceneField(sceneId, 'imageProviderState', {
            provider: 'googleflow',
            preferredCredentialId: apiResult.credentialId,
            accountId: apiResult.accountId,
            ownerScopeId: apiResult.ownerScopeId,
            projectId: apiResult.flowProjectId,
            mediaIdsByOwnerScope: apiResult.mediaId && apiResult.ownerScopeId
              ? { [apiResult.ownerScopeId]: apiResult.mediaId }
              : undefined,
          });
        }
        autoSaveImageToLibrary(sceneId, persistResult.localPath);
        if (!suppressSuccessToast) {
          toast.success(t("director.imageDoneSaved", { index: sceneId + 1 }));
        }
        if (manageRunState) {
          setIsGenerating(false);
        }
        return;
      }

      // Async task - poll for completion
      let taskId: string | undefined = apiResult.taskId;
      console.log('[SplitScenes] Async task:', taskId);

      // Poll for completion if we have a task ID
      if (taskId) {
        const initialPollDelay = 30000;
        const pollInterval = 5000;

        updateSplitSceneImageStatus(sceneId, { imageProgress: 5 });
        await new Promise<void>((resolve, reject) => {
          const tid = setTimeout(resolve, initialPollDelay);
          imageSignal.addEventListener('abort', () => { clearTimeout(tid); reject(new Error('Cancelled by user')); }, { once: true });
        });

        for (let attempt = 0; ; attempt++) {
          const progress = Math.min(10 + attempt, 95);
          updateSplitSceneImageStatus(sceneId, { imageProgress: progress });

          const url = new URL(`${imageBaseUrl}/v1/tasks/${taskId}`);
          url.searchParams.set('_ts', Date.now().toString());

          const statusResponse = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Cache-Control': 'no-cache',
            },
            signal: imageSignal,
          });

          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              throw new Error('Task not found');
            }
            throw new Error(`Failed to check task status: ${statusResponse.status}`);
          }

          const statusData = await statusResponse.json();
          const status = (statusData.status ?? statusData.data?.status ?? 'unknown').toString().toLowerCase();

          if (status === 'completed' || status === 'succeeded' || status === 'success') {
            // Extract image URL (normalize array format)
            const images = statusData.result?.images ?? statusData.data?.result?.images;
            let imageUrl: string | undefined;
            if (images?.[0]) {
              const rawUrl = images[0].url || images[0];
              imageUrl = normalizeUrlValue(rawUrl);
            }
            imageUrl = imageUrl || normalizeUrlValue(statusData.output_url) || normalizeUrlValue(statusData.result_url) || normalizeUrlValue(statusData.url);

            if (!imageUrl) throw new Error('Task completed but returned no image URL');

            // Persist locally and keep the HTTP mirror when available.
            const persistResult = await persistSceneImage(imageUrl, sceneId, 'first');
            updateSplitSceneImage(sceneId, persistResult.localPath, scene.width, scene.height, persistResult.httpUrl || undefined);
            autoSaveImageToLibrary(sceneId, persistResult.localPath);
            if (!suppressSuccessToast) {
              toast.success(t("director.imageDoneSaved", { index: sceneId + 1 }));
            }
            if (manageRunState) {
              setIsGenerating(false);
            }
            return;
          }

          if (status === 'failed' || status === 'error') {
            const errorMsg = statusData.error || statusData.message || statusData.data?.error || 'Image generation failed';
            console.error('[SplitScenes] Task failed:', statusData);
            throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
          }

          await new Promise<void>((resolve, reject) => {
            const tid = setTimeout(resolve, pollInterval);
            imageSignal.addEventListener('abort', () => { clearTimeout(tid); reject(new Error('Cancelled by user')); }, { once: true });
          });
        }
      }

      throw new Error('Invalid API response: no image URL or task ID');
    } catch (error) {
      const err = error as Error;
      const userMessage = err.message;

      // User-initiated cancellation: AbortError or our explicit cancel message.
      if (err.name === 'AbortError' || err.message === 'Cancelled by user') {
        console.log(`[SplitScenes] Scene ${sceneId} image generation cancelled by user`);
        if (manageRunState) {
          setIsGenerating(false);
        }
        return;
      }

      console.error(`[SplitScenes] Scene ${sceneId} image generation failed:`, err);
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: 'failed',
        imageProgress: 0,
        imageError: userMessage,
      });
      toast.error(t("director.shotFailed", { index: sceneId + 1, message: userMessage }));
    } finally {
      if (manageRunState) {
        setIsGenerating(activeImageControllersRef.current.size > 1 || activeVideoControllersRef.current.size > 0);
      }
      clearImageTimer(sceneId);
      activeImageControllersRef.current.delete(sceneId);
    }
  }, [
    splitScenes,
    storyboardConfig,
    currentStyleId,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneField,
    autoSaveImageToLibrary,
    getCharacterReferenceDetails,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    processReferenceImagesForApi,
    markImageTimerStarted,
    clearImageTimer,
    setIsGenerating,
    activeImageControllersRef,
    activeVideoControllersRef,
    imageAbortRef,
    setGoogleFlowTaskIdBySceneId,
    t,
  ]);

  const handleGenerateAllImages = useCallback(async () => {
    if (splitScenes.length === 0) return;

    const imageFeatureConfig = getFeatureConfig('character_generation');
    await syncRuntimeLaneSettings();
    const imageLaneCount = await resolveLaneCount('image', imageFeatureConfig?.platform);
    const queueWorkers = buildLaneWorkers([], imageLaneCount);

    const queuedScenes = splitScenes.filter((scene) => !scene.imageDataUrl && !!scene.imagePrompt?.trim() && (scene.imageStatus === 'idle' || scene.imageStatus === 'failed'));
    if (queuedScenes.length === 0) {
      toast.info(t("director.allImagesReady"));
      return;
    }
    queuedScenes.forEach((scene) => {
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: 'queued',
          imageProgress: 0,
          imageError: null,
        });
    });

    const batchController = new AbortController();
    batchAbortRef.current = batchController;
    const flowSettings = getGenerationFlowSettings();
    const hasShotRefDependencies = queuedScenes.some((scene) => normalizeRefImageIndexes(scene.ref_image).length > 0);

    // Runs one shot end-to-end with the batch retry/timeout policy. Returns
    // false when the batch was aborted and the caller should stop.
    const runQueuedScene = async (scene: SplitScene): Promise<boolean> => {
      try {
        await withRetry(
          {
            attempts: flowSettings.retryAttempts + 1,
            signal: batchController.signal,
            onRetry: () => {
              updateSplitSceneImageStatus(scene.id, {
                imageStatus: 'queued',
                imageProgress: 0,
                imageError: null,
              });
            },
          },
          async () => {
            const timeoutMs = randomBetween(flowSettings.imageTimeoutMinMs, flowSettings.imageTimeoutMaxMs);
            const timeout = createTimeoutSignal(batchController.signal, timeoutMs);
            try {
              await handleGenerateSingleImage(scene.id, {
                manageRunState: false,
                signal: timeout.signal,
              });
            } catch (error) {
              if (batchController.signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
              if (!isAbortLikeError(error)) {
                console.error(`[SplitScenes] Batch: Scene ${scene.id} image generation failed:`, error);
              }
            } finally {
              timeout.cleanup();
            }

            if (batchController.signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
            const latest = getSceneByIdFromStore(scene.id);
            if (latest?.imageStatus === 'completed' && !!latest.imageDataUrl) {
              incrementBatchProgress('completed');
              return;
            }
            throw new Error(latest?.imageError || 'Image generation timed out or failed after retry.');
          },
        );
      } catch (error) {
        if (batchController.signal.aborted) return false;
        if (isAbortLikeError(error)) return false;
        const latest = getSceneByIdFromStore(scene.id);
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: 'failed',
          imageProgress: 0,
          imageError: latest?.imageError || 'Image generation timed out or failed after retry.',
        });
        incrementBatchProgress('failed');
      }
      return true;
    };

    setIsMergedRunning(true);
    startBatchProgress('images', queuedScenes.length);
    try {
      if (hasShotRefDependencies) {
        // Shots reference each other's output, so they must run in shot order.
        const orderedScenes = [...queuedScenes].sort((a, b) => getSceneShotIndex(a) - getSceneShotIndex(b));
        for (const scene of orderedScenes) {
          if (batchController.signal.aborted) break;
          const latestBeforeRun = getSceneByIdFromStore(scene.id) || scene;
          const missingRefs = getMissingShotReferenceLabels(latestBeforeRun);
          if (missingRefs.length > 0) {
            const message = t("director.missingShotRefs", { refs: missingRefs.join(', ') });
            updateSplitSceneImageStatus(scene.id, {
              imageStatus: 'failed',
              imageProgress: 0,
              imageError: message,
            });
            incrementBatchProgress('failed');
            continue;
          }
          const shouldContinue = await runQueuedScene(scene);
          if (!shouldContinue) break;
        }
      } else {
        await runLaneQueue(
          queuedScenes.map((scene) => ({ item: scene })),
          queueWorkers,
          async ({ item: scene }) => {
            await runQueuedScene(scene);
          },
          batchController.signal,
        );
      }
      if (batchController.signal.aborted) return;

      const state = useDirectorStore.getState();
      const activeProjectId = state.activeProjectId;
      const latestScenes = activeProjectId ? state.projects[activeProjectId]?.splitScenes || [] : [];
      const completedCount = queuedScenes.filter((scene) => {
        const latest = latestScenes.find((item) => item.id === scene.id);
        return !!latest?.imageDataUrl && latest.imageStatus === 'completed';
      }).length;
      const failedCount = queuedScenes.filter((scene) => {
        const latest = latestScenes.find((item) => item.id === scene.id);
        return latest?.imageStatus === 'failed';
      }).length;

      if (completedCount === queuedScenes.length) {
        toast.success('Đã tạo xong tất cả ảnh');
      } else if (completedCount > 0) {
        toast.info(`Đã tạo ${completedCount}/${queuedScenes.length} ảnh. ${failedCount > 0 ? `${failedCount} ảnh lỗi.` : 'Một số ảnh chưa hoàn tất.'}`);
      } else {
        toast.warning(`Chưa có ảnh nào hoàn tất trong ${queuedScenes.length} ảnh đã chạy.`);
      }
    } finally {
      if (batchAbortRef.current === batchController) {
        batchAbortRef.current = null;
      }
      setIsMergedRunning(false);
      finishBatchProgress();
    }
  }, [
    splitScenes,
    handleGenerateSingleImage,
    updateSplitSceneImageStatus,
    getMissingShotReferenceLabels,
    getSceneShotIndex,
    t,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress,
    setIsMergedRunning,
    batchAbortRef,
  ]);

  return { handleGenerateSingleImage, handleGenerateAllImages };
}
