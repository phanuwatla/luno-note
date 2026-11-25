import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import Editor, { closedNoteIds, noteEditorStateMap, clearNoteEditorHistory } from "@/components/Editor";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isSystemOrWebTab } from "@/hooks/useTabs";
import type { Note } from "@/hooks/useNotes";

describe("Reopening closed note - activeEditorNote and history isolation", () => {
  it("should remove note from noteEditorStateMap and add to closedNoteIds when closed", () => {
    const noteId = "note-test-reopen";
    clearNoteEditorHistory(noteId);
    expect(closedNoteIds.has(noteId)).toBe(true);
    expect(noteEditorStateMap.has(noteId)).toBe(false);
  });

  it("should not return closed note as activeEditorNote when active tab is a system tab (e.g. home)", () => {
    const note1: Note = {
      id: "note-1",
      title: "Note 1",
      content: "Hello World",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "Note 1.md",
    };
    const notes = [note1];

    // Simulate scenario:
    // Initially Note 1 and Home tab are open, Note 1 is active.
    let openTabIds = ["home", "note-1"];
    let activeTabId: string | null = "note-1";
    let lastActiveNoteId: string | null = "note-1";

    const getActiveEditorNote = () => {
      if (isSystemOrWebTab(activeTabId || "")) {
        const validLast =
          lastActiveNoteId && openTabIds.includes(lastActiveNoteId) && !isSystemOrWebTab(lastActiveNoteId)
            ? notes.find((n) => n.id === lastActiveNoteId)
            : null;
        if (validLast) return validLast;

        const fallbackId = openTabIds.find((id) => !isSystemOrWebTab(id));
        if (fallbackId) {
          return notes.find((n) => n.id === fallbackId) ?? null;
        }
        return null;
      }
      return notes.find((n) => n.id === activeTabId) ?? null;
    };

    expect(getActiveEditorNote()?.id).toBe("note-1");

    // 1. User closes Note 1 tab
    clearNoteEditorHistory("note-1");
    openTabIds = ["home"];
    activeTabId = "home";
    // Sync lastActiveNoteId as done in handleCloseTab
    if (lastActiveNoteId === "note-1") {
      const nextValid = openTabIds.find((t) => t !== "note-1" && !isSystemOrWebTab(t)) ?? null;
      lastActiveNoteId = nextValid;
    }

    // 2. Active editor note MUST become null (no open notes), not stale note-1
    expect(getActiveEditorNote()).toBeNull();

    // 3. User reopens Note 1 tab
    openTabIds = ["home", "note-1"];
    activeTabId = "note-1";
    lastActiveNoteId = "note-1";

    // 4. Active editor note now transitions from null to note-1, ensuring React triggers content reload
    const reopened = getActiveEditorNote();
    expect(reopened?.id).toBe("note-1");
    expect(reopened?.content).toBe("Hello World");
  });

  it("should switch activeEditorNote to another open note if available when a note tab is closed", () => {
    const note1: Note = {
      id: "note-1",
      title: "Note 1",
      content: "Content 1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "Note 1.md",
    };
    const note2: Note = {
      id: "note-2",
      title: "Note 2",
      content: "Content 2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "Note 2.md",
    };
    const notes = [note1, note2];

    let openTabIds = ["home", "note-1", "note-2"];
    const activeTabId: string | null = "home";
    let lastActiveNoteId: string | null = "note-1";

    const getActiveEditorNote = () => {
      if (isSystemOrWebTab(activeTabId || "")) {
        const validLast =
          lastActiveNoteId && openTabIds.includes(lastActiveNoteId) && !isSystemOrWebTab(lastActiveNoteId)
            ? notes.find((n) => n.id === lastActiveNoteId)
            : null;
        if (validLast) return validLast;

        const fallbackId = openTabIds.find((id) => !isSystemOrWebTab(id));
        if (fallbackId) {
          return notes.find((n) => n.id === fallbackId) ?? null;
        }
        return null;
      }
      return notes.find((n) => n.id === activeTabId) ?? null;
    };

    // Before closing note-1: since note-1 is in openTabIds, it is the valid last active note
    expect(getActiveEditorNote()?.id).toBe("note-1");

    // Close note-1 while on home tab
    clearNoteEditorHistory("note-1");
    openTabIds = ["home", "note-2"];
    if (lastActiveNoteId === "note-1") {
      const nextValid = openTabIds.find((t) => t !== "note-1" && !isSystemOrWebTab(t)) ?? null;
      lastActiveNoteId = nextValid;
    }

    // Now activeEditorNote MUST transition to note-2, NOT note-1
    expect(getActiveEditorNote()?.id).toBe("note-2");
  });
});

describe("Editor multi-tab switching and tab-close content preservation", () => {
  beforeEach(() => {
    noteEditorStateMap.clear();
    closedNoteIds.clear();
  });

  const makeNote = (id: string, fileName: string, content: string): Note => ({
    id,
    title: fileName.replace(/\.md$/i, ""),
    fileName,
    content,
    contentFormat: "markdown",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const renderEditorWithNote = (note: Note | null, notes: Note[]) => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const onCreate = vi.fn();
    const renderView = (activeNote: Note | null, allNotes: Note[] = notes) => (
      <AppSettingsProvider>
        <TooltipProvider>
          <Editor
            note={activeNote}
            notes={allNotes}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreate={onCreate}
            onOpenSidebar={vi.fn()}
          />
        </TooltipProvider>
      </AppSettingsProvider>
    );
    const utils = render(renderView(note, notes));
    return {
      ...utils,
      rerenderNote: (nextNote: Note | null, nextNotes: Note[] = notes) =>
        utils.rerender(renderView(nextNote, nextNotes)),
      onUpdate,
    };
  };

  it("preserves the remaining tab's content when closing an active tab and focusing the other tab", () => {
    const reviewNote = makeNote(
      "note-review",
      "review.md",
      "# review\n\nImportant review notes that must never be cleared."
    );
    const untitledNote = makeNote("note-untitled", "Untitled.md", "# Untitled\n\n");
    const allNotes = [reviewNote, untitledNote];

    // 1. Open review.md first (populates noteEditorStateMap for review.md)
    const { container, rerenderNote, unmount } = renderEditorWithNote(reviewNote, allNotes);
    expect(container.textContent).toContain("Important review notes that must never be cleared.");

    // 2. Switch to Untitled.md (Tab 2)
    act(() => {
      rerenderNote(untitledNote, allNotes);
    });
    expect(container.textContent).toContain("Untitled");

    // 3. Close Untitled.md tab (dispatches clearNoteEditorHistory which clears activeNoteRef + editor state)
    //    and immediately switch focus back to review.md
    act(() => {
      clearNoteEditorHistory(untitledNote.id);
      rerenderNote(reviewNote, [reviewNote]);
    });

    // 4. review.md MUST retain its full content (never overwritten by empty cleanState)
    expect(container.textContent).toContain("Important review notes that must never be cleared.");
    const preservedState = noteEditorStateMap.get(reviewNote.id);
    expect(preservedState?.doc.textContent).toContain("Important review notes that must never be cleared.");

    unmount();
  });

  it("preserves an open file's content after creating a new file (including a transient null note) and clicking back", () => {
    const reviewNote = makeNote(
      "note-review-2",
      "review.md",
      "# review\n\nExisting content before creating a new file."
    );
    const newUntitled = makeNote("note-new-untitled", "Untitled.md", "# Untitled\n\n");

    // 1. Start on review.md
    const { container, rerenderNote, unmount } = renderEditorWithNote(reviewNote, [reviewNote]);
    expect(container.textContent).toContain("Existing content before creating a new file.");

    // 2. Simulate creating a new file where note briefly transitions through null -> newUntitled
    act(() => {
      rerenderNote(null, [reviewNote]);
    });
    act(() => {
      rerenderNote(newUntitled, [reviewNote, newUntitled]);
    });
    expect(container.textContent).toContain("Untitled");

    // 3. Click back to review.md
    act(() => {
      rerenderNote(reviewNote, [reviewNote, newUntitled]);
    });

    // 4. review.md MUST retain its full content
    expect(container.textContent).toContain("Existing content before creating a new file.");
    const preservedState = noteEditorStateMap.get(reviewNote.id);
    expect(preservedState?.doc.textContent).toContain("Existing content before creating a new file.");

    unmount();
  });
});
