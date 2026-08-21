"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import { useProjectStore } from '@/features/video-studio/stores/project-store';
import type { GoogleFlowProjectBinding } from '@/features/video-studio/packages/ai-core/providers/google-flow/types';
import type { VideoStudioInAppAccount } from '@/shared/types/electron';
import { toast } from 'sonner';

const statusClass: Record<string, string> = {
  queued: 'bg-muted text-muted-foreground', uploading: 'bg-blue-500/10 text-blue-600',
  submitting: 'bg-indigo-500/10 text-indigo-600', polling: 'bg-amber-500/10 text-amber-600',
  downloading: 'bg-cyan-500/10 text-cyan-600', completed: 'bg-green-500/10 text-green-600',
  failed: 'bg-red-500/10 text-red-600', cancelled: 'bg-muted text-muted-foreground',
};

const statusLabel: Record<string, string> = {
  queued: 'Đang chờ', uploading: 'Đang tải lên', submitting: 'Đang gửi', polling: 'Đang xử lý',
  downloading: 'Đang tải về', completed: 'Hoàn tất', failed: 'Thất bại', cancelled: 'Đã hủy',
};

const phaseLabel: Record<string, string> = {
  checking_media: 'Kiểm tra ảnh đã lưu',
  uploading_media: 'Tải ảnh lên Flow',
  media_ready: 'Ảnh đã sẵn sàng',
};

const credentialStateLabel: Record<string, string> = {
  ready: 'Sẵn sàng', stale: 'Cần làm mới', disconnected: 'Mất kết nối', blocked: 'Bị chặn',
};

// Tên gợi nhớ do người dùng đặt cho từng tài khoản trong app, lưu local theo
// accountSlotId. Với tài khoản in-app thì accountSlotId cũng chính là
// extensionInstanceId của credential, nên cùng một tên hiển thị được ở cả khối
// "Tài khoản trong app" lẫn khối "Tiện ích" bên dưới.
const ACCOUNT_LABELS_KEY = 'googleFlowAccountLabels';
function readAccountLabels(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_LABELS_KEY) || '{}'); } catch { return {}; }
}
function writeAccountLabels(labels: Record<string, string>): void {
  try { localStorage.setItem(ACCOUNT_LABELS_KEY, JSON.stringify(labels)); } catch { /* best-effort */ }
}

function formatFlowProjectLabel(binding: GoogleFlowProjectBinding, projectName?: string, showId = false): string {
  const rawTitle = binding.title?.trim() || '';
  const legacyInternalTitle = /^LONGDD\s+[0-9a-f]{8,}-[0-9a-f-]{20,}$/i.test(rawTitle);
  const cleanTitle = legacyInternalTitle
    ? projectName?.trim() || 'Dự án Flow'
    : rawTitle.replace(/^LONGDD\s+/i, '').trim() || projectName?.trim() || 'Dự án Flow';
  return showId ? `${cleanTitle} · ${binding.flowProjectId.slice(0, 8)}` : cleanTitle;
}

export function GoogleFlowRuntimePanel({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const { status, tasks, initialize, refresh, clearFinished } = useGoogleFlowRuntimeStore();
  const laneSettings = useVideoStudioSettingsStore((state) => state.maxStudioLanes);
  const hideLoginBrowser = useVideoStudioSettingsStore((state) => state.hideLoginBrowser);
  const setHideLoginBrowser = useVideoStudioSettingsStore((state) => state.setHideLoginBrowser);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProject = useProjectStore((state) => state.activeProject);
  const [projectBindings, setProjectBindings] = useState<GoogleFlowProjectBinding[]>([]);
  const [projectBusy, setProjectBusy] = useState<string | null>(null);
  const [inAppAccounts, setInAppAccounts] = useState<VideoStudioInAppAccount[]>([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [removingAccount, setRemovingAccount] = useState<string | null>(null);
  const [accountLabels, setAccountLabels] = useState<Record<string, string>>(() => readAccountLabels());
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const saveAccountLabel = useCallback((accountSlotId: string, rawName: string) => {
    const name = rawName.trim().slice(0, 40);
    setAccountLabels((prev) => {
      const next = { ...prev };
      if (name) next[accountSlotId] = name; else delete next[accountSlotId];
      writeAccountLabels(next);
      return next;
    });
    setEditingSlot(null);
  }, []);
  useEffect(() => initialize(), [initialize]);
  const refreshInAppAccounts = useCallback(async () => {
    if (!window.googleFlowRuntime) return;
    try { setInAppAccounts(await window.googleFlowRuntime.listInAppAccounts()); }
    catch (error) { console.warn('[GoogleFlow] Không thể đọc danh sách tài khoản trong app:', error); }
  }, []);
  useEffect(() => { void refreshInAppAccounts(); }, [refreshInAppAccounts, status?.readyCredentialCount]);
  useEffect(() => { void window.videoStudioBrowser?.setHideAfterLogin(hideLoginBrowser); }, [hideLoginBrowser]);
  const addInAppAccount = useCallback(async () => {
    if (!window.googleFlowRuntime) return;
    setAddingAccount(true);
    try {
      await window.googleFlowRuntime.addInAppAccount();
      toast.success('Đã mở cửa sổ đăng nhập Google Flow trong ứng dụng.');
      await refreshInAppAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể mở cửa sổ đăng nhập.');
    } finally { setAddingAccount(false); }
  }, [refreshInAppAccounts]);
  const removeInAppAccount = useCallback(async (accountSlotId: string) => {
    if (!window.googleFlowRuntime) return;
    setRemovingAccount(accountSlotId);
    try {
      await window.googleFlowRuntime.removeInAppAccount(accountSlotId);
      await refreshInAppAccounts();
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gỡ tài khoản.');
    } finally { setRemovingAccount(null); }
  }, [refresh, refreshInAppAccounts]);
  useEffect(() => {
    void window.googleFlowRuntime?.updateSettings({
      imageLanesPerToken: laneSettings.imageLanesPerJwt,
      videoLanesPerToken: laneSettings.videoLanesPerJwt,
      imageSubmitDelayMinMs: laneSettings.imageSubmitDelayMinMs,
      imageSubmitDelayMaxMs: laneSettings.imageSubmitDelayMaxMs,
      videoSubmitDelayMinMs: laneSettings.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: laneSettings.videoSubmitDelayMaxMs,
      accountStartStaggerMinMs: laneSettings.jwtStartStaggerMinMs,
      accountStartStaggerMaxMs: laneSettings.jwtStartStaggerMaxMs,
    });
  }, [laneSettings]);
  const refreshProjectBindings = useCallback(async () => {
    if (!alwaysVisible || !activeProjectId || !window.googleFlowRuntime) {
      setProjectBindings([]);
      return;
    }
    try { setProjectBindings(await window.googleFlowRuntime.listProjectBindings(activeProjectId)); }
    catch (error) { console.warn('[GoogleFlow] Không thể đọc danh sách Flow project:', error); }
  }, [activeProjectId, alwaysVisible]);
  useEffect(() => { void refreshProjectBindings(); }, [refreshProjectBindings, status?.readyCredentialCount]);

  const bindingsByOwner = useMemo(() => {
    const grouped = new Map<string, GoogleFlowProjectBinding[]>();
    for (const binding of projectBindings) {
      const list = grouped.get(binding.ownerScopeId) || [];
      list.push(binding);
      grouped.set(binding.ownerScopeId, list);
    }
    return grouped;
  }, [projectBindings]);

  const createFlowProject = useCallback(async (credentialId: string) => {
    if (!activeProjectId || !window.googleFlowRuntime) return;
    setProjectBusy(credentialId);
    try {
      const suffix = new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      await window.googleFlowRuntime.createProjectBinding({
        longddProjectId: activeProjectId,
        credentialId,
        title: `${activeProject?.name || 'Dự án Flow'} ${suffix}`,
      });
      await refreshProjectBindings();
      toast.success('Đã tạo và chuyển sang Flow project mới.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo Flow project mới.');
    } finally { setProjectBusy(null); }
  }, [activeProject?.name, activeProjectId, refreshProjectBindings]);

  const activateFlowProject = useCallback(async (credentialId: string, flowProjectId: string) => {
    if (!activeProjectId || !window.googleFlowRuntime) return;
    setProjectBusy(credentialId);
    try {
      await window.googleFlowRuntime.activateProjectBinding({ longddProjectId: activeProjectId, credentialId, flowProjectId });
      await refreshProjectBindings();
      toast.success('Đã chuyển Flow project đang hoạt động.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể chuyển Flow project.');
    } finally { setProjectBusy(null); }
  }, [activeProjectId, refreshProjectBindings]);
  const taskList = Object.values(tasks);
  if (!alwaysVisible && !status?.readyCredentialCount && !taskList.length) return null;
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium">Kết nối Google Flow</div>
          <div className="text-[11px] text-muted-foreground">
            {status?.readyCredentialCount || 0} tiện ích sẵn sàng · {status?.imageLaneCount || 0} luồng ảnh / {status?.videoLaneCount || 0} luồng video · giao thức v{status?.protocolVersion || 1}
          </div>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" disabled={addingAccount} onClick={() => void addInAppAccount()}>
            {addingAccount ? 'Đang mở…' : '+ Thêm tài khoản'}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => {
            void (async () => {
              await window.googleFlowRuntime?.refreshInAppAccounts();
              await new Promise((resolve) => setTimeout(resolve, 2500));
              await refresh();
              await refreshProjectBindings();
              await refreshInAppAccounts();
            })();
          }}>Làm mới</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={clearFinished}>Xóa đã xong</Button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
          {inAppAccounts.map((account) => {
            const shortId = account.accountSlotId.slice(0, 8);
            const custom = accountLabels[account.accountSlotId]?.trim();
            const editing = editingSlot === account.accountSlotId;
            return (
              <div key={account.accountSlotId} className="flex items-center justify-between gap-2 rounded border bg-background/70 px-2 py-1.5 text-[11px]">
                {editing ? (
                  <input
                    autoFocus
                    className="h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-[11px]"
                    value={draftName}
                    maxLength={40}
                    placeholder={`Tài khoản ${shortId}`}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveAccountLabel(account.accountSlotId, draftName);
                      if (event.key === 'Escape') setEditingSlot(null);
                    }}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate">
                    {custom ? `${custom} · ${shortId}` : `Tài khoản trong app · ${shortId}`}
                  </span>
                )}
                <div className="flex shrink-0 gap-1">
                  {editing ? (
                    <>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => saveAccountLabel(account.accountSlotId, draftName)}>Lưu</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingSlot(null)}>Hủy</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => { setEditingSlot(account.accountSlotId); setDraftName(custom || ''); }}
                      >Đổi tên</Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => void window.googleFlowRuntime?.showInAppAccount(account.accountSlotId)}
                      >Hiện</Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-red-600 hover:text-red-600"
                        disabled={removingAccount === account.accountSlotId}
                        onClick={() => void removeInAppAccount(account.accountSlotId)}
                      >{removingAccount === account.accountSlotId ? 'Đang gỡ…' : 'Gỡ tài khoản'}</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {status?.credentials.map((credential) => {
        const bindings = bindingsByOwner.get(credential.ownerScopeId) || [];
        const activeBinding = bindings.find((binding) => binding.active);
        const busy = projectBusy === credential.credentialId;
        return (
          <div key={credential.credentialId} className="rounded border bg-background/70 px-2 py-1.5 text-[11px] space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span>
                {accountLabels[credential.extensionInstanceId]?.trim() ? `${accountLabels[credential.extensionInstanceId].trim()} · ` : ''}
                Tiện ích {credential.extensionInstanceId.slice(0, 8)} · tài khoản {credential.credentialId.slice(0, 8)}
              </span>
              <span className="text-muted-foreground">{credential.tier || 'chưa rõ gói'} · {credential.credits ?? '—'} tín dụng · {credentialStateLabel[credential.state] || credential.state}</span>
            </div>
            {alwaysVisible && activeProjectId && (
              <div className="flex items-end gap-2 rounded border bg-muted/20 p-2">
                <label className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] text-muted-foreground">Flow project của dự án “{activeProject?.name || activeProjectId}”</span>
                  <select
                    className="h-8 w-full rounded border bg-background px-2 font-mono text-[11px]"
                    value={activeBinding?.flowProjectId || ''}
                    disabled={busy || !bindings.length}
                    onChange={(event) => { if (event.target.value) void activateFlowProject(credential.credentialId, event.target.value); }}
                  >
                    {!bindings.length && <option value="">Chưa tạo Flow project</option>}
                    {bindings.map((binding) => (
                      <option key={binding.flowProjectId} value={binding.flowProjectId}>
                        {formatFlowProjectLabel(binding, activeProject?.name, bindings.length > 1)}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 text-[11px]"
                  disabled={busy || credential.state !== 'ready'}
                  onClick={() => void createFlowProject(credential.credentialId)}
                >{busy ? 'Đang xử lý…' : 'Tạo project mới'}</Button>
              </div>
            )}
          </div>
        );
      })}
      <div className="space-y-1.5">
        {taskList.slice(0, 8).map((task) => (
          <div key={task.taskId} className="rounded border bg-background/70 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium">{task.kind === 'image' ? 'Ảnh' : task.kind === 'video' ? 'Video' : task.kind} · luồng {task.laneSlot || '—'}/{task.totalLanes || '—'}</span>
              <Badge variant="secondary" className={statusClass[task.status]}>{phaseLabel[task.phase || ''] || statusLabel[task.status] || task.status}</Badge>
            </div>
            {task.message && <div className="mt-1 text-[10px] text-red-600 line-clamp-1">{task.message}</div>}
          </div>
        ))}
      </div>
      {alwaysVisible && !status?.readyCredentialCount && !inAppAccounts.length && (
        <p className="text-[11px] text-muted-foreground">Bấm “+ Thêm tài khoản” để đăng nhập Google Flow ngay trong ứng dụng.</p>
      )}
      {alwaysVisible && activeProjectId && projectBindings.length > 0 && (
        <p className="text-[10px] text-muted-foreground">Đổi Flow project không xóa project hoặc Media ID cũ. Ảnh dùng trong project mới sẽ được tải lên một lần rồi tiếp tục dùng lại từ cache riêng của project đó.</p>
      )}
    </div>
  );
}
