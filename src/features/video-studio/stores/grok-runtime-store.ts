import { create } from 'zustand';
import type { GrokStatus, GrokTaskEvent } from '@/features/video-studio/packages/ai-core/providers/grok/types';

type GrokRuntimeState = {
  status: GrokStatus | null;
  tasks: Record<string, GrokTaskEvent>;
  initialized: boolean;
  initialize: () => () => void;
  refresh: () => Promise<void>;
  clearFinished: () => void;
};

let subscribers = 0;
let offStatus: (() => void) | undefined;
let offTask: (() => void) | undefined;

export const useGrokRuntimeStore = create<GrokRuntimeState>((set, get) => ({
  status: null,
  tasks: {},
  initialized: false,
  initialize: () => {
    if (!window.grokVideoRuntime) return () => {};
    subscribers += 1;
    if (subscribers === 1) {
      set({ initialized: true });
      offStatus = window.grokVideoRuntime.onStatus((status) => set({ status }));
      offTask = window.grokVideoRuntime.onTask((task) => set((state) => ({ tasks: { ...state.tasks, [task.taskId]: task } })));
      void (window.videoStudioBrowser?.startRuntimes() ?? Promise.resolve())
        .then(() => get().refresh())
        .catch((error) => console.warn('[Grok] Runtime startup failed:', error));
    } else {
      void window.grokVideoRuntime.getStatus().then((status) => set({ status })).catch(() => {});
    }
    return () => {
      subscribers = Math.max(0, subscribers - 1);
      if (subscribers > 0) return;
      offStatus?.(); offTask?.();
      offStatus = undefined; offTask = undefined;
      set({ initialized: false });
    };
  },
  refresh: async () => {
    if (!window.grokVideoRuntime) return;
    try {
      set({ status: await window.grokVideoRuntime.refreshQuota() });
    } catch (error) {
      console.warn('[Grok] Status refresh failed:', error);
    }
  },
  clearFinished: () => set((state) => ({
    tasks: Object.fromEntries(Object.entries(state.tasks).filter(([, task]) => !['completed', 'failed', 'cancelled'].includes(task.status))),
  })),
}));
