import type {
  CalibrationStrictness,
  Episode,
  EpisodeRawScript,
  FilteredCharacterRecord,
  ScriptCharacter,
  ScriptData,
  ScriptScene,
  SeriesMeta,
  Shot,
  VideoGenerationMode,
} from "@/features/video-studio/types/script";
import type { LongScriptImportCheckpoint } from "@/features/video-studio/lib/script/ai-script-parser";

/** State shape, action signatures and factory defaults for the script store. */

export type ParseStatus = "idle" | "parsing" | "ready" | "error";
export type ShotListStatus = "idle" | "generating" | "ready" | "error";

export interface BatchProgress {
  current: number;
  total: number;
  message: string;
}

export type ScriptCalibrationStatus = "idle" | "calibrating" | "completed" | "error";
export type ScriptStructureStatus = "idle" | "processing" | "completed" | "error";

export type ScriptImportStatus = "idle" | "importing" | "ready" | "error";
export type ScriptSynopsisStatus = "idle" | "generating" | "completed" | "error";

export interface ScriptCalibrationState {
  titleCalibrationStatus: ScriptCalibrationStatus;
  characterCalibrationStatus: ScriptCalibrationStatus;
  sceneCalibrationStatus: ScriptCalibrationStatus;
  structureCompletionStatus: ScriptStructureStatus;
  singleShotCalibrationStatus: Record<string, ScriptCalibrationStatus>;
  calibrationDialogOpen: boolean;
  pendingCalibrationCharacters: ScriptCharacter[] | null;
  pendingFilteredCharacters: FilteredCharacterRecord[];
  // Mapping from old shot-side character IDs to the post-calibration IDs.
  // Populated when AI calibration completes, consumed when the user confirms
  // so shots can keep resolving character references after a merge.
  pendingCharacterIdRemap: Record<string, string>;
  // Import and synopsis-generation state that should survive panel switches.
  importStatus: ScriptImportStatus;
  synopsisStatus: ScriptSynopsisStatus;
}

export const defaultCalibrationState = (): ScriptCalibrationState => ({
  titleCalibrationStatus: "idle",
  characterCalibrationStatus: "idle",
  sceneCalibrationStatus: "idle",
  structureCompletionStatus: "idle",
  singleShotCalibrationStatus: {},
  calibrationDialogOpen: false,
  pendingCalibrationCharacters: null,
  pendingFilteredCharacters: [],
  pendingCharacterIdRemap: {},
  importStatus: "idle",
  synopsisStatus: "idle",
});
export interface ScriptProjectData {
  rawScript: string;
  language: string;
  targetDuration: string;
  styleId: string;
  sceneCount?: string; // Optional scene count
  shotCount?: string;  // Optional shot count
  scriptData: ScriptData | null;
  parseStatus: ParseStatus;
  parseError?: string;
  shots: Shot[];
  shotStatus: ShotListStatus;
  shotError?: string;
  batchProgress: BatchProgress | null;
  characterIdMap: Record<string, string>; // scriptCharId -> characterId
  sceneIdMap: Record<string, string>; // scriptSceneId -> sceneId
  updatedAt: number;
  // Full-script storage and calibration metadata
  episodeRawScripts: EpisodeRawScript[];        // Raw screenplay content by episode
  metadataMarkdown: string;                     // Auto-generated project metadata markdown used as global AI context
  metadataGeneratedAt?: number;                 // Metadata generation timestamp
  calibrationStrictness: CalibrationStrictness;  // Character-calibration strictness
  lastFilteredCharacters: FilteredCharacterRecord[];  // Filtered characters from the last calibration run
  calibrationState: ScriptCalibrationState;           // Persistent calibration task state for recovery after tab switches
  seriesMeta: SeriesMeta | null;                      // Series-level metadata shared across episodes
  videoGenerationMode: VideoGenerationMode;            // 'image-to-video' (default) or 'ref-to-video' (skip image gen)
  longScriptImportCheckpoint: LongScriptImportCheckpoint | null;
}

export interface ScriptStoreState {
  activeProjectId: string | null;
  projects: Record<string, ScriptProjectData>;
}

export interface ScriptStoreActions {
  setActiveProjectId: (id: string | null) => void;
  ensureProject: (projectId: string) => void;
  setRawScript: (projectId: string, rawScript: string) => void;
  setLanguage: (projectId: string, language: string) => void;
  setTargetDuration: (projectId: string, duration: string) => void;
  setStyleId: (projectId: string, styleId: string) => void;
  setSceneCount: (projectId: string, sceneCount?: string) => void;
  setShotCount: (projectId: string, shotCount?: string) => void;
  setScriptData: (projectId: string, data: ScriptData | null) => void;
  setParseStatus: (projectId: string, status: ParseStatus, error?: string) => void;
  setShots: (projectId: string, shots: Shot[]) => void;
  updateShot: (projectId: string, shotId: string, updates: Partial<Shot>) => void;
  setShotStatus: (projectId: string, status: ShotListStatus, error?: string) => void;
  setBatchProgress: (projectId: string, progress: BatchProgress | null) => void;
  setMappings: (projectId: string, mappings: { characterIdMap?: Record<string, string>; sceneIdMap?: Record<string, string> }) => void;
  resetProjectData: (projectId: string) => void;
  // Episode CRUD
  addEpisode: (projectId: string, episode: Episode) => void;
  updateEpisode: (projectId: string, episodeId: string, updates: Partial<Episode>) => void;
  deleteEpisode: (projectId: string, episodeId: string) => void;
  // Episode bundle atomic operations (keep scriptData.episodes and episodeRawScripts in sync)
  deleteEpisodeBundle: (projectId: string, episodeIndex: number) => void;
  reindexEpisodes: (projectId: string) => void;
  updateEpisodeBundle: (projectId: string, episodeIndex: number, updates: { title?: string; synopsis?: string }) => void;
  // Scene CRUD
  addScene: (projectId: string, scene: ScriptScene, episodeId?: string) => void;
  updateScene: (projectId: string, sceneId: string, updates: Partial<ScriptScene>) => void;
  deleteScene: (projectId: string, sceneId: string) => void;
  // Character CRUD
  addCharacter: (projectId: string, character: ScriptCharacter) => void;
  updateCharacter: (projectId: string, characterId: string, updates: Partial<ScriptCharacter>) => void;
  deleteCharacter: (projectId: string, characterId: string) => void;
  // Shot CRUD
  addShot: (projectId: string, shot: Shot) => void;
  deleteShot: (projectId: string, shotId: string) => void;
  // Full-script management
  setEpisodeRawScripts: (projectId: string, scripts: EpisodeRawScript[]) => void;
  updateEpisodeRawScript: (projectId: string, episodeIndex: number, updates: Partial<EpisodeRawScript>) => void;
  setMetadataMarkdown: (projectId: string, markdown: string) => void;
  setCalibrationState: (projectId: string, updates: Partial<ScriptCalibrationState>) => void;
  setSingleShotCalibrationStatus: (projectId: string, shotId: string, status: ScriptCalibrationStatus) => void;
  setCalibrationStrictness: (projectId: string, strictness: CalibrationStrictness) => void;
  setLastFilteredCharacters: (projectId: string, filtered: FilteredCharacterRecord[]) => void;
  setSeriesMeta: (projectId: string, meta: SeriesMeta) => void;
  updateSeriesMeta: (projectId: string, updates: Partial<SeriesMeta>) => void;
  setVideoGenerationMode: (projectId: string, mode: VideoGenerationMode) => void;
  setLongScriptImportCheckpoint: (projectId: string, checkpoint: LongScriptImportCheckpoint | null) => void;
}

export type ScriptStore = ScriptStoreState & ScriptStoreActions;

export const defaultProjectData = (): ScriptProjectData => ({
  rawScript: "",
  language: "English",
  targetDuration: "60s",
  styleId: "2d_ghibli",
  sceneCount: undefined,
  shotCount: undefined,
  scriptData: null,
  parseStatus: "idle",
  parseError: undefined,
  shots: [],
  shotStatus: "idle",
  shotError: undefined,
  batchProgress: null,
  characterIdMap: {},
  sceneIdMap: {},
  updatedAt: Date.now(),
  // Additional default values
  episodeRawScripts: [],
  metadataMarkdown: '',
  metadataGeneratedAt: undefined,
  calibrationStrictness: 'normal',
  lastFilteredCharacters: [],
  calibrationState: defaultCalibrationState(),
  seriesMeta: null,
  videoGenerationMode: 'image-to-video',
  longScriptImportCheckpoint: null,
});
