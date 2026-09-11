import {
  FLOW_ACCOUNT_TAG_OPEN,
  FLOW_ALL_ACCOUNTS_QUOTA_LOCKED,
  FLOW_NO_ALLOWED_ACCOUNT,
} from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

const CODED_ERRORS = [FLOW_ALL_ACCOUNTS_QUOTA_LOCKED, FLOW_NO_ALLOWED_ACCOUNT];

/**
 * Split the account tag off a message so the reason can be rewritten without
 * losing the one detail every branch below would otherwise throw away: which of
 * the connected accounts this actually happened on.
 */
function splitAccountTag(message: string): { reason: string; tag: string } {
  const at = message.lastIndexOf(FLOW_ACCOUNT_TAG_OPEN);
  if (at === -1 || !message.trimEnd().endsWith(']')) return { reason: message, tag: '' };
  return { reason: message.slice(0, at).trimEnd(), tag: message.slice(at).trim() };
}

export function getGoogleFlowUserFacingError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const { reason: message, tag } = splitAccountTag(raw);
  const withTag = (text: string) => (tag ? `${text} ${tag}` : text);
  // Coded failures already carry both a machine tag and a written explanation.
  // Keep them intact: callers decide on the tag (fall back to another model,
  // stop and tell the user which accounts to reconnect), and the generic quota
  // branch below would flatten all of that into one vague sentence.
  if (CODED_ERRORS.some((code) => message.includes(code))) return withTag(message);
  if (/no ready|extension/i.test(message)) return withTag('Tiện ích Google Flow chưa kết nối với ứng dụng. Hãy mở Google Flow trong Chrome rồi kết nối lại tiện ích LONGDD.');
  if (/captcha/i.test(message)) return withTag(`Google Flow không vượt qua được CAPTCHA: ${message.replace(/^CAPTCHA:\s*/i, '')}`);
  if (/token|flow_key|401|403/i.test(message)) return withTag('Phiên Google Flow của tài khoản này đã hết hạn và Google không cấp lại. Mở Google Flow bằng tài khoản đó rồi đăng nhập lại, hoặc bỏ nó ra khỏi danh sách khi chạy.');
  if (/quota|credit|429/i.test(message)) return withTag('Tài khoản Google Flow không còn hạn mức hoặc tín dụng khả dụng.');
  if (/moderation|safety/i.test(message)) return withTag('Google Flow đã từ chối nội dung này vì chính sách an toàn.');
  if (/timed out/i.test(message)) return withTag('Google Flow xử lý quá thời gian. Tác vụ đã được dừng trên máy.');
  return raw;
}

/** Drop the machine tag before a message is shown to the user or written to a log. */
export function stripFlowErrorCode(message: string): string {
  for (const code of CODED_ERRORS) {
    if (message.startsWith(`${code}: `)) return message.slice(code.length + 2);
  }
  return message;
}
