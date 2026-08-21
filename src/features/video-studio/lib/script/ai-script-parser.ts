/**
 * AI Script Parser - Pure AI content analysis
 *
 * Single-pass pipeline:
 *   one AI call → EpisodeRawScript[] + ScriptData + ready shots
 *
 * Supports any content type: screenplay, news, tutorial, report, MV, ad, etc.
 * Output includes the minimal production prompts needed by Director.
 */

import type {
  EpisodeRawScript,
  ProjectBackground,
  ScriptData,
  Episode,
  ScriptScene,
  ScriptCharacter,
  Shot,
} from "@/features/video-studio/types/script";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import { callChatAPI, type ParseOptions } from "./script-parser";
import { cleanJsonString, safeParseJson } from "@/features/video-studio/lib/utils/json-cleaner";
import { getFeatureConfig } from "@/features/video-studio/lib/ai/feature-router";
import {
  normalizeLongScriptSkillChunkConcurrency,
  normalizeLongScriptSkillWordThreshold,
  useVideoStudioSettingsStore,
} from "@/features/video-studio/stores/video-studio-settings-store";
import {
  SCRIPT_CHUNK_BOUNDARY_SYSTEM_PROMPT,
  SCRIPT_CANONICAL_MEMORY_SYSTEM_PROMPT,
  SCRIPT_SINGLE_PASS_SYSTEM_PROMPT,
  SCRIPT_SKILL_SYSTEM_PROMPT,
  buildScriptCanonicalMemoryUserPrompt,
  buildScriptChunkBoundaryUserPrompt,
  buildScriptPromptControlBlock,
  buildScriptSkillChunkUserPrompt,
  buildScriptSkillUserPrompt,
  buildScriptSinglePassUserPrompt,
} from "@/features/video-studio/lib/ai-workflows/prompt-skills";
import { hasRequestedShotPrompt, normalizeScriptSkillMeta } from "./script-skill-validation";
import type { ScriptSkillMeta } from "@/features/video-studio/types/script-skill";
import { cleanVoiceOverText, splitVideoPromptVoiceOver } from "./voice-over";
import { runConcurrentOrdered } from "@/features/video-studio/lib/long-form/orchestrator";

// ─── Internal types ────────────────────────────────────────────────────────

export interface LongScriptImportCheckpoint {
  sourceFingerprint: string;
  skillFingerprint: string;
  boundaries: ScriptChunkBoundary[];
  memory: unknown;
  completedChunks: Record<string, unknown>;
  updatedAt: number;
}

interface AIParserSettings {
  styleId?: string;
  skillText?: string;
  signal?: AbortSignal;
  longFormCheckpoint?: LongScriptImportCheckpoint | null;
  onLongFormCheckpoint?: (checkpoint: LongScriptImportCheckpoint) => void;
}

export interface ScriptChunkBoundary {
  chunkId: string;
  title?: string;
  startParagraph: number;
  endParagraph: number;
}

interface SourceParagraph {
  index: number;
  text: string;
}

const LONG_SCRIPT_MIN_PARAGRAPHS = 8;
const CHUNK_GENERATION_MAX_ATTEMPTS = 2;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stableTextFingerprint(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(36)}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Cancelled by user');
  }
}

function isCancelledError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || /cancelled|canceled|aborted|abort/i.test(error.message);
}

function splitSourceParagraphs(text: string): SourceParagraph[] {
  const blocks = text
    .split(/\n\s*\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const units = blocks.length >= LONG_SCRIPT_MIN_PARAGRAPHS
    ? blocks
    : text
      .split(/(?<=[.!?。！？])\s+/u)
      .map((item) => item.trim())
      .filter(Boolean);

  return units.map((item, index) => ({ index: index + 1, text: item }));
}

function shouldUseLongScriptSkillPipeline(fullText: string, hasSkill: boolean): boolean {
  if (!hasSkill) return false;
  const paragraphs = splitSourceParagraphs(fullText);
  const threshold = normalizeLongScriptSkillWordThreshold(
    useVideoStudioSettingsStore.getState().scriptImport.longScriptSkillWordThreshold
  );
  return countWords(fullText) >= threshold && paragraphs.length >= 2;
}

function buildNumberedParagraphs(paragraphs: SourceParagraph[]): string {
  return paragraphs.map((paragraph) => `[${paragraph.index}] ${paragraph.text}`).join('\n\n');
}

function normalizeBoundaries(rawChunks: any[], paragraphCount: number): ScriptChunkBoundary[] {
  const normalized = rawChunks
    .map((chunk, index) => {
      const startParagraph = Math.max(1, Math.min(paragraphCount, Number(chunk.startParagraph) || index + 1));
      const endParagraph = Math.max(startParagraph, Math.min(paragraphCount, Number(chunk.endParagraph) || startParagraph));
      return {
        chunkId: String(chunk.chunkId || `chunk_${String(index + 1).padStart(2, '0')}`),
        title: typeof chunk.title === 'string' ? chunk.title : undefined,
        startParagraph,
        endParagraph,
      };
    })
    .sort((a, b) => a.startParagraph - b.startParagraph);

  const result: ScriptChunkBoundary[] = [];
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
      chunkId: `chunk_${String(result.length + 1).padStart(2, '0')}`,
      startParagraph: cursor,
      endParagraph: paragraphCount,
    });
  }

  return result.filter((chunk) => chunk.startParagraph <= paragraphCount && chunk.endParagraph >= chunk.startParagraph);
}

function extractChunkText(paragraphs: SourceParagraph[], boundary: ScriptChunkBoundary): string {
  return paragraphs
    .filter((paragraph) => paragraph.index >= boundary.startParagraph && paragraph.index <= boundary.endParagraph)
    .map((paragraph) => paragraph.text)
    .join('\n\n');
}

function mergeParsedSkillChunks(parsedChunks: any[], memory: any, outputs: ScriptSkillMeta['outputs']): any {
  const charactersByName = new Map<string, any>();
  const scenesByName = new Map<string, any>();
  const shots: any[] = [];

  const addCharacter = (character: any) => {
    const key = normalizeRef(character?.name);
    if (!key) return;
    charactersByName.set(key, { ...charactersByName.get(key), ...character });
  };
  const addScene = (scene: any) => {
    const key = normalizeRef(scene?.name || scene?.description || scene?.sceneRef);
    if (!key) return;
    scenesByName.set(key, { ...scenesByName.get(key), ...scene });
  };

  if (outputs.includes('characterPrompt')) (Array.isArray(memory?.characters) ? memory.characters : []).forEach(addCharacter);
  if (outputs.includes('scenePrompt')) (Array.isArray(memory?.scenes) ? memory.scenes : []).forEach(addScene);

  parsedChunks.forEach((parsed) => {
    if (outputs.includes('characterPrompt')) (Array.isArray(parsed?.characters) ? parsed.characters : []).forEach(addCharacter);
    if (outputs.includes('scenePrompt')) (Array.isArray(parsed?.scenes) ? parsed.scenes : []).forEach(addScene);
    const shotOffset = shots.length;
    normalizeShotList(parsed?.shots).forEach((shot) => {
      const localRefs = normalizeRefImageIndexes(getShotRefImageInput(shot));
      shots.push({
        ...shot,
        ...(localRefs.length > 0 ? { ref_image: localRefs.map((index) => index + shotOffset) } : {}),
      });
    });
  });

  return {
    meta: {
      workflowName: 'long-script chunked skill import',
      outputs,
      mergeMode: parsedChunks.find((parsed) => parsed?.meta?.mergeMode)?.meta?.mergeMode,
    },
    episodes: [{ index: 1, title: 'Episode 1' }],
    characters: Array.from(charactersByName.values()),
    scenes: Array.from(scenesByName.values()),
    shots,
  };
}

function normalizeShotList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function parseSkillJsonResponse(response: string): any {
  const cleaned = cleanJsonString(response);
  const parsed = safeParseJson<any>(cleaned, null);
  if (parsed) return parsed;

  const metaMatch = cleaned.match(/"meta"\s*:\s*(\{[\s\S]*?\})\s*,\s*"shots"\s*:/);
  const shotsStart = cleaned.search(/"shots"\s*:/);
  if (!metaMatch || shotsStart === -1) return {};

  const shotObjects = extractJsonObjectsAfter(cleaned.slice(shotsStart));
  if (shotObjects.length === 0) return {};

  return {
    meta: safeParseJson<any>(metaMatch[1], {}),
    shots: shotObjects.map((item) => safeParseJson<any>(item, {})).filter((item) => Object.keys(item).length > 0),
  };
}

function extractJsonObjectsAfter(text: string): string[] {
  const objects: string[] = [];
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
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects.filter((objectText) => objectText.includes('imagePrompt') || objectText.includes('videoPrompt'));
}

function extractMentionedNames(...prompts: string[]): string[] {
  const names = new Set<string>();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
      const name = cleanAnchorName(match[1] || match[2] || "");
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}

function extractMentionedSceneNames(...prompts: string[]): string[] {
  const names = new Set<string>();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@scene\[([^\]]+)\]/giu)) {
      const name = cleanAnchorName(match[1] || '');
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}

function cleanAnchorName(value: unknown): string {
  return String(value || '').trim().replace(/[,.!?;:，。！？；：]+$/, '');
}

function stripCharacterAnchor(value: unknown): string {
  const raw = cleanAnchorName(value);
  const bracketed = raw.match(/^@\[([^\]]+)\]$/u);
  if (bracketed) return cleanAnchorName(bracketed[1]);
  const bare = raw.match(/^@(?!scene\[)([\p{L}\p{N}_-]+)$/iu);
  if (bare) return cleanAnchorName(bare[1]);
  return raw;
}

function stripSceneAnchor(value: unknown): string {
  const raw = cleanAnchorName(value);
  const bracketed = raw.match(/^@scene\[([^\]]+)\]$/iu);
  if (bracketed) return cleanAnchorName(bracketed[1]);
  return raw;
}

const normalizeRef = (value: unknown) => String(value || '').trim().toLowerCase();
const normalizeCharacterRef = (value: unknown) => normalizeRef(stripCharacterAnchor(value));
const normalizeSceneRef = (value: unknown) => normalizeRef(stripSceneAnchor(value));

function hasSceneData(scene: any): boolean {
  return Boolean(
    String(scene?.name || '').trim() ||
    String(scene?.description || '').trim() ||
    String(scene?.scenePrompt || scene?.characterPrompt || '').trim()
  );
}

function getScenePromptInput(scene: any): string {
  return String(scene?.scenePrompt || scene?.characterPrompt || '').trim();
}

function isLegacySceneCharacter(entry: any, referencedSceneNames: Set<string>): boolean {
  const nameKey = normalizeSceneRef(entry?.name || entry?.sceneRef || entry?.description);
  const promptText = String(entry?.scenePrompt || entry?.characterPrompt || entry?.description || '').toLowerCase();

  return Boolean(
    String(entry?.scenePrompt || '').trim() ||
    (nameKey && referencedSceneNames.has(nameKey)) ||
    promptText.includes('full scene reference') ||
    promptText.includes('wide camera-neutral') ||
    promptText.includes('no characters, no props') ||
    promptText.includes('no temporary action')
  );
}

function getReferencedSceneNameKeys(shots: any[]): Set<string> {
  const keys = new Set<string>();
  shots.forEach((shot) => {
    const sceneRef = getShotSceneRef(shot);
    const key = normalizeSceneRef(sceneRef);
    if (key) keys.add(key);
  });
  return keys;
}

function getShotVideoLengthInput(shot: any): unknown {
  return shot.videoLength
    ?? shot.video_length
    ?? shot.videoDuration
    ?? shot.video_duration
    ?? shot.duration
    ?? shot.seconds
    ?? shot.length
    ?? shot.videoLenght
    ?? shot.videolenght;
}

function getShotRefImageInput(shot: any): unknown {
  return shot.ref_image
    ?? shot.refImage
    ?? shot.refImages
    ?? shot.ref_images
    ?? shot.shotRefs
    ?? shot.shot_refs;
}

function makeShot(shot: any, shotIndex: number, episodeId: string, sceneRefId = ''): Shot {
  const imagePrompt = shot.imagePrompt || '';
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt || '');
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
    keyframes: imagePrompt ? [{ id: `kf-${shotIndex}-start`, type: 'start', imagePrompt, imageUrl: '', status: 'idle' }] : [],
    imageStatus: 'idle',
    imageProgress: 0,
    videoStatus: 'idle',
    videoProgress: 0,
  };
}

function getShotSceneRef(shot: any): string {
  const directRef = String(shot.sceneRef || shot.sceneRefId || shot.sceneName || '').trim();
  if (directRef) return extractMentionedSceneNames(directRef)[0] || stripSceneAnchor(directRef);
  return extractMentionedSceneNames(shot.imagePrompt || '', shot.videoPrompt || '')[0] || '';
}

function registerSceneRefs(sceneRefMap: Map<string, string>, scene: any, sceneId: string) {
  [scene.id, scene.name, scene.description, scene.sceneRef].forEach((ref) => {
    const key = normalizeSceneRef(ref);
    if (key) sceneRefMap.set(key, sceneId);
  });
}

function ensureMentionedCharacters(characters: ScriptCharacter[], names: string[]): void {
  for (const rawName of names) {
    const name = stripCharacterAnchor(rawName);
    const key = normalizeCharacterRef(name);
    if (!key || characters.some((character) => normalizeCharacterRef(character.name) === key)) continue;
    characters.push({
      id: `char_${characters.length + 1}`,
      name,
    });
  }
}

function ensureSceneForRef(scriptScenes: ScriptScene[], sceneRefMap: Map<string, string>, sceneRef: string): string {
  const sceneName = stripSceneAnchor(sceneRef);
  const key = normalizeSceneRef(sceneName);
  if (!key) return '';

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
    time: 'day',
    atmosphere: '',
    scenePrompt: '',
  });
  registerSceneRefs(sceneRefMap, { id: sceneId, name: sceneName, description: sceneName, sceneRef }, sceneId);
  return sceneId;
}

async function parseSinglePassContent(
  fullText: string,
  parseOpts: ParseOptions,
  settings?: AIParserSettings,
): Promise<{
  background: ProjectBackground;
  episodes: EpisodeRawScript[];
  scriptData: ScriptData;
  shots: Shot[];
  skillMeta: ScriptSkillMeta;
}> {
  const promptControl = buildScriptPromptControlBlock(settings);
  const hasSkill = Boolean(settings?.skillText?.trim());
  const systemPrompt = hasSkill ? SCRIPT_SKILL_SYSTEM_PROMPT : SCRIPT_SINGLE_PASS_SYSTEM_PROMPT;
  const response = hasSkill && shouldUseLongScriptSkillPipeline(fullText, true)
    ? await parseLongScriptSkillResponse(fullText, parseOpts, settings!.skillText!, promptControl, settings)
    : await callChatAPI(
      systemPrompt,
      hasSkill
        ? buildScriptSkillUserPrompt({ promptControl, skillText: settings!.skillText!, scanText: fullText })
        : buildScriptSinglePassUserPrompt({ promptControl, scanText: fullText, truncated: false }),
      { ...parseOpts, maxTokens: 12000 }
    );
  const parsed = parseSkillJsonResponse(response);
  const skillMeta = normalizeScriptSkillMeta(parsed.meta);
  const parsedEpisodes = Array.isArray(parsed.episodes) ? parsed.episodes : [];
  const parsedTopLevelShots = Array.isArray(parsed.shots) ? parsed.shots : [];
  const parsedCharacters = Array.isArray(parsed.characters) ? parsed.characters : [];
  const parsedScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  const referencedSceneNames = getReferencedSceneNameKeys(parsedTopLevelShots);
  const legacySceneCharacters = parsedCharacters.filter((entry: any) => isLegacySceneCharacter(entry, referencedSceneNames));
  const legacySceneCharacterKeys = new Set(legacySceneCharacters.map((entry: any) => normalizeCharacterRef(entry?.name)));
  const shouldImportSceneAssets = !hasSkill || skillMeta.outputs.includes('scenePrompt') || parsedScenes.length > 0 || legacySceneCharacters.length > 0;
  const shouldImportCharacters = skillMeta.outputs.includes('characterPrompt');
  const shouldImportEpisodes = !hasSkill;

  const characters: ScriptCharacter[] = [];
  (shouldImportCharacters ? parsedCharacters : []).forEach((character: any) => {
    if (legacySceneCharacterKeys.has(normalizeCharacterRef(character?.name))) return;
    const name = stripCharacterAnchor(character.name) || `Character ${characters.length + 1}`;
    const key = normalizeCharacterRef(name);
    if (!key || characters.some((existing) => normalizeCharacterRef(existing.name) === key)) return;
    characters.push({
      id: `char_${characters.length + 1}`,
      name,
      appearance: character.description || undefined,
      characterPrompt: character.characterPrompt || character.description || undefined,
    });
  });

  const scriptScenes: ScriptScene[] = [];
  const sceneRefMap = new Map<string, string>();
  const shots: Shot[] = [];
  const episodes: Episode[] = [];
  const rawEpisodes: EpisodeRawScript[] = [];

  (shouldImportSceneAssets ? [...parsedScenes, ...legacySceneCharacters] : []).forEach((scene: any) => {
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
      time: 'day',
      atmosphere: '',
      scenePrompt: getScenePromptInput(scene),
    });
    registerSceneRefs(sceneRefMap, scene, sceneId);
  });

  (shouldImportEpisodes ? parsedEpisodes : []).forEach((episode: any, episodeIndex: number) => {
    const episodeNumber = episode.index || episodeIndex + 1;
    const title = episode.title || `Episode ${episodeNumber}`;
    episodes.push({ id: `ep_${episodeIndex + 1}`, index: episodeNumber, title, sceneIds: [] });
    rawEpisodes.push({ episodeIndex: episodeNumber, title, rawContent: fullText, scenes: [], shotGenerationStatus: 'completed' });
  });

  (Array.isArray(parsed.shots) ? parsed.shots : []).forEach((shot: any) => {
    const imagePrompt = shot.imagePrompt || '';
    const videoPrompt = shot.videoPrompt || '';
    const ref_image = normalizeRefImageIndexes(getShotRefImageInput(shot));
    if (!hasRequestedShotPrompt({ imagePrompt, videoPrompt, ref_image }, skillMeta.outputs)) return;

    const nextIndex = Number(shot.episodeIndex || 1) || 1;
    let episode = episodes.find((item) => item.index === nextIndex);
    if (!episode) {
      episode = { id: `ep_${episodes.length + 1}`, index: nextIndex, title: shot.episodeTitle || `Episode ${nextIndex}`, sceneIds: [] };
      episodes.push(episode);
      rawEpisodes.push({ episodeIndex: nextIndex, title: shot.episodeTitle || `Episode ${nextIndex}`, rawContent: fullText, scenes: [], shotGenerationStatus: 'completed' });
    }

    ensureMentionedCharacters(characters, extractMentionedNames(imagePrompt, videoPrompt));
    const shotSceneRef = getShotSceneRef(shot);
    const sceneRefId = shotSceneRef ? ensureSceneForRef(scriptScenes, sceneRefMap, shotSceneRef) : '';
    if (sceneRefId && episode && !episode.sceneIds.includes(sceneRefId)) episode.sceneIds.push(sceneRefId);
    shots.push(makeShot(shot, shots.length + 1, episode.id, sceneRefId));
  });

  if (episodes.length === 0) {
    episodes.push({ id: 'ep_1', index: 1, title: 'Episode 1', sceneIds: [] });
    rawEpisodes.push({ episodeIndex: 1, title: 'Episode 1', rawContent: fullText, scenes: [], shotGenerationStatus: 'completed' });
  }

  const scriptData: ScriptData = { title: 'Untitled', language: 'en', characters, scenes: scriptScenes, episodes, storyParagraphs: [] };
  const background: ProjectBackground = {
    title: 'Untitled',
    era: 'modern',
    outline: '',
    characterBios: characters.map((character) => `${character.name}: ${character.appearance || ''}`).join('\n'),
    themes: [],
  };

  return { background, episodes: rawEpisodes, scriptData, shots, skillMeta };
}

async function parseLongScriptSkillResponse(
  fullText: string,
  parseOpts: ParseOptions,
  skillText: string,
  promptControl: string,
  settings?: AIParserSettings,
): Promise<string> {
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
  const reusableCheckpoint = settings?.longFormCheckpoint?.sourceFingerprint === sourceFingerprint
    && settings.longFormCheckpoint.skillFingerprint === skillFingerprint
    ? settings.longFormCheckpoint
    : null;
  let checkpoint: LongScriptImportCheckpoint = reusableCheckpoint ? {
    ...reusableCheckpoint,
    boundaries: reusableCheckpoint.boundaries.map((boundary) => ({ ...boundary })),
    completedChunks: { ...reusableCheckpoint.completedChunks },
  } : {
    sourceFingerprint,
    skillFingerprint,
    boundaries: [],
    memory: {},
    completedChunks: {},
    updatedAt: Date.now(),
  };
  const publishCheckpoint = (): void => {
    checkpoint.updatedAt = Date.now();
    settings?.onLongFormCheckpoint?.({
      ...checkpoint,
      boundaries: checkpoint.boundaries.map((boundary) => ({ ...boundary })),
      completedChunks: { ...checkpoint.completedChunks },
    });
  };
  parseOpts.onCliLog?.(`[Script Skill] Long pipeline start words=${wordCount} paragraphs=${paragraphs.length} threshold=${threshold} concurrency=${chunkConcurrency}`);
  let boundaries = normalizeBoundaries(checkpoint.boundaries, paragraphs.length);
  if (checkpoint.boundaries.length > 0) {
    parseOpts.onCliLog?.(`[Script Skill] Reuse boundary checkpoint chunks=${boundaries.length}`);
  } else {
    parseOpts.onCliLog?.('[Script Skill] Boundary request start');
    const boundaryResponse = await callChatAPI(
      SCRIPT_CHUNK_BOUNDARY_SYSTEM_PROMPT,
      buildScriptChunkBoundaryUserPrompt(buildNumberedParagraphs(paragraphs)),
      { ...parseOpts, maxTokens: 4000, temperature: 0.2, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-boundary:${Date.now()}` }
    );
    throwIfAborted(parseOpts.signal);
    const boundaryJson = safeParseJson<any>(cleanJsonString(boundaryResponse), {});
    boundaries = normalizeBoundaries(Array.isArray(boundaryJson.chunks) ? boundaryJson.chunks : [], paragraphs.length);
    checkpoint.boundaries = boundaries;
    publishCheckpoint();
  }
  parseOpts.onCliLog?.(`[Script Skill] Boundary request done chunks=${boundaries.length} ranges=${boundaries.map((chunk) => `${chunk.chunkId}:${chunk.startParagraph}-${chunk.endParagraph}`).join(', ')}`);
  const requestedMeta = normalizeScriptSkillMeta(extractSkillMetadataFromText(skillText));
  const outputs = requestedMeta.outputs;
  const needsCanonicalMemory = outputs.includes('characterPrompt') || outputs.includes('scenePrompt');

  let memory: any = reusableCheckpoint?.memory || {};
  if (needsCanonicalMemory) {
    if (reusableCheckpoint?.memory && Object.keys(reusableCheckpoint.memory as object).length > 0) {
      parseOpts.onCliLog?.('[Script Skill] Reuse canonical memory checkpoint');
    } else {
      parseOpts.onCliLog?.(`[Script Skill] Memory request start outputs=${outputs.join(',')}`);
      const memoryResponse = await callChatAPI(
        SCRIPT_CANONICAL_MEMORY_SYSTEM_PROMPT,
        buildScriptCanonicalMemoryUserPrompt({ promptControl, skillText, scanText: fullText, outputs }),
        { ...parseOpts, maxTokens: 6000, temperature: 0.3, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-memory:${Date.now()}` }
      );
      throwIfAborted(parseOpts.signal);
      memory = safeParseJson<any>(cleanJsonString(memoryResponse), {});
      checkpoint.memory = memory;
      publishCheckpoint();
      parseOpts.onCliLog?.(`[Script Skill] Memory request done characters=${Array.isArray(memory.characters) ? memory.characters.length : 0} scenes=${Array.isArray(memory.scenes) ? memory.scenes.length : 0}`);
    }
  } else {
    parseOpts.onCliLog?.('[Script Skill] Memory request skipped');
  }

  const canonicalMemory = needsCanonicalMemory ? JSON.stringify({
    characters: Array.isArray(memory.characters) ? memory.characters : [],
    scenes: Array.isArray(memory.scenes) ? memory.scenes : [],
  }) : undefined;

  const chunkResults = await runConcurrentOrdered(boundaries, chunkConcurrency, async (boundary, index) => {
    throwIfAborted(parseOpts.signal);
    const completedChunk = checkpoint.completedChunks[boundary.chunkId];
    if (completedChunk && typeof completedChunk === 'object') {
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
            canonicalMemory,
          }),
          { ...parseOpts, maxTokens: 8000, sessionKey: `${parseOpts.provider}:${parseOpts.model}:script-chunk:${Date.now()}:${index + 1}:try-${attempt}` }
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

function extractSkillMetadataFromText(content: string): unknown {
  const metadataBlock = content.match(/##\s*Skill Metadata[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (!metadataBlock) return undefined;
  try {
    return JSON.parse(metadataBlock);
  } catch {
    return undefined;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export type AIParserProgressCallback = (
  step: "scan" | "process" | "merge",
  current: number,
  total: number,
  message?: string
) => void;

/**
 * Parse any content with pure AI.
 * Returns scenes + shot skeletons. Production prompts are generated in a separate step.
 */
export async function parseContentWithAI(
  fullText: string,
  settings?: AIParserSettings,
  onProgress?: AIParserProgressCallback
): Promise<{
  background: ProjectBackground;
  episodes: EpisodeRawScript[];
  scriptData: ScriptData;
  shots: Shot[];
  skillMeta: ScriptSkillMeta;
}> {
  const config = getFeatureConfig("script_analysis") || getFeatureConfig("chat");
  if (!config) {
    throw new Error(
      "No AI provider configured. Please bind a provider to the script analysis feature in settings."
    );
  }

  const parseOpts: ParseOptions = {
    apiKey: config.allApiKeys.join(","),
    provider: config.platform,
    baseUrl: config.baseUrl,
    model: config.model,
    signal: settings?.signal,
    onCliLog: (message) => onProgress?.("process", 0, 1, message),
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

export async function parseContentWithScriptSkill(
  fullText: string,
  skillText: string,
  settings?: Omit<AIParserSettings, 'skillText'>,
  onProgress?: AIParserProgressCallback
): Promise<{
  background: ProjectBackground;
  episodes: EpisodeRawScript[];
  scriptData: ScriptData;
  shots: Shot[];
  skillMeta: ScriptSkillMeta;
}> {
  return parseContentWithAI(fullText, { ...settings, skillText }, onProgress);
}
