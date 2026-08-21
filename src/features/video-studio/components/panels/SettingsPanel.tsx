"use client";

/**
 * Settings Panel - Unified API Manager v2
 * Provider-based API configuration with multi-key support
 *
 * This file is the tab shell and dialog host; each section lives in ./settings.
 */

import { useEffect, useMemo, useState } from "react";
import { HardDrive, Key, Plus, Settings, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { UpdateDialog } from "@/shared/components/UpdateDialog";
import type { AvailableUpdateInfo } from "@/shared/types/update";
import packageJson from "../../../../../package.json";
import {
  useAPIConfigStore,
  type IProvider,
  type ImageHostProvider,
} from "@/features/video-studio/stores/api-config-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { isProviderCredentialConfigured } from "@/features/video-studio/lib/api-key-manager";
import { AddProviderDialog, EditProviderDialog } from "@/features/video-studio/components/api-manager";
import { AddImageHostDialog } from "@/features/video-studio/components/image-host-manager/AddImageHostDialog";
import { EditImageHostDialog } from "@/features/video-studio/components/image-host-manager/EditImageHostDialog";
import { useGoogleFlowRuntimeStore } from "@/features/video-studio/stores/google-flow-runtime-store";
import { useGrokRuntimeStore } from "@/features/video-studio/stores/grok-runtime-store";
import { ProviderList } from "./settings/provider-list";
import { MediaModelSelectors } from "./settings/media-model-selectors";
import { CliRuntimeSection } from "./settings/cli-runtime-section";
import { GlobalSettingsSection } from "./settings/global-settings-section";
import { ImageHostTab } from "./settings/image-host-tab";
import { StorageTab } from "./settings/storage-tab";

export function SettingsPanel() {
  const {
    providers,
    addProvider,
    updateProvider,
    addImageHostProvider,
    updateImageHostProvider,
    isImageHostConfigured,
    syncProviderModels,
  } = useAPIConfigStore();
  const { setUpdateSettings } = useVideoStudioSettingsStore();
  const { t } = useI18n();

  const googleFlowStatus = useGoogleFlowRuntimeStore((state) => state.status);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const grokStatus = useGrokRuntimeStore((state) => state.status);
  const initializeGrokRuntime = useGrokRuntimeStore((state) => state.initialize);
  useEffect(() => initializeGoogleFlowRuntime(), [initializeGoogleFlowRuntime]);
  useEffect(() => initializeGrokRuntime(), [initializeGrokRuntime]);

  const [activeTab, setActiveTab] = useState<string>("api");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<IProvider | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [imageHostAddOpen, setImageHostAddOpen] = useState(false);
  const [imageHostEditOpen, setImageHostEditOpen] = useState(false);
  const [editingImageHost, setEditingImageHost] = useState<ImageHostProvider | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdateInfo | null>(null);
  const [appVersion, setAppVersion] = useState(packageJson.version);

  const googleFlowReady = Boolean(googleFlowStatus?.readyCredentialCount);
  const grokReady = Boolean(grokStatus?.readyCredentialCount);

  const existingPlatforms = useMemo(() => providers.map((p) => p.platform), [providers]);

  const configuredCount = providers.filter(
    (p) => p.platform === 'googleflow'
      ? googleFlowReady
      : p.platform === 'grok'
        ? grokReady
        : isProviderCredentialConfigured(p.platform, p.apiKey)
  ).length;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const version = await window.appUpdater?.getCurrentVersion?.();
        if (!cancelled && version) {
          setAppVersion(version);
        }
      } catch (error) {
        console.warn("[SettingsPanel] Failed to load app version:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Adding or editing a provider re-syncs its models so the pickers stay accurate. */
  const syncAfterCredentialChange = (id: string, platform: string, apiKey: string) => {
    if (!isProviderCredentialConfigured(platform, apiKey)) return;
    setSyncingProvider(id);
    syncProviderModels(id).then((result) => {
      setSyncingProvider(null);
      if (result.success) {
        toast.success(t("settings.autoSyncedModels", { count: result.count }));
      } else if (result.error) {
        toast.error(t("settings.modelSyncFailed", { message: result.error }));
      }
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-panel/70 px-5">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings className="size-4 text-primary" />
            {t("settings.title")}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "api" && (
            <>
            <span className="text-xs text-muted-foreground font-mono bg-muted border border-border px-2 py-1 rounded">
              {t("settings.configured", { count: configuredCount, total: providers.length })}
            </span>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("settings.addProvider")}
            </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-6">
          <TabsList className="h-12 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="api"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
            >
              <Key className="h-4 w-4 mr-2" />
              {t("settings.tab.api")}
            </TabsTrigger>
            <TabsTrigger
              value="imagehost"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("settings.tab.imageHost")}
              {isImageHostConfigured() && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="storage"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
            >
              <HardDrive className="h-4 w-4 mr-2" />
              {t("settings.tab.storage")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* API Management Tab */}
        <TabsContent value="api" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground text-sm">{t("settings.securityTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("settings.securityBody")}
                  </p>
                </div>
              </div>

              <ProviderList
                providers={providers}
                googleFlowReady={googleFlowReady}
                grokReady={grokReady}
                syncingProvider={syncingProvider}
                setSyncingProvider={setSyncingProvider}
                onEdit={(provider) => {
                  setEditingProvider(provider);
                  setEditDialogOpen(true);
                }}
                onAdd={() => setAddDialogOpen(true)}
                t={t}
              />

              <MediaModelSelectors />

              <CliRuntimeSection />

              <GlobalSettingsSection />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Image Host Config Tab */}
        <TabsContent value="imagehost" className="flex-1 overflow-hidden mt-0">
          <ImageHostTab
            onAdd={() => setImageHostAddOpen(true)}
            onEdit={(provider) => {
              setEditingImageHost(provider);
              setImageHostEditOpen(true);
            }}
          />
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="flex-1 overflow-hidden mt-0">
          <StorageTab
            appVersion={appVersion}
            onUpdateAvailable={(update) => {
              setAvailableUpdate(update);
              if (update) setUpdateDialogOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddProviderDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={(providerData) => {
          const provider = addProvider(providerData);
          syncAfterCredentialChange(provider.id, providerData.platform, providerData.apiKey);
        }}
        existingPlatforms={existingPlatforms}
      />

      <EditProviderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        provider={editingProvider}
        onSave={(provider) => {
          updateProvider(provider);
          syncAfterCredentialChange(provider.id, provider.platform, provider.apiKey);
        }}
      />

      <AddImageHostDialog
        open={imageHostAddOpen}
        onOpenChange={setImageHostAddOpen}
        onSubmit={addImageHostProvider}
      />

      <EditImageHostDialog
        open={imageHostEditOpen}
        onOpenChange={setImageHostEditOpen}
        provider={editingImageHost}
        onSave={updateImageHostProvider}
      />
      <UpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        updateInfo={availableUpdate}
        onIgnoreVersion={(version) => {
          setUpdateSettings({ ignoredVersion: version });
          setAvailableUpdate(null);
        }}
      />
      <div className="pointer-events-none absolute bottom-2 right-4 text-[11px] font-mono text-muted-foreground/70">
        v{appVersion}
      </div>
    </div>
  );
}
