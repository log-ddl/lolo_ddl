/**
 * Routing a job across (account × model) pairs.
 *
 * Two different things decide where a shot runs, and they must not be confused:
 *
 * - The account allowlist ("dùng tài khoản nào") is the user's budget choice.
 * - The per-account model maps ("tài khoản này chạy model nào, theo thứ tự nào")
 *   say what each account may run. For video this is partly a fact about the
 *   account — Omni Flash and the low-priority Veo keys exist on some Flow
 *   accounts and not others, and asking for a model an account lacks answers 404,
 *   which no retry and no failover can fix. For images it is the user's own
 *   policy, e.g. keeping one account's Nano Pro quota for something else.
 *
 * The list is ordered: it is that account's run order, most preferred first. The
 * runtime walks each account's own chain, so an account is never dragged down to
 * a worse model just because a different account ran out of quota.
 *
 * A model no allowed account runs is dropped from the shared chain before the
 * first request, so the chain spends its attempts on models that can actually run.
 */

/**
 * ownerScopeId → models that account runs, most preferred first.
 * A missing entry means "runs everything, in the shared order".
 */
export type AccountModelMap = Record<string, string[]>;

/** Historical name for {@link AccountModelMap}, kept because it is a persisted settings key. */
export type AccountVideoModelMap = AccountModelMap;

export interface AccountRouting {
  /** Accounts image work may use. `undefined` = no restriction. */
  imageAccounts: string[] | undefined;
  /** Accounts that run this image model. `undefined` = no restriction. */
  imageAccountsFor(model: string): string[] | undefined;
  /** Accounts that run this video model. `undefined` = no restriction. */
  videoAccountsFor(model: string): string[] | undefined;
  /** The chain minus models no allowed account runs, order preserved. */
  filterImageChain(chain: string[]): string[];
  filterVideoChain(chain: string[]): string[];
  /**
   * Accounts a generation call for this model may use. `undefined` = no restriction.
   *
   * In `quality` mode this is the accounts that run this exact model, so the job
   * walks the shared chain one model at a time across every account. In `speed`
   * mode the model is ignored and every account still switched on is returned,
   * because there the runtime picks each account's model itself from
   * {@link modelChainsFor} — narrowing by one model up front would put the job
   * back on a single shared order and defeat the point.
   */
  accountsFor(kind: 'image' | 'video', model: string): string[] | undefined;
  /**
   * ownerScopeId → that account's run order for this kind, in `speed` mode.
   * Accounts the user never configured inherit `sharedChain`, so every account
   * has a real chain to walk instead of quietly collapsing to one model.
   *
   * Empty in `quality` mode: there the order belongs to the job, not the account,
   * and handing the runtime a chain would let an account move on by itself.
   */
  modelChainsFor(kind: 'image' | 'video', sharedChain: string[]): Record<string, string[]>;
}

/**
 * Which runs out first when quota does: the model, or the account.
 *
 * - `quality`: model first. Every account is used up on model 1 before anything
 *   touches model 2, so one video does not mix two models — at the cost of an
 *   account sitting idle once it is out of quota for the model in play.
 * - `speed`: account first. An account out of model 1 drops to its own model 2
 *   and keeps going, so no lane idles — at the cost of shots in one video coming
 *   from different models.
 */
export type MediaRoutingMode = 'quality' | 'speed';

export interface AccountRoutingInput {
  /** Every account the runtime knows about right now, as `ownerScopeId`s. */
  connectedOwnerScopeIds: string[];
  /** Accounts the job may use. Empty/missing = every connected account. */
  flowAccounts?: string[];
  accountVideoModels?: AccountModelMap;
  accountImageModels?: AccountModelMap;
  /** Missing = `quality`, which is how every job routed before the mode existed. */
  routingMode?: MediaRoutingMode;
}

function clean(list: string[] | undefined): string[] {
  return [...new Set((list || []).map((item) => (item || '').trim()).filter(Boolean))];
}

export function buildAccountRouting(input: AccountRoutingInput): AccountRouting {
  const picked = clean(input.flowAccounts);
  const restricted = picked.length > 0;
  const allowed = restricted ? picked : clean(input.connectedOwnerScopeIds);
  const mode: MediaRoutingMode = input.routingMode === 'speed' ? 'speed' : 'quality';

  /**
   * An empty list is dropped rather than read as "runs nothing".
   *
   * The picker cannot show that state or get out of it — a row with nothing
   * picked is how "follows the shared order" looks — so keeping it would leave a
   * setting the user can neither see nor undo. To take an account off a kind
   * entirely, switch the account off.
   */
  const normalize = (map: AccountModelMap | undefined): AccountModelMap => {
    const out: AccountModelMap = {};
    for (const [ownerScopeId, models] of Object.entries(map || {})) {
      const list = clean(models);
      if (list.length) out[ownerScopeId.trim()] = list;
    }
    return out;
  };
  const imageMap = normalize(input.accountImageModels);
  const videoMap = normalize(input.accountVideoModels);
  const mapFor = (kind: 'image' | 'video') => (kind === 'image' ? imageMap : videoMap);

  // No entry = not configured = runs everything. Being permissive by default keeps
  // an account the user never opened this panel for working exactly as before.
  const runs = (kind: 'image' | 'video', ownerScopeId: string, model: string): boolean => {
    const own = mapFor(kind)[ownerScopeId];
    return !own ? true : own.includes(model);
  };

  const accountsFor = (kind: 'image' | 'video', model: string): string[] | undefined => {
    const eligible = allowed.filter((ownerScopeId) => runs(kind, ownerScopeId, model));
    // Nothing is being narrowed: stay on "no restriction" so an account that
    // connects mid-run can still pick the work up, which is what a job with no
    // account settings has always done.
    if (!restricted && eligible.length === allowed.length) return undefined;
    return eligible;
  };

  const filterChain = (kind: 'image' | 'video', chain: string[]) => {
    const usable = chain.filter((model) => {
      const accounts = accountsFor(kind, model);
      return accounts === undefined || accounts.length > 0;
    });
    // Every model in the chain is unrunnable — a misconfiguration rather than a
    // routing decision. Keep the chain as written so the run fails with the
    // runtime's own message instead of a silent no-op.
    return usable.length > 0 ? usable : chain;
  };

  return {
    imageAccounts: restricted ? picked : undefined,
    imageAccountsFor: (model: string) => accountsFor('image', model),
    videoAccountsFor: (model: string) => accountsFor('video', model),
    filterImageChain: (chain: string[]) => filterChain('image', chain),
    filterVideoChain: (chain: string[]) => filterChain('video', chain),
    // In speed mode every allowed account is eligible whatever the model: the
    // runtime picks each account's model itself from modelChainsFor.
    accountsFor: (kind: 'image' | 'video', model: string) =>
      (mode === 'quality' ? accountsFor(kind, model) : (restricted ? picked : undefined)),
    modelChainsFor: (kind: 'image' | 'video', sharedChain: string[]) => {
      if (mode === 'quality') return {};
      const map = mapFor(kind);
      const shared = clean(sharedChain);
      const chains: Record<string, string[]> = {};
      for (const ownerScopeId of allowed) {
        const chain = map[ownerScopeId] ? clean(map[ownerScopeId]) : shared;
        if (chain.length) chains[ownerScopeId] = chain;
      }
      return chains;
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
