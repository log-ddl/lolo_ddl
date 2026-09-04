import { j as jsxRuntimeExports } from "./radix-ui-G3HX32g5.js";
import { a0 as Circle, $ as CircleX, t as CircleCheck, L as LoaderCircle, r as reactExports, af as Search, aV as Star, O as ChevronRight, bE as Mic, N as ChevronDown, v as ExternalLink, b9 as Image, bq as FileUp, F as Film, aC as Square, _ as Play, d as Trash2, a6 as Copy, a7 as FolderOpen, D as Download, aK as Settings2, P as Pencil, K as Plus, bg as Palette, c as Save } from "./lucide-react-DHCwBhKI.js";
import { p as persist, d as createJSONStorage, I as Input, B as Button, a as useI18n, t as toast, c as cn, b as useVideoStudioSettingsStore, a1 as normalizeAutopilotLongFormThresholdMinutes } from "./index-DI8hnspe.js";
import { u as useNow } from "./use-now-BZ1xkfxg.js";
import { a5 as useAutopilotStore, n as normalizeVideoLength, a as autopilotEngine, a6 as getAbsoluteImagePath, c as useProjectVisualStyleId, s as setProjectVisualStyleId } from "./autopilot-store-5JX3PjC8.js";
import { b as usePreviewStore, d as useBatchQueueStore } from "./entry--3YkNZ1p.js";
import { a as useProjectStore, p as parseSrt } from "./auto-video-store-kYjrHdTY.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { L as Label } from "./label-CEtfDDyg.js";
import { S as ScrollArea } from "./dropdown-menu-BC-MjFZS.js";
import { T as Textarea } from "./textarea-qoaBcCzv.js";
import { S as Switch } from "./switch-CJ1y8I_b.js";
import { S as StylePicker } from "./index-RTeyZCqD.js";
import { u as useTtsStore, a as OMNIVOICE_LANGUAGES } from "./omnivoice-languages-CTJMJr5a.js";
import { C as CAPCUT_API_VOICES, d as CAPCUT_LANGUAGES, T as TTS_MODEL_GROUPS, g as getCapCutVoice } from "./model-registry-B3C-u_uk.js";
import { a as GEMINI_LANGUAGES, G as GEMINI_VOICES } from "./gemini-voices-CGiUf3fL.js";
import { L as LocalImage } from "./local-image-COcd7dBC.js";
import { I as ImagePreviewModal, V as VideoPreviewModal } from "./media-preview-modal-BF74hBBT.js";
import { T as TaskInfoButton } from "./task-info-button-6_NaUIsa.js";
import { S as SplitSceneCard } from "./split-scene-card-CqSxJUME.js";
import { P as Progress } from "./progress-CiMxjjHG.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CDkCw224.js";
import "./supabase-DI0hoIb9.js";
import "./cors-fetch-CkwbEcad.js";
import "./FeatureHeaderIcon-DmiLkYuy.js";
import "./resizable-DC6gTyzy.js";
import "./use-resolved-image-url-B0ytLPJI.js";
const useAutopilotSkillStore = create()(
  persist(
    (set) => ({
      skills: [],
      selectedSkillId: null,
      addSkill: ({ name, content }) => {
        const id = `autopilot_skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = Date.now();
        set((state) => ({
          skills: [...state.skills, { id, name: name.trim(), content, createdAt: now, updatedAt: now }],
          selectedSkillId: id
        }));
        return id;
      },
      updateSkill: (id, updates) => set((state) => ({
        skills: state.skills.map((skill) => skill.id === id ? { ...skill, name: updates.name.trim(), content: updates.content, updatedAt: Date.now() } : skill)
      })),
      deleteSkill: (id) => set((state) => ({
        skills: state.skills.filter((skill) => skill.id !== id),
        selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId
      })),
      selectSkill: (id) => set({ selectedSkillId: id })
    }),
    {
      name: "longdd-autopilot-skills",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ skills: state.skills, selectedSkillId: state.selectedSkillId })
    }
  )
);
const optionalText = (value) => typeof value === "string" && value.trim() ? value.trim() : void 0;
function asObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} phải là object`);
  return value;
}
function requiredText(value, label) {
  const result = optionalText(value);
  if (!result) throw new Error(`${label} không được để trống`);
  return result;
}
function parseAutopilotImportedPlan(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
  }
  const root = asObject(raw, "JSON");
  if (!Array.isArray(root.shots) || root.shots.length === 0) throw new Error("shots phải là mảng có ít nhất 1 shot");
  if (root.shots.length > 500) throw new Error("JSON vượt quá giới hạn 500 shot");
  const shots = root.shots.map((value, index) => {
    const shot = asObject(value, `shots[${index}]`);
    if (shot.characterNames !== void 0 && (!Array.isArray(shot.characterNames) || shot.characterNames.some((name) => typeof name !== "string"))) {
      throw new Error(`shots[${index}].characterNames phải là mảng chuỗi`);
    }
    return {
      voiceOver: requiredText(shot.voiceOver ?? shot.narration, `shots[${index}].voiceOver`),
      imagePrompt: requiredText(shot.imagePrompt, `shots[${index}].imagePrompt`),
      videoPrompt: optionalText(shot.videoPrompt),
      characterNames: Array.isArray(shot.characterNames) ? shot.characterNames.map((name) => String(name).trim()).filter(Boolean) : [],
      sceneName: optionalText(shot.sceneName ?? shot.sceneRefId),
      transitionToNext: optionalText(shot.transitionToNext),
      realImageQuery: optionalText(shot.realImageQuery)
    };
  });
  const parseReferences = (value, kind) => {
    if (value === void 0) return [];
    if (!Array.isArray(value)) throw new Error(`${kind} phải là mảng`);
    return value.map((entry, index) => asObject(entry, `${kind}[${index}]`));
  };
  const characters = parseReferences(root.characters, "characters").map((item, index) => ({
    name: requiredText(item.name, `characters[${index}].name`),
    description: optionalText(item.description),
    characterPrompt: requiredText(item.characterPrompt, `characters[${index}].characterPrompt`)
  }));
  const scenes = parseReferences(root.scenes, "scenes").map((item, index) => ({
    name: requiredText(item.name, `scenes[${index}].name`),
    description: optionalText(item.description),
    scenePrompt: requiredText(item.scenePrompt, `scenes[${index}].scenePrompt`)
  }));
  return {
    version: typeof root.version === "number" ? root.version : void 0,
    title: optionalText(root.title),
    aspectRatio: optionalText(root.aspectRatio),
    allowRealImageResearch: root.allowRealImageResearch === true || shots.some((shot) => Boolean(shot.realImageQuery)),
    characters,
    scenes,
    shots
  };
}
function scriptFromImportedPlan(plan) {
  return plan.shots.map((shot) => shot.voiceOver).join("\n\n");
}
const CODEC_OPTIONS = [
  { value: "libx264", label: "H.264 (CPU)" },
  { value: "libx265", label: "H.265 (CPU)" },
  { value: "h264_nvenc", label: "H.264 (NVIDIA GPU)" }
];
const STATUS_STYLES = {
  queued: "text-amber-600 dark:text-amber-400",
  running: "text-sky-600 dark:text-sky-400",
  done: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  paused: "text-amber-600 dark:text-amber-400",
  interrupted: "text-amber-600 dark:text-amber-400",
  cancelled: "text-muted-foreground"
};
const STATUS_ICONS = {
  queued: Circle,
  running: LoaderCircle,
  done: CircleCheck,
  failed: CircleX,
  paused: Circle,
  interrupted: Circle,
  cancelled: Circle
};
function useActiveElapsedSeconds(status) {
  const isGenerating = status === "generating" || status === "uploading";
  const now = useNow(isGenerating);
  const startedAtRef = reactExports.useRef(null);
  const [startedAt, setStartedAt] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (isGenerating) {
      if (startedAtRef.current === null) {
        startedAtRef.current = Date.now();
        setStartedAt(Date.now());
      }
    } else {
      startedAtRef.current = null;
      setStartedAt(null);
    }
  }, [isGenerating, status]);
  return isGenerating && startedAt !== null ? Math.max(0, Math.floor((now - startedAt) / 1e3)) : 0;
}
function inferAutopilotSkillName(content) {
  return content.match(/^name:\s*(.+)$/im)?.[1]?.trim() || content.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}
function SpeedSlider({ value, onChange, min, max, step, t }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("tts.settings.speed") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs tabular-nums font-medium text-primary", children: [
        value.toFixed(2),
        "×"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min, max, step, value, onChange: (e) => onChange(Number(e.target.value)), className: "mt-1.5 w-full accent-primary" })
  ] });
}
const GEMINI_MODELS = TTS_MODEL_GROUPS.find((group) => group.id === "gemini")?.models ?? [];
function useAutopilotVoiceSettings() {
  const [voiceEngine, setVoiceEngine] = reactExports.useState("vbee");
  const [capcutLanguage, setCapcutLanguage] = reactExports.useState("vi-VN");
  const [capcutVoiceType, setCapcutVoiceType] = reactExports.useState("BV421_vivn_streaming");
  const [geminiLanguage, setGeminiLanguage] = reactExports.useState("vi-VN");
  const [geminiVoiceName, setGeminiVoiceName] = reactExports.useState("Puck");
  const [omniLanguage, setOmniLanguage] = reactExports.useState("vi");
  const [omniProfileId, setOmniProfileId] = reactExports.useState("");
  const omniProfiles = useTtsStore((s) => s.voiceProfiles).filter((profile) => profile.providerId === "omnivoice-local");
  const vieneuProfiles = useTtsStore((s) => s.voiceProfiles).filter((profile) => profile.providerId === "vieneu-local");
  const [vieneuVoices, setVieneuVoices] = reactExports.useState([
    { id: "Trúc Ly", label: "Trúc Ly" },
    { id: "Minh Đức", label: "Minh Đức" }
  ]);
  const [vieneuMode, setVieneuMode] = reactExports.useState("preset");
  const [vieneuVoice, setVieneuVoice] = reactExports.useState(() => useTtsStore.getState().vieneuVoice);
  const [vieneuStyle, setVieneuStyle] = reactExports.useState(() => useTtsStore.getState().vieneuStyle);
  const [vieneuProfileId, setVieneuProfileId] = reactExports.useState("");
  const [vbeeVoices, setVbeeVoices] = reactExports.useState([]);
  const [vbeeVoiceCode, setVbeeVoiceCode] = reactExports.useState(() => useTtsStore.getState().vbeeVoiceCode);
  const [vbeeVoiceSearch, setVbeeVoiceSearch] = reactExports.useState("");
  const vbeeFavoriteVoiceCodes = useTtsStore((state) => state.vbeeFavoriteVoiceCodes);
  const toggleVbeeFavoriteVoice = useTtsStore((state) => state.toggleVbeeFavoriteVoice);
  const [speed, setSpeed] = reactExports.useState(1);
  const [geminiModelId, setGeminiModelId] = reactExports.useState(GEMINI_MODELS[0]?.id || "gemini-3.1-flash-tts-preview");
  const [geminiStyle, setGeminiStyle] = reactExports.useState("");
  const [vbeeAudioType, setVbeeAudioType] = reactExports.useState(() => useTtsStore.getState().vbeeAudioType);
  const [vbeeBitrate, setVbeeBitrate] = reactExports.useState(() => useTtsStore.getState().vbeeBitrate);
  const [omniMode, setOmniMode] = reactExports.useState("auto");
  const [omniInstruction, setOmniInstruction] = reactExports.useState("");
  const [omniNumStep, setOmniNumStep] = reactExports.useState(24);
  const capcutVoices = reactExports.useMemo(
    () => CAPCUT_API_VOICES.filter((voice) => voice.language === capcutLanguage),
    [capcutLanguage]
  );
  const filteredVbeeVoices = reactExports.useMemo(() => {
    const query = vbeeVoiceSearch.trim().toLocaleLowerCase();
    const matching = query ? vbeeVoices.filter((voice) => voice.name.toLocaleLowerCase().includes(query) || voice.code.toLocaleLowerCase().includes(query) || voice.languageCode.toLocaleLowerCase().includes(query) || voice.gender.toLocaleLowerCase().includes(query)) : vbeeVoices;
    const favorites = new Set(vbeeFavoriteVoiceCodes);
    return [...matching].sort((left, right) => Number(favorites.has(right.code)) - Number(favorites.has(left.code)) || left.name.localeCompare(right.name));
  }, [vbeeFavoriteVoiceCodes, vbeeVoiceSearch, vbeeVoices]);
  const vbeeVoiceOptions = reactExports.useMemo(() => {
    if (filteredVbeeVoices.some((voice) => voice.code === vbeeVoiceCode)) return filteredVbeeVoices;
    const selected = vbeeVoices.find((voice) => voice.code === vbeeVoiceCode);
    return selected ? [selected, ...filteredVbeeVoices] : filteredVbeeVoices;
  }, [filteredVbeeVoices, vbeeVoiceCode, vbeeVoices]);
  reactExports.useEffect(() => {
    if (!capcutVoices.some((voice) => voice.voiceType === capcutVoiceType)) {
      const first = capcutVoices[0];
      setCapcutVoiceType(first?.voiceType || "BV421_vivn_streaming");
    }
  }, [capcutLanguage, capcutVoices, capcutVoiceType]);
  reactExports.useEffect(() => {
    if (voiceEngine !== "vbee" || vbeeVoices.length > 0) return;
    void (async () => {
      const result = await window.ttsRuntime?.getVbeeVoices(false);
      if (result?.success && result.voices.length) {
        setVbeeVoices(result.voices);
        if (!result.voices.some((voice) => voice.code === vbeeVoiceCode)) {
          const fallback = result.voices.find((voice) => voice.languageCode === "vi-VN") || result.voices[0];
          setVbeeVoiceCode(fallback.code);
          useTtsStore.getState().setVbeeVoiceCode(fallback.code);
          useTtsStore.getState().setVbeeVoiceName(fallback.name);
        } else {
          const selected = result.voices.find((voice) => voice.code === vbeeVoiceCode);
          if (selected) useTtsStore.getState().setVbeeVoiceName(selected.name);
        }
      }
    })();
  }, [voiceEngine, vbeeVoices.length, vbeeVoiceCode]);
  reactExports.useEffect(() => {
    if (voiceEngine !== "vieneu") return;
    void window.ttsRuntime?.getVieneuVoices().then((result) => {
      if (!result?.success || !result.voices.length) return;
      setVieneuVoices(result.voices);
      if (!result.voices.some((voice) => voice.id === vieneuVoice)) setVieneuVoice(result.voices[0].id);
    });
  }, [voiceEngine, vieneuVoice]);
  const buildVoice = () => {
    if (voiceEngine === "capcut") {
      return {
        capability: "capcut",
        engineName: "CapCut",
        voiceLabel: getCapCutVoice(capcutVoiceType)?.displayName || capcutVoiceType,
        language: capcutLanguage,
        capcutVoiceType,
        capcutResourceId: getCapCutVoice(capcutVoiceType)?.resourceId || "",
        speed
      };
    }
    if (voiceEngine === "gemini") {
      return {
        capability: "gemini",
        engineName: "Gemini",
        voiceLabel: geminiVoiceName,
        modelId: geminiModelId,
        language: geminiLanguage,
        geminiVoiceName,
        geminiStyle: geminiStyle.trim() || void 0
      };
    }
    if (voiceEngine === "vbee") {
      const selected = vbeeVoices.find((item) => item.code === vbeeVoiceCode);
      return {
        capability: "vbee",
        engineName: "Vbee",
        voiceLabel: selected?.name || vbeeVoiceCode,
        language: selected?.languageCode || "vi-VN",
        vbeeVoiceCode,
        vbeeAudioType,
        vbeeBitrate,
        speed
      };
    }
    if (voiceEngine === "vieneu") {
      const profile2 = vieneuMode === "clone" ? vieneuProfiles.find((item) => item.id === vieneuProfileId) : void 0;
      return {
        capability: "vieneu",
        engineName: "VieNeu",
        modelId: "vieneu-v3-turbo",
        repository: "pnnbao97/VieNeu-TTS",
        voiceLabel: profile2?.name || vieneuVoice,
        mode: profile2 ? "clone" : "preset",
        language: "vi",
        vieneuVoice,
        vieneuStyle,
        profileId: profile2?.id,
        referenceAudioPath: profile2?.referenceAudioPath,
        referenceText: profile2?.referenceText
      };
    }
    const profile = omniMode === "clone" ? omniProfiles.find((item) => item.id === omniProfileId) : void 0;
    return {
      capability: "omnivoice",
      engineName: "OmniVoice",
      voiceLabel: omniMode === "clone" ? profile?.name || "Clone" : omniMode === "design" ? "Design" : "Auto",
      mode: omniMode,
      language: omniLanguage,
      speed,
      numStep: omniNumStep,
      instruction: omniMode === "design" ? omniInstruction.trim() || void 0 : void 0,
      profileId: profile?.id,
      referenceAudioPath: profile?.referenceAudioPath,
      referenceText: profile?.referenceText
    };
  };
  return {
    voiceEngine,
    setVoiceEngine,
    capcutLanguage,
    setCapcutLanguage,
    capcutVoiceType,
    setCapcutVoiceType,
    capcutVoices,
    geminiLanguage,
    setGeminiLanguage,
    geminiVoiceName,
    setGeminiVoiceName,
    geminiModelId,
    setGeminiModelId,
    geminiStyle,
    setGeminiStyle,
    vbeeVoices,
    vbeeVoiceCode,
    setVbeeVoiceCode,
    vbeeVoiceSearch,
    setVbeeVoiceSearch,
    filteredVbeeVoices,
    vbeeVoiceOptions,
    vbeeFavoriteVoiceCodes,
    toggleVbeeFavoriteVoice,
    vbeeAudioType,
    setVbeeAudioType,
    vbeeBitrate,
    setVbeeBitrate,
    vieneuVoices,
    vieneuMode,
    setVieneuMode,
    vieneuVoice,
    setVieneuVoice,
    vieneuStyle,
    setVieneuStyle,
    vieneuProfiles,
    vieneuProfileId,
    setVieneuProfileId,
    omniLanguage,
    setOmniLanguage,
    omniProfiles,
    omniProfileId,
    setOmniProfileId,
    omniMode,
    setOmniMode,
    omniInstruction,
    setOmniInstruction,
    omniNumStep,
    setOmniNumStep,
    speed,
    setSpeed,
    buildVoice
  };
}
const SELECT_CLASS = "w-full h-8 rounded-lg border border-border bg-background px-2 text-xs";
function VoiceEnginePicker({ settings, t }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.voice") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: settings.voiceEngine, onChange: (e) => settings.setVoiceEngine(e.target.value), className: SELECT_CLASS, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "capcut", children: "CapCut" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gemini", children: "Gemini" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "vbee", children: "Vbee" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "vieneu", children: "VieNeu" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "omnivoice", children: "OmniVoice" })
    ] })
  ] });
}
function VoiceEngineSettings({ settings: s, t }) {
  if (s.voiceEngine === "capcut") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.language") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.capcutLanguage, onChange: (e) => s.setCapcutLanguage(e.target.value), className: SELECT_CLASS, children: CAPCUT_LANGUAGES.map((language) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: language, children: language }, language)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs mb-1.5 block", children: [
            t("autopilot.panel.voiceSelect"),
            " (",
            s.capcutVoices.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.capcutVoiceType, onChange: (e) => s.setCapcutVoiceType(e.target.value), className: SELECT_CLASS, children: s.capcutVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: voice.voiceType, children: voice.displayName }, `${voice.voiceType}:${voice.resourceId}`)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SpeedSlider, { value: s.speed, onChange: s.setSpeed, min: 0.5, max: 2, step: 0.1, t })
    ] });
  }
  if (s.voiceEngine === "gemini") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: "Model" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.geminiModelId, onChange: (e) => s.setGeminiModelId(e.target.value), className: SELECT_CLASS, children: GEMINI_MODELS.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: model.id, children: model.name }, model.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.language") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.geminiLanguage, onChange: (e) => s.setGeminiLanguage(e.target.value), className: SELECT_CLASS, children: GEMINI_LANGUAGES.map(([code, name]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: code, children: [
            name,
            " (",
            code,
            ")"
          ] }, code)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.voiceSelect") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.geminiVoiceName, onChange: (e) => s.setGeminiVoiceName(e.target.value), className: SELECT_CLASS, children: GEMINI_VOICES.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: voice.name, children: [
          voice.name,
          " — ",
          voice.description,
          " (",
          voice.gender === "F" ? "Nữ" : "Nam",
          ")"
        ] }, voice.name)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.gemini.style") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: s.geminiStyle, onChange: (e) => s.setGeminiStyle(e.target.value), placeholder: t("tts.gemini.stylePlaceholder"), rows: 2, className: "text-xs" })
      ] })
    ] });
  }
  if (s.voiceEngine === "vbee") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs mb-1.5 block", children: [
          t("autopilot.panel.voiceSelect"),
          " (",
          s.filteredVbeeVoices.length,
          "/",
          s.vbeeVoices.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: s.vbeeVoiceSearch, onChange: (event) => s.setVbeeVoiceSearch(event.target.value), placeholder: "Tìm theo tên, mã hoặc ngôn ngữ…", className: "h-8 pl-8 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: s.vbeeVoiceCode,
              onChange: (event) => {
                const code = event.target.value;
                const voice = s.vbeeVoices.find((item) => item.code === code);
                s.setVbeeVoiceCode(code);
                useTtsStore.getState().setVbeeVoiceCode(code);
                if (voice) useTtsStore.getState().setVbeeVoiceName(voice.name);
              },
              className: "h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs",
              children: [
                s.vbeeVoices.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.vbeeVoiceCode, children: "Đang tải giọng Vbee…" }),
                s.vbeeVoiceOptions.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: voice.code, children: [
                  s.vbeeFavoriteVoiceCodes.includes(voice.code) ? "★ " : "",
                  voice.name,
                  " (",
                  voice.languageCode,
                  ")"
                ] }, voice.code))
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "icon",
              className: "h-8 w-8 shrink-0",
              title: s.vbeeFavoriteVoiceCodes.includes(s.vbeeVoiceCode) ? "Bỏ khỏi giọng yêu thích" : "Đánh dấu giọng yêu thích",
              disabled: !s.vbeeVoices.some((voice) => voice.code === s.vbeeVoiceCode),
              onClick: () => s.toggleVbeeFavoriteVoice(s.vbeeVoiceCode),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-3.5 w-3.5 ${s.vbeeFavoriteVoiceCodes.includes(s.vbeeVoiceCode) ? "fill-amber-400 text-amber-500" : ""}` })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-2xs text-muted-foreground", children: [
          "Sẽ đọc bằng: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: s.vbeeVoices.find((voice) => voice.code === s.vbeeVoiceCode)?.name || s.vbeeVoiceCode }),
          " (",
          s.vbeeVoiceCode,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.vbee.audioType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.vbeeAudioType, onChange: (e) => s.setVbeeAudioType(e.target.value), className: SELECT_CLASS, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mp3", children: "MP3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "wav", children: "WAV" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.vbee.bitrate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: String(s.vbeeBitrate), onChange: (e) => s.setVbeeBitrate(Number(e.target.value)), disabled: s.vbeeAudioType === "wav", className: `${SELECT_CLASS} disabled:opacity-50`, children: [8, 16, 32, 64, 128].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value, children: [
            value,
            " kbps"
          ] }, value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SpeedSlider, { value: s.speed, onChange: s.setSpeed, min: 0.1, max: 1.9, step: 0.1, t })
    ] });
  }
  if (s.voiceEngine === "vieneu") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.settings.voiceMode") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.vieneuMode, onChange: (e) => s.setVieneuMode(e.target.value), className: SELECT_CLASS, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "preset", children: t("tts.mode.preset") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "clone", children: t("tts.mode.clone") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.vieneu.style") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.vieneuStyle, onChange: (e) => s.setVieneuStyle(e.target.value), className: SELECT_CLASS, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "tu_nhien", children: t("tts.vieneu.styleNatural") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "tin_tuc", children: t("tts.vieneu.styleNews") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "doc_truyen", children: t("tts.vieneu.styleStory") })
          ] })
        ] })
      ] }),
      s.vieneuMode === "preset" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.voiceSelect") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.vieneuVoice, onChange: (e) => s.setVieneuVoice(e.target.value), className: SELECT_CLASS, children: s.vieneuVoices.map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: voice.id, children: voice.label }, voice.id)) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.voiceProfile") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.vieneuProfileId, onChange: (e) => s.setVieneuProfileId(e.target.value), className: SELECT_CLASS, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("autopilot.panel.omniNoProfile") }),
          s.vieneuProfiles.map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: profile.id, children: profile.name }, profile.id))
        ] }),
        s.vieneuProfiles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: t("autopilot.panel.noVoiceProfiles") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("tts.vieneu.cloneHint") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.settings.voiceMode") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.omniMode, onChange: (e) => s.setOmniMode(e.target.value), className: SELECT_CLASS, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "clone", children: t("tts.mode.clone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "design", children: t("tts.mode.design") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: t("tts.mode.auto") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.language") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: s.omniLanguage, onChange: (e) => s.setOmniLanguage(e.target.value), className: SELECT_CLASS, children: OMNIVOICE_LANGUAGES.map((language) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: language.code, children: [
          language.name,
          " (",
          language.code,
          ")"
        ] }, language.code)) })
      ] })
    ] }),
    s.omniMode === "clone" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("autopilot.panel.voiceProfile") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: s.omniProfileId, onChange: (e) => s.setOmniProfileId(e.target.value), className: SELECT_CLASS, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("autopilot.panel.omniNoProfile") }),
        s.omniProfiles.map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: profile.id, children: profile.name }, profile.id))
      ] }),
      s.omniProfiles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: t("autopilot.panel.noVoiceProfiles") })
    ] }),
    s.omniMode === "design" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.settings.designPrompt") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: s.omniInstruction, onChange: (e) => s.setOmniInstruction(e.target.value), placeholder: t("tts.settings.designPlaceholder"), rows: 2, className: "text-xs" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs mb-1.5 block", children: t("tts.settings.quality") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: String(s.omniNumStep), onChange: (e) => s.setOmniNumStep(Number(e.target.value)), className: SELECT_CLASS, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "16", children: t("tts.quality.fast") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "24", children: t("tts.quality.balanced") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "32", children: t("tts.quality.high") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SpeedSlider, { value: s.speed, onChange: s.setSpeed, min: 0.75, max: 1.5, step: 0.05, t })
    ] })
  ] });
}
function toGenerationStatus(status) {
  if (status === "skipped") return "completed";
  if (status === "queued" || status === "uploading" || status === "generating" || status === "completed" || status === "failed") {
    return status;
  }
  return "idle";
}
function useStartedAt(status) {
  const ref = reactExports.useRef(void 0);
  const [startedAt, setStartedAt] = reactExports.useState(void 0);
  reactExports.useEffect(() => {
    const isGenerating = status === "generating";
    if (isGenerating) {
      if (ref.current === void 0) {
        const now = Date.now();
        ref.current = now;
        setStartedAt(now);
      }
    } else {
      ref.current = void 0;
      setStartedAt(void 0);
    }
  }, [status]);
  return startedAt;
}
function AutopilotShotCard({
  job,
  shot,
  media
}) {
  const { t } = useI18n();
  const updateShotPrompts = useAutopilotStore((s) => s.updateShotPrompts);
  const updateShotVideoLength = useAutopilotStore((s) => s.updateShotVideoLength);
  const removeShotImage = useAutopilotStore((s) => s.removeShotImage);
  const regenerateShotMedia = useAutopilotStore((s) => s.regenerateShotMedia);
  const importShotImage = useAutopilotStore((s) => s.importShotImage);
  const cancelJob = useAutopilotStore((s) => s.cancelJob);
  const busy = job.status === "running" || job.status === "queued";
  const shotIndex = shot.index;
  const imageStartedAt = useStartedAt(media?.imageStatus);
  const videoStartedAt = useStartedAt(media?.videoStatus);
  const scene = reactExports.useMemo(() => ({
    id: shot.index - 1,
    sceneName: shot.sceneRefId || "",
    sceneLocation: "",
    imageDataUrl: media?.imagePath || "",
    imageHttpUrl: null,
    width: 0,
    height: 0,
    imagePrompt: shot.imagePrompt || "",
    imageStatus: toGenerationStatus(media?.imageStatus),
    imageProgress: 0,
    imageError: null,
    imageSource: "ai-generated",
    videoPrompt: shot.videoPrompt || "",
    voiceOver: shot.voiceOver || "",
    videoLength: shot.videoLength,
    videoStatus: toGenerationStatus(media?.videoStatus),
    videoProgress: 0,
    videoUrl: media?.videoPath || null,
    videoError: media?.videoStatus === "failed" ? t("director.generationFailed") : null,
    videoMediaId: media?.videoMediaId || null,
    characterIds: [],
    dialogue: "",
    soundEffectText: "",
    ambientSound: "",
    soundEffects: [],
    row: 0,
    col: 0,
    sourceRect: { x: 0, y: 0, width: 0, height: 0 }
  }), [
    shot.index,
    shot.sceneRefId,
    shot.imagePrompt,
    shot.videoPrompt,
    shot.voiceOver,
    shot.videoLength,
    media?.imagePath,
    media?.imageStatus,
    media?.videoPath,
    media?.videoStatus,
    media?.videoMediaId,
    t
  ]);
  const hasImage = !!media?.imagePath;
  const hasVideo = !!media?.videoPath;
  const imageGenerating = media?.imageStatus === "generating";
  const imageQueued = media?.imageStatus === "queued";
  const videoGenerating = media?.videoStatus === "generating";
  const videoQueued = media?.videoStatus === "queued";
  const imageFailed = media?.imageStatus === "failed";
  const videoFailed = media?.videoStatus === "failed";
  const sceneName = shot.sceneRefId || "";
  const now = useNow(imageGenerating || videoGenerating);
  const imageElapsed = imageGenerating && imageStartedAt ? Math.max(0, Math.floor((now - imageStartedAt) / 1e3)) : 0;
  const videoElapsed = videoGenerating && videoStartedAt ? Math.max(0, Math.floor((now - videoStartedAt) / 1e3)) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "rounded-lg border border-border bg-card overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-3 select-none list-none px-3 py-2 [&::-webkit-details-marker]:hidden hover:bg-muted/30 transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold text-foreground shrink-0", children: [
          "Shot ",
          shot.index
        ] }),
        sceneName && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-foreground truncate", children: sceneName })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
        hasImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-2xs text-green-700 dark:text-green-400", children: "Asset" }) : imageGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-2xs text-primary animate-pulse", children: [
          t("autopilot.card.generating"),
          " ",
          imageElapsed,
          "s"
        ] }) : imageQueued ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-2xs text-amber-600 dark:text-amber-400", children: t("autopilot.panel.waiting") }) : imageFailed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-2xs text-red-600 dark:text-red-400", children: t("autopilot.card.failed") }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-muted border border-border px-2 py-0.5 text-2xs text-muted-foreground", children: [
          shot.videoLength,
          "s"
        ] }),
        hasVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-2xs text-green-700 dark:text-green-400", children: t("autopilot.card.hasVideo") }) : videoGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-2xs text-primary animate-pulse", children: [
          t("autopilot.card.renderingVideo"),
          " ",
          videoElapsed,
          "s"
        ] }) : videoQueued ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-2xs text-amber-600 dark:text-amber-400", children: t("autopilot.panel.waiting") }) : videoFailed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-2xs text-red-600 dark:text-red-400", children: t("autopilot.card.videoFailed") }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TaskInfoButton,
          {
            outputUrl: hasVideo ? media?.videoPath : media?.imagePath,
            prompt: hasVideo ? shot.videoPrompt : shot.imagePrompt,
            kind: hasVideo ? "video" : "image",
            title: t(hasVideo ? "taskInfo.video" : "taskInfo.image")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "autopilot-collapsible-chevron-right h-4 w-4 shrink-0 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border", children: [
      shot.voiceOver?.trim() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 border-b border-border/60 bg-muted/20 px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs leading-relaxed text-foreground/80", title: shot.voiceOver, children: shot.voiceOver })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SplitSceneCard,
        {
          scene,
          isGeneratingAny: busy,
          videoGenerationMode: "image-to-video",
          imageStartedAt,
          videoStartedAt,
          onUpdateImagePrompt: (_id, prompt) => updateShotPrompts(job.id, shotIndex, { imagePrompt: prompt }),
          onUpdateVideoPrompt: (_id, prompt) => updateShotPrompts(job.id, shotIndex, { videoPrompt: prompt }),
          onUpdateCharacters: () => {
          },
          onGenerateImage: () => {
            if (!regenerateShotMedia(job.id, shotIndex, "image")) toast.error(t("autopilot.card.regenBlocked"));
          },
          onGenerateVideo: () => {
            if (!regenerateShotMedia(job.id, shotIndex, "video")) toast.error(t("autopilot.card.regenBlocked"));
          },
          onRemoveImage: () => removeShotImage(job.id, shotIndex),
          onUploadImage: async (_id, dataUrl) => {
            if (await importShotImage(job.id, shotIndex, dataUrl)) toast.success(`Đã import ảnh shot ${shotIndex}`);
          },
          onStopImageGeneration: () => cancelJob(job.id),
          onStopVideoGeneration: () => cancelJob(job.id),
          onUpdateField: (_id, field, value) => {
            if (field === "videoLength") updateShotVideoLength(job.id, shotIndex, normalizeVideoLength(value));
          },
          referenceSlot: /* @__PURE__ */ jsxRuntimeExports.jsx(AutopilotReferenceSelector, { job, shot, disabled: busy })
        }
      )
    ] })
  ] });
}
function AutopilotReferenceSelector({
  job,
  shot,
  disabled
}) {
  const updateShotReferences = useAutopilotStore((s) => s.updateShotReferences);
  const characters = job.plannedCharacters || [];
  const scenes = job.plannedScenes || [];
  const selectedNames = shot.characterNames || [];
  const selectedSet = new Set(selectedNames.map((name) => name.toLocaleLowerCase()));
  const toggleCharacter = (name) => {
    const next = selectedSet.has(name.toLocaleLowerCase()) ? selectedNames.filter((item) => item.toLocaleLowerCase() !== name.toLocaleLowerCase()) : [...selectedNames, name];
    updateShotReferences(job.id, shot.index, { characterNames: next });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-1.5 justify-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs font-semibold text-muted-foreground", children: "Tham chiếu" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground", children: "Nhân vật" }),
      characters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs italic text-muted-foreground/60", children: "Không có nhân vật" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: characters.map((character) => {
        const active = selectedSet.has(character.name.toLocaleLowerCase());
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            disabled,
            onClick: () => toggleCharacter(character.name),
            className: cn(
              "rounded-full border px-2 py-0.5 text-2xs transition-colors disabled:opacity-50",
              active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
            ),
            title: character.characterPrompt,
            children: character.name
          },
          character.name
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground", children: "Cảnh" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: shot.sceneRefId || "",
          disabled: disabled || scenes.length === 0,
          onChange: (event) => updateShotReferences(job.id, shot.index, { sceneRefId: event.target.value }),
          className: "h-7 w-full rounded-lg border border-border bg-background px-2 text-2xs disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Không gắn cảnh" }),
            scenes.map((sceneItem) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: sceneItem.name, children: sceneItem.name }, sceneItem.name)),
            shot.sceneRefId && !scenes.some((sceneItem) => sceneItem.name === shot.sceneRefId) && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: shot.sceneRefId, children: shot.sceneRefId })
          ]
        }
      )
    ] })
  ] });
}
function ReferenceCard({
  job,
  kind,
  name,
  prompt,
  output,
  onPreview
}) {
  const importCharacterImage = useAutopilotStore((state) => state.importCharacterImage);
  const importSceneImage = useAutopilotStore((state) => state.importSceneImage);
  const regenerateReferenceImage = useAutopilotStore((state) => state.regenerateReferenceImage);
  const updateReferencePrompt = useAutopilotStore((state) => state.updateReferencePrompt);
  const busy = job.status === "running" || job.status === "queued";
  const active = output?.status === "generating" || output?.status === "queued";
  const failed = output?.status === "failed";
  const elapsed = useActiveElapsedSeconds(output?.status);
  const [localPrompt, setLocalPrompt] = reactExports.useState(prompt);
  reactExports.useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);
  const saveTimeoutRef = reactExports.useRef();
  const handlePromptChange = (value) => {
    setLocalPrompt(value);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateReferencePrompt(job.id, kind, name, value);
    }, 600);
  };
  const handleImport = async (file) => {
    try {
      const source = await readFileAsDataUrl(file);
      const ok = kind === "character" ? await importCharacterImage(job.id, name, source) : await importSceneImage(job.id, name, source);
      if (ok) toast.success(`Đã import ảnh tham chiếu: ${name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  const handleRegenerate = () => {
    if (!regenerateReferenceImage(job.id, kind, name)) {
      toast.error("Không thể tạo lại lúc này. Hãy tạm dừng job trước.");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("overflow-hidden rounded-lg border bg-card", active ? "border-primary/60" : failed ? "border-red-500/50" : "border-border"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: !output?.imagePath, onClick: () => output?.imagePath && onPreview(output.imagePath), className: cn("relative block w-full bg-muted/30", kind === "character" ? "aspect-square" : "aspect-video"), children: [
      output?.imagePath ? /* @__PURE__ */ jsxRuntimeExports.jsx(LocalImage, { src: output.imagePath, alt: name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-full w-full items-center justify-center", children: active ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-5 w-5 text-muted-foreground/50" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-2xs", output?.imagePath ? "bg-green-600 text-white" : failed ? "bg-red-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"), children: output?.imagePath ? "Đã có" : failed ? "Lỗi" : output?.status === "generating" || output?.status === "uploading" ? `${elapsed}s` : output?.status === "queued" ? "Chờ gửi đi" : "Chờ" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 p-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-2xs font-medium", children: name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: localPrompt,
          onChange: (e) => handlePromptChange(e.target.value),
          disabled: busy,
          rows: 2,
          className: "w-full resize-none rounded border border-border bg-background px-1.5 py-1 text-2xs text-foreground leading-tight focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50",
          placeholder: "Mô tả nhân vật / cảnh..."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: cn("flex h-5 flex-1 cursor-pointer items-center justify-center rounded border border-border text-2xs hover:bg-muted", busy && "pointer-events-none opacity-50"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "mr-0.5 h-2.5 w-2.5" }),
          output?.imagePath ? "Thay" : "Import",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", disabled: busy, onChange: (event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) void handleImport(file);
          } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: busy, onClick: handleRegenerate, className: cn("flex h-5 flex-1 items-center justify-center rounded border border-border text-2xs hover:bg-muted", busy && "pointer-events-none opacity-50"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-0.5 h-2.5 w-2.5" }),
          "Tạo lại"
        ] })
      ] })
    ] })
  ] });
}
function JobMediaGallery({ job }) {
  const { t } = useI18n();
  const [preview, setPreview] = reactExports.useState(null);
  const updateShotImagePath = useAutopilotStore((state) => state.updateShotImagePath);
  const characters = job.plannedCharacters || [];
  const scenes = job.plannedScenes || [];
  const shots = job.plannedShots || [];
  const researchedImages = job.mediaOutputs?.filter((item) => item.realImagePath) || [];
  if (characters.length === 0 && scenes.length === 0 && shots.length === 0 && researchedImages.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground", children: [
        "Không gian làm việc (",
        characters.length + scenes.length + shots.length,
        " mục)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-t border-border p-2.5", children: [
        characters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, className: "order-2 group/section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" }),
            t("autopilot.panel.characterReferences"),
            " (",
            characters.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2", children: characters.map((character) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReferenceCard, { job, kind: "character", name: character.name, prompt: character.characterPrompt, output: job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === character.name.toLocaleLowerCase()), onPreview: (path) => setPreview({ type: "image", path }) }, character.name)) })
        ] }),
        scenes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, className: "order-3 group/section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" }),
            t("autopilot.panel.sceneReferences"),
            " (",
            scenes.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2", children: scenes.map((scene) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReferenceCard, { job, kind: "scene", name: scene.name, prompt: scene.scenePrompt, output: job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === scene.name.toLocaleLowerCase()), onPreview: (path) => setPreview({ type: "image", path }) }, scene.name)) })
        ] }),
        researchedImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, className: "order-1 group/section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" }),
            t("autopilot.panel.researchedImages"),
            " (",
            researchedImages.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2", children: researchedImages.map((shot) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border bg-card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setPreview({ type: "image", path: shot.realImagePath }), className: "relative block w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LocalImage, { src: shot.realImagePath, alt: shot.realImageTitle || `Real image ${shot.index}`, className: "aspect-video w-full object-cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-2xs text-white", children: [
                "Shot ",
                shot.index
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 p-1.5 text-2xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate", title: shot.realImageTitle, children: shot.realImageTitle || shot.realImageQuery }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-end gap-2 text-muted-foreground", children: shot.realImageSourceUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 px-1.5 text-2xs", onClick: () => void window.authBridge?.openExternal(shot.realImageSourceUrl), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-1 h-3 w-3" }),
                t("autopilot.panel.openSource")
              ] }) })
            ] })
          ] }, `real-${shot.index}`)) })
        ] }),
        shots.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, className: "order-4 group/section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" }),
            t("autopilot.panel.shotMedia"),
            " (",
            shots.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-3 gap-3", children: shots.map((shot) => /* @__PURE__ */ jsxRuntimeExports.jsx(AutopilotShotCard, { job, shot, media: job.mediaOutputs?.find((item) => item.index === shot.index) }, shot.id || shot.index)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePreviewModal, { imageUrl: preview?.type === "image" ? preview.path : "", isOpen: preview?.type === "image", onClose: () => setPreview(null), onImageCleaned: (cleanedUrl) => {
      if (preview?.shotIndex != null) {
        updateShotImagePath(job.id, preview.shotIndex, cleanedUrl);
      }
      setPreview({ type: "image", path: cleanedUrl, shotIndex: preview?.shotIndex });
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPreviewModal, { videoUrl: preview?.type === "video" ? preview.path : "", isOpen: preview?.type === "video", onClose: () => setPreview(null) })
  ] });
}
function ShotPreviewOverlay() {
  const previewItem = usePreviewStore((s) => s.previewItem);
  const setPreviewItem = usePreviewStore((s) => s.setPreviewItem);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePreviewModal,
      {
        imageUrl: previewItem?.type === "image" ? previewItem.url : "",
        isOpen: previewItem?.type === "image",
        onClose: () => setPreviewItem(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      VideoPreviewModal,
      {
        videoUrl: previewItem?.type === "video" ? previewItem.url : "",
        isOpen: previewItem?.type === "video",
        onClose: () => setPreviewItem(null)
      }
    )
  ] });
}
const JOB_STEPS = [
  ["audio", "Voice"],
  ["shots", "Chia shot"],
  ["research", "Tư liệu"],
  ["references", "Tham chiếu"],
  ["images", "Ảnh"],
  ["videos", "Video"],
  ["render", "Ghép/Xuất"]
];
function JobStageTimeline({ job }) {
  const completed = new Set(job.completedSteps || []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7", children: JOB_STEPS.map(([step, label]) => {
    const done = completed.has(step);
    const active = !done && (job.nextStep === step || job.stage === step || step === "references" && (job.stage === "characters" || job.stage === "scenes"));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-2xs", done ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400" : active ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground"), children: [
      done ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3 shrink-0" }) : active && job.status === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 shrink-0 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-3 w-3 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: label })
    ] }, step);
  }) });
}
function LongFormChapterProgress({ job }) {
  const chapters = job.longFormMode ? job.chapters || [] : [];
  if (chapters.length === 0) return null;
  const done = chapters.filter((chapter) => chapter.status === "done").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/10 p-3 space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Long-form chapters" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        done,
        "/",
        chapters.length,
        " checkpoint"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: chapters.map((chapter) => {
      const durationSec = Math.max(0, Math.round((chapter.endMs - chapter.startMs) / 1e3));
      const planning = chapter.status === "queued" || chapter.status === "running";
      const rendering = chapter.renderStatus === "queued" || chapter.renderStatus === "running";
      const active = planning || rendering;
      const failed = chapter.status === "failed" || chapter.renderStatus === "failed";
      const visibleProgress = rendering || chapter.renderStatus === "done" ? chapter.renderProgress || 0 : chapter.progress;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
        "rounded-lg border p-2 text-2xs space-y-1.5",
        failed ? "border-red-500/50 bg-red-500/5" : active ? "border-primary/60 bg-primary/5" : "border-border bg-card"
      ), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
            "Chương ",
            chapter.index
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            Math.floor(durationSec / 60),
            ":",
            String(durationSec % 60).padStart(2, "0")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: visibleProgress, className: "h-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [
          active && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin text-primary" }),
          !active && chapter.status === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3 text-green-600" }),
          failed && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3 text-red-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: chapter.outputVideoPath ? "MP4 checkpoint sẵn sàng" : rendering ? "đang render MP4" : chapter.status })
        ] }),
        (chapter.renderError || chapter.error) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "line-clamp-2 text-red-500", title: chapter.renderError || chapter.error, children: chapter.renderError || chapter.error })
      ] }, chapter.id);
    }) })
  ] });
}
function JobLog({ jobId }) {
  const [, forceUpdate] = reactExports.useState(0);
  const logRef = reactExports.useRef(null);
  const job = autopilotEngine.getJob(jobId);
  const logLength = job?.log.length ?? 0;
  reactExports.useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logLength]);
  reactExports.useEffect(() => {
    const off = autopilotEngine.onEvent((event) => {
      if (event.type === "log" && event.jobId === jobId) forceUpdate((n) => n + 1);
    });
    return () => off();
  }, [jobId]);
  if (!job) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: logRef, className: "max-h-48 overflow-y-auto bg-muted/30 border border-border rounded-lg p-2 font-mono text-2xs space-y-1", children: job.log.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground shrink-0", children: new Date(entry.ts).toLocaleTimeString() }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: entry.stage === "error" ? "text-red-500" : "text-foreground/80", children: [
      "[",
      entry.stage,
      "] ",
      entry.message
    ] })
  ] }, index)) });
}
function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function toFileUrl(absolutePath) {
  let normalized = absolutePath.replace(/\\/g, "/");
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  return `file://${encodeURI(normalized)}`;
}
function buildFcpxml(options) {
  const fps = Math.max(1, Math.round(options.fps));
  const toFrames = (ms) => Math.max(0, Math.round(ms / 1e3 * fps));
  const ftime = (frames) => `${frames}/${fps}s`;
  const totalFrames = options.clips.length > 0 ? toFrames(Math.max(...options.clips.map((clip) => clip.endMs))) : 0;
  const audioFrames = options.audioDurationMs ? toFrames(options.audioDurationMs) : totalFrames;
  const seqFrames = Math.max(totalFrames, audioFrames, 1);
  const offsets = options.clips.map((clip) => toFrames(clip.startMs));
  const slots = offsets.map(
    (offset, index) => Math.max(1, (index < offsets.length - 1 ? offsets[index + 1] : seqFrames) - offset)
  );
  const resources = [
    `    <format id="r1" name="FFVideoFormat${options.height}p${fps}" frameDuration="1/${fps}s" width="${options.width}" height="${options.height}" colorSpace="1-1-1 (Rec. 709)"/>`
  ];
  const clipElement = (clip, index, indent, lane) => {
    const assetId = `a${index + 1}`;
    const offsetFrames = offsets[index];
    const slotFrames = slots[index];
    const mediaFrames = clip.mediaDurationSec ? toFrames(clip.mediaDurationSec * 1e3) : 0;
    const audioAttr = clip.isImage ? "" : ' hasAudio="1" audioSources="1"';
    resources.push(
      `    <asset id="${assetId}" name="${xmlEscape(clip.name)}" uid="${assetId}" start="0s" hasVideo="1" videoSources="1"${audioAttr} format="r1" duration="${ftime(clip.isImage ? slotFrames : Math.max(1, mediaFrames || slotFrames))}">
      <media-rep kind="original-media" src="${xmlEscape(toFileUrl(clip.src))}"/>
    </asset>`
    );
    const needsRetime = !clip.isImage && mediaFrames > 0 && mediaFrames < slotFrames - 1;
    const timeMap = needsRetime ? `
${indent}  <timeMap>
${indent}    <timept time="0s" value="0s" interp="linear"/>
${indent}    <timept time="${ftime(slotFrames)}" value="${ftime(mediaFrames)}" interp="linear"/>
${indent}  </timeMap>` : "";
    const laneAttr = lane != null ? ` lane="${lane}"` : "";
    return `${indent}<asset-clip ref="${assetId}"${laneAttr} offset="${ftime(offsetFrames)}" name="${xmlEscape(clip.name)}" duration="${ftime(slotFrames)}" start="0s" format="r1">${timeMap}
${indent}</asset-clip>`;
  };
  let spineBody;
  if (options.audioSrc) {
    resources.push(
      `    <asset id="aud" name="Narration" uid="aud" start="0s" hasAudio="1" audioSources="1" duration="${ftime(audioFrames)}">
      <media-rep kind="original-media" src="${xmlEscape(toFileUrl(options.audioSrc))}"/>
    </asset>`
    );
    const connected = options.clips.map((clip, index) => clipElement(clip, index, "            ", 1)).join("\n");
    spineBody = `        <asset-clip ref="aud" offset="0s" name="Narration" duration="${ftime(seqFrames)}" start="0s">
${connected}
        </asset-clip>`;
  } else {
    spineBody = options.clips.map((clip, index) => clipElement(clip, index, "        ")).join("\n");
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
${resources.join("\n")}
  </resources>
  <library>
    <event name="AutoPilot">
      <project name="${xmlEscape(options.title)}">
        <sequence format="r1" duration="${ftime(seqFrames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
${spineBody}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
function ExportFcpxmlButton({ job }) {
  const [busy, setBusy] = reactExports.useState(false);
  const handleExport = reactExports.useCallback(async () => {
    setBusy(true);
    try {
      const media = job.mediaOutputs || [];
      const pending = [];
      for (const shot of job.plannedShots || []) {
        const item = media.find((m) => m.index === shot.index);
        const rawPath = item?.videoPath || item?.imagePath || "";
        if (!rawPath) continue;
        const abs = await getAbsoluteImagePath(rawPath);
        if (!abs || abs.startsWith("http://") || abs.startsWith("https://") || abs.includes("://")) continue;
        const isImage = !item?.videoPath;
        pending.push({
          index: shot.index,
          src: abs,
          startMs: shot.startMs,
          endMs: shot.endMs,
          name: `Shot ${shot.index}`,
          isImage,
          cachedSec: isImage ? void 0 : item?.videoDurationSec
        });
      }
      if (pending.length === 0) {
        toast.error("Không có clip nào để xuất (chưa có video/ảnh).");
        return;
      }
      const toProbe = pending.filter((p) => !p.isImage && !p.cachedSec);
      const probed = /* @__PURE__ */ new Map();
      if (toProbe.length > 0) {
        let cursor = 0;
        const worker = async () => {
          while (cursor < toProbe.length) {
            const current = toProbe[cursor++];
            const result2 = await window.ffmpegRuntime?.probeDuration(current.src);
            if (result2?.durationSec) probed.set(current.index, result2.durationSec);
          }
        };
        await Promise.all(Array.from({ length: Math.min(8, toProbe.length) }, worker));
        if (probed.size > 0) {
          autopilotEngine.cacheShotVideoDurations(
            job.id,
            [...probed].map(([index, durationSec]) => ({ index, durationSec }))
          );
        }
      }
      const clips = pending.map((p) => ({
        src: p.src,
        startMs: p.startMs,
        endMs: p.endMs,
        name: p.name,
        isImage: p.isImage,
        mediaDurationSec: p.isImage ? void 0 : p.cachedSec || probed.get(p.index)
      }));
      let audioSrc;
      if (job.audioPath) {
        const abs = await getAbsoluteImagePath(job.audioPath);
        if (abs && !abs.startsWith("http") && !abs.includes("://")) audioSrc = abs;
      }
      const [w, h] = (job.input?.resolution || "1920x1080").split("x").map(Number);
      const xml = buildFcpxml({
        title: job.title,
        width: w || 1920,
        height: h || 1080,
        fps: job.input?.fps || 30,
        clips,
        audioSrc,
        audioDurationMs: job.audioDurationMs
      });
      const defaultName = (job.title.replace(/[^a-zA-Z0-9À-ɏ_-]+/g, "_") || "autopilot") + "_davinci";
      const result = await window.autoEditRuntime?.saveText({ content: xml, defaultName, extension: "fcpxml" });
      if (result?.success) toast.success(`Đã xuất FCPXML (${clips.length} clip) cho DaVinci`);
      else if (result && !result.canceled) toast.error(result.error || "Xuất FCPXML thất bại");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [job]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", disabled: busy, onClick: handleExport, title: "Xuất timeline .fcpxml để mở/chỉnh/render trong DaVinci Resolve (không tạo lại media)", children: [
    busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "h-3.5 w-3.5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 hidden sm:inline", children: "DaVinci" })
  ] });
}
function RerenderControl({ job }) {
  const rerenderJob = useAutopilotStore((s) => s.rerenderJob);
  const [open, setOpen] = reactExports.useState(false);
  const [subtitles, setSubtitles] = reactExports.useState(job.input?.subtitles === true);
  const [bgmPath, setBgmPath] = reactExports.useState(job.input?.bgmPath || "");
  const [bgmVolume, setBgmVolume] = reactExports.useState(job.input?.bgmVolume ?? 0.25);
  const [bgmDuckVoice, setBgmDuckVoice] = reactExports.useState(job.input?.bgmDuckVoice ?? true);
  const [resolution, setResolution] = reactExports.useState(job.input?.resolution || "1920x1080");
  const [codec, setCodec] = reactExports.useState(job.input?.codec || "libx264");
  const [fps, setFps] = reactExports.useState(job.input?.fps ?? 30);
  const [audioNormalize, setAudioNormalize] = reactExports.useState(job.input?.audioNormalize === true);
  const [videoAudioVolume, setVideoAudioVolume] = reactExports.useState(job.input?.videoAudioVolume ?? 0);
  const handleRerender = () => {
    const ok = rerenderJob(job.id, {
      subtitles,
      bgmPath: bgmPath.trim() || void 0,
      bgmVolume,
      bgmDuckVoice,
      resolution,
      codec,
      fps,
      audioNormalize,
      videoAudioVolume
    });
    if (ok) {
      toast.success("Đang ghép lại video...");
      setOpen(false);
    } else {
      toast.error("Chưa thể ghép lại (job đang chạy hoặc chưa đủ media).");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", title: "Ghép lại video (không tạo lại media)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 hidden sm:inline", children: "Ghép lại" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "end", className: "w-72 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: "Ghép lại video" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Chỉ trộn lại bản cuối từ media đã có — không tạo lại ảnh/video, không tốn credit." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Phụ đề" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: subtitles, onCheckedChange: setSubtitles })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Nhạc nền (BGM)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: bgmPath, onChange: (e) => setBgmPath(e.target.value), placeholder: "Đường dẫn file nhạc (tuỳ chọn)", className: "text-xs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "w-16 text-2xs text-muted-foreground", children: "Âm lượng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: bgmVolume, onChange: (e) => setBgmVolume(Number(e.target.value)), className: "flex-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-8 text-right text-2xs tabular-nums", children: [
            Math.round(bgmVolume * 100),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs text-muted-foreground", children: "Giảm nhạc khi có giọng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: bgmDuckVoice, onCheckedChange: setBgmDuckVoice })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Độ phân giải" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: resolution, onChange: (e) => setResolution(e.target.value), className: "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1280x720", children: "1280×720" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1920x1080", children: "1920×1080" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "3840x2160", children: "3840×2160" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "FPS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: fps, onChange: (e) => setFps(Number(e.target.value)), className: "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs", children: [24, 30, 60].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: value }, value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Encoder" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: codec, onChange: (e) => setCodec(e.target.value), className: "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs", children: CODEC_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Chuẩn hóa âm thanh (-14 LUFS)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: audioNormalize, onCheckedChange: setAudioNormalize })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Âm lượng video gốc" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs tabular-nums text-muted-foreground", children: videoAudioVolume === 0 ? "Tắt" : `${Math.round(videoAudioVolume * 100)}%` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 0.5, step: 0.05, value: videoAudioVolume, onChange: (e) => setVideoAudioVolume(Number(e.target.value)), className: "w-full accent-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "w-full", onClick: handleRerender, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "mr-1.5 h-3.5 w-3.5" }),
        "Ghép lại"
      ] })
    ] })
  ] });
}
const IDLE_STATUSES = ["failed", "paused", "interrupted", "cancelled"];
function JobCard({
  job,
  expanded,
  now,
  onToggleExpand,
  onCancel,
  onResume,
  onRemove,
  onCopyPath,
  onSaveVideo,
  t
}) {
  const Icon = STATUS_ICONS[job.status];
  const isBusy = job.status === "running" || job.status === "queued";
  const isIdle = IDLE_STATUSES.includes(job.status);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-3 space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("w-4 h-4 shrink-0", STATUS_STYLES[job.status], job.status === "running" && "animate-spin") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: job.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xs text-muted-foreground truncate", children: job.id })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: job.stage }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        isBusy && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", title: t("autopilot.panel.pause"), onClick: onCancel, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-3.5 h-3.5" }) }),
        isIdle && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", title: t("autopilot.panel.resume"), onClick: onResume, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-3.5 h-3.5" }),
          job.awaitingNextStep && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5", children: "Bước tiếp theo" })
        ] }),
        job.completedSteps?.includes("videos") && !isBusy && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RerenderControl, { job }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExportFcpxmlButton, { job })
        ] }),
        (job.status === "done" || isIdle) && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: onRemove, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: onToggleExpand, children: expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-3.5 h-3.5" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: job.progress, className: "flex-1" }),
      job.status === "running" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-2xs tabular-nums text-muted-foreground", children: [
        Math.max(0, Math.floor((now - job.createdAt) / 1e3)),
        "s"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: job.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(JobStageTimeline, { job }),
    job.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2", children: job.error }),
    job.outputVideoPath && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-green-500/30 bg-green-500/5 p-2 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate flex-1", children: job.outputVideoPath }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", title: t("autopilot.panel.copyPath"), onClick: () => onCopyPath(job.outputVideoPath), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", title: t("autopilot.panel.openOutput"), onClick: () => void window.autoVideoRuntime?.openFile(job.outputVideoPath), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "default", size: "sm", onClick: () => onSaveVideo(job.outputVideoPath, job.title), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5 mr-1" }),
          t("autopilot.panel.saveMp4")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("autopilot.panel.savedInLibrary") })
    ] }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(LongFormChapterProgress, { job }),
    expanded && job.input?.script && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "rounded-lg border border-border bg-muted/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground", children: "Kịch bản" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap text-xs text-foreground/80 max-h-60 overflow-y-auto", children: job.input.script }) })
    ] }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(JobMediaGallery, { job }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "rounded-lg border border-border bg-muted/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground", children: "Nhật ký kỹ thuật" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(JobLog, { jobId: job.id }) })
    ] })
  ] });
}
function AutopilotPanel() {
  const { t } = useI18n();
  const jobs = useAutopilotStore((s) => s.jobs);
  const createJob = useAutopilotStore((s) => s.createJob);
  const cancelJob = useAutopilotStore((s) => s.cancelJob);
  const resumeJob = useAutopilotStore((s) => s.resumeJob);
  const removeJob = useAutopilotStore((s) => s.removeJob);
  const longFormThresholdMinutes = useVideoStudioSettingsStore((s) => s.autopilot.longFormThresholdMinutes);
  const setAutopilotSettings = useVideoStudioSettingsStore((s) => s.setAutopilot);
  const visualStyleId = useProjectVisualStyleId();
  const savedSkills = useAutopilotSkillStore((s) => s.skills);
  const selectedSkillId = useAutopilotSkillStore((s) => s.selectedSkillId);
  const addSkill = useAutopilotSkillStore((s) => s.addSkill);
  const updateSkill = useAutopilotSkillStore((s) => s.updateSkill);
  const deleteSkill = useAutopilotSkillStore((s) => s.deleteSkill);
  const selectSkill = useAutopilotSkillStore((s) => s.selectSkill);
  const [script, setScript] = reactExports.useState("");
  const [skillName, setSkillName] = reactExports.useState("");
  const [skillText, setSkillText] = reactExports.useState("");
  const [skillExpanded, setSkillExpanded] = reactExports.useState(false);
  const [maxShots, setMaxShots] = reactExports.useState(0);
  const [aspectRatio, setAspectRatio] = reactExports.useState("16:9");
  const [voiceSource, setVoiceSource] = reactExports.useState("tts");
  const [importedAudioPath, setImportedAudioPath] = reactExports.useState("");
  const [importedSrtRaw, setImportedSrtRaw] = reactExports.useState("");
  const [importedSrtName, setImportedSrtName] = reactExports.useState("");
  const srtInputRef = reactExports.useRef(null);
  const [importedPlan, setImportedPlan] = reactExports.useState(null);
  const [importedPlanName, setImportedPlanName] = reactExports.useState("");
  const planInputRef = reactExports.useRef(null);
  const [subtitles, setSubtitles] = reactExports.useState(false);
  const [bgmPath, setBgmPath] = reactExports.useState("");
  const [codec, setCodec] = reactExports.useState("libx264");
  const [audioNormalize, setAudioNormalize] = reactExports.useState(false);
  const [videoAudioVolume, setVideoAudioVolume] = reactExports.useState(0);
  const [mergeAfterCreate, setMergeAfterCreate] = reactExports.useState(true);
  const [advancedExpanded, setAdvancedExpanded] = reactExports.useState(false);
  const [expandedJob, setExpandedJob] = reactExports.useState(null);
  const now = useNow(jobs.some((job) => job.status === "running" || job.status === "queued"));
  const voice = useAutopilotVoiceSettings();
  reactExports.useEffect(() => {
    if (!selectedSkillId) {
      setSkillName("");
      setSkillText("");
      return;
    }
    const selected = savedSkills.find((skill) => skill.id === selectedSkillId);
    if (!selected) {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }
    setSkillName(selected.name);
    setSkillText(selected.content);
  }, [savedSkills, selectedSkillId, selectSkill]);
  const handleSelectSkill = reactExports.useCallback((id) => {
    if (id === "new") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      setSkillExpanded(true);
      return;
    }
    if (id === "none") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }
    const selected = savedSkills.find((skill) => skill.id === id);
    if (!selected) return;
    selectSkill(id);
    setSkillName(selected.name);
    setSkillText(selected.content);
    setSkillExpanded(false);
  }, [savedSkills, selectSkill]);
  const handleSaveSkill = reactExports.useCallback(() => {
    const content = skillText.trim();
    if (!content) return;
    const name = skillName.trim() || inferAutopilotSkillName(content) || t("autopilot.panel.untitledSkill");
    if (selectedSkillId && savedSkills.some((skill) => skill.id === selectedSkillId)) {
      updateSkill(selectedSkillId, { name, content });
      toast.success(t("autopilot.panel.skillUpdated", { name }));
    } else {
      addSkill({ name, content });
      toast.success(t("autopilot.panel.skillSaved", { name }));
    }
    setSkillName(name);
  }, [addSkill, savedSkills, selectedSkillId, skillName, skillText, t, updateSkill]);
  const handleDeleteSkill = reactExports.useCallback(() => {
    if (!selectedSkillId) return;
    const selected = savedSkills.find((skill) => skill.id === selectedSkillId);
    if (!selected || !window.confirm(t("autopilot.panel.deleteSkillConfirm", { name: selected.name }))) return;
    deleteSkill(selectedSkillId);
    setSkillName("");
    setSkillText("");
    toast.success(t("autopilot.panel.skillDeleted"));
  }, [deleteSkill, savedSkills, selectedSkillId, t]);
  const buildInput = reactExports.useCallback((executionMode) => {
    if (voiceSource === "import" && !importedAudioPath.trim()) {
      toast.error(t("autopilot.panel.audioRequired"));
      return null;
    }
    const input = {
      title: importedPlan?.title,
      script: script.trim() || void 0,
      skill: skillText.trim() || void 0,
      maxShots: importedPlan ? void 0 : maxShots > 0 ? maxShots : void 0,
      longFormThresholdMinutes,
      aspectRatio,
      importedAudioPath: voiceSource === "import" ? importedAudioPath.trim() || void 0 : void 0,
      importedSrtRaw: voiceSource === "import" ? importedSrtRaw.trim() || void 0 : void 0,
      importedPlan: importedPlan || void 0,
      voice: voice.buildVoice(),
      subtitles,
      bgmPath: bgmPath.trim() || void 0,
      codec,
      audioNormalize: audioNormalize || void 0,
      videoAudioVolume: videoAudioVolume > 0 ? videoAudioVolume : void 0,
      resolution: "1920x1080",
      executionMode,
      stopAfterStep: mergeAfterCreate ? void 0 : "videos"
    };
    if (!input.script && !input.importedAudioPath) {
      toast.error(t("autopilot.panel.noInput"));
      return null;
    }
    return input;
  }, [t, importedPlan, script, skillText, maxShots, longFormThresholdMinutes, aspectRatio, voiceSource, importedAudioPath, importedSrtRaw, voice, subtitles, bgmPath, codec, audioNormalize, videoAudioVolume, mergeAfterCreate]);
  const handleCreate = reactExports.useCallback((executionMode) => {
    const input = buildInput(executionMode);
    if (!input) return;
    const result = createJob(input);
    if (result.ok) {
      toast.success(t("autopilot.panel.jobCreated", { id: result.jobId ?? "" }));
      if (result.jobId) setExpandedJob(result.jobId);
      setScript("");
      setImportedPlan(null);
      setImportedPlanName("");
    } else {
      toast.error(result.error || t("autopilot.panel.createFailed"));
    }
  }, [t, buildInput, createJob]);
  const handleAddToQueue = reactExports.useCallback(() => {
    const input = buildInput("all");
    if (!input) return;
    const { activeProjectId, projects } = useProjectStore.getState();
    if (!activeProjectId) {
      toast.error("Chưa có dự án đang mở để thêm vào hàng chờ");
      return;
    }
    const projectName = projects.find((p) => p.id === activeProjectId)?.name || "Dự án";
    useBatchQueueStore.getState().addEntry({
      projectId: activeProjectId,
      projectName,
      label: mergeAfterCreate ? "AutoPilot đầy đủ" : "Chỉ tạo video (chưa ghép)",
      stopAfterStep: input.stopAfterStep,
      input: { ...input, title: projectName }
    });
    toast.success(`Đã thêm "${projectName}" vào hàng chờ`);
  }, [buildInput, mergeAfterCreate]);
  const handlePickNarrationAudio = reactExports.useCallback(async () => {
    const result = await window.ttsRuntime?.pickReferenceAudio(t("autopilot.panel.importAudio"));
    if (result?.path) setImportedAudioPath(result.path);
  }, [t]);
  const handlePickSrt = reactExports.useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    const result = parseSrt(text);
    if (result.segments.length === 0) {
      toast.error(t("autopilot.panel.srtInvalid"));
      return;
    }
    setImportedSrtRaw(text);
    setImportedSrtName(file.name);
    toast.success(t("autopilot.panel.srtLoaded", { count: result.segments.length }));
  }, [t]);
  const handleClearSrt = reactExports.useCallback(() => {
    setImportedSrtRaw("");
    setImportedSrtName("");
  }, []);
  const handlePickPlan = reactExports.useCallback(async (file) => {
    if (!file) return;
    try {
      const plan = parseAutopilotImportedPlan(await file.text());
      setImportedPlan(plan);
      setImportedPlanName(file.name);
      setScript(scriptFromImportedPlan(plan));
      if (plan.aspectRatio) setAspectRatio(plan.aspectRatio);
      toast.success(`Đã nạp ${plan.shots.length} shot từ JSON; bỏ qua CLI lập shot`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, []);
  const handleClearPlan = reactExports.useCallback(() => {
    setImportedPlan(null);
    setImportedPlanName("");
  }, []);
  const handleCopyPath = reactExports.useCallback((path) => {
    void navigator.clipboard.writeText(path);
    toast.success(t("autoVideo.render.copySuccess"));
  }, [t]);
  const handleSaveVideo = reactExports.useCallback(async (path, title) => {
    const result = await window.electronAPI?.saveFileDialog({
      localPath: path,
      defaultPath: `${title.replace(/[^a-zA-Z0-9À-ɏ_-]+/g, "_") || "autopilot"}.mp4`,
      filters: [{ name: "MP4 Video", extensions: ["mp4"] }]
    });
    if (result?.success) toast.success(t("autopilot.panel.videoSaved"));
    else if (result && !result.canceled) toast.error(result.error || t("autopilot.panel.videoSaveFailed"));
  }, [t]);
  const showVoiceSettings = advancedExpanded && voiceSource === "tts";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "autopilot-panel h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-4 px-4 pb-20 pt-4 md:px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-3 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold", children: t("autopilot.panel.newJob") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setAdvancedExpanded((value) => !value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "mr-1.5 h-4 w-4" }),
            advancedExpanded ? t("autopilot.panel.hideAdvanced") : t("autopilot.panel.advanced"),
            advancedExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "ml-1 h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: script, onChange: (e) => setScript(e.target.value), placeholder: t("autopilot.panel.scriptPlaceholder"), rows: 4, className: "text-xs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/10 p-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => planInputRef.current?.click(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "mr-1.5 h-4 w-4" }),
            "Nhập kế hoạch JSON"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: planInputRef,
              type: "file",
              accept: ".json,application/json",
              className: "hidden",
              onChange: (event) => {
                void handlePickPlan(event.target.files?.[0] ?? null);
                event.target.value = "";
              }
            }
          ),
          importedPlan ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1 truncate text-xs text-green-600 dark:text-green-400", children: [
              importedPlanName,
              " · ",
              importedPlan.shots.length,
              " shot · bỏ qua CLI lập shot"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8", title: "Bỏ JSON đã nhập", onClick: handleClearPlan, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: "Nạp JSON có shots[].voiceOver và shots[].imagePrompt." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autopilot.panel.skill") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: selectedSkillId || "none", onChange: (e) => handleSelectSkill(e.target.value), className: "h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "none", children: t("autopilot.panel.noSkill") }),
                savedSkills.map((skill) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: skill.id, children: skill.name }, skill.id))
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-9 px-2", title: "Chỉnh sửa skill", disabled: !selectedSkillId, onClick: () => setSkillExpanded(true), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-9 px-2", title: t("autopilot.panel.newSkill"), onClick: () => handleSelectSkill("new"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "mb-1.5 flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { className: "h-3.5 w-3.5" }),
              t("scriptInput.visualStyle")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StylePicker, { value: visualStyleId, onChange: (styleId) => setProjectVisualStyleId(styleId) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autopilot.panel.voiceSource") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: voiceSource, onChange: (e) => setVoiceSource(e.target.value), className: "h-9 w-full rounded-lg border border-border bg-background px-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "tts", children: t("autopilot.panel.createTts") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "import", children: t("autopilot.panel.importAudio") })
            ] })
          ] })
        ] }),
        skillExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border border-border bg-muted/10 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold", children: "Chỉnh sửa skill" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setSkillExpanded(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: skillName, onChange: (event) => setSkillName(event.target.value), placeholder: t("autopilot.panel.skillNamePlaceholder"), className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: skillText, onChange: (e) => setSkillText(e.target.value), placeholder: t("autopilot.panel.skillPlaceholder"), rows: 7, className: "max-h-64 resize-y font-mono text-2xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: handleDeleteSkill, disabled: !selectedSkillId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
              t("autopilot.panel.deleteSkill")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", onClick: handleSaveSkill, disabled: !skillText.trim(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1 h-3.5 w-3.5" }),
              selectedSkillId ? t("autopilot.panel.updateSkill") : t("autopilot.panel.saveSkill")
            ] })
          ] })
        ] }),
        voiceSource === "import" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/20 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("autopilot.panel.importAudio") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: importedAudioPath, readOnly: true, placeholder: t("autopilot.panel.audioPlaceholder"), className: "text-xs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => void handlePickNarrationAudio(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "mr-2 h-4 w-4" }),
              t("autopilot.panel.chooseAudio")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: importedSrtName, readOnly: true, placeholder: t("autopilot.panel.srtPlaceholder"), className: "text-xs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => srtInputRef.current?.click(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "mr-2 h-4 w-4" }),
              t("autopilot.panel.chooseSrt")
            ] }),
            importedSrtRaw && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", title: t("autopilot.panel.clearSrt"), onClick: handleClearSrt, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: srtInputRef,
                type: "file",
                accept: ".srt,text/plain",
                className: "hidden",
                onChange: (event) => {
                  void handlePickSrt(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("autopilot.panel.audioIsScriptHint") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("autopilot.panel.srtHint") })
        ] }),
        showVoiceSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceEnginePicker, { settings: voice, t }),
        showVoiceSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceEngineSettings, { settings: voice, t }),
        advancedExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border border-border bg-muted/10 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autopilot.panel.maxShots") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 100, value: maxShots, onChange: (e) => setMaxShots(Math.max(0, parseInt(e.target.value, 10) || 0)), className: "text-xs" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autopilot.panel.aspectRatio") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: aspectRatio, onChange: (e) => setAspectRatio(e.target.value), className: "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs", children: ["16:9", "9:16", "1:1", "4:3"].map((ratio) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ratio, children: ratio }, ratio)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autopilot.panel.longFormThreshold") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, max: 120, value: longFormThresholdMinutes, onChange: (event) => setAutopilotSettings({ longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(event.target.value) }), className: "text-xs" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: t("autoVideo.render.bgm") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: bgmPath, onChange: (e) => setBgmPath(e.target.value), placeholder: t("autopilot.panel.bgmPlaceholder"), className: "text-xs" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 lg:grid-cols-[minmax(180px,1fr)_auto_auto] lg:items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-1.5 block text-xs", children: "Encoder" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: codec, onChange: (e) => setCodec(e.target.value), className: "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs", children: CODEC_OPTIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.value, children: c.label }, c.value)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-8 items-center gap-2 whitespace-nowrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: subtitles, onCheckedChange: setSubtitles }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("autopilot.panel.addSubtitles") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-8 items-center gap-2 whitespace-nowrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: audioNormalize, onCheckedChange: setAudioNormalize }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chuẩn hóa âm thanh (-14 LUFS YouTube)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "mb-1.5 block text-xs", children: [
              "Âm thanh gốc video (",
              Math.round(videoAudioVolume * 100),
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 0.5, step: 0.05, value: videoAudioVolume, onChange: (e) => setVideoAudioVolume(parseFloat(e.target.value)), className: "w-full accent-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground mt-0.5", children: videoAudioVolume === 0 ? "Tắt (mặc định)" : `Giữ âm thanh gốc video ở ${Math.round(videoAudioVolume * 100)}% so với voice` })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: mergeAfterCreate, onCheckedChange: setMergeAfterCreate }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-medium", children: "Ghép thành video hoàn chỉnh" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: mergeAfterCreate ? "Tạo xong sẽ ghép (ffmpeg) ra 1 video hoàn chỉnh." : "Chỉ tạo các video từng cảnh, KHÔNG ghép — bấm “Ghép lại” sau để xuất video cuối." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "mr-auto", onClick: handleAddToQueue, title: "Thêm dự án này vào hàng chờ để chạy AutoPilot theo lịch/tuần tự", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
            "Thêm vào hàng chờ"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => handleCreate("step"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "mr-2 h-4 w-4" }),
            t("autopilot.panel.createStepByStep")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleCreate("all"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-2 h-4 w-4" }),
            t("autopilot.panel.createAll")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold", children: [
          t("autopilot.panel.jobs"),
          " (",
          jobs.length,
          ")"
        ] }),
        jobs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground bg-card border border-border rounded-lg p-3", children: t("autopilot.panel.noJobs") }),
        jobs.map((job) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          JobCard,
          {
            job,
            expanded: expandedJob === job.id,
            now,
            onToggleExpand: () => setExpandedJob(expandedJob === job.id ? null : job.id),
            onCancel: () => cancelJob(job.id),
            onResume: () => resumeJob(job.id),
            onRemove: () => removeJob(job.id),
            onCopyPath: handleCopyPath,
            onSaveVideo: (path, title) => void handleSaveVideo(path, title),
            t
          },
          job.id
        ))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShotPreviewOverlay, {})
  ] });
}
export {
  AutopilotPanel
};
