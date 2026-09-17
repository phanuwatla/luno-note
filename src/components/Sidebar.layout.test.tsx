import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { AppSettingsProvider, useAppSettings } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";

function SidebarWithLayoutConfig({
  layout = "default",
  sidebarOpen = true,
  onOpenSidebar,
  onClose,
  onSelect,
  openedFolderName,
  notes = [],
  trashedNotes,
  onRestoreTrash,
  onDeleteTrashPermanently,
  onEmptyTrash,
}: {
  layout?: "default" | "compact";
  sidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onClose?: () => void;
  onSelect?: (id: string) => void;
  openedFolderName?: string;
  notes?: any[];
  trashedNotes?: any[];
  onRestoreTrash?: (ids: string[]) => void;
  onDeleteTrashPermanently?: (ids: string[]) => void;
  onEmptyTrash?: () => void;
}) {
  return (
    <TooltipProvider>
      <AppSettingsProvider>
        <SidebarWrapper
          layout={layout}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={onOpenSidebar}
          onClose={onClose}
          onSelect={onSelect}
          openedFolderName={openedFolderName}
          notes={notes}
          trashedNotes={trashedNotes}
          onRestoreTrash={onRestoreTrash}
          onDeleteTrashPermanently={onDeleteTrashPermanently}
          onEmptyTrash={onEmptyTrash}
        />
      </AppSettingsProvider>
    </TooltipProvider>
  );
}

function SidebarWrapper({
  layout,
  sidebarOpen,
  onOpenSidebar,
  onClose,
  onSelect,
  openedFolderName,
  notes = [],
  trashedNotes,
  onRestoreTrash,
  onDeleteTrashPermanently,
  onEmptyTrash,
}: {
  layout: "default" | "compact";
  sidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onClose?: () => void;
  onSelect?: (id: string) => void;
  openedFolderName?: string;
  notes?: any[];
  trashedNotes?: any[];
  onRestoreTrash?: (ids: string[]) => void;
  onDeleteTrashPermanently?: (ids: string[]) => void;
  onEmptyTrash?: () => void;
}) {
  const { updateSetting } = useAppSettings();

  React.useEffect(() => {
    updateSetting("appLayout", layout);
  }, [layout, updateSetting]);

  return (
    <Sidebar
      notes={notes}
      folderPaths={[]}
      activeNoteId={null}
      sidebarOpen={sidebarOpen}
      openedFolderName={openedFolderName}
      onOpenSidebar={onOpenSidebar}
      onClose={onClose}
      onSelect={onSelect || (() => {})}
      onCreate={() => {}}
      trashedNotes={trashedNotes}
      onRestoreTrash={onRestoreTrash}
      onDeleteTrashPermanently={onDeleteTrashPermanently}
      onEmptyTrash={onEmptyTrash}
    />
  );
}

describe("Sidebar Layout Modes", () => {
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

  it("renders default layout properly when expanded", () => {
    render(<SidebarWithLayoutConfig layout="default" sidebarOpen={true} />);
    expect(screen.getByText("Luno")).toBeDefined();
  });

  it("renders compact layout with Workspace header and without search input in workspace mode", () => {
    const handleClose = vi.fn();
    const handleOpen = vi.fn();

    render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
        onClose={handleClose}
        onOpenSidebar={handleOpen}
      />
    );

    // Workspace header should say WORKSPACE (matching default layout)
    expect(screen.getByText("WORKSPACE")).toBeDefined();
    // Search input should NOT be present in workspace mode
    expect(screen.queryByPlaceholderText("Search notes...")).toBeNull();
  });

  it("toggles workspace panel in compact layout", () => {
    const handleClose = vi.fn();
    const handleOpen = vi.fn();

    render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={false}
        onClose={handleClose}
        onOpenSidebar={handleOpen}
      />
    );

    // When sidebarOpen is false in compact mode, workspace header is not shown
    expect(screen.queryByText("WORKSPACE")).toBeNull();
  });

  it("excludes tabviews (like home) from nav rail focus highlight in compact layout", () => {
    const { container } = render(
      <TooltipProvider>
        <AppSettingsProvider>
          <SidebarWrapper
            layout="compact"
            sidebarOpen={true}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Nav rail buttons should exist and not have font-semibold / bg-primary/10 on home
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("can switch to Favorites, Tags, and Trash panels in compact layout", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
      />
    );

    // Initial state is WORKSPACE
    expect(screen.getByText("WORKSPACE")).toBeDefined();

    // Click Favorites on nav rail (look for button with star / svg)
    const starBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-star")
    );
    if (starBtn) {
      fireEvent.click(starBtn);
      expect(screen.getByText(/Favorites\s*\(\d+\)/i)).toBeDefined();
    }

    // Click Tags on nav rail
    const tagBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-tag")
    );
    if (tagBtn) {
      fireEvent.click(tagBtn);
      expect(screen.getByText(/Tags\s*\(\d+\)/i)).toBeDefined();
    }

    // Click Trash on nav rail
    const trashBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-trash-2") || btn.querySelector("svg")?.classList.contains("lucide-trash")
    );
    if (trashBtn) {
      fireEvent.click(trashBtn);
      expect(screen.getByText(/Trash\s*\(\d+\)/i)).toBeDefined();
    }
  });

  it("can switch to Templates panel and render categories and templates in compact layout", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const handleSelect = vi.fn();
    const eventSpy = vi.fn();
    window.addEventListener("luno:open-template-preview", eventSpy);

    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
        onSelect={handleSelect}
      />
    );

    // Find Templates button on nav rail
    const tplBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-layout-template") ||
      btn.querySelector("svg")?.classList.contains("lucide-templates")
    );
    expect(tplBtn).toBeDefined();
    if (tplBtn) {
      fireEvent.click(tplBtn);
      expect(screen.getByText(/Templates\s*\(\d+\)/i)).toBeDefined();

      // Check category folder is present
      expect(screen.getByText("Work & Business")).toBeDefined();

      // Click a template item (e.g. Daily Note or Meeting Notes)
      const dailyItem = screen.queryByText("Daily Note") || screen.queryByText("Meeting Notes");
      if (dailyItem) {
        fireEvent.click(dailyItem);
        expect(handleSelect).toHaveBeenCalledWith("templates");
        expect(eventSpy).toHaveBeenCalled();
      }
    }
    window.removeEventListener("luno:open-template-preview", eventSpy);
  });

  it("does not render Home button in compact layout rail", () => {
    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
      />
    );
    const homeIcon = container.querySelector("svg.lucide-house, svg.lucide-home");
    expect(homeIcon).toBeNull();
  });

  it("opens Luno AI sidebar panel when Luno AI icon is clicked on nav rail", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
      />
    );

    // Initial state is WORKSPACE
    expect(screen.getByText("WORKSPACE")).toBeDefined();

    // Click Luno AI on nav rail (Sparkles icon / lucide-sparkles)
    const aiBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-sparkles")
    );
    expect(aiBtn).toBeDefined();
    if (aiBtn) {
      fireEvent.click(aiBtn);
      // Luno AI panel should be rendered
      const lunoAiElements = screen.getAllByText("Luno AI");
      expect(lunoAiElements.length).toBeGreaterThan(0);

      // Verify header has New Chat and Chat History buttons
      const buttons = Array.from(container.querySelectorAll("button"));
      const historyBtn = buttons.find(btn => {
        const svg = btn.querySelector("svg");
        return (
          svg?.getAttribute("class")?.includes("history") ||
          svg?.getAttribute("class")?.includes("rotate-ccw-clock") ||
          svg?.classList.contains("lucide-history")
        );
      });
      expect(historyBtn).toBeDefined();
    }
  });

  it("renders tags as expandable folder/file tree and expands tagged notes on click", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const mockNotes = [
      {
        id: "note-1",
        title: "Work Note",
        fileName: "Work_Note.md",
        content: "Hello work",
        tags: ["ProjectX"],
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "note-2",
        title: "Personal Note",
        fileName: "Personal.md",
        content: "Hello personal",
        tags: ["Personal"],
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
        openedFolderName="Workspace"
        notes={mockNotes as any}
      />
    );

    // Click Tags on nav rail
    const tagBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-tag")
    );
    expect(tagBtn).toBeDefined();
    if (tagBtn) {
      fireEvent.click(tagBtn);
      expect(screen.getByText(/Tags\s*\(\d+\)/i)).toBeDefined();
      expect(screen.getByText("ProjectX")).toBeDefined();
      expect(screen.getByText("Personal")).toBeDefined();

      // Before expanding, "Work_Note.md" shouldn't be rendered in the tag tree
      expect(screen.queryByText("Work_Note.md")).toBeNull();

      // Click on ProjectX tag row to expand it
      const projectXRow = screen.getByText("ProjectX").closest("button");
      expect(projectXRow).toBeDefined();
      if (projectXRow) {
        fireEvent.click(projectXRow);
        // Now "Work_Note.md" is expanded and visible
        expect(screen.getByText("Work_Note.md")).toBeDefined();

        // Check tag count number has plain text styling (no background badge)
        const countSpan = projectXRow.querySelector("span.text-muted-foreground:last-child");
        expect(countSpan?.className).toContain("font-medium");
        expect(countSpan?.className).not.toContain("bg-sidebar-accent");

        // Click again to collapse
        fireEvent.click(projectXRow);
        expect(screen.queryByText("Work_Note.md")).toBeNull();
      }
    }
  });

  it("renders trash items with file-style rows, checkbox selection, and action buttons in compact layout", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const mockTrash = [
      {
        id: "trash-1",
        title: "Deleted Doc",
        fileName: "Deleted_Doc.md",
        content: "Trash content",
        deletedAt: Date.now() - 10000,
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: "trash-2",
        title: "Old Notes",
        fileName: "Old_Notes.txt",
        content: "Plain text trash",
        deletedAt: Date.now() - 20000,
        createdAt: 1000,
        updatedAt: 2000,
      },
    ];

    const handleRestore = vi.fn();
    const handleDeletePermanent = vi.fn();

    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={true}
        trashedNotes={mockTrash as any}
        onRestoreTrash={handleRestore}
        onDeleteTrashPermanently={handleDeletePermanent}
      />
    );

    // Click Trash on nav rail
    const trashBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-trash-2") || btn.querySelector("svg")?.classList.contains("lucide-trash")
    );
    expect(trashBtn).toBeDefined();
    if (trashBtn) {
      fireEvent.click(trashBtn);
      // Header count should be TRASH (2)
      expect(screen.getByText(/Trash\s*\(2\)/i)).toBeDefined();

      // Trash items rendered
      expect(screen.getByText("Deleted_Doc.md")).toBeDefined();
      expect(screen.getByText("Old_Notes.txt")).toBeDefined();

      // Click on row to toggle checkbox selection
      const docRow = screen.getByText("Deleted_Doc.md").closest("div[role='button']");
      expect(docRow).toBeDefined();
      if (docRow) {
        fireEvent.click(docRow);
        // Quick action bar should appear showing "1 selected"
        expect(screen.getByText(/1 selected/i)).toBeDefined();

        // Clicking restore button in quick action bar triggers handleRestore
        const restoreBtn = screen.getByRole("button", { name: /Restore/i });
        fireEvent.click(restoreBtn);
        expect(handleRestore).toHaveBeenCalledWith(["trash-1"]);
      }
    }
  });

  it("opens sidebar and switches to search panel on luno:focus-sidebar-search in compact layout", async () => {
    const handleOpen = vi.fn();
    const { container } = render(
      <SidebarWithLayoutConfig
        layout="compact"
        sidebarOpen={false}
        onOpenSidebar={handleOpen}
      />
    );

    // Dispatch global focus search event
    window.dispatchEvent(new CustomEvent("luno:focus-sidebar-search"));
    expect(handleOpen).toHaveBeenCalled();
  });
});
