/**
 * Standard Word and Character Count implementation.
 * Supports Thai (dictionary word breaking via Unicode UAX #29 / Intl.Segmenter),
 * English / Latin, numbers, and mixed multilingual texts without counting punctuation or symbols as words.
 * Strips Markdown formatting, images, link URLs, and HTML tags so word counts are consistent across the app.
 */

const thaiEnglishSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(["th-TH", "en-US"], { granularity: "word" })
    : null;

/**
 * Strips Markdown formatting, images, links, frontmatter, and HTML from raw text
 * so word counting reflects only the actual visible document words (matching editor).
 */
export function stripMarkdownForWordCount(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Clean Markdown frontmatter block (--- ... ---)
  text = text.replace(/^---[\s\S]*?---\s*/, "");

  // 2. Strip Markdown images: ![alt](url) or ![alt][ref]
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  text = text.replace(/!\[[^\]]*\]\[[^\]]*\]/g, " ");

  // 3. Strip HTML tags (including <img>, <br>, <table>, etc.)
  text = text.replace(/<[^>]*>/g, " ");

  // 4. Convert Markdown links [text](url) to just "text"
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // 5. Strip fenced code block markers (```lang ... ``` -> keep code content or strip ```)
  text = text.replace(/```[a-zA-Z0-9_-]*\n?/g, " ");
  text = text.replace(/```/g, " ");

  // 6. Strip standalone URLs
  text = text.replace(/https?:\/\/[^\s]+/g, " ");

  // 7. Strip Markdown block formatting symbols at line starts (#, >, *, -, +, 1.)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, " ");
  text = text.replace(/^[ \t]*>[ \t]+/gm, " ");
  text = text.replace(/^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+/gm, " ");
  text = text.replace(/^[ \t]*[-*+][ \t]+/gm, " ");
  text = text.replace(/^[ \t]*\d+\.[ \t]+/gm, " ");

  // 8. Strip inline formatting symbols (*bold*, _italic_, ~~strike~~, `code`, ==highlight==)
  text = text.replace(/[*_~`=]+/g, "");

  // 9. Normalize Unicode and line endings
  text = text.normalize("NFC").replace(/\r\n/g, "\n");

  return text;
}

export function countWords(rawText: string): number {
  if (!rawText) return 0;

  const cleanText = stripMarkdownForWordCount(rawText);
  if (!cleanText.trim()) return 0;

  if (thaiEnglishSegmenter) {
    try {
      let wordCount = 0;
      for (const segment of thaiEnglishSegmenter.segment(cleanText)) {
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
  const cleanText = stripMarkdownForWordCount(rawText);
  return cleanText.length;
}

export function calculateReadingTime(words: number, chars: number, lang: "th" | "en" = "en"): string {
  const effectiveUnits = Math.max(words, Math.round(chars / 4));
  const readTimeMinutes = Math.max(1, Math.ceil(effectiveUnits / 200));
  return lang === "th" ? `${readTimeMinutes} นาที` : `${readTimeMinutes} min read`;
}
