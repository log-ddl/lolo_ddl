import { useEffect } from "react";
import { runResearchScan } from "../lib/research-scanner";
import { hydrateResearchDatabase } from "../lib/research-database";
import { DEFAULT_CHANNEL_SCAN_CONFIG, useResearchStore } from "../stores/research-store";

export function useResearchScanner() {
  const apiKey = useResearchStore((state) => state.apiKey);
  const trackedChannels = useResearchStore((state) => state.trackedChannels);
  const channelCache = useResearchStore((state) => state.channelCache);
  const channelScanConfigs = useResearchStore((state) => state.channelScanConfigs);
  const channelSnapshots = useResearchStore((state) => state.channelSnapshots);
  const databaseHydrated = useResearchStore((state) => state.databaseHydrated);
  const isScanning = useResearchStore((state) => state.isScanning);

  useEffect(() => {
    void hydrateResearchDatabase().catch((error) => {
      console.error("Failed to hydrate research database", error);
      useResearchStore.setState({ databaseHydrated: true });
    });
  }, []);

  useEffect(() => {
    if (!databaseHydrated || !apiKey || !trackedChannels.length || isScanning) return;
    const nextScanAt = trackedChannels.reduce((earliest, input, index) => {
      const channel = channelCache[index];
      const config = { ...DEFAULT_CHANNEL_SCAN_CONFIG, ...channelScanConfigs[channel?.id || input] };
      if (!config.autoScan) return earliest;
      const lastScannedAt = channel ? channelSnapshots[channel.id]?.scannedAt : undefined;
      const dueAt = lastScannedAt ? lastScannedAt + config.intervalMinutes * 60_000 : 0;
      return Math.min(earliest, dueAt);
    }, Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextScanAt)) return;
    const delayMs = Math.max(0, nextScanAt - Date.now());
    const timer = window.setTimeout(() => {
      void runResearchScan().catch(() => undefined);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [
    apiKey,
    channelCache,
    channelScanConfigs,
    channelSnapshots,
    databaseHydrated,
    isScanning,
    trackedChannels,
  ]);
}
