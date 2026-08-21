/**
 * CORS-safe fetch wrapper
 *
 * Detects the runtime automatically:
 * - Electron desktop mode -> use native fetch() directly with no CORS limit
 * - Browser development mode -> proxy through Vite /__api_proxy?url=...
 * - Browser production mode -> use fetch() directly and rely on backend reverse proxying
 */

/** Check whether the app is running inside Electron. */
function isElectron(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window as any).electron
  );
}

/** Check whether the app is running under the Vite dev server. */
function isViteDev(): boolean {
  return import.meta.env?.DEV === true;
}

/**
 * CORS-safe fetch wrapper.
 *
 * In browser development mode, requests are proxied through Vite's
 * `/__api_proxy` middleware so the dev server can forward them without CORS issues.
 *
 * @param url Target URL, same as native fetch.
 * @param init Request options, same as native fetch.
 * @returns Response, same as native fetch.
 */
export async function corsFetch(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const targetUrl = url.toString();

  // Electron and non-dev environments can call the target directly.
  if (isElectron() || !isViteDev()) {
    return fetch(targetUrl, init);
  }

  // Browser development mode routes through the Vite proxy.
  const proxyUrl = `/__api_proxy?url=${encodeURIComponent(targetUrl)}`;

  // Serialize the original headers into x-proxy-headers so the proxy can forward them.
  const proxyHeaders = new Headers(init?.headers);

  // Pack the original headers into a special header that the proxy unpacks.
  const originalHeaders: Record<string, string> = {};
  proxyHeaders.forEach((value, key) => {
    originalHeaders[key] = value;
  });

  const proxyInit: RequestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-proxy-headers': JSON.stringify(originalHeaders),
    },
  };

  return fetch(proxyUrl, proxyInit);
}
