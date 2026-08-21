import type {
  GoogleFlowReferenceSyncResult,
  GoogleFlowReferenceSyncSource,
  GoogleFlowStoredMedia,
} from '@/features/video-studio/packages/ai-core/providers/google-flow/types';
import { getSourceFingerprint } from '@/features/video-studio/lib/utils/source-fingerprint';

export type GoogleFlowReferenceSourceInput = {
  source: string | null | undefined;
  mediaIdsByOwnerScope?: Record<string, GoogleFlowStoredMedia>;
};

async function normalizeReferenceSource(source: string): Promise<string | null> {
  if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('data:image/')) return source;
  if (!source.startsWith('local-image://')) return null;
  const result = await window.imageStorage?.readAsBase64(source);
  if (!result?.success || !result.base64) return null;
  return result.base64.startsWith('data:')
    ? result.base64
    : `data:${result.mimeType || 'image/jpeg'};base64,${result.base64}`;
}

export async function syncGoogleFlowReferenceSources(
  projectId: string,
  rawSources: GoogleFlowReferenceSourceInput[],
  projectTitle?: string,
): Promise<GoogleFlowReferenceSyncResult> {
  if (!window.googleFlowRuntime) throw new Error('Google Flow chỉ hoạt động trong ứng dụng desktop.');
  const uniqueSources = new Map<string, GoogleFlowReferenceSourceInput>();
  for (const item of rawSources) {
    if (!item.source) continue;
    // The Character/Scene stores index Flow media mappings by source
    // fingerprint. Keep the runtime result on that same key so its media IDs
    // can be written back and reused by Director generation.
    const sourceKey = getSourceFingerprint(item.source);
    if (!sourceKey) continue;
    const existing = uniqueSources.get(sourceKey);
    uniqueSources.set(sourceKey, {
      source: item.source,
      mediaIdsByOwnerScope: { ...(existing?.mediaIdsByOwnerScope || {}), ...(item.mediaIdsByOwnerScope || {}) },
    });
  }
  const sources: GoogleFlowReferenceSyncSource[] = [];
  for (const [sourceKey, item] of uniqueSources) {
    const source = await normalizeReferenceSource(item.source!);
    if (source) sources.push({ sourceKey, source, mediaIdsByOwnerScope: item.mediaIdsByOwnerScope });
  }
  if (!sources.length) throw new Error('Không có ảnh tham chiếu hợp lệ để đồng bộ.');
  return window.googleFlowRuntime.syncReferences({ projectId: projectId || 'default-project', projectTitle, sources });
}
