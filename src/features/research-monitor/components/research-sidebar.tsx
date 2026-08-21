import { Compass, Download, MessageSquareText, Settings, Users } from "lucide-react";

import { FeatureRail, type FeatureRailItem } from "@/shared/components/FeatureRail";
import { useI18n } from "@/shared/i18n";
import type { ResearchView } from "../types";

interface ResearchSidebarProps {
  activeView: ResearchView;
  onViewChange: (view: ResearchView) => void;
}

export function ResearchSidebar({ activeView, onViewChange }: ResearchSidebarProps) {
  const { t } = useI18n();
  const item = (id: ResearchView, icon: FeatureRailItem["icon"], labelKey: string, tooltipKey: string): FeatureRailItem => ({
    id,
    icon,
    label: t(labelKey),
    tooltip: t(tooltipKey),
    active: activeView === id,
    onClick: () => onViewChange(id),
  });

  return (
    <FeatureRail
      items={[
        item("discover", Compass, "research.sidebar.discover", "research.sidebar.discoverTip"),
        item("monitor", Users, "research.sidebar.monitor", "research.sidebar.monitorTip"),
        item("comments", MessageSquareText, "research.sidebar.comments", "research.sidebar.commentsTip"),
        item("tools", Download, "research.sidebar.tools", "research.sidebar.toolsTip"),
      ]}
      bottomItems={[
        item("settings", Settings, "research.sidebar.settings", "research.sidebar.settingsTip"),
      ]}
    />
  );
}
