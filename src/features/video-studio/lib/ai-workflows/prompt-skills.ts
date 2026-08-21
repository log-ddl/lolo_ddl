export interface ShotCalibrationPromptContext {
  eraContextBlock: string;
  styleDesc: string;
  mediaTypeHint: string;
  isRefToVideo: boolean;
}

export interface ScriptPromptControlSettings {
  styleId?: string;
}

export interface ScriptScanPromptContext {
  promptControl: string;
  scanText: string;
  truncated: boolean;
}

export function buildScriptPromptControlBlock(_settings?: ScriptPromptControlSettings): string {
  return `
Prompt generation context:
- Do not bake the app visual style preset into generated prompt fields. Keep style only if it is explicitly present in the source text or skill instructions.`;
}

export const SCRIPT_SINGLE_PASS_SYSTEM_PROMPT = `You are a professional director and prompt engineer. Convert the input into top-level optional production chunks for an image-to-video workflow.

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

export function buildScriptSinglePassUserPrompt(context: ScriptScanPromptContext): string {
  return `${context.promptControl}

Input:
${context.scanText}`;
}

export interface ScriptSkillPromptContext {
  promptControl: string;
  skillText: string;
  scanText: string;
}

export const SCRIPT_SKILL_SYSTEM_PROMPT = `You are running a Script Skill for a video production app.

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

export function buildScriptSkillUserPrompt(context: ScriptSkillPromptContext): string {
  return `${context.promptControl}

[SKILL]
${context.skillText}

[USER INPUT]
${context.scanText}`;
}

export const SCRIPT_CHUNK_BOUNDARY_SYSTEM_PROMPT = `You split long textover/script input into semantic production chunks.

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

export function buildScriptChunkBoundaryUserPrompt(numberedParagraphs: string): string {
  return `[NUMBERED PARAGRAPHS]
${numberedParagraphs}`;
}

export interface ScriptCanonicalMemoryPromptContext {
  promptControl: string;
  skillText: string;
  scanText: string;
  outputs: string[];
}

export const SCRIPT_CANONICAL_MEMORY_SYSTEM_PROMPT = `You create canonical reusable prompt memory before chunk-level generation.

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

export function buildScriptCanonicalMemoryUserPrompt(context: ScriptCanonicalMemoryPromptContext): string {
  return `${context.promptControl}

[REQUESTED OUTPUTS]
${context.outputs.join(', ')}

[SKILL]
${context.skillText}

[FULL USER INPUT]
${context.scanText}`;
}

export interface ScriptSkillChunkPromptContext {
  promptControl: string;
  skillText: string;
  chunkText: string;
  chunkIndex: number;
  totalChunks: number;
  requestedOutputs: string[];
  canonicalMemory?: string;
}

export function buildScriptSkillChunkUserPrompt(context: ScriptSkillChunkPromptContext): string {
  return `${context.promptControl}

[LONG SCRIPT CHUNK MODE]
You are processing chunk ${context.chunkIndex}/${context.totalChunks}.
Requested outputs: ${context.requestedOutputs.join(', ')}

Rules:
- Process only this chunk.
- Return the same JSON contract used by the skill system prompt.
- Include only requested output fields.
- Reuse canonical characters/scenes exactly when provided.
- Do not rewrite, summarize, or skip details from the chunk.
- Keep episodeIndex as 1 unless the chunk explicitly says otherwise.

[CANONICAL MEMORY]
${context.canonicalMemory || 'None'}

[SKILL]
${context.skillText}

[CHUNK SOURCE TEXT]
${context.chunkText}`;
}

export const SCRIPT_STRUCTURE_ANALYSIS_SYSTEM_PROMPT = `You are a screenplay-structure analyst. Analyze the screenplay / character-spec text provided by the user, identify structural elements, and extract series-level metadata.

Return strictly valid JSON in the following structure and nothing else:
{
  "title": "work title",
  "era": "era / time setting (ancient / modern / republican / future / contemporary, etc.)",
  "genre": "genre (wuxia / business / romance / mystery / sci-fi / xianxia / military / family, etc.)",
  "hasOutline": false,
  "generatedOutline": "If the text does not contain an outline/synopsis section, generate a concise outline of 100-200 words; otherwise return an empty string.",
  "characterSectionKeyword": "Exact source text where the character section begins (copy the first 30 characters exactly), or empty if not found",
  "outlineSectionKeyword": "Exact source text where the outline section begins (copy the first 30 characters exactly), or empty if not found",
  "logline": "One-line summary of the story"
}

Rules:
1. title: identify it from the text, do not invent one
2. era: infer it from context rather than defaulting to modern
3. genre: infer it from the story elements
4. hasOutline: determine whether the source already contains a clear outline/synopsis section
5. generatedOutline: generate only when hasOutline = false
6. characterSectionKeyword: must be an exact fragment from the source text
7. Do not output characters, factions, keyItems, geography, centralConflict, themes, summaries beyond logline, ids, scene data, shot data, or extra fields.
8. Analyze structure only. Do not rewrite any original content.`;

export function buildSceneCalibrationSystemPrompt(seriesCtxBlock: string): string {
  return `You are a screenplay scene analyst focused on extracting only the core reusable background data needed for scene-image generation.${seriesCtxBlock}

[Core Task]
Generate only the minimum reusable scenePrompt for the following scenes.

[Important Constraints]
1. Do not add scenes. Only process the scenes in the list.
2. Do not delete scenes, even transitional ones.
3. Do not merge scenes. Record only merge suggestions.
4. Preserve the original sceneId exactly.

[Scene Requirements]
For each scene, return only:
- sceneId
- scenePrompt

Return the analysis result as JSON.`;
}

export function buildSceneCalibrationBatchUserPrompt(title: string, episodeCount: number, outlineContext: string, sceneList: string, batchLength: number): string {
  return `[Project Information]
Title: ${title}
Total Episodes: ${episodeCount}

[Story Outline]
${outlineContext || 'None'}

[Existing Scene List - enrich each scene with art direction] (${batchLength})
${sceneList}

 [Output Rules]
1. Return every original sceneId exactly as provided.
2. scenePrompt must be the direct source prompt for scene image generation.
3. Do not add time, atmosphere, tags, notes, lore, camera terms, negative prompt, or extra fields.
4. Put merge suggestions in mergeRecords only.

Return JSON in this format:
{
  "scenes": [
    {
      "sceneId": "original scene id",
      "scenePrompt": "concise reusable scene prompt"
    }
  ],
  "mergeRecords": [],
  "analysisNotes": "analysis notes"
}`;
}

export interface EpisodeTitlePromptContext {
  seriesContext: string;
  title: string;
  totalEpisodes: number;
  outline: string;
  characterBios: string;
}

export function buildEpisodeTitleSystemPrompt(context: EpisodeTitlePromptContext): string {
  return `You are a senior Hollywood television writer with strong experience in episode titling and narrative framing.

Your strengths:
- Creating concise, memorable episode titles that capture the episode's core conflict or turning point
- Matching title tone to genre and market expectations
- Maintaining title continuity across a full series arc

Generate short and compelling titles for each episode based on the global story context and the episode summaries.
${context.seriesContext ? `\n[Series Context]\n${context.seriesContext}\n` : ''}
[Project Info]
Title: ${context.title}
Total Episodes: ${context.totalEpisodes}

[Story Outline]
${context.outline.slice(0, 1500)}

[Main Characters]
${context.characterBios.slice(0, 1000)}

[Requirements]
1. Each title should capture the main content or turning point of the episode
2. Keep titles concise and punchy
3. Match title style to the genre
4. Keep the title sequence coherent across the series

Return JSON in this format:
{
  "titles": {
    "1": "episode title 1",
    "2": "episode title 2"
  }
}`;
}

export function buildEpisodeTitleUserPrompt(episodeContents: string): string {
  return `Generate titles for these episodes:\n\n${episodeContents}`;
}

export interface SingleEpisodeTitleSynopsisPromptContext {
  seriesContext: string;
  title: string;
  genre?: string;
  era?: string;
}

export function buildSingleEpisodeTitleSynopsisSystemPrompt(context: SingleEpisodeTitleSynopsisPromptContext): string {
  return `You are a screenplay structure analyst. Based on the series background and the current episode content, generate an episode title and synopsis.
${context.seriesContext ? `\n[Series Context]\n${context.seriesContext}\n` : ''}Title: ${context.title}
Genre: ${context.genre || 'Unknown'}
${context.era ? `Era: ${context.era}` : ''}

Return valid JSON in this format:
{
  "title": "A concise 6-15 word episode title that reflects the core conflict or turning point",
  "synopsis": "A 100-200 word synopsis covering the main events of the episode",
  "keyEvents": ["Key event 1", "Key event 2", "Key event 3"]
}`;
}

export function buildSingleEpisodeTitleSynopsisUserPrompt(episodeIndex: number, contentSummary: string): string {
  return `Episode ${episodeIndex} content:\n${contentSummary}`;
}

export interface EpisodeSynopsisPromptContext {
  seriesContext: string;
  title: string;
  genre?: string;
  era?: string;
  worldSetting?: string;
  themes?: string[];
  outline: string;
  characterBios: string;
  totalEpisodes: number;
}

export function buildEpisodeSynopsisSystemPrompt(context: EpisodeSynopsisPromptContext): string {
  return `You are a senior Hollywood script doctor who specializes in story structure and episode-level narrative pacing.

Your strengths:
- identifying each episode's core conflict, turning point, and emotional peak
- maintaining tonal and structural continuity across a series
- extracting concrete, visual key events that move the plot forward

Generate a concise synopsis and key events for each episode based on the global story context and each episode summary.
${context.seriesContext ? `\n[Series Context]\n${context.seriesContext}\n` : ''}
[Project Info]
Title: ${context.title}
Genre: ${context.genre || 'Unknown'}
${context.era ? `Era: ${context.era}` : ''}
${context.worldSetting ? `World Setting: ${context.worldSetting.slice(0, 200)}` : ''}
${context.themes && context.themes.length > 0 ? `Themes: ${context.themes.join(', ')}` : ''}
Total Episodes: ${context.totalEpisodes}

[Story Outline]
${context.outline.slice(0, 1000)}

[Main Characters]
${context.characterBios.slice(0, 800)}

[Requirements]
For each episode, generate:
1. synopsis: a 100-200 word episode synopsis covering the main plot progression
2. keyEvents: 3-5 key events, each concrete and visually expressible

Notes:
- emphasize the core conflict and turning point of the episode
- keep key events specific and cinematic
- preserve continuity across episodes

Return JSON in this format:
{
  "synopses": {
    "1": {
      "synopsis": "episode synopsis...",
      "keyEvents": ["event 1", "event 2", "event 3"]
    }
  }
}`;
}

export function buildEpisodeSynopsisUserPrompt(episodeContents: string): string {
  return `Generate synopses and key events for these episodes:\n\n${episodeContents}`;
}

function buildVisualContext({
  styleDesc,
  mediaTypeHint,
}: Pick<ShotCalibrationPromptContext, 'styleDesc' | 'mediaTypeHint'>): string {
  return `${styleDesc}${mediaTypeHint}`;
}

export function buildShotSingleStageSystemPrompt(context: ShotCalibrationPromptContext): string {
  const visualContext = buildVisualContext(context);

  if (context.isRefToVideo) {
    return `You are a cinematic video-generation specialist. Generate both imagePrompt and videoPrompt for each shot in a single pass.${context.eraContextBlock}

${visualContext}

imagePrompt: leave as empty string "" (not used in ref-to-video mode)
videoPrompt formula (English only, 20-50 words): [Character @anchors] + [Subject motion] + [Camera motion if needed]

- Use @Name / @[Full Name] anchors for confirmed characters only. No appearance descriptors.
Format: {"shots":{"shot_id":{"imagePrompt":"","videoPrompt":""}}}`;
  }

  return `You are a cinematic prompt specialist. Generate both imagePrompt and videoPrompt for each shot in a single pass.${context.eraContextBlock}

${visualContext}

imagePrompt formula (English only): [Character @anchor if visible] + [Action/expression] + [Location/context] + [Composition] + [Lighting/Style]
- Use @Name / @[Full Name] anchors for visible characters only. Do not repeat appearance/outfit.
- Static first-frame description only — no motion.

videoPrompt formula (English only, 20-40 words): [Subject motion] + [Camera motion] + [Environment change (optional)]
- Specific verbs for subject movement; dolly/pan/static/crane for camera.
- Do not repeat character appearance.

All prompt fields must be 100% English.

Format: {"shots":{"shot_id":{"imagePrompt":"","videoPrompt":""}}}`;
}
