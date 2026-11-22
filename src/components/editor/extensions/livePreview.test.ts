import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Schema } from "@tiptap/pm/model";
import { EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state";
import { history } from "@tiptap/pm/history";
import {
  LivePreview,
  livePreviewPluginKey,
  isPosInDocumentTitleH1,
  serializeBlockToRawMarkdown,
  serializeMediaNodeToRawMarkdown,
  parseRawMarkdownToMediaNode,
  isExpandableMediaNode,
  buildLivePreviewDecorations,
  livePreviewUndo,
  livePreviewRedo,
  livePreviewUndoDepth,
  livePreviewRedoDepth,
} from "./livePreview";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/hooks/useAppSettings";

const testSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      attrs: {
        textAlign: { default: "left" },
        id: { default: null },
        "data-footnote-def": { default: null },
      },
      toDOM: (node) => ["p", node.attrs, 0],
    },
    heading: {
      group: "block",
      content: "inline*",
      attrs: {
        level: { default: 1 },
        textAlign: { default: "left" },
      },
      toDOM: (node) => [`h${node.attrs.level}`, 0],
    },
    blockquote: {
      group: "block",
      content: "block+",
      toDOM: () => ["blockquote", 0],
    },
    bulletList: {
      group: "block",
      content: "listItem+",
      toDOM: () => ["ul", 0],
    },
    orderedList: {
      group: "block",
      content: "listItem+",
      attrs: { start: { default: 1 } },
      toDOM: () => ["ol", 0],
    },
    listItem: {
      content: "paragraph block*",
      toDOM: () => ["li", 0],
    },
    taskList: {
      group: "block",
      content: "taskItem+",
      toDOM: () => ["ul", { "data-type": "taskList" }, 0],
    },
    taskItem: {
      content: "paragraph block*",
      attrs: { checked: { default: false } },
      toDOM: (node) => ["li", { "data-type": "taskItem", "data-checked": String(node.attrs.checked) }, 0],
    },
    horizontalRule: {
      group: "block",
      toDOM: () => ["hr"],
    },
    image: {
      group: "block",
      atom: true,
      attrs: {
        src: { default: null },
        alt: { default: null },
        title: { default: null },
        width: { default: null },
        textAlign: { default: null },
        "data-relative-src": { default: null },
        "data-wikilink-embed": { default: null },
        "data-qr-code": { default: null },
      },
      toDOM: (node) => ["img", node.attrs],
    },
    video: {
      group: "block",
      atom: true,
      attrs: {
        src: { default: null },
        title: { default: null },
        width: { default: null },
        textAlign: { default: null },
        "data-relative-src": { default: null },
      },
      toDOM: (node) => ["video", node.attrs],
    },
    audio: {
      group: "block",
      atom: true,
      attrs: {
        src: { default: null },
        title: { default: null },
        "data-relative-src": { default: null },
      },
      toDOM: (node) => ["audio", node.attrs],
    },
    text: { group: "inline" },
  },
  marks: {
    bold: {
      toDOM: () => ["strong", 0],
    },
    italic: {
      toDOM: () => ["em", 0],
    },
    strike: {
      toDOM: () => ["s", 0],
    },
    code: {
      toDOM: () => ["code", 0],
    },
    highlight: {
      toDOM: () => ["mark", { class: "luno-highlight" }, 0],
    },
    underline: {
      toDOM: () => ["u", 0],
    },
    superscript: {
      toDOM: () => ["sup", 0],
    },
    subscript: {
      toDOM: () => ["sub", 0],
    },
    kbd: {
      toDOM: () => ["kbd", 0],
    },
    textColor: {
      attrs: { color: { default: null } },
      toDOM: (mark) => ["span", { style: `color: ${mark.attrs.color}` }, 0],
    },
    fontFamily: {
      attrs: { fontFamily: { default: null } },
      toDOM: (mark) => ["span", { style: `font-family: ${mark.attrs.fontFamily}` }, 0],
    },
    fontSize: {
      attrs: { fontSize: { default: null } },
      toDOM: (mark) => ["span", { style: `font-size: ${mark.attrs.fontSize}` }, 0],
    },
    link: {
      attrs: {
        href: { default: "" },
        id: { default: null },
        class: { default: null },
        "data-wikilink": { default: null },
        "data-footnote-ref": { default: null },
        "data-footnote-backref": { default: null },
      },
      toDOM: (mark) => ["a", mark.attrs, 0],
    },
  },
});

function createLivePreviewPlugin(enabled: boolean | (() => boolean) = true, hasTitleH1: boolean = false) {
  const plugins = LivePreview.configure({ enabled, hasTitleH1 }).config.addProseMirrorPlugins?.call({
    options: { enabled, hasTitleH1 },
  } as any);
  return plugins![0];
}

function collectDecorationClasses(state: EditorState): Array<{ from: number; to: number; className: string }> {
  const decos = livePreviewPluginKey.getState(state)?.decorations;
  if (!decos) return [];
  return (decos.find(0, state.doc.content.size) as any[]).map((d) => ({
    from: d.from,
    to: d.to,
    className: String(d.type?.attrs?.class || ""),
  }));
}

describe("Edit Mode Obsidian-Style Live Preview", () => {
  it("has readingModeLivePreview disabled (false) by default in settings", () => {
    expect(DEFAULT_SETTINGS.readingModeLivePreview).toBe(false);

    const normalizedEmpty = normalizeSettings({});
    expect(normalizedEmpty.readingModeLivePreview).toBe(false);

    const normalizedTrue = normalizeSettings({ readingModeLivePreview: true });
    expect(normalizedTrue.readingModeLivePreview).toBe(true);

    const normalizedFalse = normalizeSettings({ readingModeLivePreview: false });
    expect(normalizedFalse.readingModeLivePreview).toBe(false);

    // Supports livePreviewInReadingMode alias
    const normalizedAlias = normalizeSettings({ livePreviewInReadingMode: true } as any);
    expect(normalizedAlias.readingModeLivePreview).toBe(true);
  });

  it("does not reveal raw markdown syntax when LivePreview is disabled", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Normal line")),
    ]);

    const plugin = createLivePreviewPlugin(false);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // Move selection into Heading 2
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(0).textContent).toBe("Heading 2");
    expect(livePreviewPluginKey.getState(state)?.activeBlock).toBeNull();
  });

  it("reveals ## Heading 2 with syntax color on focus and hides ## when moving focus away", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Paragraph below")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // 1. Focus inside Heading 2 (offset 4 in "Heading 2", right after "Head")
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 4)));

    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(2);
    expect(state.doc.child(0).textContent).toBe("## Heading 2");
    expect(state.selection.from).toBe(8);

    // Verify Obsidian muted gray syntax marker on "## " (NOT colored code highlight)
    const decos = collectDecorationClasses(state);
    expect(decos.some((d) => d.from === 1 && d.to === 4 && d.className === "luno-live-syntax-marker")).toBe(true);
    expect(decos.some((d) => d.from === 1 && d.to === 4 && d.className.includes("luno-live-hl-"))).toBe(false);

    // 2. Move focus to the paragraph below without editing Heading 2
    const paraStart = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, paraStart)));

    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(2);
    expect(state.doc.child(0).textContent).toBe("Heading 2");
  });

  it("allows editing ## Heading 2 to ### Heading 3 or deleting ## to turn it into a paragraph", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Second line")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    expect(state.doc.child(0).textContent).toBe("## Heading 2");

    state = state.apply(
      state.tr.insertText("### Heading 3 Updated", 1, 1 + state.doc.child(0).content.size)
    );
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(3);
    expect(state.doc.child(0).textContent).toBe("### Heading 3 Updated");

    const secondLinePos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, secondLinePos)));
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(3);
    expect(state.doc.child(0).textContent).toBe("Heading 3 Updated");

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    expect(state.doc.child(0).textContent).toBe("### Heading 3 Updated");

    state = state.apply(
      state.tr.insertText("Plain paragraph now", 1, 1 + state.doc.child(0).content.size)
    );
    expect(state.doc.child(0).type.name).toBe("paragraph");

    state = state.apply(state.tr.setMeta(livePreviewPluginKey, { blur: true }));
    expect(state.doc.child(0).type.name).toBe("paragraph");
    expect(state.doc.child(0).textContent).toBe("Plain paragraph now");
  });

  it("reveals inline formatting per-element on cursor touch (**bold**, *italic*, ==highlight==, [[wikilink]]) and compiles newly typed syntax", () => {
    const pWithFormatting = testSchema.nodes.paragraph.create({}, [
      testSchema.text("Hello "),
      testSchema.text("bold", [testSchema.marks.bold.create()]),
      testSchema.text(" and "),
      testSchema.text("italic", [testSchema.marks.italic.create()]),
      testSchema.text(" plus "),
      testSchema.text("marked", [testSchema.marks.highlight.create()]),
      testSchema.text(" and "),
      testSchema.text("Note B", [
        testSchema.marks.link.create({
          href: "wikilink:Note%20A",
          "data-wikilink": "Note A",
        }),
      ]),
    ]);
    const p2 = testSchema.nodes.paragraph.create({}, testSchema.text("Other line"));
    const doc = testSchema.nodes.doc.create({}, [pWithFormatting, p2]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // 1. Clicking plain text ("Hello ") keeps ALL inline elements rendered (no whole-line expansion)
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(0).textContent).toBe("Hello bold and italic plus marked and Note B");

    // 2. Move cursor onto "bold" -> reveals ONLY "**bold**" while keeping italic/highlight/wikilink rendered
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 8)));
    expect(state.doc.child(0).textContent).toBe("Hello **bold** and italic plus marked and Note B");

    // 3. Move cursor onto "italic" -> collapses "**bold**" and reveals ONLY "*italic*"
    const italicIdx = state.doc.child(0).textContent.indexOf("italic");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + italicIdx + 2)));
    expect(state.doc.child(0).textContent).toBe("Hello bold and *italic* plus marked and Note B");

    // 4. Move cursor onto "marked" -> collapses "*italic*" and reveals ONLY "==marked=="
    const markedIdx = state.doc.child(0).textContent.indexOf("marked");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + markedIdx + 2)));
    expect(state.doc.child(0).textContent).toBe("Hello bold and italic plus ==marked== and Note B");

    // 5. Move cursor onto "Note B" -> collapses "==marked==" and reveals ONLY "[[Note A|Note B]]"
    const noteIdx = state.doc.child(0).textContent.indexOf("Note B");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + noteIdx + 2)));
    expect(state.doc.child(0).textContent).toBe(
      "Hello bold and italic plus marked and [[Note A|Note B]]"
    );

    // 6. Replace line with raw markdown -> compiles all inline formats cleanly on leaving the line
    const newRaw = "Edited **strong** with ~~deleted~~ and `const x = 1` and [Docs](https://example.com)";
    state = state.apply(
      state.tr.insertText(newRaw, 1, 1 + state.doc.child(0).content.size)
    );

    const p2Pos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, p2Pos)));

    const collapsedP = state.doc.child(0);
    expect(collapsedP.textContent).toBe("Edited strong with deleted and const x = 1 and Docs");

    const serializedAgain = serializeBlockToRawMarkdown(state.doc, 0, collapsedP);
    expect(serializedAgain.rawMarkdown).toBe(newRaw);
  });

  it("does NOT convert list markers (- , 1. , - [ ] ) to raw text when focusing bullet, ordered, or task lists (like Obsidian)", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.bulletList.create({}, [
        testSchema.nodes.listItem.create(
          {},
          testSchema.nodes.paragraph.create({}, [
            testSchema.text("Bullet with "),
            testSchema.text("bold", [testSchema.marks.bold.create()]),
          ])
        ),
      ]),
      testSchema.nodes.orderedList.create({}, [
        testSchema.nodes.listItem.create(
          {},
          testSchema.nodes.paragraph.create({}, testSchema.text("Ordered item"))
        ),
      ]),
      testSchema.nodes.taskList.create({}, [
        testSchema.nodes.taskItem.create(
          { checked: false },
          testSchema.nodes.paragraph.create({}, testSchema.text("Buy milk"))
        ),
      ]),
      testSchema.nodes.paragraph.create({}, testSchema.text("Outside line")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // 1. Focus plain text inside bulletList item -> NO "- " prefix and "bold" stays rendered until touched
    let bulletPos = -1;
    let orderedPos = -1;
    let taskPos = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph" && node.textContent.startsWith("Bullet")) bulletPos = pos + 1;
      if (node.type.name === "paragraph" && node.textContent === "Ordered item") orderedPos = pos + 1;
      if (node.type.name === "paragraph" && node.textContent === "Buy milk") taskPos = pos + 1;
    });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, bulletPos)));
    expect(state.doc.child(0).firstChild!.firstChild!.textContent).toBe("Bullet with bold");
    // Move cursor onto "bold" inside bulletList item -> reveals ONLY "**bold**" (still NO "- " prefix)
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, bulletPos + 14)));
    expect(state.doc.child(0).firstChild!.firstChild!.textContent).toBe("Bullet with **bold**");
    // Must NOT hide the native list marker via .luno-live-active-list-item
    const bulletDecos = collectDecorationClasses(state);
    expect(bulletDecos.some((d) => d.className.includes("luno-live-active-list-item"))).toBe(false);

    // 2. Focus inside orderedList item -> NO "1. " prefix
    state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph" && node.textContent === "Ordered item") orderedPos = pos + 1;
    });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, orderedPos)));
    expect(state.doc.child(1).firstChild!.firstChild!.textContent).toBe("Ordered item");
    // Previous bulletList item collapsed cleanly back to rich text ("Bullet with bold") inside bulletList
    expect(state.doc.child(0).type.name).toBe("bulletList");
    expect(state.doc.child(0).firstChild!.firstChild!.textContent).toBe("Bullet with bold");

    // 3. Focus inside taskList item -> NO "- [ ] " prefix, editing inline markdown stays inside taskItem
    state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph" && node.textContent === "Buy milk") taskPos = pos + 1;
    });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, taskPos)));
    const activeTask = livePreviewPluginKey.getState(state)!.activeBlock!;
    expect(state.doc.nodeAt(activeTask.blockPos)!.textContent).toBe("Buy milk");

    state = state.apply(
      state.tr.insertText("Buy **organic** milk", activeTask.blockPos + 1, activeTask.blockPos + 1 + 8)
    );
    state = state.apply(state.tr.setMeta(livePreviewPluginKey, { blur: true }));
    expect(state.doc.child(2).type.name).toBe("taskList");
    expect(state.doc.child(2).firstChild!.attrs.checked).toBe(false);
    expect(state.doc.child(2).firstChild!.firstChild!.textContent).toBe("Buy organic milk");
  });

  it("still reveals and edits blockquotes (> )", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.blockquote.create(
        {},
        testSchema.nodes.paragraph.create({}, testSchema.text("Wise quote"))
      ),
      testSchema.nodes.paragraph.create({}, testSchema.text("Plain line")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(0).firstChild?.textContent).toBe("> Wise quote");

    const decos = collectDecorationClasses(state);
    expect(decos.some((d) => d.className === "luno-live-syntax-marker")).toBe(true);
    expect(decos.some((d) => d.className.includes("luno-live-hl-"))).toBe(false);

    // Move focus to Plain line -> blockquote collapses back to "Wise quote"
    const plainPos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, plainPos)));
    expect(state.doc.child(0).firstChild?.textContent).toBe("Wise quote");
  });

  it("reveals and edits attachments (image, video, audio) like Obsidian Live Preview", () => {
    const imgNode = testSchema.nodes.image.create({
      src: "blob:http://localhost/photo-blob",
      "data-relative-src": "attachments/photo.png",
      "data-wikilink-embed": "true",
      alt: "photo.png",
      width: 400,
    });
    const vidNode = testSchema.nodes.video.create({
      src: "blob:http://localhost/video-blob",
      "data-relative-src": "attachments/demo.mp4",
      title: "demo.mp4",
      width: 640,
    });
    const audNode = testSchema.nodes.audio.create({
      src: "blob:http://localhost/audio-blob",
      "data-relative-src": "attachments/voice_note.webm",
      title: "voice_note.webm",
    });
    const qrNode = testSchema.nodes.image.create({
      src: "data:image/png;base64,AAAA",
      "data-relative-src": "attachments/qrcode.png",
      "data-qr-code": "true",
      alt: "QR Code",
      width: 200,
    });
    const pBelow = testSchema.nodes.paragraph.create({}, testSchema.text("Footer"));

    const doc = testSchema.nodes.doc.create({}, [imgNode, vidNode, audNode, qrNode, pBelow]);
    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // QR code widgets are excluded from Live Preview expansion
    expect(isExpandableMediaNode(qrNode)).toBe(false);
    expect(isExpandableMediaNode(imgNode)).toBe(true);
    expect(isExpandableMediaNode(vidNode)).toBe(true);
    expect(isExpandableMediaNode(audNode)).toBe(true);

    // 1. Focus image via NodeSelection -> expands to "![[attachments/photo.png|400]]"
    state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));
    expect(state.doc.child(0).type.name).toBe("paragraph");
    expect(state.doc.child(0).textContent).toBe("![[attachments/photo.png|400]]");

    // Verify Obsidian muted gray syntax markers on attachment embed brackets and width
    const imgDecos = collectDecorationClasses(state);
    expect(imgDecos.some((d) => d.className === "luno-live-syntax-marker")).toBe(true);
    expect(imgDecos.some((d) => d.className.includes("text-primary"))).toBe(true);
    expect(imgDecos.some((d) => d.className.includes("luno-live-hl-"))).toBe(false);

    // Edit width from 400 -> 520
    state = state.apply(
      state.tr.insertText("![[attachments/photo.png|520]]", 1, 1 + state.doc.child(0).content.size)
    );

    // Move focus to video (child 1) -> image collapses with updated width=520 AND preserved blob URL!
    const vidPos = state.doc.child(0).nodeSize;
    state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, vidPos)));
    expect(state.doc.child(0).type.name).toBe("image");
    expect(state.doc.child(0).attrs.width).toBe(520);
    expect(state.doc.child(0).attrs.src).toBe("blob:http://localhost/photo-blob");
    expect(state.doc.child(0).attrs["data-relative-src"]).toBe("attachments/photo.png");

    // 2. Video expanded to "![[attachments/demo.mp4|640]]"
    expect(state.doc.child(1).type.name).toBe("paragraph");
    expect(state.doc.child(1).textContent).toBe("![[attachments/demo.mp4|640]]");

    // Move focus to audio without editing video -> lossless restore of original video node
    const audPos = state.doc.child(0).nodeSize + state.doc.child(1).nodeSize;
    state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, audPos)));
    expect(state.doc.child(1).type.name).toBe("video");
    expect(state.doc.child(1).attrs.width).toBe(640);
    expect(state.doc.child(1).attrs.src).toBe("blob:http://localhost/video-blob");

    // 3. Audio expanded to "![[attachments/voice_note.webm]]"
    expect(state.doc.child(2).type.name).toBe("paragraph");
    expect(state.doc.child(2).textContent).toBe("![[attachments/voice_note.webm]]");

    // Edit audio path to a new mp3 file
    const audBlock = livePreviewPluginKey.getState(state)!.activeBlock!;
    state = state.apply(
      state.tr.insertText(
        "![[attachments/podcast.mp3]]",
        audBlock.blockPos + 1,
        audBlock.blockPos + 1 + state.doc.child(2).content.size
      )
    );

    // Blur -> collapses into audio node with updated relative src
    state = state.apply(state.tr.setMeta(livePreviewPluginKey, { blur: true }));
    expect(state.doc.child(2).type.name).toBe("audio");
    expect(state.doc.child(2).attrs["data-relative-src"]).toBe("attachments/podcast.mp3");
    expect(state.doc.child(2).attrs.src).toBe("attachments/podcast.mp3");
  });

  it("compiles a newly typed attachment embed (![[...]] or ![...](...)) in a normal paragraph on blur", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.paragraph.create({}, []),
      testSchema.nodes.paragraph.create({}, testSchema.text("End")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    state = state.apply(state.tr.insertText("![Diagram|480](https://example.com/diagram.png)", 1, 1));
    state = state.apply(state.tr.setMeta(livePreviewPluginKey, { blur: true }));

    expect(state.doc.child(0).type.name).toBe("image");
    expect(state.doc.child(0).attrs.src).toBe("https://example.com/diagram.png");
    expect(state.doc.child(0).attrs.alt).toBe("Diagram");
    expect(state.doc.child(0).attrs.width).toBe(480);

    // Re-serialize standard Markdown image
    expect(serializeMediaNodeToRawMarkdown(state.doc.child(0))).toBe(
      "![Diagram|480](https://example.com/diagram.png)"
    );
    expect(parseRawMarkdownToMediaNode("![[attachments/song.mp3]]", testSchema)?.type.name).toBe("audio");
    expect(parseRawMarkdownToMediaNode("![[attachments/clip.mp4|720]]", testSchema)?.type.name).toBe("video");
  });

  it("applies HTML-Editor syntax highlight classes (--hl-*) per-element to revealed HTML tags, inline code, comments, and embeds", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.paragraph.create({}, [
        testSchema.text("Color ", []),
        testSchema.text("ไฟล์", [
          testSchema.marks.textColor.create({ color: "rgb(38, 162, 149)" }),
          testSchema.marks.fontFamily.create({ fontFamily: "Sriracha, cursive, sans-serif" }),
          testSchema.marks.fontSize.create({ fontSize: "24px" }),
        ]),
        testSchema.text(" and "),
        testSchema.text("const n = 42", [testSchema.marks.code.create()]),
      ]),
      testSchema.nodes.paragraph.create(
        {},
        testSchema.text("HTML `<div class=\"box\">ok</div>` <!-- comment --> ![[attachments/__my_img__.png|300]]")
      ),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // 1. Focus plain text "Color " on line 1 -> both nested <span> and inline code stay rendered
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(0).textContent).toBe("Color ไฟล์ and const n = 42");

    // 2. Focus right AFTER "ไฟล์" (offset 10, matching Obsidian screenshot) -> reveals ONLY nested <span> while `const n = 42` stays rendered
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 10)));
    expect(state.doc.child(0).textContent).toBe(
      'Color <span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;"><span style="font-size: 24px;">ไฟล์</span></span></span> and const n = 42'
    );
    const decosSpan = collectDecorationClasses(state);
    expect(decosSpan.some((d) => d.className.includes("luno-live-hl-tag"))).toBe(true);
    expect(decosSpan.some((d) => d.className.includes("luno-live-hl-attr"))).toBe(true);
    expect(decosSpan.some((d) => d.className.includes("luno-live-hl-string"))).toBe(true);
    expect(decosSpan.some((d) => d.className.includes("luno-live-hl-punct"))).toBe(true);
    // Inner text of inline HTML tags must stay plain unstyled text (like Obsidian)
    expect(decosSpan.some((d) => d.className.includes("luno-live-styled-span"))).toBe(false);

    // 3. Move cursor onto "const n = 42" -> collapses nested <span> cleanly and reveals ONLY `const n = 42`
    const codeIdx = state.doc.child(0).textContent.indexOf("const n = 42");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + codeIdx + 3)));
    expect(state.doc.child(0).textContent).toBe("Color ไฟล์ and `const n = 42`");
    const decosCode = collectDecorationClasses(state);
    expect(decosCode.some((d) => d.className.includes("luno-live-inline-code"))).toBe(true);
    expect(decosCode.some((d) => d.className.includes("hljs-"))).toBe(true);
    expect(decosCode.some((d) => d.className === "luno-live-syntax-marker")).toBe(true);

    // 4. Move back onto "ไฟล์", edit nested span font-size 24px -> 28px and text -> "ไฟล์ใหม่"
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 8)));
    const activeSpan = livePreviewPluginKey.getState(state)!.activeBlock!.activeInline!;
    state = state.apply(
      state.tr.insertText(
        '<span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;"><span style="font-size: 28px;">ไฟล์ใหม่</span></span></span>',
        1 + activeSpan.fromOffset,
        1 + activeSpan.toOffset
      )
    );

    // 5. Focus line 2 -> line 1 collapses cleanly preserving all 3 marks without stray </span>, line 2 verifies comment & backtick HTML
    const line2Pos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, line2Pos)));

    expect(state.doc.child(0).textContent).toBe("Color ไฟล์ใหม่ and const n = 42");
    const styledTextNode = state.doc.child(0).child(1);
    expect(styledTextNode.text).toBe("ไฟล์ใหม่");
    expect(styledTextNode.marks.some((m) => m.type.name === "textColor" && m.attrs.color === "rgb(38, 162, 149)")).toBe(true);
    expect(styledTextNode.marks.some((m) => m.type.name === "fontFamily" && m.attrs.fontFamily === "Sriracha, cursive, sans-serif")).toBe(true);
    expect(styledTextNode.marks.some((m) => m.type.name === "fontSize" && m.attrs.fontSize === "28px")).toBe(true);
    // Inline code stayed intact losslessly
    const codeTextNode = state.doc.child(0).child(3);
    expect(codeTextNode.text).toBe("const n = 42");
    expect(codeTextNode.marks.some((m) => m.type.name === "code")).toBe(true);

    const decos2 = collectDecorationClasses(state);
    expect(decos2.some((d) => d.className.includes("luno-live-hl-comment"))).toBe(true);
    expect(decos2.some((d) => d.className.includes("hljs-name"))).toBe(true);
    expect(decos2.some((d) => d.className === "luno-live-syntax-marker")).toBe(true);
    expect(decos2.some((d) => d.className === "font-bold")).toBe(false);

    // Direct call check for buildLivePreviewDecorations returns non-empty DecorationSet
    const active = livePreviewPluginKey.getState(state)!.activeBlock;
    expect(buildLivePreviewDecorations(state.doc, active).find().length).toBeGreaterThan(0);
  });

  it("does NOT affect the file's Document Title H1 at pos 0 when hasTitleH1 is true (while body H1/H2 still expand)", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 1 }, [
        testSchema.text("Note "),
        testSchema.text("Title", [testSchema.marks.bold.create()]),
      ]),
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Section 1")),
      testSchema.nodes.heading.create({ level: 1 }, testSchema.text("Body Heading 1")),
    ]);

    const plugin = createLivePreviewPlugin(true, true);
    let state = EditorState.create({ doc, plugins: [history(), plugin] });
    const dispatch = (tr: any) => {
      state = state.apply(tr);
    };

    // Helper checks
    expect(isPosInDocumentTitleH1(state.doc, 1, true)).toBe(true);
    expect(isPosInDocumentTitleH1(state.doc, 1, false)).toBe(false);
    const sec1Pos = state.doc.child(0).nodeSize + 1;
    expect(isPosInDocumentTitleH1(state.doc, sec1Pos, true)).toBe(false);

    // 1. Focus inside Document Title H1 (even directly on bold word) -> NO "# " prefix, NO "**Title**", activeBlock is null
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 7)));
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(1);
    expect(state.doc.child(0).textContent).toBe("Note Title");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);
    expect(livePreviewPluginKey.getState(state)?.activeBlock).toBeNull();
    expect(collectDecorationClasses(state)).toHaveLength(0);

    // 2. Editing the Document Title H1 works normally without Live Preview interference & supports Undo/Redo
    state = state.apply(
      state.tr.insertText(" Renamed", 1 + state.doc.child(0).content.size)
    );
    expect(state.doc.child(0).textContent).toBe("Note Title Renamed");
    expect(livePreviewPluginKey.getState(state)?.activeBlock).toBeNull();

    // 3. Moving focus to Section 1 (H2) reveals "## Section 1"
    const sectionPos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, sectionPos)));
    expect(state.doc.child(0).textContent).toBe("Note Title Renamed");
    expect(state.doc.child(1).textContent).toBe("## Section 1");

    // 4. Moving focus to a body H1 at blockPos > 0 STILL reveals "# Body Heading 1"
    const bodyH1Pos = state.doc.child(0).nodeSize + state.doc.child(1).nodeSize + 1;
    expect(isPosInDocumentTitleH1(state.doc, bodyH1Pos, true)).toBe(false);
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, bodyH1Pos)));
    expect(state.doc.child(1).textContent).toBe("Section 1");
    expect(state.doc.child(2).textContent).toBe("# Body Heading 1");

    // 5. Moving focus BACK into the Document Title H1 collapses body H1 cleanly and leaves Title H1 untouched
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(2).textContent).toBe("Body Heading 1");
    expect(state.doc.child(0).textContent).toBe("Note Title Renamed");
    expect(livePreviewPluginKey.getState(state)?.activeBlock).toBeNull();

    // 6. Undo reverts Title H1 edit cleanly without expanding "# "
    expect(livePreviewUndo(state, dispatch, { isEnabled: true, hasTitleH1: true })).toBe(true);
    expect(state.doc.child(0).textContent).toBe("Note Title");
    expect(livePreviewPluginKey.getState(state)?.activeBlock).toBeNull();
  });

  it("converts a plain paragraph into a heading or horizontal rule via raw markdown", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.paragraph.create({}, testSchema.text("Line 1")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Line 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Line 3")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    state = state.apply(
      state.tr.insertText("## Converted Heading", 1, 1 + state.doc.child(0).content.size)
    );
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(2);

    const line2Pos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, line2Pos)));
    expect(state.doc.child(0).textContent).toBe("Converted Heading");

    const active2 = livePreviewPluginKey.getState(state)!.activeBlock!;
    state = state.apply(
      state.tr.insertText("---", active2.blockPos + 1, active2.blockPos + 1 + state.doc.child(1).content.size)
    );

    state = state.apply(state.tr.setMeta(livePreviewPluginKey, { blur: true }));
    expect(state.doc.child(1).type.name).toBe("horizontalRule");
  });

  it("synchronizes seamlessly with Edit Mode toolbar commands (heading level change & inline mark apply)", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading Two")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Next line")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    expect(state.doc.child(0).textContent).toBe("## Heading Two");

    state = state.apply(
      state.tr.setNodeMarkup(0, testSchema.nodes.heading, { level: 3 })
    );
    expect(state.doc.child(0).attrs.level).toBe(3);
    expect(state.doc.child(0).textContent).toBe("### Heading Two");

    state = state.apply(
      state.tr.addMark(5, 12, testSchema.marks.bold.create())
    );
    expect(state.doc.child(0).textContent).toBe("### **Heading** Two");
  });

  it("does NOT pollute undo history when merely focusing and moving between lines without editing", () => {
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Line 2")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [history(), plugin] });

    // Focus Heading 2 -> reveals "## Heading 2"
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
    expect(state.doc.child(0).textContent).toBe("## Heading 2");
    expect(livePreviewUndoDepth(state)).toBe(0);
    expect(livePreviewUndo(state, undefined, { isEnabled: true })).toBe(false);

    // Move to Line 2 -> collapses Heading 2
    const line2Pos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, line2Pos)));
    expect(state.doc.child(0).textContent).toBe("Heading 2");
    expect(livePreviewUndoDepth(state)).toBe(0);
    expect(livePreviewUndo(state, undefined, { isEnabled: true })).toBe(false);
  });

  it("preserves full multi-step Undo and Redo across headings, inline markdown, and media attachments even after collapse/re-expand", () => {
    const imgNode = testSchema.nodes.image.create({
      src: "blob:http://localhost/photo-blob",
      "data-relative-src": "attachments/photo.png",
      "data-wikilink-embed": "true",
      alt: "photo.png",
      width: 400,
    });
    const doc = testSchema.nodes.doc.create({}, [
      testSchema.nodes.heading.create({ level: 2 }, testSchema.text("Heading 2")),
      testSchema.nodes.paragraph.create({}, testSchema.text("Hello world")),
      imgNode,
      testSchema.nodes.paragraph.create({}, testSchema.text("Footer")),
    ]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [history(), plugin] });
    const dispatch = (tr: any) => {
      state = state.apply(tr);
    };

    // Edit 1: Focus Heading 2 and change "## Heading 2" -> "### Heading 3"
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    state = state.apply(
      state.tr.insertText("### Heading 3", 1, 1 + state.doc.child(0).content.size)
    );
    expect(state.doc.child(0).attrs.level).toBe(3);

    // Edit 2: Move to paragraph 2 and wrap "world" -> "**world**"
    const p2Start = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, p2Start)));
    expect(state.doc.child(0).textContent).toBe("Heading 3");
    const activeP2 = livePreviewPluginKey.getState(state)!.activeBlock!;
    state = state.apply(
      state.tr.insertText(
        "Hello **world**",
        activeP2.blockPos + 1,
        activeP2.blockPos + 1 + state.doc.child(1).content.size
      )
    );

    // Edit 3: Focus image and change width 400 -> 640
    const imgPos = state.doc.child(0).nodeSize + state.doc.child(1).nodeSize;
    state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, imgPos)));
    expect(state.doc.child(1).textContent).toBe("Hello world");
    expect(state.doc.child(2).textContent).toBe("![[attachments/photo.png|400]]");
    const activeImg = livePreviewPluginKey.getState(state)!.activeBlock!;
    state = state.apply(
      state.tr.insertText(
        "![[attachments/photo.png|640]]",
        activeImg.blockPos + 1,
        activeImg.blockPos + 1 + state.doc.child(2).content.size
      )
    );

    // Move to Footer and click back onto Heading 3 without editing (triggers collapse & re-expand!)
    const footerPos = state.doc.child(0).nodeSize + state.doc.child(1).nodeSize + state.doc.child(2).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, footerPos)));
    expect(state.doc.child(2).type.name).toBe("image");
    expect(state.doc.child(2).attrs.width).toBe(640);
    expect(state.doc.child(2).attrs.src).toBe("blob:http://localhost/photo-blob");

    // Re-focus Heading 3 without editing, then move back to Footer
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    expect(state.doc.child(0).textContent).toBe("### Heading 3");
    state = state.apply(
      state.tr.setSelection(
        TextSelection.create(
          state.doc,
          state.doc.child(0).nodeSize + state.doc.child(1).nodeSize + state.doc.child(2).nodeSize + 1
        )
      )
    );

    expect(livePreviewUndoDepth(state)).toBe(3);
    expect(livePreviewRedoDepth(state)).toBe(0);

    // Undo #1 -> reverts image width 640 back to 400 (expanded on image line)
    expect(livePreviewUndo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(2).textContent).toBe("![[attachments/photo.png|400]]");

    // Undo #2 -> reverts paragraph "**world**" back to plain "Hello world" (and collapses image back to width 400!)
    expect(livePreviewUndo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(2).type.name).toBe("image");
    expect(state.doc.child(2).attrs.width).toBe(400);
    expect(state.doc.child(2).attrs.src).toBe("blob:http://localhost/photo-blob");
    expect(state.doc.child(1).textContent).toBe("Hello world");

    // Undo #3 -> reverts "### Heading 3" back to "## Heading 2" (level 2)
    expect(livePreviewUndo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(2);
    expect(state.doc.child(0).textContent).toBe("## Heading 2");
    expect(livePreviewUndoDepth(state)).toBe(0);
    expect(livePreviewRedoDepth(state)).toBe(3);

    // Redo #1 -> restores "### Heading 3"
    expect(livePreviewRedo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(3);
    expect(state.doc.child(0).textContent).toBe("Heading 3");

    // Redo #2 -> restores "Hello **world**"
    expect(livePreviewRedo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(serializeBlockToRawMarkdown(state.doc, state.doc.child(0).nodeSize, state.doc.child(1)).rawMarkdown).toBe(
      "Hello **world**"
    );

    // Redo #3 -> restores image width 640
    expect(livePreviewRedo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(2).type.name).toBe("image");
    expect(state.doc.child(2).attrs.width).toBe(640);
    expect(state.doc.child(2).attrs.src).toBe("blob:http://localhost/photo-blob");
    expect(livePreviewRedoDepth(state)).toBe(0);
  });

  it("integrates with TipTap Editor commands (editor.can().undo/redo, editor.commands.undo/redo) including toggling Live Preview ON/OFF", () => {
    let livePreviewEnabled = false;
    const editor = new Editor({
      extensions: [
        StarterKit,
        LivePreview.configure({
          enabled: () => livePreviewEnabled,
          hasTitleH1: false,
        }),
      ],
      content: "<h2>Heading 2</h2><p>Body text</p>",
    });

    try {
      // Fresh editor has no undo/redo
      expect(editor.can().undo()).toBe(false);
      expect(editor.can().redo()).toBe(false);

      // 1. Edit while Live Preview is OFF
      editor.commands.setTextSelection(editor.state.doc.content.size - 1);
      editor.commands.insertContent("!");
      expect(editor.can().undo()).toBe(true);
      expect(editor.state.doc.child(1).textContent).toBe("Body text!");

      // 2. Turn Live Preview ON -> focus Heading 2 and edit "## Heading 2" -> "### Heading 3"
      livePreviewEnabled = true;
      editor.view.dispatch(
        editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1))
      );
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2");

      editor.view.dispatch(
        editor.state.tr.insertText("### Heading 3", 1, 1 + editor.state.doc.child(0).content.size)
      );
      expect(editor.state.doc.child(0).attrs.level).toBe(3);

      // Move to second paragraph so Heading 3 collapses
      const p2Pos = editor.state.doc.child(0).nodeSize + 1;
      editor.view.dispatch(
        editor.state.tr.setSelection(TextSelection.create(editor.state.doc, p2Pos))
      );
      expect(editor.state.doc.child(0).textContent).toBe("Heading 3");

      // 3. Undo via TipTap command -> reverts "### Heading 3" back to "## Heading 2"
      expect(editor.can().undo()).toBe(true);
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(0).attrs.level).toBe(2);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2");
      expect(editor.can().redo()).toBe(true);

      // 4. Undo again -> reverts edit #1 ("Body text!" -> "Body text") made BEFORE Live Preview was enabled!
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(1).textContent).toBe("Body text");
      expect(editor.can().undo()).toBe(false);

      // 5. Turn Live Preview OFF, then Redo both edits -> restores cleanly rendered (NO raw ## prefix!)
      livePreviewEnabled = false;
      editor.view.dispatch(
        editor.state.tr
          .setMeta(livePreviewPluginKey, { collapse: true })
          .setMeta("addToHistory", false)
      );

      expect(editor.can().redo()).toBe(true);
      expect(editor.commands.redo()).toBe(true);
      expect(editor.state.doc.child(1).textContent).toBe("Body text!");

      expect(editor.commands.redo()).toBe(true);
      expect(editor.state.doc.child(0).attrs.level).toBe(3);
      expect(editor.state.doc.child(0).textContent).toBe("Heading 3");
      expect(editor.can().redo()).toBe(false);

      // 6. Undo once while Live Preview is OFF -> cleanly reverts Heading 3 -> rendered Heading 2
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(0).attrs.level).toBe(2);
      expect(editor.state.doc.child(0).textContent).toBe("Heading 2");
    } finally {
      editor.destroy();
    }
  });

  it("supports in-line undo/redo while focused on the same line, clears redo on new edit, and undoes Enter splits", () => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        LivePreview.configure({
          enabled: () => true,
          hasTitleH1: false,
        }),
      ],
      content: "<h2>Heading 2</h2>",
    });

    try {
      // Focus Heading 2 -> reveals "## Heading 2"
      editor.view.dispatch(
        editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 10))
      );
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2");
      expect(livePreviewUndoDepth(editor.state)).toBe(0);

      // Typing step 1 (at explicit timestamp 1000)
      const tr1 = editor.state.tr.insertText(" Foo", 1 + editor.state.doc.child(0).content.size);
      tr1.setTime(1000);
      editor.view.dispatch(tr1);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo");
      expect(livePreviewUndoDepth(editor.state)).toBe(1);

      // Typing step 2 after >500ms pause (timestamp 2000)
      const tr2 = editor.state.tr.insertText(" Bar", 1 + editor.state.doc.child(0).content.size);
      tr2.setTime(2000);
      editor.view.dispatch(tr2);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo Bar");
      expect(livePreviewUndoDepth(editor.state)).toBe(2);

      // Undo #1 (still focused on Heading 2!) -> reverts " Bar"
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo");
      expect(livePreviewUndoDepth(editor.state)).toBe(1);
      expect(editor.can().redo()).toBe(true);

      // Undo #2 -> reverts " Foo"
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2");
      expect(livePreviewUndoDepth(editor.state)).toBe(0);
      expect(editor.can().undo()).toBe(false);

      // Redo #1 -> restores " Foo"
      expect(editor.commands.redo()).toBe(true);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo");
      expect(editor.can().redo()).toBe(true);

      // New edit after Undo/Redo clears Redo stack
      const tr3 = editor.state.tr.insertText(" Baz", 1 + editor.state.doc.child(0).content.size);
      tr3.setTime(3000);
      editor.view.dispatch(tr3);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo Baz");
      expect(editor.can().redo()).toBe(false);

      // Undo reverts " Baz" -> "## Heading 2 Foo"
      expect(editor.commands.undo()).toBe(true);
      expect(editor.state.doc.child(0).textContent).toBe("## Heading 2 Foo");
    } finally {
      editor.destroy();
    }
  });

  it("reveals ONLY the focused inline element (not the whole line): Thai bold & italic example like Obsidian", () => {
    // "ประโยคนี้มี" (len 11) + bold("ตัวหนา", len 6) + "และ" (len 3) + italic("ตัวเอียง", len 8)
    const pThai = testSchema.nodes.paragraph.create({}, [
      testSchema.text("ประโยคนี้มี"),
      testSchema.text("ตัวหนา", [testSchema.marks.bold.create()]),
      testSchema.text("และ"),
      testSchema.text("ตัวเอียง", [testSchema.marks.italic.create()]),
    ]);
    const p2 = testSchema.nodes.paragraph.create({}, testSchema.text("บรรทัดถัดไป"));
    const doc = testSchema.nodes.doc.create({}, [pThai, p2]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [history(), plugin] });

    // 1. Focus plain text "ประโยค|นี้มี" (offset 6) -> both bold and italic stay rendered
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 6)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนาและตัวเอียง");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);
    expect(state.doc.child(0).child(3).marks.some((m) => m.type.name === "italic")).toBe(true);
    expect(livePreviewUndoDepth(state)).toBe(0);

    // 2. Focus right AFTER "ตัวหนา" (offset 17: "ประโยคนี้มีตัวหนา|และตัวเอียง")
    //    -> reveals ONLY "**ตัวหนา**", keeping "ตัวเอียง" rendered italic!
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 17)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มี**ตัวหนา**และตัวเอียง");
    // Last child ("ตัวเอียง") still has its italic mark intact
    const lastChildAfterBold = state.doc.child(0).lastChild!;
    expect(lastChildAfterBold.text).toBe("ตัวเอียง");
    expect(lastChildAfterBold.marks.some((m) => m.type.name === "italic")).toBe(true);
    // Cursor is placed right after "**ตัวหนา**|" (offset 21 -> doc pos 22)
    expect(state.selection.from).toBe(1 + 21);
    // "**" markers use Obsidian muted gray (.luno-live-syntax-marker)
    const boldDecos = collectDecorationClasses(state);
    expect(boldDecos.some((d) => d.from === 1 + 11 && d.to === 1 + 13 && d.className === "luno-live-syntax-marker")).toBe(true);
    expect(boldDecos.some((d) => d.from === 1 + 19 && d.to === 1 + 21 && d.className === "luno-live-syntax-marker")).toBe(true);

    // 3. Move cursor INSIDE "ตัวเอียง" -> collapses "**ตัวหนา**" back to bold and reveals ONLY "*ตัวเอียง*"
    const italicOffsetInExpanded = state.doc.child(0).textContent.indexOf("ตัวเอียง") + 3;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + italicOffsetInExpanded)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนาและ*ตัวเอียง*");
    // "ตัวหนา" is back to rendered bold mark!
    expect(state.doc.child(0).child(1).text).toBe("ตัวหนา");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);

    // 4. Move cursor right AFTER "ตัวเอียง" -> stays "*ตัวเอียง*"
    const endOfPara = 1 + state.doc.child(0).content.size;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, endOfPara)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนาและ*ตัวเอียง*");

    // 5. Move cursor back to plain text "และ" (inside "และ", offset 18) -> collapses "*ตัวเอียง*" cleanly
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 18)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนาและตัวเอียง");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);
    expect(state.doc.child(0).child(3).marks.some((m) => m.type.name === "italic")).toBe(true);
    // Merely moving focus across inline elements must NEVER pollute undo history
    expect(livePreviewUndoDepth(state)).toBe(0);
  });

  it("reveals block prefix (## ) on heading focus while keeping untouched inline elements rendered until cursor touches them", () => {
    const h2 = testSchema.nodes.heading.create({ level: 2 }, [
      testSchema.text("หัวข้อ "),
      testSchema.text("ตัวหนา", [testSchema.marks.bold.create()]),
      testSchema.text(" และ "),
      testSchema.text("ตัวเอียง", [testSchema.marks.italic.create()]),
    ]);
    const p2 = testSchema.nodes.paragraph.create({}, testSchema.text("Next"));
    const doc = testSchema.nodes.doc.create({}, [h2, p2]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [plugin] });

    // 1. Click plain text "หัวข้อ" -> reveals "## " prefix ONLY, leaving both bold & italic rendered
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 2)));
    expect(state.doc.child(0).textContent).toBe("## หัวข้อ ตัวหนา และ ตัวเอียง");
    expect(state.doc.child(0).child(1).text).toBe("ตัวหนา");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);
    expect(state.doc.child(0).child(3).text).toBe("ตัวเอียง");
    expect(state.doc.child(0).child(3).marks.some((m) => m.type.name === "italic")).toBe(true);

    // 2. Move cursor onto "ตัวหนา" -> reveals "## หัวข้อ **ตัวหนา** และ ตัวเอียง"
    const boldIdx = state.doc.child(0).textContent.indexOf("ตัวหนา");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + boldIdx + 2)));
    expect(state.doc.child(0).textContent).toBe("## หัวข้อ **ตัวหนา** และ ตัวเอียง");
    expect(state.doc.child(0).lastChild!.text).toBe("ตัวเอียง");
    expect(state.doc.child(0).lastChild!.marks.some((m) => m.type.name === "italic")).toBe(true);

    // 3. Move cursor onto "ตัวเอียง" -> collapses bold and reveals "## หัวข้อ ตัวหนา และ *ตัวเอียง*"
    const italicIdx = state.doc.child(0).textContent.indexOf("ตัวเอียง");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + italicIdx + 2)));
    expect(state.doc.child(0).textContent).toBe("## หัวข้อ ตัวหนา และ *ตัวเอียง*");
    expect(state.doc.child(0).child(1).text).toBe("ตัวหนา");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);

    // 4. Move to paragraph 2 -> collapses "## " and all inline marks cleanly
    const p2Pos = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, p2Pos)));
    expect(state.doc.child(0).type.name).toBe("heading");
    expect(state.doc.child(0).attrs.level).toBe(2);
    expect(state.doc.child(0).textContent).toBe("หัวข้อ ตัวหนา และ ตัวเอียง");
  });

  it("compiles newly typed inline syntax on space/leave and supports granular per-element Undo/Redo", () => {
    const pThai = testSchema.nodes.paragraph.create({}, [
      testSchema.text("ประโยคนี้มี"),
      testSchema.text("ตัวหนา", [testSchema.marks.bold.create()]),
      testSchema.text("และ"),
      testSchema.text("ตัวเอียง", [testSchema.marks.italic.create()]),
    ]);
    const pEmpty = testSchema.nodes.paragraph.create({}, testSchema.text("เริ่ม "));
    const doc = testSchema.nodes.doc.create({}, [pThai, pEmpty]);

    const plugin = createLivePreviewPlugin(true);
    let state = EditorState.create({ doc, plugins: [history(), plugin] });
    const dispatch = (tr: any) => {
      state = state.apply(tr);
    };

    // A. Live typing compilation on pEmpty: type "**ใหม่**" (stays raw while cursor touches closing *), then type " " (compiles live!)
    const p2Start = state.doc.child(0).nodeSize + 1;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, p2Start + 6)));
    state = state.apply(state.tr.insertText("**ใหม่**", p2Start + 6));
    expect(state.doc.child(1).textContent).toBe("เริ่ม **ใหม่**");

    // Type Space right after "**ใหม่**|" -> compiles "**ใหม่**" into bold immediately!
    const afterBoldPos = state.doc.child(0).nodeSize + 1 + state.doc.child(1).content.size;
    state = state.apply(state.tr.insertText(" ", afterBoldPos));
    expect(state.doc.child(1).textContent).toBe("เริ่ม ใหม่ ");
    expect(state.doc.child(1).child(1).text).toBe("ใหม่");
    expect(state.doc.child(1).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);

    // B. Typing plain text right after an expanded bold boundary ("**ตัวหนา**|") collapses "**ตัวหนา**" cleanly
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + 17)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มี**ตัวหนา**และตัวเอียง");
    // Cursor is at 1 + 21 (right after "**ตัวหนา**|"): edit inside "**ตัวหนา**" -> "**ตัวหนามาก**"
    const trEditBold = state.tr.insertText("มาก", 1 + 19);
    trEditBold.setTime(1000);
    state = state.apply(trEditBold);
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มี**ตัวหนามาก**และตัวเอียง");

    // Move to "ตัวเอียง" -> "**ตัวหนามาก**" collapses to bold, "*ตัวเอียง*" expands
    const italicIdx = state.doc.child(0).textContent.indexOf("ตัวเอียง");
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1 + italicIdx + 4)));
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนามากและ*ตัวเอียง*");

    // Edit inside "*ตัวเอียง*" -> "*ตัวเอียงมาก*"
    const italicEndBeforeStar = 1 + state.doc.child(0).content.size - 1;
    const trEditItalic = state.tr.insertText("มาก", italicEndBeforeStar);
    trEditItalic.setTime(2000);
    state = state.apply(trEditItalic);
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนามากและ*ตัวเอียงมาก*");

    // Undo #1 -> reverts "*ตัวเอียงมาก*" back to "*ตัวเอียง*" while keeping "ตัวหนามาก" bold!
    expect(livePreviewUndo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มีตัวหนามากและ*ตัวเอียง*");
    expect(state.doc.child(0).child(1).text).toBe("ตัวหนามาก");
    expect(state.doc.child(0).child(1).marks.some((m) => m.type.name === "bold")).toBe(true);

    // Undo #2 -> reverts "**ตัวหนามาก**" back to "**ตัวหนา**" while keeping "ตัวเอียง" rendered italic!
    expect(livePreviewUndo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).textContent).toBe("ประโยคนี้มี**ตัวหนา**และตัวเอียง");
    expect(state.doc.child(0).lastChild!.text).toBe("ตัวเอียง");
    expect(state.doc.child(0).lastChild!.marks.some((m) => m.type.name === "italic")).toBe(true);

    // Redo #1 -> restores "ตัวหนามาก"
    expect(livePreviewRedo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).textContent).toContain("ตัวหนามาก");

    // Redo #2 -> restores "ตัวเอียงมาก"
    expect(livePreviewRedo(state, dispatch, { isEnabled: true })).toBe(true);
    expect(state.doc.child(0).textContent).toContain("ตัวเอียงมาก");
  });
});
