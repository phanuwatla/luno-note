import { describe, it, expect } from "vitest";
import { detectWrongLanguage, getWrongLanguageCandidate, isPlausibleThai } from "./wrongLanguageDetector";

describe("wrongLanguageDetector", () => {
  it("detects English keys typed when intending Thai", () => {
    // "l;ylfu" -> "สวัสดี" (l -> ส, ; -> ว, y -> ั, l -> ส, f -> ด, u -> ี)
    const r1 = detectWrongLanguage("l;ylfu");
    expect(r1).not.toBeNull();
    expect(r1?.replacement).toBe("สวัสดี");
    expect(r1?.targetLang).toBe("th");

    // "vpjk]n," -> "อย่าลืม" (v -> อ, p -> ย, j -> ่, k -> า, ] -> ล, n -> ื, , -> ม)
    const r2 = detectWrongLanguage("vpjk]n,");
    expect(r2).not.toBeNull();
    expect(r2?.replacement).toBe("อย่าลืม");

    // "dkixDb[y9b9y;" -> "การปฏิบัติตัว"
    const r3 = detectWrongLanguage("dkixDb[y9b9y;");
    expect(r3).not.toBeNull();
    expect(r3?.replacement).toBe("การปฏิบัติตัว");
  });

  it("detects Thai keys typed when intending English", () => {
    // "ธ้ฟรสฟืก" -> "Thailand"
    const r1 = detectWrongLanguage("ธ้ฟรสฟืก");
    expect(r1).not.toBeNull();
    expect(r1?.replacement).toBe("Thailand");
    expect(r1?.targetLang).toBe("en");

    // "้ำสสน" -> "hello"
    const r2 = detectWrongLanguage("้ำสสน");
    expect(r2).not.toBeNull();
    expect(r2?.replacement).toBe("hello");
  });

  it("does not false-positive on legitimate English keywords and common words", () => {
    expect(detectWrongLanguage("const")).toBeNull();
    expect(detectWrongLanguage("return")).toBeNull();
    expect(detectWrongLanguage("function")).toBeNull();
    expect(detectWrongLanguage("the")).toBeNull();
    expect(detectWrongLanguage("apple")).toBeNull();
    expect(detectWrongLanguage("note")).toBeNull();
  });

  it("extracts candidates ending at cursor correctly", () => {
    const text1 = "วันนี้อากาศดี l;ylfu";
    const cand1 = getWrongLanguageCandidate(text1);
    expect(cand1).not.toBeNull();
    expect(cand1?.original).toBe("l;ylfu");
    expect(cand1?.replacement).toBe("สวัสดี");
    expect(cand1?.fromOffset).toBe(6);

    const text2 = "Hello ธ้ฟรสฟืก";
    const cand2 = getWrongLanguageCandidate(text2);
    expect(cand2).not.toBeNull();
    expect(cand2?.original).toBe("ธ้ฟรสฟืก");
    expect(cand2?.replacement).toBe("Thailand");

    const text3 = "This is a normal sentence";
    expect(getWrongLanguageCandidate(text3)).toBeNull();
  });

  it("validates Thai structural plausibility", () => {
    expect(isPlausibleThai("สวัสดี")).toBe(true);
    expect(isPlausibleThai("อย่าลืม")).toBe(true);
    // Invalid floating tone mark start
    expect(isPlausibleThai("่สวัสดี")).toBe(false);
    // Invalid structural anomaly (double tone marks)
    expect(isPlausibleThai("กั่่บ")).toBe(false);
  });
});
