import { newId } from "./lib/id";
import type { ParamValues } from "./lib/params";
import { FPS_30 } from "./lib/time";
import type {
  AudioTrack,
  EffectElement,
  EffectTrack,
  SceneTracks,
  TBackground,
  TCanvasSize,
  TProject,
  TProjectMetadata,
  TProjectSettings,
  ImageElement,
  TScene,
  TextElement,
  TextTrack,
  TimelineElement,
  UploadAudioElement,
  VideoElement,
  VideoTrack,
} from "./types";

/** Default length for a freshly created element. */
export const DEFAULT_NEW_ELEMENT_DURATION = 5000; // ms

export const DEFAULT_FPS = FPS_30;

/**
 * Horizontal 16:9 — the default canvas. Importing the first visual auto-fits the
 * canvas to that media's real dimensions, so vertical projects still end up
 * vertical; this only decides what an *empty* project looks like.
 */
export const DEFAULT_CANVAS_SIZE: TCanvasSize = { width: 1920, height: 1080 };

export const DEFAULT_BACKGROUND: TBackground = { type: "color", color: "#000000" };

/* ------------------------------------------------------------------ */
/* Default params (flat dotted keys, matching the params system)       */
/* ------------------------------------------------------------------ */

/** Shared transform + compositing keys applied to every visual element. */
export const DEFAULT_VISUAL_PARAMS: ParamValues = {
  "transform.positionX": 0,
  "transform.positionY": 0,
  "transform.scaleX": 1,
  "transform.scaleY": 1,
  "transform.rotate": 0,
  "transform.fit": "contain",
  opacity: 1,
  blendMode: "normal",
};

export const DEFAULT_TEXT_PARAMS: ParamValues = {
  ...DEFAULT_VISUAL_PARAMS,
  content: "",
  /** Logical px in the canvas coordinate space (1920×1080 → ~5% of height). */
  fontSize: 54,
  fontFamily: "Arial",
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#ffffff",
  textAlign: "center",
  "background.color": "transparent",
  "background.opacity": 1,
  "background.padding": 0,
  "background.cornerRadius": 0,
};

export function createTextElement(
  partial?: Partial<TextElement> & { params?: ParamValues },
): TextElement {
  return {
    id: newId("el"),
    name: "Text",
    type: "text",
    startTime: 0,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    trimStart: 0,
    trimEnd: 0,
    params: { ...DEFAULT_TEXT_PARAMS, content: "New text", ...partial?.params },
    ...partial,
  };
}

export function createVideoElement(
  partial?: Partial<VideoElement> & { params?: ParamValues },
): VideoElement {
  return {
    id: newId("el"),
    name: "Video",
    type: "video",
    mediaPath: "",
    startTime: 0,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    trimStart: 0,
    trimEnd: 0,
    params: { ...DEFAULT_VISUAL_PARAMS, ...partial?.params },
    isSourceAudioEnabled: true,
    ...partial,
  };
}

export function createImageElement(
  partial?: Partial<ImageElement> & { params?: ParamValues },
): ImageElement {
  return {
    id: newId("el"),
    name: "Image",
    type: "image",
    mediaPath: "",
    startTime: 0,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    trimStart: 0,
    trimEnd: 0,
    params: { ...DEFAULT_VISUAL_PARAMS, ...partial?.params },
    ...partial,
  };
}

export function createAudioElement(
  partial?: Partial<UploadAudioElement> & { params?: ParamValues },
): UploadAudioElement {
  return {
    id: newId("el"),
    name: "Audio",
    type: "audio",
    sourceType: "upload",
    mediaPath: "",
    startTime: 0,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    trimStart: 0,
    trimEnd: 0,
    params: { ...partial?.params },
    ...partial,
  };
}

export function defaultParamsForType(type: TimelineElement["type"]): ParamValues {
  switch (type) {
    case "text":
      return { ...DEFAULT_TEXT_PARAMS };
    case "video":
    case "image":
      return { ...DEFAULT_VISUAL_PARAMS };
    default:
      return {};
  }
}

/* ------------------------------------------------------------------ */
/* Track + scene + project factories                                  */
/* ------------------------------------------------------------------ */

export function createVideoTrack(partial?: Partial<VideoTrack>): VideoTrack {
  return {
    id: newId("track"),
    name: "Video",
    type: "video",
    elements: [],
    muted: false,
    hidden: false,
    ...partial,
  };
}

export function createTextTrack(partial?: Partial<TextTrack>): TextTrack {
  return {
    id: newId("track"),
    name: "Text",
    type: "text",
    elements: [],
    hidden: false,
    ...partial,
  };
}

export function createAudioTrack(partial?: Partial<AudioTrack>): AudioTrack {
  return {
    id: newId("track"),
    name: "Audio",
    type: "audio",
    elements: [],
    muted: false,
    ...partial,
  };
}

export function createEffectTrack(partial?: Partial<EffectTrack>): EffectTrack {
  return {
    id: newId("track"),
    name: "Effects",
    type: "effect",
    elements: [],
    hidden: false,
    ...partial,
  };
}

/**
 * An effect placed on its own track, applying to everything composited below it
 * for its time span — as opposed to an `Effect` stored on a single element.
 */
export function createEffectElement(
  partial: Partial<EffectElement> & { effectType: string },
): EffectElement {
  const { effectType, ...rest } = partial;
  return {
    id: newId("el"),
    type: "effect",
    name: effectType,
    effectType,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    startTime: 0,
    trimStart: 0,
    trimEnd: 0,
    params: {},
    ...rest,
  };
}

export function createEmptyTracks(): SceneTracks {
  return {
    overlay: [],
    main: createVideoTrack({ name: "Main" }),
    // No default audio track — audio tracks appear on first audio import
    // (matching opencut, which starts with only the main video track).
    audio: [],
  };
}

export function createScene(partial?: Partial<TScene> & { tracks?: SceneTracks }): TScene {
  return {
    id: newId("scene"),
    name: "Scene",
    isMain: true,
    tracks: createEmptyTracks(),
    bookmarks: [],
    ...partial,
  };
}

export function createDefaultProjectSettings(): TProjectSettings {
  return {
    fps: DEFAULT_FPS,
    canvasSize: DEFAULT_CANVAS_SIZE,
    background: DEFAULT_BACKGROUND,
  };
}

export function createProjectMetadata(name = "Untitled"): TProjectMetadata {
  const now = Date.now();
  return {
    id: newId("project"),
    name,
    duration: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultProject(name = "Untitled"): TProject {
  const scene = createScene();
  return {
    schema: "logdd-auto-edit",
    version: 1,
    metadata: createProjectMetadata(name),
    scenes: [scene],
    currentSceneId: scene.id,
    settings: createDefaultProjectSettings(),
  };
}
