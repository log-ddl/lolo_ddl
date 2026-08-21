import { saveImageToLocal } from '@/features/video-studio/lib/image-storage';

export interface RealImageAsset {
  query: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
  localPath: string;
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  width?: number;
  height?: number;
}

interface CommonsPage {
  index?: number;
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsResponse {
  query?: { pages?: Record<string, CommonsPage> };
}

function extensionForMime(mime: string | undefined): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

async function downloadFromOpenWeb(params: {
  query: string;
  filename: string;
}): Promise<RealImageAsset | null> {
  const storage = window.imageStorage;
  if (!storage?.searchWebImages) return null;
  const candidates = await storage.searchWebImages(params.query, 18);
  const usable = candidates.filter((candidate) => {
    if (!candidate.imageUrl || !candidate.sourcePageUrl) return false;
    if (candidate.width && candidate.width < 700) return false;
    if (candidate.height && candidate.height < 450) return false;
    return true;
  });
  for (let index = 0; index < Math.min(usable.length, 10); index += 1) {
    const candidate = usable[index];
    const result = await storage.saveImage(
      candidate.imageUrl,
      'shots',
      `${params.filename}_web_${index + 1}.jpg`,
      candidate.sourcePageUrl,
    );
    if (!result.success || !result.localPath) continue;
    return {
      query: params.query,
      title: candidate.title || params.query,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourcePageUrl,
      localPath: result.localPath,
    };
  }
  return null;
}

async function downloadFromCommons(params: {
  query: string;
  filename: string;
  signal?: AbortSignal;
}): Promise<RealImageAsset | null> {
  const query = params.query.trim().slice(0, 180);
  if (!query) return null;
  const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('formatversion', '2');
  endpoint.searchParams.set('origin', '*');
  endpoint.searchParams.set('generator', 'search');
  endpoint.searchParams.set('gsrsearch', query);
  endpoint.searchParams.set('gsrnamespace', '6');
  endpoint.searchParams.set('gsrlimit', '12');
  endpoint.searchParams.set('prop', 'imageinfo');
  endpoint.searchParams.set('iiprop', 'url|mime|size');
  endpoint.searchParams.set('iiurlwidth', '1600');

  const response = await fetch(endpoint, { signal: params.signal });
  if (!response.ok) throw new Error(`Wikimedia search failed (${response.status})`);
  const payload = await response.json() as CommonsResponse;
  const pages = Object.values(payload.query?.pages || {})
    .sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  const candidate = pages.find((page) => {
    const info = page.imageinfo?.[0];
    return !!info?.url
      && ['image/jpeg', 'image/png', 'image/webp'].includes(info.mime || '')
      && (info.width || 0) >= 700
      && (info.height || 0) >= 450;
  });
  const info = candidate?.imageinfo?.[0];
  if (!candidate || !info?.url) return null;

  const imageUrl = info.thumburl || info.url;
  const localPath = await saveImageToLocal(
    imageUrl,
    'shots',
    `${params.filename}${extensionForMime(info.mime)}`,
  );
  if (!localPath.startsWith('local-image://')) {
    throw new Error('Unable to save the researched image locally');
  }
  return {
    query,
    title: String(candidate.title || '').replace(/^File:/i, ''),
    imageUrl,
    sourceUrl: info.descriptionurl || info.url,
    localPath,
  };
}

/** Search the broad web first; Wikimedia Commons is a resilient fallback. */
export async function downloadRealImage(params: {
  query: string;
  filename: string;
  signal?: AbortSignal;
}): Promise<RealImageAsset | null> {
  const query = params.query.trim().slice(0, 180);
  if (!query) return null;
  try {
    const webResult = await downloadFromOpenWeb({ ...params, query });
    if (webResult) return webResult;
  } catch {
    // Search engines and source websites may block automation; continue with fallback.
  }
  return downloadFromCommons({ ...params, query });
}
