import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TtsAdvancedSettings, TtsHistoryItem, TtsMode, TtsSavedLanguage, TtsSplitMode, VoiceProfile } from '../types';

export const DEFAULT_TTS_ADVANCED_SETTINGS: TtsAdvancedSettings = {
  audioChunkDuration: 15,
  audioChunkThreshold: 30,
  guidanceScale: 2,
  tShift: 0.1,
  positionTemperature: 5,
  classTemperature: 0,
  layerPenaltyFactor: 5,
  denoise: true,
  preprocessPrompt: true,
  postprocessOutput: true,
  padDuration: 0.1,
  fadeDuration: 0.1,
};

interface TtsState {
  selectedEngineId: string;
  selectedModelId: string;
  text: string;
  instruction: string;
  mode: TtsMode;
  language: string;
  savedLanguages: TtsSavedLanguage[];
  speed: number;
  numStep: number;
  splitMode: TtsSplitMode;
  capcutLanguage: string;
  capcutVoiceType: string;
  geminiLanguage: string;
  geminiVoiceName: string;
  geminiStyle: string;
  geminiTemperature: number;
  vbeeVoiceCode: string;
  vbeeVoiceName: string;
  vbeeFavoriteVoiceCodes: string[];
  vbeeAudioType: 'mp3' | 'wav';
  vbeeBitrate: number;
  vieneuVoice: string;
  vieneuStyle: 'tu_nhien' | 'tin_tuc' | 'doc_truyen';
  advancedEnabled: boolean;
  advancedSettings: TtsAdvancedSettings;
  selectedProfileId?: string;
  voiceProfiles: VoiceProfile[];
  history: TtsHistoryItem[];
  hasSeenModelPrompt: boolean;
  setSelectedEngineId: (value: string) => void;
  setSelectedModelId: (value: string) => void;
  setText: (value: string) => void;
  setInstruction: (value: string) => void;
  setMode: (value: TtsMode) => void;
  setLanguage: (value: string) => void;
  addSavedLanguage: (language: TtsSavedLanguage) => void;
  removeSavedLanguage: (code: string) => void;
  setSpeed: (value: number) => void;
  setNumStep: (value: number) => void;
  setSplitMode: (value: TtsSplitMode) => void;
  setCapcutLanguage: (value: string) => void;
  setCapcutVoiceType: (value: string) => void;
  setGeminiLanguage: (value: string) => void;
  setGeminiVoiceName: (value: string) => void;
  setGeminiStyle: (value: string) => void;
  setGeminiTemperature: (value: number) => void;
  setVbeeVoiceCode: (value: string) => void;
  setVbeeVoiceName: (value: string) => void;
  toggleVbeeFavoriteVoice: (voiceCode: string) => void;
  setVbeeAudioType: (value: 'mp3' | 'wav') => void;
  setVbeeBitrate: (value: number) => void;
  setVieneuVoice: (value: string) => void;
  setVieneuStyle: (value: 'tu_nhien' | 'tin_tuc' | 'doc_truyen') => void;
  setAdvancedEnabled: (value: boolean) => void;
  setAdvancedSetting: <K extends keyof TtsAdvancedSettings>(key: K, value: TtsAdvancedSettings[K]) => void;
  resetAdvancedSettings: () => void;
  setSelectedProfileId: (value?: string) => void;
  addVoiceProfile: (profile: VoiceProfile) => void;
  removeVoiceProfile: (id: string) => void;
  addHistory: (item: TtsHistoryItem) => void;
  renameHistory: (id: string, name: string) => void;
  removeHistory: (id: string) => void;
  markModelPromptSeen: () => void;
}

export const useTtsStore = create<TtsState>()(
  persist(
    (set) => ({
      selectedEngineId: 'omnivoice',
      selectedModelId: 'omnivoice-main',
      text: '', instruction: '', mode: 'clone', language: 'vi', savedLanguages: [], speed: 1, numStep: 24, splitMode: 'default',
      capcutLanguage: 'vi-VN', capcutVoiceType: 'BV421_vivn_streaming',
      geminiLanguage: 'vi-VN', geminiVoiceName: 'Puck', geminiStyle: '', geminiTemperature: 1,
      vbeeVoiceCode: 'hn_female_ngochuyen_full_48k-fhg', vbeeVoiceName: 'HN - Ngọc Huyền', vbeeAudioType: 'mp3', vbeeBitrate: 128,
      vieneuVoice: 'Trúc Ly', vieneuStyle: 'tu_nhien',
      vbeeFavoriteVoiceCodes: [],
      advancedEnabled: false,
      advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS },
      voiceProfiles: [], history: [], hasSeenModelPrompt: false,
      setSelectedEngineId: (selectedEngineId) => set({ selectedEngineId }),
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setText: (text) => set({ text }),
      setInstruction: (instruction) => set({ instruction }),
      setMode: (mode) => set({ mode }),
      setLanguage: (language) => set({ language }),
      addSavedLanguage: (language) => set((state) => ({
        savedLanguages: [
          ...state.savedLanguages.filter((item) => item.code !== language.code),
          language,
        ].sort((left, right) => left.name.localeCompare(right.name)),
      })),
      removeSavedLanguage: (code) => set((state) => ({
        savedLanguages: state.savedLanguages.filter((language) => language.code !== code),
        language: state.language === code ? 'auto' : state.language,
      })),
      setSpeed: (speed) => set({ speed }),
      setNumStep: (numStep) => set({ numStep }),
      setSplitMode: (splitMode) => set({ splitMode }),
      setCapcutLanguage: (capcutLanguage) => set({ capcutLanguage }),
      setCapcutVoiceType: (capcutVoiceType) => set({ capcutVoiceType }),
      setGeminiLanguage: (geminiLanguage) => set({ geminiLanguage }),
      setGeminiVoiceName: (geminiVoiceName) => set({ geminiVoiceName }),
      setGeminiStyle: (geminiStyle) => set({ geminiStyle }),
      setGeminiTemperature: (geminiTemperature) => set({ geminiTemperature }),
      setVbeeVoiceCode: (vbeeVoiceCode) => set({ vbeeVoiceCode }),
      setVbeeVoiceName: (vbeeVoiceName) => set({ vbeeVoiceName }),
      toggleVbeeFavoriteVoice: (voiceCode) => set((state) => ({
        vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes.includes(voiceCode)
          ? state.vbeeFavoriteVoiceCodes.filter((code) => code !== voiceCode)
          : [voiceCode, ...state.vbeeFavoriteVoiceCodes],
      })),
      setVbeeAudioType: (vbeeAudioType) => set({ vbeeAudioType }),
      setVbeeBitrate: (vbeeBitrate) => set({ vbeeBitrate }),
      setVieneuVoice: (vieneuVoice) => set({ vieneuVoice }),
      setVieneuStyle: (vieneuStyle) => set({ vieneuStyle }),
      setAdvancedEnabled: (advancedEnabled) => set({ advancedEnabled }),
      setAdvancedSetting: (key, value) => set((state) => ({
        advancedSettings: { ...state.advancedSettings, [key]: value },
      })),
      resetAdvancedSettings: () => set({ advancedSettings: { ...DEFAULT_TTS_ADVANCED_SETTINGS } }),
      setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
      addVoiceProfile: (profile) => set((state) => ({
        voiceProfiles: [profile, ...state.voiceProfiles.filter((item) => item.id !== profile.id)],
        selectedProfileId: profile.id,
      })),
      removeVoiceProfile: (id) => set((state) => ({
        voiceProfiles: state.voiceProfiles.filter((item) => item.id !== id),
        selectedProfileId: state.selectedProfileId === id ? undefined : state.selectedProfileId,
      })),
      addHistory: (item) => set((state) => ({ history: [item, ...state.history].slice(0, 100) })),
      renameHistory: (id, name) => set((state) => ({
        history: state.history.map((item) => item.id === id ? { ...item, name } : item),
      })),
      removeHistory: (id) => set((state) => ({ history: state.history.filter((item) => item.id !== id) })),
      markModelPromptSeen: () => set({ hasSeenModelPrompt: true }),
    }),
    {
      name: 'tts-voice-store-v1',
      version: 12,
      migrate: (persisted) => {
        const state = (persisted || {}) as Partial<TtsState> & { readByLine?: boolean };
        return {
          ...state,
          selectedEngineId: state.selectedEngineId || 'omnivoice',
          selectedModelId: state.selectedModelId || 'omnivoice-main',
          mode: state.mode || 'clone',
          language: state.language || 'vi',
          savedLanguages: state.savedLanguages || [],
          speed: state.speed || 1,
          numStep: state.numStep || 24,
          splitMode: state.splitMode || (state.readByLine ? 'line' : 'default'),
          capcutLanguage: state.capcutLanguage || 'vi-VN',
          capcutVoiceType: state.capcutVoiceType || 'BV421_vivn_streaming',
          geminiLanguage: state.geminiLanguage || 'vi-VN',
          geminiVoiceName: state.geminiVoiceName || 'Puck',
          geminiStyle: state.geminiStyle || '',
          geminiTemperature: Number.isFinite(state.geminiTemperature) ? state.geminiTemperature! : 1,
          vbeeVoiceCode: state.vbeeVoiceCode || 'hn_female_ngochuyen_full_48k-fhg',
          vbeeVoiceName: state.vbeeVoiceName || 'HN - Ngọc Huyền',
          vbeeFavoriteVoiceCodes: state.vbeeFavoriteVoiceCodes || [],
          vbeeAudioType: state.vbeeAudioType || 'mp3',
          vbeeBitrate: state.vbeeBitrate || 128,
          vieneuVoice: state.vieneuVoice || 'Trúc Ly',
          vieneuStyle: state.vieneuStyle || 'tu_nhien',
          advancedEnabled: state.advancedEnabled || false,
          advancedSettings: {
            ...DEFAULT_TTS_ADVANCED_SETTINGS,
            ...(state.advancedSettings || {}),
          },
          selectedProfileId: undefined,
        } as TtsState;
      },
    },
  ),
);
