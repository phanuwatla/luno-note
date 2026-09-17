import { parseFrontmatterAndTags } from "./frontmatter";
import type { Note } from "@/hooks/useNotes";

/**
 * Strips HTML tags, Markdown syntax, YAML frontmatter, and decodes HTML entities
 * to produce clean plain text suitable for card previews and search snippets.
 */
export function stripHtmlAndMarkdown(content?: string): string {
  if (!content || typeof content !== "string") return "";

  let text = content;

  // 1. Strip YAML frontmatter at top of file (--- ... ---)
  try {
    const parsed = parseFrontmatterAndTags(text);
    if (parsed && typeof parsed.bodyContent === "string") {
      text = parsed.bodyContent;
    } else {
      text = text.replace(/^---[\s\S]*?---\s*/g, "");
    }
  } catch {
    text = text.replace(/^---[\s\S]*?---\s*/g, "");
  }

  // 2. Remove script and style tags and their contents
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");

  // 3. Strip all HTML tags (<span ...>, <div>, <p>, <b>, <br/>, etc.)
  text = text.replace(/<\/?[a-zA-Z0-9\-]+(\s+[^>]*?)?\/?>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/gi, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  // 5. Strip Markdown code blocks & inline code
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");

  // 6. Wikilinks [[target|display]] -> display, [[target]] -> target
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // 7. Markdown images: ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // 8. Markdown links: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // 9. Markdown block formatting at line starts
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s*>\s*/gm, "");
  text = text.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // 10. Table separators and borders
  text = text.replace(/\|/g, " ");

  // 11. Inline markdown styling (*, **, _, __, ~~, ==)
  text = text.replace(/(\*\*|__|[*_~=]{1,2})/g, "");

  // 12. Fix spaces before punctuation (e.g., "italic ." -> "italic.")
  text = text.replace(/\s+([.,;:!?])/g, "$1");

  // 13. Collapse whitespace & trim
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Generates a clean preview snippet for a note, with a maximum length.
 */
export function getNotePreviewSnippet(note: Note, maxLength = 160, isTh = false): string {
  if (!note) return "";
  if (note.fileType === "image") return isTh ? "ไฟล์รูปภาพ" : "Image file";
  if (!note.content) return "";

  const clean = stripHtmlAndMarkdown(note.content);
  return clean.slice(0, maxLength);
}
