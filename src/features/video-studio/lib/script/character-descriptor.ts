import type { ScriptCharacter } from '@/features/video-studio/types/script';

/** Build a short visual descriptor for prompt disambiguation. */
export function buildCharacterDescriptor(character: ScriptCharacter): string {
  const normalize = (value?: string) => (value || '').trim().replace(/\s+/g, ' ');
  const prompt = normalize(character.characterPrompt || character.appearance);
  const firstClause = prompt.split(/[,;.•\n]/)[0] || '';
  return firstClause.length > 90 ? `${firstClause.slice(0, 87).trimEnd()}...` : firstClause;
}
