/**
 * Model Capability Registry
 *
 * Resolve contextWindow and maxOutput limits by model name.
 * Three lookup layers, from highest to lowest priority:
 *   1. Persistent cache learned from API errors
 *   2. Static registry with verified model limits
 *   3. Conservative _default fallback
 *
 * Design principles:
 *   - Match by model name, not by URL
 *   - Sort prefixes by descending length to avoid over-broad matches
 *   - Cover text/chat models only
 *   - Use conservative defaults for unknown models
 */

// ==================== Types ====================

export interface ModelLimits {
  /** Maximum input context window in tokens */
  contextWindow: number;
  /** Maximum output token count, typically the max_tokens limit */
  maxOutput: number;
}

/** Model limits discovered from API 400 errors and persisted to localStorage */
export interface DiscoveredModelLimits {
  maxOutput?: number;
  contextWindow?: number;
  /** Discovery timestamp */
  discoveredAt: number;
}

// ==================== Static Registry ====================

/**
 * Static registry containing verified model-limit data.
 *
 * Data sources:
 *   - DeepSeek: https://api-docs.deepseek.com/quick_start/pricing (V3.2 = 128K context)
 *   - GLM: https://bigmodel.cn/pricing + external validation (4.7 = 200K ctx / 128K output)
 *   - Gemini: https://ai.google.dev/gemini-api/docs/models + OCI docs (2.5 = 1M ctx / 65K output)
 *   - Others: conservative values
 *
 * Add new models only after checking official documentation.
 */
const STATIC_REGISTRY: Record<string, ModelLimits> = {
  // ==================== DeepSeek Series ====================
  // DeepSeek-V3.2: 128K context limit
  'deepseek-v3':            { contextWindow: 128000,   maxOutput: 8192   },
  'deepseek-v3.2':          { contextWindow: 128000,   maxOutput: 8192   },
  'deepseek-chat':          { contextWindow: 128000,   maxOutput: 8192   },
  'deepseek-r1':            { contextWindow: 128000,   maxOutput: 16384  },
  'deepseek-reasoner':      { contextWindow: 128000,   maxOutput: 16384  },

  // ==================== GLM Series ====================
  'glm-4.7':                { contextWindow: 200000,   maxOutput: 128000 },
  'glm-4.6v':               { contextWindow: 128000,   maxOutput: 8192   }, // Conservative
  'glm-4.5-flash':          { contextWindow: 128000,   maxOutput: 8192   }, // Conservative

  // ==================== Google Gemini Series ====================
  'gemini-2.5-flash':       { contextWindow: 1048576,  maxOutput: 65536  },
  'gemini-2.5-pro':         { contextWindow: 1048576,  maxOutput: 65536  },
  'gemini-3-flash-preview': { contextWindow: 1048576,  maxOutput: 65536  }, // Reuse 2.5 limits
  'gemini-3-pro-preview':   { contextWindow: 1048576,  maxOutput: 65536  },
  'gemini-2.0-flash':       { contextWindow: 1048576,  maxOutput: 8192   },

  // ==================== Other Models (Conservative) ====================
  'kimi-k2':                { contextWindow: 128000,   maxOutput: 8192   },
  'qwen3-max':              { contextWindow: 128000,   maxOutput: 8192   },
  'qwen3-max-preview':      { contextWindow: 128000,   maxOutput: 8192   },
  'minimax-m2.1':           { contextWindow: 128000,   maxOutput: 8192   },

  // ==================== Generic Prefix Rules ====================
  // Prefix matching runs in descending length order so more specific keys win first.
  'deepseek-':              { contextWindow: 128000,   maxOutput: 8192   },
  'gemini-':                { contextWindow: 1048576,  maxOutput: 65536  },
  'glm-':                   { contextWindow: 128000,   maxOutput: 8192   },
  'claude-':                { contextWindow: 200000,   maxOutput: 8192   },
  'gpt-':                   { contextWindow: 128000,   maxOutput: 16384  },
  'doubao-':                { contextWindow: 32000,    maxOutput: 4096   },

  // ==================== Default Values ====================
  '_default':               { contextWindow: 32000,    maxOutput: 4096   },
};

// Pre-sort keys by length descending for prefix matching
// Exclude '_default' from prefix search
const SORTED_KEYS = Object.keys(STATIC_REGISTRY)
  .filter(k => k !== '_default')
  .sort((a, b) => b.length - a.length);

// ==================== Discovery Cache Access ====================

// These are injected at runtime by the store (avoids circular dependency)
let _getDiscoveredLimits: ((model: string) => DiscoveredModelLimits | undefined) | null = null;
let _setDiscoveredLimits: ((model: string, limits: Partial<DiscoveredModelLimits>) => void) | null = null;

/**
 * Inject persistent-cache accessors, usually from api-config-store at startup.
 * This avoids a circular dependency between model-registry and api-config-store.
 */
export function injectDiscoveryCache(
  getter: (model: string) => DiscoveredModelLimits | undefined,
  setter: (model: string, limits: Partial<DiscoveredModelLimits>) => void,
): void {
  _getDiscoveredLimits = getter;
  _setDiscoveredLimits = setter;
}

// ==================== Core Lookup ====================

/**
 * Look up contextWindow and maxOutput for a model.
 */
export function getModelLimits(modelName: string): ModelLimits {
  const m = modelName.toLowerCase();

  // Layer 1: persistent discovery cache.
  if (_getDiscoveredLimits) {
    const discovered = _getDiscoveredLimits(m);
    if (discovered) {
      const staticFallback = lookupStatic(m);
      return {
        contextWindow: discovered.contextWindow ?? staticFallback.contextWindow,
        maxOutput: discovered.maxOutput ?? staticFallback.maxOutput,
      };
    }
  }

  // Layer 2 + 3: static registry -> _default.
  return lookupStatic(m);
}

/**
 * Look up static registry values only, without consulting the discovery cache.
 */
function lookupStatic(modelNameLower: string): ModelLimits {
  // Exact match.
  if (STATIC_REGISTRY[modelNameLower]) {
    return STATIC_REGISTRY[modelNameLower];
  }

  // Prefix match, ordered so the most specific prefix wins.
  for (const key of SORTED_KEYS) {
    if (modelNameLower.startsWith(key)) {
      return STATIC_REGISTRY[key];
    }
  }

  // Fallback.
  return STATIC_REGISTRY['_default'];
}

// ==================== Error-driven Discovery ====================

/**
 * Parse model limits from API 400 error messages.
 *
 * Supports common error formats across providers:
 *   - DeepSeek: "Invalid max_tokens value, the valid range of max_tokens is [1, 8192]"
 *   - OpenAI:   "maximum context length is 128000 tokens ... you requested 150000 tokens"
 *   - GLM:      "max_tokens must be less than or equal to 8192"
 *   - Generic:  variants such as "max_tokens ... 8192"
 *
 * @returns Parsed limits, which may include maxOutput, contextWindow, or both.
 *          Returns null when no numeric limits can be extracted.
 */
export function parseModelLimitsFromError(errorText: string): Partial<DiscoveredModelLimits> | null {
  const result: Partial<DiscoveredModelLimits> = {};
  let found = false;

  // --- Parse max_tokens / maxOutput ---
  // Pattern 1: "valid range of max_tokens is [1, 8192]"
  const rangeMatch = errorText.match(/valid\s+range.*?\[\s*\d+\s*,\s*(\d+)\s*\]/i);
  if (rangeMatch) {
    result.maxOutput = parseInt(rangeMatch[1], 10);
    found = true;
  }

  // Pattern 2: "max_tokens must be less than or equal to 8192" / "max_tokens ... <= 8192"
  if (!found) {
    const lteMatch = errorText.match(/max_tokens.*?(?:less than or equal to|<=|limit(?:ed)?\s+to|upper\s+limit\s+is)\s*(\d{3,6})/i);
    if (lteMatch) {
      result.maxOutput = parseInt(lteMatch[1], 10);
      found = true;
    }
  }

  // Pattern 3: generic fallback near the "max_tokens" token.
  if (!found) {
    const genericMatch = errorText.match(/max_tokens.*?\b(\d{3,6})\b/i);
    if (genericMatch) {
      result.maxOutput = parseInt(genericMatch[1], 10);
      found = true;
    }
  }

  // --- Parse context window ---
  // Pattern: "context length is 128000" / "maximum context length is 128000 tokens"
  const ctxMatch = errorText.match(/context.*?length.*?(\d{4,7})/i);
  if (ctxMatch) {
    result.contextWindow = parseInt(ctxMatch[1], 10);
    found = true;
  }

  // Pattern: "maximum ... 128000 tokens" (OpenAI style)
  if (!result.contextWindow) {
    const maxTokensCtx = errorText.match(/maximum.*?(\d{4,7})\s*tokens/i);
    if (maxTokensCtx) {
      result.contextWindow = parseInt(maxTokensCtx[1], 10);
      found = true;
    }
  }

  if (!found) return null;

  result.discoveredAt = Date.now();
  return result;
}

/**
 * Write discovered limits into the persistent cache.
 * @returns true when the write succeeds, otherwise false.
 */
export function cacheDiscoveredLimits(
  modelName: string,
  limits: Partial<DiscoveredModelLimits>,
): boolean {
  if (!_setDiscoveredLimits) return false;
  _setDiscoveredLimits(modelName.toLowerCase(), limits);
  console.log(
    `[ModelRegistry] Learned limits for ${modelName}:`,
    limits.maxOutput != null ? `maxOutput=${limits.maxOutput}` : '',
    limits.contextWindow != null ? `contextWindow=${limits.contextWindow}` : '',
  );
  return true;
}

// ==================== Utility ====================

/**
 * Estimate tokens conservatively.
 *
 * This uses characters / 1.5 as a safe upper bound.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.5);
}
