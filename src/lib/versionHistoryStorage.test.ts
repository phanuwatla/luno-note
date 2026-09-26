import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  saveVersionSnapshot,
  getNoteVersionHistory,
  deleteVersionSnapshot,
  clearNoteHistory,
  getVersionSnapshot,
  groupVersionSnapshots,
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
    clearNoteHistory(dummyNote);
    expect(getNoteVersionHistory(dummyNote).length).toBe(0);
  });

  it("should preserve version history across app restarts when note.id changes to a new random UUID", () => {
    // 1. Session 1: User has a file in workspace and saves versions
    const session1Note: Note = {
      id: "uuid-before-app-close-1111",
      fileName: "architecture.md",
      folderPath: "docs",
      title: "Architecture",
      content: "---\ntags:\n  - design\n  - tech\n---\n# Architecture\nInitial architecture notes",
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 100000,
      tags: ["design", "tech"],
    };

    const snap = saveVersionSnapshot(session1Note, "manual", "Version 1");
    expect(snap).not.toBeNull();
    expect(snap?.tags).toEqual(["design", "tech"]);

    // 2. User closes app and reopens.
    // Index.tsx scans the workspace and generates a completely NEW random UUID for the file!
    const session2Note: Note = {
      id: "uuid-after-app-reopen-9999", // completely new random UUID!
      fileName: "architecture.md",
      folderPath: "docs",
      title: "Architecture",
      content: "---\ntags:\n  - design\n  - tech\n---\n# Architecture\nUpdated architecture notes",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ["design", "tech"],
    };

    // 3. User opens version history panel for this note
    const restoredHistory = getNoteVersionHistory(session2Note);
    expect(restoredHistory.length).toBe(1);
    expect(restoredHistory[0].id).toBe(snap?.id);
    expect(restoredHistory[0].tags).toEqual(["design", "tech"]);
    expect(restoredHistory[0].content).toContain("Initial architecture notes");

    // 4. User saves a new version in session 2
    const snap2 = saveVersionSnapshot(session2Note, "manual", "Version 2");
    expect(snap2).not.toBeNull();

    const updatedHistory = getNoteVersionHistory(session2Note);
    expect(updatedHistory.length).toBe(2);
    expect(updatedHistory[0].id).toBe(snap2?.id);
    expect(updatedHistory[1].id).toBe(snap?.id);
  });

  it("should preserve properties (frontmatter tags, custom properties, icon, isFavorite) in snapshot", () => {
    const noteWithProps: Note = {
      id: "note-props-1",
      fileName: "report.md",
      title: "Quarterly Report",
      content: "---\nauthor: Alice\nstatus: In Review\ntags:\n  - quarterly\n  - finance\nicon: 📊\nfavorite: true\n---\n# Quarterly Report\nSales increased by 20%",
      tags: ["quarterly", "finance"],
      icon: "📊",
      isFavorite: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const snap = saveVersionSnapshot(noteWithProps, "manual");
    expect(snap).not.toBeNull();
    expect(snap?.tags).toEqual(["quarterly", "finance"]);
    expect(snap?.icon).toBe("📊");
    expect(snap?.isFavorite).toBe(true);
    expect(snap?.frontmatterData?.author).toBe("Alice");
    expect(snap?.frontmatterData?.status).toBe("In Review");
    expect(snap?.content).toContain("tags:");
    expect(snap?.content).toContain("author: Alice");
    expect(snap?.content).toContain("Sales increased by 20%");
  });

  it("should synthesize frontmatter in snapshot content if note has tags but content was missing frontmatter block", () => {
    const noteWithoutFm: Note = {
      id: "note-nofm-1",
      fileName: "plain-note.md",
      title: "Plain Note",
      content: "# Plain Note\nContent without YAML header originally",
      tags: ["important", "todo"],
      icon: "⚡",
      isFavorite: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const snap = saveVersionSnapshot(noteWithoutFm, "manual");
    expect(snap).not.toBeNull();
    expect(snap?.tags).toEqual(["important", "todo"]);
    expect(snap?.icon).toBe("⚡");
    expect(snap?.isFavorite).toBe(true);
    // Snapshot content MUST have frontmatter synthesized so properties are not skipped!
    expect(snap?.content).toContain("---");
    expect(snap?.content).toContain("tags:");
    expect(snap?.content).toContain("- important");
    expect(snap?.content).toContain("- todo");
    expect(snap?.content).toContain("# Plain Note");
  });

  it("should not create duplicate pre-restore backup if content is identical to latest snapshot", () => {
    const note: Note = {
      id: "note-prerestore-1",
      title: "Note",
      content: "Exact content to restore",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const snap1 = saveVersionSnapshot(note, "pre-restore");
    expect(snap1).not.toBeNull();

    // Calling pre-restore again with identical content should return null
    const snap2 = saveVersionSnapshot(note, "pre-restore");
    expect(snap2).toBeNull();
    expect(getNoteVersionHistory(note).length).toBe(1);
  });

  it("should correctly resolve format and save snapshots for txt, md, html, and css files without corrupting non-md formats", () => {
    // 1. Text file
    const txtNote: Note = {
      id: "note-txt-1",
      fileName: "readme.txt",
      title: "Readme",
      content: "Line 1\nLine 2",
      tags: ["tag1"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const snapTxt = saveVersionSnapshot(txtNote, "manual");
    expect(snapTxt?.contentFormat).toBe("plain");
    // Plain text should NOT have YAML frontmatter injected
    expect(snapTxt?.content).toBe("Line 1\nLine 2");

    // 2. HTML file
    const htmlNote: Note = {
      id: "note-html-1",
      fileName: "index.html",
      title: "Index",
      content: "<h1>Title</h1><p>Paragraph</p>",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const snapHtml = saveVersionSnapshot(htmlNote, "manual");
    expect(snapHtml?.contentFormat).toBe("html");
    expect(snapHtml?.content).toBe("<h1>Title</h1><p>Paragraph</p>");

    // 3. CSS file
    const cssNote: Note = {
      id: "note-css-1",
      fileName: "style.css",
      title: "Styles",
      content: "body { background: #000; color: #fff; }",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const snapCss = saveVersionSnapshot(cssNote, "manual");
    expect(snapCss?.contentFormat).toBe("css");
    expect(snapCss?.content).toBe("body { background: #000; color: #fff; }");

    // 4. Markdown file
    const mdNote: Note = {
      id: "note-md-1",
      fileName: "doc.md",
      title: "Documentation",
      content: "# Hello World",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const snapMd = saveVersionSnapshot(mdNote, "manual");
    expect(snapMd?.contentFormat).toBe("markdown");
  });

  it("should dispatch luno:version-snapshot-saved event when snapshot is created or deleted", () => {
    let eventDetail: any = null;
    const handler = (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    };
    window.addEventListener("luno:version-snapshot-saved", handler);

    const snap = saveVersionSnapshot(dummyNote, "manual", "Event test");
    expect(snap).not.toBeNull();
    expect(eventDetail).not.toBeNull();
    expect(eventDetail?.noteId).toBe(dummyNote.id);
    expect(eventDetail?.versionId).toBe(snap?.id);

    eventDetail = null;
    deleteVersionSnapshot(dummyNote.id, snap!.id);
    expect(eventDetail).not.toBeNull();
    expect(eventDetail?.noteId).toBe(dummyNote.id);

    window.removeEventListener("luno:version-snapshot-saved", handler);
  });

  describe("groupVersionSnapshots", () => {
    it("should return empty array for empty snapshots", () => {
      expect(groupVersionSnapshots([])).toEqual([]);
    });

    it("should correctly categorize snapshots into Today, Yesterday, specific dates, Last week, Last month, and Older", () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const today = todayStart + 1000;
      const yesterday = todayStart - 1000;
      const threeDaysAgo = todayStart - 3 * 86400000 + 1000;
      const nineDaysAgo = todayStart - 9 * 86400000 + 1000;
      const twentyDaysAgo = todayStart - 20 * 86400000 + 1000;
      const fiftyDaysAgo = todayStart - 50 * 86400000 + 1000;

      const mockSnapshots = [
        { id: "1", noteId: "n1", timestamp: today, title: "1", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
        { id: "2", noteId: "n1", timestamp: yesterday, title: "2", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
        { id: "3", noteId: "n1", timestamp: threeDaysAgo, title: "3", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
        { id: "4", noteId: "n1", timestamp: nineDaysAgo, title: "4", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
        { id: "5", noteId: "n1", timestamp: twentyDaysAgo, title: "5", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
        { id: "6", noteId: "n1", timestamp: fiftyDaysAgo, title: "6", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
      ];

      const groups = groupVersionSnapshots(mockSnapshots, "YYYY-MM-DD", "en");
      expect(groups.length).toBeGreaterThanOrEqual(4);

      // Verify Today group
      const todayGroup = groups.find((g) => g.id === "today");
      expect(todayGroup).toBeDefined();
      expect(todayGroup?.title).toBe("Today");
      expect(todayGroup?.items[0].id).toBe("1");

      // Verify Last week group
      const lastWeekGroup = groups.find((g) => g.id === "lastWeek");
      expect(lastWeekGroup).toBeDefined();
      expect(lastWeekGroup?.title).toBe("Last week");

      // Verify Older group
      const olderGroup = groups.find((g) => g.id === "older");
      expect(olderGroup).toBeDefined();
      expect(olderGroup?.title).toBe("Older");
    });

    it("should honor custom Thai translations and custom date format", () => {
      const now = Date.now();
      const mockSnapshots = [
        { id: "1", noteId: "n1", timestamp: now, title: "1", content: "", wordCount: 0, charCount: 0, trigger: "auto" as const },
      ];

      const groups = groupVersionSnapshots(mockSnapshots, "DD/MM/YYYY", "th", {
        today: "วันนี้",
        yesterday: "เมื่อวาน",
        lastWeek: "สัปดาห์ที่แล้ว",
        lastMonth: "เดือนที่แล้ว",
        older: "เก่ากว่านี้",
      });

      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("today");
      expect(groups[0].title).toBe("วันนี้");
    });
  });
});

