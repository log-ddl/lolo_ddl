/**
 * Param system — flat, dot-notation key/value store used by every element.
 * Mirrors opencut's `params/index.ts`, simplified (drops color-channel decomposition
 * into linear RGBA; we keep color params as plain hex strings).
 */

export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, ParamValue>;

export type ChannelValueKind = "scalar" | "discrete";
export type Interpolation = "linear" | "hold";

export interface BaseParamDefinition<TKey extends string = string> {
  key: TKey;
  label: string;
  /**
   * Abbreviation used when the control is laid out in a narrow two-column grid
   * (e.g. "X" for "Position X"). Falls back to `label`.
   */
  shortLabel?: string;
  keyframable?: boolean;
}

export interface NumberParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "number";
  default: number;
  min: number;
  max?: number;
  step: number;
  unit?: "percent";
}

export interface BooleanParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "boolean";
  default: boolean;
}

export interface ColorParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "color";
  default: string;
}

export interface SelectParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "select";
  default: string;
  options: Array<{ value: string; label: string }>;
}

export interface TextParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "text";
  default: string;
}

export interface FontParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "font";
  default: string;
}

export type ParamDefinition<TKey extends string = string> =
  | NumberParamDefinition<TKey>
  | BooleanParamDefinition<TKey>
  | ColorParamDefinition<TKey>
  | SelectParamDefinition<TKey>
  | TextParamDefinition<TKey>
  | FontParamDefinition<TKey>;

/** Whether a param value is continuous (animatable as scalar) or discrete. */
export function getParamValueKind(
  param: ParamDefinition,
): "number" | "color" | "discrete" {
  switch (param.type) {
    case "number":
      return "number";
    case "color":
      return "color";
    case "boolean":
    case "select":
    case "text":
    case "font":
      return "discrete";
  }
}

export function getParamDefaultInterpolation(
  param: ParamDefinition,
): Interpolation {
  return getParamValueKind(param) === "discrete" ? "hold" : "linear";
}

export function snapToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
}

/** Clamp + step a raw value against a definition. Returns null when the value is invalid for the type. */
export function coerceParamValue(
  param: ParamDefinition,
  value: unknown,
): ParamValue | null {
  switch (param.type) {
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) return null;
      const stepped = snapToStep(value, param.step);
      const max = param.max ?? Number.POSITIVE_INFINITY;
      return Math.min(max, Math.max(param.min, stepped));
    }
    case "boolean":
      return typeof value === "boolean" ? value : null;
    case "color":
    case "text":
    case "font":
      return typeof value === "string" ? value : null;
    case "select":
      return typeof value === "string" && param.options.some((o) => o.value === value)
        ? value
        : null;
  }
}

/** Deep-merge a dotted-key patch onto existing params (keeps untouched keys). */
export function mergeParams(current: ParamValues, patch: ParamValues): ParamValues {
  return { ...current, ...patch };
}
