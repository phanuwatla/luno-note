import { describe, it, expect, beforeEach } from "vitest";
import { Editor as CoreEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorState } from "@tiptap/pm/state";
import HeadingToggle, {
  headingTogglePluginKey,
  getSavedFoldedHeadingKeys,
  clearSavedFoldedHeadingKeys,
} from "./headingToggle";

describe("Tab switching with HeadingToggle in TipTap Editor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("checks if setContent does not wipe out Note A's localStorage folds", () => {
    const noteA = { id: "note-a", fileName: "noteA.md" };
    const noteB = { id: "note-b", fileName: "noteB.md" };

    const editor = new CoreEditor({
      extensions: [
        StarterKit,
        HeadingToggle.configure({
          enabled: true,
          noteId: noteA.id,
          fileName: noteA.fileName,
        }),
      ],
      content: `<h1>Title A</h1><h2>Section A</h2><p>Content A</p>`,
    });

    const noteEditorStateMap = new Map<string, EditorState>();

    // onCreate flow:
    const cleanStateA = EditorState.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanStateA);
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteA.id, fileName: noteA.fileName, restore: true },
        })
    );
    noteEditorStateMap.set(noteA.id, editor.state);

    // Find H2 pos in Note A
    let h2PosA = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.attrs.level === 2) {
        h2PosA = pos;
        return false;
      }
      return true;
    });

    // User folds Section A
    editor.view.dispatch(
      editor.state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2PosA })
    );

    expect(getSavedFoldedHeadingKeys(noteA.id, noteA.fileName)).toContain("H2:Section A#0");

    // NOW: user switches to Note B:
    noteEditorStateMap.set(noteA.id, editor.state);

    // Pre-switch notification in Editor.tsx
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta("isSync", true)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteB.id, fileName: noteB.fileName, restore: false },
        })
    );

    // Loading Note B in Editor.tsx line 8249:
    (editor.commands.setContent as any)(`<h1>Title B</h1><h2>Section B</h2><p>Content B</p>`, false, { preserveWhitespace: "full" });

    // CHECK NOTE A's LOCALSTORAGE RIGHT AFTER SETCONTENT!
    const noteAFoldsAfterSetContent = getSavedFoldedHeadingKeys(noteA.id, noteA.fileName);
    expect(noteAFoldsAfterSetContent).toEqual(["H2:Section A#0"]);
  });

  it("preserves folded state back and forth across tab switches", () => {
    const noteA = { id: "note-a", fileName: "noteA.md" };
    const noteB = { id: "note-b", fileName: "noteB.md" };

    const editor = new CoreEditor({
      extensions: [
        StarterKit,
        HeadingToggle.configure({
          enabled: true,
          noteId: noteA.id,
          fileName: noteA.fileName,
        }),
      ],
      content: `<h1>Title A</h1><h2>Section A</h2><p>Content A</p>`,
    });

    const noteEditorStateMap = new Map<string, EditorState>();

    // 1. Initial load Note A
    const cleanStateA = EditorState.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanStateA);
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteA.id, fileName: noteA.fileName, restore: true },
        })
    );
    noteEditorStateMap.set(noteA.id, editor.state);

    // Find H2 pos in Note A
    let h2PosA = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.attrs.level === 2) {
        h2PosA = pos;
        return false;
      }
      return true;
    });

    // User folds Section A in Note A
    editor.view.dispatch(
      editor.state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2PosA })
    );

    expect(headingTogglePluginKey.getState(editor.state)?.foldedPositions.has(h2PosA)).toBe(true);

    // 2. Switch from Tab A to Tab B
    noteEditorStateMap.set(noteA.id, editor.state);

    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta("isSync", true)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteB.id, fileName: noteB.fileName, restore: false },
        })
    );

    (editor.commands.setContent as any)(`<h1>Title B</h1><h2>Section B</h2><p>Content B</p>`, false, { preserveWhitespace: "full" });
    const cleanStateB = EditorState.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanStateB);
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteB.id, fileName: noteB.fileName, restore: true },
        })
    );
    noteEditorStateMap.set(noteB.id, editor.state);

    // Find H2 pos in Note B
    let h2PosB = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.attrs.level === 2) {
        h2PosB = pos;
        return false;
      }
      return true;
    });

    // User folds Section B in Note B
    editor.view.dispatch(
      editor.state.tr.setMeta(headingTogglePluginKey, { toggleAt: h2PosB })
    );
    expect(headingTogglePluginKey.getState(editor.state)?.foldedPositions.has(h2PosB)).toBe(true);
    expect(getSavedFoldedHeadingKeys(noteB.id, noteB.fileName)).toContain("H2:Section B#0");

    // 3. Switch back to Note A!
    noteEditorStateMap.set(noteB.id, editor.state);

    const savedStateA = noteEditorStateMap.get(noteA.id);
    expect(savedStateA).toBeDefined();

    editor.view.updateState(savedStateA!);
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteA.id, fileName: noteA.fileName, restore: true },
        })
    );

    // Note A must STILL be folded!
    const pluginStateAAfterSwitch = headingTogglePluginKey.getState(editor.state);
    expect(pluginStateAAfterSwitch?.foldedPositions.has(h2PosA)).toBe(true);

    // And Note A's decorations are present
    const decosA = pluginStateAAfterSwitch?.decorations.find(0, editor.state.doc.content.size);
    const hiddenDecosA = decosA?.filter((d: any) => d.type?.attrs?.class === "luno-heading-folded-hidden");
    expect(hiddenDecosA?.length).toBeGreaterThan(0);

    // 4. Switch back to Note B!
    noteEditorStateMap.set(noteA.id, editor.state);

    const savedStateB = noteEditorStateMap.get(noteB.id);
    expect(savedStateB).toBeDefined();

    editor.view.updateState(savedStateB!);
    editor.view.dispatch(
      editor.state.tr
        .setMeta("addToHistory", false)
        .setMeta(headingTogglePluginKey, {
          setNoteInfo: { noteId: noteB.id, fileName: noteB.fileName, restore: true },
        })
    );

    // Note B must STILL be folded!
    const pluginStateBAfterSwitch = headingTogglePluginKey.getState(editor.state);
    expect(pluginStateBAfterSwitch?.foldedPositions.has(h2PosB)).toBe(true);
  });
});
