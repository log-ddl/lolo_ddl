"use client";

/**
 * Scene Gallery - Middle column
 * Folder navigation, breadcrumb, and scene card grid.
 *
 * Image generation / upload / Google Flow sync live in ./use-scene-images;
 * the card and context menus are in ./scene-card and ./scene-context-menus.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  useSceneStore,
  type Scene,
  type SceneFolder,
} from "@/features/video-studio/stores/scene-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useGoogleFlowRuntimeStore } from "@/features/video-studio/stores/google-flow-runtime-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Folder,
  ChevronRight,
  Home,
  MapPin,
  Grid2X2,
  List,
  Search,
  Loader2,
  Square,
  Sparkles,
  FileUp,
  FileDown,
  Images,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { ImagePreviewModal } from "@/features/video-studio/components/panels/director/media-preview-modal";
import { useI18n } from "@/shared/i18n";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { getScenePromptSource } from "@/features/video-studio/lib/scene-image-prompt";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
import {
  getGoogleFlowSyncProgress,
  useGoogleFlowSyncScopes,
} from "@/features/video-studio/hooks/use-google-flow-sync-status";
import type { ViewMode } from "./gallery-helpers";
import { SceneCard } from "./scene-card";
import { FolderContextMenu, SceneContextMenu } from "./scene-context-menus";
import { useSceneImageGeneration } from "./use-scene-images";

interface SceneGalleryProps {
  onSceneSelect: (scene: Scene | null) => void;
  selectedSceneId: string | null;
  onImportCsv: (file: File) => Promise<void>;
  onExportCsv: () => void;
}

export function SceneGallery({ onSceneSelect, selectedSceneId, onImportCsv, onExportCsv }: SceneGalleryProps) {
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
    selectScene,
  } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeProjectId = useScriptStore((state) => state.activeProjectId);
  const flowBindingProjectId = useProjectStore((state) => state.activeProjectId) || activeProjectId || 'default-project';
  const activeProject = useProjectStore((state) => state.activeProject);
  const googleFlowReadyAccountCount = useGoogleFlowRuntimeStore((state) => state.status?.readyCredentialCount || 0);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<SceneFolder | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageFillInputRef = useRef<HTMLInputElement>(null);
  const { scopes: googleFlowSyncScopes, refreshBindings: refreshGoogleFlowBindings } = useGoogleFlowSyncScopes(
    flowBindingProjectId,
    true,
  );

  useEffect(() => {
    void initializeGoogleFlowRuntime();
  }, [initializeGoogleFlowRuntime]);

  const visibleFolders = useMemo(() => {
    if (resourceSharing.shareScenes) return folders;
    if (!activeProjectId) return [];
    return folders.filter((f) => f.projectId === activeProjectId);
  }, [folders, resourceSharing.shareScenes, activeProjectId]);

  const visibleScenes = useMemo(() => {
    let items: Scene[];
    if (resourceSharing.shareScenes) {
      items = scenes;
    } else if (!activeProjectId) {
      items = [];
    } else {
      items = scenes.filter((s) => s.projectId === activeProjectId);
    }
    return items;
  }, [scenes, resourceSharing.shareScenes, activeProjectId]);

  // Current folder's subfolders
  const subFolders = useMemo(() => 
    visibleFolders.filter(f => f.parentId === currentFolderId),
    [visibleFolders, currentFolderId]
  );

  const rootScenes = useMemo(() => {
    let items = visibleScenes.filter(s => (s.folderId ?? null) === currentFolderId);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.scenePrompt?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [visibleScenes, currentFolderId, searchQuery]);

  const toggleSceneSelection = (sceneId: string, checked: boolean) => {
    setSelectedSceneIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(sceneId);
      else next.delete(sceneId);
      return next;
    });
  };

  const sceneImageBatchTargets = useMemo(
    () => visibleScenes.filter((scene) => !scene.referenceImage && !!getScenePromptSource(scene)),
    [visibleScenes]
  );

  const sceneFlowSyncById = useMemo(() => new Map(
    visibleScenes.map((scene) => [
      scene.id,
      getGoogleFlowSyncProgress(
        [scene.referenceImage, scene.referenceImageBase64],
        scene.googleFlowMediaIdsBySource,
        googleFlowSyncScopes,
      ),
    ]),
  ), [googleFlowSyncScopes, visibleScenes]);
  const missingGoogleFlowMediaCount = useMemo(
    () => [...sceneFlowSyncById.values()].reduce((total, progress) => total + progress.missing, 0),
    [sceneFlowSyncById],
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
    handleSyncGoogleFlowReferences,
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
    t,
  });

  
  // Final visible scene list with hierarchy depth.
  const currentScenes = useMemo(() => {
    return rootScenes.map((scene) => ({ scene, depth: 0 }));
  }, [rootScenes]);

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path: SceneFolder[] = [];
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

  useEffect(() => {
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
    const projectId = resourceSharing.shareScenes ? undefined : activeProjectId || undefined;
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

  const handleDeleteFolder = (id: string) => {
    if (confirm("Delete this folder? Scenes inside it will be moved to the parent folder.")) {
      deleteFolder(id);
      toast.success(t("scenes.folderDeleted"));
    }
  };

  const handleDeleteScene = (scene: Scene) => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(scene.id);
      if (selectedSceneId === scene.id) {
        onSceneSelect(null);
      }
      toast.success(t("scenes.deleted"));
    }
  };

  const handleSceneClick = (scene: Scene) => {
    if (selectedSceneId === scene.id) {
      selectScene(null);
      onSceneSelect(null);
    } else {
      selectScene(scene.id);
      onSceneSelect(scene);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with breadcrumb and toolbar */}
      <div className="p-3 pb-2 border-b space-y-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1"
            onClick={() => setCurrentFolder(null)}
          >
            <Home className="h-3.5 w-3.5" />
            {t("scenes.libraryTitle")}
          </Button>
          {breadcrumbPath.map((folder) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setCurrentFolder(folder.id)}
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("scenes.search")}
              className="h-8 pl-7 text-sm"
            />
          </div>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                setIsImportingCsv(true);
                try {
                  await onImportCsv(file);
                } finally {
                  setIsImportingCsv(false);
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isImportingCsv}
              onClick={() => csvInputRef.current?.click()}
            >
              {isImportingCsv
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FileUp className="h-3.5 w-3.5" />}
              {t("scenes.importCsv")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={visibleScenes.length === 0}
              onClick={onExportCsv}
            >
              <FileDown className="h-3.5 w-3.5" />
              {t("scenes.exportCsv")}
            </Button>
            <input
              ref={imageFillInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.currentTarget.value = "";
                if (files.length > 0) void handleFillSceneImages(files);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isFillingImages || visibleScenes.every((scene) => !!scene.referenceImage || !!scene.referenceImageBase64)}
              onClick={() => imageFillInputRef.current?.click()}
            >
              {isFillingImages
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Images className="h-3.5 w-3.5" />}
              {t("scenes.fillImages")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isGeneratingAllImages || sceneImageBatchTargets.length === 0}
              onClick={handleGenerateAllSceneImages}
            >
              {isGeneratingAllImages ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isGeneratingAllImages
                ? t("scenes.generatingAllImages")
                : t("scenes.generateAllImages", { count: sceneImageBatchTargets.length })}
            </Button>
            {isGeneratingAllImages && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1"
                onClick={handleStopAllGenerateSceneImages}
              >
                <Square className="h-3.5 w-3.5" />
                Dừng tất cả
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isSyncingGoogleFlowReferences || googleFlowReadyAccountCount === 0 || missingGoogleFlowMediaCount === 0}
              onClick={() => void handleSyncGoogleFlowReferences()}
              title={t("scenes.syncFlowTitle")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncingGoogleFlowReferences && "animate-spin")} />
              {isSyncingGoogleFlowReferences
                ? t("scenes.syncingFlow", { count: googleFlowReadyAccountCount })
                : t("scenes.syncFlowMissing", { count: missingGoogleFlowMediaCount })}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-3 pb-32">
        {/* Folders */}
        {subFolders.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">{t("scenes.folders")}</div>
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-3 gap-2" 
                : "space-y-1"
            )}>
              {subFolders.map((folder) => (
                <FolderContextMenu
                  key={folder.id}
                  folder={folder}
                  onRename={() => {
                    setRenamingFolder(folder);
                    setRenameValue(folder.name);
                  }}
                  onDelete={() => handleDeleteFolder(folder.id)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      "hover:bg-accent",
                      viewMode === "grid" && "flex-col text-center"
                    )}
                    onDoubleClick={() => setCurrentFolder(folder.id)}
                  >
                    <Folder className={cn(
                      "text-yellow-500",
                      viewMode === "grid" ? "h-8 w-8" : "h-4 w-4"
                    )} />
                    <span className={cn(
                      "truncate",
                      viewMode === "grid" ? "text-xs w-full" : "text-sm flex-1"
                    )}>
                      {folder.name}
                    </span>
                  </div>
                </FolderContextMenu>
              ))}
            </div>
          </div>
        )}

        {/* Scenes */}
        {currentScenes.length > 0 ? (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              {t("scenes.count", { count: rootScenes.length })}
            </div>
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-3 gap-2" 
                : "space-y-1"
            )}>
              {currentScenes.map(({ scene, depth }) => {
                const childCount = 0;
                const isExpanded = false;
                const hasChildren = false;
                
                return (
                  <SceneContextMenu
                    key={scene.id}
                    scene={scene}
                    folders={visibleFolders}
                    onDelete={() => handleDeleteScene(scene)}
                    onMove={(folderId) => {
                      moveToFolder(scene.id, folderId);
                       toast.success(t("scenes.moved"));
                    }}
                  >
                    <SceneCard
                      scene={scene}
                      isSelected={selectedSceneId === scene.id}
                      viewMode={viewMode}
                      onClick={() => handleSceneClick(scene)}
                      depth={depth}
                      childCount={childCount}
                      isExpanded={isExpanded}
                      hasChildren={hasChildren}
                      onToggleExpand={undefined}
                      onImagePreview={(url) => { setPreviewImageUrl(url); setPreviewSceneId(scene.id); }}
                      selected={selectedSceneIds.has(scene.id)}
                      onSelectionChange={(checked) => toggleSceneSelection(scene.id, checked)}
                      onDeleteVisible={() => handleDeleteScene(scene)}
                      generating={generatingSceneIds.has(scene.id)}
                      generationSubmitted={Boolean(generatingStartedAtById[scene.id])}
                      generatingElapsedSeconds={generatingStartedAtById[scene.id] ? Math.max(0, Math.floor((now - generatingStartedAtById[scene.id]) / 1000)) : 0}
                      onGenerateImage={() => handleGenerateSceneImage(scene)}
                      onStopGenerateImage={() => handleStopGenerateSceneImage(scene.id)}
                      onUploadImage={(file) => handleUploadSceneImage(scene, file)}
                      flowSyncEnabled
                      flowSyncProgress={sceneFlowSyncById.get(scene.id)}
                      flowSyncOffline={googleFlowSyncScopes.length === 0}
                    />
                  </SceneContextMenu>
                );
              })}
            </div>
          </div>
        ) : (
          subFolders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                  {searchQuery ? t("scenes.noMatch") : t("scenes.noScenesYet")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                  {t("scenes.useConsole")}
                </p>
            </div>
          )
        )}
      </ScrollArea>

      {/* Image preview lightbox */}
      {previewImageUrl && (
        <ImagePreviewModal
          imageUrl={previewImageUrl}
          isOpen={true}
          onClose={() => { setPreviewImageUrl(null); setPreviewSceneId(null); }}
          onImageCleaned={(cleanedUrl) => {
            if (previewSceneId) {
              updateScene(previewSceneId, { referenceImage: cleanedUrl });
              setPreviewImageUrl(cleanedUrl);
            }
          }}
        />
      )}

      {/* New folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("scenes.createFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t("scenes.folderName")}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateFolder}>{t("overview.add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(open) => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("scenes.renameFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={t("scenes.folderName")}
            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRenameFolder}>{t("characters.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
