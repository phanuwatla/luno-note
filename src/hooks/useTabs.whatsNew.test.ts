import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTabs,
  isSystemOrWebTab,
  isFirstLaunchOnVersion,
  markVersionAsSeen,
  LUNO_LAST_SEEN_VERSION_KEY,
} from "./useTabs";
import type { Note } from "./useNotes";
import { APP_VERSION } from "@/lib/appVersion";

describe("useTabs WhatsNew & First Launch On Version", () => {
  const storageMap = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, String(value));
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
    clear: () => {
      storageMap.clear();
    },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    get length() {
      return storageMap.size;
    },
  };

  beforeEach(() => {
    storageMap.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  it("identifies whats-new tabs as system tabs", () => {
    expect(isSystemOrWebTab("whats-new")).toBe(true);
    expect(isSystemOrWebTab("whats-new:1.3.0")).toBe(true);
    expect(isSystemOrWebTab("regular-note")).toBe(false);
  });

  it("detects first launch on version when last seen version is missing or different", () => {
    expect(isFirstLaunchOnVersion()).toBe(true);

    markVersionAsSeen();
    expect(storageMap.get(LUNO_LAST_SEEN_VERSION_KEY)).toBe(APP_VERSION);
    expect(isFirstLaunchOnVersion()).toBe(false);

    storageMap.set(LUNO_LAST_SEEN_VERSION_KEY, "0.9.0");
    expect(isFirstLaunchOnVersion()).toBe(true);
  });

  it("automatically opens whats-new and bypasses onStartup on first launch of that version", async () => {
    // Simulating first launch on this version
    storageMap.delete(LUNO_LAST_SEEN_VERSION_KEY);

    const testNotes: Note[] = [
      {
        id: "note-1",
        title: "Test Note 1",
        content: "Content 1",
        createdAt: 100,
        updatedAt: 100,
        fileName: "test1.md",
      },
    ];
    const notesRef = { current: testNotes };

    const { result } = renderHook(() => useTabs(notesRef));

    // Calling restoreTabsFromSession with forceWhatsNew = true
    await act(async () => {
      await result.current.restoreTabsFromSession(testNotes, true, "home", undefined, true);
    });

    // onStartup = 'home' is bypassed on first launch and ONLY whats-new is open!
    expect(result.current.openTabIds).toEqual(["whats-new"]);
    expect(result.current.activeTabId).toBe("whats-new");
    // Version is marked as seen
    expect(storageMap.get(LUNO_LAST_SEEN_VERSION_KEY)).toBe(APP_VERSION);
  });

  it("opens ONLY whats-new as a single tab on first launch after update even when session had multiple open tabs", async () => {
    // Simulating pre-existing open tabs from previous session before update
    storageMap.set("notes-app-open-tabs", JSON.stringify(["note-1", "note-2"]));
    storageMap.set("notes-app-open-tab-paths", JSON.stringify(["test1.md", "test2.md"]));
    storageMap.set("notes-app-active-tab", JSON.stringify("note-1"));
    storageMap.set(LUNO_LAST_SEEN_VERSION_KEY, "1.3.2"); // older version

    const testNotes: Note[] = [
      {
        id: "note-1",
        title: "Test Note 1",
        content: "Content 1",
        createdAt: 100,
        updatedAt: 100,
        fileName: "test1.md",
      },
      {
        id: "note-2",
        title: "Test Note 2",
        content: "Content 2",
        createdAt: 100,
        updatedAt: 100,
        fileName: "test2.md",
      },
    ];
    const notesRef = { current: testNotes };

    const { result } = renderHook(() => useTabs(notesRef));

    // Calling restoreTabsFromSession with forceWhatsNew = true
    await act(async () => {
      await result.current.restoreTabsFromSession(testNotes, true, "lastNote", undefined, true);
    });

    // Must have ONLY one tab open: whats-new
    expect(result.current.openTabIds).toEqual(["whats-new"]);
    expect(result.current.activeTabId).toBe("whats-new");
    expect(storageMap.get(LUNO_LAST_SEEN_VERSION_KEY)).toBe(APP_VERSION);
  });

  it("respects onStartup setting on subsequent launches of the same version", async () => {
    // Simulating that the user has already seen this version
    storageMap.set(LUNO_LAST_SEEN_VERSION_KEY, APP_VERSION);

    const testNotes: Note[] = [
      {
        id: "note-1",
        title: "Test Note 1",
        content: "Content 1",
        createdAt: 100,
        updatedAt: 100,
        fileName: "test1.md",
      },
    ];
    const notesRef = { current: testNotes };

    const { result } = renderHook(() => useTabs(notesRef));

    // Calling restoreTabsFromSession with onStartup = 'home'
    await act(async () => {
      await result.current.restoreTabsFromSession(testNotes, false, "home");
    });

    // On subsequent launch, onStartup 'home' is normally honored
    expect(result.current.openTabIds).toEqual(["home"]);
    expect(result.current.activeTabId).toBe("home");
  });
});
