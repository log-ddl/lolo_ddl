"use client";

/**
 * The configured-provider list on the API tab: one collapsible card per
 * provider with sync / test / edit / delete actions.
 */

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Info, Key, Loader2, Pencil, Plus, RefreshCw, Settings, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { useAPIConfigStore, type IProvider } from "@/features/video-studio/stores/api-config-store";
import {
  getModelDisplayName,
  getProviderCredentialCount,
  isProviderCredentialConfigured,
  parseApiKeys,
  maskApiKey,
} from "@/features/video-studio/lib/api-key-manager";
import { GoogleFlowRuntimePanel } from "@/features/video-studio/components/GoogleFlowRuntimePanel";
import { GrokRuntimePanel } from "@/features/video-studio/components/GrokRuntimePanel";
import { PLATFORM_ICONS, getProviderDisplayName, isBrowserRuntimePlatform } from "./shared";

export interface ProviderListProps {
  providers: IProvider[];
  googleFlowReady: boolean;
  grokReady: boolean;
  syncingProvider: string | null;
  setSyncingProvider: (id: string | null) => void;
  onEdit: (provider: IProvider) => void;
  onAdd: () => void;
  t: Translate;
}

export function ProviderList({
  providers,
  googleFlowReady,
  grokReady,
  syncingProvider,
  setSyncingProvider,
  onEdit,
  onAdd,
  t,
}: ProviderListProps) {
  const { removeProvider, syncProviderModels } = useAPIConfigStore();
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

  const toggleExpanded = (id: string) => {
    setExpandedProviders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = (id: string) => {
    removeProvider(id);
    toast.success(t("settings.deleteProvider"));
  };

  const isConfigured = (provider: IProvider) =>
    provider.platform === 'googleflow'
      ? googleFlowReady
      : provider.platform === 'grok'
        ? grokReady
        : isProviderCredentialConfigured(provider.platform, provider.apiKey);

  // Test connection - directly call external APIs
  const testConnection = async (provider: IProvider) => {
    if (provider.platform === 'grok') {
      setTestingProvider(provider.id);
      try {
        const status = await window.grokVideoRuntime?.getStatus();
        const success = Boolean(status?.readyCredentialCount);
        setTestResults((prev) => ({ ...prev, [provider.id]: success }));
        if (success) toast.success(`Grok đã sẵn sàng: ${status!.readyCredentialCount} extension`);
        else toast.error('Chưa kết nối Grok. Hãy nạp extension logdd, mở Grok Imagine và đăng nhập.');
      } finally {
        setTestingProvider(null);
      }
      return;
    }
    if (provider.platform === 'googleflow') {
      setTestingProvider(provider.id);
      try {
        const status = await window.googleFlowRuntime?.getStatus();
        const success = Boolean(status?.readyCredentialCount);
        setTestResults((prev) => ({ ...prev, [provider.id]: success }));
        if (success) toast.success(`Google Flow đã sẵn sàng: ${status!.readyCredentialCount} tiện ích`);
        else toast.error('Chưa có tiện ích Google Flow sẵn sàng. Hãy mở Google Flow trong Chrome và kiểm tra tiện ích.');
      } finally {
        setTestingProvider(null);
      }
      return;
    }
    const keys = parseApiKeys(provider.apiKey);
    if (keys.length === 0) {
      toast.error(t("settings.configureApiKeyFirst"));
      return;
    }

    setTestingProvider(provider.id);
    setTestResults((prev) => ({ ...prev, [provider.id]: null }));

    try {
      let response: Response;
      const apiKey = keys[0]; // Use first key for test
      const normalizedBaseUrl = provider.baseUrl?.replace(/\/+$/, "");
      const buildEndpoint = (root: string, path: string) => {
        const normalized = root.replace(/\/+$/, "");
        return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
      };

      if (normalizedBaseUrl && provider.model?.length) {
        const endpoint = buildEndpoint(normalizedBaseUrl, "chat/completions");
        const model = provider.model[0];
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 5,
          }),
        });
      } else {
        // For providers without chat endpoint info, just mark as configured
        setTestResults((prev) => ({ ...prev, [provider.id]: true }));
        toast.success(t("settings.providerConfigured", { name: getProviderDisplayName(provider) }));
        setTestingProvider(null);
        return;
      }

      const success = response.ok;
      setTestResults((prev) => ({ ...prev, [provider.id]: success }));

      if (success) {
        toast.success(t("settings.connectionSuccess"));
      } else {
        const errorData = await response.text();
        console.error("API test error:", response.status, errorData);
        toast.error(t("settings.connectionFailedWithStatus", { status: response.status }));
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setTestResults((prev) => ({ ...prev, [provider.id]: false }));
      toast.error(t("settings.networkTestFailed"));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Key className="h-4 w-4" />
        {t("settings.providers")}
      </h3>

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t("settings.noProviders")}
          </h3>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            {t("settings.addProvider")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => {
            const isExpanded = expandedProviders[provider.id] ?? false;
            const keyCount = getProviderCredentialCount(provider.platform, provider.apiKey);
            const configured = isConfigured(provider);
            const testResult = testResults[provider.id];
            const isTesting = testingProvider === provider.id;
            return (
              <Collapsible
                key={provider.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(provider.id)}
              >
                <div
                  className={cn(
                    "border rounded-xl transition-all",
                    configured
                      ? "bg-card border-primary/30"
                      : "bg-card border-border"
                  )}
                >
                  {/* Header */}
                  <CollapsibleTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 rounded-t-xl transition-colors cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpanded(provider.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            configured
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {PLATFORM_ICONS[provider.platform] || (
                            <Settings className="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-foreground flex items-center gap-2">
                            {getProviderDisplayName(provider)}
                            {configured && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-normal">
                                {isBrowserRuntimePlatform(provider.platform) ? 'Sẵn sàng' : t("settings.badgeConfigured")}
                              </span>
                            )}
                            {isBrowserRuntimePlatform(provider.platform) && !configured && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-normal">
                                Chưa kết nối
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {provider.platform}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span
                            className="cursor-pointer hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(provider.id);
                            }}
                          >
                            {t("settings.models", { count: provider.model.length })}
                          </span>
                          <span>|</span>
                          <span
                            className="cursor-pointer hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isBrowserRuntimePlatform(provider.platform)) {
                                toggleExpanded(provider.id);
                              } else {
                                onEdit(provider);
                              }
                            }}
                          >
                            {isBrowserRuntimePlatform(provider.platform) ? 'Tiện ích Chrome' : `Key (${keyCount})`}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isBrowserRuntimePlatform(provider.platform) && <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("settings.syncModels")}
                            onClick={async () => {
                              setSyncingProvider(provider.id);
                              const result = await syncProviderModels(provider.id);
                              setSyncingProvider(null);
                              if (result.success) {
                                toast.success(t("settings.syncSuccess", { count: result.count }));
                              } else {
                                toast.error(result.error || t("settings.syncFailed"));
                              }
                            }}
                            disabled={!configured || syncingProvider === provider.id}
                          >
                            {syncingProvider === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>}

                          {provider.platform !== 'googleflow' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={t("settings.testConnection")}
                              onClick={() => testConnection(provider)}
                              disabled={!configured || isTesting}
                            >
                              {isTesting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : testResult === true ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : testResult === false ? (
                                <X className="h-4 w-4 text-red-500" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {!isBrowserRuntimePlatform(provider.platform) && <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("settings.edit")}
                            onClick={() => onEdit(provider)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>}

                          {!isBrowserRuntimePlatform(provider.platform) && <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("settings.confirmDelete")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("settings.confirmDeleteProvider", { name: getProviderDisplayName(provider) })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(provider.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("dashboard.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>}
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expandable Content */}
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      {/* Base URL */}
                      {provider.baseUrl && !isBrowserRuntimePlatform(provider.platform) && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">
                            Base URL:{" "}
                          </span>
                          <span className="font-mono text-foreground">
                            {provider.baseUrl}
                          </span>
                        </div>
                      )}

                      {provider.platform === 'googleflow' && (
                        <GoogleFlowRuntimePanel alwaysVisible />
                      )}

                      {provider.platform === 'grok' && (
                        <GrokRuntimePanel alwaysVisible />
                      )}

                      {/* Models */}
                      {provider.model.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {provider.model.map((m) => (
                            <span
                              key={m}
                              className="text-xs px-2 py-1 bg-muted rounded font-mono"
                            >
                              {getModelDisplayName(m)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* API Key Preview */}
                      {configured && !isBrowserRuntimePlatform(provider.platform) && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">
                            API Key:{" "}
                          </span>
                          <span className="font-mono text-foreground">
                            {maskApiKey(parseApiKeys(provider.apiKey)[0])}
                            {keyCount > 1 && (
                              <span className="text-muted-foreground">
                                {" "}
                                (+{keyCount - 1})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
