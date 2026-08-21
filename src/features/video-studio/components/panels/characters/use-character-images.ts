"use client";

/**
 * Character reference-image work: single + batch generation through the shared
 * lane queue, manual upload / bulk fill from a folder, and pushing the results
 * to every Google Flow account so they can be used as references.
 */

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import { useNow } from "@/shared/lib/use-now";
import type { Character } from "@/features/video-studio/stores/character-library-store";
import { generateCharacterImage as generateCharacterImageAPI } from "@/features/video-studio/lib/ai/image-generator";
import { getSourceFingerprint } from "@/features/video-studio/lib/utils/source-fingerprint";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/features/video-studio/lib/ai/feature-router";
import { buildLaneWorkers, runLaneQueue } from "@/features/video-studio/lib/ai/lane-manager";
import { isSupportedImageFile, matchImageFilesByName } from "@/features/video-studio/lib/library-image-fill";
import { syncGoogleFlowReferenceSources } from "@/features/video-studio/lib/ai/google-flow-reference-sync";
import { buildCharacterImagePrompt } from "./generation-panel";
import { fileToBase64, getImageGenerationLaneConfig } from "./gallery-helpers";

export interface CharacterImageDeps {
  visibleCharacters: Character[];
  /** Characters with a prompt but no image yet — the batch-generate targets. */
  characterImageBatchTargets: Character[];
  projectVisualStyleId: string | undefined;
  activeProjectId: string | null;
  flowBindingProjectId: string;
  activeProjectName?: string;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  addMediaFromUrl: (input: any) => string;
  getOrCreateCategoryFolder: (category: 'ai-image') => string;
  refreshGoogleFlowBindings: () => Promise<unknown>;
  t: Translate;
}

export function useCharacterImageGeneration(deps: CharacterImageDeps) {
  const {
    visibleCharacters,
    characterImageBatchTargets,
    projectVisualStyleId,
    activeProjectId,
    flowBindingProjectId,
    activeProjectName,
    updateCharacter,
    addMediaFromUrl,
    getOrCreateCategoryFolder,
    refreshGoogleFlowBindings,
    t,
  } = deps;

  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [generatingStartedAtById, setGeneratingStartedAtById] = useState<Record<string, number>>({});
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [isFillingImages, setIsFillingImages] = useState(false);
  const [isSyncingGoogleFlowReferences, setIsSyncingGoogleFlowReferences] = useState(false);
  const now = useNow(generatingIds.size > 0);
  const activeGenerationControllersRef = useRef<Map<string, AbortController>>(new Map());
  /** Bumped on every stop-all so a stale batch cannot re-enable the busy flag. */
  const batchGenerationRunRef = useRef(0);

  const generateOneImage = useCallback(async (char: Character) => {
    const controller = new AbortController();
    activeGenerationControllersRef.current.set(char.id, controller);
    setGeneratingIds((prev) => new Set(prev).add(char.id));
    try {
      const charStyle = char.styleId || projectVisualStyleId;
      const basePrompt = buildCharacterImagePrompt(
        char.name,
        charStyle,
        char.characterPrompt || char.name,
      );
      const result = await generateCharacterImageAPI({
        prompt: basePrompt,
        negativePrompt: 'blurry, low quality, watermark, text, cropped',
        aspectRatio: '1:1',
        referenceImages: char.referenceImages?.filter(Boolean) ?? [],
        styleId: charStyle,
        onSubmitted: (submittedAt) => {
          setGeneratingStartedAtById((prev) => prev[char.id]
            ? prev
            : { ...prev, [char.id]: submittedAt || Date.now() });
        },
        signal: controller.signal,
      });
      const localPath = await saveImageToLocal(
        result.imageUrl,
        'characters',
        `${char.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`
      );
      updateCharacter(char.id, { thumbnailUrl: localPath });
      if (result.mediaId && result.ownerScopeId && result.flowProjectId) {
        const storedMedia = { mediaId: result.mediaId, flowProjectId: result.flowProjectId };
        const localSourceKey = getSourceFingerprint(localPath);
        const remoteSourceKey = getSourceFingerprint(result.imageUrl);
        updateCharacter(char.id, {
          googleFlowMediaIdsBySource: {
            ...(char.googleFlowMediaIdsBySource || {}),
            [localSourceKey]: { ...((char.googleFlowMediaIdsBySource || {})[localSourceKey] || {}), [result.ownerScopeId]: storedMedia },
            [remoteSourceKey]: { ...((char.googleFlowMediaIdsBySource || {})[remoteSourceKey] || {}), [result.ownerScopeId]: storedMedia },
          },
        });
      }
      const folderId = getOrCreateCategoryFolder('ai-image');
      addMediaFromUrl({
        url: localPath,
        name: `${char.name} - Character`,
        type: 'image',
        source: 'ai-image',
        folderId,
        projectId: activeProjectId || undefined,
      });
      toast.success(t("characters.generatedImage", { name: char.name }));
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t("characters.generateImageFailed", { name: char.name, message: msg }));
    } finally {
      activeGenerationControllersRef.current.delete(char.id);
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(char.id);
        return next;
      });
      setGeneratingStartedAtById((prev) => {
        if (!prev[char.id]) return prev;
        const next = { ...prev };
        delete next[char.id];
        return next;
      });
    }
  }, [updateCharacter, getOrCreateCategoryFolder, addMediaFromUrl, activeProjectId, projectVisualStyleId, t]);

  const handleStopGenerateImage = useCallback((characterId: string) => {
    activeGenerationControllersRef.current.get(characterId)?.abort();
    activeGenerationControllersRef.current.delete(characterId);
    setGeneratingIds((prev) => {
      const next = new Set(prev);
      next.delete(characterId);
      return next;
    });
    setGeneratingStartedAtById((prev) => {
      if (!prev[characterId]) return prev;
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
    toast.info('Đã dừng tạo ảnh nhân vật');
  }, []);

  const handleGenerateImage = useCallback((char: Character) => {
    void generateOneImage(char);
  }, [generateOneImage]);

  const handleGenerateAllImages = useCallback(async () => {
    const targets = characterImageBatchTargets.filter(
      (character) => !activeGenerationControllersRef.current.has(character.id)
    );
    if (targets.length === 0) return;

    const featureConfig = getFeatureConfig('character_generation');
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('character_generation'));
      return;
    }

    const runId = ++batchGenerationRunRef.current;
    setIsGeneratingAllImages(true);
    try {
      const { laneCount } = await getImageGenerationLaneConfig();
      await runLaneQueue(
        targets.map((character) => ({ item: character })),
        buildLaneWorkers([], laneCount),
        async ({ item: character }) => {
          if (batchGenerationRunRef.current !== runId) return;
          try {
            await generateOneImage(character);
          } catch (error) {
            if (!(error instanceof Error && error.message === 'Cancelled by user')) {
              console.error(`[CharacterGallery] Batch: character ${character.id} image generation failed:`, error);
            }
          }
        },
        undefined,
      );
    } finally {
      if (batchGenerationRunRef.current === runId) {
        setIsGeneratingAllImages(false);
      }
    }
  }, [characterImageBatchTargets, generateOneImage]);

  const handleStopAllGenerateImages = useCallback(() => {
    batchGenerationRunRef.current += 1;
    activeGenerationControllersRef.current.forEach((controller) => controller.abort());
    activeGenerationControllersRef.current.clear();
    setGeneratingIds(new Set());
    setGeneratingStartedAtById({});
    setIsGeneratingAllImages(false);
  }, []);

  const handleUploadCharacterImage = useCallback(async (char: Character, file: File) => {
    try {
      const dataUrl = await fileToBase64(file);
      const localPath = await saveImageToLocal(
        dataUrl,
        'characters',
        `${char.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.png`
      );
      updateCharacter(char.id, { thumbnailUrl: localPath });
      toast.success(`Uploaded reference image for ${char.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [updateCharacter]);

  const handleFillCharacterImages = async (files: File[]) => {
    const targets = visibleCharacters.filter((character) =>
      !character.thumbnailUrl
    );
    const result = matchImageFilesByName(
      files.filter(isSupportedImageFile),
      targets,
      (character) => character.id,
      (character) => character.name,
    );

    let filled = 0;
    let failed = 0;
    setIsFillingImages(true);
    try {
      for (let index = 0; index < result.matches.length; index++) {
        const { file, item: character } = result.matches[index];
        try {
          const dataUrl = await fileToBase64(file);
          const localPath = await saveImageToLocal(
            dataUrl,
            "characters",
            `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${Date.now()}_${index}.png`,
          );
          updateCharacter(character.id, { thumbnailUrl: localPath });
          filled += 1;
        } catch {
          failed += 1;
        }
      }
    } finally {
      setIsFillingImages(false);
    }

    toast.success(t("characters.imagesFilled", {
      filled,
      skipped: result.unmatched + result.ambiguous + failed,
    }));
  };

  const handleSyncGoogleFlowReferences = useCallback(async () => {
    if (isSyncingGoogleFlowReferences) return;
    const sources = visibleCharacters.flatMap((character) => [
      character.thumbnailUrl,
      ...(character.referenceImages || []),
    ].filter((source): source is string => !!source).map((source) => ({
      source,
      mediaIdsByOwnerScope: character.googleFlowMediaIdsBySource?.[getSourceFingerprint(source)],
    })));
    setIsSyncingGoogleFlowReferences(true);
    try {
      const result = await syncGoogleFlowReferenceSources(flowBindingProjectId, sources, activeProjectName);
      for (const character of visibleCharacters) {
        const nextBySource = { ...(character.googleFlowMediaIdsBySource || {}) };
        let changed = false;
        for (const source of [character.thumbnailUrl, ...(character.referenceImages || [])].filter((value): value is string => !!value)) {
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
        if (changed) updateCharacter(character.id, { googleFlowMediaIdsBySource: nextBySource });
      }
      await refreshGoogleFlowBindings();
      const failed = result.credentials.filter((credential) => credential.error);
      if (failed.length > 0) {
        toast.warning(t("characters.syncFlowPartial", {
          synced: result.syncedReferenceCount,
          total: result.sourceCount * result.credentialCount,
          failed: failed.length,
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
        }));
      } else {
        toast.success(t("characters.syncFlowSuccess", {
          uploaded: result.uploadedCount,
          skipped: result.skippedCount,
          accounts: result.credentialCount,
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("characters.syncFlowError"));
    } finally {
      setIsSyncingGoogleFlowReferences(false);
    }
  }, [activeProjectName, flowBindingProjectId, isSyncingGoogleFlowReferences, refreshGoogleFlowBindings, t, updateCharacter, visibleCharacters]);


  return {
    generatingIds,
    generatingStartedAtById,
    isGeneratingAllImages,
    isFillingImages,
    isSyncingGoogleFlowReferences,
    now,
    handleGenerateImage,
    handleStopGenerateImage,
    handleGenerateAllImages,
    handleStopAllGenerateImages,
    handleUploadCharacterImage,
    handleFillCharacterImages,
    handleSyncGoogleFlowReferences,
  };
}
