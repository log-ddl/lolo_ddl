import { getStyleById } from "@/features/video-studio/lib/constants/visual-styles";
import type { Scene } from "@/features/video-studio/stores/scene-store";

type ScenePromptInput = Partial<Scene> & { styleId?: string };

export function getScenePromptSource(scene: ScenePromptInput): string {
  return scene.scenePrompt?.trim()
    || scene.description?.trim()
    || scene.name?.trim()
    || '';
}

export function buildSceneImagePrompt(scene: ScenePromptInput): string {
  const stylePreset = scene.styleId ? getStyleById(scene.styleId) : null;
  return [getScenePromptSource(scene), stylePreset?.prompt]
    .filter(Boolean)
    .join(', ');
}
