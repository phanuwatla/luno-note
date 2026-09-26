import { describe, it, expect } from "vitest";
import { generatePdfHtml, escapeHtml, inlineImagesForPdf, formatInlineTagsInHtml } from "./pdfExportGenerator";

describe("pdfExportGenerator", () => {
  it("inlineImagesForPdf regenerates valid data URL for QR codes with data-qr-text", async () => {
    const inputHtml = '<p><img alt="QR Code" data-qr-code="true" data-qr-text="https://luno-note.app" data-qr-color="#26a295" loading="lazy" /></p>';
    const outputHtml = await inlineImagesForPdf(inputHtml);

    expect(outputHtml).toContain('src="data:image/png;base64,');
    expect(outputHtml).toContain('loading="eager"');
    expect(outputHtml).toContain('decoding="sync"');
  });

  it("escapes HTML special characters properly", () => {
    expect(escapeHtml("<script>&'\"")).toBe("&lt;script&gt;&amp;&#039;&quot;");
  });

  it("embeds Google Fonts and font family in generated HTML", () => {
    const html = generatePdfHtml({
      title: "My Research Note",
      bodyHtml: "<p>Hello world</p>",
      editorFontFamily: "prompt",
      editorFontSize: 16,
      lineHeight: "1.8",
      theme: "teal",
    });

    expect(html).toContain("fonts.googleapis.com");
    expect(html).toContain("Prompt");
    expect(html).toContain("--editor-font-size: 16px;");
    expect(html).toContain("--editor-line-height: 1.8;");
    expect(html).toContain("<title>My Research Note</title>");
  });

  it("renders note tag badges if tags are provided", () => {
    const html = generatePdfHtml({
      title: "Tagged Note",
      bodyHtml: "<p>Content</p>",
      tags: ["physics", "math"],
    });

    expect(html).toContain("note-tags-header");
    expect(html).toContain("#physics");
    expect(html).toContain("#math");
  });

  it("applies accent headings when accentHeadings option is enabled", () => {
    const htmlWithAccent = generatePdfHtml({
      title: "Heading Accent Test",
      bodyHtml: "<h2>Section</h2>",
      accentHeadings: true,
      theme: "violet",
    });

    expect(htmlWithAccent).toContain("h2 {");
    expect(htmlWithAccent).toContain("color: var(--primary);");

    const htmlWithoutAccent = generatePdfHtml({
      title: "Heading Normal Test",
      bodyHtml: "<h2>Section</h2>",
      accentHeadings: false,
    });

    expect(htmlWithoutAccent).toContain("color: var(--foreground);");
  });

  it("includes code block syntax highlighting styles and line break avoidance", () => {
    const html = generatePdfHtml({
      title: "Code Note",
      bodyHtml: '<pre><code class="language-typescript"><span class="hljs-keyword">const</span> x = 1;</code></pre>',
    });

    expect(html).toContain(".hljs-keyword");
    expect(html).toContain(".hljs-string");
    expect(html).toContain(".hljs-title");
    expect(html).toContain("page-break-inside: avoid;");
    expect(html).toContain("border-radius: 12px;");
  });

  it("includes task list and checkbox styling with SVG checkmark", () => {
    const taskListHtml = `
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true">
          <label><input type="checkbox" checked="checked" /></label>
          <div><p>Completed task</p></div>
        </li>
      </ul>
    `;
    const html = generatePdfHtml({
      title: "Todo Note",
      bodyHtml: taskListHtml,
    });

    expect(html).toContain('ul[data-type="taskList"]');
    expect(html).toContain("line-through");
    expect(html).toContain("background-image: url('data:image/svg+xml");
  });

  it("embeds user custom fonts css rules if provided", () => {
    const customCss = "@font-face { font-family: 'MyFont'; src: url('data:font/ttf;base64,AAA'); }";
    const html = generatePdfHtml({
      title: "Custom Font Note",
      bodyHtml: "<p>Custom text</p>",
      customFontsCss: customCss,
    });

    expect(html).toContain(customCss);
  });

  it("includes content-visibility and node-image CSS overrides to prevent skipped printing in Chromium", () => {
    const html = generatePdfHtml({
      title: "Image Note",
      bodyHtml: '<div class="node-image"><img src="data:image/png;base64,abc" /></div>',
    });

    expect(html).toContain(".node-image");
    expect(html).toContain("content-visibility: visible !important;");
    expect(html).toContain("contain: none !important;");
  });

  it("formatInlineTagsInHtml converts unwrapped hashtags into styled inline badges while ignoring code blocks", () => {
    const raw = "<p>Please check #review and #urgent now</p><pre><code>#notatag</code></pre>";
    const formatted = formatInlineTagsInHtml(raw, "emerald", "multicolor");

    expect(formatted).toContain('class="inline-tag-badge border');
    expect(formatted).toContain("#review");
    expect(formatted).toContain("#urgent");
    expect(formatted).toContain("<code>#notatag</code>");
    expect(formatted).not.toContain('class="inline-tag-badge border">#notatag');
  });

  it("generatePdfHtml includes .inline-tag-badge CSS and renders #review with editor parity", () => {
    const html = generatePdfHtml({
      title: "Hashtag Note",
      bodyHtml: "<p>Status: #review</p>",
      theme: "emerald",
    });

    expect(html).toContain(".inline-tag-badge {");
    expect(html).toContain("border-radius: 0.375rem");
    expect(html).toContain(".bg-cyan-500\\/15");
    expect(html).toContain(".text-cyan-700");
    expect(html).toContain(".border-cyan-500\\/30");
    expect(html).toContain('<span class="inline-tag-badge border');
    expect(html).toContain("#review</span>");
  });
});


