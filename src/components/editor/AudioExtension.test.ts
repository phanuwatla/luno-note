import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { AudioExtension } from "./AudioExtension";

describe("AudioExtension", () => {
  it("should initialize and insert audio node", () => {
    const editor = new Editor({
      extensions: [StarterKit, AudioExtension],
      content: "<p>Hello</p>",
    });

    editor.chain().focus().setAudio({ src: "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwE=", title: "Test Audio" }).run();

    const html = editor.getHTML();
    expect(html).toContain("<audio");
    expect(html).toContain("data:audio/webm;base64");
    expect(html).toContain("data-title=\"Test Audio\"");
  });

  it("should parse audio html tag correctly", () => {
    const editor = new Editor({
      extensions: [StarterKit, AudioExtension],
      content: '<p>Note</p><audio controls src="data:audio/webm;base64,12345" data-title="Voice Clip"></audio>',
    });

    const json = editor.getJSON();
    const audioNode = json.content?.find((node) => node.type === "audio");
    expect(audioNode).toBeDefined();
    expect(audioNode?.attrs?.src).toBe("data:audio/webm;base64,12345");
    expect(audioNode?.attrs?.title).toBe("Voice Clip");
  });
});
