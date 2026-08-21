import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Film,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FeatureRail } from "@/shared/components/FeatureRail";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { loadProject, loadProjectFromPath, newProject } from "../lib/project-io";
import { formatTimecodeCompact } from "../lib/time";
import { useAutoEditViewStore } from "../store/view-store";
import type { AutoEditProjectSummary } from "@/shared/types/electron";

/**
 * Project dashboard — list/manage saved Auto Edit projects (new/open/rename/delete).
 * Shown when `useAutoEditViewStore.view === "dashboard"`.
 */
export function Dashboard() {
  const { t } = useI18n();
  const setView = useAutoEditViewStore((s) => s.setView);
  const [projects, setProjects] = useState<AutoEditProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const runtime = window.autoEditRuntime;
    if (!runtime) {
      setLoading(false);
      return;
    }
    const result = await runtime.listProjects();
    setProjects(result.projects ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const create = () => {
    newProject();
    setView("editor");
  };

  const open = async (p: AutoEditProjectSummary) => {
    const ok = await loadProjectFromPath(p.filePath);
    if (ok) setView("editor");
  };

  const startRename = (p: AutoEditProjectSummary) => {
    setRenamingId(p.id);
    setRenameValue(p.name);
  };

  const commitRename = async (p: AutoEditProjectSummary) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === p.name) return;
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    const result = await runtime.renameProject({ filePath: p.filePath, name });
    if (result.success) void refresh();
    else toast.error(result.error ?? t("autoEdit.project.saveFailed"));
  };

  const deleteProject = async (p: AutoEditProjectSummary) => {
    if (confirmingId !== p.id) {
      setConfirmingId(p.id);
      window.setTimeout(() => setConfirmingId((id) => (id === p.id ? null : id)), 3000);
      return;
    }
    setConfirmingId(null);
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    const result = await runtime.deleteProject(p.filePath);
    if (result.success) void refresh();
    else toast.error(result.error ?? t("autoEdit.project.saveFailed"));
  };

  const sorted = useMemo(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt), [projects]);

  return (
    <div className="flex h-full min-w-0 bg-background text-foreground">
      <FeatureRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-panel px-5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Film className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight">{t("autoEdit.title")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("autoEdit.dashboard.subtitle")}</p>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void loadProject().then((ok) => { if (ok) setView("editor"); })}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
          >
            <FolderOpen className="size-4" />
            {t("autoEdit.openProject")}
          </button>
          <button
            type="button"
            onClick={create}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t("autoEdit.newProject")}
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState onCreate={create} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  renaming={renamingId === p.id}
                  renameValue={renameValue}
                  confirming={confirmingId === p.id}
                  onRenameValue={setRenameValue}
                  onStartRename={() => startRename(p)}
                  onCommitRename={() => void commitRename(p)}
                  onOpen={() => void open(p)}
                  onDelete={() => void deleteProject(p)}
                  onReveal={() => void window.autoEditRuntime?.revealProject(p.filePath)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Film className="size-7" />
      </span>
      <p className="text-sm font-medium text-foreground">{t("autoEdit.dashboard.empty")}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{t("autoEdit.dashboard.emptyHint")}</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        {t("autoEdit.newProject")}
      </button>
    </div>
  );
}

function ProjectCard({
  project,
  renaming,
  renameValue,
  confirming,
  onRenameValue,
  onStartRename,
  onCommitRename,
  onOpen,
  onDelete,
  onReveal,
}: {
  project: AutoEditProjectSummary;
  renaming: boolean;
  renameValue: string;
  confirming: boolean;
  onRenameValue: (v: string) => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onReveal: () => void;
}) {
  const { t } = useI18n();
  const updated = new Date(project.updatedAt);
  const updatedLabel = Number.isFinite(updated.getTime())
    ? updated.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <div className="group flex flex-col rounded-xl border border-border/60 bg-panel p-3 transition-colors hover:border-border">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
        }}
        className="flex cursor-pointer flex-col items-start text-left"
      >
        <div className="flex h-24 w-full items-center justify-center rounded-lg bg-background/60">
          <Film className="size-8 text-muted-foreground/40" />
        </div>
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameValue(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") onCommitRename();
              if (e.key === "Escape") onCommitRename();
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-medium text-foreground"
          />
        ) : (
          <div className="mt-2 w-full truncate text-sm font-medium text-foreground">{project.name}</div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {updatedLabel}
        </span>
        {project.durationMs > 0 && (
          <span className="font-mono tabular-nums">{formatTimecodeCompact(project.durationMs)}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 border-t border-border/50 pt-2">
        <button
          type="button"
          onClick={onStartRename}
          title={t("autoEdit.dashboard.rename")}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onReveal}
          title={t("autoEdit.dashboard.reveal")}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors",
            confirming
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-destructive",
          )}
        >
          <Trash2 className="size-3.5" />
          {confirming ? t("autoEdit.dashboard.confirmDelete") : ""}
        </button>
      </div>
    </div>
  );
}
