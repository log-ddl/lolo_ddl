import { CheckCircle2, FolderOpen } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useI18n } from '@/shared/i18n';
import type { TtsController } from '../../hooks/use-tts-controller';

export function VoiceProfileDialog({ controller }: { controller: TtsController }) {
  const { t } = useI18n();
  const {
    profileOpen, setProfileOpen, selectedModel, profileName, setProfileName,
    referenceAudioPath, referenceText, setReferenceText, pickReferenceAudio, saveProfile,
  } = controller;

  return (
    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tts.profile.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('tts.profile.compatibility', { model: selectedModel.name })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t('tts.profile.name')}</Label>
            <Input className="mt-2" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder={t('tts.profile.namePlaceholder')} />
          </div>
          <div>
            <Label>{t('tts.profile.referenceAudio')}</Label>
            <div className="mt-2 flex gap-2">
              <Input readOnly value={referenceAudioPath} placeholder={t('tts.profile.audioPlaceholder')} />
              <Button variant="outline" onClick={pickReferenceAudio}><FolderOpen /> {t('tts.profile.choose')}</Button>
            </div>
          </div>
          <div>
            <Label>{controller.isVieneu ? t('tts.profile.transcriptOptional') : t('tts.profile.transcript')}</Label>
            <Textarea
              className="mt-2 min-h-28"
              value={referenceText}
              onChange={(event) => setReferenceText(event.target.value)}
              placeholder={t('tts.profile.transcriptPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setProfileOpen(false)}>{t('tts.action.cancel')}</Button>
          <Button onClick={saveProfile}><CheckCircle2 /> {t('tts.profile.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
