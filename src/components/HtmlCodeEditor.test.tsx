import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HtmlCodeEditor from "./HtmlCodeEditor";

describe("HtmlCodeEditor CSS Mode", () => {
  it("renders CSS code with syntax highlighting", () => {
    const cssCode = "/* Theme */\n.container { width: 100%; color: #14afa9; }";
    const handleChange = vi.fn();

    const { container } = render(
      <HtmlCodeEditor
        value={cssCode}
        onChange={handleChange}
        language="css"
      />
    );

    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.innerHTML).toContain("var(--hl-comment)");
    expect(pre?.innerHTML).toContain("var(--hl-tag)");
    expect(pre?.innerHTML).toContain("var(--hl-attr)");
    expect(pre?.innerHTML).toContain("var(--hl-string)");

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea?.value).toBe(cssCode);
  });

  it("triggers onChange when user edits CSS content", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <HtmlCodeEditor
        value="body { margin: 0; }"
        onChange={handleChange}
        language="css"
      />
    );

    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    if (textarea) {
      fireEvent.change(textarea, { target: { value: "body { margin: 10px; }" } });
      expect(handleChange).toHaveBeenCalledWith("body { margin: 10px; }");
    }
  });

  it("does not overwrite textarea when user is actively focused", () => {
    const handleChange = vi.fn();
    const { container, rerender } = render(
      <HtmlCodeEditor
        value="<h1>My Website</h1>"
        onChange={handleChange}
        language="html"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    // Focus the textarea and simulate typing partial deletion
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    fireEvent.change(textarea, { target: { value: "<h1>M Website</h1>" } });
    expect(textarea.value).toBe("<h1>M Website</h1>");

    // Parent re-renders with stale incoming value (e.g. from disk autosave)
    rerender(
      <HtmlCodeEditor
        value="<h1>My Website</h1>"
        onChange={handleChange}
        language="html"
      />
    );

    // Textarea value MUST NOT be clobbered back to the stale prop
    expect(textarea.value).toBe("<h1>M Website</h1>");
  });

  it("handles Tab key for indentation synchronously", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <HtmlCodeEditor
        value="<div>"
        onChange={handleChange}
        language="html"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    textarea.focus();
    textarea.selectionStart = 5;
    textarea.selectionEnd = 5;

    fireEvent.keyDown(textarea, { key: "Tab" });

    expect(handleChange).toHaveBeenCalledWith("<div>  ");
    expect(textarea.value).toBe("<div>  ");
  });

  it("ignores CRLF differences without resetting value", () => {
    const handleChange = vi.fn();
    const { container, rerender } = render(
      <HtmlCodeEditor
        value={"line1\nline2"}
        onChange={handleChange}
        language="html"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    // Rerender with Windows CRLF
    rerender(
      <HtmlCodeEditor
        value={"line1\r\nline2"}
        onChange={handleChange}
        language="html"
      />
    );

    expect(textarea.value).toBe("line1\nline2");
  });

  it("restores scroll position from memory and updates on scroll", () => {
    const handleChange = vi.fn();
    const noteId = "test-html-scroll-note";

    const { container, unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={"line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10"}
        onChange={handleChange}
        language="html"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    // Simulate user scroll
    Object.defineProperty(textarea, "scrollTop", { value: 350, writable: true });
    Object.defineProperty(textarea, "clientHeight", { value: 200, writable: true });
    Object.defineProperty(textarea, "scrollHeight", { value: 1000, writable: true });

    fireEvent.scroll(textarea);

    // Unmount (switching away from tab)
    unmount();

    // Remount (switching back to tab)
    const { container: container2 } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={"line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10"}
        onChange={handleChange}
        language="html"
      />
    );

    const textarea2 = container2.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea2).not.toBeNull();
    // After mounting, restoreScrollPosition should apply targetTop (350)
    expect(textarea2.scrollTop).toBe(350);
  });
});

