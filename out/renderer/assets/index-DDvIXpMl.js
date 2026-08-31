import { j as jsxRuntimeExports } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports, X, bx as ImagePlus, L as LoaderCircle, by as FileImage, bu as User, bl as Upload, b3 as Volume2, aS as Square, d as Trash2, P as Pencil, bz as FolderInput, H as House, aM as Folder, a0 as ChevronRight, z as Search, bA as Grid2x2, bB as List, bC as FileUp, bD as FileDown, bE as Images, bd as Sparkles, q as RefreshCw, al as GripVertical, aP as Image } from "./lucide-react-Cs1Usobv.js";
import { c as useProjectVisualStyleId, h as useCharacterLibraryStore, k as useMediaStore, C as getStyleById, z as saveImageToLocal, q as getFeatureConfig, H as syncRuntimeLaneSettings, I as resolveLaneCount, A as getFeatureNotConfiguredMessage, L as runLaneQueue, J as buildLaneWorkers, j as useScriptStore, u as useActiveScriptProject } from "./autopilot-store-4Sgwsp2L.js";
import { a as useI18n, B as Button, I as Input, t as toast, c as cn, b as useVideoStudioSettingsStore, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogFooter } from "./index-B8Pnvlyd.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-CVkLDVOZ.js";
import { u as useNow } from "./use-now-CsYsJsN6.js";
import { a as useProjectStore } from "./auto-video-store-BurpJGpg.js";
import { u as useMediaPanelStore, C as Checkbox } from "./entry-BWjcO7w7.js";
import { T as Textarea } from "./textarea-P4k3OFxA.js";
import { L as Label } from "./label-C6uhtku6.js";
import { S as ScrollArea } from "./dropdown-menu-obd7d5u9.js";
import { S as StylePicker } from "./index-CwjN6JuF.js";
import { L as LocalImage } from "./local-image-B0xN60cV.js";
import { u as useGoogleFlowRuntimeStore } from "./google-flow-runtime-store-DqAjge8w.js";
import { I as ImagePreviewModal } from "./media-preview-modal-vV-1uxAW.js";
import { s as syncGoogleFlowReferenceSources, m as matchImageFilesByName, i as isSupportedImageFile, u as useGoogleFlowSyncScopes, g as getGoogleFlowSyncProgress, a as serializeCharacterLibraryCsv, d as downloadLibraryCsv, b as importCharacterCsv } from "./library-csv-import-EQOfTidF.js";
import "./model-registry-CChP-jS9.js";
import { T as TaskInfoButton } from "./task-info-button-BwQTF1-v.js";
import { C as ContextMenu, a as ContextMenuTrigger, b as ContextMenuContent, c as ContextMenuItem, d as ContextMenuSeparator, e as ContextMenuSub, f as ContextMenuSubTrigger, g as ContextMenuSubContent } from "./context-menu-BtpzVcFz.js";
import { a as generateCharacterImage, g as getSourceFingerprint } from "./source-fingerprint-B6rjsbyn.js";
import { S as Separator } from "./separator-6XFrhqNh.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dpmre5UT.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DqfYAuvg.js";
import "./cors-fetch-CkwbEcad.js";
import "./progress-C4y9txuJ.js";
import "./popover-BBVZUjTG.js";
import "./FeatureHeaderIcon-BtUg61kJ.js";
const ASPECT_RATIO_OPTIONS$1 = ["1:1", "3:4", "4:3", "9:16", "16:9"];
function GenerationPanel({ selectedCharacter, onCharacterCreated }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const {
    addCharacter,
    updateCharacter: updateLibraryCharacter,
    selectCharacter,
    generationStatus,
    currentFolderId
  } = useCharacterLibraryStore();
  const { activeProjectId } = useProjectStore();
  const { pendingCharacterData, setPendingCharacterData } = useMediaPanelStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const [name, setName] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [characterPrompt, setCharacterPrompt] = reactExports.useState("");
  const [aspectRatio, setAspectRatio] = reactExports.useState("16:9");
  const [sourceEpisodeId, setSourceEpisodeId] = reactExports.useState();
  const [referenceImages, setReferenceImages] = reactExports.useState([]);
  const [styleId, setStyleId] = reactExports.useState(projectVisualStyleId);
  const [previewUrl, setPreviewUrl] = reactExports.useState(null);
  const [previewCharacterId, setPreviewCharacterId] = reactExports.useState(null);
  const [generationStartedAt, setGenerationStartedAt] = reactExports.useState(null);
  const isGenerating = generationStatus === "generating";
  const now = useNow(isGenerating);
  const elapsedSeconds = generationStartedAt ? Math.max(0, Math.floor((now - generationStartedAt) / 1e3)) : 0;
  reactExports.useEffect(() => {
    if (!isGenerating) {
      setGenerationStartedAt(null);
      return;
    }
    setGenerationStartedAt((current) => current ?? Date.now());
  }, [isGenerating]);
  const finalImagePromptPreview = reactExports.useMemo(() => {
    if (!name.trim() && !characterPrompt.trim()) return "";
    return buildCharacterImagePrompt(name || t("characters.name"), styleId, characterPrompt);
  }, [name, styleId, characterPrompt, t]);
  reactExports.useEffect(() => {
    if (!selectedCharacter) return;
    setName(selectedCharacter.name || "");
    setDescription(selectedCharacter.description || "");
    setCharacterPrompt(selectedCharacter.characterPrompt || "");
    setAspectRatio(selectedCharacter.aspectRatio || "1:1");
    setReferenceImages(selectedCharacter.referenceImages || []);
    setSourceEpisodeId(selectedCharacter.linkedEpisodeId);
    const validStyle = selectedCharacter.styleId ? getStyleById(selectedCharacter.styleId) : null;
    setStyleId(validStyle?.id || projectVisualStyleId);
  }, [selectedCharacter, projectVisualStyleId]);
  reactExports.useEffect(() => {
    if (!selectedCharacter && !pendingCharacterData) {
      setStyleId(projectVisualStyleId);
    }
  }, [projectVisualStyleId, selectedCharacter, pendingCharacterData]);
  reactExports.useEffect(() => {
    if (pendingCharacterData) {
      setName(pendingCharacterData.name || "");
      setDescription(pendingCharacterData.description || "");
      setCharacterPrompt(pendingCharacterData.characterPrompt || "");
      setSourceEpisodeId(pendingCharacterData.sourceEpisodeId);
      setStyleId(projectVisualStyleId);
      setPendingCharacterData(null);
    }
  }, [pendingCharacterData, setPendingCharacterData, projectVisualStyleId]);
  const handleImageChange = async (e) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [];
    for (const file of Array.from(files)) {
      if (referenceImages.length + newImages.length >= 3) break;
      try {
        const base64 = await fileToBase64$1(file);
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
  const removeImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };
  const handleCreateRecord = async () => {
    if (!name.trim()) {
      toast.error(t("characters.enterName"));
      return;
    }
    if (!characterPrompt.trim()) {
      toast.error(t("characters.enterDescription"));
      return;
    }
    const persistedReferenceImages = await Promise.all(
      referenceImages.slice(0, 3).map(async (image, index) => {
        if (!image || image.startsWith("local-image://")) return image;
        return saveImageToLocal(image, "characters", `${name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_ref_${index + 1}.png`);
      })
    );
    if (selectedCharacter) {
      updateLibraryCharacter(selectedCharacter.id, {
        name: name.trim(),
        description: description.trim() || void 0,
        characterPrompt: characterPrompt.trim(),
        aspectRatio,
        referenceImages: persistedReferenceImages.filter(Boolean).length > 0 ? persistedReferenceImages.filter(Boolean) : void 0,
        styleId: styleId === "random" ? void 0 : styleId
      });
      toast.success(t("characters.settingsUpdated"));
      return;
    }
    const targetId = addCharacter({
      name: name.trim(),
      description: description.trim() || void 0,
      characterPrompt: characterPrompt.trim(),
      aspectRatio,
      referenceImages: persistedReferenceImages.filter(Boolean).length > 0 ? persistedReferenceImages.filter(Boolean) : void 0,
      styleId: styleId === "random" ? void 0 : styleId,
      folderId: currentFolderId,
      projectId: activeProjectId || void 0,
      // === Episode scope ===
      linkedEpisodeId: sourceEpisodeId
    });
    selectCharacter(targetId);
    onCharacterCreated?.(targetId);
    toast.success(t("apiDialog.added", { name: name.trim() }));
  };
  const handleSavePreview = async () => {
    if (!previewUrl || !previewCharacterId) return;
    toast.loading(t("characters.imageSaving"), { id: "saving-preview" });
    try {
      const localPath = await saveImageToLocal(
        previewUrl,
        "characters",
        `${name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.png`
      );
      updateLibraryCharacter(previewCharacterId, {
        thumbnailUrl: localPath
      });
      const aiFolderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `Character-${name || "Untitled"}`,
        type: "image",
        source: "ai-image",
        folderId: aiFolderId,
        projectId: activeProjectId || void 0
      });
      setPreviewUrl(null);
      setPreviewCharacterId(null);
      delete window.__maxStudioPreviewMeta;
      toast.success(t("characters.savedLocal"), { id: "saving-preview" });
    } catch (error) {
      console.error("Failed to save preview:", error);
      toast.error(t("characters.saveFailed"), { id: "saving-preview" });
    }
  };
  const handleDiscardPreview = () => {
    setPreviewUrl(null);
    setPreviewCharacterId(null);
  };
  if (previewUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 border-b shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm", children: t("characters.previewImage") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 space-y-4 pb-40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg overflow-hidden border-2 border-amber-500/50 bg-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LocalImage,
          {
            src: previewUrl,
            alt: t("characters.previewImage"),
            className: "w-full h-auto"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded", children: t("characters.previewBadge") })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 border-t space-y-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSavePreview, className: "w-full", children: t("characters.saveImage") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateRecord, variant: "outline", className: "w-full", disabled: isGenerating, children: t("characters.regenerateImage") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleDiscardPreview, variant: "ghost", className: "w-full text-muted-foreground", size: "sm", children: t("characters.discardBack") })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 border-b shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm", children: t("characters.console") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-4 pb-40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: t("characters.namePlaceholder"),
              disabled: isGenerating
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.aspectRatio") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: aspectRatio,
              onChange: (event) => setAspectRatio(event.target.value),
              disabled: isGenerating,
              className: "h-9 w-full rounded-lg border border-input bg-accent/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50",
              children: ASPECT_RATIO_OPTIONS$1.map((ratio) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ratio, children: ratio }, ratio))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.description") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: t("characters.descriptionPlaceholder"),
            className: "min-h-[70px] text-sm resize-none",
            disabled: isGenerating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.characterPrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: characterPrompt,
            onChange: (e) => setCharacterPrompt(e.target.value),
            placeholder: t("characters.shortDescriptionPlaceholder"),
            className: "min-h-[80px] text-sm resize-none",
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
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.referenceImages") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            referenceImages.length,
            "/3"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          referenceImages.map((img, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LocalImage,
              {
                src: img,
                alt: t("characters.referenceAlt", { index: i + 1 }),
                className: "w-14 h-14 object-cover rounded-lg border"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => removeImage(i),
                className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
              }
            )
          ] }, i)),
          referenceImages.length < 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "gen-panel-ref-image",
                type: "file",
                accept: "image/*",
                multiple: true,
                className: "hidden",
                onChange: handleImageChange
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "w-14 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors gap-1 cursor-pointer",
                onClick: () => document.getElementById("gen-panel-ref-image")?.click(),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs", children: t("director.card.upload") })
                ]
              }
            )
          ] })
        ] })
      ] }),
      finalImagePromptPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border bg-muted/30 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("characters.finalImagePrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap", children: finalImagePromptPreview })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 pb-4 space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleCreateRecord,
          className: "w-full",
          disabled: isGenerating || !name.trim() || !characterPrompt.trim(),
          children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
            "Đang tạo ",
            elapsedSeconds,
            "s"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileImage, { className: "h-4 w-4 mr-2" }),
            selectedCharacter ? t("characters.saveCharacterSettings") : t("characters.create")
          ] })
        }
      ) })
    ] }) })
  ] });
}
function fileToBase64$1(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
function buildCharacterImagePrompt(name, styleId, characterPrompt) {
  const stylePreset = styleId && styleId !== "random" ? getStyleById(styleId) : null;
  const styleTokens = stylePreset?.prompt || "";
  return [
    characterPrompt?.trim() || name,
    styleTokens,
    "single character portrait",
    "no text, no watermark"
  ].filter(Boolean).join(", ");
}
function CharacterCard({
  char,
  viewMode,
  isSelected,
  isChecked,
  generating,
  submitted,
  generatingElapsedSeconds,
  flowSyncProgress,
  flowSyncOffline,
  projectVisualStyleId,
  onOpen,
  onToggleSelection,
  onPreview,
  onUploadImage,
  onGenerateImage,
  onStopGenerate,
  onDelete,
  t
}) {
  const hasImage = !!char.thumbnailUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "rounded-lg border cursor-pointer transition-all",
        "hover:border-foreground/30",
        isSelected && "border-primary ring-1 ring-primary",
        viewMode === "grid" ? "p-2" : "p-2 flex items-center gap-3"
      ),
      onClick: onOpen,
      children: viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex justify-end", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: isChecked,
            onCheckedChange: (checked) => onToggleSelection(checked === true)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "aspect-square rounded bg-muted flex items-center justify-center overflow-hidden mb-2 cursor-zoom-in relative",
            title: t("characters.doubleClickPreview"),
            onClick: (e) => {
              e.stopPropagation();
              if (char.thumbnailUrl) onPreview(char.thumbnailUrl);
            },
            children: [
              generating ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: submitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ" })
              ] }) : char.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                LocalImage,
                {
                  src: char.thumbnailUrl,
                  alt: char.name,
                  className: "w-full h-full object-contain"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-8 w-8 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 right-1 flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TaskInfoButton,
                  {
                    outputUrl: char.thumbnailUrl,
                    prompt: buildCharacterImagePrompt(char.name, char.styleId || projectVisualStyleId, char.characterPrompt || char.name),
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
                        if (file) onUploadImage(file);
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: char.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("px-2 py-0.5 rounded text-2xs", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"), children: hasImage ? t("characters.imageReady") : t("characters.noImageYet") })
          ] }),
          flowSyncProgress && flowSyncProgress.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
            "inline-flex px-2 py-0.5 rounded text-2xs",
            flowSyncProgress.missing === 0 ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
          ), children: t("characters.syncFlowProgress", { synced: flowSyncProgress.synced, total: flowSyncProgress.total }) }),
          flowSyncOffline && (char.thumbnailUrl || (char.referenceImages || []).length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex px-2 py-0.5 rounded text-2xs bg-muted text-muted-foreground", children: t("characters.syncFlowOffline") }),
          char.voiceId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-2xs text-blue-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: char.voiceId })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: hasImage ? t("characters.imageReady") : t("characters.generateImageHint") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            hasImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs flex-1", onClick: (e) => {
              e.stopPropagation();
              onOpen();
            }, children: t("characters.openDetails") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-7 text-xs flex-1", disabled: generating, onClick: (e) => {
              e.stopPropagation();
              onGenerateImage();
            }, children: [
              generating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin mr-1" }) : null,
              generating ? submitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ" : t("characters.generateImage")
            ] }),
            generating && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-7 w-7 p-0", onClick: (e) => {
              e.stopPropagation();
              onStopGenerate();
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0 text-destructive hover:text-destructive", onClick: (e) => {
              e.stopPropagation();
              onDelete();
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: isChecked,
            onCheckedChange: (checked) => onToggleSelection(checked === true)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0", children: generating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 text-muted-foreground animate-spin" }) : char.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          LocalImage,
          {
            src: char.thumbnailUrl,
            alt: char.name,
            className: "w-full h-full object-cover"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: char.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("px-2 py-0.5 rounded text-2xs", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"), children: hasImage ? t("characters.imageReady") : t("characters.noImageYet") }),
            flowSyncProgress && flowSyncProgress.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
              "px-2 py-0.5 rounded text-2xs shrink-0",
              flowSyncProgress.missing === 0 ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
            ), children: t("characters.syncFlowProgress", { synced: flowSyncProgress.synced, total: flowSyncProgress.total }) }),
            flowSyncOffline && (char.thumbnailUrl || (char.referenceImages || []).length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded text-2xs shrink-0 bg-muted text-muted-foreground", children: t("characters.syncFlowOffline") }),
            char.voiceId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-0.5 text-2xs text-blue-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3 w-3" }),
              char.voiceId
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: char.description || char.characterPrompt || t("characters.noDescription") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TaskInfoButton,
          {
            outputUrl: char.thumbnailUrl,
            prompt: buildCharacterImagePrompt(char.name, char.styleId || projectVisualStyleId, char.characterPrompt || char.name),
            kind: "image",
            title: t("taskInfo.image")
          }
        ),
        hasImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", onClick: (e) => {
          e.stopPropagation();
          onOpen();
        }, children: t("characters.openDetails") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-7 text-xs", disabled: generating, onClick: (e) => {
          e.stopPropagation();
          onGenerateImage();
        }, children: [
          generating && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin mr-1" }),
          generating ? submitted ? `Đang tạo ${generatingElapsedSeconds}s` : "Đang chờ" : t("characters.generateImage")
        ] }),
        generating && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-7 w-7 p-0", onClick: (e) => {
          e.stopPropagation();
          onStopGenerate();
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0 text-destructive hover:text-destructive", onClick: (e) => {
          e.stopPropagation();
          onDelete();
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] })
    }
  );
}
function FolderContextMenu({
  folder: _folder,
  children,
  onRename,
  onDelete
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: onRename, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 mr-2" }),
        "Rename"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { className: "text-destructive", onClick: onDelete, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
        "Delete folder"
      ] })
    ] })
  ] });
}
function CharacterContextMenu({
  character: _character,
  children,
  folders,
  onDelete,
  onMove
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSub, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderInput, { className: "h-4 w-4 mr-2" }),
          "Move to"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onMove(null), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4 mr-2" }),
            "Root"
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
        "Delete character"
      ] })
    ] })
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
async function getImageGenerationLaneConfig() {
  const featureConfig = getFeatureConfig("character_generation");
  await syncRuntimeLaneSettings();
  const laneCount = await resolveLaneCount("image", featureConfig?.platform);
  return { laneCount };
}
function useCharacterImageGeneration(deps) {
  const {
    visibleCharacters,
    characterImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName,
    updateCharacter,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t
  } = deps;
  const [generatingIds, setGeneratingIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [generatingStartedAtById, setGeneratingStartedAtById] = reactExports.useState({});
  const [isGeneratingAllImages, setIsGeneratingAllImages] = reactExports.useState(false);
  const [isFillingImages, setIsFillingImages] = reactExports.useState(false);
  const [isSyncingGoogleFlowReferences, setIsSyncingGoogleFlowReferences] = reactExports.useState(false);
  const now = useNow(generatingIds.size > 0);
  const activeGenerationControllersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const batchGenerationRunRef = reactExports.useRef(0);
  const generateOneImage = reactExports.useCallback(async (char) => {
    const controller = new AbortController();
    activeGenerationControllersRef.current.set(char.id, controller);
    setGeneratingIds((prev) => new Set(prev).add(char.id));
    try {
      const charStyle = char.styleId || projectVisualStyleId;
      const basePrompt = buildCharacterImagePrompt(
        char.name,
        charStyle,
        char.characterPrompt || char.name
      );
      const result = await generateCharacterImage({
        prompt: basePrompt,
        negativePrompt: "blurry, low quality, watermark, text, cropped",
        aspectRatio: "1:1",
        referenceImages: char.referenceImages?.filter(Boolean) ?? [],
        styleId: charStyle,
        onSubmitted: (submittedAt) => {
          setGeneratingStartedAtById((prev) => prev[char.id] ? prev : { ...prev, [char.id]: submittedAt || Date.now() });
        },
        signal: controller.signal
      });
      const localPath = await saveImageToLocal(
        result.imageUrl,
        "characters",
        `${char.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.png`
      );
      updateCharacter(char.id, { thumbnailUrl: localPath });
      if (result.mediaId && result.ownerScopeId && result.flowProjectId) {
        const storedMedia = { mediaId: result.mediaId, flowProjectId: result.flowProjectId };
        const localSourceKey = getSourceFingerprint(localPath);
        const remoteSourceKey = getSourceFingerprint(result.imageUrl);
        updateCharacter(char.id, {
          googleFlowMediaIdsBySource: {
            ...char.googleFlowMediaIdsBySource || {},
            [localSourceKey]: { ...(char.googleFlowMediaIdsBySource || {})[localSourceKey] || {}, [result.ownerScopeId]: storedMedia },
            [remoteSourceKey]: { ...(char.googleFlowMediaIdsBySource || {})[remoteSourceKey] || {}, [result.ownerScopeId]: storedMedia }
          }
        });
      }
      const folderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `${char.name} - Character`,
        type: "image",
        source: "ai-image",
        folderId,
        projectId: activeProjectId || void 0
      });
      toast.success(t("characters.generatedImage", { name: char.name }));
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t("characters.generateImageFailed", { name: char.name, message: msg }));
    } finally {
      activeGenerationControllersRef.current.delete(char.id);
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(char.id);
        return next;
      });
      setGeneratingStartedAtById((prev) => {
        if (!prev[char.id]) return prev;
        const next = { ...prev };
        delete next[char.id];
        return next;
      });
    }
  }, [updateCharacter, getOrCreateCategoryFolder, addMediaFromUrl, activeProjectId, projectVisualStyleId, t]);
  const handleStopGenerateImage = reactExports.useCallback((characterId) => {
    activeGenerationControllersRef.current.get(characterId)?.abort();
    activeGenerationControllersRef.current.delete(characterId);
    setGeneratingIds((prev) => {
      const next = new Set(prev);
      next.delete(characterId);
      return next;
    });
    setGeneratingStartedAtById((prev) => {
      if (!prev[characterId]) return prev;
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
    toast.info("Đã dừng tạo ảnh nhân vật");
  }, []);
  const handleGenerateImage = reactExports.useCallback((char) => {
    void generateOneImage(char);
  }, [generateOneImage]);
  const handleGenerateAllImages = reactExports.useCallback(async () => {
    const targets = characterImageBatchTargets.filter(
      (character) => !activeGenerationControllersRef.current.has(character.id)
    );
    if (targets.length === 0) return;
    const featureConfig = getFeatureConfig("character_generation");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("character_generation"));
      return;
    }
    const runId = ++batchGenerationRunRef.current;
    setIsGeneratingAllImages(true);
    try {
      const { laneCount } = await getImageGenerationLaneConfig();
      await runLaneQueue(
        targets.map((character) => ({ item: character })),
        buildLaneWorkers([], laneCount),
        async ({ item: character }) => {
          if (batchGenerationRunRef.current !== runId) return;
          try {
            await generateOneImage(character);
          } catch (error) {
            if (!(error instanceof Error && error.message === "Cancelled by user")) {
              console.error(`[CharacterGallery] Batch: character ${character.id} image generation failed:`, error);
            }
          }
        },
        void 0
      );
    } finally {
      if (batchGenerationRunRef.current === runId) {
        setIsGeneratingAllImages(false);
      }
    }
  }, [characterImageBatchTargets, generateOneImage]);
  const handleStopAllGenerateImages = reactExports.useCallback(() => {
    batchGenerationRunRef.current += 1;
    activeGenerationControllersRef.current.forEach((controller) => controller.abort());
    activeGenerationControllersRef.current.clear();
    setGeneratingIds(/* @__PURE__ */ new Set());
    setGeneratingStartedAtById({});
    setIsGeneratingAllImages(false);
  }, []);
  const handleUploadCharacterImage = reactExports.useCallback(async (char, file) => {
    try {
      const dataUrl = await fileToBase64(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        "characters",
        `${char.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${Date.now()}.png`
      );
      updateCharacter(char.id, { thumbnailUrl: localPath });
      toast.success(`Uploaded reference image for ${char.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [updateCharacter]);
  const handleFillCharacterImages = async (files) => {
    const targets = visibleCharacters.filter(
      (character) => !character.thumbnailUrl
    );
    const result = matchImageFilesByName(
      files.filter(isSupportedImageFile),
      targets,
      (character) => character.id,
      (character) => character.name
    );
    let filled = 0;
    let failed = 0;
    setIsFillingImages(true);
    try {
      for (let index = 0; index < result.matches.length; index++) {
        const { file, item: character } = result.matches[index];
        try {
          const dataUrl = await fileToBase64(file);
          const localPath = await saveImageToLocal(
            dataUrl,
            "characters",
            `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${Date.now()}_${index}.png`
          );
          updateCharacter(character.id, { thumbnailUrl: localPath });
          filled += 1;
        } catch {
          failed += 1;
        }
      }
    } finally {
      setIsFillingImages(false);
    }
    toast.success(t("characters.imagesFilled", {
      filled,
      skipped: result.unmatched + result.ambiguous + failed
    }));
  };
  const handleSyncGoogleFlowReferences = reactExports.useCallback(async () => {
    if (isSyncingGoogleFlowReferences) return;
    const sources = visibleCharacters.flatMap((character) => [
      character.thumbnailUrl,
      ...character.referenceImages || []
    ].filter((source) => !!source).map((source) => ({
      source,
      mediaIdsByOwnerScope: character.googleFlowMediaIdsBySource?.[getSourceFingerprint(source)]
    })));
    setIsSyncingGoogleFlowReferences(true);
    try {
      const result = await syncGoogleFlowReferenceSources(flowBindingProjectId, sources, activeProjectName);
      for (const character of visibleCharacters) {
        const nextBySource = { ...character.googleFlowMediaIdsBySource || {} };
        let changed = false;
        for (const source of [character.thumbnailUrl, ...character.referenceImages || []].filter((value) => !!value)) {
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
        if (changed) updateCharacter(character.id, { googleFlowMediaIdsBySource: nextBySource });
      }
      await refreshGoogleFlowBindings();
      const failed = result.credentials.filter((credential) => credential.error);
      if (failed.length > 0) {
        toast.warning(t("characters.syncFlowPartial", {
          synced: result.syncedReferenceCount,
          total: result.sourceCount * result.credentialCount,
          failed: failed.length,
          uploaded: result.uploadedCount,
          skipped: result.skippedCount
        }));
      } else {
        toast.success(t("characters.syncFlowSuccess", {
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
          accounts: result.credentialCount
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("characters.syncFlowError"));
    } finally {
      setIsSyncingGoogleFlowReferences(false);
    }
  }, [activeProjectName, flowBindingProjectId, isSyncingGoogleFlowReferences, refreshGoogleFlowBindings, t, updateCharacter, visibleCharacters]);
  return {
    generatingIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateImage,
    handleStopGenerateImage,
    handleGenerateAllImages,
    handleStopAllGenerateImages,
    handleUploadCharacterImage,
    handleFillCharacterImages,
    handleSyncGoogleFlowReferences
  };
}
function CharacterGallery({ onCharacterSelect, selectedCharacterId, onImportCsv, onExportCsv }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const {
    characters,
    folders,
    currentFolderId,
    addFolder,
    renameFolder,
    deleteFolder,
    setCurrentFolder,
    deleteCharacter,
    updateCharacter,
    moveToFolder,
    getFolderById,
    selectCharacter
  } = useCharacterLibraryStore();
  const { getOrCreateCategoryFolder, addMediaFromUrl } = useMediaStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeProjectId = useScriptStore((state) => state.activeProjectId);
  const flowBindingProjectId = useProjectStore((state) => state.activeProjectId) || activeProjectId || "default-project";
  const activeProject = useProjectStore((state) => state.activeProject);
  const googleFlowReadyAccountCount = useGoogleFlowRuntimeStore((state) => state.status?.readyCredentialCount || 0);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const { activeEpisodeIndex } = useMediaPanelStore();
  const scriptProject = useActiveScriptProject();
  const { scopes: googleFlowSyncScopes, refreshBindings: refreshGoogleFlowBindings } = useGoogleFlowSyncScopes(
    flowBindingProjectId,
    true
  );
  const hasEpisodeScope = activeEpisodeIndex != null;
  const activeEpisodeId = hasEpisodeScope ? scriptProject?.scriptData?.episodes.find((ep) => ep.index === activeEpisodeIndex)?.id : void 0;
  const [episodeViewScope, setEpisodeViewScope] = reactExports.useState("episode");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = reactExports.useState(false);
  const [newFolderName, setNewFolderName] = reactExports.useState("");
  const [renamingFolder, setRenamingFolder] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  const [previewImageUrl, setPreviewImageUrl] = reactExports.useState(null);
  const [previewCharacterId, setPreviewCharacterId] = reactExports.useState(null);
  const [isImportingCsv, setIsImportingCsv] = reactExports.useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [deleteConfirm, setDeleteConfirm] = reactExports.useState(null);
  const csvInputRef = reactExports.useRef(null);
  const imageFillInputRef = reactExports.useRef(null);
  const visibleFolders = reactExports.useMemo(() => {
    if (resourceSharing.shareCharacters) return folders;
    if (!activeProjectId) return [];
    return folders.filter((f) => f.projectId === activeProjectId);
  }, [folders, resourceSharing.shareCharacters, activeProjectId]);
  const visibleCharacters = reactExports.useMemo(() => {
    let chars;
    if (resourceSharing.shareCharacters) {
      chars = characters;
    } else if (!activeProjectId) {
      chars = [];
    } else {
      chars = characters.filter((c) => c.projectId === activeProjectId);
    }
    if (hasEpisodeScope && episodeViewScope === "episode" && activeEpisodeId) {
      chars = chars.filter((c) => !c.linkedEpisodeId || c.linkedEpisodeId === activeEpisodeId);
    }
    return chars;
  }, [characters, resourceSharing.shareCharacters, activeProjectId, hasEpisodeScope, episodeViewScope, activeEpisodeId]);
  const subFolders = reactExports.useMemo(
    () => visibleFolders.filter((f) => f.parentId === currentFolderId),
    [visibleFolders, currentFolderId]
  );
  const currentCharacters = reactExports.useMemo(() => {
    let chars = visibleCharacters.filter((c) => (c.folderId ?? null) === currentFolderId);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(
        (c) => c.name.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query) || c.characterPrompt?.toLowerCase().includes(query)
      );
    }
    return chars;
  }, [visibleCharacters, currentFolderId, searchQuery]);
  reactExports.useEffect(() => {
    void initializeGoogleFlowRuntime();
  }, [initializeGoogleFlowRuntime]);
  const mergedDisplayItems = reactExports.useMemo(() => {
    return currentCharacters.map((char) => ({ type: "library", char }));
  }, [currentCharacters]);
  const characterImageBatchTargets = reactExports.useMemo(
    () => visibleCharacters.filter((character) => !character.thumbnailUrl),
    [visibleCharacters]
  );
  const characterFlowSyncById = reactExports.useMemo(() => new Map(
    visibleCharacters.map((character) => [
      character.id,
      getGoogleFlowSyncProgress(
        [character.thumbnailUrl, ...character.referenceImages || []],
        character.googleFlowMediaIdsBySource,
        googleFlowSyncScopes
      )
    ])
  ), [googleFlowSyncScopes, visibleCharacters]);
  const missingGoogleFlowMediaCount = reactExports.useMemo(
    () => [...characterFlowSyncById.values()].reduce((total, progress) => total + progress.missing, 0),
    [characterFlowSyncById]
  );
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
    if (resourceSharing.shareCharacters) return;
    const allowedIds = new Set(visibleFolders.map((f) => f.id));
    if (currentFolderId && !allowedIds.has(currentFolderId)) {
      setCurrentFolder(null);
    }
  }, [resourceSharing.shareCharacters, visibleFolders, currentFolderId, setCurrentFolder]);
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error(t("characters.folderName"));
      return;
    }
    const projectId = resourceSharing.shareCharacters ? void 0 : activeProjectId || void 0;
    addFolder(newFolderName.trim(), currentFolderId, projectId);
    setNewFolderName("");
    setShowNewFolderDialog(false);
    toast.success(t("characters.createFolder"));
  };
  const handleRenameFolder = () => {
    if (!renamingFolder || !renameValue.trim()) return;
    renameFolder(renamingFolder.id, renameValue.trim());
    setRenamingFolder(null);
    setRenameValue("");
    toast.success(t("characters.renameFolder"));
  };
  const handleDeleteFolder = (id) => {
    const folder = getFolderById(id);
    setDeleteConfirm({ type: "folder", id, name: folder?.name ?? "" });
  };
  const handleDeleteCharacter = (char) => {
    setDeleteConfirm({ type: "character", char });
  };
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "folder") {
      deleteFolder(deleteConfirm.id);
      toast.success(t("characters.folderDeleted"));
    } else {
      deleteCharacter(deleteConfirm.char.id);
      if (selectedCharacterId === deleteConfirm.char.id) {
        onCharacterSelect(null);
      }
      toast.success(t("characters.deleted"));
    }
    setDeleteConfirm(null);
  };
  const handleCharacterClick = (char) => {
    if (selectedCharacterId === char.id) {
      selectCharacter(null);
      onCharacterSelect(null);
    } else {
      selectCharacter(char.id);
      onCharacterSelect(char);
    }
  };
  const toggleCharacterSelection = (characterId, checked) => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(characterId);
      else next.delete(characterId);
      return next;
    });
  };
  const {
    generatingIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateImage,
    handleStopGenerateImage,
    handleGenerateAllImages,
    handleStopAllGenerateImages,
    handleUploadCharacterImage,
    handleFillCharacterImages,
    handleSyncGoogleFlowReferences
  } = useCharacterImageGeneration({
    visibleCharacters,
    characterImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName: activeProject?.name,
    updateCharacter,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t
  });
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
              t("characters.galleryTitle")
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
                placeholder: t("characters.search"),
                className: "h-8 pl-7 text-sm"
              }
            )
          ] }),
          hasEpisodeScope && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: episodeViewScope === "episode" ? "secondary" : "ghost",
                size: "sm",
                className: "h-8 px-2 rounded-r-none text-xs",
                onClick: () => setEpisodeViewScope("episode"),
                children: t("characters.thisEpisode")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: episodeViewScope === "all" ? "secondary" : "ghost",
                size: "sm",
                className: "h-8 px-2 rounded-l-none text-xs",
                onClick: () => setEpisodeViewScope("all"),
                children: t("characters.fullSeries")
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
                t("characters.importCsv")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: visibleCharacters.length === 0,
              onClick: onExportCsv,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-3.5 w-3.5" }),
                t("characters.exportCsv")
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
                if (files.length > 0) void handleFillCharacterImages(files);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isFillingImages || visibleCharacters.every((character) => !!character.thumbnailUrl),
              onClick: () => imageFillInputRef.current?.click(),
              children: [
                isFillingImages ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Images, { className: "h-3.5 w-3.5" }),
                t("characters.fillImages")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1",
              disabled: isGeneratingAllImages || characterImageBatchTargets.length === 0,
              onClick: () => void handleGenerateAllImages(),
              children: [
                isGeneratingAllImages ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
                t("characters.createAll", { count: characterImageBatchTargets.length })
              ]
            }
          ),
          isGeneratingAllImages && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "destructive",
              size: "sm",
              className: "h-8 gap-1",
              onClick: handleStopAllGenerateImages,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }),
                t("characters.stopAll")
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
              title: t("characters.syncFlowTitle"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isSyncingGoogleFlowReferences && "animate-spin") }),
                isSyncingGoogleFlowReferences ? t("characters.syncingFlow", { count: googleFlowReadyAccountCount }) : t("characters.syncFlowMissing", { count: missingGoogleFlowMediaCount })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ScrollArea, { className: "flex-1 p-3 pb-40", children: [
      subFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: t("characters.folders") }),
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
      mergedDisplayItems.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: t("characters.count", { count: mergedDisplayItems.length }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
          viewMode === "grid" ? "grid grid-cols-3 gap-2" : "space-y-1"
        ), children: mergedDisplayItems.map((item) => {
          const char = item.char;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            CharacterContextMenu,
            {
              character: char,
              folders: visibleFolders,
              onDelete: () => handleDeleteCharacter(char),
              onMove: (folderId) => {
                moveToFolder(char.id, folderId);
                toast.success(t("characters.moved"));
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                CharacterCard,
                {
                  char,
                  viewMode,
                  isSelected: selectedCharacterId === char.id,
                  isChecked: selectedCharacterIds.has(char.id),
                  generating: generatingIds.has(char.id),
                  submitted: Boolean(generatingStartedAtById[char.id]),
                  generatingElapsedSeconds: generatingStartedAtById[char.id] ? Math.max(0, Math.floor((now - generatingStartedAtById[char.id]) / 1e3)) : 0,
                  flowSyncProgress: characterFlowSyncById.get(char.id),
                  flowSyncOffline: googleFlowSyncScopes.length === 0,
                  projectVisualStyleId,
                  onOpen: () => handleCharacterClick(char),
                  onToggleSelection: (checked) => toggleCharacterSelection(char.id, checked),
                  onPreview: (url) => {
                    setPreviewImageUrl(url);
                    setPreviewCharacterId(char.id);
                  },
                  onUploadImage: (file) => handleUploadCharacterImage(char, file),
                  onGenerateImage: () => handleGenerateImage(char),
                  onStopGenerate: () => handleStopGenerateImage(char.id),
                  onDelete: () => handleDeleteCharacter(char),
                  t
                }
              )
            },
            char.id
          );
        }) })
      ] }) : subFolders.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-[200px] text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-6 w-6 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: searchQuery ? t("characters.noMatch") : t("characters.noCharactersYet") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("characters.useConsole") })
      ] })
    ] }),
    previewImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePreviewModal,
      {
        imageUrl: previewImageUrl,
        isOpen: true,
        onClose: () => {
          setPreviewImageUrl(null);
          setPreviewCharacterId(null);
        },
        onImageCleaned: (cleanedUrl) => {
          if (previewCharacterId) {
            updateCharacter(previewCharacterId, { thumbnailUrl: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showNewFolderDialog, onOpenChange: setShowNewFolderDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("characters.createFolder") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: newFolderName,
          onChange: (e) => setNewFolderName(e.target.value),
          placeholder: t("characters.folderName"),
          onKeyDown: (e) => e.key === "Enter" && handleCreateFolder(),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setShowNewFolderDialog(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateFolder, children: t("overview.add") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!deleteConfirm, onOpenChange: (open) => !open && setDeleteConfirm(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: deleteConfirm?.type === "folder" ? t("characters.deleteFolder") : t("characters.deleteCharacter") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: deleteConfirm ? deleteConfirm.type === "folder" ? t("characters.deleteFolderConfirm", { name: deleteConfirm.name }) : t("characters.deleteCharacterConfirm", { name: deleteConfirm.char.name }) : "" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setDeleteConfirm(null), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: handleConfirmDelete, children: deleteConfirm?.type === "folder" ? t("characters.deleteFolder") : t("characters.deleteCharacter") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!renamingFolder, onOpenChange: (open) => !open && setRenamingFolder(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("characters.renameFolder") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: renameValue,
          onChange: (e) => setRenameValue(e.target.value),
          placeholder: t("characters.folderName"),
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
function CharacterDetail({ character }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { updateCharacter, deleteCharacter, selectCharacter } = useCharacterLibraryStore();
  const scriptProject = useActiveScriptProject();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const [previewImageUrl, setPreviewImageUrl] = reactExports.useState(null);
  const [editForm, setEditForm] = reactExports.useState({
    name: "",
    styleId: projectVisualStyleId,
    aspectRatio: "1:1",
    description: "",
    characterPrompt: "",
    voiceId: "none"
  });
  const [referenceImagesDraft, setReferenceImagesDraft] = reactExports.useState([]);
  const [isRegeneratingImage, setIsRegeneratingImage] = reactExports.useState(false);
  const [regenerationStartedAt, setRegenerationStartedAt] = reactExports.useState(null);
  const now = useNow(isRegeneratingImage);
  const regenerationElapsedSeconds = regenerationStartedAt ? Math.max(0, Math.floor((now - regenerationStartedAt) / 1e3)) : 0;
  reactExports.useEffect(() => {
    if (!isRegeneratingImage) setRegenerationStartedAt(null);
  }, [isRegeneratingImage]);
  const linkedScriptCharacter = reactExports.useMemo(() => {
    if (!character) return null;
    return scriptProject?.scriptData?.characters.find((scriptCharacter) => {
      const mappedLibraryId = scriptProject.characterIdMap[scriptCharacter.id];
      return mappedLibraryId === character.id || scriptCharacter.characterLibraryId === character.id;
    }) || null;
  }, [character, scriptProject]);
  reactExports.useEffect(() => {
    if (!character) return;
    setEditForm({
      name: character.name || "",
      styleId: character.styleId || projectVisualStyleId,
      aspectRatio: character.aspectRatio || "1:1",
      description: character.description || character.appearance || "",
      characterPrompt: character.characterPrompt || "",
      voiceId: character.voiceId || "none"
    });
    setReferenceImagesDraft(character.referenceImages || []);
  }, [character, projectVisualStyleId]);
  const finalImagePromptPreview = reactExports.useMemo(() => {
    if (!character && !editForm.name.trim() && !editForm.characterPrompt.trim()) return "";
    return buildCharacterImagePrompt(
      editForm.name || character?.name || t("characters.name"),
      editForm.styleId || character?.styleId || projectVisualStyleId,
      editForm.characterPrompt || character?.characterPrompt || character?.name
    );
  }, [character, editForm.name, editForm.characterPrompt, editForm.styleId, projectVisualStyleId, t]);
  if (!character) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("characters.detailEmpty") })
    ] });
  }
  const handleDelete = () => {
    if (confirm(`Delete character "${character.name}"?`)) {
      deleteCharacter(character.id);
      selectCharacter(null);
      toast.success(t("characters.deleted"));
    }
  };
  const handleSaveAll = () => {
    if (!character) return;
    updateCharacter(character.id, {
      name: editForm.name.trim() || character.name,
      description: editForm.description.trim() || void 0,
      characterPrompt: editForm.characterPrompt.trim() || character.characterPrompt,
      styleId: editForm.styleId || projectVisualStyleId,
      aspectRatio: editForm.aspectRatio || "1:1",
      referenceImages: referenceImagesDraft.length > 0 ? referenceImagesDraft : void 0,
      voiceId: editForm.voiceId === "none" ? void 0 : editForm.voiceId
    });
    toast.success("Character settings updated");
  };
  const handleReferenceImageChange = async (e) => {
    const files = e.target.files;
    if (!files) return;
    const nextImages = [...referenceImagesDraft];
    for (const file of Array.from(files)) {
      if (nextImages.length >= 3) break;
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const localPath = await saveImageToLocal(
        base64,
        "characters",
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_ref_${nextImages.length + 1}.png`
      );
      nextImages.push(localPath);
    }
    setReferenceImagesDraft(nextImages.slice(0, 3));
    e.target.value = "";
  };
  const handlePrimaryImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !character) return;
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const localPath = await saveImageToLocal(
        base64,
        "characters",
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_main_${Date.now()}.png`
      );
      updateCharacter(character.id, {
        thumbnailUrl: localPath
      });
      toast.success(t("characters.savedLocal"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };
  const handleRemovePrimaryImage = () => {
    if (!character) return;
    updateCharacter(character.id, {
      thumbnailUrl: void 0
    });
    toast.success(t("characters.deleted"));
  };
  const handleExportImage = async (imageUrl, name) => {
    try {
      let blob;
      if (imageUrl.startsWith("data:")) {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith("local-image://")) {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith("http")) {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("characters.exportSuccess", { name }));
    } catch (err) {
      console.error("Export image failed:", err);
      toast.error(t("characters.exportFailed"));
    }
  };
  const handleRegenerateImage = async () => {
    if (!character) return;
    const sourceCharacter = linkedScriptCharacter;
    const targetName = sourceCharacter?.name || editForm.name.trim() || character.name;
    const targetCharacterPrompt = sourceCharacter?.characterPrompt || editForm.characterPrompt.trim() || character.characterPrompt || targetName;
    const targetReferenceImages = referenceImagesDraft.filter(Boolean);
    const targetStyleId = editForm.styleId || character.styleId || projectVisualStyleId;
    setIsRegeneratingImage(true);
    try {
      const prompt = buildCharacterImagePrompt(
        targetName,
        targetStyleId,
        targetCharacterPrompt
      );
      const result = await generateCharacterImage({
        prompt,
        negativePrompt: "blurry, low quality, watermark, text, cropped",
        aspectRatio: editForm.aspectRatio,
        referenceImages: targetReferenceImages,
        styleId: targetStyleId,
        onSubmitted: (submittedAt) => setRegenerationStartedAt(submittedAt || Date.now())
      });
      const localPath = await saveImageToLocal(
        result.imageUrl,
        "characters",
        `${targetName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.png`
      );
      updateCharacter(character.id, {
        thumbnailUrl: localPath
      });
      const aiFolderId = getOrCreateCategoryFolder("ai-image");
      addMediaFromUrl({
        url: localPath,
        name: `Character-${targetName || "Untitled"}`,
        type: "image",
        source: "ai-image",
        folderId: aiFolderId,
        projectId: character.projectId
      });
      toast.success(t("characters.generatedImage", { name: targetName }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("characters.generateImageFailed", { name: targetName, message }));
    } finally {
      setIsRegeneratingImage(false);
    }
  };
  const primaryImageUrl = character.thumbnailUrl || "";
  const previewAspectRatio = (editForm.aspectRatio || "1:1").replace(":", " / ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm truncate", children: character.name }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-4 pb-40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: "character-detail-main-image",
            type: "file",
            accept: "image/*",
            className: "hidden",
            onChange: handlePrimaryImageChange
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg bg-muted overflow-hidden border relative cursor-zoom-in group/image",
            style: { aspectRatio: previewAspectRatio },
            title: t("characters.doubleClickPreview"),
            draggable: true,
            onDoubleClick: () => {
              if (primaryImageUrl) setPreviewImageUrl(primaryImageUrl);
            },
            onClick: () => {
              if (primaryImageUrl) {
                setPreviewImageUrl(primaryImageUrl);
              } else {
                document.getElementById("character-detail-main-image")?.click();
              }
            },
            onDragStart: (e) => {
              e.dataTransfer.setData("application/json", JSON.stringify({
                type: "character",
                characterId: character.id,
                characterName: character.name,
                characterPrompt: character.characterPrompt,
                thumbnailUrl: character.thumbnailUrl
              }));
              e.dataTransfer.effectAllowed = "copy";
            },
            children: [
              character.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                LocalImage,
                {
                  src: character.thumbnailUrl,
                  alt: character.name,
                  className: "w-full h-full object-cover"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-16 w-16 text-muted-foreground" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => document.getElementById("character-detail-main-image")?.click(),
                    className: "p-1 rounded bg-black/50 text-white hover:bg-blue-600",
                    title: t("director.card.upload"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" })
                  }
                ),
                primaryImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleRemovePrimaryImage,
                    className: "p-1 rounded bg-black/50 text-white hover:bg-red-600",
                    title: t("property.deleteCharacter"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-black/50 text-white rounded p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "h-3.5 w-3.5" }) })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground", children: t("characters.info") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editForm.name, onChange: (e) => setEditForm((prev) => ({ ...prev, name: e.target.value })), className: "h-8 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.aspectRatio") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editForm.aspectRatio, onValueChange: (value) => setEditForm((prev) => ({ ...prev, aspectRatio: value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ASPECT_RATIO_OPTIONS.map((ratio) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ratio, children: ratio }, ratio)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3 w-3" }),
            t("characters.voiceId")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: editForm.voiceId === "none" ? "" : editForm.voiceId,
              onChange: (e) => setEditForm((prev) => ({ ...prev, voiceId: e.target.value.trim() || "none" })),
              placeholder: t("characters.voiceNone"),
              className: "h-8 text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editForm.description,
              onChange: (e) => setEditForm((prev) => ({ ...prev, description: e.target.value })),
              className: "text-xs min-h-[80px]",
              placeholder: t("characters.descriptionPlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.characterPrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editForm.characterPrompt,
              onChange: (e) => setEditForm((prev) => ({ ...prev, characterPrompt: e.target.value })),
              className: "text-xs min-h-[100px]",
              placeholder: t("characters.characterPrompt")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("overview.visualStyle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StylePicker, { value: editForm.styleId || "random", onChange: (id) => setEditForm((prev) => ({ ...prev, styleId: id })) })
        ] }),
        finalImagePromptPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 rounded-lg border bg-muted/30 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.finalImagePrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap", children: finalImagePromptPreview })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("characters.referenceImages") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 flex-wrap", children: [
            referenceImagesDraft.map((img, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: img, alt: t("characters.referenceAlt", { index: i + 1 }), className: "w-10 h-10 object-cover rounded border" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setReferenceImagesDraft((prev) => prev.filter((_, idx) => idx !== i)),
                  className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                }
              )
            ] }, i)),
            referenceImagesDraft.length < 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "character-detail-ref-images", type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: handleReferenceImageChange }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: "outline", className: "h-10 text-xs", onClick: () => document.getElementById("character-detail-ref-images")?.click(), children: t("director.card.upload") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", size: "sm", onClick: handleSaveAll, children: t("characters.saveCharacterSettings") })
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
              isRegeneratingImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 mr-2" }),
              isRegeneratingImage ? regenerationStartedAt ? `Đang tạo ${regenerationElapsedSeconds}s` : "Đang chờ" : t("characters.regenerateImage")
            ]
          }
        ),
        primaryImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            className: "w-full justify-start",
            size: "sm",
            onClick: () => handleExportImage(primaryImageUrl, character.name),
            children: t("characters.exportCurrentView")
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
              t("property.deleteCharacter")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground space-y-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "💡 ",
        t("characters.dragHint")
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePreviewModal,
      {
        imageUrl: previewImageUrl || "",
        isOpen: !!previewImageUrl,
        onClose: () => setPreviewImageUrl(null),
        onImageCleaned: (cleanedUrl) => {
          if (character) {
            updateCharacter(character.id, { thumbnailUrl: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }
      }
    )
  ] });
}
function CharactersView() {
  const { t } = useI18n();
  const { characters, selectedCharacterId, selectCharacter, addCharacter, updateCharacter: updateLibraryCharacter } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeScriptProjectId = useScriptStore((state) => state.activeProjectId);
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const updateScriptCharacter = useScriptStore((state) => state.updateCharacter);
  const setMappings = useScriptStore((state) => state.setMappings);
  const visibleCharacters = reactExports.useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeScriptProjectId) return [];
    return characters.filter((c) => c.projectId === activeScriptProjectId);
  }, [characters, resourceSharing.shareCharacters, activeScriptProjectId]);
  const selectedCharacter = reactExports.useMemo(
    () => visibleCharacters.find((c) => c.id === selectedCharacterId) || null,
    [visibleCharacters, selectedCharacterId]
  );
  const handleCharacterSelect = (char) => {
    selectCharacter(char?.id || null);
  };
  const handleImportCsv = async (file) => {
    if (!activeScriptProjectId) {
      toast.error(t("characters.csvNeedsProject"));
      return;
    }
    try {
      const summary = await importCharacterCsv(file, activeScriptProjectId, projectVisualStyleId);
      if (summary.selectedLibraryId) {
        selectCharacter(summary.selectedLibraryId);
      }
      toast.success(t("characters.csvImported", {
        created: summary.created,
        updated: summary.updated,
        unchanged: summary.unchanged,
        skipped: summary.skipped
      }));
    } catch (error) {
      toast.error(t("characters.csvImportFailed", {
        message: error instanceof Error ? error.message : String(error)
      }));
    }
  };
  const handleExportCsv = () => {
    const csv = serializeCharacterLibraryCsv(visibleCharacters);
    downloadLibraryCsv(csv, `characters-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
    toast.success(t("characters.csvExported", { count: visibleCharacters.length }));
  };
  reactExports.useEffect(() => {
    if (!activeScriptProjectId || !scriptProject?.scriptData?.characters?.length) return;
    scriptProject.scriptData.characters.forEach((scriptChar) => {
      const latestCharacters = useCharacterLibraryStore.getState().characters;
      const mappedLibraryId = scriptProject.characterIdMap[scriptChar.id];
      if (mappedLibraryId) {
        const mappedCharacter = latestCharacters.find((c) => c.id === mappedLibraryId);
        if (mappedCharacter) {
          const libraryUpdates = {};
          if (!mappedCharacter.description?.trim() && scriptChar.appearance?.trim()) {
            libraryUpdates.description = scriptChar.appearance;
          }
          if (!mappedCharacter.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
            libraryUpdates.characterPrompt = scriptChar.characterPrompt;
          }
          if (Object.keys(libraryUpdates).length > 0) {
            updateLibraryCharacter(mappedCharacter.id, libraryUpdates);
          }
          const scriptUpdates = {};
          if (scriptChar.characterLibraryId !== mappedLibraryId) scriptUpdates.characterLibraryId = mappedLibraryId;
          if (!scriptChar.appearance?.trim() && mappedCharacter.description?.trim()) {
            scriptUpdates.appearance = mappedCharacter.description;
          }
          if (!scriptChar.characterPrompt?.trim() && mappedCharacter.characterPrompt?.trim()) {
            scriptUpdates.characterPrompt = mappedCharacter.characterPrompt;
          }
          if (Object.keys(scriptUpdates).length > 0) {
            updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
          }
          return;
        }
        updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: void 0 });
        return;
      }
      if (scriptChar.characterLibraryId) {
        const linkedCharacter = latestCharacters.find((c) => c.id === scriptChar.characterLibraryId);
        if (linkedCharacter) {
          const libraryUpdates = {};
          if (!linkedCharacter.description?.trim() && scriptChar.appearance?.trim()) {
            libraryUpdates.description = scriptChar.appearance;
          }
          if (!linkedCharacter.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
            libraryUpdates.characterPrompt = scriptChar.characterPrompt;
          }
          if (Object.keys(libraryUpdates).length > 0) {
            updateLibraryCharacter(linkedCharacter.id, libraryUpdates);
          }
          const scriptUpdates = {};
          if (!scriptChar.appearance?.trim() && linkedCharacter.description?.trim()) {
            scriptUpdates.appearance = linkedCharacter.description;
          }
          if (!scriptChar.characterPrompt?.trim() && linkedCharacter.characterPrompt?.trim()) {
            scriptUpdates.characterPrompt = linkedCharacter.characterPrompt;
          }
          if (Object.keys(scriptUpdates).length > 0) {
            updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
          }
          const latestMap2 = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
          setMappings(activeScriptProjectId, {
            characterIdMap: {
              ...latestMap2,
              [scriptChar.id]: scriptChar.characterLibraryId
            }
          });
          return;
        }
        updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: void 0 });
      }
      const existingMatches = latestCharacters.filter(
        (char) => char.projectId === activeScriptProjectId && char.name.trim().toLowerCase() === scriptChar.name.trim().toLowerCase()
      );
      if (existingMatches.length > 1) return;
      const existing = existingMatches[0];
      if (existing) {
        const libraryUpdates = {};
        if (!existing.description?.trim() && scriptChar.appearance?.trim()) {
          libraryUpdates.description = scriptChar.appearance;
        }
        if (!existing.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
          libraryUpdates.characterPrompt = scriptChar.characterPrompt;
        }
        if (Object.keys(libraryUpdates).length > 0) {
          updateLibraryCharacter(existing.id, libraryUpdates);
        }
        const scriptUpdates = { characterLibraryId: existing.id };
        if (!scriptChar.appearance?.trim() && existing.description?.trim()) {
          scriptUpdates.appearance = existing.description;
        }
        if (!scriptChar.characterPrompt?.trim() && existing.characterPrompt?.trim()) {
          scriptUpdates.characterPrompt = existing.characterPrompt;
        }
        updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
        const latestMap2 = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
        setMappings(activeScriptProjectId, {
          characterIdMap: {
            ...latestMap2,
            [scriptChar.id]: existing.id
          }
        });
        return;
      }
      const newId = addCharacter({
        name: scriptChar.name,
        description: scriptChar.appearance || "",
        characterPrompt: scriptChar.characterPrompt || "",
        aspectRatio: "1:1",
        projectId: activeScriptProjectId,
        styleId: projectVisualStyleId,
        status: "linked",
        linkedEpisodeId: void 0,
        thumbnailUrl: void 0
      });
      updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: newId });
      const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
      setMappings(activeScriptProjectId, {
        characterIdMap: {
          ...latestMap,
          [scriptChar.id]: newId
        }
      });
    });
  }, [activeScriptProjectId, scriptProject, projectVisualStyleId, addCharacter, updateScriptCharacter, setMappings, updateLibraryCharacter]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 25, minSize: 20, maxSize: 35, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      GenerationPanel,
      {
        selectedCharacter,
        onCharacterCreated: (id) => selectCharacter(id)
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, { withHandle: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 45, minSize: 30, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      CharacterGallery,
      {
        onCharacterSelect: handleCharacterSelect,
        selectedCharacterId,
        onImportCsv: handleImportCsv,
        onExportCsv: handleExportCsv
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, { withHandle: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 30, minSize: 20, maxSize: 40, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CharacterDetail, { character: selectedCharacter }) })
  ] }) });
}
export {
  CharactersView
};
