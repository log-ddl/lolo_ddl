"use client";

/**
 * Storage tab: where project data lives on disk, cross-project resource
 * sharing, cache maintenance, and app updates.
 *
 * Relocating, linking or importing data all invalidate the renderer's cached
 * stores, so each of those paths clears localStorage + IndexedDB and reloads.
 */

import { useCallback, useEffect, useState } from "react";
import { Download, Folder, HardDrive, Info, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Switch } from "@/shared/components/ui/switch";
import { useLicenseStore } from "@/shared/stores/license-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import type { AvailableUpdateInfo } from "@/shared/types/update";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
}

/**
 * Drops the renderer's persisted store copies so the next load reads from the
 * new data directory instead of replaying stale state over it.
 */
function clearPersistedStoreCaches() {
  const keysToRemove = Object.keys(localStorage).filter(key =>
    key.startsWith('logdd-') || key.startsWith('longdd-') || key.includes('store')
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));

  try {
    const dbRequest = indexedDB.open('longdd-creator-db', 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (db.objectStoreNames.contains('zustand-storage')) {
        const tx = db.transaction('zustand-storage', 'readwrite');
        tx.objectStore('zustand-storage').clear();
      }
    };
  } catch (e) {
    console.warn('Failed to clear IndexedDB:', e);
  }
}

const LICENSE_BADGE_CLASS: Record<string, string> = {
  free: "text-muted-foreground bg-muted border-border",
  pro: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  unlimited: "text-success bg-success/10 border-success/20",
  dev: "text-violet-600 bg-violet-500/10 border-violet-500/20",
};

export interface StorageTabProps {
  appVersion: string;
  onUpdateAvailable: (update: AvailableUpdateInfo | null) => void;
}

export function StorageTab({ appVersion, onUpdateAvailable }: StorageTabProps) {
  const { t } = useI18n();
  const {
    resourceSharing,
    storagePaths,
    cacheSettings,
    updateSettings,
    setResourceSharing,
    setStoragePaths,
    setCacheSettings,
    setUpdateSettings,
  } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const { assignProjectToUnscoped: assignCharactersToProject } = useCharacterLibraryStore();
  const { assignProjectToUnscoped: assignScenesToProject } = useSceneStore();
  const { assignProjectToUnscoped: assignMediaToProject } = useMediaStore();
  const licensePlan = useLicenseStore((s) => s.plan);

  const [cacheSize, setCacheSize] = useState(0);
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  const hasStorageManager = typeof window !== "undefined" && !!window.storageManager;
  const hasAppUpdater = typeof window !== "undefined" && !!window.appUpdater;

  const refreshCacheSize = useCallback(async () => {
    if (!window.storageManager) return;
    setIsCacheLoading(true);
    try {
      const result = await window.storageManager.getCacheSize();
      setCacheSize(result.total || 0);
    } catch (error) {
      console.error("Failed to get cache size:", error);
    } finally {
      setIsCacheLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasStorageManager) return;
    window.storageManager
      ?.getPaths()
      .then((paths) => {
        if (paths.basePath) {
          setStoragePaths({ basePath: paths.basePath });
        }
      })
      .catch(() => {});
    refreshCacheSize();
  }, [hasStorageManager, refreshCacheSize, setStoragePaths]);

  useEffect(() => {
    if (!hasStorageManager || !window.storageManager) return;
    window.storageManager.updateConfig({
      autoCleanEnabled: cacheSettings.autoCleanEnabled,
      autoCleanDays: cacheSettings.autoCleanDays,
    });
  }, [cacheSettings.autoCleanEnabled, cacheSettings.autoCleanDays, hasStorageManager]);

  const handleToggleShareCharacters = async (checked: boolean) => {
    setResourceSharing({ shareCharacters: checked });
    if (!checked && activeProjectId) {
      assignCharactersToProject(activeProjectId);
    }
    // Rehydrate to load/unload other projects' data
    try { await useCharacterLibraryStore.persist.rehydrate(); } catch {}
  };

  const handleToggleShareScenes = async (checked: boolean) => {
    setResourceSharing({ shareScenes: checked });
    if (!checked && activeProjectId) {
      assignScenesToProject(activeProjectId);
    }
    try { await useSceneStore.persist.rehydrate(); } catch {}
  };

  const handleToggleShareMedia = async (checked: boolean) => {
    setResourceSharing({ shareMedia: checked });
    if (!checked && activeProjectId) {
      assignMediaToProject(activeProjectId);
    }
    try { await useMediaStore.persist.rehydrate(); } catch {}
  };

  const handleSelectStoragePath = async () => {
    if (!window.storageManager) {
      toast.error(t("settings.desktopOnly"));
      return;
    }
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    const result = await window.storageManager.moveData(dir);
    if (result.success) {
      setStoragePaths({ basePath: result.path || dir });
      clearPersistedStoreCaches();
      toast.success(t("settings.storageUpdated"));
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.moveFailed", { message: result.error || "Unknown error" }));
    }
  };

  const handleExportData = async () => {
    if (!window.storageManager) return;
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    const result = await window.storageManager.exportData(dir);
    if (result.success) {
      toast.success(t("settings.dataExported"));
    } else {
      toast.error(t("settings.exportFailed", { message: result.error || "Unknown error" }));
    }
  };

  const handleImportData = async () => {
    if (!window.storageManager) return;
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    if (!confirm(t("settings.confirmImport"))) return;
    const result = await window.storageManager.importData(dir);
    if (result.success) {
      clearPersistedStoreCaches();
      toast.success(t("settings.dataImported"));
      // Reload slightly later so cache clearing can finish first.
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.importFailed", { message: result.error || "Unknown error" }));
    }
  };

  const handleLinkData = async () => {
    if (!window.storageManager) {
      toast.error(t("settings.desktopOnly"));
      return;
    }
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;

    // Validate the directory first
    const validation = await window.storageManager.validateDataDir(dir);
    if (!validation.valid) {
      toast.error(validation.error || t("settings.invalidDataDirectory"));
      return;
    }

    // Confirm with user
    const confirmMsg = t("settings.linkDataConfirm", { projectCount: validation.projectCount || 0, mediaCount: validation.mediaCount || 0 });
    if (!confirm(confirmMsg)) return;

    const result = await window.storageManager.linkData(dir);
    if (result.success) {
      setStoragePaths({ basePath: result.path || dir });
      clearPersistedStoreCaches();
      toast.success(t("settings.linkedDataDir"));
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.operationFailed", { message: result.error || "Unknown error" }));
    }
  };

  const handleClearCache = async () => {
    if (!window.storageManager) return;
    setIsClearingCache(true);
    try {
      const result = await window.storageManager.clearCache();
      if (result.success) {
        toast.success(t("settings.cacheCleared"));
        refreshCacheSize();
      } else {
        toast.error(t("settings.clearFailed", { message: result.error || "Unknown error" }));
      }
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!window.appUpdater) {
      toast.error(t("settings.desktopOnly"));
      return;
    }

    setIsCheckingForUpdates(true);
    try {
      const result = await window.appUpdater.checkForUpdates();
      if (!result.success) {
        toast.error(t("settings.checkUpdateFailed", { message: result.error || "Unknown error" }));
        return;
      }

      if (result.hasUpdate && result.update) {
        onUpdateAvailable(result.update);
        return;
      }

      onUpdateAvailable(null);
      toast.success(t("settings.upToDate", { version: result.currentVersion }));
    } catch (error) {
      console.error("[SettingsPanel] Failed to check updates:", error);
      toast.error(t("settings.checkUpdateRetry"));
    } finally {
      setIsCheckingForUpdates(false);
    }
  };

  const handleClearIgnoredVersion = () => {
    setUpdateSettings({ ignoredVersion: "" });
    toast.success(t("settings.updateReminderRestored"));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t("settings.storageTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("settings.storageDescription")}
          </p>
        </div>

        {!hasStorageManager && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settings.desktopOnly")}
              </p>
            </div>
          </div>
        )}

        {/* Resource Sharing */}
        <div className="p-6 border border-border rounded-xl bg-card space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Folder className="h-4 w-4" />
            {t("settings.resourceSharing")}
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.shareCharacters")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.visibleCurrentProjectOnly")}</p>
            </div>
            <Switch
              checked={resourceSharing.shareCharacters}
              onCheckedChange={handleToggleShareCharacters}
              disabled={!hasStorageManager}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.shareScenes")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.visibleCurrentProjectOnly")}</p>
            </div>
            <Switch
              checked={resourceSharing.shareScenes}
              onCheckedChange={handleToggleShareScenes}
              disabled={!hasStorageManager}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.shareMedia")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.visibleCurrentProjectOnly")}</p>
            </div>
            <Switch
              checked={resourceSharing.shareMedia}
              onCheckedChange={handleToggleShareMedia}
              disabled={!hasStorageManager}
            />
          </div>
        </div>

        {/* Storage Path - Single unified location */}
        <div className="p-6 border border-border rounded-xl bg-card space-y-5">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            {t("settings.storageLocation")}
          </h4>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">{t("settings.storagePathLabel")}</Label>
            <div className="flex items-center gap-2">
              <Input
                value={storagePaths.basePath || t("settings.defaultLocation")}
                placeholder={t("settings.defaultLocation")}
                readOnly
                className="font-mono text-xs"
              />
              <Button size="sm" onClick={handleSelectStoragePath} disabled={!hasStorageManager}>
                {t("settings.select")}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData} disabled={!hasStorageManager}>
                <Download className="h-3.5 w-3.5 mr-1" />
                {t("settings.export")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportData} disabled={!hasStorageManager}>
                {t("settings.import")}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("settings.storageMoveWarning")}
          </p>
        </div>

        {/* Data Recovery - Link to existing data */}
        <div className="p-6 border border-border rounded-xl bg-card space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("settings.dataRecovery")}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t("settings.dataRecoveryDescription")}
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkData}
              disabled={!hasStorageManager}
              className="w-full"
            >
              <Folder className="h-3.5 w-3.5 mr-1" />
              {t("settings.linkExistingData")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("settings.linkExistingDataHint")}
            </p>
          </div>
        </div>

        {/* Cache Management */}
        <div className="p-6 border border-border rounded-xl bg-card space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            {t("settings.cacheManagement")}
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.cacheSize")}</p>
              <p className="text-xs text-muted-foreground">
                {isCacheLoading ? t("settings.calculating") : formatBytes(cacheSize)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshCacheSize}
                disabled={!hasStorageManager || isCacheLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isCacheLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={!hasStorageManager || isClearingCache}
              >
                {isClearingCache ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("settings.clear")
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("settings.autoClean")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.defaultOff")}</p>
            </div>
            <Switch
              checked={cacheSettings.autoCleanEnabled}
              onCheckedChange={(checked) => setCacheSettings({ autoCleanEnabled: checked })}
              disabled={!hasStorageManager}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{t("settings.clean")}</Label>
            <Input
              type="number"
              min={1}
              value={cacheSettings.autoCleanDays}
              onChange={(e) =>
                setCacheSettings({ autoCleanDays: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-20"
              disabled={!cacheSettings.autoCleanEnabled}
            />
            <span className="text-xs text-muted-foreground">{t("settings.cacheOlderThanDays", { count: cacheSettings.autoCleanDays })}</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card space-y-5">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("settings.appUpdates")}
          </h4>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">License plan</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs uppercase tracking-widest font-medium border ${LICENSE_BADGE_CLASS[licensePlan] || LICENSE_BADGE_CLASS.free}`}>
                  {LICENSE_BADGE_CLASS[licensePlan] ? licensePlan : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("settings.currentVersion")}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">v{appVersion}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={!hasAppUpdater || isCheckingForUpdates}
            >
              {isCheckingForUpdates ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              {t("settings.checkForUpdates")}
            </Button>
          </div>

          {/* Ẩn khỏi UI theo yêu cầu, giữ nguyên logic code */}
          <div className="hidden" style={{ display: "none" }} hidden>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("settings.autoCheckUpdates")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.autoCheckUpdatesHelp")}
                </p>
              </div>
              <Switch
                checked={updateSettings.autoCheckEnabled}
                onCheckedChange={(checked) => setUpdateSettings({ autoCheckEnabled: checked })}
                disabled={!hasAppUpdater}
              />
            </div>
          </div>

          {updateSettings.ignoredVersion && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{t("settings.ignoredVersion")}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  v{updateSettings.ignoredVersion}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearIgnoredVersion}>
                {t("settings.restoreReminder")}
              </Button>
            </div>
          )}

          {!hasAppUpdater && (
            <p className="text-xs text-muted-foreground">
              {t("settings.desktopOnly")}
            </p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
