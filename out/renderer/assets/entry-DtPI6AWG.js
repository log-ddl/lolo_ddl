import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, bK as ChevronsUpDown, af as Search, a3 as Check, D as Download, U as UserRound, K as Plus, P as Pencil, d as Trash2, f as ChevronLeft, O as ChevronRight, q as RefreshCw, b0 as House, L as LoaderCircle, bL as ListVideo, a7 as FolderOpen, F as Film, X, aQ as FileHeadphone, b5 as Captions, b9 as Image, aC as Square, aZ as Sparkles } from "./lucide-react-DHCwBhKI.js";
import { t as toast, a as useI18n, B as Button, I as Input, F as FeatureRail, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, y as DialogDescription, k as DialogFooter } from "./index-ld1jMZXM.js";
import { F as FeatureHeaderIcon } from "./FeatureHeaderIcon-DurhyC1w.js";
import { P as Progress } from "./progress-CoGwezcY.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-ZlGxq1Za.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import { L as Label } from "./label-DOUrVQeY.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CuPNgqie.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
function durationLabel(seconds) {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = Math.floor(seconds % 60);
  return [hours, minutes, rest].filter((_, index) => index > 0 || hours > 0).map((value) => String(value).padStart(2, "0")).join(":");
}
function nextJob(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function configDownloadTasks(config) {
  return config.kinds.map((kind) => ({ kind }));
}
function isValidTime(value) {
  return /^\d+(?::[0-5]?\d){1,2}(?:\.\d+)?$/.test(value.trim());
}
function splitTimeRange(line) {
  const trimmed = line.trim();
  const space = trimmed.search(/\s/);
  if (space === -1) return { url: trimmed, range: "" };
  return { url: trimmed.slice(0, space).trim(), range: trimmed.slice(space + 1).trim() };
}
function parseTimeRange(token) {
  const value = token.trim();
  if (!value) return null;
  const dash = value.split("-");
  if (dash.length === 2 && isValidTime(dash[0]) && (dash[1] === "" || isValidTime(dash[1]))) {
    return { startTime: dash[0], endTime: dash[1] || "" };
  }
  const parts = value.split(":");
  if (parts.length === 4) {
    const start = parts.slice(0, 2).join(":");
    const end = parts.slice(2).join(":");
    if (isValidTime(start) && isValidTime(end)) return { startTime: start, endTime: end };
  }
  if (parts.length === 6) {
    const start = parts.slice(0, 3).join(":");
    const end = parts.slice(3).join(":");
    if (isValidTime(start) && isValidTime(end)) return { startTime: start, endTime: end };
  }
  if (isValidTime(value)) return { startTime: value, endTime: "" };
  return null;
}
function sleep(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
function useDownloadQueue({
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
  t
}) {
  const [queueEntries, setQueueEntries] = reactExports.useState([]);
  const [selectedQueueIds, setSelectedQueueIds] = reactExports.useState([]);
  const [queueConfigs, setQueueConfigs] = reactExports.useState({});
  const [editingQueueId, setEditingQueueId] = reactExports.useState("");
  const [queuePosition, setQueuePosition] = reactExports.useState(0);
  const [batchUrl, setBatchUrl] = reactExports.useState("");
  const [fetchingQueueIds, setFetchingQueueIds] = reactExports.useState([]);
  const [failedQueueIds, setFailedQueueIds] = reactExports.useState([]);
  const [batchConfigOpen, setBatchConfigOpen] = reactExports.useState(false);
  const [batchKinds, setBatchKinds] = reactExports.useState(["video"]);
  const [batchQuality, setBatchQuality] = reactExports.useState("1080");
  const [batchAudioFormat, setBatchAudioFormat] = reactExports.useState("mp3");
  const [batchStartTime, setBatchStartTime] = reactExports.useState("");
  const [batchEndTime, setBatchEndTime] = reactExports.useState("");
  const batchFileRef = reactExports.useRef(null);
  const activeQueueJobIds = reactExports.useRef(/* @__PURE__ */ new Set());
  function makeQueueConfig() {
    return {
      kinds: selectedKinds.length ? [...selectedKinds] : ["video"],
      quality,
      audioFormat,
      subtitleLanguage,
      startTime,
      endTime
    };
  }
  function updateQueueConfig(entryId, patch) {
    setQueueConfigs((current) => ({
      ...current,
      [entryId]: { ...current[entryId] || makeQueueConfig(), ...patch }
    }));
  }
  function toggleQueueConfigKind(entryId, value) {
    const config = queueConfigs[entryId] || makeQueueConfig();
    updateQueueConfig(entryId, {
      kinds: config.kinds.includes(value) ? config.kinds.filter((item) => item !== value) : [...config.kinds, value]
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
    const entry = {
      id: info.id,
      title: info.title,
      url: info.webpageUrl,
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader
    };
    setQueueEntries((current) => [...current, entry]);
    setSelectedQueueIds((current) => current.includes(entry.id) ? current : [...current, entry.id]);
    setQueueConfigs((current) => current[entry.id] ? current : { ...current, [entry.id]: makeQueueConfig() });
    setEditingQueueId(entry.id);
    globalThis.setTimeout(() => downloadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    toast.success(t("mediaToolkit.queueAdded"));
  }
  function addUrlsToQueue(candidates) {
    const existingUrls = new Set(queueEntries.map((entry) => entry.url.trim()));
    const seen = /* @__PURE__ */ new Set();
    const parsed = candidates.map((candidate) => {
      const { url: url2, range } = splitTimeRange(candidate);
      const time = parseTimeRange(range);
      return {
        url: url2,
        startTime: time?.startTime || "",
        endTime: time?.endTime || ""
      };
    }).filter(({ url: url2 }) => {
      if (!/^https?:\/\//i.test(url2) || existingUrls.has(url2) || seen.has(url2)) return false;
      seen.add(url2);
      return true;
    });
    if (!parsed.length) return 0;
    const entries = parsed.map((candidate) => ({
      id: nextJob("batch"),
      title: candidate.url,
      url: candidate.url
    }));
    setQueueEntries((current) => [...current, ...entries]);
    setSelectedQueueIds((current) => [...current, ...entries.map((entry) => entry.id)]);
    setQueueConfigs((current) => ({
      ...current,
      ...Object.fromEntries(entries.map((entry, index) => [
        entry.id,
        { ...makeQueueConfig(), startTime: parsed[index].startTime, endTime: parsed[index].endTime }
      ]))
    }));
    return entries.length;
  }
  function addUrlToQueue() {
    const { url: url2 } = splitTimeRange(batchUrl);
    if (!/^https?:\/\//i.test(url2)) return toast.error(t("mediaToolkit.invalidUrl"));
    const count = addUrlsToQueue([batchUrl]);
    setBatchUrl("");
    if (count) toast.success(t("mediaToolkit.queueAdded"));
  }
  async function importBatchFile(file) {
    if (!file) return;
    const content = await file.text();
    const count = addUrlsToQueue(content.split(/\r?\n/));
    if (batchFileRef.current) batchFileRef.current.value = "";
    if (count) toast.success(t("mediaToolkit.batchImported", { count }));
    else toast.error(t("mediaToolkit.batchNoValidUrl"));
  }
  function removeQueueEntry(entryId) {
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
    setBatchStartTime("");
    setBatchEndTime("");
    setBatchConfigOpen(true);
    void window.mediaToolkit?.hideBrowser();
  }
  function closeBatchConfig() {
    setBatchConfigOpen(false);
    globalThis.setTimeout(() => updateBrowserBounds(true), 160);
  }
  function toggleBatchKind(kind) {
    setBatchKinds((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]);
  }
  async function confirmBatchDownload() {
    if (!batchKinds.length) return;
    const config = {
      kinds: [...batchKinds],
      quality: batchQuality,
      audioFormat: batchAudioFormat,
      subtitleLanguage: "",
      startTime: batchStartTime,
      endTime: batchEndTime
    };
    setQueueConfigs((current) => ({
      ...current,
      ...Object.fromEntries(selectedQueueIds.map((id) => {
        const own = current[id];
        const hasOwnTime = Boolean(own && (own.startTime?.trim() || own.endTime?.trim()));
        return [id, {
          ...config,
          ...hasOwnTime ? { startTime: own.startTime, endTime: own.endTime } : {},
          kinds: [...config.kinds]
        }];
      }))
    }));
    closeBatchConfig();
    await downloadQueue(config);
  }
  async function downloadQueue(configOverride) {
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
    const processEntry = async (entry) => {
      let config = configOverride ? { ...configOverride, kinds: [...configOverride.kinds] } : queueConfigs[entry.id] || makeQueueConfig();
      const own = configOverride ? queueConfigs[entry.id] : void 0;
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
          title: metadata.info.title,
          url: metadata.info.webpageUrl || item.url,
          thumbnail: metadata.info.thumbnail,
          duration: metadata.info.duration,
          uploader: metadata.info.uploader
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
          audioFormat: queueKind === "audio" ? config.audioFormat : void 0,
          subtitleLanguage: config.subtitleLanguage,
          startTime: config.startTime,
          endTime: config.endTime,
          includeAutomatic: true
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
    let next = 0;
    const workers = Array.from({ length: Math.min(2, selectedEntries.length) }, async () => {
      while (next < selectedEntries.length && !canceled) {
        const entry = selectedEntries[next];
        next += 1;
        await sleep(1e3 + Math.random() * 1e3);
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
    queueEntries,
    setQueueEntries,
    selectedQueueIds,
    setSelectedQueueIds,
    queueConfigs,
    editingQueueId,
    setEditingQueueId,
    queuePosition,
    batchUrl,
    setBatchUrl,
    fetchingQueueIds,
    failedQueueIds,
    batchConfigOpen,
    batchKinds,
    batchQuality,
    setBatchQuality,
    batchAudioFormat,
    setBatchAudioFormat,
    batchStartTime,
    setBatchStartTime,
    batchEndTime,
    setBatchEndTime,
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
    cancelQueueDownloads
  };
}
function Field({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    children
  ] });
}
function SubtitleTrackPicker({
  tracks,
  value,
  onChange
}) {
  const { t } = useI18n();
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const selected = tracks.find((track) => track.language === value);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTracks = normalizedQuery ? tracks.filter((track) => `${track.label} ${track.language}`.toLocaleLowerCase().includes(normalizedQuery)) : tracks;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Popover,
    {
      open,
      onOpenChange: (nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", role: "combobox", "aria-expanded": open, className: "w-full justify-between px-3 font-normal", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-left", children: selected ? `${selected.label} (${selected.language})${selected.automatic ? ` · ${t("mediaToolkit.auto")}` : ""}` : t("mediaToolkit.noSubtitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "start", className: "w-[var(--radix-popover-trigger-width)] p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                autoFocus: true,
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: t("mediaToolkit.searchSubtitle"),
                className: "h-9 pl-8"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto", children: filteredTracks.length > 0 ? filteredTracks.map((track) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
              onClick: () => {
                onChange(track.language);
                setOpen(false);
                setQuery("");
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: `h-4 w-4 shrink-0 ${track.language === value ? "opacity-100" : "opacity-0"}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: track.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                  track.language,
                  track.automatic ? ` · ${t("mediaToolkit.auto")}` : ""
                ] })
              ]
            },
            track.language
          )) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-6 text-center text-sm text-muted-foreground", children: t("mediaToolkit.noSubtitleMatch") }) })
        ] })
      ]
    }
  );
}
function MediaToolkitFeature({ embedded = false }) {
  const { t } = useI18n();
  const [url, setUrl] = reactExports.useState("");
  const [info, setInfo] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const [activeJob, setActiveJob] = reactExports.useState("");
  const [progress, setProgress] = reactExports.useState(null);
  const [selectedKinds, setSelectedKinds] = reactExports.useState(["video"]);
  const [quality, setQuality] = reactExports.useState("1080");
  const [audioFormat, setAudioFormat] = reactExports.useState("mp3");
  const [subtitleLanguage, setSubtitleLanguage] = reactExports.useState("");
  const [startTime, setStartTime] = reactExports.useState("");
  const [endTime, setEndTime] = reactExports.useState("");
  const [lastPath, setLastPath] = reactExports.useState("");
  const [srt, setSrt] = reactExports.useState("");
  const [whisperProvider, setWhisperProvider] = reactExports.useState("groq");
  const [whisperKey, setWhisperKey] = reactExports.useState("");
  const [sourceLanguage, setSourceLanguage] = reactExports.useState("");
  const browserHostRef = reactExports.useRef(null);
  const [browserState, setBrowserState] = reactExports.useState({
    url: "https://www.youtube.com/",
    title: "YouTube",
    canGoBack: false,
    canGoForward: false,
    loading: true
  });
  const [browserAddress, setBrowserAddress] = reactExports.useState("https://www.youtube.com/");
  const [profileState, setProfileState] = reactExports.useState({ activeProfileId: "default", profiles: [] });
  const [profileDialog, setProfileDialog] = reactExports.useState(null);
  const [profileDraft, setProfileDraft] = reactExports.useState("");
  const downloadPanelRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    return window.mediaToolkit?.onProgress((event) => {
      setProgress(event);
    });
  }, []);
  const updateBrowserBounds = reactExports.useCallback((show = false) => {
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
      height: Math.max(0, Math.round(bottom - top))
    };
    if (show) void api.showBrowser(bounds);
    else void api.setBrowserBounds(bounds);
  }, []);
  reactExports.useEffect(() => {
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
  async function switchProfile(profileId) {
    const state = await window.mediaToolkit?.switchProfile(profileId);
    if (state) {
      setProfileState(state);
      setInfo(null);
      setUrl("");
      setSrt("");
    }
  }
  function openProfileDialog(mode) {
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
  const tracks = reactExports.useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return (info?.subtitles || []).filter((track) => {
      if (seen.has(track.language)) return false;
      seen.add(track.language);
      return true;
    });
  }, [info]);
  const {
    queueEntries,
    selectedQueueIds,
    setSelectedQueueIds,
    queueConfigs,
    editingQueueId,
    setEditingQueueId,
    queuePosition,
    batchUrl,
    setBatchUrl,
    fetchingQueueIds,
    failedQueueIds,
    batchConfigOpen,
    batchKinds,
    batchQuality,
    setBatchQuality,
    batchAudioFormat,
    setBatchAudioFormat,
    batchStartTime,
    setBatchStartTime,
    batchEndTime,
    setBatchEndTime,
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
    cancelQueueDownloads
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
    t
  });
  function toggleDownloadKind(value) {
    if (editingQueueId) {
      toggleQueueConfigKind(editingQueueId, value);
      return;
    }
    setSelectedKinds((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }
  function updateDownloadPanel(patch) {
    if (editingQueueId) {
      updateQueueConfig(editingQueueId, patch);
      return;
    }
    if (patch.kinds) setSelectedKinds(patch.kinds);
    if (patch.quality) setQuality(patch.quality);
    if (patch.audioFormat) setAudioFormat(patch.audioFormat);
    if (patch.subtitleLanguage !== void 0) setSubtitleLanguage(patch.subtitleLanguage);
    if (patch.startTime !== void 0) setStartTime(patch.startTime);
    if (patch.endTime !== void 0) setEndTime(patch.endTime);
  }
  function editQueueEntry(entryId) {
    setEditingQueueId(entryId);
    setSelectedQueueIds((current) => current.includes(entryId) ? current : [...current, entryId]);
    globalThis.setTimeout(() => downloadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  async function downloadSelected() {
    if (!window.mediaToolkit) return;
    const queueEntry = queueEntries.find((entry) => entry.id === editingQueueId);
    const targetUrl = queueEntry?.url || info?.webpageUrl;
    const config = queueEntry ? queueConfigs[queueEntry.id] || makeQueueConfig() : makeQueueConfig();
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
          audioFormat: selectedKind === "audio" ? config.audioFormat : void 0,
          subtitleLanguage: config.subtitleLanguage,
          startTime: config.startTime,
          endTime: config.endTime,
          includeAutomatic: true
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
  async function download(selectedKind) {
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
        audioFormat: selectedKind === "audio" ? audioFormat : void 0,
        subtitleLanguage,
        includeAutomatic: true
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
        language: sourceLanguage.trim() || void 0
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
  const panelConfig = activeQueueEntry ? queueConfigs[activeQueueEntry.id] || makeQueueConfig() : makeQueueConfig();
  const selectedQueueTaskCount = selectedQueueIds.reduce((total, id) => {
    const config = queueConfigs[id];
    return total + (config ? configDownloadTasks(config).length : 0);
  }, 0);
  const batchHasEmbeddedTime = selectedQueueIds.some((id) => {
    const config = queueConfigs[id];
    return Boolean(config && (config.startTime?.trim() || config.endTime?.trim()));
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full bg-background text-foreground", children: [
    !embedded && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureRail, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-16 shrink-0 border-b border-border/60 bg-panel/80 backdrop-blur-xl px-5 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { icon: Download }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-semibold", children: t("mediaToolkit.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("mediaToolkit.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "h-4 w-4 text-muted-foreground mr-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: profileState.activeProfileId, onValueChange: (value) => void switchProfile(value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-40 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("mediaToolkit.profile.select") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: profileState.profiles.map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: profile.id, children: profile.name }, profile.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => void createProfile(), title: t("mediaToolkit.profile.create"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openProfileDialog("rename"), disabled: !profileState.profiles.length, title: t("mediaToolkit.profile.rename"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "hover:text-destructive", onClick: () => openProfileDialog("delete"), disabled: profileState.profiles.length <= 1, title: t("mediaToolkit.profile.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 min-h-0 overflow-y-auto xl:overflow-hidden p-2 sm:p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-full xl:h-full max-w-[1680px] mx-auto grid grid-cols-1 xl:grid-cols-[minmax(560px,1fr)_390px] gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "min-w-0 min-h-[420px] sm:min-h-[520px] xl:min-h-0 overflow-hidden rounded-xl border border-border/60 bg-[#0f0f0f] shadow-lg flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-12 shrink-0 px-3 border-b border-white/10 flex items-center gap-1.5 bg-[#181818] text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "text-white/70 hover:text-white hover:bg-white/10", disabled: !browserState.canGoBack, onClick: () => window.mediaToolkit?.browserAction("back"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "text-white/70 hover:text-white hover:bg-white/10", disabled: !browserState.canGoForward, onClick: () => window.mediaToolkit?.browserAction("forward"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "text-white/70 hover:text-white hover:bg-white/10", onClick: () => window.mediaToolkit?.browserAction("reload"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${browserState.loading ? "animate-spin" : ""}` }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "text-white/70 hover:text-white hover:bg-white/10", onClick: () => window.mediaToolkit?.browserAction("home"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: browserAddress,
                onChange: (event) => setBrowserAddress(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                    void navigateBrowserAddress();
                  }
                },
                onFocus: (event) => event.currentTarget.select(),
                spellCheck: false,
                "aria-label": t("mediaToolkit.browserAddress"),
                title: browserState.error || void 0,
                containerClassName: "min-w-0 flex-1 mx-1",
                className: `h-8 rounded-full border-white/10 bg-black/25 px-4 text-2xs focus-visible:ring-1 focus-visible:ring-white/30 ${browserState.error ? "text-red-400" : "text-white/70"}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "rounded-full", disabled: !/youtube\.com\/(?:watch|shorts)|youtu\.be\//i.test(browserState.url), onClick: () => {
              setUrl(browserState.url);
              void analyze(browserState.url);
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
              t("mediaToolkit.useCurrentVideo")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: browserHostRef, className: "flex-1 min-h-0 bg-[#0f0f0f]" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "min-w-0 min-h-0 overflow-visible xl:overflow-y-auto xl:pr-1 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card p-4 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-semibold", children: t("mediaToolkit.currentMedia") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("mediaToolkit.currentMediaHint") })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: url, onChange: (event) => setUrl(event.target.value), onKeyDown: (event) => event.key === "Enter" && void analyze(), placeholder: t("mediaToolkit.urlPlaceholder") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "h-9", onClick: () => void analyze(), disabled: busy, children: busy && progress?.stage === "analyzing" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-3.5 w-3.5" }) })
            ] }),
            /[?&]list=/i.test(url || browserState.url) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "mt-2 w-full", disabled: busy, onClick: () => void loadPlaylist(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ListVideo, { className: "h-4 w-4" }),
              t("mediaToolkit.loadPlaylist")
            ] }),
            progress && busy && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-2xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate mr-2", children: progress.message || t(`mediaToolkit.stage.${progress.stage}`) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  Math.round(progress.percent || 0),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress.percent || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-primary/20 bg-card p-4 shadow-sm space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ListVideo, { className: "h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold flex-1", children: t("mediaToolkit.queueTitle") }),
              queueEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
                selectedQueueIds.length,
                "/",
                queueEntries.length
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-4 text-muted-foreground", children: t("mediaToolkit.batchHint") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/20 bg-primary/[0.035] p-3 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  className: "h-9 text-xs",
                  value: batchUrl,
                  onChange: (event) => setBatchUrl(event.target.value),
                  onKeyDown: (event) => event.key === "Enter" && addUrlToQueue(),
                  placeholder: t("mediaToolkit.batchUrlPlaceholder")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9", onClick: addUrlToQueue, disabled: !batchUrl.trim(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                  t("mediaToolkit.batchAdd")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9", onClick: () => batchFileRef.current?.click(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-4 w-4" }),
                  t("mediaToolkit.batchImportTxt")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: batchFileRef, type: "file", accept: ".txt,text/plain", className: "hidden", onChange: (event) => void importBatchFile(event.target.files?.[0]) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("mediaToolkit.batchFetchHint") })
            ] }),
            queueEntries.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "flex-1", onClick: () => setSelectedQueueIds(queueEntries.map((entry) => entry.id)), children: t("mediaToolkit.selectAll") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "flex-1", onClick: () => setSelectedQueueIds([]), children: t("mediaToolkit.clearSelection") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-60 overflow-y-auto space-y-1.5 pr-1", children: queueEntries.map((entry) => {
                const selected = selectedQueueIds.includes(entry.id);
                const config = queueConfigs[entry.id] || makeQueueConfig();
                const editing = editingQueueId === entry.id;
                const fetching = fetchingQueueIds.includes(entry.id);
                const failed = failedQueueIds.includes(entry.id);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border p-2 flex items-center gap-2 transition-colors ${editing ? "border-primary bg-primary/10" : selected ? "border-primary/25" : "border-border/60 opacity-65"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      "aria-label": selected ? t("mediaToolkit.queueDeselectVideo") : t("mediaToolkit.queueSelectVideo"),
                      className: `h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary text-primary-foreground" : "border-border"}`,
                      onClick: () => setSelectedQueueIds((current) => selected ? current.filter((id) => id !== entry.id) : [...current, entry.id]),
                      children: selected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "min-w-0 flex-1 flex items-center gap-2 text-left", onClick: () => editQueueEntry(entry.id), children: [
                    entry.thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: entry.thumbnail, alt: "", className: "h-9 w-16 rounded object-cover bg-muted shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-9 w-16 rounded bg-muted flex items-center justify-center shrink-0", children: fetching ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-4 w-4 text-muted-foreground" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-2xs font-medium", children: entry.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block truncate text-2xs text-muted-foreground", children: [
                        fetching ? t("mediaToolkit.batchFetching") : failed ? t("mediaToolkit.batchFailed") : entry.duration ? durationLabel(entry.duration) : t("mediaToolkit.batchWaiting"),
                        config.kinds.length ? ` · ${configDownloadTasks(config).length} ${t("mediaToolkit.tasks")}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 shrink-0 text-muted-foreground" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "h-7 w-7 shrink-0 hover:text-destructive", onClick: () => removeQueueEntry(entry.id), title: t("mediaToolkit.batchRemove"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }) })
                ] }, entry.id);
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  className: "w-full",
                  disabled: busy || selectedQueueIds.length === 0,
                  onClick: openBatchConfig,
                  children: [
                    busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                    queuePosition > 0 ? t("mediaToolkit.queueProgress", {
                      current: queuePosition,
                      total: selectedQueueTaskCount
                    }) : t("mediaToolkit.downloadQueue")
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border/60 py-4 text-center text-2xs text-muted-foreground", children: t("mediaToolkit.batchEmpty") })
          ] }),
          !activeMedia ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-dashed border-primary/25 bg-primary/[0.035] p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-11 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: t("mediaToolkit.pickVideoTitle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-5 text-muted-foreground mt-1", children: t("mediaToolkit.pickVideoHint") })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border/60 bg-card p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
              activeMedia.thumbnail && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activeMedia.thumbnail, alt: "", className: "w-24 h-14 rounded-lg object-cover bg-muted shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-semibold leading-5 line-clamp-2", children: activeMedia.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex gap-2 text-2xs text-muted-foreground", children: [
                  activeMedia.uploader && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: activeMedia.uploader }),
                  activeMedia.duration && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: durationLabel(activeMedia.duration) })
                ] })
              ] }),
              activeQueueEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "shrink-0", onClick: () => setEditingQueueId(""), title: t("mediaToolkit.backToCurrent"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "shrink-0", onClick: addCurrentToQueue, title: t("mediaToolkit.addQueue"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: downloadPanelRef, className: "scroll-mt-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: activeQueueEntry ? t("mediaToolkit.queueSettings") : t("mediaToolkit.downloadTitle") }),
                  activeQueueEntry && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-2xs text-muted-foreground", children: activeQueueEntry.title })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["video", "audio", "subtitle", "thumbnail"].map((value) => {
                const Icon = value === "video" ? Film : value === "audio" ? FileHeadphone : value === "subtitle" ? Captions : Image;
                const selected = panelConfig.kinds.includes(value);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    "aria-pressed": selected,
                    onClick: () => toggleDownloadKind(value),
                    className: `relative rounded-xl border p-3 text-xs flex flex-col items-center gap-2 transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"}`,
                    children: [
                      selected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-2.5 w-2.5" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }),
                      t(`mediaToolkit.kind.${value}`)
                    ]
                  },
                  value
                );
              }) }),
              panelConfig.kinds.includes("video") && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.quality"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: panelConfig.quality, onValueChange: (value) => updateDownloadPanel({ quality: value }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ["best", "1080", "720", "480"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: value === "best" ? t("mediaToolkit.best") : `${value}p` }, value)) })
              ] }) }),
              panelConfig.kinds.includes("audio") && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.audioFormat"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: panelConfig.audioFormat, onValueChange: (value) => updateDownloadPanel({ audioFormat: value }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ["mp3", "m4a", "wav"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: value.toUpperCase() }, value)) })
              ] }) }),
              panelConfig.kinds.some((kind) => kind === "video" || kind === "audio") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.startTime"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: panelConfig.startTime, onChange: (event) => updateDownloadPanel({ startTime: event.target.value }), placeholder: t("mediaToolkit.startTimePlaceholder") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.endTime"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: panelConfig.endTime, onChange: (event) => updateDownloadPanel({ endTime: event.target.value }), placeholder: t("mediaToolkit.endTimePlaceholder") }) })
              ] }),
              panelConfig.kinds.includes("subtitle") && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.subtitleTrack"), children: activeQueueEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: panelConfig.subtitleLanguage, onChange: (event) => updateDownloadPanel({ subtitleLanguage: event.target.value }), placeholder: "vi / en / ja" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SubtitleTrackPicker, { tracks, value: panelConfig.subtitleLanguage, onChange: (value) => updateDownloadPanel({ subtitleLanguage: value }) }) }),
              !activeQueueEntry && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", disabled: busy || panelConfig.kinds.length === 0 || panelConfig.kinds.includes("subtitle") && !panelConfig.subtitleLanguage, onClick: () => void downloadSelected(), children: [
                busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                t("mediaToolkit.downloadTasks", { count: configDownloadTasks(panelConfig).length })
              ] }),
              busy && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", variant: "outline", onClick: cancel, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }),
                t("mediaToolkit.cancel")
              ] })
            ] }),
            !activeQueueEntry && tracks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: t("mediaToolkit.generateSubtitle") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-5 text-muted-foreground", children: t("mediaToolkit.generateFallbackHint") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.provider"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: whisperProvider, onValueChange: (value) => setWhisperProvider(value), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "groq", children: "Groq Whisper" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "openai", children: "OpenAI Whisper" })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.sourceLanguage"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sourceLanguage, onChange: (event) => setSourceLanguage(event.target.value), placeholder: "auto / vi / en" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Whisper API key", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: whisperKey, onChange: (event) => setWhisperKey(event.target.value), placeholder: whisperProvider === "groq" ? "gsk_..." : "sk-..." }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full", disabled: busy, onClick: generateSubtitle, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Captions, { className: "h-4 w-4" }),
                t("mediaToolkit.generate")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Captions, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: t("mediaToolkit.subtitleEditor") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { className: "min-h-52 font-mono text-2xs leading-5 resize-y", value: srt, onChange: (event) => setSrt(event.target.value), placeholder: t("mediaToolkit.srtPlaceholder") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: !srt.trim() || busy, onClick: () => window.mediaToolkit?.saveSubtitle({ srt, defaultName: `${activeMedia.title.replace(/[\\/:*?"<>|]+/g, "_")}.srt` }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                  t("mediaToolkit.saveSrt")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", disabled: !lastPath, onClick: () => lastPath && window.mediaToolkit?.reveal(lastPath), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-4 w-4" }),
                  t("mediaToolkit.showFile")
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: batchConfigOpen, onOpenChange: (open) => {
        if (!open) closeBatchConfig();
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("mediaToolkit.batchConfigTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("mediaToolkit.batchConfigDescription", { count: selectedQueueIds.length }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2 py-1", children: ["video", "audio", "subtitle", "thumbnail"].map((kind) => {
          const Icon = kind === "video" ? Film : kind === "audio" ? FileHeadphone : kind === "subtitle" ? Captions : Image;
          const selected = batchKinds.includes(kind);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "aria-pressed": selected,
              onClick: () => toggleBatchKind(kind),
              className: `relative rounded-xl border p-3 text-xs flex flex-col items-center gap-2 transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"}`,
              children: [
                selected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-2.5 w-2.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }),
                t(`mediaToolkit.kind.${kind}`)
              ]
            },
            kind
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          batchKinds.includes("video") && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.quality"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: batchQuality, onValueChange: (value) => setBatchQuality(value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ["best", "1080", "720", "480"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: value === "best" ? t("mediaToolkit.best") : `${value}p` }, value)) })
          ] }) }),
          batchKinds.includes("audio") && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.audioFormat"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: batchAudioFormat, onValueChange: (value) => setBatchAudioFormat(value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ["mp3", "m4a", "wav"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: value.toUpperCase() }, value)) })
          ] }) })
        ] }),
        !batchHasEmbeddedTime && batchKinds.some((kind) => kind === "video" || kind === "audio") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.startTime"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: batchStartTime, onChange: (event) => setBatchStartTime(event.target.value), placeholder: t("mediaToolkit.startTimePlaceholder") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: t("mediaToolkit.endTime"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: batchEndTime, onChange: (event) => setBatchEndTime(event.target.value), placeholder: t("mediaToolkit.endTimePlaceholder") }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: closeBatchConfig, children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: !batchKinds.length, onClick: () => void confirmBatchDownload(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-4 w-4" }),
            t("mediaToolkit.batchChooseFolder")
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: profileDialog !== null, onOpenChange: (open) => {
        if (!open) closeProfileDialog();
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-11 w-11 rounded-xl flex items-center justify-center mb-2 ${profileDialog?.mode === "delete" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`, children: profileDialog?.mode === "delete" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: profileDialog?.mode === "delete" ? t("mediaToolkit.profile.deleteTitle") : t("mediaToolkit.profile.renameTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: profileDialog?.mode === "delete" ? t("mediaToolkit.profile.deleteConfirm", { name: profileDraft }) : t("mediaToolkit.profile.renameDescription") })
        ] }),
        profileDialog?.mode === "rename" && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { autoFocus: true, value: profileDraft, maxLength: 40, onChange: (event) => setProfileDraft(event.target.value), onKeyDown: (event) => {
          if (event.key === "Enter") void submitProfileDialog();
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: closeProfileDialog, children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: profileDialog?.mode === "delete" ? "destructive" : "default",
              disabled: profileDialog?.mode === "rename" && !profileDraft.trim(),
              onClick: () => void submitProfileDialog(),
              children: profileDialog?.mode === "delete" ? t("mediaToolkit.profile.confirmDelete") : t("mediaToolkit.profile.save")
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
export {
  MediaToolkitFeature as default
};
