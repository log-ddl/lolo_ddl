/**
 * Visual style presets shared across script, character, scene, and director flows.
 */

export type StyleCategory = 'none' | '3d' | '2d' | 'real' | 'stop_motion';

/**
 * Media type controls how camera/cinematography parameters are translated.
 */
export type MediaType = 'cinematic' | 'animation' | 'stop-motion' | 'graphic';

export interface StylePreset {
  id: string;
  name: string;
  category: StyleCategory;
  mediaType: MediaType;
  prompt: string;
  negativePrompt: string;
  description: string;
  thumbnail: string;
}

const STYLE_NONE: StylePreset = {
  id: 'none',
  name: 'None / Skill Defined',
  category: 'none',
  mediaType: 'cinematic',
  prompt: '',
  negativePrompt: '',
  description: 'Do not inject an app style. Use the prompt, skill, or user-provided style as-is.',
  thumbnail: '',
};

export const VISUAL_STYLE_PRESETS: readonly StylePreset[] = [
  STYLE_NONE,
] as const;

let _customStyleLookup: ((id: string) => StylePreset | undefined) | null = null;

export function registerCustomStyleLookup(fn: (id: string) => StylePreset | undefined) {
  _customStyleLookup = fn;
}

function _findStyle(styleId: string): StylePreset | undefined {
  return VISUAL_STYLE_PRESETS.find(s => s.id === styleId)
    || _customStyleLookup?.(styleId);
}

export const STYLE_CATEGORIES: { id: StyleCategory; name: string; styles: readonly StylePreset[] }[] = [
  { id: 'none', name: 'No App Style', styles: [STYLE_NONE] },
];

export function getStyleById(styleId: string): StylePreset | undefined {
  return _findStyle(styleId);
}

export function getStylePrompt(styleId: string | null | undefined): string {
  if (!styleId) return '';
  const style = _findStyle(styleId);
  return style?.prompt || '';
}

export function getStyleNegativePrompt(styleId: string | null | undefined): string {
  if (!styleId) return '';
  const style = _findStyle(styleId);
  return style?.negativePrompt || '';
}

export function getStyleName(styleId: string): string {
  const style = _findStyle(styleId);
  return style?.name || styleId;
}

export function getStyleThumbnail(styleId: string): string {
  const style = _findStyle(styleId);
  return style?.thumbnail || '';
}

/**
 * Legacy helper: return style tokens as an array.
 * @deprecated Prefer getStylePrompt directly.
 */
export function getStyleTokens(styleId: string): string[] {
  const prompt = getStylePrompt(styleId);
  return prompt
    .replace(/\([^)]*:[0-9.]+\)/g, (match) => match.replace(/:[0-9.]+\)/, ')'))
    .split(',')
    .map(s => s.trim().replace(/^\(|\)$/g, ''))
    .filter(s => s.length > 0)
    .slice(0, 8);
}

export function getStylesByCategory(categoryId: string): StylePreset[] {
  const categoryMap: Record<string, StyleCategory[]> = {
    animation: ['3d', '2d', 'stop_motion'],
    realistic: ['real'],
    none: ['none'],
    '3d': ['3d'],
    '2d': ['2d'],
    real: ['real'],
    stop_motion: ['stop_motion'],
  };

  const targetCategories = categoryMap[categoryId] || [categoryId as StyleCategory];
  return VISUAL_STYLE_PRESETS.filter(s => targetCategories.includes(s.category));
}

export function getStyleDescription(styleId: string): string {
  const style = _findStyle(styleId);
  return style?.description || style?.name || styleId;
}

export function getMediaType(styleId: string | null | undefined): MediaType {
  if (!styleId) return 'cinematic';
  const style = _findStyle(styleId);
  return style?.mediaType ?? 'cinematic';
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  cinematic: 'Cinematic',
  animation: 'Animation',
  'stop-motion': 'Stop Motion',
  graphic: 'Graphic',
};

export type VisualStyleId = typeof VISUAL_STYLE_PRESETS[number]['id'];

export const DEFAULT_STYLE_ID: VisualStyleId = 'none';
