/**
 * Character Library Store
 * Manages AI-generated characters with multi-view support.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { migrateFromLocalStorage } from '@/shared/lib/indexed-db-storage';
import { createSplitStorage } from '@/features/video-studio/lib/project-storage';
import type { GoogleFlowMediaIdsBySource } from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

// ==================== Types ====================

// Character folder for library organization
export interface CharacterFolder {
  id: string;
  name: string;
  parentId: string | null;  // Supports nested folders
  projectId?: string;       // Associated project id for auto-created folders
  isAutoCreated?: boolean;  // Whether it was auto-created for a project
  createdAt: number;
}

export interface Character {
  id: string;
  name: string;
  description?: string; // Short character description used for director @Name references
  characterPrompt: string; // English character prompt for consistency
  identityPrompt?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  projectId?: string;   // Associated project (optional)
  // Extended attributes (inspired by CineGen-AI)
  gender?: string;      // Gender
  age?: string;         // Age / age group
  personality?: string; // Personality traits
  role?: string;        // Role / background
  traits?: string;      // Core traits
  skills?: string;      // Skills / abilities
  keyActions?: string;  // Key actions / accomplishments
  appearance?: string;  // Appearance traits
  relationships?: string; // Character relationships
  voiceId?: string; // Optional voice for selective dialogue scenes
  referenceImages?: string[]; // User uploaded reference images (base64)
  styleId?: string; // Visual style preset ID
  folderId?: string | null; // Folder ID for organization
  thumbnailUrl?: string; // Main character image
  // Enhanced fields (inspired by AniKuku)
  tags?: string[];        // Character tags, e.g. #wuxia #lead #swordsman
  notes?: string;         // Character notes / story notes
  status?: 'draft' | 'linked'; // draft = draft, linked = linked to screenplay
  linkedEpisodeId?: string;    // Linked episode id
  
  googleFlowMediaIdsBySource?: GoogleFlowMediaIdsBySource;
  
  createdAt: number;
  updatedAt: number;
}

export type CharacterGenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

interface CharacterLibraryState {
  characters: Character[];
  folders: CharacterFolder[];
  currentFolderId: string | null;
  selectedCharacterId: string | null;
  generationStatus: CharacterGenerationStatus;
  generationError: string | null;
  generatingCharacterId: string | null;
}

interface CharacterLibraryActions {
  // Character CRUD
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  moveToFolder: (characterId: string, folderId: string | null) => void;
  
  // Folder CRUD
  addFolder: (name: string, parentId?: string | null, projectId?: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setCurrentFolder: (id: string | null) => void;
  getOrCreateProjectFolder: (projectId: string, projectName: string) => string;
  
  // Selection
  selectCharacter: (id: string | null) => void;
  
  // Generation status
  setGenerationStatus: (status: CharacterGenerationStatus, error?: string) => void;
  setGeneratingCharacter: (id: string | null) => void;
  
  // Project scoping helpers
  assignProjectToUnscoped: (projectId: string) => void;
  
  // Utilities
  getCharacterById: (id: string) => Character | undefined;
  getFolderById: (id: string) => CharacterFolder | undefined;
  reset: () => void;
}

type CharacterLibraryStore = CharacterLibraryState & CharacterLibraryActions;

// ==================== Initial State ====================

const initialState: CharacterLibraryState = {
  characters: [],
  folders: [],
  currentFolderId: null,
  selectedCharacterId: null,
  generationStatus: 'idle',
  generationError: null,
  generatingCharacterId: null,
};

function stripBase64Images(values?: string[]): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  const filtered = values.filter((value): value is string => !!value && !value.startsWith('data:'));
  return filtered.length > 0 ? filtered : undefined;
}

// ==================== Split/Merge for Per-Project Storage ====================

type CharPersistedState = { folders: CharacterFolder[]; characters: Character[]; currentFolderId: string | null };

function splitCharData(state: CharPersistedState, pid: string) {
  return {
    projectData: {
      folders: state.folders.filter((f) => f.projectId === pid),
      characters: state.characters.filter((c) => c.projectId === pid),
      currentFolderId: state.currentFolderId,
    },
    sharedData: {
      folders: state.folders.filter((f) => !f.projectId),
      characters: state.characters.filter((c) => !c.projectId),
      currentFolderId: null,
    },
  };
}

function mergeCharData(
  projectData: CharPersistedState | null,
  sharedData: CharPersistedState | null,
): CharPersistedState {
  return {
    folders: [
      ...(sharedData?.folders ?? []),
      ...(projectData?.folders ?? []),
    ],
    characters: [
      ...(sharedData?.characters ?? []),
      ...(projectData?.characters ?? []),
    ],
    currentFolderId: projectData?.currentFolderId ?? null,
  };
}

// ==================== Store ====================

export const useCharacterLibraryStore = create<CharacterLibraryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Character CRUD
      addCharacter: (characterData) => {
        const id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        
        const newCharacter: Character = {
          ...characterData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          characters: [...state.characters, newCharacter],
        }));
        
        console.log(`Character added: ${newCharacter.name} (total: ${useCharacterLibraryStore.getState().characters.length})`);
        
        return id;
      },

      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id
              ? { ...char, ...updates, updatedAt: Date.now() }
              : char
          ),
        }));
      },

      deleteCharacter: (id) => {
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
          selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
        }));
      },

      moveToFolder: (characterId, folderId) => {
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === characterId
              ? { ...char, folderId, updatedAt: Date.now() }
              : char
          ),
        }));
      },

      // Folder CRUD
      addFolder: (name, parentId = null, projectId) => {
        const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newFolder: CharacterFolder = {
          id,
          name,
          parentId: parentId || null,
          projectId,
          isAutoCreated: !!projectId,
          createdAt: Date.now(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return id;
      },

      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => {
          // Move characters in this folder to parent folder (or root)
          const folder = state.folders.find((f) => f.id === id);
          const parentId = folder?.parentId || null;
          return {
            folders: state.folders.filter((f) => f.id !== id),
            characters: state.characters.map((char) =>
              char.folderId === id ? { ...char, folderId: parentId } : char
            ),
            currentFolderId: state.currentFolderId === id ? parentId : state.currentFolderId,
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
          generationError: error || null,
        });
      },

      setGeneratingCharacter: (id) => {
        set({ generatingCharacterId: id });
      },
      
      // Assign missing projectId to current project (for isolation toggle)
      assignProjectToUnscoped: (projectId) => {
        set((state) => ({
          characters: state.characters.map((char) =>
            char.projectId ? char : { ...char, projectId }
          ),
          folders: state.folders.map((folder) =>
            folder.projectId ? folder : { ...folder, projectId }
          ),
        }));
      },

      // Utilities
      getCharacterById: (id) => {
        return get().characters.find((char) => char.id === id);
      },

      getFolderById: (id) => {
        return get().folders.find((f) => f.id === id);
      },

      reset: () => set(initialState),
    }),
    {
      name: 'longdd-character-library',
      storage: createJSONStorage(() => createSplitStorage<CharPersistedState>(
        'characters', splitCharData, mergeCharData, 'shareCharacters'
      )),
      partialize: (state) => ({
        // Persist folders
        folders: state.folders,
        currentFolderId: state.currentFolderId,
          // Persist characters with essential data only
          characters: state.characters.map((char) => ({
            ...char,
            // Keep persisted local/remote refs, but strip raw base64 payloads.
            referenceImages: stripBase64Images(char.referenceImages),
          })),
      }),
      merge: (persisted: any, current: any) => {
        if (!persisted) return current;
        return {
          ...current,
          folders: persisted.folders ?? current.folders,
          characters: (persisted.characters ?? current.characters).map((char: any) => {
            const legacyCharacterPrompt = char['visual' + 'Traits'];
            const { ['visual' + 'Traits']: _discard, identityPrompt, negativePrompt, variations, views, selectedSheetElements, ...cleanChar } = char;
            const legacyMainImage = Array.isArray(views)
              ? views.find((view: any) => view?.viewType === 'front')?.imageUrl || views[0]?.imageUrl
              : undefined;
            return {
            ...cleanChar,
            thumbnailUrl: char.thumbnailUrl || legacyMainImage,
            description: char.description || char.appearance || legacyCharacterPrompt,
            characterPrompt: char.characterPrompt || legacyCharacterPrompt || char.description || char.name,
          }}),
          currentFolderId: persisted.currentFolderId ?? current.currentFolderId,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate character library:', error);
        }
        // Migrate old data from localStorage to IndexedDB
        migrateFromLocalStorage('longdd-character-library');
      },
    }
  )
);

// ==================== Selectors ====================

export const useSelectedCharacter = (): Character | undefined => {
  return useCharacterLibraryStore((state) => {
    if (!state.selectedCharacterId) return undefined;
    return state.characters.find((c) => c.id === state.selectedCharacterId);
  });
};

export const useCharacterCount = (): number => {
  return useCharacterLibraryStore((state) => state.characters.length);
};
