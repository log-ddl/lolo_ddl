/**
 * Series-meta sync utilities.
 *
 * 1. populateSeriesMetaFromImport: build SeriesMeta from import results + AI analysis
 * 2. buildSeriesContextSummary: create a compact AI-injection summary from SeriesMeta
 * 3. syncToSeriesMeta: write calibration results back into SeriesMeta
 */

import type {
  SeriesMeta,
  ScriptCharacter,
  ScriptScene,
  ProjectBackground,
  ScriptData,
} from '@/features/video-studio/types/script';
import type { ScriptStructureAnalysis } from './script-normalizer';

// ==================== 1. Initial Import Population ====================

/**
 * Build SeriesMeta from imported data.
 * Prefer AI analysis output and fill any gaps from background + scriptData.
 */
export function populateSeriesMetaFromImport(
  background: ProjectBackground,
  scriptData: ScriptData,
  aiAnalysis?: ScriptStructureAnalysis | null,
  importSettings?: { styleId?: string }
): SeriesMeta {
  // Make sure the title is not actually an episode title.
  const isEpTitle = (t: string) => /^episode\s+\d+/i.test(t);
  const rawTitle = background.title || scriptData.title || '';
  const safeTitle = (rawTitle && !isEpTitle(rawTitle)) ? rawTitle : 'Untitled';

  const meta: SeriesMeta = {
    // Story core
    title: safeTitle,
    outline: background.outline || aiAnalysis?.generatedOutline || undefined,
    logline: aiAnalysis?.logline || undefined,
    themes: background.themes || undefined,

    // Basic project context
    era: background.era || aiAnalysis?.era || undefined,
    genre: background.genre || aiAnalysis?.genre || undefined,

    // Character system
    characters: scriptData.characters || [],

    // Visual system — directly use the style selected during import
    styleId: importSettings?.styleId,
    recurringLocations: undefined,

    language: scriptData.language || 'English',
  };

  console.log('[populateSeriesMeta] Series metadata built:', {
    title: meta.title,
    characters: meta.characters.length,
    hasOutline: !!meta.outline,
    hasLogline: !!meta.logline,
  });

  return meta;
}

// ==================== 2. AI Context Summary ====================

/**
 * Build a compact AI context summary from SeriesMeta.
 * Used as injected context for all AI system prompts.
 */
export function buildSeriesContextSummary(meta: SeriesMeta | null): string {
  if (!meta) return '';

  const parts: string[] = [];

  // Basic info line
  const infoLine = [
    `Work: ${meta.title}`,
    meta.era || '',
    meta.genre || '',
  ].filter(Boolean).join(', ');
  parts.push(`[Series Context] ${infoLine}`);

  // Central conflict
  if (meta.centralConflict) {
    parts.push(`Central Conflict: ${meta.centralConflict}`);
  }

  // Character list (compact form)
  if (meta.characters.length > 0) {
    const charSummary = meta.characters
      .slice(0, 15) // Limit to 15 to avoid excessive prompt length
      .map(c => {
        const info = [c.name];
        if (c.appearance) info.push(c.appearance.substring(0, 40));
        return info.join(',');
      })
      .join('; ');
    parts.push(`Characters: ${charSummary}`);
  }

  return parts.join('\n');
}

// ==================== 3. Calibration Write-Back ====================

export type CalibrationSyncType = 'character' | 'scene' | 'shot';

/**
 * Write calibration results back into SeriesMeta.
 *
 * @param meta Current SeriesMeta
 * @param syncType Calibration type
 * @param results Calibration result data
 * @returns Updated partial SeriesMeta for updateSeriesMeta
 */
export function syncToSeriesMeta(
  meta: SeriesMeta,
  syncType: CalibrationSyncType,
  results: {
    characters?: ScriptCharacter[];
    scenes?: ScriptScene[];
  }
): Partial<SeriesMeta> {
  const updates: Partial<SeriesMeta> = {};

  switch (syncType) {
    case 'character': {
      // After character calibration: write back only the minimal character prompt.
      if (results.characters?.length) {
        const updatedChars = meta.characters.map(existing => {
          const calibrated = results.characters!.find(c =>
            c.id === existing.id || c.name === existing.name ||
            c.name.includes(existing.name) || existing.name.includes(c.name)
          );
          if (!calibrated) return existing;

          // Only write back fields produced by AI calibration; do not overwrite manual edits.
          return {
            ...existing,
            characterPrompt: calibrated.characterPrompt || existing.characterPrompt,
            // Fill base fields only when they were previously empty.
            appearance: existing.appearance || calibrated.appearance,
          };
        });
        updates.characters = updatedChars;
        console.log(`[syncToSeriesMeta:character] Wrote back ${results.characters.length} character calibration results`);
      }
      break;
    }

    case 'scene': {
      // After scene calibration: detect recurring locations (appearing in >= 2 episodes).
      if (results.scenes?.length) {
        // Recurring scenes: episodeNumbers >= 2
        const recurring = results.scenes.filter(s =>
          s.episodeNumbers && s.episodeNumbers.length >= 2
        );
        if (recurring.length > 0) {
          const existingNames = new Set(
            (meta.recurringLocations || []).map(l => l.name)
          );
          const newRecurring = recurring.filter(s =>
            !existingNames.has(s.name)
          );
          if (newRecurring.length > 0) {
            updates.recurringLocations = [
              ...(meta.recurringLocations || []),
              ...newRecurring,
            ];
            console.log(`[syncToSeriesMeta:scene] Added ${newRecurring.length} recurring scenes`);
          }
        }
      }
      break;
    }

    case 'shot':
      break;
  }

  return updates;
}
