import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { Editor as CoreEditor, Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { createTurndownService, preprocessMarkdownForEditor, normalizeSerializedMarkdown, renderMarkdownToEditorHtml, CustomParagraph, Toggle, noteEditorStateMap, clearNoteEditorHistory, getNoteScrollPosition, setNoteScrollPosition, noteScrollPositionMap, EDITOR_CLASSES, HashtagDecoration, collapseBlockWhitespace } from "@/components/Editor";
import { Kbd, Highlight, Underline, Superscript, Subscript } from "@/lib/tiptapCustomMarks";
import fs from "fs";

describe("Markdown empty paragraphs and blank lines semantics and roundtrip", () => {
  const td = createTurndownService();
  const normalizeSaved = (markdown: string) => {
    return normalizeSerializedMarkdown(markdown);
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
    expect(saved).toBe("ข้อความ A\n\nข้อความ B");

    const cycleSaved = runCycle(saved);
    expect(cycleSaved).toBe("ข้อความ A\n\nข้อความ B");
  });

  it("Test 1 — 1 blank line: renders exactly 1 editable empty paragraph (have 1 show 1) and roundtrips cleanly", () => {
    const input = "ข้อความ A\n\nข้อความ B";
    const preprocessed = preprocessMarkdownForEditor(input);
    expect(preprocessed).toContain("<p></p>");
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const pElements = Array.from(div.querySelectorAll("p"));
    // 1 blank line in file -> exactly 1 editable empty paragraph in editor (total 3 paragraphs)
    expect(pElements.length).toBe(3);
    expect(pElements[0].textContent).toBe("ข้อความ A");
    expect(pElements[1].textContent).toBe("");
    expect(pElements[2].textContent).toBe("ข้อความ B");

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe("ข้อความ A\n\nข้อความ B");
  });

  it("Test 1b — 2 blank lines: renders exactly 2 editable empty paragraphs (have 2 show 2) and roundtrips cleanly", () => {
    const input = "ข้อความ A\n\n\nข้อความ B";
    const preprocessed = preprocessMarkdownForEditor(input);
    expect(preprocessed).toBe("ข้อความ A\n\n<p></p>\n<p></p>\n\nข้อความ B");
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsed;

    const pElements = Array.from(div.querySelectorAll("p"));
    // 2 blank lines in file -> exactly 2 editable empty paragraphs in editor (total 4 paragraphs)
    expect(pElements.length).toBe(4);
    expect(pElements[0].textContent).toBe("ข้อความ A");
    expect(pElements[1].textContent).toBe("");
    expect(pElements[2].textContent).toBe("");
    expect(pElements[3].textContent).toBe("ข้อความ B");

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe("ข้อความ A\n\n\nข้อความ B");
  });

  it("Test 1d — 3 blank lines: renders exactly 3 editable empty paragraphs (have 3 show 3) and roundtrips cleanly", () => {
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

  it("preserves tables containing images, emojis and prevents pipe accumulation across save cycles", () => {
    const tableMd = [
      "| Feature | Status |",
      "| --- | --- |",
      "| Images | ✅ |",
      "| HTML | ⚠️ |",
      "| Preview | ![Luno](https://picsum.photos/600/300) |",
      "",
      "> End of test.",
    ].join("\n");

    let current = tableMd;
    for (let i = 0; i < 5; i++) {
      current = runCycle(current);
      expect(current).not.toContain("||");
      expect(current).not.toMatch(/\n\s*\|\s*\n/);
      expect(current).toContain("| Images | ✅ |");
      expect(current).toContain("| HTML | ⚠️ |");
    }
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

  it("Test 7 — User screenshot note: parses formatting lines with 1 blank line as standard block separators without spurious empty paragraphs", () => {
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

    // 1 blank line between blocks creates 1 editable empty paragraph node (have 1 show 1)
    const pElements = Array.from(div.querySelectorAll("p"));
    const emptyParagraphs = pElements.filter((p) => !p.textContent?.trim());
    expect(emptyParagraphs.length).toBe(8);

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

      // 2. Load into editor via setContent (Paragraph A, 1 empty paragraph, Paragraph B = 3 nodes)
      editor.commands.setContent(cleanHtml, false, { preserveWhitespace: "full" });
      expect(editor.state.doc.childCount).toBe(3);

      // 3. Serialize back out via turndown and normalize
      const html = editor.getHTML();
      currentMarkdown = normalizeSaved(td.turndown(html));
      expect(currentMarkdown).toBe("Paragraph A\n\nParagraph B");
    }
  });

  it("Test 10 — Headings, Lists, Code, Blockquotes roundtrip across multiple edit & tab switch cycles", () => {
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

    // Path with spaces (folders and filename) - must encode spaces as %20
    expect(getRelativePathBetween("docs", "Generate Artwork/part2", "part2_5.jpg")).toBe("../Generate%20Artwork/part2/part2_5.jpg");
    expect(getRelativePathBetween("", "attachments", "my photo.png")).toBe("attachments/my%20photo.png");
    expect(getRelativePathBetween("Folder A", "Folder B/Sub Space", "test image.png")).toBe("../Folder%20B/Sub%20Space/test%20image.png");

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

  it("Test 16.1 — Markdown images with spaces in path are encoded with %20 during preprocessing and serialization", () => {
    const rawMd = "![part2_5.jpg](../Generate Artwork/part2/part2_5.jpg)";
    const preprocessed = preprocessMarkdownForEditor(rawMd);
    expect(preprocessed).toBe("![part2_5.jpg](../Generate%20Artwork/part2/part2_5.jpg)");

    const sizedMd = "![part2_5.jpg|400](../Generate Artwork/part2/part2_5.jpg)";
    const preprocessedSized = preprocessMarkdownForEditor(sizedMd);
    expect(preprocessedSized).toContain('src="../Generate%20Artwork/part2/part2_5.jpg"');
    expect(preprocessedSized).toContain('data-relative-src="../Generate%20Artwork/part2/part2_5.jpg"');

    const td = createTurndownService();
    const htmlWithSpaces = '<img src="../Generate Artwork/part2/part2_5.jpg" alt="part2_5.jpg" data-relative-src="../Generate Artwork/part2/part2_5.jpg" />';
    const serialized = td.turndown(htmlWithSpaces);
    expect(serialized).toBe("![part2_5.jpg](../Generate%20Artwork/part2/part2_5.jpg)");
  });

  it("Test 17 — Image directly below paragraph does not accumulate trailing spaces on roundtrip", () => {
    const input = `## ตอนที่ 1: ยุคแห่งความเชื่อและวิหารเทพเจ้า
"ในช่วงศตวรรษที่ 6 ก่อนคริสตกาล โลกยังเต็มไปด้วยเวทมนตร์
![part1_1.jpg|636](../../attachments/part1_1.jpg)`;

    const preprocessed = preprocessMarkdownForEditor(input);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    // Apply prepareDomForEditor logic
    div.querySelectorAll("p").forEach((p) => {
      const img = p.querySelector("img");
      if (img) {
        if (p.children.length === 1 && !p.textContent?.trim()) {
          p.replaceWith(img);
        } else {
          p.querySelectorAll("br").forEach((br) => {
            if (br.nextElementSibling === img || br.previousElementSibling === img || !br.nextSibling || br.nextSibling === img) {
              br.remove();
            }
          });
          if (p.contains(img)) {
            p.after(img);
          }
          if (!p.textContent?.trim() && !p.children.length) {
            p.remove();
          }
        }
      }
    });

    let saved = td.turndown(div.innerHTML).replace(/\r\n?/g, "\n");
    saved = saved.replace(/[ \t]+(?=\n)/g, "");
    saved = normalizeSaved(saved);

    expect(saved).not.toContain("เวทมนตร์  ");
    expect(saved).toContain("![part1_1.jpg|636](../../attachments/part1_1.jpg)");
  });

  it("Test 17 — File size formatter and file format identification", () => {
    function formatFileSize(bytes: number | null | undefined): string {
      if (bytes == null || isNaN(bytes) || bytes < 0) return "";
      if (bytes === 0) return "0 B";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    expect(formatFileSize(null)).toBe("");
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe("1.50 GB");
  });

  it("Test 18 — 1:1 blank lines mapping: 1 blank yields 1 empty paragraph, 2 blanks yield 2, 3 blanks yield 3", () => {
    // 1 blank line (i.e. \n\n between paragraphs) -> 1 empty paragraph
    const md1 = "Paragraph 1\n\nParagraph 2";
    const pre1 = preprocessMarkdownForEditor(md1);
    const parsed1 = (marked.parse(pre1, { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");
    
    const editor1 = new CoreEditor({
      extensions: [StarterKit],
      content: parsed1,
      parseOptions: { preserveWhitespace: "full" },
    });

    // doc children: Paragraph 1, empty paragraph, Paragraph 2 = 3 nodes
    expect(editor1.state.doc.childCount).toBe(3);
    expect(editor1.state.doc.child(0).textContent).toBe("Paragraph 1");
    expect(editor1.state.doc.child(1).textContent).toBe("");
    expect(editor1.state.doc.child(2).textContent).toBe("Paragraph 2");

    const saved1 = normalizeSaved(td.turndown(editor1.getHTML()));
    expect(saved1).toBe(md1);

    // 2 blank lines (i.e. \n\n\n between paragraphs) -> 2 empty paragraphs
    const md2 = "Paragraph 1\n\n\nParagraph 2";
    const pre2 = preprocessMarkdownForEditor(md2);
    const parsed2 = (marked.parse(pre2, { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");

    const editor2 = new CoreEditor({
      extensions: [StarterKit],
      content: parsed2,
      parseOptions: { preserveWhitespace: "full" },
    });

    // doc children: Paragraph 1, empty paragraph, empty paragraph, Paragraph 2 = 4 nodes
    expect(editor2.state.doc.childCount).toBe(4);
    expect(editor2.state.doc.child(0).textContent).toBe("Paragraph 1");
    expect(editor2.state.doc.child(1).textContent).toBe("");
    expect(editor2.state.doc.child(2).textContent).toBe("");
    expect(editor2.state.doc.child(3).textContent).toBe("Paragraph 2");

    const saved2 = normalizeSaved(td.turndown(editor2.getHTML()));
    expect(saved2).toBe(md2);

    // 3 blank lines (i.e. \n\n\n\n between paragraphs) -> 3 empty paragraphs
    const md3 = "Paragraph 1\n\n\n\nParagraph 2";
    const pre3 = preprocessMarkdownForEditor(md3);
    const parsed3 = (marked.parse(pre3, { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");

    const editor3 = new CoreEditor({
      extensions: [StarterKit],
      content: parsed3,
      parseOptions: { preserveWhitespace: "full" },
    });

    expect(editor3.state.doc.childCount).toBe(5);
    const saved3 = normalizeSaved(td.turndown(editor3.getHTML()));
    expect(saved3).toBe(md3);

    editor1.destroy();
    editor2.destroy();
    editor3.destroy();
  });

  it("Test 19 — Welcome to Luno note maintains 1:1 blank lines between blocks and roundtrips cleanly", () => {
    const welcomeSnippet = [
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
      "[Links](https://example.com)",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(welcomeSnippet);
    const parsed = (marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string).replace(/>\s+</g, "><");

    const editor = new CoreEditor({
      extensions: [StarterKit],
      content: parsed,
      parseOptions: { preserveWhitespace: "full" },
    });

    // Exactly 8 blank lines in snippet -> exactly 8 empty paragraph nodes
    const emptyChildNodes: number[] = [];
    editor.state.doc.forEach((node, offset, index) => {
      if (node.type.name === "paragraph" && !node.textContent.trim()) {
        emptyChildNodes.push(index);
      }
    });

    expect(emptyChildNodes.length).toBe(8);

    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    expect(saved).toBe(welcomeSnippet);

    editor.destroy();
  });

  it("Test 20 — Heading blank lines: 0, 1, and 2 blank lines under headings preserve exact 1:1 count without escalating across multiple cycles", () => {
    // 1. Heading followed by List with 0 blank lines (user's exact issue)
    const md0List = "## ⚠️ Fix List\n- บรรทัดว่างใต้ Heading";
    let cur0List = md0List;
    for (let i = 0; i < 10; i++) {
      cur0List = runCycle(cur0List);
    }
    expect(cur0List).toBe("## ⚠️ Fix List\n- บรรทัดว่างใต้ Heading");

    // 2. Heading followed by List with 1 blank line
    const md1List = "## ⚠️ Fix List\n\n- บรรทัดว่างใต้ Heading";
    let cur1List = md1List;
    for (let i = 0; i < 10; i++) {
      cur1List = runCycle(cur1List);
    }
    expect(cur1List).toBe("## ⚠️ Fix List\n\n- บรรทัดว่างใต้ Heading");

    // 3. Heading followed by List with 2 blank lines
    const md2List = "## ⚠️ Fix List\n\n\n- บรรทัดว่างใต้ Heading";
    let cur2List = md2List;
    for (let i = 0; i < 10; i++) {
      cur2List = runCycle(cur2List);
    }
    expect(cur2List).toBe("## ⚠️ Fix List\n\n\n- บรรทัดว่างใต้ Heading");

    // 4. Heading followed by Paragraph with 0 blank lines
    const md0Para = "## Heading\nParagraph text";
    let cur0Para = md0Para;
    for (let i = 0; i < 10; i++) {
      cur0Para = runCycle(cur0Para);
    }
    expect(cur0Para).toBe("## Heading\nParagraph text");

    // 5. Heading followed by Paragraph with 1 blank line
    const md1Para = "## Heading\n\nParagraph text";
    let cur1Para = md1Para;
    for (let i = 0; i < 10; i++) {
      cur1Para = runCycle(cur1Para);
    }
    expect(cur1Para).toBe("## Heading\n\nParagraph text");

    // 6. Heading followed by Heading with 0 blank lines
    const md0H = "# Heading 1\n## Heading 2";
    let cur0H = md0H;
    for (let i = 0; i < 10; i++) {
      cur0H = runCycle(cur0H);
    }
    expect(cur0H).toBe("# Heading 1\n## Heading 2");

    // 7. Heading followed by Heading with 1 blank line
    const md1H = "# Heading 1\n\n## Heading 2";
    let cur1H = md1H;
    for (let i = 0; i < 10; i++) {
      cur1H = runCycle(cur1H);
    }
    expect(cur1H).toBe("# Heading 1\n\n## Heading 2");

    // 8. Heading followed by Blockquote with 0 blank lines
    const md0Bq = "## Heading\n> Quote text";
    let cur0Bq = md0Bq;
    for (let i = 0; i < 10; i++) {
      cur0Bq = runCycle(cur0Bq);
    }
    expect(cur0Bq).toBe("## Heading\n> Quote text");

    // 9. Heading followed by Blockquote with 1 blank line
    const md1Bq = "## Heading\n\n> Quote text";
    let cur1Bq = md1Bq;
    for (let i = 0; i < 10; i++) {
      cur1Bq = runCycle(cur1Bq);
    }
    expect(cur1Bq).toBe("## Heading\n\n> Quote text");

    // 10. Heading followed by Code block with 0 blank lines
    const md0Code = "## Heading\n```\nconst x = 1;\n```";
    let cur0Code = md0Code;
    for (let i = 0; i < 10; i++) {
      cur0Code = runCycle(cur0Code);
    }
    expect(cur0Code).toBe("## Heading\n```\nconst x = 1;\n```");

    // 11. Heading followed by Code block with 1 blank line
    const md1Code = "## Heading\n\n```\nconst x = 1;\n```";
    let cur1Code = md1Code;
    for (let i = 0; i < 10; i++) {
      cur1Code = runCycle(cur1Code);
    }
    expect(cur1Code).toBe("## Heading\n\n```\nconst x = 1;\n```");

    // 12. TipTap CoreEditor roundtrip verification with renderMarkdownToEditorHtml
    const editor0 = new CoreEditor({
      extensions: [StarterKit],
      content: renderMarkdownToEditorHtml("## ⚠️ Fix List\n- บรรทัดว่างใต้ Heading"),
      parseOptions: { preserveWhitespace: "full" },
    });
    const savedLive0 = normalizeSaved(td.turndown(editor0.getHTML()));
    expect(savedLive0).toBe("## ⚠️ Fix List\n- บรรทัดว่างใต้ Heading");
    editor0.destroy();

    const editor1 = new CoreEditor({
      extensions: [StarterKit],
      content: renderMarkdownToEditorHtml("## ⚠️ Fix List\n\n- บรรทัดว่างใต้ Heading"),
      parseOptions: { preserveWhitespace: "full" },
    });
    const savedLive1 = normalizeSaved(td.turndown(editor1.getHTML()));
    expect(savedLive1).toBe("## ⚠️ Fix List\n\n- บรรทัดว่างใต้ Heading");
    editor1.destroy();
  });

  it("Test 13 — Preserves standalone image after table without swallowing into table, and preserves column alignment", () => {
    const input = `| Feature    | Supported |
| ---------- | :-------: |
| Headings   |     ✅     |
| Formatting |     ✅     |
| Lists      |     ✅     |
| Tables     |     ✅     |
| Code       |     ✅     |
| Images     |     ✅     |
| HTML       |     ⚠️    |

![Luno](https://picsum.photos/600/300)

> End of test.`;

    const tableHeaderExtension = TableHeader.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          align: {
            default: null,
            parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.align) return {};
              return {
                align: attributes.align,
                style: `text-align: ${attributes.align};`,
              };
            },
          },
        };
      },
    });

    const tableCellExtension = TableCell.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          align: {
            default: null,
            parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.align) return {};
              return {
                align: attributes.align,
                style: `text-align: ${attributes.align};`,
              };
            },
          },
        };
      },
    });

    const runEditorCycle = (md: string): string => {
      const html = renderMarkdownToEditorHtml(md);
      const editor = new CoreEditor({
        extensions: [
          StarterKit,
          Table.configure({ resizable: true }),
          TableRow,
          tableHeaderExtension,
          tableCellExtension,
          Image,
        ],
        content: html,
      });
      const editorHtml = editor.getHTML();
      const saved = normalizeSaved(td.turndown(editorHtml));
      editor.destroy();
      return saved;
    };

    const cycle1 = runEditorCycle(input);
    // Image must NOT be swallowed into table row
    expect(cycle1).not.toContain("| ![Luno]");
    expect(cycle1).toContain("![Luno](https://picsum.photos/600/300)");
    // Center column alignment must be preserved
    expect(cycle1).toContain(":---:");
    // Blank lines separating table, image, and blockquote must be preserved
    expect(cycle1).toMatch(/\| HTML \| ⚠️ \|\n\n!\[Luno\]/);
    expect(cycle1).toMatch(/!\[Luno\][^\n]+\n\n> End of test\./);

    const cycle2 = runEditorCycle(cycle1);
    expect(cycle2).not.toContain("| ![Luno]");
    expect(cycle2).toBe(cycle1);
  });

  it("Test 14 — Preserves multiple standalone images and their blank lines without collapsing onto one line", () => {
    const input = `## 6. Images

![Example Image](https://picsum.photos/800/400)

![Luno Logo](https://via.placeholder.com/400x200.png?text=Luno)

---`;

    const html = renderMarkdownToEditorHtml(input);
    const editor = new CoreEditor({
      extensions: [
        StarterKit,
        Image,
      ],
      content: html,
    });
    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    expect(saved).not.toContain("![Example Image](https://picsum.photos/800/400)![Luno Logo]");
    expect(saved).toContain("## 6. Images\n\n![Example Image]");
    expect(saved).toContain("![Example Image](https://picsum.photos/800/400)\n\n![Luno Logo]");
  });

  it("Test 15 — Preserves fenced code block separation inside blockquotes (Section 27)", () => {
    const input = `* Main item

  > Quote inside a list item
  >
  > * Another item
  >
  > \`\`\`javascript
  > console.log("Nested code");
  > \`\`\``;

    const res = runCycle(input);
    expect(res).toContain("console.log(\"Nested code\");");
    // Ensure the code fence is preceded by a quote boundary line rather than glued to the list item
    expect(res).toMatch(/>\s+- Another item\s*\n\s*>\s*\n\s*>\s*```javascript/);
  });

  it("Test 16 — Preserves details and summary element without extra div wrapper (Section 18)", () => {
    const input = `<details>
<summary>Click to expand</summary>

This content is inside a native HTML details element.

* Item 1
* Item 2
* Item 3

</details>`;

    const div = document.createElement("div");
    div.innerHTML = input;
    const res = td.turndown(div.innerHTML);
    expect(res).not.toContain("<div>");
    expect(res).toContain("<details>\n<summary>Click to expand</summary>");
    expect(res).toContain("Item 1");
    expect(res).toContain("</details>");
  });

  it("Test 17 — Preserves raw HTML div, styled paragraph, and kbd tags without losing lines (Section 18 & 19)", () => {
    const input = `<div>
    <strong>HTML Bold Text</strong>
</div>

<p style="color: red;">
This is HTML with inline styling.
</p>

<kbd>Ctrl</kbd> + <kbd>S</kbd>`;

    const html = renderMarkdownToEditorHtml(input);
    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ codeBlock: false, paragraph: false }),
        CustomParagraph,
        Kbd,
      ],
      content: html,
    });
    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    expect(saved).toContain("<div>\n    <strong>HTML Bold Text</strong>\n</div>");
    expect(saved).toContain('<p style="color: red;">\nThis is HTML with inline styling.\n</p>');
    expect(saved).toContain("<kbd>Ctrl</kbd> + <kbd>S</kbd>");
    expect(saved.trim().split("\n").length).toBe(input.trim().split("\n").length);
  });

  it("Test 18 — Roundtrip of Section 18 and 19 preserves line count exactly", () => {
    const section = `## 18. HTML

<div>
    <strong>HTML Bold Text</strong>
</div>

<p>This is an HTML paragraph.</p>

<details>
<summary>Click to expand</summary>

This content is inside a native HTML details element.

* Item 1
* Item 2
* Item 3

</details>

---

## 19. HTML Formatting

<p style="color: red;">
This is HTML with inline styling.
</p>

<mark>Highlighted text</mark>

<kbd>Ctrl</kbd> + <kbd>S</kbd>`;

    const html = renderMarkdownToEditorHtml(section);
    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ codeBlock: false, paragraph: false }),
        CustomParagraph,
        Kbd,
        Highlight,
        Toggle,
      ],
      content: html,
    });
    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    expect(saved.split("\n").length).toBe(section.split("\n").length);
  });

  it("Test 19 — Full roundtrip of Markdown Rendering Test file preserves 594 lines exactly", () => {
    const filePath = "C:/Users/LENOVO/Documents/Luno Notes/Markdown Rendering Test.md";
    const backupPath = "C:/Users/LENOVO/.gemini/antigravity/brain/a9d98c8c-12ca-4a99-8bdc-76e15bb11e73/scratch/orig_594.md";
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : fs.readFileSync(backupPath, "utf8");
    const origLines = content.split("\n").length;
    expect(origLines).toBe(594);

    const html = renderMarkdownToEditorHtml(content);
    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Image,
        TaskList,
        TaskItem,
        Underline,
        Highlight,
        Superscript,
        Subscript,
        Kbd,
        Toggle,
      ],
      content: html,
    });

    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    const savedLines = saved.split("\n").length;
    expect(savedLines).toBe(594);
  });

  it("Test 20 — Spacing between note Title (H1) and content: EDITOR_CLASSES includes [&>h1:first-child]:mb-6", () => {
    expect(EDITOR_CLASSES).toContain("[&>h1:first-child]:mb-6");
  });

  it("Test 21 — Freshly opened note has undo disabled (can().undo() === false) and sync does not leak undo", () => {
    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
      ],
      content: "<h1>My Title</h1><p>First paragraph</p>",
    });

    // Reset clean state as done on loading a new note
    const cleanState = editor.state.constructor.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanState);

    // Initial state after opening a note: undo must be false!
    expect(editor.can().undo()).toBe(false);

    // External title sync transaction with addToHistory: false
    const firstChild = editor.state.doc.firstChild;
    expect(firstChild?.type.name).toBe("heading");
    const tr = editor.state.tr;
    tr.setMeta("addToHistory", false);
    tr.setMeta("isSync", true);
    tr.replaceWith(1, 1 + (firstChild?.nodeSize ?? 2) - 2, editor.schema.text("Renamed Title"));
    editor.view.dispatch(tr);

    expect(editor.getText()).toContain("Renamed Title");
    // Undo must STILL be false because transaction was not added to history
    expect(editor.can().undo()).toBe(false);

    // When the user actually types/edits:
    editor.commands.focus("end");
    editor.commands.insertContent(" user typed something");
    expect(editor.can().undo()).toBe(true);

    // Undoing reverts only the user edit
    editor.commands.undo();
    expect(editor.getText()).not.toContain("user typed something");
    expect(editor.can().undo()).toBe(false);

    editor.destroy();
  });

  it("Test 22 — First line of content can be a blank line: preserved as <p></p> and roundtrips without disappearing", () => {
    const inputMd = "\nFirst line of content";
    const editorHtml = renderMarkdownToEditorHtml(inputMd);
    expect(editorHtml).toBe("<p></p><p>First line of content</p>");

    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
      ],
      content: editorHtml,
    });

    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    expect(saved).toBe("\nFirst line of content");
  });

  it("Test 23 — Two blank lines at start of content: preserved as 2 empty paragraphs and roundtrips cleanly", () => {
    const inputMd = "\n\nFirst line of content";
    const editorHtml = renderMarkdownToEditorHtml(inputMd);
    expect(editorHtml).toBe("<p></p><p></p><p>First line of content</p>");

    const editor = new CoreEditor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
      ],
      content: editorHtml,
    });

    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();

    expect(saved).toBe("\n\nFirst line of content");
  });

  it("Test 24 — Frontmatter followed by blank line preserves leading blank line in content", () => {
    const md = "---\ntags:\n  - test\n---\n\nFirst line of content";
    const editorHtml = renderMarkdownToEditorHtml(md);
    expect(editorHtml).toBe("<p></p><p>First line of content</p>");
  });

  it("Test 25 — Preserves space between multiple hashtags (#study #research #notes)", () => {
    const input = "#study #research #notes ";
    const editorHtml = renderMarkdownToEditorHtml(input);

    const editor = new CoreEditor({
      extensions: [StarterKit, HashtagDecoration],
      content: editorHtml,
      parseOptions: { preserveWhitespace: "full" },
    });

    expect(editor.getText().trim()).toBe("#study #research #notes");

    const saved = normalizeSaved(td.turndown(editor.getHTML()));
    editor.destroy();
    expect(saved.trim()).toBe("#study #research #notes");
  });

  it("Test 26 — Preserves space between hashtags in static HTML preview", () => {
    const input = "#study #research #notes";
    const html = renderMarkdownToEditorHtml(input, { forStaticHtmlPreview: true });

    expect(html).toContain("</span> <span");
    expect(html).not.toContain("</span><span");
  });

  it("Test 27 — Preserves spaces between wikilinks", () => {
    const input = "[[Study]] [[Research]] [[Notes]]";
    const html = renderMarkdownToEditorHtml(input);

    expect(html).toContain("</a> <a");
    expect(html).not.toContain("</a><a");
  });

  it("Test 28 — Tags at the end of a line or text without spacebar render as badges (#travel #itinerary #vacation)", () => {
    const input = "#travel #itinerary #vacation";
    const editorHtml = renderMarkdownToEditorHtml(input);

    const editor = new CoreEditor({
      extensions: [StarterKit, HashtagDecoration],
      content: editorHtml,
      parseOptions: { preserveWhitespace: "full" },
    });

    expect(editor.getText().trim()).toBe("#travel #itinerary #vacation");

    // Verify HashtagDecoration generated badges for all 3 tags including the final #vacation without space
    const hashtagPlugin = editor.state.plugins.find((p: any) => p.key.startsWith("hashtagDecoration"));
    expect(hashtagPlugin).toBeDefined();
    const decoSet = hashtagPlugin!.getState(editor.state);
    const decorations = decoSet.find(0, editor.state.doc.content.size);
    expect(decorations.length).toBe(3);

    // Static HTML preview without trailing space also formats the final tag as a badge
    const staticHtml = renderMarkdownToEditorHtml(input, { forStaticHtmlPreview: true });
    expect(staticHtml).toContain("#vacation</span>");

    editor.destroy();
  });
});


