"use client";

/**
 * Director Context Panel Component
 * Global right-side context panel for AI director mode.
 * Displays the screenplay hierarchy and lets the user choose what to generate.
 */

import { useState, useMemo, useCallback } from "react";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { useActiveScriptProject } from "@/features/video-studio/stores/script-store";
import { getShotCompletionStatus, calculateProgress } from "@/features/video-studio/lib/script/shot-utils";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Film,
  ArrowLeft,
  FileVideo,
  Plus,
} from "lucide-react";
import type { Shot, ScriptScene } from "@/features/video-studio/types/script";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
import { cleanVoiceOverText, splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { DEFAULT_STYLE_ID } from "@/features/video-studio/lib/constants/visual-styles";
import { useDirectorStore, useActiveDirectorProject, type SoundEffectTag } from '@/features/video-studio/stores/director-store';
import { useCharacterLibraryStore } from '@/features/video-studio/stores/character-library-store';
import { useSceneStore } from '@/features/video-studio/stores/scene-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { setProjectVisualStyleId, useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

function getShotPromptVoiceFields(shot: { videoPrompt?: string; voiceOver?: string }) {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  return {
    videoPrompt: parts.videoPrompt,
    voiceOver: cleanVoiceOverText(shot.voiceOver) || parts.voiceOver,
  };
}

// Exported component
export function DirectorContextPanel() {
  const { t } = useI18n();
  const { setActiveTab, goToDirectorWithData } = useMediaPanelStore();
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { addScenesFromScript, setStoryboardConfig } = useDirectorStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  
  // Get current project data
  const projectData = useActiveDirectorProject();
  const splitScenes = projectData?.splitScenes || [];
  // Get scene library data
  const { scenes } = useSceneStore();
  const sceneLibraryScenes = useMemo(() => {
    if (resourceSharing.shareScenes) return scenes;
    if (!activeProjectId) return [];
    return scenes.filter((s) => s.projectId === activeProjectId);
  }, [scenes, resourceSharing.shareScenes, activeProjectId]);

  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set(["default", "ep_1"]));
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  const scriptData = scriptProject?.scriptData || null;
  const shots = scriptProject?.shots || [];
  const styleId = projectVisualStyleId || DEFAULT_STYLE_ID;

  // When adding shots from the script, sync the script style into the director storyboardConfig.
  const addScenesAndSyncStyle: typeof addScenesFromScript = useCallback((scenes) => {
    addScenesFromScript(scenes);
    // If the director panel has no visualStyleId yet, inherit it from the script project.
    const directorStyleId = projectData?.storyboardConfig?.visualStyleId;
    if (!directorStyleId) {
      setProjectVisualStyleId(projectVisualStyleId);
    }
    // Sync videoGenerationMode from script to director
    if (scriptProject?.videoGenerationMode) {
      setStoryboardConfig({ videoGenerationMode: scriptProject.videoGenerationMode });
    }
  }, [addScenesFromScript, setStoryboardConfig, projectData?.storyboardConfig?.visualStyleId, projectVisualStyleId, scriptProject?.videoGenerationMode]);

  // Create a default episode when no episode list exists.
  const episodes = useMemo(() => {
    if (!scriptData) return [];
    if (scriptData.episodes && scriptData.episodes.length > 0) {
      return scriptData.episodes;
    }
    // Default single-episode fallback
    return [{
      id: "default",
      index: 1,
      title: scriptData.title || "Episode 1",
      sceneIds: scriptData.scenes.map((s) => s.id),
    }];
  }, [scriptData]);

  const handleBackToScript = () => {
    setActiveTab("script");
  };

  const toggleEpisode = (id: string) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get all characters from the character library
  const { characters } = useCharacterLibraryStore();
  const libraryCharacters = useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeProjectId) return [];
    return characters.filter((c) => c.projectId === activeProjectId);
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);
  
  // Map screenplay character IDs or names to character-library IDs
  const mapScriptCharacterIdsToLibraryIds = (scriptCharIds: string[], characterNames?: string[]): string[] => {
    const libraryIds: string[] = [];
    const addedIds = new Set<string>(); // Avoid duplicates
    
    // 1. Match by characterIds first
    if (scriptCharIds && scriptCharIds.length > 0 && scriptData) {
      for (const scriptCharId of scriptCharIds) {
        // Find the screenplay character
        const scriptChar = scriptData.characters.find(c => c.id === scriptCharId);
        if (!scriptChar) continue;
        
        // Prefer the already-linked characterLibraryId when it is still valid in the visible library.
        if (scriptChar.characterLibraryId && !addedIds.has(scriptChar.characterLibraryId)) {
          const linkedLibraryChar = libraryCharacters.find(c => c.id === scriptChar.characterLibraryId);
          if (linkedLibraryChar) {
            libraryIds.push(linkedLibraryChar.id);
            addedIds.add(linkedLibraryChar.id);
            continue;
          }
          console.warn(`[ContextPanel] Invalid characterLibraryId "${scriptChar.characterLibraryId}" for script character "${scriptChar.name}", fallback to name matching`);
        }
        
        // Otherwise fall back to name matching in the character library.
        const libraryChar = libraryCharacters.find(c => c.name === scriptChar.name);
        if (libraryChar && !addedIds.has(libraryChar.id)) {
          libraryIds.push(libraryChar.id);
          addedIds.add(libraryChar.id);
        }
      }
    }
    
    // 2. Then supplement by characterNames (AI-calibrated shots may only have names).
    if (characterNames && characterNames.length > 0) {
      for (const charName of characterNames) {
        if (!charName) continue;
        
        // Exact match
        let libraryChar = libraryCharacters.find(c => c.name === charName);
        
        // Fuzzy match: library name contains shot character name, or vice versa.
        if (!libraryChar) {
          libraryChar = libraryCharacters.find(c => 
            c.name.includes(charName) || charName.includes(c.name)
          );
        }
        
        if (libraryChar && !addedIds.has(libraryChar.id)) {
          libraryIds.push(libraryChar.id);
          addedIds.add(libraryChar.id);
          console.log(`[ContextPanel] Matched character "${charName}" to library "${libraryChar.name}"`);
        }
      }
    }
    
    return libraryIds;
  };
  const extractPromptCharacterNames = (...prompts: Array<string | undefined>): string[] => {
    const names = new Set<string>();
    for (const prompt of prompts) {
      if (!prompt) continue;
      for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
        const name = (match[1] || match[2] || '').trim().replace(/[,.!?;:，。！？；：]+$/, '');
        if (name) names.add(name);
      }
    }
    return Array.from(names);
  };
  const sceneById = useMemo(() => new Map(scriptData?.scenes.map((scene) => [scene.id, scene]) || []), [scriptData?.scenes]);
  const shotsByEpisodeId = useMemo(() => {
    const map = new Map<string, Shot[]>();
    for (const episode of episodes) {
      const episodeSceneIds = new Set(episode.sceneIds || []);
      map.set(
        episode.id,
        shots.filter((shot) => shot.episodeId === episode.id || episodeSceneIds.has(shot.sceneRefId))
      );
    }
    return map;
  }, [episodes, shots]);
  
  // Match the script scene to a parent scene in the scene library by fuzzy name match.
  interface SceneMatchResult {
    sceneLibraryId: string;
    sceneReferenceImage: string | undefined;
    matchedSceneName: string;
  }
  const findMatchingSceneInLibrary = (scene: ScriptScene): SceneMatchResult | null => {
    const sceneName = scene.name || '';
    const parentScene = sceneLibraryScenes.find(s =>
      (s.name.includes(sceneName) || sceneName.includes(s.name))
    );
    if (!parentScene) return null;
    return {
      sceneLibraryId: parentScene.id,
      sceneReferenceImage: parentScene.referenceImage || parentScene.referenceImageBase64,
      matchedSceneName: parentScene.name,
    };
  };

  // Add a single shot into split-scene editing (mode 2).
  const handleAddShotToSplitScenes = (shot: Shot, scene?: ScriptScene) => {
    const voiceFields = getShotPromptVoiceFields(shot);
    // Debug: inspect the tri-layer shot prompt data
    console.log('[ContextPanel] Adding shot to split scenes:', {
      shotId: shot.id,
      imagePrompt: shot.imagePrompt?.substring(0, 50),
      videoPrompt: voiceFields.videoPrompt.substring(0, 50),
    });
    const promptCharacterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
    const characterLibraryIds = mapScriptCharacterIdsToLibraryIds([], promptCharacterNames);
    // Auto-match the corresponding scene from the scene library.
    const sceneMatch = scene ? findMatchingSceneInLibrary(scene) : null;

    addScenesAndSyncStyle([{
      // Scene info
      sceneName: sceneMatch?.matchedSceneName || scene?.name || '',
      sceneLocation: scene?.name || '',
      promptEn: voiceFields.videoPrompt || shot.imagePrompt || '',
      // Two-layer prompt system
      imagePrompt: shot.imagePrompt || '',
      videoPrompt: voiceFields.videoPrompt,
      voiceOver: voiceFields.voiceOver,
      videoLength: normalizeVideoLength(shot.videoLength),
      ref_image: shot.ref_image,
      sourceShotId: shot.id,
      sourceShotIndex: shot.index,
      characterIds: characterLibraryIds,
      characterNames: promptCharacterNames,
      ambientSound: '',
      soundEffects: [] as SoundEffectTag[],
      soundEffectText: '',
      dialogue: '',
      // Scene-library association (auto-matched)
      sceneLibraryId: sceneMatch?.sceneLibraryId,
      sceneReferenceImage: sceneMatch?.sceneReferenceImage,
    }]);
    
    const matchInfo = sceneMatch ? ` (Matched: ${sceneMatch.matchedSceneName})` : '';
    toast.success(`Added shot to editing list${matchInfo}`);
  };

  const handleAddEpisodeToSplitScenes = (episodeId: string) => {
    const episode = episodes.find((item) => item.id === episodeId);
    if (!episode) return;

    const episodeSceneIds = new Set(episode.sceneIds || []);
    const episodeShots = shots.filter((shot) => shot.episodeId === episode.id || episodeSceneIds.has(shot.sceneRefId));
    if (episodeShots.length === 0) {
      toast.warning("No shots in this episode");
      return;
    }

    const scenesToAdd = episodeShots.map((shot) => {
      const voiceFields = getShotPromptVoiceFields(shot);
      const scene = sceneById.get(shot.sceneRefId);
      const sceneMatch = scene ? findMatchingSceneInLibrary(scene) : null;
      const promptCharacterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
      return {
        sceneName: sceneMatch?.matchedSceneName || scene?.name || '',
        sceneLocation: scene?.name || '',
        promptEn: voiceFields.videoPrompt || shot.imagePrompt || '',
        imagePrompt: shot.imagePrompt || '',
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        videoLength: normalizeVideoLength(shot.videoLength),
        ref_image: shot.ref_image,
        sourceShotId: shot.id,
        sourceShotIndex: shot.index,
        characterIds: mapScriptCharacterIdsToLibraryIds([], promptCharacterNames),
        characterNames: promptCharacterNames,
        ambientSound: '',
        soundEffects: [] as SoundEffectTag[],
        soundEffectText: '',
        dialogue: '',
        sceneLibraryId: sceneMatch?.sceneLibraryId,
        sceneReferenceImage: sceneMatch?.sceneReferenceImage,
      };
    });

    addScenesAndSyncStyle(scenesToAdd);
    toast.success(`Added ${scenesToAdd.length} shots to editing list`);
  };

  // Send a single shot into AI director input (mode 1).
  const handleSendShot = (shot: Shot, scene?: ScriptScene) => {
    const voiceFields = getShotPromptVoiceFields(shot);
    // Build the story prompt.
    const parts: string[] = [];
    if (scene?.name) parts.push(`Scene: ${scene.name}`);
    if (scene?.description) parts.push(`Description: ${scene.description}`);
    if (scene?.time) parts.push(`Time: ${scene.time}`);
    if (shot.imagePrompt) parts.push(`Image: ${shot.imagePrompt}`);
    if (voiceFields.videoPrompt) parts.push(`Video: ${voiceFields.videoPrompt}`);
    const storyPrompt = parts.join("\n");

    goToDirectorWithData({
      storyPrompt,
      sceneLocation: scene?.name,
      sceneTime: scene?.time,
      shotId: shot.id,
      sceneCount: 1,
      styleId,
      sourceType: "shot",
      prebuiltScenes: [{
        imagePrompt: shot.imagePrompt || '',
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        videoLength: normalizeVideoLength(shot.videoLength),
        ref_image: shot.ref_image,
        sourceShotId: shot.id,
        sourceShotIndex: shot.index,
        sceneName: scene?.name || '',
        sceneLocation: scene?.name || '',
      }],
    });

    setSelectedShotId(shot.id);
  };

  // Show a hint when no script data is available.
  if (!scriptData) {
    return (
      <div className="h-full min-w-0 flex flex-col overflow-x-hidden">
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <FileVideo className="h-4 w-4" />
            {t("director.context.structure")}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground text-sm">
            <p>{t("director.context.noScript")}</p>
            <p className="mt-1">{t("director.context.goScript")}</p>
          </div>
        </div>
        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleBackToScript}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("director.context.goScriptButton")}
          </Button>
        </div>
      </div>
    );
  }

  // Calculate overall progress.
  const overallProgress = calculateProgress(
    shots.map((s) => ({ status: getShotCompletionStatus(s) }))
  );

  return (
    <div className="h-full min-w-0 flex flex-col overflow-x-hidden">
      {/* Title and progress */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{scriptData.title}</h3>
            {scriptData.genre && (
              <span className="text-xs text-muted-foreground">{scriptData.genre}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {t("director.context.progress", { value: overallProgress })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t("director.context.hint")}
        </p>
        {/* Shot-editing count */}
        {splitScenes.length > 0 && (
          <div className="mt-2 px-2 py-1 bg-green-500/10 rounded text-xs text-green-600 flex items-center gap-1">
            <Plus className="h-3 w-3" />
            <span>{t("director.context.addedCount", { count: splitScenes.length })}</span>
          </div>
        )}
      </div>

      {/* Tree structure */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Episode list */}
          {episodes.map((episode) => {
            const episodeShots = shotsByEpisodeId.get(episode.id) || [];
            const episodeProgress = calculateProgress(
              episodeShots.map((s) => ({ status: getShotCompletionStatus(s) }))
            );

            return (
              <div key={episode.id} className="space-y-0.5">
                {/* Episode title */}
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleEpisode(episode.id)}
                    className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted text-left"
                  >
                    {expandedEpisodes.has(episode.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <Film className="h-3 w-3 text-primary" />
                    <span className="text-sm font-medium flex-1 truncate">
                      {episode.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {episodeProgress}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddEpisodeToSplitScenes(episode.id);
                    }}
                    title={t("director.context.addEpisode")}
                  >
                    <Plus className="h-3 w-3 text-green-500" />
                  </Button>
                </div>

                {/* Shot list */}
                {expandedEpisodes.has(episode.id) && (
                  <div className="ml-4 space-y-0.5">
                    {episodeShots.map((shot) => {
                      const scene = sceneById.get(shot.sceneRefId);
                      const isShotSelected = selectedShotId === shot.id;
                      return (
                        <div key={shot.id} className="flex items-center group">
                          <button
                            onClick={() => handleSendShot(shot, scene)}
                            onDoubleClick={() => handleAddShotToSplitScenes(shot, scene)}
                            className={cn(
                              "flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-muted text-left",
                              isShotSelected && "bg-primary/10 ring-1 ring-primary/30"
                            )}
                            title={t("director.context.sendShotOrAdd")}
                          >
                            <span className="text-xs font-mono text-muted-foreground w-5">
                              {String(shot.index).padStart(2, "0")}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddShotToSplitScenes(shot, scene);
                            }}
                            title={t("director.context.addToEditing")}
                          >
                            <Plus className="h-3 w-3 text-green-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="p-3 border-t space-y-2">
        {/* Mode description */}
        <div className="text-[10px] text-muted-foreground space-y-1">
          <p><span className="text-green-500">+</span> {t("director.context.addMode")}</p>
          <p><span className="text-primary">→</span> {t("director.context.sendMode")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleBackToScript}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("director.context.backToScript")}
        </Button>
      </div>
    </div>
  );
}
