/**
 * Video generation for the split-scenes panel: single-shot generation across
 * ref-to-video / text-to-video / image-to-video modes, plus the lane-queued
 * batch runner that drives them.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import type { Character } from "@/features/video-studio/stores/character-library-store";
import {
  useAPIConfigStore,
} from "@/features/video-studio/stores/api-config-store";
import type { DirectorProjectData, SplitScene } from "@/features/video-studio/stores/director-store";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/features/video-studio/lib/ai/feature-router";
import { generateProviderVideo, type GoogleFlowSourceState } from "@/features/video-studio/lib/ai/video-generator";
import { resolveGoogleFlowReferenceBias } from "@/features/video-studio/lib/ai/google-flow-reference-bias";
import { saveVideoToLocal } from "@/features/video-studio/lib/image-storage";
import { buildVideoPrompt } from "@/features/video-studio/lib/generation/prompt-builder";
import { resolveSceneAudioVoice } from "@/features/video-studio/lib/ai/voice-selection";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
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
  applyCharacterIdentityToPrompt,
  createTimeoutSignal,
  getSceneByIdFromStore,
  isAbortLikeError,
  isContentModerationError,
  isDiscouragedExternalImageUrl,
  isHttpImageUrl,
  isLocalImageSource,
  linkAbortSignals,
  randomBetween,
  shouldRefreshImageViaCurrentHost,
  type SceneGenerationOptions,
  type UpdateSplitSceneField,
  type UpdateSplitSceneVideo,
} from "./split-scenes-helpers";
import type { ShotReferences } from "./split-scenes-references";
import type { ShotGenerationTimers } from "./split-scenes-timers";
import type { GenerationRuntime } from "./split-scenes-runtime";

export interface VideoGenerationDeps {
  splitScenes: SplitScene[];
  storyboardConfig: DirectorProjectData['storyboardConfig'];
  frameMode: string;
  isRefToVideo: boolean;
  allCharacters: Character[];
  updateSplitSceneVideo: UpdateSplitSceneVideo;
  updateSplitSceneField: UpdateSplitSceneField;
  autoSaveVideoToLibrary: (sceneId: number, videoUrl: string, thumbnailUrl?: string, duration?: number) => string;
  references: ShotReferences;
  timers: ShotGenerationTimers;
  runtime: GenerationRuntime;
  t: Translate;
}

export interface VideoGeneration {
  handleGenerateSingleVideo: (sceneId: number, options?: SceneGenerationOptions) => Promise<void>;
  generateVideosForScenes: (sourceScenes: SplitScene[]) => Promise<void>;
  handleGenerateVideos: () => Promise<void>;
}

export function useVideoGeneration(deps: VideoGenerationDeps): VideoGeneration {
  const {
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
  } = deps;

  const { getCharacterReferenceImages, getShotReferenceDetails, getMissingShotReferenceLabels } = references;
  const { markVideoTimerStarted, clearVideoTimer, startBatchProgress, incrementBatchProgress, finishBatchProgress } = timers;
  const {
    setIsGenerating,
    setCurrentGeneratingId,
    activeImageControllersRef,
    activeVideoControllersRef,
    videoAbortRef,
    batchAbortRef,
    setGoogleFlowVideoTaskIdBySceneId,
  } = runtime;

  // Generate video for a single scene - directly calls API with key rotation
  const handleGenerateSingleVideo = useCallback(async (sceneId: number, options: SceneGenerationOptions = {}) => {
    const scene = getSceneByIdFromStore(sceneId) || splitScenes.find(s => s.id === sceneId);
    if (!scene) return;
    const { manageRunState = true, suppressSuccessToast = false, signal } = options;
    const buildSceneVideoPrompt = (audioVoice?: string) => applyCharacterIdentityToPrompt(
      buildVideoPrompt(scene, {
        includeVoiceOver: Boolean(scene.voiceOver?.trim() && (storyboardConfig.voiceMode === 'full' || audioVoice)),
      }),
      scene,
    );

    // Debug: Check API store state
    const apiStore = useAPIConfigStore.getState();
    if (process.env.NODE_ENV === 'development') {
      console.log('[SplitScenes] API Store state:', {
        providers: apiStore.providers.length,
        apiKeys: Object.keys(apiStore.apiKeys),
      });
    }

    // Use feature router with key rotation support
    const featureConfig = getFeatureConfig('video_generation');
    if (process.env.NODE_ENV === 'development') {
      console.log('[SplitScenes] Feature config for video_generation:', featureConfig ? {
        platform: featureConfig.platform,
        model: featureConfig.model || featureConfig.models?.[0],
        apiKey: featureConfig.apiKey ? `${featureConfig.apiKey.substring(0, 8)}...` : 'empty',
        providerId: featureConfig.provider?.id,
      } : 'null');
    }

    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('video_generation'));
      return;
    }

    // Get platform and model from the service mapping.
    const platform = featureConfig.platform;
    const model = featureConfig.model || featureConfig.models?.[0];
    if (!model) {
      toast.error(t("director.configureVideoModel"));
      return;
    }
    const videoBaseUrl = featureConfig.baseUrl?.replace(/\/+$/, '');
    if (!videoBaseUrl) {
      toast.error(t("director.configureVideoMapping"));
      return;
    }
    const isGoogleFlowVideo = platform === 'googleflow';
    const isGrokVideo = platform === 'grok';
    if (!isGoogleFlowVideo && !isGrokVideo) {
      toast.error('Tính năng tạo video hỗ trợ Google Flow hoặc Grok.');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[SplitScenes] Using video config:', { platform, model, videoBaseUrl });
    }

    // Get rotating key from manager
    const keyManager = featureConfig.keyManager;
    const apiKey = keyManager.getCurrentKey() || featureConfig.apiKey || '';
    if (!apiKey && !isGoogleFlowVideo && !isGrokVideo) {
      toast.error(t("director.configurePlatformKey", { platform }));
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SplitScenes] Using API key ${keyManager.getTotalKeyCount()} keys, current index available: ${keyManager.getAvailableKeyCount()}`);
    }

    if (manageRunState) {
      setIsGenerating(true);
      setCurrentGeneratingId(sceneId);
    }

    // Create an AbortController for this video generation run; stop buttons can abort through videoAbortRef.current.abort().
    const videoController = new AbortController();
    linkAbortSignals(videoController, signal);
    activeVideoControllersRef.current.set(sceneId, videoController);
    if (manageRunState) {
      videoAbortRef.current = videoController;
    }
    let hasSubmittedVideoRequest = false;
    const handleVideoSubmitted = (submittedAt?: number) => {
      if (hasSubmittedVideoRequest) return;
      hasSubmittedVideoRequest = true;
      updateSplitSceneVideo(sceneId, {
        videoStatus: 'generating',
        videoProgress: 0,
      });
      markVideoTimerStarted(sceneId, submittedAt);
    };

    try {
      // Keep the shot queued while references are prepared and the provider submit gate is waiting.
      updateSplitSceneVideo(sceneId, {
        videoStatus: 'queued',
        videoProgress: 0,
        videoError: null,
        videoUrl: null,
      });

      // ========== Ref-to-Video mode: skip image, send character refs directly ==========
      if (isRefToVideo) {
        const sceneRef = scene.sceneReferenceImage;
        const sceneMasterRef = (scene as any).sceneMasterReferenceImage;
        const missingShotRefs = getMissingShotReferenceLabels(scene);
        if (missingShotRefs.length > 0) {
          const message = t("director.missingShotRefs", { refs: missingShotRefs.join(', ') });
          toast.error(message);
          updateSplitSceneVideo(sceneId, { videoStatus: 'idle', videoProgress: 0, videoError: message });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }
        const shotRefs = getShotReferenceDetails(scene).map((item) => item.value).filter(Boolean);
        const characterRefs = scene.characterIds?.length
          ? getCharacterReferenceImages(scene.characterIds)
          : [];
        const rawRefs = [sceneMasterRef, sceneRef, ...shotRefs, ...characterRefs].filter(Boolean) as string[];
        if (rawRefs.length === 0) {
          toast.error(t("director.noCharacterRefs"));
          updateSplitSceneVideo(sceneId, { videoStatus: 'idle', videoProgress: 0 });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }

        const maxStudioRefInputs = rawRefs.slice(0, MAX_REFERENCE_IMAGES);
        // Ref-to-video uses scene reference first (if available), followed by character references.
        const processedRefs = maxStudioRefInputs;
        const referenceBias = platform === 'googleflow' ? resolveGoogleFlowReferenceBias(processedRefs) : { hints: {}, preferredCredentialId: undefined };
        const referenceImageFlowStates: Record<string, GoogleFlowSourceState> = {};
        for (const [source, hint] of Object.entries(referenceBias.hints)) {
          referenceImageFlowStates[source] = {
            ownerScopeId: hint.ownerScopeId,
            projectId: hint.flowProjectId,
            mediaIdsByOwnerScope: { [hint.ownerScopeId]: hint.mediaId },
          };
        }
        if (processedRefs.length === 0) {
          toast.error(t("director.noCharacterRefs"));
          updateSplitSceneVideo(sceneId, { videoStatus: 'idle', videoProgress: 0 });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }

        const videoDuration = normalizeVideoLength(scene.videoLength);
        const audioVoice = resolveSceneAudioVoice(scene, allCharacters, storyboardConfig);
        const fullPrompt = buildSceneVideoPrompt(audioVoice);
        console.log('[SplitScenes] Ref-to-video generation:', {
          sceneId,
          hasSceneRef: !!sceneRef,
          sceneRefPreview: sceneRef ? String(sceneRef).slice(0, 80) : '',
          shotRefCount: shotRefs.length,
          characterRefCount: characterRefs.length,
          refCount: processedRefs.length,
          audioVoice,
          duration: videoDuration,
          prompt: fullPrompt.substring(0, 80),
        });

        const googleFlowVideoTaskId = platform === 'googleflow' ? crypto.randomUUID() : undefined;
        if (googleFlowVideoTaskId) {
          setGoogleFlowVideoTaskIdBySceneId((current) => ({ ...current, [sceneId]: googleFlowVideoTaskId }));
        }
        const result = await generateProviderVideo({
            platform,
            sceneId,
            prompt: fullPrompt,
            model,
            aspectRatio: storyboardConfig.aspectRatio,
            referenceImageUrls: processedRefs,
            referenceImageFlowStates,
            preferredCredentialId: referenceBias.preferredCredentialId,
            taskId: googleFlowVideoTaskId,
            length: videoDuration,
            audioVoice,
            onProgress: (progress) => {
              updateSplitSceneVideo(sceneId, { videoProgress: progress });
            },
            onSubmitted: handleVideoSubmitted,
            signal: videoController.signal,
        });
        let finalVideoUrl = result.videoUrl;
        if (platform === 'googleflow') {
          updateSplitSceneField(sceneId, 'videoProviderState', {
            provider: 'googleflow', preferredCredentialId: result.credentialId,
            accountId: result.accountId, ownerScopeId: result.ownerScopeId, projectId: result.flowProjectId,
            mediaIdsByOwnerScope: result.mediaId && result.ownerScopeId ? { [result.ownerScopeId]: result.mediaId } : undefined,
          });
        }

        try {
          const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
          finalVideoUrl = await saveVideoToLocal(finalVideoUrl, filename);
          console.log('[SplitScenes] Ref-video saved locally:', finalVideoUrl);
        } catch (e) {
          console.warn('[SplitScenes] Failed to save ref-video locally:', e);
        }

        const mediaId = autoSaveVideoToLibrary(sceneId, finalVideoUrl, undefined, videoDuration);
        updateSplitSceneVideo(sceneId, {
          videoStatus: 'completed',
          videoProgress: 100,
          videoUrl: finalVideoUrl,
          videoMediaId: mediaId,
        });
        if (!suppressSuccessToast) {
          toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
        }

        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }

      const audioVoice = resolveSceneAudioVoice(scene, allCharacters, storyboardConfig);
      const fullPrompt = buildSceneVideoPrompt(audioVoice);
      const videoDuration = normalizeVideoLength(scene.videoLength);

      // ========== Image-to-Video mode (existing flow) ==========
      // First-frame image selection logic:
      // 1. If a local persisted image exists and an image host is configured, prefer re-uploading the local image.
      // 2. Otherwise, reuse the HTTP URL only when imageSource === 'ai-generated' and a valid HTTP URL already exists.
      // 3. In all other cases, use imageDataUrl and convert it to an HTTP URL later.
      let firstFrameUrl = scene.imageDataUrl || (isHttpImageUrl(scene.imageHttpUrl) ? scene.imageHttpUrl : '');
      const sceneIndex = splitScenes.findIndex((item) => item.id === sceneId);
      const nextScene = sceneIndex >= 0 ? splitScenes[sceneIndex + 1] : undefined;
      const crossesEpisodeBoundary = Boolean(
        scene.sourceEpisodeId
        && nextScene?.sourceEpisodeId
        && scene.sourceEpisodeId !== nextScene.sourceEpisodeId,
      );
      const linkedEndScene = frameMode === 'both' && !crossesEpisodeBoundary ? nextScene : undefined;
      const endFrameUrl = linkedEndScene
        ? linkedEndScene.imageDataUrl || (isHttpImageUrl(linkedEndScene.imageHttpUrl) ? linkedEndScene.imageHttpUrl : '')
        : '';
      const hasValidHttpUrl = isHttpImageUrl(scene.imageHttpUrl);
      const shouldRefreshFirstFrame = shouldRefreshImageViaCurrentHost(scene.imageDataUrl);

      if (isLocalImageSource(scene.imageDataUrl)) {
        if (shouldRefreshFirstFrame) {
          if (hasValidHttpUrl) {
            console.log(
              `[SplitScenes] Using local first frame and refreshing via configured image host${isDiscouragedExternalImageUrl(scene.imageHttpUrl) ? ' (skipping discouraged external URL)' : ''}:`,
              scene.imageHttpUrl!.substring(0, 60)
            );
          } else {
            console.log('[SplitScenes] Using local first frame and uploading to configured image host');
          }
          firstFrameUrl = scene.imageDataUrl;
        } else if (hasValidHttpUrl && scene.imageSource === 'ai-generated') {
          // Only fall back to an existing HTTP URL when no image host is available.
          console.log('[SplitScenes] Using imageHttpUrl for AI-generated image:', scene.imageHttpUrl!.substring(0, 60));
          firstFrameUrl = scene.imageHttpUrl!;
        } else {
          console.log(
            '[SplitScenes] Using imageDataUrl (will upload to image host):',
            hasValidHttpUrl ? 'has old httpUrl but imageSource=' + scene.imageSource : 'no valid httpUrl'
          );
        }
      }

      if (!firstFrameUrl) {
        if (!scene.videoPrompt?.trim()) {
          toast.error(t("director.noFirstFrame", { index: sceneId + 1 }));
          setIsGenerating(false);
          setCurrentGeneratingId(null);
          return;
        }

        // Text-to-video mode: videoPrompt exists but no first-frame image exists.
        const result = await generateProviderVideo({
            platform,
            sceneId,
            prompt: fullPrompt,
            model,
            aspectRatio: storyboardConfig.aspectRatio,
            length: videoDuration,
            audioVoice,
            onProgress: (progress) => {
              updateSplitSceneVideo(sceneId, { videoProgress: progress });
            },
            onSubmitted: handleVideoSubmitted,
            signal: videoController.signal,
        });

        let finalVideoUrl = result.videoUrl;
        if (platform === 'googleflow') {
          updateSplitSceneField(sceneId, 'videoProviderState', {
            provider: 'googleflow', preferredCredentialId: result.credentialId,
            accountId: result.accountId, ownerScopeId: result.ownerScopeId, projectId: result.flowProjectId,
            mediaIdsByOwnerScope: result.mediaId && result.ownerScopeId ? { [result.ownerScopeId]: result.mediaId } : undefined,
          });
        }
        try {
          const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
          finalVideoUrl = await saveVideoToLocal(result.videoUrl, filename);
          console.log('[SplitScenes] Text-to-video saved locally:', finalVideoUrl);
        } catch (e) {
          console.warn('[SplitScenes] Failed to save text-to-video locally, using URL:', e);
        }

        const mediaId = autoSaveVideoToLibrary(sceneId, finalVideoUrl, undefined, videoDuration);
        updateSplitSceneVideo(sceneId, {
          videoStatus: 'completed',
          videoProgress: 100,
          videoUrl: finalVideoUrl,
          videoMediaId: mediaId,
        });
        if (!suppressSuccessToast) {
          toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
        }
        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }
      console.log('[SplitScenes] First frame source:', firstFrameUrl.startsWith('http') ? 'HTTP URL' : 'local/base64');

      console.log('[SplitScenes] Video generation params:', {
        sceneId,
        hasFirstFrame: !!firstFrameUrl,
        hasLinkedEndFrame: !!endFrameUrl,
        duration: videoDuration,
        fullPrompt,
      });

      const result = await generateProviderVideo({
          platform,
          sceneId,
          prompt: fullPrompt,
          model,
          aspectRatio: storyboardConfig.aspectRatio,
          length: videoDuration,
          startImageUrl: firstFrameUrl,
          endImageUrl: endFrameUrl || undefined,
          preferredCredentialId: platform === 'googleflow'
            ? scene.imageProviderState?.preferredCredentialId
            : undefined,
          startImageFlowState: platform === 'googleflow' ? scene.imageProviderState : undefined,
          endImageFlowState: platform === 'googleflow' ? linkedEndScene?.imageProviderState : undefined,
          audioVoice,
          onProgress: (progress) => {
            updateSplitSceneVideo(sceneId, { videoProgress: progress });
          },
          onSubmitted: handleVideoSubmitted,
          signal: videoController.signal,
      });

      // Save video to local file system (Electron) for persistence
      let finalVideoUrl = result.videoUrl;
      if (platform === 'googleflow') {
        updateSplitSceneField(sceneId, 'videoProviderState', {
          provider: 'googleflow', preferredCredentialId: result.credentialId,
          accountId: result.accountId, ownerScopeId: result.ownerScopeId, projectId: result.flowProjectId,
          mediaIdsByOwnerScope: result.mediaId && result.ownerScopeId ? { [result.ownerScopeId]: result.mediaId } : undefined,
        });
      }
      try {
        const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
        finalVideoUrl = await saveVideoToLocal(result.videoUrl, filename);
        console.log('[SplitScenes] Video saved locally:', finalVideoUrl);
      } catch (e) {
        console.warn('[SplitScenes] Failed to save video locally, using URL:', e);
      }

      // Auto-save to library (use first frame as thumbnail, pass duration)
      const mediaId = autoSaveVideoToLibrary(sceneId, finalVideoUrl, scene.imageDataUrl, videoDuration);
      updateSplitSceneVideo(sceneId, {
        videoStatus: 'completed',
        videoProgress: 100,
        videoUrl: finalVideoUrl,
        videoMediaId: mediaId,
      });
      if (!suppressSuccessToast) {
        toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
      }

      if (manageRunState) {
        setIsGenerating(false);
        setCurrentGeneratingId(null);
      }

    } catch (error) {
      const err = error as Error;

      // User-triggered cancellation: AbortError from abort() or the custom cancellation path.
      if (err.name === 'AbortError' || err.message === 'Cancelled by user') {
        console.log(`[SplitScenes] Scene ${sceneId} video generation cancelled by user`);
        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }

      console.error(`[SplitScenes] Scene ${sceneId} video generation failed:`, err);

      // Detect content-moderation errors.
      const isModerationError = isContentModerationError(err);

      if (isModerationError) {
        // Mark moderation errors with the MODERATION_SKIPPED: prefix.
        updateSplitSceneVideo(sceneId, {
          videoStatus: 'failed',
          videoProgress: 0,
          videoError: `MODERATION_SKIPPED:${err.message}`,
        });
        toast.warning(t("director.skippedModeration", { index: sceneId + 1 }));
        console.log(`[SplitScenes] Scene ${sceneId} skipped due to content moderation`);
      } else {
        // Ordinary error path
        updateSplitSceneVideo(sceneId, {
          videoStatus: 'failed',
          videoProgress: 0,
          videoError: err.message,
        });
        toast.error(t("director.shotFailed", { index: sceneId + 1, message: err.message }));
      }
    } finally {
      clearVideoTimer(sceneId);
      if (manageRunState) {
        setIsGenerating(activeImageControllersRef.current.size > 0 || activeVideoControllersRef.current.size > 1);
        setCurrentGeneratingId(null);
      }
      activeVideoControllersRef.current.delete(sceneId);
    }
  }, [
    splitScenes,
    storyboardConfig,
    frameMode,
    allCharacters,
    updateSplitSceneVideo,
    updateSplitSceneField,
    autoSaveVideoToLibrary,
    getCharacterReferenceImages,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    isRefToVideo,
    markVideoTimerStarted,
    clearVideoTimer,
    setIsGenerating,
    setCurrentGeneratingId,
    activeImageControllersRef,
    activeVideoControllersRef,
    videoAbortRef,
    setGoogleFlowVideoTaskIdBySceneId,
    t,
  ]);

  // Handle generate videos using the same lane model as image generation.
  // Reuse handleGenerateSingleVideo so all video requests follow the same API path.
  const generateVideosForScenes = useCallback(async (sourceScenes: SplitScene[]) => {
    if (sourceScenes.length === 0) {
      toast.error(t("director.noShotsToGenerate"));
      return;
    }

    const featureConfig = getFeatureConfig('video_generation');
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('video_generation'));
      return;
    }

    // Check if all scenes have prompts
    const scenesWithoutPrompts = sourceScenes.filter(
      s => !s.videoPrompt?.trim()
    );
    if (scenesWithoutPrompts.length > 0) {
      toast.warning(t("director.missingPromptCount", { count: scenesWithoutPrompts.length }));
    }

    // Filter scenes that need generation (idle or failed). Allow text-to-video when a shot has
    // a video prompt but no first-frame image; handleGenerateSingleVideo already supports it.
    const scenesToGenerate = sourceScenes.filter(
      s => (s.videoStatus === 'idle' || s.videoStatus === 'failed') && !!s.videoPrompt?.trim() && (isRefToVideo || !!s.imageDataUrl || !s.imagePrompt?.trim())
    );

    if (scenesToGenerate.length === 0) {
      toast.info(t("director.allShotsAlreadyGenerating"));
      return;
    }

    await syncRuntimeLaneSettings();
    const laneCount = await resolveLaneCount('video', featureConfig.platform);
    const queueWorkers = buildLaneWorkers([], laneCount);

    scenesToGenerate.forEach((scene) => {
      updateSplitSceneVideo(scene.id, {
        videoStatus: 'queued',
        videoProgress: 0,
        videoError: null,
      });
    });

    const batchController = new AbortController();
    batchAbortRef.current = batchController;

    setIsGenerating(true);
    toast.info(t("director.startSerialVideo", { count: scenesToGenerate.length, concurrency: laneCount }));

    let successCount = 0;
    const totalCount = scenesToGenerate.length;
    const flowSettings = getGenerationFlowSettings();
    startBatchProgress('videos', totalCount);

    try {
      await runLaneQueue(
        scenesToGenerate.map((scene) => ({ item: scene })),
        queueWorkers,
        async ({ item: scene }) => {
          try {
            await withRetry(
              {
                attempts: flowSettings.retryAttempts + 1,
                signal: batchController.signal,
                retryable: (error) => !/tất cả tài khoản grok/i.test(error instanceof Error ? error.message : String(error)),
                onRetry: () => {
                  updateSplitSceneVideo(scene.id, {
                    videoStatus: 'queued',
                    videoProgress: 0,
                    videoError: null,
                    videoUrl: null,
                  });
                },
              },
              async () => {
                const timeoutMs = randomBetween(flowSettings.videoTimeoutMinMs, flowSettings.videoTimeoutMaxMs);
                const timeout = createTimeoutSignal(batchController.signal, timeoutMs);
                try {
                  await handleGenerateSingleVideo(scene.id, {
                    manageRunState: false,
                    signal: timeout.signal,
                  });
                } catch (error) {
                  if (batchController.signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
                  if (!isAbortLikeError(error)) {
                    console.error(`[SplitScenes] Batch: Scene ${scene.id} video generation failed:`, error);
                  }
                } finally {
                  timeout.cleanup();
                }

                if (batchController.signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
                const latest = getSceneByIdFromStore(scene.id);
                if (latest?.videoStatus === 'completed' && latest.videoUrl) {
                  successCount++;
                  incrementBatchProgress('completed');
                  return;
                }

                // Every Grok account is out of 720p video quota (the runtime throws
                // "Tất cả tài khoản Grok đã hết lượt tạo video."). Retrying or moving
                // to the next shot is pointless — stop the whole batch now. Matches
                // only the Grok all-accounts message, so Flow and other providers are unaffected.
                const error = latest?.videoError || 'Video generation timed out or failed after retry.';
                if (/tất cả tài khoản grok/i.test(error)) {
                  toast.error('Tất cả tài khoản Grok đã hết lượt tạo video — đã dừng tạo hàng loạt.');
                  batchController.abort();
                  throw new DOMException('Cancelled by user', 'AbortError');
                }
                throw new Error(error);
              },
            );
          } catch (error) {
            if (batchController.signal.aborted) return;
            if (isAbortLikeError(error)) return;
            const latest = getSceneByIdFromStore(scene.id);
            updateSplitSceneVideo(scene.id, {
              videoStatus: 'failed',
              videoProgress: 0,
              videoError: latest?.videoError || 'Video generation timed out or failed after retry.',
            });
            incrementBatchProgress('failed');
          }
        },
        batchController.signal,
      );
    } finally {
      if (batchAbortRef.current === batchController) {
        batchAbortRef.current = null;
      }
      setIsGenerating(false);
      setCurrentGeneratingId(null);
      finishBatchProgress();
    }
    if (batchController.signal.aborted) return;

    if (successCount === totalCount) {
      toast.success(t("director.allVideosDone"));
    } else if (successCount > 0) {
      toast.info(t("director.someVideosDone", { success: successCount, total: totalCount, failed: totalCount - successCount }));
    }
  }, [
    handleGenerateSingleVideo,
    updateSplitSceneVideo,
    isRefToVideo,
    t,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress,
    setIsGenerating,
    setCurrentGeneratingId,
    batchAbortRef,
  ]);

  const handleGenerateVideos = useCallback(async () => {
    await generateVideosForScenes(splitScenes);
  }, [generateVideosForScenes, splitScenes]);

  return { handleGenerateSingleVideo, generateVideosForScenes, handleGenerateVideos };
}
