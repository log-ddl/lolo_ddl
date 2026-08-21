import { useProjectStore } from '@/features/video-studio/stores/project-store';
import type { GoogleFlowCredential, GoogleFlowProjectBinding, GoogleFlowStatus } from '@/features/video-studio/packages/ai-core/providers/google-flow/types';

export interface ResolvedFlowBinding {
  /** Video Studio project ID. This is what generation runtime APIs expect. */
  longddProjectId: string;
  /** Actual remote Google Flow project ID, used only as a media-reference hint. */
  flowProjectId: string;
  binding: GoogleFlowProjectBinding;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function readyCredential(status: GoogleFlowStatus): GoogleFlowCredential | undefined {
  return status.credentials.find((credential) => credential.state === 'ready');
}

async function ensureReadyStatus(runtime: NonNullable<Window['googleFlowRuntime']>): Promise<GoogleFlowStatus> {
  let status = await runtime.getStatus();
  if (!status.running) throw new Error('Google Flow chưa chạy. Mở Settings → Google Flow để khởi động.');
  if (status.readyCredentialCount > 0 && readyCredential(status)) return status;

  const accounts = await runtime.listInAppAccounts().catch(() => []);
  if (accounts.length > 0) {
    await runtime.refreshInAppAccounts().catch(() => ({ ok: false }));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await wait(750);
      status = await runtime.getStatus();
      if (status.readyCredentialCount > 0 && readyCredential(status)) return status;
    }
  }
  throw new Error('Google Flow chưa lấy được token mới. Bấm “Hiện” để kiểm tra đăng nhập tài khoản Flow rồi chạy lại.');
}

function pickBinding(bindings: GoogleFlowProjectBinding[], ownerScopeId: string): GoogleFlowProjectBinding | undefined {
  return bindings.find((binding) => binding.ownerScopeId === ownerScopeId && binding.active && binding.connected)
    || bindings.find((binding) => binding.ownerScopeId === ownerScopeId && binding.connected)
    || bindings.find((binding) => binding.active && binding.connected)
    || bindings.find((binding) => binding.connected);
}

/** Resolve the current project and create its Flow project automatically when missing. */
export async function resolveFlowProjectBinding(
  runtime: NonNullable<Window['googleFlowRuntime']>,
  requestedProjectId?: string,
): Promise<ResolvedFlowBinding> {
  const projectStore = useProjectStore.getState();
  const longddProjectId = requestedProjectId || projectStore.activeProjectId;
  if (!longddProjectId) throw new Error('Chưa có dự án Video Studio đang mở.');

  const status = await ensureReadyStatus(runtime);
  const credential = readyCredential(status);
  if (!credential) throw new Error('Google Flow chưa có tài khoản sẵn sàng.');

  const existing = pickBinding(await runtime.listProjectBindings(longddProjectId), credential.ownerScopeId);
  if (existing) return { longddProjectId, flowProjectId: existing.flowProjectId, binding: existing };

  const projectName = projectStore.projects.find((project) => project.id === longddProjectId)?.name || 'Video Studio';
  const binding = await runtime.createProjectBinding({
    longddProjectId,
    credentialId: credential.credentialId,
    title: projectName,
  });
  return { longddProjectId, flowProjectId: binding.flowProjectId, binding };
}
