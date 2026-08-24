import type { GenerationStatus } from '@/features/video-studio/lib/ai/generation-status';
import type { VideoLength } from '@/features/video-studio/types/script';

export type AutopilotStage =
  | 'queued'
  | 'script'
  | 'shots'
  | 'media'
  | 'audio'
  | 'subtitles'
  | 'characters'
  | 'scenes'
  | 'research'
  | 'images'
  | 'videos'
  | 'render'
  | 'done'
  | 'failed'
  | 'paused'
  | 'interrupted'
  | 'cancelled';

export type AutopilotJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'paused' | 'interrupted' | 'cancelled';

export type AutopilotExecutionMode = 'all' | 'step';

export type AutopilotStep =
  | 'audio'
  | 'shots'
  | 'research'
  | 'references'
  | 'images'
  | 'videos'
  | 'render'
  | 'done';

/**
 * Snapshot of the TTS tab's voice configuration, captured when the job is created.
 * AutoPilot no longer keeps its own hard-coded engine list — it uses whatever the
 * TTS feature is configured with (single source of truth), so any provider added
 * there (CapCut, Gemini, Vbee, OmniVoice, …) works in AutoPilot automatically.
 * Legacy fields (engine/voiceType/voiceName) are kept so old jobs still resume.
 */
export interface AutopilotVoiceInput {
  /** TTS model id from the model registry (e.g. 'capcut-online', 'vbee-api'). */
  modelId?: string;
  repository?: string;
  capability?: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu';
  mode?: 'clone' | 'design' | 'auto' | 'preset';
  splitMode?: string;
  language?: string;
  speed?: number;
  numStep?: number;
  capcutVoiceType?: string;
  capcutResourceId?: string;
  geminiVoiceName?: string;
  geminiStyle?: string;
  vbeeVoiceCode?: string;
  vbeeAudioType?: 'mp3' | 'wav';
  vbeeBitrate?: number;
  vieneuVoice?: string;
  vieneuStyle?: 'tu_nhien' | 'tin_tuc' | 'doc_truyen';
  /** OmniVoice design-mode voice instruction. */
  instruction?: string;
  /** OmniVoice cloned-voice profile. When present, TTS runs in clone mode using the profile reference audio. */
  profileId?: string;
  referenceAudioPath?: string;
  referenceText?: string;
  /** Human-readable labels for display in the AutoPilot job list. */
  engineName?: string;
  voiceLabel?: string;
  /** Legacy fields from older jobs (pre single-source). */
  engine?: 'capcut' | 'gemini' | 'omnivoice' | 'vbee' | 'vieneu';
  voiceType?: string;
  voiceName?: string;
}

export interface AutopilotImportedPlan {
  version?: number;
  title?: string;
  aspectRatio?: string;
  allowRealImageResearch?: boolean;
  characters?: Array<{ name: string; description?: string; characterPrompt: string }>;
  scenes?: Array<{ name: string; description?: string; scenePrompt: string }>;
  shots: Array<{
    voiceOver: string;
    imagePrompt: string;
    videoPrompt?: string;
    characterNames?: string[];
    sceneName?: string;
    transitionToNext?: string;
    realImageQuery?: string;
  }>;
}

export interface AutopilotJobInput {
  title?: string;
  topic?: string;
  script?: string;
  style?: string;
  /** Full creative workflow instructions. The built-in Vox skill is passed here by the UI. */
  skill?: string;
  maxShots?: number;
  /** Actual narration duration at or above this value enables chaptered long-form orchestration. */
  longFormThresholdMinutes?: number;
  aspectRatio?: string;
  imageModel?: string;
  videoModel?: string;
  /** Existing narration file. When present it replaces TTS and its Whisper transcript becomes the locked script. */
  importedAudioPath?: string;
  /** Optional raw SRT for the imported narration file. When present it replaces Whisper: its segments lock timing and become the primary script. */
  importedSrtRaw?: string;
  /** Complete user-authored visual plan; bypasses AI/CLI script and shot planning. */
  importedPlan?: AutopilotImportedPlan;
  voice?: AutopilotVoiceInput;
  subtitles?: boolean;
  whisperProvider?: 'openai' | 'groq';
  whisperApiKey?: string;
  resolution?: '1280x720' | '1920x1080' | '3840x2160';
  fps?: 24 | 30 | 60;
  codec?: 'libx264' | 'libx265' | 'h264_nvenc';
  crf?: number;
  bgmPath?: string;
  bgmVolume?: number;
  bgmDuckVoice?: boolean;
  /** Normalize final audio to -14 LUFS (YouTube standard). Default false. */
  audioNormalize?: boolean;
  /** Keep original video audio at this volume 0..1. 0 = mute (default). */
  videoAudioVolume?: number;
  outputPath?: string;
  /** `step` pauses after every durable checkpoint and waits for the user. */
  executionMode?: AutopilotExecutionMode;
  /**
   * Batch/queue control. When set, the pipeline runs from the start up to and
   * including this step, then stops (marked done) instead of continuing. Lets a
   * queued project run only a portion — e.g. `shots` for "chỉ tạo shot",
   * `references` for "tạo nhân vật + cảnh", `videos` for "tạo video (chưa ghép)".
   * Undefined runs the full pipeline through render.
   */
  stopAfterStep?: AutopilotStep;
}

export interface AutopilotLogEntry {
  ts: number;
  stage: string;
  message: string;
}

export interface AutopilotSrtSegment {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface AutopilotCharacterOutput {
  name: string;
  imagePath: string;
  status?: AutopilotAssetStatus;
}

export interface AutopilotCharacterPlan {
  name: string;
  description: string;
  characterPrompt: string;
}

export interface AutopilotScenePlan {
  name: string;
  description: string;
  scenePrompt: string;
}

export interface AutopilotSceneOutput {
  name: string;
  imagePath: string;
  status?: AutopilotAssetStatus;
}

export interface AutopilotPlannedShot {
  id: string;
  index: number;
  sceneRefId: string;
  imagePrompt: string;
  videoPrompt: string;
  transitionToNext?: string;
  realImageQuery?: string;
  voiceOver: string;
  videoLength: VideoLength;
  startMs: number;
  endMs: number;
  hasCharacters: boolean;
  characterNames: string[];
  imageStatus: 'idle';
  imageProgress: number;
  videoStatus: 'idle';
  videoProgress: number;
}

export type AutopilotAssetStatus = GenerationStatus | 'skipped';

export interface AutopilotLongFormBible {
  storyArc: string;
  visualTheme: string;
  palette: string[];
  characterRules: string[];
  locationRules: string[];
  motionRules: string[];
  transitionRules: string[];
  researchRules: string[];
  terminology: Record<string, string>;
}

export interface AutopilotChapterCheckpoint {
  id: string;
  index: number;
  title: string;
  startMs: number;
  endMs: number;
  beatIndexes: number[];
  status: 'idle' | 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error?: string;
  plannedShots?: AutopilotPlannedShot[];
  plannedCharacters?: AutopilotCharacterPlan[];
  plannedScenes?: AutopilotScenePlan[];
  renderStatus?: 'idle' | 'queued' | 'running' | 'done' | 'failed';
  renderProgress?: number;
  renderError?: string;
  outputVideoPath?: string;
}

export interface AutopilotMediaOutput {
  index: number;
  startMs: number;
  endMs: number;
  characterNames: string[];
  imagePath: string;
  /** Legacy base-frame checkpoint retained for compatibility with older jobs. */
  baseImagePath?: string;
  videoPath: string;
  /** Real video length (seconds), cached so FCPXML export never re-probes the file. */
  videoDurationSec?: number;
  realImagePath?: string;
  /** Media-library IDs so re-runs reuse the same library entries like Director. */
  imageMediaId?: string;
  videoMediaId?: string;
  realImageMediaId?: string;
  realImageSourceUrl?: string;
  realImageTitle?: string;
  realImageQuery?: string;
  realImageSearchCompleted?: boolean;
  researchStatus?: AutopilotAssetStatus;
  imageStatus?: AutopilotAssetStatus;
  videoStatus?: AutopilotAssetStatus;
}

export interface AutopilotJob {
  id: string;
  projectId?: string;
  title: string;
  status: AutopilotJobStatus;
  stage: AutopilotStage;
  progress: number;
  message: string;
  input: AutopilotJobInput;
  executionMode?: AutopilotExecutionMode;
  completedSteps?: AutopilotStep[];
  nextStep?: AutopilotStep;
  awaitingNextStep?: boolean;
  scriptText?: string;
  shotCount?: number;
  characterCount?: number;
  plannedCharacters?: AutopilotCharacterPlan[];
  sceneCount?: number;
  plannedScenes?: AutopilotScenePlan[];
  plannedShots?: AutopilotPlannedShot[];
  longFormMode?: boolean;
  longFormBible?: AutopilotLongFormBible;
  /** Project visual style frozen when the job starts, so resume and parallel lanes stay consistent. */
  visualStyleId?: string;
  visualStyleName?: string;
  visualStylePrompt?: string;
  visualStyleNegativePrompt?: string;
  chapters?: AutopilotChapterCheckpoint[];
  characterOutputs?: AutopilotCharacterOutput[];
  sceneOutputs?: AutopilotSceneOutput[];
  mediaOutputs?: AutopilotMediaOutput[];
  audioPath?: string;
  audioDurationMs?: number;
  srtSegments?: AutopilotSrtSegment[];
  outputVideoPath?: string;
  /** Media-library id of the final MP4, so re-stitching overwrites it instead of piling up duplicates. */
  outputMediaId?: string;
  log: AutopilotLogEntry[];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

export interface AutopilotEngineStatus {
  port: number;
  serverRunning: boolean;
  rendererReady: boolean;
  flowRunning: boolean;
  flowReadyCredentials: number;
  flowBindingCount: number;
  activeJobCount: number;
}

export type AutopilotEvent =
  | { type: 'job-updated'; jobId: string; job: AutopilotJob }
  | { type: 'log'; jobId: string; ts: number; stage: string; message: string }
  | { type: 'job-removed'; jobId: string; projectId?: string };

export interface AutopilotJobCreateResult {
  ok: boolean;
  jobId?: string;
  error?: string;
}

export interface AutopilotJobListItem {
  id: string;
  projectId?: string;
  title: string;
  status: AutopilotJobStatus;
  stage: AutopilotStage;
  progress: number;
  message: string;
  createdAt: number;
  finishedAt?: number;
  error?: string;
  input: AutopilotJobInput;
  executionMode?: AutopilotExecutionMode;
  completedSteps?: AutopilotStep[];
  nextStep?: AutopilotStep;
  awaitingNextStep?: boolean;
  plannedCharacters?: AutopilotCharacterPlan[];
  plannedScenes?: AutopilotScenePlan[];
  plannedShots?: AutopilotPlannedShot[];
  audioPath?: string;
  audioDurationMs?: number;
  srtSegments?: AutopilotSrtSegment[];
  outputVideoPath?: string;
  shotCount?: number;
  characterCount?: number;
  characterOutputs?: AutopilotCharacterOutput[];
  sceneCount?: number;
  sceneOutputs?: AutopilotSceneOutput[];
  mediaOutputs?: AutopilotMediaOutput[];
  longFormMode?: boolean;
  chapters?: AutopilotChapterCheckpoint[];
}
