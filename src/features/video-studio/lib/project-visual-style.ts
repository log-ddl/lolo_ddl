import { useDirectorStore } from "@/features/video-studio/stores/director-store";
import { useScriptStore } from "@/features/video-studio/stores/script-store";
import "@/features/video-studio/stores/custom-style-store";
import {
  DEFAULT_STYLE_ID,
  getStyleById,
} from "@/features/video-studio/lib/constants/visual-styles";

export interface ProjectVisualStyleSnapshot {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
}

/** Resolve and snapshot the style belonging to a specific project. */
export function getProjectVisualStyleSnapshot(projectId?: string): ProjectVisualStyleSnapshot {
  const directorState = useDirectorStore.getState();
  const scriptState = useScriptStore.getState();
  const resolvedProjectId = projectId || directorState.activeProjectId || scriptState.activeProjectId || undefined;
  const styleId = (resolvedProjectId
    ? directorState.projects[resolvedProjectId]?.storyboardConfig?.visualStyleId
      || scriptState.projects[resolvedProjectId]?.styleId
    : undefined) || DEFAULT_STYLE_ID;
  const style = getStyleById(styleId) || getStyleById(DEFAULT_STYLE_ID);
  return {
    id: style?.id || DEFAULT_STYLE_ID,
    name: style?.name || 'None / Skill Defined',
    prompt: style?.prompt?.trim() || '',
    negativePrompt: style?.negativePrompt?.trim() || '',
  };
}

/**
 * Project-wide visual style. The Director selection is authoritative; the
 * Script value remains a compatibility fallback for older projects.
 */
export function useProjectVisualStyleId(): string {
  const directorStyleId = useDirectorStore((state) => {
    const projectId = state.activeProjectId;
    return projectId ? state.projects[projectId]?.storyboardConfig?.visualStyleId : undefined;
  });
  const scriptStyleId = useScriptStore((state) => {
    const projectId = state.activeProjectId;
    return projectId ? state.projects[projectId]?.styleId : undefined;
  });

  if (directorStyleId && getStyleById(directorStyleId)) return directorStyleId;
  if (scriptStyleId && getStyleById(scriptStyleId)) return scriptStyleId;
  return DEFAULT_STYLE_ID;
}

/** Persist a Director style selection to both project stores. */
export function setProjectVisualStyleId(styleId: string): boolean {
  const style = getStyleById(styleId);
  if (!style) return false;

  const directorState = useDirectorStore.getState();
  if (directorState.activeProjectId && directorState.projects[directorState.activeProjectId]) {
    directorState.setStoryboardConfig({
      visualStyleId: style.id,
      styleTokens: style.prompt ? [style.prompt] : [],
    });
  }

  const scriptState = useScriptStore.getState();
  if (scriptState.activeProjectId) {
    scriptState.setStyleId(scriptState.activeProjectId, style.id);
  }

  return true;
}
