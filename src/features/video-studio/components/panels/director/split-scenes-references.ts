/**
 * Resolves the reference images a shot sends to the image/video providers:
 * character library entries, linked scene references, and cross-shot refs.
 */

import { useCallback } from "react";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useDirectorStore, type SplitScene } from "@/features/video-studio/stores/director-store";
import { readImageAsBase64 } from "@/features/video-studio/lib/image-storage";
import { normalizeRefImageIndexes } from "@/features/video-studio/types/script";
import { MAX_REFERENCE_IMAGES, looksLikeUuid } from "./split-scenes-helpers";

export type ReferenceValueType = 'http' | 'base64' | 'local-image' | 'unknown';

export interface CharacterReferenceDetail {
  characterId: string;
  characterName: string;
  source: 'thumbnail' | 'view' | 'referenceImages';
  valueType: ReferenceValueType;
  preview: string;
  value: string;
  originalValue: string;
}

export interface ShotReferenceDetail {
  shotIndex: number;
  sceneId: number;
  value: string;
  originalValue: string;
  label: string;
}

export interface ShotReferences {
  getCharacterReferenceDetails: (characterIds: string[]) => CharacterReferenceDetail[];
  getCharacterReferenceImages: (characterIds: string[]) => string[];
  processReferenceImagesForApi: (referenceImages: string[], logPrefix: string) => Promise<string[]>;
  getSceneShotIndex: (scene: SplitScene) => number;
  getShotReferenceDetails: (scene: SplitScene) => ShotReferenceDetail[];
  getMissingShotReferenceLabels: (scene: SplitScene) => string[];
}

const detectValueType = (value: string): ReferenceValueType => {
  if (value.startsWith('http://') || value.startsWith('https://')) return 'http';
  if (value.startsWith('data:image/')) return 'base64';
  if (value.startsWith('local-image://')) return 'local-image';
  return 'unknown';
};

export function useShotReferences(splitScenes: SplitScene[]): ShotReferences {
  // Collect character reference images (interleaved across characters for fair distribution).
  const getCharacterReferenceDetails = useCallback((characterIds: string[]): CharacterReferenceDetail[] => {
    if (!characterIds?.length) return [];
    const { characters } = useCharacterLibraryStore.getState();

    const perCharacterDetails = characterIds.flatMap((characterId) => {
      const character = characters.find(c => c.id === characterId);
      if (!character) return [];
      const refs: CharacterReferenceDetail[] = [];
      const seen = new Set<string>();
      const push = (
        value: string | null | undefined,
        source: CharacterReferenceDetail['source'],
      ) => {
        if (value && !seen.has(value)) {
          seen.add(value);
          refs.push({
            characterId,
            characterName: character.name,
            source,
            valueType: detectValueType(value),
            preview: value.slice(0, 120),
            value,
            originalValue: value,
          });
        }
      };
      push(character.thumbnailUrl, 'thumbnail');
      return [refs];
    });

    const result: CharacterReferenceDetail[] = [];
    const seen = new Set<string>();
    const maxDepth = perCharacterDetails.reduce((d, r) => Math.max(d, r.length), 0);
    for (let i = 0; i < maxDepth && result.length < MAX_REFERENCE_IMAGES; i++) {
      for (const refs of perCharacterDetails) {
        const detail = refs[i];
        if (detail && !seen.has(detail.value)) {
          seen.add(detail.value);
          result.push(detail);
        }
        if (result.length >= MAX_REFERENCE_IMAGES) return result;
      }
    }
    return result;
  }, []);

  const getCharacterReferenceImages = useCallback((characterIds: string[]): string[] => {
    return getCharacterReferenceDetails(characterIds).map((item) => item.value);
  }, [getCharacterReferenceDetails]);

  const processReferenceImagesForApi = useCallback(async (
    referenceImages: string[],
    logPrefix: string,
  ): Promise<string[]> => {
    const processedRefs: string[] = [];

    for (const url of referenceImages) {
      if (!url) continue;

      if (url.startsWith('http://') || url.startsWith('https://')) {
        processedRefs.push(url);
      } else if (looksLikeUuid(url)) {
        processedRefs.push(url);
      } else if (url.startsWith('data:image/') && url.includes(';base64,')) {
        processedRefs.push(url);
      } else if (url.startsWith('local-image://')) {
        try {
          const base64 = await readImageAsBase64(url);
          if (base64 && base64.startsWith('data:image/') && base64.includes(';base64,')) {
            processedRefs.push(base64);
          }
        } catch (error) {
          console.warn(`${logPrefix} Failed to read local image:`, url, error);
        }
      }
    }

    return processedRefs;
  }, []);

  const getSceneShotIndex = useCallback((scene: SplitScene): number => {
    return scene.sourceShotIndex || scene.id + 1;
  }, []);

  const getShotReferenceDetails = useCallback((scene: SplitScene): ShotReferenceDetail[] => {
    const indexes = normalizeRefImageIndexes(scene.ref_image);
    if (indexes.length === 0) return [];
    const directorState = useDirectorStore.getState();
    const latestScenes = directorState.activeProjectId
      ? directorState.projects[directorState.activeProjectId]?.splitScenes || []
      : [];
    const scenePool = latestScenes.length > 0 ? latestScenes : splitScenes;

    return indexes
      .map((shotIndex) => {
        const sourceScene = scenePool.find((item) => getSceneShotIndex(item) === shotIndex);
        if (!sourceScene || sourceScene.id === scene.id) {
          return {
            shotIndex,
            sceneId: -1,
            value: '',
            originalValue: '',
            label: `Shot ${String(shotIndex).padStart(2, '0')}`,
          };
        }

        const value = sourceScene.imageDataUrl || sourceScene.imageHttpUrl || '';
        return {
          shotIndex,
          sceneId: sourceScene.id,
          value,
          originalValue: value,
          label: `Shot ${String(shotIndex).padStart(2, '0')}`,
        };
      });
  }, [getSceneShotIndex, splitScenes]);

  const getMissingShotReferenceLabels = useCallback((scene: SplitScene): string[] => {
    return getShotReferenceDetails(scene)
      .filter((detail) => !detail.value)
      .map((detail) => detail.label);
  }, [getShotReferenceDetails]);

  return {
    getCharacterReferenceDetails,
    getCharacterReferenceImages,
    processReferenceImagesForApi,
    getSceneShotIndex,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
  };
}
