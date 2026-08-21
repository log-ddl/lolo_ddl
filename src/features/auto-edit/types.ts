import type { ParamValues } from "./lib/params";
import type { FrameRate, TimeMs } from "./lib/time";

/**
 * Data model — ported from opencut-classic (`project/types.ts` + `timeline/types.ts`),
 * adapted to this app:
 *   - time = integer milliseconds (not 120000/s ticks),
 *   - media referenced by absolute path (`mediaPath`), not a mediaId + IndexedDB,
 *   - graphic + sticker element/track kinds dropped (not in scope).
 */

/* ------------------------------------------------------------------ */
/* Selection / references                                             */
/* ------------------------------------------------------------------ */

export interface ElementRef {
  trackId: string;
  elementId: string;
}

export interface Bookmark {
  time: TimeMs;
  note?: string;
  color?: string;
  duration?: TimeMs;
}

/* ------------------------------------------------------------------ */
/* Tracks                                                             */
/* ------------------------------------------------------------------ */

export type TrackType = "video" | "text" | "audio" | "effect";

interface BaseTrack {
  id: string;
  name: string;
}

export interface VideoTrack extends BaseTrack {
  type: "video";
  elements: (VideoElement | ImageElement)[];
  muted: boolean;
  hidden: boolean;
}

export interface TextTrack extends BaseTrack {
  type: "text";
  elements: TextElement[];
  hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  elements: AudioElement[];
  muted: boolean;
}

export interface EffectTrack extends BaseTrack {
  type: "effect";
  elements: EffectElement[];
  hidden: boolean;
}

export type TimelineTrack = VideoTrack | TextTrack | AudioTrack | EffectTrack;

export type OverlayTrack = VideoTrack | TextTrack | EffectTrack;

export interface SceneTracks {
  /** Ordered stacked overlay tracks (video/text/effect). Rendered bottom→top. */
  overlay: OverlayTrack[];
  /** Exactly one main video track. */
  main: VideoTrack;
  /** Ordered audio tracks. */
  audio: AudioTrack[];
}

/** Flattened view of every track in render order: overlay (bottom→top), main, audio. */
export function allTracks(tracks: SceneTracks): TimelineTrack[] {
  return [...tracks.overlay, tracks.main, ...tracks.audio];
}

export function findTrack(tracks: SceneTracks, trackId: string): TimelineTrack | null {
  return allTracks(tracks).find((t) => t.id === trackId) ?? null;
}

/* ------------------------------------------------------------------ */
/* Elements                                                           */
/* ------------------------------------------------------------------ */

export interface RetimeConfig {
  /** Playback rate. 1 = normal, 2 = double speed, 0.5 = half speed. */
  rate: number;
  maintainPitch?: boolean;
}

/** Crossfade between adjacent clips (mapped to ffmpeg `xfade` on render). */
export type TransitionType =
  | "none"
  | "fade"
  | "fade_slow"
  | "dip_white"
  | "flash_white"
  | "dissolve"
  | "fade_black"
  | "fade_white"
  | "wipe_left"
  | "wipe_right"
  | "wipe_up"
  | "wipe_down"
  | "slide_left"
  | "slide_right"
  | "smooth_left"
  | "smooth_right"
  | "circle_open"
  | "circle_close"
  | "pixelize"
  | "zoom_in";

export interface TransitionConfig {
  type: TransitionType;
  /** Crossfade length (ms). Clamped to the shorter of the two clips at build time. */
  durationMs: TimeMs;
}

/** Ken Burns–style motion effect applied to a clip (zoom/pan), ported from video-studio. */
export type MotionEffectType =
  | "none"
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "pan_up"
  | "pan_down"
  | "zoom_pan_left"
  | "zoom_pan_right";

interface BaseTimelineElement {
  id: string;
  name: string;
  /** Visible length on the timeline (ms). */
  duration: TimeMs;
  /** Position on the timeline (ms). */
  startTime: TimeMs;
  /** Source trimmed from the head (ms). */
  trimStart: TimeMs;
  /** Source trimmed from the tail (ms). */
  trimEnd: TimeMs;
  /** Real source duration when known (ms); else derived from duration + trim. */
  sourceDuration?: TimeMs;
  animations?: ElementAnimations;
  params: ParamValues;
  hidden?: boolean;
}

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  mediaPath: string;
  isSourceAudioEnabled?: boolean;
  retime?: RetimeConfig;
  effects?: Effect[];
  masks?: Mask[];
  /** Ken Burns–style motion effect (zoom/pan). */
  motionEffect?: MotionEffectType;
  /** Crossfade into the next clip on the same track. */
  transitionToNext?: TransitionConfig;
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  mediaPath: string;
  effects?: Effect[];
  masks?: Mask[];
  /** Ken Burns–style motion effect (zoom/pan). */
  motionEffect?: MotionEffectType;
  /** Crossfade into the next clip on the same track. */
  transitionToNext?: TransitionConfig;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  effects?: Effect[];
}

export interface UploadAudioElement extends BaseTimelineElement {
  type: "audio";
  sourceType: "upload";
  mediaPath: string;
  retime?: RetimeConfig;
}

export interface LibraryAudioElement extends BaseTimelineElement {
  type: "audio";
  sourceType: "library";
  sourceUrl: string;
  retime?: RetimeConfig;
}

export type AudioElement = UploadAudioElement | LibraryAudioElement;

export interface EffectElement extends BaseTimelineElement {
  type: "effect";
  effectType: string;
}

export type TimelineElement =
  | VideoElement
  | ImageElement
  | TextElement
  | AudioElement
  | EffectElement;

export type ElementType = TimelineElement["type"];

/** The track type an element of the given kind belongs on (video + image → video). */
export function trackTypeForElement(type: ElementType): TrackType {
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

export type VisualElement = VideoElement | ImageElement | TextElement;

export const MASKABLE_ELEMENT_TYPES = ["video", "image"] as const;
export type MaskableElement = Extract<TimelineElement, { type: (typeof MASKABLE_ELEMENT_TYPES)[number] }>;

export const RETIMABLE_ELEMENT_TYPES = ["video", "audio"] as const;
export type RetimableElement = Extract<TimelineElement, { type: (typeof RETIMABLE_ELEMENT_TYPES)[number] }>;

export type CreateTimelineElement =
  | Omit<VideoElement, "id">
  | Omit<ImageElement, "id">
  | Omit<TextElement, "id">
  | Omit<AudioElement, "id">
  | Omit<EffectElement, "id">;

/* ------------------------------------------------------------------ */
/* Effects                                                            */
/* ------------------------------------------------------------------ */

export interface Effect {
  id: string;
  type: string;
  params: ParamValues;
  enabled: boolean;
}

export interface EffectDefinition {
  type: string;
  name: string;
  params: import("./lib/params").ParamDefinition[];
}

/* ------------------------------------------------------------------ */
/* Masks                                                              */
/* ------------------------------------------------------------------ */

export interface BaseMaskParams {
  feather: number;
  inverted: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeAlign: "inside" | "center" | "outside";
}

export interface RectangleMaskParams extends BaseMaskParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
}

export interface SplitMaskParams extends BaseMaskParams {
  centerX: number;
  centerY: number;
  rotation: number;
}

export interface FreeformPathMaskParams extends BaseMaskParams {
  path: Array<{ x: number; y: number }>;
  closed: boolean;
  centerX: number;
  centerY: number;
  rotation: number;
  scale: number;
}

export interface RectangleMask {
  id: string;
  type: "rectangle";
  params: RectangleMaskParams;
}

export interface EllipseMask {
  id: string;
  type: "ellipse";
  params: RectangleMaskParams;
}

export interface CinematicBarsMask {
  id: string;
  type: "cinematic-bars";
  params: RectangleMaskParams;
}

export interface SplitMask {
  id: string;
  type: "split";
  params: SplitMaskParams;
}

export interface FreeformPathMask {
  id: string;
  type: "freeform";
  params: FreeformPathMaskParams;
}

export type Mask = RectangleMask | EllipseMask | CinematicBarsMask | SplitMask | FreeformPathMask;

export type MaskType = Mask["type"];

/* ------------------------------------------------------------------ */
/* Animation / keyframes                                              */
/* ------------------------------------------------------------------ */

export type ContinuousKeyframeInterpolation = "linear" | "hold" | "bezier";
export type DiscreteKeyframeInterpolation = "hold";
export type AnimationInterpolation =
  | ContinuousKeyframeInterpolation
  | DiscreteKeyframeInterpolation;

export type ScalarSegmentType = "step" | "linear" | "bezier";
export type TangentMode = "auto" | "aligned" | "broken" | "flat";
export type ChannelExtrapolationMode = "hold" | "linear";

export interface CurveHandle {
  dt: TimeMs;
  dv: number;
}

interface BaseAnimationKeyframe<TValue> {
  id: string;
  /** Relative to the element start time (ms). */
  time: TimeMs;
  value: TValue;
}

export interface ScalarAnimationKey extends BaseAnimationKeyframe<number> {
  leftHandle?: CurveHandle;
  rightHandle?: CurveHandle;
  segmentToNext: ScalarSegmentType;
  tangentMode: TangentMode;
}

export interface DiscreteAnimationKey extends BaseAnimationKeyframe<boolean | string> {}

export interface ScalarChannel {
  keys: ScalarAnimationKey[];
  extrapolation?: { before: ChannelExtrapolationMode; after: ChannelExtrapolationMode };
}

export interface DiscreteChannel {
  keys: DiscreteAnimationKey[];
}

export type ChannelData = ScalarChannel | DiscreteChannel;

export interface CompositeChannelData {
  [componentKey: string]: ChannelData | undefined;
}

export interface ElementAnimations {
  [propertyPath: string]: ChannelData | CompositeChannelData | undefined;
}

/* ------------------------------------------------------------------ */
/* Project / scene                                                    */
/* ------------------------------------------------------------------ */

export type TBackground =
  | { type: "color"; color: string }
  | { type: "blur"; blurIntensity: number };

export interface TCanvasSize {
  width: number;
  height: number;
}

export interface TProjectSettings {
  fps: FrameRate;
  canvasSize: TCanvasSize;
  background: TBackground;
}

export interface TProjectMetadata {
  id: string;
  name: string;
  duration: TimeMs;
  createdAt: number;
  updatedAt: number;
}

export interface TScene {
  id: string;
  name: string;
  isMain: boolean;
  tracks: SceneTracks;
  bookmarks: Bookmark[];
}

export interface TProject {
  schema: "logdd-auto-edit";
  version: number;
  metadata: TProjectMetadata;
  scenes: TScene[];
  currentSceneId: string;
  settings: TProjectSettings;
}

/* ------------------------------------------------------------------ */
/* Media asset registry (editor-side, keyed by path)                  */
/* ------------------------------------------------------------------ */

export interface MediaAsset {
  path: string;
  name: string;
  kind: "video" | "audio" | "image";
  previewUrl: string;
  durationMs: TimeMs;
}

/* ------------------------------------------------------------------ */
/* Selection (editor UI state)                                        */
/* ------------------------------------------------------------------ */

export type SelectionKind = "element" | "effect" | "mask" | "transition";

export interface EditorSelection {
  /** Selected elements by track+element id. */
  elements: ElementRef[];
  /** Selected keyframes. */
  keyframes: Array<{ elementRef: ElementRef; propertyPath: string; keyframeId: string }>;
}
