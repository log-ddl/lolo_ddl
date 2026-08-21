/**
 * Adaptive batch processor.
 *
 * Responsibility: split a large item set into AI-safe batches while respecting both
 * input-token and output-token budgets.
 *
 * Core capabilities:
 * - dual-constraint batching (input + output)
 * - 60K hard cap to avoid excessive TTFT / lost-in-the-middle failures
 * - failure isolation (one batch can fail while others still succeed)
 * - per-batch retry via the shared lane-manager.withRetry
 * - concurrency integration via runStaggered and maxStudioLanes.textApiBatchConcurrency
 * - progress callbacks
 */

import type { AIFeature } from '@/features/video-studio/stores/api-config-store';
import { useAPIConfigStore } from '@/features/video-studio/stores/api-config-store';
import { callFeatureAPI, type CallFeatureAPIOptions } from '@/features/video-studio/lib/ai/feature-router';
import { getModelLimits, estimateTokens } from '@/features/video-studio/lib/ai/model-registry';
import { runStaggered } from '@/features/video-studio/lib/utils/concurrency';
import { withRetry } from '@/features/video-studio/lib/ai/lane-manager';
import { useVideoStudioSettingsStore } from '@/features/video-studio/stores/video-studio-settings-store';

// ==================== Constants ====================

/** Hard cap of 60K input tokens per batch, regardless of model context size. */
const HARD_CAP_TOKENS = 60000;

/** Base retry delay in milliseconds for exponential backoff. */
const RETRY_BASE_DELAY = 3000;

// ==================== Types ====================

export interface ProcessBatchedOptions<TItem, TResult> {
  /** All items to process. */
  items: TItem[];

  /** AI feature key used to resolve routing/config from feature-router. */
  feature: AIFeature;

  /**
   * Build prompts for a batch. Called once per batch and should include any required global context.
   */
  buildPrompts: (batch: TItem[]) => { system: string; user: string };

  /**
   * Parse the raw AI response into structured results.
   * Returns Map<itemKey, result> so results can be merged across batches.
   */
  parseResult: (raw: string, batch: TItem[]) => Map<string, TResult>;

  /**
   * Optional custom merge logic. Defaults to a simple overwrite merge.
   */
  mergeResults?: (all: Map<string, TResult>[]) => Map<string, TResult>;

  /**
   * Estimate the input-token cost of one item.
   * Defaults to estimateTokens(JSON.stringify(item)).
   */
  estimateItemTokens?: (item: TItem) => number;

  /**
   * Estimate the output-token cost of one item for output-budget checks.
   * Defaults to 300 tokens per item.
   */
  estimateItemOutputTokens?: (item: TItem) => number;

  /**
   * Optional extra options passed into callFeatureAPI (temperature, maxTokens, etc.).
   */
  apiOptions?: CallFeatureAPIOptions;

  /**
   * Progress callback.
   */
  onProgress?: (completed: number, total: number, message: string) => void;
}

export interface ProcessBatchedResult<TResult> {
  /** Merged final results. */
  results: Map<string, TResult>;
  /** Number of failed batches. */
  failedBatches: number;
  /** Total batch count. */
  totalBatches: number;
}

// ==================== Core ====================

/**
 * Adaptive batched AI execution.
 *
 * Automatically performs:
 * 1. model limit lookup from the registry
 * 2. greedy batching under input + output constraints
 * 3. staggered concurrent execution
 * 4. per-batch retry with failure isolation
 * 5. result merging
 */
export async function processBatched<TItem, TResult>(
  opts: ProcessBatchedOptions<TItem, TResult>,
): Promise<ProcessBatchedResult<TResult>> {
  const {
    items,
    feature,
    buildPrompts,
    parseResult,
    mergeResults,
    estimateItemTokens,
    estimateItemOutputTokens,
    apiOptions,
    onProgress,
  } = opts;

  // Fast return for empty input.
  if (items.length === 0) {
    return { results: new Map(), failedBatches: 0, totalBatches: 0 };
  }

  // === 1. Read model limits ===
  const store = useAPIConfigStore.getState();
  const providerInfo = store.getProviderForFeature(feature);
  const modelName = providerInfo?.model?.[0] || '';
  const limits = getModelLimits(modelName);

  const inputBudget = Math.min(Math.floor(limits.contextWindow * 0.6), HARD_CAP_TOKENS);
  const outputBudget = Math.floor(limits.maxOutput * 0.8); // Reserve 20% for JSON overhead.

  console.log(
    `[BatchProcessor] ${feature}: model=${modelName}, ` +
    `ctx=${limits.contextWindow}, maxOutput=${limits.maxOutput}, ` +
    `inputBudget=${inputBudget}, outputBudget=${outputBudget}, ` +
    `items=${items.length}`,
  );

  // === 2. Estimate system-prompt token cost using the first item as a sample ===
  const samplePrompts = buildPrompts([items[0]]);
  const systemPromptTokens = estimateTokens(samplePrompts.system);

  // === 3. Greedy batching under dual constraints ===
  const defaultItemTokenEstimator = (item: TItem) => estimateTokens(JSON.stringify(item));
  const defaultItemOutputEstimator = () => 300; // Default: 300 output tokens per item.

  const getItemTokens = estimateItemTokens || defaultItemTokenEstimator;
  const getItemOutputTokens = estimateItemOutputTokens || defaultItemOutputEstimator;

  const batches = createBatches(
    items,
    getItemTokens,
    getItemOutputTokens,
    inputBudget,
    outputBudget,
    systemPromptTokens,
  );

  console.log(
    `[BatchProcessor] Batch result: ${batches.length} batches ` +
    `(${batches.map(b => b.length).join(', ')} items)`,
  );

  // A single batch does not need staggered concurrency.
  if (batches.length === 1) {
    onProgress?.(0, 1, `Processing (1/1)...`);
    try {
      const result = await executeBatchWithRetry(
        batches[0], feature, buildPrompts, parseResult, apiOptions,
      );
      onProgress?.(1, 1, 'Done');
      return { results: result, failedBatches: 0, totalBatches: 1 };
    } catch (err) {
      console.error('[BatchProcessor] Single batch failed:', err);
      onProgress?.(1, 1, 'Failed');
      return { results: new Map(), failedBatches: 1, totalBatches: 1 };
    }
  }

  // === 4. Execute with staggered concurrency ===
  const concurrency = Math.max(
    1,
    Math.floor(useVideoStudioSettingsStore.getState().maxStudioLanes?.textApiBatchConcurrency ?? 1),
  );
  let completedCount = 0;

  const batchTasks = batches.map((batch, idx) => {
    return async () => {
      onProgress?.(completedCount, batches.length, `Processing batch ${idx + 1}/${batches.length}...`);
      const result = await executeBatchWithRetry(
        batch, feature, buildPrompts, parseResult, apiOptions,
      );
      completedCount++;
      onProgress?.(completedCount, batches.length, `Batch ${idx + 1} done`);
      return result;
    };
  });

  const settled = await runStaggered(batchTasks, concurrency, 5000);

  // === 5. Merge with fault tolerance ===
  const successResults: Map<string, TResult>[] = [];
  let failedBatches = 0;

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      successResults.push(result.value);
    } else {
      failedBatches++;
      console.error('[BatchProcessor] Batch failed:', result.reason);
    }
  }

  if (failedBatches > 0) {
    console.warn(`[BatchProcessor] ${failedBatches}/${batches.length} batches failed. Returning partial results.`);
  }

  // Merge results.
  let finalResults: Map<string, TResult>;
  if (mergeResults) {
    finalResults = mergeResults(successResults);
  } else {
    finalResults = new Map();
    for (const map of successResults) {
      for (const [key, value] of map) {
        finalResults.set(key, value);
      }
    }
  }

  onProgress?.(batches.length, batches.length, `Done (${failedBatches > 0 ? `${failedBatches} failed batches` : 'all succeeded'})`);

  return { results: finalResults, failedBatches, totalBatches: batches.length };
}

// ==================== Batch Splitting ====================

/**
 * Greedy batching under dual constraints.
 *
 * Constraint 1 (input): each batch must satisfy systemPromptTokens + sum(itemTokens) <= inputBudget
 * Constraint 2 (output): sum(itemOutputTokens) <= outputBudget
 *
 * Greedy strategy: keep adding items until one constraint would overflow, then start a new batch.
 * If a single item exceeds the budget, it still forms a one-item batch.
 */
function createBatches<TItem>(
  items: TItem[],
  getItemTokens: (item: TItem) => number,
  getItemOutputTokens: (item: TItem) => number,
  inputBudget: number,
  outputBudget: number,
  systemPromptTokens: number,
): TItem[][] {
  const batches: TItem[][] = [];
  let currentBatch: TItem[] = [];
  let currentInputTokens = systemPromptTokens; // Every batch includes the system prompt.
  let currentOutputTokens = 0;

  for (const item of items) {
    const itemInput = getItemTokens(item);
    const itemOutput = getItemOutputTokens(item);

    const wouldExceedInput = currentInputTokens + itemInput > inputBudget;
    const wouldExceedOutput = currentOutputTokens + itemOutput > outputBudget;

    if (currentBatch.length > 0 && (wouldExceedInput || wouldExceedOutput)) {
      // Current batch is full, so start a new one.
      batches.push(currentBatch);
      currentBatch = [];
      currentInputTokens = systemPromptTokens;
      currentOutputTokens = 0;
    }

    currentBatch.push(item);
    currentInputTokens += itemInput;
    currentOutputTokens += itemOutput;
  }

  // Flush the final batch.
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// ==================== Batch Execution ====================

/**
 * Execute a single batch with retry (exponential backoff, shared with every
 * other pipeline via lane-manager.withRetry).
 */
async function executeBatchWithRetry<TItem, TResult>(
  batch: TItem[],
  feature: AIFeature,
  buildPrompts: (batch: TItem[]) => { system: string; user: string },
  parseResult: (raw: string, batch: TItem[]) => Map<string, TResult>,
  apiOptions?: CallFeatureAPIOptions,
): Promise<Map<string, TResult>> {
  return withRetry(
    {
      attempts: 3, // 1 + MAX_BATCH_RETRIES
      baseDelayMs: RETRY_BASE_DELAY,
      retryable: (error: unknown) => (error as any)?.code !== 'TOKEN_BUDGET_EXCEEDED',
      onRetry: (nextAttempt, error) => {
        console.warn(
          `[BatchProcessor] Batch execution failed (attempt ${nextAttempt - 1}/3), ` +
          `retrying: ${error instanceof Error ? error.message : String(error)}`,
        );
      },
    },
    async () => {
      const { system, user } = buildPrompts(batch);
      const raw = await callFeatureAPI(feature, system, user, apiOptions);
      return parseResult(raw, batch);
    },
  );
}
