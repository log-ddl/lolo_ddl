"use client";

/**
 * Scene Detail Panel - Right column
 * Shows selected scene's preview image, info, and actions
 */

import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/shared/lib/use-now";
import {
  useSceneStore,
  type Scene,
} from "@/features/video-studio/stores/scene-store";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { readImageAsBase64, saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  MapPin,
  Trash2,
  Download,
  GripVertical,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ImagePreviewModal } from "@/features/video-studio/components/panels/director/media-preview-modal";
import { useI18n } from "@/shared/i18n";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { generateSceneImage as generateSceneImageAPI } from "@/features/video-studio/lib/ai/image-generator";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { buildSceneImagePrompt } from "@/features/video-studio/lib/scene-image-prompt";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

interface SceneDetailProps {
  scene: Scene | null;
}

const ASPECT_RATIO_OPTIONS: NonNullable<Scene['aspectRatio']>[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export function SceneDetail({ scene }: SceneDetailProps) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { updateScene, deleteScene, selectScene } = useSceneStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [regenerationStartedAt, setRegenerationStartedAt] = useState<number | null>(null);
  const now = useNow(isRegeneratingImage);
  const [editForm, setEditForm] = useState({
    name: "",
    styleId: projectVisualStyleId,
    aspectRatio: "16:9" as NonNullable<Scene['aspectRatio']>,
    description: "",
    scenePrompt: "",
  });
  
  const resolvedImage = useResolvedImageUrl(scene?.referenceImage);
  const regenerationElapsedSeconds = regenerationStartedAt ? Math.max(0, Math.floor((now - regenerationStartedAt) / 1000)) : 0;

  useEffect(() => {
    if (!isRegeneratingImage) setRegenerationStartedAt(null);
  }, [isRegeneratingImage]);

  useEffect(() => {
    if (!scene) return;
    setEditForm({
      name: scene.name || "",
      styleId: scene.styleId || projectVisualStyleId,
      aspectRatio: scene.aspectRatio || "16:9",
      description: scene.description || "",
      scenePrompt: scene.scenePrompt || "",
    });
  }, [scene, projectVisualStyleId]);

  const finalImagePromptPreview = useMemo(() => {
    if (!scene) return '';
    return buildSceneImagePrompt({
      ...scene,
      name: editForm.name,
      description: editForm.description,
      scenePrompt: editForm.scenePrompt,
      styleId: editForm.styleId,
    });
  }, [scene, editForm.name, editForm.description, editForm.scenePrompt, editForm.styleId]);

  if (!scene) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("scenes.detailEmpty")}
        </p>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(scene.id);
      selectScene(null);
      toast.success(t("scenes.deleted"));
    }
  };

  const handleExportImage = async () => {
    if (!scene.referenceImage) return;
    try {
      let href = scene.referenceImage;
      // local-image:// assets must be converted to base64 before exporting.
      if (href.startsWith('local-image://')) {
        const base64 = await readImageAsBase64(href);
        if (!base64) {
          toast.error(t("scenes.readLocalFailed"));
          return;
        }
        href = base64;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = `${scene.name}-concept.png`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t("scenes.exportFailed"));
    }
  };

  const handleSaveAll = () => {
    updateScene(scene.id, {
      name: editForm.name.trim() || scene.name,
      description: editForm.description.trim() || undefined,
      scenePrompt: editForm.scenePrompt.trim() || undefined,
      styleId: editForm.styleId || projectVisualStyleId,
      aspectRatio: editForm.aspectRatio,
    });
    toast.success(t("scenes.sceneSettingsUpdated"));
  };

  const handleUploadReferenceImage = async (file: File) => {
    try {
      const dataUrl = await fileToBase64(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        'scenes',
        `${scene.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.png`
      );
      updateScene(scene.id, { referenceImage: localPath });
      toast.success(t("scenes.uploadedSceneImage"));
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRemoveReferenceImage = () => {
    updateScene(scene.id, {
      referenceImage: undefined,
      referenceImageBase64: undefined,
    });
    toast.success(t("scenes.removedReferenceImage"));
  };

  const handleRegenerateImage = async () => {
    const prompt = finalImagePromptPreview.trim();
    if (!prompt) {
      toast.error(t("scenes.enterLocation"));
      return;
    }

    setIsRegeneratingImage(true);
    try {
      const result = await generateSceneImageAPI({
        prompt,
        aspectRatio: editForm.aspectRatio,
        styleId: editForm.styleId,
        onSubmitted: (submittedAt) => setRegenerationStartedAt(submittedAt || Date.now()),
      });

      const sceneName = (editForm.name || scene.name || 'scene').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const localPath = await saveImageToLocal(result.imageUrl, 'scenes', `${sceneName}_${Date.now()}.png`);

      updateScene(scene.id, {
        name: editForm.name.trim() || scene.name,
        description: editForm.description.trim() || undefined,
        scenePrompt: editForm.scenePrompt.trim() || undefined,
        styleId: editForm.styleId || projectVisualStyleId,
        aspectRatio: editForm.aspectRatio,
        referenceImage: localPath,
      });

      const aiFolderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${editForm.name || scene.name || 'Untitled'}`,
        type: 'image',
        source: 'ai-image',
        folderId: aiFolderId,
        projectId: scene.projectId,
      });

      toast.success(t("scenes.conceptReady"));
    } catch (error) {
      toast.error(t("scenes.generateImageFailed", { name: scene.name, message: (error as Error).message }));
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const previewAspectRatio = (editForm.aspectRatio || '16:9').replace(':', ' / ');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 pb-2 border-b">
          <h3 className="font-medium text-sm truncate">{scene.name}</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4 pb-32">
          {/* Main preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("scenes.referenceImage")}</Label>
            <div 
              className="rounded-lg bg-muted overflow-hidden border relative cursor-zoom-in"
              style={{ aspectRatio: previewAspectRatio }}
              title={t("scenes.previewFullImage")}
              draggable={!!scene.referenceImage}
              onClick={() => {
                if (resolvedImage) setPreviewImageUrl(resolvedImage);
              }}
              onDragStart={(e) => {
                if (scene.referenceImage) {
                  e.dataTransfer.setData("application/json", JSON.stringify({
                    type: "scene",
                    sceneId: scene.id,
                    sceneName: scene.name,
                    referenceImage: scene.referenceImage,
                  }));
                  e.dataTransfer.effectAllowed = "copy";
                }
              }}
            >
            {scene.referenceImage ? (
                <img 
                  src={resolvedImage || ''} 
                  alt={scene.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Drag hint */}
              {scene.referenceImage && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <label className="bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-black/70">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = '';
                        if (file) handleUploadReferenceImage(file);
                      }}
                    />
                    <Upload className="h-4 w-4" />
                  </label>
                  <button
                    type="button"
                    className="bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-red-600/80"
                    title={t("scenes.removeReferenceImage")}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveReferenceImage();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="bg-black/50 text-white rounded p-1">
                  <GripVertical className="h-4 w-4" />
                  </div>
                </div>
              )}
              {!scene.referenceImage && (
                <label className="absolute top-2 right-2 bg-black/50 text-white rounded p-1 cursor-pointer hover:bg-black/70">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = '';
                      if (file) handleUploadReferenceImage(file);
                    }}
                  />
                  <Upload className="h-4 w-4" />
                </label>
              )}
            </div>
          </div>

          <Separator />

          {/* Scene info */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">{t("scenes.info")}</div>
            
            <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("scenes.imageStyle")}</Label>
                <StylePicker
                  value={editForm.styleId || projectVisualStyleId}
                  onChange={(styleId) => setEditForm((prev) => ({ ...prev, styleId }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("scenes.imageAspectRatio")}</Label>
                <Select value={editForm.aspectRatio || '16:9'} onValueChange={(value) => setEditForm((prev) => ({ ...prev, aspectRatio: value as NonNullable<Scene['aspectRatio']> }))}>
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
              <Label className="text-xs text-muted-foreground">{t("scenes.name")}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-xs"
                placeholder={t("scenes.namePlaceholder")}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("scenes.description")}</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t("scenes.descriptionPlaceholder")}
                className="text-xs min-h-[80px]"
              />
            </div>

            {/* Visual prompt */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("scenes.scenePrompt")}</Label>
              <Textarea
                value={editForm.scenePrompt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, scenePrompt: e.target.value }))}
                placeholder={t("scenes.scenePromptPlaceholder")}
                className="text-xs min-h-[100px]"
              />
            </div>

            {finalImagePromptPreview && (
              <div className="space-y-1 rounded-lg border bg-muted/30 p-2">
                <Label className="text-xs text-muted-foreground">{t("scenes.finalImagePrompt")}</Label>
                <p className="text-2xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {finalImagePromptPreview}
                </p>
              </div>
            )}

            <Button className="w-full" size="sm" onClick={handleSaveAll}>
              {t("scenes.saveSceneSettings")}
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
              {isRegeneratingImage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRegeneratingImage ? (regenerationStartedAt ? `Đang tạo ${regenerationElapsedSeconds}s` : 'Đang chờ') : scene.referenceImage ? t("scenes.regenerateConcept") : t("scenes.generateConcept")}
            </Button>

            {scene.referenceImage && (
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={handleExportImage}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("scenes.exportConcept")}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("scenes.deleteScene")}
            </Button>
          </div>

          {/* Tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 {t("scenes.tipDrag")}</p>
            <p>💡 {t("scenes.tipConsistency")}</p>
          </div>
        </div>
      </ScrollArea>

      {/* Image Preview Lightbox */}
      <ImagePreviewModal
        imageUrl={previewImageUrl || ''}
        isOpen={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        onImageCleaned={(cleanedUrl) => {
          if (scene) {
            updateScene(scene.id, { referenceImage: cleanedUrl });
            setPreviewImageUrl(cleanedUrl);
          }
        }}
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
