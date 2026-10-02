import { useI18n } from '@/shared/i18n';
import { MOTION_MODES, MOTION_ENTRANCES, motionMode, type MotionMode, type MotionEntrance } from '@/features/video-studio/canvas/motion-math';
import type { CanvasNodeRenderData } from './canvas-node';
export function MotionControls({ data }: { data: CanvasNodeRenderData }) {
  const { t } = useI18n();
  const mode = motionMode(data.state.kind, data.state.motionMode);
  const intensity = data.state.motionIntensity ?? 1;
  const speed = data.state.motionSpeed ?? 1;
  return <fieldset disabled={data.state.status === 'running'} className="nodrag nopan nowheel space-y-3 p-3 text-xs" onKeyDown={(event) => event.stopPropagation()}>
    <label className="block space-y-1"><span>{t('canvas.motion.mode')}</span>
      <select value={mode} onChange={(event) => data.onChange({ motionMode: event.target.value as MotionMode })} className="h-9 w-full rounded-lg border border-border bg-background px-2 outline-none focus:border-primary">
        {MOTION_MODES.map((value) => <option key={value} value={value}>{t(`canvas.motion.mode.${value}`)}</option>)}
      </select>
    </label>
    <label className="block space-y-1"><span>{t('canvas.motion.entrance')}</span>
      <select value={data.state.motionEntrance ?? 'none'} onChange={(event) => data.onChange({ motionEntrance: event.target.value as MotionEntrance })} className="h-9 w-full rounded-lg border border-border bg-background px-2">
        {MOTION_ENTRANCES.map((value) => <option key={value} value={value}>{t(`canvas.motion.entrance.${value}`)}</option>)}
      </select>
    </label>
    <p className="text-muted-foreground">{t(mode === 'frames' ? 'canvas.motion.framesHint' : 'canvas.motion.hint')}</p>
    {<label className="block space-y-1">
      <span className="flex justify-between"><span>{t('canvas.motion.intensity')}</span><span className="tabular-nums">{Math.round(intensity * 100)}%</span></span>
      <input aria-label={t('canvas.motion.intensity')} type="range" min="0" max="3" step="0.05" value={intensity} onChange={(event) => data.onChange({ motionIntensity: Number(event.target.value) })} className="w-full accent-primary" />
    </label>}
    <label className="block space-y-1">
      <span className="flex justify-between"><span>{t('canvas.motion.speed')}</span><span className="tabular-nums">{speed.toFixed(2)}×</span></span>
      <input aria-label={t('canvas.motion.speed')} type="range" min="0.25" max="3" step="0.05" value={speed} onChange={(event) => data.onChange({ motionSpeed: Number(event.target.value) })} className="w-full accent-primary" />
    </label>
    <label className="flex items-center justify-between gap-2">{t('canvas.motion.duration')}
      <input type="number" min="0.1" max="60" step="0.1" value={data.state.motionDuration ?? 5} className="w-20 rounded border border-border bg-background px-2 py-1" onChange={(event) => { const duration = event.target.valueAsNumber; if (Number.isFinite(duration)) data.onChange({ motionDuration: Math.max(0.1, Math.min(60, duration)) }); }} />
    </label>
    <p className="text-muted-foreground">{t('canvas.motion.format')}</p>
    <div className="flex gap-2">
      <button type="button" onClick={() => data.onChange({ motionIntensity: 1, motionSpeed: 1 })} className="rounded border border-border px-2 py-2">{t('canvas.motion.reset')}</button>
      <button type="button" onClick={data.onRun} className="flex-1 rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50">{t('canvas.motion.render')}</button>
    </div>
  </fieldset>;
}
