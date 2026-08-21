import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createProjectScopedStorage } from "@/features/video-studio/lib/project-storage";
import {
  defaultCalibrationState,
  defaultProjectData,
  type ScriptProjectData,
  type ScriptStore,
} from "./script/types";
import {
  cloneScriptCharacters,
  flushRecoveredCharactersToDisk,
  normalizeScriptProjectData,
  normalizeShotVoiceFields,
  pendingCharacterRecoveryProjectIds,
} from "./script/normalize";

export type {
  BatchProgress,
  ParseStatus,
  ScriptCalibrationState,
  ScriptCalibrationStatus,
  ScriptImportStatus,
  ScriptProjectData,
  ScriptStructureStatus,
  ScriptSynopsisStatus,
  ShotListStatus,
} from "./script/types";



export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      projects: {},

      setActiveProjectId: (id) => {
        // Skip when the id hasn't changed — ScriptView's mount effect calls this
        // on every tab click, and the redundant set() triggers a persist write.
        if (get().activeProjectId === id) return;
        set({ activeProjectId: id });
      },

      ensureProject: (projectId) => {
        const { projects } = get();
        if (projects[projectId]) return;
        set({
          projects: { ...projects, [projectId]: defaultProjectData() },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
        }));
      },

      updateShot: (projectId, shotId, updates) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              shots: state.projects[projectId].shots.map((s) =>
                s.id === shotId ? normalizeShotVoiceFields({ ...s, ...updates }) : s
              ),
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
        }));
      },

      resetProjectData: (projectId) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: defaultProjectData(),
          },
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
                  episodes: [...(project.scriptData.episodes || []), episode],
                },
                updatedAt: Date.now(),
              },
            },
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
                  episodes: (project.scriptData.episodes || []).map((e) =>
                    e.id === episodeId ? { ...e, ...updates } : e
                  ),
                },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteEpisode: (projectId, episodeId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          // Also remove scenes belonging to this episode
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
                  scenes: project.scriptData.scenes.filter((s) => !sceneIdsToRemove.has(s.id)),
                },
                shots: project.shots.filter((s) => !sceneIdsToRemove.has(s.sceneRefId)),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // ==================== Episode Bundle Atomic Operations ====================

      deleteEpisodeBundle: (projectId, episodeIndex) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const episode = project.scriptData.episodes?.find(e => e.index === episodeIndex);
          const sceneIdsToRemove = new Set(episode?.sceneIds || []);
          const newEpisodes = (project.scriptData.episodes || []).filter(e => e.index !== episodeIndex);
          const newRawScripts = (project.episodeRawScripts || []).filter(e => e.episodeIndex !== episodeIndex);
          // Reindex
          const reindexed = newEpisodes.map((e, i) => ({ ...e, index: i + 1 }));
          const reindexedRaw = newRawScripts.map((e, i) => ({
            ...e,
            episodeIndex: i + 1,
            title: e.title.replace(/^(\u7b2c\d+\u96c6|Episode\s+\d+)/, `Episode ${i + 1}`),
          }));
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: reindexed,
                  scenes: project.scriptData.scenes.filter(s => !sceneIdsToRemove.has(s.id)),
                },
                shots: project.shots.filter(s => !sceneIdsToRemove.has(s.sceneRefId)),
                episodeRawScripts: reindexedRaw,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      reindexEpisodes: (projectId) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          if (!project.scriptData) return state;
          const episodes = [...(project.scriptData.episodes || [])].sort((a, b) => a.index - b.index);
          const rawScripts = [...(project.episodeRawScripts || [])].sort((a, b) => a.episodeIndex - b.episodeIndex);
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                scriptData: {
                  ...project.scriptData,
                  episodes: episodes.map((e, i) => ({ ...e, index: i + 1 })),
                },
                episodeRawScripts: rawScripts.map((e, i) => ({ ...e, episodeIndex: i + 1 })),
                updatedAt: Date.now(),
              },
            },
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
                  episodes: (project.scriptData.episodes || []).map(e =>
                    e.index === episodeIndex
                      ? { ...e, ...(updates.title !== undefined ? { title: updates.title } : {}), ...(updates.synopsis !== undefined ? { description: updates.synopsis } : {}) }
                      : e
                  ),
                },
                episodeRawScripts: (project.episodeRawScripts || []).map(e =>
                  e.episodeIndex === episodeIndex
                    ? { ...e, ...(updates.title !== undefined ? { title: updates.title } : {}), ...(updates.synopsis !== undefined ? { synopsis: updates.synopsis } : {}) }
                    : e
                ),
                updatedAt: Date.now(),
              },
            },
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
            newEpisodes = newEpisodes.map((e) =>
              e.id === episodeId ? { ...e, sceneIds: [...e.sceneIds, scene.id] } : e
            );
          } else if (newEpisodes.length > 0) {
            // Add to first episode if no specific episode specified
            newEpisodes = newEpisodes.map((e, i) =>
              i === 0 ? { ...e, sceneIds: [...e.sceneIds, scene.id] } : e
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
                  episodes: newEpisodes,
                },
                updatedAt: Date.now(),
              },
            },
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
                  scenes: project.scriptData.scenes.map((s) =>
                    s.id === sceneId ? { ...s, ...updates } : s
                  ),
                },
                updatedAt: Date.now(),
              },
            },
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
                    sceneIds: e.sceneIds.filter((id) => id !== sceneId),
                  })),
                },
                shots: project.shots.filter((s) => s.sceneRefId !== sceneId),
                updatedAt: Date.now(),
              },
            },
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
                  characters: [...project.scriptData.characters, character],
                },
                updatedAt: Date.now(),
              },
            },
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
                  characters: project.scriptData.characters.map((c) =>
                    c.id === characterId ? { ...c, ...updates } : c
                  ),
                },
                updatedAt: Date.now(),
              },
            },
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
                  characters: project.scriptData.characters.filter((c) => c.id !== characterId),
                },
                updatedAt: Date.now(),
              },
            },
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
                updatedAt: Date.now(),
              },
            },
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
                updatedAt: Date.now(),
              },
            },
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
              updatedAt: Date.now(),
            },
          },
        }));
      },

      updateEpisodeRawScript: (projectId, episodeIndex, updates) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              episodeRawScripts: state.projects[projectId].episodeRawScripts.map((ep) =>
                ep.episodeIndex === episodeIndex ? { ...ep, ...updates } : ep
              ),
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setCalibrationState: (projectId, updates) => {
        get().ensureProject(projectId);
        set((state) => {
          const project = state.projects[projectId];
          const currentCalibration = project?.calibrationState || defaultCalibrationState();
          const hasPendingCharacters = Object.prototype.hasOwnProperty.call(updates, 'pendingCalibrationCharacters');
          const hasPendingFiltered = Object.prototype.hasOwnProperty.call(updates, 'pendingFilteredCharacters');
          const hasSingleShotStatus = Object.prototype.hasOwnProperty.call(updates, 'singleShotCalibrationStatus');

          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...project,
                calibrationState: {
                  ...currentCalibration,
                  ...updates,
                  pendingCalibrationCharacters: hasPendingCharacters
                    ? (updates.pendingCalibrationCharacters ?? null)
                    : currentCalibration.pendingCalibrationCharacters,
                  pendingFilteredCharacters: hasPendingFiltered
                    ? (updates.pendingFilteredCharacters ?? [])
                    : currentCalibration.pendingFilteredCharacters,
                  singleShotCalibrationStatus: hasSingleShotStatus
                    ? (updates.singleShotCalibrationStatus ?? currentCalibration.singleShotCalibrationStatus)
                    : currentCalibration.singleShotCalibrationStatus,
                },
                updatedAt: Date.now(),
              },
            },
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
                    ...(currentCalibration.singleShotCalibrationStatus || {}),
                    [shotId]: status,
                  },
                },
                updatedAt: Date.now(),
              },
            },
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
              updatedAt: Date.now(),
            },
          },
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
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setSeriesMeta: (projectId, meta) => {
        get().ensureProject(projectId);
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              scriptData:
                state.projects[projectId]?.scriptData &&
                (!state.projects[projectId].scriptData.characters || state.projects[projectId].scriptData.characters.length === 0) &&
                meta.characters?.length
                  ? {
                      ...state.projects[projectId].scriptData,
                      characters: cloneScriptCharacters(meta.characters),
                    }
                  : state.projects[projectId]?.scriptData ?? null,
              seriesMeta: meta,
              updatedAt: Date.now(),
            },
          },
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
                scriptData:
                  project.scriptData &&
                  (!project.scriptData.characters || project.scriptData.characters.length === 0) &&
                  updates.characters?.length
                    ? {
                        ...project.scriptData,
                        characters: cloneScriptCharacters(updates.characters),
                      }
                    : project.scriptData,
                seriesMeta: { ...project.seriesMeta, ...updates },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
    }),
    {
      name: "longdd-script-store",
      storage: createJSONStorage(() => createProjectScopedStorage('script')),
      partialize: (state) => {
        const pid = state.activeProjectId;
        if (!pid || !state.projects[pid]) return { activeProjectId: pid };
        return {
          activeProjectId: pid,
          projectData: state.projects[pid],
        };
      },
      merge: (persisted: any, current: any) => {
        if (!persisted) return current;
        
        // Legacy format: has `projects` as Record (from old monolithic file)
        if (persisted.projects && typeof persisted.projects === 'object') {
          const normalizedProjects: Record<string, ScriptProjectData> = {};
          for (const [projectId, projectData] of Object.entries(persisted.projects)) {
            normalizedProjects[projectId] = normalizeScriptProjectData(projectId, projectData);
          }
          return {
            ...current,
            ...persisted,
            projects: normalizedProjects,
          };
        }
        
        // New per-project format: has `projectData` for single project
        const { activeProjectId: pid, projectData } = persisted;
        if (!pid || !projectData) return current;
        
        return {
          ...current,
          activeProjectId: pid,
          projects: { ...current.projects, [pid]: normalizeScriptProjectData(pid, projectData) },
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || pendingCharacterRecoveryProjectIds.size === 0) {
          return;
        }

        queueMicrotask(() => {
          flushRecoveredCharactersToDisk(state as ScriptStore | undefined);
        });
      },
    }
  )
);

export const useActiveScriptProject = (): ScriptProjectData | null => {
  return useScriptStore((state) => {
    const id = state.activeProjectId;
    if (!id) return null;
    return state.projects[id] || null;
  });
};

