import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { VideoExtension } from "./VideoExtension";
import { getFileCategory } from "@/lib/fileIconUtils";
import { createTurndownService, renderMarkdownToEditorHtml } from "@/components/Editor";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

describe("VideoExtension", () => {
  it("should initialize and insert video node with attributes", () => {
    const editor = new Editor({
      extensions: [StarterKit, VideoExtension],
      content: "<p>Hello</p>",
    });

    editor
      .chain()
      .focus()
      .setVideo({
        src: "https://example.com/demo.mp4",
        width: 640,
        textAlign: "center",
      })
      .run();

    const html = editor.getHTML();
    expect(html).toContain("<video");
    expect(html).toContain('src="https://example.com/demo.mp4"');
    expect(html).toContain('width="640"');
    expect(html).toContain("text-align: center");
  });

  it("should parse video html tag correctly", () => {
    const editor = new Editor({
      extensions: [StarterKit, VideoExtension],
      content:
        '<p>Video note</p><video src="assets/clip.webm" width="480" controls="true" data-relative-src="assets/clip.webm"></video>',
    });

    const json = editor.getJSON();
    const videoNode = json.content?.find((node) => node.type === "video");
    expect(videoNode).toBeDefined();
    expect(videoNode?.attrs?.src).toBe("assets/clip.webm");
    expect(videoNode?.attrs?.width).toBe(480);
    expect(videoNode?.attrs?.["data-relative-src"]).toBe("assets/clip.webm");
  });

  it("should correctly identify video file categories", () => {
    expect(getFileCategory({ fileName: "movie.mp4" })).toBe("video");
    expect(getFileCategory({ fileName: "screencast.mov" })).toBe("video");
    expect(getFileCategory({ fileName: "recording.mkv" })).toBe("video");
    expect(getFileCategory({ fileName: "clip.avi" })).toBe("video");
  });

  it("should serialize video tag to Markdown as Obsidian Wikilink embed preserving relative path and width", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("attachments/demo.mp4", "blob:http://localhost/mock-video");

    const td = createTurndownService(assetMap);

    const initialHtml =
      '<p>Intro text</p><video src="blob:http://localhost/mock-video" width="640" data-relative-src="attachments/demo.mp4" data-text-align="center" title="Tutorial Video"></video><p>Outro text</p>';

    const serializedMd = td.turndown(initialHtml);

    // Verify Turndown serializes as Obsidian Wikilink embed
    expect(serializedMd).toContain("![[attachments/demo.mp4|640]]");

    // Verify roundtrip through renderMarkdownToEditorHtml
    const reloadedHtml = renderMarkdownToEditorHtml(serializedMd, { assetBlobUrlMap: assetMap });
    expect(reloadedHtml).toContain("<video");
    expect(reloadedHtml).toContain('data-relative-src="attachments/demo.mp4"');
    expect(reloadedHtml).toContain('src="blob:http://localhost/mock-video"');
    expect(reloadedHtml).toContain('width="640"');
  });

  it("should parse Obsidian-style media embeds for images, audio, and videos", () => {
    const assetMap = new Map<string, string>();
    assetMap.set("assets/photo.png", "blob:http://localhost/mock-img");
    assetMap.set("assets/song.mp3", "blob:http://localhost/mock-audio");
    assetMap.set("assets/clip.webm", "blob:http://localhost/mock-webm");

    const obsidianMd = `
# Media Note
![[assets/photo.png|300]]
![[assets/song.mp3]]
![[assets/clip.webm|800]]
`;

    const html = renderMarkdownToEditorHtml(obsidianMd, { assetBlobUrlMap: assetMap });

    // Verify image
    expect(html).toContain("<img");
    expect(html).toContain('src="blob:http://localhost/mock-img"');
    expect(html).toContain('data-relative-src="assets/photo.png"');
    expect(html).toContain('width="300"');

    // Verify audio
    expect(html).toContain("<audio");
    expect(html).toContain('src="blob:http://localhost/mock-audio"');
    expect(html).toContain('data-relative-src="assets/song.mp3"');

    // Verify video
    expect(html).toContain("<video");
    expect(html).toContain('src="blob:http://localhost/mock-webm"');
    expect(html).toContain('data-relative-src="assets/clip.webm"');
    expect(html).toContain('width="800"');

    // Verify Turndown roundtrip serialization for all Obsidian embeds
    const td = createTurndownService(assetMap);
    const serialized = td.turndown(html);
    expect(serialized).toContain("![[assets/photo.png|300]]");
    expect(serialized).toContain("![[assets/song.mp3]]");
    expect(serialized).toContain("![[assets/clip.webm|800]]");
  });

  it("should preserve video tags and data:video/mp4 URIs through sanitizeHtml", () => {
    const dirtyHtml =
      '<video src="data:video/mp4;base64,AAAA" width="480" data-relative-src="test.mp4" data-text-align="right" title="Clip" onclick="alert(1)"></video>';

    const cleanHtml = sanitizeHtml(dirtyHtml);
    expect(cleanHtml).toContain("<video");
    expect(cleanHtml).toContain('src="data:video/mp4;base64,AAAA"');
    expect(cleanHtml).toContain('width="480"');
    expect(cleanHtml).toContain('data-relative-src="test.mp4"');
    expect(cleanHtml).toContain('data-text-align="right"');
    expect(cleanHtml).toContain('title="Clip"');
    expect(cleanHtml).not.toContain("onclick");
    expect(cleanHtml).not.toContain("alert");
  });

  it("should correctly store and retrieve video dimensions in videoPipStore for PiP placeholder", async () => {
    const { videoPipStore } = await import("@/lib/videoPipStore");
    videoPipStore.set({
      id: "note1_clip.mp4",
      src: "clip.mp4",
      title: "Sample Clip",
      currentTime: 10,
      duration: 60,
      isPlaying: true,
      videoWidth: 1920,
      videoHeight: 1080,
      containerWidth: 640,
    });

    const pip = videoPipStore.get();
    expect(pip).not.toBeNull();
    expect(pip?.videoWidth).toBe(1920);
    expect(pip?.videoHeight).toBe(1080);
    expect(pip?.containerWidth).toBe(640);
    expect(pip?.videoWidth! / pip?.videoHeight!).toBeCloseTo(16 / 9);

    videoPipStore.close();
    expect(videoPipStore.get()).toBeNull();
  });
});

