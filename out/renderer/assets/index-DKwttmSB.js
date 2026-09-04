import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { R as getFileType, S as getImageDimensions, T as generateVideoThumbnail, U as getMediaDuration, k as useMediaStore, d as useDirectorStore } from "./autopilot-store-5JX3PjC8.js";
import { bt as CloudUpload, F as Film, aZ as Sparkles, bn as Folder, P as Pencil, d as Trash2, S as Scissors, bm as FolderInput, b0 as House, D as Download, r as reactExports, O as ChevronRight, L as LoaderCircle, bu as FolderPlus, bp as List, bo as Grid2x2, bv as ArrowDown01, V as Video, b8 as Music, b9 as Image } from "./lucide-react-DHCwBhKI.js";
import { t as toast, a as useI18n, b as useVideoStudioSettingsStore, B as Button, T as TooltipProvider, U as Tooltip, V as TooltipTrigger, W as TooltipContent, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, I as Input, k as DialogFooter } from "./index-DI8hnspe.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-BC-MjFZS.js";
import { a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
import { b as usePreviewStore, u as useMediaPanelStore } from "./entry--3YkNZ1p.js";
import "./model-registry-B3C-u_uk.js";
import { T as TaskInfoButton } from "./task-info-button-6_NaUIsa.js";
import { C as ContextMenu, a as ContextMenuTrigger, b as ContextMenuContent, c as ContextMenuItem, d as ContextMenuSeparator, e as ContextMenuSub, f as ContextMenuSubTrigger, g as ContextMenuSubContent } from "./context-menu-Bq4i-VOF.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./progress-CiMxjjHG.js";
import "./popover-CDkCw224.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
import "./resizable-DC6gTyzy.js";
async function processMediaFiles(files, onProgress) {
  const fileArray = Array.from(files);
  const processedItems = [];
  const total = fileArray.length;
  let completed = 0;
  for (const file of fileArray) {
    const fileType = getFileType(file);
    if (!fileType) {
      toast.error(`Unsupported file type: ${file.name}`);
      continue;
    }
    const url = URL.createObjectURL(file);
    let thumbnailUrl;
    let duration;
    let width;
    let height;
    try {
      if (fileType === "image") {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      } else if (fileType === "video") {
        try {
          const videoInfo = await generateVideoThumbnail(file);
          thumbnailUrl = videoInfo.thumbnailUrl;
          width = videoInfo.width;
          height = videoInfo.height;
          duration = await getMediaDuration(file);
        } catch (error) {
          console.warn("Video processing failed", error);
          duration = await getMediaDuration(file);
        }
      } else if (fileType === "audio") {
        duration = await getMediaDuration(file);
      }
      processedItems.push({
        name: file.name,
        type: fileType,
        file,
        url,
        thumbnailUrl,
        duration,
        width,
        height,
        source: "upload"
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      completed += 1;
      if (onProgress) {
        const percent = Math.round(completed / total * 100);
        onProgress(percent);
      }
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      toast.error(`Processing failed: ${file.name}`);
      URL.revokeObjectURL(url);
    }
  }
  return processedItems;
}
const CATEGORY_ICONS = {
  "ai-image": Sparkles,
  "ai-video": Film,
  "upload": CloudUpload
};
function getFolderIcon(folder) {
  if (folder.isSystem && folder.category) {
    const IconComp = CATEGORY_ICONS[folder.category];
    if (IconComp) return IconComp;
  }
  return Folder;
}
function getFolderLabel(t, folder) {
  if (!folder.isSystem || !folder.category) return folder.name;
  const keyMap = {
    "ai-image": "media.system.aiImage",
    "ai-video": "media.system.aiVideo",
    "upload": "media.system.upload"
  };
  return t(keyMap[folder.category] || folder.name);
}
function FolderContextMenu({
  folder,
  children,
  onRename,
  onDelete
}) {
  const { t } = useI18n();
  if (folder.isSystem) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onRename(folder), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 mr-2" }),
        t("media.rename")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ContextMenuItem,
        {
          className: "text-destructive",
          onClick: () => onDelete(folder.id),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
            t("assets.deleteFolder")
          ]
        }
      )
    ] })
  ] });
}
function MediaItemWithContextMenu({
  item,
  children,
  folders,
  onRemove,
  onExport,
  onRename,
  onMove,
  onSmartSplit,
  onGenerateScenes
}) {
  const { t } = useI18n();
  const isImage = item.type === "image";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenu, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuTrigger, { children }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuContent, { children: [
      isImage && onSmartSplit && onGenerateScenes && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onSmartSplit(item), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4 mr-2 text-yellow-500" }),
          t("media.smartSplit")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onGenerateScenes(item), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-4 w-4 mr-2 text-blue-500" }),
          t("media.generateScenes")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onRename(item), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4 mr-2" }),
        t("media.rename")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSub, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderInput, { className: "h-4 w-4 mr-2" }),
          t("common.moveTo")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuSubContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onMove(item.id, null), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4 mr-2" }),
            t("media.root")
          ] }),
          folders.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onMove(item.id, f.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-4 w-4 mr-2" }),
            f.name
          ] }, f.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ContextMenuItem, { onClick: () => onExport(item), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
        t("media.export")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ContextMenuItem,
        {
          className: "text-destructive",
          onClick: (e) => onRemove(e, item.id),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-2" }),
            t("dashboard.delete")
          ]
        }
      )
    ] })
  ] });
}
function MediaView() {
  const { t } = useI18n();
  const {
    mediaFiles,
    folders,
    currentFolderId,
    addMediaFile,
    removeMediaFile,
    addFolder,
    renameFolder,
    deleteFolder,
    setCurrentFolder,
    renameMediaFile,
    moveToFolder
  } = useMediaStore();
  const { activeProject } = useProjectStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { setPreviewItem } = usePreviewStore();
  const { setStoryboardImage, setStoryboardStatus, setProjectFolderId } = useDirectorStore();
  const { setActiveTab } = useMediaPanelStore();
  const fileInputRef = reactExports.useRef(null);
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const [, setProgress] = reactExports.useState(0);
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [sortBy, setSortBy] = reactExports.useState("name");
  const [sortOrder, setSortOrder] = reactExports.useState("asc");
  const [newFolderDialogOpen, setNewFolderDialogOpen] = reactExports.useState(false);
  const [newFolderName, setNewFolderName] = reactExports.useState("");
  const [renameDialogOpen, setRenameDialogOpen] = reactExports.useState(false);
  const [renameTarget, setRenameTarget] = reactExports.useState(null);
  const visibleFolders = reactExports.useMemo(() => {
    if (resourceSharing.shareMedia) return folders;
    if (!activeProject) return [];
    return folders.filter((f) => f.isSystem || f.projectId === activeProject.id);
  }, [folders, resourceSharing.shareMedia, activeProject]);
  const visibleMediaFiles = reactExports.useMemo(() => {
    if (resourceSharing.shareMedia) return mediaFiles;
    if (!activeProject) return [];
    return mediaFiles.filter((m) => m.projectId === activeProject.id);
  }, [mediaFiles, resourceSharing.shareMedia, activeProject]);
  const { getOrCreateCategoryFolder } = useMediaStore();
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    if (!activeProject) {
      toast.error("No active project");
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    try {
      const uploadFolderId = currentFolderId || getOrCreateCategoryFolder("upload");
      const processedItems = await processMediaFiles(files, (p) => setProgress(p));
      for (const item of processedItems) {
        await addMediaFile(activeProject.id, { ...item, folderId: uploadFolderId });
      }
      toast.success(`Added ${processedItems.length} files`);
    } catch (error) {
      console.error("Error processing files:", error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
  const handleFileSelect = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleRemove = async (e, id) => {
    e.stopPropagation();
    if (!activeProject) {
      toast.error("No active project");
      return;
    }
    await removeMediaFile(activeProject.id, id);
    toast.success("Deleted");
  };
  const handlePreview = (item) => {
    if (!item.url) return;
    setPreviewItem({
      type: item.type === "video" ? "video" : "image",
      url: item.url,
      name: item.name
    });
  };
  const handleExport = async (item) => {
    if (!item.url) {
      toast.error("File URL is unavailable");
      return;
    }
    try {
      if (item.url.startsWith("local-image://") || item.url.startsWith("local-video://")) {
        if (typeof window !== "undefined" && window.electronAPI?.saveFileDialog) {
          const result = await window.electronAPI.saveFileDialog({
            localPath: item.url,
            defaultPath: item.name,
            filters: item.type === "video" ? [{ name: "Video", extensions: ["mp4", "webm", "mov"] }] : [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }]
          });
          if (result.success) {
            toast.success(`Exported: ${item.name}`);
          } else if (result.canceled) {
          } else if (result.error) {
            toast.error(`Export failed: ${result.error}`);
          }
          return;
        }
        toast.error("Restart the app to enable export");
        return;
      }
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Exported: ${item.name}`);
    } catch (error) {
      const err = error;
      toast.error(`Export failed: ${err.message}`);
    }
  };
  const handleSmartSplit = (item) => {
    if (item.type !== "image" || !item.url) return;
    if (item.folderId) {
      setProjectFolderId(item.folderId);
    }
    setStoryboardImage(item.url, item.id);
    setStoryboardStatus("preview");
    setActiveTab("director");
    toast.success("Image loaded. Click Split Scenes to start smart splitting.");
  };
  const handleGenerateScenes = (item) => {
    if (item.type !== "image" || !item.url) return;
    if (item.folderId) {
      setProjectFolderId(item.folderId);
    }
    setStoryboardImage(item.url, item.id);
    const { setSplitScenes, setStoryboardConfig } = useDirectorStore.getState();
    setStoryboardConfig({
      sceneCount: 1,
      storyPrompt: item.name
    });
    setSplitScenes([{
      id: 0,
      // Scene information
      sceneName: item.name,
      sceneLocation: "",
      // First frame
      imageDataUrl: item.url,
      imageHttpUrl: null,
      width: item.width || 1920,
      height: item.height || 1080,
      imagePrompt: "",
      imageStatus: "completed",
      imageProgress: 100,
      imageError: null,
      // Video
      videoPrompt: "",
      videoLength: 4,
      videoStatus: "idle",
      videoProgress: 0,
      videoUrl: null,
      videoError: null,
      videoMediaId: null,
      // Characters and emotions
      characterIds: [],
      emotionTags: [],
      // Script metadata
      dialogue: "",
      soundEffectText: "",
      // Video parameters
      ambientSound: "",
      soundEffects: [],
      // Position
      row: 0,
      col: 0,
      sourceRect: { x: 0, y: 0, width: item.width || 1920, height: item.height || 1080 }
    }]);
    setStoryboardStatus("editing");
    setActiveTab("director");
    toast.success("Shots created. You can start generating video now.");
  };
  const formatDuration = (duration) => {
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };
  const currentFolders = reactExports.useMemo(() => {
    return visibleFolders.filter((f) => f.parentId === currentFolderId);
  }, [visibleFolders, currentFolderId]);
  const { systemFolders, customFolders } = reactExports.useMemo(() => {
    if (currentFolderId !== null) {
      return { systemFolders: [], customFolders: currentFolders };
    }
    return {
      systemFolders: currentFolders.filter((f) => f.isSystem),
      customFolders: currentFolders.filter((f) => !f.isSystem)
    };
  }, [currentFolders, currentFolderId]);
  const folderFileCounts = reactExports.useMemo(() => {
    const counts = {};
    const getAllDescendantIds = (folderId) => {
      const children = visibleFolders.filter((f) => f.parentId === folderId);
      return [folderId, ...children.flatMap((c) => getAllDescendantIds(c.id))];
    };
    for (const folder of currentFolders) {
      const allIds = new Set(getAllDescendantIds(folder.id));
      counts[folder.id] = visibleMediaFiles.filter(
        (m) => !m.ephemeral && m.folderId && allIds.has(m.folderId)
      ).length;
    }
    return counts;
  }, [currentFolders, visibleFolders, visibleMediaFiles]);
  const breadcrumbPath = reactExports.useMemo(() => {
    const path = [];
    let current = currentFolderId;
    while (current) {
      const folder = visibleFolders.find((f) => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  }, [folders, currentFolderId]);
  reactExports.useEffect(() => {
    if (resourceSharing.shareMedia) return;
    const allowedIds = new Set(visibleFolders.map((f) => f.id));
    if (currentFolderId && !allowedIds.has(currentFolderId)) {
      setCurrentFolder(null);
    }
  }, [resourceSharing.shareMedia, visibleFolders, currentFolderId, setCurrentFolder]);
  const filteredMediaItems = reactExports.useMemo(() => {
    let filtered = visibleMediaFiles.filter(
      (item) => !item.ephemeral && (item.folderId || null) === currentFolderId
    );
    filtered.sort((a, b) => {
      let valueA;
      let valueB;
      switch (sortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "type":
          valueA = a.type;
          valueB = b.type;
          break;
        case "duration":
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
        case "size":
          valueA = a.file?.size || 0;
          valueB = b.file?.size || 0;
          break;
        default:
          return 0;
      }
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [visibleMediaFiles, sortBy, sortOrder, currentFolderId]);
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const projectId = resourceSharing.shareMedia ? void 0 : activeProject?.id;
    addFolder(newFolderName.trim(), currentFolderId, projectId);
    setNewFolderName("");
    setNewFolderDialogOpen(false);
    toast.success(`Created folder "${newFolderName}"`);
  };
  const handleRename = () => {
    if (!renameTarget || !renameTarget.name.trim()) return;
    if (renameTarget.type === "folder") {
      renameFolder(renameTarget.id, renameTarget.name.trim());
    } else {
      renameMediaFile(renameTarget.id, renameTarget.name.trim());
    }
    setRenameTarget(null);
    setRenameDialogOpen(false);
    toast.success("Renamed");
  };
  const handleDeleteFolder = (id) => {
    deleteFolder(id);
    toast.success("Folder deleted");
  };
  const handleMoveToFolder = (mediaId, folderId) => {
    moveToFolder(mediaId, folderId);
    toast.success("Moved");
  };
  const openRenameFolderDialog = (folder) => {
    setRenameTarget({ type: "folder", id: folder.id, name: folder.name });
    setRenameDialogOpen(true);
  };
  const openRenameFileDialog = (item) => {
    setRenameTarget({ type: "file", id: item.id, name: item.name });
    setRenameDialogOpen(true);
  };
  const renderPreview = (item) => {
    if (item.type === "image") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: item.url,
          alt: item.name,
          className: "w-full max-h-full object-cover",
          loading: "lazy"
        }
      ) });
    } else if (item.type === "video") {
      if (item.thumbnailUrl) {
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full h-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: item.thumbnailUrl,
              alt: item.name,
              className: "w-full h-full object-cover rounded",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/20 rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "h-6 w-6 text-white drop-shadow-md" }) }),
          item.duration && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded", children: formatDuration(item.duration) })
        ] });
      } else {
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "h-6 w-6 mb-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t("common.video") })
        ] });
      }
    } else if (item.type === "audio") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full bg-green-500/20 flex flex-col items-center justify-center text-muted-foreground rounded border border-green-500/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Music, { className: "h-6 w-6 mb-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: t("common.audio") }),
        item.duration && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs opacity-70", children: formatDuration(item.duration) })
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-6 w-6" }) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*,video/*,audio/*",
        multiple: true,
        className: "hidden",
        onChange: handleFileChange
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 pb-2 bg-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm", children: t("media.library") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("media.folderSummary", { folders: currentFolders.length, files: filteredMediaItems.length }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs mb-2 overflow-x-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setCurrentFolder(null),
            className: "hover:text-primary flex items-center gap-1 shrink-0",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-3 w-3" }),
              t("media.root")
            ]
          }
        ),
        breadcrumbPath.map((folder) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setCurrentFolder(folder.id),
              className: "hover:text-primary",
              children: getFolderLabel(t, folder)
            }
          )
        ] }, folder.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleFileSelect,
            disabled: isProcessing,
            className: "flex-1",
            children: [
              isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-4 w-4 mr-2" }),
              t("media.upload")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "icon",
              variant: "ghost",
              onClick: () => setNewFolderDialogOpen(true),
              className: "h-8 w-8",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderPlus, { className: "h-4 w-4" })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: "New Folder" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "icon",
              variant: "ghost",
              onClick: () => setViewMode(viewMode === "grid" ? "list" : "grid"),
              className: "h-8 w-8",
              children: viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Grid2x2, { className: "h-4 w-4" })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: viewMode === "grid" ? t("media.view.list") : t("media.view.grid") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown01, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
              setSortBy("name");
              setSortOrder("asc");
            }, children: [
              t("media.sort.name"),
              " ",
              sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
              setSortBy("type");
              setSortOrder("asc");
            }, children: [
              t("media.sort.type"),
              " ",
              sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
              setSortBy("duration");
              setSortOrder("asc");
            }, children: [
              t("media.sort.duration"),
              " ",
              sortBy === "duration" && (sortOrder === "asc" ? "↑" : "↓")
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex-1 overflow-y-auto p-3 pt-1 scrollbar-thin",
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        children: currentFolders.length === 0 && filteredMediaItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-12 w-12 mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: t("media.dropFiles") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: t("media.orUpload") })
        ] }) : viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          systemFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1.5 font-medium", children: t("media.categories") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "grid gap-2",
                style: { gridTemplateColumns: "repeat(auto-fill, 100px)" },
                children: systemFolders.map((folder) => {
                  const IconComp = getFolderIcon(folder);
                  const count = folderFileCounts[folder.id] || 0;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "cursor-pointer hover:opacity-80 transition-opacity",
                      onDoubleClick: () => setCurrentFolder(folder.id),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[100px] h-[100px] rounded overflow-hidden bg-primary/5 flex flex-col items-center justify-center border border-primary/20 hover:border-primary/50 gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(IconComp, { className: "h-8 w-8 text-primary/70" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
                            count,
                            " items"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1 truncate text-center font-medium", children: getFolderLabel(t, folder) })
                      ]
                    },
                    folder.id
                  );
                })
              }
            )
          ] }),
          (customFolders.length > 0 || filteredMediaItems.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            systemFolders.length > 0 && (customFolders.length > 0 || filteredMediaItems.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1.5 font-medium", children: currentFolderId === null ? t("media.customFolders") : t("media.content") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "grid gap-2",
                style: { gridTemplateColumns: "repeat(auto-fill, 100px)" },
                children: [
                  customFolders.map((folder) => {
                    const count = folderFileCounts[folder.id] || 0;
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FolderContextMenu,
                      {
                        folder,
                        onRename: openRenameFolderDialog,
                        onDelete: handleDeleteFolder,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "div",
                          {
                            className: "cursor-pointer hover:opacity-80 transition-opacity",
                            onDoubleClick: () => setCurrentFolder(folder.id),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[100px] h-[100px] rounded overflow-hidden bg-muted/50 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 gap-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-8 w-8 text-primary/70" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
                                  count,
                                  " items"
                                ] })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1 truncate text-center", children: getFolderLabel(t, folder) })
                            ]
                          }
                        )
                      },
                      folder.id
                    );
                  }),
                  filteredMediaItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MediaItemWithContextMenu,
                    {
                      item,
                      folders: visibleFolders,
                      onRemove: handleRemove,
                      onExport: handleExport,
                      onRename: openRenameFileDialog,
                      onMove: handleMoveToFolder,
                      onSmartSplit: handleSmartSplit,
                      onGenerateScenes: handleGenerateScenes,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "group cursor-pointer hover:opacity-80 transition-opacity relative",
                          onClick: () => handlePreview(item),
                          draggable: item.type === "video",
                          onDragStart: (e) => {
                            if (item.type === "video") {
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({
                                  type: "media",
                                  mediaType: item.type,
                                  mediaId: item.id,
                                  name: item.name,
                                  url: item.url,
                                  thumbnailUrl: item.thumbnailUrl,
                                  duration: item.duration || 5
                                })
                              );
                              e.dataTransfer.effectAllowed = "copy";
                            }
                          },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[100px] h-[100px] rounded overflow-hidden bg-muted relative", children: [
                              renderPreview(item),
                              item.source && item.source !== "upload" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-1 left-1 bg-primary/80 rounded p-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 text-white" }) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 right-1 flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100", onClick: (e) => e.stopPropagation(), children: [
                                item.source && item.source !== "upload" && /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { outputUrl: item.url, kind: item.type === "video" ? "video" : "image", title: t(item.type === "video" ? "taskInfo.video" : "taskInfo.image"), className: "h-6 w-6 bg-background/90" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "button",
                                  {
                                    type: "button",
                                    className: "rounded border bg-background/90 p-1 hover:bg-background",
                                    onClick: () => openRenameFileDialog(item),
                                    "aria-label": t("media.renameAsset"),
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" })
                                  }
                                )
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1 truncate", children: item.name })
                          ]
                        }
                      )
                    },
                    item.id
                  ))
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          systemFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground px-2 pt-1 font-medium", children: t("media.categories") }),
            systemFolders.map((folder) => {
              const IconComp = getFolderIcon(folder);
              const count = folderFileCounts[folder.id] || 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer",
                  onDoubleClick: () => setCurrentFolder(folder.id),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconComp, { className: "h-6 w-6 text-primary/70" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm truncate font-medium", children: getFolderLabel(t, folder) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        count,
                        " items"
                      ] })
                    ] })
                  ]
                },
                folder.id
              );
            })
          ] }),
          customFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            systemFolders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground px-2 pt-2 font-medium", children: t("media.customFolders") }),
            customFolders.map((folder) => {
              const count = folderFileCounts[folder.id] || 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                FolderContextMenu,
                {
                  folder,
                  onRename: openRenameFolderDialog,
                  onDelete: handleDeleteFolder,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer",
                      onDoubleClick: () => setCurrentFolder(folder.id),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded bg-muted/50 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-6 w-6 text-primary/70" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm truncate", children: getFolderLabel(t, folder) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                            count,
                            " items"
                          ] })
                        ] })
                      ]
                    }
                  )
                },
                folder.id
              );
            })
          ] }),
          filteredMediaItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            MediaItemWithContextMenu,
            {
              item,
              folders: visibleFolders,
              onRemove: handleRemove,
              onExport: handleExport,
              onRename: openRenameFileDialog,
              onMove: handleMoveToFolder,
              onSmartSplit: handleSmartSplit,
              onGenerateScenes: handleGenerateScenes,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer",
                  onClick: () => handlePreview(item),
                  draggable: item.type === "video",
                  onDragStart: (e) => {
                    if (item.type === "video") {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                          type: "media",
                          mediaType: item.type,
                          mediaId: item.id,
                          name: item.name,
                          url: item.url,
                          thumbnailUrl: item.thumbnailUrl,
                          duration: item.duration || 5
                        })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 relative", children: [
                      renderPreview(item),
                      item.source && item.source !== "upload" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0.5 left-0.5 bg-primary/80 rounded p-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-2 w-2 text-white" }) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm truncate", children: item.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        item.type,
                        item.duration && ` · ${formatDuration(item.duration)}`,
                        item.source && item.source !== "upload" && ` · ${t("media.aiGenerated")}`
                      ] })
                    ] }),
                    item.source && item.source !== "upload" && /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { outputUrl: item.url, kind: item.type === "video" ? "video" : "image", title: t(item.type === "video" ? "taskInfo.video" : "taskInfo.image") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        size: "icon",
                        variant: "ghost",
                        className: "h-7 w-7",
                        onClick: (e) => {
                          e.stopPropagation();
                          openRenameFileDialog(item);
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" })
                      }
                    )
                  ]
                }
              )
            },
            item.id
          ))
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: newFolderDialogOpen, onOpenChange: setNewFolderDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Folder" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: newFolderName,
          onChange: (e) => setNewFolderName(e.target.value),
          placeholder: t("media.folderName"),
          onKeyDown: (e) => e.key === "Enter" && handleCreateFolder(),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setNewFolderDialogOpen(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateFolder, children: t("overview.add") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: renameDialogOpen, onOpenChange: setRenameDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Rename" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: renameTarget?.name || "",
          onChange: (e) => setRenameTarget((prev) => prev ? { ...prev, name: e.target.value } : null),
          placeholder: t("media.newName"),
          onKeyDown: (e) => e.key === "Enter" && handleRename(),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRenameDialogOpen(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRename, children: t("common.confirm") })
      ] })
    ] }) })
  ] });
}
export {
  MediaView,
  MediaView as default
};
