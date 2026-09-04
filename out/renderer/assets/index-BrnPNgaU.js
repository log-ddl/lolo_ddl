import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, a3 as Check, aB as RotateCcw, X, bk as ImagePlus, K as Plus, L as LoaderCircle, aC as Square, B as MapPin, b6 as Upload, d as Trash2, P as Pencil, bm as FolderInput, b0 as House, bn as Folder, O as ChevronRight, af as Search, bo as Grid2x2, bp as List, bq as FileUp, br as FileDown, bs as Images, aZ as Sparkles, q as RefreshCw, ag as GripVertical, D as Download } from "./lucide-react-DHCwBhKI.js";
import { C as getStyleById, c as useProjectVisualStyleId, f as useSceneStore, k as useMediaStore, j as useScriptStore, z as saveImageToLocal, q as getFeatureConfig, A as getFeatureNotConfiguredMessage, H as syncRuntimeLaneSettings, I as resolveLaneCount, L as runLaneQueue, J as buildLaneWorkers, B as readImageAsBase64, u as useActiveScriptProject } from "./autopilot-store-5JX3PjC8.js";
import { a as useI18n, t as toast, B as Button, I as Input, c as cn, b as useVideoStudioSettingsStore, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogFooter } from "./index-DI8hnspe.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-DC6gTyzy.js";
import { u as useNow } from "./use-now-BZ1xkfxg.js";
import { u as useMediaPanelStore, C as Checkbox } from "./entry--3YkNZ1p.js";
import { b as generateSceneImage, g as getSourceFingerprint } from "./source-fingerprint-LXNjfvLD.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { L as Label } from "./label-CEtfDDyg.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-eJGB6k9g.js";
import { S as StylePicker } from "./index-RTeyZCqD.js";
import { a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
import { u as useGoogleFlowRuntimeStore } from "./google-flow-runtime-store-S1TkgWH5.js";
import { I as ImagePreviewModal } from "./media-preview-modal-BF74hBBT.js";
import { s as syncGoogleFlowReferenceSources, m as matchImageFilesByName, i as isSupportedImageFile, u as useGoogleFlowSyncScopes, g as getGoogleFlowSyncProgress, c as serializeSceneLibraryCsv, d as downloadLibraryCsv, e as importSceneCsv } from "./library-csv-import-D_Rc1JNj.js";
import { u as useResolvedImageUrl } from "./use-resolved-image-url-B0ytLPJI.js";
import "./model-registry-B3C-u_uk.js";
import { T as TaskInfoButton } from "./task-info-button-6_NaUIsa.js";
import { C as ContextMenu, a as ContextMenuTrigger, b as ContextMenuContent, c as ContextMenuItem, d as ContextMenuSeparator, e as ContextMenuSub, f as ContextMenuSubTrigger, g as ContextMenuSubContent } from "./context-menu-Bq4i-VOF.js";
import { S as Separator } from "./separator-Cu5BjUUB.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./progress-CiMxjjHG.js";
import "./popover-CDkCw224.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
import "./local-image-COcd7dBC.js";
function getScenePromptSource(scene) {
  return scene.scenePrompt?.trim() || scene.description?.trim() || scene.name?.trim() || "";
}
function buildSceneImagePrompt(scene) {
  const stylePreset = scene.styleId ? getStyleById(scene.styleId) : null;
  return [getScenePromptSource(scene), stylePreset?.prompt].filter(Boolean).join(", ");
}
const ASPECT_RATIO_OPTIONS$1 = ["1:1", "3:4", "4:3", "9:16", "16:9"];
function GenerationPanel({ selectedScene, onSceneCreated }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const {
    addScene,
    updateScene,
    selectScene,
    generationStatus,
    setGenerationStatus,
    setGeneratingScene,
    currentFolderId
  } = useSceneStore();
  const { pendingSceneData, setPendingSceneData } = useMediaPanelStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const { activeProjectId: scriptProjectId } = useScriptStore();
  const resourceProjectId = scriptProjectId;
  const [, setPromptLanguage] = reactExports.useState("en");
  const [name, setName] = reactExports.useState("");
  const [aspectRatio, setAspectRatio] = reactExports.useState("16:9");
  const [description, setDescription] = reactExports.useState("");
  const [scenePrompt, setScenePrompt] = reactExports.useState("");
  const [styleId, setStyleId] = reactExports.useState(projectVisualStyleId);
  const [referenceImages, setReferenceImages] = reactExports.useState([]);
  const [previewUrl, setPreviewUrl] = reactExports.useState(null);
  const [previewSceneId, setPreviewSceneId] = reactExports.useState(null);
  const [activeController, setActiveController] = reactExports.useState(null);
  const [generationStartedAt, setGenerationStartedAt] = reactExports.useState(null);
  const isGenerating = generationStatus === "generating";
  const now = useNow(isGenerating);
  const elapsedSeconds = generationStartedAt ? Math.max(0, Math.floor((now - generationStartedAt) / 1e3)) : 0;
  reactExports.useEffect(() => {
    if (!isGenerating) setGenerationStartedAt(null);
  }, [isGenerating]);
  const finalImagePromptPreview = reactExports.useMemo(() => {
    if (!name.trim() && !description.trim() && !scenePrompt.trim()) return "";
    return buildSceneImagePrompt({
      name,
      description,
      scenePrompt,
      styleId
    });
  }, [name, description, scenePrompt, styleId]);
  const handleRefImageChange = async (e) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [];
    for (const file of Array.from(files)) {
      if (referenceImages.length + newImages.length >= 3) break;
      try {
        const base64 = await fileToBase64$2(file);
        newImages.push(base64);
      } catch (err) {
        console.error("Failed to convert image:", err);
      }
    }
    if (newImages.length > 0) {
      setReferenceImages([...referenceImages, ...newImages].slice(0, 3));
    }
    e.target.value = "";
  };
  const removeRefImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };
  reactExports.useEffect(() => {
    if (!selectedScene) return;
    setName(selectedScene.name || "");
    setDescription(selectedScene.description || "");
    setScenePrompt(selectedScene.scenePrompt || "");
    setAspectRatio(selectedScene.aspectRatio || "16:9");
    const validStyle = selectedScene.styleId ? getStyleById(selectedScene.styleId) : null;
    setStyleId(validStyle?.id || projectVisualStyleId);
  }, [selectedScene, projectVisualStyleId]);
  reactExports.useEffect(() => {
    if (!selectedScene && !pendingSceneData) {
      setStyleId(projectVisualStyleId);
    }
  }, [projectVisualStyleId, selectedScene, pendingSceneData]);
  reactExports.useEffect(() => {
    if (!pendingSceneData) return;
    const data = pendingSceneData;
    setPendingSceneData(null);
    if (data.promptLanguage) {
      setPromptLanguage(data.promptLanguage);
    }
    if (data.name) {
      const parsedStyleId = projectVisualStyleId;
      setStyleId(parsedStyleId);
      const newId = addScene({
        name: data.name.trim(),
        description: data.description?.trim() || void 0,
        time: "day",
        atmosphere: "neutral",
        aspectRatio: data.aspectRatio || "16:9",
        scenePrompt: data.scenePrompt?.trim() || void 0,
        styleId: parsedStyleId,
        folderId: currentFolderId,
        projectId: resourceProjectId || void 0,
        // Episode scope
        linkedEpisodeId: data.sourceEpisodeId
      });
      selectScene(newId);
      onSceneCreated?.(newId);
      toast.success(t("scenes.autoCreated", { name: data.name }));
    } else {
      setName(data.name || "");
      setDescription(data.description || "");
      setStyleId(projectVisualStyleId);
      if (data.scenePrompt) {
        setScenePrompt(data.scenePrompt || "");
      }
      setAspectRatio(data.aspectRatio || "16:9");
    }
  }, [pendingSceneData, setPendingSceneData, addScene, selectScene, onSceneCreated, currentFolderId, projectVisualStyleId, resourceProjectId, t]);
  const handleCreateScene = () => {
    if (!name.trim()) {
      toast.error(t("scenes.enterName"));
      return;
    }
    if (!finalImagePromptPreview.trim()) {
      toast.error(t("scenes.enterLocation"));
      return;
    }
    const { activeEpisodeIndex } = useMediaPanelStore.getState();
    const scriptState = useScriptStore.getState();
    const activeScriptProject = scriptState.activeProjectId ? scriptState.projects[scriptState.activeProjectId] : null;
    const manualEpisodeId = activeEpisodeIndex != null ? activeScriptProject?.scriptData?.episodes.find((ep) => ep.index === activeEpisodeIndex)?.id : void 0;
    const id = addScene({
      name: name.trim(),
      description: description.trim() || void 0,
      time: "day",
      atmosphere: "neutral",
      aspectRatio,
      scenePrompt: scenePrompt.trim() || void 0,
      styleId,
      folderId: currentFolderId,
      projectId: resourceProjectId || void 0,
      linkedEpisodeId: manualEpisodeId
    });
    toast.success(t("scenes.created"));
    selectScene(id);
    onSceneCreated?.(id);
  };
  const handleGenerate = async () => {
    if (!selectedScene) {
      toast.error(t("scenes.selectOrCreate"));
      return;
    }
    const targetId = selectedScene.id;
    const prompt = buildSceneImagePrompt({
      ...selectedScene,
      name,
      description,
      scenePrompt,
      styleId
    });
    if (!prompt.trim()) {
      toast.error(t("scenes.enterLocation"));
      return;
    }
    const featureConfig = getFeatureConfig("character_generation");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("character_generation"));
      return;
    }
    if (aspectRatio !== (selectedScene.aspectRatio || "16:9") || description.trim() !== (selectedScene.description || "") || scenePrompt.trim() !== (selectedScene.scenePrompt || "") || styleId !== (selectedScene.styleId || projectVisualStyleId)) {
      updateScene(targetId, {
        aspectRatio,
        description: description.trim() || void 0,
        scenePrompt: scenePrompt.trim() || void 0,
        styleId
      });
    }
    setGenerationStatus("generating");
    setGeneratingScene(targetId);
    const controller = new AbortController();
    setActiveController(controller);
    try {
      const sceneReferenceImages = [...referenceImages];
      const result = await generateSceneImage({
        prompt,
        aspectRatio,
        referenceImages: sceneReferenceImages.length > 0 ? sceneReferenceImages : void 0,
        styleId,
        onSubmitted: (submittedAt) => setGenerationStartedAt(submittedAt || Date.now()),
        signal: controller.signal
      });
      setPreviewUrl(result.imageUrl);
      setPreviewSceneId(targetId);
      setGenerationStatus("completed");
      toast.success(t("scenes.conceptReady"));
    } catch (error) {
      if (controller.signal.aborted) {
        setGenerationStatus("idle");
        return;
      }
      const err = error;
      setGenerationStatus("error", err.message);
      toast.error(t("scenes.generateImageFailed", { name: selectedScene.name, message: err.message }));
    } finally {
      setActiveController(null);
      setGeneratingScene(null);
    }
  };
  const handleStopGenerate = () => {
    activeController?.abort();
    setActiveController(null);
    setGenerationStatus("idle");
    setGeneratingScene(null);
    toast.info("Đã dừng tạo ảnh cảnh");
  };
  const handleSavePreview = async () => {
    if (!previewUrl || !previewSceneId) return;
    toast.loading("Saving image locally...", { id: "saving-scene-preview" });
    try {
      const sceneName = (name || selectedScene?.name || "scene").replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      const localPath = await saveImageToLocal(
        previewUrl,
        "scenes",
        `${sceneName}_${Date.now()}.png`
      );
      updateScene(previewSceneId, {
        referenceImage: localPath,
        aspectRatio
      });
      const aiFolderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${name || selectedScene?.name || "Untitled"}`,
        type: "image",
        source: "ai-image",
        folderId: aiFolderId,
        projectId: resourceProjectId || void 0
      });
      setPreviewUrl(null);
      setPreviewSceneId(null);
      toast.success(t("scenes.savedLocal"), { id: "saving-scene-preview" });
    } catch (error) {
      console.error("Failed to save scene preview:", error);
      toast.error(t("scenes.saveFailed"), { id: "saving-scene-preview" });
    }
  };
  const handleDiscardPreview = () => {
    setPreviewUrl(null);
    setPreviewSceneId(null);
    setGenerationStatus("idle");
  };
  if (previewUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm mb-3", children: t("scenes.previewTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg overflow-hidden border-2 border-amber-500/50 bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: previewUrl,
              alt: t("scenes.previewAlt"),
              className: "w-full h-auto"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded", children: t("scenes.previewBadge") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSavePreview, className: "w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2" }),
          t("scenes.saveConcept")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleGenerate, variant: "outline", className: "w-full", disabled: isGenerating, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4 mr-2" }),
          t("scenes.regenerateConcept")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleDiscardPreview, variant: "ghost", className: "w-full text-muted-foreground", size: "sm", children: t("scenes.discardBack") })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-h-0 flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 border-b space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm", children: t("scenes.console") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 min-h-0 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: t("scenes.namePlaceholder"),
              disabled: isGenerating
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.imageAspectRatio") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: aspectRatio, onValueChange: (value) => setAspectRatio(value), disabled: isGenerating, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ASPECT_RATIO_OPTIONS$1.map((ratio) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ratio, children: ratio }, ratio)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.description") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: t("scenes.descriptionPlaceholder"),
            className: "min-h-[70px] text-sm resize-none",
            disabled: isGenerating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.scenePrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: scenePrompt,
            onChange: (e) => setScenePrompt(e.target.value),
            placeholder: t("scenes.scenePromptPlaceholder"),
            className: "min-h-[100px] text-sm resize-none",
            disabled: isGenerating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("overview.visualStyle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StylePicker,
          {
            value: styleId,
            onChange: (id) => setStyleId(id),
            disabled: isGenerating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.references") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            referenceImages.length,
            "/3"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          referenceImages.map((img, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: img,
                alt: `Reference image ${i + 1}`,
                className: "w-14 h-14 object-cover rounded-lg border"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => removeRefImage(i),
                className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
              }
            )
          ] }, i)),
          referenceImages.length < 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "scene-gen-ref-image",
                type: "file",
                accept: "image/*",
                multiple: true,
                className: "hidden",
                onChange: handleRefImageChange
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "w-14 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors gap-1 cursor-pointer",
                onClick: () => document.getElementById("scene-gen-ref-image")?.click(),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs", children: t("director.card.upload") })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("scenes.aiUsesRefs") })
      ] }),
      finalImagePromptPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border bg-muted/30 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("scenes.finalImagePrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap", children: finalImagePromptPreview })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-3 pt-3 pb-14 border-t bg-background space-y-2", children: !selectedScene ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleCreateScene, className: "w-full", disabled: !name.trim() || !scenePrompt.trim(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
      t("scenes.created")
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleGenerate,
          className: "flex-1",
          disabled: isGenerating || !finalImagePromptPreview.trim(),
          children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
            generationStartedAt ? `Đang tạo ${elapsedSeconds}s` : "Đang chờ"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: selectedScene.referenceImage ? t("scenes.regenerateConcept") : t("scenes.generateConcept") })
        }
      ),
      isGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: handleStopGenerate, className: "w-10 px-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-4 w-4" }) })
    ] }) })
  ] });
}
function fileToBase64$2(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
function SceneCard({
  scene,
  isSelected,
  viewMode,
  onClick,
  depth = 0,
  childCount: _childCount = 0,
  isExpanded = false,
  hasChildren = false,
  onToggleExpand,
  onImagePreview,
  selected = false,
  onSelectionChange,
  onDeleteVisible,
  generating = false,
  generationSubmitted = false,
  generatingElapsedSeconds = 0,
  onGenerateImage,
  onStopGenerateImage,
  onUploadImage,
  flowSyncEnabled = false,
  flowSyncProgress,
  flowSyncOffline = false
}) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const displayImage = scene.referenceImage || void 0;
  const resolvedImage = useResolvedImageUrl(displayImage);
  const hasImage = !!scene.referenceImage;
  const hasSyncSource = Boolean(scene.referenceImage || scene.referenceImageBase64);
  const promptText = scene.description || scene.scenePrompt || t("scenes.noDescription");
  const generationPrompt = buildSceneImagePrompt({
    ...scene,
    aspectRatio: scene.aspectRatio || "16:9",
    styleId: scene.styleId || projectVisualStyleId
  });
  const indentStyle = { marginLeft: `${depth * 20}px` };
  if (viewMode === "grid") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        style: indentStyle,
        className: cn(
          "rounded-lg border cursor-pointer transition-all p-2",
          "hover:border-foreground/30",
          isSelected && "border-primary ring-1 ring-primary"
        ),
        onClick,
        onDoubleClick: (e) => {
          e.stopPropagation();
          if (hasChildren) {
            onToggleExpand?.();
          }
        },
        children: [
          depth === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex justify-end", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: selected, onCheckedChange: (checked) => onSelectionChange?.(checked === true) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "aspect-square rounded bg-muted flex items-center justify-center overflow-hidden mb-2 relative",
                hasChildren ? "cursor-pointer" : "cursor-zoom-in"
              ),
              title: hasChildren ? isExpanded ? t("scenes.collapseChildren") : t("scenes.expandChildren") : t("scenes.previewFullImage"),
              onClick: (e) => {
                e.stopPropagation();
                if (hasChildren) {
                  onToggleExpand?.();
                } else {
                  if (resolvedImage) onImagePreview?.(resolvedImage);
                }
              },
              children: [
                generating ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ" })
                ] }) : displayImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: resolvedImage || "",
                    alt: scene.name,
                    className: "w-full h-full object-contain"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-8 w-8 text-muted-foreground" }),
                depth === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 right-1 flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TaskInfoButton,
                    {
                      outputUrl: scene.referenceImage,
                      prompt: generationPrompt,
                      kind: "image",
                      title: t("taskInfo.image"),
                      className: "h-6 w-6 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex h-6 px-1.5 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70 cursor-pointer", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/*",
                        className: "hidden",
                        onChange: (event) => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (file) onUploadImage?.(file);
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: scene.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("px-2 py-0.5 rounded text-2xs shrink-0", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"), children: hasImage ? t("scenes.imageReady") : t("scenes.imageMissing") })
            ] }),
            flowSyncEnabled && hasSyncSource && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
              "inline-flex px-2 py-0.5 rounded text-2xs",
              flowSyncOffline ? "bg-muted text-muted-foreground" : flowSyncProgress?.missing === 0 ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
            ), children: flowSyncOffline ? t("scenes.syncFlowOffline") : t("scenes.syncFlowProgress", {
              synced: flowSyncProgress?.synced || 0,
              total: flowSyncProgress?.total || 0
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 min-h-[32px]", children: promptText }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { outputUrl: scene.referenceImage, prompt: generationPrompt, kind: "image", title: t("taskInfo.image") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: hasImage ? "outline" : "default",
                  className: "h-7 text-xs flex-1",
                  disabled: generating,
                  onClick: hasImage ? onClick : (event) => {
                    event.stopPropagation();
                    onGenerateImage?.();
                  },
                  children: generating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin mr-1" }),
                    generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ"
                  ] }) : hasImage ? t("scenes.openDetails") : t("scenes.generateSceneImage")
                }
              ),
              generating && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-7 w-7 p-0", onClick: onStopGenerateImage, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0 text-destructive hover:text-destructive", onClick: onDeleteVisible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
            ] })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: indentStyle,
      className: cn(
        "rounded-lg border cursor-pointer transition-all p-2 flex items-center gap-3",
        "hover:border-foreground/30",
        isSelected && "border-primary ring-1 ring-primary"
      ),
      onClick,
      onDoubleClick: (e) => {
        e.stopPropagation();
        if (hasChildren) {
          onToggleExpand?.();
        }
      },
      children: [
        depth === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: selected, onCheckedChange: (checked) => onSelectionChange?.(checked === true) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative", children: generating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 text-muted-foreground animate-spin" }) : displayImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: resolvedImage || "",
            alt: scene.name,
            className: "w-full h-full object-cover"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: scene.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("px-2 py-0.5 rounded text-2xs shrink-0", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"), children: hasImage ? t("scenes.imageReady") : t("scenes.imageMissing") }),
            flowSyncEnabled && hasSyncSource && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
              "px-2 py-0.5 rounded text-2xs shrink-0",
              flowSyncOffline ? "bg-muted text-muted-foreground" : flowSyncProgress?.missing === 0 ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
            ), children: flowSyncOffline ? t("scenes.syncFlowOffline") : t("scenes.syncFlowProgress", {
              synced: flowSyncProgress?.synced || 0,
              total: flowSyncProgress?.total || 0
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: promptText })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-2xs flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "sm",
              variant: hasImage ? "outline" : "default",
              className: "h-7 text-xs",
              disabled: generating,
              onClick: (e) => {
                e.stopPropagation();
                if (hasImage) onClick();
                else onGenerateImage?.();
              },
              children: generating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin mr-1" }),
                generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ"
              ] }) : hasImage ? t("scenes.openDetails") : t("scenes.generateSceneImage")
            }
          ),
          generating && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-7 w-7 p-0", onClick: (e) => {
            e.stopPropagation();
            onStopGenerateImage?.();
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex h-6 px-1.5 items-center justify-center rounded-lg hover:bg-accent cursor-pointer", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) onUploadImage?.(file);
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0 text-destructive hover:text-destructive", onClick: (e) => {
            e.stopPropagation();
            onDeleteVisible?.();
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ]
    }
  );
}
function FolderContextMenu({
  folder: _folder,
  children,
  onRename,
  onDelete
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: onRename, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 mr-2" }),
        t("scenes.renameFolder")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { className: "text-destructive", onClick: onDelete, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
        t("scenes.deleteFolder")
      ] })
    ] })
  ] });
}
function SceneContextMenu({
  scene: _scene,
  children,
  folders,
  onDelete,
  onMove
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSub, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderInput, { className: "h-4 w-4 mr-2" }),
          t("common.moveTo")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onMove(null), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4 mr-2" }),
            t("common.root")
          ] }),
          folders.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onMove(f.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-4 w-4 mr-2" }),
            f.name
          ] }, f.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { className: "text-destructive", onClick: onDelete, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
        t("scenes.deleteScene")
      ] })
    ] })
  ] });
}
async function getUploadLaneConfig() {
  const featureConfig = getFeatureConfig("character_generation");
  await syncRuntimeLaneSettings();
  const laneCount = await resolveLaneCount("image", featureConfig?.platform);
  return { laneCount };
}
function fileToBase64$1(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
function safeSceneFileName(name) {
  return (name || "scene").replace(/[^a-zA-Z0-9一-龥]/g, "_");
}
function useSceneImageGeneration(deps) {
  const {
    visibleScenes,
    sceneImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName,
    updateScene,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t
  } = deps;
  const [generatingSceneIds, setGeneratingSceneIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [generatingStartedAtById, setGeneratingStartedAtById] = reactExports.useState({});
  const [isGeneratingAllImages, setIsGeneratingAllImages] = reactExports.useState(false);
  const [isFillingImages, setIsFillingImages] = reactExports.useState(false);
  const [isSyncingGoogleFlowReferences, setIsSyncingGoogleFlowReferences] = reactExports.useState(false);
  const now = useNow(generatingSceneIds.size > 0);
  const activeGenerationControllersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const generateOneSceneImage = async (scene) => {
    const controller = new AbortController();
    activeGenerationControllersRef.current.set(scene.id, controller);
    setGeneratingSceneIds((prev) => new Set(prev).add(scene.id));
    try {
      const targetStyleId = scene.styleId || projectVisualStyleId;
      const prompt = buildSceneImagePrompt({
        ...scene,
        aspectRatio: scene.aspectRatio || "16:9",
        styleId: targetStyleId
      });
      const result = await generateSceneImage({
        prompt,
        aspectRatio: scene.aspectRatio || "16:9",
        styleId: targetStyleId,
        onSubmitted: (submittedAt) => {
          setGeneratingStartedAtById((prev) => prev[scene.id] ? prev : { ...prev, [scene.id]: submittedAt || Date.now() });
        },
        signal: controller.signal
      });
      const localPath = await saveImageToLocal(
        result.imageUrl,
        "scenes",
        `${safeSceneFileName(scene.name)}_${Date.now()}.png`
      );
      const updates = {
        referenceImage: localPath,
        aspectRatio: scene.aspectRatio || "16:9"
      };
      if (result.mediaId && result.ownerScopeId && result.flowProjectId) {
        const storedMedia = { mediaId: result.mediaId, flowProjectId: result.flowProjectId };
        const localSourceKey = getSourceFingerprint(localPath);
        const remoteSourceKey = getSourceFingerprint(result.imageUrl);
        updates.googleFlowMediaIdsBySource = {
          ...scene.googleFlowMediaIdsBySource || {},
          [localSourceKey]: { ...(scene.googleFlowMediaIdsBySource || {})[localSourceKey] || {}, [result.ownerScopeId]: storedMedia },
          [remoteSourceKey]: { ...(scene.googleFlowMediaIdsBySource || {})[remoteSourceKey] || {}, [result.ownerScopeId]: storedMedia }
        };
      }
      updateScene(scene.id, updates);
      const aiFolderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${scene.name || "Untitled"}`,
        type: "image",
        source: "ai-image",
        folderId: aiFolderId,
        projectId: scene.projectId ?? activeProjectId ?? void 0
      });
      toast.success(t("scenes.generatedImagesAll", { count: 1 }));
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("scenes.generateImageFailed", { name: scene.name, message }));
    } finally {
      activeGenerationControllersRef.current.delete(scene.id);
      setGeneratingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
      setGeneratingStartedAtById((prev) => {
        if (!prev[scene.id]) return prev;
        const next = { ...prev };
        delete next[scene.id];
        return next;
      });
    }
  };
  const handleStopGenerateSceneImage = (sceneId) => {
    activeGenerationControllersRef.current.get(sceneId)?.abort();
    activeGenerationControllersRef.current.delete(sceneId);
    setGeneratingSceneIds((prev) => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
    setGeneratingStartedAtById((prev) => {
      if (!prev[sceneId]) return prev;
      const next = { ...prev };
      delete next[sceneId];
      return next;
    });
    toast.info("Đã dừng tạo ảnh cảnh");
  };
  const handleStopAllGenerateSceneImages = () => {
    activeGenerationControllersRef.current.forEach((controller) => controller.abort());
    activeGenerationControllersRef.current.clear();
    setGeneratingSceneIds(/* @__PURE__ */ new Set());
    setGeneratingStartedAtById({});
    setIsGeneratingAllImages(false);
    toast.info("Đã dừng tạo ảnh cảnh");
  };
  const handleGenerateSceneImage = (scene) => {
    void generateOneSceneImage(scene);
  };
  const handleGenerateAllSceneImages = async () => {
    if (sceneImageBatchTargets.length === 0) {
      toast.info(t("scenes.noImagesToGenerate"));
      return;
    }
    const featureConfig = getFeatureConfig("character_generation");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("character_generation"));
      return;
    }
    setIsGeneratingAllImages(true);
    try {
      const { laneCount } = await getUploadLaneConfig();
      await runLaneQueue(
        sceneImageBatchTargets.map((scene) => ({ item: scene })),
        buildLaneWorkers([], laneCount),
        async ({ item: scene }) => {
          try {
            await generateOneSceneImage(scene);
          } catch (error) {
            if (!(error instanceof Error && error.message === "Cancelled by user")) {
              console.error(`[SceneGallery] Batch: scene ${scene.id} image generation failed:`, error);
            }
          }
        },
        void 0
      );
    } finally {
      setIsGeneratingAllImages(false);
    }
  };
  const handleUploadSceneImage = async (scene, file) => {
    try {
      const dataUrl = await fileToBase64$1(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        "scenes",
        `${safeSceneFileName(scene.name)}_${Date.now()}.png`
      );
      updateScene(scene.id, { referenceImage: localPath });
      toast.success(t("scenes.uploadedSceneImage"));
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleFillSceneImages = async (files) => {
    const targets = visibleScenes.filter(
      (scene) => !scene.referenceImage && !scene.referenceImageBase64
    );
    const result = matchImageFilesByName(
      files.filter(isSupportedImageFile),
      targets,
      (scene) => scene.id,
      (scene) => scene.name
    );
    let filled = 0;
    let failed = 0;
    setIsFillingImages(true);
    try {
      for (let index = 0; index < result.matches.length; index++) {
        const { file, item: scene } = result.matches[index];
        try {
          const dataUrl = await fileToBase64$1(file);
          const localPath = await saveImageToLocal(
            dataUrl,
            "scenes",
            `${safeSceneFileName(scene.name)}_${Date.now()}_${index}.png`
          );
          updateScene(scene.id, { referenceImage: localPath });
          filled += 1;
        } catch {
          failed += 1;
        }
      }
    } finally {
      setIsFillingImages(false);
    }
    toast.success(t("scenes.imagesFilled", {
      filled,
      skipped: result.unmatched + result.ambiguous + failed
    }));
  };
  const handleSyncGoogleFlowReferences = async () => {
    if (isSyncingGoogleFlowReferences) return;
    const sources = visibleScenes.flatMap((scene) => [scene.referenceImage, scene.referenceImageBase64].filter((source) => !!source).map((source) => ({
      source,
      mediaIdsByOwnerScope: scene.googleFlowMediaIdsBySource?.[getSourceFingerprint(source)]
    })));
    setIsSyncingGoogleFlowReferences(true);
    try {
      const result = await syncGoogleFlowReferenceSources(flowBindingProjectId, sources, activeProjectName);
      for (const scene of visibleScenes) {
        const nextBySource = { ...scene.googleFlowMediaIdsBySource || {} };
        let changed = false;
        for (const source of [scene.referenceImage, scene.referenceImageBase64].filter((value) => !!value)) {
          const sourceKey = getSourceFingerprint(source);
          const byOwner = { ...nextBySource[sourceKey] || {} };
          for (const credential of result.credentials) {
            const mediaId = credential.mediaIdsBySource[sourceKey];
            if (!mediaId || !credential.flowProjectId) continue;
            byOwner[credential.ownerScopeId] = { mediaId, flowProjectId: credential.flowProjectId };
            changed = true;
          }
          if (Object.keys(byOwner).length) nextBySource[sourceKey] = byOwner;
        }
        if (changed) updateScene(scene.id, { googleFlowMediaIdsBySource: nextBySource });
      }
      await refreshGoogleFlowBindings();
      const failed = result.credentials.filter((credential) => credential.error);
      if (failed.length > 0) {
        toast.warning(t("scenes.syncFlowPartial", {
          synced: result.syncedReferenceCount,
          total: result.sourceCount * result.credentialCount,
          failed: failed.length,
          uploaded: result.uploadedCount,
          skipped: result.skippedCount
        }));
      } else {
        toast.success(t("scenes.syncFlowSuccess", {
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
          accounts: result.credentialCount
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("scenes.syncFlowError"));
    } finally {
      setIsSyncingGoogleFlowReferences(false);
    }
  };
  return {
    generatingSceneIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateSceneImage,
    handleStopGenerateSceneImage,
    handleStopAllGenerateSceneImages,
    handleGenerateAllSceneImages,
    handleUploadSceneImage,
    handleFillSceneImages,
    handleSyncGoogleFlowReferences
  };
}
function SceneGallery({ onSceneSelect, selectedSceneId, onImportCsv, onExportCsv }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const {
    scenes,
    folders,
    currentFolderId,
    addFolder,
    renameFolder,
    deleteFolder,
    setCurrentFolder,
    deleteScene,
    updateScene,
    moveToFolder,
    getFolderById,
    selectScene
  } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeProjectId = useScriptStore((state) => state.activeProjectId);
  const flowBindingProjectId = useProjectStore((state) => state.activeProjectId) || activeProjectId || "default-project";
  const activeProject = useProjectStore((state) => state.activeProject);
  const googleFlowReadyAccountCount = useGoogleFlowRuntimeStore((state) => state.status?.readyCredentialCount || 0);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = reactExports.useState(false);
  const [newFolderName, setNewFolderName] = reactExports.useState("");
  const [renamingFolder, setRenamingFolder] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  const [previewImageUrl, setPreviewImageUrl] = reactExports.useState(null);
  const [previewSceneId, setPreviewSceneId] = reactExports.useState(null);
  const [selectedSceneIds, setSelectedSceneIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [isImportingCsv, setIsImportingCsv] = reactExports.useState(false);
  const csvInputRef = reactExports.useRef(null);
  const imageFillInputRef = reactExports.useRef(null);
  const { scopes: googleFlowSyncScopes, refreshBindings: refreshGoogleFlowBindings } = useGoogleFlowSyncScopes(
    flowBindingProjectId,
    true
  );
  reactExports.useEffect(() => {
    void initializeGoogleFlowRuntime();
  }, [initializeGoogleFlowRuntime]);
  const visibleFolders = reactExports.useMemo(() => {
    if (resourceSharing.shareScenes) return folders;
    if (!activeProjectId) return [];
    return folders.filter((f) => f.projectId === activeProjectId);
  }, [folders, resourceSharing.shareScenes, activeProjectId]);
  const visibleScenes = reactExports.useMemo(() => {
    let items;
    if (resourceSharing.shareScenes) {
      items = scenes;
    } else if (!activeProjectId) {
      items = [];
    } else {
      items = scenes.filter((s) => s.projectId === activeProjectId);
    }
    return items;
  }, [scenes, resourceSharing.shareScenes, activeProjectId]);
  const subFolders = reactExports.useMemo(
    () => visibleFolders.filter((f) => f.parentId === currentFolderId),
    [visibleFolders, currentFolderId]
  );
  const rootScenes = reactExports.useMemo(() => {
    let items = visibleScenes.filter((s) => (s.folderId ?? null) === currentFolderId);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (s) => s.name.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query) || s.scenePrompt?.toLowerCase().includes(query)
      );
    }
    return items;
  }, [visibleScenes, currentFolderId, searchQuery]);
  const toggleSceneSelection = (sceneId, checked) => {
    setSelectedSceneIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(sceneId);
      else next.delete(sceneId);
      return next;
    });
  };
  const sceneImageBatchTargets = reactExports.useMemo(
    () => visibleScenes.filter((scene) => !scene.referenceImage && !!getScenePromptSource(scene)),
    [visibleScenes]
  );
  const sceneFlowSyncById = reactExports.useMemo(() => new Map(
    visibleScenes.map((scene) => [
      scene.id,
      getGoogleFlowSyncProgress(
        [scene.referenceImage, scene.referenceImageBase64],
        scene.googleFlowMediaIdsBySource,
        googleFlowSyncScopes
      )
    ])
  ), [googleFlowSyncScopes, visibleScenes]);
  const missingGoogleFlowMediaCount = reactExports.useMemo(
    () => [...sceneFlowSyncById.values()].reduce((total, progress) => total + progress.missing, 0),
    [sceneFlowSyncById]
  );
  const {
    generatingSceneIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateSceneImage,
    handleStopGenerateSceneImage,
    handleStopAllGenerateSceneImages,
    handleGenerateAllSceneImages,
    handleUploadSceneImage,
    handleFillSceneImages,
    handleSyncGoogleFlowReferences
  } = useSceneImageGeneration({
    visibleScenes,
    sceneImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName: activeProject?.name,
    updateScene,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t
  });
  const currentScenes = reactExports.useMemo(() => {
    return rootScenes.map((scene) => ({ scene, depth: 0 }));
  }, [rootScenes]);
  const breadcrumbPath = reactExports.useMemo(() => {
    const path = [];
    let folderId = currentFolderId;
    while (folderId) {
      const folder = getFolderById(folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId, getFolderById]);
  reactExports.useEffect(() => {
    if (resourceSharing.shareScenes) return;
    const allowedIds = new Set(visibleFolders.map((f) => f.id));
    if (currentFolderId && !allowedIds.has(currentFolderId)) {
      setCurrentFolder(null);
    }
  }, [resourceSharing.shareScenes, visibleFolders, currentFolderId, setCurrentFolder]);
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error(t("scenes.folderName"));
      return;
    }
    const projectId = resourceSharing.shareScenes ? void 0 : activeProjectId || void 0;
    addFolder(newFolderName.trim(), currentFolderId, projectId);
    setNewFolderName("");
    setShowNewFolderDialog(false);
    toast.success(t("scenes.folderCreated"));
  };
  const handleRenameFolder = () => {
    if (!renamingFolder || !renameValue.trim()) return;
    renameFolder(renamingFolder.id, renameValue.trim());
    setRenamingFolder(null);
    setRenameValue("");
    toast.success(t("scenes.folderRenamed"));
  };
  const handleDeleteFolder = (id) => {
    if (confirm("Delete this folder? Scenes inside it will be moved to the parent folder.")) {
      deleteFolder(id);
      toast.success(t("scenes.folderDeleted"));
    }
  };
  const handleDeleteScene = (scene) => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(scene.id);
      if (selectedSceneId === scene.id) {
        onSceneSelect(null);
      }
      toast.success(t("scenes.deleted"));
    }
  };
  const handleSceneClick = (scene) => {
    if (selectedSceneId === scene.id) {
      selectScene(null);
      onSceneSelect(null);
    } else {
      selectScene(scene.id);
      onSceneSelect(scene);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 pb-2 border-b space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm overflow-x-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "h-6 px-2 gap-1",
            onClick: () => setCurrentFolder(null),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-3.5 w-3.5" }),
              t("scenes.libraryTitle")
            ]
          }
        ),
        breadcrumbPath.map((folder) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-6 px-2",
              onClick: () => setCurrentFolder(folder.id),
              children: folder.name
            }
          )
        ] }, folder.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: t("scenes.search"),
                className: "h-8 pl-7 text-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: viewMode === "grid" ? "secondary" : "ghost",
                size: "sm",
                className: "h-8 px-2 rounded-r-none",
                onClick: () => setViewMode("grid"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid2x2, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: viewMode === "list" ? "secondary" : "ghost",
                size: "sm",
                className: "h-8 px-2 rounded-l-none",
                onClick: () => setViewMode("list"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-3.5 w-3.5" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: csvInputRef,
              type: "file",
              accept: ".csv,text/csv",
              className: "hidden",
              onChange: async (event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                setIsImportingCsv(true);
                try {
                  await onImportCsv(file);
                } finally {
                  setIsImportingCsv(false);
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isImportingCsv,
              onClick: () => csvInputRef.current?.click(),
              children: [
                isImportingCsv ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "h-3.5 w-3.5" }),
                t("scenes.importCsv")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: visibleScenes.length === 0,
              onClick: onExportCsv,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-3.5 w-3.5" }),
                t("scenes.exportCsv")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: imageFillInputRef,
              type: "file",
              accept: "image/*",
              multiple: true,
              className: "hidden",
              onChange: (event) => {
                const files = Array.from(event.target.files || []);
                event.currentTarget.value = "";
                if (files.length > 0) void handleFillSceneImages(files);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isFillingImages || visibleScenes.every((scene) => !!scene.referenceImage || !!scene.referenceImageBase64),
              onClick: () => imageFillInputRef.current?.click(),
              children: [
                isFillingImages ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Images, { className: "h-3.5 w-3.5" }),
                t("scenes.fillImages")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isGeneratingAllImages || sceneImageBatchTargets.length === 0,
              onClick: handleGenerateAllSceneImages,
              children: [
                isGeneratingAllImages ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
                isGeneratingAllImages ? t("scenes.generatingAllImages") : t("scenes.generateAllImages", { count: sceneImageBatchTargets.length })
              ]
            }
          ),
          isGeneratingAllImages && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "destructive",
              size: "sm",
              className: "h-8 gap-1",
              onClick: handleStopAllGenerateSceneImages,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }),
                "Dừng tất cả"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isSyncingGoogleFlowReferences || googleFlowReadyAccountCount === 0 || missingGoogleFlowMediaCount === 0,
              onClick: () => void handleSyncGoogleFlowReferences(),
              title: t("scenes.syncFlowTitle"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isSyncingGoogleFlowReferences && "animate-spin") }),
                isSyncingGoogleFlowReferences ? t("scenes.syncingFlow", { count: googleFlowReadyAccountCount }) : t("scenes.syncFlowMissing", { count: missingGoogleFlowMediaCount })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ScrollArea, { className: "flex-1 p-3 pb-32", children: [
      subFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: t("scenes.folders") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
          viewMode === "grid" ? "grid grid-cols-3 gap-2" : "space-y-1"
        ), children: subFolders.map((folder) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          FolderContextMenu,
          {
            folder,
            onRename: () => {
              setRenamingFolder(folder);
              setRenameValue(folder.name);
            },
            onDelete: () => handleDeleteFolder(folder.id),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: cn(
                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                  "hover:bg-accent",
                  viewMode === "grid" && "flex-col text-center"
                ),
                onDoubleClick: () => setCurrentFolder(folder.id),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: cn(
                    "text-yellow-500",
                    viewMode === "grid" ? "h-8 w-8" : "h-4 w-4"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                    "truncate",
                    viewMode === "grid" ? "text-xs w-full" : "text-sm flex-1"
                  ), children: folder.name })
                ]
              }
            )
          },
          folder.id
        )) })
      ] }),
      currentScenes.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: t("scenes.count", { count: rootScenes.length }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
          viewMode === "grid" ? "grid grid-cols-3 gap-2" : "space-y-1"
        ), children: currentScenes.map(({ scene, depth }) => {
          const childCount = 0;
          const isExpanded = false;
          const hasChildren = false;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            SceneContextMenu,
            {
              scene,
              folders: visibleFolders,
              onDelete: () => handleDeleteScene(scene),
              onMove: (folderId) => {
                moveToFolder(scene.id, folderId);
                toast.success(t("scenes.moved"));
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                SceneCard,
                {
                  scene,
                  isSelected: selectedSceneId === scene.id,
                  viewMode,
                  onClick: () => handleSceneClick(scene),
                  depth,
                  childCount,
                  isExpanded,
                  hasChildren,
                  onToggleExpand: void 0,
                  onImagePreview: (url) => {
                    setPreviewImageUrl(url);
                    setPreviewSceneId(scene.id);
                  },
                  selected: selectedSceneIds.has(scene.id),
                  onSelectionChange: (checked) => toggleSceneSelection(scene.id, checked),
                  onDeleteVisible: () => handleDeleteScene(scene),
                  generating: generatingSceneIds.has(scene.id),
                  generationSubmitted: Boolean(generatingStartedAtById[scene.id]),
                  generatingElapsedSeconds: generatingStartedAtById[scene.id] ? Math.max(0, Math.floor((now - generatingStartedAtById[scene.id]) / 1e3)) : 0,
                  onGenerateImage: () => handleGenerateSceneImage(scene),
                  onStopGenerateImage: () => handleStopGenerateSceneImage(scene.id),
                  onUploadImage: (file) => handleUploadSceneImage(scene, file),
                  flowSyncEnabled: true,
                  flowSyncProgress: sceneFlowSyncById.get(scene.id),
                  flowSyncOffline: googleFlowSyncScopes.length === 0
                }
              )
            },
            scene.id
          );
        }) })
      ] }) : subFolders.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-[200px] text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-6 w-6 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: searchQuery ? t("scenes.noMatch") : t("scenes.noScenesYet") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("scenes.useConsole") })
      ] })
    ] }),
    previewImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePreviewModal,
      {
        imageUrl: previewImageUrl,
        isOpen: true,
        onClose: () => {
          setPreviewImageUrl(null);
          setPreviewSceneId(null);
        },
        onImageCleaned: (cleanedUrl) => {
          if (previewSceneId) {
            updateScene(previewSceneId, { referenceImage: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showNewFolderDialog, onOpenChange: setShowNewFolderDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("scenes.createFolder") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: newFolderName,
          onChange: (e) => setNewFolderName(e.target.value),
          placeholder: t("scenes.folderName"),
          onKeyDown: (e) => e.key === "Enter" && handleCreateFolder(),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setShowNewFolderDialog(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateFolder, children: t("overview.add") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!renamingFolder, onOpenChange: (open) => !open && setRenamingFolder(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("scenes.renameFolder") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: renameValue,
          onChange: (e) => setRenameValue(e.target.value),
          placeholder: t("scenes.folderName"),
          onKeyDown: (e) => e.key === "Enter" && handleRenameFolder(),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRenamingFolder(null), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRenameFolder, children: t("characters.save") })
      ] })
    ] }) })
  ] });
}
const ASPECT_RATIO_OPTIONS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
function SceneDetail({ scene }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { updateScene, deleteScene, selectScene } = useSceneStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const [previewImageUrl, setPreviewImageUrl] = reactExports.useState(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = reactExports.useState(false);
  const [regenerationStartedAt, setRegenerationStartedAt] = reactExports.useState(null);
  const now = useNow(isRegeneratingImage);
  const [editForm, setEditForm] = reactExports.useState({
    name: "",
    styleId: projectVisualStyleId,
    aspectRatio: "16:9",
    description: "",
    scenePrompt: ""
  });
  const resolvedImage = useResolvedImageUrl(scene?.referenceImage);
  const regenerationElapsedSeconds = regenerationStartedAt ? Math.max(0, Math.floor((now - regenerationStartedAt) / 1e3)) : 0;
  reactExports.useEffect(() => {
    if (!isRegeneratingImage) setRegenerationStartedAt(null);
  }, [isRegeneratingImage]);
  reactExports.useEffect(() => {
    if (!scene) return;
    setEditForm({
      name: scene.name || "",
      styleId: scene.styleId || projectVisualStyleId,
      aspectRatio: scene.aspectRatio || "16:9",
      description: scene.description || "",
      scenePrompt: scene.scenePrompt || ""
    });
  }, [scene, projectVisualStyleId]);
  const finalImagePromptPreview = reactExports.useMemo(() => {
    if (!scene) return "";
    return buildSceneImagePrompt({
      ...scene,
      name: editForm.name,
      description: editForm.description,
      scenePrompt: editForm.scenePrompt,
      styleId: editForm.styleId
    });
  }, [scene, editForm.name, editForm.description, editForm.scenePrompt, editForm.styleId]);
  if (!scene) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("scenes.detailEmpty") })
    ] });
  }
  const handleDelete = () => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(scene.id);
      selectScene(null);
      toast.success(t("scenes.deleted"));
    }
  };
  const handleExportImage = async () => {
    if (!scene.referenceImage) return;
    try {
      let href = scene.referenceImage;
      if (href.startsWith("local-image://")) {
        const base64 = await readImageAsBase64(href);
        if (!base64) {
          toast.error(t("scenes.readLocalFailed"));
          return;
        }
        href = base64;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = `${scene.name}-concept.png`;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("scenes.exportFailed"));
    }
  };
  const handleSaveAll = () => {
    updateScene(scene.id, {
      name: editForm.name.trim() || scene.name,
      description: editForm.description.trim() || void 0,
      scenePrompt: editForm.scenePrompt.trim() || void 0,
      styleId: editForm.styleId || projectVisualStyleId,
      aspectRatio: editForm.aspectRatio
    });
    toast.success(t("scenes.sceneSettingsUpdated"));
  };
  const handleUploadReferenceImage = async (file) => {
    try {
      const dataUrl = await fileToBase64(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        "scenes",
        `${scene.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${Date.now()}.png`
      );
      updateScene(scene.id, { referenceImage: localPath });
      toast.success(t("scenes.uploadedSceneImage"));
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleRemoveReferenceImage = () => {
    updateScene(scene.id, {
      referenceImage: void 0,
      referenceImageBase64: void 0
    });
    toast.success(t("scenes.removedReferenceImage"));
  };
  const handleRegenerateImage = async () => {
    const prompt = finalImagePromptPreview.trim();
    if (!prompt) {
      toast.error(t("scenes.enterLocation"));
      return;
    }
    setIsRegeneratingImage(true);
    try {
      const result = await generateSceneImage({
        prompt,
        aspectRatio: editForm.aspectRatio,
        styleId: editForm.styleId,
        onSubmitted: (submittedAt) => setRegenerationStartedAt(submittedAt || Date.now())
      });
      const sceneName = (editForm.name || scene.name || "scene").replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      const localPath = await saveImageToLocal(result.imageUrl, "scenes", `${sceneName}_${Date.now()}.png`);
      updateScene(scene.id, {
        name: editForm.name.trim() || scene.name,
        description: editForm.description.trim() || void 0,
        scenePrompt: editForm.scenePrompt.trim() || void 0,
        styleId: editForm.styleId || projectVisualStyleId,
        aspectRatio: editForm.aspectRatio,
        referenceImage: localPath
      });
      const aiFolderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${editForm.name || scene.name || "Untitled"}`,
        type: "image",
        source: "ai-image",
        folderId: aiFolderId,
        projectId: scene.projectId
      });
      toast.success(t("scenes.conceptReady"));
    } catch (error) {
      toast.error(t("scenes.generateImageFailed", { name: scene.name, message: error.message }));
    } finally {
      setIsRegeneratingImage(false);
    }
  };
  const previewAspectRatio = (editForm.aspectRatio || "16:9").replace(":", " / ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm truncate", children: scene.name }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-4 pb-32", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.referenceImage") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg bg-muted overflow-hidden border relative cursor-zoom-in",
            style: { aspectRatio: previewAspectRatio },
            title: t("scenes.previewFullImage"),
            draggable: !!scene.referenceImage,
            onClick: () => {
              if (resolvedImage) setPreviewImageUrl(resolvedImage);
            },
            onDragStart: (e) => {
              if (scene.referenceImage) {
                e.dataTransfer.setData("application/json", JSON.stringify({
                  type: "scene",
                  sceneId: scene.id,
                  sceneName: scene.name,
                  referenceImage: scene.referenceImage
                }));
                e.dataTransfer.effectAllowed = "copy";
              }
            },
            children: [
              scene.referenceImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: resolvedImage || "",
                  alt: scene.name,
                  className: "w-full h-full object-contain"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-12 w-12 text-muted-foreground" }) }),
              scene.referenceImage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 right-2 flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-black/70", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "file",
                      accept: "image/*",
                      className: "hidden",
                      onChange: (event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (file) handleUploadReferenceImage(file);
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-red-600/80",
                    title: t("scenes.removeReferenceImage"),
                    onClick: (event) => {
                      event.stopPropagation();
                      handleRemoveReferenceImage();
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-black/50 text-white rounded p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "h-4 w-4" }) })
              ] }),
              !scene.referenceImage && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "absolute top-2 right-2 bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-black/70", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    className: "hidden",
                    onChange: (event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (file) handleUploadReferenceImage(file);
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground", children: t("scenes.info") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.imageStyle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StylePicker,
              {
                value: editForm.styleId || projectVisualStyleId,
                onChange: (styleId) => setEditForm((prev) => ({ ...prev, styleId }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.imageAspectRatio") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editForm.aspectRatio || "16:9", onValueChange: (value) => setEditForm((prev) => ({ ...prev, aspectRatio: value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ASPECT_RATIO_OPTIONS.map((ratio) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ratio, children: ratio }, ratio)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: editForm.name,
              onChange: (e) => setEditForm((prev) => ({ ...prev, name: e.target.value })),
              className: "h-8 text-xs",
              placeholder: t("scenes.namePlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editForm.description,
              onChange: (e) => setEditForm((prev) => ({ ...prev, description: e.target.value })),
              placeholder: t("scenes.descriptionPlaceholder"),
              className: "text-xs min-h-[80px]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.scenePrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editForm.scenePrompt,
              onChange: (e) => setEditForm((prev) => ({ ...prev, scenePrompt: e.target.value })),
              placeholder: t("scenes.scenePromptPlaceholder"),
              className: "text-xs min-h-[100px]"
            }
          )
        ] }),
        finalImagePromptPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 rounded-lg border bg-muted/30 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("scenes.finalImagePrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap", children: finalImagePromptPreview })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", size: "sm", onClick: handleSaveAll, children: t("scenes.saveSceneSettings") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "w-full justify-start",
            size: "sm",
            disabled: isRegeneratingImage,
            onClick: handleRegenerateImage,
            children: [
              isRegeneratingImage && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              isRegeneratingImage ? regenerationStartedAt ? `Đang tạo ${regenerationElapsedSeconds}s` : "Đang chờ" : scene.referenceImage ? t("scenes.regenerateConcept") : t("scenes.generateConcept")
            ]
          }
        ),
        scene.referenceImage && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "w-full justify-start",
            size: "sm",
            onClick: handleExportImage,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
              t("scenes.exportConcept")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "w-full justify-start text-destructive hover:text-destructive",
            size: "sm",
            onClick: handleDelete,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
              t("scenes.deleteScene")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "💡 ",
          t("scenes.tipDrag")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "💡 ",
          t("scenes.tipConsistency")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePreviewModal,
      {
        imageUrl: previewImageUrl || "",
        isOpen: !!previewImageUrl,
        onClose: () => setPreviewImageUrl(null),
        onImageCleaned: (cleanedUrl) => {
          if (scene) {
            updateScene(scene.id, { referenceImage: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }
      }
    )
  ] });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
function ScenesView() {
  const { t } = useI18n();
  const { scenes, selectedSceneId, selectScene, addScene, updateScene: updateLibraryScene } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeScriptProjectId = useScriptStore((state) => state.activeProjectId);
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const updateScriptScene = useScriptStore((state) => state.updateScene);
  const setMappings = useScriptStore((state) => state.setMappings);
  const visibleScenes = reactExports.useMemo(() => {
    if (resourceSharing.shareScenes) return scenes;
    if (!activeScriptProjectId) return [];
    return scenes.filter((s) => s.projectId === activeScriptProjectId);
  }, [scenes, resourceSharing.shareScenes, activeScriptProjectId]);
  const selectedScene = reactExports.useMemo(
    () => visibleScenes.find((s) => s.id === selectedSceneId) || null,
    [visibleScenes, selectedSceneId]
  );
  const handleSceneSelect = (scene) => {
    selectScene(scene?.id || null);
  };
  const handleImportCsv = async (file) => {
    if (!activeScriptProjectId) {
      toast.error(t("scenes.csvNeedsProject"));
      return;
    }
    try {
      const summary = await importSceneCsv(file, activeScriptProjectId, projectVisualStyleId);
      if (summary.selectedLibraryId) {
        selectScene(summary.selectedLibraryId);
      }
      toast.success(t("scenes.csvImported", {
        created: summary.created,
        updated: summary.updated,
        unchanged: summary.unchanged,
        skipped: summary.skipped
      }));
    } catch (error) {
      toast.error(t("scenes.csvImportFailed", {
        message: error instanceof Error ? error.message : String(error)
      }));
    }
  };
  const handleExportCsv = () => {
    const csv = serializeSceneLibraryCsv(visibleScenes);
    downloadLibraryCsv(csv, `scenes-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
    toast.success(t("scenes.csvExported", { count: visibleScenes.length }));
  };
  reactExports.useEffect(() => {
    if (!activeScriptProjectId || !scriptProject?.scriptData?.scenes?.length) return;
    scriptProject.scriptData.scenes.forEach((scriptScene) => {
      const linkedEpisodeId = scriptProject.scriptData?.episodes.find(
        (episode) => episode.sceneIds.includes(scriptScene.id)
      )?.id;
      const latestScenes = useSceneStore.getState().scenes;
      const mappedSceneId = scriptScene.sceneLibraryId || scriptProject.sceneIdMap[scriptScene.id];
      let master = mappedSceneId ? latestScenes.find((scene) => scene.id === mappedSceneId) : void 0;
      if (!master) {
        master = latestScenes.find(
          (scene) => scene.projectId === activeScriptProjectId && scene.sourceScriptSceneId === scriptScene.id
        );
      }
      if (!master) {
        const sceneName = (scriptScene.name || "").trim().toLocaleLowerCase();
        const nameMatches = latestScenes.filter(
          (scene) => scene.projectId === activeScriptProjectId && scene.name.trim().toLocaleLowerCase() === sceneName
        );
        if (nameMatches.length === 1) master = nameMatches[0];
      }
      if (!master) {
        const masterId = addScene({
          name: scriptScene.name || t("scenes.untitled"),
          description: scriptScene.description || scriptScene.notes,
          time: "day",
          atmosphere: "neutral",
          aspectRatio: "16:9",
          projectId: activeScriptProjectId,
          scenePrompt: scriptScene.scenePrompt,
          styleId: projectVisualStyleId,
          status: "linked",
          linkedEpisodeId,
          sourceScriptSceneId: scriptScene.id
        });
        master = useSceneStore.getState().scenes.find((scene) => scene.id === masterId);
        updateScriptScene(activeScriptProjectId, scriptScene.id, { sceneLibraryId: masterId });
      } else if (scriptScene.sceneLibraryId !== master.id) {
        updateScriptScene(activeScriptProjectId, scriptScene.id, { sceneLibraryId: master.id });
      }
      if (master) {
        const libraryUpdates = {};
        if (!master.description?.trim() && scriptScene.description?.trim()) {
          libraryUpdates.description = scriptScene.description;
        }
        if (!master.scenePrompt && scriptScene.scenePrompt) {
          libraryUpdates.scenePrompt = scriptScene.scenePrompt;
        }
        if (!master.linkedEpisodeId && linkedEpisodeId) {
          libraryUpdates.linkedEpisodeId = linkedEpisodeId;
        }
        if (Object.keys(libraryUpdates).length > 0) {
          updateLibraryScene(master.id, libraryUpdates);
        }
        const scriptUpdates = {};
        if (!scriptScene.description?.trim() && master.description?.trim()) {
          scriptUpdates.description = master.description;
        }
        if (!scriptScene.scenePrompt?.trim() && master.scenePrompt?.trim()) {
          scriptUpdates.scenePrompt = master.scenePrompt;
        }
        if (Object.keys(scriptUpdates).length > 0) {
          updateScriptScene(activeScriptProjectId, scriptScene.id, scriptUpdates);
        }
        const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.sceneIdMap || {};
        if (latestMap[scriptScene.id] !== master.id) {
          setMappings(activeScriptProjectId, {
            sceneIdMap: { ...latestMap, [scriptScene.id]: master.id }
          });
        }
      }
    });
  }, [activeScriptProjectId, scriptProject, projectVisualStyleId, addScene, updateScriptScene, updateLibraryScene, setMappings, t]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 25, minSize: 20, maxSize: 35, className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      GenerationPanel,
      {
        selectedScene,
        onSceneCreated: (id) => selectScene(id)
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, { withHandle: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 45, minSize: 30, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      SceneGallery,
      {
        onSceneSelect: handleSceneSelect,
        selectedSceneId,
        onImportCsv: handleImportCsv,
        onExportCsv: handleExportCsv
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, { withHandle: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 30, minSize: 20, maxSize: 40, className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SceneDetail, { scene: selectedScene }) })
  ] }) });
}
export {
  ScenesView
};
