"use client";

/**
 * Scenes View - Three Column Layout
 * Left: Generation Console
 * Middle: Scene Gallery
 * Right: Scene Detail Panel
 */

import { useEffect, useMemo } from "react";
import { useSceneStore, type Scene } from "@/features/video-studio/stores/scene-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useActiveScriptProject, useScriptStore } from "@/features/video-studio/stores/script-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import { GenerationPanel } from "./generation-panel";
import { SceneGallery } from "./scene-gallery";
import { SceneDetail } from "./scene-detail";
import { importSceneCsv } from "@/features/video-studio/lib/library-csv-import";
import { downloadLibraryCsv, serializeSceneLibraryCsv } from "@/features/video-studio/lib/library-csv";
import { useI18n } from "@/shared/i18n";
import { toast } from "sonner";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

export function ScenesView() {
  const { t } = useI18n();
  const { scenes, selectedSceneId, selectScene, addScene, updateScene: updateLibraryScene } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeScriptProjectId = useScriptStore((state) => state.activeProjectId);
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const updateScriptScene = useScriptStore((state) => state.updateScene);
  const setMappings = useScriptStore((state) => state.setMappings);

  const visibleScenes = useMemo(() => {
    if (resourceSharing.shareScenes) return scenes;
    if (!activeScriptProjectId) return [];
    return scenes.filter((s) => s.projectId === activeScriptProjectId);
  }, [scenes, resourceSharing.shareScenes, activeScriptProjectId]);

  const selectedScene = useMemo(
    () => visibleScenes.find((s) => s.id === selectedSceneId) || null,
    [visibleScenes, selectedSceneId]
  );

  const handleSceneSelect = (scene: Scene | null) => {
    selectScene(scene?.id || null);
  };

  const handleImportCsv = async (file: File) => {
    if (!activeScriptProjectId) {
      toast.error(t("scenes.csvNeedsProject"));
      return;
    }

    try {
      const summary = await importSceneCsv(file, activeScriptProjectId, projectVisualStyleId);
      if (summary.selectedLibraryId) {
        selectScene(summary.selectedLibraryId);
      }
      toast.success(t("scenes.csvImported", {
        created: summary.created,
        updated: summary.updated,
        unchanged: summary.unchanged,
        skipped: summary.skipped,
      }));
    } catch (error) {
      toast.error(t("scenes.csvImportFailed", {
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const handleExportCsv = () => {
    const csv = serializeSceneLibraryCsv(visibleScenes);
    downloadLibraryCsv(csv, `scenes-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t("scenes.csvExported", { count: visibleScenes.length }));
  };

  useEffect(() => {
    if (!activeScriptProjectId || !scriptProject?.scriptData?.scenes?.length) return;

    scriptProject.scriptData.scenes.forEach((scriptScene) => {
      const linkedEpisodeId = scriptProject.scriptData?.episodes.find((episode) =>
        episode.sceneIds.includes(scriptScene.id)
      )?.id;
      const latestScenes = useSceneStore.getState().scenes;
      const mappedSceneId = scriptScene.sceneLibraryId || scriptProject.sceneIdMap[scriptScene.id];
      let master = mappedSceneId ? latestScenes.find((scene) => scene.id === mappedSceneId) : undefined;

      if (!master) {
        master = latestScenes.find((scene) =>
          scene.projectId === activeScriptProjectId &&
          scene.sourceScriptSceneId === scriptScene.id
        );
      }

      if (!master) {
        const sceneName = (scriptScene.name || '').trim().toLocaleLowerCase();
        const nameMatches = latestScenes.filter((scene) =>
          scene.projectId === activeScriptProjectId &&
          scene.name.trim().toLocaleLowerCase() === sceneName
        );
        if (nameMatches.length === 1) master = nameMatches[0];
      }

      if (!master) {
        const masterId = addScene({
          name: scriptScene.name || t("scenes.untitled"),
          description: scriptScene.description || scriptScene.notes,
          time: 'day',
          atmosphere: 'neutral',
          aspectRatio: '16:9',
          projectId: activeScriptProjectId,
          scenePrompt: scriptScene.scenePrompt,
          styleId: projectVisualStyleId,
          status: "linked",
          linkedEpisodeId,
          sourceScriptSceneId: scriptScene.id,
        });
        master = useSceneStore.getState().scenes.find((scene) => scene.id === masterId);
        updateScriptScene(activeScriptProjectId, scriptScene.id, { sceneLibraryId: masterId });
      } else if (scriptScene.sceneLibraryId !== master.id) {
        updateScriptScene(activeScriptProjectId, scriptScene.id, { sceneLibraryId: master.id });
      }

      if (master) {
        const libraryUpdates: Partial<Scene> = {};
        if (!master.description?.trim() && scriptScene.description?.trim()) {
          libraryUpdates.description = scriptScene.description;
        }
        if (!master.scenePrompt && scriptScene.scenePrompt) {
          libraryUpdates.scenePrompt = scriptScene.scenePrompt;
        }
        if (!master.linkedEpisodeId && linkedEpisodeId) {
          libraryUpdates.linkedEpisodeId = linkedEpisodeId;
        }
        if (Object.keys(libraryUpdates).length > 0) {
          updateLibraryScene(master.id, libraryUpdates);
        }

        const scriptUpdates: Parameters<typeof updateScriptScene>[2] = {};
        if (!scriptScene.description?.trim() && master.description?.trim()) {
          scriptUpdates.description = master.description;
        }
        if (!scriptScene.scenePrompt?.trim() && master.scenePrompt?.trim()) {
          scriptUpdates.scenePrompt = master.scenePrompt;
        }
        if (Object.keys(scriptUpdates).length > 0) {
          updateScriptScene(activeScriptProjectId, scriptScene.id, scriptUpdates);
        }

        const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.sceneIdMap || {};
        if (latestMap[scriptScene.id] !== master.id) {
          setMappings(activeScriptProjectId, {
            sceneIdMap: { ...latestMap, [scriptScene.id]: master.id },
          });
        }
      }
    });
  }, [activeScriptProjectId, scriptProject, projectVisualStyleId, addScene, updateScriptScene, updateLibraryScene, setMappings, t]);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left column - Generation Console */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="overflow-hidden">
          <GenerationPanel 
            selectedScene={selectedScene}
            onSceneCreated={(id) => selectScene(id)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle column - Scene Gallery */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <SceneGallery
            onSceneSelect={handleSceneSelect}
            selectedSceneId={selectedSceneId}
            onImportCsv={handleImportCsv}
            onExportCsv={handleExportCsv}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right column - Scene Detail */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40} className="overflow-hidden">
          <SceneDetail scene={selectedScene} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
