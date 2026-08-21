"use client";

/**
 * Getting shots out of the Script panel: a prompt CSV download, and seeding the
 * Auto Video tab with each shot's voice-over plus whatever image/video the
 * Director has already produced for it.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import { useActiveDirectorProject } from "@/features/video-studio/stores/director-store";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import type { ScriptData, Shot } from "@/features/video-studio/types/script";

export interface ScriptExportDeps {
  shots: Shot[];
  scriptData: ScriptData | null | undefined;
  setActiveTab: (tab: any) => void;
  appendProcessLog: (message: string) => void;
  getShotPromptVoiceFields: (shot: { videoPrompt?: string; voiceOver?: string }) => { videoPrompt?: string; voiceOver?: string };
}

export function useScriptExport({
  shots,
  scriptData,
  setActiveTab,
  appendProcessLog,
  getShotPromptVoiceFields,
}: ScriptExportDeps) {
  const seedAutoVideoFromShots = useAutoVideoStore((s) => s.seedFromShots);
  const directorProject = useActiveDirectorProject();
  const directorSplitScenes = directorProject?.splitScenes ?? [];

  const handleExportPromptCsv = useCallback(() => {
    if (shots.length === 0) {
      toast.error("Không có shot để export CSV.");
      return;
    }

    const escapeCsvCell = (value: unknown): string => {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const episodeIndexById = new Map((scriptData?.episodes || []).map((episode) => [episode.id, episode.index]));
    const sceneById = new Map((scriptData?.scenes || []).map((scene) => [scene.id, scene]));
    const rows = shots.map((shot, index) => {
      const scene = shot.sceneRefId ? sceneById.get(shot.sceneRefId) : undefined;
      const voiceFields = getShotPromptVoiceFields(shot);
      return [
        episodeIndexById.get(shot.episodeId || "") || 1,
        shot.index || index + 1,
        scene?.name || "",
        normalizeRefImageIndexes(shot.ref_image).join(","),
        shot.imagePrompt || "",
        voiceFields.videoPrompt,
        voiceFields.voiceOver,
        normalizeVideoLength(shot.videoLength),
      ].map(escapeCsvCell).join(",");
    });

    const csv = ["episodeIndex,shotIndex,sceneName,ref_image,imagePrompt,videoPrompt,voiceOver,videoLength", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${scriptData?.title || "script-prompts"}.csv`.replace(/[\\/:*?"<>|]+/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã export ${shots.length} shot ra CSV.`);
  }, [shots, scriptData]);

  const handleSendToAutoVideo = useCallback(() => {
    if (shots.length === 0) return;
    // Image source priority for each shot:
    //   1. Director split-scene start-frame (imageDataUrl) — local-image:// URL
    //   2. Legacy shot.imageUrl (rare; only for old projects)
    // We pass URLs/paths through unchanged so the renderer can display them
    // (local-image:// has a registered protocol). Main process resolves to a
    // real filesystem path before invoking ffmpeg.
    const splitImageById = new Map<number, string>();
    const splitVideoById = new Map<number, string>();
    for (const sc of directorSplitScenes) {
      if (sc.imageDataUrl) splitImageById.set(sc.id, sc.imageDataUrl);
      if (sc.videoUrl) splitVideoById.set(sc.id, sc.videoUrl);
    }

    const resolvedShots = shots.map((s, posIdx) => {
      const voiceFields = getShotPromptVoiceFields(s);
      // Map shot.index 1 → splitScene id 0; fallback to positional index.
      const directorSrc =
        splitImageById.get(s.index - 1) ??
        (directorSplitScenes[posIdx]?.imageDataUrl ?? '');
      const directorVideoSrc =
        splitVideoById.get(s.index - 1) ??
        (directorSplitScenes[posIdx]?.videoUrl ?? '');
      const src = directorSrc || s.imageUrl || '';
      // Skip data: / blob: which can't be reused after page reload.
      const imagePath = src.startsWith('data:') || src.startsWith('blob:') ? '' : src;
      const videoPath = directorVideoSrc.startsWith('data:') || directorVideoSrc.startsWith('blob:') ? '' : directorVideoSrc;
      return { index: s.index, voiceOver: voiceFields.voiceOver, videoPrompt: voiceFields.videoPrompt, imagePath, videoPath };
    });
    const result = seedAutoVideoFromShots(resolvedShots);
    appendProcessLog(`Gửi Auto Video: ${result.matched} câu, ${result.skipped} shot bỏ qua`);
    setActiveTab("autoVideo");
    const linked = resolvedShots.filter((s) => s.imagePath).length;
    if (result.matched === 0) {
      toast.error("Không tìm thấy voiceOver nào để gửi sang Auto Video");
    } else {
      const parts = [`Đã gửi ${result.matched} câu sang Auto Video`];
      if (linked > 0) parts.push(`(${linked} ảnh đã link)`);
      const linkedVideos = resolvedShots.filter((s) => s.videoPath).length;
      if (linkedVideos > 0) parts.push(`(${linkedVideos} video đã link)`);
      if (result.skipped > 0) parts.push(`— bỏ qua ${result.skipped} shot không có voice`);
      toast.success(parts.join(' '));
    }
  }, [shots, directorSplitScenes, seedAutoVideoFromShots, setActiveTab, appendProcessLog]);


  return { handleExportPromptCsv, handleSendToAutoVideo };
}
