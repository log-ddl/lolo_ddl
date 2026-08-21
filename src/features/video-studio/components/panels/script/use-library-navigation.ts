"use client";

/**
 * Cross-panel jumps from the Script panel.
 *
 * Each handler resolves the script-side entity, makes sure a matching library
 * entry exists (creating and linking it when needed), then switches tabs with
 * the data pre-filled — so Characters / Scenes / Director open ready to work
 * instead of empty.
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
import type { ScriptData, Shot } from "@/features/video-studio/types/script";
import type { Character } from "@/features/video-studio/stores/character-library-store";
import type { Scene as LibraryScene } from "@/features/video-studio/stores/scene-store";

export interface LibraryNavigationDeps {
  projectId: string;
  scriptData: ScriptData | null | undefined;
  shots: Shot[];
  styleId: string | undefined;
  activeEpisodeIndex: number | null;
  activeEpisodeId: string | undefined;
  allCharacters: Character[];
  sceneLibraryItems: LibraryScene[];
  uiLanguage: string;
  setActiveTab: (tab: any) => void;
  selectLibraryCharacter: (id: string | null) => void;
  selectLibraryScene: (id: string | null) => void;
  addLibraryCharacter: (input: any) => string;
  addLibraryScene: (input: any) => string;
  setCharacterLibraryFolder: (id: string | null) => void;
  setSceneLibraryFolder: (id: string | null) => void;
  updateCharacter: (projectId: string, id: string, updates: any) => void;
  updateScene: (projectId: string, id: string, updates: any) => void;
  goToSceneWithData: (data: any) => void;
  goToDirectorWithData: (data: any) => void;
  getShotPromptVoiceFields: (shot: { videoPrompt?: string; voiceOver?: string }) => { videoPrompt?: string; voiceOver?: string };
  t: Translate;
}

export function useLibraryNavigation(deps: LibraryNavigationDeps) {
  const {
    projectId,
    scriptData,
    shots,
    styleId,
    activeEpisodeIndex,
    activeEpisodeId,
    allCharacters,
    sceneLibraryItems,
    uiLanguage,
    setActiveTab,
    selectLibraryCharacter,
    selectLibraryScene,
    addLibraryCharacter,
    addLibraryScene,
    setCharacterLibraryFolder,
    setSceneLibraryFolder,
    updateCharacter,
    updateScene,
    goToSceneWithData,
    goToDirectorWithData,
    getShotPromptVoiceFields,
    t,
  } = deps;

  const [sceneImportOpen, setSceneImportOpen] = useState(false);
  const [selectedSceneImportIds, setSelectedSceneImportIds] = useState<string[]>([]);

  const extractPromptCharacterNames = useCallback((...prompts: Array<string | undefined>) => {
    const names = new Set<string>();
    for (const prompt of prompts) {
      if (!prompt) continue;
      for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
        const name = (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
        if (name) names.add(name);
      }
    }
    return Array.from(names);
  }, []);
  const mapPromptNamesToLibraryIds = useCallback((names: string[]) => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const name of names) {
      const libraryChar = allCharacters.find((c) =>
        c.name === name || c.name.includes(name) || name.includes(c.name)
      );
      if (libraryChar && !seen.has(libraryChar.id)) {
        ids.push(libraryChar.id);
        seen.add(libraryChar.id);
      }
    }
    return ids;
  }, [allCharacters]);
  const getSceneLibraryReference = useCallback((scene?: import("@/features/video-studio/types/script").ScriptScene) => {
    if (!scene) return {};
    const linked = scene.sceneLibraryId
      ? sceneLibraryItems.find((item) => item.id === scene.sceneLibraryId)
      : undefined;
    const matched = linked || sceneLibraryItems.find((item) => {
      const sceneName = scene.name || '';
      return !!sceneName && (item.name.includes(sceneName) || sceneName.includes(item.name));
    });
    return {
      sceneLibraryId: matched?.id,
      sceneReferenceImage: matched?.referenceImage || matched?.referenceImageBase64,
    };
  }, [sceneLibraryItems]);
  const storyPromptLabels = uiLanguage === 'vi'
    ? {
        scene: 'Cảnh',
        time: 'Thời gian',
        mood: 'Bầu không khí',
        action: 'Hành động',
        dialogue: 'Lời thoại',
        shotList: 'Danh sách shot',
        shot: 'Shot',
      }
    : {
        scene: 'Scene',
        time: 'Time',
        mood: 'Mood',
        action: 'Action',
        dialogue: 'Dialogue',
        shotList: 'Shot List',
        shot: 'Shot',
      };
  // Jump to the character library and pass data into the generation console.
  const handleGoToCharacterLibrary = useCallback(
    (characterId: string) => {
      // Find the character data.
      const character = scriptData?.characters.find((c) => c.id === characterId);
      if (!character) {
        setActiveTab("characters");
        toast.info(t("scriptView.goCharacterLibrary"));
        return;
      }

      // Check whether the character is already linked to the character library.
      if (character.characterLibraryId) {
        const libChar = allCharacters.find((c) => c.id === character.characterLibraryId);
        if (libChar) {
          // Already linked and still exists: jump directly and select it.
          selectLibraryCharacter(character.characterLibraryId);
          setActiveTab("characters");
          toast.info(t("scriptView.goCharacterLibrarySelected", { name: character.name }));
          return;
        }
        // Library character was deleted — clear stale reference and fall through to re-add.
        updateCharacter(projectId, character.id, { characterLibraryId: undefined });
      }

      const libraryId = addLibraryCharacter({
        name: character.name,
        description: character.appearance,
        characterPrompt: character.characterPrompt || "",
        projectId,
        aspectRatio: '1:1',
        styleId,
        status: "linked",
        linkedEpisodeId: activeEpisodeId,
        thumbnailUrl: undefined,
      });

      updateCharacter(projectId, character.id, { characterLibraryId: libraryId });
      useScriptStore.getState().setMappings(projectId, {
        characterIdMap: {
          ...useScriptStore.getState().projects[projectId]?.characterIdMap,
          [character.id]: libraryId,
        },
      });
      setCharacterLibraryFolder(null);
      selectLibraryCharacter(libraryId);
      setActiveTab("characters");

      toast.success(t("scriptView.charactersImported", { count: 1 }));
    },
    [scriptData, styleId, setActiveTab, selectLibraryCharacter, activeEpisodeIndex, activeEpisodeId, addLibraryCharacter, projectId, updateCharacter, setCharacterLibraryFolder, t]
  );

  const handleOpenCharactersPanel = useCallback((initialCharacterId?: string) => {
    if (initialCharacterId) {
      handleGoToCharacterLibrary(initialCharacterId);
      return;
    }
    setActiveTab("characters");
    toast.info(t("scriptView.goCharacterLibrary"));
  }, [handleGoToCharacterLibrary, setActiveTab, t]);

  // Jump to the scene library using either full AI-analysis data or basic scene data.
  const handleGoToSceneLibrary = useCallback(
    (sceneId: string) => {
      // Find the scene data.
      const scene = scriptData?.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        setActiveTab("scenes");
        toast.info(t("scriptView.goSceneLibrary"));
        return;
      }

      if (scene.sceneLibraryId && sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)) {
        selectLibraryScene(scene.sceneLibraryId);
        setActiveTab("scenes");
        toast.info(t("scriptView.goSceneLibrarySelected", { name: scene.name || t("scenes.untitled") }));
        return;
      }

      goToSceneWithData({
        name: scene.name || t("scenes.untitled"),
        description: scene.description || scene.name,
        aspectRatio: '16:9',
        styleId,
        scenePrompt: scene.scenePrompt,
        // === Episode-scope passthrough ===
        sourceEpisodeIndex: activeEpisodeIndex ?? undefined,
        sourceEpisodeId: activeEpisodeId,
        // === Prompt language preference ===
            promptLanguage: 'en',
      });

      toast.success(t("scriptView.goSceneLibraryBasic", { name: scene.name || t("scenes.untitled") }));
    },
    [scriptData, sceneLibraryItems, styleId, setActiveTab, goToSceneWithData, activeEpisodeIndex, activeEpisodeId, selectLibraryScene, t]
  );

  const openSceneImport = useCallback((initialSceneId?: string) => {
    const importableScenes = (scriptData?.scenes || []).filter((scene) =>
      !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
    );
    if (importableScenes.length === 0) {
      setActiveTab("scenes");
      toast.info(t("scriptView.allScenesImported"));
      return;
    }

    const defaultIds = initialSceneId && importableScenes.some((scene) => scene.id === initialSceneId)
      ? [initialSceneId]
      : importableScenes.map((scene) => scene.id);
    setSelectedSceneImportIds(defaultIds);
    setSceneImportOpen(true);
  }, [scriptData, sceneLibraryItems, setActiveTab, t]);

  const handleImportScenes = useCallback(() => {
    const importScenes = (scriptData?.scenes || []).filter((scene) => selectedSceneImportIds.includes(scene.id));
    if (importScenes.length === 0) {
      toast.error(t("scriptView.selectScenesToImport"));
      return;
    }

    let lastImportedSceneId: string | null = null;
    importScenes.forEach((scene) => {
      const libraryId = addLibraryScene({
        name: scene.name || t("scenes.untitled"),
        description: scene.description || scene.name,
        time: 'day',
        atmosphere: 'neutral',
        aspectRatio: '16:9',
        projectId,
        scenePrompt: scene.scenePrompt,
        styleId,
        status: "linked",
        linkedEpisodeId: activeEpisodeId,
        sourceScriptSceneId: scene.id,
      });
      lastImportedSceneId = libraryId;
      updateScene(projectId, scene.id, { sceneLibraryId: libraryId });
    });

    setSceneImportOpen(false);
    setSelectedSceneImportIds([]);
    setSceneLibraryFolder(null);
    if (lastImportedSceneId) {
      selectLibraryScene(lastImportedSceneId);
    }
    setActiveTab("scenes");
    toast.success(t("scriptView.scenesImported", { count: importScenes.length }));
  }, [scriptData, selectedSceneImportIds, addLibraryScene, projectId, styleId, activeEpisodeId, updateScene, setSceneLibraryFolder, selectLibraryScene, setActiveTab, t]);


  // Jump to AI director
  const handleGoToDirector = useCallback(
    (shotId: string) => {
      // Find the shot data.
      const shot = shots.find((s) => s.id === shotId);
      if (!shot) {
        setActiveTab("director");
        toast.info(t("scriptView.goDirector"));
        return;
      }

      // Find the scene information.
      const scene = scriptData?.scenes.find((s) => s.id === shot.sceneRefId);
      const voiceFields = getShotPromptVoiceFields(shot);
      // Build the story prompt from scene and prompts.
      const promptParts: string[] = [];
      if (scene) {
        promptParts.push(`${storyPromptLabels.scene}: ${scene.name || t("scenes.untitled")}`);
      }
      if (shot.imagePrompt) promptParts.push(`Image: ${shot.imagePrompt}`);
      if (voiceFields.videoPrompt) promptParts.push(`Video: ${voiceFields.videoPrompt}`);

      const storyPrompt = promptParts.join("\n");
      const characterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
      const characterLibraryIds = mapPromptNamesToLibraryIds(characterNames);
      const sceneReference = getSceneLibraryReference(scene);

      // Pass data and jump: single-shot mode with sceneCount = 1.
      goToDirectorWithData({
        storyPrompt,
        characterNames,
        characterLibraryIds,
        sceneLocation: scene?.name,
        sceneTime: undefined,
        shotId,
        sceneCount: 1,
        styleId,
        sourceType: 'shot',
        sourceEpisodeIndex: activeEpisodeIndex ?? undefined,
        sourceEpisodeId: activeEpisodeId,
        prebuiltScenes: [{
          imagePrompt: shot.imagePrompt || '',
          videoPrompt: voiceFields.videoPrompt,
          voiceOver: voiceFields.voiceOver,
          videoLength: normalizeVideoLength(shot.videoLength),
          ref_image: shot.ref_image,
          sourceShotId: shot.id,
          sourceShotIndex: shot.index,
          characterIds: characterLibraryIds,
          characterNames,
          sceneName: scene?.name || '',
          sceneLocation: scene?.name || '',
          ...sceneReference,
        }],
      });

      toast.success(t("scriptView.goDirectorShotFilled"));
    },
    [shots, scriptData, styleId, goToDirectorWithData, setActiveTab, activeEpisodeIndex, activeEpisodeId, storyPromptLabels, sceneLibraryItems, t]
  );

  // Jump from a scene into AI director using all shots in that scene.
  const handleGoToDirectorFromScene = useCallback(
    (sceneId: string) => {
      // Find the scene data.
      const scene = scriptData?.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        setActiveTab("director");
        toast.info(t("scriptView.goDirector"));
        return;
      }

      // Find all shots under the scene.
      const sceneShots = shots.filter((s) => s.sceneRefId === sceneId);
      const shotCount = sceneShots.length || 1;

      // Build the story prompt from scene info plus all shot content.
      const promptParts: string[] = [];
      promptParts.push(`${storyPromptLabels.scene}: ${scene.name || t("scenes.untitled")}`);

      if (sceneShots.length > 0) {
        promptParts.push(`\n--- ${storyPromptLabels.shotList} (${sceneShots.length}) ---`);
        sceneShots.forEach((shot, idx) => {
          const voiceFields = getShotPromptVoiceFields(shot);
          const shotDesc = [
            `\n[${storyPromptLabels.shot} ${idx + 1}]`,
            shot.imagePrompt ? `Image: ${shot.imagePrompt}` : null,
            voiceFields.videoPrompt ? `Video: ${voiceFields.videoPrompt}` : null,
          ].filter(Boolean).join(" ");
          promptParts.push(shotDesc);
        });
      }

      const storyPrompt = promptParts.join("\n");
      const allCharacterNames = new Set<string>();
      sceneShots.forEach((shot) => {
        const voiceFields = getShotPromptVoiceFields(shot);
        extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt).forEach((name) => allCharacterNames.add(name));
      });
      const sceneReference = getSceneLibraryReference(scene);

      // Pass data and jump: scene-level mode with sceneCount equal to the number of shots.
      goToDirectorWithData({
        storyPrompt,
        characterNames: Array.from(allCharacterNames),
        characterLibraryIds: mapPromptNamesToLibraryIds(Array.from(allCharacterNames)),
        sceneLocation: scene.name,
        sceneTime: undefined,
        sceneCount: shotCount,
        styleId,
        sourceType: 'scene',
        sourceEpisodeIndex: activeEpisodeIndex ?? undefined,
        sourceEpisodeId: activeEpisodeId,
        prebuiltScenes: sceneShots.map((shot) => {
          const voiceFields = getShotPromptVoiceFields(shot);
          const names = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
          return {
            imagePrompt: shot.imagePrompt || '',
            videoPrompt: voiceFields.videoPrompt,
            voiceOver: voiceFields.voiceOver,
            videoLength: normalizeVideoLength(shot.videoLength),
            ref_image: shot.ref_image,
            sourceShotId: shot.id,
            sourceShotIndex: shot.index,
            characterIds: mapPromptNamesToLibraryIds(names),
            characterNames: names,
            sceneName: scene.name || '',
            sceneLocation: scene.name || '',
            ...sceneReference,
          };
        }),
      });

      toast.success(t("scriptView.goDirectorSceneFilled", { name: scene.name || t("scenes.untitled"), count: shotCount }));
    },
    [shots, scriptData, styleId, goToDirectorWithData, setActiveTab, activeEpisodeIndex, activeEpisodeId, storyPromptLabels, sceneLibraryItems, t]
  );

  return {
    sceneImportOpen,
    setSceneImportOpen,
    selectedSceneImportIds,
    setSelectedSceneImportIds,
    extractPromptCharacterNames,
    mapPromptNamesToLibraryIds,
    getSceneLibraryReference,
    handleGoToCharacterLibrary,
    handleOpenCharactersPanel,
    handleGoToSceneLibrary,
    openSceneImport,
    handleImportScenes,
    handleGoToDirector,
    handleGoToDirectorFromScene,
  };
}
