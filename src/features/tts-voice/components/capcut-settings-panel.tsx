import { useMemo, useState } from 'react';
import { Globe2, Search, Volume2, Wifi } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import { CAPCUT_LANGUAGES } from '../lib/capcut-voices';
import type { TtsController } from '../hooks/use-tts-controller';

const LANGUAGE_LABELS: Record<string, string> = {
  'vi-VN': 'Tiếng Việt',
  'en-US': 'English',
  'ja-JP': '日本語',
  'zh-CN': '中文',
  'es-ES': 'Español',
  'th-TH': 'ไทย',
  'id-ID': 'Bahasa Indonesia',
  'pt-BR': 'Português',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
};

export function CapCutSettingsPanel({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const {
    capcutLanguage, setCapcutLanguage, capcutVoiceType, setCapcutVoiceType,
    capcutVoices, selectedCapCutVoice, speed, setSpeed, busy, previewCapCutVoice,
  } = controller;
  const filteredVoices = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return capcutVoices;
    return capcutVoices.filter((voice) => (
      voice.displayName.toLocaleLowerCase().includes(normalized)
      || voice.voiceType.toLocaleLowerCase().includes(normalized)
    ));
  }, [capcutVoices, query]);

  return (
    <aside className="min-h-0 overflow-y-auto bg-panel/40 p-5">
      <div className="space-y-5">
        <section className="rounded-xl border border-info/25 bg-info/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-info" /><h2 className="text-sm font-semibold">CapCut Online</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">{t('tts.capcut.onlineLabel')}</p>
            </div>
            <Badge className="border-info/30 bg-info/10 text-info"><Wifi className="h-3 w-3" />{t('tts.engine.online')}</Badge>
          </div>
        </section>

        <section className="space-y-4 border-t border-border/50 pt-5">
          <div>
            <Label>{t('tts.settings.language')}</Label>
            <Select
              value={capcutLanguage}
              onValueChange={(value) => {
                setCapcutLanguage(value);
                setQuery('');
              }}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAPCUT_LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>{LANGUAGE_LABELS[language] || language} ({language})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>{t('tts.capcut.voice')}</Label>
              <span className="text-[10px] text-muted-foreground">{capcutVoices.length} {t('tts.capcut.voices')}</span>
            </div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('tts.capcut.searchVoice')} className="h-9 pl-9 text-xs" />
            </div>
            <Select value={capcutVoiceType} onValueChange={setCapcutVoiceType}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={t('tts.capcut.selectVoice')} /></SelectTrigger>
              <SelectContent>
                {filteredVoices.map((voice) => (
                  <SelectItem key={`${voice.voiceType}:${voice.resourceId}`} value={voice.voiceType}>{voice.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCapCutVoice && (
            <div className="rounded-xl border border-border/60 bg-card/65 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{selectedCapCutVoice.displayName}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{selectedCapCutVoice.voiceType}</p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={previewCapCutVoice}>
                  <Volume2 className="h-3.5 w-3.5" />{t('tts.capcut.preview')}
                </Button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3">
              <Label>{t('tts.settings.speed')}</Label>
              <span className="text-xs font-medium text-primary">{speed.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border/50 bg-muted/20 p-3 text-[11px] leading-5 text-muted-foreground">
          {t('tts.capcut.longTextHint')}
        </section>
      </div>
    </aside>
  );
}
