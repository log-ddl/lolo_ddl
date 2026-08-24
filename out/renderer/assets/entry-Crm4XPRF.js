import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, F as Film, a7 as FolderOpen, K as Plus, L as LoaderCircle, Y as Clock, P as Pencil, ae as Ellipsis, d as Trash2, b0 as House, b1 as Undo2, b2 as Redo2, b3 as FilePlusCorner, c as Save, aa as Type, aZ as Sparkles, b4 as Blend, b5 as Captions, W as WandSparkles, b6 as Upload, b7 as Move, b8 as Music, b9 as Image, a3 as Check, ag as GripVertical, ba as Diamond, bb as MousePointerClick, a_ as Gauge, a0 as Circle, bc as Minus, S as Scissors, bd as PenLine, aC as Square, Z as Pause, _ as Play, be as Minimize, ah as Maximize, aj as ZoomOut, ai as ZoomIn, a6 as Copy, bf as Waves, b as EyeOff, E as Eye, aO as VolumeX, aP as Volume2, X } from "./lucide-react-DHCwBhKI.js";
import { t as toast, A as translate, C as useUIPreferencesStore, a as useI18n, F as FeatureRail, B as Button, c as cn, I as Input, p as persist, d as createJSONStorage, f as fileStorage } from "./index-ld1jMZXM.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-ZbW8XN3y.js";
import { L as Label } from "./label-DOUrVQeY.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CuPNgqie.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-ZlGxq1Za.js";
import { u as useAutoVideoStore } from "./auto-video-store-Cd8fXBc8.js";
import { S as Switch } from "./switch-D859FYwM.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import "./supabase-DI0hoIb9.js";
function newId(prefix = "") {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}-${id}` : id;
}
const ZERO_MS = 0;
const FPS_30 = { numerator: 30, denominator: 1 };
function frameRateToFloat(fps) {
  return fps.numerator / fps.denominator;
}
function frameDurationMs(fps) {
  return fps.denominator / fps.numerator * 1e3;
}
function snapToFrame(ms, fps) {
  const dur = frameDurationMs(fps);
  return Math.max(0, Math.round(ms / dur) * Math.round(dur));
}
function formatTimecodeCompact(ms) {
  const total = Math.max(0, Math.round(ms));
  const minutes = Math.floor(total / 6e4);
  const seconds = Math.floor(total % 6e4 / 1e3);
  const cs = Math.floor(total % 1e3 / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
const DEFAULT_NEW_ELEMENT_DURATION = 5e3;
const DEFAULT_FPS = FPS_30;
const DEFAULT_CANVAS_SIZE = { width: 1920, height: 1080 };
const DEFAULT_BACKGROUND = { type: "color", color: "#000000" };
const DEFAULT_VISUAL_PARAMS = {
  "transform.positionX": 0,
  "transform.positionY": 0,
  "transform.scaleX": 1,
  "transform.scaleY": 1,
  "transform.rotate": 0,
  "transform.fit": "contain",
  opacity: 1,
  blendMode: "normal"
};
const DEFAULT_TEXT_PARAMS = {
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
  "background.cornerRadius": 0
};
function createTextElement(partial) {
  return {
    id: newId("el"),
    name: "Text",
    type: "text",
    startTime: 0,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    trimStart: 0,
    trimEnd: 0,
    params: { ...DEFAULT_TEXT_PARAMS, content: "New text", ...partial?.params },
    ...partial
  };
}
function createVideoElement(partial) {
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
    ...partial
  };
}
function createImageElement(partial) {
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
    ...partial
  };
}
function createAudioElement(partial) {
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
    ...partial
  };
}
function createVideoTrack(partial) {
  return {
    id: newId("track"),
    name: "Video",
    type: "video",
    elements: [],
    muted: false,
    hidden: false,
    ...partial
  };
}
function createTextTrack(partial) {
  return {
    id: newId("track"),
    name: "Text",
    type: "text",
    elements: [],
    hidden: false,
    ...partial
  };
}
function createAudioTrack(partial) {
  return {
    id: newId("track"),
    name: "Audio",
    type: "audio",
    elements: [],
    muted: false,
    ...partial
  };
}
function createEffectTrack(partial) {
  return {
    id: newId("track"),
    name: "Effects",
    type: "effect",
    elements: [],
    hidden: false,
    ...partial
  };
}
function createEffectElement(partial) {
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
    ...rest
  };
}
function createEmptyTracks() {
  return {
    overlay: [],
    main: createVideoTrack({ name: "Main" }),
    // No default audio track — audio tracks appear on first audio import
    // (matching opencut, which starts with only the main video track).
    audio: []
  };
}
function createScene(partial) {
  return {
    id: newId("scene"),
    name: "Scene",
    isMain: true,
    tracks: createEmptyTracks(),
    bookmarks: [],
    ...partial
  };
}
function createDefaultProjectSettings() {
  return {
    fps: DEFAULT_FPS,
    canvasSize: DEFAULT_CANVAS_SIZE,
    background: DEFAULT_BACKGROUND
  };
}
function createProjectMetadata(name = "Untitled") {
  const now = Date.now();
  return {
    id: newId("project"),
    name,
    duration: 0,
    createdAt: now,
    updatedAt: now
  };
}
function createDefaultProject(name = "Untitled") {
  const scene = createScene();
  return {
    schema: "logdd-auto-edit",
    version: 1,
    metadata: createProjectMetadata(name),
    scenes: [scene],
    currentSceneId: scene.id,
    settings: createDefaultProjectSettings()
  };
}
function allTracks(tracks) {
  return [...tracks.overlay, tracks.main, ...tracks.audio];
}
function trackTypeForElement(type) {
  switch (type) {
    case "video":
    case "image":
      return "video";
    case "text":
      return "text";
    case "audio":
      return "audio";
    case "effect":
      return "effect";
  }
}
function getScene(project, sceneId) {
  const id = project.currentSceneId;
  return project.scenes.find((s) => s.id === id) ?? project.scenes[0];
}
function getTrack(tracks, trackId) {
  return allTracks(tracks).find((t2) => t2.id === trackId) ?? null;
}
function getElement(tracks, ref) {
  const track = getTrack(tracks, ref.trackId);
  return track?.elements.find((e) => e.id === ref.elementId) ?? null;
}
function findTrackContainer(tracks, trackId) {
  if (tracks.main.id === trackId) return "main";
  if (tracks.overlay.some((t2) => t2.id === trackId)) return "overlay";
  if (tracks.audio.some((t2) => t2.id === trackId)) return "audio";
  return null;
}
function updateScene(project, sceneId, fn) {
  const id = sceneId ?? project.currentSceneId;
  return {
    ...project,
    scenes: project.scenes.map((s) => s.id === id ? fn(s) : s)
  };
}
function updateCurrentScene(project, fn) {
  return updateScene(project, project.currentSceneId, fn);
}
function updateTracks(project, sceneId, fn) {
  return updateScene(project, sceneId, (scene) => ({ ...scene, tracks: fn(scene.tracks) }));
}
function updateTrack(project, trackId, fn) {
  return updateTracks(project, void 0, (tracks) => {
    const container = findTrackContainer(tracks, trackId);
    if (!container) return tracks;
    const map = (t2) => t2.id === trackId ? fn(t2) : t2;
    if (container === "main") return { ...tracks, main: map(tracks.main) };
    if (container === "overlay")
      return { ...tracks, overlay: tracks.overlay.map(map) };
    return { ...tracks, audio: tracks.audio.map(map) };
  });
}
function mapTrackElements(track, elementId, fn) {
  return {
    ...track,
    elements: track.elements.map((e) => e.id === elementId ? fn(e) : e)
  };
}
function updateElement(project, ref, fn) {
  return updateTrack(
    project,
    ref.trackId,
    (track) => mapTrackElements(track, ref.elementId, fn)
  );
}
function removeElement(tracks, ref) {
  const filter = (t2) => t2.id === ref.trackId ? { ...t2, elements: t2.elements.filter((e) => e.id !== ref.elementId) } : t2;
  return {
    overlay: tracks.overlay.map(filter),
    main: filter(tracks.main),
    audio: tracks.audio.map(filter)
  };
}
function replaceElement(tracks, ref, replacements) {
  const map = (t2) => t2.id !== ref.trackId ? t2 : {
    ...t2,
    elements: t2.elements.flatMap(
      (e) => e.id === ref.elementId ? replacements : [e]
    )
  };
  return {
    overlay: tracks.overlay.map(map),
    main: map(tracks.main),
    audio: tracks.audio.map(map)
  };
}
function appendTrack(tracks, track) {
  if (track.type === "audio") {
    return { ...tracks, audio: [...tracks.audio, track] };
  }
  return { ...tracks, overlay: [...tracks.overlay, track] };
}
function prependTrack(tracks, track) {
  if (track.type === "audio") {
    return { ...tracks, audio: [track, ...tracks.audio] };
  }
  return { ...tracks, overlay: [track, ...tracks.overlay] };
}
function insertElement(tracks, trackId, element, index) {
  const put = (t2) => {
    if (t2.id !== trackId) return t2;
    const elements = t2.elements.slice();
    const at = elements.length;
    elements.splice(at, 0, element);
    return { ...t2, elements };
  };
  return {
    overlay: tracks.overlay.map(put),
    main: put(tracks.main),
    audio: tracks.audio.map(put)
  };
}
function nextVisualSibling(track, elementId) {
  const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
  const index = sorted.findIndex((e) => e.id === elementId);
  if (index < 0) return null;
  const next = sorted[index + 1];
  return next && (next.type === "video" || next.type === "image") ? next : null;
}
function computeRippleAdjustments({
  beforeTracks,
  afterTracks
}) {
  const beforeTrackList = allTracks(beforeTracks);
  const afterTrackList = allTracks(afterTracks);
  const afterTracksById = new Map(afterTrackList.map((track) => [track.id, track]));
  const allAfterElementIds = new Set(
    afterTrackList.flatMap((track) => track.elements.map((element) => element.id))
  );
  return beforeTrackList.flatMap(
    (beforeTrack) => computeTrackRippleAdjustments({
      trackId: beforeTrack.id,
      beforeElements: beforeTrack.elements,
      afterElements: afterTracksById.get(beforeTrack.id)?.elements ?? [],
      allAfterElementIds
    })
  );
}
function computeTrackRippleAdjustments({
  trackId,
  beforeElements,
  afterElements,
  allAfterElementIds
}) {
  const beforeElementsById = buildElementSpanMap({ elements: beforeElements });
  const afterElementsById = buildElementSpanMap({ elements: afterElements });
  const { vacatedIntervals, joinedIntervals } = collectTrackIntervals({
    beforeElementsById,
    afterElementsById,
    allAfterElementIds
  });
  const freedIntervals = subtractIntervalSets({
    sourceIntervals: vacatedIntervals,
    overlappingIntervals: joinedIntervals
  });
  return buildAdjustments({ trackId, intervals: freedIntervals });
}
function buildElementSpanMap({
  elements
}) {
  return new Map(
    elements.map((element) => [
      element.id,
      {
        id: element.id,
        startTime: element.startTime,
        endTime: element.startTime + element.duration
      }
    ])
  );
}
function collectTrackIntervals({
  beforeElementsById,
  afterElementsById,
  allAfterElementIds
}) {
  const vacatedIntervals = [];
  const joinedIntervals = [];
  for (const beforeElement of beforeElementsById.values()) {
    const afterElement = afterElementsById.get(beforeElement.id);
    if (!afterElement) {
      const wasMovedToAnotherTrack = allAfterElementIds.has(beforeElement.id);
      if (!wasMovedToAnotherTrack) {
        pushInterval({
          intervals: vacatedIntervals,
          startTime: beforeElement.startTime,
          endTime: beforeElement.endTime
        });
      }
      continue;
    }
    if (beforeElement.endTime > afterElement.endTime) {
      pushInterval({
        intervals: vacatedIntervals,
        startTime: afterElement.endTime,
        endTime: beforeElement.endTime
      });
    }
  }
  for (const afterElement of afterElementsById.values()) {
    if (beforeElementsById.has(afterElement.id)) {
      continue;
    }
    pushInterval({
      intervals: joinedIntervals,
      startTime: afterElement.startTime,
      endTime: afterElement.endTime
    });
  }
  return {
    vacatedIntervals: normalizeIntervals({ intervals: vacatedIntervals }),
    joinedIntervals: normalizeIntervals({ intervals: joinedIntervals })
  };
}
function buildAdjustments({
  trackId,
  intervals
}) {
  return intervals.flatMap((interval) => {
    const shiftAmount = interval.endTime - interval.startTime;
    if (shiftAmount <= 0) {
      return [];
    }
    return [{ trackId, afterTime: interval.endTime, shiftAmount }];
  });
}
function subtractIntervalSets({
  sourceIntervals,
  overlappingIntervals
}) {
  const normalizedSourceIntervals = normalizeIntervals({ intervals: sourceIntervals });
  const normalizedOverlappingIntervals = normalizeIntervals({ intervals: overlappingIntervals });
  return normalizedSourceIntervals.flatMap(
    (sourceInterval) => subtractSingleInterval({
      sourceInterval,
      overlappingIntervals: normalizedOverlappingIntervals
    })
  );
}
function normalizeIntervals({ intervals }) {
  const validIntervals = [];
  for (const interval of intervals) {
    pushInterval({
      intervals: validIntervals,
      startTime: interval.startTime,
      endTime: interval.endTime
    });
  }
  const sortedIntervals = validIntervals.sort(
    (leftInterval, rightInterval) => leftInterval.startTime - rightInterval.startTime
  );
  if (sortedIntervals.length === 0) {
    return [];
  }
  const mergedIntervals = [{ ...sortedIntervals[0] }];
  for (const interval of sortedIntervals.slice(1)) {
    const previousInterval = mergedIntervals[mergedIntervals.length - 1];
    if (interval.startTime <= previousInterval.endTime) {
      previousInterval.endTime = Math.max(previousInterval.endTime, interval.endTime);
      continue;
    }
    mergedIntervals.push({ ...interval });
  }
  return mergedIntervals;
}
function subtractSingleInterval({
  sourceInterval,
  overlappingIntervals
}) {
  let remainingIntervals = [{ ...sourceInterval }];
  for (const overlappingInterval of overlappingIntervals) {
    remainingIntervals = remainingIntervals.flatMap((remainingInterval) => {
      if (overlappingInterval.endTime <= remainingInterval.startTime || overlappingInterval.startTime >= remainingInterval.endTime) {
        return [remainingInterval];
      }
      const nextIntervals = [];
      pushInterval({
        intervals: nextIntervals,
        startTime: remainingInterval.startTime,
        endTime: overlappingInterval.startTime
      });
      pushInterval({
        intervals: nextIntervals,
        startTime: overlappingInterval.endTime,
        endTime: remainingInterval.endTime
      });
      return nextIntervals;
    });
    if (remainingIntervals.length === 0) {
      return [];
    }
  }
  return remainingIntervals;
}
function pushInterval({
  intervals,
  startTime,
  endTime
}) {
  if (endTime <= startTime) {
    return;
  }
  intervals.push({ startTime, endTime });
}
function applyRippleAdjustments({
  tracks,
  adjustments
}) {
  if (adjustments.length === 0) {
    return tracks;
  }
  const adjustmentsByTrack = /* @__PURE__ */ new Map();
  for (const adjustment of adjustments) {
    const trackAdjustments = adjustmentsByTrack.get(adjustment.trackId) ?? [];
    trackAdjustments.push(adjustment);
    adjustmentsByTrack.set(adjustment.trackId, trackAdjustments);
  }
  const applyToTrack = (track) => {
    const trackAdjustments = adjustmentsByTrack.get(track.id) ?? [];
    if (trackAdjustments.length === 0) {
      return track;
    }
    const sortedAdjustments = [...trackAdjustments].sort(
      (first, second) => second.afterTime - first.afterTime
    );
    let elements = track.elements;
    for (const adjustment of sortedAdjustments) {
      elements = rippleShiftElements({
        elements,
        afterTime: adjustment.afterTime,
        shiftAmount: adjustment.shiftAmount
      });
    }
    return { ...track, elements };
  };
  return {
    overlay: tracks.overlay.map(applyToTrack),
    main: applyToTrack(tracks.main),
    audio: tracks.audio.map(applyToTrack)
  };
}
function rippleShiftElements({
  elements,
  afterTime,
  shiftAmount
}) {
  return elements.map(
    (element) => element.startTime >= afterTime ? { ...element, startTime: element.startTime - shiftAmount } : element
  );
}
function emptyHistory() {
  return { past: [], future: [] };
}
function pushHistory(history, project) {
  const past = [...history.past, project].slice(-100);
  return { past, future: [] };
}
function undoHistory(history, project) {
  if (history.past.length === 0) return null;
  const past = history.past.slice();
  const previous = past.pop();
  const future = [project, ...history.future];
  return { project: previous, history: { past, future } };
}
function redoHistory(history, project) {
  if (history.future.length === 0) return null;
  const [next, ...rest] = history.future;
  const past = [...history.past, project].slice(-100);
  return { project: next, history: { past, future: rest } };
}
const EMPTY_SELECTION = { elements: [], keyframes: [] };
const useEditorStore = create()((set) => ({
  project: null,
  history: emptyHistory(),
  mediaAssets: {},
  selection: EMPTY_SELECTION,
  lastCommandLabel: null,
  rippleEnabled: true,
  newProject: (name) => set({
    project: createDefaultProject(name),
    history: emptyHistory(),
    selection: EMPTY_SELECTION,
    lastCommandLabel: null
  }),
  loadProject: (project) => set({
    project,
    history: emptyHistory(),
    selection: EMPTY_SELECTION,
    lastCommandLabel: null
  }),
  execute: (command, selection) => set((state) => {
    if (!state.project) return state;
    const beforeTracks = state.rippleEnabled ? getScene(state.project).tracks : null;
    const applied = command.apply(state.project);
    const next = beforeTracks ? applyRipple({
      project: applied,
      beforeTracks,
      afterTracks: getScene(applied).tracks
    }) : applied;
    return {
      project: next,
      history: pushHistory(state.history, state.project),
      selection: selection ?? state.selection,
      lastCommandLabel: command.label
    };
  }),
  undo: () => set((state) => {
    if (!state.project) return state;
    const result = undoHistory(state.history, state.project);
    if (!result) return state;
    return { project: result.project, history: result.history };
  }),
  redo: () => set((state) => {
    if (!state.project) return state;
    const result = redoHistory(state.history, state.project);
    if (!result) return state;
    return { project: result.project, history: result.history };
  }),
  resetHistory: () => set({ history: emptyHistory() }),
  setSelection: (selection) => set({ selection }),
  setRippleEnabled: (rippleEnabled) => set({ rippleEnabled }),
  setCurrentScene: (sceneId) => set((state) => {
    if (!state.project || !state.project.scenes.some((s) => s.id === sceneId)) {
      return state;
    }
    return {
      project: { ...state.project, currentSceneId: sceneId },
      // Selection refers to elements in the previous scene.
      selection: EMPTY_SELECTION
    };
  }),
  registerMediaAsset: (asset) => set((state) => ({ mediaAssets: { ...state.mediaAssets, [asset.path]: asset } })),
  removeMediaAsset: (path) => set((state) => {
    const mediaAssets = { ...state.mediaAssets };
    delete mediaAssets[path];
    return { mediaAssets };
  }),
  clearMediaAssets: () => set({ mediaAssets: {} })
}));
function applyRipple({
  project,
  beforeTracks,
  afterTracks
}) {
  const adjustments = computeRippleAdjustments({ beforeTracks, afterTracks });
  if (adjustments.length === 0) {
    return project;
  }
  const tracksWithRipple = applyRippleAdjustments({ tracks: afterTracks, adjustments });
  return updateCurrentScene(project, (scene) => ({ ...scene, tracks: tracksWithRipple }));
}
function useCanUndo() {
  return useEditorStore((s) => s.history.past.length > 0);
}
function useCanRedo() {
  return useEditorStore((s) => s.history.future.length > 0);
}
function t$2(key) {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}
async function saveProject() {
  const project = useEditorStore.getState().project;
  const runtime = window.autoEditRuntime;
  if (!project || !runtime) {
    toast.error(t$2("autoEdit.project.saveFailed"));
    return;
  }
  const payload = {
    ...project,
    metadata: { ...project.metadata, updatedAt: Date.now() }
  };
  const result = await runtime.saveProjectFile({
    id: project.metadata.id,
    content: JSON.stringify(payload, null, 2)
  });
  if (!result.success) {
    toast.error(result.error ?? t$2("autoEdit.project.saveFailed"));
    return;
  }
  useEditorStore.setState({ project: payload });
  toast.success(t$2("autoEdit.project.saved"));
}
function basename$1(path) {
  return path.split(/[\\/]/).pop() || path;
}
function collectMediaPaths(project) {
  const map = /* @__PURE__ */ new Map();
  for (const scene of project.scenes) {
    for (const track of allTracks(scene.tracks)) {
      for (const el of track.elements) {
        const path = "mediaPath" in el ? el.mediaPath : void 0;
        if (!path) continue;
        if (el.type === "video") map.set(path, "video");
        else if (el.type === "image") map.set(path, "image");
        else if (el.type === "audio") map.set(path, "audio");
      }
    }
  }
  return map;
}
function isAutoEditProject(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return v.schema === "logdd-auto-edit" && Array.isArray(v.scenes) && !!v.settings;
}
async function applyLoadedProject(parsed) {
  const store = useEditorStore.getState();
  const paths = collectMediaPaths(parsed);
  let previewByPath = {};
  try {
    previewByPath = await window.autoEditRuntime?.registerMediaPaths([...paths.keys()]) ?? {};
  } catch {
    previewByPath = {};
  }
  const mediaAssets = {};
  await Promise.all(
    [...paths.entries()].map(async ([p, kind]) => {
      let durationMs = 5e3;
      if (kind !== "image") {
        try {
          const { durationSec } = await window.ffmpegRuntime?.probeDuration(p) ?? {};
          if (durationSec != null && Number.isFinite(durationSec)) {
            durationMs = Math.max(1, Math.round(durationSec * 1e3));
          }
        } catch {
        }
      }
      mediaAssets[p] = {
        path: p,
        name: basename$1(p),
        kind,
        previewUrl: previewByPath[p] ?? "",
        durationMs
      };
    })
  );
  store.loadProject(parsed);
  useEditorStore.setState({ mediaAssets });
  toast.success(t$2("autoEdit.project.loaded"));
}
async function loadProject() {
  const runtime = window.autoEditRuntime;
  if (!runtime) {
    toast.error(t$2("autoEdit.project.loadFailed"));
    return false;
  }
  const picked = await runtime.pickJson();
  if (picked.canceled || picked.content == null) return false;
  const parsed = parseProject(picked.content);
  if (!parsed) return false;
  await applyLoadedProject(parsed);
  return true;
}
async function loadProjectFromPath(filePath) {
  const runtime = window.autoEditRuntime;
  if (!runtime) {
    toast.error(t$2("autoEdit.project.loadFailed"));
    return false;
  }
  const loaded = await runtime.loadProjectFile(filePath);
  if (!loaded.success || loaded.content == null) {
    toast.error(loaded.error ?? t$2("autoEdit.project.loadFailed"));
    return false;
  }
  const parsed = parseProject(loaded.content);
  if (!parsed) return false;
  await applyLoadedProject(parsed);
  return true;
}
function parseProject(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    toast.error(t$2("autoEdit.project.invalid"));
    return null;
  }
  if (!isAutoEditProject(parsed)) {
    toast.error(t$2("autoEdit.project.invalid"));
    return null;
  }
  return parsed;
}
function newProject() {
  useEditorStore.getState().newProject();
}
const useAutoEditViewStore = create()((set) => ({
  view: "dashboard",
  setView: (view) => set({ view })
}));
function Dashboard() {
  const { t: t2 } = useI18n();
  const setView = useAutoEditViewStore((s) => s.setView);
  const [projects, setProjects] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [renamingId, setRenamingId] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  const [confirmingId, setConfirmingId] = reactExports.useState(null);
  const refresh = async () => {
    setLoading(true);
    const runtime = window.autoEditRuntime;
    if (!runtime) {
      setLoading(false);
      return;
    }
    const result = await runtime.listProjects();
    setProjects(result.projects ?? []);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    void refresh();
  }, []);
  const create2 = () => {
    newProject();
    setView("editor");
  };
  const open = async (p) => {
    const ok = await loadProjectFromPath(p.filePath);
    if (ok) setView("editor");
  };
  const startRename = (p) => {
    setRenamingId(p.id);
    setRenameValue(p.name);
  };
  const commitRename = async (p) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === p.name) return;
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    const result = await runtime.renameProject({ filePath: p.filePath, name });
    if (result.success) void refresh();
    else toast.error(result.error ?? t2("autoEdit.project.saveFailed"));
  };
  const deleteProject = async (p) => {
    if (confirmingId !== p.id) {
      setConfirmingId(p.id);
      window.setTimeout(() => setConfirmingId((id) => id === p.id ? null : id), 3e3);
      return;
    }
    setConfirmingId(null);
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    const result = await runtime.deleteProject(p.filePath);
    if (result.success) void refresh();
    else toast.error(result.error ?? t2("autoEdit.project.saveFailed"));
  };
  const sorted = reactExports.useMemo(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt), [projects]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureRail, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-panel px-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-semibold leading-tight", children: t2("autoEdit.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t2("autoEdit.dashboard.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => void loadProject().then((ok) => {
              if (ok) setView("editor");
            }),
            className: "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-4" }),
              t2("autoEdit.openProject")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            type: "button",
            onClick: create2,
            className: "",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
              t2("autoEdit.newProject")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto p-6", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-40 items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin" }) }) : sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState$1, { onCreate: create2 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: sorted.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ProjectCard,
        {
          project: p,
          renaming: renamingId === p.id,
          renameValue,
          confirming: confirmingId === p.id,
          onRenameValue: setRenameValue,
          onStartRename: () => startRename(p),
          onCommitRename: () => void commitRename(p),
          onOpen: () => void open(p),
          onDelete: () => void deleteProject(p),
          onReveal: () => void window.autoEditRuntime?.revealProject(p.filePath)
        },
        p.id
      )) }) })
    ] })
  ] });
}
function EmptyState$1({ onCreate }) {
  const { t: t2 } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-60 flex-col items-center justify-center gap-3 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-7" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: t2("autoEdit.dashboard.empty") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: t2("autoEdit.dashboard.emptyHint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        onClick: onCreate,
        className: "mt-1",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          t2("autoEdit.newProject")
        ]
      }
    )
  ] });
}
function ProjectCard({
  project,
  renaming,
  renameValue,
  confirming,
  onRenameValue,
  onStartRename,
  onCommitRename,
  onOpen,
  onDelete,
  onReveal
}) {
  const { t: t2 } = useI18n();
  const updated = new Date(project.updatedAt);
  const updatedLabel = Number.isFinite(updated.getTime()) ? updated.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" }) : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex flex-col rounded-xl border border-border/60 bg-panel p-3 transition-colors hover:border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "button",
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (e) => {
          if (e.key === "Enter") onOpen();
        },
        className: "flex cursor-pointer flex-col items-start text-left",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-24 w-full items-center justify-center rounded-lg bg-background/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-8 text-muted-foreground/40" }) }),
          renaming ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              autoFocus: true,
              value: renameValue,
              onChange: (e) => onRenameValue(e.target.value),
              onBlur: onCommitRename,
              onKeyDown: (e) => {
                e.stopPropagation();
                if (e.key === "Enter") onCommitRename();
                if (e.key === "Escape") onCommitRename();
              },
              onClick: (e) => e.stopPropagation(),
              className: "mt-2 w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-medium text-foreground"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 w-full truncate text-sm font-medium text-foreground", children: project.name })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-3" }),
        updatedLabel
      ] }),
      project.durationMs > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tabular-nums", children: formatTimecodeCompact(project.durationMs) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-1 border-t border-border/60 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: onStartRename,
          title: t2("autoEdit.dashboard.rename"),
          className: "size-7 text-muted-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: onReveal,
          title: t2("autoEdit.dashboard.reveal"),
          className: "size-7 text-muted-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "size-3.5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onDelete,
          className: cn(
            "flex h-7 items-center gap-1 rounded-lg px-2 text-2xs font-medium transition-colors",
            confirming ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-sidebar-accent hover:text-destructive"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" }),
            confirming ? t2("autoEdit.dashboard.confirmDelete") : ""
          ]
        }
      )
    ] })
  ] });
}
function mergeParams(current, patch) {
  return { ...current, ...patch };
}
function isLeafChannel(data) {
  return !!data && Array.isArray(data.keys);
}
function isScalarChannel(channel) {
  return "extrapolation" in channel || channel.keys.some((k) => "segmentToNext" in k);
}
const BEZIER_SOLVE_ITERATIONS = 20;
function getBezierPoint(progress, p0, p1, p2, p3) {
  const mt = 1 - progress;
  return mt * mt * mt * p0 + 3 * mt * mt * progress * p1 + 3 * mt * progress * progress * p2 + progress * progress * progress * p3;
}
function getDefaultRightHandle(leftKey, rightKey) {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return { dt: span / 3, dv: valueDelta / 3 };
}
function getDefaultLeftHandle(leftKey, rightKey) {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return { dt: -span / 3, dv: -valueDelta / 3 };
}
function solveBezierProgressForTime(time, leftKey, rightKey) {
  let lower = 0;
  let upper = 1;
  const rightHandle = leftKey.rightHandle ?? getDefaultRightHandle(leftKey, rightKey);
  const leftHandle = rightKey.leftHandle ?? getDefaultLeftHandle(leftKey, rightKey);
  for (let i = 0; i < BEZIER_SOLVE_ITERATIONS; i += 1) {
    const mid = (lower + upper) / 2;
    const estimate = getBezierPoint(
      mid,
      leftKey.time,
      leftKey.time + rightHandle.dt,
      rightKey.time + leftHandle.dt,
      rightKey.time
    );
    if (estimate < time) lower = mid;
    else upper = mid;
  }
  return (lower + upper) / 2;
}
function normalizeScalarKeys(channel) {
  return [...channel.keys].sort((a, b) => a.time - b.time);
}
function clamp01$2(v) {
  return Math.max(0, Math.min(1, v));
}
function extrapolateEdge(mode, edgeKey, neighborKey, time) {
  if (mode === "hold" || !neighborKey) return edgeKey.value;
  const span = neighborKey.time - edgeKey.time;
  if (span === 0) return edgeKey.value;
  return edgeKey.value + (time - edgeKey.time) / span * (neighborKey.value - edgeKey.value);
}
function getScalarValueAtTime(channel, time, fallbackValue) {
  if (!channel || channel.keys.length === 0) return fallbackValue;
  const keys = normalizeScalarKeys(channel);
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (time <= first.time) {
    if (time < first.time) {
      return extrapolateEdge(channel.extrapolation?.before ?? "hold", first, keys[1], time);
    }
    return first.value;
  }
  if (time >= last.time) {
    if (time > last.time) {
      return extrapolateEdge(
        channel.extrapolation?.after ?? "hold",
        last,
        keys[keys.length - 2],
        time
      );
    }
    return last.value;
  }
  for (let i = 0; i < keys.length - 1; i += 1) {
    const left = keys[i];
    const right = keys[i + 1];
    if (time === right.time) return right.value;
    if (time < left.time || time > right.time) continue;
    if (left.segmentToNext === "step") return left.value;
    const span = right.time - left.time;
    if (span === 0) return right.value;
    const progress = clamp01$2((time - left.time) / span);
    if (left.segmentToNext === "linear") {
      return left.value + (right.value - left.value) * progress;
    }
    const curveProgress = solveBezierProgressForTime(time, left, right);
    const rightHandle = left.rightHandle ?? getDefaultRightHandle(left, right);
    const leftHandle = right.leftHandle ?? getDefaultLeftHandle(left, right);
    return getBezierPoint(
      curveProgress,
      left.value,
      left.value + rightHandle.dv,
      right.value + leftHandle.dv,
      right.value
    );
  }
  return last.value;
}
function getDiscreteValueAtTime(channel, time, fallbackValue) {
  if (!channel || channel.keys.length === 0) return fallbackValue;
  let current = fallbackValue;
  for (const key of [...channel.keys].sort((a, b) => a.time - b.time)) {
    if (time < key.time) break;
    current = key.value;
  }
  return current;
}
function resolvePathValueAtTime(animations, propertyPath, localTime, fallbackValue) {
  const data = animations?.[propertyPath];
  if (!data || !isLeafChannel(data)) return fallbackValue;
  if (typeof fallbackValue === "number") {
    return isScalarChannel(data) ? getScalarValueAtTime(data, localTime, fallbackValue) : fallbackValue;
  }
  if (typeof fallbackValue === "string" || typeof fallbackValue === "boolean") {
    return isScalarChannel(data) ? fallbackValue : getDiscreteValueAtTime(data, localTime, fallbackValue);
  }
  return fallbackValue;
}
function resolveAnimatedParams(params, animations, localTime) {
  if (!animations) return params;
  const out = { ...params };
  for (const key of Object.keys(animations)) {
    const fallback = params[key];
    if (fallback === void 0) continue;
    out[key] = resolvePathValueAtTime(animations, key, localTime, fallback);
  }
  return out;
}
function upsertScalarKeyframe(animations, propertyPath, time, value) {
  const existing = animations?.[propertyPath];
  const channel = existing && isLeafChannel(existing) && isScalarChannel(existing) ? existing : { keys: [] };
  const keys = [...channel.keys];
  const rounded = Math.round(time);
  const idx = keys.findIndex((k) => Math.abs(k.time - rounded) < 1);
  const key = idx >= 0 ? { ...keys[idx], value } : {
    id: newId("kf"),
    time: rounded,
    value,
    segmentToNext: "linear",
    tangentMode: "flat"
  };
  if (idx >= 0) keys[idx] = key;
  else keys.push(key);
  keys.sort((a, b) => a.time - b.time);
  return { ...animations, [propertyPath]: { ...channel, keys } };
}
function removeKeyframeAt(animations, propertyPath, time) {
  const existing = animations?.[propertyPath];
  if (!existing || !isLeafChannel(existing) || !isScalarChannel(existing)) {
    return animations ?? {};
  }
  const rounded = Math.round(time);
  const keys = existing.keys.filter((k) => Math.abs(k.time - rounded) >= 1);
  return { ...animations, [propertyPath]: { ...existing, keys } };
}
function hasKeyframeAt(animations, propertyPath, time) {
  const existing = animations?.[propertyPath];
  if (!existing || !isLeafChannel(existing) || !isScalarChannel(existing)) return false;
  const rounded = Math.round(time);
  return existing.keys.some((k) => Math.abs(k.time - rounded) < 1);
}
function cloneAnimations(animations) {
  if (!animations) return void 0;
  const out = {};
  for (const [path, data] of Object.entries(animations)) {
    if (!data) continue;
    if (isLeafChannel(data)) {
      out[path] = {
        ...data,
        keys: data.keys.map((key) => ({ ...key, id: newId("kf") }))
      };
    } else {
      const composite = {};
      for (const [componentKey, channel] of Object.entries(data)) {
        if (!channel || !isLeafChannel(channel)) {
          composite[componentKey] = channel;
          continue;
        }
        composite[componentKey] = {
          ...channel,
          keys: channel.keys.map((key) => ({ ...key, id: newId("kf") }))
        };
      }
      out[path] = composite;
    }
  }
  return out;
}
const EFFECT_DEFINITIONS = [
  {
    type: "blur",
    name: "Gaussian Blur",
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "number",
        default: 15,
        min: 0,
        max: 100,
        step: 1
      }
    ]
  }
];
function getEffectDefinition(type) {
  return EFFECT_DEFINITIONS.find((d) => d.type === type);
}
function buildDefaultEffect(type) {
  const def = getEffectDefinition(type);
  const params = {};
  for (const p of def?.params ?? []) params[p.key] = p.default;
  return { id: newId("fx"), type, params, enabled: true };
}
function blurIntensityToPx(intensity) {
  const raw = Number.isFinite(intensity) ? intensity : 0;
  return Math.max(0, raw / 5);
}
const MASK_DEFINITIONS = [
  { type: "rectangle", name: "Rectangle" },
  { type: "ellipse", name: "Ellipse" },
  { type: "cinematic-bars", name: "Cinematic Bars" },
  { type: "split", name: "Split" },
  { type: "freeform", name: "Freeform" }
];
const SHORT_SIDE_RATIO = 0.6;
const DEFAULT_FREEFORM_PATH = [
  { x: 0.5, y: 0.16 },
  { x: 0.79, y: 0.32 },
  { x: 0.79, y: 0.68 },
  { x: 0.5, y: 0.84 },
  { x: 0.21, y: 0.68 },
  { x: 0.21, y: 0.32 }
];
function buildDefaultMask(type) {
  if (type === "split") {
    return {
      id: newId("mask"),
      type: "split",
      params: {
        centerX: 0,
        centerY: 0,
        rotation: 0,
        feather: 0,
        inverted: false,
        strokeColor: "#ffffff",
        strokeWidth: 0,
        strokeAlign: "inside"
      }
    };
  }
  if (type === "freeform") {
    return {
      id: newId("mask"),
      type: "freeform",
      params: {
        path: DEFAULT_FREEFORM_PATH.map((p) => ({ ...p })),
        closed: true,
        centerX: 0,
        centerY: 0,
        rotation: 0,
        scale: 1,
        feather: 0,
        inverted: false,
        strokeColor: "#ffffff",
        strokeWidth: 0,
        strokeAlign: "inside"
      }
    };
  }
  const rectType = type;
  const params = {
    centerX: 0.5,
    centerY: 0.5,
    width: type === "cinematic-bars" ? 1 : SHORT_SIDE_RATIO,
    height: type === "cinematic-bars" ? 0.6 : SHORT_SIDE_RATIO,
    rotation: 0,
    scale: 1,
    feather: 0,
    inverted: false,
    strokeColor: "#ffffff",
    strokeWidth: 0,
    strokeAlign: "inside"
  };
  return { id: newId("mask"), type: rectType, params };
}
function resolveMaskClipPath(mask) {
  switch (mask.type) {
    case "rectangle":
    case "cinematic-bars":
      return rectClipPath(mask.params);
    case "ellipse":
      return ellipseClipPath(mask.params);
    case "split":
      return splitClipPath(mask.params);
    case "freeform":
      return freeformClipPath(mask.params);
  }
}
function rectClipPath(p) {
  const w = Math.max(0, p.width * p.scale);
  const h = Math.max(0, p.height * p.scale);
  const left = clamp01$1(p.centerX - w / 2);
  const right = clamp01$1(1 - (p.centerX + w / 2));
  const top = clamp01$1(p.centerY - h / 2);
  const bottom = clamp01$1(1 - (p.centerY + h / 2));
  return `inset(${pct(top)} ${pct(right)} ${pct(bottom)} ${pct(left)})`;
}
function ellipseClipPath(p) {
  const rx = Math.max(0, p.width * p.scale) / 2 * 100;
  const ry = Math.max(0, p.height * p.scale) / 2 * 100;
  const cx = clamp01$1(p.centerX) * 100;
  const cy = clamp01$1(p.centerY) * 100;
  return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
}
function splitClipPath(p) {
  const angleRad = p.rotation * Math.PI / 180;
  const normalX = Math.abs(Math.cos(angleRad)) < 1e-10 ? 0 : Math.cos(angleRad);
  const normalY = Math.abs(Math.sin(angleRad)) < 1e-10 ? 0 : Math.sin(angleRad);
  const lineX = 0.5 + p.centerX;
  const lineY = 0.5 + p.centerY;
  const sign = (x, y) => (x - lineX) * normalX + (y - lineY) * normalY;
  const inside = (x, y) => sign(x, y) >= 0;
  const edges = [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0]
  ];
  const intersection = (x1, y1, x2, y2) => {
    const d1 = sign(x1, y1);
    const d2 = sign(x2, y2);
    const denom = d1 - d2;
    if (Math.abs(denom) < 1e-10) return null;
    const t2 = d1 / denom;
    if (t2 < 0 || t2 > 1) return null;
    return { x: x1 + (x2 - x1) * t2, y: y1 + (y2 - y1) * t2 };
  };
  const vertices = [];
  for (const [x1, y1, x2, y2] of edges) {
    const v1in = inside(x1, y1);
    const v2in = inside(x2, y2);
    if (v1in && v2in) {
      vertices.push([x2, y2]);
    } else if (v1in && !v2in) {
      const hit = intersection(x1, y1, x2, y2);
      if (hit) vertices.push([hit.x, hit.y]);
    } else if (!v1in && v2in) {
      const hit = intersection(x1, y1, x2, y2);
      if (hit) {
        vertices.push([hit.x, hit.y]);
        vertices.push([x2, y2]);
      }
    }
  }
  if (vertices.length < 3) return "polygon(0 0, 0 0, 0 0)";
  return `polygon(${vertices.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ")})`;
}
function freeformClipPath(p) {
  if (p.path.length < 3) return "none";
  const points = p.path.map((pt) => ({
    x: clamp01$1(0.5 + p.centerX + (pt.x - 0.5) * p.scale),
    y: clamp01$1(0.5 + p.centerY + (pt.y - 0.5) * p.scale)
  }));
  return `polygon(${points.map((pt) => `${pct(pt.x)} ${pct(pt.y)}`).join(", ")})`;
}
function clamp01$1(v) {
  return Math.max(0, Math.min(1, v));
}
function pct(v) {
  return `${clamp01$1(v) * 100}%`;
}
function clampRate(rate) {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(8, Math.max(0.1, rate));
}
const TRANSITIONS = [
  { type: "none", label: "None", xfade: "", durationMs: 0 },
  { type: "fade", label: "Fade", xfade: "fade", durationMs: 350 },
  { type: "fade_slow", label: "Fade (slow)", xfade: "fadeslow", durationMs: 650 },
  { type: "dip_white", label: "Dip to white", xfade: "fadewhite", durationMs: 350 },
  { type: "flash_white", label: "Flash white", xfade: "fadewhite", durationMs: 140 },
  { type: "dissolve", label: "Dissolve", xfade: "dissolve", durationMs: 450 },
  { type: "fade_black", label: "Fade to black", xfade: "fadeblack", durationMs: 450 },
  { type: "fade_white", label: "Fade to white", xfade: "fadewhite", durationMs: 400 },
  { type: "wipe_left", label: "Wipe left", xfade: "wipeleft", durationMs: 400 },
  { type: "wipe_right", label: "Wipe right", xfade: "wiperight", durationMs: 400 },
  { type: "wipe_up", label: "Wipe up", xfade: "wipeup", durationMs: 400 },
  { type: "wipe_down", label: "Wipe down", xfade: "wipedown", durationMs: 400 },
  { type: "slide_left", label: "Slide left", xfade: "slideleft", durationMs: 450 },
  { type: "slide_right", label: "Slide right", xfade: "slideright", durationMs: 450 },
  { type: "smooth_left", label: "Smooth left", xfade: "smoothleft", durationMs: 500 },
  { type: "smooth_right", label: "Smooth right", xfade: "smoothright", durationMs: 500 },
  { type: "circle_open", label: "Circle open", xfade: "circleopen", durationMs: 450 },
  { type: "circle_close", label: "Circle close", xfade: "circleclose", durationMs: 450 },
  { type: "pixelize", label: "Pixelize", xfade: "pixelize", durationMs: 350 },
  { type: "zoom_in", label: "Zoom in", xfade: "zoomin", durationMs: 450 }
];
function transitionDefinition(type) {
  return TRANSITIONS.find((t2) => t2.type === type) ?? TRANSITIONS[0];
}
function xfadeName(type) {
  return transitionDefinition(type).xfade || "fade";
}
function defaultDurationMs(type) {
  return transitionDefinition(type).durationMs;
}
function canPlaceOnTrack(track, startTime, duration) {
  const endTime = startTime + duration;
  return !track.elements.some((element) => {
    const elementEnd = element.startTime + element.duration;
    return startTime < elementEnd && endTime > element.startTime;
  });
}
function resolveNonOverlappingStart({
  track,
  startTime,
  duration,
  excludeElementId
}) {
  const others = track.elements.filter((e) => e.id !== excludeElementId);
  const free = (start) => start >= 0 && !others.some(
    (e) => start < e.startTime + e.duration && start + duration > e.startTime
  );
  if (free(startTime)) return startTime;
  const candidates = [];
  for (const other of others) {
    const otherEnd = other.startTime + other.duration;
    if (startTime < otherEnd && startTime + duration > other.startTime) {
      candidates.push(otherEnd, other.startTime - duration);
    }
  }
  candidates.sort((a, b) => Math.abs(a - startTime) - Math.abs(b - startTime));
  return candidates.find(free) ?? null;
}
function findFirstAvailableTrack(tracks, trackType, startTime, duration) {
  return allTracks(tracks).find(
    (track) => track.type === trackType && canPlaceOnTrack(track, startTime, duration)
  ) ?? null;
}
function addElementToTrackOfTypeCommand(element, trackType, label = "Add media", preferredTrackId) {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const scene = getScene(project);
      const preferred = preferredTrackId ? getTrack(scene.tracks, preferredTrackId) : null;
      const preferredUsable = preferred != null && preferred.type === trackType && canPlaceOnTrack(preferred, element.startTime, element.duration) ? preferred : null;
      const existing = preferredUsable ?? findFirstAvailableTrack(
        scene.tracks,
        trackType,
        element.startTime,
        element.duration
      );
      if (existing) {
        return updateTracks(
          project,
          project.currentSceneId,
          (tracks) => insertElement(tracks, existing.id, element)
        );
      }
      const track = createTrackForType(trackType);
      return updateTracks(
        project,
        project.currentSceneId,
        (tracks) => insertElement(prependTrack(tracks, track), track.id, element)
      );
    }
  };
}
function addEffectLayerCommand(effectType, startTime, label = "Add effect layer") {
  const def = getEffectDefinition(effectType);
  const params = {};
  for (const p of def?.params ?? []) params[p.key] = p.default;
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const element = createEffectElement({
        effectType,
        name: def?.name ?? effectType,
        startTime: Math.max(0, Math.round(startTime)),
        params
      });
      const scene = getScene(project);
      const existing = findFirstAvailableTrack(
        scene.tracks,
        "effect",
        element.startTime,
        element.duration
      );
      if (existing) {
        return updateTracks(
          project,
          project.currentSceneId,
          (tracks) => insertElement(tracks, existing.id, element)
        );
      }
      const track = createEffectTrack();
      return updateTracks(
        project,
        project.currentSceneId,
        (tracks) => insertElement(prependTrack(tracks, track), track.id, element)
      );
    }
  };
}
function buildAutoTimelineCommand(shots, label = "Auto import") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const mainTrack = createVideoTrack({ name: "Main" });
      const audioTrack = createAudioTrack();
      let cursor = 0;
      for (const [index, shot] of shots.entries()) {
        const isLast = index === shots.length - 1;
        const element = shot.kind === "video" ? createVideoElement({
          mediaPath: shot.mediaPath,
          name: shot.name,
          duration: shot.duration,
          startTime: cursor,
          sourceDuration: shot.sourceDurationMs,
          motionEffect: shot.motionEffect,
          // A transition on the final shot has nothing to fade into.
          transitionToNext: !isLast && shot.transition && shot.transition !== "none" ? {
            type: shot.transition,
            durationMs: Math.min(
              defaultDurationMs(shot.transition),
              shot.duration,
              shots[index + 1]?.duration ?? shot.duration
            )
          } : void 0
        }) : createImageElement({
          mediaPath: shot.mediaPath,
          name: shot.name,
          duration: shot.duration,
          startTime: cursor,
          motionEffect: shot.motionEffect,
          transitionToNext: !isLast && shot.transition && shot.transition !== "none" ? {
            type: shot.transition,
            durationMs: Math.min(
              defaultDurationMs(shot.transition),
              shot.duration,
              shots[index + 1]?.duration ?? shot.duration
            )
          } : void 0
        });
        mainTrack.elements.push(element);
        if (shot.voicePath) {
          audioTrack.elements.push(
            createAudioElement({
              mediaPath: shot.voicePath,
              name: shot.name,
              duration: shot.voiceDurationMs ?? shot.duration,
              startTime: cursor
            })
          );
        }
        cursor += shot.duration;
      }
      return updateTracks(project, project.currentSceneId, (tracks) => ({
        ...tracks,
        overlay: [],
        main: mainTrack,
        audio: audioTrack.elements.length > 0 ? [audioTrack] : tracks.audio
      }));
    }
  };
}
function removeElementsCommand(refs, label = "Delete element") {
  return {
    id: newId("cmd"),
    label: refs.length > 1 ? `Delete ${refs.length} elements` : label,
    apply: (project) => {
      let next = project;
      for (const ref of refs) {
        next = updateTracks(next, next.currentSceneId, (tracks) => removeElement(tracks, ref));
      }
      return next;
    }
  };
}
function duplicateElementsCommand(refs, label = "Duplicate element") {
  const duplicatedRefs = [];
  const command = {
    id: newId("cmd"),
    label: refs.length > 1 ? `Duplicate ${refs.length} elements` : label,
    apply: (project) => {
      duplicatedRefs.length = 0;
      const tracks = getScene(project).tracks;
      const byTrack = /* @__PURE__ */ new Map();
      for (const ref of refs) {
        const list = byTrack.get(ref.trackId) ?? [];
        list.push(ref);
        byTrack.set(ref.trackId, list);
      }
      let next = project;
      for (const [trackId, trackRefs] of byTrack) {
        const sourceTrack = getTrack(tracks, trackId);
        if (!sourceTrack) continue;
        const newTrackId = newId("trk");
        const clones = [];
        for (const ref of trackRefs) {
          const element = sourceTrack.elements.find((e) => e.id === ref.elementId);
          if (!element) continue;
          const newElementId = newId("el");
          clones.push({
            ...element,
            id: newElementId,
            name: `${element.name} (copy)`,
            animations: cloneAnimations(element.animations)
          });
          duplicatedRefs.push({ trackId: newTrackId, elementId: newElementId });
        }
        if (clones.length === 0) continue;
        const newTrack = createTrackForType(sourceTrack.type, newTrackId);
        next = updateTracks(next, next.currentSceneId, (current) => {
          let nextTracks = prependTrack(current, newTrack);
          for (const clone of clones) nextTracks = insertElement(nextTracks, newTrackId, clone);
          return nextTracks;
        });
      }
      return next;
    }
  };
  return { command, refs: duplicatedRefs };
}
function updateElementCommand(ref, updater, label = "Edit element") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => updateElement(project, ref, updater)
  };
}
function updateElementParamsCommand(ref, patch, label = "Edit") {
  return updateElementCommand(
    ref,
    (element) => ({ ...element, params: mergeParams(element.params, patch) }),
    label
  );
}
function updateCanvasSizeCommand(width, height, label = "Fit canvas") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => ({
      ...project,
      settings: { ...project.settings, canvasSize: { width, height } }
    })
  };
}
function updateRetimeCommand(ref, rate, label = "Speed") {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "audio") return element;
      return {
        ...element,
        retime: { ...element.retime ?? { rate: 1 }, rate: clampRate(rate) }
      };
    },
    label
  );
}
function updateTransitionCommand(ref, transition, label = "Transition") {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "image") return element;
      return { ...element, transitionToNext: transition ?? void 0 };
    },
    label
  );
}
function updateMotionEffectCommand(ref, motionEffect, label = "Motion") {
  return updateElementCommand(
    ref,
    (element) => {
      if (element.type !== "video" && element.type !== "image") return element;
      const effect = motionEffect === "none" ? void 0 : motionEffect;
      return { ...element, motionEffect: effect };
    },
    label
  );
}
function moveElementsByDeltaCommand(refs, deltaMs, label = "Move elements") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      let next = project;
      for (const ref of refs) {
        next = updateElement(next, ref, (element) => ({
          ...element,
          startTime: Math.max(0, Math.round(element.startTime + deltaMs))
        }));
      }
      return next;
    }
  };
}
function moveElementToTrackCommand(ref, targetTrackId, newStartTime, label = "Move element") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const tracks = getScene(project).tracks;
      const element = getElement(tracks, ref);
      if (!element) return project;
      const startTime = Math.max(0, Math.round(newStartTime));
      if (ref.trackId === targetTrackId) {
        return updateElement(project, ref, (e) => ({ ...e, startTime }));
      }
      const moved = { ...element, startTime };
      return updateTracks(project, project.currentSceneId, (t2) => {
        const without = removeElement(t2, ref);
        return insertElement(without, targetTrackId, moved);
      });
    }
  };
}
function trimElementCommand(ref, patch, label = "Trim element") {
  return updateElementCommand(ref, (element) => ({ ...element, ...patch }), label);
}
function splitElementCommand(ref, splitMs, label = "Split element") {
  const rightId = newId("el");
  return {
    id: newId("cmd"),
    label,
    apply: (project) => {
      const tracks = getScene(project).tracks;
      const element = getElement(tracks, ref);
      if (!element) return project;
      const offset = Math.round(splitMs - element.startTime);
      if (offset <= 0 || offset >= element.duration) return project;
      const rate = element.type === "video" || element.type === "audio" ? element.retime?.rate ?? 1 : 1;
      const sourceOffset = Math.round(offset * rate);
      const remaining = element.duration - offset;
      const remainingSource = Math.round(remaining * rate);
      const left = {
        ...element,
        duration: offset,
        trimEnd: (element.trimEnd ?? 0) + remainingSource
      };
      const right = {
        ...element,
        id: rightId,
        startTime: splitMs,
        duration: remaining,
        trimStart: (element.trimStart ?? 0) + sourceOffset
      };
      return updateTracks(
        project,
        project.currentSceneId,
        (tracks2) => replaceElement(tracks2, ref, [left, right])
      );
    }
  };
}
function toggleTrackHiddenCommand(trackId, label = "Toggle track") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => updateTrack(project, trackId, (track) => {
      if ("hidden" in track) return { ...track, hidden: !track.hidden };
      return track;
    })
  };
}
function toggleTrackMutedCommand(trackId, label = "Mute track") {
  return {
    id: newId("cmd"),
    label,
    apply: (project) => updateTrack(project, trackId, (track) => {
      if ("muted" in track) return { ...track, muted: !track.muted };
      return track;
    })
  };
}
function addEffectCommand(ref, effectType, label = "Add effect") {
  const effect = buildDefaultEffect(effectType);
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return { ...element, effects: [...element.effects ?? [], effect] };
  }, label);
}
function removeEffectCommand(ref, effectId, label = "Remove effect") {
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return { ...element, effects: (element.effects ?? []).filter((e) => e.id !== effectId) };
  }, label);
}
function updateEffectCommand(ref, effectId, patch, label = "Edit effect") {
  return updateElementCommand(ref, (element) => {
    if (!("effects" in element)) return element;
    return {
      ...element,
      effects: (element.effects ?? []).map(
        (e) => e.id === effectId ? { ...e, ...patch.enabled !== void 0 ? { enabled: patch.enabled } : {}, params: { ...e.params, ...patch.params ?? {} } } : e
      )
    };
  }, label);
}
function addMaskCommand(ref, maskType, label = "Add mask") {
  const mask = buildDefaultMask(maskType);
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return { ...element, masks: [...element.masks ?? [], mask] };
  }, label);
}
function removeMaskCommand(ref, maskId, label = "Remove mask") {
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return { ...element, masks: (element.masks ?? []).filter((m) => m.id !== maskId) };
  }, label);
}
function updateMaskCommand(ref, maskId, patch, label = "Edit mask") {
  return updateElementCommand(ref, (element) => {
    if (element.type !== "video" && element.type !== "image") return element;
    return {
      ...element,
      masks: (element.masks ?? []).map(
        (m) => m.id === maskId ? { ...m, params: { ...m.params, ...patch } } : m
      )
    };
  }, label);
}
function addKeyframeCommand(ref, propertyPath, time, value, label = "Add keyframe") {
  return updateElementCommand(ref, (element) => ({
    ...element,
    animations: upsertScalarKeyframe(element.animations, propertyPath, time, value)
  }), label);
}
function removeKeyframeCommand(ref, propertyPath, time, label = "Remove keyframe") {
  return updateElementCommand(ref, (element) => ({
    ...element,
    animations: removeKeyframeAt(element.animations, propertyPath, time)
  }), label);
}
function createTrackForType(type, id) {
  switch (type) {
    case "video":
      return createVideoTrack(id ? { id } : void 0);
    case "text":
      return createTextTrack(id ? { id } : void 0);
    case "audio":
      return createAudioTrack(id ? { id } : void 0);
    case "effect":
      return createEffectTrack(id ? { id } : void 0);
  }
}
const BASE_PPS = 50;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;
function pixelsPerSecond(zoomLevel) {
  return BASE_PPS * zoomLevel;
}
function msToPx(ms, zoomLevel) {
  return ms / 1e3 * pixelsPerSecond(zoomLevel);
}
function pxToMs(px, zoomLevel) {
  return px / pixelsPerSecond(zoomLevel) * 1e3;
}
const useTimelineViewStore = create()((set) => ({
  playheadMs: ZERO_MS,
  zoomLevel: 1,
  isPlaying: false,
  draggingRef: null,
  setPlayhead: (ms) => set({ playheadMs: Math.max(0, ms) }),
  setZoom: (level) => set({ zoomLevel: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level)) }),
  zoomBy: (factor) => set((state) => ({
    zoomLevel: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoomLevel * factor))
  })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setDraggingRef: (draggingRef) => set({ draggingRef }),
  reset: () => set({ playheadMs: ZERO_MS, zoomLevel: 1, isPlaying: false, draggingRef: null })
}));
function t$1(key) {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}
function deleteSelected() {
  const state = useEditorStore.getState();
  const refs = state.selection.elements;
  if (refs.length === 0 || !state.project) return;
  state.execute(removeElementsCommand(refs, t$1("autoEdit.delete")), {
    elements: [],
    keyframes: []
  });
}
function splitSelected() {
  const state = useEditorStore.getState();
  if (!state.project || state.selection.elements.length === 0) return;
  const playheadMs = useTimelineViewStore.getState().playheadMs;
  for (const ref of state.selection.elements) {
    state.execute(splitElementCommand(ref, playheadMs, t$1("autoEdit.split")));
  }
}
function duplicateSelected() {
  const state = useEditorStore.getState();
  const refs = state.selection.elements;
  if (refs.length === 0 || !state.project) return;
  const { command, refs: copies } = duplicateElementsCommand(refs, t$1("autoEdit.duplicate"));
  state.execute(command, { elements: copies, keyframes: [] });
}
function useEditorShortcuts() {
  reactExports.useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName;
      const editable = target?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) useEditorStore.getState().redo();
        else useEditorStore.getState().undo();
        return;
      }
      if (mod && key === "y") {
        event.preventDefault();
        useEditorStore.getState().redo();
        return;
      }
      if (mod && key === "s") {
        event.preventDefault();
        void saveProject();
        return;
      }
      if (mod && key === "o") {
        event.preventDefault();
        void loadProject();
        return;
      }
      if (mod && key === "n") {
        event.preventDefault();
        newProject();
        return;
      }
      if (mod && key === "d") {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (editable) return;
      if (event.key === " ") {
        event.preventDefault();
        const store = useTimelineViewStore.getState();
        store.setPlaying(!store.isPlaying);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (key === "s") {
        event.preventDefault();
        splitSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
function getSceneElements(tracks) {
  const result = [];
  for (const track of allTracks(tracks)) {
    for (const element of track.elements) result.push(element);
  }
  return result;
}
function getElementEndTime(element) {
  return element.startTime + element.duration;
}
function getProjectDurationMs(project, minMs = 0) {
  const scene = getScene(project);
  let max = minMs;
  for (const element of getSceneElements(scene.tracks)) {
    max = Math.max(max, getElementEndTime(element));
  }
  return max;
}
function num$2(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function getElementTransform(params) {
  return {
    positionX: num$2(params["transform.positionX"], 0),
    positionY: num$2(params["transform.positionY"], 0),
    scaleX: num$2(params["transform.scaleX"], 1),
    scaleY: num$2(params["transform.scaleY"], 1),
    rotate: num$2(params["transform.rotate"], 0),
    opacity: num$2(params["opacity"], 1),
    blendMode: typeof params["blendMode"] === "string" ? params["blendMode"] : "normal"
  };
}
function resolveElementRect(transform, canvas, naturalWidth, naturalHeight) {
  return {
    centerX: canvas.width / 2 + transform.positionX,
    centerY: canvas.height / 2 + transform.positionY,
    width: naturalWidth * transform.scaleX,
    height: naturalHeight * transform.scaleY
  };
}
function getMediaFit(params) {
  const value = params["transform.fit"];
  return value === "cover" || value === "stretch" ? value : "contain";
}
function fitSize(fit, iw, ih, cw, ch) {
  if (iw <= 0 || ih <= 0) return { width: cw, height: ch };
  if (fit === "stretch") return { width: cw, height: ch };
  const scale = fit === "cover" ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
  return { width: iw * scale, height: ih * scale };
}
function buildRenderPlan(project) {
  const scene = getScene(project);
  const tracks = scene.tracks;
  const canvas = project.settings.canvasSize;
  const fps = frameRateToFloat(project.settings.fps);
  const durationMs = Math.max(1e3, getProjectDurationMs(project));
  const backgroundColor = project.settings.background.type === "color" ? hexToFfmpegColor(project.settings.background.color) : "0x000000";
  const visual = [];
  const audio = [];
  const visibleOverlays = tracks.overlay.filter((t2) => !t2.hidden);
  const visualTracks = [
    ...tracks.main.hidden ? [] : [tracks.main],
    ...visibleOverlays.slice().reverse()
  ];
  for (const track of visualTracks) {
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
    let prevMediaEl = null;
    let prevMediaIndex = -1;
    const linkTransition = (from, to) => {
      const tr = from.transitionToNext;
      if (!tr || tr.type === "none" || prevMediaIndex < 0) return;
      const dSec = Math.max(0, Math.min(tr.durationMs, from.duration, to.duration)) / 1e3;
      if (dSec <= 0) return;
      const layer = visual[prevMediaIndex];
      if (layer && (layer.kind === "video" || layer.kind === "image")) {
        visual[prevMediaIndex] = {
          ...layer,
          transitionToNext: { xfade: xfadeName(tr.type), durationSec: dSec }
        };
      }
    };
    for (const el of sorted) {
      if (el.hidden) continue;
      if (el.type === "video") {
        const layer = videoLayer(el);
        if (layer) {
          if (prevMediaEl) linkTransition(prevMediaEl, el);
          prevMediaIndex = visual.length;
          prevMediaEl = el;
          visual.push(layer);
        }
        if (el.isSourceAudioEnabled !== false && track.type === "video" && !track.muted) {
          const a = audioOf(el, el.mediaPath);
          if (a) audio.push(a);
        }
      } else if (el.type === "image") {
        const layer = imageLayer(el);
        if (layer) {
          if (prevMediaEl) linkTransition(prevMediaEl, el);
          prevMediaIndex = visual.length;
          prevMediaEl = el;
          visual.push(layer);
        }
      } else if (el.type === "text") {
        visual.push(textSpec(el));
      }
    }
  }
  for (const track of tracks.audio) {
    if (track.muted) continue;
    for (const el of track.elements) {
      if (el.sourceType !== "upload" || !el.mediaPath) continue;
      const a = audioOf(el, el.mediaPath);
      if (a) audio.push(a);
    }
  }
  const sceneEffects = [];
  for (const track of tracks.overlay) {
    if (track.type !== "effect" || track.hidden) continue;
    for (const el of track.elements) {
      if (el.hidden || el.duration <= 0) continue;
      sceneEffects.push({
        type: el.effectType,
        startSec: el.startTime / 1e3,
        durSec: el.duration / 1e3,
        blurSigma: el.effectType === "blur" ? blurIntensityToPx(num$1(el.params.intensity, 0)) / 2 : 0
      });
    }
  }
  return {
    width: canvas.width,
    height: canvas.height,
    fps,
    backgroundColor,
    durationSec: durationMs / 1e3,
    visual,
    audio,
    sceneEffects
  };
}
function finalizePlan(draft, textDataUrls) {
  let textIndex = 0;
  const visual = draft.visual.map((layer) => {
    if (isTextSpec(layer)) {
      const pngDataUrl = textDataUrls[textIndex++];
      return {
        kind: "text",
        pngDataUrl,
        startSec: layer.startSec,
        durSec: layer.durSec,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        rotateDeg: layer.rotateDeg,
        posX: layer.posX,
        posY: layer.posY,
        opacity: layer.opacity,
        blurSigma: layer.blurSigma,
        blendMode: layer.blendMode
      };
    }
    return layer;
  });
  return {
    width: draft.width,
    height: draft.height,
    fps: draft.fps,
    backgroundColor: draft.backgroundColor,
    durationSec: draft.durationSec,
    visual,
    audio: draft.audio,
    sceneEffects: draft.sceneEffects
  };
}
function isTextSpec(layer) {
  return !("kind" in layer);
}
function num$1(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function resolveSourceDuration(el, rate) {
  if (el.sourceDuration != null && el.sourceDuration > 0) return el.sourceDuration;
  return el.duration * rate + el.trimStart + el.trimEnd;
}
function blurSigmaOf(el) {
  const intensity = (el.effects ?? []).filter((e) => e.enabled && e.type === "blur").reduce((m, e) => Math.max(m, num$1(e.params.intensity, 0)), 0);
  return blurIntensityToPx(intensity) / 2;
}
function videoLayer(el) {
  const params = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(params);
  const rate = el.retime?.rate ?? 1;
  const sourceDurationMs = resolveSourceDuration(el, rate);
  const trimmedMs = sourceDurationMs - el.trimStart - el.trimEnd;
  if (!el.mediaPath || trimmedMs <= 0 || el.duration <= 0) return null;
  return {
    kind: "video",
    path: el.mediaPath,
    trimStartSec: el.trimStart / 1e3,
    srcDurSec: trimmedMs / 1e3,
    rate,
    fit: getMediaFit(params),
    motionEffect: el.motionEffect ?? "none",
    startSec: el.startTime / 1e3,
    durSec: el.duration / 1e3,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode
  };
}
function imageLayer(el) {
  const params = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(params);
  if (!el.mediaPath || el.duration <= 0) return null;
  return {
    kind: "image",
    path: el.mediaPath,
    trimStartSec: 0,
    srcDurSec: el.duration / 1e3,
    rate: 1,
    fit: getMediaFit(params),
    motionEffect: el.motionEffect ?? "none",
    startSec: el.startTime / 1e3,
    durSec: el.duration / 1e3,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode
  };
}
function textSpec(el) {
  const p = resolveAnimatedParams(el.params, el.animations, 0);
  const transform = getElementTransform(p);
  return {
    content: typeof p.content === "string" ? p.content : "",
    fontSize: num$1(p.fontSize, 96),
    color: typeof p.color === "string" ? p.color : "#ffffff",
    fontFamily: typeof p.fontFamily === "string" ? p.fontFamily : "Arial",
    fontWeight: typeof p.fontWeight === "string" ? p.fontWeight : "normal",
    fontStyle: typeof p.fontStyle === "string" ? p.fontStyle : "normal",
    textAlign: typeof p.textAlign === "string" ? p.textAlign : "center",
    startSec: el.startTime / 1e3,
    durSec: el.duration / 1e3,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotateDeg: transform.rotate,
    posX: transform.positionX,
    posY: transform.positionY,
    opacity: transform.opacity,
    blurSigma: blurSigmaOf(el),
    blendMode: transform.blendMode
  };
}
function audioOf(el, path) {
  const rate = el.retime?.rate ?? 1;
  const sourceDurationMs = resolveSourceDuration(el, rate);
  const trimmedMs = sourceDurationMs - el.trimStart - el.trimEnd;
  if (!path || trimmedMs <= 0 || el.duration <= 0) return null;
  return {
    path,
    trimStartSec: el.trimStart / 1e3,
    srcDurSec: trimmedMs / 1e3,
    rate,
    startMs: el.startTime,
    volume: elementVolume(el)
  };
}
function elementVolume(el) {
  if (el.params.muted === true) return 0;
  const db = typeof el.params.volume === "number" ? el.params.volume : 0;
  const clamped = Math.min(20, Math.max(-60, db));
  return Math.pow(10, clamped / 20);
}
function hexToFfmpegColor(hex) {
  const m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex.trim());
  if (!m) return "0x000000";
  return `0x${m[1]}`;
}
async function rasterizeTextLayer(spec) {
  const fontSize = spec.fontSize || 96;
  const fontWeight = spec.fontWeight || "normal";
  const fontStyle = spec.fontStyle || "normal";
  const font = `${fontStyle !== "normal" ? fontStyle + " " : ""}${fontWeight} ${fontSize}px ${spec.fontFamily || "Arial"}`;
  const content = spec.content ?? "";
  const lines = content.length ? content.split("\n") : [""];
  const lineHeight = Math.max(1, Math.round(fontSize * 1.2));
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas 2D is not available");
  measure.font = font;
  const widths = lines.map((line) => measure.measureText(line || " ").width);
  const textWidth = Math.max(1, ...widths);
  const padX = Math.ceil(fontSize * 0.06);
  const padY = Math.ceil(fontSize * 0.12);
  const width = Math.ceil(textWidth) + padX * 2;
  const height = lines.length * lineHeight + padY * 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.font = font;
  ctx.fillStyle = spec.color || "#ffffff";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    const w = widths[i];
    const x = spec.textAlign === "center" ? padX + (textWidth - w) / 2 : spec.textAlign === "right" ? padX + (textWidth - w) : padX;
    ctx.fillText(line || " ", x, padY + i * lineHeight);
  });
  return canvas.toDataURL("image/png");
}
const initial = {
  status: "idle",
  percent: 0,
  message: null,
  outputPath: null,
  error: null,
  jobId: null
};
const useRenderStore = create()((set) => ({
  ...initial,
  start: (jobId) => set({ status: "preparing", percent: 0, message: null, outputPath: null, error: null, jobId }),
  setProgress: (percent) => set({ status: "rendering", percent: Math.max(0, Math.min(100, percent)) }),
  finish: (outputPath) => set({ status: "done", percent: 100, outputPath, error: null }),
  fail: (error) => set({ status: "error", error }),
  reset: () => set({ ...initial })
}));
function t(key) {
  return translate(useUIPreferencesStore.getState().uiLanguage, key);
}
const DEFAULT_EXPORT_SETTINGS = {
  codec: "libx264",
  crf: 18,
  resolution: "canvas"
};
function even(n) {
  return Math.max(2, Math.round(n / 2) * 2);
}
function buildExportOptions(settings, canvasW, canvasH) {
  const options = { codec: settings.codec, crf: settings.crf };
  const short = settings.resolution === "720p" ? 720 : settings.resolution === "1080p" ? 1080 : settings.resolution === "1440p" ? 1440 : settings.resolution === "2160p" ? 2160 : null;
  if (short != null) {
    const scale = short / Math.min(canvasW, canvasH);
    options.outputWidth = even(canvasW * scale);
    options.outputHeight = even(canvasH * scale);
  }
  return options;
}
let unsubscribe = null;
function listenToEvents() {
  const runtime = window.editorRenderRuntime;
  if (!runtime?.onEvent) return;
  if (unsubscribe) return;
  unsubscribe = runtime.onEvent((event) => {
    const store = useRenderStore.getState();
    if (event.type === "progress" && event.percent != null) {
      store.setProgress(event.percent);
    } else if (event.type === "log") {
      store.setProgress(store.percent);
    }
  });
}
async function exportAutoEditVideo(settings = DEFAULT_EXPORT_SETTINGS) {
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
    const hasContent = draft.visual.length > 0 || draft.audio.length > 0;
    if (!hasContent) {
      toast.error(t("autoEdit.export.noContent"));
      store.fail("empty");
      return;
    }
    const textPngs = await Promise.all(
      draft.visual.filter(isTextSpec).map((s) => rasterizeTextLayer(s))
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
      project.settings.canvasSize.height
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
function ExportButton() {
  const { t: t2 } = useI18n();
  const renderStatus = useRenderStore((s) => s.status);
  const renderPercent = useRenderStore((s) => s.percent);
  const rendering = renderStatus === "preparing" || renderStatus === "rendering";
  const [settings, setSettings] = reactExports.useState(DEFAULT_EXPORT_SETTINGS);
  const run = () => void exportAutoEditVideo(settings);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        disabled: rendering,
        className: cn(
          "flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-70"
        ),
        children: rendering ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
          Math.round(renderPercent),
          "%"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-4" }),
          t2("autoEdit.export")
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "end", className: "w-64 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: t2("autoEdit.export") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "export-resolution", className: "text-xs text-muted-foreground", children: t2("autoEdit.export.resolution") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: settings.resolution,
            onValueChange: (v) => setSettings((s) => ({ ...s, resolution: v })),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "export-resolution", className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "canvas", children: t2("autoEdit.export.canvas") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "720p", children: "720p" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "1080p", children: "1080p" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "1440p", children: "1440p" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2160p", children: "2160p (4K)" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "export-codec", className: "text-xs text-muted-foreground", children: t2("autoEdit.export.codec") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: settings.codec,
            onValueChange: (v) => setSettings((s) => ({ ...s, codec: v })),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "export-codec", className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "libx264", children: "H.264 (libx264)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "libx265", children: "H.265 (libx265)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "h264_nvenc", children: "H.264 (NVENC)" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "export-crf", className: "text-xs text-muted-foreground", children: t2("autoEdit.export.quality") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "export-crf",
            type: "number",
            min: 0,
            max: 51,
            step: 1,
            value: settings.crf,
            onChange: (e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setSettings((s) => ({ ...s, crf: n }));
            },
            className: "h-8 text-xs"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          className: "h-8 w-full",
          onClick: run,
          disabled: rendering,
          children: [
            rendering ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-4" }),
            t2("autoEdit.render")
          ]
        }
      )
    ] })
  ] });
}
function EditorHeader() {
  const { t: t2 } = useI18n();
  const projectName = useEditorStore((s) => s.project?.metadata.name ?? null);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const setView = useAutoEditViewStore((s) => s.setView);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-panel px-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setView("dashboard"),
        "aria-label": t2("autoEdit.dashboard.back"),
        title: t2("autoEdit.dashboard.back"),
        className: "flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-3.5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: projectName ?? t2("autoEdit.title") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-1 h-5 w-px bg-border" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-2 flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: undo,
          disabled: !canUndo,
          "aria-label": t2("autoEdit.undo"),
          className: "size-7 text-muted-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { className: "size-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: redo,
          disabled: !canRedo,
          "aria-label": t2("autoEdit.redo"),
          className: "size-7 text-muted-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Redo2, { className: "size-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          type: "button",
          onClick: newProject,
          "aria-label": t2("autoEdit.newProject"),
          title: t2("autoEdit.newProject"),
          className: "text-muted-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlusCorner, { className: "size-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden lg:inline", children: t2("autoEdit.newProject") })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => void loadProject(),
          "aria-label": t2("autoEdit.openProject"),
          title: t2("autoEdit.openProject"),
          className: "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden lg:inline", children: t2("autoEdit.openProject") })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => void saveProject(),
          "aria-label": t2("autoEdit.saveProject"),
          title: t2("autoEdit.saveProject"),
          className: "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden lg:inline", children: t2("autoEdit.saveProject") })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExportButton, {})
  ] });
}
const DND_MEDIA = "application/x-autoedit-media";
const DND_EFFECT = "application/x-autoedit-effect";
const DND_MOTION = "application/x-autoedit-motion";
const DND_TRANSITION = "application/x-autoedit-transition";
function dragPayloadKind(dataTransfer) {
  if (!dataTransfer) return null;
  const types = Array.from(dataTransfer.types);
  if (types.includes(DND_EFFECT)) return "effect";
  if (types.includes(DND_MOTION)) return "motion";
  if (types.includes(DND_TRANSITION)) return "transition";
  if (types.includes(DND_MEDIA)) return "media";
  if (types.includes("Files")) return "files";
  return null;
}
function targetsExistingClip(kind) {
  return kind === "effect" || kind === "motion" || kind === "transition";
}
function setEffectDrag(dataTransfer, effectType) {
  dataTransfer.setData(DND_EFFECT, effectType);
  dataTransfer.effectAllowed = "copy";
}
function setMotionDrag(dataTransfer, motion) {
  dataTransfer.setData(DND_MOTION, motion);
  dataTransfer.effectAllowed = "copy";
}
function setTransitionDrag(dataTransfer, transition) {
  dataTransfer.setData(DND_TRANSITION, transition);
  dataTransfer.effectAllowed = "copy";
}
const MOTION_EFFECTS = [
  { type: "none", label: "None" },
  { type: "zoom_in", label: "Zoom in" },
  { type: "zoom_out", label: "Zoom out" },
  { type: "pan_left", label: "Pan left" },
  { type: "pan_right", label: "Pan right" },
  { type: "pan_up", label: "Pan up" },
  { type: "pan_down", label: "Pan down" },
  { type: "zoom_pan_left", label: "Zoom + pan left" },
  { type: "zoom_pan_right", label: "Zoom + pan right" }
];
function motionEffectLabel(type) {
  return MOTION_EFFECTS.find((m) => m.type === type)?.label ?? "None";
}
const PAN_ZOOM = 1.12;
const ZOOM_PAN_START = 1.08;
const ZOOM_PAN_END = 1.14;
function resolveMotionTransform(effect, p) {
  const t2 = Math.max(0, Math.min(1, p));
  let z = 1;
  let cx = 0.5;
  let cy = 0.5;
  switch (effect) {
    case "none":
    case void 0:
      break;
    case "zoom_in":
      z = 1 + 0.12 * t2;
      break;
    case "zoom_out":
      z = 1.12 - 0.12 * t2;
      break;
    case "pan_left":
      z = PAN_ZOOM;
      cx = (1 - 1 / z) * (1 - t2) + 1 / (2 * z);
      break;
    case "pan_right":
      z = PAN_ZOOM;
      cx = (1 - 1 / z) * t2 + 1 / (2 * z);
      break;
    case "pan_up":
      z = PAN_ZOOM;
      cy = (1 - 1 / z) * (1 - t2) + 1 / (2 * z);
      break;
    case "pan_down":
      z = PAN_ZOOM;
      cy = (1 - 1 / z) * t2 + 1 / (2 * z);
      break;
    case "zoom_pan_left":
      z = ZOOM_PAN_START + (ZOOM_PAN_END - ZOOM_PAN_START) * t2;
      cx = (1 - 1 / z) * (1 - t2) + 1 / (2 * z);
      break;
    case "zoom_pan_right":
      z = ZOOM_PAN_START + (ZOOM_PAN_END - ZOOM_PAN_START) * t2;
      cx = (1 - 1 / z) * t2 + 1 / (2 * z);
      break;
  }
  return { scale: z, originX: cx, originY: cy };
}
const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color_dodge",
  "color_burn",
  "hard_light",
  "soft_light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "add"
];
const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Impact",
  "Trebuchet MS"
];
const num = (key, label, min, max, step, dflt, shortLabel) => ({
  key,
  label,
  shortLabel,
  type: "number",
  default: dflt,
  min,
  max,
  step
});
const POSITION_X = num("transform.positionX", "Position X", -4e3, 4e3, 1, 0, "X");
const POSITION_Y = num("transform.positionY", "Position Y", -4e3, 4e3, 1, 0, "Y");
const SCALE_X = num("transform.scaleX", "Scale X", 0.01, 20, 0.01, 1, "W");
const SCALE_Y = num("transform.scaleY", "Scale Y", 0.01, 20, 0.01, 1, "H");
const ROTATE = num("transform.rotate", "Rotation", -360, 360, 1, 0, "Rot");
const FIT = {
  key: "transform.fit",
  label: "Fit",
  type: "select",
  default: "contain",
  options: [
    { value: "contain", label: "Fit" },
    { value: "cover", label: "Fill" },
    { value: "stretch", label: "Stretch" }
  ]
};
const OPACITY = num("opacity", "Opacity", 0, 1, 0.01, 1);
const VOLUME = num("volume", "Volume (dB)", -60, 20, 1, 0);
const BLEND_MODE = {
  key: "blendMode",
  label: "Blend mode",
  type: "select",
  default: "normal",
  options: BLEND_MODES.map((m) => ({ value: m, label: m.replace(/_/g, " ") }))
};
const CONTENT = {
  key: "content",
  label: "Text",
  type: "text",
  default: ""
};
const FONT_SIZE = num("fontSize", "Font size", 8, 500, 1, 96);
const COLOR = { key: "color", label: "Color", type: "color", default: "#ffffff" };
const FONT_FAMILY = {
  key: "fontFamily",
  label: "Font",
  type: "font",
  default: "Arial"
};
const FONT_WEIGHT = {
  key: "fontWeight",
  label: "Weight",
  type: "select",
  default: "normal",
  options: [
    { value: "normal", label: "Normal" },
    { value: "bold", label: "Bold" }
  ]
};
const FONT_STYLE = {
  key: "fontStyle",
  label: "Style",
  type: "select",
  default: "normal",
  options: [
    { value: "normal", label: "Normal" },
    { value: "italic", label: "Italic" }
  ]
};
const TEXT_ALIGN = {
  key: "textAlign",
  label: "Align",
  type: "select",
  default: "center",
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" }
  ]
};
const TRANSFORM_GROUP = {
  params: [POSITION_X, POSITION_Y, SCALE_X, SCALE_Y, ROTATE]
};
const BLENDING_GROUP = {
  id: "blending",
  label: "Blending",
  params: [OPACITY, BLEND_MODE]
};
const TEXT_GROUP = {
  id: "text",
  label: "Text",
  params: [CONTENT, FONT_SIZE, FONT_FAMILY, FONT_WEIGHT, FONT_STYLE, COLOR, TEXT_ALIGN]
};
const AUDIO_GROUP = {
  id: "audio",
  label: "Audio",
  params: [VOLUME]
};
function isVisualElement(element) {
  return element.type === "video" || element.type === "image" || element.type === "text";
}
function getPropertyGroups(element) {
  const groups = [];
  if (element.type === "text") groups.push(TEXT_GROUP);
  if (isVisualElement(element)) {
    const isMedia = element.type === "video" || element.type === "image";
    groups.push({
      id: "transform",
      label: "Transform",
      // Fit only applies to media (text is rasterized at its intrinsic size).
      params: isMedia ? [FIT, ...TRANSFORM_GROUP.params] : TRANSFORM_GROUP.params
    });
    groups.push(BLENDING_GROUP);
  }
  if (element.type === "audio" || element.type === "video") groups.push(AUDIO_GROUP);
  return groups;
}
function isRetimable(element) {
  return element.type === "video" || element.type === "audio";
}
const AUDIO_EXTS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const VIDEO_EXTS = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".ts"];
function kindFromName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  return null;
}
async function pickedFromDroppedFiles(files) {
  const runtime = window.autoEditRuntime;
  if (!runtime || files.length === 0) return [];
  const picked = [];
  const paths = [];
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
function hasNoVisualElements(project) {
  const tracks = getScene(project).tracks;
  const mainHasMedia = tracks.main.elements.some((e) => e.type === "video" || e.type === "image");
  const overlayHasMedia = tracks.overlay.some(
    (t2) => t2.elements.some((e) => e.type === "video" || e.type === "image")
  );
  return !mainHasMedia && !overlayHasMedia;
}
async function importMediaFiles(files, opts) {
  const store = useEditorStore.getState();
  const project = store.project;
  if (project && hasNoVisualElements(project)) {
    const firstVisual = files.find((f) => f.kind !== "audio");
    if (firstVisual) {
      const { dimensions } = await window.ffmpegRuntime?.probeDimensions(firstVisual.path) ?? {};
      if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
        store.execute(updateCanvasSizeCommand(dimensions.width, dimensions.height));
      }
    }
  }
  for (const file of files) {
    let durationMs = 5e3;
    if (file.kind !== "image") {
      try {
        const { durationSec } = await window.ffmpegRuntime?.probeDuration(file.path) ?? {};
        if (durationSec != null && Number.isFinite(durationSec)) {
          durationMs = Math.max(1, Math.round(durationSec * 1e3));
        }
      } catch {
      }
    }
    store.registerMediaAsset({
      path: file.path,
      name: file.name,
      kind: file.kind,
      previewUrl: file.previewUrl,
      durationMs
    });
    const startTime = Math.max(0, Math.round(opts?.startMs ?? 0));
    const element = file.kind === "video" ? createVideoElement({ mediaPath: file.path, name: file.name, duration: durationMs, startTime }) : file.kind === "image" ? createImageElement({ mediaPath: file.path, name: file.name, duration: 5e3, startTime }) : createAudioElement({ mediaPath: file.path, name: file.name, duration: durationMs, startTime });
    store.execute(
      addElementToTrackOfTypeCommand(
        element,
        file.kind === "audio" ? "audio" : "video",
        file.name,
        opts?.trackId
      )
    );
  }
}
const DEFAULT_SHOT_MS = 5e3;
function basename(pathOrName) {
  const cleaned = pathOrName.replace(/\\/g, "/");
  return cleaned.slice(cleaned.lastIndexOf("/") + 1);
}
function isAbsolutePath(value) {
  return value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value);
}
function resolvePath(reference, byBasename) {
  const trimmed = reference.trim();
  if (!trimmed) return null;
  if (isAbsolutePath(trimmed)) return trimmed;
  return byBasename.get(basename(trimmed).toLowerCase()) ?? null;
}
async function probeDurationMs(path) {
  try {
    const result = await window.ffmpegRuntime?.probeDuration(path);
    const seconds = result?.durationSec;
    if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.round(seconds * 1e3);
  } catch {
    return null;
  }
}
async function buildTimelineFromRows(rows, onProgress) {
  const store = useEditorStore.getState();
  const runtime = window.autoEditRuntime;
  const byBasename = /* @__PURE__ */ new Map();
  for (const asset of Object.values(store.mediaAssets)) {
    byBasename.set(basename(asset.path).toLowerCase(), asset.path);
  }
  const shots = [];
  const missing = [];
  const newPaths = [];
  for (const [index, row] of rows.entries()) {
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
    const voiceMs = voicePath ? await probeDurationMs(voicePath) : null;
    const mediaMs = kind === "video" ? await probeDurationMs(mediaPath) : null;
    const duration = row.durationMs ?? voiceMs ?? mediaMs ?? DEFAULT_SHOT_MS;
    if (!store.mediaAssets[mediaPath]) newPaths.push(mediaPath);
    if (voicePath && !store.mediaAssets[voicePath]) newPaths.push(voicePath);
    shots.push({
      mediaPath,
      kind,
      name: basename(mediaPath),
      duration,
      // A video shorter than its slot would freeze on its last frame; cap instead.
      sourceDurationMs: mediaMs ?? void 0,
      voicePath: voicePath ?? void 0,
      voiceDurationMs: voiceMs ?? void 0,
      motionEffect: row.motion,
      transition: row.transition
    });
  }
  if (shots.length === 0) return { shots: 0, missing };
  const previews = runtime ? await runtime.registerMediaPaths(newPaths) : {};
  for (const shot of shots) {
    if (!store.mediaAssets[shot.mediaPath]) {
      store.registerMediaAsset({
        path: shot.mediaPath,
        name: shot.name,
        kind: shot.kind,
        previewUrl: previews[shot.mediaPath] ?? "",
        durationMs: shot.sourceDurationMs ?? shot.duration
      });
    }
    if (shot.voicePath && !store.mediaAssets[shot.voicePath]) {
      store.registerMediaAsset({
        path: shot.voicePath,
        name: basename(shot.voicePath),
        kind: "audio",
        previewUrl: previews[shot.voicePath] ?? "",
        durationMs: shot.voiceDurationMs ?? shot.duration
      });
    }
  }
  useEditorStore.getState().execute(buildAutoTimelineCommand(shots));
  return { shots: shots.length, missing };
}
function normalizeKey(raw) {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]/g, "");
}
const VIDEO_KEYS = ["video", "videopath", "videofile", "clip", "clippath", "movie"];
const IMAGE_KEYS = [
  "image",
  "imagepath",
  "imagefile",
  "img",
  "imgpath",
  "anh",
  "diranh",
  "duonganh",
  "hinh",
  "hinhanh",
  "picture",
  "photo"
];
const MEDIA_KEYS = ["media", "mediapath", "file", "filepath", "path", "src", "source", "dir"];
const VOICE_KEYS = [
  "voice",
  "voicepath",
  "voicefile",
  "voiceover",
  "audio",
  "audiopath",
  "narration",
  "tts",
  "giong",
  "giongdoc",
  "amthanh",
  "loithoai"
];
const MOTION_KEYS = [
  "effect",
  "effects",
  "motion",
  "motioneffect",
  "mediaeffect",
  "hieuung",
  "chuyendong",
  "kenburns"
];
const TRANSITION_KEYS = [
  "transition",
  "transitions",
  "transitiontonext",
  "chuyencanh",
  "chuyentiep"
];
const DURATION_KEYS = [
  "duration",
  "durationms",
  "length",
  "lengthms",
  "thoiluong",
  "dodai"
];
function pick(record, keys) {
  for (const key of keys) {
    const value = record.get(key);
    if (value != null && value.trim() !== "") return value.trim();
  }
  return void 0;
}
const MOTION_BY_KEY = new Map(MOTION_EFFECTS.map((m) => [normalizeKey(m.type), m.type]));
for (const m of MOTION_EFFECTS) MOTION_BY_KEY.set(normalizeKey(m.label), m.type);
const TRANSITION_BY_KEY = new Map(TRANSITIONS.map((t2) => [normalizeKey(t2.type), t2.type]));
for (const t2 of TRANSITIONS) TRANSITION_BY_KEY.set(normalizeKey(t2.label), t2.type);
function parseMotion(value) {
  if (!value) return void 0;
  return MOTION_BY_KEY.get(normalizeKey(value));
}
function parseTransition(value) {
  if (!value) return void 0;
  return TRANSITION_BY_KEY.get(normalizeKey(value));
}
function parseDurationMs(value) {
  if (!value) return void 0;
  const match = /^\s*([0-9]*\.?[0-9]+)\s*(ms|s|sec|secs|giay)?\s*$/i.exec(value);
  if (!match) return void 0;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return void 0;
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "ms") return Math.round(amount);
  if (unit) return Math.round(amount * 1e3);
  return amount >= 1e3 ? Math.round(amount) : Math.round(amount * 1e3);
}
function rowFromRecord(record) {
  const media = pick(record, VIDEO_KEYS) ?? pick(record, IMAGE_KEYS) ?? pick(record, MEDIA_KEYS);
  if (!media) return null;
  return {
    media,
    voice: pick(record, VOICE_KEYS),
    motion: parseMotion(pick(record, MOTION_KEYS)),
    transition: parseTransition(pick(record, TRANSITION_KEYS)),
    durationMs: parseDurationMs(pick(record, DURATION_KEYS))
  };
}
function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}
function parseCsv(text) {
  const delimiter = text.includes("	") && !text.includes(",") ? "	" : ",";
  const table = parseDelimited(text, delimiter);
  if (table.length < 2) {
    return { rows: [], skipped: 0, warnings: ["csvNeedsHeader"] };
  }
  const header = table[0].map(normalizeKey);
  const rows = [];
  let skipped = 0;
  for (const line of table.slice(1)) {
    const record = /* @__PURE__ */ new Map();
    header.forEach((key, index) => {
      if (key) record.set(key, line[index] ?? "");
    });
    const row = rowFromRecord(record);
    if (row) rows.push(row);
    else skipped++;
  }
  return { rows, skipped, warnings: [] };
}
const ARRAY_KEYS = ["shots", "rows", "items", "segments", "scenes", "clips", "data", "list"];
function jsonArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const record = parsed;
    for (const key of ARRAY_KEYS) {
      if (Array.isArray(record[key])) return record[key];
    }
    for (const value of Object.values(record)) {
      if (Array.isArray(value)) return value;
    }
  }
  return null;
}
function parseJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], skipped: 0, warnings: ["jsonInvalid"] };
  }
  const array = jsonArray(parsed);
  if (!array) return { rows: [], skipped: 0, warnings: ["jsonNoArray"] };
  const rows = [];
  let skipped = 0;
  for (const entry of array) {
    if (!entry || typeof entry !== "object") {
      skipped++;
      continue;
    }
    const record = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(entry)) {
      if (value == null) continue;
      if (typeof value === "object") continue;
      record.set(normalizeKey(key), String(value));
    }
    const row = rowFromRecord(record);
    if (row) rows.push(row);
    else skipped++;
  }
  return { rows, skipped, warnings: [] };
}
function parseAutoRows(text, fileName) {
  const looksJson = /\.json$/i.test(fileName) || /^\s*[[{]/.test(text);
  return looksJson ? parseJson(text) : parseCsv(text);
}
const TIMESTAMP_RE = /(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{1,3})/;
function parseSrt(input) {
  const normalized = input.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  const blocks = normalized.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length < 2) continue;
    const tsIndex = TIMESTAMP_RE.test(lines[0]) ? 0 : 1;
    const tsLine = lines[tsIndex];
    if (!tsLine) continue;
    const match = tsLine.match(TIMESTAMP_RE);
    if (!match) continue;
    const text = lines.slice(tsIndex + 1).join("\n").trim();
    if (!text) continue;
    const start = parseTimestamp(match[1]);
    const end = parseTimestamp(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start <= 0) continue;
    cues.push({ text, startTime: start, duration: end - start });
  }
  return cues;
}
function parseTimestamp(input) {
  const normalized = input.trim().replace(",", ".");
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/);
  if (!match) return Number.NaN;
  const [, hours, minutes, seconds, milliseconds] = match;
  return (Number.parseInt(hours, 10) * 3600 + Number.parseInt(minutes, 10) * 60 + Number.parseInt(seconds, 10)) * 1e3 + Number.parseInt(milliseconds.padEnd(3, "0"), 10);
}
const FONT_SIZE_SCALE_REFERENCE = 90;
const SUBTITLE_FONT_SIZE = 5;
const SUBTITLE_MAX_WIDTH_RATIO = 0.8;
const SUBTITLE_BOTTOM_MARGIN_RATIO = 0.05;
const GLYPH_ASPECT_RATIO = 0.55;
function buildSubtitleTextElement({
  index,
  caption,
  canvasSize
}) {
  const fontSize = Math.round(
    canvasSize.height * (SUBTITLE_FONT_SIZE / FONT_SIZE_SCALE_REFERENCE)
  );
  const maxCharsPerLine = Math.max(
    8,
    Math.floor(canvasSize.width * SUBTITLE_MAX_WIDTH_RATIO / (fontSize * GLYPH_ASPECT_RATIO))
  );
  const positionY = Math.round(
    canvasSize.height / 2 - canvasSize.height * SUBTITLE_BOTTOM_MARGIN_RATIO - fontSize * 1.2 / 2
  );
  return createTextElement({
    name: `Caption ${index + 1}`,
    startTime: caption.startTime,
    duration: caption.duration,
    params: {
      content: wrapSubtitleText(caption.text, maxCharsPerLine),
      fontSize,
      fontFamily: "Arial",
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "bold",
      fontStyle: "normal",
      "transform.positionX": 0,
      "transform.positionY": positionY
    }
  });
}
function wrapSubtitleText(text, maxCharsPerLine) {
  const paragraphs = text.trim().replace(/\r\n/g, "\n").split("\n");
  const wrapped = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    if (!words[0]) {
      wrapped.push("");
      continue;
    }
    let line = words[0];
    const lines = [];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${line} ${words[i]}`;
      if (next.length <= maxCharsPerLine) {
        line = next;
        continue;
      }
      lines.push(line);
      line = words[i];
    }
    lines.push(line);
    wrapped.push(lines.join("\n"));
  }
  return wrapped.join("\n");
}
function buildCaptionsCommand(captions, canvasSize, label = "Add captions") {
  const track = createTextTrack({ name: "Captions" });
  const elements = captions.map(
    (caption, index) => buildSubtitleTextElement({ index, caption, canvasSize })
  );
  return {
    id: newId("cmd"),
    label: captions.length > 1 ? `${label} (${captions.length})` : label,
    apply: (project) => {
      let next = updateTracks(
        project,
        project.currentSceneId,
        (tracks) => appendTrack(tracks, track)
      );
      for (const element of elements) {
        next = updateTracks(
          next,
          next.currentSceneId,
          (tracks) => insertElement(tracks, track.id, element)
        );
      }
      return next;
    }
  };
}
const usePanelStore = create()(
  persist(
    (set) => ({
      assetsTab: "media",
      propertiesTab: "transform",
      isAssetsPanelOpen: true,
      isPropertiesPanelOpen: true,
      inspectedElementId: null,
      setAssetsTab: (assetsTab) => set({ assetsTab }),
      setPropertiesTab: (propertiesTab) => set({ propertiesTab }),
      setAssetsPanelOpen: (isAssetsPanelOpen) => set({ isAssetsPanelOpen }),
      setPropertiesPanelOpen: (isPropertiesPanelOpen) => set({ isPropertiesPanelOpen }),
      setInspectedElementId: (inspectedElementId) => set({ inspectedElementId })
    }),
    {
      name: "logdd-auto-edit-panel-store",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        assetsTab: state.assetsTab,
        propertiesTab: state.propertiesTab,
        isAssetsPanelOpen: state.isAssetsPanelOpen,
        isPropertiesPanelOpen: state.isPropertiesPanelOpen
      })
    }
  )
);
function AssetsPanel() {
  const { t: t2 } = useI18n();
  const assetsTab = usePanelStore((s) => s.assetsTab);
  const setAssetsTab = usePanelStore((s) => s.setAssetsTab);
  const tabs = [
    { key: "media", label: t2("autoEdit.assetsTab.media"), icon: Film },
    { key: "text", label: t2("autoEdit.assetsTab.text"), icon: Type },
    { key: "effects", label: t2("autoEdit.assetsTab.effects"), icon: Sparkles },
    { key: "transitions", label: t2("autoEdit.assetsTab.transitions"), icon: Blend },
    { key: "captions", label: t2("autoEdit.assetsTab.captions"), icon: Captions },
    { key: "auto", label: t2("autoEdit.assetsTab.auto"), icon: WandSparkles }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 shrink-0 items-center border-b border-border/60 px-3 text-xs font-semibold text-muted-foreground", children: t2("autoEdit.panels.assets") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 items-center gap-0.5 border-b border-border/60 px-1.5 py-1.5", children: tabs.map((tab) => {
      const Icon = tab.icon;
      const active = assetsTab === tab.key;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setAssetsTab(tab.key),
          className: cn(
            "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
            active && "bg-sidebar-accent text-foreground"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }),
            tab.label
          ]
        },
        tab.key
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0", children: [
      assetsTab === "media" && /* @__PURE__ */ jsxRuntimeExports.jsx(MediaTab, {}),
      assetsTab === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx(TextTab, {}),
      assetsTab === "effects" && /* @__PURE__ */ jsxRuntimeExports.jsx(EffectsTab, {}),
      assetsTab === "transitions" && /* @__PURE__ */ jsxRuntimeExports.jsx(TransitionsTab, {}),
      assetsTab === "captions" && /* @__PURE__ */ jsxRuntimeExports.jsx(CaptionsTab, {}),
      assetsTab === "auto" && /* @__PURE__ */ jsxRuntimeExports.jsx(AutoTab, {})
    ] })
  ] });
}
function MediaTab() {
  const { t: t2 } = useI18n();
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const [importing, setImporting] = reactExports.useState(false);
  const assets = Object.values(mediaAssets);
  const onImport = async () => {
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    setImporting(true);
    try {
      const result = await runtime.pickMedia();
      if (!result.canceled && result.files.length > 0) {
        await importMediaFiles(result.files);
      }
    } finally {
      setImporting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        type: "button",
        onClick: onImport,
        disabled: importing,
        className: "w-full border-dashed py-2.5 text-muted-foreground",
        children: [
          importing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-4" }),
          importing ? "…" : t2("autoEdit.importMedia")
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-auto px-2 pb-2", children: assets.length === 0 ? null : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: assets.map((asset) => /* @__PURE__ */ jsxRuntimeExports.jsx(AssetRow, { asset }, asset.path)) }) })
  ] });
}
function AssetRow({ asset }) {
  const Icon = asset.kind === "video" ? Film : asset.kind === "audio" ? Music : Image;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData(DND_MEDIA, asset.path);
        e.dataTransfer.effectAllowed = "copy";
      },
      className: "flex cursor-grab items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-1.5 active:cursor-grabbing",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-panel", children: asset.kind === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: asset.previewUrl, alt: asset.name, className: "size-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs font-medium text-foreground", children: asset.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground", children: [
            asset.kind,
            " · ",
            formatTimecodeCompact(asset.durationMs)
          ] })
        ] })
      ]
    }
  );
}
function TextTab() {
  const { t: t2 } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const addText = () => {
    execute(
      addElementToTrackOfTypeCommand(
        createTextElement({ startTime: playheadMs }),
        "text",
        t2("autoEdit.addText")
      )
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      variant: "outline",
      type: "button",
      onClick: addText,
      className: "w-full border-dashed py-2.5 text-muted-foreground",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "size-4" }),
        t2("autoEdit.addText")
      ]
    }
  ) });
}
function LibraryRow({
  label,
  hint,
  icon: Icon,
  active,
  disabled,
  onDragStart,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      draggable: true,
      onDragStart: (e) => onDragStart(e.dataTransfer),
      className: cn(
        "flex cursor-grab items-center gap-2 rounded-lg border p-2 transition-colors active:cursor-grabbing",
        active ? "border-primary/60 bg-primary/10" : "border-border/60 bg-background/40 hover:border-primary/50 hover:bg-primary/5"
      ),
      onClick: () => {
        if (!disabled) onClick();
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded bg-panel", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs font-medium text-foreground", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-2xs text-muted-foreground", children: hint })
        ] }),
        active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5 shrink-0 text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "size-3.5 shrink-0 text-muted-foreground/60" })
      ]
    }
  );
}
function EffectsTab() {
  const { t: t2 } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);
  const project = useEditorStore((s) => s.project);
  const element = project && ref ? getElement(getScene(project).tracks, ref) : null;
  const canApply = !!element && isVisualElement(element);
  const canAnimate = !!element && (element.type === "video" || element.type === "image");
  const currentMotion = canAnimate ? element.motionEffect ?? "none" : "none";
  const hint = canApply ? t2("autoEdit.library.clickOrDrag") : t2("autoEdit.library.dragToClip");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 overflow-auto p-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-1 pb-1.5 text-2xs font-semibold text-muted-foreground", children: t2("autoEdit.motion") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mb-3 space-y-1", children: MOTION_EFFECTS.filter((m) => m.type !== "none").map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryRow,
      {
        label: m.label,
        hint,
        icon: Move,
        active: currentMotion === m.type,
        disabled: !canAnimate,
        onDragStart: (dt) => setMotionDrag(dt, m.type),
        onClick: () => {
          if (!canAnimate || !ref) return;
          execute(
            updateMotionEffectCommand(ref, currentMotion === m.type ? "none" : m.type)
          );
        }
      },
      m.type
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-1 pb-1.5 text-2xs font-semibold text-muted-foreground", children: t2("autoEdit.effects") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: EFFECT_DEFINITIONS.map((def) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryRow,
      {
        label: def.name,
        hint,
        icon: Sparkles,
        disabled: !canApply,
        onDragStart: (dt) => setEffectDrag(dt, def.type),
        onClick: () => {
          if (!canApply || !ref) return;
          execute(addEffectCommand(ref, def.type));
        }
      },
      def.type
    )) })
  ] });
}
function TransitionsTab() {
  const { t: t2 } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);
  const project = useEditorStore((s) => s.project);
  const scene = project ? getScene(project) : null;
  const element = scene && ref ? getElement(scene.tracks, ref) : null;
  const track = scene && ref ? getTrack(scene.tracks, ref.trackId) : null;
  const next = track && ref ? nextVisualSibling(track, ref.elementId) : null;
  const canApply = !!element && (element.type === "video" || element.type === "image") && next != null;
  const current = element && (element.type === "video" || element.type === "image") ? element.transitionToNext?.type ?? "none" : "none";
  const maxMs = element && next ? Math.min(element.duration, next.duration) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 overflow-auto p-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-1 pb-2 text-2xs leading-relaxed text-muted-foreground", children: t2("autoEdit.transitions.hint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: TRANSITIONS.filter((tr) => tr.type !== "none").map((tr) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryRow,
      {
        label: tr.label,
        hint: `${tr.durationMs} ms`,
        icon: Blend,
        active: current === tr.type,
        disabled: !canApply,
        onDragStart: (dt) => setTransitionDrag(dt, tr.type),
        onClick: () => {
          if (!ref) return;
          if (!canApply) {
            toast.error(t2("autoEdit.transition.needsNext"));
            return;
          }
          execute(
            updateTransitionCommand(
              ref,
              current === tr.type ? null : { type: tr.type, durationMs: Math.min(tr.durationMs, maxMs) }
            )
          );
        }
      },
      tr.type
    )) })
  ] });
}
function AutoTab() {
  const { t: t2 } = useI18n();
  const [busy, setBusy] = reactExports.useState(false);
  const [summary, setSummary] = reactExports.useState(
    null
  );
  const onImport = async () => {
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    setBusy(true);
    setSummary(null);
    try {
      const picked = await runtime.pickJson();
      if (picked.canceled || !picked.content) return;
      const parsed = parseAutoRows(picked.content, picked.filePath ?? "");
      if (parsed.rows.length === 0) {
        toast.error(t2("autoEdit.auto.noRows"));
        setSummary({ shots: 0, skipped: parsed.skipped, missing: [] });
        return;
      }
      const built = await buildTimelineFromRows(parsed.rows);
      setSummary({ shots: built.shots, skipped: parsed.skipped, missing: built.missing });
      if (built.shots === 0) toast.error(t2("autoEdit.auto.noMedia"));
      else toast.success(`${t2("autoEdit.auto.done")} (${built.shots})`);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          type: "button",
          onClick: onImport,
          disabled: busy,
          className: "w-full border-dashed py-2.5 text-muted-foreground",
          children: [
            busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "size-4" }),
            busy ? "…" : t2("autoEdit.auto.import")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 px-1 text-2xs leading-relaxed text-muted-foreground", children: t2("autoEdit.auto.hint") })
    ] }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-auto border-t border-border/60 px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xs text-foreground", children: [
        t2("autoEdit.auto.shots"),
        ": ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: summary.shots })
      ] }),
      summary.skipped > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-2xs text-muted-foreground", children: [
        t2("autoEdit.auto.skipped"),
        ": ",
        summary.skipped
      ] }),
      summary.missing.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xs font-medium text-destructive", children: [
          t2("autoEdit.auto.missing"),
          " (",
          summary.missing.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 space-y-0.5", children: summary.missing.slice(0, 20).map((name) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "truncate text-2xs text-muted-foreground", title: name, children: name }, name)) })
      ] })
    ] })
  ] });
}
function CaptionsTab() {
  const { t: t2 } = useI18n();
  const project = useEditorStore((s) => s.project);
  const [busyKey, setBusyKey] = reactExports.useState(null);
  const [progress, setProgress] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const clips = [];
  if (project) {
    const scene = getScene(project);
    for (const track of allTracks(scene.tracks)) {
      for (const el of track.elements) {
        if (el.type === "video" && el.mediaPath) {
          clips.push({
            ref: { trackId: track.id, elementId: el.id },
            name: el.name,
            kind: "video",
            mediaPath: el.mediaPath
          });
        } else if (el.type === "audio" && "mediaPath" in el && el.mediaPath) {
          clips.push({
            ref: { trackId: track.id, elementId: el.id },
            name: el.name,
            kind: "audio",
            mediaPath: el.mediaPath
          });
        }
      }
    }
  }
  const transcribe = async (clip) => {
    setError(null);
    const runtime = window.whisperRuntime;
    if (!runtime) {
      setError(t2("autoEdit.captions.unavailable"));
      return;
    }
    const { whisperProvider, whisperApiKeys, whisperLanguage } = useAutoVideoStore.getState();
    const apiKey = whisperApiKeys[whisperProvider];
    if (!apiKey) {
      setError(t2("autoEdit.captions.noApiKey"));
      return;
    }
    const key = `${clip.ref.trackId}:${clip.ref.elementId}`;
    const jobId = `autoedit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBusyKey(key);
    setProgress({ percent: 0, message: t2("autoEdit.captions.transcribing") });
    const unsub = runtime.onProgress((event) => {
      if (event.jobId !== jobId) return;
      setProgress({ percent: event.percent ?? 0, message: event.message ?? "" });
    });
    try {
      const result = await runtime.transcribe({
        jobId,
        audioPath: clip.mediaPath,
        provider: whisperProvider,
        apiKey,
        language: whisperLanguage || void 0
      });
      if (!result.success) {
        setError(result.error ?? t2("autoEdit.captions.failed"));
        return;
      }
      const captions = parseSrt(result.srt ?? "");
      if (captions.length === 0) {
        setError(t2("autoEdit.captions.noCaptions"));
        return;
      }
      const state = useEditorStore.getState();
      if (!state.project) return;
      state.execute(buildCaptionsCommand(captions, state.project.settings.canvasSize));
      setProgress({ percent: 100, message: `${t2("autoEdit.captions.done")} (${captions.length})` });
    } finally {
      unsub();
      setBusyKey(null);
    }
  };
  if (clips.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-6 text-center text-xs text-muted-foreground", children: t2("autoEdit.captions.empty") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-auto px-2 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: clips.map((clip) => {
      const key = `${clip.ref.trackId}:${clip.ref.elementId}`;
      const busy = busyKey === key;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: "flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs font-medium text-foreground", children: clip.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground", children: clip.kind })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                disabled: busy,
                onClick: () => transcribe(clip),
                className: "flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50",
                children: [
                  busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Captions, { className: "size-3.5" }),
                  t2("autoEdit.captions.transcribe")
                ]
              }
            )
          ]
        },
        key
      );
    }) }) }),
    (progress || error) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-t border-border/60 px-3 py-2", children: [
      progress && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between gap-2 text-2xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: progress.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono tabular-nums", children: [
          progress.percent,
          "%"
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-destructive", children: error })
    ] })
  ] });
}
function ParamControl({ param, value, onChange, keyframe, dense }) {
  const current = value ?? param.default;
  switch (param.type) {
    case "number": {
      const num2 = typeof current === "number" ? current : param.default;
      const input = /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "number",
          value: num2,
          min: param.min,
          max: param.max,
          step: param.step,
          className: cn(
            "h-7 text-right font-mono text-xs",
            dense ? "min-w-0 flex-1" : "w-24"
          ),
          onChange: (e) => {
            const parsed = Number.parseFloat(e.target.value);
            if (Number.isFinite(parsed)) onChange(param.key, parsed);
          }
        }
      );
      const keyframeButton = keyframe && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: keyframe.onToggle,
          title: "Keyframe",
          className: cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            keyframe.active && "text-primary"
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Diamond, { className: cn("size-3", keyframe.active && "fill-current") })
        }
      );
      if (dense) {
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-1", title: param.label, children: [
          keyframeButton,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "w-7 shrink-0 truncate text-2xs text-muted-foreground", children: param.shortLabel ?? param.label }),
          input
        ] });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: param.label, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        keyframeButton,
        input
      ] }) });
    }
    case "boolean":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: param.label, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Switch,
        {
          checked: typeof current === "boolean" ? current : param.default,
          onCheckedChange: (checked) => onChange(param.key, checked)
        }
      ) });
    case "color":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: param.label, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "color",
            value: typeof current === "string" ? current : param.default,
            onChange: (e) => onChange(param.key, e.target.value),
            className: "h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-2xs text-muted-foreground", children: typeof current === "string" ? current : param.default })
      ] }) });
    case "select":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: param.label, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: typeof current === "string" ? current : param.default,
          onValueChange: (v) => onChange(param.key, v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-32 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: param.options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: opt.value, children: opt.label }, opt.value)) })
          ]
        }
      ) });
    case "font":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: param.label, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: typeof current === "string" ? current : param.default,
          onValueChange: (v) => onChange(param.key, v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-32 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: FONT_FAMILIES.map((font) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: font, children: font }, font)) })
          ]
        }
      ) });
    case "text":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs font-medium text-muted-foreground", children: param.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: typeof current === "string" ? current : param.default,
            rows: 3,
            className: "resize-none text-xs",
            onChange: (e) => onChange(param.key, e.target.value)
          }
        )
      ] });
  }
}
function Row({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    children
  ] });
}
function PropertiesPanel() {
  const { t: t2 } = useI18n();
  const project = useEditorStore((s) => s.project);
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);
  const scene = project ? getScene(project) : null;
  const element = project && ref ? getElement(getScene(project).tracks, ref) : null;
  const nextSibling = (() => {
    if (!scene || !ref) return null;
    const track = getTrack(scene.tracks, ref.trackId);
    if (!track) return null;
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((e) => e.id === ref.elementId);
    const next = idx >= 0 ? sorted[idx + 1] : void 0;
    return next && (next.type === "video" || next.type === "image") ? next : null;
  })();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 shrink-0 items-center border-b border-border/60 px-3 text-xs font-semibold text-muted-foreground", children: t2("autoEdit.panels.properties") }),
    !element || !ref ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { label: t2("autoEdit.noSelection") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      Inspector,
      {
        element,
        elementRef: ref,
        execute,
        nextSibling
      }
    )
  ] });
}
function EmptyState({ label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0 flex-col items-center justify-center gap-2 px-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointerClick, { className: "size-8 text-muted-foreground/50" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: label })
  ] });
}
function Inspector({ element, elementRef, execute, nextSibling }) {
  const { t: t2 } = useI18n();
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const localTime = Math.max(0, Math.min(playheadMs - element.startTime, element.duration));
  const retimable = isRetimable(element);
  const rate = element.type === "video" || element.type === "audio" ? element.retime?.rate ?? 1 : 1;
  const groups = getPropertyGroups(element);
  const onParam = (key, value) => execute(updateElementParamsCommand(elementRef, { [key]: value }));
  const keyframeFor = (key) => {
    const active = hasKeyframeAt(element.animations, key, localTime);
    return {
      active,
      onToggle: () => {
        if (active) {
          execute(removeKeyframeCommand(elementRef, key, localTime));
          return;
        }
        const raw = element.params[key];
        const value = typeof raw === "number" ? raw : 0;
        execute(addKeyframeCommand(elementRef, key, localTime, value));
      }
    };
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-medium text-foreground", children: element.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded bg-sidebar-accent px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground", children: typeLabel(t2, element.type) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-3 text-2xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          t2("autoEdit.duration"),
          " · ",
          formatTimecodeCompact(element.duration)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "0:00.00 – ",
          formatTimecodeCompact(element.startTime + element.duration)
        ] })
      ] })
    ] }),
    retimable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1.5 flex items-center gap-1.5 text-2xs font-medium text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "size-3.5" }),
        t2("autoEdit.speed")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value: rate,
            min: 0.1,
            max: 8,
            step: 0.05,
            className: "h-7 w-24 text-right font-mono text-xs",
            onChange: (e) => {
              const parsed = Number.parseFloat(e.target.value);
              if (Number.isFinite(parsed)) execute(updateRetimeCommand(elementRef, parsed));
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: "×" })
      ] })
    ] }),
    (element.type === "video" || element.type === "image") && /* @__PURE__ */ jsxRuntimeExports.jsx(MotionSection, { element, elementRef, execute }),
    isVisualElement(element) && /* @__PURE__ */ jsxRuntimeExports.jsx(EffectsSection, { element, elementRef, execute }),
    (element.type === "video" || element.type === "image") && /* @__PURE__ */ jsxRuntimeExports.jsx(MasksSection, { element, elementRef, execute }),
    (element.type === "video" || element.type === "image") && /* @__PURE__ */ jsxRuntimeExports.jsx(
      TransitionSection,
      {
        element,
        elementRef,
        execute,
        nextSibling
      }
    ),
    groups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-2xs font-semibold text-muted-foreground", children: group.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: chunkByNumberRuns(group.params).map(
        (run, index) => run.dense ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-x-3 gap-y-2", children: run.params.map((param) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            param,
            value: element.params[param.key],
            onChange: onParam,
            keyframe: keyframeFor(param.key),
            dense: true
          },
          param.key
        )) }, run.params[0]?.key ?? index) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: run.params.map((param) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            param,
            value: element.params[param.key],
            onChange: onParam
          },
          param.key
        )) }, run.params[0]?.key ?? index)
      ) })
    ] }, group.id))
  ] });
}
function MotionSection({
  element,
  elementRef,
  execute
}) {
  const { t: t2 } = useI18n();
  const current = element.motionEffect ?? "none";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "size-3.5" }),
      t2("autoEdit.motion")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: current,
        onValueChange: (v) => execute(updateMotionEffectCommand(elementRef, v)),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: MOTION_EFFECTS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m.type, children: m.label }, m.type)) })
        ]
      }
    ),
    current !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between rounded-lg border border-border/60 px-2 py-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs font-medium text-foreground", children: motionEffectLabel(current) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          "aria-label": t2("autoEdit.delete"),
          onClick: () => execute(updateMotionEffectCommand(elementRef, "none")),
          className: "text-muted-foreground transition-colors hover:text-destructive",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
        }
      )
    ] })
  ] });
}
function EffectsSection({
  element,
  elementRef,
  execute
}) {
  const { t: t2 } = useI18n();
  const effects = element.effects ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-2xs font-semibold text-muted-foreground", children: t2("autoEdit.effects") }),
    effects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t2("autoEdit.effects.empty") }) : effects.map((effect) => {
      const def = getEffectDefinition(effect.type);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 rounded-lg border border-border/60 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-foreground", children: def?.name ?? effect.type }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => execute(removeEffectCommand(elementRef, effect.id)),
              className: "text-muted-foreground transition-colors hover:text-destructive",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
            }
          )
        ] }),
        (def?.params ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            param: p,
            value: effect.params[p.key],
            onChange: (key, value) => execute(updateEffectCommand(elementRef, effect.id, { params: { [key]: value } }))
          },
          p.key
        ))
      ] }, effect.id);
    })
  ] });
}
function MasksSection({
  element,
  elementRef,
  execute
}) {
  const { t: t2 } = useI18n();
  const masks = element.type === "video" || element.type === "image" ? element.masks ?? [] : [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-semibold text-muted-foreground", children: t2("autoEdit.masks") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: MASK_DEFINITIONS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          title: m.name,
          onClick: () => execute(addMaskCommand(elementRef, m.type)),
          className: "flex size-6 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(MaskIcon, { type: m.type })
        },
        m.type
      )) })
    ] }),
    masks.map((mask) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 rounded-lg border border-border/60 p-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium capitalize text-foreground", children: maskName(mask.type) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => execute(removeMaskCommand(elementRef, mask.id)),
            className: "text-muted-foreground transition-colors hover:text-destructive",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t2("autoEdit.masks.feather") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value: mask.params.feather,
            min: 0,
            max: 1e3,
            step: 1,
            className: "h-7 w-20 text-right font-mono text-xs",
            onChange: (e) => {
              const v = Number.parseFloat(e.target.value);
              if (Number.isFinite(v)) {
                execute(updateMaskCommand(elementRef, mask.id, { feather: v }));
              }
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t2("autoEdit.masks.inverted") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: mask.params.inverted,
            onCheckedChange: (v) => execute(updateMaskCommand(elementRef, mask.id, { inverted: v }))
          }
        )
      ] })
    ] }, mask.id))
  ] });
}
function TransitionSection({
  element,
  elementRef,
  execute,
  nextSibling
}) {
  const { t: t2 } = useI18n();
  const current = element.transitionToNext;
  const currentType = current?.type ?? "none";
  const disabled = nextSibling == null;
  const maxMs = Math.max(0, Math.min(element.duration, nextSibling?.duration ?? element.duration));
  const onType = (type) => {
    if (type === "none") {
      execute(updateTransitionCommand(elementRef, null));
      return;
    }
    execute(
      updateTransitionCommand(elementRef, {
        type,
        durationMs: Math.max(0, Math.min(current?.durationMs ?? defaultDurationMs(type), maxMs))
      })
    );
  };
  const onDuration = (ms) => {
    if (!Number.isFinite(ms)) return;
    execute(
      updateTransitionCommand(elementRef, {
        type: currentType === "none" ? "fade" : currentType,
        durationMs: Math.max(0, Math.min(ms, maxMs))
      })
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "size-3.5" }),
      t2("autoEdit.transition")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: currentType,
          disabled,
          onValueChange: (v) => onType(v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: TRANSITIONS.map((tr) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: tr.type, children: tr.label }, tr.type)) })
          ]
        }
      ),
      disabled && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t2("autoEdit.transition.needsNext") }),
      !disabled && currentType !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t2("autoEdit.transition.duration") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value: current?.durationMs ?? defaultDurationMs(currentType),
            min: 0,
            max: maxMs,
            step: 50,
            className: "h-7 w-20 text-right font-mono text-xs",
            onChange: (e) => onDuration(Number.parseFloat(e.target.value))
          }
        )
      ] })
    ] })
  ] });
}
function chunkByNumberRuns(params) {
  const runs = [];
  for (const param of params) {
    const dense = param.type === "number";
    const last = runs[runs.length - 1];
    if (last && last.dense === dense) last.params.push(param);
    else runs.push({ dense, params: [param] });
  }
  return runs.map(
    (run) => run.dense && run.params.length < 2 ? { dense: false, params: run.params } : run
  );
}
function typeLabel(t2, type) {
  switch (type) {
    case "video":
      return t2("autoEdit.track.video");
    case "audio":
      return t2("autoEdit.track.audio");
    case "text":
      return t2("autoEdit.track.text");
    case "effect":
      return t2("autoEdit.track.effect");
    case "image":
      return t2("autoEdit.element.image");
  }
}
function maskName(type) {
  switch (type) {
    case "rectangle":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "cinematic-bars":
      return "Cinematic Bars";
    case "split":
      return "Split";
    case "freeform":
      return "Freeform";
  }
}
function MaskIcon({ type }) {
  if (type === "ellipse") return /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "size-3" });
  if (type === "cinematic-bars") return /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "size-3" });
  if (type === "split") return /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "size-3" });
  if (type === "freeform") return /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "size-3" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "size-3" });
}
function PreviewPanel() {
  const project = useEditorStore((s) => s.project);
  if (!project) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-background" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PreviewCanvas, { project });
}
function PreviewCanvas({ project }) {
  const { t: t2 } = useI18n();
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const setPlayhead = useTimelineViewStore((s) => s.setPlayhead);
  const isPlaying = useTimelineViewStore((s) => s.isPlaying);
  const setPlaying = useTimelineViewStore((s) => s.setPlaying);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const canvas = project.settings.canvasSize;
  const background = project.settings.background;
  const scene = getScene(project);
  const containerRef = reactExports.useRef(null);
  const panelRef = reactExports.useRef(null);
  const [stage, setStage] = reactExports.useState({ w: 0, h: 0 });
  const [fit, setFit] = reactExports.useState(true);
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (fit) {
        const availW = Math.max(0, rect.width - 24);
        const availH = Math.max(0, rect.height - 24);
        const scale = Math.min(availW / canvas.width, availH / canvas.height);
        setStage({ w: Math.max(1, canvas.width * scale), h: Math.max(1, canvas.height * scale) });
      } else {
        setStage({ w: canvas.width, h: canvas.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.width, canvas.height, fit]);
  reactExports.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };
  reactExports.useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setPlayhead(useTimelineViewStore.getState().playheadMs + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, setPlayhead]);
  const stageScale = stage.w > 0 ? stage.w / canvas.width : 0;
  const visualElements = [];
  if (!scene.tracks.main.hidden) {
    for (const el of scene.tracks.main.elements) {
      if (el.type === "video" || el.type === "image") {
        visualElements.push(el);
      }
    }
  }
  for (const track of [...scene.tracks.overlay].reverse()) {
    if (track.hidden) continue;
    for (const el of track.elements) {
      if (el.type === "video" || el.type === "image" || el.type === "text") {
        visualElements.push(el);
      }
    }
  }
  const { inD, outD } = buildTransitionMaps(scene.tracks);
  const sceneFilter = (() => {
    let blurPx = 0;
    for (const track of scene.tracks.overlay) {
      if (track.type !== "effect" || track.hidden) continue;
      for (const el of track.elements) {
        if (el.hidden) continue;
        if (playheadMs < el.startTime || playheadMs >= el.startTime + el.duration) continue;
        if (el.effectType === "blur") {
          const intensity = typeof el.params.intensity === "number" ? el.params.intensity : 0;
          blurPx = Math.max(blurPx, blurIntensityToPx(intensity));
        }
      }
    }
    return blurPx > 0 ? `blur(${blurPx}px)` : void 0;
  })();
  const visible = visualElements.map((element) => {
    const out = outD.get(element.id) ?? 0;
    const end = element.startTime + element.duration + out;
    if (playheadMs < element.startTime || playheadMs >= end) return null;
    const rel = playheadMs - element.startTime;
    let opacityScale = 1;
    const inMs = inD.get(element.id) ?? 0;
    if (inMs > 0) opacityScale = Math.min(opacityScale, clamp01(rel / inMs));
    if (out > 0) opacityScale = Math.min(opacityScale, clamp01(1 - (rel - element.duration) / out));
    return { element, opacityScale };
  }).filter((x) => x !== null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: panelRef, className: "flex h-full min-w-0 flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 shrink-0 items-center justify-between border-b border-border/60 px-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: t2("autoEdit.panels.preview") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs tabular-nums text-muted-foreground", children: formatTimecodeCompact(playheadMs) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon-sm",
            type: "button",
            onClick: () => setPlaying(!isPlaying),
            className: "size-7 text-muted-foreground",
            "aria-label": isPlaying ? "Pause" : "Play",
            children: isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setFit((f) => !f),
            className: cn(
              "flex h-6 items-center rounded-lg px-1.5 text-2xs font-medium transition-colors",
              fit ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
            ),
            title: t2("autoEdit.preview.fit"),
            children: fit ? "Fit" : "100%"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon-sm",
            type: "button",
            onClick: toggleFullscreen,
            className: "size-7 text-muted-foreground",
            "aria-label": t2("autoEdit.preview.fullscreen"),
            children: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx(Minimize, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize, { className: "size-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, className: "flex-1 min-h-0 overflow-auto p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-full min-w-full place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "relative overflow-hidden rounded-lg bg-black shadow-sm",
        style: {
          width: stage.w,
          height: stage.h,
          background: background.type === "color" ? background.color : "#000",
          // Effect-track effects apply to the whole composite, matching the
          // ffmpeg pass that runs after all overlays.
          filter: sceneFilter
        },
        children: [
          visible.map(({ element, opacityScale }) => {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              VisualLayer,
              {
                element,
                stageScale,
                canvas,
                sourceTimeMs: playheadMs - element.startTime,
                playing: isPlaying,
                opacityScale,
                previewUrl: element.type === "text" ? void 0 : mediaAssets[element.mediaPath]?.previewUrl
              },
              element.id
            );
          }),
          visualElements.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-3 py-1.5 text-xs text-white/40", children: t2("autoEdit.emptyProject") }) })
        ]
      }
    ) }) })
  ] });
}
function VisualLayer({
  element,
  stageScale,
  canvas,
  sourceTimeMs,
  playing,
  previewUrl,
  opacityScale = 1
}) {
  const mediaRef = reactExports.useRef(null);
  const [natural, setNatural] = reactExports.useState({ w: 0, h: 0 });
  const isMedia = element.type === "video" || element.type === "image";
  const localTime = Math.max(0, Math.min(sourceTimeMs, element.duration));
  const effective = resolveAnimatedParams(element.params, element.animations, localTime);
  const transform = getElementTransform(effective);
  const blurPx = (element.effects ?? []).filter((e) => e.enabled && e.type === "blur").reduce((max, e) => {
    const intensity = typeof e.params.intensity === "number" ? e.params.intensity : 0;
    return Math.max(max, blurIntensityToPx(intensity));
  }, 0);
  const filter = blurPx > 0 ? `blur(${blurPx}px)` : void 0;
  const mask = element.type === "video" || element.type === "image" ? (element.masks ?? [])[0] : void 0;
  const clipPath = mask ? resolveMaskClipPath(mask) ?? void 0 : void 0;
  reactExports.useEffect(() => {
    if (!isMedia) return;
    setNatural({ w: 0, h: 0 });
    const el = mediaRef.current;
    if (!el) return;
    const onMeta = () => {
      if (el instanceof HTMLVideoElement) setNatural({ w: el.videoWidth, h: el.videoHeight });
      else if (el instanceof HTMLImageElement) setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    };
    if (el instanceof HTMLVideoElement) el.addEventListener("loadedmetadata", onMeta);
    else el.addEventListener("load", onMeta);
    onMeta();
    return () => {
      if (el instanceof HTMLVideoElement) el.removeEventListener("loadedmetadata", onMeta);
      else el.removeEventListener("load", onMeta);
    };
  }, [isMedia, previewUrl]);
  reactExports.useEffect(() => {
    if (element.type !== "video") return;
    const v = mediaRef.current;
    if (!v) return;
    const target = Math.max(0, sourceTimeMs) / 1e3;
    if (Math.abs(v.currentTime - target) > 0.08) {
      try {
        v.currentTime = target;
      } catch {
      }
    }
    if (playing) v.play().catch(() => {
    });
    else v.pause();
  }, [element.type, sourceTimeMs, playing]);
  if (element.type === "text") {
    const content = typeof effective.content === "string" ? effective.content : "";
    const fontSize = typeof effective.fontSize === "number" ? effective.fontSize : 96;
    const color = typeof effective.color === "string" ? effective.color : "#ffffff";
    const fontFamily = typeof effective.fontFamily === "string" ? effective.fontFamily : "Arial";
    const fontWeight = typeof effective.fontWeight === "string" ? effective.fontWeight : "normal";
    const fontStyle = typeof effective.fontStyle === "string" ? effective.fontStyle : "normal";
    const textAlign = typeof effective.textAlign === "string" ? effective.textAlign : "center";
    const cx = (canvas.width / 2 + transform.positionX) * stageScale;
    const cy = (canvas.height / 2 + transform.positionY) * stageScale;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "absolute flex items-center justify-center",
        style: {
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) rotate(${transform.rotate}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
          opacity: transform.opacity * opacityScale,
          mixBlendMode: toCssBlendMode(transform.blendMode),
          filter
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "whitespace-pre-wrap",
            style: { fontSize: fontSize * stageScale, color, fontFamily, fontWeight, fontStyle, textAlign, lineHeight: 1.2 },
            children: content
          }
        )
      }
    );
  }
  const fit = getMediaFit(effective);
  const fitted = natural.w > 0 ? fitSize(fit, natural.w, natural.h, canvas.width, canvas.height) : null;
  const rect = fitted ? resolveElementRect(transform, canvas, fitted.width, fitted.height) : null;
  const motion = resolveMotionTransform(
    element.motionEffect,
    element.duration > 0 ? localTime / element.duration : 0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "absolute",
      style: {
        width: rect ? rect.width * stageScale : 0,
        height: rect ? rect.height * stageScale : 0,
        left: rect ? (rect.centerX - rect.width / 2) * stageScale : 0,
        top: rect ? (rect.centerY - rect.height / 2) * stageScale : 0,
        transform: `rotate(${transform.rotate}deg) scale(${motion.scale})`,
        opacity: transform.opacity * opacityScale,
        mixBlendMode: toCssBlendMode(transform.blendMode),
        transformOrigin: `${motion.originX * 100}% ${motion.originY * 100}%`,
        pointerEvents: "none",
        filter,
        clipPath
      },
      children: element.type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          ref: (el) => {
            mediaRef.current = el;
          },
          src: previewUrl,
          muted: true,
          playsInline: true,
          className: "size-full object-fill"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          ref: (el) => {
            mediaRef.current = el;
          },
          src: previewUrl,
          alt: element.name,
          draggable: false,
          className: "size-full object-fill"
        }
      )
    }
  );
}
function toCssBlendMode(blendMode) {
  if (blendMode === "normal") return "normal";
  return blendMode.replace(/_/g, "-");
}
function buildTransitionMaps(tracks) {
  const inD = /* @__PURE__ */ new Map();
  const outD = /* @__PURE__ */ new Map();
  const visualTracks = [
    ...tracks.overlay.filter((t2) => !t2.hidden),
    ...tracks.main.hidden ? [] : [tracks.main]
  ];
  for (const track of visualTracks) {
    const elements = track.elements;
    const media = elements.filter((e) => e.type === "video" || e.type === "image").sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < media.length - 1; i++) {
      const a = media[i];
      const b = media[i + 1];
      const tr = a.transitionToNext;
      if (!tr || tr.type === "none") continue;
      const d = Math.max(0, Math.min(tr.durationMs, a.duration, b.duration));
      if (d <= 0) continue;
      outD.set(a.id, d);
      inD.set(b.id, d);
    }
  }
  return { inD, outD };
}
function clamp01(n) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
const THUMB_WIDTH = 160;
const SAMPLE_AT_SEC = 1;
const cache = /* @__PURE__ */ new Map();
const inFlight = /* @__PURE__ */ new Map();
const listeners = /* @__PURE__ */ new Set();
function getCachedThumbnail(mediaPath) {
  return cache.get(mediaPath) ?? null;
}
function subscribeThumbnails(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function publish(mediaPath, dataUrl) {
  cache.set(mediaPath, dataUrl);
  inFlight.delete(mediaPath);
  for (const listener of listeners) listener();
}
const STRIP_FRAMES = 12;
function ensureVideoThumbnail(mediaPath, previewUrl) {
  const cached = cache.get(mediaPath);
  if (cached) return Promise.resolve(cached);
  const existing = inFlight.get(mediaPath);
  if (existing) return existing;
  const task = new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    let settled = false;
    let canvas = null;
    let ctx = null;
    let frameWidth = THUMB_WIDTH;
    let frameHeight = Math.round(THUMB_WIDTH * 9 / 16);
    let index = 0;
    let times = [];
    const finish = (result) => {
      if (settled) return;
      settled = true;
      video.removeAttribute("src");
      video.load();
      if (result) publish(mediaPath, result);
      else inFlight.delete(mediaPath);
      resolve(result);
    };
    const flush = () => {
      if (!canvas || index === 0) return finish(null);
      try {
        finish(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        finish(null);
      }
    };
    const drawCurrent = () => {
      if (!ctx || settled) return;
      try {
        ctx.drawImage(video, index * frameWidth, 0, frameWidth, frameHeight);
      } catch {
        return finish(null);
      }
      index += 1;
      if (index >= times.length) return flush();
      video.currentTime = times[index];
    };
    video.addEventListener("loadeddata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const ratio = video.videoWidth > 0 ? video.videoHeight / video.videoWidth : 9 / 16;
      frameHeight = Math.max(1, Math.round(THUMB_WIDTH * ratio));
      frameWidth = THUMB_WIDTH;
      const count = duration > 0.5 ? STRIP_FRAMES : 1;
      times = count === 1 ? [Math.min(SAMPLE_AT_SEC, duration / 2) || 0] : Array.from({ length: count }, (_, i) => (i + 0.5) / count * duration);
      canvas = document.createElement("canvas");
      canvas.width = frameWidth * count;
      canvas.height = frameHeight;
      ctx = canvas.getContext("2d");
      if (!ctx) return finish(null);
      index = 0;
      video.currentTime = times[0];
    });
    video.addEventListener("seeked", drawCurrent);
    video.addEventListener("error", () => finish(null));
    setTimeout(flush, 15e3);
    video.src = previewUrl;
  });
  inFlight.set(mediaPath, task);
  return task;
}
function cssUrl(url) {
  return `url("${url.replace(/["\\]/g, "\\$&")}")`;
}
function useClipThumbnail(kind, mediaPath, previewUrl) {
  const cached = reactExports.useSyncExternalStore(
    subscribeThumbnails,
    () => mediaPath ? getCachedThumbnail(mediaPath) : null,
    () => null
  );
  reactExports.useEffect(() => {
    if (kind !== "video" || !mediaPath || !previewUrl) return;
    void ensureVideoThumbnail(mediaPath, previewUrl);
  }, [kind, mediaPath, previewUrl]);
  if (kind === "image") return previewUrl ? { url: previewUrl, mode: "tile" } : null;
  return cached ? { url: cached, mode: "strip" } : null;
}
const TRACK_COLOR_VAR = {
  video: "--timeline-video",
  audio: "--timeline-audio",
  text: "--timeline-text",
  effect: "--timeline-effect"
};
function trackColor(type, alpha = 1) {
  return `hsl(var(${TRACK_COLOR_VAR[type]}) / ${alpha})`;
}
const RULER_HEIGHT = 22;
const TRACK_HEADER_WIDTH = 112;
const TRACK_GAP = 6;
const CLIP_RADIUS = 6;
const TRIM_HANDLE_WIDTH = 8;
const MIN_CONTENT_MS = 1e4;
const CONTENT_RIGHT_PADDING_PX = 240;
const TRACK_HEIGHTS = {
  video: 65,
  audio: 50,
  text: 25,
  effect: 25
};
function trackHeight(type) {
  return TRACK_HEIGHTS[type];
}
function Clip({
  trackId,
  element,
  trackType,
  zoomLevel,
  isSelected,
  isDropTarget,
  isTravelling,
  previewUrl,
  override,
  onSelect,
  onBodyPointerDown,
  onTrimPointerDown
}) {
  const startTime = override?.startTime ?? element.startTime;
  const duration = override?.duration ?? element.duration;
  const left = msToPx(startTime, zoomLevel);
  const width = Math.max(2, msToPx(duration, zoomLevel));
  const color = trackColor(trackType);
  const ref = { trackId, elementId: element.id };
  const effectCount = "effects" in element ? element.effects?.length ?? 0 : 0;
  const motion = element.type === "video" || element.type === "image" ? element.motionEffect : void 0;
  const hasMotion = motion != null && motion !== "none";
  const showDuration = width > 120;
  const mediaPath = "mediaPath" in element ? element.mediaPath : null;
  const thumbKind = element.type === "video" || element.type === "image" ? element.type : null;
  const thumbnail = useClipThumbnail(thumbKind, mediaPath, previewUrl ?? null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "group absolute top-1 bottom-1 select-none overflow-hidden rounded-lg",
        "cursor-grab active:cursor-grabbing",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isDropTarget && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background",
        // Faded placeholder while the clip itself is being dragged to another track.
        isTravelling && "opacity-25"
      ),
      style: {
        left,
        width,
        background: trackColor(trackType, 0.18),
        borderLeft: `3px solid ${color}`,
        borderRadius: CLIP_RADIUS
      },
      onPointerDown: (e) => {
        e.stopPropagation();
        onSelect(ref, e.shiftKey);
        onBodyPointerDown(ref, e);
      },
      children: [
        thumbnail && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "pointer-events-none absolute inset-0",
              style: {
                backgroundImage: cssUrl(thumbnail.url),
                // A filmstrip is stretched across the clip so each frame lands near
                // its own moment; a still is tiled, since every frame is the same.
                backgroundRepeat: thumbnail.mode === "strip" ? "no-repeat" : "repeat-x",
                backgroundSize: thumbnail.mode === "strip" ? "100% 100%" : "auto 100%"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 to-background/70" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 left-0 z-10 cursor-ew-resize bg-transparent hover:bg-white/10",
            style: { width: TRIM_HANDLE_WIDTH },
            onPointerDown: (e) => {
              e.stopPropagation();
              onSelect(ref, e.shiftKey);
              onTrimPointerDown(ref, "trim-left", e);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 right-0 z-10 cursor-ew-resize bg-transparent hover:bg-white/10",
            style: { width: TRIM_HANDLE_WIDTH },
            onPointerDown: (e) => {
              e.stopPropagation();
              onSelect(ref, e.shiftKey);
              onTrimPointerDown(ref, "trim-right", e);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "pointer-events-none flex h-full items-center gap-1.5 px-2.5",
            style: { color },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: color } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-2xs font-medium leading-tight text-foreground", children: element.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex shrink-0 items-center gap-1", children: [
                hasMotion && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    title: motion,
                    className: "flex size-4 items-center justify-center rounded bg-background/70",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Move, { className: "size-2.5 text-foreground/80" })
                  }
                ),
                effectCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex h-4 items-center gap-0.5 rounded bg-background/70 px-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-2.5 text-foreground/80" }),
                  effectCount > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-semibold text-foreground/80", children: effectCount })
                ] }),
                showDuration && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-background/70 px-1 font-mono text-2xs tabular-nums text-foreground/80", children: formatClipDuration(duration) })
              ] })
            ]
          }
        )
      ]
    }
  );
}
function formatClipDuration(ms) {
  const totalSeconds = ms / 1e3;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${seconds.toFixed(1).padStart(4, "0")}` : `${seconds.toFixed(1)}s`;
}
const SNAP_THRESHOLD_PX = 12;
const CUT_SNAP_PX = 70;
const EDGE_SCROLL_PX = 48;
const EDGE_SCROLL_SPEED_PX = 14;
function computeDrag(d, deltaMs, frameDur) {
  if (d.mode === "seek" || d.mode === "marquee") return d;
  if (d.mode === "move") {
    return { ...d, newStart: Math.max(0, d.startTime + deltaMs) };
  }
  if (d.mode === "trim-left") {
    let newStart = d.startTime + deltaMs;
    let newDuration2 = d.duration - deltaMs;
    if (newDuration2 < frameDur) {
      newDuration2 = frameDur;
      newStart = d.startTime + d.duration - frameDur;
    }
    if (newStart < 0) {
      newStart = 0;
      newDuration2 = d.duration + d.startTime;
    }
    const newTrimStart = Math.max(0, d.trimStart + (newStart - d.startTime));
    return { ...d, newStart, newDuration: newDuration2, newTrimStart };
  }
  const newDuration = Math.max(frameDur, d.duration + deltaMs);
  const newTrimEnd = Math.max(0, d.trimEnd - deltaMs);
  return { ...d, newDuration, newTrimEnd };
}
function TimelineToolbar({
  selectionEmpty,
  rippleEnabled,
  setRippleEnabled,
  zoomBy,
  addText,
  splitSelected: splitSelected2,
  duplicateSelected: duplicateSelected2,
  deleteSelected: deleteSelected2,
  t: t2
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 shrink-0 items-center gap-1 border-b border-border/60 px-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "xs", className: "px-1.5 text-muted-foreground", type: "button", onClick: () => zoomBy(1 / 1.25), "aria-label": t2("autoEdit.zoomOut"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "size-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "xs", className: "px-1.5 text-muted-foreground", type: "button", onClick: () => zoomBy(1.25), "aria-label": t2("autoEdit.zoomIn"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "size-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-1 h-4 w-px bg-border" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "xs", className: "gap-1 px-1.5 text-muted-foreground", type: "button", onClick: addText, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "size-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t2("autoEdit.addText") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "xs",
        type: "button",
        onClick: splitSelected2,
        disabled: selectionEmpty,
        className: "gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t2("autoEdit.split") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "xs",
        type: "button",
        onClick: duplicateSelected2,
        disabled: selectionEmpty,
        className: "gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t2("autoEdit.duplicate") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "xs",
        type: "button",
        onClick: deleteSelected2,
        disabled: selectionEmpty,
        className: "gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t2("autoEdit.delete") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto flex items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "xs",
        type: "button",
        onClick: () => setRippleEnabled(!rippleEnabled),
        "aria-label": t2("autoEdit.ripple"),
        title: t2("autoEdit.ripple.hint"),
        "aria-pressed": rippleEnabled,
        className: cn(
          "gap-1 px-1.5",
          rippleEnabled ? "bg-primary/10 text-primary" : "text-muted-foreground opacity-60"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t2("autoEdit.ripple") })
        ]
      }
    ) })
  ] });
}
function TrackHeader({ track, isMain }) {
  const { t: t2 } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const color = trackColor(track.type);
  return (
    // The label column is 112px wide (opencut's measurement), so the row stays
    // compact: small dot, truncating name, and icon buttons that shrink to fit.
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full items-center gap-1 px-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: color } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-2xs font-medium text-foreground", children: isMain ? t2("autoEdit.track.main") : track.name }),
      track.type !== "audio" && "hidden" in track && /* @__PURE__ */ jsxRuntimeExports.jsx(
        HeaderIconButton,
        {
          active: !track.hidden,
          onClick: () => execute(toggleTrackHiddenCommand(track.id, t2("autoEdit.hideTrack"))),
          children: track.hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "size-3" })
        }
      ),
      "muted" in track && /* @__PURE__ */ jsxRuntimeExports.jsx(
        HeaderIconButton,
        {
          active: !track.muted,
          onClick: () => execute(toggleTrackMutedCommand(track.id, t2("autoEdit.muteTrack"))),
          children: track.muted ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "size-3" })
        }
      )
    ] })
  );
}
function HeaderIconButton({
  children,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick,
      className: cn(
        "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
        !active && "opacity-40"
      ),
      children
    }
  );
}
function useTimelineDrop({
  scene,
  mediaAssets,
  zoomLevel,
  execute,
  setSelection,
  setDropTarget,
  clientXToMs,
  trackIdAtClientY,
  snapEdge,
  importMediaFiles: importMediaFiles2,
  pickedFromDroppedFiles: pickedFromDroppedFiles2,
  t: t2
}) {
  const dropMs = (e) => snapEdge(clientXToMs(e.clientX));
  const clipAt = (trackId, ms) => {
    if (!trackId) return null;
    const track = getTrack(scene.tracks, trackId);
    const hit = track?.elements.find(
      (el) => ms >= el.startTime && ms < el.startTime + el.duration
    );
    return hit ? { trackId, elementId: hit.id } : null;
  };
  const cutAt = (trackId, ms) => {
    if (!trackId) return null;
    const track = getTrack(scene.tracks, trackId);
    if (!track) return null;
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
    const threshold = pxToMs(CUT_SNAP_PX, zoomLevel);
    let best = null;
    let bestDist = threshold;
    for (let i = 0; i < sorted.length - 1; i++) {
      const outgoing = sorted[i];
      const incoming = sorted[i + 1];
      const bothVisual = (outgoing.type === "video" || outgoing.type === "image") && (incoming.type === "video" || incoming.type === "image");
      if (!bothVisual) continue;
      const boundary = outgoing.startTime + outgoing.duration;
      const dist = Math.abs(boundary - ms);
      if (dist < bestDist) {
        bestDist = dist;
        best = { ref: { trackId, elementId: outgoing.id }, ms: boundary };
      }
    }
    return best;
  };
  const onDragOver = (e) => {
    e.preventDefault();
    const kind = dragPayloadKind(e.dataTransfer);
    const trackId = trackIdAtClientY(e.clientY);
    if (kind === "transition") {
      const ms = clientXToMs(e.clientX);
      const cut = cutAt(trackId, ms);
      e.dataTransfer.dropEffect = cut ? "copy" : "none";
      setDropTarget({ trackId, ms: cut?.ms ?? ms, clip: null, cut, kind });
      return;
    }
    if (targetsExistingClip(kind)) {
      const ms = clientXToMs(e.clientX);
      const target = clipAt(trackId, ms);
      e.dataTransfer.dropEffect = target ? "copy" : "none";
      setDropTarget({ trackId, ms, clip: target, cut: null, kind });
      return;
    }
    e.dataTransfer.dropEffect = "copy";
    setDropTarget({ trackId, ms: dropMs(e), clip: null, cut: null, kind });
  };
  const onDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDropTarget(null);
  };
  const onDrop = async (e) => {
    e.preventDefault();
    const startMs = dropMs(e);
    const trackId = trackIdAtClientY(e.clientY) ?? void 0;
    setDropTarget(null);
    const effectType = e.dataTransfer.getData(DND_EFFECT);
    const motionType = e.dataTransfer.getData(DND_MOTION);
    const transitionType = e.dataTransfer.getData(DND_TRANSITION);
    if (transitionType) {
      const cut = cutAt(trackId ?? null, clientXToMs(e.clientX));
      if (!cut) {
        toast.error(t2("autoEdit.drop.noCut"));
        return;
      }
      const track = getTrack(scene.tracks, cut.ref.trackId);
      const next = track ? nextVisualSibling(track, cut.ref.elementId) : null;
      const outgoing = getElement(scene.tracks, cut.ref);
      if (!next || !outgoing) {
        toast.error(t2("autoEdit.transition.needsNext"));
        return;
      }
      const def = transitionDefinition(transitionType);
      setSelection({ elements: [cut.ref], keyframes: [] });
      execute(
        updateTransitionCommand(cut.ref, {
          type: def.type,
          durationMs: Math.min(def.durationMs, outgoing.duration, next.duration)
        })
      );
      return;
    }
    if (effectType || motionType) {
      const target = clipAt(trackId ?? null, clientXToMs(e.clientX));
      if (!target && effectType) {
        execute(addEffectLayerCommand(effectType, startMs, t2("autoEdit.effects")));
        return;
      }
      if (!target) {
        toast.error(t2("autoEdit.drop.noClip"));
        return;
      }
      setSelection({ elements: [target], keyframes: [] });
      if (effectType) execute(addEffectCommand(target, effectType));
      else execute(updateMotionEffectCommand(target, motionType));
      return;
    }
    const mediaPath = e.dataTransfer.getData(DND_MEDIA);
    if (mediaPath) {
      const asset = mediaAssets[mediaPath];
      if (asset) {
        await importMediaFiles2(
          [{ path: asset.path, name: asset.name, kind: asset.kind, previewUrl: asset.previewUrl }],
          { startMs, trackId }
        );
      }
      return;
    }
    if (e.dataTransfer.files.length > 0) {
      const picked = await pickedFromDroppedFiles2(Array.from(e.dataTransfer.files));
      if (picked.length > 0) await importMediaFiles2(picked, { startMs, trackId });
    }
  };
  return { onDragOver, onDragLeave, onDrop };
}
function niceTickMs(pps) {
  const target = 90 / pps * 1e3;
  const steps = [100, 200, 250, 500, 1e3, 2e3, 5e3, 1e4, 3e4, 6e4, 3e5, 6e5];
  for (const s of steps) if (s >= target) return s;
  return steps[steps.length - 1];
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatTickLabel(ms) {
  const total = Math.max(0, Math.round(ms));
  const h = Math.floor(total / 36e5);
  const m = Math.floor(total % 36e5 / 6e4);
  const s = Math.floor(total % 6e4 / 1e3);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  if (m > 0) return `${m}:${pad(s)}`;
  return `${s}s`;
}
function Ruler({ widthPx, zoomLevel, onPointerDown }) {
  const pps = pixelsPerSecond(zoomLevel);
  const majorMs = niceTickMs(pps);
  const minorMs = majorMs / (majorMs % 5 === 0 ? 5 : 4);
  const spanMs = pxToMs(widthPx, zoomLevel);
  const ticks = [];
  for (let ms = 0; ms <= spanMs + minorMs; ms += minorMs) {
    const rounded = Math.round(ms);
    ticks.push({ ms: rounded, major: rounded % majorMs === 0 });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "relative h-full cursor-col-resize border-b border-border/60",
      style: { height: RULER_HEIGHT },
      onPointerDown,
      children: ticks.map(({ ms, major }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 h-full", style: { left: msToPx(ms, zoomLevel) }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute bottom-0 w-px bg-border",
            style: { height: major ? 10 : 5 }
          }
        ),
        major && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-1 left-1 whitespace-nowrap text-2xs font-medium text-muted-foreground", children: formatTickLabel(ms) })
      ] }, ms))
    }
  );
}
function TransitionMarker({
  boundaryMs,
  transition,
  trackType,
  zoomLevel,
  maxDurationMs,
  minDurationMs,
  isSelected,
  onSelect,
  onResize,
  onRemove
}) {
  const [draftMs, setDraftMs] = reactExports.useState(null);
  const isResizing = reactExports.useRef(false);
  const draftRef = reactExports.useRef(null);
  const hostRef = reactExports.useRef(null);
  const durationMs = draftMs ?? transition.durationMs;
  const width = Math.max(14, msToPx(durationMs, zoomLevel));
  const center = msToPx(boundaryMs, zoomLevel);
  const color = trackColor(trackType);
  reactExports.useEffect(() => {
    const onMove = (e) => {
      if (!isResizing.current) return;
      const host = hostRef.current?.parentElement;
      if (!host) return;
      const pointerMs = pxToMs(e.clientX - host.getBoundingClientRect().left, zoomLevel);
      const next = Math.round(Math.abs(pointerMs - boundaryMs) * 2);
      const clamped = Math.max(minDurationMs, Math.min(next, maxDurationMs));
      draftRef.current = clamped;
      setDraftMs(clamped);
    };
    const onUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      const committed = draftRef.current;
      draftRef.current = null;
      setDraftMs(null);
      if (committed != null) onResize?.(committed);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [zoomLevel, boundaryMs, minDurationMs, maxDurationMs, onResize]);
  const beginResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    draftRef.current = transition.durationMs;
    setDraftMs(transition.durationMs);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: hostRef,
      className: cn(
        "group/transition absolute top-1 bottom-1 z-20 flex items-center justify-center rounded",
        "border border-dashed",
        isSelected ? "border-primary" : "border-foreground/40 hover:border-primary/70"
      ),
      style: {
        left: center - width / 2,
        width,
        background: `linear-gradient(to right, transparent, ${trackColor(trackType, 0.6)}, transparent)`
      },
      title: `${transition.type} · ${Math.round(durationMs)}ms`,
      onPointerDown: (e) => {
        e.stopPropagation();
        onSelect?.();
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            className: "pointer-events-none absolute inset-0 size-full opacity-60",
            preserveAspectRatio: "none",
            viewBox: "0 0 10 10",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", y1: "10", x2: "10", y2: "0", stroke: color, strokeWidth: "0.6" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", y1: "0", x2: "10", y2: "10", stroke: color, strokeWidth: "0.6" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-white/25",
            onPointerDown: beginResize
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 right-0 w-1.5 cursor-ew-resize hover:bg-white/25",
            onPointerDown: beginResize
          }
        ),
        onRemove && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "aria-label": "Remove transition",
            className: cn(
              "relative z-10 flex size-4 items-center justify-center rounded-full bg-background/85 text-foreground/80",
              "opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground",
              "group-hover/transition:opacity-100"
            ),
            onPointerDown: (e) => e.stopPropagation(),
            onClick: (e) => {
              e.stopPropagation();
              onRemove();
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-2.5" })
          }
        ),
        draftMs != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-background/90 px-1 font-mono text-2xs tabular-nums text-foreground", children: [
          Math.round(draftMs),
          "ms"
        ] })
      ]
    }
  );
}
function Timeline() {
  const project = useEditorStore((s) => s.project);
  if (!project) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-panel" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineCanvas, { project });
}
function TimelineCanvas({ project }) {
  const { t: t2 } = useI18n();
  const selection = useEditorStore((s) => s.selection);
  const execute = useEditorStore((s) => s.execute);
  const setSelection = useEditorStore((s) => s.setSelection);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const rippleEnabled = useEditorStore((s) => s.rippleEnabled);
  const setRippleEnabled = useEditorStore((s) => s.setRippleEnabled);
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const zoomLevel = useTimelineViewStore((s) => s.zoomLevel);
  const setPlayhead = useTimelineViewStore((s) => s.setPlayhead);
  const zoomBy = useTimelineViewStore((s) => s.zoomBy);
  const [drag, setDrag] = reactExports.useState(null);
  const dragRef = reactExports.useRef(null);
  const trackRowRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const scrollRef = reactExports.useRef(null);
  const [snapMs, setSnapMs] = reactExports.useState(null);
  const [dropTarget, setDropTarget] = reactExports.useState(null);
  const scene = getScene(project);
  const tracks = [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio];
  const trackBoundsRef = reactExports.useRef([]);
  const captureTrackBounds = reactExports.useCallback(() => {
    trackBoundsRef.current = [...trackRowRefs.current.entries()].map(([id, el]) => {
      const rect = el.getBoundingClientRect();
      return { id, top: rect.top, bottom: rect.bottom };
    });
  }, []);
  const trackIdAtClientY = reactExports.useCallback((clientY) => {
    const bounds = trackBoundsRef.current;
    if (bounds.length === 0) {
      for (const [id, el] of trackRowRefs.current) {
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) return id;
      }
      return null;
    }
    for (const b of bounds) {
      if (clientY >= b.top && clientY <= b.bottom) return b.id;
    }
    return null;
  }, []);
  const clientXToMs = reactExports.useCallback(
    (clientX) => {
      const container = scrollRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const contentX = clientX - rect.left - TRACK_HEADER_WIDTH + container.scrollLeft;
      return Math.max(0, pxToMs(contentX, zoomLevel));
    },
    [zoomLevel]
  );
  const [viewportWidth, setViewportWidth] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fps = project.settings.fps;
  const frameDur = Math.max(1, Math.round(frameDurationMs(fps)));
  const durationMs = Math.max(MIN_CONTENT_MS, getProjectDurationMs(project));
  const contentWidth = Math.max(
    msToPx(durationMs, zoomLevel) + CONTENT_RIGHT_PADDING_PX,
    Math.max(0, viewportWidth - TRACK_HEADER_WIDTH)
  );
  const totalWidth = TRACK_HEADER_WIDTH + contentWidth;
  const snap = reactExports.useCallback((ms) => snapToFrame(ms, fps), [fps]);
  const fitToWindow = reactExports.useCallback(() => {
    const lane = Math.max(0, viewportWidth - TRACK_HEADER_WIDTH) - CONTENT_RIGHT_PADDING_PX;
    const seconds = Math.max(MIN_CONTENT_MS, getProjectDurationMs(project)) / 1e3;
    if (lane <= 0 || seconds <= 0) return;
    useTimelineViewStore.getState().setZoom(lane / seconds / BASE_PPS);
    scrollRef.current?.scrollTo({ left: 0 });
  }, [viewportWidth, project]);
  reactExports.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onWheel = (e) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      const view = useTimelineViewStore.getState();
      const rect = container.getBoundingClientRect();
      const laneX = e.clientX - rect.left - TRACK_HEADER_WIDTH + container.scrollLeft;
      const anchorMs = pxToMs(Math.max(0, laneX), view.zoomLevel);
      const factor = Math.exp(-e.deltaY * 2e-3);
      view.zoomBy(factor);
      const next = useTimelineViewStore.getState().zoomLevel;
      const pointerOffset = e.clientX - rect.left - TRACK_HEADER_WIDTH;
      container.scrollLeft = Math.max(0, msToPx(anchorMs, next) - pointerOffset);
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);
  reactExports.useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const tag = target?.tagName;
      if (target?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        fitToWindow();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fitToWindow]);
  const snapEdgeDetail = reactExports.useCallback(
    (ms, excludeRef) => {
      const thresholdMs = Math.max(frameDur, Math.round(pxToMs(SNAP_THRESHOLD_PX, zoomLevel)));
      let best = ms;
      let bestDist = thresholdMs;
      const consider = (candidate) => {
        const d = Math.abs(candidate - ms);
        if (d < bestDist) {
          bestDist = d;
          best = candidate;
        }
      };
      consider(0);
      consider(playheadMs);
      for (const track of tracks) {
        for (const el of track.elements) {
          if (excludeRef && track.id === excludeRef.trackId && el.id === excludeRef.elementId) continue;
          consider(el.startTime);
          consider(el.startTime + el.duration);
        }
      }
      if (bestDist < thresholdMs) return { ms: Math.max(0, Math.round(best)), hit: true };
      return { ms: snapToFrame(ms, fps), hit: false };
    },
    [frameDur, zoomLevel, playheadMs, tracks, fps]
  );
  const snapEdge = reactExports.useCallback(
    (ms, excludeRef) => snapEdgeDetail(ms, excludeRef).ms,
    [snapEdgeDetail]
  );
  const beginDrag = reactExports.useCallback(
    (state) => {
      captureTrackBounds();
      dragRef.current = state;
      setDrag(state);
    },
    [captureTrackBounds]
  );
  const commitDrag = reactExports.useCallback(
    (d) => {
      if (d.mode === "seek") return;
      if (d.mode === "marquee") {
        const minMs = clientXToMs(Math.min(d.startClientX, d.currentClientX));
        const maxMs = clientXToMs(Math.max(d.startClientX, d.currentClientX));
        const y1 = Math.min(d.startClientY, d.currentClientY);
        const y2 = Math.max(d.startClientY, d.currentClientY);
        const refs = [];
        const allTracks2 = [
          ...scene.tracks.overlay,
          scene.tracks.main,
          ...scene.tracks.audio
        ];
        for (const track of allTracks2) {
          const rowEl = trackRowRefs.current.get(track.id);
          if (!rowEl) continue;
          const rect = rowEl.getBoundingClientRect();
          if (rect.bottom < y1 || rect.top > y2) continue;
          for (const el of track.elements) {
            if (el.startTime < maxMs && el.startTime + el.duration > minMs) {
              refs.push({ trackId: track.id, elementId: el.id });
            }
          }
        }
        if (refs.length > 0) setSelection({ elements: refs, keyframes: [] });
        return;
      }
      const { ref } = d;
      if (d.mode === "move") {
        const requested = snapEdge(d.newStart, ref);
        const movedTrack = d.targetTrackId !== ref.trackId;
        if (d.group.length > 1) {
          const delta = requested - snapEdge(d.startTime, ref);
          if (delta === 0) return;
          const blocked = d.group.some((m) => {
            const el2 = getElement(scene.tracks, m.ref);
            const track = getTrack(scene.tracks, m.ref.trackId);
            if (!el2 || !track) return false;
            const movingIds = new Set(
              d.group.filter((x) => x.ref.trackId === m.ref.trackId).map((x) => x.ref.elementId)
            );
            const start2 = m.startTime + delta;
            return start2 < 0 || track.elements.some(
              (other) => !movingIds.has(other.id) && start2 < other.startTime + other.duration && start2 + el2.duration > other.startTime
            );
          });
          if (blocked) return;
          execute(moveElementsByDeltaCommand(d.group.map((m) => m.ref), delta));
          return;
        }
        const el = getElement(scene.tracks, ref);
        const targetTrack = getTrack(scene.tracks, d.targetTrackId);
        if (!el || !targetTrack) return;
        const start = resolveNonOverlappingStart({
          track: targetTrack,
          startTime: requested,
          duration: el.duration,
          excludeElementId: ref.elementId
        });
        if (start == null) return;
        if (movedTrack) {
          execute(moveElementToTrackCommand(ref, d.targetTrackId, start));
        } else if (start !== d.startTime) {
          execute(moveElementsByDeltaCommand([ref], start - d.startTime));
        }
      } else if (d.mode === "trim-left") {
        const end = d.startTime + d.duration;
        const start = snapEdge(d.newStart, ref);
        execute(
          trimElementCommand(ref, {
            startTime: start,
            duration: Math.max(frameDur, end - start),
            trimStart: Math.max(0, Math.round(d.newTrimStart + (start - d.newStart)))
          })
        );
      } else {
        const el = getElement(scene.tracks, ref);
        const startTime = el?.startTime ?? 0;
        const end = snapEdge(startTime + d.newDuration, ref);
        execute(
          trimElementCommand(ref, {
            duration: Math.max(frameDur, end - startTime),
            trimEnd: Math.max(0, Math.round(d.newTrimEnd))
          })
        );
      }
    },
    [execute, snapEdge, scene, frameDur, clientXToMs, setSelection]
  );
  const pointerRef = reactExports.useRef({ x: 0, y: 0 });
  const applyDragAt = reactExports.useCallback(
    (clientX, clientY) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.mode === "marquee") {
        dragRef.current = { ...d, currentClientX: clientX, currentClientY: clientY };
        setDrag(dragRef.current);
        return;
      }
      const deltaMs = Math.round(pxToMs(clientX - d.startClientX, zoomLevel));
      if (d.mode === "seek") {
        const ms = snap(Math.max(0, d.baseMs + deltaMs));
        setPlayhead(ms);
        return;
      }
      let next = computeDrag(d, deltaMs, frameDur);
      if (next.mode === "move") {
        const snapped = snapEdgeDetail(next.newStart, next.ref);
        next = { ...next, newStart: snapped.ms };
        setSnapMs(snapped.hit ? snapped.ms : null);
        if (next.group.length === 1) {
          const hoveredId = trackIdAtClientY(clientY);
          const el = getElement(scene.tracks, d.ref);
          const hovered = hoveredId ? getTrack(scene.tracks, hoveredId) : null;
          const compatible = el && hovered && trackTypeForElement(el.type) === hovered.type;
          next = { ...next, targetTrackId: compatible ? hoveredId : d.ref.trackId };
        } else {
          next = { ...next, targetTrackId: d.ref.trackId };
        }
      } else if (next.mode === "trim-left") {
        const end = next.startTime + next.duration;
        const snapped = snapEdgeDetail(next.newStart, next.ref);
        const start = Math.min(snapped.ms, end - frameDur);
        next = {
          ...next,
          newStart: start,
          newDuration: Math.max(frameDur, end - start),
          newTrimStart: Math.max(0, Math.round(next.newTrimStart + (start - next.newStart)))
        };
        setSnapMs(snapped.hit ? start : null);
      } else if (next.mode === "trim-right") {
        const el = getElement(scene.tracks, next.ref);
        const startTime = el?.startTime ?? 0;
        const snapped = snapEdgeDetail(startTime + next.newDuration, next.ref);
        const duration = Math.max(frameDur, snapped.ms - startTime);
        next = {
          ...next,
          newTrimEnd: Math.max(0, Math.round(next.newTrimEnd + (next.newDuration - duration))),
          newDuration: duration
        };
        setSnapMs(snapped.hit ? startTime + duration : null);
      }
      dragRef.current = next;
      setDrag(next);
    },
    [
      zoomLevel,
      snap,
      frameDur,
      setPlayhead,
      snapEdgeDetail,
      trackIdAtClientY,
      scene
    ]
  );
  reactExports.useEffect(() => {
    const onMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      applyDragAt(e.clientX, e.clientY);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d) commitDrag(d);
      dragRef.current = null;
      setDrag(null);
      setSnapMs(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [applyDragAt, commitDrag]);
  reactExports.useEffect(() => {
    if (!drag || drag.mode === "seek") return;
    let raf = 0;
    const step = () => {
      const container = scrollRef.current;
      const d = dragRef.current;
      if (container && d) {
        const rect = container.getBoundingClientRect();
        const x = pointerRef.current.x;
        let dx = 0;
        if (x < rect.left + TRACK_HEADER_WIDTH + EDGE_SCROLL_PX) {
          dx = -EDGE_SCROLL_SPEED_PX;
        } else if (x > rect.right - EDGE_SCROLL_PX) {
          dx = EDGE_SCROLL_SPEED_PX;
        }
        if (dx !== 0) {
          const before = container.scrollLeft;
          container.scrollLeft = before + dx;
          const applied = container.scrollLeft - before;
          if (applied !== 0 && dragRef.current) {
            dragRef.current = {
              ...dragRef.current,
              startClientX: dragRef.current.startClientX - applied
            };
            captureTrackBounds();
            applyDragAt(pointerRef.current.x, pointerRef.current.y);
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [drag, applyDragAt, captureTrackBounds]);
  const selectRef = reactExports.useCallback(
    (ref, additive) => {
      const current = useEditorStore.getState().selection;
      const isSelected2 = current.elements.some(
        (r) => r.trackId === ref.trackId && r.elementId === ref.elementId
      );
      if (isSelected2 && !additive) return;
      const elements = additive ? isSelected2 ? current.elements.filter(
        (r) => !(r.trackId === ref.trackId && r.elementId === ref.elementId)
      ) : [...current.elements, ref] : [ref];
      setSelection({ elements, keyframes: [] });
    },
    [setSelection]
  );
  const beginSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ms = snap(Math.max(0, pxToMs(x, zoomLevel)));
    setPlayhead(ms);
    beginDrag({ mode: "seek", startClientX: e.clientX, baseMs: ms });
  };
  const beginMarquee = (e) => {
    const ms = clientXToMs(e.clientX);
    setPlayhead(ms);
    beginDrag({
      mode: "marquee",
      startClientX: e.clientX,
      startClientY: e.clientY,
      currentClientX: e.clientX,
      currentClientY: e.clientY
    });
  };
  const onCanvasPointerDown = (e) => {
    beginMarquee(e);
    setSelection({ elements: [], keyframes: [] });
  };
  const beginMove = (ref, e) => {
    const el = getElement(scene.tracks, ref);
    if (!el) return;
    e.preventDefault();
    const selectionRefs = useEditorStore.getState().selection.elements;
    const inSelection = selectionRefs.some(
      (r) => r.trackId === ref.trackId && r.elementId === ref.elementId
    );
    const refs = inSelection && selectionRefs.length > 1 ? selectionRefs : [ref];
    const group = refs.flatMap((r) => {
      const member = getElement(scene.tracks, r);
      return member ? [{ ref: r, startTime: member.startTime }] : [];
    });
    beginDrag({
      mode: "move",
      ref,
      startClientX: e.clientX,
      startTime: el.startTime,
      duration: el.duration,
      newStart: el.startTime,
      newDuration: el.duration,
      targetTrackId: ref.trackId,
      group
    });
  };
  const beginTrim = (ref, edge, e) => {
    const el = getElement(scene.tracks, ref);
    if (!el) return;
    e.preventDefault();
    if (edge === "trim-left") {
      beginDrag({
        mode: "trim-left",
        ref,
        startClientX: e.clientX,
        startTime: el.startTime,
        duration: el.duration,
        trimStart: el.trimStart ?? 0,
        newStart: el.startTime,
        newDuration: el.duration,
        newTrimStart: el.trimStart ?? 0
      });
    } else {
      beginDrag({
        mode: "trim-right",
        ref,
        startClientX: e.clientX,
        duration: el.duration,
        trimEnd: el.trimEnd ?? 0,
        newDuration: el.duration,
        newTrimEnd: el.trimEnd ?? 0
      });
    }
  };
  const overrideFor = (trackId, elementId) => {
    if (!drag || drag.mode === "seek" || drag.mode === "marquee") return void 0;
    if (drag.mode === "move") {
      const member = drag.group.find(
        (m) => m.ref.trackId === trackId && m.ref.elementId === elementId
      );
      if (!member) return void 0;
      const delta = drag.newStart - drag.startTime;
      return { startTime: member.startTime + delta };
    }
    if (drag.ref.trackId !== trackId || drag.ref.elementId !== elementId) return void 0;
    if (drag.mode === "trim-left") {
      return { startTime: drag.newStart, duration: drag.newDuration };
    }
    return { duration: drag.newDuration };
  };
  const isSelected = (trackId, elementId) => selection.elements.some((r) => r.trackId === trackId && r.elementId === elementId);
  const isTravelling = (trackId, elementId) => drag?.mode === "move" && drag.ref.trackId === trackId && drag.ref.elementId === elementId && drag.targetTrackId !== trackId;
  const ghostFor = (trackId) => {
    if (drag?.mode !== "move" || drag.targetTrackId !== trackId) return null;
    if (drag.ref.trackId === trackId) return null;
    const element = getElement(scene.tracks, drag.ref);
    if (!element) return null;
    const source = getTrack(scene.tracks, drag.ref.trackId);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "pointer-events-none absolute top-1 bottom-1 z-30 flex items-center overflow-hidden rounded-lg px-2.5 ring-2 ring-primary",
        style: {
          left: msToPx(drag.newStart, zoomLevel),
          width: Math.max(2, msToPx(element.duration, zoomLevel)),
          background: trackColor(source?.type ?? "video", 0.35)
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-2xs font-medium text-foreground", children: element.name })
      }
    );
  };
  const addText = () => {
    const startTime = snap(playheadMs);
    execute({
      id: newId("cmd"),
      label: t2("autoEdit.addText"),
      apply: (project2) => {
        const current = getScene(project2);
        let textTrack = current.tracks.overlay.find(
          (tr) => tr.type === "text"
        );
        if (!textTrack) {
          textTrack = createTextTrack();
          project2 = updateTracks(project2, current.id, (tracks2) => ({
            ...tracks2,
            overlay: [...tracks2.overlay, textTrack]
          }));
        }
        const el = createTextElement({ startTime });
        return updateTracks(
          project2,
          project2.currentSceneId,
          (tracks2) => insertElement(tracks2, textTrack.id, el)
        );
      }
    });
  };
  const deleteSelected2 = () => {
    if (selection.elements.length === 0) return;
    execute(removeElementsCommand(selection.elements, t2("autoEdit.delete")));
    setSelection({ elements: [], keyframes: [] });
  };
  const splitSelected2 = () => {
    for (const ref of selection.elements) {
      execute(splitElementCommand(ref, playheadMs, t2("autoEdit.split")));
    }
  };
  const duplicateSelected2 = () => {
    if (selection.elements.length === 0) return;
    const { command, refs } = duplicateElementsCommand(
      selection.elements,
      t2("autoEdit.duplicate")
    );
    execute(command, { elements: refs, keyframes: [] });
  };
  const { onDragOver, onDragLeave, onDrop } = useTimelineDrop({
    scene,
    mediaAssets,
    zoomLevel,
    execute,
    setSelection,
    setDropTarget,
    clientXToMs,
    trackIdAtClientY,
    snapEdge,
    importMediaFiles,
    pickedFromDroppedFiles,
    t: t2
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 flex-col border-t border-border/60 bg-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TimelineToolbar,
      {
        selectionEmpty: selection.elements.length === 0,
        rippleEnabled,
        setRippleEnabled,
        zoomBy,
        addText,
        splitSelected: splitSelected2,
        duplicateSelected: duplicateSelected2,
        deleteSelected: deleteSelected2,
        t: t2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: scrollRef,
        className: "relative flex-1 min-h-0 overflow-auto",
        onDragOver,
        onDragLeave,
        onDrop,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", style: { width: totalWidth, minWidth: "100%" }, children: [
          dropTarget?.cut && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "pointer-events-none absolute inset-y-0 z-40 border-x-2 border-emerald-400 bg-emerald-400/20",
              style: {
                left: TRACK_HEADER_WIDTH + msToPx(dropTarget.cut.ms, zoomLevel) - 14,
                width: 28
              }
            }
          ),
          (snapMs != null || dropTarget != null && !targetsExistingClip(dropTarget.kind) && dropTarget.kind !== "transition") && // Amber, not primary — the playhead is already primary-coloured, and a
          // snap line the same colour is invisible as feedback.
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "pointer-events-none absolute inset-y-0 z-40 w-0.5 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
              style: { left: TRACK_HEADER_WIDTH + msToPx(snapMs ?? dropTarget.ms, zoomLevel) },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-[3px] top-0 size-2 rotate-45 bg-amber-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-[3px] bottom-0 size-2 rotate-45 bg-amber-400" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-30 flex bg-panel", style: { height: RULER_HEIGHT }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "sticky left-0 z-40 shrink-0 border-r border-border/60 bg-panel",
                style: { width: TRACK_HEADER_WIDTH }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", style: { width: contentWidth, height: RULER_HEIGHT }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ruler, { widthPx: contentWidth, zoomLevel, onPointerDown: beginSeek }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "pointer-events-none absolute top-0 h-full",
                  style: { left: msToPx(playheadMs, zoomLevel) },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-[5px] top-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-primary" })
                }
              )
            ] })
          ] }),
          tracks.map((track) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: (el) => {
                if (el) trackRowRefs.current.set(track.id, el);
                else trackRowRefs.current.delete(track.id);
              },
              className: cn(
                "flex rounded-lg",
                drag?.mode === "move" && drag.targetTrackId === track.id && drag.ref.trackId !== track.id && "ring-2 ring-inset ring-primary/70",
                dropTarget?.trackId === track.id && !targetsExistingClip(dropTarget.kind) && "ring-2 ring-inset ring-primary/70"
              ),
              style: { height: trackHeight(track.type), marginTop: TRACK_GAP },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "sticky left-0 z-20 shrink-0 border-r border-border/60 bg-panel",
                    style: { width: TRACK_HEADER_WIDTH },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrackHeader, { track, isMain: track.id === scene.tracks.main.id })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "relative shrink-0",
                    style: { width: contentWidth },
                    onPointerDown: onCanvasPointerDown,
                    children: [
                      track.elements.map((element) => {
                        if (element.type !== "video" && element.type !== "image") return null;
                        const transition = element.transitionToNext;
                        if (!transition || transition.type === "none") return null;
                        const next = nextVisualSibling(track, element.id);
                        if (!next) return null;
                        const ref = { trackId: track.id, elementId: element.id };
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                          TransitionMarker,
                          {
                            boundaryMs: element.startTime + element.duration,
                            transition,
                            trackType: track.type,
                            zoomLevel,
                            minDurationMs: frameDur,
                            maxDurationMs: Math.min(element.duration, next.duration),
                            isSelected: isSelected(track.id, element.id),
                            onSelect: () => setSelection({ elements: [ref], keyframes: [] }),
                            onResize: (durationMs2) => execute(
                              updateTransitionCommand(ref, { type: transition.type, durationMs: durationMs2 })
                            ),
                            onRemove: () => execute(updateTransitionCommand(ref, null))
                          },
                          `tr-${element.id}`
                        );
                      }),
                      ghostFor(track.id),
                      track.elements.map((element) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Clip,
                        {
                          trackId: track.id,
                          element,
                          trackType: track.type,
                          zoomLevel,
                          isSelected: isSelected(track.id, element.id),
                          isTravelling: isTravelling(track.id, element.id),
                          previewUrl: "mediaPath" in element ? mediaAssets[element.mediaPath]?.previewUrl : void 0,
                          isDropTarget: dropTarget?.clip?.trackId === track.id && dropTarget.clip.elementId === element.id,
                          override: overrideFor(track.id, element.id),
                          onSelect: selectRef,
                          onBodyPointerDown: beginMove,
                          onTrimPointerDown: beginTrim
                        },
                        element.id
                      )),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "pointer-events-none absolute inset-y-0 z-20",
                          style: { left: msToPx(playheadMs, zoomLevel) },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-y-0 w-px bg-primary" })
                        }
                      )
                    ]
                  }
                )
              ]
            },
            track.id
          ))
        ] })
      }
    ),
    drag?.mode === "marquee" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "pointer-events-none fixed z-50 rounded-lg border border-primary bg-primary/10",
        style: {
          left: Math.min(drag.startClientX, drag.currentClientX),
          top: Math.min(drag.startClientY, drag.currentClientY),
          width: Math.abs(drag.currentClientX - drag.startClientX),
          height: Math.abs(drag.currentClientY - drag.startClientY)
        }
      }
    )
  ] });
}
function EditorShell() {
  useEditorShortcuts();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureRail, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(EditorHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "vertical", className: "min-h-0 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 62, minSize: 30, className: "min-h-0 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "min-h-0 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 18, minSize: 14, maxSize: 28, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 overflow-hidden border-r border-border/60 bg-panel", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AssetsPanel, {}) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 58, minSize: 30, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PreviewPanel, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 24, minSize: 16, maxSize: 32, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 overflow-hidden border-l border-border/60 bg-panel", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PropertiesPanel, {}) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 38, minSize: 20, className: "min-h-0 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Timeline, {}) })
      ] }) })
    ] })
  ] });
}
function AutoEditFeature() {
  const view = useAutoEditViewStore((s) => s.view);
  const hasProject = useEditorStore((s) => s.project != null);
  return view === "editor" && hasProject ? /* @__PURE__ */ jsxRuntimeExports.jsx(EditorShell, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {});
}
export {
  AutoEditFeature as default
};
