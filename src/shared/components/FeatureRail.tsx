import type { ElementType } from "react";
import { ChevronLeft, HelpCircle, Languages, Moon, Settings, Sun } from "lucide-react";

import { AccountSidebarButton } from "@/shared/components/AccountMenu";
import { HomeLogoButton } from "@/shared/components/HomeLogoButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { useAppShellStore } from "@/shared/stores/app-shell-store";
import { useThemeStore } from "@/shared/stores/theme-store";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";

export interface FeatureRailItem {
  id: string;
  icon: ElementType;
  label: string;
  tooltip?: string;
  active?: boolean;
  onClick: () => void;
}

interface FeatureRailProps {
  items?: FeatureRailItem[];
  bottomItems?: FeatureRailItem[];
  backAction?: { label: string; onClick: () => void };
  showCliSettings?: boolean;
}

const railActionClass =
  "flex w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function RailItem({ item }: { item: FeatureRailItem }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={item.onClick}
          className={cn(
            railActionClass,
            item.active && "bg-sidebar-active text-sidebar-active-foreground shadow-xs hover:bg-sidebar-active hover:text-sidebar-active-foreground",
          )}
        >
          <Icon className="size-4" />
          {/* Two lines rather than an ellipsis: "Prompt Import" never fits on
              one line at any sane rail width. */}
          <span className="line-clamp-2 max-w-full text-center text-2xs font-medium leading-tight">{item.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{item.tooltip || item.label}</TooltipContent>
    </Tooltip>
  );
}

export function FeatureRail({ items = [], bottomItems = [], backAction, showCliSettings = false }: FeatureRailProps) {
  const { t } = useI18n();
  const goHome = useAppShellStore((state) => state.goHome);
  const openSettings = useAppShellStore((state) => state.openSettings);
  const { theme, toggleTheme } = useThemeStore();
  const { uiLanguage, setUILanguage } = useUIPreferencesStore();
  const nextLanguage = uiLanguage === "en" ? "vi" : "en";

  return (
    <TooltipProvider delayDuration={300}>
      {/* 72px, not 64: at the 11px label size "Tổng quan" no longer fits in 64. */}
      <aside className="buzz-rail flex w-18 shrink-0 flex-col border-r border-border/60">
        <div className="px-2 pb-2 pt-3">
          <HomeLogoButton onClick={goHome} label={t("appHome.backToHome")} mark={t("brand.mark")} />
          {backAction && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={backAction.onClick} aria-label={backAction.label} className="mt-1.5 flex h-5 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground">
                  <ChevronLeft className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{backAction.label}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 px-1 pb-2 pt-4">
          {items.map((item) => <RailItem key={item.id} item={item} />)}
        </nav>

        <div className="space-y-0.5 px-1 pb-2 pt-1">
          <AccountSidebarButton />
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="https://www.facebook.com/logdd.pitre" target="_blank" rel="noopener noreferrer" className={railActionClass}>
                <HelpCircle className="size-4" />
                <span className="text-2xs font-medium leading-tight">{t("tabBar.help")}</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{t("tabBar.usageGuide")}</TooltipContent>
          </Tooltip>
          {showCliSettings && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={openSettings} className={railActionClass}>
                  <Settings className="size-4" />
                  <span className="text-2xs font-medium leading-tight">CLI</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("tabBar.cliSettings")}</TooltipContent>
            </Tooltip>
          )}
          {bottomItems.map((item) => <RailItem key={item.id} item={item} />)}
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => setUILanguage(nextLanguage)} className={railActionClass}>
                <Languages className="size-4" />
                {/* ui-ok: two-letter language code */}
                <span className="text-2xs font-medium uppercase leading-tight">{nextLanguage}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{nextLanguage === "en" ? t("tabBar.switchToEnglish") : t("tabBar.switchToVietnamese")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={toggleTheme} className={railActionClass}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span className="text-2xs font-medium leading-tight">{theme === "dark" ? t("tabBar.theme.light") : t("tabBar.theme.dark")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{theme === "dark" ? t("tabBar.theme.toLight") : t("tabBar.theme.toDark")}</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
