import { describe, expect, it, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
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
});
