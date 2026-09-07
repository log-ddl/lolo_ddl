/**
 * Routing a job across (account × model) pairs.
 *
 * Two different things decide where a shot runs, and they must not be confused:
 *
 * - The account allowlist ("dùng tài khoản nào") is the user's budget choice.
 * - The per-account video-model map ("tài khoản này có model nào") is a fact about
 *   the account: Omni Flash and the low-priority Veo keys exist on some Flow
 *   accounts and not on others, and asking an account for a model it does not own
 *   answers 404 — an error no retry and no account failover can fix.
 *
 * Images need neither map: every Flow account can run every image model, so the
 * only thing to decide there is the order models are tried in.
 *
 * A model no allowed account owns is dropped from the chain before the first
 * request, so the chain spends its attempts on models that can actually run.
 */

/** ownerScopeId → video models that account owns. A missing entry means "owns everything". */
export type AccountVideoModelMap = Record<string, string[]>;

export interface AccountRouting {
  /** Accounts image work may use. `undefined` = no restriction. */
  imageAccounts: string[] | undefined;
  /** Accounts that own this video model. `undefined` = no restriction. */
  videoAccountsFor(model: string): string[] | undefined;
  /** The chain minus models no allowed account owns, order preserved. */
  filterVideoChain(chain: string[]): string[];
}

export interface AccountRoutingInput {
  /** Every account the runtime knows about right now, as `ownerScopeId`s. */
  connectedOwnerScopeIds: string[];
  /** Accounts the job may use. Empty/missing = every connected account. */
  flowAccounts?: string[];
  accountVideoModels?: AccountVideoModelMap;
}

function clean(list: string[] | undefined): string[] {
  return [...new Set((list || []).map((item) => (item || '').trim()).filter(Boolean))];
}

export function buildAccountRouting(input: AccountRoutingInput): AccountRouting {
  const picked = clean(input.flowAccounts);
  const restricted = picked.length > 0;
  const allowed = restricted ? picked : clean(input.connectedOwnerScopeIds);
  const capabilities = input.accountVideoModels || {};

  // No entry = not configured = owns everything. Being permissive by default keeps
  // an account the user never opened this panel for working exactly as before.
  const owns = (ownerScopeId: string, model: string): boolean => {
    const owned = capabilities[ownerScopeId];
    return !owned ? true : owned.includes(model);
  };

  const videoAccountsFor = (model: string): string[] | undefined => {
    const eligible = allowed.filter((ownerScopeId) => owns(ownerScopeId, model));
    // Nothing is being narrowed: stay on "no restriction" so an account that
    // connects mid-run can still pick the work up, which is what a job with no
    // account settings has always done.
    if (!restricted && eligible.length === allowed.length) return undefined;
    return eligible;
  };

  return {
    imageAccounts: restricted ? picked : undefined,
    videoAccountsFor,
    filterVideoChain: (chain: string[]) => {
      const usable = chain.filter((model) => {
        const accounts = videoAccountsFor(model);
        return accounts === undefined || accounts.length > 0;
      });
      // Every model in the chain is unowned — a misconfiguration rather than a
      // routing decision. Keep the chain as written so the run fails with the
      // runtime's own message instead of a silent no-op.
      return usable.length > 0 ? usable : chain;
    },
  };
}

/** Owner scopes the Google Flow runtime currently knows, connected or not. */
export async function listKnownOwnerScopeIds(
  runtime: NonNullable<Window['googleFlowRuntime']>,
): Promise<string[]> {
  const credentials = await runtime.listCredentials().catch(() => []);
  return clean(credentials.map((credential) => credential.ownerScopeId));
}
