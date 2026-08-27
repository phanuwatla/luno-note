import { describe, it, expect } from "vitest";
import { isWordMisspelled, getSpellingSuggestions } from "./spellChecker";

describe("spellChecker", () => {
  it("does not flag valid English words as misspelled", () => {
    const validWords = [
      "Luno",
      "luno",
      "Test",
      "Heading",
      "quiet",
      "space",
      "worth",
      "remembering",
      "track",
      "gives",
      "live",
      "Getting",
      "Started",
      "Create",
      "Note",
      "supports",
      "Markdown",
      "Links",
      "Inline",
      "code",
      "is",
      "a",
      "simple",
      "flexible",
      "workspace",
      "for",
      "writing",
      "organizing",
    ];

    for (const word of validWords) {
      expect(isWordMisspelled(word), "Expected " + word + " NOT to be marked misspelled").toBe(false);
    }
  });

  it("accurately detects real misspelled English words and gives suggestions", () => {
    expect(isWordMisspelled("bluee")).toBe(true);
    expect(getSpellingSuggestions("bluee")).toContain("blue");

    expect(isWordMisspelled("teh")).toBe(true);
    expect(getSpellingSuggestions("teh")).toContain("the");

    expect(isWordMisspelled("recieve")).toBe(true);
    expect(getSpellingSuggestions("recieve")).toContain("receive");
  });

  it("accurately detects real misspelled Thai words and gives correct suggestions", () => {
    expect(isWordMisspelled("สังเกตุ")).toBe(true);
    expect(getSpellingSuggestions("สังเกตุ")).toEqual(["สังเกต"]);

    expect(isWordMisspelled("สังเกต")).toBe(false);

    expect(isWordMisspelled("อนุญาติ")).toBe(true);
    expect(getSpellingSuggestions("อนุญาติ")).toEqual(["อนุญาต"]);

    expect(isWordMisspelled("อนุญาต")).toBe(false);
  });
});
