import { describe, expect, it } from "vitest";
import { marked } from "marked";
import {
  preprocessMarkdownForEditor,
  createTurndownService,
  renderMarkdownToEditorHtml,
  CustomParagraph,
  hasReadingModeFootnotesDoc,
} from "@/components/Editor";

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

  it("should insert footnote reference and definition at document end with referenceText", async () => {
    const { Editor } = await import("@tiptap/core");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const { Superscript } = await import("@/lib/tiptapCustomMarks");
    const { insertFootnoteAtSelection: insertFn, CustomParagraph } = await import("@/components/Editor");

    const editor = new Editor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
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
      content: "<p>Here is some text with a reference</p>",
    });

    editor.commands.focus("end");
    insertFn(editor, "Testing");

    const html = editor.getHTML();
    expect(html).toContain("data-footnote-ref=\"1\"");
    expect(html).toContain("data-footnote-backref=\"1\"");
    expect(html).toContain("[^1]:");
    expect(html).toContain("Testing");

    // Verify Turndown serializes this with 1 blank line before [^1]: Testing
    const mdResult = normalizeSaved(td.turndown(html));
    expect(mdResult).toContain("[^1]");
    expect(mdResult).toContain("[^1]: Testing");
    expect(mdResult.endsWith("[^1]: Testing")).toBe(true);

    // Insert second footnote with referenceText "Testing2"
    editor.commands.focus("start");
    insertFn(editor, "Testing2");

    const html2 = editor.getHTML();
    expect(html2).toContain("data-footnote-ref=\"2\"");
    expect(html2).toContain("data-footnote-backref=\"2\"");
    expect(html2).toContain("[^2]:");
    expect(html2).toContain("Testing2");

    // Verify [^1]: and [^2]: definitions are adjacent and at the document end
    const def1Index = html2.indexOf("[^1]:");
    const def2Index = html2.indexOf("[^2]:");
    expect(def1Index).toBeGreaterThan(-1);
    expect(def2Index).toBeGreaterThan(def1Index);

    const mdResult2 = normalizeSaved(td.turndown(html2));
    expect(mdResult2).toContain("[^1]: Testing\n[^2]: Testing2");

    editor.destroy();
  });

  it("in Reading Mode: should always sort footnotes in numerical order even if written out of order in markdown", () => {
    const md = [
      "Here is ref two[^2] and ref one[^1] and ref three[^3].",
      "",
      "[^3]: Third footnote",
      "[^2]: Second footnote",
      "[^1]: First footnote",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(md, true);

    const fn1Index = preprocessed.indexOf('data-footnote-id="1"');
    const fn2Index = preprocessed.indexOf('data-footnote-id="2"');
    const fn3Index = preprocessed.indexOf('data-footnote-id="3"');

    expect(fn1Index).toBeGreaterThan(-1);
    expect(fn2Index).toBeGreaterThan(-1);
    expect(fn3Index).toBeGreaterThan(-1);

    // fn1 must come before fn2, and fn2 must come before fn3
    expect(fn1Index).toBeLessThan(fn2Index);
    expect(fn2Index).toBeLessThan(fn3Index);
  });

  it("in Edit Mode: should keep exact order and in-place positions of footnotes written out of order without reordering", () => {
    const md = [
      "Here is ref one[^1], ref three[^3], ref two[^2].",
      "",
      "[^1]: First footnote",
      "[^3]: Third footnote",
      "[^2]: Second footnote",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(md, false);

    const fn1Index = preprocessed.indexOf('data-footnote-def="1"');
    const fn3Index = preprocessed.indexOf('data-footnote-def="3"');
    const fn2Index = preprocessed.indexOf('data-footnote-def="2"');

    expect(fn1Index).toBeGreaterThan(-1);
    expect(fn3Index).toBeGreaterThan(-1);
    expect(fn2Index).toBeGreaterThan(-1);

    // In Edit Mode: must stay in original order [^1] -> [^3] -> [^2]
    expect(fn1Index).toBeLessThan(fn3Index);
    expect(fn3Index).toBeLessThan(fn2Index);
  });

  it("should preserve footnote attributes through renderMarkdownToEditorHtml and TipTap editor in Edit Mode", async () => {
    const md = "Here is text with footnote[^1].\n\n[^1]: Footnote definition.";
    const html = renderMarkdownToEditorHtml(md, { isReadingMode: false });
    console.log("RENDERED EDIT HTML:", html);

    const { Editor } = await import("@tiptap/core");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const { Superscript } = await import("@/lib/tiptapCustomMarks");

    const editor = new Editor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
        Superscript,
        Link.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              class: {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("class"),
                renderHTML: (attrs: any) => attrs.class ? { class: attrs.class } : {},
              },
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
              id: {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("id"),
                renderHTML: (attrs: any) => attrs.id ? { id: attrs.id } : {},
              },
            };
          },
        }).configure({
          openOnClick: false,
          validate: () => true,
          isAllowedUri: (url, ctx) => {
            if (!url) return false;
            if (url.startsWith("wikilink:") || url.startsWith("#")) return true;
            return ctx.defaultValidate(url);
          },
        }),
      ],
      content: html,
    });

    const tiptapHtml = editor.getHTML();
    console.log("TIPTAP HTML:", tiptapHtml);
    expect(html).toContain('href="#fn-1"');
    expect(html).toContain('data-footnote-ref="1"');
    expect(html).toContain('data-footnote-def="1"');
    expect(tiptapHtml).toContain('data-footnote-ref="1"');
    expect(tiptapHtml).toContain('data-footnote-def="1"');

    const div = document.createElement("div");
    div.innerHTML = tiptapHtml;
    const saved = normalizeSaved(td.turndown(div.innerHTML));
    console.log("SAVED FROM TIPTAP:", saved);
    expect(saved).toBe(md);

    editor.destroy();
  });

  it("should never convert Reading Mode bottom footnotes into numbered list or standalone horizontal rule", async () => {
    const md = [
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

    const readingHtml = renderMarkdownToEditorHtml(md, { isReadingMode: true });

    const { Editor } = await import("@tiptap/core");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const { Superscript } = await import("@/lib/tiptapCustomMarks");

    const editor = new Editor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
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
              id: {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("id"),
                renderHTML: (attrs: any) => attrs.id ? { id: attrs.id } : {},
              },
            };
          },
        }).configure({
          openOnClick: false,
          validate: () => true,
          isAllowedUri: (url, ctx) => {
            if (!url) return false;
            if (url.startsWith("wikilink:") || url.startsWith("#")) return true;
            return ctx.defaultValidate(url);
          },
        }),
      ],
      content: readingHtml,
    });

    const tiptapHtml = editor.getHTML();
    // Verify td.turndown with updated rules does NOT output "1. This is a footnote."
    const div = document.createElement("div");
    div.innerHTML = tiptapHtml;
    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).not.toContain("1. This is a footnote.");

    // Verify hasReadingModeFootnotesDoc returns true for reading mode doc
    expect(hasReadingModeFootnotesDoc(editor.state.doc)).toBe(true);

    editor.destroy();
  });

  it("hasReadingModeFootnotesDoc should return false for Edit Mode document", async () => {
    const { Editor } = await import("@tiptap/core");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Link = (await import("@tiptap/extension-link")).default;

    const md = [
      "## 29. Footnote-like Text",
      "",
      "Here is some text with a reference[^1].",
      "",
      "[^1]: This is a footnote.",
      "",
      "---",
      "",
      "## End of Markdown Test",
      "",
      "If you can see this correctly, the renderer passed the basic test. 🎉",
    ].join("\n");

    const editHtml = renderMarkdownToEditorHtml(md, { isReadingMode: false });

    const editor = new Editor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
        Link.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              "data-footnote-backref": {
                default: null,
                parseHTML: (el: HTMLElement) => el.getAttribute("data-footnote-backref"),
                renderHTML: (attrs: any) => attrs["data-footnote-backref"] ? { "data-footnote-backref": attrs["data-footnote-backref"] } : {},
              },
            };
          },
        }),
      ],
      content: editHtml,
    });

    // In Edit mode, hasReadingModeFootnotesDoc must be false
    expect(hasReadingModeFootnotesDoc(editor.state.doc)).toBe(false);

    // And verify the DOM has [^1]: in-place, and NO bottom footnote list
    const html = editor.getHTML();
    expect(html).toContain("[^1]:");
    expect(html).not.toContain("↩");

    editor.destroy();
  });

  it("in Reading Mode: should format footnote section as blank line -> divider -> blank line -> footnotes list", () => {
    const md = [
      "Here is text referencing Patterson & Hennessy[^1].",
      "",
      "[^1]: Patterson, D. A., & Hennessy, J. L. *Computer Organization and Design: The Hardware/Software Interface* (RISC-V Edition). Morgan Kaufmann.",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(md, true);

    // Verify the preprocessed markdown contains the exact sequence:
    // 1. Text referencing ...
    // 2. <p></p> (blank line)
    // 3. <hr class="footnotes-sep... (divider)
    // 4. <p></p> (blank line)
    // 5. <section class="footnotes... (footnotes list)
    const textIndex = preprocessed.indexOf("Here is text referencing Patterson & Hennessy");
    const firstBlankIndex = preprocessed.indexOf("<p></p>", textIndex);
    const hrIndex = preprocessed.indexOf('class="footnotes-sep', firstBlankIndex);
    const secondBlankIndex = preprocessed.indexOf("<p></p>", hrIndex);
    const sectionIndex = preprocessed.indexOf('<section class="footnotes', secondBlankIndex);

    expect(textIndex).toBeGreaterThan(-1);
    expect(firstBlankIndex).toBeGreaterThan(textIndex);
    expect(hrIndex).toBeGreaterThan(firstBlankIndex);
    expect(secondBlankIndex).toBeGreaterThan(hrIndex);
    expect(sectionIndex).toBeGreaterThan(secondBlankIndex);
  });

  it("should parse Markdown inline formatting (italics, bold, code, highlights) inside footnote content", () => {
    const md = [
      "Text with academic citations[^1] and technical note[^2].",
      "",
      "[^1]: Patterson, D. A., & Hennessy, J. L. *Computer Organization and Design: The Hardware/Software Interface* (RISC-V Edition). Morgan Kaufmann.",
      "[^2]: Check **important** specification in `RFC 7519` with ==highlight==.",
    ].join("\n");

    // 1. Reading Mode
    const readingHtml = renderMarkdownToEditorHtml(md, { isReadingMode: true });
    // *Computer Organization and Design: The Hardware/Software Interface* must be rendered as <em>...</em> (no raw asterisks)
    expect(readingHtml).toContain("<em>Computer Organization and Design: The Hardware/Software Interface</em>");
    expect(readingHtml).not.toContain("*Computer Organization and Design: The Hardware/Software Interface*");
    // **important** must be rendered as <strong>important</strong>
    expect(readingHtml).toContain("<strong>important</strong>");
    // `RFC 7519` must be rendered as <code>RFC 7519</code>
    expect(readingHtml).toContain("<code>RFC 7519</code>");
    // ==highlight== must be rendered as <mark ...>highlight</mark>
    expect(readingHtml).toContain("highlight");

    // 2. Edit Mode
    const editHtml = renderMarkdownToEditorHtml(md, { isReadingMode: false });
    expect(editHtml).toContain("<em>Computer Organization and Design: The Hardware/Software Interface</em>");
    expect(editHtml).not.toContain("*Computer Organization and Design: The Hardware/Software Interface*");
    expect(editHtml).toContain("<strong>important</strong>");
    expect(editHtml).toContain("<code>RFC 7519</code>");

    // 3. Roundtrip in Edit Mode
    const div = document.createElement("div");
    div.innerHTML = editHtml;
    const saved = normalizeSaved(td.turndown(div.innerHTML));
    expect(saved).toMatch(/\[\^1\]: Patterson, D\. A\., & Hennessy, J\. L\. [_]Computer Organization and Design: The Hardware\/Software Interface[_] \(RISC-V Edition\)\. Morgan Kaufmann\./);
    expect(saved).toMatch(/\[\^2\]: Check \*\*important\*\* specification in `RFC 7519`[\s\u00A0]+with ==highlight==\./);
  });
});

