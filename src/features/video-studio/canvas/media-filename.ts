export function mediaFileStem(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').trim().slice(0, 120).replace(/[. ]+$/g, '') || 'media';
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(cleaned) ? `_${cleaned}` : cleaned;
}
