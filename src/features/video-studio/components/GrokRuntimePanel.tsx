"use client";

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useGrokRuntimeStore } from '@/features/video-studio/stores/grok-runtime-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import type { VideoStudioInAppAccount } from '@/shared/types/electron';

const statusLabel: Record<string, string> = {
  queued: 'Đang chờ',
  submitting: 'Đang gửi',
  polling: 'Đang tạo',
  downloading: 'Đang tải về',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

function credentialQuotaLabel(credential: { state: string; weeklyUsagePercent?: number }) {
  if (credential.state === 'ready' || credential.state === 'exhausted') {
    if (typeof credential.weeklyUsagePercent === 'number') {
      const percent = Math.round(Math.max(0, Math.min(100, credential.weeklyUsagePercent)));
      return credential.state === 'exhausted'
        ? `Đã dùng ${percent}% · Hết lượt`
        : `Đã dùng ${percent}%`;
    }
    return credential.state === 'ready' ? 'Sẵn sàng' : 'Hết lượt tạo video';
  }
  if (credential.state === 'checking') return 'Đang kiểm tra lượt';
  if (credential.state === 'disconnected') return 'Mất kết nối';
  return 'Đã nối, chưa nhận tab Grok';
}

export function GrokRuntimePanel({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const { status, tasks, initialize, refresh, clearFinished } = useGrokRuntimeStore();
  const hideLoginBrowser = useVideoStudioSettingsStore((state) => state.hideLoginBrowser);
  const setHideLoginBrowser = useVideoStudioSettingsStore((state) => state.setHideLoginBrowser);
  const videoLanesPerExtension = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoLanesPerJwt);
  const videoSubmitDelayMinMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoSubmitDelayMinMs);
  const videoSubmitDelayMaxMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoSubmitDelayMaxMs);
  const extensionStartStaggerMinMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.jwtStartStaggerMinMs);
  const extensionStartStaggerMaxMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.jwtStartStaggerMaxMs);
  const [inAppAccounts, setInAppAccounts] = useState<VideoStudioInAppAccount[]>([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [removingAccount, setRemovingAccount] = useState<string | null>(null);
  useEffect(() => initialize(), [initialize]);
  const refreshInAppAccounts = useCallback(async () => {
    if (!window.grokVideoRuntime) return;
    try { setInAppAccounts(await window.grokVideoRuntime.listInAppAccounts()); }
    catch (error) { console.warn('[Grok] Không thể đọc danh sách tài khoản trong app:', error); }
  }, []);
  useEffect(() => { void refreshInAppAccounts(); }, [refreshInAppAccounts, status?.readyCredentialCount]);
  useEffect(() => { void window.videoStudioBrowser?.setHideAfterLogin(hideLoginBrowser); }, [hideLoginBrowser]);
  const addInAppAccount = useCallback(async () => {
    if (!window.grokVideoRuntime) return;
    setAddingAccount(true);
    try {
      await window.grokVideoRuntime.addInAppAccount();
      toast.success('Đã mở cửa sổ đăng nhập Grok trong ứng dụng.');
      await refreshInAppAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể mở cửa sổ đăng nhập.');
    } finally { setAddingAccount(false); }
  }, [refreshInAppAccounts]);
  const removeInAppAccount = useCallback(async (accountSlotId: string) => {
    if (!window.grokVideoRuntime) return;
    setRemovingAccount(accountSlotId);
    try {
      await window.grokVideoRuntime.removeInAppAccount(accountSlotId);
      await refreshInAppAccounts();
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gỡ tài khoản.');
    } finally { setRemovingAccount(null); }
  }, [refresh, refreshInAppAccounts]);
  useEffect(() => {
    void window.grokVideoRuntime?.updateSettings({
      videoLanesPerExtension,
      videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs,
      extensionStartStaggerMinMs,
      extensionStartStaggerMaxMs,
    });
  }, [videoLanesPerExtension, videoSubmitDelayMinMs, videoSubmitDelayMaxMs, extensionStartStaggerMinMs, extensionStartStaggerMaxMs]);
  const taskList = Object.values(tasks);
  const preloadAvailable = typeof window !== 'undefined' && Boolean(window.grokVideoRuntime);
  const ready = Boolean(status?.readyCredentialCount);

  if (!alwaysVisible && !ready && !taskList.length) return null;

  let diagnostic = '';
  if (!preloadAvailable) {
    diagnostic = 'Phiên ứng dụng hiện tại chưa nạp Grok runtime. Hãy đóng hẳn và mở lại ứng dụng desktop.';
  } else if (!status?.running) {
    diagnostic = 'Runtime Grok chưa chạy. Hãy khởi động lại ứng dụng desktop.';
  } else if (!ready) {
    const credentials = status?.credentials || [];
    diagnostic = credentials.length > 0 && credentials.every((credential) => credential.state === 'exhausted')
      ? 'Tất cả tài khoản Grok đã hết lượt tạo video.'
      : credentials.some((credential) => credential.state === 'checking')
        ? 'Đang kiểm tra lượt tạo video còn lại của tài khoản Grok.'
        : inAppAccounts.length
          ? 'Đang chờ đăng nhập Grok trong cửa sổ vừa mở. Sau khi đăng nhập vào grok.com/imagine, trạng thái sẽ chuyển "Sẵn sàng".'
          : 'Bấm “+ Thêm tài khoản” để đăng nhập Grok ngay trong ứng dụng.';
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {ready ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
            Kết nối Grok Video
          </div>
          <div className="mt-1 text-2xs text-muted-foreground">
            Runtime: {status?.running ? 'đang chạy' : 'chưa chạy'} · Cổng {status?.port || 9223} · {status?.readyCredentialCount || 0} extension · {status?.videoLaneCount || 0} lane video
          </div>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" className="h-7 text-2xs" disabled={addingAccount} onClick={() => void addInAppAccount()}>
            {addingAccount ? 'Đang mở…' : '+ Thêm tài khoản'}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Kiểm tra lại" onClick={() => { void refresh(); void refreshInAppAccounts(); }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-2xs text-muted-foreground">
        <input
          type="checkbox"
          className="h-3.5 w-3.5"
          checked={hideLoginBrowser}
          onChange={(event) => setHideLoginBrowser(event.target.checked)}
        />
        Ẩn cửa sổ Chrome sau khi đăng nhập xong (dùng nút “Hiện” khi cần đăng nhập lại)
      </label>
      {inAppAccounts.length > 0 && (
        <div className="space-y-1">
          {inAppAccounts.map((account) => (
            <div key={account.accountSlotId} className="flex items-center justify-between gap-2 rounded border bg-background/70 px-2 py-1.5 text-2xs">
              <span>Tài khoản trong app · {account.accountSlotId.slice(0, 8)}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-2xs"
                  onClick={() => void window.grokVideoRuntime?.showInAppAccount(account.accountSlotId)}
                >Hiện</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-2xs text-red-600 hover:text-red-600"
                  disabled={removingAccount === account.accountSlotId}
                  onClick={() => void removeInAppAccount(account.accountSlotId)}
                >{removingAccount === account.accountSlotId ? 'Đang gỡ…' : 'Gỡ tài khoản'}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {diagnostic && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-2xs leading-relaxed text-amber-800 dark:text-amber-300">
          {diagnostic}
        </div>
      )}

      {status?.credentials.map((credential) => (
        <div key={credential.credentialId} className="flex items-center justify-between rounded border bg-background/70 px-2 py-1.5 text-2xs">
          <span>Extension {credential.extensionInstanceId.slice(0, 8)}</span>
          <span className={credential.state === 'ready' ? 'text-green-600' : credential.state === 'exhausted' ? 'text-red-600' : 'text-amber-600'}>
            {credentialQuotaLabel(credential)}
          </span>
        </div>
      ))}

      {taskList.slice(0, 8).map((task) => (
        <div key={task.taskId} className="rounded border bg-background/70 px-2 py-1.5 text-2xs">
          <div className="flex items-center justify-between gap-2">
            <span>Video · {typeof task.progress === 'number' ? `${task.progress}%` : '—'}</span>
            <Badge variant="secondary">{statusLabel[task.status] || task.status}</Badge>
          </div>
          {task.message && <div className="mt-1 line-clamp-2 text-2xs text-red-600">{task.message}</div>}
        </div>
      ))}

      {taskList.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-2xs" onClick={clearFinished}>
          Xóa tác vụ đã xong
        </Button>
      )}
    </div>
  );
}
