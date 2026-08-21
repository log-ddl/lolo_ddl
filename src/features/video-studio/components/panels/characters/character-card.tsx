"use client";

/**
 * One character in the gallery, in grid or list layout, with its inline
 * generate / upload / delete actions and Google Flow sync badge.
 */

import { Loader2, Square, Trash2, Upload, User, Volume2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { LocalImage } from "@/shared/components/ui/local-image";
import { TaskInfoButton } from "@/shared/task-metadata";
import { buildCharacterImagePrompt } from "./generation-panel";
import type { Character } from "@/features/video-studio/stores/character-library-store";
import type { GoogleFlowSyncProgress } from "@/features/video-studio/hooks/use-google-flow-sync-status";
import type { ViewMode } from "./gallery-helpers";

export interface CharacterCardProps {
  char: Character;
  viewMode: ViewMode;
  isSelected: boolean;
  isChecked: boolean;
  generating: boolean;
  /** True once the provider accepted the request, so the elapsed timer is meaningful. */
  submitted: boolean;
  generatingElapsedSeconds: number;
  flowSyncProgress?: GoogleFlowSyncProgress;
  /** No Google Flow account is connected, so nothing can be synced right now. */
  flowSyncOffline: boolean;
  projectVisualStyleId: string | undefined;
  onOpen: () => void;
  onToggleSelection: (checked: boolean) => void;
  onPreview: (url: string) => void;
  onUploadImage: (file: File) => void;
  onGenerateImage: () => void;
  onStopGenerate: () => void;
  onDelete: () => void;
  t: Translate;
}

export function CharacterCard({
  char,
  viewMode,
  isSelected,
  isChecked,
  generating,
  submitted,
  generatingElapsedSeconds,
  flowSyncProgress,
  flowSyncOffline,
  projectVisualStyleId,
  onOpen,
  onToggleSelection,
  onPreview,
  onUploadImage,
  onGenerateImage,
  onStopGenerate,
  onDelete,
  t,
}: CharacterCardProps) {
  const hasImage = !!char.thumbnailUrl;
  return (
    <div
    className={cn(
      "rounded-md border cursor-pointer transition-all",
      "hover:border-foreground/30",
      isSelected && "border-primary ring-1 ring-primary",
      viewMode === "grid" ? "p-2" : "p-2 flex items-center gap-3"
    )}
    onClick={onOpen}
    >
    {viewMode === "grid" ? (
      <>
        <div className="mb-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onToggleSelection(checked === true)}
          />
        </div>
        <div
          className="aspect-square rounded bg-muted flex items-center justify-center overflow-hidden mb-2 cursor-zoom-in relative"
          title={t("characters.doubleClickPreview")}
          onClick={(e) => {
            e.stopPropagation();
            if (char.thumbnailUrl) onPreview(char.thumbnailUrl);
          }}
        >
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs">{submitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ'}</span>
            </div>
          ) : char.thumbnailUrl ? (
            <LocalImage
              src={char.thumbnailUrl}
              alt={char.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="absolute top-1 right-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <TaskInfoButton
              outputUrl={char.thumbnailUrl}
              prompt={buildCharacterImagePrompt(char.name, char.styleId || projectVisualStyleId, char.characterPrompt || char.name)}
              kind="image"
              title={t("taskInfo.image")}
              className="h-6 w-6 bg-black/50 text-white hover:bg-black/70 hover:text-white"
            />
            <label className="inline-flex h-6 px-1.5 items-center justify-center rounded-md bg-black/50 text-white hover:bg-black/70 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  if (file) onUploadImage(file);
                }}
              />
              <Upload className="h-3.5 w-3.5" />
            </label>
          </div>
        </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{char.name}</p>
              <span className={cn("px-2 py-0.5 rounded text-[10px]", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600")}>{hasImage ? t("characters.imageReady") : t("characters.noImageYet")}</span>
            </div>
            {flowSyncProgress && flowSyncProgress.total > 0 && (
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded text-[10px]",
                flowSyncProgress.missing === 0
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-orange-500/10 text-orange-600",
              )}>
                {t("characters.syncFlowProgress", { synced: flowSyncProgress.synced, total: flowSyncProgress.total })}
              </span>
            )}
            {flowSyncOffline && (char.thumbnailUrl || (char.referenceImages || []).length > 0) && (
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                {t("characters.syncFlowOffline")}
              </span>
            )}
          {char.voiceId && (
            <div className="flex items-center gap-1 text-[10px] text-blue-500">
              <Volume2 className="h-3 w-3" />
              <span className="truncate">{char.voiceId}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{hasImage ? t("characters.imageReady") : t("characters.generateImageHint")}</p>
      
          <div className="flex items-center gap-1">
            {hasImage ? (
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                {t("characters.openDetails")}
              </Button>
            ) : (
              <Button size="sm" className="h-7 text-xs flex-1" disabled={generating} onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}>
                {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {generating ? (submitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ') : t("characters.generateImage")}
              </Button>
            )}
            {generating && (
              <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onStopGenerate(); }}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </>
    ) : (
      <>
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onToggleSelection(checked === true)}
          />
        </div>
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {generating ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : char.thumbnailUrl ? (
            <LocalImage
              src={char.thumbnailUrl}
              alt={char.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{char.name}</p>
            <span className={cn("px-2 py-0.5 rounded text-[10px]", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600")}>{hasImage ? t("characters.imageReady") : t("characters.noImageYet")}</span>
            {flowSyncProgress && flowSyncProgress.total > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] shrink-0",
                flowSyncProgress.missing === 0
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-orange-500/10 text-orange-600",
              )}>
                {t("characters.syncFlowProgress", { synced: flowSyncProgress.synced, total: flowSyncProgress.total })}
              </span>
            )}
            {flowSyncOffline && (char.thumbnailUrl || (char.referenceImages || []).length > 0) && (
              <span className="px-2 py-0.5 rounded text-[10px] shrink-0 bg-muted text-muted-foreground">
                {t("characters.syncFlowOffline")}
              </span>
            )}
            {char.voiceId && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                <Volume2 className="h-3 w-3" />
                {char.voiceId}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{char.description || char.characterPrompt || t("characters.noDescription")}</p>
      
        </div>
        <TaskInfoButton
          outputUrl={char.thumbnailUrl}
          prompt={buildCharacterImagePrompt(char.name, char.styleId || projectVisualStyleId, char.characterPrompt || char.name)}
          kind="image"
          title={t("taskInfo.image")}
        />
        {hasImage ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            {t("characters.openDetails")}
          </Button>
        ) : (
          <Button size="sm" className="h-7 text-xs" disabled={generating} onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}>
            {generating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {generating
              ? (submitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ')
              : t("characters.generateImage")}
          </Button>
        )}
        {generating && (
          <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onStopGenerate(); }}>
            <Square className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </>
    )}
    </div>
  );
}
