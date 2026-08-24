export const GOOGLE_FLOW_IMAGE_MODELS: Record<string, string> = {
  GEM_PIX_2: 'GEM_PIX_2',
  NARWHAL: 'NARWHAL',
  Nano_Banana_Pro: 'GEM_PIX_2',
  Nano_Banana_2: 'NARWHAL',
};

// Captured from a real Flow request: Omni Flash + start image, portrait, 720p,
// POST /v1/video:batchAsyncGenerateVideoStartImage with videoModelKey
// 'abra_i2v_4s' ('abra' is Flow's internal codename for the Omni family).
// Unlike the Veo keys, every duration keeps its suffix — Flow offers 4s, 6s,
// 8s and 10s, and only the trailing number changes.
// Start+end image reuses the same key: the mode is carried by the endpoint
// (...StartAndEndImage), and LITE_LOW_PRIORITY below already shares one key
// across both modes. Reference images are a different key family though —
// Veo switches from veo_3_1_i2v_* to veo_3_1_r2v_* — and no abra r2v key has
// been observed, so that mode is rejected rather than guessed.
const OMNI_FLASH_DURATIONS = new Set([4, 6, 8, 10]);

function omniFlashModel(duration: number | undefined): string {
  return `abra_i2v_${duration && OMNI_FLASH_DURATIONS.has(duration) ? duration : 8}s`;
}

const VIDEO_MODELS = {
  LITE_LOW_PRIORITY: {
    frame: {
      4: 'veo_3_1_i2v_s_lite_4s_low_priority',
      6: 'veo_3_1_i2v_s_lite_6s_low_priority',
      8: 'veo_3_1_i2v_lite_low_priority',
    },
    startEnd: {
      4: 'veo_3_1_i2v_s_lite_4s_low_priority',
      6: 'veo_3_1_i2v_s_lite_6s_low_priority',
      8: 'veo_3_1_i2v_lite_low_priority',
    },
    reference: { landscape: 'veo_3_1_r2v_fast_landscape_ultra_relaxed', portrait: 'veo_3_1_r2v_fast_landscape_ultra_relaxed' },
  },
  FAST: {
    frame: {
      4: 'veo_3_1_i2v_s_fast_4s',
      6: 'veo_3_1_i2v_s_fast_6s',
      8: 'veo_3_1_i2v_s_fast',
    },
    startEnd: {
      4: 'veo_3_1_i2v_s_fast_4s_fl',
      6: 'veo_3_1_i2v_s_fast_6s_fl',
      8: 'veo_3_1_i2v_s_fast_fl',
    },
    reference: { landscape: 'veo_3_1_r2v_fast', portrait: 'veo_3_1_r2v_fast_portrait' },
  },
  LITE: {
    frame: {
      4: 'veo_3_1_i2v_s_lite_4s',
      6: 'veo_3_1_i2v_s_lite_6s',
      8: 'veo_3_1_i2v_s_lite',
    },
    startEnd: {
      4: 'veo_3_1_i2v_s_lite_4s_fl',
      6: 'veo_3_1_i2v_s_lite_6s_fl',
      8: 'veo_3_1_i2v_s_lite_fl',
    },
    reference: { landscape: 'veo_3_1_r2v_lite', portrait: 'veo_3_1_r2v_lite_portrait' },
  },
} as const;

/**
 * Whether a request explicitly asks for Omni Flash. The tier fallback below
 * only ever lands on a Veo profile, so the requested name settles it.
 * Callers need this before resolving a key, to pick the generation mode.
 */
export function isOmniFlashRequest(requestedModel: string | undefined): boolean {
  const canonical = (requestedModel || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return canonical === 'gemini_omni_flash' || canonical === 'omni_flash' || canonical.startsWith('abra');
}

function resolveRequestedProfile(requestedModel: string | undefined, accountTier: string | undefined) {
  const normalized = (requestedModel || '').toLowerCase();
  const canonical = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (isOmniFlashRequest(requestedModel)) {
    return 'OMNI_FLASH' as const;
  }
  if (
    canonical.includes('lite_lower_priority')
    || canonical.includes('lite_low_priority')
    || canonical.includes('ultra_relaxed')
  ) {
    return 'LITE_LOW_PRIORITY' as const;
  }
  if (
    canonical.includes('lite')
  ) {
    return 'LITE' as const;
  }
  if (
    canonical.includes('fast')
  ) {
    return 'FAST' as const;
  }
  return accountTier === 'PAYGATE_TIER_ONE' ? 'FAST' as const : 'LITE_LOW_PRIORITY' as const;
}

export function flowImageRatio(ratio: string): string {
  if (ratio === '16:9' || ratio === '4:3' || ratio === '3:2' || ratio === '21:9') return 'IMAGE_ASPECT_RATIO_LANDSCAPE';
  if (ratio === '1:1') return 'IMAGE_ASPECT_RATIO_SQUARE';
  return 'IMAGE_ASPECT_RATIO_PORTRAIT';
}

export function flowVideoRatio(ratio: string): 'VIDEO_ASPECT_RATIO_LANDSCAPE' | 'VIDEO_ASPECT_RATIO_PORTRAIT' {
  return ratio === '9:16' || ratio === '3:4' || ratio === '2:3'
    ? 'VIDEO_ASPECT_RATIO_PORTRAIT'
    : 'VIDEO_ASPECT_RATIO_LANDSCAPE';
}

/** Endpoint serving each generation mode. */
export function flowVideoEndpoint(mode: 'frame' | 'startEnd' | 'reference'): string {
  if (mode === 'reference') return '/v1/video:batchAsyncGenerateVideoReferenceImages';
  if (mode === 'startEnd') return '/v1/video:batchAsyncGenerateVideoStartAndEndImage';
  return '/v1/video:batchAsyncGenerateVideoStartImage';
}

export function resolveFlowVideoModel(
  tier: string | undefined,
  mode: 'frame' | 'startEnd' | 'reference',
  ratio: string,
  requestedModel?: string,
  requestedDuration?: number,
): string {
  const profile = resolveRequestedProfile(requestedModel, tier);
  if (profile === 'OMNI_FLASH') {
    if (mode === 'reference') {
      throw new Error('Gemini Omni Flash does not support reference images. Pick a Veo 3.1 model for reference-to-video.');
    }
    return omniFlashModel(requestedDuration);
  }
  const orientation = flowVideoRatio(ratio) === 'VIDEO_ASPECT_RATIO_PORTRAIT' ? 'portrait' : 'landscape';
  if (mode === 'reference') return VIDEO_MODELS[profile].reference[orientation];
  // Veo has no 10s key, so a 10s request left over from Omni is served as 8s.
  const duration = requestedDuration === 4 || requestedDuration === 6 ? requestedDuration : 8;
  return VIDEO_MODELS[profile][mode][duration];
}
