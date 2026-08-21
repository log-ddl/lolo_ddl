export function getGoogleFlowUserFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/no ready|extension/i.test(message)) return 'Tiện ích Google Flow chưa kết nối với ứng dụng. Hãy mở Google Flow trong Chrome rồi kết nối lại tiện ích LONGDD.';
  if (/captcha/i.test(message)) return `Google Flow không vượt qua được CAPTCHA: ${message.replace(/^CAPTCHA:\s*/i, '')}`;
  if (/token|flow_key|401|403/i.test(message)) return 'Phiên Google Flow đã hết hạn. Hãy tải lại trang Google Flow rồi thử lại.';
  if (/quota|credit|429/i.test(message)) return 'Tài khoản Google Flow không còn hạn mức hoặc tín dụng khả dụng.';
  if (/moderation|safety/i.test(message)) return 'Google Flow đã từ chối nội dung này vì chính sách an toàn.';
  if (/timed out/i.test(message)) return 'Google Flow xử lý quá thời gian. Tác vụ đã được dừng trên máy.';
  return message;
}
