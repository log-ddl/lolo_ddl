import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports } from "./lucide-react-DHCwBhKI.js";
import { a as useI18n, B as Button, t as toast } from "./index-ld1jMZXM.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import { a as useProjectStore, s as splitVideoPromptVoiceOver, c as cleanVoiceOverText } from "./auto-video-store-Cd8fXBc8.js";
import { j as useScriptStore, n as normalizeVideoLength, p as normalizeRefImageIndexes } from "./autopilot-store-i3rmgegs.js";
import { u as useMediaPanelStore } from "./entry-CEuYoVRr.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./model-registry-C5c6bagc.js";
import "./dropdown-menu-D7DihKO-.js";
import "./progress-CoGwezcY.js";
import "./popover-CuPNgqie.js";
import "./FeatureHeaderIcon-DurhyC1w.js";
import "./resizable-ZbW8XN3y.js";
const isPromptImportBeta = false;
function extractSceneName(...prompts) {
  for (const prompt of prompts) {
    const match = prompt.match(/@scene\[([^\]]+)\]/iu);
    const sceneName = match?.[1]?.trim();
    if (sceneName) return sceneName;
  }
  return void 0;
}
function parseCsvLine(line) {
  const cells = [];
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
function parsePromptCsv(text) {
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
      ref_image
    };
  }).filter((row) => row.imagePrompt || row.videoPrompt || row.voiceOver);
}
function extractCharacterNames(...prompts) {
  const names = /* @__PURE__ */ new Set();
  for (const prompt of prompts) {
    for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
      const name = (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
      if (name) names.add(name);
    }
  }
  return Array.from(names);
}
function PromptImportView() {
  const { t } = useI18n();
  const { activeProjectId, activeProject } = useProjectStore();
  const defaultCsvText = 'episodeIndex,shotIndex,sceneName,ref_image,imagePrompt,videoPrompt,voiceOver,videoLength\n1,1,office_startup,,"@scene[office_startup], @Linh stands beside a laptop while @Minh watches the screen","Camera slowly pushes in as @Linh points at the screen","Linh explains the plan.",6';
  const [csvText, setCsvText] = reactExports.useState("");
  const [loadedProjectId, setLoadedProjectId] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  const rows = reactExports.useMemo(() => parsePromptCsv(csvText), [csvText]);
  const scriptStore = useScriptStore();
  const { goToDirectorWithData } = useMediaPanelStore();
  reactExports.useEffect(() => {
    if (!activeProjectId) return;
    const saved = window.localStorage.getItem(`prompt-import-csv:${activeProjectId}`);
    setCsvText(saved || defaultCsvText);
    setLoadedProjectId(activeProjectId);
  }, [activeProjectId]);
  reactExports.useEffect(() => {
    if (!activeProjectId) return;
    if (loadedProjectId !== activeProjectId) return;
    window.localStorage.setItem(`prompt-import-csv:${activeProjectId}`, csvText);
  }, [activeProjectId, csvText, loadedProjectId]);
  const handleImportFiles = async (files) => {
    if (!files?.length) return;
    const texts = await Promise.all(Array.from(files).map((file) => file.text()));
    if (texts.length === 1) {
      setCsvText(texts[0]);
      toast.success(`Đã nhập file ${files[0].name}.`);
      return;
    }
    const mergedLines = [];
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
    const projectId = activeProjectId;
    if (!projectId) return;
    if (rows.length === 0) {
      toast.error("Không có dòng prompt hợp lệ để đồng bộ.");
      return;
    }
    scriptStore.ensureProject(projectId);
    const episodeIndexes = Array.from(new Set(rows.map((row) => row.episodeIndex || 1))).sort((a, b) => a - b);
    const sceneNames = Array.from(new Set(
      rows.filter((row) => row.sceneName?.trim()).map((row) => `${row.episodeIndex || 1}:${row.sceneName.trim()}`)
    ));
    const scenes = sceneNames.map((name, index) => ({
      id: `scene_${index + 1}`,
      name: name.split(":").slice(1).join(":") || "Prompt Import",
      time: "day",
      atmosphere: "",
      scenePrompt: void 0
    }));
    const sceneIdByName = new Map(sceneNames.map((name, index) => [name, scenes[index].id]));
    const characterNames = Array.from(new Set(rows.flatMap((row) => extractCharacterNames(row.imagePrompt, row.videoPrompt))));
    const characters = characterNames.map((name, index) => ({ id: `char_${index + 1}`, name }));
    const shots = rows.map((row, index) => {
      const names = extractCharacterNames(row.imagePrompt, row.videoPrompt);
      return {
        id: `shot-${index + 1}`,
        index: row.shotIndex || index + 1,
        episodeId: `ep_${row.episodeIndex || 1}`,
        sceneRefId: row.sceneName?.trim() ? sceneIdByName.get(`${row.episodeIndex || 1}:${row.sceneName.trim()}`) || "" : "",
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
        videoProgress: 0
      };
    });
    const scriptData = {
      title: activeProject?.name || "",
      language: "mixed",
      characters,
      scenes,
      episodes: episodeIndexes.map((episodeIndex) => ({
        id: `ep_${episodeIndex}`,
        index: episodeIndex,
        title: t("overview.episode", { index: episodeIndex }),
        sceneIds: sceneNames.map((name, index) => ({ name, sceneId: scenes[index].id })).filter((item) => item.name.startsWith(`${episodeIndex}:`)).map((item) => item.sceneId)
      })),
      storyParagraphs: []
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
          characterNames: extractCharacterNames(row.imagePrompt, row.videoPrompt)
        }))
      });
      toast.success(t("promptImport.syncedDirector", { count: rows.length }));
      return;
    }
    toast.success(t("promptImport.syncedScript", { count: rows.length }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden p-4 gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: t("promptImport.title") }),
        isPromptImportBeta
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("promptImport.description") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: ".csv,.txt,text/csv,text/plain", multiple: true, className: "hidden", disabled: isPromptImportBeta, onChange: (event) => handleImportFiles(event.target.files) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: csvText, onChange: (event) => setCsvText(event.target.value), disabled: isPromptImportBeta, className: "min-h-[180px] font-mono text-xs" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("promptImport.previewValid", { count: rows.length }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => fileInputRef.current?.click(), disabled: isPromptImportBeta, children: t("promptImport.importFile") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => handleSync(false), disabled: rows.length === 0, children: t("promptImport.syncScript") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleSync(true), disabled: rows.length === 0, children: t("promptImport.openDirector") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[1180px] text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.shot") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.episode") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.scene") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.refImage") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.characters") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.imagePrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.videoPrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.voiceOver") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-left", children: t("promptImport.videoLength") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t align-top", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: row.shotIndex }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: row.episodeIndex || 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: row.sceneName || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: row.ref_image?.length ? row.ref_image.join(", ") : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: extractCharacterNames(row.imagePrompt, row.videoPrompt).join(", ") || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 max-w-[360px]", children: row.imagePrompt }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 max-w-[360px]", children: row.videoPrompt }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 max-w-[260px]", children: row.voiceOver || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2", children: [
          row.videoLength,
          "s"
        ] })
      ] }, `${row.episodeIndex}-${row.shotIndex}-${index}`)) })
    ] }) })
  ] });
}
export {
  PromptImportView
};
