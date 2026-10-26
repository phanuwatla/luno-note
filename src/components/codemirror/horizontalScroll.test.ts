import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { computeDocMaxCols, documentWidthExtension } from "./horizontalScroll";

describe("documentWidthExtension", () => {
  it("computes max columns correctly across full document", () => {
    const text = "short line\nline with\ttab\n" + "x".repeat(120);
    const state = EditorState.create({ doc: text });
    const maxCols = computeDocMaxCols(state.doc, 4);
    expect(maxCols).toBe(120);
  });

  it("sets minWidth when document has lines exceeding available width", () => {
    // 30 short lines, followed by a very long line at line 31
    const shortLines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
    const longLine = "const veryLongLine = " + JSON.stringify("a".repeat(500)) + ";";
    const doc = shortLines + "\n" + longLine;

    const parent = document.createElement("div");
    // Mock parent width
    Object.defineProperty(parent, "clientWidth", { value: 400, configurable: true });
    document.body.appendChild(parent);

    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [documentWidthExtension({ enabled: true })],
      }),
      parent,
    });

    // Mock scrollDOM clientWidth
    Object.defineProperty(view.scrollDOM, "clientWidth", { value: 400, configurable: true });

    // Force update with doc change
    view.dispatch({ changes: { from: 0, insert: "// " } });

    const minWidth = view.contentDOM.style.minWidth;
    expect(minWidth).toBeTruthy();
    const minWidthNum = parseFloat(minWidth);
    expect(minWidthNum).toBeGreaterThan(400);

    view.destroy();
    parent.remove();
  });

  it("does not set minWidth when all lines fit within available width", () => {
    const doc = "short line 1\nshort line 2\nshort line 3";

    const parent = document.createElement("div");
    Object.defineProperty(parent, "clientWidth", { value: 800, configurable: true });
    document.body.appendChild(parent);

    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [documentWidthExtension({ enabled: true })],
      }),
      parent,
    });

    Object.defineProperty(view.scrollDOM, "clientWidth", { value: 800, configurable: true });
    view.dispatch({ changes: { from: 0, insert: "// " } });

    // When all lines are short, minWidth should not be set (no forced scroll)
    expect(view.contentDOM.style.minWidth).toBe("");

    view.destroy();
    parent.remove();
  });
});
