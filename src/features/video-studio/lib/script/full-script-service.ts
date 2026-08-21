/**
 * Full-script service.
 *
 * Core responsibilities:
 * 1. Import a full screenplay (outline, character bios, and multiple episodes)
 * 2. Generate shots episode by episode
 * 3. Update a single episode or all episode shots
 * 4. Use AI calibration to generate missing episode titles
 */

import type {
  EpisodeRawScript,
  ScriptData,
  Shot,
} from "@/features/video-studio/types/script";
import { parseScenes } from "./episode-parser";
import { preprocessLineBreaks } from "./script-normalizer";
import { parseContentWithAI, parseContentWithScriptSkill } from "./ai-script-parser";
import { populateSeriesMetaFromImport } from "./series-meta-sync";
import { mergeScriptSkillResult } from "./script-skill-merge";
import { callFeatureAPI } from "@/features/video-studio/lib/ai/feature-router";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { buildSeriesContextSummary } from "./series-meta-sync";
import {
  buildSingleEpisodeTitleSynopsisSystemPrompt,
  buildSingleEpisodeTitleSynopsisUserPrompt,
} from "@/features/video-studio/lib/ai-workflows/prompt-skills";

export interface ImportResult {
  success: boolean;
  episodes: EpisodeRawScript[];
  scriptData: ScriptData | null;
  error?: string;
}

export interface GenerateShotsOptions {
  apiKey: string;
  provider: string;
  baseUrl?: string;
  styleId: string;
  targetDuration: string;
  promptLanguage?: import('@/features/video-studio/types/script').PromptLanguage;
}

export interface GenerateEpisodeShotsResult {
  shots: Shot[];
}

/**
 * Import a full screenplay.
 * @param fullText Full screenplay text
 * @param projectId Project id
 */
export async function importFullScript(
  fullText: string,
  projectId: string,
  importSettings?: { styleId?: string; onProgress?: (message: string) => void; signal?: AbortSignal }
): Promise<ImportResult> {
  try {
    // Pure-AI single-pass parsing.
    const { background, episodes, scriptData, shots } = await parseContentWithAI(
      fullText,
      {
        styleId: importSettings?.styleId,
        signal: importSettings?.signal,
      },
      (step, current, total, message) => {
        console.log(`[importFullScript] AI parse ${step}: ${current}/${total}`);
        if (message) importSettings?.onProgress?.(message);
      }
    );

    // Save into the store
    const store = useScriptStore.getState();
    store.setEpisodeRawScripts(projectId, episodes);
    store.setScriptData(projectId, scriptData);
    store.setRawScript(projectId, fullText);
    store.setParseStatus(projectId, "ready");
    // Save shots — ready for director tab immediately, no extra generation step needed
    store.setShots(projectId, shots);
    
    // 4. Build series-level metadata (SeriesMeta) using the chosen style/language directly.
    const seriesMeta = populateSeriesMetaFromImport(background, scriptData, null, importSettings);
    store.setSeriesMeta(projectId, seriesMeta);
    
    return {
      success: true,
      episodes,
      scriptData,
    };
  } catch (error) {
    console.error("Import error:", error);
    return {
      success: false,
      episodes: [],
      scriptData: null,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

export async function importScriptWithSkill(
  fullText: string,
  skillText: string,
  projectId: string,
  importSettings?: { styleId?: string; onProgress?: (message: string) => void; signal?: AbortSignal }
): Promise<ImportResult> {
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
        },
      },
      (step, current, total, message) => {
        console.log(`[importScriptWithSkill] AI parse ${step}: ${current}/${total}`);
        if (message) importSettings?.onProgress?.(message);
      }
    );

    const project = store.projects[projectId];
    const mergeMode = skillMeta.mergeMode || 'replace-missing';
    const merged = mergeScriptSkillResult({
      currentScriptData: project?.scriptData || null,
      currentEpisodes: project?.episodeRawScripts || [],
      currentShots: project?.shots || [],
      incomingScriptData: scriptData,
      incomingEpisodes: episodes,
      incomingShots: shots,
      outputs: skillMeta.outputs,
      mergeMode,
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
      scriptData: merged.scriptData,
    };
  } catch (error) {
    console.error("Skill import error:", error);
    return {
      success: false,
      episodes: [],
      scriptData: null,
      error: error instanceof Error ? error.message : "Skill import failed",
    };
  }
}

// ==================== Single-Episode Structure Completion ====================

export interface SingleEpisodeImportResult {
  success: boolean;
  sceneCount: number;
  error?: string;
}

/**
 * Complete structure for a single episode by parsing pasted screenplay text into scenes.
 *
 * Flow:
 * 1. preprocessLineBreaks -> parseScenes -> convert to ScriptScene[]
 * 2. atomically write back to store (episodeRawScripts + scriptData.scenes + episodes.sceneIds)
 * 3. remove old shots for this episode
 * 4. generate title + synopsis in a lightweight non-blocking AI task
 */
export async function importSingleEpisodeContent(
  rawContent: string,
  episodeIndex: number,
  projectId: string,
  onProgress?: (message: string) => void,
): Promise<SingleEpisodeImportResult> {
  const TAG = '[importSingleEpisodeContent]';

  try {
    onProgress?.('Parsing episode content...');
    const store = useScriptStore.getState();
    const project = store.projects[projectId];
    if (!project?.scriptData) {
      return { success: false, sceneCount: 0, error: 'Project or screenplay data not found' };
    }

    const scriptData = project.scriptData;
    const episode = scriptData.episodes.find(e => e.index === episodeIndex);
    if (!episode) {
      return { success: false, sceneCount: 0, error: `Episode ${episodeIndex} was not found` };
    }

    // === 1. Preprocess + parse scenes ===
    const preprocessed = preprocessLineBreaks(rawContent);
    const rawScenes = parseScenes(preprocessed.text);
    console.log(`${TAG} Parsed ${rawScenes.length} scenes`);
    onProgress?.(`Parsed ${rawScenes.length} scenes`);

    if (rawScenes.length === 0) {
      // Even without scene headers, still update rawContent.
      store.updateEpisodeRawScript(projectId, episodeIndex, {
        rawContent,
        scenes: [],
      });
      return { success: true, sceneCount: 0 };
    }

    // === 2. SceneRawContent → ScriptScene ===
    const timestamp = Date.now();
    const timeMap: Record<string, string> = {
      'day': 'day', 'night': 'night', 'morning': 'dawn', 'dusk': 'dusk',
      'sunset': 'dusk', 'daybreak': 'dawn', 'early morning': 'dawn', 'evening': 'dusk',
    };
    const newScenes = rawScenes.map((scene, idx) => {
      const sceneId = `scene_ep${episodeIndex}_${timestamp}_${idx + 1}`;
      const headerParts = scene.sceneHeader.split(/\s+/);
       const timeOfDay = headerParts[1] || 'day';
      const hasInterior = headerParts[2] && /^(interior|exterior|interior\/exterior)$/i.test(headerParts[2]);
      const locStart = hasInterior ? 3 : 2;
       let loc = headerParts.slice(locStart).join(' ') || headerParts[headerParts.length - 1] || 'Unknown';
       loc = loc.replace(/\s*(?:Characters?|Roles?)[：:].*/gi, '').trim();

       let atmosphere = 'calm';
       if (/tense|danger|conflict|fight|rage/i.test(scene.content)) atmosphere = 'tense';
       else if (/warm|joy|happy|laughter|comfort/i.test(scene.content)) atmosphere = 'warm';
       else if (/sad|cry|pain|tears|grief/i.test(scene.content)) atmosphere = 'sad';
       else if (/mysterious|dark|eerie|ominous/i.test(scene.content)) atmosphere = 'mysterious';

      return {
        id: sceneId,
        name: `${episodeIndex}-${idx + 1} ${loc}`,
        description: scene.actions.join(' ').trim() || scene.content.trim() || loc,
        time: timeMap[timeOfDay] || 'day',
        atmosphere,
      };
    });
    const newSceneIds = newScenes.map(s => s.id);

     // === 3. Atomic write-back to store ===
    const oldSceneIds = new Set(episode.sceneIds);
    const remainingScenes = scriptData.scenes.filter(s => !oldSceneIds.has(s.id));
    const remainingShots = project.shots.filter(s => !oldSceneIds.has(s.sceneRefId));

     // Update episodeRawScript
    store.updateEpisodeRawScript(projectId, episodeIndex, {
      rawContent,
      scenes: rawScenes,
    });

     // Update scriptData (scene list + episode.sceneIds)
    store.setScriptData(projectId, {
      ...scriptData,
      scenes: [...remainingScenes, ...newScenes],
      episodes: scriptData.episodes.map(e =>
        e.index === episodeIndex ? { ...e, sceneIds: newSceneIds } : e
      ),
    });

     // Remove old shots for this episode
    if (remainingShots.length !== project.shots.length) {
      store.setShots(projectId, remainingShots);
       console.log(`${TAG} Removed ${project.shots.length - remainingShots.length} old shots`);
    }

    console.log(`${TAG} Structure completion done: ${newScenes.length} scenes`);
    onProgress?.(`Updated the structure with ${newScenes.length} scenes`);

     // === 4. Lightweight AI title + synopsis generation (non-blocking) ===
    generateSingleEpisodeTitleAndSynopsis(projectId, episodeIndex).catch(e => {
       console.warn(`${TAG} Title/synopsis generation failed (structure completion still succeeds):`, e);
    });

    return { success: true, sceneCount: newScenes.length };
  } catch (error) {
    console.error('[importSingleEpisodeContent] Error:', error);
    return {
      success: false,
      sceneCount: 0,
       error: error instanceof Error ? error.message : 'Structure completion failed',
    };
  }
}

/**
 * Lightweight AI task that generates title + synopsis for a single episode without blocking structure completion.
 */
async function generateSingleEpisodeTitleAndSynopsis(
  projectId: string,
  episodeIndex: number,
): Promise<void> {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  if (!project) return;

  const epRaw = project.episodeRawScripts.find(e => e.episodeIndex === episodeIndex);
  if (!epRaw || !epRaw.rawContent) return;

  // Skip if the episode already has a meaningful title and synopsis.
  const hasTitle = epRaw.title && !/^Episode\s*\d+$/i.test(epRaw.title.trim());
  const hasSynopsis = !!(epRaw.synopsis && epRaw.synopsis.trim().length > 0);
  if (hasTitle && hasSynopsis) return;

  const background = project.seriesMeta || project.scriptData;
  const seriesCtx = buildSeriesContextSummary(project.seriesMeta || null);
  const contentSummary = epRaw.rawContent.slice(0, 800);

  const system = buildSingleEpisodeTitleSynopsisSystemPrompt({
    seriesContext: seriesCtx,
    title: background?.title || project.scriptData?.title || 'Untitled',
    genre: project.seriesMeta?.genre,
    era: project.seriesMeta?.era,
  });

  const user = buildSingleEpisodeTitleSynopsisUserPrompt(episodeIndex, contentSummary);

  try {
    const result = await callFeatureAPI('script_analysis', system, user, {
      temperature: 0.3,
      maxTokens: 512,
    });
    if (!result) return;

    const jsonMatch = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]);
    const updates: Partial<EpisodeRawScript> = {};

    if (!hasTitle && parsed.title) {
      const fullTitle = `Episode ${episodeIndex}: ${parsed.title}`;
      updates.title = fullTitle;
      // Sync the title back into scriptData.episodes.
      const cur = useScriptStore.getState();
      const sd = cur.projects[projectId]?.scriptData;
      if (sd) {
        cur.setScriptData(projectId, {
          ...sd,
          episodes: sd.episodes.map(e =>
            e.index === episodeIndex ? { ...e, title: fullTitle } : e
          ),
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
    console.warn('[generateSingleEpisodeTitleAndSynopsis] AI call failed:', e);
  }
}

/**
 * Generate shots for a single episode.
 * @param episodeIndex Episode index (1-based)
 * @param projectId Project ID
 * @param options Generation options
 */
export async function generateEpisodeShots(
  episodeIndex: number,
  projectId: string,
  _options: GenerateShotsOptions,
  onProgress?: (message: string) => void
): Promise<GenerateEpisodeShotsResult> {
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
  
  // Update the generation status for the episode
  store.updateEpisodeRawScript(projectId, episodeIndex, {
    shotGenerationStatus: 'generating',
  });
  
  try {
    onProgress?.(`Generating shots for episode ${episodeIndex}...`);
    
    // Get the scenes belonging to this episode
    const scriptData = project.scriptData;
    if (!scriptData) {
      throw new Error("Script data is missing");
    }
    
    const episode = scriptData.episodes.find((ep) => ep.index === episodeIndex);
    if (!episode) {
      throw new Error(`Episode ${episodeIndex} structure was not found`);
    }
    
    const episodeScenes = scriptData.scenes.filter((s) =>
      episode.sceneIds.includes(s.id)
    );
    
    // Build scene content for shot generation
    const scenesWithContent = episodeScenes.map((scene, idx) => {
      const rawScene = episodeScript.scenes[idx];
      return {
        ...scene,
        // Generate shots from the original raw content
        rawContent: rawScene?.content || '',
        dialogues: rawScene?.dialogues || [],
        actions: rawScene?.actions || [],
      };
    });
    
    // Generate shots
    const newShots = await generateShotsForEpisode(
      scenesWithContent,
      episode.id,
      onProgress
    );
    
    // Replace existing shots for this episode with the new ones
    const existingShots = project.shots.filter(
      (shot) => shot.episodeId !== episode.id
    );
    const allShots = [...existingShots, ...newShots];
    
    store.setShots(projectId, allShots);

    store.updateEpisodeRawScript(projectId, episodeIndex, {
      shotGenerationStatus: 'completed',
      lastGeneratedAt: Date.now(),
    });

    onProgress?.(`Episode ${episodeIndex} shot generation complete (${newShots.length} shots)`);

    return { shots: newShots };
  } catch (error) {
    store.updateEpisodeRawScript(projectId, episodeIndex, {
      shotGenerationStatus: 'error',
    });
    throw error;
  }
}

/**
 * Generate shots for the scenes of a specified episode.
 */
async function generateShotsForEpisode(
  scenes: Array<{
    id: string;
    name?: string;
    description?: string;
    time: string;
    atmosphere: string;
    rawContent: string;
    dialogues: Array<{ character: string; parenthetical?: string; line: string }>;
    actions: string[];
  }>,
  episodeId: string,
  onProgress?: (message: string) => void
): Promise<Shot[]> {
  const shots: Shot[] = [];
  let shotIndex = 1;
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress?.(`Processing scene ${i + 1}/${scenes.length}: ${scene.name || 'Untitled'}`);
    
    // Generate shots from scene content
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

/**
 * Generate shots from raw scene content using rule-based parsing, without AI.
 * Each dialogue line or action line becomes one shot.
 */
function generateShotsFromSceneContent(
  scene: {
    id: string;
    name?: string;
    description?: string;
    time: string;
    atmosphere: string;
    rawContent: string;
    dialogues: Array<{ character: string; parenthetical?: string; line: string }>;
    actions: string[];
  },
  episodeId: string,
  startIndex: number
): Shot[] {
  const shots: Shot[] = [];
  let index = startIndex;
  
  // Parse scene content and generate shots in source order.
  const lines = scene.rawContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip speaker header lines and empty lines.
    if (!trimmedLine) continue;
    if (/^(characters?|cast)\s*:/i.test(trimmedLine) || /^\*\*(characters?|cast)\s*:/i.test(trimmedLine)) continue;
    // Skip pure markdown marker lines such as **Heading**.
    if (trimmedLine.match(/^\*\*[^*]+\*\*$/)) continue;
    
    // Dialogue line
    const dialogueMatch = trimmedLine.match(/^([^:\(\[\n\-*]{1,40})[:]\s*(?:[\(]([^\)]+)[\)])?\s*(.+)$/);
    if (dialogueMatch) {
      const charName = dialogueMatch[1].trim();
      const parenthetical = dialogueMatch[2]?.trim() || '';
      const dialogueText = dialogueMatch[3].trim();
      
      // Skip non-dialogue markers
      if (/^(subtitle|voiceover|narration|scene|characters?)$/i.test(charName)) continue;
      
      shots.push(createShot({
        index: index++,
        episodeId,
        sceneRefId: scene.id,
        actionSummary: `${charName}${parenthetical ? ` (${parenthetical})` : ''}: ${dialogueText}`,
      }));
      continue;
    }
    
    // Action line.
    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      const actionText = trimmedLine.slice(1).trim();
      
      shots.push(createShot({
        index: index++,
        episodeId,
        sceneRefId: scene.id,
        // Keep the full original action text to help downstream AI calibration.
        actionSummary: actionText,
      }));
      continue;
    }
    
    // Subtitle marker in [].
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      const subtitleText = trimmedLine.slice(1, -1);
      
      // If this marks a flashback, generate a transition shot.
      if (/flashback/i.test(subtitleText)) {
        shots.push(createShot({
          index: index++,
          episodeId,
          sceneRefId: scene.id,
          actionSummary: subtitleText,
        }));
        continue;
      }
      
      // Subtitle display shot
      if (/^subtitle\s*:/i.test(subtitleText)) {
        shots.push(createShot({
          index: index++,
          episodeId,
          sceneRefId: scene.id,
          actionSummary: 'subtitle display',
        }));
      }
    }
  }
  
  // If no shot was produced for the scene, create a default establishing shot.
  if (shots.length === 0) {
    shots.push(createShot({
      index: index,
      episodeId,
      sceneRefId: scene.id,
      actionSummary: `${scene.name || scene.description || 'Untitled'} establishing shot`,
    }));
  }
  
  return shots;
}

/**
 * Create a shot object.
 */
function createShot(params: {
  index: number;
  episodeId: string;
  sceneRefId: string;
  actionSummary: string;
}): Shot {
  return {
    id: `shot_${Date.now()}_${params.index}`,
    index: params.index,
    episodeId: params.episodeId,
    sceneRefId: params.sceneRefId,
    videoPrompt: params.actionSummary,
    videoLength: 4,
    hasCharacters: false,
    imageStatus: 'idle',
    imageProgress: 0,
    videoStatus: 'idle',
    videoProgress: 0,
  };
}

// ==================== AI Calibration ====================

// CalibrationOptions is no longer needed directly; config now comes from service mappings.
export interface CalibrationOptions {
  // Keep an empty interface for compatibility.
}

export interface CalibrationResult {
  success: boolean;
  calibratedCount: number;
  totalMissing: number;
  error?: string;
}

/**
 * Check whether an episode title is missing.
 * A title is considered missing when it is empty or only contains the bare episode number.
 */
function isMissingTitle(title: string): boolean {
  if (!title || title.trim() === '') return true;
  // Match bare titles like "Episode 1" without any subtitle.
  const onlyEpisodeNum = /^episode\s+\d+$/i;
  return onlyEpisodeNum.test(title.trim());
}

/**
 * Get the list of episodes with missing titles.
 */
export function getMissingTitleEpisodes(projectId: string): EpisodeRawScript[] {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  
  if (!project || !project.episodeRawScripts.length) {
    return [];
  }
  
  return project.episodeRawScripts.filter(ep => isMissingTitle(ep.title));
}

// ==================== AI Episode Synopsis Generation ====================
// (shot calibration functions removed — prompts now generated in single-pass import)

export interface SynopsisGenerationResult {
  success: boolean;
  generatedCount: number;
  totalEpisodes: number;
  error?: string;
}

// ==================== Export Project Metadata MD ====================

/**
 * Export project metadata in Markdown format.
 * Similar to Cursor's .cursorrules, used as project knowledge.
 */
export function exportProjectMetadata(projectId: string): string {
  const store = useScriptStore.getState();
  const project = store.projects[projectId];
  
  if (!project) {
    return '# Error\n\nProject not found';
  }
  
  const episodes = project.episodeRawScripts;
  const scriptData = project.scriptData;
  const meta = project.seriesMeta;
  
  const sections: string[] = [];
  
  // Title
  const title = meta?.title || scriptData?.title || 'Untitled Script';
  sections.push(`# 《${title}》`);
  sections.push('');

  // Basic information
  sections.push('## Basic Info');
  const genre = meta?.genre;
  const era = meta?.era;
  if (genre) sections.push(`- **Genre**: ${genre}`);
  if (era) sections.push(`- **Era**: ${era}`);
  sections.push(`- **Total Episodes**: ${episodes.length}`);
  if (meta?.language || scriptData?.language) sections.push(`- **Language**: ${meta?.language || scriptData?.language}`);
  if (meta?.logline) sections.push(`- **Logline**：${meta.logline}`);
  if (meta?.centralConflict) sections.push(`- **Central Conflict**: ${meta.centralConflict}`);
  if (meta?.themes?.length) sections.push(`- **Themes**: ${meta.themes.join(', ')}`);
  sections.push('');
  
  // Story outline
  const outline = meta?.outline;
  if (outline) {
    sections.push('## Story Outline');
    sections.push(outline);
    sections.push('');
  }
  
  // Structured character list, preferring seriesMeta when available.
  const characters = meta?.characters || scriptData?.characters;
  if (characters && characters.length > 0) {
    sections.push('## Character List');
    for (const char of characters) {
      sections.push(`### ${char.name}`);
      if (char.appearance) sections.push(`- Appearance: ${char.appearance}`);
      if (char.characterPrompt) sections.push(`- Character Prompt: ${char.characterPrompt}`);
      sections.push('');
    }
  }
  
  // Episode synopses
  sections.push('## Episode Synopses');
  for (const ep of episodes) {
    sections.push(`### Episode ${ep.episodeIndex}: ${ep.title.replace(/^\u7b2c\d+\u96c6[\uff1a:]?/, '')}`);
    if (ep.synopsis) {
      sections.push(ep.synopsis);
    }
    if (ep.keyEvents && ep.keyEvents.length > 0) {
      sections.push('**Key Events:**');
      for (const event of ep.keyEvents) {
        sections.push(`- ${event}`);
      }
    }
    // Show scene count
    sections.push(`> This episode contains ${ep.scenes.length} scenes`);
    sections.push('');
  }
  
  // Export timestamp
  sections.push('---');
  sections.push(`*Exported At: ${new Date().toLocaleString('en-CA')}*`);
  
  return sections.join('\n');
}
