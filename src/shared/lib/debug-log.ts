export function isDebugLogEnabled(category?: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  const all = localStorage.getItem('DEBUG_LOGS') === '1';
  if (all) return true;
  if (!category) return false;
  return localStorage.getItem(`DEBUG_${category.toUpperCase()}_LOGS`) === '1';
}

export function debugLog(category: string, ...args: unknown[]): void {
  if (isDebugLogEnabled(category)) {
    console.log(...args);
  }
}
