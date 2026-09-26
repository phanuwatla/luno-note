import { describe, it, expect } from "vitest";
import { generateDocHtml } from "./docExportGenerator";

describe("docExportGenerator", () => {
  it("generates an MSO-compliant HTML Word document with title and Section1 page setup", () => {
    const html = generateDocHtml({
      title: "My Research Document",
      bodyHtml: "<p>This is test content.</p>",
      editorFontFamily: "sarabun",
      editorFontSize: 16,
      lineHeight: "1.8",
      theme: "teal",
    });

    expect(html).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');
    expect(html).toContain("<w:WordDocument>");
    expect(html).toContain("@page Section1");
    expect(html).toContain('<title>My Research Document</title>');
    expect(html).toContain('<h1 class="doc-title">My Research Document</h1>');
    expect(html).toContain("Sarabun");
    expect(html).toContain("mso-bidi-font-family");
    expect(html).toContain("<p>This is test content.</p>");
  });

  it("converts unwrapped inline hashtags into styled inline badges and includes tag color palette CSS", () => {
    const html = generateDocHtml({
      title: "Tagged Document",
      bodyHtml: "<p>Please review #review and mark as #urgent</p>",
      theme: "emerald",
      tagColorStyle: "multicolor",
    });

    expect(html).toContain('class="inline-tag-badge border');
    expect(html).toContain("#review");
    expect(html).toContain("#urgent");
    expect(html).toContain(".inline-tag-badge {");
    expect(html).toContain(".bg-cyan-500\\/15");
    expect(html).toContain(".text-cyan-700");
  });

  it("renders note tag header when tags array is provided", () => {
    const html = generateDocHtml({
      title: "Document with tags",
      bodyHtml: "<p>Content</p>",
      tags: ["ai", "science"],
      theme: "blue",
    });

    expect(html).toContain("note-tags-header");
    expect(html).toContain("#ai");
    expect(html).toContain("#science");
  });

  it("transforms task list checkboxes for Word into Unicode check symbols", () => {
    const taskListHtml = `
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true">
          <label><input type="checkbox" checked="checked" /></label>
          <div><p>Completed task item</p></div>
        </li>
        <li data-type="taskItem" data-checked="false">
          <label><input type="checkbox" /></label>
          <div><p>Pending task item</p></div>
        </li>
      </ul>
    `;
    const html = generateDocHtml({
      title: "Task Note",
      bodyHtml: taskListHtml,
      theme: "indigo",
    });

    expect(html).toContain("☑");
    expect(html).toContain("☐");
    expect(html).toContain("line-through");
    expect(html).toContain("Completed task item");
    expect(html).toContain("Pending task item");
  });

  it("applies accent headings when accentHeadings is enabled", () => {
    const htmlWithAccent = generateDocHtml({
      title: "Accent Heading Doc",
      bodyHtml: "<h2>Custom Section</h2>",
      accentHeadings: true,
      theme: "rose",
    });

    expect(htmlWithAccent).toContain("h2 {");
    expect(htmlWithAccent).toContain("color: #e11d48;");

    const htmlWithoutAccent = generateDocHtml({
      title: "Normal Heading Doc",
      bodyHtml: "<h2>Custom Section</h2>",
      accentHeadings: false,
      theme: "rose",
    });

    expect(htmlWithoutAccent).toContain("color: #0f172a;");
  });

  it("includes code block syntax highlighting and table styles", () => {
    const codeAndTableHtml = `
      <pre><code class="language-javascript"><span class="hljs-keyword">const</span> answer = 42;</code></pre>
      <table>
        <thead><tr><th>Header 1</th><th>Header 2</th></tr></thead>
        <tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody>
      </table>
    `;
    const html = generateDocHtml({
      title: "Code and Table Doc",
      bodyHtml: codeAndTableHtml,
    });

    expect(html).toContain(".hljs-keyword");
    expect(html).toContain(".hljs-string");
    expect(html).toContain("mso-table-lspace");
    expect(html).toContain("border-collapse: collapse;");
  });
});
