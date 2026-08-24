import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { DirectorContextPanel } from "@/features/video-studio/components/panels/director/context-panel";
import { useI18n } from "@/shared/i18n";

export function RightPanel() {
  const { activeTab } = useMediaPanelStore();
  const { t } = useI18n();

  // Render contextual content for the active tab.
  const renderContent = () => {
    switch (activeTab) {
      case "director":
        return (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div id="director-right-panel-controls" className="p-3" />
            <DirectorContextPanel />
          </div>
        );
      default:
        return (
          <div className="flex-1 min-w-0 flex items-center justify-center text-muted-foreground text-sm">
            <p>{t("rightPanel.comingSoon")}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full min-w-0 flex flex-col overflow-hidden bg-panel">
      <div className="px-3 py-2.5 border-b border-border/60">
        <h3 className="font-semibold text-xs text-muted-foreground">{t("rightPanel.properties")}</h3>
      </div>
      {renderContent()}
    </div>
  );
}
