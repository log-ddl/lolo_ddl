import { toast } from "sonner";
import { translate } from "@/shared/i18n";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";
import { useEditorStore } from "../store/editor-store";
import type { MediaAsset, TProject } from "../types";
import { allTracks } from "../types";

function t(key: string): string {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}

/**
 * Project JSON save/load. Media is referenced by absolute path (not embedded),
 * so loading re-registers every referenced path with the main process to get a
 * fresh preview URL and probes durations so the asset browser stays accurate.
 *
 * Save writes to the project dashboard directory (`<projectId>.json`), so the
 * project list can always find it; "Open file" still offers an ad-hoc JSON import.
 */

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

export async function saveProject(): Promise<void> {
  const project = useEditorStore.getState().project;
  const runtime = window.autoEditRuntime;
  if (!project || !runtime) {
    toast.error(t("autoEdit.project.saveFailed"));
    return;
  }

  const payload: TProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: Date.now() },
  };

  const result = await runtime.saveProjectFile({
    id: project.metadata.id,
    content: JSON.stringify(payload, null, 2),
  });

  if (!result.success) {
    toast.error(result.error ?? t("autoEdit.project.saveFailed"));
    return;
  }
  useEditorStore.setState({ project: payload });
  toast.success(t("autoEdit.project.saved"));
}

/* ------------------------------------------------------------------ */
/* Load                                                                */
/* ------------------------------------------------------------------ */

function basename(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

/** Every distinct media path in the project, mapped to its editor asset kind. */
function collectMediaPaths(project: TProject): Map<string, MediaAsset["kind"]> {
  const map = new Map<string, MediaAsset["kind"]>();
  for (const scene of project.scenes) {
    for (const track of allTracks(scene.tracks)) {
      for (const el of track.elements) {
        const path = "mediaPath" in el ? el.mediaPath : undefined;
        if (!path) continue;
        if (el.type === "video") map.set(path, "video");
        else if (el.type === "image") map.set(path, "image");
        else if (el.type === "audio") map.set(path, "audio");
      }
    }
  }
  return map;
}

function isAutoEditProject(value: unknown): value is TProject {
  if (!value || typeof value !== "object") return false;
  const v = value as { schema?: unknown; scenes?: unknown; settings?: unknown };
  return v.schema === "logdd-auto-edit" && Array.isArray(v.scenes) && !!v.settings;
}

/** Rebuild the media registry for a freshly-parsed project and load it into the store. */
async function applyLoadedProject(parsed: TProject): Promise<void> {
  const store = useEditorStore.getState();
  const paths = collectMediaPaths(parsed);
  let previewByPath: Record<string, string> = {};
  try {
    previewByPath = (await window.autoEditRuntime?.registerMediaPaths([...paths.keys()])) ?? {};
  } catch {
    previewByPath = {};
  }

  const mediaAssets: Record<string, MediaAsset> = {};
  await Promise.all(
    [...paths.entries()].map(async ([p, kind]) => {
      let durationMs = 5000;
      if (kind !== "image") {
        try {
          const { durationSec } = (await window.ffmpegRuntime?.probeDuration(p)) ?? {};
          if (durationSec != null && Number.isFinite(durationSec)) {
            durationMs = Math.max(1, Math.round(durationSec * 1000));
          }
        } catch {
          // Keep the default duration if probing fails.
        }
      }
      mediaAssets[p] = {
        path: p,
        name: basename(p),
        kind,
        previewUrl: previewByPath[p] ?? "",
        durationMs,
      };
    }),
  );

  store.loadProject(parsed);
  useEditorStore.setState({ mediaAssets });
  toast.success(t("autoEdit.project.loaded"));
}

/** Open a project from a file chooser (ad-hoc JSON import). */
export async function loadProject(): Promise<boolean> {
  const runtime = window.autoEditRuntime;
  if (!runtime) {
    toast.error(t("autoEdit.project.loadFailed"));
    return false;
  }

  const picked = await runtime.pickJson();
  if (picked.canceled || picked.content == null) return false;

  const parsed = parseProject(picked.content);
  if (!parsed) return false;
  await applyLoadedProject(parsed);
  return true;
}

/** Open a project by path (used by the dashboard). */
export async function loadProjectFromPath(filePath: string): Promise<boolean> {
  const runtime = window.autoEditRuntime;
  if (!runtime) {
    toast.error(t("autoEdit.project.loadFailed"));
    return false;
  }

  const loaded = await runtime.loadProjectFile(filePath);
  if (!loaded.success || loaded.content == null) {
    toast.error(loaded.error ?? t("autoEdit.project.loadFailed"));
    return false;
  }

  const parsed = parseProject(loaded.content);
  if (!parsed) return false;
  await applyLoadedProject(parsed);
  return true;
}

function parseProject(content: string): TProject | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    toast.error(t("autoEdit.project.invalid"));
    return null;
  }
  if (!isAutoEditProject(parsed)) {
    toast.error(t("autoEdit.project.invalid"));
    return null;
  }
  return parsed;
}

/* ------------------------------------------------------------------ */
/* New                                                                 */
/* ------------------------------------------------------------------ */

export function newProject(): void {
  useEditorStore.getState().newProject();
}
