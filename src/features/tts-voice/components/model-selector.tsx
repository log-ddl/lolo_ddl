import { Cpu, Download, Globe2 } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n';
import type { TtsController } from '../hooks/use-tts-controller';
import { ModelStatusBadge } from './model-status-badge';

export function ModelSelector({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const {
    engineGroups, selectedEngine, selectedModel, selectedStatus, statuses,
    currentModelLabel, setSelectedEngineId, setSelectedModelId, installModel, busy,
  } = controller;
  const online = selectedModel.runtimeKind === 'online';
  const Icon = online ? Globe2 : Cpu;

  const selectModel = (modelId: string) => {
    const engine = engineGroups.find((group) => group.models.some((model) => model.id === modelId));
    if (!engine || busy) return;
    if (engine.id !== selectedEngine.id) setSelectedEngineId(engine.id);
    setSelectedModelId(modelId);
  };

  return (
    <section className="rounded-xl border border-border/60 bg-card/65">
      <Select value={selectedModel.id} onValueChange={selectModel} disabled={busy}>
        <SelectTrigger aria-label={t('tts.settings.model')} className="h-auto min-h-20 gap-3 whitespace-normal rounded-xl border-0 bg-transparent p-4 text-left shadow-none [&>span]:line-clamp-none">
          <SelectValue asChild>
            <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {selectedModel.name}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{currentModelLabel}</span>
              </span>
              {online
                ? <Badge variant="outline">{t('tts.engine.online')}</Badge>
                : <ModelStatusBadge status={selectedStatus} />}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent showScrollButtons={false}>
          {engineGroups.map((engine) => (
            <SelectGroup key={engine.id}>
              <SelectLabel>{engine.name}</SelectLabel>
              {engine.models.map((model) => (
                <SelectItem key={model.id} value={model.id} textValue={model.name}>
                  <span className="flex items-center justify-between gap-3">
                    <span>{model.name}</span>
                    {model.runtimeKind === 'online'
                      ? <Badge variant="outline">{t('tts.engine.online')}</Badge>
                      : <ModelStatusBadge status={statuses[model.id]} />}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {!online && selectedStatus?.status !== 'ready' && (
        <div className="px-4 pb-4">
          <Button variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => installModel(selectedModel)}>
            <Download /> {selectedStatus?.status === 'incompatible' && selectedStatus.installedPath
              ? t('tts.manager.repairRuntime')
              : t('tts.manager.download')}
          </Button>
        </div>
      )}
    </section>
  );
}
