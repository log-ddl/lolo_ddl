/**
 * Account + model routing for generation started outside AutoPilot.
 *
 * AutoPilot freezes these settings into each job so a running job cannot change
 * mid-flight. The Scenes, Characters and Director panels have no job to freeze
 * into, so they read the same Settings at the moment the button is pressed —
 * but through the same resolver, because an account allowlist, a per-account
 * video-model map and a fallback order must not mean one thing in one panel and
 * something else in another.
 */

import { getFeatureConfig } from '@/features/video-studio/lib/ai/feature-router';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { buildAccountRouting, listKnownOwnerScopeIds, type AccountRouting } from '@/features/video-studio/autopilot/account-routing';
import { buildModelChain } from '@/features/video-studio/autopilot/model-fallback';

export interface SettingsMediaRouting {
  /** Models to try in order, head first. */
  chain: string[];
  routing: AccountRouting;
}

/**
 * The model bound to a feature, but only when that binding is on Google Flow.
 *
 * AutoPilot always generates through Flow, so a binding the user switched to
 * another provider must not seed a Flow request with a model Flow never heard
 * of — it would silently resolve to whatever the account tier defaults to.
 */
export function googleFlowBoundModel(
  feature: 'character_generation' | 'scene_generation' | 'video_generation',
): string | undefined {
  const config = getFeatureConfig(feature);
  return config?.platform === 'googleflow' ? config.model || undefined : undefined;
}

export async function resolveSettingsMediaRouting(
  kind: 'image' | 'video',
  headModel: string,
): Promise<SettingsMediaRouting> {
  const mediaRouting = useVideoStudioSettingsStore.getState().mediaRouting;
  const runtime = window.googleFlowRuntime;
  const routing = buildAccountRouting({
    connectedOwnerScopeIds: runtime ? await listKnownOwnerScopeIds(runtime) : [],
    flowAccounts: mediaRouting.flowAccounts,
    accountVideoModels: mediaRouting.accountVideoModels,
  });
  const chain = buildModelChain(
    headModel,
    kind === 'image' ? mediaRouting.imageModelFallbacks : mediaRouting.videoModelFallbacks,
  );
  // Video models no enabled account owns answer 404, which no retry fixes.
  return { chain: kind === 'video' ? routing.filterVideoChain(chain) : chain, routing };
}
