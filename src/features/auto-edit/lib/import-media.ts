import { addElementToTrackOfTypeCommand, updateCanvasSizeCommand } from "../commands";
import { createAudioElement, createImageElement, createVideoElement } from "../defaults";
import { useEditorStore } from "../store/editor-store";
import { getScene } from "./mutate";

/**
 * Media import flow: probe duration, register the asset in the media registry,
 * and drop a matching element onto the timeline (video/image → video track,
 * audio → audio track). Each drop is a single undoable command.
 */

export interface PickedMediaFile {
  path: string;
  name: string;
  previewUrl: string;
  kind: "video" | "audio" | "image";
}

const AUDIO_EXTS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const VIDEO_EXTS = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".ts"];

export function kindFromName(name: string): PickedMediaFile["kind"] | null {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  return null;
}

/** Convert OS-dropped `File`s to picked media (resolving paths + preview URLs). */
export async function pickedFromDroppedFiles(files: File[]): Promise<PickedMediaFile[]> {
  const runtime = window.autoEditRuntime;
  if (!runtime || files.length === 0) return [];
  const picked: PickedMediaFile[] = [];
  const paths: string[] = [];
  for (const file of files) {
    const kind = kindFromName(file.name);
    if (!kind) continue;
    let path = "";
    try {
      path = runtime.getPathForFile(file);
    } catch {
      path = "";
    }
    if (!path) continue;
    paths.push(path);
    picked.push({ path, name: file.name, kind, previewUrl: "" });
  }
  if (picked.length === 0) return [];
  const previewByPath = await runtime.registerMediaPaths(paths);
  for (const p of picked) p.previewUrl = previewByPath[p.path] ?? "";
  return picked;
}

/** True when the project has no visual (video/image) elements yet. */
function hasNoVisualElements(project: NonNullable<ReturnType<typeof useEditorStore.getState>["project"]>): boolean {
  const tracks = getScene(project).tracks;
  const mainHasMedia = tracks.main.elements.some((e) => e.type === "video" || e.type === "image");
  const overlayHasMedia = tracks.overlay.some((t) =>
    t.elements.some((e) => e.type === "video" || e.type === "image"),
  );
  return !mainHasMedia && !overlayHasMedia;
}

export async function importMediaFiles(
  files: PickedMediaFile[],
  opts?: { startMs?: number; trackId?: string },
): Promise<void> {
  const store = useEditorStore.getState();
  const project = store.project;

  // Auto-fit the canvas to the first imported visual, so the preview orientation
  // follows the content instead of the portrait default.
  if (project && hasNoVisualElements(project)) {
    const firstVisual = files.find((f) => f.kind !== "audio");
    if (firstVisual) {
      const { dimensions } = (await window.ffmpegRuntime?.probeDimensions(firstVisual.path)) ?? {};
      if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
        store.execute(updateCanvasSizeCommand(dimensions.width, dimensions.height));
      }
    }
  }

  for (const file of files) {
    let durationMs = 5000;
    if (file.kind !== "image") {
      try {
        const { durationSec } = (await window.ffmpegRuntime?.probeDuration(file.path)) ?? {};
        if (durationSec != null && Number.isFinite(durationSec)) {
          durationMs = Math.max(1, Math.round(durationSec * 1000));
        }
      } catch {
        // Keep the default duration if probing fails.
      }
    }

    store.registerMediaAsset({
      path: file.path,
      name: file.name,
      kind: file.kind,
      previewUrl: file.previewUrl,
      durationMs,
    });

    const startTime = Math.max(0, Math.round(opts?.startMs ?? 0));
    const element =
      file.kind === "video"
        ? createVideoElement({ mediaPath: file.path, name: file.name, duration: durationMs, startTime })
        : file.kind === "image"
          ? createImageElement({ mediaPath: file.path, name: file.name, duration: 5000, startTime })
          : createAudioElement({ mediaPath: file.path, name: file.name, duration: durationMs, startTime });

    store.execute(
      addElementToTrackOfTypeCommand(
        element,
        file.kind === "audio" ? "audio" : "video",
        file.name,
        opts?.trackId,
      ),
    );
  }
}
