"use client";

/**
 * TTS engine selection for a new AutoPilot job.
 *
 * All per-engine state lives in `useAutopilotVoiceSettings` so the panel only
 * has to call `buildVoice()` when assembling the job input; `VoiceEngineSettings`
 * renders whichever engine's controls are currently selected.
 */

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import type { Translate } from "@/shared/i18n";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { useTtsStore } from "@/features/tts-voice/stores/tts-store";
import { CAPCUT_API_VOICES, CAPCUT_LANGUAGES, getCapCutVoice } from "@/features/tts-voice/lib/capcut-voices";
import { GEMINI_VOICES, GEMINI_LANGUAGES } from "@/features/tts-voice/lib/gemini-voices";
import { OMNIVOICE_LANGUAGES } from "@/features/tts-voice/lib/omnivoice-languages";
import { TTS_MODEL_GROUPS } from "@/features/tts-voice/lib/model-registry";
import type { VbeeVoice, VieneuVoice } from "@/features/tts-voice/types";
import type { AutopilotJobInput } from "@/features/video-studio/autopilot/types";
import { SpeedSlider } from "./panel-shared";

const GEMINI_MODELS = TTS_MODEL_GROUPS.find((group) => group.id === "gemini")?.models ?? [];

export type VoiceEngine = "capcut" | "gemini" | "omnivoice" | "vbee" | "vieneu";

export type AutopilotVoiceSettings = ReturnType<typeof useAutopilotVoiceSettings>;

export function useAutopilotVoiceSettings() {
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>("vbee");
  const [capcutLanguage, setCapcutLanguage] = useState("vi-VN");
  const [capcutVoiceType, setCapcutVoiceType] = useState("BV421_vivn_streaming");
  const [geminiLanguage, setGeminiLanguage] = useState("vi-VN");
  const [geminiVoiceName, setGeminiVoiceName] = useState("Puck");
  const [omniLanguage, setOmniLanguage] = useState("vi");
  const [omniProfileId, setOmniProfileId] = useState("");
  const omniProfiles = useTtsStore((s) => s.voiceProfiles).filter((profile) => profile.providerId === "omnivoice-local");
  const vieneuProfiles = useTtsStore((s) => s.voiceProfiles).filter((profile) => profile.providerId === "vieneu-local");
  const [vieneuVoices, setVieneuVoices] = useState<VieneuVoice[]>([
    { id: "Trúc Ly", label: "Trúc Ly" },
    { id: "Minh Đức", label: "Minh Đức" },
  ]);
  const [vieneuMode, setVieneuMode] = useState<"preset" | "clone">("preset");
  const [vieneuVoice, setVieneuVoice] = useState(() => useTtsStore.getState().vieneuVoice);
  const [vieneuStyle, setVieneuStyle] = useState<"tu_nhien" | "tin_tuc" | "doc_truyen">(() => useTtsStore.getState().vieneuStyle);
  const [vieneuProfileId, setVieneuProfileId] = useState("");
  // Vbee voices load dynamically from the runtime (same source as the TTS tab).
  const [vbeeVoices, setVbeeVoices] = useState<VbeeVoice[]>([]);
  const [vbeeVoiceCode, setVbeeVoiceCode] = useState(() => useTtsStore.getState().vbeeVoiceCode);
  const [vbeeVoiceSearch, setVbeeVoiceSearch] = useState("");
  const vbeeFavoriteVoiceCodes = useTtsStore((state) => state.vbeeFavoriteVoiceCodes);
  const toggleVbeeFavoriteVoice = useTtsStore((state) => state.toggleVbeeFavoriteVoice);
  // Per-provider voice params (mirror the TTS settings panels).
  const [speed, setSpeed] = useState(1);
  const [geminiModelId, setGeminiModelId] = useState(GEMINI_MODELS[0]?.id || "gemini-3.1-flash-tts-preview");
  const [geminiStyle, setGeminiStyle] = useState("");
  const [vbeeAudioType, setVbeeAudioType] = useState<"mp3" | "wav">(() => useTtsStore.getState().vbeeAudioType);
  const [vbeeBitrate, setVbeeBitrate] = useState(() => useTtsStore.getState().vbeeBitrate);
  const [omniMode, setOmniMode] = useState<"clone" | "design" | "auto">("auto");
  const [omniInstruction, setOmniInstruction] = useState("");
  const [omniNumStep, setOmniNumStep] = useState(24);

  const capcutVoices = useMemo(
    () => CAPCUT_API_VOICES.filter((voice) => voice.language === capcutLanguage),
    [capcutLanguage],
  );

  const filteredVbeeVoices = useMemo(() => {
    const query = vbeeVoiceSearch.trim().toLocaleLowerCase();
    const matching = query
      ? vbeeVoices.filter((voice) => (
          voice.name.toLocaleLowerCase().includes(query)
          || voice.code.toLocaleLowerCase().includes(query)
          || voice.languageCode.toLocaleLowerCase().includes(query)
          || voice.gender.toLocaleLowerCase().includes(query)
        ))
      : vbeeVoices;
    const favorites = new Set(vbeeFavoriteVoiceCodes);
    return [...matching].sort((left, right) => (
      Number(favorites.has(right.code)) - Number(favorites.has(left.code))
      || left.name.localeCompare(right.name)
    ));
  }, [vbeeFavoriteVoiceCodes, vbeeVoiceSearch, vbeeVoices]);

  /**
   * Options actually rendered in the voice <select>.
   *
   * A native single <select> whose value matches no rendered <option> does not stay
   * empty: the browser's reset algorithm displays the FIRST option instead, and no
   * change event fires. With a search filter that made the box claim a voice the user
   * never picked while the job silently generated with the previously selected one.
   * Pinning the current selection into the list keeps the box honest.
   */
  const vbeeVoiceOptions = useMemo(() => {
    if (filteredVbeeVoices.some((voice) => voice.code === vbeeVoiceCode)) return filteredVbeeVoices;
    const selected = vbeeVoices.find((voice) => voice.code === vbeeVoiceCode);
    return selected ? [selected, ...filteredVbeeVoices] : filteredVbeeVoices;
  }, [filteredVbeeVoices, vbeeVoiceCode, vbeeVoices]);

  useEffect(() => {
    if (!capcutVoices.some((voice) => voice.voiceType === capcutVoiceType)) {
      const first = capcutVoices[0];
      setCapcutVoiceType(first?.voiceType || "BV421_vivn_streaming");
    }
  }, [capcutLanguage, capcutVoices, capcutVoiceType]);

  // Load Vbee voices once the user picks the Vbee engine.
  useEffect(() => {
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

  useEffect(() => {
    if (voiceEngine !== "vieneu") return;
    void window.ttsRuntime?.getVieneuVoices().then((result) => {
      if (!result?.success || !result.voices.length) return;
      setVieneuVoices(result.voices);
      if (!result.voices.some((voice) => voice.id === vieneuVoice)) setVieneuVoice(result.voices[0].id);
    });
  }, [voiceEngine, vieneuVoice]);

  /** Assembles the provider-specific `voice` block of an AutopilotJobInput. */
  const buildVoice = (): NonNullable<AutopilotJobInput["voice"]> => {
    if (voiceEngine === "capcut") {
      return {
        capability: "capcut",
        engineName: "CapCut",
        voiceLabel: getCapCutVoice(capcutVoiceType)?.displayName || capcutVoiceType,
        language: capcutLanguage,
        capcutVoiceType,
        capcutResourceId: getCapCutVoice(capcutVoiceType)?.resourceId || "",
        speed,
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
        geminiStyle: geminiStyle.trim() || undefined,
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
        speed,
      };
    }
    if (voiceEngine === "vieneu") {
      const profile = vieneuMode === "clone" ? vieneuProfiles.find((item) => item.id === vieneuProfileId) : undefined;
      return {
        capability: "vieneu",
        engineName: "VieNeu",
        modelId: "vieneu-v3-turbo",
        repository: "pnnbao97/VieNeu-TTS",
        voiceLabel: profile?.name || vieneuVoice,
        mode: profile ? "clone" : "preset",
        language: "vi",
        vieneuVoice,
        vieneuStyle,
        profileId: profile?.id,
        referenceAudioPath: profile?.referenceAudioPath,
        referenceText: profile?.referenceText,
      };
    }
    const profile = omniMode === "clone" ? omniProfiles.find((item) => item.id === omniProfileId) : undefined;
    return {
      capability: "omnivoice",
      engineName: "OmniVoice",
      voiceLabel: omniMode === "clone" ? (profile?.name || "Clone") : omniMode === "design" ? "Design" : "Auto",
      mode: omniMode,
      language: omniLanguage,
      speed,
      numStep: omniNumStep,
      instruction: omniMode === "design" ? (omniInstruction.trim() || undefined) : undefined,
      profileId: profile?.id,
      referenceAudioPath: profile?.referenceAudioPath,
      referenceText: profile?.referenceText,
    };
  };

  return {
    voiceEngine, setVoiceEngine,
    capcutLanguage, setCapcutLanguage,
    capcutVoiceType, setCapcutVoiceType,
    capcutVoices,
    geminiLanguage, setGeminiLanguage,
    geminiVoiceName, setGeminiVoiceName,
    geminiModelId, setGeminiModelId,
    geminiStyle, setGeminiStyle,
    vbeeVoices, vbeeVoiceCode, setVbeeVoiceCode,
    vbeeVoiceSearch, setVbeeVoiceSearch,
    filteredVbeeVoices, vbeeVoiceOptions,
    vbeeFavoriteVoiceCodes, toggleVbeeFavoriteVoice,
    vbeeAudioType, setVbeeAudioType,
    vbeeBitrate, setVbeeBitrate,
    vieneuVoices, vieneuMode, setVieneuMode,
    vieneuVoice, setVieneuVoice,
    vieneuStyle, setVieneuStyle,
    vieneuProfiles, vieneuProfileId, setVieneuProfileId,
    omniLanguage, setOmniLanguage,
    omniProfiles, omniProfileId, setOmniProfileId,
    omniMode, setOmniMode,
    omniInstruction, setOmniInstruction,
    omniNumStep, setOmniNumStep,
    speed, setSpeed,
    buildVoice,
  };
}

const SELECT_CLASS = "w-full h-8 rounded-lg border border-border bg-background px-2 text-xs";

/** Engine picker. Rendered separately so it can sit above the engine-specific controls. */
export function VoiceEnginePicker({ settings, t }: { settings: AutopilotVoiceSettings; t: Translate }) {
  return (
    <div>
      <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voice")}</Label>
      <select value={settings.voiceEngine} onChange={(e) => settings.setVoiceEngine(e.target.value as VoiceEngine)} className={SELECT_CLASS}>
        <option value="capcut">CapCut</option>
        <option value="gemini">Gemini</option>
        <option value="vbee">Vbee</option>
        <option value="vieneu">VieNeu</option>
        <option value="omnivoice">OmniVoice</option>
      </select>
    </div>
  );
}

export function VoiceEngineSettings({ settings: s, t }: { settings: AutopilotVoiceSettings; t: Translate }) {
  if (s.voiceEngine === "capcut") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">{t("autopilot.panel.language")}</Label>
            <select value={s.capcutLanguage} onChange={(e) => s.setCapcutLanguage(e.target.value)} className={SELECT_CLASS}>
              {CAPCUT_LANGUAGES.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceSelect")} ({s.capcutVoices.length})</Label>
            <select value={s.capcutVoiceType} onChange={(e) => s.setCapcutVoiceType(e.target.value)} className={SELECT_CLASS}>
              {s.capcutVoices.map((voice) => (
                <option key={`${voice.voiceType}:${voice.resourceId}`} value={voice.voiceType}>{voice.displayName}</option>
              ))}
            </select>
          </div>
        </div>
        <SpeedSlider value={s.speed} onChange={s.setSpeed} min={0.5} max={2} step={0.1} t={t} />
      </div>
    );
  }

  if (s.voiceEngine === "gemini") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Model</Label>
            <select value={s.geminiModelId} onChange={(e) => s.setGeminiModelId(e.target.value)} className={SELECT_CLASS}>
              {GEMINI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t("autopilot.panel.language")}</Label>
            <select value={s.geminiLanguage} onChange={(e) => s.setGeminiLanguage(e.target.value)} className={SELECT_CLASS}>
              {GEMINI_LANGUAGES.map(([code, name]) => (
                <option key={code} value={code}>{name} ({code})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceSelect")}</Label>
          <select value={s.geminiVoiceName} onChange={(e) => s.setGeminiVoiceName(e.target.value)} className={SELECT_CLASS}>
            {GEMINI_VOICES.map((voice) => (
              <option key={voice.name} value={voice.name}>{voice.name} — {voice.description} ({voice.gender === 'F' ? 'Nữ' : 'Nam'})</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">{t("tts.gemini.style")}</Label>
          <Textarea value={s.geminiStyle} onChange={(e) => s.setGeminiStyle(e.target.value)} placeholder={t("tts.gemini.stylePlaceholder")} rows={2} className="text-xs" />
        </div>
      </div>
    );
  }

  if (s.voiceEngine === "vbee") {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceSelect")} ({s.filteredVbeeVoices.length}/{s.vbeeVoices.length})</Label>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={s.vbeeVoiceSearch} onChange={(event) => s.setVbeeVoiceSearch(event.target.value)} placeholder="Tìm theo tên, mã hoặc ngôn ngữ…" className="h-8 pl-8 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={s.vbeeVoiceCode}
              onChange={(event) => {
                const code = event.target.value;
                const voice = s.vbeeVoices.find((item) => item.code === code);
                s.setVbeeVoiceCode(code);
                useTtsStore.getState().setVbeeVoiceCode(code);
                if (voice) useTtsStore.getState().setVbeeVoiceName(voice.name);
              }}
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs"
            >
              {s.vbeeVoices.length === 0 && <option value={s.vbeeVoiceCode}>Đang tải giọng Vbee…</option>}
              {s.vbeeVoiceOptions.map((voice) => (
                <option key={voice.code} value={voice.code}>{s.vbeeFavoriteVoiceCodes.includes(voice.code) ? "★ " : ""}{voice.name} ({voice.languageCode})</option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              title={s.vbeeFavoriteVoiceCodes.includes(s.vbeeVoiceCode) ? "Bỏ khỏi giọng yêu thích" : "Đánh dấu giọng yêu thích"}
              disabled={!s.vbeeVoices.some((voice) => voice.code === s.vbeeVoiceCode)}
              onClick={() => s.toggleVbeeFavoriteVoice(s.vbeeVoiceCode)}
            >
              <Star className={`h-3.5 w-3.5 ${s.vbeeFavoriteVoiceCodes.includes(s.vbeeVoiceCode) ? "fill-amber-400 text-amber-500" : ""}`} />
            </Button>
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">
            Sẽ đọc bằng: <span className="text-foreground">{s.vbeeVoices.find((voice) => voice.code === s.vbeeVoiceCode)?.name || s.vbeeVoiceCode}</span> ({s.vbeeVoiceCode})
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">{t("tts.vbee.audioType")}</Label>
            <select value={s.vbeeAudioType} onChange={(e) => s.setVbeeAudioType(e.target.value as "mp3" | "wav")} className={SELECT_CLASS}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t("tts.vbee.bitrate")}</Label>
            <select value={String(s.vbeeBitrate)} onChange={(e) => s.setVbeeBitrate(Number(e.target.value))} disabled={s.vbeeAudioType === "wav"} className={`${SELECT_CLASS} disabled:opacity-50`}>
              {[8, 16, 32, 64, 128].map((value) => <option key={value} value={value}>{value} kbps</option>)}
            </select>
          </div>
        </div>
        <SpeedSlider value={s.speed} onChange={s.setSpeed} min={0.1} max={1.9} step={0.1} t={t} />
      </div>
    );
  }

  if (s.voiceEngine === "vieneu") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">{t("tts.settings.voiceMode")}</Label>
            <select value={s.vieneuMode} onChange={(e) => s.setVieneuMode(e.target.value as "preset" | "clone")} className={SELECT_CLASS}>
              <option value="preset">{t("tts.mode.preset")}</option>
              <option value="clone">{t("tts.mode.clone")}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t("tts.vieneu.style")}</Label>
            <select value={s.vieneuStyle} onChange={(e) => s.setVieneuStyle(e.target.value as typeof s.vieneuStyle)} className={SELECT_CLASS}>
              <option value="tu_nhien">{t("tts.vieneu.styleNatural")}</option>
              <option value="tin_tuc">{t("tts.vieneu.styleNews")}</option>
              <option value="doc_truyen">{t("tts.vieneu.styleStory")}</option>
            </select>
          </div>
        </div>
        {s.vieneuMode === "preset" ? (
          <div>
            <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceSelect")}</Label>
            <select value={s.vieneuVoice} onChange={(e) => s.setVieneuVoice(e.target.value)} className={SELECT_CLASS}>
              {s.vieneuVoices.map((voice) => <option key={voice.id} value={voice.id}>{voice.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceProfile")}</Label>
            <select value={s.vieneuProfileId} onChange={(e) => s.setVieneuProfileId(e.target.value)} className={SELECT_CLASS}>
              <option value="">{t("autopilot.panel.omniNoProfile")}</option>
              {s.vieneuProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
            {s.vieneuProfiles.length === 0 && <p className="mt-1 text-2xs text-muted-foreground">{t("autopilot.panel.noVoiceProfiles")}</p>}
          </div>
        )}
        <p className="text-2xs text-muted-foreground">{t("tts.vieneu.cloneHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1.5 block">{t("tts.settings.voiceMode")}</Label>
          <select value={s.omniMode} onChange={(e) => s.setOmniMode(e.target.value as "clone" | "design" | "auto")} className={SELECT_CLASS}>
            <option value="clone">{t("tts.mode.clone")}</option>
            <option value="design">{t("tts.mode.design")}</option>
            <option value="auto">{t("tts.mode.auto")}</option>
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">{t("autopilot.panel.language")}</Label>
          <select value={s.omniLanguage} onChange={(e) => s.setOmniLanguage(e.target.value)} className={SELECT_CLASS}>
            {OMNIVOICE_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>{language.name} ({language.code})</option>
            ))}
          </select>
        </div>
      </div>

      {s.omniMode === "clone" && (
        <div>
          <Label className="text-xs mb-1.5 block">{t("autopilot.panel.voiceProfile")}</Label>
          <select value={s.omniProfileId} onChange={(e) => s.setOmniProfileId(e.target.value)} className={SELECT_CLASS}>
            <option value="">{t("autopilot.panel.omniNoProfile")}</option>
            {s.omniProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.name}</option>
            ))}
          </select>
          {s.omniProfiles.length === 0 && (
            <p className="mt-1 text-2xs text-muted-foreground">{t("autopilot.panel.noVoiceProfiles")}</p>
          )}
        </div>
      )}

      {s.omniMode === "design" && (
        <div>
          <Label className="text-xs mb-1.5 block">{t("tts.settings.designPrompt")}</Label>
          <Textarea value={s.omniInstruction} onChange={(e) => s.setOmniInstruction(e.target.value)} placeholder={t("tts.settings.designPlaceholder")} rows={2} className="text-xs" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1.5 block">{t("tts.settings.quality")}</Label>
          <select value={String(s.omniNumStep)} onChange={(e) => s.setOmniNumStep(Number(e.target.value))} className={SELECT_CLASS}>
            <option value="16">{t("tts.quality.fast")}</option>
            <option value="24">{t("tts.quality.balanced")}</option>
            <option value="32">{t("tts.quality.high")}</option>
          </select>
        </div>
        <SpeedSlider value={s.speed} onChange={s.setSpeed} min={0.75} max={1.5} step={0.05} t={t} />
      </div>
    </div>
  );
}
