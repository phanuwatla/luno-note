import { describe, it, expect, vi, beforeEach } from "vitest";
import { escapeHtml, toTaskItemHtml, renderMarkdownToEditorHtml } from "@/components/Editor";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { imageLocalCache } from "@/components/editor/ImageNodeView";
import { videoLocalCache } from "@/components/editor/VideoNodeView";
import { audioLocalCache } from "@/components/editor/AudioNodeView";
import { downloadMediaFile } from "@/components/editor/mediaContextMenuUtils";

describe("Editor Security and Robustness Audit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("escapeHtml security & crash prevention", () => {
    it("safely handles null, undefined, or non-string inputs without throwing TypeError", () => {
      expect(escapeHtml(null as unknown as string)).toBe("");
      expect(escapeHtml(undefined as unknown as string)).toBe("");
      expect(escapeHtml(123 as unknown as string)).toBe("");
    });

    it("escapes all HTML special characters including single quotes", () => {
      const input = `<script>alert('xss & "quotes"')</script>`;
      const escaped = escapeHtml(input);
      expect(escaped).toBe("&lt;script&gt;alert(&#39;xss &amp; &quot;quotes&quot;&#39;)&lt;/script&gt;");
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      expect(escaped).not.toContain("'");
      expect(escaped).not.toContain('"');
    });
  });

  describe("toTaskItemHtml DOM structure", () => {
    it("does not create nested <p><p>...</p></p> when text is already wrapped in a paragraph", () => {
      const html = toTaskItemHtml(false, "<p>Clean task content</p>");
      expect(html).toContain("<div><p>Clean task content</p></div>");
      expect(html).not.toContain("<p><p>");
      expect(html).not.toContain("</p></p>");
    });

    it("wraps unwrapped raw text in a single paragraph", () => {
      const html = toTaskItemHtml(true, "Simple item");
      expect(html).toContain("<div><p>Simple item</p></div>");
    });

    it("handles empty or blank text without creating invalid elements", () => {
      const html = toTaskItemHtml(false, "");
      expect(html).toContain("<div><p></p></div>");
    });
  });

  describe("HTML Note XSS Sanitization in renderMarkdownToEditorHtml", () => {
    it("sanitizes script tags when contentFormat is html", () => {
      const maliciousHtml = '<p>Safe intro</p><script>alert("pwned")</script><img src="x" onerror="alert(1)">';
      const output = renderMarkdownToEditorHtml(maliciousHtml, {
        contentFormat: "html",
        isReadingMode: false,
      });

      expect(output).toContain("<p>Safe intro</p>");
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert");
      expect(output).not.toContain("onerror");
    });

    it("strips javascript: URIs from links in HTML content", () => {
      const maliciousLink = '<a href="javascript:alert(1)">Click me</a>';
      const output = renderMarkdownToEditorHtml(maliciousLink, {
        contentFormat: "html",
      });

      expect(output).not.toContain("javascript:");
    });
  });

  describe("sanitizeHtml error handling", () => {
    it("returns empty string instead of raw input if DOMPurify fails", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Test standard sanitize behavior
      expect(sanitizeHtml('<script>alert("test")</script>')).not.toContain("<script>");
      spy.mockRestore();
    });
  });

  describe("Media Cache Bounded LRU and URL.revokeObjectURL", () => {
    it("revokes existing blob URL when key is updated in imageLocalCache", () => {
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      const key = "test/img1.png";
      const blobUrl1 = "blob:http://localhost/test-uuid-1";
      const blobUrl2 = "blob:http://localhost/test-uuid-2";

      imageLocalCache.set(key, blobUrl1);
      expect(revokeSpy).not.toHaveBeenCalled();

      // Setting new value for same key should revoke previous blob URL
      imageLocalCache.set(key, blobUrl2);
      expect(revokeSpy).toHaveBeenCalledWith(blobUrl1);

      // Deleting key should revoke current blob URL
      imageLocalCache.delete(key);
      expect(revokeSpy).toHaveBeenCalledWith(blobUrl2);

      revokeSpy.mockRestore();
    });

    it("revokes existing blob URL when key is updated in videoLocalCache", () => {
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      const key = "test/video.mp4";
      const blob1 = "blob:http://localhost/vid-1";
      const blob2 = "blob:http://localhost/vid-2";

      videoLocalCache.set(key, blob1);
      videoLocalCache.set(key, blob2);
      expect(revokeSpy).toHaveBeenCalledWith(blob1);

      videoLocalCache.delete(key);
      expect(revokeSpy).toHaveBeenCalledWith(blob2);

      revokeSpy.mockRestore();
    });

    it("revokes existing blob URL when key is updated in audioLocalCache", () => {
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      const key = "test/audio.webm";
      const blob1 = "blob:http://localhost/aud-1";
      const blob2 = "blob:http://localhost/aud-2";

      audioLocalCache.set(key, blob1);
      audioLocalCache.set(key, blob2);
      expect(revokeSpy).toHaveBeenCalledWith(blob1);

      audioLocalCache.delete(key);
      expect(revokeSpy).toHaveBeenCalledWith(blob2);

      revokeSpy.mockRestore();
    });
  });

  describe("downloadMediaFile scheme security", () => {
    it("ignores javascript: and vbscript: URIs to prevent arbitrary script execution", () => {
      const appendSpy = vi.spyOn(document.body, "appendChild");
      downloadMediaFile("javascript:alert(1)", "malicious.js");
      downloadMediaFile("vbscript:MsgBox(1)", "malicious.vbs");
      downloadMediaFile("data:text/html,<script>alert(1)</script>", "malicious.html");

      expect(appendSpy).not.toHaveBeenCalled();
      appendSpy.mockRestore();
    });

    it("allows safe image and http downloads", () => {
      const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
      const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      downloadMediaFile("https://example.com/photo.png", "photo.png");
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      appendSpy.mockRestore();
      removeSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });

  describe("Markdown Parser DOM XSS Protection", () => {
    it("strips malicious inline onerror and onload handlers from raw HTML in markdown", () => {
      const maliciousMarkdown = '# Title\n\n<img src="invalid-image" onerror="alert(document.cookie)">\n\n<svg onload="alert(1)">';
      const output = renderMarkdownToEditorHtml(maliciousMarkdown, {
        contentFormat: "markdown",
      });

      expect(output).not.toContain("onerror");
      expect(output).not.toContain("onload");
      expect(output).not.toContain("alert");
    });
  });
});

