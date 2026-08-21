"use client";

/**
 * Character Detail Panel - Right column
 * Shows selected character's preview images, info, and actions
 */

import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/shared/lib/use-now";
import { useCharacterLibraryStore, type Character } from "@/features/video-studio/stores/character-library-store";
import { useActiveScriptProject } from "@/features/video-studio/stores/script-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  User,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Upload,
  Loader2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { LocalImage } from "@/shared/components/ui/local-image";
import { ImagePreviewModal } from "@/features/video-studio/components/panels/director/media-preview-modal";
import { useI18n } from "@/shared/i18n";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { generateCharacterImage as generateCharacterImageAPI } from "@/features/video-studio/lib/ai/image-generator";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { buildCharacterImagePrompt } from "./generation-panel";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

const ASPECT_RATIO_OPTIONS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;

interface CharacterDetailProps {
  character: Character | null;
}

export function CharacterDetail({ character }: CharacterDetailProps) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { updateCharacter, deleteCharacter, selectCharacter } = useCharacterLibraryStore();
  const scriptProject = useActiveScriptProject();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    styleId: projectVisualStyleId,
    aspectRatio: "1:1",
    description: "",
    characterPrompt: "",
    voiceId: "none",
  });
  const [referenceImagesDraft, setReferenceImagesDraft] = useState<string[]>([]);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [regenerationStartedAt, setRegenerationStartedAt] = useState<number | null>(null);
  const now = useNow(isRegeneratingImage);
  const regenerationElapsedSeconds = regenerationStartedAt ? Math.max(0, Math.floor((now - regenerationStartedAt) / 1000)) : 0;

  useEffect(() => {
    if (!isRegeneratingImage) setRegenerationStartedAt(null);
  }, [isRegeneratingImage]);

  const linkedScriptCharacter = useMemo(() => {
    if (!character) return null;
    return scriptProject?.scriptData?.characters.find((scriptCharacter) => {
      const mappedLibraryId = scriptProject.characterIdMap[scriptCharacter.id];
      return mappedLibraryId === character.id || scriptCharacter.characterLibraryId === character.id;
    }) || null;
  }, [character, scriptProject]);

  useEffect(() => {
    if (!character) return;
    setEditForm({
      name: character.name || "",
      styleId: character.styleId || projectVisualStyleId,
      aspectRatio: character.aspectRatio || "1:1",
      description: character.description || character.appearance || "",
      characterPrompt: character.characterPrompt || "",
      voiceId: character.voiceId || "none",
    });
    setReferenceImagesDraft(character.referenceImages || []);
  }, [character, projectVisualStyleId]);

  const finalImagePromptPreview = useMemo(() => {
    if (!character && !editForm.name.trim() && !editForm.characterPrompt.trim()) return '';
    return buildCharacterImagePrompt(
      editForm.name || character?.name || t("characters.name"),
      editForm.styleId || character?.styleId || projectVisualStyleId,
      editForm.characterPrompt || character?.characterPrompt || character?.name,
    );
  }, [character, editForm.name, editForm.characterPrompt, editForm.styleId, projectVisualStyleId, t]);

  if (!character) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("characters.detailEmpty")}
        </p>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete character "${character.name}"?`)) {
      deleteCharacter(character.id);
      selectCharacter(null);
      toast.success(t("characters.deleted"));
    }
  };

  const handleSaveAll = () => {
    if (!character) return;

    updateCharacter(character.id, {
      name: editForm.name.trim() || character.name,
      description: editForm.description.trim() || undefined,
      characterPrompt: editForm.characterPrompt.trim() || character.characterPrompt,
      styleId: editForm.styleId || projectVisualStyleId,
      aspectRatio: (editForm.aspectRatio as Character['aspectRatio']) || '1:1',
      referenceImages: referenceImagesDraft.length > 0 ? referenceImagesDraft : undefined,
      voiceId: editForm.voiceId === "none" ? undefined : (editForm.voiceId as any),
    } as any);

    toast.success("Character settings updated");
  };

  const handleReferenceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nextImages = [...referenceImagesDraft];
    for (const file of Array.from(files)) {
      if (nextImages.length >= 3) break;
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const localPath = await saveImageToLocal(
        base64,
        'characters',
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_ref_${nextImages.length + 1}.png`
      );
      nextImages.push(localPath);
    }
    setReferenceImagesDraft(nextImages.slice(0, 3));
    e.target.value = "";
  };

  const handlePrimaryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !character) return;

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const localPath = await saveImageToLocal(
        base64,
        'characters',
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_main_${Date.now()}.png`
      );

      updateCharacter(character.id, {
        thumbnailUrl: localPath,
      });
      toast.success(t("characters.savedLocal"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };

  const handleRemovePrimaryImage = () => {
    if (!character) return;

    updateCharacter(character.id, {
      thumbnailUrl: undefined,
    });
    toast.success(t("characters.deleted"));
  };

  const handleExportImage = async (imageUrl: string, name: string) => {
    try {
      let blob: Blob;
      
      // Handle different URL formats
      if (imageUrl.startsWith('data:')) {
        // Base64 data URL
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith('local-image://')) {
        // Local image protocol - fetch through Electron's custom protocol
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith('http')) {
        // Remote URL
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else {
        // Fallback
        const res = await fetch(imageUrl);
        blob = await res.blob();
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("characters.exportSuccess", { name }));
    } catch (err) {
      console.error('Export image failed:', err);
      toast.error(t("characters.exportFailed"));
    }
  };

  const handleRegenerateImage = async () => {
    if (!character) return;

    const sourceCharacter = linkedScriptCharacter;
    const targetName = sourceCharacter?.name || editForm.name.trim() || character.name;
    const targetCharacterPrompt = sourceCharacter?.characterPrompt || editForm.characterPrompt.trim() || character.characterPrompt || targetName;
    const targetReferenceImages = referenceImagesDraft.filter(Boolean);
    const targetStyleId = editForm.styleId || character.styleId || projectVisualStyleId;

    setIsRegeneratingImage(true);

    try {
      const prompt = buildCharacterImagePrompt(
        targetName,
        targetStyleId,
        targetCharacterPrompt
      );

      const result = await generateCharacterImageAPI({
        prompt,
        negativePrompt: 'blurry, low quality, watermark, text, cropped',
        aspectRatio: editForm.aspectRatio as Character['aspectRatio'],
        referenceImages: targetReferenceImages,
        styleId: targetStyleId,
        onSubmitted: (submittedAt) => setRegenerationStartedAt(submittedAt || Date.now()),
      });

      const localPath = await saveImageToLocal(
        result.imageUrl,
        'characters',
        `${targetName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`
      );

      updateCharacter(character.id, {
        thumbnailUrl: localPath,
      });

      const aiFolderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `Character-${targetName || 'Untitled'}`,
        type: 'image',
        source: 'ai-image',
        folderId: aiFolderId,
        projectId: character.projectId,
      });

      toast.success(t('characters.generatedImage', { name: targetName }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('characters.generateImageFailed', { name: targetName, message }));
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const primaryImageUrl = character.thumbnailUrl || '';
  const previewAspectRatio = (editForm.aspectRatio || '1:1').replace(':', ' / ');
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 pb-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm truncate">{character.name}</h3>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4 pb-40">
          {/* Main preview */}
          <div className="space-y-2">
            <input
              id="character-detail-main-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePrimaryImageChange}
            />
            <div 
              className="rounded-lg bg-muted overflow-hidden border relative cursor-zoom-in group/image"
              style={{ aspectRatio: previewAspectRatio }}
              title={t("characters.doubleClickPreview")}
              draggable
              onDoubleClick={() => {
                if (primaryImageUrl) setPreviewImageUrl(primaryImageUrl);
              }}
              onClick={() => {
                if (primaryImageUrl) {
                  setPreviewImageUrl(primaryImageUrl);
                } else {
                  document.getElementById('character-detail-main-image')?.click();
                }
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({
                  type: "character",
                  characterId: character.id,
                  characterName: character.name,
                  characterPrompt: character.characterPrompt,
                  thumbnailUrl: character.thumbnailUrl,
                }));
                e.dataTransfer.effectAllowed = "copy";
              }}
            >
            {character.thumbnailUrl ? (
                <LocalImage 
                  src={character.thumbnailUrl} 
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => document.getElementById('character-detail-main-image')?.click()}
                  className="p-1 rounded bg-black/50 text-white hover:bg-blue-600"
                  title={t("director.card.upload")}
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                {primaryImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePrimaryImage}
                    className="p-1 rounded bg-black/50 text-white hover:bg-red-600"
                    title={t("property.deleteCharacter")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="bg-black/50 text-white rounded p-1">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

            {/* Character info */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">{t("characters.info")}</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("characters.name")}</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("characters.aspectRatio")}</Label>
                <Select value={editForm.aspectRatio} onValueChange={(value) => setEditForm((prev) => ({ ...prev, aspectRatio: value }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIO_OPTIONS.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                {t("characters.voiceId")}
              </Label>
              <Input
                value={editForm.voiceId === "none" ? "" : editForm.voiceId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, voiceId: e.target.value.trim() || "none" }))}
                placeholder={t("characters.voiceNone")}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("characters.description")}</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="text-xs min-h-[80px]"
                placeholder={t("characters.descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("characters.characterPrompt")}</Label>
              <Textarea
                value={editForm.characterPrompt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, characterPrompt: e.target.value }))}
                className="text-xs min-h-[100px]"
                placeholder={t("characters.characterPrompt")}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("overview.visualStyle")}</Label>
              <StylePicker value={editForm.styleId || "random"} onChange={(id) => setEditForm((prev) => ({ ...prev, styleId: id }))} />
            </div>

            {finalImagePromptPreview && (
              <div className="space-y-1 rounded-md border bg-muted/30 p-2">
                <Label className="text-xs text-muted-foreground">{t("characters.finalImagePrompt")}</Label>
                <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {finalImagePromptPreview}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("characters.referenceImages")}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {referenceImagesDraft.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={t("characters.referenceAlt", { index: i + 1 })} className="w-10 h-10 object-cover rounded border" />
                    <button
                      onClick={() => setReferenceImagesDraft((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {referenceImagesDraft.length < 3 && (
                  <>
                    <input id="character-detail-ref-images" type="file" accept="image/*" multiple className="hidden" onChange={handleReferenceImageChange} />
                    <Button type="button" size="sm" variant="outline" className="h-10 text-xs" onClick={() => document.getElementById('character-detail-ref-images')?.click()}>
                      {t("director.card.upload")}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Button className="w-full" size="sm" onClick={handleSaveAll}>
              {t("characters.saveCharacterSettings")}
            </Button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              disabled={isRegeneratingImage}
              onClick={handleRegenerateImage}
            >
              {isRegeneratingImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              {isRegeneratingImage ? (regenerationStartedAt ? `Đang tạo ${regenerationElapsedSeconds}s` : 'Đang chờ') : t("characters.regenerateImage")}
            </Button>

            {primaryImageUrl && (
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => handleExportImage(primaryImageUrl, character.name)}
              >
                {t("characters.exportCurrentView")}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("property.deleteCharacter")}
            </Button>

          </div>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 {t("characters.dragHint")}</p>
            </div>
        </div>
      </ScrollArea>

      {/* Image Preview Lightbox */}
      <ImagePreviewModal
        imageUrl={previewImageUrl || ''}
        isOpen={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        onImageCleaned={(cleanedUrl) => {
          if (character) {
            updateCharacter(character.id, { thumbnailUrl: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }}
      />
    </div>
  );
}
