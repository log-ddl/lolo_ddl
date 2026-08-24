"use client";

/**
 * Local CLI runtime (OpenCode / Claude) configuration, availability probe and
 * a one-shot smoke test.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { isCliRuntimeBeta, useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { cliJsonTest, getCliModels, getCliRuntimeStatus, runCliTextCompletion } from "@/features/video-studio/lib/cli-runtime";

export function CliRuntimeSection() {
  const { t } = useI18n();
  const { cliRuntime, setCliRuntime } = useVideoStudioSettingsStore();

  const [cliStatus, setCliStatus] = useState<Awaited<ReturnType<typeof getCliRuntimeStatus>>>(null);
  const [cliModels, setCliModels] = useState<string[]>([]);
  const [isLoadingCliModels, setIsLoadingCliModels] = useState(false);
  const [isCheckingCliStatus, setIsCheckingCliStatus] = useState(false);
  const [cliTestPrompt, setCliTestPrompt] = useState("Reply with exactly one sentence that says the CLI runtime is working.");
  const [cliTestOutput, setCliTestOutput] = useState("");
  const [isRunningCliTest, setIsRunningCliTest] = useState(false);

  const cliRuntimeAvailable = Boolean(window.cliRuntime || cliStatus?.transport === "http");

  const refreshCliStatus = useCallback(async () => {
    setIsCheckingCliStatus(true);
    try {
      const status = await getCliRuntimeStatus();
      setCliStatus(status);
    } catch (error) {
      console.warn("[SettingsPanel] Failed to detect CLI runtime:", error);
      setCliStatus(null);
    } finally {
      setIsCheckingCliStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshCliStatus();
  }, [refreshCliStatus]);

  const refreshCliModels = useCallback(async (adapter: "claude" | "opencode") => {
    setIsLoadingCliModels(true);
    try {
      const result = await getCliModels(adapter);
      const models = result.models || [];
      setCliModels(models);
      if (models.length > 0 && (!cliRuntime.model || !models.includes(cliRuntime.model))) {
        setCliRuntime({ model: models[0] });
      }
      if (models.length === 0 && cliRuntime.model) {
        setCliRuntime({ model: "" });
      }
    } finally {
      setIsLoadingCliModels(false);
    }
  }, [cliRuntime.model, setCliRuntime]);

  useEffect(() => {
    void refreshCliModels(cliRuntime.adapter);
  }, [cliRuntime.adapter, refreshCliModels]);

  useEffect(() => {
    if (!cliStatus) return;
    void refreshCliModels(cliRuntime.adapter);
  }, [cliStatus?.claude.available, cliStatus?.opencode.available, cliRuntime.adapter, refreshCliModels]);

  const handleRunCliTest = useCallback(async () => {
    if (isCliRuntimeBeta) return;
    if (!cliTestPrompt.trim()) {
      toast.error(t("settings.cliTestPromptRequired"));
      return;
    }
    if (!cliRuntimeAvailable) {
      toast.error(t("settings.cliRuntimeUnavailable"));
      return;
    }

    setIsRunningCliTest(true);
    setCliTestOutput("");

    try {
      const result = await cliJsonTest(cliRuntime.adapter, cliRuntime.model || undefined);
      if (!result.ok) {
        throw new Error(result.error || 'CLI test failed');
      }
      const output = await runCliTextCompletion({
        systemPrompt: 'You are a concise assistant helping verify that the local CLI runtime is working.',
        userPrompt: cliTestPrompt,
        model: cliRuntime.model || undefined,
        sessionKey: 'settings-cli-test',
        onChunk: (chunk) => {
          setCliTestOutput((prev) => prev + chunk);
        },
      });

      setCliTestOutput(output);
      toast.success(t("settings.connectionSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("settings.testFailed", { message }));
    } finally {
      setIsRunningCliTest(false);
    }
  }, [cliRuntimeAvailable, cliRuntime.model, cliRuntime.adapter, cliTestPrompt, t]);

  return (
    <div className="p-6 border border-border rounded-xl bg-card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("settings.cliRuntimeTitle")}
            {isCliRuntimeBeta && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Beta
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("settings.cliRuntimeDescription")}
          </p>
          {!cliRuntimeAvailable && (
            <p className="text-xs text-amber-600 mt-2">
              {t("settings.cliRuntimeUnavailableHint")}
            </p>
          )}
        </div>
        <Switch
          checked={isCliRuntimeBeta ? false : cliRuntime.enabled}
          onCheckedChange={(checked) => setCliRuntime({ enabled: checked })}
          disabled={isCliRuntimeBeta || !cliRuntimeAvailable}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          variant={cliRuntime.adapter === "opencode" ? "default" : "outline"}
          className="justify-start"
          onClick={() => setCliRuntime({ adapter: "opencode" })}
          disabled={isCliRuntimeBeta}
        >
          OpenCode CLI
        </Button>
        <Button
          type="button"
          variant={cliRuntime.adapter === "claude" ? "default" : "outline"}
          className="justify-start"
          onClick={() => setCliRuntime({ adapter: "claude" })}
          disabled={isCliRuntimeBeta}
        >
          Claude CLI
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        <div className="space-y-2">
          <Label>{t("settings.cliModel")}</Label>
          <Select value={cliRuntime.model || undefined} onValueChange={(value) => setCliRuntime({ model: value })} disabled={isCliRuntimeBeta}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingCliModels ? t("settings.cliLoadingModels") : t("settings.cliSelectModel")} />
            </SelectTrigger>
            <SelectContent>
              {cliModels.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isLoadingCliModels ? t("settings.cliLoadingModels") : cliModels.length > 0 ? t("settings.cliModelSourceReady", { count: cliModels.length }) : t("settings.cliNoModels")}
          </p>
        </div>
        <div className="space-y-2">
          <Label>{t("settings.cliTimeout")}</Label>
          <Input
            type="number"
            min={1000}
            step={1000}
            value={cliRuntime.timeoutMs}
            onChange={(e) => {
              if (isCliRuntimeBeta) return;
              const value = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(value) && value >= 1000) {
                setCliRuntime({ timeoutMs: value });
              }
            }}
            disabled={isCliRuntimeBeta}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">OpenCode CLI</span>
          <span className={cn("text-xs", cliStatus?.opencode.available ? "text-green-600" : "text-muted-foreground")}>
            {cliStatus?.opencode.available ? t("settings.cliAvailable") : t("settings.cliUnavailable")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono break-all">
          {cliStatus?.opencode.version || cliStatus?.opencode.error || t("settings.cliStatusUnknown")}
        </p>
        <p className="text-2xs text-muted-foreground font-mono break-all">
          {cliStatus?.opencode.path || t("settings.cliPathUnknown")}
        </p>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <span className="font-medium">Claude CLI</span>
          <span className={cn("text-xs", cliStatus?.claude.available ? "text-green-600" : "text-muted-foreground")}>
            {cliStatus?.claude.available ? t("settings.cliAvailable") : t("settings.cliUnavailable")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono break-all">
          {cliStatus?.claude.version || cliStatus?.claude.error || t("settings.cliStatusUnknown")}
        </p>
        <p className="text-2xs text-muted-foreground font-mono break-all">
          {cliStatus?.claude.path || t("settings.cliPathUnknown")}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={async () => { await refreshCliStatus(); await refreshCliModels(cliRuntime.adapter); }} disabled={isCliRuntimeBeta || isCheckingCliStatus || isLoadingCliModels}>
            {isCheckingCliStatus ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {t("settings.refreshCliStatus")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {cliStatus?.transport === "http" ? t("settings.cliUsingDevServer") : cliStatus?.transport === "electron" ? t("settings.cliUsingElectronRuntime") : t("settings.cliRuntimeStartHint")}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("settings.cliRuntimeHint")}
      </p>

      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between gap-3">
          <Label>{t("settings.cliTestPrompt")}</Label>
          <Button variant="outline" size="sm" onClick={handleRunCliTest} disabled={isCliRuntimeBeta || isRunningCliTest || !cliRuntime.enabled || !cliRuntimeAvailable}>
            {isRunningCliTest ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {t("settings.cliRunTest")}
          </Button>
        </div>
        <Textarea
          value={cliTestPrompt}
          onChange={(e) => setCliTestPrompt(e.target.value)}
          className="min-h-[88px]"
          placeholder={t("settings.cliTestPromptPlaceholder")}
          disabled={isCliRuntimeBeta}
        />
        <div className="rounded-lg border border-border bg-muted/20 p-3 min-h-[96px]">
          <p className="text-xs text-muted-foreground mb-2">{t("settings.cliTestOutput")}</p>
          <pre className="text-xs whitespace-pre-wrap break-words text-foreground font-mono">{cliTestOutput || t("settings.cliTestOutputEmpty")}</pre>
        </div>
      </div>
    </div>
  );
}
