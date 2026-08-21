import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { fileStorage } from '@/shared/lib/indexed-db-storage';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import type {
  CsvRow,
  MappedSegment,
  RenderSettings,
  SrtSegment,
  AutoVideoMediaMode,
  AutoVideoMediaEffect,
  AutoVideoTransition,
} from '@/features/video-studio/lib/auto-video/types';
import { AUTO_VIDEO_MEDIA_EFFECTS, AUTO_VIDEO_TRANSITIONS, DEFAULT_RENDER_SETTINGS } from '@/features/video-studio/lib/auto-video/types';
import type { WhisperProvider } from '@/features/video-studio/lib/auto-video/whisper-api';
import { parseSrt } from '@/features/video-studio/lib/auto-video/srt-parser';
import { parseCsv } from '@/features/video-studio/lib/auto-video/csv-parser';
import { fuzzyMatch } from '@/features/video-studio/lib/auto-video/fuzzy-match';
import { shotsToVoiceRows, type ShotForVoiceExtract } from '@/features/video-studio/lib/auto-video/voice-extract';

export type AutoVideoStage = 'import' | 'editor' | 'render';
export type SrtSourceMode = 'api' | 'import';

export interface TranscribeProgress {
  stage: 'idle' | 'probing' | 'chunking' | 'uploading' | 'merging' | 'done' | 'error';
  message: string;
  percent: number;
}

export interface RenderProgress {
  stage: 'idle' | 'segments' | 'concat' | 'done' | 'error';
  percent: number;
  message: string;
}

interface AutoVideoState {
  stage: AutoVideoStage;

  // Audio
  audioFilePath: string | null;
  audioFileName: string | null;
  audioFileSize: number | null;
  audioDurationSec: number | null;

  // SRT source
  srtSourceMode: SrtSourceMode;
  whisperProvider: WhisperProvider;
  whisperApiKeys: Record<WhisperProvider, string>; // persisted
  whisperLanguage: string; // empty = auto

  // SRT data
  srtRaw: string;
  srtSegments: SrtSegment[];

  // CSV data
  csvRaw: string;
  csvRows: CsvRow[];
  csvFileName: string | null;

  // Mapped (after fuzzy match)
  mediaMode: AutoVideoMediaMode;
  mappedSegments: MappedSegment[];

  // Transcribe job
  transcribeJobId: string | null;
  transcribeProgress: TranscribeProgress;
  transcribeError: string | null;

  // Render settings (persisted)
  renderSettings: RenderSettings;

  // Render job
  renderJobId: string | null;
  renderProgress: RenderProgress;
  renderError: string | null;
  renderLog: string;
  outputVideoPath: string | null;
}

interface AutoVideoActions {
  setStage: (stage: AutoVideoStage) => void;
  setAudio: (info: {
    path: string;
    name: string;
    size: number;
    durationSec: number | null;
  }) => void;
  clearAudio: () => void;
  setWhisperProvider: (provider: WhisperProvider) => void;
  setWhisperApiKey: (provider: WhisperProvider, key: string) => void;
  setWhisperLanguage: (lang: string) => void;
  setSrtSourceMode: (mode: SrtSourceMode) => void;
  setMediaMode: (mode: AutoVideoMediaMode) => void;

  loadSrtRaw: (raw: string) => { ok: boolean; segmentCount: number; error?: string };
  loadCsvRaw: (raw: string, fileName?: string) => { ok: boolean; rowCount: number; error?: string };
  clearCsv: () => void;
  // Bulk-apply edits to CSV rows (matched by index field). Recomputes mapping.
  updateCsvRows: (edits: Array<{ index: number; voice?: string; imagePath?: string; videoPath?: string }>) => void;

  setTranscribeJobId: (jobId: string | null) => void;
  updateTranscribeProgress: (next: Partial<TranscribeProgress>) => void;
  setTranscribeError: (err: string | null) => void;

  setImageForSegment: (segmentIndex: number, imagePath: string) => void;
  setVideoForSegment: (segmentIndex: number, videoPath: string) => void;
  clearImageForSegment: (segmentIndex: number) => void;
  clearVideoForSegment: (segmentIndex: number) => void;
  autoFillImagesFromFolder: (paths: string[]) => number;
  setMediaEffectForSegment: (segmentIndex: number, effect: AutoVideoMediaEffect) => void;
  setTransitionForSegment: (segmentIndex: number, transition: AutoVideoTransition) => void;
  applyMediaEffectToAll: (effect: AutoVideoMediaEffect) => void;
  applyTransitionToAll: (transition: AutoVideoTransition) => void;
  randomizeMediaEffects: (count: number, effect?: AutoVideoMediaEffect) => number;
  randomizeTransitions: (count: number, transition?: AutoVideoTransition) => number;
  clearMediaEffects: () => void;
  clearTransitions: () => void;
  setSfxForSegment: (segmentIndex: number, sfxPath: string) => void;
  clearSfxForSegment: (segmentIndex: number) => void;
  clearAllSfx: () => void;
  randomizeSfx: (count: number, sfxPaths: string[]) => number;

  setRenderSettings: (next: Partial<RenderSettings>) => void;
  setRenderJobId: (jobId: string | null) => void;
  updateRenderProgress: (next: Partial<RenderProgress>) => void;
  setRenderError: (err: string | null) => void;
  appendRenderLog: (line: string) => void;
  setOutputVideoPath: (path: string | null) => void;

  resetAll: () => void;
  recomputeMapping: () => void;

  // HANDOFF_HOOK: Script tab will call this to seed the Auto Video flow.
  // Pass already-resolved audio path + optional SRT/CSV. Tab switches via setActiveTab in caller.
  receiveFromScript: (payload: {
    audioPath: string;
    audioName: string;
    audioSize: number;
    audioDurationSec?: number;
    srtRaw?: string;
    csvRaw?: string;
  }) => void;

  // HANDOFF_HOOK: Script tab "Send to Auto Video" button.
  // Builds CSV rows from shots by reading voiceOver.
  // Returns {matched, skipped} so the caller can toast the result.
  seedFromShots: (shots: ShotForVoiceExtract[]) => { matched: number; skipped: number };
}

type AutoVideoStore = AutoVideoState & AutoVideoActions;

const defaultState: AutoVideoState = {
  stage: 'import',
  audioFilePath: null,
  audioFileName: null,
  audioFileSize: null,
  audioDurationSec: null,
  srtSourceMode: 'api',
  whisperProvider: 'groq',
  whisperApiKeys: { openai: '', groq: '' },
  whisperLanguage: '',
  srtRaw: '',
  srtSegments: [],
  csvRaw: '',
  csvRows: [],
  csvFileName: null,
  mediaMode: 'image',
  mappedSegments: [],
  transcribeJobId: null,
  transcribeProgress: { stage: 'idle', message: '', percent: 0 },
  transcribeError: null,
  renderSettings: DEFAULT_RENDER_SETTINGS,
  renderJobId: null,
  renderProgress: { stage: 'idle', percent: 0, message: '' },
  renderError: null,
  renderLog: '',
  outputVideoPath: null,
};

// Field groups used by the split storage adapter below.
// Config fields persist globally; project fields persist per-project.
const CONFIG_FIELDS = [
  'whisperProvider',
  'whisperApiKeys',
  'whisperLanguage',
  'srtSourceMode',
  'mediaMode',
  'renderSettings',
] as const;

const PROJECT_FIELDS = [
  'stage',
  'audioFilePath',
  'audioFileName',
  'audioFileSize',
  'audioDurationSec',
  'srtRaw',
  'srtSegments',
  'csvRaw',
  'csvRows',
  'csvFileName',
  'mappedSegments',
  'outputVideoPath',
] as const;

function pickFields<K extends readonly string[]>(state: any, keys: K): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!state || typeof state !== 'object') return out;
  for (const k of keys) {
    if (k in state) out[k] = state[k];
  }
  return out;
}

/**
 * Hybrid storage adapter for auto-video-store:
 *  - Config fields → `longdd-auto-video-config` (shared across projects, e.g. API keys, render preferences).
 *  - Workflow fields → `_p/{activeProjectId}/auto-video` so audio/SRT/CSV/segments do NOT leak between projects.
 *  - First read after upgrade migrates the legacy monolithic file `longdd-auto-video` into the active project.
 */
function createAutoVideoSplitStorage(): StateStorage {
  const CONFIG_KEY = 'longdd-auto-video-config';
  const projectKey = (pid: string) => `_p/${pid}/auto-video`;

  const ensureProjectHydrated = async () => {
    if (!useProjectStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useProjectStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }
  };

  return {
    getItem: async (legacyKey: string): Promise<string | null> => {
      await ensureProjectHydrated();
      const pid = useProjectStore.getState().activeProjectId;

      const [configRaw, projectRaw] = await Promise.all([
        fileStorage.getItem(CONFIG_KEY),
        pid ? fileStorage.getItem(projectKey(pid)) : Promise.resolve(null),
      ]);

      let config: Record<string, unknown> = {};
      let project: Record<string, unknown> = {};
      let version = 0;

      if (configRaw) {
        try {
          const parsed = JSON.parse(configRaw);
          config = parsed?.state ?? parsed ?? {};
          if (typeof parsed?.version === 'number') version = parsed.version;
        } catch {
          // ignore malformed config
        }
      }

      if (projectRaw) {
        try {
          const parsed = JSON.parse(projectRaw);
          project = parsed?.state ?? parsed ?? {};
          if (typeof parsed?.version === 'number') version = parsed.version;
        } catch {
          // ignore malformed project file
        }
      }

      if (!configRaw && !projectRaw) {
        const legacyRaw = await fileStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const parsed = JSON.parse(legacyRaw);
            const legacyState = parsed?.state ?? parsed ?? {};
            config = pickFields(legacyState, CONFIG_FIELDS);
            project = pickFields(legacyState, PROJECT_FIELDS);
            if (typeof parsed?.version === 'number') version = parsed.version;
            console.log('[AutoVideoStorage] Migrated legacy auto-video state into split layout');
          } catch (err) {
            console.warn('[AutoVideoStorage] Failed to parse legacy auto-video file:', err);
          }
        }
      }

      const merged = { ...project, ...config };
      return JSON.stringify({ state: merged, version });
    },

    setItem: async (_legacyKey: string, value: string): Promise<void> => {
      let state: Record<string, unknown> = {};
      let version = 0;
      try {
        const parsed = JSON.parse(value);
        state = parsed?.state ?? parsed ?? {};
        version = typeof parsed?.version === 'number' ? parsed.version : 0;
      } catch {
        console.warn('[AutoVideoStorage] Skipping write: payload is not valid JSON');
        return;
      }

      const config = pickFields(state, CONFIG_FIELDS);
      const projectData = pickFields(state, PROJECT_FIELDS);
      const pid = useProjectStore.getState().activeProjectId;

      const writes: Array<unknown | Promise<unknown>> = [
        fileStorage.setItem(CONFIG_KEY, JSON.stringify({ state: config, version })),
      ];
      if (pid) {
        writes.push(
          fileStorage.setItem(projectKey(pid), JSON.stringify({ state: projectData, version })),
        );
      }
      await Promise.all(writes);
    },

    removeItem: async (_legacyKey: string): Promise<void> => {
      const pid = useProjectStore.getState().activeProjectId;
      const ops: Array<unknown | Promise<unknown>> = [fileStorage.removeItem(CONFIG_KEY)];
      if (pid) ops.push(fileStorage.removeItem(projectKey(pid)));
      await Promise.all(ops);
    },
  };
}

export const useAutoVideoStore = create<AutoVideoStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setStage: (stage) => set({ stage }),

      setAudio: (info) => set({
        audioFilePath: info.path,
        audioFileName: info.name,
        audioFileSize: info.size,
        audioDurationSec: info.durationSec,
        // Reset downstream state when audio changes.
        srtRaw: '',
        srtSegments: [],
        mappedSegments: [],
        outputVideoPath: null,
        transcribeError: null,
      }),

      clearAudio: () => set({
        audioFilePath: null,
        audioFileName: null,
        audioFileSize: null,
        audioDurationSec: null,
      }),

      setWhisperProvider: (provider) => set({ whisperProvider: provider }),

      setWhisperApiKey: (provider, key) => set((state) => ({
        whisperApiKeys: { ...state.whisperApiKeys, [provider]: key },
      })),

      setWhisperLanguage: (lang) => set({ whisperLanguage: lang }),

      setSrtSourceMode: (mode) => set({ srtSourceMode: mode }),

      setMediaMode: (mode) => set({ mediaMode: mode }),

      loadSrtRaw: (raw) => {
        const result = parseSrt(raw);
        if (result.segments.length === 0) {
          return {
            ok: false,
            segmentCount: 0,
            error: result.errors[0]?.message || 'SRT parse failed: no segments',
          };
        }
        set({ srtRaw: raw, srtSegments: result.segments });
        get().recomputeMapping();
        return { ok: true, segmentCount: result.segments.length };
      },

      loadCsvRaw: (raw, fileName) => {
        const result = parseCsv(raw);
        if (result.rows.length === 0) {
          return {
            ok: false,
            rowCount: 0,
            error: result.errors[0]?.message || 'CSV parse failed: no rows',
          };
        }
        set({
          csvRaw: raw,
          csvRows: result.rows,
          csvFileName: fileName ?? null,
        });
        get().recomputeMapping();
        return { ok: true, rowCount: result.rows.length };
      },

      clearCsv: () => {
        set({ csvRaw: '', csvRows: [], csvFileName: null });
        get().recomputeMapping();
      },

      updateCsvRows: (edits) => {
        if (edits.length === 0) return;
        const editsByIndex = new Map(edits.map((e) => [e.index, e]));
        set((state) => ({
          csvRows: state.csvRows.map((row) => {
            const e = editsByIndex.get(row.index);
            if (!e) return row;
            const nextVoice = e.voice ?? row.voice;
            return {
              ...row,
              voice: nextVoice,
              // text mirrors voice when handed off from Script tab; keep them in sync
              // so fuzzy match against SRT picks up the edited content.
              text: nextVoice,
              imagePath: e.imagePath ?? row.imagePath,
              videoPath: e.videoPath ?? row.videoPath,
            };
          }),
        }));
        get().recomputeMapping();
      },

      setTranscribeJobId: (jobId) => set({ transcribeJobId: jobId }),

      updateTranscribeProgress: (next) => set((state) => ({
        transcribeProgress: { ...state.transcribeProgress, ...next },
      })),

      setTranscribeError: (err) => set({ transcribeError: err }),

      setImageForSegment: (segmentIndex, imagePath) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) =>
          seg.index === segmentIndex ? { ...seg, imagePath } : seg,
        ),
      })),

      setVideoForSegment: (segmentIndex, videoPath) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) =>
          seg.index === segmentIndex ? { ...seg, videoPath } : seg,
        ),
      })),

      clearImageForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) =>
          seg.index === segmentIndex ? { ...seg, imagePath: '' } : seg,
        ),
      })),

      clearVideoForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) =>
          seg.index === segmentIndex ? { ...seg, videoPath: '' } : seg,
        ),
      })),

      autoFillImagesFromFolder: (paths) => {
        const indexForPath = (filePath: string): number | null => {
          const name = filePath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? '';
          const sceneShot = name.match(/scene[_\s-]*(\d+).*shot[_\s-]*(\d+)/i);
          if (sceneShot) return Number(`${sceneShot[1]}${sceneShot[2].padStart(3, '0')}`);
          const shot = name.match(/(?:shot|index|idx)[_\s-]*(\d+)/i);
          if (shot) return Number(shot[1]);
          const numbers = name.match(/\d+/g);
          return numbers?.length ? Number(numbers[numbers.length - 1]) : null;
        };
        const byIndex = new Map<number, string>();
        for (const p of paths) {
          const idx = indexForPath(p);
          if (idx != null && !byIndex.has(idx)) byIndex.set(idx, p);
        }
        let used = 0;
        set((state) => ({
          mappedSegments: state.mappedSegments.map((seg) => {
            const indexedPath = byIndex.get(seg.index);
            if (state.mediaMode === 'video') {
              if (seg.videoPath) return seg;
              if (indexedPath) {
                used += 1;
                return { ...seg, videoPath: indexedPath };
              }
              if (used >= paths.length) return seg;
              const path = paths[used];
              used += 1;
              return { ...seg, videoPath: path };
            }
            if (seg.imagePath) return seg;
            if (indexedPath) {
              used += 1;
              return { ...seg, imagePath: indexedPath };
            }
            if (used >= paths.length) return seg;
            const path = paths[used];
            used += 1;
            return { ...seg, imagePath: path };
          }),
        }));
        return used;
      },

      setMediaEffectForSegment: (segmentIndex, effect) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, mediaEffect: effect } : seg),
      })),

      setTransitionForSegment: (segmentIndex, transition) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, transitionToNext: transition } : seg),
      })),

      applyMediaEffectToAll: (effect) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, mediaEffect: effect })),
      })),

      applyTransitionToAll: (transition) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg, idx) => ({
          ...seg,
          transitionToNext: idx === state.mappedSegments.length - 1 ? 'none' : transition,
        })),
      })),

      randomizeMediaEffects: (count, effect) => {
        const effects = AUTO_VIDEO_MEDIA_EFFECTS.filter((effect) => effect !== 'none');
        let applied = 0;
        set((state) => {
          const candidates = state.mappedSegments
            .map((seg, idx) => ({ seg, idx }))
            .filter(({ seg }) => !seg.mediaEffect || seg.mediaEffect === 'none');
          const chosen = new Set<number>();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              mediaEffect: chosen.has(idx) ? (effect && effect !== 'none' ? effect : effects[idx % effects.length]) : (seg.mediaEffect ?? 'none'),
            })),
          };
        });
        return applied;
      },

      randomizeTransitions: (count, transition) => {
        const transitions = AUTO_VIDEO_TRANSITIONS.filter((transition) => transition !== 'none');
        let applied = 0;
        set((state) => {
          const max = Math.max(0, state.mappedSegments.length - 1);
          const candidates = state.mappedSegments
            .slice(0, max)
            .map((seg, idx) => ({ seg, idx }))
            .filter(({ seg }) => !seg.transitionToNext || seg.transitionToNext === 'none');
          const chosen = new Set<number>();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              transitionToNext: chosen.has(idx) ? (transition && transition !== 'none' ? transition : transitions[idx % transitions.length]) : (idx === state.mappedSegments.length - 1 ? 'none' : (seg.transitionToNext ?? 'none')),
            })),
          };
        });
        return applied;
      },

      clearMediaEffects: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, mediaEffect: 'none' })),
      })),

      clearTransitions: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, transitionToNext: 'none' })),
      })),

      setSfxForSegment: (segmentIndex, sfxPath) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, sfxPath } : seg),
      })),

      clearSfxForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, sfxPath: '' } : seg),
      })),

      clearAllSfx: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, sfxPath: '' })),
      })),

      randomizeSfx: (count, sfxPaths) => {
        const usable = sfxPaths.filter(Boolean);
        if (usable.length === 0) return 0;
        let applied = 0;
        set((state) => {
          const candidates = state.mappedSegments
            .map((seg, idx) => ({ seg, idx }))
            .filter(({ seg }) => !seg.sfxPath);
          const chosen = new Set<number>();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              sfxPath: chosen.has(idx) ? usable[Math.floor(Math.random() * usable.length)] : (seg.sfxPath ?? ''),
            })),
          };
        });
        return applied;
      },

      setRenderSettings: (next) => set((state) => ({
        renderSettings: { ...state.renderSettings, ...next },
      })),

      setRenderJobId: (jobId) => set({ renderJobId: jobId }),

      updateRenderProgress: (next) => set((state) => ({
        renderProgress: { ...state.renderProgress, ...next },
      })),

      setRenderError: (err) => set({ renderError: err }),

      appendRenderLog: (line) => set((state) => {
        const next = state.renderLog ? state.renderLog + '\n' + line : line;
        // Cap at ~64KB to avoid runaway memory.
        const trimmed = next.length > 64 * 1024 ? next.slice(-64 * 1024) : next;
        return { renderLog: trimmed };
      }),

      setOutputVideoPath: (path) => set({ outputVideoPath: path }),

      resetAll: () => set({
        ...defaultState,
        whisperApiKeys: get().whisperApiKeys,
        whisperProvider: get().whisperProvider,
        renderSettings: get().renderSettings,
      }),

      recomputeMapping: () => {
        const { srtSegments, csvRows } = get();
        const previous = new Map(get().mappedSegments.map((seg) => [seg.index, seg]));
        const mapped = fuzzyMatch(srtSegments, csvRows).map((seg) => ({
          ...seg,
          mediaEffect: previous.get(seg.index)?.mediaEffect ?? 'none',
          transitionToNext: previous.get(seg.index)?.transitionToNext ?? 'none',
          sfxPath: previous.get(seg.index)?.sfxPath ?? '',
        }));
        set({ mappedSegments: mapped });
      },

      receiveFromScript: (payload) => {
        // HANDOFF_HOOK: Script tab will call this with prepared inputs.
        set({
          stage: 'import',
          audioFilePath: payload.audioPath,
          audioFileName: payload.audioName,
          audioFileSize: payload.audioSize,
          audioDurationSec: payload.audioDurationSec ?? null,
        });
        if (payload.srtRaw) {
          get().loadSrtRaw(payload.srtRaw);
        }
        if (payload.csvRaw) {
          get().loadCsvRaw(payload.csvRaw, 'from-script.csv');
        }
      },

      seedFromShots: (shots) => {
        const result = shotsToVoiceRows(shots);
        set({
          stage: 'import',
          csvRaw: '',
        csvRows: result.rows,
        csvFileName: 'from-script.csv',
        });
        get().recomputeMapping();
        return { matched: result.matched, skipped: result.skipped };
      },
    }),
    {
      name: 'longdd-auto-video',
      storage: createJSONStorage(() => createAutoVideoSplitStorage()),
      version: 1,
      partialize: (state) => ({
        // User-config (routed to longdd-auto-video-config — shared across projects)
        whisperProvider: state.whisperProvider,
        whisperApiKeys: state.whisperApiKeys,
        whisperLanguage: state.whisperLanguage,
        srtSourceMode: state.srtSourceMode,
        mediaMode: state.mediaMode,
        renderSettings: state.renderSettings,
        // Workflow state (routed to _p/{projectId}/auto-video — per project).
        // Active job ids and progress are intentionally excluded (transient runtime only).
        stage: state.stage,
        audioFilePath: state.audioFilePath,
        audioFileName: state.audioFileName,
        audioFileSize: state.audioFileSize,
        audioDurationSec: state.audioDurationSec,
        srtRaw: state.srtRaw,
        srtSegments: state.srtSegments,
        csvRaw: state.csvRaw,
        csvRows: state.csvRows,
        csvFileName: state.csvFileName,
        mappedSegments: state.mappedSegments,
        outputVideoPath: state.outputVideoPath,
      }),
    },
  ),
);
