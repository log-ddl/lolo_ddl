import { autopilotEngine } from '@/features/video-studio/stores/autopilot-store';
import { buildEngineStatus } from '@/features/video-studio/stores/autopilot-store';
import { googleFlowProvider } from '@/features/video-studio/lib/ai/google-flow-provider';
import { resolveFlowProjectBinding } from '@/features/video-studio/autopilot/flow-binding';
import { useAutoVideoStore } from '@/features/video-studio/stores/auto-video-store';
import { useLicenseStore } from '@/shared/stores/license-store';
import { hasPlanAccess } from '@/shared/lib/license-client';
import { getCapCutVoice } from '@/features/tts-voice/lib/capcut-voices';
import { getGeminiVoice } from '@/features/tts-voice/lib/gemini-voices';
import type { AutopilotJobInput } from '@/features/video-studio/autopilot/types';

export interface AutopilotHttpRequest {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
}

export interface AutopilotHttpResponse {
  status: number;
  body: unknown;
}

type Emit = (event: unknown) => void;

function json(status: number, body: unknown): AutopilotHttpResponse {
  return { status, body };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseInput(body: unknown): AutopilotJobInput {
  if (!isObject(body)) return {};
  const input: AutopilotJobInput = {};
  const pick = <K extends keyof AutopilotJobInput>(key: K, fallback?: AutopilotJobInput[K]) => {
    const value = body[key];
    if (value !== undefined) input[key] = value as AutopilotJobInput[K];
    else if (fallback !== undefined) input[key] = fallback;
  };
  pick('title');
  pick('topic');
  pick('script');
  pick('style');
  pick('skill');
  pick('maxShots');
  pick('aspectRatio');
  pick('imageModel');
  pick('videoModel');
  pick('importedAudioPath');
  pick('importedSrtRaw');
  pick('importedPlan');
  pick('voice');
  pick('subtitles');
  pick('whisperProvider');
  pick('whisperApiKey');
  pick('resolution');
  pick('fps');
  pick('codec');
  pick('crf');
  pick('bgmPath');
  pick('bgmVolume');
  pick('bgmDuckVoice');
  pick('audioNormalize');
  pick('videoAudioVolume');
  pick('outputPath');
  pick('executionMode');
  return input;
}

async function resolveFlowProject(): Promise<{ flowProjectId: string; longddProjectId: string }> {
  const runtime = window.googleFlowRuntime;
  if (!runtime) throw new Error('Google Flow runtime unavailable');
  const resolved = await resolveFlowProjectBinding(runtime);
  return { flowProjectId: resolved.flowProjectId, longddProjectId: resolved.longddProjectId };
}

function handleJobEvents(jobId: string, emit: Emit): void {
  const job = autopilotEngine.getJob(jobId);
  if (job) emit({ type: 'snapshot', jobId, job });
  const off = autopilotEngine.onEvent((event) => {
    if (event.type === 'job-removed') {
      emit({ type: 'job-removed', jobId });
      return;
    }
    if (event.jobId !== jobId) return;
    emit(event);
    if (event.type === 'job-updated') {
      const updated = autopilotEngine.getJob(jobId);
      if (updated && ['done', 'failed', 'cancelled', 'paused', 'interrupted'].includes(updated.status)) {
        emit({ type: 'end', jobId, job: updated });
      }
    }
  });
  setTimeout(off, 30 * 60 * 1000);
}

async function route(request: AutopilotHttpRequest, emit: Emit): Promise<AutopilotHttpResponse> {
  const { method, path, query } = request;
  const segments = path.split('/').filter(Boolean);

  if (method === 'GET' && path === '/status') {
    return json(200, { ...buildEngineStatus(), jobs: autopilotEngine.listJobs().map((j) => j.id) });
  }

  if (!hasPlanAccess(useLicenseStore.getState().plan, 'dev')) {
    return json(403, { error: 'AutoPilot requires the Dev plan.' });
  }

  if (method === 'POST' && path === '/jobs') {
    const input = parseInput(request.body);
    if (!input.topic?.trim() && !input.script?.trim() && !input.importedAudioPath?.trim() && !input.importedPlan?.shots?.length) {
      return json(400, { error: 'Cần cung cấp topic, script hoặc importedAudioPath' });
    }
    const job = autopilotEngine.createJob(input);
    return json(202, { jobId: job.id });
  }

  if (method === 'GET' && path === '/jobs') {
    return json(200, { jobs: autopilotEngine.listJobs() });
  }

  if (segments[0] === 'jobs' && segments.length >= 2) {
    const jobId = segments[1];
    const job = autopilotEngine.getJob(jobId);
    if (!job) return json(404, { error: 'Job not found' });

    if (segments.length === 2) {
      if (method === 'GET') return json(200, { job });
      if (method === 'DELETE') {
        const ok = autopilotEngine.removeJob(jobId);
        return json(ok ? 200 : 409, { ok });
      }
    }

    if (segments[2] === 'cancel' && method === 'POST') {
      return json(200, { ok: autopilotEngine.cancelJob(jobId) });
    }

    if (segments[2] === 'resume' && method === 'POST') {
      return json(200, { ok: autopilotEngine.resumeJob(jobId) });
    }

    if (segments[2] === 'events' && method === 'GET') {
      handleJobEvents(jobId, emit);
      return json(200, { type: 'subscribed', jobId });
    }
  }

  if (method === 'POST' && path === '/tts') {
    const body = isObject(request.body) ? request.body : {};
    const text = String(body.text ?? '');
    if (!text.trim()) return json(400, { error: 'text is required' });
    const engine = String(body.engine ?? 'capcut');
    const modelId = engine === 'omnivoice' ? 'omnivoice-main'
      : engine === 'vieneu' ? 'vieneu-v3-turbo'
      : engine === 'gemini' ? 'gemini-3.1-flash-tts-preview'
        : 'capcut-online';
    let capcutVoiceType: string | undefined;
    let capcutResourceId: string | undefined;
    if (engine === 'capcut') {
      capcutVoiceType = String(body.voiceType ?? 'BV421_vivn_streaming');
      capcutResourceId = getCapCutVoice(capcutVoiceType)?.resourceId || '';
    }
    const geminiVoiceName = engine === 'gemini'
      ? (String(body.voiceName ?? 'Puck'))
      : undefined;
    if (engine === 'gemini' && !getGeminiVoice(geminiVoiceName ?? '')) {
      return json(400, { error: `Unknown Gemini voice: ${geminiVoiceName ?? ''}` });
    }
    const jobId = `http-tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const result = await window.ttsRuntime?.generate({
        jobId,
        model: {
          id: modelId,
          repository: engine === 'omnivoice' ? 'k2-fsa/OmniVoice'
            : engine === 'vieneu' ? 'pnnbao97/VieNeu-TTS'
            : engine === 'gemini' ? 'https://generativelanguage.googleapis.com'
              : 'https://editor-api-sg.capcutapi.com',
          capability: engine === 'omnivoice' ? 'omnivoice' : engine === 'vieneu' ? 'vieneu' : engine === 'gemini' ? 'gemini' : 'capcut',
        },
        text,
        mode: engine === 'omnivoice' ? 'auto' : 'preset',
        splitMode: 'line',
        language: String(body.language ?? 'vi-VN'),
        capcutVoiceType,
        capcutResourceId,
        geminiVoiceName,
        vieneuVoice: engine === 'vieneu' ? String(body.voiceName ?? 'Trúc Ly') : undefined,
        vieneuStyle: engine === 'vieneu' ? String(body.style ?? 'tu_nhien') as 'tu_nhien' | 'tin_tuc' | 'doc_truyen' : undefined,
      });
      return json(result?.success ? 200 : 500, result);
    } catch (err) {
      return json(500, { success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (method === 'POST' && path === '/transcribe') {
    const body = isObject(request.body) ? request.body : {};
    const audioPath = String(body.audioPath ?? '');
    if (!audioPath) return json(400, { error: 'audioPath is required' });
    const provider = String(body.provider ?? 'openai');
    const apiKey = String(body.apiKey ?? useAutoVideoStore.getState().whisperApiKeys[provider as 'openai' | 'groq'] ?? '');
    if (!apiKey) return json(400, { error: 'apiKey is required (or set whisperApiKeys in app)' });
    const jobId = `http-whisper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await window.whisperRuntime?.transcribe({
      jobId,
      audioPath,
      provider: provider as 'openai' | 'groq',
      apiKey,
      language: String(body.language ?? 'vi'),
    });
    return json(result?.success ? 200 : 500, result);
  }

  if (method === 'POST' && path === '/render') {
    const body = isObject(request.body) ? request.body : {};
    const audioPath = String(body.audioPath ?? '');
    const segments = body.segments;
    if (!audioPath || !Array.isArray(segments) || segments.length === 0) {
      return json(400, { error: 'audioPath and segments[] are required' });
    }
    const jobId = `http-render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await window.autoVideoRuntime?.render({
      jobId,
      audioPath,
      segments: segments as never,
      captionSegments: Array.isArray(body.captionSegments) ? body.captionSegments as never : undefined,
      mediaMode: (body.mediaMode as 'image' | 'video' | undefined) || 'image',
      resolution: (body.resolution as '1280x720' | '1920x1080' | '3840x2160' | undefined) || '1920x1080',
      fps: (body.fps as 24 | 30 | 60 | undefined) || 30,
      codec: (body.codec as 'libx264' | 'libx265' | 'h264_nvenc' | undefined) || 'libx264',
      crf: typeof body.crf === 'number' ? body.crf : 23,
      outputPath: body.outputPath as string | undefined,
      burnSubtitles: typeof body.burnSubtitles === 'boolean' ? body.burnSubtitles : false,
      subtitleFontSize: typeof body.subtitleFontSize === 'number' ? body.subtitleFontSize : 0,
      bgmPath: body.bgmPath as string | undefined,
      bgmVolume: typeof body.bgmVolume === 'number' ? body.bgmVolume : 0.25,
      bgmDuckVoice: typeof body.bgmDuckVoice === 'boolean' ? body.bgmDuckVoice : true,
      audioNormalize: typeof body.audioNormalize === 'boolean' ? body.audioNormalize : false,
      videoAudioVolume: typeof body.videoAudioVolume === 'number' ? body.videoAudioVolume : 0,
    });
    return json(result?.success ? 200 : 500, result);
  }

  if (method === 'POST' && path === '/flow/image') {
    const body = isObject(request.body) ? request.body : {};
    try {
      const { longddProjectId } = await resolveFlowProject();
      const result = await googleFlowProvider.generateImage({
        projectId: longddProjectId,
        sceneId: String(body.sceneId ?? 'http-image'),
        prompt: String(body.prompt ?? ''),
        model: String(body.model ?? 'GEM_PIX_2'),
        aspectRatio: String(body.aspectRatio ?? '16:9'),
        taskId: `http-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return json(200, result);
    } catch (err) {
      return json(500, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (method === 'POST' && path === '/flow/video') {
    const body = isObject(request.body) ? request.body : {};
    try {
      const { flowProjectId, longddProjectId } = await resolveFlowProject();
      const result = await googleFlowProvider.generateVideo({
        projectId: longddProjectId,
        sceneId: String(body.sceneId ?? 'http-video'),
        prompt: String(body.prompt ?? ''),
        model: String(body.model ?? ''),
        aspectRatio: String(body.aspectRatio ?? '16:9'),
        duration: typeof body.duration === 'number' ? body.duration : 6,
        startImage: body.startImage ? { source: String(body.startImage), provider: 'googleflow', flowProjectId } : undefined,
        taskId: `http-vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return json(200, result);
    } catch (err) {
      return json(500, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  void query;
  return json(404, { error: `Not found: ${method} ${path}` });
}

export function registerAutopilotHttpHandler(): void {
  const bridge = window.autopilotBridge;
  if (!bridge) return;
  bridge.onRequest(async (request, emit) => {
    try {
      return await route(request, emit);
    } catch (err) {
      return { status: 500, body: { error: err instanceof Error ? err.message : String(err) } };
    }
  });
}
