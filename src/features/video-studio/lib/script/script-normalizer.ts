/**
 * Script format normalizer.
 *
 * Before parseFullScript runs, this module detects non-standard screenplay formats
 * and inserts structural markers so the parser can reliably extract titles,
 * outlines, character bios, and episode sections.
 *
 * Two-layer strategy:
 * 1. AI-first analysis: use an LLM to understand the structure semantically and fill a missing outline
 * 2. Regex fallback: if AI is unavailable, use hard-coded structural pattern matching
 *
 * Core rules:
 * - Only insert the required structural markers plus AI-generated outline text when needed
 * - Never modify or remove original content
 * - Keep the operation idempotent for already-normalized scripts
 */

import { callFeatureAPI } from '@/features/video-studio/lib/ai/feature-router';
import { SCRIPT_STRUCTURE_ANALYSIS_SYSTEM_PROMPT } from '@/features/video-studio/lib/ai-workflows/prompt-skills';
import { getFeatureConfig } from '@/features/video-studio/lib/ai/feature-router';

/**
 * Preprocess missing line breaks by inserting newlines before structural markers.
 *
 * Screenplays copied from Word, chat apps, or webpages often lose line breaks and collapse into long paragraphs.
 * This function inserts \n before key markers so later line-based regexes can work reliably.
 *
 * Trigger conditions: no line breaks, or average line length > 500 characters.
 * Insertion priority:
 * 1. Episode markers such as chapter/episode headings
 * 2. Numbered structural paragraphs
 * 3. Scene numbers: numeric pairs like 1-1, 2-3
 * 4. Action markers such as bullet lines
 * 5. Dialogue starts that look like character labels
 * 6. Supplemental note markers
 */
export function preprocessLineBreaks(text: string): { text: string; inserted: boolean } {
  const lineCount = text.split('\n').length;
  const avgLineLen = text.length / lineCount;
  
  // Skip text that already has reasonable line breaks.
  if (lineCount > 5 && avgLineLen < 500) {
    return { text, inserted: false };
  }
  
  let result = text;
  
  // 1. Insert line breaks before episode / chapter / act markers.
  result = result.replace(
    /(?<!\n)(?=\*{0,2}(?:Episode\s+\d+|Chapter\s+\d+|Act\s+\d+)[：:]?)/gi,
    '\n'
  );
  
  // 2. Insert line breaks before numbered paragraph markers.
  result = result.replace(
    /(?<!\n)(?=\d+[.)]\s*[A-Za-z][^\n]{2,})/g,
    '\n'
  );
  
  // 3. Insert line breaks before scene numbers like 1-1 or 2-3.
  result = result.replace(
    /(?<!\n)(?<![\d:])(?=\d+-\d+\s+[A-Za-z])/g,
    '\n'
  );
  
  // 4. Insert line breaks before action markers.
  result = result.replace(
    /(?<!\n)(?=(?:[-*•]|Action\s*:))/gi,
    '\n'
  );
  
  // 5. Insert line breaks before dialogue labels.
  // Avoid cutting through attribute labels.
  result = result.replace(
    /(?<!\n)(?<![A-Za-z:])(?=[A-Z][A-Za-z\s]{1,40}[\(][^\)]{0,20}[\)][：:])/g,
    '\n'
  );
  result = result.replace(
    /(?<!\n)(?<![A-Za-z:])(?!Age[：:]|Gender[：:]|Role[：:]|Identity[：:]|Personality[：:])(?=[A-Z][A-Za-z\s]{1,40}[：:])/g,
    '\n'
  );
  
  // 6. Insert line breaks before supplemental note markers.
  result = result.replace(
    /(?<!\n)(?=(?:note|notes|supplement)[：:])/gi,
    '\n'
  );
  
  // 7. Insert line breaks before compressed character-bio entries that are packed into one line.
  result = result.replace(
    /([.!?;])\s*(?=[A-Z][A-Za-z\s]{1,40}[：:]\s*(?:Age[：:]|Gender[：:]|Role[：:]|Identity[：:]))/g,
    '$1\n'
  );
  
  // Cleanup: remove accidental leading line breaks.
  result = result.replace(/^\n+/, '');
  
  const inserted = result !== text;
  if (inserted) {
    const newLineCount = result.split('\n').length;
    console.log(`[preprocessLineBreaks] Inserted line breaks: ${lineCount} lines -> ${newLineCount} lines`);
  }
  
  return { text: result, inserted };
}

export interface NormalizationResult {
  /** Normalized text */
  normalized: string;
  /** Change log for console tracing */
  changes: string[];
  /** AI analysis result used to override parsed era/genre when available */
  aiAnalysis?: ScriptStructureAnalysis;
}

// ============================================================
// AI structure-analysis layer
// ============================================================

/** AI structure-analysis result */
export interface ScriptStructureAnalysis {
  /** Work title */
  title: string;
  /** Era or time setting, such as ancient / modern / republican / future */
  era: string;
  /** Genre, such as wuxia / business / romance */
  genre: string;
  /** Whether the source text already contains an outline or synopsis */
  hasOutline: boolean;
  /** AI-generated outline, filled only when hasOutline = false */
  generatedOutline: string;
  /** Exact source text where the character-description section begins (first 30 characters) */
  characterSectionKeyword: string;
  /** Exact source text where the outline section begins (first 30 characters), or empty */
  outlineSectionKeyword: string;
  // === Series-level metadata extraction (optional) ===
  /** One-line logline */
  logline?: string;
}

/**
 * AI structure analysis: use an LLM to detect title / outline / character / era structure
 * and fill in a missing outline when needed.
 * @returns The analysis result, or null if AI is unavailable or fails.
 */
export async function analyzeScriptStructureWithAI(text: string): Promise<ScriptStructureAnalysis | null> {
  // Check whether AI is available.
  const config = getFeatureConfig('script_analysis');
  if (!config) {
    console.log('[scriptNormalizer] No AI configuration found. Skipping structure analysis.');
    return null;
  }
  
  try {
    const MAX_ANALYSIS_LENGTH = 10000;
    const analysisText = text.length > MAX_ANALYSIS_LENGTH
      ? text.substring(0, MAX_ANALYSIS_LENGTH) + '\n...[remaining content omitted]'
      : text;
    
    // Retry up to 2 times (3 attempts total) to avoid falling back because of transient network errors.
    const MAX_RETRIES = 2;
    let result: string | null = null;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[scriptNormalizer] Retrying AI structure analysis (${attempt}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
        } else {
          console.log('[scriptNormalizer] Calling AI for screenplay structure analysis...');
        }
        result = await callFeatureAPI('script_analysis', SCRIPT_STRUCTURE_ANALYSIS_SYSTEM_PROMPT, analysisText, {
          temperature: 0.1,
          maxTokens: 1024,
        });
        break; // Exit the retry loop on success.
      } catch (e) {
        lastError = e as Error;
        console.warn(`[scriptNormalizer] AI call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, lastError.message);
      }
    }
    
    if (!result) {
      console.warn('[scriptNormalizer] AI structure analysis failed completely. Falling back to regex normalization:', lastError?.message);
      return null;
    }
    
    // Extract JSON, tolerating markdown code blocks and JS object literals.
    let jsonStr = result;
    // 1. Strip markdown code-fence markers.
    jsonStr = jsonStr.replace(/^```(?:json|js|javascript)?\s*/gm, '').replace(/```\s*$/gm, '').trim();
    // 2. Extract the outermost {...} block.
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[scriptNormalizer] AI returned a non-JSON format:', result.substring(0, 200));
      return null;
    }
    jsonStr = jsonMatch[0];
    // 3. Try direct parsing first. If that fails, repair JS object-literal keys into JSON.
    let analysis: ScriptStructureAnalysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      // Add quotes around unquoted keys, e.g. title: -> "title":
      const fixedJson = jsonStr.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      try {
        analysis = JSON.parse(fixedJson);
        console.log('[scriptNormalizer] Repaired JS object-literal format into valid JSON');
      } catch (e2) {
        console.warn('[scriptNormalizer] JSON parsing failed:', (e2 as Error).message, '\nRaw text:', jsonStr.substring(0, 300));
        return null;
      }
    }
    console.log('[scriptNormalizer] AI analysis result:', {
      title: analysis.title,
      era: analysis.era,
      genre: analysis.genre,
      hasOutline: analysis.hasOutline,
      outlineLength: analysis.generatedOutline?.length || 0,
      charKeyword: analysis.characterSectionKeyword?.substring(0, 20),
      logline: analysis.logline?.substring(0, 30),
    });
    
    return analysis;
  } catch (error) {
    console.warn('[scriptNormalizer] AI structure analysis failed. Falling back to regex normalization:', error);
    return null;
  }
}

/**
 * Insert structure markers based on the AI analysis result.
 * Original content remains untouched; only markers and AI-generated outline text are inserted.
 */
export function applyAIAnalysis(text: string, analysis: ScriptStructureAnalysis): NormalizationResult {
  const changes: string[] = [];
  let normalized = text;
  
  const hasTitle = /[《「][^》」]+[》」]/.test(text);
  const hasOutline = /(?:\*{0,2}Outline[：:]\*{0,2}|\[Outline\])/i.test(text);
  const hasCharBios = /(?:\*{0,2}Character Bios[：:]\*{0,2}|\[Character Bios\])/i.test(text);
  
  // === 1. Title ===
  // Make sure the AI title is not actually an episode title like "Episode 1".
  const isEpisodeTitle = analysis.title && /^episode\s+\d+/i.test(analysis.title);
  if (!hasTitle && analysis.title && !isEpisodeTitle) {
    const titlePos = normalized.indexOf(analysis.title);
    // The title should appear near the top of the text.
    if (titlePos !== -1 && titlePos < 200) {
      normalized = normalized.substring(0, titlePos)
        + `《${analysis.title}》`
        + normalized.substring(titlePos + analysis.title.length);
      changes.push(`[AI] Title: 《${analysis.title}》`);
    }
  } else if (isEpisodeTitle) {
    console.warn(`[applyAIAnalysis] AI returned a probable episode title, so it was skipped: "${analysis.title}"`);
  }
  
  // === 2. Character bios ===
  if (!hasCharBios && analysis.characterSectionKeyword) {
    const charPos = normalized.indexOf(analysis.characterSectionKeyword);
    if (charPos !== -1) {
      normalized = normalized.substring(0, charPos)
        + 'Character Bios:\n'
        + normalized.substring(charPos);
      changes.push(`[AI] Character-bio marker inserted before "${analysis.characterSectionKeyword.substring(0, 20)}..."`);
    }
  }
  
  // === 3. Outline ===
  const hasOutlineNow = /(?:\*{0,2}Outline[：:]\*{0,2}|\[Outline\])/i.test(normalized);
  if (!hasOutlineNow) {
    if (!hasOutline && analysis.outlineSectionKeyword) {
      // The original text contains outline content but lacks a standard outline marker.
      const outlinePos = normalized.indexOf(analysis.outlineSectionKeyword);
      if (outlinePos !== -1) {
        normalized = normalized.substring(0, outlinePos)
          + 'Outline:\n'
          + normalized.substring(outlinePos);
        changes.push(`[AI] Outline marker inserted before "${analysis.outlineSectionKeyword.substring(0, 20)}..."`);
      }
    } else {
      // No outline exists in the source text, so insert the AI-generated one.
      const charBiosPos = normalized.search(/(?:\*{0,2}Character Bios[：:]\*{0,2}|\[Character Bios\])/i);
      let outlineContent = (!analysis.hasOutline && analysis.generatedOutline)
        ? analysis.generatedOutline
        : '';
      
      // Clean episode markers inside the generated outline so parseEpisodes does not match them accidentally.
      // Example: "Episode 1: ..." -> "Part 1: ..."
      if (outlineContent) {
        outlineContent = outlineContent.replace(
          /Episode\s+(\d+)([:]?)/gi,
          'Part $1$2'
        );
      }
      
      if (charBiosPos !== -1) {
        normalized = normalized.substring(0, charBiosPos)
          + `Outline:\n${outlineContent}\n\n`
          + normalized.substring(charBiosPos);
        changes.push(outlineContent
          ? `[AI] Outline: generated by AI (${outlineContent.length} chars)`
          : '[AI] Outline marker: inserted an empty outline');
      }
    }
  }
  
  // === 4. Normalize episode markers using the shared regex logic ===
  normalized = normalizeEpisodeMarkers(normalized, changes);
  
  return { normalized, changes, aiAnalysis: analysis };
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Normalize episode markers.
 * Converts forms like chapter/episode aliases into the standard episode marker format.
 */
function normalizeEpisodeMarkers(text: string, changes: string[]): string {
  let normalized = text;
  let changed = false;
  
  // Chapter marker -> standard episode marker
  normalized = normalized.replace(
    /^(\*{0,2})Chapter\s+(\d+)([：:]\s*[^\n]*)?(\*{0,2})$/gim,
    (_match, s1, num, title, s2) => {
      changed = true;
      return `${s1}Episode ${num}${title || ''}${s2}`;
    }
  );
  
  // Act marker -> standard episode marker
  normalized = normalized.replace(
    /^(\*{0,2})Act\s+(\d+)([：:]\s*[^\n]*)?(\*{0,2})$/gim,
    (_match, s1, num, title, s2) => {
      changed = true;
      return `${s1}Episode ${num}${title || ''}${s2}`;
    }
  );
  
  // Episode X / EP.X / EP X -> standard episode marker
  normalized = normalized.replace(
    /^(?:Episode|EP\.?)\s*(\d+)\s*[：:.\-]?\s*([^\n]*)?$/gim,
    (_match, num, title) => {
      changed = true;
      return `Episode ${num}${title ? ': ' + title.trim() : ''}`;
    }
  );
  
  if (changed) {
    changes.push('Episode markers normalized into the standard format');
  }
  
  return normalized;
}
