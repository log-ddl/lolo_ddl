"use client";

/**
 * Edit Provider Dialog
 * For editing existing API providers
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import type { IProvider } from "@/features/video-studio/lib/api-key-manager";
import { getApiKeyCount } from "@/features/video-studio/lib/api-key-manager";
import { useI18n } from "@/shared/i18n";
import { Loader2 } from "lucide-react";

interface EditProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: IProvider | null;
  onSave: (provider: IProvider) => void;
}

export function EditProviderDialog({
  open,
  onOpenChange,
  provider,
  onSave,
}: EditProviderDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [openRouterModels, setOpenRouterModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);

  // Initialize form when provider changes
  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setBaseUrl(provider.baseUrl);
      setApiKey(provider.apiKey);
      // Load existing models.
      setModel(provider.model?.join(', ') || '');
      setOpenRouterModels(provider.platform === 'openrouter' ? provider.model || [] : []);
    }
  }, [provider]);

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
      setOpenRouterModels(models);
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

  const handleSave = () => {
    if (!provider) return;

    if (!name.trim()) {
      toast.error(t("apiDialog.enterName"));
      return;
    }

    // Parse the model list, supporting commas or new lines as separators.
    const models = provider.platform === 'openrouter'
      ? (model ? [model] : [])
      : model
      .split(/[,\n]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const combinedApiKey = apiKey.trim();

    onSave({
      ...provider,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: combinedApiKey,
      model: models,
    });

    onOpenChange(false);
    toast.success("Changes saved");
  };

  const keyCount = getApiKeyCount(apiKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("apiDialog.editProvider")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Platform (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("apiDialog.platform")}</Label>
            <Input value={provider?.platform || ""} disabled className="bg-muted" />
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

          {/* Base URL */}
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={t("common.apiExample")}
            />
          </div>

          {/* API Keys */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("apiDialog.apiKeys")}</Label>
              <span className="text-xs text-muted-foreground">
                {t("apiDialog.keyCount", { count: keyCount })}
              </span>
            </div>
            <Textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("apiDialog.keyListPlaceholder")}
              className="font-mono text-sm min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {t("apiDialog.keyRotationHint")}
            </p>
          </div>

          {/* Model */}
          {provider?.platform === 'openrouter' ? (
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
              <Select value={model} onValueChange={setModel} disabled={openRouterModels.length === 0}>
                <SelectTrigger className="h-9 w-full bg-background">
                  <SelectValue placeholder="Fetch models để chọn" />
                </SelectTrigger>
                <SelectContent>
                  {openRouterModels.map((modelId) => (
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
              <p className="text-xs text-muted-foreground">
                {t("apiDialog.modelListHint")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("characters.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
