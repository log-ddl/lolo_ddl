/**
 * Turns timed narration beats into a visual plan (shots + the characters and
 * scenes they reference). Three entry points share the same output shape:
 * an AI planner, a chaptered long-form planner, and a plan imported as JSON.
 */

import { callChatAPI } from '@/features/video-studio/lib/script/script-parser';
import { cleanJsonString, safeParseJson } from '@/features/video-studio/lib/utils/json-cleaner';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import {
  runConcurrentOrdered,
  splitTimedUnitsIntoChapters,
  validateLongFormCoverage,
} from '@/features/video-studio/lib/long-form/orchestrator';
import {
  AUTOPILOT_LONG_FORM_BIBLE_SYSTEM_PROMPT,
  AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT,
  DEFAULT_ASPECT_RATIO,
  fallbackPlannerItem,
  normalizeLongFormBible,
  normalizeTransition,
  parsePlannerResponse,
  skillAllowsRealImageResearch,
  toFlowDuration,
} from '../prompts';
import type { TimedNarrationBeat } from '../narration-timeline';
import type { AutopilotChapterCheckpoint, AutopilotImportedPlan, AutopilotJob } from '../types';
import {
  getTextAiConfig,
  type EngineContext,
  type PlannedShot,
  type ShotPlan,
  type ShotPlanningOptions,
} from '../engine-shared';

/** Drops entries without the required fields and de-duplicates by case-insensitive name. */
function dedupeByName<T extends { name: string }>(items: T[], isComplete: (item: T) => boolean): T[] {
  return items
    .filter(isComplete)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.name.toLocaleLowerCase() === item.name.toLocaleLowerCase()) === index);
}

export async function runShotsStage(
  ctx: EngineContext,
  job: AutopilotJob,
  beats: TimedNarrationBeat[],
  signal: AbortSignal,
  options: ShotPlanningOptions = {},
): Promise<ShotPlan> {
  ctx.log(job.id, 'shots', `AI viết visual prompt cho ${beats.length} beat đã khóa timing...`);
  if (options.progress !== false) ctx.stageProgress(job.id, 'shots', 10);
  const config = getTextAiConfig();
  const skill = [job.input.skill, job.input.style].filter(Boolean).join('\n\n').slice(0, 40_000);
  const allowRealImageResearch = skillAllowsRealImageResearch(job.input.skill);
  const beatPayload = beats.map((beat) => ({
    beatIndex: beat.index,
    startMs: beat.startMs,
    endMs: beat.endMs,
    durationSec: Number(((beat.endMs - beat.startMs) / 1000).toFixed(2)),
    narration: beat.text,
  }));
  const appStyleContext = job.visualStylePrompt
    ? `\n\nAPP IMAGE STYLE (mandatory for every character reference and shot frame):\n${job.visualStylePrompt}`
    : '';
  // The creative skill IS the planner's system prompt. AutoPilot no longer layers
  // its own creative direction on top: the skill owns the JSON contract, the shot
  // language, transitions and research rules, so nothing silently overrides it.
  // The built-in prompt is only the safety net for a job that ships no skill at all.
  const systemPrompt = skill || AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT;
  if (!skill) ctx.log(job.id, 'shots', 'Job không có skill — dùng contract planner mặc định');
  const userPrompt = `REAL IMAGE RESEARCH POLICY: ${allowRealImageResearch ? 'ENABLED — follow only the creative skill research rules.' : 'DISABLED — realImageQuery must be empty for every shot.'}${appStyleContext}${options.extraContext ? `\n\n${options.extraContext}` : ''}\n\nLOCKED AUDIO BEATS (never rewrite, merge, omit or re-time; return one plan item per beatIndex):\n${JSON.stringify(beatPayload)}`;
  const chatOptions = {
    apiKey: config.apiKey,
    provider: config.platform,
    baseUrl: config.baseUrl,
    model: config.model || config.models?.[0] || '',
    maxTokens: 10_000,
    signal,
    onCliLog: (message: string) => ctx.log(job.id, 'shots', message),
    cliAdapter: config.cliAdapter,
    cliTimeoutMs: config.cliTimeoutMs,
    // One-shot planner: never resume another call's CLI session. Long-form runs
    // many chapters with the same provider:model sessionKey, which made later
    // chapters --resume earlier chapters and drag their transcript into context.
    sessionKey: `autopilot-shots:${crypto.randomUUID()}`,
  };
  let response = await callChatAPI(systemPrompt, userPrompt, chatOptions);
  let plan = parsePlannerResponse(response);
  if (plan.shots.length === 0) {
    ctx.log(job.id, 'shots', 'JSON visual plan không hợp lệ — retry bằng contract rút gọn');
    response = await callChatAPI(
      `${systemPrompt}\n\nYour previous response was invalid. Return only the JSON object your instructions define, with one shots[] item per beatIndex. Keep strings concise and verify every JSON quote and comma.`,
      userPrompt,
      chatOptions,
    );
    plan = parsePlannerResponse(response);
  }

  const items = plan.shots;
  const itemByBeat = new Map(items.map((item, index) => [Number(item.beatIndex || index + 1), item]));
  const aspectRatio = job.input.aspectRatio || DEFAULT_ASPECT_RATIO;
  let fallbackCount = 0;
  let researchedImageCount = 0;
  const maxResearchedImages = Math.max(1, Math.floor(beats.length * 0.25));
  const shots = beats.map((beat, index): PlannedShot => {
    // Fallback prompts must describe the VISUAL from the beat's voice-over, never
    // echo the creative skill: job.input.style is usually empty, so `|| skill` used
    // to dump the entire skill text into imagePrompt — which tripped Google Flow's
    // PUBLIC_ERROR_UNSAFE_GENERATION. The real visual style is appended separately
    // at generation time (visualStyleLine), so the fallback only needs the voice.
    const fallback = itemByBeat.has(beat.index) ? null : fallbackPlannerItem(beat, aspectRatio, job.input.style);
    const planned = itemByBeat.get(beat.index) || fallback!;
    if (fallback) fallbackCount += 1;
    const imagePrompt = planned.imagePrompt?.trim() || fallbackPlannerItem(beat, aspectRatio, job.input.style).imagePrompt || '';
    // An empty videoPrompt is a deliberate choice ("keep this shot a still"), not a
    // missing field: only a beat the planner never answered may take the fallback
    // motion. Coercing '' to the fallback used to force AI video on every shot and
    // made the Ken Burns path in the media stage unreachable.
    const videoPrompt = typeof planned.videoPrompt === 'string'
      ? planned.videoPrompt.trim()
      : (fallback?.videoPrompt || '');
    const requestedRealImageQuery = planned.realImageQuery?.trim() || '';
    const canUseRealImage = allowRealImageResearch && requestedRealImageQuery.length > 0 && researchedImageCount < maxResearchedImages;
    if (canUseRealImage) researchedImageCount += 1;
    return {
      id: `autopilot-shot-${index + 1}`,
      index: index + 1,
      sceneRefId: String(planned.sceneName || '').trim(),
      imagePrompt,
      videoPrompt,
      transitionToNext: normalizeTransition(planned.transitionToNext, index, beats.length),
      realImageQuery: canUseRealImage ? requestedRealImageQuery : undefined,
      voiceOver: beat.text,
      videoLength: toFlowDuration(beat.endMs - beat.startMs),
      startMs: beat.startMs,
      endMs: beat.endMs,
      hasCharacters: Array.isArray(planned.characterNames) && planned.characterNames.length > 0,
      characterNames: Array.isArray(planned.characterNames)
        ? planned.characterNames.map((name) => String(name).trim()).filter(Boolean)
        : [],
      imageStatus: 'idle',
      imageProgress: 0,
      videoStatus: 'idle',
      videoProgress: 0,
    };
  });
  // With the skill acting as the planner contract, a skill that never states the
  // JSON shape fails on every beat. Fail loudly instead of shipping a whole film of
  // generic fallback prompts that ignore the skill entirely.
  if (fallbackCount === beats.length && beats.length > 1) {
    throw new Error(`Planner không trả được shot nào cho ${beats.length} beat. Skill phải mô tả JSON output (shots[] với beatIndex, imagePrompt, videoPrompt, transitionToNext).`);
  }
  if (fallbackCount > 0) ctx.log(job.id, 'shots', `${fallbackCount} beat thiếu JSON hợp lệ — dùng prompt fallback, narration vẫn được giữ nguyên`);
  ctx.log(job.id, 'shots', allowRealImageResearch
    ? `Skill bật ảnh tư liệu: AI chọn ${researchedImageCount}/${shots.length} shot (giới hạn an toàn 25%)`
    : 'Skill không bật ảnh tư liệu: bỏ qua hoàn toàn bước tìm ảnh thật');
  ctx.log(job.id, 'shots', `${shots.length} shot sẵn sàng; tất cả có voiceOver + timing`);
  if (options.progress !== false) ctx.stageProgress(job.id, 'shots', 100);
  const characters = dedupeByName(
    plan.characters.map((character) => ({
      name: String(character.name || '').trim(),
      description: String(character.description || '').trim(),
      characterPrompt: String(character.characterPrompt || '').trim(),
    })),
    (character) => Boolean(character.name && character.characterPrompt),
  );
  const scenes = dedupeByName(
    plan.scenes.map((scene) => ({
      name: String(scene.name || '').trim(),
      description: String(scene.description || '').trim(),
      scenePrompt: String(scene.scenePrompt || '').trim(),
    })),
    (scene) => Boolean(scene.name && scene.scenePrompt),
  );
  if (options.persist !== false) {
    ctx.updateJob(job.id, {
      shotCount: shots.length,
      plannedShots: shots,
      plannedCharacters: characters,
      plannedScenes: scenes,
    });
  }
  ctx.log(job.id, 'shots', `AI xác định ${characters.length} nhân vật cần giữ đồng nhất`);
  ctx.log(job.id, 'shots', `AI xác định ${scenes.length} cảnh cần ảnh tham chiếu`);
  return { shots, characters, scenes };
}

export async function runLongFormShotsStage(
  ctx: EngineContext,
  job: AutopilotJob,
  beats: TimedNarrationBeat[],
  signal: AbortSignal,
): Promise<ShotPlan> {
  const concurrency = Math.max(1, useVideoStudioSettingsStore.getState().autopilot.planningConcurrency ?? 2);
  // Chapters target ~2 min so each per-chapter shot-planning call stays small enough
  // (~24 beats, cap ~30) for the model to return valid JSON for every beat. Larger
  // chapters overflowed the planner and collapsed shots to voice-over fallbacks.
  const boundaries = splitTimedUnitsIntoChapters(beats, { targetMs: 120_000, minMs: 90_000, maxMs: 150_000 });
  const coverage = validateLongFormCoverage(
    beats.map((beat) => beat.index),
    boundaries.map((chapter) => chapter.unitIndexes),
  );
  if (!coverage.valid) {
    throw new Error(`Long-form chapter coverage invalid (missing: ${coverage.missingIndexes.join(', ') || 'none'}; duplicate: ${coverage.duplicateIndexes.join(', ') || 'none'})`);
  }

  const previousById = new Map((job.chapters || []).map((chapter) => [chapter.id, chapter]));
  let chapters: AutopilotChapterCheckpoint[] = boundaries.map((boundary) => {
    const previous = previousById.get(boundary.id);
    const sameCoverage = previous
      && previous.beatIndexes.length === boundary.unitIndexes.length
      && previous.beatIndexes.every((index, position) => index === boundary.unitIndexes[position]);
    return sameCoverage ? { ...previous } : {
      id: boundary.id,
      index: boundary.index,
      title: boundary.title,
      startMs: boundary.startMs,
      endMs: boundary.endMs,
      beatIndexes: boundary.unitIndexes,
      status: 'idle',
      progress: 0,
    };
  });
  const syncChapters = (): void => {
    ctx.updateJob(job.id, { longFormMode: true, chapters: chapters.map((chapter) => ({ ...chapter })) });
  };
  syncChapters();
  ctx.log(job.id, 'shots', `Long-form: ${chapters.length} chương, ${concurrency} AI worker, checkpoint theo từng chương`);

  let bible = job.longFormBible;
  if (!bible) {
    ctx.log(job.id, 'shots', 'AI khóa story/visual bible dùng chung cho toàn bộ phim...');
    const config = getTextAiConfig();
    const narration = beats.map((beat) => `[${beat.index}] ${beat.text}`).join('\n').slice(0, 48_000);
    const response = await callChatAPI(
      AUTOPILOT_LONG_FORM_BIBLE_SYSTEM_PROMPT,
      `CREATIVE SKILL:\n${(job.input.skill || job.input.style || 'Cinematic editorial documentary').slice(0, 14_000)}\n\nLOCKED NARRATION OVERVIEW:\n${narration}`,
      {
        apiKey: config.apiKey,
        provider: config.platform,
        baseUrl: config.baseUrl,
        model: config.model || config.models?.[0] || '',
        maxTokens: 2_500,
        signal,
        onCliLog: (message) => ctx.log(job.id, 'shots', message),
        cliAdapter: config.cliAdapter,
        cliTimeoutMs: config.cliTimeoutMs,
        sessionKey: `autopilot-bible:${crypto.randomUUID()}`,
      },
    );
    bible = normalizeLongFormBible(safeParseJson<unknown>(cleanJsonString(response), {}));
    ctx.updateJob(job.id, { longFormBible: bible });
    ctx.log(job.id, 'shots', `Đã khóa continuity bible: ${bible.visualTheme}`);
  } else {
    ctx.log(job.id, 'resume', 'Dùng lại continuity bible đã lưu');
  }

  const pendingChapters = chapters.filter((chapter) => chapter.status !== 'done' || !chapter.plannedShots?.length);
  if (pendingChapters.length > 0) {
    pendingChapters.forEach((chapter) => {
      chapter.status = 'queued';
      chapter.progress = 0;
      chapter.error = undefined;
    });
    syncChapters();
    let completed = chapters.length - pendingChapters.length;
    const results = await runConcurrentOrdered(pendingChapters, concurrency, async (chapter) => {
      chapter.status = 'running';
      chapter.progress = 15;
      syncChapters();
      const chapterBeats = beats.filter((beat) => chapter.beatIndexes.includes(beat.index));
      const previous = chapters[chapter.index - 2];
      const next = chapters[chapter.index];
      const neighborContext = [
        previous ? `PREVIOUS CHAPTER END: ${beats.filter((beat) => previous.beatIndexes.includes(beat.index)).slice(-2).map((beat) => beat.text).join(' ')}` : '',
        next ? `NEXT CHAPTER START: ${beats.filter((beat) => next.beatIndexes.includes(beat.index)).slice(0, 2).map((beat) => beat.text).join(' ')}` : '',
      ].filter(Boolean).join('\n');
      try {
        const plan = await runShotsStage(ctx, job, chapterBeats, signal, {
          persist: false,
          progress: false,
          extraContext: `GLOBAL CONTINUITY BIBLE (authoritative):\n${JSON.stringify(bible)}\n\nCHAPTER ${chapter.index}/${chapters.length}: ${chapter.startMs}-${chapter.endMs}ms\n${neighborContext}`,
        });
        chapter.plannedShots = plan.shots;
        chapter.plannedCharacters = plan.characters;
        chapter.plannedScenes = plan.scenes;
        chapter.status = 'done';
        chapter.progress = 100;
        chapter.error = undefined;
        completed += 1;
        syncChapters();
        ctx.stageProgress(job.id, 'shots', Math.round((completed / chapters.length) * 100));
        ctx.log(job.id, 'shots', `Chapter ${chapter.index}/${chapters.length}: đã lưu ${plan.shots.length} shot`);
        return { ok: true as const };
      } catch (error) {
        chapter.status = 'failed';
        chapter.progress = 0;
        chapter.error = error instanceof Error ? error.message : String(error);
        syncChapters();
        return { ok: false as const, error: chapter.error };
      }
    });
    const failed = results.find((result) => !result.ok);
    if (failed && !failed.ok) throw new Error(`Lập kế hoạch chương thất bại: ${failed.error}`);
  } else {
    ctx.log(job.id, 'resume', `Bỏ qua ${chapters.length} chapter plan đã hoàn thành`);
  }

  chapters = [...chapters].sort((a, b) => a.index - b.index);
  const mergedShots = chapters.flatMap((chapter) => chapter.plannedShots || []).map((shot, index, all) => ({
    ...shot,
    id: `autopilot-shot-${index + 1}`,
    index: index + 1,
    transitionToNext: index === all.length - 1
      ? 'none'
      : chapters.some((chapter) => chapter.endMs === shot.endMs) ? 'fade_black' : shot.transitionToNext,
  })) as PlannedShot[];
  const mergedCharacters = dedupeByName(
    chapters.flatMap((chapter) => chapter.plannedCharacters || []),
    (character) => Boolean(character.name && character.characterPrompt),
  );
  const mergedScenes = dedupeByName(
    chapters.flatMap((chapter) => chapter.plannedScenes || []),
    (scene) => Boolean(scene.name && scene.scenePrompt),
  );
  if (mergedShots.length !== beats.length) {
    throw new Error(`Long-form plan thiếu shot: cần ${beats.length}, nhận ${mergedShots.length}`);
  }
  ctx.updateJob(job.id, {
    shotCount: mergedShots.length,
    plannedShots: mergedShots,
    plannedCharacters: mergedCharacters,
    plannedScenes: mergedScenes,
    chapters,
  });
  ctx.stageProgress(job.id, 'shots', 100);
  return { shots: mergedShots, characters: mergedCharacters, scenes: mergedScenes };
}

export function runImportedPlanStage(
  ctx: EngineContext,
  job: AutopilotJob,
  beats: TimedNarrationBeat[],
  imported: AutopilotImportedPlan,
): ShotPlan {
  if (imported.shots.length !== beats.length) throw new Error(`JSON có ${imported.shots.length} shot nhưng timeline voice có ${beats.length} shot`);
  ctx.log(job.id, 'shots', `Dùng kế hoạch JSON ${imported.shots.length} shot — bỏ qua AI/CLI lập shot`);
  const shots = imported.shots.map((planned, index): PlannedShot => {
    const beat = beats[index];
    const characterNames = (planned.characterNames || []).map((name) => name.trim()).filter(Boolean);
    const realImageQuery = planned.realImageQuery?.trim() || undefined;
    return {
      id: `autopilot-shot-${index + 1}`,
      index: index + 1,
      sceneRefId: planned.sceneName?.trim() || '',
      imagePrompt: planned.imagePrompt.trim(),
      videoPrompt: planned.videoPrompt?.trim() || '',
      transitionToNext: normalizeTransition(planned.transitionToNext, index, beats.length),
      realImageQuery,
      voiceOver: beat.text,
      videoLength: toFlowDuration(beat.endMs - beat.startMs),
      startMs: beat.startMs,
      endMs: beat.endMs,
      hasCharacters: characterNames.length > 0,
      characterNames,
      imageStatus: 'idle', imageProgress: 0, videoStatus: 'idle', videoProgress: 0,
    };
  });
  const characters = dedupeByName(
    (imported.characters || []).map((item) => ({
      name: item.name.trim(), description: item.description?.trim() || '', characterPrompt: item.characterPrompt.trim(),
    })),
    (item) => Boolean(item.name && item.characterPrompt),
  );
  const scenes = dedupeByName(
    (imported.scenes || []).map((item) => ({
      name: item.name.trim(), description: item.description?.trim() || '', scenePrompt: item.scenePrompt.trim(),
    })),
    (item) => Boolean(item.name && item.scenePrompt),
  );
  ctx.updateJob(job.id, { shotCount: shots.length, plannedShots: shots, plannedCharacters: characters, plannedScenes: scenes });
  ctx.stageProgress(job.id, 'shots', 100);
  ctx.log(job.id, 'shots', `JSON khóa ${characters.length} nhân vật, ${scenes.length} cảnh, ${shots.filter((shot) => shot.realImageQuery).length} shot tư liệu thật`);
  return { shots, characters, scenes };
}
