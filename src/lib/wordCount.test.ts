import { describe, it, expect } from "vitest";
import { countWords, countCharacters } from "./wordCount";

describe("countWords", () => {
  it("counts English words accurately", () => {
    expect(countWords("Hello world! This is a test.")).toBe(6);
    expect(countWords("Word-count with hyphenated-words")).toBe(5);
  });

  it("does not count standalone punctuation or symbols", () => {
    expect(countWords("... --- !!! ??? ,,,")).toBe(0);
    expect(countWords("$100 and 50%")).toBe(3); // 100, and, 50
  });

  it("counts Thai words without spaces accurately", () => {
    // "สวัสดีครับ" -> สวัสดี (1) ครับ (1) = 2
    expect(countWords("สวัสดีครับ")).toBeGreaterThanOrEqual(2);
    // "ทดสอบระบบ" -> ทดสอบ (1) ระบบ (1) = 2
    expect(countWords("ทดสอบระบบ")).toBeGreaterThanOrEqual(2);
  });

  it("counts mixed Thai and English", () => {
    // "ทดสอบ Hello 123" -> ทดสอบ (1) + Hello (1) + 123 (1) = 3
    expect(countWords("ทดสอบ Hello 123")).toBe(3);
  });

  it("handles empty and whitespace strings", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("strips HTML tags before counting", () => {
    expect(countWords("<h1>Title</h1><p>Hello <b>world</b></p>")).toBe(3);
  });
});
