"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  X,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import type { MappedSegment } from "@/features/video-studio/lib/auto-video/types";
import type { AutoVideoMediaEffect, AutoVideoTransition } from "@/features/video-studio/lib/auto-video/types";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];
const VIDEO_EXTS = ["mp4", "mov", "mkv", "webm"];
const SFX_EXTS = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
const MEDIA_EFFECT_OPTIONS: Array<{ value: AutoVideoMediaEffect; labelKey: string }> = [
  { value: "none", labelKey: "autoVideo.editor.effectNone" },
  { value: "zoom_in", labelKey: "autoVideo.editor.effectZoomIn" },
  { value: "zoom_out", labelKey: "autoVideo.editor.effectZoomOut" },
  { value: "pan_left", labelKey: "autoVideo.editor.effectPanLeft" },
  { value: "pan_right", labelKey: "autoVideo.editor.effectPanRight" },
  { value: "pan_up", labelKey: "autoVideo.editor.effectPanUp" },
  { value: "pan_down", labelKey: "autoVideo.editor.effectPanDown" },
  { value: "zoom_pan_left", labelKey: "autoVideo.editor.effectZoomPanLeft" },
  { value: "zoom_pan_right", labelKey: "autoVideo.editor.effectZoomPanRight" },
];
const TRANSITION_OPTIONS: Array<{ value: AutoVideoTransition; labelKey?: string; label?: string }> = [
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
  { value: "zoom_in", label: "Zoom In" },
];

const transitionLabel = (option: (typeof TRANSITION_OPTIONS)[number], t: (key: string) => string) =>
  option.labelKey ? t(option.labelKey) : option.label || option.value;
type BulkApplyMode = "all" | "random";

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDurationSec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-xs font-medium rounded transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}

// Convert any path/URL stored in csvRow.imagePath into something an <img> tag can render.
// local-image:// URLs are served by a registered protocol; absolute paths get the file:/// prefix.
function toImageSrc(input: string): string {
  if (!input) return "";
  if (input.startsWith("local-image://") || input.startsWith("file://") || input.startsWith("data:") || input.startsWith("http")) {
    return input;
  }
  return `file:///${input.replace(/\\/g, "/")}`;
}

function toMediaSrc(input: string): string {
  return toImageSrc(input);
}

function fileNameFromPath(input: string): string {
  return input.split(/[\\/]/).pop() || input;
}

export function StageEditor() {
  const { t } = useI18n();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const sfxFolderInputRef = useRef<HTMLInputElement>(null);

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
  const [randomEffectCount, setRandomEffectCount] = useState(0);
  const [randomTransitionCount, setRandomTransitionCount] = useState(0);
  const [randomSfxCount, setRandomSfxCount] = useState(0);
  const [sfxPaths, setSfxPaths] = useState<string[]>([]);
  const [bulkEffect, setBulkEffect] = useState<AutoVideoMediaEffect>("none");
  const [bulkEffectMode, setBulkEffectMode] = useState<BulkApplyMode>("all");
  const [bulkTransition, setBulkTransition] = useState<AutoVideoTransition>("none");
  const [bulkTransitionMode, setBulkTransitionMode] = useState<BulkApplyMode>("all");

  const stats = useMemo(() => {
    const total = segments.length;
    const missing = mediaMode === "video"
      ? segments.filter((s) => !s.videoPath && !s.imagePath).length
      : segments.filter((s) => !s.imagePath).length;
    const withVideo = segments.filter((s) => !!s.videoPath).length;
    const fallbackImages = mediaMode === "video" ? segments.filter((s) => !s.videoPath && !!s.imagePath).length : 0;
    const lowConf = segments.filter((s) => s.confidence != null && s.confidence < 0.4).length;
    const totalDurationMs = segments.length > 0 ? segments[segments.length - 1].endMs : 0;
    return { total, missing, lowConf, totalDurationMs, withVideo, fallbackImages };
  }, [segments, mediaMode]);

  const handleFolderPick = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const paths: string[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i] as File & { path?: string };
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

  const handleBulkEffectChange = useCallback((value: AutoVideoMediaEffect) => {
    setBulkEffect(value);
    if (bulkEffectMode === "all") applyMediaEffectToAll(value);
  }, [applyMediaEffectToAll, bulkEffectMode]);

  const handleBulkEffectModeChange = useCallback((value: BulkApplyMode) => {
    setBulkEffectMode(value);
    if (value === "all") applyMediaEffectToAll(bulkEffect);
  }, [applyMediaEffectToAll, bulkEffect]);

  const handleRandomEffects = useCallback(() => {
    const count = randomizeMediaEffects(randomEffectCount, bulkEffect);
    toast.success(t("autoVideo.editor.randomEffectsDone", { count }));
  }, [bulkEffect, randomEffectCount, randomizeMediaEffects, t]);

  const handleBulkTransitionChange = useCallback((value: AutoVideoTransition) => {
    setBulkTransition(value);
    if (bulkTransitionMode === "all") applyTransitionToAll(value);
  }, [applyTransitionToAll, bulkTransitionMode]);

  const handleBulkTransitionModeChange = useCallback((value: BulkApplyMode) => {
    setBulkTransitionMode(value);
    if (value === "all") applyTransitionToAll(bulkTransition);
  }, [applyTransitionToAll, bulkTransition]);

  const handleRandomTransitions = useCallback(() => {
    const count = randomizeTransitions(randomTransitionCount, bulkTransition);
    toast.success(t("autoVideo.editor.randomTransitionsDone", { count }));
  }, [bulkTransition, randomTransitionCount, randomizeTransitions, t]);

  const handleSfxFolderPick = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const paths: string[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i] as File & { path?: string };
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

  const handleRandomSfx = useCallback(() => {
    if (sfxPaths.length === 0) {
      toast.error(t("autoVideo.editor.noSfxSelected"));
      return;
    }
    const count = randomizeSfx(randomSfxCount, sfxPaths);
    toast.success(t("autoVideo.editor.randomSfxDone", { count }));
  }, [randomSfxCount, randomizeSfx, sfxPaths, t]);

  if (segments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {t("autoVideo.editor.noSegments")}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-panel/50 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-muted-foreground">{t("autoVideo.editor.segments", { n: stats.total })}</span>
          </div>
          <div className="text-muted-foreground">·</div>
          <div>
            <span className="text-muted-foreground">{t("autoVideo.editor.totalDuration")}: </span>
            <span className="font-medium">{formatTimestamp(stats.totalDurationMs)}</span>
          </div>
          {stats.missing > 0 && (
            <>
              <div className="text-muted-foreground">·</div>
              <div className="text-amber-500">
                {t("autoVideo.editor.missingImages", { n: stats.missing })}
              </div>
            </>
          )}
          {mediaMode === "video" && (
            <>
              <div className="text-muted-foreground">·</div>
              <div className="text-muted-foreground">{t("autoVideo.editor.videoCount", { count: stats.withVideo })}</div>
              <div className="text-muted-foreground">·</div>
              <div className="text-amber-500">{t("autoVideo.editor.fallbackImages", { count: stats.fallbackImages })}</div>
            </>
          )}
          {stats.lowConf > 0 && (
            <>
              <div className="text-muted-foreground">·</div>
              <div className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {t("autoVideo.editor.lowConfidenceCount", { count: stats.lowConf })}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={folderInputRef}
            type="file"
            multiple
            accept={(mediaMode === "video" ? VIDEO_EXTS : IMAGE_EXTS).map((e) => `.${e}`).join(",")}
            // @ts-expect-error - non-standard but supported in Chromium for folder picking
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={(e) => {
              handleFolderPick(e.target.files);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()}>
            <FolderOpen className="w-4 h-4 mr-1" />
            {mediaMode === "video" ? t("autoVideo.editor.autoFillVideoFolder") : t("autoVideo.editor.autoFillFolder")}
          </Button>
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
            <ModeButton active={mediaMode === "image"} onClick={() => setMediaMode("image")}>{t("autoVideo.import.image")}</ModeButton>
            <ModeButton active={mediaMode === "video"} onClick={() => setMediaMode("video")}>{t("autoVideo.import.video")}</ModeButton>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStage("import")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("autoVideo.editor.back")}
          </Button>
          <Button onClick={() => setStage("render")}>
            {t("autoVideo.editor.proceedRender")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-5xl mx-auto space-y-2">
          <div className="bg-card border border-border rounded-lg p-3 space-y-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-semibold">{t("autoVideo.editor.effects")}</span>
              <select className="bg-background border border-border rounded px-2 py-1" value={bulkEffect} onChange={(e) => handleBulkEffectChange(e.target.value as AutoVideoMediaEffect)}>
                {MEDIA_EFFECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
              <select className="bg-background border border-border rounded px-2 py-1" value={bulkEffectMode} onChange={(e) => handleBulkEffectModeChange(e.target.value as BulkApplyMode)}>
                <option value="all">{t("autoVideo.editor.applyAll")}</option>
                <option value="random">{t("autoVideo.editor.applyRandomCount")}</option>
              </select>
              {bulkEffectMode === "random" && (
                <>
                  <input className="w-16 bg-background border rounded px-2 py-1" type="number" min={0} value={randomEffectCount} onChange={(e) => setRandomEffectCount(Number(e.target.value) || 0)} />
                  <Button variant="outline" size="sm" onClick={handleRandomEffects}>{t("autoVideo.editor.applyRandom")}</Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={clearMediaEffects}>{t("autoVideo.editor.clearEffects")}</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-semibold">{t("autoVideo.editor.transitions")}</span>
              <select className="bg-background border border-border rounded px-2 py-1" value={bulkTransition} onChange={(e) => handleBulkTransitionChange(e.target.value as AutoVideoTransition)}>
                {TRANSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{transitionLabel(option, t)}</option>
                ))}
              </select>
              <select className="bg-background border border-border rounded px-2 py-1" value={bulkTransitionMode} onChange={(e) => handleBulkTransitionModeChange(e.target.value as BulkApplyMode)}>
                <option value="all">{t("autoVideo.editor.applyAll")}</option>
                <option value="random">{t("autoVideo.editor.applyRandomCount")}</option>
              </select>
              {bulkTransitionMode === "random" && (
                <>
                  <input className="w-16 bg-background border rounded px-2 py-1" type="number" min={0} value={randomTransitionCount} onChange={(e) => setRandomTransitionCount(Number(e.target.value) || 0)} />
                  <Button variant="outline" size="sm" onClick={handleRandomTransitions}>{t("autoVideo.editor.applyRandom")}</Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={clearTransitions}>{t("autoVideo.editor.clearTransitions")}</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-semibold">{t("autoVideo.editor.sfx")}</span>
              <input
                ref={sfxFolderInputRef}
                type="file"
                multiple
                accept={SFX_EXTS.map((e) => `.${e}`).join(",")}
                // @ts-expect-error - non-standard but supported in Chromium for folder picking
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => {
                  handleSfxFolderPick(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => sfxFolderInputRef.current?.click()}>
                <FolderOpen className="w-4 h-4 mr-1" />
                {t("autoVideo.editor.chooseSfxFolder")}
              </Button>
              <span className="text-muted-foreground">{t("autoVideo.editor.sfxLoaded", { count: sfxPaths.length })}</span>
              <input className="w-16 bg-background border rounded px-2 py-1" type="number" min={0} value={randomSfxCount} onChange={(e) => setRandomSfxCount(Number(e.target.value) || 0)} />
              <Button variant="outline" size="sm" onClick={handleRandomSfx}>{t("autoVideo.editor.applyRandom")}</Button>
              <Button variant="ghost" size="sm" onClick={clearAllSfx}>{t("autoVideo.editor.clearSfx")}</Button>
            </div>
          </div>
          {segments.map((seg) => (
            <SegmentRow key={seg.index} segment={seg} mediaMode={mediaMode} sfxPaths={sfxPaths} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function SegmentRow({ segment, mediaMode, sfxPaths }: { segment: MappedSegment; mediaMode: "image" | "video"; sfxPaths: string[] }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const setImage = useAutoVideoStore((s) => s.setImageForSegment);
  const setVideo = useAutoVideoStore((s) => s.setVideoForSegment);
  const clearImage = useAutoVideoStore((s) => s.clearImageForSegment);
  const clearVideo = useAutoVideoStore((s) => s.clearVideoForSegment);
  const setMediaEffect = useAutoVideoStore((s) => s.setMediaEffectForSegment);
  const setTransition = useAutoVideoStore((s) => s.setTransitionForSegment);
  const setSfx = useAutoVideoStore((s) => s.setSfxForSegment);
  const clearSfx = useAutoVideoStore((s) => s.clearSfxForSegment);

  const handleFilePick = useCallback((file: File) => {
    type ElectronFile = File & { path?: string };
    const path = (file as ElectronFile).path;
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFilePick(file);
  }, [handleFilePick]);

  const lowConf = segment.confidence != null && segment.confidence < 0.4;
  const duration = segment.endMs - segment.startMs;
  const usingVideo = mediaMode === "video" && !!segment.videoPath;
  const fallbackImage = mediaMode === "video" && !segment.videoPath && !!segment.imagePath;
  const mediaPath = usingVideo ? segment.videoPath : segment.imagePath;
  const sfxOptions = segment.sfxPath && !sfxPaths.includes(segment.sfxPath)
    ? [segment.sfxPath, ...sfxPaths]
    : sfxPaths;

  return (
    <div
      className={cn(
        "flex items-stretch gap-3 bg-card border rounded-lg overflow-hidden",
        lowConf ? "border-amber-500/50 bg-amber-500/5" : "border-border",
      )}
    >
      {/* Index + time */}
      <div className="w-20 shrink-0 bg-muted/30 flex flex-col items-center justify-center text-center py-2">
        <div className="text-xs text-muted-foreground font-medium">#{segment.index}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {formatTimestamp(segment.startMs)}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {formatDurationSec(duration)}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 py-3 min-w-0">
        <div className="text-sm leading-relaxed">{segment.text}</div>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <label>{t("autoVideo.editor.effect")}</label>
          <select className="bg-background border border-border rounded px-1 py-0.5" value={segment.mediaEffect ?? "none"} onChange={(e) => setMediaEffect(segment.index, e.target.value as AutoVideoMediaEffect)}>
            {MEDIA_EFFECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          <label>{t("autoVideo.editor.transitionNext")}</label>
          <select className="bg-background border border-border rounded px-1 py-0.5" value={segment.transitionToNext ?? "none"} onChange={(e) => setTransition(segment.index, e.target.value as AutoVideoTransition)}>
            {TRANSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{transitionLabel(option, t)}</option>
            ))}
          </select>
          <label>{t("autoVideo.editor.sfx")}</label>
          <select className="max-w-44 bg-background border border-border rounded px-1 py-0.5" value={segment.sfxPath || ""} onChange={(e) => setSfx(segment.index, e.target.value)}>
            <option value="">{t("autoVideo.editor.effectNone")}</option>
            {sfxOptions.map((path) => (
              <option key={path} value={path}>{fileNameFromPath(path)}</option>
            ))}
          </select>
          {segment.sfxPath && (
            <>
              <audio src={toMediaSrc(segment.sfxPath)} controls className="h-7 w-40" />
              <button className="text-primary hover:underline" onClick={() => clearSfx(segment.index)}>
                {t("autoVideo.editor.clearSfx")}
              </button>
            </>
          )}
        </div>
        {lowConf && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600">
            <AlertTriangle className="w-3 h-3" />
            {t("autoVideo.editor.lowConfidence")} ({segment.confidence?.toFixed(2)})
          </div>
        )}
      </div>

      {/* Image slot */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !mediaPath && inputRef.current?.click()}
        className={cn(
          "w-32 shrink-0 border-l border-border flex items-center justify-center bg-muted/20 group relative cursor-pointer",
          !mediaPath && "hover:bg-muted/40",
        )}
      >
        {mediaPath ? (
          <>
            {usingVideo ? (
              <video src={toMediaSrc(mediaPath)} muted className="w-full h-full object-cover" />
            ) : (
              <img
                src={toImageSrc(mediaPath)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            {fallbackImage && (
              <div className="absolute left-1 bottom-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                {t("autoVideo.import.fallbackImage")}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (usingVideo) clearVideo(segment.index);
                else clearImage(segment.index);
              }}
              className="absolute top-1 right-1 bg-background/80 hover:bg-background border border-border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] text-center px-2">
              {mediaMode === "video" ? t("autoVideo.editor.dropVideo") : t("autoVideo.editor.dropImage")}
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={(mediaMode === "video" ? VIDEO_EXTS : IMAGE_EXTS).map((e) => `.${e}`).join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFilePick(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
