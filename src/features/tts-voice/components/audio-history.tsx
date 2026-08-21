import { useMemo, useState } from 'react';
import { Clock3, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import type { TtsHistoryItem } from '../types';
import { getTtsModel } from '../lib/model-registry';
import { AudioHistoryItem } from './audio-history-item';

interface AudioHistoryProps {
  items: TtsHistoryItem[];
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export function AudioHistory({ items, onRename, onRemove }: AudioHistoryProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const hasFilters = Boolean(query || sortOrder !== 'newest');

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        if (!normalizedQuery) return true;
        const modelName = getTtsModel(item.modelId)?.name || item.modelId;
        return [item.name, item.text, item.voiceLabel, modelName]
          .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => sortOrder === 'newest' ? right.createdAt - left.createdAt : left.createdAt - right.createdAt);
  }, [items, query, sortOrder]);

  const resetFilters = () => {
    setQuery('');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">{t('tts.history.title')}</h2>
        </div>
        {items.length > 0 && <span className="text-[11px] text-muted-foreground">{t('tts.history.resultCount', { visible: visibleItems.length, total: items.length })}</span>}
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('tts.history.empty')}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/60 bg-card/50 p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(200px,1fr)_175px_auto] sm:items-end">
              <div>
                <Label className="text-[10px]">{t('tts.history.search')}</Label>
                <div className="relative mt-1.5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('tts.history.searchPlaceholder')} className="h-9 pl-9 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-[10px]">{t('tts.history.sort')}</Label>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                  <SelectTrigger className="mt-1.5 h-9 w-full bg-background text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('tts.history.newest')}</SelectItem>
                    <SelectItem value="oldest">{t('tts.history.oldest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={!hasFilters} onClick={resetFilters} title={t('tts.history.resetFilters')}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t('tts.history.noResults')}</div>
          ) : visibleItems.map((item) => (
            <AudioHistoryItem key={item.id} item={item} onRename={onRename} onRemove={onRemove} />
          ))}
        </>
      )}
    </div>
  );
}
