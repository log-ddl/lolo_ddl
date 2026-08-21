import { create } from "zustand";

/**
 * Export/render UI state — drive the header "Export" button (spinner + progress)
 * and report completion/errors back to the user. The heavy lifting happens in
 * `render.ts` + the main-process ffmpeg pipeline.
 */

export type RenderStatus = "idle" | "preparing" | "rendering" | "done" | "error";

interface RenderState {
  status: RenderStatus;
  /** 0–100 progress from ffmpeg. */
  percent: number;
  message: string | null;
  outputPath: string | null;
  error: string | null;
  /** Active ffmpeg job id (for cancel). */
  jobId: string | null;

  start: (jobId: string) => void;
  setProgress: (percent: number) => void;
  finish: (outputPath: string) => void;
  fail: (error: string) => void;
  reset: () => void;
}

const initial = {
  status: "idle" as RenderStatus,
  percent: 0,
  message: null,
  outputPath: null,
  error: null,
  jobId: null,
};

export const useRenderStore = create<RenderState>()((set) => ({
  ...initial,

  start: (jobId) => set({ status: "preparing", percent: 0, message: null, outputPath: null, error: null, jobId }),
  setProgress: (percent) => set({ status: "rendering", percent: Math.max(0, Math.min(100, percent)) }),
  finish: (outputPath) => set({ status: "done", percent: 100, outputPath, error: null }),
  fail: (error) => set({ status: "error", error }),
  reset: () => set({ ...initial }),
}));
