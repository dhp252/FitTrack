// ============================================================================
// POLLINATION TEXT ANALYSIS SERVICE - Analyse IA textuelle via Pollinations
// Utilisé pour le résumé hebdo (Progress) et l'analyse de séance (Workout)
// ============================================================================

import { getPollinationApiKey } from './index';
import { fetchWithRetry, getOrSetMemoryCache } from '../network/httpClient';
import { AI_REQUEST_TIMEOUT_MS } from '../../constants/values';
import { beginAiDebugCall, completeAiDebugCall, noteAiDebug, type AiFeatureId } from './aiDebugLog';

const TEXT_ANALYSIS_CACHE_TTL_MS = 2 * 60 * 1000;

function hashText(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// AVAILABLE MODELS
// ============================================================================

export const POLLINATION_MODELS = [
  { id: 'nova-fast', label: 'Nova Fast' },
  { id: 'gemini-fast', label: 'Gemini Fast' },
  { id: 'gemini-search', label: 'Gemini Search' },
  { id: 'qwen-coder', label: 'Qwen Coder' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'openai-fast', label: 'OpenAI Fast' },
  { id: 'minimax', label: 'Minimax' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'claude-fast', label: 'Claude Fast' },
] as const;

export type PollinationModelId = typeof POLLINATION_MODELS[number]['id'];

// ============================================================================
// TEXT GENERATION
// ============================================================================

const POLLINATION_CHAT_URL = 'https://gen.pollinations.ai/v1/chat/completions';

interface TextGenerationOptions {
  /** Which app feature is asking; shown in the AI debug log */
  feature: AiFeatureId;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

/**
 * Generate text using Pollinations text API
 * Uses the /v1/chat/completions endpoint with model selection.
 * Every call is recorded in the AI debug log when debug mode is on.
 */
export const generateTextAnalysis = async ({
  feature,
  systemPrompt,
  userPrompt,
  model = 'openai',
}: TextGenerationOptions): Promise<string> => {
  const apiKey = await getPollinationApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  const debugId = beginAiDebugCall({
    feature,
    model,
    endpoint: POLLINATION_CHAT_URL,
    request: body,
    secrets: [apiKey],
  });
  if (!apiKey) {
    noteAiDebug(feature, 'No Pollinations API key stored: request sent without authentication', false);
  }

  const cacheKey = `pollination:text:${model}:${hashText(systemPrompt)}:${hashText(userPrompt)}`;
  let fromNetwork = false;

  try {
    const content = await getOrSetMemoryCache(cacheKey, TEXT_ANALYSIS_CACHE_TTL_MS, async () => {
      fromNetwork = true;
      const response = await fetchWithRetry(POLLINATION_CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }, {
        timeoutMs: AI_REQUEST_TIMEOUT_MS,
        retries: 1,
        retryDelayMs: 800,
      });

      const rawText = await response.text();
      completeAiDebugCall(debugId, {
        status: response.ok ? 'success' : 'error',
        httpStatus: response.status,
        response: rawText,
        secrets: [apiKey],
      });

      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status} - ${rawText}`);
      }

      const data = JSON.parse(rawText) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('No response from Pollinations API');
      }

      return text.trim();
    });

    if (!fromNetwork) {
      completeAiDebugCall(debugId, { status: 'success', cached: true, response: content });
    }
    return content;
  } catch (error) {
    completeAiDebugCall(debugId, { status: 'error', error, secrets: [apiKey] });
    throw error;
  }
};
