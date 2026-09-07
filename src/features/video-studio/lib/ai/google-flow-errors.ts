import {
  FLOW_ALL_ACCOUNTS_QUOTA_LOCKED,
  FLOW_NO_ALLOWED_ACCOUNT,
} from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

const CODED_ERRORS = [FLOW_ALL_ACCOUNTS_QUOTA_LOCKED, FLOW_NO_ALLOWED_ACCOUNT];

export function getGoogleFlowUserFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Coded failures already carry both a machine tag and a written explanation.
  // Keep them intact: callers decide on the tag (fall back to another model,
  // stop and tell the user which accounts to reconnect), and the generic quota
  // branch below would flatten all of that into one vague sentence.
  if (CODED_ERRORS.some((code) => message.includes(code))) return message;
  if (/no ready|extension/i.test(message)) return 'Tiện ích Google Flow chưa kết nối với ứng dụng. Hãy mở Google Flow trong Chrome rồi kết nối lại tiện ích LONGDD.';
  if (/captcha/i.test(message)) return `Google Flow không vượt qua được CAPTCHA: ${message.replace(/^CAPTCHA:\s*/i, '')}`;
  if (/token|flow_key|401|403/i.test(message)) return 'Phiên Google Flow đã hết hạn. Hãy tải lại trang Google Flow rồi thử lại.';
  if (/quota|credit|429/i.test(message)) return 'Tài khoản Google Flow không còn hạn mức hoặc tín dụng khả dụng.';
  if (/moderation|safety/i.test(message)) return 'Google Flow đã từ chối nội dung này vì chính sách an toàn.';
  if (/timed out/i.test(message)) return 'Google Flow xử lý quá thời gian. Tác vụ đã được dừng trên máy.';
  return message;
}

/** Drop the machine tag before a message is shown to the user or written to a log. */
export function stripFlowErrorCode(message: string): string {
  for (const code of CODED_ERRORS) {
    if (message.startsWith(`${code}: `)) return message.slice(code.length + 2);
  }
  return message;
}
