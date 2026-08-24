import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Youtube,
} from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { validateYouTubeApiKey } from "../../lib/youtube-api";
import { configuredApiKeys, maskYouTubeKey, quotaForKey, useResearchStore } from "../../stores/research-store";

export function ResearchSettings() {
  const { locale, t } = useI18n();
  const savedApiKey = useResearchStore((state) => state.apiKey);
  const savedApiKeys = useResearchStore((state) => state.apiKeys);
  const activeIndex = useResearchStore((state) => state.activeApiKeyIndex);
  const disabledApiKeys = useResearchStore((state) => state.disabledApiKeys);
  const setApiKeys = useResearchStore((state) => state.setApiKeys);
  const resetQuotaEstimates = useResearchStore((state) => state.resetQuotaEstimates);
  const initialKeys = useMemo(
    () => savedApiKeys.length ? savedApiKeys : savedApiKey ? [savedApiKey] : [""],
    [savedApiKey, savedApiKeys],
  );
  const [keyInputs, setKeyInputs] = useState<string[]>(initialKeys);
  const [showKeys, setShowKeys] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => setKeyInputs(initialKeys), [initialKeys]);

  const parsedKeys = useMemo(
    () => [...new Set(keyInputs.map((key) => key.trim()).filter(Boolean))],
    [keyInputs],
  );

  const updateKey = (index: number, value: string) => {
    setKeyInputs((keys) => keys.map((key, keyIndex) => keyIndex === index ? value : key));
    setMessage("");
  };

  const addKeyInput = () => {
    setKeyInputs((keys) => [...keys, ""]);
    setMessage("");
  };

  const removeKeyInput = (index: number) => {
    setKeyInputs((keys) => {
      const next = keys.filter((_, keyIndex) => keyIndex !== index);
      return next.length ? next : [""];
    });
    setMessage("");
  };

  const save = () => {
    setApiKeys(parsedKeys);
    setMessage(t("research.settings.saved", { count: parsedKeys.length }));
  };

  const testAll = async () => {
    if (!parsedKeys.length) {
      setMessage(t("research.settings.enterKey"));
      return;
    }
    setTesting(true);
    setMessage("");
    const nextResults: Record<string, string> = {};
    for (const key of parsedKeys) {
      try {
        await validateYouTubeApiKey(key);
        nextResults[key] = "valid";
      } catch (error) {
        nextResults[key] = error instanceof Error ? error.message : t("research.settings.invalid");
      }
      setResults({ ...nextResults });
    }
    setTesting(false);
  };

  const storedKeys = configuredApiKeys();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Youtube className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">YouTube Data API keys</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("research.settings.description")}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold">{t("research.settings.keyList")}</label>
              <button type="button" onClick={() => setShowKeys((show) => !show)} className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground">
                {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {t(showKeys ? "research.settings.hideKeys" : "research.settings.showKeys")}
              </button>
            </div>

            <div className="space-y-2">
              {keyInputs.map((key, index) => {
                const trimmedKey = key.trim();
                const result = trimmedKey ? results[trimmedKey] : undefined;
                return (
                  <div key={index} className="rounded-xl border border-border/60 bg-background p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <label className="min-w-0 flex-1">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                          {t("research.settings.keyLabel", { count: index + 1 })}
                        </span>
                        <input
                          type={showKeys ? "text" : "password"}
                          value={key}
                          onChange={(event) => updateKey(index, event.target.value)}
                          placeholder="AIza..."
                          autoComplete="off"
                          spellCheck={false}
                          className="h-7 w-full bg-transparent font-mono text-2xs outline-none"
                        />
                      </label>
                      {result === "valid" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                      <button
                        type="button"
                        onClick={() => removeKeyInput(index)}
                        title={t("research.settings.removeKey")}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {result && result !== "valid" && <p className="mt-2 pl-11 text-2xs text-destructive">{result}</p>}
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" className="mt-2 w-full border-dashed text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary" onClick={addKeyInput}>
              <Plus className="h-3.5 w-3.5" />
              {t("research.settings.addKey")}
            </Button>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {t("research.settings.localOnly", { count: parsedKeys.length })}
              </p>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-2xs font-medium text-primary">
                {t("research.settings.createKey")} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void testAll()} disabled={testing}>
              {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("research.settings.testAll")}
            </Button>
            <Button type="button" onClick={save}>
              <Save className="h-3.5 w-3.5" />
              {t("research.settings.save")}
            </Button>
            {message && <p className="text-2xs text-emerald-500">{message}</p>}
          </div>
        </section>

        {storedKeys.length > 0 && (
          <section className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">{t("research.settings.quotaTitle")}</h2>
                <p className="mt-1 text-2xs text-muted-foreground">{t("research.settings.quotaHint")}</p>
              </div>
              <button type="button" onClick={resetQuotaEstimates} className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                {t("research.settings.resetQuota")}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {storedKeys.map((key, index) => {
                const quota = quotaForKey(key);
                const result = results[key];
                const disabled = disabledApiKeys.includes(key);
                return (
                  <div key={key} className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${disabled || (result && result !== "valid") ? "bg-destructive" : index === activeIndex ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      <span className="font-mono text-xs font-medium">{maskYouTubeKey(key)}</span>
                      {index === activeIndex && !disabled && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-500">{t("research.settings.active")}</span>}
                      {result === "valid" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      <span className="ml-auto text-2xs text-muted-foreground">{t("research.settings.keyPosition", { current: index + 1, total: storedKeys.length })}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/30 px-2.5 py-2"><p className="text-2xs text-muted-foreground">{t("research.settings.readRemaining")}</p><p className="mt-0.5 text-2xs font-semibold">{quota.coreUsed.toLocaleString(locale)}</p></div>
                      <div className="rounded-lg bg-muted/30 px-2.5 py-2"><p className="text-2xs text-muted-foreground">{t("research.settings.searchRemaining")}</p><p className="mt-0.5 text-2xs font-semibold">{quota.searchUsed.toLocaleString(locale)}</p></div>
                    </div>
                    {result && result !== "valid" && <p className="mt-2 text-2xs text-destructive">{result}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
