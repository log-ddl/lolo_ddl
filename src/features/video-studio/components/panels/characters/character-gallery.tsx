"use client";

/**
 * Character Gallery - Middle column
 * Folder navigation, breadcrumb, and character card grid.
 *
 * Image generation / upload / Google Flow sync live in ./use-character-images;
 * the card and context menus are in ./character-card and ./character-context-menus.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useCharacterLibraryStore, type Character, type CharacterFolder } from "@/features/video-studio/stores/character-library-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { useActiveScriptProject, useScriptStore } from "@/features/video-studio/stores/script-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useGoogleFlowRuntimeStore } from "@/features/video-studio/stores/google-flow-runtime-store";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
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
  User,
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
import { getGoogleFlowSyncProgress, useGoogleFlowSyncScopes } from "@/features/video-studio/hooks/use-google-flow-sync-status";
import type { ViewMode } from "./gallery-helpers";
import { CharacterCard } from "./character-card";
import { FolderContextMenu, CharacterContextMenu } from "./character-context-menus";
import { useCharacterImageGeneration } from "./use-character-images";

interface CharacterGalleryProps {
  onCharacterSelect: (character: Character | null) => void;
  selectedCharacterId: string | null;
  onImportCsv: (file: File) => Promise<void>;
  onExportCsv: () => void;
}

export function CharacterGallery({ onCharacterSelect, selectedCharacterId, onImportCsv, onExportCsv }: CharacterGalleryProps) {
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
    selectCharacter,
  } = useCharacterLibraryStore();
  const { getOrCreateCategoryFolder, addMediaFromUrl } = useMediaStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeProjectId = useScriptStore((state) => state.activeProjectId);
  const flowBindingProjectId = useProjectStore((state) => state.activeProjectId) || activeProjectId || 'default-project';
  const activeProject = useProjectStore((state) => state.activeProject);
  const googleFlowReadyAccountCount = useGoogleFlowRuntimeStore((state) => state.status?.readyCredentialCount || 0);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const { activeEpisodeIndex } = useMediaPanelStore();
  const scriptProject = useActiveScriptProject();
  const { scopes: googleFlowSyncScopes, refreshBindings: refreshGoogleFlowBindings } = useGoogleFlowSyncScopes(
    flowBindingProjectId,
    true,
  );

  // Episode-scope filtering.
  const hasEpisodeScope = activeEpisodeIndex != null;
  const activeEpisodeId = hasEpisodeScope
    ? scriptProject?.scriptData?.episodes.find(ep => ep.index === activeEpisodeIndex)?.id
    : undefined;
  const [episodeViewScope, setEpisodeViewScope] = useState<'all' | 'episode'>('episode');

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<CharacterFolder | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewCharacterId, setPreviewCharacterId] = useState<string | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<
    { type: 'folder'; id: string; name: string } | { type: 'character'; char: Character } | null
  >(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageFillInputRef = useRef<HTMLInputElement>(null);

  const visibleFolders = useMemo(() => {
    if (resourceSharing.shareCharacters) return folders;
    if (!activeProjectId) return [];
    return folders.filter((f) => f.projectId === activeProjectId);
  }, [folders, resourceSharing.shareCharacters, activeProjectId]);

  const visibleCharacters = useMemo(() => {
    let chars: Character[];
    if (resourceSharing.shareCharacters) {
      chars = characters;
    } else if (!activeProjectId) {
      chars = [];
    } else {
      chars = characters.filter((c) => c.projectId === activeProjectId);
    }
    // Episode filter: show only characters linked to this episode plus global characters without episode binding.
    if (hasEpisodeScope && episodeViewScope === 'episode' && activeEpisodeId) {
      chars = chars.filter(c => !c.linkedEpisodeId || c.linkedEpisodeId === activeEpisodeId);
    }
    return chars;
  }, [characters, resourceSharing.shareCharacters, activeProjectId, hasEpisodeScope, episodeViewScope, activeEpisodeId]);

  // Current folder's subfolders
  const subFolders = useMemo(() => 
    visibleFolders.filter(f => f.parentId === currentFolderId),
    [visibleFolders, currentFolderId]
  );

  // Current folder's characters
  const currentCharacters = useMemo(() => {
    let chars = visibleCharacters.filter(c => (c.folderId ?? null) === currentFolderId);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.characterPrompt?.toLowerCase().includes(query)
      );
    }
    return chars;
  }, [visibleCharacters, currentFolderId, searchQuery]);

  useEffect(() => {
    void initializeGoogleFlowRuntime();
  }, [initializeGoogleFlowRuntime]);

  const mergedDisplayItems = useMemo(() => {
    return currentCharacters.map((char) => ({ type: 'library' as const, char }));
  }, [currentCharacters]);

  const characterImageBatchTargets = useMemo(
    () => visibleCharacters.filter((character) => !character.thumbnailUrl),
    [visibleCharacters]
  );

  const characterFlowSyncById = useMemo(() => new Map(
    visibleCharacters.map((character) => [
      character.id,
      getGoogleFlowSyncProgress(
        [character.thumbnailUrl, ...(character.referenceImages || [])],
        character.googleFlowMediaIdsBySource,
        googleFlowSyncScopes,
      ),
    ]),
  ), [googleFlowSyncScopes, visibleCharacters]);
  const missingGoogleFlowMediaCount = useMemo(
    () => [...characterFlowSyncById.values()].reduce((total, progress) => total + progress.missing, 0),
    [characterFlowSyncById],
  );

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path: CharacterFolder[] = [];
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
    const projectId = resourceSharing.shareCharacters ? undefined : activeProjectId || undefined;
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

  const handleDeleteFolder = (id: string) => {
    const folder = getFolderById(id);
    setDeleteConfirm({ type: 'folder', id, name: folder?.name ?? '' });
  };

  const handleDeleteCharacter = (char: Character) => {
    setDeleteConfirm({ type: 'character', char });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'folder') {
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

  const handleCharacterClick = (char: Character) => {
    if (selectedCharacterId === char.id) {
      selectCharacter(null);
      onCharacterSelect(null);
    } else {
      selectCharacter(char.id);
      onCharacterSelect(char);
    }
  };

  const toggleCharacterSelection = (characterId: string, checked: boolean) => {
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
    handleSyncGoogleFlowReferences,
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
    t,
  });

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
            {t("characters.galleryTitle")}
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
                placeholder={t("characters.search")}
                className="h-8 pl-7 text-sm"
              />
            </div>
            {hasEpisodeScope && (
              <div className="flex border rounded-lg">
                <Button
                  variant={episodeViewScope === 'episode' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 rounded-r-none text-xs"
                  onClick={() => setEpisodeViewScope('episode')}
                >
                  {t("characters.thisEpisode")}
                </Button>
                <Button
                  variant={episodeViewScope === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 rounded-l-none text-xs"
                  onClick={() => setEpisodeViewScope('all')}
                >
                  {t("characters.fullSeries")}
                </Button>
              </div>
            )}
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
              {t("characters.importCsv")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={visibleCharacters.length === 0}
              onClick={onExportCsv}
            >
              <FileDown className="h-3.5 w-3.5" />
              {t("characters.exportCsv")}
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
                if (files.length > 0) void handleFillCharacterImages(files);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isFillingImages || visibleCharacters.every((character) => !!character.thumbnailUrl)}
              onClick={() => imageFillInputRef.current?.click()}
            >
              {isFillingImages
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Images className="h-3.5 w-3.5" />}
              {t("characters.fillImages")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isGeneratingAllImages || characterImageBatchTargets.length === 0}
              onClick={() => void handleGenerateAllImages()}
            >
              {isGeneratingAllImages
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />}
              {t("characters.createAll", { count: characterImageBatchTargets.length })}
            </Button>
            {isGeneratingAllImages && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1"
                onClick={handleStopAllGenerateImages}
              >
                <Square className="h-3.5 w-3.5" />
                {t("characters.stopAll")}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isSyncingGoogleFlowReferences || googleFlowReadyAccountCount === 0 || missingGoogleFlowMediaCount === 0}
              onClick={() => void handleSyncGoogleFlowReferences()}
              title={t("characters.syncFlowTitle")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncingGoogleFlowReferences && "animate-spin")} />
              {isSyncingGoogleFlowReferences
                ? t("characters.syncingFlow", { count: googleFlowReadyAccountCount })
                : t("characters.syncFlowMissing", { count: missingGoogleFlowMediaCount })}
            </Button>
            
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-3 pb-40">
        {/* Folders */}
        {subFolders.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">{t("characters.folders")}</div>
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

        {/* Characters */}
        {mergedDisplayItems.length > 0 ? (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              {t("characters.count", { count: mergedDisplayItems.length })}
            </div>
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-3 gap-2" 
                : "space-y-1"
            )}>
              {mergedDisplayItems.map((item) => {
                const char = item.char;
                return (
                  <CharacterContextMenu
                    key={char.id}
                    character={char}
                    folders={visibleFolders}
                    onDelete={() => handleDeleteCharacter(char)}
                    onMove={(folderId) => {
                      moveToFolder(char.id, folderId);
                      toast.success(t("characters.moved"));
                    }}
                  >
                    <CharacterCard
                      char={char}
                      viewMode={viewMode}
                      isSelected={selectedCharacterId === char.id}
                      isChecked={selectedCharacterIds.has(char.id)}
                      generating={generatingIds.has(char.id)}
                      submitted={Boolean(generatingStartedAtById[char.id])}
                      generatingElapsedSeconds={generatingStartedAtById[char.id]
                        ? Math.max(0, Math.floor((now - generatingStartedAtById[char.id]) / 1000))
                        : 0}
                      flowSyncProgress={characterFlowSyncById.get(char.id)}
                      flowSyncOffline={googleFlowSyncScopes.length === 0}
                      projectVisualStyleId={projectVisualStyleId}
                      onOpen={() => handleCharacterClick(char)}
                      onToggleSelection={(checked) => toggleCharacterSelection(char.id, checked)}
                      onPreview={(url) => { setPreviewImageUrl(url); setPreviewCharacterId(char.id); }}
                      onUploadImage={(file) => handleUploadCharacterImage(char, file)}
                      onGenerateImage={() => handleGenerateImage(char)}
                      onStopGenerate={() => handleStopGenerateImage(char.id)}
                      onDelete={() => handleDeleteCharacter(char)}
                      t={t}
                    />
                  </CharacterContextMenu>
                );
              })}
            </div>
          </div>
        ) : (
          subFolders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                  {searchQuery ? t("characters.noMatch") : t("characters.noCharactersYet")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                  {t("characters.useConsole")}
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
          onClose={() => { setPreviewImageUrl(null); setPreviewCharacterId(null); }}
          onImageCleaned={(cleanedUrl) => {
            if (previewCharacterId) {
              updateCharacter(previewCharacterId, { thumbnailUrl: cleanedUrl });
              setPreviewImageUrl(cleanedUrl);
            }
          }}
        />
      )}

      {/* New folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("characters.createFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t("characters.folderName")}
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.type === 'folder' ? t("characters.deleteFolder") : t("characters.deleteCharacter")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm
              ? deleteConfirm.type === 'folder'
                ? t("characters.deleteFolderConfirm", { name: deleteConfirm.name })
                : t("characters.deleteCharacterConfirm", { name: deleteConfirm.char.name })
              : ''}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {deleteConfirm?.type === 'folder' ? t("characters.deleteFolder") : t("characters.deleteCharacter")}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(open) => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("characters.renameFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={t("characters.folderName")}
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

