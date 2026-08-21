/**
 * Source Fingerprint Utility
 * Generates a stable fingerprint/key from an image source URL.
 * Used by Google Flow to track media IDs by source.
 */

/**
 * Generate a fingerprint for a media source URL.
 * For local-image:// paths, uses the filename.
 * For data: URIs, uses a hash of the first portion.
 * For HTTP URLs, uses the URL itself.
 */
export function getSourceFingerprint(source: string): string {
  if (!source) return '';
  
  if (source.startsWith('local-image://')) {
    // Use the filename as key
    return source.replace('local-image://', '').replace(/^.*[\\/]/, '');
  }
  
  if (source.startsWith('data:image/')) {
    // Use first 100 chars of base64 as fingerprint
    return source.slice(0, 100);
  }
  
  // HTTP URLs: use as-is
  return source;
}
