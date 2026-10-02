import { useEffect } from 'react';
import { UserRound } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';
import type { CanvasNodeState } from '@/features/video-studio/canvas/types';

export function NodeAccountPicker({ state, onChange, disabled, model, kind }: {
  state: CanvasNodeState; onChange: (patch: Partial<CanvasNodeState>) => void; disabled: boolean;
  model: string; kind: 'image' | 'video';
}) {
  const { t } = useI18n();
  const flowStatus = useGoogleFlowRuntimeStore((store) => store.status);
  const initializeFlow = useGoogleFlowRuntimeStore((store) => store.initialize);
  const mediaRouting = useVideoStudioSettingsStore((store) => store.mediaRouting);
  useEffect(() => initializeFlow(), [initializeFlow]);
  const accountModels = kind === 'video' ? mediaRouting.accountVideoModels : mediaRouting.accountImageModels;
  const accounts = [...new Map((flowStatus?.credentials || []).map((account) => [account.ownerScopeId, account])).values()]
    .filter((account) => !accountModels[account.ownerScopeId]?.length || accountModels[account.ownerScopeId].includes(model));
  const label = (email: string) => email.split('@')[0];
  const selectedId = state.accountOwnerScopeId;
  return <div className="canvas-node-controls flex items-center gap-1.5 px-3 pb-1.5">
    <UserRound className="size-3 shrink-0 text-muted-foreground" />
    <select aria-label={`${t('canvas.account')} · Google Flow`} title={t(selectedId ? 'canvas.account.fixedHint' : 'canvas.account.autoHint')}
      disabled={disabled} value={selectedId || ''}
      onChange={(event) => {
        const account = accounts.find((item) => item.ownerScopeId === event.target.value);
        onChange({ accountOwnerScopeId: account?.ownerScopeId, accountLabel: account?.email ? label(account.email) : account?.accountId });
      }}
      className="nodrag nopan min-w-0 flex-1 truncate rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none transition-colors hover:bg-muted focus:ring-1 focus:ring-primary disabled:opacity-50">
      <option value="">{t('canvas.account.auto')}</option>
      {!accounts.length && !selectedId && <option value="__none__" disabled>Chưa kết nối tài khoản Google Flow</option>}
      {selectedId && !accounts.some((account) => account.ownerScopeId === selectedId) &&
        <option value={selectedId} disabled>{state.accountLabel || selectedId} · {(kind === 'video' ? mediaRouting.accountVideoModels : mediaRouting.accountImageModels)[selectedId]?.length ? 'không hỗ trợ model hoặc mất kết nối' : t('canvas.account.offline')}</option>}
      {accounts.map((account) => <option key={account.ownerScopeId} value={account.ownerScopeId}>
        {label(account.email || account.accountId || account.ownerScopeId)}{account.state === 'ready' ? '' : ` · ${t('canvas.account.offline')}`}
      </option>)}
    </select>
  </div>;
}
