import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrash, calculateNoteSize, formatByteSize } from "./useTrash";
import type { Note } from "@/hooks/useNotes";

describe("useTrash Hook and helpers", () => {
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

  it("calculates note size accurately", () => {
    const note: Partial<Note> = {
      title: "Test Note",
      content: "Hello World",
      fileName: "test.md",
      tags: ["work", "project"],
    };
    const size = calculateNoteSize(note);
    expect(size).toBeGreaterThan(0);
    expect(formatByteSize(size)).toMatch(/(B|KB)/);
  });

  it("formats byte sizes properly", () => {
    expect(formatByteSize(0)).toBe("0 KB");
    expect(formatByteSize(500)).toBe("500 B");
    expect(formatByteSize(2048)).toBe("2.0 KB");
    expect(formatByteSize(1048576 * 2.5)).toBe("2.5 MB");
  });

  it("moves notes to trash and retrieves metrics", () => {
    const { result } = renderHook(() => useTrash());

    const sampleNote: Note = {
      id: "note-1",
      title: "Project Plan",
      content: "# Plan details",
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 5000,
      fileName: "Project Plan.md",
      folderPath: "Work/Projects",
      tags: ["work"],
    };

    act(() => {
      result.current.moveToTrash(sampleNote);
    });

    expect(result.current.trashedNotes.length).toBe(1);
    expect(result.current.trashedNotes[0].id).toBe("note-1");
    expect(result.current.trashedNotes[0].originalFolderPath).toBe("Work/Projects");
    expect(result.current.metrics.count).toBe(1);
    expect(result.current.metrics.totalBytes).toBeGreaterThan(0);
  });

  it("restores notes from trash", () => {
    const { result } = renderHook(() => useTrash());

    const note1: Note = {
      id: "note-1",
      title: "Note 1",
      content: "Content 1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "note1.md",
    };
    const note2: Note = {
      id: "note-2",
      title: "Note 2",
      content: "Content 2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileName: "note2.md",
    };

    act(() => {
      result.current.moveToTrash([note1, note2]);
    });

    expect(result.current.trashedNotes.length).toBe(2);

    let restored: any[] = [];
    act(() => {
      restored = result.current.restoreFromTrash(["note-1"]);
    });

    expect(restored.length).toBe(1);
    expect(restored[0].id).toBe("note-1");
    expect(result.current.trashedNotes.length).toBe(1);
    expect(result.current.trashedNotes[0].id).toBe("note-2");
  });

  it("permanently deletes specific notes and empties trash", () => {
    const { result } = renderHook(() => useTrash());

    const note1: Note = {
      id: "n-1",
      title: "N1",
      content: "C1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const note2: Note = {
      id: "n-2",
      title: "N2",
      content: "C2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    act(() => {
      result.current.moveToTrash([note1, note2]);
    });

    act(() => {
      result.current.deletePermanently(["n-1"]);
    });

    expect(result.current.trashedNotes.length).toBe(1);
    expect(result.current.trashedNotes[0].id).toBe("n-2");

    act(() => {
      result.current.emptyTrash();
    });

    expect(result.current.trashedNotes.length).toBe(0);
    expect(result.current.metrics.count).toBe(0);
  });

  it("automatically purges expired notes", () => {
    const { result } = renderHook(() => useTrash());

    const oldNote: Note = {
      id: "old-note",
      title: "Old Note",
      content: "Expired",
      createdAt: Date.now() - 40 * 86400000,
      updatedAt: Date.now() - 40 * 86400000,
    };
    const recentNote: Note = {
      id: "recent-note",
      title: "Recent Note",
      content: "Active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    act(() => {
      result.current.moveToTrash([oldNote, recentNote]);
    });

    // Manually set deletedAt for oldNote to 35 days ago
    const stored = JSON.parse(window.localStorage.getItem("notes-app-trash") || "[]");
    stored[0].deletedAt = Date.now() - 35 * 86400000;
    window.localStorage.setItem("notes-app-trash", JSON.stringify(stored));

    // Force reload in hook
    window.dispatchEvent(new StorageEvent("storage", { key: "notes-app-trash" }));

    act(() => {
      result.current.autoCleanExpired(30); // 30 days retention
    });

    expect(result.current.trashedNotes.some((n) => n.id === "old-note")).toBe(false);
    expect(result.current.trashedNotes.some((n) => n.id === "recent-note")).toBe(true);
  });
});
