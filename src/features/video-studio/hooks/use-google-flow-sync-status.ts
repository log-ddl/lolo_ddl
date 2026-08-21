import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  GoogleFlowMediaIdsBySource,
  GoogleFlowProjectBinding,
} from '@/features/video-studio/packages/ai-core/providers/google-flow/types';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { getSourceFingerprint } from '@/features/video-studio/lib/utils/source-fingerprint';

export type GoogleFlowSyncScope = {
  ownerScopeId: string;
  flowProjectId?: string;
};

export type GoogleFlowSyncProgress = {
  synced: number;
  total: number;
  missing: number;
};

export function getGoogleFlowSyncProgress(
  sources: Array<string | null | undefined>,
  mediaIdsBySource: GoogleFlowMediaIdsBySource | undefined,
  scopes: GoogleFlowSyncScope[],
): GoogleFlowSyncProgress {
  const uniqueSources = [...new Set(sources.filter((source): source is string => Boolean(source)))];
  const total = uniqueSources.length * scopes.length;
  let synced = 0;

  for (const source of uniqueSources) {
    const byOwner = mediaIdsBySource?.[getSourceFingerprint(source)];
    for (const scope of scopes) {
      const stored = byOwner?.[scope.ownerScopeId];
      if (stored?.mediaId && scope.flowProjectId && stored.flowProjectId === scope.flowProjectId) {
        synced += 1;
      }
    }
  }

  return { synced, total, missing: total - synced };
}

export function useGoogleFlowSyncScopes(projectId: string, enabled: boolean) {
  const status = useGoogleFlowRuntimeStore((state) => state.status);
  const [bindings, setBindings] = useState<GoogleFlowProjectBinding[]>([]);
  const credentialKey = (status?.credentials || [])
    .map((credential) => `${credential.ownerScopeId}:${credential.credentialId}:${credential.state}`)
    .sort()
    .join('|');

  const refreshBindings = useCallback(async () => {
    if (!enabled || !window.googleFlowRuntime) {
      setBindings([]);
      return;
    }
    try {
      setBindings(await window.googleFlowRuntime.listProjectBindings(projectId));
    } catch (error) {
      console.warn('[GoogleFlow] Failed to load project bindings for sync status:', error);
      setBindings([]);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    void refreshBindings();
  }, [credentialKey, refreshBindings]);

  const scopes = useMemo<GoogleFlowSyncScope[]>(() => {
    if (!enabled) return [];
    const activeBindingByOwner = new Map(
      bindings
        .filter((binding) => binding.active)
        .map((binding) => [binding.ownerScopeId, binding] as const),
    );
    const seenOwners = new Set<string>();
    return (status?.credentials || [])
      .filter((credential) => credential.state === 'ready')
      .filter((credential) => {
        if (seenOwners.has(credential.ownerScopeId)) return false;
        seenOwners.add(credential.ownerScopeId);
        return true;
      })
      .map((credential) => ({
        ownerScopeId: credential.ownerScopeId,
        flowProjectId: activeBindingByOwner.get(credential.ownerScopeId)?.flowProjectId,
      }));
  }, [bindings, enabled, status?.credentials]);

  return { scopes, refreshBindings };
}
