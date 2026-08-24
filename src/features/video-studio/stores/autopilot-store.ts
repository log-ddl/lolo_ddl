import { create } from 'zustand';
import { AutopilotEngine } from '@/features/video-studio/autopilot/autopilot-engine';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import { useLicenseStore } from '@/shared/stores/license-store';
import { hasPlanAccess } from '@/shared/lib/license-client';
import type { AutopilotEvent } from '@/features/video-studio/autopilot/types';
import type { VideoLength } from '@/features/video-studio/types/script';
import type {
  AutopilotEngineStatus,
  AutopilotJob,
  AutopilotJobCreateResult,
  AutopilotJobInput,
  AutopilotJobListItem,
} from '@/features/video-studio/autopilot/types';

export const autopilotEngine = new AutopilotEngine();

const loadedProjectIds = new Set<string>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const saveChains = new Map<string, Promise<void>>();

function jobStorageKey(projectId: string): string {
  return `_p/${projectId}/autopilot-jobs`;
}

async function readJobStorage(key: string): Promise<string | null> {
  if (window.fileStorage) return window.fileStorage.getItem(key);
  return localStorage.getItem(key);
}

async function writeJobStorage(key: string, value: string): Promise<void> {
  if (window.fileStorage) {
    await window.fileStorage.setItem(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

async function waitForProjectHydration(): Promise<void> {
  if (useProjectStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = useProjectStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (useProjectStore.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
}

async function persistProjectJobs(projectId: string): Promise<void> {
  const snapshots = autopilotEngine.listJobs()
    .filter((job) => job.projectId === projectId)
    .slice(0, 100);
  await writeJobStorage(jobStorageKey(projectId), JSON.stringify({
    version: 3,
    savedAt: Date.now(),
    jobs: snapshots,
  }));
}

function scheduleProjectSave(projectId: string | undefined): void {
  if (!projectId) return;
  const existing = saveTimers.get(projectId);
  if (existing) clearTimeout(existing);
  saveTimers.set(projectId, setTimeout(() => {
    saveTimers.delete(projectId);
    const previous = saveChains.get(projectId) || Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => persistProjectJobs(projectId))
      .catch((error) => console.error(`[AutoPilot] Failed to persist jobs for ${projectId}:`, error));
    saveChains.set(projectId, next);
    void next.finally(() => {
      if (saveChains.get(projectId) === next) saveChains.delete(projectId);
    });
  }, 150));
}

export async function hydrateAutopilotProject(projectId: string): Promise<void> {
  if (!projectId || loadedProjectIds.has(projectId)) return;
  loadedProjectIds.add(projectId);
  try {
    const raw = await readJobStorage(jobStorageKey(projectId));
    if (!raw) return;
    const parsed = JSON.parse(raw) as { jobs?: AutopilotJob[] };
    if (Array.isArray(parsed.jobs)) autopilotEngine.restoreJobs(parsed.jobs, projectId);
  } catch (error) {
    loadedProjectIds.delete(projectId);
    console.error(`[AutoPilot] Failed to restore jobs for ${projectId}:`, error);
  }
}

interface AutopilotState {
  port: number;
  serverRunning: boolean;
  flowRunning: boolean;
  flowReadyCredentials: number;
  flowBindingCount: number;
  jobs: AutopilotJobListItem[];
  createJob: (input: AutopilotJobInput) => AutopilotJobCreateResult;
  cancelJob: (jobId: string) => boolean;
  resumeJob: (jobId: string) => boolean;
  updateShotPrompts: (jobId: string, shotIndex: number, patch: { imagePrompt?: string; videoPrompt?: string }) => boolean;
  updateShotImagePath: (jobId: string, shotIndex: number, newImagePath: string) => boolean;
  updateShotReferences: (jobId: string, shotIndex: number, patch: { characterNames?: string[]; sceneRefId?: string }) => boolean;
  updateShotVideoLength: (jobId: string, shotIndex: number, videoLength: VideoLength) => boolean;
  removeShotImage: (jobId: string, shotIndex: number) => boolean;
  regenerateShotMedia: (jobId: string, shotIndex: number, kind: 'image' | 'video') => boolean;
  importShotImage: (jobId: string, shotIndex: number, source: string) => Promise<boolean>;
  importCharacterImage: (jobId: string, name: string, source: string) => Promise<boolean>;
  importSceneImage: (jobId: string, name: string, source: string) => Promise<boolean>;
  regenerateReferenceImage: (jobId: string, kind: 'character' | 'scene', name: string) => boolean;
  updateReferencePrompt: (jobId: string, kind: 'character' | 'scene', name: string, newPrompt: string) => boolean;
  rerenderJob: (jobId: string, renderPatch?: { subtitles?: boolean; bgmPath?: string; bgmVolume?: number; bgmDuckVoice?: boolean; resolution?: '1280x720' | '1920x1080' | '3840x2160'; fps?: 24 | 30 | 60; codec?: 'libx264' | 'libx265' | 'h264_nvenc'; audioNormalize?: boolean; videoAudioVolume?: number }) => boolean;
  removeJob: (jobId: string) => boolean;
  refreshEngineStatus: () => Promise<void>;
}

function toListItem(job: AutopilotJob): AutopilotJobListItem {
  return {
    id: job.id,
    projectId: job.projectId,
    title: job.title,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    error: job.error,
    input: job.input,
    executionMode: job.executionMode,
    completedSteps: job.completedSteps,
    nextStep: job.nextStep,
    awaitingNextStep: job.awaitingNextStep,
    plannedCharacters: job.plannedCharacters,
    plannedScenes: job.plannedScenes,
    plannedShots: job.plannedShots,
    audioPath: job.audioPath,
    audioDurationMs: job.audioDurationMs,
    srtSegments: job.srtSegments,
    outputVideoPath: job.outputVideoPath,
    shotCount: job.shotCount,
    characterCount: job.characterCount,
    characterOutputs: job.characterOutputs,
    sceneCount: job.sceneCount,
    sceneOutputs: job.sceneOutputs,
    mediaOutputs: job.mediaOutputs,
    longFormMode: job.longFormMode,
    chapters: job.chapters,
  };
}

export const useAutopilotStore = create<AutopilotState>((set, get) => {
  const syncJobs = () => {
    const activeProjectId = useProjectStore.getState().activeProjectId;
    const jobs = autopilotEngine.listJobs()
      .filter((job) => !!activeProjectId && job.projectId === activeProjectId)
      .map(toListItem);
    set({ jobs });
  };

  autopilotEngine.onEvent((event: AutopilotEvent) => {
    syncJobs();
    const projectId = event.type === 'job-updated'
      ? event.job.projectId
      : event.type === 'job-removed'
        ? event.projectId
        : autopilotEngine.getJob(event.jobId)?.projectId;
    scheduleProjectSave(projectId);
  });

  useProjectStore.subscribe((state, previous) => {
    if (state.activeProjectId === previous.activeProjectId) return;
    syncJobs();
    if (state.activeProjectId) void hydrateAutopilotProject(state.activeProjectId);
  });

  void (async () => {
    await waitForProjectHydration();
    const activeProjectId = useProjectStore.getState().activeProjectId;
    if (activeProjectId) await hydrateAutopilotProject(activeProjectId);
    syncJobs();
    try {
      const status = await window.autopilotBridge?.getServerStatus();
      if (status) set({ port: status.port, serverRunning: status.running });
    } catch {
      // ignore — bridge may not exist in web mode
    }
  })();

  return {
    port: 0,
    serverRunning: false,
    flowRunning: false,
    flowReadyCredentials: 0,
    flowBindingCount: 0,
    jobs: [],

    createJob: (input) => {
      if (!hasPlanAccess(useLicenseStore.getState().plan, 'dev')) {
        return { ok: false, error: 'AutoPilot chỉ dành cho gói Dev.' };
      }
      const job = autopilotEngine.createJob(input);
      return { ok: true, jobId: job.id };
    },

    cancelJob: (jobId) => autopilotEngine.cancelJob(jobId),

    resumeJob: (jobId) => autopilotEngine.resumeJob(jobId),

    updateShotPrompts: (jobId, shotIndex, patch) => autopilotEngine.updateShotPrompts(jobId, shotIndex, patch),

    updateShotImagePath: (jobId, shotIndex, newImagePath) => autopilotEngine.updateShotImagePath(jobId, shotIndex, newImagePath),

    updateShotReferences: (jobId, shotIndex, patch) => autopilotEngine.updateShotReferences(jobId, shotIndex, patch),

    updateShotVideoLength: (jobId, shotIndex, videoLength) => autopilotEngine.updateShotVideoLength(jobId, shotIndex, videoLength),

    removeShotImage: (jobId, shotIndex) => autopilotEngine.removeShotImage(jobId, shotIndex),

    regenerateShotMedia: (jobId, shotIndex, kind) => autopilotEngine.regenerateShotMedia(jobId, shotIndex, kind),

    importShotImage: (jobId, shotIndex, source) => autopilotEngine.importShotImage(jobId, shotIndex, source),

    importCharacterImage: (jobId, name, source) => autopilotEngine.importCharacterImage(jobId, name, source),

    importSceneImage: (jobId, name, source) => autopilotEngine.importSceneImage(jobId, name, source),

    regenerateReferenceImage: (jobId, kind, name) => autopilotEngine.regenerateReferenceImage(jobId, kind, name),

    updateReferencePrompt: (jobId, kind, name, newPrompt) => autopilotEngine.updateReferencePrompt(jobId, kind, name, newPrompt),

    rerenderJob: (jobId, renderPatch) => autopilotEngine.rerenderJob(jobId, renderPatch),

    removeJob: (jobId) => autopilotEngine.removeJob(jobId),

    refreshEngineStatus: async () => {
      const status = await window.autopilotBridge?.getServerStatus();
      set({
        port: status?.port ?? get().port,
        serverRunning: status?.running ?? get().serverRunning,
      });
      let flowRunning = false;
      let flowReadyCredentials = 0;
      let flowBindingCount = 0;
      try {
        const flowStatus = await window.googleFlowRuntime?.getStatus();
        flowRunning = !!flowStatus?.running;
        flowReadyCredentials = flowStatus?.readyCredentialCount ?? 0;
        const activeProjectId = useProjectStore.getState().activeProjectId;
        if (activeProjectId) {
          const bindings = await window.googleFlowRuntime?.listProjectBindings(activeProjectId);
          flowBindingCount = bindings?.length ?? 0;
        }
      } catch {
        // ignore
      }
      set({ flowRunning, flowReadyCredentials, flowBindingCount });
    },
  };
});

export function buildEngineStatus(): AutopilotEngineStatus {
  const state = useAutopilotStore.getState();
  const runningJobs = state.jobs.filter(
    (job) => job.status === 'running' || job.status === 'queued',
  ).length;
  return {
    port: state.port,
    serverRunning: state.serverRunning,
    rendererReady: true,
    flowRunning: state.flowRunning,
    flowReadyCredentials: state.flowReadyCredentials,
    flowBindingCount: state.flowBindingCount,
    activeJobCount: runningJobs,
  };
}
