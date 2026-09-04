/**
 * Final stitch. Long-form jobs render one clip per chapter first (each a resumable
 * checkpoint) and then concatenate those clips; short jobs render every shot in a
 * single pass.
 */

import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { safeFileName } from '../prompts';
import type { AutopilotJob, AutopilotSrtSegment } from '../types';
import { KEN_BURNS_MIN_DURATION_MS, planKenBurnsEffects } from '../ken-burns';
import type { EngineContext, PendingShot } from '../engine-shared';

export async function runRenderStage(
  ctx: EngineContext,
  job: AutopilotJob,
  pending: PendingShot[],
  audioPath: string,
  srtSegments: AutopilotSrtSegment[],
  signal: AbortSignal,
): Promise<string> {
  const chapters = job.longFormMode && (job.chapters?.length || 0) > 1
    ? [...(job.chapters || [])].sort((a, b) => a.index - b.index)
    : [];
  // Planned over every still shot in the film at once (chapters render separately,
  // so a per-chapter plan would apply the percentage to each chapter on its own).
  // The job's own value wins so a re-stitch can change the motion without touching
  // Settings; Settings is the fallback for jobs created before the option existed.
  const kenBurnsDefaults = useVideoStudioSettingsStore.getState().autopilot;
  const kenBurnsEnabled = job.input.kenBurnsEnabled ?? kenBurnsDefaults.kenBurnsEnabled;
  const kenBurnsPercent = job.input.kenBurnsPercent ?? kenBurnsDefaults.kenBurnsPercent;
  const stillShots = pending
    .filter((item) => !item.videoPath)
    .map((item) => ({ index: item.shot.index, durationMs: item.shot.endMs - item.shot.startMs }))
    .sort((a, b) => a.index - b.index);
  const kenBurnsPlan = planKenBurnsEffects(stillShots, {
    enabled: kenBurnsEnabled,
    percent: kenBurnsPercent,
    seed: job.id,
  });
  const mediaEffectFor = (item: PendingShot) =>
    item.videoPath ? 'none' as const : kenBurnsPlan.get(item.shot.index) || 'none';
  const movingStills = stillShots.filter((shot) => (kenBurnsPlan.get(shot.index) || 'none') !== 'none').length;
  const tooShortStills = stillShots.filter((shot) => shot.durationMs < KEN_BURNS_MIN_DURATION_MS).length;
  if (stillShots.length > 0) {
    const tooShortNote = tooShortStills > 0 ? `; ${tooShortStills} shot dưới ${KEN_BURNS_MIN_DURATION_MS / 1000}s luôn đứng yên` : '';
    ctx.log(job.id, 'render', kenBurnsEnabled
      ? `Ken Burns: ${movingStills}/${stillShots.length} shot tĩnh có chuyển động (cài đặt ${kenBurnsPercent}%)${tooShortNote}`
      : `Ken Burns tắt: ${stillShots.length} shot tĩnh giữ nguyên khung`);
  }
  if (chapters.length > 0) {
    ctx.log(job.id, 'render', `Long-form render: checkpoint ${chapters.length} chương trước khi ghép bản cuối`);
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex += 1) {
      if (signal.aborted) throw new Error('Cancelled');
      const chapter = chapters[chapterIndex];
      const checkpointDuration = await ctx.probeMedia(chapter.outputVideoPath);
      if (checkpointDuration > 0) {
        chapter.renderStatus = 'done';
        chapter.renderProgress = 100;
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        ctx.log(job.id, 'resume', `Bỏ qua render chapter ${chapter.index} đã hoàn thành`);
        continue;
      }
      chapter.renderStatus = 'running';
      chapter.renderProgress = 10;
      chapter.renderError = undefined;
      ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
      const chapterPending = pending.filter((item) =>
        item.shot.startMs >= chapter.startMs && item.shot.endMs <= chapter.endMs,
      );
      if (chapterPending.length === 0) throw new Error(`Chapter ${chapter.index} không có media để render`);
      const chapterSegments = chapterPending.map((item, index) => ({
        index: index + 1,
        startMs: item.shot.startMs - chapter.startMs,
        endMs: item.shot.endMs - chapter.startMs,
        text: item.shot.voiceOver || '',
        imagePath: item.imagePath,
        videoPath: item.videoPath,
        mediaEffect: mediaEffectFor(item),
        transitionToNext: item.shot.transitionToNext || 'none',
        sfxPath: '',
      }));
      const audioBase = audioPath.replace(/\.[^./\\]+$/u, '');
      const outputPath = `${audioBase}.${safeFileName(job.id)}.chapter-${String(chapter.index).padStart(2, '0')}.mp4`;
      const renderJobId = `autopilot-render-${job.id}-chapter-${chapter.index}-${Date.now()}`;
      const abort = () => { void window.autoVideoRuntime?.cancel(renderJobId); };
      signal.addEventListener('abort', abort, { once: true });
      try {
        const result = await window.autoVideoRuntime?.render({
          jobId: renderJobId,
          audioPath,
          audioStartMs: chapter.startMs,
          audioEndMs: chapter.endMs,
          segments: chapterSegments,
          captionSegments: [],
          mediaMode: chapterPending.some((item) => item.videoPath) ? 'video' : 'image',
          resolution: job.input.resolution || '1920x1080',
          fps: job.input.fps || 30,
          codec: job.input.codec || 'libx264',
          crf: job.input.crf ?? 23,
          outputPath,
          burnSubtitles: false,
          subtitleFontSize: 0,
          bgmVolume: 0,
          bgmDuckVoice: false,
          audioNormalize: job.input.audioNormalize ?? false,
          videoAudioVolume: job.input.videoAudioVolume ?? 0,
        });
        if (!result?.success || !result.outputPath) throw new Error(result?.error || `Render chapter ${chapter.index} thất bại`);
        chapter.outputVideoPath = result.outputPath;
        chapter.renderStatus = 'done';
        chapter.renderProgress = 100;
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        ctx.stageProgress(job.id, 'render', Math.round(((chapterIndex + 1) / (chapters.length + 1)) * 80));
        ctx.log(job.id, 'render', `Chapter ${chapter.index}/${chapters.length} đã checkpoint: ${result.outputPath}`);
      } catch (error) {
        chapter.renderStatus = 'failed';
        chapter.renderProgress = 0;
        chapter.renderError = error instanceof Error ? error.message : String(error);
        ctx.updateJob(job.id, { chapters: chapters.map((item) => ({ ...item })) });
        throw error;
      } finally {
        signal.removeEventListener('abort', abort);
      }
    }
  }

  const shotSegments = pending.map((item, index) => ({
    index: index + 1,
    startMs: item.shot.startMs,
    endMs: item.shot.endMs,
    text: item.shot.voiceOver || '',
    imagePath: item.imagePath,
    videoPath: item.videoPath,
    mediaEffect: mediaEffectFor(item),
    transitionToNext: item.shot.transitionToNext || 'none',
    sfxPath: '',
  }));
  const segments = chapters.length > 0
    ? chapters.map((chapter, index) => {
        const first = pending.find((item) => item.shot.startMs >= chapter.startMs && item.shot.endMs <= chapter.endMs);
        return {
          index: index + 1,
          startMs: chapter.startMs,
          endMs: chapter.endMs,
          text: '',
          imagePath: first?.imagePath || '',
          videoPath: chapter.outputVideoPath,
          mediaEffect: 'none' as const,
          // Hard-cut between chapter clips (no xfade) so the final uses concat mode and
          // the clips' own audio stays perfectly in sync — narration flows continuously
          // across the boundary anyway, so a fade-to-black there would be wrong.
          transitionToNext: 'none' as const,
          sfxPath: '',
        };
      })
    : shotSegments;
  const hasVideo = segments.some((item) => item.videoPath);
  const captions = srtSegments.length > 0
    ? srtSegments
    : shotSegments.map(({ index, startMs, endMs, text }) => ({ index, startMs, endMs, text }));
  ctx.log(job.id, 'render', `Render ${segments.length} visual shot + ${job.input.subtitles === true ? captions.length : 0} caption độc lập...`);
  ctx.stageProgress(job.id, 'render', 10);
  const renderJobId = `autopilot-render-${job.id}-${Date.now()}`;
  const abort = () => { void window.autoVideoRuntime?.cancel(renderJobId); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const result = await window.autoVideoRuntime?.render({
      jobId: renderJobId,
      audioPath,
      segments,
      captionSegments: job.input.subtitles === true ? captions : [],
      mediaMode: hasVideo ? 'video' : 'image',
      resolution: job.input.resolution || '1920x1080',
      fps: job.input.fps || 30,
      codec: job.input.codec || 'libx264',
      crf: job.input.crf ?? 23,
      outputPath: job.input.outputPath || undefined,
      burnSubtitles: job.input.subtitles === true && captions.length > 0,
      subtitleFontSize: 0,
      bgmPath: job.input.bgmPath || undefined,
      bgmVolume: job.input.bgmVolume ?? 0.25,
      bgmDuckVoice: job.input.bgmDuckVoice ?? true,
      audioNormalize: job.input.audioNormalize ?? false,
      videoAudioVolume: job.input.videoAudioVolume ?? 0,
      // Long-form: chapter clips already carry narration + video audio. Use their own
      // audio as master so the imported voice isn't laid a second time (echo/overlap).
      masterFromSegments: chapters.length > 0,
    });
    if (!result?.success || !result.outputPath) throw new Error(result?.error || 'Render thất bại');
    ctx.stageProgress(job.id, 'render', 100);
    ctx.log(job.id, 'render', `Output: ${result.outputPath}`);
    return result.outputPath;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}
