/**
 * Google Flow reference bias
 * Picks a ready Google Flow account that already has media IDs cached for a
 * set of reference image sources (from the Character/Scene libraries), so
 * Director-tab generation routes to that account instead of a random one and
 * avoids an avoidable re-upload.
 */
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { useCharacterLibraryStore } from '@/features/video-studio/stores/character-library-store';
import { useSceneStore } from '@/features/video-studio/stores/scene-store';
import { getSourceFingerprint } from '@/features/video-studio/lib/utils/source-fingerprint';
import type { GoogleFlowStoredMedia } from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

export type GoogleFlowReferenceHint = {
  mediaId: string;
  ownerScopeId: string;
  flowProjectId?: string;
};

export type GoogleFlowReferenceBias = {
  preferredCredentialId?: string;
  hints: Record<string, GoogleFlowReferenceHint>;
};

function lookupMediaByOwnerScope(source: string): Record<string, GoogleFlowStoredMedia> | undefined {
  const fingerprint = getSourceFingerprint(source);
  if (!fingerprint) return undefined;
  const { characters } = useCharacterLibraryStore.getState();
  for (const character of characters) {
    const match = character.googleFlowMediaIdsBySource?.[fingerprint];
    if (match) return match;
  }
  const { scenes } = useSceneStore.getState();
  for (const scene of scenes) {
    const match = scene.googleFlowMediaIdsBySource?.[fingerprint];
    if (match) return match;
  }
  return undefined;
}

/**
 * Given a list of reference image sources, find the ready Google Flow
 * account that already has the most of them cached, and return that
 * account's credentialId plus a per-source media hint for it.
 * Returns an empty result (safe no-op) when nothing is cached yet.
 */
export function resolveGoogleFlowReferenceBias(sources: string[]): GoogleFlowReferenceBias {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  if (!uniqueSources.length) return { hints: {} };

  const readyCredentials = (useGoogleFlowRuntimeStore.getState().status?.credentials || [])
    .filter((credential) => credential.state === 'ready');
  if (!readyCredentials.length) return { hints: {} };

  const bySource = new Map<string, Record<string, GoogleFlowStoredMedia> | undefined>();
  const counts = new Map<string, number>();
  for (const source of uniqueSources) {
    const mediaByOwnerScope = lookupMediaByOwnerScope(source);
    bySource.set(source, mediaByOwnerScope);
    if (!mediaByOwnerScope) continue;
    for (const ownerScopeId of Object.keys(mediaByOwnerScope)) {
      counts.set(ownerScopeId, (counts.get(ownerScopeId) || 0) + 1);
    }
  }
  if (!counts.size) return { hints: {} };

  let bestOwnerScopeId: string | undefined;
  let bestCount = 0;
  for (const credential of readyCredentials) {
    const count = counts.get(credential.ownerScopeId) || 0;
    if (count > bestCount) {
      bestCount = count;
      bestOwnerScopeId = credential.ownerScopeId;
    }
  }
  if (!bestOwnerScopeId || bestCount === 0) return { hints: {} };

  const preferredCredentialId = readyCredentials.find((c) => c.ownerScopeId === bestOwnerScopeId)?.credentialId;
  const hints: Record<string, GoogleFlowReferenceHint> = {};
  for (const source of uniqueSources) {
    const stored = bySource.get(source)?.[bestOwnerScopeId];
    if (stored) hints[source] = { mediaId: stored.mediaId, ownerScopeId: bestOwnerScopeId, flowProjectId: stored.flowProjectId };
  }
  return { preferredCredentialId, hints };
}
