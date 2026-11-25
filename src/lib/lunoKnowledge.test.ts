import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LUNO_COMPACT_PRODUCT_IDENTITY,
  LUNO_SECURITY_AND_IP_GUARDRAIL,
  getRelevantLunoKnowledge,
} from "@/lib/lunoKnowledge";
import { LUNO_AI_SYSTEM_PROMPT, runGeminiChatHistory } from "@/lib/geminiApi";
import { LUNO_AI_OLLAMA_SYSTEM_PROMPT, runOllamaChatHistory } from "@/lib/ollamaApi";
import { APP_VERSION } from "@/lib/appVersion";

describe("lunoKnowledge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("embeds detailed Luno Note identity and anti-cloning/security guardrails in both system prompts", () => {
    expect(LUNO_COMPACT_PRODUCT_IDENTITY).toContain("Luno Note");
    expect(LUNO_COMPACT_PRODUCT_IDENTITY).toContain(APP_VERSION);
    expect(LUNO_COMPACT_PRODUCT_IDENTITY).toContain("Gemini");
    expect(LUNO_COMPACT_PRODUCT_IDENTITY).toContain("Ollama");

    expect(LUNO_AI_SYSTEM_PROMPT).toContain("System Fix Language");
    expect(LUNO_AI_SYSTEM_PROMPT).toContain("Security, Privacy & Anti-Cloning Rules");
    expect(LUNO_AI_OLLAMA_SYSTEM_PROMPT).toContain(APP_VERSION);
    expect(LUNO_AI_OLLAMA_SYSTEM_PROMPT).toContain("Security, Privacy & Anti-Cloning Rules");
    expect(LUNO_SECURITY_AND_IP_GUARDRAIL).toContain("cloning or reverse-engineering");
  });

  it("matches detailed Thai & English feature topics accurately and stays empty for unrelated prompts", () => {
    const overviewTh = getRelevantLunoKnowledge("โปรแกรม Luno ทำอะไรได้บ้าง แบบละเอียด", [], 6);
    expect(overviewTh).toContain("Luno Note Product Tour");
    expect(overviewTh).toContain("Split View");

    const themesTh = getRelevantLunoKnowledge("ธีมสไตล์ Midnight หรือ Cyberpunk กับฟอนต์ตั้งค่าตรงไหน");
    expect(themesTh).toContain("8 signature Visual Styles");
    expect(themesTh).toContain(".ttf, .otf, .woff, .woff2");

    const historyTh = getRelevantLunoKnowledge("ดูประวัติเวอร์ชัน เปรียบเทียบ diff หรือส่งออก Word/PDF ทำไง");
    expect(historyTh).toContain("Version History");
    expect(historyTh).toContain("Side-by-Side, Visual Diff");

    const shortcutsTh = getRelevantLunoKnowledge("คีย์ลัดสลับแถบด้านข้างกับเปิดตั้งค่าคืออะไร");
    expect(shortcutsTh).toContain("Ctrl+\\");
    expect(shortcutsTh).toContain("Ctrl+,");

    const securityTh = getRelevantLunoKnowledge("อยากล็อกโน้ตด้วย PIN และซิงก์ Google Drive ทำยังไง");
    expect(securityTh).toContain("6-digit PIN");
    expect(securityTh).toContain("Google Drive Sync");

    const toolsTh = getRelevantLunoKnowledge("ฟีเจอร์แก้พิมพ์ผิดภาษาไทยอังกฤษ พีดีเอฟ และเครื่องคิดเลขอยู่ตรงไหน");
    expect(toolsTh).toContain("Ctrl+Shift+L");
    expect(toolsTh).toContain("PDF reader with color highlights and bookmarks");
    expect(toolsTh).toContain("Calculator");

    const unrelated = getRelevantLunoKnowledge("ช่วยสรุปบทความเรื่องการบริหารเวลาหน่อย");
    expect(unrelated).toBe("");
  });

  it("never exposes internal source files, IPC channels, storage keys, secrets, or proprietary implementation internals", () => {
    const allKnowledgeText = [
      LUNO_COMPACT_PRODUCT_IDENTITY,
      LUNO_SECURITY_AND_IP_GUARDRAIL,
      LUNO_AI_SYSTEM_PROMPT,
      LUNO_AI_OLLAMA_SYSTEM_PROMPT,
      getRelevantLunoKnowledge(
        "luno overview editor slash table template theme history shortcuts fix-lang pdf web-viewer gemini ollama pin sync backup",
        [],
        9
      ),
    ].join("\n");

    const forbiddenInternals = [
      "electron/main.js",
      "electron/preload.js",
      "isPathAllowedForIpc",
      "resolveExistingRealPath",
      "thaiKeyboardMapper",
      "LunoFixLang.exe",
      "notes-app-settings",
      "/__luno_ollama/",
      "ollama-request",
      "ollama-stream-chat",
      "ollama-chat-stream",
      "PBKDF2",
      "safeStorage",
      "code_challenge",
      "x-goog-api-key",
      "useAppSettings",
      "SettingsTabView",
      "ipcRenderer",
      "ipcMain",
    ];

    for (const secretOrInternal of forbiddenInternals) {
      expect(allKnowledgeText).not.toContain(secretOrInternal);
    }
  });

  it("injects relevant Luno Note reference dynamically into Gemini and Ollama chats only when helpful", async () => {
    interface CapturedRequestPayload {
      systemInstruction?: { parts?: Array<{ text?: string }> };
      messages?: Array<{ role?: string; content?: string }>;
    }
    const capturedBodies: Array<{ url: string; body: CapturedRequestPayload | null }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const parsedBody = init?.body ? (JSON.parse(String(init.body)) as CapturedRequestPayload) : null;
      capturedBodies.push({ url: String(url), body: parsedBody });
      if (String(url).startsWith("/__luno_ollama/")) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      if (String(url).includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "Gemini reply" }] } }],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: { role: "assistant", content: "Ollama reply" },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await runGeminiChatHistory("key-123", [], "คีย์ลัดเปิด Luno AI คือปุ่มไหน", undefined, "smart", "th", "gemini-2.5-flash");
    const geminiReq = capturedBodies.find((c) => c.url.includes("generativelanguage.googleapis.com"))!;
    expect(geminiReq.body.systemInstruction.parts[0].text).toContain("Ctrl+Shift+A");

    await runOllamaChatHistory("http://localhost:11434", [], "คีย์ลัดแก้พิมพ์ผิดภาษาคืออะไร", undefined, "fast", "th", "qwen2.5:1.5b");
    await runOllamaChatHistory("http://localhost:11434", [], "ช่วยแต่งกลอน 2 บรรทัด", undefined, "fast", "th", "qwen2.5:1.5b");

    const ollamaChatBodies = capturedBodies.filter((c) => c.url.endsWith("/api/chat"));
    expect(ollamaChatBodies).toHaveLength(2);
    expect(ollamaChatBodies[0].body.messages[1].content).toContain("Ctrl+Shift+L");
    expect(ollamaChatBodies[1].body.messages[1].content).toBe("ช่วยแต่งกลอน 2 บรรทัด");
  });
});
