(function installLogddGrokContentBridge() {
  if (window.__logddGrokContentBridgeInstalled) return;
  window.__logddGrokContentBridgeInstalled = true;
  const COMMAND_CHANNEL = 'LOGDD_GROK_COMMAND_V1';
  const EVENT_CHANNEL = 'LOGDD_GROK_EVENT_V1';
  const GROK_BRIDGE_VERSION = 12;

  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (!['LOGDD_GROK_GENERATE_VIDEO', 'LOGDD_GROK_CANCEL_VIDEO', 'LOGDD_GROK_REFRESH_QUOTA'].includes(message?.type)) return false;
    window.postMessage({
      channel: COMMAND_CHANNEL,
      type: message.type === 'LOGDD_GROK_GENERATE_VIDEO'
        ? 'generate-video'
        : message.type === 'LOGDD_GROK_REFRESH_QUOTA'
          ? 'refresh-quota'
          : 'cancel-video',
      requestId: message.requestId,
      taskId: message.taskId,
      payload: message.payload,
    }, window.location.origin);
    reply({ accepted: true });
    return false;
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    if (!event.data || event.data.channel !== EVENT_CHANNEL) return;
    if (event.data.type === 'task-event') {
      chrome.runtime.sendMessage({ type: 'LOGDD_GROK_ADAPTER_EVENT', event: event.data.event }).catch(() => {});
    } else if (event.data.type === 'quota-status') {
      chrome.runtime.sendMessage({ type: 'LOGDD_GROK_QUOTA_STATUS', quota: event.data.quota }).catch(() => {});
    }
  });

  chrome.runtime.sendMessage({
    type: 'LOGDD_GROK_PAGE_READY',
    bridgeVersion: GROK_BRIDGE_VERSION,
    pageUrl: window.location.href,
  }).catch(() => {});
})();
