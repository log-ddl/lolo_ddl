import { useDirectorStore, type SplitScene } from "@/features/video-studio/stores/director-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";
import { useAPIConfigStore } from "@/features/video-studio/stores/api-config-store";

// Shared lane/queue/retry engine (single implementation for every pipeline).
export {
  buildLaneWorkers,
  runLaneQueue,
  runOrdered,
  type LaneJob,
  type LaneWorker,
} from "@/features/video-studio/lib/ai/lane-manager";

// Shared small helpers, re-exported from the lane engine for compatibility.
export {
  delayOrAbort,
  isAbortLikeError,
  randomBetween,
  getGenerationFlowSettings,
  type GenerationFlowSettings,
} from "@/features/video-studio/lib/ai/lane-manager";

export const isHttpImageUrl = (value?: string | null): boolean => {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
};

export const isLocalImageSource = (value?: string | null): value is string => {
  return typeof value === 'string' && value.length > 0 && !isHttpImageUrl(value);
};

export const looksLikeUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

export const isContentModerationError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/anti[- ]?bot|x-statsig|captcha|HTTP\s*(?:401|403)|unauthori[sz]ed|forbidden|session|login/i.test(message)) return false;
  return /MODERATION:|moderation|content[_ -]?sensitive|safety(?:[_ -]?check)?|content.{0,30}(?:violation|policy|refused|rejected|blocked|prohibited|unsafe)|(?:prompt|image|video).{0,30}(?:inappropriate|prohibited|unsafe)/i.test(message);
};

export const DIRECTOR_IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];
export const directorImageSortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

type ElectronFile = File & { path?: string };

export function getDirectorImageExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function isSupportedDirectorImageFile(file: File): boolean {
  return DIRECTOR_IMAGE_EXTS.includes(getDirectorImageExtension(file));
}

export function getDirectorImageSortKey(file: File): string {
  return file.webkitRelativePath || file.name;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image file"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

export async function getPersistableImageSource(file: File): Promise<string> {
  const localPath = (file as ElectronFile).path;
  return localPath || readFileAsDataUrl(file);
}

export function buildCharacterIdentityBlock(scene: SplitScene): string {
  const characterIds = scene.characterIds || [];
  if (characterIds.length === 0) return '';

  const { characters } = useCharacterLibraryStore.getState();
  const lines = characterIds
    .map((characterId) => {
      const character = characters.find((item) => item.id === characterId);
      if (!character) return null;
      const identity = character.identityPrompt || character.description || character.appearance || character.characterPrompt;
      if (!identity?.trim()) return null;
      return `- ${character.name}: ${identity.trim()}`;
    })
    .filter((line): line is string => !!line);

  if (lines.length === 0) return '';
  return [
    'Character identity lock:',
    ...lines,
    'Preserve these character identities exactly; do not change face, hairstyle, age, body type, outfit identity, or distinctive marks unless the shot prompt explicitly says so.',
  ].join('\n');
}

export function applyCharacterIdentityToPrompt(prompt: string, scene: SplitScene): string {
  const identityBlock = buildCharacterIdentityBlock(scene);
  if (!identityBlock) return prompt;
  return `${identityBlock}\n\nShot prompt:\n${prompt}`;
}

export function expandLinkedPromptMarkers(prompt: string): string {
  if (!prompt.trim()) return prompt;

  const { characters } = useCharacterLibraryStore.getState();
  const { scenes } = useSceneStore.getState();

  const findCharacter = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return characters.find((item) =>
      item.name.trim().toLowerCase() === normalized ||
      item.name.trim().toLowerCase().includes(normalized) ||
      normalized.includes(item.name.trim().toLowerCase())
    );
  };

  const findScene = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return scenes.find((item) =>
      item.name.trim().toLowerCase() === normalized ||
      item.name.trim().toLowerCase().includes(normalized) ||
      normalized.includes(item.name.trim().toLowerCase())
    );
  };

  return prompt
    .replace(/@scene\[([^\]]+)\]/giu, (_match, sceneName: string) => {
      const linkedScene = findScene(sceneName);
      const sceneDescription = (linkedScene?.description || linkedScene?.scenePrompt || linkedScene?.name)?.trim();
      return sceneDescription ? `${sceneName.trim()} (${sceneDescription})` : sceneName.trim();
    })
    .replace(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu, (match, bracketName: string, simpleName: string) => {
      const name = (bracketName || simpleName || '').trim();
      if (!name) return match;
      const character = findCharacter(name);
      const characterDescription = (character?.description || character?.appearance || character?.characterPrompt)?.trim();
      return characterDescription ? `${name} (${characterDescription})` : name;
    });
}

export const isDiscouragedExternalImageUrl = (value?: string | null): boolean => {
  if (!isHttpImageUrl(value)) return false;
  try {
    const hostname = new URL(value ?? '').hostname.toLowerCase();
    return hostname === 'bmp.ovh' || hostname.endsWith('.bmp.ovh');
  } catch {
    return false;
  }
};

export const shouldRefreshImageViaCurrentHost = (localUrl?: string | null): boolean => {
  return isLocalImageSource(localUrl) && useAPIConfigStore.getState().isImageHostConfigured();
};

export const MAX_REFERENCE_IMAGES = 9;

export type DirectorBatchProgress = {
  phase: 'images' | 'videos';
  label: string;
  completed: number;
  failed: number;
  total: number;
  active: boolean;
};

// Signatures of the director-store mutators the generation pipeline needs, so
// extracted modules can accept them without importing the whole store type.
export type UpdateSplitSceneImage = (sceneId: number, imageDataUrl: string, width?: number, height?: number, httpUrl?: string) => void;
export type UpdateSplitSceneImageStatus = (sceneId: number, updates: Partial<Pick<SplitScene, 'imageStatus' | 'imageProgress' | 'imageError'>>) => void;
export type UpdateSplitSceneVideo = (sceneId: number, updates: Partial<Pick<SplitScene, 'videoStatus' | 'videoProgress' | 'videoUrl' | 'videoError' | 'videoMediaId'>>) => void;
export type UpdateSplitSceneField = (sceneId: number, field: keyof SplitScene, value: any) => void;

export type SceneGenerationOptions = {
  manageRunState?: boolean;
  suppressSuccessToast?: boolean;
  signal?: AbortSignal;
};

export function linkAbortSignals(controller: AbortController, signal?: AbortSignal): void {
  if (!signal) return;
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener('abort', () => controller.abort(), { once: true });
}

export function createTimeoutSignal(parentSignal: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener('abort', abortFromParent, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
  };
}

export function normalizeReferenceName(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** Reads the freshest copy of a shot straight from the store, bypassing render-time snapshots. */
export function getSceneByIdFromStore(sceneId: number): SplitScene | undefined {
  const state = useDirectorStore.getState();
  const projectId = state.activeProjectId;
  return projectId ? state.projects[projectId]?.splitScenes.find((scene) => scene.id === sceneId) : undefined;
}

export const toggleShotSelection = (current: Set<number>, shotId: number, checked: boolean): Set<number> => {
  const next = new Set(current);
  if (checked) next.add(shotId);
  else next.delete(shotId);
  return next;
};
