import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  WorkspaceFolderTree,
  WorkspaceNoteIcon,
  WorkspaceFolderIcon,
  AttachedFileChipIcon,
} from "./LunoAiView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";

describe("LunoAiView Workspace Note and Folder Icons", () => {
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

  it("renders custom note emoji icon in WorkspaceNoteIcon", () => {
    const note: Note = {
      id: "note-1",
      title: "Review",
      fileName: "review.md",
      content: "",
      icon: "🚀",
      iconColor: "#ef4444",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceNoteIcon note={note} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("renders custom file icon from settings.fileIcons in WorkspaceNoteIcon", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        fileIcons: {
          "sample.mp3": { icon: "🎵", color: "#3b82f6" },
        },
      })
    );

    const note: Note = {
      id: "note-audio",
      title: "Audio",
      fileName: "sample.mp3",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceNoteIcon note={note} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("renders custom folder icon from settings.folderIcons in WorkspaceFolderIcon", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        folderIcons: {
          "Chapter 1": { icon: "🎨", color: "#f59e0b" },
        },
      })
    );

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderIcon path="Chapter 1" isOpen={false} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🎨")).toBeInTheDocument();
  });

  it("renders custom note and folder icons inside WorkspaceFolderTree", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        folderIcons: {
          "Chapter 1": { icon: "📁✨", color: "#10b981" },
        },
      })
    );

    const testNotes: Note[] = [
      {
        id: "n1",
        title: "My Note",
        fileName: "review.md",
        content: "",
        icon: "📝⭐",
        folderPath: "Chapter 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "n2",
        title: "Audio File",
        fileName: "Sample MP3 audio files.mp3",
        content: "",
        folderPath: "Chapter 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Custom folder icon
    expect(screen.getByText("📁✨")).toBeInTheDocument();
    // Folder name
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();

    // Click folder to expand
    fireEvent.click(screen.getByText("Chapter 1"));

    // Custom note icon
    expect(screen.getByText("📝⭐")).toBeInTheDocument();
    // Note filename
    expect(screen.getByText("review.md")).toBeInTheDocument();
  });

  it("remembers expanded/collapsed folder state in localStorage across modal re-renders", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Test Note",
        fileName: "notes.md",
        content: "",
        folderPath: "Docs",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // First render: Docs is collapsed by default
    const { unmount } = render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-a"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.queryByText("notes.md")).not.toBeInTheDocument();

    // Click Docs to expand
    fireEvent.click(screen.getByText("Docs"));
    expect(screen.getByText("notes.md")).toBeInTheDocument();

    // Verify localStorage has saved the open folder
    const saved = JSON.parse(storageMap.get("luno_open_folders_workspace-a") || "[]");
    expect(saved).toContain("Docs");

    // Close / unmount modal (simulating closing dialog)
    unmount();

    // Reopen modal: Should restore open folder state from localStorage
    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-a"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // It should already be expanded!
    expect(screen.getByText("notes.md")).toBeInTheDocument();

    // Click Docs again to collapse
    fireEvent.click(screen.getByText("Docs"));
    expect(screen.queryByText("notes.md")).not.toBeInTheDocument();

    // Verify collapsed state is saved
    const savedAfterCollapse = JSON.parse(storageMap.get("luno_open_folders_workspace-a") || "[]");
    expect(savedAfterCollapse).not.toContain("Docs");
  });

  it("syncs open folders when luno:open-folders-changed event is fired", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Sync Note",
        fileName: "sync.md",
        content: "",
        folderPath: "Projects",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-sync"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.queryByText("sync.md")).not.toBeInTheDocument();

    // Dispatch external folder change event (e.g. from Sidebar)
    act(() => {
      window.dispatchEvent(
        new CustomEvent("luno:open-folders-changed", {
          detail: {
            workspace: "workspace-sync",
            openFolders: ["__opened_root__", "Projects"],
          },
        })
      );
    });

    expect(screen.getByText("sync.md")).toBeInTheDocument();
  });

  it("renders custom note icon inside AttachedFileChipIcon", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Attached Note",
        fileName: "attached.md",
        content: "",
        icon: "🔥",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <AttachedFileChipIcon fileName="attached.md" notes={testNotes} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🔥")).toBeInTheDocument();
  });
});
