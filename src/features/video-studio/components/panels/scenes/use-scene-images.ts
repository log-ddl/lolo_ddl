"use client";

/**
 * Scene reference-image work: single + batch generation through the shared lane
 * queue, manual upload / bulk fill from a folder, and pushing the resulting
 * images to every Google Flow account so they can be used as references.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import { useNow } from "@/shared/lib/use-now";
import type { Scene } from "@/features/video-studio/stores/scene-store";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/features/video-studio/lib/ai/feature-router";
import { generateSceneImage as generateSceneImageAPI } from "@/features/video-studio/lib/ai/image-generator";
import { buildLaneWorkers, runLaneQueue } from "@/features/video-studio/lib/ai/lane-manager";
import { getSourceFingerprint } from "@/features/video-studio/lib/utils/source-fingerprint";
import { isSupportedImageFile, matchImageFilesByName } from "@/features/video-studio/lib/library-image-fill";
import { buildSceneImagePrompt } from "@/features/video-studio/lib/scene-image-prompt";
import { syncGoogleFlowReferenceSources } from "@/features/video-studio/lib/ai/google-flow-reference-sync";
import { fileToBase64, getUploadLaneConfig, safeSceneFileName } from "./gallery-helpers";

export interface SceneImageDeps {
  visibleScenes: Scene[];
  /** Scenes that have a prompt but no image yet — the batch-generate targets. */
  sceneImageBatchTargets: Scene[];
  projectVisualStyleId: string | undefined;
  activeProjectId: string | null;
  flowBindingProjectId: string;
  activeProjectName?: string;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  addMediaFromUrl: (input: any) => string;
  getOrCreateCategoryFolder: (category: 'ai-image') => string;
  refreshGoogleFlowBindings: () => Promise<unknown>;
  t: Translate;
}

export function useSceneImageGeneration(deps: SceneImageDeps) {
  const {
    visibleScenes,
    sceneImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName,
    updateScene,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t,
  } = deps;

  const [generatingSceneIds, setGeneratingSceneIds] = useState<Set<string>>(new Set());
  const [generatingStartedAtById, setGeneratingStartedAtById] = useState<Record<string, number>>({});
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [isFillingImages, setIsFillingImages] = useState(false);
  const [isSyncingGoogleFlowReferences, setIsSyncingGoogleFlowReferences] = useState(false);
  const now = useNow(generatingSceneIds.size > 0);
  const activeGenerationControllersRef = useRef<Map<string, AbortController>>(new Map());

  const generateOneSceneImage = async (scene: Scene) => {
    const controller = new AbortController();
    activeGenerationControllersRef.current.set(scene.id, controller);
    setGeneratingSceneIds((prev) => new Set(prev).add(scene.id));
    try {
      const targetStyleId = scene.styleId || projectVisualStyleId;
      const prompt = buildSceneImagePrompt({
        ...scene,
        aspectRatio: scene.aspectRatio || '16:9',
        styleId: targetStyleId,
      });

      const result = await generateSceneImageAPI({
        prompt,
        aspectRatio: scene.aspectRatio || '16:9',
        styleId: targetStyleId,
        onSubmitted: (submittedAt) => {
          setGeneratingStartedAtById((prev) => prev[scene.id]
            ? prev
            : { ...prev, [scene.id]: submittedAt || Date.now() });
        },
        signal: controller.signal,
      });

      const localPath = await saveImageToLocal(
        result.imageUrl,
        'scenes',
        `${safeSceneFileName(scene.name)}_${Date.now()}.png`
      );

      const updates: Partial<Scene> = {
        referenceImage: localPath,
        aspectRatio: scene.aspectRatio || '16:9',
      };

      if (result.mediaId && result.ownerScopeId && result.flowProjectId) {
        const storedMedia = { mediaId: result.mediaId, flowProjectId: result.flowProjectId };
        const localSourceKey = getSourceFingerprint(localPath);
        const remoteSourceKey = getSourceFingerprint(result.imageUrl);
        updates.googleFlowMediaIdsBySource = {
          ...(scene.googleFlowMediaIdsBySource || {}),
          [localSourceKey]: { ...((scene.googleFlowMediaIdsBySource || {})[localSourceKey] || {}), [result.ownerScopeId]: storedMedia },
          [remoteSourceKey]: { ...((scene.googleFlowMediaIdsBySource || {})[remoteSourceKey] || {}), [result.ownerScopeId]: storedMedia },
        };
      }

      updateScene(scene.id, updates);

      const aiFolderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `Scene-${scene.name || 'Untitled'}`,
        type: 'image',
        source: 'ai-image',
        folderId: aiFolderId,
        projectId: scene.projectId ?? activeProjectId ?? undefined,
      });

      toast.success(t("scenes.generatedImagesAll", { count: 1 }));
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("scenes.generateImageFailed", { name: scene.name, message }));
    } finally {
      activeGenerationControllersRef.current.delete(scene.id);
      setGeneratingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
      setGeneratingStartedAtById((prev) => {
        if (!prev[scene.id]) return prev;
        const next = { ...prev };
        delete next[scene.id];
        return next;
      });
    }
  };

  const handleStopGenerateSceneImage = (sceneId: string) => {
    activeGenerationControllersRef.current.get(sceneId)?.abort();
    activeGenerationControllersRef.current.delete(sceneId);
    setGeneratingSceneIds((prev) => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
    setGeneratingStartedAtById((prev) => {
      if (!prev[sceneId]) return prev;
      const next = { ...prev };
      delete next[sceneId];
      return next;
    });
    toast.info('Đã dừng tạo ảnh cảnh');
  };

  const handleStopAllGenerateSceneImages = () => {
    activeGenerationControllersRef.current.forEach((controller) => controller.abort());
    activeGenerationControllersRef.current.clear();
    setGeneratingSceneIds(new Set());
    setGeneratingStartedAtById({});
    setIsGeneratingAllImages(false);
    toast.info('Đã dừng tạo ảnh cảnh');
  };

  const handleGenerateSceneImage = (scene: Scene) => {
    void generateOneSceneImage(scene);
  };

  const handleGenerateAllSceneImages = async () => {
    if (sceneImageBatchTargets.length === 0) {
      toast.info(t("scenes.noImagesToGenerate"));
      return;
    }

    const featureConfig = getFeatureConfig('character_generation');
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('character_generation'));
      return;
    }

    setIsGeneratingAllImages(true);
    try {
      const { laneCount } = await getUploadLaneConfig();
      await runLaneQueue(
        sceneImageBatchTargets.map((scene) => ({ item: scene })),
        buildLaneWorkers([], laneCount),
        async ({ item: scene }) => {
          try {
            await generateOneSceneImage(scene);
          } catch (error) {
            if (!(error instanceof Error && error.message === 'Cancelled by user')) {
              console.error(`[SceneGallery] Batch: scene ${scene.id} image generation failed:`, error);
            }
          }
        },
        undefined,
      );
    } finally {
      setIsGeneratingAllImages(false);
    }
  };

  const handleUploadSceneImage = async (scene: Scene, file: File) => {
    try {
      const dataUrl = await fileToBase64(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        'scenes',
        `${safeSceneFileName(scene.name)}_${Date.now()}.png`
      );
      updateScene(scene.id, { referenceImage: localPath });
      toast.success(t("scenes.uploadedSceneImage"));
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleFillSceneImages = async (files: File[]) => {
    const targets = visibleScenes.filter((scene) =>
      !scene.referenceImage && !scene.referenceImageBase64
    );
    const result = matchImageFilesByName(
      files.filter(isSupportedImageFile),
      targets,
      (scene) => scene.id,
      (scene) => scene.name,
    );

    let filled = 0;
    let failed = 0;
    setIsFillingImages(true);
    try {
      for (let index = 0; index < result.matches.length; index++) {
        const { file, item: scene } = result.matches[index];
        try {
          const dataUrl = await fileToBase64(file);
          const localPath = await saveImageToLocal(
            dataUrl,
            "scenes",
            `${safeSceneFileName(scene.name)}_${Date.now()}_${index}.png`,
          );
          updateScene(scene.id, { referenceImage: localPath });
          filled += 1;
        } catch {
          failed += 1;
        }
      }
    } finally {
      setIsFillingImages(false);
    }

    toast.success(t("scenes.imagesFilled", {
      filled,
      skipped: result.unmatched + result.ambiguous + failed,
    }));
  };
  const handleSyncGoogleFlowReferences = async () => {
    if (isSyncingGoogleFlowReferences) return;
    const sources = visibleScenes.flatMap((scene) => [scene.referenceImage, scene.referenceImageBase64]
      .filter((source): source is string => !!source)
      .map((source) => ({
        source,
        mediaIdsByOwnerScope: scene.googleFlowMediaIdsBySource?.[getSourceFingerprint(source)],
      })));
    setIsSyncingGoogleFlowReferences(true);
    try {
      const result = await syncGoogleFlowReferenceSources(flowBindingProjectId, sources, activeProjectName);
      for (const scene of visibleScenes) {
        const nextBySource = { ...(scene.googleFlowMediaIdsBySource || {}) };
        let changed = false;
        for (const source of [scene.referenceImage, scene.referenceImageBase64].filter((value): value is string => !!value)) {
          const sourceKey = getSourceFingerprint(source);
          const byOwner = { ...(nextBySource[sourceKey] || {}) };
          for (const credential of result.credentials) {
            const mediaId = credential.mediaIdsBySource[sourceKey];
            if (!mediaId || !credential.flowProjectId) continue;
            byOwner[credential.ownerScopeId] = { mediaId, flowProjectId: credential.flowProjectId };
            changed = true;
          }
          if (Object.keys(byOwner).length) nextBySource[sourceKey] = byOwner;
        }
        if (changed) updateScene(scene.id, { googleFlowMediaIdsBySource: nextBySource });
      }
      await refreshGoogleFlowBindings();
      const failed = result.credentials.filter((credential) => credential.error);
      if (failed.length > 0) {
        toast.warning(t("scenes.syncFlowPartial", {
          synced: result.syncedReferenceCount,
          total: result.sourceCount * result.credentialCount,
          failed: failed.length,
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
        }));
      } else {
        toast.success(t("scenes.syncFlowSuccess", {
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
          accounts: result.credentialCount,
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("scenes.syncFlowError"));
    } finally {
      setIsSyncingGoogleFlowReferences(false);
    }
  };

  return {
    generatingSceneIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateSceneImage,
    handleStopGenerateSceneImage,
    handleStopAllGenerateSceneImages,
    handleGenerateAllSceneImages,
    handleUploadSceneImage,
    handleFillSceneImages,
    handleSyncGoogleFlowReferences,
  };
}
