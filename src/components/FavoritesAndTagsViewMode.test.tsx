import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FavoritesTabView from "./FavoritesTabView";
import TagsTabView from "./TagsTabView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";

const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Alpha Note",
    content: "This is test content with #work tag",
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 5000,
    fileName: "Alpha Note.md",
    contentFormat: "markdown",
    isFavorite: true,
    tags: ["work"],
    folderPath: "Projects",
  },
  {
    id: "note-2",
    title: "Beta Note",
    content: "Another note with #personal tag",
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 15000,
    fileName: "Beta Note.md",
    contentFormat: "markdown",
    isFavorite: true,
    tags: ["personal"],
    folderPath: "Daily",
  },
];

describe("FavoritesTabView & TagsTabView viewMode toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("FavoritesTabView defaults to list view and toggles between list and card", () => {
    const onOpenNote = vi.fn();
    const onToggleFavorite = vi.fn();

    const { container } = render(
      <AppSettingsProvider>
        <FavoritesTabView
          notes={mockNotes}
          onOpenNote={onOpenNote}
          onToggleFavorite={onToggleFavorite}
        />
      </AppSettingsProvider>
    );

    // Default is list view: table should be present
    expect(container.querySelector(".rounded-2xl.border.border-border\\/60")).not.toBeNull();
    expect(screen.getByText("Alpha Note.md")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();

    // Toggle button should be present
    const toggleBtn = screen.getByLabelText(/เปลี่ยนเป็นมุมมองการ์ด|Switch to card view/i);
    expect(toggleBtn).toBeInTheDocument();

    // Click toggle to switch to card view
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("notes-app-favorites-view-mode")).toBe("card");

    // After switching to card view, label should offer switching back to list
    const switchToListBtn = screen.getByLabelText(/เปลี่ยนเป็นมุมมองรายการ|Switch to list view/i);
    expect(switchToListBtn).toBeInTheDocument();

    // Click again to switch back to list view
    fireEvent.click(switchToListBtn);
    expect(localStorage.getItem("notes-app-favorites-view-mode")).toBe("list");
    expect(container.querySelector(".rounded-2xl.border.border-border\\/60")).not.toBeNull();
  });

  it("TagsTabView defaults to list view and toggles between list and card", () => {
    const onOpenNote = vi.fn();
    const onToggleFavorite = vi.fn();

    const { container } = render(
      <AppSettingsProvider>
        <TagsTabView
          notes={mockNotes}
          onOpenNote={onOpenNote}
          onToggleFavorite={onToggleFavorite}
        />
      </AppSettingsProvider>
    );

    // Default is list view: table should be present
    expect(container.querySelector(".rounded-2xl.border.border-border\\/60")).not.toBeNull();
    expect(screen.getByText("Alpha Note.md")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();

    // Toggle button should be present
    const toggleBtn = screen.getByLabelText(/เปลี่ยนเป็นมุมมองการ์ด|Switch to card view/i);
    expect(toggleBtn).toBeInTheDocument();

    // Click toggle to switch to card view
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("notes-app-tags-view-mode")).toBe("card");

    // After switching to card view, label should offer switching back to list
    const switchToListBtn = screen.getByLabelText(/เปลี่ยนเป็นมุมมองรายการ|Switch to list view/i);
    expect(switchToListBtn).toBeInTheDocument();

    // Click again to switch back to list view
    fireEvent.click(switchToListBtn);
    expect(localStorage.getItem("notes-app-tags-view-mode")).toBe("list");
    expect(container.querySelector(".rounded-2xl.border.border-border\\/60")).not.toBeNull();
  });

  it("FavoritesTabView and TagsTabView render custom note/folder icons and colors matching sidebar", () => {
    window.localStorage.setItem(
      "notes-app-settings",
      JSON.stringify({
        showFileIcons: true,
        fileIcons: {
          "Projects/Alpha Note.md": { icon: "emoji:🚀", color: "#ef4444" },
        },
        folderIcons: {
          Projects: { icon: "emoji:📁✨", color: "#3b82f6" },
        },
      })
    );

    const onOpenNote = vi.fn();
    const onToggleFavorite = vi.fn();

    // 1. FavoritesTabView in List View
    const { container: favContainer, unmount: unmountFav } = render(
      <AppSettingsProvider>
        <FavoritesTabView
          notes={mockNotes}
          onOpenNote={onOpenNote}
          onToggleFavorite={onToggleFavorite}
        />
      </AppSettingsProvider>
    );

    // Rocket emoji should appear for Alpha Note with custom color
    const rocketEl = screen.getAllByText("🚀");
    expect(rocketEl.length).toBeGreaterThan(0);
    expect(rocketEl[0]).toHaveStyle({ color: "#ef4444" });

    // Folder custom icon should appear for Projects folder
    const folderIconEl = screen.getAllByText("📁✨");
    expect(folderIconEl.length).toBeGreaterThan(0);
    expect(folderIconEl[0]).toHaveStyle({ color: "#3b82f6" });

    // Switch to Card View in FavoritesTabView
    const favToggle = screen.getByLabelText(/เปลี่ยนเป็นมุมมองการ์ด|Switch to card view/i);
    fireEvent.click(favToggle);

    // In card view, custom icon and color should still render
    const rocketElCard = screen.getAllByText("🚀");
    expect(rocketElCard.length).toBeGreaterThan(0);
    expect(rocketElCard[0]).toHaveStyle({ color: "#ef4444" });

    unmountFav();

    // 2. TagsTabView
    const { unmount: unmountTags } = render(
      <AppSettingsProvider>
        <TagsTabView
          notes={mockNotes}
          onOpenNote={onOpenNote}
          onToggleFavorite={onToggleFavorite}
        />
      </AppSettingsProvider>
    );

    // Rocket emoji should appear for Alpha Note in TagsTabView
    const tagRocketEl = screen.getAllByText("🚀");
    expect(tagRocketEl.length).toBeGreaterThan(0);
    expect(tagRocketEl[0]).toHaveStyle({ color: "#ef4444" });

    // Folder custom icon should appear for Projects folder
    const tagFolderEl = screen.getAllByText("📁✨");
    expect(tagFolderEl.length).toBeGreaterThan(0);
    expect(tagFolderEl[0]).toHaveStyle({ color: "#3b82f6" });

    // Switch to card view in TagsTabView
    const tagToggle = screen.getByLabelText(/เปลี่ยนเป็นมุมมองการ์ด|Switch to card view/i);
    fireEvent.click(tagToggle);

    const tagRocketCard = screen.getAllByText("🚀");
    expect(tagRocketCard.length).toBeGreaterThan(0);
    expect(tagRocketCard[0]).toHaveStyle({ color: "#ef4444" });

    unmountTags();
  });
});
