/**
 * Director Store
 * Manages AI screenplay generation and scene execution state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createProjectScopedStorage } from '@/features/video-studio/lib/project-storage';

import { normalizeRefImageIndexes, normalizeVideoLength } from '@/features/video-studio/types/script';
import { cleanVoiceOverText, mergeVideoPromptVoiceOver, splitVideoPromptVoiceOver } from '@/features/video-studio/lib/script/voice-over';

import type { DirectorStore } from "./director/types";
import {
  defaultEditorPrefs,
  defaultProjectData,
  defaultScreenplayDraft,
  initialState,
  normalizeDirectorProjectData,
  normalizeSplitSceneVoiceFields,
} from "./director/defaults";

// ==================== Types (moved to director-types.ts, re-exported) ====================

import type {
  DirectorProjectData,
  GenerationStatus,
  SplitScene,
  StoryboardStatus,
} from './director-types';

export type {
  StoryboardStatus,
  GenerationStatus,
  VideoStatus,
  SceneProviderState,
  SplitScene,
  DirectorScreenplayDraft,
  DirectorEditorPrefs,
  DirectorProjectData,
} from './director-types';

// ==================== Preset Constants (imported from director-presets.ts and re-exported) ====================
// Local type imports used by this file for interfaces such as SplitScene.
export {
  SOUND_EFFECT_PRESETS,
  type SoundEffectTag,
  EMOTION_PRESETS,
  type EmotionTag,
} from './director-presets';


// ==================== Store ====================

export const useDirectorStore = create<DirectorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

  // Project management
  setActiveProjectId: (projectId) => {
    // Short-circuit when the id hasn't changed — DirectorView's mount effect
    // calls this on every tab click, and a redundant set() triggers a full
    // persist write of the (already correct) state which can cause UI lag.
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
      projects: { ...projects, [projectId]: defaultProjectData() },
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
          storyboardImageMediaId: mediaId ?? null,
        },
      },
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
          storyboardStatus: status,
        },
      },
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
          projectFolderId: folderId,
        },
      },
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
          storyboardStatus: error ? 'error' : currentProject?.storyboardStatus || 'idle',
        },
      },
    });
  },
  
  setSplitScenes: (scenes) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    // Ensure all scenes have all fields initialized with defaults
    const initialized = scenes.map((s, index) => {
      const voiceFields = normalizeSplitSceneVoiceFields({
        videoPrompt: s.videoPrompt ?? '',
        voiceOver: (s as any).voiceOver,
        voiceOverSynced: (s as any).voiceOverSynced,
      });

      return {
        ...s,
        // Basic scene information
        sceneName: (s as any).sceneName ?? '',
        sceneLocation: (s as any).sceneLocation ?? '',
        
        // ========== First-Frame Fields ==========
        imageHttpUrl: (s as any).imageHttpUrl ?? null,
        // First-frame prompt
        imagePrompt: (s as any).imagePrompt ?? '',
        // First-frame generation status
        imageStatus: s.imageStatus || 'completed' as const,
        imageProgress: s.imageProgress ?? 100,
        imageError: s.imageError ?? null,

        // ========== Video Fields ==========
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        voiceOverSynced: voiceFields.voiceOverSynced,
        videoLength: normalizeVideoLength(s.videoLength),
        videoStatus: s.videoStatus || 'idle' as const,
        videoProgress: s.videoProgress ?? 0,
        videoUrl: s.videoUrl ?? null,
        videoError: s.videoError ?? null,
        videoMediaId: s.videoMediaId ?? null,
        
        // ========== Characters ==========
        characterIds: s.characterIds ?? [],
        
        // ========== Imported screenplay information ==========
        dialogue: s.dialogue ?? '',
        soundEffectText: (s as any).soundEffectText ?? '',
        
        // ========== Video Parameters ==========
        ambientSound: s.ambientSound ?? '',
        soundEffects: s.soundEffects ?? [],
        
        // ========== Continuity - per shot ==========
        continuityRef: s.continuityRef ?? undefined,
        ref_image: normalizeRefImageIndexes((s as any).ref_image ?? (s as any).refImage),
        sourceShotIndex: (s as any).sourceShotIndex ?? index + 1,
      };
    });
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          splitScenes: initialized,
        },
      },
    });
  },
  
  // ========== Two-Tier Prompt Update Methods ==========
  
  // Update first-frame prompt (static image description)
  updateSplitSceneImagePrompt: (sceneId, prompt) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { 
        ...scene, 
        imagePrompt: prompt,
      } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },
  
  // Update video prompt (action / motion description)
  updateSplitSceneVideoPrompt: (sceneId, prompt) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const parts = splitVideoPromptVoiceOver(prompt);
      return {
        ...scene,
        videoPrompt: parts.videoPrompt,
        voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
        voiceOverSynced: false,
      };
    });
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },
  
  // Legacy compatibility API that actually updates videoPrompt
  updateSplitScenePrompt: (sceneId, prompt) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const parts = splitVideoPromptVoiceOver(prompt);
      return {
        ...scene,
        videoPrompt: parts.videoPrompt,
        voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
        voiceOverSynced: false,
      };
    });
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
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
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { 
        ...scene, 
        imageDataUrl,
        // If httpUrl is explicitly provided (including an empty string), use it; otherwise force-clear with null.
        // Use null instead of undefined so the previous value is definitely overwritten.
        imageHttpUrl: httpUrl !== undefined ? (httpUrl || null) : null,
        // If no httpUrl is supplied, also clear imageSource to avoid incorrect assumptions during video generation.
        imageSource: httpUrl ? 'ai-generated' : undefined,
        imageStatus: 'completed' as const,
        imageProgress: 100,
        imageError: null,
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
      } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  updateSplitSceneImageStatus: (sceneId, updates) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  updateSplitSceneVideo: (sceneId, updates) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  updateSplitSceneCharacters: (sceneId, characterIds) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, characterIds } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  updateSplitSceneCharacterVariationMap: (sceneId, characterVariationMap) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, characterVariationMap } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },


  updateSplitSceneAmbientSound: (sceneId, ambientSound) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, ambientSound } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  updateSplitSceneSoundEffects: (sceneId, soundEffects) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId ? { ...scene, soundEffects } : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
  },

  // Update scene-library linkage for the first frame
  updateSplitSceneReference: (sceneId, sceneLibraryId, referenceImage) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene =>
      scene.id === sceneId
        ? { ...scene, sceneLibraryId, sceneReferenceImage: referenceImage }
        : scene
    );
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
    });
    console.log('[DirectorStore] Updated scene reference for shot', sceneId, ':', sceneLibraryId);
  },

  // Generic field-update helper used by inline editing
  updateSplitSceneField: (sceneId, field, value) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const updated = project.splitScenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      if (field === 'videoPrompt') {
        const parts = splitVideoPromptVoiceOver(String(value ?? ''));
        return {
          ...scene,
          videoPrompt: parts.videoPrompt,
          voiceOver: parts.voiceOver || cleanVoiceOverText(scene.voiceOver),
          voiceOverSynced: false,
        };
      }
      if (field === 'voiceOver') {
        return { ...scene, voiceOver: cleanVoiceOverText(String(value ?? '')), voiceOverSynced: false };
      }
      return { ...scene, [field]: value };
    });
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: updated },
      },
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
        voiceOverSynced: true,
      };
    });

    if (synced > 0) {
      set({
        projects: {
          ...projects,
          [activeProjectId]: { ...project, splitScenes: updated },
        },
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
        voiceOverSynced: false,
      };
    });

    if (unsynced > 0) {
      set({
        projects: {
          ...projects,
          [activeProjectId]: { ...project, splitScenes: updated },
        },
      });
    }
    return unsynced;
  },
  
  deleteSplitScene: (sceneId) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const remaining = project.splitScenes.filter(s => s.id !== sceneId);
    const renumbered = remaining.map((s, idx) => ({ ...s, id: idx }));
    set({
      projects: {
        ...projects,
        [activeProjectId]: { ...project, splitScenes: renumbered },
      },
    });
    console.log('[DirectorStore] Deleted split scene', sceneId, 'remaining:', renumbered.length);
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
          storyboardConfig: { ...project.storyboardConfig, ...partialConfig },
        },
      },
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
            ...(project.screenplayDraft || defaultScreenplayDraft),
            ...partialDraft,
            updatedAt: Date.now(),
          },
        },
      },
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
            updatedAt: Date.now(),
          },
        },
      },
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
            ...(project.editorPrefs || defaultEditorPrefs),
            ...partialPrefs,
          },
        },
      },
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
          storyboardStatus: 'editing',
          storyboardError: null,
          splitScenes: [],
        },
      },
    });
    console.log('[DirectorStore] Reset storyboard state for project', activeProjectId);
  },

  // Mode 2: Add scenes from script directly (skip storyboard, generate images individually)
  addScenesFromScript: (scenes) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const splitScenes = project?.splitScenes || [];
    const startId = splitScenes.length > 0 ? Math.max(...splitScenes.map(s => s.id)) + 1 : 0;
    
    const newScenes: SplitScene[] = scenes.map((scene, index) => {
      const voiceFields = normalizeSplitSceneVoiceFields({
        videoPrompt: scene.videoPrompt || scene.promptEn || '',
        voiceOver: scene.voiceOver,
      });

      return {
        id: startId + index,
        sceneName: scene.sceneName || '',
        sceneLocation: scene.sceneLocation || '',
        imageDataUrl: '',
        imageHttpUrl: null,
        width: 0,
        height: 0,
        // Two-layer prompt system: prefer dedicated layered prompts.
        imagePrompt: scene.imagePrompt || scene.promptEn || '',
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        voiceOverSynced: false,
        videoLength: normalizeVideoLength(scene.videoLength),
        row: 0,
        col: 0,
        sourceRect: { x: 0, y: 0, width: 0, height: 0 },
        characterIds: scene.characterIds || [],
        characterNames: scene.characterNames || [],
        ambientSound: scene.ambientSound || '',
        soundEffects: scene.soundEffects || [],
        soundEffectText: scene.soundEffectText || '',
        dialogue: scene.dialogue || '',
        // Audio toggles default to enabled, except background music which defaults to disabled.
        audioAmbientEnabled: true,
        audioSfxEnabled: true,
        audioDialogueEnabled: true,
        audioBgmEnabled: false,
        backgroundMusic: scene.backgroundMusic || '',
        // Scene-library associations (auto-matched when available)
        sceneLibraryId: scene.sceneLibraryId,
        sceneReferenceImage: scene.sceneReferenceImage,
        ref_image: normalizeRefImageIndexes((scene as any).ref_image ?? (scene as any).refImage),
        imageStatus: 'idle' as const,
        imageProgress: 0,
        imageError: null,
        videoStatus: 'idle' as const,
        videoProgress: 0,
        videoUrl: null,
        videoError: null,
        videoMediaId: null,
        sourceShotId: scene.sourceShotId,
        sourceShotIndex: scene.sourceShotIndex ?? startId + index + 1,
        // Episode scope
        sourceEpisodeIndex: scene.sourceEpisodeIndex,
        sourceEpisodeId: scene.sourceEpisodeId,
      };
    });
    
    // Initialize calibratedStyleId from the current visualStyleId so newly added shots retain the calibration baseline.
    const currentConfig = project.storyboardConfig;
    const calibratedUpdate = currentConfig.visualStyleId && !currentConfig.calibratedStyleId
      ? { storyboardConfig: { ...currentConfig, calibratedStyleId: currentConfig.visualStyleId } }
      : {};

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...project,
          ...calibratedUpdate,
          splitScenes: [...splitScenes, ...newScenes],
          storyboardStatus: 'editing',
        },
      },
    });
    
    console.log('[DirectorStore] Added', newScenes.length, 'scenes from script, total:', splitScenes.length + newScenes.length);
  },

  // Add a blank shot for manual workflows (upload image, fill prompts, generate manually)
  addBlankSplitScene: () => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    const project = projects[activeProjectId];
    const splitScenes = project?.splitScenes || [];
    const newId = splitScenes.length > 0 ? Math.max(...splitScenes.map(s => s.id)) + 1 : 0;

    const blankScene: SplitScene = {
      id: newId,
      sceneName: `Blank Shot ${newId + 1}`,
      sceneLocation: '',
      imageDataUrl: '',
      imageHttpUrl: null,
      width: 0,
      height: 0,
      imagePrompt: '',
      videoPrompt: '',
      voiceOver: '',
      voiceOverSynced: false,
      videoLength: 4,
      row: 0,
      col: 0,
      sourceRect: { x: 0, y: 0, width: 0, height: 0 },
      characterIds: [],
      ambientSound: '',
      soundEffects: [],
      soundEffectText: '',
      dialogue: '',
      audioAmbientEnabled: true,
      audioSfxEnabled: true,
      audioDialogueEnabled: true,
      audioBgmEnabled: false,
      backgroundMusic: '',
      imageStatus: 'idle',
      imageProgress: 0,
      imageError: null,
      videoStatus: 'idle',
      videoProgress: 0,
      videoUrl: null,
      videoError: null,
      videoMediaId: null,
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...project,
          splitScenes: [...splitScenes, blankScene],
          storyboardStatus: 'editing',
        },
      },
    });

    console.log('[DirectorStore] Added blank scene, id:', newId, 'total:', splitScenes.length + 1);
  },

  resetInflightStatuses: () => {
    const inflightAV = new Set<GenerationStatus>(['queued', 'uploading', 'generating']);
    const inflightStoryboard = new Set<StoryboardStatus>(['generating', 'splitting']);

    const { projects } = get();
    let mutated = false;
    const nextProjects: Record<string, DirectorProjectData> = {};

    const projectEntries = Object.entries(projects) as Array<[string, DirectorProjectData]>;
    for (const [pid, proj] of projectEntries) {
      let projChanged = false;

      const nextScenes = proj.splitScenes.map((s) => {
        const updates: Partial<SplitScene> = {};
        if (inflightAV.has(s.imageStatus)) {
          updates.imageStatus = 'idle';
          updates.imageProgress = 0;
          updates.imageError = null;
        }
        if (inflightAV.has(s.videoStatus)) {
          updates.videoStatus = 'idle';
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
        nextStoryboardStatus = nextScenes.length > 0
          ? 'editing'
          : (proj.storyboardImage ? 'preview' : 'idle');
        nextStoryboardError = null;
        projChanged = true;
      }

      if (projChanged) {
        mutated = true;
        nextProjects[pid] = {
          ...proj,
          splitScenes: nextScenes,
          storyboardStatus: nextStoryboardStatus,
          storyboardError: nextStoryboardError,
        };
      } else {
        nextProjects[pid] = proj;
      }
    }

    if (mutated) set({ projects: nextProjects });
  },

  }),
  {
      name: 'longdd-director-store',
      storage: createJSONStorage(() => createProjectScopedStorage('director')),
      partialize: (state) => {
        // Helper: strip base64 data from a string field (keep local-image:// and https://)
        const stripBase64 = (val: string | null | undefined): string | null | undefined => {
          if (!val) return val;
          if (typeof val === 'string' && val.startsWith('data:')) return '';
          return val;
        };

        // Strip base64 from SplitScene to avoid 100MB+ JSON persistence
        const stripScene = (s: SplitScene): SplitScene => ({
          ...s,
          imageDataUrl: (stripBase64(s.imageDataUrl) ?? '') as string,
          sceneReferenceImage: stripBase64(s.sceneReferenceImage) as string | undefined,
        });

        const pid = state.activeProjectId;
        
        // Only serialize the active project's data (not all projects)
        let projectData = null;
        if (pid && state.projects[pid]) {
          const proj = state.projects[pid];
          projectData = {
            ...proj,
            storyboardImage: (stripBase64(proj.storyboardImage) ?? null) as string | null,
            splitScenes: proj.splitScenes.map(stripScene),
          };
        }

        return {
          activeProjectId: pid,
          projectData,
        };
      },
      merge: (persisted: any, current: any) => {
        if (!persisted) return current;
        
        // Legacy format: has `projects` as Record (from old monolithic file)
        if (persisted.projects && typeof persisted.projects === 'object') {
          const normalizedProjects: Record<string, DirectorProjectData> = {};
          for (const [projectId, projectData] of Object.entries(persisted.projects)) {
            normalizedProjects[projectId] = normalizeDirectorProjectData(projectData);
          }
          return {
            ...current,
            ...persisted,
            projects: normalizedProjects,
          };
        }
        
        // New per-project format: has `projectData` for single project
        const { activeProjectId: pid, projectData } = persisted;
        const updates: any = { ...current };
        if (pid) updates.activeProjectId = pid;
        if (pid && projectData) {
          updates.projects = { ...current.projects, [pid]: normalizeDirectorProjectData(projectData) };
        }
        return updates;
      },
    }
  )
);

// ==================== Selectors ====================

/**
 * Get current active project data (for reading splitScenes, storyboardImage, etc.)
 */
export const useActiveDirectorProject = (): DirectorProjectData | null => {
  return useDirectorStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projects[state.activeProjectId] || null;
  });
};


