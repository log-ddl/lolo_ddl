/** Stable id generator for editor entities (tracks, elements, effects, keyframes...). */
export function newId(prefix = ""): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}-${id}` : id;
}
