import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { c as cn, a as useI18n, t as toast, B as Button, I as Input } from "./index-DI8hnspe.js";
import { u as useAutoVideoStore } from "./auto-video-store-kYjrHdTY.js";
import { r as reactExports, L as LoaderCircle, X, aQ as FileHeadphone, A as AudioLines, bE as Mic, v as ExternalLink, aZ as Sparkles, x as FileText, bF as FileSpreadsheet, m as ArrowRight, bG as TriangleAlert, a7 as FolderOpen, J as ArrowLeft, b9 as Image, b5 as Captions, b8 as Music, aC as Square, t as CircleCheck, _ as Play, q as RefreshCw, u as CircleAlert, a6 as Copy } from "./lucide-react-DHCwBhKI.js";
import { L as Label } from "./label-CEtfDDyg.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import { P as Progress } from "./progress-CiMxjjHG.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { G as GEMINI_VOICES, a as GEMINI_LANGUAGES } from "./gemini-voices-CGiUf3fL.js";
import { C as CAPCUT_API_VOICES } from "./model-registry-B3C-u_uk.js";
import { S as Switch } from "./switch-CJ1y8I_b.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
const WHISPER_PROVIDERS = {
  groq: {
    id: "groq",
    label: "Groq Whisper Turbo",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "whisper-large-v3-turbo",
    apiKeyHint: "gsk_...",
    apiKeyDocsUrl: "https://console.groq.com/keys",
    maxFileBytes: 25 * 1024 * 1024
  },
  openai: {
    id: "openai",
    label: "OpenAI Whisper",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "whisper-1",
    apiKeyHint: "sk-...",
    apiKeyDocsUrl: "https://platform.openai.com/api-keys",
    maxFileBytes: 25 * 1024 * 1024
  }
};
const WHISPER_PROVIDER_ORDER = ["groq", "openai"];
const AUDIO_EXTS$1 = ["mp3", "wav", "m4a", "flac", "ogg"];
const VIDEO_EXTS$1 = ["mp4", "mov", "mkv", "webm"];
const TTS_ENGINE_OPTIONS = [
  {
    id: "omnivoice",
    labelKey: "autoVideo.ttsGen.omnivoice",
    model: { id: "omnivoice-main", repository: "k2-fsa/OmniVoice", capability: "omnivoice", mode: "auto" }
  },
  {
    id: "capcut",
    labelKey: "autoVideo.ttsGen.capcut",
    model: { id: "capcut-online", repository: "https://editor-api-sg.capcutapi.com", capability: "capcut", mode: "preset" }
  },
  {
    id: "gemini",
    labelKey: "autoVideo.ttsGen.gemini",
    model: { id: "gemini-3.1-flash-tts-preview", repository: "https://generativelanguage.googleapis.com", capability: "gemini", mode: "preset" }
  }
];
const CAPCUT_VI_VOICES = CAPCUT_API_VOICES.filter((voice) => voice.languageCode?.toLowerCase().startsWith("vi"));
const DEFAULT_CAPCUT_VOICE = CAPCUT_VI_VOICES[0]?.voiceType ?? "";
function getCapCutVoice(voiceType) {
  return CAPCUT_API_VOICES.find((voice) => voice.voiceType === voiceType);
}
function formatBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function formatDuration(sec) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function Section({
  title,
  icon,
  right,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold flex items-center gap-2", children: [
        icon,
        title
      ] }),
      right
    ] }),
    children
  ] });
}
function DropZone({
  hint,
  onDrop,
  onClick,
  busy
}) {
  const [over, setOver] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      onClick,
      onDragOver: (e) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e) => {
        setOver(false);
        onDrop(e);
      },
      className: cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        over ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground flex items-center justify-center gap-2", children: [
        busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : null,
        hint
      ] })
    }
  );
}
function ModeChip({
  active,
  onClick,
  label,
  disabled
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      className: cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground",
        disabled && "opacity-40 pointer-events-none"
      ),
      children: label
    }
  );
}
function ProviderChip({
  provider,
  active,
  onClick
}) {
  const cfg = WHISPER_PROVIDERS[provider];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      className: cn(
        "flex-1 px-3 py-2 rounded-lg border text-left transition-colors",
        active ? "bg-primary/10 border-primary" : "bg-muted/30 border-border hover:bg-muted/50"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: cfg.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground mt-0.5", children: cfg.defaultModel })
      ]
    }
  );
}
const ROW_IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];
function CsvPreviewRow({
  row,
  edit,
  showVideo,
  onVoiceChange,
  onPickImage,
  onClearImage,
  onPickVideo,
  onClearVideo
}) {
  const { t } = useI18n();
  const imageInputRef = reactExports.useRef(null);
  const videoInputRef = reactExports.useRef(null);
  const voiceValue = edit?.voice ?? row.voice;
  const imagePath = edit?.imagePath !== void 0 ? edit.imagePath : row.imagePath;
  const videoPath = edit?.videoPath !== void 0 ? edit.videoPath : row.videoPath;
  const dirty = edit !== void 0 && (edit.voice !== void 0 && edit.voice !== row.voice || edit.imagePath !== void 0 && edit.imagePath !== row.imagePath || edit.videoPath !== void 0 && edit.videoPath !== row.videoPath);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: cn("border-t align-top hover:bg-muted/30", dirty && "bg-amber-500/5"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground", children: row.index }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        value: voiceValue,
        onChange: (e) => onVoiceChange(e.target.value),
        className: "w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -mx-1 text-xs",
        placeholder: "—"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      imagePath ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => imageInputRef.current?.click(),
            className: "flex-1 truncate text-left hover:text-foreground transition-colors",
            title: imagePath,
            children: imagePath.split(/[\\/]/).pop()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClearImage,
            className: "opacity-50 hover:opacity-100",
            title: t("autoVideo.import.clearImage"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => imageInputRef.current?.click(),
          className: "text-left italic opacity-60 hover:opacity-100 hover:text-foreground transition-colors",
          children: t("autoVideo.import.chooseImage")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: imageInputRef,
          type: "file",
          accept: ROW_IMAGE_EXTS.map((e) => `.${e}`).join(","),
          className: "hidden",
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) onPickImage(f);
            e.target.value = "";
          }
        }
      )
    ] }) }),
    showVideo && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      videoPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => videoInputRef.current?.click(),
            className: "flex-1 truncate text-left hover:text-foreground transition-colors",
            title: videoPath,
            children: videoPath.split(/[\\/]/).pop()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClearVideo,
            className: "opacity-50 hover:opacity-100",
            title: t("autoVideo.import.clearVideo"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
          }
        )
      ] }) : imagePath ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => videoInputRef.current?.click(),
          className: "text-left text-amber-600 dark:text-amber-400 hover:text-foreground transition-colors",
          title: t("autoVideo.import.videoFallbackHint"),
          children: t("autoVideo.import.fallbackImage")
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => videoInputRef.current?.click(),
          className: "text-left italic opacity-60 hover:opacity-100 hover:text-foreground transition-colors",
          children: t("autoVideo.import.chooseVideo")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: videoInputRef,
          type: "file",
          accept: VIDEO_EXTS$1.map((e) => `.${e}`).join(","),
          className: "hidden",
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) onPickVideo(f);
            e.target.value = "";
          }
        }
      )
    ] }) })
  ] });
}
function StageImport() {
  const { t } = useI18n();
  const audioInputRef = reactExports.useRef(null);
  const srtInputRef = reactExports.useRef(null);
  const csvInputRef = reactExports.useRef(null);
  const [audioBusy, setAudioBusy] = reactExports.useState(false);
  const audioFilePath = useAutoVideoStore((s) => s.audioFilePath);
  const audioFileName = useAutoVideoStore((s) => s.audioFileName);
  const audioFileSize = useAutoVideoStore((s) => s.audioFileSize);
  const audioDurationSec = useAutoVideoStore((s) => s.audioDurationSec);
  const setAudio = useAutoVideoStore((s) => s.setAudio);
  const clearAudio = useAutoVideoStore((s) => s.clearAudio);
  const srtSourceMode = useAutoVideoStore((s) => s.srtSourceMode);
  const setSrtSourceMode = useAutoVideoStore((s) => s.setSrtSourceMode);
  const whisperProvider = useAutoVideoStore((s) => s.whisperProvider);
  const setWhisperProvider = useAutoVideoStore((s) => s.setWhisperProvider);
  const whisperApiKeys = useAutoVideoStore((s) => s.whisperApiKeys);
  const setWhisperApiKey = useAutoVideoStore((s) => s.setWhisperApiKey);
  const whisperLanguage = useAutoVideoStore((s) => s.whisperLanguage);
  const setWhisperLanguage = useAutoVideoStore((s) => s.setWhisperLanguage);
  const srtSegments = useAutoVideoStore((s) => s.srtSegments);
  const loadSrtRaw = useAutoVideoStore((s) => s.loadSrtRaw);
  const csvRows = useAutoVideoStore((s) => s.csvRows);
  const mediaMode = useAutoVideoStore((s) => s.mediaMode);
  const setMediaMode = useAutoVideoStore((s) => s.setMediaMode);
  const csvFileName = useAutoVideoStore((s) => s.csvFileName);
  const loadCsvRaw = useAutoVideoStore((s) => s.loadCsvRaw);
  const clearCsv = useAutoVideoStore((s) => s.clearCsv);
  const updateCsvRows = useAutoVideoStore((s) => s.updateCsvRows);
  const [csvEdits, setCsvEdits] = reactExports.useState({});
  reactExports.useEffect(() => {
    setCsvEdits({});
  }, [csvFileName, csvRows.length]);
  const dirtyCount = Object.keys(csvEdits).length;
  const setRowEdit = reactExports.useCallback((rowIndex, patch) => {
    setCsvEdits((prev) => {
      const next = { ...prev };
      const cur = next[rowIndex] ?? {};
      next[rowIndex] = { ...cur, ...patch };
      return next;
    });
  }, []);
  const handleSaveCsvEdits = reactExports.useCallback(() => {
    const edits = Object.entries(csvEdits).map(([k, v]) => ({
      index: parseInt(k, 10),
      ...v
    }));
    if (edits.length === 0) return;
    updateCsvRows(edits);
    setCsvEdits({});
    toast.success(t("autoVideo.import.savedChanges", { count: edits.length }));
  }, [csvEdits, t, updateCsvRows]);
  const handleDiscardCsvEdits = reactExports.useCallback(() => {
    setCsvEdits({});
  }, []);
  const handlePickRowImage = reactExports.useCallback((rowIndex, file) => {
    const path = file.path;
    if (!path) {
      toast.error(t("autoVideo.import.filePathMissing"));
      return;
    }
    setRowEdit(rowIndex, { imagePath: path });
  }, [setRowEdit, t]);
  const handlePickRowVideo = reactExports.useCallback((rowIndex, file) => {
    const path = file.path;
    if (!path) {
      toast.error(t("autoVideo.import.filePathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!VIDEO_EXTS$1.includes(ext)) {
      toast.error(t("autoVideo.import.unsupportedVideoFormat", { ext }));
      return;
    }
    setRowEdit(rowIndex, { videoPath: path });
  }, [setRowEdit, t]);
  const transcribeProgress = useAutoVideoStore((s) => s.transcribeProgress);
  const transcribeJobId = useAutoVideoStore((s) => s.transcribeJobId);
  const transcribeError = useAutoVideoStore((s) => s.transcribeError);
  const setTranscribeJobId = useAutoVideoStore((s) => s.setTranscribeJobId);
  const updateTranscribeProgress = useAutoVideoStore((s) => s.updateTranscribeProgress);
  const setTranscribeError = useAutoVideoStore((s) => s.setTranscribeError);
  const setStage = useAutoVideoStore((s) => s.setStage);
  reactExports.useEffect(() => {
    const api = window.whisperRuntime;
    if (!api) return;
    const off = api.onProgress((event) => {
      if (event.jobId !== transcribeJobId) return;
      const stageMap = {
        probing: t("autoVideo.import.progressProbing"),
        chunking: t("autoVideo.import.progressChunking"),
        uploading: t("autoVideo.import.progressUploading"),
        merging: t("autoVideo.import.progressMerging"),
        done: t("autoVideo.import.progressDone")
      };
      const message = event.message || (event.stage ? stageMap[event.stage] || event.stage : "") || (event.type === "chunk-start" ? `Chunk ${(event.chunkIndex ?? 0) + 1}/${event.chunkTotal ?? 1}` : "");
      updateTranscribeProgress({
        stage: event.stage || "uploading",
        message,
        percent: event.percent ?? 0
      });
    });
    return () => off();
  }, [t, transcribeJobId, updateTranscribeProgress]);
  const handlePickAudio = reactExports.useCallback(async (file) => {
    const path = file.path;
    if (!path) {
      toast.error(t("autoVideo.import.desktopPathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!AUDIO_EXTS$1.includes(ext)) {
      toast.error(t("autoVideo.import.unsupportedFormat", { ext }));
      return;
    }
    setAudioBusy(true);
    try {
      const probe = await window.ffmpegRuntime?.probeDuration(path);
      setAudio({
        path,
        name: file.name,
        size: file.size,
        durationSec: probe?.durationSec ?? null
      });
    } catch (err) {
      toast.error(t("autoVideo.import.audioReadFailed", { message: err.message }));
    } finally {
      setAudioBusy(false);
    }
  }, [setAudio, t]);
  const handleAudioDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handlePickAudio(file);
  }, [handlePickAudio]);
  const handleSrtFile = reactExports.useCallback(async (file) => {
    const text = await file.text();
    const result = loadSrtRaw(text);
    if (!result.ok) {
      toast.error(result.error || t("autoVideo.import.srtInvalid"));
    } else {
      toast.success(t("autoVideo.import.srtLoaded", { count: result.segmentCount }));
    }
  }, [loadSrtRaw, t]);
  const handleCsvFile = reactExports.useCallback(async (file) => {
    const text = await file.text();
    const result = loadCsvRaw(text, file.name);
    if (!result.ok) {
      toast.error(result.error || t("autoVideo.import.csvInvalid"));
    } else {
      toast.success(t("autoVideo.import.csvRowsLoaded", { count: result.rowCount }));
    }
  }, [loadCsvRaw, t]);
  const handleCsvDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleCsvFile(file);
  }, [handleCsvFile]);
  const apiKey = whisperApiKeys[whisperProvider];
  const providerCfg = WHISPER_PROVIDERS[whisperProvider];
  const handleTranscribe = reactExports.useCallback(async () => {
    if (!audioFilePath) return;
    if (!apiKey) {
      toast.error(t("autoVideo.import.apiKeyRequired"));
      return;
    }
    const jobId = `whisper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTranscribeJobId(jobId);
    setTranscribeError(null);
    updateTranscribeProgress({ stage: "probing", message: t("autoVideo.import.progressStart"), percent: 0 });
    try {
      const result = await window.whisperRuntime?.transcribe({
        jobId,
        audioPath: audioFilePath,
        provider: whisperProvider,
        apiKey,
        language: whisperLanguage || void 0
      });
      if (!result || !result.success) {
        const err = result?.error || t("autoVideo.import.transcribeFailed");
        setTranscribeError(err);
        updateTranscribeProgress({ stage: "error", message: err, percent: 0 });
        toast.error(err);
        return;
      }
      const srtRaw = result.srt || "";
      const loaded = loadSrtRaw(srtRaw);
      if (!loaded.ok) {
        const err = t("autoVideo.import.srtParseFailed", { message: loaded.error || "" });
        setTranscribeError(err);
        toast.error(err);
        return;
      }
      updateTranscribeProgress({ stage: "done", message: t("autoVideo.import.complete"), percent: 100 });
      toast.success(t("autoVideo.import.transcribeComplete", { count: loaded.segmentCount }));
      setStage("editor");
    } catch (err) {
      const msg = err.message || String(err);
      setTranscribeError(msg);
      updateTranscribeProgress({ stage: "error", message: msg, percent: 0 });
      toast.error(msg);
    } finally {
      setTranscribeJobId(null);
    }
  }, [
    audioFilePath,
    apiKey,
    whisperProvider,
    whisperLanguage,
    setTranscribeJobId,
    setTranscribeError,
    updateTranscribeProgress,
    loadSrtRaw,
    setStage,
    t
  ]);
  const handleCancelTranscribe = reactExports.useCallback(async () => {
    if (!transcribeJobId) return;
    await window.whisperRuntime?.cancel(transcribeJobId);
    updateTranscribeProgress({ stage: "idle", message: t("autoVideo.import.cancelled"), percent: 0 });
    setTranscribeJobId(null);
  }, [t, transcribeJobId, updateTranscribeProgress, setTranscribeJobId]);
  const handleDownloadCurrentCsv = reactExports.useCallback(() => {
    if (csvRows.length === 0) return;
    const escape = (v) => {
      const s = (v ?? "").toString();
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = mediaMode === "video" ? ["index,voice,image_path,video_path"] : ["index,voice,image_path"];
    for (const row of csvRows) {
      const values = mediaMode === "video" ? [row.index, escape(row.voice), escape(row.imagePath), escape(row.videoPath)] : [row.index, escape(row.voice), escape(row.imagePath)];
      lines.push(values.join(","));
    }
    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (csvFileName?.replace(/\.csv$/i, "") || "auto-video") + "-export.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }, [csvRows, csvFileName, mediaMode]);
  const [ttsEngine, setTtsEngine] = reactExports.useState("omnivoice");
  const [ttsTextSource, setTtsTextSource] = reactExports.useState("csv");
  const [ttsCustomText, setTtsCustomText] = reactExports.useState("");
  const [ttsGeminiVoice, setTtsGeminiVoice] = reactExports.useState("Puck");
  const [ttsGeminiLang, setTtsGeminiLang] = reactExports.useState("vi-VN");
  const [ttsCapcutVoiceType, setTtsCapcutVoiceType] = reactExports.useState(DEFAULT_CAPCUT_VOICE);
  const [ttsGenerating, setTtsGenerating] = reactExports.useState(false);
  const [ttsProgress, setTtsProgress] = reactExports.useState(null);
  const [ttsJobId, setTtsJobId] = reactExports.useState(null);
  const csvNarration = csvRows.map((row) => row.voice).filter((v) => v && v.trim()).map((v) => v.trim());
  const narrationText = ttsTextSource === "csv" ? csvNarration.join("\n") : ttsCustomText;
  reactExports.useEffect(() => {
    const api = window.ttsRuntime;
    if (!api) return;
    const off = api.onEvent((event) => {
      if (event.jobId !== ttsJobId) return;
      if (event.kind !== "generate") return;
      setTtsProgress({ percent: event.percent ?? 0, message: event.message });
    });
    return () => off();
  }, [ttsJobId]);
  const handleGenerateVoice = reactExports.useCallback(async () => {
    const text = narrationText.trim();
    if (!text) {
      toast.error(t("autoVideo.ttsGen.noText"));
      return;
    }
    const preset = TTS_ENGINE_OPTIONS.find((o) => o.id === ttsEngine);
    if (!preset) return;
    const jobId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTtsJobId(jobId);
    setTtsGenerating(true);
    setTtsProgress({ percent: 0, message: t("autoVideo.ttsGen.starting") });
    try {
      const result = await window.ttsRuntime?.generate({
        jobId,
        model: preset.model,
        text,
        mode: preset.model.mode,
        splitMode: "line",
        language: ttsEngine === "gemini" ? ttsGeminiLang : "vi",
        ...ttsEngine === "capcut" ? { capcutVoiceType: ttsCapcutVoiceType, capcutResourceId: getCapCutVoice(ttsCapcutVoiceType)?.resourceId ?? "" } : {},
        ...ttsEngine === "gemini" ? { geminiVoiceName: ttsGeminiVoice } : {}
      });
      if (!result || !result.success) {
        throw new Error(result?.error || t("autoVideo.ttsGen.failedGeneric"));
      }
      const outputPath = result.outputPath ?? "";
      setAudio({
        path: outputPath,
        name: `tts-${ttsEngine}.${outputPath.split(".").pop() ?? "wav"}`,
        size: 0,
        durationSec: result.durationSec ?? null
      });
      setTtsProgress({ percent: 100, message: t("autoVideo.import.progressDone") });
      toast.success(t("autoVideo.ttsGen.done", { seconds: result.durationSec ? Math.round(result.durationSec) : 0 }));
    } catch (err) {
      toast.error(t("autoVideo.ttsGen.failed", { message: err.message || String(err) }));
    } finally {
      setTtsJobId(null);
      setTtsGenerating(false);
    }
  }, [narrationText, ttsEngine, ttsGeminiVoice, ttsGeminiLang, ttsCapcutVoiceType, setAudio, t]);
  const handleCancelVoice = reactExports.useCallback(async () => {
    if (!ttsJobId) return;
    await window.ttsRuntime?.cancel(ttsJobId);
    setTtsJobId(null);
    setTtsGenerating(false);
    setTtsProgress(null);
  }, [ttsJobId]);
  const transcribing = transcribeProgress.stage !== "idle" && transcribeProgress.stage !== "done" && transcribeProgress.stage !== "error";
  const canProceed = audioFilePath && srtSegments.length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: t("autoVideo.mediaMode.title"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ModeChip, { active: mediaMode === "image", onClick: () => setMediaMode("image"), label: t("autoVideo.mediaMode.imagePath") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ModeChip, { active: mediaMode === "video", onClick: () => setMediaMode("video"), label: t("autoVideo.mediaMode.videoPath") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-2", children: t("autoVideo.mediaMode.help") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Section,
      {
        title: t("autoVideo.import.audio"),
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileHeadphone, { className: "w-4 h-4" }),
        children: [
          !audioFilePath ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            DropZone,
            {
              hint: t("autoVideo.import.audioDrop"),
              onDrop: handleAudioDrop,
              onClick: () => audioInputRef.current?.click(),
              busy: audioBusy
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-muted/30 border border-border rounded-lg p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileHeadphone, { className: "w-5 h-5 text-primary shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: audioFileName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  formatBytes(audioFileSize),
                  " · ",
                  formatDuration(audioDurationSec)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearAudio, disabled: transcribing, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: audioInputRef,
              type: "file",
              accept: AUDIO_EXTS$1.map((e) => `.${e}`).join(","),
              className: "hidden",
              onChange: (e) => {
                const f = e.target.files?.[0];
                if (f) handlePickAudio(f);
                e.target.value = "";
              }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        title: t("autoVideo.ttsGen.title"),
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-4 h-4" }),
        right: audioFilePath ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: t("autoVideo.ttsGen.audioReady") }) : null,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("autoVideo.ttsGen.help") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.ttsGen.engine") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: TTS_ENGINE_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              ModeChip,
              {
                active: ttsEngine === opt.id,
                onClick: () => setTtsEngine(opt.id),
                label: t(opt.labelKey)
              },
              opt.id
            )) })
          ] }),
          ttsEngine === "capcut" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.ttsGen.voice") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: ttsCapcutVoiceType,
                onChange: (e) => setTtsCapcutVoiceType(e.target.value),
                className: "w-full h-8 rounded-lg border border-border bg-background px-2 text-xs",
                children: CAPCUT_VI_VOICES.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: voice.voiceType, children: [
                  voice.displayName,
                  " (",
                  voice.languageCode,
                  ")"
                ] }, voice.voiceType))
              }
            )
          ] }),
          ttsEngine === "gemini" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.ttsGen.voice") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  value: ttsGeminiVoice,
                  onChange: (e) => setTtsGeminiVoice(e.target.value),
                  className: "w-full h-8 rounded-lg border border-border bg-background px-2 text-xs",
                  children: GEMINI_VOICES.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: voice.name, children: [
                    voice.name,
                    " — ",
                    voice.description,
                    " (",
                    voice.gender,
                    ")"
                  ] }, voice.name))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.ttsGen.language") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  value: ttsGeminiLang,
                  onChange: (e) => setTtsGeminiLang(e.target.value),
                  className: "w-full h-8 rounded-lg border border-border bg-background px-2 text-xs",
                  children: GEMINI_LANGUAGES.map(([code, name]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: code, children: [
                    name,
                    " (",
                    code,
                    ")"
                  ] }, code))
                }
              )
            ] })
          ] }),
          ttsEngine === "omnivoice" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-2", children: t("autoVideo.ttsGen.omnivoiceNote") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.ttsGen.source") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ModeChip,
                {
                  active: ttsTextSource === "csv",
                  onClick: () => setTtsTextSource("csv"),
                  disabled: csvNarration.length === 0,
                  label: t("autoVideo.ttsGen.fromCsv", { count: csvNarration.length })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ModeChip,
                {
                  active: ttsTextSource === "custom",
                  onClick: () => setTtsTextSource("custom"),
                  label: t("autoVideo.ttsGen.customText")
                }
              )
            ] }),
            ttsTextSource === "custom" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: ttsCustomText,
                onChange: (e) => setTtsCustomText(e.target.value),
                placeholder: t("autoVideo.ttsGen.textPlaceholder"),
                rows: 4,
                className: "mt-2 text-xs"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-2", children: csvNarration.length > 0 ? t("autoVideo.ttsGen.csvSummary", { count: csvNarration.length }) : t("autoVideo.ttsGen.csvEmpty") })
          ] }),
          ttsGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: ttsProgress?.percent ?? 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: ttsProgress?.message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleCancelVoice, children: t("autoVideo.import.cancel") })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleGenerateVoice,
              disabled: !narrationText.trim() || audioBusy,
              className: "w-full",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AudioLines, { className: "w-4 h-4 mr-2" }),
                t("autoVideo.ttsGen.generate")
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Section,
      {
        title: t("autoVideo.import.srtSource"),
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ModeChip,
              {
                active: srtSourceMode === "api",
                onClick: () => setSrtSourceMode("api"),
                label: t("autoVideo.import.srtViaApi")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ModeChip,
              {
                active: srtSourceMode === "import",
                onClick: () => setSrtSourceMode("import"),
                label: t("autoVideo.import.srtViaImport")
              }
            )
          ] }),
          srtSourceMode === "api" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.import.provider") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: WHISPER_PROVIDER_ORDER.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProviderChip,
                {
                  provider: p,
                  active: whisperProvider === p,
                  onClick: () => setWhisperProvider(p)
                },
                p
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.import.apiKey") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "password",
                  value: apiKey,
                  onChange: (e) => setWhisperApiKey(whisperProvider, e.target.value),
                  placeholder: providerCfg.apiKeyHint,
                  className: "text-xs"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: providerCfg.apiKeyDocsUrl,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground mt-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                    t("autoVideo.import.apiKeyHint", { url: providerCfg.apiKeyDocsUrl })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.import.language") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: whisperLanguage,
                  onChange: (e) => setWhisperLanguage(e.target.value),
                  placeholder: t("autoVideo.import.languageAuto"),
                  className: "text-xs w-32",
                  maxLength: 5
                }
              )
            ] }),
            transcribing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: transcribeProgress.percent }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: transcribeProgress.message }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleCancelTranscribe, children: t("autoVideo.import.cancel") })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: handleTranscribe,
                disabled: !audioFilePath || !apiKey,
                className: "w-full",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
                  t("autoVideo.import.transcribe")
                ]
              }
            ),
            transcribeError && !transcribing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2", children: transcribeError }),
            srtSegments.length > 0 && !transcribing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-green-500 bg-green-500/10 border border-green-500/30 rounded p-2", children: t("autoVideo.import.srtReady", { count: srtSegments.length }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DropZone,
              {
                hint: t("autoVideo.import.uploadSrt"),
                onDrop: (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleSrtFile(f);
                },
                onClick: () => srtInputRef.current?.click()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: srtInputRef,
                type: "file",
                accept: ".srt",
                className: "hidden",
                onChange: (e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSrtFile(f);
                  e.target.value = "";
                }
              }
            ),
            srtSegments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-green-500 bg-green-500/10 border border-green-500/30 rounded p-2", children: [
              srtSegments.length,
              " câu"
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        title: t("autoVideo.import.csvOptional"),
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "w-4 h-4" }),
        right: csvRows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleDownloadCurrentCsv, className: "text-xs", children: t("autoVideo.import.downloadCsv") }) : null,
        children: !csvRows.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DropZone,
            {
              hint: t("autoVideo.import.csvDrop"),
              onDrop: handleCsvDrop,
              onClick: () => csvInputRef.current?.click()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: csvInputRef,
              type: "file",
              accept: ".csv",
              className: "hidden",
              onChange: (e) => {
                const f = e.target.files?.[0];
                if (f) handleCsvFile(f);
                e.target.value = "";
              }
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-muted/30 border border-border rounded-lg p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "w-5 h-5 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: csvFileName ?? "from-clipboard.csv" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("autoVideo.import.csvLoaded", { count: csvRows.length }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearCsv, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" }) })
          ] }),
          dirtyCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-amber-700 dark:text-amber-400", children: t("autoVideo.import.unsavedChanges", { count: dirtyCount }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleDiscardCsvEdits, children: t("autoVideo.import.discard") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleSaveCsvEdits, children: t("autoVideo.import.save") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border max-h-[320px] overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs table-fixed", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("colgroup", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("col", { style: { width: "7%" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("col", { style: { width: mediaMode === "video" ? "39%" : "53%" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("col", { style: { width: mediaMode === "video" ? "27%" : "40%" } }),
              mediaMode === "video" && /* @__PURE__ */ jsxRuntimeExports.jsx("col", { style: { width: "27%" } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-muted z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: "#" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("autoVideo.import.voice") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("autoVideo.import.image") }),
              mediaMode === "video" && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("autoVideo.import.video") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: csvRows.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              CsvPreviewRow,
              {
                row,
                edit: csvEdits[row.index],
                showVideo: mediaMode === "video",
                onVoiceChange: (v) => setRowEdit(row.index, { voice: v }),
                onPickImage: (file) => handlePickRowImage(row.index, file),
                onClearImage: () => setRowEdit(row.index, { imagePath: "" }),
                onPickVideo: (file) => handlePickRowVideo(row.index, file),
                onClearVideo: () => setRowEdit(row.index, { videoPath: "" })
              },
              `${row.index}-${i}`
            )) })
          ] }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        disabled: !canProceed,
        onClick: () => setStage("editor"),
        size: "lg",
        children: [
          t("autoVideo.editor.proceedRender"),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ]
      }
    ) })
  ] }) });
}
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];
const VIDEO_EXTS = ["mp4", "mov", "mkv", "webm"];
const SFX_EXTS = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
const MEDIA_EFFECT_OPTIONS = [
  { value: "none", labelKey: "autoVideo.editor.effectNone" },
  { value: "zoom_in", labelKey: "autoVideo.editor.effectZoomIn" },
  { value: "zoom_out", labelKey: "autoVideo.editor.effectZoomOut" },
  { value: "pan_left", labelKey: "autoVideo.editor.effectPanLeft" },
  { value: "pan_right", labelKey: "autoVideo.editor.effectPanRight" },
  { value: "pan_up", labelKey: "autoVideo.editor.effectPanUp" },
  { value: "pan_down", labelKey: "autoVideo.editor.effectPanDown" },
  { value: "zoom_pan_left", labelKey: "autoVideo.editor.effectZoomPanLeft" },
  { value: "zoom_pan_right", labelKey: "autoVideo.editor.effectZoomPanRight" }
];
const TRANSITION_OPTIONS = [
  { value: "none", labelKey: "autoVideo.editor.effectNone" },
  { value: "fade", labelKey: "autoVideo.editor.transitionFade" },
  { value: "fade_slow", labelKey: "autoVideo.editor.transitionFadeSlow" },
  { value: "dip_white", labelKey: "autoVideo.editor.transitionDipWhite" },
  { value: "flash_white", labelKey: "autoVideo.editor.transitionFlashWhite" },
  { value: "dissolve", label: "Dissolve" },
  { value: "fade_black", label: "Fade Black" },
  { value: "fade_white", label: "Fade White" },
  { value: "wipe_left", label: "Wipe Left" },
  { value: "wipe_right", label: "Wipe Right" },
  { value: "wipe_up", label: "Wipe Up" },
  { value: "wipe_down", label: "Wipe Down" },
  { value: "slide_left", label: "Slide Left" },
  { value: "slide_right", label: "Slide Right" },
  { value: "smooth_left", label: "Smooth Left" },
  { value: "smooth_right", label: "Smooth Right" },
  { value: "circle_open", label: "Circle Open" },
  { value: "circle_close", label: "Circle Close" },
  { value: "pixelize", label: "Pixelize" },
  { value: "zoom_in", label: "Zoom In" }
];
const transitionLabel = (option, t) => option.labelKey ? t(option.labelKey) : option.label || option.value;
function formatTimestamp(ms) {
  const totalSec = Math.floor(ms / 1e3);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function formatDurationSec(ms) {
  return `${(ms / 1e3).toFixed(2)}s`;
}
function ModeButton({ active, onClick, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      onClick,
      className: cn(
        "px-2.5 py-1 text-xs font-medium rounded transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      ),
      children
    }
  );
}
function toImageSrc(input) {
  if (!input) return "";
  if (input.startsWith("local-image://") || input.startsWith("file://") || input.startsWith("data:") || input.startsWith("http")) {
    return input;
  }
  return `file:///${input.replace(/\\/g, "/")}`;
}
function toMediaSrc(input) {
  return toImageSrc(input);
}
function fileNameFromPath(input) {
  return input.split(/[\\/]/).pop() || input;
}
function StageEditor() {
  const { t } = useI18n();
  const folderInputRef = reactExports.useRef(null);
  const sfxFolderInputRef = reactExports.useRef(null);
  const segments = useAutoVideoStore((s) => s.mappedSegments);
  const mediaMode = useAutoVideoStore((s) => s.mediaMode);
  const setMediaMode = useAutoVideoStore((s) => s.setMediaMode);
  const setStage = useAutoVideoStore((s) => s.setStage);
  const autoFillFromFolder = useAutoVideoStore((s) => s.autoFillImagesFromFolder);
  const applyMediaEffectToAll = useAutoVideoStore((s) => s.applyMediaEffectToAll);
  const applyTransitionToAll = useAutoVideoStore((s) => s.applyTransitionToAll);
  const randomizeMediaEffects = useAutoVideoStore((s) => s.randomizeMediaEffects);
  const randomizeTransitions = useAutoVideoStore((s) => s.randomizeTransitions);
  const clearMediaEffects = useAutoVideoStore((s) => s.clearMediaEffects);
  const clearTransitions = useAutoVideoStore((s) => s.clearTransitions);
  const randomizeSfx = useAutoVideoStore((s) => s.randomizeSfx);
  const clearAllSfx = useAutoVideoStore((s) => s.clearAllSfx);
  const [randomEffectCount, setRandomEffectCount] = reactExports.useState(0);
  const [randomTransitionCount, setRandomTransitionCount] = reactExports.useState(0);
  const [randomSfxCount, setRandomSfxCount] = reactExports.useState(0);
  const [sfxPaths, setSfxPaths] = reactExports.useState([]);
  const [bulkEffect, setBulkEffect] = reactExports.useState("none");
  const [bulkEffectMode, setBulkEffectMode] = reactExports.useState("all");
  const [bulkTransition, setBulkTransition] = reactExports.useState("none");
  const [bulkTransitionMode, setBulkTransitionMode] = reactExports.useState("all");
  const stats = reactExports.useMemo(() => {
    const total = segments.length;
    const missing = mediaMode === "video" ? segments.filter((s) => !s.videoPath && !s.imagePath).length : segments.filter((s) => !s.imagePath).length;
    const withVideo = segments.filter((s) => !!s.videoPath).length;
    const fallbackImages = mediaMode === "video" ? segments.filter((s) => !s.videoPath && !!s.imagePath).length : 0;
    const lowConf = segments.filter((s) => s.confidence != null && s.confidence < 0.4).length;
    const totalDurationMs = segments.length > 0 ? segments[segments.length - 1].endMs : 0;
    return { total, missing, lowConf, totalDurationMs, withVideo, fallbackImages };
  }, [segments, mediaMode]);
  const handleFolderPick = reactExports.useCallback((files) => {
    if (!files || files.length === 0) return;
    const paths = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (!f.path) continue;
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (mediaMode === "video" ? !VIDEO_EXTS.includes(ext) : !IMAGE_EXTS.includes(ext)) continue;
      paths.push(f.path);
    }
    if (paths.length === 0) {
      toast.error(mediaMode === "video" ? t("autoVideo.editor.noVideosInFolder") : t("autoVideo.editor.noImagesInFolder"));
      return;
    }
    paths.sort((a, b) => a.localeCompare(b));
    const used = autoFillFromFolder(paths);
    toast.success(mediaMode === "video" ? t("autoVideo.editor.filledVideos", { count: used }) : t("autoVideo.editor.filledImages", { count: used }));
  }, [autoFillFromFolder, mediaMode, t]);
  const handleBulkEffectChange = reactExports.useCallback((value) => {
    setBulkEffect(value);
    if (bulkEffectMode === "all") applyMediaEffectToAll(value);
  }, [applyMediaEffectToAll, bulkEffectMode]);
  const handleBulkEffectModeChange = reactExports.useCallback((value) => {
    setBulkEffectMode(value);
    if (value === "all") applyMediaEffectToAll(bulkEffect);
  }, [applyMediaEffectToAll, bulkEffect]);
  const handleRandomEffects = reactExports.useCallback(() => {
    const count = randomizeMediaEffects(randomEffectCount, bulkEffect);
    toast.success(t("autoVideo.editor.randomEffectsDone", { count }));
  }, [bulkEffect, randomEffectCount, randomizeMediaEffects, t]);
  const handleBulkTransitionChange = reactExports.useCallback((value) => {
    setBulkTransition(value);
    if (bulkTransitionMode === "all") applyTransitionToAll(value);
  }, [applyTransitionToAll, bulkTransitionMode]);
  const handleBulkTransitionModeChange = reactExports.useCallback((value) => {
    setBulkTransitionMode(value);
    if (value === "all") applyTransitionToAll(bulkTransition);
  }, [applyTransitionToAll, bulkTransition]);
  const handleRandomTransitions = reactExports.useCallback(() => {
    const count = randomizeTransitions(randomTransitionCount, bulkTransition);
    toast.success(t("autoVideo.editor.randomTransitionsDone", { count }));
  }, [bulkTransition, randomTransitionCount, randomizeTransitions, t]);
  const handleSfxFolderPick = reactExports.useCallback((files) => {
    if (!files || files.length === 0) return;
    const paths = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (!f.path) continue;
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!SFX_EXTS.includes(ext)) continue;
      paths.push(f.path);
    }
    paths.sort((a, b) => a.localeCompare(b));
    setSfxPaths(paths);
    if (paths.length === 0) toast.error(t("autoVideo.editor.noSfxInFolder"));
    else toast.success(t("autoVideo.editor.loadedSfx", { count: paths.length }));
  }, [t]);
  const handleRandomSfx = reactExports.useCallback(() => {
    if (sfxPaths.length === 0) {
      toast.error(t("autoVideo.editor.noSfxSelected"));
      return;
    }
    const count = randomizeSfx(randomSfxCount, sfxPaths);
    toast.success(t("autoVideo.editor.randomSfxDone", { count }));
  }, [randomSfxCount, randomizeSfx, sfxPaths, t]);
  if (segments.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: t("autoVideo.editor.noSegments") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border bg-panel/50 px-6 py-3 flex items-center justify-between shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("autoVideo.editor.segments", { n: stats.total }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            t("autoVideo.editor.totalDuration"),
            ": "
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: formatTimestamp(stats.totalDurationMs) })
        ] }),
        stats.missing > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-amber-500", children: t("autoVideo.editor.missingImages", { n: stats.missing }) })
        ] }),
        mediaMode === "video" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: t("autoVideo.editor.videoCount", { count: stats.withVideo }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-amber-500", children: t("autoVideo.editor.fallbackImages", { count: stats.fallbackImages }) })
        ] }),
        stats.lowConf > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-amber-500 flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-3 h-3" }),
            t("autoVideo.editor.lowConfidenceCount", { count: stats.lowConf })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: folderInputRef,
            type: "file",
            multiple: true,
            accept: (mediaMode === "video" ? VIDEO_EXTS : IMAGE_EXTS).map((e) => `.${e}`).join(","),
            webkitdirectory: "",
            directory: "",
            className: "hidden",
            onChange: (e) => {
              handleFolderPick(e.target.files);
              e.target.value = "";
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => folderInputRef.current?.click(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4 mr-1" }),
          mediaMode === "video" ? t("autoVideo.editor.autoFillVideoFolder") : t("autoVideo.editor.autoFillFolder")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModeButton, { active: mediaMode === "image", onClick: () => setMediaMode("image"), children: t("autoVideo.import.image") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModeButton, { active: mediaMode === "video", onClick: () => setMediaMode("video"), children: t("autoVideo.import.video") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setStage("import"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
          t("autoVideo.editor.back")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setStage("render"), children: [
          t("autoVideo.editor.proceedRender"),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-3 space-y-3 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 font-semibold", children: t("autoVideo.editor.effects") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "bg-background border border-border rounded px-2 py-1", value: bulkEffect, onChange: (e) => handleBulkEffectChange(e.target.value), children: MEDIA_EFFECT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "bg-background border border-border rounded px-2 py-1", value: bulkEffectMode, onChange: (e) => handleBulkEffectModeChange(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("autoVideo.editor.applyAll") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "random", children: t("autoVideo.editor.applyRandomCount") })
          ] }),
          bulkEffectMode === "random" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-16 bg-background border rounded px-2 py-1", type: "number", min: 0, value: randomEffectCount, onChange: (e) => setRandomEffectCount(Number(e.target.value) || 0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleRandomEffects, children: t("autoVideo.editor.applyRandom") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearMediaEffects, children: t("autoVideo.editor.clearEffects") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 font-semibold", children: t("autoVideo.editor.transitions") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "bg-background border border-border rounded px-2 py-1", value: bulkTransition, onChange: (e) => handleBulkTransitionChange(e.target.value), children: TRANSITION_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: transitionLabel(option, t) }, option.value)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "bg-background border border-border rounded px-2 py-1", value: bulkTransitionMode, onChange: (e) => handleBulkTransitionModeChange(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("autoVideo.editor.applyAll") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "random", children: t("autoVideo.editor.applyRandomCount") })
          ] }),
          bulkTransitionMode === "random" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-16 bg-background border rounded px-2 py-1", type: "number", min: 0, value: randomTransitionCount, onChange: (e) => setRandomTransitionCount(Number(e.target.value) || 0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleRandomTransitions, children: t("autoVideo.editor.applyRandom") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearTransitions, children: t("autoVideo.editor.clearTransitions") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 font-semibold", children: t("autoVideo.editor.sfx") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: sfxFolderInputRef,
              type: "file",
              multiple: true,
              accept: SFX_EXTS.map((e) => `.${e}`).join(","),
              webkitdirectory: "",
              directory: "",
              className: "hidden",
              onChange: (e) => {
                handleSfxFolderPick(e.target.files);
                e.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => sfxFolderInputRef.current?.click(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4 mr-1" }),
            t("autoVideo.editor.chooseSfxFolder")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("autoVideo.editor.sfxLoaded", { count: sfxPaths.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-16 bg-background border rounded px-2 py-1", type: "number", min: 0, value: randomSfxCount, onChange: (e) => setRandomSfxCount(Number(e.target.value) || 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleRandomSfx, children: t("autoVideo.editor.applyRandom") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearAllSfx, children: t("autoVideo.editor.clearSfx") })
        ] })
      ] }),
      segments.map((seg) => /* @__PURE__ */ jsxRuntimeExports.jsx(SegmentRow, { segment: seg, mediaMode, sfxPaths }, seg.index))
    ] }) })
  ] });
}
function SegmentRow({ segment, mediaMode, sfxPaths }) {
  const { t } = useI18n();
  const inputRef = reactExports.useRef(null);
  const setImage = useAutoVideoStore((s) => s.setImageForSegment);
  const setVideo = useAutoVideoStore((s) => s.setVideoForSegment);
  const clearImage = useAutoVideoStore((s) => s.clearImageForSegment);
  const clearVideo = useAutoVideoStore((s) => s.clearVideoForSegment);
  const setMediaEffect = useAutoVideoStore((s) => s.setMediaEffectForSegment);
  const setTransition = useAutoVideoStore((s) => s.setTransitionForSegment);
  const setSfx = useAutoVideoStore((s) => s.setSfxForSegment);
  const clearSfx = useAutoVideoStore((s) => s.clearSfxForSegment);
  const handleFilePick = reactExports.useCallback((file) => {
    const path = file.path;
    if (!path) {
      toast.error(t("autoVideo.import.filePathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = mediaMode === "video" ? VIDEO_EXTS : IMAGE_EXTS;
    if (!allowed.includes(ext)) {
      toast.error(t("autoVideo.import.unsupportedFormat", { ext }));
      return;
    }
    if (mediaMode === "video") setVideo(segment.index, path);
    else setImage(segment.index, path);
  }, [mediaMode, segment.index, setImage, setVideo, t]);
  const handleDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFilePick(file);
  }, [handleFilePick]);
  const lowConf = segment.confidence != null && segment.confidence < 0.4;
  const duration = segment.endMs - segment.startMs;
  const usingVideo = mediaMode === "video" && !!segment.videoPath;
  const fallbackImage = mediaMode === "video" && !segment.videoPath && !!segment.imagePath;
  const mediaPath = usingVideo ? segment.videoPath : segment.imagePath;
  const sfxOptions = segment.sfxPath && !sfxPaths.includes(segment.sfxPath) ? [segment.sfxPath, ...sfxPaths] : sfxPaths;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "flex items-stretch gap-3 bg-card border rounded-lg overflow-hidden",
        lowConf ? "border-amber-500/50 bg-amber-500/5" : "border-border"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-20 shrink-0 bg-muted/30 flex flex-col items-center justify-center text-center py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-medium", children: [
            "#",
            segment.index
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground mt-0.5", children: formatTimestamp(segment.startMs) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground", children: formatDurationSec(duration) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 py-3 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm leading-relaxed", children: segment.text }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-2 text-2xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: t("autoVideo.editor.effect") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "bg-background border border-border rounded px-1 py-0.5", value: segment.mediaEffect ?? "none", onChange: (e) => setMediaEffect(segment.index, e.target.value), children: MEDIA_EFFECT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: t("autoVideo.editor.transitionNext") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "bg-background border border-border rounded px-1 py-0.5", value: segment.transitionToNext ?? "none", onChange: (e) => setTransition(segment.index, e.target.value), children: TRANSITION_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: transitionLabel(option, t) }, option.value)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: t("autoVideo.editor.sfx") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "max-w-44 bg-background border border-border rounded px-1 py-0.5", value: segment.sfxPath || "", onChange: (e) => setSfx(segment.index, e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("autoVideo.editor.effectNone") }),
              sfxOptions.map((path) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: path, children: fileNameFromPath(path) }, path))
            ] }),
            segment.sfxPath && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: toMediaSrc(segment.sfxPath), controls: true, className: "h-7 w-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-primary hover:underline", onClick: () => clearSfx(segment.index), children: t("autoVideo.editor.clearSfx") })
            ] })
          ] }),
          lowConf && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-1 text-2xs text-amber-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-3 h-3" }),
            t("autoVideo.editor.lowConfidence"),
            " (",
            segment.confidence?.toFixed(2),
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onDragOver: (e) => e.preventDefault(),
            onDrop: handleDrop,
            onClick: () => !mediaPath && inputRef.current?.click(),
            className: cn(
              "w-32 shrink-0 border-l border-border flex items-center justify-center bg-muted/20 group relative cursor-pointer",
              !mediaPath && "hover:bg-muted/40"
            ),
            children: [
              mediaPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                usingVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: toMediaSrc(mediaPath), muted: true, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: toImageSrc(mediaPath),
                    alt: "",
                    className: "w-full h-full object-cover",
                    onError: (e) => {
                      e.target.style.display = "none";
                    }
                  }
                ),
                fallbackImage && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1 bottom-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-2xs font-medium text-white", children: t("autoVideo.import.fallbackImage") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      if (usingVideo) clearVideo(segment.index);
                      else clearImage(segment.index);
                    },
                    className: "absolute top-1 right-1 bg-background/80 hover:bg-background border border-border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground flex flex-col items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-center px-2", children: mediaMode === "video" ? t("autoVideo.editor.dropVideo") : t("autoVideo.editor.dropImage") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: inputRef,
                  type: "file",
                  accept: (mediaMode === "video" ? VIDEO_EXTS : IMAGE_EXTS).map((e) => `.${e}`).join(","),
                  className: "hidden",
                  onChange: (e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFilePick(f);
                    e.target.value = "";
                  }
                }
              )
            ]
          }
        )
      ]
    }
  );
}
const AUDIO_EXTS = ["mp3", "wav", "m4a", "flac", "ogg"];
const RESOLUTIONS = [
  { value: "1280x720", label: "720p" },
  { value: "1920x1080", label: "1080p" },
  { value: "3840x2160", label: "4K" }
];
const FPS_OPTIONS = [24, 30, 60];
const CODECS = [
  { value: "libx264", label: "H.264 (CPU)" },
  { value: "libx265", label: "H.265 (CPU)" },
  { value: "h264_nvenc", label: "H.264 (NVIDIA GPU)" }
];
function StageRender() {
  const { t } = useI18n();
  const bgmInputRef = reactExports.useRef(null);
  const audioFilePath = useAutoVideoStore((s) => s.audioFilePath);
  const audioFileName = useAutoVideoStore((s) => s.audioFileName);
  const segments = useAutoVideoStore((s) => s.mappedSegments);
  const mediaMode = useAutoVideoStore((s) => s.mediaMode);
  const renderSettings = useAutoVideoStore((s) => s.renderSettings);
  const setRenderSettings = useAutoVideoStore((s) => s.setRenderSettings);
  const renderProgress = useAutoVideoStore((s) => s.renderProgress);
  const updateRenderProgress = useAutoVideoStore((s) => s.updateRenderProgress);
  const renderJobId = useAutoVideoStore((s) => s.renderJobId);
  const setRenderJobId = useAutoVideoStore((s) => s.setRenderJobId);
  const renderError = useAutoVideoStore((s) => s.renderError);
  const setRenderError = useAutoVideoStore((s) => s.setRenderError);
  const renderLog = useAutoVideoStore((s) => s.renderLog);
  const appendRenderLog = useAutoVideoStore((s) => s.appendRenderLog);
  const outputVideoPath = useAutoVideoStore((s) => s.outputVideoPath);
  const setOutputVideoPath = useAutoVideoStore((s) => s.setOutputVideoPath);
  const setStage = useAutoVideoStore((s) => s.setStage);
  const activeRenderJobIdRef = reactExports.useRef(null);
  const stats = reactExports.useMemo(() => {
    const total = segments.length;
    const missing = mediaMode === "video" ? segments.filter((s) => !s.videoPath && !s.imagePath).length : segments.filter((s) => !s.imagePath).length;
    const withImages = segments.filter((s) => s.imagePath).length;
    const withVideos = segments.filter((s) => s.videoPath).length;
    const fallbackImages = mediaMode === "video" ? segments.filter((s) => !s.videoPath && s.imagePath).length : 0;
    const totalDurationMs = segments.length > 0 ? segments[segments.length - 1].endMs : 0;
    return { total, missing, withImages, withVideos, fallbackImages, totalDurationMs };
  }, [segments, mediaMode]);
  const imagePathSamples = reactExports.useMemo(() => segments.filter((s) => mediaMode === "video" ? s.videoPath || s.imagePath : s.imagePath).slice(0, 5).map((s) => `#${s.index}: ${mediaMode === "video" ? s.videoPath || `[${t("autoVideo.import.fallbackImage")}] ${s.imagePath}` : s.imagePath}`), [segments, mediaMode, t]);
  reactExports.useEffect(() => {
    const api = window.autoVideoRuntime;
    if (!api) return;
    const off = api.onEvent((event) => {
      if (event.jobId !== activeRenderJobIdRef.current) return;
      if (event.type === "log" && event.message) {
        appendRenderLog(event.message);
        return;
      }
      const stageMap = {
        preparing: "segments",
        "building-segments": "segments",
        concatenating: "concat",
        done: "done",
        error: "error"
      };
      const message = event.message || (event.type === "segment-start" && event.segmentIndex != null ? t("autoVideo.render.segmentProgress", { index: event.segmentIndex + 1, total: event.segmentTotal ?? 0 }) : event.type === "segment-done" && event.segmentIndex != null ? t("autoVideo.render.segmentDone", { index: event.segmentIndex + 1, total: event.segmentTotal ?? 0 }) : "");
      updateRenderProgress({
        stage: event.stage ? stageMap[event.stage] || "segments" : "segments",
        percent: event.percent ?? 0,
        message
      });
    });
    return () => off();
  }, [t, updateRenderProgress, appendRenderLog]);
  const handleStartRender = reactExports.useCallback(async () => {
    if (!audioFilePath || segments.length === 0) return;
    const defaultName = (audioFileName?.replace(/\.[^/.]+$/, "") || "auto-video") + ".mp4";
    const picked = await window.autoVideoRuntime?.pickOutput(defaultName);
    if (!picked?.path) return;
    const jobId = `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeRenderJobIdRef.current = jobId;
    setRenderJobId(jobId);
    setRenderError(null);
    setOutputVideoPath(null);
    const resolvedSegments = await Promise.all(segments.map(async (s) => {
      let imagePath = s.imagePath;
      let videoPath = s.videoPath;
      if (imagePath.startsWith("local-image://")) {
        const abs = await window.imageStorage?.getAbsolutePath(imagePath);
        imagePath = abs || imagePath;
      }
      if (videoPath.startsWith("local-image://")) {
        const abs = await window.imageStorage?.getAbsolutePath(videoPath);
        videoPath = abs || videoPath;
      }
      return { ...s, imagePath, videoPath };
    }));
    const unresolvedLocalImages = resolvedSegments.filter((s) => s.imagePath.startsWith("local-image://"));
    const unresolvedLocalVideos = resolvedSegments.filter((s) => s.videoPath.startsWith("local-image://"));
    if (unresolvedLocalImages.length > 0 || unresolvedLocalVideos.length > 0) {
      const lines = [];
      if (unresolvedLocalImages.length > 0) {
        lines.push(t("autoVideo.render.unresolvedImage", { count: unresolvedLocalImages.length }));
        lines.push(...unresolvedLocalImages.slice(0, 10).map((s) => `#${s.index} (image): ${s.imagePath}`));
      }
      if (unresolvedLocalVideos.length > 0) {
        lines.push(t("autoVideo.render.unresolvedVideo", { count: unresolvedLocalVideos.length }));
        lines.push(...unresolvedLocalVideos.slice(0, 10).map((s) => `#${s.index} (video): ${s.videoPath}`));
      }
      const err = lines.join("\n");
      setRenderError(err);
      updateRenderProgress({ stage: "error", percent: 0, message: err });
      toast.error(t("autoVideo.render.resolveMediaFailed"));
      activeRenderJobIdRef.current = null;
      setRenderJobId(null);
      return;
    }
    appendRenderLog([
      `Render job: ${jobId}`,
      `Segments: ${resolvedSegments.length}`,
      `Segments with image: ${resolvedSegments.filter((s) => s.imagePath).length}`,
      `First image paths: ${resolvedSegments.filter((s) => s.imagePath).slice(0, 5).map((s) => `#${s.index} ${s.imagePath}`).join(" | ") || "(none)"}`
    ].join("\n"));
    updateRenderProgress({ stage: "segments", percent: 0, message: t("autoVideo.render.starting") });
    try {
      const result = await window.autoVideoRuntime?.render({
        jobId,
        audioPath: audioFilePath,
        segments: resolvedSegments.map((s) => ({
          index: s.index,
          startMs: s.startMs,
          endMs: s.endMs,
          text: s.text,
          imagePath: s.imagePath,
          videoPath: s.videoPath,
          mediaEffect: s.mediaEffect ?? "none",
          transitionToNext: s.transitionToNext ?? "none",
          sfxPath: s.sfxPath ?? ""
        })),
        mediaMode,
        resolution: renderSettings.resolution,
        fps: renderSettings.fps,
        codec: renderSettings.codec,
        crf: renderSettings.crf,
        outputPath: picked.path,
        burnSubtitles: renderSettings.burnSubtitles,
        subtitleFontSize: renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : void 0,
        bgmPath: renderSettings.bgmPath || void 0,
        bgmVolume: renderSettings.bgmVolume,
        bgmDuckVoice: renderSettings.bgmDuckVoice
      });
      if (!result || !result.success) {
        const err = result?.error || t("autoVideo.render.failedFallback");
        setRenderError(err);
        updateRenderProgress({ stage: "error", percent: 0, message: err });
        toast.error(err.split("\n")[0]);
        return;
      }
      setOutputVideoPath(result.outputPath ?? null);
      updateRenderProgress({ stage: "done", percent: 100, message: t("autoVideo.render.done") });
      toast.success(t("autoVideo.render.done"));
    } catch (err) {
      const msg = err.message || String(err);
      setRenderError(msg);
      updateRenderProgress({ stage: "error", percent: 0, message: msg });
      toast.error(msg);
    } finally {
      activeRenderJobIdRef.current = null;
      setRenderJobId(null);
    }
  }, [
    audioFilePath,
    audioFileName,
    segments,
    mediaMode,
    renderSettings,
    setRenderJobId,
    setRenderError,
    setOutputVideoPath,
    updateRenderProgress,
    appendRenderLog,
    t
  ]);
  const handleCancelRender = reactExports.useCallback(async () => {
    if (!renderJobId) return;
    await window.autoVideoRuntime?.cancel(renderJobId);
    activeRenderJobIdRef.current = null;
    updateRenderProgress({ stage: "idle", percent: 0, message: t("autoVideo.render.cancelled") });
    setRenderJobId(null);
  }, [renderJobId, t, updateRenderProgress, setRenderJobId]);
  const handleOpenFolder = reactExports.useCallback(() => {
    if (outputVideoPath) window.autoVideoRuntime?.showInFolder(outputVideoPath);
  }, [outputVideoPath]);
  const handleOpenVideo = reactExports.useCallback(() => {
    if (outputVideoPath) window.autoVideoRuntime?.openFile(outputVideoPath);
  }, [outputVideoPath]);
  const handlePickBgm = reactExports.useCallback((file) => {
    const path = file.path;
    if (!path) {
      toast.error(t("autoVideo.render.bgmPathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!AUDIO_EXTS.includes(ext)) {
      toast.error(t("autoVideo.import.unsupportedFormat", { ext }));
      return;
    }
    setRenderSettings({ bgmPath: path });
    toast.success(t("autoVideo.render.bgmLoaded"));
  }, [setRenderSettings, t]);
  const rendering = renderJobId !== null && renderProgress.stage !== "done" && renderProgress.stage !== "error";
  const done = renderProgress.stage === "done" && outputVideoPath;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-3xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border border-border rounded-xl p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: t("autoVideo.render.statSentences"), value: String(stats.total) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: t("autoVideo.render.statDuration"), value: formatTime(stats.totalDurationMs) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Stat,
        {
          label: mediaMode === "video" ? t("autoVideo.render.statMissingMedia") : t("autoVideo.render.statMissingImages"),
          value: String(stats.missing),
          warn: stats.missing > 0
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-4 text-xs space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: t("autoVideo.render.diagnostics") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: t("autoVideo.render.diagnosticsSummary", { mode: mediaMode, images: stats.withImages, total: stats.total, videos: stats.withVideos, fallback: stats.fallbackImages, missing: stats.missing }) }),
      imagePathSamples.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-muted/30 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap text-2xs", children: imagePathSamples.join("\n") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-amber-500", children: t("autoVideo.render.noImagePath") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold mb-2", children: t("autoVideo.render.settings") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autoVideo.render.resolution") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: RESOLUTIONS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            active: renderSettings.resolution === r.value,
            onClick: () => setRenderSettings({ resolution: r.value }),
            disabled: rendering,
            children: r.label
          },
          r.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: "FPS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: FPS_OPTIONS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            active: renderSettings.fps === f,
            onClick: () => setRenderSettings({ fps: f }),
            disabled: rendering,
            children: f
          },
          f
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: "Codec" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: CODECS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            active: renderSettings.codec === c.value,
            onClick: () => setRenderSettings({ codec: c.value }),
            disabled: rendering,
            hint: c.value === "h264_nvenc" ? t("autoVideo.render.gpuRequired") : void 0,
            children: c.label
          },
          c.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs mb-1.5 block", children: [
          "CRF — ",
          renderSettings.crf
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "range",
            min: 18,
            max: 28,
            value: renderSettings.crf,
            onChange: (e) => setRenderSettings({ crf: parseInt(e.target.value, 10) }),
            disabled: rendering,
            className: "w-full"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-2xs text-muted-foreground mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("autoVideo.render.qualityHigh") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("autoVideo.render.fileSmall") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold mb-2", children: t("autoVideo.render.overlayTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Captions, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("autoVideo.render.burnSubtitles") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: renderSettings.burnSubtitles,
            onCheckedChange: (checked) => setRenderSettings({ burnSubtitles: checked }),
            disabled: rendering
          }
        )
      ] }),
      renderSettings.burnSubtitles && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs mb-1.5 block", children: [
          t("autoVideo.render.subtitleFontSize"),
          " — ",
          renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : t("autoVideo.render.subtitleFontAuto")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "range",
            min: 28,
            max: 96,
            value: renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : 48,
            onChange: (e) => setRenderSettings({ subtitleFontSize: parseInt(e.target.value, 10) }),
            disabled: rendering,
            className: "w-full"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Music, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("autoVideo.render.bgm") })
        ] }),
        renderSettings.bgmPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[220px]", children: renderSettings.bgmPath.split(/[\\/]/).pop() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setRenderSettings({ bgmPath: "" }),
              disabled: rendering,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => bgmInputRef.current?.click(), disabled: rendering, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4 mr-1" }),
          t("autoVideo.render.bgmChoose")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: bgmInputRef,
          type: "file",
          accept: AUDIO_EXTS.map((e) => `.${e}`).join(","),
          className: "hidden",
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) handlePickBgm(f);
            e.target.value = "";
          }
        }
      ),
      renderSettings.bgmPath && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs mb-1.5 block", children: [
            t("autoVideo.render.bgmVolume"),
            " — ",
            Math.round(renderSettings.bgmVolume * 100),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 0,
              max: 100,
              step: 5,
              value: Math.round(renderSettings.bgmVolume * 100),
              onChange: (e) => setRenderSettings({ bgmVolume: parseInt(e.target.value, 10) / 100 }),
              disabled: rendering,
              className: "w-full"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("autoVideo.render.bgmDuck") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: renderSettings.bgmDuckVoice,
              onCheckedChange: (checked) => setRenderSettings({ bgmDuckVoice: checked }),
              disabled: rendering
            }
          )
        ] })
      ] })
    ] }),
    rendering ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-5 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: t("autoVideo.render.title") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: renderProgress.percent }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: renderProgress.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
          Math.round(renderProgress.percent),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleCancelRender, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4 mr-2" }),
        t("autoVideo.render.cancelRender")
      ] })
    ] }) : done ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-500/5 border border-green-500/30 rounded-xl p-5 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-green-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-5 h-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: t("autoVideo.render.done") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground break-all", children: outputVideoPath }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleOpenVideo, className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4 mr-2" }),
          t("autoVideo.render.openVideo")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleOpenFolder, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4 mr-2" }),
          t("autoVideo.render.openFolder")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleStartRender, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
          t("autoVideo.render.renderAgain")
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => setStage("editor"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
        t("autoVideo.editor.back")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleStartRender, size: "lg", disabled: !audioFilePath || segments.length === 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4 mr-2" }),
        t("autoVideo.render.startRender")
      ] })
    ] }),
    renderError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-500/5 border border-red-500/30 rounded-xl p-4 text-xs space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-red-600 font-medium", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4" }),
        t("autoVideo.render.failed")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap text-muted-foreground", children: renderError }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => {
            navigator.clipboard.writeText(renderError + "\n\n" + renderLog);
            toast.success(t("autoVideo.render.copySuccess"));
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3 h-3 mr-1" }),
            t("autoVideo.render.copyLog")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold", children: t("autoVideo.render.logTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              navigator.clipboard.writeText([renderError, renderLog].filter(Boolean).join("\n\n"));
              toast.success(t("autoVideo.render.copySuccess"));
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3 h-3 mr-1" }),
              t("autoVideo.render.copy")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-2xs text-muted-foreground bg-muted/30 rounded p-3 max-h-72 overflow-auto whitespace-pre-wrap", children: [renderError, renderLog].filter(Boolean).join("\n\n") || t("autoVideo.render.emptyLog") })
    ] })
  ] }) });
}
function Stat({ label, value, warn }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("text-2xl font-bold mt-1", warn && "text-amber-500"), children: value })
  ] });
}
function Chip({
  active,
  onClick,
  disabled,
  hint,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      onClick,
      disabled,
      title: hint,
      className: cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
      ),
      children
    }
  );
}
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1e3);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function AutoVideoView() {
  const { t } = useI18n();
  const stage = useAutoVideoStore((s) => s.stage);
  const setStage = useAutoVideoStore((s) => s.setStage);
  const srtSegments = useAutoVideoStore((s) => s.srtSegments);
  const audioFilePath = useAutoVideoStore((s) => s.audioFilePath);
  const stages = [
    { id: "import", label: t("autoVideo.stage.import") },
    { id: "editor", label: t("autoVideo.stage.editor"), disabled: srtSegments.length === 0 || !audioFilePath },
    { id: "render", label: t("autoVideo.stage.render"), disabled: srtSegments.length === 0 || !audioFilePath }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-panel/70 px-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1", children: stages.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        disabled: s.disabled,
        onClick: () => !s.disabled && setStage(s.id),
        className: cn(
          "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
          stage === s.id ? "bg-primary text-primary-foreground" : s.disabled ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "opacity-60 mr-1", children: [
            i + 1,
            "."
          ] }),
          s.label
        ]
      },
      s.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden", children: [
      stage === "import" && /* @__PURE__ */ jsxRuntimeExports.jsx(StageImport, {}),
      stage === "editor" && /* @__PURE__ */ jsxRuntimeExports.jsx(StageEditor, {}),
      stage === "render" && /* @__PURE__ */ jsxRuntimeExports.jsx(StageRender, {})
    ] })
  ] });
}
export {
  AutoVideoView
};
