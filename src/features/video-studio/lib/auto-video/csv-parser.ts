import Papa from 'papaparse';
import type { CsvRow } from './types';

export interface CsvParseError {
  row: number;
  message: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: CsvParseError[];
}

const HEADER_MAP: Record<string, keyof CsvRow> = {
  index: 'index',
  text: 'text',
  image_path: 'imagePath',
  imagepath: 'imagePath',
  image: 'imagePath',
  video_path: 'videoPath',
  videopath: 'videoPath',
  video: 'videoPath',
  voice: 'voice',
  speaker: 'voice',
};

interface RawRow {
  [key: string]: string | undefined;
}

export function parseCsv(raw: string): CsvParseResult {
  const errors: CsvParseError[] = [];
  const rows: CsvRow[] = [];

  const parsed = Papa.parse<RawRow>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push({ row: err.row ?? -1, message: `${err.code}: ${err.message}` });
    }
  }

  if (!parsed.data || parsed.data.length === 0) {
    if (errors.length === 0) errors.push({ row: -1, message: 'No rows parsed from CSV' });
    return { rows, errors };
  }

  parsed.data.forEach((rawRow, i) => {
    const normalized: Partial<CsvRow> = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const mapped = HEADER_MAP[key];
      if (!mapped) continue;
      const trimmed = (value ?? '').trim();
      if (mapped === 'index') {
        normalized.index = trimmed ? parseInt(trimmed, 10) : i + 1;
      } else {
        (normalized as Record<string, string>)[mapped] = trimmed;
      }
    }

    // Voice IS the spoken text in our model — if a CSV omits the "text" column
    // (the format we export), fall back to voice. Skip rows where both are empty.
    const voice = normalized.voice ?? '';
    const text = (normalized.text && normalized.text.trim()) ? normalized.text : voice;
    if (!text) return;

    rows.push({
      index: normalized.index ?? i + 1,
      text,
      imagePath: normalized.imagePath ?? '',
      videoPath: normalized.videoPath ?? '',
      voice: voice || text,
    });
  });

  return { rows, errors };
}
