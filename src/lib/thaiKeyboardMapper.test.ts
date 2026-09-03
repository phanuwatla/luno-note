import { describe, it, expect } from "vitest";
import { mapTextToLanguage, swapKeyboardLayout } from "./thaiKeyboardMapper";

describe("thaiKeyboardMapper", () => {
  it("maps English keys to Thai Kedmanee characters correctly", () => {
    // d -> ก, k -> า, g -> เ, h -> ้, e -> ำ, l -> ส, o -> น
    expect(mapTextToLanguage("hello", "th")).toBe("้ำสสน");
    expect(mapTextToLanguage("dk", "th")).toBe("กา");
    expect(mapTextToLanguage("gdk", "th")).toBe("เกา");
  });

  it("maps Thai Kedmanee characters to English correctly", () => {
    expect(mapTextToLanguage("้ำสสน", "en")).toBe("hello");
    expect(mapTextToLanguage("กา", "en")).toBe("dk");
    expect(mapTextToLanguage("เกา", "en")).toBe("gdk");
  });

  it("leaves characters alone if target matches or no mapping needed", () => {
    expect(mapTextToLanguage("สวัสดี", "th")).toBe("สวัสดี");
    expect(mapTextToLanguage("hello world", "en")).toBe("hello world");
    expect(mapTextToLanguage("123", "system")).toBe("123");
  });

  describe("swapKeyboardLayout (bidirectional layout swap)", () => {
    it("converts mixed English and Thai sentence correctly", () => {
      // User specific example: "l;ylfumujouj ธ้ฟรสฟืก" -> "สวัสดีที่นี่ Thailand"
      expect(swapKeyboardLayout("l;ylfumujouj ธ้ฟรสฟืก")).toBe("สวัสดีที่นี่ Thailand");
    });

    it("swaps Thai and English bidirectionally and reversibly", () => {
      const original = "l;ylfumujouj ธ้ฟรสฟืก";
      const converted = swapKeyboardLayout(original);
      expect(converted).toBe("สวัสดีที่นี่ Thailand");
      expect(swapKeyboardLayout(converted)).toBe(original);
    });

    it("converts pure English to Thai", () => {
      expect(swapKeyboardLayout("hello")).toBe("้ำสสน");
      expect(swapKeyboardLayout("gdk")).toBe("เกา");
    });

    it("converts pure Thai to English", () => {
      expect(swapKeyboardLayout("้ำสสน")).toBe("hello");
      expect(swapKeyboardLayout("เกา")).toBe("gdk");
    });

    it("handles whitespace, newlines, and unmapped characters", () => {
      expect(swapKeyboardLayout("")).toBe("");
      expect(swapKeyboardLayout("   \n\t  ")).toBe("   \n\t  ");
      expect(swapKeyboardLayout("l;ylfu 123 😊 ธ้ฟรสฟืก")).toBe("สวัสดี ๅ/- 😊 Thailand");
    });
  });
});

