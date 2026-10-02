import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Trash2, UserRoundPlus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import type { TtsController } from '../hooks/use-tts-controller';
import type { TtsSplitMode } from '../types';
import { ModelSelector } from './model-selector';

const LANGUAGES = [
  ['auto', 'Auto'], ['zh', '中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'],
  ['de', 'Deutsch'], ['fr', 'Français'], ['ru', 'Русский'], ['pt', 'Português'], ['es', 'Español'], ['it', 'Italiano'],
];
const SPEAKERS = ['Vivian', 'Serena', 'Uncle_Fu', 'Dylan', 'Eric', 'Ryan', 'Aiden', 'Ono_Anna', 'Sohee'];

export function LocalModelSettingsPanel({ controller: c }: { controller: TtsController }) {
  const { t } = useI18n();
  const [phonemes, setPhonemes] = useState('');
  const qwen = c.selectedModel.runtimeCapability === 'qwen3';
  const clone = c.selectedModel.capabilities.includes('voice-clone');
  const design = c.selectedModel.capabilities.includes('voice-design');
  const insertToken = (token: string, closing = '') => {
    const editor = document.querySelector<HTMLTextAreaElement>('[data-tts-main-editor]');
    const start = editor?.selectionStart ?? c.text.length;
    const end = editor?.selectionEnd ?? c.text.length;
    const insertion = closing ? token + c.text.slice(start, end) + closing : token;
    c.setText(c.text.slice(0, start) + insertion + c.text.slice(end));
    requestAnimationFrame(() => {
      editor?.focus();
      const caret = closing && start === end ? start + token.length : start + insertion.length;
      editor?.setSelectionRange(caret, caret);
    });
  };
  return (
    <aside className="min-h-0 overflow-y-auto bg-panel/40 p-5">
      <div className="space-y-5">
        <ModelSelector controller={c} />
        <p className="text-xs leading-5 text-muted-foreground">{t(c.selectedModel.descriptionKey)}</p>
        <p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs leading-5">{t('tts.local.languageHint')}</p>
        <p className="text-xs text-muted-foreground">{t(c.destination === 'colab' ? 'tts.colab.gpuHint' : c.selectedStatus?.accelerator === 'mlx' ? 'tts.local.mlxHint'
          : c.selectedStatus?.accelerator === 'mps' ? 'tts.local.mpsHint' : 'tts.local.cpuHint')}</p>
        <section className="space-y-3 border-t border-border/60 pt-5">
          <Label>{t('tts.settings.voiceMode')}: {t(clone ? 'tts.mode.clone' : design ? 'tts.mode.design' : 'tts.mode.preset')}</Label>
          {clone && <>
            <p className="text-xs text-muted-foreground">{t('tts.local.cloneChunks')}</p>
            <Button variant="outline" className="w-full" disabled={c.busy} onClick={() => c.setProfileOpen(true)}>
              <UserRoundPlus /> {t('tts.profile.create')}
            </Button>
            <Select value={c.selectedProfileId || ''} onValueChange={c.setSelectedProfileId} disabled={c.busy}>
              <SelectTrigger><SelectValue placeholder={t('tts.profile.select')} /></SelectTrigger>
              <SelectContent showScrollButtons={false}>
                {c.compatibleProfiles.map((profile) => <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {c.selectedProfile && (
              <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-xs">
                <p className="font-medium">{c.selectedProfile.name}</p>
                <p className="mt-1 truncate text-muted-foreground" title={c.selectedProfile.referenceAudioPath}>{c.selectedProfile.referenceAudioPath}</p>
                <p className="mt-2 line-clamp-3 text-muted-foreground">{c.selectedProfile.referenceText || t('tts.local.audioOnly')}</p>
                <Button variant="destructive" size="sm" className="mt-3" disabled={c.busy} onClick={() => c.removeVoiceProfile(c.selectedProfile!.id)}>
                  <Trash2 /> {t('tts.profile.remove')}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('tts.local.transcriptHint')}</p>
          </>}
          {design && <Textarea value={c.instruction} disabled={c.busy} onChange={(event) => c.setInstruction(event.target.value)} placeholder={t('tts.settings.designPlaceholder')} className="min-h-28" />}
          {!clone && !design && <Select value={c.qwenSpeaker} onValueChange={c.setQwenSpeaker} disabled={c.busy}>
            <SelectTrigger aria-label={t('tts.local.speaker')}><SelectValue /></SelectTrigger>
            <SelectContent showScrollButtons={false}>{SPEAKERS.map((speaker) => <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>)}</SelectContent>
          </Select>}
        </section>
        {c.supportsLocalStyle && <section className="space-y-3 border-t border-border/60 pt-5">
          <Label htmlFor="tts-local-style">{t('tts.local.style')}</Label>
          <Textarea id="tts-local-style" value={c.localStyle} disabled={c.busy} onChange={(event) => c.setLocalStyle(event.target.value)} placeholder={t('tts.local.stylePlaceholder')} />
          <p className="text-xs text-muted-foreground">{t('tts.local.styleHint')}</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['happy', 'Speak in a cheerful, excited tone.'],
              ['sad', 'Speak softly with a sad, reflective tone.'],
              ['calm', 'Speak calmly and gently, with natural pauses.'],
              ['story', 'Tell the story expressively, with varied intonation.'],
            ].map(([key, instruction]) => <Button key={key} variant="outline" size="sm" disabled={c.busy} onClick={() => c.setLocalStyle(instruction)}>{t(`tts.local.style.${key}`)}</Button>)}
            <Button variant="ghost" size="sm" disabled={c.busy || !c.localStyle} onClick={() => c.setLocalStyle('')}>{t('tts.local.clearStyle')}</Button>
          </div>
        </section>}
        {c.selectedModel.id === 'qwen3-0.6b-custom' && <p className="text-xs text-muted-foreground">{t('tts.local.style17Only')}</p>}
        {!qwen && <section className="space-y-3 border-t border-border/60 pt-5">
          <Label>{t('tts.local.speechTags')}</Label>
          <p className="text-xs text-muted-foreground">{t('tts.local.tagsHint')}</p>
          <div className="flex flex-wrap gap-2">
            {['breath', 'laughter', 'sigh', 'cough'].map((tag) => <Button key={tag} variant="outline" size="sm" disabled={c.busy} onMouseDown={(event) => event.preventDefault()} onClick={() => insertToken(`[${tag}]`)}>{t(`tts.local.tag.${tag}`)}</Button>)}
            <Button variant="outline" size="sm" disabled={c.busy} onMouseDown={(event) => event.preventDefault()} onClick={() => insertToken('<strong>', '</strong>')}>{t('tts.local.tag.emphasis')}</Button>
          </div>
          <Label htmlFor="tts-phonemes">{t('tts.local.phonemes')}</Label>
          <div className="flex gap-2">
            <Input id="tts-phonemes" value={phonemes} disabled={c.busy} onChange={(event) => setPhonemes(event.target.value)} placeholder="[j][ǐ]" />
            <Button variant="outline" disabled={c.busy || !phonemes.trim()} onClick={() => insertToken(phonemes.trim())}>{t('tts.local.insert')}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('tts.local.phonemesHint')}</p>
          {c.destination === 'local' && <><div className="flex items-center justify-between gap-3 pt-2">
            <Label htmlFor="tts-stream-preview">{t('tts.local.stream')}</Label>
            <Switch id="tts-stream-preview" checked={c.streamPreview} disabled={c.busy} onCheckedChange={c.setStreamPreview} />
          </div>
          <p className="text-xs text-muted-foreground">{t('tts.local.streamHint')}</p>
          </>}
          {(c.livePlaying || c.liveBlocked) && <div className="flex gap-2">
            {c.liveBlocked && <Button size="sm" onClick={c.resumeLiveAudio}>{t('tts.local.resume')}</Button>}
            <Button variant="outline" size="sm" onClick={c.stopLiveAudio}>{t('tts.local.stopListening')}</Button>
          </div>}
        </section>}
        {qwen && <section className="space-y-2 border-t border-border/60 pt-5">
          <Label>{t('tts.settings.language')}</Label>
          <Select value={c.localLanguage} onValueChange={c.setLocalLanguage} disabled={c.busy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent showScrollButtons={false}>{LANGUAGES.map(([code, label]) => <SelectItem key={code} value={code}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </section>}
        <section className="space-y-2 border-t border-border/60 pt-5">
          <Label>{t('tts.splitMode.title')}</Label>
          <Select value={c.splitMode} onValueChange={(value) => c.setSplitMode(value as TtsSplitMode)} disabled={c.busy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent showScrollButtons={false}>
              {(['default', 'line', 'sentence'] as const).map((value) => <SelectItem key={value} value={value}>{t(`tts.splitMode.${value}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('tts.splitMode.hint')}</p>
        </section>
      </div>
    </aside>
  );
}
