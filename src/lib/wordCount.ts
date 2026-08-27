/**
 * Microsoft Word-standard word count implementation.
 * Supports Thai (dictionary word breaking via Unicode UAX #29 / Intl.Segmenter),
 * English / Latin, numbers, and mixed multilingual texts without counting punctuation or symbols as words.
 */

export function countWords(rawText: string): number {
  if (!rawText) return 0;

  // Clean Markdown frontmatter if present
  let cleanText = rawText.replace(/^---[\s\S]*?---\s*/, "");

  // Strip HTML tags if plain text wasn't already extracted
  cleanText = cleanText.replace(/<[^>]*>/g, " ");

  // Normalize Unicode and line endings
  cleanText = cleanText.normalize("NFC").replace(/\r\n/g, "\n");

  if (!cleanText.trim()) return 0;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      // Use Thai and English locale segmenter
      const segmenter = new Intl.Segmenter(["th-TH", "en-US"], { granularity: "word" });
      let wordCount = 0;

      for (const segment of segmenter.segment(cleanText)) {
        if (segment.isWordLike) {
          // Extra guard: ensure segment actually contains word/numeric characters
          if (/[\p{L}\p{N}]/u.test(segment.segment)) {
            wordCount++;
          }
        }
      }
      return wordCount;
    } catch {
      // fallback below
    }
  }

  // Fallback regex matching word sequences across Unicode scripts
  const matches = cleanText.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

export function countCharacters(rawText: string): number {
  if (!rawText) return 0;
  const cleanText = rawText
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n");
  return cleanText.length;
}

export function calculateReadingTime(words: number, chars: number, lang: "th" | "en" = "en"): string {
  const effectiveUnits = Math.max(words, Math.round(chars / 4));
  const readTimeMinutes = Math.max(1, Math.ceil(effectiveUnits / 200));
  return lang === "th" ? `${readTimeMinutes} นาที` : `${readTimeMinutes} min read`;
}
