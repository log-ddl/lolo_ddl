/**
 * Per-shot elapsed timers and batch progress state for the split-scenes panel.
 */

import { useCallback, useEffect, useState } from "react";
import { useNow } from "@/shared/lib/use-now";
import type { DirectorBatchProgress } from "./split-scenes-helpers";

export interface ShotGenerationTimers {
  compactNow: number;
  runningImageStartedAtBySceneId: Record<number, number>;
  runningVideoStartedAtBySceneId: Record<number, number>;
  batchProgress: DirectorBatchProgress | null;
  markImageTimerStarted: (sceneId: number, submittedAt?: number) => void;
  clearImageTimer: (sceneId: number) => void;
  markVideoTimerStarted: (sceneId: number, submittedAt?: number) => void;
  clearVideoTimer: (sceneId: number) => void;
  resetShotTimers: () => void;
  startBatchProgress: (phase: DirectorBatchProgress['phase'], total: number) => void;
  incrementBatchProgress: (result: 'completed' | 'failed') => void;
  finishBatchProgress: () => void;
}

/**
 * Wall-clock duration of the last generation run. Kept separate from
 * `useShotGenerationTimers` because it reads the busy flags that the runtime
 * hook owns, and the runtime hook in turn consumes the per-shot timers.
 */
export function useGenerationElapsed(isRunning: boolean): number | null {
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [completedGenerationSeconds, setCompletedGenerationSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (generationStartedAt) {
        setCompletedGenerationSeconds((Date.now() - generationStartedAt) / 1000);
        setGenerationStartedAt(null);
      }
      return;
    }

    setCompletedGenerationSeconds(null);
    setGenerationStartedAt((current) => current ?? Date.now());
  }, [isRunning, generationStartedAt]);

  return completedGenerationSeconds;
}

export function useShotGenerationTimers(): ShotGenerationTimers {
  const [runningImageStartedAtBySceneId, setRunningImageStartedAtBySceneId] = useState<Record<number, number>>({});
  const [runningVideoStartedAtBySceneId, setRunningVideoStartedAtBySceneId] = useState<Record<number, number>>({});
  const [batchProgress, setBatchProgress] = useState<DirectorBatchProgress | null>(null);

  const compactNow = useNow(
    Object.keys(runningImageStartedAtBySceneId).length > 0 || Object.keys(runningVideoStartedAtBySceneId).length > 0
  );

  const markImageTimerStarted = useCallback((sceneId: number, submittedAt = Date.now()) => {
    setRunningImageStartedAtBySceneId((current) => current[sceneId] ? current : { ...current, [sceneId]: submittedAt });
  }, []);

  const clearImageTimer = useCallback((sceneId: number) => {
    setRunningImageStartedAtBySceneId((current) => {
      if (!current[sceneId]) return current;
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }, []);

  const markVideoTimerStarted = useCallback((sceneId: number, submittedAt = Date.now()) => {
    setRunningVideoStartedAtBySceneId((current) => current[sceneId] ? current : { ...current, [sceneId]: submittedAt });
  }, []);

  const clearVideoTimer = useCallback((sceneId: number) => {
    setRunningVideoStartedAtBySceneId((current) => {
      if (!current[sceneId]) return current;
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }, []);

  const resetShotTimers = useCallback(() => {
    setRunningImageStartedAtBySceneId({});
    setRunningVideoStartedAtBySceneId({});
  }, []);

  const startBatchProgress = useCallback((phase: DirectorBatchProgress['phase'], total: number) => {
    setBatchProgress({
      phase,
      label: phase === 'images' ? 'Đang tạo ảnh' : 'Đang tạo video',
      completed: 0,
      failed: 0,
      total,
      active: true,
    });
  }, []);

  const incrementBatchProgress = useCallback((result: 'completed' | 'failed') => {
    setBatchProgress((current) => {
      if (!current) return current;
      const next = {
        ...current,
        completed: current.completed + (result === 'completed' ? 1 : 0),
        failed: current.failed + (result === 'failed' ? 1 : 0),
      };
      return {
        ...next,
        active: next.completed + next.failed < next.total,
      };
    });
  }, []);

  const finishBatchProgress = useCallback(() => {
    setBatchProgress((current) => current ? { ...current, active: false } : current);
  }, []);

  return {
    compactNow,
    runningImageStartedAtBySceneId,
    runningVideoStartedAtBySceneId,
    batchProgress,
    markImageTimerStarted,
    clearImageTimer,
    markVideoTimerStarted,
    clearVideoTimer,
    resetShotTimers,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress,
  };
}
