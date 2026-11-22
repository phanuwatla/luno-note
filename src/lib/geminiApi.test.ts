import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isModelExhausted,
  markModelExhausted,
  clearExhaustedModels,
  fetchAvailableModels,
} from "@/lib/geminiApi";

describe("geminiApi quota tracking and model selection", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
    });

    clearExhaustedModels();
  });

  it("marks a model as exhausted and detects it correctly", () => {
    expect(isModelExhausted("gemini-2.5-flash")).toBe(false);
    markModelExhausted("gemini-2.5-flash");
    expect(isModelExhausted("gemini-2.5-flash")).toBe(true);
    expect(isModelExhausted("gemini-2.5-pro")).toBe(false);
  });

  it("clears exhausted models properly", () => {
    markModelExhausted("gemini-2.5-flash");
    expect(isModelExhausted("gemini-2.5-flash")).toBe(true);
    clearExhaustedModels();
    expect(isModelExhausted("gemini-2.5-flash")).toBe(false);
  });

  it("returns available models with isExhausted flag set", async () => {
    markModelExhausted("gemini-1.5-flash");
    const models = await fetchAvailableModels("");
    const flash15 = models.find((m) => m.id === "gemini-1.5-flash");
    const flash25 = models.find((m) => m.id === "gemini-2.5-flash");

    expect(flash15).toBeDefined();
    expect(flash15?.isExhausted).toBe(true);
    expect(flash25).toBeDefined();
    expect(flash25?.isExhausted).toBe(false);
  });

  it("distinguishes specialized models from main models", async () => {
    const { isSpecializedModel, STANDARD_MAIN_MODELS, saveStoredSpecializedModels, getAutoModelCandidates } = await import("@/lib/geminiApi");

    // Standard main models should not be specialized
    STANDARD_MAIN_MODELS.forEach((m) => {
      expect(isSpecializedModel(m)).toBe(false);
    });

    // Experimental / thinking / snapshot models should be recognized as specialized
    expect(isSpecializedModel("gemini-2.0-flash-thinking-exp-01-21")).toBe(true);
    expect(isSpecializedModel("gemini-1.5-flash-8b")).toBe(true);
    expect(isSpecializedModel("gemini-2.0-pro-exp-02-05")).toBe(true);
    expect(isSpecializedModel("gemini-1.5-flash-001")).toBe(true);
    expect(isSpecializedModel("learnlm-1.5-pro-experimental")).toBe(true);

    // Stored specialized models should be included in auto candidates
    saveStoredSpecializedModels(["gemini-1.5-flash-8b", "gemini-2.0-flash-thinking-exp"]);
    const autoCandidates = getAutoModelCandidates();
    expect(autoCandidates).toContain("gemini-1.5-flash-8b");
    expect(autoCandidates).toContain("gemini-2.0-flash-thinking-exp");
  });

  it("cleanAiOutputText preserves and normalizes markdown checklists and strips code blocks", async () => {
    const { cleanAiOutputText } = await import("@/lib/geminiApi");

    // Standard checklist preserved
    const standardChecklist = "- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3";
    expect(cleanAiOutputText(standardChecklist)).toBe(standardChecklist);

    // Strips wrapping code blocks
    const fencedChecklist = "```markdown\n- [ ] Task 1\n- [ ] Task 2\n```";
    expect(cleanAiOutputText(fencedChecklist)).toBe("- [ ] Task 1\n- [ ] Task 2");

    // Normalizes * [ ] and [ ] to - [ ]
    const rawChecklist = "* [ ] Buy milk\n* [x] Walk dog\n[ ] Read book";
    expect(cleanAiOutputText(rawChecklist)).toBe("- [ ] Buy milk\n- [x] Walk dog\n- [ ] Read book");

    // Does not truncate multi-line text with quotes inside
    const checklistWithQuote = '- [ ] Read "Atomic Habits" book\n- [ ] Write summary';
    expect(cleanAiOutputText(checklistWithQuote)).toBe('- [ ] Read "Atomic Habits" book\n- [ ] Write summary');

    // Preserves HTML styling spans (color, font-family, font-size) without truncating to internal style quotes
    const styledHtmlSpan = '<span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;"><span style="font-size: 24px;">ไฟล์</span></span></span>';
    expect(cleanAiOutputText(styledHtmlSpan)).toBe(styledHtmlSpan);

    // Decodes entity-escaped spans
    const escapedSpan = '&lt;span style="color: red"&gt;ข้อความ&lt;/span&gt;';
    expect(cleanAiOutputText(escapedSpan)).toBe('<span style="color: red">ข้อความ</span>');
  });

  it("generates image via Gemini native generateContent using x-goog-api-key header", async () => {
    const { generateImageWithGemini } = await import("@/lib/geminiApi");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: "Here is your sunset mountain illustration." },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
                  },
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const res = await generateImageWithGemini("test-secret-key", "Sunset over mountains", {
        aspectRatio: "16:9",
        lang: "en",
      });

      expect(res.images).toHaveLength(1);
      expect(res.images[0].dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.images[0].aspectRatio).toBe("16:9");
      expect(res.text).toBe("Here is your sunset mountain illustration.");
      expect(res.modelUsed).toBe("gemini-2.5-flash-image");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).not.toContain("test-secret-key");
      expect(calledInit.headers["x-goog-api-key"]).toBe("test-secret-key");
      const sentBody = JSON.parse(calledInit.body);
      expect(sentBody.generationConfig.responseModalities).toEqual(["TEXT", "IMAGE"]);
      expect(sentBody.generationConfig.imageConfig.aspectRatio).toBe("16:9");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("retries without imageConfig when model rejects imageConfig and falls back to Imagen predict when needed", async () => {
    const { generateImageWithGemini, STANDARD_IMAGE_MODELS } = await import("@/lib/geminiApi");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes(":predict")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            predictions: [
              {
                bytesBase64Encoded: "AAAA",
                mimeType: "image/jpeg",
              },
            ],
          }),
        };
      }
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: { message: "Model not found" } }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const res = await generateImageWithGemini("test-key", "Minimalist desk setup", {
        aspectRatio: "4:3",
        lang: "en",
      });

      expect(res.images).toHaveLength(1);
      expect(res.images[0].dataUrl).toBe("data:image/jpeg;base64,AAAA");
      expect(res.modelUsed).toBe(STANDARD_IMAGE_MODELS.find((m) => m.includes("imagen")));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("throws GeminiFreeTierImageError (not generic quota exceeded) when Free Tier returns limit: 0 and billed-users-only", async () => {
    const { generateImageWithGemini, GeminiFreeTierImageError } = await import("@/lib/geminiApi");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes(":predict")) {
        return {
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({
            error: {
              message: "Imagen API is only accessible to billed users at this time.",
            },
          }),
        };
      }
      return {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({
          error: {
            message:
              "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.5-flash-image",
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        generateImageWithGemini("free-tier-key", "Cute robot", { lang: "th" })
      ).rejects.toBeInstanceOf(GeminiFreeTierImageError);

      // Should fail fast after checking 1 Gemini image model + 1 Imagen model (not all 7)
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
      // Should NOT falsely mark model as temporarily exhausted
      expect(isModelExhausted("gemini-2.5-flash-image")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("still reports real quota exceeded (not Free Tier error) when Paid Tier hits a non-zero rate limit", async () => {
    const { generateImageWithGemini, GeminiFreeTierImageError } = await import("@/lib/geminiApi");

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({
        error: {
          message:
            "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: requests_per_minute, limit: 10",
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      let caught: unknown;
      try {
        await generateImageWithGemini("paid-key", "Cute robot", { lang: "en" });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(Error);
      expect(caught).not.toBeInstanceOf(GeminiFreeTierImageError);
      expect((caught as Error).message).toContain("quota exceeded");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
