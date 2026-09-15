import { useEffect, useState } from 'react';

import { Play, Square } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { getCliModels } from '@/features/video-studio/lib/cli-runtime';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';

import type { CanvasNodeRenderData } from './canvas-node';

export function AiNodeControls({ data }: { data: CanvasNodeRenderData }) {
  const { state, onChange } = data;
  const { t } = useI18n();
  const defaultAdapter = useVideoStudioSettingsStore((store) => store.cliRuntime.adapter);
  const adapter = state.aiAdapter || defaultAdapter;
  const [models, setModels] = useState<string[]>([]);
  useEffect(() => { let disposed = false; void getCliModels(adapter).then((result) => { if (!disposed) setModels(result.models); }).catch(() => { if (!disposed) setModels([]); }); return () => { disposed = true; }; }, [adapter]);
  const running = state.status === 'running';
  return <div className="canvas-node-controls nodrag nopan flex h-9 items-center gap-1.5 px-3 pb-2">
    <select aria-label="CLI" disabled={running} value={state.aiAdapter || ''} onChange={(e) => onChange({ aiAdapter: e.target.value as typeof state.aiAdapter || undefined, model: '' })} className="min-w-0 flex-1 truncate rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none"><option value="">{t('canvas.ai.settings')}</option><option value="claude">Claude CLI</option><option value="opencode">OpenCode</option><option value="codex">Codex CLI</option></select>
    <select aria-label="Model" disabled={running} value={state.model} onChange={(e) => onChange({ model: e.target.value })} className="min-w-0 flex-1 truncate rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none"><option value="">{t('canvas.ai.defaultModel')}</option>{[...new Set([state.model, ...models])].filter(Boolean).map((model) => <option key={model} value={model}>{model}</option>)}</select>
    <button type="button" title={t(running ? 'canvas.stop' : 'canvas.ai.run')} aria-label={t(running ? 'canvas.stop' : 'canvas.ai.run')} onClick={running ? data.onCancel : data.onRun} className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground">{running ? <Square className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}</button>
  </div>;
}