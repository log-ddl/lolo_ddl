let flowStatus = null;
let grokStatus = null;
let flowLog = [];
let grokLog = [];
const expandedEntryIds = new Set();

document.getElementById('bridge-version').textContent = `v${chrome.runtime.getManifest().version}`;

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (result) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(result || null);
    });
  });
}

function mark(id, ok, goodText, badText) {
  const element = document.getElementById(id);
  element.textContent = ok ? goodText : badText;
  element.className = `check-value ${ok ? 'ok' : 'bad'}`;
}

function renderFlow() {
  const connected = Boolean(flowStatus?.agentConnected);
  const token = Boolean(flowStatus?.flowKeyPresent);
  const ready = connected && token;
  const state = document.getElementById('flow-state');
  state.textContent = ready ? 'Sẵn sàng' : connected ? 'Thiếu phiên' : 'Chưa kết nối';
  state.className = `provider-state ${ready ? 'ready' : connected ? 'waiting' : ''}`;
  document.getElementById('flow-summary').textContent = ready
    ? 'Có thể tạo ảnh và video'
    : connected ? 'Runtime đã nối nhưng chưa lấy được phiên Flow' : 'Ứng dụng chưa mở runtime Flow';
  mark('flow-agent', connected, 'Đã kết nối', 'Không kết nối');
  mark('flow-token', token, 'Đã đồng bộ', 'Chưa có phiên');
}

function renderGrok() {
  const connected = Boolean(grokStatus?.agentConnected);
  const tabFound = Boolean(grokStatus?.grokTabFound);
  const bridgeReady = Boolean(grokStatus?.pageBridgeReady);
  const baseReady = connected && tabFound && bridgeReady;
  const quota = grokStatus?.quotaStatus;
  const quotaKnown = Boolean(quota?.checkedAt);
  const videoAvailable = !quotaKnown || quota.videoAvailable === true;
  const ready = baseReady && videoAvailable;
  const state = document.getElementById('grok-state');
  state.textContent = quotaKnown && !videoAvailable ? 'Hết hạn mức' : ready ? 'Sẵn sàng' : connected ? 'Chờ trang Grok' : 'Chưa kết nối';
  state.className = `provider-state ${quotaKnown && !videoAvailable ? 'blocked' : ready ? 'ready' : connected ? 'waiting' : ''}`;
  mark('grok-agent', connected, 'Đã kết nối', 'Không kết nối');
  mark('grok-tab', tabFound, 'Đã mở', 'Chưa mở');
  mark('grok-bridge', bridgeReady, 'Đã nhận trang', 'Chưa nhận trang');

  const videoQuota = document.getElementById('grok-video-quota');
  const quota720p = document.getElementById('grok-720p-quota');
  videoQuota.textContent = !quotaKnown ? 'Chưa có dữ liệu' : quota.videoAvailable ? 'Còn lượt' : 'Hết lượt';
  videoQuota.className = `check-value ${!quotaKnown ? '' : quota.videoAvailable ? 'ok' : 'bad'}`;
  quota720p.textContent = !quotaKnown ? 'Chưa có dữ liệu' : quota.video720pAvailable ? 'Còn lượt' : 'Hết lượt';
  quota720p.className = `check-value ${!quotaKnown ? '' : quota.video720pAvailable ? 'ok' : 'bad'}`;

  let summary = 'Grok Video chưa sẵn sàng';
  let error = '';
  if (ready) summary = quotaKnown ? 'Tài khoản còn hạn mức tạo video' : 'Có thể tạo video bằng Grok Imagine';
  else if (quotaKnown && !quota.videoAvailable) error = 'Tài khoản Grok đã hết hạn mức tạo video.';
  else if (!connected) error = 'Ứng dụng desktop chưa mở runtime Grok tại cổng 9223.';
  else if (!tabFound) error = 'Chưa tìm thấy tab grok.com. Hãy mở Grok và đăng nhập.';
  else if (!bridgeReady) error = 'Extension chưa được nạp vào tab Grok. Hãy tải lại tab.';
  if (grokStatus?.lastError) error = `${error} ${grokStatus.lastError}`.trim();
  document.getElementById('grok-summary').textContent = summary;
  const box = document.getElementById('grok-error');
  box.hidden = !error;
  box.textContent = error;
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeMediaUrl(value) {
  return typeof value === 'string' && (/^https:\/\//i.test(value) || /^data:image\//i.test(value)) ? value : '';
}

function safeOutputUrl(value) {
  return typeof value === 'string' && /^https:\/\//i.test(value) ? value : '';
}

function formatKind(entry) {
  if (/sync_ref|sync/i.test(String(entry.type || entry.kind || ''))) return 'Đồng bộ tham chiếu';
  const type = String(entry.type || entry.kind || 'Yêu cầu');
  if (/video|gen_vid/i.test(type)) return 'Tạo video';
  if (/image|gen_img/i.test(type)) return 'Tạo ảnh';
  if (/upscale/i.test(type)) return 'Nâng cấp video';
  return type;
}

function statusInfo(entry) {
  const status = String(entry.status || 'processing').toLowerCase();
  if (status === 'completed' || status === 'success') return { text: 'Hoàn tất', className: 'done' };
  if (status === 'failed' || entry.error) return { text: 'Thất bại', className: 'failed' };
  if (typeof entry.progress === 'number') return { text: `${entry.progress}%`, className: '' };
  return { text: 'Đang chạy', className: '' };
}

function detailRow(label, value, className = '') {
  if (value == null || value === '') return '';
  return `<div class="activity-detail-row"><div class="activity-detail-label">${escapeHtml(label)}</div><div class="activity-detail-value ${className}">${escapeHtml(value)}</div></div>`;
}

function renderEntry(entry, index) {
  const status = statusInfo(entry);
  const thumbnailUrl = safeMediaUrl(entry.thumbnailUrl);
  const outputUrl = safeOutputUrl(entry.outputUrl || entry.remoteUrl);
  const type = formatKind(entry);
  const dimensions = entry.width && entry.height ? `${entry.width}×${entry.height}` : '';
  const progress = typeof entry.progress === 'number'
    ? `${entry.progress}%${entry.phase ? ` · ${entry.phase}` : ''}`
    : '';
  const details = [
    detailRow('ID', entry.id),
    detailRow('Nhà cung cấp', entry.provider),
    detailRow('Loại tác vụ', type),
    detailRow('Thời gian', formatTime(entry.time || entry.timestamp || entry.createdAt)),
    detailRow('Trạng thái', entry.status || 'processing', status.className),
    detailRow('Tiến trình', progress),
    detailRow('Model', entry.modelKey),
    detailRow('HTTP', entry.httpStatus),
    detailRow('Request URL', entry.requestUrl || entry.url),
    detailRow('Dữ liệu gửi đi', entry.payloadSummary),
    detailRow('Phản hồi', entry.responseSummary),
    detailRow('Media ID', entry.mediaId),
    detailRow('Video ID', entry.videoId),
    detailRow('Video Post ID', entry.videoPostId),
    detailRow('Độ phân giải', [entry.resolutionName, dimensions].filter(Boolean).join(' · ')),
    detailRow('Chẩn đoán', entry.diagnostic),
    detailRow('Lỗi', entry.error, 'failed'),
  ].join('');
  const preview = thumbnailUrl
    ? `<a class="activity-preview" href="${escapeHtml(thumbnailUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(type)}"></a>`
    : '';
  const output = outputUrl
    ? `<div class="activity-output"><a href="${escapeHtml(outputUrl)}" target="_blank" rel="noreferrer">Mở kết quả ↗</a><div class="activity-output-url">${escapeHtml(outputUrl)}</div></div>`
    : '';
  const hasDetails = Boolean(preview || output || details);
  const entryId = String(entry.id || `${entry.provider}-${index}`);
  const isOpen = expandedEntryIds.has(entryId);

  return `<article class="activity-entry ${isOpen ? 'open' : ''}" data-entry-id="${escapeHtml(entryId)}">
    <button class="activity-row" type="button" aria-expanded="${isOpen}">
      ${thumbnailUrl ? `<img class="activity-thumbnail" src="${escapeHtml(thumbnailUrl)}" alt="">` : `<div class="activity-provider">${escapeHtml(entry.provider)}</div>`}
      <div class="activity-main"><div class="activity-kind">${escapeHtml(type)}</div><div class="activity-meta">${escapeHtml(entry.provider)} · ${escapeHtml(formatTime(entry.time || entry.timestamp || entry.createdAt))}${entry.error ? ` · ${escapeHtml(String(entry.error).slice(0, 90))}` : ''}</div></div>
      <div class="activity-status ${status.className}">${escapeHtml(status.text)}</div>
      <span class="activity-expand" style="${hasDetails ? '' : 'visibility:hidden'}">›</span>
    </button>
    ${hasDetails ? `<div class="activity-details">${preview}${details}${output}</div>` : ''}
  </article>`;
}

function renderLog() {
  const entries = [
    ...flowLog.map((item) => ({ ...item, provider: 'Flow' })),
    ...grokLog.map((item) => ({ ...item, provider: 'Grok' })),
  ].sort((a, b) => new Date(b.time || b.timestamp || b.createdAt || 0) - new Date(a.time || a.timestamp || a.createdAt || 0)).slice(0, 100);
  document.getElementById('activity-count').textContent = `${entries.length} yêu cầu`;
  const list = document.getElementById('activity-list');
  if (!entries.length) {
    list.innerHTML = '<div class="activity-empty">Chưa có yêu cầu tạo nội dung.</div>';
    return;
  }
  list.innerHTML = entries.map(renderEntry).join('');
  list.querySelectorAll('.activity-row').forEach((row) => {
    row.addEventListener('click', () => {
      const entry = row.closest('.activity-entry');
      if (!entry?.querySelector('.activity-details')) return;
      const open = entry.classList.toggle('open');
      const entryId = entry.getAttribute('data-entry-id');
      if (entryId) {
        if (open) expandedEntryIds.add(entryId);
        else expandedEntryIds.delete(entryId);
      }
      row.setAttribute('aria-expanded', String(open));
    });
  });
}

async function refresh() {
  const [flow, grok, flowEntries, grokEntries] = await Promise.all([
    send({ type: 'STATUS' }),
    send({ type: 'LOGDD_GROK_STATUS' }),
    send({ type: 'REQUEST_LOG' }),
    send({ type: 'LOGDD_GROK_LOG' }),
  ]);
  flowStatus = flow;
  grokStatus = grok;
  flowLog = flowEntries?.log || [];
  grokLog = grokEntries?.log || [];
  renderFlow();
  renderGrok();
  renderLog();
}

document.getElementById('btn-flow').addEventListener('click', () => void send({ type: 'OPEN_FLOW_TAB' }));
document.getElementById('btn-token').addEventListener('click', async () => { await send({ type: 'REFRESH_TOKEN' }); setTimeout(refresh, 500); });
document.getElementById('btn-grok').addEventListener('click', () => void send({ type: 'LOGDD_OPEN_GROK' }));
document.getElementById('btn-reload-grok').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ url: ['https://grok.com/*', 'https://*.grok.com/*'] });
  const tab = tabs.find((candidate) => {
    try { return !/^\/(?:rest|api|grok_api|grok_api_v2)(?:\/|\.|$)/i.test(new URL(candidate.url).pathname); }
    catch { return false; }
  });
  if (tab?.id) await chrome.tabs.reload(tab.id);
  setTimeout(refresh, 1200);
});
document.getElementById('btn-refresh').addEventListener('click', refresh);

chrome.runtime.onMessage.addListener((message) => {
  if (['STATUS_PUSH', 'LOGDD_GROK_STATUS_PUSH', 'REQUEST_LOG_UPDATE', 'LOGDD_GROK_LOG_PUSH'].includes(message?.type)) void refresh();
});

void refresh();
setInterval(refresh, 3000);
