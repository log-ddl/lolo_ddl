import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { a as useI18n, t as toast, B as Button, I as Input, E as AlertDialog, G as AlertDialogTrigger, H as AlertDialogContent, J as AlertDialogHeader, K as AlertDialogTitle, L as AlertDialogDescription, M as AlertDialogFooter, N as AlertDialogCancel, O as AlertDialogAction, F as FeatureRail, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, y as DialogDescription, k as DialogFooter } from "./index-ld1jMZXM.js";
import { r as reactExports, Z as Pause, _ as Play, aO as VolumeX, aP as Volume2, aQ as FileHeadphone, a3 as Check, X, P as Pencil, a7 as FolderOpen, D as Download, d as Trash2, aR as Clock3, af as Search, aB as RotateCcw, L as LoaderCircle, aC as Square, A as AudioLines, i as Settings, K as Plus, aS as Earth, aT as Wifi, aU as Cloud, W as WandSparkles, q as RefreshCw, aV as Star, aW as Cpu, aX as MicVocal, aY as UserRoundPlus, aZ as Sparkles, j as Languages, a_ as Gauge, aE as SlidersHorizontal, N as ChevronDown, t as CircleCheck, a$ as HardDrive, aH as KeyRound, c as Save } from "./lucide-react-DHCwBhKI.js";
import { b as getTtsModelGroup, T as TTS_MODEL_GROUPS, C as CAPCUT_API_VOICES, g as getCapCutVoice, c as TTS_MODELS, t as taskMetadata, a as getTtsModel, d as CAPCUT_LANGUAGES } from "./model-registry-C5c6bagc.js";
import { u as useTtsStore, s as searchOmniVoiceLanguages, O as OMNIVOICE_LANGUAGE_COUNT } from "./omnivoice-languages-BOAnY_r-.js";
import { g as getGeminiVoice, G as GEMINI_VOICES, a as GEMINI_LANGUAGES, b as GEMINI_AUDIO_TAGS } from "./gemini-voices-CGiUf3fL.js";
import { L as Label } from "./label-DOUrVQeY.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-ZlGxq1Za.js";
import { T as TaskInfoButton } from "./task-info-button-Dug1kt_w.js";
import { P as Progress } from "./progress-CoGwezcY.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import { F as FeatureHeaderIcon } from "./FeatureHeaderIcon-DurhyC1w.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-BVeKrXwK.js";
import { S as Switch } from "./switch-D859FYwM.js";
import { B as Badge } from "./badge-DGXWRPZx.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
function createTtsJobId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function toRuntimeModel(model) {
  return {
    id: model.id,
    repository: model.repository,
    capability: model.runtimeCapability
  };
}
function toLocalTtsAudioUrl(outputPath) {
  const filename = outputPath.split(/[\\/]/).pop() || "";
  return `local-tts://audio/${encodeURIComponent(filename)}`;
}
function runtimeErrorMessage(error, t, fallbackKey) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/Model TTS (không được phép|is not allowed)/i.test(message)) {
    return t("tts.toast.restartRequired");
  }
  return message || t(fallbackKey);
}
function unavailableStatuses(message) {
  return Object.fromEntries(TTS_MODELS.map((model) => [model.id, {
    modelId: model.id,
    status: "not-installed",
    runtimeReady: false,
    pythonAvailable: false,
    message
  }]));
}
function useTtsController() {
  const { t } = useI18n();
  const store = useTtsStore();
  const [statuses, setStatuses] = reactExports.useState({});
  const [managerOpen, setManagerOpen] = reactExports.useState(false);
  const [missingModelOpen, setMissingModelOpen] = reactExports.useState(false);
  const [profileOpen, setProfileOpen] = reactExports.useState(false);
  const [profileName, setProfileName] = reactExports.useState("");
  const [referenceAudioPath, setReferenceAudioPath] = reactExports.useState("");
  const [referenceText, setReferenceText] = reactExports.useState("");
  const [activeJobId, setActiveJobId] = reactExports.useState();
  const [progress, setProgress] = reactExports.useState();
  const [vieneuVoices, setVieneuVoices] = reactExports.useState([
    { id: "Trúc Ly", label: "Trúc Ly" },
    { id: "Minh Đức", label: "Minh Đức" }
  ]);
  const selectedEngine = getTtsModelGroup(store.selectedEngineId) || TTS_MODEL_GROUPS[0];
  const availableModels = selectedEngine.models;
  const selectedModel = availableModels.find((model) => model.id === store.selectedModelId) || availableModels[0];
  const selectedStatus = statuses[selectedModel.id];
  const isCapCut = selectedEngine.id === "capcut";
  const isGemini = selectedEngine.id === "gemini";
  const isVbee = selectedEngine.id === "vbee";
  const isVieneu = selectedEngine.id === "vieneu";
  const isOnline = isCapCut || isGemini || isVbee;
  const mode = store.mode;
  const capcutVoices = reactExports.useMemo(
    () => CAPCUT_API_VOICES.filter((voice) => voice.language === store.capcutLanguage),
    [store.capcutLanguage]
  );
  const selectedCapCutVoice = getCapCutVoice(store.capcutVoiceType);
  const selectedGeminiVoice = getGeminiVoice(store.geminiVoiceName);
  const compatibleProfiles = reactExports.useMemo(
    () => store.voiceProfiles.filter((profile) => profile.providerId === selectedModel.providerId),
    [selectedModel.providerId, store.voiceProfiles]
  );
  const selectedProfile = store.voiceProfiles.find((profile) => profile.id === store.selectedProfileId);
  const busy = Boolean(activeJobId);
  const currentModelLabel = isOnline ? t(isVbee ? "tts.vbee.onlineLabel" : isGemini ? "tts.gemini.onlineLabel" : "tts.capcut.onlineLabel") : `${selectedModel.parameterSize} • ${t(`tts.mode.${mode}`)}`;
  const refreshStatuses = reactExports.useCallback(async () => {
    if (!window.ttsRuntime) {
      setStatuses(unavailableStatuses(t("tts.runtime.desktopOnly")));
      return;
    }
    try {
      const result = await window.ttsRuntime.getModelStatuses(TTS_MODELS.map(toRuntimeModel));
      setStatuses(Object.fromEntries(result.map((item) => [item.modelId, item])));
    } catch (error) {
      const message = runtimeErrorMessage(error, t, "tts.toast.statusFailed");
      setStatuses(unavailableStatuses(message));
      toast.error(message);
    }
  }, [t]);
  reactExports.useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);
  reactExports.useEffect(() => {
    if (!isVieneu || statuses["vieneu-v3-turbo"]?.status !== "ready") return;
    void window.ttsRuntime?.getVieneuVoices().then((result) => {
      if (result.success && result.voices.length) setVieneuVoices(result.voices);
    });
  }, [isVieneu, statuses]);
  reactExports.useEffect(() => window.ttsRuntime?.onEvent(setProgress), []);
  reactExports.useEffect(() => {
    if (!availableModels.some((model) => model.id === store.selectedModelId)) {
      store.setSelectedModelId(availableModels[0].id);
    }
  }, [availableModels, store.selectedModelId, store.setSelectedModelId]);
  reactExports.useEffect(() => {
    if (isVieneu && mode !== "clone" && mode !== "preset") store.setMode("preset");
    if (!isVieneu && !isOnline && mode === "preset") store.setMode("auto");
  }, [isOnline, isVieneu, mode, store.setMode]);
  reactExports.useEffect(() => {
    if (!isCapCut || capcutVoices.some((voice) => voice.voiceType === store.capcutVoiceType)) return;
    store.setCapcutVoiceType(capcutVoices[0]?.voiceType || "BV421_vivn_streaming");
  }, [capcutVoices, isCapCut, store.capcutVoiceType, store.setCapcutVoiceType]);
  reactExports.useEffect(() => {
    if (store.selectedProfileId && !compatibleProfiles.some((profile) => profile.id === store.selectedProfileId)) {
      store.setSelectedProfileId(void 0);
    }
  }, [compatibleProfiles, store.selectedProfileId, store.setSelectedProfileId]);
  reactExports.useEffect(() => {
    const hasStatuses = Object.keys(statuses).length > 0;
    if (!isOnline && !store.hasSeenModelPrompt && hasStatuses && selectedStatus?.status !== "ready") setMissingModelOpen(true);
  }, [isOnline, selectedStatus, statuses, store.hasSeenModelPrompt]);
  const selectEngine = reactExports.useCallback((engineId) => {
    const engine = getTtsModelGroup(engineId);
    if (!engine) return;
    store.setSelectedEngineId(engine.id);
    store.setSelectedModelId(engine.models[0].id);
    if (engine.id === "vieneu" && store.mode !== "clone" && store.mode !== "preset") store.setMode("preset");
    if (engine.id === "omnivoice" && store.mode === "preset") store.setMode("auto");
    if (engine.models[0].runtimeKind === "online") setMissingModelOpen(false);
  }, [store.mode, store.setMode, store.setSelectedEngineId, store.setSelectedModelId]);
  const installModel = reactExports.useCallback(async (model = selectedModel) => {
    if (activeJobId) return toast.info(t("tts.toast.jobBusy"));
    if (!window.ttsRuntime) return toast.error(t("tts.toast.desktopDownload"));
    const jobId = createTtsJobId("install");
    setActiveJobId(jobId);
    setProgress({ jobId, kind: "install", stage: "starting", percent: 1, message: t("tts.toast.preparing") });
    setStatuses((current) => ({
      ...current,
      [model.id]: {
        ...current[model.id] || { modelId: model.id, runtimeReady: false, pythonAvailable: false },
        status: "downloading"
      }
    }));
    try {
      const result = await window.ttsRuntime.installModel({ jobId, model: toRuntimeModel(model) });
      if (result.success) toast.success(t("tts.toast.modelReady", { model: model.name }));
      else if (!result.canceled) toast.error(result.error || t("tts.toast.downloadFailed"));
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, "tts.toast.downloadFailed"));
    } finally {
      setActiveJobId(void 0);
      await refreshStatuses();
    }
  }, [activeJobId, refreshStatuses, selectedModel, t]);
  const removeModel = reactExports.useCallback(async (model) => {
    if (!window.confirm(t("tts.confirm.removeModel", { model: model.name }))) return;
    const result = await window.ttsRuntime?.removeModel(model.id);
    if (result?.success) toast.success(t("tts.toast.modelRemoved"));
    else toast.error(result?.error || t("tts.toast.removeFailed"));
    await refreshStatuses();
  }, [refreshStatuses, t]);
  const cancelJob = reactExports.useCallback(async () => {
    if (!activeJobId) return;
    await window.ttsRuntime?.cancel(activeJobId);
    setActiveJobId(void 0);
    await refreshStatuses();
    toast.info(t("tts.toast.cancelRequested"));
  }, [activeJobId, refreshStatuses, t]);
  const pickReferenceAudio = reactExports.useCallback(async () => {
    const result = await window.ttsRuntime?.pickReferenceAudio(t("tts.native.selectReferenceAudio"));
    if (result?.path) setReferenceAudioPath(result.path);
  }, [t]);
  const saveProfile = reactExports.useCallback(() => {
    if (!profileName.trim() || !referenceAudioPath || !isVieneu && !referenceText.trim()) {
      toast.error(t("tts.toast.profileRequiredFields"));
      return;
    }
    const profile = {
      id: createTtsJobId("voice"),
      name: profileName.trim(),
      providerId: selectedModel.providerId,
      modelId: selectedModel.id,
      referenceAudioPath,
      referenceText: referenceText.trim(),
      createdAt: Date.now()
    };
    store.addVoiceProfile(profile);
    setProfileOpen(false);
    setProfileName("");
    setReferenceAudioPath("");
    setReferenceText("");
    toast.success(t("tts.toast.profileSaved"));
  }, [isVieneu, profileName, referenceAudioPath, referenceText, selectedModel, store.addVoiceProfile, t]);
  const generate = reactExports.useCallback(async () => {
    if (!store.text.trim()) return toast.error(t("tts.toast.textRequired"));
    if (!isOnline && selectedStatus?.status !== "ready") {
      setMissingModelOpen(true);
      return;
    }
    if (!isOnline && mode === "clone" && !selectedProfile) return toast.error(t("tts.toast.profileRequired"));
    if (!isOnline && !isVieneu && mode === "design" && !store.instruction.trim()) return toast.error(t("tts.toast.instructionRequired"));
    if (isCapCut && !selectedCapCutVoice) return toast.error(t("tts.capcut.voiceRequired"));
    if (isGemini && !selectedGeminiVoice) return toast.error(t("tts.gemini.voiceRequired"));
    if (isVbee && !store.vbeeVoiceCode.trim()) return toast.error(t("tts.vbee.voiceRequired"));
    if (!window.ttsRuntime) return toast.error(t("tts.toast.desktopOnly"));
    const jobId = createTtsJobId("generate");
    const queuedAt = Date.now();
    const voiceLabel = isCapCut ? selectedCapCutVoice?.displayName || "CapCut" : isGemini ? selectedGeminiVoice?.name || "Gemini" : isVbee ? store.vbeeVoiceName.trim() || "Vbee" : isVieneu && mode === "preset" ? store.vieneuVoice : mode === "clone" ? selectedProfile?.name || t("tts.settings.cloneMode") : t(`tts.mode.${mode}`);
    taskMetadata.begin({
      id: jobId,
      kind: "tts",
      status: "queued",
      queuedAt,
      title: store.text.trim().slice(0, 80),
      provider: selectedModel.providerId,
      model: selectedModel.id,
      prompt: store.text.trim(),
      instruction: mode === "design" ? store.instruction.trim() : void 0,
      details: {
        voice: voiceLabel,
        mode: isOnline ? "preset" : mode,
        language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
        speed: store.speed,
        splitMode: store.splitMode
      }
    });
    setActiveJobId(jobId);
    setProgress({ jobId, kind: "generate", stage: "starting", percent: 2, message: t("tts.toast.preparing") });
    let result;
    try {
      taskMetadata.submitted(jobId);
      result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: store.text.trim(),
        mode: isOnline ? "preset" : mode,
        splitMode: store.splitMode,
        language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
        speed: store.speed,
        numStep: store.numStep,
        advancedSettings: store.advancedEnabled ? store.advancedSettings : void 0,
        capcutVoiceType: isCapCut ? selectedCapCutVoice?.voiceType : void 0,
        capcutResourceId: isCapCut ? selectedCapCutVoice?.resourceId : void 0,
        geminiVoiceName: isGemini ? selectedGeminiVoice?.name : void 0,
        geminiStyle: isGemini ? store.geminiStyle.trim() : void 0,
        geminiTemperature: isGemini ? store.geminiTemperature : void 0,
        vbeeVoiceCode: isVbee ? store.vbeeVoiceCode.trim() : void 0,
        vbeeAudioType: isVbee ? store.vbeeAudioType : void 0,
        vbeeBitrate: isVbee ? store.vbeeBitrate : void 0,
        vieneuVoice: isVieneu ? store.vieneuVoice : void 0,
        vieneuStyle: isVieneu ? store.vieneuStyle : void 0,
        instruction: mode === "design" ? store.instruction.trim() : void 0,
        profileId: mode === "clone" ? selectedProfile?.id : void 0,
        referenceAudioPath: selectedProfile?.referenceAudioPath,
        referenceText: selectedProfile?.referenceText
      });
    } catch (error) {
      taskMetadata.failed(jobId, error);
      toast.error(runtimeErrorMessage(error, t, "tts.toast.generateFailed"));
      return;
    } finally {
      setActiveJobId(void 0);
    }
    if (!result.success || !result.outputPath) {
      taskMetadata.failed(jobId, result.error || (result.canceled ? "Cancelled" : "TTS generation failed"));
      if (!result.canceled) toast.error(result.error || t("tts.toast.generateFailed"));
      return;
    }
    taskMetadata.completed(jobId, result.outputPath, {
      voice: voiceLabel,
      mode: isOnline ? "preset" : mode,
      language: isCapCut ? store.capcutLanguage : isGemini ? store.geminiLanguage : store.language,
      speed: store.speed,
      splitMode: store.splitMode,
      durationSeconds: result.durationSec,
      sampleRate: result.sampleRate
    });
    store.addHistory({
      id: jobId,
      name: store.text.trim().slice(0, 80),
      modelId: selectedModel.id,
      text: store.text.trim(),
      mode: isOnline ? "preset" : mode,
      voiceLabel,
      outputPath: result.outputPath,
      createdAt: Date.now()
    });
    store.setText("");
    toast.success(t("tts.toast.audioCreated"));
  }, [isCapCut, isGemini, isOnline, isVbee, isVieneu, mode, selectedCapCutVoice, selectedGeminiVoice, selectedModel, selectedProfile, selectedStatus, store.addHistory, store.advancedEnabled, store.advancedSettings, store.capcutLanguage, store.geminiLanguage, store.geminiStyle, store.geminiTemperature, store.instruction, store.language, store.numStep, store.speed, store.splitMode, store.setText, store.text, store.vbeeAudioType, store.vbeeBitrate, store.vbeeVoiceCode, store.vbeeVoiceName, store.vieneuStyle, store.vieneuVoice, t]);
  const previewCapCutVoice = reactExports.useCallback(async () => {
    if (!isCapCut || !selectedCapCutVoice) return;
    if (activeJobId) return toast.info(t("tts.toast.jobBusy"));
    if (!window.ttsRuntime) return toast.error(t("tts.toast.desktopOnly"));
    const samples = {
      "vi-VN": "Xin chào, đây là giọng đọc mẫu của tôi.",
      "en-US": "Hello, this is a preview of my voice.",
      "ja-JP": "こんにちは、これは音声サンプルです。",
      "zh-CN": "你好，这是我的语音示例。",
      "es-ES": "Hola, esta es una muestra de mi voz.",
      "fr-FR": "Bonjour, voici un aperçu de ma voix.",
      "de-DE": "Hallo, dies ist eine Vorschau meiner Stimme.",
      "pt-BR": "Olá, esta é uma amostra da minha voz.",
      "th-TH": "สวัสดี นี่คือตัวอย่างเสียงของฉัน",
      "id-ID": "Halo, ini adalah contoh suara saya."
    };
    const jobId = createTtsJobId("generate");
    setActiveJobId(jobId);
    setProgress({ jobId, kind: "generate", stage: "starting", percent: 2, message: t("tts.capcut.previewing") });
    try {
      const result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: samples[store.capcutLanguage] || samples["en-US"],
        mode: "preset",
        language: store.capcutLanguage,
        speed: store.speed,
        capcutVoiceType: selectedCapCutVoice.voiceType,
        capcutResourceId: selectedCapCutVoice.resourceId
      });
      if (!result.success || !result.outputPath) {
        if (!result.canceled) toast.error(result.error || t("tts.toast.generateFailed"));
        return;
      }
      await new Audio(toLocalTtsAudioUrl(result.outputPath)).play();
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, "tts.toast.generateFailed"));
    } finally {
      setActiveJobId(void 0);
    }
  }, [activeJobId, isCapCut, selectedCapCutVoice, selectedModel, store.capcutLanguage, store.speed, t]);
  const previewGeminiVoice = reactExports.useCallback(async () => {
    if (!isGemini || !selectedGeminiVoice) return;
    if (activeJobId) return toast.info(t("tts.toast.jobBusy"));
    if (!window.ttsRuntime) return toast.error(t("tts.toast.desktopOnly"));
    const samples = {
      "vi-VN": "Xin chào, đây là bản nghe thử giọng đọc Gemini của tôi.",
      "en-US": "Hello, this is a preview of my Gemini voice."
    };
    const jobId = createTtsJobId("generate");
    setActiveJobId(jobId);
    setProgress({ jobId, kind: "generate", stage: "starting", percent: 2, message: t("tts.gemini.previewing") });
    try {
      const result = await window.ttsRuntime.generate({
        jobId,
        model: toRuntimeModel(selectedModel),
        text: samples[store.geminiLanguage] || samples["en-US"],
        mode: "preset",
        language: store.geminiLanguage,
        geminiVoiceName: selectedGeminiVoice.name,
        geminiStyle: store.geminiStyle.trim(),
        geminiTemperature: store.geminiTemperature
      });
      if (!result.success || !result.outputPath) {
        if (!result.canceled) toast.error(result.error || t("tts.toast.generateFailed"));
        return;
      }
      await new Audio(toLocalTtsAudioUrl(result.outputPath)).play();
    } catch (error) {
      toast.error(runtimeErrorMessage(error, t, "tts.toast.generateFailed"));
    } finally {
      setActiveJobId(void 0);
    }
  }, [activeJobId, isGemini, selectedGeminiVoice, selectedModel, store.geminiLanguage, store.geminiStyle, store.geminiTemperature, t]);
  const closeMissingModelPrompt = reactExports.useCallback(() => {
    store.markModelPromptSeen();
    setMissingModelOpen(false);
  }, [store.markModelPromptSeen]);
  const installSelectedModelFromPrompt = reactExports.useCallback(() => {
    closeMissingModelPrompt();
    void installModel(selectedModel);
  }, [closeMissingModelPrompt, installModel, selectedModel]);
  return {
    statuses,
    engineGroups: TTS_MODEL_GROUPS,
    selectedEngine,
    availableModels,
    selectedModel,
    selectedStatus,
    isCapCut,
    isGemini,
    isVbee,
    isVieneu,
    isOnline,
    mode,
    compatibleProfiles,
    selectedProfile,
    capcutVoices,
    selectedCapCutVoice,
    geminiVoices: GEMINI_VOICES,
    selectedGeminiVoice,
    currentModelLabel,
    activeJobId,
    progress,
    busy,
    managerOpen,
    setManagerOpen,
    missingModelOpen,
    setMissingModelOpen,
    profileOpen,
    setProfileOpen,
    profileName,
    setProfileName,
    referenceAudioPath,
    referenceText,
    setReferenceText,
    text: store.text,
    setText: store.setText,
    instruction: store.instruction,
    setInstruction: store.setInstruction,
    setMode: store.setMode,
    language: store.language,
    setLanguage: store.setLanguage,
    savedLanguages: store.savedLanguages,
    addSavedLanguage: store.addSavedLanguage,
    removeSavedLanguage: store.removeSavedLanguage,
    speed: store.speed,
    setSpeed: store.setSpeed,
    numStep: store.numStep,
    setNumStep: store.setNumStep,
    splitMode: store.splitMode,
    setSplitMode: store.setSplitMode,
    capcutLanguage: store.capcutLanguage,
    setCapcutLanguage: store.setCapcutLanguage,
    capcutVoiceType: store.capcutVoiceType,
    setCapcutVoiceType: store.setCapcutVoiceType,
    geminiLanguage: store.geminiLanguage,
    setGeminiLanguage: store.setGeminiLanguage,
    geminiVoiceName: store.geminiVoiceName,
    setGeminiVoiceName: store.setGeminiVoiceName,
    geminiStyle: store.geminiStyle,
    setGeminiStyle: store.setGeminiStyle,
    geminiTemperature: store.geminiTemperature,
    setGeminiTemperature: store.setGeminiTemperature,
    vbeeVoiceCode: store.vbeeVoiceCode,
    setVbeeVoiceCode: store.setVbeeVoiceCode,
    vbeeVoiceName: store.vbeeVoiceName,
    setVbeeVoiceName: store.setVbeeVoiceName,
    vbeeAudioType: store.vbeeAudioType,
    setVbeeAudioType: store.setVbeeAudioType,
    vbeeBitrate: store.vbeeBitrate,
    setVbeeBitrate: store.setVbeeBitrate,
    vieneuVoices,
    vieneuVoice: store.vieneuVoice,
    setVieneuVoice: store.setVieneuVoice,
    vieneuStyle: store.vieneuStyle,
    setVieneuStyle: store.setVieneuStyle,
    advancedEnabled: store.advancedEnabled,
    setAdvancedEnabled: store.setAdvancedEnabled,
    advancedSettings: store.advancedSettings,
    setAdvancedSetting: store.setAdvancedSetting,
    resetAdvancedSettings: store.resetAdvancedSettings,
    selectedEngineId: store.selectedEngineId,
    setSelectedEngineId: selectEngine,
    selectedModelId: store.selectedModelId,
    setSelectedModelId: store.setSelectedModelId,
    selectedProfileId: store.selectedProfileId,
    setSelectedProfileId: store.setSelectedProfileId,
    history: store.history,
    renameHistory: store.renameHistory,
    removeHistory: store.removeHistory,
    removeVoiceProfile: store.removeVoiceProfile,
    installModel,
    removeModel,
    cancelJob,
    pickReferenceAudio,
    saveProfile,
    generate,
    previewCapCutVoice,
    previewGeminiVoice,
    closeMissingModelPrompt,
    installSelectedModelFromPrompt
  };
}
const BAR_COUNT = 96;
const waveformCache = /* @__PURE__ */ new Map();
function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
async function decodeWaveform(source) {
  const existing = waveformCache.get(source);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Audio request failed (${response.status})`);
    const context = new AudioContext();
    try {
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      const channel = buffer.getChannelData(0);
      const blockSize = Math.max(1, Math.floor(channel.length / BAR_COUNT));
      const rawPeaks = Array.from({ length: BAR_COUNT }, (_, index) => {
        const start = index * blockSize;
        const end = Math.min(channel.length, start + blockSize);
        let peak = 0;
        for (let sample = start; sample < end; sample += 1) {
          peak = Math.max(peak, Math.abs(channel[sample]));
        }
        return peak;
      });
      const maximum = Math.max(...rawPeaks, 1e-3);
      return {
        duration: buffer.duration,
        peaks: rawPeaks.map((peak) => Math.max(0.08, peak / maximum))
      };
    } finally {
      void context.close();
    }
  })();
  waveformCache.set(source, pending);
  return pending;
}
function AudioWaveformPlayer({ source }) {
  const { t } = useI18n();
  const containerRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const [shouldLoad, setShouldLoad] = reactExports.useState(false);
  const [peaks, setPeaks] = reactExports.useState(() => Array(BAR_COUNT).fill(0.08));
  const [duration, setDuration] = reactExports.useState(0);
  const [currentTime, setCurrentTime] = reactExports.useState(0);
  const [playing, setPlaying] = reactExports.useState(false);
  const [muted, setMuted] = reactExports.useState(false);
  const updateDuration = (value) => {
    if (Number.isFinite(value) && value > 0) setDuration(value);
  };
  reactExports.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  reactExports.useEffect(() => {
    if (!shouldLoad) return;
    let active = true;
    void decodeWaveform(source).then((waveform) => {
      if (!active) return;
      setPeaks(waveform.peaks);
      updateDuration(waveform.duration);
    }).catch(() => void 0);
    return () => {
      active = false;
    };
  }, [shouldLoad, source]);
  const progress = duration > 0 ? currentTime / duration : 0;
  const viewBoxWidth = reactExports.useMemo(() => peaks.length * 2, [peaks.length]);
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  };
  const seekToPosition = (clientX, timeline) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const bounds = timeline.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    const targetTime = ratio * duration;
    setCurrentTime(targetTime);
    const applySeek = () => {
      audio.currentTime = targetTime;
    };
    if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
      audio.addEventListener("loadedmetadata", applySeek, { once: true });
      audio.load();
    } else {
      applySeek();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: containerRef, className: "flex items-center gap-3 rounded-xl bg-muted/35 px-3 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "audio",
      {
        ref: audioRef,
        src: source,
        preload: "metadata",
        muted,
        onPlay: () => setPlaying(true),
        onPause: () => setPlaying(false),
        onEnded: () => setPlaying(false),
        onTimeUpdate: (event) => setCurrentTime(event.currentTarget.currentTime),
        onLoadedMetadata: (event) => updateDuration(event.currentTarget.duration),
        onDurationChange: (event) => updateDuration(event.currentTarget.duration)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "icon",
        onClick: () => void togglePlayback(),
        title: playing ? t("tts.history.pause") : t("tts.history.play"),
        children: playing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, {})
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-20 shrink-0 text-xs tabular-nums text-muted-foreground", children: [
      formatTime(currentTime),
      " / ",
      formatTime(duration)
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        role: "slider",
        "aria-label": t("tts.history.seek"),
        "aria-valuemin": 0,
        "aria-valuemax": Math.round(duration),
        "aria-valuenow": Math.round(currentTime),
        viewBox: `0 0 ${viewBoxWidth} 32`,
        preserveAspectRatio: "none",
        className: "h-9 min-w-0 flex-1 cursor-pointer",
        onPointerDown: (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          seekToPosition(event.clientX, event.currentTarget);
        },
        onPointerMove: (event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            seekToPosition(event.clientX, event.currentTarget);
          }
        },
        onPointerUp: (event) => event.currentTarget.releasePointerCapture(event.pointerId),
        children: peaks.map((peak, index) => {
          const height = Math.max(2, peak * 28);
          const played = index / peaks.length <= progress;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: index * 2,
              y: (32 - height) / 2,
              width: "1.25",
              height,
              rx: "0.6",
              className: played ? "fill-primary" : "fill-muted-foreground/35"
            },
            index
          );
        })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "icon",
        onClick: () => setMuted((value) => !value),
        title: muted ? t("tts.history.unmute") : t("tts.history.mute"),
        children: muted ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, {})
      }
    )
  ] });
}
function AudioHistoryItem({ item, onRename, onRemove }) {
  const { t, locale } = useI18n();
  const displayName = item.name?.trim() || item.text.slice(0, 80);
  const [editing, setEditing] = reactExports.useState(false);
  const [draftName, setDraftName] = reactExports.useState(displayName);
  const modelName = getTtsModel(item.modelId)?.name || item.modelId;
  const saveName = () => {
    const nextName = draftName.trim();
    if (!nextName) return;
    onRename(item.id, nextName);
    setEditing(false);
  };
  const cancelEditing = () => {
    setDraftName(displayName);
    setEditing(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-success/10 p-2 text-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileHeadphone, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        editing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              autoFocus: true,
              value: draftName,
              maxLength: 120,
              onChange: (event) => setDraftName(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") cancelEditing();
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: saveName, disabled: !draftName.trim(), title: t("tts.history.saveName"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: cancelEditing, title: t("tts.action.cancel"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, {}) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "min-w-0 flex-1 truncate text-sm font-medium", title: displayName, children: displayName }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-2xs text-muted-foreground", children: [
          t("tts.history.voice", { voice: item.voiceLabel }),
          " · ",
          t("tts.history.model", { model: modelName }),
          " · ",
          new Date(item.createdAt).toLocaleString(locale)
        ] })
      ] }),
      !editing && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setEditing(true), title: t("tts.history.rename"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TaskInfoButton, { taskId: item.id, outputUrl: item.outputPath, kind: "tts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => window.ttsRuntime?.revealAudio(item.outputPath), title: t("tts.history.openFolder"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => window.ttsRuntime?.exportAudio(item.outputPath, t("tts.native.exportAudio")),
          title: t("tts.history.exportWav"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", title: t("tts.history.remove"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("tts.history.deleteTitle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("tts.history.deleteDescription", { name: displayName }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("tts.action.cancel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AlertDialogAction,
              {
                className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                onClick: () => onRemove(item.id),
                children: t("tts.history.confirmDelete")
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AudioWaveformPlayer, { source: toLocalTtsAudioUrl(item.outputPath) })
  ] });
}
function AudioHistory({ items, onRename, onRemove }) {
  const { t } = useI18n();
  const [query, setQuery] = reactExports.useState("");
  const [sortOrder, setSortOrder] = reactExports.useState("newest");
  const hasFilters = Boolean(query || sortOrder !== "newest");
  const visibleItems = reactExports.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (!normalizedQuery) return true;
      const modelName = getTtsModel(item.modelId)?.name || item.modelId;
      return [item.name, item.text, item.voiceLabel, modelName].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    }).sort((left, right) => sortOrder === "newest" ? right.createdAt - left.createdAt : left.createdAt - right.createdAt);
  }, [items, query, sortOrder]);
  const resetFilters = () => {
    setQuery("");
    setSortOrder("newest");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm", children: t("tts.history.title") })
      ] }),
      items.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: t("tts.history.resultCount", { visible: visibleItems.length, total: items.length }) })
    ] }),
    items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: t("tts.history.empty") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border/60 bg-card/50 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-[minmax(200px,1fr)_175px_auto] sm:items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: t("tts.history.search") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("tts.history.searchPlaceholder"), className: "h-9 pl-9 text-xs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: t("tts.history.sort") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sortOrder, onValueChange: (value) => setSortOrder(value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1.5 h-9 w-full bg-background text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "newest", children: t("tts.history.newest") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "oldest", children: t("tts.history.oldest") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "icon", className: "h-9 w-9", disabled: !hasFilters, onClick: resetFilters, title: t("tts.history.resetFilters"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" }) })
      ] }) }),
      visibleItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: t("tts.history.noResults") }) : visibleItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(AudioHistoryItem, { item, onRename, onRemove }, item.id))
    ] })
  ] });
}
const PROGRESS_KEYS = {
  starting: "tts.progress.starting",
  "runtime.python.download": "tts.progress.pythonDownload",
  "runtime.python.install": "tts.progress.pythonInstall",
  "runtime.python.migrate": "tts.progress.pythonMigrate",
  "runtime.venv": "tts.progress.venv",
  "runtime.pip": "tts.progress.pip",
  "runtime.dependencies": "tts.progress.dependencies",
  "runtime.accelerator": "tts.progress.accelerator",
  "model.download": "tts.progress.modelDownload",
  loading: "tts.progress.loading",
  "voice-prompt": "tts.progress.voicePrompt",
  generating: "tts.progress.generating",
  "line-generating": "tts.progress.lineGenerating",
  "sentence-generating": "tts.progress.sentenceGenerating",
  chunking: "tts.progress.chunking",
  merging: "tts.progress.merging",
  saving: "tts.progress.saving",
  done: "tts.progress.done",
  "vbee-submitting": "tts.progress.vbeeSubmitting",
  "vbee-processing": "tts.progress.vbeeProcessing",
  "vbee-downloading": "tts.progress.vbeeDownloading",
  "vbee-done": "tts.progress.vbeeDone"
};
function getTtsProgressLabel(stage, t) {
  return t(PROGRESS_KEYS[stage] || "tts.progress.default");
}
function GenerationProgress({ progress, onCancel }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-primary" }),
          getTtsProgressLabel(progress.stage, t)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-muted-foreground", title: progress.message, children: progress.message })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-primary", children: [
          Math.round(progress.percent ?? 0),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: onCancel, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Square, {}),
          " ",
          t("tts.action.cancel")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress.percent ?? 20 })
  ] });
}
function splitLines(text) {
  return text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
}
function splitSentences(text) {
  return text.replace(/\r\n/g, "\n").split(/(?<=[.!?…。！？])\s+|\n+/u).map((part) => part.trim()).filter(Boolean);
}
function TextEditorCard({ value, onChange, splitMode }) {
  const { t } = useI18n();
  const isLine = splitMode === "line";
  const parts = splitMode !== "default" ? isLine ? splitLines(value) : splitSentences(value) : [];
  const previewTitle = isLine ? t("tts.splitMode.linePreviewTitle") : t("tts.splitMode.sentencePreviewTitle");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: t("tts.text.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("tts.text.savedWithoutModel") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("tts.text.characters", { count: value.length.toLocaleString() }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Textarea,
      {
        "data-tts-main-editor": true,
        value,
        onChange: (event) => onChange(event.target.value),
        placeholder: t("tts.text.placeholder"),
        className: "min-h-[280px] resize-y bg-background/70 leading-6"
      }
    ),
    splitMode !== "default" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-primary", children: previewTitle }),
        parts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("tts.splitMode.previewCount", { count: parts.length }) })
      ] }),
      parts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-2 max-h-40 space-y-1 overflow-y-auto text-xs", children: parts.map((part, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-baseline gap-2 rounded-lg bg-background/70 px-2 py-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 font-medium text-muted-foreground", children: [
          index + 1,
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate text-foreground", children: part })
      ] }, index)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-2xs leading-4 text-muted-foreground", children: t("tts.splitMode.previewEmpty") })
    ] })
  ] });
}
function TtsHeader({ provider = "omnivoice" }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-14 shrink-0 border-b border-border/60 bg-panel/80 backdrop-blur-xl px-4 flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { icon: AudioLines }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-semibold leading-tight", children: t("tts.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t(provider === "vieneu" ? "tts.subtitle.vieneu" : provider === "vbee" ? "tts.subtitle.vbee" : provider === "gemini" ? "tts.subtitle.gemini" : provider === "capcut" ? "tts.subtitle.capcut" : "tts.subtitle") })
    ] })
  ] });
}
function TtsSidebar({ onOpenSettings }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FeatureRail,
    {
      bottomItems: [{
        id: "settings",
        icon: Settings,
        label: t("tts.modelManager"),
        onClick: onOpenSettings
      }]
    }
  );
}
function ModelStatusBadge({ status }) {
  const { t } = useI18n();
  if (status?.status === "ready") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-success/30 bg-success/10 text-success hover:bg-primary hover:text-primary-foreground", children: t("tts.status.ready") });
  }
  if (status?.status === "downloading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-info/30 bg-info/10 text-info", children: t("tts.status.downloading") });
  }
  if (status?.status === "error" || status?.status === "incompatible") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", children: t("tts.status.error") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: t("tts.status.notInstalled") });
}
function LanguagePickerDialog({
  open,
  onOpenChange,
  savedLanguages,
  onAdd,
  onRemove
}) {
  const { t } = useI18n();
  const [query, setQuery] = reactExports.useState("");
  const savedCodes = reactExports.useMemo(
    () => /* @__PURE__ */ new Set(["vi", "en", ...savedLanguages.map((language) => language.code)]),
    [savedLanguages]
  );
  const results = reactExports.useMemo(() => searchOmniVoiceLanguages(query), [query]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("tts.languagePicker.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("tts.languagePicker.description", { count: OMNIVOICE_LANGUAGE_COUNT }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: query,
          onChange: (event) => setQuery(event.target.value),
          placeholder: t("tts.languagePicker.searchPlaceholder"),
          className: "pl-9",
          autoFocus: true
        }
      )
    ] }),
    savedLanguages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("tts.languagePicker.saved") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: savedLanguages.map((language) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 rounded-full border bg-muted/40 py-1 pl-3 pr-1 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          language.name,
          " · ",
          language.code
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "h-6 w-6 rounded-full p-0",
            onClick: () => onRemove(language.code),
            "aria-label": t("tts.languagePicker.remove", { language: language.name }),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
          }
        )
      ] }, language.code)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-72 overflow-y-auto rounded-xl border border-border/60", children: [
      results.map((language) => {
        const saved = savedCodes.has(language.code);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            disabled: saved,
            onClick: () => onAdd({ code: language.code, name: language.name }),
            className: "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/50 disabled:cursor-default disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: language.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xs text-muted-foreground", children: [
                  t("tts.languagePicker.modelCode"),
                  ": ",
                  language.code,
                  language.iso6393 !== language.code ? ` · ISO 639-3: ${language.iso6393}` : ""
                ] })
              ] }),
              saved ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-success" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 text-primary" })
            ]
          },
          language.code
        );
      }),
      results.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-center text-sm text-muted-foreground", children: t("tts.languagePicker.empty") })
    ] })
  ] }) });
}
const LANGUAGE_LABELS = {
  "vi-VN": "Tiếng Việt",
  "en-US": "English",
  "ja-JP": "日本語",
  "zh-CN": "中文",
  "es-ES": "Español",
  "th-TH": "ไทย",
  "id-ID": "Bahasa Indonesia",
  "pt-BR": "Português",
  "fr-FR": "Français",
  "de-DE": "Deutsch"
};
function CapCutSettingsPanel({ controller }) {
  const { t } = useI18n();
  const [query, setQuery] = reactExports.useState("");
  const {
    capcutLanguage,
    setCapcutLanguage,
    capcutVoiceType,
    setCapcutVoiceType,
    capcutVoices,
    selectedCapCutVoice,
    speed,
    setSpeed,
    busy,
    previewCapCutVoice
  } = controller;
  const filteredVoices = reactExports.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return capcutVoices;
    return capcutVoices.filter((voice) => voice.displayName.toLocaleLowerCase().includes(normalized) || voice.voiceType.toLocaleLowerCase().includes(normalized));
  }, [capcutVoices, query]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "min-h-0 overflow-y-auto bg-panel/40 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-info/25 bg-info/5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Earth, { className: "h-4 w-4 text-info" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "CapCut Online" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("tts.capcut.onlineLabel") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "border-info/30 bg-info/10 text-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-3 w-3" }),
        t("tts.engine.online")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.language") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: capcutLanguage,
            onValueChange: (value) => {
              setCapcutLanguage(value);
              setQuery("");
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CAPCUT_LANGUAGES.map((language) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: language, children: [
                LANGUAGE_LABELS[language] || language,
                " (",
                language,
                ")"
              ] }, language)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.capcut.voice") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
            capcutVoices.length,
            " ",
            t("tts.capcut.voices")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("tts.capcut.searchVoice"), className: "h-9 pl-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: capcutVoiceType, onValueChange: setCapcutVoiceType, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("tts.capcut.selectVoice") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: filteredVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: voice.voiceType, children: voice.displayName }, `${voice.voiceType}:${voice.resourceId}`)) })
        ] })
      ] }),
      selectedCapCutVoice && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border/60 bg-card/65 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selectedCapCutVoice.displayName }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-2xs text-muted-foreground", children: selectedCapCutVoice.voiceType })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: previewCapCutVoice, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3.5 w-3.5" }),
          t("tts.capcut.preview")
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.speed") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-primary", children: [
            speed.toFixed(2),
            "×"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "range",
            min: "0.5",
            max: "2",
            step: "0.1",
            value: speed,
            onChange: (event) => setSpeed(Number(event.target.value)),
            className: "mt-3 w-full accent-primary"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border/60 bg-muted/20 p-3 text-2xs leading-5 text-muted-foreground", children: t("tts.capcut.longTextHint") })
  ] }) });
}
function GeminiSettingsPanel({ controller }) {
  const { t } = useI18n();
  const [showTags, setShowTags] = reactExports.useState(false);
  const {
    availableModels,
    selectedModelId,
    setSelectedModelId,
    geminiLanguage,
    setGeminiLanguage,
    geminiVoiceName,
    setGeminiVoiceName,
    geminiStyle,
    setGeminiStyle,
    geminiTemperature,
    setGeminiTemperature,
    geminiVoices,
    selectedGeminiVoice,
    busy,
    previewGeminiVoice
  } = controller;
  const insertTag = (tag) => {
    const textArea = document.querySelector("[data-tts-main-editor]");
    if (!textArea) {
      controller.setText(`${tag} ${controller.text}`.trim());
      return;
    }
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const next = `${controller.text.slice(0, start)}${tag} ${controller.text.slice(end)}`;
    controller.setText(next);
    requestAnimationFrame(() => {
      textArea.focus();
      textArea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "min-h-0 overflow-y-auto bg-panel/40 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-primary/25 bg-primary/5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cloud, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Gemini Pro" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("tts.gemini.onlineLabel") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-primary/30 bg-primary/10 text-primary", children: t("tts.engine.online") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.model") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedModelId, onValueChange: setSelectedModelId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: availableModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model.id, children: model.name }, model.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.language") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: geminiLanguage, onValueChange: setGeminiLanguage, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: GEMINI_LANGUAGES.map(([code, name]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: code, children: [
            name,
            " (",
            code,
            ")"
          ] }, code)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.gemini.voice") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
            "30 ",
            t("tts.gemini.voices")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: geminiVoiceName, onValueChange: setGeminiVoiceName, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: geminiVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: voice.name, children: [
            voice.name,
            " · ",
            voice.description
          ] }, voice.name)) })
        ] })
      ] }),
      selectedGeminiVoice && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl border border-border/60 bg-card/65 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: selectedGeminiVoice.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-2xs text-muted-foreground", children: [
            selectedGeminiVoice.description,
            " · ",
            selectedGeminiVoice.gender === "F" ? t("tts.gemini.female") : t("tts.gemini.male")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: previewGeminiVoice, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3.5 w-3.5" }),
          t("tts.gemini.preview")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-3.5 w-3.5" }),
          t("tts.gemini.style")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: geminiStyle, onChange: (event) => setGeminiStyle(event.target.value), placeholder: t("tts.gemini.stylePlaceholder"), className: "mt-2 min-h-20 text-xs" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.gemini.temperature") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-primary", children: geminiTemperature.toFixed(1) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: "0", max: "2", step: "0.1", value: geminiTemperature, onChange: (event) => setGeminiTemperature(Number(event.target.value)), className: "mt-3 h-1.5 w-full cursor-pointer accent-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-2xs text-muted-foreground", children: t("tts.gemini.temperatureHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", className: "w-full", onClick: () => setShowTags((value) => !value), children: showTags ? t("tts.gemini.hideTags") : t("tts.gemini.showTags") }),
        showTags && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: GEMINI_AUDIO_TAGS.map(([tag, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => insertTag(tag), className: "rounded-lg border border-border/60 bg-background px-2 py-1 text-2xs hover:border-primary/50 hover:text-primary", title: tag, children: label }, tag)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border/60 bg-muted/20 p-3 text-2xs leading-5 text-muted-foreground", children: t("tts.gemini.longTextHint") })
  ] }) });
}
function VbeeSettingsPanel({ controller }) {
  const { t } = useI18n();
  const [voices, setVoices] = reactExports.useState([]);
  const [query, setQuery] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const favoriteVoiceCodes = useTtsStore((state) => state.vbeeFavoriteVoiceCodes);
  const toggleFavoriteVoice = useTtsStore((state) => state.toggleVbeeFavoriteVoice);
  const {
    vbeeVoiceCode,
    setVbeeVoiceCode,
    setVbeeVoiceName,
    vbeeAudioType,
    setVbeeAudioType,
    vbeeBitrate,
    setVbeeBitrate,
    speed,
    setSpeed
  } = controller;
  const loadVoices = async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const result = await window.ttsRuntime?.getVbeeVoices(force);
      if (!result?.success) {
        setVoices([]);
        setError(result?.error || t("tts.vbee.voicesLoadFailed"));
        return;
      }
      setVoices(result.voices);
      if (result.voices.length && !result.voices.some((voice) => voice.code === vbeeVoiceCode)) {
        const fallback = result.voices.find((voice) => voice.languageCode === "vi-VN") || result.voices[0];
        setVbeeVoiceCode(fallback.code);
        setVbeeVoiceName(fallback.name);
      } else {
        const current = result.voices.find((voice) => voice.code === vbeeVoiceCode);
        if (current) setVbeeVoiceName(current.name);
      }
    } catch (loadError) {
      setVoices([]);
      setError(loadError instanceof Error ? loadError.message : t("tts.vbee.voicesLoadFailed"));
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    void loadVoices();
  }, []);
  const filteredVoices = reactExports.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const matching = !normalized ? voices : voices.filter((voice) => voice.name.toLocaleLowerCase().includes(normalized) || voice.code.toLocaleLowerCase().includes(normalized) || voice.languageCode.toLocaleLowerCase().includes(normalized) || voice.gender.toLocaleLowerCase().includes(normalized));
    const favoriteSet = new Set(favoriteVoiceCodes);
    return [...matching].sort((left, right) => Number(favoriteSet.has(right.code)) - Number(favoriteSet.has(left.code)) || left.name.localeCompare(right.name));
  }, [favoriteVoiceCodes, query, voices]);
  const selectedVoice = voices.find((voice) => voice.code === vbeeVoiceCode);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "min-h-0 overflow-y-auto bg-panel/40 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-primary/25 bg-primary/5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cloud, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Vbee API" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("tts.vbee.onlineLabel") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-primary/30 bg-primary/10 text-primary", children: t("tts.engine.online") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.vbee.voice") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-2xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              voices.length,
              " ",
              t("tts.vbee.voices")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "h-7 w-7", disabled: loading, onClick: () => void loadVoices(true), title: t("tts.vbee.refreshVoices"), children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("tts.vbee.searchVoice"), className: "h-9 pl-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: vbeeVoiceCode,
              onValueChange: (code) => {
                setVbeeVoiceCode(code);
                const voice = voices.find((item) => item.code === code);
                if (voice) setVbeeVoiceName(voice.name);
              },
              disabled: loading || !voices.length,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: loading ? t("tts.vbee.loadingVoices") : t("tts.vbee.selectVoice") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: filteredVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: voice.code, children: [
                  voice.name,
                  " · ",
                  voice.languageCode,
                  " · ",
                  voice.gender === "female" ? t("tts.gemini.female") : voice.gender === "male" ? t("tts.gemini.male") : voice.gender
                ] }, voice.code)) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "icon",
              className: "h-10 w-10 shrink-0",
              disabled: !selectedVoice,
              title: favoriteVoiceCodes.includes(vbeeVoiceCode) ? "Bỏ khỏi giọng yêu thích" : "Đánh dấu giọng yêu thích",
              onClick: () => selectedVoice && toggleFavoriteVoice(selectedVoice.code),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-4 w-4 ${favoriteVoiceCodes.includes(vbeeVoiceCode) ? "fill-amber-400 text-amber-500" : ""}` })
            }
          )
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-2xs leading-4 text-destructive", children: error }),
        selectedVoice && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1.5 text-2xs text-muted-foreground", children: [
          selectedVoice.ownership === "PERSONAL" ? t("tts.vbee.personalVoice") : selectedVoice.ownership === "COMMUNITY" ? t("tts.vbee.communityVoice") : t("tts.vbee.officialVoice"),
          selectedVoice.creditFactor ? ` · ×${selectedVoice.creditFactor} ${t("tts.vbee.credits")}` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.speed") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-primary", children: [
            speed.toFixed(1),
            "×"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: "0.1", max: "1.9", step: "0.1", value: speed, onChange: (event) => setSpeed(Number(event.target.value)), className: "mt-3 w-full accent-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.vbee.audioType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: vbeeAudioType, onValueChange: (value) => setVbeeAudioType(value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "mp3", children: "MP3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "wav", children: "WAV" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.vbee.bitrate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(vbeeBitrate), onValueChange: (value) => setVbeeBitrate(Number(value)), disabled: vbeeAudioType === "wav", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: [8, 16, 32, 64, 128].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(value), children: [
              value,
              " kbps"
            ] }, value)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border/60 bg-muted/20 p-3 text-2xs leading-5 text-muted-foreground", children: t("tts.vbee.longTextHint") })
  ] }) });
}
function VieneuSettingsPanel({ controller }) {
  const { t } = useI18n();
  const {
    selectedModel,
    selectedStatus,
    installModel,
    mode,
    setMode,
    vieneuVoices,
    vieneuVoice,
    setVieneuVoice,
    vieneuStyle,
    setVieneuStyle,
    compatibleProfiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    setProfileOpen,
    removeVoiceProfile,
    splitMode,
    setSplitMode
  } = controller;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "min-h-0 overflow-y-auto bg-panel/40 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card/65 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "h-4 w-4 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: selectedModel.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "48 kHz • CPU/ONNX • Offline" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ModelStatusBadge, { status: selectedStatus })
      ] }),
      selectedStatus?.status !== "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "mt-3 w-full", onClick: () => installModel(selectedModel), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {}),
        " ",
        t("tts.manager.download")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.voiceMode") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setMode("preset"), className: `rounded-xl border px-3 py-3 text-xs ${mode === "preset" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/60 text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "mx-auto mb-1.5 h-4 w-4" }),
          t("tts.mode.preset")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setMode("clone"), className: `rounded-xl border px-3 py-3 text-xs ${mode === "clone" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/60 text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MicVocal, { className: "mx-auto mb-1.5 h-4 w-4" }),
          t("tts.mode.clone")
        ] })
      ] })
    ] }),
    mode === "preset" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.vieneu.voice") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: vieneuVoice, onValueChange: setVieneuVoice, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: vieneuVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: voice.id, children: voice.label }, voice.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.vieneu.style") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: vieneuStyle, onValueChange: (value) => setVieneuStyle(value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "tu_nhien", children: t("tts.vieneu.styleNatural") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "tin_tuc", children: t("tts.vieneu.styleNews") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "doc_truyen", children: t("tts.vieneu.styleStory") })
          ] })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.profile.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setProfileOpen(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserRoundPlus, {}),
          t("tts.profile.create")
        ] })
      ] }),
      compatibleProfiles.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedProfileId, onValueChange: setSelectedProfileId, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("tts.profile.select") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: compatibleProfiles.map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: profile.id, children: profile.name }, profile.id)) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-xl border border-dashed p-4 text-xs text-muted-foreground", children: t("tts.vieneu.cloneHint") }),
      selectedProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", size: "sm", onClick: () => removeVoiceProfile(selectedProfile.id), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {}),
        t("tts.profile.remove")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-t border-border/60 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.splitMode.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: splitMode, onValueChange: (value) => setSplitMode(value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "default", children: t("tts.splitMode.default") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "line", children: t("tts.splitMode.line") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sentence", children: t("tts.splitMode.sentence") })
        ] })
      ] })
    ] })
  ] }) });
}
const MODES = [
  { id: "clone", icon: MicVocal, labelKey: "tts.mode.clone" },
  { id: "design", icon: WandSparkles, labelKey: "tts.mode.design" },
  { id: "auto", icon: Sparkles, labelKey: "tts.mode.auto" }
];
function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  step,
  disabled,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/60 bg-background/55 p-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: `text-xs ${disabled ? "text-muted-foreground" : ""}`, children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "number",
          value,
          min,
          max,
          step,
          disabled,
          onChange: (event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
          },
          className: "h-7 w-16 bg-background px-2 text-right text-xs"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs leading-3.5 text-muted-foreground", children: description })
  ] });
}
function BooleanSetting({
  label,
  description,
  checked,
  disabled,
  onCheckedChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/55 p-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: `text-xs ${disabled ? "text-muted-foreground" : ""}`, children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs leading-3.5 text-muted-foreground", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked, disabled, onCheckedChange })
  ] });
}
function VoiceSettingsPanel({ controller }) {
  const { t } = useI18n();
  const [advancedOpen, setAdvancedOpen] = reactExports.useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = reactExports.useState(false);
  const {
    selectedModel,
    selectedStatus,
    currentModelLabel,
    mode,
    setMode,
    instruction,
    setInstruction,
    compatibleProfiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    removeVoiceProfile,
    setProfileOpen,
    installModel,
    language,
    setLanguage,
    speed,
    setSpeed,
    numStep,
    setNumStep,
    splitMode,
    setSplitMode,
    savedLanguages,
    addSavedLanguage,
    removeSavedLanguage,
    advancedEnabled,
    setAdvancedEnabled,
    advancedSettings,
    setAdvancedSetting,
    resetAdvancedSettings
  } = controller;
  if (controller.isCapCut) return /* @__PURE__ */ jsxRuntimeExports.jsx(CapCutSettingsPanel, { controller });
  if (controller.isGemini) return /* @__PURE__ */ jsxRuntimeExports.jsx(GeminiSettingsPanel, { controller });
  if (controller.isVbee) return /* @__PURE__ */ jsxRuntimeExports.jsx(VbeeSettingsPanel, { controller });
  if (controller.isVieneu) return /* @__PURE__ */ jsxRuntimeExports.jsx(VieneuSettingsPanel, { controller });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "min-h-0 overflow-y-auto bg-panel/40 p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card/65 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: selectedModel.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: currentModelLabel })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModelStatusBadge, { status: selectedStatus })
        ] }),
        selectedStatus?.status !== "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "mt-3 w-full", onClick: () => installModel(selectedModel), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {}),
          " ",
          selectedStatus?.status === "incompatible" && selectedStatus.installedPath ? t("tts.manager.repairRuntime") : t("tts.manager.download")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.voiceMode") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-3 gap-2", children: MODES.map(({ id, icon: Icon, labelKey }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setMode(id),
            className: `rounded-xl border px-2 py-3 text-xs transition-colors ${mode === id ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mx-auto mb-1.5 h-4 w-4" }),
              t(labelKey)
            ]
          },
          id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "space-y-3 border-t border-border/60 pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.splitMode.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: splitMode, onValueChange: (value) => setSplitMode(value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "default", children: t("tts.splitMode.default") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "line", children: t("tts.splitMode.line") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sentence", children: t("tts.splitMode.sentence") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-2xs leading-4 text-muted-foreground", children: t("tts.splitMode.hint") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-t border-border/60 pt-5", children: [
        mode === "clone" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.profile.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setProfileOpen(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserRoundPlus, {}),
              " ",
              t("tts.profile.create")
            ] })
          ] }),
          compatibleProfiles.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedProfileId, onValueChange: setSelectedProfileId, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("tts.profile.select") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: compatibleProfiles.map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: profile.id, children: profile.name }, profile.id)) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setProfileOpen(true),
              className: "w-full rounded-xl border border-dashed border-border p-6 text-center hover:bg-muted/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MicVocal, { className: "mx-auto h-6 w-6 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-medium", children: t("tts.profile.empty") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("tts.profile.emptyHint") })
              ]
            }
          ),
          selectedProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/60 p-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: selectedProfile.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-muted-foreground", children: selectedProfile.referenceAudioPath }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 line-clamp-3 text-muted-foreground", children: selectedProfile.referenceText }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", size: "sm", className: "mt-3", onClick: () => removeVoiceProfile(selectedProfile.id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {}),
              " ",
              t("tts.profile.remove")
            ] })
          ] })
        ] }),
        mode === "design" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.designPrompt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: instruction,
              onChange: (event) => setInstruction(event.target.value),
              placeholder: t("tts.settings.designPlaceholder"),
              className: "mt-2 min-h-28 bg-background"
            }
          ),
          language === "vi" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xs text-warning", children: t("tts.settings.designVietnameseWarning") })
        ] }),
        mode === "auto" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
            t("tts.mode.auto")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs leading-5 text-muted-foreground", children: t("tts.settings.autoDescription") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 border-t border-border/60 pt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.language") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: language, onValueChange: setLanguage, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "vi", children: t("tts.language.vi") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "en", children: t("tts.language.en") }),
              savedLanguages.filter((item) => item.code !== "vi" && item.code !== "en").map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: item.code, children: [
                item.name,
                " (",
                item.code,
                ")"
              ] }, item.code)),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: t("tts.language.auto") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-4 text-muted-foreground", children: t("tts.language.supportedCount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                className: "h-7 px-2 text-2xs",
                onClick: () => setLanguagePickerOpen(true),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Languages, { className: "h-3.5 w-3.5" }),
                  t("tts.language.add")
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.settings.speed") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-primary", children: [
              speed.toFixed(2),
              "×"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "0.75",
              max: "1.5",
              step: "0.05",
              value: speed,
              onChange: (event) => setSpeed(Number(event.target.value)),
              className: "mt-3 w-full accent-primary"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-3.5 w-3.5" }),
            t("tts.settings.quality")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(numStep), onValueChange: (value) => setNumStep(Number(value)), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              advancedEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "8", children: t("tts.quality.preview") }),
              advancedEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "12", children: t("tts.quality.draft") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "16", children: t("tts.quality.fast") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "24", children: t("tts.quality.balanced") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "32", children: t("tts.quality.high") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-t border-border/60 pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { open: advancedOpen, onOpenChange: setAdvancedOpen, className: "rounded-xl border border-border/60 bg-card/55", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 p-3.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "tts-advanced", className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 text-primary" }),
              t("tts.advanced.title")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs leading-4 text-muted-foreground", children: advancedEnabled ? t("tts.advanced.enabledHint") : t("tts.advanced.disabledHint") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                className: "h-8 w-8 p-0",
                "aria-label": advancedOpen ? t("tts.advanced.collapse") : t("tts.advanced.expand"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-4 w-4 text-muted-foreground transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}` })
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "tts-advanced",
                checked: advancedEnabled,
                onCheckedChange: (checked) => {
                  setAdvancedEnabled(checked);
                  if (checked) setAdvancedOpen(true);
                },
                "aria-label": t("tts.advanced.title")
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold", children: t("tts.advanced.performance") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  disabled: !advancedEnabled,
                  onClick: resetAdvancedSettings,
                  className: "h-7 px-2 text-2xs",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3" }),
                    t("tts.advanced.reset")
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.chunkDuration"),
                  description: t("tts.advanced.chunkDurationHint"),
                  value: advancedSettings.audioChunkDuration,
                  min: 5,
                  max: 60,
                  step: 1,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("audioChunkDuration", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.chunkThreshold"),
                  description: t("tts.advanced.chunkThresholdHint"),
                  value: advancedSettings.audioChunkThreshold,
                  min: 5,
                  max: 120,
                  step: 1,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("audioChunkThreshold", value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 rounded-lg bg-warning/10 px-2.5 py-1.5 text-2xs leading-4 text-warning", children: t("tts.advanced.lowVramHint") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("tts.advanced.voiceBehavior") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.guidanceScale"),
                  description: t("tts.advanced.guidanceScaleHint"),
                  value: advancedSettings.guidanceScale,
                  min: 0,
                  max: 5,
                  step: 0.1,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("guidanceScale", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.tShift"),
                  description: t("tts.advanced.tShiftHint"),
                  value: advancedSettings.tShift,
                  min: 0,
                  max: 1,
                  step: 0.05,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("tShift", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.positionTemperature"),
                  description: t("tts.advanced.positionTemperatureHint"),
                  value: advancedSettings.positionTemperature,
                  min: 0,
                  max: 10,
                  step: 0.5,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("positionTemperature", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.classTemperature"),
                  description: t("tts.advanced.classTemperatureHint"),
                  value: advancedSettings.classTemperature,
                  min: 0,
                  max: 10,
                  step: 0.5,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("classTemperature", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.layerPenalty"),
                  description: t("tts.advanced.layerPenaltyHint"),
                  value: advancedSettings.layerPenaltyFactor,
                  min: 0,
                  max: 10,
                  step: 0.5,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("layerPenaltyFactor", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BooleanSetting,
                {
                  label: t("tts.advanced.denoise"),
                  description: t("tts.advanced.denoiseHint"),
                  checked: advancedSettings.denoise,
                  disabled: !advancedEnabled,
                  onCheckedChange: (value) => setAdvancedSetting("denoise", value)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("tts.advanced.output") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BooleanSetting,
                {
                  label: t("tts.advanced.preprocess"),
                  description: t("tts.advanced.preprocessHint"),
                  checked: advancedSettings.preprocessPrompt,
                  disabled: !advancedEnabled,
                  onCheckedChange: (value) => setAdvancedSetting("preprocessPrompt", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BooleanSetting,
                {
                  label: t("tts.advanced.postprocess"),
                  description: t("tts.advanced.postprocessHint"),
                  checked: advancedSettings.postprocessOutput,
                  disabled: !advancedEnabled,
                  onCheckedChange: (value) => setAdvancedSetting("postprocessOutput", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.padDuration"),
                  description: t("tts.advanced.padDurationHint"),
                  value: advancedSettings.padDuration,
                  min: 0,
                  max: 2,
                  step: 0.05,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("padDuration", value)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                NumberSetting,
                {
                  label: t("tts.advanced.fadeDuration"),
                  description: t("tts.advanced.fadeDurationHint"),
                  value: advancedSettings.fadeDuration,
                  min: 0,
                  max: 2,
                  step: 0.05,
                  disabled: !advancedEnabled,
                  onChange: (value) => setAdvancedSetting("fadeDuration", value)
                }
              )
            ] })
          ] })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LanguagePickerDialog,
      {
        open: languagePickerOpen,
        onOpenChange: setLanguagePickerOpen,
        savedLanguages,
        onAdd: (nextLanguage) => {
          addSavedLanguage(nextLanguage);
          setLanguage(nextLanguage.code);
          setLanguagePickerOpen(false);
        },
        onRemove: removeSavedLanguage
      }
    )
  ] });
}
function MissingModelDialog({ controller }) {
  const { t } = useI18n();
  const {
    missingModelOpen,
    setMissingModelOpen,
    selectedModel,
    closeMissingModelPrompt,
    installSelectedModelFromPrompt
  } = controller;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open: missingModelOpen,
      onOpenChange: (open) => open ? setMissingModelOpen(true) : closeMissingModelPrompt(),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("tts.missing.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("tts.missing.description") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: selectedModel.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("tts.missing.size", { size: selectedModel.estimatedDownloadGb }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: closeMissingModelPrompt, children: t("tts.manager.later") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: installSelectedModelFromPrompt, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {}),
            " ",
            t("tts.manager.download")
          ] })
        ] })
      ] })
    }
  );
}
function ModelManagerDialog({ controller }) {
  const { t } = useI18n();
  const {
    managerOpen,
    setManagerOpen,
    engineGroups,
    selectedEngine,
    setSelectedEngineId,
    selectedModel,
    selectedStatus,
    isCapCut,
    isGemini,
    isVbee,
    isOnline,
    installModel,
    removeModel,
    busy,
    progress,
    cancelJob
  } = controller;
  const ready = selectedStatus?.status === "ready";
  const installing = busy && progress?.kind === "install";
  const [geminiKeys, setGeminiKeys] = reactExports.useState([""]);
  const [savingKeys, setSavingKeys] = reactExports.useState(false);
  const [keyMessage, setKeyMessage] = reactExports.useState("");
  const [savedGeminiKeyCount, setSavedGeminiKeyCount] = reactExports.useState(0);
  const [vbeeAppId, setVbeeAppId] = reactExports.useState("");
  const [vbeeToken, setVbeeToken] = reactExports.useState("");
  const [vbeeExpiresAt, setVbeeExpiresAt] = reactExports.useState();
  const [savingVbee, setSavingVbee] = reactExports.useState(false);
  const [vbeeMessage, setVbeeMessage] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!managerOpen || !isGemini) return;
    void window.ttsRuntime?.getGeminiApiKeys().then((keys) => {
      setGeminiKeys(keys.length ? keys : [""]);
      setSavedGeminiKeyCount(keys.length);
      setKeyMessage(keys.length ? t("tts.gemini.keyCount", { count: keys.length }) : t("tts.gemini.noKey"));
    });
  }, [isGemini, managerOpen, t]);
  reactExports.useEffect(() => {
    if (!managerOpen || !isVbee) return;
    void window.ttsRuntime?.getVbeeCredentials().then((credentials) => {
      setVbeeAppId(credentials.appId || "");
      setVbeeToken(credentials.token || "");
      setVbeeExpiresAt(credentials.expiresAt);
      setVbeeMessage(credentials.appId && credentials.token ? t("tts.vbee.configured") : t("tts.vbee.notConfigured"));
    });
  }, [isVbee, managerOpen, t]);
  const saveGeminiKeys = async () => {
    const keys = geminiKeys.map((key) => key.trim()).filter(Boolean);
    setSavingKeys(true);
    try {
      const result = await window.ttsRuntime?.setGeminiApiKeys(keys);
      const keyCount = result?.keyCount || 0;
      setSavedGeminiKeyCount(keyCount);
      setKeyMessage(t("tts.gemini.keysSaved", { count: keyCount }));
    } catch (error) {
      setKeyMessage(error instanceof Error ? error.message : t("tts.gemini.keysSaveFailed"));
    } finally {
      setSavingKeys(false);
    }
  };
  const saveVbeeCredentials = async () => {
    setSavingVbee(true);
    try {
      const result = await window.ttsRuntime?.setVbeeCredentials({ appId: vbeeAppId.trim(), token: vbeeToken.trim() });
      setVbeeExpiresAt(result?.expiresAt);
      setVbeeMessage(result?.configured ? t("tts.vbee.credentialsSaved") : t("tts.vbee.notConfigured"));
    } catch (error) {
      setVbeeMessage(error instanceof Error ? error.message : t("tts.vbee.credentialsSaveFailed"));
    } finally {
      setSavingVbee(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: managerOpen, onOpenChange: setManagerOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("tts.manager.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("tts.manager.chooseEngine") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-5", children: engineGroups.map((engine) => {
      const selected = selectedEngine.id === engine.id;
      const online = engine.models[0].runtimeKind === "online";
      const Icon = engine.id === "gemini" || engine.id === "vbee" ? Cloud : online ? Earth : Cpu;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setSelectedEngineId(engine.id),
          className: `rounded-xl border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/8 ring-1 ring-primary/20" : "border-border/60 bg-card/60 hover:border-primary/40"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: selected ? "default" : "outline", children: online ? t("tts.engine.online") : t("tts.engine.local") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-semibold", children: engine.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs leading-4 text-muted-foreground", children: t(engine.descriptionKey) })
          ]
        },
        engine.id
      );
    }) }),
    !isOnline ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/70 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: selectedModel.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t(selectedModel.descriptionKey) })
          ] })
        ] }),
        ready && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "border-success/30 bg-success/10 text-success hover:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
          " ",
          t("tts.manager.ready")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-muted/35 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("tts.manager.accelerator") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium uppercase", children: selectedStatus?.accelerator || "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-muted/35 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("tts.manager.downloadSize") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 flex items-center gap-1 font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "h-3.5 w-3.5" }),
            "~",
            selectedModel.estimatedDownloadGb,
            " GB"
          ] })
        ] })
      ] }),
      selectedStatus?.messageKey && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-warning", children: t(selectedStatus.messageKey) }),
      selectedStatus?.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-destructive", children: selectedStatus.message }),
      installing && progress ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }),
              getTtsProgressLabel(progress.stage, t)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-muted-foreground", children: progress.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-primary", children: [
            Math.round(progress.percent ?? 0),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress.percent ?? 2, className: "mt-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("tts.manager.installKeepOpen") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: cancelJob, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, {}),
            " ",
            t("tts.action.cancel")
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 flex gap-2", children: !ready ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: busy, onClick: () => installModel(selectedModel), className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {}),
        " ",
        t("tts.manager.download")
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", disabled: busy, onClick: () => removeModel(selectedModel), className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {}),
        " ",
        t("tts.manager.remove")
      ] }) })
    ] }) : isCapCut ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-info/25 bg-info/5 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "CapCut Online" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-success/30 bg-success/10 text-success hover:text-white", children: t("tts.manager.ready") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs leading-5 text-muted-foreground", children: t("tts.capcut.managerDescription") })
      ] })
    ] }) }) : isVbee ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-primary/25 bg-primary/5 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Vbee API" }),
          vbeeAppId.trim() && vbeeToken.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-success/30 bg-success/10 text-success hover:text-white", children: t("tts.manager.ready") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "border-warning/35 bg-warning/10 text-warning", children: t("tts.vbee.notConfigured") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs leading-5 text-muted-foreground", children: t("tts.vbee.managerDescription") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-2xs font-medium text-muted-foreground", children: "App ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: vbeeAppId, onChange: (event) => setVbeeAppId(event.target.value), placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", spellCheck: false, className: "mt-1 h-9 bg-background font-mono text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-2xs font-medium text-muted-foreground", children: "Token" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: vbeeToken, onChange: (event) => setVbeeToken(event.target.value), placeholder: "eyJ...", spellCheck: false, className: "mt-1 h-9 bg-background font-mono text-xs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: vbeeMessage }),
            vbeeExpiresAt && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1 text-2xs ${vbeeExpiresAt <= Date.now() ? "text-destructive" : "text-muted-foreground"}`, children: t("tts.vbee.tokenExpires", { date: new Date(vbeeExpiresAt).toLocaleString() }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", disabled: savingVbee, onClick: saveVbeeCredentials, children: [
            savingVbee ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, {}),
            t("tts.vbee.saveCredentials")
          ] })
        ] })
      ] })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-primary/25 bg-primary/5 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Gemini Pro" }),
          savedGeminiKeyCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-success/30 bg-success/10 text-success hover:text-white", children: t("tts.manager.ready") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "border-warning/35 bg-warning/10 text-warning", children: t("tts.gemini.notConfigured") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs leading-5 text-muted-foreground", children: t("tts.gemini.managerDescription") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
          geminiKeys.map((key, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-12 shrink-0 text-2xs font-medium text-muted-foreground", children: [
              "API ",
              index + 1
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "password",
                value: key,
                onChange: (event) => setGeminiKeys((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item)),
                placeholder: "AIza...",
                spellCheck: false,
                className: "h-9 flex-1 bg-background font-mono text-xs"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "icon",
                className: "h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive",
                disabled: geminiKeys.length === 1,
                onClick: () => setGeminiKeys((current) => current.filter((_, itemIndex) => itemIndex !== index)),
                title: t("tts.gemini.removeKey"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
              }
            )
          ] }, index)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setGeminiKeys((current) => [...current, ""]), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
            t("tts.gemini.addKey")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: keyMessage }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", disabled: savingKeys, onClick: saveGeminiKeys, children: [
            savingKeys ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, {}),
            t("tts.gemini.saveKeys")
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setManagerOpen(false), children: t("common.close") }) })
  ] }) });
}
function VoiceProfileDialog({ controller }) {
  const { t } = useI18n();
  const {
    profileOpen,
    setProfileOpen,
    selectedModel,
    profileName,
    setProfileName,
    referenceAudioPath,
    referenceText,
    setReferenceText,
    pickReferenceAudio,
    saveProfile
  } = controller;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: profileOpen, onOpenChange: setProfileOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("tts.profile.dialogTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("tts.profile.compatibility", { model: selectedModel.name }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.profile.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-2", value: profileName, onChange: (event) => setProfileName(event.target.value), placeholder: t("tts.profile.namePlaceholder") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("tts.profile.referenceAudio") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { readOnly: true, value: referenceAudioPath, placeholder: t("tts.profile.audioPlaceholder") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: pickReferenceAudio, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, {}),
            " ",
            t("tts.profile.choose")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: controller.isVieneu ? t("tts.profile.transcriptOptional") : t("tts.profile.transcript") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            className: "mt-2 min-h-28",
            value: referenceText,
            onChange: (event) => setReferenceText(event.target.value),
            placeholder: t("tts.profile.transcriptPlaceholder")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setProfileOpen(false), children: t("tts.action.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: saveProfile, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, {}),
        " ",
        t("tts.profile.save")
      ] })
    ] })
  ] }) });
}
function TtsWorkspace() {
  const controller = useTtsController();
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-h-0 flex bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TtsSidebar, { onOpenSettings: () => controller.setManagerOpen(true) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 min-h-0 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TtsHeader, { provider: controller.isVieneu ? "vieneu" : controller.isVbee ? "vbee" : controller.isGemini ? "gemini" : controller.isCapCut ? "capcut" : "omnivoice" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(420px,1.25fr)_minmax(340px,0.75fr)] overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "min-h-0 overflow-y-auto border-r border-border/60 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TextEditorCard, { value: controller.text, onChange: controller.setText, splitMode: controller.splitMode }),
          controller.busy && controller.progress && /* @__PURE__ */ jsxRuntimeExports.jsx(GenerationProgress, { progress: controller.progress, onCancel: controller.cancelJob }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "lg",
              disabled: controller.busy,
              onClick: controller.generate,
              className: "min-w-48",
              children: controller.selectedStatus?.status === "ready" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, {}),
                " ",
                t("tts.action.generate")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, {}),
                " ",
                t("tts.action.downloadToGenerate")
              ] })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AudioHistory,
            {
              items: controller.history,
              onRename: controller.renameHistory,
              onRemove: controller.removeHistory
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceSettingsPanel, { controller })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ModelManagerDialog, { controller }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MissingModelDialog, { controller }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceProfileDialog, { controller })
  ] });
}
function TtsVoiceFeature() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TtsWorkspace, {});
}
export {
  TtsVoiceFeature as default
};
