import { FilePlus2, Film, FolderOpen, Home, Redo2, Save, Undo2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { loadProject, newProject, saveProject } from "../lib/project-io";
import { useAutoEditViewStore } from "../store/view-store";
import { ExportButton } from "./export-button";
import { useCanRedo, useCanUndo, useEditorStore } from "../store/editor-store";

export function EditorHeader() {
  const { t } = useI18n();
  const projectName = useEditorStore((s) => s.project?.metadata.name ?? null);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const setView = useAutoEditViewStore((s) => s.setView);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-panel px-3">
      <button
        type="button"
        onClick={() => setView("dashboard")}
        aria-label={t("autoEdit.dashboard.back")}
        title={t("autoEdit.dashboard.back")}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
      >
        <Home className="size-4" />
      </button>

      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Film className="size-3.5" />
        </span>
        <span>{projectName ?? t("autoEdit.title")}</span>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <div className="mx-2 flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label={t("autoEdit.undo")}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label={t("autoEdit.redo")}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Redo2 className="size-4" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={newProject}
          aria-label={t("autoEdit.newProject")}
          title={t("autoEdit.newProject")}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <FilePlus2 className="size-4" />
          <span className="hidden lg:inline">{t("autoEdit.newProject")}</span>
        </button>
        <button
          type="button"
          onClick={() => void loadProject()}
          aria-label={t("autoEdit.openProject")}
          title={t("autoEdit.openProject")}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <FolderOpen className="size-4" />
          <span className="hidden lg:inline">{t("autoEdit.openProject")}</span>
        </button>
        <button
          type="button"
          onClick={() => void saveProject()}
          aria-label={t("autoEdit.saveProject")}
          title={t("autoEdit.saveProject")}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <Save className="size-4" />
          <span className="hidden lg:inline">{t("autoEdit.saveProject")}</span>
        </button>
      </div>

      <ExportButton />
    </header>
  );
}
