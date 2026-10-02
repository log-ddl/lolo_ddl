/** Conservative ~one-minute requests; actual duration depends on language and delivery. */
export function splitCloneText(text: string): string[] {
  const chunks: string[] = []
  let remaining = text.trim()
  while (remaining) {
    // Bound both words and characters (including scripts without word spaces).
    let end = Array.from(remaining).slice(0, 900).join('').length
    let units = 0
    for (const token of remaining.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu)) {
      const weight = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(token[0]) ? 0.625 : 1
      if (units + weight > 150) { end = Math.min(end, token.index!); break }
      units += weight
      if (token.index! >= end) break
    }
    if (end >= remaining.length) { chunks.push(remaining); break }
    const window = remaining.slice(0, end)
    const floor = end * 0.4
    const lastBoundary = (pattern: RegExp) => {
      let found = 0
      for (const match of window.matchAll(pattern)) {
        const boundary = match.index! + match[0].length
        if (boundary >= floor) found = boundary
      }
      return found
    }
    // Prefer full sentences; fall back to a clause or word for long sentences.
    const cut = lastBoundary(/[.!?…]["'”’)]*(?:\s+|$)|[。！？]|\n+/gu)
      || lastBoundary(/[,;:，；：]\s*|\s+/gu) || end
    const chunk = remaining.slice(0, cut).trim()
    if (chunk) chunks.push(chunk)
    remaining = remaining.slice(cut).trimStart()
  }
  return chunks
}

export function planCloneParts(text: string, splitMode?: string): string[] {
  const requested = splitMode === 'line' ? text.split(/\r?\n/)
    : splitMode === 'sentence' ? text.split(/(?<=[.!?…。！？])\s+|\n+/u) : [text]
  return requested.flatMap(splitCloneText)
}
