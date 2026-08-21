import { buildAutoTimelineCommand, type AutoShot } from "../commands";
import { useEditorStore } from "../store/editor-store";
import type { AutoRow } from "./auto-import";
import { kindFromName } from "./import-media";

/**
 * Turns parsed `AutoRow`s into a timeline: resolve each row's files, probe their
 * durations, then lay everything down in one undoable command.
 *
 * The result is a normal editable timeline — every shot is an ordinary clip the
 * user can trim, move, replace or delete afterwards. Nothing about the import is
 * special-cased once it has landed.
 */

/** Fallback shot length when neither the file nor a voice track says otherwise. */
const DEFAULT_SHOT_MS = 5000;

export interface AutoBuildResult {
  shots: number;
  /** Rows dropped because their media could not be found on disk. */
  missing: string[];
}

function basename(pathOrName: string): string {
  const cleaned = pathOrName.replace(/\\/g, "/");
  return cleaned.slice(cleaned.lastIndexOf("/") + 1);
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value);
}

/**
 * Resolve a file reference from the sheet to a real path.
 *
 * An explicit absolute path in the file wins outright — that is the whole point
 * of putting a path in the JSON. Otherwise the reference is matched by filename
 * against media the user already imported, so a sheet listing bare filenames
 * works after dropping the folder in.
 */
function resolvePath(reference: string, byBasename: Map<string, string>): string | null {
  const trimmed = reference.trim();
  if (!trimmed) return null;
  if (isAbsolutePath(trimmed)) return trimmed;
  return byBasename.get(basename(trimmed).toLowerCase()) ?? null;
}

async function probeDurationMs(path: string): Promise<number | null> {
  try {
    const result = await window.ffmpegRuntime?.probeDuration(path);
    const seconds = result?.durationSec;
    if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.round(seconds * 1000);
  } catch {
    return null;
  }
}

export async function buildTimelineFromRows(
  rows: AutoRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<AutoBuildResult> {
  const store = useEditorStore.getState();
  const runtime = window.autoEditRuntime;

  // Index already-imported media so a sheet can refer to files by name alone.
  const byBasename = new Map<string, string>();
  for (const asset of Object.values(store.mediaAssets)) {
    byBasename.set(basename(asset.path).toLowerCase(), asset.path);
  }

  const shots: AutoShot[] = [];
  const missing: string[] = [];
  const newPaths: string[] = [];

  for (const [index, row] of rows.entries()) {
    onProgress?.(index, rows.length);

    const mediaPath = resolvePath(row.media, byBasename);
    if (!mediaPath) {
      missing.push(row.media);
      continue;
    }
    const kind = kindFromName(mediaPath);
    if (kind == null || kind === "audio") {
      missing.push(row.media);
      continue;
    }

    const voicePath = row.voice ? resolvePath(row.voice, byBasename) : null;

    // A shot lasts as long as its voice-over — that is what "voice khớp với ảnh"
    // means in practice. An explicit duration column still wins.
    const voiceMs = voicePath ? await probeDurationMs(voicePath) : null;
    const mediaMs = kind === "video" ? await probeDurationMs(mediaPath) : null;
    const duration =
      row.durationMs ?? voiceMs ?? mediaMs ?? DEFAULT_SHOT_MS;

    if (!store.mediaAssets[mediaPath]) newPaths.push(mediaPath);
    if (voicePath && !store.mediaAssets[voicePath]) newPaths.push(voicePath);

    shots.push({
      mediaPath,
      kind,
      name: basename(mediaPath),
      duration,
      // A video shorter than its slot would freeze on its last frame; cap instead.
      sourceDurationMs: mediaMs ?? undefined,
      voicePath: voicePath ?? undefined,
      voiceDurationMs: voiceMs ?? undefined,
      motionEffect: row.motion,
      transition: row.transition,
    });
  }

  onProgress?.(rows.length, rows.length);
  if (shots.length === 0) return { shots: 0, missing };

  // Register previews so the imported clips show thumbnails immediately.
  const previews = runtime ? await runtime.registerMediaPaths(newPaths) : {};
  for (const shot of shots) {
    if (!store.mediaAssets[shot.mediaPath]) {
      store.registerMediaAsset({
        path: shot.mediaPath,
        name: shot.name,
        kind: shot.kind,
        previewUrl: previews[shot.mediaPath] ?? "",
        durationMs: shot.sourceDurationMs ?? shot.duration,
      });
    }
    if (shot.voicePath && !store.mediaAssets[shot.voicePath]) {
      store.registerMediaAsset({
        path: shot.voicePath,
        name: basename(shot.voicePath),
        kind: "audio",
        previewUrl: previews[shot.voicePath] ?? "",
        durationMs: shot.voiceDurationMs ?? shot.duration,
      });
    }
  }

  useEditorStore.getState().execute(buildAutoTimelineCommand(shots));
  return { shots: shots.length, missing };
}
