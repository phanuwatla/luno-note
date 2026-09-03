import { describe, it, expect } from "vitest";
import { rewriteHtmlForPreview, rewriteCssAssets } from "./htmlPreview";

describe("htmlPreview CSS inlining & resolution", () => {
  it("should inline linked CSS files as <style> tags", async () => {
    const html = '<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Hello</h1></body></html>';
    const cssContent = "body { background: #f5f7f8; color: #222; }";

    const result = await rewriteHtmlForPreview(
      html,
      (asset) => asset,
      async (assetPath) => {
        if (assetPath === "style.css") return cssContent;
        return null;
      }
    );

    expect(result).toContain('<style data-source="style.css">body { background: #f5f7f8; color: #222; }</style>');
    expect(result).not.toContain('<link rel="stylesheet"');
  });

  it("should resolve relative and @import rules inside CSS", async () => {
    const rawCss = '@import "typography.css"; body { background-image: url("bg.png"); }';
    const typographyCss = "h1 { font-size: 24px; }";

    const processed = await rewriteCssAssets(
      rawCss,
      (asset) => (asset === "bg.png" ? "data:image/png;base64,mock" : null),
      async (p) => (p === "typography.css" ? typographyCss : null)
    );

    expect(processed).toContain("h1 { font-size: 24px; }");
    expect(processed).toContain('url("data:image/png;base64,mock")');
  });

  it("should preserve external stylesheets and external links", async () => {
    const html = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><img src="photo.jpg">';
    const result = await rewriteHtmlForPreview(
      html,
      (asset) => (asset === "photo.jpg" ? "data:image/jpeg;base64,photo" : null)
    );

    expect(result).toContain('href="https://fonts.googleapis.com/css2?family=Inter"');
    expect(result).toContain('src="data:image/jpeg;base64,photo"');
  });
});
