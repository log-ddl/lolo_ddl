/**
 * Script Parser Service
 * Uses AI chat APIs to parse screenplay text and extract structured data
 * Based on CineGen-AI geminiService.ts patterns
 */

import { retryOperation } from "@/features/video-studio/lib/utils/retry";
import { ApiKeyManager } from "@/features/video-studio/lib/api-key-manager";
import { getModelLimits, parseModelLimitsFromError, cacheDiscoveredLimits, estimateTokens } from "@/features/video-studio/lib/ai/model-registry";
import { corsFetch } from "@/features/video-studio/lib/cors-fetch";
import { isCliProvider, runCliTextCompletion } from "@/features/video-studio/lib/cli-runtime";

export interface ParseOptions {
  apiKey: string; // Supports comma-separated multiple keys
  provider: string;
  baseUrl: string;
  model: string;
  language?: string;
  sceneCount?: number; // Scene-count limit for compact flows such as trailers
  shotCount?: number; // Suggested shot count per scene passed into later shot generation
  keyManager?: ApiKeyManager; // Optional: use existing key manager for rotation
  temperature?: number; // Custom temperature, default 0.7
  maxTokens?: number; // Custom max output token count, default 4096
  /** Disable deep reasoning on reasoning models (e.g. GLM-4.7 / 4.5) to avoid exhausting output tokens */
  disableThinking?: boolean;
  /** Explicit local-CLI adapter override (reuses ContentChat's wiring for text features). */
  cliAdapter?: 'claude' | 'opencode' | 'codex';
  /** CLI timeout for this text request (comes from Settings → CLI runtime). */
  cliTimeoutMs?: number;
  /** Reasoning effort for the local CLI, mirroring ContentChat's selection. */
  cliEffort?: string;
  /** Workspace directory the CLI turn runs in, exactly like a ContentChat conversation. */
  cliWorkingDirectory?: string;
  /** Expose the ContentChat MCP tools to this CLI turn. */
  cliEnableContentMcp?: boolean;
  onChunk?: (chunk: string) => void;
  sessionKey?: string;
  onCliLog?: (message: string) => void;
  signal?: AbortSignal;
}

function formatCliLogBlock(label: string, value: string, max = 4000): string {
  const text = value || '';
  const suffix = text.length > max ? `\n... [truncated ${text.length - max} chars]` : '';
  return `[CLI] ${label} (${text.length} chars)\n${text.slice(0, max)}${suffix}`;
}

/**
 * Call chat API (Zhipu or OpenAI compatible) with multi-key rotation support
 */
export async function callChatAPI(
  systemPrompt: string,
  userPrompt: string,
  options: ParseOptions
): Promise<string> {
  const { apiKey, provider, baseUrl, model } = options;
  if (options.signal?.aborted) {
    throw new Error('Cancelled by user');
  }

  if (isCliProvider(provider) || baseUrl === 'cli://local') {
    const sessionKey = options.sessionKey || `${provider || 'cli'}:${model || 'default'}`;
    options.onCliLog?.(`[CLI] Request start provider=${provider || 'cli'} model=${model || '(default)'} session=${sessionKey}`);
    options.onCliLog?.(formatCliLogBlock('INPUT system prompt', systemPrompt));
    options.onCliLog?.(formatCliLogBlock('INPUT user prompt', userPrompt));
    try {
      const output = await runCliTextCompletion({
        systemPrompt,
        userPrompt,
        model,
        // A cli://local base URL is an explicit CLI routing decision (either the
        // Settings toggle is on, or getTextAiConfig fell back to ContentChat's CLI),
        // so the enabled toggle is not consulted again here — matching ContentChat.
        adapter: options.cliAdapter,
        allowDisabled: true,
        timeoutMs: options.cliTimeoutMs,
        effort: options.cliEffort,
        workingDirectory: options.cliWorkingDirectory,
        enableContentMcp: options.cliEnableContentMcp,
        sessionKey,
        onChunk: options.onChunk,
        signal: options.signal,
      });
      options.onCliLog?.(formatCliLogBlock('OUTPUT response', output, 6000));
      options.onCliLog?.(`[CLI] Request done provider=${provider || 'cli'} model=${model || '(default)'} session=${sessionKey} output=${output.length} chars`);
      return output;
    } catch (error) {
      options.onCliLog?.(`[CLI] Request failed session=${sessionKey}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  console.log('\n[callChatAPI] ==================== API Call Start ====================');
  console.log('[callChatAPI] provider:', provider);
  console.log('[callChatAPI] apiKey length:', apiKey?.length || 0);
  console.log('[callChatAPI] apiKey missing:', !apiKey);
  console.log('[callChatAPI] baseUrl:', baseUrl);
  console.log('[callChatAPI] systemPrompt length:', systemPrompt.length);
  console.log('[callChatAPI] userPrompt length:', userPrompt.length);
  
  if (!apiKey) {
    console.error('[callChatAPI] API key is missing');
    throw new Error('API key is not configured');
  }
  
  // Create or use existing key manager for rotation
  const keyManager = options.keyManager || new ApiKeyManager(apiKey);
  
  const totalKeys = keyManager.getTotalKeyCount();
  console.log(`[callChatAPI] Using ${provider}, total API keys: ${totalKeys}`);

  if (!baseUrl) {
    throw new Error('Base URL is not configured');
  }
  if (!model) {
    throw new Error('Model is not configured');
  }
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const url = /\/v\d+$/.test(normalizedBaseUrl)
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
  
  // Query model limits from the model registry (cache -> static -> default).
  const modelLimits = getModelLimits(model);
  const requestedMaxTokens = options.maxTokens ?? 4096;
  const effectiveMaxTokens = Math.min(requestedMaxTokens, modelLimits.maxOutput);
  if (effectiveMaxTokens < requestedMaxTokens) {
    console.log(`[callChatAPI] max_tokens auto-clamped: ${requestedMaxTokens} -> ${effectiveMaxTokens} (${model} maxOutput=${modelLimits.maxOutput})`);
  }
  
  // === Token Budget Calculator ===
  const inputTokens = estimateTokens(systemPrompt + userPrompt);
  const safetyMargin = Math.ceil(modelLimits.contextWindow * 0.1);
  const availableForOutput = modelLimits.contextWindow - inputTokens - safetyMargin;
  const utilization = Math.round((inputTokens / modelLimits.contextWindow) * 100);
  
  console.log(
    `[Dispatch] ${model}: input≈${inputTokens} / ctx=${modelLimits.contextWindow}, ` +
      `output=${effectiveMaxTokens} (${100 - utilization}% headroom)`
  );
  
  // If the input already exceeds 90% of the context window, throw before making the request.
  if (inputTokens > modelLimits.contextWindow * 0.9) {
    const err = new Error(
      `[TokenBudget] Input tokens (≈${inputTokens}) exceed 90% of ${model}'s context window ` +
      `(${modelLimits.contextWindow}). Reduce the input or use a larger-context model.`
    );
    (err as any).code = 'TOKEN_BUDGET_EXCEEDED';
    (err as any).inputTokens = inputTokens;
    (err as any).contextWindow = modelLimits.contextWindow;
    throw err;
  }
  
  // Warn when remaining output space is below 50% of the requested amount.
  if (availableForOutput < requestedMaxTokens * 0.5) {
    console.warn(
        `[Dispatch] Warning: ${model} has limited output space. Available≈${availableForOutput} tokens, ` +
        `requested=${requestedMaxTokens}, output may be truncated.`
    );
  }
  
  console.log('[callChatAPI] Request URL:', url);

  // Use retryOperation with key rotation on rate limit
  return await retryOperation(async () => {
    // Get current key from rotation
    const currentKey = keyManager.getCurrentKey();
    if (!currentKey) {
      throw new Error('No API keys available');
    }
    
    console.log(`[callChatAPI] Using key index, available: ${keyManager.getAvailableKeyCount()}/${totalKeys}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentKey}`,
    };
    
    // Model selection: always use the configured model.
    const modelName = model;
    console.log('[callChatAPI] Using model:', modelName);
    
    const body: Record<string, any> = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: effectiveMaxTokens,
    };

    // GLM reasoning models support disabling deep reasoning via thinking.type.
    if (options.disableThinking) {
      body.thinking = { type: 'disabled' };
      console.log('[callChatAPI] Deep reasoning disabled (thinking: disabled)');
    }

    if (options.signal?.aborted) {
      throw new Error('Cancelled by user');
    }

    const timeoutMs = 120000;
    const controller = new AbortController();
    const abortFromParent = () => controller.abort();
    options.signal?.addEventListener('abort', abortFromParent, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await (async () => {
      try {
        return await corsFetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (options.signal?.aborted) {
            throw new Error('Cancelled by user');
          }
          throw new Error(`API request timed out after ${Math.round(timeoutMs / 1000)} seconds`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener('abort', abortFromParent);
      }
    })();

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limit or auth error with key rotation
      if (keyManager.handleError(response.status, errorText)) {
        console.log(`[callChatAPI] Rotated to next API key due to error ${response.status}, available: ${keyManager.getAvailableKeyCount()}/${totalKeys}`);
      }
      
      // === Error-driven discovery: infer model limits from 400 errors and retry ===
      if (response.status === 400) {
        const discovered = parseModelLimitsFromError(errorText);
        if (discovered) {
          cacheDiscoveredLimits(model, discovered);
          
          // If a maxOutput limit is discovered and the current request exceeds it, retry immediately with the corrected value.
          if (discovered.maxOutput && effectiveMaxTokens > discovered.maxOutput) {
            const correctedMaxTokens = Math.min(requestedMaxTokens, discovered.maxOutput);
            console.warn(
              `[callChatAPI] Discovered ${model} maxOutput=${discovered.maxOutput}, ` +
              `retrying automatically with max_tokens=${correctedMaxTokens}...`
            );
            const retryBody = { ...body, max_tokens: correctedMaxTokens };
            const retryResp = await corsFetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(retryBody),
              signal: options.signal,
            });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              const retryContent = retryData.choices?.[0]?.message?.content;
              if (retryContent) {
                if (totalKeys > 1) keyManager.rotateKey();
                return retryContent;
              }
            } else {
              console.warn('[callChatAPI] Retry after discovery still failed:', retryResp.status);
            }
          }
        }
      }
      
      const error = new Error(`API request failed: ${response.status} - ${errorText}`);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      // Diagnostic logging: record the actual API response structure.
      const finishReason = data.choices?.[0]?.finish_reason;
      const usage = data.usage;
      const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
      console.error('[callChatAPI] API returned empty content. Diagnostic details:');
      console.error('[callChatAPI]   finish_reason:', finishReason);
      console.error('[callChatAPI]   usage:', JSON.stringify(usage));
      console.error('[callChatAPI]   choices length:', data.choices?.length);
      console.error('[callChatAPI]   message keys:', data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : 'N/A');
      console.error('[callChatAPI]   reasoning_content length:', reasoningContent?.length || 0);
      console.error('[callChatAPI]   raw response (first 500 chars):', JSON.stringify(data).slice(0, 500));
      
      // Handle sensitive/content-filter responses by rotating keys and retrying.
      if (finishReason === 'sensitive' || finishReason === 'content_filter') {
        if (keyManager.handleError(403)) {
          console.warn(`[callChatAPI] Content was safety-filtered (${finishReason}), rotating to the next key`);
        }
        throw new Error(`Content was safety-filtered (finish_reason: ${finishReason})`);
      }
      
      // Reasoning-model fallback: if reasoning_content exists but content is empty, reasoning likely consumed the output budget.
      if (finishReason === 'length' && reasoningContent) {
        // First try extracting JSON from reasoning_content.
        const jsonMatch = reasoningContent.match(/```json\s*([\s\S]*?)```/) ||
                          reasoningContent.match(/(\{[\s\S]*"characters"[\s\S]*\})/);
        if (jsonMatch) {
          console.log('[callChatAPI] Extracted JSON from reasoning_content');
          return jsonMatch[1] || jsonMatch[0];
        }
        
        // If reasoning consumes more than 80% of completion tokens, retry once with a larger max_tokens budget.
        const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens || 0;
        const completionTokens = usage?.completion_tokens || 0;
        const currentMaxTokens = body.max_tokens;
        const newMaxTokens = Math.min(currentMaxTokens * 2, modelLimits.maxOutput);
        
        if (reasoningTokens > 0 && completionTokens > 0 &&
            reasoningTokens / completionTokens > 0.8 &&
            newMaxTokens > currentMaxTokens) {
          console.warn(
              `[callChatAPI] Reasoning token budget exhausted (reasoning: ${reasoningTokens}/${completionTokens}), ` +
              `retrying automatically with max_tokens=${newMaxTokens}...`
          );
          
          const retryBody = { ...body, max_tokens: newMaxTokens };
          const retryResp = await corsFetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(retryBody),
            signal: options.signal,
          });
          
          if (retryResp.ok) {
            const retryData = await retryResp.json();
            const retryContent = retryData.choices?.[0]?.message?.content;
            const retryUsage = retryData.usage;
            console.log(
                `[callChatAPI] Retry result: content=${retryContent?.length || 0} chars, ` +
              `reasoning=${retryUsage?.completion_tokens_details?.reasoning_tokens || '?'}, ` +
              `completion=${retryUsage?.completion_tokens || '?'}`
            );
            if (retryContent) {
              if (totalKeys > 1) keyManager.rotateKey();
              return retryContent;
            }
          } else {
              console.warn('[callChatAPI] Retry request failed:', retryResp.status);
          }
        } else {
          console.warn(
              `[callChatAPI] Reasoning token budget exhausted: reasoning ${reasoningContent.length} chars, content is empty. ` +
            `(reasoning_tokens=${reasoningTokens}, completion_tokens=${completionTokens}, max_tokens=${currentMaxTokens})`
          );
        }
      }
      
      throw new Error(`Empty response from API (finish_reason: ${finishReason || 'unknown'})`);
    }

    // Rotate key after successful request to distribute load
    if (totalKeys > 1) {
      keyManager.rotateKey();
    }

    return content;
  }, { maxRetries: 3, baseDelay: 2000 });
}
