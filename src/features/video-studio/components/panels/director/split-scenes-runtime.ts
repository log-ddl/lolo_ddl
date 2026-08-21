/**
 * Shared run-state for shot generation: busy flags, the AbortControllers that
 * back every stop button, and the Google Flow task ids used to surface the
 * live upload/reuse phase on each shot card.
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import { useGoogleFlowRuntimeStore } from "@/features/video-studio/stores/google-flow-runtime-store";
import type { ShotGenerationTimers } from "./split-scenes-timers";
import type { UpdateSplitSceneImageStatus, UpdateSplitSceneVideo } from "./split-scenes-helpers";

export interface GenerationRuntimeDeps {
  splitScenes: SplitScene[];
  updateSplitSceneImageStatus: UpdateSplitSceneImageStatus;
  updateSplitSceneVideo: UpdateSplitSceneVideo;
  timers: ShotGenerationTimers;
  t: Translate;
}

export interface GenerationRuntime {
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  isMergedRunning: boolean;
  setIsMergedRunning: (value: boolean) => void;
  setCurrentGeneratingId: (value: number | null) => void;
  imageAbortRef: MutableRefObject<AbortController | null>;
  videoAbortRef: MutableRefObject<AbortController | null>;
  activeImageControllersRef: MutableRefObject<Map<number, AbortController>>;
  activeVideoControllersRef: MutableRefObject<Map<number, AbortController>>;
  batchAbortRef: MutableRefObject<AbortController | null>;
  googleFlowTasks: ReturnType<typeof useGoogleFlowRuntimeStore.getState>['tasks'];
  googleFlowTaskIdBySceneId: Record<number, string>;
  setGoogleFlowTaskIdBySceneId: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  googleFlowVideoTaskIdBySceneId: Record<number, string>;
  setGoogleFlowVideoTaskIdBySceneId: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleStopAllGeneration: () => void;
  handleStopImageGeneration: (sceneId: number) => void;
  handleStopVideoGeneration: (sceneId: number) => void;
}

export function useGenerationRuntime({
  splitScenes,
  updateSplitSceneImageStatus,
  updateSplitSceneVideo,
  timers,
  t,
}: GenerationRuntimeDeps): GenerationRuntime {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMergedRunning, setIsMergedRunning] = useState(false);
  const [, setCurrentGeneratingId] = useState<number | null>(null);

  // AbortControllers for first-frame/video generation
  const imageAbortRef = useRef<AbortController | null>(null);
  const videoAbortRef = useRef<AbortController | null>(null);
  const activeImageControllersRef = useRef<Map<number, AbortController>>(new Map());
  const activeVideoControllersRef = useRef<Map<number, AbortController>>(new Map());
  const batchAbortRef = useRef<AbortController | null>(null);

  // Correlates each shot's in-flight Google Flow request to its live phase
  // (checking_media / uploading_media / media_ready) so the shot card can
  // show whether a reference image is being reused or freshly uploaded.
  const [googleFlowTaskIdBySceneId, setGoogleFlowTaskIdBySceneId] = useState<Record<number, string>>({});
  const [googleFlowVideoTaskIdBySceneId, setGoogleFlowVideoTaskIdBySceneId] = useState<Record<number, string>>({});
  const googleFlowTasks = useGoogleFlowRuntimeStore((state) => state.tasks);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  useEffect(() => initializeGoogleFlowRuntime(), [initializeGoogleFlowRuntime]);

  const { clearImageTimer, clearVideoTimer, resetShotTimers } = timers;

  const stopActiveImageJobs = useCallback(() => {
    imageAbortRef.current?.abort();
    imageAbortRef.current = null;
    activeImageControllersRef.current.forEach((controller) => controller.abort());
    activeImageControllersRef.current.clear();
  }, []);

  const stopActiveVideoJobs = useCallback(() => {
    videoAbortRef.current?.abort();
    videoAbortRef.current = null;
    activeVideoControllersRef.current.forEach((controller) => controller.abort());
    activeVideoControllersRef.current.clear();
  }, []);

  const handleStopAllGeneration = useCallback(() => {
    batchAbortRef.current?.abort();
    batchAbortRef.current = null;
    stopActiveImageJobs();
    stopActiveVideoJobs();

    splitScenes.forEach((scene) => {
      if (scene.imageStatus === 'queued' || scene.imageStatus === 'uploading' || scene.imageStatus === 'generating') {
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: 'idle',
          imageProgress: 0,
          imageError: t("director.userCancelled"),
        });
      }
      if (scene.videoStatus === 'queued' || scene.videoStatus === 'uploading' || scene.videoStatus === 'generating') {
        updateSplitSceneVideo(scene.id, {
          videoStatus: 'idle',
          videoProgress: 0,
          videoError: t("director.userCancelled"),
        });
      }
    });

    setIsMergedRunning(false);
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    resetShotTimers();
    toast.info(t("director.mergeStopped"));
  }, [splitScenes, stopActiveImageJobs, stopActiveVideoJobs, updateSplitSceneImageStatus, updateSplitSceneVideo, resetShotTimers, t]);

  // Stop first-frame image generation
  const handleStopImageGeneration = useCallback((sceneId: number) => {
    activeImageControllersRef.current.get(sceneId)?.abort();
    activeImageControllersRef.current.delete(sceneId);
    if (imageAbortRef.current) {
      imageAbortRef.current.abort();
      imageAbortRef.current = null;
    }
    updateSplitSceneImageStatus(sceneId, {
      imageStatus: 'idle',
      imageProgress: 0,
      imageError: t("director.userCancelled"),
    });
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    clearImageTimer(sceneId);
    toast.info(t("director.startFrameStopped", { index: sceneId + 1 }));
  }, [updateSplitSceneImageStatus, clearImageTimer, t]);

  // Stop video generation
  const handleStopVideoGeneration = useCallback((sceneId: number) => {
    activeVideoControllersRef.current.get(sceneId)?.abort();
    activeVideoControllersRef.current.delete(sceneId);
    if (videoAbortRef.current) {
      videoAbortRef.current.abort();
      videoAbortRef.current = null;
    }
    updateSplitSceneVideo(sceneId, {
      videoStatus: 'idle',
      videoProgress: 0,
      videoError: t("director.userCancelled"),
    });
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    clearVideoTimer(sceneId);
    toast.info(t("director.videoStopped", { index: sceneId + 1 }));
  }, [updateSplitSceneVideo, clearVideoTimer, t]);

  return {
    isGenerating,
    setIsGenerating,
    isMergedRunning,
    setIsMergedRunning,
    setCurrentGeneratingId,
    imageAbortRef,
    videoAbortRef,
    activeImageControllersRef,
    activeVideoControllersRef,
    batchAbortRef,
    googleFlowTasks,
    googleFlowTaskIdBySceneId,
    setGoogleFlowTaskIdBySceneId,
    googleFlowVideoTaskIdBySceneId,
    setGoogleFlowVideoTaskIdBySceneId,
    handleStopAllGeneration,
    handleStopImageGeneration,
    handleStopVideoGeneration,
  };
}
