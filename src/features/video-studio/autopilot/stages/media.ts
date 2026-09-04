/**
 * The three-phase media stage, run once per phase so the caller can checkpoint
 * between them: research real source imagery, generate the first frame of each
 * shot, then animate those frames into clips.
 *
 * Every phase is resumable — anything already on disk is detected up front and
 * skipped, and a shot whose video fails degrades to a still rather than failing
 * the job.
 */

import { getFeatureConfig } from '@/features/video-studio/lib/ai/feature-router';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { resolveFlowProjectBinding } from '@/features/video-studio/autopilot/flow-binding';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { resolveLaneCount, runOrdered } from '@/features/video-studio/lib/ai/lane-manager';
import { saveImageToLocal, saveVideoToLocal } from '@/features/video-studio/lib/image-storage';
import { DEFAULT_ASPECT_RATIO, DEFAULT_IMAGE_MODEL, safeFileName, skillAllowsRealImageResearch } from '../prompts';
import { downloadRealImage } from '../real-media-search';
import type { AutopilotJob } from '../types';
import {
  runGenerationWithRetries,
  runGoogleFlowQueueOrdered,
  type CharacterReference,
  type EngineContext,
  type MediaPhase,
  type PendingShot,
  type PlannedShot,
  type SceneReference,
} from '../engine-shared';

export async function runMediaStage(
  ctx: EngineContext,
  job: AutopilotJob,
  shots: PlannedShot[],
  characters: CharacterReference[],
  scenes: SceneReference[],
  signal: AbortSignal,
  untilPhase: MediaPhase = 'videos',
): Promise<PendingShot[]> {
  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error('Google Flow runtime không có sẵn');
  const resolved = await resolveFlowProjectBinding(runtime, job.projectId);
  const flowProjectId = resolved.flowProjectId;
  const longddProjectId = resolved.longddProjectId;
  const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
  const imageModel = job.input.imageModel || DEFAULT_IMAGE_MODEL;
  const videoModel = job.input.videoModel || getFeatureConfig('video_generation')?.model || 'Veo_3.1-Fast';
  const allowRealImageResearch = skillAllowsRealImageResearch(job.input.skill)
    || job.input.importedPlan?.allowRealImageResearch === true
    || job.input.importedPlan?.shots.some((shot) => Boolean(shot.realImageQuery?.trim())) === true;
  const existingByIndex = new Map((job.mediaOutputs || []).map((item) => [item.index, item]));
  const mediaFiles = useMediaStore.getState().mediaFiles;
  const resolveMediaUrl = (mediaId: string | undefined, fallbackPath: string | undefined): string | undefined => {
    const entry = mediaId ? mediaFiles.find((media) => media.id === mediaId) : undefined;
    return entry?.url || fallbackPath;
  };
  const pending: PendingShot[] = await Promise.all(shots.map(async (shot) => {
    const existing = existingByIndex.get(shot.index);
    const imagePath = await ctx.isImageAvailable(resolveMediaUrl(existing?.imageMediaId, existing?.imagePath))
      ? resolveMediaUrl(existing?.imageMediaId, existing?.imagePath)!
      : '';
    const baseImagePath = await ctx.isImageAvailable(existing?.baseImagePath) ? existing!.baseImagePath! : '';
    const videoPath = (await ctx.probeMedia(resolveMediaUrl(existing?.videoMediaId, existing?.videoPath))) > 0
      ? resolveMediaUrl(existing?.videoMediaId, existing?.videoPath)!
      : '';
    const realImageAvailable = allowRealImageResearch
      && await ctx.isImageAvailable(resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath));
    return {
      shot,
      baseImagePath,
      imagePath,
      videoPath,
      imageMediaId: existing?.imageMediaId,
      videoMediaId: existing?.videoMediaId,
      realImageMediaId: existing?.realImageMediaId,
      realImageSearchCompleted: !allowRealImageResearch || existing?.realImageSearchCompleted === true,
      researchStatus: !allowRealImageResearch || !shot.realImageQuery
        ? 'skipped'
        : realImageAvailable
          ? 'completed'
          : existing?.realImageSearchCompleted
            ? 'skipped'
            : 'idle',
      imageStatus: imagePath ? 'completed' : 'idle',
      videoStatus: videoPath ? 'completed' : existing?.videoStatus === 'skipped' ? 'skipped' : 'idle',
      realImage: allowRealImageResearch && realImageAvailable && existing?.realImagePath ? {
        query: existing.realImageQuery || shot.realImageQuery || '',
        title: existing.realImageTitle || existing.realImageQuery || 'Researched image',
        imageUrl: resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath)!,
        sourceUrl: existing.realImageSourceUrl || '',
        localPath: resolveMediaUrl(existing?.realImageMediaId, existing?.realImagePath)!,
      } : undefined,
    };
  }));
  const characterByName = new Map(characters.map((character) => [character.name.toLocaleLowerCase(), character]));
  const sceneByName = new Map(scenes.map((scene) => [scene.name.toLocaleLowerCase(), scene]));
  const laneSettings = useVideoStudioSettingsStore.getState().maxStudioLanes;
  const retryAttempts = Math.max(
    0,
    Math.floor(laneSettings.generationRetryAttempts ?? 1),
  );
  const visualStyleLine = job.visualStylePrompt
    ? `Mandatory project visual style for this frame: ${job.visualStylePrompt}.`
    : '';
  ctx.log(job.id, 'media', `Google Flow project ${flowProjectId}; model video ${videoModel}`);
  const syncMediaOutputs = () => {
    ctx.updateJob(job.id, {
      mediaOutputs: pending.map((item) => ({
        index: item.shot.index,
        startMs: item.shot.startMs,
        endMs: item.shot.endMs,
        characterNames: item.shot.characterNames || [],
        baseImagePath: item.baseImagePath || undefined,
        imagePath: item.imagePath,
        videoPath: item.videoPath,
        imageMediaId: item.imageMediaId,
        videoMediaId: item.videoMediaId,
        realImageMediaId: item.realImageMediaId,
        realImagePath: item.realImage?.localPath,
        realImageSourceUrl: item.realImage?.sourceUrl,
        realImageTitle: item.realImage?.title,
        realImageQuery: allowRealImageResearch ? item.realImage?.query || item.shot.realImageQuery : undefined,
        realImageSearchCompleted: item.realImageSearchCompleted,
        researchStatus: item.researchStatus,
        imageStatus: item.imageStatus,
        videoStatus: item.videoStatus,
      })),
    });
  };
  syncMediaOutputs();

  // ========== Phase 1/3: research real source imagery ==========
  const researchedShots = allowRealImageResearch ? pending.filter((item) => item.shot.realImageQuery) : [];
  const missingResearch = researchedShots.filter((item) => !item.realImage && !item.realImageSearchCompleted);
  ctx.log(job.id, 'media', `Pha 1/3: tìm ảnh thật trước cho ${missingResearch.length}/${researchedShots.length} shot cần tư liệu`);
  let completedResearch = researchedShots.length - missingResearch.length;
  missingResearch.forEach((item) => { item.researchStatus = 'queued'; });
  syncMediaOutputs();
  await runOrdered(missingResearch, await resolveLaneCount('image', 'googleflow'), async (item) => {
    if (signal.aborted) throw new Error('aborted');
    item.researchStatus = 'generating';
    syncMediaOutputs();
    try {
      item.realImage = await downloadRealImage({
        query: item.shot.realImageQuery || '',
        filename: `${safeFileName(job.title)}_real_${item.shot.index}_${Date.now()}`,
        signal,
      }) || undefined;
      item.realImageSearchCompleted = true;
      if (item.realImage) {
        item.researchStatus = 'completed';
        const mediaStore = useMediaStore.getState();
        item.realImageMediaId = mediaStore.addMediaFromUrl({
          url: item.realImage.localPath,
          name: `${job.title} — Tư liệu shot ${item.shot.index}`,
          type: 'image',
          source: 'upload',
          folderId: mediaStore.getOrCreateCategoryFolder('upload'),
          projectId: job.projectId,
        });
        ctx.log(job.id, 'media', `[tư liệu shot ${item.shot.index}] ${item.realImage.title}`);
      } else {
        item.researchStatus = 'skipped';
        ctx.log(job.id, 'media', `[tư liệu shot ${item.shot.index}] không tìm thấy — frame sẽ tạo không có ảnh thật`);
      }
    } catch (error) {
      if (signal.aborted) {
        item.researchStatus = 'idle';
        throw error;
      }
      item.researchStatus = 'failed';
      ctx.log(job.id, 'media', `[tư liệu shot ${item.shot.index}] lỗi tạm thời, lần resume sẽ thử lại: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completedResearch += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, 'research', researchedShots.length > 0 ? Math.round((completedResearch / researchedShots.length) * 100) : 100);
    }
  }, signal);
  if (researchedShots.length === 0) ctx.stageProgress(job.id, 'research', 100);
  if (untilPhase === 'research') return pending;

  // ========== Phase 2/3: generate the first frame of each shot ==========
  const missingImages = pending.filter((item) => !item.imagePath);
  ctx.log(job.id, 'media', `Pha 2/3: tạo ${missingImages.length}/${shots.length} frame AI; ảnh thật có sẵn được đưa vào reference ngay từ đầu`);
  let completedImages = shots.length - missingImages.length;
  missingImages.forEach((item) => { item.imageStatus = 'queued'; });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, 'media', 'image', missingImages, signal, async (item) => {
    if (signal.aborted) throw new Error('aborted');
    const sceneRef = sceneByName.get(String(item.shot.sceneRefId || '').trim().toLocaleLowerCase());
    const reservedReferenceSlots = (sceneRef?.imagePath ? 1 : 0) + (item.realImage ? 1 : 0);
    const characterRefs = (item.shot.characterNames || [])
      .map((name) => characterByName.get(name.toLocaleLowerCase()))
      .filter((character): character is CharacterReference => !!character?.imagePath)
      .slice(0, Math.max(0, 4 - reservedReferenceSlots));
    const references: Array<{ source: string; provider: 'googleflow' }> = [];
    if (sceneRef?.imagePath) references.push({ source: sceneRef.imagePath, provider: 'googleflow' });
    references.push(...characterRefs.map((character) => ({ source: character.imagePath, provider: 'googleflow' as const })));
    if (item.realImage) references.push({ source: item.realImage.localPath, provider: 'googleflow' as const });
    const sceneLine = sceneRef?.imagePath
      ? `Use the first supplied reference as the authoritative environment for scene "${sceneRef.name}". Preserve its architecture, layout, palette and recurring props while applying the shot composition and camera angle. `
      : '';
    const identityLine = characterRefs.length > 0
      ? `Preserve the supplied character identities exactly. Visible characters: ${characterRefs.map((character) => character.name).join(', ')}. `
      : '';
    const researchLine = item.realImage
      ? 'Use the final supplied reference as factual source imagery. Integrate it naturally into the composition where it best supports the visual hierarchy and story. Keep it clearly recognizable and preserve its factual content and identity. '
      : '';
    try {
      const imageResult = await runGenerationWithRetries(
          retryAttempts,
          signal,
          (attempt) => googleFlowProvider.generateImage({
            projectId: longddProjectId,
            sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
            prompt: `${sceneLine}${identityLine}${researchLine}${item.shot.imagePrompt || ''} ${visualStyleLine}`.trim(),
            model: imageModel,
            aspectRatio,
            references,
            taskId: `ap-img-${job.id}-${item.shot.index - 1}-try-${attempt}`,
            onSubmitted: () => {
              item.imageStatus = 'generating';
              syncMediaOutputs();
            },
            signal,
          }),
          (nextAttempt, totalAttempts, error) => {
            item.imageStatus = 'queued';
            syncMediaOutputs();
            ctx.log(job.id, 'media', `Ảnh shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
          },
        );
      const source = imageResult.localUrl || imageResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về ảnh');
      item.imagePath = await saveImageToLocal(source, 'shots', `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.png`);
      item.imageStatus = 'completed';
      const mediaStore = useMediaStore.getState();
      item.imageMediaId = mediaStore.addMediaFromUrl({
        url: item.imagePath,
        name: `${job.title} — Shot ${item.shot.index}`,
        type: 'image',
        source: 'ai-image',
        folderId: mediaStore.getOrCreateCategoryFolder('ai-image'),
        projectId: job.projectId,
      });
      ctx.log(job.id, 'media', `[ảnh ${item.shot.index}/${shots.length}] xong${item.realImage ? ' — có reference ảnh thật' : ''}${characterRefs.length ? ` — ${characterRefs.length} character ref` : ''}`);
    } catch (error) {
      if (signal.aborted) {
        item.imageStatus = 'idle';
        throw error;
      }
      item.imageStatus = 'failed';
      ctx.log(job.id, 'media', `Ảnh shot ${item.shot.index} thất bại: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      completedImages += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, 'images', Math.round((completedImages / shots.length) * 100));
    }
  });
  ctx.stageProgress(job.id, 'images', 100);
  const missingFrames = pending.filter((item) => !item.imagePath);
  if (missingFrames.length > 0) {
    throw new Error(`Còn ${missingFrames.length} shot chưa có ảnh (${missingFrames.map((item) => item.shot.index).join(', ')}). Import ảnh hoặc bấm Tiếp tục để thử lại.`);
  }
  if (untilPhase === 'images') return pending;

  // ========== Phase 3/3: animate frames into clips ==========
  // Shots with an empty videoPrompt are intentionally static: skip AI video and keep
  // the still. The render stage decides whether that still also gets a Ken Burns move.
  pending.forEach((item) => {
    if (item.imagePath && !item.videoPath && item.videoStatus !== 'skipped' && !item.shot.videoPrompt?.trim()) {
      item.videoStatus = 'skipped';
      ctx.log(job.id, 'media', `Shot ${item.shot.index} không có videoPrompt — giữ ảnh tĩnh`);
    }
  });
  syncMediaOutputs();
  const missingVideos = pending.filter((item) => item.imagePath && !item.videoPath && item.videoStatus !== 'skipped');
  ctx.log(job.id, 'media', `Pha 3/3: tạo ${missingVideos.length}/${shots.length} video còn thiếu từ frame cuối`);
  let completedVideos = shots.length - missingVideos.length;
  missingVideos.forEach((item) => { item.videoStatus = 'queued'; });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, 'media', 'video', missingVideos, signal, async (item) => {
    if (signal.aborted) throw new Error('aborted');
    try {
      const videoResult = await runGenerationWithRetries(
          retryAttempts,
          signal,
          (attempt) => googleFlowProvider.generateVideo({
            projectId: longddProjectId,
            sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
            prompt: `${item.shot.videoPrompt || ''} Preserve the exact visual style, palette, line quality, materials, and character identity of the supplied first frame.`.trim(),
            model: videoModel,
            aspectRatio,
            duration: item.shot.videoLength,
            startImage: { source: item.imagePath, provider: 'googleflow', flowProjectId },
            taskId: `ap-vid-${job.id}-${item.shot.index - 1}-try-${attempt}`,
            onSubmitted: () => {
              item.videoStatus = 'generating';
              syncMediaOutputs();
            },
            signal,
          }),
          (nextAttempt, totalAttempts, error) => {
            item.videoStatus = 'queued';
            syncMediaOutputs();
            ctx.log(job.id, 'media', `Video shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
          },
        );
      const source = videoResult.localUrl || videoResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về video');
      item.videoPath = await saveVideoToLocal(source, `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.mp4`);
      item.videoStatus = 'completed';
      const mediaStore = useMediaStore.getState();
      item.videoMediaId = mediaStore.addMediaFromUrl({
        url: item.videoPath,
        name: `${job.title} — Shot ${item.shot.index}`,
        type: 'video',
        source: 'ai-video',
        thumbnailUrl: item.imagePath,
        duration: (item.shot.endMs - item.shot.startMs) / 1000,
        folderId: mediaStore.getOrCreateCategoryFolder('ai-video'),
        projectId: job.projectId,
      });
      ctx.log(job.id, 'media', `[video ${item.shot.index}/${shots.length}] xong`);
    } catch (err) {
      if (signal.aborted) {
        item.videoStatus = 'idle';
        throw err;
      }
      item.videoStatus = 'skipped';
      ctx.log(job.id, 'media', `Video shot ${item.shot.index} thất bại — dùng ảnh fallback: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      completedVideos += 1;
      syncMediaOutputs();
      ctx.stageProgress(job.id, 'videos', Math.round((completedVideos / shots.length) * 100));
    }
  });
  ctx.stageProgress(job.id, 'videos', 100);
  const videoCount = pending.filter((item) => item.videoPath).length;
  const imageCount = pending.filter((item) => item.imagePath && !item.videoPath).length;
  ctx.log(job.id, 'media', `Checkpoint media: ${videoCount} video, ${imageCount} shot còn thiếu video, ${pending.length - videoCount - imageCount} shot còn thiếu frame`);
  if (imageCount > 0) ctx.log(job.id, 'media', `${imageCount} shot chuyển sang ảnh tĩnh (do videoPrompt trống hoặc video lỗi); tiếp tục render bình thường.`);
  return pending;
}
