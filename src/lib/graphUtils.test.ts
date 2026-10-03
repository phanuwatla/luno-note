import { describe, it, expect } from "vitest";
import { extractNoteLinks, resolveLinkedNoteId, buildNoteGraph, wrapNodeText, getNodeBaseRadius, extractNoteImageLinks } from "./graphUtils";
import type { Note } from "@/hooks/useNotes";

describe("graphUtils", () => {
  it("extracts wikilinks with and without aliases", () => {
    const content = `
# Sample Note
Here is a link to [[Second Note]] and another to [[Third Note|Custom Alias]].
Also an HTML link <a href="wikilink:Fourth%20Note" data-wikilink="Fourth Note">Fourth</a>.
And markdown link [Fifth Note](Fifth%20Note.md).
`;
    const links = extractNoteLinks(content);
    expect(links).toContain("Second Note");
    expect(links).toContain("Third Note");
    expect(links).toContain("Fourth Note");
    expect(links).toContain("Fifth%20Note.md");
  });

  it("resolves note links accurately by title or fileName", () => {
    const mockNotes: Note[] = [
      { id: "1", title: "Welcome to Luno", fileName: "Welcome to Luno.md", content: "", createdAt: 0, updatedAt: 0 },
      { id: "2", title: "Markdown Rendering Test", fileName: "Markdown Rendering Test.md", content: "", createdAt: 0, updatedAt: 0 },
      { id: "3", title: "Deep Note", fileName: "Deep Note.md", folderPath: "subfolder", content: "", createdAt: 0, updatedAt: 0 },
    ];

    expect(resolveLinkedNoteId("Welcome to Luno", mockNotes)).toBe("1");
    expect(resolveLinkedNoteId("welcome to luno.md", mockNotes)).toBe("1");
    expect(resolveLinkedNoteId("Markdown Rendering Test", mockNotes)).toBe("2");
    expect(resolveLinkedNoteId("subfolder/deep note", mockNotes)).toBe("3");
    expect(resolveLinkedNoteId("Non Existent", mockNotes)).toBeNull();
  });

  it("builds graph with nodes and connected edges matching user Obsidian graph concept", () => {
    const mockNotes: Note[] = [
      {
        id: "note-1",
        title: "Welcome to Luno",
        fileName: "Welcome to Luno.md",
        content: "Links to [[Markdown Rendering Test]] and [[Test Graph]].",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "note-2",
        title: "Markdown Rendering Test",
        fileName: "Markdown Rendering Test.md",
        content: "Links back to [[Test Graph]].",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "note-3",
        title: "Test Graph",
        fileName: "Test Graph.md",
        content: "Central node connecting to [[Welcome to Luno]].",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "note-4",
        title: "Orphan Note",
        fileName: "Orphan Note.md",
        content: "No links here.",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const graph = buildNoteGraph(mockNotes);
    expect(graph.nodes).toHaveLength(4);
    // note-1 <-> note-2, note-1 <-> note-3, note-2 <-> note-3
    expect(graph.edges).toHaveLength(3);

    const n1 = graph.nodes.find((n) => n.id === "note-1");
    const n2 = graph.nodes.find((n) => n.id === "note-2");
    const n3 = graph.nodes.find((n) => n.id === "note-3");
    const orphan = graph.nodes.find((n) => n.id === "note-4");

    expect(n1?.degree).toBe(2);
    expect(n2?.degree).toBe(2);
    expect(n3?.degree).toBe(2);
    expect(orphan?.degree).toBe(0);
  });

  it("only includes markdown (.md/.markdown) notes in the graph", () => {
    const mixedNotes: Note[] = [
      { id: "1", title: "Valid Note", fileName: "Valid Note.md", content: "", createdAt: 0, updatedAt: 0 },
      { id: "2", title: "Text File", fileName: "note.txt", content: "", createdAt: 0, updatedAt: 0 },
      { id: "3", title: "Untitled", fileName: undefined, content: "", createdAt: 0, updatedAt: 0 },
      { id: "4", title: "Image", fileName: "photo.png", fileType: "image", content: "", createdAt: 0, updatedAt: 0 },
      { id: "5", title: "Another MD", fileName: "Another MD.markdown", content: "", createdAt: 0, updatedAt: 0 },
    ];

    const graph = buildNoteGraph(mixedNotes);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.map((n) => n.id)).toEqual(["1", "5"]);
  });

  it("wraps short labels in 1 line without truncation", () => {
    // 1 char = 10px width
    const measure = (s: string) => s.length * 10;
    const lines = wrapNodeText(measure, "Short Title", 200, 2);
    expect(lines).toEqual(["Short Title"]);
  });

  it("wraps longer labels to 2 lines without truncation if it fits", () => {
    const measure = (s: string) => s.length * 10;
    // "First Line Here" (15 chars = 150px <= 160px), "Second Line Here" (16 chars = 160px <= 160px)
    const lines = wrapNodeText(measure, "First Line Here Second Line Here", 160, 2);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("First Line Here");
    expect(lines[1]).toBe("Second Line Here");
    expect(lines[1].endsWith("...")).toBe(false);
  });

  it("truncates with ... on the second line if text exceeds 2 lines", () => {
    const measure = (s: string) => s.length * 10;
    // 60 chars total, maxWidth 150px (15 chars per line). 2 lines max -> 30 chars.
    const lines = wrapNodeText(measure, "Line One Is Here And Line Two Is Here And Line Three Exceeds", 150, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("...")).toBe(true);
    // Make sure total line 2 length including ... fits within maxWidth
    expect(measure(lines[1])).toBeLessThanOrEqual(150);
  });

  describe("getNodeBaseRadius", () => {
    it("returns base radius of 3.12 (20% increased from 2.6) for 0 or negative degree", () => {
      expect(getNodeBaseRadius(0)).toBeCloseTo(3.12, 2);
      expect(getNodeBaseRadius(-1)).toBeCloseTo(3.12, 2);
    });

    it("scales radius proportionally with higher degrees", () => {
      const r1 = getNodeBaseRadius(1);
      const r2 = getNodeBaseRadius(4);
      const r3 = getNodeBaseRadius(9);

      expect(r1).toBeGreaterThan(3.12);
      expect(r2).toBeGreaterThan(r1);
      expect(r3).toBeGreaterThan(r2);
    });

    it("caps max radius at 9.0 (20% increased from 7.5)", () => {
      expect(getNodeBaseRadius(100)).toBe(9.0);
    });
  });

  describe("image nodes in graph", () => {
    it("extracts inserted images and connects them as image nodes to the note", () => {
      const mockNotes: Note[] = [
        {
          id: "note-1",
          title: "Architecture Review",
          fileName: "review.md",
          content: "Here is the diagram: ![System Diagram](attachments/diagram.png) and a logo ![[logo.jpg|200]]. Also <img src=\"photo.webp\" alt=\"Photo\" />.",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "img-workspace-1",
          title: "diagram.png",
          fileName: "diagram.png",
          folderPath: "attachments",
          fileType: "image",
          content: "data:image/png;base64,...",
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      // Note-1 + 3 images (diagram.png, logo.jpg, photo.webp)
      const noteNodes = graph.nodes.filter((n) => n.nodeType !== "image");
      const imageNodes = graph.nodes.filter((n) => n.nodeType === "image");

      expect(noteNodes).toHaveLength(1);
      expect(imageNodes).toHaveLength(3);

      const diagramNode = imageNodes.find((n) => n.id === "img-workspace-1" || n.label.includes("diagram.png"));
      expect(diagramNode).toBeDefined();
      expect(diagramNode?.nodeType).toBe("image");
      expect(diagramNode?.connectionIds.has("note-1")).toBe(true);

      const noteNode = noteNodes[0];
      expect(noteNode.degree).toBe(3);
    });

    it("connects multiple notes to the same shared image node", () => {
      const mockNotes: Note[] = [
        {
          id: "note-a",
          title: "Note A",
          fileName: "Note A.md",
          content: "Check out this image: ![[shared-asset.png]]",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "note-b",
          title: "Note B",
          fileName: "Note B.md",
          content: "Same image used here: ![Shared](shared-asset.png)",
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      const imageNodes = graph.nodes.filter((n) => n.nodeType === "image");
      expect(imageNodes).toHaveLength(1);

      const sharedImg = imageNodes[0];
      expect(sharedImg.label).toBe("shared-asset.png");
      expect(sharedImg.degree).toBe(2);
      expect(sharedImg.connectionIds.has("note-a")).toBe(true);
      expect(sharedImg.connectionIds.has("note-b")).toBe(true);
    });

    it("deduces folderPath as 'attachments' or 'attachment' for images in attachment folders", () => {
      const mockNotes: Note[] = [
        {
          id: "note-sub",
          title: "Sub Note",
          fileName: "Sub Note.md",
          folderPath: "Chapter 1/Script",
          content: "![diagram](../../attachments/flow.png) and ![pic](/attachment/hero.jpg) and ![inline](attachments/inline.png)",
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      const flowNode = graph.nodes.find((n) => n.label === "flow.png");
      const heroNode = graph.nodes.find((n) => n.label === "hero.jpg");
      const inlineNode = graph.nodes.find((n) => n.label === "inline.png");

      expect(flowNode).toBeDefined();
      expect(flowNode?.folderPath).toBe("attachments");

      expect(heroNode).toBeDefined();
      expect(heroNode?.folderPath).toBe("attachment");

      expect(inlineNode).toBeDefined();
      expect(inlineNode?.folderPath).toBe("attachments");
    });

    it("extracts QR code image links with data-relative-src or data-qr-code and sets proper filename and folderPath", () => {
      const mockNotes: Note[] = [
        {
          id: "note-qr",
          title: "Note With QR",
          fileName: "Note With QR.md",
          content: '<p>QR Code below:</p><img src="blob:http://localhost/temp-blob" alt="QR Code" width="220" data-relative-src="attachments/qrcode_comsan_choice_123456.png" data-qr-code="true" data-qr-text="comsan-choice.vercel.app" /><p>End</p>',
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      const qrNode = graph.nodes.find((n) => n.nodeType === "image");
      expect(qrNode).toBeDefined();
      expect(qrNode?.label).toBe("qrcode_comsan_choice_123456.png");
      expect(qrNode?.title).toBe("qrcode_comsan_choice_123456.png");
      expect(qrNode?.folderPath).toBe("attachments");
      expect(qrNode?.imageSrc).toBe("attachments/qrcode_comsan_choice_123456.png");
    });

    it("prefers data-relative-src when src is a blob or data URL in extractNoteImageLinks", () => {
      const html = '<img src="blob:http://localhost/abc" alt="QR Code" data-relative-src="attachment/qrcode_test.png" data-qr-code="true" />';
      const extracted = extractNoteImageLinks(html);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].src).toBe("attachment/qrcode_test.png");
      expect(extracted[0].alt).toBe("QR Code");
    });
  });

  describe("video and audio media nodes in graph", () => {
    it("extracts inserted video and audio files and connects them as video/audio nodes", () => {
      const mockNotes: Note[] = [
        {
          id: "note-multimedia",
          title: "Multimedia Study",
          fileName: "study.md",
          content: `
# Multimedia Lecture
Watch video: ![[attachments/lecture.mp4|640]]
Listen to clip: ![[attachments/recording.mp3]]
HTML Video: <video src="media/presentation.webm" data-title="Presentation"></video>
HTML Audio: <audio src="audio/voice_memo.wav" data-title="Voice Memo"></audio>
Embedded document: ![[attachments/handout.pdf]]
          `,
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      const noteNodes = graph.nodes.filter((n) => n.nodeType === "note");
      const videoNodes = graph.nodes.filter((n) => n.nodeType === "video");
      const audioNodes = graph.nodes.filter((n) => n.nodeType === "audio");
      const fileNodes = graph.nodes.filter((n) => n.nodeType === "file");

      expect(noteNodes).toHaveLength(1);
      expect(videoNodes).toHaveLength(2); // lecture.mp4, presentation.webm
      expect(audioNodes).toHaveLength(2); // recording.mp3, voice_memo.wav
      expect(fileNodes).toHaveLength(1);  // handout.pdf

      const lectureNode = graph.nodes.find((n) => n.label === "lecture.mp4");
      expect(lectureNode).toBeDefined();
      expect(lectureNode?.nodeType).toBe("video");
      expect(lectureNode?.folderPath).toBe("attachments");
      expect(lectureNode?.connectionIds.has("note-multimedia")).toBe(true);

      const mp3Node = graph.nodes.find((n) => n.label === "recording.mp3");
      expect(mp3Node).toBeDefined();
      expect(mp3Node?.nodeType).toBe("audio");
      expect(mp3Node?.folderPath).toBe("attachments");
      expect(mp3Node?.connectionIds.has("note-multimedia")).toBe(true);

      const pdfNode = graph.nodes.find((n) => n.label === "handout.pdf");
      expect(pdfNode).toBeDefined();
      expect(pdfNode?.nodeType).toBe("file");
      expect(pdfNode?.connectionIds.has("note-multimedia")).toBe(true);

      const noteNode = noteNodes[0];
      // Connected to 2 videos + 2 audios + 1 pdf = 5 connections
      expect(noteNode.degree).toBe(5);
    });

    it("connects multiple notes to the same shared video and audio node", () => {
      const mockNotes: Note[] = [
        {
          id: "note-x",
          title: "Note X",
          fileName: "Note X.md",
          content: "Watch clip: ![[attachments/shared-video.mp4]] and listen: ![[shared-audio.mp3]]",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "note-y",
          title: "Note Y",
          fileName: "Note Y.md",
          content: "Reference video: <video src=\"attachments/shared-video.mp4\"></video> and [listen](shared-audio.mp3)",
          createdAt: 0,
          updatedAt: 0,
        },
      ];

      const graph = buildNoteGraph(mockNotes);
      const sharedVideo = graph.nodes.find((n) => n.label === "shared-video.mp4");
      const sharedAudio = graph.nodes.find((n) => n.label === "shared-audio.mp3");

      expect(sharedVideo).toBeDefined();
      expect(sharedVideo?.nodeType).toBe("video");
      expect(sharedVideo?.degree).toBe(2);
      expect(sharedVideo?.connectionIds.has("note-x")).toBe(true);
      expect(sharedVideo?.connectionIds.has("note-y")).toBe(true);

      expect(sharedAudio).toBeDefined();
      expect(sharedAudio?.nodeType).toBe("audio");
      expect(sharedAudio?.degree).toBe(2);
      expect(sharedAudio?.connectionIds.has("note-x")).toBe(true);
      expect(sharedAudio?.connectionIds.has("note-y")).toBe(true);
    });
  });
});

