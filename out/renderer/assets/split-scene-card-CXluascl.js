import { j as jsxRuntimeExports } from "./radix-ui-BYOyDlCM.js";
import { N as MapPin, d as Trash2, r as reactExports, K as Users, bu as User, a9 as Check, bR as Layers, aP as Image, ad as FolderOpen, D as Download, X, bl as Upload, L as LoaderCircle, aS as Square, R as React, q as RefreshCw, a4 as Play, u as CircleAlert, a0 as ChevronRight, bq as PenLine } from "./lucide-react-Cs1Usobv.js";
import { u as useNow } from "./use-now-CsYsJsN6.js";
import { h as useCharacterLibraryStore, f as useSceneStore, p as normalizeRefImageIndexes, k as useMediaStore, m as useAPIConfigStore, B as readImageAsBase64 } from "./autopilot-store-4Sgwsp2L.js";
import { c as cn, T as TooltipProvider, U as Tooltip, V as TooltipTrigger, W as TooltipContent, E as AlertDialog, G as AlertDialogTrigger, B as Button, H as AlertDialogContent, J as AlertDialogHeader, K as AlertDialogTitle, L as AlertDialogDescription, M as AlertDialogFooter, N as AlertDialogCancel, O as AlertDialogAction, a as useI18n, b as useVideoStudioSettingsStore, t as toast } from "./index-B8Pnvlyd.js";
import { C as Checkbox, b as usePreviewStore } from "./entry-BWjcO7w7.js";
import { u as useResolvedImageUrl } from "./use-resolved-image-url-C-HGjI3Q.js";
import "./model-registry-CChP-jS9.js";
import { T as TaskInfoButton } from "./task-info-button-BwQTF1-v.js";
import { a as useProjectStore } from "./auto-video-store-BurpJGpg.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-BBVZUjTG.js";
import { L as Label } from "./label-C6uhtku6.js";
import { L as LocalImage } from "./local-image-B0xN60cV.js";
import { T as Textarea } from "./textarea-P4k3OFxA.js";
function SplitSceneCardHeader({
  scene,
  allVoices,
  voiceMode,
  effectiveImageUrl,
  isGeneratingAny,
  selectable,
  selected,
  onSelectedChange,
  onDelete,
  t
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border-b", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
      selectable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Checkbox,
        {
          checked: selected,
          onCheckedChange: (checked) => onSelectedChange?.(checked === true)
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-muted-foreground", children: t("director.card.shot", { index: scene.id + 1 }) }),
      voiceMode !== "off" && (allVoices && allVoices.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex items-center gap-0.5", children: allVoices.map(({ voiceId, active }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: cn(
            "text-2xs px-1.5 py-0.5 rounded border",
            active ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
          ),
          children: voiceId
        },
        voiceId
      )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border", children: t("voice.sceneUnassigned", { mode: t(`voice.mode.${voiceMode}`) }) })),
      (scene.sceneName || scene.sceneLocation) && /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary cursor-default", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
          scene.sceneName || scene.sceneLocation
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
          scene.sceneName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.card.scene", { name: scene.sceneName }) }),
          scene.sceneLocation && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.card.location", { name: scene.sceneLocation }) })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5", onClick: (event) => event.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { outputUrl: effectiveImageUrl, prompt: scene.imagePrompt, kind: "image", title: t("taskInfo.image") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { outputUrl: scene.videoUrl, prompt: scene.videoPrompt, kind: "video", title: t("taskInfo.video") }),
      onDelete && !isGeneratingAny && /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon-sm", className: "p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("director.card.deleteShot", { index: scene.id + 1 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("director.card.deleteBody") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AlertDialogAction,
              {
                onClick: () => onDelete(scene.id),
                className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                children: t("dashboard.delete")
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
const VEO_LENGTHS = [4, 6, 8];
const OMNI_LENGTHS = [4, 6, 8, 10];
function isOmniFlashModel(model) {
  const canonical = (model || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return canonical.includes("omni") || canonical.startsWith("abra");
}
function supportedVideoLengths(models) {
  return models.length > 0 && models.every(isOmniFlashModel) ? OMNI_LENGTHS : VEO_LENGTHS;
}
function modelsFromBindings(bindings) {
  const list = typeof bindings === "string" ? [bindings] : bindings || [];
  return list.map((binding) => {
    const separator = binding.indexOf(":");
    return separator > 0 ? binding.slice(separator + 1) : "";
  }).filter(Boolean);
}
function CharacterSelector({
  selectedIds,
  onChange,
  disabled
}) {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const { t } = useI18n();
  const { characters } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const visibleCharacters = reactExports.useMemo(() => {
    const list = resourceSharing.shareCharacters ? characters : !activeProjectId ? [] : characters.filter((c) => c.projectId === activeProjectId);
    const seen = /* @__PURE__ */ new Set();
    return list.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);
  const toggleCharacter = (charId) => {
    if (selectedIds.includes(charId)) {
      onChange(selectedIds.filter((id) => id !== charId));
    } else {
      onChange([...selectedIds, charId]);
    }
  };
  const selectedCharacters = visibleCharacters.filter((c) => selectedIds.includes(c.id));
  const validSelectedCount = selectedCharacters.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        size: "xs",
        disabled,
        className: "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
          validSelectedCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("director.charactersSelected", { count: validSelectedCount }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("director.characterLibrary") })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-64 p-2", align: "start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium mb-2", children: t("director.selectCharactersLabel") }),
      visibleCharacters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: t("director.characterLibraryEmpty") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[280px] overflow-y-auto space-y-1", children: visibleCharacters.map((char) => {
        const thumbnail = char.thumbnailUrl;
        const isSelected = selectedIds.includes(char.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => toggleCharacter(char.id),
            className: "w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted text-left",
            children: [
              thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: thumbnail, alt: char.name, className: "w-6 h-6 rounded object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-xs truncate", children: char.name }),
              isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-primary" })
            ]
          }
        ) }, char.id);
      }) })
    ] })
  ] });
}
function ResolvedImg$1({ src, alt, className }) {
  const resolved = useResolvedImageUrl(src);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolved || "", alt, className });
}
function SceneLibrarySelector({
  sceneId: _sceneId,
  selectedSceneLibraryId,
  onChange,
  disabled
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const { scenes: libraryScenes } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const visibleScenes = reactExports.useMemo(() => {
    if (resourceSharing.shareScenes) return libraryScenes;
    if (!activeProjectId) return [];
    return libraryScenes.filter((scene) => scene.projectId === activeProjectId);
  }, [libraryScenes, resourceSharing.shareScenes, activeProjectId]);
  const selectedScene = reactExports.useMemo(() => {
    if (!selectedSceneLibraryId) return null;
    return visibleScenes.find((scene) => scene.id === selectedSceneLibraryId) || null;
  }, [visibleScenes, selectedSceneLibraryId]);
  const previewRefImage = selectedScene?.referenceImage || selectedScene?.referenceImageBase64 || null;
  const hasSelection = !!selectedSceneLibraryId;
  const handleSelectScene = (sceneLibraryId) => {
    const scene = visibleScenes.find((item) => item.id === sceneLibraryId);
    if (!scene) {
      onChange(void 0, void 0);
      return;
    }
    onChange(scene.id, scene.referenceImage || scene.referenceImageBase64);
    setIsOpen(false);
  };
  const handleClear = () => {
    onChange(void 0, void 0);
    setIsOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        disabled,
        className: cn(
          "flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs transition-colors disabled:opacity-50",
          hasSelection ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10" : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[80px] truncate", children: selectedScene?.name || t("director.sceneReference") })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-[560px] p-3", align: "start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("director.selectSceneReference") }),
        hasSelection && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "xs", onClick: handleClear, className: "text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80", children: t("director.clearSelection") })
      ] }),
      visibleScenes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: t("director.emptySceneLibrary") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[280px] shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground mb-2 block", children: t("director.scenesLabel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[300px] overflow-y-auto space-y-1 pr-1", children: visibleScenes.map((scene) => {
            const isSelected = selectedSceneLibraryId === scene.id;
            const thumbnail = scene.referenceImage || scene.referenceImageBase64;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => handleSelectScene(scene.id),
                className: cn(
                  "w-full flex items-center gap-2 p-2 rounded text-left transition-colors",
                  isSelected ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-muted"
                ),
                children: [
                  thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResolvedImg$1, { src: thumbnail, alt: scene.name, className: "w-12 h-12 rounded object-contain bg-muted shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 text-xs truncate", children: scene.name }),
                  isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-primary shrink-0" })
                ]
              },
              scene.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[240px] shrink-0 border-l pl-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground mb-2 block", children: t("director.referencePreview") }),
          previewRefImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full rounded-lg bg-muted flex items-center justify-center min-h-[120px] max-h-[240px] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResolvedImg$1, { src: previewRefImage, alt: t("director.referencePreview"), className: "max-w-full max-h-[240px] rounded-lg object-contain" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full aspect-video rounded-lg bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: t("director.selectSceneHint") }) }),
          selectedScene && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs text-foreground truncate", children: selectedScene.name })
        ] })
      ] })
    ] })
  ] });
}
function getSceneShotIndex(scene) {
  return scene.sourceShotIndex || scene.id + 1;
}
function ResolvedImg({ src, alt, className }) {
  const resolved = useResolvedImageUrl(src);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolved || "", alt, className });
}
function ShotReferenceSelector({
  currentSceneId,
  scenes,
  selectedIndexes,
  onChange,
  disabled
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const normalizedSelected = reactExports.useMemo(() => normalizeRefImageIndexes(selectedIndexes), [selectedIndexes]);
  const availableScenes = reactExports.useMemo(
    () => scenes.filter((scene) => scene.id !== currentSceneId),
    [scenes, currentSceneId]
  );
  const selectedScenes = reactExports.useMemo(() => {
    const selectedSet = new Set(normalizedSelected);
    return availableScenes.filter((scene) => selectedSet.has(getSceneShotIndex(scene)));
  }, [availableScenes, normalizedSelected]);
  const firstPreview = selectedScenes.find((scene) => scene.imageDataUrl || scene.imageHttpUrl);
  const previewImage = firstPreview?.imageDataUrl || firstPreview?.imageHttpUrl || "";
  const hasSelection = normalizedSelected.length > 0;
  const toggleScene = (scene) => {
    const shotIndex = getSceneShotIndex(scene);
    const selectedSet = new Set(normalizedSelected);
    if (selectedSet.has(shotIndex)) {
      selectedSet.delete(shotIndex);
    } else {
      selectedSet.add(shotIndex);
    }
    onChange(Array.from(selectedSet).sort((a, b) => a - b));
  };
  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };
  const triggerText = hasSelection ? normalizedSelected.length === 1 ? `Ref Shot ${String(normalizedSelected[0]).padStart(2, "0")}` : t("director.shotReferencesSelected", { count: normalizedSelected.length }) : t("director.shotReference");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        disabled,
        className: cn(
          "flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs transition-colors disabled:opacity-50",
          hasSelection ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10" : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[96px] truncate", children: triggerText })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-[560px] p-3", align: "start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("director.selectShotReference") }),
        hasSelection && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "xs", onClick: handleClear, className: "text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80", children: t("director.clearSelection") })
      ] }),
      availableScenes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: t("director.noOtherShots") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[280px] shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground mb-2 block", children: t("director.shotsLabel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[300px] overflow-y-auto space-y-1 pr-1", children: availableScenes.map((scene) => {
            const shotIndex = getSceneShotIndex(scene);
            const isSelected = normalizedSelected.includes(shotIndex);
            const thumbnail = scene.imageDataUrl || scene.imageHttpUrl;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => toggleScene(scene),
                className: cn(
                  "w-full flex items-center gap-2 p-2 rounded text-left transition-colors",
                  isSelected ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-muted"
                ),
                children: [
                  thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResolvedImg, { src: thumbnail, alt: `Shot ${shotIndex}`, className: "w-12 h-12 rounded object-contain bg-muted shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1 min-w-0 text-xs truncate", children: [
                    "Shot ",
                    String(shotIndex).padStart(2, "0"),
                    scene.sceneName ? ` · ${scene.sceneName}` : ""
                  ] }),
                  isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-primary shrink-0" })
                ]
              },
              scene.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[240px] shrink-0 border-l pl-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground mb-2 block", children: "Reference preview" }),
          previewImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full rounded-lg bg-muted flex items-center justify-center min-h-[120px] max-h-[240px] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResolvedImg, { src: previewImage, alt: "Shot reference preview", className: "max-w-full max-h-[240px] rounded-lg object-contain" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full aspect-video rounded-lg bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: t("director.selectGeneratedShotHint") }) }),
          hasSelection && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs text-foreground truncate", children: normalizedSelected.map((index) => `Shot ${String(index).padStart(2, "0")}`).join(", ") })
        ] })
      ] })
    ] })
  ] });
}
function MediaLibrarySelector({
  sceneId: _sceneId,
  onSelect,
  disabled
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [selectedFolderId, setSelectedFolderId] = reactExports.useState(null);
  const { mediaFiles, folders } = useMediaStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const visibleFolders = reactExports.useMemo(() => {
    if (resourceSharing.shareMedia) return folders;
    if (!activeProjectId) return [];
    return folders.filter((f) => f.projectId === activeProjectId);
  }, [folders, resourceSharing.shareMedia, activeProjectId]);
  const visibleMedia = reactExports.useMemo(() => {
    if (resourceSharing.shareMedia) return mediaFiles;
    if (!activeProjectId) return [];
    return mediaFiles.filter((m) => m.projectId === activeProjectId);
  }, [mediaFiles, resourceSharing.shareMedia, activeProjectId]);
  const imageFiles = reactExports.useMemo(
    () => visibleMedia.filter((f) => f.type === "image" && !f.ephemeral),
    [visibleMedia]
  );
  const filteredImages = reactExports.useMemo(() => {
    if (selectedFolderId === null) {
      return imageFiles;
    }
    return imageFiles.filter((f) => f.folderId === selectedFolderId);
  }, [imageFiles, selectedFolderId]);
  const handleSelectImage = (imageUrl) => {
    onSelect(imageUrl);
    setIsOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        disabled,
        className: cn(
          "flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs transition-colors disabled:opacity-50",
          "border-purple-500/30 text-purple-400 hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-500/5"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[80px] truncate", children: t("director.fromMediaLibrary") })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-[480px] p-3", align: "start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("director.selectImageApplyTo", { target: t("director.frame.start") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("director.totalImagesCount", { count: filteredImages.length }) })
      ] }),
      imageFiles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: t("director.mediaLibraryEmpty") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        visibleFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSelectedFolderId(null),
              className: cn(
                "px-2 py-1 rounded text-xs transition-colors",
                selectedFolderId === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              ),
              children: t("director.all")
            }
          ),
          visibleFolders.map((folder) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setSelectedFolderId(folder.id),
              className: cn(
                "px-2 py-1 rounded text-xs transition-colors flex items-center gap-1",
                selectedFolderId === folder.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-3 w-3" }),
                folder.name
              ]
            },
            folder.id
          ))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[300px] overflow-y-auto", children: filteredImages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No images in this folder" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: filteredImages.map((img) => {
          const imageUrl = img.url || img.thumbnailUrl || "";
          if (!imageUrl) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => handleSelectImage(imageUrl),
              className: "relative group aspect-video rounded overflow-hidden border-2 border-transparent hover:border-primary transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: imageUrl,
                    alt: img.name,
                    className: "w-full h-full object-cover"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-6 w-6 text-white" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-white truncate block", children: img.name }) }),
                img.source === "ai-image" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1 left-1 text-2xs bg-primary text-white px-1 rounded", children: "AI" })
              ]
            },
            img.id
          );
        }) }) })
      ] })
    ] })
  ] });
}
function VideoLengthSelect({
  className,
  value,
  disabled,
  onChange,
  onClick
}) {
  const bindings = useAPIConfigStore((state) => state.featureBindings?.video_generation);
  const lengths = React.useMemo(() => supportedVideoLengths(modelsFromBindings(bindings)), [bindings]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "select",
    {
      className,
      value,
      onChange,
      onClick,
      disabled,
      title: "Video length",
      children: [
        lengths.map((length) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: length, children: [
          length,
          "s"
        ] }, length)),
        !lengths.includes(value) && /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value, disabled: true, children: [
          value,
          "s"
        ] })
      ]
    }
  );
}
function SplitSceneCardFrame(props) {
  const {
    scene,
    allScenes,
    referenceSlot,
    firstFrameInput,
    firstFrameInputRef,
    resolvedImageUrl,
    shouldRenderMedia,
    generationMode,
    hasImage,
    hasImagePrompt,
    hasVideoPrompt,
    hasIgnoredImageToVideoData,
    imageElapsedSeconds,
    isRefToVideo,
    isGeneratingAny,
    isImageGenerating,
    isImagePreparing,
    isImageQueued,
    setPreviewItem,
    onUpdateCharacters,
    onUpdateSceneReference,
    onUpdateField,
    onUploadImage,
    onStopImageGeneration,
    handleDownloadImage,
    handleRemoveImage,
    t
  } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 lg:flex-nowrap", children: [
      isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsx(
        VideoLengthSelect,
        {
          className: "h-6 rounded border border-border bg-background px-1.5 text-2xs font-medium text-foreground",
          value: scene.videoLength || 4,
          onChange: (e) => onUpdateField?.(scene.id, "videoLength", Number(e.target.value)),
          disabled: isGeneratingAny || !onUpdateField
        }
      ),
      !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[132px] shrink-0 max-w-full sm:w-[148px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium", children: t("director.card.startFrame") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            VideoLengthSelect,
            {
              className: "h-5 rounded border border-border bg-background px-1 text-2xs font-medium text-foreground",
              value: scene.videoLength || 4,
              onChange: (e) => onUpdateField?.(scene.id, "videoLength", Number(e.target.value)),
              onClick: (e) => e.stopPropagation(),
              disabled: isGeneratingAny || !onUpdateField
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "aspect-video bg-muted rounded cursor-pointer relative group/image overflow-hidden border-2 transition-colors border-primary border-solid",
            onClick: () => {
              if (hasImage && resolvedImageUrl) {
                setPreviewItem({ type: "image", url: resolvedImageUrl, name: t("director.preview.shotFrame", { index: scene.id + 1, frame: t("director.card.startFrame") }) });
              } else {
                firstFrameInputRef.current?.click();
              }
            },
            children: [
              hasImage && shouldRenderMedia ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  LocalImage,
                  {
                    src: resolvedImageUrl || "",
                    fallback: scene.imageHttpUrl || void 0,
                    alt: t("director.preview.shotFrame", { index: scene.id + 1, frame: t("director.card.startFrame") }),
                    className: "w-full h-full object-cover",
                    loading: "lazy",
                    decoding: "async"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 right-1 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDownloadImage(resolvedImageUrl || scene.imageDataUrl, `${t("director.preview.shot", { index: scene.id + 1 })}_${t("director.card.startFrame")}.png`);
                      },
                      className: "p-0.5 rounded bg-black/50 text-white hover:bg-blue-600",
                      title: t("director.card.downloadStart"),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveImage();
                      },
                      className: "p-0.5 rounded bg-black/50 text-white hover:bg-red-600",
                      title: t("director.card.deleteStart"),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ] }),
                scene.imageSource === "ai-generated" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0.5 left-0.5 text-2xs bg-primary text-white px-1 rounded", children: t("director.aiBadge") })
              ] }) : hasImage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center gap-1 bg-muted/60", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-4 w-4 text-muted-foreground/40" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground/50", children: "Đang tải ảnh" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 text-muted-foreground/50" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground/50", children: t("director.card.upload") })
              ] }),
              isImageGenerating && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 text-white animate-spin" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-white", children: [
                  "Đang tạo ",
                  imageElapsedSeconds,
                  "s"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      onStopImageGeneration?.(scene.id);
                    },
                    className: "mt-1 px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-2xs flex items-center gap-0.5 transition-colors",
                    title: t("director.card.stop"),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-2.5 w-2.5" }),
                      t("director.card.stop")
                    ]
                  }
                )
              ] }),
              (isImageQueued || isImagePreparing) && !isImageGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-white", children: isImagePreparing ? "Đang chuẩn bị ảnh" : t("director.pendingStatus") }) })
            ]
          }
        ),
        firstFrameInput
      ] }) }),
      referenceSlot ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex min-w-0 flex-1 flex-col gap-1 justify-end", isRefToVideo && "min-w-[220px]"), children: referenceSlot }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex min-w-0 flex-1 flex-col gap-1 justify-end", isRefToVideo && "min-w-[220px]"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CharacterSelector,
          {
            selectedIds: scene.characterIds || [],
            onChange: (ids) => onUpdateCharacters(scene.id, ids),
            disabled: isGeneratingAny
          }
        ),
        onUpdateSceneReference && /* @__PURE__ */ jsxRuntimeExports.jsx(
          SceneLibrarySelector,
          {
            sceneId: scene.id,
            selectedSceneLibraryId: scene.sceneLibraryId,
            onChange: (sceneLibId, refImage) => onUpdateSceneReference(scene.id, sceneLibId, refImage),
            disabled: isGeneratingAny
          }
        ),
        onUpdateField && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ShotReferenceSelector,
          {
            currentSceneId: scene.id,
            scenes: allScenes,
            selectedIndexes: scene.ref_image || [],
            onChange: (indexes) => onUpdateField(scene.id, "ref_image", indexes),
            disabled: isGeneratingAny
          }
        ),
        !isRefToVideo && onUploadImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
          MediaLibrarySelector,
          {
            sceneId: scene.id,
            onSelect: (imageUrl) => {
              onUploadImage(scene.id, imageUrl);
            },
            disabled: isGeneratingAny
          }
        )
      ] })
    ] }),
    hasIgnoredImageToVideoData && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-500/20 bg-amber-500/8 px-2.5 py-2 text-2xs text-amber-700 dark:text-amber-300", children: t("director.refToVideoIgnoredNotice") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1 text-2xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
        "rounded-full border px-2 py-0.5",
        generationMode === "imageVideo" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300" : generationMode === "textToVideo" ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" : generationMode === "imageOnly" ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-muted bg-muted/50 text-muted-foreground"
      ), children: t(`director.card.mode.${generationMode}`) }),
      !hasImagePrompt && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300", children: t("director.card.noImagePrompt") }),
      !hasVideoPrompt && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300", children: t("director.card.noVideoPrompt") })
    ] })
  ] });
}
function SplitSceneCardActions(props) {
  const {
    scene,
    resolvedImageUrl,
    shouldRenderMedia,
    canDragVideo,
    hasImage,
    hasImagePrompt,
    imageElapsedSeconds,
    videoElapsedSeconds,
    isRefToVideo,
    isGeneratingAny,
    isImageGenerating,
    isImagePreparing,
    isImageQueued,
    isVideoFailed,
    isVideoGenerating,
    isVideoModerationSkipped,
    isVideoPreparing,
    isVideoQueued,
    isVideoReady,
    setPreviewItem,
    onGenerateImage,
    onGenerateVideo,
    onStopImageGeneration,
    onStopVideoGeneration,
    handleVideoDragStart,
    t
  } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
    !isRefToVideo && hasImagePrompt && !hasImage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "default",
          className: "h-7 text-xs",
          onClick: () => onGenerateImage?.(scene.id),
          disabled: isGeneratingAny || isImageGenerating || isImagePreparing || isImageQueued,
          children: isImageGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }),
            "Đang tạo ",
            imageElapsedSeconds,
            "s"
          ] }) : isImagePreparing || isImageQueued ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: isImagePreparing ? "Đang chuẩn bị ảnh" : t("director.pendingStatus") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3 mr-1" }),
            t("director.card.generateImage")
          ] })
        }
      ),
      isImageGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "destructive",
          className: "h-7 text-xs px-2",
          onClick: () => onStopImageGeneration?.(scene.id),
          title: t("director.card.stop"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3 w-3" })
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: isVideoReady ? "outline" : "default",
          className: "h-7 text-xs",
          onClick: () => onGenerateVideo?.(scene.id),
          disabled: isGeneratingAny || isVideoGenerating || isVideoPreparing || isVideoQueued,
          children: isVideoGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }),
            t("director.card.generatingElapsed", { seconds: videoElapsedSeconds })
          ] }) : isVideoPreparing || isVideoQueued ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: isVideoPreparing ? "Đang chuẩn bị video" : t("director.pendingStatus") }) : isVideoReady ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3 mr-1" }),
            t("director.card.regenerate")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3 w-3 mr-1" }),
            t("director.card.generateVideo")
          ] })
        }
      ),
      isVideoGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "destructive",
          className: "h-7 text-xs px-2",
          onClick: () => onStopVideoGeneration?.(scene.id),
          title: t("director.card.stop"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3 w-3" })
        }
      )
    ] }),
    isVideoReady && scene.videoUrl && shouldRenderMedia && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex-1 aspect-video max-w-[120px] bg-muted rounded overflow-hidden cursor-pointer relative",
        onClick: () => setPreviewItem({ type: "video", url: scene.videoUrl, name: t("director.preview.shotVideo", { index: scene.id + 1 }) }),
        draggable: !!canDragVideo,
        onDragStart: handleVideoDragStart,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: scene.videoUrl, className: "w-full h-full object-cover", muted: true, preload: "none", poster: resolvedImageUrl || void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 text-white" }) })
        ]
      }
    ) }),
    isVideoFailed && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
      "text-xs flex items-center gap-1",
      isVideoModerationSkipped ? "text-amber-500" : "text-destructive"
    ), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3 w-3" }),
      isVideoModerationSkipped ? t("director.card.moderationSkipped") : scene.videoError || t("director.generationFailed")
    ] })
  ] }) });
}
function SplitSceneCardPrompts(props) {
  const {
    scene,
    showPromptDetails,
    setShowPromptDetails,
    editingPrompt,
    editPromptValue,
    setEditPromptValue,
    isRefToVideo,
    isGeneratingAny,
    buildResolvedPromptPreview,
    buildResolvedImagePromptPreview,
    startEditing,
    handleSavePrompt,
    handleCancelEdit,
    t
  } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setShowPromptDetails(!showPromptDetails),
        className: "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200", showPromptDetails && "rotate-90") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: t("director.card.prompts") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex flex-wrap items-center justify-end gap-1", children: [
            !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
              "text-2xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 border",
              scene.imagePrompt ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" : "bg-muted text-muted-foreground/40 border-transparent"
            ), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-2.5 w-2.5" }),
              " ",
              t("director.card.startFrame")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
              "text-2xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 border",
              scene.videoPrompt ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20" : "bg-muted text-muted-foreground/40 border-transparent"
            ), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-2.5 w-2.5" }),
              " ",
              t("director.card.video")
            ] })
          ] })
        ]
      }
    ),
    showPromptDetails ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[360px] space-y-2 overflow-y-auto pr-1 pl-1", children: [
      !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-l-[3px] border-blue-500 pl-3 py-1 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-2xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-3 w-3" }),
          t("director.card.startFramePrompt")
        ] }),
        editingPrompt === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editPromptValue,
              onChange: (e) => setEditPromptValue(e.target.value),
              className: "min-h-[150px] text-xs resize-none border-blue-500/30 focus-visible:ring-blue-500/30",
              placeholder: t("director.card.startFramePlaceholder"),
              autoFocus: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 justify-end mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleCancelEdit, className: "h-5 px-2 text-2xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-2.5 w-2.5 mr-0.5" }),
              t("director.cancel")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: handleSavePrompt, className: "h-5 px-2 text-2xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-2.5 w-2.5 mr-0.5" }),
              t("director.save")
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-start gap-2 cursor-pointer p-1.5 rounded bg-blue-500/5 hover:bg-blue-500/10 transition-colors border border-blue-500/10",
              onClick: () => !isGeneratingAny && startEditing("image"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground flex-1 line-clamp-6 min-h-[4.5em]", children: scene.imagePrompt || t("director.card.startFramePlaceholder") }),
                !isGeneratingAny && /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-2.5 w-2.5 text-blue-500/50 shrink-0 mt-0.5" })
              ]
            }
          ),
          scene.imagePrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-blue-500/15 bg-background/60 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-2xs font-medium text-blue-600 dark:text-blue-400", children: "Prompt gửi đi" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-32 whitespace-pre-wrap overflow-y-auto text-2xs leading-relaxed text-muted-foreground", children: buildResolvedImagePromptPreview(scene.imagePrompt) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-l-[3px] border-green-500 pl-3 py-1 space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-2xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3 w-3" }),
          t("director.card.videoPrompt")
        ] }),
        editingPrompt === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: editPromptValue,
              onChange: (e) => setEditPromptValue(e.target.value),
              className: "min-h-[150px] text-xs resize-none border-green-500/30 focus-visible:ring-green-500/30",
              placeholder: t("director.card.videoPlaceholder"),
              autoFocus: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 justify-end mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleCancelEdit, className: "h-5 px-2 text-2xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-2.5 w-2.5 mr-0.5" }),
              t("director.cancel")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: handleSavePrompt, className: "h-5 px-2 text-2xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-2.5 w-2.5 mr-0.5" }),
              t("director.save")
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-start gap-2 cursor-pointer p-1.5 rounded bg-green-500/5 hover:bg-green-500/10 transition-colors border border-green-500/10",
              onClick: () => !isGeneratingAny && startEditing("video"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-green-600 dark:text-green-400 flex-1 line-clamp-6 min-h-[4.5em]", children: scene.videoPrompt || t("director.card.videoPlaceholder") }),
                !isGeneratingAny && /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-2.5 w-2.5 text-green-500/50 shrink-0 mt-0.5" })
              ]
            }
          ),
          scene.videoPrompt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-green-500/15 bg-background/60 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-2xs font-medium text-green-600 dark:text-green-400", children: "Prompt gửi đi" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-32 whitespace-pre-wrap overflow-y-auto text-2xs leading-relaxed text-muted-foreground", children: buildResolvedPromptPreview(scene.videoPrompt) })
          ] })
        ] })
      ] })
    ] }) : (
      /* Collapsed summary view: colored icon labels with content preview */
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "space-y-0.5 rounded-lg border border-transparent bg-muted/20 p-1.5 transition-colors hover:border-muted hover:bg-muted/40 cursor-pointer",
          onClick: () => setShowPromptDetails(true),
          children: [
            !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xs truncate flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-2.5 w-2.5" }),
                " ",
                t("director.card.startFrame"),
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: scene.imagePrompt || t("director.card.unset") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xs truncate flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-2.5 w-2.5" }),
                " ",
                t("director.videoLabel"),
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: scene.videoPrompt || t("director.card.unset") })
            ] })
          ]
        }
      )
    )
  ] }) });
}
function SplitSceneCardComponent({
  scene,
  allVoices,
  voiceMode = "off",
  imageStylePrompt = "",
  onUpdateImagePrompt,
  onUpdateVideoPrompt,
  onUpdateCharacters,
  onUpdateSceneReference,
  referenceSlot,
  onDelete,
  onGenerateImage,
  onGenerateVideo,
  onRemoveImage,
  onUploadImage,
  onUpdateField,
  onStopImageGeneration,
  onStopVideoGeneration,
  imageStartedAt,
  videoStartedAt,
  isGeneratingAny,
  videoGenerationMode = "image-to-video",
  selectable = false,
  selected = false,
  onSelectedChange,
  allScenes = []
}) {
  const isRefToVideo = videoGenerationMode === "ref-to-video";
  const { t } = useI18n();
  const [editingPrompt, setEditingPrompt] = reactExports.useState("none");
  const [editPromptValue, setEditPromptValue] = reactExports.useState("");
  const [showPromptDetails, setShowPromptDetails] = reactExports.useState(false);
  const [shouldRenderMedia, setShouldRenderMedia] = reactExports.useState(false);
  const cardRef = reactExports.useRef(null);
  const firstFrameInputRef = reactExports.useRef(null);
  const { setPreviewItem } = usePreviewStore();
  const characters = useCharacterLibraryStore((state) => state.characters);
  const effectiveImageUrl = scene.imageDataUrl || scene.imageHttpUrl || "";
  const resolvedImageUrl = useResolvedImageUrl(shouldRenderMedia ? effectiveImageUrl : "");
  const isImageQueued = scene.imageStatus === "queued";
  const isImagePreparing = scene.imageStatus === "uploading";
  const isVideoQueued = scene.videoStatus === "queued";
  const isVideoPreparing = scene.videoStatus === "uploading";
  const characterIdentityBlock = (scene.characterIds || []).map((characterId) => {
    const character = characters.find((item) => item.id === characterId);
    if (!character) return null;
    const identity = character.identityPrompt || character.description || character.appearance || character.characterPrompt;
    if (!identity?.trim()) return null;
    return `- ${character.name}: ${identity.trim()}`;
  }).filter((line) => !!line).join("\n");
  const buildResolvedPromptPreview = (prompt) => {
    const basePrompt = prompt?.trim();
    if (!basePrompt) return "";
    if (!characterIdentityBlock) return basePrompt;
    return `Character identity lock:
${characterIdentityBlock}

Shot prompt:
${basePrompt}`;
  };
  const buildResolvedImagePromptPreview = (prompt) => {
    return buildResolvedPromptPreview([prompt?.trim(), imageStylePrompt.trim()].filter(Boolean).join(", "));
  };
  const startEditing = (type) => {
    if (type === "image") {
      setEditPromptValue(scene.imagePrompt || "");
    } else {
      setEditPromptValue(scene.videoPrompt || "");
    }
    setEditingPrompt(type);
  };
  const handleSavePrompt = () => {
    const langLabel = "English";
    if (editingPrompt === "image") {
      onUpdateImagePrompt(scene.id, editPromptValue);
      toast.success(t("director.card.startPromptUpdated", { index: scene.id + 1, language: langLabel }));
    } else if (editingPrompt === "video") {
      onUpdateVideoPrompt(scene.id, editPromptValue);
      toast.success(t("director.card.videoPromptUpdated", { index: scene.id + 1, language: langLabel }));
    }
    setEditingPrompt("none");
  };
  const handleCancelEdit = () => {
    setEditingPrompt("none");
    setEditPromptValue("");
  };
  const handleFirstFrameUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      onUploadImage?.(scene.id, dataUrl);
      toast.success(t("director.card.startUploaded", { index: scene.id + 1 }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleRemoveImage = () => {
    onRemoveImage?.(scene.id);
    toast.success(t("director.card.startRemoved", { index: scene.id + 1 }));
  };
  const handleDownloadImage = async (imageUrl, filename) => {
    try {
      let blob;
      if (imageUrl.startsWith("local-image://")) {
        const base64 = await readImageAsBase64(imageUrl);
        if (!base64) throw new Error("Unable to read local image");
        const res = await fetch(base64);
        blob = await res.blob();
      } else {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("director.card.downloadDone", { name: filename }));
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(t("director.card.downloadFailed"));
    }
  };
  const isImageGenerating = scene.imageStatus === "generating";
  const isVideoReady = scene.videoStatus === "completed" && scene.videoUrl;
  const isVideoGenerating = scene.videoStatus === "generating";
  const isVideoFailed = scene.videoStatus === "failed";
  const isVideoModerationSkipped = isVideoFailed && scene.videoError?.startsWith("MODERATION_SKIPPED:");
  const hasImage = !!effectiveImageUrl;
  const hasImagePrompt = !!scene.imagePrompt?.trim();
  const hasVideoPrompt = !!scene.videoPrompt?.trim();
  const generationMode = hasImagePrompt && hasVideoPrompt ? "imageVideo" : hasImagePrompt ? "imageOnly" : hasVideoPrompt ? "textToVideo" : "noPrompts";
  const canDragVideo = isVideoReady && scene.videoUrl;
  const hasIgnoredImageToVideoData = isRefToVideo && (hasImage || !!scene.imagePrompt);
  const now = useNow(isImageGenerating || isVideoGenerating);
  reactExports.useEffect(() => {
    if (shouldRenderMedia) return;
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShouldRenderMedia(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderMedia(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRenderMedia]);
  const imageElapsedSeconds = imageStartedAt ? Math.max(0, Math.floor((now - imageStartedAt) / 1e3)) : 0;
  const videoElapsedSeconds = videoStartedAt ? Math.max(0, Math.floor((now - videoStartedAt) / 1e3)) : scene.videoProgress;
  const handleVideoDragStart = (e) => {
    if (!canDragVideo || !scene.videoUrl) return;
    const dragData = {
      id: scene.videoMediaId || `scene-${scene.id}-video`,
      type: "video",
      name: t("director.preview.aiShotVideo", { index: scene.id + 1 }),
      url: scene.videoUrl,
      thumbnailUrl: scene.imageDataUrl,
      duration: 5
    };
    e.dataTransfer.setData("application/x-media-item", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "copy";
    const dragImage = document.createElement("div");
    dragImage.className = "bg-primary text-white px-2 py-1 rounded text-xs";
    dragImage.textContent = t("director.preview.shotVideo", { index: scene.id + 1 });
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };
  const firstFrameInput = /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      ref: firstFrameInputRef,
      type: "file",
      accept: "image/*",
      className: "hidden",
      onChange: handleFirstFrameUpload
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: cardRef, className: "group relative border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SplitSceneCardHeader,
      {
        scene,
        allVoices,
        voiceMode,
        effectiveImageUrl,
        isGeneratingAny,
        selectable,
        selected,
        onSelectedChange,
        onDelete,
        t
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SplitSceneCardFrame,
        {
          scene,
          allScenes,
          referenceSlot,
          firstFrameInput,
          firstFrameInputRef,
          resolvedImageUrl,
          shouldRenderMedia,
          generationMode,
          hasImage,
          hasImagePrompt,
          hasVideoPrompt,
          hasIgnoredImageToVideoData,
          imageElapsedSeconds,
          isRefToVideo,
          isGeneratingAny,
          isImageGenerating,
          isImagePreparing,
          isImageQueued,
          setPreviewItem,
          onUpdateCharacters,
          onUpdateSceneReference,
          onUpdateField,
          onUploadImage,
          onStopImageGeneration,
          handleDownloadImage,
          handleRemoveImage,
          t
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SplitSceneCardActions,
        {
          scene,
          resolvedImageUrl,
          shouldRenderMedia,
          canDragVideo,
          hasImage,
          hasImagePrompt,
          imageElapsedSeconds,
          videoElapsedSeconds,
          isRefToVideo,
          isGeneratingAny,
          isImageGenerating,
          isImagePreparing,
          isImageQueued,
          isVideoFailed,
          isVideoGenerating,
          isVideoModerationSkipped,
          isVideoPreparing,
          isVideoQueued,
          isVideoReady,
          setPreviewItem,
          onGenerateImage,
          onGenerateVideo,
          onStopImageGeneration,
          onStopVideoGeneration,
          handleVideoDragStart,
          t
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SplitSceneCardPrompts,
        {
          scene,
          showPromptDetails,
          setShowPromptDetails,
          editingPrompt,
          editPromptValue,
          setEditPromptValue,
          isRefToVideo,
          isGeneratingAny,
          buildResolvedPromptPreview,
          buildResolvedImagePromptPreview,
          startEditing,
          handleSavePrompt,
          handleCancelEdit,
          t
        }
      )
    ] })
  ] });
}
const areVoiceListsEqual = (prev, next) => {
  if (prev === next) return true;
  if (!prev || !next || prev.length !== next.length) return false;
  return prev.every((voice, index) => voice.voiceId === next[index].voiceId && voice.active === next[index].active);
};
const SplitSceneCard = React.memo(SplitSceneCardComponent, (prev, next) => {
  return prev.scene === next.scene && prev.resolvedVoice === next.resolvedVoice && areVoiceListsEqual(prev.allVoices, next.allVoices) && prev.voiceMode === next.voiceMode && prev.imageStylePrompt === next.imageStylePrompt && prev.promptLanguage === next.promptLanguage && prev.imageStartedAt === next.imageStartedAt && prev.videoStartedAt === next.videoStartedAt && prev.isGeneratingAny === next.isGeneratingAny && prev.videoGenerationMode === next.videoGenerationMode && prev.selectable === next.selectable && prev.selected === next.selected && prev.allScenes === next.allScenes && prev.referenceSlot === next.referenceSlot && prev.onUpdateImagePrompt === next.onUpdateImagePrompt && prev.onUpdateVideoPrompt === next.onUpdateVideoPrompt && prev.onUpdateCharacters === next.onUpdateCharacters && prev.onUpdateCharacterVariationMap === next.onUpdateCharacterVariationMap && prev.onUpdateSceneReference === next.onUpdateSceneReference && prev.onDelete === next.onDelete && prev.onSaveToLibrary === next.onSaveToLibrary && prev.onGenerateImage === next.onGenerateImage && prev.onGenerateVideo === next.onGenerateVideo && prev.onRemoveImage === next.onRemoveImage && prev.onUploadImage === next.onUploadImage && prev.onUpdateField === next.onUpdateField && prev.onStopImageGeneration === next.onStopImageGeneration && prev.onStopVideoGeneration === next.onStopVideoGeneration;
});
export {
  SplitSceneCard as S
};
