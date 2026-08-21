"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Progress } from "@/shared/components/ui/progress";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import {
  FileAudio,
  FileText,
  FileSpreadsheet,
  Sparkles,
  X,
  ExternalLink,
  ArrowRight,
  Mic,
  AudioLines,
} from "lucide-react";
import {
  WHISPER_PROVIDERS,
  WHISPER_PROVIDER_ORDER,
} from "@/features/video-studio/lib/auto-video/whisper-api";
import { GEMINI_VOICES, GEMINI_LANGUAGES } from "@/features/tts-voice/lib/gemini-voices";

import {
  AUDIO_EXTS,
  CAPCUT_VI_VOICES,
  DEFAULT_CAPCUT_VOICE,
  TTS_ENGINE_OPTIONS,
  VIDEO_EXTS,
  formatBytes,
  formatDuration,
  getCapCutVoice,
  type TtsEngineId,
} from "./import/constants";
import {
  CsvPreviewRow,
  DropZone,
  ModeChip,
  ProviderChip,
  Section,
  type TranscribeStageId,
} from "./import/ui";

export function StageImport() {
  const { t } = useI18n();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [audioBusy, setAudioBusy] = useState(false);

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

  // Local draft for inline CSV edits. Keyed by row.index. Save commits to store.
  type RowEdit = { voice?: string; imagePath?: string; videoPath?: string };
  const [csvEdits, setCsvEdits] = useState<Record<number, RowEdit>>({});

  // Drop edits when the underlying CSV is cleared/replaced.
  useEffect(() => {
    setCsvEdits({});
  }, [csvFileName, csvRows.length]);

  const dirtyCount = Object.keys(csvEdits).length;

  const setRowEdit = useCallback((rowIndex: number, patch: RowEdit) => {
    setCsvEdits((prev) => {
      const next = { ...prev };
      const cur = next[rowIndex] ?? {};
      next[rowIndex] = { ...cur, ...patch };
      return next;
    });
  }, []);

  const handleSaveCsvEdits = useCallback(() => {
    const edits = Object.entries(csvEdits).map(([k, v]) => ({
      index: parseInt(k, 10),
      ...v,
    }));
    if (edits.length === 0) return;
    updateCsvRows(edits);
    setCsvEdits({});
    toast.success(t("autoVideo.import.savedChanges", { count: edits.length }));
  }, [csvEdits, t, updateCsvRows]);

  const handleDiscardCsvEdits = useCallback(() => {
    setCsvEdits({});
  }, []);

  const handlePickRowImage = useCallback((rowIndex: number, file: File) => {
    type ElectronFile = File & { path?: string };
    const path = (file as ElectronFile).path;
    if (!path) {
      toast.error(t("autoVideo.import.filePathMissing"));
      return;
    }
    setRowEdit(rowIndex, { imagePath: path });
  }, [setRowEdit, t]);

  const handlePickRowVideo = useCallback((rowIndex: number, file: File) => {
    type ElectronFile = File & { path?: string };
    const path = (file as ElectronFile).path;
    if (!path) {
      toast.error(t("autoVideo.import.filePathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!VIDEO_EXTS.includes(ext)) {
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

  // Subscribe to whisper progress events from main process.
  useEffect(() => {
    const api = window.whisperRuntime;
    if (!api) return;
    const off = api.onProgress((event) => {
      if (event.jobId !== transcribeJobId) return;
      const stageMap: Record<string, string> = {
        probing: t("autoVideo.import.progressProbing"),
        chunking: t("autoVideo.import.progressChunking"),
        uploading: t("autoVideo.import.progressUploading"),
        merging: t("autoVideo.import.progressMerging"),
        done: t("autoVideo.import.progressDone"),
      };
      const message = event.message
        || (event.stage ? stageMap[event.stage] || event.stage : "")
        || (event.type === "chunk-start"
          ? `Chunk ${(event.chunkIndex ?? 0) + 1}/${event.chunkTotal ?? 1}`
          : "");
      updateTranscribeProgress({
        stage: (event.stage as TranscribeStageId) || "uploading",
        message,
        percent: event.percent ?? 0,
      });
    });
    return () => off();
  }, [t, transcribeJobId, updateTranscribeProgress]);

  // ---- Audio handling ----
  const handlePickAudio = useCallback(async (file: File) => {
    type ElectronFile = File & { path?: string };
    const path = (file as ElectronFile).path;
    if (!path) {
      toast.error(t("autoVideo.import.desktopPathMissing"));
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!AUDIO_EXTS.includes(ext)) {
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
        durationSec: probe?.durationSec ?? null,
      });
    } catch (err) {
      toast.error(t("autoVideo.import.audioReadFailed", { message: (err as Error).message }));
    } finally {
      setAudioBusy(false);
    }
  }, [setAudio, t]);

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handlePickAudio(file);
  }, [handlePickAudio]);

  // ---- SRT handling ----
  const handleSrtFile = useCallback(async (file: File) => {
    const text = await file.text();
    const result = loadSrtRaw(text);
    if (!result.ok) {
      toast.error(result.error || t("autoVideo.import.srtInvalid"));
    } else {
      toast.success(t("autoVideo.import.srtLoaded", { count: result.segmentCount }));
    }
  }, [loadSrtRaw, t]);

  // ---- CSV handling ----
  const handleCsvFile = useCallback(async (file: File) => {
    const text = await file.text();
    const result = loadCsvRaw(text, file.name);
    if (!result.ok) {
      toast.error(result.error || t("autoVideo.import.csvInvalid"));
    } else {
      toast.success(t("autoVideo.import.csvRowsLoaded", { count: result.rowCount }));
    }
  }, [loadCsvRaw, t]);

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleCsvFile(file);
  }, [handleCsvFile]);

  // ---- Transcribe ----
  const apiKey = whisperApiKeys[whisperProvider];
  const providerCfg = WHISPER_PROVIDERS[whisperProvider];

  const handleTranscribe = useCallback(async () => {
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
        language: whisperLanguage || undefined,
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
      const msg = (err as Error).message || String(err);
      setTranscribeError(msg);
      updateTranscribeProgress({ stage: "error", message: msg, percent: 0 });
      toast.error(msg);
    } finally {
      setTranscribeJobId(null);
    }
  }, [
    audioFilePath, apiKey, whisperProvider, whisperLanguage,
    setTranscribeJobId, setTranscribeError, updateTranscribeProgress, loadSrtRaw, setStage, t,
  ]);

  const handleCancelTranscribe = useCallback(async () => {
    if (!transcribeJobId) return;
    await window.whisperRuntime?.cancel(transcribeJobId);
    updateTranscribeProgress({ stage: "idle", message: t("autoVideo.import.cancelled"), percent: 0 });
    setTranscribeJobId(null);
  }, [t, transcribeJobId, updateTranscribeProgress, setTranscribeJobId]);

  const handleDownloadCurrentCsv = useCallback(() => {
    if (csvRows.length === 0) return;
    const escape = (v: string) => {
      const s = (v ?? "").toString();
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // Voice IS the spoken text — exporting both as separate cols just duplicates.
    // Keep 3 cols: index + voice (= spoken text) + image_path.
    // On re-import, csv-parser falls back to voice when "text" column is missing.
    const lines = mediaMode === "video"
      ? ["index,voice,image_path,video_path"]
      : ["index,voice,image_path"];
    for (const row of csvRows) {
      const values = mediaMode === "video"
        ? [row.index, escape(row.voice), escape(row.imagePath), escape(row.videoPath)]
        : [row.index, escape(row.voice), escape(row.imagePath)];
      lines.push(values.join(","));
    }
    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (csvFileName?.replace(/\.csv$/i, "") || "auto-video") + "-export.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [csvRows, csvFileName, mediaMode]);

  // ---- TTS voice generation ----
  const [ttsEngine, setTtsEngine] = useState<TtsEngineId>("omnivoice");
  const [ttsTextSource, setTtsTextSource] = useState<"csv" | "custom">("csv");
  const [ttsCustomText, setTtsCustomText] = useState("");
  const [ttsGeminiVoice, setTtsGeminiVoice] = useState("Puck");
  const [ttsGeminiLang, setTtsGeminiLang] = useState("vi-VN");
  const [ttsCapcutVoiceType, setTtsCapcutVoiceType] = useState(DEFAULT_CAPCUT_VOICE);
  const [ttsGenerating, setTtsGenerating] = useState(false);
  const [ttsProgress, setTtsProgress] = useState<{ percent: number; message: string } | null>(null);
  const [ttsJobId, setTtsJobId] = useState<string | null>(null);

  const csvNarration = csvRows
    .map((row) => row.voice)
    .filter((v) => v && v.trim())
    .map((v) => v.trim());
  const narrationText = ttsTextSource === "csv" ? csvNarration.join("\n") : ttsCustomText;

  useEffect(() => {
    const api = window.ttsRuntime;
    if (!api) return;
    const off = api.onEvent((event) => {
      if (event.jobId !== ttsJobId) return;
      if (event.kind !== "generate") return;
      setTtsProgress({ percent: event.percent ?? 0, message: event.message });
    });
    return () => off();
  }, [ttsJobId]);

  const handleGenerateVoice = useCallback(async () => {
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
        ...(ttsEngine === "capcut"
          ? { capcutVoiceType: ttsCapcutVoiceType, capcutResourceId: getCapCutVoice(ttsCapcutVoiceType)?.resourceId ?? "" }
          : {}),
        ...(ttsEngine === "gemini" ? { geminiVoiceName: ttsGeminiVoice } : {}),
      });
      if (!result || !result.success) {
        throw new Error(result?.error || t("autoVideo.ttsGen.failedGeneric"));
      }
      const outputPath = result.outputPath ?? "";
      setAudio({
        path: outputPath,
        name: `tts-${ttsEngine}.${outputPath.split(".").pop() ?? "wav"}`,
        size: 0,
        durationSec: result.durationSec ?? null,
      });
      setTtsProgress({ percent: 100, message: t("autoVideo.import.progressDone") });
      toast.success(t("autoVideo.ttsGen.done", { seconds: result.durationSec ? Math.round(result.durationSec) : 0 }));
    } catch (err) {
      toast.error(t("autoVideo.ttsGen.failed", { message: (err as Error).message || String(err) }));
    } finally {
      setTtsJobId(null);
      setTtsGenerating(false);
    }
  }, [narrationText, ttsEngine, ttsGeminiVoice, ttsGeminiLang, ttsCapcutVoiceType, setAudio, t]);

  const handleCancelVoice = useCallback(async () => {
    if (!ttsJobId) return;
    await window.ttsRuntime?.cancel(ttsJobId);
    setTtsJobId(null);
    setTtsGenerating(false);
    setTtsProgress(null);
  }, [ttsJobId]);

  const transcribing = transcribeProgress.stage !== "idle"
    && transcribeProgress.stage !== "done"
    && transcribeProgress.stage !== "error";

  const canProceed = audioFilePath && srtSegments.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* === Media mode === */}
        <Section title={t("autoVideo.mediaMode.title")}>
          <div className="flex gap-2">
            <ModeChip active={mediaMode === "image"} onClick={() => setMediaMode("image")} label={t("autoVideo.mediaMode.imagePath")} />
            <ModeChip active={mediaMode === "video"} onClick={() => setMediaMode("video")} label={t("autoVideo.mediaMode.videoPath")} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {t("autoVideo.mediaMode.help")}
          </div>
        </Section>

        {/* === Audio === */}
        <Section
          title={t("autoVideo.import.audio")}
          icon={<FileAudio className="w-4 h-4" />}
        >
          {!audioFilePath ? (
            <DropZone
              hint={t("autoVideo.import.audioDrop")}
              onDrop={handleAudioDrop}
              onClick={() => audioInputRef.current?.click()}
              busy={audioBusy}
            />
          ) : (
            <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileAudio className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{audioFileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(audioFileSize)} · {formatDuration(audioDurationSec)}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearAudio} disabled={transcribing}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <input
            ref={audioInputRef}
            type="file"
            accept={AUDIO_EXTS.map((e) => `.${e}`).join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePickAudio(f);
              e.target.value = "";
            }}
          />
        </Section>

        {/* === TTS voice generation === */}
        <Section
          title={t("autoVideo.ttsGen.title")}
          icon={<Mic className="w-4 h-4" />}
          right={
            audioFilePath ? (
              <span className="text-[10px] text-muted-foreground">
                {t("autoVideo.ttsGen.audioReady")}
              </span>
            ) : null
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("autoVideo.ttsGen.help")}</p>

            <div>
              <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                {t("autoVideo.ttsGen.engine")}
              </Label>
              <div className="flex gap-2">
                {TTS_ENGINE_OPTIONS.map((opt) => (
                  <ModeChip
                    key={opt.id}
                    active={ttsEngine === opt.id}
                    onClick={() => setTtsEngine(opt.id)}
                    label={t(opt.labelKey)}
                  />
                ))}
              </div>
            </div>

            {ttsEngine === "capcut" && (
              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                  {t("autoVideo.ttsGen.voice")}
                </Label>
                <select
                  value={ttsCapcutVoiceType}
                  onChange={(e) => setTtsCapcutVoiceType(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  {CAPCUT_VI_VOICES.map((voice) => (
                    <option key={voice.voiceType} value={voice.voiceType}>
                      {voice.displayName} ({voice.languageCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {ttsEngine === "gemini" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                    {t("autoVideo.ttsGen.voice")}
                  </Label>
                  <select
                    value={ttsGeminiVoice}
                    onChange={(e) => setTtsGeminiVoice(e.target.value)}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    {GEMINI_VOICES.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} — {voice.description} ({voice.gender})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                    {t("autoVideo.ttsGen.language")}
                  </Label>
                  <select
                    value={ttsGeminiLang}
                    onChange={(e) => setTtsGeminiLang(e.target.value)}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    {GEMINI_LANGUAGES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {ttsEngine === "omnivoice" && (
              <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-2">
                {t("autoVideo.ttsGen.omnivoiceNote")}
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                {t("autoVideo.ttsGen.source")}
              </Label>
              <div className="flex gap-2">
                <ModeChip
                  active={ttsTextSource === "csv"}
                  onClick={() => setTtsTextSource("csv")}
                  disabled={csvNarration.length === 0}
                  label={t("autoVideo.ttsGen.fromCsv", { count: csvNarration.length })}
                />
                <ModeChip
                  active={ttsTextSource === "custom"}
                  onClick={() => setTtsTextSource("custom")}
                  label={t("autoVideo.ttsGen.customText")}
                />
              </div>
              {ttsTextSource === "custom" ? (
                <Textarea
                  value={ttsCustomText}
                  onChange={(e) => setTtsCustomText(e.target.value)}
                  placeholder={t("autoVideo.ttsGen.textPlaceholder")}
                  rows={4}
                  className="mt-2 text-xs"
                />
              ) : (
                <div className="text-xs text-muted-foreground mt-2">
                  {csvNarration.length > 0
                    ? t("autoVideo.ttsGen.csvSummary", { count: csvNarration.length })
                    : t("autoVideo.ttsGen.csvEmpty")}
                </div>
              )}
            </div>

            {ttsGenerating ? (
              <div className="space-y-2">
                <Progress value={ttsProgress?.percent ?? 0} />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ttsProgress?.message}</span>
                  <Button variant="outline" size="sm" onClick={handleCancelVoice}>
                    {t("autoVideo.import.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateVoice}
                disabled={!narrationText.trim() || audioBusy}
                className="w-full"
              >
                <AudioLines className="w-4 h-4 mr-2" />
                {t("autoVideo.ttsGen.generate")}
              </Button>
            )}
          </div>
        </Section>

        {/* === SRT source === */}
        <Section
          title={t("autoVideo.import.srtSource")}
          icon={<FileText className="w-4 h-4" />}
        >
          <div className="flex gap-2 mb-4">
            <ModeChip
              active={srtSourceMode === "api"}
              onClick={() => setSrtSourceMode("api")}
              label={t("autoVideo.import.srtViaApi")}
            />
            <ModeChip
              active={srtSourceMode === "import"}
              onClick={() => setSrtSourceMode("import")}
              label={t("autoVideo.import.srtViaImport")}
            />
          </div>

          {srtSourceMode === "api" ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                  {t("autoVideo.import.provider")}
                </Label>
                <div className="flex gap-2">
                  {WHISPER_PROVIDER_ORDER.map((p) => (
                    <ProviderChip
                      key={p}
                      provider={p}
                      active={whisperProvider === p}
                      onClick={() => setWhisperProvider(p)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                  {t("autoVideo.import.apiKey")}
                </Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setWhisperApiKey(whisperProvider, e.target.value)}
                  placeholder={providerCfg.apiKeyHint}
                  className="text-xs"
                />
                <a
                  href={providerCfg.apiKeyDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("autoVideo.import.apiKeyHint", { url: providerCfg.apiKeyDocsUrl })}
                </a>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block">
                  {t("autoVideo.import.language")}
                </Label>
                <Input
                  value={whisperLanguage}
                  onChange={(e) => setWhisperLanguage(e.target.value)}
                  placeholder={t("autoVideo.import.languageAuto")}
                  className="text-xs w-32"
                  maxLength={5}
                />
              </div>

              {transcribing ? (
                <div className="space-y-2">
                  <Progress value={transcribeProgress.percent} />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{transcribeProgress.message}</span>
                    <Button variant="outline" size="sm" onClick={handleCancelTranscribe}>
                      {t("autoVideo.import.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleTranscribe}
                  disabled={!audioFilePath || !apiKey}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("autoVideo.import.transcribe")}
                </Button>
              )}

              {transcribeError && !transcribing && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2">
                  {transcribeError}
                </div>
              )}

              {srtSegments.length > 0 && !transcribing && (
                <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/30 rounded p-2">
                  {t("autoVideo.import.srtReady", { count: srtSegments.length })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <DropZone
                hint={t("autoVideo.import.uploadSrt")}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleSrtFile(f);
                }}
                onClick={() => srtInputRef.current?.click()}
              />
              <input
                ref={srtInputRef}
                type="file"
                accept=".srt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSrtFile(f);
                  e.target.value = "";
                }}
              />
              {srtSegments.length > 0 && (
                <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/30 rounded p-2">
                  {srtSegments.length} câu
                </div>
              )}
            </div>
          )}
        </Section>

        {/* === CSV (optional) === */}
        <Section
          title={t("autoVideo.import.csvOptional")}
          icon={<FileSpreadsheet className="w-4 h-4" />}
          right={
            csvRows.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={handleDownloadCurrentCsv} className="text-xs">
                  {t("autoVideo.import.downloadCsv")}
              </Button>
            ) : null
          }
        >
          {!csvRows.length ? (
            <>
              <DropZone
                hint={t("autoVideo.import.csvDrop")}
                onDrop={handleCsvDrop}
                onClick={() => csvInputRef.current?.click()}
              />
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCsvFile(f);
                  e.target.value = "";
                }}
              />
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{csvFileName ?? "from-clipboard.csv"}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("autoVideo.import.csvLoaded", { count: csvRows.length })}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearCsv}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {dirtyCount > 0 && (
                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    {t("autoVideo.import.unsavedChanges", { count: dirtyCount })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDiscardCsvEdits}>
                      {t("autoVideo.import.discard")}
                    </Button>
                    <Button size="sm" onClick={handleSaveCsvEdits}>
                      {t("autoVideo.import.save")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-border max-h-[320px] overflow-y-auto overflow-x-hidden">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: '7%' }} />
                    <col style={{ width: mediaMode === "video" ? '39%' : '53%' }} />
                    <col style={{ width: mediaMode === "video" ? '27%' : '40%' }} />
                    {mediaMode === "video" && <col style={{ width: '27%' }} />}
                  </colgroup>
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">{t("autoVideo.import.voice")}</th>
                      <th className="p-2 text-left">{t("autoVideo.import.image")}</th>
                      {mediaMode === "video" && <th className="p-2 text-left">{t("autoVideo.import.video")}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <CsvPreviewRow
                        key={`${row.index}-${i}`}
                        row={row}
                        edit={csvEdits[row.index]}
                        showVideo={mediaMode === "video"}
                        onVoiceChange={(v) => setRowEdit(row.index, { voice: v })}
                        onPickImage={(file) => handlePickRowImage(row.index, file)}
                        onClearImage={() => setRowEdit(row.index, { imagePath: '' })}
                        onPickVideo={(file) => handlePickRowVideo(row.index, file)}
                        onClearVideo={() => setRowEdit(row.index, { videoPath: '' })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>

        {/* === Continue === */}
        <div className="flex justify-end pt-4">
          <Button
            disabled={!canProceed}
            onClick={() => setStage("editor")}
            size="lg"
          >
            {t("autoVideo.editor.proceedRender")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
