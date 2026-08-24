"use client";

/**
 * OverviewPanel - project overview with SeriesMeta display and inline editing.
 *
 * Two-column layout:
 *   Left: story core + production settings + episode list
 *   Right: characters
 */

import { useState, useCallback } from "react";
import { useScriptStore, useActiveScriptProject } from "@/features/video-studio/stores/script-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/shared/components/ui/resizable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  BookOpen,
  Users,
  Pencil,
  Check,
  X,
  Settings2,
  ListOrdered,
  Film,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ArrowRight,
} from "lucide-react";
import type { SeriesMeta, EpisodeRawScript } from "@/features/video-studio/types/script";
import { getStyleName } from "@/features/video-studio/lib/constants/visual-styles";
import { useI18n } from "@/shared/i18n";

// ==================== Inline Editable Field ====================

function EditableText({
  value,
  placeholder,
  onSave,
  multiline = false,
  className = "",
}: {
  value: string | undefined;
  placeholder: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const startEdit = () => {
    setDraft(value || "");
    setEditing(true);
  };

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    const Comp = multiline ? Textarea : Input;
    return (
      <div className="flex items-start gap-1">
        <Comp
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !multiline) save();
            if (e.key === "Escape") cancel();
          }}
          autoFocus
          className={`text-sm ${multiline ? "min-h-[80px]" : ""} ${className}`}
          placeholder={placeholder}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={save}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`group cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors ${className}`}
      onClick={startEdit}
    >
      <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}

// ==================== Section Card ====================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

// ==================== Field Row ====================

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ==================== Main Component ====================

export function OverviewPanel() {
  const { t } = useI18n();
  const { activeProjectId } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const { updateSeriesMeta, deleteEpisodeBundle, updateEpisodeBundle } = useScriptStore();
  const { enterEpisode } = useMediaPanelStore();

  const projectId = activeProjectId || "default";
  const meta: SeriesMeta | null = scriptProject?.seriesMeta || null;
  const episodes: EpisodeRawScript[] = scriptProject?.episodeRawScripts || [];
  // Delete-confirmation state.
  const [deletingEpIndex, setDeletingEpIndex] = useState<number | null>(null);

  const overviewWorkflowSections: Array<{ id: number; title: string; steps: string[] }> = [
    {
      id: 1,
      title: t("overview.workflow.stage1"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage1.${i + 1}`)),
    },
    {
      id: 2,
      title: t("overview.workflow.stage2"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage2.${i + 1}`)),
    },
    {
      id: 3,
      title: t("overview.workflow.stage3"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage3.${i + 1}`)),
    },
    {
      id: 4,
      title: t("overview.workflow.stage4"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage4.${i + 1}`)),
    },
  ];

  const update = useCallback(
    (updates: Partial<SeriesMeta>) => {
      updateSeriesMeta(projectId, updates);
    },
    [projectId, updateSeriesMeta]
  );

  if (!meta) {
    return (
      <div className="h-full p-6">
        <div className="mx-auto w-full max-w-6xl rounded-xl border bg-panel">
          <div className="border-b px-5 py-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              {t("overview.onboarding")}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{t("overview.workflowTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("overview.workflowSubtitle")}</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewWorkflowSections.map((section) => (
              <div key={section.id} className="rounded-lg border bg-background/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {section.id}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                </div>
                <div className="space-y-2">
                  {section.steps.map((step, idx) => (
                    <div key={`${section.id}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-2xs text-muted-foreground">
                        {idx + 1}
                      </span>
                      <p className="text-sm leading-5 text-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 pb-2 bg-panel border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Project metadata only — the breadcrumb above already says "Overview". */}
          <span className="text-xs text-muted-foreground">
            《{meta.title}》
            {meta.genre && <Badge variant="secondary" className="ml-1 text-2xs">{meta.genre}</Badge>}
            {meta.era && <Badge variant="outline" className="ml-1 text-2xs">{meta.era}</Badge>}
          </span>
        </div>
        <span className="text-2xs text-muted-foreground">
          {episodes.length} episodes · {meta.characters.length} characters
        </span>
      </div>

      {/* Two-column layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: Story + settings + episode list */}
        <ResizablePanel defaultSize={55} minSize={35}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 pb-32">
              <SectionCard icon={BookOpen} title={t("overview.storyCore")}>
                <FieldRow label={t("overview.title")}>
                  <EditableText value={meta.title} placeholder={t("overview.titlePlaceholder")} onSave={(v) => update({ title: v })} />
                </FieldRow>
                <FieldRow label={t("overview.logline")}>
                  <EditableText value={meta.logline} placeholder={t("overview.loglinePlaceholder")} onSave={(v) => update({ logline: v })} />
                </FieldRow>
                <FieldRow label={t("overview.outline")}>
                  <EditableText value={meta.outline} placeholder={t("overview.outlinePlaceholder")} onSave={(v) => update({ outline: v })} multiline />
                </FieldRow>
                <FieldRow label={t("overview.centralConflict")}>
                  <EditableText value={meta.centralConflict} placeholder={t("overview.centralConflictPlaceholder")} onSave={(v) => update({ centralConflict: v })} />
                </FieldRow>
                <FieldRow label={t("overview.themes")}>
                  <div className="flex flex-wrap gap-1">
                    {meta.themes?.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-2xs">{t}</Badge>
                    ))}
                    {(!meta.themes || meta.themes.length === 0) && (
                      <span className="text-xs text-muted-foreground italic">{t("overview.noThemes")}</span>
                    )}
                  </div>
                </FieldRow>
              </SectionCard>

              <SectionCard icon={Settings2} title={t("overview.production")}> 
                <FieldRow label={t("overview.visualStyle")}> 
                  <span className="text-xs">{meta.styleId ? getStyleName(meta.styleId) : t("overview.unset")}</span>
                </FieldRow>
                <FieldRow label={t("overview.language")}> 
                  <span className="text-xs">{meta.language || t("overview.unset")}</span>
                </FieldRow>
              </SectionCard>

              <SectionCard icon={ListOrdered} title={t("overview.episodeDirectory", { count: episodes.length })}>
                {episodes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">{t("overview.noEpisodes")}</p>
                ) : (
                  <div className="space-y-2">
                    {episodes.map((ep) => {
                      const epSceneCount = ep.scenes?.length || 0;
                      const statusIcon = ep.shotGenerationStatus === 'completed'
                        ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                        : ep.shotGenerationStatus === 'generating'
                          ? <Clock className="h-3 w-3 text-yellow-500 animate-spin" />
                          : ep.shotGenerationStatus === 'error'
                            ? <AlertCircle className="h-3 w-3 text-red-500" />
                            : <Film className="h-3 w-3 text-muted-foreground" />;
                      const isDeleting = deletingEpIndex === ep.episodeIndex;

                      return (
                        <div
                          key={ep.episodeIndex}
                          className="group rounded border p-2.5 text-xs space-y-1 hover:bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => enterEpisode(ep.episodeIndex, projectId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-medium">
                              {statusIcon}
                              <span>{t("overview.episode", { index: ep.episodeIndex })}</span>
                              <span className="text-muted-foreground font-normal truncate max-w-[200px]">
                                {ep.title.replace(/^(?:Episode\s+\d+[:]?\s*)/i, '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-2xs text-muted-foreground shrink-0">
                              {epSceneCount > 0 && <span>{t("overview.sceneCount", { count: epSceneCount })}</span>}
                              {ep.season && <Badge variant="outline" className="text-2xs h-4 px-1">{ep.season}</Badge>}
                               {/* Edit title */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 opacity-0 group-hover:opacity-70"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newTitle = window.prompt(t("overview.editEpisodeTitle"), ep.title);
                                  if (newTitle !== null && newTitle !== ep.title) {
                                    updateEpisodeBundle(projectId, ep.episodeIndex, { title: newTitle });
                                  }
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                               {/* Delete */}
                              {isDeleting ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-red-400 text-2xs">{t("overview.confirmDeleteEpisode")}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-red-500 hover:text-red-400"
                                    onClick={() => {
                                      deleteEpisodeBundle(projectId, ep.episodeIndex);
                                      setDeletingEpIndex(null);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() => setDeletingEpIndex(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-70 hover:text-red-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingEpIndex(ep.episodeIndex);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                               {/* Enter arrow */}
                              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-70 text-primary" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </SectionCard>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: Characters */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 pb-32">
              <SectionCard icon={Users} title={t("overview.characters", { count: meta.characters.length })}>
                {meta.characters.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">{t("overview.noCharacters")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {meta.characters.slice(0, 20).map((char) => (
                      <div
                        key={char.id}
                        className="rounded border p-2 text-xs space-y-0.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="font-medium">{char.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {meta.characters.length > 20 && (
                  <p className="text-2xs text-muted-foreground">
                    {t("overview.moreCharacters", { count: meta.characters.length - 20 })}
                  </p>
                )}
              </SectionCard>

            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
