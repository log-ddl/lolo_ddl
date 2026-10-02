import { useEffect, useState } from 'react';
import { Check, Copy, Plug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n';

export type McpStatus = {
  enabled: boolean; running: boolean; url: string; token: string; error: string | null;
  lastClient: string | null; lastSeen: string | null;
  activity: Array<{ name: string; time: string; ok: boolean }>; tools: string[];
};

export function McpConnectionsPanel() {
  const { language } = useI18n();
  const vi = language === 'vi';
  const text = (viText: string, enText: string) => vi ? viText : enText;
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [format, setFormat] = useState('codex');
  const [rotate, setRotate] = useState(false);
  useEffect(() => {
    let mounted = true;
    const refresh = () => window.contentMcp?.status().then((next) => {
      if (mounted) { setStatus(next); setError(''); }
    }).catch((e) => { if (mounted) setError(String(e)); });
    void refresh();
    const timer = setInterval(refresh, 3000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); setError(''); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const copy = async (value: string, id: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(id); setTimeout(() => setCopied(''), 2500); }
    catch { toast.error(text('Không thể sao chép. Vui lòng thử lại.', 'Could not copy. Please try again.')); }
  };
  if (!window.contentMcp) return <p className="text-sm text-muted-foreground">{text('Mở bản desktop để kết nối AI.', 'Open the desktop app to connect AI clients.')}</p>;
  if (!status) return <p role="status" className="text-sm">{error || text('Đang tải kết nối…', 'Loading connection…')}</p>;
  const connection = { url: status.url, headers: { Authorization: `Bearer ${status.token}` } };
  const config = format === 'codex'
    ? `[mcp_servers.logdd]\nurl = "${status.url}"\nhttp_headers = { Authorization = "Bearer ${status.token}" }\ntool_timeout_sec = 600\n`
    : JSON.stringify(format === 'antigravity'
    ? { mcpServers: { logdd: { serverUrl: status.url, headers: connection.headers } } }
    : format === 'opencode'
    ? { mcp: { logdd: { type: 'remote', ...connection, enabled: true } } }
    : { mcpServers: { logdd: { ...(format === 'claude' ? { type: 'http' } : {}), ...connection } } }, null, 2);
  return <div className="space-y-5">
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3"><Plug className="mt-1 size-5 text-primary" /><div>
          <h3 className="font-semibold">{text('Dùng AI bên ngoài với logdd', 'Use external AI with logdd')}</h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">{text('Kết nối một lần. Những lần sau chỉ cần mở logdd và ứng dụng AI trên cùng máy.', 'Connect once. Next time, just open logdd and your AI app on this computer.')}</p>
        </div></div>
        <Button variant={status.enabled ? 'outline' : 'default'} disabled={busy} onClick={() => void act(async () => { setStatus(await window.contentMcp!.setEnabled(!status.enabled)); })}>
          {status.enabled ? text('Tắt kết nối', 'Disable') : text('Bật kết nối', 'Enable')}
        </Button>
      </div>
      <p role="status" className="mt-4 flex items-center gap-2 text-sm">
        <span className={`size-2 rounded-full ${status.running ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {status.running ? text('Sẵn sàng kết nối • Tự chạy khi mở app', 'Ready to connect • Starts with app') : text('Chưa chạy', 'Not running')}
      </p>
      {(error || status.error) && <div role="alert" className="mt-3 space-y-2 text-sm text-destructive"><p>{error || status.error}</p><Button variant="outline" disabled={busy} onClick={() => void act(async () => { setStatus(await window.contentMcp!.setEnabled(true)); })}>{text('Thử chạy lại', 'Retry startup')}</Button></div>}
    </section>
    <section className="space-y-4 rounded-xl border p-5">
      <h3 className="text-sm font-semibold">{text('1. Thêm logdd vào ứng dụng AI', '1. Add logdd to your AI app')}</h3>
      <p className="text-sm text-muted-foreground">{text('Trong cài đặt MCP của AI, thêm server HTTP bằng URL và Authorization bên dưới, hoặc dán cấu hình theo định dạng đã chọn. Giữ nguyên các server khác nếu đã có.', 'In your AI app’s MCP settings, add an HTTP server using the URL and Authorization below, or paste the configuration in the selected format. Keep existing servers when merging.')}</p>
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-3"><code className="min-w-0 flex-1 break-all text-xs">{status.url || '—'}</code><Button size="sm" variant="outline" disabled={!status.running} onClick={() => void copy(status.url, 'url')}>{copied === 'url' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}URL</Button><Button size="sm" variant="outline" disabled={!status.running} onClick={() => void copy(`Bearer ${status.token}`, 'token')}>{copied === 'token' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}Authorization</Button></div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">{text('Định dạng', 'Format')}<select className="rounded-md border bg-background px-3 py-2" value={format} onChange={(event) => { setFormat(event.target.value); setCopied(''); }}><option value="codex">Codex</option><option value="antigravity">Antigravity</option><option value="http">HTTP / Cursor</option><option value="claude">Claude Code</option><option value="opencode">OpenCode</option></select></label>
        <Button disabled={!status.running} onClick={() => void copy(config, 'config')}>{copied === 'config' ? <Check className="size-4" /> : <Copy className="size-4" />}{copied === 'config' ? text('Đã sao chép', 'Copied') : text('Sao chép cấu hình', 'Copy configuration')}</Button>
      </div>
      {format === 'codex' && <p className="text-xs text-muted-foreground">{text('Dán vào ~/.codex/config.toml, rồi mở chat mới hoặc khởi động lại Codex.', 'Paste into ~/.codex/config.toml, then start a new chat or restart Codex.')}</p>}
      {format === 'antigravity' && <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
        <p>{text('Trong Antigravity IDE: mở menu ⋯ của Agent → MCP Servers → Manage MCP Servers → View raw config.', 'In Antigravity IDE: open the Agent ⋯ menu → MCP Servers → Manage MCP Servers → View raw config.')}</p>
        <p>{text('Thêm mục logdd vào mcpServers trong file vừa mở, giữ lại các server hiện có. Lưu rồi tải lại danh sách MCP. Giữ logdd mở trên cùng máy.', 'Add logdd under mcpServers in the opened file, keeping existing servers. Save and reload the MCP server list. Keep logdd open on the same computer.')}</p>
        <p className="text-xs text-muted-foreground">{text('Antigravity dùng serverUrl; cấu hình sao chép ở đây đã dùng đúng định dạng này.', 'Antigravity uses serverUrl; the copied configuration already uses this format.')}</p>
      </div>}
      <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">{text('Xem cấu hình (ẩn khóa kết nối)', 'Preview configuration (key hidden)')}</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-3">{config.replace(status.token, '••••••••')}</pre></details>
      <p className="text-xs text-muted-foreground">{text('Cấu hình đã sao chép chứa khóa truy cập app. Chỉ dán vào AI bạn tin cậy. Dùng với AI hỗ trợ MCP HTTP cục bộ; AI chỉ kết nối từ cloud sẽ không truy cập được địa chỉ này.', 'Copied configuration includes the app access key. Paste only into a trusted AI client. Requires local MCP HTTP support; cloud-only clients cannot reach this address.')}</p>
    </section>
    <section className="space-y-3 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{text('2. Kiểm tra và bắt đầu', '2. Check and start')}</h3><Button variant="outline" size="sm" disabled={busy || !status.running} onClick={() => void act(async () => { const result = await window.contentMcp!.test(); toast.success(text(`MCP hoạt động · ${result.count} công cụ`, `MCP is working · ${result.count} tools`)); })}><RefreshCw className="size-3.5" />{text('Kiểm tra server', 'Test server')}</Button></div>
      <p className="text-sm text-muted-foreground">{text('Gửi cho AI: “Dùng logdd kiểm tra CPU và RAM của máy.”', 'Ask your AI: “Use logdd to check my CPU and RAM.”')}</p>
      <p className="text-sm">{status.lastClient ? `${text('AI gần nhất', 'Last AI client')}: ${status.lastClient}` : text('Chưa có AI kết nối. Kiểm tra server chỉ kiểm tra nội bộ.', 'No AI has connected yet. The server test is a local check only.')}</p>
      <p className="text-xs text-muted-foreground">{text('Tạo ảnh: Google Flow. Tạo video: Google Flow. Đăng nhập nhà cung cấp trong Video Studio trước; tác vụ có thể dùng credit. AI cần truyền model và có thể hỏi tiến độ hoặc hủy tác vụ. Qwen và TTS chưa được nối qua MCP.', 'Images: Google Flow. Videos: Google Flow. Sign in to the provider in Video Studio first; jobs may consume credits. AI must supply a model and can check progress or cancel. Qwen and TTS are not exposed through MCP yet.')}</p>
      <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">{text('Công cụ có sẵn', 'Available tools')} ({status.tools.length})</summary><div className="mt-2 flex flex-wrap gap-2">{status.tools.map((tool) => <code key={tool} className="rounded bg-muted px-2 py-1">{tool}</code>)}</div></details>
      {status.activity.length > 0 && <div className="max-h-36 overflow-auto border-t pt-3" aria-label={text('Hoạt động gần đây', 'Recent activity')}>{status.activity.map((item, index) => <div key={`${item.time}-${index}`} className="flex justify-between gap-2 py-1 text-xs"><code>{item.name}</code><span className={item.ok ? 'text-muted-foreground' : 'text-destructive'}>{new Date(item.time).toLocaleTimeString()} · {item.ok ? text('OK', 'OK') : text('Lỗi', 'Error')}</span></div>)}</div>}
    </section>
    <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">{text('Quản lý khóa kết nối', 'Manage access key')}</summary><p className="my-3">{text('Đổi khóa sẽ ngắt quyền truy cập của cấu hình cũ. Sau đó sao chép lại cấu hình vào AI.', 'Rotating the key revokes old configurations. Copy the new configuration into your AI afterward.')}</p>{rotate ? <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void act(async () => { setStatus(await window.contentMcp!.rotateToken()); setCopied(''); setRotate(false); })}>{text('Xác nhận đổi khóa', 'Confirm rotation')}</Button><Button size="sm" variant="ghost" onClick={() => setRotate(false)}>{text('Hủy', 'Cancel')}</Button></div> : <Button size="sm" variant="outline" onClick={() => setRotate(true)}>{text('Đổi khóa truy cập', 'Rotate key')}</Button>}</details>
  </div>;
}
