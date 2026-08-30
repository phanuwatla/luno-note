import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { preprocessMarkdownForEditor, createTurndownService } from "@/components/Editor";

describe("Markdown Footnotes Support", () => {
  const td = createTurndownService();

  const normalizeSaved = (md: string) =>
    md
      .replace(/\r\n/g, "\n")
      .replace(/<!--luno:blank-->/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  it("should preprocess footnote references into interactive superscript links", () => {
    const md = "Here is some text with a reference[^1].";
    const preprocessed = preprocessMarkdownForEditor(md, false);
    expect(preprocessed).toContain("<sup");
    expect(preprocessed).toContain('href="#fn-1"');
    expect(preprocessed).toContain('id="fnref-1"');
    expect(preprocessed).toContain('data-footnote-ref="1"');
    expect(preprocessed).toContain("[1]");
  });

  it("in Edit Mode: should display footnote definitions in-place without the backlink arrow to preserve file lines", () => {
    const md = [
      "Here is some text with a reference[^1].",
      "",
      "[^1]: This is a footnote.",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(md, false);
    expect(preprocessed).toContain('id="fn-1"');
    expect(preprocessed).toContain('data-footnote-def="1"');
    expect(preprocessed).toContain("[^1]:");
    expect(preprocessed).toContain("This is a footnote.");
    // In edit mode: NO separate backlink arrow (↩)
    expect(preprocessed).not.toContain("↩");
  });

  it("in Reading Mode: should preserve exactly 1 blank line spacing between text and next section/divider while moving footnotes to bottom", () => {
    const md = [
      "---",
      "",
      "## 29. Footnote-like Text",
      "",
      "Here is some text with a reference[^1].",
      "",
      "[^1]: This is a footnote.",
      "",
      "---",
      "",
      "## 30. Definition-like Content",
      "",
      "If you can see this correctly, the renderer passed the basic test. 🎉",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(md, true);

    // Verify footnote definition is NOT in the middle of the text
    const textRefIndex = preprocessed.indexOf("Here is some text with a reference");
    const dividerIndex = preprocessed.indexOf("---", textRefIndex);
    const heading30Index = preprocessed.indexOf("30. Definition-like Content");
    const footnotesSectionIndex = preprocessed.indexOf('<section class="footnotes');

    expect(textRefIndex).toBeLessThan(dividerIndex);
    expect(dividerIndex).toBeLessThan(heading30Index);
    expect(heading30Index).toBeLessThan(footnotesSectionIndex);

    // Verify exactly 1 blank line (<p></p>) between the reference text and the following divider
    const betweenTextAndDivider = preprocessed.slice(textRefIndex, dividerIndex);
    expect(betweenTextAndDivider).toContain("<p></p>");
    expect(betweenTextAndDivider).not.toContain("<p></p>\n<p></p>");

    expect(preprocessed).toContain('class="footnotes-sep');
    expect(preprocessed).toContain('data-footnote-target="1"');
    expect(preprocessed).toContain('href="#fnref-1"');
    expect(preprocessed).toContain('data-footnote-backref="1"');
    expect(preprocessed).toContain("This is a footnote.");
    // In reading mode: WITH backlink arrow (↩)
    expect(preprocessed).toContain("↩");
  });

  it("should seamlessly roundtrip markdown footnotes in Edit Mode without altering real file lines or data", () => {
    const originalMarkdown = [
      "## 29. Footnote-like Text",
      "",
      "Here is some text with a reference[^1].",
      "",
      "[^1]: This is a footnote.",
      "",
      "## End of Markdown Test",
      "",
      "If you can see this correctly, the renderer passed the basic test. 🎉",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(originalMarkdown, false);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe(originalMarkdown);
  });

  it("should support multiple footnotes in-place without reordering", () => {
    const originalMarkdown = [
      "# Footnote Document",
      "",
      "First reference[^1], second note[^alpha], and third[^ref-3].",
      "",
      "[^1]: First footnote content.",
      "",
      "[^alpha]: Alpha note content.",
      "",
      "[^ref-3]: Third reference content.",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(originalMarkdown, false);
    const parsedHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

    const div = document.createElement("div");
    div.innerHTML = parsedHtml;

    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toBe(originalMarkdown);
  });

  it("should insert footnote reference and definition placeholder using insertFootnoteAtSelection", async () => {
    const { Editor } = await import("@tiptap/core");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const { Superscript } = await import("@/lib/tiptapCustomMarks");
    const { insertFootnoteAtSelection: insertFn } = await import("@/components/Editor");

    const editor = new Editor({
      extensions: [
        StarterKit,
        Superscript,
        Link.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              "data-footnote-ref": {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("data-footnote-ref"),
                renderHTML: (attrs: any) => attrs["data-footnote-ref"] ? { "data-footnote-ref": attrs["data-footnote-ref"] } : {},
              },
              "data-footnote-backref": {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("data-footnote-backref"),
                renderHTML: (attrs: any) => attrs["data-footnote-backref"] ? { "data-footnote-backref": attrs["data-footnote-backref"] } : {},
              },
            };
          },
        }),
      ],
      content: "<p>Some text</p>",
    });

    editor.commands.focus("end");
    insertFn(editor);

    const html = editor.getHTML();
    expect(html).toContain("data-footnote-ref=\"1\"");
    expect(html).toContain("data-footnote-backref=\"1\"");
    expect(html).toContain("[^1]:");

    // Insert second footnote in another paragraph
    editor.commands.focus("end");
    editor.commands.insertContent("<p>Second paragraph with reference </p>");
    editor.commands.focus("end");
    insertFn(editor);

    const html2 = editor.getHTML();
    expect(html2).toContain("data-footnote-ref=\"2\"");
    expect(html2).toContain("data-footnote-backref=\"2\"");
    expect(html2).toContain("[^2]:");

    // Verify [^1]: and [^2]: definitions are adjacent and grouped together at the bottom
    const def1Index = html2.indexOf("[^1]:");
    const def2Index = html2.indexOf("[^2]:");
    expect(def1Index).toBeGreaterThan(-1);
    expect(def2Index).toBeGreaterThan(def1Index);

    editor.destroy();
  });
});
