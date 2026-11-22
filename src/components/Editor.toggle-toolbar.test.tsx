import { describe, expect, it, vi, afterEach } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { Editor as CoreEditor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { NodeSelection } from "@tiptap/pm/state";
import {
  CustomParagraph,
  LivePreview,
  Toggle,
  getCleanCollapsedHtml,
  getToggleButtonMode,
  handleToggleClick,
  isToggleActive,
  livePreviewPluginKey,
  unwrapToggleAtPos,
} from "@/components/Editor";
import {
  blurFocusedToggleTitle,
  clearFocusedToggleTitle,
  consumePendingToggleTitleFocus,
  registerFocusedToggleTitle,
} from "@/components/editor/extensions/editorExtensions";
import { Highlight, TextAlign, TextColor, Underline } from "@/lib/tiptapCustomMarks";
import ToggleNodeView from "@/components/ToggleNodeView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

function createTestEditor(content: string, options?: { withLivePreview?: boolean }) {
  const extensions = [
    StarterKit.configure({ paragraph: false, underline: false }),
    CustomParagraph,
    Underline,
    Highlight,
    TextColor,
    TextAlign,
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    Toggle,
    ...(options?.withLivePreview ? [LivePreview.configure({ enabled: () => true })] : []),
  ];

  const editor = new CoreEditor({
    extensions,
    content,
  });

  return editor;
}

describe("toggle toolbar mode selection", () => {
  it("uses wrap mode when selection is not empty", () => {
    expect(getToggleButtonMode({ empty: false })).toBe("wrap");
  });

  it("uses insert mode when the cursor is collapsed", () => {
    expect(getToggleButtonMode({ empty: true })).toBe("insert");
  });

  it("inserts toggle with selected text as title when text is selected", () => {
    const runMock = vi.fn();
    const insertContentMock = vi.fn().mockReturnValue({ run: runMock });
    const focusMock = vi.fn().mockReturnValue({ insertContent: insertContentMock });
    const chainMock = vi.fn().mockReturnValue({ focus: focusMock });

    const mockEditor = {
      state: {
        selection: { from: 0, to: 10, empty: false },
        doc: { textBetween: () => "Selected Header Text" },
      },
      chain: chainMock,
    };

    handleToggleClick(mockEditor as unknown as Parameters<typeof handleToggleClick>[0]);

    expect(insertContentMock).toHaveBeenCalledWith({
      type: "toggle",
      attrs: { title: "Selected Header Text" },
      content: [{ type: "paragraph" }],
    });
    expect(runMock).toHaveBeenCalled();
    expect(consumePendingToggleTitleFocus()).toBe(true);
    expect(consumePendingToggleTitleFocus()).toBe(false);
  });
});

describe("toggle unwrap / cancel behavior", () => {
  const editorsToCleanup: CoreEditor[] = [];

  afterEach(() => {
    while (editorsToCleanup.length > 0) {
      const ed = editorsToCleanup.pop();
      if (ed) {
        clearFocusedToggleTitle(ed as unknown as Parameters<typeof clearFocusedToggleTitle>[0]);
        ed.destroy();
      }
    }
    document.body.innerHTML = "";
  });

  const track = (ed: CoreEditor) => {
    editorsToCleanup.push(ed);
    return ed;
  };

  it("unwraps toggle from inside body: title becomes plain paragraph and inner formatted content is lifted preserving all formatting", () => {
    const editor = track(
      createTestEditor(
        `<details open><summary>หัวข้อ Toggle</summary><div>` +
          `<p><strong>ตัวหนา</strong> และ <em>ตัวเอียง</em> <u>ขีดเส้นใต้</u> <mark>ไฮไลท์</mark> <span style="color: #e11d48">สีแดง</span></p>` +
          `<h2>หัวข้อย่อย</h2>` +
          `<ul><li><p><strong>รายการ 1</strong></p></li><li><p>รายการ 2</p></li></ul>` +
          `<blockquote><p>ข้อความอ้างอิง</p></blockquote>` +
          `<pre><code>const x = 42;</code></pre>` +
          `</div></details>`
      )
    );

    // Place cursor inside the first inner paragraph
    editor.commands.setTextSelection(4);
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);

    // No toggle remains
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(false);
    expect(editor.getHTML()).not.toContain("<details");

    const json = editor.getJSON();
    const blocks = (json.content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(blocks.length).toBe(6);

    // 1. Toggle title became normal plain paragraph
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].content).toEqual([{ type: "text", text: "หัวข้อ Toggle" }]);

    // 2. Formatted paragraph kept all marks intact
    expect(blocks[1].type).toBe("paragraph");
    const html = editor.getHTML();
    expect(html).toContain("<strong>ตัวหนา</strong>");
    expect(html).toContain("<em>ตัวเอียง</em>");
    expect(html).toContain("<u>ขีดเส้นใต้</u>");
    expect(html).toContain("<mark");
    expect(html).toContain("ไฮไลท์");
    expect(html).toContain("สีแดง");

    // 3. Heading, list, blockquote, codeBlock preserved intact
    expect(blocks[2].type).toBe("heading");
    expect(blocks[2].attrs?.level).toBe(2);
    expect(blocks[3].type).toBe("bulletList");
    expect(blocks[4].type).toBe("blockquote");
    expect(blocks[5].type).toBe("codeBlock");

    // Undo atomically restores the original Toggle with title & formatting
    editor.commands.undo();
    const restored = editor.getJSON().content ?? [];
    expect(restored[0].type).toBe("toggle");
    expect(restored[0].attrs?.title).toBe("หัวข้อ Toggle");
    expect(restored[0].attrs?.open).toBe(true);
    expect(restored[0].content?.length).toBe(5);
  });

  it("unwraps collapsed toggle when focused on title input, using live input value and revealing formatted content", () => {
    const editor = track(
      createTestEditor(
        `<p>ย่อหน้าด้านบน</p>` +
          `<details><summary>หัวข้อเดิม</summary><div>` +
          `<p><strong>เนื้อหาซ่อนอยู่</strong></p>` +
          `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>งานเสร็จแล้ว</p></li></ul>` +
          `</div></details>`
      )
    );

    // ProseMirror cursor is still outside the toggle (on the top paragraph)
    editor.commands.setTextSelection(2);
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(false);

    // Find toggle pos
    let togglePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "toggle") {
        togglePos = pos;
        return false;
      }
      return true;
    });
    expect(togglePos).toBeGreaterThan(0);

    // Simulate focusing the toggle title <input> with unsaved live edits
    const fakeInput = document.createElement("input");
    fakeInput.value = "หัวข้อที่แก้ล่าสุด";
    document.body.appendChild(fakeInput);
    fakeInput.focus();

    registerFocusedToggleTitle(
      editor as unknown as Parameters<typeof registerFocusedToggleTitle>[0],
      () => togglePos,
      fakeInput
    );

    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);

    const blocks = (editor.getJSON().content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(blocks.length).toBe(4);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].content).toEqual([{ type: "text", text: "ย่อหน้าด้านบน" }]);
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[1].content).toEqual([{ type: "text", text: "หัวข้อที่แก้ล่าสุด" }]);
    expect(blocks[2].type).toBe("paragraph");
    expect(editor.getHTML()).toContain("<strong>เนื้อหาซ่อนอยู่</strong>");
    expect(blocks[3].type).toBe("taskList");
    expect(editor.getHTML()).not.toContain("<details");
  });

  it("keeps toggle active for overflow menu after title input blurs to toolbar, and clears when blurring outside", () => {
    const editor = track(
      createTestEditor(
        `<p>ข้างนอก</p><details open><summary>หัวข้อ</summary><div><p><em>ข้างใน</em></p></div></details>`
      )
    );
    editor.commands.setTextSelection(2);

    let togglePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "toggle") {
        togglePos = pos;
        return false;
      }
      return true;
    });

    const toolbar = document.createElement("div");
    toolbar.setAttribute("data-editor-toolbar", "true");
    const menuBtn = document.createElement("button");
    toolbar.appendChild(menuBtn);
    document.body.appendChild(toolbar);

    const fakeInput = document.createElement("input");
    fakeInput.value = "หัวข้อ";
    document.body.appendChild(fakeInput);
    fakeInput.focus();

    registerFocusedToggleTitle(
      editor as unknown as Parameters<typeof registerFocusedToggleTitle>[0],
      () => togglePos,
      fakeInput
    );
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    // Move focus to toolbar menu button (simulating clicking "..." overflow trigger)
    menuBtn.focus();
    blurFocusedToggleTitle(
      editor as unknown as Parameters<typeof blurFocusedToggleTitle>[0],
      fakeInput,
      true
    );
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    // Clicking Toggle inside overflow menu unwraps the toggle
    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);
    expect(editor.getHTML()).not.toContain("<details");
    expect(editor.getHTML()).toContain("<p>หัวข้อ</p>");
    expect(editor.getHTML()).toContain("<em>ข้างใน</em>");
  });

  it("unwraps toggle when text inside toggle body is selected instead of inserting a nested toggle", () => {
    const editor = track(
      createTestEditor(
        `<details open><summary>หัวข้อ</summary><div><p><strong>คำสำคัญ</strong> และข้อความปกติ</p></div></details>`
      )
    );

    // Select "คำสำคัญ" inside the toggle body
    editor.commands.setTextSelection({ from: 2, to: 9 });
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);

    expect(editor.getHTML()).not.toContain("<details");
    expect(editor.getHTML()).toContain("<p>หัวข้อ</p>");
    expect(editor.getHTML()).toContain("<strong>คำสำคัญ</strong>");
    expect(editor.getHTML()).toContain("และข้อความปกติ");
    // Selection preserved on "คำสำคัญ"
    const { from, to } = editor.state.selection;
    expect(editor.state.doc.textBetween(from, to)).toBe("คำสำคัญ");
  });

  it("unwraps toggle on NodeSelection or cross-toggle selection without flattening inner text into a summary", () => {
    const editor = track(
      createTestEditor(
        `<p>ก่อนหน้า</p><details open><summary>ชื่อกลุ่ม</summary><div><p><strong>บรรทัด 1</strong></p><h3>หัวข้อ 3</h3></div></details><p>ถัดไป</p>`
      )
    );

    // Select entire document spanning across the toggle
    editor.commands.selectAll();
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);

    expect(editor.getHTML()).not.toContain("<details");
    const blocks = editor.getJSON().content ?? [];
    expect(blocks.map((b) => b.type)).toEqual([
      "paragraph", // ก่อนหน้า
      "paragraph", // ชื่อกลุ่ม
      "paragraph", // **บรรทัด 1**
      "heading",   // หัวข้อ 3
      "paragraph", // ถัดไป
    ]);
    expect(editor.getHTML()).toContain("<strong>บรรทัด 1</strong>");

    // Undo and also test NodeSelection directly on the toggle node
    editor.commands.undo();
    let togglePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "toggle") {
        togglePos = pos;
        return false;
      }
      return true;
    });
    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, togglePos))
    );
    expect(isToggleActive(editor as unknown as Parameters<typeof isToggleActive>[0])).toBe(true);

    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);
    expect(editor.getHTML()).not.toContain("<details");
    expect(editor.getHTML()).toContain("<p>ชื่อกลุ่ม</p>");
    expect(editor.getHTML()).toContain("<strong>บรรทัด 1</strong>");
  });

  it("handles untitled toggle, media-only toggle, titled empty toggle, and completely empty toggle cleanly", () => {
    const stripTrailingEmpty = (
      blocks: Array<{ type?: string; content?: unknown[] }> | undefined
    ) =>
      (blocks ?? []).filter(
        (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
      );

    // 1. Untitled toggle with formatted content -> no extra blank paragraph at top
    const ed1 = track(
      createTestEditor(`<details open><summary></summary><div><p><strong>หนา</strong></p><p>บรรทัด 2</p></div></details>`)
    );
    expect(unwrapToggleAtPos(ed1 as unknown as Parameters<typeof unwrapToggleAtPos>[0], 0)).toBe(true);
    expect(stripTrailingEmpty(ed1.getJSON().content).length).toBe(2);
    expect(ed1.getHTML()).toContain("<strong>หนา</strong>");

    // 2. Untitled toggle with image only (empty textContent) -> media preserved, never deleted
    const ed2 = track(
      createTestEditor(`<details open><summary></summary><div><img src="https://example.com/pic.png" /></div></details>`)
    );
    expect(unwrapToggleAtPos(ed2 as unknown as Parameters<typeof unwrapToggleAtPos>[0], 0)).toBe(true);
    expect(stripTrailingEmpty(ed2.getJSON().content).map((b) => b.type)).toEqual(["image"]);

    // 3. Titled toggle with single untouched empty paragraph -> clean single title paragraph
    const ed3 = track(
      createTestEditor(`<details><summary>หัวข้อเดี่ยว</summary><div><p></p></div></details>`)
    );
    expect(unwrapToggleAtPos(ed3 as unknown as Parameters<typeof unwrapToggleAtPos>[0], 0)).toBe(true);
    const ed3Blocks = stripTrailingEmpty(ed3.getJSON().content);
    expect(ed3Blocks.length).toBe(1);
    expect(ed3Blocks[0].type).toBe("paragraph");
    expect(ed3Blocks[0].content).toEqual([{ type: "text", text: "หัวข้อเดี่ยว" }]);

    // 4. Completely empty toggle -> single empty paragraph
    const ed4 = track(
      createTestEditor(`<details><summary></summary><div><p></p></div></details>`)
    );
    expect(unwrapToggleAtPos(ed4 as unknown as Parameters<typeof unwrapToggleAtPos>[0], 0)).toBe(true);
    expect(ed4.getJSON().content?.[0]?.type).toBe("paragraph");
    expect(ed4.getHTML()).not.toContain("<details");
  });

  it("unwraps nested toggles one level at a time from innermost to outermost", () => {
    const editor = track(
      createTestEditor(
        `<details open><summary>ชั้นนอก</summary><div>` +
          `<details open><summary>ชั้นใน</summary><div><p><strong>ลึกสุด</strong></p></div></details>` +
          `</div></details>`
      )
    );

    // Put cursor inside "ลึกสุด"
    let deepPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === "ลึกสุด") {
        deepPos = pos + 1;
        return false;
      }
      return true;
    });
    expect(deepPos).toBeGreaterThan(0);
    editor.commands.setTextSelection(deepPos);

    // First click unwraps inner toggle only
    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);
    const afterFirst = (editor.getJSON().content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(afterFirst.length).toBe(1);
    expect(afterFirst[0].type).toBe("toggle");
    expect(afterFirst[0].attrs?.title).toBe("ชั้นนอก");
    expect(afterFirst[0].content?.length).toBe(2);

    // Second click unwraps outer toggle
    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);
    expect(editor.getHTML()).not.toContain("<details");
    const blocks = (editor.getJSON().content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(blocks.length).toBe(3);
    expect(blocks[0].content).toEqual([{ type: "text", text: "ชั้นนอก" }]);
    expect(blocks[1].content).toEqual([{ type: "text", text: "ชั้นใน" }]);
    expect(editor.getHTML()).toContain("<strong>ลึกสุด</strong>");
  });

  it("collapses active LivePreview block inside toggle cleanly when unwrapping", () => {
    const editor = track(
      createTestEditor(
        `<details open><summary>หัวข้อ LP</summary><div><p><strong>ตัวหนา</strong> ปกติ</p></div></details>`,
        { withLivePreview: true }
      )
    );

    // Place cursor inside the formatted paragraph inside toggle so LivePreview activates
    editor.commands.setTextSelection(3);
    handleToggleClick(editor as unknown as Parameters<typeof handleToggleClick>[0]);

    expect(editor.getHTML()).not.toContain("<details");
    expect(editor.getHTML()).toContain("<p>หัวข้อ LP</p>");
    // Clean collapsed HTML must contain proper <strong> formatting, never raw ** syntax
    expect(getCleanCollapsedHtml(editor)).toContain("<strong>ตัวหนา</strong>");

    // Moving cursor to the plain title paragraph collapses LivePreview on the extracted block cleanly
    editor.commands.setTextSelection(2);
    expect(editor.getHTML()).toContain("<strong>ตัวหนา</strong>");
    const activeBlock = livePreviewPluginKey.getState(editor.state)?.activeBlock;
    expect(activeBlock?.blockPos).toBe(0);
    expect(activeBlock?.initialRawText).toBe("หัวข้อ LP");
    expect(activeBlock?.activeInline).toBeNull();
  });

  it("unwraps toggle cleanly when pressing Backspace at start of ToggleNodeView title input", () => {
    const editor = track(
      createTestEditor(
        `<details open><summary>หัวข้อแบ็คสเปซ</summary><div><p><strong>เนื้อหาด้านใน</strong></p><ul><li><p>ข้อ 1</p></li></ul></div></details>`
      )
    );

    const toggleNode = editor.state.doc.nodeAt(0);
    expect(toggleNode?.type.name).toBe("toggle");

    const { getByDisplayValue } = render(
      <AppSettingsProvider>
        <ToggleNodeView
          editor={editor as unknown as Parameters<typeof ToggleNodeView>[0]["editor"]}
          getPos={() => 0}
          node={toggleNode as unknown as Parameters<typeof ToggleNodeView>[0]["node"]}
          updateAttributes={vi.fn()}
        />
      </AppSettingsProvider>
    );

    const input = getByDisplayValue("หัวข้อแบ็คสเปซ") as HTMLInputElement;
    act(() => {
      input.focus();
      input.setSelectionRange(0, 0);
      fireEvent.keyDown(input, { key: "Backspace" });
    });

    expect(editor.getHTML()).not.toContain("<details");
    const blocks = (editor.getJSON().content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(blocks.length).toBe(3);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].content).toEqual([{ type: "text", text: "หัวข้อแบ็คสเปซ" }]);
    expect(blocks[1].type).toBe("paragraph");
    expect(editor.getHTML()).toContain("<strong>เนื้อหาด้านใน</strong>");
    expect(blocks[2].type).toBe("bulletList");
  });

  it("prevents Backspace at start of toggle body from ripping content above toggle or losing title, and handles Enter cleanly", () => {
    const editor = track(
      createTestEditor(
        `<p>ด้านบน</p><details open><summary>หัวข้อคงอยู่</summary><div><p>บรรทัด 1</p><p>บรรทัด 2</p></div></details>`
      )
    );

    // Move cursor to offset 0 of "บรรทัด 1" inside toggle
    let firstBodyPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === "บรรทัด 1") {
        firstBodyPos = pos;
        return false;
      }
      return true;
    });
    expect(firstBodyPos).toBeGreaterThan(0);
    editor.commands.setTextSelection(firstBodyPos);

    // Simulate pressing Backspace
    const handled = editor.view.someProp("handleKeyDown", (f) =>
      f(editor.view, new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }))
    );
    expect(handled).toBe(true);

    // Toggle and its title and both inner paragraphs must remain completely intact!
    const blocksAfterBs = (editor.getJSON().content ?? []).filter(
      (b, idx, arr) => !(idx === arr.length - 1 && b.type === "paragraph" && !b.content)
    );
    expect(blocksAfterBs.length).toBe(2);
    expect(blocksAfterBs[0].type).toBe("paragraph");
    expect(blocksAfterBs[1].type).toBe("toggle");
    expect(blocksAfterBs[1].attrs?.title).toBe("หัวข้อคงอยู่");
    expect(blocksAfterBs[1].content?.length).toBe(2);

    // Test Enter on a trailing empty paragraph exits toggle cleanly into a normal paragraph below
    const edExit = track(
      createTestEditor(
        `<details open><summary>หัวข้อ</summary><div><p>บรรทัด 1</p><p></p></div></details>`
      )
    );
    // Position inside the trailing empty paragraph
    const toggleNode = edExit.state.doc.nodeAt(0)!;
    const trailingEmptyPos = 1 + toggleNode.firstChild!.nodeSize + 1;
    edExit.commands.setTextSelection(trailingEmptyPos);

    const enterHandled = edExit.view.someProp("handleKeyDown", (f) =>
      f(edExit.view, new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    expect(enterHandled).toBe(true);

    const blocksAfterEnter = edExit.getJSON().content ?? [];
    expect(blocksAfterEnter[0].type).toBe("toggle");
    expect(blocksAfterEnter[0].content?.length).toBe(1);
    expect(blocksAfterEnter[1].type).toBe("paragraph");

    // Test Backspace on an empty paragraph directly after a collapsed toggle deletes it cleanly
    const edAfterCollapsed = track(
      createTestEditor(
        `<details><summary>พับอยู่</summary><div><p>ข้างใน</p></div></details><p></p><p>บรรทัดล่าง</p>`
      )
    );
    const collapsedToggle = edAfterCollapsed.state.doc.nodeAt(0)!;
    const emptyAfterPos = collapsedToggle.nodeSize + 1;
    edAfterCollapsed.commands.setTextSelection(emptyAfterPos);

    const bsAfterHandled = edAfterCollapsed.view.someProp("handleKeyDown", (f) =>
      f(edAfterCollapsed.view, new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }))
    );
    expect(bsAfterHandled).toBe(true);
    const blocksAfterDelete = edAfterCollapsed.getJSON().content ?? [];
    expect(blocksAfterDelete.length).toBe(2);
    expect(blocksAfterDelete[0].type).toBe("toggle");
    expect(blocksAfterDelete[1].type).toBe("paragraph");
    expect(blocksAfterDelete[1].content).toEqual([{ type: "text", text: "บรรทัดล่าง" }]);
  });

  it("renders real ReactNodeViewRenderer(ToggleNodeView) in EditorContent and unwraps cleanly without breaking DOM or formatting", async () => {
    let editorRef: ReturnType<typeof useEditor> = null;

    function TestHarness() {
      const ed = useEditor({
        extensions: [
          StarterKit.configure({ paragraph: false, underline: false }),
          CustomParagraph,
          Underline,
          Highlight,
          TextColor,
          TextAlign,
          TaskList,
          TaskItem.configure({ nested: true }),
          Image,
          Toggle,
        ],
        content:
          `<details open><summary>หัวข้อจริง</summary><div>` +
          `<p><strong>ตัวหนา</strong> และ <em>ตัวเอียง</em></p>` +
          `<ul><li><p>รายการ A</p></li><li><p>รายการ B</p></li></ul>` +
          `</div></details>`,
      });
      editorRef = ed;
      return <EditorContent editor={ed} />;
    }

    const { container, unmount } = render(
      <AppSettingsProvider>
        <TestHarness />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(container.querySelector("details > summary input")).not.toBeNull();
    });

    const input = container.querySelector("details > summary input") as HTMLInputElement;
    expect(input.value).toBe("หัวข้อจริง");

    // Focus title input, edit it slightly, and cancel via handleToggleClick (toolbar click)
    act(() => {
      input.focus();
      fireEvent.change(input, { target: { value: "หัวข้อจริงที่แก้ไข" } });
    });

    expect(isToggleActive(editorRef)).toBe(true);

    act(() => {
      handleToggleClick(editorRef);
    });

    // DOM must have zero <details>/<summary>/<input> left and all formatted content intact
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelector("summary")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
    expect(container.textContent).toContain("หัวข้อจริงที่แก้ไข");
    expect(container.querySelector("strong")?.textContent).toBe("ตัวหนา");
    expect(container.querySelector("em")?.textContent).toBe("ตัวเอียง");
    expect(container.querySelectorAll("ul li").length).toBe(2);

    unmount();
  });
});
