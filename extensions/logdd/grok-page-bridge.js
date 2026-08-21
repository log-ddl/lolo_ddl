(function installLogddGrokPageBridge() {
  if (window.__logddGrokPageBridgeInstalled) return;
  window.__logddGrokPageBridgeInstalled = true;
  const COMMAND_CHANNEL = 'LOGDD_GROK_COMMAND_V1';
  const EVENT_CHANNEL = 'LOGDD_GROK_EVENT_V1';
  const CAPTURE_CHANNEL = 'LONGDD_GROK_VIDEO_CAPTURE_PAGE_V1';
  const controllers = new Map();
  const nativeFetch = window.fetch.bind(window);
  const UPLOAD_CACHE_KEY = 'logdd.grok.upload-cache.v2';
  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
  const IMAGE_MIME_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  let latestStatsigId = '';
  let latestStatsigIdAt = 0;
  const STATSIG_FRESH_WINDOW_MS = 30_000;
  const bridgeRequestStatsig = new Map();
  let pendingOfficialVideoRequest = null;
  let uiSubmissionTail = Promise.resolve();
  let latestVideoAvailable;
  let latestVideo720pAvailable;
  let latestQuotaData;
  let latestWeeklyUsagePercent;
  let hardSubmissionBlocked = false;

  function publishUnavailableQuotaStatus() {
    const changed = latestVideoAvailable !== false || latestVideo720pAvailable !== false;
    hardSubmissionBlocked = true;
    latestVideoAvailable = false;
    latestVideo720pAvailable = false;
    if (!changed) return;
    window.postMessage({
      channel: EVENT_CHANNEL,
      type: 'quota-status',
      quota: {
        videoAvailable: false,
        video720pAvailable: false,
        weeklyUsagePercent: typeof latestWeeklyUsagePercent === 'number' ? latestWeeklyUsagePercent : undefined,
        videoWindowSizeSeconds: 0,
        video720pWindowSizeSeconds: 0,
        checkedAt: Date.now(),
      },
    }, window.location.origin);
  }

  function publishQuotaStatus(data) {
    if (!data || typeof data !== 'object') return;
    latestQuotaData = data;
    const weeklyUsageExhausted = Number(latestWeeklyUsagePercent) >= 100;
    latestVideoAvailable = data.video?.available === true && !weeklyUsageExhausted && !hardSubmissionBlocked;
    latestVideo720pAvailable = data.video720p?.available === true && !weeklyUsageExhausted && !hardSubmissionBlocked;
    window.postMessage({
      channel: EVENT_CHANNEL,
      type: 'quota-status',
      quota: {
        videoAvailable: latestVideoAvailable,
        video720pAvailable: latestVideo720pAvailable,
        weeklyUsagePercent: typeof latestWeeklyUsagePercent === 'number' ? latestWeeklyUsagePercent : undefined,
        videoWindowSizeSeconds: Number(data.video?.windowSizeSeconds) || 0,
        video720pWindowSizeSeconds: Number(data.video720p?.windowSizeSeconds) || 0,
        checkedAt: Date.now(),
      },
    }, window.location.origin);
  }

  function readVarint(bytes, start, end) {
    let value = 0;
    let shift = 0;
    let offset = start;
    while (offset < end && shift < 35) {
      const byte = bytes[offset++];
      value += (byte & 0x7f) * (2 ** shift);
      if ((byte & 0x80) === 0) return { value, offset };
      shift += 7;
    }
    return null;
  }

  function decodeWeeklyUsagePercent(bytes) {
    // grpc-web frame: 1 byte flags + 4 byte BE length + protobuf payload.
    if (!(bytes instanceof Uint8Array) || bytes.length < 12 || bytes[0] !== 0) return undefined;
    const frameLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(1, false);
    const frameEnd = Math.min(bytes.length, 5 + frameLength);
    const wrapperTag = readVarint(bytes, 5, frameEnd);
    if (!wrapperTag || (wrapperTag.value >>> 3) !== 1 || (wrapperTag.value & 7) !== 2) return undefined;
    const wrapperLength = readVarint(bytes, wrapperTag.offset, frameEnd);
    if (!wrapperLength) return undefined;
    const configStart = wrapperLength.offset;
    const configEnd = Math.min(frameEnd, configStart + wrapperLength.value);
    let offset = configStart;
    while (offset < configEnd) {
      const tag = readVarint(bytes, offset, configEnd);
      if (!tag) return undefined;
      offset = tag.offset;
      const field = tag.value >>> 3;
      const wire = tag.value & 7;
      if (field === 1 && wire === 5 && offset + 4 <= configEnd) {
        const percent = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getFloat32(0, true);
        return Number.isFinite(percent) && percent >= 0 && percent <= 100 ? percent : undefined;
      }
      if (wire === 0) {
        const skipped = readVarint(bytes, offset, configEnd);
        if (!skipped) return undefined;
        offset = skipped.offset;
      } else if (wire === 1) offset += 8;
      else if (wire === 2) {
        const length = readVarint(bytes, offset, configEnd);
        if (!length) return undefined;
        offset = length.offset + length.value;
      } else if (wire === 5) offset += 4;
      else return undefined;
    }
    return undefined;
  }

  async function refreshWeeklyUsageStatus() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await nativeFetch('/grok_api_v2.GrokBuildBilling/GetGrokCreditsConfig', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/grpc-web+proto',
          'x-grpc-web': '1',
        },
        body: new Uint8Array(5),
        signal: controller.signal,
      });
      if (!response.ok) return;
      const percent = decodeWeeklyUsagePercent(new Uint8Array(await response.arrayBuffer()));
      if (typeof percent !== 'number') return;
      latestWeeklyUsagePercent = percent;
      if (latestQuotaData) publishQuotaStatus(latestQuotaData);
    } finally {
      clearTimeout(timer);
    }
  }

  async function refreshQuotaStatus() {
    // quota_info can still advertise availability while the UI is already
    // blocking generation behind SuperGrok. Keep the stronger UI signal.
    if (getSubmissionBlocker()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await nativeFetch('/rest/media/imagine/quota_info', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });
      if (!response.ok) return;
      publishQuotaStatus(await response.json().catch(() => null));
      await refreshWeeklyUsageStatus().catch(() => {});
    } finally {
      clearTimeout(timer);
    }
  }

  // Grok's anti-bot only accepts an x-statsig-id that Grok's own client code
  // generated recently — not a value we invent, and not an old one reused
  // past its freshness window. Capture the real token from both fetch and XHR
  // calls the page itself makes, with a timestamp so callers can tell whether
  // it is still usable.
  function captureStatsigHeader(value) {
    if (!value) return;
    latestStatsigId = value;
    latestStatsigIdAt = Date.now();
  }

  const observedFetch = function logddObservedFetch(input, init) {
    let requestUrl = '';
    let requestMethod = 'GET';
    try {
      const requestHeaders = input instanceof Request ? input.headers : undefined;
      const headers = new Headers(init?.headers || requestHeaders || undefined);
      requestUrl = input instanceof Request ? input.url : String(input || '');
      requestMethod = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const statsigId = headers.get('x-statsig-id');
      captureStatsigHeader(statsigId);
      const requestId = headers.get('x-xai-request-id');
      if (requestId && statsigId) bridgeRequestStatsig.set(requestId, statsigId);
    } catch { /* keep the page request untouched */ }
    const responsePromise = nativeFetch(input, init);
    try {
      const url = new URL(requestUrl, window.location.origin);
      if (
        requestMethod === 'POST'
        && url.origin === window.location.origin
        && url.pathname === '/rest/media/imagine/quota_info'
      ) {
        responsePromise.then(async (response) => {
          if (!response.ok) return;
          const data = await response.clone().json().catch(() => null);
          publishQuotaStatus(data);
        }).catch(() => {});
      }
      if (
        pendingOfficialVideoRequest
        && requestMethod === 'POST'
        && url.origin === window.location.origin
        && url.pathname === '/rest/app-chat/conversations/new'
      ) {
        const pending = pendingOfficialVideoRequest;
        pendingOfficialVideoRequest = null;
        responsePromise.then(
          (response) => pending.resolve(response.clone()),
          (error) => pending.reject(error),
        );
      }
    } catch { /* this fetch is unrelated to the pending UI submission */ }
    return responsePromise;
  };
  window.fetch = observedFetch;

  const nativeSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function loggdObservedSetRequestHeader(name, value) {
    try { if (String(name).toLowerCase() === 'x-statsig-id') captureStatsigHeader(value); }
    catch { /* keep the page request untouched */ }
    return nativeSetRequestHeader.apply(this, arguments);
  };

  function emit(event) {
    window.postMessage({ channel: EVENT_CHANNEL, type: 'task-event', event }, window.location.origin);
  }

  function emitCapture(request, response) {
    window.postMessage({
      channel: CAPTURE_CHANNEL,
      type: 'network-event',
      payload: {
        schemaVersion: 1,
        providerId: 'grok-video',
        transport: 'logdd-bridge',
        pageUrl: window.location.href,
        startedAt: Date.now(),
        durationMs: 0,
        request,
        response,
      },
    }, window.location.origin);
  }

  function isApiDocumentPath(pathname) {
    return /^\/(?:rest|api|grok_api|grok_api_v2)(?:\/|\.|$)/i.test(pathname || '');
  }

  function randomLowercase(length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return [...bytes].map((value) => String.fromCharCode(97 + (value % 26))).join('');
  }

  function randomAlphaNumeric(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return [...bytes].map((value) => alphabet[value % alphabet.length]).join('');
  }

  // Grok's fetch interceptor evaluates Statsig for every request. If that
  // evaluation is unavailable, the web app sends btoa("x1:" + error). A fresh
  // fallback per request is accepted; reusing an observed ID from another path
  // is rejected by the current anti-bot rules.
  function createStatsigFallbackId() {
    const selector = crypto.getRandomValues(new Uint8Array(1))[0];
    const message = selector % 2 === 0
      ? `x1:TypeError: Cannot read properties of null (reading 'children['${randomAlphaNumeric(5)}']')`
      : `x1:TypeError: Cannot read properties of undefined (reading '${randomLowercase(10)}')`;
    return btoa(message);
  }

  function normalizeAspectRatio(value) {
    return ['16:9', '9:16', '1:1', '2:3', '3:2'].includes(value) ? value : '16:9';
  }

  function normalizeVideoUrl(value) {
    if (!value) return '';
    if (/^https:\/\//i.test(value)) return value;
    return new URL(String(value).replace(/^\/+/, ''), 'https://assets.grok.com/').toString();
  }

  function isVideoUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
      const url = new URL(value, 'https://assets.grok.com/');
      return url.protocol === 'https:' && /\.mp4(?:$|[?#])/i.test(url.href);
    } catch {
      return false;
    }
  }

  function grokPostIdFromPathname(pathname = window.location.pathname) {
    return String(pathname || '').match(/\/imagine\/post\/([0-9a-f-]{36})(?:\/|$)/i)?.[1] || '';
  }

  function grokAssetId(source) {
    if (typeof source !== 'string' || !/^https:\/\/assets\.grok\.com\//i.test(source)) return null;
    const matches = source.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/ig);
    return matches?.at(-1) || null;
  }

  function normalizeAssetUrl(value) {
    if (!value) return '';
    try {
      const url = /^https?:\/\//i.test(value)
        ? new URL(value)
        : new URL(String(value).replace(/^\/+/, ''), 'https://assets.grok.com/');
      return url.protocol === 'https:' && url.hostname === 'assets.grok.com' ? url.toString() : '';
    } catch {
      return '';
    }
  }

  function findAssetUrl(value, seen = new Set()) {
    if (typeof value === 'string') return normalizeAssetUrl(value);
    if (!value || typeof value !== 'object' || seen.has(value)) return '';
    seen.add(value);
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      const found = findAssetUrl(child, seen);
      if (found) return found;
    }
    return '';
  }

  function findAssetId(value, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return '';
    seen.add(value);
    if (!Array.isArray(value)) {
      for (const key of ['assetId', 'fileMetadataId', 'fileId', 'id']) {
        const candidate = value[key];
        if (typeof candidate === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(candidate)) return candidate;
      }
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      const found = findAssetId(child, seen);
      if (found) return found;
    }
    return '';
  }

  function containsStringValue(value, expected, seen = new Set()) {
    if (!expected) return false;
    if (typeof value === 'string') return value === expected;
    if (!value || typeof value !== 'object' || seen.has(value)) return false;
    seen.add(value);
    return (Array.isArray(value) ? value : Object.values(value))
      .some((child) => containsStringValue(child, expected, seen));
  }

  function bytesToBase64(bytes) {
    let result = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      result += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(result);
  }

  function waitFor(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('Cancelled by user', 'AbortError'));
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Cancelled by user', 'AbortError'));
      }, { once: true });
    });
  }

  async function waitForElement(getElement, signal, timeoutMs, errorMessage) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
      const element = getElement();
      if (element) return element;
      await waitFor(150, signal);
    }
    throw new Error(errorMessage);
  }

  function buttonWithText(text) {
    return [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === text) || null;
  }

  function composerEditor() {
    return document.querySelector('[data-testid="chat-input"] [contenteditable="true"][aria-label="Ask Grok anything"]')
      || document.querySelector('[contenteditable="true"][role="textbox"]')
      || null;
  }

  function visibleRemoveImageButtons() {
    return [...document.querySelectorAll('button[aria-label="Remove image"]')]
      .filter((button) => button.getClientRects().length > 0);
  }

  function composerIsClean() {
    const editor = composerEditor();
    return visibleRemoveImageButtons().length === 0
      && (!editor || !(editor.textContent || '').trim());
  }

  async function clearComposer(signal) {
    for (const button of visibleRemoveImageButtons()) button.click();
    const editor = composerEditor();
    if (editor && (editor.textContent || '').trim()) replaceComposerText(editor, '');
    await waitForElement(
      () => composerIsClean() ? document.body : null,
      signal,
      5_000,
      'Grok did not clear the previous generation from the composer',
    );
  }

  async function ensureImagineHome(signal) {
    const blocker = getSubmissionBlocker();
    if (blocker) throw blocker;
    const findBackLink = () => [...document.querySelectorAll('a[href="/imagine"]')]
      .find((link) => link.getClientRects().length > 0) || null;
    const findNewGeneration = () => [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'New Generation' && button.getClientRects().length > 0 && !button.disabled) || null;

    if (window.location.pathname !== '/imagine') {
      const navigationControl = findNewGeneration() || findBackLink();
      if (navigationControl) {
        navigationControl.click();
        await waitFor(300 + Math.floor(Math.random() * 201), signal);
      }
      try {
        await waitForElement(
          () => window.location.pathname === '/imagine' ? document.body : null,
          signal,
          15_000,
          'Grok did not return to the Imagine composer',
        );
      } catch (error) {
        if (signal?.aborted) throw error;
        // Resolve controls again because Grok may have replaced the React DOM
        // after the first click.
        const retryControl = findBackLink() || findNewGeneration();
        if (!retryControl) throw new Error('Grok did not return to the Imagine composer');
        retryControl.click();
        await waitFor(300 + Math.floor(Math.random() * 201), signal);
        await waitForElement(
          () => window.location.pathname === '/imagine' ? document.body : null,
          signal,
          20_000,
          'Grok did not return to the Imagine composer after retry',
        );
      }
    }

    // /imagine can still contain frames or prompt text left by a failed job.
    // Start every job from a clean New Generation state instead of trusting
    // the URL alone.
    if (!composerIsClean()) {
      const newGeneration = findNewGeneration();
      if (newGeneration) {
        newGeneration.click();
        await waitFor(300 + Math.floor(Math.random() * 201), signal);
        try {
          await waitForElement(
            () => window.location.pathname === '/imagine' && composerIsClean() ? document.body : null,
            signal,
            3_000,
            'Grok New Generation did not reset the composer',
          );
        } catch (error) {
          if (signal?.aborted) throw error;
          await clearComposer(signal);
        }
      } else {
        await clearComposer(signal);
      }
    }
    const homeBlocker = getSubmissionBlocker();
    if (homeBlocker) throw homeBlocker;
  }

  async function selectRadioOption(groupLabel, optionText, signal, required = false) {
    let option = null;
    try {
      option = await waitForElement(
      () => {
        const group = document.querySelector(`[role="radiogroup"][aria-label="${groupLabel}"]`);
        const candidates = group
          ? [...group.querySelectorAll('[role="radio"]')]
          : [...document.querySelectorAll('[role="radio"], button')];
        return candidates.find((item) => (
          !item.disabled
          && item.getClientRects().length > 0
          && (item.getAttribute('aria-label') === optionText || item.textContent?.trim() === optionText)
        )) || null;
      },
      signal,
      5_000,
      `Grok UI is missing ${groupLabel}: ${optionText}`,
      );
    } catch (error) {
      if (required) throw error;
      return false;
    }
    if (option.getAttribute('aria-checked') !== 'true') option.click();
    return true;
  }

  async function selectAspectRatio(aspectRatio, signal) {
    const normalized = normalizeAspectRatio(aspectRatio);
    const ratioPattern = /^(?:16:9|9:16|1:1|2:3|3:2)$/;
    const findTrigger = () => [...document.querySelectorAll('button')].find((button) => (
      !button.disabled
      && button.getClientRects().length > 0
      && (
        button.getAttribute('aria-label') === 'Aspect Ratio'
        || ratioPattern.test(button.textContent?.trim() || '')
      )
    )) || null;
    // Best-effort: if Grok's ratio selector can't be found/driven (UI variant,
    // render race, ...), don't fail the whole generation — fall back to the
    // composer's current ratio. Only a real user cancel propagates.
    try {
      const trigger = await waitForElement(findTrigger, signal, 5_000, 'aspect-ratio selector not found');
      if (trigger.textContent?.includes(normalized)) return true;
      trigger.click();
      // Match the ratio tolerantly: Grok's menu items render the value in a few
      // different shapes across UI versions ("16:9", "16 : 9", "16:9 Landscape",
      // an aria-label, etc.), so look at both text and aria-label with spaces
      // stripped, across the common option/menuitem/radio roles and plain
      // buttons — startsWith on textContent alone was too strict.
      const compact = (value) => (value || '').replace(/\s+/g, '');
      const wanted = compact(normalized);
      const option = await waitForElement(
        () => [...document.querySelectorAll('[role="menuitem"], [role="option"], [role="radio"], button, [data-value]')].find((item) => {
          if (item.getClientRects().length === 0) return false;
          const haystack = `${compact(item.textContent)} ${compact(item.getAttribute('aria-label'))} ${compact(item.getAttribute('data-value'))}`;
          return haystack.includes(wanted);
        }) || null,
        signal,
        5_000,
        `aspect ratio ${normalized} not found`,
      );
      option.click();
      await waitForElement(
        () => findTrigger()?.textContent?.includes(normalized) ? findTrigger() : null,
        signal,
        5_000,
        `aspect ratio ${normalized} not applied`,
      );
      return true;
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw error;
      return false;
    }
  }

  function replaceComposerText(editor, text) {
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);
    const inserted = document.execCommand('insertText', false, text);
    if (!inserted) {
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
  }

  async function normalizeImageAspectRatio(image, aspectRatio, signal) {
    const targetRatios = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1, '3:2': 3 / 2, '2:3': 2 / 3 };
    const targetRatio = targetRatios[normalizeAspectRatio(aspectRatio)];
    if (!targetRatio) return image;
    if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
    const bitmap = await createImageBitmap(new Blob([image.bytes], { type: image.mimeType }));
    try {
      const sourceRatio = bitmap.width / bitmap.height;
      // Keep the original bytes when the geometry is already within 1.5% of
      // the requested ratio, avoiding an unnecessary lossy re-encode.
      if (Math.abs(sourceRatio - targetRatio) / targetRatio <= 0.015) return image;

      let sourceWidth = bitmap.width;
      let sourceHeight = sourceWidth / targetRatio;
      if (sourceHeight > bitmap.height) {
        sourceHeight = bitmap.height;
        sourceWidth = sourceHeight * targetRatio;
      }
      const sourceX = (bitmap.width - sourceWidth) / 2;
      const sourceY = (bitmap.height - sourceHeight) / 2;
      const maxEdge = 1920;
      const outputWidth = targetRatio >= 1
        ? Math.max(2, Math.min(maxEdge, Math.round(sourceWidth)))
        : Math.max(2, Math.round(Math.min(maxEdge, sourceHeight) * targetRatio));
      const outputHeight = targetRatio >= 1
        ? Math.max(2, Math.round(outputWidth / targetRatio))
        : Math.max(2, Math.min(maxEdge, Math.round(sourceHeight)));
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Grok image ratio conversion could not create a canvas context');
      context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Grok image ratio conversion failed')), 'image/webp', 0.95);
      });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('Ảnh sau khi đổi tỷ lệ Grok phải nhỏ hơn 20 MB');
      return { bytes, mimeType: 'image/webp', base64: bytesToBase64(bytes) };
    } finally {
      bitmap.close();
    }
  }

  function attachedComposerPreviews() {
    return visibleRemoveImageButtons()
      .map((button) => button.parentElement?.querySelector('img'))
      .filter(Boolean);
  }

  async function clearComposerImages(signal) {
    const buttons = visibleRemoveImageButtons();
    if (!buttons.length) return;
    for (const button of buttons) button.click();
    await waitForElement(
      () => visibleRemoveImageButtons().length === 0 ? document.body : null,
      signal,
      5_000,
      'Grok did not remove the previous composer image',
    );
    // Let React commit the removal before we re-attach.
    await waitFor(200 + Math.floor(Math.random() * 151), signal);
  }

  async function attachImagesToComposer(sources, requestId, taskId, aspectRatio, signal) {
    const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
    if (!list.length) return;
    const input = await waitForElement(
      () => document.querySelector('input[type="file"][name="files"]')
        || [...document.querySelectorAll('input[type="file"]')].find((item) => /image/i.test(item.accept || ''))
        || null,
      signal,
      10_000,
      'Grok UI is missing the image upload input',
    );
    // Prepare the files once so a retry does not re-read. Upload the image
    // exactly as-is — no cropping/re-encoding. Grok derives the output video
    // ratio from the image's own geometry, so the original frame is preserved.
    const prepared = [];
    for (const source of list) {
      const image = await readUploadImage(source, signal);
      const extension = IMAGE_MIME_EXTENSIONS[image.mimeType];
      prepared.push(new File([image.bytes], `logdd-${crypto.randomUUID()}.${extension}`, { type: image.mimeType }));
    }

    // Attach exactly `list.length` frames. A stale image left in the composer
    // from a previous job would otherwise sit alongside the new one, and Grok
    // reads two images as start+end frames and fires a second, unwanted video.
    // So: clear anything present, attach, then confirm the count matches — if
    // an extra slips in, clear and retry once.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await clearComposerImages(signal);

      // Grok's composer input is name="files" (multi-file), so a start frame and
      // an optional end frame go in together, in order, via a single DataTransfer.
      const files = new DataTransfer();
      for (const file of prepared) files.items.add(file);
      input.files = files.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      emit({ requestId, taskId, status: 'uploading', progress: 5 });

      let outcome = 'timeout';
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
        const previews = attachedComposerPreviews();
        if (previews.length > list.length) { outcome = 'too-many'; break; }
        if (previews.length === list.length
          && previews.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) {
          outcome = 'ok';
          break;
        }
        await waitFor(150, signal);
      }

      if (outcome === 'ok') {
        // The preview can decode before Grok commits its internal attachment
        // state. Give React a short randomized settling window before submit.
        await waitFor(500 + Math.floor(Math.random() * 501), signal);
        return;
      }
      if (attempt === 1) {
        throw new Error(outcome === 'too-many'
          ? 'Grok giữ lại ảnh của lần tạo trước — không thể gắn đúng số khung hình'
          : 'Grok did not finish attaching the uploaded image');
      }
      // Retry: clearComposerImages at the top of the next loop removes the extra.
    }
  }

  function getSubmissionBlocker() {
    const visibleDialogs = [...document.querySelectorAll('[role="dialog"]')]
      .filter((dialog) => dialog.getClientRects().length > 0);
    const upgradeDialog = visibleDialogs.find((dialog) => (
      /Upgrade to SuperGrok|Claim offer/i.test(dialog.textContent || '')
    ));
    // Grok's current Usage screen no longer always shows the old SuperGrok
    // upgrade dialog. At the weekly cap it shows a normal settings dialog with
    // "Weekly limit reached" and an "Imagine 100%" meter instead. quota_info
    // can still report available=true in this state, so the visible Usage
    // result is the stronger signal.
    const exhaustedUsageDialog = visibleDialogs.find((dialog) => {
      const text = dialog.textContent || '';
      return /Weekly limit reached|You hit your weekly limit/i.test(text)
        || /Imagine\s*100%/i.test(text);
    });
    if (window.location.hash === '#subscribe' || upgradeDialog || exhaustedUsageDialog) {
      if (exhaustedUsageDialog) latestWeeklyUsagePercent = 100;
      publishUnavailableQuotaStatus();
      return new Error(exhaustedUsageDialog
        ? 'Grok quota exhausted: weekly Imagine usage reached 100%'
        : 'Grok quota exhausted: account requires an Upgrade to SuperGrok before creating another video');
    }
    return null;
  }

  function waitForOfficialVideoResponse(signal) {
    if (pendingOfficialVideoRequest) throw new Error('Another Grok UI submission is already pending');
    return new Promise((resolve, reject) => {
      const pending = { resolve: null, reject: null };
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        clearInterval(blockerTimer);
        signal?.removeEventListener('abort', onAbort);
        if (pendingOfficialVideoRequest === pending) pendingOfficialVideoRequest = null;
      };
      const settle = (callback) => (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback(value);
      };
      const onAbort = () => {
        settle(reject)(new DOMException('Cancelled by user', 'AbortError'));
      };
      const timer = setTimeout(() => {
        settle(reject)(new Error('Grok UI did not submit a video request within 45 seconds'));
      }, 45_000);
      const blockerTimer = setInterval(() => {
        const blocker = getSubmissionBlocker();
        if (blocker) settle(reject)(blocker);
      }, 250);
      pending.resolve = settle(resolve);
      pending.reject = settle(reject);
      pendingOfficialVideoRequest = pending;
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  async function submitThroughGrokUi(payload, requestId, taskId, signal) {
    const previousSubmission = uiSubmissionTail;
    let releaseSubmission = () => {};
    uiSubmissionTail = new Promise((resolve) => { releaseSubmission = resolve; });
    await previousSubmission;
    try {
      await ensureImagineHome(signal);
      if (latestVideoAvailable === false || latestVideo720pAvailable === false) {
        throw new Error('Grok quota exhausted: this account has no 720p video generations remaining');
      }
      await selectRadioOption('Generation mode', 'Video', signal, true);
      // Video Studio is intentionally 720p-only. Never silently lower output
      // quality to 480p when the current account has exhausted its 720p quota.
      await selectRadioOption('Video resolution', '720p', signal, true);
      // Grok offers only 6s and 10s. Map the requested length so anything from
      // 8s up rounds to 10s (previously it needed a full 10 to pick 10s, so an
      // 8s request wrongly fell back to 6s).
      const duration = Number(payload.duration) >= 8 ? '10s' : '6s';
      await selectRadioOption('Video duration', duration, signal);

      // First frame + optional last frame (frame-linking). Grok accepts both
      // images in its composer; order is start then end.
      const frameSources = [payload.startImage?.source, payload.endImage?.source].filter(Boolean);
      if (frameSources.length) {
        // Image-to-video: Grok derives the output ratio from the input image,
        // and attachImagesToComposer already crops each frame to the requested
        // ratio — so the UI ratio picker is redundant here. Driving it was also
        // the source of the intermittent "Grok UI does not support aspect
        // ratio" failures, so we skip it entirely for image-to-video.
        await attachImagesToComposer(frameSources, requestId, taskId, payload.aspectRatio, signal);
      } else {
        // Text-to-video: there is no image to derive the ratio from, so set it
        // explicitly via the composer's selector.
        await selectAspectRatio(payload.aspectRatio, signal);
      }

      const editor = await waitForElement(
        composerEditor,
        signal,
        10_000,
        'Grok UI is missing the prompt editor',
      );
      replaceComposerText(editor, String(payload.prompt || '').trim());

      const findReadySubmit = () => {
        const form = editor.closest('form');
        const candidates = [...(form || document).querySelectorAll('button')];
        const button = candidates.find((item) => (
          item.getClientRects().length > 0
          && (
            ['Submit', 'Make video', 'Generate'].includes(item.getAttribute('aria-label') || '')
            || item.type === 'submit'
          )
        ));
        return button && !button.disabled ? button : null;
      };
      // Wait until uploaded frames are fully accepted first. Grok may reset the
      // composer ratio from the source image while processing an upload, so the
      // requested ratio must be selected only after that work has settled.
      await waitForElement(
        findReadySubmit,
        signal,
        30_000,
        'Grok UI did not finish preparing the video submission',
      );
      if (!frameSources.length) await selectAspectRatio(payload.aspectRatio, signal);
      // Uploading a frame can re-render the Grok composer. Re-assert the only
      // mode Video Studio supports immediately before resolving Submit.
      await selectRadioOption('Generation mode', 'Video', signal, true);
      await selectRadioOption('Video resolution', '720p', signal, true);
      // Ratio selection can re-render the composer. Resolve the final submit
      // button again so the click always targets the current UI instance.
      const submit = await waitForElement(
        findReadySubmit,
        signal,
        5_000,
        'Grok UI did not keep the video submission ready after applying the aspect ratio',
      );
      // The mode/resolution re-assert above can itself re-render the composer.
      // Re-check the attached frame count right before the click — attaching
      // already retries once on a mismatch, but nothing re-verified the count
      // after that point, so confirm it one last time instead of trusting it.
      if (frameSources.length) {
        const finalPreviews = attachedComposerPreviews();
        if (finalPreviews.length !== frameSources.length) {
          throw new Error('Grok composer image count changed before submit — aborting to avoid a corrupted job');
        }
      }
      const previousPostId = grokPostIdFromPathname();
      const responsePromise = waitForOfficialVideoResponse(signal);
      emit({ requestId, taskId, status: 'submitting', progress: frameSources.length ? 10 : 2 });
      submit.click();
      const response = await responsePromise;
      // Grok navigates to the source post immediately after accepting the UI
      // submission. Capture that task-local id before releasing the composer
      // lock: another lane is then free to navigate this same tab elsewhere,
      // while this task can keep tracking its own result via /post/get.
      let submittedPostId = '';
      const postIdDeadline = Date.now() + 5_000;
      while (Date.now() < postIdDeadline) {
        const currentPostId = grokPostIdFromPathname();
        if (currentPostId && currentPostId !== previousPostId) {
          submittedPostId = currentPostId;
          break;
        }
        await waitFor(100, signal);
      }
      return { response, submittedPostId };
    } catch (error) {
      // Keep the serialized submission lock until recovery finishes, so the
      // next batch item cannot enter a dirty result/error composer.
      try {
        await ensureImagineHome(undefined);
      } catch (recoveryError) {
        console.warn('[logdd-grok] failed to restore New Generation after task error:', recoveryError);
      }
      throw error;
    } finally {
      releaseSubmission();
    }
  }

  function isStatsigFresh() {
    return Boolean(latestStatsigId) && (Date.now() - latestStatsigIdAt) <= STATSIG_FRESH_WINDOW_MS;
  }

  // Give the page's own code up to 8s to produce a fresh real token (it may
  // already be mid-flight, or fire one on its own polling/analytics cadence).
  // Returns '' if nothing fresh shows up in time.
  async function getFreshStatsigId(signal, maxWaitMs = 8000) {
    if (isStatsigFresh()) return latestStatsigId;
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      await waitFor(300, signal);
      if (isStatsigFresh()) return latestStatsigId;
    }
    return isStatsigFresh() ? latestStatsigId : '';
  }

  function decodeBase64(value) {
    const cleaned = String(value || '').replace(/\s+/g, '');
    let binary;
    try { binary = atob(cleaned); }
    catch { throw new Error('Ảnh đầu vào Grok không phải base64 hợp lệ'); }
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  async function readUploadImage(source, signal) {
    if (/^data:/i.test(source)) {
      const match = source.match(/^data:([^;,]+);base64,([\s\S]+)$/i);
      if (!match) throw new Error('Grok chỉ nhận ảnh data URL dạng base64');
      const mimeType = match[1].toLowerCase();
      if (!IMAGE_MIME_EXTENSIONS[mimeType]) throw new Error(`Grok chưa hỗ trợ định dạng ảnh ${mimeType}`);
      const bytes = decodeBase64(match[2]);
      if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('Ảnh đầu vào Grok phải nhỏ hơn 20 MB');
      return { bytes, mimeType, base64: match[2].replace(/\s+/g, '') };
    }

    if (!/^https:\/\//i.test(source)) {
      throw new Error('Ảnh đầu vào Grok phải là ảnh đã lưu trong ứng dụng, data URL hoặc HTTPS URL');
    }
    const response = await nativeFetch(source, { signal, credentials: 'omit' });
    if (!response.ok) throw new Error(`Không thể tải ảnh đầu vào Grok (HTTP ${response.status})`);
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_UPLOAD_BYTES) throw new Error('Ảnh đầu vào Grok phải nhỏ hơn 20 MB');
    const mimeType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_MIME_EXTENSIONS[mimeType]) throw new Error(`Grok chưa hỗ trợ định dạng ảnh ${mimeType || 'không xác định'}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('Ảnh đầu vào Grok phải nhỏ hơn 20 MB');
    return { bytes, mimeType, base64: bytesToBase64(bytes) };
  }

  async function imageCacheKey(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  }

  function readUploadCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(UPLOAD_CACHE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeUploadCache(cache) {
    try {
      const entries = Object.entries(cache)
        .sort((left, right) => Number(right[1]?.savedAt || 0) - Number(left[1]?.savedAt || 0))
        .slice(0, 100);
      localStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch { /* cache is optional */ }
  }

  async function uploadImage(source, requestId, taskId, signal) {
    const existingId = grokAssetId(source);
    if (existingId) return { assetId: existingId, assetUrl: source };

    emit({ requestId, taskId, status: 'uploading', progress: 3 });
    const image = await readUploadImage(source, signal);
    const cacheKey = await imageCacheKey(image.bytes);
    const cache = readUploadCache();
    const cached = cache[cacheKey];
    if (cached?.assetId) {
      emit({ requestId, taskId, status: 'uploading', progress: 7 });
      return { assetId: cached.assetId, assetUrl: cached.assetUrl || '' };
    }

    const extension = IMAGE_MIME_EXTENSIONS[image.mimeType];
    const fileName = `logdd-${cacheKey.slice(0, 16)}.${extension}`;
    // Do not filter this list to image/webp. Direct upload v2 preserves PNG and
    // JPEG uploads, while Grok's UI shows every supported image type together.
    // Filtering to WebP made successful logdd PNG uploads invisible here.
    const assetListPath = '/rest/assets?pageSize=100&orderBy=ORDER_BY_LAST_USE_TIME&source=SOURCE_UPLOADED&includeImagineFiles=true';
    const assetIdsBeforeUpload = new Set();
    let capturedAssetBaseline = false;
    try {
      const baselineResponse = await jsonRequest(assetListPath, null, signal, 'GET');
      const baselineData = await baselineResponse.json();
      const baselineAssets = Array.isArray(baselineData?.assets) ? baselineData.assets : [];
      for (const asset of baselineAssets) {
        if (typeof asset?.assetId === 'string' && asset.assetId) assetIdsBeforeUpload.add(asset.assetId);
      }
      capturedAssetBaseline = true;
    } catch {
      // Resolving by upload/file metadata below still works on Grok versions
      // that do not allow listing assets before the direct upload.
    }
    const uploadStartedAt = Date.now();
    const form = new FormData();
    form.append('file', new File([image.bytes], fileName, { type: image.mimeType }));
    form.append('file_source', 'IMAGINE_SELF_UPLOAD_FILE_SOURCE');
    const requestFetch = window.fetch.bind(window);
    const response = await requestFetch('/http/upload-file-v2/direct', {
      method: 'POST',
      credentials: 'include',
      body: form,
      signal,
    });
    if (!response.ok) throw new Error(`Grok image upload failed (HTTP ${response.status})`);
    const data = await response.json();
    emitCapture(
      { url: '/http/upload-file-v2/direct', method: 'POST', headers: {}, body: { fileName, fileSize: image.bytes.byteLength, fileSource: 'IMAGINE_SELF_UPLOAD_FILE_SOURCE' } },
      { status: response.status, body: data },
    );
    const uploadUrl = findAssetUrl(data);
    const uploadId = typeof data?.uploadId === 'string' ? data.uploadId : '';
    const uploadMetadataId = grokAssetId(uploadUrl) || findAssetId(data);
    const responseShape = Array.isArray(data)
      ? `array(${data.length})`
      : (data && typeof data === 'object' ? Object.keys(data).slice(0, 12).join(', ') : typeof data);
    if (!uploadId && !uploadMetadataId) throw new Error(`Grok đã nhận ảnh nhưng không trả về upload ID [response: ${responseShape || 'empty'}]`);

    // The upload response URI is not necessarily a valid Imagine media key.
    // The UI refreshes the uploaded-assets list before opening the new asset.
    let metadata = null;
    let metadataError = null;
    let recentAssetSummary = '';
    // upload-file-v2 returns a file metadata UUID, not necessarily the Imagine
    // asset UUID. Grok may also transcode and rename the upload (for example to
    // 0.webp), so resolve it by metadata linkage or by the asset newly added to
    // the uploaded-assets list instead of relying on the source name or size.
    for (let attempt = 0; !metadata && attempt < 9; attempt += 1) {
      if (attempt > 0) await waitFor(1500, signal);
      try {
        const listResponse = await jsonRequest(assetListPath, null, signal, 'GET');
        const listData = await listResponse.json();
        const assets = Array.isArray(listData?.assets) ? listData.assets : [];
        const newestFirst = [...assets]
          .sort((left, right) => Date.parse(right?.createTime || 0) - Date.parse(left?.createTime || 0));
        recentAssetSummary = newestFirst.slice(0, 5).map((item) => [
          item?.name || '?',
          item?.sizeBytes || '?',
          item?.assetId || '?',
          item?.fileSource || '?',
        ].join(':')).join(' | ');
        const newlyCreatedAsset = capturedAssetBaseline
          ? newestFirst.find((item) => (
            typeof item?.assetId === 'string'
            && !assetIdsBeforeUpload.has(item.assetId)
            && /UPLOAD/i.test(String(item?.fileSource || ''))
          ))
          : null;
        metadata = newestFirst.find((item) => item?.assetId === uploadId)
          || newestFirst.find((item) => containsStringValue(item, uploadId))
          || newestFirst.find((item) => containsStringValue(item, uploadMetadataId))
          || newlyCreatedAsset
          || newestFirst.find((item) => item?.name === fileName)
          || newestFirst.find((item) => (
            Number(item?.sizeBytes) === image.bytes.byteLength
            && Date.parse(item?.createTime || 0) >= uploadStartedAt - 300_000
            && /UPLOAD/i.test(String(item?.fileSource || ''))
          ))
          || assets.find((item) => item?.assetId === uploadMetadataId)
          || null;

        // uploadId is the Imagine asset candidate. fileMetadataId only points
        // at the uploaded binary and is not valid for /rest/assets/{id}.
        if (!metadata && uploadId) {
          try {
            const assetResponse = await jsonRequest(`/rest/assets/${uploadId}`, null, signal, 'GET');
            const candidate = await assetResponse.json();
            if (candidate?.assetId || candidate?.key) metadata = candidate;
          } catch (error) {
            if (/HTTP (401|403)/i.test(String(error))) throw error;
          }
        }
      } catch (error) {
        metadataError = error;
        if (/HTTP (401|403)/i.test(String(error))) throw error;
      }
    }
    if (!metadata) {
      if (metadataError) throw metadataError;
      let uploadPath = '';
      try { uploadPath = uploadUrl ? new URL(uploadUrl).pathname : ''; } catch { /* diagnostic only */ }
      const uploadSummary = `shape=${responseShape || 'empty'}, uploadId=${uploadId || 'none'}, metadataId=${uploadMetadataId || 'none'}, path=${uploadPath || 'none'}, baseline=${capturedAssetBaseline ? assetIdsBeforeUpload.size : 'unavailable'}`;
      throw new Error(`Grok asset chưa xuất hiện sau upload (${fileName}, ${image.bytes.byteLength} bytes) [upload: ${uploadSummary}; recent: ${recentAssetSummary || 'empty'}]`);
    }
    const assetId = metadata?.assetId;
    if (!assetId) throw new Error('Grok uploaded-assets list không trả về assetId');
    const assetUrl = normalizeAssetUrl(metadata?.key || metadata?.mediaUrl || metadata?.fileUri);
    if (!assetUrl) throw new Error('Grok asset metadata không trả về media key hợp lệ');

    // This is the same registration step used by the current Grok Imagine UI.
    const postResponse = await jsonRequest('/rest/media/post/create', {
      mediaType: 'MEDIA_POST_TYPE_IMAGE',
      mediaUrl: assetUrl,
    }, signal);
    const postData = await postResponse.json();
    const postId = postData?.post?.id || assetId;
    const registeredUrl = normalizeAssetUrl(postData?.post?.mediaUrl) || assetUrl;
    cache[cacheKey] = { assetId: postId, assetUrl: registeredUrl, savedAt: Date.now() };
    writeUploadCache(cache);
    emit({ requestId, taskId, status: 'uploading', progress: 9 });
    return { assetId: postId, assetUrl: registeredUrl };
  }

  async function jsonRequest(path, body, signal, method = 'POST') {
    // Grok's anti-bot only accepts an x-statsig-id its own client code
    // generated recently — a purely synthetic value works only some of the
    // time before the pattern gets noticed. Prefer a real token captured from
    // the page (fresh within STATSIG_FRESH_WINDOW_MS), waiting briefly for
    // one to show up if the last one observed is stale; fall back to a
    // synthetic value only if nothing fresh appears in time.
    const pageInterceptorAvailable = window.fetch !== observedFetch;
    const freshToken = await getFreshStatsigId(signal);
    const statsigId = freshToken || createStatsigFallbackId();
    const tokenSource = freshToken ? 'observed-fresh' : 'fallback';
    const requestFetch = nativeFetch;
    const xaiRequestId = crypto.randomUUID();
    const response = await requestFetch(path, {
      method,
      credentials: 'include',
      headers: {
        ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
        'x-xai-request-id': xaiRequestId,
        ...(statsigId ? { 'x-statsig-id': statsigId } : {}),
      },
      ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      ...(method === 'GET' ? { cache: 'no-store' } : {}),
      signal,
    });
    if (!response.ok) {
      let detail = '';
      try {
        const text = (await response.clone().text()).trim();
        if (text) {
          try {
            const data = JSON.parse(text);
            detail = data?.message || data?.error?.message || data?.error || text;
          } catch {
            detail = text;
          }
        }
      } catch { /* the HTTP status is still useful when the body is unreadable */ }
      const suffix = detail ? `: ${String(detail).slice(0, 500)}` : '';
      const requestReceivedStatsig = bridgeRequestStatsig.has(xaiRequestId) || Boolean(statsigId);
      bridgeRequestStatsig.delete(xaiRequestId);
      const antiBotDiagnostic = response.status === 403 && /anti[- ]?bot/i.test(detail)
        ? ` [request-token: ${requestReceivedStatsig ? 'yes' : 'no'}; token-source: ${tokenSource}; page-interceptor: ${pageInterceptorAvailable ? 'yes' : 'no'}; observed-page-token: ${latestStatsigId ? 'yes' : 'no'}; page: ${window.location.pathname}]`
        : '';
      throw new Error(`Grok HTTP ${response.status} (${path})${suffix}${antiBotDiagnostic}`);
    }
    bridgeRequestStatsig.delete(xaiRequestId);
    return response;
  }

  async function createVideoPost(prompt, signal) {
    const response = await jsonRequest('/rest/media/post/create', {
      mediaType: 'MEDIA_POST_TYPE_VIDEO',
      prompt,
    }, signal);
    const data = await response.json();
    const postId = data?.post?.id;
    if (!postId) throw new Error('Grok did not return a video post id');
    return postId;
  }

  function readVideoEvent(value) {
    return value?.result?.response?.streamingVideoGenerationResponse || null;
  }

  function normalizePromptForMatch(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function resultFromVideoPost(data, expectedPrompt) {
    const post = data?.post || data;
    if (!post || typeof post !== 'object') return null;
    const candidates = [post, ...(Array.isArray(post.videos) ? post.videos : [])]
      .filter((candidate) => candidate && isVideoUrl(candidate.mediaUrl || candidate.videoUrl));
    if (!candidates.length) return null;

    const normalizedExpected = normalizePromptForMatch(expectedPrompt);
    const exactPromptMatch = normalizedExpected
      ? candidates.find((candidate) => normalizePromptForMatch(candidate.prompt) === normalizedExpected)
      : null;
    // When a source post contains results from multiple generations, never
    // return a sibling lane's video. Results without a prompt are safe only
    // when there is exactly one completed candidate.
    const selected = exactPromptMatch
      || (candidates.length === 1 && !normalizePromptForMatch(candidates[0].prompt) ? candidates[0] : null);
    if (!selected) return null;

    const resolution = selected.resolution || post.resolution || {};
    const remoteUrl = normalizeVideoUrl(selected.mediaUrl || selected.videoUrl);
    return {
      mediaId: selected.assetId || selected.id || selected.videoId,
      videoId: selected.videoId || selected.id,
      videoPostId: selected.videoPostId || selected.id,
      remoteUrl,
      thumbnailUrl: normalizeVideoUrl(selected.thumbnailImageUrl || selected.thumbnailUrl),
      width: selected.width || resolution.width,
      height: selected.height || resolution.height,
      resolutionName: selected.resolutionName || post.resolutionName,
    };
  }

  async function fetchVideoPostResult(postId, expectedPrompt, signal) {
    const response = await nativeFetch('/rest/media/post/get', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: postId }),
      signal,
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Grok post tracker failed (HTTP ${response.status})`);
    }
    return resultFromVideoPost(await response.json(), expectedPrompt);
  }

  async function pollVideoPostResult(candidatePostIds, expectedPrompt, signal, shouldStop) {
    const deadline = Date.now() + 270_000;
    let lastError = null;
    while (!shouldStop() && Date.now() < deadline) {
      if (signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
      for (const postId of [...candidatePostIds]) {
        try {
          const result = await fetchVideoPostResult(postId, expectedPrompt, signal);
          if (result?.remoteUrl) return result;
        } catch (error) {
          if (error?.name === 'AbortError') throw error;
          lastError = error;
        }
      }
      await waitFor(2_000, signal);
    }
    if (shouldStop()) throw new Error('Grok post tracker stopped');
    throw lastError || new Error('Grok completed without a video URL after polling its post');
  }

  async function streamVideo(requestId, taskId, response, submittedPostId, expectedPrompt, signal) {
    if (!response.body) throw new Error('Grok returned no video response stream');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;
    let settled = false;
    const candidatePostIds = new Set();
    if (submittedPostId) candidatePostIds.add(submittedPostId);

    const consumeLine = (line) => {
      const text = line.trim();
      if (!text) return;
      let parsed;
      try { parsed = JSON.parse(text); } catch { return; }
      const video = readVideoEvent(parsed);
      if (!video) return;
      for (const id of [video.videoPostId, video.videoId, video.assetId]) {
        if (typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) candidatePostIds.add(id);
      }
      const progress = Math.max(0, Math.min(100, Number(video.progress) || 0));
      emit({ requestId, taskId, status: progress >= 100 ? 'processing-result' : 'polling', progress });
      if (progress >= 100) {
        finalResult = {
          mediaId: video.assetId || video.videoId,
          videoId: video.videoId,
          videoPostId: video.videoPostId,
          remoteUrl: normalizeVideoUrl(video.videoUrl),
          thumbnailUrl: normalizeVideoUrl(video.thumbnailImageUrl),
          width: video.width,
          height: video.height,
          resolutionName: video.resolutionName,
        };
      }
    };

    const consumeStream = async () => {
      while (!finalResult?.remoteUrl && !settled) {
        if (signal.aborted) throw new DOMException('Cancelled by user', 'AbortError');
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) consumeLine(line);
        // Grok can leave the completed NDJSON response open and occasionally
        // leaves the final JSON object without a trailing newline. Parse a
        // complete buffered object immediately instead of waiting for EOF.
        if (!finalResult?.remoteUrl && buffer.trim()) {
          try {
            JSON.parse(buffer.trim());
            consumeLine(buffer);
            if (finalResult?.remoteUrl) buffer = '';
          } catch { /* wait for the rest of the current JSON object */ }
        }
        if (done) break;
      }
      if (!finalResult?.remoteUrl) consumeLine(buffer);
      if (!finalResult?.remoteUrl) throw new Error('Grok stream ended without a video URL');
      return finalResult;
    };

    // The UI stream belongs to the tab and may be interrupted when the next
    // lane reuses that tab. Race it against an independent, task-local post
    // tracker. Reject only when both paths fail; the first valid MP4 wins.
    const firstSuccessful = (promises) => new Promise((resolve, reject) => {
      let failures = 0;
      let lastError;
      for (const promise of promises) {
        Promise.resolve(promise).then(resolve, (error) => {
          failures += 1;
          lastError = error;
          if (failures === promises.length) reject(lastError);
        });
      }
    });
    const result = await firstSuccessful([
      consumeStream(),
      pollVideoPostResult(candidatePostIds, expectedPrompt, signal, () => settled),
    ]);
    settled = true;
    // The generation is already complete. Do not let Grok's lingering stream
    // keep the desktop task stuck in "generating".
    try { await reader.cancel(); } catch { /* stream may already be closed */ }
    return result;
  }

  async function generateVideo(command) {
    const { requestId, taskId } = command;
    const payload = command.payload || {};
    const prompt = String(payload.prompt || '').trim();
    if (!prompt) throw new Error('Grok video prompt is empty');
    if (isApiDocumentPath(window.location.pathname)) {
      throw new Error(`Sai tab Grok (${window.location.pathname}). Hãy mở một trang ứng dụng grok.com đã đăng nhập rồi thử lại.`);
    }
    const controller = new AbortController();
    controllers.set(taskId, controller);
    try {
      const startedAt = performance.now();
      const submission = await submitThroughGrokUi(payload, requestId, taskId, controller.signal);
      const { response, submittedPostId } = submission;
      const submittedAt = performance.now();
      if (!response.ok) {
        const detail = await response.clone().text().catch(() => '');
        throw new Error(`Grok UI submission failed (HTTP ${response.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`);
      }
      const result = await streamVideo(requestId, taskId, response, submittedPostId, prompt, controller.signal);
      const generatedAt = performance.now();
      await refreshQuotaStatus().catch(() => {});
      const seconds = (value) => (value / 1000).toFixed(1);
      // The desktop side downloads the video directly in Node using the page's
      // cookies (see grok/in-app-bridge.ts). We only hand it the URL — no more
      // streaming the whole file back as base64 chunks over the bridge, which
      // choked on large videos.
      emit({
        requestId,
        taskId,
        status: 'completed',
        progress: 100,
        responseSummary: `Video ${result.resolutionName || ''} ${result.width || ''}x${result.height || ''} · tạo ${seconds(generatedAt - submittedAt)}s`,
        result: { ...result },
      });
    } finally {
      controllers.delete(taskId);
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const command = event.data;
    if (!command || command.channel !== COMMAND_CHANNEL) return;
    if (command.type === 'cancel-video') {
      controllers.get(command.taskId)?.abort();
      return;
    }
    if (command.type === 'refresh-quota') {
      void refreshQuotaStatus().catch(() => {});
      return;
    }
    if (command.type !== 'generate-video') return;
    void generateVideo(command).catch((error) => emit({
      requestId: command.requestId,
      taskId: command.taskId,
      status: error?.name === 'AbortError' ? 'cancelled' : 'failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  });

  setTimeout(() => { void refreshQuotaStatus().catch(() => {}); }, 500);
  // Usage is a client-side dialog and opening it does not necessarily trigger
  // quota_info. Observe its authoritative 100%/weekly-limit state promptly so
  // Settings turns red without requiring a generation or manual refresh.
  setInterval(() => { getSubmissionBlocker(); }, 1_000);
  // Keep Settings reasonably current even when no generation is running.
  // The interval is deliberately conservative because this is an authenticated
  // Grok endpoint, not a local health check.
  setInterval(() => { void refreshQuotaStatus().catch(() => {}); }, 60_000);
})();
