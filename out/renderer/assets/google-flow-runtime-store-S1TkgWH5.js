import { c as create } from "./zustand-DnVmcEKu.js";
const useGoogleFlowRuntimeStore = create((set, get) => ({
  status: null,
  tasks: {},
  initialized: false,
  initialize: () => {
    if (get().initialized || !window.googleFlowRuntime) return () => {
    };
    set({ initialized: true });
    const offStatus = window.googleFlowRuntime.onStatus((status) => set({ status }));
    const offTask = window.googleFlowRuntime.onTask((task) => set((state) => ({ tasks: { ...state.tasks, [task.taskId]: task } })));
    void (window.videoStudioBrowser?.startRuntimes() ?? Promise.resolve()).then(() => get().refresh()).catch((error) => console.warn("[GoogleFlow] Runtime startup failed:", error));
    return () => {
      offStatus();
      offTask();
      set({ initialized: false });
    };
  },
  refresh: async () => {
    if (!window.googleFlowRuntime) return;
    try {
      set({ status: await window.googleFlowRuntime.getStatus() });
    } catch (error) {
      console.warn("[GoogleFlow] Status refresh failed:", error);
    }
  },
  clearFinished: () => set((state) => ({
    tasks: Object.fromEntries(Object.entries(state.tasks).filter(([, task]) => !["completed", "failed", "cancelled"].includes(task.status)))
  }))
}));
export {
  useGoogleFlowRuntimeStore as u
};
