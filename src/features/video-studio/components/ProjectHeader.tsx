"use client";

/**
 * ProjectHeader - Top bar showing project name and save status
 * Based on CineGen-AI App.tsx auto-save pattern
 */

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { useMediaPanelStore, type Tab } from "@/features/video-studio/stores/media-panel-store";
import { CloudOff, Loader2, Check, ChevronRight, Film } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";

export type SaveStatus = "saved" | "saving" | "unsaved";

const TAB_HEADER_CONTEXT: Partial<Record<Tab, { labelKey: string; phaseKey?: string }>> = {
  overview: { labelKey: "nav.overview" },
  script: { labelKey: "nav.script", phaseKey: "stage.phase01" },
  promptImport: { labelKey: "nav.promptImport", phaseKey: "stage.phase01" },
  characters: { labelKey: "nav.characters", phaseKey: "stage.phase02" },
  scenes: { labelKey: "nav.scenes", phaseKey: "stage.phase02" },
  director: { labelKey: "nav.director", phaseKey: "stage.phase03" },
  export: { labelKey: "nav.export", phaseKey: "stage.phase04" },
  autoVideo: { labelKey: "nav.autoVideo", phaseKey: "stage.phase05" },
  media: { labelKey: "nav.media" },
  settings: { labelKey: "nav.settings" },
};

export function ProjectHeader() {
  const { t } = useI18n();
  const { activeProject } = useProjectStore();
  const { activeTab, activeEpisodeIndex, backToSeries } = useMediaPanelStore();
  const scriptStore = useScriptStore();
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Get current project data for change detection
  const projectId = activeProject?.id;
  const scriptProject = projectId ? scriptStore.projects[projectId] : null;
  const currentUpdatedAt = scriptProject?.updatedAt || 0;

  // Auto-save effect with 1s debounce
  useEffect(() => {
    if (!projectId || currentUpdatedAt === 0) return;
    
    // Skip if this is the first mount or no actual change
    if (lastUpdateRef.current === currentUpdatedAt) return;
    
    // Mark as unsaved
    setSaveStatus("unsaved");
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      
      // Simulate save (Zustand persist handles actual storage)
      setTimeout(() => {
        setSaveStatus("saved");
        lastUpdateRef.current = currentUpdatedAt;
      }, 300);
    }, 1000); // 1s debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, currentUpdatedAt]);

  // Derive the breadcrumb from the visible tab. Using activeStage here leaves
  // non-workflow tabs showing the stage that happened to be visited previously.
  const headerContext = TAB_HEADER_CONTEXT[activeTab];

  return (
    <div className="h-11 bg-background border-b border-border/60 px-4 flex items-center justify-between shrink-0">
      {/* Left: Project Name + Stage + Episode Breadcrumb */}
      <div className="flex items-center gap-2">
        <FeatureHeaderIcon className="size-6 rounded-lg [&>svg]:size-3.5" icon={Film} />
        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
          {activeProject?.name || t("project.untitled")}
        </span>
        {activeEpisodeIndex != null && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <button
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={backToSeries}
              title={t("project.backToSeries")}
            >
              {t("project.episode", { index: activeEpisodeIndex })}
            </button>
          </>
        )}
        {headerContext && (
          <>
            <span className="text-muted-foreground/30">/</span>
            {headerContext.phaseKey && (
              <span className="text-xs text-muted-foreground/50 font-mono">
                {t(headerContext.phaseKey)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t(headerContext.labelKey)}
            </span>
          </>
        )}
      </div>

      {/* Right: Save Status */}
      <div className="flex items-center gap-2">
        <SaveStatusIndicator status={saveStatus} />
      </div>
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs uppercase tracking-widest transition-colors",
        status === "saved" && "text-success/60",
        status === "saving" && "text-warning/70",
        status === "unsaved" && "text-muted-foreground"
      )}
    >
      {status === "saved" && (
        <>
          <Check className="w-3 h-3" />
          <span>{t("save.saved")}</span>
        </>
      )}
      {status === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{t("save.saving")}</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <CloudOff className="w-3 h-3" />
          <span>{t("save.unsaved")}</span>
        </>
      )}
    </div>
  );
}
