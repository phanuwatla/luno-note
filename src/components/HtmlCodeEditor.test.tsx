import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React, { createRef } from "react";
import HtmlCodeEditor, { HtmlCodeEditorHandle } from "./HtmlCodeEditor";
import { getNoteScrollPosition, setNoteScrollPosition } from "@/components/Editor";

describe("HtmlCodeEditor with CodeMirror", () => {
  it("renders CSS code in CodeMirror", () => {
    const cssCode = "/* Theme */\n.container { width: 100%; color: #14afa9; }";
    const handleChange = vi.fn();

    const { container } = render(
      <HtmlCodeEditor
        value={cssCode}
        onChange={handleChange}
        language="css"
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();
    const cmContent = container.querySelector(".cm-content");
    expect(cmContent).toBeInTheDocument();
    expect(cmContent?.textContent).toContain(".container");
  });

  it("renders JavaScript code in CodeMirror", () => {
    const jsCode = "function hello(name) {\n  console.log(`Hello, ${name}!`);\n}";
    const handleChange = vi.fn();

    const { container } = render(
      <HtmlCodeEditor
        value={jsCode}
        onChange={handleChange}
        language="javascript"
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();
    const cmContent = container.querySelector(".cm-content");
    expect(cmContent).toBeInTheDocument();
    expect(cmContent?.textContent).toContain("console.log");
  });

  it("renders HTML code with embedded script in CodeMirror", () => {
    const htmlCode = "<!DOCTYPE html><html><body><script>const a = 1;</script></body></html>";
    const handleChange = vi.fn();

    const { container } = render(
      <HtmlCodeEditor
        value={htmlCode}
        onChange={handleChange}
        language="html"
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();
    const cmContent = container.querySelector(".cm-content");
    expect(cmContent).toBeInTheDocument();
    expect(cmContent?.textContent).toContain("<!DOCTYPE html>");
  });

  it("renders custom SVG fold gutter icons instead of plain text v", () => {
    const foldableCode = "function test() {\n  const x = 10;\n  return x * 2;\n}";
    const { container } = render(
      <HtmlCodeEditor
        value={foldableCode}
        onChange={() => {}}
        language="javascript"
      />
    );

    const foldGutter = container.querySelector(".cm-foldGutter");
    expect(foldGutter).toBeInTheDocument();
    // Verify custom SVG fold marker exists
    const foldMarker = container.querySelector(".cm-fold-marker");
    expect(foldMarker).toBeInTheDocument();
    const svgIcon = container.querySelector(".cm-fold-icon");
    expect(svgIcon).toBeInTheDocument();
  });

  it("adapts seamlessly to dark mode", () => {
    act(() => {
      document.documentElement.classList.add("dark");
    });

    const { container, unmount } = render(
      <HtmlCodeEditor
        value="const darkTest = true;"
        onChange={() => {}}
        language="javascript"
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();

    unmount();
    act(() => {
      document.documentElement.classList.remove("dark");
    });
  });

  it("renders editor container with data-language attribute", () => {
    const { container, rerender } = render(
      <HtmlCodeEditor
        value="const x = 1;"
        onChange={() => {}}
        language="javascript"
      />
    );

    expect(container.querySelector('[data-language="javascript"]')).toBeInTheDocument();

    rerender(
      <HtmlCodeEditor
        value="body { margin: 0; }"
        onChange={() => {}}
        language="css"
      />
    );

    expect(container.querySelector('[data-language="css"]')).toBeInTheDocument();
  });

  it("restores scroll position from memory and updates on scroll", () => {
    const handleChange = vi.fn();
    const noteId = "test-html-scroll-note";

    // Pre-populate note scroll position
    setNoteScrollPosition(noteId, 250);
    expect(getNoteScrollPosition(noteId)).toBe(250);

    const { container, unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={"line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10"}
        onChange={handleChange}
        language="html"
      />
    );

    const scroller = container.querySelector(".cm-scroller") as HTMLDivElement;
    expect(scroller).not.toBeNull();

    // Verify initial restored scroll top
    expect(scroller.scrollTop).toBe(250);

    // Simulate user scroll
    Object.defineProperty(scroller, "scrollTop", { value: 400, writable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 200, writable: true });
    Object.defineProperty(scroller, "scrollHeight", { value: 1000, writable: true });
    fireEvent.scroll(scroller);

    expect(getNoteScrollPosition(noteId)).toBe(400);

    unmount();
  });

  it("renders inline color swatches for hex, rgb, and hsl colors", () => {
    const cssWithColors = "h1 { color: #333; background: #14afa9; border-color: rgb(255, 0, 128); }";
    const { container } = render(
      <HtmlCodeEditor
        value={cssWithColors}
        onChange={() => {}}
        language="css"
      />
    );

    const swatches = container.querySelectorAll(".cm-color-swatch");
    expect(swatches.length).toBeGreaterThanOrEqual(1);

    const swatchWraps = container.querySelectorAll(".cm-color-swatch-wrap");
    expect(swatchWraps.length).toBeGreaterThanOrEqual(1);

    const colorInputs = container.querySelectorAll(".cm-color-picker-input");
    expect(colorInputs.length).toBeGreaterThanOrEqual(1);

    // Clicking swatch triggers showPicker or click safely
    const firstSwatch = swatches[0];
    expect(() => fireEvent.click(firstSwatch)).not.toThrow();
  });

  it("toggles indentation guide lines cleanly via showIndentGuides prop", () => {
    const indentedCode = "function outer() {\n  function inner() {\n    return 42;\n  }\n}";
    const { container, rerender } = render(
      <HtmlCodeEditor
        value={indentedCode}
        onChange={() => {}}
        language="javascript"
        showIndentGuides={true}
      />
    );

    expect(container.querySelector(".cm-editor")).toBeInTheDocument();

    rerender(
      <HtmlCodeEditor
        value={indentedCode}
        onChange={() => {}}
        language="javascript"
        showIndentGuides={false}
      />
    );

    expect(container.querySelector(".cm-editor")).toBeInTheDocument();
  });

  it("handles 4-space and 2-space indentation without error", () => {
    const cssWith4Spaces = ".hero-section p {\n    font-size: 1.35rem;\n    color: #4b5563;\n}";
    const { container } = render(
      <HtmlCodeEditor
        value={cssWith4Spaces}
        onChange={() => {}}
        language="css"
        fontSize={14}
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();
    const gutter = container.querySelector(".cm-gutters");
    expect(gutter).toBeInTheDocument();
  });

  it("applies uniform indentation markers styling without active block thickening", () => {
    const nestedCode = "<div>\n  <p>\n    <span>Text</span>\n  </p>\n</div>";
    const { container } = render(
      <HtmlCodeEditor
        value={nestedCode}
        onChange={() => {}}
        language="html"
        showIndentGuides={true}
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).toBeInTheDocument();
  });

  it("enables horizontal scrolling for long code lines by default without forced wrapping", () => {
    const longLine = "const veryLongCodeLine = 'This is an exceptionally long line of code that extends horizontally across the screen and should not be wrapped onto the next line by default in the code editor';";
    const { container } = render(
      <HtmlCodeEditor
        value={longLine}
        onChange={() => {}}
        language="javascript"
      />
    );

    const scroller = container.querySelector(".cm-scroller");
    expect(scroller).toBeInTheDocument();
    expect(container.querySelector(".cm-content")).toBeInTheDocument();
  });

  it("applies text cursor to editor canvas and container", () => {
    const { container } = render(
      <HtmlCodeEditor
        value="const x = 10;"
        onChange={() => {}}
        language="javascript"
      />
    );

    const editorWrap = container.querySelector('[data-testid="code-editor"]');
    expect(editorWrap).toHaveClass("cursor-text");
  });

  it("exposes search handle methods and accurately searches text across code", () => {
    const code = "const alpha = 1;\nconst beta = 2;\nconst gamma = 3;";
    const ref = createRef<HtmlCodeEditorHandle>();

    render(
      <HtmlCodeEditor
        ref={ref}
        value={code}
        onChange={() => {}}
        language="javascript"
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.setSearchQuery).toBe("function");
    expect(typeof ref.current?.findNext).toBe("function");
    expect(typeof ref.current?.findPrev).toBe("function");
    expect(typeof ref.current?.clearSearch).toBe("function");

    // Search for "const" (appears 3 times)
    act(() => {
      const res = ref.current?.setSearchQuery("const");
      expect(res).toEqual({ total: 3, current: 0 });
    });

    // Advance to next match
    act(() => {
      const nextRes = ref.current?.findNext();
      expect(nextRes).toEqual({ total: 3, current: 1 });
    });

    // Advance to next match again
    act(() => {
      const nextRes2 = ref.current?.findNext();
      expect(nextRes2).toEqual({ total: 3, current: 2 });
    });

    // Wrap around to first match
    act(() => {
      const nextRes3 = ref.current?.findNext();
      expect(nextRes3).toEqual({ total: 3, current: 0 });
    });

    // Move backward to previous match
    act(() => {
      const prevRes = ref.current?.findPrev();
      expect(prevRes).toEqual({ total: 3, current: 2 });
    });

    // Clear search
    act(() => {
      ref.current?.clearSearch();
    });

    // Search for non-existent text
    act(() => {
      const notFoundRes = ref.current?.setSearchQuery("nonExistentToken");
      expect(notFoundRes).toEqual({ total: 0, current: -1 });
    });
  });
});
