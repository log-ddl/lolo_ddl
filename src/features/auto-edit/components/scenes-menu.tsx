import { Check, ListVideo, Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  createSceneCommand,
  deleteSceneCommand,
  renameSceneCommand,
} from "../commands";
import { useEditorStore } from "../store/editor-store";
import { useTimelineViewStore } from "../store/timeline-view-store";

/**
 * Scene switcher in the editor header — opencut's "Scenes" sheet, condensed to a
 * dropdown. Scenes are separate compositions; switching resets the playhead and
 * selection so the timeline reflects the active scene.
 */
export function ScenesMenu() {
  const { t } = useI18n();
  const project = useEditorStore((s) => s.project);
  const execute = useEditorStore((s) => s.execute);
  const setCurrentScene = useEditorStore((s) => s.setCurrentScene);

  if (!project) return null;
  const scenes = project.scenes;
  const current = scenes.find((s) => s.id === project.currentSceneId) ?? scenes[0];

  const switchScene = (sceneId: string) => {
    if (sceneId === project.currentSceneId) return;
    setCurrentScene(sceneId);
    const view = useTimelineViewStore.getState();
    view.setPlaying(false);
    view.setPlayhead(0);
  };

  const addScene = () => {
    execute(createSceneCommand(t("autoEdit.scenes") + " " + (scenes.length + 1)));
    const view = useTimelineViewStore.getState();
    view.setPlaying(false);
    view.setPlayhead(0);
  };

  const renameScene = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const name = window.prompt(t("autoEdit.scenes.rename"), scene.name);
    if (name && name.trim()) execute(renameSceneCommand(sceneId, name.trim()));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 max-w-40 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground">
        <ListVideo className="size-4" />
        <span className="truncate">{current?.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t("autoEdit.scenes")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {scenes.map((scene) => {
          const isCurrent = scene.id === current?.id;
          return (
            <DropdownMenuItem
              key={scene.id}
              onSelect={(e) => {
                e.preventDefault();
                if (isCurrent) return;
                switchScene(scene.id);
              }}
              className="group"
            >
              <span className="flex-1 truncate">{scene.name}</span>
              {scene.isMain && (
                <span className="rounded bg-sidebar-accent px-1 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">
                  {t("autoEdit.scenes.main")}
                </span>
              )}
              {isCurrent && <Check className="size-4 text-primary" />}
              <span
                className={cn("ml-1 flex items-center", isCurrent ? "opacity-0" : "opacity-0 group-hover:opacity-100")}
              >
                <button
                  type="button"
                  aria-label={t("autoEdit.scenes.rename")}
                  onClick={(e) => {
                    e.stopPropagation();
                    renameScene(scene.id);
                  }}
                  className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
                {!scene.isMain && (
                  <button
                    type="button"
                    aria-label={t("autoEdit.scenes.delete")}
                    onClick={(e) => {
                      e.stopPropagation();
                      execute(deleteSceneCommand(scene.id));
                    }}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={addScene}>
          <Plus className="size-4" />
          {t("autoEdit.scenes.add")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
