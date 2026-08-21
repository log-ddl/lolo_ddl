"use client";

/**
 * One scene in the gallery, in grid or list layout, with its inline generate /
 * upload / delete actions and Google Flow sync badge.
 */

import { Loader2, MapPin, Square, Trash2, Upload } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
import { buildSceneImagePrompt } from "@/features/video-studio/lib/scene-image-prompt";
import { TaskInfoButton } from "@/shared/task-metadata";
import type { Scene } from "@/features/video-studio/stores/scene-store";
import type { GoogleFlowSyncProgress } from "@/features/video-studio/hooks/use-google-flow-sync-status";
import type { ViewMode } from "./gallery-helpers";

export function SceneCard({
  scene,
  isSelected,
  viewMode,
  onClick,
  depth = 0,
  childCount: _childCount = 0,
  isExpanded = false,
  hasChildren = false,
  onToggleExpand,
  onImagePreview,
  selected = false,
  onSelectionChange,
  onDeleteVisible,
  generating = false,
  generationSubmitted = false,
  generatingElapsedSeconds = 0,
  onGenerateImage,
  onStopGenerateImage,
  onUploadImage,
  flowSyncEnabled = false,
  flowSyncProgress,
  flowSyncOffline = false,
}: {
  scene: Scene;
  isSelected: boolean;
  viewMode: ViewMode;
  onClick: () => void;
  depth?: number;         // Nested depth level.
  childCount?: number;    // Number of child scenes.
  isExpanded?: boolean;   // Whether the node is expanded.
  hasChildren?: boolean;  // Whether the node has child scenes.
  onToggleExpand?: () => void;
  onImagePreview?: (url: string) => void;
  selected?: boolean;
  onSelectionChange?: (checked: boolean) => void;
  onDeleteVisible?: () => void;
  generating?: boolean;
  generationSubmitted?: boolean;
  generatingElapsedSeconds?: number;
  onGenerateImage?: () => void;
  onStopGenerateImage?: () => void;
  onUploadImage?: (file: File) => void;
  flowSyncEnabled?: boolean;
  flowSyncProgress?: GoogleFlowSyncProgress;
  flowSyncOffline?: boolean;
}) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const displayImage = scene.referenceImage || undefined;
  const resolvedImage = useResolvedImageUrl(displayImage);
  const hasImage = !!scene.referenceImage;
  const hasSyncSource = Boolean(scene.referenceImage || scene.referenceImageBase64);
  const promptText = scene.description || scene.scenePrompt || t("scenes.noDescription");
  const generationPrompt = buildSceneImagePrompt({
    ...scene,
    aspectRatio: scene.aspectRatio || '16:9',
    styleId: scene.styleId || projectVisualStyleId,
  });

  // Indent cards according to their nesting depth.
  const indentStyle = { marginLeft: `${depth * 20}px` };

  if (viewMode === "grid") {
    return (
      <div
        style={indentStyle}
        className={cn(
          "rounded-md border cursor-pointer transition-all p-2",
            "hover:border-foreground/30",
            isSelected && "border-primary ring-1 ring-primary"
        )}
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (hasChildren) {
            onToggleExpand?.();
          }
        }}
      >
        {depth === 0 && (
          <div className="mb-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={(checked) => onSelectionChange?.(checked === true)} />
          </div>
        )}
        <div
          className={cn(
            "aspect-square rounded bg-muted flex items-center justify-center overflow-hidden mb-2 relative",
            hasChildren ? "cursor-pointer" : "cursor-zoom-in"
          )}
          title={hasChildren ? (isExpanded ? t("scenes.collapseChildren") : t("scenes.expandChildren")) : t("scenes.previewFullImage")}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand?.();
            } else {
              if (resolvedImage) onImagePreview?.(resolvedImage);
            }
          }}
        >
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs">{generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ'}</span>
            </div>
          ) : displayImage ? (
            <img 
              src={resolvedImage || ''} 
              alt={scene.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <MapPin className="h-8 w-8 text-muted-foreground" />
          )}
          {depth === 0 && (
            <div className="absolute top-1 right-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <TaskInfoButton
                outputUrl={scene.referenceImage}
                prompt={generationPrompt}
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
                    if (file) onUploadImage?.(file);
                  }}
                />
                <Upload className="h-3.5 w-3.5" />
              </label>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{scene.name}</p>
            <span className={cn("px-2 py-0.5 rounded text-[10px] shrink-0", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600")}>
              {hasImage ? t("scenes.imageReady") : t("scenes.imageMissing")}
            </span>
          </div>
          {flowSyncEnabled && hasSyncSource && (
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded text-[10px]",
              flowSyncOffline
                ? "bg-muted text-muted-foreground"
                : flowSyncProgress?.missing === 0
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-orange-500/10 text-orange-600",
            )}>
              {flowSyncOffline
                ? t("scenes.syncFlowOffline")
                : t("scenes.syncFlowProgress", {
                    synced: flowSyncProgress?.synced || 0,
                    total: flowSyncProgress?.total || 0,
                  })}
            </span>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{promptText}</p>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <TaskInfoButton outputUrl={scene.referenceImage} prompt={generationPrompt} kind="image" title={t("taskInfo.image")} />
            <Button
              size="sm"
              variant={hasImage ? "outline" : "default"}
              className="h-7 text-xs flex-1"
              disabled={generating}
              onClick={hasImage ? onClick : (event) => { event.stopPropagation(); onGenerateImage?.(); }}
            >
              {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />{generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ'}</> : hasImage ? t("scenes.openDetails") : t("scenes.generateSceneImage")}
            </Button>
            {generating && (
              <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={onStopGenerateImage}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDeleteVisible}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      style={indentStyle}
      className={cn(
          "rounded-md border cursor-pointer transition-all p-2 flex items-center gap-3",
        "hover:border-foreground/30",
        isSelected && "border-primary ring-1 ring-primary"
      )}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (hasChildren) {
          onToggleExpand?.();
        }
      }}
    >
      {depth === 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={(checked) => onSelectionChange?.(checked === true)} />
        </div>
      )}
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
        {generating ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : displayImage ? (
          <img 
            src={resolvedImage || ''} 
            alt={scene.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <MapPin className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{scene.name}</p>
          <span className={cn("px-2 py-0.5 rounded text-[10px] shrink-0", hasImage ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600")}>
            {hasImage ? t("scenes.imageReady") : t("scenes.imageMissing")}
          </span>
          {flowSyncEnabled && hasSyncSource && (
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] shrink-0",
              flowSyncOffline
                ? "bg-muted text-muted-foreground"
                : flowSyncProgress?.missing === 0
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-orange-500/10 text-orange-600",
            )}>
              {flowSyncOffline
                ? t("scenes.syncFlowOffline")
                : t("scenes.syncFlowProgress", {
                    synced: flowSyncProgress?.synced || 0,
                    total: flowSyncProgress?.total || 0,
                  })}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{promptText}</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
        <Button
          size="sm"
          variant={hasImage ? "outline" : "default"}
          className="h-7 text-xs"
          disabled={generating}
          onClick={(e) => { e.stopPropagation(); if (hasImage) onClick(); else onGenerateImage?.(); }}
        >
          {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />{generationSubmitted ? `Đang tạo ${generatingElapsedSeconds}s` : 'Đang chờ'}</> : hasImage ? t("scenes.openDetails") : t("scenes.generateSceneImage")}
        </Button>
        {generating && (
          <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onStopGenerateImage?.(); }}>
            <Square className="h-3.5 w-3.5" />
          </Button>
        )}
        <label className="inline-flex h-6 px-1.5 items-center justify-center rounded-md hover:bg-accent cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = '';
              if (file) onUploadImage?.(file);
            }}
          />
          <Upload className="h-3.5 w-3.5" />
        </label>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteVisible?.(); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
