import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  saveVersionSnapshot,
  getNoteVersionHistory,
  deleteVersionSnapshot,
  clearNoteHistory,
  getVersionSnapshot,
} from "./versionHistoryStorage";
import type { Note } from "@/hooks/useNotes";

describe("versionHistoryStorage", () => {
  const dummyNote: Note = {
    id: "test-note-1",
    title: "Test Note",
    content: "Initial content",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const store: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => {
        for (const k in store) delete store[k];
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    for (const k in store) delete store[k];
  });

  it("should save and retrieve version snapshots", () => {
    const snap1 = saveVersionSnapshot(dummyNote, "manual", "First save");
    expect(snap1).not.toBeNull();
    expect(snap1?.label).toBe("First save");

    const history = getNoteVersionHistory("test-note-1");
    expect(history.length).toBe(1);
    expect(history[0].content).toBe("Initial content");

    const retrieved = getVersionSnapshot("test-note-1", snap1!.id);
    expect(retrieved?.id).toBe(snap1!.id);
  });

  it("should deduplicate auto snapshots if content unchanged", () => {
    saveVersionSnapshot(dummyNote, "auto");
    const snap2 = saveVersionSnapshot(dummyNote, "auto");
    expect(snap2).toBeNull();

    const history = getNoteVersionHistory("test-note-1");
    expect(history.length).toBe(1);
  });

  it("should throttle auto snapshots if within 5-minute interval", () => {
    saveVersionSnapshot(dummyNote, "auto");
    // Even if content changed, auto snapshot within 5 minutes is throttled
    const snap2 = saveVersionSnapshot({ ...dummyNote, content: "Initial content modified slightly" }, "auto");
    expect(snap2).toBeNull();

    // Manual save always succeeds
    const snapManual = saveVersionSnapshot({ ...dummyNote, content: "Initial content modified slightly" }, "manual");
    expect(snapManual).not.toBeNull();
  });

  it("should delete a version snapshot", () => {
    const snap1 = saveVersionSnapshot(dummyNote, "manual");
    const snap2 = saveVersionSnapshot({ ...dummyNote, content: "Changed content" }, "manual");

    let history = getNoteVersionHistory("test-note-1");
    expect(history.length).toBe(2);

    deleteVersionSnapshot("test-note-1", snap1!.id);
    history = getNoteVersionHistory("test-note-1");
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(snap2!.id);
  });

  it("should clear all history for a note", () => {
    saveVersionSnapshot(dummyNote, "manual");
    clearNoteHistory("test-note-1");
    expect(getNoteVersionHistory("test-note-1").length).toBe(0);
  });
});
