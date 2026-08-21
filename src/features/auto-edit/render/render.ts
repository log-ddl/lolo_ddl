import { toast } from "sonner";
import { translate } from "@/shared/i18n";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";
import { newId } from "../lib/id";
import { useEditorStore } from "../store/editor-store";
import { buildRenderPlan, finalizePlan, isTextSpec } from "./plan";
import { rasterizeTextLayer } from "./rasterize";
import { useRenderStore } from "./render-store";
import type { ExportCodec, ExportOptions } from "./types";

function t(key: string): string {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}

/**
 * Export orchestration (renderer side): resolve the project → render plan,
 * rasterize text layers to PNG, hand the plan to the main-process ffmpeg
 * pipeline, and report progress back through `useRenderStore` + sonner toasts.
 */

/* ------------------------------------------------------------------ */
/* Export settings                                                    */
/* ------------------------------------------------------------------ */

export type ExportResolution = "canvas" | "720p" | "1080p" | "1440p" | "2160p";

export interface ExportSettings {
  codec: ExportCodec;
  crf: number;
  resolution: ExportResolution;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  codec: "libx264",
  crf: 18,
  resolution: "canvas",
};

function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

/** Resolve an export preset to concrete (even) output pixels, preserving aspect. */
function buildExportOptions(
  settings: ExportSettings,
  canvasW: number,
  canvasH: number,
): ExportOptions {
  const options: ExportOptions = { codec: settings.codec, crf: settings.crf };
  const short =
    settings.resolution === "720p" ? 720
    : settings.resolution === "1080p" ? 1080
    : settings.resolution === "1440p" ? 1440
    : settings.resolution === "2160p" ? 2160
    : null;
  if (short != null) {
    const scale = short / Math.min(canvasW, canvasH);
    options.outputWidth = even(canvasW * scale);
    options.outputHeight = even(canvasH * scale);
  }
  return options;
}

let unsubscribe: (() => void) | null = null;

function listenToEvents(): void {
  const runtime = window.editorRenderRuntime;
  if (!runtime?.onEvent) return;
  if (unsubscribe) return;
  unsubscribe = runtime.onEvent((event) => {
    const store = useRenderStore.getState();
    if (event.type === "progress" && event.percent != null) {
      store.setProgress(event.percent);
    } else if (event.type === "log") {
      store.setProgress(store.percent); // keep progress; logs are noisy
    }
  });
}

export async function exportAutoEditVideo(
  settings: ExportSettings = DEFAULT_EXPORT_SETTINGS,
): Promise<void> {
  const project = useEditorStore.getState().project;
  const runtime = window.editorRenderRuntime;
  const store = useRenderStore.getState();

  if (!project) return;
  if (!runtime) {
    toast.error(t("autoEdit.export.unavailable"));
    return;
  }
  if (store.status === "preparing" || store.status === "rendering") return;

  listenToEvents();

  let jobId = "";
  try {
    const draft = buildRenderPlan(project);
    const hasContent =
      draft.visual.length > 0 || draft.audio.length > 0;
    if (!hasContent) {
      toast.error(t("autoEdit.export.noContent"));
      store.fail("empty");
      return;
    }

    // Rasterize text layers (in composite order).
    const textPngs = await Promise.all(
      draft.visual.filter(isTextSpec).map((s) => rasterizeTextLayer(s)),
    );
    const plan = finalizePlan(draft, textPngs);

    const defaultName = `${(project.metadata.name || "auto-edit").replace(/[^\w\-]+/g, "-")}.mp4`;
    const picked = await runtime.pickOutput(defaultName);
    if (!picked.path) {
      store.reset();
      return;
    }

    jobId = newId("render");
    store.start(jobId);
    const options = buildExportOptions(
      settings,
      project.settings.canvasSize.width,
      project.settings.canvasSize.height,
    );
    const result = await runtime.render({ jobId, plan, outputPath: picked.path, options });

    if (result.canceled) {
      store.reset();
      toast.info(t("autoEdit.export.canceled"));
      return;
    }
    if (!result.success) {
      store.fail(result.error ?? t("autoEdit.export.failed"));
      toast.error(t("autoEdit.export.failed"));
      return;
    }

    store.finish(result.outputPath ?? picked.path);
    toast.success(t("autoEdit.export.done"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.fail(message);
    toast.error(t("autoEdit.export.failed"));
  }
}

export function cancelAutoEditExport(): void {
  const runtime = window.editorRenderRuntime;
  const jobId = useRenderStore.getState().jobId;
  if (jobId) void runtime?.cancel(jobId);
}
