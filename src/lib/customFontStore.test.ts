import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectFontFormat,
  getFontMimeType,
  setCustomFontWorkspaceHandle,
  loadCustomFonts,
  type CustomFont,
} from "./customFontStore";
import { findMatchingFontOption } from "@/components/Editor";

describe("customFontStore helpers", () => {
  describe("detectFontFormat", () => {
    it("detects .ttf", () => {
      expect(detectFontFormat("sarabun.ttf")).toBe("truetype");
      expect(detectFontFormat("SARABUN.TTF")).toBe("truetype");
    });

    it("detects .otf", () => {
      expect(detectFontFormat("prompt-bold.otf")).toBe("opentype");
      expect(detectFontFormat("MY_FONT.OTF")).toBe("opentype");
    });

    it("detects .woff and .woff2", () => {
      expect(detectFontFormat("kanit.woff")).toBe("woff");
      expect(detectFontFormat("kanit.woff2")).toBe("woff2");
    });

    it("defaults to truetype for unknown extensions", () => {
      expect(detectFontFormat("customfont.bin")).toBe("truetype");
      expect(detectFontFormat("fontwithoutdot")).toBe("truetype");
    });
  });

  describe("getFontMimeType", () => {
    it("returns correct mime type for each format", () => {
      expect(getFontMimeType("truetype")).toBe("font/ttf");
      expect(getFontMimeType("opentype")).toBe("font/otf");
      expect(getFontMimeType("woff")).toBe("font/woff");
      expect(getFontMimeType("woff2")).toBe("font/woff2");
    });
  });

  describe("findMatchingFontOption with custom fonts", () => {
    const mockCustomFonts: CustomFont[] = [
      {
        id: "custom_prompt_regular",
        name: "Prompt Regular",
        fileName: "Prompt-Regular.ttf",
        format: "truetype",
        css: "'custom_prompt_regular', sans-serif",
        createdAt: 1000,
      },
      {
        id: "custom_mitr_thai",
        name: "Mitr Thai",
        fileName: "Mitr-Thai.woff2",
        format: "woff2",
        css: "'custom_mitr_thai', sans-serif",
        createdAt: 2000,
      },
    ];

    it("matches custom font by ID", () => {
      const match = findMatchingFontOption("custom_prompt_regular", mockCustomFonts);
      expect(match).toBeDefined();
      expect(match?.displayName).toBe("Prompt Regular");
      expect(match?.isCustom).toBe(true);
      expect(match?.css).toBe("'custom_prompt_regular', sans-serif");
    });

    it("matches custom font by name", () => {
      const match = findMatchingFontOption("Prompt Regular", mockCustomFonts);
      expect(match).toBeDefined();
      expect(match?.id).toBe("custom_prompt_regular");
      expect(match?.isCustom).toBe(true);
    });

    it("matches custom font by CSS family name", () => {
      const match = findMatchingFontOption("'custom_mitr_thai', sans-serif", mockCustomFonts);
      expect(match).toBeDefined();
      expect(match?.displayName).toBe("Mitr Thai");
      expect(match?.isCustom).toBe(true);
    });

    it("falls back to built-in system fonts when not custom", () => {
      const match = findMatchingFontOption("inter", mockCustomFonts);
      expect(match).toBeDefined();
      expect(match?.id).toBe("inter");
      expect(match?.isCustom).toBeUndefined();
    });
  });

  describe("loadCustomFonts in Electron environment", () => {
    beforeEach(() => {
      setCustomFontWorkspaceHandle(null);
      delete (window as any).electronAPI;
    });

    it("loads fonts from .luno/fonts.json and fetches font files in Electron", async () => {
      const mockMeta = JSON.stringify([
        {
          id: "custom_test_font",
          name: "Test Font",
          fileName: "TestFont.ttf",
          format: "truetype",
          css: "'custom_test_font', sans-serif",
          createdAt: 12345,
        },
      ]);

      const mockBase64 = "AAEAAAASAQA...";

      (window as any).electronAPI = {
        getSavedWorkspace: vi.fn().mockResolvedValue({ folderPath: "E:/test-workspace" }),
        readFileContent: vi.fn().mockImplementation(async (path: string) => {
          if (path.endsWith("fonts.json")) return mockMeta;
          return null;
        }),
        readFileBase64: vi.fn().mockImplementation(async (path: string) => {
          if (path.endsWith("TestFont.ttf")) {
            return mockBase64;
          }
          return null;
        }),
      };

      const fonts = await loadCustomFonts();
      expect(fonts.length).toBe(1);
      expect(fonts[0].name).toBe("Test Font");
      expect(fonts[0].dataUrl).toBe(`data:font/ttf;base64,${mockBase64}`);
    });
  });
});
