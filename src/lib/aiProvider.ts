import {
  type AiActionType,
  type GeminiActionResult,
  type GeminiChatMessage,
  isGeminiFallbackEligibleError,
  runGeminiAction,
  runGeminiChatHistory,
} from "@/lib/geminiApi";
import {
  DEFAULT_OLLAMA_BASE_URL,
  fetchOllamaModels,
  isAbortError,
  isEmbeddingOnlyModel,
  normalizeOllamaBaseUrl,
  runOllamaAction,
  runOllamaChatHistory,
  type OllamaStreamOptions,
} from "@/lib/ollamaApi";
import type { AppLanguage } from "@/translation/translate";

export type AiProviderId = "gemini" | "ollama";
export type AiChatStreamOptions = OllamaStreamOptions;

export interface AiProviderConfig {
  aiProvider?: AiProviderId;
  autoFallbackToOllama?: boolean;
  geminiApiKey?: string;
  aiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

/**
 * Checks whether the currently active AI provider has the minimum configuration
 * required to perform text / chat actions.
 */
export function isAiProviderConfigured(config: AiProviderConfig): boolean {
  if (config.aiProvider === "ollama") {
    return Boolean(normalizeOllamaBaseUrl(config.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL));
  }
  return Boolean(config.geminiApiKey && config.geminiApiKey.trim());
}

/**
 * Resolves a ready Ollama model when Gemini fails with an eligible fallback error
 * (quota exhausted, offline/network drop, or transient Gemini 5xx server failure).
 * Never switches if `autoFallbackToOllama` is disabled or no chat model is ready.
 */
async function resolveReadyOllamaFallbackModel(
  config: AiProviderConfig,
  originalError: unknown
): Promise<{ baseUrl: string; model: string; reason: "quota" | "offline" | "server" } | null> {
  if (config.autoFallbackToOllama === false) {
    return null;
  }

  const eligibility = isGeminiFallbackEligibleError(originalError);
  if (!eligibility.eligible || !eligibility.reason) {
    return null;
  }

  const baseUrl = normalizeOllamaBaseUrl(config.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL);
  if (!baseUrl) {
    return null;
  }

  try {
    const status = await fetchOllamaModels(baseUrl, 1800);
    if (!status.connected) {
      return null;
    }
    const chatModels = status.models.filter((m) => !isEmbeddingOnlyModel(m.id));
    if (chatModels.length === 0) {
      return null;
    }

    const configured = (config.ollamaModel || "").trim();
    const hasConfiguredModel = configured && configured !== "auto" && chatModels.some((m) => m.id === configured);
    return {
      baseUrl,
      model: hasConfiguredModel ? configured : "auto",
      reason: eligibility.reason,
    };
  } catch {
    return null;
  }
}

async function runWithOllamaFallback(
  config: AiProviderConfig,
  originalError: unknown,
  signal: AbortSignal | undefined,
  runOllama: (baseUrl: string, targetModel: string) => Promise<GeminiActionResult>
): Promise<GeminiActionResult> {
  if (signal?.aborted || isAbortError(originalError)) {
    throw originalError;
  }

  const fallbackTarget = await resolveReadyOllamaFallbackModel(config, originalError);
  if (!fallbackTarget) {
    throw originalError;
  }

  const res = await runOllama(fallbackTarget.baseUrl, fallbackTarget.model);
  return {
    ...res,
    fallbackFrom: "gemini",
    fallbackReason: fallbackTarget.reason,
  };
}

/**
 * Unified inline editor AI action runner (routes to Gemini or Ollama, with
 * automatic temporary fallback to local Ollama on quota/offline/server errors).
 */
export async function executeAiAction(
  config: AiProviderConfig,
  action: AiActionType,
  text: string,
  lang: AppLanguage = "th"
): Promise<GeminiActionResult> {
  if (config.aiProvider === "ollama") {
    return runOllamaAction(
      config.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
      action,
      text,
      lang,
      config.ollamaModel || "auto"
    );
  }
  try {
    return await runGeminiAction(
      config.geminiApiKey || "",
      action,
      text,
      lang,
      config.aiModel || "auto"
    );
  } catch (geminiErr) {
    return runWithOllamaFallback(config, geminiErr, undefined, (baseUrl, targetModel) =>
      runOllamaAction(baseUrl, action, text, lang, targetModel)
    );
  }
}

/**
 * Unified multi-turn Luno AI chat runner (routes to Gemini or Ollama, with
 * automatic temporary fallback to local Ollama on quota/offline/server errors).
 */
export async function executeAiChatHistory(
  config: AiProviderConfig,
  history: GeminiChatMessage[],
  newPrompt: string,
  attachedFilesContext?: string,
  selectedStyle: "smart" | "fast" | "creative" = "smart",
  lang: AppLanguage = "th",
  streamOptions?: AiChatStreamOptions
): Promise<GeminiActionResult> {
  if (config.aiProvider === "ollama") {
    return runOllamaChatHistory(
      config.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
      history,
      newPrompt,
      attachedFilesContext,
      selectedStyle,
      lang,
      config.ollamaModel || "auto",
      streamOptions
    );
  }
  try {
    const res = await runGeminiChatHistory(
      config.geminiApiKey || "",
      history,
      newPrompt,
      attachedFilesContext,
      selectedStyle,
      lang,
      config.aiModel || "auto"
    );
    if (streamOptions?.signal?.aborted) {
      const abortErr = new Error("ABORTED");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    return res;
  } catch (geminiErr) {
    return runWithOllamaFallback(config, geminiErr, streamOptions?.signal, (baseUrl, targetModel) =>
      runOllamaChatHistory(
        baseUrl,
        history,
        newPrompt,
        attachedFilesContext,
        selectedStyle,
        lang,
        targetModel,
        streamOptions
      )
    );
  }
}
