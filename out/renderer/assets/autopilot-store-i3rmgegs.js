import { a as useProjectStore, s as splitVideoPromptVoiceOver, c as cleanVoiceOverText, m as mergeVideoPromptVoiceOver, u as useAutoVideoStore, p as parseSrt } from "./auto-video-store-Cd8fXBc8.js";
import { f as fileStorage, l as debugLog, b as useVideoStudioSettingsStore, p as persist, d as createJSONStorage, m as migrateFromLocalStorage, g as generateUUID, n as isCliProvider, r as runCliTextCompletion, o as isCliFeatureEnabled, q as getCliProviderPlatform, u as useLicenseStore, h as hasPlanAccess } from "./index-ld1jMZXM.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { c as corsFetch } from "./cors-fetch-CkwbEcad.js";
import { t as taskMetadata, a as getTtsModel, g as getCapCutVoice } from "./model-registry-C5c6bagc.js";
import "./radix-ui-G3HX32g5.js";
import "./lucide-react-DHCwBhKI.js";
function getActiveProjectId() {
  try {
    const state = useProjectStore.getState();
    return state.activeProjectId || state.projects[0]?.id || null;
  } catch {
    return null;
  }
}
function getResourceSharing() {
  try {
    return useVideoStudioSettingsStore.getState().resourceSharing;
  } catch {
    return { shareCharacters: false, shareScenes: false, shareMedia: false };
  }
}
function getAllProjectIds() {
  try {
    return useProjectStore.getState().projects.map((p) => p.id);
  } catch {
    return [];
  }
}
function createProjectScopedStorage(storeName) {
  return {
    getItem: async (name) => {
      if (!useProjectStore.persist.hasHydrated()) {
        await new Promise((resolve) => {
          const unsub = useProjectStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }
      const pid = getActiveProjectId();
      if (!pid) {
        console.warn(`[ProjectStorage] No activeProjectId, falling back to legacy key: ${name}`);
        return fileStorage.getItem(name);
      }
      const projectKey = `_p/${pid}/${storeName}`;
      const projectData = await fileStorage.getItem(projectKey);
      if (projectData) {
        console.log(`[ProjectStorage] Loaded ${storeName} for project ${pid.substring(0, 8)}`);
        return projectData;
      }
      console.log(`[ProjectStorage] Project file not found for ${storeName}, trying legacy key: ${name}`);
      return fileStorage.getItem(name);
    },
    setItem: async (name, value) => {
      let dataProjectId = null;
      try {
        const parsed = JSON.parse(value);
        const state = parsed?.state ?? parsed;
        if (state && typeof state === "object" && typeof state.activeProjectId === "string") {
          dataProjectId = state.activeProjectId;
        }
      } catch {
      }
      const pid = dataProjectId || getActiveProjectId();
      if (!pid) {
        await fileStorage.setItem(name, value);
        return;
      }
      const routerPid = getActiveProjectId();
      if (dataProjectId && routerPid && dataProjectId !== routerPid) {
        console.warn(
          `[ProjectStorage] Routing mismatch for ${storeName}: data.pid=${dataProjectId.substring(0, 8)}, router.pid=${routerPid.substring(0, 8)}. Using data.pid to prevent cross-project overwrite.`
        );
      }
      const projectKey = `_p/${pid}/${storeName}`;
      debugLog("storage", `[ProjectStorage] Saving ${storeName} for project ${pid.substring(0, 8)} (${Math.round(value.length / 1024)}KB)`);
      await fileStorage.setItem(projectKey, value);
    },
    removeItem: async (name) => {
      const pid = getActiveProjectId();
      if (!pid) {
        await fileStorage.removeItem(name);
        return;
      }
      const projectKey = `_p/${pid}/${storeName}`;
      await fileStorage.removeItem(projectKey);
    }
  };
}
function createSplitStorage(storeName, splitFn, mergeFn, sharingKey, alwaysMergeShared = false) {
  return {
    getItem: async (name) => {
      if (!useProjectStore.persist.hasHydrated()) {
        await new Promise((resolve) => {
          const unsub = useProjectStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }
      const pid = getActiveProjectId();
      if (!pid) {
        console.warn(`[SplitStorage] No activeProjectId, falling back to legacy key: ${name}`);
        return fileStorage.getItem(name);
      }
      const projectKey = `_p/${pid}/${storeName}`;
      const sharedKey = `_shared/${storeName}`;
      const projectRaw = await fileStorage.getItem(projectKey);
      if (!projectRaw) {
        console.log(`[SplitStorage] Project file not found for ${storeName}, trying legacy key: ${name}`);
        return fileStorage.getItem(name);
      }
      let sharingEnabled = false;
      if (sharingKey) {
        const sharing = getResourceSharing();
        sharingEnabled = sharing[sharingKey];
      }
      try {
        const projectState = JSON.parse(projectRaw);
        const projectPayload = projectState?.state ?? projectState;
        let sharedPayload = null;
        if (sharingEnabled || alwaysMergeShared) {
          try {
            const sharedRaw = await fileStorage.getItem(sharedKey);
            if (sharedRaw) {
              const sharedParsed = JSON.parse(sharedRaw);
              sharedPayload = sharedParsed?.state ?? sharedParsed;
            }
          } catch {
          }
        }
        if (sharingEnabled) {
          const allPids = getAllProjectIds();
          const otherPayloads = [];
          for (const otherPid of allPids) {
            if (otherPid === pid) continue;
            const otherKey = `_p/${otherPid}/${storeName}`;
            try {
              const otherRaw = await fileStorage.getItem(otherKey);
              if (otherRaw) {
                const otherParsed = JSON.parse(otherRaw);
                otherPayloads.push(otherParsed?.state ?? otherParsed);
              }
            } catch {
            }
          }
          let merged = mergeFn(null, sharedPayload);
          for (const pd of otherPayloads) {
            merged = mergeFn(pd, merged);
          }
          merged = mergeFn(projectPayload, merged);
          console.log(`[SplitStorage] Loaded ${storeName}: ${allPids.length} projects merged (sharing ON)`);
          return JSON.stringify({
            state: merged,
            version: projectState?.version ?? 0
          });
        } else {
          console.log(`[SplitStorage] Loaded ${storeName}: project-only for ${pid.substring(0, 8)} (sharing OFF)`);
          const state = alwaysMergeShared ? mergeFn(projectPayload, sharedPayload) : projectPayload;
          return JSON.stringify({
            state,
            version: projectState?.version ?? 0
          });
        }
      } catch (error) {
        console.error(`[SplitStorage] Failed to parse/merge ${storeName}:`, error);
        return projectRaw;
      }
    },
    setItem: async (name, value) => {
      const pid = getActiveProjectId();
      if (!pid) {
        await fileStorage.setItem(name, value);
        return;
      }
      try {
        const parsed = JSON.parse(value);
        const state = parsed.state ?? parsed;
        const version = parsed.version ?? 0;
        const knownProjectIds = new Set(getAllProjectIds());
        const allPids = /* @__PURE__ */ new Set([pid]);
        for (const val of Object.values(state)) {
          if (Array.isArray(val)) {
            for (const item of val) {
              if (item && typeof item === "object" && "projectId" in item && typeof item.projectId === "string" && knownProjectIds.has(item.projectId)) {
                allPids.add(item.projectId);
              }
            }
          }
        }
        for (const projectId of allPids) {
          const { projectData } = splitFn(state, projectId);
          const key = `_p/${projectId}/${storeName}`;
          const payload = JSON.stringify({ state: projectData, version });
          await fileStorage.setItem(key, payload);
        }
        const { sharedData } = splitFn(state, pid);
        const sharedKey = `_shared/${storeName}`;
        const sharedPayload = JSON.stringify({ state: sharedData, version });
        await fileStorage.setItem(sharedKey, sharedPayload);
        debugLog("storage", `[SplitStorage] Saved ${storeName} to ${allPids.size} project(s) + shared`);
      } catch (error) {
        console.error(`[SplitStorage] Failed to split ${storeName}, saving to legacy:`, error);
        await fileStorage.setItem(name, value);
      }
    },
    removeItem: async (name) => {
      const pid = getActiveProjectId();
      if (!pid) {
        await fileStorage.removeItem(name);
        return;
      }
      const projectKey = `_p/${pid}/${storeName}`;
      await fileStorage.removeItem(projectKey);
    }
  };
}
const defaultCalibrationState = () => ({
  titleCalibrationStatus: "idle",
  characterCalibrationStatus: "idle",
  sceneCalibrationStatus: "idle",
  structureCompletionStatus: "idle",
  singleShotCalibrationStatus: {},
  calibrationDialogOpen: false,
  pendingCalibrationCharacters: null,
  pendingFilteredCharacters: [],
  pendingCharacterIdRemap: {},
  importStatus: "idle",
  synopsisStatus: "idle"
});
const defaultProjectData$1 = () => ({
  rawScript: "",
  language: "English",
  targetDuration: "60s",
  styleId: "2d_ghibli",
  sceneCount: void 0,
  shotCount: void 0,
  scriptData: null,
  parseStatus: "idle",
  parseError: void 0,
  shots: [],
  shotStatus: "idle",
  shotError: void 0,
  batchProgress: null,
  characterIdMap: {},
  sceneIdMap: {},
  updatedAt: Date.now(),
  // Additional default values
  episodeRawScripts: [],
  metadataMarkdown: "",
  metadataGeneratedAt: void 0,
  calibrationStrictness: "normal",
  lastFilteredCharacters: [],
  calibrationState: defaultCalibrationState(),
  seriesMeta: null,
  videoGenerationMode: "image-to-video",
  longScriptImportCheckpoint: null
});
function normalizeVideoLength(value) {
  const numeric = typeof value === "string" ? Number(value.replace(/[^0-9]/g, "")) : Number(value);
  return numeric === 6 || numeric === 8 ? numeric : 4;
}
function normalizeRefImageIndexes(value) {
  const source = value == null || value === "" ? [] : Array.isArray(value) ? value : [value];
  const seen = /* @__PURE__ */ new Set();
  for (const item of source) {
    let raw = item;
    if (item && typeof item === "object") {
      const record = item;
      raw = record.shotIndex ?? record.shot_index ?? record.shot ?? record.index ?? record.sourceShotIndex ?? record.source_shot_index;
    }
    const numbers = typeof raw === "number" ? [raw] : Array.from(String(raw ?? "").matchAll(/\d+/g)).map((match) => Number(match[0]));
    for (const numeric of numbers) {
      if (Number.isInteger(numeric) && numeric > 0) {
        seen.add(numeric);
      }
    }
  }
  return Array.from(seen);
}
const pendingCharacterRecoveryProjectIds = /* @__PURE__ */ new Set();
const cloneScriptCharacters = (characters) => {
  if (!Array.isArray(characters) || characters.length === 0) {
    return [];
  }
  return characters.filter((character) => Boolean(character?.name)).map((character, index) => ({
    ...character,
    id: character.id || `char_recovered_${index + 1}`,
    name: character.name.trim()
  }));
};
const normalizeShotVoiceFields = (shot) => {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  const voiceOver = cleanVoiceOverText(shot.voiceOver) || parts.voiceOver;
  return {
    ...shot,
    videoPrompt: parts.videoPrompt,
    voiceOver,
    ref_image: normalizeRefImageIndexes(shot.ref_image ?? shot.refImage)
  };
};
const normalizeScriptScene = (scene) => {
  const legacyScenePrompt = scene["visualPrompt"];
  const {
    ["visualPrompt"]: _discard,
    location: legacyLocation,
    ...cleanScene
  } = scene;
  return {
    ...cleanScene,
    name: cleanScene.name?.trim() || legacyLocation?.trim() || void 0,
    description: cleanScene.description || cleanScene.notes || legacyLocation || cleanScene.name,
    scenePrompt: scene.scenePrompt || legacyScenePrompt
  };
};
const normalizeScriptProjectData = (projectId, projectData) => {
  const defaults = defaultProjectData$1();
  const defaultCalibration = defaultCalibrationState();
  const normalizedProject = {
    ...defaults,
    ...projectData,
    calibrationState: {
      ...defaultCalibration,
      ...projectData?.calibrationState || {},
      singleShotCalibrationStatus: {
        ...defaultCalibration.singleShotCalibrationStatus,
        ...projectData?.calibrationState?.singleShotCalibrationStatus || {}
      },
      pendingCalibrationCharacters: Array.isArray(projectData?.calibrationState?.pendingCalibrationCharacters) ? projectData.calibrationState.pendingCalibrationCharacters : null,
      pendingFilteredCharacters: Array.isArray(projectData?.calibrationState?.pendingFilteredCharacters) ? projectData.calibrationState.pendingFilteredCharacters : []
    }
  };
  normalizedProject.shots = (normalizedProject.shots || []).map((shot) => normalizeShotVoiceFields(shot));
  if (normalizedProject.scriptData) {
    normalizedProject.scriptData = {
      ...normalizedProject.scriptData,
      characters: (normalizedProject.scriptData.characters || []).map((character) => {
        const legacyCharacterPrompt = character["visualPromptEn"];
        const { ["visualPromptEn"]: _discard, ...cleanCharacter } = character;
        return {
          ...cleanCharacter,
          characterPrompt: character.characterPrompt || legacyCharacterPrompt
        };
      }),
      scenes: (normalizedProject.scriptData.scenes || []).map(normalizeScriptScene)
    };
  }
  if (normalizedProject.seriesMeta?.recurringLocations) {
    normalizedProject.seriesMeta = {
      ...normalizedProject.seriesMeta,
      recurringLocations: normalizedProject.seriesMeta.recurringLocations.map(normalizeScriptScene)
    };
  }
  const recoveredCharacters = cloneScriptCharacters(normalizedProject.seriesMeta?.characters);
  if (normalizedProject.scriptData && (!Array.isArray(normalizedProject.scriptData.characters) || normalizedProject.scriptData.characters.length === 0) && recoveredCharacters.length > 0) {
    normalizedProject.scriptData = {
      ...normalizedProject.scriptData,
      characters: recoveredCharacters
    };
    pendingCharacterRecoveryProjectIds.add(projectId);
  }
  return normalizedProject;
};
const flushRecoveredCharactersToDisk = (state) => {
  if (!state || pendingCharacterRecoveryProjectIds.size === 0) {
    return;
  }
  for (const projectId of Array.from(pendingCharacterRecoveryProjectIds)) {
    const project = state.projects[projectId];
    const characters = cloneScriptCharacters(project?.scriptData?.characters);
    if (!project?.scriptData || characters.length === 0) {
      pendingCharacterRecoveryProjectIds.delete(projectId);
      continue;
    }
    state.setScriptData(projectId, {
      ...project.scriptData,
      characters
    });
    pendingCharacterRecoveryProjectIds.delete(projectId);
  }
};
const useScriptStore = create()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      projects: {},
      setActiveProjectId: (id) => {
        if (get().activeProjectId === id) return;
        set({ activeProjectId: id });
      },
      ensureProject: (projectId) => {
        const { projects } = get();
        if (projects[projectId]) return;
        set({
          projects: { ...projects, [projectId]: defaultProjectData$1() }
        });
      },
      setRawScript: (projectId, rawScript) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              rawScript,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setLanguage: (projectId, language) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              language,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setTargetDuration: (projectId, duration) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              targetDuration: duration,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setStyleId: (projectId, styleId) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              styleId,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setSceneCount: (projectId, sceneCount) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              sceneCount,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setShotCount: (projectId, shotCount) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              shotCount,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setScriptData: (projectId, data) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              scriptData: data,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setParseStatus: (projectId, status, error) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              parseStatus: status,
              parseError: error,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setShots: (projectId, shots) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              shots: shots.map((shot) => normalizeShotVoiceFields(shot)),
              updatedAt: Date.now()
            }
          }
        }));
      },
      updateShot: (projectId, shotId, updates) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              shots: state.projects[projectId].shots.map(
                (s) => s.id === shotId ? normalizeShotVoiceFields({ ...s, ...updates }) : s
              ),
              updatedAt: Date.now()
            }
          }
        }));
      },
      setShotStatus: (projectId, status, error) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              shotStatus: status,
              shotError: error,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setBatchProgress: (projectId, progress) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              batchProgress: progress,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setMappings: (projectId, mappings) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              characterIdMap: mappings.characterIdMap || state.projects[projectId].characterIdMap,
              sceneIdMap: mappings.sceneIdMap || state.projects[projectId].sceneIdMap,
              updatedAt: Date.now()
            }
          }
        }));
      },
      resetProjectData: (projectId) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: defaultProjectData$1()
          }
        }));
      },
      // Episode CRUD
      addEpisode: (projectId, episode) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: [...project.scriptData.episodes || [], episode]
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      updateEpisode: (projectId, episodeId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: (project.scriptData.episodes || []).map(
                    (e) => e.id === episodeId ? { ...e, ...updates } : e
                  )
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      deleteEpisode: (projectId, episodeId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const episode = project.scriptData.episodes?.find((e) => e.id === episodeId);
          const sceneIdsToRemove = new Set(episode?.sceneIds || []);
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: (project.scriptData.episodes || []).filter((e) => e.id !== episodeId),
                  scenes: project.scriptData.scenes.filter((s) => !sceneIdsToRemove.has(s.id))
                },
                shots: project.shots.filter((s) => !sceneIdsToRemove.has(s.sceneRefId)),
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      // ==================== Episode Bundle Atomic Operations ====================
      deleteEpisodeBundle: (projectId, episodeIndex) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const episode = project.scriptData.episodes?.find((e) => e.index === episodeIndex);
          const sceneIdsToRemove = new Set(episode?.sceneIds || []);
          const newEpisodes = (project.scriptData.episodes || []).filter((e) => e.index !== episodeIndex);
          const newRawScripts = (project.episodeRawScripts || []).filter((e) => e.episodeIndex !== episodeIndex);
          const reindexed = newEpisodes.map((e, i) => ({ ...e, index: i + 1 }));
          const reindexedRaw = newRawScripts.map((e, i) => ({
            ...e,
            episodeIndex: i + 1,
            title: e.title.replace(/^(\u7b2c\d+\u96c6|Episode\s+\d+)/, `Episode ${i + 1}`)
          }));
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: reindexed,
                  scenes: project.scriptData.scenes.filter((s) => !sceneIdsToRemove.has(s.id))
                },
                shots: project.shots.filter((s) => !sceneIdsToRemove.has(s.sceneRefId)),
                episodeRawScripts: reindexedRaw,
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      reindexEpisodes: (projectId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const episodes = [...project.scriptData.episodes || []].sort((a, b) => a.index - b.index);
          const rawScripts = [...project.episodeRawScripts || []].sort((a, b) => a.episodeIndex - b.episodeIndex);
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: episodes.map((e, i) => ({ ...e, index: i + 1 }))
                },
                episodeRawScripts: rawScripts.map((e, i) => ({ ...e, episodeIndex: i + 1 })),
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      updateEpisodeBundle: (projectId, episodeIndex, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: (project.scriptData.episodes || []).map(
                    (e) => e.index === episodeIndex ? { ...e, ...updates.title !== void 0 ? { title: updates.title } : {}, ...updates.synopsis !== void 0 ? { description: updates.synopsis } : {} } : e
                  )
                },
                episodeRawScripts: (project.episodeRawScripts || []).map(
                  (e) => e.episodeIndex === episodeIndex ? { ...e, ...updates.title !== void 0 ? { title: updates.title } : {}, ...updates.synopsis !== void 0 ? { synopsis: updates.synopsis } : {} } : e
                ),
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      // Scene CRUD
      addScene: (projectId, scene, episodeId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const newScenes = [...project.scriptData.scenes, scene];
          let newEpisodes = project.scriptData.episodes || [];
          if (episodeId) {
            newEpisodes = newEpisodes.map(
              (e) => e.id === episodeId ? { ...e, sceneIds: [...e.sceneIds, scene.id] } : e
            );
          } else if (newEpisodes.length > 0) {
            newEpisodes = newEpisodes.map(
              (e, i) => i === 0 ? { ...e, sceneIds: [...e.sceneIds, scene.id] } : e
            );
          }
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  scenes: newScenes,
                  episodes: newEpisodes
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      updateScene: (projectId, sceneId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  scenes: project.scriptData.scenes.map(
                    (s) => s.id === sceneId ? { ...s, ...updates } : s
                  )
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      deleteScene: (projectId, sceneId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  scenes: project.scriptData.scenes.filter((s) => s.id !== sceneId),
                  episodes: (project.scriptData.episodes || []).map((e) => ({
                    ...e,
                    sceneIds: e.sceneIds.filter((id) => id !== sceneId)
                  }))
                },
                shots: project.shots.filter((s) => s.sceneRefId !== sceneId),
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      // Character CRUD
      addCharacter: (projectId, character) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  characters: [...project.scriptData.characters, character]
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      updateCharacter: (projectId, characterId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  characters: project.scriptData.characters.map(
                    (c) => c.id === characterId ? { ...c, ...updates } : c
                  )
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      deleteCharacter: (projectId, characterId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  characters: project.scriptData.characters.filter((c) => c.id !== characterId)
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      // Shot CRUD
      addShot: (projectId, shot) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                shots: [...project.shots, shot],
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      deleteShot: (projectId, shotId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                shots: project.shots.filter((s) => s.id !== shotId),
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      // Full-script management methods
      setEpisodeRawScripts: (projectId, scripts) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              episodeRawScripts: scripts,
              updatedAt: Date.now()
            }
          }
        }));
      },
      updateEpisodeRawScript: (projectId, episodeIndex, updates) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              episodeRawScripts: state.projects[projectId].episodeRawScripts.map(
                (ep) => ep.episodeIndex === episodeIndex ? { ...ep, ...updates } : ep
              ),
              updatedAt: Date.now()
            }
          }
        }));
      },
      setMetadataMarkdown: (projectId, markdown) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              metadataMarkdown: markdown,
              metadataGeneratedAt: Date.now(),
              updatedAt: Date.now()
            }
          }
        }));
      },
      setVideoGenerationMode: (projectId, mode) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              videoGenerationMode: mode,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setLongScriptImportCheckpoint: (projectId, checkpoint) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              longScriptImportCheckpoint: checkpoint,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setCalibrationState: (projectId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          const currentCalibration = project?.calibrationState || defaultCalibrationState();
          const hasPendingCharacters = Object.prototype.hasOwnProperty.call(updates, "pendingCalibrationCharacters");
          const hasPendingFiltered = Object.prototype.hasOwnProperty.call(updates, "pendingFilteredCharacters");
          const hasSingleShotStatus = Object.prototype.hasOwnProperty.call(updates, "singleShotCalibrationStatus");
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                calibrationState: {
                  ...currentCalibration,
                  ...updates,
                  pendingCalibrationCharacters: hasPendingCharacters ? updates.pendingCalibrationCharacters ?? null : currentCalibration.pendingCalibrationCharacters,
                  pendingFilteredCharacters: hasPendingFiltered ? updates.pendingFilteredCharacters ?? [] : currentCalibration.pendingFilteredCharacters,
                  singleShotCalibrationStatus: hasSingleShotStatus ? updates.singleShotCalibrationStatus ?? currentCalibration.singleShotCalibrationStatus : currentCalibration.singleShotCalibrationStatus
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      setSingleShotCalibrationStatus: (projectId, shotId, status) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          const currentCalibration = project?.calibrationState || defaultCalibrationState();
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                calibrationState: {
                  ...currentCalibration,
                  singleShotCalibrationStatus: {
                    ...currentCalibration.singleShotCalibrationStatus || {},
                    [shotId]: status
                  }
                },
                updatedAt: Date.now()
              }
            }
          };
        });
      },
      setCalibrationStrictness: (projectId, strictness) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              calibrationStrictness: strictness,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setLastFilteredCharacters: (projectId, filtered) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              lastFilteredCharacters: filtered,
              updatedAt: Date.now()
            }
          }
        }));
      },
      setSeriesMeta: (projectId, meta) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              scriptData: state.projects[projectId]?.scriptData && (!state.projects[projectId].scriptData.characters || state.projects[projectId].scriptData.characters.length === 0) && meta.characters?.length ? {
                ...state.projects[projectId].scriptData,
                characters: cloneScriptCharacters(meta.characters)
              } : state.projects[projectId]?.scriptData ?? null,
              seriesMeta: meta,
              updatedAt: Date.now()
            }
          }
        }));
      },
      updateSeriesMeta: (projectId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project?.seriesMeta) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: project.scriptData && (!project.scriptData.characters || project.scriptData.characters.length === 0) && updates.characters?.length ? {
                  ...project.scriptData,
                  characters: cloneScriptCharacters(updates.characters)
                } : project.scriptData,
                seriesMeta: { ...project.seriesMeta, ...updates },
                updatedAt: Date.now()
              }
            }
          };
        });
      }
    }),
    {
      name: "longdd-script-store",
      storage: createJSONStorage(() => createProjectScopedStorage("script")),
      partialize: (state) => {
        const pid = state.activeProjectId;
        if (!pid || !state.projects[pid]) return { activeProjectId: pid };
        return {
          activeProjectId: pid,
          projectData: state.projects[pid]
        };
      },
      merge: (persisted, current) => {
        if (!persisted) return current;
        if (persisted.projects && typeof persisted.projects === "object") {
          const normalizedProjects = {};
          for (const [projectId, projectData2] of Object.entries(persisted.projects)) {
            normalizedProjects[projectId] = normalizeScriptProjectData(projectId, projectData2);
          }
          return {
            ...current,
            ...persisted,
            projects: normalizedProjects
          };
        }
        const { activeProjectId: pid, projectData } = persisted;
        if (!pid || !projectData) return current;
        return {
          ...current,
          activeProjectId: pid,
          projects: { ...current.projects, [pid]: normalizeScriptProjectData(pid, projectData) }
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || pendingCharacterRecoveryProjectIds.size === 0) {
          return;
        }
        queueMicrotask(() => {
          flushRecoveredCharactersToDisk(state);
        });
      }
    }
  )
);
const useActiveScriptProject = () => {
  return useScriptStore((state) => {
    const id = state.activeProjectId;
    if (!id) return null;
    return state.projects[id] || null;
  });
};
const STYLE_NONE = {
  id: "none",
  name: "None / Skill Defined",
  category: "none",
  mediaType: "cinematic",
  prompt: "",
  negativePrompt: "",
  description: "Do not inject an app style. Use the prompt, skill, or user-provided style as-is.",
  thumbnail: ""
};
const VISUAL_STYLE_PRESETS = [
  STYLE_NONE
];
let _customStyleLookup = null;
function registerCustomStyleLookup(fn) {
  _customStyleLookup = fn;
}
function _findStyle(styleId) {
  return VISUAL_STYLE_PRESETS.find((s) => s.id === styleId) || _customStyleLookup?.(styleId);
}
const STYLE_CATEGORIES = [
  { id: "none", name: "No App Style", styles: [STYLE_NONE] }
];
function getStyleById(styleId) {
  return _findStyle(styleId);
}
function getStylePrompt(styleId) {
  if (!styleId) return "";
  const style = _findStyle(styleId);
  return style?.prompt || "";
}
function getStyleName(styleId) {
  const style = _findStyle(styleId);
  return style?.name || styleId;
}
function getStyleTokens(styleId) {
  const prompt = getStylePrompt(styleId);
  return prompt.replace(/\([^)]*:[0-9.]+\)/g, (match) => match.replace(/:[0-9.]+\)/, ")")).split(",").map((s) => s.trim().replace(/^\(|\)$/g, "")).filter((s) => s.length > 0).slice(0, 8);
}
const DEFAULT_STYLE_ID = "none";
const defaultProjectData = () => ({
  storyboardImage: null,
  storyboardImageMediaId: null,
  storyboardStatus: "editing",
  storyboardError: null,
  splitScenes: [],
  projectFolderId: null,
  storyboardConfig: {
    aspectRatio: "9:16",
    resolution: "2K",
    videoResolution: "480p",
    sceneCount: 5,
    storyPrompt: "",
    styleTokens: [],
    characterReferenceImages: [],
    characterDescriptions: [],
    voiceMode: "off"
  },
  screenplayDraft: {
    prompt: "",
    selectedCharacterIds: [],
    updatedAt: 0
  },
  editorPrefs: {
    imageGenMode: "merged",
    frameMode: "first",
    refStrategy: "cluster",
    useExemplar: true,
    activeTab: "editing",
    episodeViewScope: "episode"
  }
});
const defaultScreenplayDraft = {
  prompt: "",
  selectedCharacterIds: [],
  updatedAt: 0
};
const defaultEditorPrefs = {
  imageGenMode: "merged",
  frameMode: "first",
  refStrategy: "cluster",
  useExemplar: true,
  activeTab: "editing",
  episodeViewScope: "episode"
};
const normalizeSplitSceneVoiceFields = (scene) => {
  const parts = splitVideoPromptVoiceOver(scene.videoPrompt);
  const voiceOver = cleanVoiceOverText(scene.voiceOver) || parts.voiceOver;
  if (scene.voiceOverSynced) {
    return {
      ...scene,
      videoPrompt: scene.videoPrompt?.trim() || mergeVideoPromptVoiceOver(parts.videoPrompt, voiceOver),
      voiceOver,
      voiceOverSynced: Boolean(voiceOver)
    };
  }
  return {
    ...scene,
    videoPrompt: parts.videoPrompt,
    voiceOver
  };
};
const normalizeDirectorProjectData = (project) => {
  const defaults = defaultProjectData();
  return {
    ...defaults,
    ...project,
    storyboardConfig: {
      ...defaults.storyboardConfig,
      ...project?.storyboardConfig || {}
    },
    screenplayDraft: {
      ...defaultScreenplayDraft,
      ...project?.screenplayDraft || {}
    },
    editorPrefs: {
      ...defaultEditorPrefs,
      ...project?.editorPrefs || {}
    },
    splitScenes: (project?.splitScenes || []).map((scene) => normalizeSplitSceneVoiceFields({
      ...scene,
      videoLength: normalizeVideoLength(scene.videoLength),
      ref_image: normalizeRefImageIndexes(scene.ref_image ?? scene.refImage),
      sourceShotIndex: scene.sourceShotIndex ?? scene.id + 1
    }))
  };
};
const initialState$4 = {
  activeProjectId: null,
  projects: {},
  isExpanded: true,
  selectedSceneId: null
};
const useDirectorStore = create()(
  persist(
    (set, get) => ({
      ...initialState$4,
      // Project management
      setActiveProjectId: (projectId) => {
        if (get().activeProjectId === projectId) {
          if (projectId) get().ensureProject(projectId);
          return;
        }
        set({ activeProjectId: projectId });
        if (projectId) {
          get().ensureProject(projectId);
        }
      },
      ensureProject: (projectId) => {
        const { projects } = get();
        if (projects[projectId]) return;
        set({
          projects: { ...projects, [projectId]: defaultProjectData() }
        });
      },
      getProjectData: (projectId) => {
        const { projects } = get();
        return projects[projectId] || defaultProjectData();
      },
      // UI
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      setSelectedScene: (sceneId) => set({ selectedSceneId: sceneId }),
      // Storyboard actions (new workflow) - Project-aware
      setStoryboardImage: (imageUrl, mediaId) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...projects[activeProjectId],
              storyboardImage: imageUrl,
              storyboardImageMediaId: mediaId ?? null
            }
          }
        });
      },
      setStoryboardStatus: (status) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...projects[activeProjectId],
              storyboardStatus: status
            }
          }
        });
      },
      setProjectFolderId: (folderId) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...projects[activeProjectId],
              projectFolderId: folderId
            }
          }
        });
      },
      setStoryboardError: (error) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const currentProject = projects[activeProjectId];
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...currentProject,
              storyboardError: error,
              storyboardStatus: error ? "error" : currentProject?.storyboardStatus || "idle"
            }
          }
        });
      },
      setSplitScenes: (scenes) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const initialized = scenes.map((s, index) => {
          const voiceFields = normalizeSplitSceneVoiceFields({
            videoPrompt: s.videoPrompt ?? "",
            voiceOver: s.voiceOver,
            voiceOverSynced: s.voiceOverSynced
          });
          return {
            ...s,
            // Basic scene information
            sceneName: s.sceneName ?? "",
            sceneLocation: s.sceneLocation ?? "",
            // ========== First-Frame Fields ==========
            imageHttpUrl: s.imageHttpUrl ?? null,
            // First-frame prompt
            imagePrompt: s.imagePrompt ?? "",
            // First-frame generation status
            imageStatus: s.imageStatus || "completed",
            imageProgress: s.imageProgress ?? 100,
            imageError: s.imageError ?? null,
            // ========== Video Fields ==========
            videoPrompt: voiceFields.videoPrompt,
            voiceOver: voiceFields.voiceOver,
            voiceOverSynced: voiceFields.voiceOverSynced,
            videoLength: normalizeVideoLength(s.videoLength),
            videoStatus: s.videoStatus || "idle",
            videoProgress: s.videoProgress ?? 0,
            videoUrl: s.videoUrl ?? null,
            videoError: s.videoError ?? null,
            videoMediaId: s.videoMediaId ?? null,
            // ========== Characters ==========
            characterIds: s.characterIds ?? [],
            // ========== Imported screenplay information ==========
            dialogue: s.dialogue ?? "",
            soundEffectText: s.soundEffectText ?? "",
            // ========== Video Parameters ==========
            ambientSound: s.ambientSound ?? "",
            soundEffects: s.soundEffects ?? [],
            // ========== Continuity - per shot ==========
            continuityRef: s.continuityRef ?? void 0,
            ref_image: normalizeRefImageIndexes(s.ref_image ?? s.refImage),
            sourceShotIndex: s.sourceShotIndex ?? index + 1
          };
        });
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...projects[activeProjectId],
              splitScenes: initialized
            }
          }
        });
      },
      // ========== Two-Tier Prompt Update Methods ==========
      // Update first-frame prompt (static image description)
      updateSplitSceneImagePrompt: (sceneId, prompt) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? {
            ...scene,
            imagePrompt: prompt
          } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      // Update video prompt (action / motion description)
      updateSplitSceneVideoPrompt: (sceneId, prompt) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map((scene) => {
          if (scene.id !== sceneId) return scene;
          const parts = splitVideoPromptVoiceOver(prompt);
          return {
            ...scene,
            videoPrompt: parts.videoPrompt,
            voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
            voiceOverSynced: false
          };
        });
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      // Legacy compatibility API that actually updates videoPrompt
      updateSplitScenePrompt: (sceneId, prompt) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map((scene) => {
          if (scene.id !== sceneId) return scene;
          const parts = splitVideoPromptVoiceOver(prompt);
          return {
            ...scene,
            videoPrompt: parts.videoPrompt,
            voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
            voiceOverSynced: false
          };
        });
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      // Update shot image.
      // If the image changes and no new httpUrl is supplied, clear the stale httpUrl.
      // This prevents old HTTP URLs from being reused after the user selects a new local image.
      // Also clear imageSource so video generation does not incorrectly reuse the previous imageHttpUrl.
      updateSplitSceneImage: (sceneId, imageDataUrl, width, height, httpUrl) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? {
            ...scene,
            imageDataUrl,
            // If httpUrl is explicitly provided (including an empty string), use it; otherwise force-clear with null.
            // Use null instead of undefined so the previous value is definitely overwritten.
            imageHttpUrl: httpUrl !== void 0 ? httpUrl || null : null,
            // If no httpUrl is supplied, also clear imageSource to avoid incorrect assumptions during video generation.
            imageSource: httpUrl ? "ai-generated" : void 0,
            imageStatus: "completed",
            imageProgress: 100,
            imageError: null,
            ...width !== void 0 && { width },
            ...height !== void 0 && { height }
          } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneImageStatus: (sceneId, updates) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, ...updates } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneVideo: (sceneId, updates) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, ...updates } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneCharacters: (sceneId, characterIds) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, characterIds } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneCharacterVariationMap: (sceneId, characterVariationMap) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, characterVariationMap } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneAmbientSound: (sceneId, ambientSound) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, ambientSound } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      updateSplitSceneSoundEffects: (sceneId, soundEffects) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, soundEffects } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      // Update scene-library linkage for the first frame
      updateSplitSceneReference: (sceneId, sceneLibraryId, referenceImage) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map(
          (scene) => scene.id === sceneId ? { ...scene, sceneLibraryId, sceneReferenceImage: referenceImage } : scene
        );
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
        console.log("[DirectorStore] Updated scene reference for shot", sceneId, ":", sceneLibraryId);
      },
      // Generic field-update helper used by inline editing
      updateSplitSceneField: (sceneId, field, value) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const updated = project.splitScenes.map((scene) => {
          if (scene.id !== sceneId) return scene;
          if (field === "videoPrompt") {
            const parts = splitVideoPromptVoiceOver(String(value ?? ""));
            return {
              ...scene,
              videoPrompt: parts.videoPrompt,
              voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
              voiceOverSynced: false
            };
          }
          if (field === "voiceOver") {
            return { ...scene, voiceOver: cleanVoiceOverText(String(value ?? "")), voiceOverSynced: false };
          }
          return { ...scene, [field]: value };
        });
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: updated }
          }
        });
      },
      syncVoiceOverToVideoPrompts: (sceneIds) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return 0;
        const project = projects[activeProjectId];
        const allowedIds = sceneIds ? new Set(sceneIds) : null;
        let synced = 0;
        const updated = project.splitScenes.map((scene) => {
          if (allowedIds && !allowedIds.has(scene.id)) return scene;
          const parts = splitVideoPromptVoiceOver(scene.videoPrompt);
          const voiceOver = cleanVoiceOverText(scene.voiceOver) || parts.voiceOver;
          if (!voiceOver) return scene;
          const nextVideoPrompt = mergeVideoPromptVoiceOver(scene.videoPrompt, voiceOver);
          if (scene.videoPrompt === nextVideoPrompt && scene.voiceOverSynced) return scene;
          synced += 1;
          return {
            ...scene,
            videoPrompt: nextVideoPrompt,
            voiceOver,
            voiceOverSynced: true
          };
        });
        if (synced > 0) {
          set({
            projects: {
              ...projects,
              [activeProjectId]: { ...project, splitScenes: updated }
            }
          });
        }
        return synced;
      },
      unsyncVoiceOverFromVideoPrompts: (sceneIds) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return 0;
        const project = projects[activeProjectId];
        const allowedIds = sceneIds ? new Set(sceneIds) : null;
        let unsynced = 0;
        const updated = project.splitScenes.map((scene) => {
          if (allowedIds && !allowedIds.has(scene.id)) return scene;
          const parts = splitVideoPromptVoiceOver(scene.videoPrompt);
          if (!parts.voiceOver && !scene.voiceOverSynced) return scene;
          unsynced += 1;
          return {
            ...scene,
            videoPrompt: parts.videoPrompt,
            voiceOver: cleanVoiceOverText(scene.voiceOver) || parts.voiceOver,
            voiceOverSynced: false
          };
        });
        if (unsynced > 0) {
          set({
            projects: {
              ...projects,
              [activeProjectId]: { ...project, splitScenes: updated }
            }
          });
        }
        return unsynced;
      },
      deleteSplitScene: (sceneId) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const remaining = project.splitScenes.filter((s) => s.id !== sceneId);
        const renumbered = remaining.map((s, idx) => ({ ...s, id: idx }));
        set({
          projects: {
            ...projects,
            [activeProjectId]: { ...project, splitScenes: renumbered }
          }
        });
        console.log("[DirectorStore] Deleted split scene", sceneId, "remaining:", renumbered.length);
      },
      setStoryboardConfig: (partialConfig) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              storyboardConfig: { ...project.storyboardConfig, ...partialConfig }
            }
          }
        });
      },
      setScreenplayDraft: (partialDraft) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              screenplayDraft: {
                ...project.screenplayDraft || defaultScreenplayDraft,
                ...partialDraft,
                updatedAt: Date.now()
              }
            }
          }
        });
      },
      clearScreenplayDraft: () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              screenplayDraft: {
                ...defaultScreenplayDraft,
                updatedAt: Date.now()
              }
            }
          }
        });
      },
      setEditorPrefs: (partialPrefs) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              editorPrefs: {
                ...project.editorPrefs || defaultEditorPrefs,
                ...partialPrefs
              }
            }
          }
        });
      },
      resetStoryboard: () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...projects[activeProjectId],
              storyboardImage: null,
              storyboardImageMediaId: null,
              storyboardStatus: "editing",
              storyboardError: null,
              splitScenes: []
            }
          }
        });
        console.log("[DirectorStore] Reset storyboard state for project", activeProjectId);
      },
      // Mode 2: Add scenes from script directly (skip storyboard, generate images individually)
      addScenesFromScript: (scenes) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const splitScenes = project?.splitScenes || [];
        const startId = splitScenes.length > 0 ? Math.max(...splitScenes.map((s) => s.id)) + 1 : 0;
        const newScenes = scenes.map((scene, index) => {
          const voiceFields = normalizeSplitSceneVoiceFields({
            videoPrompt: scene.videoPrompt || scene.promptEn || "",
            voiceOver: scene.voiceOver
          });
          return {
            id: startId + index,
            sceneName: scene.sceneName || "",
            sceneLocation: scene.sceneLocation || "",
            imageDataUrl: "",
            imageHttpUrl: null,
            width: 0,
            height: 0,
            // Two-layer prompt system: prefer dedicated layered prompts.
            imagePrompt: scene.imagePrompt || scene.promptEn || "",
            videoPrompt: voiceFields.videoPrompt,
            voiceOver: voiceFields.voiceOver,
            voiceOverSynced: false,
            videoLength: normalizeVideoLength(scene.videoLength),
            row: 0,
            col: 0,
            sourceRect: { x: 0, y: 0, width: 0, height: 0 },
            characterIds: scene.characterIds || [],
            characterNames: scene.characterNames || [],
            ambientSound: scene.ambientSound || "",
            soundEffects: scene.soundEffects || [],
            soundEffectText: scene.soundEffectText || "",
            dialogue: scene.dialogue || "",
            // Audio toggles default to enabled, except background music which defaults to disabled.
            audioAmbientEnabled: true,
            audioSfxEnabled: true,
            audioDialogueEnabled: true,
            audioBgmEnabled: false,
            backgroundMusic: scene.backgroundMusic || "",
            // Scene-library associations (auto-matched when available)
            sceneLibraryId: scene.sceneLibraryId,
            sceneReferenceImage: scene.sceneReferenceImage,
            ref_image: normalizeRefImageIndexes(scene.ref_image ?? scene.refImage),
            imageStatus: "idle",
            imageProgress: 0,
            imageError: null,
            videoStatus: "idle",
            videoProgress: 0,
            videoUrl: null,
            videoError: null,
            videoMediaId: null,
            sourceShotId: scene.sourceShotId,
            sourceShotIndex: scene.sourceShotIndex ?? startId + index + 1,
            // Episode scope
            sourceEpisodeIndex: scene.sourceEpisodeIndex,
            sourceEpisodeId: scene.sourceEpisodeId
          };
        });
        const currentConfig = project.storyboardConfig;
        const calibratedUpdate = currentConfig.visualStyleId && !currentConfig.calibratedStyleId ? { storyboardConfig: { ...currentConfig, calibratedStyleId: currentConfig.visualStyleId } } : {};
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              ...calibratedUpdate,
              splitScenes: [...splitScenes, ...newScenes],
              storyboardStatus: "editing"
            }
          }
        });
        console.log("[DirectorStore] Added", newScenes.length, "scenes from script, total:", splitScenes.length + newScenes.length);
      },
      // Add a blank shot for manual workflows (upload image, fill prompts, generate manually)
      addBlankSplitScene: () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;
        const project = projects[activeProjectId];
        const splitScenes = project?.splitScenes || [];
        const newId = splitScenes.length > 0 ? Math.max(...splitScenes.map((s) => s.id)) + 1 : 0;
        const blankScene = {
          id: newId,
          sceneName: `Blank Shot ${newId + 1}`,
          sceneLocation: "",
          imageDataUrl: "",
          imageHttpUrl: null,
          width: 0,
          height: 0,
          imagePrompt: "",
          videoPrompt: "",
          voiceOver: "",
          voiceOverSynced: false,
          videoLength: 4,
          row: 0,
          col: 0,
          sourceRect: { x: 0, y: 0, width: 0, height: 0 },
          characterIds: [],
          ambientSound: "",
          soundEffects: [],
          soundEffectText: "",
          dialogue: "",
          audioAmbientEnabled: true,
          audioSfxEnabled: true,
          audioDialogueEnabled: true,
          audioBgmEnabled: false,
          backgroundMusic: "",
          imageStatus: "idle",
          imageProgress: 0,
          imageError: null,
          videoStatus: "idle",
          videoProgress: 0,
          videoUrl: null,
          videoError: null,
          videoMediaId: null
        };
        set({
          projects: {
            ...projects,
            [activeProjectId]: {
              ...project,
              splitScenes: [...splitScenes, blankScene],
              storyboardStatus: "editing"
            }
          }
        });
        console.log("[DirectorStore] Added blank scene, id:", newId, "total:", splitScenes.length + 1);
      },
      resetInflightStatuses: () => {
        const inflightAV = /* @__PURE__ */ new Set(["queued", "uploading", "generating"]);
        const inflightStoryboard = /* @__PURE__ */ new Set(["generating", "splitting"]);
        const { projects } = get();
        let mutated = false;
        const nextProjects = {};
        const projectEntries = Object.entries(projects);
        for (const [pid, proj] of projectEntries) {
          let projChanged = false;
          const nextScenes = proj.splitScenes.map((s) => {
            const updates = {};
            if (inflightAV.has(s.imageStatus)) {
              updates.imageStatus = "idle";
              updates.imageProgress = 0;
              updates.imageError = null;
            }
            if (inflightAV.has(s.videoStatus)) {
              updates.videoStatus = "idle";
              updates.videoProgress = 0;
              updates.videoError = null;
            }
            if (Object.keys(updates).length === 0) return s;
            projChanged = true;
            return { ...s, ...updates };
          });
          let nextStoryboardStatus = proj.storyboardStatus;
          let nextStoryboardError = proj.storyboardError;
          if (inflightStoryboard.has(proj.storyboardStatus)) {
            nextStoryboardStatus = nextScenes.length > 0 ? "editing" : proj.storyboardImage ? "preview" : "idle";
            nextStoryboardError = null;
            projChanged = true;
          }
          if (projChanged) {
            mutated = true;
            nextProjects[pid] = {
              ...proj,
              splitScenes: nextScenes,
              storyboardStatus: nextStoryboardStatus,
              storyboardError: nextStoryboardError
            };
          } else {
            nextProjects[pid] = proj;
          }
        }
        if (mutated) set({ projects: nextProjects });
      }
    }),
    {
      name: "longdd-director-store",
      storage: createJSONStorage(() => createProjectScopedStorage("director")),
      partialize: (state) => {
        const stripBase64 = (val) => {
          if (!val) return val;
          if (typeof val === "string" && val.startsWith("data:")) return "";
          return val;
        };
        const stripScene = (s) => ({
          ...s,
          imageDataUrl: stripBase64(s.imageDataUrl) ?? "",
          sceneReferenceImage: stripBase64(s.sceneReferenceImage)
        });
        const pid = state.activeProjectId;
        let projectData = null;
        if (pid && state.projects[pid]) {
          const proj = state.projects[pid];
          projectData = {
            ...proj,
            storyboardImage: stripBase64(proj.storyboardImage) ?? null,
            splitScenes: proj.splitScenes.map(stripScene)
          };
        }
        return {
          activeProjectId: pid,
          projectData
        };
      },
      merge: (persisted, current) => {
        if (!persisted) return current;
        if (persisted.projects && typeof persisted.projects === "object") {
          const normalizedProjects = {};
          for (const [projectId, projectData2] of Object.entries(persisted.projects)) {
            normalizedProjects[projectId] = normalizeDirectorProjectData(projectData2);
          }
          return {
            ...current,
            ...persisted,
            projects: normalizedProjects
          };
        }
        const { activeProjectId: pid, projectData } = persisted;
        const updates = { ...current };
        if (pid) updates.activeProjectId = pid;
        if (pid && projectData) {
          updates.projects = { ...current.projects, [pid]: normalizeDirectorProjectData(projectData) };
        }
        return updates;
      }
    }
  )
);
const useActiveDirectorProject = () => {
  return useDirectorStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projects[state.activeProjectId] || null;
  });
};
const initialState$3 = {
  characters: [],
  folders: [],
  currentFolderId: null,
  selectedCharacterId: null,
  generationStatus: "idle",
  generationError: null,
  generatingCharacterId: null
};
function stripBase64Images(values) {
  if (!values || values.length === 0) return void 0;
  const filtered = values.filter((value) => !!value && !value.startsWith("data:"));
  return filtered.length > 0 ? filtered : void 0;
}
function splitCharData(state, pid) {
  return {
    projectData: {
      folders: state.folders.filter((f) => f.projectId === pid),
      characters: state.characters.filter((c) => c.projectId === pid),
      currentFolderId: state.currentFolderId
    },
    sharedData: {
      folders: state.folders.filter((f) => !f.projectId),
      characters: state.characters.filter((c) => !c.projectId),
      currentFolderId: null
    }
  };
}
function mergeCharData(projectData, sharedData) {
  return {
    folders: [
      ...sharedData?.folders ?? [],
      ...projectData?.folders ?? []
    ],
    characters: [
      ...sharedData?.characters ?? [],
      ...projectData?.characters ?? []
    ],
    currentFolderId: projectData?.currentFolderId ?? null
  };
}
const useCharacterLibraryStore = create()(
  persist(
    (set, get) => ({
      ...initialState$3,
      // Character CRUD
      addCharacter: (characterData) => {
        const id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const newCharacter = {
          ...characterData,
          id,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          characters: [...state.characters, newCharacter]
        }));
        console.log(`Character added: ${newCharacter.name} (total: ${useCharacterLibraryStore.getState().characters.length})`);
        return id;
      },
      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map(
            (char) => char.id === id ? { ...char, ...updates, updatedAt: Date.now() } : char
          )
        }));
      },
      deleteCharacter: (id) => {
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
          selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId
        }));
      },
      moveToFolder: (characterId, folderId) => {
        set((state) => ({
          characters: state.characters.map(
            (char) => char.id === characterId ? { ...char, folderId, updatedAt: Date.now() } : char
          )
        }));
      },
      // Folder CRUD
      addFolder: (name, parentId = null, projectId) => {
        const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newFolder = {
          id,
          name,
          parentId: parentId || null,
          projectId,
          isAutoCreated: !!projectId,
          createdAt: Date.now()
        };
        set((state) => ({
          folders: [...state.folders, newFolder]
        }));
        return id;
      },
      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map(
            (f) => f.id === id ? { ...f, name } : f
          )
        }));
      },
      deleteFolder: (id) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === id);
          const parentId = folder?.parentId || null;
          return {
            folders: state.folders.filter((f) => f.id !== id),
            characters: state.characters.map(
              (char) => char.folderId === id ? { ...char, folderId: parentId } : char
            ),
            currentFolderId: state.currentFolderId === id ? parentId : state.currentFolderId
          };
        });
      },
      setCurrentFolder: (id) => {
        set({ currentFolderId: id });
      },
      getOrCreateProjectFolder: (projectId, projectName) => {
        const existing = get().folders.find((f) => f.projectId === projectId);
        if (existing) return existing.id;
        return get().addFolder(projectName, null, projectId);
      },
      // Selection
      selectCharacter: (id) => {
        set({ selectedCharacterId: id });
      },
      // Generation status
      setGenerationStatus: (status, error) => {
        set({
          generationStatus: status,
          generationError: error || null
        });
      },
      setGeneratingCharacter: (id) => {
        set({ generatingCharacterId: id });
      },
      // Assign missing projectId to current project (for isolation toggle)
      assignProjectToUnscoped: (projectId) => {
        set((state) => ({
          characters: state.characters.map(
            (char) => char.projectId ? char : { ...char, projectId }
          ),
          folders: state.folders.map(
            (folder) => folder.projectId ? folder : { ...folder, projectId }
          )
        }));
      },
      // Utilities
      getCharacterById: (id) => {
        return get().characters.find((char) => char.id === id);
      },
      getFolderById: (id) => {
        return get().folders.find((f) => f.id === id);
      },
      reset: () => set(initialState$3)
    }),
    {
      name: "longdd-character-library",
      storage: createJSONStorage(() => createSplitStorage(
        "characters",
        splitCharData,
        mergeCharData,
        "shareCharacters"
      )),
      partialize: (state) => ({
        // Persist folders
        folders: state.folders,
        currentFolderId: state.currentFolderId,
        // Persist characters with essential data only
        characters: state.characters.map((char) => ({
          ...char,
          // Keep persisted local/remote refs, but strip raw base64 payloads.
          referenceImages: stripBase64Images(char.referenceImages)
        }))
      }),
      merge: (persisted, current) => {
        if (!persisted) return current;
        return {
          ...current,
          folders: persisted.folders ?? current.folders,
          characters: (persisted.characters ?? current.characters).map((char) => {
            const legacyCharacterPrompt = char["visualTraits"];
            const { ["visualTraits"]: _discard, identityPrompt, negativePrompt, variations, views, selectedSheetElements, ...cleanChar } = char;
            const legacyMainImage = Array.isArray(views) ? views.find((view) => view?.viewType === "front")?.imageUrl || views[0]?.imageUrl : void 0;
            return {
              ...cleanChar,
              thumbnailUrl: char.thumbnailUrl || legacyMainImage,
              description: char.description || char.appearance || legacyCharacterPrompt,
              characterPrompt: char.characterPrompt || legacyCharacterPrompt || char.description || char.name
            };
          }),
          currentFolderId: persisted.currentFolderId ?? current.currentFolderId
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Failed to rehydrate character library:", error);
        }
        migrateFromLocalStorage();
      }
    }
  )
);
const DB_NAME = "lolo-image-storage";
const DB_VERSION = 1;
const STORE_NAME = "images";
const IDB_IMAGE_PREFIX = "idb-image://";
function isIdbImagePath(path) {
  return typeof path === "string" && path.startsWith(IDB_IMAGE_PREFIX);
}
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveBlobToBrowserStorage(blob, filename) {
  const key = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const record = { key, blob, filename, createdAt: Date.now() };
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      db.close();
      resolve(`${IDB_IMAGE_PREFIX}${key}`);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
async function readBlobFromBrowserStorage(idbUrl) {
  const key = idbUrl.startsWith(IDB_IMAGE_PREFIX) ? idbUrl.slice(IDB_IMAGE_PREFIX.length) : idbUrl;
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result?.blob ?? null);
    };
    req.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}
async function saveImageUrlToBrowser(url, filename) {
  try {
    let blob;
    if (url.startsWith("data:")) {
      const [header, base64] = url.split(",", 2);
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
      blob = await resp.blob();
    }
    return await saveBlobToBrowserStorage(blob, filename);
  } catch (e) {
    console.warn("[BrowserImageStorage] Failed to save image, using original URL:", e);
    return url;
  }
}
const isElectron = () => {
  return typeof window !== "undefined" && !!window.imageStorage;
};
async function saveImageToLocal(url, category, filename = "image.png") {
  if (!isElectron()) {
    return saveImageUrlToBrowser(url, filename);
  }
  try {
    const result = await window.imageStorage.saveImage(url, category, filename);
    if (result.success && result.localPath) {
      console.log(`Image saved locally: ${result.localPath}`);
      return result.localPath;
    } else {
      console.error("Failed to save image:", result.error);
      return url;
    }
  } catch (error) {
    console.error("Error saving image:", error);
    return url;
  }
}
async function readImageAsBase64(imagePath) {
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  if (isIdbImagePath(imagePath)) {
    const blob = await readBlobFromBrowserStorage(imagePath);
    if (!blob) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    if (isElectron()) {
      try {
        const result = await window.imageStorage.readAsBase64(imagePath);
        if (result.success && result.base64) {
          return result.base64;
        }
        console.error("Failed to read remote image via Electron:", result.error);
      } catch (error) {
        console.error("Error reading remote image via Electron:", error);
      }
    }
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching remote image:", error);
      return null;
    }
  }
  if (!isElectron()) {
    console.warn("Not running in Electron, cannot read local image");
    return null;
  }
  try {
    const result = await window.imageStorage.readAsBase64(imagePath);
    if (result.success && result.base64) {
      return result.base64;
    }
    console.error("Failed to read image:", result.error);
    return null;
  } catch (error) {
    console.error("Error reading image as base64:", error);
    return null;
  }
}
async function getAbsoluteImagePath(localPath) {
  if (!localPath.startsWith("local-image://")) {
    return localPath;
  }
  if (!isElectron()) {
    console.warn("Not running in Electron, cannot get absolute path");
    return null;
  }
  try {
    return await window.imageStorage.getAbsolutePath(localPath);
  } catch (error) {
    console.error("Error getting absolute path:", error);
    return null;
  }
}
async function saveVideoToLocal(url, filename = "video.mp4") {
  if (!isElectron() || url.startsWith("local-image://") || url.startsWith("data:")) {
    return url;
  }
  try {
    const result = await window.imageStorage.saveImage(url, "videos", filename);
    if (result.success && result.localPath) {
      console.log(`Video saved locally: ${result.localPath}`);
      return result.localPath;
    } else {
      console.error("Failed to save video:", result.error);
      return url;
    }
  } catch (error) {
    console.error("Error saving video:", error);
    return url;
  }
}
const defaultGenerationPrefs = {};
const normalizeGenerationPrefs = (prefs) => {
  return {
    ...defaultGenerationPrefs,
    ...prefs || {}
  };
};
const initialState$2 = {
  scenes: [],
  folders: [],
  currentFolderId: null,
  selectedSceneId: null,
  generationStatus: "idle",
  generationError: null,
  generatingSceneId: null,
  generationPrefs: { ...defaultGenerationPrefs },
  generationPrefsByProject: {}
};
function splitSceneData(state, pid) {
  const normalizedMap = Object.fromEntries(
    Object.entries(state.generationPrefsByProject || {}).map(([projectId, prefs]) => [
      projectId,
      normalizeGenerationPrefs(prefs)
    ])
  );
  const projectGenerationPrefs = normalizeGenerationPrefs(normalizedMap[pid]);
  return {
    projectData: {
      scenes: state.scenes.filter((s) => s.projectId === pid),
      folders: state.folders.filter((f) => f.projectId === pid),
      generationPrefs: projectGenerationPrefs
    },
    sharedData: {
      scenes: state.scenes.filter((s) => !s.projectId),
      folders: state.folders.filter((f) => !f.projectId),
      generationPrefs: normalizeGenerationPrefs(state.generationPrefs),
      generationPrefsByProject: normalizedMap
    }
  };
}
function mergeSceneData(projectData, sharedData) {
  const mergedPrefsByProject = {};
  for (const [projectId, prefs] of Object.entries(sharedData?.generationPrefsByProject || {})) {
    mergedPrefsByProject[projectId] = normalizeGenerationPrefs(prefs);
  }
  const inferredProjectId = projectData?.scenes.find((s) => !!s.projectId)?.projectId || projectData?.folders.find((f) => !!f.projectId)?.projectId;
  if (inferredProjectId && projectData?.generationPrefs) {
    mergedPrefsByProject[inferredProjectId] = normalizeGenerationPrefs(projectData.generationPrefs);
  }
  return {
    scenes: [
      ...sharedData?.scenes ?? [],
      ...projectData?.scenes ?? []
    ],
    folders: [
      ...sharedData?.folders ?? [],
      ...projectData?.folders ?? []
    ],
    generationPrefs: normalizeGenerationPrefs(
      projectData?.generationPrefs || sharedData?.generationPrefs
    ),
    generationPrefsByProject: mergedPrefsByProject
  };
}
const useSceneStore = create()(
  persist(
    (set, get) => ({
      ...initialState$2,
      // Scene CRUD
      addScene: (sceneData) => {
        const id = `scene_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const newScene = {
          ...sceneData,
          id,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          scenes: [...state.scenes, newScene]
        }));
        return id;
      },
      updateScene: (id, updates) => {
        set((state) => ({
          scenes: state.scenes.map(
            (scene) => scene.id === id ? { ...scene, ...updates, updatedAt: Date.now() } : scene
          )
        }));
      },
      deleteScene: (id) => {
        set((state) => ({
          scenes: state.scenes.filter((scene) => scene.id !== id),
          selectedSceneId: state.selectedSceneId === id ? null : state.selectedSceneId
        }));
      },
      moveToFolder: (sceneId, folderId) => {
        set((state) => ({
          scenes: state.scenes.map(
            (scene) => scene.id === sceneId ? { ...scene, folderId, updatedAt: Date.now() } : scene
          )
        }));
      },
      // Folder CRUD
      addFolder: (name, parentId = null, projectId) => {
        const id = `scenefolder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newFolder = {
          id,
          name,
          parentId: parentId || null,
          projectId,
          isAutoCreated: !!projectId,
          createdAt: Date.now()
        };
        set((state) => ({
          folders: [...state.folders, newFolder]
        }));
        return id;
      },
      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map(
            (f) => f.id === id ? { ...f, name } : f
          )
        }));
      },
      deleteFolder: (id) => {
        set((state) => {
          const folder = state.folders.find((f) => f.id === id);
          const parentId = folder?.parentId || null;
          return {
            folders: state.folders.filter((f) => f.id !== id),
            scenes: state.scenes.map(
              (scene) => scene.folderId === id ? { ...scene, folderId: parentId } : scene
            ),
            currentFolderId: state.currentFolderId === id ? parentId : state.currentFolderId
          };
        });
      },
      setCurrentFolder: (id) => {
        set({ currentFolderId: id });
      },
      getOrCreateProjectFolder: (projectId, projectName) => {
        const existing = get().folders.find((f) => f.projectId === projectId);
        if (existing) return existing.id;
        return get().addFolder(projectName, null, projectId);
      },
      // Selection
      selectScene: (id) => {
        set({ selectedSceneId: id });
      },
      // Generation status
      setGenerationStatus: (status, error) => {
        set({
          generationStatus: status,
          generationError: error || null
        });
      },
      setGeneratingScene: (id) => {
        set({ generatingSceneId: id });
      },
      setGenerationPrefs: (prefs) => {
        const activeProjectId = useProjectStore.getState().activeProjectId;
        set((state) => {
          const nextPrefs = {
            ...state.generationPrefs,
            ...prefs
          };
          const projectPrefsUnchanged = activeProjectId ? (() => {
            const currentProjectPrefs = state.generationPrefsByProject[activeProjectId];
            if (!currentProjectPrefs) return false;
            return JSON.stringify(currentProjectPrefs) === JSON.stringify(nextPrefs);
          })() : true;
          const nextPrefsByProject = { ...state.generationPrefsByProject };
          if (activeProjectId) {
            nextPrefsByProject[activeProjectId] = nextPrefs;
          }
          const unchanged = JSON.stringify(nextPrefs) === JSON.stringify(state.generationPrefs) && projectPrefsUnchanged;
          if (unchanged) return state;
          return { generationPrefs: nextPrefs, generationPrefsByProject: nextPrefsByProject };
        });
      },
      // Assign missing projectId to current project (for isolation toggle)
      assignProjectToUnscoped: (projectId) => {
        set((state) => ({
          scenes: state.scenes.map(
            (scene) => scene.projectId ? scene : { ...scene, projectId }
          ),
          folders: state.folders.map(
            (folder) => folder.projectId ? folder : { ...folder, projectId }
          )
        }));
      },
      // Utilities
      getSceneById: (id) => {
        return get().scenes.find((scene) => scene.id === id);
      },
      getFolderById: (id) => {
        return get().folders.find((f) => f.id === id);
      },
      reset: () => set(initialState$2)
    }),
    {
      name: "longdd-scene-store",
      storage: createJSONStorage(() => createSplitStorage(
        "scenes",
        splitSceneData,
        mergeSceneData,
        "shareScenes"
      )),
      partialize: (state) => ({
        scenes: state.scenes.map((scene) => ({
          ...scene,
          // Don't persist large base64 images
          referenceImageBase64: void 0,
          // Safety net: strip data URLs that leaked into referenceImage
          referenceImage: scene.referenceImage?.startsWith("data:image/") ? void 0 : scene.referenceImage
        })),
        folders: state.folders,
        generationPrefs: state.generationPrefs,
        generationPrefsByProject: state.generationPrefsByProject
      }),
      merge: (persisted, current) => {
        if (!persisted) return current;
        const activeProjectId = useProjectStore.getState().activeProjectId;
        const mergedPrefsByProject = {
          ...current.generationPrefsByProject || {}
        };
        for (const [projectId, prefs] of Object.entries(persisted.generationPrefsByProject || {})) {
          mergedPrefsByProject[projectId] = normalizeGenerationPrefs(prefs);
        }
        const mergedPrefs = normalizeGenerationPrefs(
          persisted.generationPrefs || current.generationPrefs
        );
        if (activeProjectId) {
          mergedPrefsByProject[activeProjectId] = normalizeGenerationPrefs(
            mergedPrefsByProject[activeProjectId] || mergedPrefs
          );
        }
        return {
          ...current,
          scenes: (persisted.scenes ?? current.scenes).map((scene) => {
            const legacyScenePrompt = scene["visualPrompt"];
            const {
              ["visualPrompt"]: _discard,
              location: legacyLocation,
              ...cleanScene
            } = scene;
            return {
              ...cleanScene,
              description: cleanScene.description?.trim() || legacyLocation?.trim() || void 0,
              scenePrompt: scene.scenePrompt || legacyScenePrompt
            };
          }),
          folders: persisted.folders ?? current.folders,
          generationPrefs: mergedPrefs,
          generationPrefsByProject: mergedPrefsByProject
        };
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error || !state || !isElectron()) return;
          migrateBase64ToLocalImages(state);
        };
      }
    }
  )
);
async function migrateBase64ToLocalImages(state) {
  const { scenes, updateScene } = state;
  let migratedCount = 0;
  for (const scene of scenes) {
    if (scene.referenceImage && scene.referenceImage.startsWith("data:")) {
      try {
        const localPath = await saveImageToLocal(
          scene.referenceImage,
          "scenes",
          `ref-${scene.id}.png`
        );
        if (localPath.startsWith("local-image://")) {
          updateScene(scene.id, { referenceImage: localPath });
          migratedCount++;
        }
      } catch (err) {
        console.warn(`[Migration] Failed to migrate referenceImage for ${scene.id}:`, err);
      }
    }
  }
  if (migratedCount > 0) {
    console.log(`[Migration] Migrated ${migratedCount} scene images from base64 to local files`);
  }
}
const initialState$1 = {
  styles: [],
  folders: [],
  selectedStyleId: null,
  editingStyleId: null
};
const useCustomStyleStore = create()(
  persist(
    (set, get) => ({
      ...initialState$1,
      // Style CRUD
      addStyle: (styleData) => {
        const id = `custom_style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const newStyle = {
          ...styleData,
          id,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          styles: [...state.styles, newStyle]
        }));
        return id;
      },
      updateStyle: (id, updates) => {
        set((state) => ({
          styles: state.styles.map(
            (s) => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }));
      },
      deleteStyle: (id) => {
        set((state) => ({
          styles: state.styles.filter((s) => s.id !== id),
          selectedStyleId: state.selectedStyleId === id ? null : state.selectedStyleId,
          editingStyleId: state.editingStyleId === id ? null : state.editingStyleId
        }));
      },
      duplicateStyle: (id) => {
        const source = get().styles.find((s) => s.id === id);
        if (!source) return null;
        const newId = `custom_style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const copy = {
          ...source,
          id: newId,
          name: `${source.name} (Copy)`,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          styles: [...state.styles, copy]
        }));
        return newId;
      },
      // Folder CRUD
      addFolder: (name, parentId = null) => {
        const id = `stylefolder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newFolder = {
          id,
          name,
          parentId: parentId || null,
          createdAt: Date.now()
        };
        set((state) => ({
          folders: [...state.folders, newFolder]
        }));
        return id;
      },
      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map(
            (f) => f.id === id ? { ...f, name } : f
          )
        }));
      },
      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          // Move styles back to the root folder.
          styles: state.styles.map(
            (s) => s.folderId === id ? { ...s, folderId: null, updatedAt: Date.now() } : s
          )
        }));
      },
      // Selection
      selectStyle: (id) => set({ selectedStyleId: id }),
      setEditingStyle: (id) => set({ editingStyleId: id }),
      // Queries
      getStyleById: (id) => get().styles.find((s) => s.id === id),
      getStylesByFolder: (folderId) => get().styles.filter((s) => s.folderId === folderId),
      getAllStyles: () => get().styles,
      // Reset
      reset: () => set(initialState$1)
    }),
    {
      name: "longdd-custom-styles",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        styles: state.styles,
        folders: state.folders
      })
    }
  )
);
function inferCategoryFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (/\b(realistic|photorealistic|real\s?person|photography|real\s?life|cinematic\s?lighting.*skin)/.test(lower)) {
    return "real";
  }
  if (/(\u5199\u5b9e|\u771f\u4eba|\u5b9e\u666f|\u7535\u5f71\u7ea7|\u5b9e\u62cd|\u80f6\u7247|\u5267\u7167|\u65e0\s?CGI|\u76ae\u80a4\u7eb9\u7406|\u6bdb\u5b54)/.test(prompt)) {
    return "real";
  }
  if (/\b(3d|render|unreal\s?engine|c4d|blender|voxel|low\s?poly)/.test(lower)) {
    return "3d";
  }
  if (/(\u4e09\u7ef4|3D|\u6e32\u67d3|\u865a\u5e7b\u5f15\u64ce|\u5efa\u6a21)/.test(prompt)) {
    return "3d";
  }
  if (/\b(stop.?motion|claymation|puppet)/.test(lower) || /(\u5b9a\u683c|\u9ecf\u571f|\u6728\u5076)/.test(prompt)) {
    return "stop_motion";
  }
  return "none";
}
function inferMediaType(category) {
  switch (category) {
    case "real":
      return "cinematic";
    case "3d":
      return "cinematic";
    case "stop_motion":
      return "stop-motion";
    default:
      return "animation";
  }
}
registerCustomStyleLookup((id) => {
  const style = useCustomStyleStore.getState().styles.find((s) => s.id === id);
  if (!style) return void 0;
  const effectivePrompt = style.prompt || "";
  const category = inferCategoryFromPrompt(effectivePrompt);
  const mediaType = inferMediaType(category);
  const prompt = style.styleTokens || effectivePrompt || `${style.name} style, professional quality`;
  return {
    id: style.id,
    name: style.name,
    category,
    mediaType,
    prompt,
    negativePrompt: style.negativePrompt || "",
    description: style.description || "",
    thumbnail: ""
  };
});
function getProjectVisualStyleSnapshot(projectId) {
  const directorState = useDirectorStore.getState();
  const scriptState = useScriptStore.getState();
  const resolvedProjectId = projectId || directorState.activeProjectId || scriptState.activeProjectId || void 0;
  const styleId = (resolvedProjectId ? directorState.projects[resolvedProjectId]?.storyboardConfig?.visualStyleId || scriptState.projects[resolvedProjectId]?.styleId : void 0) || DEFAULT_STYLE_ID;
  const style = getStyleById(styleId) || getStyleById(DEFAULT_STYLE_ID);
  return {
    id: style?.id || DEFAULT_STYLE_ID,
    name: style?.name || "None / Skill Defined",
    prompt: style?.prompt?.trim() || "",
    negativePrompt: style?.negativePrompt?.trim() || ""
  };
}
function useProjectVisualStyleId() {
  const directorStyleId = useDirectorStore((state) => {
    const projectId = state.activeProjectId;
    return projectId ? state.projects[projectId]?.storyboardConfig?.visualStyleId : void 0;
  });
  const scriptStyleId = useScriptStore((state) => {
    const projectId = state.activeProjectId;
    return projectId ? state.projects[projectId]?.styleId : void 0;
  });
  if (directorStyleId && getStyleById(directorStyleId)) return directorStyleId;
  if (scriptStyleId && getStyleById(scriptStyleId)) return scriptStyleId;
  return DEFAULT_STYLE_ID;
}
function setProjectVisualStyleId(styleId) {
  const style = getStyleById(styleId);
  if (!style) return false;
  const directorState = useDirectorStore.getState();
  if (directorState.activeProjectId && directorState.projects[directorState.activeProjectId]) {
    directorState.setStoryboardConfig({
      visualStyleId: style.id,
      styleTokens: style.prompt ? [style.prompt] : []
    });
  }
  const scriptState = useScriptStore.getState();
  if (scriptState.activeProjectId) {
    scriptState.setStyleId(scriptState.activeProjectId, style.id);
  }
  return true;
}
class IndexedDBAdapter {
  dbName;
  storeName;
  version;
  constructor(dbName, storeName, version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }
  async getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }
  async get(key) {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  async set(key, value) {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve, reject) => {
      const request = store.put({ id: key, ...value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  async remove(key) {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  async list() {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  async clear() {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
class OPFSAdapter {
  directoryName;
  constructor(directoryName = "media") {
    this.directoryName = directoryName;
  }
  async getDirectory() {
    const opfsRoot = await navigator.storage.getDirectory();
    return await opfsRoot.getDirectoryHandle(this.directoryName, {
      create: true
    });
  }
  async get(key) {
    try {
      const directory = await this.getDirectory();
      const fileHandle = await directory.getFileHandle(key);
      return await fileHandle.getFile();
    } catch (error) {
      if (error.name === "NotFoundError") {
        return null;
      }
      throw error;
    }
  }
  async set(key, file) {
    const directory = await this.getDirectory();
    const fileHandle = await directory.getFileHandle(key, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
  }
  async remove(key) {
    try {
      const directory = await this.getDirectory();
      await directory.removeEntry(key);
    } catch (error) {
      if (error.name !== "NotFoundError") {
        throw error;
      }
    }
  }
  async list() {
    const directory = await this.getDirectory();
    const keys = [];
    for await (const name of directory.keys()) {
      keys.push(name);
    }
    return keys;
  }
  async clear() {
    const directory = await this.getDirectory();
    for await (const name of directory.keys()) {
      await directory.removeEntry(name);
    }
  }
  // Helper method to check OPFS support
  static isSupported() {
    return "storage" in navigator && "getDirectory" in navigator.storage;
  }
}
class StorageService {
  projectsAdapter;
  savedSoundsAdapter;
  config;
  constructor() {
    this.config = {
      projectsDb: "video-editor-projects",
      mediaDb: "video-editor-media",
      timelineDb: "video-editor-timelines",
      savedSoundsDb: "video-editor-saved-sounds",
      version: 1
    };
    this.projectsAdapter = new IndexedDBAdapter(
      this.config.projectsDb,
      "projects",
      this.config.version
    );
    this.savedSoundsAdapter = new IndexedDBAdapter(
      this.config.savedSoundsDb,
      "saved-sounds",
      this.config.version
    );
  }
  // Helper to get project-specific media adapters
  getProjectMediaAdapters({ projectId }) {
    const mediaMetadataAdapter = new IndexedDBAdapter(
      `${this.config.mediaDb}-${projectId}`,
      "media-metadata",
      this.config.version
    );
    const mediaFilesAdapter = new OPFSAdapter(`media-files-${projectId}`);
    return { mediaMetadataAdapter, mediaFilesAdapter };
  }
  // Helper to get project-specific timeline adapter
  getProjectTimelineAdapter({
    projectId,
    sceneId
  }) {
    const dbName = sceneId ? `${this.config.timelineDb}-${projectId}-${sceneId}` : `${this.config.timelineDb}-${projectId}`;
    return new IndexedDBAdapter(
      dbName,
      "timeline",
      this.config.version
    );
  }
  // Project operations
  async saveProject({ project }) {
    const serializedScenes = project.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      isMain: scene.isMain,
      createdAt: scene.createdAt.toISOString(),
      updatedAt: scene.updatedAt.toISOString()
    }));
    const serializedProject = {
      id: project.id,
      name: project.name,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      scenes: serializedScenes,
      currentSceneId: project.currentSceneId,
      backgroundColor: project.backgroundColor,
      backgroundType: project.backgroundType,
      blurIntensity: project.blurIntensity,
      bookmarks: project.bookmarks,
      fps: project.fps,
      canvasSize: project.canvasSize,
      canvasMode: project.canvasMode
    };
    await this.projectsAdapter.set(project.id, serializedProject);
  }
  async loadProject({ id }) {
    const serializedProject = await this.projectsAdapter.get(id);
    if (!serializedProject) return null;
    const scenes = serializedProject.scenes?.map((scene) => ({
      id: scene.id,
      name: scene.name,
      isMain: scene.isMain,
      createdAt: new Date(scene.createdAt),
      updatedAt: new Date(scene.updatedAt)
    })) || [];
    const project = {
      id: serializedProject.id,
      name: serializedProject.name,
      thumbnail: serializedProject.thumbnail,
      createdAt: new Date(serializedProject.createdAt),
      updatedAt: new Date(serializedProject.updatedAt),
      scenes,
      currentSceneId: serializedProject.currentSceneId || "",
      backgroundColor: serializedProject.backgroundColor,
      backgroundType: serializedProject.backgroundType,
      blurIntensity: serializedProject.blurIntensity,
      bookmarks: serializedProject.bookmarks,
      fps: serializedProject.fps,
      canvasSize: serializedProject.canvasSize,
      canvasMode: serializedProject.canvasMode
    };
    return project;
  }
  async loadAllProjects() {
    const projectIds = await this.projectsAdapter.list();
    const projects = [];
    for (const id of projectIds) {
      const project = await this.loadProject({ id });
      if (project) {
        projects.push(project);
      }
    }
    return projects.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }
  async deleteProject({ id }) {
    try {
      await Promise.all([
        this.deleteProjectMedia({ projectId: id }),
        this.deleteProjectTimeline({ projectId: id })
      ]);
    } catch (err) {
      console.warn(`[StorageService] Failed to clean project-linked data for ${id}:`, err);
    }
    await this.projectsAdapter.remove(id);
  }
  // Media operations
  async saveMediaFile({
    projectId,
    mediaItem
  }) {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });
    const file = mediaItem.file;
    if (!file) {
      return;
    }
    await mediaFilesAdapter.set(mediaItem.id, file);
    const metadata = {
      id: mediaItem.id,
      name: mediaItem.name,
      type: mediaItem.type,
      size: file.size,
      lastModified: file.lastModified,
      width: mediaItem.width,
      height: mediaItem.height,
      duration: mediaItem.duration,
      ephemeral: mediaItem.ephemeral
    };
    await mediaMetadataAdapter.set(mediaItem.id, metadata);
  }
  async loadMediaFile({
    projectId,
    id
  }) {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });
    const [file, metadata] = await Promise.all([
      mediaFilesAdapter.get(id),
      mediaMetadataAdapter.get(id)
    ]);
    if (!file || !metadata) return null;
    let url;
    if (metadata.type === "image" && (!file.type || file.type === "")) {
      try {
        const text = await file.text();
        if (text.trim().startsWith("<svg")) {
          const svgBlob = new Blob([text], { type: "image/svg+xml" });
          url = URL.createObjectURL(svgBlob);
        } else {
          url = URL.createObjectURL(file);
        }
      } catch {
        url = URL.createObjectURL(file);
      }
    } else {
      url = URL.createObjectURL(file);
    }
    return {
      id: metadata.id,
      name: metadata.name,
      type: metadata.type,
      file,
      url,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      ephemeral: metadata.ephemeral
    };
  }
  async loadAllMediaFiles({
    projectId
  }) {
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
      projectId
    });
    const mediaIds = await mediaMetadataAdapter.list();
    const mediaItems = [];
    for (const id of mediaIds) {
      const item = await this.loadMediaFile({ projectId, id });
      if (item) {
        mediaItems.push(item);
      }
    }
    return mediaItems;
  }
  async deleteMediaFile({
    projectId,
    id
  }) {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });
    await Promise.all([
      mediaFilesAdapter.remove(id),
      mediaMetadataAdapter.remove(id)
    ]);
  }
  async deleteProjectMedia({
    projectId
  }) {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });
    await Promise.all([
      mediaMetadataAdapter.clear(),
      mediaFilesAdapter.clear()
    ]);
  }
  // Timeline operations - supports both legacy and scene-based storage
  async saveTimeline({
    projectId,
    tracks,
    sceneId
  }) {
    const timelineAdapter = this.getProjectTimelineAdapter({
      projectId,
      sceneId
    });
    const timelineData = {
      tracks,
      lastModified: (/* @__PURE__ */ new Date()).toISOString()
    };
    await timelineAdapter.set("timeline", timelineData);
  }
  async loadTimeline({
    projectId,
    sceneId
  }) {
    const timelineAdapter = this.getProjectTimelineAdapter({
      projectId,
      sceneId
    });
    const timelineData = await timelineAdapter.get("timeline");
    return timelineData ? timelineData.tracks : null;
  }
  async deleteProjectTimeline({
    projectId
  }) {
    const timelineAdapter = this.getProjectTimelineAdapter({ projectId });
    await timelineAdapter.remove("timeline");
  }
  // Utility methods
  async clearAllData() {
    try {
      const projectIds = await this.projectsAdapter.list();
      await Promise.all(
        projectIds.map(
          (id) => Promise.all([
            this.deleteProjectMedia({ projectId: id }).catch(() => {
            }),
            this.deleteProjectTimeline({ projectId: id }).catch(() => {
            })
          ])
        )
      );
    } catch (err) {
      console.warn("[StorageService] Failed to clean linked data:", err);
    }
    await this.projectsAdapter.clear();
  }
  async getStorageInfo() {
    const projectIds = await this.projectsAdapter.list();
    return {
      projects: projectIds.length,
      isOPFSSupported: this.isOPFSSupported(),
      isIndexedDBSupported: this.isIndexedDBSupported()
    };
  }
  async getProjectStorageInfo({ projectId }) {
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
      projectId
    });
    const timelineAdapter = this.getProjectTimelineAdapter({ projectId });
    const [mediaIds, timelineData] = await Promise.all([
      mediaMetadataAdapter.list(),
      timelineAdapter.get("timeline")
    ]);
    return {
      mediaItems: mediaIds.length,
      hasTimeline: !!timelineData
    };
  }
  async loadSavedSounds() {
    try {
      const savedSoundsData = await this.savedSoundsAdapter.get("user-sounds");
      return savedSoundsData || {
        sounds: [],
        lastModified: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Failed to load saved sounds:", error);
      return { sounds: [], lastModified: (/* @__PURE__ */ new Date()).toISOString() };
    }
  }
  async saveSoundEffect({
    soundEffect
  }) {
    try {
      const currentData = await this.loadSavedSounds();
      if (currentData.sounds.some((sound) => sound.id === soundEffect.id)) {
        return;
      }
      const savedSound = {
        id: soundEffect.id,
        name: soundEffect.name,
        username: soundEffect.username,
        previewUrl: soundEffect.previewUrl,
        downloadUrl: soundEffect.downloadUrl,
        duration: soundEffect.duration,
        tags: soundEffect.tags,
        license: soundEffect.license,
        savedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const updatedData = {
        sounds: [...currentData.sounds, savedSound],
        lastModified: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.savedSoundsAdapter.set("user-sounds", updatedData);
    } catch (error) {
      console.error("Failed to save sound effect:", error);
      throw error;
    }
  }
  async removeSavedSound({ soundId }) {
    try {
      const currentData = await this.loadSavedSounds();
      const updatedData = {
        sounds: currentData.sounds.filter((sound) => sound.id !== soundId),
        lastModified: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.savedSoundsAdapter.set("user-sounds", updatedData);
    } catch (error) {
      console.error("Failed to remove saved sound:", error);
      throw error;
    }
  }
  async isSoundSaved({ soundId }) {
    try {
      const currentData = await this.loadSavedSounds();
      return currentData.sounds.some((sound) => sound.id === soundId);
    } catch (error) {
      console.error("Failed to check if sound is saved:", error);
      return false;
    }
  }
  async clearSavedSounds() {
    try {
      await this.savedSoundsAdapter.remove("user-sounds");
    } catch (error) {
      console.error("Failed to clear saved sounds:", error);
      throw error;
    }
  }
  // Check browser support
  isOPFSSupported() {
    return OPFSAdapter.isSupported();
  }
  isIndexedDBSupported() {
    return "indexedDB" in window;
  }
  isFullySupported() {
    return this.isIndexedDBSupported() && this.isOPFSSupported();
  }
}
const storageService = new StorageService();
function splitMediaData(state, pid) {
  return {
    projectData: {
      folders: state.folders.filter((f) => f.projectId === pid && !f.isSystem),
      mediaFiles: state.mediaFiles.filter((f) => f.projectId === pid)
    },
    sharedData: {
      folders: state.folders.filter((f) => f.isSystem || !f.projectId && !f.isAutoCreated),
      mediaFiles: state.mediaFiles.filter((f) => !f.projectId)
    }
  };
}
function mergeMediaData(projectData, sharedData) {
  return {
    folders: [
      ...sharedData?.folders ?? [],
      ...projectData?.folders ?? []
    ],
    mediaFiles: [
      ...sharedData?.mediaFiles ?? [],
      ...projectData?.mediaFiles ?? []
    ]
  };
}
const SYSTEM_CATEGORIES = [
  { category: "ai-image", name: "AI Images", icon: "Sparkles" },
  { category: "ai-video", name: "AI Videos", icon: "Film" },
  { category: "upload", name: "Uploads", icon: "CloudUpload" }
];
const getFileType = (file) => {
  const { type } = file;
  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }
  return null;
};
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.addEventListener("load", () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      resolve({ width, height });
      img.remove();
      URL.revokeObjectURL(objectUrl);
    });
    img.addEventListener("error", () => {
      reject(new Error("Could not load image"));
      img.remove();
      URL.revokeObjectURL(objectUrl);
    });
    img.src = objectUrl;
  });
};
const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(1, video.duration * 0.1);
    });
    const objectUrl = URL.createObjectURL(file);
    video.addEventListener("seeked", () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
      const width = video.videoWidth;
      const height = video.videoHeight;
      resolve({ thumbnailUrl, width, height });
      video.remove();
      canvas.remove();
      URL.revokeObjectURL(objectUrl);
    });
    video.addEventListener("error", () => {
      reject(new Error("Could not load video"));
      video.remove();
      canvas.remove();
      URL.revokeObjectURL(objectUrl);
    });
    video.src = objectUrl;
    video.load();
  });
};
const getMediaDuration = (file) => {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio"
    );
    const objectUrl = URL.createObjectURL(file);
    element.addEventListener("loadedmetadata", () => {
      resolve(element.duration);
      element.remove();
      URL.revokeObjectURL(objectUrl);
    });
    element.addEventListener("error", () => {
      reject(new Error("Could not load media"));
      element.remove();
      URL.revokeObjectURL(objectUrl);
    });
    element.src = objectUrl;
    element.load();
  });
};
const useMediaStore = create()(
  persist(
    (set, get) => ({
      mediaFiles: [],
      folders: [],
      currentFolderId: null,
      isLoading: false,
      addMediaFile: async (projectId, file) => {
        const newItem = {
          ...file,
          id: generateUUID(),
          projectId
        };
        set((state) => ({
          mediaFiles: [...state.mediaFiles, newItem]
        }));
        try {
          if (newItem.file) {
            await storageService.saveMediaFile({ projectId, mediaItem: newItem });
          }
        } catch (error) {
          console.error("Failed to save media item to OPFS:", error);
        }
        if (isElectron() && newItem.file && (newItem.type === "image" || newItem.type === "video")) {
          (async () => {
            try {
              const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(newItem.file);
              });
              const category = newItem.type === "video" ? "videos" : "shots";
              const ext = newItem.type === "video" ? ".mp4" : ".png";
              const filename = `upload_${newItem.name.replace(/[^a-zA-Z0-9.]/g, "_")}_${Date.now()}${ext}`;
              const localPath = await saveImageToLocal(dataUrl, category, filename);
              if (localPath !== dataUrl && localPath.startsWith("local-image://")) {
                set((state) => ({
                  mediaFiles: state.mediaFiles.map(
                    (f) => f.id === newItem.id ? { ...f, url: localPath } : f
                  )
                }));
                console.log("[MediaStore] Upload saved locally:", localPath);
              }
              if (newItem.type === "video" && newItem.thumbnailUrl && newItem.thumbnailUrl.startsWith("data:")) {
                const thumbFilename = `upload_thumb_${Date.now()}.png`;
                const thumbLocalPath = await saveImageToLocal(newItem.thumbnailUrl, category, thumbFilename);
                if (thumbLocalPath !== newItem.thumbnailUrl && thumbLocalPath.startsWith("local-image://")) {
                  set((state) => ({
                    mediaFiles: state.mediaFiles.map(
                      (f) => f.id === newItem.id ? { ...f, thumbnailUrl: thumbLocalPath } : f
                    )
                  }));
                }
              }
            } catch (error) {
              console.warn("[MediaStore] Failed to save upload locally:", error);
            }
          })();
        }
        return newItem;
      },
      removeMediaFile: async (projectId, id) => {
        const state = get();
        const item = state.mediaFiles.find((media) => media.id === id);
        if (item?.url) {
          URL.revokeObjectURL(item.url);
          if (item.thumbnailUrl) {
            URL.revokeObjectURL(item.thumbnailUrl);
          }
        }
        set((state2) => ({
          mediaFiles: state2.mediaFiles.filter((media) => media.id !== id)
        }));
        try {
          await storageService.deleteMediaFile({ projectId, id });
        } catch (error) {
          console.error("Failed to delete media item:", error);
        }
      },
      loadProjectMedia: async (projectId) => {
        set({ isLoading: true });
        try {
          const mediaItems = await storageService.loadAllMediaFiles({ projectId });
          const updatedMediaItems = await Promise.all(
            mediaItems.map(async (item) => {
              if (item.type === "video" && item.file) {
                try {
                  const { thumbnailUrl, width, height } = await generateVideoThumbnail(item.file);
                  return {
                    ...item,
                    thumbnailUrl,
                    width: width || item.width,
                    height: height || item.height
                  };
                } catch (error) {
                  console.error(
                    `Failed to regenerate thumbnail for video ${item.id}:`,
                    error
                  );
                  return item;
                }
              }
              return item;
            })
          );
          const scopedMediaItems = updatedMediaItems.map((item) => ({
            ...item,
            projectId
          }));
          set({ mediaFiles: scopedMediaItems });
        } catch (error) {
          console.error("Failed to load media items:", error);
        } finally {
          set({ isLoading: false });
        }
      },
      clearProjectMedia: async (projectId) => {
        const state = get();
        const projectFiles = state.mediaFiles.filter((item) => item.projectId === projectId);
        const otherFiles = state.mediaFiles.filter((item) => item.projectId !== projectId);
        projectFiles.forEach((item) => {
          if (item.url) {
            URL.revokeObjectURL(item.url);
          }
          if (item.thumbnailUrl) {
            URL.revokeObjectURL(item.thumbnailUrl);
          }
        });
        set({ mediaFiles: otherFiles });
        try {
          const mediaIds = projectFiles.map((item) => item.id);
          await Promise.all(
            mediaIds.map((id) => storageService.deleteMediaFile({ projectId, id }))
          );
        } catch (error) {
          console.error("Failed to clear media items from storage:", error);
        }
      },
      clearAllMedia: () => {
        const state = get();
        state.mediaFiles.forEach((item) => {
          if (item.url) {
            URL.revokeObjectURL(item.url);
          }
          if (item.thumbnailUrl) {
            URL.revokeObjectURL(item.thumbnailUrl);
          }
        });
        set({ mediaFiles: [], folders: [], currentFolderId: null });
      },
      // Folder management
      addFolder: (name, parentId = null, projectId) => {
        const id = generateUUID();
        const newFolder = {
          id,
          name,
          parentId: parentId ?? null,
          projectId,
          isAutoCreated: !!projectId,
          createdAt: Date.now()
        };
        set((state) => ({
          folders: [...state.folders, newFolder]
        }));
        return id;
      },
      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map(
            (f) => f.id === id ? { ...f, name } : f
          )
        }));
      },
      deleteFolder: (id) => {
        const { folders, mediaFiles } = get();
        const target = folders.find((f) => f.id === id);
        if (target?.isSystem) return;
        const getDescendantIds = (folderId) => {
          const children = folders.filter((f) => f.parentId === folderId);
          return [folderId, ...children.flatMap((c) => getDescendantIds(c.id))];
        };
        const folderIdsToDelete = getDescendantIds(id);
        const updatedFiles = mediaFiles.map(
          (f) => folderIdsToDelete.includes(f.folderId || "") ? { ...f, folderId: null } : f
        );
        set({
          folders: folders.filter((f) => !folderIdsToDelete.includes(f.id)),
          mediaFiles: updatedFiles,
          currentFolderId: folderIdsToDelete.includes(get().currentFolderId || "") ? null : get().currentFolderId
        });
      },
      setCurrentFolder: (id) => {
        set({ currentFolderId: id });
      },
      // File management
      renameMediaFile: (id, name) => {
        set((state) => ({
          mediaFiles: state.mediaFiles.map(
            (f) => f.id === id ? { ...f, name } : f
          )
        }));
      },
      moveToFolder: (mediaId, folderId) => {
        set((state) => ({
          mediaFiles: state.mediaFiles.map(
            (f) => f.id === mediaId ? { ...f, folderId } : f
          )
        }));
      },
      // AI generated content - add from URL without File object
      addMediaFromUrl: ({ url, name, type, source, thumbnailUrl, duration, folderId, projectId }) => {
        const id = generateUUID();
        const newItem = {
          id,
          name,
          type,
          url,
          thumbnailUrl,
          duration,
          source,
          folderId: folderId ?? null,
          projectId,
          file: null
          // No file object for URL-based media
        };
        const isTemporaryUrl = (value) => Boolean(value && (value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("http")));
        const shouldPersistFirst = (type === "image" || type === "video") && isTemporaryUrl(url);
        if (!shouldPersistFirst) {
          set((state) => ({
            mediaFiles: [...state.mediaFiles, newItem]
          }));
        }
        if ((type === "image" || type === "video") && url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"))) {
          (async () => {
            try {
              const category = type === "video" ? "videos" : "shots";
              const ext = type === "video" ? ".mp4" : ".png";
              const filename = `${name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}${ext}`;
              const localPath = await saveImageToLocal(url, category, filename);
              let nextUrl = url;
              let nextThumbnailUrl = thumbnailUrl;
              if (localPath !== url && localPath.startsWith("local-image://")) {
                nextUrl = localPath;
                console.log(`[MediaStore] Saved ${type} locally:`, localPath);
              }
              if (thumbnailUrl && thumbnailUrl.startsWith("data:")) {
                const thumbFilename = `thumb_${name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;
                const thumbLocalPath = await saveImageToLocal(thumbnailUrl, category, thumbFilename);
                if (thumbLocalPath !== thumbnailUrl && thumbLocalPath.startsWith("local-image://")) {
                  nextThumbnailUrl = thumbLocalPath;
                  console.log(`[MediaStore] Saved thumbnail locally:`, thumbLocalPath);
                }
              }
              const persistedItem = { ...newItem, url: nextUrl, thumbnailUrl: nextThumbnailUrl };
              set((state) => {
                const exists = state.mediaFiles.some((f) => f.id === id);
                return {
                  mediaFiles: exists ? state.mediaFiles.map((f) => f.id === id ? persistedItem : f) : [...state.mediaFiles, persistedItem]
                };
              });
            } catch (error) {
              console.warn("[MediaStore] Background save failed:", error);
              if (!shouldPersistFirst) return;
              set((state) => ({
                mediaFiles: [...state.mediaFiles, newItem]
              }));
            }
          })();
        }
        return id;
      },
      // Get or create a system category folder
      getOrCreateCategoryFolder: (category) => {
        const { folders } = get();
        const existing = folders.find((f) => f.isSystem && f.category === category);
        if (existing) return existing.id;
        const catDef = SYSTEM_CATEGORIES.find((c) => c.category === category);
        const name = catDef?.name || category;
        const id = generateUUID();
        const newFolder = {
          id,
          name,
          parentId: null,
          isSystem: true,
          category,
          createdAt: Date.now()
        };
        set((state) => ({
          folders: [...state.folders, newFolder]
        }));
        return id;
      },
      // Initialize system folders on startup
      initSystemFolders: () => {
        const { folders } = get();
        const newFolders = [];
        for (const cat of SYSTEM_CATEGORIES) {
          const exists = folders.find((f) => f.isSystem && f.category === cat.category);
          if (!exists) {
            newFolders.push({
              id: generateUUID(),
              name: cat.name,
              parentId: null,
              isSystem: true,
              category: cat.category,
              createdAt: Date.now()
            });
          }
        }
        const legacyAiFolder = folders.find((f) => f.name === "AI-generated" && !f.isSystem && f.parentId === null);
        if (legacyAiFolder) {
          const hasAiImageFolder = folders.find((f) => f.isSystem && f.category === "ai-image") || newFolders.find((f) => f.category === "ai-image");
          if (!hasAiImageFolder) {
            set((state) => ({
              folders: state.folders.map(
                (f) => f.id === legacyAiFolder.id ? { ...f, name: "AI Images", isSystem: true, category: "ai-image", projectId: void 0 } : f
              )
            }));
            const idx = newFolders.findIndex((f) => f.category === "ai-image");
            if (idx >= 0) newFolders.splice(idx, 1);
          }
        }
        if (newFolders.length > 0) {
          set((state) => ({
            folders: [...state.folders, ...newFolders]
          }));
          console.log("[MediaStore] Initialized system folders:", newFolders.map((f) => f.name).join(", "));
        }
      },
      // Assign missing projectId to current project (for isolation toggle)
      // System folders are excluded — they belong globally
      assignProjectToUnscoped: (projectId) => {
        set((state) => ({
          mediaFiles: state.mediaFiles.map(
            (media) => media.projectId ? media : { ...media, projectId }
          ),
          folders: state.folders.map(
            (folder) => folder.projectId || folder.isSystem ? folder : { ...folder, projectId }
          )
        }));
      }
    }),
    {
      name: "longdd-media-store",
      storage: createJSONStorage(() => createSplitStorage(
        "media",
        splitMediaData,
        mergeMediaData,
        "shareMedia",
        true
      )),
      partialize: (state) => ({
        // Persist folders and media metadata (not File objects or ephemeral URLs)
        folders: state.folders,
        mediaFiles: state.mediaFiles.filter((f) => !f.ephemeral).map((f) => {
          const normalizeUrl = (url) => {
            if (!url) return void 0;
            if (Array.isArray(url)) return url[0] || void 0;
            if (typeof url === "string") return url;
            return void 0;
          };
          const normalizedUrl = normalizeUrl(f.url);
          const normalizedThumbnail = normalizeUrl(f.thumbnailUrl);
          const isTransientUrl = (u) => !u || u.startsWith("blob:") || u.startsWith("data:");
          return {
            ...f,
            file: void 0,
            // Don't persist File objects
            url: isTransientUrl(normalizedUrl) ? void 0 : normalizedUrl,
            thumbnailUrl: isTransientUrl(normalizedThumbnail) ? void 0 : normalizedThumbnail
          };
        })
      }),
      merge: (persisted, current) => {
        if (!persisted) return current;
        return {
          ...current,
          folders: persisted.folders ?? current.folders,
          mediaFiles: persisted.mediaFiles ?? current.mediaFiles
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.initSystemFolders();
        migrateMediaDataUrls(state);
      }
    }
  )
);
async function migrateMediaDataUrls(state) {
  const filesToMigrate = state.mediaFiles.filter(
    (f) => f.url && f.url.startsWith("data:") || f.thumbnailUrl && f.thumbnailUrl.startsWith("data:")
  );
  if (filesToMigrate.length === 0) return;
  console.log(`[MediaStore] Migrating ${filesToMigrate.length} media files with data: URLs...`);
  for (const file of filesToMigrate) {
    try {
      if (file.url && file.url.startsWith("data:")) {
        const category = file.type === "video" ? "videos" : "shots";
        const ext = file.type === "video" ? ".mp4" : ".png";
        const filename = `migrated_${file.id.substring(0, 8)}_${Date.now()}${ext}`;
        const localPath = await saveImageToLocal(file.url, category, filename);
        if (localPath !== file.url && localPath.startsWith("local-image://")) {
          useMediaStore.setState((s) => ({
            mediaFiles: s.mediaFiles.map(
              (f) => f.id === file.id ? { ...f, url: localPath } : f
            )
          }));
        }
      }
      if (file.thumbnailUrl && file.thumbnailUrl.startsWith("data:")) {
        const category = file.type === "video" ? "videos" : "shots";
        const filename = `migrated_thumb_${file.id.substring(0, 8)}_${Date.now()}.png`;
        const localPath = await saveImageToLocal(file.thumbnailUrl, category, filename);
        if (localPath !== file.thumbnailUrl && localPath.startsWith("local-image://")) {
          useMediaStore.setState((s) => ({
            mediaFiles: s.mediaFiles.map(
              (f) => f.id === file.id ? { ...f, thumbnailUrl: localPath } : f
            )
          }));
        }
      }
    } catch (error) {
      console.warn(`[MediaStore] Failed to migrate media ${file.id}:`, error);
    }
  }
  console.log("[MediaStore] Migration complete.");
}
function cleanJsonString(str) {
  if (!str) return "{}";
  let cleaned = str;
  cleaned = cleaned.replace(/```json\s*/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");
  cleaned = cleaned.trim();
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    if (firstBracket === -1 || firstBrace < firstBracket) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  return cleaned;
}
function safeParseJson(str, fallback) {
  try {
    const cleaned = cleanJsonString(str);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[JSON Parse Error]", error);
    return fallback;
  }
}
const DEFAULT_IMAGE_MODEL = "GEM_PIX_2";
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_LONG_FORM_THRESHOLD_MINUTES = 8;
const AUTOPILOT_WRITER_SYSTEM_PROMPT = `Bạn là biên kịch phim tài liệu chuyên nghiệp.

Viết kịch bản tiếng Việt chỉ gồm những khối nội dung sau:
Cảnh N
Hình ảnh: mô tả ngắn ý tưởng hình ảnh
Thuyết minh: lời đọc hoàn chỉnh của cảnh

Yêu cầu:
- Mở bằng một hook mạnh trong câu đầu tiên.
- Lời thuyết minh tự nhiên, chính xác, liền mạch và đủ nghĩa khi ghép thành một audio duy nhất.
- Mỗi dòng Thuyết minh phải chứa lời đọc thật; không để trống và không trộn chỉ dẫn hình ảnh vào lời đọc.
- Không xuất JSON hoặc Markdown code fence.`;
const AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT = `You are a documentary visual director and prompt engineer.

The supplied narration beats and their timestamps are LOCKED. Return exactly one visual plan item for every beat. Never rewrite, summarize, merge, omit, or return narration/timing.

Return strictly valid JSON only:
{
  "characters": [
    {
      "name": "canonical name",
      "description": "brief role in this documentary",
      "characterPrompt": "English reusable visible identity description"
    }
  ],
  "scenes": [
    {
      "name": "canonical scene name",
      "description": "brief stable location descriptor",
      "scenePrompt": "English reusable environment-only reference prompt"
    }
  ],
  "shots": [
    {
      "beatIndex": 1,
      "sceneName": "short scene label",
      "characterNames": ["exact character name when visible"],
      "imagePrompt": "English static first-frame prompt",
      "videoPrompt": "English motion-only image-to-video prompt, or empty string to keep this shot a static image",
      "realImageQuery": "specific broad-web image search query, or empty string",
      "transitionToNext": "none | fade | dissolve | fade_black | fade_white | wipe_left | wipe_right | wipe_up | wipe_down | slide_left | slide_right | smooth_left | smooth_right | circle_open | circle_close | pixelize | zoom_in"
    }
  ]
}

Rules:
- Detect recurring visible subjects that require identity continuity. Follow the creative skill when it defines stylized, faceless, non-human, or human characters. Do not create characters for crowds, places, logos, or one-off generic subjects.
- characterNames must use exact names from characters. Use an empty array for shots without a recurring defined subject.
- characterPrompt must lock stable visible construction and identity markers; no scene/background and no text.
- scenes contains only reusable environments requested by the creative skill. scenePrompt describes an empty environment with stable camera-neutral layout, no characters, no temporary action, and no text.
- sceneName in every shot must exactly match a scenes.name when scenes are returned. Use an empty scenes array only when the creative skill does not require scene references.
- imagePrompt describes only the first frame, composition, subjects, lighting and visual treatment.
- Default imagePrompt to no visible text, typography, letters, numbers, logos, signage, or watermarks. Allow one exact short phrase only when a date, statistic, quote, map label, document title, or chapter card is essential to the beat. Never add decorative headlines.
- videoPrompt describes one continuous camera move and coherent motion only; do not repeat the full appearance.
- Leave videoPrompt as an empty string when a shot should stay a static still. AutoPilot then animates the frame with a Ken Burns move instead of generating an AI video.
- realImageQuery must be an empty string unless REAL IMAGE RESEARCH POLICY in the user prompt is ENABLED. Never infer permission merely because narration mentions a real person, event, place, product, building, document, or object.
- When the policy is ENABLED, follow the creative skill's own research rules. Use a precise query only for shots the skill explicitly justifies; otherwise leave it empty. The real image is supplied before frame generation as an editorial insert, not automatically full-screen.
- transitionToNext directs the edit into the following beat. Use none for an intentional hard cut; otherwise choose a restrained transition that supports the narration. The final shot must use none.
- For Vox editing, prefer hard cuts, dissolve, wipe, slide, and smooth directional transitions. Use fade_black/fade_white for chapter or time changes. Reserve circle, pixelize, and zoom_in for rare emphasis. Never repeat a flashy transition on adjacent cuts.
- Preserve the requested creative skill consistently across all shots.
- Produce no episodes array, no narration/timing fields, no Markdown, and no extra prose.`;
const AUTOPILOT_LONG_FORM_BIBLE_SYSTEM_PROMPT = `You are the lead director of a long-form documentary. Build one compact continuity bible that every chapter planner must obey.

Return strictly valid JSON only:
{
  "storyArc": "one concise arc",
  "visualTheme": "one authoritative visual language",
  "palette": ["color"],
  "characterRules": ["stable identity rule"],
  "locationRules": ["recurring location rule"],
  "motionRules": ["camera and motion rule"],
  "transitionRules": ["editing rule"],
  "researchRules": ["when factual imagery is justified"],
  "terminology": {"canonical term": "required spelling"}
}

Keep the bible reusable across the entire film. Do not create shots, rewrite narration, or output Markdown.`;
function buildAutopilotWriterUserPrompt(topic, style, skill) {
  return `Chủ đề video: ${topic}
${style ? `
Ghi chú phong cách:
${style}` : ""}
${skill ? `
Quy tắc skill cần áp dụng:
${skill.slice(0, 14e3)}` : ""}

Viết kịch bản theo đúng cấu trúc được yêu cầu.`;
}
function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 20) : [];
}
function normalizeLongFormBible(value) {
  const record = value && typeof value === "object" ? value : {};
  const terminologySource = record.terminology && typeof record.terminology === "object" ? record.terminology : {};
  return {
    storyArc: String(record.storyArc || "Hook, context, escalation, turning point, payoff").trim(),
    visualTheme: String(record.visualTheme || "Cinematic editorial documentary with consistent composition and texture").trim(),
    palette: normalizeStringArray(record.palette),
    characterRules: normalizeStringArray(record.characterRules),
    locationRules: normalizeStringArray(record.locationRules),
    motionRules: normalizeStringArray(record.motionRules),
    transitionRules: normalizeStringArray(record.transitionRules),
    researchRules: normalizeStringArray(record.researchRules),
    terminology: Object.fromEntries(
      Object.entries(terminologySource).map(([key, item]) => [key.trim(), String(item || "").trim()]).filter(([key, item]) => key && item).slice(0, 50)
    )
  };
}
function safeFileName(value) {
  return value.trim().replace(/[^a-zA-Z0-9\u00C0-\u024F_-]+/g, "_").replace(/^_+|_+$/g, "") || "autopilot";
}
function toFlowDuration(durationMs) {
  if (durationMs <= 4e3) return 4;
  if (durationMs <= 6e3) return 6;
  return 8;
}
function parsePlannerResponse(response) {
  const cleaned = cleanJsonString(response);
  const parsed = safeParseJson(cleaned, null);
  if (Array.isArray(parsed)) return { shots: parsed, characters: [], scenes: [] };
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.shots)) {
    const record = parsed;
    return {
      shots: record.shots,
      characters: Array.isArray(record.characters) ? record.characters : [],
      scenes: Array.isArray(record.scenes) ? record.scenes : []
    };
  }
  const items = [];
  const objectPattern = /\{[^{}]*"beatIndex"\s*:\s*\d+[^{}]*\}/gu;
  for (const match of cleaned.matchAll(objectPattern)) {
    const item = safeParseJson(match[0], {});
    if (item.beatIndex) items.push(item);
  }
  return { shots: items, characters: [], scenes: [] };
}
function fallbackPlannerItem(beat, aspectRatio, style) {
  const visualStyle = style?.trim() || "cinematic editorial documentary";
  return {
    beatIndex: beat.index,
    sceneName: `Beat ${beat.index}`,
    imagePrompt: `${visualStyle}. Static first frame illustrating: ${beat.text}. Clear editorial composition, strong subject separation, ${aspectRatio} aspect ratio.`,
    videoPrompt: "One smooth continuous slow push-in. Subtle coherent subject and environmental motion, stable composition, natural easing, then gently settles.",
    transitionToNext: ["dissolve", "wipe_left", "fade", "smooth_right", "slide_left"][beat.index % 5]
  };
}
const AUTOPILOT_TRANSITIONS = /* @__PURE__ */ new Set([
  "none",
  "fade",
  "fade_slow",
  "dip_white",
  "flash_white",
  "dissolve",
  "fade_black",
  "fade_white",
  "wipe_left",
  "wipe_right",
  "wipe_up",
  "wipe_down",
  "slide_left",
  "slide_right",
  "smooth_left",
  "smooth_right",
  "circle_open",
  "circle_close",
  "pixelize",
  "zoom_in"
]);
function normalizeTransition(value, index, total) {
  if (index === total - 1) return "none";
  if (typeof value === "string" && AUTOPILOT_TRANSITIONS.has(value)) {
    return value;
  }
  const fallbacks = ["dissolve", "wipe_left", "fade", "smooth_right", "slide_left"];
  return fallbacks[index % fallbacks.length];
}
function skillAllowsRealImageResearch(skill) {
  const value = String(skill || "");
  const explicitPolicy = /^\s*AUTOPILOT_REAL_IMAGE_RESEARCH\s*:\s*(enabled|disabled|true|false|yes|no)\s*$/im.exec(value)?.[1]?.toLocaleLowerCase();
  if (explicitPolicy) return ["enabled", "true", "yes"].includes(explicitPolicy);
  return /^##\s+Real-image research\s*$/im.test(value) && /realImageQuery/i.test(value);
}
const TARGET_BEAT_MS = 5e3;
const MIN_BEAT_MS = 2500;
const MAX_BEAT_MS = 7e3;
function cleanNarrationText(value) {
  return value.replace(/^\s*["“”']|["“”']\s*$/g, "").replace(/\s+/g, " ").trim();
}
function extractNarrationBlocks(scriptText) {
  const lines = scriptText.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let collecting = false;
  let current = [];
  const flush = () => {
    const text = cleanNarrationText(current.join(" "));
    if (text) blocks.push(text);
    current = [];
  };
  for (const rawLine of lines) {
    const line = rawLine.replace(/\*\*/g, "").trim();
    const narration = line.match(/^(?:thuyết\s*minh|lời\s*dẫn|narration|voice[-\s]?over)\s*:\s*(.*)$/iu);
    if (narration) {
      if (collecting) flush();
      collecting = true;
      if (narration[1]) current.push(narration[1]);
      continue;
    }
    if (/^(?:cảnh|scene)\s*\d+|^(?:hình\s*ảnh|visual)\s*:/iu.test(line)) {
      if (collecting) flush();
      collecting = false;
      continue;
    }
    if (collecting && line) current.push(line);
  }
  if (collecting) flush();
  if (blocks.length > 0) return blocks;
  return scriptText.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((part) => cleanNarrationText(part.replace(/^#+\s*/gm, ""))).filter((part) => part.length > 0 && !/^(?:cảnh|scene|hình ảnh|visual)\b/iu.test(part));
}
function wordCount(text) {
  return Math.max(1, text.trim().split(/\s+/u).filter(Boolean).length);
}
function splitText(text, parts) {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (parts <= 1 || words.length <= 1) return [text.trim()];
  const result = [];
  for (let i = 0; i < parts; i += 1) {
    const start = Math.round(i / parts * words.length);
    const end = Math.round((i + 1) / parts * words.length);
    const chunk = words.slice(start, Math.max(start + 1, end)).join(" ").trim();
    if (chunk) result.push(chunk);
  }
  return result;
}
function splitLongSegment(segment) {
  const duration = Math.max(1, segment.endMs - segment.startMs);
  const parts = Math.max(1, Math.ceil(duration / MAX_BEAT_MS));
  if (parts === 1) return [segment];
  const texts = splitText(segment.text, parts);
  return texts.map((text, index) => ({
    index,
    startMs: Math.round(segment.startMs + duration * index / texts.length),
    endMs: Math.round(segment.startMs + duration * (index + 1) / texts.length),
    text
  }));
}
function mergeToVisualBeats(segments) {
  const expanded = segments.flatMap(splitLongSegment).filter((seg) => seg.text.trim() && seg.endMs > seg.startMs);
  const beats = [];
  let current = null;
  const pushCurrent = () => {
    if (!current) return;
    beats.push({ ...current, index: beats.length + 1, text: cleanNarrationText(current.text) });
    current = null;
  };
  for (const seg of expanded) {
    if (!current) {
      current = { index: beats.length + 1, startMs: seg.startMs, endMs: seg.endMs, text: seg.text };
      continue;
    }
    const combinedDuration = seg.endMs - current.startMs;
    const currentDuration = current.endMs - current.startMs;
    if (combinedDuration > MAX_BEAT_MS && currentDuration >= MIN_BEAT_MS) pushCurrent();
    if (!current) {
      current = { index: beats.length + 1, startMs: seg.startMs, endMs: seg.endMs, text: seg.text };
      continue;
    }
    current.endMs = seg.endMs;
    current.text = `${current.text} ${seg.text}`;
    const duration = current.endMs - current.startMs;
    if (duration >= TARGET_BEAT_MS && /[.!?…]$/u.test(seg.text.trim())) pushCurrent();
    else if (duration >= MAX_BEAT_MS) pushCurrent();
  }
  pushCurrent();
  if (beats.length > 1) {
    const last = beats[beats.length - 1];
    const previous = beats[beats.length - 2];
    if (last.endMs - last.startMs < MIN_BEAT_MS && last.endMs - previous.startMs <= MAX_BEAT_MS + 1e3) {
      previous.endMs = last.endMs;
      previous.text = cleanNarrationText(`${previous.text} ${last.text}`);
      beats.pop();
    }
  }
  return beats.map((beat, index) => ({ ...beat, index: index + 1 }));
}
function applyShotSafetyCap(beats, maxShots) {
  const limit = Math.floor(maxShots || 0);
  if (limit <= 0 || beats.length <= limit) return beats;
  const result = beats.map((beat) => ({ ...beat }));
  while (result.length > limit) {
    let best = -1;
    let bestDuration = Number.POSITIVE_INFINITY;
    for (let i = 0; i < result.length - 1; i += 1) {
      const duration = result[i + 1].endMs - result[i].startMs;
      if (duration <= MAX_BEAT_MS + 1e3 && duration < bestDuration) {
        best = i;
        bestDuration = duration;
      }
    }
    if (best < 0) break;
    result[best] = {
      ...result[best],
      endMs: result[best + 1].endMs,
      text: cleanNarrationText(`${result[best].text} ${result[best + 1].text}`)
    };
    result.splice(best + 1, 1);
  }
  return result.map((beat, index) => ({ ...beat, index: index + 1 }));
}
function attachLockedNarration(beats, narrationBlocks) {
  if (beats.length === 0 || narrationBlocks.length === 0) return beats;
  const words = narrationBlocks.join(" ").trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return beats;
  const totalDuration = Math.max(1, beats.at(-1).endMs - beats[0].startMs);
  let wordCursor = 0;
  return beats.map((beat, index) => {
    const isLast = index === beats.length - 1;
    const elapsed = beat.endMs - beats[0].startMs;
    const target = isLast ? words.length : Math.max(wordCursor + 1, Math.round(elapsed / totalDuration * words.length));
    const text = words.slice(wordCursor, Math.min(words.length, target)).join(" ");
    wordCursor = Math.min(words.length, target);
    return { ...beat, text };
  });
}
function buildNarrationTimeline(narrationBlocks, durationMs, subtitles, maxShots) {
  const safeDuration = Math.max(1e3, Math.round(durationMs));
  let source;
  if (subtitles.length > 0) {
    source = subtitles.map((seg, index) => ({ ...seg, index }));
    source[0].startMs = 0;
    source[source.length - 1].endMs = Math.max(source[source.length - 1].endMs, safeDuration);
  } else {
    const blocks = narrationBlocks.filter((text) => text.trim());
    const totalWords = blocks.reduce((sum, text) => sum + wordCount(text), 0) || 1;
    let cursor = 0;
    source = blocks.map((text, index) => {
      const isLast = index === blocks.length - 1;
      const endMs = isLast ? safeDuration : Math.round(cursor + wordCount(text) / totalWords * safeDuration);
      const segment = { index, startMs: cursor, endMs: Math.max(cursor + 1, endMs), text };
      cursor = segment.endMs;
      return segment;
    });
  }
  const beats = applyShotSafetyCap(mergeToVisualBeats(source), maxShots);
  return subtitles.length > 0 ? attachLockedNarration(beats, narrationBlocks) : beats;
}
function buildImportedPlanTimeline(voiceOvers, durationMs) {
  const blocks = voiceOvers.map(cleanNarrationText).filter(Boolean);
  if (blocks.length === 0) return [];
  const safeDuration = Math.max(1e3, Math.round(durationMs));
  const weights = blocks.map(wordCount);
  const total = weights.reduce((sum, count) => sum + count, 0) || blocks.length;
  let words = 0;
  let cursor = 0;
  return blocks.map((text, index) => {
    words += weights[index];
    const remaining = blocks.length - index - 1;
    const endMs = index === blocks.length - 1 ? safeDuration : Math.max(cursor + 1, Math.min(safeDuration - remaining, Math.round(words / total * safeDuration)));
    const beat = { index: index + 1, startMs: cursor, endMs, text };
    cursor = endMs;
    return beat;
  });
}
const GOOGLE_FLOW_IMAGE_MODELS = ["GEM_PIX_2", "NARWHAL"];
const GOOGLE_FLOW_VIDEO_MODELS = [
  "Veo_3.1-Fast",
  "Veo_3.1-Lite",
  "Veo_3.1-Lite_Lower_Priority"
];
const GOOGLE_FLOW_MODELS = [...GOOGLE_FLOW_IMAGE_MODELS, ...GOOGLE_FLOW_VIDEO_MODELS];
const GROK_VIDEO_MODELS = ["Grok Imagine Video"];
const MODEL_DISPLAY_NAMES = {
  GEM_PIX_2: "Google Nano Banana Pro",
  NARWHAL: "Nano Banana 2",
  "Veo_3.1-Fast": "Veo 3.1 Fast",
  "Veo_3.1-Lite": "Veo 3.1 Lite",
  "Veo_3.1-Lite_Lower_Priority": "Veo 3.1 Lite – Lower Priority"
};
function getModelDisplayName(model) {
  return MODEL_DISPLAY_NAMES[model] || model;
}
const DEFAULT_PROVIDERS = [
  {
    platform: "googleflow",
    name: "Google Flow",
    baseUrl: "local://google-flow",
    model: GOOGLE_FLOW_MODELS,
    capabilities: ["image_generation", "video_generation"]
  },
  {
    platform: "grok",
    name: "Grok",
    baseUrl: "local://grok",
    model: GROK_VIDEO_MODELS,
    capabilities: ["video_generation"]
  }
];
function generateId() {
  return crypto.randomUUID();
}
function parseApiKeys(apiKey) {
  if (!apiKey) return [];
  return apiKey.split(/[,\n]/).map((k) => k.trim()).filter((k) => k.length > 0);
}
function getProviderCredentialCount(platform, apiKey) {
  if (platform === "googleflow" || platform === "grok") return 0;
  return parseApiKeys(apiKey).length;
}
function isProviderCredentialConfigured(platform, apiKey) {
  if (platform === "googleflow" || platform === "grok") return true;
  return parseApiKeys(apiKey).length > 0;
}
function getApiKeyCount(apiKey) {
  return parseApiKeys(apiKey).length;
}
function maskApiKey(key) {
  if (!key || key.length === 0) return "Not set";
  if (key.length <= 10) return `${key.substring(0, 4)}***`;
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}
const BLACKLIST_DURATION_MS = 90 * 1e3;
const MODEL_MISMATCH_BLACKLIST_DURATION_MS = 15 * 1e3;
function isModelIncompatibleError(errorText) {
  if (!errorText) return false;
  const text = errorText.toLowerCase();
  return text.includes("not support") || text.includes("unsupported") || text.includes("model") && text.includes("invalid") || text.includes("model") && text.includes("not available") || text.includes("model") && text.includes("unavailable");
}
class ApiKeyManager {
  keys;
  currentIndex;
  blacklist = /* @__PURE__ */ new Map();
  constructor(apiKeyString) {
    this.keys = parseApiKeys(apiKeyString);
    this.currentIndex = this.keys.length > 0 ? Math.floor(Math.random() * this.keys.length) : 0;
  }
  /**
   * Get the current API key
   */
  getCurrentKey() {
    this.cleanupBlacklist();
    if (this.keys.length === 0) return null;
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];
      if (!this.blacklist.has(key)) {
        this.currentIndex = index;
        return key;
      }
    }
    return this.keys.length > 0 ? this.keys[0] : null;
  }
  /**
   * Rotate to the next available key
   */
  rotateKey() {
    this.cleanupBlacklist();
    if (this.keys.length <= 1) return this.getCurrentKey();
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];
      if (!this.blacklist.has(key)) {
        this.currentIndex = index;
        return key;
      }
    }
    return this.keys[this.currentIndex];
  }
  /**
   * Mark the current key as failed and blacklist it temporarily
   */
  markCurrentKeyFailed(reason = "unknown", durationMs = BLACKLIST_DURATION_MS) {
    const key = this.keys[this.currentIndex];
    if (key) {
      this.blacklist.set(key, {
        key,
        blacklistedAt: Date.now(),
        reason,
        durationMs
      });
    }
    this.rotateKey();
  }
  /**
   * Handle API errors and decide whether to rotate
   * Returns true if key was rotated
   */
  handleError(statusCode, errorText) {
    if (statusCode === 429) {
      this.markCurrentKeyFailed("rate_limit");
      return true;
    }
    if (statusCode === 401 || statusCode === 403) {
      this.markCurrentKeyFailed("auth");
      return true;
    }
    if (statusCode >= 500) {
      this.markCurrentKeyFailed("service_unavailable");
      return true;
    }
    if (statusCode === 400 && isModelIncompatibleError(errorText)) {
      this.markCurrentKeyFailed("model_incompatible", MODEL_MISMATCH_BLACKLIST_DURATION_MS);
      return true;
    }
    return false;
  }
  /**
   * Get the number of available (non-blacklisted) keys
   */
  getAvailableKeyCount() {
    this.cleanupBlacklist();
    return this.keys.filter((k) => !this.blacklist.has(k)).length;
  }
  /**
   * Get total key count
   */
  getTotalKeyCount() {
    return this.keys.length;
  }
  /**
   * Check if manager has any keys
   */
  hasKeys() {
    return this.keys.length > 0;
  }
  /**
   * Clean up expired blacklist entries
   */
  cleanupBlacklist() {
    const now = Date.now();
    for (const [key, entry] of this.blacklist.entries()) {
      const ttl = entry.durationMs ?? BLACKLIST_DURATION_MS;
      if (now - entry.blacklistedAt >= ttl) {
        this.blacklist.delete(key);
      }
    }
  }
  /**
   * Reset the manager with new keys
   */
  reset(apiKeyString) {
    this.keys = parseApiKeys(apiKeyString);
    this.currentIndex = this.keys.length > 0 ? Math.floor(Math.random() * this.keys.length) : 0;
    this.blacklist.clear();
  }
}
const providerManagers = /* @__PURE__ */ new Map();
function getScopedProviderKey(providerId, scopeKey) {
  return scopeKey ? `${providerId}::${scopeKey}` : providerId;
}
function getProviderKeyManager(providerId, apiKey, scopeKey) {
  const managerKey = getScopedProviderKey(providerId, scopeKey);
  let manager = providerManagers.get(managerKey);
  if (!manager) {
    manager = new ApiKeyManager(apiKey);
    providerManagers.set(managerKey, manager);
  }
  return manager;
}
function updateProviderKeys(providerId, apiKey, scopeKey) {
  const managerKey = getScopedProviderKey(providerId, scopeKey);
  const manager = providerManagers.get(managerKey);
  if (manager) {
    manager.reset(apiKey);
  } else {
    providerManagers.set(managerKey, new ApiKeyManager(apiKey));
  }
}
const STATIC_REGISTRY = {
  // ==================== DeepSeek Series ====================
  // DeepSeek-V3.2: 128K context limit
  "deepseek-v3": { contextWindow: 128e3, maxOutput: 8192 },
  "deepseek-v3.2": { contextWindow: 128e3, maxOutput: 8192 },
  "deepseek-chat": { contextWindow: 128e3, maxOutput: 8192 },
  "deepseek-r1": { contextWindow: 128e3, maxOutput: 16384 },
  "deepseek-reasoner": { contextWindow: 128e3, maxOutput: 16384 },
  // ==================== GLM Series ====================
  "glm-4.7": { contextWindow: 2e5, maxOutput: 128e3 },
  "glm-4.6v": { contextWindow: 128e3, maxOutput: 8192 },
  // Conservative
  "glm-4.5-flash": { contextWindow: 128e3, maxOutput: 8192 },
  // Conservative
  // ==================== Google Gemini Series ====================
  "gemini-2.5-flash": { contextWindow: 1048576, maxOutput: 65536 },
  "gemini-2.5-pro": { contextWindow: 1048576, maxOutput: 65536 },
  "gemini-3-flash-preview": { contextWindow: 1048576, maxOutput: 65536 },
  // Reuse 2.5 limits
  "gemini-3-pro-preview": { contextWindow: 1048576, maxOutput: 65536 },
  "gemini-2.0-flash": { contextWindow: 1048576, maxOutput: 8192 },
  // ==================== Other Models (Conservative) ====================
  "kimi-k2": { contextWindow: 128e3, maxOutput: 8192 },
  "qwen3-max": { contextWindow: 128e3, maxOutput: 8192 },
  "qwen3-max-preview": { contextWindow: 128e3, maxOutput: 8192 },
  "minimax-m2.1": { contextWindow: 128e3, maxOutput: 8192 },
  // ==================== Generic Prefix Rules ====================
  // Prefix matching runs in descending length order so more specific keys win first.
  "deepseek-": { contextWindow: 128e3, maxOutput: 8192 },
  "gemini-": { contextWindow: 1048576, maxOutput: 65536 },
  "glm-": { contextWindow: 128e3, maxOutput: 8192 },
  "claude-": { contextWindow: 2e5, maxOutput: 8192 },
  "gpt-": { contextWindow: 128e3, maxOutput: 16384 },
  "doubao-": { contextWindow: 32e3, maxOutput: 4096 },
  // ==================== Default Values ====================
  "_default": { contextWindow: 32e3, maxOutput: 4096 }
};
const SORTED_KEYS = Object.keys(STATIC_REGISTRY).filter((k) => k !== "_default").sort((a, b) => b.length - a.length);
let _getDiscoveredLimits = null;
let _setDiscoveredLimits = null;
function injectDiscoveryCache(getter, setter) {
  _getDiscoveredLimits = getter;
  _setDiscoveredLimits = setter;
}
function getModelLimits(modelName) {
  const m = modelName.toLowerCase();
  if (_getDiscoveredLimits) {
    const discovered = _getDiscoveredLimits(m);
    if (discovered) {
      const staticFallback = lookupStatic(m);
      return {
        contextWindow: discovered.contextWindow ?? staticFallback.contextWindow,
        maxOutput: discovered.maxOutput ?? staticFallback.maxOutput
      };
    }
  }
  return lookupStatic(m);
}
function lookupStatic(modelNameLower) {
  if (STATIC_REGISTRY[modelNameLower]) {
    return STATIC_REGISTRY[modelNameLower];
  }
  for (const key of SORTED_KEYS) {
    if (modelNameLower.startsWith(key)) {
      return STATIC_REGISTRY[key];
    }
  }
  return STATIC_REGISTRY["_default"];
}
function parseModelLimitsFromError(errorText) {
  const result = {};
  let found = false;
  const rangeMatch = errorText.match(/valid\s+range.*?\[\s*\d+\s*,\s*(\d+)\s*\]/i);
  if (rangeMatch) {
    result.maxOutput = parseInt(rangeMatch[1], 10);
    found = true;
  }
  if (!found) {
    const lteMatch = errorText.match(/max_tokens.*?(?:less than or equal to|<=|limit(?:ed)?\s+to|upper\s+limit\s+is)\s*(\d{3,6})/i);
    if (lteMatch) {
      result.maxOutput = parseInt(lteMatch[1], 10);
      found = true;
    }
  }
  if (!found) {
    const genericMatch = errorText.match(/max_tokens.*?\b(\d{3,6})\b/i);
    if (genericMatch) {
      result.maxOutput = parseInt(genericMatch[1], 10);
      found = true;
    }
  }
  const ctxMatch = errorText.match(/context.*?length.*?(\d{4,7})/i);
  if (ctxMatch) {
    result.contextWindow = parseInt(ctxMatch[1], 10);
    found = true;
  }
  if (!result.contextWindow) {
    const maxTokensCtx = errorText.match(/maximum.*?(\d{4,7})\s*tokens/i);
    if (maxTokensCtx) {
      result.contextWindow = parseInt(maxTokensCtx[1], 10);
      found = true;
    }
  }
  if (!found) return null;
  result.discoveredAt = Date.now();
  return result;
}
function cacheDiscoveredLimits(modelName, limits) {
  if (!_setDiscoveredLimits) return false;
  _setDiscoveredLimits(modelName.toLowerCase(), limits);
  console.log(
    `[ModelRegistry] Learned limits for ${modelName}:`,
    limits.maxOutput != null ? `maxOutput=${limits.maxOutput}` : "",
    limits.contextWindow != null ? `contextWindow=${limits.contextWindow}` : ""
  );
  return true;
}
function estimateTokens(text) {
  return Math.ceil(text.length / 1.5);
}
const IMAGE_HOST_PRESETS = [
  {
    platform: "scdn",
    name: "SCDN Image Host",
    baseUrl: "https://img.scdn.io",
    uploadPath: "/api/v1.php",
    enabled: true,
    apiKeyOptional: true,
    imageField: "image",
    imagePayloadType: "file",
    responseUrlField: "url"
  },
  {
    platform: "custom",
    name: "Custom Image Host",
    baseUrl: "",
    uploadPath: "",
    enabled: false
  }
];
const DEFAULT_IMAGE_HOST_PROVIDERS = IMAGE_HOST_PRESETS.filter((preset) => preset.platform === "scdn");
const ACTIVE_IMAGE_HOST_PLATFORMS = /* @__PURE__ */ new Set(["scdn", "custom"]);
function isVisibleImageHostPlatform(platform) {
  return ACTIVE_IMAGE_HOST_PLATFORMS.has(platform);
}
function isVisibleImageHostProvider(provider) {
  return isVisibleImageHostPlatform(provider.platform);
}
function createDefaultImageHostProviders() {
  return DEFAULT_IMAGE_HOST_PROVIDERS.map((provider) => ({
    ...provider,
    id: generateId(),
    apiKey: ""
  }));
}
const IMAGE_HOST_PLATFORM_DEFAULTS = {
  scdn: {
    baseUrl: "https://img.scdn.io",
    uploadPath: "/api/v1.php",
    apiKeyOptional: true,
    imageField: "image",
    imagePayloadType: "file",
    responseUrlField: "url"
  }
};
function normalizeImageHostProvider(provider) {
  const defaults = IMAGE_HOST_PLATFORM_DEFAULTS[provider.platform];
  if (!defaults) {
    return provider;
  }
  if (provider.platform === "scdn") {
    return {
      ...provider,
      baseUrl: provider.baseUrl || defaults.baseUrl || "",
      uploadPath: provider.uploadPath || defaults.uploadPath || "",
      apiKeyOptional: true,
      imageField: "image",
      imagePayloadType: "file",
      responseUrlField: "url",
      responseDeleteUrlField: void 0
    };
  }
  return provider;
}
function normalizeImageHostProviders(providers) {
  return (providers || []).filter(isVisibleImageHostProvider).map(normalizeImageHostProvider);
}
const AI_FEATURES = [
  { key: "script_analysis", name: "Script Analysis", description: "Break story text into a structured screenplay" },
  { key: "character_generation", name: "Character Generation", description: "Generate character reference images and outfit variants" },
  { key: "scene_generation", name: "Scene Generation", description: "Generate scene environment reference images" },
  { key: "video_generation", name: "Video Generation", description: "Convert images into video" },
  { key: "image_understanding", name: "Image Understanding", description: "Analyze image content" },
  { key: "chat", name: "General Chat", description: "AI conversation and text generation" }
];
const DEFAULT_ADVANCED_OPTIONS = {
  enableVisualContinuity: true,
  enableResumeGeneration: true,
  enableContentModeration: true,
  enableAutoModelSwitch: false
};
const DEFAULT_FEATURE_BINDINGS = {
  script_analysis: null,
  character_generation: null,
  scene_generation: null,
  video_generation: null,
  image_understanding: null,
  chat: null
};
const PROVIDER_INFO = {
  googleflow: { name: "Google Flow", services: ["image", "video"] },
  grok: { name: "Grok", services: ["video"] },
  openai: { name: "OpenAI", services: [] },
  openrouter: { name: "OpenRouter", services: ["chat", "vision"] },
  custom: { name: "Custom", services: [] }
};
const API_CONFIG_STORE_VERSION = 21;
function migrateApiConfig(persistedState, version) {
  const result = { ...persistedState };
  console.log(`[APIConfig] Chained migration: v${version} → v19`);
  const defaultBindings = { ...DEFAULT_FEATURE_BINDINGS };
  const resolveImageHostProviders = () => {
    const legacyConfig = result?.imageHostConfig;
    let imageHostProviders = normalizeImageHostProviders(result?.imageHostProviders || []);
    if (!imageHostProviders || imageHostProviders.length === 0) {
      if (legacyConfig) {
        if (legacyConfig.type === "custom" && legacyConfig.custom) {
          imageHostProviders = [
            {
              id: generateId(),
              platform: "custom",
              name: "Custom Image Host",
              baseUrl: legacyConfig.custom.uploadUrl || "",
              uploadPath: "",
              apiKey: legacyConfig.custom.apiKey || "",
              enabled: true
            }
          ];
        }
      }
      if (!imageHostProviders || imageHostProviders.length === 0) {
        imageHostProviders = createDefaultImageHostProviders();
      }
    }
    return normalizeImageHostProviders(imageHostProviders);
  };
  if (version <= 1) {
    const oldApiKeys = result?.apiKeys || {};
    const providers = [];
    for (const template of DEFAULT_PROVIDERS) {
      const existingKey = oldApiKeys[template.platform] || "";
      providers.push({
        id: generateId(),
        ...template,
        apiKey: existingKey
      });
    }
    console.log(`[APIConfig] v0/v1→v2: Migrated ${providers.length} providers from apiKeys`);
    result.providers = providers;
    result.featureBindings = defaultBindings;
    result.apiKeys = oldApiKeys;
    version = 2;
  }
  if (version <= 2) {
    result.providers = result.providers || [];
    result.featureBindings = { ...defaultBindings, ...result.featureBindings || {} };
    version = 3;
  }
  if (version <= 3) {
    result.featureBindings = { ...defaultBindings, ...result.featureBindings || {} };
    version = 4;
  }
  if (version <= 5) {
    const oldBindings = result.featureBindings || {};
    const newBindings = { ...defaultBindings };
    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key;
      if (typeof value === "string" && value) {
        newBindings[feature] = [value];
        console.log(`[APIConfig] v5→v6: Migrated ${feature}: "${value}" -> ["${value}"]`);
      } else if (Array.isArray(value)) {
        newBindings[feature] = value;
      } else {
        newBindings[feature] = null;
      }
    }
    result.featureBindings = newBindings;
    console.log(`[APIConfig] v5→v6: Migrated featureBindings to multi-select format`);
    version = 6;
  }
  if (version <= 6) {
    const DEPRECATED_PLATFORMS = ["dik3", "nanohajimi", "apimart", "zhipu"];
    const oldProviders = result.providers || [];
    const cleanedProviders = oldProviders.filter(
      (p) => !DEPRECATED_PLATFORMS.includes(p.platform)
    );
    const removedCount = oldProviders.length - cleanedProviders.length;
    if (removedCount > 0) {
      console.log(`[APIConfig] v6→v7: Removed ${removedCount} deprecated providers`);
    }
    const oldBindings = result.featureBindings || {};
    const cleanedBindings = { ...defaultBindings };
    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key;
      if (Array.isArray(value)) {
        const filtered = value.filter(
          (b) => !DEPRECATED_PLATFORMS.some((dp) => b.startsWith(dp + ":"))
        );
        cleanedBindings[feature] = filtered.length > 0 ? filtered : null;
      } else {
        cleanedBindings[feature] = null;
      }
    }
    result.providers = cleanedProviders;
    result.featureBindings = cleanedBindings;
    version = 7;
  }
  if (version <= 7) {
    version = 8;
  }
  if (version <= 8) {
    const providers = result.providers || [];
    const oldBindings = result.featureBindings || {};
    const newBindings = { ...defaultBindings };
    let convertedCount = 0;
    let removedCount = 0;
    for (const [key, value] of Object.entries(oldBindings)) {
      const feature = key;
      if (!Array.isArray(value)) {
        newBindings[feature] = value ? [value] : null;
        continue;
      }
      const converted = [];
      for (const binding of value) {
        const idx = binding.indexOf(":");
        if (idx <= 0) {
          converted.push(binding);
          continue;
        }
        const platformOrId = binding.slice(0, idx);
        const model = binding.slice(idx + 1);
        if (providers.some((p) => p.id === platformOrId)) {
          converted.push(binding);
          continue;
        }
        const matches = providers.filter((p) => p.platform === platformOrId);
        if (matches.length === 1) {
          const newBinding = `${matches[0].id}:${model}`;
          converted.push(newBinding);
          convertedCount++;
          console.log(`[APIConfig] v8→v9: Converted binding "${binding}" -> "${newBinding}"`);
        } else if (matches.length > 1) {
          removedCount++;
          console.warn(`[APIConfig] v8→v9: Removed ambiguous binding "${binding}" (${matches.length} providers with platform "${platformOrId}")`);
        } else {
          converted.push(binding);
        }
      }
      newBindings[feature] = converted.length > 0 ? converted : null;
    }
    if (convertedCount > 0 || removedCount > 0) {
      console.log(`[APIConfig] v8→v9: Converted ${convertedCount} bindings, removed ${removedCount} ambiguous`);
    }
    result.featureBindings = newBindings;
    version = 9;
  }
  if (version <= 11) {
    version = 12;
  }
  if (version <= 12) {
    console.log(`[APIConfig] v12→v13: Clearing stale API metadata caches (modelEndpointTypes, modelTypes, modelTags, modelEnableGroups, discoveredModelLimits)`);
    result.modelEndpointTypes = {};
    result.modelTypes = {};
    result.modelTags = {};
    result.modelEnableGroups = {};
    result.discoveredModelLimits = {};
    if (Array.isArray(result.providers)) {
      result.providers = result.providers.map((p) => {
        const template = DEFAULT_PROVIDERS.find((t) => t.platform === p.platform);
        if (template) {
          const updated = {
            ...p,
            baseUrl: p.baseUrl?.trim() ? p.baseUrl : template.baseUrl,
            name: p.name?.trim() ? p.name : template.name
          };
          if (updated.baseUrl !== p.baseUrl || updated.name !== p.name) {
            console.log(`[APIConfig] v12→v13: Updated ${p.platform} baseUrl: "${p.baseUrl}" -> "${template.baseUrl}"`);
          }
          return updated;
        }
        return p;
      });
    }
    version = 13;
  }
  if (version <= 16) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    if (!providers.some((provider) => provider.platform === "googleflow")) {
      const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === "googleflow");
      if (template) providers.push({ id: generateId(), ...template, apiKey: "" });
    }
    result.providers = providers;
    version = 17;
  }
  if (version <= 17) {
    let providers = Array.isArray(result.providers) ? result.providers : [];
    const rawBindings = Object.values(result.featureBindings || {}).flatMap(
      (binding) => Array.isArray(binding) ? binding : typeof binding === "string" && binding ? [binding] : []
    );
    const boundProviderIds = new Set(rawBindings.map((binding) => {
      const separator = binding.indexOf(":");
      return separator > 0 ? binding.slice(0, separator) : binding;
    }));
    providers = providers.filter((provider) => !(provider.platform === "openrouter" && !provider.apiKey?.trim() && provider.name === "OpenRouter" && provider.baseUrl === "https://openrouter.ai/api/v1" && !boundProviderIds.has(provider.id)));
    for (const platform of ["googleflow"]) {
      if (!providers.some((provider) => provider.platform === platform)) {
        const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === platform);
        if (template) providers.push({ id: generateId(), ...template, apiKey: "" });
      }
    }
    result.providers = providers;
    version = 18;
  }
  if (version <= 18) {
    const modelAliases = {
      "veo_3_1_i2v_s_fast": "Veo_3.1-Fast",
      "veo_3_1_r2v_fast": "Veo_3.1-Fast",
      "veo_3_1_i2v_lite_low_priority": "Veo_3.1-Lite_Lower_Priority",
      "Veo_3.1-Fast_Lower_Priority": "Veo_3.1-Lite_Lower_Priority"
    };
    const bindings = result.featureBindings || {};
    for (const [feature, value] of Object.entries(bindings)) {
      const items = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
      const migrated = items.map((binding) => {
        const separator = binding.indexOf(":");
        if (separator < 0) return binding;
        const providerId = binding.slice(0, separator);
        const model = binding.slice(separator + 1);
        return `${providerId}:${modelAliases[model] || model}`;
      });
      bindings[feature] = migrated.length ? Array.from(new Set(migrated)) : null;
    }
    result.featureBindings = bindings;
    version = 19;
  }
  if (version <= 19) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    if (!providers.some((provider) => provider.platform === "grok")) {
      const template = DEFAULT_PROVIDERS.find((provider) => provider.platform === "grok");
      if (template) providers.push({ id: generateId(), ...template, apiKey: "" });
    }
    result.providers = providers;
    version = 20;
  }
  if (version <= 20) {
    const providers = Array.isArray(result.providers) ? result.providers : [];
    const removedIds = new Set(
      providers.filter((provider) => provider.platform === "maxstudio").map((provider) => provider.id)
    );
    if (removedIds.size > 0) {
      result.providers = providers.filter((provider) => provider.platform !== "maxstudio");
      const bindings = result.featureBindings || {};
      for (const [feature, value] of Object.entries(bindings)) {
        const items = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
        const cleaned = items.filter((binding) => {
          const separator = binding.indexOf(":");
          const providerId = separator > 0 ? binding.slice(0, separator) : binding;
          return !removedIds.has(providerId);
        });
        bindings[feature] = cleaned.length ? cleaned : null;
      }
      result.featureBindings = bindings;
    }
    version = 21;
  }
  const finalBindings = { ...defaultBindings };
  if (result.featureBindings) {
    for (const [key, value] of Object.entries(result.featureBindings)) {
      const feature = key;
      if (typeof value === "string" && value) {
        finalBindings[feature] = [value];
      } else if (Array.isArray(value)) {
        finalBindings[feature] = value;
      } else {
        finalBindings[feature] = null;
      }
    }
  }
  result.featureBindings = finalBindings;
  if (Array.isArray(result.providers)) {
    const supportedPlatforms = /* @__PURE__ */ new Set(["googleflow", "grok", "openai", "openrouter", "custom"]);
    const normalizedProviders = result.providers.filter((provider) => supportedPlatforms.has(provider.platform)).map((provider) => {
      if (provider.platform === "googleflow") {
        return {
          ...provider,
          name: "Google Flow",
          apiKey: "",
          baseUrl: "local://google-flow",
          model: GOOGLE_FLOW_MODELS,
          capabilities: ["image_generation", "video_generation"]
        };
      }
      if (provider.platform === "grok") {
        return {
          ...provider,
          name: "Grok",
          apiKey: "",
          baseUrl: "local://grok",
          model: GROK_VIDEO_MODELS,
          capabilities: ["video_generation"]
        };
      }
      return provider;
    }).sort((left, right) => {
      const coreOrder = { googleflow: 0, grok: 1 };
      return (coreOrder[left.platform] ?? 2) - (coreOrder[right.platform] ?? 2);
    });
    result.providers = normalizedProviders;
    const providerIds = new Set(normalizedProviders.map((provider) => provider.id));
    for (const feature of Object.keys(finalBindings)) {
      const bindings = finalBindings[feature];
      const valid = bindings?.filter((binding) => {
        const separator = binding.indexOf(":");
        const providerId = separator > 0 ? binding.slice(0, separator) : binding;
        return providerIds.has(providerId);
      }) || [];
      finalBindings[feature] = valid.length ? valid : null;
    }
  }
  result.imageHostProviders = resolveImageHostProviders();
  console.log(`[APIConfig] Migration complete: v${version}`);
  return result;
}
const initialState = {
  providers: DEFAULT_PROVIDERS.map((provider) => ({ id: generateId(), ...provider, apiKey: "" })),
  featureBindings: { ...DEFAULT_FEATURE_BINDINGS },
  apiKeys: {},
  aspectRatio: "16:9",
  orientation: "landscape",
  advancedOptions: { ...DEFAULT_ADVANCED_OPTIONS },
  imageHostProviders: createDefaultImageHostProviders(),
  modelEndpointTypes: {},
  modelTypes: {},
  modelTags: {},
  modelEnableGroups: {},
  discoveredModelLimits: {}
};
const useAPIConfigStore = create()(
  persist(
    (set, get) => ({
      ...initialState,
      // ==================== Provider Management (v2) ====================
      addProvider: (providerData) => {
        const newProvider = {
          ...providerData,
          id: generateId()
        };
        set((state) => ({
          providers: [...state.providers, newProvider]
        }));
        updateProviderKeys(newProvider.id, newProvider.apiKey);
        console.log(`[APIConfig] Added provider: ${newProvider.name}`);
        return newProvider;
      },
      updateProvider: (provider) => {
        set((state) => ({
          providers: state.providers.map((p) => p.id === provider.id ? provider : p)
        }));
        updateProviderKeys(provider.id, provider.apiKey);
        console.log(`[APIConfig] Updated provider: ${provider.name}`);
      },
      removeProvider: (id) => {
        const provider = get().providers.find((p) => p.id === id);
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id)
        }));
        if (provider) {
          console.log(`[APIConfig] Removed provider: ${provider.name}`);
        }
      },
      getProviderByPlatform: (platform) => {
        return get().providers.find((p) => p.platform === platform);
      },
      getProviderById: (id) => {
        return get().providers.find((p) => p.id === id);
      },
      syncProviderModels: async (providerId) => {
        const provider = get().providers.find((p) => p.id === providerId);
        if (!provider) return { success: false, count: 0, error: "Provider not found" };
        const keys = parseApiKeys(provider.apiKey);
        if (keys.length === 0) return { success: false, count: 0, error: "Configure an API key first" };
        const baseUrl = provider.baseUrl?.replace(/\/+$/, "");
        if (!baseUrl) return { success: false, count: 0, error: "Base URL is not configured" };
        try {
          const allModelIds = /* @__PURE__ */ new Set();
          {
            const modelsUrl = /\/v\d+$/.test(baseUrl) ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
            const endpointUpdates = {};
            let anySuccess = false;
            let lastError = "";
            for (let ki = 0; ki < keys.length; ki++) {
              try {
                const response = await fetch(modelsUrl, {
                  headers: { "Authorization": `Bearer ${keys[ki]}` }
                });
                if (!response.ok) {
                  lastError = `key#${ki + 1} API returned ${response.status}`;
                  console.warn(`[APIConfig] ${lastError}`);
                  continue;
                }
                const json = await response.json();
                const data = json.data || json;
                if (!Array.isArray(data) || data.length === 0) {
                  console.warn(`[APIConfig] key#${ki + 1} returned empty model list`);
                  continue;
                }
                anySuccess = true;
                for (const m of data) {
                  const id = typeof m === "string" ? m : m.id;
                  if (typeof id === "string" && id.length > 0) allModelIds.add(id);
                  if (typeof m !== "string" && m.id && Array.isArray(m.supported_endpoint_types)) {
                    endpointUpdates[m.id] = m.supported_endpoint_types;
                  }
                }
                console.log(`[APIConfig] key#${ki + 1} contributed models, total so far: ${allModelIds.size}`);
              } catch (e) {
                lastError = `key#${ki + 1} network request failed`;
                console.warn(`[APIConfig] ${lastError}:`, e);
              }
            }
            if (Object.keys(endpointUpdates).length > 0) {
              set((state) => ({
                modelEndpointTypes: {
                  ...state.modelEndpointTypes,
                  ...endpointUpdates
                }
              }));
            }
            if (!anySuccess) {
              return { success: false, count: 0, error: lastError || "Unexpected API response" };
            }
          }
          const modelIds = Array.from(allModelIds);
          if (modelIds.length === 0) {
            return { success: false, count: 0, error: "No models were returned" };
          }
          get().updateProvider({ ...provider, model: modelIds });
          console.log(`[APIConfig] Synced ${modelIds.length} models for ${provider.name} (from ${keys.length} keys)`);
          return { success: true, count: modelIds.length };
        } catch (error) {
          console.error("[APIConfig] Model sync failed:", error);
          return { success: false, count: 0, error: "Network request failed. Check your connection." };
        }
      },
      // ==================== Feature Binding Management (Multi-Select) ====================
      // Replace all bindings for a feature.
      setFeatureBindings: (feature, bindings) => {
        set((state) => ({
          featureBindings: { ...state.featureBindings, [feature]: bindings }
        }));
        console.log(`[APIConfig] Set ${feature} -> [${bindings?.join(", ") || "none"}]`);
      },
      // Toggle a single binding on or off.
      toggleFeatureBinding: (feature, binding) => {
        const current = get().featureBindings[feature] || [];
        const exists = current.includes(binding);
        let legacyMatch = null;
        const idx = binding.indexOf(":");
        if (idx > 0) {
          const providerId = binding.slice(0, idx);
          const model = binding.slice(idx + 1);
          const provider = get().providers.find((p) => p.id === providerId);
          if (provider) {
            const legacyKey = `${provider.platform}:${model}`;
            if (legacyKey !== binding && current.includes(legacyKey)) {
              legacyMatch = legacyKey;
            }
          }
        }
        if (exists || legacyMatch) {
          const newBindings = current.filter((b) => b !== binding && b !== legacyMatch);
          set((state) => ({
            featureBindings: { ...state.featureBindings, [feature]: newBindings.length > 0 ? newBindings : null }
          }));
          console.log(`[APIConfig] Toggle ${feature}: ${binding} -> removed${legacyMatch ? ` (also removed legacy: ${legacyMatch})` : ""}`);
        } else {
          const newBindings = [...current, binding];
          set((state) => ({
            featureBindings: { ...state.featureBindings, [feature]: newBindings.length > 0 ? newBindings : null }
          }));
          console.log(`[APIConfig] Toggle ${feature}: ${binding} -> added`);
        }
      },
      // Get all bindings for a feature.
      getFeatureBindings: (feature) => {
        const bindings = get().featureBindings;
        const value = bindings?.[feature];
        if (typeof value === "string") return [value];
        return value || [];
      },
      // Resolve all provider/model pairs for a feature.
      getProvidersForFeature: (feature) => {
        const bindings = get().getFeatureBindings(feature);
        const results = [];
        for (const binding of bindings) {
          const idx = binding.indexOf(":");
          if (idx <= 0) continue;
          const platformOrId = binding.slice(0, idx);
          const model = binding.slice(idx + 1);
          let provider = get().providers.find((p) => p.id === platformOrId);
          if (!provider) {
            const platformMatches = get().providers.filter((p) => p.platform === platformOrId);
            if (platformMatches.length === 1) {
              provider = platformMatches[0];
            } else if (platformMatches.length > 1) {
              console.warn(`[APIConfig] Ambiguous platform binding "${binding}" matches ${platformMatches.length} providers, skipping`);
            }
          }
          if (!provider || !isProviderCredentialConfigured(provider.platform, provider.apiKey)) {
            continue;
          }
          if (provider.model.length > 0 && !provider.model.includes(model)) {
            console.warn(
              `[APIConfig] Skipping stale binding "${binding}" for ${feature}: model "${model}" is not in provider "${provider.name}" model list`
            );
            continue;
          }
          results.push({ provider, model });
        }
        return results;
      },
      isFeatureConfigured: (feature) => {
        const cliRuntime = useVideoStudioSettingsStore.getState().cliRuntime;
        if (cliRuntime.enabled && (feature === "script_analysis" || feature === "chat")) {
          return true;
        }
        return get().getProvidersForFeature(feature).length > 0;
      },
      // Legacy single-select compatibility (deprecated).
      setFeatureBinding: (feature, providerId) => {
        get().setFeatureBindings(feature, providerId ? [providerId] : null);
      },
      getFeatureBinding: (feature) => {
        const bindings = get().getFeatureBindings(feature);
        return bindings[0] || null;
      },
      getProviderForFeature: (feature) => {
        const providers = get().getProvidersForFeature(feature);
        return providers[0]?.provider;
      },
      // ==================== Legacy API Key management (v1 compat) ====================
      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key }
        }));
        const existingProvider = get().getProviderByPlatform(provider);
        if (existingProvider) {
          get().updateProvider({ ...existingProvider, apiKey: key });
        }
        console.log(`[APIConfig] Updated ${provider} API key: ${get().maskApiKey(key)}`);
      },
      getApiKey: (provider) => {
        const prov = get().getProviderByPlatform(provider);
        if (prov?.apiKey) {
          const keys = parseApiKeys(prov.apiKey);
          return keys[0] || "";
        }
        return get().apiKeys[provider] || "";
      },
      clearApiKey: (provider) => {
        set((state) => {
          const newKeys = { ...state.apiKeys };
          delete newKeys[provider];
          return { apiKeys: newKeys };
        });
        const existingProvider = get().getProviderByPlatform(provider);
        if (existingProvider) {
          get().updateProvider({ ...existingProvider, apiKey: "" });
        }
        console.log(`[APIConfig] Cleared ${provider} API key`);
      },
      clearAllApiKeys: () => {
        set({ apiKeys: {} });
        const { providers, updateProvider } = get();
        providers.forEach((p) => {
          updateProvider({ ...p, apiKey: "" });
        });
        console.log("[APIConfig] Cleared all API keys");
      },
      // ==================== Aspect ratio ====================
      setAspectRatio: (ratio) => {
        set({
          aspectRatio: ratio,
          orientation: ratio === "16:9" ? "landscape" : "portrait"
        });
        console.log(`[APIConfig] Set aspect ratio to ${ratio}`);
      },
      toggleOrientation: () => {
        const { aspectRatio } = get();
        const newRatio = aspectRatio === "16:9" ? "9:16" : "16:9";
        get().setAspectRatio(newRatio);
      },
      // ==================== Advanced Generation Options ====================
      setAdvancedOption: (key, value) => {
        set((state) => ({
          advancedOptions: { ...state.advancedOptions, [key]: value }
        }));
        console.log(`[APIConfig] Set advanced option ${key} = ${value}`);
      },
      resetAdvancedOptions: () => {
        set({ advancedOptions: { ...DEFAULT_ADVANCED_OPTIONS } });
        console.log("[APIConfig] Reset advanced options to defaults");
      },
      // ==================== Image Host Providers (independent) ====================
      addImageHostProvider: (providerData) => {
        const newProvider = normalizeImageHostProvider({
          ...providerData,
          id: generateId()
        });
        set((state) => ({
          imageHostProviders: [...state.imageHostProviders, newProvider]
        }));
        console.log(`[APIConfig] Added image host: ${newProvider.name}`);
        return newProvider;
      },
      updateImageHostProvider: (provider) => {
        const normalizedProvider = normalizeImageHostProvider(provider);
        set((state) => ({
          imageHostProviders: state.imageHostProviders.map((p) => p.id === normalizedProvider.id ? normalizedProvider : p)
        }));
        console.log(`[APIConfig] Updated image host: ${normalizedProvider.name}`);
      },
      removeImageHostProvider: (id) => {
        const provider = get().imageHostProviders.find((p) => p.id === id);
        set((state) => ({
          imageHostProviders: state.imageHostProviders.filter((p) => p.id !== id)
        }));
        if (provider) {
          console.log(`[APIConfig] Removed image host: ${provider.name}`);
        }
      },
      getImageHostProviderById: (id) => {
        const provider = get().imageHostProviders.find((p) => p.id === id);
        return provider && isVisibleImageHostProvider(provider) ? normalizeImageHostProvider(provider) : void 0;
      },
      getEnabledImageHostProviders: () => {
        return normalizeImageHostProviders(get().imageHostProviders).filter((p) => p.enabled);
      },
      isImageHostConfigured: () => {
        const providers = normalizeImageHostProviders(get().imageHostProviders);
        return providers.some((p) => {
          const hasKey = parseApiKeys(p.apiKey).length > 0;
          const hasUrl = !!(p.baseUrl || p.uploadPath);
          return p.enabled && hasUrl && (p.apiKeyOptional || hasKey);
        });
      },
      // ==================== Validation ====================
      isConfigured: (provider) => {
        const prov = get().getProviderByPlatform(provider);
        if (prov) {
          return isProviderCredentialConfigured(prov.platform, prov.apiKey);
        }
        const key = get().apiKeys[provider];
        return !!key && key.length > 0;
      },
      isPlatformConfigured: (platform) => {
        const provider = get().getProviderByPlatform(platform);
        return !!provider && isProviderCredentialConfigured(provider.platform, provider.apiKey);
      },
      checkRequiredKeys: (services) => {
        const missing = [];
        const { isConfigured } = get();
        for (const service of services) {
          for (const [providerId, info] of Object.entries(PROVIDER_INFO)) {
            if (info.services.includes(service) && !isConfigured(providerId)) {
              if (!missing.includes(info.name)) {
                missing.push(info.name);
              }
            }
          }
        }
        return {
          isAllConfigured: missing.length === 0,
          missingKeys: missing,
          friendlyMessage: missing.length === 0 ? "All API keys are configured" : `Missing API keys for: ${missing.join(", ")}`
        };
      },
      checkChatKeys: () => {
        return get().checkRequiredKeys(["chat"]);
      },
      checkVideoGenerationKeys: () => {
        return get().checkRequiredKeys(["chat", "image", "video"]);
      },
      // ==================== Display helpers ====================
      maskApiKey: (key) => {
        return maskApiKey(key);
      },
      getAllConfigs: () => {
        const { apiKeys, maskApiKey: maskApiKey2, isConfigured } = get();
        return Object.keys(PROVIDER_INFO).map((provider) => ({
          provider,
          configured: isConfigured(provider),
          masked: maskApiKey2(apiKeys[provider] || "")
        }));
      },
      // ==================== Model limits discovery ====================
      getDiscoveredModelLimits: (model) => {
        return get().discoveredModelLimits[model];
      },
      setDiscoveredModelLimits: (model, limits) => {
        set((state) => ({
          discoveredModelLimits: {
            ...state.discoveredModelLimits,
            [model]: {
              ...state.discoveredModelLimits[model],
              ...limits,
              discoveredAt: Date.now()
            }
          }
        }));
        console.log(`[APIConfig] Discovered model limits for ${model}:`, limits);
      }
    }),
    {
      name: "opencut-api-config",
      // localStorage key
      version: API_CONFIG_STORE_VERSION,
      migrate: migrateApiConfig,
      partialize: (state) => ({
        // Persist these fields
        providers: state.providers,
        featureBindings: state.featureBindings,
        apiKeys: state.apiKeys,
        // Keep for backward compat
        aspectRatio: state.aspectRatio,
        orientation: state.orientation,
        advancedOptions: state.advancedOptions,
        imageHostProviders: state.imageHostProviders,
        modelEndpointTypes: state.modelEndpointTypes,
        modelTypes: state.modelTypes,
        modelTags: state.modelTags,
        modelEnableGroups: state.modelEnableGroups,
        discoveredModelLimits: state.discoveredModelLimits
      })
    }
  )
);
injectDiscoveryCache(
  (model) => useAPIConfigStore.getState().getDiscoveredModelLimits(model),
  (model, limits) => useAPIConfigStore.getState().setDiscoveredModelLimits(model, limits)
);
function isRateLimitError(error) {
  if (!error) return false;
  const err = error;
  if (err.status === 429 || err.status === 500 || err.status === 502 || err.status === 503 || err.status === 529) return true;
  if (err.code === 429 || err.code === 500 || err.code === 502 || err.code === 503 || err.code === 529) return true;
  const message = err.message?.toLowerCase() || "";
  if (message.includes("429") || message.includes("500") || message.includes("502") || message.includes("503") || message.includes("529") || message.includes("quota") || message.includes("rate") || message.includes("resource_exhausted") || message.includes("too many requests") || message.includes("overloaded") || message.includes("service unavailable") || message.includes("temporarily unavailable") || message.includes("internal server error") || message.includes("upstream overload") || message.includes("upstream service") || message.includes("saturated") || message.includes("capacity full") || message.includes("temporarily unavailable") || message.includes("service temporarily unavailable") || message.includes("no available channel") || message.includes("server error")) {
    return true;
  }
  return false;
}
async function retryOperation(operation, options = {}) {
  const { maxRetries = 3, baseDelay = 2e3, retryOn429 = true, onRetry } = options;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!retryOn429 || !isRateLimitError(error)) {
        throw error;
      }
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, delay, lastError);
        } else {
          console.warn(
            `[Retry] Rate limit hit, retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
function formatCliLogBlock$1(label, value, max = 4e3) {
  const text = value || "";
  const suffix = text.length > max ? `
... [truncated ${text.length - max} chars]` : "";
  return `[CLI] ${label} (${text.length} chars)
${text.slice(0, max)}${suffix}`;
}
async function callChatAPI(systemPrompt, userPrompt, options) {
  const { apiKey, provider, baseUrl, model } = options;
  if (options.signal?.aborted) {
    throw new Error("Cancelled by user");
  }
  if (isCliProvider(provider) || baseUrl === "cli://local") {
    const sessionKey = options.sessionKey || `${provider || "cli"}:${model || "default"}`;
    options.onCliLog?.(`[CLI] Request start provider=${provider || "cli"} model=${model || "(default)"} session=${sessionKey}`);
    options.onCliLog?.(formatCliLogBlock$1("INPUT system prompt", systemPrompt));
    options.onCliLog?.(formatCliLogBlock$1("INPUT user prompt", userPrompt));
    try {
      const output = await runCliTextCompletion({
        systemPrompt,
        userPrompt,
        model,
        sessionKey,
        onChunk: options.onChunk,
        signal: options.signal
      });
      options.onCliLog?.(formatCliLogBlock$1("OUTPUT response", output, 6e3));
      options.onCliLog?.(`[CLI] Request done provider=${provider || "cli"} model=${model || "(default)"} session=${sessionKey} output=${output.length} chars`);
      return output;
    } catch (error) {
      options.onCliLog?.(`[CLI] Request failed session=${sessionKey}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  console.log("\n[callChatAPI] ==================== API Call Start ====================");
  console.log("[callChatAPI] provider:", provider);
  console.log("[callChatAPI] apiKey length:", apiKey?.length || 0);
  console.log("[callChatAPI] apiKey missing:", !apiKey);
  console.log("[callChatAPI] baseUrl:", baseUrl);
  console.log("[callChatAPI] systemPrompt length:", systemPrompt.length);
  console.log("[callChatAPI] userPrompt length:", userPrompt.length);
  if (!apiKey) {
    console.error("[callChatAPI] API key is missing");
    throw new Error("API key is not configured");
  }
  const keyManager = options.keyManager || new ApiKeyManager(apiKey);
  const totalKeys = keyManager.getTotalKeyCount();
  console.log(`[callChatAPI] Using ${provider}, total API keys: ${totalKeys}`);
  if (!baseUrl) {
    throw new Error("Base URL is not configured");
  }
  if (!model) {
    throw new Error("Model is not configured");
  }
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const url = /\/v\d+$/.test(normalizedBaseUrl) ? `${normalizedBaseUrl}/chat/completions` : `${normalizedBaseUrl}/v1/chat/completions`;
  const modelLimits = getModelLimits(model);
  const requestedMaxTokens = options.maxTokens ?? 4096;
  const effectiveMaxTokens = Math.min(requestedMaxTokens, modelLimits.maxOutput);
  if (effectiveMaxTokens < requestedMaxTokens) {
    console.log(`[callChatAPI] max_tokens auto-clamped: ${requestedMaxTokens} -> ${effectiveMaxTokens} (${model} maxOutput=${modelLimits.maxOutput})`);
  }
  const inputTokens = estimateTokens(systemPrompt + userPrompt);
  const safetyMargin = Math.ceil(modelLimits.contextWindow * 0.1);
  const availableForOutput = modelLimits.contextWindow - inputTokens - safetyMargin;
  const utilization = Math.round(inputTokens / modelLimits.contextWindow * 100);
  console.log(
    `[Dispatch] ${model}: input≈${inputTokens} / ctx=${modelLimits.contextWindow}, output=${effectiveMaxTokens} (${100 - utilization}% headroom)`
  );
  if (inputTokens > modelLimits.contextWindow * 0.9) {
    const err = new Error(
      `[TokenBudget] Input tokens (≈${inputTokens}) exceed 90% of ${model}'s context window (${modelLimits.contextWindow}). Reduce the input or use a larger-context model.`
    );
    err.code = "TOKEN_BUDGET_EXCEEDED";
    err.inputTokens = inputTokens;
    err.contextWindow = modelLimits.contextWindow;
    throw err;
  }
  if (availableForOutput < requestedMaxTokens * 0.5) {
    console.warn(
      `[Dispatch] Warning: ${model} has limited output space. Available≈${availableForOutput} tokens, requested=${requestedMaxTokens}, output may be truncated.`
    );
  }
  console.log("[callChatAPI] Request URL:", url);
  return await retryOperation(async () => {
    const currentKey = keyManager.getCurrentKey();
    if (!currentKey) {
      throw new Error("No API keys available");
    }
    console.log(`[callChatAPI] Using key index, available: ${keyManager.getAvailableKeyCount()}/${totalKeys}`);
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${currentKey}`
    };
    const modelName = model;
    console.log("[callChatAPI] Using model:", modelName);
    const body = {
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: effectiveMaxTokens
    };
    if (options.disableThinking) {
      body.thinking = { type: "disabled" };
      console.log("[callChatAPI] Deep reasoning disabled (thinking: disabled)");
    }
    if (options.signal?.aborted) {
      throw new Error("Cancelled by user");
    }
    const timeoutMs = 12e4;
    const controller = new AbortController();
    const abortFromParent = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromParent, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await (async () => {
      try {
        return await corsFetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (options.signal?.aborted) {
            throw new Error("Cancelled by user");
          }
          throw new Error(`API request timed out after ${Math.round(timeoutMs / 1e3)} seconds`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", abortFromParent);
      }
    })();
    if (!response.ok) {
      const errorText = await response.text();
      if (keyManager.handleError(response.status, errorText)) {
        console.log(`[callChatAPI] Rotated to next API key due to error ${response.status}, available: ${keyManager.getAvailableKeyCount()}/${totalKeys}`);
      }
      if (response.status === 400) {
        const discovered = parseModelLimitsFromError(errorText);
        if (discovered) {
          cacheDiscoveredLimits(model, discovered);
          if (discovered.maxOutput && effectiveMaxTokens > discovered.maxOutput) {
            const correctedMaxTokens = Math.min(requestedMaxTokens, discovered.maxOutput);
            console.warn(
              `[callChatAPI] Discovered ${model} maxOutput=${discovered.maxOutput}, retrying automatically with max_tokens=${correctedMaxTokens}...`
            );
            const retryBody = { ...body, max_tokens: correctedMaxTokens };
            const retryResp = await corsFetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(retryBody),
              signal: options.signal
            });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              const retryContent = retryData.choices?.[0]?.message?.content;
              if (retryContent) {
                if (totalKeys > 1) keyManager.rotateKey();
                return retryContent;
              }
            } else {
              console.warn("[callChatAPI] Retry after discovery still failed:", retryResp.status);
            }
          }
        }
      }
      const error = new Error(`API request failed: ${response.status} - ${errorText}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const finishReason = data.choices?.[0]?.finish_reason;
      const usage = data.usage;
      const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
      console.error("[callChatAPI] API returned empty content. Diagnostic details:");
      console.error("[callChatAPI]   finish_reason:", finishReason);
      console.error("[callChatAPI]   usage:", JSON.stringify(usage));
      console.error("[callChatAPI]   choices length:", data.choices?.length);
      console.error("[callChatAPI]   message keys:", data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : "N/A");
      console.error("[callChatAPI]   reasoning_content length:", reasoningContent?.length || 0);
      console.error("[callChatAPI]   raw response (first 500 chars):", JSON.stringify(data).slice(0, 500));
      if (finishReason === "sensitive" || finishReason === "content_filter") {
        if (keyManager.handleError(403)) {
          console.warn(`[callChatAPI] Content was safety-filtered (${finishReason}), rotating to the next key`);
        }
        throw new Error(`Content was safety-filtered (finish_reason: ${finishReason})`);
      }
      if (finishReason === "length" && reasoningContent) {
        const jsonMatch = reasoningContent.match(/```json\s*([\s\S]*?)```/) || reasoningContent.match(/(\{[\s\S]*"characters"[\s\S]*\})/);
        if (jsonMatch) {
          console.log("[callChatAPI] Extracted JSON from reasoning_content");
          return jsonMatch[1] || jsonMatch[0];
        }
        const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens || 0;
        const completionTokens = usage?.completion_tokens || 0;
        const currentMaxTokens = body.max_tokens;
        const newMaxTokens = Math.min(currentMaxTokens * 2, modelLimits.maxOutput);
        if (reasoningTokens > 0 && completionTokens > 0 && reasoningTokens / completionTokens > 0.8 && newMaxTokens > currentMaxTokens) {
          console.warn(
            `[callChatAPI] Reasoning token budget exhausted (reasoning: ${reasoningTokens}/${completionTokens}), retrying automatically with max_tokens=${newMaxTokens}...`
          );
          const retryBody = { ...body, max_tokens: newMaxTokens };
          const retryResp = await corsFetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(retryBody),
            signal: options.signal
          });
          if (retryResp.ok) {
            const retryData = await retryResp.json();
            const retryContent = retryData.choices?.[0]?.message?.content;
            const retryUsage = retryData.usage;
            console.log(
              `[callChatAPI] Retry result: content=${retryContent?.length || 0} chars, reasoning=${retryUsage?.completion_tokens_details?.reasoning_tokens || "?"}, completion=${retryUsage?.completion_tokens || "?"}`
            );
            if (retryContent) {
              if (totalKeys > 1) keyManager.rotateKey();
              return retryContent;
            }
          } else {
            console.warn("[callChatAPI] Retry request failed:", retryResp.status);
          }
        } else {
          console.warn(
            `[callChatAPI] Reasoning token budget exhausted: reasoning ${reasoningContent.length} chars, content is empty. (reasoning_tokens=${reasoningTokens}, completion_tokens=${completionTokens}, max_tokens=${currentMaxTokens})`
          );
        }
      }
      throw new Error(`Empty response from API (finish_reason: ${finishReason || "unknown"})`);
    }
    if (totalKeys > 1) {
      keyManager.rotateKey();
    }
    return content;
  }, { maxRetries: 3, baseDelay: 2e3 });
}
function formatCliLogBlock(label, value, max = 4e3) {
  const text = value || "";
  const suffix = text.length > max ? `
... [truncated ${text.length - max} chars]` : "";
  return `[CLI] ${label} (${text.length} chars)
${text.slice(0, max)}${suffix}`;
}
const featureRoundRobinIndex = /* @__PURE__ */ new Map();
const FEATURE_PLATFORM_MAP = {
  script_analysis: "openrouter",
  character_generation: "googleflow",
  scene_generation: "googleflow",
  video_generation: "googleflow",
  image_understanding: "openrouter",
  chat: "openrouter"
};
const FEATURE_DEFAULT_MODEL = {
  character_generation: {
    googleflow: "GEM_PIX_2"
  },
  scene_generation: {
    googleflow: "GEM_PIX_2"
  },
  image_understanding: {
    openrouter: "anthropic/claude-sonnet-4-6"
  },
  video_generation: {
    googleflow: "Veo_3.1-Fast",
    grok: "Grok Imagine Video"
  }
};
function isBrowserRuntimePlatform(platform) {
  return platform === "googleflow" || platform === "grok";
}
function getFeatureProviderKeys(provider) {
  if (isBrowserRuntimePlatform(provider.platform)) {
    return ["__local_runtime__"];
  }
  return parseApiKeys(provider.apiKey);
}
function getCliFeatureConfig(feature) {
  if (!isCliFeatureEnabled(feature)) {
    return null;
  }
  const cliRuntime = useVideoStudioSettingsStore.getState().cliRuntime;
  const featureInfo = AI_FEATURES.find((f) => f.key === feature);
  const platform = getCliProviderPlatform(cliRuntime.adapter);
  const model = cliRuntime.model?.trim() || "";
  const provider = {
    id: `__${platform}`,
    platform,
    name: cliRuntime.adapter === "claude" ? "Claude CLI" : "OpenCode CLI",
    baseUrl: "cli://local",
    apiKey: "",
    model: model ? [model] : [],
    capabilities: ["text"]
  };
  return {
    feature,
    featureName: featureInfo?.name || feature,
    provider,
    apiKey: "",
    allApiKeys: [],
    keyManager: new ApiKeyManager(""),
    platform,
    baseUrl: provider.baseUrl,
    models: provider.model,
    model
  };
}
function getAllFeatureConfigs(feature) {
  const cliConfig = getCliFeatureConfig(feature);
  if (cliConfig) {
    return [cliConfig];
  }
  const store = useAPIConfigStore.getState();
  const providersWithModels = store.getProvidersForFeature(feature);
  const featureInfo = AI_FEATURES.find((f) => f.key === feature);
  const configs = [];
  for (const { provider, model } of providersWithModels) {
    const keys = getFeatureProviderKeys(provider);
    if (keys.length === 0) continue;
    const scopeKey = `${feature}:${model || "default"}`;
    const keyManager = isBrowserRuntimePlatform(provider.platform) ? new ApiKeyManager("") : getProviderKeyManager(provider.id, provider.apiKey, scopeKey);
    configs.push({
      feature,
      featureName: featureInfo?.name || feature,
      provider,
      apiKey: isBrowserRuntimePlatform(provider.platform) ? "" : keyManager.getCurrentKey() || keys[0],
      allApiKeys: keys,
      keyManager,
      platform: provider.platform,
      baseUrl: provider.baseUrl,
      models: [model],
      model
    });
  }
  return configs;
}
function getFeatureConfig(feature) {
  const cliConfig = getCliFeatureConfig(feature);
  if (cliConfig) {
    return cliConfig;
  }
  const configs = getAllFeatureConfigs(feature);
  if (configs.length === 0) {
    const store = useAPIConfigStore.getState();
    for (const binding of store.getFeatureBindings(feature)) {
      const separator = binding.indexOf(":");
      if (separator <= 0) continue;
      const providerIdOrPlatform = binding.slice(0, separator);
      const model = binding.slice(separator + 1);
      const provider = store.providers.find((item) => item.id === providerIdOrPlatform) || store.providers.find((item) => item.platform === providerIdOrPlatform);
      if (!provider || !isBrowserRuntimePlatform(provider.platform) || !provider.model.includes(model)) continue;
      const featureInfo = AI_FEATURES.find((item) => item.key === feature);
      return {
        feature,
        featureName: featureInfo?.name || feature,
        provider,
        apiKey: "",
        allApiKeys: ["__local_runtime__"],
        keyManager: new ApiKeyManager(""),
        platform: provider.platform,
        baseUrl: provider.baseUrl,
        models: [model],
        model
      };
    }
    const defaultPlatform = FEATURE_PLATFORM_MAP[feature];
    if (defaultPlatform) {
      const mediaFeature = feature === "character_generation" || feature === "scene_generation" || feature === "video_generation";
      const provider = store.providers.find((p) => p.platform === defaultPlatform) || (mediaFeature ? store.providers.find((p) => isBrowserRuntimePlatform(p.platform)) : void 0);
      if (provider) {
        const keys = getFeatureProviderKeys(provider);
        if (keys.length > 0) {
          const fallbackModel = FEATURE_DEFAULT_MODEL[feature]?.[provider.platform] || provider.model?.[0] || "";
          const scopeKey = `${feature}:${fallbackModel || "default"}`;
          const keyManager = isBrowserRuntimePlatform(provider.platform) ? new ApiKeyManager("") : getProviderKeyManager(provider.id, provider.apiKey, scopeKey);
          const featureInfo = AI_FEATURES.find((f) => f.key === feature);
          const defaultModel = FEATURE_DEFAULT_MODEL[feature]?.[provider.platform];
          const model = defaultModel || provider.model?.[0] || "";
          return {
            feature,
            featureName: featureInfo?.name || feature,
            provider,
            apiKey: isBrowserRuntimePlatform(provider.platform) ? "" : keyManager.getCurrentKey() || keys[0],
            allApiKeys: keys,
            keyManager,
            platform: provider.platform,
            baseUrl: provider.baseUrl,
            models: provider.model || [],
            model
          };
        }
      }
    }
    if (feature === "script_analysis") {
      const chatConfig = getFeatureConfig("chat");
      if (chatConfig) {
        const featureInfo = AI_FEATURES.find((f) => f.key === feature);
        return {
          ...chatConfig,
          feature,
          featureName: featureInfo?.name || feature
        };
      }
    }
    console.warn(`[FeatureRouter] No provider bound for feature: ${feature}`);
    return null;
  }
  if (configs.length === 1) {
    return configs[0];
  }
  const currentIndex = featureRoundRobinIndex.get(feature) || 0;
  const config = configs[currentIndex % configs.length];
  featureRoundRobinIndex.set(feature, currentIndex + 1);
  console.log(`[FeatureRouter] Multi-model rotation: ${feature} -> ${config.provider.name}:${config.model} (${currentIndex % configs.length + 1}/${configs.length})`);
  return config;
}
function getFeatureNotConfiguredMessage(feature) {
  const featureInfo = AI_FEATURES.find((f) => f.key === feature);
  const featureName = featureInfo?.name || feature;
  return `Hãy chọn nhà cung cấp và mô hình cho “${featureName}” trong phần cài đặt trước.`;
}
async function callFeatureAPI(feature, systemPrompt, userPrompt, options) {
  const config = options?.configOverride || getFeatureConfig(feature);
  if (!config) {
    throw new Error(getFeatureNotConfiguredMessage(feature));
  }
  const model = options?.modelOverride || config.model || config.models?.[0];
  const metadataTaskId = crypto.randomUUID();
  const beginMetadata = () => taskMetadata.begin({
    id: metadataTaskId,
    kind: "script",
    status: "queued",
    title: config.featureName,
    provider: config.provider.name || config.platform,
    model,
    prompt: `[SYSTEM]
${systemPrompt}

[USER]
${userPrompt}`,
    queuedAt: Date.now(),
    details: { feature, temperature: options?.temperature, maxTokens: options?.maxTokens }
  });
  if (isCliProvider(config.platform)) {
    beginMetadata();
    options?.onCliLog?.(`[CLI] Request start feature=${feature} provider=${config.platform} model=${model || "(default)"} session=${feature}`);
    options?.onCliLog?.(formatCliLogBlock("INPUT system prompt", systemPrompt));
    options?.onCliLog?.(formatCliLogBlock("INPUT user prompt", userPrompt));
    try {
      taskMetadata.submitted(metadataTaskId);
      const output = await runCliTextCompletion({
        feature,
        systemPrompt,
        userPrompt,
        model,
        sessionKey: feature
      });
      options?.onCliLog?.(formatCliLogBlock("OUTPUT response", output, 6e3));
      options?.onCliLog?.(`[CLI] Request done feature=${feature} provider=${config.platform} model=${model || "(default)"} session=${feature} output=${output.length} chars`);
      taskMetadata.completed(metadataTaskId, void 0, { responseCharacters: output.length });
      return output;
    } catch (error) {
      options?.onCliLog?.(`[CLI] Request failed session=${feature}: ${error instanceof Error ? error.message : String(error)}`);
      taskMetadata.failed(metadataTaskId, error);
      throw error;
    }
  }
  const baseUrl = config.baseUrl?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Please configure a Base URL in settings first");
  }
  if (!model) {
    throw new Error("Please configure a model in settings first");
  }
  beginMetadata();
  console.log(`[callFeatureAPI] Feature: ${feature}`);
  console.log(`[callFeatureAPI] Provider: ${config.provider.name} (${config.platform})`);
  console.log(`[callFeatureAPI] Model: ${model}`);
  console.log(`[callFeatureAPI] BaseURL: ${baseUrl}`);
  const disableThinking = options?.disableThinking ?? true;
  try {
    taskMetadata.submitted(metadataTaskId);
    const output = await callChatAPI(systemPrompt, userPrompt, {
      apiKey: config.allApiKeys.join(","),
      provider: "openai",
      baseUrl,
      model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      keyManager: config.keyManager,
      disableThinking
    });
    taskMetadata.completed(metadataTaskId, void 0, { responseCharacters: output.length });
    return output;
  } catch (error) {
    taskMetadata.failed(metadataTaskId, error);
    throw error;
  }
}
function randomBetween(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}
function isAbortLikeError(error) {
  const err = error;
  return err?.name === "AbortError" || err?.message === "Cancelled by user";
}
function delayOrAbort(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Cancelled by user"));
      return;
    }
    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new Error("Cancelled by user"));
    }, { once: true });
  });
}
function buildLaneWorkers(jwtHashes, lanesPerJwt) {
  const safeLanesPerJwt = Math.max(lanesPerJwt || 1, 1);
  if (jwtHashes.length === 0) {
    return Array.from({ length: safeLanesPerJwt }, (_, index) => ({ slot: index + 1 }));
  }
  return Array.from({ length: safeLanesPerJwt }).flatMap(
    (_, index) => jwtHashes.map((jwtHash) => ({ jwtHash, slot: index + 1 }))
  );
}
async function runLaneQueue(jobs, workers, runJob, signal) {
  const pending = [...jobs];
  const activeWorkers = workers.length > 0 ? workers : [{ slot: 1 }];
  const takeNextJob = (worker) => {
    const exactIndex = pending.findIndex((job) => !!worker.jwtHash && job.jwtHash === worker.jwtHash);
    if (exactIndex >= 0) return pending.splice(exactIndex, 1)[0];
    const flexibleIndex = pending.findIndex((job) => !job.jwtHash);
    if (flexibleIndex >= 0) return pending.splice(flexibleIndex, 1)[0];
    if (!worker.jwtHash && pending.length > 0) return pending.shift();
    return void 0;
  };
  await Promise.all(activeWorkers.map(async (worker) => {
    while (!signal?.aborted) {
      const job = takeNextJob(worker);
      if (!job) return;
      if (signal?.aborted) return;
      await runJob(job, worker);
    }
  }));
}
async function runOrdered(items, concurrency, runItem, signal) {
  if (items.length === 0) return [];
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(1, Math.floor(concurrency)), items.length) },
    async () => {
      while (!signal?.aborted) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= items.length) return;
        results[currentIndex] = await runItem(items[currentIndex], currentIndex);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
const IMAGE_GENERATION_TIMEOUT_MIN_MS = 150 * 1e3;
const IMAGE_GENERATION_TIMEOUT_MAX_MS = 200 * 1e3;
const VIDEO_GENERATION_TIMEOUT_MIN_MS = 6 * 60 * 1e3;
const VIDEO_GENERATION_TIMEOUT_MAX_MS = 7 * 60 * 1e3;
const FLOW_GENERATION_MAX_RETRIES = 1;
function getOrderedDelay(minMs, maxMs) {
  const min = Math.max(0, minMs || 0);
  const max = Math.max(0, maxMs || 0);
  return [Math.min(min, max), Math.max(min, max)];
}
function getGenerationFlowSettings() {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const [imageTimeoutMinMs, imageTimeoutMaxMs] = getOrderedDelay(
    settings.imageGenerationTimeoutMinMs ?? IMAGE_GENERATION_TIMEOUT_MIN_MS,
    settings.imageGenerationTimeoutMaxMs ?? IMAGE_GENERATION_TIMEOUT_MAX_MS
  );
  const [videoTimeoutMinMs, videoTimeoutMaxMs] = getOrderedDelay(
    settings.videoGenerationTimeoutMinMs ?? VIDEO_GENERATION_TIMEOUT_MIN_MS,
    settings.videoGenerationTimeoutMaxMs ?? VIDEO_GENERATION_TIMEOUT_MAX_MS
  );
  return {
    imageTimeoutMinMs,
    imageTimeoutMaxMs,
    videoTimeoutMinMs,
    videoTimeoutMaxMs,
    retryAttempts: Math.max(0, Math.floor(settings.generationRetryAttempts ?? FLOW_GENERATION_MAX_RETRIES))
  };
}
async function syncRuntimeLaneSettings() {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  if (window.googleFlowRuntime) {
    try {
      await window.googleFlowRuntime.updateSettings({
        imageLanesPerToken: settings.imageLanesPerJwt,
        videoLanesPerToken: settings.videoLanesPerJwt,
        imageSubmitDelayMinMs: settings.imageSubmitDelayMinMs,
        imageSubmitDelayMaxMs: settings.imageSubmitDelayMaxMs,
        videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
        videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
        accountStartStaggerMinMs: settings.jwtStartStaggerMinMs,
        accountStartStaggerMaxMs: settings.jwtStartStaggerMaxMs
      });
    } catch (error) {
      console.warn("[LaneManager] Could not sync Google Flow lane settings:", error);
    }
  }
  if (window.grokVideoRuntime) {
    try {
      await window.grokVideoRuntime.updateSettings({
        videoLanesPerExtension: settings.videoLanesPerJwt,
        videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
        videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
        extensionStartStaggerMinMs: settings.jwtStartStaggerMinMs,
        extensionStartStaggerMaxMs: settings.jwtStartStaggerMaxMs
      });
    } catch (error) {
      console.warn("[LaneManager] Could not sync Grok lane settings:", error);
    }
  }
}
async function resolveLaneCount(kind, platform) {
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const configured = Math.max(1, kind === "image" ? settings.imageLanesPerJwt : settings.videoLanesPerJwt);
  if (platform === "googleflow" && window.googleFlowRuntime) {
    try {
      const capacity = await window.googleFlowRuntime.getCapacity();
      const lanes = kind === "image" ? capacity.imageLanes : capacity.videoLanes;
      return Math.max(1, lanes || configured);
    } catch {
      return configured;
    }
  }
  if (kind === "video" && platform === "grok" && window.grokVideoRuntime) {
    try {
      const capacity = await window.grokVideoRuntime.getCapacity();
      return Math.max(1, capacity.videoLanes || configured);
    } catch {
      return configured;
    }
  }
  return configured;
}
async function withRetry(options, run) {
  const totalAttempts = Math.max(1, Math.floor(options.attempts));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 0);
  let lastError = new Error("Operation failed");
  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    if (options.signal?.aborted) throw new DOMException("Cancelled by user", "AbortError");
    try {
      return await run(attempt, totalAttempts);
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (isAbortLikeError(error)) throw error;
      lastError = error;
      if (attempt >= totalAttempts) break;
      if (options.retryable && !options.retryable(error)) throw error;
      options.onRetry?.(attempt + 1, error);
      if (baseDelayMs > 0) {
        await delayOrAbort(baseDelayMs * Math.pow(2, attempt - 1), options.signal);
      }
    }
  }
  throw lastError;
}
const STAGE_WEIGHT = {
  script: 8,
  audio: 12,
  subtitles: 10,
  shots: 15,
  research: 7,
  characters: 4,
  scenes: 4,
  images: 15,
  videos: 15,
  media: 37,
  render: 10
};
const STAGE_BASE = {
  script: 0,
  audio: 8,
  subtitles: 20,
  shots: 30,
  research: 45,
  characters: 52,
  scenes: 56,
  images: 60,
  videos: 75,
  media: 53,
  render: 90
};
const STEP_ORDER = ["audio", "shots", "research", "references", "images", "videos", "render", "done"];
class StepCheckpointReached extends Error {
  constructor(completedStep, nextStep) {
    super(`AutoPilot checkpoint: ${completedStep}`);
    this.completedStep = completedStep;
    this.nextStep = nextStep;
  }
}
async function runGenerationWithRetries(retryAttempts, signal, operation, onRetry) {
  const totalAttempts = Math.max(1, Math.floor(retryAttempts) + 1);
  return withRetry(
    {
      attempts: totalAttempts,
      baseDelayMs: 0,
      signal,
      onRetry: (nextAttempt, error) => onRetry(nextAttempt, totalAttempts, error)
    },
    operation
  );
}
function normalizeRestoredAssetStatus(status) {
  const raw = status;
  if (raw === "running" || raw === "queued" || raw === "uploading" || raw === "generating") return "idle";
  if (raw === "done") return "completed";
  return status || "idle";
}
const KEN_BURNS_EFFECTS = ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "zoom_pan_left", "zoom_pan_right"];
function randomKenBurns() {
  return KEN_BURNS_EFFECTS[Math.floor(Math.random() * KEN_BURNS_EFFECTS.length)];
}
function getTextAiConfig() {
  const config = getFeatureConfig("script_analysis") || getFeatureConfig("chat");
  if (!config?.apiKey && config?.baseUrl !== "cli://local") {
    throw new Error("Chưa cấu hình AI cho viết kịch bản và lập visual plan");
  }
  return config;
}
async function runGoogleFlowQueueOrdered(ctx, job, stage, kind, items, signal, runItem) {
  if (items.length === 0) return [];
  await syncRuntimeLaneSettings();
  const laneCount = await resolveLaneCount(kind, "googleflow");
  ctx.log(job.id, stage, `Queue ${kind === "image" ? "ảnh" : "video"} dùng chung với Đạo diễn: ${laneCount} lane`);
  const results = new Array(items.length);
  await runLaneQueue(
    items.map((item, index) => ({ item: { item, index } })),
    buildLaneWorkers([], laneCount),
    async ({ item }) => {
      results[item.index] = await runItem(item.item, item.index);
    },
    signal
  );
  return results;
}
async function runScriptStage(ctx, job, signal) {
  let scriptText = job.input.script?.trim();
  if (!scriptText && job.input.topic?.trim()) {
    ctx.log(job.id, "script", "Viết kịch bản từ chủ đề...");
    ctx.stageProgress(job.id, "script", 10);
    const config = getTextAiConfig();
    scriptText = await callChatAPI(
      AUTOPILOT_WRITER_SYSTEM_PROMPT,
      buildAutopilotWriterUserPrompt(job.input.topic.trim(), job.input.style, job.input.skill),
      {
        apiKey: config.apiKey,
        provider: config.platform,
        baseUrl: config.baseUrl,
        model: config.model || config.models?.[0] || "",
        maxTokens: 8e3,
        signal,
        onCliLog: (message) => ctx.log(job.id, "script", message)
      }
    );
    ctx.updateJob(job.id, { scriptText });
    ctx.log(job.id, "script", `Kịch bản: ${scriptText.length} ký tự`);
  } else {
    scriptText = scriptText || "";
    if (!scriptText) throw new Error("Không có chủ đề hoặc kịch bản để chạy");
    ctx.updateJob(job.id, { scriptText });
    ctx.log(job.id, "script", "Dùng kịch bản có sẵn");
  }
  ctx.stageProgress(job.id, "script", 100);
  return scriptText;
}
async function runAudioStage(ctx, job, narrationBlocks, signal) {
  const v = job.input.voice || {};
  const capability = v.capability || v.engine || "capcut";
  const model = v.modelId ? getTtsModel(v.modelId) : void 0;
  const modelId = v.modelId || (capability === "omnivoice" ? "omnivoice-main" : capability === "vieneu" ? "vieneu-v3-turbo" : capability === "gemini" ? "gemini-3.1-flash-tts-preview" : capability === "vbee" ? "vbee-api" : "capcut-online");
  const repository = v.repository || model?.repository || (capability === "omnivoice" ? "k2-fsa/OmniVoice" : capability === "vieneu" ? "pnnbao97/VieNeu-TTS" : capability === "gemini" ? "https://generativelanguage.googleapis.com" : capability === "vbee" ? "https://vbee.vn/api/v1/tts" : "https://editor-api-sg.capcutapi.com");
  const isOnline = (model?.runtimeKind ?? (capability === "omnivoice" || capability === "vieneu" ? "local" : "online")) === "online";
  const isCapcut = capability === "capcut";
  const isGemini = capability === "gemini";
  const isVbee = capability === "vbee";
  const isOmnivoice = capability === "omnivoice";
  const isVieneu = capability === "vieneu";
  const capcutVoiceType = isCapcut ? v.capcutVoiceType || v.voiceType || "BV421_vivn_streaming" : void 0;
  const capcutResourceId = isCapcut ? v.capcutResourceId || getCapCutVoice(capcutVoiceType || "")?.resourceId || "" : void 0;
  const cloneProfile = (isOmnivoice || isVieneu) && v.profileId && v.referenceAudioPath ? v : void 0;
  const mode = isOnline ? "preset" : isVieneu ? cloneProfile ? "clone" : "preset" : v.mode && v.mode !== "preset" ? v.mode : cloneProfile ? "clone" : "auto";
  ctx.log(job.id, "audio", cloneProfile ? `Tạo voice bằng giọng clone OmniVoice (${v.profileId}) trước media...` : `Tạo voice trước media (${v.engineName || capability}, ${narrationBlocks.length} khối)...`);
  ctx.stageProgress(job.id, "audio", 10);
  const ttsJobId = `autopilot-tts-${job.id}-${Date.now()}`;
  const abort = () => {
    void window.ttsRuntime?.cancel(ttsJobId);
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const result = await window.ttsRuntime?.generate({
      jobId: ttsJobId,
      model: { id: modelId, repository, capability },
      text: narrationBlocks.join("\n"),
      mode,
      // Vbee accepts the locked narration as one request up to 50,000
      // characters. Its runtime only chunks text when that limit is exceeded.
      splitMode: isVbee ? "default" : "line",
      language: v.language || (isGemini ? "vi-VN" : "vi"),
      speed: v.speed,
      numStep: v.numStep,
      capcutVoiceType,
      capcutResourceId,
      geminiVoiceName: isGemini ? v.geminiVoiceName || v.voiceName || "Puck" : void 0,
      geminiStyle: isGemini ? v.geminiStyle : void 0,
      vbeeVoiceCode: isVbee ? v.vbeeVoiceCode : void 0,
      vbeeAudioType: isVbee ? v.vbeeAudioType : void 0,
      vbeeBitrate: isVbee ? v.vbeeBitrate : void 0,
      vieneuVoice: isVieneu ? v.vieneuVoice : void 0,
      vieneuStyle: isVieneu ? v.vieneuStyle : void 0,
      instruction: mode === "design" ? v.instruction : void 0,
      profileId: cloneProfile?.profileId,
      referenceAudioPath: cloneProfile?.referenceAudioPath,
      referenceText: cloneProfile?.referenceText
    });
    if (!result?.success || !result.outputPath) throw new Error(result?.error || "Không tạo được giọng đọc");
    const probed = result.durationSec || (await window.ffmpegRuntime?.probeDuration(result.outputPath))?.durationSec || 0;
    const durationMs = Math.max(1e3, Math.round(probed * 1e3));
    ctx.updateJob(job.id, { audioPath: result.outputPath, audioDurationMs: durationMs });
    ctx.log(job.id, "audio", `Audio khóa timeline: ${result.outputPath} (${(durationMs / 1e3).toFixed(1)}s)`);
    ctx.stageProgress(job.id, "audio", 100);
    return { path: result.outputPath, durationMs };
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
async function runImportedAudioStage(ctx, job, audioPath) {
  ctx.log(job.id, "audio", `Dùng file giọng đọc có sẵn, bỏ qua TTS: ${audioPath}`);
  ctx.stageProgress(job.id, "audio", 20);
  const probed = await window.ffmpegRuntime?.probeDuration(audioPath);
  const durationSec = probed?.durationSec || 0;
  if (durationSec <= 0) throw new Error("Không đọc được thời lượng file giọng đọc");
  const durationMs = Math.round(durationSec * 1e3);
  ctx.updateJob(job.id, { audioPath, audioDurationMs: durationMs });
  ctx.log(job.id, "audio", `Audio import khóa timeline: ${(durationMs / 1e3).toFixed(1)}s`);
  ctx.stageProgress(job.id, "audio", 100);
  return { path: audioPath, durationMs };
}
async function runSubtitlesStage(ctx, job, audioPath, signal) {
  const provider = job.input.whisperProvider || useAutoVideoStore.getState().whisperProvider || "openai";
  const apiKey = job.input.whisperApiKey || useAutoVideoStore.getState().whisperApiKeys[provider] || "";
  if (!apiKey) {
    ctx.log(job.id, "subtitles", "Không có Whisper key — ước lượng beat từ audio duration và narration");
    ctx.updateJob(job.id, { srtSegments: [] });
    ctx.stageProgress(job.id, "subtitles", 100);
    return [];
  }
  ctx.log(job.id, "subtitles", `Căn thời gian narration bằng Whisper (${provider})...`);
  ctx.stageProgress(job.id, "subtitles", 10);
  const whisperJobId = `autopilot-whisper-${job.id}-${Date.now()}`;
  const abort = () => {
    void window.whisperRuntime?.cancel(whisperJobId);
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const result = await window.whisperRuntime?.transcribe({ jobId: whisperJobId, audioPath, provider, apiKey, language: "vi" });
    if (!result?.success || !result.srt) {
      ctx.log(job.id, "subtitles", `Whisper thất bại: ${result?.error || "unknown"} — dùng timing ước lượng`);
      ctx.updateJob(job.id, { srtSegments: [] });
      ctx.stageProgress(job.id, "subtitles", 100);
      return [];
    }
    const parsed = parseSrt(result.srt);
    const segments = parsed.segments.map((seg, index) => ({ index, startMs: seg.startMs, endMs: seg.endMs, text: seg.text }));
    ctx.updateJob(job.id, { srtSegments: segments });
    ctx.log(job.id, "subtitles", `${segments.length} caption, dùng để lập beat hình ảnh`);
    ctx.stageProgress(job.id, "subtitles", 100);
    return segments;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
function splitTimedUnitsIntoChapters(units, options = {}) {
  if (units.length === 0) return [];
  const targetMs = Math.max(3e4, options.targetMs ?? 18e4);
  const minMs = Math.min(targetMs, Math.max(15e3, options.minMs ?? 12e4));
  const maxMs = Math.max(targetMs, options.maxMs ?? 24e4);
  const chapters = [];
  let start = 0;
  while (start < units.length) {
    let end = start;
    let bestEnd = start;
    while (end < units.length) {
      const duration = units[end].endMs - units[start].startMs;
      const sentenceBoundary = /[.!?…]["'”’)]?\s*$/u.test(units[end].text.trim());
      if (duration >= minMs && sentenceBoundary) bestEnd = end;
      if (duration >= targetMs && bestEnd > start) {
        end = bestEnd;
        break;
      }
      if (duration >= maxMs) break;
      end += 1;
    }
    end = Math.min(end, units.length - 1);
    if (end === units.length - 1 || units[end].endMs - units[start].startMs < minMs) {
      end = Math.min(units.length - 1, Math.max(end, bestEnd));
    }
    const slice = units.slice(start, end + 1);
    const index = chapters.length + 1;
    chapters.push({
      id: `chapter-${String(index).padStart(2, "0")}`,
      index,
      title: `Chapter ${index}`,
      startMs: slice[0].startMs,
      endMs: slice[slice.length - 1].endMs,
      startUnitIndex: slice[0].index,
      endUnitIndex: slice[slice.length - 1].index,
      unitIndexes: slice.map((unit) => unit.index)
    });
    start = end + 1;
  }
  return chapters;
}
function validateLongFormCoverage(sourceIndexes, chapterIndexes) {
  const expected = new Set(sourceIndexes);
  const seen = /* @__PURE__ */ new Map();
  const flattened = chapterIndexes.flat();
  flattened.forEach((index) => seen.set(index, (seen.get(index) || 0) + 1));
  const missingIndexes = sourceIndexes.filter((index) => !seen.has(index));
  const duplicateIndexes = [...seen.entries()].filter(([, count]) => count > 1).map(([index]) => index);
  const relevant = flattened.filter((index) => expected.has(index));
  const outOfOrder = relevant.some((index, position) => position > 0 && index < relevant[position - 1]);
  return {
    valid: missingIndexes.length === 0 && duplicateIndexes.length === 0 && !outOfOrder,
    missingIndexes,
    duplicateIndexes,
    outOfOrder
  };
}
async function runConcurrentOrdered(items, concurrency, worker) {
  if (items.length === 0) return [];
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, Math.floor(concurrency)), items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}
function dedupeByName(items, isComplete) {
  return items.filter(isComplete).filter((item, index, all) => all.findIndex((candidate) => candidate.name.toLocaleLowerCase() === item.name.toLocaleLowerCase()) === index);
}
async function runShotsStage(ctx, job, beats, signal, options = {}) {
  ctx.log(job.id, "shots", `AI viết visual prompt cho ${beats.length} beat đã khóa timing...`);
  if (options.progress !== false) ctx.stageProgress(job.id, "shots", 10);
  const config = getTextAiConfig();
  const skill = [job.input.skill, job.input.style].filter(Boolean).join("\n\n").slice(0, 4e4);
  const allowRealImageResearch = skillAllowsRealImageResearch(job.input.skill);
  const beatPayload = beats.map((beat) => ({
    beatIndex: beat.index,
    startMs: beat.startMs,
    endMs: beat.endMs,
    durationSec: Number(((beat.endMs - beat.startMs) / 1e3).toFixed(2)),
    narration: beat.text
  }));
  const appStyleContext = job.visualStylePrompt ? `

APP IMAGE STYLE (mandatory for every character reference and shot frame):
${job.visualStylePrompt}` : "";
  const userPrompt = `REAL IMAGE RESEARCH POLICY: ${allowRealImageResearch ? "ENABLED — follow only the creative skill research rules." : "DISABLED — realImageQuery must be empty for every shot."}

CREATIVE SKILL:
${skill || "Cinematic editorial documentary, visually coherent across the film."}${appStyleContext}${options.extraContext ? `

${options.extraContext}` : ""}

LOCKED AUDIO BEATS:
${JSON.stringify(beatPayload)}`;
  const chatOptions = {
    apiKey: config.apiKey,
    provider: config.platform,
    baseUrl: config.baseUrl,
    model: config.model || config.models?.[0] || "",
    maxTokens: 1e4,
    signal,
    onCliLog: (message) => ctx.log(job.id, "shots", message)
  };
  let response = await callChatAPI(AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT, userPrompt, chatOptions);
  let plan = parsePlannerResponse(response);
  if (plan.shots.length === 0) {
    ctx.log(job.id, "shots", "JSON visual plan không hợp lệ — retry bằng contract rút gọn");
    response = await callChatAPI(
      `${AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT}
Your previous response was invalid. Keep strings concise and verify every JSON quote and comma.`,
      userPrompt,
      chatOptions
    );
    plan = parsePlannerResponse(response);
  }
  const items = plan.shots;
  const itemByBeat = new Map(items.map((item, index) => [Number(item.beatIndex || index + 1), item]));
  const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
  let fallbackCount = 0;
  let researchedImageCount = 0;
  const maxResearchedImages = Math.max(1, Math.floor(beats.length * 0.25));
  const shots = beats.map((beat, index) => {
    const planned = itemByBeat.get(beat.index) || fallbackPlannerItem(beat, aspectRatio, job.input.style);
    if (!itemByBeat.has(beat.index)) fallbackCount += 1;
    const imagePrompt = planned.imagePrompt?.trim() || fallbackPlannerItem(beat, aspectRatio, job.input.style).imagePrompt || "";
    const videoPrompt = planned.videoPrompt?.trim() || fallbackPlannerItem(beat, aspectRatio, job.input.style).videoPrompt || "";
    const requestedRealImageQuery = planned.realImageQuery?.trim() || "";
    const canUseRealImage = allowRealImageResearch && requestedRealImageQuery.length > 0 && researchedImageCount < maxResearchedImages;
    if (canUseRealImage) researchedImageCount += 1;
    return {
      id: `autopilot-shot-${index + 1}`,
      index: index + 1,
      sceneRefId: String(planned.sceneName || "").trim(),
      imagePrompt,
      videoPrompt,
      transitionToNext: normalizeTransition(planned.transitionToNext, index, beats.length),
      realImageQuery: canUseRealImage ? requestedRealImageQuery : void 0,
      voiceOver: beat.text,
      videoLength: toFlowDuration(beat.endMs - beat.startMs),
      startMs: beat.startMs,
      endMs: beat.endMs,
      hasCharacters: Array.isArray(planned.characterNames) && planned.characterNames.length > 0,
      characterNames: Array.isArray(planned.characterNames) ? planned.characterNames.map((name) => String(name).trim()).filter(Boolean) : [],
      imageStatus: "idle",
      imageProgress: 0,
      videoStatus: "idle",
      videoProgress: 0
    };
  });
  if (fallbackCount > 0) ctx.log(job.id, "shots", `${fallbackCount} beat thiếu JSON hợp lệ — dùng prompt fallback, narration vẫn được giữ nguyên`);
  ctx.log(job.id, "shots", allowRealImageResearch ? `Skill bật ảnh tư liệu: AI chọn ${researchedImageCount}/${shots.length} shot (giới hạn an toàn 25%)` : "Skill không bật ảnh tư liệu: bỏ qua hoàn toàn bước tìm ảnh thật");
  ctx.log(job.id, "shots", `${shots.length} shot sẵn sàng; tất cả có voiceOver + timing`);
  if (options.progress !== false) ctx.stageProgress(job.id, "shots", 100);
  const characters = dedupeByName(
    plan.characters.map((character) => ({
      name: String(character.name || "").trim(),
      description: String(character.description || "").trim(),
      characterPrompt: String(character.characterPrompt || "").trim()
    })),
    (character) => Boolean(character.name && character.characterPrompt)
  );
  const scenes = dedupeByName(
    plan.scenes.map((scene) => ({
      name: String(scene.name || "").trim(),
      description: String(scene.description || "").trim(),
      scenePrompt: String(scene.scenePrompt || "").trim()
    })),
    (scene) => Boolean(scene.name && scene.scenePrompt)
  );
  if (options.persist !== false) {
    ctx.updateJob(job.id, {
      shotCount: shots.length,
      plannedShots: shots,
      plannedCharacters: characters,
      plannedScenes: scenes
    });
  }
  ctx.log(job.id, "shots", `AI xác định ${characters.length} nhân vật cần giữ đồng nhất`);
  ctx.log(job.id, "shots", `AI xác định ${scenes.length} cảnh cần ảnh tham chiếu`);
  return { shots, characters, scenes };
}
async function runLongFormShotsStage(ctx, job, beats, signal) {
  const concurrency = Math.max(1, useVideoStudioSettingsStore.getState().autopilot.planningConcurrency ?? 2);
  const boundaries = splitTimedUnitsIntoChapters(beats, { targetMs: 12e4, minMs: 9e4, maxMs: 15e4 });
  const coverage = validateLongFormCoverage(
    beats.map((beat) => beat.index),
    boundaries.map((chapter) => chapter.unitIndexes)
  );
  if (!coverage.valid) {
    throw new Error(`Long-form chapter coverage invalid (missing: ${coverage.missingIndexes.join(", ") || "none"}; duplicate: ${coverage.duplicateIndexes.join(", ") || "none"})`);
  }
  const previousById = new Map((job.chapters || []).map((chapter) => [chapter.id, chapter]));
  let chapters = boundaries.map((boundary) => {
    const previous = previousById.get(boundary.id);
    const sameCoverage = previous && previous.beatIndexes.length === boundary.unitIndexes.length && previous.beatIndexes.every((index, position) => index === boundary.unitIndexes[position]);
    return sameCoverage ? { ...previous } : {
      id: boundary.id,
      index: boundary.index,
      title: boundary.title,
      startMs: boundary.startMs,
      endMs: boundary.endMs,
      beatIndexes: boundary.unitIndexes,
      status: "idle",
      progress: 0
    };
  });
  const syncChapters = () => {
    ctx.updateJob(job.id, { longFormMode: true, chapters: chapters.map((chapter) => ({ ...chapter })) });
  };
  syncChapters();
  ctx.log(job.id, "shots", `Long-form: ${chapters.length} chương, ${concurrency} AI worker, checkpoint theo từng chương`);
  let bible = job.longFormBible;
  if (!bible) {
    ctx.log(job.id, "shots", "AI khóa story/visual bible dùng chung cho toàn bộ phim...");
    const config = getTextAiConfig();
    const narration = beats.map((beat) => `[${beat.index}] ${beat.text}`).join("\n").slice(0, 48e3);
    const response = await callChatAPI(
      AUTOPILOT_LONG_FORM_BIBLE_SYSTEM_PROMPT,
      `CREATIVE SKILL:
${(job.input.skill || job.input.style || "Cinematic editorial documentary").slice(0, 14e3)}

LOCKED NARRATION OVERVIEW:
${narration}`,
      {
        apiKey: config.apiKey,
        provider: config.platform,
        baseUrl: config.baseUrl,
        model: config.model || config.models?.[0] || "",
        maxTokens: 2500,
        signal,
        onCliLog: (message) => ctx.log(job.id, "shots", message)
      }
    );
    bible = normalizeLongFormBible(safeParseJson(cleanJsonString(response), {}));
    ctx.updateJob(job.id, { longFormBible: bible });
    ctx.log(job.id, "shots", `Đã khóa continuity bible: ${bible.visualTheme}`);
  } else {
    ctx.log(job.id, "resume", "Dùng lại continuity bible đã lưu");
  }
  const pendingChapters = chapters.filter((chapter) => chapter.status !== "done" || !chapter.plannedShots?.length);
  if (pendingChapters.length > 0) {
    pendingChapters.forEach((chapter) => {
      chapter.status = "queued";
      chapter.progress = 0;
      chapter.error = void 0;
    });
    syncChapters();
    let completed = chapters.length - pendingChapters.length;
    const results = await runConcurrentOrdered(pendingChapters, concurrency, async (chapter) => {
      chapter.status = "running";
      chapter.progress = 15;
      syncChapters();
      const chapterBeats = beats.filter((beat) => chapter.beatIndexes.includes(beat.index));
      const previous = chapters[chapter.index - 2];
      const next = chapters[chapter.index];
      const neighborContext = [
        previous ? `PREVIOUS CHAPTER END: ${beats.filter((beat) => previous.beatIndexes.includes(beat.index)).slice(-2).map((beat) => beat.text).join(" ")}` : "",
        next ? `NEXT CHAPTER START: ${beats.filter((beat) => next.beatIndexes.includes(beat.index)).slice(0, 2).map((beat) => beat.text).join(" ")}` : ""
      ].filter(Boolean).join("\n");
      try {
        const plan = await runShotsStage(ctx, job, chapterBeats, signal, {
          persist: false,
          progress: false,
          extraContext: `GLOBAL CONTINUITY BIBLE (authoritative):
${JSON.stringify(bible)}

CHAPTER ${chapter.index}/${chapters.length}: ${chapter.startMs}-${chapter.endMs}ms
${neighborContext}`
        });
        chapter.plannedShots = plan.shots;
        chapter.plannedCharacters = plan.characters;
        chapter.plannedScenes = plan.scenes;
        chapter.status = "done";
        chapter.progress = 100;
        chapter.error = void 0;
        completed += 1;
        syncChapters();
        ctx.stageProgress(job.id, "shots", Math.round(completed / chapters.length * 100));
        ctx.log(job.id, "shots", `Chapter ${chapter.index}/${chapters.length}: đã lưu ${plan.shots.length} shot`);
        return { ok: true };
      } catch (error) {
        chapter.status = "failed";
        chapter.progress = 0;
        chapter.error = error instanceof Error ? error.message : String(error);
        syncChapters();
        return { ok: false, error: chapter.error };
      }
    });
    const failed = results.find((result) => !result.ok);
    if (failed && !failed.ok) throw new Error(`Lập kế hoạch chương thất bại: ${failed.error}`);
  } else {
    ctx.log(job.id, "resume", `Bỏ qua ${chapters.length} chapter plan đã hoàn thành`);
  }
  chapters = [...chapters].sort((a, b) => a.index - b.index);
  const mergedShots = chapters.flatMap((chapter) => chapter.plannedShots || []).map((shot, index, all) => ({
    ...shot,
    id: `autopilot-shot-${index + 1}`,
    index: index + 1,
    transitionToNext: index === all.length - 1 ? "none" : chapters.some((chapter) => chapter.endMs === shot.endMs) ? "fade_black" : shot.transitionToNext
  }));
  const mergedCharacters = dedupeByName(
    chapters.flatMap((chapter) => chapter.plannedCharacters || []),
    (character) => Boolean(character.name && character.characterPrompt)
  );
  const mergedScenes = dedupeByName(
    chapters.flatMap((chapter) => chapter.plannedScenes || []),
    (scene) => Boolean(scene.name && scene.scenePrompt)
  );
  if (mergedShots.length !== beats.length) {
    throw new Error(`Long-form plan thiếu shot: cần ${beats.length}, nhận ${mergedShots.length}`);
  }
  ctx.updateJob(job.id, {
    shotCount: mergedShots.length,
    plannedShots: mergedShots,
    plannedCharacters: mergedCharacters,
    plannedScenes: mergedScenes,
    chapters
  });
  ctx.stageProgress(job.id, "shots", 100);
  return { shots: mergedShots, characters: mergedCharacters, scenes: mergedScenes };
}
function runImportedPlanStage(ctx, job, beats, imported) {
  if (imported.shots.length !== beats.length) throw new Error(`JSON có ${imported.shots.length} shot nhưng timeline voice có ${beats.length} shot`);
  ctx.log(job.id, "shots", `Dùng kế hoạch JSON ${imported.shots.length} shot — bỏ qua AI/CLI lập shot`);
  const shots = imported.shots.map((planned, index) => {
    const beat = beats[index];
    const characterNames = (planned.characterNames || []).map((name) => name.trim()).filter(Boolean);
    const realImageQuery = planned.realImageQuery?.trim() || void 0;
    return {
      id: `autopilot-shot-${index + 1}`,
      index: index + 1,
      sceneRefId: planned.sceneName?.trim() || "",
      imagePrompt: planned.imagePrompt.trim(),
      videoPrompt: planned.videoPrompt?.trim() || "",
      transitionToNext: normalizeTransition(planned.transitionToNext, index, beats.length),
      realImageQuery,
      voiceOver: beat.text,
      videoLength: toFlowDuration(beat.endMs - beat.startMs),
      startMs: beat.startMs,
      endMs: beat.endMs,
      hasCharacters: characterNames.length > 0,
      characterNames,
      imageStatus: "idle",
      imageProgress: 0,
      videoStatus: "idle",
      videoProgress: 0
    };
  });
  const characters = dedupeByName(
    (imported.characters || []).map((item) => ({
      name: item.name.trim(),
      description: item.description?.trim() || "",
      characterPrompt: item.characterPrompt.trim()
    })),
    (item) => Boolean(item.name && item.characterPrompt)
  );
  const scenes = dedupeByName(
    (imported.scenes || []).map((item) => ({
      name: item.name.trim(),
      description: item.description?.trim() || "",
      scenePrompt: item.scenePrompt.trim()
    })),
    (item) => Boolean(item.name && item.scenePrompt)
  );
  ctx.updateJob(job.id, { shotCount: shots.length, plannedShots: shots, plannedCharacters: characters, plannedScenes: scenes });
  ctx.stageProgress(job.id, "shots", 100);
  ctx.log(job.id, "shots", `JSON khóa ${characters.length} nhân vật, ${scenes.length} cảnh, ${shots.filter((shot) => shot.realImageQuery).length} shot tư liệu thật`);
  return { shots, characters, scenes };
}
function getGoogleFlowUserFacingError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/no ready|extension/i.test(message)) return "Tiện ích Google Flow chưa kết nối với ứng dụng. Hãy mở Google Flow trong Chrome rồi kết nối lại tiện ích LONGDD.";
  if (/captcha/i.test(message)) return `Google Flow không vượt qua được CAPTCHA: ${message.replace(/^CAPTCHA:\s*/i, "")}`;
  if (/token|flow_key|401|403/i.test(message)) return "Phiên Google Flow đã hết hạn. Hãy tải lại trang Google Flow rồi thử lại.";
  if (/quota|credit|429/i.test(message)) return "Tài khoản Google Flow không còn hạn mức hoặc tín dụng khả dụng.";
  if (/moderation|safety/i.test(message)) return "Google Flow đã từ chối nội dung này vì chính sách an toàn.";
  if (/timed out/i.test(message)) return "Google Flow xử lý quá thời gian. Tác vụ đã được dừng trên máy.";
  return message;
}
function getWatermarkPositionConfig(width, height, profile) {
  const isLarge = width > 1024 && height > 1024;
  if (profile === "v1") {
    return isLarge ? { marginRight: 64, marginBottom: 64, logoSize: 96 } : { marginRight: 32, marginBottom: 32, logoSize: 48 };
  }
  if (isLarge) return { marginRight: 192, marginBottom: 192, logoSize: 96 };
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  let sourceLongDim;
  if (longSide > 1100) {
    const doubled = 2 * longSide;
    sourceLongDim = 2752;
    for (const candidate of [2816, 2848]) {
      if (Math.abs(doubled - candidate) < Math.abs(doubled - sourceLongDim)) sourceLongDim = candidate;
    }
  } else if (shortSide >= 566) {
    sourceLongDim = 2752;
  } else if (shortSide >= 550) {
    sourceLongDim = 2816;
  } else {
    sourceLongDim = 2848;
  }
  const scale = longSide / sourceLongDim;
  const ideal = Math.round(96 * scale);
  return { marginRight: 71, marginBottom: 71, logoSize: ideal <= 40 ? 36 : 50 };
}
if (window.ipcRenderer) {
  window.ipcRenderer.on("watermark-runtime-progress", (_event, payload) => {
    window.dispatchEvent(
      new CustomEvent("watermark-runtime-progress", { detail: payload })
    );
  });
}
function isLocalImageUrl(imageUrl) {
  return imageUrl.startsWith("local-image://");
}
async function saveRawImage(imageUrl) {
  if (!window.imageStorage) return null;
  const saved = await window.imageStorage.saveImage(
    imageUrl,
    "shots",
    `raw_watermarked_${Date.now()}.png`
  );
  return saved.success && saved.localPath ? saved.localPath : null;
}
async function getImageSize(localPath) {
  const result = await window.imageStorage?.readAsBase64(localPath);
  if (!result?.success || !result.base64) return null;
  const dataUrl = result.base64.startsWith("data:") ? result.base64 : `data:${result.mimeType || "image/png"};base64,${result.base64}`;
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}
async function removeWatermarkFromUrl(imageUrl, options = {}) {
  return (await removeWatermarkWithDiagnostics(imageUrl, options)).localPath;
}
async function removeWatermarkWithDiagnostics(imageUrl, options = {}) {
  try {
    let localPath = null;
    if (isLocalImageUrl(imageUrl)) {
      localPath = imageUrl;
    } else if (imageUrl.startsWith("data:")) {
      localPath = await saveRawImage(imageUrl);
    } else if (/^https?:\/\//i.test(imageUrl)) {
      localPath = await saveRawImage(imageUrl);
    }
    if (!localPath) return { localPath: null, error: "Không đọc được ảnh nguồn để xoá watermark" };
    const profile = options.profile ?? "v2";
    let box = null;
    const size = await getImageSize(localPath);
    if (size) {
      const config = getWatermarkPositionConfig(size.width, size.height, profile);
      const x = size.width - config.marginRight - config.logoSize;
      const y = size.height - config.marginBottom - config.logoSize;
      if (x >= 0 && y >= 0) box = `${x},${y},${config.logoSize},${config.logoSize}`;
    }
    if (!window.watermarkRemoval) {
      return { localPath: null, error: "Xoá watermark chỉ chạy trong ứng dụng LONGDD trên máy tính" };
    }
    const result = await window.watermarkRemoval.remove(localPath, box ?? void 0);
    if (result?.success && result.localPath) return { localPath: result.localPath };
    if (result?.output) console.warn("[WatermarkRemover] Python output:", result.output);
    if (result?.error) console.warn("[WatermarkRemover] Error:", result.error);
    return { localPath: null, error: result?.error || "Xoá watermark thất bại" };
  } catch (error) {
    console.warn("[WatermarkRemover] Skipping removal:", error);
    return { localPath: null, error: error instanceof Error ? error.message : String(error) };
  }
}
async function cleanGeneratedWatermark(imageUrl) {
  const settings = useVideoStudioSettingsStore.getState();
  if (!settings.watermarkRemovalEnabled) return null;
  const plan = useLicenseStore.getState().plan;
  if (!hasPlanAccess(plan, "pro")) return null;
  return removeWatermarkFromUrl(imageUrl);
}
async function syncRuntimeSettings() {
  const runtime = window.googleFlowRuntime;
  if (!runtime) return;
  const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  await runtime.updateSettings({
    imageLanesPerToken: settings.imageLanesPerJwt,
    videoLanesPerToken: settings.videoLanesPerJwt,
    imageSubmitDelayMinMs: settings.imageSubmitDelayMinMs,
    imageSubmitDelayMaxMs: settings.imageSubmitDelayMaxMs,
    videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
    videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
    accountStartStaggerMinMs: settings.jwtStartStaggerMinMs,
    accountStartStaggerMaxMs: settings.jwtStartStaggerMaxMs
  });
}
async function normalizeSource(ref) {
  if (!ref.source.startsWith("local-image://")) return ref;
  const result = await window.imageStorage?.readAsBase64(ref.source);
  if (!result?.success || !result.base64) throw new Error(result?.error || "Unable to read local reference image");
  const dataUrl = result.base64.startsWith("data:") ? result.base64 : `data:${result.mimeType || "image/jpeg"};base64,${result.base64}`;
  return { ...ref, source: dataUrl };
}
async function normalizeRefs(refs) {
  if (!refs?.length) return void 0;
  return Promise.all(refs.map(normalizeSource));
}
async function withCancellation(signal, call, onSubmitted, presetTaskId, metadata) {
  const taskId = presetTaskId || crypto.randomUUID();
  if (metadata) taskMetadata.begin({ ...metadata, id: taskId, status: "queued", queuedAt: Date.now() });
  const onAbort = () => {
    void window.googleFlowRuntime?.cancelTask(taskId);
  };
  let submitted = false;
  const offTask = metadata || onSubmitted ? window.googleFlowRuntime?.onTask((task) => {
    if (task.taskId !== taskId) return;
    if (!submitted && task.taskId === taskId && task.status === "submitting") {
      submitted = true;
      taskMetadata.submitted(taskId, task.submittedAt || Date.now());
      onSubmitted?.(task.submittedAt);
    }
    if (task.status === "polling" || task.status === "downloading") {
      taskMetadata.update(taskId, { status: "running" });
    }
  }) : void 0;
  if (signal?.aborted) throw new DOMException("Cancelled by user", "AbortError");
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const result = await call(taskId);
    taskMetadata.completed(taskId, result.localUrl || result.remoteUrl, {
      mediaId: result.mediaId,
      credentialId: result.credentialId,
      flowProjectId: result.flowProjectId
    });
    return result;
  } catch (error) {
    taskMetadata.failed(taskId, error);
    throw new Error(getGoogleFlowUserFacingError(error));
  } finally {
    offTask?.();
    signal?.removeEventListener("abort", onAbort);
  }
}
const googleFlowProvider = {
  id: "googleflow",
  async generateImage(input) {
    if (!window.googleFlowRuntime) throw new Error("Google Flow chỉ hoạt động trong ứng dụng LONGDD trên máy tính");
    await syncRuntimeSettings();
    const baseImage = input.baseImage ? await normalizeSource(input.baseImage) : void 0;
    const references = await normalizeRefs(input.references);
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      async (taskId) => {
        const result = await window.googleFlowRuntime.generateImage({ ...runtimeInput, taskId, baseImage, references });
        const imageUrl = result.localUrl || result.remoteUrl;
        if (imageUrl) {
          const cleaned = await cleanGeneratedWatermark(imageUrl);
          if (cleaned) return { ...result, localUrl: cleaned };
        }
        return result;
      },
      onSubmitted,
      input.taskId,
      {
        kind: "image",
        provider: "Google Flow",
        model: runtimeInput.model,
        prompt: runtimeInput.prompt,
        details: { aspectRatio: runtimeInput.aspectRatio, referenceCount: references?.length || 0 }
      }
    );
  },
  async generateVideo(input) {
    if (!window.googleFlowRuntime) throw new Error("Google Flow chỉ hoạt động trong ứng dụng LONGDD trên máy tính");
    await syncRuntimeSettings();
    const startImage = input.startImage ? await normalizeSource(input.startImage) : void 0;
    const endImage = input.endImage ? await normalizeSource(input.endImage) : void 0;
    const references = await normalizeRefs(input.references);
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      (taskId) => window.googleFlowRuntime.generateVideo({ ...runtimeInput, taskId, startImage, endImage, references }),
      onSubmitted,
      input.taskId,
      {
        kind: "video",
        provider: "Google Flow",
        model: runtimeInput.model,
        prompt: runtimeInput.prompt,
        details: {
          aspectRatio: runtimeInput.aspectRatio,
          duration: runtimeInput.duration,
          mode: references?.length ? "reference-to-video" : endImage ? "start-end" : "start-frame",
          referenceCount: references?.length || 0
        }
      }
    );
  },
  async cancel(taskId) {
    await window.googleFlowRuntime?.cancelTask(taskId);
  }
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function readyCredential(status) {
  return status.credentials.find((credential) => credential.state === "ready");
}
async function ensureReadyStatus(runtime) {
  let status = await runtime.getStatus();
  if (!status.running) throw new Error("Google Flow chưa chạy. Mở Settings → Google Flow để khởi động.");
  if (status.readyCredentialCount > 0 && readyCredential(status)) return status;
  const accounts = await runtime.listInAppAccounts().catch(() => []);
  if (accounts.length > 0) {
    await runtime.refreshInAppAccounts().catch(() => ({ ok: false }));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await wait(750);
      status = await runtime.getStatus();
      if (status.readyCredentialCount > 0 && readyCredential(status)) return status;
    }
  }
  throw new Error("Google Flow chưa lấy được token mới. Bấm “Hiện” để kiểm tra đăng nhập tài khoản Flow rồi chạy lại.");
}
function pickBinding(bindings, ownerScopeId) {
  return bindings.find((binding) => binding.ownerScopeId === ownerScopeId && binding.active && binding.connected) || bindings.find((binding) => binding.ownerScopeId === ownerScopeId && binding.connected) || bindings.find((binding) => binding.active && binding.connected) || bindings.find((binding) => binding.connected);
}
async function resolveFlowProjectBinding(runtime, requestedProjectId) {
  const projectStore = useProjectStore.getState();
  const longddProjectId = requestedProjectId || projectStore.activeProjectId;
  if (!longddProjectId) throw new Error("Chưa có dự án Video Studio đang mở.");
  const status = await ensureReadyStatus(runtime);
  const credential = readyCredential(status);
  if (!credential) throw new Error("Google Flow chưa có tài khoản sẵn sàng.");
  const existing = pickBinding(await runtime.listProjectBindings(longddProjectId), credential.ownerScopeId);
  if (existing) return { longddProjectId, flowProjectId: existing.flowProjectId, binding: existing };
  const projectName = projectStore.projects.find((project) => project.id === longddProjectId)?.name || "Video Studio";
  const binding = await runtime.createProjectBinding({
    longddProjectId,
    credentialId: credential.credentialId,
    title: projectName
  });
  return { longddProjectId, flowProjectId: binding.flowProjectId, binding };
}
async function runCharactersStage(ctx, job, characters, signal) {
  ctx.stageProgress(job.id, "characters", 0);
  if (characters.length === 0) {
    ctx.log(job.id, "characters", "Không có nhân vật cố định — bỏ qua ảnh tham chiếu nhân vật");
    ctx.stageProgress(job.id, "characters", 100);
    return [];
  }
  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error("Google Flow runtime không có sẵn");
  const { longddProjectId } = await resolveFlowProjectBinding(runtime, job.projectId);
  const activeProjectId = job.projectId;
  const library = useCharacterLibraryStore.getState();
  const characterModel = getFeatureConfig("character_generation")?.model || DEFAULT_IMAGE_MODEL;
  const visualStyleLine = job.visualStylePrompt ? `Mandatory project visual style: ${job.visualStylePrompt}.` : "";
  let completed = 0;
  ctx.updateJob(job.id, { characterCount: characters.length });
  for (const character of characters) {
    const checkpoint = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === character.name.toLocaleLowerCase());
    ctx.updateCharacterOutput(job.id, character.name, { status: checkpoint?.imagePath ? "completed" : "queued" });
  }
  ctx.log(job.id, "characters", `Tạo ${characters.length} ảnh tham chiếu nhân vật qua toàn bộ lane Flow...`);
  return runGoogleFlowQueueOrdered(ctx, job, "characters", "image", characters, signal, async (rawCharacter, index) => {
    const name = String(rawCharacter.name || "").trim();
    const description = String(rawCharacter.description || "").trim();
    const characterPrompt = String(rawCharacter.characterPrompt || "").trim();
    const existing = useCharacterLibraryStore.getState().characters.find(
      (character) => character.projectId === activeProjectId && character.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    let characterId = existing?.id;
    if (!characterId) {
      characterId = library.addCharacter({
        name,
        description: description || void 0,
        characterPrompt,
        identityPrompt: characterPrompt,
        aspectRatio: "1:1",
        styleId: job.visualStyleId,
        projectId: activeProjectId,
        folderId: null,
        status: "linked"
      });
    } else {
      library.updateCharacter(characterId, { description: description || void 0, characterPrompt, identityPrompt: characterPrompt, styleId: job.visualStyleId });
    }
    const checkpoint = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const existingMatchesStyle = !job.visualStylePrompt || existing?.styleId === job.visualStyleId;
    let imagePath = checkpoint?.imagePath || (existingMatchesStyle ? existing?.thumbnailUrl : "") || "";
    if (imagePath && !await ctx.isImageAvailable(imagePath)) imagePath = "";
    try {
      if (!imagePath) {
        const prompt = `Single reusable character reference for a documentary. ${name}. ${characterPrompt}. ${description}. Centered full-body neutral pose, clearly visible construction and identity markers, isolated simple background, clean silhouette, no scenery, no typography, no watermark. ${visualStyleLine}`;
        const result = await googleFlowProvider.generateImage({
          projectId: longddProjectId,
          sceneId: `autopilot-character-${job.id}-${index}`,
          prompt,
          model: characterModel,
          aspectRatio: "1:1",
          taskId: `ap-char-${job.id}-${index}`,
          onSubmitted: () => ctx.updateCharacterOutput(job.id, name, { status: "generating" }),
          signal
        });
        const source = result.localUrl || result.remoteUrl || "";
        if (!source) throw new Error("Google Flow không trả về ảnh");
        imagePath = await saveImageToLocal(source, "characters", `${name.replace(/[^a-zA-Z0-9À-ɏ]/g, "_")}_${Date.now()}.png`);
        library.updateCharacter(characterId, { thumbnailUrl: imagePath });
        ctx.log(job.id, "characters", `[${index + 1}/${characters.length}] Đã tạo reference: ${name}`);
      } else {
        if (characterId) library.updateCharacter(characterId, { thumbnailUrl: imagePath });
        ctx.log(job.id, "characters", `[${index + 1}/${characters.length}] Resume — dùng reference đã có: ${name}`);
      }
    } catch (error) {
      if (signal.aborted) throw error;
      ctx.log(job.id, "characters", `Reference ${name} thất bại — shot vẫn tiếp tục không reference: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completed += 1;
      ctx.updateCharacterOutput(job.id, name, { imagePath, status: imagePath ? "completed" : "failed" });
      ctx.stageProgress(job.id, "characters", Math.round(completed / characters.length * 100));
    }
    return { name, description, characterPrompt, imagePath };
  });
}
async function runScenesStage(ctx, job, scenes, signal) {
  ctx.stageProgress(job.id, "scenes", 0);
  if (scenes.length === 0) {
    ctx.log(job.id, "scenes", "Không có bối cảnh cố định — bỏ qua ảnh tham chiếu cảnh");
    ctx.stageProgress(job.id, "scenes", 100);
    return [];
  }
  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error("Google Flow runtime không có sẵn");
  const { longddProjectId } = await resolveFlowProjectBinding(runtime, job.projectId);
  const activeProjectId = job.projectId;
  const sceneStore = useSceneStore.getState();
  const sceneModel = getFeatureConfig("scene_generation")?.model || job.input.imageModel || DEFAULT_IMAGE_MODEL;
  const sceneAspectRatio = ["1:1", "3:4", "4:3", "9:16", "16:9"].find((value) => value === job.input.aspectRatio) || "16:9";
  const visualStyleLine = job.visualStylePrompt ? `Mandatory project visual style: ${job.visualStylePrompt}.` : "";
  let completed = 0;
  ctx.updateJob(job.id, { sceneCount: scenes.length });
  for (const scene of scenes) {
    const checkpoint = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === scene.name.toLocaleLowerCase());
    ctx.updateSceneOutput(job.id, scene.name, { status: checkpoint?.imagePath ? "completed" : "queued" });
  }
  ctx.log(job.id, "scenes", `Tạo ${scenes.length} ảnh tham chiếu cảnh qua toàn bộ lane Flow...`);
  return runGoogleFlowQueueOrdered(ctx, job, "scenes", "image", scenes, signal, async (rawScene, index) => {
    const name = String(rawScene.name || "").trim();
    const description = String(rawScene.description || "").trim();
    const scenePrompt = String(rawScene.scenePrompt || "").trim();
    const currentStore = useSceneStore.getState();
    const existing = currentStore.scenes.find(
      (scene) => scene.projectId === activeProjectId && scene.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    let sceneId = existing?.id;
    if (!sceneId) {
      sceneId = sceneStore.addScene({
        name,
        description: description || void 0,
        time: "",
        atmosphere: "",
        aspectRatio: sceneAspectRatio,
        projectId: activeProjectId,
        scenePrompt,
        styleId: job.visualStyleId,
        folderId: null,
        status: "linked"
      });
    } else {
      currentStore.updateScene(sceneId, {
        description: description || void 0,
        scenePrompt,
        styleId: job.visualStyleId,
        aspectRatio: sceneAspectRatio
      });
    }
    const checkpoint = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const existingMatchesStyle = !job.visualStylePrompt || existing?.styleId === job.visualStyleId;
    let imagePath = checkpoint?.imagePath || (existingMatchesStyle ? existing?.referenceImage : "") || "";
    if (imagePath && !await ctx.isImageAvailable(imagePath)) imagePath = "";
    try {
      if (!imagePath) {
        const prompt = `Reusable empty environment reference for a documentary. ${name}. ${scenePrompt}. ${description}. Environment only, stable layout, camera-neutral wide establishing view, no characters, no temporary action, no typography, no watermark. ${visualStyleLine}`;
        const result = await googleFlowProvider.generateImage({
          projectId: longddProjectId,
          sceneId: `autopilot-scene-${job.id}-${index}`,
          prompt,
          model: sceneModel,
          aspectRatio: job.input.aspectRatio || DEFAULT_ASPECT_RATIO,
          taskId: `ap-scene-${job.id}-${index}`,
          onSubmitted: () => ctx.updateSceneOutput(job.id, name, { status: "generating" }),
          signal
        });
        const source = result.localUrl || result.remoteUrl || "";
        if (!source) throw new Error("Google Flow không trả về ảnh");
        imagePath = await saveImageToLocal(source, "scenes", `${safeFileName(name)}_${Date.now()}.png`);
        currentStore.updateScene(sceneId, { referenceImage: imagePath });
        const mediaStore = useMediaStore.getState();
        mediaStore.addMediaFromUrl({
          url: imagePath,
          name: `${job.title} — Cảnh ${name}`,
          type: "image",
          source: "ai-image",
          folderId: mediaStore.getOrCreateCategoryFolder("ai-image"),
          projectId: job.projectId
        });
        ctx.log(job.id, "scenes", `[${index + 1}/${scenes.length}] Đã tạo reference cảnh: ${name}`);
      } else {
        currentStore.updateScene(sceneId, { referenceImage: imagePath });
        ctx.log(job.id, "scenes", `[${index + 1}/${scenes.length}] Resume — dùng reference cảnh đã có: ${name}`);
      }
    } catch (error) {
      if (signal.aborted) throw error;
      ctx.log(job.id, "scenes", `Reference cảnh ${name} thất bại — shot vẫn tiếp tục không có scene reference: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completed += 1;
      ctx.updateSceneOutput(job.id, name, { imagePath, status: imagePath ? "completed" : "failed" });
      ctx.stageProgress(job.id, "scenes", Math.round(completed / scenes.length * 100));
    }
    return { name, description, scenePrompt, imagePath };
  });
}
function extensionForMime(mime) {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}
async function downloadFromOpenWeb(params) {
  const storage = window.imageStorage;
  if (!storage?.searchWebImages) return null;
  const candidates = await storage.searchWebImages(params.query, 18);
  const usable = candidates.filter((candidate) => {
    if (!candidate.imageUrl || !candidate.sourcePageUrl) return false;
    if (candidate.width && candidate.width < 700) return false;
    if (candidate.height && candidate.height < 450) return false;
    return true;
  });
  for (let index = 0; index < Math.min(usable.length, 10); index += 1) {
    const candidate = usable[index];
    const result = await storage.saveImage(
      candidate.imageUrl,
      "shots",
      `${params.filename}_web_${index + 1}.jpg`,
      candidate.sourcePageUrl
    );
    if (!result.success || !result.localPath) continue;
    return {
      query: params.query,
      title: candidate.title || params.query,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourcePageUrl,
      localPath: result.localPath
    };
  }
  return null;
}
async function downloadFromCommons(params) {
  const query = params.query.trim().slice(0, 180);
  if (!query) return null;
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("formatversion", "2");
  endpoint.searchParams.set("origin", "*");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrsearch", query);
  endpoint.searchParams.set("gsrnamespace", "6");
  endpoint.searchParams.set("gsrlimit", "12");
  endpoint.searchParams.set("prop", "imageinfo");
  endpoint.searchParams.set("iiprop", "url|mime|size");
  endpoint.searchParams.set("iiurlwidth", "1600");
  const response = await fetch(endpoint, { signal: params.signal });
  if (!response.ok) throw new Error(`Wikimedia search failed (${response.status})`);
  const payload = await response.json();
  const pages = Object.values(payload.query?.pages || {}).sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  const candidate = pages.find((page) => {
    const info2 = page.imageinfo?.[0];
    return !!info2?.url && ["image/jpeg", "image/png", "image/webp"].includes(info2.mime || "") && (info2.width || 0) >= 700 && (info2.height || 0) >= 450;
  });
  const info = candidate?.imageinfo?.[0];
  if (!candidate || !info?.url) return null;
  const imageUrl = info.thumburl || info.url;
  const localPath = await saveImageToLocal(
    imageUrl,
    "shots",
    `${params.filename}${extensionForMime(info.mime)}`
  );
  if (!localPath.startsWith("local-image://")) {
    throw new Error("Unable to save the researched image locally");
  }
  return {
    query,
    title: String(candidate.title || "").replace(/^File:/i, ""),
    imageUrl,
    sourceUrl: info.descriptionurl || info.url,
    localPath
  };
}
async function downloadRealImage(params) {
  const query = params.query.trim().slice(0, 180);
  if (!query) return null;
  try {
    const webResult = await downloadFromOpenWeb({ ...params, query });
    if (webResult) return webResult;
  } catch {
  }
  return downloadFromCommons({ ...params, query });
}
async function runMediaStage(ctx, job, shots, characters, scenes, signal, untilPhase = "videos") {
  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error("Google Flow runtime không có sẵn");
  const resolved = await resolveFlowProjectBinding(runtime, job.projectId);
  const flowProjectId = resolved.flowProjectId;
  const longddProjectId = resolved.longddProjectId;
  const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
  const imageModel = job.input.imageModel || DEFAULT_IMAGE_MODEL;
  const videoModel = job.input.videoModel || getFeatureConfig("video_generation")?.model || "Veo_3.1-Fast";
  const allowRealImageResearch = skillAllowsRealImageResearch(job.input.skill) || job.input.importedPlan?.allowRealImageResearch === true || job.input.importedPlan?.shots.some((shot) => Boolean(shot.realImageQuery?.trim())) === true;
  const existingByIndex = new Map((job.mediaOutputs || []).map((item) => [item.index, item]));
  const mediaFiles = useMediaStore.getState().mediaFiles;
  const resolveMediaUrl = (mediaId, fallbackPath) => {
    const entry = mediaId ? mediaFiles.find((media) => media.id === mediaId) : void 0;
    return entry?.url || fallbackPath;
  };
  const pending = await Promise.all(shots.map(async (shot) => {
    const existing = existingByIndex.get(shot.index);
    const imagePath = await ctx.isImageAvailable(resolveMediaUrl(existing?.imageMediaId, existing?.imagePath)) ? resolveMediaUrl(existing?.imageMediaId, existing?.imagePath) : "";
    const baseImagePath = await ctx.isImageAvailable(existing?.baseImagePath) ? existing.baseImagePath : "";
    const videoPath = await ctx.probeMedia(resolveMediaUrl(existing?.videoMediaId, existing?.videoPath)) > 0 ? resolveMediaUrl(existing?.videoMediaId, existing?.videoPath) : "";
    const realImageAvailable = allowRealImageResearch && await ctx.isImageAvailable(resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath));
    return {
      shot,
      baseImagePath,
      imagePath,
      videoPath,
      imageMediaId: existing?.imageMediaId,
      videoMediaId: existing?.videoMediaId,
      realImageMediaId: existing?.realImageMediaId,
      realImageSearchCompleted: !allowRealImageResearch || existing?.realImageSearchCompleted === true,
      researchStatus: !allowRealImageResearch || !shot.realImageQuery ? "skipped" : realImageAvailable ? "completed" : existing?.realImageSearchCompleted ? "skipped" : "idle",
      imageStatus: imagePath ? "completed" : "idle",
      videoStatus: videoPath ? "completed" : existing?.videoStatus === "skipped" ? "skipped" : "idle",
      realImage: allowRealImageResearch && realImageAvailable && existing?.realImagePath ? {
        query: existing.realImageQuery || shot.realImageQuery || "",
        title: existing.realImageTitle || existing.realImageQuery || "Researched image",
        imageUrl: resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath),
        sourceUrl: existing.realImageSourceUrl || "",
        localPath: resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath)
      } : void 0
    };
  }));
  const characterByName = new Map(characters.map((character) => [character.name.toLocaleLowerCase(), character]));
  const sceneByName = new Map(scenes.map((scene) => [scene.name.toLocaleLowerCase(), scene]));
  const laneSettings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const retryAttempts = Math.max(
    0,
    Math.floor(laneSettings.generationRetryAttempts ?? 1)
  );
  const visualStyleLine = job.visualStylePrompt ? `Mandatory project visual style for this frame: ${job.visualStylePrompt}.` : "";
  ctx.log(job.id, "media", `Google Flow project ${flowProjectId}; model video ${videoModel}`);
  const syncMediaOutputs = () => {
    ctx.updateJob(job.id, {
      mediaOutputs: pending.map((item) => ({
        index: item.shot.index,
        startMs: item.shot.startMs,
        endMs: item.shot.endMs,
        characterNames: item.shot.characterNames || [],
        baseImagePath: item.baseImagePath || void 0,
        imagePath: item.imagePath,
        videoPath: item.videoPath,
        imageMediaId: item.imageMediaId,
        videoMediaId: item.videoMediaId,
        realImageMediaId: item.realImageMediaId,
        realImagePath: item.realImage?.localPath,
        realImageSourceUrl: item.realImage?.sourceUrl,
        realImageTitle: item.realImage?.title,
        realImageQuery: allowRealImageResearch ? item.realImage?.query || item.shot.realImageQuery : void 0,
        realImageSearchCompleted: item.realImageSearchCompleted,
        researchStatus: item.researchStatus,
        imageStatus: item.imageStatus,
        videoStatus: item.videoStatus
      }))
    });
  };
  syncMediaOutputs();
  const researchedShots = allowRealImageResearch ? pending.filter((item) => item.shot.realImageQuery) : [];
  const missingResearch = researchedShots.filter((item) => !item.realImage && !item.realImageSearchCompleted);
  ctx.log(job.id, "media", `Pha 1/3: tìm ảnh thật trước cho ${missingResearch.length}/${researchedShots.length} shot cần tư liệu`);
  let completedResearch = researchedShots.length - missingResearch.length;
  missingResearch.forEach((item) => {
    item.researchStatus = "queued";
  });
  syncMediaOutputs();
  await runOrdered(missingResearch, await resolveLaneCount("image", "googleflow"), async (item) => {
    if (signal.aborted) throw new Error("aborted");
    item.researchStatus = "generating";
    syncMediaOutputs();
    try {
      item.realImage = await downloadRealImage({
        query: item.shot.realImageQuery || "",
        filename: `${safeFileName(job.title)}_real_${item.shot.index}_${Date.now()}`,
        signal
      }) || void 0;
      item.realImageSearchCompleted = true;
      if (item.realImage) {
        item.researchStatus = "completed";
        const mediaStore = useMediaStore.getState();
        item.realImageMediaId = mediaStore.addMediaFromUrl({
          url: item.realImage.localPath,
          name: `${job.title} — Tư liệu shot ${item.shot.index}`,
          type: "image",
          source: "upload",
          folderId: mediaStore.getOrCreateCategoryFolder("upload"),
          projectId: job.projectId
        });
        ctx.log(job.id, "media", `[tư liệu shot ${item.shot.index}] ${item.realImage.title}`);
      } else {
        item.researchStatus = "skipped";
        ctx.log(job.id, "media", `[tư liệu shot ${item.shot.index}] không tìm thấy — frame sẽ tạo không có ảnh thật`);
      }
    } catch (error) {
      if (signal.aborted) {
        item.researchStatus = "idle";
        throw error;
      }
      item.researchStatus = "failed";
      ctx.log(job.id, "media", `[tư liệu shot ${item.shot.index}] lỗi tạm thời, lần resume sẽ thử lại: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completedResearch += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, "research", researchedShots.length > 0 ? Math.round(completedResearch / researchedShots.length * 100) : 100);
    }
  }, signal);
  if (researchedShots.length === 0) ctx.stageProgress(job.id, "research", 100);
  if (untilPhase === "research") return pending;
  const missingImages = pending.filter((item) => !item.imagePath);
  ctx.log(job.id, "media", `Pha 2/3: tạo ${missingImages.length}/${shots.length} frame AI; ảnh thật có sẵn được đưa vào reference ngay từ đầu`);
  let completedImages = shots.length - missingImages.length;
  missingImages.forEach((item) => {
    item.imageStatus = "queued";
  });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, "media", "image", missingImages, signal, async (item) => {
    if (signal.aborted) throw new Error("aborted");
    const sceneRef = sceneByName.get(String(item.shot.sceneRefId || "").trim().toLocaleLowerCase());
    const reservedReferenceSlots = (sceneRef?.imagePath ? 1 : 0) + (item.realImage ? 1 : 0);
    const characterRefs = (item.shot.characterNames || []).map((name) => characterByName.get(name.toLocaleLowerCase())).filter((character) => !!character?.imagePath).slice(0, Math.max(0, 4 - reservedReferenceSlots));
    const references = [];
    if (sceneRef?.imagePath) references.push({ source: sceneRef.imagePath, provider: "googleflow" });
    references.push(...characterRefs.map((character) => ({ source: character.imagePath, provider: "googleflow" })));
    if (item.realImage) references.push({ source: item.realImage.localPath, provider: "googleflow" });
    const sceneLine = sceneRef?.imagePath ? `Use the first supplied reference as the authoritative environment for scene "${sceneRef.name}". Preserve its architecture, layout, palette and recurring props while applying the shot composition and camera angle. ` : "";
    const identityLine = characterRefs.length > 0 ? `Preserve the supplied character identities exactly. Visible characters: ${characterRefs.map((character) => character.name).join(", ")}. ` : "";
    const researchLine = item.realImage ? "Use the final supplied reference as factual source imagery. Integrate it naturally into the composition where it best supports the visual hierarchy and story. Keep it clearly recognizable and preserve its factual content and identity. " : "";
    try {
      const imageResult = await runGenerationWithRetries(
        retryAttempts,
        signal,
        (attempt) => googleFlowProvider.generateImage({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
          prompt: `${sceneLine}${identityLine}${researchLine}${item.shot.imagePrompt || ""} ${visualStyleLine}`.trim(),
          model: imageModel,
          aspectRatio,
          references,
          taskId: `ap-img-${job.id}-${item.shot.index - 1}-try-${attempt}`,
          onSubmitted: () => {
            item.imageStatus = "generating";
            syncMediaOutputs();
          },
          signal
        }),
        (nextAttempt, totalAttempts, error) => {
          item.imageStatus = "queued";
          syncMediaOutputs();
          ctx.log(job.id, "media", `Ảnh shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        }
      );
      const source = imageResult.localUrl || imageResult.remoteUrl || "";
      if (!source) throw new Error("Google Flow không trả về ảnh");
      item.imagePath = await saveImageToLocal(source, "shots", `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.png`);
      item.imageStatus = "completed";
      const mediaStore = useMediaStore.getState();
      item.imageMediaId = mediaStore.addMediaFromUrl({
        url: item.imagePath,
        name: `${job.title} — Shot ${item.shot.index}`,
        type: "image",
        source: "ai-image",
        folderId: mediaStore.getOrCreateCategoryFolder("ai-image"),
        projectId: job.projectId
      });
      ctx.log(job.id, "media", `[ảnh ${item.shot.index}/${shots.length}] xong${item.realImage ? " — có reference ảnh thật" : ""}${characterRefs.length ? ` — ${characterRefs.length} character ref` : ""}`);
    } catch (error) {
      if (signal.aborted) {
        item.imageStatus = "idle";
        throw error;
      }
      item.imageStatus = "failed";
      ctx.log(job.id, "media", `Ảnh shot ${item.shot.index} thất bại: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completedImages += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, "images", Math.round(completedImages / shots.length * 100));
    }
  });
  ctx.stageProgress(job.id, "images", 100);
  const missingFrames = pending.filter((item) => !item.imagePath);
  if (missingFrames.length > 0) {
    throw new Error(`Còn ${missingFrames.length} shot chưa có ảnh (${missingFrames.map((item) => item.shot.index).join(", ")}). Import ảnh hoặc bấm Tiếp tục để thử lại.`);
  }
  if (untilPhase === "images") return pending;
  pending.forEach((item) => {
    if (item.imagePath && !item.videoPath && item.videoStatus !== "skipped" && !item.shot.videoPrompt?.trim()) {
      item.videoStatus = "skipped";
      ctx.log(job.id, "media", `Shot ${item.shot.index} không có videoPrompt — giữ ảnh tĩnh (Ken Burns)`);
    }
  });
  syncMediaOutputs();
  const missingVideos = pending.filter((item) => item.imagePath && !item.videoPath && item.videoStatus !== "skipped");
  ctx.log(job.id, "media", `Pha 3/3: tạo ${missingVideos.length}/${shots.length} video còn thiếu từ frame cuối`);
  let completedVideos = shots.length - missingVideos.length;
  missingVideos.forEach((item) => {
    item.videoStatus = "queued";
  });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, "media", "video", missingVideos, signal, async (item) => {
    if (signal.aborted) throw new Error("aborted");
    try {
      const videoResult = await runGenerationWithRetries(
        retryAttempts,
        signal,
        (attempt) => googleFlowProvider.generateVideo({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
          prompt: `${item.shot.videoPrompt || ""} Preserve the exact visual style, palette, line quality, materials, and character identity of the supplied first frame.`.trim(),
          model: videoModel,
          aspectRatio,
          duration: item.shot.videoLength,
          startImage: { source: item.imagePath, provider: "googleflow", flowProjectId },
          taskId: `ap-vid-${job.id}-${item.shot.index - 1}-try-${attempt}`,
          onSubmitted: () => {
            item.videoStatus = "generating";
            syncMediaOutputs();
          },
          signal
        }),
        (nextAttempt, totalAttempts, error) => {
          item.videoStatus = "queued";
          syncMediaOutputs();
          ctx.log(job.id, "media", `Video shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        }
      );
      const source = videoResult.localUrl || videoResult.remoteUrl || "";
      if (!source) throw new Error("Google Flow không trả về video");
      item.videoPath = await saveVideoToLocal(source, `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.mp4`);
      item.videoStatus = "completed";
      const mediaStore = useMediaStore.getState();
      item.videoMediaId = mediaStore.addMediaFromUrl({
        url: item.videoPath,
        name: `${job.title} — Shot ${item.shot.index}`,
        type: "video",
        source: "ai-video",
        thumbnailUrl: item.imagePath,
        duration: (item.shot.endMs - item.shot.startMs) / 1e3,
        folderId: mediaStore.getOrCreateCategoryFolder("ai-video"),
        projectId: job.projectId
      });
      ctx.log(job.id, "media", `[video ${item.shot.index}/${shots.length}] xong`);
    } catch (err) {
      if (signal.aborted) {
        item.videoStatus = "idle";
        throw err;
      }
      item.videoStatus = "skipped";
      ctx.log(job.id, "media", `Video shot ${item.shot.index} thất bại — dùng ảnh fallback: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      completedVideos += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, "videos", Math.round(completedVideos / shots.length * 100));
    }
  });
  ctx.stageProgress(job.id, "videos", 100);
  const videoCount = pending.filter((item) => item.videoPath).length;
  const imageCount = pending.filter((item) => item.imagePath && !item.videoPath).length;
  ctx.log(job.id, "media", `Checkpoint media: ${videoCount} video, ${imageCount} shot còn thiếu video, ${pending.length - videoCount - imageCount} shot còn thiếu frame`);
  if (imageCount > 0) ctx.log(job.id, "media", `${imageCount} shot chuyển sang ảnh tĩnh (do videoPrompt trống hoặc video lỗi); tiếp tục render bình thường.`);
  return pending;
}
async function runRenderStage(ctx, job, pending, audioPath, srtSegments, signal) {
  const chapters = job.longFormMode && (job.chapters?.length || 0) > 1 ? [...job.chapters || []].sort((a, b) => a.index - b.index) : [];
  if (chapters.length > 0) {
    ctx.log(job.id, "render", `Long-form render: checkpoint ${chapters.length} chương trước khi ghép bản cuối`);
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex += 1) {
      if (signal.aborted) throw new Error("Cancelled");
      const chapter = chapters[chapterIndex];
      const checkpointDuration = await ctx.probeMedia(chapter.outputVideoPath);
      if (checkpointDuration > 0) {
        chapter.renderStatus = "done";
        chapter.renderProgress = 100;
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        ctx.log(job.id, "resume", `Bỏ qua render chapter ${chapter.index} đã hoàn thành`);
        continue;
      }
      chapter.renderStatus = "running";
      chapter.renderProgress = 10;
      chapter.renderError = void 0;
      ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
      const chapterPending = pending.filter(
        (item) => item.shot.startMs >= chapter.startMs && item.shot.endMs <= chapter.endMs
      );
      if (chapterPending.length === 0) throw new Error(`Chapter ${chapter.index} không có media để render`);
      const chapterSegments = chapterPending.map((item, index) => ({
        index: index + 1,
        startMs: item.shot.startMs - chapter.startMs,
        endMs: item.shot.endMs - chapter.startMs,
        text: item.shot.voiceOver || "",
        imagePath: item.imagePath,
        videoPath: item.videoPath,
        mediaEffect: item.videoPath ? "none" : randomKenBurns(),
        transitionToNext: item.shot.transitionToNext || "none",
        sfxPath: ""
      }));
      const audioBase = audioPath.replace(/\.[^./\\]+$/u, "");
      const outputPath = `${audioBase}.${safeFileName(job.id)}.chapter-${String(chapter.index).padStart(2, "0")}.mp4`;
      const renderJobId2 = `autopilot-render-${job.id}-chapter-${chapter.index}-${Date.now()}`;
      const abort2 = () => {
        void window.autoVideoRuntime?.cancel(renderJobId2);
      };
      signal.addEventListener("abort", abort2, { once: true });
      try {
        const result = await window.autoVideoRuntime?.render({
          jobId: renderJobId2,
          audioPath,
          audioStartMs: chapter.startMs,
          audioEndMs: chapter.endMs,
          segments: chapterSegments,
          captionSegments: [],
          mediaMode: chapterPending.some((item) => item.videoPath) ? "video" : "image",
          resolution: job.input.resolution || "1920x1080",
          fps: job.input.fps || 30,
          codec: job.input.codec || "libx264",
          crf: job.input.crf ?? 23,
          outputPath,
          burnSubtitles: false,
          subtitleFontSize: 0,
          bgmVolume: 0,
          bgmDuckVoice: false,
          audioNormalize: job.input.audioNormalize ?? false,
          videoAudioVolume: job.input.videoAudioVolume ?? 0
        });
        if (!result?.success || !result.outputPath) throw new Error(result?.error || `Render chapter ${chapter.index} thất bại`);
        chapter.outputVideoPath = result.outputPath;
        chapter.renderStatus = "done";
        chapter.renderProgress = 100;
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        ctx.stageProgress(job.id, "render", Math.round((chapterIndex + 1) / (chapters.length + 1) * 80));
        ctx.log(job.id, "render", `Chapter ${chapter.index}/${chapters.length} đã checkpoint: ${result.outputPath}`);
      } catch (error) {
        chapter.renderStatus = "failed";
        chapter.renderProgress = 0;
        chapter.renderError = error instanceof Error ? error.message : String(error);
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        throw error;
      } finally {
        signal.removeEventListener("abort", abort2);
      }
    }
  }
  const shotSegments = pending.map((item, index) => ({
    index: index + 1,
    startMs: item.shot.startMs,
    endMs: item.shot.endMs,
    text: item.shot.voiceOver || "",
    imagePath: item.imagePath,
    videoPath: item.videoPath,
    mediaEffect: item.videoPath ? "none" : randomKenBurns(),
    transitionToNext: item.shot.transitionToNext || "none",
    sfxPath: ""
  }));
  const segments = chapters.length > 0 ? chapters.map((chapter, index) => {
    const first = pending.find((item) => item.shot.startMs >= chapter.startMs && item.shot.endMs <= chapter.endMs);
    return {
      index: index + 1,
      startMs: chapter.startMs,
      endMs: chapter.endMs,
      text: "",
      imagePath: first?.imagePath || "",
      videoPath: chapter.outputVideoPath,
      mediaEffect: "none",
      // Hard-cut between chapter clips (no xfade) so the final uses concat mode and
      // the clips' own audio stays perfectly in sync — narration flows continuously
      // across the boundary anyway, so a fade-to-black there would be wrong.
      transitionToNext: "none",
      sfxPath: ""
    };
  }) : shotSegments;
  const hasVideo = segments.some((item) => item.videoPath);
  const captions = srtSegments.length > 0 ? srtSegments : shotSegments.map(({ index, startMs, endMs, text }) => ({ index, startMs, endMs, text }));
  ctx.log(job.id, "render", `Render ${segments.length} visual shot + ${job.input.subtitles === true ? captions.length : 0} caption độc lập...`);
  ctx.stageProgress(job.id, "render", 10);
  const renderJobId = `autopilot-render-${job.id}-${Date.now()}`;
  const abort = () => {
    void window.autoVideoRuntime?.cancel(renderJobId);
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const result = await window.autoVideoRuntime?.render({
      jobId: renderJobId,
      audioPath,
      segments,
      captionSegments: job.input.subtitles === true ? captions : [],
      mediaMode: hasVideo ? "video" : "image",
      resolution: job.input.resolution || "1920x1080",
      fps: job.input.fps || 30,
      codec: job.input.codec || "libx264",
      crf: job.input.crf ?? 23,
      outputPath: job.input.outputPath || void 0,
      burnSubtitles: job.input.subtitles === true && captions.length > 0,
      subtitleFontSize: 0,
      bgmPath: job.input.bgmPath || void 0,
      bgmVolume: job.input.bgmVolume ?? 0.25,
      bgmDuckVoice: job.input.bgmDuckVoice ?? true,
      audioNormalize: job.input.audioNormalize ?? false,
      videoAudioVolume: job.input.videoAudioVolume ?? 0,
      // Long-form: chapter clips already carry narration + video audio. Use their own
      // audio as master so the imported voice isn't laid a second time (echo/overlap).
      masterFromSegments: chapters.length > 0
    });
    if (!result?.success || !result.outputPath) throw new Error(result?.error || "Render thất bại");
    ctx.stageProgress(job.id, "render", 100);
    ctx.log(job.id, "render", `Output: ${result.outputPath}`);
    return result.outputPath;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
async function runSingleShotRegeneration(ctx, job, shotIndex, kind) {
  const controller = new AbortController();
  ctx.activeControllers.set(job.id, controller);
  const signal = controller.signal;
  const prevStatus = job.status;
  ctx.updateJob(job.id, { status: "running", error: void 0, message: `Tạo lại ${kind === "image" ? "ảnh" : "video"} shot ${shotIndex}` });
  try {
    const runtime = window.googleFlowRuntime;
    if (!runtime) throw new Error("Google Flow runtime không có sẵn");
    const resolved = await resolveFlowProjectBinding(runtime, job.projectId);
    const flowProjectId = resolved.flowProjectId;
    const longddProjectId = resolved.longddProjectId;
    const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
    const imageModel = job.input.imageModel || DEFAULT_IMAGE_MODEL;
    const videoModel = job.input.videoModel || getFeatureConfig("video_generation")?.model || "Veo_3.1-Fast";
    const laneSettings = useVideoStudioSettingsStore.getState().maxStudioLanes;
    const retryAttempts = Math.max(0, Math.floor(laneSettings.generationRetryAttempts ?? 1));
    const visualStyleLine = job.visualStylePrompt ? `Visual style: ${job.visualStylePrompt}.` : "";
    const mediaOutput = (job.mediaOutputs || []).find((item) => item.index === shotIndex);
    if (!mediaOutput) throw new Error(`Shot ${shotIndex} không tồn tại`);
    const shot = (job.plannedShots || []).find((s) => s.index === shotIndex);
    if (!shot) throw new Error(`Planned shot ${shotIndex} không tồn tại`);
    const characterByName = new Map((job.plannedCharacters || []).map((c) => {
      const output = job.characterOutputs?.find((o) => o.name.toLocaleLowerCase() === c.name.toLocaleLowerCase());
      return [c.name.toLocaleLowerCase(), { name: c.name, description: c.description, characterPrompt: c.characterPrompt, imagePath: output?.imagePath || "" }];
    }));
    const sceneByName = new Map((job.plannedScenes || []).map((s) => {
      const output = job.sceneOutputs?.find((o) => o.name.toLocaleLowerCase() === s.name.toLocaleLowerCase());
      return [s.name.toLocaleLowerCase(), { name: s.name, description: s.description, scenePrompt: s.scenePrompt, imagePath: output?.imagePath || "" }];
    }));
    const syncMediaOutputs = () => {
      ctx.updateJob(job.id, { mediaOutputs: [...job.mediaOutputs || []] });
    };
    if (kind === "image") {
      mediaOutput.imageStatus = "queued";
      syncMediaOutputs();
      const sceneRef = sceneByName.get(String(shot.sceneRefId || "").trim().toLocaleLowerCase());
      const reservedReferenceSlots = (sceneRef?.imagePath ? 1 : 0) + (mediaOutput.realImagePath ? 1 : 0);
      const characterRefs = (shot.characterNames || []).map((name) => characterByName.get(name.toLocaleLowerCase())).filter((c) => !!c?.imagePath).slice(0, Math.max(0, 4 - reservedReferenceSlots));
      const references = [];
      if (sceneRef?.imagePath) references.push({ source: sceneRef.imagePath, provider: "googleflow" });
      references.push(...characterRefs.map((c) => ({ source: c.imagePath, provider: "googleflow" })));
      if (mediaOutput.realImagePath) references.push({ source: mediaOutput.realImagePath, provider: "googleflow" });
      const sceneLine = sceneRef?.imagePath ? `Use the first supplied reference as the authoritative environment for scene "${sceneRef.name}". Preserve its architecture, layout, palette and recurring props while applying the shot composition and camera angle. ` : "";
      const identityLine = characterRefs.length > 0 ? `Preserve the supplied character identities exactly. Visible characters: ${characterRefs.map((c) => c.name).join(", ")}. ` : "";
      const researchLine = mediaOutput.realImagePath ? "Use the final supplied reference as factual source imagery. Integrate it naturally into the composition where it best supports the visual hierarchy and story. Keep it clearly recognizable and preserve its factual content and identity. " : "";
      const imageResult = await runGenerationWithRetries(
        retryAttempts,
        signal,
        (attempt) => googleFlowProvider.generateImage({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${shot.index - 1}`,
          prompt: `${sceneLine}${identityLine}${researchLine}${shot.imagePrompt || ""} ${visualStyleLine}`.trim(),
          model: imageModel,
          aspectRatio,
          references,
          taskId: `ap-img-${job.id}-${shot.index - 1}-regen-${attempt}`,
          onSubmitted: () => {
            mediaOutput.imageStatus = "generating";
            syncMediaOutputs();
          },
          signal
        }),
        (nextAttempt, totalAttempts, error) => {
          mediaOutput.imageStatus = "queued";
          syncMediaOutputs();
          ctx.log(job.id, "media", `Tạo lại ảnh shot ${shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        }
      );
      const source = imageResult.localUrl || imageResult.remoteUrl || "";
      if (!source) throw new Error("Google Flow không trả về ảnh");
      mediaOutput.imagePath = await saveImageToLocal(source, "shots", `${safeFileName(job.title)}_shot_${shot.index}_${Date.now()}.png`);
      mediaOutput.imageStatus = "completed";
      const mediaStore = useMediaStore.getState();
      mediaOutput.imageMediaId = mediaStore.addMediaFromUrl({
        url: mediaOutput.imagePath,
        name: `${job.title} — Shot ${shot.index}`,
        type: "image",
        source: "ai-image",
        folderId: mediaStore.getOrCreateCategoryFolder("ai-image"),
        projectId: job.projectId
      });
      ctx.log(job.id, "media", `Tạo lại ảnh shot ${shot.index} xong`);
    } else {
      if (!mediaOutput.imagePath) throw new Error(`Shot ${shotIndex} chưa có ảnh để tạo video`);
      mediaOutput.videoStatus = "queued";
      syncMediaOutputs();
      const videoResult = await runGenerationWithRetries(
        retryAttempts,
        signal,
        (attempt) => googleFlowProvider.generateVideo({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${shot.index - 1}`,
          prompt: `${shot.videoPrompt || ""} Preserve the exact visual style, palette, line quality, materials, and character identity of the supplied first frame.`.trim(),
          model: videoModel,
          aspectRatio,
          duration: shot.videoLength,
          startImage: { source: mediaOutput.imagePath, provider: "googleflow", flowProjectId },
          taskId: `ap-vid-${job.id}-${shot.index - 1}-regen-${attempt}`,
          onSubmitted: () => {
            mediaOutput.videoStatus = "generating";
            syncMediaOutputs();
          },
          signal
        }),
        (nextAttempt, totalAttempts, error) => {
          mediaOutput.videoStatus = "queued";
          syncMediaOutputs();
          ctx.log(job.id, "media", `Tạo lại video shot ${shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        }
      );
      const source = videoResult.localUrl || videoResult.remoteUrl || "";
      if (!source) throw new Error("Google Flow không trả về video");
      mediaOutput.videoPath = await saveVideoToLocal(source, `${safeFileName(job.title)}_shot_${shot.index}_${Date.now()}.mp4`);
      mediaOutput.videoStatus = "completed";
      const mediaStore = useMediaStore.getState();
      mediaOutput.videoMediaId = mediaStore.addMediaFromUrl({
        url: mediaOutput.videoPath,
        name: `${job.title} — Shot ${shot.index}`,
        type: "video",
        source: "ai-video",
        thumbnailUrl: mediaOutput.imagePath,
        duration: (shot.endMs - shot.startMs) / 1e3,
        folderId: mediaStore.getOrCreateCategoryFolder("ai-video"),
        projectId: job.projectId
      });
      ctx.log(job.id, "media", `Tạo lại video shot ${shot.index} xong`);
    }
    ctx.updateJob(job.id, { mediaOutputs: [...job.mediaOutputs || []] });
    const allMedia = job.mediaOutputs || [];
    if (kind === "image" && allMedia.every((m) => m.imagePath)) {
      ctx.completeStep(job, "images");
    }
    if (kind === "video" && allMedia.every((m) => m.videoPath || m.videoStatus === "skipped")) {
      ctx.completeStep(job, "videos");
    }
    ctx.updateJob(job.id, { status: prevStatus === "done" && allMedia.every((m) => m.imagePath && (m.videoPath || m.videoStatus === "skipped")) ? "done" : "paused", outputVideoPath: void 0, message: `Đã tạo lại ${kind === "image" ? "ảnh" : "video"} shot ${shotIndex}` });
  } catch (error) {
    if (signal.aborted) {
      ctx.updateJob(job.id, { status: "paused", message: "Đã dừng" });
    } else {
      const msg = error instanceof Error ? error.message : String(error);
      ctx.log(job.id, "error", `Tạo lại shot ${shotIndex} thất bại: ${msg}`);
      ctx.updateJob(job.id, { status: prevStatus === "done" ? "done" : "paused", error: msg, message: `Lỗi tạo lại shot ${shotIndex}` });
    }
  } finally {
    ctx.activeControllers.delete(job.id);
  }
}
class AutopilotEngine {
  jobs = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  activeControllers = /* @__PURE__ */ new Map();
  /** Stable façade handed to the stage modules. */
  ctx = {
    activeControllers: this.activeControllers,
    getJob: (jobId) => this.jobs.get(jobId),
    log: (jobId, stage, message) => this.log(jobId, stage, message),
    stageProgress: (jobId, stage, withinPercent) => this.stageProgress(jobId, stage, withinPercent),
    updateJob: (jobId, patch) => this.updateJob(jobId, patch),
    updateCharacterOutput: (jobId, name, patch) => this.updateCharacterOutput(jobId, name, patch),
    updateSceneOutput: (jobId, name, patch) => this.updateSceneOutput(jobId, name, patch),
    completeStep: (job, step) => this.completeStep(job, step),
    isImageAvailable: (path) => this.isImageAvailable(path),
    probeMedia: (path) => this.probeMedia(path)
  };
  onEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event) {
    for (const listener of this.listeners) listener(event);
  }
  listJobs() {
    return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  }
  getJob(jobId) {
    return this.jobs.get(jobId);
  }
  /** Restore persisted snapshots without automatically restarting external work. */
  restoreJobs(snapshots, fallbackProjectId) {
    for (const snapshot of snapshots.slice(0, 100)) {
      if (!snapshot?.id || this.jobs.has(snapshot.id) || !Array.isArray(snapshot.log)) continue;
      const interrupted = snapshot.status === "running" || snapshot.status === "queued";
      const restored = {
        ...snapshot,
        projectId: snapshot.projectId || fallbackProjectId,
        input: { ...snapshot.input || {} },
        executionMode: snapshot.executionMode || snapshot.input?.executionMode || "all",
        completedSteps: [...snapshot.completedSteps || []],
        nextStep: snapshot.nextStep || "audio",
        awaitingNextStep: snapshot.awaitingNextStep === true,
        log: snapshot.log.slice(-500),
        characterOutputs: snapshot.characterOutputs?.map((item) => ({ ...item, status: normalizeRestoredAssetStatus(item.status) })),
        sceneOutputs: snapshot.sceneOutputs?.map((item) => ({ ...item, status: normalizeRestoredAssetStatus(item.status) })),
        mediaOutputs: snapshot.mediaOutputs?.map((item) => ({
          ...item,
          researchStatus: normalizeRestoredAssetStatus(item.researchStatus),
          imageStatus: normalizeRestoredAssetStatus(item.imageStatus),
          videoStatus: normalizeRestoredAssetStatus(item.videoStatus)
        })),
        srtSegments: snapshot.srtSegments?.map((item) => ({ ...item })),
        longFormBible: snapshot.longFormBible ? { ...snapshot.longFormBible } : void 0,
        chapters: snapshot.chapters?.map((chapter) => ({
          ...chapter,
          status: chapter.status === "running" || chapter.status === "queued" ? "idle" : chapter.status,
          renderStatus: chapter.renderStatus === "running" || chapter.renderStatus === "queued" ? "idle" : chapter.renderStatus,
          plannedShots: chapter.plannedShots?.map((shot) => ({ ...shot })),
          plannedCharacters: chapter.plannedCharacters?.map((character) => ({ ...character })),
          plannedScenes: chapter.plannedScenes?.map((scene) => ({ ...scene }))
        })),
        ...interrupted ? {
          status: "interrupted",
          stage: "interrupted",
          message: "Job bị gián đoạn khi ứng dụng đóng",
          error: void 0,
          finishedAt: Date.now()
        } : {}
      };
      if (interrupted) {
        restored.log.push({
          ts: Date.now(),
          stage: "restore",
          message: "Khôi phục checkpoint sau khi ứng dụng khởi động lại; bấm Tiếp tục để chạy phần còn thiếu."
        });
      }
      this.jobs.set(restored.id, restored);
      this.emit({ type: "job-updated", jobId: restored.id, job: { ...restored } });
    }
  }
  createJob(input) {
    const id = `autopilot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const projectId = useProjectStore.getState().activeProjectId || void 0;
    const visualStyle = getProjectVisualStyleSnapshot(projectId);
    const importedSrtSegments = input.importedSrtRaw?.trim() ? parseSrt(input.importedSrtRaw).segments.map((seg, index) => ({ index, startMs: seg.startMs, endMs: seg.endMs, text: seg.text })).filter((seg) => seg.text.trim()) : void 0;
    const job = {
      id,
      projectId,
      title: input.title || input.topic || input.importedAudioPath?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "AutoPilot job",
      status: "queued",
      stage: "queued",
      progress: 0,
      message: "Queued",
      input,
      executionMode: input.executionMode || "all",
      completedSteps: [],
      nextStep: "audio",
      awaitingNextStep: false,
      visualStyleId: visualStyle.id,
      visualStyleName: visualStyle.name,
      visualStylePrompt: visualStyle.prompt,
      visualStyleNegativePrompt: visualStyle.negativePrompt,
      srtSegments: importedSrtSegments?.length ? importedSrtSegments : void 0,
      scriptText: importedSrtSegments?.length ? importedSrtSegments.map((seg) => seg.text.trim()).filter(Boolean).join("\n\n") : input.importedPlan?.shots.map((shot) => shot.voiceOver.trim()).filter(Boolean).join("\n\n") || void 0,
      log: [{ ts: Date.now(), stage: "queued", message: "Job created" }],
      createdAt: Date.now()
    };
    if (input.importedAudioPath?.trim() && importedSrtSegments?.length) {
      this.log(id, "audio", `Dùng SRT import làm kịch bản + timing khóa: ${importedSrtSegments.length} đoạn (bỏ qua Whisper)`);
    }
    this.jobs.set(id, job);
    this.emit({ type: "job-updated", jobId: id, job: { ...job } });
    void this.runJob(job);
    return job;
  }
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || !["running", "queued"].includes(job.status)) return false;
    this.activeControllers.get(jobId)?.abort();
    this.log(jobId, "paused", "Tạm dừng job; checkpoint đã được giữ để tiếp tục");
    this.updateJob(jobId, { status: "paused", stage: "paused", message: "Đã tạm dừng", progress: job.progress, finishedAt: Date.now() });
    return true;
  }
  resumeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || !["failed", "paused", "interrupted", "cancelled"].includes(job.status) || this.activeControllers.has(jobId)) return false;
    this.log(jobId, "resume", `Tiếp tục từ checkpoint (${job.stage}, ${Math.round(job.progress)}%)`);
    this.updateJob(jobId, { status: "queued", stage: "queued", message: "Đang chuẩn bị bước tiếp theo", error: void 0, finishedAt: void 0, awaitingNextStep: false });
    void this.runJob(job, true);
    return true;
  }
  removeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status === "running" || job.status === "queued") return false;
    this.jobs.delete(jobId);
    this.emit({ type: "job-removed", jobId, projectId: job.projectId });
    return true;
  }
  updateShotPrompts(jobId, shotIndex, patch) {
    const job = this.jobs.get(jobId);
    if (!job || !job.plannedShots?.length || ["running", "queued"].includes(job.status)) return false;
    const plannedShots = job.plannedShots.map((shot) => shot.index === shotIndex ? { ...shot, ...patch } : shot);
    const chapters = job.chapters?.map((chapter) => ({
      ...chapter,
      plannedShots: chapter.plannedShots?.map((shot) => shot.index === shotIndex ? { ...shot, ...patch } : shot)
    }));
    this.updateJob(jobId, { plannedShots, chapters });
    this.log(jobId, "edit", `Đã cập nhật prompt shot ${shotIndex}`);
    return true;
  }
  /** Replace the imagePath for a shot directly (e.g. after watermark removal). */
  updateShotImagePath(jobId, shotIndex, newImagePath) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    const mediaOutputs = (job.mediaOutputs || []).map(
      (item) => item.index === shotIndex ? { ...item, imagePath: newImagePath } : item
    );
    this.updateJob(jobId, { mediaOutputs });
    return true;
  }
  /**
   * Cache probed video durations onto the job so FCPXML export never re-probes the
   * same files. Called once (on the first export that had to probe), then persisted —
   * so old projects become as fast as new ones after their first export.
   */
  cacheShotVideoDurations(jobId, durations) {
    const job = this.jobs.get(jobId);
    if (!job || durations.length === 0) return false;
    const byIndex = new Map(durations.map((entry) => [entry.index, entry.durationSec]));
    const mediaOutputs = (job.mediaOutputs || []).map(
      (item) => byIndex.has(item.index) ? { ...item, videoDurationSec: byIndex.get(item.index) } : item
    );
    this.updateJob(jobId, { mediaOutputs });
    return true;
  }
  async importShotImage(jobId, shotIndex, source) {
    const job = this.jobs.get(jobId);
    const shot = job?.plannedShots?.find((item) => item.index === shotIndex);
    if (!job || !shot || ["running", "queued"].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, "shots", `${safeFileName(job.title)}_shot_${shotIndex}_import_${Date.now()}.png`);
    const mediaStore = useMediaStore.getState();
    const imageMediaId = mediaStore.addMediaFromUrl({
      url: imagePath,
      name: `${job.title} — Shot ${shotIndex} (import)`,
      type: "image",
      source: "upload",
      folderId: mediaStore.getOrCreateCategoryFolder("upload"),
      projectId: job.projectId
    });
    const previous = job.mediaOutputs?.find((item) => item.index === shotIndex);
    const output = {
      index: shot.index,
      startMs: shot.startMs,
      endMs: shot.endMs,
      characterNames: shot.characterNames || [],
      ...previous,
      imagePath,
      videoPath: previous?.videoPath || "",
      imageMediaId,
      imageStatus: "completed"
    };
    this.updateJob(jobId, { mediaOutputs: [...(job.mediaOutputs || []).filter((item) => item.index !== shotIndex), output].sort((a, b) => a.index - b.index) });
    this.log(jobId, "import", `Đã import ảnh cho shot ${shotIndex}; bước tạo ảnh sẽ bỏ qua shot này`);
    return true;
  }
  async importCharacterImage(jobId, name, source) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, "characters", `${safeFileName(name)}_import_${Date.now()}.png`);
    const output = { name, imagePath, status: "completed" };
    this.updateJob(jobId, { characterOutputs: [...(job.characterOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
    this.log(jobId, "import", `Đã import reference nhân vật ${name}`);
    return true;
  }
  async importSceneImage(jobId, name, source) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, "scenes", `${safeFileName(name)}_import_${Date.now()}.png`);
    const output = { name, imagePath, status: "completed" };
    this.updateJob(jobId, { sceneOutputs: [...(job.sceneOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
    this.log(jobId, "import", `Đã import reference cảnh ${name}`);
    return true;
  }
  /**
   * Regenerate a character or scene reference image by clearing its output and resuming the job.
   * The pipeline's missing-only filter will re-generate exactly the cleared reference.
   */
  regenerateReferenceImage(jobId, kind, name) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status) || this.activeControllers.has(jobId)) return false;
    if (kind === "character") {
      const characterOutputs = (job.characterOutputs || []).map(
        (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...item, imagePath: "", status: "idle" } : item
      );
      this.updateJob(jobId, { characterOutputs });
    } else {
      const sceneOutputs = (job.sceneOutputs || []).map(
        (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...item, imagePath: "", status: "idle" } : item
      );
      this.updateJob(jobId, { sceneOutputs });
    }
    const label = kind === "character" ? "nhân vật" : "cảnh";
    this.updateJob(jobId, {
      outputVideoPath: void 0,
      status: "queued",
      stage: "queued",
      message: `Tạo lại ảnh tham chiếu ${label}: ${name}`,
      error: void 0,
      finishedAt: void 0,
      awaitingNextStep: false
    });
    this.log(jobId, "regenerate", `Tạo lại ảnh tham chiếu ${label}: ${name}`);
    void this.runJob(job, true);
    return true;
  }
  /** Update the prompt text for a planned character or scene reference. */
  updateReferencePrompt(jobId, kind, name, newPrompt) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status)) return false;
    if (kind === "character") {
      const plannedCharacters = (job.plannedCharacters || []).map(
        (c) => c.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...c, characterPrompt: newPrompt } : c
      );
      this.updateJob(jobId, { plannedCharacters });
    } else {
      const plannedScenes = (job.plannedScenes || []).map(
        (s) => s.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...s, scenePrompt: newPrompt } : s
      );
      this.updateJob(jobId, { plannedScenes });
    }
    return true;
  }
  /** Patch planned-shot fields (references, video length) while the job is idle. */
  updateShotFields(jobId, shotIndex, patch) {
    const job = this.jobs.get(jobId);
    if (!job || !job.plannedShots?.length || ["running", "queued"].includes(job.status)) return false;
    const apply = (shot) => shot.index === shotIndex ? { ...shot, ...patch, hasCharacters: patch.characterNames ? patch.characterNames.length > 0 : shot.hasCharacters } : shot;
    const plannedShots = job.plannedShots.map(apply);
    const chapters = job.chapters?.map((chapter) => ({
      ...chapter,
      plannedShots: chapter.plannedShots?.map(apply)
    }));
    this.updateJob(jobId, { plannedShots, chapters });
    return true;
  }
  /** Change which planned characters / scene a shot references (labelled "Tham chiếu" in the UI). */
  updateShotReferences(jobId, shotIndex, patch) {
    const ok = this.updateShotFields(jobId, shotIndex, patch);
    if (ok) this.log(jobId, "edit", `Đã cập nhật tham chiếu shot ${shotIndex}`);
    return ok;
  }
  /** Change the per-shot video length (4/6/8s). */
  updateShotVideoLength(jobId, shotIndex, videoLength) {
    return this.updateShotFields(jobId, shotIndex, { videoLength });
  }
  /** Clear a shot's generated image (and its dependent video) so the user can regenerate or re-import. */
  removeShotImage(jobId, shotIndex) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status)) return false;
    const mediaOutputs = (job.mediaOutputs || []).map(
      (item) => item.index === shotIndex ? { ...item, imagePath: "", imageMediaId: void 0, imageStatus: "idle", videoPath: "", videoMediaId: void 0, videoStatus: "idle" } : item
    );
    this.updateJob(jobId, { mediaOutputs });
    this.log(jobId, "edit", `Đã xóa ảnh shot ${shotIndex}`);
    return true;
  }
  /**
   * Regenerate a single shot's image or video by clearing its checkpoint and resuming the job.
   * The resumed pipeline skips every already-complete asset (missing-only filters) and re-renders
   * the final MP4, so exactly the cleared shot is remade through the shared Director/AutoPilot queue.
   */
  regenerateShotMedia(jobId, shotIndex, kind) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status) || this.activeControllers.has(jobId)) return false;
    const mediaOutputs = (job.mediaOutputs || []).map((item) => {
      if (item.index !== shotIndex) return item;
      if (kind === "image") {
        return { ...item, imagePath: "", imageMediaId: void 0, imageStatus: "idle", videoPath: "", videoMediaId: void 0, videoStatus: "idle" };
      }
      return { ...item, videoPath: "", videoMediaId: void 0, videoStatus: "idle" };
    });
    this.updateJob(jobId, { mediaOutputs });
    const stepsToRemove = kind === "image" ? /* @__PURE__ */ new Set(["images", "videos", "render", "done"]) : /* @__PURE__ */ new Set(["videos", "render", "done"]);
    const completedSteps = (job.completedSteps || []).filter((s) => !stepsToRemove.has(s));
    this.updateJob(jobId, { completedSteps, outputVideoPath: void 0 });
    this.log(jobId, "regenerate", kind === "image" ? `Tạo lại ảnh shot ${shotIndex}` : `Tạo lại video shot ${shotIndex}`);
    void runSingleShotRegeneration(this.ctx, job, shotIndex, kind);
    return true;
  }
  /**
   * Re-stitch the final MP4 from the shots' existing media, optionally applying new
   * render-only settings (subtitles, BGM, resolution). Touches NO image/video
   * generation — only the render stage runs — so it is cheap, costs no credits, and
   * works even when nothing changed (plain re-export). Requires the job to have
   * finished its shot videos at least once.
   */
  rerenderJob(jobId, renderPatch = {}) {
    const job = this.jobs.get(jobId);
    if (!job || ["running", "queued"].includes(job.status) || this.activeControllers.has(jobId)) return false;
    if (!job.completedSteps?.includes("videos") || !job.audioPath) return false;
    this.updateJob(jobId, { input: { ...job.input, ...renderPatch } });
    this.log(jobId, "rerender", "Ghép lại video (render-only) với tham số mới");
    void this.runRerender(job);
    return true;
  }
  async runRerender(job) {
    const controller = new AbortController();
    this.activeControllers.set(job.id, controller);
    const signal = controller.signal;
    const prevOutputMediaId = job.outputMediaId;
    this.updateJob(job.id, { status: "running", stage: "render", error: void 0, message: "Ghép lại video", finishedAt: void 0, outputVideoPath: void 0 });
    try {
      const mediaFiles = useMediaStore.getState().mediaFiles;
      const resolveMediaUrl = (mediaId, fallbackPath) => {
        const entry = mediaId ? mediaFiles.find((media) => media.id === mediaId) : void 0;
        const isInlineUrl = (u) => !!u && (u.startsWith("data:") || u.startsWith("blob:"));
        if (fallbackPath) return fallbackPath;
        if (entry?.url && !isInlineUrl(entry.url)) return entry.url;
        return fallbackPath;
      };
      const pending = (job.plannedShots || []).map((shot) => {
        const media = (job.mediaOutputs || []).find((item) => item.index === shot.index);
        return {
          shot,
          baseImagePath: media?.baseImagePath || "",
          imagePath: resolveMediaUrl(media?.imageMediaId, media?.imagePath) || "",
          videoPath: resolveMediaUrl(media?.videoMediaId, media?.videoPath) || "",
          realImageSearchCompleted: true,
          imageMediaId: media?.imageMediaId,
          videoMediaId: media?.videoMediaId,
          realImageMediaId: media?.realImageMediaId,
          researchStatus: media?.researchStatus ?? "completed",
          imageStatus: media?.imageStatus ?? (media?.imagePath ? "completed" : "idle"),
          videoStatus: media?.videoStatus ?? (media?.videoPath ? "completed" : "skipped")
        };
      });
      if (pending.every((item) => !item.imagePath && !item.videoPath)) {
        throw new Error("Không còn media để ghép — hãy tạo lại shot trước.");
      }
      const outputVideoPath = await runRenderStage(this.ctx, job, pending, job.audioPath, job.srtSegments || [], signal);
      const libraryOutputPath = await saveVideoToLocal(outputVideoPath, `${safeFileName(job.title)}_${Date.now()}.mp4`);
      const mediaStore = useMediaStore.getState();
      if (prevOutputMediaId && job.projectId) {
        try {
          await mediaStore.removeMediaFile(job.projectId, prevOutputMediaId);
        } catch {
        }
      }
      const outputMediaId = mediaStore.addMediaFromUrl({
        url: libraryOutputPath,
        name: `${job.title} — AutoPilot final.mp4`,
        type: "video",
        source: "ai-video",
        folderId: mediaStore.getOrCreateCategoryFolder("ai-video"),
        projectId: job.projectId
      });
      this.log(job.id, "done", `Ghép lại xong: ${outputVideoPath}`);
      this.updateJob(job.id, { status: "done", stage: "done", progress: 100, message: "Đã ghép lại", outputVideoPath, outputMediaId, finishedAt: Date.now() });
    } catch (error) {
      if (signal.aborted) {
        this.updateJob(job.id, { status: "paused", stage: "paused", message: "Đã dừng ghép lại", finishedAt: Date.now() });
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        this.log(job.id, "error", `Ghép lại thất bại: ${msg}`);
        this.updateJob(job.id, { status: "done", stage: "done", error: msg, message: "Lỗi ghép lại", finishedAt: Date.now() });
      }
    } finally {
      this.activeControllers.delete(job.id);
    }
  }
  updateJob(jobId, patch) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    Object.assign(job, patch);
    this.emit({ type: "job-updated", jobId, job: { ...job } });
  }
  updateCharacterOutput(jobId, name, patch) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const current = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const output = { name, imagePath: current?.imagePath || "", ...current, ...patch };
    this.updateJob(jobId, { characterOutputs: [...(job.characterOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
  }
  updateSceneOutput(jobId, name, patch) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const current = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const output = { name, imagePath: current?.imagePath || "", ...current, ...patch };
    this.updateJob(jobId, { sceneOutputs: [...(job.sceneOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
  }
  log(jobId, stage, message) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const entry = { ts: Date.now(), stage, message };
    job.log.push(entry);
    if (job.log.length > 500) job.log.splice(0, job.log.length - 500);
    this.emit({ type: "log", jobId, ...entry });
    this.emit({ type: "job-updated", jobId, job: { ...job } });
  }
  stageProgress(jobId, stage, withinPercent) {
    if (!this.jobs.has(jobId)) return;
    const base = STAGE_BASE[stage] ?? 0;
    const progress = Math.min(100, Math.max(0, base + (STAGE_WEIGHT[stage] ?? 0) * (withinPercent / 100)));
    this.updateJob(jobId, { stage, progress: Math.round(progress) });
  }
  completeStep(job, step) {
    if (job.completedSteps?.includes(step)) return;
    const completedSteps = [.../* @__PURE__ */ new Set([...job.completedSteps || [], step])];
    const nextStep = STEP_ORDER[Math.min(STEP_ORDER.indexOf(step) + 1, STEP_ORDER.length - 1)] || "done";
    this.updateJob(job.id, { completedSteps, nextStep, awaitingNextStep: false });
    const stopAfterStep = job.input.stopAfterStep;
    if (stopAfterStep && step === stopAfterStep && nextStep !== "done") {
      this.log(job.id, "checkpoint", `Đã chạy đến bước "${step}" theo cấu hình hàng chờ; dừng lại.`);
      this.updateJob(job.id, {
        status: "done",
        stage: step === "references" ? "scenes" : step,
        message: `Hoàn thành đến bước ${step} (dừng theo hàng chờ)`,
        awaitingNextStep: false,
        finishedAt: Date.now()
      });
      throw new StepCheckpointReached(step, nextStep);
    }
    if ((job.executionMode || job.input.executionMode) !== "step" || nextStep === "done") return;
    this.log(job.id, "checkpoint", `Hoàn thành bước ${step}; đang chờ người dùng chạy bước ${nextStep}`);
    this.updateJob(job.id, {
      status: "paused",
      stage: step === "references" ? "scenes" : step,
      message: `Đã xong ${step} — bước tiếp theo: ${nextStep}`,
      awaitingNextStep: true,
      finishedAt: Date.now()
    });
    throw new StepCheckpointReached(step, nextStep);
  }
  async isImageAvailable(path) {
    if (!path) return false;
    if (path.startsWith("data:")) return true;
    if (path.startsWith("http://") || path.startsWith("https://")) return false;
    if (path.startsWith("local-image://")) return !!await window.imageStorage?.getImagePath(path);
    if (path.startsWith("idb-image://")) return true;
    const result = await window.imageStorage?.readAsBase64(path);
    return result?.success === true;
  }
  async probeMedia(path) {
    if (!path) return 0;
    const resolved = path.startsWith("local-image://") ? await getAbsoluteImagePath(path) : path;
    if (!resolved || resolved.startsWith("http://") || resolved.startsWith("https://")) return 0;
    try {
      const result = await window.ffmpegRuntime?.probeDuration(resolved);
      return Math.max(0, result?.durationSec || 0);
    } catch {
      return 0;
    }
  }
  async runJob(job, resume = false) {
    const controller = new AbortController();
    this.activeControllers.set(job.id, controller);
    this.updateJob(job.id, { status: "running", startedAt: job.startedAt || Date.now(), finishedAt: void 0, error: void 0 });
    try {
      if (job.visualStylePrompt === void 0) {
        const visualStyle = getProjectVisualStyleSnapshot(job.projectId);
        this.updateJob(job.id, {
          visualStyleId: visualStyle.id,
          visualStyleName: visualStyle.name,
          visualStylePrompt: visualStyle.prompt,
          visualStyleNegativePrompt: visualStyle.negativePrompt
        });
      }
      this.log(job.id, "info", job.visualStylePrompt ? `Khóa style ảnh của job: ${job.visualStyleName || job.visualStyleId || "Video Studio style"}` : "Style ảnh do skill/prompt quyết định (Video Studio đang chọn None)");
      this.log(job.id, "info", resume ? "Tiếp tục AutoPilot từ checkpoint" : "Bắt đầu AutoPilot audio-first");
      let narrationBlocks;
      let audio;
      let srtSegments;
      const checkpointAudioDuration = await this.probeMedia(job.audioPath);
      if (job.input.importedAudioPath?.trim()) {
        audio = checkpointAudioDuration > 0 ? { path: job.audioPath, durationMs: Math.round(checkpointAudioDuration * 1e3) } : await runImportedAudioStage(this.ctx, job, job.input.importedAudioPath.trim());
        if (checkpointAudioDuration > 0) this.log(job.id, "resume", "Bỏ qua audio import đã hoàn thành");
        srtSegments = job.srtSegments?.length ? job.srtSegments : await runSubtitlesStage(this.ctx, job, audio.path, controller.signal);
        if (srtSegments.length === 0) {
          throw new Error("File giọng đọc cần Whisper API để lấy transcript và timing làm kịch bản chính");
        }
        narrationBlocks = srtSegments.map((segment) => segment.text.trim()).filter(Boolean);
        const transcript = narrationBlocks.join("\n\n");
        this.updateJob(job.id, { scriptText: transcript });
        this.log(job.id, "script", `Khóa transcript từ file voice làm kịch bản chính: ${narrationBlocks.length} đoạn`);
        this.stageProgress(job.id, "script", 100);
      } else {
        const scriptText = job.scriptText?.trim() || await runScriptStage(this.ctx, job, controller.signal);
        if (job.scriptText?.trim()) this.log(job.id, "resume", "Bỏ qua kịch bản đã hoàn thành");
        narrationBlocks = extractNarrationBlocks(scriptText);
        if (narrationBlocks.length === 0) throw new Error("Kịch bản không có lời thuyết minh để tạo giọng đọc");
        this.log(job.id, "script", `Khóa ${narrationBlocks.length} khối lời thuyết minh trước khi tạo media`);
        audio = checkpointAudioDuration > 0 ? { path: job.audioPath, durationMs: Math.round(checkpointAudioDuration * 1e3) } : await runAudioStage(this.ctx, job, narrationBlocks, controller.signal);
        if (checkpointAudioDuration > 0) this.log(job.id, "resume", "Bỏ qua voice đã hoàn thành");
        srtSegments = job.srtSegments !== void 0 ? job.srtSegments : await runSubtitlesStage(this.ctx, job, audio.path, controller.signal);
      }
      this.completeStep(job, "audio");
      const beats = job.input.importedPlan ? buildImportedPlanTimeline(job.input.importedPlan.shots.map((shot) => shot.voiceOver), audio.durationMs) : buildNarrationTimeline(narrationBlocks, audio.durationMs, srtSegments, job.input.maxShots);
      if (beats.length === 0) throw new Error("Không lập được timeline hình ảnh từ narration");
      this.log(job.id, "shots", `Audio ${(audio.durationMs / 1e3).toFixed(1)}s → ${beats.length} shot theo timing thật`);
      const longFormThresholdMinutes = Math.min(120, Math.max(
        1,
        Math.round(job.input.longFormThresholdMinutes || DEFAULT_LONG_FORM_THRESHOLD_MINUTES)
      ));
      const longFormMode = job.longFormMode === true || audio.durationMs >= longFormThresholdMinutes * 6e4;
      if (job.longFormMode !== longFormMode) this.updateJob(job.id, { longFormMode });
      this.log(job.id, "shots", longFormMode ? `Long-form bật: voice đạt ngưỡng ${longFormThresholdMinutes} phút` : `Pipeline thường: voice dưới ngưỡng ${longFormThresholdMinutes} phút`);
      const plan = job.plannedShots?.length ? {
        shots: job.plannedShots,
        characters: job.plannedCharacters || [],
        scenes: job.plannedScenes || []
      } : job.input.importedPlan ? runImportedPlanStage(this.ctx, job, beats, job.input.importedPlan) : longFormMode ? await runLongFormShotsStage(this.ctx, job, beats, controller.signal) : await runShotsStage(this.ctx, job, beats, controller.signal);
      if (job.plannedShots?.length) this.log(job.id, "resume", `Bỏ qua visual plan đã lưu (${job.plannedShots.length} shot)`);
      this.completeStep(job, "shots");
      await runMediaStage(this.ctx, job, plan.shots, [], [], controller.signal, "research");
      this.completeStep(job, "research");
      const characterReferences = await runCharactersStage(this.ctx, job, plan.characters, controller.signal);
      const sceneReferences = await runScenesStage(this.ctx, job, plan.scenes, controller.signal);
      this.completeStep(job, "references");
      await runMediaStage(this.ctx, job, plan.shots, characterReferences, sceneReferences, controller.signal, "images");
      this.completeStep(job, "images");
      const pending = await runMediaStage(this.ctx, job, plan.shots, characterReferences, sceneReferences, controller.signal, "videos");
      this.completeStep(job, "videos");
      const checkpointOutputDuration = await this.probeMedia(job.outputVideoPath);
      const outputVideoPath = checkpointOutputDuration > 0 ? job.outputVideoPath : await runRenderStage(this.ctx, job, pending, audio.path, srtSegments, controller.signal);
      if (checkpointOutputDuration > 0) this.log(job.id, "resume", "Bỏ qua render cuối đã hoàn thành");
      else this.updateJob(job.id, { outputVideoPath });
      this.completeStep(job, "render");
      const libraryOutputPath = await saveVideoToLocal(outputVideoPath, `${safeFileName(job.title)}_${Date.now()}.mp4`);
      const mediaStore = useMediaStore.getState();
      if (job.outputMediaId && job.projectId) {
        try {
          await mediaStore.removeMediaFile(job.projectId, job.outputMediaId);
        } catch {
        }
      }
      const outputMediaId = mediaStore.addMediaFromUrl({
        url: libraryOutputPath,
        name: `${job.title} — AutoPilot final.mp4`,
        type: "video",
        source: "ai-video",
        folderId: mediaStore.getOrCreateCategoryFolder("ai-video"),
        projectId: job.projectId
      });
      this.log(job.id, "done", `Hoàn thành: ${outputVideoPath}`);
      this.updateJob(job.id, { status: "done", stage: "done", progress: 100, message: "Done", outputVideoPath, outputMediaId, finishedAt: Date.now() });
    } catch (err) {
      if (err instanceof StepCheckpointReached) return;
      const aborted = controller.signal.aborted;
      const message = aborted ? "Cancelled" : err instanceof Error ? err.message : String(err);
      if (!aborted) this.log(job.id, "error", message);
      if (!aborted) {
        this.updateJob(job.id, { status: "failed", stage: "failed", message, error: message, finishedAt: Date.now() });
      } else if (this.getJob(job.id)?.status !== "paused") {
        this.updateJob(job.id, { status: "paused", stage: "paused", message: "Đã tạm dừng", error: void 0, finishedAt: Date.now() });
      }
    } finally {
      this.activeControllers.delete(job.id);
    }
  }
}
const autopilotEngine = new AutopilotEngine();
const loadedProjectIds = /* @__PURE__ */ new Set();
const saveTimers = /* @__PURE__ */ new Map();
const saveChains = /* @__PURE__ */ new Map();
function jobStorageKey(projectId) {
  return `_p/${projectId}/autopilot-jobs`;
}
async function readJobStorage(key) {
  if (window.fileStorage) return window.fileStorage.getItem(key);
  return localStorage.getItem(key);
}
async function writeJobStorage(key, value) {
  if (window.fileStorage) {
    await window.fileStorage.setItem(key, value);
    return;
  }
  localStorage.setItem(key, value);
}
async function waitForProjectHydration() {
  if (useProjectStore.persist.hasHydrated()) return;
  await new Promise((resolve) => {
    const unsubscribe = useProjectStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (useProjectStore.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
}
async function persistProjectJobs(projectId) {
  const snapshots = autopilotEngine.listJobs().filter((job) => job.projectId === projectId).slice(0, 100);
  await writeJobStorage(jobStorageKey(projectId), JSON.stringify({
    version: 3,
    savedAt: Date.now(),
    jobs: snapshots
  }));
}
function scheduleProjectSave(projectId) {
  if (!projectId) return;
  const existing = saveTimers.get(projectId);
  if (existing) clearTimeout(existing);
  saveTimers.set(projectId, setTimeout(() => {
    saveTimers.delete(projectId);
    const previous = saveChains.get(projectId) || Promise.resolve();
    const next = previous.catch(() => void 0).then(() => persistProjectJobs(projectId)).catch((error) => console.error(`[AutoPilot] Failed to persist jobs for ${projectId}:`, error));
    saveChains.set(projectId, next);
    void next.finally(() => {
      if (saveChains.get(projectId) === next) saveChains.delete(projectId);
    });
  }, 150));
}
async function hydrateAutopilotProject(projectId) {
  if (!projectId || loadedProjectIds.has(projectId)) return;
  loadedProjectIds.add(projectId);
  try {
    const raw = await readJobStorage(jobStorageKey(projectId));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.jobs)) autopilotEngine.restoreJobs(parsed.jobs, projectId);
  } catch (error) {
    loadedProjectIds.delete(projectId);
    console.error(`[AutoPilot] Failed to restore jobs for ${projectId}:`, error);
  }
}
function toListItem(job) {
  return {
    id: job.id,
    projectId: job.projectId,
    title: job.title,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    error: job.error,
    input: job.input,
    executionMode: job.executionMode,
    completedSteps: job.completedSteps,
    nextStep: job.nextStep,
    awaitingNextStep: job.awaitingNextStep,
    plannedCharacters: job.plannedCharacters,
    plannedScenes: job.plannedScenes,
    plannedShots: job.plannedShots,
    audioPath: job.audioPath,
    audioDurationMs: job.audioDurationMs,
    srtSegments: job.srtSegments,
    outputVideoPath: job.outputVideoPath,
    shotCount: job.shotCount,
    characterCount: job.characterCount,
    characterOutputs: job.characterOutputs,
    sceneCount: job.sceneCount,
    sceneOutputs: job.sceneOutputs,
    mediaOutputs: job.mediaOutputs,
    longFormMode: job.longFormMode,
    chapters: job.chapters
  };
}
const useAutopilotStore = create((set, get) => {
  const syncJobs = () => {
    const activeProjectId = useProjectStore.getState().activeProjectId;
    const jobs = autopilotEngine.listJobs().filter((job) => !!activeProjectId && job.projectId === activeProjectId).map(toListItem);
    set({ jobs });
  };
  autopilotEngine.onEvent((event) => {
    syncJobs();
    const projectId = event.type === "job-updated" ? event.job.projectId : event.type === "job-removed" ? event.projectId : autopilotEngine.getJob(event.jobId)?.projectId;
    scheduleProjectSave(projectId);
  });
  useProjectStore.subscribe((state, previous) => {
    if (state.activeProjectId === previous.activeProjectId) return;
    syncJobs();
    if (state.activeProjectId) void hydrateAutopilotProject(state.activeProjectId);
  });
  void (async () => {
    await waitForProjectHydration();
    const activeProjectId = useProjectStore.getState().activeProjectId;
    if (activeProjectId) await hydrateAutopilotProject(activeProjectId);
    syncJobs();
    try {
      const status = await window.autopilotBridge?.getServerStatus();
      if (status) set({ port: status.port, serverRunning: status.running });
    } catch {
    }
  })();
  return {
    port: 0,
    serverRunning: false,
    flowRunning: false,
    flowReadyCredentials: 0,
    flowBindingCount: 0,
    jobs: [],
    createJob: (input) => {
      if (!hasPlanAccess(useLicenseStore.getState().plan, "dev")) {
        return { ok: false, error: "AutoPilot chỉ dành cho gói Dev." };
      }
      const job = autopilotEngine.createJob(input);
      return { ok: true, jobId: job.id };
    },
    cancelJob: (jobId) => autopilotEngine.cancelJob(jobId),
    resumeJob: (jobId) => autopilotEngine.resumeJob(jobId),
    updateShotPrompts: (jobId, shotIndex, patch) => autopilotEngine.updateShotPrompts(jobId, shotIndex, patch),
    updateShotImagePath: (jobId, shotIndex, newImagePath) => autopilotEngine.updateShotImagePath(jobId, shotIndex, newImagePath),
    updateShotReferences: (jobId, shotIndex, patch) => autopilotEngine.updateShotReferences(jobId, shotIndex, patch),
    updateShotVideoLength: (jobId, shotIndex, videoLength) => autopilotEngine.updateShotVideoLength(jobId, shotIndex, videoLength),
    removeShotImage: (jobId, shotIndex) => autopilotEngine.removeShotImage(jobId, shotIndex),
    regenerateShotMedia: (jobId, shotIndex, kind) => autopilotEngine.regenerateShotMedia(jobId, shotIndex, kind),
    importShotImage: (jobId, shotIndex, source) => autopilotEngine.importShotImage(jobId, shotIndex, source),
    importCharacterImage: (jobId, name, source) => autopilotEngine.importCharacterImage(jobId, name, source),
    importSceneImage: (jobId, name, source) => autopilotEngine.importSceneImage(jobId, name, source),
    regenerateReferenceImage: (jobId, kind, name) => autopilotEngine.regenerateReferenceImage(jobId, kind, name),
    updateReferencePrompt: (jobId, kind, name, newPrompt) => autopilotEngine.updateReferencePrompt(jobId, kind, name, newPrompt),
    rerenderJob: (jobId, renderPatch) => autopilotEngine.rerenderJob(jobId, renderPatch),
    removeJob: (jobId) => autopilotEngine.removeJob(jobId),
    refreshEngineStatus: async () => {
      const status = await window.autopilotBridge?.getServerStatus();
      set({
        port: status?.port ?? get().port,
        serverRunning: status?.running ?? get().serverRunning
      });
      let flowRunning = false;
      let flowReadyCredentials = 0;
      let flowBindingCount = 0;
      try {
        const flowStatus = await window.googleFlowRuntime?.getStatus();
        flowRunning = !!flowStatus?.running;
        flowReadyCredentials = flowStatus?.readyCredentialCount ?? 0;
        const activeProjectId = useProjectStore.getState().activeProjectId;
        if (activeProjectId) {
          const bindings = await window.googleFlowRuntime?.listProjectBindings(activeProjectId);
          flowBindingCount = bindings?.length ?? 0;
        }
      } catch {
      }
      set({ flowRunning, flowReadyCredentials, flowBindingCount });
    }
  };
});
function buildEngineStatus() {
  const state = useAutopilotStore.getState();
  const runningJobs = state.jobs.filter(
    (job) => job.status === "running" || job.status === "queued"
  ).length;
  return {
    port: state.port,
    serverRunning: state.serverRunning,
    rendererReady: true,
    flowRunning: state.flowRunning,
    flowReadyCredentials: state.flowReadyCredentials,
    flowBindingCount: state.flowBindingCount,
    activeJobCount: runningJobs
  };
}
export {
  getProviderCredentialCount as $,
  getFeatureNotConfiguredMessage as A,
  readImageAsBase64 as B,
  getStyleById as C,
  DEFAULT_STYLE_ID as D,
  getStyleTokens as E,
  isIdbImagePath as F,
  getStylePrompt as G,
  syncRuntimeLaneSettings as H,
  resolveLaneCount as I,
  buildLaneWorkers as J,
  getGenerationFlowSettings as K,
  runLaneQueue as L,
  withRetry as M,
  randomBetween as N,
  isAbortLikeError as O,
  saveVideoToLocal as P,
  retryOperation as Q,
  getFileType as R,
  getImageDimensions as S,
  generateVideoThumbnail as T,
  getMediaDuration as U,
  VISUAL_STYLE_PRESETS as V,
  getApiKeyCount as W,
  IMAGE_HOST_PRESETS as X,
  GOOGLE_FLOW_IMAGE_MODELS as Y,
  GOOGLE_FLOW_VIDEO_MODELS as Z,
  GROK_VIDEO_MODELS as _,
  autopilotEngine as a,
  getModelDisplayName as a0,
  maskApiKey as a1,
  parseApiKeys as a2,
  isVisibleImageHostProvider as a3,
  ApiKeyManager as a4,
  useAutopilotStore as a5,
  getAbsoluteImagePath as a6,
  readBlobFromBrowserStorage as a7,
  useCustomStyleStore as a8,
  STYLE_CATEGORIES as a9,
  removeWatermarkWithDiagnostics as aa,
  getStyleName as ab,
  buildEngineStatus as b,
  useProjectVisualStyleId as c,
  useDirectorStore as d,
  useActiveDirectorProject as e,
  useSceneStore as f,
  googleFlowProvider as g,
  useCharacterLibraryStore as h,
  createProjectScopedStorage as i,
  useScriptStore as j,
  useMediaStore as k,
  hydrateAutopilotProject as l,
  useAPIConfigStore as m,
  normalizeVideoLength as n,
  isProviderCredentialConfigured as o,
  normalizeRefImageIndexes as p,
  getFeatureConfig as q,
  resolveFlowProjectBinding as r,
  setProjectVisualStyleId as s,
  callChatAPI as t,
  useActiveScriptProject as u,
  safeParseJson as v,
  cleanJsonString as w,
  runConcurrentOrdered as x,
  callFeatureAPI as y,
  saveImageToLocal as z
};
