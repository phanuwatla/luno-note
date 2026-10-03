import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TabBar from "./TabBar";
import Breadcrumb from "./Breadcrumb";
import RightPanel from "./RightPanel";
import Sidebar from "./Sidebar";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";

const sampleNote: Note = {
  id: "note-1",
  title: "My Note",
  fileName: "My Note.md",
  content: "# Header\nHello world",
  createdAt: 1724119800000,
  updatedAt: 1724120000000,
  contentFormat: "markdown",
  icon: "lucide:file-text",
};

const imageNote: Note = {
  id: "note-img",
  title: "Photo",
  fileName: "Photo.png",
  fileType: "image",
  content: "",
  createdAt: 1724119800000,
  updatedAt: 1724120000000,
  icon: "lucide:image",
};

describe("showFileIcons Setting Integration", () => {
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
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    storageMap.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    if (typeof (globalThis as any).DOMRect === "undefined" || !(globalThis as any).DOMRect.fromRect) {
      (globalThis as any).DOMRect = class DOMRect {
        x = 0; y = 0; width = 0; height = 0; top = 0; right = 0; bottom = 0; left = 0;
        constructor(x = 0, y = 0, width = 0, height = 0) {
          this.x = x; this.y = y; this.width = width; this.height = height;
          this.top = y; this.right = x + width; this.bottom = y + height; this.left = x;
        }
        static fromRect(other?: any) {
          return new (globalThis as any).DOMRect(other?.x, other?.y, other?.width, other?.height);
        }
        toJSON() { return JSON.stringify(this); }
      };
      (window as any).DOMRect = (globalThis as any).DOMRect;
    }
  });

  it("TabBar renders tab with file icon when showFileIcons is true (default)", () => {
    const { container } = render(
      <AppSettingsProvider>
        <TooltipProvider>
          <TabBar
            tabs={[sampleNote]}
            activeTabId={sampleNote.id}
            onSelectTab={vi.fn()}
            onCloseTab={vi.fn()}
            onNewTab={vi.fn()}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    // Default: showFileIcons is true, an svg icon should exist in the tab item
    const tabItemWithIcon = container.querySelector(".lucide-file-text");
    expect(tabItemWithIcon).not.toBeNull();
  });

  it("TabBar hides file icon when showFileIcons is false via settings", () => {
    window.localStorage.setItem("notes-app-settings", JSON.stringify({ showFileIcons: false }));

    const { container, unmount } = render(
      <AppSettingsProvider>
        <TooltipProvider>
          <TabBar
            tabs={[sampleNote]}
            activeTabId={sampleNote.id}
            onSelectTab={vi.fn()}
            onCloseTab={vi.fn()}
            onNewTab={vi.fn()}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    // The file icon (lucide-file-text) must NOT be present
    expect(container.querySelector(".lucide-file-text")).toBeNull();
    expect(screen.getByText("My Note.md")).toBeInTheDocument();

    unmount();
  });

  it("RightPanel shows Change Icon button when showFileIcons is true (default)", () => {
    const { unmount } = render(
      <AppSettingsProvider>
        <TooltipProvider delayDuration={0}>
          <RightPanel
            isOpen={true}
            onClose={vi.fn()}
            note={imageNote}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    expect(screen.getByText(/Change Icon|sidebar\.changeNoteIcon/i)).toBeInTheDocument();
    unmount();
  });

  it("RightPanel hides icon display and Change Icon button when showFileIcons is false", () => {
    window.localStorage.setItem("notes-app-settings", JSON.stringify({ showFileIcons: false }));

    const { unmount } = render(
      <AppSettingsProvider>
        <TooltipProvider delayDuration={0}>
          <RightPanel
            isOpen={true}
            onClose={vi.fn()}
            note={imageNote}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    expect(screen.queryByText(/Change Icon|sidebar\.changeNoteIcon/i)).toBeNull();
    unmount();
  });

  it("Breadcrumb hides file, folder, and workspace icons when showFileIcons is false", () => {
    window.localStorage.setItem("notes-app-settings", JSON.stringify({ showFileIcons: false }));

    const folderNote: Note = {
      ...sampleNote,
      folderPath: "Docs",
    };

    const { container, unmount } = render(
      <AppSettingsProvider>
        <TooltipProvider>
          <Breadcrumb
            note={folderNote}
            notes={[folderNote]}
            rootFolderName="My Workspace"
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    // In breadcrumb, file icon, home icon (workspace icon) should not be rendered
    expect(container.querySelector(".lucide-file-text")).toBeNull();
    expect(container.querySelector(".lucide-home")).toBeNull();
    expect(container.querySelector(".lucide-folder")).toBeNull();

    unmount();
  });

  it("Sidebar context menu removes icon properly by clearing both note.icon and settings.fileIcons", () => {
    window.localStorage.setItem(
      "notes-app-settings",
      JSON.stringify({
        showFileIcons: true,
        fileIcons: {
          "sample.md": { icon: "lucide:heart", color: "#ef4444" },
        },
      })
    );

    const onUpdateNote = vi.fn();
    const testNote: Note = {
      id: "note-custom-icon",
      title: "sample",
      fileName: "sample.md",
      content: "test",
      createdAt: 100,
      updatedAt: 200,
      icon: "lucide:heart",
      iconColor: "#ef4444",
    };

    const { unmount } = render(
      <AppSettingsProvider>
        <TooltipProvider>
          <Sidebar
            notes={[testNote]}
            activeNoteId={testNote.id}
            openedFolderName="Workspace"
            onSelect={vi.fn()}
            onCreate={vi.fn()}
            onUpdateNote={onUpdateNote}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );

    // Right-click the note item to open ContextMenu
    const noteBtn = screen.getByText("sample.md").closest("button");
    expect(noteBtn).not.toBeNull();
    fireEvent.contextMenu(noteBtn!);

    // "Remove Icon" should be in the context menu
    const removeIconOption = screen.getByText(/Remove Icon|sidebar\.removeIcon/i);
    expect(removeIconOption).toBeInTheDocument();

    fireEvent.click(removeIconOption);

    // Verify onUpdateNote was called to clear icon
    expect(onUpdateNote).toHaveBeenCalledWith("note-custom-icon", {
      icon: undefined,
      iconColor: undefined,
    });

    // Verify settings was updated to remove from fileIcons
    const saved = JSON.parse(window.localStorage.getItem("notes-app-settings") || "{}");
    expect(saved.fileIcons?.["sample.md"]).toBeUndefined();

    unmount();
  });
});


