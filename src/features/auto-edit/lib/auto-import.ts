import { MOTION_EFFECTS } from "./motion";
import { TRANSITIONS } from "./transitions";
import type { MotionEffectType, TransitionType } from "../types";

/**
 * Auto import — turns a JSON or CSV shot list into rows the timeline builder can
 * lay down.
 *
 * Only four things matter; every other column or key is ignored on purpose, so a
 * file exported from another tool can be fed in unchanged:
 *   1. the visual (image or video),
 *   2. the voice track that goes with it,
 *   3. the motion effect,
 *   4. the transition into the next shot.
 *
 * Header/key matching is deliberately loose — accent-insensitive and punctuation-
 * insensitive — because these files are written by hand as often as generated.
 */

export interface AutoRow {
  /** Path or filename of the visual. Resolved against imported media later. */
  media: string;
  /** Path or filename of the voice-over for this shot, if any. */
  voice?: string;
  motion?: MotionEffectType;
  transition?: TransitionType;
  /** Explicit shot length, when the file specifies one. */
  durationMs?: number;
}

export interface AutoParseResult {
  rows: AutoRow[];
  /** Entries dropped because they carried no usable visual. */
  skipped: number;
  warnings: string[];
}

/* ------------------------------------------------------------------ */
/* Key matching                                                       */
/* ------------------------------------------------------------------ */

/** Lowercase, strip accents and punctuation: "Hiệu ứng" and "media_effect" → comparable. */
function normalizeKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Ordered by preference: an explicit video wins over an image when a row has both.
const VIDEO_KEYS = ["video", "videopath", "videofile", "clip", "clippath", "movie"];
const IMAGE_KEYS = [
  "image",
  "imagepath",
  "imagefile",
  "img",
  "imgpath",
  "anh",
  "diranh",
  "duonganh",
  "hinh",
  "hinhanh",
  "picture",
  "photo",
];
const MEDIA_KEYS = ["media", "mediapath", "file", "filepath", "path", "src", "source", "dir"];

const VOICE_KEYS = [
  "voice",
  "voicepath",
  "voicefile",
  "voiceover",
  "audio",
  "audiopath",
  "narration",
  "tts",
  "giong",
  "giongdoc",
  "amthanh",
  "loithoai",
];

const MOTION_KEYS = [
  "effect",
  "effects",
  "motion",
  "motioneffect",
  "mediaeffect",
  "hieuung",
  "chuyendong",
  "kenburns",
];

const TRANSITION_KEYS = [
  "transition",
  "transitions",
  "transitiontonext",
  "chuyencanh",
  "chuyentiep",
];

const DURATION_KEYS = [
  "duration",
  "durationms",
  "length",
  "lengthms",
  "thoiluong",
  "dodai",
];

/** First non-empty value among `keys`, looked up on a key-normalized record. */
function pick(record: Map<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record.get(key);
    if (value != null && value.trim() !== "") return value.trim();
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Value matching                                                     */
/* ------------------------------------------------------------------ */

const MOTION_BY_KEY = new Map(MOTION_EFFECTS.map((m) => [normalizeKey(m.type), m.type]));
for (const m of MOTION_EFFECTS) MOTION_BY_KEY.set(normalizeKey(m.label), m.type);

const TRANSITION_BY_KEY = new Map(TRANSITIONS.map((t) => [normalizeKey(t.type), t.type]));
for (const t of TRANSITIONS) TRANSITION_BY_KEY.set(normalizeKey(t.label), t.type);

export function parseMotion(value: string | undefined): MotionEffectType | undefined {
  if (!value) return undefined;
  return MOTION_BY_KEY.get(normalizeKey(value));
}

export function parseTransition(value: string | undefined): TransitionType | undefined {
  if (!value) return undefined;
  return TRANSITION_BY_KEY.get(normalizeKey(value));
}

/** Accepts milliseconds or a seconds value with a unit ("2.5s", "2500ms", "3"). */
function parseDurationMs(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^\s*([0-9]*\.?[0-9]+)\s*(ms|s|sec|secs|giay)?\s*$/i.exec(value);
  if (!match) return undefined;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "ms") return Math.round(amount);
  if (unit) return Math.round(amount * 1000);
  // Unitless: treat large numbers as ms and small ones as seconds.
  return amount >= 1000 ? Math.round(amount) : Math.round(amount * 1000);
}

/* ------------------------------------------------------------------ */
/* Row extraction                                                     */
/* ------------------------------------------------------------------ */

function rowFromRecord(record: Map<string, string>): AutoRow | null {
  // A row's visual: explicit video first, then image, then a generic media column.
  const media =
    pick(record, VIDEO_KEYS) ?? pick(record, IMAGE_KEYS) ?? pick(record, MEDIA_KEYS);
  if (!media) return null;

  return {
    media,
    voice: pick(record, VOICE_KEYS),
    motion: parseMotion(pick(record, MOTION_KEYS)),
    transition: parseTransition(pick(record, TRANSITION_KEYS)),
    durationMs: parseDurationMs(pick(record, DURATION_KEYS)),
  };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                */
/* ------------------------------------------------------------------ */

/**
 * Minimal RFC 4180 reader: handles quoted fields, escaped quotes, embedded commas
 * and newlines, and CRLF. Enough for hand-written and exported shot lists.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function parseCsv(text: string): AutoParseResult {
  const delimiter = text.includes("\t") && !text.includes(",") ? "\t" : ",";
  const table = parseDelimited(text, delimiter);
  if (table.length < 2) {
    return { rows: [], skipped: 0, warnings: ["csvNeedsHeader"] };
  }

  const header = table[0].map(normalizeKey);
  const rows: AutoRow[] = [];
  let skipped = 0;

  for (const line of table.slice(1)) {
    const record = new Map<string, string>();
    header.forEach((key, index) => {
      if (key) record.set(key, line[index] ?? "");
    });
    const row = rowFromRecord(record);
    if (row) rows.push(row);
    else skipped++;
  }

  return { rows, skipped, warnings: [] };
}

/* ------------------------------------------------------------------ */
/* JSON                                                               */
/* ------------------------------------------------------------------ */

/** Common wrappers a generated shot list might use around its array. */
const ARRAY_KEYS = ["shots", "rows", "items", "segments", "scenes", "clips", "data", "list"];

function jsonArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of ARRAY_KEYS) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    // Fall back to the first array-valued property, whatever it is called.
    for (const value of Object.values(record)) {
      if (Array.isArray(value)) return value;
    }
  }
  return null;
}

function parseJson(text: string): AutoParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], skipped: 0, warnings: ["jsonInvalid"] };
  }

  const array = jsonArray(parsed);
  if (!array) return { rows: [], skipped: 0, warnings: ["jsonNoArray"] };

  const rows: AutoRow[] = [];
  let skipped = 0;
  for (const entry of array) {
    if (!entry || typeof entry !== "object") {
      skipped++;
      continue;
    }
    const record = new Map<string, string>();
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (value == null) continue;
      if (typeof value === "object") continue;
      record.set(normalizeKey(key), String(value));
    }
    const row = rowFromRecord(record);
    if (row) rows.push(row);
    else skipped++;
  }
  return { rows, skipped, warnings: [] };
}

/* ------------------------------------------------------------------ */
/* Entry point                                                        */
/* ------------------------------------------------------------------ */

export function parseAutoRows(text: string, fileName: string): AutoParseResult {
  const looksJson = /\.json$/i.test(fileName) || /^\s*[[{]/.test(text);
  return looksJson ? parseJson(text) : parseCsv(text);
}
