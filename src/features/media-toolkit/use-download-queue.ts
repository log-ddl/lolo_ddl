"use client";

/**
 * The batch download queue: building it from a playlist, the browser tab or a
 * pasted list, keeping a per-entry download config, and running the whole queue
 * one task at a time so a single yt-dlp process is active.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import type {
  MediaDownloadKind,
  MediaPlaylistEntry,
  MediaSourceInfo,
} from "./types";
import type { MediaToolkitBrowserState } from "@/shared/types/electron";
import { configDownloadTasks, nextJob, parseTimeRange, splitTimeRange, type QueueDownloadConfig } from "./download-helpers";

function sleep(ms: number) {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
}

export interface DownloadQueueDeps {
  url: string;
  browserState: MediaToolkitBrowserState;
  info: MediaSourceInfo | null;
  selectedKinds: MediaDownloadKind[];
  quality: QueueDownloadConfig["quality"];
  audioFormat: QueueDownloadConfig["audioFormat"];
  subtitleLanguage: string;
  startTime: string;
  endTime: string;
  setBusy: (value: boolean) => void;
  setActiveJob: (value: string) => void;
  setSrt: (value: string) => void;
  downloadPanelRef: React.RefObject<HTMLElement>;
  updateBrowserBounds: (show?: boolean) => void;
  setLastPath: (value: string) => void;
  t: Translate;
}

export function useDownloadQueue({
  url,
  browserState,
  info,
  selectedKinds,
  quality,
  audioFormat,
  subtitleLanguage,
  startTime,
  endTime,
  setBusy,
  setActiveJob,
  setLastPath,
  setSrt,
  downloadPanelRef,
  updateBrowserBounds,
  t,
}: DownloadQueueDeps) {
  const [queueEntries, setQueueEntries] = useState<MediaPlaylistEntry[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [queueConfigs, setQueueConfigs] = useState<Record<string, QueueDownloadConfig>>({});
  const [editingQueueId, setEditingQueueId] = useState("");
  const [queuePosition, setQueuePosition] = useState(0);
  const [batchUrl, setBatchUrl] = useState("");
  const [fetchingQueueIds, setFetchingQueueIds] = useState<string[]>([]);
  const [failedQueueIds, setFailedQueueIds] = useState<string[]>([]);
  const [batchConfigOpen, setBatchConfigOpen] = useState(false);
  const [batchKinds, setBatchKinds] = useState<MediaDownloadKind[]>(["video"]);
  const [batchQuality, setBatchQuality] = useState<QueueDownloadConfig["quality"]>("1080");
  const [batchAudioFormat, setBatchAudioFormat] = useState<QueueDownloadConfig["audioFormat"]>("mp3");
  const [batchStartTime, setBatchStartTime] = useState("");
  const [batchEndTime, setBatchEndTime] = useState("");
  const batchFileRef = useRef<HTMLInputElement>(null);
  // Job ids currently in flight for the parallel queue, so the cancel button
  // can stop every worker, not just the latest `activeJob`.
  const activeQueueJobIds = useRef<Set<string>>(new Set());

  function makeQueueConfig(): QueueDownloadConfig {
    return {
      kinds: selectedKinds.length ? [...selectedKinds] : ["video"],
      quality,
      audioFormat,
      subtitleLanguage,
      startTime,
      endTime,
    };
  }

  function updateQueueConfig(entryId: string, patch: Partial<QueueDownloadConfig>) {
    setQueueConfigs((current) => ({
      ...current,
      [entryId]: { ...(current[entryId] || makeQueueConfig()), ...patch },
    }));
  }

  function toggleQueueConfigKind(entryId: string, value: MediaDownloadKind) {
    const config = queueConfigs[entryId] || makeQueueConfig();
    updateQueueConfig(entryId, {
      kinds: config.kinds.includes(value)
        ? config.kinds.filter((item) => item !== value)
        : [...config.kinds, value],
    });
  }

  async function loadPlaylist(candidate = url || browserState.url) {
    if (!window.mediaToolkit) return;
    if (!/^https?:\/\//i.test(candidate.trim())) return toast.error(t("mediaToolkit.invalidUrl"));
    const jobId = nextJob("playlist");
    setActiveJob(jobId);
    setBusy(true);
    try {
      const result = await window.mediaToolkit.analyzePlaylist({ jobId, url: candidate.trim() });
      if (!result.success || !result.playlist) throw new Error(result.error || t("mediaToolkit.playlistFailed"));
      setQueueEntries(result.playlist.entries);
      setSelectedQueueIds(result.playlist.entries.map((entry) => entry.id));
      const initialConfig = makeQueueConfig();
      setQueueConfigs(Object.fromEntries(result.playlist.entries.map((entry) => [entry.id, { ...initialConfig, kinds: [...initialConfig.kinds] }])));
      setEditingQueueId("");
      toast.success(t("mediaToolkit.playlistLoaded", { count: result.playlist.entries.length }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      setActiveJob("");
    }
  }

  function addCurrentToQueue() {
    if (!info) return;
    const existing = queueEntries.find((item) => item.id === info.id || item.url === info.webpageUrl);
    if (existing) {
      setSelectedQueueIds((current) => current.includes(existing.id) ? current : [...current, existing.id]);
      setEditingQueueId(existing.id);
      toast.success(t("mediaToolkit.queueAdded"));
      return;
    }
    const entry: MediaPlaylistEntry = {
      id: info.id,
      title: info.title,
      url: info.webpageUrl,
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader,
    };
    setQueueEntries((current) => [...current, entry]);
    setSelectedQueueIds((current) => current.includes(entry.id) ? current : [...current, entry.id]);
    setQueueConfigs((current) => current[entry.id] ? current : { ...current, [entry.id]: makeQueueConfig() });
    setEditingQueueId(entry.id);
    globalThis.setTimeout(() => downloadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    toast.success(t("mediaToolkit.queueAdded"));
  }

  function addUrlsToQueue(candidates: string[]) {
    const existingUrls = new Set(queueEntries.map((entry) => entry.url.trim()));
    const seen = new Set<string>();
    const parsed = candidates
      .map((candidate) => {
        const { url, range } = splitTimeRange(candidate);
        const time = parseTimeRange(range);
        return {
          url,
          startTime: time?.startTime || "",
          endTime: time?.endTime || "",
        };
      })
      .filter(({ url }) => {
        if (!/^https?:\/\//i.test(url) || existingUrls.has(url) || seen.has(url)) return false;
        seen.add(url);
        return true;
      });
    if (!parsed.length) return 0;
    const entries = parsed.map((candidate) => ({
      id: nextJob("batch"),
      title: candidate.url,
      url: candidate.url,
    } satisfies MediaPlaylistEntry));
    setQueueEntries((current) => [...current, ...entries]);
    setSelectedQueueIds((current) => [...current, ...entries.map((entry) => entry.id)]);
    setQueueConfigs((current) => ({
      ...current,
      ...Object.fromEntries(entries.map((entry, index) => [
        entry.id,
        { ...makeQueueConfig(), startTime: parsed[index].startTime, endTime: parsed[index].endTime },
      ])),
    }));
    return entries.length;
  }

  function addUrlToQueue() {
    const { url } = splitTimeRange(batchUrl);
    if (!/^https?:\/\//i.test(url)) return toast.error(t("mediaToolkit.invalidUrl"));
    const count = addUrlsToQueue([batchUrl]);
    setBatchUrl("");
    if (count) toast.success(t("mediaToolkit.queueAdded"));
  }

  async function importBatchFile(file?: File) {
    if (!file) return;
    const content = await file.text();
    const count = addUrlsToQueue(content.split(/\r?\n/));
    if (batchFileRef.current) batchFileRef.current.value = "";
    if (count) toast.success(t("mediaToolkit.batchImported", { count }));
    else toast.error(t("mediaToolkit.batchNoValidUrl"));
  }

  function removeQueueEntry(entryId: string) {
    setQueueEntries((current) => current.filter((entry) => entry.id !== entryId));
    setSelectedQueueIds((current) => current.filter((id) => id !== entryId));
    setFailedQueueIds((current) => current.filter((id) => id !== entryId));
    setQueueConfigs((current) => {
      const next = { ...current };
      delete next[entryId];
      return next;
    });
    if (editingQueueId === entryId) setEditingQueueId("");
  }

  function openBatchConfig() {
    // The dialog times are only meant for batches without embedded times
    // (from a TXT/pasted list), so start fresh each time it opens.
    setBatchStartTime("");
    setBatchEndTime("");
    setBatchConfigOpen(true);
    void window.mediaToolkit?.hideBrowser();
  }

  function closeBatchConfig() {
    setBatchConfigOpen(false);
    globalThis.setTimeout(() => updateBrowserBounds(true), 160);
  }

  function toggleBatchKind(kind: MediaDownloadKind) {
    setBatchKinds((current) => current.includes(kind)
      ? current.filter((item) => item !== kind)
      : [...current, kind]);
  }

  async function confirmBatchDownload() {
    if (!batchKinds.length) return;
    const config: QueueDownloadConfig = {
      kinds: [...batchKinds],
      quality: batchQuality,
      audioFormat: batchAudioFormat,
      subtitleLanguage: "",
      startTime: batchStartTime,
      endTime: batchEndTime,
    };
    setQueueConfigs((current) => ({
      ...current,
      ...Object.fromEntries(selectedQueueIds.map((id) => {
        const own = current[id];
        // Entries imported from a TXT file / pasted list already have their
        // start/end times, so the batch dialog times must not wipe them.
        const hasOwnTime = Boolean(own && (own.startTime?.trim() || own.endTime?.trim()));
        return [id, {
          ...config,
          ...(hasOwnTime ? { startTime: own.startTime, endTime: own.endTime } : {}),
          kinds: [...config.kinds],
        }];
      })),
    }));
    closeBatchConfig();
    await downloadQueue(config);
  }

  async function downloadQueue(configOverride?: QueueDownloadConfig) {
    if (!window.mediaToolkit) return;
    const mediaToolkit = window.mediaToolkit;
    const selectedEntries = queueEntries.filter((entry) => selectedQueueIds.includes(entry.id));
    const totalTasks = selectedEntries.reduce((total, entry) => {
      const config = configOverride || queueConfigs[entry.id] || makeQueueConfig();
      return total + configDownloadTasks(config).length;
    }, 0);
    if (!selectedEntries.length || totalTasks === 0) return;
    const picked = await window.mediaToolkit.chooseDirectory();
    if (!picked.success || !picked.directory) return;
    setBusy(true);
    setQueuePosition(0);
    let completed = 0;
    let processed = 0;
    let canceled = false;
    const processEntry = async (entry: MediaPlaylistEntry) => {
      let config = configOverride
        ? { ...configOverride, kinds: [...configOverride.kinds] }
        : queueConfigs[entry.id] || makeQueueConfig();
      // An entry imported from a TXT file / pasted list carries its own
      // start/end times parsed from the line, so those must win over the
      // batch dialog's global times.
      const own = configOverride ? queueConfigs[entry.id] : undefined;
      if (own && (own.startTime?.trim() || own.endTime?.trim())) {
        config = { ...config, startTime: own.startTime, endTime: own.endTime };
      }
      setFetchingQueueIds((current) => current.includes(entry.id) ? current : [...current, entry.id]);
      setFailedQueueIds((current) => current.filter((id) => id !== entry.id));
      const metadataJobId = nextJob("queue-info");
      activeQueueJobIds.current.add(metadataJobId);
      setActiveJob(metadataJobId);
      try {
        const metadata = await mediaToolkit.analyze({ jobId: metadataJobId, url: entry.url });
        if (!metadata.success || !metadata.info) throw new Error(metadata.error || t("mediaToolkit.analyzeFailed"));
        const firstTrack = metadata.info.subtitles.find((track) => !track.automatic) || metadata.info.subtitles[0];
        config = { ...config, subtitleLanguage: config.subtitleLanguage || firstTrack?.language || "" };
        setQueueConfigs((current) => ({ ...current, [entry.id]: config }));
        setQueueEntries((current) => current.map((item) => item.id === entry.id ? {
          ...item,
          title: metadata.info!.title,
          url: metadata.info!.webpageUrl || item.url,
          thumbnail: metadata.info!.thumbnail,
          duration: metadata.info!.duration,
          uploader: metadata.info!.uploader,
        } : item));
      } catch (error) {
        setFailedQueueIds((current) => current.includes(entry.id) ? current : [...current, entry.id]);
        toast.error(`${entry.url}: ${error instanceof Error ? error.message : String(error)}`);
        return;
      } finally {
        activeQueueJobIds.current.delete(metadataJobId);
        setFetchingQueueIds((current) => current.filter((id) => id !== entry.id));
      }
      for (const task of configDownloadTasks(config)) {
        if (canceled) break;
        const queueKind = task.kind;
        const jobId = nextJob(`queue-${queueKind}`);
        processed += 1;
        setQueuePosition(processed);
        activeQueueJobIds.current.add(jobId);
        setActiveJob(jobId);
        const result = await mediaToolkit.download({
          jobId,
          url: entry.url,
          kind: queueKind,
          outputDirectory: picked.directory,
          quality: config.quality,
          audioFormat: queueKind === "audio" ? config.audioFormat : undefined,
          subtitleLanguage: config.subtitleLanguage,
          startTime: config.startTime,
          endTime: config.endTime,
          includeAutomatic: true,
        });
        activeQueueJobIds.current.delete(jobId);
        if (result.canceled) {
          canceled = true;
          break;
        }
        if (!result.success) {
          toast.error(`${entry.title} · ${t(`mediaToolkit.kind.${queueKind}`)}: ${result.error || t("mediaToolkit.downloadFailed")}`);
          continue;
        }
        completed += 1;
        if (result.filePath) setLastPath(result.filePath);
        if (result.srt) setSrt(result.srt);
      }
    };
    // Up to two entries download at the same time; each entry still processes
    // its own kinds (video/audio/subtitle/thumbnail) in order. The two in-flight
    // downloads are staggered by a random 1-2s so they never hit YouTube with a
    // simultaneous request burst.
    let next = 0;
    const workers = Array.from({ length: Math.min(2, selectedEntries.length) }, async () => {
      while (next < selectedEntries.length && !canceled) {
        const entry = selectedEntries[next];
        next += 1;
        await sleep(1000 + Math.random() * 1000);
        await processEntry(entry);
      }
    });
    await Promise.all(workers);
    setBusy(false);
    setActiveJob("");
    setQueuePosition(0);
    if (!canceled) toast.success(t("mediaToolkit.queueDone", { completed, total: totalTasks }));
  }

  function cancelQueueDownloads() {
    const ids = [...activeQueueJobIds.current];
    activeQueueJobIds.current.clear();
    for (const id of ids) void window.mediaToolkit?.cancel(id);
  }

  return {
    queueEntries, setQueueEntries,
    selectedQueueIds, setSelectedQueueIds,
    queueConfigs,
    editingQueueId, setEditingQueueId,
    queuePosition,
    batchUrl, setBatchUrl,
    fetchingQueueIds,
    failedQueueIds,
    batchConfigOpen,
    batchKinds,
    batchQuality, setBatchQuality,
    batchAudioFormat, setBatchAudioFormat,
    batchStartTime, setBatchStartTime,
    batchEndTime, setBatchEndTime,
    batchFileRef,
    makeQueueConfig,
    updateQueueConfig,
    toggleQueueConfigKind,
    loadPlaylist,
    addCurrentToQueue,
    addUrlsToQueue,
    addUrlToQueue,
    importBatchFile,
    removeQueueEntry,
    openBatchConfig,
    closeBatchConfig,
    toggleBatchKind,
    confirmBatchDownload,
    downloadQueue,
    cancelQueueDownloads,
  };
}
