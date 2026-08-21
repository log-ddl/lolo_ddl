import { Settings } from "lucide-react";

import { mainNavItems, bottomNavItems, useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { FeatureRail, type FeatureRailItem } from "@/shared/components/FeatureRail";
import { useI18n } from "@/shared/i18n";
import { hasPlanAccess } from "@/shared/lib/license-client";
import { useLicenseStore } from "@/shared/stores/license-store";

export function TabBar() {
  const { activeTab, inProject, setActiveTab, setInProject } = useMediaPanelStore();
  const plan = useLicenseStore((state) => state.plan);
  const { t } = useI18n();

  const items: FeatureRailItem[] = mainNavItems
    .filter((item) => !item.requiresPlan || hasPlanAccess(plan, item.requiresPlan))
    .map((item) => ({
      id: item.id,
      icon: item.icon,
      label: t(item.labelKey),
      tooltip: `${t(item.labelKey)}${item.phase ? ` (${t(item.phase)})` : ""}`,
      active: activeTab === item.id,
      onClick: () => setActiveTab(item.id),
    }));

  const projectBottomItems: FeatureRailItem[] = bottomNavItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: t(item.labelKey),
    active: activeTab === item.id,
    onClick: () => setActiveTab(item.id),
  }));

  const dashboardBottomItems: FeatureRailItem[] = [{
    id: "settings",
    icon: Settings,
    label: t("tabBar.settings"),
    tooltip: t("tabBar.systemSettings"),
    active: activeTab === "settings",
    onClick: () => setActiveTab("settings"),
  }];

  return (
    <FeatureRail
      items={inProject ? items : []}
      bottomItems={inProject ? projectBottomItems : dashboardBottomItems}
      backAction={inProject
        ? { label: t("tabBar.backToProjects"), onClick: () => setInProject(false) }
        : activeTab === "settings"
          ? { label: t("tabBar.backToProjects"), onClick: () => setActiveTab("dashboard") }
          : undefined}
    />
  );
}
