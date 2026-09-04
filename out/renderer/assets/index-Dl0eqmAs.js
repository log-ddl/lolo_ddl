import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, F as Film, z as Users, B as MapPin, H as Rocket, bB as Library, b9 as Image, E as Eye, _ as Play, bC as CircleCheckBig, bD as ChartColumn, L as LoaderCircle, a7 as FolderOpen, D as Download } from "./lucide-react-DHCwBhKI.js";
import { B as readImageAsBase64, u as useActiveScriptProject, e as useActiveDirectorProject, h as useCharacterLibraryStore, f as useSceneStore, a5 as useAutopilotStore, k as useMediaStore } from "./autopilot-store-5JX3PjC8.js";
import { a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
import { a as useI18n, b as useVideoStudioSettingsStore, t as toast, B as Button, c as cn } from "./index-DI8hnspe.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import { C as Checkbox } from "./entry--3YkNZ1p.js";
import { P as Progress } from "./progress-CiMxjjHG.js";
import { L as LocalImage } from "./local-image-COcd7dBC.js";
import { I as ImagePreviewModal, V as VideoPreviewModal } from "./media-preview-modal-BF74hBBT.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./model-registry-B3C-u_uk.js";
import "./popover-CDkCw224.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
import "./resizable-DC6gTyzy.js";
const EXPORT_ASSET_TIMEOUT_MS = 3e4;
function withTimeout(promise, message, timeoutMs = EXPORT_ASSET_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}
async function downloadFile(url) {
  if (!url) throw new Error("Empty URL");
  if (url.startsWith("local-image://")) {
    const base642 = await withTimeout(
      readImageAsBase64(url),
      `Timed out reading local file: ${url}`
    );
    if (!base642) throw new Error(`Failed to read local file: ${url}`);
    const resp = await fetch(base642);
    return resp.blob();
  }
  if (url.startsWith("data:")) {
    const resp = await fetch(url);
    return resp.blob();
  }
  if (/^https?:\/\//i.test(url)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_ASSET_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Timed out downloading: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }
    return withTimeout(response.blob(), `Timed out reading download: ${url}`);
  }
  const base64 = await withTimeout(
    readImageAsBase64(url),
    `Timed out reading local file: ${url}`
  );
  if (!base64) throw new Error(`Failed to read local file: ${url}`);
  const localResp = await fetch(base64);
  return localResp.blob();
}
function getShotImageUrl(shot) {
  return shot.imageUrl || shot.keyframes?.find((keyframe) => keyframe.type === "start")?.imageUrl;
}
function sanitizeImageAssetName(name, fallback) {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}
function getImageExtension(blob) {
  const mime = blob.type.toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("avif")) return ".avif";
  return ".png";
}
function getMediaExtension(asset, blob) {
  if (asset.type === "image") return getImageExtension(blob);
  const mime = blob.type.toLowerCase();
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("quicktime")) return ".mov";
  if (mime.includes("x-matroska")) return ".mkv";
  const urlExtension = asset.url.match(/\.(mp4|webm|mov|mkv)(?:[?#].*)?$/i)?.[1];
  return urlExtension ? `.${urlExtension.toLowerCase()}` : ".mp4";
}
function getImageSourceFolder(source) {
  if (source === "character") return "characters";
  if (source === "scene") return "scenes";
  if (source === "autopilot") return "autopilot";
  if (source === "media") return "media-library";
  return "director";
}
function createUniqueMediaFilename(asset, blob, counts) {
  const baseName = sanitizeImageAssetName(asset.name, asset.id);
  const key = `${asset.source}:${asset.type}:${baseName.toLocaleLowerCase()}`;
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  const suffix = count > 1 ? `_${count}` : "";
  return `${baseName}${suffix}${getMediaExtension(asset, blob)}`;
}
function getMediaAssetFolder(asset) {
  const sourceFolder = getImageSourceFolder(asset.source);
  return asset.type === "video" ? `${sourceFolder}/videos` : sourceFolder;
}
async function writeFilesToElectronFolder(baseDir, files) {
  if (!window.exportStorage?.writeFiles) {
    throw new Error("Electron export storage is not available");
  }
  const payloadFiles = await Promise.all(files.map(async (file) => {
    if (typeof file.text === "string") {
      return { relativePath: file.relativePath, text: file.text };
    }
    if (!file.blob) throw new Error(`Missing export data for ${file.relativePath}`);
    return { relativePath: file.relativePath, data: await file.blob.arrayBuffer() };
  }));
  const result = await window.exportStorage.writeFiles({ baseDir, files: payloadFiles });
  if (!result.success) {
    throw new Error(result.error || "Failed to write export files");
  }
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
async function exportSelectedMediaToFolder(projectName, assets, onProgress) {
  const selectedDir = window.storageManager?.selectDirectory ? await window.storageManager.selectDirectory() : null;
  if (!selectedDir) return false;
  if (!window.exportStorage?.writeFiles) {
    throw new Error("Native folder export is not available");
  }
  const files = [];
  const filenameCounts = /* @__PURE__ */ new Map();
  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    onProgress?.({
      current: index,
      total: assets.length,
      message: `Preparing ${asset.name}`
    });
    const blob = await downloadFile(asset.url);
    const filename = createUniqueMediaFilename(asset, blob, filenameCounts);
    files.push({
      relativePath: `${projectName}/${getMediaAssetFolder(asset)}/${filename}`,
      blob
    });
  }
  await writeFilesToElectronFolder(selectedDir, files);
  onProgress?.({ current: assets.length, total: assets.length, message: "Export complete" });
  return true;
}
async function downloadSelectedMedia(assets, onProgress) {
  const filenameCounts = /* @__PURE__ */ new Map();
  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    onProgress?.({
      current: index,
      total: assets.length,
      message: `Downloading ${asset.name}`
    });
    const blob = await downloadFile(asset.url);
    const filename = createUniqueMediaFilename(asset, blob, filenameCounts);
    triggerDownload(blob, filename);
    if (index < assets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  onProgress?.({ current: assets.length, total: assets.length, message: "Export complete" });
}
function getExportStats(shots) {
  const imagesReady = shots.filter((s) => s.imageStatus === "completed" && getShotImageUrl(s)).length;
  const videosReady = shots.filter((s) => s.videoStatus === "completed" && s.videoUrl).length;
  return {
    totalShots: shots.length,
    imagesReady,
    videosReady,
    canExport: imagesReady > 0 || videosReady > 0
  };
}
function getDirectorExportStats(scenes) {
  const imagesReady = scenes.filter(
    (s) => s.imageStatus === "completed" && (s.imageDataUrl || s.imageHttpUrl)
  ).length;
  const videosReady = scenes.filter(
    (s) => s.videoStatus === "completed" && !!s.videoUrl
  ).length;
  return {
    totalScenes: scenes.length,
    imagesReady,
    videosReady,
    canExport: imagesReady > 0 || videosReady > 0
  };
}
function hasExportableMedia(candidate) {
  return !!(candidate.url || candidate.videoUrl);
}
function ExportView() {
  const { t } = useI18n();
  const { activeProject } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const directorProject = useActiveDirectorProject();
  const characters = useCharacterLibraryStore((state) => state.characters);
  const scenes = useSceneStore((state) => state.scenes);
  const resourceSharing = useVideoStudioSettingsStore((state) => state.resourceSharing);
  const autopilotJobs = useAutopilotStore((state) => state.jobs);
  const mediaFiles = useMediaStore((state) => state.mediaFiles);
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const [exportProgress, setExportProgress] = reactExports.useState(null);
  const [enabledSources, setEnabledSources] = reactExports.useState({
    director: true,
    character: false,
    scene: false,
    autopilot: true,
    media: false
  });
  const [selectedAssetIds, setSelectedAssetIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [preview, setPreview] = reactExports.useState(null);
  const initializedSelectionRef = reactExports.useRef(false);
  const shots = scriptProject?.shots || [];
  const splitScenes = directorProject?.splitScenes || [];
  const scriptData = scriptProject?.scriptData;
  const targetDuration = scriptProject?.targetDuration || "60s";
  const projectName = (scriptData?.title || activeProject?.name || t("export.untitledProject")).replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_");
  const hasSplitScenes = splitScenes.length > 0;
  const imageCandidates = reactExports.useMemo(() => {
    const directorCandidates = hasSplitScenes ? splitScenes.map((scene, index) => ({
      id: `director:${scene.id}`,
      source: "director",
      name: `shot_${String(index + 1).padStart(3, "0")}_${scene.sceneName || `scene_${index + 1}`}`,
      url: scene.imageDataUrl || scene.imageHttpUrl || void 0,
      videoUrl: scene.videoUrl || void 0
    })) : shots.map((shot, index) => {
      const scriptScene = scriptData?.scenes.find((scene) => scene.id === shot.sceneRefId);
      const sceneName = scriptScene?.name || "shot";
      return {
        id: `director:${shot.id}`,
        source: "director",
        name: `shot_${String(index + 1).padStart(3, "0")}_${sceneName}`,
        url: shot.imageUrl || shot.keyframes?.find((keyframe) => keyframe.type === "start")?.imageUrl,
        videoUrl: shot.videoUrl
      };
    });
    const visibleCharacters = resourceSharing.shareCharacters ? characters : characters.filter((character) => character.projectId === activeProject?.id);
    const characterCandidates = visibleCharacters.map((character) => ({
      id: `character:${character.id}`,
      source: "character",
      name: character.name,
      url: character.thumbnailUrl
    }));
    const visibleScenes = resourceSharing.shareScenes ? scenes : scenes.filter((scene) => scene.projectId === activeProject?.id);
    const sceneCandidates = visibleScenes.map((scene) => ({
      id: `scene:${scene.id}`,
      source: "scene",
      name: scene.name,
      url: scene.referenceImage || scene.referenceImageBase64
    }));
    const visibleAutopilotJobs = autopilotJobs.filter(
      (job) => !job.projectId || job.projectId === activeProject?.id
    );
    const autopilotCandidates = visibleAutopilotJobs.flatMap((job) => {
      const characterAssets = (job.characterOutputs || []).filter((character) => !!character.imagePath).map((character, index) => ({
        id: `autopilot:${job.id}:character:${index}`,
        source: "autopilot",
        name: `${job.title}_character_${character.name}`,
        url: character.imagePath
      }));
      const shotAssets = (job.mediaOutputs || []).filter((shot) => !!(shot.imagePath || shot.videoPath)).map((shot) => ({
        id: `autopilot:${job.id}:shot:${shot.index}`,
        source: "autopilot",
        name: `${job.title}_shot_${String(shot.index).padStart(3, "0")}`,
        url: shot.imagePath || void 0,
        videoUrl: shot.videoPath || void 0
      }));
      const finalAsset = job.outputVideoPath ? [{
        id: `autopilot:${job.id}:final`,
        source: "autopilot",
        name: `${job.title}_final`,
        videoUrl: job.outputVideoPath
      }] : [];
      return [...characterAssets, ...shotAssets, ...finalAsset];
    });
    const visibleMediaFiles = resourceSharing.shareMedia ? mediaFiles : mediaFiles.filter((file) => file.projectId === activeProject?.id);
    const mediaCandidates = visibleMediaFiles.filter((file) => (file.type === "image" || file.type === "video") && !!file.url).map((file) => ({
      id: `media:${file.id}`,
      source: "media",
      name: file.name,
      url: file.type === "image" ? file.url : void 0,
      videoUrl: file.type === "video" ? file.url : void 0,
      thumbnailUrl: file.thumbnailUrl
    }));
    return [...directorCandidates, ...characterCandidates, ...sceneCandidates, ...autopilotCandidates, ...mediaCandidates];
  }, [activeProject?.id, autopilotJobs, characters, hasSplitScenes, mediaFiles, resourceSharing.shareCharacters, resourceSharing.shareMedia, resourceSharing.shareScenes, scenes, scriptData?.scenes, shots, splitScenes]);
  const visibleImageCandidates = reactExports.useMemo(
    () => imageCandidates.filter((candidate) => enabledSources[candidate.source]),
    [enabledSources, imageCandidates]
  );
  const selectedMediaAssets = reactExports.useMemo(
    () => imageCandidates.flatMap((candidate) => {
      if (!selectedAssetIds.has(candidate.id)) return [];
      const assets = [];
      if (candidate.url) {
        assets.push({
          id: `${candidate.id}:image`,
          source: candidate.source,
          type: "image",
          name: candidate.name,
          url: candidate.url
        });
      }
      if (candidate.videoUrl) {
        assets.push({
          id: `${candidate.id}:video`,
          source: candidate.source,
          type: "video",
          name: candidate.name,
          url: candidate.videoUrl
        });
      }
      return assets;
    }),
    [imageCandidates, selectedAssetIds]
  );
  const selectedItemCount = imageCandidates.filter(
    (candidate) => selectedAssetIds.has(candidate.id) && hasExportableMedia(candidate)
  ).length;
  const selectedImageCount = selectedMediaAssets.filter((asset) => asset.type === "image").length;
  const selectedVideoCount = selectedMediaAssets.filter((asset) => asset.type === "video").length;
  reactExports.useEffect(() => {
    if (initializedSelectionRef.current || imageCandidates.length === 0) return;
    initializedSelectionRef.current = true;
    setSelectedAssetIds(new Set(
      imageCandidates.filter((candidate) => (candidate.source === "director" || candidate.source === "autopilot") && hasExportableMedia(candidate)).map((candidate) => candidate.id)
    ));
  }, [imageCandidates]);
  const directorStats = hasSplitScenes ? getDirectorExportStats(splitScenes) : null;
  const directorCompleted = directorStats?.videosReady || 0;
  const directorWithImage = directorStats?.imagesReady || 0;
  const scriptStats = !hasSplitScenes && shots.length > 0 ? getExportStats(shots) : null;
  const scriptCompleted = scriptStats ? scriptStats.imagesReady + scriptStats.videosReady : 0;
  const totalItems = hasSplitScenes ? splitScenes.length : shots.length;
  const completedItems = hasSplitScenes ? directorCompleted : scriptCompleted;
  const imageReadyItems = hasSplitScenes ? directorWithImage : scriptStats?.imagesReady || 0;
  const progress = totalItems > 0 ? Math.round(completedItems / totalItems * 100) : 0;
  const canExport = selectedMediaAssets.length > 0;
  const estimatedDuration = totalItems * (hasSplitScenes ? 5 : 3);
  const toggleSource = (source) => {
    const nextEnabled = !enabledSources[source];
    setEnabledSources((current) => ({ ...current, [source]: nextEnabled }));
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      imageCandidates.filter((candidate) => candidate.source === source).forEach((candidate) => {
        if (nextEnabled && hasExportableMedia(candidate)) next.add(candidate.id);
        else next.delete(candidate.id);
      });
      return next;
    });
  };
  const toggleAsset = (candidate) => {
    if (!hasExportableMedia(candidate)) return;
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  };
  const selectAllVisible = () => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      visibleImageCandidates.forEach((candidate) => {
        if (hasExportableMedia(candidate)) next.add(candidate.id);
      });
      return next;
    });
  };
  const clearVisibleSelection = () => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      visibleImageCandidates.forEach((candidate) => next.delete(candidate.id));
      return next;
    });
  };
  const handleExportToFolder = reactExports.useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 0, message: t("export.preparingExport") });
    try {
      const success = await exportSelectedMediaToFolder(
        projectName,
        selectedMediaAssets,
        (p) => setExportProgress(p)
      );
      if (success) toast.success(t("export.done"));
    } catch (error) {
      toast.error(t("export.failed", { message: error.message }));
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [isExporting, projectName, selectedMediaAssets, t]);
  const handleDownloadFiles = reactExports.useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 0, message: t("export.preparingDownload") });
    try {
      await downloadSelectedMedia(
        selectedMediaAssets,
        (p) => setExportProgress(p)
      );
      toast.success(t("export.downloadDone"));
    } catch (error) {
      toast.error(t("export.downloadFailed", { message: error.message }));
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [isExporting, selectedMediaAssets, t]);
  const sourceOptions = [
    { source: "director", label: t("export.sourceDirector"), Icon: Film },
    { source: "character", label: t("export.sourceCharacters"), Icon: Users },
    { source: "scene", label: t("export.sourceScenes"), Icon: MapPin },
    { source: "autopilot", label: t("export.sourceAutopilot"), Icon: Rocket },
    { source: "media", label: t("export.sourceMedia"), Icon: Library }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 shrink-0 items-center justify-end border-b border-border/60 bg-panel/70 px-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-lg border border-border/60 bg-muted px-2 py-1 font-mono text-2xs uppercase text-muted-foreground", children: t("export.status", { value: progress === 100 ? t("export.statusReady") : t("export.statusInProgress") }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 md:p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto flex flex-col gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-2 bg-card border border-border rounded-xl p-6 space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-foreground", children: t("export.chooseImages") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("export.chooseImagesDesc") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: selectAllVisible, disabled: visibleImageCandidates.every((candidate) => !hasExportableMedia(candidate)), children: t("export.selectAllImages") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearVisibleSelection, children: t("export.clearImages") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3", children: sourceOptions.map(({ source, label, Icon }) => {
          const sourceItems = imageCandidates.filter((candidate) => candidate.source === source);
          const readyCount = sourceItems.filter(hasExportableMedia).length;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              className: cn(
                "h-auto min-h-16 justify-start gap-3 px-4 py-3",
                enabledSources[source] && "border-primary bg-primary/10 text-primary hover:bg-primary/15"
              ),
              onClick: () => toggleSource(source),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: enabledSources[source], className: "pointer-events-none" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 text-left", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium truncate", children: label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: t("export.readyImages", { ready: readyCount, total: sourceItems.length }) })
                ] })
              ]
            },
            source
          );
        }) }),
        visibleImageCandidates.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3", children: visibleImageCandidates.map((candidate) => {
          const isSelected = selectedAssetIds.has(candidate.id);
          const hasMedia = hasExportableMedia(candidate);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "rounded-lg border overflow-hidden text-left transition-all",
                hasMedia ? "hover:border-primary/60" : "opacity-60 cursor-not-allowed",
                isSelected && "border-primary ring-1 ring-primary"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square bg-muted relative flex items-center justify-center overflow-hidden", children: [
                  candidate.url || candidate.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(LocalImage, { src: candidate.url || candidate.thumbnailUrl, alt: candidate.name, className: "h-full w-full object-contain" }) : candidate.videoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-primary", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-7 w-7" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs", children: t("export.videoOnly") })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-muted-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-7 w-7" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs", children: t("export.noImage") })
                  ] }),
                  hasMedia && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => toggleAsset(candidate), className: "absolute top-2 right-2 rounded bg-background/85 p-1", title: isSelected ? t("export.clearImages") : t("export.selectAllImages"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: isSelected, className: "pointer-events-none" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-2 left-2 flex items-center gap-1", children: [
                    candidate.url && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", variant: "secondary", className: "h-7 px-2 text-2xs shadow", onClick: () => setPreview({ type: "image", url: candidate.url }), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-1 h-3 w-3" }),
                      t("autopilot.panel.previewImage")
                    ] }),
                    candidate.videoUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", variant: "secondary", className: "h-7 px-2 text-2xs shadow", onClick: () => setPreview({ type: "video", url: candidate.videoUrl }), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-1 h-3 w-3" }),
                      t("autopilot.panel.previewVideo")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: !hasMedia, onClick: () => toggleAsset(candidate), className: "block w-full p-2 text-left disabled:cursor-not-allowed", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium truncate", title: candidate.name, children: candidate.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t(`export.source.${candidate.source}`) }),
                    candidate.videoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-medium text-primary", children: t("export.videoIncluded") })
                  ] })
                ] })
              ]
            },
            candidate.id
          );
        }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground", children: t("export.noSourceSelected") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("export.selectedMedia", { items: selectedItemCount, images: selectedImageCount, videos: selectedVideoCount }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-1 bg-card border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-48 bg-primary/5 blur-[120px] rounded-full pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 p-32 bg-green-500/5 blur-[100px] rounded-full pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-10 relative z-10 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl md:text-3xl font-bold text-foreground tracking-tight", children: scriptData?.title || activeProject?.name || t("export.untitledProject") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 bg-muted border border-border text-muted-foreground text-2xs rounded uppercase font-mono tracking-wider", children: t("export.masterSequence") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 mt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground font-bold mb-0.5", children: hasSplitScenes ? t("export.splitScenes") : t("export.shotsLabel") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono text-foreground/80", children: totalItems })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-border" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground font-bold mb-0.5", children: t("export.estDuration") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-mono text-foreground/80", children: [
                  "~",
                  estimatedDuration,
                  "s"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-border" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground font-bold mb-0.5", children: t("export.target") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono text-foreground/80", children: targetDuration })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right bg-muted/50 p-4 rounded-lg border border-border backdrop-blur-sm min-w-[160px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-end gap-1 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-mono font-bold text-primary", children: progress }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "%" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground flex items-center justify-end gap-2", children: [
              progress === 100 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "w-3 h-3" }),
              t("export.renderStatus")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-2xs text-muted-foreground font-mono mb-2 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              t("export.sequenceMap"),
              hasSplitScenes ? ` (${t("export.director")})` : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "TC 00:00:00:00" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 bg-muted/30 rounded-lg border border-border flex items-center px-2 gap-1 overflow-x-auto relative shadow-inner", children: totalItems === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex items-center justify-center text-muted-foreground/50 text-xs font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-4 h-4 mr-2" }),
            t("export.noShots")
          ] }) : hasSplitScenes ? splitScenes.map((scene, idx) => {
            const hasImage = scene.imageStatus === "completed" && !!scene.imageDataUrl;
            const hasVideo = scene.videoStatus === "completed" && !!scene.videoUrl;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: cn(
                  "h-14 min-w-[4px] flex-1 rounded-[2px] transition-all relative group flex flex-col justify-end overflow-hidden",
                  hasVideo ? "bg-green-500/40 border border-green-500/30 hover:bg-green-500/50" : hasImage ? "bg-primary/40 border border-primary/30 hover:bg-primary/50" : "bg-muted border border-border hover:bg-muted/80"
                ),
                title: t("export.sceneTitle", { index: idx + 1, name: scene.sceneName || scene.imagePrompt || "" }),
                children: [
                  hasVideo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-green-500/20" }),
                  hasImage && !hasVideo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-primary/20" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-popover text-popover-foreground text-2xs px-2 py-1 rounded border border-border shadow-xl", children: t("export.sceneStatus", { index: idx + 1, suffix: hasVideo ? t("export.videoBadge") : hasImage ? t("export.imageBadge") : "" }) }) })
                ]
              },
              scene.id
            );
          }) : shots.map((shot, idx) => {
            const isDone = !!shot.imageUrl || !!shot.videoUrl;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: cn(
                  "h-14 min-w-[4px] flex-1 rounded-[2px] transition-all relative group flex flex-col justify-end overflow-hidden",
                  isDone ? "bg-primary/40 border border-primary/30 hover:bg-primary/50" : "bg-muted border border-border hover:bg-muted/80"
                ),
                title: t("export.shotTitle", { index: idx + 1, name: shot.imagePrompt || shot.videoPrompt || "" }),
                children: [
                  isDone && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-primary/20" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-popover text-popover-foreground text-2xs px-2 py-1 rounded border border-border shadow-xl", children: t("export.shotStatus", { index: idx + 1 }) }) })
                ]
              },
              shot.id
            );
          }) }),
          hasSplitScenes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mt-2 text-2xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("export.imagesCount", { ready: imageReadyItems, total: totalItems }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("export.videosCount", { ready: completedItems, total: totalItems }) })
          ] })
        ] }),
        exportProgress && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: exportProgress.message }),
            exportProgress.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              exportProgress.current,
              "/",
              exportProgress.total
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Progress,
            {
              value: exportProgress.total > 0 ? exportProgress.current / exportProgress.total * 100 : 0,
              className: "h-1.5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              disabled: !canExport || isExporting,
              onClick: handleExportToFolder,
              className: cn(
                "h-12 font-bold text-xs transition-all",
                canExport && !isExporting ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
              ),
              children: isExporting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                t("export.exporting")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4 mr-2" }),
                t("export.selectFolder")
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              disabled: !canExport || isExporting,
              onClick: handleDownloadFiles,
              className: "h-12 font-bold text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
                t("export.downloadIndividually")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-xs text-muted-foreground", children: t("export.selectedMedia", { items: selectedItemCount, images: selectedImageCount, videos: selectedVideoCount }) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePreviewModal, { imageUrl: preview?.type === "image" ? preview.url : "", isOpen: preview?.type === "image", onClose: () => setPreview(null), onImageCleaned: (cleanedUrl) => setPreview({ type: "image", url: cleanedUrl }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPreviewModal, { videoUrl: preview?.type === "video" ? preview.url : "", isOpen: preview?.type === "video", onClose: () => setPreview(null) })
  ] });
}
export {
  ExportView
};
