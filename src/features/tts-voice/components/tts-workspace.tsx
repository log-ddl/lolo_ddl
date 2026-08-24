import { Download, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n';
import { useTtsController } from '../hooks/use-tts-controller';
import { AudioHistory } from './audio-history';
import { GenerationProgress } from './generation-progress';
import { TextEditorCard } from './text-editor-card';
import { TtsHeader } from './tts-header';
import { TtsSidebar } from './tts-sidebar';
import { VoiceSettingsPanel } from './voice-settings-panel';
import { MissingModelDialog } from './dialogs/missing-model-dialog';
import { ModelManagerDialog } from './dialogs/model-manager-dialog';
import { VoiceProfileDialog } from './dialogs/voice-profile-dialog';

export function TtsWorkspace() {
  const controller = useTtsController();
  const { t } = useI18n();

  return (
    <div className="h-full min-h-0 flex bg-background text-foreground">
      <TtsSidebar onOpenSettings={() => controller.setManagerOpen(true)} />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TtsHeader provider={controller.isVieneu ? 'vieneu' : controller.isVbee ? 'vbee' : controller.isGemini ? 'gemini' : controller.isCapCut ? 'capcut' : 'omnivoice'} />

        <main className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(420px,1.25fr)_minmax(340px,0.75fr)] overflow-hidden">
          <section className="min-h-0 overflow-y-auto border-r border-border/60 p-4">
            <div className="w-full space-y-4">
              <TextEditorCard value={controller.text} onChange={controller.setText} splitMode={controller.splitMode} />

              {controller.busy && controller.progress && (
                <GenerationProgress progress={controller.progress} onCancel={controller.cancelJob} />
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  disabled={controller.busy}
                  onClick={controller.generate}
                  className="min-w-48"
                >
                  {controller.selectedStatus?.status === 'ready'
                    ? <><Play /> {t('tts.action.generate')}</>
                    : <><Download /> {t('tts.action.downloadToGenerate')}</>}
                </Button>
              </div>

              <AudioHistory
                items={controller.history}
                onRename={controller.renameHistory}
                onRemove={controller.removeHistory}
              />
            </div>
          </section>

          <VoiceSettingsPanel controller={controller} />
        </main>
      </div>

      <ModelManagerDialog controller={controller} />
      <MissingModelDialog controller={controller} />
      <VoiceProfileDialog controller={controller} />
    </div>
  );
}
