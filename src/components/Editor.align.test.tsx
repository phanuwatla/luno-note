import { describe, expect, it } from "vitest";
import { Editor as CoreEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  createTurndownService,
  preprocessMarkdownForEditor,
  normalizeSerializedMarkdown,
  renderMarkdownToEditorHtml,
  CustomParagraph,
} from "@/components/Editor";
import { TextAlign } from "@/lib/tiptapCustomMarks";

describe("Text Alignment blank line preservation across save and reload", () => {
  const td = createTurndownService();
  const normalizeSaved = (markdown: string) => {
    return normalizeSerializedMarkdown(markdown);
  };

  const runCycles = (initialHtml: string, cycles: number = 5) => {
    let currentHtml = initialHtml;
    let lastMd = "";
    for (let i = 0; i < cycles; i++) {
      const editor = new CoreEditor({
        extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
        content: currentHtml,
      });
      lastMd = normalizeSaved(td.turndown(editor.getHTML()));
      currentHtml = renderMarkdownToEditorHtml(lastMd);
      editor.destroy();
    }
    return { finalHtml: currentHtml, finalMd: lastMd };
  };

  it("preserves 0 blank lines between two centered paragraphs across multiple cycles", () => {
    const initial = '<p style="text-align: center;">Line 1</p><p style="text-align: center;">Line 2</p>';
    const res = runCycles(initial, 5);

    const editor = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: res.finalHtml,
    });
    const blocks = editor.getJSON().content || [];
    expect(blocks.length).toBe(2);
    expect(blocks[0].content?.[0]?.text).toBe("Line 1");
    expect(blocks[0].attrs?.textAlign).toBe("center");
    expect(blocks[1].content?.[0]?.text).toBe("Line 2");
    expect(blocks[1].attrs?.textAlign).toBe("center");
    editor.destroy();
  });

  it("preserves 0 blank lines between centered paragraph and normal paragraph across multiple cycles", () => {
    const initial = '<p style="text-align: center;">Line 1</p><p>Line 2</p>';
    const res = runCycles(initial, 5);

    const editor = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: res.finalHtml,
    });
    const blocks = editor.getJSON().content || [];
    expect(blocks.length).toBe(2);
    expect(blocks[0].content?.[0]?.text).toBe("Line 1");
    expect(blocks[0].attrs?.textAlign).toBe("center");
    expect(blocks[1].content?.[0]?.text).toBe("Line 2");
    expect(blocks[1].attrs?.textAlign).toBe("left");
    editor.destroy();
  });

  it("preserves 0 blank lines between normal paragraph and centered paragraph across multiple cycles", () => {
    const initial = '<p>Line 1</p><p style="text-align: center;">Line 2</p>';
    const res = runCycles(initial, 5);

    const editor = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: res.finalHtml,
    });
    const blocks = editor.getJSON().content || [];
    expect(blocks.length).toBe(2);
    expect(blocks[0].content?.[0]?.text).toBe("Line 1");
    expect(blocks[0].attrs?.textAlign).toBe("left");
    expect(blocks[1].content?.[0]?.text).toBe("Line 2");
    expect(blocks[1].attrs?.textAlign).toBe("center");
    editor.destroy();
  });

  it("preserves 0 blank lines between centered heading and normal paragraph across multiple cycles", () => {
    const initial = '<h1 style="text-align: center;">Title</h1><p>Line 1</p>';
    const res = runCycles(initial, 5);

    const editor = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: res.finalHtml,
    });
    const blocks = editor.getJSON().content || [];
    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].content?.[0]?.text).toBe("Title");
    expect(blocks[0].attrs?.textAlign).toBe("center");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[1].content?.[0]?.text).toBe("Line 1");
    expect(blocks[1].attrs?.textAlign).toBe("left");
    editor.destroy();
  });

  it("preserves exact 1 intentional blank line between aligned paragraphs across multiple cycles", () => {
    const initial = '<p style="text-align: center;">Line 1</p><p></p><p style="text-align: center;">Line 2</p>';
    const res = runCycles(initial, 5);

    const editor = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: res.finalHtml,
    });
    const blocks = editor.getJSON().content || [];
    expect(blocks.length).toBe(3);
    expect(blocks[0].content?.[0]?.text).toBe("Line 1");
    expect(blocks[0].attrs?.textAlign).toBe("center");
    expect(blocks[1].content).toBeUndefined(); // Empty paragraph
    expect(blocks[2].content?.[0]?.text).toBe("Line 2");
    expect(blocks[2].attrs?.textAlign).toBe("center");
    editor.destroy();
  });

  it("preserves alignment when user dynamically aligns text in editor then saves and reloads", () => {
    const editor1 = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: "<p>First line</p><p>Second line</p>",
    });

    // Align first line to center
    editor1.commands.setTextSelection(3);
    (editor1.commands as any).setTextAlign("center");

    const savedMd = normalizeSaved(td.turndown(editor1.getHTML()));
    editor1.destroy();

    // Reopen in new editor
    const reloadedHtml = renderMarkdownToEditorHtml(savedMd);
    const editor2 = new CoreEditor({
      extensions: [StarterKit.configure({ paragraph: false }), CustomParagraph, TextAlign],
      content: reloadedHtml,
    });

    const blocks = editor2.getJSON().content || [];
    expect(blocks.length).toBe(2); // Exactly 2 lines, no extra blank line
    expect(blocks[0].content?.[0]?.text).toBe("First line");
    expect(blocks[0].attrs?.textAlign).toBe("center");
    expect(blocks[1].content?.[0]?.text).toBe("Second line");
    expect(blocks[1].attrs?.textAlign).toBe("left");
    editor2.destroy();
  });
});
