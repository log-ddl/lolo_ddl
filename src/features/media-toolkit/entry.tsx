import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Captions, Check, ChevronLeft, ChevronRight, Download, FileAudio, Film,
  FolderOpen, Home, Image as ImageIcon, ListVideo, Loader2, Pencil, Plus, RefreshCw, Search, Sparkles, Square, Trash2, UserRound, X,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";
import { FeatureRail } from "@/shared/components/FeatureRail";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";
import { configDownloadTasks, durationLabel, nextJob, type QueueDownloadConfig } from "./download-helpers";
import { useDownloadQueue } from "./use-download-queue";
import { Field, SubtitleTrackPicker } from "./subtitle-track-picker";
import type { MediaDownloadKind, MediaSourceInfo, MediaToolkitProgress } from "./types";
import type { MediaToolkitBrowserState, YouTubeProfileState } from "@/shared/types/electron";

export default function MediaToolkitFeature({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<MediaSourceInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeJob, setActiveJob] = useState("");
  const [progress, setProgress] = useState<MediaToolkitProgress | null>(null);
  const [selectedKinds, setSelectedKinds] = useState<MediaDownloadKind[]>(["video"]);
  const [quality, setQuality] = useState<"best" | "1080" | "720" | "480">("1080");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "m4a" | "wav">("mp3");
  const [subtitleLanguage, setSubtitleLanguage] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lastPath, setLastPath] = useState("");
  const [srt, setSrt] = useState("");
  const [whisperProvider, setWhisperProvider] = useState<"groq" | "openai">("groq");
  const [whisperKey, setWhisperKey] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const browserHostRef = useRef<HTMLDivElement>(null);
  const [browserState, setBrowserState] = useState<MediaToolkitBrowserState>({
    url: "https://www.youtube.com/",
    title: "YouTube",
    canGoBack: false,
    canGoForward: false,
    loading: true,
  });
  const [browserAddress, setBrowserAddress] = useState("https://www.youtube.com/");
  const [profileState, setProfileState] = useState<YouTubeProfileState>({ activeProfileId: "default", profiles: [] });
  const [profileDialog, setProfileDialog] = useState<{ mode: "rename" | "delete"; profileId: string } | null>(null);
  const [profileDraft, setProfileDraft] = useState("");
  const downloadPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return window.mediaToolkit?.onProgress((event) => {
      setProgress(event);
    });
  }, []);

  const updateBrowserBounds = useCallback((show = false) => {
    const host = browserHostRef.current;
    const api = window.mediaToolkit;
    if (!host || !api) return;
    const rect = host.getBoundingClientRect();
    const top = Math.max(64, rect.top);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const bounds = {
      x: Math.max(0, Math.round(rect.left)),
      y: Math.round(top),
      width: Math.max(0, Math.round(rect.width)),
      height: Math.max(0, Math.round(bottom - top)),
    };
    if (show) void api.showBrowser(bounds);
    else void api.setBrowserBounds(bounds);
  }, []);

  useEffect(() => {
    const api = window.mediaToolkit;
    const host = browserHostRef.current;
    if (!api || !host) return;
    void api.listProfiles().then(setProfileState);
    const stopState = api.onBrowserState((state) => {
      setBrowserState(state);
      setBrowserAddress(state.url || "https://www.youtube.com/");
      if (/youtube\.com\/(?:watch|shorts)\//i.test(state.url) || /youtube\.com\/watch/i.test(state.url) || /youtu\.be\//i.test(state.url)) {
        setUrl(state.url);
      }
    });
    updateBrowserBounds(true);
    const observer = new ResizeObserver(() => updateBrowserBounds());
    observer.observe(host);
    const handlePosition = () => updateBrowserBounds();
    window.addEventListener("resize", handlePosition);
    document.addEventListener("scroll", handlePosition, true);
    return () => {
      observer.disconnect();
      stopState();
      window.removeEventListener("resize", handlePosition);
      document.removeEventListener("scroll", handlePosition, true);
      void api.hideBrowser();
    };
  }, [updateBrowserBounds]);

  async function navigateBrowserAddress() {
    const input = browserAddress.trim();
    if (!input || !window.mediaToolkit) return;
    const destination = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
    const result = await window.mediaToolkit.navigateBrowser(destination);
    if (!result.success) toast.error(result.error || t("mediaToolkit.invalidUrl"));
  }

  async function createProfile() {
    const state = await window.mediaToolkit?.createProfile();
    if (state) {
      setProfileState(state);
      setInfo(null);
      setUrl("");
      setSrt("");
    }
  }

  async function switchProfile(profileId: string) {
    const state = await window.mediaToolkit?.switchProfile(profileId);
    if (state) {
      setProfileState(state);
      setInfo(null);
      setUrl("");
      setSrt("");
    }
  }

  function openProfileDialog(mode: "rename" | "delete") {
    const profile = profileState.profiles.find((item) => item.id === profileState.activeProfileId);
    if (!profile) return;
    setProfileDraft(profile.name);
    setProfileDialog({ mode, profileId: profile.id });
    void window.mediaToolkit?.hideBrowser();
  }

  function closeProfileDialog() {
    setProfileDialog(null);
    globalThis.setTimeout(() => updateBrowserBounds(true), 160);
  }

  async function submitProfileDialog() {
    if (!profileDialog) return;
    if (profileDialog.mode === "rename") {
      const name = profileDraft.trim();
      if (!name) return;
      const state = await window.mediaToolkit?.renameProfile({ profileId: profileDialog.profileId, name });
      if (state) setProfileState(state);
    } else {
      const state = await window.mediaToolkit?.deleteProfile(profileDialog.profileId);
      if (state) {
        setProfileState(state);
        setInfo(null);
        setUrl("");
        setSrt("");
      }
    }
    closeProfileDialog();
  }

  const tracks = useMemo(() => {
    const seen = new Set<string>();
    return (info?.subtitles || []).filter((track) => {
      if (seen.has(track.language)) return false;
      seen.add(track.language);
      return true;
    });
  }, [info]);
  const {
    queueEntries,
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
    addUrlToQueue,
    importBatchFile,
    removeQueueEntry,
    openBatchConfig,
    closeBatchConfig,
    toggleBatchKind,
    confirmBatchDownload,
    cancelQueueDownloads,
  } = useDownloadQueue({
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
  });

  function toggleDownloadKind(value: MediaDownloadKind) {
    if (editingQueueId) {
      toggleQueueConfigKind(editingQueueId, value);
      return;
    }
    setSelectedKinds((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }

  function updateDownloadPanel(patch: Partial<QueueDownloadConfig>) {
    if (editingQueueId) {
      updateQueueConfig(editingQueueId, patch);
      return;
    }
    if (patch.kinds) setSelectedKinds(patch.kinds);
    if (patch.quality) setQuality(patch.quality);
    if (patch.audioFormat) setAudioFormat(patch.audioFormat);
    if (patch.subtitleLanguage !== undefined) setSubtitleLanguage(patch.subtitleLanguage);
    if (patch.startTime !== undefined) setStartTime(patch.startTime);
    if (patch.endTime !== undefined) setEndTime(patch.endTime);
  }

  function editQueueEntry(entryId: string) {
    setEditingQueueId(entryId);
    setSelectedQueueIds((current) => current.includes(entryId) ? current : [...current, entryId]);
    globalThis.setTimeout(() => downloadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function downloadSelected() {
    if (!window.mediaToolkit) return;
    const queueEntry = queueEntries.find((entry) => entry.id === editingQueueId);
    const targetUrl = queueEntry?.url || info?.webpageUrl;
    const config = queueEntry
      ? queueConfigs[queueEntry.id] || makeQueueConfig()
      : makeQueueConfig();
    const tasks = configDownloadTasks(config);
    if (!targetUrl || tasks.length === 0) return;
    const picked = await window.mediaToolkit.chooseDirectory();
    if (!picked.success || !picked.directory) return;
    setBusy(true);
    let completed = 0;
    try {
      for (const task of tasks) {
        const selectedKind = task.kind;
        const jobId = nextJob(selectedKind);
        setActiveJob(jobId);
        setProgress({ jobId, stage: "downloading", percent: 0 });
        const result = await window.mediaToolkit.download({
          jobId,
          url: targetUrl,
          kind: selectedKind,
          outputDirectory: picked.directory,
          quality: config.quality,
          audioFormat: selectedKind === "audio" ? config.audioFormat : undefined,
          subtitleLanguage: config.subtitleLanguage,
          startTime: config.startTime,
          endTime: config.endTime,
          includeAutomatic: true,
        });
        if (result.canceled) break;
        if (!result.success) {
          toast.error(`${t(`mediaToolkit.kind.${selectedKind}`)}: ${result.error || t("mediaToolkit.downloadFailed")}`);
          continue;
        }
        completed += 1;
        if (result.filePath) setLastPath(result.filePath);
        if (result.srt) setSrt(result.srt);
      }
      if (completed > 0) toast.success(t("mediaToolkit.multiDownloadDone", { completed, total: tasks.length }));
    } finally {
      setBusy(false);
      setActiveJob("");
    }
  }

  async function analyze(candidate = url) {
    if (!window.mediaToolkit) return toast.error(t("mediaToolkit.desktopOnly"));
    if (!/^https?:\/\//i.test(candidate.trim())) return toast.error(t("mediaToolkit.invalidUrl"));
    const jobId = nextJob("analyze");
    setActiveJob(jobId);
    setBusy(true);
    setInfo(null);
    try {
      const result = await window.mediaToolkit.analyze({ jobId, url: candidate.trim() });
      if (!result.success || !result.info) throw new Error(result.error || t("mediaToolkit.analyzeFailed"));
      setInfo(result.info);
      setEditingQueueId("");
      const firstTrack = result.info.subtitles.find((track) => !track.automatic) || result.info.subtitles[0];
      setSubtitleLanguage(firstTrack?.language || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      setActiveJob("");
    }
  }


  async function download(selectedKind: MediaDownloadKind) {
    if (!window.mediaToolkit || !info) return null;
    const jobId = nextJob(selectedKind);
    setActiveJob(jobId);
    setBusy(true);
    setProgress({ jobId, stage: "downloading", percent: 0 });
    try {
      const result = await window.mediaToolkit.download({
        jobId,
        url: info.webpageUrl,
        kind: selectedKind,
        quality,
        audioFormat: selectedKind === "audio" ? audioFormat : undefined,
        subtitleLanguage,
        includeAutomatic: true,
      });
      if (result.canceled) return null;
      if (!result.success) throw new Error(result.error || t("mediaToolkit.downloadFailed"));
      if (result.filePath) setLastPath(result.filePath);
      if (result.srt) setSrt(result.srt);
      toast.success(t("mediaToolkit.downloadDone"));
      return result.filePath || null;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setBusy(false);
      setActiveJob("");
    }
  }

  async function generateSubtitle() {
    if (!window.whisperRuntime || !whisperKey.trim()) {
      toast.error(t("mediaToolkit.whisperKeyRequired"));
      return;
    }
    const audioPath = await download("audio");
    if (!audioPath) return;
    const jobId = nextJob("whisper");
    setActiveJob(jobId);
    setBusy(true);
    try {
      const result = await window.whisperRuntime.transcribe({
        jobId,
        audioPath,
        provider: whisperProvider,
        apiKey: whisperKey.trim(),
        language: sourceLanguage.trim() || undefined,
      });
      if (!result.success || !result.srt) throw new Error(result.error || t("mediaToolkit.transcribeFailed"));
      setSrt(result.srt);
      toast.success(t("mediaToolkit.transcribeDone"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      setActiveJob("");
    }
  }

  async function cancel() {
    cancelQueueDownloads();
    if (activeJob) {
      await window.mediaToolkit?.cancel(activeJob);
      await window.whisperRuntime?.cancel(activeJob);
    }
    setBusy(false);
    setActiveJob("");
  }

  const activeQueueEntry = queueEntries.find((entry) => entry.id === editingQueueId);
  const activeMedia = activeQueueEntry || info;
  const panelConfig = activeQueueEntry
    ? queueConfigs[activeQueueEntry.id] || makeQueueConfig()
    : makeQueueConfig();
  const selectedQueueTaskCount = selectedQueueIds.reduce((total, id) => {
    const config = queueConfigs[id];
    return total + (config ? configDownloadTasks(config).length : 0);
  }, 0);
  // Entries imported from a TXT file / pasted list already carry their own
  // start/end times, so the batch dialog's global start/end fields are hidden
  // for those and only shown when the batch was built without times.
  const batchHasEmbeddedTime = selectedQueueIds.some((id) => {
    const config = queueConfigs[id];
    return Boolean(config && (config.startTime?.trim() || config.endTime?.trim()));
  });

  return (
    <div className="flex h-full bg-background text-foreground">
      {!embedded && <FeatureRail />}
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="h-16 shrink-0 border-b border-border/50 bg-panel/80 backdrop-blur-xl px-5 flex items-center gap-3">
        <FeatureHeaderIcon icon={Download} />
        <div>
          <h1 className="text-sm font-semibold">{t("mediaToolkit.title")}</h1>
          <p className="text-[10px] text-muted-foreground">{t("mediaToolkit.subtitle")}</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <UserRound className="h-4 w-4 text-muted-foreground mr-1" />
          <Select value={profileState.activeProfileId} onValueChange={(value) => void switchProfile(value)}>
            <SelectTrigger className="h-9 w-40 bg-background"><SelectValue placeholder={t("mediaToolkit.profile.select")} /></SelectTrigger>
            <SelectContent>{profileState.profiles.map((profile) => <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => void createProfile()} title={t("mediaToolkit.profile.create")}><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => openProfileDialog("rename")} disabled={!profileState.profiles.length} title={t("mediaToolkit.profile.rename")}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => openProfileDialog("delete")} disabled={profileState.profiles.length <= 1} title={t("mediaToolkit.profile.delete")}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto xl:overflow-hidden p-2 sm:p-4">
        <div className="min-h-full xl:h-full max-w-[1680px] mx-auto grid grid-cols-1 xl:grid-cols-[minmax(560px,1fr)_390px] gap-4">
          <section className="min-w-0 min-h-[420px] sm:min-h-[520px] xl:min-h-0 overflow-hidden rounded-xl border border-border/60 bg-[#0f0f0f] shadow-lg flex flex-col">
            <div className="h-12 shrink-0 px-3 border-b border-white/10 flex items-center gap-1.5 bg-[#181818] text-white">
              <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" disabled={!browserState.canGoBack} onClick={() => window.mediaToolkit?.browserAction("back")}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" disabled={!browserState.canGoForward} onClick={() => window.mediaToolkit?.browserAction("forward")}><ChevronRight className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => window.mediaToolkit?.browserAction("reload")}><RefreshCw className={`h-4 w-4 ${browserState.loading ? "animate-spin" : ""}`} /></Button>
              <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => window.mediaToolkit?.browserAction("home")}><Home className="h-4 w-4" /></Button>
              <Input
                value={browserAddress}
                onChange={(event) => setBrowserAddress(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                    void navigateBrowserAddress();
                  }
                }}
                onFocus={(event) => event.currentTarget.select()}
                spellCheck={false}
                aria-label={t("mediaToolkit.browserAddress")}
                title={browserState.error || undefined}
                containerClassName="min-w-0 flex-1 mx-1"
                className={`h-8 rounded-full border-white/10 bg-black/25 px-4 text-[11px] focus-visible:ring-1 focus-visible:ring-white/30 ${browserState.error ? "text-red-400" : "text-white/70"}`}
              />
              <Button size="sm" className="rounded-full" disabled={!/youtube\.com\/(?:watch|shorts)|youtu\.be\//i.test(browserState.url)} onClick={() => {
                setUrl(browserState.url);
                void analyze(browserState.url);
              }}><Download className="h-3.5 w-3.5" />{t("mediaToolkit.useCurrentVideo")}</Button>
            </div>
            <div ref={browserHostRef} className="flex-1 min-h-0 bg-[#0f0f0f]" />
          </section>

          <aside className="min-w-0 min-h-0 overflow-visible xl:overflow-y-auto xl:pr-1 space-y-3">
            <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Search className="h-3.5 w-3.5" /></div>
                <div><h2 className="text-xs font-semibold">{t("mediaToolkit.currentMedia")}</h2><p className="text-[10px] text-muted-foreground">{t("mediaToolkit.currentMediaHint")}</p></div>
              </div>
              <div className="flex gap-2">
                <Input className="h-9 text-xs" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void analyze()} placeholder={t("mediaToolkit.urlPlaceholder")} />
                <Button size="sm" className="h-9" onClick={() => void analyze()} disabled={busy}>{busy && progress?.stage === "analyzing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}</Button>
              </div>
              {/[?&]list=/i.test(url || browserState.url) && (
                <Button variant="outline" size="sm" className="mt-2 w-full" disabled={busy} onClick={() => void loadPlaylist()}>
                  <ListVideo className="h-4 w-4" />{t("mediaToolkit.loadPlaylist")}
                </Button>
              )}
              {progress && busy && <div className="mt-3 space-y-1.5"><div className="flex justify-between text-[10px] text-muted-foreground"><span className="truncate mr-2">{progress.message || t(`mediaToolkit.stage.${progress.stage}`)}</span><span>{Math.round(progress.percent || 0)}%</span></div><Progress value={progress.percent || 0} /></div>}
            </section>

            <section className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <ListVideo className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold flex-1">{t("mediaToolkit.queueTitle")}</h3>
                  {queueEntries.length > 0 && <span className="text-[10px] text-muted-foreground">{selectedQueueIds.length}/{queueEntries.length}</span>}
                </div>
                <p className="text-[11px] leading-4 text-muted-foreground">{t("mediaToolkit.batchHint")}</p>
                <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-3 space-y-2">
                  <Input
                    className="h-9 text-xs"
                    value={batchUrl}
                    onChange={(event) => setBatchUrl(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && addUrlToQueue()}
                    placeholder={t("mediaToolkit.batchUrlPlaceholder")}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="h-9" onClick={addUrlToQueue} disabled={!batchUrl.trim()}>
                      <Plus className="h-4 w-4" />{t("mediaToolkit.batchAdd")}
                    </Button>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => batchFileRef.current?.click()}>
                      <FolderOpen className="h-4 w-4" />{t("mediaToolkit.batchImportTxt")}
                    </Button>
                  </div>
                  <input ref={batchFileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={(event) => void importBatchFile(event.target.files?.[0])} />
                  <p className="text-[9px] text-muted-foreground">{t("mediaToolkit.batchFetchHint")}</p>
                </div>
                {queueEntries.length > 0 ? (
                  <>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setSelectedQueueIds(queueEntries.map((entry) => entry.id))}>{t("mediaToolkit.selectAll")}</Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setSelectedQueueIds([])}>{t("mediaToolkit.clearSelection")}</Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {queueEntries.map((entry) => {
                    const selected = selectedQueueIds.includes(entry.id);
                    const config = queueConfigs[entry.id] || makeQueueConfig();
                    const editing = editingQueueId === entry.id;
                    const fetching = fetchingQueueIds.includes(entry.id);
                    const failed = failedQueueIds.includes(entry.id);
                    return (
                      <div key={entry.id} className={`rounded-xl border p-2 flex items-center gap-2 transition-colors ${editing ? "border-primary bg-primary/10" : selected ? "border-primary/25" : "border-border/60 opacity-65"}`}>
                        <button
                          type="button"
                          aria-label={selected ? t("mediaToolkit.queueDeselectVideo") : t("mediaToolkit.queueSelectVideo")}
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                          onClick={() => setSelectedQueueIds((current) => selected ? current.filter((id) => id !== entry.id) : [...current, entry.id])}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </button>
                        <button type="button" className="min-w-0 flex-1 flex items-center gap-2 text-left" onClick={() => editQueueEntry(entry.id)}>
                          {entry.thumbnail
                            ? <img src={entry.thumbnail} alt="" className="h-9 w-16 rounded object-cover bg-muted shrink-0" />
                            : <span className="h-9 w-16 rounded bg-muted flex items-center justify-center shrink-0">{fetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Film className="h-4 w-4 text-muted-foreground" />}</span>}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-medium">{entry.title}</span>
                            <span className="block truncate text-[9px] text-muted-foreground">
                              {fetching ? t("mediaToolkit.batchFetching") : failed ? t("mediaToolkit.batchFailed") : entry.duration ? durationLabel(entry.duration) : t("mediaToolkit.batchWaiting")}
                              {config.kinds.length ? ` · ${configDownloadTasks(config).length} ${t("mediaToolkit.tasks")}` : ""}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:text-destructive" onClick={() => removeQueueEntry(entry.id)} title={t("mediaToolkit.batchRemove")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  className="w-full"
                  disabled={busy || selectedQueueIds.length === 0}
                  onClick={openBatchConfig}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {queuePosition > 0
                    ? t("mediaToolkit.queueProgress", {
                        current: queuePosition,
                        total: selectedQueueTaskCount,
                      })
                    : t("mediaToolkit.downloadQueue")}
                </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 py-4 text-center text-[10px] text-muted-foreground">
                    {t("mediaToolkit.batchEmpty")}
                  </div>
                )}
              </section>

            {!activeMedia ? (
              <section className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.035] p-6 text-center">
                <div className="h-11 w-11 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><Film className="h-5 w-5" /></div>
                <h3 className="text-sm font-semibold">{t("mediaToolkit.pickVideoTitle")}</h3>
                <p className="text-xs leading-5 text-muted-foreground mt-1">{t("mediaToolkit.pickVideoHint")}</p>
              </section>
            ) : (
              <>
                <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex gap-3">
                    {activeMedia.thumbnail && <img src={activeMedia.thumbnail} alt="" className="w-24 h-14 rounded-lg object-cover bg-muted shrink-0" />}
                    <div className="min-w-0 flex-1"><h2 className="text-xs font-semibold leading-5 line-clamp-2">{activeMedia.title}</h2><div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">{activeMedia.uploader && <span className="truncate">{activeMedia.uploader}</span>}{activeMedia.duration && <span className="shrink-0">{durationLabel(activeMedia.duration)}</span>}</div></div>
                    {activeQueueEntry
                      ? <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setEditingQueueId("")} title={t("mediaToolkit.backToCurrent")}><X className="h-4 w-4" /></Button>
                      : <Button variant="ghost" size="icon" className="shrink-0" onClick={addCurrentToQueue} title={t("mediaToolkit.addQueue")}><Plus className="h-4 w-4" /></Button>}
                  </div>
                </section>

                <section ref={downloadPanelRef} className="scroll-mt-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{activeQueueEntry ? t("mediaToolkit.queueSettings") : t("mediaToolkit.downloadTitle")}</h3>
                      {activeQueueEntry && <p className="truncate text-[10px] text-muted-foreground">{activeQueueEntry.title}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["video", "audio", "subtitle", "thumbnail"] as const).map((value) => {
                      const Icon = value === "video" ? Film : value === "audio" ? FileAudio : value === "subtitle" ? Captions : ImageIcon;
                      const selected = panelConfig.kinds.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleDownloadKind(value)}
                          className={`relative rounded-xl border p-3 text-xs flex flex-col items-center gap-2 transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"}`}
                        >
                          {selected && <span className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-2.5 w-2.5" /></span>}
                          <Icon className="h-5 w-5" />{t(`mediaToolkit.kind.${value}`)}
                        </button>
                      );
                    })}
                  </div>
                  {panelConfig.kinds.includes("video") && <Field label={t("mediaToolkit.quality")}><Select value={panelConfig.quality} onValueChange={(value) => updateDownloadPanel({ quality: value as QueueDownloadConfig["quality"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["best", "1080", "720", "480"].map((value) => <SelectItem key={value} value={value}>{value === "best" ? t("mediaToolkit.best") : `${value}p`}</SelectItem>)}</SelectContent></Select></Field>}
                  {panelConfig.kinds.includes("audio") && <Field label={t("mediaToolkit.audioFormat")}><Select value={panelConfig.audioFormat} onValueChange={(value) => updateDownloadPanel({ audioFormat: value as QueueDownloadConfig["audioFormat"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["mp3", "m4a", "wav"].map((value) => <SelectItem key={value} value={value}>{value.toUpperCase()}</SelectItem>)}</SelectContent></Select></Field>}
                  {panelConfig.kinds.some((kind) => kind === "video" || kind === "audio") && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("mediaToolkit.startTime")}>
                        <Input value={panelConfig.startTime} onChange={(event) => updateDownloadPanel({ startTime: event.target.value })} placeholder={t("mediaToolkit.startTimePlaceholder")} />
                      </Field>
                      <Field label={t("mediaToolkit.endTime")}>
                        <Input value={panelConfig.endTime} onChange={(event) => updateDownloadPanel({ endTime: event.target.value })} placeholder={t("mediaToolkit.endTimePlaceholder")} />
                      </Field>
                    </div>
                  )}
                  {panelConfig.kinds.includes("subtitle") && (
                    <Field label={t("mediaToolkit.subtitleTrack")}>
                      {activeQueueEntry
                        ? <Input value={panelConfig.subtitleLanguage} onChange={(event) => updateDownloadPanel({ subtitleLanguage: event.target.value })} placeholder="vi / en / ja" />
                        : <SubtitleTrackPicker tracks={tracks} value={panelConfig.subtitleLanguage} onChange={(value) => updateDownloadPanel({ subtitleLanguage: value })} />}
                    </Field>
                  )}
                  {!activeQueueEntry && (
                    <Button className="w-full" disabled={busy || panelConfig.kinds.length === 0 || (panelConfig.kinds.includes("subtitle") && !panelConfig.subtitleLanguage)} onClick={() => void downloadSelected()}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {t("mediaToolkit.downloadTasks", { count: configDownloadTasks(panelConfig).length })}
                    </Button>
                  )}
                  {busy && <Button className="w-full" variant="outline" onClick={cancel}><Square className="h-3.5 w-3.5" />{t("mediaToolkit.cancel")}</Button>}
                </section>

                {!activeQueueEntry && tracks.length === 0 && (
                  <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">{t("mediaToolkit.generateSubtitle")}</h3></div>
                    <p className="text-xs leading-5 text-muted-foreground">{t("mediaToolkit.generateFallbackHint")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("mediaToolkit.provider")}><Select value={whisperProvider} onValueChange={(value) => setWhisperProvider(value as typeof whisperProvider)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="groq">Groq Whisper</SelectItem><SelectItem value="openai">OpenAI Whisper</SelectItem></SelectContent></Select></Field>
                      <Field label={t("mediaToolkit.sourceLanguage")}><Input value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} placeholder="auto / vi / en" /></Field>
                    </div>
                    <Field label="Whisper API key"><Input type="password" value={whisperKey} onChange={(event) => setWhisperKey(event.target.value)} placeholder={whisperProvider === "groq" ? "gsk_..." : "sk-..."} /></Field>
                    <Button variant="outline" className="w-full" disabled={busy} onClick={generateSubtitle}><Captions className="h-4 w-4" />{t("mediaToolkit.generate")}</Button>
                  </section>
                )}

                <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2"><Captions className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">{t("mediaToolkit.subtitleEditor")}</h3></div>
                  <Textarea className="min-h-52 font-mono text-[11px] leading-5 resize-y" value={srt} onChange={(event) => setSrt(event.target.value)} placeholder={t("mediaToolkit.srtPlaceholder")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" disabled={!srt.trim() || busy} onClick={() => window.mediaToolkit?.saveSubtitle({ srt, defaultName: `${activeMedia.title.replace(/[\\/:*?"<>|]+/g, "_")}.srt` })}><Download className="h-4 w-4" />{t("mediaToolkit.saveSrt")}</Button>
                    <Button variant="ghost" disabled={!lastPath} onClick={() => lastPath && window.mediaToolkit?.reveal(lastPath)}><FolderOpen className="h-4 w-4" />{t("mediaToolkit.showFile")}</Button>
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>
      </main>

      <Dialog open={batchConfigOpen} onOpenChange={(open) => {
        if (!open) closeBatchConfig();
      }}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Download className="h-5 w-5" />
            </div>
            <DialogTitle>{t("mediaToolkit.batchConfigTitle")}</DialogTitle>
            <DialogDescription>{t("mediaToolkit.batchConfigDescription", { count: selectedQueueIds.length })}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-1">
            {(["video", "audio", "subtitle", "thumbnail"] as const).map((kind) => {
              const Icon = kind === "video" ? Film : kind === "audio" ? FileAudio : kind === "subtitle" ? Captions : ImageIcon;
              const selected = batchKinds.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleBatchKind(kind)}
                  className={`relative rounded-xl border p-3 text-xs flex flex-col items-center gap-2 transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"}`}
                >
                  {selected && <span className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-2.5 w-2.5" /></span>}
                  <Icon className="h-5 w-5" />{t(`mediaToolkit.kind.${kind}`)}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {batchKinds.includes("video") && (
              <Field label={t("mediaToolkit.quality")}>
                <Select value={batchQuality} onValueChange={(value) => setBatchQuality(value as QueueDownloadConfig["quality"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["best", "1080", "720", "480"].map((value) => <SelectItem key={value} value={value}>{value === "best" ? t("mediaToolkit.best") : `${value}p`}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
            {batchKinds.includes("audio") && (
              <Field label={t("mediaToolkit.audioFormat")}>
                <Select value={batchAudioFormat} onValueChange={(value) => setBatchAudioFormat(value as QueueDownloadConfig["audioFormat"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["mp3", "m4a", "wav"].map((value) => <SelectItem key={value} value={value}>{value.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
          </div>
          {!batchHasEmbeddedTime && batchKinds.some((kind) => kind === "video" || kind === "audio") && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("mediaToolkit.startTime")}>
                <Input value={batchStartTime} onChange={(event) => setBatchStartTime(event.target.value)} placeholder={t("mediaToolkit.startTimePlaceholder")} />
              </Field>
              <Field label={t("mediaToolkit.endTime")}>
                <Input value={batchEndTime} onChange={(event) => setBatchEndTime(event.target.value)} placeholder={t("mediaToolkit.endTimePlaceholder")} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeBatchConfig}>{t("common.cancel")}</Button>
            <Button disabled={!batchKinds.length} onClick={() => void confirmBatchDownload()}>
              <FolderOpen className="h-4 w-4" />{t("mediaToolkit.batchChooseFolder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileDialog !== null} onOpenChange={(open) => {
        if (!open) closeProfileDialog();
      }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-2 ${profileDialog?.mode === "delete" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              {profileDialog?.mode === "delete" ? <Trash2 className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </div>
            <DialogTitle>{profileDialog?.mode === "delete" ? t("mediaToolkit.profile.deleteTitle") : t("mediaToolkit.profile.renameTitle")}</DialogTitle>
            <DialogDescription>
              {profileDialog?.mode === "delete"
                ? t("mediaToolkit.profile.deleteConfirm", { name: profileDraft })
                : t("mediaToolkit.profile.renameDescription")}
            </DialogDescription>
          </DialogHeader>
          {profileDialog?.mode === "rename" && (
            <Input autoFocus value={profileDraft} maxLength={40} onChange={(event) => setProfileDraft(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter") void submitProfileDialog();
            }} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeProfileDialog}>{t("common.cancel")}</Button>
            <Button
              variant={profileDialog?.mode === "delete" ? "destructive" : "default"}
              disabled={profileDialog?.mode === "rename" && !profileDraft.trim()}
              onClick={() => void submitProfileDialog()}
            >
              {profileDialog?.mode === "delete" ? t("mediaToolkit.profile.confirmDelete") : t("mediaToolkit.profile.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
