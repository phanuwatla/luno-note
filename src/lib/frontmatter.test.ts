import { describe, it, expect } from "vitest";
import {
  parseFrontmatterAndTags,
  updateFrontmatterTags,
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

  it("prevents extracting incomplete tags while typing until space/punctuation/newline is entered", () => {
    const typingIncomplete = "Build your own knowledge. #k";
    expect(parseFrontmatterAndTags(typingIncomplete).allTags).toEqual([]);

    const typedWithSpace = "Build your own knowledge. #kkkk ";
    expect(parseFrontmatterAndTags(typedWithSpace).allTags).toEqual(["kkkk"]);

    const typedWithPeriod = "Build your own knowledge. #kkkk.";
    expect(parseFrontmatterAndTags(typedWithPeriod).allTags).toEqual(["kkkk"]);

    const typedWithNewline = "Build your own knowledge. #kkkk\nNext line";
    expect(parseFrontmatterAndTags(typedWithNewline).allTags).toEqual(["kkkk"]);
  });
});
