import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChannelScanConfig, ChannelSnapshot, ScanAudit, ScanScope, VideoScanMode, VideoSnapshot, VphPoint, YouTubeChannel, YouTubeVideo } from "../types";

const MAX_HISTORY_POINTS = 336;
export const DEFAULT_CORE_QUOTA = 10_000;
export const DEFAULT_SEARCH_QUOTA = 100;
export const DEFAULT_CHANNEL_SCAN_CONFIG: ChannelScanConfig = {
  intervalMinutes: 60,
  videoScanMode: "latest",
  videoKind: "all",
  videosPerChannel: 10,
  autoScan: true,
};

export type QuotaBucket = "core" | "search";
export interface KeyQuotaUsage {
  day: string;
  coreUsed: number;
  searchUsed: number;
  coreExhausted?: boolean;
  searchExhausted?: boolean;
}

export function currentQuotaDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

interface ResearchStore {
  apiKey: string;
  apiKeys: string[];
  activeApiKeyIndex: number;
  quotaUsage: Record<string, KeyQuotaUsage>;
  disabledApiKeys: string[];
  discoveryQuery: string;
  discoveryMaxDays: number;
  discoveryPublishedHourRange: number[];
  trackedChannels: string[];
  pinnedVideoIds: string[];
  excludedScanChannels: string[];
  excludedScanVideos: string[];
  scanIntervalMinutes: number;
  scanScope: ScanScope;
  videoScanMode: VideoScanMode;
  videosPerChannel: number;
  customScanVideoIdsByChannel: Record<string, string[]>;
  channelScanConfigs: Record<string, ChannelScanConfig>;
  autoScan: boolean;
  snapshots: Record<string, VideoSnapshot>;
  vphHistory: Record<string, VphPoint[]>;
  channelSnapshots: Record<string, ChannelSnapshot>;
  channelViewHistory: Record<string, VphPoint[]>;
  channelCache: YouTubeChannel[];
  lastScanAt: number | null;
  lastScanError: string;
  isScanning: boolean;
  databaseHydrated: boolean;
  scanAudits: ScanAudit[];
  setApiKey: (apiKey: string) => void;
  setApiKeys: (apiKeys: string[]) => void;
  setActiveApiKey: (apiKey: string) => void;
  recordQuotaUsage: (apiKey: string, bucket: QuotaBucket, cost?: number) => void;
  markQuotaExhausted: (apiKey: string, bucket: QuotaBucket) => void;
  markApiKeyInvalid: (apiKey: string) => void;
  resetQuotaEstimates: () => void;
  setDiscoveryQuery: (discoveryQuery: string) => void;
  setDiscoveryMaxDays: (days: number) => void;
  setDiscoveryPublishedHourRange: (hours: number[]) => void;
  setTrackedChannels: (trackedChannels: string[]) => void;
  setExcludedScanChannels: (channelInputs: string[]) => void;
  setExcludedScanVideos: (videoIds: string[]) => void;
  setScanIntervalMinutes: (minutes: number) => void;
  setScanScope: (scope: ScanScope) => void;
  setVideoScanMode: (mode: VideoScanMode) => void;
  setVideosPerChannel: (count: number) => void;
  setCustomScanVideoIds: (channelId: string, videoIds: string[]) => void;
  setChannelScanConfig: (channelId: string, config: Partial<ChannelScanConfig>) => void;
  setAutoScan: (enabled: boolean) => void;
  pinVideo: (video: YouTubeVideo) => void;
  unpinVideo: (videoId: string) => void;
  setScanning: (isScanning: boolean) => void;
  setChannelCache: (channels: YouTubeChannel[]) => void;
  recordScan: (videos: YouTubeVideo[], scannedAt: number) => void;
  recordChannelScan: (channels: YouTubeChannel[], scannedAt: number) => void;
  finishScan: (scannedAt: number, error?: string) => void;
  clearScanHistory: () => void;
  hydrateScanHistory: (payload: {
    snapshots: Record<string, VideoSnapshot>;
    vphHistory: Record<string, VphPoint[]>;
    channelSnapshots: Record<string, ChannelSnapshot>;
    channelViewHistory: Record<string, VphPoint[]>;
    scanAudits: ScanAudit[];
  }) => void;
}

export const useResearchStore = create<ResearchStore>()(
  persist(
    (set) => ({
      apiKey: "",
      apiKeys: [],
      activeApiKeyIndex: 0,
      quotaUsage: {},
      disabledApiKeys: [],
      discoveryQuery: "",
      discoveryMaxDays: 30,
      discoveryPublishedHourRange: [0, 30 * 24],
      trackedChannels: [],
      pinnedVideoIds: [],
      excludedScanChannels: [],
      excludedScanVideos: [],
      scanIntervalMinutes: 60,
      scanScope: "all",
      videoScanMode: "latest",
      videosPerChannel: 10,
      customScanVideoIdsByChannel: {},
      channelScanConfigs: {},
      autoScan: true,
      snapshots: {},
      vphHistory: {},
      channelSnapshots: {},
      channelViewHistory: {},
      channelCache: [],
      lastScanAt: null,
      lastScanError: "",
      isScanning: false,
      databaseHydrated: false,
      scanAudits: [],
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setApiKeys: (apiKeys) => set((state) => {
        const normalized = [...new Set(apiKeys.map((key) => key.trim()).filter(Boolean))];
        return { apiKeys: normalized, apiKey: normalized[0] || "", activeApiKeyIndex: 0, disabledApiKeys: state.disabledApiKeys.filter((key) => normalized.includes(key)) };
      }),
      setActiveApiKey: (apiKey) => set((state) => {
        const keys = state.apiKeys.length ? state.apiKeys : state.apiKey ? [state.apiKey] : [];
        const index = keys.indexOf(apiKey);
        return index >= 0 ? { activeApiKeyIndex: index, apiKey } : {};
      }),
      recordQuotaUsage: (apiKey, bucket, cost = 1) => set((state) => {
        const day = currentQuotaDay();
        const previous = state.quotaUsage[apiKey]?.day === day ? state.quotaUsage[apiKey] : { day, coreUsed: 0, searchUsed: 0 };
        return { quotaUsage: { ...state.quotaUsage, [apiKey]: { ...previous, [bucket === "search" ? "searchUsed" : "coreUsed"]: previous[bucket === "search" ? "searchUsed" : "coreUsed"] + cost } } };
      }),
      markQuotaExhausted: (apiKey, bucket) => set((state) => {
        const day = currentQuotaDay();
        const previous = state.quotaUsage[apiKey]?.day === day ? state.quotaUsage[apiKey] : { day, coreUsed: 0, searchUsed: 0 };
        return { quotaUsage: { ...state.quotaUsage, [apiKey]: { ...previous, [bucket === "search" ? "searchExhausted" : "coreExhausted"]: true } } };
      }),
      markApiKeyInvalid: (apiKey) => set((state) => ({ disabledApiKeys: state.disabledApiKeys.includes(apiKey) ? state.disabledApiKeys : [...state.disabledApiKeys, apiKey] })),
      resetQuotaEstimates: () => set({ quotaUsage: {}, disabledApiKeys: [] }),
      setDiscoveryQuery: (discoveryQuery) => set({ discoveryQuery }),
      setDiscoveryMaxDays: (discoveryMaxDays) => set({ discoveryMaxDays }),
      setDiscoveryPublishedHourRange: (discoveryPublishedHourRange) => set({ discoveryPublishedHourRange }),
      setTrackedChannels: (trackedChannels) => set({ trackedChannels }),
      setExcludedScanChannels: (excludedScanChannels) => set({ excludedScanChannels }),
      setExcludedScanVideos: (excludedScanVideos) => set({ excludedScanVideos }),
      setScanIntervalMinutes: (scanIntervalMinutes) => set({ scanIntervalMinutes }),
      setScanScope: (scanScope) => set({ scanScope }),
      setVideoScanMode: (videoScanMode) => set({ videoScanMode }),
      setVideosPerChannel: (videosPerChannel) => set({ videosPerChannel }),
      setCustomScanVideoIds: (channelId, videoIds) => set((state) => ({
        customScanVideoIdsByChannel: {
          ...state.customScanVideoIdsByChannel,
          [channelId]: [...new Set(videoIds)],
        },
      })),
      setChannelScanConfig: (channelId, config) => set((state) => ({
        channelScanConfigs: {
          ...state.channelScanConfigs,
          [channelId]: {
            ...DEFAULT_CHANNEL_SCAN_CONFIG,
            ...state.channelScanConfigs[channelId],
            ...config,
          },
        },
      })),
      setAutoScan: (autoScan) => set({ autoScan }),
      pinVideo: (video) => set((state) => {
        const now = Date.now();
        return {
          pinnedVideoIds: state.pinnedVideoIds.includes(video.id) ? state.pinnedVideoIds : [...state.pinnedVideoIds, video.id],
          snapshots: state.snapshots[video.id] ? state.snapshots : {
            ...state.snapshots,
            [video.id]: { videoId: video.id, channelId: video.channelId, title: video.title, thumbnailUrl: video.thumbnailUrl, viewCount: video.viewCount, scannedAt: now },
          },
        };
      }),
      unpinVideo: (videoId) => set((state) => ({ pinnedVideoIds: state.pinnedVideoIds.filter((id) => id !== videoId) })),
      setScanning: (isScanning) => set({ isScanning }),
      setChannelCache: (channelCache) => set({ channelCache }),
      recordScan: (videos, scannedAt) => set((state) => {
        const snapshots = { ...state.snapshots };
        const vphHistory = { ...state.vphHistory };
        for (const video of videos) {
          const capturedAt = video.capturedAt || scannedAt;
          const previous = snapshots[video.id];
          if (previous && capturedAt > previous.scannedAt) {
            const elapsedHours = (capturedAt - previous.scannedAt) / 3_600_000;
            const deltaViews = video.viewCount - previous.viewCount;
            const point: VphPoint = { previousScannedAt: previous.scannedAt, scannedAt: capturedAt, viewCount: video.viewCount, deltaViews, elapsedHours, vph: deltaViews / elapsedHours };
            vphHistory[video.id] = [...(vphHistory[video.id] || []), point].slice(-MAX_HISTORY_POINTS);
          }
          snapshots[video.id] = { videoId: video.id, channelId: video.channelId, title: video.title, thumbnailUrl: video.thumbnailUrl, viewCount: video.viewCount, scannedAt: capturedAt };
        }
        return { snapshots, vphHistory };
      }),
      recordChannelScan: (channels, scannedAt) => set((state) => {
        const channelSnapshots = { ...state.channelSnapshots };
        const channelViewHistory = { ...state.channelViewHistory };
        for (const channel of channels) {
          const capturedAt = channel.capturedAt || scannedAt;
          const previous = channelSnapshots[channel.id];
          if (previous && capturedAt > previous.scannedAt) {
            const elapsedHours = (capturedAt - previous.scannedAt) / 3_600_000;
            const deltaViews = channel.viewCount - previous.viewCount;
            const point: VphPoint = { previousScannedAt: previous.scannedAt, scannedAt: capturedAt, viewCount: channel.viewCount, deltaViews, elapsedHours, vph: deltaViews / elapsedHours };
            channelViewHistory[channel.id] = [...(channelViewHistory[channel.id] || []), point].slice(-MAX_HISTORY_POINTS);
          }
          channelSnapshots[channel.id] = { channelId: channel.id, viewCount: channel.viewCount, scannedAt: capturedAt };
        }
        return { channelSnapshots, channelViewHistory };
      }),
      finishScan: (lastScanAt, error = "") => set({ lastScanAt, lastScanError: error, isScanning: false }),
      clearScanHistory: () => {
        void window.researchDatabase?.clearHistory();
        set({ snapshots: {}, vphHistory: {}, channelSnapshots: {}, channelViewHistory: {}, scanAudits: [], lastScanAt: null, lastScanError: "" });
      },
      hydrateScanHistory: (payload) => set({ ...payload, databaseHydrated: true }),
    }),
    {
      name: "logdd-youtube-research",
      partialize: (state) => ({
        apiKey: state.apiKey,
        apiKeys: state.apiKeys,
        activeApiKeyIndex: state.activeApiKeyIndex,
        quotaUsage: state.quotaUsage,
        disabledApiKeys: state.disabledApiKeys,
        discoveryQuery: state.discoveryQuery,
        discoveryMaxDays: state.discoveryMaxDays,
        discoveryPublishedHourRange: state.discoveryPublishedHourRange,
        trackedChannels: state.trackedChannels,
        pinnedVideoIds: state.pinnedVideoIds,
        excludedScanChannels: state.excludedScanChannels,
        excludedScanVideos: state.excludedScanVideos,
        scanIntervalMinutes: state.scanIntervalMinutes,
        scanScope: state.scanScope,
        videoScanMode: state.videoScanMode,
        videosPerChannel: state.videosPerChannel,
        customScanVideoIdsByChannel: state.customScanVideoIdsByChannel,
        channelScanConfigs: state.channelScanConfigs,
        autoScan: state.autoScan,
        channelCache: state.channelCache,
        lastScanAt: state.lastScanAt,
        lastScanError: state.lastScanError,
      }),
    },
  ),
);

export function latestMeasuredVph(videoId: string) {
  const history = useResearchStore.getState().vphHistory[videoId];
  return history?.[history.length - 1]?.vph ?? null;
}

export function measuredViewsInWindow(videoId: string, windowHours = 48, now = Date.now()) {
  const history = useResearchStore.getState().vphHistory[videoId];
  return sumMeasuredViews(history, windowHours, now);
}

export function measuredChannelViewsInWindow(channelId: string, windowHours = 48, now = Date.now()) {
  const history = useResearchStore.getState().channelViewHistory[channelId];
  return sumMeasuredViews(history, windowHours, now);
}

export function measuredCoverageInWindow(history: VphPoint[] | undefined, windowHours = 48, now = Date.now()) {
  if (!history?.length) return 0;
  const cutoff = now - windowHours * 3_600_000;
  const coveredMs = history.reduce((total, point) => {
    const intervalStart = point.previousScannedAt ?? point.scannedAt - point.elapsedHours * 3_600_000;
    if (intervalStart < cutoff || point.scannedAt > now || point.scannedAt <= intervalStart) return total;
    return total + point.scannedAt - intervalStart;
  }, 0);
  return Math.min(1, coveredMs / (windowHours * 3_600_000));
}

function sumMeasuredViews(history: VphPoint[] | undefined, windowHours: number, now: number) {
  if (!history?.length) return null;

  const cutoff = now - windowHours * 3_600_000;
  return history.reduce((total, point) => {
    const intervalStart = point.previousScannedAt ?? point.scannedAt - point.elapsedHours * 3_600_000;
    if (intervalStart < cutoff || point.scannedAt > now || point.scannedAt <= intervalStart) return total;
    return total + point.deltaViews;
  }, 0);
}

export function configuredApiKeys() {
  const state = useResearchStore.getState();
  return state.apiKeys.length ? state.apiKeys : state.apiKey ? [state.apiKey] : [];
}

export function availableApiKeys(bucket: QuotaBucket) {
  const state = useResearchStore.getState();
  const keys = configuredApiKeys();
  const ordered = keys.map((_, offset) => keys[(state.activeApiKeyIndex + offset) % keys.length]);
  const day = currentQuotaDay();
  return ordered.filter((key) => {
    if (state.disabledApiKeys.includes(key)) return false;
    const usage = state.quotaUsage[key];
    if (!usage || usage.day !== day) return true;
    // Never stop at the default allocation: projects may have approved custom quota.
    // Rotate only after YouTube explicitly reports that this bucket is exhausted.
    return bucket === "search" ? !usage.searchExhausted : !usage.coreExhausted;
  });
}

export function quotaForKey(apiKey: string) {
  const usage = useResearchStore.getState().quotaUsage[apiKey];
  const current = usage?.day === currentQuotaDay() ? usage : { coreUsed: 0, searchUsed: 0, coreExhausted: false, searchExhausted: false };
  return {
    coreUsed: current.coreUsed,
    searchUsed: current.searchUsed,
    coreRemaining: current.coreExhausted ? 0 : Math.max(0, DEFAULT_CORE_QUOTA - current.coreUsed),
    searchRemaining: current.searchExhausted ? 0 : Math.max(0, DEFAULT_SEARCH_QUOTA - current.searchUsed),
  };
}

export function maskYouTubeKey(apiKey: string) {
  if (apiKey.length < 12) return "••••••••";
  return `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`;
}
