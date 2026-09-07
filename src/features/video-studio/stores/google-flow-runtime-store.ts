import { create } from 'zustand';
import type { GoogleFlowStatus, GoogleFlowTaskEvent } from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

type GoogleFlowRuntimeState = {
  status: GoogleFlowStatus | null;
  tasks: Record<string, GoogleFlowTaskEvent>;
  initialized: boolean;
  initialize: () => () => void;
  refresh: () => Promise<void>;
  clearFinished: () => void;
};

/**
 * Several panels watch this same feed (Settings, AutoPilot's advanced section,
 * the scene gallery), so the subscription is reference-counted: the first mount
 * opens it, only the last unmount closes it.
 *
 * Without the count, whichever panel unmounted first tore the listener down for
 * every panel still on screen — switching from Settings to AutoPilot left the
 * AutoPilot picker frozen on the status it happened to mount with, which after a
 * fresh Chrome login is an empty account list.
 */
let subscribers = 0;
let offStatus: (() => void) | undefined;
let offTask: (() => void) | undefined;

export const useGoogleFlowRuntimeStore = create<GoogleFlowRuntimeState>((set, get) => ({
  status: null,
  tasks: {},
  initialized: false,
  initialize: () => {
    if (!window.googleFlowRuntime) return () => {};
    subscribers += 1;
    if (subscribers === 1) {
      set({ initialized: true });
      offStatus = window.googleFlowRuntime.onStatus((status) => set({ status }));
      offTask = window.googleFlowRuntime.onTask((task) => set((state) => ({ tasks: { ...state.tasks, [task.taskId]: task } })));
      // Refresh even when the browser runtimes fail to start: the runtime may
      // already be up from an earlier launch, and a rejected start used to leave
      // the store on a null status forever.
      void (window.videoStudioBrowser?.startRuntimes() ?? Promise.resolve())
        .catch((error) => console.warn('[GoogleFlow] Runtime startup failed:', error))
        .then(() => get().refresh());
    } else {
      // The feed only pushes on change, so a panel mounting later would otherwise
      // wait for the next event to learn anything. Read the current status once.
      void get().refresh();
    }
    return () => {
      subscribers = Math.max(0, subscribers - 1);
      if (subscribers > 0) return;
      offStatus?.();
      offTask?.();
      offStatus = undefined;
      offTask = undefined;
      set({ initialized: false });
    };
  },
  refresh: async () => {
    if (!window.googleFlowRuntime) return;
    try {
      set({ status: await window.googleFlowRuntime.getStatus() });
    } catch (error) {
      console.warn('[GoogleFlow] Status refresh failed:', error);
    }
  },
  clearFinished: () => set((state) => ({
    tasks: Object.fromEntries(Object.entries(state.tasks).filter(([, task]) => !['completed', 'failed', 'cancelled'].includes(task.status))),
  })),
}));
