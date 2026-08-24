"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useI18n } from "@/shared/i18n";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import {
  Play,
  Square,
  FolderOpen,
  RefreshCw,
  Copy,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Music,
  X,
  Captions,
} from "lucide-react";
import type {
  RenderResolution,
  RenderFps,
  RenderCodec,
} from "@/features/video-studio/lib/auto-video/types";

const AUDIO_EXTS = ["mp3", "wav", "m4a", "flac", "ogg"];

const RESOLUTIONS: { value: RenderResolution; label: string }[] = [
  { value: "1280x720", label: "720p" },
  { value: "1920x1080", label: "1080p" },
  { value: "3840x2160", label: "4K" },
];

const FPS_OPTIONS: RenderFps[] = [24, 30, 60];

const CODECS: { value: RenderCodec; label: string; hint?: string }[] = [
  { value: "libx264", label: "H.264 (CPU)" },
  { value: "libx265", label: "H.265 (CPU)" },
  { value: "h264_nvenc", label: "H.264 (NVIDIA GPU)" },
];

export function StageRender() {
  const { t } = useI18n();
  const bgmInputRef = useRef<HTMLInputElement>(null);

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

  const activeRenderJobIdRef = useRef<string | null>(null);

  const stats = useMemo(() => {
    const total = segments.length;
    const missing = mediaMode === "video"
      ? segments.filter((s) => !s.videoPath && !s.imagePath).length
      : segments.filter((s) => !s.imagePath).length;
    const withImages = segments.filter((s) => s.imagePath).length;
    const withVideos = segments.filter((s) => s.videoPath).length;
    const fallbackImages = mediaMode === "video" ? segments.filter((s) => !s.videoPath && s.imagePath).length : 0;
    const totalDurationMs = segments.length > 0 ? segments[segments.length - 1].endMs : 0;
    return { total, missing, withImages, withVideos, fallbackImages, totalDurationMs };
  }, [segments, mediaMode]);

  const imagePathSamples = useMemo(() => (
    segments
      .filter((s) => mediaMode === "video" ? (s.videoPath || s.imagePath) : s.imagePath)
      .slice(0, 5)
      .map((s) => `#${s.index}: ${mediaMode === "video" ? (s.videoPath || `[${t("autoVideo.import.fallbackImage")}] ${s.imagePath}`) : s.imagePath}`)
  ), [segments, mediaMode, t]);

  // Listen to render events
  useEffect(() => {
    const api = window.autoVideoRuntime;
    if (!api) return;
    const off = api.onEvent((event) => {
      if (event.jobId !== activeRenderJobIdRef.current) return;

      if (event.type === "log" && event.message) {
        appendRenderLog(event.message);
        return;
      }

      const stageMap: Record<string, "idle" | "segments" | "concat" | "done" | "error"> = {
        preparing: "segments",
        "building-segments": "segments",
        concatenating: "concat",
        done: "done",
        error: "error",
      };

      const message = event.message
        || (event.type === "segment-start" && event.segmentIndex != null
          ? t("autoVideo.render.segmentProgress", { index: event.segmentIndex + 1, total: event.segmentTotal ?? 0 })
          : event.type === "segment-done" && event.segmentIndex != null
            ? t("autoVideo.render.segmentDone", { index: event.segmentIndex + 1, total: event.segmentTotal ?? 0 })
            : "");

      updateRenderProgress({
        stage: event.stage ? stageMap[event.stage] || "segments" : "segments",
        percent: event.percent ?? 0,
        message,
      });
    });
    return () => off();
  }, [t, updateRenderProgress, appendRenderLog]);

  const handleStartRender = useCallback(async () => {
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
      const lines: string[] = [];
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
      `First image paths: ${resolvedSegments.filter((s) => s.imagePath).slice(0, 5).map((s) => `#${s.index} ${s.imagePath}`).join(' | ') || '(none)'}`,
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
          sfxPath: s.sfxPath ?? "",
        })),
        mediaMode,
        resolution: renderSettings.resolution,
        fps: renderSettings.fps,
        codec: renderSettings.codec,
        crf: renderSettings.crf,
        outputPath: picked.path,
        burnSubtitles: renderSettings.burnSubtitles,
        subtitleFontSize: renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : undefined,
        bgmPath: renderSettings.bgmPath || undefined,
        bgmVolume: renderSettings.bgmVolume,
        bgmDuckVoice: renderSettings.bgmDuckVoice,
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
      const msg = (err as Error).message || String(err);
      setRenderError(msg);
      updateRenderProgress({ stage: "error", percent: 0, message: msg });
      toast.error(msg);
    } finally {
      activeRenderJobIdRef.current = null;
      setRenderJobId(null);
    }
  }, [
    audioFilePath, audioFileName, segments, mediaMode, renderSettings,
    setRenderJobId, setRenderError, setOutputVideoPath, updateRenderProgress, appendRenderLog, t,
  ]);

  const handleCancelRender = useCallback(async () => {
    if (!renderJobId) return;
    await window.autoVideoRuntime?.cancel(renderJobId);
    activeRenderJobIdRef.current = null;
    updateRenderProgress({ stage: "idle", percent: 0, message: t("autoVideo.render.cancelled") });
    setRenderJobId(null);
  }, [renderJobId, t, updateRenderProgress, setRenderJobId]);

  const handleOpenFolder = useCallback(() => {
    if (outputVideoPath) window.autoVideoRuntime?.showInFolder(outputVideoPath);
  }, [outputVideoPath]);

  const handleOpenVideo = useCallback(() => {
    if (outputVideoPath) window.autoVideoRuntime?.openFile(outputVideoPath);
  }, [outputVideoPath]);

  const handlePickBgm = useCallback((file: File) => {
    type ElectronFile = File & { path?: string };
    const path = (file as ElectronFile).path;
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Header summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat label={t("autoVideo.render.statSentences")} value={String(stats.total)} />
            <Stat label={t("autoVideo.render.statDuration")} value={formatTime(stats.totalDurationMs)} />
            <Stat
              label={mediaMode === "video" ? t("autoVideo.render.statMissingMedia") : t("autoVideo.render.statMissingImages")}
              value={String(stats.missing)}
              warn={stats.missing > 0}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold">{t("autoVideo.render.diagnostics")}</div>
          <div className="text-muted-foreground">
            {t("autoVideo.render.diagnosticsSummary", { mode: mediaMode, images: stats.withImages, total: stats.total, videos: stats.withVideos, fallback: stats.fallbackImages, missing: stats.missing })}
          </div>
          {imagePathSamples.length > 0 ? (
            <pre className="bg-muted/30 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap text-2xs">
              {imagePathSamples.join("\n")}
            </pre>
          ) : (
            <div className="text-amber-500">{t("autoVideo.render.noImagePath")}</div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold mb-2">{t("autoVideo.render.settings")}</h3>

          <div>
            <Label className="text-xs mb-1.5 block">{t("autoVideo.render.resolution")}</Label>
            <div className="flex gap-2">
              {RESOLUTIONS.map((r) => (
                <Chip
                  key={r.value}
                  active={renderSettings.resolution === r.value}
                  onClick={() => setRenderSettings({ resolution: r.value })}
                  disabled={rendering}
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">FPS</Label>
            <div className="flex gap-2">
              {FPS_OPTIONS.map((f) => (
                <Chip
                  key={f}
                  active={renderSettings.fps === f}
                  onClick={() => setRenderSettings({ fps: f })}
                  disabled={rendering}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Codec</Label>
            <div className="flex gap-2 flex-wrap">
              {CODECS.map((c) => (
                <Chip
                  key={c.value}
                  active={renderSettings.codec === c.value}
                  onClick={() => setRenderSettings({ codec: c.value })}
                  disabled={rendering}
                  hint={c.value === "h264_nvenc" ? t("autoVideo.render.gpuRequired") : undefined}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">
              CRF — {renderSettings.crf}
            </Label>
            <input
              type="range"
              min={18}
              max={28}
              value={renderSettings.crf}
              onChange={(e) => setRenderSettings({ crf: parseInt(e.target.value, 10) })}
              disabled={rendering}
              className="w-full"
            />
            <div className="flex justify-between text-2xs text-muted-foreground mt-1">
              <span>{t("autoVideo.render.qualityHigh")}</span>
              <span>{t("autoVideo.render.fileSmall")}</span>
            </div>
          </div>
        </div>

        {/* Subtitle + BGM */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold mb-2">{t("autoVideo.render.overlayTitle")}</h3>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Captions className="w-4 h-4 text-muted-foreground" />
              <Label>{t("autoVideo.render.burnSubtitles")}</Label>
            </div>
            <Switch
              checked={renderSettings.burnSubtitles}
              onCheckedChange={(checked) => setRenderSettings({ burnSubtitles: checked })}
              disabled={rendering}
            />
          </div>

          {renderSettings.burnSubtitles && (
            <div>
              <Label className="text-xs mb-1.5 block">
                {t("autoVideo.render.subtitleFontSize")} — {renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : t("autoVideo.render.subtitleFontAuto")}
              </Label>
              <input
                type="range"
                min={28}
                max={96}
                value={renderSettings.subtitleFontSize > 0 ? renderSettings.subtitleFontSize : 48}
                onChange={(e) => setRenderSettings({ subtitleFontSize: parseInt(e.target.value, 10) })}
                disabled={rendering}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <Label>{t("autoVideo.render.bgm")}</Label>
            </div>
            {renderSettings.bgmPath ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {renderSettings.bgmPath.split(/[\\/]/).pop()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenderSettings({ bgmPath: "" })}
                  disabled={rendering}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => bgmInputRef.current?.click()} disabled={rendering}>
                <FolderOpen className="w-4 h-4 mr-1" />
                {t("autoVideo.render.bgmChoose")}
              </Button>
            )}
          </div>
          <input
            ref={bgmInputRef}
            type="file"
            accept={AUDIO_EXTS.map((e) => `.${e}`).join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePickBgm(f);
              e.target.value = "";
            }}
          />

          {renderSettings.bgmPath && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5 block">
                  {t("autoVideo.render.bgmVolume")} — {Math.round(renderSettings.bgmVolume * 100)}%
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(renderSettings.bgmVolume * 100)}
                  onChange={(e) => setRenderSettings({ bgmVolume: parseInt(e.target.value, 10) / 100 })}
                  disabled={rendering}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label>{t("autoVideo.render.bgmDuck")}</Label>
                <Switch
                  checked={renderSettings.bgmDuckVoice}
                  onCheckedChange={(checked) => setRenderSettings({ bgmDuckVoice: checked })}
                  disabled={rendering}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action / progress / result */}
        {rendering ? (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{t("autoVideo.render.title")}</span>
            </div>
            <Progress value={renderProgress.percent} />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{renderProgress.message}</span>
              <span className="font-medium">{Math.round(renderProgress.percent)}%</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancelRender}>
              <Square className="w-4 h-4 mr-2" />
              {t("autoVideo.render.cancelRender")}
            </Button>
          </div>
        ) : done ? (
          <div className="bg-green-500/5 border border-green-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">{t("autoVideo.render.done")}</span>
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {outputVideoPath}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleOpenVideo} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                {t("autoVideo.render.openVideo")}
              </Button>
              <Button variant="outline" onClick={handleOpenFolder}>
                <FolderOpen className="w-4 h-4 mr-2" />
                {t("autoVideo.render.openFolder")}
              </Button>
              <Button variant="outline" onClick={handleStartRender}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("autoVideo.render.renderAgain")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => setStage("editor")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("autoVideo.editor.back")}
            </Button>
            <Button onClick={handleStartRender} size="lg" disabled={!audioFilePath || segments.length === 0}>
              <Play className="w-4 h-4 mr-2" />
              {t("autoVideo.render.startRender")}
            </Button>
          </div>
        )}

        {/* Error */}
        {renderError && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <AlertCircle className="w-4 h-4" />
              {t("autoVideo.render.failed")}
            </div>
            <pre className="whitespace-pre-wrap text-muted-foreground">{renderError}</pre>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(renderError + "\n\n" + renderLog);
                toast.success(t("autoVideo.render.copySuccess"));
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              {t("autoVideo.render.copyLog")}
            </Button>
          </div>
        )}

        {/* Render log */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs font-bold">{t("autoVideo.render.logTitle")}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText([renderError, renderLog].filter(Boolean).join("\n\n"));
                toast.success(t("autoVideo.render.copySuccess"));
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              {t("autoVideo.render.copy")}
            </Button>
          </div>
          <pre className="text-2xs text-muted-foreground bg-muted/30 rounded p-3 max-h-72 overflow-auto whitespace-pre-wrap">
            {[renderError, renderLog].filter(Boolean).join("\n\n") || t("autoVideo.render.emptyLog")}
          </pre>
        </div>
      </div>
    </ScrollArea>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-2xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold mt-1", warn && "text-amber-500")}>{value}</div>
    </div>
  );
}

function Chip({
  active, onClick, disabled, hint, children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
