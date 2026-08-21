import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { useI18n } from '@/shared/i18n';
import type { ProjectVoiceMode } from '@/features/video-studio/lib/ai/voice-selection';

interface ProjectVoiceControlsProps {
  voiceMode?: ProjectVoiceMode;
  narratorVoice?: string;
  onVoiceModeChange: (value: ProjectVoiceMode) => void;
  onNarratorVoiceChange: (value: string | undefined) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ProjectVoiceControls({
  voiceMode = 'off',
  narratorVoice,
  onVoiceModeChange,
  onNarratorVoiceChange,
  disabled = false,
  compact = false,
}: ProjectVoiceControlsProps) {
  const { t } = useI18n();
  const narratorDisabled = disabled || voiceMode !== 'full';

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t('voice.mode')}</span>
        <Select value={voiceMode} onValueChange={(value) => onVoiceModeChange(value as ProjectVoiceMode)} disabled={disabled}>
          <SelectTrigger className={compact ? 'w-[140px] h-8 text-xs' : 'w-[160px] h-8 text-xs'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off" className="text-xs">{t('voice.mode.off')}</SelectItem>
            <SelectItem value="selective" className="text-xs">{t('voice.mode.selective')}</SelectItem>
            <SelectItem value="ref" className="text-xs">{t('voice.mode.ref')}</SelectItem>
            <SelectItem value="full" className="text-xs">{t('voice.mode.full')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t('voice.narrator')}</span>
        <Input
          value={narratorVoice || ''}
          onChange={(e) => onNarratorVoiceChange(e.target.value.trim() || undefined)}
          placeholder={t('voice.selectNarrator')}
          disabled={narratorDisabled}
          className={compact ? 'w-[160px] h-8 text-xs' : 'w-[180px] h-8 text-xs'}
        />
      </div>
    </>
  );
}
