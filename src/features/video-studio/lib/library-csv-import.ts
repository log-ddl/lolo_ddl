import { useCharacterLibraryStore, type Character } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore, type Scene } from "@/features/video-studio/stores/scene-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import type { ScriptCharacter, ScriptData, ScriptScene } from "@/features/video-studio/types/script";
import { normalizeLibraryName, parseLibraryCsv, type LibraryCsvRow } from "@/features/video-studio/lib/library-csv";

export interface CsvImportSummary {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  selectedLibraryId?: string;
}

function isBlank(value: string | undefined): boolean {
  return !value?.trim();
}

function newEntityId(prefix: string): string {
  return `${prefix}_csv_${crypto.randomUUID()}`;
}

function ensureScriptData(projectId: string, needsEpisode: boolean): ScriptData {
  const scriptStore = useScriptStore.getState();
  scriptStore.ensureProject(projectId);
  const current = useScriptStore.getState().projects[projectId]?.scriptData;

  if (!current) {
    const data: ScriptData = {
      title: "Untitled",
      language: "English",
      characters: [],
      scenes: [],
      episodes: needsEpisode
        ? [{ id: "ep_1", index: 1, title: "Episode 1", sceneIds: [] }]
        : [],
      storyParagraphs: [],
    };
    scriptStore.setScriptData(projectId, data);
    return data;
  }

  if (needsEpisode && current.episodes.length === 0) {
    const data = {
      ...current,
      episodes: [{ id: "ep_1", index: 1, title: "Episode 1", sceneIds: [] }],
    };
    scriptStore.setScriptData(projectId, data);
    return data;
  }

  return current;
}

function chooseScopedMatch<T extends { projectId?: string }>(matches: T[], projectId: string): T | undefined | null {
  const projectMatches = matches.filter((item) => item.projectId === projectId);
  if (projectMatches.length > 1) return null;
  if (projectMatches.length === 1) return projectMatches[0];

  const sharedMatches = matches.filter((item) => !item.projectId);
  if (sharedMatches.length > 1) return null;
  return sharedMatches[0];
}

function isInLibraryScope(item: { projectId?: string }, projectId: string): boolean {
  return item.projectId === projectId || !item.projectId;
}

function findCharacterTargets(row: LibraryCsvRow, projectId: string): {
  library?: Character;
  script?: ScriptCharacter;
  ambiguous: boolean;
} {
  const libraryState = useCharacterLibraryStore.getState();
  const scriptProject = useScriptStore.getState().projects[projectId];
  const scriptCharacters = scriptProject?.scriptData?.characters || [];
  let library = row.id
    ? libraryState.characters.find((item) => item.id === row.id && isInLibraryScope(item, projectId))
    : undefined;
  let script = row.id ? scriptCharacters.find((item) => item.id === row.id) : undefined;
  const hasDirectIdTarget = Boolean(row.id && (library || script));

  if (script && !library) {
    const linkedId = script.characterLibraryId || scriptProject?.characterIdMap[script.id];
    library = linkedId
      ? libraryState.characters.find((item) => item.id === linkedId && isInLibraryScope(item, projectId))
      : undefined;
  }

  if (library && !script) {
    script = scriptCharacters.find((item) =>
      item.characterLibraryId === library?.id || scriptProject?.characterIdMap[item.id] === library?.id
    );
  }

  if (row.name && (!library || !script)) {
    const key = normalizeLibraryName(row.name);
    if (!library) {
      const libraryMatch = chooseScopedMatch(
        libraryState.characters.filter((item) => normalizeLibraryName(item.name) === key),
        projectId
      );
      if (libraryMatch === null) {
        if (!hasDirectIdTarget) return { ambiguous: true };
      } else {
        library = libraryMatch;
      }
    }
    if (!script) {
      const scriptMatches = scriptCharacters.filter((item) => normalizeLibraryName(item.name) === key);
      if (scriptMatches.length > 1) {
        if (!hasDirectIdTarget) return { ambiguous: true };
      } else {
        script = scriptMatches[0];
      }
    }
  }

  return { library, script, ambiguous: false };
}

function findSceneTargets(row: LibraryCsvRow, projectId: string): {
  library?: Scene;
  script?: ScriptScene;
  ambiguous: boolean;
} {
  const libraryState = useSceneStore.getState();
  const scriptProject = useScriptStore.getState().projects[projectId];
  const scriptScenes = scriptProject?.scriptData?.scenes || [];
  let library = row.id
    ? libraryState.scenes.find((item) => item.id === row.id && isInLibraryScope(item, projectId))
    : undefined;
  let script = row.id ? scriptScenes.find((item) => item.id === row.id) : undefined;
  const hasDirectIdTarget = Boolean(row.id && (library || script));

  if (script && !library) {
    const linkedId = script.sceneLibraryId || scriptProject?.sceneIdMap[script.id];
    library = linkedId
      ? libraryState.scenes.find((item) => item.id === linkedId && isInLibraryScope(item, projectId))
      : undefined;
  }

  if (library && !script) {
    script = scriptScenes.find((item) =>
      item.sceneLibraryId === library?.id ||
      item.id === library?.sourceScriptSceneId ||
      scriptProject?.sceneIdMap[item.id] === library?.id
    );
  }

  if (row.name && (!library || !script)) {
    const key = normalizeLibraryName(row.name);
    if (!library) {
      const libraryMatch = chooseScopedMatch(
        libraryState.scenes.filter((item) => normalizeLibraryName(item.name) === key),
        projectId
      );
      if (libraryMatch === null) {
        if (!hasDirectIdTarget) return { ambiguous: true };
      } else {
        library = libraryMatch;
      }
    }
    if (!script) {
      const scriptMatches = scriptScenes.filter((item) =>
        normalizeLibraryName(item.name || "") === key
      );
      if (scriptMatches.length > 1) {
        if (!hasDirectIdTarget) return { ambiguous: true };
      } else {
        script = scriptMatches[0];
      }
    }
  }

  return { library, script, ambiguous: false };
}

export async function importCharacterCsv(
  file: File,
  projectId: string,
  styleId?: string
): Promise<CsvImportSummary> {
  const parsed = await parseLibraryCsv(file, "character");
  ensureScriptData(projectId, false);
  const summary: CsvImportSummary = { created: 0, updated: 0, unchanged: 0, skipped: parsed.errors.length };

  for (const row of parsed.rows) {
    let { library, script, ambiguous } = findCharacterTargets(row, projectId);
    if (ambiguous || ((!library && !script) && !row.name)) {
      summary.skipped += 1;
      continue;
    }

    let rowCreated = false;
    let rowUpdated = false;

    if (!library) {
      const name = row.name || script?.name || "";
      if (!name) {
        summary.skipped += 1;
        continue;
      }
      const id = useCharacterLibraryStore.getState().addCharacter({
        name,
        description: row.description || script?.appearance,
        characterPrompt: row.prompt || script?.characterPrompt || "",
        aspectRatio: "1:1",
        projectId,
        styleId,
        status: "linked",
      });
      library = useCharacterLibraryStore.getState().characters.find((item) => item.id === id);
      rowCreated = true;
    } else {
      const updates: Partial<Character> = {};
      if (isBlank(library.name) && row.name) updates.name = row.name;
      if (isBlank(library.description) && row.description) updates.description = row.description;
      if (isBlank(library.characterPrompt) && row.prompt) updates.characterPrompt = row.prompt;
      if (Object.keys(updates).length > 0) {
        useCharacterLibraryStore.getState().updateCharacter(library.id, updates);
        library = { ...library, ...updates };
        rowUpdated = true;
      }
    }

    if (!script) {
      const currentScriptCharacters = useScriptStore.getState().projects[projectId]?.scriptData?.characters || [];
      const requestedId = row.id && !currentScriptCharacters.some((item) => item.id === row.id) ? row.id : "";
      script = {
        id: requestedId || newEntityId("char"),
        name: row.name || library?.name || "",
        appearance: row.description || library?.description,
        characterPrompt: row.prompt || library?.characterPrompt || undefined,
        characterLibraryId: library?.id,
      };
      useScriptStore.getState().addCharacter(projectId, script);
      rowCreated = true;
    } else {
      const updates: Partial<ScriptCharacter> = {};
      if (isBlank(script.name) && row.name) updates.name = row.name;
      if (isBlank(script.appearance) && row.description) updates.appearance = row.description;
      if (isBlank(script.characterPrompt) && row.prompt) updates.characterPrompt = row.prompt;
      if (library && script.characterLibraryId !== library.id) updates.characterLibraryId = library.id;
      if (Object.keys(updates).length > 0) {
        useScriptStore.getState().updateCharacter(projectId, script.id, updates);
        script = { ...script, ...updates };
        rowUpdated = true;
      }
    }

    if (library && script) {
      const project = useScriptStore.getState().projects[projectId];
      if (project.characterIdMap[script.id] !== library.id) {
        useScriptStore.getState().setMappings(projectId, {
          characterIdMap: { ...project.characterIdMap, [script.id]: library.id },
        });
        rowUpdated = true;
      }
    }

    if (!summary.selectedLibraryId && library) {
      summary.selectedLibraryId = library.id;
    }

    if (rowCreated) summary.created += 1;
    else if (rowUpdated) summary.updated += 1;
    else summary.unchanged += 1;
  }

  return summary;
}

export async function importSceneCsv(
  file: File,
  projectId: string,
  styleId?: string
): Promise<CsvImportSummary> {
  const parsed = await parseLibraryCsv(file, "scene");
  ensureScriptData(projectId, true);
  const summary: CsvImportSummary = { created: 0, updated: 0, unchanged: 0, skipped: parsed.errors.length };

  for (const row of parsed.rows) {
    let { library, script, ambiguous } = findSceneTargets(row, projectId);
    if (ambiguous || ((!library && !script) && !row.name)) {
      summary.skipped += 1;
      continue;
    }

    let rowCreated = false;
    let rowUpdated = false;

    if (!library) {
      const name = row.name || script?.name || row.location || "";
      if (!name) {
        summary.skipped += 1;
        continue;
      }
      const id = useSceneStore.getState().addScene({
        name,
        description: row.description || script?.description || row.location,
        time: script?.time || "day",
        atmosphere: script?.atmosphere || "neutral",
        aspectRatio: "16:9",
        projectId,
        scenePrompt: row.prompt || script?.scenePrompt,
        styleId,
        status: "linked",
        sourceScriptSceneId: script?.id,
      });
      library = useSceneStore.getState().scenes.find((item) => item.id === id);
      rowCreated = true;
    } else {
      const updates: Partial<Scene> = {};
      if (isBlank(library.name) && row.name) updates.name = row.name;
      if (isBlank(library.description) && (row.description || row.location)) {
        updates.description = row.description || row.location;
      }
      if (isBlank(library.scenePrompt) && row.prompt) updates.scenePrompt = row.prompt;
      if (Object.keys(updates).length > 0) {
        useSceneStore.getState().updateScene(library.id, updates);
        library = { ...library, ...updates };
        rowUpdated = true;
      }
    }

    if (!script) {
      const currentScriptScenes = useScriptStore.getState().projects[projectId]?.scriptData?.scenes || [];
      const requestedId = row.id && !currentScriptScenes.some((item) => item.id === row.id) ? row.id : "";
      script = {
        id: requestedId || newEntityId("scene"),
        name: row.name || library?.name || row.location,
        description: row.description || library?.description || row.location,
        time: library?.time || "day",
        atmosphere: library?.atmosphere || "neutral",
        scenePrompt: row.prompt || library?.scenePrompt,
        sceneLibraryId: library?.id,
      };
      useScriptStore.getState().addScene(projectId, script);
      rowCreated = true;
    } else {
      const updates: Partial<ScriptScene> = {};
      if (isBlank(script.name) && row.name) updates.name = row.name;
      if (isBlank(script.description) && (row.description || row.location)) {
        updates.description = row.description || row.location;
      }
      if (isBlank(script.scenePrompt) && row.prompt) updates.scenePrompt = row.prompt;
      if (library && script.sceneLibraryId !== library.id) updates.sceneLibraryId = library.id;
      if (Object.keys(updates).length > 0) {
        useScriptStore.getState().updateScene(projectId, script.id, updates);
        script = { ...script, ...updates };
        rowUpdated = true;
      }
    }

    if (library && script) {
      const libraryUpdates: Partial<Scene> = {};
      if (library.sourceScriptSceneId !== script.id) libraryUpdates.sourceScriptSceneId = script.id;
      const episodeId = useScriptStore.getState().projects[projectId]?.scriptData?.episodes.find((episode) =>
        episode.sceneIds.includes(script!.id)
      )?.id;
      if (!library.linkedEpisodeId && episodeId) libraryUpdates.linkedEpisodeId = episodeId;
      if (Object.keys(libraryUpdates).length > 0) {
        useSceneStore.getState().updateScene(library.id, libraryUpdates);
        rowUpdated = true;
      }

      const project = useScriptStore.getState().projects[projectId];
      if (project.sceneIdMap[script.id] !== library.id) {
        useScriptStore.getState().setMappings(projectId, {
          sceneIdMap: { ...project.sceneIdMap, [script.id]: library.id },
        });
        rowUpdated = true;
      }
    }

    if (!summary.selectedLibraryId && library) {
      summary.selectedLibraryId = library.id;
    }

    if (rowCreated) summary.created += 1;
    else if (rowUpdated) summary.updated += 1;
    else summary.unchanged += 1;
  }

  return summary;
}
