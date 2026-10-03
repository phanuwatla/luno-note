import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Editor from "./Editor";
import { AppSettingsProvider, useAppSettings } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";
import * as geminiApi from "@/lib/geminiApi";

// Polyfill localStorage for Node/JSDOM
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => { storageMap.set(key, String(val)); },
  removeItem: (key: string) => { storageMap.delete(key); },
  clear: () => { storageMap.clear(); },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() { return storageMap.size; },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

vi.mock("@/lib/geminiApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/geminiApi")>("@/lib/geminiApi");
  return {
    ...actual,
    runGeminiAction: vi.fn().mockImplementation((_key, _action, text) => {
      return Promise.resolve({
        result: `AI Output: ${text}`,
        modelUsed: "gemini-2.5-flash",
      });
    }),
  };
});

const mockNote: Note = {
  id: "test-note-full-ai",
  title: "Test Note",
  content: "First paragraph\n\nSecond paragraph",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  fileName: "test.md",
  contentFormat: "markdown",
};

function EditorWithAiSettings({ note }: { note: Note }) {
  const { updateSetting } = useAppSettings();

  React.useEffect(() => {
    updateSetting("geminiApiKey", "fake-api-key");
  }, [updateSetting]);

  return (
    <Editor
      note={note}
      notes={[note]}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      onOpenSidebar={vi.fn()}
    />
  );
}

describe("Editor Luno AI content targeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMap.clear();
  });

  it("operates on the ENTIRE note content when no text is selected", async () => {
    render(
      <AppSettingsProvider>
        <EditorWithAiSettings note={mockNote} />
      </AppSettingsProvider>
    );

    // Wait until the editor is loaded and ready
    const aiBtn = await screen.findByRole("button", { name: /Luno AI/i });
    await waitFor(() => {
      expect(aiBtn).not.toBeDisabled();
    });

    // Trigger AI action with no text selection
    window.dispatchEvent(
      new CustomEvent("luno:trigger-ai-action", {
        detail: { action: "improve" },
      })
    );

    await waitFor(() => {
      expect(geminiApi.runGeminiAction).toHaveBeenCalled();
    });

    const callArgs = (geminiApi.runGeminiAction as any).mock.calls[0];
    expect(callArgs[0]).toBe("fake-api-key");
    expect(callArgs[1]).toBe("improve");
    // Verify targetText contains BOTH paragraphs from the entire content
    expect(callArgs[2]).toContain("First paragraph");
    expect(callArgs[2]).toContain("Second paragraph");
  });

  it("preserves consecutive checkboxes in Markdown when extracting content for Luno AI", async () => {
    const checklistNote: Note = {
      id: "test-note-checklist",
      title: "Checklist Note",
      content: "- [ ] First task\n- [x] Second task\n- [ ] Third task",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "checklist.md",
      contentFormat: "markdown",
    };

    render(
      <AppSettingsProvider>
        <EditorWithAiSettings note={checklistNote} />
      </AppSettingsProvider>
    );

    const aiBtn = await screen.findByRole("button", { name: /Luno AI/i });
    await waitFor(() => {
      expect(aiBtn).not.toBeDisabled();
    });

    window.dispatchEvent(
      new CustomEvent("luno:trigger-ai-action", {
        detail: { action: "improve" },
      })
    );

    await waitFor(() => {
      expect(geminiApi.runGeminiAction).toHaveBeenCalled();
    });

    const callArgs = (geminiApi.runGeminiAction as any).mock.calls[0];
    const extractedMarkdown = callArgs[2];

    // Assert that consecutive checkboxes were not lost or converted to plain text
    expect(extractedMarkdown).toContain("- [ ] First task");
    expect(extractedMarkdown).toContain("- [x] Second task");
    expect(extractedMarkdown).toContain("- [ ] Third task");
  });

  it("accepting diff with checkboxes renders real interactive taskItem elements in TipTap", async () => {
    const checklistNote: Note = {
      id: "test-note-diff-accept",
      title: "Diff Note",
      content: "- [ ] Old task 1\n- [ ] Old task 2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "diff.md",
      contentFormat: "markdown",
    };

    (geminiApi.runGeminiAction as any).mockResolvedValueOnce({
      result: "- [ ] Improved task 1\n- [x] Improved task 2",
      modelUsed: "gemini-2.5-flash",
    });

    const { container } = render(
      <AppSettingsProvider>
        <EditorWithAiSettings note={checklistNote} />
      </AppSettingsProvider>
    );

    const aiBtn = await screen.findByRole("button", { name: /Luno AI/i });
    await waitFor(() => {
      expect(aiBtn).not.toBeDisabled();
    });

    window.dispatchEvent(
      new CustomEvent("luno:trigger-ai-action", {
        detail: { action: "improve" },
      })
    );

    // Wait for AI Assistant panel to show accept button
    const acceptBtn = await screen.findByRole("button", { name: /ยอมรับ|Accept|เอา/i });
    expect(acceptBtn).toBeInTheDocument();

    // Click Accept diff using fireEvent
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(acceptBtn);

    // Verify that the editor content updated to interactive taskItem elements
    await waitFor(() => {
      const taskList = container.querySelector('ul[data-type="taskList"]');
      expect(taskList).toBeInTheDocument();
      const taskItems = container.querySelectorAll('ul[data-type="taskList"] li');
      expect(taskItems.length).toBeGreaterThanOrEqual(2);
      const checkboxes = container.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);
      const text = container.textContent || "";
      expect(text).toContain("Improved task 1");
      expect(text).toContain("Improved task 2");
    });
  });

  it("preserves HTML styled spans like color, font-family, and font-size when extracting and accepting diff", async () => {
    const styledHtml = '<span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;"><span style="font-size: 24px;">ไฟล์</span></span></span>';
    const styledNote: Note = {
      id: "test-note-styled-html",
      title: "Styled Note",
      content: styledHtml,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "styled.md",
      contentFormat: "markdown",
    };

    (geminiApi.runGeminiAction as any).mockResolvedValueOnce({
      result: '<span style="color: rgb(38, 162, 149);"><span style="font-family: Sriracha, cursive, sans-serif;"><span style="font-size: 24px;">ไฟล์ปรับปรุงแล้ว</span></span></span>',
      modelUsed: "gemini-2.5-flash",
    });

    const { container } = render(
      <AppSettingsProvider>
        <EditorWithAiSettings note={styledNote} />
      </AppSettingsProvider>
    );

    const aiBtn = await screen.findByRole("button", { name: /Luno AI/i });
    await waitFor(() => {
      expect(aiBtn).not.toBeDisabled();
    });

    window.dispatchEvent(
      new CustomEvent("luno:trigger-ai-action", {
        detail: { action: "improve" },
      })
    );

    await waitFor(() => {
      expect(geminiApi.runGeminiAction).toHaveBeenCalled();
    });

    const callArgs = (geminiApi.runGeminiAction as any).mock.calls[0];
    const extractedMarkdown = callArgs[2];

    // Assert that HTML styling attributes were preserved in extracted markdown
    expect(extractedMarkdown).toContain("color: rgb(38, 162, 149)");
    expect(extractedMarkdown).toContain("Sriracha");
    expect(extractedMarkdown).toContain("24px");

    // Accept diff
    const acceptBtn = await screen.findByRole("button", { name: /ยอมรับ|Accept|เอา/i });
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(acceptBtn);

    // Verify that the editor content updated and preserved the styles
    await waitFor(() => {
      const editorEl = container.querySelector(".tiptap");
      const html = editorEl?.innerHTML || "";
      expect(html).toContain("color: rgb(38, 162, 149)");
      expect(html).toContain("Sriracha");
      expect(html).toContain("24px");
      expect(container.textContent).toContain("ไฟล์ปรับปรุงแล้ว");
    });
  });
});
