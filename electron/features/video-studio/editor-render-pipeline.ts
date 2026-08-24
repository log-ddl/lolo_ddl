import { dialog } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { runFFmpeg, cancelFFmpeg } from '../../ffmpeg-runtime'
import { buildMotionPlan, NO_MOTION, type MotionPlan } from './render/motion'
import type { RenderMediaEffect } from './render/types'
import type { ExportOptions, MediaVisualLayer, RenderPlan, RenderProgressEvent, SceneEffect, VisualLayer } from '../../../src/features/auto-edit/render/types'

/**
 * Auto Edit render pipeline (main process).
 *
 * The renderer resolves the project into a `RenderPlan` (already-serializable:
 * layers carry resolved trim/retime/transform/opacity/blur, and text is rasterized
 * to PNG data URLs). Here we write the text PNGs to disk and build a single-pass
 * ffmpeg `filter_complex`:
 *
 *   - a `color` background source sized to the canvas and running at the project fps,
 *   - per-layer chains: input trim + retime (`setpts`) + PTS offset, contain-fit
 *     (`scale=…:force_original_aspect_ratio=decrease`), `scale` for scaleX/Y,
 *     `rotate` (transparent corners), `format=rgba`, `gblur`, opacity via
 *     `colorchannelmixer=aa`, then `overlay` with a time window.
 *   - audio: `asetpts` + `atempo` (chained to cover rates outside 0.5–2.0) +
 *     `adelay` + `volume`, mixed with `amix`.
 *
 * Blend modes are mapped to ffmpeg `blend=all_mode=` for opaque full-canvas
 * layers (see `ffmpegBlendMode`); positioned/smaller layers and the HSL-based
 * modes (`hue`/`saturation`/`color`/`luminosity`) fall back to plain `overlay`.
 */

export interface EditorRenderResponse {
  success: boolean
  outputPath?: string
  error?: string
  canceled?: boolean
}

type Emit = (event: RenderProgressEvent) => void

const activeJobs = new Set<string>()

export function cancelEditorRender(jobId: string): boolean {
  activeJobs.delete(jobId)
  return cancelFFmpeg(jobId)
}

export async function pickEditorOutput(defaultName: string): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Xuất video',
    defaultPath: defaultName,
    filters: [{ name: 'MP4', extensions: ['mp4'] }],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
}

export async function renderEditor(
  plan: RenderPlan,
  jobId: string,
  outputPath: string,
  emit: Emit,
  options?: ExportOptions,
): Promise<EditorRenderResponse> {
  const tempDir = path.join(os.tmpdir(), `autoedit-${slug(jobId)}-${crypto.randomBytes(4).toString('hex')}`)
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    const textPaths: string[] = []
    plan.visual.forEach((layer, i) => {
      if (layer.kind === 'text') textPaths.push(writeTextPng(layer.pngDataUrl, tempDir, i))
    })

    emit({ jobId, type: 'stage', stage: 'rendering', message: 'Rendering…' })

    const args = buildArgs(plan, textPaths, outputPath, options)
    const result = await runFFmpeg({
      jobId,
      args,
      totalDurationSec: plan.durationSec,
      onProgress: (progress) => emit({ jobId, type: 'progress', percent: progress.percent }),
      onLog: (line) => emit({ jobId, type: 'log', message: line }),
    })

    if (result.canceled) return { success: false, canceled: true }
    if (!result.success) return { success: false, error: result.error || tail(result.stderr) }
    if (!fs.existsSync(outputPath)) return { success: false, error: 'ffmpeg did not produce an output file' }
    return { success: true, outputPath }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  } finally {
    cleanupTempDir(tempDir)
  }
}

/* ------------------------------------------------------------------ */
/* ffmpeg args                                                         */
/* ------------------------------------------------------------------ */

function buildArgs(plan: RenderPlan, textPaths: string[], outputPath: string, options?: ExportOptions): string[] {
  const W = plan.width
  const H = plan.height
  const fps = fmt(plan.fps)
  const fpsNum = plan.fps

  const args: string[] = ['-y']

  // --- inputs: visual layers (in order), then audio inputs ---
  const inputIndexByLayer: number[] = []
  let textCursor = 0
  let inputCount = 0
  plan.visual.forEach((layer) => {
    inputIndexByLayer.push(inputCount)
    if (layer.kind === 'text') {
      args.push('-loop', '1', '-framerate', fps, '-t', fmt(layer.durSec), '-an', '-i', textPaths[textCursor++])
    } else if (layer.kind === 'video') {
      args.push('-ss', fmt(layer.trimStartSec), '-t', fmt(layer.srcDurSec), '-an', '-i', layer.path)
    } else {
      args.push('-loop', '1', '-framerate', fps, '-t', fmt(layer.durSec), '-an', '-i', layer.path)
    }
    inputCount += 1
  })

  const audioInputIndex: number[] = []
  plan.audio.forEach((a) => {
    audioInputIndex.push(inputCount)
    args.push('-ss', fmt(a.trimStartSec), '-t', fmt(a.srcDurSec), '-vn', '-i', a.path)
    inputCount += 1
  })

  // --- filter_complex ---
  const filters: string[] = []
  const baseLabel = 'base'
  filters.push(`color=c=${plan.backgroundColor}:s=${W}x${H}:r=${fps}:d=${fmt(plan.durationSec)},format=rgba[${baseLabel}]`)

  // Build "overlay units": a single layer, or a chain of xfade'd media layers.
  // Consecutive media layers where each (except the last) carries a
  // `transitionToNext` are folded left into one xfade chain.
  interface OverlayUnit {
    label: string
    startSec: number
    endSec: number
    posX: number
    posY: number
    blendMode: string
    /** True when the layer is an opaque full-canvas frame (safe for `blend`). */
    fullCanvas: boolean
  }
  const units: OverlayUnit[] = []
  let i = 0
  while (i < plan.visual.length) {
    const layer = plan.visual[i]
    const next = plan.visual[i + 1]
    const canTransition = layer.kind !== 'text' && !!layer.transitionToNext && !!next && next.kind !== 'text'

    if (!canTransition) {
      const label = `l${i}`
      filters.push(buildLayerChain(layer, inputIndexByLayer[i], W, H, fpsNum, label))
      const fullCanvas =
        layer.kind !== 'text' &&
        layer.scaleX === 1 && layer.scaleY === 1 &&
        layer.rotateDeg === 0 && layer.posX === 0 && layer.posY === 0
      units.push({ label, startSec: layer.startSec, endSec: layer.startSec + layer.durSec, posX: layer.posX, posY: layer.posY, blendMode: layer.blendMode, fullCanvas })
      i += 1
      continue
    }

    // Fold the maximal run of transitioning media layers (A→B→C→…).
    const startSec = layer.startSec
    const posX = layer.posX
    const posY = layer.posY
    let accLabel = `fx${i}`
    filters.push(mediaXfadeInput(layer, inputIndexByLayer[i], W, H, fpsNum, accLabel))
    let accDur = layer.durSec
    let j = i
    while (j + 1 < plan.visual.length) {
      const cur = plan.visual[j]
      const nxt = plan.visual[j + 1]
      if (cur.kind === 'text' || !cur.transitionToNext || nxt.kind === 'text') break
      const D = cur.transitionToNext.durationSec
      const offset = Math.max(0, accDur - D)
      const inLabel = `fx${j + 1}`
      filters.push(mediaXfadeInput(nxt, inputIndexByLayer[j + 1], W, H, fpsNum, inLabel))
      const outLabel = `fx${j + 1}_x`
      filters.push(`[${accLabel}][${inLabel}]xfade=transition=${cur.transitionToNext.xfade}:duration=${fmt(D)}:offset=${fmt(offset)}[${outLabel}]`)
      accLabel = outLabel
      accDur = accDur + nxt.durSec - D
      j += 1
    }

    const finalLabel = `xf${i}`
    filters.push(`[${accLabel}]setpts=PTS-STARTPTS+${fmt(startSec)}/TB[${finalLabel}]`)
    units.push({ label: finalLabel, startSec, endSec: startSec + accDur, posX, posY, blendMode: 'normal', fullCanvas: false })
    i = j + 1
  }

  let acc = baseLabel
  units.forEach((unit, idx) => {
    const out = `acc${idx + 1}`
    const mode = unit.fullCanvas ? ffmpegBlendMode(unit.blendMode) : null

    if (mode) {
      // Blend modes need two continuous, same-size inputs. The layer chain already
      // yields a full-canvas frame; pad it to the full duration with cloned first/
      // last frames (so `blend`'s framesync never stalls), then apply the blend
      // only inside the layer's time window.
      const padStart = Math.max(0, unit.startSec)
      const padStop = Math.max(0, plan.durationSec - unit.endSec)
      const padded = `${unit.label}_f`
      filters.push(`[${unit.label}]tpad=start_mode=clone:start_duration=${fmt(padStart)}:stop_mode=clone:stop_duration=${fmt(padStop)}[${padded}]`)
      filters.push(
        `[${acc}][${padded}]blend=all_mode=${mode}:enable='between(t,${fmt(unit.startSec)},${fmt(unit.endSec)})'[${out}]`,
      )
    } else {
      const x = `(main_w/2+${fmt(unit.posX)})-overlay_w/2`
      const y = `(main_h/2+${fmt(unit.posY)})-overlay_h/2`
      filters.push(
        `[${acc}][${unit.label}]overlay=${x}:${y}:enable='between(t,${fmt(unit.startSec)},${fmt(unit.endSec)})':eof_action=pass:format=auto[${out}]`,
      )
    }
    acc = out
  })

  // Track-level effects act on the finished composite — everything stacked below
  // them — so they are appended after the overlay chain and gated to their own
  // time window with ffmpeg's `enable` timeline support.
  for (const [idx, effect] of (plan.sceneEffects ?? []).entries()) {
    const filter = sceneEffectFilter(effect)
    if (!filter) continue
    const out = `fx${idx + 1}`
    const endSec = effect.startSec + effect.durSec
    filters.push(
      `[${acc}]${filter}:enable='between(t,${fmt(effect.startSec)},${fmt(endSec)})'[${out}]`,
    )
    acc = out
  }

  // Final pass: optional resolution override (keep compositing in canvas space).
  const outW = options?.outputWidth ?? W
  const outH = options?.outputHeight ?? H
  if (outW !== W || outH !== H) {
    filters.push(`[${acc}]scale=${outW}:${outH}:flags=lanczos[vout]`)
  } else {
    filters.push(`[${acc}]null[vout]`)
  }

  if (plan.audio.length > 0) {
    plan.audio.forEach((a, i) => {
      const idx = audioInputIndex[i]
      filters.push(`[${idx}:a]asetpts=PTS-STARTPTS,${atempoChain(a.rate)},adelay=${Math.round(a.startMs)}:all=1,volume=${fmt(a.volume)}[a${i}]`)
    })
    const mixInputs = plan.audio.map((_, i) => `[a${i}]`).join('')
    filters.push(`${mixInputs}amix=inputs=${plan.audio.length}:duration=longest:normalize=0[aout]`)
  }

  args.push('-filter_complex', filters.join(';'))
  args.push('-map', '[vout]')
  if (plan.audio.length > 0) args.push('-map', '[aout]')

  const codec = options?.codec ?? 'libx264'
  const crf = options?.crf ?? 18
  if (codec === 'h264_nvenc') {
    args.push('-c:v', 'h264_nvenc', '-cq', String(crf), '-preset', 'p4', '-pix_fmt', 'yuv420p')
  } else {
    args.push('-c:v', codec, '-crf', String(crf), '-preset', 'medium', '-pix_fmt', 'yuv420p')
  }
  if (plan.audio.length > 0) args.push('-c:a', 'aac', '-b:a', '192k')
  args.push('-r', fps)
  args.push('-t', fmt(plan.durationSec))
  args.push(outputPath)

  return args
}

/**
 * A track-level effect as an ffmpeg filter, without its `enable` clause (the
 * caller appends that). Returns null for effects with nothing to apply.
 */
function sceneEffectFilter(effect: SceneEffect): string | null {
  if (effect.type === 'blur') {
    if (effect.blurSigma <= 0) return null
    return `gblur=sigma=${fmt(effect.blurSigma)}`
  }
  return null
}

/** ffmpeg scale filter for a media fit mode (contain / cover / stretch).
 * `pad` fills a contain fit out to the full canvas with transparency, so the
 * frame size is exactly W x H — which a Ken Burns move relies on. */
function fitScale(fit: 'contain' | 'cover' | 'stretch', W: number, H: number, pad = false): string {
  if (fit === 'cover') return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`
  if (fit === 'stretch') return `scale=${W}:${H}`
  const contain = `scale=${W}:${H}:force_original_aspect_ratio=decrease`
  return pad ? `${contain},pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black@0` : contain
}

function buildLayerChain(layer: VisualLayer, inputIndex: number, W: number, H: number, fpsNum: number, label: string): string {
  const src = `[${inputIndex}:v]`
  let chain = src
  const motion = layerMotion(layer, W, H, fpsNum)
  // A move crops on whole pixels, so fit the layer to a supersampled canvas and
  // let `zoompan` scale it back down to W x H.
  const fitted = (fit: 'contain' | 'cover' | 'stretch') =>
    motion.filter
      ? `,format=${motion.pixelFormat},${fitScale(fit, W * motion.supersample, H * motion.supersample, true)}${motion.filter}`
      : `,${fitScale(fit, W, H)}`

  if (layer.kind === 'video') {
    // Retime (PTS/rate) + shift so the clip starts at its timeline position.
    chain += `setpts=(PTS-STARTPTS)/${fmt(layer.rate)}+${fmt(layer.startSec)}/TB`
    chain += fitted(layer.fit)
  } else if (layer.kind === 'image') {
    chain += `setpts=PTS-STARTPTS+${fmt(layer.startSec)}/TB`
    chain += fitted(layer.fit)
  } else {
    // Text is rasterized at intrinsic size: no contain-fit, just scaleX/Y.
    chain += `setpts=PTS-STARTPTS+${fmt(layer.startSec)}/TB`
  }

  const sx = fmt(layer.scaleX)
  const sy = fmt(layer.scaleY)
  chain += `,scale=w='max(2,trunc(iw*${sx}))':h='max(2,trunc(ih*${sy}))'`
  chain += `,format=rgba`
  chain += `,rotate=${fmt(layer.rotateDeg)}*PI/180:ow=rotw(${fmt(layer.rotateDeg)}):oh=roth(${fmt(layer.rotateDeg)}):c=black@0`
  if (layer.blurSigma > 0) chain += `,gblur=sigma=${fmt(layer.blurSigma)}`
  if (layer.opacity < 1) chain += `,colorchannelmixer=aa=${fmt(layer.opacity)}`

  return `${chain}[${label}]`
}

/**
 * Normalize a media layer for `xfade`: retime (no start shift), fill+crop to the
 * exact canvas size (so both xfade inputs share a resolution), set a uniform fps,
 * convert to rgba, then keep per-clip blur/opacity. Rotation/scale are assumed
 * identity (the common full-canvas transition case).
 */
function mediaXfadeInput(
  layer: MediaVisualLayer,
  inputIndex: number,
  W: number,
  H: number,
  fpsNum: number,
  label: string,
): string {
  const rate = layer.kind === 'video' ? layer.rate : 1
  const motion = layerMotion(layer, W, H, fpsNum)
  const fillW = W * motion.supersample
  const fillH = H * motion.supersample
  let chain = `[${inputIndex}:v]setpts=(PTS-STARTPTS)/${fmt(rate)}`
  chain += `,scale=${fillW}:${fillH}:force_original_aspect_ratio=increase,crop=${fillW}:${fillH},setsar=1,fps=${fmt(fpsNum)}`
  chain += `${motion.filter},format=rgba`
  if (layer.blurSigma > 0) chain += `,gblur=sigma=${fmt(layer.blurSigma)}`
  if (layer.opacity < 1) chain += `,colorchannelmixer=aa=${fmt(layer.opacity)}`
  return `${chain}[${label}]`
}

/**
 * Ken Burns–style motion for one layer (the effect spans the whole clip).
 * `zoompan` crops on whole input pixels, so the layer is fitted to a
 * supersampled canvas first and the filter scales it back down — see
 * `render/motion.ts`.
 */
function layerMotion(layer: VisualLayer, W: number, H: number, fpsNum: number): MotionPlan {
  if (layer.kind === 'text') return NO_MOTION
  const durationFrames = Math.max(1, Math.round(layer.durSec * fpsNum))
  return buildMotionPlan(layer.motionEffect as RenderMediaEffect, W, H, fpsNum, durationFrames, 0, Number.POSITIVE_INFINITY, { alpha: true })
}

/**
 * Map an editor blend mode (opencut/CSS naming, e.g. `color_dodge`) to an ffmpeg
 * `blend` `all_mode` name. Returns null for `normal` and for the HSL-based modes
 * (`hue`/`saturation`/`color`/`luminosity`) that ffmpeg's `blend` has no direct
 * equivalent for — those fall back to plain alpha `overlay`.
 */
function ffmpegBlendMode(blendMode: string): string | null {
  switch (blendMode) {
    case 'normal': return null
    case 'multiply': return 'multiply'
    case 'screen': return 'screen'
    case 'overlay': return 'overlay'
    case 'darken': return 'darken'
    case 'lighten': return 'lighten'
    case 'color_dodge': return 'dodge'
    case 'color_burn': return 'burn'
    case 'hard_light': return 'hardlight'
    case 'soft_light': return 'softlight'
    case 'difference': return 'difference'
    case 'exclusion': return 'exclusion'
    case 'add': return 'addition'
    default: return null
  }
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** Chain `atempo` filters to cover rates outside ffmpeg's 0.5–2.0 range. */
function atempoChain(rate: number): string {
  if (rate === 1) return 'atempo=1.0'
  let remaining = rate
  const parts: string[] = []
  while (remaining > 2.0) { parts.push('2.0'); remaining /= 2.0 }
  while (remaining < 0.5) { parts.push('0.5'); remaining /= 0.5 }
  parts.push(fmt(remaining))
  return parts.map((p) => `atempo=${p}`).join(',')
}

function writeTextPng(dataUrl: string, tempDir: string, index: number): string {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const filePath = path.join(tempDir, `text_${index}.png`)
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
  return filePath
}

/** Compact float formatting for filter expressions / durations. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Number(n.toFixed(6)).toString()
}

function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'job'
}

function tail(text: string): string {
  const lines = text.trim().split(/\r?\n/)
  return lines.slice(-8).join('\n')
}

function cleanupTempDir(dir: string): void {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
}
