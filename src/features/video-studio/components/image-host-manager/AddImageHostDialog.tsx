"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import {
  IMAGE_HOST_PRESETS,
  type ImageHostProvider,
  type ImageHostPlatform,
} from "@/features/video-studio/stores/api-config-store";

interface AddImageHostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (provider: Omit<ImageHostProvider, "id">) => void;
}

export function AddImageHostDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddImageHostDialogProps) {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<ImageHostPlatform>("scdn");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [uploadPath, setUploadPath] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [apiKeyParam, setApiKeyParam] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState("");
  const [apiKeyFormField, setApiKeyFormField] = useState("");
  const [apiKeyOptional, setApiKeyOptional] = useState(false);
  const [expirationParam, setExpirationParam] = useState("");
  const [imageField, setImageField] = useState("");
  const [imagePayloadType, setImagePayloadType] = useState<ImageHostProvider["imagePayloadType"]>("base64");
  const [nameField, setNameField] = useState("");
  const [staticFormFields, setStaticFormFields] = useState<Record<string, string> | undefined>(undefined);
  const [responseUrlField, setResponseUrlField] = useState("");
  const [responseDeleteUrlField, setResponseDeleteUrlField] = useState("");

  const selectedPreset = IMAGE_HOST_PRESETS.find((p) => p.platform === platform);
  const apiKeyLabel = platform === "scdn" ? "API Key (optional)" : "API Keys";
  const apiKeyRequiredMessage = "Enter an API key";
  const apiKeyPlaceholder = platform === "scdn"
    ? "Leave empty. SCDN supports direct uploads."
    : "Enter API keys (one per line or comma-separated)";

  useEffect(() => {
    if (open) {
      const defaultPreset = IMAGE_HOST_PRESETS.find((preset) => preset.platform === "scdn") || IMAGE_HOST_PRESETS[0];
      setPlatform(defaultPreset.platform as ImageHostPlatform);
      setName(defaultPreset.name || "");
      setBaseUrl(defaultPreset.baseUrl || "");
      setUploadPath(defaultPreset.uploadPath || "");
      setApiKey("");
      setEnabled(defaultPreset.enabled ?? true);
      setApiKeyParam(defaultPreset.apiKeyParam || "");
      setApiKeyHeader(defaultPreset.apiKeyHeader || "");
      setApiKeyFormField(defaultPreset.apiKeyFormField || "");
      setApiKeyOptional(defaultPreset.apiKeyOptional ?? false);
      setExpirationParam(defaultPreset.expirationParam || "");
      setImageField(defaultPreset.imageField || "");
      setImagePayloadType(defaultPreset.imagePayloadType || "base64");
      setNameField(defaultPreset.nameField || "");
      setStaticFormFields(defaultPreset.staticFormFields);
      setResponseUrlField(defaultPreset.responseUrlField || "");
      setResponseDeleteUrlField(defaultPreset.responseDeleteUrlField || "");
    }
  }, [open]);

  useEffect(() => {
    if (selectedPreset) {
      setName(selectedPreset.name || "");
      setBaseUrl(selectedPreset.baseUrl || "");
      setUploadPath(selectedPreset.uploadPath || "");
      setEnabled(selectedPreset.enabled ?? true);
      setApiKeyParam(selectedPreset.apiKeyParam || "");
      setApiKeyHeader(selectedPreset.apiKeyHeader || "");
      setApiKeyFormField(selectedPreset.apiKeyFormField || "");
      setApiKeyOptional(selectedPreset.apiKeyOptional ?? false);
      setExpirationParam(selectedPreset.expirationParam || "");
      setImageField(selectedPreset.imageField || "");
      setImagePayloadType(selectedPreset.imagePayloadType || "base64");
      setNameField(selectedPreset.nameField || "");
      setStaticFormFields(selectedPreset.staticFormFields);
      setResponseUrlField(selectedPreset.responseUrlField || "");
      setResponseDeleteUrlField(selectedPreset.responseDeleteUrlField || "");
    }
  }, [selectedPreset]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!baseUrl.trim() && !uploadPath.trim()) {
      toast.error("Configure Base URL or Upload Path");
      return;
    }
    if (!apiKey.trim() && !apiKeyOptional) {
      toast.error(apiKeyRequiredMessage);
      return;
    }

    onSubmit({
      platform,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      uploadPath: uploadPath.trim(),
      apiKey: apiKey.trim(),
      enabled,
      apiKeyParam: apiKeyParam.trim() || undefined,
      apiKeyHeader: apiKeyHeader.trim() || undefined,
      apiKeyFormField: apiKeyFormField.trim() || undefined,
      apiKeyOptional,
      expirationParam: expirationParam.trim() || undefined,
      imageField: imageField.trim() || undefined,
      imagePayloadType,
      nameField: nameField.trim() || undefined,
      staticFormFields,
      responseUrlField: responseUrlField.trim() || undefined,
      responseDeleteUrlField: responseDeleteUrlField.trim() || undefined,
    });

    onOpenChange(false);
    toast.success(`Added ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("imageHost.addTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>{t("common.platform")}</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ImageHostPlatform)}>
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectPlatform")} />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_HOST_PRESETS.map((preset) => (
                  <SelectItem key={preset.platform} value={preset.platform}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.imageHostName")} />
          </div>

          <div className="space-y-2">
            <Label>{t("common.baseUrl")}</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={t("common.apiHostExample")} />
          </div>

          <div className="space-y-2">
            <Label>{t("common.uploadPathOrUrl")}</Label>
            <Input value={uploadPath} onChange={(e) => setUploadPath(e.target.value)} placeholder={t("common.uploadOrFullUrl")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{apiKeyLabel}</Label>
            </div>
            <Textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeyPlaceholder}
              className="font-mono text-sm min-h-[80px]"
            />
            {platform === "scdn" && (<p className="text-xs text-muted-foreground">{t("imageHost.scdnHint")}</p>)}
          </div>

          <div className="flex items-center justify-between">
            <Label>{t("common.enabled")}</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("common.advancedOptional")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("common.apiKeyQueryParam")}</Label>
                <Input value={apiKeyParam} onChange={(e) => setApiKeyParam(e.target.value)} placeholder={t("common.queryKey")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("imageHost.apiKeyHeader")}</Label>
                <Input value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} placeholder={t("common.authorization")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.expirationParam")}</Label>
                <Input value={expirationParam} onChange={(e) => setExpirationParam(e.target.value)} placeholder={t("common.expiration")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.imageField")}</Label>
                <Input value={imageField} onChange={(e) => setImageField(e.target.value)} placeholder={t("common.imageFieldName")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.nameField")}</Label>
                <Input value={nameField} onChange={(e) => setNameField(e.target.value)} placeholder={t("common.nameFieldValue")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.responseUrlField")}</Label>
                <Input value={responseUrlField} onChange={(e) => setResponseUrlField(e.target.value)} placeholder={t("common.responseUrlPath")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.deleteUrlField")}</Label>
                <Input value={responseDeleteUrlField} onChange={(e) => setResponseDeleteUrlField(e.target.value)} placeholder={t("common.responseDeleteUrlPath")} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("imageHost.cancel")}</Button>
          <Button onClick={handleSubmit}>{t("imageHost.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
