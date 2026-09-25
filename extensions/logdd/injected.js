/**
 * Injected into MAIN world on labs.google — has access to window.grecaptcha
 * Also intercepts TRPC fetch responses to capture fresh signed media URLs.
 */
const SITE_KEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV';

// ─── TRPC Response Monitor ─────────────────────────────────
// Monkey-patch fetch to intercept TRPC responses containing media URLs.
// Fresh signed GCS URLs are extracted and forwarded to the agent.

const _originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await _originalFetch.apply(this, args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    // Only intercept TRPC calls on labs.google that return project/flow data
    if (url.includes('/fx/api/trpc/') && response.ok) {
      const clone = response.clone();
      clone.text().then(text => {
        if (text.includes('storage.googleapis.com/ai-sandbox-videofx/')) {
          window.dispatchEvent(new CustomEvent('TRPC_MEDIA_URLS', {
            detail: { url, body: text },
          }));
        }
      }).catch(() => {});
    }
  } catch {}
  return response;
};


window.addEventListener('GET_CAPTCHA', async ({ detail }) => {
  const { requestId, pageAction } = detail;
  try {
    await waitForGrecaptcha();
    const token = await mintWidgetCaptcha(pageAction);
    window.dispatchEvent(new CustomEvent('CAPTCHA_RESULT', {
      detail: { requestId, token },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('CAPTCHA_RESULT', {
      detail: { requestId, error: e.message },
    }));
  }
});

function waitForGrecaptcha(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.__fk_hijack?.pristine) return resolve();
      if (window.grecaptcha?.enterprise?.execute && window.grecaptcha?.enterprise?.render) return resolve();
      if (Date.now() - start > timeout) return reject(new Error('grecaptcha not available'));
      setTimeout(check, 200);
    };
    check();
  });
}

async function mintWidgetCaptcha(action) {
  const previous = globalThis.__logddCaptchaTail || Promise.resolve();
  let release;
  globalThis.__logddCaptchaTail = new Promise(resolve => { release = resolve; });
  await previous.catch(() => {});
  try {
    await new Promise(resolve => window.grecaptcha.enterprise.ready(resolve));
    const key = Object.values(globalThis.___grecaptcha_cfg?.clients || {})
      .find(client => typeof client?.sitekey === 'string')?.sitekey || SITE_KEY;
    let widget = globalThis.__logddCaptchaWidget;
    if (!widget || widget.key !== key || !widget.host.isConnected) {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;';
      document.documentElement.appendChild(host);
      try {
        widget = { key, host, id: window.grecaptcha.enterprise.render(host, { sitekey: key, size: 'invisible' }) };
        globalThis.__logddCaptchaWidget = widget;
      } catch (error) { host.remove(); throw error; }
    }

    const targetAction = action;

    // Layer 1: Pristine execute captured by hijack_bypass before Flow x2a trap ran
    const pristine = window.__fk_hijack?.pristine;
    if (typeof pristine === 'function') {
      try {
        const token = await Promise.race([
          pristine(widget.id, { action: targetAction }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('pristine_hang')), 6000)),
        ]);
        if (token) return String(token);
      } catch (e) {
        try {
          const token2 = await Promise.race([
            pristine(key, { action: targetAction }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('pristine_hang')), 6000)),
          ]);
          if (token2) return String(token2);
        } catch (e2) {}
      }
    }

    // Layer 2: Object.assign neuter fallback (intercepts Flow x2a's action: "extension_hijack_detected")
    const _realAssign = Object.assign;
    Object.assign = function (target, ...sources) {
      const result = _realAssign.call(this, target, ...sources);
      if (result && typeof result === 'object' && result.action === 'extension_hijack_detected') {
        result.action = targetAction;
      }
      return result;
    };
    try {
      const token = await Promise.race([
        window.grecaptcha.enterprise.execute(widget.id, { action: targetAction }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('execute_hang')), 8000)),
      ]);
      if (!token) throw new Error('CAPTCHA_FAILED');
      return String(token);
    } finally {
      Object.assign = _realAssign;
    }
  } finally { release(); }
}
