import { newId } from "./id";
import type { ParamDefinition, ParamValues } from "./params";
import type { Effect } from "../types";

/**
 * Effect registry — currently just gaussian blur (the one effect opencut ships).
 * Each effect is a named param set stored on a visual element; the preview maps
 * blur intensity → CSS `filter: blur()`, and the ffmpeg renderer will map it to
 * `gblur`.
 */

export interface EffectDef {
  type: string;
  name: string;
  params: ParamDefinition[];
}

export const EFFECT_DEFINITIONS: EffectDef[] = [
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
        step: 1,
      },
    ],
  },
];

export function getEffectDefinition(type: string): EffectDef | undefined {
  return EFFECT_DEFINITIONS.find((d) => d.type === type);
}

export function buildDefaultEffect(type: string): Effect {
  const def = getEffectDefinition(type);
  const params: ParamValues = {};
  for (const p of def?.params ?? []) params[p.key] = p.default;
  return { id: newId("fx"), type, params, enabled: true };
}

/**
 * Blur intensity (0–100) → CSS blur radius in px, mirroring opencut's
 * `intensityToSigma` with a 1920px reference. Preview-only; the renderer maps
 * the same intensity to ffmpeg `gblur` sigma.
 */
export function blurIntensityToPx(intensity: number): number {
  const raw = Number.isFinite(intensity) ? intensity : 0;
  return Math.max(0, raw / 5);
}
