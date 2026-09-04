import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, bI as BookOpen, aK as Settings2, bJ as ListOrdered, t as CircleCheck, Y as Clock, u as CircleAlert, F as Film, P as Pencil, a3 as Check, X, d as Trash2, m as ArrowRight, z as Users } from "./lucide-react-DHCwBhKI.js";
import { u as useActiveScriptProject, j as useScriptStore, ab as getStyleName } from "./autopilot-store-5JX3PjC8.js";
import { a as useProjectStore } from "./auto-video-store-kYjrHdTY.js";
import { u as useMediaPanelStore } from "./entry--3YkNZ1p.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-DC6gTyzy.js";
import { B as Badge } from "./badge-CojYt_a0.js";
import { a as useI18n, B as Button, I as Input } from "./index-DI8hnspe.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./model-registry-B3C-u_uk.js";
import "./progress-CiMxjjHG.js";
import "./popover-CDkCw224.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
function EditableText({
  value,
  placeholder,
  onSave,
  multiline = false,
  className = ""
}) {
  const [editing, setEditing] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState(value || "");
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
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Comp,
        {
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !multiline) save();
            if (e.key === "Escape") cancel();
          },
          autoFocus: true,
          className: `text-sm ${multiline ? "min-h-[80px]" : ""} ${className}`,
          placeholder
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 shrink-0", onClick: save, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 shrink-0", onClick: cancel, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `group cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors ${className}`,
      onClick: startEdit,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`, children: value || placeholder }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-50 transition-opacity" })
      ]
    }
  );
}
function SectionCard({
  icon: Icon,
  title,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-primary" }),
      title
    ] }),
    children
  ] });
}
function FieldRow({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground w-16 shrink-0 pt-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children })
  ] });
}
function OverviewPanel() {
  const { t } = useI18n();
  const { activeProjectId } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const { updateSeriesMeta, deleteEpisodeBundle, updateEpisodeBundle } = useScriptStore();
  const { enterEpisode } = useMediaPanelStore();
  const projectId = activeProjectId || "default";
  const meta = scriptProject?.seriesMeta || null;
  const episodes = scriptProject?.episodeRawScripts || [];
  const [deletingEpIndex, setDeletingEpIndex] = reactExports.useState(null);
  const overviewWorkflowSections = [
    {
      id: 1,
      title: t("overview.workflow.stage1"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage1.${i + 1}`))
    },
    {
      id: 2,
      title: t("overview.workflow.stage2"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage2.${i + 1}`))
    },
    {
      id: 3,
      title: t("overview.workflow.stage3"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage3.${i + 1}`))
    },
    {
      id: 4,
      title: t("overview.workflow.stage4"),
      steps: Array.from({ length: 3 }, (_, i) => t(`overview.workflow.stage4.${i + 1}`))
    }
  ];
  const update = reactExports.useCallback(
    (updates) => {
      updateSeriesMeta(projectId, updates);
    },
    [projectId, updateSeriesMeta]
  );
  if (!meta) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-6xl rounded-xl border bg-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b px-5 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5" }),
          t("overview.onboarding")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-2 text-lg font-semibold text-foreground", children: t("overview.workflowTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t("overview.workflowSubtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4", children: overviewWorkflowSections.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-background/50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground", children: section.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: section.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: section.steps.map((step, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-2xs text-muted-foreground", children: idx + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-5 text-foreground", children: step })
        ] }, `${section.id}-${idx}`)) })
      ] }, section.id)) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 pb-2 bg-panel border-b flex items-center justify-between shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        "《",
        meta.title,
        "》",
        meta.genre && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-1 text-2xs", children: meta.genre }),
        meta.era && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-1 text-2xs", children: meta.era })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
        episodes.length,
        " episodes · ",
        meta.characters.length,
        " characters"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 55, minSize: 35, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4 pb-32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SectionCard, { icon: BookOpen, title: t("overview.storyCore"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableText, { value: meta.title, placeholder: t("overview.titlePlaceholder"), onSave: (v) => update({ title: v }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.logline"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableText, { value: meta.logline, placeholder: t("overview.loglinePlaceholder"), onSave: (v) => update({ logline: v }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.outline"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableText, { value: meta.outline, placeholder: t("overview.outlinePlaceholder"), onSave: (v) => update({ outline: v }), multiline: true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.centralConflict"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableText, { value: meta.centralConflict, placeholder: t("overview.centralConflictPlaceholder"), onSave: (v) => update({ centralConflict: v }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.themes"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
            meta.themes?.map((t2, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-2xs", children: t2 }, i)),
            (!meta.themes || meta.themes.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground italic", children: t("overview.noThemes") })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SectionCard, { icon: Settings2, title: t("overview.production"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.visualStyle"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: meta.styleId ? getStyleName(meta.styleId) : t("overview.unset") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRow, { label: t("overview.language"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: meta.language || t("overview.unset") }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: ListOrdered, title: t("overview.episodeDirectory", { count: episodes.length }), children: episodes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: t("overview.noEpisodes") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: episodes.map((ep) => {
          const epSceneCount = ep.scenes?.length || 0;
          const statusIcon = ep.shotGenerationStatus === "completed" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3 text-green-500" }) : ep.shotGenerationStatus === "generating" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 text-yellow-500 animate-spin" }) : ep.shotGenerationStatus === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3 w-3 text-red-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-3 w-3 text-muted-foreground" });
          const isDeleting = deletingEpIndex === ep.episodeIndex;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "group rounded border p-2.5 text-xs space-y-1 hover:bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer",
              onClick: () => enterEpisode(ep.episodeIndex, projectId),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 font-medium", children: [
                  statusIcon,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("overview.episode", { index: ep.episodeIndex }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-normal truncate max-w-[200px]", children: ep.title.replace(/^(?:Episode\s+\d+[:]?\s*)/i, "") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-2xs text-muted-foreground shrink-0", children: [
                  epSceneCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("overview.sceneCount", { count: epSceneCount }) }),
                  ep.season && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-2xs h-4 px-1", children: ep.season }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      size: "icon",
                      variant: "ghost",
                      className: "h-5 w-5 opacity-0 group-hover:opacity-70",
                      onClick: (e) => {
                        e.stopPropagation();
                        const newTitle = window.prompt(t("overview.editEpisodeTitle"), ep.title);
                        if (newTitle !== null && newTitle !== ep.title) {
                          updateEpisodeBundle(projectId, ep.episodeIndex, { title: newTitle });
                        }
                      },
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" })
                    }
                  ),
                  isDeleting ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400 text-2xs", children: t("overview.confirmDeleteEpisode") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        size: "icon",
                        variant: "ghost",
                        className: "h-5 w-5 text-red-500 hover:text-red-400",
                        onClick: () => {
                          deleteEpisodeBundle(projectId, ep.episodeIndex);
                          setDeletingEpIndex(null);
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        size: "icon",
                        variant: "ghost",
                        className: "h-5 w-5",
                        onClick: () => setDeletingEpIndex(null),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      size: "icon",
                      variant: "ghost",
                      className: "h-5 w-5 opacity-0 group-hover:opacity-70 hover:text-red-400",
                      onClick: (e) => {
                        e.stopPropagation();
                        setDeletingEpIndex(ep.episodeIndex);
                      },
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3.5 w-3.5 opacity-0 group-hover:opacity-70 text-primary" })
                ] })
              ] })
            },
            ep.episodeIndex
          );
        }) }) })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 45, minSize: 30, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 space-y-4 pb-32", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SectionCard, { icon: Users, title: t("overview.characters", { count: meta.characters.length }), children: [
        meta.characters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: t("overview.noCharacters") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: meta.characters.slice(0, 20).map((char) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "rounded border p-2 text-xs space-y-0.5 hover:bg-muted/30 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: char.name })
          },
          char.id
        )) }),
        meta.characters.length > 20 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("overview.moreCharacters", { count: meta.characters.length - 20 }) })
      ] }) }) }) })
    ] })
  ] });
}
export {
  OverviewPanel
};
