import { describe, it, expect } from "vitest";
import { extractNoteLinks, resolveLinkedNoteId, buildNoteGraph, wrapNodeText, getNodeBaseRadius } from "./graphUtils";
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
    it("returns base radius of 2.6 for 0 or negative degree", () => {
      expect(getNodeBaseRadius(0)).toBe(2.6);
      expect(getNodeBaseRadius(-1)).toBe(2.6);
    });

    it("scales radius proportionally with higher degrees", () => {
      const r1 = getNodeBaseRadius(1);
      const r2 = getNodeBaseRadius(4);
      const r3 = getNodeBaseRadius(9);

      expect(r1).toBeGreaterThan(2.6);
      expect(r2).toBeGreaterThan(r1);
      expect(r3).toBeGreaterThan(r2);
    });

    it("caps max radius at 7.5", () => {
      expect(getNodeBaseRadius(100)).toBe(7.5);
    });
  });
});

