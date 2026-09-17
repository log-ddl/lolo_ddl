import { useEffect } from 'react';
import { UserRound } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useGoogleFlowRuntimeStore } from '@/features/video-studio/stores/google-flow-runtime-store';
import type { CanvasNodeState } from '@/features/video-studio/canvas/types';

export function NodeAccountPicker({ state, onChange, disabled }: {
  state: CanvasNodeState; onChange: (patch: Partial<CanvasNodeState>) => void; disabled: boolean;
}) {
  const { t } = useI18n();
  const status = useGoogleFlowRuntimeStore((store) => store.status);
  const initialize = useGoogleFlowRuntimeStore((store) => store.initialize);
  useEffect(() => initialize(), [initialize]);
  const accounts = [...new Map((status?.credentials || []).map((account) => [account.ownerScopeId, account])).values()];
  const label = (email: string) => email.split('@')[0];
  return <div className="canvas-node-controls flex items-center gap-1.5 px-3 pb-1.5">
    <UserRound className="size-3 shrink-0 text-muted-foreground" />
    <select aria-label={t('canvas.account')} title={t(state.accountOwnerScopeId ? 'canvas.account.fixedHint' : 'canvas.account.autoHint')}
      disabled={disabled} value={state.accountOwnerScopeId || ''}
      onChange={(event) => {
        const account = accounts.find((item) => item.ownerScopeId === event.target.value);
        onChange({ accountOwnerScopeId: account?.ownerScopeId, accountLabel: account?.email ? label(account.email) : account?.accountId });
      }}
      className="nodrag nopan min-w-0 flex-1 truncate rounded-full bg-muted/50 px-2 py-1 text-2xs outline-none transition-colors hover:bg-muted focus:ring-1 focus:ring-primary disabled:opacity-50">
      <option value="">{t('canvas.account.auto')}</option>
      {state.accountOwnerScopeId && !accounts.some((account) => account.ownerScopeId === state.accountOwnerScopeId) &&
        <option value={state.accountOwnerScopeId}>{state.accountLabel || state.accountOwnerScopeId} · {t('canvas.account.offline')}</option>}
      {accounts.map((account) => <option key={account.ownerScopeId} value={account.ownerScopeId}>
        {label(account.email || account.accountId || account.ownerScopeId)}{account.state === 'ready' ? '' : ` · ${t('canvas.account.offline')}`}
      </option>)}
    </select>
  </div>;
}
