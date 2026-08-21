/**
 * Custom Style Store.
 * Manages user-defined style assets independently from built-in presets.
 * Persists to localStorage as a global asset set rather than per-project data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { registerCustomStyleLookup, type StylePreset } from '@/features/video-studio/lib/constants/visual-styles';

// ==================== Types ====================

export interface CustomStyle {
  id: string;
  name: string;                 // Style name (required)
  prompt: string;               // Raw user prompt, possibly mixing style and scene description
  negativePrompt: string;       // Negative prompt
  description: string;          // Description
  referenceImages: string[];    // Reference image paths (local-image://styles/...)
  tags: string[];               // Tags
  folderId: string | null;      // Parent folder
  // === AI-extracted structured style terms (higher priority than prompt) ===
  styleTokens?: string;         // Pure visual-style keywords used for character/scene sheets
  sceneTokens?: string;         // Scene/composition/prop keywords used in Director / shot design
  createdAt: number;
  updatedAt: number;
}

export interface CustomStyleFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

interface CustomStyleState {
  styles: CustomStyle[];
  folders: CustomStyleFolder[];
  selectedStyleId: string | null;
  editingStyleId: string | null;    // null = not editing, 'new' = creating new, otherwise editing existing
}

interface CustomStyleActions {
  // Style CRUD
  addStyle: (style: Omit<CustomStyle, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateStyle: (id: string, updates: Partial<Omit<CustomStyle, 'id' | 'createdAt'>>) => void;
  deleteStyle: (id: string) => void;
  duplicateStyle: (id: string) => string | null;

  // Folder CRUD
  addFolder: (name: string, parentId?: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Selection
  selectStyle: (id: string | null) => void;
  setEditingStyle: (id: string | null) => void;

  // Queries
  getStyleById: (id: string) => CustomStyle | undefined;
  getStylesByFolder: (folderId: string | null) => CustomStyle[];
  getAllStyles: () => CustomStyle[];

  // Reset
  reset: () => void;
}

type CustomStyleStore = CustomStyleState & CustomStyleActions;

// ==================== Initial State ====================

const initialState: CustomStyleState = {
  styles: [],
  folders: [],
  selectedStyleId: null,
  editingStyleId: null,
};

// ==================== Store ====================

export const useCustomStyleStore = create<CustomStyleStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Style CRUD
      addStyle: (styleData) => {
        const id = `custom_style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const newStyle: CustomStyle = {
          ...styleData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          styles: [...state.styles, newStyle],
        }));
        return id;
      },

      updateStyle: (id, updates) => {
        set((state) => ({
          styles: state.styles.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },

      deleteStyle: (id) => {
        set((state) => ({
          styles: state.styles.filter((s) => s.id !== id),
          selectedStyleId: state.selectedStyleId === id ? null : state.selectedStyleId,
          editingStyleId: state.editingStyleId === id ? null : state.editingStyleId,
        }));
      },

      duplicateStyle: (id) => {
        const source = get().styles.find((s) => s.id === id);
        if (!source) return null;
        const newId = `custom_style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const copy: CustomStyle = {
          ...source,
          id: newId,
          name: `${source.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          styles: [...state.styles, copy],
        }));
        return newId;
      },

      // Folder CRUD
      addFolder: (name, parentId = null) => {
        const id = `stylefolder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newFolder: CustomStyleFolder = {
          id,
          name,
          parentId: parentId || null,
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
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          // Move styles back to the root folder.
          styles: state.styles.map((s) =>
            s.folderId === id ? { ...s, folderId: null, updatedAt: Date.now() } : s
          ),
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
      reset: () => set(initialState),
    }),
    {
      name: 'longdd-custom-styles',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        styles: state.styles,
        folders: state.folders,
      }),
    }
  )
);

// ==================== Register Custom Style Lookup ====================
// This lets helpers in visual-styles.ts (getStyleById, getStylePrompt, etc.)
// resolve user-defined styles stored in localStorage.

/**
 * Infer the style category from the prompt.
 * Supports both English and Chinese keywords:
 *   real -> realistic/photorealistic/photography and Chinese realism terms
 *   3d -> 3d/render/unreal/c4d and Chinese 3D/rendering terms
 *   stop_motion -> stop motion/claymation and Chinese stop-motion terms
 *   otherwise -> 'none' (do not invent a category the user did not choose)
 */
function inferCategoryFromPrompt(prompt: string): import('@/features/video-studio/lib/constants/visual-styles').StyleCategory {
  const lower = prompt.toLowerCase();
  // English keywords
  if (/\b(realistic|photorealistic|real\s?person|photography|real\s?life|cinematic\s?lighting.*skin)/.test(lower)) {
    return 'real';
  }
  // Chinese keywords: realistic / live action / real location / cinematic realism / practical shoot / film / still frame
  if (/(\u5199\u5b9e|\u771f\u4eba|\u5b9e\u666f|\u7535\u5f71\u7ea7|\u5b9e\u62cd|\u80f6\u7247|\u5267\u7167|\u65e0\s?CGI|\u76ae\u80a4\u7eb9\u7406|\u6bdb\u5b54)/.test(prompt)) {
    return 'real';
  }
  // English 3D keywords
  if (/\b(3d|render|unreal\s?engine|c4d|blender|voxel|low\s?poly)/.test(lower)) {
    return '3d';
  }
  // Chinese 3D keywords
  if (/(\u4e09\u7ef4|3D|\u6e32\u67d3|\u865a\u5e7b\u5f15\u64ce|\u5efa\u6a21)/.test(prompt)) {
    return '3d';
  }
  // Stop motion
  if (/\b(stop.?motion|claymation|puppet)/.test(lower) || /(\u5b9a\u683c|\u9ecf\u571f|\u6728\u5076)/.test(prompt)) {
    return 'stop_motion';
  }
  return 'none';
}

/** Infer media type from category. */
function inferMediaType(category: import('@/features/video-studio/lib/constants/visual-styles').StyleCategory): import('@/features/video-studio/lib/constants/visual-styles').MediaType {
  switch (category) {
    case 'real': return 'cinematic';
    case '3d': return 'cinematic';
    case 'stop_motion': return 'stop-motion';
    default: return 'animation';
  }
}

registerCustomStyleLookup((id: string): StylePreset | undefined => {
  const style = useCustomStyleStore.getState().styles.find(s => s.id === id);
  if (!style) return undefined;

  // Infer category/mediaType automatically because the user editor does not expose those fields yet.
  const effectivePrompt = style.prompt || '';
  const category = inferCategoryFromPrompt(effectivePrompt);
  const mediaType = inferMediaType(category);

  // Prefer AI-extracted styleTokens (pure visual style). Fall back to the raw prompt if needed.
  const prompt = style.styleTokens
    || effectivePrompt
    || `${style.name} style, professional quality`;

  return {
    id: style.id,
    name: style.name,
    category,
    mediaType,
    prompt,
    negativePrompt: style.negativePrompt || '',
    description: style.description || '',
    thumbnail: '',
  };
});
