import fs from 'node:fs';
import path from 'node:path';
export function errorSummary(error: unknown) {
  const text = error instanceof Error ? error.message : String(error || '');
  const http = text.match(/HTTP[ :]*(\d{3})/i)?.[1];
  const category = /401|UNAUTHENTICATED|UNAUTHORIZED/i.test(text) ? 'authentication'
    : /timeout|timed out|quá thời gian/i.test(text) ? 'timeout'
    : /quota|credit|RESOURCE_EXHAUSTED|429/i.test(text) ? 'quota'
    : /captcha/i.test(text) ? 'captcha'
    : /cancel|abort/i.test(text) ? 'cancelled'
    : /400|INVALID_ARGUMENT/i.test(text) ? 'invalid_request'
    : /403|PERMISSION_DENIED/i.test(text) ? 'permission'
    : /file|ENOENT|image data|source/i.test(text) ? 'media_input' : 'other';
  return { category, http: http ? Number(http) : undefined };
}
/** Metadata only: never write request bodies, prompts, media, cookies or tokens. */
export function writeFlowDiagnostic(directory: string | undefined, event: string, data: Record<string, unknown>) {
  if (!directory) return;
  try {
    fs.mkdirSync(directory, { recursive: true });
    const file = path.join(directory, 'google-flow-diagnostics.jsonl');
    if (fs.existsSync(file) && fs.statSync(file).size > 2_000_000) {
      fs.copyFileSync(file, file + '.previous'); fs.writeFileSync(file, '', 'utf8');
    }
    fs.appendFileSync(file, JSON.stringify({ time: new Date().toISOString(), pid: process.pid, event, ...data }) + '\n', 'utf8');
  } catch { /* Logging must never interrupt generation. */ }
}
