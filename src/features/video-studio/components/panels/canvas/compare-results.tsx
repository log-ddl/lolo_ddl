import { useState } from 'react';
import type { NodeOutput } from '@/features/video-studio/canvas/types';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { useI18n } from '@/shared/i18n';
import { UtilityMedia } from './utility-node';

export function CompareResults({ outputs, onSelect, disabled }: { outputs: NodeOutput[]; onSelect: (output: NodeOutput) => void; disabled: boolean }) {
  const { t } = useI18n(); const [open, setOpen] = useState(false); const [choices, setChoices] = useState([0, 1]);
  if (outputs.length < 2) return null;
  return <><button onClick={() => setOpen(true)} className="rounded border border-border p-2 text-xs">{t('canvas.compare')}</button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="nodrag nopan max-w-6xl" aria-describedby={undefined}><DialogTitle>{t('canvas.compare')}</DialogTitle><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{choices.map((choice, side) => {
    const output = outputs[choice] || outputs[0];
    return <div key={side} className="min-w-0 space-y-3"><select aria-label={`${t('canvas.compare')} ${side + 1}`} value={choice} onChange={(e) => setChoices((values) => values.map((v, i) => i === side ? Number(e.target.value) : v))} className="w-full rounded bg-muted p-2 text-sm">{outputs.map((o, index) => <option key={o.url} value={index}>#{index + 1} · {new Date(o.createdAt).toLocaleString()}</option>)}</select><UtilityMedia url={output.url} type={output.kind} /><p className="max-h-24 overflow-auto whitespace-pre-wrap text-xs">{output.prompt}</p><button disabled={disabled} onClick={() => { onSelect(output); setOpen(false); }} className="w-full rounded bg-primary p-2 text-sm text-primary-foreground disabled:opacity-50">{t('canvas.useOutput')}</button></div>;
  })}</div></DialogContent></Dialog></>;
}
