/**
 * The three-phase media stage, run once per phase so the caller can checkpoint
 * between them: research real source imagery, generate the first frame of each
 * shot, then animate those frames into clips.
 *
 * Every phase is resumable — anything already on disk is detected up front and
 * skipped, and a shot whose video fails degrades to a still rather than failing
 * the job.
 */

import { googleFlowBoundModel } from '@/features/video-studio/lib/ai/media-routing';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { resolveFlowProjectBinding } from '@/features/video-studio/autopilot/flow-binding';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { resolveLaneCount, runOrdered } from '@/features/video-studio/lib/ai/lane-manager';
import { saveImageToLocal, saveVideoToLocal } from '@/features/video-studio/lib/image-storage';
import { stripFlowErrorCode } from '@/features/video-studio/lib/ai/google-flow-errors';
import { DEFAULT_ASPECT_RATIO, DEFAULT_IMAGE_MODEL, safeFileName, skillAllowsRealImageResearch } from '../prompts';
import { buildModelChain, runWithModelFallback } from '../model-fallback';
import { buildAccountRouting, listKnownOwnerScopeIds } from '../account-routing';
import { downloadRealImage } from '../real-media-search';
import type { AutopilotJob } from '../types';
import {
  MAX_IMAGE_REFERENCE_SLOTS,
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
  // Same head the reference images use, so one setting drives every image. A
  // binding on another provider is ignored: this stage only talks to Flow.
  const imageModel = job.input.imageModel || googleFlowBoundModel('character_generation') || DEFAULT_IMAGE_MODEL;
  const videoModel = job.input.videoModel || googleFlowBoundModel('video_generation') || 'Veo_3.1-Fast';
  // Model chain + account allowlist are frozen into the job when it is created, so
  // editing Settings mid-run cannot change what a running job is allowed to use.
  const routing = buildAccountRouting({
    connectedOwnerScopeIds: await listKnownOwnerScopeIds(runtime),
    flowAccounts: job.input.flowAccounts,
    accountVideoModels: job.input.accountVideoModels,
    accountImageModels: job.input.accountImageModels,
    routingMode: job.input.routingMode,
  });
  const imageModelChain = buildModelChain(imageModel, job.input.imageModelFallbacks);
  const requestedVideoChain = buildModelChain(videoModel, job.input.videoModelFallbacks);
  // A video model no enabled account owns answers 404, which no retry and no
  // account failover can fix — drop it before it eats an attempt.
  const videoModelChain = routing.filterVideoChain(requestedVideoChain);
  const skippedVideoModels = requestedVideoChain.filter((model) => !videoModelChain.includes(model));
  if (skippedVideoModels.length) {
    ctx.log(job.id, 'media', `Bỏ qua model video ${skippedVideoModels.join(', ')}: không tài khoản nào đang bật có model này`);
  }
  // Which accounts a model may run on depends on the routing mode, so it is asked
  // per model rather than resolved once: in quality mode only the accounts that
  // run this exact model, in speed mode every account still switched on.
  const imageAccountsFor = (model: string) => routing.accountsFor('image', model);
  const imageModelChains = routing.modelChainsFor('image', imageModelChain);
  const videoModelChains = routing.modelChainsFor('video', videoModelChain);
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
      // Keep the previous failure visible while resuming, but drop it once the asset exists.
      researchError: realImageAvailable ? undefined : existing?.researchError,
      imageError: imagePath ? undefined : existing?.imageError,
      videoError: videoPath ? undefined : existing?.videoError,
      imageTaskId: existing?.imageTaskId,
      videoTaskId: existing?.videoTaskId,
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
        researchError: item.researchError,
        imageError: item.imageError,
        videoError: item.videoError,
        imageTaskId: item.imageTaskId,
        videoTaskId: item.videoTaskId,
        imageModelUsed: item.imageModelUsed,
        videoModelUsed: item.videoModelUsed,
      })),
    });
  };
  syncMediaOutputs();

  // ========== Phase 1/3: research real source imagery ==========
  const researchedShots = allowRealImageResearch ? pending.filter((item) => item.shot.realImageQuery) : [];
  const missingResearch = researchedShots.filter((item) => !item.realImage && !item.realImageSearchCompleted);
  ctx.log(job.id, 'media', `Pha 1/3: tìm ảnh thật trước cho ${missingResearch.length}/${researchedShots.length} shot cần tư liệu`);
  let completedResearch = researchedShots.length - missingResearch.length;
  missingResearch.forEach((item) => { item.researchStatus = 'queued'; item.researchError = undefined; });
  syncMediaOutputs();
  await runOrdered(missingResearch, await resolveLaneCount('image', 'googleflow', job.input.flowAccounts), async (item) => {
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
        item.researchError = undefined;
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
        item.researchError = undefined;
        ctx.log(job.id, 'media', `[tư liệu shot ${item.shot.index}] không tìm thấy — frame sẽ tạo không có ảnh thật`);
      }
    } catch (error) {
      if (signal.aborted) {
        item.researchStatus = 'idle';
        throw error;
      }
      item.researchStatus = 'failed';
      item.researchError = error instanceof Error ? error.message : String(error);
      ctx.log(job.id, 'media', `[tư liệu shot ${item.shot.index}] lỗi tạm thời, lần resume sẽ thử lại: ${item.researchError}`);
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
  missingImages.forEach((item) => { item.imageStatus = 'queued'; item.imageError = undefined; });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, 'media', 'image', missingImages, signal, async (item) => {
    if (signal.aborted) throw new Error('aborted');
    const sceneRef = sceneByName.get(String(item.shot.sceneRefId || '').trim().toLocaleLowerCase());
    const reservedReferenceSlots = (sceneRef?.imagePath ? 1 : 0) + (item.realImage ? 1 : 0);
    const characterRefs = (item.shot.characterNames || [])
      .map((name) => characterByName.get(name.toLocaleLowerCase()))
      .filter((character): character is CharacterReference => !!character?.imagePath)
      .slice(0, Math.max(0, MAX_IMAGE_REFERENCE_SLOTS - reservedReferenceSlots));
    const references: Array<{ source: string; provider: 'googleflow' }> = [];
    if (sceneRef?.imagePath) references.push({ source: sceneRef.imagePath, provider: 'googleflow' });
    references.push(...characterRefs.map((character) => ({ source: character.imagePath, provider: 'googleflow' as const })));
    if (item.realImage) references.push({ source: item.realImage.localPath, provider: 'googleflow' as const });
    const sceneLine = sceneRef?.imagePath
      ? `Use the first supplied reference as the authoritative environment for scene "${sceneRef.name}". Preserve its architecture, layout, palette and recurring props while applying the shot composition and camera angle. `
      : '';
    const identityLine = characterRefs.length > 0
      ? `Preserve the supplied character identities exactly. Visible characters: ${characterRefs
          .map((character) => `${character.name}: ${character.characterPrompt || character.description}`)
          .join('; ')}. Use each description only for identity traits — ignore any pose, framing or background it mentions; the shot composition below wins. `
      : '';
    const researchLine = item.realImage
      ? 'Use the final supplied reference as factual source imagery. Integrate it naturally into the composition where it best supports the visual hierarchy and story. Keep it clearly recognizable and preserve its factual content and identity. '
      : '';
    try {
      const attemptImage = await runWithModelFallback(
        imageModelChain,
        (model, modelIndex) => runGenerationWithRetries(
          retryAttempts,
          signal,
          (attempt) => {
            // Remember the id of the attempt actually in flight: the last one to run is
            // the one whose provider record explains the final outcome. The model index
            // is part of the id so a fallback attempt does not overwrite the record of
            // the model that ran before it.
            item.imageTaskId = `ap-img-${job.id}-${item.shot.index - 1}-m${modelIndex}-try-${attempt}`;
            return googleFlowProvider.generateImage({
              projectId: longddProjectId,
              sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
              prompt: `${sceneLine}${identityLine}${researchLine}${item.shot.imagePrompt || ''} ${visualStyleLine}`.trim(),
              model,
              aspectRatio,
              references,
              allowedOwnerScopeIds: imageAccountsFor(model),
              modelChainByOwnerScope: imageModelChains,
              taskId: item.imageTaskId,
              onSubmitted: () => {
                item.imageStatus = 'generating';
                syncMediaOutputs();
              },
              signal,
            });
          },
          (nextAttempt, totalAttempts, error) => {
            item.imageStatus = 'queued';
            syncMediaOutputs();
            ctx.log(job.id, 'media', `Ảnh shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
          },
        ),
        (fromModel, toModel) => {
          item.imageStatus = 'queued';
          syncMediaOutputs();
          ctx.log(job.id, 'media', `Ảnh shot ${item.shot.index}: mọi tài khoản đã hết hạn mức ngày cho ${fromModel} — chuyển sang ${toModel}`);
        },
      );
      const imageResult = attemptImage.result;
      item.imageModelUsed = attemptImage.fellBack ? attemptImage.model : undefined;
      const source = imageResult.localUrl || imageResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về ảnh');
      item.imagePath = await saveImageToLocal(source, 'shots', `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.png`);
      item.imageStatus = 'completed';
      item.imageError = undefined;
      if (attemptImage.fellBack) ctx.log(job.id, 'media', `[ảnh ${item.shot.index}] tạo bằng model dự phòng ${attemptImage.model}`);
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
      item.imageError = stripFlowErrorCode(error instanceof Error ? error.message : String(error));
      ctx.log(job.id, 'media', `Ảnh shot ${item.shot.index} thất bại: ${item.imageError}`);
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
  missingVideos.forEach((item) => { item.videoStatus = 'queued'; item.videoError = undefined; });
  syncMediaOutputs();
  await runGoogleFlowQueueOrdered(ctx, job, 'media', 'video', missingVideos, signal, async (item) => {
    if (signal.aborted) throw new Error('aborted');
    try {
      const attemptVideo = await runWithModelFallback(
        videoModelChain,
        (model, modelIndex) => runGenerationWithRetries(
          retryAttempts,
          signal,
          (attempt) => {
            item.videoTaskId = `ap-vid-${job.id}-${item.shot.index - 1}-m${modelIndex}-try-${attempt}`;
            return googleFlowProvider.generateVideo({
              projectId: longddProjectId,
              sceneId: `autopilot-${job.id}-${item.shot.index - 1}`,
              prompt: `${item.shot.videoPrompt || ''} Preserve the exact visual style, palette, line quality, materials, and character identity of the supplied first frame.`.trim(),
              model,
              aspectRatio,
              duration: item.shot.videoLength,
              startImage: { source: item.imagePath, provider: 'googleflow', flowProjectId },
              allowedOwnerScopeIds: routing.accountsFor('video', model),
              modelChainByOwnerScope: videoModelChains,
              taskId: item.videoTaskId,
              onSubmitted: () => {
                item.videoStatus = 'generating';
                syncMediaOutputs();
              },
              signal,
            });
          },
          (nextAttempt, totalAttempts, error) => {
            item.videoStatus = 'queued';
            syncMediaOutputs();
            ctx.log(job.id, 'media', `Video shot ${item.shot.index} lỗi — thử lại ${nextAttempt}/${totalAttempts}: ${error instanceof Error ? error.message : String(error)}`);
          },
        ),
        (fromModel, toModel) => {
          item.videoStatus = 'queued';
          syncMediaOutputs();
          ctx.log(job.id, 'media', `Video shot ${item.shot.index}: mọi tài khoản đã hết hạn mức ngày cho ${fromModel} — chuyển sang ${toModel}`);
        },
      );
      const videoResult = attemptVideo.result;
      item.videoModelUsed = attemptVideo.fellBack ? attemptVideo.model : undefined;
      const source = videoResult.localUrl || videoResult.remoteUrl || '';
      if (!source) throw new Error('Google Flow không trả về video');
      item.videoPath = await saveVideoToLocal(source, `${safeFileName(job.title)}_shot_${item.shot.index}_${Date.now()}.mp4`);
      item.videoStatus = 'completed';
      item.videoError = undefined;
      if (attemptVideo.fellBack) ctx.log(job.id, 'media', `[video ${item.shot.index}] tạo bằng model dự phòng ${attemptVideo.model}`);
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
      // Still 'skipped', not 'failed': the shot degrades to a still and the job goes on.
      // The message is kept so the card can explain why it went still.
      item.videoStatus = 'skipped';
      item.videoError = stripFlowErrorCode(err instanceof Error ? err.message : String(err));
      ctx.log(job.id, 'media', `Video shot ${item.shot.index} thất bại — dùng ảnh fallback: ${item.videoError}`);
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
