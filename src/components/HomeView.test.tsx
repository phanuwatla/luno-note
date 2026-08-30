import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeView from "./HomeView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";

describe("HomeView Component", () => {
  const mockNotes: Note[] = [
    {
      id: "note-1",
      title: "Sprint 2 - Planning",
      fileName: "Sprint 2 - Planning.md",
      content: "---\ntags: [Work]\n---\nPlanning details",
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 5000,
      isFavorite: false,
    },
    {
      id: "note-2",
      title: "Project Roadmap",
      fileName: "Project Roadmap.md",
      content: "---\ntags: [Work, Roadmap]\n---\nProject milestones",
      createdAt: Date.now() - 20000,
      updatedAt: Date.now() - 1000,
      isFavorite: true,
    },
  ];

  it("renders welcome header and template cards", () => {
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
          onCreateWithTemplate={vi.fn()}
        />
      </AppSettingsProvider>
    );

    expect(screen.getAllByText(/Welcome to Luno|ยินดีต้อนรับสู่ Luno/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Daily Note|บันทึกประจำวัน/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/To-Do List|รายการสิ่งที่ต้องทำ/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Meeting Notes|บันทึกการประชุม/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders recent notes and favorite notes separately", () => {
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
        />
      </AppSettingsProvider>
    );

    expect(screen.getByText("Sprint 2 - Planning")).toBeInTheDocument();
    expect(screen.getAllByText("Project Roadmap").length).toBeGreaterThanOrEqual(1);
  });

  it("triggers template creation callback when clicking a template card", () => {
    const handleCreateWithTemplate = vi.fn();
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
          onCreateWithTemplate={handleCreateWithTemplate}
        />
      </AppSettingsProvider>
    );

    const dailyNoteCard = screen.getByText(/Daily Note|บันทึกประจำวัน/i).closest("div");
    if (dailyNoteCard) {
      fireEvent.click(dailyNoteCard);
      expect(handleCreateWithTemplate).toHaveBeenCalledWith("daily");
    }
  });

  it("triggers note open when clicking a note item", () => {
    const handleOpenNote = vi.fn();
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={handleOpenNote}
        />
      </AppSettingsProvider>
    );

    const noteElement = screen.getByText("Sprint 2 - Planning");
    fireEvent.click(noteElement);
    expect(handleOpenNote).toHaveBeenCalledWith("note-1");
  });

  it("triggers toggle favorite when clicking the star icon", () => {
    const handleToggleFavorite = vi.fn();
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
          onToggleFavorite={handleToggleFavorite}
        />
      </AppSettingsProvider>
    );

    const starButtons = screen.getAllByRole("button", { name: /Unstar note|ยกเลิกติดดาว/i });
    expect(starButtons.length).toBeGreaterThan(0);
    fireEvent.click(starButtons[0]);
    expect(handleToggleFavorite).toHaveBeenCalledWith("note-2");
  });

  it("filters notes in real time when typing in search box", () => {
    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
        />
      </AppSettingsProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search notes|ค้นหาโน้ต/i);
    expect(searchInput).toBeInTheDocument();

    // Type "Sprint"
    fireEvent.change(searchInput, { target: { value: "Sprint" } });
    expect(screen.getByText("Sprint 2 - Planning")).toBeInTheDocument();

    // Type non-existent query
    fireEvent.change(searchInput, { target: { value: "Nonexistent" } });
    expect(screen.queryByText("Sprint 2 - Planning")).not.toBeInTheDocument();
  });

  it("displays OS user account username in greeting when available", async () => {
    (window as any).electronAPI = {
      getOsUserInfo: vi.fn().mockResolvedValue({ username: "LENOVO" }),
    };

    render(
      <AppSettingsProvider>
        <HomeView
          notes={mockNotes}
          onOpenNote={vi.fn()}
        />
      </AppSettingsProvider>
    );

    expect(await screen.findByText(/LENOVO/)).toBeInTheDocument();
    delete (window as any).electronAPI;
  });
});
