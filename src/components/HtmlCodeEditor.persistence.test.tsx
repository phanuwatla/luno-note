import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import HtmlCodeEditor from "./HtmlCodeEditor";
import { codeEditorContentMap, clearNoteEditorHistory } from "@/components/Editor";

describe("HtmlCodeEditor and Code Persistence", () => {
  const storage: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => {
      storage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
    key: (i: number) => Object.keys(storage)[i] ?? null,
    length: 0,
  };

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    codeEditorContentMap.clear();
    mockStorage.clear();
  });

  it("calls onBlur on unmount and blur", () => {
    const handleBlur = vi.fn();
    const { container, unmount } = render(
      <HtmlCodeEditor
        noteId="test-note-blur"
        value="<p>Test</p>"
        onChange={() => {}}
        onBlur={handleBlur}
        language="html"
      />
    );

    const cmContent = container.querySelector(".cm-content");
    expect(cmContent).not.toBeNull();

    if (cmContent) {
      fireEvent.blur(cmContent);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    }

    unmount();
    // onBlur should be called again on unmount to flush any pending edits
    expect(handleBlur).toHaveBeenCalledTimes(2);
  });

  it("preserves updated code in codeEditorContentMap when simulating tab switches", () => {
    const noteId = "html-note-tab-switch";
    const initialContent = "<h1>Title</h1>";
    const updatedContent = "<h1>Updated Title</h1>\n<p>New paragraph</p>";

    // 1. Initial render of the HTML file
    const handleChange = vi.fn((val: string) => {
      codeEditorContentMap.set(noteId, val);
      localStorage.setItem(`luno_backup_${noteId}`, val);
    });

    const { unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialContent}
        onChange={handleChange}
        language="html"
      />
    );

    // Simulate edit
    handleChange(updatedContent);
    expect(handleChange).toHaveBeenCalledWith(updatedContent);
    expect(codeEditorContentMap.get(noteId)).toBe(updatedContent);

    // 2. User switches to another tab (unmount current editor)
    unmount();

    // 3. User switches back to the HTML tab: value is read from codeEditorContentMap
    const { container: container2 } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialContent}
        onChange={handleChange}
        language="html"
      />
    );

    const cmContent2 = container2.querySelector(".cm-content");
    expect(cmContent2?.textContent).toContain("Updated Title");
  });

  it("retains CSS code across simulated preview and tab switching", () => {
    const noteId = "css-note-preview-switch";
    const initialCss = "body { background: white; }";
    const editedCss = "body { background: #121212; color: #fff; }";

    const handleChange = vi.fn((val: string) => {
      codeEditorContentMap.set(noteId, val);
    });

    const { unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialCss}
        onChange={handleChange}
        language="css"
      />
    );

    // Simulate edit
    handleChange(editedCss);
    expect(codeEditorContentMap.get(noteId)).toBe(editedCss);

    unmount();

    // Reopen CSS file
    const { container: container2 } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialCss}
        onChange={handleChange}
        language="css"
      />
    );

    const cmContent2 = container2.querySelector(".cm-content");
    expect(cmContent2?.textContent).toContain("#121212");
  });

  it("retains JavaScript code across simulated tab switching", () => {
    const noteId = "js-note-preview-switch";
    const initialJs = "const a = 1;";
    const editedJs = "const a = 1;\nfunction calculate() { return a * 42; }";

    const handleChange = vi.fn((val: string) => {
      codeEditorContentMap.set(noteId, val);
    });

    const { unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialJs}
        onChange={handleChange}
        language="javascript"
      />
    );

    // Simulate edit
    handleChange(editedJs);
    expect(codeEditorContentMap.get(noteId)).toBe(editedJs);

    unmount();

    // Reopen JS file
    const { container: container2 } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialJs}
        onChange={handleChange}
        language="javascript"
      />
    );

    const cmContent2 = container2.querySelector(".cm-content");
    expect(cmContent2?.textContent).toContain("calculate");
  });

  it("clears codeEditorContentMap entry when clearNoteEditorHistory is called on tab close", () => {
    const noteId = "note-close-test";
    codeEditorContentMap.set(noteId, "<h1>Some content</h1>");
    expect(codeEditorContentMap.has(noteId)).toBe(true);

    clearNoteEditorHistory(noteId);
    expect(codeEditorContentMap.has(noteId)).toBe(false);
  });
});
