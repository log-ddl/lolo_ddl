import { Settings } from "lucide-react";

import { FeatureRail } from "@/shared/components/FeatureRail";
import { useI18n } from "@/shared/i18n";

interface TtsSidebarProps {
  onOpenSettings: () => void;
}

export function TtsSidebar({ onOpenSettings }: TtsSidebarProps) {
  const { t } = useI18n();
  return (
    <FeatureRail
      bottomItems={[{
        id: "settings",
        icon: Settings,
        label: t("tts.modelManager"),
        onClick: onOpenSettings,
      }]}
    />
  );
}
