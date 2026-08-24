"use client";

/**
 * Post-generation actions on a finished job: export a DaVinci timeline, or
 * re-stitch the final MP4 with different render-only settings.
 */

import { useCallback, useState } from "react";
import { FileUp, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover";
import { autopilotEngine, useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import { buildFcpxml, type FcpxmlClip } from "@/features/video-studio/lib/fcpxml-export";
import { getAbsoluteImagePath } from "@/features/video-studio/lib/image-storage";
import type { AutopilotJobListItem } from "@/features/video-studio/autopilot/types";
import type { RenderCodec } from "@/features/video-studio/lib/auto-video/types";
import { CODEC_OPTIONS } from "./panel-shared";

/**
 * Export a DaVinci Resolve / Final Cut timeline (.fcpxml) from the shot clips + narration.
 * References the separate clips (never a merged MP4), so you can edit/color/render in
 * DaVinci. Available once the shot videos exist — independent of ffmpeg stitching.
 */
export function ExportFcpxmlButton({ job }: { job: AutopilotJobListItem }) {
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      const media = job.mediaOutputs || [];
      // 1) Resolve each shot's clip path + any cached video duration.
      const pending: Array<{ index: number; src: string; startMs: number; endMs: number; name: string; isImage: boolean; cachedSec?: number }> = [];
      for (const shot of job.plannedShots || []) {
        const item = media.find((m) => m.index === shot.index);
        const rawPath = item?.videoPath || item?.imagePath || "";
        if (!rawPath) continue;
        const abs = await getAbsoluteImagePath(rawPath);
        if (!abs || abs.startsWith("http://") || abs.startsWith("https://") || abs.includes("://")) continue;
        const isImage = !item?.videoPath;
        pending.push({
          index: shot.index,
          src: abs,
          startMs: shot.startMs,
          endMs: shot.endMs,
          name: `Shot ${shot.index}`,
          isImage,
          cachedSec: isImage ? undefined : item?.videoDurationSec,
        });
      }
      if (pending.length === 0) {
        toast.error("Không có clip nào để xuất (chưa có video/ảnh).");
        return;
      }

      // 2) Probe only videos missing a cached duration, in parallel (bounded), then
      //    cache the results back onto the job so future exports skip probing entirely.
      const toProbe = pending.filter((p) => !p.isImage && !p.cachedSec);
      const probed = new Map<number, number>();
      if (toProbe.length > 0) {
        let cursor = 0;
        const worker = async () => {
          while (cursor < toProbe.length) {
            const current = toProbe[cursor++];
            const result = await window.ffmpegRuntime?.probeDuration(current.src);
            if (result?.durationSec) probed.set(current.index, result.durationSec);
          }
        };
        await Promise.all(Array.from({ length: Math.min(8, toProbe.length) }, worker));
        if (probed.size > 0) {
          autopilotEngine.cacheShotVideoDurations(
            job.id,
            [...probed].map(([index, durationSec]) => ({ index, durationSec })),
          );
        }
      }

      const clips: FcpxmlClip[] = pending.map((p) => ({
        src: p.src,
        startMs: p.startMs,
        endMs: p.endMs,
        name: p.name,
        isImage: p.isImage,
        mediaDurationSec: p.isImage ? undefined : (p.cachedSec || probed.get(p.index)),
      }));
      let audioSrc: string | undefined;
      if (job.audioPath) {
        const abs = await getAbsoluteImagePath(job.audioPath);
        if (abs && !abs.startsWith("http") && !abs.includes("://")) audioSrc = abs;
      }
      const [w, h] = (job.input?.resolution || "1920x1080").split("x").map(Number);
      const xml = buildFcpxml({
        title: job.title,
        width: w || 1920,
        height: h || 1080,
        fps: job.input?.fps || 30,
        clips,
        audioSrc,
        audioDurationMs: job.audioDurationMs,
      });
      const defaultName = (job.title.replace(/[^a-zA-Z0-9À-ɏ_-]+/g, "_") || "autopilot") + "_davinci";
      const result = await window.autoEditRuntime?.saveText({ content: xml, defaultName, extension: "fcpxml" });
      if (result?.success) toast.success(`Đã xuất FCPXML (${clips.length} clip) cho DaVinci`);
      else if (result && !result.canceled) toast.error(result.error || "Xuất FCPXML thất bại");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [job]);

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={handleExport} title="Xuất timeline .fcpxml để mở/chỉnh/render trong DaVinci Resolve (không tạo lại media)">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
      <span className="ml-1.5 hidden sm:inline">DaVinci</span>
    </Button>
  );
}

/**
 * Independent re-stitch control. Re-renders the final MP4 from the shots' existing
 * media with a small set of render-only settings (subtitles, BGM, resolution).
 * It never regenerates images/videos, so it works whether or not any shot changed
 * — including a plain re-export with no edits at all.
 */
export function RerenderControl({ job }: { job: AutopilotJobListItem }) {
  const rerenderJob = useAutopilotStore((s) => s.rerenderJob);
  const [open, setOpen] = useState(false);
  const [subtitles, setSubtitles] = useState(job.input?.subtitles === true);
  const [bgmPath, setBgmPath] = useState(job.input?.bgmPath || "");
  const [bgmVolume, setBgmVolume] = useState(job.input?.bgmVolume ?? 0.25);
  const [bgmDuckVoice, setBgmDuckVoice] = useState(job.input?.bgmDuckVoice ?? true);
  const [resolution, setResolution] = useState<string>(job.input?.resolution || "1920x1080");
  const [codec, setCodec] = useState<RenderCodec>(job.input?.codec || "libx264");
  const [fps, setFps] = useState<24 | 30 | 60>(job.input?.fps ?? 30);
  const [audioNormalize, setAudioNormalize] = useState(job.input?.audioNormalize === true);
  const [videoAudioVolume, setVideoAudioVolume] = useState(job.input?.videoAudioVolume ?? 0);

  const handleRerender = () => {
    const ok = rerenderJob(job.id, {
      subtitles,
      bgmPath: bgmPath.trim() || undefined,
      bgmVolume,
      bgmDuckVoice,
      resolution: resolution as "1280x720" | "1920x1080" | "3840x2160",
      codec,
      fps,
      audioNormalize,
      videoAudioVolume,
    });
    if (ok) {
      toast.success("Đang ghép lại video...");
      setOpen(false);
    } else {
      toast.error("Chưa thể ghép lại (job đang chạy hoặc chưa đủ media).");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Ghép lại video (không tạo lại media)">
          <Film className="w-3.5 h-3.5" />
          <span className="ml-1.5 hidden sm:inline">Ghép lại</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="text-xs font-semibold">Ghép lại video</div>
        <p className="text-2xs text-muted-foreground">Chỉ trộn lại bản cuối từ media đã có — không tạo lại ảnh/video, không tốn credit.</p>

        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Phụ đề</Label>
          <Switch checked={subtitles} onCheckedChange={setSubtitles} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Nhạc nền (BGM)</Label>
          <Input value={bgmPath} onChange={(e) => setBgmPath(e.target.value)} placeholder="Đường dẫn file nhạc (tuỳ chọn)" className="text-xs" />
          <div className="flex items-center gap-2">
            <Label className="w-16 text-2xs text-muted-foreground">Âm lượng</Label>
            <input type="range" min={0} max={1} step={0.05} value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))} className="flex-1" />
            <span className="w-8 text-right text-2xs tabular-nums">{Math.round(bgmVolume * 100)}%</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-2xs text-muted-foreground">Giảm nhạc khi có giọng</Label>
            <Switch checked={bgmDuckVoice} onCheckedChange={setBgmDuckVoice} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Độ phân giải</Label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs">
              <option value="1280x720">1280×720</option>
              <option value="1920x1080">1920×1080</option>
              <option value="3840x2160">3840×2160</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">FPS</Label>
            <select value={fps} onChange={(e) => setFps(Number(e.target.value) as 24 | 30 | 60)} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs">
              {[24, 30, 60].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Encoder</Label>
          <select value={codec} onChange={(e) => setCodec(e.target.value as RenderCodec)} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs">
            {CODEC_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Chuẩn hóa âm thanh (-14 LUFS)</Label>
          <Switch checked={audioNormalize} onCheckedChange={setAudioNormalize} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Âm lượng video gốc</Label>
            <span className="text-2xs tabular-nums text-muted-foreground">{videoAudioVolume === 0 ? "Tắt" : `${Math.round(videoAudioVolume * 100)}%`}</span>
          </div>
          <input type="range" min={0} max={0.5} step={0.05} value={videoAudioVolume} onChange={(e) => setVideoAudioVolume(Number(e.target.value))} className="w-full accent-primary" />
        </div>

        <Button size="sm" className="w-full" onClick={handleRerender}>
          <Film className="mr-1.5 h-3.5 w-3.5" />Ghép lại
        </Button>
      </PopoverContent>
    </Popover>
  );
}
