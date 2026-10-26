import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { uniformIndentGuides } from "./indentGuides";

describe("uniformIndentGuides extension", () => {
  it("creates uniform 1px DOM elements with integer pixel coordinates", () => {
    const doc = `function test() {
  const a = 1;
  if (a) {
    const b = 2;
  }
}`;

    const parent = document.createElement("div");
    document.body.appendChild(parent);

    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [uniformIndentGuides({ hideFirstIndent: false })],
      }),
      parent,
    });

    const guides = parent.querySelectorAll(".cm-indent-guide");
    expect(guides.length).toBeGreaterThanOrEqual(1);

    // Verify all lines have 1 physical pixel width and valid left positioning
    guides.forEach((g) => {
      const el = g as HTMLElement;
      const leftStr = el.style.left;
      expect(leftStr).toMatch(/^-?[\d.]+px$/);
      const widthStr = el.style.width;
      expect(widthStr).toMatch(/^[\d.]+px$/);
      const widthVal = parseFloat(widthStr);
      expect(widthVal).toBeGreaterThan(0);
      expect(widthVal).toBeLessThanOrEqual(1);
    });

    view.destroy();
    parent.remove();
  });

  it("handles blank lines by continuing block indentation", () => {
    const doc = `<section>
  <p>First</p>

  <p>Second</p>
</section>`;

    const parent = document.createElement("div");
    document.body.appendChild(parent);

    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [uniformIndentGuides({ hideFirstIndent: false })],
      }),
      parent,
    });

    // Check that blank line (line 3) receives guide elements
    const lines = parent.querySelectorAll(".cm-line");
    expect(lines.length).toBe(5);

    view.destroy();
    parent.remove();
  });

  it("highlights active block indent guide with cm-indent-guide-active when focused", () => {
    const doc = `function test() {
  const a = 1;
  if (a) {
    const b = 2;
    const c = 3;
  }
}`;

    const parent = document.createElement("div");
    document.body.appendChild(parent);

    // Position cursor at line 4 ("    const b = 2;"), inside nested if block
    const line4Pos = doc.indexOf("const b = 2");

    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: line4Pos },
        extensions: [uniformIndentGuides({ hideFirstIndent: false, highlightActiveBlock: true })],
      }),
      parent,
    });

    const activeGuides = parent.querySelectorAll(".cm-indent-guide-active");
    expect(activeGuides.length).toBeGreaterThanOrEqual(1);

    // Active guides should have cm-indent-guide class as well
    activeGuides.forEach((g) => {
      expect(g.classList.contains("cm-indent-guide")).toBe(true);
      expect(g.classList.contains("cm-indent-guide-active")).toBe(true);
    });

    // Inactive guides also exist on outer indentation
    const inactiveGuides = parent.querySelectorAll(".cm-indent-guide:not(.cm-indent-guide-active)");
    expect(inactiveGuides.length).toBeGreaterThanOrEqual(1);

    // Moving cursor to outer block (line 2: "  const a = 1;") updates active guide
    const line2Pos = doc.indexOf("const a = 1");
    view.dispatch({
      selection: { anchor: line2Pos },
    });

    const updatedActiveGuides = parent.querySelectorAll(".cm-indent-guide-active");
    expect(updatedActiveGuides.length).toBeGreaterThanOrEqual(1);

    view.destroy();
    parent.remove();
  });

  it("preserves active block guide across empty lines within the focused block", () => {
    const doc = `<div>
  <p>First</p>

  <p>Second</p>
</div>`;

    const parent = document.createElement("div");
    document.body.appendChild(parent);

    const line2Pos = doc.indexOf("<p>First");

    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: line2Pos },
        extensions: [uniformIndentGuides({ hideFirstIndent: false, highlightActiveBlock: true })],
      }),
      parent,
    });

    const activeGuides = parent.querySelectorAll(".cm-indent-guide-active");
    // Should highlight lines 2, 3 (empty line), and 4 in the <div> block
    expect(activeGuides.length).toBeGreaterThanOrEqual(2);

    view.destroy();
    parent.remove();
  });

  it("correctly highlights the inner block guide line when focusing a closing tag like </div>", () => {
    const doc = `<div class="book-card">
  <div class="content">
    <h3>Title</h3>
    <p>Description</p>
  </div>
</div>`;

    const parent = document.createElement("div");
    document.body.appendChild(parent);

    // Position cursor at line 5: "  </div>" (closing tag of the inner .content div)
    const closingDivPos = doc.indexOf("  </div>") + 2;

    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: closingDivPos },
        extensions: [uniformIndentGuides({ hideFirstIndent: false, highlightActiveBlock: true })],
      }),
      parent,
    });

    const activeGuides = parent.querySelectorAll(".cm-indent-guide-active");
    // Should highlight the level 2 guide (Column 2) on lines 3 and 4 (<h3> and <p>), NOT the outer Column 0 guide
    expect(activeGuides.length).toBeGreaterThanOrEqual(2);

    // Verify the active guide has left > 4px (i.e. is Column 2, not Column 0 at 4px)
    activeGuides.forEach((g) => {
      const leftVal = parseFloat((g as HTMLElement).style.left);
      expect(leftVal).toBeGreaterThan(4);
    });

    view.destroy();
    parent.remove();
  });
});
