import { useCallback, useEffect, useMemo, useState } from 'react';
import { taskMetadata } from '@/shared/task-metadata';
import { toast } from 'sonner';
import { useI18n } from '@/shared/i18n';
import { TTS_MODEL_GROUPS, TTS_MODELS, getTtsModelGroup } from '../lib/model-registry';
import { useTtsStore } from '../stores/tts-store';
import { createTtsJobId, toLocalTtsAudioUrl, toRuntimeModel } from '../lib/runtime-model';
import { CAPCUT_API_VOICES, getCapCutVoice } from '../lib/capcut-voices';
import { GEMINI_VOICES, getGeminiVoice } from '../lib/gemini-voices';
import type { TtsModelDefinition, TtsModelStatus, TtsProgressEvent, VieneuVoice, VoiceProfile } from '../types';

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
  const [statuses, setStatuses] = useState<Record<string, TtsModelStatus>>({});
  const [managerOpen, setManagerOpen] = useState(false);
  const [missingModelOpen, setMissingModelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [referenceAudioPath, setReferenceAudioPath] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [activeJobId, setActiveJobId] = useState<string>();
  const [progress, setProgress] = useState<TtsProgressEvent>();
  const [vieneuVoices, setVieneuVoices] = useState<VieneuVoice[]>([
    { id: 'Trúc Ly', label: 'Trúc Ly' },
    { id: 'Minh Đức', label: 'Minh Đức' },
  ]);

  const selectedEngine = getTtsModelGroup(store.selectedEngineId) || TTS_MODEL_GROUPS[0];
  const availableModels = selectedEngine.models;
  const selectedModel = availableModels.find((model) => model.id === store.selectedModelId) || availableModels[0];
  const selectedStatus = statuses[selectedModel.id];
  const isCapCut = selectedEngine.id === 'capcut';
  const isGemini = selectedEngine.id === 'gemini';
  const isVbee = selectedEngine.id === 'vbee';
  const isVieneu = selectedEngine.id === 'vieneu';
  const isOnline = isCapCut || isGemini || isVbee;
  const mode = store.mode;
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
  const busy = Boolean(activeJobId);
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
    if (!isVieneu || statuses['vieneu-v3-turbo']?.status !== 'ready') return;
    void window.ttsRuntime?.getVieneuVoices().then((result) => {
      if (result.success && result.voices.length) setVieneuVoices(result.voices);
    });
  }, [isVieneu, statuses]);

  useEffect(() => window.ttsRuntime?.onEvent(setProgress), []);

  useEffect(() => {
    if (!availableModels.some((model) => model.id === store.selectedModelId)) {
      store.setSelectedModelId(availableModels[0].id);
    }
  }, [availableModels, store.selectedModelId, store.setSelectedModelId]);

  useEffect(() => {
    if (isVieneu && mode !== 'clone' && mode !== 'preset') store.setMode('preset');
    if (!isVieneu && !isOnline && mode === 'preset') store.setMode('auto');
  }, [isOnline, isVieneu, mode, store.setMode]);

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
    if (!isOnline && !store.hasSeenModelPrompt && hasStatuses && selectedStatus?.status !== 'ready') setMissingModelOpen(true);
  }, [isOnline, selectedStatus, statuses, store.hasSeenModelPrompt]);

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
    if (activeJobId) return toast.info(t('tts.toast.jobBusy'));
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

  const cancelJob = useCallback(async () => {
    if (!activeJobId) return;
    await window.ttsRuntime?.cancel(activeJobId);
    setActiveJobId(undefined);
    await refreshStatuses();
    toast.info(t('tts.toast.cancelRequested'));
  }, [activeJobId, refreshStatuses, t]);

  const pickReferenceAudio = useCallback(async () => {
    const result = await window.ttsRuntime?.pickReferenceAudio(t('tts.native.selectReferenceAudio'));
    if (result?.path) setReferenceAudioPath(result.path);
  }, [t]);

  const saveProfile = useCallback(() => {
    if (!profileName.trim() || !referenceAudioPath || (!isVieneu && !referenceText.trim())) {
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
  }, [isVieneu, profileName, referenceAudioPath, referenceText, selectedModel, store.addVoiceProfile, t]);

  const generate = useCallback(async () => {
    if (!store.text.trim()) return toast.error(t('tts.toast.textRequired'));
    if (!isOnline && selectedStatus?.status !== 'ready') {
      setMissingModelOpen(true);
      return;
    }
    if (!isOnline && mode === 'clone' && !selectedProfile) return toast.error(t('tts.toast.profileRequired'));
    if (!isOnline && !isVieneu && mode === 'design' && !store.instruction.trim()) return toast.error(t('tts.toast.instructionRequired'));
    if (isCapCut && !selectedCapCutVoice) return toast.error(t('tts.capcut.voiceRequired'));
    if (isGemini && !selectedGeminiVoice) return toast.error(t('tts.gemini.voiceRequired'));
    if (isVbee && !store.vbeeVoiceCode.trim()) return toast.error(t('tts.vbee.voiceRequired'));
    if (!window.ttsRuntime) return toast.error(t('tts.toast.desktopOnly'));

    const jobId = createTtsJobId('generate');
    const queuedAt = Date.now();
    const voiceLabel = isCapCut
      ? selectedCapCutVoice?.displayName || 'CapCut'
      : isGemini ? selectedGeminiVoice?.name || 'Gemini'
        : isVbee ? store.vbeeVoiceName.trim() || 'Vbee'
          : isVieneu && mode === 'preset' ? store.vieneuVoice
            : mode === 'clone' ? selectedProfile?.name || t('tts.settings.cloneMode') : t(`tts.mode.${mode}`);
    taskMetadata.begin({
      id: jobId, kind: 'tts', status: 'queued', queuedAt,
      title: store.text.trim().slice(0, 80), provider: selectedModel.providerId, model: selectedModel.id,
      prompt: store.text.trim(), instruction: mode === 'design' ? store.instruction.trim() : undefined,
      details: {
        voice: voiceLabel, mode: isOnline ? 'preset' : mode,
        language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
        speed: store.speed, splitMode: store.splitMode,
      },
    });
    setActiveJobId(jobId);
    setProgress({ jobId, kind: 'generate', stage: 'starting', percent: 2, message: t('tts.toast.preparing') });
    let result;
    try {
      taskMetadata.submitted(jobId);
      result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: store.text.trim(),
        mode: isOnline ? 'preset' : mode,
        splitMode: store.splitMode,
        language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
        speed: store.speed,
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
        vieneuVoice: isVieneu ? store.vieneuVoice : undefined,
        vieneuStyle: isVieneu ? store.vieneuStyle : undefined,
        instruction: mode === 'design' ? store.instruction.trim() : undefined,
        profileId: mode === 'clone' ? selectedProfile?.id : undefined,
        referenceAudioPath: selectedProfile?.referenceAudioPath,
        referenceText: selectedProfile?.referenceText,
      });
    } catch (error) {
      taskMetadata.failed(jobId, error);
      toast.error(runtimeErrorMessage(error, t, 'tts.toast.generateFailed'));
      return;
    } finally {
      setActiveJobId(undefined);
    }
    if (!result.success || !result.outputPath) {
      taskMetadata.failed(jobId, result.error || (result.canceled ? 'Cancelled' : 'TTS generation failed'));
      if (!result.canceled) toast.error(result.error || t('tts.toast.generateFailed'));
      return;
    }
    taskMetadata.completed(jobId, result.outputPath, {
      voice: voiceLabel,
      mode: isOnline ? 'preset' : mode,
      language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
      speed: store.speed,
      splitMode: store.splitMode,
      durationSeconds: result.durationSec,
      sampleRate: result.sampleRate,
    });
    store.addHistory({
      id: jobId,
      name: store.text.trim().slice(0, 80),
      modelId: selectedModel.id,
      text: store.text.trim(),
      mode: isOnline ? 'preset' : mode,
      voiceLabel,
      outputPath: result.outputPath,
      createdAt: Date.now(),
    });
    store.setText('');
    toast.success(t('tts.toast.audioCreated'));
  }, [isCapCut, isGemini, isOnline, isVbee, isVieneu, mode, selectedCapCutVoice, selectedGeminiVoice, selectedModel, selectedProfile, selectedStatus, store.addHistory, store.advancedEnabled, store.advancedSettings, store.capcutLanguage, store.geminiLanguage, store.geminiStyle, store.geminiTemperature, store.instruction, store.language, store.numStep, store.speed, store.splitMode, store.setText, store.text, store.vbeeAudioType, store.vbeeBitrate, store.vbeeVoiceCode, store.vbeeVoiceName, store.vieneuStyle, store.vieneuVoice, t]);

  const previewCapCutVoice = useCallback(async () => {
    if (!isCapCut || !selectedCapCutVoice) return;
    if (activeJobId) return toast.info(t('tts.toast.jobBusy'));
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
    if (activeJobId) return toast.info(t('tts.toast.jobBusy'));
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
    statuses, engineGroups: TTS_MODEL_GROUPS, selectedEngine, availableModels, selectedModel, selectedStatus, isCapCut, isGemini, isVbee, isVieneu, isOnline, mode, compatibleProfiles, selectedProfile,
    capcutVoices, selectedCapCutVoice,
    geminiVoices: GEMINI_VOICES, selectedGeminiVoice,
    currentModelLabel, activeJobId, progress, busy,
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
    speed: store.speed, setSpeed: store.setSpeed,
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
