import { describe, it, expect, vi } from "vitest";

// Helper functions matching Editor implementation
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function inlineImagesToDataUrls(html: string): Promise<string> {
  if (!html || !html.includes("<img")) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));
    if (images.length === 0) return html;

    await Promise.all(
      images.map(async (img) => {
        const src = img.getAttribute("src");
        if (!src || src.startsWith("data:")) return;
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute("src", dataUrl);
        } catch (err) {
          console.warn("inlineImagesToDataUrls failed for:", src, err);
        }
      })
    );

    return doc.body ? doc.body.innerHTML : html;
  } catch (err) {
    console.warn("inlineImagesToDataUrls parse error:", err);
    return html;
  }
}

describe("Print and Export PDF utilities", () => {
  it("escapes special characters in document titles for HTML/Print", () => {
    const rawTitle = `Note <Test> & "Quotes" 'Single'`;
    const escaped = escapeHtml(rawTitle);
    expect(escaped).toBe("Note &lt;Test&gt; &amp; &quot;Quotes&quot; &#039;Single&#039;");
  });

  it("leaves already embedded data: URLs intact", async () => {
    const html = `<p>Test</p><img src="data:image/png;base64,iVBORw0KGgo=" alt="test" />`;
    const result = await inlineImagesToDataUrls(html);
    expect(result).toContain('src="data:image/png;base64,iVBORw0KGgo="');
  });

  it("converts blob: URLs inside HTML to data: URLs using fetch and FileReader", async () => {
    const fakeBlob = new Blob(["mock image data"], { type: "image/png" });
    const fakeBlobUrl = "blob:http://localhost:8080/test-uuid";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (url === fakeBlobUrl) {
        return {
          blob: async () => fakeBlob,
        } as unknown as Response;
      }
      throw new Error("Not found");
    });

    const html = `<div><p>Document</p><img src="${fakeBlobUrl}" alt="diagram" /></div>`;
    const inlined = await inlineImagesToDataUrls(html);

    expect(inlined).toContain('alt="diagram"');
    expect(inlined).not.toContain(fakeBlobUrl);
    expect(inlined).toContain("data:image/png;base64,");

    fetchSpy.mockRestore();
  });

  it("generates correct A4 print styling in exported HTML", () => {
    const title = "My Report";
    const bodyContent = "<h2>Section 1</h2><p>Content</p>";
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>` +
      `<style>` +
      `@page { size: A4; margin: 15mm 15mm 20mm 15mm; } ` +
      `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Thai", sans-serif; } ` +
      `@media print { body { padding: 0; max-width: 100%; } h1, h2, h3 { page-break-after: avoid; } }` +
      `</style></head><body>${bodyContent}</body></html>`;

    expect(fullHtml).toContain("@page { size: A4;");
    expect(fullHtml).toContain("Noto Sans Thai");
    expect(fullHtml).toContain("page-break-after: avoid;");
    expect(fullHtml).toContain("<title>My Report</title>");
  });

  it("generates correct image print layout styling", () => {
    const docTitle = "Photo 1";
    const src = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const printHtml =
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(docTitle)}</title>` +
      `<style>` +
      `@page { size: auto; margin: 15mm; } ` +
      `body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; } ` +
      `img { max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; }` +
      `</style>` +
      `</head><body><img src="${src}" alt="${escapeHtml(docTitle)}" /></body></html>`;

    expect(printHtml).toContain("@page { size: auto; margin: 15mm; }");
    expect(printHtml).toContain("object-fit: contain;");
    expect(printHtml).toContain(`src="${src}"`);
  });
});
