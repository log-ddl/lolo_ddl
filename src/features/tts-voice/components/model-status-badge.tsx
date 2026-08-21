import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/i18n';
import type { TtsModelStatus } from '../types';

export function ModelStatusBadge({ status }: { status?: TtsModelStatus }) {
  const { t } = useI18n();
  if (status?.status === 'ready') {
    return (
      <Badge className="border-success/30 bg-success/10 text-success hover:bg-primary hover:text-primary-foreground">
        {t('tts.status.ready')}
      </Badge>
    );
  }
  if (status?.status === 'downloading') {
    return <Badge className="border-info/30 bg-info/10 text-info">{t('tts.status.downloading')}</Badge>;
  }
  if (status?.status === 'error' || status?.status === 'incompatible') {
    return <Badge variant="destructive">{t('tts.status.error')}</Badge>;
  }
  return <Badge variant="outline">{t('tts.status.notInstalled')}</Badge>;
}
