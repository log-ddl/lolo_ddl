import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { PromptBox } from "./prompt-box";
import { useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';
import { nodeSpec, type PortType } from '@/features/video-studio/canvas/types';
import { useResolvedImageUrl } from '@/features/video-studio/hooks/use-resolved-image-url';
import { useI18n } from '@/shared/i18n';
import type { CanvasNodeRenderData } from './canvas-node';

export function UtilityNode({ data, selected }: { data: CanvasNodeRenderData; selected?: boolean }) {
  const { state, onChange, onUpload, onDelete, onAddNext, values = [] } = data;
  const { t } = useI18n();
  const spec = nodeSpec(state);
  const type = spec.output!;
  const picker = useRef<HTMLInputElement>(null);
  const press = useRef<{ x: number; y: number } | null>(null);
  const choosing = state.kind === 'router' || state.kind === 'selectResult';
  const value = state.selectedValue || values[state.selectedItem || 0];
  const [naming, setNaming] = useState(false);
  return <div className={`canvas-compact-node relative w-[250px] ${selected ? 'is-selected' : ''}`}>
    <div className="canvas-node-title absolute -top-7 left-0 flex h-7 w-full cursor-grab items-center px-2 text-[10px]">
      {naming ? <input autoFocus defaultValue={state.name || `${t(spec.labelKey)} #${state.index}`} aria-label={t('canvas.rename')} onBlur={(e) => { onChange({ name: e.target.value.trim() }); setNaming(false); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setNaming(false); }} className="nodrag nopan w-full bg-transparent outline-none" />
        : <span className="w-full truncate select-none" title={t('canvas.rename')} onDoubleClick={(e) => { e.stopPropagation(); setNaming(true); }}>{state.name || `${t(spec.labelKey)} #${state.index}`}</span>}
    </div>
    {state.kind !== 'reference' && <Handle id="items" type="target" position={Position.Left} style={{ top: 24, left: -18 }} title={t('canvas.items')} />}
    {state.kind === 'reference' && <Handle id="refs" type="target" position={Position.Left} style={{ top: 24, left: -18 }} title={t('canvas.port.refs')} />}
    <Handle id="out" type="source" position={Position.Right} style={{ top: 24, right: -18 }} title={t('canvas.node.outputHint')}
      onPointerDown={(e) => { if (e.button === 0) press.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => { e.stopPropagation(); const start = press.current; press.current = null; if (start && Math.hypot(start.x - e.clientX, start.y - e.clientY) < 5) onAddNext(); }}><Plus className="pointer-events-none size-3" /></Handle>
    <div className={`canvas-node-card rounded-2xl border-2 bg-card p-3 ${selected ? 'border-primary' : 'border-border'}`}>
      {state.kind !== 'reference' && <select aria-label={t('canvas.valueType')} value={type} disabled={data.connectedPorts.length > 0 || data.hasOutgoing} onChange={(e) => onChange({ valueType: e.target.value as PortType, items: [], selectedValue: undefined, selectedItem: 0 })} className="canvas-node-controls nodrag nopan mb-2 w-full rounded bg-muted px-2 py-1 text-xs">
        {(state.kind === 'selectResult' ? ['image', 'video'] : ['text', 'image', 'video']).map((value) => <option key={value} value={value}>{t(`canvas.type.${value}`)}</option>)}
      </select>}
      {state.kind === 'reference' && <PromptBox dragToMove value={state.prompt} rows={4} placeholder={t('canvas.referenceRules')} onCommit={(prompt) => onChange({ prompt })} />}
      {state.kind === 'list' && type === 'text' && <PromptBox dragToMove value={state.items?.join('\n') || ''} rows={5} placeholder={t('canvas.listLines')} onCommit={(value) => onChange({ items: value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 100) })} />}
      {choosing && <select aria-label={t('canvas.chooseItem')} value={values.includes(value) ? value : ''} onChange={(e) => onChange({ selectedValue: e.target.value, selectedItem: values.indexOf(e.target.value) })} className="nodrag nopan mb-2 w-full rounded bg-muted p-2 text-xs">
        <option value="" disabled>{t('canvas.chooseItem')}</option>
        {values.map((entry, i) => <option key={`${i}:${entry}`} value={entry}>#{i + 1} {type === 'text' ? entry.slice(0, 65) : t(`canvas.type.${type}`)}</option>)}
      </select>}
      {choosing && value && values.includes(value) && (type === 'text' ? <p className="max-h-32 overflow-auto whitespace-pre-wrap text-xs">{value}</p> : <UtilityMedia url={value} type={type} />)}
      {!choosing && type !== 'text' && <div className="nowheel grid max-h-48 grid-cols-3 gap-1 overflow-auto">{values.map((url, index) => <div key={`${index}:${url}`} className="relative rounded border border-border"><UtilityMedia url={url} type={type} small />
        {index < (state.kind === 'reference' ? state.refs.length : (state.items?.length || 0)) && <button title={t('canvas.node.delete')} className="nodrag nopan absolute right-0 top-0 rounded bg-background p-1" onClick={() => state.kind === 'reference' ? data.onRemoveRef(url) : onChange({ items: state.items?.filter((_, i) => i !== index) })}><Trash2 className="size-3" /></button>}</div>)}</div>}
      {!values.length && !(state.kind === 'list' && type === 'text') && <p className="py-8 text-center text-xs text-muted-foreground">{t('canvas.noItems')}</p>}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>{values.length} {t('canvas.items')}</span><button title={t('canvas.node.delete')} onClick={onDelete} className="canvas-node-controls nodrag nopan p-1"><Trash2 className="size-3" /></button></div>
      {!choosing && type !== 'text' && <button onClick={() => picker.current?.click()} className="nodrag nopan mt-2 flex w-full items-center justify-center gap-1 rounded border border-dashed border-border p-2 text-xs"><Plus className="size-3" />{t('canvas.addMedia')}</button>}
      {state.kind === 'list' && <p className="mt-2 text-[10px] text-muted-foreground">{t('canvas.listHint')}</p>}
      <input ref={picker} type="file" multiple accept={type === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { if (e.target.files) onUpload(e.target.files); e.target.value = ''; }} />
    </div>
  </div>;
}

export function UtilityMedia({ url, type, small }: { url: string; type: PortType; small?: boolean }) {
  const resolved = useResolvedImageUrl(url);
  const { t } = useI18n();
  const [preview, setPreview] = useState(false);
  const press = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const className = small ? 'h-16 w-full object-contain' : 'max-h-48 w-full object-contain';
  return <>
    <div role="button" tabIndex={0} aria-label={t('canvas.node.openOutput')} className="cursor-grab"
      onPointerDown={(event) => { press.current = event.button === 0 ? { x: event.clientX, y: event.clientY, dragged: false } : null; }}
      onPointerMove={(event) => { const start = press.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 5) start.dragged = true; }}
      onClick={(event) => { event.stopPropagation(); const start = press.current; press.current = null; if (start && !start.dragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) setPreview(true); }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setPreview(true); } }}>
      {type === 'video' ? <video src={resolved || ''} draggable={false} muted playsInline className={className} /> : <img src={resolved || ''} alt="" draggable={false} className={className} />}
    </div>
    <Dialog open={preview} onOpenChange={setPreview}>
      <DialogContent className="nodrag nopan max-w-4xl" aria-describedby={undefined} onKeyDown={(event) => event.stopPropagation()}>
        <DialogTitle>{t('canvas.node.openOutput')}</DialogTitle>
        {type === 'video' ? <video src={resolved || ''} controls className="max-h-[75vh] w-full object-contain" /> : <img src={resolved || ''} alt={t('canvas.node.openOutput')} className="max-h-[75vh] w-full object-contain" />}
      </DialogContent>
    </Dialog>
  </>;
}
