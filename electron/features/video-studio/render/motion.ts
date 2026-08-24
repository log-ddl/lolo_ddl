import type { RenderMediaEffect } from './types'

/**
 * Ken Burns motion (zoom / pan) as a `zoompan` filter fragment.
 *
 * `zoompan` crops its input on whole input pixels — and on *even* pixels when
 * the frame is chroma subsampled (yuv420p) — so a move whose per-frame step is
 * a fraction of a pixel gets re-rounded on every frame into an uneven
 * 0/1/2px staircase. The picture then shakes instead of gliding, and when the
 * zoom moves at the same time as the pan the crop can even step backwards for
 * a frame. Two things keep the motion smooth:
 *
 * 1. the frame is supersampled and converted to a non-subsampled format before
 *    the filter, so one input pixel is a fraction of an output pixel and the
 *    crop is free to land on odd pixels;
 * 2. the crop's origin and width advance by a whole number of input pixels per
 *    frame, so the velocity is exactly constant for the whole move.
 */

export interface MotionPlan {
  /** Factor the frame must be scaled up by before the filter runs. */
  supersample: number
  /** Pixel format the frame must be in when it reaches the filter. */
  pixelFormat: string
  /** Filter fragment (with a leading comma), or '' when there is no motion. */
  filter: string
}

export const NO_MOTION: MotionPlan = { supersample: 1, pixelFormat: 'yuv420p', filter: '' }

export interface MotionOptions {
  /** Keep the alpha channel through the filter (compositing pipelines). */
  alpha?: boolean
}

interface MotionSpec {
  /** Zoom on the first frame of the move. */
  zoomStart: number
  /** Zoom on the last frame of the move. */
  zoomEnd: number
  /** Axis the crop travels along; null keeps it centred (zoom only). */
  axis: 'x' | 'y' | null
  /** true when the crop travels towards the right/bottom edge. */
  forward: boolean
}

const MOTION_SPECS: Record<Exclude<RenderMediaEffect, 'none'>, MotionSpec> = {
  zoom_in: { zoomStart: 1, zoomEnd: 1.12, axis: null, forward: true },
  zoom_out: { zoomStart: 1.12, zoomEnd: 1, axis: null, forward: true },
  pan_left: { zoomStart: 1.12, zoomEnd: 1.12, axis: 'x', forward: false },
  pan_right: { zoomStart: 1.12, zoomEnd: 1.12, axis: 'x', forward: true },
  pan_up: { zoomStart: 1.12, zoomEnd: 1.12, axis: 'y', forward: false },
  pan_down: { zoomStart: 1.12, zoomEnd: 1.12, axis: 'y', forward: true },
  zoom_pan_left: { zoomStart: 1.08, zoomEnd: 1.14, axis: 'x', forward: false },
  zoom_pan_right: { zoomStart: 1.08, zoomEnd: 1.14, axis: 'x', forward: true },
}

/** 2x already hides the rounding; past 3x the extra scaling costs more render
 * time than the smoothness it buys. */
const MIN_SUPERSAMPLE = 2
const MAX_SUPERSAMPLE = 3
/** Whole input pixels per frame to aim for, so rounding the step costs at most
 * about a quarter of the intended travel. */
const TARGET_STEP_PX = 2
/** Never let the crop collapse, whatever the caller asks for. */
const MIN_CROP_PX = 16

const clampInt = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(value)))

/** Half a step, rounded without ever flipping the sign. */
const halfStep = (step: number) => (step < 0 ? -Math.round(-step / 2) : Math.round(step / 2))

/** `base`, `base+n*t` or `base-n*t`, with the sign folded into the operator. */
const rampExpr = (base: number, step: number, t: string) => {
  if (step === 0) return String(base)
  const ramp = `${Math.abs(step)}*${t}`
  if (base === 0) return step < 0 ? `-${ramp}` : ramp
  return `${base}${step < 0 ? '-' : '+'}${ramp}`
}

export function buildMotionPlan(
  effect: RenderMediaEffect,
  width: number,
  height: number,
  fps: number,
  durationFrames: number,
  effectStartMs = 0,
  effectEndMs = Number.POSITIVE_INFINITY,
  options: MotionOptions = {},
): MotionPlan {
  const spec = effect === 'none' ? undefined : MOTION_SPECS[effect]
  if (!spec || durationFrames <= 1) return NO_MOTION

  const last = durationFrames - 1
  const startFrame = clampInt((effectStartMs / 1000) * fps, 0, last - 1)
  const endFrame = clampInt((effectEndMs / 1000) * fps, startFrame + 1, last)
  const span = endFrame - startFrame

  // How far the crop has to travel, in output pixels, for the effect to read as
  // intended. Supersample enough that both travels are a few whole input pixels
  // per frame; a centred zoom moves its origin by half the width step, so it
  // needs an even step and therefore twice the room.
  const zoomTravel = Math.abs(width / spec.zoomStart - width / spec.zoomEnd)
  const panAxisLen = spec.axis === 'y' ? height : width
  // The crop is furthest from its home edge on the frame where the travel ends,
  // so that frame's zoom is what caps how far it can go.
  const panZoom = spec.forward ? spec.zoomEnd : spec.zoomStart
  const panTravel = spec.axis ? panAxisLen * (1 - 1 / panZoom) : 0
  const zoomNeed = zoomTravel > 0 ? ((spec.axis === null ? 2 : 1) * span) / zoomTravel : 0
  const panNeed = panTravel > 0 ? (TARGET_STEP_PX * span) / panTravel : 0
  const supersample = clampInt(Math.ceil(Math.max(zoomNeed, panNeed)), MIN_SUPERSAMPLE, MAX_SUPERSAMPLE)

  const iw = width * supersample
  const ih = height * supersample

  // Crop width: a whole-pixel step per frame keeps the zoom rate exactly
  // constant instead of re-rounding the scale factor on every frame.
  const w0 = spec.axis === null ? Math.round(iw / spec.zoomStart) & ~1 : Math.round(iw / spec.zoomStart)
  const idealStepW = (w0 - Math.round(iw / spec.zoomEnd)) / span
  let stepW = spec.axis === null ? 2 * Math.round(idealStepW / 2) : Math.round(idealStepW)
  if (stepW === 0 && idealStepW !== 0) stepW = (idealStepW > 0 ? 1 : -1) * (spec.axis === null ? 2 : 1)
  if (stepW > 0) stepW = Math.min(stepW, Math.max(0, Math.floor((w0 - MIN_CROP_PX) / span)))
  if (stepW < 0) stepW = -Math.min(-stepW, Math.max(0, Math.floor((iw - w0) / span)))
  if (spec.axis === null) stepW -= stepW % 2

  const widthAt = (n: number) => w0 - stepW * n
  // Mirrors what the filter derives from the zoom expression below, so the crop
  // bounds and the centring here match the crop it actually takes.
  const heightAt = (n: number) => Math.floor((ih * (widthAt(n) + 0.5)) / iw)
  const sizeAt = (axis: 'x' | 'y', n: number) => (axis === 'y' ? heightAt(n) : widthAt(n))
  const lenOf = (axis: 'x' | 'y') => (axis === 'y' ? ih : iw)

  /** Largest step ≤ |desired| that keeps the crop inside the frame end to end.
   * Both position and size are linear in `n`, so the endpoints decide it. */
  const fitStep = (axis: 'x' | 'y', posAt: (step: number, n: number) => number, desired: number) => {
    const dir = desired < 0 ? -1 : 1
    let step = Math.abs(desired)
    while (step > 0) {
      const inside = [0, span].every((n) => {
        const pos = posAt(dir * step, n)
        return pos >= 0 && pos + sizeAt(axis, n) <= lenOf(axis)
      })
      if (inside) break
      step -= 1
    }
    return dir * step
  }

  // Frames elapsed inside the move: the crop holds its start pose before it and
  // its end pose after it.
  const t = startFrame > 0 ? `min(${span},max(0,on-${startFrame}))` : `min(${span},on)`

  /** The travelling axis: the crop starts against one edge and walks to the
   * other, one whole pixel step per frame. */
  const panExpr = (axis: 'x' | 'y') => {
    const room = lenOf(axis) - Math.min(sizeAt(axis, 0), sizeAt(axis, span))
    const posAt = (step: number, n: number) => (spec.forward ? step * n : step * (span - n))
    const step = fitStep(axis, posAt, Math.max(1, Math.floor(room / span)))
    return spec.forward ? rampExpr(0, step, t) : rampExpr(step * span, -step, t)
  }

  /** The still axis: hold the crop centred. Its origin has to move by half the
   * size step to stay centred, which is only a whole pixel for an even step —
   * rounding it turns a per-frame wobble into a slow, steady drift instead. */
  const centreExpr = (axis: 'x' | 'y') => {
    const pos0 = Math.round((lenOf(axis) - sizeAt(axis, 0)) / 2)
    const sizeStep = axis === 'y' ? (stepW * height) / width : stepW
    const step = fitStep(axis, (s, n) => pos0 + s * n, halfStep(sizeStep))
    return rampExpr(pos0, step, t)
  }

  const zExpr = `${iw}/(${rampExpr(w0, -stepW, t)}+0.5)`
  const xExpr = spec.axis === 'x' ? panExpr('x') : centreExpr('x')
  const yExpr = spec.axis === 'y' ? panExpr('y') : centreExpr('y')
  // yuv420p would snap the crop to even pixels and halve the precision we just
  // paid for; gbrap keeps the alpha that compositing pipelines still need.
  const pixelFormat = options.alpha ? 'gbrap' : 'yuv444p'

  return {
    supersample,
    pixelFormat,
    filter: `,format=${pixelFormat},zoompan=z='${zExpr}':d=1:x='${xExpr}':y='${yExpr}':s=${width}x${height}:fps=${fps}`,
  }
}
