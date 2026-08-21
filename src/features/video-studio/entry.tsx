import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Layout } from "@/features/video-studio/components/Layout";
import { useAPIConfigStore } from "@/features/video-studio/stores/api-config-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useDirectorStore } from "@/features/video-studio/stores/director-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { isProviderCredentialConfigured } from "@/features/video-studio/lib/api-key-manager";
import { migrateToProjectStorage, recoverFromLegacy } from "@/features/video-studio/lib/storage-migration";
import { useI18n } from "@/shared/i18n";

const MODEL_SYNC_CACHE_KEY = "longdd-video-studio-model-sync";
const MODEL_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

let storageReadyPromise: Promise<void> | null = null;
let browserInitializationPromise: Promise<void> | null = null;
let backgroundInitializationPromise: Promise<void> | null = null;

function ensureStorageReady(): Promise<void> {
  if (!storageReadyPromise) {
    performance.mark("video-studio:storage-start");
    storageReadyPromise = migrateToProjectStorage().finally(() => {
      performance.mark("video-studio:storage-end");
      performance.measure("video-studio:storage", "video-studio:storage-start", "video-studio:storage-end");
    });
  }
  return storageReadyPromise;
}

function scheduleIdleTask(task: () => void, timeout = 1200): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(task, Math.min(timeout, 250));
  return () => globalThis.clearTimeout(id);
}

function initializeBrowserProviders(): Promise<void> {
  browserInitializationPromise ??= (async () => {
    performance.mark("video-studio:browser-providers-start");
    await useVideoStudioSettingsStore.persist.rehydrate();
    const hideAfterLogin = useVideoStudioSettingsStore.getState().hideLoginBrowser;
    await window.videoStudioBrowser?.setHideAfterLogin(hideAfterLogin);
    await window.videoStudioBrowser?.startRuntimes();
  })().finally(() => {
    performance.mark("video-studio:browser-providers-end");
    performance.measure("video-studio:browser-providers", "video-studio:browser-providers-start", "video-studio:browser-providers-end");
  });
  return browserInitializationPromise;
}

function readModelSyncCache(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(MODEL_SYNC_CACHE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeModelSyncCache(cache: Record<string, number>): void {
  try {
    localStorage.setItem(MODEL_SYNC_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Model syncing is only an optimization; storage failures must not affect the studio.
  }
}

async function syncConfiguredProviderModelsInBackground(): Promise<void> {
  const { providers, syncProviderModels } = useAPIConfigStore.getState();
  const configuredProviders = providers.filter((provider) =>
    isProviderCredentialConfigured(provider.platform, provider.apiKey)
  );
  const cache = readModelSyncCache();
  const now = Date.now();
  const providersToSync = configuredProviders.filter((provider) =>
    !cache[provider.id] || now - cache[provider.id] >= MODEL_SYNC_INTERVAL_MS
  );

  await Promise.allSettled(providersToSync.map(async (provider) => {
    try {
      const result = await syncProviderModels(provider.id);
      if (result.success) {
        cache[provider.id] = Date.now();
        writeModelSyncCache(cache);
      } else {
        console.warn(`[VideoStudio] Background model sync skipped for ${provider.name}: ${result.error || "unknown error"}`);
      }
    } catch (error) {
      console.warn(`[VideoStudio] Background model sync failed for ${provider.name}:`, error);
    }
  }));
}

function initializeVideoStudioInBackground(): Promise<void> {
  if (!backgroundInitializationPromise) {
    performance.mark("video-studio:background-start");
    backgroundInitializationPromise = Promise.allSettled([
      (async () => {
        await recoverFromLegacy();
        await useDirectorStore.persist.rehydrate();
        useDirectorStore.getState().resetInflightStatuses();
      })(),
      syncConfiguredProviderModelsInBackground(),
    ]).then(() => undefined).finally(() => {
      performance.mark("video-studio:background-end");
      performance.measure("video-studio:background", "video-studio:background-start", "video-studio:background-end");
    });
  }

  return backgroundInitializationPromise;
}

export default function VideoStudioFeature() {
  const { t } = useI18n();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    performance.mark("video-studio:route-start");
    useMediaPanelStore.getState().setInProject(false);

    let cancelled = false;
    let cancelBackgroundInitialization = () => {};
    const initialize = async () => {
      try {
        // Storage migration must finish before project-scoped stores are used. On an
        // already migrated installation this is only a fast flag check.
        await ensureStorageReady();
      } catch (error) {
        console.error("[VideoStudio] Initialization error:", error);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
          window.requestAnimationFrame(() => {
            performance.mark("video-studio:first-paint");
            performance.measure("video-studio:route-to-first-paint", "video-studio:route-start", "video-studio:first-paint");
          });
          // Browser providers, legacy recovery and remote model discovery all
          // begin after the first dashboard paint and no longer compete with
          // the route transition itself.
          cancelBackgroundInitialization = scheduleIdleTask(() => {
            void initializeBrowserProviders().catch((error) => {
              console.error("[VideoStudio] Browser provider initialization error:", error);
            });
            void initializeVideoStudioInBackground();
          });
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      cancelBackgroundInitialization();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("appHome.openingVideoStudio")}</p>
        </div>
      </div>
    );
  }

  return <Layout />;
}
