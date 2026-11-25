import {
  type AiActionType,
  type GeminiActionResult,
  type GeminiChatMessage,
  LUNO_AI_SYSTEM_PROMPT,
  buildAiActionPrompt,
  cleanAiOutputText,
} from "@/lib/geminiApi";
import { translate, type AppLanguage } from "@/translation/translate";
import {
  LUNO_COMPACT_PRODUCT_IDENTITY,
  LUNO_SECURITY_AND_IP_GUARDRAIL,
  getRelevantLunoKnowledge,
} from "@/lib/lunoKnowledge";

export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

export interface OllamaModelOption {
  id: string;
  name: string;
  parameterSize?: string;
  sizeBytes?: number;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  models: OllamaModelOption[];
  error?: string;
}

export interface RecommendedOllamaModel {
  id: string;
  name: string;
  sizeLabel: string;
}

export const RECOMMENDED_OLLAMA_MODELS: RecommendedOllamaModel[] = [
  { id: "qwen2.5:1.5b", name: "Qwen 2.5 1.5B", sizeLabel: "940 MB" },
  { id: "gemma3:1b", name: "Gemma 3 1B", sizeLabel: "770 MB" },
  { id: "qwen2.5:3b", name: "Qwen 2.5 3B", sizeLabel: "1.9 GB" },
  { id: "gemma3:4b", name: "Gemma 3 4B", sizeLabel: "3.3 GB" },
  { id: "llama3.2:3b", name: "Llama 3.2 3B", sizeLabel: "2.0 GB" },
  { id: "qwen2.5:7b", name: "Qwen 2.5 7B", sizeLabel: "4.7 GB" },
];

export interface OllamaStreamOptions {
  onToken?: (visibleText: string, delta: string) => void;
  signal?: AbortSignal;
}

let devProgressPollCount = 0;
let devProgressPollTimer: ReturnType<typeof setInterval> | null = null;
const activeClientPullControllers = new Map<string, AbortController>();
const activeClientPullPromises = new Map<string, Promise<{ ok: boolean; model?: string; canceled?: boolean; error?: string }>>();
let sharedClientInstallPromise: Promise<{ ok: boolean; error?: string }> | null = null;

export interface ActiveOllamaPullState {
  stage: "downloading" | "installing" | "starting" | "pulling" | "ready";
  percent?: number;
  model?: string;
  statusText?: string;
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" ? (val as Record<string, unknown>) : null;
}

function extractApiError(data: unknown): string | undefined {
  const rec = asRecord(data);
  return typeof rec?.error === "string" && rec.error ? rec.error : undefined;
}

export async function getActiveOllamaPulls(): Promise<ActiveOllamaPullState[]> {
  if (typeof window !== "undefined" && window.electronAPI?.ollamaGetActivePulls) {
    try {
      const list = await window.electronAPI.ollamaGetActivePulls();
      if (Array.isArray(list)) {
        return list.filter((item) => Boolean(item?.model));
      }
    } catch {
      // fall through to dev endpoint
    }
  }
  try {
    const res = await fetch("/__luno_ollama/progress");
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.models && typeof data.models === "object") {
        return Object.values(data.models).filter((item): item is ActiveOllamaPullState => {
          const rec = asRecord(item);
          return Boolean(rec && typeof rec.model === "string" && rec.model);
        });
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function startDevProgressPolling(): () => void {
  if (typeof window === "undefined") return () => {};
  devProgressPollCount++;
  if (!devProgressPollTimer) {
    devProgressPollTimer = setInterval(async () => {
      try {
        const res = await fetch("/__luno_ollama/progress");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.progress) {
          window.dispatchEvent(new CustomEvent("luno:ollama-setup-progress", { detail: data.progress }));
        }
        if (data?.models && typeof data.models === "object") {
          for (const item of Object.values(data.models)) {
            if (item) {
              window.dispatchEvent(new CustomEvent("luno:ollama-setup-progress", { detail: item }));
            }
          }
        }
      } catch {
        /* ignore */
      }
    }, 400);
  }
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    devProgressPollCount = Math.max(0, devProgressPollCount - 1);
    if (devProgressPollCount === 0 && devProgressPollTimer) {
      clearInterval(devProgressPollTimer);
      devProgressPollTimer = null;
    }
  };
}

export async function checkOllamaSystemInstalled(): Promise<boolean> {
  if (typeof window !== "undefined" && window.electronAPI?.ollamaCheckSystem) {
    try {
      const res = await window.electronAPI.ollamaCheckSystem();
      return Boolean(res?.installed);
    } catch {
      // fall through to dev endpoint
    }
  }
  try {
    const res = await fetch("/__luno_ollama/check");
    if (res.ok) {
      const data = await res.json().catch(() => null);
      return Boolean(data?.installed);
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function startOllamaService(baseUrl: string = DEFAULT_OLLAMA_BASE_URL): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeOllamaBaseUrl(baseUrl);
  if (!normalized) return { ok: false, error: "INVALID_URL" };
  if (typeof window !== "undefined" && window.electronAPI?.ollamaStartService) {
    try {
      return await window.electronAPI.ollamaStartService({ baseUrl: normalized });
    } catch {
      // fall through
    }
  }
  const status = await fetchOllamaModels(normalized);
  return { ok: status.connected, error: status.error };
}

export async function pullOllamaModel(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  modelName: string = "qwen2.5:3b"
): Promise<{ ok: boolean; model?: string; canceled?: boolean; error?: string }> {
  const normalized = normalizeOllamaBaseUrl(baseUrl);
  if (!normalized) return { ok: false, error: "INVALID_URL" };
  const cleanModel = (modelName || "").trim();
  if (!cleanModel || !/^[a-zA-Z0-9._/-]+(:[a-zA-Z0-9._-]+)?$/.test(cleanModel)) {
    return { ok: false, error: "INVALID_MODEL_NAME" };
  }

  const existing = activeClientPullPromises.get(cleanModel);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<{ ok: boolean; model?: string; canceled?: boolean; error?: string }> => {
    if (typeof window !== "undefined" && window.electronAPI?.ollamaPullModel) {
      try {
        return await window.electronAPI.ollamaPullModel({ baseUrl: normalized, model: cleanModel });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("No handler registered")) {
          return { ok: false, error: msg };
        }
      }
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controller) {
      activeClientPullControllers.set(cleanModel, controller);
    }

    // Try Vite dev middleware streaming pull endpoint first
    const stopPolling = startDevProgressPolling();
    try {
      const devRes = await fetch("/__luno_ollama/pull", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ baseUrl: normalized, model: cleanModel }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (devRes.status !== 404) {
        const devData = await devRes.json().catch(() => null);
        if (devData?.canceled) {
          return { ok: false, canceled: true, error: "CANCELED" };
        }
        if (devRes.ok && devData?.ok && devData?.asyncJob) {
          // Poll short-lived /__luno_ollama/progress requests until background job completes
          while (!controller?.signal.aborted) {
            await new Promise((r) => setTimeout(r, 500));
            if (controller?.signal.aborted) {
              return { ok: false, canceled: true, error: "CANCELED" };
            }
            try {
              const progRes = await fetch("/__luno_ollama/progress");
              if (!progRes.ok) continue;
              const progData = await progRes.json().catch(() => null);
              const job = progData?.jobs?.[cleanModel];
              if (!job) continue;
              if (job.status === "done") {
                return { ok: true, model: cleanModel };
              }
              if (job.status === "canceled") {
                return { ok: false, canceled: true, error: "CANCELED" };
              }
              if (job.status === "error") {
                return { ok: false, error: String(job.error || "PULL_FAILED") };
              }
            } catch {
              // ignore transient poll hiccup
            }
          }
          return { ok: false, canceled: true, error: "CANCELED" };
        }
        if (devRes.ok && devData?.ok) {
          return { ok: true, model: cleanModel };
        }
        if (devData?.error) {
          return { ok: false, error: String(devData.error) };
        }
      }
    } catch (err) {
      if (controller?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
        return { ok: false, canceled: true, error: "CANCELED" };
      }
      // fall through to direct Ollama HTTP endpoint
    } finally {
      stopPolling();
    }

    try {
      const response = await fetch(`${normalized}/api/pull`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: cleanModel, stream: false }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      const data: unknown = await response.json().catch(() => null);
      const errField = extractApiError(data);
      if (!response.ok || errField) {
        return {
          ok: false,
          error: errField || `HTTP ${response.status}`,
        };
      }
      return { ok: true, model: cleanModel };
    } catch (err) {
      if (controller?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
        return { ok: false, canceled: true, error: "CANCELED" };
      }
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      activeClientPullControllers.delete(cleanModel);
    }
  })();

  activeClientPullPromises.set(cleanModel, promise);
  try {
    return await promise;
  } finally {
    activeClientPullPromises.delete(cleanModel);
  }
}

export async function cancelOllamaModelPull(modelName: string): Promise<{ ok: boolean; canceled?: boolean }> {
  const cleanModel = (modelName || "").trim();
  if (!cleanModel) return { ok: false };

  const controller = activeClientPullControllers.get(cleanModel);
  if (controller) {
    try {
      controller.abort();
    } catch {
      /* ignore */
    }
    activeClientPullControllers.delete(cleanModel);
  }

  if (typeof window !== "undefined" && window.electronAPI?.ollamaCancelPull) {
    try {
      await window.electronAPI.ollamaCancelPull({ model: cleanModel });
      return { ok: true, canceled: true };
    } catch {
      // fall through
    }
  }

  try {
    await fetch("/__luno_ollama/cancel", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: cleanModel }),
    });
  } catch {
    /* ignore */
  }
  return { ok: true, canceled: true };
}

export async function deleteOllamaModel(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  modelName: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeOllamaBaseUrl(baseUrl);
  if (!normalized) return { ok: false, error: "INVALID_URL" };
  const cleanModel = (modelName || "").trim();
  if (!cleanModel || !/^[a-zA-Z0-9._/-]+(:[a-zA-Z0-9._-]+)?$/.test(cleanModel)) {
    return { ok: false, error: "INVALID_MODEL_NAME" };
  }

  if (typeof window !== "undefined" && window.electronAPI?.ollamaDeleteModel) {
    try {
      return await window.electronAPI.ollamaDeleteModel({ baseUrl: normalized, model: cleanModel });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("No handler registered")) {
        return { ok: false, error: msg };
      }
    }
  }

  try {
    const devRes = await fetch("/__luno_ollama/delete", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ baseUrl: normalized, model: cleanModel }),
    });
    if (devRes.status !== 404) {
      const devData = await devRes.json().catch(() => null);
      if (devRes.ok && devData?.ok) {
        return { ok: true };
      }
      if (devData?.error) {
        return { ok: false, error: String(devData.error) };
      }
    }
  } catch {
    // fall through
  }

  try {
    const response = await fetch(`${normalized}/api/delete`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: cleanModel, name: cleanModel }),
    });
    if (response.ok) {
      return { ok: true };
    }
    const data: unknown = await response.json().catch(() => null);
    return {
      ok: false,
      error: extractApiError(data) || `HTTP ${response.status}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function installAndSetupOllama(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  starterModel: string = "qwen2.5:3b"
): Promise<{ ok: boolean; installedModel?: string; canceled?: boolean; error?: string }> {
  const normalized = normalizeOllamaBaseUrl(baseUrl);
  if (!normalized) return { ok: false, error: "INVALID_URL" };

  let status = await fetchOllamaModels(normalized);
  if (!status.connected) {
    if (!sharedClientInstallPromise) {
      sharedClientInstallPromise = (async () => {
        if (typeof window !== "undefined" && window.electronAPI?.ollamaInstallSystem) {
          try {
            const installRes = await window.electronAPI.ollamaInstallSystem({ baseUrl: normalized });
            return installRes.ok ? { ok: true } : { ok: false, error: installRes.error || "INSTALL_FAILED" };
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("No handler registered")) {
              return { ok: false, error: msg };
            }
          }
        }

        const stopPolling = startDevProgressPolling();
        try {
          const devRes = await fetch("/__luno_ollama/install", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ baseUrl: normalized }),
          });
          const devData = await devRes.json().catch(() => null);
          if (!devRes.ok || !devData?.ok) {
            return { ok: false, error: devData?.error || "CONNECTION_FAILED" };
          }
          return { ok: true };
        } catch {
          return { ok: false, error: "CONNECTION_FAILED" };
        } finally {
          stopPolling();
        }
      })();
    }

    try {
      const sysRes = await sharedClientInstallPromise;
      if (!sysRes.ok) {
        return { ok: false, error: sysRes.error || "CONNECTION_FAILED" };
      }
      status = await fetchOllamaModels(normalized);
    } finally {
      sharedClientInstallPromise = null;
    }
  }

  if (!status.connected) {
    return { ok: false, error: "START_FAILED" };
  }

  const targetModel = (starterModel || "qwen2.5:3b").trim();
  const alreadyHasTarget = status.models.some((m) => m.id === targetModel);
  if (!alreadyHasTarget) {
    const pullRes = await pullOllamaModel(normalized, targetModel);
    if (!pullRes.ok) {
      return { ok: false, canceled: pullRes.canceled, error: pullRes.error || "PULL_FAILED" };
    }
  }

  return { ok: true, installedModel: targetModel };
}

/**
 * Validates and normalizes an Ollama server base URL.
 * Rejects non-HTTP(S) schemes, embedded credentials, and cloud metadata / link-local hosts.
 */
export function normalizeOllamaBaseUrl(rawUrl?: string): string | null {
  const candidate = typeof rawUrl === "string" && rawUrl.trim() ? rawUrl.trim() : DEFAULT_OLLAMA_BASE_URL;
  try {
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) {
      if (!/^[a-zA-Z0-9.-]+:\d+(\/|$)/.test(candidate)) {
        return null;
      }
    }
    const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `http://${candidate}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      !host ||
      host === "0.0.0.0" ||
      host === "169.254.169.254" ||
      host.startsWith("169.254.") ||
      host.startsWith("fe80:") ||
      host === "metadata.google.internal" ||
      host.endsWith(".internal")
    ) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

export const LUNO_AI_OLLAMA_SYSTEM_PROMPT = `You are Luno AI, the writing & workspace companion inside Luno Note.
${LUNO_COMPACT_PRODUCT_IDENTITY}
${LUNO_SECURITY_AND_IP_GUARDRAIL}
Rules: Reply in Thai when the user writes in Thai (keep technical terms in English), or English otherwise. Be clear, warm, concise, and format cleanly with Markdown. Never invent facts or features not in the prompt or reference.`;

function createOllamaAbortError(): Error {
  const err = new Error("ABORTED");
  err.name = "AbortError";
  return err;
}

export function isAbortError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.name === "AbortError" || err.message === "ABORTED";
  }
  return false;
}

export function stripStreamingThinkBlocks(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .trimStart();
}

export interface OllamaEndpointPayload {
  model?: string;
  models?: Array<{
    name?: string;
    model?: string;
    size?: number;
    details?: { parameter_size?: string };
  }>;
  message?: { role?: string; content?: string };
  response?: string;
  done?: boolean;
  error?: string;
  delta?: string;
  content?: string;
  status?: number;
}

export interface OllamaEndpointResult {
  ok: boolean;
  status: number;
  data?: OllamaEndpointPayload;
  error?: string;
}

async function requestOllamaEndpoint(
  baseUrl: string,
  endpoint: "/api/tags" | "/api/chat" | "/api/generate" | "/api/version",
  body?: Record<string, unknown>,
  timeoutMs?: number
): Promise<OllamaEndpointResult> {
  const normalizedOrigin = normalizeOllamaBaseUrl(baseUrl);
  if (!normalizedOrigin) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_URL",
    };
  }

  const isPost = endpoint === "/api/chat" || endpoint === "/api/generate";
  const effectiveTimeout = timeoutMs ?? (isPost ? 300000 : 6000);

  if (typeof window !== "undefined" && window.electronAPI?.ollamaRequest) {
    try {
      return (await window.electronAPI.ollamaRequest({
        baseUrl: normalizedOrigin,
        endpoint,
        body,
        timeoutMs: effectiveTimeout,
      })) as OllamaEndpointResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("No handler registered")) {
        return {
          ok: false,
          status: 0,
          error: msg,
        };
      }
    }
  }

  // Try same-origin Vite dev middleware proxy next (avoids browser CORS issues and streams internally)
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), effectiveTimeout) : null;

  try {
    const devRes = await fetch("/__luno_ollama/request", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseUrl: normalizedOrigin,
        endpoint,
        body,
        timeoutMs: effectiveTimeout,
      }),
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (devRes.status !== 404) {
      const devData = await devRes.json().catch(() => null);
      if (devData && typeof devData === "object" && "ok" in devData) {
        if (timer) clearTimeout(timer);
        return devData as OllamaEndpointResult;
      }
    }
  } catch (err) {
    if (controller?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      if (timer) clearTimeout(timer);
      return { ok: false, status: 0, error: "ETIMEDOUT" };
    }
    // fall through to direct fetch
  }

  // Fallback for standalone browser / Vitest environments
  try {
    const response = await fetch(`${normalizedOrigin}${endpoint}`, {
      method: isPost ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        ...(isPost ? { "Content-Type": "application/json" } : {}),
      },
      ...(isPost && body ? { body: JSON.stringify(body) } : {}),
      ...(controller ? { signal: controller.signal } : {}),
    });

    const data = (await response.json().catch(() => null)) as OllamaEndpointPayload | null;
    if (!response.ok) {
      const msg = extractApiError(data) || `HTTP ${response.status}`;
      return {
        ok: false,
        status: response.status,
        data: data ?? undefined,
        error: String(msg),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data ?? undefined,
    };
  } catch (err) {
    if (controller?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      return { ok: false, status: 0, error: "ETIMEDOUT" };
    }
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function isEmbeddingOnlyModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return (
    lower.includes("embed") ||
    lower.startsWith("bge-") ||
    lower.startsWith("all-minilm") ||
    lower.startsWith("snowflake-arctic-embed")
  );
}

export async function fetchOllamaModels(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  timeoutMs: number = 5000
): Promise<OllamaConnectionStatus> {
  const normalized = normalizeOllamaBaseUrl(baseUrl);
  if (!normalized) {
    return {
      connected: false,
      models: [],
      error: "INVALID_URL",
    };
  }

  const res = await requestOllamaEndpoint(normalized, "/api/tags", undefined, timeoutMs);
  if (!res.ok) {
    return {
      connected: false,
      models: [],
      error: res.error || "CONNECTION_FAILED",
    };
  }

  const rawModels = Array.isArray(res.data?.models) ? res.data.models : [];
  const parsedModels: OllamaModelOption[] = [];

  for (const item of rawModels) {
    const id = typeof item?.name === "string" ? item.name.trim() : typeof item?.model === "string" ? item.model.trim() : "";
    if (!id) continue;
    const paramSize = typeof item?.details?.parameter_size === "string" ? item.details.parameter_size.trim() : undefined;
    const sizeBytes = typeof item?.size === "number" ? item.size : undefined;
    parsedModels.push({
      id,
      name: paramSize ? `${id} (${paramSize})` : id,
      parameterSize: paramSize,
      sizeBytes,
    });
  }

  // Sort chat models ahead of embedding models
  parsedModels.sort((a, b) => {
    const aEmbed = isEmbeddingOnlyModel(a.id) ? 1 : 0;
    const bEmbed = isEmbeddingOnlyModel(b.id) ? 1 : 0;
    return aEmbed - bEmbed;
  });

  return {
    connected: true,
    models: parsedModels,
  };
}

function formatOllamaError(
  baseUrl: string,
  status: number,
  rawError: string | undefined,
  lang: AppLanguage = "th",
  requestedModel?: string
): Error {
  const normalized = normalizeOllamaBaseUrl(baseUrl) || baseUrl || DEFAULT_OLLAMA_BASE_URL;
  const errText = (rawError || "").trim();
  const lower = errText.toLowerCase();

  if (errText === "INVALID_URL" || lower.includes("invalid or blocked ollama server url")) {
    return new Error(translate(lang, "settings.ollamaInvalidUrlError"));
  }

  if (lower.includes("etimedout") || lower.includes("timed out") || lower.includes("timeout")) {
    return new Error(translate(lang, "settings.ollamaTimeoutError"));
  }

  if (
    status === 0 ||
    lower.includes("econnrefused") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("connection failed") ||
    lower.includes("enotfound")
  ) {
    return new Error(translate(lang, "settings.ollamaConnectionError", { url: normalized }));
  }

  if (status === 404 || (lower.includes("model") && lower.includes("not found"))) {
    return new Error(
      translate(lang, "settings.ollamaModelNotFoundError", {
        model: requestedModel || "auto",
      })
    );
  }

  return new Error(
    translate(lang, "settings.ollamaGenericError", {
      message: errText || `HTTP ${status}`,
    })
  );
}

function parseOllamaParameterBillions(modelId: string, parameterSize?: string): number {
  const src = (parameterSize || modelId || "").toLowerCase();
  const match = src.match(/(?:^|[:_\s-])(\d+(?:\.\d+)?)\s*(b|m)\b/);
  if (!match) return Number.POSITIVE_INFINITY;
  const val = parseFloat(match[1]);
  if (!Number.isFinite(val)) return Number.POSITIVE_INFINITY;
  return match[2] === "m" ? val / 1000 : val;
}

function computeOllamaInferenceOptions(
  selectedStyle: "smart" | "fast" | "creative",
  promptCharCount: number
): Record<string, number> {
  const isFast = selectedStyle === "fast";
  const numCtx = isFast || promptCharCount <= 2400 ? 2048 : 4096;
  if (isFast) {
    return {
      temperature: 0.25,
      top_k: 20,
      top_p: 0.85,
      num_ctx: numCtx,
      num_predict: 512,
    };
  }
  return {
    temperature: selectedStyle === "creative" ? 0.85 : 0.3,
    num_ctx: numCtx,
    num_predict: 1024,
  };
}

let lastWarmupSignature = "";
let lastWarmupTimestamp = 0;

/**
 * Silently preloads the active Ollama model into memory (`messages: []`) so the
 * first chat message does not pay a cold model-loading delay.
 */
export async function warmUpOllamaModel(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  configuredModel: string = "auto"
): Promise<void> {
  const normalizedUrl = normalizeOllamaBaseUrl(baseUrl);
  if (!normalizedUrl) return;

  const cleanConfigured = (configuredModel || "").trim() || "auto";
  const signature = `${normalizedUrl}::${cleanConfigured}`;
  const now = Date.now();
  if (signature === lastWarmupSignature && now - lastWarmupTimestamp < 240000) {
    return;
  }
  lastWarmupSignature = signature;
  lastWarmupTimestamp = now;

  try {
    let targetModel = cleanConfigured;
    if (!targetModel || targetModel === "auto") {
      const status = await fetchOllamaModels(normalizedUrl);
      if (!status.connected) return;
      const chatCandidates = status.models.filter((m) => !isEmbeddingOnlyModel(m.id));
      targetModel = chatCandidates[0]?.id || status.models[0]?.id || "";
    }
    if (!targetModel) return;

    await requestOllamaEndpoint(
      normalizedUrl,
      "/api/chat",
      {
        model: targetModel,
        messages: [],
        keep_alive: "15m",
        stream: false,
      },
      15000
    );
  } catch {
    /* silent background warmup */
  }
}

async function resolveOllamaTargetModel(
  baseUrl: string,
  configuredModel: string | undefined,
  lang: AppLanguage,
  preferSmallestFast: boolean = false
): Promise<string> {
  const cleanConfigured = (configuredModel || "").trim();
  if (cleanConfigured && cleanConfigured !== "auto") {
    return cleanConfigured;
  }

  const status = await fetchOllamaModels(baseUrl);
  if (!status.connected) {
    throw formatOllamaError(baseUrl, 0, status.error, lang);
  }

  const chatCandidates = status.models.filter((m) => !isEmbeddingOnlyModel(m.id));
  if (preferSmallestFast && chatCandidates.length > 1) {
    chatCandidates.sort(
      (a, b) =>
        parseOllamaParameterBillions(a.id, a.parameterSize) -
        parseOllamaParameterBillions(b.id, b.parameterSize)
    );
  }
  const firstModel = chatCandidates[0]?.id || status.models[0]?.id;
  if (!firstModel) {
    throw new Error(translate(lang, "settings.ollamaNoModelsError"));
  }
  return firstModel;
}

export function stripReasoningThinkBlocks(raw: string): string {
  if (!raw) return "";
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export const MAX_OLLAMA_HISTORY_CHARS = 6000;

export function buildOllamaMessages(
  history: GeminiChatMessage[],
  newPrompt: string,
  attachedFilesContext?: string,
  systemPrompt: string = LUNO_AI_OLLAMA_SYSTEM_PROMPT,
  maxHistoryChars: number = MAX_OLLAMA_HISTORY_CHARS
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  if (systemPrompt && systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: systemPrompt.trim(),
    });
  }

  // Select most recent non-empty history turns within character budget so CPU prompt eval stays fast
  const rawHistory = (history || [])
    .map((msg) => ({
      role: (msg?.role === "assistant" || msg?.role === "model" ? "assistant" : "user") as "user" | "assistant",
      content: (msg?.content || "").trim(),
    }))
    .filter((m) => Boolean(m.content));

  const boundedHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  let accumulatedChars = 0;
  for (let i = rawHistory.length - 1; i >= 0; i--) {
    const item = rawHistory[i];
    if (boundedHistory.length > 0 && accumulatedChars + item.content.length > maxHistoryChars) {
      break;
    }
    boundedHistory.unshift(item);
    accumulatedChars += item.content.length;
  }

  for (const msg of boundedHistory) {
    if (messages.length > 1 && messages[messages.length - 1].role === msg.role) {
      messages[messages.length - 1].content += `\n\n${msg.content}`;
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  const safePrompt = (newPrompt || "").trim();
  let currentTurnText = safePrompt;
  if (attachedFilesContext) {
    currentTurnText = `${safePrompt}\n\nAttached Files:\n${attachedFilesContext}`;
  }

  if (messages.length > 1 && messages[messages.length - 1].role === "user") {
    messages[messages.length - 1].content += `\n\n${currentTurnText}`;
  } else {
    messages.push({
      role: "user",
      content: currentTurnText,
    });
  }

  return messages;
}

async function consumeNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onLine: (obj: OllamaEndpointPayload) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      onLine(JSON.parse(trimmed));
    } catch {
      /* ignore partial line */
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) processLine(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) processLine(buffer);
}

async function requestOllamaChatStream(
  normalizedOrigin: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  streamOptions?: OllamaStreamOptions
): Promise<OllamaEndpointResult> {
  const signal = streamOptions?.signal;
  const onToken = streamOptions?.onToken;
  if (signal?.aborted) {
    throw createOllamaAbortError();
  }

  let lastEmittedVisible = "";
  const emitVisibleToken = (rawSoFar: string, delta: string) => {
    const visible = stripStreamingThinkBlocks(rawSoFar);
    if (visible && visible !== lastEmittedVisible) {
      lastEmittedVisible = visible;
      onToken?.(visible, delta);
    }
  };

  // 1. Electron native streaming IPC
  if (
    typeof window !== "undefined" &&
    window.electronAPI?.ollamaStreamChat &&
    window.electronAPI?.onOllamaChatStream
  ) {
    const requestId = `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let rawSoFar = "";
    const unsubscribe = window.electronAPI.onOllamaChatStream((chunk) => {
      if (chunk?.requestId !== requestId) return;
      if (typeof chunk.delta === "string" && chunk.delta) {
        rawSoFar += chunk.delta;
        emitVisibleToken(rawSoFar, chunk.delta);
      }
    });

    const handleAbort = () => {
      void window.electronAPI?.ollamaAbortChat?.({ requestId });
    };
    signal?.addEventListener("abort", handleAbort, { once: true });

    try {
      const ipcRes = (await window.electronAPI.ollamaStreamChat({
        baseUrl: normalizedOrigin,
        endpoint: "/api/chat",
        body: { ...body, stream: true },
        timeoutMs,
        requestId,
      })) as OllamaEndpointResult;
      if (signal?.aborted || ipcRes.status === 499 || ipcRes.error === "ABORTED") {
        throw createOllamaAbortError();
      }
      return ipcRes;
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) {
        throw createOllamaAbortError();
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("No handler registered")) {
        return { ok: false, status: 0, error: msg };
      }
    } finally {
      unsubscribe();
      signal?.removeEventListener("abort", handleAbort);
    }
  }

  // 2. Vite dev middleware NDJSON streaming endpoint
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(new Error("ETIMEDOUT")), timeoutMs) : null;
  const forwardAbort = () => {
    try {
      controller?.abort(createOllamaAbortError());
    } catch {
      /* ignore */
    }
  };
  signal?.addEventListener("abort", forwardAbort, { once: true });

  const extractJsonChatText = (payload: unknown): string => {
    const rec = asRecord(payload);
    const msg = asRecord(rec?.message);
    if (typeof msg?.content === "string") return msg.content;
    if (typeof rec?.response === "string") return rec.response;
    return "";
  };

  try {
    const devRes = await fetch("/__luno_ollama/stream", {
      method: "POST",
      headers: {
        Accept: "application/x-ndjson, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseUrl: normalizedOrigin,
        endpoint: "/api/chat",
        body: { ...body, stream: true },
        timeoutMs,
      }),
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (devRes.status !== 404) {
      if (devRes.body && typeof devRes.body.getReader === "function") {
        let assembledRaw = "";
        let finalModel = typeof body.model === "string" ? body.model : "";
        let streamError: string | null = null;
        let streamErrorStatus = 500;

        await consumeNdjsonStream(devRes.body, (obj) => {
          if (obj.error) {
            streamError = String(obj.error);
            streamErrorStatus = typeof obj.status === "number" ? obj.status : 500;
            return;
          }
          if (typeof obj.model === "string" && obj.model) {
            finalModel = obj.model;
          }
          if (typeof obj.delta === "string" && obj.delta) {
            assembledRaw += obj.delta;
            emitVisibleToken(assembledRaw, obj.delta);
          } else if (!assembledRaw && typeof obj.content === "string" && obj.content) {
            assembledRaw = obj.content;
            emitVisibleToken(assembledRaw, obj.content);
          }
        });

        if (signal?.aborted) {
          throw createOllamaAbortError();
        }
        if (streamError) {
          return { ok: false, status: streamErrorStatus, error: streamError };
        }
        return {
          ok: true,
          status: devRes.status || 200,
          data: {
            model: finalModel,
            message: { role: "assistant", content: assembledRaw },
            done: true,
          },
        };
      }

      // Non-stream JSON response (e.g. mocked fetch in unit tests)
      const jsonData = await devRes.json().catch(() => null);
      if (jsonData && typeof jsonData === "object" && "ok" in jsonData) {
        const inner = jsonData as OllamaEndpointResult;
        if (inner.ok) {
          const fullText = extractJsonChatText(inner.data);
          if (fullText) emitVisibleToken(fullText, fullText);
        }
        return inner;
      }
      if (!devRes.ok) {
        const errMsg = (jsonData && typeof jsonData === "object" && jsonData.error) || `HTTP ${devRes.status}`;
        return { ok: false, status: devRes.status, data: jsonData, error: String(errMsg) };
      }
      const fullText = extractJsonChatText(jsonData);
      if (fullText) emitVisibleToken(fullText, fullText);
      return { ok: true, status: devRes.status, data: jsonData };
    }
  } catch (err) {
    if (signal?.aborted || isAbortError(err)) {
      throw createOllamaAbortError();
    }
    if (controller?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      return { ok: false, status: 0, error: "ETIMEDOUT" };
    }
    // fall through to direct fetch
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }

  // 3. Direct browser / Vitest fallback
  const directController = typeof AbortController !== "undefined" ? new AbortController() : null;
  const directTimer = directController ? setTimeout(() => directController.abort(new Error("ETIMEDOUT")), timeoutMs) : null;
  const forwardDirectAbort = () => {
    try {
      directController?.abort(createOllamaAbortError());
    } catch {
      /* ignore */
    }
  };
  signal?.addEventListener("abort", forwardDirectAbort, { once: true });

  try {
    const response = await fetch(`${normalizedOrigin}/api/chat`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, stream: Boolean(body.stream) }),
      ...(directController ? { signal: directController.signal } : {}),
    });

    const contentType = response.headers?.get?.("content-type")?.toLowerCase() || "";
    const canStreamNdjson =
      Boolean(response.ok) &&
      Boolean(response.body && typeof response.body.getReader === "function") &&
      (contentType.includes("ndjson") || contentType.includes("event-stream"));

    if (canStreamNdjson && response.body) {
      let assembledRaw = "";
      let streamError: string | null = null;

      await consumeNdjsonStream(response.body, (obj) => {
        if (obj.error) {
          streamError = String(obj.error);
          return;
        }
        const delta = extractJsonChatText(obj);
        if (delta) {
          assembledRaw += delta;
          emitVisibleToken(assembledRaw, delta);
        }
      });

      if (signal?.aborted) {
        throw createOllamaAbortError();
      }
      if (streamError) {
        return { ok: false, status: 500, error: streamError };
      }
      return {
        ok: true,
        status: response.status,
        data: {
          message: { role: "assistant", content: assembledRaw },
          done: true,
        },
      };
    }

    const data = (await response.json().catch(() => null)) as OllamaEndpointPayload | null;
    if (!response.ok) {
      const msg = extractApiError(data) || `HTTP ${response.status}`;
      return {
        ok: false,
        status: response.status,
        data: data ?? undefined,
        error: String(msg),
      };
    }

    const fullText = extractJsonChatText(data);
    if (fullText) {
      emitVisibleToken(fullText, fullText);
    }
    return {
      ok: true,
      status: response.status,
      data: data ?? undefined,
    };
  } catch (err) {
    if (signal?.aborted || isAbortError(err)) {
      throw createOllamaAbortError();
    }
    if (directController?.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      return { ok: false, status: 0, error: "ETIMEDOUT" };
    }
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (directTimer) clearTimeout(directTimer);
    signal?.removeEventListener("abort", forwardDirectAbort);
  }
}

export async function runOllamaAction(
  baseUrl: string,
  action: AiActionType,
  text: string,
  lang: AppLanguage = "th",
  configuredModel: string = "auto"
): Promise<GeminiActionResult> {
  const normalizedUrl = normalizeOllamaBaseUrl(baseUrl);
  if (!normalizedUrl) {
    throw new Error(translate(lang, "settings.ollamaInvalidUrlError"));
  }

  const prompt = buildAiActionPrompt(action, text);
  const targetModel = await resolveOllamaTargetModel(normalizedUrl, configuredModel, lang);

  const res = await requestOllamaEndpoint(normalizedUrl, "/api/chat", {
    model: targetModel,
    stream: false,
    keep_alive: "15m",
    messages: [{ role: "user", content: prompt }],
    options: {
      temperature: 0.3,
      num_ctx: prompt.length <= 2400 ? 2048 : 4096,
      num_predict: 1024,
    },
  }, 300000);

  if (!res.ok) {
    throw formatOllamaError(normalizedUrl, res.status, res.error, lang, targetModel);
  }

  const rawContent =
    typeof res.data?.message?.content === "string"
      ? res.data.message.content
      : typeof res.data?.response === "string"
      ? res.data.response
      : "";

  const withoutThink = stripReasoningThinkBlocks(rawContent);
  if (!withoutThink) {
    throw new Error(translate(lang, "settings.ollamaEmptyResponseError"));
  }

  const sanitized = cleanAiOutputText(withoutThink);
  return {
    result: sanitized || withoutThink,
    modelUsed: targetModel,
  };
}

export async function runOllamaChatHistory(
  baseUrl: string,
  history: GeminiChatMessage[],
  newPrompt: string,
  attachedFilesContext?: string,
  selectedStyle: "smart" | "fast" | "creative" = "smart",
  lang: AppLanguage = "th",
  configuredModel: string = "auto",
  streamOptions?: OllamaStreamOptions
): Promise<GeminiActionResult> {
  const normalizedUrl = normalizeOllamaBaseUrl(baseUrl);
  if (!normalizedUrl) {
    throw new Error(translate(lang, "settings.ollamaInvalidUrlError"));
  }

  if (streamOptions?.signal?.aborted) {
    throw createOllamaAbortError();
  }

  const targetModel = await resolveOllamaTargetModel(
    normalizedUrl,
    configuredModel,
    lang,
    selectedStyle === "fast"
  );
  const relevantKnowledge = getRelevantLunoKnowledge(newPrompt);
  const effectivePrompt = relevantKnowledge
    ? `${newPrompt.trim()}\n\n[Luno Note Reference]\n${relevantKnowledge}`
    : newPrompt;
  const messages = buildOllamaMessages(
    history,
    effectivePrompt,
    attachedFilesContext,
    LUNO_AI_OLLAMA_SYSTEM_PROMPT
  );
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const options = computeOllamaInferenceOptions(selectedStyle, totalChars);

  const payload = {
    model: targetModel,
    stream: Boolean(streamOptions?.onToken || streamOptions?.signal),
    keep_alive: "15m",
    messages,
    options,
  };

  const res =
    streamOptions?.onToken || streamOptions?.signal
      ? await requestOllamaChatStream(normalizedUrl, payload, 300000, streamOptions)
      : await requestOllamaEndpoint(normalizedUrl, "/api/chat", payload, 300000);

  if (!res.ok) {
    throw formatOllamaError(normalizedUrl, res.status, res.error, lang, targetModel);
  }

  const rawContent =
    typeof res.data?.message?.content === "string"
      ? res.data.message.content
      : typeof res.data?.response === "string"
      ? res.data.response
      : "";

  const withoutThink = stripReasoningThinkBlocks(rawContent);
  if (!withoutThink && !rawContent.trim()) {
    throw new Error(translate(lang, "settings.ollamaEmptyResponseError"));
  }

  return {
    result: withoutThink || rawContent.trim(),
    modelUsed: targetModel,
  };
}
