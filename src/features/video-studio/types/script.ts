// Completion state
export type CompletionStatus = 'pending' | 'in_progress' | 'completed';

// Prompt language options
export type PromptLanguage = 'zh' | 'en' | 'zh+en';

// AI character calibration strictness
export type CalibrationStrictness = 'strict' | 'normal' | 'loose';

/** Filtered character record used for restoration. */
export interface FilteredCharacterRecord {
  name: string;
  reason: string;
}

/**
 * Negative prompts for character generation.
 * Used to exclude outputs that do not match the character definition.
 */
export interface CharacterNegativePrompt {
  avoid: string[];          // Traits to avoid: ["blonde hair", "blue eyes", "beard"]
  styleExclusions?: string[]; // Styles to exclude: ["anime style", "cartoon"]
}

export interface ScriptCharacter {
  id: string; // Script-level id
  name: string;
  appearance?: string; // Minimal visible appearance description used for image generation
  thumbnailUrl?: string;
  referenceImages?: string[];
  status?: CompletionStatus; // Character image generation status
  characterLibraryId?: string; // Linked character library ID
  
  characterPrompt?: string;         // Reusable character prompt for image, scene, and shot generation
  identityPrompt?: string;         // Reusable character identity description for scene/shot prompts
  
  // === Prompts populated during AI calibration ===
  negativePrompt?: CharacterNegativePrompt;    // Negative prompts used to exclude mismatched traits
}

export interface ScriptScene {
  id: string; // Script-level id
  name?: string;
  description?: string; // Human-readable scene description shared with the scene library
  time: string;
  atmosphere: string;
  scenePrompt?: string; // Reusable scene/background prompt for concept art and shot context
  tags?: string[]; // Scene tags, e.g. #woodPillar #windowFrame #historicArchitecture
  notes?: string; // Location notes or story context
  status?: CompletionStatus; // Scene generation status
  sceneLibraryId?: string; // Linked scene library ID
  
  // === Appearance stats, populated during AI calibration ===
  episodeNumbers?: number[];    // Episodes where the scene appears
  appearanceCount?: number;     // Appearance count
  importance?: 'main' | 'secondary' | 'transition';  // Scene importance
}

export interface ScriptParagraph {
  id: number;
  text: string;
  sceneRefId: string;
}

// Raw scene content, preserving full dialogue and actions
export interface SceneRawContent {
  sceneHeader: string;        // Scene header, e.g. "1-1 Day Interior Shanghai Zhang Residence"
  characters: string[];       // Appearing characters
  content: string;            // Full scene content including dialogue, actions, and subtitles
  dialogues: DialogueLine[];  // Parsed dialogue lines
  actions: string[];          // Action lines, typically prefixed with △
  subtitles: string[];        // Subtitle overlays
  weather?: string;           // Weather inferred from the scene content
  timeOfDay?: string;         // Time of day inferred from the scene header
}

// Dialogue line
export interface DialogueLine {
  character: string;          // Character name
  parenthetical?: string;     // Parenthetical action/emotion note, e.g. (drinking)
  line: string;               // Spoken line
}

// Raw script content for one episode
export interface EpisodeRawScript {
  episodeIndex: number;       // Episode number
  title: string;              // Episode title
  synopsis?: string;          // Episode synopsis or summary, AI-generated or edited manually
  keyEvents?: string[];       // Key events in the episode
  rawContent: string;         // Original full content
  scenes: SceneRawContent[];  // Parsed scene list
  shotGenerationStatus: 'idle' | 'generating' | 'completed' | 'error';  // Shot generation status
  lastGeneratedAt?: number;   // Last generation timestamp
  season?: string;            // Season inferred from subtitles, e.g. spring/summer/autumn/winter
}

// Project background information
export interface ProjectBackground {
  title: string;              // Series title
  genre?: string;             // Genre, such as business drama, wuxia, or romance
  era?: string;               // Historical era, such as republican, modern, or ancient
  timelineSetting?: string;   // Kept for timeline/age inference in the parser and character flow
  storyStartYear?: number;    // Story start year, used for age calculations
  storyEndYear?: number;      // Story end year
  totalEpisodes?: number;     // Total episode count
  outline: string;            // Story outline
  characterBios: string;      // Character bios
  worldSetting?: string;      // Worldbuilding or style setting
  themes?: string[];          // Theme keywords
}

// ==================== Series-level data (SeriesMeta) shared across episodes ====================

/** Character relationship. */
export interface CharacterRelationship {
  from: string;
  to: string;
  type: string;
}

/**
 * Series-level metadata shown on the project home view and shared by all episodes.
 * Initially populated by AI plus regex extraction, then enriched after calibration.
 */
export interface SeriesMeta {
  // === Story core ===
  title: string;
  logline?: string;                   // One-sentence summary
  outline?: string;                   // Full story arc summary
  centralConflict?: string;           // Main conflict
  themes?: string[];                  // Theme list, e.g. [revenge, power, friendship]

  // === Basic project context ===
  era?: string;                       // Ancient / modern / future
  genre?: string;                     // Wuxia / business / romance, etc.

  // === Character system ===
  characters: ScriptCharacter[];      // Lifted from scriptData.characters
  relationships?: CharacterRelationship[];  // Character relationships

  // === Visual system ===
  styleId?: string;
  recurringLocations?: ScriptScene[]; // Recurring scene library entries appearing in 2+ episodes

  // === Production settings ===
  language?: string;
  promptLanguage?: PromptLanguage;
  calibrationStrictness?: CalibrationStrictness;
  metadataMarkdown?: string;          // AI knowledge-base markdown
  metadataGeneratedAt?: number;
}

// Episode
export interface Episode {
  id: string;
  index: number;
  title: string;
  description?: string;
  sceneIds: string[]; // Scene IDs included in this episode
}

export interface ScriptData {
  title: string;
  genre?: string;
  logline?: string;
  language: string;
  targetDuration?: string;
  characters: ScriptCharacter[];
  scenes: ScriptScene[];
  episodes: Episode[]; // Episode list
  storyParagraphs: ScriptParagraph[];
}

export type ShotStatus = 'idle' | 'generating' | 'completed' | 'failed';
export type ScriptWorkflowType = 'narrative' | 'explainer';
export type VideoGenerationMode = 'image-to-video' | 'ref-to-video';
export type VideoLength = 4 | 6 | 8;

export function normalizeVideoLength(value: unknown): VideoLength {
  const numeric = typeof value === 'string'
    ? Number(value.replace(/[^0-9]/g, ''))
    : Number(value);
  return numeric === 6 || numeric === 8 ? numeric : 4;
}

export function normalizeRefImageIndexes(value: unknown): number[] {
  const source = value == null || value === ''
    ? []
    : Array.isArray(value)
      ? value
      : [value];
  const seen = new Set<number>();

  for (const item of source) {
    let raw: unknown = item;
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      raw = record.shotIndex
        ?? record.shot_index
        ?? record.shot
        ?? record.index
        ?? record.sourceShotIndex
        ?? record.source_shot_index;
    }

    const numbers = typeof raw === 'number'
      ? [raw]
      : Array.from(String(raw ?? '').matchAll(/\d+/g)).map((match) => Number(match[0]));
    for (const numeric of numbers) {
      if (Number.isInteger(numeric) && numeric > 0) {
        seen.add(numeric);
      }
    }
  }

  return Array.from(seen);
}

export interface Keyframe {
  id: string;
  type: 'start' | 'end';
  imagePrompt: string;
  imageUrl: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
}

export interface PromptOutputSettings {
  characterPrompt: boolean;
  scenePrompt: boolean;
  imagePrompt: boolean;
  videoPrompt: boolean;
}

export interface Shot {
  id: string;
  index: number;
  episodeId?: string;        // Owning episode ID
  sceneRefId: string;        // Script scene id
  sceneId?: string;          // Scene store id
  sceneLibraryId?: string;   // Scene master id from the scene library
  
  // === Core shot information ===
  completionStatus?: CompletionStatus;
  specialTechnique?: string; // Special technique such as dolly zoom, bullet time, or FPV fly-through
  
  // === Two-layer prompt system ===
  imagePrompt?: string;      // Start-frame prompt in English, static description
  videoPrompt?: string;      // Video prompt in English, dynamic action description
  voiceOver?: string;        // Spoken voice-over/narration text, kept out of videoPrompt until generation
  videoLength: VideoLength;  // Video API length in seconds
  ref_image?: number[];      // 1-based source shot indexes used as image references
  
  hasCharacters?: boolean; // false = no character refs in this shot (e.g. landscape/wide shots)
  characterIds?: string[];
  characterNames?: string[];
  dialogue?: string;
  ambientSound?: string;
  soundEffect?: string;
  interval?: {
    videoUrl?: string;
    duration?: number;
    status?: 'idle' | 'generating' | 'completed' | 'failed';
  };
  
  // === Emotion tags ===
  emotionTags?: string[];  // Emotion tag IDs, e.g. ['sad', 'tense', 'serious']
  
  // Generation (legacy single-image mode)
  imageStatus: ShotStatus;
  imageProgress: number;
  imageError?: string;
  imageUrl?: string;
  imageMediaId?: string;

  // Video generation
  videoStatus: ShotStatus;
  videoProgress: number;
  videoError?: string;
  videoUrl?: string;
  videoMediaId?: string;

  keyframes?: Keyframe[];
}
