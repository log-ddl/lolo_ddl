"use client";

/**
 * Image-host tab: the upload targets used to turn local images into public
 * URLs for providers that only accept remote references.
 */

import { useMemo, useState } from "react";
import { Info, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Switch } from "@/shared/components/ui/switch";
import {
  isVisibleImageHostProvider,
  useAPIConfigStore,
  type ImageHostProvider,
} from "@/features/video-studio/stores/api-config-store";
import { getApiKeyCount } from "@/features/video-studio/lib/api-key-manager";
import { uploadToImageHost } from "@/features/video-studio/lib/image-host";
import { getProviderDisplayName } from "./shared";

// 1x1 transparent GIF, small enough that a test upload costs nothing.
const TEST_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export interface ImageHostTabProps {
  onAdd: () => void;
  onEdit: (provider: ImageHostProvider) => void;
}

export function ImageHostTab({ onAdd, onEdit }: ImageHostTabProps) {
  const { t } = useI18n();
  const { imageHostProviders, updateImageHostProvider, removeImageHostProvider } = useAPIConfigStore();
  const [testingImageHostId, setTestingImageHostId] = useState<string | null>(null);

  const visibleImageHostProviders = useMemo(
    () => imageHostProviders.filter(isVisibleImageHostProvider),
    [imageHostProviders],
  );

  const handleDelete = (id: string) => {
    removeImageHostProvider(id);
    toast.success(t("settings.deleteImageHost"));
  };

  const handleTest = async (provider: ImageHostProvider) => {
    setTestingImageHostId(provider.id);
    try {
      const result = await uploadToImageHost(TEST_IMAGE, {
        expiration: 60,
        providerId: provider.id,
      });
      if (result.success) {
        toast.success(t("settings.imageHostTestSuccess", { name: provider.name }));
      } else {
        toast.error(t("settings.testFailed", { message: result.error || "Unknown error" }));
      }
    } catch {
      toast.error(t("settings.networkTestFailed"));
    } finally {
      setTestingImageHostId(null);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("settings.imageHostTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("settings.imageHostDescription")}
          </p>
        </div>

        {/* Image Host Providers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("settings.imageHostProviders")}</Label>
            <Button size="sm" variant="outline" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" />
              {t("settings.add")}
            </Button>
          </div>

          {visibleImageHostProviders.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("settings.noImageHosts")}</div>
          ) : (
            <div className="space-y-3">
              {visibleImageHostProviders.map((provider) => {
                const keyCount = getApiKeyCount(provider.apiKey);
                const endpoint = provider.uploadPath || provider.baseUrl;
                const configured = provider.enabled && !!endpoint && (provider.apiKeyOptional || keyCount > 0);
                return (
                  <div key={provider.id} className="p-4 border border-border rounded-xl bg-card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{getProviderDisplayName(provider)}</span>
                          {configured ? (
                            <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                              {t("settings.badgeConfigured")}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                              {t("settings.notConfigured")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {provider.platform} · {endpoint || t("settings.addressNotSet")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {provider.apiKeyOptional && keyCount === 0
                            ? t("settings.guestUpload")
                            : t("settings.keyCount", { count: keyCount })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) =>
                            updateImageHostProvider({ ...provider, enabled: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!provider.enabled || testingImageHostId === provider.id}
                        onClick={() => handleTest(provider)}
                      >
                        {testingImageHostId === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("settings.testConnection")
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(provider)}>
                        {t("settings.edit")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(provider.id)}>
                        {t("dashboard.delete")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Notice */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("settings.imageHostNotice")}
            </p>
            <p className="text-sm">
              {t("settings.imageHostDefaultNotice")}
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
