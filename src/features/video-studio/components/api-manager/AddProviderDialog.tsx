"use client";

/**
 * Add Provider Dialog
 * For adding new API providers with platform selection
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import type { IProvider } from "@/features/video-studio/lib/api-key-manager";
import { useI18n } from "@/shared/i18n";
import { Loader2 } from "lucide-react";

/**
 * Platform preset configuration.
 */
const PLATFORM_PRESETS: Array<{
  platform: string;
  name: string;
  baseUrl: string;
  description: string;
  services: string[];
  models: string[];
  recommended?: boolean;
}> = [
    {
      platform: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      description: "OpenRouter OpenAI-compatible relay for Claude, Gemini, DeepSeek and more",
      services: ["Chat", "Image Understanding"],
      models: ["anthropic/claude-sonnet-4-6"],
      recommended: true,
    },
    {
      platform: "custom",
      name: "Custom",
      baseUrl: "",
      description: "Custom OpenAI-compatible API provider",
      services: [],
      models: [],
    },
  ];

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (provider: Omit<IProvider, "id">) => void;
  existingPlatforms?: string[];
}

export function AddProviderDialog({
  open,
  onOpenChange,
  onSubmit,
  existingPlatforms = [],
}: AddProviderDialogProps) {
  const { t } = useI18n();
  const [platform, setPlatform] = useState("");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);

  // Get selected preset
  const selectedPreset = PLATFORM_PRESETS.find((p) => p.platform === platform);
  const isCustom = platform === "custom";

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPlatform("");
      setName("");
      setBaseUrl("");
      setApiKey("");
      setModel("");
      setFetchedModels([]);
    }
  }, [open]);

  // Auto-fill when platform changes
  useEffect(() => {
    if (selectedPreset && !isCustom) {
      setName(selectedPreset.name);
      setBaseUrl(selectedPreset.baseUrl);
      setFetchedModels([]);
      // Auto-fill the default model.
      if (selectedPreset.models && selectedPreset.models.length > 0) {
        setModel(selectedPreset.models[0]);
      }
    }
  }, [platform, selectedPreset, isCustom]);

  const getOpenRouterEndpoint = (path: string) => {
    const normalized = (baseUrl || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
  };

  const fetchOpenRouterModels = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    setFetchingModels(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("models"), {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const data: Array<string | { id?: string }> = Array.isArray(json.data) ? json.data : json;
      const models = data.map((item) => typeof item === "string" ? item : item.id).filter((id): id is string => Boolean(id));
      if (models.length === 0) throw new Error("No models returned");
      setFetchedModels(models);
      setModel((current) => current && models.includes(current) ? current : models[0]);
      toast.success(`Fetched ${models.length} OpenRouter models`);
    } catch (error) {
      console.error("OpenRouter model fetch failed:", error);
      toast.error("Không fetch được model OpenRouter. Kiểm tra API key/Base URL.");
    } finally {
      setFetchingModels(false);
    }
  };

  const testOpenRouter = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    if (!model) {
      toast.error("Chọn model OpenRouter trước khi test.");
      return;
    }
    setTestingOpenRouter(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success("OpenRouter test OK.");
    } catch (error) {
      console.error("OpenRouter test failed:", error);
      toast.error("OpenRouter test lỗi. Kiểm tra key/model.");
    } finally {
      setTestingOpenRouter(false);
    }
  };


  const handleSubmit = () => {
    if (!platform) {
      toast.error(t("apiDialog.choosePlatform"));
      return;
    }
    if (!name.trim()) {
      toast.error(t("apiDialog.enterName"));
      return;
    }
    if (isCustom && !baseUrl.trim()) {
      toast.error(t("apiDialog.customNeedsBaseUrl"));
      return;
    }
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }

    // Preserve all preset models for this platform so provider.model is never empty.
    const presetModels = selectedPreset?.models || [];
    const modelArray = platform === "openrouter"
      ? (model ? [model] : [])
      : presetModels.length > 0
      ? presetModels
      : (model ? [model] : []);

    const combinedApiKey = apiKey.trim();

    onSubmit({
      platform,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: combinedApiKey,
      model: modelArray,
    });

    onOpenChange(false);
    toast.success(t("apiDialog.added", { name }));
  };

  // Filter out already existing platforms (except custom which allows repeat add)
  const availablePlatforms = PLATFORM_PRESETS.filter(
    (p) => p.platform === "custom" || !existingPlatforms.includes(p.platform)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("apiDialog.addProvider")}</DialogTitle>
          <DialogDescription className="hidden">{t("apiDialog.addProviderDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>{t("apiDialog.platform")}</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder={t("apiDialog.selectPlatform")} />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map((preset) => (
                  <SelectItem key={preset.platform} value={preset.platform}>
                    <span className="flex items-center gap-2">
                      {preset.name}
                      {preset.recommended && (
                        <span className="text-2xs px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded font-medium">
                          {t("settings.recommended")}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{t("apiDialog.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("apiDialog.namePlaceholder")}
            />
          </div>

          {/* Base URL (only for custom or editable) */}
          {(isCustom || platform) && (
            <div className="space-y-2">
              <Label>{isCustom ? "Base URL" : t("apiDialog.baseUrlOptional")}</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={isCustom ? "https://api.example.com/v1" : ""}
              />
            </div>
          )}

          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("apiDialog.enterApiKey")}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t("apiDialog.multiKeys")}
            </p>
          </div>

          {/* Model - optional input */}
          {platform === "openrouter" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>OpenRouter model</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={fetchOpenRouterModels} disabled={fetchingModels || !apiKey.trim()}>
                    {fetchingModels && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Fetch models
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={testOpenRouter} disabled={testingOpenRouter || !apiKey.trim() || !model}>
                    {testingOpenRouter && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Test nhẹ
                  </Button>
                </div>
              </div>
              <Select value={model} onValueChange={setModel} disabled={fetchedModels.length === 0}>
                <SelectTrigger className="h-9 w-full bg-background">
                  <SelectValue placeholder="Fetch models để chọn" />
                </SelectTrigger>
                <SelectContent>
                  {fetchedModels.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>{modelId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Model được lấy trực tiếp từ OpenRouter `/models`, không cần nhập tay.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("apiDialog.modelOptional")}</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={t("apiDialog.modelPlaceholder")}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit}>{t("apiDialog.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
