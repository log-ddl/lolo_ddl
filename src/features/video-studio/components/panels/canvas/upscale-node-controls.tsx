import { useEffect } from 'react';
import { Loader2, Play, Square } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useTaskMetadataStore } from '@/shared/task-metadata/store';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { canUpscaleImage4K, imageUpscaleOwner } from '@/features/video-studio/canvas/image-upscale';
import type { CanvasNodeRenderData } from './canvas-node';

export function UpscaleNodeControls({ data }: { data: CanvasNodeRenderData }) {
  const { t } = useI18n();
  const { state, onChange, onRun, onCancel } = data;
  const credentials = useGoogleFlowRuntimeStore((store) => store.status?.credentials);
  const initialize = useGoogleFlowRuntimeStore((store) => store.initialize);
  useEffect(() => initialize(), [initialize]);
  const ultraOwners = useVideoStudioSettingsStore((store) => store.mediaRouting.ultraOwnerScopeIds);
  const records = useTaskMetadataStore((store) => store.records);
  const sources = data.upscaleSources || [];
  const ultra = sources.length > 0 && sources.every((source) => {
    const owner = imageUpscaleOwner(source, credentials || [], undefined, source.taskId ? records[source.taskId]?.details : undefined);
    return canUpscaleImage4K(credentials?.find((account) => account.ownerScopeId === owner), ultraOwners || []);
  });
  const running = state.status === 'running';
  return <div className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
    <p className="text-[10px] leading-relaxed text-muted-foreground">{t('canvas.upscale.nodeHint')}</p>
    <div className="flex items-center gap-2">
      <select aria-label={t('canvas.upscale.resolution')} value={state.upscaleResolution || '2K'} disabled={running}
        onChange={(event) => onChange({ upscaleResolution: event.target.value as '2K' | '4K' })}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
        <option value="2K">2K</option>
        <option value="4K" disabled={!ultra}>4K · Ultra</option>
      </select>
      <button type="button" onClick={running ? onCancel : onRun} title={t(running ? 'canvas.stop' : 'canvas.upscale.run')}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground">
        {running ? <Square className="size-3" /> : <Play className="size-3 fill-current" />}
        {t(running ? 'canvas.stop' : 'canvas.upscale.run')}
      </button>
    </div>
    {running && <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="size-3 animate-spin" />{t('canvas.download.preparing', { resolution: state.upscaleResolution || '2K' })}</p>}
    {!running && !ultra && <p className="text-[10px] text-muted-foreground">{t('canvas.upscale.ultraRequired')}</p>}
  </div>;
}
