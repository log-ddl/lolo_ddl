/**
 * LONGDD Flow UI translations.
 * This module only manages text displayed by popup.html and side_panel.html.
 */
(function () {
  const STORAGE_KEY = 'longddUiLanguage';

  const messages = {
    vi: {
      'language.label': 'Chọn ngôn ngữ',
      'language.vietnamese': 'Tiếng Việt',
      'language.english': 'English',
      'language.switchToEnglish': 'Chuyển sang Tiếng Anh',
      'language.switchToVietnamese': 'Chuyển sang Tiếng Việt',
      'brand.bridge': 'Cầu nối Google Flow',
      'brand.runtime': 'Trình chạy Google Flow',
      'common.activity': 'Hoạt động',
      'common.emptyTitle': 'Chưa có yêu cầu',
      'common.emptyDescription': 'Hoạt động tạo nội dung sẽ hiển thị tại đây.',
      'common.close': 'Đóng',
      'popup.openPanel': 'Mở bảng điều khiển',
      'popup.recentRequests': 'Yêu cầu gần đây',
      'popup.footer': 'Chọn một yêu cầu để xem chi tiết',
      'popup.grokQuotaChecking': 'Grok: đang kiểm tra hạn mức…',
      'popup.grokQuotaAvailable': 'Grok Video: còn lượt (720p: {resolution})',
      'popup.grokQuotaUnavailable': 'Grok Video: đã hết lượt',
      'popup.grokQuota720pAvailable': 'còn lượt',
      'popup.grokQuota720pUnavailable': 'hết lượt',
      'panel.connectionStatus': 'Trạng thái kết nối',
      'panel.toggleConnection': 'Bật hoặc tắt kết nối Flow',
      'panel.runtimeOverview': 'Tổng quan hoạt động',
      'panel.generationBridge': 'Cầu nối tạo nội dung',
      'panel.requests': 'Yêu cầu',
      'panel.completed': 'Hoàn tất',
      'panel.failed': 'Thất bại',
      'panel.liveActivity': 'Hoạt động trực tiếp',
      'panel.requestLog': 'Nhật ký yêu cầu',
      'panel.openFlow': 'Mở Google Flow',
      'panel.refreshToken': 'Làm mới token',
      'panel.opening': 'Đang mở...',
      'panel.companion': 'Tiện ích đồng hành LONGDD Desktop',
      'panel.requestInspector': 'Kiểm tra yêu cầu',
      'panel.requestDetail': 'Chi tiết yêu cầu',
      'panel.requestTitle': 'Yêu cầu {id}',
      'toggle.on': 'BẬT',
      'toggle.off': 'TẮT',
      'state.off': 'tắt',
      'state.idle': 'sẵn sàng',
      'state.running': 'đang chạy',
      'token.none': 'chưa có token',
      'token.expired': 'token đã hết hạn — mở Flow để làm mới',
      'token.synced': 'đã đồng bộ token {minutes} phút',
      'status.done': 'xong',
      'status.failed': 'lỗi',
      'status.generating': 'đang tạo...',
      'status.sent': 'đã gửi',
      'phase.queued': 'Đang chờ',
      'phase.checkingMedia': 'Kiểm tra ảnh và mediaId đã lưu',
      'phase.uploadingMedia': 'Đang tải ảnh lên Google Flow',
      'phase.mediaReady': 'Ảnh tham chiếu đã sẵn sàng',
      'phase.uploading': 'Đang chuẩn bị ảnh',
      'phase.submitting': 'Đang gửi yêu cầu tạo',
      'phase.polling': 'Google Flow đang xử lý',
      'phase.downloading': 'Đang tải kết quả về',
      'phase.completed': 'Hoàn tất',
      'phase.failed': 'Thất bại',
      'phase.cancelled': 'Đã hủy',
      'detail.id': 'ID',
      'detail.type': 'Loại',
      'detail.time': 'Thời gian',
      'detail.status': 'Trạng thái',
      'detail.http': 'HTTP',
      'detail.url': 'URL',
      'detail.payload': 'Dữ liệu gửi',
      'detail.response': 'Phản hồi',
      'detail.error': 'Lỗi',
      'detail.progress': 'Tiến độ',
      'detail.diagnostic': 'Phản hồi trạng thái gần nhất',
      'detail.output': 'Kết quả',
      'detail.model': 'Mô hình thực tế',
      'type.generateImage': 'TẠO ẢNH',
      'type.regenerateImage': 'TẠO LẠI ẢNH',
      'type.editImage': 'SỬA ẢNH',
      'type.generateReference': 'TẠO ẢNH MẪU',
      'type.regenerateReference': 'TẠO LẠI ẢNH MẪU',
      'type.editReference': 'SỬA ẢNH MẪU',
      'type.generateVideo': 'TẠO VIDEO',
      'type.generateVideoRefs': 'VIDEO TỪ ẢNH MẪU',
      'type.upscaleVideo': 'NÂNG CẤP VIDEO',
      'type.upscaleImage': 'NÂNG CẤP ẢNH',
      'type.poll': 'KIỂM TRA VIDEO',
      'type.credits': 'KIỂM TRA CREDIT',
      'type.createProject': 'TẠO DỰ ÁN',
      'type.upload': 'TẢI ẢNH LÊN',
      'type.media': 'ĐỌC MEDIA',
      'type.tracking': 'THEO DÕI FLOW',
      'type.urlRefresh': 'LÀM MỚI URL',
      'type.trpc': 'TRPC',
      'type.api': 'API',
    },
    en: {
      'language.label': 'Choose language',
      'language.vietnamese': 'Tiếng Việt',
      'language.english': 'English',
      'language.switchToEnglish': 'Switch to English',
      'language.switchToVietnamese': 'Switch to Vietnamese',
      'brand.bridge': 'Google Flow bridge',
      'brand.runtime': 'Google Flow runtime',
      'common.activity': 'Activity',
      'common.emptyTitle': 'No requests yet',
      'common.emptyDescription': 'Generation activity will appear here.',
      'common.close': 'Close',
      'popup.openPanel': 'Open panel',
      'popup.recentRequests': 'Recent requests',
      'popup.footer': 'Select a request to view details',
      'popup.grokQuotaChecking': 'Grok: checking usage limit…',
      'popup.grokQuotaAvailable': 'Grok Video: available (720p: {resolution})',
      'popup.grokQuotaUnavailable': 'Grok Video: usage limit reached',
      'popup.grokQuota720pAvailable': 'available',
      'popup.grokQuota720pUnavailable': 'unavailable',
      'panel.connectionStatus': 'Connection status',
      'panel.toggleConnection': 'Toggle Flow connection',
      'panel.runtimeOverview': 'Runtime overview',
      'panel.generationBridge': 'Generation bridge',
      'panel.requests': 'Requests',
      'panel.completed': 'Completed',
      'panel.failed': 'Failed',
      'panel.liveActivity': 'Live activity',
      'panel.requestLog': 'Request log',
      'panel.openFlow': 'Open Google Flow',
      'panel.refreshToken': 'Refresh token',
      'panel.opening': 'Opening...',
      'panel.companion': 'LONGDD Desktop companion',
      'panel.requestInspector': 'Request inspector',
      'panel.requestDetail': 'Request detail',
      'panel.requestTitle': 'Request {id}',
      'toggle.on': 'ON',
      'toggle.off': 'OFF',
      'state.off': 'off',
      'state.idle': 'idle',
      'state.running': 'running',
      'token.none': 'no token',
      'token.expired': 'token expired — open Flow to refresh',
      'token.synced': 'token synced {minutes}m',
      'status.done': 'done',
      'status.failed': 'fail',
      'status.generating': 'gen...',
      'status.sent': 'sent',
      'phase.queued': 'Queued',
      'phase.checkingMedia': 'Checking saved images and media IDs',
      'phase.uploadingMedia': 'Uploading images to Google Flow',
      'phase.mediaReady': 'Reference images are ready',
      'phase.uploading': 'Preparing images',
      'phase.submitting': 'Submitting generation request',
      'phase.polling': 'Google Flow is processing',
      'phase.downloading': 'Downloading result',
      'phase.completed': 'Completed',
      'phase.failed': 'Failed',
      'phase.cancelled': 'Cancelled',
      'detail.id': 'ID',
      'detail.type': 'Type',
      'detail.time': 'Time',
      'detail.status': 'Status',
      'detail.http': 'HTTP',
      'detail.url': 'URL',
      'detail.payload': 'Payload',
      'detail.response': 'Response',
      'detail.error': 'Error',
      'detail.progress': 'Progress',
      'detail.diagnostic': 'Latest status response',
      'detail.output': 'Output',
      'detail.model': 'Actual model',
      'type.generateImage': 'GEN IMAGE',
      'type.regenerateImage': 'REGEN IMAGE',
      'type.editImage': 'EDIT IMAGE',
      'type.generateReference': 'GEN REF',
      'type.regenerateReference': 'REGEN REF',
      'type.editReference': 'EDIT REF',
      'type.generateVideo': 'GEN VIDEO',
      'type.generateVideoRefs': 'GEN VIDEO FROM REFS',
      'type.upscaleVideo': 'UPSCALE VIDEO',
      'type.upscaleImage': 'UPSCALE IMAGE',
      'type.poll': 'CHECK GEN VIDEO',
      'type.credits': 'CHECK CREDIT',
      'type.createProject': 'CREATE PROJECT',
      'type.upload': 'UPLOAD IMAGE',
      'type.media': 'READ MEDIA',
      'type.tracking': 'GOOGLE FLOW TRACK',
      'type.urlRefresh': 'URL REFRESH',
      'type.trpc': 'TRPC',
      'type.api': 'API',
    },
  };

  messages.vi['type.syncReferences'] = 'ĐỒNG BỘ THAM CHIẾU';
  messages.en['type.syncReferences'] = 'SYNC REFERENCES';

  let currentLanguage = 'vi';
  const listeners = new Set();

  function t(key, params = {}) {
    const template = messages[currentLanguage][key] || messages.en[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, name) => (
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`
    ));
  }

  function applyTranslations(root = document) {
    document.documentElement.lang = currentLanguage;

    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.title = t(element.dataset.i18nTitle);
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });
    root.querySelectorAll('[data-language-toggle]').forEach((button) => {
      const nextLanguage = currentLanguage === 'en' ? 'vi' : 'en';
      const label = nextLanguage === 'en'
        ? t('language.switchToEnglish')
        : t('language.switchToVietnamese');
      const nextLanguageElement = button.querySelector('[data-language-next]');
      if (nextLanguageElement) nextLanguageElement.textContent = nextLanguage.toUpperCase();
      button.title = label;
      button.setAttribute('aria-label', label);
    });
  }

  function notify() {
    listeners.forEach((listener) => listener(currentLanguage));
  }

  function setLanguage(language, persist = true) {
    const nextLanguage = language === 'en' ? 'en' : 'vi';
    const changed = nextLanguage !== currentLanguage;
    currentLanguage = nextLanguage;
    applyTranslations();

    if (persist && globalThis.chrome?.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: currentLanguage });
    }
    if (changed) notify();
  }

  function init() {
    document.querySelectorAll('[data-language-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        setLanguage(currentLanguage === 'en' ? 'vi' : 'en');
      });
    });

    applyTranslations();
    if (globalThis.chrome?.storage?.local) {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) return;
        setLanguage(result?.[STORAGE_KEY] || 'vi', false);
      });
    }
  }

  window.LongddI18n = {
    get language() { return currentLanguage; },
    t,
    setLanguage,
    applyTranslations,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
