import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  it("strips script tags and executable scripts", () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("<p>Hello</p>");
  });

  it("strips inline event handlers like onerror and onload", () => {
    const dirty = '<img src="invalid.jpg" onerror="alert(1)" /><svg onload="alert(2)" />';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("onload");
    expect(clean).not.toContain("alert");
  });

  it("strips javascript: pseudo-protocol URIs", () => {
    const dirty = '<a href="javascript:alert(1)">Click me</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("javascript:");
  });

  it("preserves safe markdown-generated elements and internal wikilinks", () => {
    const safe = '<h1>Title</h1><p><strong>Bold</strong> and <em>Italic</em></p><table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table><p><a href="wikilink:Test2" data-wikilink="Test2" class="internal-wikilink text-primary underline underline-offset-4 cursor-pointer">Test2</a></p>';
    const clean = sanitizeHtml(safe);
    expect(clean).toContain("<h1>Title</h1>");
    expect(clean).toContain("<strong>Bold</strong>");
    expect(clean).toContain("<table>");
    expect(clean).toContain('href="wikilink:Test2"');
    expect(clean).toContain('data-wikilink="Test2"');
  });

  it("handles empty and non-string inputs safely", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null as unknown as string)).toBe("");
  });

  it("preserves footnotes and all footnote attributes and ids", () => {
    const fnEdit = '<p>Text<sup><a href="#fn-1" id="fnref-1" data-footnote-ref="1" class="footnote-ref">[1]</a></sup></p><p id="fn-1" data-footnote-def="1" class="footnote-def"><a href="#fnref-1" data-footnote-backref="1" class="footnote-backref">[^1]:</a> Footnote content</p>';
    const cleanEdit = sanitizeHtml(fnEdit);
    expect(cleanEdit).toContain('id="fnref-1"');
    expect(cleanEdit).toContain('href="#fn-1"');
    expect(cleanEdit).toContain('data-footnote-ref="1"');
    expect(cleanEdit).toContain('id="fn-1"');
    expect(cleanEdit).toContain('data-footnote-def="1"');
    expect(cleanEdit).toContain('data-footnote-backref="1"');

    const fnReading = '<section class="footnotes my-4" data-footnotes="true"><ol class="footnotes-list"><li id="fn-1" class="footnote-item" data-footnote-id="1"><p><a id="fn-1" data-footnote-target="1" class="footnote-anchor"></a>Content <a href="#fnref-1" id="fnback-1" data-footnote-backref="1" class="footnote-backref">↩</a></p></li></ol></section>';
    const cleanReading = sanitizeHtml(fnReading);
    expect(cleanReading).toContain('data-footnotes="true"');
    expect(cleanReading).toContain('id="fn-1"');
    expect(cleanReading).toContain('data-footnote-id="1"');
    expect(cleanReading).toContain('data-footnote-target="1"');
    expect(cleanReading).toContain('id="fnback-1"');
    expect(cleanReading).toContain('data-footnote-backref="1"');
  });
});
