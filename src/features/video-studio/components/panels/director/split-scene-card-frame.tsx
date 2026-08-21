"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import {
  Download,
  ImageIcon,
  Loader2,
  Square,
  Upload,
  X,
} from "lucide-react";
import { CharacterSelector } from "./character-selector";
import { SceneLibrarySelector } from "./scene-library-selector";
import { ShotReferenceSelector } from "./shot-reference-selector";
import { MediaLibrarySelector } from "./media-library-selector";
import { LocalImage } from "@/shared/components/ui/local-image";

/**
 * First row of a split scene card: the start-frame thumbnail with its
 * upload/download/remove controls, plus the character, scene-reference and
 * media-library selectors.
 */

export interface SplitSceneCardFrameProps {
  scene: SplitScene;
  allScenes: SplitScene[];
  referenceSlot?: React.ReactNode;
  firstFrameInput: React.ReactNode;
  firstFrameInputRef: React.RefObject<HTMLInputElement>;
  resolvedImageUrl: string | null;
  shouldRenderMedia: boolean;
  generationMode: string;
  hasImage: boolean;
  hasImagePrompt: boolean;
  hasVideoPrompt: boolean;
  hasIgnoredImageToVideoData: boolean;
  imageElapsedSeconds: number;
  isRefToVideo: boolean;
  isGeneratingAny?: boolean;
  isImageGenerating: boolean;
  isImagePreparing: boolean;
  isImageQueued: boolean;
  setPreviewItem: (item: any) => void;
  onUpdateCharacters: (id: number, characterIds: string[]) => void;
  onUpdateSceneReference?: (id: number, sceneLibraryId?: string, referenceImage?: string) => void;
  onUpdateField?: (sceneId: number, field: keyof SplitScene, value: any) => void;
  onUploadImage?: (id: number, dataUrl: string) => void;
  onStopImageGeneration?: (id: number) => void;
  handleDownloadImage: (imageUrl: string, filename: string) => void;
  handleRemoveImage: () => void;
  t: Translate;
}

export function SplitSceneCardFrame(props: SplitSceneCardFrameProps) {
  const {
    scene, allScenes, referenceSlot, firstFrameInput, firstFrameInputRef,
    resolvedImageUrl, shouldRenderMedia, generationMode, hasImage, hasImagePrompt,
    hasVideoPrompt, hasIgnoredImageToVideoData, imageElapsedSeconds, isRefToVideo,
    isGeneratingAny, isImageGenerating, isImagePreparing, isImageQueued,
    setPreviewItem, onUpdateCharacters, onUpdateSceneReference, onUpdateField,
    onUploadImage, onStopImageGeneration, handleDownloadImage, handleRemoveImage, t,
  } = props;

  return (
    <>
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          {isRefToVideo && (
            <select
              className="h-6 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground"
              value={scene.videoLength || 4}
              onChange={(e) => onUpdateField?.(scene.id, 'videoLength', Number(e.target.value))}
              disabled={isGeneratingAny || !onUpdateField}
              title="Video length"
            >
              <option value={4}>4s</option>
              <option value={6}>6s</option>
              <option value={8}>8s</option>
            </select>
          )}
          {!isRefToVideo && <>
            {/* Start frame image */}
            <div className="w-[132px] shrink-0 max-w-full sm:w-[148px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  {t("director.card.startFrame")}
                </span>
                <select
                  className="h-5 rounded border border-border bg-background px-1 text-[10px] font-medium text-foreground"
                  value={scene.videoLength || 4}
                  onChange={(e) => onUpdateField?.(scene.id, 'videoLength', Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isGeneratingAny || !onUpdateField}
                  title="Video length"
                >
                  <option value={4}>4s</option>
                  <option value={6}>6s</option>
                  <option value={8}>8s</option>
                </select>
              </div>
              <div
                className="aspect-video bg-muted rounded cursor-pointer relative group/image overflow-hidden border-2 transition-colors border-primary border-solid"
                onClick={() => {
                  if (hasImage && resolvedImageUrl) {
                    setPreviewItem({ type: 'image', url: resolvedImageUrl, name: t("director.preview.shotFrame", { index: scene.id + 1, frame: t("director.card.startFrame") }) });
                  } else {
                    firstFrameInputRef.current?.click();
                  }
                }}
              >
                {hasImage && shouldRenderMedia ? (
                  <>
                    <LocalImage
                      src={resolvedImageUrl || ''}
                      fallback={scene.imageHttpUrl || undefined}
                      alt={t("director.preview.shotFrame", { index: scene.id + 1, frame: t("director.card.startFrame") })}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDownloadImage(resolvedImageUrl || scene.imageDataUrl, `${t("director.preview.shot", { index: scene.id + 1 })}_${t("director.card.startFrame")}.png`); }}
                        className="p-0.5 rounded bg-black/50 text-white hover:bg-blue-600"
                        title={t("director.card.downloadStart")}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemoveImage(); }}
                        className="p-0.5 rounded bg-black/50 text-white hover:bg-red-600"
                        title={t("director.card.deleteStart")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {scene.imageSource === 'ai-generated' && (
                      <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-primary text-white px-1 rounded">{t("director.aiBadge")}</span>
                    )}
                  </>
                ) : hasImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted/60">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/50">Đang tải ảnh</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Upload className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50">{t("director.card.upload")}</span>
                  </div>
                )}
                {isImageGenerating && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                    <span className="text-[10px] text-white">Đang tạo {imageElapsedSeconds}s</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onStopImageGeneration?.(scene.id); }}
                      className="mt-1 px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-[9px] flex items-center gap-0.5 transition-colors"
                      title={t("director.card.stop")}
                    >
                      <Square className="h-2.5 w-2.5" />{t("director.card.stop")}
                    </button>
                  </div>
                )}
                {(isImageQueued || isImagePreparing) && !isImageGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-white">{isImagePreparing ? 'Đang chuẩn bị ảnh' : t("director.pendingStatus")}</span>
                  </div>
                )}
              </div>
              {firstFrameInput}
            </div>

          </>}

          {/* Character library and scene reference selectors */}
          {referenceSlot ? (
            <div className={cn("flex min-w-0 flex-1 flex-col gap-1 justify-end", isRefToVideo && "min-w-[220px]")}>
              {referenceSlot}
            </div>
          ) : (
          <div className={cn("flex min-w-0 flex-1 flex-col gap-1 justify-end", isRefToVideo && "min-w-[220px]")}>
            <CharacterSelector
              selectedIds={scene.characterIds || []}
              onChange={(ids) => onUpdateCharacters(scene.id, ids)}
              disabled={isGeneratingAny}
            />
            {onUpdateSceneReference && (
              <SceneLibrarySelector
                sceneId={scene.id}
                selectedSceneLibraryId={scene.sceneLibraryId}
                onChange={(sceneLibId, refImage) =>
                  onUpdateSceneReference(scene.id, sceneLibId, refImage)
                }
                disabled={isGeneratingAny}
              />
            )}
            {onUpdateField && (
              <ShotReferenceSelector
                currentSceneId={scene.id}
                scenes={allScenes}
                selectedIndexes={scene.ref_image || []}
                onChange={(indexes) => onUpdateField(scene.id, 'ref_image', indexes)}
                disabled={isGeneratingAny}
              />
            )}
            {/* Media library selector */}
            {!isRefToVideo && onUploadImage && (
              <MediaLibrarySelector
                sceneId={scene.id}
                onSelect={(imageUrl) => {
                  onUploadImage(scene.id, imageUrl);
                }}
                disabled={isGeneratingAny}
              />
            )}
          </div>
          )}
        </div>

        {hasIgnoredImageToVideoData && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/8 px-2.5 py-2 text-[11px] text-amber-700 dark:text-amber-300">
            {t("director.refToVideoIgnoredNotice")}
          </div>
        )}

        <div className="flex flex-wrap gap-1 text-[10px]">
          <span className={cn(
            "rounded-full border px-2 py-0.5",
            generationMode === 'imageVideo'
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : generationMode === 'textToVideo'
                ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                : generationMode === 'imageOnly'
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "border-muted bg-muted/50 text-muted-foreground"
          )}>{t(`director.card.mode.${generationMode}`)}</span>
          {!hasImagePrompt && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">{t("director.card.noImagePrompt")}</span>}
          {!hasVideoPrompt && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">{t("director.card.noVideoPrompt")}</span>}
        </div>
    </>
  );
}
