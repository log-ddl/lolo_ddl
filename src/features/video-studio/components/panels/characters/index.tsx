"use client";

/**
 * Character Library View - Three Column Layout
 * Left: Generation Console
 * Middle: Character Gallery (folders + cards)
 * Right: Character Detail Panel
 */

import { useEffect, useMemo } from "react";
import { useCharacterLibraryStore, type Character } from "@/features/video-studio/stores/character-library-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useActiveScriptProject, useScriptStore } from "@/features/video-studio/stores/script-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import { GenerationPanel } from "./generation-panel";
import { CharacterGallery } from "./character-gallery";
import { CharacterDetail } from "./character-detail";
import { importCharacterCsv } from "@/features/video-studio/lib/library-csv-import";
import { downloadLibraryCsv, serializeCharacterLibraryCsv } from "@/features/video-studio/lib/library-csv";
import { useI18n } from "@/shared/i18n";
import { toast } from "sonner";
import { useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

export function CharactersView() {
  const { t } = useI18n();
  const { characters, selectedCharacterId, selectCharacter, addCharacter, updateCharacter: updateLibraryCharacter } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const activeScriptProjectId = useScriptStore((state) => state.activeProjectId);
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const updateScriptCharacter = useScriptStore((state) => state.updateCharacter);
  const setMappings = useScriptStore((state) => state.setMappings);

  const visibleCharacters = useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeScriptProjectId) return [];
    return characters.filter((c) => c.projectId === activeScriptProjectId);
  }, [characters, resourceSharing.shareCharacters, activeScriptProjectId]);

  const selectedCharacter = useMemo(
    () => visibleCharacters.find((c) => c.id === selectedCharacterId) || null,
    [visibleCharacters, selectedCharacterId]
  );

  const handleCharacterSelect = (char: Character | null) => {
    selectCharacter(char?.id || null);
  };

  const handleImportCsv = async (file: File) => {
    if (!activeScriptProjectId) {
      toast.error(t("characters.csvNeedsProject"));
      return;
    }

    try {
      const summary = await importCharacterCsv(file, activeScriptProjectId, projectVisualStyleId);
      if (summary.selectedLibraryId) {
        selectCharacter(summary.selectedLibraryId);
      }
      toast.success(t("characters.csvImported", {
        created: summary.created,
        updated: summary.updated,
        unchanged: summary.unchanged,
        skipped: summary.skipped,
      }));
    } catch (error) {
      toast.error(t("characters.csvImportFailed", {
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const handleExportCsv = () => {
    const csv = serializeCharacterLibraryCsv(visibleCharacters);
    downloadLibraryCsv(csv, `characters-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t("characters.csvExported", { count: visibleCharacters.length }));
  };

  useEffect(() => {
    if (!activeScriptProjectId || !scriptProject?.scriptData?.characters?.length) return;

    scriptProject.scriptData.characters.forEach((scriptChar) => {
      const latestCharacters = useCharacterLibraryStore.getState().characters;
      const mappedLibraryId = scriptProject.characterIdMap[scriptChar.id];

      if (mappedLibraryId) {
        const mappedCharacter = latestCharacters.find((c) => c.id === mappedLibraryId);
        if (mappedCharacter) {
          const libraryUpdates: Partial<Character> = {};
          if (!mappedCharacter.description?.trim() && scriptChar.appearance?.trim()) {
            libraryUpdates.description = scriptChar.appearance;
          }
          if (!mappedCharacter.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
            libraryUpdates.characterPrompt = scriptChar.characterPrompt;
          }
          if (Object.keys(libraryUpdates).length > 0) {
            updateLibraryCharacter(mappedCharacter.id, libraryUpdates);
          }
          const scriptUpdates: Partial<typeof scriptChar> = {};
          if (scriptChar.characterLibraryId !== mappedLibraryId) scriptUpdates.characterLibraryId = mappedLibraryId;
          if (!scriptChar.appearance?.trim() && mappedCharacter.description?.trim()) {
            scriptUpdates.appearance = mappedCharacter.description;
          }
          if (!scriptChar.characterPrompt?.trim() && mappedCharacter.characterPrompt?.trim()) {
            scriptUpdates.characterPrompt = mappedCharacter.characterPrompt;
          }
          if (Object.keys(scriptUpdates).length > 0) {
            updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
          }
          return;
        }

        updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: undefined });
        return;
      }

      if (scriptChar.characterLibraryId) {
        const linkedCharacter = latestCharacters.find((c) => c.id === scriptChar.characterLibraryId);
        if (linkedCharacter) {
          const libraryUpdates: Partial<Character> = {};
          if (!linkedCharacter.description?.trim() && scriptChar.appearance?.trim()) {
            libraryUpdates.description = scriptChar.appearance;
          }
          if (!linkedCharacter.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
            libraryUpdates.characterPrompt = scriptChar.characterPrompt;
          }
          if (Object.keys(libraryUpdates).length > 0) {
            updateLibraryCharacter(linkedCharacter.id, libraryUpdates);
          }
          const scriptUpdates: Partial<typeof scriptChar> = {};
          if (!scriptChar.appearance?.trim() && linkedCharacter.description?.trim()) {
            scriptUpdates.appearance = linkedCharacter.description;
          }
          if (!scriptChar.characterPrompt?.trim() && linkedCharacter.characterPrompt?.trim()) {
            scriptUpdates.characterPrompt = linkedCharacter.characterPrompt;
          }
          if (Object.keys(scriptUpdates).length > 0) {
            updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
          }
          const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
          setMappings(activeScriptProjectId, {
            characterIdMap: {
              ...latestMap,
              [scriptChar.id]: scriptChar.characterLibraryId,
            },
          });
          return;
        }
        updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: undefined });
      }

      const existingMatches = latestCharacters.filter((char) =>
        char.projectId === activeScriptProjectId &&
        char.name.trim().toLowerCase() === scriptChar.name.trim().toLowerCase()
      );
      if (existingMatches.length > 1) return;
      const existing = existingMatches[0];

      if (existing) {
        const libraryUpdates: Partial<Character> = {};
        if (!existing.description?.trim() && scriptChar.appearance?.trim()) {
          libraryUpdates.description = scriptChar.appearance;
        }
        if (!existing.characterPrompt?.trim() && scriptChar.characterPrompt?.trim()) {
          libraryUpdates.characterPrompt = scriptChar.characterPrompt;
        }
        if (Object.keys(libraryUpdates).length > 0) {
          updateLibraryCharacter(existing.id, libraryUpdates);
        }
        const scriptUpdates: Partial<typeof scriptChar> = { characterLibraryId: existing.id };
        if (!scriptChar.appearance?.trim() && existing.description?.trim()) {
          scriptUpdates.appearance = existing.description;
        }
        if (!scriptChar.characterPrompt?.trim() && existing.characterPrompt?.trim()) {
          scriptUpdates.characterPrompt = existing.characterPrompt;
        }
        updateScriptCharacter(activeScriptProjectId, scriptChar.id, scriptUpdates);
        const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
        setMappings(activeScriptProjectId, {
          characterIdMap: {
            ...latestMap,
            [scriptChar.id]: existing.id,
          },
        });
        return;
      }

      const newId = addCharacter({
        name: scriptChar.name,
        description: scriptChar.appearance || "",
        characterPrompt: scriptChar.characterPrompt || "",
        aspectRatio: '1:1',
        projectId: activeScriptProjectId,
        styleId: projectVisualStyleId,
        status: 'linked',
        linkedEpisodeId: undefined,
        thumbnailUrl: undefined,
      });

      updateScriptCharacter(activeScriptProjectId, scriptChar.id, { characterLibraryId: newId });
      const latestMap = useScriptStore.getState().projects[activeScriptProjectId]?.characterIdMap || {};
      setMappings(activeScriptProjectId, {
        characterIdMap: {
          ...latestMap,
          [scriptChar.id]: newId,
        },
      });
    });
  }, [activeScriptProjectId, scriptProject, projectVisualStyleId, addCharacter, updateScriptCharacter, setMappings, updateLibraryCharacter]);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left column - Generation Console */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <GenerationPanel 
            selectedCharacter={selectedCharacter}
            onCharacterCreated={(id) => selectCharacter(id)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle column - Character Gallery */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <CharacterGallery
            onCharacterSelect={handleCharacterSelect}
            selectedCharacterId={selectedCharacterId}
            onImportCsv={handleImportCsv}
            onExportCsv={handleExportCsv}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right column - Character Detail */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <CharacterDetail character={selectedCharacter} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
