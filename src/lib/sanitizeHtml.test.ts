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

  it("preserves safe markdown-generated elements", () => {
    const safe = '<h1>Title</h1><p><strong>Bold</strong> and <em>Italic</em></p><table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table>';
    const clean = sanitizeHtml(safe);
    expect(clean).toContain("<h1>Title</h1>");
    expect(clean).toContain("<strong>Bold</strong>");
    expect(clean).toContain("<table>");
  });

  it("handles empty and non-string inputs safely", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null as unknown as string)).toBe("");
  });
});
