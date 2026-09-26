import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Note } from "@/types/note";

describe("Sidebar Multi-File Drag and Drop", () => {
  const storageMap = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => { storageMap.set(key, String(value)); },
    removeItem: (key: string) => { storageMap.delete(key); },
    clear: () => { storageMap.clear(); },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    get length() { return storageMap.size; },
  };

  const mockNotes: Note[] = [
    {
      id: "note-1",
      title: "File 1",
      fileName: "file1.md",
      content: "Content 1",
      folderPath: "",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "note-2",
      title: "File 2",
      fileName: "file2.md",
      content: "Content 2",
      folderPath: "",
      createdAt: 2000,
      updatedAt: 2000,
    },
    {
      id: "note-3",
      title: "File 3",
      fileName: "file3.md",
      content: "Content 3",
      folderPath: "",
      createdAt: 3000,
      updatedAt: 3000,
    },
  ];

  beforeEach(() => {
    storageMap.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    if (typeof global.DOMRect === "undefined" || !global.DOMRect.fromRect) {
      global.DOMRect = class DOMRect {
        x = 0; y = 0; width = 0; height = 0; top = 0; right = 0; bottom = 0; left = 0;
        constructor(x = 0, y = 0, width = 0, height = 0) {
          this.x = x; this.y = y; this.width = width; this.height = height;
          this.top = y; this.right = x + width; this.bottom = y + height; this.left = x;
        }
        static fromRect(other?: any) {
          return new DOMRect(other?.x, other?.y, other?.width, other?.height);
        }
        toJSON() { return JSON.stringify(this); }
      } as any;
      window.DOMRect = global.DOMRect;
    }
  });

  it("preserves multi-selection on mousedown and calls onMoveFiles on drop", () => {
    const handleMoveFiles = vi.fn();
    const handleMoveFile = vi.fn();

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={mockNotes}
            folderPaths={["docs"]}
            activeNoteId={null}
            openedFolderName="Workspace"
            onSelect={() => {}}
            onCreate={() => {}}
            onMoveFiles={handleMoveFiles}
            onMoveFile={handleMoveFile}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    const file1Btn = screen.getByText("file1.md").closest("button")!;
    const file2Btn = screen.getByText("file2.md").closest("button")!;

    // 1. Select file1
    fireEvent.mouseDown(file1Btn, { button: 0 });

    // 2. Ctrl+click file2 to add to multi-selection
    fireEvent.mouseDown(file2Btn, { button: 0, ctrlKey: true });

    // Both files are now selected
    expect(file1Btn.className).toContain("font-semibold");
    expect(file2Btn.className).toContain("font-semibold");

    // 3. Mouse-down on file1 without modifier keys (starting a drag gesture)
    fireEvent.mouseDown(file1Btn, { button: 0 });

    // Multi-selection MUST be preserved!
    expect(file1Btn.className).toContain("font-semibold");
    expect(file2Btn.className).toContain("font-semibold");

    // 4. Start dragging file1
    const dataTransfer = {
      setData: vi.fn(),
      setDragImage: vi.fn(),
      effectAllowed: "",
    };
    fireEvent.dragStart(file1Btn, { dataTransfer });

    // Data transfer contains both files
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "file1.md\nfile2.md");

    // 5. Drop onto the 'docs' folder
    const docsFolderBtn = screen.getByText("docs").closest("button")!;
    fireEvent.dragOver(docsFolderBtn);
    fireEvent.drop(docsFolderBtn);

    // onMoveFiles should be called with both files and target folder
    expect(handleMoveFiles).toHaveBeenCalledTimes(1);
    expect(handleMoveFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "note-1" }),
        expect.objectContaining({ id: "note-2" }),
      ]),
      "docs"
    );
  });

  it("collapses multi-selection to single note if clicked without dragging", () => {
    const handleSelect = vi.fn();

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={mockNotes}
            folderPaths={["docs"]}
            activeNoteId={null}
            openedFolderName="Workspace"
            onSelect={handleSelect}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    const file1Btn = screen.getByText("file1.md").closest("button")!;
    const file2Btn = screen.getByText("file2.md").closest("button")!;

    // 1. Multi-select file1 and file2
    fireEvent.mouseDown(file1Btn, { button: 0 });
    fireEvent.mouseDown(file2Btn, { button: 0, ctrlKey: true });

    expect(file1Btn.className).toContain("font-semibold");
    expect(file2Btn.className).toContain("font-semibold");

    // 2. User mouse-downs on file1
    fireEvent.mouseDown(file1Btn, { button: 0 });
    // Still multi-selected right after mousedown (waiting to see if user drags)
    expect(file2Btn.className).toContain("font-semibold");

    // 3. User releases mouse without dragging (regular click)
    fireEvent.click(file1Btn);

    // Selection collapses to file1 only
    expect(file1Btn.className).toContain("font-semibold");
    expect(file2Btn.className).not.toContain("font-semibold");
    expect(handleSelect).toHaveBeenCalledWith("note-1");
  });
});
