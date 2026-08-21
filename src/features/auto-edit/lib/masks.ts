import { newId } from "./id";
import type {
  FreeformPathMaskParams,
  Mask,
  RectangleMaskParams,
  SplitMaskParams,
} from "../types";

/**
 * Mask registry (built-in shapes) + CSS clip-path preview.
 * Only video/image elements can be masked (`MASKABLE_ELEMENT_TYPES`). Feather is
 * stored as a param but is not approximated in the DOM preview — the ffmpeg
 * renderer (Phase 6) applies it via `alphaextract→blur→alphamerge`.
 */

export interface MaskDef {
  type: "rectangle" | "ellipse" | "cinematic-bars" | "split" | "freeform";
  name: string;
}

export const MASK_DEFINITIONS: MaskDef[] = [
  { type: "rectangle", name: "Rectangle" },
  { type: "ellipse", name: "Ellipse" },
  { type: "cinematic-bars", name: "Cinematic Bars" },
  { type: "split", name: "Split" },
  { type: "freeform", name: "Freeform" },
];

const SHORT_SIDE_RATIO = 0.6;

/** Default freeform path: a hexagon spanning the element (normalized 0..1). */
const DEFAULT_FREEFORM_PATH: FreeformPathMaskParams["path"] = [
  { x: 0.5, y: 0.16 },
  { x: 0.79, y: 0.32 },
  { x: 0.79, y: 0.68 },
  { x: 0.5, y: 0.84 },
  { x: 0.21, y: 0.68 },
  { x: 0.21, y: 0.32 },
];

export function buildDefaultMask(type: MaskDef["type"]): Mask {
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
        strokeAlign: "inside",
      },
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
        strokeAlign: "inside",
      },
    };
  }

  // rectangle | ellipse | cinematic-bars
  const rectType = type as "rectangle" | "ellipse" | "cinematic-bars";
  const params: RectangleMaskParams = {
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
    strokeAlign: "inside",
  };
  return { id: newId("mask"), type: rectType, params };
}

/** CSS clip-path for a mask, or null if the shape isn't previewable in DOM. */
export function resolveMaskClipPath(mask: Mask): string | null {
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

function rectClipPath(p: RectangleMaskParams): string {
  const w = Math.max(0, p.width * p.scale);
  const h = Math.max(0, p.height * p.scale);
  const left = clamp01(p.centerX - w / 2);
  const right = clamp01(1 - (p.centerX + w / 2));
  const top = clamp01(p.centerY - h / 2);
  const bottom = clamp01(1 - (p.centerY + h / 2));
  return `inset(${pct(top)} ${pct(right)} ${pct(bottom)} ${pct(left)})`;
}

function ellipseClipPath(p: RectangleMaskParams): string {
  const rx = (Math.max(0, p.width * p.scale) / 2) * 100;
  const ry = (Math.max(0, p.height * p.scale) / 2) * 100;
  const cx = clamp01(p.centerX) * 100;
  const cy = clamp01(p.centerY) * 100;
  return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
}

/** Split = keep the half-plane on one side of a line (port of opencut's split mask). */
function splitClipPath(p: SplitMaskParams): string {
  const angleRad = (p.rotation * Math.PI) / 180;
  const normalX = Math.abs(Math.cos(angleRad)) < 1e-10 ? 0 : Math.cos(angleRad);
  const normalY = Math.abs(Math.sin(angleRad)) < 1e-10 ? 0 : Math.sin(angleRad);
  const lineX = 0.5 + p.centerX;
  const lineY = 0.5 + p.centerY;

  const sign = (x: number, y: number) => (x - lineX) * normalX + (y - lineY) * normalY;
  const inside = (x: number, y: number) => sign(x, y) >= 0;

  const edges: [number, number, number, number][] = [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0],
  ];

  const intersection = (x1: number, y1: number, x2: number, y2: number): { x: number; y: number } | null => {
    const d1 = sign(x1, y1);
    const d2 = sign(x2, y2);
    const denom = d1 - d2;
    if (Math.abs(denom) < 1e-10) return null;
    const t = d1 / denom;
    if (t < 0 || t > 1) return null;
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
  };

  const vertices: [number, number][] = [];
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

/** Freeform = polygon from a user path (normalized 0..1, centered at 0.5). */
function freeformClipPath(p: FreeformPathMaskParams): string {
  if (p.path.length < 3) return "none";
  const points = p.path.map((pt) => ({
    x: clamp01(0.5 + p.centerX + (pt.x - 0.5) * p.scale),
    y: clamp01(0.5 + p.centerY + (pt.y - 0.5) * p.scale),
  }));
  return `polygon(${points.map((pt) => `${pct(pt.x)} ${pct(pt.y)}`).join(", ")})`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function pct(v: number): string {
  return `${clamp01(v) * 100}%`;
}
