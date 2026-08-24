import { Cpu, Download, Mic2, Trash2, UserRoundPlus, Volume2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import type { TtsController } from '../hooks/use-tts-controller';
import { ModelStatusBadge } from './model-status-badge';

export function VieneuSettingsPanel({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const {
    selectedModel, selectedStatus, installModel, mode, setMode,
    vieneuVoices, vieneuVoice, setVieneuVoice, vieneuStyle, setVieneuStyle,
    compatibleProfiles, selectedProfile, selectedProfileId, setSelectedProfileId,
    setProfileOpen, removeVoiceProfile, splitMode, setSplitMode,
  } = controller;

  return (
    <aside className="min-h-0 overflow-y-auto bg-panel/40 p-5">
      <div className="space-y-5">
        <section className="rounded-xl border border-border/60 bg-card/65 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">{selectedModel.name}</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">48 kHz • CPU/ONNX • Offline</p>
            </div>
            <ModelStatusBadge status={selectedStatus} />
          </div>
          {selectedStatus?.status !== 'ready' && (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => installModel(selectedModel)}>
              <Download /> {t('tts.manager.download')}
            </Button>
          )}
        </section>

        <section>
          <Label>{t('tts.settings.voiceMode')}</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('preset')} className={`rounded-xl border px-3 py-3 text-xs ${mode === 'preset' ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-background/60 text-muted-foreground'}`}>
              <Volume2 className="mx-auto mb-1.5 h-4 w-4" />{t('tts.mode.preset')}
            </button>
            <button type="button" onClick={() => setMode('clone')} className={`rounded-xl border px-3 py-3 text-xs ${mode === 'clone' ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-background/60 text-muted-foreground'}`}>
              <Mic2 className="mx-auto mb-1.5 h-4 w-4" />{t('tts.mode.clone')}
            </button>
          </div>
        </section>

        {mode === 'preset' ? (
          <section className="space-y-4 border-t border-border/60 pt-5">
            <div>
              <Label>{t('tts.vieneu.voice')}</Label>
              <Select value={vieneuVoice} onValueChange={setVieneuVoice}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{vieneuVoices.map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('tts.vieneu.style')}</Label>
              <Select value={vieneuStyle} onValueChange={(value) => setVieneuStyle(value as typeof vieneuStyle)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tu_nhien">{t('tts.vieneu.styleNatural')}</SelectItem>
                  <SelectItem value="tin_tuc">{t('tts.vieneu.styleNews')}</SelectItem>
                  <SelectItem value="doc_truyen">{t('tts.vieneu.styleStory')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        ) : (
          <section className="space-y-4 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t('tts.profile.title')}</Label>
              <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}><UserRoundPlus />{t('tts.profile.create')}</Button>
            </div>
            {compatibleProfiles.length ? (
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger><SelectValue placeholder={t('tts.profile.select')} /></SelectTrigger>
                <SelectContent>{compatibleProfiles.map((profile) => <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">{t('tts.vieneu.cloneHint')}</p>}
            {selectedProfile && <Button variant="destructive" size="sm" onClick={() => removeVoiceProfile(selectedProfile.id)}><Trash2 />{t('tts.profile.remove')}</Button>}
          </section>
        )}

        <section className="border-t border-border/60 pt-5">
          <Label>{t('tts.splitMode.title')}</Label>
          <Select value={splitMode} onValueChange={(value) => setSplitMode(value as typeof splitMode)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('tts.splitMode.default')}</SelectItem>
              <SelectItem value="line">{t('tts.splitMode.line')}</SelectItem>
              <SelectItem value="sentence">{t('tts.splitMode.sentence')}</SelectItem>
            </SelectContent>
          </Select>
        </section>
      </div>
    </aside>
  );
}
