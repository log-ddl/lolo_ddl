import { AudioLines } from 'lucide-react';
import { FeatureHeaderIcon } from '@/shared/components/FeatureHeaderIcon';
import { useI18n } from '@/shared/i18n';

export function TtsHeader({ provider = 'omnivoice' }: { provider?: 'omnivoice' | 'vieneu' | 'capcut' | 'gemini' | 'vbee' }) {
  const { t } = useI18n();
  return (
    <header className="h-14 shrink-0 border-b border-border/60 bg-panel/80 backdrop-blur-xl px-4 flex items-center gap-3">
      <FeatureHeaderIcon icon={AudioLines} />
      <div>
        <h1 className="text-sm font-semibold leading-tight">{t('tts.title')}</h1>
        <p className="text-2xs text-muted-foreground">{t(provider === 'vieneu' ? 'tts.subtitle.vieneu' : provider === 'vbee' ? 'tts.subtitle.vbee' : provider === 'gemini' ? 'tts.subtitle.gemini' : provider === 'capcut' ? 'tts.subtitle.capcut' : 'tts.subtitle')}</p>
      </div>
    </header>
  );
}
