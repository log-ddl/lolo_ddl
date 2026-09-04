import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, W as WandSparkles, b6 as Upload, c as Save, d as Trash2, L as LoaderCircle, aC as Square, bg as Palette, u as CircleAlert, N as ChevronDown, O as ChevronRight, F as Film, ae as Ellipsis, q as RefreshCw, K as Plus, P as Pencil, B as MapPin, Y as Clock, bh as User, a0 as Circle, t as CircleCheck, G as Clapperboard, a3 as Check, a6 as Copy, X, m as ArrowRight, D as Download, Q as ListChecks } from "./lucide-react-DHCwBhKI.js";
import { p as normalizeRefImageIndexes, q as getFeatureConfig, t as callChatAPI, v as safeParseJson, w as cleanJsonString, x as runConcurrentOrdered, n as normalizeVideoLength, j as useScriptStore, y as callFeatureAPI, z as saveImageToLocal, u as useActiveScriptProject, e as useActiveDirectorProject, m as useAPIConfigStore, h as useCharacterLibraryStore, f as useSceneStore, D as DEFAULT_STYLE_ID, A as getFeatureNotConfiguredMessage, s as setProjectVisualStyleId } from "./autopilot-store-5JX3PjC8.js";
import { s as splitVideoPromptVoiceOver, c as cleanVoiceOverText, u as useAutoVideoStore, a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
import { P as normalizeLongScriptSkillWordThreshold, b as useVideoStudioSettingsStore, Q as normalizeLongScriptSkillChunkConcurrency, p as persist, d as createJSONStorage, a as useI18n, I as Input, R as MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD, S as MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD, B as Button, t as toast, c as cn, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogFooter, E as AlertDialog, H as AlertDialogContent, J as AlertDialogHeader, K as AlertDialogTitle, L as AlertDialogDescription, M as AlertDialogFooter, N as AlertDialogCancel, O as AlertDialogAction, n as isCliProvider, u as useLicenseStore } from "./index-DI8hnspe.js";
import { c as calculateProgress, g as getShotCompletionStatus, a as getPromptTargetStatus, u as useMediaPanelStore, V as VIDEO_STUDIO_FEATURE_FLAGS, C as Checkbox } from "./entry--3YkNZ1p.js";
import "./model-registry-B3C-u_uk.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { L as Label } from "./label-CEtfDDyg.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-eJGB6k9g.js";
import { S as StylePicker } from "./index-RTeyZCqD.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { S as ScrollArea, D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-BC-MjFZS.js";
import { S as Separator } from "./separator-Cu5BjUUB.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-DC6gTyzy.js";
import { T as TaskInfoButton } from "./task-info-button-6_NaUIsa.js";
import "./supabase-DI0hoIb9.js";
import "./cors-fetch-CkwbEcad.js";
import "./progress-CiMxjjHG.js";
import "./popover-CDkCw224.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
function cleanLocationString(location) {
  return location.replace(/\s*characters?[：:].*/gi, "").replace(/\s*roles?[：:].*/gi, "").replace(/\s*time[：:].*/gi, "").trim();
}
function parseScenes(episodeText) {
  const scenes = [];
  const sceneHeaderRegex = /^\*{0,2}(\d+-\d+)\s+(day|night|dawn|dusk|morning|evening)?\s*(interior|exterior|int\/ext)?\s*(.+)?\*{0,2}$/gim;
  const sceneMatches = [...episodeText.matchAll(sceneHeaderRegex)];
  if (sceneMatches.length === 0) {
    return parseAlternativeSceneFormat(episodeText);
  }
  for (let i = 0; i < sceneMatches.length; i++) {
    const match = sceneMatches[i];
    const sceneNumber = match[1];
    const timeOfDay = (match[2] || "day").toLowerCase();
    const interior = (match[3] || "").toLowerCase();
    const location = cleanLocationString(match[4]?.trim() || "Unknown location");
    const startIndex = match.index + match[0].length;
    const endIndex = i < sceneMatches.length - 1 ? sceneMatches[i + 1].index : episodeText.length;
    const content = episodeText.slice(startIndex, endIndex).trim();
    scenes.push({
      sceneHeader: [sceneNumber, timeOfDay, interior, location].filter(Boolean).join(" "),
      characters: parseCharacters(content),
      content,
      dialogues: parseDialogues(content),
      actions: parseActions(content),
      subtitles: parseSubtitles(content),
      weather: detectWeather(content, parseActions(content)),
      timeOfDay
    });
  }
  return scenes;
}
function parseAlternativeSceneFormat(text) {
  const scenes = [];
  const altRegex = /(?:Scene\s*(\d+)|\[Scene\s*:?\s*([^\]]+)\])/gi;
  const matches = [...text.matchAll(altRegex)];
  if (matches.length === 0) {
    return [{
      sceneHeader: "Main Scene",
      characters: parseCharacters(text),
      content: text,
      dialogues: parseDialogues(text),
      actions: parseActions(text),
      subtitles: parseSubtitles(text)
    }];
  }
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const startIndex = match.index + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const content = text.slice(startIndex, endIndex).trim();
    scenes.push({
      sceneHeader: match[0].replace(/[\[\]]/g, "").trim(),
      characters: parseCharacters(content),
      content,
      dialogues: parseDialogues(content),
      actions: parseActions(content),
      subtitles: parseSubtitles(content)
    });
  }
  return scenes;
}
function detectWeather(content, actions) {
  const fullText = `${content} ${actions.join(" ")}`.toLowerCase();
  if (/storm|thunderstorm|downpour/.test(fullText)) return "Storm";
  if (/light rain|drizzle/.test(fullText)) return "Light rain";
  if (/rain|wet/.test(fullText)) return "Rain";
  if (/blizzard/.test(fullText)) return "Blizzard";
  if (/snow/.test(fullText)) return "Snow";
  if (/heavy fog/.test(fullText)) return "Heavy fog";
  if (/fog|mist/.test(fullText)) return "Fog";
  if (/strong wind|gale/.test(fullText)) return "Strong wind";
  if (/wind|breeze/.test(fullText)) return "Breeze";
  if (/overcast|cloudy/.test(fullText)) return "Overcast";
  if (/sunny|clear sky/.test(fullText)) return "Sunny";
  return void 0;
}
function parseCharacters(text) {
  const characters = /* @__PURE__ */ new Set();
  const charLineMatch = text.match(/Characters?[：:]\s*([^\n]+)/i);
  if (charLineMatch) {
    charLineMatch[1].split(/[;,，、]/).map((item) => item.trim()).filter(Boolean).forEach((name) => characters.add(name));
  }
  const dialogueRegex = /^([^:\(\[\n\-*]{1,40})[:](?:\s*\([^\)]+\))?/gm;
  for (const match of text.matchAll(dialogueRegex)) {
    const name = match[1].trim();
    if (name && !/^(subtitle|voiceover|narration|scene|characters?)$/i.test(name)) characters.add(name);
  }
  return Array.from(characters);
}
function parseDialogues(text) {
  const dialogues = [];
  const dialogueRegex = /^([^:\(\[\n\-*]{1,40})[:]\s*(?:\(([^\)]+)\))?\s*(.+)$/gm;
  for (const match of text.matchAll(dialogueRegex)) {
    const character = match[1].trim();
    const parenthetical = match[2]?.trim();
    const line = match[3]?.trim();
    if (character && line && !/^(subtitle|voiceover|narration|scene|characters?)$/i.test(character)) {
      dialogues.push({ character, parenthetical, line });
    }
  }
  return dialogues;
}
function parseActions(text) {
  const actions = [];
  const actionRegex = /^(?:[-*•]|Action\s*:)\s*(.+)$/gim;
  for (const match of text.matchAll(actionRegex)) {
    const action = match[1].trim();
    if (action) actions.push(action);
  }
  return actions;
}
function parseSubtitles(text) {
  return [...text.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
}
function buildScriptPromptControlBlock(_settings) {
  return `
Prompt generation context:
- Do not bake the app visual style preset into generated prompt fields. Keep style only if it is explicitly present in the source text or skill instructions.`;
}
const SCRIPT_SINGLE_PASS_SYSTEM_PROMPT = `You are a professional director and prompt engineer. Convert the input into top-level optional production chunks for an image-to-video workflow.

Return strictly valid JSON only. No extra text, no markdown fences.

JSON contract:
{
  "meta": {
    "workflowName": "single-pass script import",
    "outputs": ["characterPrompt", "scenePrompt", "imagePrompt", "videoPrompt", "videoLength"],
    "mergeMode": "replace"
  },
  "episodes": [
    {
      "index": 1,
      "title": "optional episode title"
    }
  ],
  "characters": [
    {
      "name": "canonical character name",
      "description": "short description used by Director when @Name is referenced",
      "characterPrompt": "English prompt for generating this character image"
    }
  ],
  "scenes": [
    {
      "episodeIndex": 1,
      "name": "canonical scene/location name",
      "description": "short scene description used by Director context",
      "scenePrompt": "English prompt for generating the reusable scene/background image"
    }
  ],
  "shots": [
    {
      "episodeIndex": 1,
      "sceneName": "scene/location name matching a scenes[] item when possible",
      "imagePrompt": "English first-frame image prompt using @Name anchors for known characters",
      "videoPrompt": "English motion/video prompt using @Name anchors for known characters",
      "videoLength": 4,
      "ref_image": [1]
    }
  ]
}

Rules:
- All top-level arrays are optional. Include only arrays that are relevant to the input.
- episodes[] is optional metadata; if used, keep it to index/title unless the input clearly provides more.
- characters[] and scenes[] are reusable anchors/assets, not hierarchy containers.
- shots[] is top-level. Do not nest shots inside episodes or scenes.
- Character details belong only in characters.description and characters.characterPrompt, not inside shot prompts.
- Shot prompts must reference known characters only with @Name or @[Full Name].
- Scene details follow the same split as characters: description for Director context, scenePrompt for scene image generation.
- Keep imagePrompt static: describe the first frame only, not future motion.
- Keep videoPrompt dynamic: describe only motion/change/camera movement.
- Use ref_image only when a shot should use previously generated shot images as visual references. Store 1-based source shot indexes, e.g. shot 2 referencing shot 1 uses "ref_image": [1].
- videoLength must be exactly 4, 6, or 8. Use 4 when uncertain.
- All prompt fields must be English.`;
function buildScriptSinglePassUserPrompt(context) {
  return `${context.promptControl}

Input:
${context.scanText}`;
}
const SCRIPT_SKILL_SYSTEM_PROMPT = `You are running a Script Skill for a video production app.

Return strictly valid JSON only. No extra text, no markdown fences.

Minimal JSON contract:
- Include meta when possible: { "workflowName": string, "outputs": string[], "mergeMode"?: string }.
- If generating characterPrompt, use top-level characters[] items with: name, description, characterPrompt.
- If generating scenePrompt, use top-level scenes[] items with: name, description, scenePrompt.
- If generating imagePrompt, videoPrompt, videoLength, or shot image references, use top-level shots[] items with episodeIndex, optional sceneName, ref_image, and only the requested prompt fields.
- videoLength must be exactly 4, 6, or 8. Use 4 when uncertain.
- episodes[] is optional metadata; if used, keep it to index/title.
- Do not generate IDs; the app creates IDs.
- Follow the user's skill instructions for all creative, stylistic, reference, and prompt-content decisions.`;
function buildScriptSkillUserPrompt(context) {
  return `${context.promptControl}

[SKILL]
${context.skillText}

[USER INPUT]
${context.scanText}`;
}
const SCRIPT_CHUNK_BOUNDARY_SYSTEM_PROMPT = `You split long textover/script input into semantic production chunks.

Return strictly valid JSON only. No markdown fences.

JSON contract:
{
  "chunks": [
    {
      "chunkId": "chunk_01",
      "title": "short semantic title",
      "startParagraph": 1,
      "endParagraph": 5
    }
  ]
}

Rules:
- Use the provided 1-based paragraph numbers only.
- Every paragraph must be covered exactly once.
- Chunks must be contiguous and ordered.
- Do not rewrite or quote source text.
- Prefer semantic beat boundaries over equal length.
- Keep chunks reasonably balanced unless a beat naturally needs more text.`;
function buildScriptChunkBoundaryUserPrompt(numberedParagraphs) {
  return `[NUMBERED PARAGRAPHS]
${numberedParagraphs}`;
}
const SCRIPT_CANONICAL_MEMORY_SYSTEM_PROMPT = `You create canonical reusable prompt memory before chunk-level generation.

Return strictly valid JSON only. No markdown fences.

JSON contract:
{
  "characters": [
    {
      "name": "canonical character name",
      "description": "short stable descriptor",
      "characterPrompt": "English reusable character prompt"
    }
  ],
  "scenes": [
    {
      "name": "canonical scene/location name",
      "description": "short stable descriptor",
      "scenePrompt": "English reusable scene/location prompt"
    }
  ]
}

Rules:
- Only include characters when characterPrompt is requested.
- Only include scenes/locations when scenePrompt is requested.
- Follow the user's skill for style and prompt content.
- Do not create shots, imagePrompt, videoPrompt, episodes, ids, or extra fields.
- If the input does not contain enough information for a requested category, return an empty array for it.`;
function buildScriptCanonicalMemoryUserPrompt(context) {
  return `${context.promptControl}

[REQUESTED OUTPUTS]
${context.outputs.join(", ")}

[SKILL]
${context.skillText}

[FULL USER INPUT]
${context.scanText}`;
}
function buildScriptSkillChunkUserPrompt(context) {
  return `${context.promptControl}

[LONG SCRIPT CHUNK MODE]
You are processing chunk ${context.chunkIndex}/${context.totalChunks}.
Requested outputs: ${context.requestedOutputs.join(", ")}

Rules:
- Process only this chunk.
- Return the same JSON contract used by the skill system prompt.
- Include only requested output fields.
- Reuse canonical characters/scenes exactly when provided.
- Do not rewrite, summarize, or skip details from the chunk.
- Keep episodeIndex as 1 unless the chunk explicitly says otherwise.

[CANONICAL MEMORY]
${context.canonicalMemory || "None"}

[SKILL]
${context.skillText}

[CHUNK SOURCE TEXT]
${context.chunkText}`;
}
function buildSingleEpisodeTitleSynopsisSystemPrompt(context) {
  return `You are a screenplay structure analyst. Based on the series background and the current episode content, generate an episode title and synopsis.
${context.seriesContext ? `
[Series Context]
${context.seriesContext}
` : ""}Title: ${context.title}
Genre: ${context.genre || "Unknown"}
${context.era ? `Era: ${context.era}` : ""}

Return valid JSON in this format:
{
  "title": "A concise 6-15 word episode title that reflects the core conflict or turning point",
  "synopsis": "A 100-200 word synopsis covering the main events of the episode",
  "keyEvents": ["Key event 1", "Key event 2", "Key event 3"]
}`;
}
function buildSingleEpisodeTitleSynopsisUserPrompt(episodeIndex, contentSummary) {
  return `Episode ${episodeIndex} content:
${contentSummary}`;
}
function preprocessLineBreaks(text) {
  const lineCount = text.split("\n").length;
  const avgLineLen = text.length / lineCount;
  if (lineCount > 5 && avgLineLen < 500) {
    return { text, inserted: false };
  }
  let result = text;
  result = result.replace(
    /(?<!\n)(?=\*{0,2}(?:Episode\s+\d+|Chapter\s+\d+|Act\s+\d+)[：:]?)/gi,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?=\d+[.)]\s*[A-Za-z][^\n]{2,})/g,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?<![\d:])(?=\d+-\d+\s+[A-Za-z])/g,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?=(?:[-*•]|Action\s*:))/gi,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?<![A-Za-z:])(?=[A-Z][A-Za-z\s]{1,40}[\(][^\)]{0,20}[\)][：:])/g,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?<![A-Za-z:])(?!Age[：:]|Gender[：:]|Role[：:]|Identity[：:]|Personality[：:])(?=[A-Z][A-Za-z\s]{1,40}[：:])/g,
    "\n"
  );
  result = result.replace(
    /(?<!\n)(?=(?:note|notes|supplement)[：:])/gi,
    "\n"
  );
  result = result.replace(
    /([.!?;])\s*(?=[A-Z][A-Za-z\s]{1,40}[：:]\s*(?:Age[：:]|Gender[：:]|Role[：:]|Identity[：:]))/g,
    "$1\n"
  );
  result = result.replace(/^\n+/, "");
  const inserted = result !== text;
  if (inserted) {
    const newLineCount = result.split("\n").length;
    console.log(`[preprocessLineBreaks] Inserted line breaks: ${lineCount} lines -> ${newLineCount} lines`);
  }
  return { text: result, inserted };
}
const SCRIPT_SKILL_OUTPUT_TARGETS = [
  "characterPrompt",
  "scenePrompt",
  "imagePrompt",
  "videoPrompt",
  "videoLength",
  "ref_image"
];
const DEFAULT_SCRIPT_SKILL_OUTPUTS = [
  "characterPrompt",
  "scenePrompt",
  "imagePrompt",
  "videoPrompt",
  "videoLength",
  "ref_image"
];
function normalizeScriptSkillOutputs(outputs) {
  if (!Array.isArray(outputs)) return [...DEFAULT_SCRIPT_SKILL_OUTPUTS];
  const normalized = outputs.filter(
    (output) => SCRIPT_SKILL_OUTPUT_TARGETS.includes(output)
  );
  return normalized.length > 0 ? normalized : [...DEFAULT_SCRIPT_SKILL_OUTPUTS];
}
function normalizeScriptSkillMeta(meta) {
  const value = meta && typeof meta === "object" ? meta : {};
  const workflowName = typeof value.workflowName === "string" ? value.workflowName : void 0;
  const mergeMode = typeof value.mergeMode === "string" ? value.mergeMode : void 0;
  return {
    workflowName,
    outputs: normalizeScriptSkillOutputs(value.outputs),
    mergeMode
  };
}
function hasRequestedShotPrompt(shot, outputs) {
  if (outputs.includes("imagePrompt") && shot.imagePrompt?.trim()) return true;
  if (outputs.includes("videoPrompt") && shot.videoPrompt?.trim()) return true;
  if (outputs.includes("ref_image") && normalizeRefImageIndexes(shot.ref_image).length > 0) return true;
  return false;
}
const LONG_SCRIPT_MIN_PARAGRAPHS = 8;
const CHUNK_GENERATION_MAX_ATTEMPTS = 2;
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function stableTextFingerprint(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(36)}`;
}
function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new Error("Cancelled by user");
  }
}
function isCancelledError(error) {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || /cancelled|canceled|aborted|abort/i.test(error.message);
}
function splitSourceParagraphs(text) {
  const blocks = text.split(/\n\s*\n+/).map((item) => item.trim()).filter(Boolean);
  const units = blocks.length >= LONG_SCRIPT_MIN_PARAGRAPHS ? blocks : text.split(/(?<=[.!?。！？])\s+/u).map((item) => item.trim()).filter(Boolean);
  return units.map((item, index) => ({ index: index + 1, text: item }));
}
function shouldUseLongScriptSkillPipeline(fullText, hasSkill) {
  const paragraphs = splitSourceParagraphs(fullText);
  const threshold = normalizeLongScriptSkillWordThreshold(
    useVideoStudioSettingsStore.getState().scriptImport.longScriptSkillWordThreshold
  );
  return countWords(fullText) >= threshold && paragraphs.length >= 2;
}
function buildNumberedParagraphs(paragraphs) {
  return paragraphs.map((paragraph) => `[${paragraph.index}] ${paragraph.text}`).join("\n\n");
}
function normalizeBoundaries(rawChunks, paragraphCount) {
  const normalized = rawChunks.map((chunk, index) => {
    const startParagraph = Math.max(1, Math.min(paragraphCount, Number(chunk.startParagraph) || index + 1));
    const endParagraph = Math.max(startParagraph, Math.min(paragraphCount, Number(chunk.endParagraph) || startParagraph));
    return {
      chunkId: String(chunk.chunkId || `chunk_${String(index + 1).padStart(2, "0")}`),
      title: typeof chunk.title === "string" ? chunk.title : void 0,
      startParagraph,
      endParagraph
    };
  }).sort((a, b) => a.startParagraph - b.startParagraph);
  const result = [];
  let cursor = 1;
  for (const chunk of normalized) {
    const startParagraph = cursor;
    const endParagraph = Math.max(startParagraph, chunk.endParagraph);
    result.push({ ...chunk, startParagraph, endParagraph });
    cursor = endParagraph + 1;
    if (cursor > paragraphCount) break;
  }
  if (result.length === 0 || cursor <= paragraphCount) {
    result.push({
      chunkId: `chunk_${String(result.length + 1).padStart(2, "0")}`,
      startParagraph: cursor,
      endParagraph: paragraphCount
    });
  }
  return result.filter((chunk) => chunk.startParagraph <= paragraphCount && chunk.endParagraph >= chunk.startParagraph);
}
function extractChunkText(paragraphs, boundary) {
  return paragraphs.filter((paragraph) => paragraph.index >= boundary.startParagraph && paragraph.index <= boundary.endParagraph).map((paragraph) => paragraph.text).join("\n\n");
}
function mergeParsedSkillChunks(parsedChunks, memory, outputs) {
  const charactersByName = /* @__PURE__ */ new Map();
  const scenesByName = /* @__PURE__ */ new Map();
  const shots = [];
  const addCharacter = (character) => {
    const key = normalizeRef(character?.name);
    if (!key) return;
    charactersByName.set(key, { ...charactersByName.get(key), ...character });
  };
  const addScene = (scene) => {
    const key = normalizeRef(scene?.name || scene?.description || scene?.sceneRef);
    if (!key) return;
    scenesByName.set(key, { ...scenesByName.get(key), ...scene });
  };
  if (outputs.includes("characterPrompt")) (Array.isArray(memory?.characters) ? memory.characters : []).forEach(addCharacter);
  if (outputs.includes("scenePrompt")) (Array.isArray(memory?.scenes) ? memory.scenes : []).forEach(addScene);
  parsedChunks.forEach((parsed) => {
    if (outputs.includes("characterPrompt")) (Array.isArray(parsed?.characters) ? parsed.characters : []).forEach(addCharacter);
    if (outputs.includes("scenePrompt")) (Array.isArray(parsed?.scenes) ? parsed.scenes : []).forEach(addScene);
    const shotOffset = shots.length;
    normalizeShotList(parsed?.shots).forEach((shot) => {
      const localRefs = normalizeRefImageIndexes(getShotRefImageInput(shot));
      shots.push({
        ...shot,
        ...localRefs.length > 0 ? { ref_image: localRefs.map((index) => index + shotOffset) } : {}
      });
    });
  });
  return {
    meta: {
      workflowName: "long-script chunked skill import",
      outputs,
      mergeMode: parsedChunks.find((parsed) => parsed?.meta?.mergeMode)?.meta?.mergeMode
    },
    episodes: [{ index: 1, title: "Episode 1" }],
    characters: Array.from(charactersByName.values()),
    scenes: Array.from(scenesByName.values()),
    shots
  };
}
function normalizeShotList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
}
function parseSkillJsonResponse(response) {
  const cleaned = cleanJsonString(response);
  const parsed = safeParseJson(cleaned, null);
  if (parsed) return parsed;
  const metaMatch = cleaned.match(/"meta"\s*:\s*(\{[\s\S]*?\})\s*,\s*"shots"\s*:/);
  const shotsStart = cleaned.search(/"shots"\s*:/);
  if (!metaMatch || shotsStart === -1) return {};
  const shotObjects = extractJsonObjectsAfter(cleaned.slice(shotsStart));
  if (shotObjects.length === 0) return {};
  return {
    meta: safeParseJson(metaMatch[1], {}),
    shots: shotObjects.map((item) => safeParseJson(item, {})).filter((item) => Object.keys(item).length > 0)
  };
}
function extractJsonObjectsAfter(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return objects.filter((objectText) => objectText.includes("imagePrompt") || objectText.includes("videoPrompt"));
}
function extractMentionedNames(...prompts) {
  const names = /* @__PURE__ */ new Set();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
      const name = cleanAnchorName$1(match[1] || match[2] || "");
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}
function extractMentionedSceneNames(...prompts) {
  const names = /* @__PURE__ */ new Set();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@scene\[([^\]]+)\]/giu)) {
      const name = cleanAnchorName$1(match[1] || "");
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}
function cleanAnchorName$1(value) {
  return String(value || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
}
function stripCharacterAnchor(value) {
  const raw = cleanAnchorName$1(value);
  const bracketed = raw.match(/^@\[([^\]]+)\]$/u);
  if (bracketed) return cleanAnchorName$1(bracketed[1]);
  const bare = raw.match(/^@(?!scene\[)([\p{L}\p{N}_-]+)$/iu);
  if (bare) return cleanAnchorName$1(bare[1]);
  return raw;
}
function stripSceneAnchor(value) {
  const raw = cleanAnchorName$1(value);
  const bracketed = raw.match(/^@scene\[([^\]]+)\]$/iu);
  if (bracketed) return cleanAnchorName$1(bracketed[1]);
  return raw;
}
const normalizeRef = (value) => String(value || "").trim().toLowerCase();
const normalizeCharacterRef = (value) => normalizeRef(stripCharacterAnchor(value));
const normalizeSceneRef = (value) => normalizeRef(stripSceneAnchor(value));
function hasSceneData(scene) {
  return Boolean(
    String(scene?.name || "").trim() || String(scene?.description || "").trim() || String(scene?.scenePrompt || scene?.characterPrompt || "").trim()
  );
}
function getScenePromptInput(scene) {
  return String(scene?.scenePrompt || scene?.characterPrompt || "").trim();
}
function isLegacySceneCharacter(entry, referencedSceneNames) {
  const nameKey = normalizeSceneRef(entry?.name || entry?.sceneRef || entry?.description);
  const promptText = String(entry?.scenePrompt || entry?.characterPrompt || entry?.description || "").toLowerCase();
  return Boolean(
    String(entry?.scenePrompt || "").trim() || nameKey && referencedSceneNames.has(nameKey) || promptText.includes("full scene reference") || promptText.includes("wide camera-neutral") || promptText.includes("no characters, no props") || promptText.includes("no temporary action")
  );
}
function getReferencedSceneNameKeys(shots) {
  const keys = /* @__PURE__ */ new Set();
  shots.forEach((shot) => {
    const sceneRef = getShotSceneRef(shot);
    const key = normalizeSceneRef(sceneRef);
    if (key) keys.add(key);
  });
  return keys;
}
function getShotVideoLengthInput(shot) {
  return shot.videoLength ?? shot.video_length ?? shot.videoDuration ?? shot.video_duration ?? shot.duration ?? shot.seconds ?? shot.length ?? shot.videoLenght ?? shot.videolenght;
}
function getShotRefImageInput(shot) {
  return shot.ref_image ?? shot.refImage ?? shot.refImages ?? shot.ref_images ?? shot.shotRefs ?? shot.shot_refs;
}
function makeShot(shot, shotIndex, episodeId, sceneRefId = "") {
  const imagePrompt = shot.imagePrompt || "";
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt || "");
  const voiceOver = cleanVoiceOverText(shot.voiceOver) || parts.voiceOver;
  const videoPrompt = parts.videoPrompt;
  return {
    id: `shot-${shotIndex}`,
    index: shotIndex,
    episodeId,
    sceneRefId,
    imagePrompt,
    videoPrompt,
    voiceOver,
    videoLength: normalizeVideoLength(getShotVideoLengthInput(shot)),
    ref_image: normalizeRefImageIndexes(getShotRefImageInput(shot)),
    hasCharacters: extractMentionedNames(imagePrompt, videoPrompt).length > 0,
    keyframes: imagePrompt ? [{ id: `kf-${shotIndex}-start`, type: "start", imagePrompt, imageUrl: "", status: "idle" }] : [],
    imageStatus: "idle",
    imageProgress: 0,
    videoStatus: "idle",
    videoProgress: 0
  };
}
function getShotSceneRef(shot) {
  const directRef = String(shot.sceneRef || shot.sceneRefId || shot.sceneName || "").trim();
  if (directRef) return extractMentionedSceneNames(directRef)[0] || stripSceneAnchor(directRef);
  return extractMentionedSceneNames(shot.imagePrompt || "", shot.videoPrompt || "")[0] || "";
}
function registerSceneRefs(sceneRefMap, scene, sceneId) {
  [scene.id, scene.name, scene.description, scene.sceneRef].forEach((ref) => {
    const key = normalizeSceneRef(ref);
    if (key) sceneRefMap.set(key, sceneId);
  });
}
function ensureMentionedCharacters(characters, names) {
  for (const rawName of names) {
    const name = stripCharacterAnchor(rawName);
    const key = normalizeCharacterRef(name);
    if (!key || characters.some((character) => normalizeCharacterRef(character.name) === key)) continue;
    characters.push({
      id: `char_${characters.length + 1}`,
      name
    });
  }
}
function ensureSceneForRef(scriptScenes, sceneRefMap, sceneRef) {
  const sceneName = stripSceneAnchor(sceneRef);
  const key = normalizeSceneRef(sceneName);
  if (!key) return "";
  const mappedId = sceneRefMap.get(key);
  if (mappedId) return mappedId;
  const existing = scriptScenes.find((scene) => normalizeSceneRef(scene.name) === key);
  if (existing) {
    registerSceneRefs(sceneRefMap, { id: existing.id, name: existing.name, description: existing.description, sceneRef }, existing.id);
    return existing.id;
  }
  const sceneId = `scene_${scriptScenes.length + 1}`;
  scriptScenes.push({
    id: sceneId,
    name: sceneName,
    description: sceneName,
    time: "day",
    atmosphere: "",
    scenePrompt: ""
  });
  registerSceneRefs(sceneRefMap, { id: sceneId, name: sceneName, description: sceneName, sceneRef }, sceneId);
  return sceneId;
}
async function parseSinglePassContent(fullText, parseOpts, settings) {
  const promptControl = buildScriptPromptControlBlock();
  const hasSkill = Boolean(settings?.skillText?.trim());
  const systemPrompt = hasSkill ? SCRIPT_SKILL_SYSTEM_PROMPT : SCRIPT_SINGLE_PASS_SYSTEM_PROMPT;
  const response = hasSkill && shouldUseLongScriptSkillPipeline(fullText) ? await parseLongScriptSkillResponse(fullText, parseOpts, settings.skillText, promptControl, settings) : await callChatAPI(
    systemPrompt,
    hasSkill ? buildScriptSkillUserPrompt({ promptControl, skillText: settings.skillText, scanText: fullText }) : buildScriptSinglePassUserPrompt({ promptControl, scanText: fullText }),
    { ...parseOpts, maxTokens: 12e3 }
  );
  const parsed = parseSkillJsonResponse(response);
  const skillMeta = normalizeScriptSkillMeta(parsed.meta);
  const parsedEpisodes = Array.isArray(parsed.episodes) ? parsed.episodes : [];
  const parsedTopLevelShots = Array.isArray(parsed.shots) ? parsed.shots : [];
  const parsedCharacters = Array.isArray(parsed.characters) ? parsed.characters : [];
  const parsedScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  const referencedSceneNames = getReferencedSceneNameKeys(parsedTopLevelShots);
  const legacySceneCharacters = parsedCharacters.filter((entry) => isLegacySceneCharacter(entry, referencedSceneNames));
  const legacySceneCharacterKeys = new Set(legacySceneCharacters.map((entry) => normalizeCharacterRef(entry?.name)));
  const shouldImportSceneAssets = !hasSkill || skillMeta.outputs.includes("scenePrompt") || parsedScenes.length > 0 || legacySceneCharacters.length > 0;
  const shouldImportCharacters = skillMeta.outputs.includes("characterPrompt");
  const shouldImportEpisodes = !hasSkill;
  const characters = [];
  (shouldImportCharacters ? parsedCharacters : []).forEach((character) => {
    if (legacySceneCharacterKeys.has(normalizeCharacterRef(character?.name))) return;
    const name = stripCharacterAnchor(character.name) || `Character ${characters.length + 1}`;
    const key = normalizeCharacterRef(name);
    if (!key || characters.some((existing) => normalizeCharacterRef(existing.name) === key)) return;
    characters.push({
      id: `char_${characters.length + 1}`,
      name,
      appearance: character.description || void 0,
      characterPrompt: character.characterPrompt || character.description || void 0
    });
  });
  const scriptScenes = [];
  const sceneRefMap = /* @__PURE__ */ new Map();
  const shots = [];
  const episodes = [];
  const rawEpisodes = [];
  (shouldImportSceneAssets ? [...parsedScenes, ...legacySceneCharacters] : []).forEach((scene) => {
    if (!hasSceneData(scene)) return;
    const legacyLocation = stripSceneAnchor(scene.location);
    const sceneName = stripSceneAnchor(scene.name || scene.sceneRef || legacyLocation || scene.description) || `Scene ${scriptScenes.length + 1}`;
    const sceneKey = normalizeSceneRef(sceneName);
    if (sceneKey && sceneRefMap.has(sceneKey)) return;
    const sceneId = `scene_${scriptScenes.length + 1}`;
    scriptScenes.push({
      id: sceneId,
      name: sceneName,
      description: stripSceneAnchor(scene.description) || legacyLocation || sceneName,
      time: "day",
      atmosphere: "",
      scenePrompt: getScenePromptInput(scene)
    });
    registerSceneRefs(sceneRefMap, scene, sceneId);
  });
  (shouldImportEpisodes ? parsedEpisodes : []).forEach((episode, episodeIndex) => {
    const episodeNumber = episode.index || episodeIndex + 1;
    const title = episode.title || `Episode ${episodeNumber}`;
    episodes.push({ id: `ep_${episodeIndex + 1}`, index: episodeNumber, title, sceneIds: [] });
    rawEpisodes.push({ episodeIndex: episodeNumber, title, rawContent: fullText, scenes: [], shotGenerationStatus: "completed" });
  });
  (Array.isArray(parsed.shots) ? parsed.shots : []).forEach((shot) => {
    const imagePrompt = shot.imagePrompt || "";
    const videoPrompt = shot.videoPrompt || "";
    const ref_image = normalizeRefImageIndexes(getShotRefImageInput(shot));
    if (!hasRequestedShotPrompt({ imagePrompt, videoPrompt, ref_image }, skillMeta.outputs)) return;
    const nextIndex = Number(shot.episodeIndex || 1) || 1;
    let episode = episodes.find((item) => item.index === nextIndex);
    if (!episode) {
      episode = { id: `ep_${episodes.length + 1}`, index: nextIndex, title: shot.episodeTitle || `Episode ${nextIndex}`, sceneIds: [] };
      episodes.push(episode);
      rawEpisodes.push({ episodeIndex: nextIndex, title: shot.episodeTitle || `Episode ${nextIndex}`, rawContent: fullText, scenes: [], shotGenerationStatus: "completed" });
    }
    ensureMentionedCharacters(characters, extractMentionedNames(imagePrompt, videoPrompt));
    const shotSceneRef = getShotSceneRef(shot);
    const sceneRefId = shotSceneRef ? ensureSceneForRef(scriptScenes, sceneRefMap, shotSceneRef) : "";
    if (sceneRefId && episode && !episode.sceneIds.includes(sceneRefId)) episode.sceneIds.push(sceneRefId);
    shots.push(makeShot(shot, shots.length + 1, episode.id, sceneRefId));
  });
  if (episodes.length === 0) {
    episodes.push({ id: "ep_1", index: 1, title: "Episode 1", sceneIds: [] });
    rawEpisodes.push({ episodeIndex: 1, title: "Episode 1", rawContent: fullText, scenes: [], shotGenerationStatus: "completed" });
  }
  const scriptData = { title: "Untitled", language: "en", characters, scenes: scriptScenes, episodes, storyParagraphs: [] };
  const background = {
    title: "Untitled",
    era: "modern",
    outline: "",
    characterBios: characters.map((character) => `${character.name}: ${character.appearance || ""}`).join("\n"),
    themes: []
  };
  return { background, episodes: rawEpisodes, scriptData, shots, skillMeta };
}
async function parseLongScriptSkillResponse(fullText, parseOpts, skillText, promptControl, settings) {
  throwIfAborted(parseOpts.signal);
  const paragraphs = splitSourceParagraphs(fullText);
  const wordCount = countWords(fullText);
  const threshold = normalizeLongScriptSkillWordThreshold(
    useVideoStudioSettingsStore.getState().scriptImport.longScriptSkillWordThreshold
  );
  const chunkConcurrency = normalizeLongScriptSkillChunkConcurrency(
    useVideoStudioSettingsStore.getState().scriptImport.longScriptSkillChunkConcurrency
  );
  const sourceFingerprint = stableTextFingerprint(fullText);
  const skillFingerprint = stableTextFingerprint(skillText);
  const reusableCheckpoint = settings?.longFormCheckpoint?.sourceFingerprint === sourceFingerprint && settings.longFormCheckpoint.skillFingerprint === skillFingerprint ? settings.longFormCheckpoint : null;
  let checkpoint = reusableCheckpoint ? {
    ...reusableCheckpoint,
    boundaries: reusableCheckpoint.boundaries.map((boundary) => ({ ...boundary })),
    completedChunks: { ...reusableCheckpoint.completedChunks }
  } : {
    sourceFingerprint,
    skillFingerprint,
    boundaries: [],
    memory: {},
    completedChunks: {},
    updatedAt: Date.now()
  };
  const publishCheckpoint = () => {
    checkpoint.updatedAt = Date.now();
    settings?.onLongFormCheckpoint?.({
      ...checkpoint,
      boundaries: checkpoint.boundaries.map((boundary) => ({ ...boundary })),
      completedChunks: { ...checkpoint.completedChunks }
    });
  };
  parseOpts.onCliLog?.(`[Script Skill] Long pipeline start words=${wordCount} paragraphs=${paragraphs.length} threshold=${threshold} concurrency=${chunkConcurrency}`);
  let boundaries = normalizeBoundaries(checkpoint.boundaries, paragraphs.length);
  if (checkpoint.boundaries.length > 0) {
    parseOpts.onCliLog?.(`[Script Skill] Reuse boundary checkpoint chunks=${boundaries.length}`);
  } else {
    parseOpts.onCliLog?.("[Script Skill] Boundary request start");
    const boundaryResponse = await callChatAPI(
      SCRIPT_CHUNK_BOUNDARY_SYSTEM_PROMPT,
      buildScriptChunkBoundaryUserPrompt(buildNumberedParagraphs(paragraphs)),
      { ...parseOpts, maxTokens: 4e3, temperature: 0.2, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-boundary:${Date.now()}` }
    );
    throwIfAborted(parseOpts.signal);
    const boundaryJson = safeParseJson(cleanJsonString(boundaryResponse), {});
    boundaries = normalizeBoundaries(Array.isArray(boundaryJson.chunks) ? boundaryJson.chunks : [], paragraphs.length);
    checkpoint.boundaries = boundaries;
    publishCheckpoint();
  }
  parseOpts.onCliLog?.(`[Script Skill] Boundary request done chunks=${boundaries.length} ranges=${boundaries.map((chunk) => `${chunk.chunkId}:${chunk.startParagraph}-${chunk.endParagraph}`).join(", ")}`);
  const requestedMeta = normalizeScriptSkillMeta(extractSkillMetadataFromText(skillText));
  const outputs = requestedMeta.outputs;
  const needsCanonicalMemory = outputs.includes("characterPrompt") || outputs.includes("scenePrompt");
  let memory = reusableCheckpoint?.memory || {};
  if (needsCanonicalMemory) {
    if (reusableCheckpoint?.memory && Object.keys(reusableCheckpoint.memory).length > 0) {
      parseOpts.onCliLog?.("[Script Skill] Reuse canonical memory checkpoint");
    } else {
      parseOpts.onCliLog?.(`[Script Skill] Memory request start outputs=${outputs.join(",")}`);
      const memoryResponse = await callChatAPI(
        SCRIPT_CANONICAL_MEMORY_SYSTEM_PROMPT,
        buildScriptCanonicalMemoryUserPrompt({ promptControl, skillText, scanText: fullText, outputs }),
        { ...parseOpts, maxTokens: 6e3, temperature: 0.3, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-memory:${Date.now()}` }
      );
      throwIfAborted(parseOpts.signal);
      memory = safeParseJson(cleanJsonString(memoryResponse), {});
      checkpoint.memory = memory;
      publishCheckpoint();
      parseOpts.onCliLog?.(`[Script Skill] Memory request done characters=${Array.isArray(memory.characters) ? memory.characters.length : 0} scenes=${Array.isArray(memory.scenes) ? memory.scenes.length : 0}`);
    }
  } else {
    parseOpts.onCliLog?.("[Script Skill] Memory request skipped");
  }
  const canonicalMemory = needsCanonicalMemory ? JSON.stringify({
    characters: Array.isArray(memory.characters) ? memory.characters : [],
    scenes: Array.isArray(memory.scenes) ? memory.scenes : []
  }) : void 0;
  const chunkResults = await runConcurrentOrdered(boundaries, chunkConcurrency, async (boundary, index) => {
    throwIfAborted(parseOpts.signal);
    const completedChunk = checkpoint.completedChunks[boundary.chunkId];
    if (completedChunk && typeof completedChunk === "object") {
      parseOpts.onCliLog?.(`[Script Skill] Chunk ${index + 1}/${boundaries.length} reused id=${boundary.chunkId}`);
      return completedChunk;
    }
    const chunkText = extractChunkText(paragraphs, boundary);
    for (let attempt = 1; attempt <= CHUNK_GENERATION_MAX_ATTEMPTS; attempt += 1) {
      try {
        parseOpts.onCliLog?.(`[Script Skill] Chunk ${index + 1}/${boundaries.length} start id=${boundary.chunkId} attempt=${attempt}/${CHUNK_GENERATION_MAX_ATTEMPTS} paragraphs=${boundary.startParagraph}-${boundary.endParagraph} chars=${chunkText.length}`);
        const chunkResponse = await callChatAPI(
          SCRIPT_SKILL_SYSTEM_PROMPT,
          buildScriptSkillChunkUserPrompt({
            promptControl,
            skillText,
            chunkText,
            chunkIndex: index + 1,
            totalChunks: boundaries.length,
            requestedOutputs: outputs,
            canonicalMemory
          }),
          { ...parseOpts, maxTokens: 8e3, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-chunk:${Date.now()}:${index + 1}:try-${attempt}` }
        );
        throwIfAborted(parseOpts.signal);
        const parsedChunk = parseSkillJsonResponse(chunkResponse);
        checkpoint.completedChunks[boundary.chunkId] = parsedChunk;
        publishCheckpoint();
        parseOpts.onCliLog?.(`[Script Skill] Chunk ${index + 1}/${boundaries.length} done id=${boundary.chunkId} attempt=${attempt}/${CHUNK_GENERATION_MAX_ATTEMPTS} output=${chunkResponse.length} chars shots=${normalizeShotList(parsedChunk?.shots).length} characters=${Array.isArray(parsedChunk?.characters) ? parsedChunk.characters.length : 0} scenes=${Array.isArray(parsedChunk?.scenes) ? parsedChunk.scenes.length : 0}`);
        return parsedChunk;
      } catch (error) {
        if (isCancelledError(error) || attempt >= CHUNK_GENERATION_MAX_ATTEMPTS) {
          throw error;
        }
        parseOpts.onCliLog?.(`[Script Skill] Chunk ${index + 1}/${boundaries.length} failed id=${boundary.chunkId} attempt=${attempt}/${CHUNK_GENERATION_MAX_ATTEMPTS}: ${error instanceof Error ? error.message : String(error)}. Retrying...`);
      }
    }
    return {};
  });
  throwIfAborted(parseOpts.signal);
  parseOpts.onCliLog?.(`[Script Skill] Merge start chunks=${chunkResults.length}`);
  const merged = mergeParsedSkillChunks(chunkResults, memory, outputs);
  if (requestedMeta.mergeMode) merged.meta.mergeMode = requestedMeta.mergeMode;
  parseOpts.onCliLog?.(`[Script Skill] Merge done shots=${Array.isArray(merged.shots) ? merged.shots.length : 0} characters=${Array.isArray(merged.characters) ? merged.characters.length : 0} scenes=${Array.isArray(merged.scenes) ? merged.scenes.length : 0}`);
  return JSON.stringify(merged);
}
function extractSkillMetadataFromText(content) {
  const metadataBlock = content.match(/##\s*Skill Metadata[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (!metadataBlock) return void 0;
  try {
    return JSON.parse(metadataBlock);
  } catch {
    return void 0;
  }
}
async function parseContentWithAI(fullText, settings, onProgress) {
  const config = getFeatureConfig("script_analysis") || getFeatureConfig("chat");
  if (!config) {
    throw new Error(
      "No AI provider configured. Please bind a provider to the script analysis feature in settings."
    );
  }
  const parseOpts = {
    apiKey: config.allApiKeys.join(","),
    provider: config.platform,
    baseUrl: config.baseUrl,
    model: config.model,
    signal: settings?.signal,
    onCliLog: (message) => onProgress?.("process", 0, 1, message)
  };
  throwIfAborted(settings?.signal);
  onProgress?.("process", 0, 1);
  const output = await parseSinglePassContent(fullText, parseOpts, settings);
  throwIfAborted(settings?.signal);
  onProgress?.("process", 1, 1);
  console.log(
    `[ai-script-parser] Done — ${output.shots.length} shots, ${output.scriptData.characters.length} characters`
  );
  return output;
}
async function parseContentWithScriptSkill(fullText, skillText, settings, onProgress) {
  return parseContentWithAI(fullText, { ...settings, skillText }, onProgress);
}
function populateSeriesMetaFromImport(background, scriptData, aiAnalysis, importSettings) {
  const isEpTitle = (t) => /^episode\s+\d+/i.test(t);
  const rawTitle = background.title || scriptData.title || "";
  const safeTitle = rawTitle && !isEpTitle(rawTitle) ? rawTitle : "Untitled";
  const meta = {
    // Story core
    title: safeTitle,
    outline: background.outline || aiAnalysis?.generatedOutline || void 0,
    logline: void 0,
    themes: background.themes || void 0,
    // Basic project context
    era: background.era || aiAnalysis?.era || void 0,
    genre: background.genre || aiAnalysis?.genre || void 0,
    // Character system
    characters: scriptData.characters || [],
    // Visual system — directly use the style selected during import
    styleId: importSettings?.styleId,
    recurringLocations: void 0,
    language: scriptData.language || "English"
  };
  console.log("[populateSeriesMeta] Series metadata built:", {
    title: meta.title,
    characters: meta.characters.length,
    hasOutline: !!meta.outline,
    hasLogline: !!meta.logline
  });
  return meta;
}
function buildSeriesContextSummary(meta) {
  if (!meta) return "";
  const parts = [];
  const infoLine = [
    `Work: ${meta.title}`,
    meta.era || "",
    meta.genre || ""
  ].filter(Boolean).join(", ");
  parts.push(`[Series Context] ${infoLine}`);
  if (meta.centralConflict) {
    parts.push(`Central Conflict: ${meta.centralConflict}`);
  }
  if (meta.characters.length > 0) {
    const charSummary = meta.characters.slice(0, 15).map((c) => {
      const info = [c.name];
      if (c.appearance) info.push(c.appearance.substring(0, 40));
      return info.join(",");
    }).join("; ");
    parts.push(`Characters: ${charSummary}`);
  }
  return parts.join("\n");
}
function cleanAnchorName(value) {
  return String(value || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
}
function stripAnchor(value) {
  const raw = cleanAnchorName(value);
  const scene = raw.match(/^@scene\[([^\]]+)\]$/iu);
  if (scene) return cleanAnchorName(scene[1]);
  const character = raw.match(/^@\[([^\]]+)\]$/u);
  if (character) return cleanAnchorName(character[1]);
  const bareCharacter = raw.match(/^@(?!scene\[)([\p{L}\p{N}_-]+)$/iu);
  if (bareCharacter) return cleanAnchorName(bareCharacter[1]);
  return raw;
}
const normalizeKey = (value) => stripAnchor(value).toLowerCase();
function hasValue(value) {
  return Boolean(value?.trim());
}
function mergePromptField(current, incoming, field, replaceExisting) {
  const incomingValue = incoming[field];
  if (typeof incomingValue !== "string" || !incomingValue.trim()) return current;
  if (!replaceExisting && hasValue(current[field])) return current;
  return { ...current, [field]: incomingValue };
}
function mergeCharacters(current, incoming, outputs, replaceExisting) {
  const next = [...current];
  const shouldMergePrompt = outputs.includes("characterPrompt");
  incoming.forEach((incomingCharacter) => {
    const key = normalizeKey(incomingCharacter.name);
    if (!key) return;
    const index = next.findIndex((character) => normalizeKey(character.name) === key);
    if (index === -1) {
      const idExists = next.some((character) => character.id === incomingCharacter.id);
      next.push(idExists ? { ...incomingCharacter, id: `char_${next.length + 1}` } : incomingCharacter);
      return;
    }
    if (shouldMergePrompt) {
      next[index] = mergePromptField(next[index], incomingCharacter, "characterPrompt", replaceExisting);
    }
  });
  return next;
}
function mergeScenes(current, incoming, outputs, replaceExisting) {
  const next = [...current];
  incoming.forEach((incomingScene) => {
    const incomingKey = normalizeKey(incomingScene.name);
    if (!incomingKey) return;
    const index = next.findIndex((scene) => normalizeKey(scene.name) === incomingKey);
    if (index === -1) {
      const idExists = next.some((scene) => scene.id === incomingScene.id);
      next.push(idExists ? { ...incomingScene, id: `scene_${next.length + 1}` } : incomingScene);
      return;
    }
    const mergedBase = {
      ...next[index],
      description: hasValue(next[index].description) ? next[index].description : incomingScene.description,
      atmosphere: hasValue(next[index].atmosphere) ? next[index].atmosphere : incomingScene.atmosphere,
      notes: hasValue(next[index].notes) ? next[index].notes : incomingScene.notes
    };
    next[index] = outputs.includes("scenePrompt") ? mergePromptField(mergedBase, incomingScene, "scenePrompt", replaceExisting) : mergedBase;
  });
  return next;
}
function getSceneKey(scriptData, sceneId) {
  const scene = scriptData.scenes.find((item) => item.id === sceneId);
  return normalizeKey(scene?.name || sceneId);
}
function findMatchingSceneId(currentScriptData, incomingScriptData, incomingSceneId) {
  if (!incomingSceneId) return void 0;
  const incomingKey = getSceneKey(incomingScriptData, incomingSceneId);
  if (!incomingKey) return void 0;
  return currentScriptData.scenes.find((scene) => normalizeKey(scene.name) === incomingKey)?.id;
}
function nextShotId(shots) {
  const max = shots.reduce((acc, shot) => {
    const value = Number(String(shot.id).match(/(\d+)$/)?.[1] || 0);
    return Math.max(acc, value);
  }, shots.length);
  return `shot-${max + 1}`;
}
function createShotForScene(source, sceneRefId, index, id) {
  return {
    ...source,
    id,
    index,
    sceneRefId,
    keyframes: source.imagePrompt ? [{ id: `kf-${id}-start`, type: "start", imagePrompt: source.imagePrompt, imageUrl: "", status: "idle" }] : [],
    imageStatus: "idle",
    imageProgress: 0,
    videoStatus: "idle",
    videoProgress: 0
  };
}
function mergeShotPrompts(current, incoming, outputs, replaceExisting) {
  let next = current;
  const incomingRefs = normalizeRefImageIndexes(incoming.ref_image);
  if (incomingRefs.length > 0 && (replaceExisting || !normalizeRefImageIndexes(current.ref_image).length)) {
    next = { ...next, ref_image: incomingRefs };
  }
  if (outputs.includes("imagePrompt")) {
    next = mergePromptField(next, incoming, "imagePrompt", replaceExisting);
    if (next !== current && next.imagePrompt?.trim()) {
      next = {
        ...next,
        keyframes: [{ id: `kf-${next.id}-start`, type: "start", imagePrompt: next.imagePrompt, imageUrl: "", status: "idle" }]
      };
    }
  }
  if (outputs.includes("videoPrompt")) {
    next = mergePromptField(next, incoming, "videoPrompt", replaceExisting);
    if ((replaceExisting || !hasValue(next.voiceOver)) && hasValue(incoming.voiceOver)) {
      next = { ...next, voiceOver: incoming.voiceOver };
    }
  }
  if (outputs.includes("videoLength")) {
    next = { ...next, videoLength: normalizeVideoLength(incoming.videoLength) };
  }
  return next;
}
function mergeShotsByPosition(input, replaceExisting, appendOnly) {
  if (!input.currentScriptData) return input.incomingShots;
  const next = [...input.currentShots];
  input.incomingShots.forEach((incomingShot) => {
    const targetSceneId = findMatchingSceneId(input.currentScriptData, input.incomingScriptData, incomingShot.sceneRefId);
    const targetEpisodeId = incomingShot.episodeId;
    if (!targetSceneId && incomingShot.sceneRefId) return;
    const currentGroupShots = next.filter((shot) => targetSceneId ? shot.sceneRefId === targetSceneId : !shot.sceneRefId && shot.episodeId === targetEpisodeId).sort((a, b) => a.index - b.index);
    const incomingGroupShots = input.incomingShots.filter((shot) => targetSceneId ? shot.sceneRefId === incomingShot.sceneRefId : !shot.sceneRefId && shot.episodeId === targetEpisodeId).sort((a, b) => a.index - b.index);
    const position = incomingGroupShots.findIndex((shot) => shot.id === incomingShot.id);
    if (!appendOnly && currentGroupShots[position]) {
      const targetIndex = next.findIndex((shot) => shot.id === currentGroupShots[position].id);
      next[targetIndex] = mergeShotPrompts(next[targetIndex], incomingShot, input.outputs, replaceExisting);
      return;
    }
    const id = nextShotId(next);
    next.push(createShotForScene(incomingShot, targetSceneId || "", next.length + 1, id));
  });
  return next.map((shot, index) => ({ ...shot, index: index + 1 }));
}
function mergeScriptSkillResult(input) {
  const mode = input.mergeMode || "replace-missing";
  if (mode === "replace-all" || !input.currentScriptData) {
    return {
      scriptData: input.incomingScriptData,
      episodes: input.incomingEpisodes,
      shots: input.incomingShots
    };
  }
  const replaceExisting = mode === "update-prompts-only";
  const appendOnly = mode === "append-shots";
  const scriptData = {
    ...input.currentScriptData,
    characters: mergeCharacters(input.currentScriptData.characters || [], input.incomingScriptData.characters || [], input.outputs, replaceExisting),
    scenes: mergeScenes(input.currentScriptData.scenes || [], input.incomingScriptData.scenes || [], input.outputs, replaceExisting)
  };
  return {
    scriptData,
    episodes: input.currentEpisodes.length > 0 ? input.currentEpisodes : input.incomingEpisodes,
    shots: mergeShotsByPosition({ ...input, currentScriptData: scriptData }, replaceExisting, appendOnly)
  };
}
async function importScriptWithSkill(fullText, skillText, projectId, importSettings) {
  try {
    const store = useScriptStore.getState();
    const existingCheckpoint = store.projects[projectId]?.longScriptImportCheckpoint || null;
    const { background, episodes, scriptData, shots, skillMeta } = await parseContentWithScriptSkill(
      fullText,
      skillText,
      {
        styleId: importSettings?.styleId,
        signal: importSettings?.signal,
        longFormCheckpoint: existingCheckpoint,
        onLongFormCheckpoint: (checkpoint) => {
          useScriptStore.getState().setLongScriptImportCheckpoint(projectId, checkpoint);
          importSettings?.onProgress?.(`Đã lưu checkpoint kịch bản dài: ${Object.keys(checkpoint.completedChunks).length}/${checkpoint.boundaries.length} phần`);
        }
      },
      (step, current, total, message) => {
        console.log(`[importScriptWithSkill] AI parse ${step}: ${current}/${total}`);
        if (message) importSettings?.onProgress?.(message);
      }
    );
    const project = store.projects[projectId];
    const mergeMode = skillMeta.mergeMode || "replace-missing";
    const merged = mergeScriptSkillResult({
      currentScriptData: project?.scriptData || null,
      currentEpisodes: project?.episodeRawScripts || [],
      currentShots: project?.shots || [],
      incomingScriptData: scriptData,
      incomingEpisodes: episodes,
      incomingShots: shots,
      outputs: skillMeta.outputs,
      mergeMode
    });
    store.setEpisodeRawScripts(projectId, merged.episodes);
    store.setScriptData(projectId, merged.scriptData);
    store.setRawScript(projectId, fullText);
    store.setParseStatus(projectId, "ready");
    store.setShots(projectId, merged.shots);
    const seriesMeta = populateSeriesMetaFromImport(background, merged.scriptData, null, importSettings);
    store.setSeriesMeta(projectId, seriesMeta);
    return {
      success: true,
      episodes: merged.episodes,
      scriptData: merged.scriptData
    };
  } catch (error) {
    console.error("Skill import error:", error);
    return {
      success: false,
      episodes: [],
      scriptData: null,
      error: error instanceof Error ? error.message : "Skill import failed"
    };
  }
}
async function importSingleEpisodeContent(rawContent, episodeIndex, projectId, onProgress) {
  const TAG = "[importSingleEpisodeContent]";
  try {
    onProgress?.("Parsing episode content...");
    const store = useScriptStore.getState();
    const project = store.projects[projectId];
    if (!project?.scriptData) {
      return { success: false, sceneCount: 0, error: "Project or screenplay data not found" };
    }
    const scriptData = project.scriptData;
    const episode = scriptData.episodes.find((e) => e.index === episodeIndex);
    if (!episode) {
      return { success: false, sceneCount: 0, error: `Episode ${episodeIndex} was not found` };
    }
    const preprocessed = preprocessLineBreaks(rawContent);
    const rawScenes = parseScenes(preprocessed.text);
    console.log(`${TAG} Parsed ${rawScenes.length} scenes`);
    onProgress?.(`Parsed ${rawScenes.length} scenes`);
    if (rawScenes.length === 0) {
      store.updateEpisodeRawScript(projectId, episodeIndex, {
        rawContent,
        scenes: []
      });
      return { success: true, sceneCount: 0 };
    }
    const timestamp = Date.now();
    const timeMap = {
      "day": "day",
      "night": "night",
      "morning": "dawn",
      "dusk": "dusk",
      "sunset": "dusk",
      "daybreak": "dawn",
      "early morning": "dawn",
      "evening": "dusk"
    };
    const newScenes = rawScenes.map((scene, idx) => {
      const sceneId = `scene_ep${episodeIndex}_${timestamp}_${idx + 1}`;
      const headerParts = scene.sceneHeader.split(/\s+/);
      const timeOfDay = headerParts[1] || "day";
      const hasInterior = headerParts[2] && /^(interior|exterior|interior\/exterior)$/i.test(headerParts[2]);
      const locStart = hasInterior ? 3 : 2;
      let loc = headerParts.slice(locStart).join(" ") || headerParts[headerParts.length - 1] || "Unknown";
      loc = loc.replace(/\s*(?:Characters?|Roles?)[：:].*/gi, "").trim();
      let atmosphere = "calm";
      if (/tense|danger|conflict|fight|rage/i.test(scene.content)) atmosphere = "tense";
      else if (/warm|joy|happy|laughter|comfort/i.test(scene.content)) atmosphere = "warm";
      else if (/sad|cry|pain|tears|grief/i.test(scene.content)) atmosphere = "sad";
      else if (/mysterious|dark|eerie|ominous/i.test(scene.content)) atmosphere = "mysterious";
      return {
        id: sceneId,
        name: `${episodeIndex}-${idx + 1} ${loc}`,
        description: scene.actions.join(" ").trim() || scene.content.trim() || loc,
        time: timeMap[timeOfDay] || "day",
        atmosphere
      };
    });
    const newSceneIds = newScenes.map((s) => s.id);
    const oldSceneIds = new Set(episode.sceneIds);
    const remainingScenes = scriptData.scenes.filter((s) => !oldSceneIds.has(s.id));
    const remainingShots = project.shots.filter((s) => !oldSceneIds.has(s.sceneRefId));
    store.updateEpisodeRawScript(projectId, episodeIndex, {
      rawContent,
      scenes: rawScenes
    });
    store.setScriptData(projectId, {
      ...scriptData,
      scenes: [...remainingScenes, ...newScenes],
      episodes: scriptData.episodes.map(
        (e) => e.index === episodeIndex ? { ...e, sceneIds: newSceneIds } : e
      )
    });
    if (remainingShots.length !== project.shots.length) {
      store.setShots(projectId, remainingShots);
      console.log(`${TAG} Removed ${project.shots.length - remainingShots.length} old shots`);
    }
    console.log(`${TAG} Structure completion done: ${newScenes.length} scenes`);
    onProgress?.(`Updated the structure with ${newScenes.length} scenes`);
    generateSingleEpisodeTitleAndSynopsis(projectId, episodeIndex).catch((e) => {
      console.warn(`${TAG} Title/synopsis generation failed (structure completion still succeeds):`, e);
    });
    return { success: true, sceneCount: newScenes.length };
  } catch (error) {
    console.error("[importSingleEpisodeContent] Error:", error);
    return {
      success: false,
      sceneCount: 0,
      error: error instanceof Error ? error.message : "Structure completion failed"
    };
  }
}
async function generateSingleEpisodeTitleAndSynopsis(projectId, episodeIndex) {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  if (!project) return;
  const epRaw = project.episodeRawScripts.find((e) => e.episodeIndex === episodeIndex);
  if (!epRaw || !epRaw.rawContent) return;
  const hasTitle = epRaw.title && !/^Episode\s*\d+$/i.test(epRaw.title.trim());
  const hasSynopsis = !!(epRaw.synopsis && epRaw.synopsis.trim().length > 0);
  if (hasTitle && hasSynopsis) return;
  const background = project.seriesMeta || project.scriptData;
  const seriesCtx = buildSeriesContextSummary(project.seriesMeta || null);
  const contentSummary = epRaw.rawContent.slice(0, 800);
  const system = buildSingleEpisodeTitleSynopsisSystemPrompt({
    seriesContext: seriesCtx,
    title: background?.title || project.scriptData?.title || "Untitled",
    genre: project.seriesMeta?.genre,
    era: project.seriesMeta?.era
  });
  const user = buildSingleEpisodeTitleSynopsisUserPrompt(episodeIndex, contentSummary);
  try {
    const result = await callFeatureAPI("script_analysis", system, user, {
      temperature: 0.3,
      maxTokens: 512
    });
    if (!result) return;
    const jsonMatch = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const parsed = JSON.parse(jsonMatch[0]);
    const updates = {};
    if (!hasTitle && parsed.title) {
      const fullTitle = `Episode ${episodeIndex}: ${parsed.title}`;
      updates.title = fullTitle;
      const cur = useScriptStore.getState();
      const sd = cur.projects[projectId]?.scriptData;
      if (sd) {
        cur.setScriptData(projectId, {
          ...sd,
          episodes: sd.episodes.map(
            (e) => e.index === episodeIndex ? { ...e, title: fullTitle } : e
          )
        });
      }
    }
    if (!hasSynopsis && parsed.synopsis) {
      updates.synopsis = parsed.synopsis;
      updates.keyEvents = parsed.keyEvents || [];
    }
    if (Object.keys(updates).length > 0) {
      useScriptStore.getState().updateEpisodeRawScript(projectId, episodeIndex, updates);
      console.log(`[generateSingleEpisodeTitleAndSynopsis] Generated title/synopsis for episode ${episodeIndex}`);
    }
  } catch (e) {
    console.warn("[generateSingleEpisodeTitleAndSynopsis] AI call failed:", e);
  }
}
async function generateEpisodeShots(episodeIndex, projectId, _options, onProgress) {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  if (!project) {
    throw new Error("Project not found");
  }
  const episodeScript = project.episodeRawScripts.find(
    (ep) => ep.episodeIndex === episodeIndex
  );
  if (!episodeScript) {
    throw new Error(`Episode ${episodeIndex} script was not found`);
  }
  store.updateEpisodeRawScript(projectId, episodeIndex, {
    shotGenerationStatus: "generating"
  });
  try {
    onProgress?.(`Generating shots for episode ${episodeIndex}...`);
    const scriptData = project.scriptData;
    if (!scriptData) {
      throw new Error("Script data is missing");
    }
    const episode = scriptData.episodes.find((ep) => ep.index === episodeIndex);
    if (!episode) {
      throw new Error(`Episode ${episodeIndex} structure was not found`);
    }
    const episodeScenes = scriptData.scenes.filter(
      (s) => episode.sceneIds.includes(s.id)
    );
    const scenesWithContent = episodeScenes.map((scene, idx) => {
      const rawScene = episodeScript.scenes[idx];
      return {
        ...scene,
        // Generate shots from the original raw content
        rawContent: rawScene?.content || "",
        dialogues: rawScene?.dialogues || [],
        actions: rawScene?.actions || []
      };
    });
    const newShots = await generateShotsForEpisode(
      scenesWithContent,
      episode.id,
      onProgress
    );
    const existingShots = project.shots.filter(
      (shot) => shot.episodeId !== episode.id
    );
    const allShots = [...existingShots, ...newShots];
    store.setShots(projectId, allShots);
    store.updateEpisodeRawScript(projectId, episodeIndex, {
      shotGenerationStatus: "completed",
      lastGeneratedAt: Date.now()
    });
    onProgress?.(`Episode ${episodeIndex} shot generation complete (${newShots.length} shots)`);
    return { shots: newShots };
  } catch (error) {
    store.updateEpisodeRawScript(projectId, episodeIndex, {
      shotGenerationStatus: "error"
    });
    throw error;
  }
}
async function generateShotsForEpisode(scenes, episodeId, onProgress) {
  const shots = [];
  let shotIndex = 1;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress?.(`Processing scene ${i + 1}/${scenes.length}: ${scene.name || "Untitled"}`);
    const sceneShots = generateShotsFromSceneContent(
      scene,
      episodeId,
      shotIndex
    );
    shots.push(...sceneShots);
    shotIndex += sceneShots.length;
  }
  return shots;
}
function generateShotsFromSceneContent(scene, episodeId, startIndex) {
  const shots = [];
  let index = startIndex;
  const lines = scene.rawContent.split("\n").filter((line) => line.trim());
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    if (/^(characters?|cast)\s*:/i.test(trimmedLine) || /^\*\*(characters?|cast)\s*:/i.test(trimmedLine)) continue;
    if (trimmedLine.match(/^\*\*[^*]+\*\*$/)) continue;
    const dialogueMatch = trimmedLine.match(/^([^:\(\[\n\-*]{1,40})[:]\s*(?:[\(]([^\)]+)[\)])?\s*(.+)$/);
    if (dialogueMatch) {
      const charName = dialogueMatch[1].trim();
      const parenthetical = dialogueMatch[2]?.trim() || "";
      const dialogueText = dialogueMatch[3].trim();
      if (/^(subtitle|voiceover|narration|scene|characters?)$/i.test(charName)) continue;
      shots.push(createShot({
        index: index++,
        episodeId,
        sceneRefId: scene.id,
        actionSummary: `${charName}${parenthetical ? ` (${parenthetical})` : ""}: ${dialogueText}`
      }));
      continue;
    }
    if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
      const actionText = trimmedLine.slice(1).trim();
      shots.push(createShot({
        index: index++,
        episodeId,
        sceneRefId: scene.id,
        // Keep the full original action text to help downstream AI calibration.
        actionSummary: actionText
      }));
      continue;
    }
    if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
      const subtitleText = trimmedLine.slice(1, -1);
      if (/flashback/i.test(subtitleText)) {
        shots.push(createShot({
          index: index++,
          episodeId,
          sceneRefId: scene.id,
          actionSummary: subtitleText
        }));
        continue;
      }
      if (/^subtitle\s*:/i.test(subtitleText)) {
        shots.push(createShot({
          index: index++,
          episodeId,
          sceneRefId: scene.id,
          actionSummary: "subtitle display"
        }));
      }
    }
  }
  if (shots.length === 0) {
    shots.push(createShot({
      index,
      episodeId,
      sceneRefId: scene.id,
      actionSummary: `${scene.name || scene.description || "Untitled"} establishing shot`
    }));
  }
  return shots;
}
function createShot(params) {
  return {
    id: `shot_${Date.now()}_${params.index}`,
    index: params.index,
    episodeId: params.episodeId,
    sceneRefId: params.sceneRefId,
    videoPrompt: params.actionSummary,
    videoLength: 4,
    hasCharacters: false,
    imageStatus: "idle",
    imageProgress: 0,
    videoStatus: "idle",
    videoProgress: 0
  };
}
function isMissingTitle(title) {
  if (!title || title.trim() === "") return true;
  const onlyEpisodeNum = /^episode\s+\d+$/i;
  return onlyEpisodeNum.test(title.trim());
}
function getMissingTitleEpisodes(projectId) {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  if (!project || !project.episodeRawScripts.length) {
    return [];
  }
  return project.episodeRawScripts.filter((ep) => isMissingTitle(ep.title));
}
function inferSkillName(content, fallback) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}
const useScriptSkillStore = create()(
  persist(
    (set, get) => ({
      skills: [],
      selectedSkillId: null,
      addSkill: (skillData) => {
        const meta = normalizeScriptSkillMeta({ outputs: skillData.outputs, mergeMode: skillData.mergeMode });
        const id = `script_skill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const skill = {
          id,
          name: skillData.name.trim() || inferSkillName(skillData.content, "Untitled Skill"),
          content: skillData.content,
          outputs: meta.outputs,
          mergeMode: meta.mergeMode,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({ skills: [...state.skills, skill], selectedSkillId: id }));
        return id;
      },
      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map(
            (skill) => skill.id === id ? { ...skill, ...updates, updatedAt: Date.now() } : skill
          )
        }));
      },
      deleteSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
          selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId
        }));
      },
      selectSkill: (id) => set({ selectedSkillId: id }),
      getSelectedSkill: () => {
        const state = get();
        return state.selectedSkillId ? state.skills.find((skill) => skill.id === state.selectedSkillId) : void 0;
      },
      getSkillById: (id) => get().skills.find((skill) => skill.id === id)
    }),
    {
      name: "longdd-script-skills",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        skills: state.skills,
        selectedSkillId: state.selectedSkillId
      })
    }
  )
);
function ScriptInput({
  rawScript,
  styleId,
  parseStatus,
  parseError,
  chatConfigured,
  onRawScriptChange,
  onStyleChange,
  onImportWithSkill,
  onCancelImport,
  importStatus,
  importError,
  calibrationStatus,
  cliStreamTitle,
  cliStreamOutput
}) {
  const { t } = useI18n();
  const [isImporting, setIsImporting] = reactExports.useState(false);
  const [skillName, setSkillName] = reactExports.useState("");
  const [skillText, setSkillText] = reactExports.useState("");
  const fileInputRef = reactExports.useRef(null);
  const skills = useScriptSkillStore((state) => state.skills);
  const selectedSkillId = useScriptSkillStore((state) => state.selectedSkillId);
  const addSkill = useScriptSkillStore((state) => state.addSkill);
  const updateSkill = useScriptSkillStore((state) => state.updateSkill);
  const deleteSkill = useScriptSkillStore((state) => state.deleteSkill);
  const selectSkill = useScriptSkillStore((state) => state.selectSkill);
  const longScriptSkillWordThreshold = useVideoStudioSettingsStore((state) => state.scriptImport.longScriptSkillWordThreshold);
  const setScriptImport = useVideoStudioSettingsStore((state) => state.setScriptImport);
  const skillMeta = normalizeScriptSkillMeta(extractSkillMetadata(skillText));
  const normalizedRawScript = normalizeScriptInput(rawScript);
  const rawScriptStats = getScriptInputStats(normalizedRawScript);
  reactExports.useEffect(() => {
    if (!selectedSkillId) {
      setSkillName("");
      setSkillText("");
      return;
    }
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
    if (!selectedSkill) {
      setSkillName("");
      setSkillText("");
      return;
    }
    setSkillName(selectedSkill.name);
    setSkillText(selectedSkill.content);
  }, [selectedSkillId, skills]);
  const handleRawScriptChange = (value) => {
    onRawScriptChange(normalizeScriptInput(value));
  };
  const handleImportWithSkill = async () => {
    if (!normalizedRawScript.trim() || !skillText.trim() || !onImportWithSkill) return;
    setIsImporting(true);
    try {
      await onImportWithSkill(normalizedRawScript, skillText);
    } finally {
      setIsImporting(false);
    }
  };
  const handleSelectSkill = (id) => {
    if (id === "none") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }
    const skill = skills.find((item) => item.id === id);
    if (!skill) return;
    selectSkill(id);
    setSkillName(skill.name);
    setSkillText(skill.content);
  };
  const handleSaveSkill = () => {
    const content = skillText.trim();
    if (!content) return;
    const meta = normalizeScriptSkillMeta(extractSkillMetadata(content));
    const name = skillName.trim() || extractSkillName(content) || t("scriptInput.untitledSkill");
    if (selectedSkillId && skills.some((skill) => skill.id === selectedSkillId)) {
      updateSkill(selectedSkillId, { name, content, outputs: meta.outputs, mergeMode: meta.mergeMode });
      toast.success(t("scriptInput.skillUpdated", { name }));
      return;
    }
    addSkill({ name, content, outputs: meta.outputs, mergeMode: meta.mergeMode });
    toast.success(t("scriptInput.skillSaved", { name }));
  };
  const handleDeleteSkill = () => {
    if (!selectedSkillId) return;
    deleteSkill(selectedSkillId);
    setSkillName("");
    setSkillText("");
    toast.success(t("scriptInput.skillDeleted"));
  };
  const handleImportSkillFile = (files) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || "");
      setSkillText(content);
      setSkillName(extractSkillName(content) || file.name.replace(/\.[^.]+$/, ""));
      selectSkill(null);
      toast.success(t("scriptInput.skillFileImported", { name: file.name }));
    };
    reader.readAsText(file);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex flex-col overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-3 pb-24 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scriptInput.importLabel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: t("scriptInput.importPlaceholder"),
          value: normalizedRawScript,
          onChange: (e) => handleRawScriptChange(e.target.value),
          className: "min-h-[200px] max-h-[40vh] resize-none text-sm overflow-y-auto",
          disabled: parseStatus === "parsing" || isImporting
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end text-2xs text-muted-foreground", children: [
        "Ký tự: ",
        rawScriptStats.characterCount.toLocaleString(),
        " · Từ: ",
        rawScriptStats.wordCount.toLocaleString()
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/50 p-3 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-3 w-3" }),
            t("scriptInput.scriptSkill")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: t("scriptInput.skillOptionalWorkflow") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedSkillId || "none", onValueChange: handleSelectSkill, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("scriptInput.chooseSavedSkill") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: t("scriptInput.noSavedSkill") }),
            skills.map((skill) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: skill.id, children: skill.name }, skill.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: skillName,
            onChange: (event) => setSkillName(event.target.value),
            placeholder: t("scriptInput.skillNamePlaceholder"),
            disabled: parseStatus === "parsing" || isImporting
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: skillText,
            onChange: (event) => setSkillText(event.target.value),
            placeholder: t("scriptInput.skillTextPlaceholder"),
            className: "min-h-[140px] max-h-[30vh] resize-none text-xs font-mono overflow-y-auto",
            disabled: parseStatus === "parsing" || isImporting
          }
        ),
        skillText.trim() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5 text-2xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full border px-2 py-0.5", children: [
            t("scriptInput.skillOutputs"),
            ": ",
            skillMeta.outputs.join(", ")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full border px-2 py-0.5", children: [
            t("scriptInput.skillMerge"),
            ": ",
            skillMeta.mergeMode || "replace-missing"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/20 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scriptInput.chunkThreshold") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                min: MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
                max: MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
                step: 50,
                value: longScriptSkillWordThreshold,
                onChange: (event) => {
                  setScriptImport({
                    longScriptSkillWordThreshold: normalizeLongScriptSkillWordThreshold(event.target.value)
                  });
                },
                className: "h-8 w-28 text-xs",
                disabled: parseStatus === "parsing" || isImporting
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-4 text-muted-foreground", children: t("scriptInput.chunkThresholdHelp", { count: longScriptSkillWordThreshold }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: ".md,.txt,.json,text/markdown,text/plain,application/json",
            className: "hidden",
            onChange: (event) => handleImportSkillFile(event.target.files)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => fileInputRef.current?.click(), disabled: isImporting, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5 mr-1" }),
            t("scriptInput.importSkillFile")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "secondary", size: "sm", onClick: handleSaveSkill, disabled: !skillText.trim() || isImporting, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5 mr-1" }),
            t("scriptInput.saveSkill")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "secondary", size: "sm", onClick: handleDeleteSkill, disabled: !selectedSkillId || isImporting, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 mr-1" }),
            t("scriptInput.deleteSkill")
          ] })
        ] })
      ] }),
      importStatus === "error" && importError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("scriptInput.importFailed", { message: importError }) }),
      importStatus === "ready" && calibrationStatus !== "calibrating" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600", children: [
        "✓ ",
        t("scriptInput.importSuccess")
      ] }),
      (importStatus === "importing" || calibrationStatus === "calibrating") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-primary/10 border-2 border-primary/30 space-y-3 shadow-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: t("scriptInput.processing") })
          ] }),
          onCancelImport && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "destructive", size: "sm", onClick: onCancelImport, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }),
            t("scriptInput.cancel")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 py-1 ${importStatus === "importing" ? "text-primary font-bold" : importStatus === "ready" ? "text-green-600 font-medium" : "text-muted-foreground"}`, children: [
            importStatus === "importing" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : importStatus === "ready" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "✓" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-5 h-5 rounded-full border-2 border-current" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: t("scriptInput.importScript") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 py-1 ${calibrationStatus === "calibrating" ? "text-primary font-bold" : calibrationStatus === "completed" ? "text-green-600 font-medium" : "text-muted-foreground"}`, children: [
            calibrationStatus === "calibrating" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : calibrationStatus === "completed" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "✓" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-5 h-5 rounded-full border-2 border-current" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: t("scriptInput.generateShotPrompts") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2 border-t", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { className: "h-3 w-3" }),
          t("scriptInput.visualStyle")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StylePicker,
          {
            value: styleId,
            onChange: (id) => onStyleChange(id),
            disabled: parseStatus === "parsing" || isImporting
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("scriptInput.visualStyleHelp") })
      ] }),
      !chatConfigured && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-yellow-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-yellow-600 dark:text-yellow-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: t("scriptInput.apiNotConfigured") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "opacity-80", children: t("scriptInput.apiNotConfiguredHelp") })
        ] })
      ] }),
      !!cliStreamTitle && parseStatus === "parsing" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cliStreamTitle })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-40 overflow-auto whitespace-pre-wrap break-words text-2xs text-foreground/90 font-mono", children: cliStreamOutput || t("scriptInput.cliStreamingWaiting") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        onImportWithSkill && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleImportWithSkill,
            disabled: !normalizedRawScript.trim() || !skillText.trim() || isImporting,
            className: "w-full",
            children: isImporting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              t("scriptInput.runningSkill")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-4 w-4 mr-2" }),
              t("scriptInput.importWithSkill")
            ] })
          }
        ),
        isImporting && onCancelImport && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: onCancelImport,
            className: "w-full",
            variant: "destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-4 w-4 mr-2" }),
              t("scriptInput.cancel")
            ]
          }
        )
      ] }),
      parseStatus === "error" && parseError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: parseError })
      ] })
    ] })
  ] }) });
}
function extractSkillName(content) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() || null;
}
function extractSkillMetadata(content) {
  const metadataBlock = content.match(/##\s*Skill Metadata[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (!metadataBlock) return void 0;
  try {
    return JSON.parse(metadataBlock);
  } catch {
    return void 0;
  }
}
function normalizeScriptInput(value) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
}
function getScriptInputStats(value) {
  const trimmed = value.trim();
  return {
    characterCount: value.length,
    wordCount: trimmed ? trimmed.split(/\s+/).length : 0
  };
}
function PromptStatusPill({ label, status }) {
  const { t } = useI18n();
  const className = status === "ready" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300" : status === "missing" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-muted bg-muted/50 text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("rounded-full border px-1.5 py-0.5 text-2xs", className), children: [
    label,
    ": ",
    t(`promptStatus.${status === "not-required" ? "notRequired" : status}`)
  ] });
}
function StatusIcon({ status }) {
  switch (status) {
    case "completed":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3 text-green-500" });
    case "in_progress":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 text-yellow-500" });
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-3 w-3 text-muted-foreground" });
  }
}
function EpisodeTree({
  scriptData,
  shots,
  shotStatus: _shotStatus,
  selectedItemId,
  selectedItemType,
  onSelectItem,
  onUpdateEpisodeBundle,
  onDeleteEpisodeBundle,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onDeleteShot,
  onGenerateEpisodeShots,
  episodeGenerationStatus,
  onImportCharacters,
  onImportScenes
}) {
  const { t } = useI18n();
  const [expandedEpisodes, setExpandedEpisodes] = reactExports.useState(/* @__PURE__ */ new Set(["default"]));
  const [extrasExpanded, setExtrasExpanded] = reactExports.useState(false);
  const [episodeDialogOpen, setEpisodeDialogOpen] = reactExports.useState(false);
  const [sceneDialogOpen, setSceneDialogOpen] = reactExports.useState(false);
  const [characterDialogOpen, setCharacterDialogOpen] = reactExports.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = reactExports.useState(false);
  const [editingItem, setEditingItem] = reactExports.useState(null);
  const [deleteItem, setDeleteItem] = reactExports.useState(null);
  const [targetEpisodeId, setTargetEpisodeId] = reactExports.useState(null);
  const [formData, setFormData] = reactExports.useState({});
  const episodes = reactExports.useMemo(() => {
    if (!scriptData) return [];
    if (scriptData.episodes && scriptData.episodes.length > 0) {
      return scriptData.episodes;
    }
    return [{
      id: "default",
      index: 1,
      title: t("overview.episode", { index: 1 }),
      sceneIds: scriptData.scenes.map((s) => s.id)
    }];
  }, [scriptData, t]);
  const toggleEpisode = (id) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const getEpisodeTitle = (episode) => /^Imported Prompts(?:\s+\d+)?$/i.test(episode.title) ? t("overview.episode", { index: episode.index }) : episode.title;
  const handleEditEpisode = (ep) => {
    setEditingItem({ type: "episode", id: ep.id });
    setFormData({ title: getEpisodeTitle(ep), description: ep.description || "" });
    setEpisodeDialogOpen(true);
  };
  const handleSaveEpisode = () => {
    if (editingItem?.type === "episode") {
      const ep = episodes.find((e) => e.id === editingItem.id);
      if (ep) {
        onUpdateEpisodeBundle?.(ep.index, { title: formData.title, synopsis: formData.description });
      }
    }
    setEpisodeDialogOpen(false);
    setFormData({});
  };
  const handleAddScene = (episodeId) => {
    setEditingItem(null);
    setTargetEpisodeId(episodeId);
    setFormData({ name: "", description: "", scenePrompt: "" });
    setSceneDialogOpen(true);
  };
  const handleSaveScene = () => {
    if (editingItem?.type === "scene") {
      onUpdateScene?.(editingItem.id, {
        name: formData.name,
        description: formData.description,
        scenePrompt: formData.scenePrompt
      });
    } else {
      const newScene = {
        id: `scene_${Date.now()}`,
        name: formData.name || "New Scene",
        description: formData.description,
        time: "day",
        atmosphere: "neutral",
        scenePrompt: formData.scenePrompt
      };
      onAddScene?.(newScene, targetEpisodeId || void 0);
    }
    setSceneDialogOpen(false);
    setFormData({});
    setTargetEpisodeId(null);
  };
  const handleAddCharacter = () => {
    setEditingItem(null);
    setFormData({ name: "", appearance: "" });
    setCharacterDialogOpen(true);
  };
  const handleEditCharacter = (char) => {
    setEditingItem({ type: "character", id: char.id });
    setFormData({ name: char.name, appearance: char.characterPrompt || char.appearance || "" });
    setCharacterDialogOpen(true);
  };
  const handleSaveCharacter = () => {
    if (editingItem?.type === "character") {
      onUpdateCharacter?.(editingItem.id, { name: formData.name, characterPrompt: formData.appearance, appearance: formData.appearance });
    } else {
      const newChar = {
        id: `char_${Date.now()}`,
        name: formData.name || "New Character",
        appearance: formData.appearance,
        characterPrompt: formData.appearance
      };
      onAddCharacter?.(newChar);
    }
    setCharacterDialogOpen(false);
    setFormData({});
  };
  const handleDelete = (type, id, name) => {
    setDeleteItem({ type, id, name });
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (!deleteItem) return;
    switch (deleteItem.type) {
      case "episode": {
        const ep = episodes.find((e) => e.id === deleteItem.id);
        if (ep) onDeleteEpisodeBundle?.(ep.index);
        break;
      }
      case "scene":
        onDeleteScene?.(deleteItem.id);
        break;
      case "character":
        onDeleteCharacter?.(deleteItem.id);
        break;
      case "shot":
        onDeleteShot?.(deleteItem.id);
        break;
    }
    setDeleteDialogOpen(false);
    setDeleteItem(null);
  };
  const overallProgress = reactExports.useMemo(() => {
    if (!scriptData) return "0/0";
    return calculateProgress(
      shots.map((s) => ({ status: getShotCompletionStatus(s) }))
    );
  }, [shots, scriptData]);
  if (!scriptData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground text-sm", children: t("episodeTree.structureAfterParse") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("episodeTree.progress", { value: overallProgress }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 pb-20 space-y-1", children: [
      episodes.map((episode) => {
        const episodeScenes = scriptData.scenes.filter(
          (s) => episode.sceneIds.includes(s.id)
        );
        const episodeShots = shots.filter(
          (shot) => shot.episodeId === episode.id || episodeScenes.some((s) => s.id === shot.sceneRefId)
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => toggleEpisode(episode.id),
                className: cn(
                  "flex-1 min-w-0 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted text-left overflow-hidden",
                  selectedItemId === `episode_${episode.index}` && selectedItemType === "episode" && "bg-primary/10"
                ),
                children: [
                  expandedEpisodes.has(episode.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-3 w-3 text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-sm font-medium flex-1 truncate",
                      onClick: (e) => {
                        e.stopPropagation();
                        onSelectItem(`episode_${episode.index}`, "episode");
                      },
                      children: getEpisodeTitle(episode)
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-3 w-3" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
                onGenerateEpisodeShots && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DropdownMenuItem,
                  {
                    onClick: () => onGenerateEpisodeShots(episode.index),
                    disabled: episodeGenerationStatus?.[episode.index] === "generating",
                    children: episodeGenerationStatus?.[episode.index] === "generating" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-2 animate-spin" }),
                      t("episodeTree.generating")
                    ] }) : episodeGenerationStatus?.[episode.index] === "completed" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3 mr-2" }),
                      t("episodeTree.refreshShots")
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-3 w-3 mr-2" }),
                      t("episodeTree.generateShots")
                    ] })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => handleAddScene(episode.id), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-2" }),
                  t("episodeTree.newScene")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => handleEditEpisode(episode), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3 mr-2" }),
                  t("episodeTree.edit")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { className: "text-destructive", onClick: () => handleDelete("episode", episode.id, getEpisodeTitle(episode)), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 mr-2" }),
                  t("dashboard.delete")
                ] })
              ] })
            ] })
          ] }),
          expandedEpisodes.has(episode.id) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-4 space-y-0.5", children: [
            onImportScenes && episodeScenes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end px-2 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-5 text-xs px-1", onClick: () => onImportScenes(), children: t("property.importSceneLibrary") }) }),
            episodeShots.map((shot) => {
              const scene = scriptData.scenes.find((item) => item.id === shot.sceneRefId);
              const shotDuration = normalizeVideoLength(shot.videoLength);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => onSelectItem(shot.id, "shot"),
                    className: cn(
                      "flex-1 px-2 py-1 rounded hover:bg-muted text-left",
                      selectedItemId === shot.id && selectedItemType === "shot" && "bg-primary/10"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-muted-foreground w-5", children: String(shot.index).padStart(2, "0") }),
                        scene && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex max-w-[120px] items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-2xs text-blue-600 dark:text-blue-300", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-2.5 w-2.5 shrink-0" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: scene.name || t("scenes.untitled") })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-2xs font-medium text-primary", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-2.5 w-2.5" }),
                          shotDuration,
                          "s"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1" })
                      ] }),
                      shot.imagePrompt || shot.videoPrompt || shot.voiceOver ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 pl-7 space-y-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusPill, { label: t("promptStatus.image"), status: getPromptTargetStatus(shot, "imagePrompt") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusPill, { label: t("promptStatus.video"), status: getPromptTargetStatus(shot, "videoPrompt") }),
                          scene?.scenePrompt && /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusPill, { label: "Scene", status: "ready" })
                        ] }),
                        scene?.scenePrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs leading-relaxed text-emerald-700 dark:text-emerald-300 line-clamp-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Scene Prompt:" }),
                          " ",
                          scene.scenePrompt
                        ] }),
                        shot.imagePrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs leading-relaxed text-violet-700 dark:text-violet-300 line-clamp-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Image Prompt:" }),
                          " ",
                          shot.imagePrompt
                        ] }),
                        shot.videoPrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs leading-relaxed text-blue-700 dark:text-blue-300 line-clamp-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Video Prompt:" }),
                          " ",
                          shot.videoPrompt
                        ] }),
                        shot.voiceOver && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs leading-relaxed text-emerald-700 dark:text-emerald-300 line-clamp-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Voice Over:" }),
                          " ",
                          shot.voiceOver
                        ] })
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 pl-7 text-2xs text-amber-600 dark:text-amber-300", children: "Structure ready. Prompts not generated yet." })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleDelete("shot", shot.id, `Shot ${shot.index}`);
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                  }
                )
              ] }, shot.id);
            })
          ] })
        ] }, episode.id);
      }),
      (() => {
        const seenIds = /* @__PURE__ */ new Set();
        const allCharacters = scriptData.characters.filter((c) => {
          if (seenIds.has(c.id)) return false;
          seenIds.add(c.id);
          return true;
        });
        const mainCharacters = allCharacters;
        const extraCharacters = [];
        const renderCharacterItem = (char) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => onSelectItem(char.id, "character"),
              className: cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted",
                selectedItemId === char.id && selectedItemType === "character" && "bg-primary/10"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIcon, { status: char.status }),
                char.name
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0 opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-3 w-3" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => handleEditCharacter(char), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3 mr-2" }),
                t("episodeTree.edit")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { className: "text-destructive", onClick: () => handleDelete("character", char.id, char.name), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 mr-2" }),
                t("dashboard.delete")
              ] })
            ] })
          ] })
        ] }, char.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }),
                t("overview.characters", { count: mainCharacters.length })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                onImportCharacters && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-5 text-xs px-1", onClick: onImportCharacters, children: t("property.importCharacterLibrary") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-5 text-xs px-1", onClick: handleAddCharacter, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 px-2 mt-1", children: mainCharacters.map(renderCharacterItem) })
          ] }),
          extraCharacters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 border-t border-dashed pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setExtrasExpanded(!extrasExpanded),
                className: "w-full px-2 py-1 text-xs text-muted-foreground flex items-center justify-between hover:bg-muted/50 rounded",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  extrasExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("episodeTree.extras", { count: extraCharacters.length }) })
                ] })
              }
            ),
            extrasExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 px-2 mt-1", children: extraCharacters.map(renderCharacterItem) })
          ] })
        ] });
      })()
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: episodeDialogOpen, onOpenChange: setEpisodeDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("episodeTree.editEpisode") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("episodeTree.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.title || "", onChange: (e) => setFormData({ ...formData, title: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("episodeTree.description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.description || "", onChange: (e) => setFormData({ ...formData, description: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEpisodeDialogOpen(false), children: t("episodeTree.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveEpisode, children: t("characters.save") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: sceneDialogOpen, onOpenChange: setSceneDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "flex items-center gap-2", children: editingItem?.type === "scene" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }),
        t("episodeTree.editScene")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 text-primary" }),
        t("episodeTree.newScene")
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("episodeTree.sceneName") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.name || "", onChange: (e) => setFormData({ ...formData, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("scenes.description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: formData.description || "",
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              placeholder: t("scenes.descriptionPlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Prompt cảnh" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.scenePrompt || "", onChange: (e) => setFormData({ ...formData, scenePrompt: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setSceneDialogOpen(false), children: t("episodeTree.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveScene, children: editingItem?.type === "scene" ? t("characters.save") : t("episodeTree.confirmAdd") })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: characterDialogOpen, onOpenChange: setCharacterDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "flex items-center gap-2", children: editingItem?.type === "character" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }),
        t("episodeTree.editCharacter")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 text-primary" }),
        t("episodeTree.addCharacter")
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("episodeTree.characterName") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.name || "", onChange: (e) => setFormData({ ...formData, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Prompt tạo nhân vật" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.appearance || "", onChange: (e) => setFormData({ ...formData, appearance: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCharacterDialogOpen(false), children: t("episodeTree.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveCharacter, children: editingItem?.type === "character" ? t("characters.save") : t("episodeTree.confirmAdd") })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("episodeTree.confirmDelete") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          'Are you sure you want to delete "',
          deleteItem?.name,
          '"? This action cannot be undone.',
          deleteItem?.type === "episode" && "\nDeleting an episode will also delete all scenes and shots inside it.",
          deleteItem?.type === "scene" && "\nDeleting a scene will also delete all shots inside it."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("episodeTree.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmDelete, className: "bg-destructive text-destructive-foreground", children: t("dashboard.delete") })
      ] })
    ] }) })
  ] });
}
function StatusBadge({ status }) {
  const { t } = useI18n();
  const config = {
    pending: { label: t("property.status.pending"), className: "bg-muted text-muted-foreground" },
    in_progress: { label: t("property.status.inProgress"), className: "bg-yellow-500/10 text-yellow-600" },
    completed: { label: t("property.status.completed"), className: "bg-green-500/10 text-green-600" }
  };
  const { label, className } = config[status || "pending"];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded text-xs ${className}`, children: label });
}
function PromptStatusBadge({ label, status }) {
  const { t } = useI18n();
  const className = status === "ready" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300" : status === "missing" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-muted bg-muted/50 text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `rounded-full border px-2 py-0.5 text-2xs ${className}`, children: [
    label,
    ": ",
    t(`promptStatus.${status === "not-required" ? "notRequired" : status}`)
  ] });
}
function usePropertyEditing(deps) {
  const {
    selectedItemId,
    selectedItemType,
    character,
    scene,
    shot,
    episode,
    episodeShots,
    onUpdateCharacter,
    onUpdateScene,
    onUpdateShot,
    onDeleteCharacter,
    onDeleteScene,
    onDeleteShot,
    t
  } = deps;
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = reactExports.useState(false);
  const [editData, setEditData] = reactExports.useState({});
  const [copied, setCopied] = reactExports.useState(false);
  const [copiedCharacter, setCopiedCharacter] = reactExports.useState(false);
  const [copiedShotPrompts, setCopiedShotPrompts] = reactExports.useState(false);
  const [copiedScene, setCopiedScene] = reactExports.useState(false);
  const handleUploadCharacterImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !character) return;
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const localPath = await saveImageToLocal(
        dataUrl,
        "characters",
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${Date.now()}.png`
      );
      const nextReferenceImages = [...character.referenceImages || [], localPath].slice(0, 3);
      onUpdateCharacter?.(character.id, {
        thumbnailUrl: localPath,
        referenceImages: nextReferenceImages
      });
      toast.success(t("characters.savedLocal"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };
  const handleRemoveCharacterImage = (imagePath) => {
    if (!character) return;
    const nextReferenceImages = (character.referenceImages || []).filter((img) => img !== imagePath);
    onUpdateCharacter?.(character.id, {
      referenceImages: nextReferenceImages.length > 0 ? nextReferenceImages : void 0,
      thumbnailUrl: character.thumbnailUrl === imagePath ? nextReferenceImages[0] : character.thumbnailUrl
    });
  };
  const handleCopySceneData = async () => {
    if (!scene) return;
    const lines = [];
    lines.push(`# Scene: ${scene.name || "Untitled"}`);
    lines.push("");
    if (scene.description) {
      lines.push(`## Description`);
      lines.push(scene.description);
      lines.push("");
    }
    const includeScenePrompt = !!scene.scenePrompt;
    if (includeScenePrompt) {
      lines.push(`## Scene Prompt`);
      lines.push(scene.scenePrompt || "");
      lines.push("");
    }
    if (scene.importance || scene.appearanceCount || scene.episodeNumbers?.length) {
      lines.push(`## Appearance Stats`);
      if (scene.importance) {
        const importanceLabel = scene.importance === "main" ? "Primary Scene" : scene.importance === "secondary" ? "Secondary Scene" : "Transition Scene";
        lines.push(`Importance: ${importanceLabel}`);
      }
      if (scene.appearanceCount) lines.push(`Appearances: ${scene.appearanceCount}`);
      if (scene.episodeNumbers && scene.episodeNumbers.length > 0) {
        lines.push(`Episodes: ${scene.episodeNumbers.join(", ")}`);
      }
      lines.push("");
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScene(true);
      setTimeout(() => setCopiedScene(false), 2e3);
    } catch (e) {
      console.error("Copy scene failed:", e);
    }
  };
  const handleCopyCharacterData = async () => {
    if (!character) return;
    const lines = [];
    lines.push(`# Character: ${character.name}`);
    lines.push("");
    if (character.characterPrompt || character.appearance) {
      lines.push(`## Image Prompt`);
      lines.push(character.characterPrompt || character.appearance || "");
      lines.push("");
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCharacter(true);
      setTimeout(() => setCopiedCharacter(false), 2e3);
    } catch (e) {
      console.error("Copy character failed:", e);
    }
  };
  const handleCopyEpisodeShots = async () => {
    if (!episode || episodeShots.length === 0) return;
    const emotionLabels = {
      happy: "happy",
      sad: "sad",
      angry: "angry",
      surprised: "surprised",
      fearful: "fearful",
      calm: "calm",
      tense: "tense",
      excited: "excited",
      mysterious: "mysterious",
      romantic: "romantic",
      funny: "funny",
      touching: "touching",
      serious: "serious",
      relaxed: "relaxed",
      playful: "playful",
      gentle: "gentle",
      passionate: "passionate",
      low: "low"
    };
    const lines = [];
    lines.push(`# Episode ${episode.index}: ${episode.title.replace(/^\u7b2c\d+\u96c6[\uff1a:]?/, "")}`);
    lines.push("");
    lines.push(`## Shot List (${episodeShots.length} total)`);
    lines.push("");
    episodeShots.forEach((s, idx) => {
      lines.push(`### Shot ${String(idx + 1).padStart(2, "0")}`);
      if (s.dialogue) {
        lines.push(`**Dialogue**: "${s.dialogue}"`);
      }
      if (s.characterNames && s.characterNames.length > 0) {
        lines.push(`**Characters**: ${s.characterNames.join(", ")}`);
      }
      if (s.emotionTags && s.emotionTags.length > 0) {
        const tags = s.emotionTags.map((t2) => emotionLabels[t2] || t2).join(", ");
        lines.push(`**Emotion**: ${tags}`);
      }
      if (s.imagePrompt) {
        lines.push(`**Image Prompt**: ${s.imagePrompt}`);
      }
      if (s.videoPrompt) {
        lines.push(`**Video Prompt**: ${s.videoPrompt}`);
      }
      if (s.voiceOver) {
        lines.push(`**Voice Over**: ${s.voiceOver}`);
      }
      lines.push("");
    });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };
  const handleCopyShotTriPrompts = async () => {
    if (!shot) return;
    const hasTri = !!(shot.imagePrompt || shot.videoPrompt || shot.voiceOver);
    const lines = [];
    lines.push("═══════════════════════════════════════");
    lines.push(`Shot ${shot.index} - Prompt Data`);
    lines.push("═══════════════════════════════════════");
    lines.push("");
    if (!hasTri) {
      lines.push("Warning: this shot does not have prompts yet. Run AI shot calibration first.");
    } else {
      lines.push("───────────────────────────────────────");
      lines.push("[First-Frame Prompt] Used to generate the first video frame image");
      lines.push("───────────────────────────────────────");
      if (shot.imagePrompt) {
        lines.push(`English: ${shot.imagePrompt}`);
      } else {
        lines.push("(not generated)");
      }
      lines.push("");
      lines.push("───────────────────────────────────────");
      lines.push("[Video Prompt] Used for image-to-video generation, describing motion and action");
      lines.push("───────────────────────────────────────");
      if (shot.videoPrompt) {
        lines.push(`English: ${shot.videoPrompt}`);
      } else {
        lines.push("(not generated)");
      }
      lines.push("");
      if (shot.voiceOver) {
        lines.push("───────────────────────────────────────");
        lines.push("[Voice Over] Spoken narration, appended only when voice generation is enabled");
        lines.push("───────────────────────────────────────");
        lines.push(shot.voiceOver);
        lines.push("");
      }
    }
    lines.push("");
    lines.push("═══════════════════════════════════════");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedShotPrompts(true);
      setTimeout(() => setCopiedShotPrompts(false), 2e3);
    } catch (e) {
      console.error("Copy tri-layer prompts failed:", e);
    }
  };
  reactExports.useEffect(() => {
    setIsEditing(false);
    setEditData({});
  }, [selectedItemId, selectedItemType]);
  const startEditing = () => {
    if (selectedItemType === "character" && character) {
      setEditData({
        name: character.name || "",
        appearance: character.characterPrompt || character.appearance || ""
      });
    } else if (selectedItemType === "scene" && scene) {
      setEditData({
        name: scene.name || "",
        description: scene.description || "",
        scenePrompt: scene.scenePrompt || ""
      });
    } else if (selectedItemType === "shot" && shot) {
      setEditData({
        specialTechnique: shot.specialTechnique || "none"
      });
    }
    setIsEditing(true);
  };
  const handleSave = () => {
    if (selectedItemType === "character" && character) {
      onUpdateCharacter?.(character.id, editData);
    } else if (selectedItemType === "scene" && scene) {
      onUpdateScene?.(scene.id, editData);
    } else if (selectedItemType === "shot" && shot) {
      onUpdateShot?.(shot.id, editData);
    }
    setIsEditing(false);
  };
  const handleDelete = () => {
    if (selectedItemType === "character" && character) {
      onDeleteCharacter?.(character.id);
    } else if (selectedItemType === "scene" && scene) {
      onDeleteScene?.(scene.id);
    } else if (selectedItemType === "shot" && shot) {
      onDeleteShot?.(shot.id);
    }
    setDeleteDialogOpen(false);
  };
  return {
    isEditing,
    setIsEditing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editData,
    setEditData,
    copied,
    copiedCharacter,
    copiedShotPrompts,
    copiedScene,
    handleUploadCharacterImage,
    handleRemoveCharacterImage,
    handleCopySceneData,
    handleCopyCharacterData,
    handleCopyEpisodeShots,
    handleCopyShotTriPrompts,
    startEditing,
    handleSave,
    handleDelete
  };
}
function PropertyPanel({
  selectedItemId,
  selectedItemType,
  character,
  scene,
  shot,
  episode,
  episodeShots = [],
  sceneShots: _sceneShots = [],
  onGoToCharacterLibrary,
  onGoToSceneLibrary,
  onImportCharacters,
  onImportScenes,
  onGoToDirector,
  onGoToDirectorFromScene,
  onGenerateEpisodeShots,
  onUpdateCharacter,
  onUpdateScene,
  onUpdateShot,
  onDeleteCharacter,
  onDeleteScene,
  onDeleteShot
}) {
  const { t } = useI18n();
  const scriptProject = useActiveScriptProject();
  const {
    isEditing,
    setIsEditing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editData,
    setEditData,
    copied,
    copiedCharacter,
    copiedShotPrompts,
    copiedScene,
    handleUploadCharacterImage,
    handleRemoveCharacterImage,
    handleCopySceneData,
    handleCopyCharacterData,
    handleCopyEpisodeShots,
    handleCopyShotTriPrompts,
    startEditing,
    handleSave,
    handleDelete
  } = usePropertyEditing({
    selectedItemId,
    selectedItemType,
    character,
    scene,
    shot,
    episode,
    episodeShots,
    onUpdateCharacter,
    onUpdateScene,
    onUpdateShot,
    onDeleteCharacter,
    onDeleteScene,
    onDeleteShot,
    t
  });
  if (!selectedItemId || !selectedItemType) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center whitespace-pre-line text-muted-foreground text-sm p-4 text-center", children: t("property.empty") });
  }
  if (selectedItemType === "episode" && episode) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4 pb-32", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "h-5 w-5 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: t("property.episode", { index: episode.index }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: episode.title.replace(/^\u7b2c\d+\u96c6[\uff1a:]?/, "") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 p-3 rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: t("property.sceneStats") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children: t("property.sceneCount", { count: episode.scenes?.length || 0 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: t("property.shotStatus", { status: episode.shotGenerationStatus === "completed" ? `✅ ${t("property.shotStatus.completed")}` : episode.shotGenerationStatus === "generating" ? `⏳ ${t("property.shotStatus.generating")}` : `⏹ ${t("property.shotStatus.idle")}` }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        episode.shotGenerationStatus !== "completed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "w-full",
            onClick: () => onGenerateEpisodeShots?.(episode.index),
            disabled: episode.shotGenerationStatus === "generating",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-4 w-4 mr-2" }),
              t("property.generateShots")
            ]
          }
        ),
        episode.shotGenerationStatus === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            className: "w-full",
            onClick: handleCopyEpisodeShots,
            disabled: episodeShots.length === 0,
            children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }),
              t("property.copied")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
              t("property.copyShotData", { count: episodeShots.length })
            ] })
          }
        ) })
      ] })
    ] }) });
  }
  if (selectedItemType === "character" && character) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(ScrollArea, { className: "h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4 pb-32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5 text-muted-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editData.name || "",
                onChange: (e) => setEditData({ ...editData, name: e.target.value }),
                className: "h-7 text-sm font-medium"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: character.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: character.status })
          ] }),
          !isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: startEditing, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: handleSave, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => setIsEditing(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Prompt tạo nhân vật" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editData.appearance || "", onChange: (e) => setEditData({ ...editData, appearance: e.target.value }), className: "min-h-[40px]" })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: (character.characterPrompt || character.appearance) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-purple-500/10 to-transparent p-2 rounded-lg border-l-2 border-purple-500/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-purple-600 dark:text-purple-400 mb-1", children: "Prompt tạo nhân vật" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground/70 italic", children: character.characterPrompt || character.appearance })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              className: "w-full",
              onClick: () => onImportCharacters?.(character.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 mr-2" }),
                t("property.importCharacterLibrary")
              ]
            }
          ),
          character.characterLibraryId && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full",
              onClick: () => onGoToCharacterLibrary?.(character.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 mr-2" }),
                t("property.viewCharacterLibrary")
              ]
            }
          ),
          (character.referenceImages && character.referenceImages.length > 0 || character.thumbnailUrl) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("characters.referenceImages") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: Array.from(/* @__PURE__ */ new Set([...character.referenceImages || [], ...character.thumbnailUrl ? [character.thumbnailUrl] : []])).map((img, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: img, alt: character.name, className: "h-14 w-14 rounded border object-cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleRemoveCharacterImage(img),
                  className: "absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                }
              )
            ] }, `${img}-${index}`)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "script-character-upload",
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleUploadCharacterImage
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full",
                onClick: () => document.getElementById("script-character-upload")?.click(),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 mr-2" }),
                  t("director.card.upload")
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              className: "w-full",
              onClick: handleCopyCharacterData,
              children: copiedCharacter ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }),
                t("property.copied")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                t("property.copyCharacterData")
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full text-destructive hover:text-destructive",
              onClick: () => setDeleteDialogOpen(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
                t("property.deleteCharacter")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("property.confirmDelete") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("property.confirmDeleteCharacter", { name: character.name }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground", children: t("dashboard.delete") })
        ] })
      ] }) })
    ] });
  }
  if (selectedItemType === "scene" && scene) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(ScrollArea, { className: "h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4 pb-32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5 w-5 text-blue-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editData.name || "",
                onChange: (e) => setEditData({ ...editData, name: e.target.value }),
                className: "h-7 text-sm font-medium"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: scene.name || t("scenes.untitled") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: scene.status })
          ] }),
          !isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: startEditing, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: handleSave, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => setIsEditing(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.description") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: editData.description || "",
                onChange: (e) => setEditData({ ...editData, description: e.target.value }),
                placeholder: t("scenes.descriptionPlaceholder"),
                className: "min-h-[70px] text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("property.scenePrompt") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editData.scenePrompt || "", onChange: (e) => setEditData({ ...editData, scenePrompt: e.target.value }), className: "min-h-[90px] text-xs" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/30 p-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-primary", children: t("scenes.description") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm leading-relaxed text-muted-foreground", children: scene.description || t("scenes.noDescription") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/30 p-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-primary", children: "Prompt cảnh" }),
              scene.scenePrompt ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3" }),
                " Đã gen"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-100 px-2 py-0.5 text-2xs text-amber-700 dark:bg-amber-950 dark:text-amber-300", children: "Chưa có" })
            ] }),
            scene.scenePrompt ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm leading-relaxed text-muted-foreground italic", children: scene.scenePrompt }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Cảnh này chưa có prompt cảnh. Import lại hoặc chạy lại bước chia kịch bản để tạo prompt cảnh." })
          ] }),
          (scene.appearanceCount || scene.episodeNumbers?.length) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              scene.importance && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded text-xs ${scene.importance === "main" ? "bg-primary/10 text-primary" : scene.importance === "secondary" ? "bg-yellow-500/10 text-yellow-600" : "bg-muted text-muted-foreground"}`, children: scene.importance === "main" ? t("property.mainScene") : scene.importance === "secondary" ? t("property.secondaryScene") : t("property.transitionScene") }),
              scene.appearanceCount && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("property.appearsCount", { count: scene.appearanceCount }) }),
              scene.episodeNumbers && scene.episodeNumbers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("property.appearsEpisodes", { episodes: scene.episodeNumbers.join(", ") }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              className: "w-full",
              onClick: () => onImportScenes?.(scene.id),
              disabled: !!scene.sceneLibraryId,
              children: [
                scene.sceneLibraryId ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 mr-2" }),
                scene.sceneLibraryId ? "Đã import vào Scene Library" : t("property.importSceneLibrary")
              ]
            }
          ),
          scene.sceneLibraryId && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full",
              onClick: () => onGoToSceneLibrary?.(scene.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 mr-2" }),
                t("property.viewSceneLibrary")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full",
              onClick: handleCopySceneData,
              children: [
                copiedScene ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                copiedScene ? t("property.copied") : t("property.copySceneData")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "secondary",
              className: "w-full",
              onClick: () => onGoToDirectorFromScene?.(scene.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-4 w-4 mr-2" }),
                t("property.goAiDirector")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full text-destructive hover:text-destructive",
              onClick: () => setDeleteDialogOpen(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
                t("property.deleteScene")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("property.confirmDelete") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("property.confirmDeleteScene", { name: scene.name || t("scenes.untitled") }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground", children: t("dashboard.delete") })
        ] })
      ] }) })
    ] });
  }
  if (selectedItemType === "shot" && shot) {
    const shotStatus = getShotCompletionStatus(shot);
    const linkedScene = scriptProject?.scriptData?.scenes.find((item) => item.id === shot.sceneRefId);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(ScrollArea, { className: "h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4 pb-32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-5 w-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: t("property.shot", { index: String(shot.index).padStart(2, "0") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: shotStatus })
          ] }),
          !isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: startEditing, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: handleSave, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => setIsEditing(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] })
        ] }),
        shot.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: shot.imageUrl,
            alt: `Shot ${shot.index}`,
            className: "w-full h-auto"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("property.specialTechnique") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editData.specialTechnique || "", onChange: (e) => setEditData({ ...editData, specialTechnique: e.target.value }), className: "h-8 text-xs" })
        ] }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          linkedScene?.scenePrompt && /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusBadge, { label: "Scene Prompt", status: "ready" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusBadge, { label: t("promptStatus.imagePrompt"), status: getPromptTargetStatus(shot, "imagePrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PromptStatusBadge, { label: t("promptStatus.videoPrompt"), status: getPromptTargetStatus(shot, "videoPrompt") })
        ] }),
        linkedScene && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 text-blue-500" }),
            "Scene Reference"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs leading-relaxed bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 text-blue-800 dark:text-blue-200 break-words", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: linkedScene.name || t("scenes.untitled") }),
            linkedScene.scenePrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-emerald-700 dark:text-emerald-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Scene Prompt:" }),
              " ",
              linkedScene.scenePrompt
            ] })
          ] })
        ] }),
        !(shot.imagePrompt || shot.videoPrompt) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300", children: t("scriptInput.step2Incomplete") }),
        (shot.imagePrompt || shot.videoPrompt || shot.voiceOver) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground", children: "Director Prompts" }),
          shot.imagePrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-violet-400" }),
              "Image Prompt"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs leading-relaxed bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded p-2 text-violet-800 dark:text-violet-200 break-words", children: shot.imagePrompt })
          ] }),
          shot.videoPrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-blue-400" }),
              "Video Prompt"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs leading-relaxed bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 text-blue-800 dark:text-blue-200 break-words", children: shot.videoPrompt })
          ] }),
          shot.voiceOver && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-emerald-400" }),
              "Voice Over"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs leading-relaxed bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-800 dark:text-emerald-200 break-words", children: shot.voiceOver })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("property.image") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatusBadge,
              {
                status: shot.imageStatus === "completed" ? "completed" : shot.imageStatus === "generating" ? "in_progress" : "pending"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("property.video") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatusBadge,
              {
                status: shot.videoStatus === "completed" ? "completed" : shot.videoStatus === "generating" ? "in_progress" : "pending"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              className: "w-full",
              onClick: () => onGoToDirector?.(shot.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 mr-2" }),
                t("property.goAiDirectorShort")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              className: "w-full",
              onClick: handleCopyShotTriPrompts,
              children: copiedShotPrompts ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }),
                t("property.copied")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                t("property.copyThreeLayerPrompts")
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full text-destructive hover:text-destructive",
              onClick: () => setDeleteDialogOpen(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
                t("property.deleteShot")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("property.confirmDelete") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("property.confirmDeleteShot", { index: shot.index }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground", children: t("dashboard.delete") })
        ] })
      ] }) })
    ] });
  }
  return null;
}
function useLibraryNavigation(deps) {
  const {
    projectId,
    scriptData,
    shots,
    styleId,
    activeEpisodeIndex,
    activeEpisodeId,
    allCharacters,
    sceneLibraryItems,
    uiLanguage,
    setActiveTab,
    selectLibraryCharacter,
    selectLibraryScene,
    addLibraryCharacter,
    addLibraryScene,
    setCharacterLibraryFolder,
    setSceneLibraryFolder,
    updateCharacter,
    updateScene,
    goToSceneWithData,
    goToDirectorWithData,
    getShotPromptVoiceFields: getShotPromptVoiceFields2,
    t
  } = deps;
  const [sceneImportOpen, setSceneImportOpen] = reactExports.useState(false);
  const [selectedSceneImportIds, setSelectedSceneImportIds] = reactExports.useState([]);
  const extractPromptCharacterNames = reactExports.useCallback((...prompts) => {
    const names = /* @__PURE__ */ new Set();
    for (const prompt of prompts) {
      if (!prompt) continue;
      for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
        const name = (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
        if (name) names.add(name);
      }
    }
    return Array.from(names);
  }, []);
  const mapPromptNamesToLibraryIds = reactExports.useCallback((names) => {
    const ids = [];
    const seen = /* @__PURE__ */ new Set();
    for (const name of names) {
      const libraryChar = allCharacters.find(
        (c) => c.name === name || c.name.includes(name) || name.includes(c.name)
      );
      if (libraryChar && !seen.has(libraryChar.id)) {
        ids.push(libraryChar.id);
        seen.add(libraryChar.id);
      }
    }
    return ids;
  }, [allCharacters]);
  const getSceneLibraryReference = reactExports.useCallback((scene) => {
    if (!scene) return {};
    const linked = scene.sceneLibraryId ? sceneLibraryItems.find((item) => item.id === scene.sceneLibraryId) : void 0;
    const matched = linked || sceneLibraryItems.find((item) => {
      const sceneName = scene.name || "";
      return !!sceneName && (item.name.includes(sceneName) || sceneName.includes(item.name));
    });
    return {
      sceneLibraryId: matched?.id,
      sceneReferenceImage: matched?.referenceImage || matched?.referenceImageBase64
    };
  }, [sceneLibraryItems]);
  const storyPromptLabels = uiLanguage === "vi" ? {
    scene: "Cảnh",
    time: "Thời gian",
    mood: "Bầu không khí",
    action: "Hành động",
    dialogue: "Lời thoại",
    shotList: "Danh sách shot",
    shot: "Shot"
  } : {
    scene: "Scene",
    time: "Time",
    mood: "Mood",
    action: "Action",
    dialogue: "Dialogue",
    shotList: "Shot List",
    shot: "Shot"
  };
  const handleGoToCharacterLibrary = reactExports.useCallback(
    (characterId) => {
      const character = scriptData?.characters.find((c) => c.id === characterId);
      if (!character) {
        setActiveTab("characters");
        toast.info(t("scriptView.goCharacterLibrary"));
        return;
      }
      if (character.characterLibraryId) {
        const libChar = allCharacters.find((c) => c.id === character.characterLibraryId);
        if (libChar) {
          selectLibraryCharacter(character.characterLibraryId);
          setActiveTab("characters");
          toast.info(t("scriptView.goCharacterLibrarySelected", { name: character.name }));
          return;
        }
        updateCharacter(projectId, character.id, { characterLibraryId: void 0 });
      }
      const libraryId = addLibraryCharacter({
        name: character.name,
        description: character.appearance,
        characterPrompt: character.characterPrompt || "",
        projectId,
        aspectRatio: "1:1",
        styleId,
        status: "linked",
        linkedEpisodeId: activeEpisodeId,
        thumbnailUrl: void 0
      });
      updateCharacter(projectId, character.id, { characterLibraryId: libraryId });
      useScriptStore.getState().setMappings(projectId, {
        characterIdMap: {
          ...useScriptStore.getState().projects[projectId]?.characterIdMap,
          [character.id]: libraryId
        }
      });
      setCharacterLibraryFolder(null);
      selectLibraryCharacter(libraryId);
      setActiveTab("characters");
      toast.success(t("scriptView.charactersImported", { count: 1 }));
    },
    [scriptData, styleId, setActiveTab, selectLibraryCharacter, activeEpisodeIndex, activeEpisodeId, addLibraryCharacter, projectId, updateCharacter, setCharacterLibraryFolder, t]
  );
  const handleOpenCharactersPanel = reactExports.useCallback((initialCharacterId) => {
    if (initialCharacterId) {
      handleGoToCharacterLibrary(initialCharacterId);
      return;
    }
    setActiveTab("characters");
    toast.info(t("scriptView.goCharacterLibrary"));
  }, [handleGoToCharacterLibrary, setActiveTab, t]);
  const handleGoToSceneLibrary = reactExports.useCallback(
    (sceneId) => {
      const scene = scriptData?.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        setActiveTab("scenes");
        toast.info(t("scriptView.goSceneLibrary"));
        return;
      }
      if (scene.sceneLibraryId && sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)) {
        selectLibraryScene(scene.sceneLibraryId);
        setActiveTab("scenes");
        toast.info(t("scriptView.goSceneLibrarySelected", { name: scene.name || t("scenes.untitled") }));
        return;
      }
      goToSceneWithData({
        name: scene.name || t("scenes.untitled"),
        description: scene.description || scene.name,
        aspectRatio: "16:9",
        styleId,
        scenePrompt: scene.scenePrompt,
        // === Episode-scope passthrough ===
        sourceEpisodeIndex: activeEpisodeIndex ?? void 0,
        sourceEpisodeId: activeEpisodeId,
        // === Prompt language preference ===
        promptLanguage: "en"
      });
      toast.success(t("scriptView.goSceneLibraryBasic", { name: scene.name || t("scenes.untitled") }));
    },
    [scriptData, sceneLibraryItems, styleId, setActiveTab, goToSceneWithData, activeEpisodeIndex, activeEpisodeId, selectLibraryScene, t]
  );
  const openSceneImport = reactExports.useCallback((initialSceneId) => {
    const importableScenes = (scriptData?.scenes || []).filter(
      (scene) => !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
    );
    if (importableScenes.length === 0) {
      setActiveTab("scenes");
      toast.info(t("scriptView.allScenesImported"));
      return;
    }
    const defaultIds = initialSceneId && importableScenes.some((scene) => scene.id === initialSceneId) ? [initialSceneId] : importableScenes.map((scene) => scene.id);
    setSelectedSceneImportIds(defaultIds);
    setSceneImportOpen(true);
  }, [scriptData, sceneLibraryItems, setActiveTab, t]);
  const handleImportScenes = reactExports.useCallback(() => {
    const importScenes = (scriptData?.scenes || []).filter((scene) => selectedSceneImportIds.includes(scene.id));
    if (importScenes.length === 0) {
      toast.error(t("scriptView.selectScenesToImport"));
      return;
    }
    let lastImportedSceneId = null;
    importScenes.forEach((scene) => {
      const libraryId = addLibraryScene({
        name: scene.name || t("scenes.untitled"),
        description: scene.description || scene.name,
        time: "day",
        atmosphere: "neutral",
        aspectRatio: "16:9",
        projectId,
        scenePrompt: scene.scenePrompt,
        styleId,
        status: "linked",
        linkedEpisodeId: activeEpisodeId,
        sourceScriptSceneId: scene.id
      });
      lastImportedSceneId = libraryId;
      updateScene(projectId, scene.id, { sceneLibraryId: libraryId });
    });
    setSceneImportOpen(false);
    setSelectedSceneImportIds([]);
    setSceneLibraryFolder(null);
    if (lastImportedSceneId) {
      selectLibraryScene(lastImportedSceneId);
    }
    setActiveTab("scenes");
    toast.success(t("scriptView.scenesImported", { count: importScenes.length }));
  }, [scriptData, selectedSceneImportIds, addLibraryScene, projectId, styleId, activeEpisodeId, updateScene, setSceneLibraryFolder, selectLibraryScene, setActiveTab, t]);
  const handleGoToDirector = reactExports.useCallback(
    (shotId) => {
      const shot = shots.find((s) => s.id === shotId);
      if (!shot) {
        setActiveTab("director");
        toast.info(t("scriptView.goDirector"));
        return;
      }
      const scene = scriptData?.scenes.find((s) => s.id === shot.sceneRefId);
      const voiceFields = getShotPromptVoiceFields2(shot);
      const promptParts = [];
      if (scene) {
        promptParts.push(`${storyPromptLabels.scene}: ${scene.name || t("scenes.untitled")}`);
      }
      if (shot.imagePrompt) promptParts.push(`Image: ${shot.imagePrompt}`);
      if (voiceFields.videoPrompt) promptParts.push(`Video: ${voiceFields.videoPrompt}`);
      const storyPrompt = promptParts.join("\n");
      const characterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
      const characterLibraryIds = mapPromptNamesToLibraryIds(characterNames);
      const sceneReference = getSceneLibraryReference(scene);
      goToDirectorWithData({
        storyPrompt,
        characterNames,
        characterLibraryIds,
        sceneLocation: scene?.name,
        sceneTime: void 0,
        shotId,
        sceneCount: 1,
        styleId,
        sourceType: "shot",
        sourceEpisodeIndex: activeEpisodeIndex ?? void 0,
        sourceEpisodeId: activeEpisodeId,
        prebuiltScenes: [{
          imagePrompt: shot.imagePrompt || "",
          videoPrompt: voiceFields.videoPrompt,
          voiceOver: voiceFields.voiceOver,
          videoLength: normalizeVideoLength(shot.videoLength),
          ref_image: shot.ref_image,
          sourceShotId: shot.id,
          sourceShotIndex: shot.index,
          characterIds: characterLibraryIds,
          characterNames,
          sceneName: scene?.name || "",
          sceneLocation: scene?.name || "",
          ...sceneReference
        }]
      });
      toast.success(t("scriptView.goDirectorShotFilled"));
    },
    [shots, scriptData, styleId, goToDirectorWithData, setActiveTab, activeEpisodeIndex, activeEpisodeId, storyPromptLabels, sceneLibraryItems, t]
  );
  const handleGoToDirectorFromScene = reactExports.useCallback(
    (sceneId) => {
      const scene = scriptData?.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        setActiveTab("director");
        toast.info(t("scriptView.goDirector"));
        return;
      }
      const sceneShots = shots.filter((s) => s.sceneRefId === sceneId);
      const shotCount = sceneShots.length || 1;
      const promptParts = [];
      promptParts.push(`${storyPromptLabels.scene}: ${scene.name || t("scenes.untitled")}`);
      if (sceneShots.length > 0) {
        promptParts.push(`
--- ${storyPromptLabels.shotList} (${sceneShots.length}) ---`);
        sceneShots.forEach((shot, idx) => {
          const voiceFields = getShotPromptVoiceFields2(shot);
          const shotDesc = [
            `
[${storyPromptLabels.shot} ${idx + 1}]`,
            shot.imagePrompt ? `Image: ${shot.imagePrompt}` : null,
            voiceFields.videoPrompt ? `Video: ${voiceFields.videoPrompt}` : null
          ].filter(Boolean).join(" ");
          promptParts.push(shotDesc);
        });
      }
      const storyPrompt = promptParts.join("\n");
      const allCharacterNames = /* @__PURE__ */ new Set();
      sceneShots.forEach((shot) => {
        const voiceFields = getShotPromptVoiceFields2(shot);
        extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt).forEach((name) => allCharacterNames.add(name));
      });
      const sceneReference = getSceneLibraryReference(scene);
      goToDirectorWithData({
        storyPrompt,
        characterNames: Array.from(allCharacterNames),
        characterLibraryIds: mapPromptNamesToLibraryIds(Array.from(allCharacterNames)),
        sceneLocation: scene.name,
        sceneTime: void 0,
        sceneCount: shotCount,
        styleId,
        sourceType: "scene",
        sourceEpisodeIndex: activeEpisodeIndex ?? void 0,
        sourceEpisodeId: activeEpisodeId,
        prebuiltScenes: sceneShots.map((shot) => {
          const voiceFields = getShotPromptVoiceFields2(shot);
          const names = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
          return {
            imagePrompt: shot.imagePrompt || "",
            videoPrompt: voiceFields.videoPrompt,
            voiceOver: voiceFields.voiceOver,
            videoLength: normalizeVideoLength(shot.videoLength),
            ref_image: shot.ref_image,
            sourceShotId: shot.id,
            sourceShotIndex: shot.index,
            characterIds: mapPromptNamesToLibraryIds(names),
            characterNames: names,
            sceneName: scene.name || "",
            sceneLocation: scene.name || "",
            ...sceneReference
          };
        })
      });
      toast.success(t("scriptView.goDirectorSceneFilled", { name: scene.name || t("scenes.untitled"), count: shotCount }));
    },
    [shots, scriptData, styleId, goToDirectorWithData, setActiveTab, activeEpisodeIndex, activeEpisodeId, storyPromptLabels, sceneLibraryItems, t]
  );
  return {
    sceneImportOpen,
    setSceneImportOpen,
    selectedSceneImportIds,
    setSelectedSceneImportIds,
    extractPromptCharacterNames,
    mapPromptNamesToLibraryIds,
    getSceneLibraryReference,
    handleGoToCharacterLibrary,
    handleOpenCharactersPanel,
    handleGoToSceneLibrary,
    openSceneImport,
    handleImportScenes,
    handleGoToDirector,
    handleGoToDirectorFromScene
  };
}
function useScriptExport({
  shots,
  scriptData,
  setActiveTab,
  appendProcessLog,
  getShotPromptVoiceFields: getShotPromptVoiceFields2
}) {
  const seedAutoVideoFromShots = useAutoVideoStore((s) => s.seedFromShots);
  const directorProject = useActiveDirectorProject();
  const directorSplitScenes = directorProject?.splitScenes ?? [];
  const handleExportPromptCsv = reactExports.useCallback(() => {
    if (shots.length === 0) {
      toast.error("Không có shot để export CSV.");
      return;
    }
    const escapeCsvCell = (value) => {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const episodeIndexById = new Map((scriptData?.episodes || []).map((episode) => [episode.id, episode.index]));
    const sceneById = new Map((scriptData?.scenes || []).map((scene) => [scene.id, scene]));
    const rows = shots.map((shot, index) => {
      const scene = shot.sceneRefId ? sceneById.get(shot.sceneRefId) : void 0;
      const voiceFields = getShotPromptVoiceFields2(shot);
      return [
        episodeIndexById.get(shot.episodeId || "") || 1,
        shot.index || index + 1,
        scene?.name || "",
        normalizeRefImageIndexes(shot.ref_image).join(","),
        shot.imagePrompt || "",
        voiceFields.videoPrompt,
        voiceFields.voiceOver,
        normalizeVideoLength(shot.videoLength)
      ].map(escapeCsvCell).join(",");
    });
    const csv = ["episodeIndex,shotIndex,sceneName,ref_image,imagePrompt,videoPrompt,voiceOver,videoLength", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${scriptData?.title || "script-prompts"}.csv`.replace(/[\\/:*?"<>|]+/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã export ${shots.length} shot ra CSV.`);
  }, [shots, scriptData]);
  const handleSendToAutoVideo = reactExports.useCallback(() => {
    if (shots.length === 0) return;
    const splitImageById = /* @__PURE__ */ new Map();
    const splitVideoById = /* @__PURE__ */ new Map();
    for (const sc of directorSplitScenes) {
      if (sc.imageDataUrl) splitImageById.set(sc.id, sc.imageDataUrl);
      if (sc.videoUrl) splitVideoById.set(sc.id, sc.videoUrl);
    }
    const resolvedShots = shots.map((s, posIdx) => {
      const voiceFields = getShotPromptVoiceFields2(s);
      const directorSrc = splitImageById.get(s.index - 1) ?? (directorSplitScenes[posIdx]?.imageDataUrl ?? "");
      const directorVideoSrc = splitVideoById.get(s.index - 1) ?? (directorSplitScenes[posIdx]?.videoUrl ?? "");
      const src = directorSrc || s.imageUrl || "";
      const imagePath = src.startsWith("data:") || src.startsWith("blob:") ? "" : src;
      const videoPath = directorVideoSrc.startsWith("data:") || directorVideoSrc.startsWith("blob:") ? "" : directorVideoSrc;
      return { index: s.index, voiceOver: voiceFields.voiceOver, videoPrompt: voiceFields.videoPrompt, imagePath, videoPath };
    });
    const result = seedAutoVideoFromShots(resolvedShots);
    appendProcessLog(`Gửi Auto Video: ${result.matched} câu, ${result.skipped} shot bỏ qua`);
    setActiveTab("autoVideo");
    const linked = resolvedShots.filter((s) => s.imagePath).length;
    if (result.matched === 0) {
      toast.error("Không tìm thấy voiceOver nào để gửi sang Auto Video");
    } else {
      const parts = [`Đã gửi ${result.matched} câu sang Auto Video`];
      if (linked > 0) parts.push(`(${linked} ảnh đã link)`);
      const linkedVideos = resolvedShots.filter((s) => s.videoPath).length;
      if (linkedVideos > 0) parts.push(`(${linkedVideos} video đã link)`);
      if (result.skipped > 0) parts.push(`— bỏ qua ${result.skipped} shot không có voice`);
      toast.success(parts.join(" "));
    }
  }, [shots, directorSplitScenes, seedAutoVideoFromShots, setActiveTab, appendProcessLog]);
  return { handleExportPromptCsv, handleSendToAutoVideo };
}
function isImportCancelled(error) {
  if (!(error instanceof Error)) return false;
  return /cancelled|canceled|aborted|abort/i.test(error.message) || error.name === "AbortError";
}
function getShotPromptVoiceFields(shot) {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  return {
    videoPrompt: parts.videoPrompt,
    voiceOver: cleanVoiceOverText(shot.voiceOver) || parts.voiceOver
  };
}
function ScriptView() {
  const { t, language: uiLanguage } = useI18n();
  const { activeProjectId, activeProject } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const {
    setActiveProjectId,
    ensureProject,
    setRawScript,
    setScriptData,
    setEpisodeRawScripts,
    // Bundle operations (keep episodeRawScripts in sync)
    updateEpisodeBundle,
    deleteEpisodeBundle,
    addScene,
    updateScene,
    deleteScene,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    updateShot,
    deleteShot,
    updateEpisodeRawScript,
    setCalibrationState: setScriptCalibrationState
  } = useScriptStore();
  const { checkChatKeys, isFeatureConfigured } = useAPIConfigStore();
  const {
    characters: allCharacters,
    selectCharacter: selectLibraryCharacter,
    addCharacter: addLibraryCharacter,
    setCurrentFolder: setCharacterLibraryFolder
  } = useCharacterLibraryStore();
  const {
    addScene: addLibraryScene,
    selectScene: selectLibraryScene,
    setCurrentFolder: setSceneLibraryFolder,
    scenes: sceneLibraryItems
  } = useSceneStore();
  const { setActiveTab, goToDirectorWithData, goToSceneWithData, activeEpisodeIndex, enterEpisode } = useMediaPanelStore();
  const [selectedItemId, setSelectedItemId] = reactExports.useState(null);
  const [selectedItemType, setSelectedItemType] = reactExports.useState(null);
  const [cliStreamTitle] = reactExports.useState(null);
  const [cliStreamOutput] = reactExports.useState("");
  const [showProcessLog, setShowProcessLog] = reactExports.useState(false);
  const [processLogs, setProcessLogs] = reactExports.useState([]);
  const importAbortControllerRef = reactExports.useRef(null);
  const appendProcessLog = reactExports.useCallback((message) => {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    setProcessLogs((current) => [...current.slice(-99), `[${time}] ${message}`]);
  }, []);
  reactExports.useEffect(() => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  }, [activeProjectId]);
  const [importError, setImportError] = reactExports.useState();
  const calibrationState = scriptProject?.calibrationState;
  const calibrationStatus = calibrationState?.titleCalibrationStatus || "idle";
  const [, setMissingTitleCount] = reactExports.useState(0);
  const importStatus = calibrationState?.importStatus || "idle";
  const setImportStatus = reactExports.useCallback((status) => {
    if (!activeProjectId) return;
    setScriptCalibrationState(activeProjectId, { importStatus: status });
  }, [activeProjectId, setScriptCalibrationState]);
  const handleCancelImport = reactExports.useCallback(() => {
    const controller = importAbortControllerRef.current;
    if (!controller || controller.signal.aborted) return;
    appendProcessLog("Đã gửi yêu cầu dừng import đang chạy");
    controller.abort();
  }, [appendProcessLog]);
  const structureCompletionStatus = calibrationState?.structureCompletionStatus || "idle";
  const [structureOverwriteConfirmOpen, setStructureOverwriteConfirmOpen] = reactExports.useState(false);
  const prevEpisodeRef = reactExports.useRef({ index: null, rawLen: 0 });
  reactExports.useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
      ensureProject(activeProjectId);
    }
  }, [activeProjectId, setActiveProjectId, ensureProject]);
  reactExports.useEffect(() => {
    if (!activeProjectId) return;
    const state = useScriptStore.getState().projects[activeProjectId]?.calibrationState;
    if (!state) return;
    const fixes = {};
    if (state.importStatus === "importing") fixes.importStatus = "idle";
    if (Object.keys(fixes).length > 0) {
      setScriptCalibrationState(activeProjectId, fixes);
    }
  }, [activeProjectId]);
  const stableProjectIdRef = reactExports.useRef("default-project");
  reactExports.useEffect(() => {
    if (activeProjectId) {
      stableProjectIdRef.current = activeProjectId;
    }
  }, [activeProjectId]);
  const projectId = activeProjectId || stableProjectIdRef.current;
  const setCalibrationStatus = reactExports.useCallback((status) => {
    setScriptCalibrationState(projectId, { titleCalibrationStatus: status });
  }, [projectId, setScriptCalibrationState]);
  const setStructureCompletionStatus = reactExports.useCallback((status) => {
    setScriptCalibrationState(projectId, { structureCompletionStatus: status });
  }, [projectId, setScriptCalibrationState]);
  const rawScript = scriptProject?.rawScript || "";
  const targetDuration = scriptProject?.targetDuration || "60s";
  const styleId = scriptProject?.styleId || DEFAULT_STYLE_ID;
  const scriptData = scriptProject?.scriptData || null;
  const parseStatus = scriptProject?.parseStatus || "idle";
  const parseError = scriptProject?.parseError;
  const shots = scriptProject?.shots || [];
  const promptLanguage = "en";
  const activeEpisodeId = activeEpisodeIndex != null ? scriptData?.episodes.find((ep) => ep.index === activeEpisodeIndex)?.id ?? void 0 : void 0;
  reactExports.useEffect(() => {
    if (activeEpisodeIndex != null && scriptData?.episodes) {
      const ep = scriptData.episodes.find((e) => e.index === activeEpisodeIndex);
      if (ep) {
        setSelectedItemId(`episode_${activeEpisodeIndex}`);
        setSelectedItemType("episode");
      }
    }
  }, [activeEpisodeIndex, scriptData?.episodes]);
  const chatConfigured = isFeatureConfigured("script_analysis") || checkChatKeys().isAllConfigured;
  const episodeRawScripts = scriptProject?.episodeRawScripts || [];
  reactExports.useEffect(() => {
    if (!scriptData) return;
    const isLegacyPromptTitle = (title) => /^Imported Prompts(?:\s+\d+)?$/i.test(title || "");
    const hasLegacyTitle = isLegacyPromptTitle(scriptData.title) || scriptData.episodes.some((episode) => isLegacyPromptTitle(episode.title)) || episodeRawScripts.some((episode) => isLegacyPromptTitle(episode.title));
    if (!hasLegacyTitle) return;
    setScriptData(projectId, {
      ...scriptData,
      title: isLegacyPromptTitle(scriptData.title) ? activeProject?.name || "" : scriptData.title,
      episodes: scriptData.episodes.map((episode) => ({
        ...episode,
        title: isLegacyPromptTitle(episode.title) ? t("overview.episode", { index: episode.index }) : episode.title
      }))
    });
    setEpisodeRawScripts(projectId, episodeRawScripts.map((episode) => ({
      ...episode,
      title: isLegacyPromptTitle(episode.title) ? t("overview.episode", { index: episode.episodeIndex }) : episode.title
    })));
  }, [activeProject?.name, episodeRawScripts, projectId, scriptData, setEpisodeRawScripts, setScriptData, t]);
  const effectiveRawScript = activeEpisodeIndex != null ? episodeRawScripts.find((ep) => ep.episodeIndex === activeEpisodeIndex)?.rawContent ?? "" : rawScript;
  const handleStructureCompletion = reactExports.useCallback(async () => {
    if (activeEpisodeIndex == null || !scriptData) return;
    appendProcessLog(`Bắt đầu hoàn thiện cấu trúc tập ${activeEpisodeIndex}`);
    setStructureCompletionStatus("processing");
    try {
      const result = await importSingleEpisodeContent(
        effectiveRawScript,
        activeEpisodeIndex,
        projectId,
        appendProcessLog
      );
      if (result.success) {
        setStructureCompletionStatus("completed");
        appendProcessLog(`Hoàn thiện cấu trúc xong: ${result.sceneCount} cảnh`);
        if (result.sceneCount > 0) {
          toast.success(t("scriptView.structureComplete", { count: result.sceneCount }));
        }
      } else {
        setStructureCompletionStatus("error");
        appendProcessLog(`Lỗi hoàn thiện cấu trúc: ${result.error || t("scriptView.structureCompleteFailed")}`);
        toast.error(result.error || t("scriptView.structureCompleteFailed"));
      }
    } catch (e) {
      setStructureCompletionStatus("error");
      appendProcessLog(`Lỗi hoàn thiện cấu trúc: ${e.message || String(e)}`);
      console.error("[handleStructureCompletion]", e);
    }
    setTimeout(() => setStructureCompletionStatus("idle"), 3e3);
  }, [activeEpisodeIndex, effectiveRawScript, projectId, scriptData, appendProcessLog, t]);
  reactExports.useEffect(() => {
    const prev = prevEpisodeRef.current;
    const currentLen = effectiveRawScript.length;
    if (prev.index !== (activeEpisodeIndex ?? null)) {
      prevEpisodeRef.current = { index: activeEpisodeIndex ?? null, rawLen: currentLen };
      return;
    }
    prevEpisodeRef.current = { index: activeEpisodeIndex ?? null, rawLen: currentLen };
    if (activeEpisodeIndex == null) return;
    if (structureCompletionStatus !== "idle") return;
    if (prev.rawLen < 20 && currentLen > 50) {
      const ep = scriptData?.episodes?.find((e) => e.index === activeEpisodeIndex);
      const hasScenes = ep && ep.sceneIds.length > 0;
      if (hasScenes) {
        setStructureOverwriteConfirmOpen(true);
      } else {
        handleStructureCompletion();
      }
    }
  }, [effectiveRawScript, activeEpisodeIndex, structureCompletionStatus]);
  const episodeGenerationStatus = episodeRawScripts.reduce((acc, ep) => {
    acc[ep.episodeIndex] = ep.shotGenerationStatus;
    return acc;
  }, {});
  const handleSelectItem = reactExports.useCallback(
    (id, type) => {
      setSelectedItemId(id);
      setSelectedItemType(type);
      if (type === "episode" && id.startsWith("episode_")) {
        const epIndex = parseInt(id.replace("episode_", ""), 10);
        if (!Number.isNaN(epIndex)) {
          enterEpisode(epIndex, projectId);
        }
      }
    },
    [enterEpisode, projectId]
  );
  const selectedCharacter = selectedItemType === "character" ? scriptData?.characters.find((c) => c.id === selectedItemId) : void 0;
  const selectedScene = selectedItemType === "scene" ? scriptData?.scenes.find((s) => s.id === selectedItemId) : void 0;
  const selectedShot = selectedItemType === "shot" ? shots.find((s) => s.id === selectedItemId) : void 0;
  const selectedEpisode = selectedItemType === "episode" && selectedItemId ? (() => {
    const epIndex = parseInt(selectedItemId.replace("episode_", ""));
    const rawScript2 = episodeRawScripts.find((ep) => ep.episodeIndex === epIndex);
    const epData = scriptData?.episodes.find((ep) => ep.index === epIndex);
    return rawScript2 && epData ? { ...epData, ...rawScript2 } : void 0;
  })() : void 0;
  const selectedSceneShots = selectedItemType === "scene" && selectedItemId ? shots.filter((s) => s.sceneRefId === selectedItemId || s.sceneId === selectedItemId) : void 0;
  const selectedEpisodeShots = selectedItemType === "episode" && selectedEpisode ? shots.filter((shot) => shot.episodeId === selectedEpisode.id) : [];
  const handleGenerateEpisodeShots = reactExports.useCallback(async (episodeIndex) => {
    const featureConfig = getFeatureConfig("script_analysis");
    console.log("[handleGenerateEpisodeShots] featureConfig:", featureConfig ? "configured" : "not configured");
    console.log("[handleGenerateEpisodeShots] allApiKeys:", featureConfig?.allApiKeys?.length || 0);
    if (!featureConfig) {
      toast.warning(t("scriptView.zhipuMissingSkipViewAnalysis"));
    }
    try {
      appendProcessLog(`Bắt đầu chia shot tập ${episodeIndex}`);
      toast.info(t("scriptView.generatingEpisodeShots", { index: episodeIndex }));
      const apiKey = featureConfig?.allApiKeys?.join(",") || "";
      const provider = featureConfig?.platform || "openai";
      console.log("[handleGenerateEpisodeShots] apiKey length:", apiKey.length);
      console.log("[handleGenerateEpisodeShots] provider:", provider, "(from config:", featureConfig?.platform, ")");
      const options = {
        apiKey,
        provider,
        baseUrl: featureConfig?.baseUrl,
        styleId,
        targetDuration,
        promptLanguage
      };
      const result = await generateEpisodeShots(
        episodeIndex,
        projectId,
        options,
        (msg) => {
          console.log(`[ScriptView] ${msg}`);
          appendProcessLog(msg);
        }
      );
      appendProcessLog(`Chia shot tập ${episodeIndex} xong: ${result.shots.length} shot`);
      toast.success(t("scriptView.episodeShotsDone", { index: episodeIndex, count: result.shots.length }));
      return result;
    } catch (error) {
      const err = error;
      console.error("[ScriptView] Episode shot generation failed:", err);
      appendProcessLog(`Lỗi chia shot tập ${episodeIndex}: ${err.message}`);
      toast.error(t("scriptView.shotGenerationFailed", { message: err.message }));
      return { shots: [] };
    }
  }, [projectId, styleId, targetDuration, appendProcessLog, t]);
  const handleImportWithSkill = reactExports.useCallback(async (text, skillText) => {
    if (!text.trim() || !skillText.trim()) {
      toast.error("Please provide both script text and a skill.");
      return;
    }
    const featureConfig = getFeatureConfig("script_analysis") || getFeatureConfig("chat");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("script_analysis"));
      return;
    }
    const controller = new AbortController();
    importAbortControllerRef.current?.abort();
    importAbortControllerRef.current = controller;
    setImportStatus("importing");
    setImportError(void 0);
    setCalibrationStatus("calibrating");
    appendProcessLog(`Bắt đầu nhập kịch bản bằng skill: ${text.trim().length} ký tự`);
    try {
      const result = await importScriptWithSkill(text, skillText, projectId, { styleId, onProgress: appendProcessLog, signal: controller.signal });
      if (controller.signal.aborted) {
        throw new Error("Cancelled by user");
      }
      if (!result.success) {
        throw new Error(result.error || "Skill import failed");
      }
      setImportStatus("ready");
      const importedShots = useScriptStore.getState().projects[projectId]?.shots || [];
      setCalibrationStatus("completed");
      appendProcessLog(`Nhập bằng skill xong: ${result.episodes.length} tập, ${result.scriptData?.scenes.length || 0} cảnh, ${importedShots.length} shot`);
      toast.success(`Skill import complete: ${result.episodes.length} episode(s), ${result.scriptData?.scenes.length || 0} scene(s), ${importedShots.length} shot(s)`);
    } catch (error) {
      const err = error;
      if (isImportCancelled(err)) {
        console.warn("[ScriptView] Skill import cancelled:", err);
        setImportStatus("idle");
        setCalibrationStatus("idle");
        setImportError(void 0);
        appendProcessLog("Đã dừng nhập bằng skill");
        toast.info("Đã dừng nhập bằng skill");
        return;
      }
      console.error("[ScriptView] Skill import failed:", err);
      setImportStatus("error");
      setCalibrationStatus("error");
      setImportError(err.message);
      appendProcessLog(`Lỗi nhập bằng skill: ${err.message}`);
      toast.error(t("scriptView.parseFailed", { message: err.message }));
    } finally {
      if (importAbortControllerRef.current === controller) {
        importAbortControllerRef.current = null;
      }
    }
  }, [projectId, styleId, t, appendProcessLog]);
  reactExports.useEffect(() => {
    if (importStatus === "ready" && projectId) {
      const missingTitles = getMissingTitleEpisodes(projectId);
      setMissingTitleCount(missingTitles.length);
    }
  }, [importStatus, projectId, episodeRawScripts]);
  const {
    sceneImportOpen,
    setSceneImportOpen,
    selectedSceneImportIds,
    setSelectedSceneImportIds,
    handleGoToCharacterLibrary,
    handleOpenCharactersPanel,
    handleGoToSceneLibrary,
    openSceneImport,
    handleImportScenes,
    handleGoToDirector,
    handleGoToDirectorFromScene
  } = useLibraryNavigation({
    projectId,
    scriptData,
    shots,
    styleId,
    activeEpisodeIndex,
    activeEpisodeId,
    allCharacters,
    sceneLibraryItems,
    uiLanguage,
    setActiveTab,
    selectLibraryCharacter,
    selectLibraryScene,
    addLibraryCharacter,
    addLibraryScene,
    setCharacterLibraryFolder,
    setSceneLibraryFolder,
    updateCharacter,
    updateScene,
    goToSceneWithData,
    goToDirectorWithData,
    getShotPromptVoiceFields,
    t
  });
  const handleUpdateEpisodeBundle = reactExports.useCallback((episodeIndex, updates) => {
    updateEpisodeBundle(projectId, episodeIndex, updates);
  }, [projectId, updateEpisodeBundle]);
  const handleDeleteEpisodeBundle = reactExports.useCallback((episodeIndex) => {
    deleteEpisodeBundle(projectId, episodeIndex);
    const ep = scriptData?.episodes?.find((e) => e.index === episodeIndex);
    if (ep && selectedItemId === ep.id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteEpisodeBundle, scriptData?.episodes, selectedItemId]);
  const handleAddScene = reactExports.useCallback((scene, episodeId) => {
    addScene(projectId, scene, episodeId);
  }, [projectId, addScene]);
  const handleUpdateScene = reactExports.useCallback((id, updates) => {
    updateScene(projectId, id, updates);
  }, [projectId, updateScene]);
  const handleDeleteScene = reactExports.useCallback((id) => {
    deleteScene(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteScene, selectedItemId]);
  const handleAddCharacter = reactExports.useCallback((character) => {
    addCharacter(projectId, character);
  }, [projectId, addCharacter]);
  const handleUpdateCharacter = reactExports.useCallback((id, updates) => {
    updateCharacter(projectId, id, updates);
  }, [projectId, updateCharacter]);
  const handleDeleteCharacter = reactExports.useCallback((id) => {
    deleteCharacter(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteCharacter, selectedItemId]);
  const handleUpdateShot = reactExports.useCallback((id, updates) => {
    updateShot(projectId, id, updates);
  }, [projectId, updateShot]);
  const handleDeleteShot = reactExports.useCallback((id) => {
    deleteShot(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteShot, selectedItemId]);
  const scriptAnalysisConfig = getFeatureConfig("script_analysis");
  const activeScriptRuntimeLabel = scriptAnalysisConfig ? isCliProvider(scriptAnalysisConfig.platform) ? scriptAnalysisConfig.provider.name : scriptAnalysisConfig.provider.name || scriptAnalysisConfig.platform : null;
  const usingCliForScriptAnalysis = Boolean(scriptAnalysisConfig && isCliProvider(scriptAnalysisConfig.platform));
  useLicenseStore((s) => s.plan);
  const { handleExportPromptCsv } = useScriptExport({
    shots,
    scriptData,
    setActiveTab,
    appendProcessLog,
    getShotPromptVoiceFields
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-1.5 bg-panel border-b", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: activeScriptRuntimeLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-2xs px-2 py-1 rounded-full border ${usingCliForScriptAnalysis ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`, children: usingCliForScriptAnalysis ? `CLI: ${activeScriptRuntimeLabel}` : `API: ${activeScriptRuntimeLabel}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { kind: "script", latest: true, title: t("taskInfo.scriptLatest") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: parseStatus === "parsing" ? t("scriptView.statusParsing") : scriptProject?.shotStatus === "generating" ? t("scriptView.statusGeneratingShots") : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-7 px-2 text-xs",
              onClick: handleExportPromptCsv,
              disabled: shots.length === 0,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3 mr-1" }),
                t("scriptView.exportCsv")
              ]
            }
          ),
          VIDEO_STUDIO_FEATURE_FLAGS.autoVideoVisible,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: showProcessLog ? "secondary" : "outline",
              size: "sm",
              className: "h-7 px-2 text-xs",
              onClick: () => setShowProcessLog((open) => !open),
              title: "Hiển thị log xử lý kịch bản",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ListChecks, { className: "h-3 w-3 mr-1" }),
                "Log"
              ]
            }
          )
        ] })
      ] }),
      showProcessLog && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-lg border bg-muted/30 p-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Log xử lý kịch bản" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: () => setProcessLogs([]), children: "Xóa" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-28", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap font-mono leading-5", children: processLogs.length > 0 ? processLogs.join("\n") : "Chưa có log." }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 30, minSize: 20, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ScriptInput,
        {
          rawScript: effectiveRawScript,
          styleId,
          parseStatus,
          parseError,
          chatConfigured,
          onRawScriptChange: activeEpisodeIndex != null ? (v) => updateEpisodeRawScript(projectId, activeEpisodeIndex, { rawContent: v }) : (v) => setRawScript(projectId, v),
          onStyleChange: (v) => {
            setProjectVisualStyleId(v);
          },
          onImportWithSkill: handleImportWithSkill,
          onCancelImport: handleCancelImport,
          importStatus,
          importError,
          calibrationStatus,
          cliStreamTitle,
          cliStreamOutput
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 40, minSize: 25, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        EpisodeTree,
        {
          scriptData,
          shots,
          shotStatus: scriptProject?.shotStatus,
          selectedItemId,
          selectedItemType,
          onSelectItem: handleSelectItem,
          onUpdateEpisodeBundle: handleUpdateEpisodeBundle,
          onDeleteEpisodeBundle: handleDeleteEpisodeBundle,
          onAddScene: handleAddScene,
          onUpdateScene: handleUpdateScene,
          onDeleteScene: handleDeleteScene,
          onAddCharacter: handleAddCharacter,
          onUpdateCharacter: handleUpdateCharacter,
          onDeleteCharacter: handleDeleteCharacter,
          onDeleteShot: handleDeleteShot,
          onGenerateEpisodeShots: handleGenerateEpisodeShots,
          episodeGenerationStatus,
          onImportCharacters: handleOpenCharactersPanel,
          onImportScenes: openSceneImport
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 30, minSize: 20, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        PropertyPanel,
        {
          selectedItemId,
          selectedItemType,
          character: selectedCharacter,
          scene: selectedScene,
          shot: selectedShot,
          episode: selectedEpisode,
          episodeShots: selectedEpisodeShots,
          sceneShots: selectedSceneShots,
          onGoToCharacterLibrary: handleGoToCharacterLibrary,
          onGoToSceneLibrary: handleGoToSceneLibrary,
          onImportCharacters: handleOpenCharactersPanel,
          onImportScenes: openSceneImport,
          onGoToDirector: handleGoToDirector,
          onGoToDirectorFromScene: handleGoToDirectorFromScene,
          onGenerateEpisodeShots: handleGenerateEpisodeShots,
          onUpdateCharacter: handleUpdateCharacter,
          onUpdateScene: handleUpdateScene,
          onUpdateShot: handleUpdateShot,
          onDeleteCharacter: handleDeleteCharacter,
          onDeleteScene: handleDeleteScene,
          onDeleteShot: handleDeleteShot
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: structureOverwriteConfirmOpen, onOpenChange: setStructureOverwriteConfirmOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("scriptView.overwriteStructureTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("scriptView.overwriteStructureBody") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => handleStructureCompletion(), children: t("scriptView.confirmOverwrite") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: sceneImportOpen, onOpenChange: setSceneImportOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("scriptView.importScenesTitle") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("scriptView.importScenesHint") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            onClick: () => {
              const importableIds = (scriptData?.scenes || []).filter(
                (scene) => !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
              ).map((scene) => scene.id);
              setSelectedSceneImportIds(selectedSceneImportIds.length === importableIds.length ? [] : importableIds);
            },
            children: t("scriptView.selectAll")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "max-h-80 rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 space-y-2", children: (scriptData?.scenes || []).filter(
        (scene) => !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
      ).map((scene) => {
        const checked = selectedSceneImportIds.includes(scene.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Checkbox,
            {
              checked,
              onCheckedChange: (value) => {
                setSelectedSceneImportIds((prev) => value ? [...prev, scene.id] : prev.filter((id) => id !== scene.id));
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: scene.name || t("scenes.untitled") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: scene.scenePrompt ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-2xs text-amber-700 dark:bg-amber-950 dark:text-amber-300", children: scene.scenePrompt ? "Có prompt cảnh" : "Thiếu prompt cảnh" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground line-clamp-2", children: scene.description || t("scriptView.noDescription") }),
            scene.scenePrompt && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground line-clamp-2 italic", children: scene.scenePrompt })
          ] })
        ] }, scene.id);
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setSceneImportOpen(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleImportScenes, children: t("scriptView.importAction", { count: selectedSceneImportIds.length }) })
      ] })
    ] }) })
  ] });
}
export {
  ScriptView
};
