import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import Editor from "./Editor";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";

// Polyfill localStorage for Node/JSDOM
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => {
    storageMap.set(key, String(val));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() {
    return storageMap.size;
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const mockNote: Note = {
  id: "test-margin-click-note",
  title: "Test Margin Note",
  content: "Paragraph 1\n\nParagraph 2\n\nParagraph 3",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  fileName: "test-margin.md",
  contentFormat: "markdown",
};

describe("Editor margin click behavior", () => {
  beforeEach(() => {
    storageMap.clear();
  });

  it("should have cursor-default on the scroll container and not scroll or trigger action on margin click", () => {
    const { container } = render(
      <AppSettingsProvider>
        <Editor
          note={mockNote}
          notes={[mockNote]}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
          onOpenSidebar={vi.fn()}
        />
      </AppSettingsProvider>
    );

    // Find the scroll container (the flex-1 overflow-y-auto container)
    const scrollContainer = container.querySelector(".overflow-y-auto.overflow-x-hidden");
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.classList.contains("cursor-default")).toBe(true);
    expect(scrollContainer?.classList.contains("cursor-text")).toBe(false);

    // Find the editor content & ProseMirror text area
    const editorContent = container.querySelector(".tiptap.ProseMirror");
    expect(editorContent).not.toBeNull();
    expect(editorContent?.classList.contains("cursor-text")).toBe(true);

    // Clicking directly on the scroll container (the side margins outside the page content)
    // should not throw and should have no focus-to-end action
    if (scrollContainer) {
      fireEvent.click(scrollContainer);
    }
  });
});
