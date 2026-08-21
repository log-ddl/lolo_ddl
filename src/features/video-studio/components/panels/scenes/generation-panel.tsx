"use client";

/**
 * Scene Generation Panel - Left column
 * Scene creation controls: name, prompt, style, references, generate
 */

import { useState, useEffect, useMemo } from "react";
import { useNow } from "@/shared/lib/use-now";
import {
  useSceneStore,
  type Scene,
} from "@/features/video-studio/stores/scene-store";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import type { PromptLanguage } from "@/features/video-studio/types/script";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/features/video-studio/lib/ai/feature-router";
import { generateSceneImage as generateSceneImageAPI } from "@/features/video-studio/lib/ai/image-generator";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Loader2,
  Square,
  Plus,
  Check,
  RotateCcw,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { getStyleById } from "@/features/video-studio/lib/constants/visual-styles";
import { useI18n } from "@/shared/i18n";
import { buildSceneImagePrompt } from "@/features/video-studio/lib/scene-image-prompt";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

interface GenerationPanelProps {
  selectedScene: Scene | null;
  onSceneCreated?: (id: string) => void;
}

const ASPECT_RATIO_OPTIONS: NonNullable<Scene['aspectRatio']>[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export function GenerationPanel({ selectedScene, onSceneCreated }: GenerationPanelProps) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const {
    addScene,
    updateScene,
    selectScene,
    generationStatus,
    setGenerationStatus,
    setGeneratingScene,
    currentFolderId,
  } = useSceneStore();

  const { pendingSceneData, setPendingSceneData } = useMediaPanelStore();
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();

  // Get storyboard shot data for the current project to extract scene props.
  const { activeProjectId: scriptProjectId } = useScriptStore();
  const resourceProjectId = scriptProjectId;
  // Kept in sync with pending script data for prompt-language-aware flows.
  const [, setPromptLanguage] = useState<PromptLanguage>('en');

  // Form state
  const [name, setName] = useState("");
  const [aspectRatio, setAspectRatio] = useState<NonNullable<Scene['aspectRatio']>>('16:9');
  const [description, setDescription] = useState("");
  const [scenePrompt, setScenePrompt] = useState(""); // Scene visual description
  const [styleId, setStyleId] = useState<string>(projectVisualStyleId);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);
  const [activeController, setActiveController] = useState<AbortController | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);

  const isGenerating = generationStatus === 'generating';
  const now = useNow(isGenerating);
  const elapsedSeconds = generationStartedAt ? Math.max(0, Math.floor((now - generationStartedAt) / 1000)) : 0;

  useEffect(() => {
    if (!isGenerating) setGenerationStartedAt(null);
  }, [isGenerating]);

  const finalImagePromptPreview = useMemo(() => {
    if (!name.trim() && !description.trim() && !scenePrompt.trim()) return '';
    return buildSceneImagePrompt({
      name,
      description,
      scenePrompt,
      styleId,
    });
  }, [name, description, scenePrompt, styleId]);

  // Reference image handlers
  const handleRefImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const removeRefImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  // Keep the generation form aligned with the selected library record. These
  // assignments are intentionally one-to-one so description and scenePrompt
  // cannot be swapped by UI fallbacks.
  useEffect(() => {
    if (!selectedScene) return;

    setName(selectedScene.name || "");
    setDescription(selectedScene.description || "");
    setScenePrompt(selectedScene.scenePrompt || "");
    setAspectRatio(selectedScene.aspectRatio || "16:9");

    const validStyle = selectedScene.styleId ? getStyleById(selectedScene.styleId) : null;
    setStyleId(validStyle?.id || projectVisualStyleId);
  }, [selectedScene, projectVisualStyleId]);

  // New scenes inherit the Director's project style. A selected saved scene
  // continues to use its own style override.
  useEffect(() => {
    if (!selectedScene && !pendingSceneData) {
      setStyleId(projectVisualStyleId);
    }
  }, [projectVisualStyleId, selectedScene, pendingSceneData]);

  // Handle pending data from script panel.
  useEffect(() => {
    if (!pendingSceneData) return;

    // Capture and clear immediately to avoid duplicate execution in React Strict Mode.
    const data = pendingSceneData;
    setPendingSceneData(null);

    // Sync prompt language preference.
    if (data.promptLanguage) {
      setPromptLanguage(data.promptLanguage);
    }

    // Auto-create a new scene when minimal prompt data is available.
    if (data.name) {
      const parsedStyleId = projectVisualStyleId;

      // Sync form state so the UI shows the correct style.
      setStyleId(parsedStyleId);

      // Automatically create the scene using the minimal prompt schema.
      const newId = addScene({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        time: 'day',
        atmosphere: 'neutral',
        aspectRatio: data.aspectRatio || '16:9',
        scenePrompt: data.scenePrompt?.trim() || undefined,
        styleId: parsedStyleId,
        folderId: currentFolderId,
        projectId: resourceProjectId || undefined,
        // Episode scope
        linkedEpisodeId: data.sourceEpisodeId,
      } as any);

      // Select the newly created scene.
      selectScene(newId);
      onSceneCreated?.(newId);

      toast.success(t("scenes.autoCreated", { name: data.name }));
    } else {
      // If only partial data is available, populate the form only.
      setName(data.name || "");
      setDescription(data.description || "");

      setStyleId(projectVisualStyleId);

      if (data.scenePrompt) {
        setScenePrompt(data.scenePrompt || "");
      }

      setAspectRatio(data.aspectRatio || '16:9');
    }
  }, [pendingSceneData, setPendingSceneData, addScene, selectScene, onSceneCreated, currentFolderId, projectVisualStyleId, resourceProjectId, t]);

  const handleCreateScene = () => {
    if (!name.trim()) {
      toast.error(t("scenes.enterName"));
      return;
    }
    if (!finalImagePromptPreview.trim()) {
      toast.error(t("scenes.enterLocation"));
      return;
    }

    // Resolve the current episode scope.
    const { activeEpisodeIndex } = useMediaPanelStore.getState();
    const scriptState = useScriptStore.getState();
    const activeScriptProject = scriptState.activeProjectId ? scriptState.projects[scriptState.activeProjectId] : null;
    const manualEpisodeId = activeEpisodeIndex != null
      ? activeScriptProject?.scriptData?.episodes.find(ep => ep.index === activeEpisodeIndex)?.id
      : undefined;

    const id = addScene({
      name: name.trim(),
      description: description.trim() || undefined,
      time: 'day',
      atmosphere: 'neutral',
      aspectRatio,
      scenePrompt: scenePrompt.trim() || undefined,
      styleId,
      folderId: currentFolderId,
      projectId: resourceProjectId || undefined,
      linkedEpisodeId: manualEpisodeId,
    });

    toast.success(t("scenes.created"));
    selectScene(id);
    onSceneCreated?.(id);
  };

  const handleGenerate = async () => {
    if (!selectedScene) {
      toast.error(t("scenes.selectOrCreate"));
      return;
    }
    const targetId = selectedScene.id;
    const prompt = buildSceneImagePrompt({
      ...selectedScene,
      name,
      description,
      scenePrompt,
      aspectRatio,
      styleId,
    });
    if (!prompt.trim()) {
      toast.error(t("scenes.enterLocation"));
      return;
    }

    const featureConfig = getFeatureConfig('character_generation');
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('character_generation'));
      return;
    }

    // Update scene if changed
    if (aspectRatio !== (selectedScene.aspectRatio || '16:9') ||
      description.trim() !== (selectedScene.description || '') ||
      scenePrompt.trim() !== (selectedScene.scenePrompt || '') ||
      styleId !== (selectedScene.styleId || projectVisualStyleId)) {
      updateScene(targetId, {
        aspectRatio,
        description: description.trim() || undefined,
        scenePrompt: scenePrompt.trim() || undefined,
        styleId,
      });
    }

    setGenerationStatus('generating');
    setGeneratingScene(targetId);
    const controller = new AbortController();
    setActiveController(controller);

    try {
      const sceneReferenceImages = [...referenceImages];

      const result = await generateSceneImageAPI({
        prompt,
        aspectRatio,
        referenceImages: sceneReferenceImages.length > 0 ? sceneReferenceImages : undefined,
        styleId,
        onSubmitted: (submittedAt) => setGenerationStartedAt(submittedAt || Date.now()),
        signal: controller.signal,
      });

      setPreviewUrl(result.imageUrl);
      setPreviewSceneId(targetId);
      setGenerationStatus('completed');
      toast.success(t("scenes.conceptReady"));
    } catch (error) {
      if (controller.signal.aborted) {
        setGenerationStatus('idle');
        return;
      }
      const err = error as Error;
      setGenerationStatus('error', err.message);
      toast.error(t("scenes.generateImageFailed", { name: selectedScene.name, message: err.message }));
    } finally {
      setActiveController(null);
      setGeneratingScene(null);
    }
  };

  const handleStopGenerate = () => {
    activeController?.abort();
    setActiveController(null);
    setGenerationStatus('idle');
    setGeneratingScene(null);
    toast.info('Đã dừng tạo ảnh cảnh');
  };

  const handleSavePreview = async () => {
    if (!previewUrl || !previewSceneId) return;

    toast.loading("Saving image locally...", { id: 'saving-scene-preview' });

    try {
      const sceneName = (name || selectedScene?.name || 'scene').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const localPath = await saveImageToLocal(
        previewUrl,
        'scenes',
        `${sceneName}_${Date.now()}.png`
      );

      updateScene(previewSceneId, {
        referenceImage: localPath,
        aspectRatio,
      });

      // Archive to the media library AI image folder as well.
      const aiFolderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${name || selectedScene?.name || 'Untitled'}`,
        type: 'image',
        source: 'ai-image',
        folderId: aiFolderId,
        projectId: resourceProjectId || undefined,
      });

      setPreviewUrl(null);
      setPreviewSceneId(null);
      toast.success(t("scenes.savedLocal"), { id: 'saving-scene-preview' });
    } catch (error) {
      console.error('Failed to save scene preview:', error);
      toast.error(t("scenes.saveFailed"), { id: 'saving-scene-preview' });
    }
  };

  const handleDiscardPreview = () => {
    setPreviewUrl(null);
    setPreviewSceneId(null);
    setGenerationStatus('idle');
  };

  // If showing preview
  if (previewUrl) {
    return (
      <div className="h-full flex flex-col p-3">
        <h3 className="font-medium text-sm mb-3">{t("scenes.previewTitle")}</h3>
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border-2 border-amber-500/50 bg-muted">
              <img
                src={previewUrl}
                alt={t("scenes.previewAlt")}
                className="w-full h-auto"
              />
              <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                {t("scenes.previewBadge")}
              </div>
            </div>
            <Button onClick={handleSavePreview} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              {t("scenes.saveConcept")}
            </Button>
            <Button onClick={handleGenerate} variant="outline" className="w-full" disabled={isGenerating}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("scenes.regenerateConcept")}
            </Button>
            <Button onClick={handleDiscardPreview} variant="ghost" className="w-full text-muted-foreground" size="sm">
              {t("scenes.discardBack")}
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="p-3 pb-2 border-b space-y-2">
        <h3 className="font-medium text-sm">{t("scenes.console")}</h3>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3">
        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-end">
            {/* Scene name */}
            <div className="space-y-2">
              <Label className="text-xs">{t("scenes.name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("scenes.namePlaceholder")}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("scenes.imageAspectRatio")}</Label>
              <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as NonNullable<Scene['aspectRatio']>)} disabled={isGenerating}>
                <SelectTrigger>
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

          {/* Scene description used by director prompts */}
          <div className="space-y-2">
            <Label className="text-xs">{t("scenes.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("scenes.descriptionPlaceholder")}
              className="min-h-[70px] text-sm resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Scene prompt */}
          <div className="space-y-2">
            <Label className="text-xs">{t("scenes.scenePrompt")}</Label>
            <Textarea
              value={scenePrompt}
              onChange={(e) => setScenePrompt(e.target.value)}
              placeholder={t("scenes.scenePromptPlaceholder")}
              className="min-h-[100px] text-sm resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Style */}
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
              <Label className="text-xs">{t("scenes.references")}</Label>
              <span className="text-xs text-muted-foreground">{referenceImages.length}/3</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {referenceImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img}
                    alt={`Reference image ${i + 1}`}
                    className="w-14 h-14 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeRefImage(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {referenceImages.length < 3 && (
                <>
                  <input
                    id="scene-gen-ref-image"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleRefImageChange}
                  />
                  <div
                    className="w-14 h-14 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors gap-1 cursor-pointer"
                    onClick={() => document.getElementById('scene-gen-ref-image')?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">{t("director.card.upload")}</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("scenes.aiUsesRefs")}
            </p>
          </div>

          {finalImagePromptPreview && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-2">
              <Label className="text-xs">{t("scenes.finalImagePrompt")}</Label>
              <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {finalImagePromptPreview}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="shrink-0 px-3 pt-3 pb-14 border-t bg-background space-y-2">
        {!selectedScene ? (
          <Button onClick={handleCreateScene} className="w-full" disabled={!name.trim() || !scenePrompt.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {t("scenes.created")}
          </Button>
        ) : (
          <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            className="flex-1"
            disabled={isGenerating || !finalImagePromptPreview.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {generationStartedAt ? `Đang tạo ${elapsedSeconds}s` : 'Đang chờ'}
              </>
            ) : (
              <>
                {selectedScene.referenceImage ? t("scenes.regenerateConcept") : t("scenes.generateConcept")}
              </>
            )}
          </Button>
          {isGenerating && (
            <Button variant="destructive" onClick={handleStopGenerate} className="w-10 px-0">
              <Square className="h-4 w-4" />
            </Button>
          )}
          </div>
        )}
      </div>
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

// Note: generateSceneImage is now imported from @/features/video-studio/lib/ai/image-generator
