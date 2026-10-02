import { useLiveAudio } from './use-live-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { taskMetadata } from '@/shared/task-metadata';
import { toast } from 'sonner';
import { useI18n } from '@/shared/i18n';
import { TTS_MODEL_GROUPS, TTS_MODELS, getTtsModelGroup } from '../lib/model-registry';
import { useTtsStore } from '../stores/tts-store';
import { createTtsJobId, toLocalTtsAudioUrl, toRuntimeModel } from '../lib/runtime-model';
import { CAPCUT_API_VOICES, getCapCutVoice } from '../lib/capcut-voices';
import { GEMINI_VOICES, getGeminiVoice } from '../lib/gemini-voices';
import { useTtsBatch } from './use-tts-batch';
import type { TtsHistoryItem, TtsGenerateResult, TtsModelDefinition, TtsModelStatus, TtsProgressEvent, VieneuVoice, VoiceProfile } from '../types';

/** Model chưa tải: hộp thoại tải model đã mở nên không cần toast thêm. */
const MODEL_NOT_READY = '__tts-model-not-ready__';

function runtimeErrorMessage(error: unknown, t: (key: string) => string, fallbackKey: string) {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/Model TTS (không được phép|is not allowed)/i.test(message)) {
    return t('tts.toast.restartRequired');
  }
  return message || t(fallbackKey);
}

function unavailableStatuses(message: string): Record<string, TtsModelStatus> {
  return Object.fromEntries(TTS_MODELS.map((model) => [model.id, {
    modelId: model.id,
    status: 'not-installed',
    runtimeReady: false,
    pythonAvailable: false,
    message,
  }]));
}

export function useTtsController() {
  const { t } = useI18n();
  const store = useTtsStore();
  const { begin: beginLiveAudio, receive: receiveLiveAudio, stop: stopLiveAudio, playing: livePlaying, blocked: liveBlocked, resume: resumeLiveAudio } = useLiveAudio();
  const [statuses, setStatuses] = useState<Record<string, TtsModelStatus>>({});
  const [destination, setDestination] = useState<'local' | 'colab'>('local');
  const [managerOpen, setManagerOpen] = useState(false);
  const [missingModelOpen, setMissingModelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [referenceAudioPath, setReferenceAudioPath] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [activeJobId, setActiveJobId] = useState<string>();
  const [progress, setProgress] = useState<TtsProgressEvent>();
  const batchRunningRef = useRef(false);
  const [vieneuVoices, setVieneuVoices] = useState<VieneuVoice[]>([
    { id: 'Trúc Ly', label: 'Trúc Ly' },
    { id: 'Minh Đức', label: 'Minh Đức' },
  ]);

  const selectedEngine = getTtsModelGroup(store.selectedEngineId) || TTS_MODEL_GROUPS[0];
  const availableModels = selectedEngine.models;
  const selectedModel = availableModels.find((model) => model.id === store.selectedModelId) || availableModels[0];
  const selectedStatus = statuses[selectedModel.id];
  useEffect(() => { stopLiveAudio(); }, [selectedModel.id, stopLiveAudio]);
  const isCapCut = selectedEngine.id === 'capcut';
  const isGemini = selectedEngine.id === 'gemini';
  const isVbee = selectedEngine.id === 'vbee';
  const isVieneu = selectedEngine.id === 'vieneu';
  const vieneuStatus = statuses['vieneu-v3-turbo']?.status;
  const isOnline = isCapCut || isGemini || isVbee;
  const isNewLocal = selectedModel.runtimeCapability === 'cosyvoice' || selectedModel.runtimeCapability === 'qwen3';
  const supportsLocalStyle = selectedModel.runtimeCapability === 'cosyvoice' || selectedModel.id === 'qwen3-1.7b-custom';
  const mode = isNewLocal
    ? selectedModel.capabilities.includes('voice-clone') ? 'clone'
      : selectedModel.capabilities.includes('voice-design') ? 'design' : 'preset'
    : store.mode;
  const capcutVoices = useMemo(
    () => CAPCUT_API_VOICES.filter((voice) => voice.language === store.capcutLanguage),
    [store.capcutLanguage],
  );
  const selectedCapCutVoice = getCapCutVoice(store.capcutVoiceType);
  const selectedGeminiVoice = getGeminiVoice(store.geminiVoiceName);
  const compatibleProfiles = useMemo(
    () => store.voiceProfiles.filter((profile) => profile.providerId === selectedModel.providerId),
    [selectedModel.providerId, store.voiceProfiles],
  );
  const selectedProfile = store.voiceProfiles.find((profile) => profile.id === store.selectedProfileId);
  const currentModelLabel = isOnline
    ? t(isVbee ? 'tts.vbee.onlineLabel' : isGemini ? 'tts.gemini.onlineLabel' : 'tts.capcut.onlineLabel')
    : `${selectedModel.parameterSize} • ${t(`tts.mode.${mode}`)}`;

  const refreshStatuses = useCallback(async () => {
    if (!window.ttsRuntime) {
      setStatuses(unavailableStatuses(t('tts.runtime.desktopOnly')));
      return;
    }
    try {
      const result = await window.ttsRuntime.getModelStatuses(TTS_MODELS.map(toRuntimeModel));
      setStatuses(Object.fromEntries(result.map((item) => [item.modelId, item])));
    } catch (error) {
      const message = runtimeErrorMessage(error, t, 'tts.toast.statusFailed');
      setStatuses(unavailableStatuses(message));
      toast.error(message);
    }
  }, [t]);

  useEffect(() => { void refreshStatuses(); }, [refreshStatuses]);

  useEffect(() => {
    if (!isVieneu) return;
    void window.ttsRuntime?.getVieneuVoices().then((result) => {
      if (result.success && result.voices.length) setVieneuVoices(result.voices);
    }).catch(() => { /* Keep fallback voices if the runtime is unavailable. */ });
  }, [isVieneu, vieneuStatus]);

  useEffect(() => window.ttsRuntime?.onEvent((event) => {
    setProgress(event);
    receiveLiveAudio(event);
  }), [receiveLiveAudio]);

  useEffect(() => {
    if (!availableModels.some((model) => model.id === store.selectedModelId)) {
      store.setSelectedModelId(availableModels[0].id);
    }
  }, [availableModels, store.selectedModelId, store.setSelectedModelId]);

  useEffect(() => {
    if (isVieneu && mode !== 'clone' && mode !== 'preset') store.setMode('preset');
    if (!isNewLocal && !isVieneu && !isOnline && mode === 'preset') store.setMode('auto');
  }, [isNewLocal, isOnline, isVieneu, mode, store.setMode]);

  useEffect(() => {
    if (!isCapCut || capcutVoices.some((voice) => voice.voiceType === store.capcutVoiceType)) return;
    store.setCapcutVoiceType(capcutVoices[0]?.voiceType || 'BV421_vivn_streaming');
  }, [capcutVoices, isCapCut, store.capcutVoiceType, store.setCapcutVoiceType]);

  useEffect(() => {
    if (store.selectedProfileId && !compatibleProfiles.some((profile) => profile.id === store.selectedProfileId)) {
      store.setSelectedProfileId(undefined);
    }
  }, [compatibleProfiles, store.selectedProfileId, store.setSelectedProfileId]);

  useEffect(() => {
    const hasStatuses = Object.keys(statuses).length > 0;
    if (destination === 'local' && !isOnline && !store.hasSeenModelPrompt && hasStatuses && selectedStatus?.status !== 'ready') setMissingModelOpen(true);
  }, [destination, isOnline, selectedStatus, statuses, store.hasSeenModelPrompt]);

  const selectEngine = useCallback((engineId: string) => {
    const engine = getTtsModelGroup(engineId);
    if (!engine) return;
    store.setSelectedEngineId(engine.id);
    store.setSelectedModelId(engine.models[0].id);
    if (engine.id === 'vieneu' && store.mode !== 'clone' && store.mode !== 'preset') store.setMode('preset');
    if (engine.id === 'omnivoice' && store.mode === 'preset') store.setMode('auto');
    if (engine.models[0].runtimeKind === 'online') setMissingModelOpen(false);
  }, [store.mode, store.setMode, store.setSelectedEngineId, store.setSelectedModelId]);

  const installModel = useCallback(async (model = selectedModel) => {
    if (activeJobId || batchRunningRef.current) return toast.info(t('tts.toast.jobBusy'));
    if (!window.ttsRuntime) return toast.error(t('tts.toast.desktopDownload'));

    const jobId = createTtsJobId('install');
    setActiveJobId(jobId);
    setProgress({ jobId, kind: 'install', stage: 'starting', percent: 1, message: t('tts.toast.preparing') });
    setStatuses((current) => ({
      ...current,
      [model.id]: {
        ...(current[model.id] || { modelId: model.id, runtimeReady: false, pythonAvailable: false }),
        status: 'downloading',
      },
    }));

    try {
      const result = await window.ttsRuntime.installModel({ jobId, model: toRuntimeModel(model) });
      if (result.success) toast.success(t('tts.toast.modelReady', { model: model.name }));
      else if (!result.canceled) toast.error(result.error || t('tts.toast.downloadFailed'));
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, 'tts.toast.downloadFailed'));
    } finally {
      setActiveJobId(undefined);
      await refreshStatuses();
    }
  }, [activeJobId, refreshStatuses, selectedModel, t]);

  const removeModel = useCallback(async (model: TtsModelDefinition) => {
    if (!window.confirm(t('tts.confirm.removeModel', { model: model.name }))) return;
    const result = await window.ttsRuntime?.removeModel(model.id);
    if (result?.success) toast.success(t('tts.toast.modelRemoved'));
    else toast.error(result?.error || t('tts.toast.removeFailed'));
    await refreshStatuses();
  }, [refreshStatuses, t]);

  const pickReferenceAudio = useCallback(async () => {
    const result = await window.ttsRuntime?.pickReferenceAudio(t('tts.native.selectReferenceAudio'));
    if (result?.path) setReferenceAudioPath(result.path);
  }, [t]);

  const saveProfile = useCallback(() => {
    if (!profileName.trim() || !referenceAudioPath || (!isVieneu && !isNewLocal && !referenceText.trim())) {
      toast.error(t('tts.toast.profileRequiredFields'));
      return;
    }
    const profile: VoiceProfile = {
      id: createTtsJobId('voice'),
      name: profileName.trim(),
      providerId: selectedModel.providerId,
      modelId: selectedModel.id,
      referenceAudioPath,
      referenceText: referenceText.trim(),
      createdAt: Date.now(),
    };
    store.addVoiceProfile(profile);
    setProfileOpen(false);
    setProfileName('');
    setReferenceAudioPath('');
    setReferenceText('');
    toast.success(t('tts.toast.profileSaved'));
  }, [isNewLocal, isVieneu, profileName, referenceAudioPath, referenceText, selectedModel, store.addVoiceProfile, t]);

  const reuseDesignedVoice = useCallback((item: TtsHistoryItem) => {
    if (activeJobId || batchRunningRef.current) return toast.info(t('tts.toast.jobBusy'));
    if (item.modelId !== 'qwen3-1.7b-design') return;
    const target = ['qwen3-0.6b-base', 'qwen3-1.7b-base'].find((id) => statuses[id]?.status === 'ready') || 'qwen3-0.6b-base';
    const profile: VoiceProfile = {
      id: `designed-${item.id}`, name: item.name || item.text.slice(0, 60), providerId: 'qwen3-local',
      modelId: target, referenceAudioPath: item.outputPath, referenceText: item.text, createdAt: Date.now(),
    };
    store.setSelectedEngineId('qwen3');
    store.setSelectedModelId(target);
    store.addVoiceProfile(profile);
    toast.success(t('tts.local.designSaved'));
  }, [activeJobId, statuses, store, t]);

  const voiceLabel = isNewLocal && mode === 'preset' ? store.qwenSpeaker : isCapCut
    ? selectedCapCutVoice?.displayName || 'CapCut'
    : isGemini ? selectedGeminiVoice?.name || 'Gemini'
      : isVbee ? store.vbeeVoiceName.trim() || 'Vbee'
        : isVieneu && mode === 'preset' ? store.vieneuVoice
          : mode === 'clone' ? selectedProfile?.name || t('tts.settings.cloneMode') : t(`tts.mode.${mode}`);

  /** Trả về thông báo lỗi nếu chưa tạo được giọng, null nếu cấu hình hợp lệ. */
  const validateGeneration = useCallback((): string | null => {
    if (!window.ttsRuntime) return t('tts.toast.desktopOnly');
    if (!isOnline && selectedStatus?.status !== 'ready') {
      setMissingModelOpen(true);
      return MODEL_NOT_READY;
    }
    if (!isOnline && mode === 'clone' && !selectedProfile) return t('tts.toast.profileRequired');
    if (!isOnline && !isVieneu && mode === 'design' && !store.instruction.trim()) return t('tts.toast.instructionRequired');
    if (isCapCut && !selectedCapCutVoice) return t('tts.capcut.voiceRequired');
    if (isGemini && !selectedGeminiVoice) return t('tts.gemini.voiceRequired');
    if (isVbee && !store.vbeeVoiceCode.trim()) return t('tts.vbee.voiceRequired');
    return null;
  }, [isCapCut, isGemini, isOnline, isVbee, isVieneu, mode, selectedCapCutVoice, selectedGeminiVoice, selectedProfile, selectedStatus, store.instruction, store.vbeeVoiceCode, t]);

  const buildGeneratePayload = useCallback((jobId: string, text: string) => ({
    jobId,
    model: toRuntimeModel(selectedModel),
    text,
    mode: (isOnline ? 'preset' : mode) as typeof mode,
    splitMode: store.splitMode,
    language: isNewLocal ? store.localLanguage : isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
    speed: isNewLocal ? 1 : store.speed,
    numStep: store.numStep,
    advancedSettings: store.advancedEnabled ? store.advancedSettings : undefined,
    capcutVoiceType: isCapCut ? selectedCapCutVoice?.voiceType : undefined,
    capcutResourceId: isCapCut ? selectedCapCutVoice?.resourceId : undefined,
    geminiVoiceName: isGemini ? selectedGeminiVoice?.name : undefined,
    geminiStyle: isGemini ? store.geminiStyle.trim() : undefined,
    geminiTemperature: isGemini ? store.geminiTemperature : undefined,
    vbeeVoiceCode: isVbee ? store.vbeeVoiceCode.trim() : undefined,
    vbeeAudioType: isVbee ? store.vbeeAudioType : undefined,
    vbeeBitrate: isVbee ? store.vbeeBitrate : undefined,
    localStyle: supportsLocalStyle ? store.localStyle.trim() : undefined,
    streamPreview: selectedModel.runtimeCapability === 'cosyvoice' && store.streamPreview && !batchRunningRef.current,
    qwenSpeaker: selectedModel.runtimeCapability === 'qwen3' ? store.qwenSpeaker : undefined,
    vieneuVoice: isVieneu ? store.vieneuVoice : undefined,
    vieneuStyle: isVieneu ? store.vieneuStyle : undefined,
    instruction: mode === 'design' ? store.instruction.trim() : undefined,
    profileId: mode === 'clone' ? selectedProfile?.id : undefined,
    referenceAudioPath: selectedProfile?.referenceAudioPath,
    referenceText: selectedProfile?.referenceText,
  }), [supportsLocalStyle, store.localStyle, store.streamPreview, isNewLocal, store.localLanguage, store.qwenSpeaker, isCapCut, isGemini, isOnline, isVbee, isVieneu, mode, selectedCapCutVoice, selectedGeminiVoice, selectedModel, selectedProfile, store.advancedEnabled, store.advancedSettings, store.capcutLanguage, store.geminiLanguage, store.geminiStyle, store.geminiTemperature, store.instruction, store.language, store.numStep, store.speed, store.splitMode, store.vbeeAudioType, store.vbeeBitrate, store.vbeeVoiceCode, store.vieneuStyle, store.vieneuVoice]);

  /** Chạy một job và giữ khoá tác vụ; dùng chung cho nút tạo giọng và đọc hàng loạt. */
  const runGeneration = useCallback(async (jobId: string, text: string): Promise<TtsGenerateResult> => {
    beginLiveAudio(jobId);
    setActiveJobId(jobId);
    setProgress({ jobId, kind: 'generate', stage: 'starting', percent: 2, message: t('tts.toast.preparing') });
    try {
      const result = await window.ttsRuntime!.generate(buildGeneratePayload(jobId, text));
      // Local workers can discover Apple GPU support on their first request.
      if (isNewLocal && selectedStatus?.accelerator !== 'mlx' && selectedStatus?.accelerator !== 'mps') void refreshStatuses();
      if (!result.success) stopLiveAudio();
      return result;
    } catch (error) {
      stopLiveAudio();
      throw error;
    } finally {
      setActiveJobId(undefined);
    }
  }, [beginLiveAudio, stopLiveAudio, buildGeneratePayload, refreshStatuses, isNewLocal, selectedStatus?.accelerator, t]);

  const validateBatch = useCallback(() => {
    const invalid = validateGeneration();
    return invalid === MODEL_NOT_READY ? t('tts.batch.modelNotReady') : invalid;
  }, [t, validateGeneration]);

  const batch = useTtsBatch({ isOnline, validate: validateBatch, runGeneration });
  batchRunningRef.current = batch.running;
  const busy = Boolean(activeJobId) || batch.running;

  const cancelJob = useCallback(async () => {
    stopLiveAudio();
    batch.requestStop();
    if (!activeJobId) return;
    await window.ttsRuntime?.cancel(activeJobId);
    setActiveJobId(undefined);
    await refreshStatuses();
    toast.info(t('tts.toast.cancelRequested'));
  }, [stopLiveAudio, activeJobId, batch.requestStop, refreshStatuses, t]);

  const generate = useCallback(async () => {
    const text = store.text.trim();
    if (!text) return toast.error(t('tts.toast.textRequired'));
    const invalid = validateGeneration();
    if (invalid) {
      if (invalid !== MODEL_NOT_READY) toast.error(invalid);
      return;
    }

    const jobId = createTtsJobId('generate');
    const queuedAt = Date.now();
    taskMetadata.begin({
      id: jobId, kind: 'tts', status: 'queued', queuedAt,
      title: text.slice(0, 80), provider: selectedModel.providerId, model: selectedModel.id,
      prompt: text, instruction: mode === 'design' ? store.instruction.trim() : undefined,
      details: {
        voice: voiceLabel, mode: isOnline ? 'preset' : mode,
        language: isNewLocal ? store.localLanguage : isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
        speed: isNewLocal ? 1 : store.speed, splitMode: store.splitMode,
      },
    });
    let result;
    try {
      taskMetadata.submitted(jobId);
      result = await runGeneration(jobId, text);
    } catch (error) {
      taskMetadata.failed(jobId, error);
      toast.error(runtimeErrorMessage(error, t, 'tts.toast.generateFailed'));
      return;
    }
    if (!result.success || !result.outputPath) {
      taskMetadata.failed(jobId, result.error || (result.canceled ? 'Cancelled' : 'TTS generation failed'));
      if (!result.canceled) toast.error(result.error || t('tts.toast.generateFailed'));
      return;
    }
    taskMetadata.completed(jobId, result.outputPath, {
      voice: voiceLabel,
      mode: isOnline ? 'preset' : mode,
      language: isNewLocal ? store.localLanguage : isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
      speed: isNewLocal ? 1 : store.speed,
      splitMode: store.splitMode,
      durationSeconds: result.durationSec,
      sampleRate: result.sampleRate,
    });
    store.addHistory({
      id: jobId,
      name: text.slice(0, 80),
      modelId: selectedModel.id,
      text,
      mode: isOnline ? 'preset' : mode,
      voiceLabel,
      outputPath: result.outputPath,
      createdAt: Date.now(),
    });
    store.setText('');
    toast.success(t('tts.toast.audioCreated'));
  }, [isNewLocal, store.localLanguage, isCapCut, isGemini, isOnline, mode, runGeneration, selectedModel, store.addHistory, store.capcutLanguage, store.geminiLanguage, store.instruction, store.language, store.speed, store.splitMode, store.setText, store.text, t, validateGeneration, voiceLabel]);

  const previewCapCutVoice = useCallback(async () => {
    if (!isCapCut || !selectedCapCutVoice) return;
    if (activeJobId || batchRunningRef.current) return toast.info(t('tts.toast.jobBusy'));
    if (!window.ttsRuntime) return toast.error(t('tts.toast.desktopOnly'));
    const samples: Record<string, string> = {
      'vi-VN': 'Xin chào, đây là giọng đọc mẫu của tôi.',
      'en-US': 'Hello, this is a preview of my voice.',
      'ja-JP': 'こんにちは、これは音声サンプルです。',
      'zh-CN': '你好，这是我的语音示例。',
      'es-ES': 'Hola, esta es una muestra de mi voz.',
      'fr-FR': 'Bonjour, voici un aperçu de ma voix.',
      'de-DE': 'Hallo, dies ist eine Vorschau meiner Stimme.',
      'pt-BR': 'Olá, esta é uma amostra da minha voz.',
      'th-TH': 'สวัสดี นี่คือตัวอย่างเสียงของฉัน',
      'id-ID': 'Halo, ini adalah contoh suara saya.',
    };
    const jobId = createTtsJobId('generate');
    setActiveJobId(jobId);
    setProgress({ jobId, kind: 'generate', stage: 'starting', percent: 2, message: t('tts.capcut.previewing') });
    try {
      const result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: samples[store.capcutLanguage] || samples['en-US'],
        mode: 'preset',
        language: store.capcutLanguage,
        speed: store.speed,
        capcutVoiceType: selectedCapCutVoice.voiceType,
        capcutResourceId: selectedCapCutVoice.resourceId,
      });
      if (!result.success || !result.outputPath) {
        if (!result.canceled) toast.error(result.error || t('tts.toast.generateFailed'));
        return;
      }
      await new Audio(toLocalTtsAudioUrl(result.outputPath)).play();
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, 'tts.toast.generateFailed'));
    } finally {
      setActiveJobId(undefined);
    }
  }, [activeJobId, isCapCut, selectedCapCutVoice, selectedModel, store.capcutLanguage, store.speed, t]);

  const previewGeminiVoice = useCallback(async () => {
    if (!isGemini || !selectedGeminiVoice) return;
    if (activeJobId || batchRunningRef.current) return toast.info(t('tts.toast.jobBusy'));
    if (!window.ttsRuntime) return toast.error(t('tts.toast.desktopOnly'));
    const samples: Record<string, string> = {
      'vi-VN': 'Xin chào, đây là bản nghe thử giọng đọc Gemini của tôi.',
      'en-US': 'Hello, this is a preview of my Gemini voice.',
    };
    const jobId = createTtsJobId('generate');
    setActiveJobId(jobId);
    setProgress({ jobId, kind: 'generate', stage: 'starting', percent: 2, message: t('tts.gemini.previewing') });
    try {
      const result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: samples[store.geminiLanguage] || samples['en-US'],
        mode: 'preset',
        language: store.geminiLanguage,
        geminiVoiceName: selectedGeminiVoice.name,
        geminiStyle: store.geminiStyle.trim(),
        geminiTemperature: store.geminiTemperature,
      });
      if (!result.success || !result.outputPath) {
        if (!result.canceled) toast.error(result.error || t('tts.toast.generateFailed'));
        return;
      }
      await new Audio(toLocalTtsAudioUrl(result.outputPath)).play();
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, 'tts.toast.generateFailed'));
    } finally {
      setActiveJobId(undefined);
    }
  }, [activeJobId, isGemini, selectedGeminiVoice, selectedModel, store.geminiLanguage, store.geminiStyle, store.geminiTemperature, t]);

  const closeMissingModelPrompt = useCallback(() => {
    store.markModelPromptSeen();
    setMissingModelOpen(false);
  }, [store.markModelPromptSeen]);

  const installSelectedModelFromPrompt = useCallback(() => {
    closeMissingModelPrompt();
    void installModel(selectedModel);
  }, [closeMissingModelPrompt, installModel, selectedModel]);

  return {
    destination, setDestination, buildGeneratePayload, voiceLabel, addHistory: store.addHistory,
    statuses, engineGroups: TTS_MODEL_GROUPS, selectedEngine, availableModels, selectedModel, selectedStatus, isCapCut, isGemini, isVbee, isVieneu, isOnline, mode, compatibleProfiles, selectedProfile,
    capcutVoices, selectedCapCutVoice,
    geminiVoices: GEMINI_VOICES, selectedGeminiVoice,
    currentModelLabel, activeJobId, progress, busy, batch,
    managerOpen, setManagerOpen, missingModelOpen, setMissingModelOpen,
    profileOpen, setProfileOpen, profileName, setProfileName,
    referenceAudioPath, referenceText, setReferenceText,
    text: store.text, setText: store.setText,
    instruction: store.instruction, setInstruction: store.setInstruction,
    setMode: store.setMode,
    language: store.language, setLanguage: store.setLanguage,
    savedLanguages: store.savedLanguages,
    addSavedLanguage: store.addSavedLanguage,
    removeSavedLanguage: store.removeSavedLanguage,
    speed: isNewLocal ? 1 : store.speed, setSpeed: store.setSpeed,
    numStep: store.numStep, setNumStep: store.setNumStep,
    splitMode: store.splitMode, setSplitMode: store.setSplitMode,
    capcutLanguage: store.capcutLanguage, setCapcutLanguage: store.setCapcutLanguage,
    capcutVoiceType: store.capcutVoiceType, setCapcutVoiceType: store.setCapcutVoiceType,
    geminiLanguage: store.geminiLanguage, setGeminiLanguage: store.setGeminiLanguage,
    geminiVoiceName: store.geminiVoiceName, setGeminiVoiceName: store.setGeminiVoiceName,
    geminiStyle: store.geminiStyle, setGeminiStyle: store.setGeminiStyle,
    geminiTemperature: store.geminiTemperature, setGeminiTemperature: store.setGeminiTemperature,
    vbeeVoiceCode: store.vbeeVoiceCode, setVbeeVoiceCode: store.setVbeeVoiceCode,
    vbeeVoiceName: store.vbeeVoiceName, setVbeeVoiceName: store.setVbeeVoiceName,
    vbeeAudioType: store.vbeeAudioType, setVbeeAudioType: store.setVbeeAudioType,
    vbeeBitrate: store.vbeeBitrate, setVbeeBitrate: store.setVbeeBitrate,
    reuseDesignedVoice, supportsLocalStyle,
    stopLiveAudio, livePlaying, liveBlocked, resumeLiveAudio,
    localStyle: store.localStyle, setLocalStyle: store.setLocalStyle,
    streamPreview: store.streamPreview, setStreamPreview: store.setStreamPreview,
    localLanguage: store.localLanguage, setLocalLanguage: store.setLocalLanguage,
    qwenSpeaker: store.qwenSpeaker, setQwenSpeaker: store.setQwenSpeaker,
    vieneuVoices, vieneuVoice: store.vieneuVoice, setVieneuVoice: store.setVieneuVoice,
    vieneuStyle: store.vieneuStyle, setVieneuStyle: store.setVieneuStyle,
    advancedEnabled: store.advancedEnabled, setAdvancedEnabled: store.setAdvancedEnabled,
    advancedSettings: store.advancedSettings, setAdvancedSetting: store.setAdvancedSetting,
    resetAdvancedSettings: store.resetAdvancedSettings,
    selectedEngineId: store.selectedEngineId, setSelectedEngineId: selectEngine,
    selectedModelId: store.selectedModelId, setSelectedModelId: store.setSelectedModelId,
    selectedProfileId: store.selectedProfileId, setSelectedProfileId: store.setSelectedProfileId,
    history: store.history, renameHistory: store.renameHistory, removeHistory: store.removeHistory,
    removeVoiceProfile: store.removeVoiceProfile,
    installModel, removeModel, cancelJob, pickReferenceAudio, saveProfile, generate, previewCapCutVoice, previewGeminiVoice,
    closeMissingModelPrompt, installSelectedModelFromPrompt,
  };
}

export type TtsController = ReturnType<typeof useTtsController>;
