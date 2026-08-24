/**
 * Clip lengths a Google Flow video model can actually produce.
 *
 * Veo 3.1 only has 4s/6s/8s keys; Gemini Omni Flash adds 10s
 * (`abra_i2v_10s`). Offering 10s while a Veo model is bound would silently
 * fall back to 8s at the runtime, so the selectors hide it instead.
 */

import type { VideoLength } from '@/features/video-studio/types/script';

const VEO_LENGTHS: VideoLength[] = [4, 6, 8];
const OMNI_LENGTHS: VideoLength[] = [4, 6, 8, 10];

export function isOmniFlashModel(model: string | undefined): boolean {
  const canonical = (model || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return canonical.includes('omni') || canonical.startsWith('abra');
}

/**
 * Lengths available for the currently bound video models. With several models
 * bound the runtime round-robins between them, so 10s is only offered when
 * every one of them supports it.
 */
export function supportedVideoLengths(models: string[]): VideoLength[] {
  return models.length > 0 && models.every(isOmniFlashModel) ? OMNI_LENGTHS : VEO_LENGTHS;
}

/** Model ids bound to video generation, e.g. `["<providerId>:Gemini_Omni_Flash"]`. */
export function modelsFromBindings(bindings: string | string[] | null | undefined): string[] {
  const list = typeof bindings === 'string' ? [bindings] : bindings || [];
  return list
    .map((binding) => {
      const separator = binding.indexOf(':');
      return separator > 0 ? binding.slice(separator + 1) : '';
    })
    .filter(Boolean);
}
