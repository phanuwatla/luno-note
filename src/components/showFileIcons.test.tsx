import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TabBar from "./TabBar";
import Breadcrumb from "./Breadcrumb";
import RightPanel from "./RightPanel";
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
});

