import Papa from "papaparse";

export type LibraryCsvKind = "character" | "scene";

export interface LibraryCsvRow {
  rowNumber: number;
  id: string;
  name: string;
  description: string;
  prompt: string;
  location: string;
}

export interface LibraryCsvResult {
  rows: LibraryCsvRow[];
  errors: string[];
}

type RawCsvRow = Record<string, string | undefined>;

const COMMON_ID_HEADERS = ["id", "ma"];
const COMMON_NAME_HEADERS = ["name", "ten"];
const COMMON_DESCRIPTION_HEADERS = ["description", "mo_ta"];

const CHARACTER_HEADERS = {
  id: [...COMMON_ID_HEADERS, "character_id", "characterid"],
  name: [...COMMON_NAME_HEADERS, "character_name", "ten_nhan_vat"],
  description: [
    ...COMMON_DESCRIPTION_HEADERS,
    "appearance",
    "character_description",
    "mo_ta_nhan_vat",
  ],
  prompt: ["character_prompt", "characterprompt", "prompt", "prompt_nhan_vat"],
};

const SCENE_HEADERS = {
  id: [...COMMON_ID_HEADERS, "scene_id", "sceneid"],
  name: [...COMMON_NAME_HEADERS, "scene_name", "ten_canh"],
  description: [
    ...COMMON_DESCRIPTION_HEADERS,
    "scene_description",
    "mo_ta_canh",
    "notes",
  ],
  prompt: ["scene_prompt", "sceneprompt", "prompt", "prompt_canh"],
  location: ["location", "dia_diem", "setting"],
};

export function normalizeCsvHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function normalizeLibraryName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function readFirst(row: RawCsvRow, headers: string[]): string {
  for (const header of headers) {
    const value = row[header]?.trim();
    if (value) return value;
  }
  return "";
}

export function parseLibraryCsvText(text: string, kind: LibraryCsvKind): LibraryCsvResult {
  const parsed = Papa.parse<RawCsvRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeCsvHeader,
  });

  const headers = kind === "character" ? CHARACTER_HEADERS : SCENE_HEADERS;
  const rows = parsed.data
    .map((row, index): LibraryCsvRow => {
      const sceneHeaders = kind === "scene" ? SCENE_HEADERS : null;
      return {
        rowNumber: index + 2,
        id: readFirst(row, headers.id),
        name: readFirst(row, headers.name),
        description: readFirst(row, headers.description),
        prompt: readFirst(row, headers.prompt),
        location: sceneHeaders ? readFirst(row, sceneHeaders.location) : "",
      };
    })
    .filter((row) => row.id || row.name || row.description || row.prompt || row.location);

  return {
    rows,
    errors: parsed.errors.map((error) => {
      const row = typeof error.row === "number" ? ` (row ${error.row + 2})` : "";
      return `${error.message}${row}`;
    }),
  };
}

export async function parseLibraryCsv(file: File, kind: LibraryCsvKind): Promise<LibraryCsvResult> {
  return parseLibraryCsvText(await file.text(), kind);
}

export function serializeCharacterLibraryCsv(
  characters: ReadonlyArray<{
    id: string;
    name: string;
    description?: string;
    characterPrompt?: string;
  }>
): string {
  return Papa.unparse({
    fields: ["id", "name", "description", "character_prompt"],
    data: characters.map((character) => [
      character.id,
      character.name,
      character.description || "",
      character.characterPrompt || "",
    ]),
  });
}

export function serializeSceneLibraryCsv(
  scenes: ReadonlyArray<{
    id: string;
    name: string;
    description?: string;
    scenePrompt?: string;
  }>
): string {
  return Papa.unparse({
    fields: ["id", "name", "description", "scene_prompt"],
    data: scenes.map((scene) => [
      scene.id,
      scene.name,
      scene.description || "",
      scene.scenePrompt || "",
    ]),
  });
}

export function downloadLibraryCsv(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
