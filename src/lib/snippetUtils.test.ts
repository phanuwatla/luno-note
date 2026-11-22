import { describe, it, expect } from "vitest";
import { stripHtmlAndMarkdown, getNotePreviewSnippet } from "./snippetUtils";
import type { Note } from "@/hooks/useNotes";

describe("snippetUtils", () => {
  it("strips complex nested HTML span and font style syntax", () => {
    const raw = '<span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;">Hello world text</span></span>';
    expect(stripHtmlAndMarkdown(raw)).toBe("Hello world text");
  });

  it("strips HTML tags and preserves inner text", () => {
    const raw = "<h1>Main Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>";
    expect(stripHtmlAndMarkdown(raw)).toBe("Main Title This is bold and italic.");
  });

  it("strips YAML frontmatter", () => {
    const raw = `---
title: Note Title
tags: [tag1, tag2]
---
# Actual Heading
Here is the body content.`;
    expect(stripHtmlAndMarkdown(raw)).toBe("Actual Heading Here is the body content.");
  });

  it("strips markdown headings, lists, links, images, and formatting", () => {
    const raw = `## Heading
- [ ] Todo item
- Bullet item
1. Numbered item
> Blockquote text
[Link Title](https://example.com)
![Image Alt](https://example.com/img.png)
[[Wikilink|Custom Alias]]
**Bold text** and *italic text* and \`inline code\``;
    expect(stripHtmlAndMarkdown(raw)).toBe(
      "Heading Todo item Bullet item Numbered item Blockquote text Link Title Image Alt Custom Alias Bold text and italic text and inline code"
    );
  });

  it("handles getNotePreviewSnippet with max length and image notes", () => {
    const note: Note = {
      id: "1",
      title: "Test Note",
      content: '<span style="color: red;">Some content that is styled</span>',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(getNotePreviewSnippet(note, 12)).toBe("Some content");

    const imgNote: Note = {
      id: "2",
      title: "Photo.png",
      content: "",
      fileType: "image",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(getNotePreviewSnippet(imgNote, 100, true)).toBe("ไฟล์รูปภาพ");
    expect(getNotePreviewSnippet(imgNote, 100, false)).toBe("Image file");
  });

  it("never leaks encrypted note envelope or locked note content in preview snippets", () => {
    const lockedNote: Note = {
      id: "3",
      title: "Secret Note",
      content: "<!-- LUNO_ENCRYPTED_PAYLOAD_START -->\neyJsdW5vX2xvY2tlZCI6dHJ1ZX0=\n<!-- LUNO_ENCRYPTED_PAYLOAD_END -->",
      isLocked: true,
      isDecrypted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(getNotePreviewSnippet(lockedNote, 100)).toBe("");
  });
});
