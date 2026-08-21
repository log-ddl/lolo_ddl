"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import type { ScriptData, Shot } from "@/features/video-studio/types/script";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import { cleanVoiceOverText, splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { useI18n } from "@/shared/i18n";
import { toast } from "sonner";

type PromptRow = {
  episodeIndex: number;
  shotIndex: number;
  sceneName?: string;
  sceneKey?: string;
  imagePrompt: string;
  videoPrompt: string;
  voiceOver?: string;
  videoLength: 4 | 6 | 8;
  ref_image?: number[];
};
// Config Beta  TAB Import Prompt
const isPromptImportBeta = false;

function extractSceneName(...prompts: string[]): string | undefined {
  for (const prompt of prompts) {
    const match = prompt.match(/@scene\[([^\]]+)\]/iu);
    const sceneName = match?.[1]?.trim();
    if (sceneName) return sceneName;
  }
  return undefined;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parsePromptCsv(text: string): PromptRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const data = Object.fromEntries(headers.map((header, i) => [header, cells[i] || ""]));
    const imagePrompt = data.imagePrompt || "";
    const parts = splitVideoPromptVoiceOver(data.videoPrompt || "");
    const videoPrompt = parts.videoPrompt;
    const voiceOver = cleanVoiceOverText(data.voiceOver) || parts.voiceOver;
    const videoLength = normalizeVideoLength(data.videoLength || data.length);
    const ref_image = normalizeRefImageIndexes(data.ref_image || data.refImage || data.refImages);
    const sceneName = data.sceneName || data.sceneKey || extractSceneName(imagePrompt, videoPrompt);
    return {
      episodeIndex: Number(data.episodeIndex || data.episode || 1),
      shotIndex: Number(data.shotIndex || data.index || index + 1),
      sceneName,
      sceneKey: data.sceneKey || data.sceneName || sceneName,
      imagePrompt,
      videoPrompt,
      voiceOver,
      videoLength,
      ref_image,
    };
  }).filter((row) => row.imagePrompt || row.videoPrompt || row.voiceOver);
}

function extractCharacterNames(...prompts: string[]): string[] {
  const names = new Set<string>();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
      const name = (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}

export function PromptImportView() {
  const { t } = useI18n();
  const { activeProjectId, activeProject } = useProjectStore();
  const defaultCsvText = "episodeIndex,shotIndex,sceneName,ref_image,imagePrompt,videoPrompt,voiceOver,videoLength\n1,1,office_startup,,\"@scene[office_startup], @Linh stands beside a laptop while @Minh watches the screen\",\"Camera slowly pushes in as @Linh points at the screen\",\"Linh explains the plan.\",6";
  const [csvText, setCsvText] = useState("");
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => parsePromptCsv(csvText), [csvText]);
  const scriptStore = useScriptStore();
  const { goToDirectorWithData } = useMediaPanelStore();

  useEffect(() => {
    if (!activeProjectId) return;
    const saved = window.localStorage.getItem(`prompt-import-csv:${activeProjectId}`);
    setCsvText(saved || defaultCsvText);
    setLoadedProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    if (loadedProjectId !== activeProjectId) return;
    window.localStorage.setItem(`prompt-import-csv:${activeProjectId}`, csvText);
  }, [activeProjectId, csvText, loadedProjectId]);

  const handleImportFiles = async (files: FileList | null) => {
    if (isPromptImportBeta) return;
    if (!files?.length) return;
    const texts = await Promise.all(Array.from(files).map((file) => file.text()));
    if (texts.length === 1) {
      setCsvText(texts[0]);
      toast.success(`Đã nhập file ${files[0].name}.`);
      return;
    }

    const mergedLines: string[] = [];
    texts.forEach((text, fileIndex) => {
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) return;
      const headers = parseCsvLine(lines[0]);
      if (mergedLines.length === 0) mergedLines.push(["episodeIndex", ...headers].join(","));
      lines.slice(1).forEach((line) => mergedLines.push(`${fileIndex + 1},${line}`));
    });
    setCsvText(mergedLines.join("\n"));
    toast.success(`Đã nhập ${texts.length} file, mỗi file là một tập.`);
  };

  const handleSync = (openDirector = false) => {
    if (isPromptImportBeta) return;
    const projectId = activeProjectId;
    if (!projectId) return;
    if (rows.length === 0) {
      toast.error("Không có dòng prompt hợp lệ để đồng bộ.");
      return;
    }

    scriptStore.ensureProject(projectId);

    const episodeIndexes = Array.from(new Set(rows.map((row) => row.episodeIndex || 1))).sort((a, b) => a - b);
    const sceneNames = Array.from(new Set(rows
      .filter((row) => row.sceneName?.trim())
      .map((row) => `${row.episodeIndex || 1}:${row.sceneName!.trim()}`)
    ));
    const scenes = sceneNames.map((name, index) => ({
      id: `scene_${index + 1}`,
      name: name.split(":").slice(1).join(":") || "Prompt Import",
      time: "day",
      atmosphere: "",
      scenePrompt: undefined,
    }));
    const sceneIdByName = new Map(sceneNames.map((name, index) => [name, scenes[index].id]));

    const characterNames = Array.from(new Set(rows.flatMap((row) => extractCharacterNames(row.imagePrompt, row.videoPrompt))));
    const characters = characterNames.map((name, index) => ({ id: `char_${index + 1}`, name }));
    const shots: Shot[] = rows.map((row, index) => {
      const names = extractCharacterNames(row.imagePrompt, row.videoPrompt);
      return {
        id: `shot-${index + 1}`,
        index: row.shotIndex || index + 1,
        episodeId: `ep_${row.episodeIndex || 1}`,
        sceneRefId: row.sceneName?.trim()
          ? sceneIdByName.get(`${row.episodeIndex || 1}:${row.sceneName.trim()}`) || ''
          : '',
        imagePrompt: row.imagePrompt,
        videoPrompt: row.videoPrompt,
        voiceOver: row.voiceOver,
        videoLength: row.videoLength,
        ref_image: row.ref_image,
        hasCharacters: names.length > 0,
        keyframes: row.imagePrompt ? [{ id: `kf-${index + 1}-start`, type: "start", imagePrompt: row.imagePrompt, imageUrl: "", status: "idle" }] : [],
        imageStatus: "idle",
        imageProgress: 0,
        videoStatus: "idle",
        videoProgress: 0,
      };
    });

    const scriptData: ScriptData = {
      title: activeProject?.name || "",
      language: "mixed",
      characters,
      scenes,
      episodes: episodeIndexes.map((episodeIndex) => ({
        id: `ep_${episodeIndex}`,
        index: episodeIndex,
        title: t("overview.episode", { index: episodeIndex }),
        sceneIds: sceneNames
          .map((name, index) => ({ name, sceneId: scenes[index].id }))
          .filter((item) => item.name.startsWith(`${episodeIndex}:`))
          .map((item) => item.sceneId),
      })),
      storyParagraphs: [],
    };
    scriptStore.setScriptData(projectId, scriptData);
    scriptStore.setShots(projectId, shots);
    scriptStore.setParseStatus(projectId, "ready");
    scriptStore.setShotStatus(projectId, "ready");
    scriptStore.setEpisodeRawScripts(projectId, episodeIndexes.map((episodeIndex) => ({ episodeIndex, title: t("overview.episode", { index: episodeIndex }), rawContent: csvText, scenes: [], shotGenerationStatus: "completed" })));

    if (openDirector) {
      goToDirectorWithData({
        storyPrompt: rows.map((row, index) => {
          const parts = [`[Shot ${row.shotIndex || index + 1}]`];
          if (row.sceneName) parts.push(`Scene: ${row.sceneName}`);
          if (row.ref_image?.length) parts.push(`Ref image: ${row.ref_image.join(", ")}`);
          if (row.imagePrompt) parts.push(`Image: ${row.imagePrompt}`);
          if (row.videoPrompt) parts.push(`Video: ${row.videoPrompt}`);
          if (row.voiceOver) parts.push(`Voice: ${row.voiceOver}`);
          parts.push(`Length: ${row.videoLength}s`);
          return parts.join(" ");
        }).join("\n"),
        sceneCount: rows.length,
        sourceType: "episode",
        prebuiltScenes: rows.map((row, index) => ({
          imagePrompt: row.imagePrompt,
          videoPrompt: row.videoPrompt,
          voiceOver: row.voiceOver,
          videoLength: row.videoLength,
          ref_image: row.ref_image,
          sourceShotId: `shot-${index + 1}`,
          sourceShotIndex: row.shotIndex || index + 1,
          sceneName: row.sceneName || "",
          sceneLocation: row.sceneName || "",
          characterNames: extractCharacterNames(row.imagePrompt, row.videoPrompt),
        })),
      });
      toast.success(t("promptImport.syncedDirector", { count: rows.length }));
      return;
    }

    toast.success(t("promptImport.syncedScript", { count: rows.length }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-4 gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("promptImport.title")}</h2>
          {isPromptImportBeta && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Beta
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("promptImport.description")}</p>
        {/* {isPromptImportBeta && (
          <p className="mt-2 text-sm text-amber-700">
            Tính năng này đang trong giai đoạn Beta. Người dùng hiện chỉ có thể xem, chưa thể nhập file hoặc đồng bộ prompt.
          </p>
        )} */}
      </div>
      <input ref={fileInputRef} type="file" accept=".csv,.txt,text/csv,text/plain" multiple className="hidden" disabled={isPromptImportBeta} onChange={(event) => handleImportFiles(event.target.files)} />
      <Textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} disabled={isPromptImportBeta} className="min-h-[180px] font-mono text-xs" />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("promptImport.previewValid", { count: rows.length })}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPromptImportBeta}>{t("promptImport.importFile")}</Button>
          <Button variant="outline" onClick={() => handleSync(false)} disabled={isPromptImportBeta || rows.length === 0}>{t("promptImport.syncScript")}</Button>
          <Button onClick={() => handleSync(true)} disabled={isPromptImportBeta || rows.length === 0}>{t("promptImport.openDirector")}</Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-md border">
        <table className="w-full min-w-[1180px] text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="p-2 text-left">{t("promptImport.shot")}</th>
              <th className="p-2 text-left">{t("promptImport.episode")}</th>
              <th className="p-2 text-left">{t("promptImport.scene")}</th>
              <th className="p-2 text-left">{t("promptImport.refImage")}</th>
              <th className="p-2 text-left">{t("promptImport.characters")}</th>
              <th className="p-2 text-left">{t("promptImport.imagePrompt")}</th>
              <th className="p-2 text-left">{t("promptImport.videoPrompt")}</th>
              <th className="p-2 text-left">{t("promptImport.voiceOver")}</th>
              <th className="p-2 text-left">{t("promptImport.videoLength")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.episodeIndex}-${row.shotIndex}-${index}`} className="border-t align-top">
                <td className="p-2">{row.shotIndex}</td>
                <td className="p-2">{row.episodeIndex || 1}</td>
                <td className="p-2">{row.sceneName || "-"}</td>
                <td className="p-2">{row.ref_image?.length ? row.ref_image.join(", ") : "-"}</td>
                <td className="p-2">{extractCharacterNames(row.imagePrompt, row.videoPrompt).join(", ") || "-"}</td>
                <td className="p-2 max-w-[360px]">{row.imagePrompt}</td>
                <td className="p-2 max-w-[360px]">{row.videoPrompt}</td>
                <td className="p-2 max-w-[260px]">{row.voiceOver || "-"}</td>
                <td className="p-2">{row.videoLength}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
