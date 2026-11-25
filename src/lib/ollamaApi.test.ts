import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizeOllamaBaseUrl,
  fetchOllamaModels,
  runOllamaAction,
  runOllamaChatHistory,
  stripReasoningThinkBlocks,
  stripStreamingThinkBlocks,
  buildOllamaMessages,
  MAX_OLLAMA_HISTORY_CHARS,
  isAbortError,
  pullOllamaModel,
  cancelOllamaModelPull,
  deleteOllamaModel,
  installAndSetupOllama,
  getActiveOllamaPulls,
  RECOMMENDED_OLLAMA_MODELS,
} from "@/lib/ollamaApi";
import {
  isAiProviderConfigured,
  executeAiAction,
  executeAiChatHistory,
} from "@/lib/aiProvider";

describe("ollamaApi and aiProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("validates and normalizes Ollama base URLs while blocking SSRF metadata and non-HTTP schemes", () => {
    expect(normalizeOllamaBaseUrl("http://localhost:11434")).toBe("http://localhost:11434");
    expect(normalizeOllamaBaseUrl("http://127.0.0.1:11434/api/tags")).toBe("http://127.0.0.1:11434");
    expect(normalizeOllamaBaseUrl("localhost:11434")).toBe("http://localhost:11434");
    expect(normalizeOllamaBaseUrl("")).toBe("http://localhost:11434");

    // Reject dangerous schemes, embedded credentials, and cloud metadata / link-local hosts
    expect(normalizeOllamaBaseUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeOllamaBaseUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeOllamaBaseUrl("http://user:pass@localhost:11434")).toBeNull();
    expect(normalizeOllamaBaseUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(normalizeOllamaBaseUrl("http://metadata.google.internal")).toBeNull();
    expect(normalizeOllamaBaseUrl("http://0.0.0.0:11434")).toBeNull();
  });

  it("fetches and sorts available Ollama models with chat models prioritized ahead of embedding models", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        models: [
          { name: "nomic-embed-text:latest", size: 274000000 },
          { name: "qwen2.5:7b", size: 4680000000, details: { parameter_size: "7.6B" } },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const status = await fetchOllamaModels("http://localhost:11434");
    expect(status.connected).toBe(true);
    expect(status.models).toHaveLength(2);
    expect(status.models[0].id).toBe("qwen2.5:7b");
    expect(status.models[0].name).toBe("qwen2.5:7b (7.6B)");
    expect(status.models[1].id).toBe("nomic-embed-text:latest");
  });

  it("strips <think> reasoning blocks and preserves markdown formatting in runOllamaAction", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          role: "assistant",
          content: "<think>Analyzing user checklist...</think>\n```markdown\n- [ ] Improved task 1\n- [x] Improved task 2\n```",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runOllamaAction(
      "http://localhost:11434",
      "improve",
      "- [ ] Task 1\n- [x] Task 2",
      "en",
      "deepseek-r1:8b"
    );

    expect(res.modelUsed).toBe("deepseek-r1:8b");
    expect(res.result).toBe("- [ ] Improved task 1\n- [x] Improved task 2");
    expect(stripReasoningThinkBlocks("<think>secret thought</think>Final answer")).toBe("Final answer");
  });

  it("builds multi-turn Ollama chat messages and executes chat history via executeAiChatHistory", async () => {
    const messages = buildOllamaMessages(
      [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
      "Summarize this",
      "Note content here"
    );

    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "Hello" });
    expect(messages[2]).toEqual({ role: "assistant", content: "Hi there!" });
    expect(messages[3].role).toBe("user");
    expect(messages[3].content).toContain("Summarize this");
    expect(messages[3].content).toContain("Note content here");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          role: "assistant",
          content: "Here is your summary from Ollama.",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const config = {
      aiProvider: "ollama" as const,
      geminiApiKey: "",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "qwen2.5:7b",
    };

    expect(isAiProviderConfigured(config)).toBe(true);
    expect(isAiProviderConfigured({ aiProvider: "gemini", geminiApiKey: "" })).toBe(false);

    const chatRes = await executeAiChatHistory(config, [], "Hello Ollama", undefined, "smart", "en");
    expect(chatRes.result).toBe("Here is your summary from Ollama.");
    expect(chatRes.modelUsed).toBe("qwen2.5:7b");

    const actionRes = await executeAiAction(config, "simplify", "Complex text", "en");
    expect(actionRes.result).toBe("Here is your summary from Ollama.");
    expect(actionRes.modelUsed).toBe("qwen2.5:7b");
  });

  it("supports one-click model pull and installAndSetupOllama with model name validation", async () => {
    expect(RECOMMENDED_OLLAMA_MODELS.length).toBeGreaterThan(0);

    // Reject invalid model names
    const invalidPull = await pullOllamaModel("http://localhost:11434", "bad model; rm -rf /");
    expect(invalidPull.ok).toBe(false);
    expect(invalidPull.error).toBe("INVALID_MODEL_NAME");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/tags")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ models: [] }),
        };
      }
      if (url.endsWith("/api/pull")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: "success" }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const setupRes = await installAndSetupOllama("http://localhost:11434", "qwen2.5:3b");
    expect(setupRes.ok).toBe(true);
    expect(setupRes.installedModel).toBe("qwen2.5:3b");
  });

  it("supports canceling active model pulls and deleting installed models", async () => {
    const invalidDel = await deleteOllamaModel("http://localhost:11434", "bad model; rm");
    expect(invalidDel.ok).toBe(false);
    expect(invalidDel.error).toBe("INVALID_MODEL_NAME");

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/delete") && init?.method === "DELETE") {
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        };
      }
      if (url.endsWith("/__luno_ollama/cancel")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, canceled: true }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const cancelRes = await cancelOllamaModelPull("qwen2.5:3b");
    expect(cancelRes.ok).toBe(true);
    expect(cancelRes.canceled).toBe(true);

    const delRes = await deleteOllamaModel("http://localhost:11434", "qwen2.5:3b");
    expect(delRes.ok).toBe(true);
  });

  it("retrieves active Ollama pulls from progress endpoint", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/__luno_ollama/progress")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: {
              "qwen2.5:3b": { stage: "pulling", model: "qwen2.5:3b", percent: 54 },
            },
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const active = await getActiveOllamaPulls();
    expect(active).toHaveLength(1);
    expect(active[0]).toEqual({ stage: "pulling", model: "qwen2.5:3b", percent: 54 });
  });

  it("distinguishes timeout errors from offline connection errors", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ETIMEDOUT"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runOllamaChatHistory("http://localhost:11434", [], "Hello", undefined, "smart", "en", "qwen2.5:3b")
    ).rejects.toThrow(/took too long to respond/i);
  });

  it("streams NDJSON tokens incrementally, strips unclosed <think> tags, and supports AbortSignal", async () => {
    expect(stripStreamingThinkBlocks("<think>reasoning still going")).toBe("");
    expect(stripStreamingThinkBlocks("<think>done</think>Hello world")).toBe("Hello world");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"delta":"<think>secret"}\n'));
        controller.enqueue(encoder.encode('{"delta":"</think>สวัสดี"}\n'));
        controller.enqueue(encoder.encode('{"delta":"ครับ","done":true}\n'));
        controller.close();
      },
    });

    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/__luno_ollama/stream") {
        return {
          ok: true,
          status: 200,
          body: stream,
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const streamedUpdates: string[] = [];
    const res = await runOllamaChatHistory(
      "http://localhost:11434",
      [],
      "ทักทาย",
      undefined,
      "fast",
      "th",
      "qwen2.5:1.5b",
      {
        onToken: (visible) => {
          streamedUpdates.push(visible);
        },
      }
    );

    expect(res.result).toBe("สวัสดีครับ");
    expect(streamedUpdates).toEqual(["สวัสดี", "สวัสดีครับ"]);

    const abortController = new AbortController();
    abortController.abort();
    let caughtErr: unknown;
    try {
      await runOllamaChatHistory(
        "http://localhost:11434",
        [],
        "ทักทาย",
        undefined,
        "fast",
        "th",
        "qwen2.5:1.5b",
        { signal: abortController.signal }
      );
    } catch (err) {
      caughtErr = err;
    }
    expect(isAbortError(caughtErr)).toBe(true);
  });

  it("bounds old history turns for CPU speed and picks smallest model in auto fast style", async () => {
    const longOld = "A".repeat(MAX_OLLAMA_HISTORY_CHARS);
    const msgs = buildOllamaMessages(
      [
        { role: "user", content: longOld },
        { role: "assistant", content: "Old reply" },
        { role: "user", content: "Recent question" },
      ],
      "Current prompt"
    );

    expect(msgs.some((m) => m.content.includes(longOld))).toBe(false);
    expect(msgs.some((m) => m.content === "Old reply")).toBe(true);
    expect(msgs[msgs.length - 1].content).toContain("Recent question");
    expect(msgs[msgs.length - 1].content).toContain("Current prompt");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/tags")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: [
              { name: "qwen2.5:7b", details: { parameter_size: "7.6B" } },
              { name: "qwen2.5:1.5b", details: { parameter_size: "1.5B" } },
            ],
          }),
        };
      }
      if (url.endsWith("/api/chat")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: { role: "assistant", content: "Fast reply" } }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runOllamaChatHistory("http://localhost:11434", [], "Hi", undefined, "fast", "en", "auto");
    expect(res.modelUsed).toBe("qwen2.5:1.5b");
    expect(res.result).toBe("Fast reply");
  });

  it("falls back automatically to local Ollama when Gemini quota is exceeded or network is offline", async () => {
    const baseConfig = {
      aiProvider: "gemini" as const,
      autoFallbackToOllama: true,
      geminiApiKey: "test-gemini-key",
      aiModel: "gemini-2.5-flash",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "missing-model:7b",
    };

    // 1. Quota exhausted (429) -> falls back to installed Ollama chat model
    const quotaFetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          json: async () => ({ error: { message: "Quota exceeded for quota_limit" } }),
        };
      }
      if (url.endsWith("/api/tags")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: [
              { name: "nomic-embed-text:latest" },
              { name: "qwen2.5:1.5b", details: { parameter_size: "1.5B" } },
            ],
          }),
        };
      }
      if (url.endsWith("/api/chat")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: { role: "assistant", content: "Ollama fallback chat reply" } }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", quotaFetchMock);

    const chatFallback = await executeAiChatHistory(baseConfig, [], "Hello fallback", undefined, "fast", "en");
    expect(chatFallback.result).toBe("Ollama fallback chat reply");
    expect(chatFallback.modelUsed).toBe("qwen2.5:1.5b");
    expect(chatFallback.fallbackFrom).toBe("gemini");
    expect(chatFallback.fallbackReason).toBe("quota");

    const actionFallback = await executeAiAction(baseConfig, "improve", "Draft note text", "en");
    expect(actionFallback.result).toBe("Ollama fallback chat reply");
    expect(actionFallback.fallbackFrom).toBe("gemini");
    expect(actionFallback.fallbackReason).toBe("quota");

    // 2. Network drop / offline -> falls back with reason "offline"
    const offlineFetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        throw new TypeError("Failed to fetch");
      }
      if (url.endsWith("/api/tags")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ models: [{ name: "qwen2.5:1.5b" }] }),
        };
      }
      if (url.endsWith("/api/chat")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: { role: "assistant", content: "Offline Ollama reply" } }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", offlineFetchMock);

    const offlineRes = await executeAiChatHistory(baseConfig, [], "Offline test", undefined, "smart", "en");
    expect(offlineRes.result).toBe("Offline Ollama reply");
    expect(offlineRes.fallbackFrom).toBe("gemini");
    expect(offlineRes.fallbackReason).toBe("offline");
  });

  it("never falls back on invalid Gemini key, token limit, disabled toggle, missing Ollama chat models, or Ollama->Gemini", async () => {
    const installedTagsMock = {
      ok: true,
      status: 200,
      json: async () => ({ models: [{ name: "qwen2.5:1.5b" }] }),
    };

    // 1. Invalid Gemini API Key (403) must surface error, never silently hide behind Ollama
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("generativelanguage.googleapis.com")) {
          return {
            ok: false,
            status: 403,
            statusText: "Forbidden",
            json: async () => ({ error: { message: "API key not valid" } }),
          };
        }
        return installedTagsMock;
      })
    );
    await expect(
      executeAiChatHistory(
        { aiProvider: "gemini", autoFallbackToOllama: true, geminiApiKey: "bad-key" },
        [],
        "Hello",
        undefined,
        "smart",
        "en"
      )
    ).rejects.toThrow(/Invalid Gemini API Key/i);

    // 2. Disabled autoFallbackToOllama must not touch Ollama on 429
    const disabledMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          json: async () => ({ error: { message: "Quota exceeded" } }),
        };
      }
      return installedTagsMock;
    });
    vi.stubGlobal("fetch", disabledMock);
    await expect(
      executeAiChatHistory(
        { aiProvider: "gemini", autoFallbackToOllama: false, geminiApiKey: "key" },
        [],
        "Hello",
        undefined,
        "smart",
        "en"
      )
    ).rejects.toThrow(/quota exceeded/i);
    expect(disabledMock.mock.calls.some(([u]) => String(u).includes("/api/tags"))).toBe(false);

    // 3. Only embedding model installed on Ollama -> rethrows Gemini quota error cleanly
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("generativelanguage.googleapis.com")) {
          return {
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            json: async () => ({ error: { message: "Quota exceeded" } }),
          };
        }
        if (url.endsWith("/api/tags")) {
          return { ok: true, status: 200, json: async () => ({ models: [{ name: "nomic-embed-text:latest" }] }) };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      })
    );
    await expect(
      executeAiAction(
        { aiProvider: "gemini", autoFallbackToOllama: true, geminiApiKey: "key" },
        "improve",
        "Text",
        "en"
      )
    ).rejects.toThrow(/quota exceeded/i);

    // 4. Privacy rule: Ollama mode never falls back to Gemini Cloud when Ollama is offline
    const ollamaStrictMock = vi.fn(async (_url: string) => ({ ok: false, status: 0, json: async () => ({}) }));
    vi.stubGlobal("fetch", ollamaStrictMock);
    await expect(
      executeAiChatHistory(
        { aiProvider: "ollama", autoFallbackToOllama: true, geminiApiKey: "key", ollamaModel: "qwen2.5:1.5b" },
        [],
        "Private note",
        undefined,
        "smart",
        "en"
      )
    ).rejects.toThrow();
    expect(ollamaStrictMock.mock.calls.some(([u]) => String(u).includes("generativelanguage.googleapis.com"))).toBe(false);
  });
});
