import { r as reactExports } from "./lucide-react-DHCwBhKI.js";
import { u as useGoogleFlowRuntimeStore } from "./google-flow-runtime-store-S1TkgWH5.js";
import { g as getSourceFingerprint } from "./source-fingerprint-LXNjfvLD.js";
import { h as useCharacterLibraryStore, j as useScriptStore, f as useSceneStore } from "./autopilot-store-5JX3PjC8.js";
import { P as Papa } from "./auto-video-store-kYjrHdTY.js";
function getGoogleFlowSyncProgress(sources, mediaIdsBySource, scopes) {
  const uniqueSources = [...new Set(sources.filter((source) => Boolean(source)))];
  const total = uniqueSources.length * scopes.length;
  let synced = 0;
  for (const source of uniqueSources) {
    const byOwner = mediaIdsBySource?.[getSourceFingerprint(source)];
    for (const scope of scopes) {
      const stored = byOwner?.[scope.ownerScopeId];
      if (stored?.mediaId && scope.flowProjectId && stored.flowProjectId === scope.flowProjectId) {
        synced += 1;
      }
    }
  }
  return { synced, total, missing: total - synced };
}
function useGoogleFlowSyncScopes(projectId, enabled) {
  const status = useGoogleFlowRuntimeStore((state) => state.status);
  const [bindings, setBindings] = reactExports.useState([]);
  const credentialKey = (status?.credentials || []).map((credential) => `${credential.ownerScopeId}:${credential.credentialId}:${credential.state}`).sort().join("|");
  const refreshBindings = reactExports.useCallback(async () => {
    if (!window.googleFlowRuntime) {
      setBindings([]);
      return;
    }
    try {
      setBindings(await window.googleFlowRuntime.listProjectBindings(projectId));
    } catch (error) {
      console.warn("[GoogleFlow] Failed to load project bindings for sync status:", error);
      setBindings([]);
    }
  }, [enabled, projectId]);
  reactExports.useEffect(() => {
    void refreshBindings();
  }, [credentialKey, refreshBindings]);
  const scopes = reactExports.useMemo(() => {
    const activeBindingByOwner = new Map(
      bindings.filter((binding) => binding.active).map((binding) => [binding.ownerScopeId, binding])
    );
    const seenOwners = /* @__PURE__ */ new Set();
    return (status?.credentials || []).filter((credential) => credential.state === "ready").filter((credential) => {
      if (seenOwners.has(credential.ownerScopeId)) return false;
      seenOwners.add(credential.ownerScopeId);
      return true;
    }).map((credential) => ({
      ownerScopeId: credential.ownerScopeId,
      flowProjectId: activeBindingByOwner.get(credential.ownerScopeId)?.flowProjectId
    }));
  }, [bindings, enabled, status?.credentials]);
  return { scopes, refreshBindings };
}
function normalizeImageMatchName(value) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "");
}
function isSupportedImageFile(file) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(file.name);
}
function fileBaseName(filename) {
  return filename.replace(/\.[^.]+$/, "");
}
function matchImageFilesByName(files, items, getId, getName) {
  const itemsByName = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = normalizeImageMatchName(getName(item));
    if (!key) continue;
    const existing = itemsByName.get(key) || [];
    existing.push(item);
    itemsByName.set(key, existing);
  }
  const matches = [];
  const usedItemIds = /* @__PURE__ */ new Set();
  let unmatched = 0;
  let ambiguous = 0;
  for (const file of files) {
    const key = normalizeImageMatchName(fileBaseName(file.name));
    const candidates = itemsByName.get(key) || [];
    if (candidates.length === 0) {
      unmatched += 1;
      continue;
    }
    if (candidates.length !== 1 || usedItemIds.has(getId(candidates[0]))) {
      ambiguous += 1;
      continue;
    }
    usedItemIds.add(getId(candidates[0]));
    matches.push({ file, item: candidates[0] });
  }
  return { matches, unmatched, ambiguous };
}
async function normalizeReferenceSource(source) {
  if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("data:image/")) return source;
  if (!source.startsWith("local-image://")) return null;
  const result = await window.imageStorage?.readAsBase64(source);
  if (!result?.success || !result.base64) return null;
  return result.base64.startsWith("data:") ? result.base64 : `data:${result.mimeType || "image/jpeg"};base64,${result.base64}`;
}
async function syncGoogleFlowReferenceSources(projectId, rawSources, projectTitle) {
  if (!window.googleFlowRuntime) throw new Error("Google Flow chỉ hoạt động trong ứng dụng desktop.");
  const uniqueSources = /* @__PURE__ */ new Map();
  for (const item of rawSources) {
    if (!item.source) continue;
    const sourceKey = getSourceFingerprint(item.source);
    if (!sourceKey) continue;
    const existing = uniqueSources.get(sourceKey);
    uniqueSources.set(sourceKey, {
      source: item.source,
      mediaIdsByOwnerScope: { ...existing?.mediaIdsByOwnerScope || {}, ...item.mediaIdsByOwnerScope || {} }
    });
  }
  const sources = [];
  for (const [sourceKey, item] of uniqueSources) {
    const source = await normalizeReferenceSource(item.source);
    if (source) sources.push({ sourceKey, source, mediaIdsByOwnerScope: item.mediaIdsByOwnerScope });
  }
  if (!sources.length) throw new Error("Không có ảnh tham chiếu hợp lệ để đồng bộ.");
  return window.googleFlowRuntime.syncReferences({ projectId: projectId || "default-project", projectTitle, sources });
}
const COMMON_ID_HEADERS = ["id", "ma"];
const COMMON_NAME_HEADERS = ["name", "ten"];
const COMMON_DESCRIPTION_HEADERS = ["description", "mo_ta"];
const CHARACTER_HEADERS = {
  id: [...COMMON_ID_HEADERS, "character_id", "characterid"],
  name: [...COMMON_NAME_HEADERS, "character_name", "ten_nhan_vat"],
  description: [
    ...COMMON_DESCRIPTION_HEADERS,
    "appearance",
    "character_description",
    "mo_ta_nhan_vat"
  ],
  prompt: ["character_prompt", "characterprompt", "prompt", "prompt_nhan_vat"]
};
const SCENE_HEADERS = {
  id: [...COMMON_ID_HEADERS, "scene_id", "sceneid"],
  name: [...COMMON_NAME_HEADERS, "scene_name", "ten_canh"],
  description: [
    ...COMMON_DESCRIPTION_HEADERS,
    "scene_description",
    "mo_ta_canh",
    "notes"
  ],
  prompt: ["scene_prompt", "sceneprompt", "prompt", "prompt_canh"],
  location: ["location", "dia_diem", "setting"]
};
function normalizeCsvHeader(value) {
  return value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
}
function normalizeLibraryName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function readFirst(row, headers) {
  for (const header of headers) {
    const value = row[header]?.trim();
    if (value) return value;
  }
  return "";
}
function parseLibraryCsvText(text, kind) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeCsvHeader
  });
  const headers = kind === "character" ? CHARACTER_HEADERS : SCENE_HEADERS;
  const rows = parsed.data.map((row, index) => {
    const sceneHeaders = kind === "scene" ? SCENE_HEADERS : null;
    return {
      rowNumber: index + 2,
      id: readFirst(row, headers.id),
      name: readFirst(row, headers.name),
      description: readFirst(row, headers.description),
      prompt: readFirst(row, headers.prompt),
      location: sceneHeaders ? readFirst(row, sceneHeaders.location) : ""
    };
  }).filter((row) => row.id || row.name || row.description || row.prompt || row.location);
  return {
    rows,
    errors: parsed.errors.map((error) => {
      const row = typeof error.row === "number" ? ` (row ${error.row + 2})` : "";
      return `${error.message}${row}`;
    })
  };
}
async function parseLibraryCsv(file, kind) {
  return parseLibraryCsvText(await file.text(), kind);
}
function serializeCharacterLibraryCsv(characters) {
  return Papa.unparse({
    fields: ["id", "name", "description", "character_prompt"],
    data: characters.map((character) => [
      character.id,
      character.name,
      character.description || "",
      character.characterPrompt || ""
    ])
  });
}
function serializeSceneLibraryCsv(scenes) {
  return Papa.unparse({
    fields: ["id", "name", "description", "scene_prompt"],
    data: scenes.map((scene) => [
      scene.id,
      scene.name,
      scene.description || "",
      scene.scenePrompt || ""
    ])
  });
}
function downloadLibraryCsv(csv, filename) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function isBlank(value) {
  return !value?.trim();
}
function newEntityId(prefix) {
  return `${prefix}_csv_${crypto.randomUUID()}`;
}
function ensureScriptData(projectId, needsEpisode) {
  const scriptStore = useScriptStore.getState();
  scriptStore.ensureProject(projectId);
  const current = useScriptStore.getState().projects[projectId]?.scriptData;
  if (!current) {
    const data = {
      title: "Untitled",
      language: "English",
      characters: [],
      scenes: [],
      episodes: needsEpisode ? [{ id: "ep_1", index: 1, title: "Episode 1", sceneIds: [] }] : [],
      storyParagraphs: []
    };
    scriptStore.setScriptData(projectId, data);
    return data;
  }
  if (needsEpisode && current.episodes.length === 0) {
    const data = {
      ...current,
      episodes: [{ id: "ep_1", index: 1, title: "Episode 1", sceneIds: [] }]
    };
    scriptStore.setScriptData(projectId, data);
    return data;
  }
  return current;
}
function chooseScopedMatch(matches, projectId) {
  const projectMatches = matches.filter((item) => item.projectId === projectId);
  if (projectMatches.length > 1) return null;
  if (projectMatches.length === 1) return projectMatches[0];
  const sharedMatches = matches.filter((item) => !item.projectId);
  if (sharedMatches.length > 1) return null;
  return sharedMatches[0];
}
function isInLibraryScope(item, projectId) {
  return item.projectId === projectId || !item.projectId;
}
function findCharacterTargets(row, projectId) {
  const libraryState = useCharacterLibraryStore.getState();
  const scriptProject = useScriptStore.getState().projects[projectId];
  const scriptCharacters = scriptProject?.scriptData?.characters || [];
  let library = row.id ? libraryState.characters.find((item) => item.id === row.id && isInLibraryScope(item, projectId)) : void 0;
  let script = row.id ? scriptCharacters.find((item) => item.id === row.id) : void 0;
  const hasDirectIdTarget = Boolean(row.id && (library || script));
  if (script && !library) {
    const linkedId = script.characterLibraryId || scriptProject?.characterIdMap[script.id];
    library = linkedId ? libraryState.characters.find((item) => item.id === linkedId && isInLibraryScope(item, projectId)) : void 0;
  }
  if (library && !script) {
    script = scriptCharacters.find(
      (item) => item.characterLibraryId === library?.id || scriptProject?.characterIdMap[item.id] === library?.id
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
function findSceneTargets(row, projectId) {
  const libraryState = useSceneStore.getState();
  const scriptProject = useScriptStore.getState().projects[projectId];
  const scriptScenes = scriptProject?.scriptData?.scenes || [];
  let library = row.id ? libraryState.scenes.find((item) => item.id === row.id && isInLibraryScope(item, projectId)) : void 0;
  let script = row.id ? scriptScenes.find((item) => item.id === row.id) : void 0;
  const hasDirectIdTarget = Boolean(row.id && (library || script));
  if (script && !library) {
    const linkedId = script.sceneLibraryId || scriptProject?.sceneIdMap[script.id];
    library = linkedId ? libraryState.scenes.find((item) => item.id === linkedId && isInLibraryScope(item, projectId)) : void 0;
  }
  if (library && !script) {
    script = scriptScenes.find(
      (item) => item.sceneLibraryId === library?.id || item.id === library?.sourceScriptSceneId || scriptProject?.sceneIdMap[item.id] === library?.id
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
      const scriptMatches = scriptScenes.filter(
        (item) => normalizeLibraryName(item.name || "") === key
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
async function importCharacterCsv(file, projectId, styleId) {
  const parsed = await parseLibraryCsv(file, "character");
  ensureScriptData(projectId, false);
  const summary = { created: 0, updated: 0, unchanged: 0, skipped: parsed.errors.length };
  for (const row of parsed.rows) {
    let { library, script, ambiguous } = findCharacterTargets(row, projectId);
    if (ambiguous || !library && !script && !row.name) {
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
        status: "linked"
      });
      library = useCharacterLibraryStore.getState().characters.find((item) => item.id === id);
      rowCreated = true;
    } else {
      const updates = {};
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
        characterPrompt: row.prompt || library?.characterPrompt || void 0,
        characterLibraryId: library?.id
      };
      useScriptStore.getState().addCharacter(projectId, script);
      rowCreated = true;
    } else {
      const updates = {};
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
          characterIdMap: { ...project.characterIdMap, [script.id]: library.id }
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
async function importSceneCsv(file, projectId, styleId) {
  const parsed = await parseLibraryCsv(file, "scene");
  ensureScriptData(projectId, true);
  const summary = { created: 0, updated: 0, unchanged: 0, skipped: parsed.errors.length };
  for (const row of parsed.rows) {
    let { library, script, ambiguous } = findSceneTargets(row, projectId);
    if (ambiguous || !library && !script && !row.name) {
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
        sourceScriptSceneId: script?.id
      });
      library = useSceneStore.getState().scenes.find((item) => item.id === id);
      rowCreated = true;
    } else {
      const updates = {};
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
        sceneLibraryId: library?.id
      };
      useScriptStore.getState().addScene(projectId, script);
      rowCreated = true;
    } else {
      const updates = {};
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
      const libraryUpdates = {};
      if (library.sourceScriptSceneId !== script.id) libraryUpdates.sourceScriptSceneId = script.id;
      const episodeId = useScriptStore.getState().projects[projectId]?.scriptData?.episodes.find(
        (episode) => episode.sceneIds.includes(script.id)
      )?.id;
      if (!library.linkedEpisodeId && episodeId) libraryUpdates.linkedEpisodeId = episodeId;
      if (Object.keys(libraryUpdates).length > 0) {
        useSceneStore.getState().updateScene(library.id, libraryUpdates);
        rowUpdated = true;
      }
      const project = useScriptStore.getState().projects[projectId];
      if (project.sceneIdMap[script.id] !== library.id) {
        useScriptStore.getState().setMappings(projectId, {
          sceneIdMap: { ...project.sceneIdMap, [script.id]: library.id }
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
export {
  serializeCharacterLibraryCsv as a,
  importCharacterCsv as b,
  serializeSceneLibraryCsv as c,
  downloadLibraryCsv as d,
  importSceneCsv as e,
  getGoogleFlowSyncProgress as g,
  isSupportedImageFile as i,
  matchImageFilesByName as m,
  syncGoogleFlowReferenceSources as s,
  useGoogleFlowSyncScopes as u
};
