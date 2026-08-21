import type { ChannelSnapshot, ScanAudit, VideoSnapshot, VphPoint } from "../types";
import { measuredChannelViewsInWindow, measuredCoverageInWindow, measuredViewsInWindow, useResearchStore } from "../stores/research-store";

type VideoRow = VideoSnapshot;
type ChannelRow = ChannelSnapshot;

function buildVideoState(rows: VideoRow[]) {
  const snapshots: Record<string, VideoSnapshot> = {};
  const vphHistory: Record<string, VphPoint[]> = {};
  const grouped = new Map<string, VideoRow[]>();
  for (const row of rows) grouped.set(row.videoId, [...(grouped.get(row.videoId) || []), row]);
  for (const [videoId, points] of grouped) {
    points.sort((left, right) => left.scannedAt - right.scannedAt);
    const latest = points[points.length - 1];
    if (latest) snapshots[videoId] = latest;
    vphHistory[videoId] = points.slice(1).map((point, index) => {
      const previous = points[index];
      const elapsedHours = (point.scannedAt - previous.scannedAt) / 3_600_000;
      const deltaViews = point.viewCount - previous.viewCount;
      return { previousScannedAt: previous.scannedAt, scannedAt: point.scannedAt, viewCount: point.viewCount, deltaViews, elapsedHours, vph: elapsedHours > 0 ? deltaViews / elapsedHours : 0 };
    }).filter((point) => point.elapsedHours > 0);
  }
  return { snapshots, vphHistory };
}

function buildChannelState(rows: ChannelRow[]) {
  const channelSnapshots: Record<string, ChannelSnapshot> = {};
  const channelViewHistory: Record<string, VphPoint[]> = {};
  const grouped = new Map<string, ChannelRow[]>();
  for (const row of rows) grouped.set(row.channelId, [...(grouped.get(row.channelId) || []), row]);
  for (const [channelId, points] of grouped) {
    points.sort((left, right) => left.scannedAt - right.scannedAt);
    const latest = points[points.length - 1];
    if (latest) channelSnapshots[channelId] = latest;
    channelViewHistory[channelId] = points.slice(1).map((point, index) => {
      const previous = points[index];
      const elapsedHours = (point.scannedAt - previous.scannedAt) / 3_600_000;
      const deltaViews = point.viewCount - previous.viewCount;
      return { previousScannedAt: previous.scannedAt, scannedAt: point.scannedAt, viewCount: point.viewCount, deltaViews, elapsedHours, vph: elapsedHours > 0 ? deltaViews / elapsedHours : 0 };
    }).filter((point) => point.elapsedHours > 0);
  }
  return { channelSnapshots, channelViewHistory };
}

function refreshMeasuredChannelCache(now: number) {
  const state = useResearchStore.getState();
  state.setChannelCache(state.channelCache.map((channel) => ({
    ...channel,
    viewsLast48Hours: measuredChannelViewsInWindow(channel.id, 48, now),
    measurementCoverage48Hours: measuredCoverageInWindow(state.channelViewHistory[channel.id], 48, now),
    recentVideos: channel.recentVideos.map((video) => ({
      ...video,
      viewsLast48Hours: measuredViewsInWindow(video.id, 48, now),
      measurementCoverage48Hours: measuredCoverageInWindow(state.vphHistory[video.id], 48, now),
    })),
  })));
}

export async function hydrateResearchDatabase() {
  const api = window.researchDatabase;
  if (!api) {
    useResearchStore.setState({ databaseHydrated: true });
    return;
  }
  const legacy = useResearchStore.getState();
  await api.migrateLegacy({
    snapshots: legacy.snapshots,
    vphHistory: legacy.vphHistory,
    channelSnapshots: legacy.channelSnapshots,
    channelViewHistory: legacy.channelViewHistory,
  });
  const loaded = await api.load();
  const videoState = buildVideoState(loaded.videos);
  const channelState = buildChannelState(loaded.channels);
  useResearchStore.getState().hydrateScanHistory({ ...videoState, ...channelState, scanAudits: loaded.scans as ScanAudit[] });
  const latestAt = Math.max(0, ...loaded.videos.map((row) => row.scannedAt), ...loaded.channels.map((row) => row.scannedAt));
  if (latestAt) useResearchStore.setState({ lastScanAt: latestAt });
  refreshMeasuredChannelCache(latestAt || Date.now());
}

export async function persistSuccessfulResearchScan(payload: Parameters<NonNullable<Window["researchDatabase"]>["recordScan"]>[0]) {
  return window.researchDatabase?.recordScan(payload);
}

export async function persistFailedResearchScan(payload: Parameters<NonNullable<Window["researchDatabase"]>["recordFailure"]>[0]) {
  return window.researchDatabase?.recordFailure(payload);
}
