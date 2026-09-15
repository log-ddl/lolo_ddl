import { useEffect, useState } from 'react';
import { DEFAULT_IMAGE_EDIT, imageEditSettings, processImage, type ImageEditSettings } from '@/features/video-studio/canvas/image-processing';
import type { CanvasNodeRenderData } from './canvas-node';
import { useI18n } from '@/shared/i18n';

export function ImageEditControls({ data }: { data: CanvasNodeRenderData }) {
  const { t } = useI18n();
  const settings = imageEditSettings(data.state.imageEdit);
  const combined = settings.crop && (settings.autoBackground || settings.chroma);
  const mode = settings.aiBackground ? 'ai' : combined ? 'combined' : settings.crop ? 'crop' : settings.autoBackground ? 'auto' : settings.chroma ? 'color' : 'none';
  const [aiProgress, setAiProgress] = useState<number>();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [backgroundSkipped, setBackgroundSkipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const sources = [...new Set([...data.state.refs, ...data.inputPreviews])];
  const source = sources[0];
  const signature = JSON.stringify(settings);
  useEffect(() => {
    let disposed = false, url = '';
    const controller = new AbortController();
    setAiProgress(undefined);
    setPreview(''); setError(''); setBackgroundSkipped(false); setBusy(!!source);
    const timer = setTimeout(() => {
      if (!source) return;
      void processImage(source, JSON.parse(signature), () => { if (!disposed) setBackgroundSkipped(true); }, controller.signal, (percent) => { if (!disposed) setAiProgress(percent); }).then((blob) => {
        if (disposed) return;
        url = URL.createObjectURL(blob); setPreview(url);
      }).catch((reason) => { if (!disposed) setError(String(reason instanceof Error ? reason.message : reason)); })
        .finally(() => { if (!disposed) setBusy(false); });
    }, 250);
    return () => { disposed = true; controller.abort(); clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [source, signature]);
  const change = (patch: Partial<ImageEditSettings>) => data.onChange({ imageEdit: { ...settings, ...patch } });
  const number = (key: 'x' | 'y' | 'width' | 'height' | 'threshold' | 'softness', max: number) => (
    <label className="flex items-center justify-between gap-2">{t(`canvas.edit.${key}`)}
      <input type="number" min={key === 'width' || key === 'height' ? 1 : 0} max={max} value={settings[key]} className="w-20 rounded border border-border bg-background px-2 py-1"
        onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) change({ [key]: Math.min(max, Math.max(key === 'width' || key === 'height' ? 1 : 0, value)) }); }} />
    </label>
  );
  return <fieldset disabled={data.state.status === 'running'} className="nodrag nopan nowheel space-y-2 p-3 text-xs" onKeyDown={(event) => event.stopPropagation()}>
    <select aria-label={t('canvas.edit.mode')} value={mode}
      onChange={(event) => change({ aiBackground: event.target.value === 'ai', crop: event.target.value === 'crop', autoBackground: event.target.value === 'auto', chroma: event.target.value === 'color' })}
      className="h-9 w-full cursor-pointer rounded-lg border border-border bg-background px-2 font-medium outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20">
      <option value="ai">{t('canvas.edit.ai')}</option>
      <option value="auto">{t('canvas.edit.autoBackground')}</option>
      <option value="crop">{t('canvas.edit.crop')}</option>
      <option value="color">{t('canvas.edit.chroma')}</option>
      {mode === 'none' && <option value="none">{t('canvas.edit.none')}</option>}
      {combined && <option value="combined">{t('canvas.edit.combined')}</option>}
    </select>
    {settings.crop && <div className="space-y-2">
      <label className="flex items-center justify-between">{t('canvas.edit.ratio')}<select value={settings.ratio} onChange={(e) => change({ ratio: e.target.value })} className="rounded bg-muted p-1"><option value="free">{t('canvas.edit.free')}</option>{['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => <option key={ratio}>{ratio}</option>)}</select></label>
      {number('x', 99)}{number('y', 99)}{number('width', 100)}{number('height', 100)}
    </div>}
    {(settings.chroma || settings.autoBackground) && <div className="space-y-2">{!settings.autoBackground && <label className="flex justify-between">{t('canvas.edit.color')}<input type="color" value={settings.color} onChange={(e) => change({ color: e.target.value })} /></label>}{number('threshold', 442)}{number('softness', 442)}</div>}
    {backgroundSkipped && <p role="status" className="text-amber-600 dark:text-amber-400">{t('canvas.edit.backgroundSkipped')}</p>}
    {!data.state.stale && !backgroundSkipped && !!data.state.batchOutputs?.some((output) => output.backgroundSkipped) && <p role="status" className="text-amber-600 dark:text-amber-400">{t('canvas.edit.batchSkipped', { count: data.state.batchOutputs.filter((output) => output.backgroundSkipped).length })}</p>}
    {settings.aiBackground && <p className="text-muted-foreground">{t('canvas.edit.aiHint')}</p>}
    {busy && <p role="status">{t(settings.aiBackground ? 'canvas.edit.aiBusy' : 'canvas.edit.previewing')}{settings.aiBackground && aiProgress !== undefined ? ` ${aiProgress}%` : ''}</p>}
    {preview && <img src={preview} alt={t('canvas.edit.preview')} className="max-h-48 w-full object-contain" style={{ backgroundColor: '#ddd', backgroundImage: 'conic-gradient(#aaa 25%, transparent 0 50%, #aaa 0 75%, transparent 0)', backgroundSize: '16px 16px' }} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!source && <p>{t('canvas.edit.input')}</p>}
    {sources.length > 1 && <p className="text-muted-foreground">{t('canvas.edit.multiple')}</p>}
    <div className="flex gap-2"><button type="button" onClick={() => change(DEFAULT_IMAGE_EDIT)} className="cursor-pointer rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary">{t('canvas.edit.reset')}</button><button type="button" disabled={!source || busy || !!error} onClick={data.onRun} className="flex-1 cursor-pointer rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">{t('canvas.edit.apply')}</button></div>
  </fieldset>;
}
