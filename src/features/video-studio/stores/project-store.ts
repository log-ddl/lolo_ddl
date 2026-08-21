import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fileStorage } from "@/shared/lib/indexed-db-storage";
import { generateUUID } from "@/shared/lib/utils";

export const DEFAULT_FPS = 30;

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  createProject: (name?: string) => Project;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  ensureDefaultProject: () => void;
}

// Default project used by the desktop app.
const DEFAULT_PROJECT: Project = {
  id: "default-project",
  name: "LONGDD Project",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [DEFAULT_PROJECT],
      activeProjectId: DEFAULT_PROJECT.id,
      activeProject: DEFAULT_PROJECT,

      ensureDefaultProject: () => {
        const { projects, activeProjectId } = get();
        if (projects.length === 0) {
          set({
            projects: [DEFAULT_PROJECT],
            activeProjectId: DEFAULT_PROJECT.id,
            activeProject: DEFAULT_PROJECT,
          });
          return;
        }
        if (!activeProjectId) {
          set({
            activeProjectId: projects[0].id,
            activeProject: projects[0],
          });
        }
      },

      createProject: (name) => {
        const newProject: Project = {
          id: generateUUID(),
          name: name?.trim() || `New Project ${new Date().toLocaleDateString('en-US')}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          // Do not set activeProjectId here. Project switching is handled elsewhere to avoid skipping rehydration when the id matches.
        }));
        return newProject;
      },

      renameProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
          activeProject:
            state.activeProject?.id === id
              ? { ...state.activeProject, name, updatedAt: Date.now() }
              : state.activeProject,
        }));
      },

      deleteProject: (id) => {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id);
          const nextActive =
            state.activeProjectId === id ? remaining[0] || null : state.activeProject;
          return {
            projects: remaining,
            activeProjectId: nextActive?.id || null,
            activeProject: nextActive,
          };
        });
        // Clean up the per-project storage directory.
        if (window.fileStorage?.removeDir) {
          window.fileStorage.removeDir(`_p/${id}`).catch((err: any) =>
            console.warn(`[ProjectStore] Failed to remove project dir _p/${id}:`, err)
          );
        }
      },

      setActiveProject: (id) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id) || null;
          return {
            activeProjectId: project?.id || null,
            activeProject: project,
          };
        });
      },
    }),
    {
      name: "longdd-project-store",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
      migrate: (persisted: any) => {
        if (persisted?.projects && persisted.projects.length > 0) {
          return persisted;
        }
        return {
          projects: [DEFAULT_PROJECT],
          activeProjectId: DEFAULT_PROJECT.id,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const project =
          state.projects.find((p) => p.id === state.activeProjectId) ||
          state.projects[0] ||
          null;
        state.activeProjectId = project?.id || null;
        state.activeProject = project;

        // Reconcile the project index with project folders after hydration.
        // Only folders with a core script/director store count as standalone projects.
        discoverProjectsFromDisk().catch((err) =>
          console.warn('[ProjectStore] Disk discovery failed:', err)
        );
      },
    }
  )
);

/**
 * Scan actual project folders under _p/ and recover any project missing from the projects list.
 *
 * This covers scenarios such as:
 * - the storage path changed and data was migrated, but the store was not reloaded
 * - the persisted project list is incomplete after import or manual copying
 * - a machine switch where the app points at an old data directory but the list is empty
 */
async function discoverProjectsFromDisk(): Promise<void> {
  if (!window.fileStorage?.listDirs) return;

  try {
    // List all child directories under _p/; each directory name is a projectId.
    const diskProjectIds = await window.fileStorage.listDirs('_p');
    if (!diskProjectIds || diskProjectIds.length === 0) return;

    const { projects } = useProjectStore.getState();

    // Older split-storage writes could create _p/{id} folders containing only
    // characters/media/scenes for stale item projectIds. Previous discovery code
    // treated those resource-only folders as projects and added a dashboard card.
    const coreStoreById = new Map<string, {
      scriptRaw: string | null;
      directorRaw: string | null;
    }>();
    await Promise.all(diskProjectIds.map(async (pid) => {
      const [scriptRaw, directorRaw] = await Promise.all([
        readFirstProjectStore(pid, ['script', 'script-store']),
        readFirstProjectStore(pid, ['director', 'director-store']),
      ]);
      coreStoreById.set(pid, { scriptRaw, directorRaw });
    }));

    const hasCoreStore = (id: string) => {
      const stores = coreStoreById.get(id);
      return Boolean(stores?.scriptRaw || stores?.directorRaw);
    };

    // Remove only cards that were automatically recovered by the old logic and
    // point to resource-only folders. Keep both the folder and its data untouched.
    const staleRecoveredIds = new Set(
      projects
        .filter((project) =>
          project.name.startsWith('Recovered Project (') &&
          diskProjectIds.includes(project.id) &&
          !hasCoreStore(project.id)
        )
        .map((project) => project.id)
    );

    if (staleRecoveredIds.size > 0) {
      useProjectStore.setState((state) => {
        const remaining = state.projects.filter((project) => !staleRecoveredIds.has(project.id));
        const activeWasRemoved =
          state.activeProjectId !== null && staleRecoveredIds.has(state.activeProjectId);
        const nextActive = activeWasRemoved
          ? remaining[0] || null
          : state.activeProject;

        return {
          projects: remaining,
          activeProjectId: nextActive?.id || null,
          activeProject: nextActive,
        };
      });
      console.log(
        '[ProjectStore] Hid resource-only recovered entries:',
        [...staleRecoveredIds].map((id) => id.substring(0, 8))
      );
    }

    const currentProjects = useProjectStore.getState().projects;
    const knownIds = new Set(currentProjects.map((p) => p.id));

    const missingIds = diskProjectIds.filter((id) => !knownIds.has(id) && hasCoreStore(id));
    if (missingIds.length === 0) return;

    console.log(
      `[ProjectStore] Found ${missingIds.length} projects on disk not in store:`,
      missingIds.map((id) => id.substring(0, 8))
    );

    // Try to recover project names from the director/script store files of each missing project.
    const recoveredProjects: Project[] = [];
    for (const pid of missingIds) {
      let name = `Recovered Project (${pid.substring(0, 8)})`;
      const createdAt = Date.now();
      const coreStores = coreStoreById.get(pid);

      // Try to recover the name from the script store.
      try {
        const scriptRaw = coreStores?.scriptRaw;
        if (scriptRaw) {
          const parsed = JSON.parse(scriptRaw);
          const state = parsed?.state ?? parsed;
          // The script store may still contain project metadata under its projects field.
          if (state?.projects?.[pid]?.title) {
            name = state.projects[pid].title;
          }
        }
      } catch { /* ignore */ }

      // Try to recover creation-time-like signals from the director store.
      try {
        const directorRaw = coreStores?.directorRaw;
        if (directorRaw) {
          const parsed = JSON.parse(directorRaw);
          const state = parsed?.state ?? parsed;
          const screenplay =
            state?.projectData?.screenplay ??
            state?.projects?.[pid]?.screenplay;
          if (screenplay) {
            // A non-empty screenplay indicates a real project.
            if (!name.includes('Recovered Project')) {
              // A better name was already found; keep it.
            } else if (screenplay) {
              // Use the first part of the screenplay as a temporary project name.
              const preview = screenplay.substring(0, 20).replace(/\n/g, ' ').trim();
              if (preview) name = preview + '...';
            }
          }
        }
      } catch { /* ignore */ }

      recoveredProjects.push({
        id: pid,
        name,
        createdAt,
        updatedAt: Date.now(),
      });
    }

    if (recoveredProjects.length > 0) {
      useProjectStore.setState((state) => ({
        projects: [...state.projects, ...recoveredProjects],
      }));
      console.log(
        `[ProjectStore] Recovered ${recoveredProjects.length} projects from disk:`,
        recoveredProjects.map((p) => `${p.id.substring(0, 8)}:${p.name}`)
      );
    }
  } catch (err) {
    console.error('[ProjectStore] discoverProjectsFromDisk error:', err);
  }
}

async function readFirstProjectStore(
  projectId: string,
  storeNames: string[],
): Promise<string | null> {
  for (const storeName of storeNames) {
    try {
      const raw = await window.fileStorage?.getItem(`_p/${projectId}/${storeName}`);
      if (raw) return raw;
    } catch {
      // Try the next compatible store name.
    }
  }
  return null;
}
