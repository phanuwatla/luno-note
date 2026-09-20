import { describe, it, expect } from "vitest";
import {
  parseFrontmatterAndTags,
  updateFrontmatterTags,
  updateFrontmatterFavorite,
  renameTagInMarkdown,
  removeTagFromMarkdown,
  normalizeTag,
  dedupeTags,
} from "./frontmatter";

describe("frontmatter & tags utility", () => {
  it("normalizes and deduplicates tags case-insensitively", () => {
    expect(normalizeTag("#project")).toBe("project");
    expect(normalizeTag(" web ")).toBe("web");
    expect(dedupeTags(["#project", "Project", "web", "WEB"])).toEqual(["project", "web"]);
  });

  it("parses YAML Frontmatter with list sequence tags", () => {
    const md = `---
title: Sample Note
author: Alice
tags:
  - project
  - web
---

# Hello World
This is note content with #inline-tag.`;

    const parsed = parseFrontmatterAndTags(md);
    expect(parsed.hasFrontmatter).toBe(true);
    expect(parsed.frontmatterData.title).toBe("Sample Note");
    expect(parsed.frontmatterData.author).toBe("Alice");
    expect(parsed.frontmatterTags).toEqual(["project", "web"]);
    expect(parsed.inlineTags).toEqual(["inline-tag"]);
    expect(parsed.allTags).toEqual(["project", "web", "inline-tag"]);
  });

  it("parses inline flow array tags and comma-separated tags", () => {
    const md1 = `---\ntags: [tag1, tag2]\n---\nContent`;
    const parsed1 = parseFrontmatterAndTags(md1);
    expect(parsed1.frontmatterTags).toEqual(["tag1", "tag2"]);

    const md2 = `---\ntags: tagA, tagB\n---\nContent`;
    const parsed2 = parseFrontmatterAndTags(md2);
    expect(parsed2.frontmatterTags).toEqual(["tagA", "tagB"]);
  });

  it("creates Frontmatter if none exists when adding tags", () => {
    const md = "# Just Note Title\n\nSome body content";
    const updated = updateFrontmatterTags(md, ["project", "web"]);

    expect(updated).toContain("---\ntags:\n  - project\n  - web\n---");
    expect(updated).toContain("# Just Note Title");

    const reParsed = parseFrontmatterAndTags(updated);
    expect(reParsed.frontmatterTags).toEqual(["project", "web"]);
  });

  it("updates tags while preserving other Frontmatter metadata", () => {
    const md = `---
title: My Obsidian Note
author: John
custom_key: 123
tags:
  - oldtag
---

# Content`;

    const updated = updateFrontmatterTags(md, ["newtag1", "newtag2"]);

    const reParsed = parseFrontmatterAndTags(updated);
    expect(reParsed.frontmatterData.title).toBe("My Obsidian Note");
    expect(reParsed.frontmatterData.author).toBe("John");
    expect(reParsed.frontmatterData.custom_key).toBe("123");
    expect(reParsed.frontmatterTags).toEqual(["newtag1", "newtag2"]);
  });

  it("renames tags in Frontmatter and body inline tags", () => {
    const md = `---
tags:
  - project
  - oldname
---

This is #oldname in body text.`;

    const renamed = renameTagInMarkdown(md, "oldname", "newname");
    const reParsed = parseFrontmatterAndTags(renamed);

    expect(reParsed.frontmatterTags).toEqual(["project", "newname"]);
    expect(renamed).toContain("This is #newname in body text.");
  });

  it("removes tags from Frontmatter and body inline tags", () => {
    const md = `---
tags:
  - project
  - todelete
---

Some text with #todelete tag.`;

    const removed = removeTagFromMarkdown(md, "todelete");
    const reParsed = parseFrontmatterAndTags(removed);

    expect(reParsed.frontmatterTags).toEqual(["project"]);
    expect(removed).not.toContain("#todelete");
  });

  it("ignores hashtags inside code blocks (markdown fenced code and HTML pre/code)", () => {
    const md = `
# RealHeading
This has a #realtag.

\`\`\`plaintext
#Programming
#JavaScript
#University
#Ideas
\`\`\`

<pre><code>#NotATag1 #NotATag2</code></pre>
\`#NotATag3\`
`;

    const parsed = parseFrontmatterAndTags(md);
    expect(parsed.allTags).toEqual(["realtag"]);
  });

  it("extracts inline tags with space, newline, punctuation, or end-of-string", () => {
    const typedAtEnd = "Build your own knowledge. #kkkk";
    expect(parseFrontmatterAndTags(typedAtEnd).allTags).toEqual(["kkkk"]);

    const typedWithSpace = "Build your own knowledge. #kkkk ";
    expect(parseFrontmatterAndTags(typedWithSpace).allTags).toEqual(["kkkk"]);

    const typedWithPeriod = "Build your own knowledge. #kkkk.";
    expect(parseFrontmatterAndTags(typedWithPeriod).allTags).toEqual(["kkkk"]);

    const typedWithNewline = "Build your own knowledge. #kkkk\nNext line";
    expect(parseFrontmatterAndTags(typedWithNewline).allTags).toEqual(["kkkk"]);

    // Does not falsely extract hex colors or anchors inside HTML tags
    const withHtml = '<span style="color: #64748b">Text with #actualtag</span>';
    const parsedHtml = parseFrontmatterAndTags(withHtml);
    expect(parsedHtml.allTags).toEqual(["actualtag"]);
    expect(parsedHtml.allTags).not.toContain("64748b");
  });

  it("preserves intentional blank lines in note body and does not accumulate empty lines", () => {
    const rawNote = `---
tags:
  - welcome
---

> A quiet space for your thoughts, ideas, and everything worth remembering.

Welcome to **Luno**.

Luno is a simple and flexible workspace.`;

    const parsed = parseFrontmatterAndTags(rawNote);
    expect(parsed.hasFrontmatter).toBe(true);
    expect(parsed.frontmatterTags).toEqual(["welcome"]);
    // Body should preserve the exact empty line under --- followed by the blockquote and all paragraphs
    expect(parsed.bodyContent).toBe(`
> A quiet space for your thoughts, ideas, and everything worth remembering.

Welcome to **Luno**.

Luno is a simple and flexible workspace.`);

    // Updating tags should produce the exact same text format without adding extra blank lines
    const updated = updateFrontmatterTags(rawNote, ["welcome"]);
    expect(updated).toBe(rawNote);

    // Repeated saves must be 100% idempotent
    const savedTwice = updateFrontmatterTags(updated, ["welcome"]);
    expect(savedTwice).toBe(rawNote);
  });

  it("parses favorite boolean and string in Frontmatter", () => {
    const md1 = `---\nfavorite: true\n---\n# My Fav Note`;
    const parsed1 = parseFrontmatterAndTags(md1);
    expect(parsed1.frontmatterData.favorite).toBe(true);

    const md2 = `---\nisFavorite: true\n---\n# My Fav Note`;
    const parsed2 = parseFrontmatterAndTags(md2);
    expect(parsed2.frontmatterData.isFavorite).toBe(true);

    const md3 = `---\nfavorite: false\n---\n# Note`;
    const parsed3 = parseFrontmatterAndTags(md3);
    expect(parsed3.frontmatterData.favorite).toBe(false);
  });

  it("updates and removes favorite in Frontmatter without corrupting existing fields", () => {
    const mdWithoutFm = "# Plain Note\n\nSome content";
    const withFav = updateFrontmatterFavorite(mdWithoutFm, true);
    expect(withFav).toContain("---\nfavorite: true\n---");
    expect(withFav).toContain("# Plain Note");

    const parsedWithFav = parseFrontmatterAndTags(withFav);
    expect(parsedWithFav.frontmatterData.favorite).toBe(true);

    // Remove favorite
    const unFav = updateFrontmatterFavorite(withFav, false);
    const parsedUnFav = parseFrontmatterAndTags(unFav);
    expect(parsedUnFav.frontmatterData.favorite).toBeUndefined();

    // Preserve other frontmatter fields
    const mdWithExisting = `---\ntitle: Document\ntags:\n  - idea\n---\n\nBody`;
    const addedFav = updateFrontmatterFavorite(mdWithExisting, true);
    const parsedAdded = parseFrontmatterAndTags(addedFav);
    expect(parsedAdded.frontmatterData.title).toBe("Document");
    expect(parsedAdded.frontmatterTags).toEqual(["idea"]);
    expect(parsedAdded.frontmatterData.favorite).toBe(true);

    // Exact user scenario with tags, icon, and iconColor
    const userScenario = `---\ntags:\n  - feedback\nicon: "lucide:MessageSquare"\niconColor: "#64748b"\n---\n# Content`;
    const updated = updateFrontmatterFavorite(userScenario, true);
    const parsedUser = parseFrontmatterAndTags(updated);
    expect(parsedUser.frontmatterTags).toEqual(["feedback"]);
    expect(parsedUser.frontmatterData.icon).toBe("lucide:MessageSquare");
    expect(parsedUser.frontmatterData.iconColor).toBe("#64748b");
    expect(parsedUser.frontmatterData.favorite).toBe(true);
  });

  it("detects #welcome as note tag from '#welcome to my doc' and removes tag when replaced with 'Hi This ismy doc'", () => {
    const original = "#welcome to my doc";
    const parsed1 = parseFrontmatterAndTags(original);
    expect(parsed1.allTags).toEqual(["welcome"]);
    expect(parsed1.inlineTags).toEqual(["welcome"]);

    const modified = "Hi This ismy doc";
    const parsed2 = parseFrontmatterAndTags(modified);
    expect(parsed2.allTags).toEqual([]);
    expect(parsed2.inlineTags).toEqual([]);
  });

  it("reads tag immediately when space is pressed without requiring text after space", () => {
    // 1. Tag right after pressing space (no text after space)
    const withSpace = "#welcome ";
    expect(parseFrontmatterAndTags(withSpace).allTags).toEqual(["welcome"]);

    // 2. Tag followed by newline
    const withNewline = "my name is #nongying\n";
    expect(parseFrontmatterAndTags(withNewline).allTags).toEqual(["nongying"]);

    // 3. Tag in middle followed by space
    const inSentence = "Hello #welcome to my doc";
    expect(parseFrontmatterAndTags(inSentence).allTags).toEqual(["welcome"]);
  });

  it("removeTagFromMarkdown removes the #tag from text and frontmatter when deleted from UI", () => {
    const content = "#welcome to my doc";
    const removed = removeTagFromMarkdown(content, "welcome");
    expect(removed).toBe("to my doc");

    const contentWithFrontmatter = `---\ntags:\n  - feedback\n  - checklist\n  - hello\n---\n\n#feedback #hello\n\nSome text with #hello to all.`;
    const removedHello = removeTagFromMarkdown(contentWithFrontmatter, "hello");
    expect(removedHello).not.toContain("#hello");
    const parsed = parseFrontmatterAndTags(removedHello);
    expect(parsed.allTags).toEqual(["feedback", "checklist"]);
    expect(parsed.frontmatterTags).toEqual(["feedback", "checklist"]);
  });

  it("ensures inline body tags are displayed in allTags but are NEVER in frontmatter tags", () => {
    const markdown = `---
tags:
  - feedback
  - checklist
---

my name is #nongying
`;
    const parsed = parseFrontmatterAndTags(markdown);
    expect(parsed.hasFrontmatter).toBe(true);
    expect(parsed.frontmatterTags).toEqual(["feedback", "checklist"]);
    expect(parsed.inlineTags).toEqual(["nongying"]);
    expect(parsed.allTags).toEqual(["feedback", "checklist", "nongying"]);

    // Updating frontmatter tags should NOT add inline body tags to frontmatter block
    const updated = updateFrontmatterTags(markdown, ["feedback", "checklist", "newproperty"]);
    const reParsed = parseFrontmatterAndTags(updated);
    expect(reParsed.frontmatterTags).toEqual(["feedback", "checklist", "newproperty"]);
    expect(reParsed.inlineTags).toEqual(["nongying"]);
    expect(reParsed.allTags).toEqual(["feedback", "checklist", "newproperty", "nongying"]);
    expect(reParsed.frontmatterRaw).not.toContain("nongying");
  });
});
