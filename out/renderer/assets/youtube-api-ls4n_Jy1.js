import { c as corsFetch } from "./cors-fetch-CkwbEcad.js";
import { p as persist, A as translate, C as useUIPreferencesStore } from "./index-B8Pnvlyd.js";
import { c as create } from "./zustand-DqfYAuvg.js";
const DEFAULT_CORE_QUOTA = 1e4;
const DEFAULT_SEARCH_QUOTA = 100;
const DEFAULT_CHANNEL_SCAN_CONFIG = {
  intervalMinutes: 60,
  videoScanMode: "latest",
  videoKind: "all",
  videosPerChannel: 10,
  autoScan: true
};
function currentQuotaDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
}
const useResearchStore = create()(
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
          [channelId]: [...new Set(videoIds)]
        }
      })),
      setChannelScanConfig: (channelId, config) => set((state) => ({
        channelScanConfigs: {
          ...state.channelScanConfigs,
          [channelId]: {
            ...DEFAULT_CHANNEL_SCAN_CONFIG,
            ...state.channelScanConfigs[channelId],
            ...config
          }
        }
      })),
      setAutoScan: (autoScan) => set({ autoScan }),
      pinVideo: (video) => set((state) => {
        const now = Date.now();
        return {
          pinnedVideoIds: state.pinnedVideoIds.includes(video.id) ? state.pinnedVideoIds : [...state.pinnedVideoIds, video.id],
          snapshots: state.snapshots[video.id] ? state.snapshots : {
            ...state.snapshots,
            [video.id]: { videoId: video.id, channelId: video.channelId, title: video.title, thumbnailUrl: video.thumbnailUrl, viewCount: video.viewCount, scannedAt: now }
          }
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
            const elapsedHours = (capturedAt - previous.scannedAt) / 36e5;
            const deltaViews = video.viewCount - previous.viewCount;
            const point = { previousScannedAt: previous.scannedAt, scannedAt: capturedAt, viewCount: video.viewCount, deltaViews, elapsedHours, vph: deltaViews / elapsedHours };
            vphHistory[video.id] = [...vphHistory[video.id] || [], point].slice(-336);
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
            const elapsedHours = (capturedAt - previous.scannedAt) / 36e5;
            const deltaViews = channel.viewCount - previous.viewCount;
            const point = { previousScannedAt: previous.scannedAt, scannedAt: capturedAt, viewCount: channel.viewCount, deltaViews, elapsedHours, vph: deltaViews / elapsedHours };
            channelViewHistory[channel.id] = [...channelViewHistory[channel.id] || [], point].slice(-336);
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
      hydrateScanHistory: (payload) => set({ ...payload, databaseHydrated: true })
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
        lastScanError: state.lastScanError
      })
    }
  )
);
function latestMeasuredVph(videoId) {
  const history = useResearchStore.getState().vphHistory[videoId];
  return history?.[history.length - 1]?.vph ?? null;
}
function measuredViewsInWindow(videoId, windowHours = 48, now = Date.now()) {
  const history = useResearchStore.getState().vphHistory[videoId];
  return sumMeasuredViews(history, windowHours, now);
}
function measuredChannelViewsInWindow(channelId, windowHours = 48, now = Date.now()) {
  const history = useResearchStore.getState().channelViewHistory[channelId];
  return sumMeasuredViews(history, windowHours, now);
}
function measuredCoverageInWindow(history, windowHours = 48, now = Date.now()) {
  if (!history?.length) return 0;
  const cutoff = now - windowHours * 36e5;
  const coveredMs = history.reduce((total, point) => {
    const intervalStart = point.previousScannedAt ?? point.scannedAt - point.elapsedHours * 36e5;
    if (intervalStart < cutoff || point.scannedAt > now || point.scannedAt <= intervalStart) return total;
    return total + point.scannedAt - intervalStart;
  }, 0);
  return Math.min(1, coveredMs / (windowHours * 36e5));
}
function sumMeasuredViews(history, windowHours, now) {
  if (!history?.length) return null;
  const cutoff = now - windowHours * 36e5;
  return history.reduce((total, point) => {
    const intervalStart = point.previousScannedAt ?? point.scannedAt - point.elapsedHours * 36e5;
    if (intervalStart < cutoff || point.scannedAt > now || point.scannedAt <= intervalStart) return total;
    return total + point.deltaViews;
  }, 0);
}
function configuredApiKeys() {
  const state = useResearchStore.getState();
  return state.apiKeys.length ? state.apiKeys : state.apiKey ? [state.apiKey] : [];
}
function availableApiKeys(bucket) {
  const state = useResearchStore.getState();
  const keys = configuredApiKeys();
  const ordered = keys.map((_, offset) => keys[(state.activeApiKeyIndex + offset) % keys.length]);
  const day = currentQuotaDay();
  return ordered.filter((key) => {
    if (state.disabledApiKeys.includes(key)) return false;
    const usage = state.quotaUsage[key];
    if (!usage || usage.day !== day) return true;
    return bucket === "search" ? !usage.searchExhausted : !usage.coreExhausted;
  });
}
function quotaForKey(apiKey) {
  const usage = useResearchStore.getState().quotaUsage[apiKey];
  const current = usage?.day === currentQuotaDay() ? usage : { coreUsed: 0, searchUsed: 0, coreExhausted: false, searchExhausted: false };
  return {
    coreUsed: current.coreUsed,
    searchUsed: current.searchUsed,
    coreRemaining: current.coreExhausted ? 0 : Math.max(0, DEFAULT_CORE_QUOTA - current.coreUsed),
    searchRemaining: current.searchExhausted ? 0 : Math.max(0, DEFAULT_SEARCH_QUOTA - current.searchUsed)
  };
}
function maskYouTubeKey(apiKey) {
  if (apiKey.length < 12) return "••••••••";
  return `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`;
}
const API_ROOT = "https://www.googleapis.com/youtube/v3";
const rt = (key, params) => translate(useUIPreferencesStore.getState().uiLanguage, key, params);
function numberValue(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
async function apiGet(path, apiKey, params) {
  const bucket = path === "search" ? "search" : "core";
  const configured = configuredApiKeys();
  const candidates = configured.length ? availableApiKeys(bucket) : apiKey ? [apiKey] : [];
  if (!candidates.length) throw new Error(rt(bucket === "search" ? "research.api.searchQuota" : "research.api.readQuota"));
  let lastMessage = rt("research.api.failed");
  for (const candidate of candidates) {
    const url = new URL(`${API_ROOT}/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set("key", candidate);
    useResearchStore.getState().recordQuotaUsage(candidate, bucket, 1);
    const response = await corsFetch(url);
    if (response.ok) {
      useResearchStore.getState().setActiveApiKey(candidate);
      return response.json();
    }
    const body = await response.json().catch(() => ({}));
    const reason = body.error?.errors?.[0]?.reason || "";
    lastMessage = body.error?.message || rt("research.api.httpError", { status: response.status });
    if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"].includes(reason)) {
      useResearchStore.getState().markQuotaExhausted(candidate, bucket);
      continue;
    }
    if (["keyInvalid", "accessNotConfigured", "ipRefererBlocked"].includes(reason)) {
      useResearchStore.getState().markApiKeyInvalid(candidate);
      continue;
    }
    throw new Error(lastMessage);
  }
  throw new Error(lastMessage);
}
async function validateKeyDirectly(apiKey) {
  const url = new URL(`${API_ROOT}/videos`);
  url.searchParams.set("part", "id");
  url.searchParams.set("id", "dQw4w9WgXcQ");
  url.searchParams.set("key", apiKey);
  useResearchStore.getState().recordQuotaUsage(apiKey, "core", 1);
  const response = await corsFetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || rt("research.api.invalidKey"));
  }
}
function bestThumbnail(thumbnails) {
  return thumbnails?.maxres?.url || thumbnails?.standard?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || "";
}
function toVideo(resource, channel) {
  const views = numberValue(resource.statistics?.viewCount);
  const channelViews = numberValue(channel?.statistics?.viewCount);
  const channelVideos = Math.max(1, numberValue(channel?.statistics?.videoCount));
  const channelAverageViews = channelViews / channelVideos;
  const durationParts = resource.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const durationSeconds = Number(durationParts?.[1] || 0) * 3600 + Number(durationParts?.[2] || 0) * 60 + Number(durationParts?.[3] || 0);
  const kind = resource.snippet.liveBroadcastContent && resource.snippet.liveBroadcastContent !== "none" ? "Live" : durationSeconds > 0 && durationSeconds <= 60 ? "Shorts" : "Long";
  return {
    id: resource.id,
    title: resource.snippet.title,
    channelId: resource.snippet.channelId,
    channelTitle: resource.snippet.channelTitle,
    publishedAt: resource.snippet.publishedAt,
    thumbnailUrl: bestThumbnail(resource.snippet.thumbnails),
    duration: resource.contentDetails?.duration || "PT0S",
    viewCount: views,
    likeCount: numberValue(resource.statistics?.likeCount),
    commentCount: numberValue(resource.statistics?.commentCount),
    subscriberCount: channel?.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel?.statistics?.subscriberCount),
    channelAverageViews,
    outlier: channelAverageViews > 0 ? views / channelAverageViews : 0,
    viewsPerHour: 0,
    description: resource.snippet.description || "",
    tags: resource.snippet.tags || [],
    kind,
    capturedAt: resource._capturedAt
  };
}
async function getVideosByIds(ids, apiKey) {
  if (!ids.length) return [];
  const data = await apiGet("videos", apiKey, { part: "snippet,statistics,contentDetails", id: ids.slice(0, 50).join(",") });
  const capturedAt = Date.now();
  return (data.items ?? []).map((item) => ({ ...item, _capturedAt: capturedAt }));
}
async function getChannelsByIds(ids, apiKey) {
  if (!ids.length) return [];
  const uniqueIds = [...new Set(ids)].slice(0, 50);
  const data = await apiGet("channels", apiKey, { part: "snippet,statistics,contentDetails", id: uniqueIds.join(",") });
  const capturedAt = Date.now();
  return (data.items ?? []).map((item) => ({ ...item, _capturedAt: capturedAt }));
}
async function getAllChannelsByIds(ids, apiKey) {
  const uniqueIds = [...new Set(ids)];
  const resources = [];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    resources.push(...await getChannelsByIds(uniqueIds.slice(index, index + 50), apiKey));
  }
  return resources;
}
async function validateYouTubeApiKey(apiKey) {
  await validateKeyDirectly(apiKey);
}
async function discoverYouTubeVideos(apiKey, query, kind, pageToken, publishedAfter, publishedBefore, order = "relevance", videoDuration) {
  const searchParams = {
    part: "snippet",
    type: "video",
    q: query,
    order,
    maxResults: "50",
    safeSearch: "none"
  };
  if (pageToken) searchParams.pageToken = pageToken;
  if (publishedAfter) searchParams.publishedAfter = publishedAfter;
  if (publishedBefore) searchParams.publishedBefore = publishedBefore;
  if (kind === "Shorts") searchParams.videoDuration = "short";
  else if (videoDuration) searchParams.videoDuration = videoDuration;
  if (kind === "Live") searchParams.eventType = "live";
  const search = await apiGet("search", apiKey, searchParams);
  const videoIds = (search.items ?? []).flatMap((item) => item.id.videoId ? [item.id.videoId] : []);
  const resources = await getVideosByIds(videoIds, apiKey);
  const channels = await getChannelsByIds(resources.map((video) => video.snippet.channelId), apiKey);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  const videos = resources.map((video) => {
    const result = toVideo(video, channelMap.get(video.snippet.channelId));
    return kind === "Live" ? { ...result, kind: "Live" } : result;
  });
  return { videos, nextPageToken: search.nextPageToken, totalResults: search.pageInfo?.totalResults || videos.length };
}
async function loadYouTubeVideosByIds(apiKey, ids) {
  const resources = [];
  const uniqueIds = [...new Set(ids)];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    resources.push(...await getVideosByIds(uniqueIds.slice(index, index + 50), apiKey));
  }
  const channels = await getAllChannelsByIds(resources.map((video) => video.snippet.channelId), apiKey);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  return resources.map((video) => toVideo(video, channelMap.get(video.snippet.channelId)));
}
function extractChannelId(input) {
  return input.match(/UC[\w-]{22}/)?.[0] || "";
}
async function resolveChannel(input, apiKey) {
  const id = extractChannelId(input);
  if (id) return (await getChannelsByIds([id], apiKey))[0];
  const handle = input.match(/@([\w.-]+)/)?.[1];
  if (handle) {
    const data = await apiGet("channels", apiKey, { part: "snippet,statistics,contentDetails", forHandle: handle });
    if (data.items?.[0]) return { ...data.items[0], _capturedAt: Date.now() };
  }
  const search = await apiGet("search", apiKey, { part: "id", type: "channel", q: input, maxResults: "1" });
  const channelId = search.items?.[0]?.id.channelId;
  return channelId ? (await getChannelsByIds([channelId], apiKey))[0] : void 0;
}
async function getRecentChannelVideos(channel, apiKey, maxResults) {
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  const ids = [];
  let pageToken = "";
  const loadsAllVideos = maxResults === 0;
  do {
    const remaining = loadsAllVideos ? 50 : Math.min(50, Math.max(1, maxResults - ids.length));
    const params = { part: "contentDetails", playlistId, maxResults: String(remaining) };
    if (pageToken) params.pageToken = pageToken;
    const playlist = await apiGet("playlistItems", apiKey, params);
    ids.push(...(playlist.items ?? []).flatMap((item) => item.contentDetails?.videoId ? [item.contentDetails.videoId] : []));
    pageToken = playlist.nextPageToken || "";
  } while (pageToken && (loadsAllVideos || ids.length < maxResults));
  const resources = [];
  for (let index = 0; index < ids.length; index += 50) resources.push(...await getVideosByIds(ids.slice(index, index + 50), apiKey));
  return resources.map((video) => toVideo(video, channel));
}
async function loadTrackedChannels(apiKey, inputs, videosPerChannel = 10, customVideoIdsByChannel, scanOptions) {
  const results = [];
  for (const input of inputs) {
    const channel = await resolveChannel(input, apiKey);
    if (!channel) continue;
    const customIds = customVideoIdsByChannel?.[channel.id];
    const mode = scanOptions?.mode || (customVideoIdsByChannel ? "custom" : "latest");
    const kind = scanOptions?.kind || "all";
    const requestedCount = mode === "all" ? 0 : videosPerChannel;
    const fetchCount = mode === "latest" && kind !== "all" ? Math.max(50, videosPerChannel * 5) : requestedCount;
    const loadedVideos = customVideoIdsByChannel ? (await getVideosByIds(customIds || [], apiKey)).map((video) => toVideo(video, channel)) : await getRecentChannelVideos(channel, apiKey, fetchCount);
    const matchingVideos = loadedVideos.filter((video) => kind === "all" || (kind === "long" ? video.kind === "Long" : video.kind === "Shorts"));
    const recentVideos = mode === "latest" ? matchingVideos.slice(0, videosPerChannel) : matchingVideos;
    results.push({
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.id,
      thumbnailUrl: bestThumbnail(channel.snippet.thumbnails),
      subscriberCount: channel.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel.statistics?.subscriberCount),
      viewCount: numberValue(channel.statistics?.viewCount),
      videoCount: numberValue(channel.statistics?.videoCount),
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || "",
      recentVideos,
      recentVelocity: 0,
      capturedAt: channel._capturedAt
    });
  }
  return results;
}
async function loadChannelVideoCatalog(apiKey, input) {
  return (await loadTrackedChannels(apiKey, [input], 0, void 0, { mode: "all", kind: "all" }))[0];
}
function extractYouTubeVideoId(input) {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return trimmed.match(/[?&]v=([\w-]{11})/)?.[1] || trimmed.match(/youtu\.be\/([\w-]{11})/)?.[1] || trimmed.match(/youtube\.com\/(?:shorts|live|embed)\/([\w-]{11})/)?.[1] || "";
}
async function loadCommentChannelVideos(apiKey, input, onProgress) {
  const channel = await resolveChannel(input, apiKey);
  if (!channel) throw new Error(rt("research.api.channelNotFound"));
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error(rt("research.api.noPlaylist"));
  const ids = [];
  let pageToken = "";
  do {
    const params = { part: "contentDetails", playlistId, maxResults: "50" };
    if (pageToken) params.pageToken = pageToken;
    const page = await apiGet("playlistItems", apiKey, params);
    ids.push(...(page.items ?? []).flatMap((item) => item.contentDetails?.videoId ? [item.contentDetails.videoId] : []));
    pageToken = page.nextPageToken || "";
    onProgress?.(ids.length);
  } while (pageToken);
  const videos = [];
  for (let index = 0; index < ids.length; index += 50) {
    const resources = await getVideosByIds(ids.slice(index, index + 50), apiKey);
    videos.push(...resources.map((video) => toVideo(video, channel)));
    onProgress?.(videos.length);
  }
  return {
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.id,
      thumbnailUrl: bestThumbnail(channel.snippet.thumbnails),
      subscriberCount: channel.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel.statistics?.subscriberCount),
      viewCount: numberValue(channel.statistics?.viewCount),
      videoCount: numberValue(channel.statistics?.videoCount),
      uploadsPlaylistId: playlistId,
      recentVideos: videos,
      recentVelocity: 0
    },
    videos
  };
}
function toComment(id, videoId, snippet, isReply) {
  return {
    id,
    videoId,
    parentId: snippet.parentId,
    author: snippet.authorDisplayName || rt("research.api.youtubeUser"),
    authorAvatarUrl: snippet.authorProfileImageUrl || "",
    text: snippet.textOriginal || snippet.textDisplay || "",
    publishedAt: snippet.publishedAt || "",
    likeCount: numberValue(String(snippet.likeCount ?? 0)),
    isReply
  };
}
async function loadAllVideoComments(apiKey, videoId, onProgress) {
  const comments = [];
  let pageToken = "";
  try {
    do {
      const params = { part: "snippet,replies", videoId, maxResults: "100", textFormat: "plainText", order: "relevance" };
      if (pageToken) params.pageToken = pageToken;
      const page = await apiGet("commentThreads", apiKey, params);
      for (const thread of page.items ?? []) {
        comments.push(toComment(thread.snippet.topLevelComment.id, videoId, thread.snippet.topLevelComment.snippet, false));
        const replyCount = thread.snippet.totalReplyCount || 0;
        const inlineReplies = thread.replies?.comments ?? [];
        if (replyCount > 0 && inlineReplies.length >= replyCount) {
          comments.push(...inlineReplies.map((reply) => toComment(reply.id, videoId, reply.snippet, true)));
        } else if (replyCount > 0) {
          let replyPageToken = "";
          do {
            const replyParams = { part: "snippet", parentId: thread.snippet.topLevelComment.id, maxResults: "100", textFormat: "plainText" };
            if (replyPageToken) replyParams.pageToken = replyPageToken;
            const replies = await apiGet("comments", apiKey, replyParams);
            comments.push(...(replies.items ?? []).map((reply) => toComment(reply.id, videoId, reply.snippet, true)));
            replyPageToken = replies.nextPageToken || "";
          } while (replyPageToken);
        }
        onProgress?.(comments.length);
      }
      pageToken = page.nextPageToken || "";
    } while (pageToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : rt("research.api.commentsFailed");
    if (/disabled|commentsDisabled/i.test(message)) throw new Error(rt("research.api.commentsDisabled"));
    throw error;
  }
  return comments;
}
export {
  DEFAULT_CHANNEL_SCAN_CONFIG as D,
  measuredViewsInWindow as a,
  measuredChannelViewsInWindow as b,
  loadTrackedChannels as c,
  discoverYouTubeVideos as d,
  extractYouTubeVideoId as e,
  latestMeasuredVph as f,
  loadChannelVideoCatalog as g,
  loadYouTubeVideosByIds as h,
  loadCommentChannelVideos as i,
  configuredApiKeys as j,
  maskYouTubeKey as k,
  loadAllVideoComments as l,
  measuredCoverageInWindow as m,
  quotaForKey as q,
  useResearchStore as u,
  validateYouTubeApiKey as v
};
