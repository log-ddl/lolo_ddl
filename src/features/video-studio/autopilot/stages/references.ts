/**
 * Generates the reusable reference images that keep a film visually consistent:
 * one per recurring character and one per recurring location. Both stages reuse
 * an existing library image when it matches the job's visual style, so resumes
 * and re-runs never pay to regenerate a reference that is already on disk.
 */

import { getFeatureConfig } from '@/features/video-studio/lib/ai/feature-router';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { resolveFlowProjectBinding } from '@/features/video-studio/autopilot/flow-binding';
import { useCharacterLibraryStore } from '@/features/video-studio/stores/character-library-store';
import { useSceneStore } from '@/features/video-studio/stores/scene-store';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { saveImageToLocal } from '@/features/video-studio/lib/image-storage';
import { DEFAULT_ASPECT_RATIO, DEFAULT_IMAGE_MODEL, safeFileName } from '../prompts';
import type { AutopilotCharacterPlan, AutopilotJob, AutopilotScenePlan } from '../types';
import {
  runGoogleFlowQueueOrdered,
  type CharacterReference,
  type EngineContext,
  type SceneReference,
} from '../engine-shared';

export async function runCharactersStage(
  ctx: EngineContext,
  job: AutopilotJob,
  characters: AutopilotCharacterPlan[],
  signal: AbortSignal,
): Promise<CharacterReference[]> {
  ctx.stageProgress(job.id, 'characters', 0);
  if (characters.length === 0) {
    ctx.log(job.id, 'characters', 'Không có nhân vật cố định — bỏ qua ảnh tham chiếu nhân vật');
    ctx.stageProgress(job.id, 'characters', 100);
    return [];
  }

  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error('Google Flow runtime không có sẵn');
  const { longddProjectId } = await resolveFlowProjectBinding(runtime, job.projectId);
  const activeProjectId = job.projectId;
  const library = useCharacterLibraryStore.getState();
  const characterModel = getFeatureConfig('character_generation')?.model || DEFAULT_IMAGE_MODEL;
  const visualStyleLine = job.visualStylePrompt
    ? `Mandatory project visual style: ${job.visualStylePrompt}.`
    : '';
  let completed = 0;
  ctx.updateJob(job.id, { characterCount: characters.length });
  for (const character of characters) {
    const checkpoint = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === character.name.toLocaleLowerCase());
    ctx.updateCharacterOutput(job.id, character.name, { status: checkpoint?.imagePath ? 'completed' : 'queued' });
  }
  ctx.log(job.id, 'characters', `Tạo ${characters.length} ảnh tham chiếu nhân vật qua toàn bộ lane Flow...`);

  return runGoogleFlowQueueOrdered(ctx, job, 'characters', 'image', characters, signal, async (rawCharacter, index): Promise<CharacterReference> => {
    const name = String(rawCharacter.name || '').trim();
    const description = String(rawCharacter.description || '').trim();
    const characterPrompt = String(rawCharacter.characterPrompt || '').trim();
    const existing = useCharacterLibraryStore.getState().characters.find((character) =>
      character.projectId === activeProjectId && character.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    let characterId = existing?.id;
    if (!characterId) {
      characterId = library.addCharacter({
        name,
        description: description || undefined,
        characterPrompt,
        identityPrompt: characterPrompt,
        aspectRatio: '1:1',
        styleId: job.visualStyleId,
        projectId: activeProjectId,
        folderId: null,
        status: 'linked',
      });
    } else {
      library.updateCharacter(characterId, { description: description || undefined, characterPrompt, identityPrompt: characterPrompt, styleId: job.visualStyleId });
    }

    const checkpoint = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const existingMatchesStyle = !job.visualStylePrompt || existing?.styleId === job.visualStyleId;
    let imagePath = checkpoint?.imagePath || (existingMatchesStyle ? existing?.thumbnailUrl : '') || '';
    if (imagePath && !(await ctx.isImageAvailable(imagePath))) imagePath = '';
    try {
      if (!imagePath) {
        const prompt = `Single reusable character reference for a documentary. ${name}. ${characterPrompt}. ${description}. Centered full-body neutral pose, clearly visible construction and identity markers, isolated simple background, clean silhouette, no scenery, no typography, no watermark. ${visualStyleLine}`;
        const result = await googleFlowProvider.generateImage({
            projectId: longddProjectId,
            sceneId: `autopilot-character-${job.id}-${index}`,
            prompt,
            model: characterModel,
            aspectRatio: '1:1',
            taskId: `ap-char-${job.id}-${index}`,
            onSubmitted: () => ctx.updateCharacterOutput(job.id, name, { status: 'generating' }),
            signal,
          });
        const source = result.localUrl || result.remoteUrl || '';
        if (!source) throw new Error('Google Flow không trả về ảnh');
        imagePath = await saveImageToLocal(source, 'characters', `${name.replace(/[^a-zA-Z0-9À-ɏ]/g, '_')}_${Date.now()}.png`);
        library.updateCharacter(characterId, { thumbnailUrl: imagePath });
        ctx.log(job.id, 'characters', `[${index + 1}/${characters.length}] Đã tạo reference: ${name}`);
      } else {
        if (characterId) library.updateCharacter(characterId, { thumbnailUrl: imagePath });
        ctx.log(job.id, 'characters', `[${index + 1}/${characters.length}] Resume — dùng reference đã có: ${name}`);
      }
    } catch (error) {
      if (signal.aborted) throw error;
      ctx.log(job.id, 'characters', `Reference ${name} thất bại — shot vẫn tiếp tục không reference: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completed += 1;
      ctx.updateCharacterOutput(job.id, name, { imagePath, status: imagePath ? 'completed' : 'failed' });
      ctx.stageProgress(job.id, 'characters', Math.round((completed / characters.length) * 100));
    }
    return { name, description, characterPrompt, imagePath };
  });
}

export async function runScenesStage(
  ctx: EngineContext,
  job: AutopilotJob,
  scenes: AutopilotScenePlan[],
  signal: AbortSignal,
): Promise<SceneReference[]> {
  ctx.stageProgress(job.id, 'scenes', 0);
  if (scenes.length === 0) {
    ctx.log(job.id, 'scenes', 'Không có bối cảnh cố định — bỏ qua ảnh tham chiếu cảnh');
    ctx.stageProgress(job.id, 'scenes', 100);
    return [];
  }

  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error('Google Flow runtime không có sẵn');
  const { longddProjectId } = await resolveFlowProjectBinding(runtime, job.projectId);
  const activeProjectId = job.projectId;
  const sceneStore = useSceneStore.getState();
  const sceneModel = getFeatureConfig('scene_generation')?.model || job.input.imageModel || DEFAULT_IMAGE_MODEL;
  const sceneAspectRatio = (['1:1', '3:4', '4:3', '9:16', '16:9'] as const).find((value) => value === job.input.aspectRatio) || '16:9';
  const visualStyleLine = job.visualStylePrompt ? `Mandatory project visual style: ${job.visualStylePrompt}.` : '';
  let completed = 0;
  ctx.updateJob(job.id, { sceneCount: scenes.length });
  for (const scene of scenes) {
    const checkpoint = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === scene.name.toLocaleLowerCase());
    ctx.updateSceneOutput(job.id, scene.name, { status: checkpoint?.imagePath ? 'completed' : 'queued' });
  }
  ctx.log(job.id, 'scenes', `Tạo ${scenes.length} ảnh tham chiếu cảnh qua toàn bộ lane Flow...`);

  return runGoogleFlowQueueOrdered(ctx, job, 'scenes', 'image', scenes, signal, async (rawScene, index): Promise<SceneReference> => {
    const name = String(rawScene.name || '').trim();
    const description = String(rawScene.description || '').trim();
    const scenePrompt = String(rawScene.scenePrompt || '').trim();
    const currentStore = useSceneStore.getState();
    const existing = currentStore.scenes.find((scene) =>
      scene.projectId === activeProjectId && scene.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    let sceneId = existing?.id;
    if (!sceneId) {
      sceneId = sceneStore.addScene({
        name,
        description: description || undefined,
        time: '',
        atmosphere: '',
        aspectRatio: sceneAspectRatio,
        projectId: activeProjectId,
        scenePrompt,
        styleId: job.visualStyleId,
        folderId: null,
        status: 'linked',
      });
    } else {
      currentStore.updateScene(sceneId, {
        description: description || undefined,
        scenePrompt,
        styleId: job.visualStyleId,
        aspectRatio: sceneAspectRatio,
      });
    }

    const checkpoint = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const existingMatchesStyle = !job.visualStylePrompt || existing?.styleId === job.visualStyleId;
    let imagePath = checkpoint?.imagePath || (existingMatchesStyle ? existing?.referenceImage : '') || '';
    if (imagePath && !(await ctx.isImageAvailable(imagePath))) imagePath = '';
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
          onSubmitted: () => ctx.updateSceneOutput(job.id, name, { status: 'generating' }),
          signal,
        });
        const source = result.localUrl || result.remoteUrl || '';
        if (!source) throw new Error('Google Flow không trả về ảnh');
        imagePath = await saveImageToLocal(source, 'scenes', `${safeFileName(name)}_${Date.now()}.png`);
        currentStore.updateScene(sceneId, { referenceImage: imagePath });
        const mediaStore = useMediaStore.getState();
        mediaStore.addMediaFromUrl({
          url: imagePath,
          name: `${job.title} — Cảnh ${name}`,
          type: 'image',
          source: 'ai-image',
          folderId: mediaStore.getOrCreateCategoryFolder('ai-image'),
          projectId: job.projectId,
        });
        ctx.log(job.id, 'scenes', `[${index + 1}/${scenes.length}] Đã tạo reference cảnh: ${name}`);
      } else {
        currentStore.updateScene(sceneId, { referenceImage: imagePath });
        ctx.log(job.id, 'scenes', `[${index + 1}/${scenes.length}] Resume — dùng reference cảnh đã có: ${name}`);
      }
    } catch (error) {
      if (signal.aborted) throw error;
      ctx.log(job.id, 'scenes', `Reference cảnh ${name} thất bại — shot vẫn tiếp tục không có scene reference: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completed += 1;
      ctx.updateSceneOutput(job.id, name, { imagePath, status: imagePath ? 'completed' : 'failed' });
      ctx.stageProgress(job.id, 'scenes', Math.round((completed / scenes.length) * 100));
    }
    return { name, description, scenePrompt, imagePath };
  });
}
