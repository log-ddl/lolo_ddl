/**
 * The audio-first head of the pipeline: write (or accept) the script, turn it
 * into narration audio, then align that audio into timed subtitle segments.
 * Everything downstream is locked to the timing produced here.
 */

import { callChatAPI } from '@/features/video-studio/lib/script/script-parser';
import { parseSrt } from '@/features/video-studio/lib/auto-video/srt-parser';
import { useAutoVideoStore } from '@/features/video-studio/stores/auto-video-store';
import { getCapCutVoice } from '@/features/tts-voice/lib/capcut-voices';
import { getTtsModel } from '@/features/tts-voice/lib/model-registry';
import { AUTOPILOT_WRITER_SYSTEM_PROMPT, buildAutopilotWriterUserPrompt } from '../prompts';
import type { AutopilotJob, AutopilotSrtSegment } from '../types';
import { getTextAiConfig, type AudioResult, type EngineContext } from '../engine-shared';

export async function runScriptStage(ctx: EngineContext, job: AutopilotJob, signal: AbortSignal): Promise<string> {
  let scriptText = job.input.script?.trim();
  if (!scriptText && job.input.topic?.trim()) {
    ctx.log(job.id, 'script', 'Viết kịch bản từ chủ đề...');
    ctx.stageProgress(job.id, 'script', 10);
    const config = await getTextAiConfig();
    scriptText = await callChatAPI(
      AUTOPILOT_WRITER_SYSTEM_PROMPT,
      buildAutopilotWriterUserPrompt(job.input.topic.trim(), job.input.style, job.input.skill),
      {
        apiKey: config.apiKey,
        provider: config.platform,
        baseUrl: config.baseUrl,
        model: config.model || config.models?.[0] || '',
        maxTokens: 8_000,
        signal,
        onCliLog: (message) => ctx.log(job.id, 'script', message),
        cliAdapter: config.cliAdapter,
        cliTimeoutMs: config.cliTimeoutMs,
        cliEffort: config.cliEffort,
        cliWorkingDirectory: config.cliWorkingDirectory,
        cliEnableContentMcp: config.cliEnableContentMcp,
        sessionKey: `autopilot-script:${crypto.randomUUID()}`,
      },
    );
    ctx.updateJob(job.id, { scriptText });
    ctx.log(job.id, 'script', `Kịch bản: ${scriptText.length} ký tự`);
  } else {
    scriptText = scriptText || '';
    if (!scriptText) throw new Error('Không có chủ đề hoặc kịch bản để chạy');
    ctx.updateJob(job.id, { scriptText });
    ctx.log(job.id, 'script', 'Dùng kịch bản có sẵn');
  }
  ctx.stageProgress(job.id, 'script', 100);
  return scriptText;
}

export async function runAudioStage(
  ctx: EngineContext,
  job: AutopilotJob,
  narrationBlocks: string[],
  signal: AbortSignal,
): Promise<AudioResult> {
  // Resolve the voice generically from the TTS-tab snapshot so any provider the TTS
  // feature supports (CapCut/Gemini/Vbee/OmniVoice/VieNeu/…) works without an AutoPilot-side
  // engine list. Legacy jobs only carry `engine`; the fallbacks below keep them running.
  const v = job.input.voice || {};
  const capability = v.capability || v.engine || 'capcut';
  const model = v.modelId ? getTtsModel(v.modelId) : undefined;
  const modelId = v.modelId
    || (capability === 'omnivoice' ? 'omnivoice-main'
      : capability === 'vieneu' ? 'vieneu-v3-turbo'
      : capability === 'gemini' ? 'gemini-3.1-flash-tts-preview'
        : capability === 'vbee' ? 'vbee-api' : 'capcut-online');
  const repository = v.repository || model?.repository
    || (capability === 'omnivoice' ? 'k2-fsa/OmniVoice'
      : capability === 'vieneu' ? 'pnnbao97/VieNeu-TTS'
      : capability === 'gemini' ? 'https://generativelanguage.googleapis.com'
        : capability === 'vbee' ? 'https://vbee.vn/api/v1/tts'
          : 'https://editor-api-sg.capcutapi.com');
  const isOnline = (model?.runtimeKind ?? (capability === 'omnivoice' || capability === 'vieneu' ? 'local' : 'online')) === 'online';
  const isCapcut = capability === 'capcut';
  const isGemini = capability === 'gemini';
  const isVbee = capability === 'vbee';
  const isOmnivoice = capability === 'omnivoice';
  const isVieneu = capability === 'vieneu';

  const capcutVoiceType = isCapcut ? (v.capcutVoiceType || v.voiceType || 'BV421_vivn_streaming') : undefined;
  const capcutResourceId = isCapcut ? (v.capcutResourceId || getCapCutVoice(capcutVoiceType || '')?.resourceId || '') : undefined;
  const cloneProfile = (isOmnivoice || isVieneu) && v.profileId && v.referenceAudioPath ? v : undefined;
  const mode = isOnline ? 'preset' : isVieneu ? (cloneProfile ? 'clone' : 'preset') : (v.mode && v.mode !== 'preset' ? v.mode : (cloneProfile ? 'clone' : 'auto'));

  ctx.log(job.id, 'audio', cloneProfile
    ? `Tạo voice bằng giọng clone OmniVoice (${v.profileId}) trước media...`
    : `Tạo voice trước media (${v.engineName || capability}, ${narrationBlocks.length} khối)...`);
  ctx.stageProgress(job.id, 'audio', 10);
  const ttsJobId = `autopilot-tts-${job.id}-${Date.now()}`;
  const abort = () => { void window.ttsRuntime?.cancel(ttsJobId); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const result = await window.ttsRuntime?.generate({
      jobId: ttsJobId,
      model: { id: modelId, repository, capability },
      text: narrationBlocks.join('\n'),
      mode,
      // Vbee accepts the locked narration as one request up to 50,000
      // characters. Its runtime only chunks text when that limit is exceeded.
      splitMode: isVbee ? 'default' : 'line',
      language: v.language || (isGemini ? 'vi-VN' : 'vi'),
      speed: v.speed,
      numStep: v.numStep,
      capcutVoiceType,
      capcutResourceId,
      geminiVoiceName: isGemini ? (v.geminiVoiceName || v.voiceName || 'Puck') : undefined,
      geminiStyle: isGemini ? v.geminiStyle : undefined,
      vbeeVoiceCode: isVbee ? v.vbeeVoiceCode : undefined,
      vbeeAudioType: isVbee ? v.vbeeAudioType : undefined,
      vbeeBitrate: isVbee ? v.vbeeBitrate : undefined,
      vieneuVoice: isVieneu ? v.vieneuVoice : undefined,
      vieneuStyle: isVieneu ? v.vieneuStyle : undefined,
      instruction: mode === 'design' ? v.instruction : undefined,
      profileId: cloneProfile?.profileId,
      referenceAudioPath: cloneProfile?.referenceAudioPath,
      referenceText: cloneProfile?.referenceText,
    });
    if (!result?.success || !result.outputPath) throw new Error(result?.error || 'Không tạo được giọng đọc');
    const probed = result.durationSec || (await window.ffmpegRuntime?.probeDuration(result.outputPath))?.durationSec || 0;
    const durationMs = Math.max(1_000, Math.round(probed * 1000));
    ctx.updateJob(job.id, { audioPath: result.outputPath, audioDurationMs: durationMs });
    ctx.log(job.id, 'audio', `Audio khóa timeline: ${result.outputPath} (${(durationMs / 1000).toFixed(1)}s)`);
    ctx.stageProgress(job.id, 'audio', 100);
    return { path: result.outputPath, durationMs };
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

export async function runImportedAudioStage(ctx: EngineContext, job: AutopilotJob, audioPath: string): Promise<AudioResult> {
  ctx.log(job.id, 'audio', `Dùng file giọng đọc có sẵn, bỏ qua TTS: ${audioPath}`);
  ctx.stageProgress(job.id, 'audio', 20);
  const probed = await window.ffmpegRuntime?.probeDuration(audioPath);
  const durationSec = probed?.durationSec || 0;
  if (durationSec <= 0) throw new Error('Không đọc được thời lượng file giọng đọc');
  const durationMs = Math.round(durationSec * 1000);
  ctx.updateJob(job.id, { audioPath, audioDurationMs: durationMs });
  ctx.log(job.id, 'audio', `Audio import khóa timeline: ${(durationMs / 1000).toFixed(1)}s`);
  ctx.stageProgress(job.id, 'audio', 100);
  return { path: audioPath, durationMs };
}

export async function runSubtitlesStage(
  ctx: EngineContext,
  job: AutopilotJob,
  audioPath: string,
  signal: AbortSignal,
): Promise<AutopilotSrtSegment[]> {
  const provider = job.input.whisperProvider || useAutoVideoStore.getState().whisperProvider || 'openai';
  const apiKey = job.input.whisperApiKey || useAutoVideoStore.getState().whisperApiKeys[provider] || '';
  if (!apiKey) {
    ctx.log(job.id, 'subtitles', 'Không có Whisper key — ước lượng beat từ audio duration và narration');
    ctx.updateJob(job.id, { srtSegments: [] });
    ctx.stageProgress(job.id, 'subtitles', 100);
    return [];
  }

  ctx.log(job.id, 'subtitles', `Căn thời gian narration bằng Whisper (${provider})...`);
  ctx.stageProgress(job.id, 'subtitles', 10);
  const whisperJobId = `autopilot-whisper-${job.id}-${Date.now()}`;
  const abort = () => { void window.whisperRuntime?.cancel(whisperJobId); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const result = await window.whisperRuntime?.transcribe({ jobId: whisperJobId, audioPath, provider, apiKey, language: 'vi' });
    if (!result?.success || !result.srt) {
      ctx.log(job.id, 'subtitles', `Whisper thất bại: ${result?.error || 'unknown'} — dùng timing ước lượng`);
      ctx.updateJob(job.id, { srtSegments: [] });
      ctx.stageProgress(job.id, 'subtitles', 100);
      return [];
    }
    const parsed = parseSrt(result.srt);
    const segments = parsed.segments.map((seg, index) => ({ index, startMs: seg.startMs, endMs: seg.endMs, text: seg.text }));
    ctx.updateJob(job.id, { srtSegments: segments });
    ctx.log(job.id, 'subtitles', `${segments.length} caption, dùng để lập beat hình ảnh`);
    ctx.stageProgress(job.id, 'subtitles', 100);
    return segments;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}
