import { Loader2, Square } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/i18n';
import { getTtsProgressLabel } from '../lib/progress-label';
import type { TtsProgressEvent } from '../types';

interface GenerationProgressProps {
  progress: TtsProgressEvent;
  onCancel: () => void;
}

export function GenerationProgress({ progress, onCancel }: GenerationProgressProps) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="animate-spin text-primary" />
            {getTtsProgressLabel(progress.stage, t)}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={progress.message}>{progress.message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-primary">{Math.round(progress.percent ?? 0)}%</span>
          <Button variant="outline" size="sm" onClick={onCancel}><Square /> {t('tts.action.cancel')}</Button>
        </div>
      </div>
      <Progress value={progress.percent ?? 20} />
    </div>
  );
}
