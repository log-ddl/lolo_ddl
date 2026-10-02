import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n';
import type { TtsController } from '../hooks/use-tts-controller';

export function ColabPanel({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const supported = ['qwen3', 'cosyvoice'].includes(controller.selectedModel.runtimeCapability);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setWorking(true);
    try { await action(); }
    catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
    finally { lock.current = false; setWorking(false); }
  };
  const exportTasks = (source: 'editor' | 'files') => run(async () => {
    const runtime = window.ttsRuntime;
    if (!runtime) throw new Error(t('tts.colab.desktop'));
    const result = await runtime.exportColab({ request: controller.buildGeneratePayload(crypto.randomUUID(), controller.text), voiceLabel: controller.voiceLabel, source });
    if (result.canceled) return;
    if (!result.success) throw new Error(result.error);
    setMessage(`${t('tts.colab.exported')} ${result.count} · ${result.folder}`);
    toast.success(t('tts.colab.exported'));
  });
  const importResults = () => run(async () => {
    if (!window.ttsRuntime) throw new Error(t('tts.colab.desktop'));
    const result = await window.ttsRuntime.importColab();
    if (result.canceled) return;
    if (!result.success) throw new Error(result.error);
    for (const item of [...(result.items || [])].reverse()) controller.addHistory(item);
    const added = (result.items || []).filter(item => !controller.history.some(existing => existing.id === item.id)).length;
    const summary = `${t('tts.colab.imported')}: ${added}. ${t('tts.colab.failed')}: ${result.failed || 0}. ${t('tts.colab.missing')}: ${result.missing || 0}.`;
    setMessage(summary);
    if (result.failed || result.missing) toast.warning(summary); else toast.success(summary);
  });
  const disabled = working || controller.busy;
  return <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <p className="font-medium">{t('tts.colab.title')}</p>
    <p className="text-sm text-muted-foreground">{t('tts.colab.instructions')}</p>
    {!supported && <p className="text-sm text-amber-600">{t('tts.colab.supported')}</p>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={disabled || !supported || !controller.text.trim()} onClick={() => void exportTasks('editor')}>{t('tts.colab.export')}</Button>
      <Button variant="outline" disabled={disabled || !supported} onClick={() => void exportTasks('files')}>{t('tts.colab.files')}</Button>
      <Button variant="outline" disabled={disabled} onClick={() => void run(async () => {
        if (!window.ttsRuntime) throw new Error(t('tts.colab.desktop'));
        await window.ttsRuntime.openColab();
      })}>{t('tts.colab.open')}</Button>
      <Button variant="outline" disabled={disabled} onClick={() => void importResults()}>{t('tts.colab.import')}</Button>
    </div>
    {working && <p role="status" className="text-sm text-muted-foreground">{t('tts.colab.working')}</p>}
    {message && <p role="status" className="text-sm break-words">{message}</p>}
  </div>;
}
