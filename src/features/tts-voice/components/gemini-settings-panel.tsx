import { useState } from 'react';
import { Cloud, Volume2, WandSparkles } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useI18n } from '@/shared/i18n';
import { GEMINI_AUDIO_TAGS, GEMINI_LANGUAGES } from '../lib/gemini-voices';
import type { TtsController } from '../hooks/use-tts-controller';

export function GeminiSettingsPanel({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const [showTags, setShowTags] = useState(false);
  const {
    availableModels, selectedModelId, setSelectedModelId,
    geminiLanguage, setGeminiLanguage, geminiVoiceName, setGeminiVoiceName,
    geminiStyle, setGeminiStyle, geminiTemperature, setGeminiTemperature, geminiVoices, selectedGeminiVoice, busy, previewGeminiVoice,
  } = controller;

  const insertTag = (tag: string) => {
    const textArea = document.querySelector<HTMLTextAreaElement>('[data-tts-main-editor]');
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

  return (
    <aside className="min-h-0 overflow-y-auto bg-panel/40 p-5">
      <div className="space-y-5">
        <section className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Gemini Pro</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">{t('tts.gemini.onlineLabel')}</p>
            </div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">{t('tts.engine.online')}</Badge>
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-5">
          <div>
            <Label>{t('tts.settings.model')}</Label>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{availableModels.map((model) => <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('tts.settings.language')}</Label>
            <Select value={geminiLanguage} onValueChange={setGeminiLanguage}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{GEMINI_LANGUAGES.map(([code, name]) => <SelectItem key={code} value={code}>{name} ({code})</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between"><Label>{t('tts.gemini.voice')}</Label><span className="text-2xs text-muted-foreground">30 {t('tts.gemini.voices')}</span></div>
            <Select value={geminiVoiceName} onValueChange={setGeminiVoiceName}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{geminiVoices.map((voice) => <SelectItem key={voice.name} value={voice.name}>{voice.name} · {voice.description}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {selectedGeminiVoice && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/65 p-3">
              <div><p className="text-sm font-medium">{selectedGeminiVoice.name}</p><p className="mt-1 text-2xs text-muted-foreground">{selectedGeminiVoice.description} · {selectedGeminiVoice.gender === 'F' ? t('tts.gemini.female') : t('tts.gemini.male')}</p></div>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={previewGeminiVoice}><Volume2 className="h-3.5 w-3.5" />{t('tts.gemini.preview')}</Button>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2"><WandSparkles className="h-3.5 w-3.5" />{t('tts.gemini.style')}</Label>
            <Textarea value={geminiStyle} onChange={(event) => setGeminiStyle(event.target.value)} placeholder={t('tts.gemini.stylePlaceholder')} className="mt-2 min-h-20 text-xs" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3"><Label>{t('tts.gemini.temperature')}</Label><span className="text-xs font-medium text-primary">{geminiTemperature.toFixed(1)}</span></div>
            <input type="range" min="0" max="2" step="0.1" value={geminiTemperature} onChange={(event) => setGeminiTemperature(Number(event.target.value))} className="mt-3 h-1.5 w-full cursor-pointer accent-primary" />
            <p className="mt-1.5 text-2xs text-muted-foreground">{t('tts.gemini.temperatureHint')}</p>
          </div>

          <div>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowTags((value) => !value)}>{showTags ? t('tts.gemini.hideTags') : t('tts.gemini.showTags')}</Button>
            {showTags && <div className="mt-2 flex flex-wrap gap-1.5">{GEMINI_AUDIO_TAGS.map(([tag, label]) => <button key={tag} type="button" onClick={() => insertTag(tag)} className="rounded-lg border border-border/60 bg-background px-2 py-1 text-2xs hover:border-primary/50 hover:text-primary" title={tag}>{label}</button>)}</div>}
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-3 text-2xs leading-5 text-muted-foreground">{t('tts.gemini.longTextHint')}</section>
      </div>
    </aside>
  );
}
