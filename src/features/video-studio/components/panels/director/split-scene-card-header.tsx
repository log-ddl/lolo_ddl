"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { MapPin, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { TaskInfoButton } from "@/shared/task-metadata";

/**
 * Title bar of a split scene card: selection checkbox, shot number, assigned
 * voices, scene/location tooltip, task info buttons and the delete dialog.
 */

export interface SplitSceneCardHeaderProps {
  scene: SplitScene;
  allVoices?: Array<{ voiceId: string; active: boolean }>;
  voiceMode: string;
  effectiveImageUrl: string;
  isGeneratingAny?: boolean;
  selectable: boolean;
  selected: boolean;
  onSelectedChange?: (checked: boolean) => void;
  onDelete?: (id: number) => void;
  t: Translate;
}

export function SplitSceneCardHeader({
  scene,
  allVoices,
  voiceMode,
  effectiveImageUrl,
  isGeneratingAny,
  selectable,
  selected,
  onSelectedChange,
  onDelete,
  t,
}: SplitSceneCardHeaderProps) {
  return (
    <>
      {/* Shot header and controls */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border-b">
        <div className="flex min-w-0 items-center gap-2">
          {selectable && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelectedChange?.(checked === true)}
              />
            </div>
          )}
          <span className="text-sm font-bold text-muted-foreground">{t("director.card.shot", { index: scene.id + 1 })}</span>
          {voiceMode !== 'off' && (
            allVoices && allVoices.length > 0 ? (
              <span className="flex items-center gap-0.5">
                {allVoices.map(({ voiceId, active }) => (
                  <span
                    key={voiceId}
                    className={cn(
                      "text-2xs px-1.5 py-0.5 rounded border",
                      active
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {voiceId}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-2xs px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border">
                {t("voice.sceneUnassigned", { mode: t(`voice.mode.${voiceMode}`) })}
              </span>
            )
          )}
          {(scene.sceneName || scene.sceneLocation) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary cursor-default">
                    <MapPin className="h-3 w-3" />
                    {scene.sceneName || scene.sceneLocation}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    {scene.sceneName && <p>{t("director.card.scene", { name: scene.sceneName })}</p>}
                    {scene.sceneLocation && <p>{t("director.card.location", { name: scene.sceneLocation })}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
          <TaskInfoButton outputUrl={effectiveImageUrl} prompt={scene.imagePrompt} kind="image" title={t("taskInfo.image")} />
          <TaskInfoButton outputUrl={scene.videoUrl} prompt={scene.videoPrompt} kind="video" title={t("taskInfo.video")} />
        {onDelete && !isGeneratingAny && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("director.card.deleteShot", { index: scene.id + 1 })}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("director.card.deleteBody")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(scene.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("dashboard.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        </div>
      </div>
    </>
  );
}
