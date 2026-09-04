/**
 * Types, constants and small helpers shared between the AutoPilot engine and
 * its stage modules.
 *
 * The stages are plain functions that take an `EngineContext` — the slice of
 * engine internals (logging, progress, job mutation) they need — so each stage
 * can live in its own file without the engine class growing to match.
 */

import { getFeatureConfig, type FeatureConfig } from '@/features/video-studio/lib/ai/feature-router';
import { CLI_TEXT_TIMEOUT_MS, getCliProviderPlatform } from '@/features/video-studio/lib/cli-runtime';
import { ApiKeyManager } from '@/features/video-studio/lib/api-key-manager';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { useContentChatStore } from '@/features/content-chat/store';
import {
  buildLaneWorkers,
  resolveLaneCount,
  runLaneQueue,
  syncRuntimeLaneSettings,
  withRetry,
} from '@/features/video-studio/lib/ai/lane-manager';
import type { Shot } from '@/features/video-studio/types/script';
import type { AutoVideoTransition } from '@/features/video-studio/lib/auto-video/types';
import type { RealImageAsset } from './real-media-search';
import type {
  AutopilotAssetStatus,
  AutopilotJob,
  AutopilotPlannedShot,
  AutopilotStage,
  AutopilotStep,
} from './types';

export type PlannedShot = AutopilotPlannedShot & Shot & {
  transitionToNext?: AutoVideoTransition;
};

export interface PendingShot {
  shot: PlannedShot;
  baseImagePath: string;
  imagePath: string;
  videoPath: string;
  realImage?: RealImageAsset;
  realImageSearchCompleted: boolean;
  imageMediaId?: string;
  videoMediaId?: string;
  realImageMediaId?: string;
  researchStatus: AutopilotAssetStatus;
  imageStatus: AutopilotAssetStatus;
  videoStatus: AutopilotAssetStatus;
}

export interface AudioResult {
  path: string;
  durationMs: number;
}

export interface CharacterReference {
  name: string;
  description: string;
  characterPrompt: string;
  imagePath: string;
}

export interface SceneReference {
  name: string;
  description: string;
  scenePrompt: string;
  imagePath: string;
}

export type MediaPhase = 'research' | 'images' | 'videos';

export interface ShotPlanningOptions {
  extraContext?: string;
  persist?: boolean;
  progress?: boolean;
}

export interface ShotPlan {
  shots: PlannedShot[];
  characters: import('./types').AutopilotCharacterPlan[];
  scenes: import('./types').AutopilotScenePlan[];
}

/** The engine internals a stage function is allowed to reach for. */
export interface EngineContext {
  readonly activeControllers: Map<string, AbortController>;
  getJob(jobId: string): AutopilotJob | undefined;
  log(jobId: string, stage: string, message: string): void;
  stageProgress(jobId: string, stage: AutopilotStage, withinPercent: number): void;
  updateJob(jobId: string, patch: Partial<AutopilotJob>): void;
  updateCharacterOutput(jobId: string, name: string, patch: Partial<NonNullable<AutopilotJob['characterOutputs']>[number]>): void;
  updateSceneOutput(jobId: string, name: string, patch: Partial<NonNullable<AutopilotJob['sceneOutputs']>[number]>): void;
  completeStep(job: AutopilotJob, step: AutopilotStep): void;
  isImageAvailable(path: string | undefined): Promise<boolean>;
  probeMedia(path: string | undefined): Promise<number>;
}

export const STAGE_WEIGHT: Record<string, number> = {
  script: 8,
  audio: 12,
  subtitles: 10,
  shots: 15,
  research: 7,
  characters: 4,
  scenes: 4,
  images: 15,
  videos: 15,
  media: 37,
  render: 10,
};

export const STAGE_BASE: Record<string, number> = {
  script: 0,
  audio: 8,
  subtitles: 20,
  shots: 30,
  research: 45,
  characters: 52,
  scenes: 56,
  images: 60,
  videos: 75,
  media: 53,
  render: 90,
};

export const STEP_ORDER: AutopilotStep[] = ['audio', 'shots', 'research', 'references', 'images', 'videos', 'render', 'done'];

export class StepCheckpointReached extends Error {
  constructor(readonly completedStep: AutopilotStep, readonly nextStep: AutopilotStep) {
    super(`AutoPilot checkpoint: ${completedStep}`);
  }
}

export async function runGenerationWithRetries<T>(
  retryAttempts: number,
  signal: AbortSignal,
  operation: (attempt: number, totalAttempts: number) => Promise<T>,
  onRetry: (nextAttempt: number, totalAttempts: number, error: unknown) => void,
): Promise<T> {
  const totalAttempts = Math.max(1, Math.floor(retryAttempts) + 1);
  return withRetry(
    {
      attempts: totalAttempts,
      baseDelayMs: 0,
      signal,
      onRetry: (nextAttempt, error) => onRetry(nextAttempt, totalAttempts, error),
    },
    operation,
  );
}

/**
 * Restore persisted asset statuses: in-flight states (including legacy 'running'
 * and 'uploading') die with the process and reset to idle; legacy 'done' maps to
 * 'completed' so old checkpoints keep their finished assets.
 */
export function normalizeRestoredAssetStatus(status: AutopilotAssetStatus | undefined): AutopilotAssetStatus {
  const raw = status as string | undefined;
  if (raw === 'running' || raw === 'queued' || raw === 'uploading' || raw === 'generating') return 'idle';
  if (raw === 'done') return 'completed';
  return (status as AutopilotAssetStatus) || 'idle';
}

/**
 * Build a CLI-backed text config mirroring exactly what ContentChat uses — its
 * adapter and its selected model — so AutoPilot text (script + shot planning)
 * keeps working out of the box even when the Settings "Local CLI runtime" toggle
 * is off. ContentChat itself never consults that toggle, so neither do we here.
 */
function buildCliTextConfig(): FeatureConfig {
  const contentChat = useContentChatStore.getState();
  const cliSettings = useVideoStudioSettingsStore.getState().cliRuntime;
  // ContentChat defaults to the claude adapter; fall back to opencode for any
  // other adapter (codex is carried via cliAdapter below for the actual spawn).
  const adapter = contentChat.adapter;
  const platform = getCliProviderPlatform(adapter === 'claude' ? 'claude' : 'opencode');
  const model = contentChat.models[adapter]?.trim() || cliSettings.model?.trim() || '';
  return {
    feature: 'script_analysis',
    featureName: 'Script Analysis',
    provider: {
      id: `__${platform}`,
      platform,
      name: 'ContentChat CLI',
      baseUrl: 'cli://local',
      apiKey: '',
      model: model ? [model] : [],
      capabilities: ['text'],
    },
    apiKey: '',
    allApiKeys: [],
    keyManager: new ApiKeyManager(''),
    platform,
    baseUrl: 'cli://local',
    models: model ? [model] : [],
    model,
    cliAdapter: adapter,
    cliTimeoutMs: CLI_TEXT_TIMEOUT_MS,
  };
}

export function getTextAiConfig(): NonNullable<ReturnType<typeof getFeatureConfig>> {
  const config = getFeatureConfig('script_analysis') || getFeatureConfig('chat');
  if (config?.apiKey) return config;
  if (config?.baseUrl === 'cli://local') {
    // The Settings "Local CLI runtime" toggle is ON, so feature-router served its
    // CLI config. That config already carries cliAdapter/cliTimeoutMs now, but
    // pin them defensively anyway: chapter planning through a slow proxy takes
    // ~2 minutes and must never fall back to the generic 120s Settings timeout.
    const cliSettings = useVideoStudioSettingsStore.getState().cliRuntime;
    return {
      ...config,
      cliAdapter: config.cliAdapter ?? cliSettings.adapter,
      cliTimeoutMs: config.cliTimeoutMs ?? CLI_TEXT_TIMEOUT_MS,
    };
  }
  // No usable HTTP provider bound for text and the CLI toggle is off — reuse the
  // same local CLI ContentChat runs so AutoPilot text never dies on a missing key.
  return buildCliTextConfig();
}

/**
 * Use the same queue topology as Director. GoogleFlowRuntime remains the single
 * authoritative submit gate, so Settings delays apply across Director,
 * AutoPilot, accounts, retries, and simultaneous jobs without double-sleeping.
 */
export async function runGoogleFlowQueueOrdered<T, R>(
  ctx: EngineContext,
  job: AutopilotJob,
  stage: AutopilotStage,
  kind: 'image' | 'video',
  items: T[],
  signal: AbortSignal,
  runItem: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  await syncRuntimeLaneSettings();
  const laneCount = await resolveLaneCount(kind, 'googleflow');
  ctx.log(job.id, stage, `Queue ${kind === 'image' ? 'ảnh' : 'video'} dùng chung với Đạo diễn: ${laneCount} lane`);

  const results = new Array<R>(items.length);
  await runLaneQueue(
    items.map((item, index) => ({ item: { item, index } })),
    buildLaneWorkers([], laneCount),
    async ({ item }) => {
      results[item.index] = await runItem(item.item, item.index);
    },
    signal,
  );
  return results;
}
