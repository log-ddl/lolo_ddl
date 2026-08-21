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

export const useGrokRuntimeStore = create<GrokRuntimeState>((set, get) => ({
  status: null,
  tasks: {},
  initialized: false,
  initialize: () => {
    if (get().initialized || !window.grokVideoRuntime) return () => {};
    set({ initialized: true });
    const offStatus = window.grokVideoRuntime.onStatus((status) => set({ status }));
    const offTask = window.grokVideoRuntime.onTask((task) => set((state) => ({ tasks: { ...state.tasks, [task.taskId]: task } })));
    void (window.videoStudioBrowser?.startRuntimes() ?? Promise.resolve())
      .then(() => get().refresh())
      .catch((error) => console.warn('[Grok] Runtime startup failed:', error));
    return () => { offStatus(); offTask(); set({ initialized: false }); };
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
