import { newId } from "./id";
import type { ParamValue, ParamValues } from "./params";
import type {
  ChannelData,
  CompositeChannelData,
  DiscreteChannel,
  ElementAnimations,
  ScalarAnimationKey,
  ScalarChannel,
} from "../types";

/**
 * Keyframe interpolation — ported from opencut `animation/{interpolation,resolve,bezier}.ts`,
 * simplified to the app's integer-millisecond time model and without color-channel
 * decomposition (colors animate as discrete holds). Used by the preview now and the
 * ffmpeg renderer later, so both agree on what "t" evaluates to.
 */

/* ------------------------------------------------------------------ */
/* Channel classification                                             */
/* ------------------------------------------------------------------ */

export function isLeafChannel(
  data: ChannelData | CompositeChannelData | undefined,
): data is ScalarChannel | DiscreteChannel {
  return !!data && Array.isArray((data as ScalarChannel | DiscreteChannel).keys);
}

export function isScalarChannel(
  channel: ScalarChannel | DiscreteChannel,
): channel is ScalarChannel {
  return "extrapolation" in channel || channel.keys.some((k) => "segmentToNext" in k);
}

/* ------------------------------------------------------------------ */
/* Bezier helpers                                                     */
/* ------------------------------------------------------------------ */

const BEZIER_SOLVE_ITERATIONS = 20;

function getBezierPoint(
  progress: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const mt = 1 - progress;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * progress * p1 +
    3 * mt * progress * progress * p2 +
    progress * progress * progress * p3
  );
}

function getDefaultRightHandle(
  leftKey: ScalarAnimationKey,
  rightKey: ScalarAnimationKey,
): { dt: number; dv: number } {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return { dt: span / 3, dv: valueDelta / 3 };
}

function getDefaultLeftHandle(
  leftKey: ScalarAnimationKey,
  rightKey: ScalarAnimationKey,
): { dt: number; dv: number } {
  const span = rightKey.time - leftKey.time;
  const valueDelta = rightKey.value - leftKey.value;
  return { dt: -span / 3, dv: -valueDelta / 3 };
}

function solveBezierProgressForTime(
  time: number,
  leftKey: ScalarAnimationKey,
  rightKey: ScalarAnimationKey,
): number {
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
      rightKey.time,
    );
    if (estimate < time) lower = mid;
    else upper = mid;
  }
  return (lower + upper) / 2;
}

/* ------------------------------------------------------------------ */
/* Scalar / discrete evaluation                                       */
/* ------------------------------------------------------------------ */

function normalizeScalarKeys(channel: ScalarChannel): ScalarAnimationKey[] {
  return [...channel.keys].sort((a, b) => a.time - b.time);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function extrapolateEdge(
  mode: "hold" | "linear",
  edgeKey: ScalarAnimationKey,
  neighborKey: ScalarAnimationKey | undefined,
  time: number,
): number {
  if (mode === "hold" || !neighborKey) return edgeKey.value;
  const span = neighborKey.time - edgeKey.time;
  if (span === 0) return edgeKey.value;
  return edgeKey.value + ((time - edgeKey.time) / span) * (neighborKey.value - edgeKey.value);
}

export function getScalarValueAtTime(
  channel: ScalarChannel | undefined,
  time: number,
  fallbackValue: number,
): number {
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
        time,
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

    const progress = clamp01((time - left.time) / span);
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
      right.value,
    );
  }

  return last.value;
}

export function getDiscreteValueAtTime(
  channel: DiscreteChannel | undefined,
  time: number,
  fallbackValue: string | boolean,
): string | boolean {
  if (!channel || channel.keys.length === 0) return fallbackValue;
  let current = fallbackValue;
  for (const key of [...channel.keys].sort((a, b) => a.time - b.time)) {
    if (time < key.time) break;
    current = key.value;
  }
  return current;
}

export function resolvePathValueAtTime(
  animations: ElementAnimations | undefined,
  propertyPath: string,
  localTime: number,
  fallbackValue: ParamValue,
): ParamValue {
  const data = animations?.[propertyPath];
  if (!data || !isLeafChannel(data)) return fallbackValue;

  if (typeof fallbackValue === "number") {
    return isScalarChannel(data)
      ? getScalarValueAtTime(data, localTime, fallbackValue)
      : fallbackValue;
  }
  if (typeof fallbackValue === "string" || typeof fallbackValue === "boolean") {
    return isScalarChannel(data)
      ? fallbackValue
      : getDiscreteValueAtTime(data, localTime, fallbackValue);
  }
  return fallbackValue;
}

/** Return element params with any animated keys evaluated at `localTime`. */
export function resolveAnimatedParams(
  params: ParamValues,
  animations: ElementAnimations | undefined,
  localTime: number,
): ParamValues {
  if (!animations) return params;
  const out: ParamValues = { ...params };
  for (const key of Object.keys(animations)) {
    const fallback = params[key];
    if (fallback === undefined) continue;
    out[key] = resolvePathValueAtTime(animations, key, localTime, fallback);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Keyframe mutation (for the command layer)                          */
/* ------------------------------------------------------------------ */

/** Upsert a scalar keyframe at `time` on a property path. */
export function upsertScalarKeyframe(
  animations: ElementAnimations | undefined,
  propertyPath: string,
  time: number,
  value: number,
): ElementAnimations {
  const existing = animations?.[propertyPath];
  const channel: ScalarChannel =
    existing && isLeafChannel(existing) && isScalarChannel(existing)
      ? existing
      : { keys: [] };

  const keys = [...channel.keys];
  const rounded = Math.round(time);
  const idx = keys.findIndex((k) => Math.abs(k.time - rounded) < 1);
  const key: ScalarAnimationKey =
    idx >= 0
      ? { ...keys[idx], value }
      : {
          id: newId("kf"),
          time: rounded,
          value,
          segmentToNext: "linear",
          tangentMode: "flat",
        };
  if (idx >= 0) keys[idx] = key;
  else keys.push(key);
  keys.sort((a, b) => a.time - b.time);

  return { ...animations, [propertyPath]: { ...channel, keys } };
}

/** Remove the scalar keyframe nearest to `time` (within 1 ms). */
export function removeKeyframeAt(
  animations: ElementAnimations | undefined,
  propertyPath: string,
  time: number,
): ElementAnimations {
  const existing = animations?.[propertyPath];
  if (!existing || !isLeafChannel(existing) || !isScalarChannel(existing)) {
    return animations ?? {};
  }
  const rounded = Math.round(time);
  const keys = existing.keys.filter((k) => Math.abs(k.time - rounded) >= 1);
  return { ...animations, [propertyPath]: { ...existing, keys } };
}

export function hasKeyframeAt(
  animations: ElementAnimations | undefined,
  propertyPath: string,
  time: number,
): boolean {
  const existing = animations?.[propertyPath];
  if (!existing || !isLeafChannel(existing) || !isScalarChannel(existing)) return false;
  const rounded = Math.round(time);
  return existing.keys.some((k) => Math.abs(k.time - rounded) < 1);
}

/** Deep-clone an element's keyframes, regenerating keyframe ids (used by duplicate). */
export function cloneAnimations(
  animations: ElementAnimations | undefined,
): ElementAnimations | undefined {
  if (!animations) return undefined;
  const out: ElementAnimations = {};
  for (const [path, data] of Object.entries(animations)) {
    if (!data) continue;
    if (isLeafChannel(data)) {
      out[path] = {
        ...data,
        keys: data.keys.map((key) => ({ ...key, id: newId("kf") })),
      };
    } else {
      const composite: CompositeChannelData = {};
      for (const [componentKey, channel] of Object.entries(data)) {
        if (!channel || !isLeafChannel(channel)) {
          composite[componentKey] = channel;
          continue;
        }
        composite[componentKey] = {
          ...channel,
          keys: channel.keys.map((key) => ({ ...key, id: newId("kf") })),
        };
      }
      out[path] = composite;
    }
  }
  return out;
}
