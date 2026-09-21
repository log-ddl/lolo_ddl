import { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/shared/i18n';
import { useTaskMetadataStore } from '@/shared/task-metadata/store';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { canUpscaleImage4K, imageUpscaleOwner } from '@/features/video-studio/canvas/image-upscale';
import type { CanvasNodeState, NodeOutput } from '@/features/video-studio/canvas/types';

export function ImageDownloadMenu({ state, downloading, onDownload, onUpscale, expanded = false }: {
  state: CanvasNodeState; downloading: boolean; expanded?: boolean;
  onDownload: (output: NodeOutput) => Promise<void>;
  onUpscale?: (resolution: '2K' | '4K', download: (output: NodeOutput) => Promise<void>) => Promise<void>;
}) {
  const { t } = useI18n();
  const credentials = useGoogleFlowRuntimeStore((store) => store.status?.credentials);
  const initialize = useGoogleFlowRuntimeStore((store) => store.initialize);
  useEffect(() => initialize(), [initialize]);
  const ultraOwners = useVideoStudioSettingsStore((store) => store.mediaRouting.ultraOwnerScopeIds);
  const details = useTaskMetadataStore((store) => state.output?.taskId ? store.records[state.output.taskId]?.details : undefined);
  const [preparing, setPreparing] = useState<'2K' | '4K' | null>(null);
  const [quality, setQuality] = useState<'original' | '2K' | '4K'>('original');
  useEffect(() => setQuality('original'), [state.output?.url]);
  const busyRef = useRef(false);
  const output = state.output;
  if (!output || output.kind !== 'image') return null;
  const owner = imageUpscaleOwner(output, credentials || [], state.accountOwnerScopeId, details);
  const account = credentials?.find((item) => item.ownerScopeId === owner && item.state === 'ready');
  const ultra = canUpscaleImage4K(account, ultraOwners || []);
  const supportsUpscale = state.kind !== 'imageUpscale' && !!onUpscale && !!output.mediaId && output.provider !== 'qwen-local';
  const busy = downloading || !!preparing;
  const cached = (resolution: '2K' | '4K') => output.upscaleResolution === resolution ? output
    : state.outputs?.find((item) => item.upscaleResolution === resolution && item.upscaleSourceUrl === output.url);
  const exportImage = async (resolution?: '2K' | '4K') => {
    if (busyRef.current || busy) return;
    busyRef.current = true;
    try {
      if (!resolution) await onDownload(output);
      else {
        setPreparing(resolution);
        const ready = cached(resolution);
        if (ready) await onDownload(ready);
        else await onUpscale?.(resolution, onDownload);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('canvas.error.downloadFailed'));
    } finally { busyRef.current = false; setPreparing(null); }
  };
  const unavailable = (resolution: '2K' | '4K') => !cached(resolution) && (state.status === 'running' || !account || (resolution === '4K' && !ultra));
  const selected = supportsUpscale && quality !== 'original' && !unavailable(quality) ? quality : 'original';
  return <div className={expanded ? 'nodrag nopan mt-auto flex items-center gap-2' : 'nodrag nopan ml-auto flex items-center gap-1'}
    onClick={(event) => event.stopPropagation()}>
    {supportsUpscale && <select aria-label={t('canvas.download.quality')} disabled={busy} value={selected}
      title={selected === 'original' ? t('canvas.download.originalHint') : t('canvas.download.upscaleHint')}
      onChange={(event) => setQuality(event.target.value as typeof quality)}
      className={expanded
        ? 'min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm disabled:opacity-50'
        : 'max-w-24 rounded-md border border-border bg-background/90 px-1 py-1.5 text-xs disabled:opacity-50'}>
      <option value="original">{t('canvas.download.default')}</option>
      <option value="2K" disabled={unavailable('2K')}>2K</option>
      <option value="4K" disabled={unavailable('4K')}>4K · Ultra</option>
    </select>}
    <button type="button" disabled={busy} title={t('canvas.node.download')} aria-label={t('canvas.node.download')}
      onClick={() => void exportImage(selected === 'original' ? undefined : selected)}
      className={expanded
        ? 'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50'
        : 'flex items-center gap-1 rounded-md bg-background/90 p-1.5 hover:text-primary disabled:opacity-50'}>
      {busy ? <Loader2 className="size-3.5 shrink-0 animate-spin" /> : <Download className="size-3.5 shrink-0" />}
      {expanded && <span>{preparing ? t('canvas.download.preparing', { resolution: preparing }) : t('canvas.node.download')}</span>}
    </button>
  </div>;
}
