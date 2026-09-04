/**
 * AutoPilot engine: owns job state, the checkpoint/step machine, and the
 * lifecycle actions the UI calls. The actual pipeline work lives in ./stages,
 * which receive an `EngineContext` exposing just the internals they need.
 */

import { parseSrt } from '@/features/video-studio/lib/auto-video/srt-parser';
import type { VideoLength } from '@/features/video-studio/types/script';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import { getAbsoluteImagePath, saveImageToLocal, saveVideoToLocal } from '@/features/video-studio/lib/image-storage';
import { useMediaStore } from '@/features/video-studio/stores/media-store';
import { DEFAULT_LONG_FORM_THRESHOLD_MINUTES, safeFileName } from './prompts';
import { getProjectVisualStyleSnapshot } from '@/features/video-studio/lib/project-visual-style';
import type {
  AutopilotEvent,
  AutopilotCharacterPlan,
  AutopilotScenePlan,
  AutopilotJob,
  AutopilotJobInput,
  AutopilotPlannedShot,
  AutopilotSrtSegment,
  AutopilotStage,
  AutopilotStep,
} from './types';
import {
  buildNarrationTimeline,
  buildImportedPlanTimeline,
  extractNarrationBlocks,
} from './narration-timeline';
import {
  normalizeRestoredAssetStatus,
  STAGE_BASE,
  STAGE_WEIGHT,
  STEP_ORDER,
  StepCheckpointReached,
  type AudioResult,
  type EngineContext,
  type PendingShot,
  type PlannedShot,
} from './engine-shared';
import { runAudioStage, runImportedAudioStage, runScriptStage, runSubtitlesStage } from './stages/script-audio';
import { runImportedPlanStage, runLongFormShotsStage, runShotsStage } from './stages/shots';
import { runCharactersStage, runScenesStage } from './stages/references';
import { runMediaStage } from './stages/media';
import { runRenderStage } from './stages/render';
import { runSingleShotRegeneration } from './stages/regenerate-shot';

export { buildNarrationTimeline, buildImportedPlanTimeline, extractNarrationBlocks } from './narration-timeline';
export type { TimedNarrationBeat } from './narration-timeline';

export class AutopilotEngine {
  private jobs = new Map<string, AutopilotJob>();
  private listeners = new Set<(event: AutopilotEvent) => void>();
  private activeControllers = new Map<string, AbortController>();

  /** Stable façade handed to the stage modules. */
  private readonly ctx: EngineContext = {
    activeControllers: this.activeControllers,
    getJob: (jobId) => this.jobs.get(jobId),
    log: (jobId, stage, message) => this.log(jobId, stage, message),
    stageProgress: (jobId, stage, withinPercent) => this.stageProgress(jobId, stage, withinPercent),
    updateJob: (jobId, patch) => this.updateJob(jobId, patch),
    updateCharacterOutput: (jobId, name, patch) => this.updateCharacterOutput(jobId, name, patch),
    updateSceneOutput: (jobId, name, patch) => this.updateSceneOutput(jobId, name, patch),
    completeStep: (job, step) => this.completeStep(job, step),
    isImageAvailable: (path) => this.isImageAvailable(path),
    probeMedia: (path) => this.probeMedia(path),
  };

  onEvent(listener: (event: AutopilotEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: AutopilotEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  listJobs(): AutopilotJob[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  getJob(jobId: string): AutopilotJob | undefined {
    return this.jobs.get(jobId);
  }

  /** Restore persisted snapshots without automatically restarting external work. */
  restoreJobs(snapshots: AutopilotJob[], fallbackProjectId?: string): void {
    for (const snapshot of snapshots.slice(0, 100)) {
      if (!snapshot?.id || this.jobs.has(snapshot.id) || !Array.isArray(snapshot.log)) continue;
      const interrupted = snapshot.status === 'running' || snapshot.status === 'queued';
      const restored: AutopilotJob = {
        ...snapshot,
        projectId: snapshot.projectId || fallbackProjectId,
        input: { ...(snapshot.input || {}) },
        executionMode: snapshot.executionMode || snapshot.input?.executionMode || 'all',
        completedSteps: [...(snapshot.completedSteps || [])],
        nextStep: snapshot.nextStep || 'audio',
        awaitingNextStep: snapshot.awaitingNextStep === true,
        log: snapshot.log.slice(-500),
        characterOutputs: snapshot.characterOutputs?.map((item) => ({ ...item, status: normalizeRestoredAssetStatus(item.status) })),
        sceneOutputs: snapshot.sceneOutputs?.map((item) => ({ ...item, status: normalizeRestoredAssetStatus(item.status) })),
        mediaOutputs: snapshot.mediaOutputs?.map((item) => ({
          ...item,
          researchStatus: normalizeRestoredAssetStatus(item.researchStatus),
          imageStatus: normalizeRestoredAssetStatus(item.imageStatus),
          videoStatus: normalizeRestoredAssetStatus(item.videoStatus),
        })),
        srtSegments: snapshot.srtSegments?.map((item) => ({ ...item })),
        longFormBible: snapshot.longFormBible ? { ...snapshot.longFormBible } : undefined,
        chapters: snapshot.chapters?.map((chapter) => ({
          ...chapter,
          status: chapter.status === 'running' || chapter.status === 'queued' ? 'idle' : chapter.status,
          renderStatus: chapter.renderStatus === 'running' || chapter.renderStatus === 'queued' ? 'idle' : chapter.renderStatus,
          plannedShots: chapter.plannedShots?.map((shot) => ({ ...shot })),
          plannedCharacters: chapter.plannedCharacters?.map((character) => ({ ...character })),
          plannedScenes: chapter.plannedScenes?.map((scene) => ({ ...scene })),
        })),
        ...(interrupted ? {
          status: 'interrupted' as const,
          stage: 'interrupted' as const,
          message: 'Job bị gián đoạn khi ứng dụng đóng',
          error: undefined,
          finishedAt: Date.now(),
        } : {}),
      };
      if (interrupted) {
        restored.log.push({
          ts: Date.now(),
          stage: 'restore',
          message: 'Khôi phục checkpoint sau khi ứng dụng khởi động lại; bấm Tiếp tục để chạy phần còn thiếu.',
        });
      }
      this.jobs.set(restored.id, restored);
      this.emit({ type: 'job-updated', jobId: restored.id, job: { ...restored } });
    }
  }

  createJob(input: AutopilotJobInput): AutopilotJob {
    const id = `autopilot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const projectId = useProjectStore.getState().activeProjectId || undefined;
    const visualStyle = getProjectVisualStyleSnapshot(projectId);
    const importedSrtSegments = input.importedSrtRaw?.trim()
      ? parseSrt(input.importedSrtRaw).segments
          .map((seg, index) => ({ index, startMs: seg.startMs, endMs: seg.endMs, text: seg.text }))
          .filter((seg) => seg.text.trim())
      : undefined;
    const job: AutopilotJob = {
      id,
      projectId,
      title: input.title || input.topic || input.importedAudioPath?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') || 'AutoPilot job',
      status: 'queued',
      stage: 'queued',
      progress: 0,
      message: 'Queued',
      input,
      executionMode: input.executionMode || 'all',
      completedSteps: [],
      nextStep: 'audio',
      awaitingNextStep: false,
      visualStyleId: visualStyle.id,
      visualStyleName: visualStyle.name,
      visualStylePrompt: visualStyle.prompt,
      visualStyleNegativePrompt: visualStyle.negativePrompt,
      srtSegments: importedSrtSegments?.length ? importedSrtSegments : undefined,
      scriptText: importedSrtSegments?.length
        ? importedSrtSegments.map((seg) => seg.text.trim()).filter(Boolean).join('\n\n')
        : input.importedPlan?.shots.map((shot) => shot.voiceOver.trim()).filter(Boolean).join('\n\n') || undefined,
      log: [{ ts: Date.now(), stage: 'queued', message: 'Job created' }],
      createdAt: Date.now(),
    };
    if (input.importedAudioPath?.trim() && importedSrtSegments?.length) {
      this.log(id, 'audio', `Dùng SRT import làm kịch bản + timing khóa: ${importedSrtSegments.length} đoạn (bỏ qua Whisper)`);
    }
    this.jobs.set(id, job);
    this.emit({ type: 'job-updated', jobId: id, job: { ...job } });
    void this.runJob(job);
    return job;
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !['running', 'queued'].includes(job.status)) return false;
    this.activeControllers.get(jobId)?.abort();
    this.log(jobId, 'paused', 'Tạm dừng job; checkpoint đã được giữ để tiếp tục');
    this.updateJob(jobId, { status: 'paused', stage: 'paused', message: 'Đã tạm dừng', progress: job.progress, finishedAt: Date.now() });
    return true;
  }

  resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !['failed', 'paused', 'interrupted', 'cancelled'].includes(job.status) || this.activeControllers.has(jobId)) return false;
    this.log(jobId, 'resume', `Tiếp tục từ checkpoint (${job.stage}, ${Math.round(job.progress)}%)`);
    this.updateJob(jobId, { status: 'queued', stage: 'queued', message: 'Đang chuẩn bị bước tiếp theo', error: undefined, finishedAt: undefined, awaitingNextStep: false });
    void this.runJob(job, true);
    return true;
  }

  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'running' || job.status === 'queued') return false;
    this.jobs.delete(jobId);
    this.emit({ type: 'job-removed', jobId, projectId: job.projectId });
    return true;
  }

  updateShotPrompts(jobId: string, shotIndex: number, patch: { imagePrompt?: string; videoPrompt?: string }): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !job.plannedShots?.length || ['running', 'queued'].includes(job.status)) return false;
    const plannedShots = job.plannedShots.map((shot) => shot.index === shotIndex ? { ...shot, ...patch } : shot);
    const chapters = job.chapters?.map((chapter) => ({
      ...chapter,
      plannedShots: chapter.plannedShots?.map((shot) => shot.index === shotIndex ? { ...shot, ...patch } : shot),
    }));
    this.updateJob(jobId, { plannedShots, chapters });
    this.log(jobId, 'edit', `Đã cập nhật prompt shot ${shotIndex}`);
    return true;
  }

  /** Replace the imagePath for a shot directly (e.g. after watermark removal). */
  updateShotImagePath(jobId: string, shotIndex: number, newImagePath: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    const mediaOutputs = (job.mediaOutputs || []).map((item) =>
      item.index === shotIndex ? { ...item, imagePath: newImagePath } : item,
    );
    this.updateJob(jobId, { mediaOutputs });
    return true;
  }

  /**
   * Cache probed video durations onto the job so FCPXML export never re-probes the
   * same files. Called once (on the first export that had to probe), then persisted —
   * so old projects become as fast as new ones after their first export.
   */
  cacheShotVideoDurations(jobId: string, durations: Array<{ index: number; durationSec: number }>): boolean {
    const job = this.jobs.get(jobId);
    if (!job || durations.length === 0) return false;
    const byIndex = new Map(durations.map((entry) => [entry.index, entry.durationSec]));
    const mediaOutputs = (job.mediaOutputs || []).map((item) =>
      byIndex.has(item.index) ? { ...item, videoDurationSec: byIndex.get(item.index) } : item,
    );
    this.updateJob(jobId, { mediaOutputs });
    return true;
  }

  async importShotImage(jobId: string, shotIndex: number, source: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    const shot = job?.plannedShots?.find((item) => item.index === shotIndex);
    if (!job || !shot || ['running', 'queued'].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, 'shots', `${safeFileName(job.title)}_shot_${shotIndex}_import_${Date.now()}.png`);
    const mediaStore = useMediaStore.getState();
    const imageMediaId = mediaStore.addMediaFromUrl({
      url: imagePath,
      name: `${job.title} — Shot ${shotIndex} (import)`,
      type: 'image',
      source: 'upload',
      folderId: mediaStore.getOrCreateCategoryFolder('upload'),
      projectId: job.projectId,
    });
    const previous = job.mediaOutputs?.find((item) => item.index === shotIndex);
    const output = {
      index: shot.index,
      startMs: shot.startMs,
      endMs: shot.endMs,
      characterNames: shot.characterNames || [],
      ...previous,
      imagePath,
      videoPath: previous?.videoPath || '',
      imageMediaId,
      imageStatus: 'completed' as const,
    };
    this.updateJob(jobId, { mediaOutputs: [...(job.mediaOutputs || []).filter((item) => item.index !== shotIndex), output].sort((a, b) => a.index - b.index) });
    this.log(jobId, 'import', `Đã import ảnh cho shot ${shotIndex}; bước tạo ảnh sẽ bỏ qua shot này`);
    return true;
  }

  async importCharacterImage(jobId: string, name: string, source: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, 'characters', `${safeFileName(name)}_import_${Date.now()}.png`);
    const output = { name, imagePath, status: 'completed' as const };
    this.updateJob(jobId, { characterOutputs: [...(job.characterOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
    this.log(jobId, 'import', `Đã import reference nhân vật ${name}`);
    return true;
  }

  async importSceneImage(jobId: string, name: string, source: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status)) return false;
    const imagePath = await saveImageToLocal(source, 'scenes', `${safeFileName(name)}_import_${Date.now()}.png`);
    const output = { name, imagePath, status: 'completed' as const };
    this.updateJob(jobId, { sceneOutputs: [...(job.sceneOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
    this.log(jobId, 'import', `Đã import reference cảnh ${name}`);
    return true;
  }

  /**
   * Regenerate a character or scene reference image by clearing its output and resuming the job.
   * The pipeline's missing-only filter will re-generate exactly the cleared reference.
   */
  regenerateReferenceImage(jobId: string, kind: 'character' | 'scene', name: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status) || this.activeControllers.has(jobId)) return false;
    if (kind === 'character') {
      const characterOutputs = (job.characterOutputs || []).map((item) =>
        item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
          ? { ...item, imagePath: '', status: 'idle' as const }
          : item,
      );
      this.updateJob(jobId, { characterOutputs });
    } else {
      const sceneOutputs = (job.sceneOutputs || []).map((item) =>
        item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
          ? { ...item, imagePath: '', status: 'idle' as const }
          : item,
      );
      this.updateJob(jobId, { sceneOutputs });
    }
    const label = kind === 'character' ? 'nhân vật' : 'cảnh';
    this.updateJob(jobId, {
      outputVideoPath: undefined,
      status: 'queued',
      stage: 'queued',
      message: `Tạo lại ảnh tham chiếu ${label}: ${name}`,
      error: undefined,
      finishedAt: undefined,
      awaitingNextStep: false,
    });
    this.log(jobId, 'regenerate', `Tạo lại ảnh tham chiếu ${label}: ${name}`);
    void this.runJob(job, true);
    return true;
  }

  /** Update the prompt text for a planned character or scene reference. */
  updateReferencePrompt(jobId: string, kind: 'character' | 'scene', name: string, newPrompt: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status)) return false;
    if (kind === 'character') {
      const plannedCharacters = (job.plannedCharacters || []).map((c) =>
        c.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...c, characterPrompt: newPrompt } : c,
      );
      this.updateJob(jobId, { plannedCharacters });
    } else {
      const plannedScenes = (job.plannedScenes || []).map((s) =>
        s.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? { ...s, scenePrompt: newPrompt } : s,
      );
      this.updateJob(jobId, { plannedScenes });
    }
    return true;
  }

  /** Patch planned-shot fields (references, video length) while the job is idle. */
  updateShotFields(
    jobId: string,
    shotIndex: number,
    patch: Partial<Pick<AutopilotPlannedShot, 'imagePrompt' | 'videoPrompt' | 'videoLength' | 'characterNames' | 'sceneRefId'>>,
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !job.plannedShots?.length || ['running', 'queued'].includes(job.status)) return false;
    const apply = (shot: AutopilotPlannedShot): AutopilotPlannedShot =>
      shot.index === shotIndex
        ? { ...shot, ...patch, hasCharacters: patch.characterNames ? patch.characterNames.length > 0 : shot.hasCharacters }
        : shot;
    const plannedShots = job.plannedShots.map(apply);
    const chapters = job.chapters?.map((chapter) => ({
      ...chapter,
      plannedShots: chapter.plannedShots?.map(apply),
    }));
    this.updateJob(jobId, { plannedShots, chapters });
    return true;
  }

  /** Change which planned characters / scene a shot references (labelled "Tham chiếu" in the UI). */
  updateShotReferences(jobId: string, shotIndex: number, patch: { characterNames?: string[]; sceneRefId?: string }): boolean {
    const ok = this.updateShotFields(jobId, shotIndex, patch);
    if (ok) this.log(jobId, 'edit', `Đã cập nhật tham chiếu shot ${shotIndex}`);
    return ok;
  }

  /** Change the per-shot video length (4/6/8s, plus 10s on Omni Flash). */
  updateShotVideoLength(jobId: string, shotIndex: number, videoLength: VideoLength): boolean {
    return this.updateShotFields(jobId, shotIndex, { videoLength });
  }

  /** Clear a shot's generated image (and its dependent video) so the user can regenerate or re-import. */
  removeShotImage(jobId: string, shotIndex: number): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status)) return false;
    const mediaOutputs = (job.mediaOutputs || []).map((item) =>
      item.index === shotIndex
        ? { ...item, imagePath: '', imageMediaId: undefined, imageStatus: 'idle' as const, videoPath: '', videoMediaId: undefined, videoStatus: 'idle' as const }
        : item,
    );
    this.updateJob(jobId, { mediaOutputs });
    this.log(jobId, 'edit', `Đã xóa ảnh shot ${shotIndex}`);
    return true;
  }

  /**
   * Regenerate a single shot's image or video by clearing its checkpoint and resuming the job.
   * The resumed pipeline skips every already-complete asset (missing-only filters) and re-renders
   * the final MP4, so exactly the cleared shot is remade through the shared Director/AutoPilot queue.
   */
  regenerateShotMedia(jobId: string, shotIndex: number, kind: 'image' | 'video'): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status) || this.activeControllers.has(jobId)) return false;
    const mediaOutputs = (job.mediaOutputs || []).map((item) => {
      if (item.index !== shotIndex) return item;
      if (kind === 'image') {
        return { ...item, imagePath: '', imageMediaId: undefined, imageStatus: 'idle' as const, videoPath: '', videoMediaId: undefined, videoStatus: 'idle' as const };
      }
      return { ...item, videoPath: '', videoMediaId: undefined, videoStatus: 'idle' as const };
    });
    this.updateJob(jobId, { mediaOutputs });
    // Remove relevant steps from completedSteps so stage badges update correctly
    const stepsToRemove = kind === 'image'
      ? new Set(['images', 'videos', 'render', 'done'])
      : new Set(['videos', 'render', 'done']);
    const completedSteps = (job.completedSteps || []).filter((s) => !stepsToRemove.has(s));
    this.updateJob(jobId, { completedSteps, outputVideoPath: undefined });
    this.log(jobId, 'regenerate', kind === 'image' ? `Tạo lại ảnh shot ${shotIndex}` : `Tạo lại video shot ${shotIndex}`);
    void runSingleShotRegeneration(this.ctx, job, shotIndex, kind);
    return true;
  }

  /**
   * Re-stitch the final MP4 from the shots' existing media, optionally applying new
   * render-only settings (subtitles, BGM, resolution). Touches NO image/video
   * generation — only the render stage runs — so it is cheap, costs no credits, and
   * works even when nothing changed (plain re-export). Requires the job to have
   * finished its shot videos at least once.
   */
  rerenderJob(
    jobId: string,
    renderPatch: Partial<Pick<AutopilotJobInput, 'subtitles' | 'bgmPath' | 'bgmVolume' | 'bgmDuckVoice' | 'resolution' | 'fps' | 'codec' | 'audioNormalize' | 'videoAudioVolume' | 'kenBurnsEnabled' | 'kenBurnsPercent'>> = {},
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ['running', 'queued'].includes(job.status) || this.activeControllers.has(jobId)) return false;
    if (!job.completedSteps?.includes('videos') || !job.audioPath) return false;
    this.updateJob(jobId, { input: { ...job.input, ...renderPatch } });
    this.log(jobId, 'rerender', 'Ghép lại video (render-only) với tham số mới');
    void this.runRerender(job);
    return true;
  }

  private async runRerender(job: AutopilotJob): Promise<void> {
    const controller = new AbortController();
    this.activeControllers.set(job.id, controller);
    const signal = controller.signal;
    const prevOutputMediaId = job.outputMediaId;
    this.updateJob(job.id, { status: 'running', stage: 'render', error: undefined, message: 'Ghép lại video', finishedAt: undefined, outputVideoPath: undefined });
    try {
      const mediaFiles = useMediaStore.getState().mediaFiles;
      const resolveMediaUrl = (mediaId: string | undefined, fallbackPath: string | undefined): string | undefined => {
        const entry = mediaId ? mediaFiles.find((media) => media.id === mediaId) : undefined;
        // ffmpeg needs a real filesystem path. `fallbackPath` is the disk path the
        // first successful render already used, so prefer it. `entry.url` may be a
        // huge `data:` base64 (or a `blob:`) URL — feeding that to ffmpeg blows the
        // command-line length limit and throws `spawn ENAMETOOLONG`, so it is only
        // used as a last resort and never when it is an inline data:/blob: URL.
        const isInlineUrl = (u: string | undefined): boolean =>
          !!u && (u.startsWith('data:') || u.startsWith('blob:'));
        if (fallbackPath) return fallbackPath;
        if (entry?.url && !isInlineUrl(entry.url)) return entry.url;
        return fallbackPath;
      };
      const pending: PendingShot[] = (job.plannedShots || []).map((shot) => {
        const media = (job.mediaOutputs || []).find((item) => item.index === shot.index);
        return {
          shot: shot as PlannedShot,
          baseImagePath: media?.baseImagePath || '',
          imagePath: resolveMediaUrl(media?.imageMediaId, media?.imagePath) || '',
          videoPath: resolveMediaUrl(media?.videoMediaId, media?.videoPath) || '',
          realImageSearchCompleted: true,
          imageMediaId: media?.imageMediaId,
          videoMediaId: media?.videoMediaId,
          realImageMediaId: media?.realImageMediaId,
          researchStatus: media?.researchStatus ?? 'completed',
          imageStatus: media?.imageStatus ?? (media?.imagePath ? 'completed' : 'idle'),
          videoStatus: media?.videoStatus ?? (media?.videoPath ? 'completed' : 'skipped'),
        };
      });
      if (pending.every((item) => !item.imagePath && !item.videoPath)) {
        throw new Error('Không còn media để ghép — hãy tạo lại shot trước.');
      }
      const outputVideoPath = await runRenderStage(this.ctx, job, pending, job.audioPath!, job.srtSegments || [], signal);
      const libraryOutputPath = await saveVideoToLocal(outputVideoPath, `${safeFileName(job.title)}_${Date.now()}.mp4`);
      const mediaStore = useMediaStore.getState();
      if (prevOutputMediaId && job.projectId) {
        try { await mediaStore.removeMediaFile(job.projectId, prevOutputMediaId); } catch { /* previous final may already be gone */ }
      }
      const outputMediaId = mediaStore.addMediaFromUrl({
        url: libraryOutputPath,
        name: `${job.title} — AutoPilot final.mp4`,
        type: 'video',
        source: 'ai-video',
        folderId: mediaStore.getOrCreateCategoryFolder('ai-video'),
        projectId: job.projectId,
      });
      this.log(job.id, 'done', `Ghép lại xong: ${outputVideoPath}`);
      this.updateJob(job.id, { status: 'done', stage: 'done', progress: 100, message: 'Đã ghép lại', outputVideoPath, outputMediaId, finishedAt: Date.now() });
    } catch (error) {
      if (signal.aborted) {
        this.updateJob(job.id, { status: 'paused', stage: 'paused', message: 'Đã dừng ghép lại', finishedAt: Date.now() });
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        this.log(job.id, 'error', `Ghép lại thất bại: ${msg}`);
        this.updateJob(job.id, { status: 'done', stage: 'done', error: msg, message: 'Lỗi ghép lại', finishedAt: Date.now() });
      }
    } finally {
      this.activeControllers.delete(job.id);
    }
  }

  private updateJob(jobId: string, patch: Partial<AutopilotJob>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    Object.assign(job, patch);
    this.emit({ type: 'job-updated', jobId, job: { ...job } });
  }

  private updateCharacterOutput(jobId: string, name: string, patch: Partial<NonNullable<AutopilotJob['characterOutputs']>[number]>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const current = job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const output = { name, imagePath: current?.imagePath || '', ...current, ...patch };
    this.updateJob(jobId, { characterOutputs: [...(job.characterOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
  }

  private updateSceneOutput(jobId: string, name: string, patch: Partial<NonNullable<AutopilotJob['sceneOutputs']>[number]>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const current = job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const output = { name, imagePath: current?.imagePath || '', ...current, ...patch };
    this.updateJob(jobId, { sceneOutputs: [...(job.sceneOutputs || []).filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()), output] });
  }

  private log(jobId: string, stage: string, message: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const entry = { ts: Date.now(), stage, message };
    job.log.push(entry);
    if (job.log.length > 500) job.log.splice(0, job.log.length - 500);
    this.emit({ type: 'log', jobId, ...entry });
    this.emit({ type: 'job-updated', jobId, job: { ...job } });
  }

  private stageProgress(jobId: string, stage: AutopilotStage, withinPercent: number): void {
    if (!this.jobs.has(jobId)) return;
    const base = STAGE_BASE[stage] ?? 0;
    const progress = Math.min(100, Math.max(0, base + (STAGE_WEIGHT[stage] ?? 0) * (withinPercent / 100)));
    this.updateJob(jobId, { stage, progress: Math.round(progress) });
  }

  private completeStep(job: AutopilotJob, step: AutopilotStep): void {
    if (job.completedSteps?.includes(step)) return;
    const completedSteps = [...new Set([...(job.completedSteps || []), step])];
    const nextStep = STEP_ORDER[Math.min(STEP_ORDER.indexOf(step) + 1, STEP_ORDER.length - 1)] || 'done';
    this.updateJob(job.id, { completedSteps, nextStep, awaitingNextStep: false });
    // Batch/queue partial run: stop cleanly once the requested endpoint is reached.
    // The job is marked done (its assigned portion is complete) so the queue can advance.
    const stopAfterStep = job.input.stopAfterStep;
    if (stopAfterStep && step === stopAfterStep && nextStep !== 'done') {
      this.log(job.id, 'checkpoint', `Đã chạy đến bước "${step}" theo cấu hình hàng chờ; dừng lại.`);
      this.updateJob(job.id, {
        status: 'done',
        stage: (step === 'references' ? 'scenes' : step) as AutopilotStage,
        message: `Hoàn thành đến bước ${step} (dừng theo hàng chờ)`,
        awaitingNextStep: false,
        finishedAt: Date.now(),
      });
      throw new StepCheckpointReached(step, nextStep);
    }
    if ((job.executionMode || job.input.executionMode) !== 'step' || nextStep === 'done') return;
    this.log(job.id, 'checkpoint', `Hoàn thành bước ${step}; đang chờ người dùng chạy bước ${nextStep}`);
    this.updateJob(job.id, {
      status: 'paused',
      stage: (step === 'references' ? 'scenes' : step) as AutopilotStage,
      message: `Đã xong ${step} — bước tiếp theo: ${nextStep}`,
      awaitingNextStep: true,
      finishedAt: Date.now(),
    });
    throw new StepCheckpointReached(step, nextStep);
  }

  private async isImageAvailable(path: string | undefined): Promise<boolean> {
    if (!path) return false;
    if (path.startsWith('data:')) return true;
    if (path.startsWith('http://') || path.startsWith('https://')) return false;
    if (path.startsWith('local-image://')) return !!(await window.imageStorage?.getImagePath(path));
    if (path.startsWith('idb-image://')) return true;
    const result = await window.imageStorage?.readAsBase64(path);
    return result?.success === true;
  }

  private async probeMedia(path: string | undefined): Promise<number> {
    if (!path) return 0;
    const resolved = path.startsWith('local-image://') ? await getAbsoluteImagePath(path) : path;
    if (!resolved || resolved.startsWith('http://') || resolved.startsWith('https://')) return 0;
    try {
      const result = await window.ffmpegRuntime?.probeDuration(resolved);
      return Math.max(0, result?.durationSec || 0);
    } catch {
      return 0;
    }
  }

  private async runJob(job: AutopilotJob, resume = false): Promise<void> {
    const controller = new AbortController();
    this.activeControllers.set(job.id, controller);
    this.updateJob(job.id, { status: 'running', startedAt: job.startedAt || Date.now(), finishedAt: undefined, error: undefined });
    try {
      if (job.visualStylePrompt === undefined) {
        const visualStyle = getProjectVisualStyleSnapshot(job.projectId);
        this.updateJob(job.id, {
          visualStyleId: visualStyle.id,
          visualStyleName: visualStyle.name,
          visualStylePrompt: visualStyle.prompt,
          visualStyleNegativePrompt: visualStyle.negativePrompt,
        });
      }
      this.log(job.id, 'info', job.visualStylePrompt
        ? `Khóa style ảnh của job: ${job.visualStyleName || job.visualStyleId || 'Video Studio style'}`
        : 'Style ảnh do skill/prompt quyết định (Video Studio đang chọn None)');
      this.log(job.id, 'info', resume ? 'Tiếp tục AutoPilot từ checkpoint' : 'Bắt đầu AutoPilot audio-first');
      let narrationBlocks: string[];
      let audio: AudioResult;
      let srtSegments: AutopilotSrtSegment[];
      const checkpointAudioDuration = await this.probeMedia(job.audioPath);
      if (job.input.importedAudioPath?.trim()) {
        audio = checkpointAudioDuration > 0
          ? { path: job.audioPath!, durationMs: Math.round(checkpointAudioDuration * 1000) }
          : await runImportedAudioStage(this.ctx, job, job.input.importedAudioPath.trim());
        if (checkpointAudioDuration > 0) this.log(job.id, 'resume', 'Bỏ qua audio import đã hoàn thành');
        srtSegments = job.srtSegments?.length
          ? job.srtSegments
          : await runSubtitlesStage(this.ctx, job, audio.path, controller.signal);
        if (srtSegments.length === 0) {
          throw new Error('File giọng đọc cần Whisper API để lấy transcript và timing làm kịch bản chính');
        }
        narrationBlocks = srtSegments.map((segment) => segment.text.trim()).filter(Boolean);
        const transcript = narrationBlocks.join('\n\n');
        this.updateJob(job.id, { scriptText: transcript });
        this.log(job.id, 'script', `Khóa transcript từ file voice làm kịch bản chính: ${narrationBlocks.length} đoạn`);
        this.stageProgress(job.id, 'script', 100);
      } else {
        const scriptText = job.scriptText?.trim() || await runScriptStage(this.ctx, job, controller.signal);
        if (job.scriptText?.trim()) this.log(job.id, 'resume', 'Bỏ qua kịch bản đã hoàn thành');
        narrationBlocks = extractNarrationBlocks(scriptText);
        if (narrationBlocks.length === 0) throw new Error('Kịch bản không có lời thuyết minh để tạo giọng đọc');
        this.log(job.id, 'script', `Khóa ${narrationBlocks.length} khối lời thuyết minh trước khi tạo media`);
        audio = checkpointAudioDuration > 0
          ? { path: job.audioPath!, durationMs: Math.round(checkpointAudioDuration * 1000) }
          : await runAudioStage(this.ctx, job, narrationBlocks, controller.signal);
        if (checkpointAudioDuration > 0) this.log(job.id, 'resume', 'Bỏ qua voice đã hoàn thành');
        srtSegments = job.srtSegments !== undefined
          ? job.srtSegments
          : await runSubtitlesStage(this.ctx, job, audio.path, controller.signal);
      }
      this.completeStep(job, 'audio');
      const beats = job.input.importedPlan
        ? buildImportedPlanTimeline(job.input.importedPlan.shots.map((shot) => shot.voiceOver), audio.durationMs)
        : buildNarrationTimeline(narrationBlocks, audio.durationMs, srtSegments, job.input.maxShots);
      if (beats.length === 0) throw new Error('Không lập được timeline hình ảnh từ narration');
      this.log(job.id, 'shots', `Audio ${(audio.durationMs / 1000).toFixed(1)}s → ${beats.length} shot theo timing thật`);

      const longFormThresholdMinutes = Math.min(120, Math.max(1,
        Math.round(job.input.longFormThresholdMinutes || DEFAULT_LONG_FORM_THRESHOLD_MINUTES),
      ));
      const longFormMode = job.longFormMode === true
        || audio.durationMs >= longFormThresholdMinutes * 60_000;
      if (job.longFormMode !== longFormMode) this.updateJob(job.id, { longFormMode });
      this.log(job.id, 'shots', longFormMode
        ? `Long-form bật: voice đạt ngưỡng ${longFormThresholdMinutes} phút`
        : `Pipeline thường: voice dưới ngưỡng ${longFormThresholdMinutes} phút`);

      const plan = job.plannedShots?.length
        ? {
            shots: job.plannedShots as PlannedShot[],
            characters: (job.plannedCharacters || []) as AutopilotCharacterPlan[],
            scenes: (job.plannedScenes || []) as AutopilotScenePlan[],
          }
        : job.input.importedPlan
          ? runImportedPlanStage(this.ctx, job, beats, job.input.importedPlan)
          : longFormMode
            ? await runLongFormShotsStage(this.ctx, job, beats, controller.signal)
            : await runShotsStage(this.ctx, job, beats, controller.signal);
      if (job.plannedShots?.length) this.log(job.id, 'resume', `Bỏ qua visual plan đã lưu (${job.plannedShots.length} shot)`);
      this.completeStep(job, 'shots');

      await runMediaStage(this.ctx, job, plan.shots, [], [], controller.signal, 'research');
      this.completeStep(job, 'research');

      const characterReferences = await runCharactersStage(this.ctx, job, plan.characters, controller.signal);
      const sceneReferences = await runScenesStage(this.ctx, job, plan.scenes, controller.signal);
      this.completeStep(job, 'references');

      await runMediaStage(this.ctx, job, plan.shots, characterReferences, sceneReferences, controller.signal, 'images');
      this.completeStep(job, 'images');

      const pending = await runMediaStage(this.ctx, job, plan.shots, characterReferences, sceneReferences, controller.signal, 'videos');
      this.completeStep(job, 'videos');
      const checkpointOutputDuration = await this.probeMedia(job.outputVideoPath);
      const outputVideoPath = checkpointOutputDuration > 0
        ? job.outputVideoPath!
        : await runRenderStage(this.ctx, job, pending, audio.path, srtSegments, controller.signal);
      if (checkpointOutputDuration > 0) this.log(job.id, 'resume', 'Bỏ qua render cuối đã hoàn thành');
      else this.updateJob(job.id, { outputVideoPath });
      this.completeStep(job, 'render');
      const libraryOutputPath = await saveVideoToLocal(outputVideoPath, `${safeFileName(job.title)}_${Date.now()}.mp4`);
      const mediaStore = useMediaStore.getState();
      // Re-stitching produces a fresh final; drop the previous library entry so the
      // media library keeps one "final" per job instead of a duplicate per render.
      if (job.outputMediaId && job.projectId) {
        try { await mediaStore.removeMediaFile(job.projectId, job.outputMediaId); } catch { /* previous final may already be gone */ }
      }
      const outputMediaId = mediaStore.addMediaFromUrl({
        url: libraryOutputPath,
        name: `${job.title} — AutoPilot final.mp4`,
        type: 'video',
        source: 'ai-video',
        folderId: mediaStore.getOrCreateCategoryFolder('ai-video'),
        projectId: job.projectId,
      });
      this.log(job.id, 'done', `Hoàn thành: ${outputVideoPath}`);
      this.updateJob(job.id, { status: 'done', stage: 'done', progress: 100, message: 'Done', outputVideoPath, outputMediaId, finishedAt: Date.now() });
    } catch (err) {
      if (err instanceof StepCheckpointReached) return;
      const aborted = controller.signal.aborted;
      const message = aborted ? 'Cancelled' : (err instanceof Error ? err.message : String(err));
      if (!aborted) this.log(job.id, 'error', message);
      if (!aborted) {
        this.updateJob(job.id, { status: 'failed', stage: 'failed', message, error: message, finishedAt: Date.now() });
      } else if (this.getJob(job.id)?.status !== 'paused') {
        this.updateJob(job.id, { status: 'paused', stage: 'paused', message: 'Đã tạm dừng', error: undefined, finishedAt: Date.now() });
      }
    } finally {
      this.activeControllers.delete(job.id);
    }
  }
}
