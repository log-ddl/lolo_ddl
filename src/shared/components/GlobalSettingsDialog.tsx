import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, RefreshCw, TerminalSquare } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  cliJsonTest,
  getCliRuntimeStatus,
  installCliRuntime,
  type CliRuntimeStatus,
} from "@/features/video-studio/lib/cli-runtime";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { useAppShellStore } from "@/shared/stores/app-shell-store";
import { toast } from "sonner";

type CliAdapter = "claude" | "opencode" | "codex";

const CLI_OPTIONS: Array<{ adapter: CliAdapter; name: string; docs: string }> = [
  { adapter: "claude", name: "Claude Code", docs: "https://docs.anthropic.com/en/docs/claude-code/getting-started" },
  { adapter: "opencode", name: "OpenCode", docs: "https://opencode.ai/docs" },
  { adapter: "codex", name: "Codex", docs: "https://learn.chatgpt.com/docs/codex/cli" },
];

/** Chỉ quản lý các CLI dùng chung bởi Chat và Buzz. */
export function GlobalSettingsDialog() {
  const { t } = useI18n();
  const open = useAppShellStore((state) => state.settingsOpen);
  const setOpen = useAppShellStore((state) => state.setSettingsOpen);
  const [status, setStatus] = useState<CliRuntimeStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState<CliAdapter | null>(null);
  const [installing, setInstalling] = useState<CliAdapter | null>(null);
  const [installMessage, setInstallMessage] = useState("");
  const [testResults, setTestResults] = useState<Partial<Record<CliAdapter, { ok: boolean; error?: string }>>>({});

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      setStatus(await getCliRuntimeStatus());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const openDocs = async (url: string) => {
    if (window.authBridge?.openExternal) {
      await window.authBridge.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const testCli = async (adapter: CliAdapter) => {
    setTesting(adapter);
    try {
      const result = await cliJsonTest(adapter);
      setTestResults((current) => ({
        ...current,
        [adapter]: { ok: Boolean(result.ok), error: result.error },
      }));
    } finally {
      setTesting(null);
    }
  };

  const installCli = async (adapter: CliAdapter) => {
    const cliName = CLI_OPTIONS.find((item) => item.adapter === adapter)?.name ?? adapter;
    setInstalling(adapter);
    setInstallMessage(t("cliSettings.installStarted", { cli: cliName }));
    const toastId = toast.loading(t("cliSettings.installStarted", { cli: cliName }));
    setTestResults((current) => {
      const next = { ...current };
      delete next[adapter];
      return next;
    });
    try {
      const result = await installCliRuntime(adapter);
      if (!result.success) {
        const message = result.error || result.output || t("cliSettings.installFailed");
        setTestResults((current) => ({
          ...current,
          [adapter]: { ok: false, error: message },
        }));
        setInstallMessage(message);
        toast.error(message, { id: toastId });
      } else {
        const message = t("cliSettings.installSuccess", { cli: cliName });
        setInstallMessage(message);
        toast.success(message, { id: toastId });
      }
      await refresh();
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const message = /No handler registered|No handler/i.test(rawMessage)
        ? t("cliSettings.restartRequired")
        : rawMessage || t("cliSettings.installFailed");
      setTestResults((current) => ({ ...current, [adapter]: { ok: false, error: message } }));
      setInstallMessage(message);
      toast.error(message, { id: toastId });
    } finally {
      setInstalling(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TerminalSquare className="size-5 text-primary" />
            {t("cliSettings.title")}
          </DialogTitle>
          <DialogDescription>{t("cliSettings.description")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {CLI_OPTIONS.map(({ adapter, name, docs }) => {
              const info = status?.[adapter];
              const available = Boolean(info?.available);
              const testResult = testResults[adapter];
              return (
                <section key={adapter} className="flex min-h-64 flex-col rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{name}</h3>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">CLI</p>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
                      available ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500",
                    )}>
                      {available ? <CheckCircle2 className="size-3" /> : <CircleAlert className="size-3" />}
                      {available ? t("cliSettings.installed") : t("cliSettings.notInstalled")}
                    </span>
                  </div>

                  <div className="mt-4 min-h-20 space-y-2 text-xs text-muted-foreground">
                    <p className="break-words font-mono">{info?.version || info?.error || t("cliSettings.notDetected")}</p>
                    {info?.path && <p className="break-all text-[10px] opacity-70">{info.path}</p>}
                    {testResult && (
                      <p className={cn("flex items-start gap-1.5", testResult.ok ? "text-emerald-500" : "text-destructive")}>
                        {testResult.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : <CircleAlert className="mt-0.5 size-3.5 shrink-0" />}
                        <span>{testResult.ok ? t("cliSettings.ready") : testResult.error || t("cliSettings.testFailed")}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    {available ? (
                      <Button type="button" size="sm" onClick={() => void testCli(adapter)} disabled={testing !== null || installing !== null}>
                        {testing === adapter && <Loader2 className="size-3.5 animate-spin" />}
                        {t("cliSettings.testLogin")}
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={() => void installCli(adapter)} disabled={installing !== null || testing !== null}>
                        {installing === adapter && <Loader2 className="size-3.5 animate-spin" />}
                        {installing === adapter ? t("cliSettings.installing") : t("cliSettings.install")}
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={() => void openDocs(docs)}>
                      <ExternalLink className="size-3.5" />
                      {t("cliSettings.openGuide")}
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("cliSettings.refreshHint")}</p>
              {installMessage && <p className="mt-1 break-words text-xs font-medium text-foreground">{installMessage}</p>}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => void refresh()} disabled={checking}>
              {checking ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {t("contentChat.refreshCli")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
