export const GOOGLE_FLOW_IMAGE_MODELS: Record<string, string> = {
  GEM_PIX_2: 'GEM_PIX_2',
  NARWHAL: 'NARWHAL',
  Nano_Banana_Pro: 'GEM_PIX_2',
  Nano_Banana_2: 'NARWHAL',
};

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

function resolveRequestedProfile(requestedModel: string | undefined, accountTier: string | undefined) {
  const normalized = (requestedModel || '').toLowerCase();
  const canonical = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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

export function resolveFlowVideoModel(
  tier: string | undefined,
  mode: 'frame' | 'startEnd' | 'reference',
  ratio: string,
  requestedModel?: string,
  requestedDuration?: number,
): string {
  const profile = resolveRequestedProfile(requestedModel, tier);
  const orientation = flowVideoRatio(ratio) === 'VIDEO_ASPECT_RATIO_PORTRAIT' ? 'portrait' : 'landscape';
  if (mode === 'reference') return VIDEO_MODELS[profile].reference[orientation];
  const duration = requestedDuration === 4 || requestedDuration === 6 ? requestedDuration : 8;
  return VIDEO_MODELS[profile][mode][duration];
}
