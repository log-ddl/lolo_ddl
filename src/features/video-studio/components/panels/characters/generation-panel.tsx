"use client";

/**
 * Generation Panel - Left column
 * Character controls: prompt, style, main image, reference images
 */

import { useState, useEffect, useMemo } from "react";
import { useNow } from "@/shared/lib/use-now";
import { useCharacterLibraryStore, type Character } from "@/features/video-studio/stores/character-library-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { 
  Loader2,
  ImagePlus,
  X,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { LocalImage } from "@/shared/components/ui/local-image";
import { getStyleById } from "@/features/video-studio/lib/constants/visual-styles";
import { useI18n } from "@/shared/i18n";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

const ASPECT_RATIO_OPTIONS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;

interface GenerationPanelProps {
  selectedCharacter: Character | null;
  onCharacterCreated?: (id: string) => void;
}

export function GenerationPanel({ selectedCharacter, onCharacterCreated }: GenerationPanelProps) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { 
    addCharacter, 
    updateCharacter: updateLibraryCharacter,
    selectCharacter,
    generationStatus,
    currentFolderId,
  } = useCharacterLibraryStore();
  const { activeProjectId } = useProjectStore();
  
  const { pendingCharacterData, setPendingCharacterData } = useMediaPanelStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<Character['aspectRatio']>('16:9');
  // === Episode scope forwarded from pending data ===
  const [sourceEpisodeId, setSourceEpisodeId] = useState<string | undefined>();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [styleId, setStyleId] = useState<string>(projectVisualStyleId);
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCharacterId, setPreviewCharacterId] = useState<string | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);

  const isGenerating = generationStatus === 'generating';
  const now = useNow(isGenerating);
  const elapsedSeconds = generationStartedAt ? Math.max(0, Math.floor((now - generationStartedAt) / 1000)) : 0;

  useEffect(() => {
    if (!isGenerating) {
      setGenerationStartedAt(null);
      return;
    }
    setGenerationStartedAt((current) => current ?? Date.now());
  }, [isGenerating]);

  const finalImagePromptPreview = useMemo(() => {
    if (!name.trim() && !characterPrompt.trim()) return '';
    return buildCharacterImagePrompt(name || t("characters.name"), styleId, characterPrompt);
  }, [name, styleId, characterPrompt, t]);

  // Keep the form aligned with the selected library record. Keep description and
  // characterPrompt separate; they must never fall back to one another here.
  useEffect(() => {
    if (!selectedCharacter) return;

    setName(selectedCharacter.name || "");
    setDescription(selectedCharacter.description || "");
    setCharacterPrompt(selectedCharacter.characterPrompt || "");
    setAspectRatio(selectedCharacter.aspectRatio || "1:1");
    setReferenceImages(selectedCharacter.referenceImages || []);
    setSourceEpisodeId(selectedCharacter.linkedEpisodeId);

    const validStyle = selectedCharacter.styleId ? getStyleById(selectedCharacter.styleId) : null;
    setStyleId(validStyle?.id || projectVisualStyleId);
  }, [selectedCharacter, projectVisualStyleId]);

  // A blank/new form follows the Director's project style. Existing selected
  // records keep their own saved style and are never overwritten here.
  useEffect(() => {
    if (!selectedCharacter && !pendingCharacterData) {
      setStyleId(projectVisualStyleId);
    }
  }, [projectVisualStyleId, selectedCharacter, pendingCharacterData]);

  // Handle pending data from script panel
  useEffect(() => {
    if (pendingCharacterData) {
      setName(pendingCharacterData.name || "");
      setDescription(pendingCharacterData.description || "");
      setCharacterPrompt(pendingCharacterData.characterPrompt || "");
      
      // === Forward episode scope ===
      setSourceEpisodeId(pendingCharacterData.sourceEpisodeId);

      setStyleId(projectVisualStyleId);
      
      
      setPendingCharacterData(null);
    }
  }, [pendingCharacterData, setPendingCharacterData, projectVisualStyleId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (referenceImages.length + newImages.length >= 3) break;
      try {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      } catch (err) {
        console.error("Failed to convert image:", err);
      }
    }

    if (newImages.length > 0) {
      setReferenceImages([...referenceImages, ...newImages].slice(0, 3));
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  // Create a new character record without generating an image yet.
  const handleCreateRecord = async () => {
    if (!name.trim()) {
      toast.error(t("characters.enterName"));
      return;
    }
    if (!characterPrompt.trim()) {
      toast.error(t("characters.enterDescription"));
      return;
    }
    const persistedReferenceImages = await Promise.all(
      referenceImages.slice(0, 3).map(async (image, index) => {
        if (!image || image.startsWith('local-image://')) return image;
        return saveImageToLocal(image, 'characters', `${name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_ref_${index + 1}.png`);
      })
    );

    if (selectedCharacter) {
      updateLibraryCharacter(selectedCharacter.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        characterPrompt: characterPrompt.trim(),
        aspectRatio,
        referenceImages: persistedReferenceImages.filter(Boolean).length > 0
          ? persistedReferenceImages.filter(Boolean)
          : undefined,
        styleId: styleId === "random" ? undefined : styleId,
      });
      toast.success(t("characters.settingsUpdated"));
      return;
    }

    // Always create a new character.
      const targetId = addCharacter({
      name: name.trim(),
      description: description.trim() || undefined,
      characterPrompt: characterPrompt.trim(),
      aspectRatio,
      referenceImages: persistedReferenceImages.filter(Boolean).length > 0 ? persistedReferenceImages.filter(Boolean) : undefined,
      styleId: styleId === "random" ? undefined : styleId,
      folderId: currentFolderId,
      projectId: activeProjectId || undefined,
      // === Episode scope ===
      linkedEpisodeId: sourceEpisodeId,
    });
    selectCharacter(targetId);
    onCharacterCreated?.(targetId);
    toast.success(t("apiDialog.added", { name: name.trim() }));
  };

  const handleSavePreview = async () => {
    if (!previewUrl || !previewCharacterId) return;

      toast.loading(t("characters.imageSaving"), { id: 'saving-preview' });
    
    try {
      // Save image to local storage
      const localPath = await saveImageToLocal(
        previewUrl, 
        'characters', 
        `${name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`
      );

      updateLibraryCharacter(previewCharacterId, {
        thumbnailUrl: localPath,
      });

      // Archive the result into the media library's AI image folder.
      const aiFolderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `Character-${name || 'Untitled'}`,
        type: 'image',
        source: 'ai-image',
        folderId: aiFolderId,
        projectId: activeProjectId || undefined,
      });

      setPreviewUrl(null);
      setPreviewCharacterId(null);
      delete (window as any).__maxStudioPreviewMeta;
      toast.success(t("characters.savedLocal"), { id: 'saving-preview' });
    } catch (error) {
      console.error('Failed to save preview:', error);
      toast.error(t("characters.saveFailed"), { id: 'saving-preview' });
    }
  };

  const handleDiscardPreview = () => {
    setPreviewUrl(null);
    setPreviewCharacterId(null);
  };

  // If showing preview
  if (previewUrl) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-3 pb-2 border-b shrink-0">
          <h3 className="font-medium text-sm">{t("characters.previewImage")}</h3>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-4 pb-40">
            <div className="relative rounded-lg overflow-hidden border-2 border-amber-500/50 bg-muted">
              <LocalImage 
                src={previewUrl} 
                alt={t("characters.previewImage")}
                className="w-full h-auto"
              />
              <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                {t("characters.previewBadge")}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-3 border-t space-y-2 shrink-0">
          <Button onClick={handleSavePreview} className="w-full">
            {t("characters.saveImage")}
          </Button>
          <Button onClick={handleCreateRecord} variant="outline" className="w-full" disabled={isGenerating}>
            {t("characters.regenerateImage")}
          </Button>
          <Button onClick={handleDiscardPreview} variant="ghost" className="w-full text-muted-foreground" size="sm">
            {t("characters.discardBack")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 pb-2 border-b shrink-0">
        <h3 className="font-medium text-sm">{t("characters.console")}</h3>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-4 pb-40">
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end">
            {/* Character name */}
            <div className="space-y-2">
              <Label className="text-xs">{t("characters.name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("characters.namePlaceholder")}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("characters.aspectRatio")}</Label>
              <select
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value as Character['aspectRatio'])}
                disabled={isGenerating}
                className="h-9 w-full rounded-lg border border-input bg-accent/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ASPECT_RATIO_OPTIONS.map((ratio) => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Character description used by director prompts */}
          <div className="space-y-2">
            <Label className="text-xs">{t("characters.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("characters.descriptionPlaceholder")}
              className="min-h-[70px] text-sm resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Image prompt */}
          <div className="space-y-2">
            <Label className="text-xs">{t("characters.characterPrompt")}</Label>
            <Textarea
              value={characterPrompt}
              onChange={(e) => setCharacterPrompt(e.target.value)}
              placeholder={t("characters.shortDescriptionPlaceholder")}
              className="min-h-[80px] text-sm resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t("overview.visualStyle")}</Label>
            <StylePicker
              value={styleId}
              onChange={(id) => setStyleId(id)}
              disabled={isGenerating}
            />
          </div>

          {/* Reference images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t("characters.referenceImages")}</Label>
              <span className="text-xs text-muted-foreground">{referenceImages.length}/3</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {referenceImages.map((img, i) => (
                <div key={i} className="relative group">
                  <LocalImage
                    src={img}
                    alt={t("characters.referenceAlt", { index: i + 1 })}
                    className="w-14 h-14 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {referenceImages.length < 3 && (
                <>
                  <input
                    id="gen-panel-ref-image"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div
                    className="w-14 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors gap-1 cursor-pointer"
                    onClick={() => document.getElementById('gen-panel-ref-image')?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-2xs">{t("director.card.upload")}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {finalImagePromptPreview && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
              <Label className="text-xs">{t("characters.finalImagePrompt")}</Label>
              <p className="text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {finalImagePromptPreview}
              </p>
            </div>
          )}

          {/* Action button - inside scroll area */}
          <div className="pt-2 pb-4 space-y-2">
              <Button 
                onClick={handleCreateRecord} 
                className="w-full"
                disabled={isGenerating || !name.trim() || !characterPrompt.trim()}
              >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo {elapsedSeconds}s
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4 mr-2" />
                  {selectedCharacter ? t("characters.saveCharacterSettings") : t("characters.create")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function buildCharacterImagePrompt(
  name: string, 
  styleId?: string,
  characterPrompt?: string
): string {
  const stylePreset = styleId && styleId !== 'random' 
    ? getStyleById(styleId) 
    : null;
  const styleTokens = stylePreset?.prompt || '';

  return [
    characterPrompt?.trim() || name,
    styleTokens,
    'single character portrait',
    'no text, no watermark',
  ].filter(Boolean).join(', ');
}

// Note: generateCharacterImage and imageUrlToBase64 are now imported from @/features/video-studio/lib/ai/image-generator
