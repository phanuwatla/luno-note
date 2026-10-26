import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import {
  HeadingToggle,
  headingTogglePluginKey,
  getFoldableChildPositions,
  getAllHeadingPositions,
  buildHeadingDecorations,
  isTitleHeading,
  getFoldedHeadingKeys,
  restoreFoldedPositionsFromKeys,
  getSavedFoldedHeadingKeys,
  saveSavedFoldedHeadingKeys,
  clearSavedFoldedHeadingKeys,
  createToggleButton,
  createFoldedBadge,
} from "./headingToggle";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/hooks/useAppSettings";

// Build a test schema with doc, heading, paragraph, text
const testSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM: () => ["p", 0],
    },
    heading: {
      group: "block",
      content: "inline*",
      attrs: { level: { default: 1 } },
      toDOM: (node) => [`h${node.attrs.level}`, 0],
    },
    text: { group: "inline" },
  },
});

function createDoc(spec: Array<{ type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"; text: string }>) {
  const content = spec.map((item) => {
    if (item.type.startsWith("h")) {
      const level = Number(item.type.slice(1));
      return testSchema.nodes.heading.create({ level }, testSchema.text(item.text));
    }
    return testSchema.nodes.paragraph.create({}, testSchema.text(item.text));
  });
  return testSchema.nodes.doc.create({}, content);
}

describe("HeadingToggle Extension and Scope Calculations", () => {
  it("has toggleHeading enabled by default in settings", () => {
    expect(DEFAULT_SETTINGS.toggleHeading).toBe(true);

    const normalizedEmpty = normalizeSettings({});
    expect(normalizedEmpty.toggleHeading).toBe(true);

    const normalizedFalse = normalizeSettings({ toggleHeading: false });
    expect(normalizedFalse.toggleHeading).toBe(false);

    const normalizedTrue = normalizeSettings({ toggleHeading: true });
    expect(normalizedTrue.toggleHeading).toBe(true);

    // Also supports foldHeading alias
    const normalizedAlias = normalizeSettings({ foldHeading: false } as any);
    expect(normalizedAlias.toggleHeading).toBe(false);
  });

  it("identifies Title H1 (file name) at pos 0 and excludes it from toggling", () => {
    const doc = createDoc([
      { type: "h1", text: "Note Title" },
      { type: "p", text: "Intro content" },
      { type: "h1", text: "Second H1" },
      { type: "h2", text: "Subheading" },
    ]);

    const titleNode = doc.firstChild!;
    expect(isTitleHeading(doc, 0, titleNode)).toBe(true);

    // Find the second H1 at pos > 0
    let secondH1Pos = -1;
    let secondH1Node: any = null;
    let h2Node: any = null;
    let h2Pos = -1;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.attrs.level === 1 && node.textContent === "Second H1") {
        secondH1Pos = pos;
        secondH1Node = node;
      }
      if (node.type.name === "heading" && node.attrs.level === 2) {
        h2Pos = pos;
        h2Node = node;
      }
    });

    expect(isTitleHeading(doc, secondH1Pos, secondH1Node)).toBe(false);
    expect(isTitleHeading(doc, h2Pos, h2Node)).toBe(false);

    // In buildHeadingDecorations: Title H1 must NOT get a toggle button
    const decos = buildHeadingDecorations(doc, new Set(), true);
    const allDecos = decos.find(0, doc.content.size);
    // There are 3 headings total (Title H1, Second H1, Subheading H2)
    // Only Second H1 and Subheading H2 should get toggle buttons (2 widgets, NOT 3)
    expect(allDecos.length).toBe(2);

    // Title pos (0) must not have any widget
    const titleWidgets = decos.find(0, titleNode.nodeSize);
    expect(titleWidgets.length).toBe(0);

    // getAllHeadingPositions must exclude title
    const positions = getAllHeadingPositions(doc);
    expect(positions.has(0)).toBe(false);
    expect(positions.has(secondH1Pos)).toBe(true);
  });

  it("calculates foldable child positions correctly for H1", () => {
    // doc:
    // 0: H1 "Section 1"
    // 1: P "Para 1"
    // 2: H2 "Sub 1.1"
    // 3: P "Para 2"
    // 4: H1 "Section 2"
    // 5: P "Para 3"
    const doc = createDoc([
      { type: "h1", text: "Section 1" },
      { type: "p", text: "Para 1" },
      { type: "h2", text: "Sub 1.1" },
      { type: "p", text: "Para 2" },
      { type: "h1", text: "Section 2" },
      { type: "p", text: "Para 3" },
    ]);

    // H1 "Section 1" is at pos 0
    const ranges = getFoldableChildPositions(doc, 0, 1);
    // Should fold Para 1, Sub 1.1, Para 2 (3 blocks)
    expect(ranges.length).toBe(3);

    // Verify nodes folded match Para 1, Sub 1.1, and Para 2
    const foldedNodes = ranges.map((r) => doc.nodeAt(r.from)?.textContent);
    expect(foldedNodes).toEqual(["Para 1", "Sub 1.1", "Para 2"]);
  });

  it("calculates foldable child positions correctly for H2 (stops at next H2 or H1)", () => {
    const doc = createDoc([
      { type: "h1", text: "Section 1" },
      { type: "h2", text: "Sub 1.1" },
      { type: "p", text: "Para 1.1" },
      { type: "h3", text: "Sub 1.1.1" },
      { type: "p", text: "Para 1.1.1" },
      { type: "h2", text: "Sub 1.2" },
      { type: "p", text: "Para 1.2" },
    ]);

    // Find H2 "Sub 1.1" pos
    let sub11Pos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.attrs.level === 2 && node.textContent === "Sub 1.1") {
        sub11Pos = pos;
        return false;
      }
      return true;
    });

    expect(sub11Pos).toBeGreaterThanOrEqual(0);
    const ranges = getFoldableChildPositions(doc, sub11Pos, 2);
    // Should fold Para 1.1, Sub 1.1.1, Para 1.1.1 (3 blocks) and STOP at Sub 1.2
    expect(ranges.length).toBe(3);
    const foldedTexts = ranges.map((r) => doc.nodeAt(r.from)?.textContent);
    expect(foldedTexts).toEqual(["Para 1.1", "Sub 1.1.1", "Para 1.1.1"]);
  });

  it("handles non-title levels H2 through H6 with individual toggle buttons", () => {
    const doc = createDoc([
      { type: "h1", text: "Note Title" }, // title (no toggle)
      { type: "h2", text: "Heading 2" },
      { type: "h3", text: "Heading 3" },
      { type: "h4", text: "Heading 4" },
      { type: "h5", text: "Heading 5" },
      { type: "h6", text: "Heading 6" },
      { type: "p", text: "Deep content" },
    ]);

    const headingPositions = getAllHeadingPositions(doc);
    expect(headingPositions.size).toBe(5); // 5 non-title headings

    const decos = buildHeadingDecorations(doc, new Set(), true);
    // There should be a widget decoration for each of the 5 non-title headings
    const widgets = decos.find(0, doc.content.size);
    expect(widgets.length).toBe(5);
  });

  it("returns DecorationSet.empty when enabled is false", () => {
    const doc = createDoc([
      { type: "p", text: "Intro" },
      { type: "h2", text: "Heading 2" },
      { type: "p", text: "Content" },
    ]);

    let h2Pos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        h2Pos = pos;
        return false;
      }
    });

    const decos = buildHeadingDecorations(doc, new Set([h2Pos]), false);
    expect(decos.find(0, doc.content.size).length).toBe(0);
  });

  it("adds hiding node decorations, folded class on heading, and folded badge when a heading is folded", () => {
    const doc = createDoc([
      { type: "h1", text: "Note Title" }, // title
      { type: "h2", text: "Heading 2A" },
      { type: "p", text: "Content 1" },
      { type: "p", text: "Content 2" },
      { type: "h2", text: "Heading 2B" },
    ]);

    let h2APos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.textContent === "Heading 2A") {
        h2APos = pos;
        return false;
      }
    });

    // Fold Heading 2A
    const decos = buildHeadingDecorations(doc, new Set([h2APos]), true);
    const allDecos = decos.find(0, doc.content.size);

    // Heading 2A folded receives .luno-heading-folded
    const headingFoldedDecos = allDecos.filter((d: any) => d.type?.attrs?.class === "luno-heading-folded");
    expect(headingFoldedDecos.length).toBe(1);

    // Content 1 and Content 2 receive .luno-heading-folded-hidden
    const hiddenNodeDecos = allDecos.filter((d: any) => d.type?.attrs?.class === "luno-heading-folded-hidden");
    expect(hiddenNodeDecos.length).toBe(2);

    // Folded badge widget ("···") at the end of Heading 2A
    const badgeWidgets = allDecos.filter((d: any) => d.spec?.key?.startsWith("heading-badge-"));
    expect(badgeWidgets.length).toBe(1);
  });

  it("ProseMirror plugin handles toggleAt, foldAll, unfoldAll and document mapping", () => {
    const doc = createDoc([
      { type: "h1", text: "Title" }, // title (pos 0)
      { type: "h2", text: "Heading 2A" },
      { type: "p", text: "Content 1" },
      { type: "h2", text: "Heading 2B" },
      { type: "p", text: "Content 2" },
    ]);

    let h2APos = -1;
    let h2BPos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.textContent === "Heading 2A") h2APos = pos;
      if (node.type.name === "heading" && node.textContent === "Heading 2B") h2BPos = pos;
    });

    const plugins = HeadingToggle.configure({ enabled: true }).config.addProseMirrorPlugins?.call({
      options: { enabled: true },
    } as any);

    const plugin = plugins![0];

    let state = EditorState.create({
      doc,
      plugins: [plugin],
    });

    let pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.size).toBe(0);

    // 1. Toggle fold Heading 2A
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2APos }));
    pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.has(h2APos)).toBe(true);

    // 2. Toggle unfold Heading 2A
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2APos }));
    pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.has(h2APos)).toBe(false);

    // 3. Fold all (excludes Title)
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { foldAll: true }));
    pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.size).toBe(2); // 2A and 2B
    expect(pluginState?.foldedPositions.has(0)).toBe(false);

    // 4. Unfold all
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { unfoldAll: true }));
    pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.size).toBe(0);
  });

  it("maps folded position when text is inserted before the heading", () => {
    const doc = createDoc([
      { type: "p", text: "Intro paragraph" },
      { type: "h2", text: "Heading 2" },
      { type: "p", text: "Content" },
    ]);

    const plugins = HeadingToggle.configure({ enabled: true }).config.addProseMirrorPlugins?.call({
      options: { enabled: true },
    } as any);

    let state = EditorState.create({
      doc,
      plugins: [plugins![0]],
    });

    // Find H2 pos
    let h2Pos = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        h2Pos = pos;
        return false;
      }
      return true;
    });

    // Fold H2
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2Pos }));
    expect(headingTogglePluginKey.getState(state)?.foldedPositions.has(h2Pos)).toBe(true);

    // Insert text at start of doc (pos 1 inside intro paragraph)
    state = state.apply(state.tr.insertText("EXTRA TEXT ", 1));

    // The folded heading position should be mapped forward by length of "EXTRA TEXT " (11 chars)
    const newPluginState = headingTogglePluginKey.getState(state);
    expect(newPluginState?.foldedPositions.has(h2Pos)).toBe(false);
    expect(newPluginState?.foldedPositions.has(h2Pos + 11)).toBe(true);
    expect(state.doc.nodeAt(h2Pos + 11)?.type.name).toBe("heading");
  });

  it("serializes and restores folded heading keys correctly", () => {
    const doc = createDoc([
      { type: "h1", text: "Note Title" },
      { type: "h2", text: "Introduction" },
      { type: "p", text: "Intro content" },
      { type: "h3", text: "Details" },
      { type: "p", text: "Details content" },
      { type: "h2", text: "Introduction" },
      { type: "p", text: "Second intro content" },
    ]);

    let h2FirstPos = -1;
    let h3Pos = -1;
    let h2SecondPos = -1;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        if (node.attrs.level === 2 && h2FirstPos === -1) {
          h2FirstPos = pos;
        } else if (node.attrs.level === 3) {
          h3Pos = pos;
        } else if (node.attrs.level === 2) {
          h2SecondPos = pos;
        }
      }
    });

    // 1. When nothing is folded
    expect(getFoldedHeadingKeys(doc, new Set())).toEqual([]);

    // 2. Fold first H2 and H3
    const folded = new Set([h2FirstPos, h3Pos]);
    const keys = getFoldedHeadingKeys(doc, folded);
    expect(keys).toEqual(["H2:Introduction#0", "H3:Details#0"]);

    // 3. Restore from keys
    const restored = restoreFoldedPositionsFromKeys(doc, keys);
    expect(restored.has(h2FirstPos)).toBe(true);
    expect(restored.has(h3Pos)).toBe(true);
    expect(restored.has(h2SecondPos)).toBe(false);

    // 4. Fold the second duplicate H2
    const secondFolded = new Set([h2SecondPos]);
    const secondKeys = getFoldedHeadingKeys(doc, secondFolded);
    expect(secondKeys).toEqual(["H2:Introduction#1"]);

    const restoredSecond = restoreFoldedPositionsFromKeys(doc, secondKeys);
    expect(restoredSecond.has(h2SecondPos)).toBe(true);
    expect(restoredSecond.has(h2FirstPos)).toBe(false);
  });

  it("handles storage persistence via getSavedFoldedHeadingKeys and saveSavedFoldedHeadingKeys", () => {
    const noteId = "test-note-123";
    const fileName = "test-file.md";

    // Clean initial
    clearSavedFoldedHeadingKeys(noteId, fileName);
    expect(getSavedFoldedHeadingKeys(noteId, fileName)).toEqual([]);

    // Save keys
    const keysToSave = ["H2:Overview#0", "H3:Details#0"];
    saveSavedFoldedHeadingKeys(noteId, keysToSave, fileName);

    // Read by noteId
    expect(getSavedFoldedHeadingKeys(noteId, fileName)).toEqual(keysToSave);
    // Read fallback by fileName alone
    expect(getSavedFoldedHeadingKeys(undefined, fileName)).toEqual(keysToSave);

    // Empty keys clears storage
    saveSavedFoldedHeadingKeys(noteId, [], fileName);
    expect(getSavedFoldedHeadingKeys(noteId, fileName)).toEqual([]);

    // Clean up
    clearSavedFoldedHeadingKeys(noteId, fileName);
  });

  it("remembers and restores heading fold state across tab close and app restart simulation", () => {
    const noteId = "persistent-note-tab-test";
    const fileName = "persistent-note.md";
    clearSavedFoldedHeadingKeys(noteId, fileName);

    const doc = createDoc([
      { type: "h1", text: "Document Title" },
      { type: "h2", text: "Persistent Section" },
      { type: "p", text: "Body paragraph 1" },
      { type: "p", text: "Body paragraph 2" },
      { type: "h2", text: "Second Section" },
      { type: "p", text: "Body paragraph 3" },
    ]);

    let h2PersistentPos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.textContent === "Persistent Section") {
        h2PersistentPos = pos;
      }
    });

    const plugins = HeadingToggle.configure({ enabled: true }).config.addProseMirrorPlugins?.call({
      options: { enabled: true },
    } as any);

    // Step 1: Open note for the first time
    let state = EditorState.create({
      doc,
      plugins: [plugins![0]],
    });

    // Notify plugin of the active note
    state = state.apply(
      state.tr.setMeta(headingTogglePluginKey, {
        setNoteInfo: { noteId, fileName, restore: true },
      })
    );

    let pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.size).toBe(0);

    // Step 2: User folds "Persistent Section"
    state = state.apply(state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2PersistentPos }));
    pluginState = headingTogglePluginKey.getState(state);
    expect(pluginState?.foldedPositions.has(h2PersistentPos)).toBe(true);

    // Verify it automatically persisted to localStorage
    const saved = getSavedFoldedHeadingKeys(noteId, fileName);
    expect(saved).toEqual(["H2:Persistent Section#0"]);

    // Step 3: Simulate closing tab or closing application!
    // In-memory state and maps are completely destroyed:
    state = null as any;
    pluginState = null as any;

    // Step 4: Reopen the note (like opening file or restarting app)
    // A fresh new EditorState is created with clean document
    const freshPlugins = HeadingToggle.configure({ enabled: true }).config.addProseMirrorPlugins?.call({
      options: { enabled: true },
    } as any);

    let reopenedState = EditorState.create({
      doc,
      plugins: [freshPlugins![0]],
    });

    // On reopen, Editor.tsx dispatches setNoteInfo with restore: true
    reopenedState = reopenedState.apply(
      reopenedState.tr.setMeta(headingTogglePluginKey, {
        setNoteInfo: { noteId, fileName, restore: true },
      })
    );

    const restoredPluginState = headingTogglePluginKey.getState(reopenedState);
    expect(restoredPluginState?.foldedPositions.has(h2PersistentPos)).toBe(true);

    // Verify decorations were restored for the folded heading
    const decos = restoredPluginState?.decorations.find(0, doc.content.size);
    // Heading node decoration (luno-heading-folded) + widget toggle button + badge + hidden child paragraphs
    const foldedClassDeco = decos?.find((d: any) => d.type?.attrs?.class === "luno-heading-folded");
    expect(foldedClassDeco).toBeDefined();

    const hiddenDecos = decos?.filter((d: any) => d.type?.attrs?.class === "luno-heading-folded-hidden");
    expect(hiddenDecos?.length).toBe(2); // Two paragraphs under Persistent Section are hidden

    // Step 5: User unfolds the section
    reopenedState = reopenedState.apply(
      reopenedState.tr.setMeta(headingTogglePluginKey, { toggleAt: h2PersistentPos })
    );
    expect(headingTogglePluginKey.getState(reopenedState)?.foldedPositions.size).toBe(0);

    // Verify localStorage was cleared
    expect(getSavedFoldedHeadingKeys(noteId, fileName)).toEqual([]);

    clearSavedFoldedHeadingKeys(noteId, fileName);
  });

  it("does not attach title tooltip attributes to toggle button or folded badge", () => {
    const openBtn = createToggleButton(undefined, 10, 2, false);
    expect(openBtn.getAttribute("title")).toBeNull();

    const foldedBtn = createToggleButton(undefined, 10, 2, true);
    expect(foldedBtn.getAttribute("title")).toBeNull();

    const badge = createFoldedBadge(undefined, 10);
    expect(badge.getAttribute("title")).toBeNull();
  });
});
