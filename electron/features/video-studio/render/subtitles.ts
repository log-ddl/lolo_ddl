import fs from 'node:fs'
import path from 'node:path'
import type { RenderCaptionInput } from './types'

function escapeFilterPath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

export function buildSubtitleFilter(assPath: string): string {
  const fontsDir = process.env.WINDIR ? path.join(process.env.WINDIR, 'Fonts') : ''
  const filter = `subtitles='${escapeFilterPath(assPath)}'`
  if (fontsDir && fs.existsSync(fontsDir)) {
    return `${filter}:fontsdir='${escapeFilterPath(fontsDir)}'`
  }
  return filter
}

/**
 * Write an Advanced SubStation Alpha (.ass) file from segment captions so
 * ffmpeg's subtitles filter can burn them in with absolute timeline timing.
 * Returns null when there is nothing to burn.
 */
export function writeAssSubtitleFile(
  segments: RenderCaptionInput[],
  width: number,
  height: number,
  fontSizeOverride: number | undefined,
  tempDir: string,
): string | null {
  const captions = segments.filter((s) => s.text && s.text.trim())
  if (captions.length === 0) return null

  const fontSize = Math.max(16, Math.round((fontSizeOverride && fontSizeOverride > 0) ? fontSizeOverride : height * 0.05))
  const marginV = Math.max(24, Math.round(height * 0.06))
  const pad2 = (n: number) => n.toString().padStart(2, '0')
  const formatAssTime = (ms: number) => {
    let cs = Math.max(0, Math.round(ms / 10))
    const h = Math.floor(cs / 360000)
    cs -= h * 360000
    const m = Math.floor(cs / 6000)
    cs -= m * 6000
    const s = Math.floor(cs / 100)
    cs -= s * 100
    return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`
  }
  const sanitizeAssText = (text: string) => text
    .replace(/\{[^}]*\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\r?\n/g, '\\N')
    .replace(/\s+/g, ' ')
    .trim()

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'ScaledBorderAndShadow: yes',
    'WrapStyle: 2',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,Arial,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,2,1,2,48,48,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const dialogue = captions.map((seg) => {
    const text = sanitizeAssText(seg.text)
    if (!text) return null
    return `Dialogue: 0,${formatAssTime(seg.startMs)},${formatAssTime(Math.max(seg.endMs, seg.startMs + 200))},Default,,0,0,0,,${text}`
  }).filter((line): line is string => line !== null)

  if (dialogue.length === 0) return null

  const filePath = path.join(tempDir, 'captions.ass')
  fs.writeFileSync(filePath, [...header, ...dialogue, ''].join('\n'), 'utf-8')
  return filePath
}
