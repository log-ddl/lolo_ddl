/**
 * Model fallback for Google Flow generation.
 *
 * Google meters each (account × model) pair separately, so "everyone is out of
 * Veo Fast for today" says nothing about Veo Lite or Omni. When the runtime
 * reports that every allowed account is locked for the requested model, the work
 * is retried on the next model in the job's chain instead of failing the shot.
 *
 * Only that one condition moves the chain forward. A moderation refusal, a
 * timeout or a dead extension would hit the same wall on every model, so those
 * propagate immediately.
 */

// Relative with the extension so `node --experimental-strip-types` can run the test
// beside this file without a bundler resolving the `@/` alias.
import { isAllAccountsQuotaLocked } from '../packages/ai-core/providers/google-flow/types.ts';

/** Head model plus its fallbacks, trimmed and de-duplicated, order preserved. */
export function buildModelChain(primary: string | undefined, fallbacks: string[] | undefined): string[] {
  const chain = [primary, ...(fallbacks || [])]
    .map((model) => (model || '').trim())
    .filter((model) => model.length > 0);
  return [...new Set(chain)];
}

export interface ModelFallbackResult<T> {
  result: T;
  /** Model that actually produced the output. */
  model: string;
  /** True when the head of the chain was not the one that worked. */
  fellBack: boolean;
}

export async function runWithModelFallback<T>(
  chain: string[],
  attempt: (model: string, modelIndex: number) => Promise<T>,
  onFallback?: (fromModel: string, toModel: string, error: unknown) => void,
): Promise<ModelFallbackResult<T>> {
  // An empty chain still runs once: the caller's default model applies.
  const models = chain.length > 0 ? chain : [''];
  let lastError: unknown = new Error('Model chain produced no attempt');
  for (let index = 0; index < models.length; index += 1) {
    try {
      return { result: await attempt(models[index], index), model: models[index], fellBack: index > 0 };
    } catch (error) {
      if (!isAllAccountsQuotaLocked(error)) throw error;
      lastError = error;
      const next = models[index + 1];
      if (!next) break;
      onFallback?.(models[index], next, error);
    }
  }
  throw lastError;
}
