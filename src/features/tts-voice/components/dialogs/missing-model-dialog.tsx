import { Download } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import type { TtsController } from '../../hooks/use-tts-controller';

export function MissingModelDialog({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const {
    missingModelOpen, setMissingModelOpen, selectedModel,
    closeMissingModelPrompt, installSelectedModelFromPrompt,
  } = controller;

  return (
    <Dialog
      open={missingModelOpen}
      onOpenChange={(open) => open ? setMissingModelOpen(true) : closeMissingModelPrompt()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tts.missing.title')}</DialogTitle>
          <DialogDescription>
            {t('tts.missing.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          <p className="font-medium">{selectedModel.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('tts.missing.size', { size: selectedModel.estimatedDownloadGb })}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeMissingModelPrompt}>{t('tts.manager.later')}</Button>
          <Button variant="primary" onClick={installSelectedModelFromPrompt}><Download /> {t('tts.manager.download')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
