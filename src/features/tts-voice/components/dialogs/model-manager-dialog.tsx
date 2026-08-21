import { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, Cpu, Download, Globe2, HardDrive, KeyRound, Loader2, Plus, Save, Square, Trash2, Wifi } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { useI18n } from '@/shared/i18n';
import { getTtsProgressLabel } from '../../lib/progress-label';
import type { TtsController } from '../../hooks/use-tts-controller';

export function ModelManagerDialog({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const {
    managerOpen, setManagerOpen, engineGroups, selectedEngine, setSelectedEngineId,
    selectedModel, selectedStatus, isCapCut, isGemini, isVbee, isOnline, installModel, removeModel,
    busy, progress, cancelJob,
  } = controller;
  const ready = selectedStatus?.status === 'ready';
  const installing = busy && progress?.kind === 'install';
  const [geminiKeys, setGeminiKeys] = useState<string[]>(['']);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');
  const [savedGeminiKeyCount, setSavedGeminiKeyCount] = useState(0);
  const [vbeeAppId, setVbeeAppId] = useState('');
  const [vbeeToken, setVbeeToken] = useState('');
  const [vbeeExpiresAt, setVbeeExpiresAt] = useState<number>();
  const [savingVbee, setSavingVbee] = useState(false);
  const [vbeeMessage, setVbeeMessage] = useState('');

  useEffect(() => {
    if (!managerOpen || !isGemini) return;
    void window.ttsRuntime?.getGeminiApiKeys().then((keys) => {
      setGeminiKeys(keys.length ? keys : ['']);
      setSavedGeminiKeyCount(keys.length);
      setKeyMessage(keys.length ? t('tts.gemini.keyCount', { count: keys.length }) : t('tts.gemini.noKey'));
    });
  }, [isGemini, managerOpen, t]);

  useEffect(() => {
    if (!managerOpen || !isVbee) return;
    void window.ttsRuntime?.getVbeeCredentials().then((credentials) => {
      setVbeeAppId(credentials.appId || '');
      setVbeeToken(credentials.token || '');
      setVbeeExpiresAt(credentials.expiresAt);
      setVbeeMessage(credentials.appId && credentials.token ? t('tts.vbee.configured') : t('tts.vbee.notConfigured'));
    });
  }, [isVbee, managerOpen, t]);

  const saveGeminiKeys = async () => {
    const keys = geminiKeys.map((key) => key.trim()).filter(Boolean);
    setSavingKeys(true);
    try {
      const result = await window.ttsRuntime?.setGeminiApiKeys(keys);
      const keyCount = result?.keyCount || 0;
      setSavedGeminiKeyCount(keyCount);
      setKeyMessage(t('tts.gemini.keysSaved', { count: keyCount }));
    } catch (error) {
      setKeyMessage(error instanceof Error ? error.message : t('tts.gemini.keysSaveFailed'));
    } finally {
      setSavingKeys(false);
    }
  };

  const saveVbeeCredentials = async () => {
    setSavingVbee(true);
    try {
      const result = await window.ttsRuntime?.setVbeeCredentials({ appId: vbeeAppId.trim(), token: vbeeToken.trim() });
      setVbeeExpiresAt(result?.expiresAt);
      setVbeeMessage(result?.configured ? t('tts.vbee.credentialsSaved') : t('tts.vbee.notConfigured'));
    } catch (error) {
      setVbeeMessage(error instanceof Error ? error.message : t('tts.vbee.credentialsSaveFailed'));
    } finally {
      setSavingVbee(false);
    }
  };

  return (
    <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('tts.manager.title')}</DialogTitle>
          <DialogDescription>{t('tts.manager.chooseEngine')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {engineGroups.map((engine) => {
            const selected = selectedEngine.id === engine.id;
            const online = engine.models[0].runtimeKind === 'online';
            const Icon = engine.id === 'gemini' || engine.id === 'vbee' ? Cloud : online ? Globe2 : Cpu;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => setSelectedEngineId(engine.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${selected
                  ? 'border-primary bg-primary/8 ring-1 ring-primary/20'
                  : 'border-border/60 bg-card/60 hover:border-primary/40'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge variant={selected ? 'default' : 'outline'}>{online ? t('tts.engine.online') : t('tts.engine.local')}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold">{engine.name}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{t(engine.descriptionKey)}</p>
              </button>
            );
          })}
        </div>

        {!isOnline ? (
          <div className="rounded-xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Cpu className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold">{selectedModel.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t(selectedModel.descriptionKey)}</p>
                </div>
              </div>
              {ready && <Badge className="border-success/30 bg-success/10 text-success hover:text-white"><CheckCircle2 className="h-3.5 w-3.5" /> {t('tts.manager.ready')}</Badge>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-muted/35 p-3">
                <p className="text-muted-foreground">{t('tts.manager.accelerator')}</p>
                <p className="mt-1 font-medium uppercase">{selectedStatus?.accelerator || '—'}</p>
              </div>
              <div className="rounded-xl bg-muted/35 p-3">
                <p className="text-muted-foreground">{t('tts.manager.downloadSize')}</p>
                <p className="mt-1 flex items-center gap-1 font-medium"><HardDrive className="h-3.5 w-3.5" />~{selectedModel.estimatedDownloadGb} GB</p>
              </div>
            </div>

            {selectedStatus?.messageKey && <p className="mt-3 text-xs text-warning">{t(selectedStatus.messageKey)}</p>}
            {selectedStatus?.message && <p className="mt-3 text-xs text-destructive">{selectedStatus.message}</p>}

            {installing && progress ? (
              <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin text-primary" />{getTtsProgressLabel(progress.stage, t)}</div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{progress.message}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{Math.round(progress.percent ?? 0)}%</span>
                </div>
                <Progress value={progress.percent ?? 2} className="mt-3" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">{t('tts.manager.installKeepOpen')}</p>
                  <Button variant="outline" size="sm" onClick={cancelJob}><Square /> {t('tts.action.cancel')}</Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                {!ready
                  ? <Button variant="primary" disabled={busy} onClick={() => installModel(selectedModel)} className="flex-1"><Download /> {t('tts.manager.download')}</Button>
                  : <Button variant="destructive" disabled={busy} onClick={() => removeModel(selectedModel)} className="flex-1"><Trash2 /> {t('tts.manager.remove')}</Button>}
              </div>
            )}
          </div>
        ) : isCapCut ? (
          <div className="rounded-xl border border-info/25 bg-info/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info"><Wifi className="h-5 w-5" /></div>
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold">CapCut Online</h3><Badge className="border-success/30 bg-success/10 text-success hover:text-white">{t('tts.manager.ready')}</Badge></div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('tts.capcut.managerDescription')}</p>
              </div>
            </div>
          </div>
        ) : isVbee ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><KeyRound className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Vbee API</h3>
                  {vbeeAppId.trim() && vbeeToken.trim()
                    ? <Badge className="border-success/30 bg-success/10 text-success hover:text-white">{t('tts.manager.ready')}</Badge>
                    : <Badge variant="outline" className="border-warning/35 bg-warning/10 text-warning">{t('tts.vbee.notConfigured')}</Badge>}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('tts.vbee.managerDescription')}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">App ID</label>
                    <Input value={vbeeAppId} onChange={(event) => setVbeeAppId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" spellCheck={false} className="mt-1 h-9 bg-background font-mono text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Token</label>
                    <Input type="password" value={vbeeToken} onChange={(event) => setVbeeToken(event.target.value)} placeholder="eyJ..." spellCheck={false} className="mt-1 h-9 bg-background font-mono text-xs" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{vbeeMessage}</p>
                    {vbeeExpiresAt && <p className={`mt-1 text-[10px] ${vbeeExpiresAt <= Date.now() ? 'text-destructive' : 'text-muted-foreground'}`}>{t('tts.vbee.tokenExpires', { date: new Date(vbeeExpiresAt).toLocaleString() })}</p>}
                  </div>
                  <Button type="button" variant="primary" size="sm" disabled={savingVbee} onClick={saveVbeeCredentials}>
                    {savingVbee ? <Loader2 className="animate-spin" /> : <Save />}{t('tts.vbee.saveCredentials')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><KeyRound className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Gemini Pro</h3>
                  {savedGeminiKeyCount > 0
                    ? <Badge className="border-success/30 bg-success/10 text-success hover:text-white">{t('tts.manager.ready')}</Badge>
                    : <Badge variant="outline" className="border-warning/35 bg-warning/10 text-warning">{t('tts.gemini.notConfigured')}</Badge>}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('tts.gemini.managerDescription')}</p>
                <div className="mt-3 space-y-2">
                  {geminiKeys.map((key, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-[10px] font-medium text-muted-foreground">API {index + 1}</span>
                      <Input
                        type="password"
                        value={key}
                        onChange={(event) => setGeminiKeys((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                        placeholder="AIza..."
                        spellCheck={false}
                        className="h-9 flex-1 bg-background font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={geminiKeys.length === 1}
                        onClick={() => setGeminiKeys((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        title={t('tts.gemini.removeKey')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setGeminiKeys((current) => [...current, ''])}>
                    <Plus className="h-3.5 w-3.5" />{t('tts.gemini.addKey')}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">{keyMessage}</p>
                  <Button type="button" variant="primary" size="sm" disabled={savingKeys} onClick={saveGeminiKeys}>
                    {savingKeys ? <Loader2 className="animate-spin" /> : <Save />}{t('tts.gemini.saveKeys')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}


        <DialogFooter><Button variant="outline" onClick={() => setManagerOpen(false)}>{t('common.close')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
