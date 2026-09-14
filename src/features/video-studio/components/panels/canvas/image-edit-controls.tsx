import { useEffect, useState } from 'react';
import { DEFAULT_IMAGE_EDIT, processImage, type ImageEditSettings } from '@/features/video-studio/canvas/image-processing';
import type { CanvasNodeRenderData } from './canvas-node';
import { useI18n } from '@/shared/i18n';

export function ImageEditControls({ data }: { data: CanvasNodeRenderData }) {
  const { t } = useI18n();
  const settings = { ...DEFAULT_IMAGE_EDIT, ...data.state.imageEdit };
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sources = [...new Set([...data.state.refs, ...data.inputPreviews])];
  const source = sources[0];
  const signature = JSON.stringify(settings);
  useEffect(() => {
    let disposed = false, url = '';
    setPreview(''); setError(''); setBusy(!!source);
    const timer = setTimeout(() => {
      if (!source) return;
      void processImage(source, JSON.parse(signature)).then((blob) => {
        if (disposed) return;
        url = URL.createObjectURL(blob); setPreview(url);
      }).catch((reason) => { if (!disposed) setError(String(reason instanceof Error ? reason.message : reason)); })
        .finally(() => { if (!disposed) setBusy(false); });
    }, 250);
    return () => { disposed = true; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [source, signature]);
  const change = (patch: Partial<ImageEditSettings>) => data.onChange({ imageEdit: { ...settings, ...patch } });
  const number = (key: 'x' | 'y' | 'width' | 'height' | 'threshold' | 'softness', max: number) => (
    <label className="flex items-center justify-between gap-2">{t(`canvas.edit.${key}`)}
      <input type="number" min={key === 'width' || key === 'height' ? 1 : 0} max={max} value={settings[key]} className="w-20 rounded border border-border bg-background px-2 py-1"
        onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) change({ [key]: Math.min(max, Math.max(key === 'width' || key === 'height' ? 1 : 0, value)) }); }} />
    </label>
  );
  return <fieldset disabled={data.state.status === 'running'} className="nodrag nopan nowheel space-y-2 p-3 text-xs" onKeyDown={(event) => event.stopPropagation()}>
    <p className="text-muted-foreground">{t('canvas.edit.hint')}</p>
    <label className="flex gap-2"><input type="checkbox" checked={settings.crop} onChange={(e) => change({ crop: e.target.checked })} />{t('canvas.edit.crop')}</label>
    {settings.crop && <div className="space-y-2">
      <label className="flex items-center justify-between">{t('canvas.edit.ratio')}<select value={settings.ratio} onChange={(e) => change({ ratio: e.target.value })} className="rounded bg-muted p-1"><option value="free">{t('canvas.edit.free')}</option>{['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => <option key={ratio}>{ratio}</option>)}</select></label>
      {number('x', 99)}{number('y', 99)}{number('width', 100)}{number('height', 100)}
    </div>}
    <label className="flex gap-2"><input type="checkbox" checked={settings.chroma} onChange={(e) => change({ chroma: e.target.checked })} />{t('canvas.edit.chroma')}</label>
    {settings.chroma && <div className="space-y-2"><label className="flex justify-between">{t('canvas.edit.color')}<input type="color" value={settings.color} onChange={(e) => change({ color: e.target.value })} /></label>{number('threshold', 442)}{number('softness', 442)}</div>}
    {busy && <p role="status">{t('canvas.edit.previewing')}</p>}
    {preview && <img src={preview} alt={t('canvas.edit.preview')} className="max-h-48 w-full object-contain" style={{ backgroundColor: '#ddd', backgroundImage: 'conic-gradient(#aaa 25%, transparent 0 50%, #aaa 0 75%, transparent 0)', backgroundSize: '16px 16px' }} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!source && <p>{t('canvas.edit.input')}</p>}
    {sources.length > 1 && <p className="text-muted-foreground">{t('canvas.edit.multiple')}</p>}
    <div className="flex gap-2"><button type="button" onClick={() => change(DEFAULT_IMAGE_EDIT)} className="rounded border border-border px-2 py-1">{t('canvas.edit.reset')}</button><button type="button" disabled={!source || busy || !!error} onClick={data.onRun} className="rounded bg-primary px-3 py-1 text-primary-foreground disabled:opacity-50">{t('canvas.edit.apply')}</button></div>
  </fieldset>;
}
