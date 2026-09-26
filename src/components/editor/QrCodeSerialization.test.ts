import { describe, it, expect } from "vitest";
import { createTurndownService, renderMarkdownToEditorHtml } from "@/components/Editor";

describe("QR Code Serialization & Obsidian Compatibility", () => {
  it("serializes QR Code with relative attachment path cleanly without huge base64", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("attachments/qrcode_comsan_choice.png", "blob:http://localhost/mock-qr-blob");

    const td = createTurndownService(assetMap);

    const initialHtml =
      '<p>Here is the QR code:</p><img src="blob:http://localhost/mock-qr-blob" alt="QR Code" width="220" data-relative-src="attachments/qrcode_comsan_choice.png" data-qr-code="true" data-qr-text="comsan-choice.vercel.app" data-qr-color="#8b5cf6" data-qr-bg="white" data-qr-level="M" /><p>End</p>';

    const serializedMd = td.turndown(initialHtml);

    // 1. Must NOT contain giant base64 data URLs
    expect(serializedMd).not.toContain("data:image/png;base64");

    // 2. Must use clean relative file path in attachments/
    expect(serializedMd).toContain('src="attachments/qrcode_comsan_choice.png"');

    // 3. Must preserve QR identification and configuration for later editing in Luno Note
    expect(serializedMd).toContain('data-qr-code="true"');
    expect(serializedMd).toContain('data-qr-text="comsan-choice.vercel.app"');
    expect(serializedMd).toContain('data-qr-color="#8b5cf6"');
    expect(serializedMd).toContain('data-qr-bg="white"');
    expect(serializedMd).toContain('data-qr-level="M"');
    expect(serializedMd).toContain('width="220"');
  });

  it("omits unset optional attributes cleanly", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("attachments/qrcode_test.png", "blob:http://localhost/mock-blob");

    const td = createTurndownService(assetMap);

    const initialHtml =
      '<p>Note</p><img src="blob:http://localhost/mock-blob" alt="QR Code" width="200" data-relative-src="attachments/qrcode_test.png" data-qr-code="true" data-qr-text="https://luno.app" /><p>Next</p>';

    const serializedMd = td.turndown(initialHtml);

    expect(serializedMd).toContain('src="attachments/qrcode_test.png"');
    expect(serializedMd).toContain('data-qr-code="true"');
    expect(serializedMd).toContain('data-qr-text="https://luno.app"');
    expect(serializedMd).toContain('width="200"');
    expect(serializedMd).not.toContain('data-qr-color');
    expect(serializedMd).not.toContain('data-qr-bg');
    expect(serializedMd).not.toContain('data-qr-level');
  });

  it("roundtrips from Markdown to Editor HTML cleanly", () => {
    const md =
      'Here is a QR code:\n\n<img src="attachments/qrcode_comsan_choice.png" alt="QR Code" width="220" data-qr-code="true" data-qr-text="comsan-choice.vercel.app" data-qr-color="#8b5cf6" />\n\nDone.';

    const parsedHtml = renderMarkdownToEditorHtml(md);

    expect(parsedHtml).toContain('src="attachments/qrcode_comsan_choice.png"');
    expect(parsedHtml).toContain('data-qr-code="true"');
    expect(parsedHtml).toContain('data-qr-text="comsan-choice.vercel.app"');
    expect(parsedHtml).toContain('data-qr-color="#8b5cf6"');
    expect(parsedHtml).toContain('width="220"');
  });
});
