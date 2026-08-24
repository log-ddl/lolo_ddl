import { useEffect, useMemo, useState } from 'react';
import { Cloud, Loader2, RefreshCw, Search, Star } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import type { VbeeVoice } from '../types';
import type { TtsController } from '../hooks/use-tts-controller';
import { useTtsStore } from '../stores/tts-store';

export function VbeeSettingsPanel({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const [voices, setVoices] = useState<VbeeVoice[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const favoriteVoiceCodes = useTtsStore((state) => state.vbeeFavoriteVoiceCodes);
  const toggleFavoriteVoice = useTtsStore((state) => state.toggleVbeeFavoriteVoice);
  const {
    vbeeVoiceCode, setVbeeVoiceCode, setVbeeVoiceName, vbeeAudioType, setVbeeAudioType,
    vbeeBitrate, setVbeeBitrate, speed, setSpeed,
  } = controller;

  const loadVoices = async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const result = await window.ttsRuntime?.getVbeeVoices(force);
      if (!result?.success) {
        setVoices([]);
        setError(result?.error || t('tts.vbee.voicesLoadFailed'));
        return;
      }
      setVoices(result.voices);
      if (result.voices.length && !result.voices.some((voice) => voice.code === vbeeVoiceCode)) {
        const fallback = result.voices.find((voice) => voice.languageCode === 'vi-VN') || result.voices[0];
        setVbeeVoiceCode(fallback.code);
        setVbeeVoiceName(fallback.name);
      } else {
        const current = result.voices.find((voice) => voice.code === vbeeVoiceCode);
        if (current) setVbeeVoiceName(current.name);
      }
    } catch (loadError) {
      setVoices([]);
      setError(loadError instanceof Error ? loadError.message : t('tts.vbee.voicesLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadVoices(); }, []);

  const filteredVoices = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const matching = !normalized ? voices : voices.filter((voice) => (
      voice.name.toLocaleLowerCase().includes(normalized)
      || voice.code.toLocaleLowerCase().includes(normalized)
      || voice.languageCode.toLocaleLowerCase().includes(normalized)
      || voice.gender.toLocaleLowerCase().includes(normalized)
    ));
    const favoriteSet = new Set(favoriteVoiceCodes);
    return [...matching].sort((left, right) => (
      Number(favoriteSet.has(right.code)) - Number(favoriteSet.has(left.code))
      || left.name.localeCompare(right.name)
    ));
  }, [favoriteVoiceCodes, query, voices]);

  const selectedVoice = voices.find((voice) => voice.code === vbeeVoiceCode);

  return (
    <aside className="min-h-0 overflow-y-auto bg-panel/40 p-5">
      <div className="space-y-5">
        <section className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Vbee API</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">{t('tts.vbee.onlineLabel')}</p>
            </div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">{t('tts.engine.online')}</Badge>
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>{t('tts.vbee.voice')}</Label>
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span>{voices.length} {t('tts.vbee.voices')}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={loading} onClick={() => void loadVoices(true)} title={t('tts.vbee.refreshVoices')}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('tts.vbee.searchVoice')} className="h-9 pl-9 text-xs" />
            </div>
            <div className="mt-2 flex items-center gap-2">
            <Select
              value={vbeeVoiceCode}
              onValueChange={(code) => {
                setVbeeVoiceCode(code);
                const voice = voices.find((item) => item.code === code);
                if (voice) setVbeeVoiceName(voice.name);
              }}
              disabled={loading || !voices.length}
            >
              <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder={loading ? t('tts.vbee.loadingVoices') : t('tts.vbee.selectVoice')} /></SelectTrigger>
              <SelectContent>
                {filteredVoices.map((voice) => (
                  <SelectItem key={voice.code} value={voice.code}>
                    {voice.name} · {voice.languageCode} · {voice.gender === 'female' ? t('tts.gemini.female') : voice.gender === 'male' ? t('tts.gemini.male') : voice.gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!selectedVoice}
              title={favoriteVoiceCodes.includes(vbeeVoiceCode) ? 'Bỏ khỏi giọng yêu thích' : 'Đánh dấu giọng yêu thích'}
              onClick={() => selectedVoice && toggleFavoriteVoice(selectedVoice.code)}
            >
              <Star className={`h-4 w-4 ${favoriteVoiceCodes.includes(vbeeVoiceCode) ? 'fill-amber-400 text-amber-500' : ''}`} />
            </Button>
            </div>
            {error && <p className="mt-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-2xs leading-4 text-destructive">{error}</p>}
            {selectedVoice && <p className="mt-1.5 text-2xs text-muted-foreground">{selectedVoice.ownership === 'PERSONAL' ? t('tts.vbee.personalVoice') : selectedVoice.ownership === 'COMMUNITY' ? t('tts.vbee.communityVoice') : t('tts.vbee.officialVoice')}{selectedVoice.creditFactor ? ` · ×${selectedVoice.creditFactor} ${t('tts.vbee.credits')}` : ''}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <Label>{t('tts.settings.speed')}</Label>
              <span className="text-xs font-medium text-primary">{speed.toFixed(1)}×</span>
            </div>
            <input type="range" min="0.1" max="1.9" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-3 w-full accent-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('tts.vbee.audioType')}</Label>
              <Select value={vbeeAudioType} onValueChange={(value) => setVbeeAudioType(value as 'mp3' | 'wav')}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="mp3">MP3</SelectItem><SelectItem value="wav">WAV</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('tts.vbee.bitrate')}</Label>
              <Select value={String(vbeeBitrate)} onValueChange={(value) => setVbeeBitrate(Number(value))} disabled={vbeeAudioType === 'wav'}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{[8, 16, 32, 64, 128].map((value) => <SelectItem key={value} value={String(value)}>{value} kbps</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-3 text-2xs leading-5 text-muted-foreground">{t('tts.vbee.longTextHint')}</section>
      </div>
    </aside>
  );
}
