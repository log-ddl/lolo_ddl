/**
 * Redo one shot's image or video without replaying the whole pipeline. Used by
 * the shot cards' regenerate buttons; goes through the same Google Flow queue
 * and retry policy as the batch media stage.
 */

import { getFeatureConfig } from '@/features/video-studio/lib/ai/feature-router';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { resolveFlowProjectBinding } from '@/features/video-studio/autopilot/flow-binding';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { saveImageToLocal, saveVideoToLocal } from '@/features/video-studio/lib/image-storage';
import { DEFAULT_ASPECT_RATIO, DEFAULT_IMAGE_MODEL, safeFileName } from '../prompts';
import type { AutopilotJob } from '../types';
import { MAX_IMAGE_REFERENCE_SLOTS, runGenerationWithRetries, type CharacterReference, type EngineContext } from '../engine-shared';

export async function runSingleShotRegeneration(
  ctx: EngineContext,
  job: AutopilotJob,
  shotIndex: number,
  kind: 'image' | 'video',
): Promise<void> {
  const controller = new AbortController();
  ctx.activeControllers.set(job.id, controller);
  const signal = controller.signal;
  const prevStatus = job.status;
  ctx.updateJob(job.id, { status: 'running', error: undefined, message: `Tạo lại ${kind === 'image' ? 'ảnh' : 'video'} shot ${shotIndex}` });
  try {
    const runtime = window.googleFlowRuntime;
    if (!runtime) throw new Error('Google Flow runtime không có sẵn');
    const resolved = await resolveFlowProjectBinding(runtime, job.projectId);
    const flowProjectId = resolved.flowProjectId;
    const longddProjectId = resolved.longddProjectId;
    const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
    const imageModel = job.input.imageModel || DEFAULT_IMAGE_MODEL;
    const videoModel = job.input.videoModel || getFeatureConfig('video_generation')?.model || 'Veo_3.1-Fast';
    const laneSettings = useVideoStudioSettingsStore.getState().maxStudioLanes;
    const retryAttempts = Math.max(0, Math.floor(laneSettings.generationRetryAttempts ?? 1));
    const visualStyleLine = job.visualStylePrompt ? `Visual style: ${job.visualStylePrompt}.` : '';

    // Find the target media output
    const mediaOutput = (job.mediaOutputs || []).find((item) => item.index === shotIndex);
    if (!mediaOutput) throw new Error(`Shot ${shotIndex} không tồn tại`);
    const shot = (job.plannedShots || []).find((s) => s.index === shotIndex);
    if (!shot) throw new Error(`Planned shot ${shotIndex} không tồn tại`);

    // Build references from existing character/scene data
    const characterByName = new Map((job.plannedCharacters || []).map((c) => {
      const output = job.characterOutputs?.find((o) => o.name.toLocaleLowerCase() === c.name.toLocaleLowerCase());
      return [c.name.toLocaleLowerCase(), { name: c.name, description: c.description, characterPrompt: c.characterPrompt, imagePath: output?.imagePath || '' }];
    }));
    const sceneByName = new Map((job.plannedScenes || []).map((s) => {
      const output = job.sceneOutputs?.find((o) => o.name.toLocaleLowerCase() === s.name.toLocaleLowerCase());
      return [s.name.toLocaleLowerCase(), { name: s.name, description: s.description, scenePrompt: s.scenePrompt, imagePath: output?.imagePath || '' }];
    }));

    const syncMediaOutputs = () => {
      ctx.updateJob(job.id, { mediaOutputs: [...(job.mediaOutputs || [])] });
    };

    if (kind === 'image') {
      // Regenerate image
      mediaOutput.imageStatus = 'queued';
      syncMediaOutputs();
      const sceneRef = sceneByName.get(String(shot.sceneRefId || '').trim().toLocaleLowerCase());
      const reservedReferenceSlots = (sceneRef?.imagePath ? 1 : 0) + (mediaOutput.realImagePath ? 1 : 0);
      const characterRefs = (shot.characterNames || [])
        .map((name) => characterByName.get(name.toLocaleLowerCase()))
        .filter((c): c is CharacterReference => !!c?.imagePath)
        .slice(0, Math.max(0, MAX_IMAGE_REFERENCE_SLOTS - reservedReferenceSlots));
      const references: Array<{ source: string; provider: 'googleflow' }> = [];
      if (sceneRef?.imagePath) references.push({ source: sceneRef.imagePath, provider: 'googleflow' });
      references.push(...characterRefs.map((c) => ({ source: c.imagePath, provider: 'googleflow' as const })));
      if (mediaOutput.realImagePath) references.push({ source: mediaOutput.realImagePath, provider: 'googleflow' as const });
      const sceneLine = sceneRef?.imagePath
        ? `Use the first supplied reference as the authoritative environment for scene "${sceneRef.name}". Preserve its architecture, layout, palette and recurring props while applying the shot composition and camera angle. `
        : '';
      const identityLine = characterRefs.length > 0
        ? `Preserve the supplied character identities exactly. Visible characters: ${characterRefs
            .map((c) => `${c.name}: ${c.characterPrompt || c.description}`)
            .join('; ')}. Use each description only for identity traits — ignore any pose, framing or background it mentions; the shot composition below wins. `
        : '';
      const researchLine = mediaOutput.realImagePath
        ? 'Use the final supplied reference as factual source imagery. Integrate it naturally into the composition where it best supports the visual hierarchy and story. Keep it clearly recognizable and preserve its factual content and identity. '
        : '';
      const imageResult = await runGenerationWithRetries(
        retryAttempts, signal,
        (attempt) => googleFlowProvider.generateImage({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${shot.index - 1}`,
          prompt: `${sceneLine}${identityLine}${researchLine}${shot.imagePrompt || ''} ${visualStyleLine}`.trim(),
          model: imageModel, aspectRatio, references,
          taskId: `ap-img-${job.id}-${shot.index - 1}-regen-${attempt}`,
          onSubmitted: () => { mediaOutput.imageStatus = 'generating'; syncMediaOutputs(); },
          signal,
        }),
        (nextAttempt, totalAttempts, error) => {
          mediaOutput.imageStatus = 'queued'; syncMediaOutputs();
          ctx.log(job.id, 'media', `Tạo lại ảnh shot ${shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        },
      );
      const source = imageResult.localUrl || imageResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về ảnh');
      mediaOutput.imagePath = await saveImageToLocal(source, 'shots', `${safeFileName(job.title)}_shot_${shot.index}_${Date.now()}.png`);
      mediaOutput.imageStatus = 'completed';
      const mediaStore = useMediaStore.getState();
      mediaOutput.imageMediaId = mediaStore.addMediaFromUrl({
        url: mediaOutput.imagePath, name: `${job.title} — Shot ${shot.index}`,
        type: 'image', source: 'ai-image',
        folderId: mediaStore.getOrCreateCategoryFolder('ai-image'), projectId: job.projectId,
      });
      ctx.log(job.id, 'media', `Tạo lại ảnh shot ${shot.index} xong`);
    } else {
      // Regenerate video
      if (!mediaOutput.imagePath) throw new Error(`Shot ${shotIndex} chưa có ảnh để tạo video`);
      mediaOutput.videoStatus = 'queued';
      syncMediaOutputs();
      const videoResult = await runGenerationWithRetries(
        retryAttempts, signal,
        (attempt) => googleFlowProvider.generateVideo({
          projectId: longddProjectId,
          sceneId: `autopilot-${job.id}-${shot.index - 1}`,
          prompt: `${shot.videoPrompt || ''} Preserve the exact visual style, palette, line quality, materials, and character identity of the supplied first frame.`.trim(),
          model: videoModel, aspectRatio, duration: shot.videoLength,
          startImage: { source: mediaOutput.imagePath, provider: 'googleflow', flowProjectId },
          taskId: `ap-vid-${job.id}-${shot.index - 1}-regen-${attempt}`,
          onSubmitted: () => { mediaOutput.videoStatus = 'generating'; syncMediaOutputs(); },
          signal,
        }),
        (nextAttempt, totalAttempts, error) => {
          mediaOutput.videoStatus = 'queued'; syncMediaOutputs();
          ctx.log(job.id, 'media', `Tạo lại video shot ${shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
        },
      );
      const source = videoResult.localUrl || videoResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về video');
      mediaOutput.videoPath = await saveVideoToLocal(source, `${safeFileName(job.title)}_shot_${shot.index}_${Date.now()}.mp4`);
      mediaOutput.videoStatus = 'completed';
      const mediaStore = useMediaStore.getState();
      mediaOutput.videoMediaId = mediaStore.addMediaFromUrl({
        url: mediaOutput.videoPath, name: `${job.title} — Shot ${shot.index}`,
        type: 'video', source: 'ai-video', thumbnailUrl: mediaOutput.imagePath,
        duration: (shot.endMs - shot.startMs) / 1000,
        folderId: mediaStore.getOrCreateCategoryFolder('ai-video'), projectId: job.projectId,
      });
      ctx.log(job.id, 'media', `Tạo lại video shot ${shot.index} xong`);
    }
    ctx.updateJob(job.id, { mediaOutputs: [...(job.mediaOutputs || [])] });
    // Re-add completed steps if all shots now have the regenerated asset
    const allMedia = job.mediaOutputs || [];
    if (kind === 'image' && allMedia.every((m) => m.imagePath)) {
      ctx.completeStep(job, 'images');
    }
    if (kind === 'video' && allMedia.every((m) => m.videoPath || m.videoStatus === 'skipped')) {
      ctx.completeStep(job, 'videos');
    }
    ctx.updateJob(job.id, { status: prevStatus === 'done' && allMedia.every((m) => m.imagePath && (m.videoPath || m.videoStatus === 'skipped')) ? 'done' : 'paused', outputVideoPath: undefined, message: `Đã tạo lại ${kind === 'image' ? 'ảnh' : 'video'} shot ${shotIndex}` });
  } catch (error) {
    if (signal.aborted) {
      ctx.updateJob(job.id, { status: 'paused', message: 'Đã dừng' });
    } else {
      const msg = error instanceof Error ? error.message : String(error);
      ctx.log(job.id, 'error', `Tạo lại shot ${shotIndex} thất bại: ${msg}`);
      ctx.updateJob(job.id, { status: prevStatus === 'done' ? 'done' : 'paused', error: msg, message: `Lỗi tạo lại shot ${shotIndex}` });
    }
  } finally {
    ctx.activeControllers.delete(job.id);
  }
}
