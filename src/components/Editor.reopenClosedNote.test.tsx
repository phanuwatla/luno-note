import { describe, expect, it } from "vitest";
import { closedNoteIds, noteEditorStateMap, clearNoteEditorHistory } from "@/components/Editor";
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
    let activeTabId: string | null = "home";
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
