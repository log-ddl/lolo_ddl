export interface ImageNameMatch<T> {
  file: File;
  item: T;
}

export interface ImageNameMatchResult<T> {
  matches: ImageNameMatch<T>[];
  unmatched: number;
  ambiguous: number;
}

export function normalizeImageMatchName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith("image/")
    || /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(file.name);
}

function fileBaseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function matchImageFilesByName<T>(
  files: File[],
  items: T[],
  getId: (item: T) => string,
  getName: (item: T) => string,
): ImageNameMatchResult<T> {
  const itemsByName = new Map<string, T[]>();
  for (const item of items) {
    const key = normalizeImageMatchName(getName(item));
    if (!key) continue;
    const existing = itemsByName.get(key) || [];
    existing.push(item);
    itemsByName.set(key, existing);
  }

  const matches: ImageNameMatch<T>[] = [];
  const usedItemIds = new Set<string>();
  let unmatched = 0;
  let ambiguous = 0;

  for (const file of files) {
    const key = normalizeImageMatchName(fileBaseName(file.name));
    const candidates = itemsByName.get(key) || [];
    if (candidates.length === 0) {
      unmatched += 1;
      continue;
    }
    if (candidates.length !== 1 || usedItemIds.has(getId(candidates[0]))) {
      ambiguous += 1;
      continue;
    }

    usedItemIds.add(getId(candidates[0]));
    matches.push({ file, item: candidates[0] });
  }

  return { matches, unmatched, ambiguous };
}
