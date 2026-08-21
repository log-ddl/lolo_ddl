import type { ParamValues } from "./params";
import type { TCanvasSize } from "../types";

/**
 * Transform convention shared by the preview and the ffmpeg renderer.
 *
 * A visual element has a "natural size" (media intrinsic size, or measured text
 * box). Its transform params are then applied as:
 *   - scaleX/scaleY multiply the natural size,
 *   - positionX/positionY offset the element's center from the canvas center (logical px),
 *   - rotate rotates around the element center (degrees, clockwise).
 * Origin (0,0) therefore centers the element on the canvas.
 */

export interface ElementTransform {
  positionX: number;
  positionY: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  opacity: number;
  blendMode: string;
}

function num(value: ParamValues[string] | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getElementTransform(params: ParamValues): ElementTransform {
  return {
    positionX: num(params["transform.positionX"], 0),
    positionY: num(params["transform.positionY"], 0),
    scaleX: num(params["transform.scaleX"], 1),
    scaleY: num(params["transform.scaleY"], 1),
    rotate: num(params["transform.rotate"], 0),
    opacity: num(params["opacity"], 1),
    blendMode:
      typeof params["blendMode"] === "string" ? params["blendMode"] : "normal",
  };
}

export interface ResolvedRect {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function resolveElementRect(
  transform: ElementTransform,
  canvas: TCanvasSize,
  naturalWidth: number,
  naturalHeight: number,
): ResolvedRect {
  return {
    centerX: canvas.width / 2 + transform.positionX,
    centerY: canvas.height / 2 + transform.positionY,
    width: naturalWidth * transform.scaleX,
    height: naturalHeight * transform.scaleY,
  };
}

/** Scale to fit `iw×ih` inside `cw×ch` while preserving aspect ratio (contain). */
export function containSize(
  iw: number,
  ih: number,
  cw: number,
  ch: number,
): { width: number; height: number } {
  if (iw <= 0 || ih <= 0) return { width: cw, height: ch };
  const scale = Math.min(cw / iw, ch / ih);
  return { width: iw * scale, height: ih * scale };
}

/** How a media element fills its frame before scale/position/rotate are applied. */
export type MediaFit = "contain" | "cover" | "stretch";

export function getMediaFit(params: ParamValues): MediaFit {
  const value = params["transform.fit"];
  return value === "cover" || value === "stretch" ? value : "contain";
}

/** Fit `iw×ih` into the `cw×ch` canvas per the media fit mode (no AR lock for stretch). */
export function fitSize(
  fit: MediaFit,
  iw: number,
  ih: number,
  cw: number,
  ch: number,
): { width: number; height: number } {
  if (iw <= 0 || ih <= 0) return { width: cw, height: ch };
  if (fit === "stretch") return { width: cw, height: ch };
  const scale = fit === "cover" ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
  return { width: iw * scale, height: ih * scale };
}

/** CSS transform string for a resolved rect (top-left anchored), used by the DOM preview. */
export function rectToCssTransform(rect: ResolvedRect, rotate: number): string {
  return `translate(${rect.centerX - rect.width / 2}px, ${rect.centerY - rect.height / 2}px) rotate(${rotate}deg)`;
}
