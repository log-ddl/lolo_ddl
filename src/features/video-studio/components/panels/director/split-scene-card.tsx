"use client";

/**
 * Split scene card component.
 * Displays all data for a single split scene, including start frame image,
 * video preview, and prompt editing.
 * Used for the SplitScene type, which differs from the AIScene type in
 * scene-card.tsx.
 */

import React, { useEffect, useState, useRef } from "react";
import { useNow } from "@/shared/lib/use-now";
import { readImageAsBase64 } from "@/features/video-studio/lib/image-storage";
import {
  type SplitScene,
} from "@/features/video-studio/stores/director-store";
import type { PromptLanguage } from "@/features/video-studio/types/script";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { usePreviewStore } from "@/features/video-studio/stores/preview-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { SplitSceneCardHeader } from "./split-scene-card-header";
import { SplitSceneCardFrame } from "./split-scene-card-frame";
import { SplitSceneCardActions } from "./split-scene-card-actions";
import { SplitSceneCardPrompts } from "./split-scene-card-prompts";

export interface SplitSceneCardProps {
  scene: SplitScene;
  resolvedVoice?: string;
  allVoices?: Array<{ voiceId: string; active: boolean }>;
  voiceMode?: 'off' | 'selective' | 'ref' | 'full';
  imageStylePrompt?: string;
  /** Prompt language setting from the script panel. */
  promptLanguage?: PromptLanguage;
  // Three-layer prompt update callbacks
  onUpdateImagePrompt: (id: number, prompt: string) => void;
  onUpdateVideoPrompt: (id: number, prompt: string) => void;
  onUpdateCharacters: (id: number, characterIds: string[]) => void;
  onUpdateCharacterVariationMap?: (id: number, map: Record<string, string>) => void;
  // Scene library association callbacks
  onUpdateSceneReference?: (id: number, sceneLibraryId?: string, referenceImage?: string) => void;
  /**
   * Replaces the built-in character/scene/shot library selectors with a custom
   * reference UI (used by AutoPilot, whose references are job-scoped by name
   * rather than drawn from the shared library). When omitted, the Director's
   * library selectors render as before.
   */
  referenceSlot?: React.ReactNode;
  onDelete?: (id: number) => void;
  onSaveToLibrary?: (scene: SplitScene, type: 'image' | 'video') => void;
  onGenerateImage?: (sceneId: number) => void;
  onGenerateVideo?: (sceneId: number) => void;
  onRemoveImage?: (sceneId: number) => void;
  onUploadImage?: (sceneId: number, imageDataUrl: string) => void;
  // Generic field update callback used for inline editing
  onUpdateField?: (sceneId: number, field: keyof SplitScene, value: any) => void;
  // Stop generation callbacks
  onStopImageGeneration?: (sceneId: number) => void;
  onStopVideoGeneration?: (sceneId: number) => void;
  imageStartedAt?: number;
  videoStartedAt?: number;
  isGeneratingAny?: boolean;
  videoGenerationMode?: 'image-to-video' | 'ref-to-video';
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  allScenes?: SplitScene[];
}

function SplitSceneCardComponent({
  scene,
  allVoices,
  voiceMode = 'off',
  imageStylePrompt = '',
  onUpdateImagePrompt,
  onUpdateVideoPrompt,
  onUpdateCharacters,
  onUpdateSceneReference,
  referenceSlot,
  onDelete,
  onGenerateImage,
  onGenerateVideo,
  onRemoveImage,
  onUploadImage,
  onUpdateField,
  onStopImageGeneration,
  onStopVideoGeneration,
  imageStartedAt,
  videoStartedAt,
  isGeneratingAny,
  videoGenerationMode = 'image-to-video',
  selectable = false,
  selected = false,
  onSelectedChange,
  allScenes = [],
}: SplitSceneCardProps) {
  const isRefToVideo = videoGenerationMode === 'ref-to-video';
  const { t } = useI18n();
  // Editing state: 'none' | 'image' | 'video'
  const [editingPrompt, setEditingPrompt] = useState<'none' | 'image' | 'video'>('none');
  const [editPromptValue, setEditPromptValue] = useState('');
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [shouldRenderMedia, setShouldRenderMedia] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const { setPreviewItem } = usePreviewStore();
  const characters = useCharacterLibraryStore((state) => state.characters);

  // Compute effective display URLs: imageDataUrl → imageHttpUrl fallback
  // (partialize strips data: base64 on save; imageHttpUrl may survive as external URL)
  const effectiveImageUrl = scene.imageDataUrl || scene.imageHttpUrl || '';

  // Resolve local-image:// paths to displayable URLs
  const resolvedImageUrl = useResolvedImageUrl(shouldRenderMedia ? effectiveImageUrl : '');
  const isImageQueued = scene.imageStatus === 'queued';
  const isImagePreparing = scene.imageStatus === 'uploading';
  const isVideoQueued = scene.videoStatus === 'queued';
  const isVideoPreparing = scene.videoStatus === 'uploading';

  const characterIdentityBlock = (scene.characterIds || [])
    .map((characterId) => {
      const character = characters.find((item) => item.id === characterId);
      if (!character) return null;
      const identity = character.identityPrompt || character.description || character.appearance || character.characterPrompt;
      if (!identity?.trim()) return null;
      return `- ${character.name}: ${identity.trim()}`;
    })
    .filter((line): line is string => !!line)
    .join('\n');

  const buildResolvedPromptPreview = (prompt: string | undefined): string => {
    const basePrompt = prompt?.trim();
    if (!basePrompt) return '';
    if (!characterIdentityBlock) return basePrompt;
    return `Character identity lock:\n${characterIdentityBlock}\n\nShot prompt:\n${basePrompt}`;
  };

  const buildResolvedImagePromptPreview = (prompt: string | undefined): string => {
    return buildResolvedPromptPreview([prompt?.trim(), imageStylePrompt.trim()].filter(Boolean).join(', '));
  };

  // Start editing a prompt using the English-first display value.
  const startEditing = (type: 'image' | 'video') => {
    if (type === 'image') {
      setEditPromptValue(scene.imagePrompt || '');
    } else {
      setEditPromptValue(scene.videoPrompt || '');
    }
    setEditingPrompt(type);
  };

  // Save the prompt back into the English field.
  const handleSavePrompt = () => {
    const langLabel = 'English';

    if (editingPrompt === 'image') {
      onUpdateImagePrompt(scene.id, editPromptValue);
      toast.success(t("director.card.startPromptUpdated", { index: scene.id + 1, language: langLabel }));
    } else if (editingPrompt === 'video') {
      onUpdateVideoPrompt(scene.id, editPromptValue);
      toast.success(t("director.card.videoPromptUpdated", { index: scene.id + 1, language: langLabel }));
    }
    setEditingPrompt('none');
  };

  const handleCancelEdit = () => {
    setEditingPrompt('none');
    setEditPromptValue('');
  };

  // Handle start-frame upload
  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUploadImage?.(scene.id, dataUrl);
      toast.success(t("director.card.startUploaded", { index: scene.id + 1 }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Remove start frame
  const handleRemoveImage = () => {
    onRemoveImage?.(scene.id);
    toast.success(t("director.card.startRemoved", { index: scene.id + 1 }));
  };

  // Download image
  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      let blob: Blob;
      if (imageUrl.startsWith('local-image://')) {
        // Electron custom protocol: read via IPC as base64, then convert to Blob.
        const base64 = await readImageAsBase64(imageUrl);
        if (!base64) throw new Error('Unable to read local image');
        const res = await fetch(base64);
        blob = await res.blob();
      } else {
        // data:, http:, and https: URLs can all be fetched directly.
        const res = await fetch(imageUrl);
        blob = await res.blob();
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("director.card.downloadDone", { name: filename }));
    } catch (err) {
      console.error('Download failed:', err);
      toast.error(t("director.card.downloadFailed"));
    }
  };

  // Status helpers
  const isImageGenerating = scene.imageStatus === 'generating';
  const isVideoReady = scene.videoStatus === 'completed' && scene.videoUrl;
  const isVideoGenerating = scene.videoStatus === 'generating';
  const isVideoFailed = scene.videoStatus === 'failed';
  const isVideoModerationSkipped = isVideoFailed && scene.videoError?.startsWith('MODERATION_SKIPPED:');
  const hasImage = !!effectiveImageUrl;
  const hasImagePrompt = !!scene.imagePrompt?.trim();
  const hasVideoPrompt = !!scene.videoPrompt?.trim();
  const generationMode = hasImagePrompt && hasVideoPrompt
    ? 'imageVideo'
    : hasImagePrompt
      ? 'imageOnly'
      : hasVideoPrompt
        ? 'textToVideo'
        : 'noPrompts';
  const canDragVideo = isVideoReady && scene.videoUrl;
  const hasIgnoredImageToVideoData = isRefToVideo && (hasImage || !!scene.imagePrompt);

  const now = useNow(isImageGenerating || isVideoGenerating);

  useEffect(() => {
    if (shouldRenderMedia) return;
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setShouldRenderMedia(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderMedia(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRenderMedia]);

  const imageElapsedSeconds = imageStartedAt ? Math.max(0, Math.floor((now - imageStartedAt) / 1000)) : 0;
  const videoElapsedSeconds = videoStartedAt ? Math.max(0, Math.floor((now - videoStartedAt) / 1000)) : scene.videoProgress;

  // Handle drag start for video
  const handleVideoDragStart = (e: React.DragEvent) => {
    if (!canDragVideo || !scene.videoUrl) return;

    const dragData = {
      id: scene.videoMediaId || `scene-${scene.id}-video`,
      type: 'video',
      name: t("director.preview.aiShotVideo", { index: scene.id + 1 }),
      url: scene.videoUrl,
      thumbnailUrl: scene.imageDataUrl,
      duration: 5,
    };

    e.dataTransfer.setData('application/x-media-item', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    const dragImage = document.createElement('div');
    dragImage.className = 'bg-primary text-white px-2 py-1 rounded text-xs';
    dragImage.textContent = t("director.preview.shotVideo", { index: scene.id + 1 });
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Hidden file upload input
  const firstFrameInput = (
    <input
      ref={firstFrameInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFirstFrameUpload}
    />
  );

  return (
    <div ref={cardRef} className="group relative border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors">
      <SplitSceneCardHeader
        scene={scene}
        allVoices={allVoices}
        voiceMode={voiceMode}
        effectiveImageUrl={effectiveImageUrl}
        isGeneratingAny={isGeneratingAny}
        selectable={selectable}
        selected={selected}
        onSelectedChange={onSelectedChange}
        onDelete={onDelete}
        t={t}
      />

      {/* Row 1: start frame and character library */}
      <div className="p-2 space-y-2">
        <SplitSceneCardFrame
          scene={scene}
          allScenes={allScenes}
          referenceSlot={referenceSlot}
          firstFrameInput={firstFrameInput}
          firstFrameInputRef={firstFrameInputRef}
          resolvedImageUrl={resolvedImageUrl}
          shouldRenderMedia={shouldRenderMedia}
          generationMode={generationMode}
          hasImage={hasImage}
          hasImagePrompt={hasImagePrompt}
          hasVideoPrompt={hasVideoPrompt}
          hasIgnoredImageToVideoData={hasIgnoredImageToVideoData}
          imageElapsedSeconds={imageElapsedSeconds}
          isRefToVideo={isRefToVideo}
          isGeneratingAny={isGeneratingAny}
          isImageGenerating={isImageGenerating}
          isImagePreparing={isImagePreparing}
          isImageQueued={isImageQueued}
          setPreviewItem={setPreviewItem}
          onUpdateCharacters={onUpdateCharacters}
          onUpdateSceneReference={onUpdateSceneReference}
          onUpdateField={onUpdateField}
          onUploadImage={onUploadImage}
          onStopImageGeneration={onStopImageGeneration}
          handleDownloadImage={handleDownloadImage}
          handleRemoveImage={handleRemoveImage}
          t={t}
        />

        <SplitSceneCardActions
          scene={scene}
          resolvedImageUrl={resolvedImageUrl}
          shouldRenderMedia={shouldRenderMedia}
          canDragVideo={canDragVideo}
          hasImage={hasImage}
          hasImagePrompt={hasImagePrompt}
          imageElapsedSeconds={imageElapsedSeconds}
          videoElapsedSeconds={videoElapsedSeconds}
          isRefToVideo={isRefToVideo}
          isGeneratingAny={isGeneratingAny}
          isImageGenerating={isImageGenerating}
          isImagePreparing={isImagePreparing}
          isImageQueued={isImageQueued}
          isVideoFailed={isVideoFailed}
          isVideoGenerating={isVideoGenerating}
          isVideoModerationSkipped={isVideoModerationSkipped}
          isVideoPreparing={isVideoPreparing}
          isVideoQueued={isVideoQueued}
          isVideoReady={isVideoReady}
          setPreviewItem={setPreviewItem}
          onGenerateImage={onGenerateImage}
          onGenerateVideo={onGenerateVideo}
          onStopImageGeneration={onStopImageGeneration}
          onStopVideoGeneration={onStopVideoGeneration}
          handleVideoDragStart={handleVideoDragStart}
          t={t}
        />

        <SplitSceneCardPrompts
          scene={scene}
          showPromptDetails={showPromptDetails}
          setShowPromptDetails={setShowPromptDetails}
          editingPrompt={editingPrompt}
          editPromptValue={editPromptValue}
          setEditPromptValue={setEditPromptValue}
          isRefToVideo={isRefToVideo}
          isGeneratingAny={isGeneratingAny}
          buildResolvedPromptPreview={buildResolvedPromptPreview}
          buildResolvedImagePromptPreview={buildResolvedImagePromptPreview}
          startEditing={startEditing}
          handleSavePrompt={handleSavePrompt}
          handleCancelEdit={handleCancelEdit}
          t={t}
        />
      </div>
    </div>
  );
}

const areVoiceListsEqual = (
  prev?: Array<{ voiceId: string; active: boolean }>,
  next?: Array<{ voiceId: string; active: boolean }>,
): boolean => {
  if (prev === next) return true;
  if (!prev || !next || prev.length !== next.length) return false;
  return prev.every((voice, index) => voice.voiceId === next[index].voiceId && voice.active === next[index].active);
};

export const SplitSceneCard = React.memo(SplitSceneCardComponent, (prev, next) => {
  return prev.scene === next.scene
    && prev.resolvedVoice === next.resolvedVoice
    && areVoiceListsEqual(prev.allVoices, next.allVoices)
    && prev.voiceMode === next.voiceMode
    && prev.imageStylePrompt === next.imageStylePrompt
    && prev.promptLanguage === next.promptLanguage
    && prev.imageStartedAt === next.imageStartedAt
    && prev.videoStartedAt === next.videoStartedAt
    && prev.isGeneratingAny === next.isGeneratingAny
    && prev.videoGenerationMode === next.videoGenerationMode
    && prev.selectable === next.selectable
    && prev.selected === next.selected
    && prev.allScenes === next.allScenes
    && prev.referenceSlot === next.referenceSlot
    && prev.onUpdateImagePrompt === next.onUpdateImagePrompt
    && prev.onUpdateVideoPrompt === next.onUpdateVideoPrompt
    && prev.onUpdateCharacters === next.onUpdateCharacters
    && prev.onUpdateCharacterVariationMap === next.onUpdateCharacterVariationMap
    && prev.onUpdateSceneReference === next.onUpdateSceneReference
    && prev.onDelete === next.onDelete
    && prev.onSaveToLibrary === next.onSaveToLibrary
    && prev.onGenerateImage === next.onGenerateImage
    && prev.onGenerateVideo === next.onGenerateVideo
    && prev.onRemoveImage === next.onRemoveImage
    && prev.onUploadImage === next.onUploadImage
    && prev.onUpdateField === next.onUpdateField
    && prev.onStopImageGeneration === next.onStopImageGeneration
    && prev.onStopVideoGeneration === next.onStopVideoGeneration;
});
