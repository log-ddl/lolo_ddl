"use client";

import { useI18n } from "@/shared/i18n";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import { StageImport } from "./stage-import";
import { StageEditor } from "./stage-editor";
import { StageRender } from "./stage-render";
import { cn } from "@/shared/lib/utils";

export function AutoVideoView() {
  const { t } = useI18n();
  const stage = useAutoVideoStore((s) => s.stage);
  const setStage = useAutoVideoStore((s) => s.setStage);
  const srtSegments = useAutoVideoStore((s) => s.srtSegments);
  const audioFilePath = useAutoVideoStore((s) => s.audioFilePath);

  const stages = [
    { id: "import" as const, label: t("autoVideo.stage.import") },
    { id: "editor" as const, label: t("autoVideo.stage.editor"), disabled: srtSegments.length === 0 || !audioFilePath },
    { id: "render" as const, label: t("autoVideo.stage.render"), disabled: srtSegments.length === 0 || !audioFilePath },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-panel/70 px-5">
        {/* No title here: the project breadcrumb above already names the
            panel. This row is the stage stepper. */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {stages.map((s, i) => (
            <button
              key={s.id}
              disabled={s.disabled}
              onClick={() => !s.disabled && setStage(s.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                stage === s.id
                  ? "bg-primary text-primary-foreground"
                  : s.disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <span className="opacity-60 mr-1">{i + 1}.</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {stage === "import" && <StageImport />}
        {stage === "editor" && <StageEditor />}
        {stage === "render" && <StageRender />}
      </div>
    </div>
  );
}
