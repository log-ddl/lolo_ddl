/**
 * Browser Image Storage
 * IndexedDB-based image persistence for non-Electron (localhost/browser) environments.
 * Uses the `idb-image://` URL scheme to identify locally stored images.
 */

const DB_NAME = 'lolo-image-storage';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export const IDB_IMAGE_PREFIX = 'idb-image://';

export function isIdbImagePath(path: string): boolean {
  return typeof path === 'string' && path.startsWith(IDB_IMAGE_PREFIX);
}

interface ImageRecord {
  key: string;
  blob: Blob;
  filename: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBlobToBrowserStorage(blob: Blob, filename: string): Promise<string> {
  const key = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const record: ImageRecord = { key, blob, filename, createdAt: Date.now() };
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => { db.close(); resolve(`${IDB_IMAGE_PREFIX}${key}`); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function readBlobFromBrowserStorage(idbUrl: string): Promise<Blob | null> {
  const key = idbUrl.startsWith(IDB_IMAGE_PREFIX) ? idbUrl.slice(IDB_IMAGE_PREFIX.length) : idbUrl;
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => { db.close(); resolve((req.result as ImageRecord | undefined)?.blob ?? null); };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

export async function deleteFromBrowserStorage(idbUrl: string): Promise<void> {
  const key = idbUrl.startsWith(IDB_IMAGE_PREFIX) ? idbUrl.slice(IDB_IMAGE_PREFIX.length) : idbUrl;
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

/**
 * Fetch an HTTP URL or convert a data URL to a Blob, then save to IndexedDB.
 * Returns an `idb-image://` path, or the original URL on failure.
 */
export async function saveImageUrlToBrowser(
  url: string,
  filename: string,
): Promise<string> {
  try {
    let blob: Blob;
    if (url.startsWith('data:')) {
      const [header, base64] = url.split(',', 2);
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
      blob = await resp.blob();
    }
    return await saveBlobToBrowserStorage(blob, filename);
  } catch (e) {
    console.warn('[BrowserImageStorage] Failed to save image, using original URL:', e);
    return url;
  }
}
