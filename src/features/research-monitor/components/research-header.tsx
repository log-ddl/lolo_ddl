import { KeyRound, Telescope } from "lucide-react";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";
import { useI18n } from "@/shared/i18n";
import { quotaForKey, useResearchStore } from "../stores/research-store";
import type { ResearchView } from "../types";

const titleKeys: Record<ResearchView, { title: string; subtitle: string }> = {
  discover: { title: "research.header.discoverTitle", subtitle: "research.header.discoverSubtitle" },
  monitor: { title: "research.header.monitorTitle", subtitle: "research.header.monitorSubtitle" },
  comments: { title: "research.header.commentsTitle", subtitle: "research.header.commentsSubtitle" },
  tools: { title: "research.header.toolsTitle", subtitle: "research.header.toolsSubtitle" },
  settings: { title: "research.header.settingsTitle", subtitle: "research.header.settingsSubtitle" },
};

export function ResearchHeader({ activeView }: { activeView: ResearchView }) {
  const { locale, t } = useI18n();
  const legacyKey = useResearchStore((state) => state.apiKey);
  const apiKeys = useResearchStore((state) => state.apiKeys);
  const quotaUsage = useResearchStore((state) => state.quotaUsage);
  const keys = apiKeys.length ? apiKeys : legacyKey ? [legacyKey] : [];
  const quotas = keys.map(quotaForKey);
  const coreUsed = quotas.reduce((sum, quota) => sum + quota.coreUsed, 0);
  const searchUsed = quotas.reduce((sum, quota) => sum + quota.searchUsed, 0);
  void quotaUsage;
  const current = titleKeys[activeView];
  return (
    <header className="flex min-h-[62px] shrink-0 items-center border-b border-border/60 bg-panel/70 px-4 backdrop-blur-xl lg:px-6">
      <FeatureHeaderIcon className="mr-3" icon={Telescope} />
      <div className="min-w-0"><h1 className="truncate text-sm font-semibold">{t(current.title)}</h1><p className="mt-0.5 truncate text-2xs text-muted-foreground">{t(current.subtitle)}</p></div>
      <div title={t("research.header.quotaTip")} className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium ${keys.length ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}><KeyRound className="h-3 w-3" />{keys.length ? t("research.header.quota", { count: keys.length, read: coreUsed.toLocaleString(locale), search: searchUsed.toLocaleString(locale) }) : t("research.common.noApi")}</div>
    </header>
  );
}
