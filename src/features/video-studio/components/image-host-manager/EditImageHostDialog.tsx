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

interface EditImageHostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ImageHostProvider | null;
  onSave: (provider: ImageHostProvider) => void;
}

export function EditImageHostDialog({
  open,
  onOpenChange,
  provider,
  onSave,
}: EditImageHostDialogProps) {
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
  const apiKeyLabel = platform === "scdn" ? "API Key (optional)" : "API Keys";
  const apiKeyRequiredMessage = "Enter an API key";
  const apiKeyPlaceholder = platform === "scdn"
    ? "Leave empty. SCDN supports direct uploads."
    : "Enter API keys (one per line or comma-separated)";

  useEffect(() => {
    if (provider) {
      setPlatform(provider.platform);
      setName(provider.name || "");
      setBaseUrl(provider.baseUrl || "");
      setUploadPath(provider.uploadPath || "");
      setApiKey(provider.apiKey || "");
      setEnabled(provider.enabled ?? true);
      setApiKeyParam(provider.apiKeyParam || "");
      setApiKeyHeader(provider.apiKeyHeader || "");
      setApiKeyFormField(provider.apiKeyFormField || "");
      setApiKeyOptional(provider.apiKeyOptional ?? false);
      setExpirationParam(provider.expirationParam || "");
      setImageField(provider.imageField || "");
      setImagePayloadType(provider.imagePayloadType || "base64");
      setNameField(provider.nameField || "");
      setStaticFormFields(provider.staticFormFields);
      setResponseUrlField(provider.responseUrlField || "");
      setResponseDeleteUrlField(provider.responseDeleteUrlField || "");
    }
  }, [provider]);

  const handlePlatformChange = (value: string) => {
    const nextPlatform = value as ImageHostPlatform;
    const preset = IMAGE_HOST_PRESETS.find((item) => item.platform === nextPlatform);
    setPlatform(nextPlatform);
    if (!preset) return;
    setName(preset.name || "");
    setBaseUrl(preset.baseUrl || "");
    setUploadPath(preset.uploadPath || "");
    setEnabled(preset.enabled ?? true);
    setApiKeyParam(preset.apiKeyParam || "");
    setApiKeyHeader(preset.apiKeyHeader || "");
    setApiKeyFormField(preset.apiKeyFormField || "");
    setApiKeyOptional(preset.apiKeyOptional ?? false);
    setExpirationParam(preset.expirationParam || "");
    setImageField(preset.imageField || "");
    setImagePayloadType(preset.imagePayloadType || "base64");
    setNameField(preset.nameField || "");
    setStaticFormFields(preset.staticFormFields);
    setResponseUrlField(preset.responseUrlField || "");
    setResponseDeleteUrlField(preset.responseDeleteUrlField || "");
  };

  const handleSave = () => {
    if (!provider) return;
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

    onSave({
      ...provider,
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
    toast.success("Changes saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("imageHost.editTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label>{t("common.platform")}</Label>
            <Select value={platform} onValueChange={handlePlatformChange}>
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
            <Label>{apiKeyLabel}</Label>
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
          <Button onClick={handleSave}>{t("imageHost.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
