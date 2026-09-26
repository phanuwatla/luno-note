import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { AudioExtension } from "./AudioExtension";
import { createTurndownService, renderMarkdownToEditorHtml } from "@/components/Editor";

describe("AudioExtension", () => {
  it("should initialize and insert audio node with relative src", () => {
    const editor = new Editor({
      extensions: [StarterKit, AudioExtension],
      content: "<p>Hello</p>",
    });

    editor
      .chain()
      .focus()
      .setAudio({
        src: "blob:http://localhost/mock-audio",
        title: "Voice Note - 2026-09-11 20_49",
        "data-relative-src": "attachments/Voice Note - 2026-09-11 20_49.webm",
      })
      .run();

    const html = editor.getHTML();
    expect(html).toContain("<audio");
    expect(html).toContain('src="blob:http://localhost/mock-audio"');
    expect(html).toContain('data-title="Voice Note - 2026-09-11 20_49"');
    expect(html).toContain('data-relative-src="attachments/Voice Note - 2026-09-11 20_49.webm"');
  });

  it("should parse audio html tag correctly", () => {
    const editor = new Editor({
      extensions: [StarterKit, AudioExtension],
      content: '<p>Note</p><audio controls src="blob:http://localhost/audio" data-title="Voice Clip" data-relative-src="attachments/Voice Clip.webm"></audio>',
    });

    const json = editor.getJSON();
    const audioNode = json.content?.find((node) => node.type === "audio");
    expect(audioNode).toBeDefined();
    expect(audioNode?.attrs?.src).toBe("blob:http://localhost/audio");
    expect(audioNode?.attrs?.title).toBe("Voice Clip");
    expect(audioNode?.attrs?.["data-relative-src"]).toBe("attachments/Voice Clip.webm");
  });

  it("should serialize audio tag to Markdown as Obsidian Wikilink embed", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("attachments/Voice Note - 2026-09-11 20_49.webm", "blob:http://localhost/audio-blob");

    const td = createTurndownService(assetMap);

    const initialHtml =
      '<p>Note content</p><audio controls src="blob:http://localhost/audio-blob" data-title="Voice Note - 2026-09-11 20_49" data-relative-src="attachments/Voice Note - 2026-09-11 20_49.webm"></audio><p>End</p>';

    const serializedMd = td.turndown(initialHtml);

    // Verify Turndown serializes as Obsidian Wikilink embed, not huge HTML/base64
    expect(serializedMd).toContain("![[attachments/Voice Note - 2026-09-11 20_49.webm]]");
    expect(serializedMd).not.toContain("<audio");
    expect(serializedMd).not.toContain("data:audio");

    // Verify roundtrip through renderMarkdownToEditorHtml
    const reloadedHtml = renderMarkdownToEditorHtml(serializedMd, { assetBlobUrlMap: assetMap });
    expect(reloadedHtml).toContain("<audio");
    expect(decodeURIComponent(reloadedHtml)).toContain('data-relative-src="attachments/Voice Note - 2026-09-11 20_49.webm"');
  });

  it("should convert existing data:audio tags with title into Obsidian Wikilink embeds upon save", () => {
    const assetMap = new Map<string, string>();
    const td = createTurndownService(assetMap);

    const oldBase64Html =
      '<audio controls src="data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwE=" data-title="Voice Note - 2026-09-11 20_49"></audio>';

    const serializedMd = td.turndown(oldBase64Html);

    expect(serializedMd).toContain("![[attachments/Voice Note - 2026-09-11 20_49.webm]]");
    expect(serializedMd).not.toContain("data:audio/webm;base64");
  });

  it("should correctly distinguish between video webm and voice note audio webm in Markdown parsing", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("attachments/clip.webm", "blob:http://localhost/video-blob");
    assetMap.set("attachments/Voice Note - 2026-09-11 20_49.webm", "blob:http://localhost/audio-blob");

    const md = `
# Media Note
![[attachments/clip.webm|640]]
![[attachments/Voice Note - 2026-09-11 20_49.webm]]
`;

    const html = renderMarkdownToEditorHtml(md, { assetBlobUrlMap: assetMap });

    expect(html).toContain("<video");
    expect(html).toContain('data-relative-src="attachments/clip.webm"');

    expect(html).toContain("<audio");
    expect(decodeURIComponent(html)).toContain('data-relative-src="attachments/Voice Note - 2026-09-11 20_49.webm"');
  });
});
