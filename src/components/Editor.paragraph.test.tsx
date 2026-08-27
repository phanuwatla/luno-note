import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { createTurndownService, preprocessMarkdownForEditor, noteEditorStateMap, clearNoteEditorHistory, getNoteScrollPosition, setNoteScrollPosition, noteScrollPositionMap } from "@/components/Editor";

describe("Markdown empty paragraphs and blank lines semantics and roundtrip", () => {
  const td = createTurndownService();
  const normalizeSaved = (markdown: string) => {
    let clean = markdown.replace(/\r\n?/g, "\n");
    clean = clean.replace(/<!--luno:blank-->/g, "");
    return clean.replace(/^[\r\n]+|[\r\n]+$/g, "");
  };

  const runCycle = (inputMarkdown: string): string => {
    const preprocessed = preprocessMarkdownForEditor(inputMarkdown);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;
    return normalizeSaved(td.turndown(div.innerHTML));
  };

  it("Test 0 — Zero blank lines (adjacent paragraphs): preserves 0 blank lines without adding extra empty paragraph", () => {
    const inputHtml = "<p>ข้อความ A</p><p>ข้อความ B</p>";
    const div = document.createElement("div");
    div.innerHTML = inputHtml;

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe("ข้อความ A\nข้อความ B");

    const cycleSaved = runCycle(saved);
    expect(cycleSaved.split("\n").filter((l) => !l.trim()).length).toBe(0);
  });

  it("Test 1 — Normal blank line: parses blank line into editable empty paragraph matching Obsidian", () => {
    const input = "ข้อความ A\n\nข้อความ B";
    const preprocessed = preprocessMarkdownForEditor(input);
    expect(preprocessed).toBe("ข้อความ A\n\n<p></p>\n\nข้อความ B");
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const pElements = Array.from(div.querySelectorAll("p"));
    // Obsidian compatibility: parses 3 paragraphs (including editable empty line in between)
    expect(pElements.length).toBe(3);
    expect(pElements[0].textContent).toBe("ข้อความ A");
    expect(pElements[1].textContent).toBe("");
    expect(pElements[2].textContent).toBe("ข้อความ B");

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).not.toContain("<p></p>");
    expect(saved).toBe("ข้อความ A\n\nข้อความ B");
  });

  it("Test 1b — 2 blank lines: preserves 2 explicit empty paragraphs and roundtrips cleanly", () => {
    const input = "ข้อความ A\n\n\nข้อความ B";
    const preprocessed = preprocessMarkdownForEditor(input);
    expect(preprocessed).toBe("ข้อความ A\n\n<p></p>\n<p></p>\n\nข้อความ B");
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.length).toBe(4);
    expect(pElements[0].textContent).toBe("ข้อความ A");
    expect(pElements[1].textContent).toBe("");
    expect(pElements[2].textContent).toBe("");
    expect(pElements[3].textContent).toBe("ข้อความ B");

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe("ข้อความ A\n\n\nข้อความ B");
  });

  it("Test 1d — 3 blank lines: preserves 3 explicit empty paragraphs and roundtrips cleanly", () => {
    const input = "ข้อความ A\n\n\n\nข้อความ B";
    const preprocessed = preprocessMarkdownForEditor(input);
    expect(preprocessed).toBe("ข้อความ A\n\n<p></p>\n<p></p>\n<p></p>\n\nข้อความ B");
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.length).toBe(5);

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe("ข้อความ A\n\n\n\nข้อความ B");
  });

  it("Test 1c — Heading followed by blank line: does not insert corrupt tags inside heading", () => {
    const input = "# หัวข้อหลัก\n\nข้อความเนื้อหา";
    const preprocessed = preprocessMarkdownForEditor(input);
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const h1 = div.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("หัวข้อหลัก");
    expect(h1?.innerHTML).toBe("หัวข้อหลัก");

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.some((p) => p.textContent?.trim() === "ข้อความเนื้อหา")).toBe(true);
  });

  it("Test 2 — Multiple save cycles: should remain strictly idempotent across 10+ save/load cycles without accumulating blank lines", () => {
    let standardCurrent = "ข้อความ A\n\nข้อความ B";
    for (let i = 0; i < 10; i++) {
      standardCurrent = runCycle(standardCurrent);
      expect(standardCurrent).toBe("ข้อความ A\n\nข้อความ B");
      expect(standardCurrent).not.toContain("<p></p>");
    }

    let twoBlankCurrent = "ข้อความ A\n\n\nข้อความ B";
    for (let i = 0; i < 10; i++) {
      twoBlankCurrent = runCycle(twoBlankCurrent);
      expect(twoBlankCurrent).toBe("ข้อความ A\n\n\nข้อความ B");
    }
  });

  it("Test 3 — angravity compatibility: documents created in external editors maintain exact structure", () => {
    const angravityMd = "ข้อความ A\n\nข้อความ B";
    const savedInLuno = runCycle(angravityMd);
    expect(savedInLuno).toBe(angravityMd);
    expect(savedInLuno).not.toContain("<p></p>");
  });

  it("Test 4 — Luno compatibility: documents created in Luno maintain exact blank line count in angravity", () => {
    const initialLunoHtml = "<p>ข้อความ A</p><p></p><p>ข้อความ B</p>";
    const lunoMd = normalizeSaved(td.turndown(initialLunoHtml));
    expect(lunoMd).toBe("ข้อความ A\n\nข้อความ B");
    expect(lunoMd).not.toContain("<p></p>");

    const reopenedAndSaved = runCycle(lunoMd);
    expect(reopenedAndSaved).toBe("ข้อความ A\n\nข้อความ B");
    expect(reopenedAndSaved).not.toContain("<p></p>");
  });

  it("should not affect empty lines inside fenced code blocks", () => {
    const md = "```python\ndef hello():\n\n    print('world')\n```";
    const preprocessed = preprocessMarkdownForEditor(md);
    expect(preprocessed).toBe(md);
  });

  it("Test 6 — Nested Lists + Quotes + Code blocks: should preserve blockquote and code block inside list item without turning into Plain Text code block", () => {
    const originalDomHtml = `<h2>27. Nested Lists + Quotes</h2>
<ul>
  <li>
    <p>Main item</p>
    <blockquote>
      <p>Quote inside a list item</p>
      <p>More quoted text.</p>
      <ul>
        <li><p>Nested quote list</p></li>
        <li><p>Another item</p></li>
      </ul>
      <pre><code class="language-javascript">console.log("Nested code");</code></pre>
    </blockquote>
  </li>
</ul>`;

    const savedMarkdown = td.turndown(originalDomHtml).replace(/^[\r\n]+|[\r\n]+$/g, "");
    const preprocessed = preprocessMarkdownForEditor(savedMarkdown);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    // Check that we have a blockquote, NOT a <pre><code> containing "> Quote inside a list item"
    const blockquotes = div.querySelectorAll("blockquote");
    expect(blockquotes.length).toBeGreaterThan(0);

    const codeBlocks = div.querySelectorAll("pre code");
    if (codeBlocks.length > 0) {
      // The code block content must be console.log("Nested code"), NOT "> Quote inside a list item"
      expect(codeBlocks[0].textContent).not.toContain("> Quote");
      expect(codeBlocks[0].textContent).toContain('console.log("Nested code");');
    }
  });

  it("serializes Tiptap's parsed empty paragraph without adding blank lines", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;
    const markdown = "Paragraph A\n\nParagraph B";
    const parsed = (marked.parse(preprocessMarkdownForEditor(markdown), { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");
    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: parsed,
      parseOptions: { preserveWhitespace: "full" },
    });

    expect(normalizeSaved(td.turndown(editor.getHTML()))).toBe(markdown);
  });

  it("keeps one blank line when the document also has the generated title heading", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;
    const markdown = "Paragraph A\n\nParagraph B";
    const parsed = (marked.parse(
      "<h1>Repro</h1>" + preprocessMarkdownForEditor(markdown),
      { async: false, gfm: true, breaks: true },
    ) as string).replace(/>\s+</g, "><");
    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: parsed,
      parseOptions: { preserveWhitespace: "full" },
    });
    const root = document.createElement("div");
    root.innerHTML = editor.getHTML();
    root.querySelector("h1")?.remove();
    expect(normalizeSaved(td.turndown(root.innerHTML))).toBe(markdown);
  });

  it("preserves code block followed by blank line and prose text without leaking", () => {
    const md = "```typescript\nconsole.log(1);\n```\n\nข้อความหลังบล็อกโค้ด";
    const preprocessed = preprocessMarkdownForEditor(md);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    const code = div.querySelector("pre code");
    expect(code).not.toBeNull();
    expect(code?.textContent?.trim()).toBe("console.log(1);");

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.some((p) => p.textContent?.trim() === "ข้อความหลังบล็อกโค้ด")).toBe(true);
  });

  it("preserves tables followed by blank line and prose text", () => {
    const md = "| Col 1 | Col 2 |\n| --- | --- |\n| A | B |\n\nข้อความหลังตาราง";
    const preprocessed = preprocessMarkdownForEditor(md);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    const table = div.querySelector("table");
    expect(table).not.toBeNull();

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.some((p) => p.textContent?.trim() === "ข้อความหลังตาราง")).toBe(true);
  });

  it("preserves horizontal rule followed by blank line and prose text", () => {
    const md = "---\n\nข้อความหลังเส้นคั่น";
    const preprocessed = preprocessMarkdownForEditor(md);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    const hr = div.querySelector("hr");
    expect(hr).not.toBeNull();

    const pElements = Array.from(div.querySelectorAll("p"));
    expect(pElements.some((p) => p.textContent?.trim() === "ข้อความหลังเส้นคั่น")).toBe(true);
  });

  it("Test 7 — User screenshot note: parses formatting lines with blank lines into editable empty paragraphs and roundtrips cleanly", () => {
    const screenshotMd = [
      "## Getting Started",
      "",
      "### Create a Note",
      "",
      "Create a new note and start writing.",
      "",
      "Luno supports Markdown, allowing you to format your notes naturally.",
      "",
      "**Bold text**",
      "",
      "_Italic text_",
      "",
      "Strikethrough",
      "",
      "`Inline code`",
      "",
      "[Links](https://example.com/)",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(screenshotMd);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    // Check that empty <p></p> nodes exist between formatting blocks for cursor placement
    const pElements = Array.from(div.querySelectorAll("p"));
    const emptyParagraphs = pElements.filter((p) => !p.textContent?.trim());
    expect(emptyParagraphs.length).toBeGreaterThanOrEqual(6);

    // Verify roundtrip idempotency
    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toContain("**Bold text**");
    expect(saved).toContain("_Italic text_");
    expect(saved).toContain("`Inline code`");
    expect(saved).toContain("[Links](https://example.com/)");

    const cycleSaved = runCycle(saved);
    expect(cycleSaved).toBe(saved);
  });

  it("Test 8 — Session reopening & setContent stability: repeated setContent on tab restore does not multiply blank lines", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;

    const markdown = "Paragraph A\n\nParagraph B";
    const cleanHtml = (marked.parse(preprocessMarkdownForEditor(markdown), { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");

    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: cleanHtml,
      parseOptions: { preserveWhitespace: "full" },
    });

    const initialChildCount = editor.state.doc.childCount;

    // Simulate tab restore / workspace sync triggering setContent
    editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });
    expect(editor.state.doc.childCount).toBe(initialChildCount);

    // Simulate another reopen
    editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });
    expect(editor.state.doc.childCount).toBe(initialChildCount);

    expect(normalizeSaved(td.turndown(editor.getHTML()))).toBe(markdown);
  });

  it("Test 9 — 10-cycle Tab Switch Simulation with Live TipTap instance: preserves blank line count across tab switching", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;

    let currentMarkdown = "Paragraph A\n\nParagraph B";
    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: "<p></p>",
      parseOptions: { preserveWhitespace: "full" },
    });

    for (let cycle = 0; cycle < 10; cycle++) {
      // 1. Convert markdown to HTML as done in parseEditorContent
      const preprocessed = preprocessMarkdownForEditor(currentMarkdown);
      const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
      const cleanHtml = parsed.replace(/>\s+</g, "><");

      // 2. Load into editor via setContent
      editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });
      expect(editor.state.doc.childCount).toBe(3);

      // 3. Serialize back out via turndown and normalize
      const html = editor.getHTML();
      currentMarkdown = normalizeSaved(td.turndown(html));
      expect(currentMarkdown).toBe("Paragraph A\n\nParagraph B");
    }
  });

  it("Test 10 — Headings, Lists, Code, Blockquotes roundtrip across multiple edit & tab switch cycles", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;

    const testCases = [
      {
        name: "Headings + Blank Line + Paragraph",
        input: "## หัวข้อรอง\n\nเนื้อหาใต้หัวข้อ",
      },
      {
        name: "List + Blank Line + Paragraph",
        input: "- รายการ 1\n- รายการ 2\n\nข้อความใต้รายการ",
      },
      {
        name: "Blockquote + Blank Line + Paragraph",
        input: "> ข้อความอ้างอิง\n\nข้อความปกติ",
      },
      {
        name: "Code Block + Blank Line + Paragraph",
        input: "```\nconsole.log(1);\n```\n\nข้อความใต้โค้ด",
      },
    ];

    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: "<p></p>",
      parseOptions: { preserveWhitespace: "full" },
    });

    for (const tc of testCases) {
      let current = tc.input;
      for (let i = 0; i < 5; i++) {
        const preprocessed = preprocessMarkdownForEditor(current);
        const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
        const cleanHtml = parsed.replace(/>\s+</g, "><");

        editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });
        const html = editor.getHTML();
        current = normalizeSaved(td.turndown(html));
        expect(current).toBe(tc.input);
      }
    }
  });

  it("Test 11 — Welcome Note: Blockquote followed by paragraphs does not swallow paragraphs across tab switches", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;

    const welcomeMd = [
      "# Welcome to Luno",
      "",
      "> A quiet space for your thoughts, ideas, and everything worth remembering.",
      "",
      "Welcome to **Luno**.",
      "Luno is a simple and flexible workspace for writing, organizing, and connecting your thoughts.",
      "Whether you're taking quick notes, writing documents, planning projects, studying, or keeping track of ideas, Luno gives your thoughts a place to live.",
      "",
      "---",
      "",
      "## Getting Started",
      "",
      "### Create a Note",
    ].join("\n");

    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: "<p></p>",
      parseOptions: { preserveWhitespace: "full" },
    });

    let current = welcomeMd;
    for (let cycle = 0; cycle < 5; cycle++) {
      const preprocessed = preprocessMarkdownForEditor(current);
      const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
      const cleanHtml = parsed.replace(/>\s+</g, "><");

      editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });

      // Verify the blockquote did NOT swallow the paragraph
      const html = editor.getHTML();
      const div = document.createElement("div");
      div.innerHTML = html;
      const blockquote = div.querySelector("blockquote");
      expect(blockquote).not.toBeNull();
      expect(blockquote?.textContent).toContain("A quiet space for your thoughts");
      expect(blockquote?.textContent).not.toContain("Welcome to Luno");

      current = normalizeSaved(td.turndown(html));
    }
  });

  it("Test 12 — Per-Tab Undo/Redo Isolation and Persistence across Tab Switching until Tab Close", () => {
    const { Editor: CoreEditor } = require("@tiptap/core");
    const StarterKit = require("@tiptap/starter-kit").default;

    // Clean up any test state
    clearNoteEditorHistory("note-1");
    clearNoteEditorHistory("note-2");

    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: "<p>Initial Note 1</p>",
      parseOptions: { preserveWhitespace: "full" },
    });

    // 1. Initial State for Note 1
    expect(editor.can().undo()).toBe(false);
    expect(editor.can().redo()).toBe(false);

    // 2. User edits Note 1
    editor.commands.focus("end");
    editor.commands.insertContent(" - Edited");
    expect(editor.getText()).toContain("Initial Note 1 - Edited");
    expect(editor.can().undo()).toBe(true);

    // Save Note 1's state (as done when switching tabs)
    noteEditorStateMap.set("note-1", editor.state);

    // 3. Switch to Note 2 (Fresh note)
    editor.commands.setContent("<p>Initial Note 2</p>", false, { preserveWhitespace: "full" });
    const cleanNote2State = editor.state.constructor.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanNote2State);
    noteEditorStateMap.set("note-2", editor.state);

    expect(editor.getText()).toContain("Initial Note 2");
    expect(editor.can().undo()).toBe(false); // Note 2 has fresh history

    // User edits Note 2
    editor.commands.focus("end");
    editor.commands.insertContent(" - Modified Note 2");
    expect(editor.getText()).toContain("Initial Note 2 - Modified Note 2");
    expect(editor.can().undo()).toBe(true);
    noteEditorStateMap.set("note-2", editor.state);

    // 4. Switch back to Note 1 tab
    const savedNote1 = noteEditorStateMap.get("note-1");
    expect(savedNote1).toBeDefined();
    editor.view.updateState(savedNote1);

    expect(editor.getText()).toContain("Initial Note 1 - Edited");
    expect(editor.can().undo()).toBe(true); // Note 1 undo history is preserved!

    // Undo on Note 1
    editor.commands.undo();
    expect(editor.getText()).toBe("Initial Note 1");
    expect(editor.can().redo()).toBe(true);
    noteEditorStateMap.set("note-1", editor.state);

    // 5. Switch back to Note 2 tab
    const savedNote2 = noteEditorStateMap.get("note-2");
    expect(savedNote2).toBeDefined();
    editor.view.updateState(savedNote2);

    expect(editor.getText()).toContain("Initial Note 2 - Modified Note 2");
    expect(editor.can().undo()).toBe(true); // Note 2 undo history intact and unaffected by Note 1's undo!

    // 6. Close Note 1 tab
    clearNoteEditorHistory("note-1");
    expect(noteEditorStateMap.has("note-1")).toBe(false);

    // Note 2 is still preserved
    expect(noteEditorStateMap.has("note-2")).toBe(true);
    clearNoteEditorHistory("note-2");
  });

  it("Test 13 — Per-File Scroll Position Persistence & Restoration across Tab Switching", () => {
    noteScrollPositionMap.clear();

    expect(getNoteScrollPosition("doc-a")).toBe(0);

    // User scrolls in doc-a to 450px
    setNoteScrollPosition("doc-a", 450);
    expect(getNoteScrollPosition("doc-a")).toBe(450);

    // User switches to doc-b and scrolls to 1200px
    setNoteScrollPosition("doc-b", 1200);
    expect(getNoteScrollPosition("doc-b")).toBe(1200);

    // User switches back to doc-a -> scroll position is accurately retained!
    expect(getNoteScrollPosition("doc-a")).toBe(450);

    // User scrolls doc-a back to the top (0px)
    setNoteScrollPosition("doc-a", 0);
    expect(getNoteScrollPosition("doc-a")).toBe(0);

    // Switch to doc-b (remains 1200px) and back to doc-a (remains 0px top)
    expect(getNoteScrollPosition("doc-b")).toBe(1200);
    expect(getNoteScrollPosition("doc-a")).toBe(0);

    // User closes tab for doc-b -> scroll memory is wiped
    clearNoteEditorHistory("doc-b");
    expect(getNoteScrollPosition("doc-b")).toBe(0);

    // If a transition unmount / switch tries to save doc-b right after it closed:
    setNoteScrollPosition("doc-b", 1200);
    expect(getNoteScrollPosition("doc-b")).toBe(0); // Remains 0 (not resurrected)!
  });

  it("Test 14 — Ordered lists with numbers in headings and nested multi-level ordered lists roundtrip", () => {
    const inputMd = `## 8. Ordered Lists

1. First item
2. Second item
3. Third item
    1. Nested item
    2. Nested item
        1. Deep nested item
4. Fourth item`;

    const preprocessed = preprocessMarkdownForEditor(inputMd);
    const html = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    
    // Verify marked did not convert deep nested item into a plaintext codeblock
    expect(html).not.toContain("language-plaintext");
    expect(html).not.toContain("<pre>");

    const serialized = td.turndown(html);
    const cleanSaved = normalizeSaved(serialized);

    // Verify heading retains '## 8. Ordered Lists' without backslash escaping '8\.'
    expect(cleanSaved).toContain("## 8. Ordered Lists");
    expect(cleanSaved).not.toContain("8\\.");

    // Verify nested items are retained under list structure without breaking into code blocks
    expect(cleanSaved).toContain("1. First item");
    expect(cleanSaved).toContain("3. Third item");
    expect(cleanSaved).toContain("1. Nested item");
    expect(cleanSaved).toContain("1. Deep nested item");
    expect(cleanSaved).toContain("4. Fourth item");
  });

  it("Test 15 — Multiple consecutive inline code spans separated by space do not merge", () => {
    const StarterKit = require("@tiptap/starter-kit").default;
    const { Editor } = require("@tiptap/core");

    const inputMd = "`#Programming` `#University` `#Projects` `#Ideas`";
    const preprocessed = preprocessMarkdownForEditor(inputMd);
    const html = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    
    const root = document.createElement("div");
    root.innerHTML = html;

    // Apply prepareDomForEditor logic for code tags
    root.querySelectorAll("code").forEach((code: HTMLElement) => {
      if (code.closest("pre")) return;
      const next = code.nextSibling;
      if (next && next.nodeType === 3 && next.nodeValue) {
        if (/^\s+/.test(next.nodeValue)) {
          next.nodeValue = next.nodeValue.replace(/^ +/, (spaces: string) => "\u00A0".repeat(spaces.length));
        }
      }
    });

    const editor = new Editor({
      extensions: [StarterKit],
      content: root.innerHTML,
    });

    const json = editor.getJSON();
    const paragraph = json.content[0];

    // Verify there are multiple distinct text nodes and not a single merged text node "#Programming#University#Projects#Ideas"
    const codeTexts = paragraph.content.filter((c: any) => c.marks && c.marks.some((m: any) => m.type === "code"));
    expect(codeTexts.length).toBe(4);
    expect(codeTexts[0].text).toBe("#Programming");
    expect(codeTexts[1].text).toBe("#University");
    expect(codeTexts[2].text).toBe("#Projects");
    expect(codeTexts[3].text).toBe("#Ideas");

    const serialized = td.turndown(editor.getHTML());
    const cleanSaved = normalizeSaved(serialized);

    expect(cleanSaved).toContain("`#Programming`");
    expect(cleanSaved).toContain("`#University`");
    expect(cleanSaved).toContain("`#Projects`");
    expect(cleanSaved).toContain("`#Ideas`");
    expect(cleanSaved).not.toContain("`#Programming#University#Projects#Ideas`");

    editor.destroy();
  });

  it("Test 16 — Correctly calculates relative path for workspace images and classifies attachments", async () => {
    const { getRelativePathBetween, isImageNote, isAttachmentNote } = await import(
      "./editor/WorkspaceImagePickerDialog"
    );

    // Root note to attachment
    expect(getRelativePathBetween("", "attachments", "photo.png")).toBe("attachments/photo.png");
    expect(getRelativePathBetween(undefined, "attachments", "photo.png")).toBe("attachments/photo.png");

    // Subfolder note to attachment
    expect(getRelativePathBetween("docs", "attachments", "photo.png")).toBe("../attachments/photo.png");
    expect(getRelativePathBetween("docs/sub", "attachments", "photo.png")).toBe("../../attachments/photo.png");

    // Same folder
    expect(getRelativePathBetween("photos", "photos", "sunset.jpg")).toBe("sunset.jpg");

    // Sibling folder
    expect(getRelativePathBetween("docs/guide", "docs/images", "chart.svg")).toBe("../images/chart.svg");

    // Classification
    expect(isImageNote({ id: "1", title: "logo.png", content: "", createdAt: 0, updatedAt: 0 })).toBe(true);
    expect(isImageNote({ id: "2", title: "notes.md", content: "", createdAt: 0, updatedAt: 0 })).toBe(false);
    expect(isImageNote({ id: "3", title: "my note", fileType: "image", content: "", createdAt: 0, updatedAt: 0 })).toBe(true);

    expect(isAttachmentNote({ id: "1", title: "pic.png", folderPath: "attachments", content: "", createdAt: 0, updatedAt: 0 })).toBe(true);
    expect(isAttachmentNote({ id: "2", title: "pic.png", folderPath: "attachments/2026", content: "", createdAt: 0, updatedAt: 0 })).toBe(true);
    expect(isAttachmentNote({ id: "3", title: "pic.png", folderPath: "photos", content: "", createdAt: 0, updatedAt: 0 })).toBe(false);
  });
});
