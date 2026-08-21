import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileStorage } from '@/shared/lib/indexed-db-storage';
import { generateUUID } from '@/shared/lib/utils';
import { switchProject } from '@/features/video-studio/lib/project-switcher';
import { autopilotEngine, hydrateAutopilotProject } from '@/features/video-studio/stores/autopilot-store';
import type { AutopilotJobInput, AutopilotJobStatus, AutopilotStage, AutopilotStep } from '@/features/video-studio/autopilot/types';

/**
 * Batch / project queue (Phase 1)
 *
 * Runs whole projects one after another. Each entry captures a project's AutoPilot
 * input plus an optional `stopAfterStep` endpoint (chỉ tạo shot / nhân vật+cảnh /
 * ảnh / video / đầy đủ). The runner switches the active project to each entry's
 * project before creating its job, so all generated media routes to the right
 * project, then waits for the job to finish, waits the configured between-project
 * delay, and advances to the next entry.
 *
 * Only ONE project runs at a time by design (renders + memory are the bottleneck);
 * per-lane concurrency inside a single project is still handled by the engine.
 */

export type BatchEntryStatus = 'pending' | 'running' | 'done' | 'failed' | 'paused';

/** Endpoint labels shown to the user, mapped to the engine's stopAfterStep. */
export const BATCH_TARGETS: { value: AutopilotStep | 'full'; label: string }[] = [
  { value: 'shots', label: 'Chỉ tạo shot' },
  { value: 'references', label: 'Tạo nhân vật + cảnh' },
  { value: 'images', label: 'Tạo tới ảnh' },
  { value: 'videos', label: 'Tạo tới video (chưa ghép)' },
  { value: 'full', label: 'AutoPilot đầy đủ' },
];

export function batchTargetLabel(stopAfterStep?: AutopilotStep): string {
  const value = stopAfterStep ?? 'full';
  return BATCH_TARGETS.find((target) => target.value === value)?.label ?? 'AutoPilot đầy đủ';
}

export interface BatchEntry {
  id: string;
  projectId: string;
  projectName: string;
  /** Human label describing what this entry runs, e.g. "Chỉ tạo shot". */
  label: string;
  /** Endpoint; undefined = full pipeline through render. */
  stopAfterStep?: AutopilotStep;
  input: AutopilotJobInput;
  status: BatchEntryStatus;
  /** Engine job id once the entry has started running. */
  jobId?: string;
  progress: number;
  message?: string;
  error?: string;
  /** Live pipeline position, mirrored from the engine job so the queue row can show
   * the same stage timeline (Voice → Chia shot → … → Ghép/Xuất) as the AutoPilot tab. */
  stage?: AutopilotStage;
  completedSteps?: AutopilotStep[];
  nextStep?: AutopilotStep;
  /** Transient intent flag: when true, the runner resumes the existing job from its
   * checkpoint (keeping manual fixes) instead of creating a fresh job. */
  resume?: boolean;
  addedAt: number;
  /**
   * Optional scheduled start time (epoch ms). When set and in the future, the
   * queue auto-starts this entry at that moment (even if not manually started)
   * and holds until then. Undefined = run as soon as its turn arrives.
   */
  scheduledAt?: number;
}

interface BatchQueueState {
  entries: BatchEntry[];
  /** True while the queue is actively working through entries. */
  running: boolean;
  /** Delay between finishing one project and starting the next is randomized in
   * this inclusive [min, max] range (seconds), for more human-like pacing. */
  betweenDelayMinSec: number;
  betweenDelayMaxSec: number;
  /** Entry currently being processed (or waiting out the delay). */
  activeEntryId: string | null;
  /** True while waiting out the between-project delay. */
  waiting: boolean;

  addEntry: (
    entry: Omit<BatchEntry, 'id' | 'status' | 'progress' | 'addedAt' | 'label'> & { label?: string },
  ) => string;
  removeEntry: (id: string) => void;
  moveEntry: (id: string, direction: 'up' | 'down') => void;
  /** Continue a failed/paused entry: resume its existing job from checkpoint, then
   * keep the queue going. Picks up manual fixes made inside the project. */
  resumeEntry: (id: string) => void;
  /** Set the random delay range (seconds). Values are clamped so min ≤ max. */
  setBetweenDelayRange: (minSec: number, maxSec: number) => void;
  /** Set (or clear with null) an entry's scheduled start time. */
  setEntrySchedule: (id: string, scheduledAt: number | null) => void;
  clearFinished: () => void;
  clearAll: () => void;

  startAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
}

// Module-scoped runner state (not persisted, not part of React state).
let betweenDelayTimer: ReturnType<typeof setTimeout> | null = null;
let jobWatchOff: (() => void) | null = null;
/** Set by the store initializer so the background scheduler can trigger the runner. */
let runNextRef: (() => void) | null = null;
/** Longest single setTimeout we use; longer waits re-poll so clock changes are tolerated. */
const MAX_WAIT_MS = 30_000;

function clearBetweenDelay(): void {
  if (betweenDelayTimer) {
    clearTimeout(betweenDelayTimer);
    betweenDelayTimer = null;
  }
}

function mapJobStatusToEntry(status: AutopilotJobStatus): BatchEntryStatus {
  switch (status) {
    case 'done':
      return 'done';
    case 'failed':
      return 'failed';
    case 'running':
    case 'queued':
      return 'running';
    default:
      return 'paused';
  }
}

export const useBatchQueueStore = create<BatchQueueState>()(
  persist(
    (set, get) => {
      /** Resolve once the engine job reaches a terminal-for-queue state. */
      const waitForJob = (jobId: string): Promise<AutopilotJobStatus> =>
        new Promise((resolve) => {
          let settled = false;
          const finish = (status: AutopilotJobStatus) => {
            if (settled) return;
            settled = true;
            off();
            resolve(status);
          };
          const check = () => {
            const job = autopilotEngine.getJob(jobId);
            if (!job) return finish('failed');
            // Mirror live progress + pipeline position onto the entry.
            set((state) => ({
              entries: state.entries.map((entry) =>
                entry.jobId === jobId
                  ? {
                      ...entry,
                      progress: job.progress,
                      message: job.message,
                      error: job.error,
                      stage: job.stage,
                      completedSteps: job.completedSteps,
                      nextStep: job.nextStep,
                    }
                  : entry,
              ),
            }));
            if (['done', 'failed', 'paused', 'interrupted', 'cancelled'].includes(job.status)) {
              finish(job.status);
            }
          };
          const off = autopilotEngine.onEvent((event) => {
            const eventJobId = event.type === 'job-updated' ? event.job.id : event.jobId;
            if (eventJobId === jobId) check();
          });
          jobWatchOff = off;
          check();
        });

      const runNext = async (): Promise<void> => {
        if (!get().running) return;
        const entry = get().entries.find((item) => item.status === 'pending');
        if (!entry) {
          set({ running: false, activeEntryId: null, waiting: false });
          return;
        }

        // Hold until the entry's scheduled start time, if any.
        const now = Date.now();
        if (entry.scheduledAt && entry.scheduledAt > now) {
          set({ activeEntryId: entry.id, waiting: true });
          clearBetweenDelay();
          const wait = Math.min(entry.scheduledAt - now, MAX_WAIT_MS);
          betweenDelayTimer = setTimeout(() => {
            betweenDelayTimer = null;
            void runNext();
          }, wait);
          return;
        }

        set((state) => ({
          activeEntryId: entry.id,
          waiting: false,
          entries: state.entries.map((item) =>
            item.id === entry.id ? { ...item, status: 'running', error: undefined } : item,
          ),
        }));

        try {
          // Route all generated media to this entry's project.
          await switchProject(entry.projectId);
        } catch (error) {
          set((state) => ({
            entries: state.entries.map((item) =>
              item.id === entry.id
                ? { ...item, status: 'failed', error: error instanceof Error ? error.message : String(error) }
                : item,
            ),
          }));
          void afterEntry();
          return;
        }

        if (!get().running) return; // paused during switch

        const createFresh = (): string =>
          autopilotEngine.createJob({
            ...entry.input,
            title: entry.input.title || entry.projectName,
            executionMode: 'all',
            stopAfterStep: entry.stopAfterStep,
          }).id;

        let jobId: string;
        if (entry.resume && entry.jobId) {
          // Resume the existing job from its checkpoint (keeps manual fixes). Ensure
          // the job is loaded first (it may only live on disk after a restart).
          if (!autopilotEngine.getJob(entry.jobId)) {
            await hydrateAutopilotProject(entry.projectId);
          }
          if (autopilotEngine.getJob(entry.jobId) && autopilotEngine.resumeJob(entry.jobId)) {
            jobId = entry.jobId;
          } else {
            jobId = createFresh(); // job gone → fall back to a fresh run
          }
        } else {
          jobId = createFresh();
        }

        set((state) => ({
          entries: state.entries.map((item) =>
            item.id === entry.id ? { ...item, jobId, resume: undefined } : item,
          ),
        }));

        const finalStatus = await waitForJob(jobId);
        jobWatchOff = null;

        // User paused the whole queue mid-job — stop without advancing.
        if (!get().running) {
          set((state) => ({
            entries: state.entries.map((item) =>
              item.id === entry.id ? { ...item, status: 'paused' } : item,
            ),
          }));
          return;
        }

        set((state) => ({
          entries: state.entries.map((item) =>
            item.id === entry.id ? { ...item, status: mapJobStatusToEntry(finalStatus) } : item,
          ),
        }));

        void afterEntry();
      };

      /** Wait out the between-project delay, then start the next entry. */
      const afterEntry = async (): Promise<void> => {
        if (!get().running) {
          set({ activeEntryId: null, waiting: false });
          return;
        }
        // Randomize the pause within [min, max] for more human-like pacing.
        const minSec = Math.max(0, get().betweenDelayMinSec);
        const maxSec = Math.max(minSec, get().betweenDelayMaxSec);
        const delaySec = minSec + Math.random() * (maxSec - minSec);
        const delayMs = Math.max(0, Math.round(delaySec * 1000));
        const hasMore = get().entries.some((item) => item.status === 'pending');
        if (!hasMore || delayMs === 0) {
          set({ waiting: false });
          void runNext();
          return;
        }
        set({ waiting: true });
        clearBetweenDelay();
        betweenDelayTimer = setTimeout(() => {
          betweenDelayTimer = null;
          set({ waiting: false });
          void runNext();
        }, delayMs);
      };

      // Expose the runner so the background scheduler can start it.
      runNextRef = () => void runNext();

      return {
        entries: [],
        running: false,
        betweenDelayMinSec: 180,
        betweenDelayMaxSec: 420,
        activeEntryId: null,
        waiting: false,

        addEntry: (entry) => {
          const id = generateUUID();
          set((state) => ({
            entries: [
              ...state.entries,
              {
                label: 'AutoPilot đầy đủ',
                ...entry,
                id,
                status: 'pending',
                progress: 0,
                addedAt: Date.now(),
              },
            ],
          }));
          return id;
        },

        setEntrySchedule: (id, scheduledAt) => {
          set((state) => ({
            entries: state.entries.map((item) =>
              item.id === id ? { ...item, scheduledAt: scheduledAt ?? undefined } : item,
            ),
          }));
          // Wake the scheduler so a newly-set time can arm promptly.
          maybeAutoStart();
        },

        removeEntry: (id) => {
          const entry = get().entries.find((item) => item.id === id);
          // Stop a running entry's job before dropping it.
          if (entry?.status === 'running' && entry.jobId) {
            autopilotEngine.cancelJob(entry.jobId);
          }
          set((state) => ({ entries: state.entries.filter((item) => item.id !== id) }));
        },

        moveEntry: (id, direction) => {
          set((state) => {
            const index = state.entries.findIndex((item) => item.id === id);
            if (index < 0) return state;
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= state.entries.length) return state;
            const entries = [...state.entries];
            [entries[index], entries[target]] = [entries[target], entries[index]];
            return { entries };
          });
        },

        resumeEntry: (id) => {
          const entry = get().entries.find((item) => item.id === id);
          if (!entry || (entry.status !== 'failed' && entry.status !== 'paused')) return;
          const wasRunning = get().running;
          set((state) => ({
            running: true,
            entries: state.entries.map((item) =>
              item.id === id ? { ...item, status: 'pending', resume: true, error: undefined } : item,
            ),
          }));
          // If the runner was idle, start it now; if it was already busy, it will
          // reach this entry when the current one finishes.
          if (!wasRunning) runNextRef?.();
        },

        setBetweenDelayRange: (minSec, maxSec) => {
          const min = Math.max(0, Math.round(minSec) || 0);
          const max = Math.max(min, Math.round(maxSec) || 0);
          set({ betweenDelayMinSec: min, betweenDelayMaxSec: max });
        },

        clearFinished: () => {
          set((state) => ({
            entries: state.entries.filter(
              (item) => item.status !== 'done' && item.status !== 'failed',
            ),
          }));
        },

        clearAll: () => {
          const { running, pauseAll } = get();
          if (running) pauseAll();
          set({ entries: [], activeEntryId: null });
        },

        startAll: () => {
          if (get().running) return;
          // Requeue any paused/failed entries so a fresh start re-runs them.
          set((state) => ({
            running: true,
            entries: state.entries.map((item) =>
              item.status === 'paused' || item.status === 'failed'
                ? { ...item, status: 'pending', jobId: undefined, error: undefined }
                : item,
            ),
          }));
          void runNext();
        },

        pauseAll: () => {
          clearBetweenDelay();
          const active = get().entries.find((item) => item.id === get().activeEntryId);
          if (active?.jobId) autopilotEngine.cancelJob(active.jobId);
          if (jobWatchOff) {
            jobWatchOff();
            jobWatchOff = null;
          }
          set((state) => ({
            running: false,
            waiting: false,
            entries: state.entries.map((item) =>
              item.status === 'running' ? { ...item, status: 'paused' } : item,
            ),
          }));
        },

        resumeAll: () => {
          if (get().running) return;
          if (!get().entries.some((item) => item.status === 'pending' || item.status === 'paused')) return;
          set((state) => ({
            running: true,
            entries: state.entries.map((item) =>
              item.status === 'paused' ? { ...item, status: 'pending' } : item,
            ),
          }));
          void runNext();
        },
      };
    },
    {
      name: 'longdd-batch-queue',
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        entries: state.entries,
        betweenDelayMinSec: state.betweenDelayMinSec,
        betweenDelayMaxSec: state.betweenDelayMaxSec,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // A process restart kills in-flight runs; reset transient state so the
        // user can restart the queue cleanly.
        state.running = false;
        state.activeEntryId = null;
        state.waiting = false;
        state.entries = state.entries.map((entry) =>
          entry.status === 'running'
            ? { ...entry, status: 'paused', jobId: undefined, resume: undefined }
            : { ...entry, resume: undefined },
        );
      },
    },
  ),
);

/**
 * Background scheduler. While the app is open, auto-start the queue when a
 * scheduled entry becomes due (even if the user never pressed "Bắt đầu").
 */
function maybeAutoStart(): void {
  const state = useBatchQueueStore.getState();
  if (state.running) return;
  const now = Date.now();
  const due = state.entries.some(
    (entry) => entry.status === 'pending' && entry.scheduledAt !== undefined && entry.scheduledAt <= now,
  );
  if (!due) return;
  useBatchQueueStore.setState({ running: true, activeEntryId: null });
  runNextRef?.();
}

if (typeof window !== 'undefined') {
  setInterval(maybeAutoStart, 20_000);
}

/**
 * Snapshot of a project's live queue state for the dashboard cards.
 * Returns the most relevant entry (running > pending > last finished) per project.
 */
export function selectProjectBatchStatus(
  entries: BatchEntry[],
  projectId: string,
): BatchEntry | undefined {
  const forProject = entries.filter((entry) => entry.projectId === projectId);
  if (forProject.length === 0) return undefined;
  return (
    forProject.find((entry) => entry.status === 'running') ||
    forProject.find((entry) => entry.status === 'pending') ||
    forProject[forProject.length - 1]
  );
}
