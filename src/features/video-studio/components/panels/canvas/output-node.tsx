import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, FolderOpen, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import type { CanvasNodeRenderData } from './canvas-node';

export function OutputNode({ data, selected }: { data: CanvasNodeRenderData; selected?: boolean }) {
  const { state, onChange } = data;
  const { t } = useI18n();
  const [error, setError] = useState('');
  const running = state.status === 'running';
  const choose = async () => {
    try {
      setError('');
      if (!window.storageManager?.selectDirectory) throw new Error(t('canvas.output.desktop'));
      const directory = await window.storageManager.selectDirectory();
      if (directory) onChange({ outputDirectory: directory, savedFiles: [], batchProgress: undefined });
    } catch (reason) { setError(String(reason instanceof Error ? reason.message : reason)); }
  };
  return <div className={`canvas-compact-node relative w-[250px] ${selected ? 'is-selected' : ''}`}>
    <div className="canvas-node-title absolute -top-7 left-0 flex h-7 w-full cursor-grab items-center gap-1 px-2 text-[10px]"><Download className="size-3" />{state.name || `Output #${state.index}`}</div>
    {/* Preserve old connection IDs at the same anchor when loading saved spaces. */}
    {['images', 'videos'].map((id) => <Handle key={id} id={id} type="target" position={Position.Left} isConnectable={false} style={{ top: 30, left: -18, opacity: 0, pointerEvents: 'none' }} />)}
    <Handle id="media" type="target" position={Position.Left} style={{ top: 30, left: -18 }} title={t('canvas.output.media')} aria-label={t('canvas.output.media')} />
    <div className={`canvas-node-card space-y-3 rounded-2xl border-2 bg-card p-3 text-xs ${selected ? 'border-primary' : 'border-border'}`}>
      <p className="text-muted-foreground">{t('canvas.output.hint')}</p>
      <button type="button" disabled={running} onClick={() => void choose()} title={state.outputDirectory} className="nodrag nopan flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"><FolderOpen className="size-4 shrink-0" /><span className="truncate">{state.outputDirectory || t('canvas.output.folder')}</span></button>
      {(error || state.error) && <p role="alert" className="break-words text-destructive">{error || (state.error?.startsWith('OUTPUT_') ? t(`canvas.output.${state.error}`) : state.error)}</p>}
      {!!state.savedFiles?.length && <p role="status" className="text-muted-foreground">{t('canvas.output.saved', { count: state.savedFiles.length })}{running && state.batchProgress ? ` / ${state.batchProgress.total}` : ''}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={!state.outputDirectory || !data.connectedPorts.length} onClick={running ? data.onCancel : data.onRun} className="nodrag nopan flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary p-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{running ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}{t(running ? 'canvas.stop' : 'canvas.output.save')}</button>
        <button type="button" disabled={running} title={t('canvas.node.delete')} onClick={data.onDelete} className="nodrag nopan rounded-md p-2 hover:bg-accent"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  </div>;
}
