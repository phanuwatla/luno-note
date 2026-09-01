import { describe, it, expect } from "vitest";
import { mapTextToLanguage } from "./thaiKeyboardMapper";

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
});
