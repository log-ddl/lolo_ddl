import { AlertCircle, Check, FolderOpen, FolderSearch, Loader2, Play, RefreshCw, Square, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/i18n';
import type { TtsBatchController } from '../hooks/use-tts-batch';
import type { TtsBatchStatus } from '../types';

interface BatchFolderCardProps {
  batch: TtsBatchController;
  /** Có job đơn đang chạy ngoài batch. */
  disabled: boolean;
  showOnlineHint: boolean;
  /** Hủy file đang đọc và dừng hẳn hàng chờ. */
  onStop: () => void;
}

const STATUS_STYLES: Record<TtsBatchStatus, string> = {
  pending: 'text-muted-foreground',
  running: 'text-primary',
  done: 'text-emerald-500',
  skipped: 'text-muted-foreground/70',
  error: 'text-destructive',
};

function StatusIcon({ status }: { status: TtsBatchStatus }) {
  if (status === 'running') return <Loader2 className="size-3.5 animate-spin" />;
  if (status === 'done') return <Check className="size-3.5" />;
  if (status === 'skipped') return <Check className="size-3.5" />;
  if (status === 'error') return <AlertCircle className="size-3.5" />;
  return null;
}

export function BatchFolderCard({ batch, disabled, showOnlineHint, onStop }: BatchFolderCardProps) {
  const { t } = useI18n();
  const { counts } = batch;
  const queued = counts.done + counts.error + counts.pending;
  const processed = counts.done + counts.error;
  const canStart = !disabled && !batch.scanning && !batch.running && counts.pending + counts.error > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{t('tts.batch.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('tts.batch.description')}</p>
        </div>
        {!batch.folderPath ? (
          <Button variant="outline" size="sm" onClick={batch.pickFolder} disabled={disabled}>
            <FolderSearch /> {t('tts.batch.pickFolder')}
          </Button>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={batch.openFolder} title={t('tts.batch.openFolder')}>
              <FolderOpen />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={batch.rescan} disabled={batch.running || batch.scanning} title={t('tts.batch.rescan')}>
              <RefreshCw className={batch.scanning ? 'animate-spin' : undefined} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={batch.clearFolder} disabled={batch.running} title={t('tts.batch.clearFolder')}>
              <X />
            </Button>
          </div>
        )}
      </div>

      {batch.folderPath && (
        <div className="mt-3 space-y-3">
          <p className="truncate text-xs text-muted-foreground" title={batch.folderPath}>{batch.folderPath}</p>

          {batch.scanning ? (
            <p className="text-xs text-muted-foreground">{t('tts.batch.scanning')}</p>
          ) : counts.total === 0 ? (
            <p className="text-xs text-muted-foreground">{t('tts.batch.empty')}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {t('tts.batch.summary', { total: counts.total, pending: counts.pending, skipped: counts.skipped })}
              </p>
              {batch.truncated && <p className="text-xs text-amber-500">{t('tts.batch.truncated', { count: counts.total })}</p>}

              <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
                {batch.items.map((item) => (
                  <li key={item.path} className="flex items-center gap-2 rounded-lg bg-background/70 px-2 py-1">
                    <span className="min-w-0 flex-1 truncate text-foreground" title={item.error || item.path}>{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {item.chars < 0 ? '—' : t('tts.batch.chars', { count: item.chars.toLocaleString() })}
                    </span>
                    <span className={`flex shrink-0 items-center gap-1 ${STATUS_STYLES[item.status]}`}>
                      <StatusIcon status={item.status} />
                      {t(`tts.batch.status.${item.status}`)}
                    </span>
                  </li>
                ))}
              </ul>

              {(batch.running || processed > 0) && queued > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('tts.batch.progress', { done: processed, total: queued })}</span>
                    {counts.error > 0 && <span className="text-destructive">{t('tts.batch.errorCount', { count: counts.error })}</span>}
                  </div>
                  <Progress value={Math.round((processed / queued) * 100)} />
                </div>
              )}

              {showOnlineHint && <p className="text-2xs leading-4 text-muted-foreground">{t('tts.batch.onlineHint')}</p>}

              <div className="flex justify-end gap-2">
                {batch.running ? (
                  <Button variant="outline" size="sm" onClick={onStop}>
                    <Square /> {t('tts.batch.stop')}
                  </Button>
                ) : (
                  <Button size="sm" onClick={batch.start} disabled={!canStart}>
                    <Play /> {t('tts.batch.start', { count: counts.pending + counts.error })}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
