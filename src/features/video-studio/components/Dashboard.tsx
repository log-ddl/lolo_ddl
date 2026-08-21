"use client";

/**
 * Dashboard - Project List and Management
 * Features: create, open, rename, duplicate, batch select & delete
 */

import { useState, useCallback } from "react";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { switchProject } from "@/features/video-studio/lib/project-switcher";
import { useBatchQueueStore, selectProjectBatchStatus } from "@/features/video-studio/stores/batch-queue-store";
import { BatchQueuePanel } from "@/features/video-studio/components/BatchQueuePanel";
import { Progress } from "@/shared/components/ui/progress";
import { Loader2, CircleCheck, CircleX, Circle, Pause, CalendarClock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Plus,
  Trash2,
  FolderOpen,
  Clock,
  Film,
  X,
  MoreVertical,
  Pencil,
  Copy,
  CheckSquare,
} from "lucide-react";
import { cn, generateUUID } from "@/shared/lib/utils";
import { toast } from "sonner";
import type { Project } from "@/features/video-studio/stores/project-store";
import { useI18n } from "@/shared/i18n";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";


export function Dashboard() {
  const { projects, createProject, deleteProject, renameProject } = useProjectStore();
  const { setActiveTab } = useMediaPanelStore();
  const { locale, t } = useI18n();
  const batchEntries = useBatchQueueStore((s) => s.entries);
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  // Rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Duplicate loading
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Sort projects by updatedAt descending
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  // ==================== Create / Open ====================

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
      await switchProject(project.id);
      setActiveTab("overview");
    }
  };

  const handleOpenProject = async (projectId: string) => {
    if (selectionMode) return; // Don't open in selection mode
    await switchProject(projectId);
    setActiveTab("overview");
  };

  // ==================== Selection ====================

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set()); // Clear on exit
      return !prev;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  }, [projects, selectedIds.size]);

  // ==================== Batch Delete ====================

  const handleBatchDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteProject(id));
    toast.success(t("dashboard.toast.deletedProjects", { count: selectedIds.size }));
    setSelectedIds(new Set());
    setBatchDeleteConfirm(false);
    setSelectionMode(false);
  }, [deleteProject, selectedIds, t]);

  // ==================== Rename ====================

  const openRenameDialog = useCallback((id: string, name: string) => {
    setRenameTarget({ id, name });
    setRenameValue(name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!renameTarget || !renameValue.trim()) return;
    renameProject(renameTarget.id, renameValue.trim());
    setRenameDialogOpen(false);
    setRenameTarget(null);
    toast.success(t("dashboard.toast.renamed"));
  }, [renameProject, renameTarget, renameValue, t]);

  // ==================== Duplicate ====================

  const handleDuplicate = useCallback(async (projectId: string) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;

    setDuplicatingId(projectId);

    try {
      const fs = window.fileStorage;
      if (!fs) {
        toast.warning(t("dashboard.toast.storageUnavailable"));
        setDuplicatingId(null);
        return;
      }

      // STEP 1: Ensure source project data is persisted to disk.
      // Per-project files (_p/{pid}/*.json) only exist after a store's setItem is called.
      // If data was loaded from legacy storage but never modified, the per-project files
      // won't exist. Force a switchProject to trigger rehydrate → state merge → persist write.
      const currentPid = useProjectStore.getState().activeProjectId;
      if (currentPid === projectId) {
        // switchProject would no-op for same ID. Temporarily deactivate to force full cycle.
        useProjectStore.getState().setActiveProject(null);
      }
      await switchProject(projectId);
      // Wait for all async IPC persist writes to complete
      await new Promise(r => setTimeout(r, 500));

      // STEP 2: Generate new project ID BEFORE creating the project entry.
      // CRITICAL: Do NOT call createProject() here — it would change
      // project-store's activeProjectId, which affects getActiveProjectId() used by
      // all storage adapters. Any pending persist writes could then route to the
      // wrong per-project file, overwriting the copied data.
      const newProjectId = generateUUID();
      const newProjectName = `${source.name} (${t("dashboard.duplicateSuffix")})`;

      // STEP 3: Copy per-project files with project ID rewriting.
      // activeProjectId still points to the source project during this step.
      const KNOWN_STORES = [
        'director', 'script', 'sclass', 'timeline',   // createProjectScopedStorage
        'characters', 'media', 'scenes',               // createSplitStorage (per-project portion)
      ];

      let copiedCount = 0;
      let keysToCopy: string[] = await fs.listKeys?.(`_p/${projectId}`) ?? [];
      console.log(`[Duplicate] listKeys('_p/${projectId}') → ${keysToCopy.length} keys:`, keysToCopy);

      if (keysToCopy.length === 0) {
        keysToCopy = KNOWN_STORES.map(s => `_p/${projectId}/${s}`);
        console.log('[Duplicate] Fallback to known store names');
      }

      for (const key of keysToCopy) {
        const rawData = await fs.getItem(key);
        if (!rawData) continue;

        // Rewrite activeProjectId so the new project's merge() keys data correctly.
        let dataToWrite = rawData;
        try {
          const parsed = JSON.parse(rawData);
          const state = parsed?.state ?? parsed;

          if (state && typeof state === 'object') {
            if (state.activeProjectId === projectId) {
              state.activeProjectId = newProjectId;
            }
            // Handle legacy format where projects is a dict keyed by projectId
            if (state.projects && typeof state.projects === 'object' && state.projects[projectId]) {
              state.projects[newProjectId] = state.projects[projectId];
              delete state.projects[projectId];
            }
          }
          dataToWrite = JSON.stringify(parsed);
        } catch {
          console.warn(`[Duplicate] Could not parse ${key}, copying raw`);
        }

        const newKey = key.replace(`_p/${projectId}`, `_p/${newProjectId}`);
        await fs.setItem(newKey, dataToWrite);
        copiedCount++;
        console.log(`[Duplicate] Copied: ${key} → ${newKey}`);
      }

      // STEP 4: NOW add the project entry to project-store (after all files are copied).
      // Use setState directly to add the project WITHOUT changing activeProjectId.
      // This prevents any persist writes from being routed to the new project's files
      // before the copy is fully complete.
      const newProject: Project = {
        id: newProjectId,
        name: newProjectName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      useProjectStore.setState((state) => ({
        projects: [newProject, ...state.projects],
      }));

      if (copiedCount > 0) {
        toast.success(t("dashboard.toast.duplicated", { name: source.name, count: copiedCount }));
      } else {
        toast.warning(t("dashboard.toast.duplicateNameOnly"));
      }

      // STEP 5: Reset activeProjectId so the next project open triggers a full switchProject.
      useProjectStore.getState().setActiveProject(null);
    } catch (err) {
      console.error('[Duplicate] Failed:', err);
      toast.error(t("dashboard.toast.duplicateFailed", { message: (err as Error).message }));
    } finally {
      setDuplicatingId(null);
    }
  }, [projects, t]);

  // ==================== Helpers ====================

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return t("time.justNow");
    if (diff < 3600000) return t("time.minutesAgo", { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t("time.hoursAgo", { count: Math.floor(diff / 3600000) });
    if (diff < 604800000) return t("time.daysAgo", { count: Math.floor(diff / 86400000) });
    
    return new Date(timestamp).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background px-5">
        <div className="flex min-w-0 items-center gap-3">
          <FeatureHeaderIcon icon={Film} />
          <span className="truncate text-sm font-semibold">{t("appHome.videoStudio.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              <CheckSquare className="w-4 h-4 mr-1.5" />
              {selectionMode ? t("dashboard.selection.exit") : t("dashboard.selection.manage")}
            </Button>
          )}
          <Button
            onClick={() => setShowNewProject(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("dashboard.newProject")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 scrollbar-thin">
        <div className="max-w-[1440px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1 tracking-tight">{t("dashboard.myProjects")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.projectCount", { count: projects.length })}
                {selectionMode && selectedIds.size > 0 && (
                  <span className="text-primary ml-2">· {t("dashboard.selectedCount", { count: selectedIds.size })}</span>
                )}
              </p>
            </div>

            {/* Selection toolbar */}
            {selectionMode && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {allSelected ? t("dashboard.clearSelection") : t("dashboard.selectAll")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => setBatchDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {t("dashboard.deleteSelected", { count: selectedIds.size })}
                </Button>
              </div>
            )}
          </div>

          {/* New Project Input */}
          {showNewProject && (
            <div className="mb-6 p-4 bg-card/80 border border-border/50 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Input
                  placeholder={t("dashboard.projectNamePlaceholder")}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                  {t("dashboard.create")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNewProject(false);
                    setNewProjectName("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Batch queue dashboard */}
          {!selectionMode && <BatchQueuePanel />}

          {/* Project Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sortedProjects.map((project) => {
              const isSelected = selectedIds.has(project.id);
              const isDuplicating = duplicatingId === project.id;
              const batchStatus = selectProjectBatchStatus(batchEntries, project.id);

              return (
                <div
                  key={project.id}
                  className={cn(
                    "group relative bg-card/80 border rounded-xl overflow-hidden transition-all duration-300",
                    selectionMode
                      ? isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-sm cursor-pointer"
                        : "border-border/50 cursor-pointer hover:border-border"
                      : "border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                  )}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(project.id);
                    } else {
                      handleOpenProject(project.id);
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(project.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                  )}

                  {/* Project Thumbnail */}
                  <div className="h-32 bg-muted/30 flex items-center justify-center">
                    <Film className="w-10 h-10 text-muted-foreground/30" />
                    {batchStatus && (
                      <div className="absolute top-2 right-2 z-10">
                        <BatchStatusBadge status={batchStatus.status} label={batchStatusLabel(batchStatus.status)} />
                      </div>
                    )}
                    {isDuplicating && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    )}
                  </div>

                  {/* Batch progress strip */}
                  {batchStatus && (batchStatus.status === "running" || batchStatus.progress > 0) && (
                    <div className="px-3.5 pt-2">
                      <div className="flex items-center gap-2">
                        <Progress value={batchStatus.progress} className="h-1.5 flex-1" />
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {Math.round(batchStatus.progress)}%
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[10px] text-muted-foreground">
                        {batchStatus.message || batchStatusLabel(batchStatus.status)}
                      </div>
                    </div>
                  )}

                  {/* Scheduled-start hint for a queued project */}
                  {batchStatus?.status === "pending" && batchStatus.scheduledAt && (
                    <div className="flex items-center gap-1 px-3.5 pt-2 text-[10px] text-primary">
                      <CalendarClock className="h-3 w-3" />
                      Hẹn {formatBatchSchedule(batchStatus.scheduledAt)}
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="p-3.5">
                    <h3 className="font-medium text-foreground truncate mb-1.5">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>

                      {/* Actions menu (hidden in selection mode) */}
                      {!selectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted text-muted-foreground transition-all"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openRenameDialog(project.id, project.name)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              {t("dashboard.rename")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(project.id)}
                              disabled={isDuplicating}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              {t("dashboard.duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                deleteProject(project.id);
                                toast.success(t("dashboard.toast.deletedSingle", { name: project.name }));
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("dashboard.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  {/* Hover Overlay */}
                  {!selectionMode && (
                    <>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 shadow-md">
                          <FolderOpen className="w-4 h-4" />
                          {t("dashboard.openProject")}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-xl bg-muted/40 flex items-center justify-center mb-6">
                  <Film className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
                  {t("dashboard.emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-xs">
                  {t("dashboard.emptyDescription")}
                </p>
                <Button variant="primary" onClick={() => setShowNewProject(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.newProject")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== Rename Dialog ==================== */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.renameProject")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            placeholder={t("dashboard.newNamePlaceholder")}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Batch Delete Confirm Dialog ==================== */}
      <Dialog open={batchDeleteConfirm} onOpenChange={setBatchDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.confirmBatchDelete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.batchDeleteMessage", { count: selectedIds.size })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteConfirm(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleBatchDelete}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Batch status helpers ====================

type BatchCardStatus = "pending" | "running" | "done" | "failed" | "paused";

function batchStatusLabel(status: BatchCardStatus): string {
  switch (status) {
    case "pending": return "Đang chờ";
    case "running": return "Đang chạy";
    case "done": return "Xong";
    case "failed": return "Lỗi";
    case "paused": return "Tạm dừng";
  }
}

function formatBatchSchedule(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function BatchStatusBadge({ status, label }: { status: BatchCardStatus; label: string }) {
  const meta: Record<BatchCardStatus, { className: string; Icon: typeof Circle }> = {
    pending: { className: "bg-muted text-muted-foreground", Icon: Circle },
    running: { className: "bg-sky-600 text-white", Icon: Loader2 },
    done: { className: "bg-green-600 text-white", Icon: CircleCheck },
    failed: { className: "bg-red-600 text-white", Icon: CircleX },
    paused: { className: "bg-amber-500 text-white", Icon: Pause },
  };
  const { className, Icon } = meta[status];
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm", className)}>
      <Icon className={cn("h-3 w-3", status === "running" && "animate-spin")} />
      {label}
    </span>
  );
}
