(function installLogddGrokBackground() {
  const WS_URL = 'ws://127.0.0.1:9223';
  const GROK_PROTOCOL_VERSION = 6;
  const GROK_BRIDGE_VERSION = 12;
  const INSTANCE_KEY = 'logddGrokExtensionInstanceId';
  let socket = null;
  let reconnectTimer = null;
  let instanceId = null;
  let lastError = '';
  let quotaStatus = null;
  const readyTabIds = new Set();
  const taskLog = [];

  function isUsableGrokPageUrl(value) {
    try {
      const url = new URL(value || '');
      const isApiDocument = /^\/(?:rest|api|grok_api|grok_api_v2)(?:\/|\.|$)/i.test(url.pathname);
      return url.protocol === 'https:'
        && (url.hostname === 'grok.com' || url.hostname.endsWith('.grok.com'))
        && !isApiDocument;
    } catch {
      return false;
    }
  }

  function isGrokImaginePageUrl(value) {
    try {
      const url = new URL(value || '');
      return isUsableGrokPageUrl(value) && /^\/imagine(?:\/|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  function broadcastStatus() {
    chrome.runtime.sendMessage({ type: 'LOGDD_GROK_STATUS_PUSH' }).catch(() => {});
  }

  function upsertTask(event) {
    const id = event.taskId || event.requestId;
    if (!id) return;
    const existing = taskLog.find((item) => item.id === id);
    const next = {
      ...(existing || {}),
      id,
      provider: 'grok',
      type: 'GENERATE_VIDEO',
      time: existing?.time || new Date().toISOString(),
      status: event.status || existing?.status || 'queued',
      progress: typeof event.progress === 'number' ? event.progress : existing?.progress,
      error: event.error || existing?.error || '',
      outputUrl: event.result?.remoteUrl || existing?.outputUrl,
      thumbnailUrl: event.result?.thumbnailUrl || existing?.thumbnailUrl,
      mediaId: event.result?.mediaId || existing?.mediaId,
      videoId: event.result?.videoId || existing?.videoId,
      videoPostId: event.result?.videoPostId || existing?.videoPostId,
      modelKey: event.modelKey || existing?.modelKey,
      requestUrl: event.requestUrl || existing?.requestUrl,
      payloadSummary: event.payloadSummary || existing?.payloadSummary,
      responseSummary: event.responseSummary || existing?.responseSummary,
      diagnostic: event.diagnostic || existing?.diagnostic,
      resolutionName: event.result?.resolutionName || existing?.resolutionName,
      width: event.result?.width || existing?.width,
      height: event.result?.height || existing?.height,
    };
    if (existing) Object.assign(existing, next);
    else taskLog.unshift(next);
    if (taskLog.length > 50) taskLog.length = 50;
    chrome.runtime.sendMessage({ type: 'LOGDD_GROK_LOG_PUSH', log: taskLog }).catch(() => {});
  }

  function send(message) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  function runtimeQuotaState() {
    if (!quotaStatus || !quotaStatus.checkedAt) return { quotaSeen: false };
    return {
      quotaSeen: true,
      // The app is 720p-only, so an account is usable only while both the
      // general video quota and the dedicated 720p quota are available.
      videoAvailable: quotaStatus.videoAvailable === true
        && quotaStatus.video720pAvailable === true,
      weeklyUsagePercent: typeof quotaStatus.weeklyUsagePercent === 'number'
        ? quotaStatus.weeklyUsagePercent
        : undefined,
      quotaCheckedAt: Number(quotaStatus.checkedAt) || Date.now(),
    };
  }

  function isQuotaExhaustionMessage(value) {
    return /HTTP 429|quota|rate.?limit|usage.?limit|limit.{0,30}(?:reached|exceeded|exhausted)|exhausted.{0,30}limit|no.{0,20}(?:video )?(?:generations?|credits?) left/i.test(String(value || ''));
  }

  function markQuotaUnavailable() {
    quotaStatus = {
      ...(quotaStatus || {}),
      videoAvailable: false,
      video720pAvailable: false,
      checkedAt: Date.now(),
    };
    chrome.storage.local.set({ logddGrokQuotaStatus: quotaStatus }).catch(() => {});
    send({ type: 'grok_quota_status', ...runtimeQuotaState() });
  }

  async function findGrokTab(createIfMissing = false) {
    const tabs = await chrome.tabs.query({ url: ['https://grok.com/*', 'https://*.grok.com/*'] });
    const imagineTab = tabs.find((tab) => isGrokImaginePageUrl(tab.url));
    if (imagineTab) return imagineTab;
    if (!createIfMissing) return tabs.find((tab) => isUsableGrokPageUrl(tab.url)) || null;
    const tab = await chrome.tabs.create({ url: 'https://grok.com/imagine', active: false });
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const current = tab.id ? await chrome.tabs.get(tab.id).catch(() => null) : null;
      if (current?.status === 'complete') return current;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error('Grok tab did not finish loading');
  }

  async function attachGrokBridge(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['grok-page-bridge.js'], world: 'MAIN' });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['grok-content.js'], world: 'ISOLATED' });
  }

  async function dispatchToGrok(message) {
    const tab = await findGrokTab(true);
    if (!tab?.id) throw new Error('No Grok Imagine tab is available');
    try {
      return await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      await attachGrokBridge(tab.id);
      return chrome.tabs.sendMessage(tab.id, message);
    }
  }

  async function pushGrokPageState() {
    const tab = await findGrokTab(false).catch(() => null);
    const grokReady = Boolean(tab?.id && readyTabIds.has(tab.id));
    send({
      type: 'grok_page_state',
      grokReady,
      pageUrl: tab?.url || '',
      ...runtimeQuotaState(),
    });
    broadcastStatus();
  }

  async function handleAgentMessage(message) {
    if (message.type === 'grok_refresh_quota') {
      await dispatchToGrok({ type: 'LOGDD_GROK_REFRESH_QUOTA' });
      return;
    }
    if (message.type === 'grok_generate_video') {
      const payload = message.payload || {};
      const prompt = String(payload.prompt || '').trim();
      upsertTask({
        taskId: message.taskId,
        requestId: message.requestId,
        status: 'queued',
        progress: 0,
        modelKey: payload.model || 'imagine-video-gen',
        requestUrl: 'https://grok.com/rest/app-chat/conversations/new',
        payloadSummary: [
          prompt ? `Prompt: ${prompt.slice(0, 500)}` : '',
          payload.aspectRatio ? `Tỷ lệ: ${payload.aspectRatio}` : '',
          payload.duration ? `Thời lượng: ${payload.duration}s` : '',
          payload.startImage?.source ? 'Có ảnh khung đầu' : 'Text-to-video',
        ].filter(Boolean).join(' · '),
      });
      await dispatchToGrok({
        type: 'LOGDD_GROK_GENERATE_VIDEO',
        requestId: message.requestId,
        taskId: message.taskId,
        payload: message.payload,
      });
      return;
    }
    if (message.type === 'grok_cancel_video') {
      const tab = await findGrokTab(false);
      if (tab?.id) await chrome.tabs.sendMessage(tab.id, {
        type: 'LOGDD_GROK_CANCEL_VIDEO',
        requestId: message.requestId,
        taskId: message.taskId,
      }).catch(() => {});
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2000);
  }

  function connect() {
    if (!instanceId || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    try { socket = new WebSocket(WS_URL); }
    catch { scheduleReconnect(); return; }
    socket.onopen = async () => {
      lastError = '';
      const tab = await findGrokTab(false).catch(() => null);
      send({
        type: 'grok_extension_ready',
        protocolVersion: GROK_PROTOCOL_VERSION,
        extensionInstanceId: instanceId,
        grokReady: Boolean(tab?.id && readyTabIds.has(tab.id)),
        pageUrl: tab?.url,
        ...runtimeQuotaState(),
      });
      broadcastStatus();
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        void handleAgentMessage(message).catch((error) => send({
          type: 'grok_task_event',
          requestId: message.requestId,
          taskId: message.taskId,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        }));
      } catch { /* ignore malformed local messages */ }
    };
    socket.onclose = () => { socket = null; broadcastStatus(); scheduleReconnect(); };
    socket.onerror = () => { lastError = 'Không kết nối được runtime Grok tại 127.0.0.1:9223'; socket?.close(); };
  }

  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.type === 'LOGDD_GROK_PAGE_READY') {
      if (Number(message.bridgeVersion) !== GROK_BRIDGE_VERSION) {
        if (sender.tab?.id) readyTabIds.delete(sender.tab.id);
        void pushGrokPageState();
        reply({ ok: false, error: 'Tab Grok is using an outdated logdd bridge. Reload the tab.' });
        return false;
      }
      if (!isUsableGrokPageUrl(message.pageUrl)) {
        if (sender.tab?.id) readyTabIds.delete(sender.tab.id);
        void pushGrokPageState();
        reply({ ok: false, error: 'Bridge Grok không chạy trên trang API /rest hoặc /api.' });
        return false;
      }
      if (sender.tab?.id) readyTabIds.add(sender.tab.id);
      quotaStatus = null;
      chrome.storage.local.set({ logddGrokQuotaStatus: null }).catch(() => {});
      lastError = '';
      send({ type: 'grok_page_ready', tabId: sender.tab?.id, pageUrl: message.pageUrl, ...runtimeQuotaState() });
      broadcastStatus();
      reply({ ok: true });
      return false;
    }
    if (message?.type === 'LOGDD_GROK_ADAPTER_EVENT') {
      if (message.event?.status === 'failed' && isQuotaExhaustionMessage(message.event?.error)) markQuotaUnavailable();
      upsertTask(message.event || {});
      send({ type: 'grok_task_event', ...message.event });
      reply({ ok: true });
      return false;
    }
    if (message?.type === 'LOGDD_GROK_QUOTA_STATUS') {
      const quota = message.quota;
      if (quota && typeof quota === 'object') {
        quotaStatus = {
          videoAvailable: quota.videoAvailable === true,
          video720pAvailable: quota.video720pAvailable === true,
          weeklyUsagePercent: typeof quota.weeklyUsagePercent === 'number'
            ? Math.max(0, Math.min(100, quota.weeklyUsagePercent))
            : undefined,
          videoWindowSizeSeconds: Number(quota.videoWindowSizeSeconds) || 0,
          video720pWindowSizeSeconds: Number(quota.video720pWindowSizeSeconds) || 0,
          checkedAt: Number(quota.checkedAt) || Date.now(),
        };
        chrome.storage.local.set({ logddGrokQuotaStatus: quotaStatus }).catch(() => {});
        send({ type: 'grok_quota_status', ...runtimeQuotaState() });
        broadcastStatus();
      }
      reply({ ok: true });
      return false;
    }
    if (message?.type === 'LOGDD_GROK_STATUS') {
      void findGrokTab(false).then((tab) => reply({
        ok: true,
        agentConnected: socket?.readyState === WebSocket.OPEN,
        socketState: socket?.readyState === WebSocket.OPEN ? 'connected' : socket?.readyState === WebSocket.CONNECTING ? 'connecting' : 'disconnected',
        grokTabFound: Boolean(tab),
        pageBridgeReady: Boolean(tab?.id && readyTabIds.has(tab.id)),
        grokReady: Boolean(socket?.readyState === WebSocket.OPEN && tab?.id && readyTabIds.has(tab.id)),
        pageUrl: tab?.url,
        quotaStatus,
        lastError,
      }));
      return true;
    }
    if (message?.type === 'LOGDD_GROK_LOG') {
      reply({ ok: true, log: taskLog });
      return false;
    }
    if (message?.type === 'LOGDD_OPEN_GROK') {
      void findGrokTab(true).then((tab) => {
        if (tab?.id) chrome.tabs.update(tab.id, { active: true });
        reply({ ok: true, tabId: tab?.id });
      }).catch((error) => reply({ ok: false, error: String(error) }));
      return true;
    }
    return false;
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'logdd-grok-keepalive') {
      send({ type: 'ping' });
      void pushGrokPageState();
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (!readyTabIds.delete(tabId)) return;
    void pushGrokPageState();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url || !readyTabIds.has(tabId) || isUsableGrokPageUrl(tab.url)) return;
    readyTabIds.delete(tabId);
    void pushGrokPageState();
  });

  chrome.storage.local.get({ [INSTANCE_KEY]: '', logddGrokQuotaStatus: null }).then(async (state) => {
    instanceId = state[INSTANCE_KEY] || crypto.randomUUID();
    quotaStatus = state.logddGrokQuotaStatus && typeof state.logddGrokQuotaStatus === 'object'
      ? state.logddGrokQuotaStatus
      : null;
    if (!state[INSTANCE_KEY]) await chrome.storage.local.set({ [INSTANCE_KEY]: instanceId });
    chrome.alarms.create('logdd-grok-keepalive', { periodInMinutes: 0.5 });
    connect();
  });
})();
