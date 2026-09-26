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

  it("calls onBlur on textarea blur and on unmount", () => {
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

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    fireEvent.blur(textarea);
    expect(handleBlur).toHaveBeenCalledTimes(1);

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

    const { container, unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialContent}
        onChange={handleChange}
        language="html"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: updatedContent } });
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

    const textarea2 = container2.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea2.value).toBe(updatedContent);
  });

  it("retains CSS code across simulated preview and tab switching", () => {
    const noteId = "css-note-preview-switch";
    const initialCss = "body { background: white; }";
    const editedCss = "body { background: #121212; color: #fff; }";

    const handleChange = vi.fn((val: string) => {
      codeEditorContentMap.set(noteId, val);
    });

    const { container, unmount } = render(
      <HtmlCodeEditor
        noteId={noteId}
        value={codeEditorContentMap.get(noteId) ?? initialCss}
        onChange={handleChange}
        language="css"
      />
    );

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: editedCss } });
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

    const textarea2 = container2.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea2.value).toBe(editedCss);
  });

  it("clears codeEditorContentMap entry when clearNoteEditorHistory is called on tab close", () => {
    const noteId = "note-close-test";
    codeEditorContentMap.set(noteId, "<h1>Some content</h1>");
    expect(codeEditorContentMap.has(noteId)).toBe(true);

    clearNoteEditorHistory(noteId);
    expect(codeEditorContentMap.has(noteId)).toBe(false);
  });
});
