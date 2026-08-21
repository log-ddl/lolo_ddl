function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Returns the URL only when it is a well-formed http(s) URL, otherwise undefined. */
export function sanitizeExternalUrl(value?: string) {
  if (!isNonEmptyString(value)) return undefined
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }
    return parsed.toString()
  } catch {
    return undefined
  }
}
