import type { GoogleFlowCredential } from '../packages/ai-core/providers/google-flow/types';
import type { CanvasNodeState, NodeOutput } from './types';

export function findUpscaleSource(nodes: CanvasNodeState[], url: string): NodeOutput | undefined {
  return nodes.flatMap((node) => [...(node.output ? [node.output] : []), ...(node.batchOutputs || []), ...(node.outputs || [])])
    .find((output) => output.url === url && output.kind === 'image' && !!output.mediaId && output.provider !== 'qwen-local');
}

/** Older Canvas results only saved an email/task ID; recover their owner when possible. */
export function imageUpscaleOwner(
  output: NodeOutput, accounts: GoogleFlowCredential[], fallbackOwner?: string,
  details?: Record<string, unknown>,
): string | undefined {
  if (output.ownerScopeId) return output.ownerScopeId;
  const credentialId = output.credentialId || details?.credentialId;
  const byCredential = typeof credentialId === 'string' ? accounts.find((account) => account.credentialId === credentialId) : undefined;
  if (byCredential) return byCredential.ownerScopeId;
  if (output.accountEmail) {
    // Never send another account's private media ID to the currently selected account.
    return accounts.find((account) => account.email?.toLowerCase() === output.accountEmail!.toLowerCase())?.ownerScopeId;
  }
  if (credentialId) return undefined;
  return fallbackOwner;
}

export function canUpscaleImage4K(account: GoogleFlowCredential | undefined, ultraOwners: readonly string[]): boolean {
  return !!account && (account.tier === 'PAYGATE_TIER_TWO' || ultraOwners.includes(account.ownerScopeId));
}
