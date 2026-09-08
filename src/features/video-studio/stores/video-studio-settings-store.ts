import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fileStorage } from "@/shared/lib/indexed-db-storage";
import type { MediaRoutingMode } from "@/features/video-studio/autopilot/account-routing";

export interface ResourceSharingSettings {
  shareCharacters: boolean;
  shareScenes: boolean;
  shareMedia: boolean;
}

export interface StoragePathSettings {
  basePath: string;
}

export interface CacheSettings {
  autoCleanEnabled: boolean;
  autoCleanDays: number;
}
export interface UpdateSettings {
  autoCheckEnabled: boolean;
  ignoredVersion: string;
}

export type CliAdapter = "claude" | "opencode";
export interface CliRuntimeSettings {
  enabled: boolean;
  adapter: CliAdapter;
  model: string;
  timeoutMs: number;
}
// CONFIG CLI
export const isCliRuntimeBeta = false;

export interface MaxStudioLaneSettings {
  imageLanesPerJwt: number;
  videoLanesPerJwt: number;
  imageSubmitDelayMinMs: number;
  imageSubmitDelayMaxMs: number;
  videoSubmitDelayMinMs: number;
  videoSubmitDelayMaxMs: number;
  jwtStartStaggerMinMs: number;
  jwtStartStaggerMaxMs: number;
  imageGenerationTimeoutMinMs: number;
  imageGenerationTimeoutMaxMs: number;
  videoGenerationTimeoutMinMs: number;
  videoGenerationTimeoutMaxMs: number;
  generationRetryAttempts: number;
  rateLimitRetryEnabled: boolean;
  rateLimitRetryAttempts: number;
  rateLimitRetryExtraDelayMs: number;
  /** Text-API (LLM) batch concurrency used by the adaptive batch processor. */
  textApiBatchConcurrency: number;
}

export interface ScriptImportSettings {
  longScriptSkillWordThreshold: number;
  longScriptSkillChunkConcurrency: number;
}

export interface AutopilotSettings {
  longFormThresholdMinutes: number;
  /** Max chapters planned in parallel during long-form planning. */
  planningConcurrency: number;
  /** Animate still shots with a Ken Burns move. Off keeps every still frozen. */
  kenBurnsEnabled: boolean;
  /** Share of still shots that get a Ken Burns move (0-100); the rest stay frozen. */
  kenBurnsPercent: number;
}

/**
 * Defaults for which Google Flow accounts and models media generation may use.
 *
 * These are only defaults: a job copies them at creation time, and anything the
 * job sets itself wins. Editing them never changes a job that is already running.
 */
export interface MediaRoutingSettings {
  /** Accounts (`ownerScopeId`) generation may use. Empty = every connected account. */
  flowAccounts: string[];
  /** Models tried in order after the selected one runs out of daily quota everywhere. */
  imageModelFallbacks: string[];
  videoModelFallbacks: string[];
  /**
   * ownerScopeId → the models that account runs, in that account's own run order.
   * A missing entry means it runs every model in the shared order above, so an
   * account nobody configured behaves exactly as before.
   */
  accountVideoModels: Record<string, string[]>;
  accountImageModels: Record<string, string[]>;
  /**
   * What gives way first when an account runs out of daily quota — see
   * MediaRoutingMode in autopilot/account-routing.ts. Defaults to `quality`,
   * which is how everything routed before the mode existed.
   */
  routingMode: MediaRoutingMode;
}

interface VideoStudioSettingsState {
  resourceSharing: ResourceSharingSettings;
  storagePaths: StoragePathSettings;
  cacheSettings: CacheSettings;
  updateSettings: UpdateSettings;
  cliRuntime: CliRuntimeSettings;
  maxStudioLanes: MaxStudioLaneSettings;
  scriptImport: ScriptImportSettings;
  autopilot: AutopilotSettings;
  mediaRouting: MediaRoutingSettings;
  /** Fully hide (not just minimize) the in-app login Chrome windows after they finish signing in. */
  hideLoginBrowser: boolean;
  /** Automatically remove the Gemini watermark from newly generated images. Pro plan or higher. */
  watermarkRemovalEnabled: boolean;
}

interface VideoStudioSettingsActions {
  setResourceSharing: (settings: Partial<ResourceSharingSettings>) => void;
  setStoragePaths: (paths: Partial<StoragePathSettings>) => void;
  setCacheSettings: (settings: Partial<CacheSettings>) => void;
  setUpdateSettings: (settings: Partial<UpdateSettings>) => void;
  setCliRuntime: (settings: Partial<CliRuntimeSettings>) => void;
  setMaxStudioLanes: (settings: Partial<MaxStudioLaneSettings>) => void;
  setScriptImport: (settings: Partial<ScriptImportSettings>) => void;
  setAutopilot: (settings: Partial<AutopilotSettings>) => void;
  setMediaRouting: (settings: Partial<MediaRoutingSettings>) => void;
  setHideLoginBrowser: (value: boolean) => void;
  setWatermarkRemovalEnabled: (value: boolean) => void;
}

export const DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 500;
export const MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 100;
export const MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 50000;
export const DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 2;
export const MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 1;
export const MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 8;
export const DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 8;
export const MIN_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 1;
export const MAX_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 120;
export const DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY = 2;
export const MIN_AUTOPILOT_PLANNING_CONCURRENCY = 1;
export const MAX_AUTOPILOT_PLANNING_CONCURRENCY = 8;
export const DEFAULT_AUTOPILOT_KEN_BURNS_PERCENT = 100;
export const MIN_AUTOPILOT_KEN_BURNS_PERCENT = 0;
export const MAX_AUTOPILOT_KEN_BURNS_PERCENT = 100;
export const DEFAULT_TEXT_API_BATCH_CONCURRENCY = 1;
export const MIN_TEXT_API_BATCH_CONCURRENCY = 1;
export const MAX_TEXT_API_BATCH_CONCURRENCY = 8;

const defaultMaxStudioLaneSettings: MaxStudioLaneSettings = {
  imageLanesPerJwt: 4,
  videoLanesPerJwt: 4,
  imageSubmitDelayMinMs: 1400,
  imageSubmitDelayMaxMs: 1600,
  videoSubmitDelayMinMs: 1500,
  videoSubmitDelayMaxMs: 1800,
  jwtStartStaggerMinMs: 1300,
  jwtStartStaggerMaxMs: 1500,
  imageGenerationTimeoutMinMs: 150000,
  imageGenerationTimeoutMaxMs: 200000,
  videoGenerationTimeoutMinMs: 360000,
  videoGenerationTimeoutMaxMs: 420000,
  generationRetryAttempts: 1,
  rateLimitRetryEnabled: true,
  rateLimitRetryAttempts: 1,
  rateLimitRetryExtraDelayMs: 2000,
  textApiBatchConcurrency: DEFAULT_TEXT_API_BATCH_CONCURRENCY,
};

function mergeMaxStudioLaneSettings(settings?: Partial<MaxStudioLaneSettings>): MaxStudioLaneSettings {
  return { ...defaultMaxStudioLaneSettings, ...(settings || {}) };
}

// Empty everywhere: no account is excluded and no model is silently swapped until
// the user says so.
const defaultMediaRoutingSettings: MediaRoutingSettings = {
  flowAccounts: [],
  imageModelFallbacks: [],
  videoModelFallbacks: [],
  accountVideoModels: {},
  accountImageModels: {},
  routingMode: 'quality',
};

function cleanModelList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value.map((item) => String(item || '').trim()).filter(Boolean);
  return [...new Set(cleaned)];
}

function cleanAccountModels(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const cleaned: Record<string, string[]> = {};
  for (const [ownerScopeId, models] of Object.entries(value as Record<string, unknown>)) {
    const owner = ownerScopeId.trim();
    if (!owner) continue;
    if (!Array.isArray(models)) continue;
    // cleanModelList keeps the order, which is the point: it is the run order.
    // An empty list is dropped, not stored: no entry is what "follows the shared
    // order" looks like, and it is the only one the picker can show or undo.
    const list = cleanModelList(models);
    if (list.length) cleaned[owner] = list;
  }
  return cleaned;
}

function mergeMediaRoutingSettings(settings?: Partial<MediaRoutingSettings>): MediaRoutingSettings {
  return {
    flowAccounts: cleanModelList(settings?.flowAccounts),
    imageModelFallbacks: cleanModelList(settings?.imageModelFallbacks),
    videoModelFallbacks: cleanModelList(settings?.videoModelFallbacks),
    accountVideoModels: cleanAccountModels(settings?.accountVideoModels),
    accountImageModels: cleanAccountModels(settings?.accountImageModels),
    routingMode: settings?.routingMode === 'speed' ? 'speed' : 'quality',
  };
}

function normalizeTextApiBatchConcurrency(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TEXT_API_BATCH_CONCURRENCY;
  return Math.round(Math.min(MAX_TEXT_API_BATCH_CONCURRENCY, Math.max(MIN_TEXT_API_BATCH_CONCURRENCY, parsed)));
}

export function normalizeLongScriptSkillWordThreshold(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD;
  return Math.round(Math.min(MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD, Math.max(MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD, parsed)));
}

export function normalizeLongScriptSkillChunkConcurrency(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY;
  return Math.round(Math.min(MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, Math.max(MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, parsed)));
}

export function normalizeAutopilotLongFormThresholdMinutes(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES;
  return Math.round(Math.min(MAX_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES, Math.max(MIN_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES, parsed)));
}

export function normalizeAutopilotPlanningConcurrency(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY;
  return Math.round(Math.min(MAX_AUTOPILOT_PLANNING_CONCURRENCY, Math.max(MIN_AUTOPILOT_PLANNING_CONCURRENCY, parsed)));
}

/** An empty or unreadable field means "every still shot moves". */
export function normalizeAutopilotKenBurnsPercent(value: unknown): number {
  const raw = typeof value === 'number' ? value : String(value ?? '').trim();
  // An empty field means "leave it at 100%", not "0%".
  if (raw === '') return DEFAULT_AUTOPILOT_KEN_BURNS_PERCENT;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOPILOT_KEN_BURNS_PERCENT;
  return Math.round(Math.min(MAX_AUTOPILOT_KEN_BURNS_PERCENT, Math.max(MIN_AUTOPILOT_KEN_BURNS_PERCENT, parsed)));
}

function mergeScriptImportSettings(settings?: Partial<ScriptImportSettings>): ScriptImportSettings {
  return {
    longScriptSkillWordThreshold: normalizeLongScriptSkillWordThreshold(settings?.longScriptSkillWordThreshold),
    longScriptSkillChunkConcurrency: normalizeLongScriptSkillChunkConcurrency(settings?.longScriptSkillChunkConcurrency),
  };
}

const defaultState: VideoStudioSettingsState = {
  resourceSharing: {
    shareCharacters: false,
    shareScenes: false,
    shareMedia: false,
  },
  storagePaths: {
    basePath: "",
  },
  cacheSettings: {
    autoCleanEnabled: false,
    autoCleanDays: 30,
  },
  updateSettings: {
    autoCheckEnabled: true,
    ignoredVersion: "",
  },
  cliRuntime: {
    enabled: false,
    adapter: "opencode",
    model: "",
    // Kịch bản dài / lập kế hoạch shot qua CLI proxy có thể chạy vài phút, nên
    // mặc định bằng đúng ngân sách ContentChat dùng: 10 phút. Đây là nguồn duy
    // nhất cho mọi lời gọi text qua CLI (AutoPilot, script panel, Settings test).
    timeoutMs: 600000,
  },
  maxStudioLanes: defaultMaxStudioLaneSettings,
  scriptImport: {
    longScriptSkillWordThreshold: DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
    longScriptSkillChunkConcurrency: DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
  },
  autopilot: {
    longFormThresholdMinutes: DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES,
    planningConcurrency: DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY,
    kenBurnsEnabled: true,
    kenBurnsPercent: DEFAULT_AUTOPILOT_KEN_BURNS_PERCENT,
  },
  mediaRouting: defaultMediaRoutingSettings,
  hideLoginBrowser: false,
  watermarkRemovalEnabled: false,
};

export const useVideoStudioSettingsStore = create<VideoStudioSettingsState & VideoStudioSettingsActions>()(
  persist(
    (set) => ({
      ...defaultState,
      setResourceSharing: (settings) =>
        set((state) => ({
          resourceSharing: { ...state.resourceSharing, ...settings },
        })),
      setStoragePaths: (paths) =>
        set((state) => ({
          storagePaths: { ...state.storagePaths, ...paths },
        })),
      setCacheSettings: (settings) =>
        set((state) => ({
          cacheSettings: { ...state.cacheSettings, ...settings },
        })),
      setUpdateSettings: (settings) =>
        set((state) => ({
          updateSettings: { ...state.updateSettings, ...settings },
        })),
      setCliRuntime: (settings) =>
        set((state) => ({
          cliRuntime: { ...state.cliRuntime, ...settings, enabled: isCliRuntimeBeta ? false : settings.enabled ?? state.cliRuntime.enabled },
        })),
      setMaxStudioLanes: (settings) =>
        set((state) => ({
          maxStudioLanes: {
            ...state.maxStudioLanes,
            ...settings,
            textApiBatchConcurrency: normalizeTextApiBatchConcurrency(
              settings.textApiBatchConcurrency ?? state.maxStudioLanes.textApiBatchConcurrency,
            ),
          },
        })),
      setScriptImport: (settings) =>
        set((state) => ({
          scriptImport: mergeScriptImportSettings({ ...state.scriptImport, ...settings }),
        })),
      setAutopilot: (settings) =>
        set((state) => ({
          autopilot: {
            ...state.autopilot,
            ...settings,
            longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(
              settings.longFormThresholdMinutes ?? state.autopilot.longFormThresholdMinutes,
            ),
            planningConcurrency: normalizeAutopilotPlanningConcurrency(
              settings.planningConcurrency ?? state.autopilot.planningConcurrency,
            ),
            kenBurnsEnabled: settings.kenBurnsEnabled ?? state.autopilot.kenBurnsEnabled,
            kenBurnsPercent: normalizeAutopilotKenBurnsPercent(
              settings.kenBurnsPercent ?? state.autopilot.kenBurnsPercent,
            ),
          },
        })),
      setMediaRouting: (settings) =>
        set((state) => ({
          mediaRouting: mergeMediaRoutingSettings({ ...state.mediaRouting, ...settings }),
        })),
      setHideLoginBrowser: (value) => set({ hideLoginBrowser: value }),
      setWatermarkRemovalEnabled: (value) => set({ watermarkRemovalEnabled: value }),
    }),
    {
      name: "longdd-app-settings",
      storage: createJSONStorage(() => fileStorage),
      version: 10,
      migrate: (persisted: unknown, version) => {
        const typedPersisted = (persisted && typeof persisted === 'object')
          ? persisted as Partial<VideoStudioSettingsState> & { googleFlowLanes?: Partial<MaxStudioLaneSettings> }
          : undefined;

        // v<=8 stored Google Flow lanes separately (googleFlowLanes). They are now
        // one config (maxStudioLanes): adopt the customized googleFlowLanes when
        // maxStudioLanes was never customized.
        const persistedLanes = mergeMaxStudioLaneSettings((typedPersisted as any)?.maxStudioLanes);
        const persistedFlowLanes = mergeMaxStudioLaneSettings(typedPersisted?.googleFlowLanes);
        const lanesWereCustomized = JSON.stringify(persistedLanes) !== JSON.stringify(defaultMaxStudioLaneSettings);
        const flowLanesWereCustomized = JSON.stringify(persistedFlowLanes) !== JSON.stringify(defaultMaxStudioLaneSettings);
        const adoptedLanes = !lanesWereCustomized && flowLanesWereCustomized ? persistedFlowLanes : persistedLanes;

        const next = {
          ...defaultState,
          resourceSharing: {
            ...defaultState.resourceSharing,
            ...(typedPersisted?.resourceSharing || {}),
          },
          storagePaths: {
            ...defaultState.storagePaths,
            ...(typedPersisted?.storagePaths || {}),
          },
          cacheSettings: {
            ...defaultState.cacheSettings,
            ...(typedPersisted?.cacheSettings || {}),
          },
          updateSettings: {
            ...defaultState.updateSettings,
            ...(typedPersisted?.updateSettings || {}),
          },
          cliRuntime: {
            ...defaultState.cliRuntime,
            ...(typedPersisted?.cliRuntime || {}),
            enabled: isCliRuntimeBeta ? false : typedPersisted?.cliRuntime?.enabled ?? defaultState.cliRuntime.enabled,
          },
          maxStudioLanes: version < 3
            ? { ...defaultMaxStudioLaneSettings }
            : mergeMaxStudioLaneSettings({
                ...adoptedLanes,
                textApiBatchConcurrency: normalizeTextApiBatchConcurrency(adoptedLanes.textApiBatchConcurrency),
              }),
          scriptImport: mergeScriptImportSettings((typedPersisted as any)?.scriptImport),
          autopilot: {
            longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(
              (typedPersisted as any)?.autopilot?.longFormThresholdMinutes,
            ),
            planningConcurrency: normalizeAutopilotPlanningConcurrency(
              (typedPersisted as any)?.autopilot?.planningConcurrency,
            ),
            kenBurnsEnabled: (typedPersisted as any)?.autopilot?.kenBurnsEnabled ?? defaultState.autopilot.kenBurnsEnabled,
            kenBurnsPercent: normalizeAutopilotKenBurnsPercent(
              (typedPersisted as any)?.autopilot?.kenBurnsPercent,
            ),
          },
          mediaRouting: mergeMediaRoutingSettings((typedPersisted as any)?.mediaRouting),
          hideLoginBrowser: typedPersisted?.hideLoginBrowser ?? defaultState.hideLoginBrowser,
          watermarkRemovalEnabled: typedPersisted?.watermarkRemovalEnabled ?? defaultState.watermarkRemovalEnabled,
        };

        if (version < 2) {
          next.resourceSharing = { ...defaultState.resourceSharing };
        }

        return next;
      },
    }
  )
);
