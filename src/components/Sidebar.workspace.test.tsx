import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("Sidebar workspace folder rendering when empty", () => {
  const storageMap = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => { storageMap.set(key, String(value)); },
    removeItem: (key: string) => { storageMap.delete(key); },
    clear: () => { storageMap.clear(); },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    get length() { return storageMap.size; },
  };

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
  it("renders workspace folder name when openedFolderName is provided and notes are empty", () => {
    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={[]}
            folderPaths={[]}
            activeNoteId={null}
            openedFolderName="My Test Workspace"
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // The root folder name "My Test Workspace" should be visible in the workspace tree
    expect(screen.getByText("My Test Workspace")).toBeDefined();
  });

  it("does not auto-expand subfolders when opening a workspace with subfolder paths", () => {
    const notes = [
      {
        id: "note-1",
        title: "Child Note",
        fileName: "Child Note.md",
        content: "Hello",
        folderPath: "subfolder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={notes}
            folderPaths={["subfolder"]}
            activeNoteId={null}
            openedFolderName="My Workspace"
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Root workspace should be visible
    expect(screen.getByText("My Workspace")).toBeDefined();
    // Subfolder should be visible in the tree
    expect(screen.getByText("subfolder")).toBeDefined();
    // Child note inside collapsed subfolder should NOT be visible
    expect(screen.queryByText("Child Note.md")).toBeNull();
  });

  it("restores previously opened subfolders when returning to the same workspace", () => {
    window.localStorage.setItem("luno_last_workspace_name", "Persisted Workspace");
    window.localStorage.setItem("luno_open_folders_Persisted Workspace", JSON.stringify(["__opened_root__", "subfolder"]));

    const notes = [
      {
        id: "note-1",
        title: "Child Note",
        fileName: "Child Note.md",
        content: "Hello",
        folderPath: "subfolder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={notes}
            folderPaths={["subfolder"]}
            activeNoteId={null}
            openedFolderName="Persisted Workspace"
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Both root and subfolder should be open, and child note should be visible
    expect(screen.getByText("Persisted Workspace")).toBeDefined();
    expect(screen.getByText("subfolder")).toBeDefined();
    expect(screen.getByText("Child Note.md")).toBeDefined();
  });

  it("opens only root folder when switching to a different workspace", () => {
    // Previous workspace was Workspace A
    window.localStorage.setItem("luno_last_workspace_name", "Workspace A");
    window.localStorage.setItem("luno_open_folders_Workspace B", JSON.stringify(["__opened_root__", "subfolder"]));

    const notes = [
      {
        id: "note-1",
        title: "Child Note",
        fileName: "Child Note.md",
        content: "Hello",
        folderPath: "subfolder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={notes}
            folderPaths={["subfolder"]}
            activeNoteId={null}
            openedFolderName="Workspace B"
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Because last workspace was "Workspace A" and now we open "Workspace B",
    // it treats it as switching to a new workspace and starts with subfolder collapsed
    expect(screen.getByText("Workspace B")).toBeDefined();
    expect(screen.getByText("subfolder")).toBeDefined();
    expect(screen.queryByText("Child Note.md")).toBeNull();
  });

  it("handles Shift and Ctrl multi-selection and right-click actions", () => {
    const onSelect = vi.fn();
    const notes = [
      { id: "note-1", title: "Note 1", fileName: "note-1.md", content: "1", createdAt: 1000, updatedAt: 1000 },
      { id: "note-2", title: "Note 2", fileName: "note-2.md", content: "2", createdAt: 2000, updatedAt: 2000 },
      { id: "note-3", title: "Note 3", fileName: "note-3.md", content: "3", createdAt: 3000, updatedAt: 3000 },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={notes}
            folderPaths={[]}
            activeNoteId={null}
            openedFolderName="My Workspace"
            onSelect={onSelect}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    const btn1 = screen.getByText("note-1.md").closest("button")!;
    const btn2 = screen.getByText("note-2.md").closest("button")!;
    const btn3 = screen.getByText("note-3.md").closest("button")!;

    // 1. Normal click note-1 -> onSelect called
    fireEvent.mouseDown(btn1, { button: 0 });
    fireEvent.click(btn1);
    expect(onSelect).toHaveBeenCalledWith("note-1");

    // 2. Ctrl+click note-3 -> toggles selection without opening note
    onSelect.mockClear();
    fireEvent.mouseDown(btn3, { button: 0, ctrlKey: true });
    fireEvent.click(btn3, { ctrlKey: true });
    expect(onSelect).not.toHaveBeenCalled();

    // 3. Shift+click note-2 -> selects range from note-3 to note-2
    onSelect.mockClear();
    fireEvent.mouseDown(btn2, { button: 0, shiftKey: true });
    fireEvent.click(btn2, { shiftKey: true });
    expect(onSelect).not.toHaveBeenCalled();

    // 4. Right-clicking note-2 (part of multi-selection) preserves multi-selection
    fireEvent.mouseDown(btn2, { button: 2 });
    fireEvent.contextMenu(btn2);
    expect(screen.getByText(/Copy \(2\)|คัดลอก \(2\)/)).toBeDefined();
  });
});

