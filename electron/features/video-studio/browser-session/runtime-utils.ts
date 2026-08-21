// Shared small helpers used by the Google Flow and Grok runtimes.

export const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(new Error('Cancelled by user'))
  const timer = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Cancelled by user')); }, { once: true })
})

export function normalizeDelayRange(minValue: unknown, maxValue: unknown, fallbackMin: number, fallbackMax: number): [number, number] {
  const min = Number.isFinite(Number(minValue)) ? Math.max(0, Math.round(Number(minValue))) : fallbackMin
  const max = Number.isFinite(Number(maxValue)) ? Math.max(0, Math.round(Number(maxValue))) : fallbackMax
  return [Math.min(min, max), Math.max(min, max)]
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
