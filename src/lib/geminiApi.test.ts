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
});
