import { loadTrackedChannels } from "./youtube-api";
import { persistFailedResearchScan, persistSuccessfulResearchScan } from "./research-database";
import { translate } from "@/shared/i18n";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";
import { DEFAULT_CHANNEL_SCAN_CONFIG, latestMeasuredVph, measuredChannelViewsInWindow, measuredCoverageInWindow, measuredViewsInWindow, useResearchStore } from "../stores/research-store";
import type { YouTubeVideo } from "../types";

export async function runResearchScan(force = false, onlyChannelId?: string) {
  const state = useResearchStore.getState();
  if (state.isScanning || !state.apiKey) return false;
  const now = Date.now();
  const targets = state.trackedChannels
    .map((input, index) => {
      const cachedChannel = state.channelCache[index];
      const config = {
        ...DEFAULT_CHANNEL_SCAN_CONFIG,
        ...state.channelScanConfigs[cachedChannel?.id || input],
      };
      const lastScannedAt = cachedChannel ? state.channelSnapshots[cachedChannel.id]?.scannedAt : undefined;
      return { input, cachedChannel, config, lastScannedAt };
    })
    .filter((target) => {
      if (onlyChannelId && target.cachedChannel?.id !== onlyChannelId) return false;
      if (force) return true;
      if (!target.config.autoScan) return false;
      return !target.lastScannedAt
        || now - target.lastScannedAt >= target.config.intervalMinutes * 60_000;
    });
  if (!targets.length) return false;

  state.setScanning(true);
  const startedAt = Date.now();
  try {
    const channels: typeof state.channelCache = [];
    for (const target of targets) {
      const customIds = target.config.videoScanMode === "custom"
        ? { [target.cachedChannel?.id || ""]: state.customScanVideoIdsByChannel[target.cachedChannel?.id || ""] || [] }
        : undefined;
      const [channel] = await loadTrackedChannels(
        state.apiKey,
        [target.input],
        target.config.videosPerChannel,
        customIds,
        { mode: target.config.videoScanMode, kind: target.config.videoKind },
      );
      if (channel) {
        channels.push(channel);
        useResearchStore.getState().setChannelScanConfig(channel.id, target.config);
      }
    }
    const allVideos: YouTubeVideo[] = channels.flatMap((channel) => channel.recentVideos);

    const uniqueVideos = [...new Map(allVideos.map((video) => [video.id, video])).values()];
    const scannedAt = Date.now();
    const persisted = await persistSuccessfulResearchScan({ startedAt, finishedAt: scannedAt, scope: "channels", videos: uniqueVideos, channels });
    if (persisted) useResearchStore.setState((current) => ({ scanAudits: [{ id: persisted.scanId, startedAt, finishedAt: scannedAt, scope: "channels" as const, status: "success" as const, channelCount: channels.length, videoCount: uniqueVideos.length }, ...current.scanAudits].slice(0, 100) }));
    useResearchStore.getState().recordScan(uniqueVideos, scannedAt);
    if (channels.length) useResearchStore.getState().recordChannelScan(channels, scannedAt);

    if (channels.length) {
      const measuredChannels = channels.map((channel) => {
        const recentVideos = channel.recentVideos.map((video) => ({
          ...video,
          viewsPerHour: latestMeasuredVph(video.id) ?? 0,
          viewsLast48Hours: measuredViewsInWindow(video.id, 48, scannedAt),
          measurementCoverage48Hours: measuredCoverageInWindow(useResearchStore.getState().vphHistory[video.id], 48, scannedAt),
        }));
        return {
          ...channel,
          recentVideos,
          recentVelocity: recentVideos.reduce((sum, video) => sum + video.viewsPerHour, 0),
          viewsLast48Hours: measuredChannelViewsInWindow(channel.id, 48, scannedAt),
          measurementCoverage48Hours: measuredCoverageInWindow(useResearchStore.getState().channelViewHistory[channel.id], 48, scannedAt),
        };
      });
      const existingChannels = useResearchStore.getState().channelCache;
      const measuredById = new Map(measuredChannels.map((channel) => [channel.id, channel]));
      const mergedChannels = existingChannels.map((channel) => measuredById.get(channel.id) || channel);
      const existingIds = new Set(existingChannels.map((channel) => channel.id));
      mergedChannels.push(...measuredChannels.filter((channel) => !existingIds.has(channel.id)));
      useResearchStore.getState().setChannelCache(mergedChannels);
    }
    useResearchStore.getState().finishScan(scannedAt);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : translate(useUIPreferencesStore.getState().uiLanguage, "research.api.scanFailed");
    const failedAt = Date.now();
    const persisted = await persistFailedResearchScan({ startedAt, finishedAt: failedAt, scope: "channels", error: message }).catch(() => undefined);
    if (persisted) useResearchStore.setState((current) => ({ scanAudits: [{ id: persisted.scanId, startedAt, finishedAt: failedAt, scope: "channels" as const, status: "failed" as const, channelCount: 0, videoCount: 0, error: message }, ...current.scanAudits].slice(0, 100) }));
    useResearchStore.getState().finishScan(state.lastScanAt || 0, message);
    throw error;
  }
}
