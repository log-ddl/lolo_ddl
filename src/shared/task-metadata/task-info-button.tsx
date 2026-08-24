import { useMemo, useState, type ReactNode } from 'react';
import { Check, Copy, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog';
import { useTaskMetadataStore } from './store';
import type { TaskMetadata, TaskMetadataKind } from './types';
import { useI18n } from '@/shared/i18n';

type Props = {
  taskId?: string;
  outputUrl?: string | null;
  prompt?: string | null;
  kind?: TaskMetadataKind;
  className?: string;
  title?: string;
  latest?: boolean;
};

function formatDate(value: number | undefined, locale: string) {
  return value ? new Date(value).toLocaleString(locale) : '—';
}

function formatDuration(start?: number, end?: number) {
  if (!start || !end || end < start) return '—';
  const seconds = Math.round((end - start) / 100) / 10;
  return `${seconds}s`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-1.5 text-xs"><span className="text-muted-foreground">{label}</span><span className="min-w-0 break-words text-foreground">{value || '—'}</span></div>;
}

export function TaskInfoButton({ taskId, outputUrl, prompt, kind, className, title, latest = false }: Props) {
  const { t, locale } = useI18n();
  const buttonTitle = title || t('taskInfo.title');
  const records = useTaskMetadataStore((state) => state.records);
  const order = useTaskMetadataStore((state) => state.order);
  const [copied, setCopied] = useState(false);
  const record = useMemo(() => {
    if (taskId && records[taskId]) return records[taskId];
    return order.map((id) => records[id]).find((item) => item && (!kind || item.kind === kind) && (
      latest || (outputUrl && item.outputUrl === outputUrl) || (prompt && item.prompt === prompt)
    ));
  }, [kind, latest, order, outputUrl, prompt, records, taskId]);

  const processingStart = record ? (record.submittedAt || record.queuedAt) : undefined;
  const details = record
    ? Object.entries(record.details || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    : [];

  const copyPrompt = async () => {
    const text = record?.prompt || record?.instruction || '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 text-muted-foreground hover:text-foreground ${className || ''}`} title={buttonTitle} onClick={(event) => event.stopPropagation()}>
          <Info className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[82vh] max-w-xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4 text-primary" />{t('taskInfo.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 pb-5">
          {!record ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
              <Info className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">{t('taskInfo.noData')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('taskInfo.noDataHelp')}</p>
            </div>
          ) : (
            <>
          <section className="rounded-lg border bg-muted/20 px-3 py-2">
            <Row label={t('taskInfo.status')} value={t(`taskInfo.status.${record.status}`)} />
            <Row label={t('taskInfo.kind')} value={record.kind.toUpperCase()} />
            <Row label="Provider" value={record.provider} />
            <Row label="Model" value={record.model} />
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold">{t('taskInfo.time')}</h4>
            <div className="rounded-lg border px-3 py-2">
              <Row label={t('taskInfo.queuedAt')} value={formatDate(record.queuedAt, locale)} />
              <Row label={t('taskInfo.submittedAt')} value={formatDate(record.submittedAt, locale)} />
              <Row label={t('taskInfo.completedAt')} value={formatDate(record.completedAt, locale)} />
              <Row label={t('taskInfo.waitDuration')} value={formatDuration(record.queuedAt, record.submittedAt)} />
              <Row label={t('taskInfo.processingDuration')} value={formatDuration(processingStart, record.completedAt)} />
            </div>
          </section>
          {(record.prompt || record.instruction) && (
            <section>
              <div className="mb-1 flex items-center justify-between"><h4 className="text-xs font-semibold">{t('taskInfo.actualPrompt')}</h4><Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={copyPrompt}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? t('taskInfo.copied') : t('taskInfo.copy')}</Button></div>
              <pre className="max-h-64 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 font-sans text-xs leading-relaxed">{record.prompt || record.instruction}</pre>
            </section>
          )}
          {details.length > 0 && <details className="rounded-lg border px-3 py-2"><summary className="cursor-pointer text-xs font-semibold">{t('taskInfo.technical')}</summary><div className="mt-2 border-t pt-1">{details.map(([label, value]) => <Row key={label} label={label} value={String(value)} />)}<Row label="Task ID" value={<span className="font-mono text-2xs">{record.id}</span>} /></div></details>}
          {record.error && <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{record.error}</section>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
