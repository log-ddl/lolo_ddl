const VOICE_OVER_MARKER_RE = /\bVoice\s+Over\s*[:：]\s*/i;

export interface VideoPromptVoiceOverParts {
  videoPrompt: string;
  voiceOver: string;
}

export function cleanVoiceOverText(value: string | undefined | null): string {
  return String(value ?? '')
    .trim()
    .replace(/^(?:"|“|'|‘)\s*/, '')
    .replace(/\s*(?:"|”|'|’)$/, '')
    .replace(/\\(["'])/g, '$1')
    .trim();
}

export function splitVideoPromptVoiceOver(prompt: string | undefined | null): VideoPromptVoiceOverParts {
  const source = String(prompt ?? '');
  const match = source.match(VOICE_OVER_MARKER_RE);
  if (!match || match.index === undefined) {
    return {
      videoPrompt: source.trim(),
      voiceOver: '',
    };
  }

  const markerEnd = match.index + match[0].length;
  return {
    videoPrompt: source.slice(0, match.index).trim(),
    voiceOver: cleanVoiceOverText(source.slice(markerEnd)),
  };
}

export function buildPromptVoiceOverSuffix(voiceOver: string | undefined | null): string {
  const cleaned = cleanVoiceOverText(voiceOver);
  return cleaned ? `Voice Over: "${cleaned.replace(/"/g, '\\"')}"` : '';
}

export function mergeVideoPromptVoiceOver(
  videoPrompt: string | undefined | null,
  voiceOver: string | undefined | null,
): string {
  const parts = splitVideoPromptVoiceOver(videoPrompt);
  const suffix = buildPromptVoiceOverSuffix(cleanVoiceOverText(voiceOver) || parts.voiceOver);
  return [parts.videoPrompt, suffix].filter(Boolean).join(' ');
}
