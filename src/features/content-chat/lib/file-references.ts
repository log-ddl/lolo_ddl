/**
 * Detects file paths mentioned in an assistant reply so the UI can offer to open
 * them. Scanning is cached per message id — stored messages are immutable, so
 * one full scan each is enough no matter how often they re-render.
 */

const FILE_EXTENSION_SOURCE = "txt|md|markdown|json|jsonc|csv|tsv|srt|vtt|js|jsx|ts|tsx|css|scss|html|xml|yaml|yml|py|sh|ps1|bat|c|cpp|h|hpp|java|go|rs|sql|toml|ini|env|log|vue|svelte|astro|php|rb|swift|kt|kts|dart|lua|cs|fs|fsx|gradle|properties|conf|config|lock|png|jpe?g|gif|webp|bmp|avif|ico|svg|pdf|mp3|wav|ogg|m4a|aac|flac|opus|mp4|webm|mov|m4v|avi|mkv|docx?|xlsx?|pptx?|zip|rar|7z";
const PREVIEWABLE_FILE_EXTENSION = new RegExp(`\\.(?:${FILE_EXTENSION_SOURCE})$`, "i");

function cleanFileReference(value: string) {
  return value.trim().replace(/^[`'\"]+|[`'\"]+$/g, "");
}

function isFileReference(value: string) {
  const cleaned = cleanFileReference(value);
  return cleaned.length > 2 && cleaned.length < 500 && !/^https?:\/\//i.test(cleaned) && PREVIEWABLE_FILE_EXTENSION.test(cleaned);
}

/** Dựng một lần ở module, không dựng lại mỗi lần quét một tin nhắn. */
const BARE_FILE_REFERENCE = new RegExp(
  `([\\p{L}\\p{N}_().-]+\\.(?:${FILE_EXTENSION_SOURCE}))(?![\\p{L}\\p{N}_-])`,
  "giu",
);
const INLINE_CODE = /`([^`\r\n]+)`/g;
const FENCED_CODE_BLOCK = /```[\s\S]*?(?:```|$)/g;
/** Quá số này thì thôi, hiện nhiều thẻ file cũng không ai bấm hết. */
const MAX_FILE_REFERENCES = 50;

/**
 * Kết quả quét, nhớ theo id tin nhắn.
 *
 * Tin nhắn đã lưu là bất biến, nên quét đúng một lần cho mỗi tin là đủ — quét toàn
 * bộ nội dung, không cắt xén, mà vẫn không phải trả giá ở những lần render sau.
 */
const fileReferenceCache = new Map<string, string[]>();

function extractFileReferences(content: string) {
  const results: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const value = cleanFileReference(raw);
    const key = value.toLocaleLowerCase();
    if (!isFileReference(value) || seen.has(key)) return;
    seen.add(key);
    results.push(value);
  };

  INLINE_CODE.lastIndex = 0;
  for (const match of content.matchAll(INLINE_CODE)) {
    push(match[1]);
    if (results.length >= MAX_FILE_REFERENCES) return results;
  }

  // Bỏ khối code khỏi lượt quét trần: tên biến, khoá JSON và câu văn trong đó
  // hay khớp nhầm với đuôi file, mà chúng gần như không bao giờ là file thật.
  const proseOnly = content.replace(FENCED_CODE_BLOCK, " ");
  BARE_FILE_REFERENCE.lastIndex = 0;
  for (const match of proseOnly.matchAll(BARE_FILE_REFERENCE)) {
    push(match[1]);
    if (results.length >= MAX_FILE_REFERENCES) break;
  }
  return results;
}

export function cachedFileReferences(cacheKey: string | undefined, content: string) {
  if (!cacheKey) return extractFileReferences(content);
  const cached = fileReferenceCache.get(cacheKey);
  if (cached) return cached;
  const result = extractFileReferences(content);
  fileReferenceCache.set(cacheKey, result);
  return result;
}

export function fileTypeLabel(filePath: string) {
  const extension = filePath.split('.').pop()?.toUpperCase();
  return extension ? `${extension} file` : 'File';
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
