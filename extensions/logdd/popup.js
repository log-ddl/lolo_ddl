const TYPE_LABEL_KEYS = {
  GENERATE_IMAGE:             'type.generateImage',
  REGENERATE_IMAGE:           'type.regenerateImage',
  EDIT_IMAGE:                 'type.editImage',
  GENERATE_CHARACTER_IMAGE:   'type.generateReference',
  REGENERATE_CHARACTER_IMAGE: 'type.regenerateReference',
  EDIT_CHARACTER_IMAGE:       'type.editReference',
  GENERATE_VIDEO:             'type.generateVideo',
  GENERATE_VIDEO_REFS:        'type.generateVideoRefs',
  UPSCALE_VIDEO:              'type.upscaleVideo',
  GEN_IMG:                    'type.generateImage',
  GEN_VID:                    'type.generateVideo',
  GEN_VID_REF:                'type.generateVideoRefs',
  UPSCALE:                    'type.upscaleVideo',
  SYNC_REF:                   'type.syncReferences',
  TRACKING:                   'type.tracking',
  URL_REFRESH:                'type.urlRefresh',
};

let _popupLogEntries = [];
let _grokQuotaStatus = null;

function t(key, params) {
  return window.LongddI18n?.t(key, params) || key;
}

const PHASE_LABEL_KEYS = {
  queued: 'phase.queued', checking_media: 'phase.checkingMedia', uploading_media: 'phase.uploadingMedia',
  media_ready: 'phase.mediaReady', uploading: 'phase.uploading', submitting: 'phase.submitting',
  polling: 'phase.polling', downloading: 'phase.downloading', completed: 'phase.completed',
  failed: 'phase.failed', cancelled: 'phase.cancelled',
};

function formatPhase(phase) {
  if (!phase) return '';
  const key = PHASE_LABEL_KEYS[phase];
  return key ? t(key) : phase;
}

function formatType(type) {
  if (!type) return '—';
  const labelKey = TYPE_LABEL_KEYS[type];
  return labelKey ? t(labelKey) : type.slice(0, 12).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return '—';
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeMediaUrl(value) {
  return typeof value === 'string' && (/^https:\/\//i.test(value) || /^data:image\//i.test(value)) ? value : '';
}

function badgeHtml(status) {
  if (status === 'COMPLETED' || status === 'success') {
    return `<span class="badge badge-ok">&#10003; ${escHtml(t('status.done'))}</span>`;
  } else if (status === 'FAILED' || status === 'failed' || (typeof status === 'number' && status >= 400)) {
    return `<span class="badge badge-fail">&#10007; ${escHtml(t('status.failed'))}</span>`;
  } else if (status === 'PROCESSING') {
    return `<span class="badge badge-proc">&#9203; ${escHtml(t('status.generating'))}</span>`;
  } else {
    return `<span class="badge badge-proc">&#9203; ${escHtml(t('status.sent'))}</span>`;
  }
}

function renderLog(entries) {
  const list = document.getElementById('log-list');
  const countEl = document.getElementById('log-count');
  _popupLogEntries = entries || [];

  if (_popupLogEntries.length === 0) {
    list.innerHTML = `<div class="log-empty">
      <div class="empty-icon">◎</div>
      <div>${escHtml(t('common.emptyTitle'))}</div>
      <span>${escHtml(t('common.emptyDescription'))}</span>
    </div>`;
    countEl.textContent = '0';
    return;
  }

  countEl.textContent = _popupLogEntries.length;

  list.innerHTML = _popupLogEntries.map((entry, i) => {
    const shortId = entry.id ? String(entry.id).slice(0, 8) : '—';
    const type = formatType(entry.type || entry.method);
    const time = formatTime(entry.time || entry.timestamp);
    const status = entry.status || 'pending';
    const error = entry.error || '';
    const thumbnailUrl = safeMediaUrl(entry.thumbnailUrl);

    const thumbnailDisplay = thumbnailUrl
      ? `<div class="request-preview"><img src="${escHtml(thumbnailUrl)}" alt="${escHtml(type)}"></div>`
      : '';

    const requestUrl = entry.requestUrl || entry.url;
    const urlDisplay = requestUrl
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.url'))}</div>
           <div class="detail-value url" title="${escHtml(requestUrl)}">${escHtml(requestUrl)}</div>
         </div>`
      : '';

    const payloadDisplay = entry.payloadSummary
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.payload'))}</div>
           <div class="detail-value">${escHtml(entry.payloadSummary)}</div>
         </div>`
      : '';

    const responseDisplay = entry.responseSummary
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.response'))}${entry.httpStatus ? ` (${entry.httpStatus})` : ''}</div>
           <div class="detail-value">${escHtml(entry.responseSummary)}</div>
         </div>`
      : '';

    const errorDisplay = error
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.error'))}</div>
           <div class="detail-value detail-error">${escHtml(error)}</div>
         </div>`
      : '';

    const progressDisplay = typeof entry.progress === 'number'
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.progress'))}</div>
           <div class="detail-value">${escHtml(`${entry.progress}% · ${formatPhase(entry.phase)}`)}</div>
         </div>`
      : '';

    const diagnosticDisplay = entry.diagnostic
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.diagnostic'))}</div>
           <div class="detail-value">${escHtml(entry.diagnostic)}</div>
         </div>`
      : '';

    const outputDisplay = entry.outputUrl
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.output'))}</div>
           <a class="output-link" href="${escHtml(entry.outputUrl)}" target="_blank" rel="noreferrer">Mở kết quả ↗</a>
         </div>`
      : '';

    const modelDisplay = entry.modelKey
      ? `<div class="detail-section">
           <div class="detail-label">${escHtml(t('detail.model'))}</div>
           <div class="detail-value">${escHtml(entry.modelKey)}</div>
         </div>`
      : '';

    const providerDisplay = entry.provider
      ? `<div class="detail-section"><div class="detail-label">Nhà cung cấp</div><div class="detail-value">${escHtml(entry.provider)}</div></div>`
      : '';

    const hasDetails = thumbnailUrl || requestUrl || entry.payloadSummary || entry.responseSummary || error || entry.diagnostic || entry.outputUrl || entry.modelKey || typeof entry.progress === 'number';

    return `<div class="entry" data-idx="${i}">
      <div class="entry-row">
        <span class="entry-id">${escHtml(shortId)}</span>
        <span class="entry-type">${escHtml(type)}</span>
        <span class="entry-time">${escHtml(time)}</span>
        ${badgeHtml(status)}
        ${hasDetails ? '<span class="expand-icon">&#9654;</span>' : '<span class="expand-icon" style="visibility:hidden">&#9654;</span>'}
      </div>
      ${hasDetails ? `<div class="entry-details">${thumbnailDisplay}${providerDisplay}${progressDisplay}${modelDisplay}${urlDisplay}${payloadDisplay}${responseDisplay}${diagnosticDisplay}${outputDisplay}${errorDisplay}</div>` : ''}
    </div>`;
  }).join('');

  // Toggle expand on row click
  list.querySelectorAll('.entry-row').forEach((row) => {
    row.addEventListener('click', () => {
      const entry = row.closest('.entry');
      if (entry.querySelector('.entry-details')) {
        entry.classList.toggle('open');
      }
    });
  });
}

document.getElementById('btn-panel').addEventListener('click', () => {
  chrome.windows.getCurrent((win) => {
    chrome.sidePanel.open({ windowId: win.id });
  });
});

function loadCombinedLog() {
  Promise.all([
    new Promise((resolve) => chrome.runtime.sendMessage({ type: 'REQUEST_LOG' }, (data) => resolve(chrome.runtime.lastError ? [] : (data?.log || [])))),
    new Promise((resolve) => chrome.runtime.sendMessage({ type: 'LOGDD_GROK_LOG' }, (data) => resolve(chrome.runtime.lastError ? [] : (data?.log || [])))),
  ]).then(([flowEntries, grokEntries]) => {
    const combined = [
      ...flowEntries.map((entry) => ({ ...entry, provider: 'Flow' })),
      ...grokEntries.map((entry) => ({ ...entry, provider: 'Grok' })),
    ].sort((a, b) => new Date(b.time || b.timestamp || 0) - new Date(a.time || a.timestamp || 0));
    renderLog(combined);
  });
}

function renderGrokQuota() {
  const summary = document.getElementById('grok-quota-summary');
  const dot = document.getElementById('grok-quota-dot');
  const known = Boolean(_grokQuotaStatus?.checkedAt);
  if (!known) {
    summary.textContent = t('popup.grokQuotaChecking');
    dot.className = 'status-dot neutral';
    return;
  }
  if (!_grokQuotaStatus.videoAvailable) {
    summary.textContent = t('popup.grokQuotaUnavailable');
    dot.className = 'status-dot bad';
    return;
  }
  summary.textContent = t('popup.grokQuotaAvailable', {
    resolution: t(_grokQuotaStatus.video720pAvailable ? 'popup.grokQuota720pAvailable' : 'popup.grokQuota720pUnavailable'),
  });
  dot.className = 'status-dot ok';
}

function loadGrokQuota() {
  chrome.runtime.sendMessage({ type: 'LOGDD_GROK_STATUS' }, (data) => {
    if (chrome.runtime.lastError) return;
    _grokQuotaStatus = data?.quotaStatus || null;
    renderGrokQuota();
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (['REQUEST_LOG_UPDATE', 'LOGDD_GROK_LOG_PUSH'].includes(message?.type)) loadCombinedLog();
  if (message?.type === 'LOGDD_GROK_STATUS_PUSH') loadGrokQuota();
});

loadCombinedLog();
loadGrokQuota();

window.LongddI18n?.onChange(() => {
  renderLog(_popupLogEntries);
  renderGrokQuota();
});
