import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTabs } from "./useTabs";
import type { Note } from "./useNotes";

describe("useTabs with web viewer tabs", () => {
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

  it("should open and close web tabs", () => {
    const notesRef = { current: [] as Note[] };
    const { result } = renderHook(() => useTabs(notesRef));

    act(() => {
      result.current.openTab("web:https://github.com");
    });

    expect(result.current.openTabIds).toContain("web:https://github.com");
    expect(result.current.activeTabId).toBe("web:https://github.com");

    act(() => {
      result.current.closeTab("web:https://github.com", []);
    });

    expect(result.current.openTabIds).not.toContain("web:https://github.com");
    expect(result.current.activeTabId).toBeNull();
  });

  it("should preserve web tabs when removing tabs for deleted notes", () => {
    const notesRef = { current: [] as Note[] };
    const { result } = renderHook(() => useTabs(notesRef));

    act(() => {
      result.current.openTab("note-1");
      result.current.openTab("web:https://google.com");
      result.current.openTab("settings");
      result.current.openTab("luno-ai");
    });

    act(() => {
      result.current.removeTabsForDeletedNotes(new Set(["note-2"]));
    });

    expect(result.current.openTabIds).toContain("web:https://google.com");
    expect(result.current.openTabIds).toContain("settings");
    expect(result.current.openTabIds).toContain("luno-ai");
    expect(result.current.openTabIds).not.toContain("note-1");
  });

  it("should restore web tabs from session", async () => {
    const notesRef = { current: [] as Note[] };
    localStorageMock.setItem(
      "notes-app-open-tab-paths",
      JSON.stringify(["web:https://vitejs.dev", "settings"])
    );
    localStorageMock.setItem("notes-app-active-tab-path", JSON.stringify("web:https://vitejs.dev"));

    const { result } = renderHook(() => useTabs(notesRef));

    await act(async () => {
      await result.current.restoreTabsFromSession([], true, "lastNote");
    });

    expect(result.current.openTabIds).toContain("web:https://vitejs.dev");
    expect(result.current.openTabIds).toContain("settings");
    expect(result.current.activeTabId).toBe("web:https://vitejs.dev");
  });

  it("should open home by default on startup", async () => {
    const notesRef = { current: [] as Note[] };
    const { result } = renderHook(() => useTabs(notesRef));

    await act(async () => {
      await result.current.restoreTabsFromSession([], true, "home");
    });

    expect(result.current.openTabIds).toContain("home");
    expect(result.current.activeTabId).toBe("home");
  });

  it("should reset tabs when onStartup is blank", async () => {
    const notesRef = { current: [] as Note[] };
    localStorageMock.setItem(
      "notes-app-open-tab-paths",
      JSON.stringify(["web:https://vitejs.dev", "settings"])
    );
    const { result } = renderHook(() => useTabs(notesRef));

    await act(async () => {
      await result.current.restoreTabsFromSession([], true, "blank");
    });

    expect(result.current.openTabIds).toHaveLength(0);
    expect(result.current.activeTabId).toBeNull();
  });

  it("should sanitize and close tabs not allowed in compact (Activity Bar) layout", () => {
    const notesRef = { current: [{ id: "note-1", title: "Note 1" }] as Note[] };
    const { result } = renderHook(() => useTabs(notesRef));

    act(() => {
      result.current.openTab("home");
      result.current.openTab("favorites");
      result.current.openTab("tags");
      result.current.openTab("trash");
      result.current.openTab("luno-ai");
      result.current.openTab("settings");
      result.current.openTab("help");
      result.current.openTab("templates");
      result.current.openTab("note-1");
      result.current.openTab("web:https://google.com");
    });

    expect(result.current.openTabIds).toContain("home");
    expect(result.current.openTabIds).toContain("favorites");
    expect(result.current.openTabIds).toContain("tags");
    expect(result.current.openTabIds).toContain("trash");
    expect(result.current.openTabIds).toContain("luno-ai");

    act(() => {
      result.current.sanitizeTabsForLayout("compact");
    });

    expect(result.current.openTabIds).not.toContain("home");
    expect(result.current.openTabIds).not.toContain("favorites");
    expect(result.current.openTabIds).not.toContain("tags");
    expect(result.current.openTabIds).not.toContain("trash");
    expect(result.current.openTabIds).not.toContain("luno-ai");

    // Allowed tabs remain intact
    expect(result.current.openTabIds).toContain("settings");
    expect(result.current.openTabIds).toContain("help");
    expect(result.current.openTabIds).toContain("templates");
    expect(result.current.openTabIds).toContain("note-1");
    expect(result.current.openTabIds).toContain("web:https://google.com");
  });

  it("should not restore home tab when appLayout is compact on startup", async () => {
    const notesRef = { current: [{ id: "note-1", title: "Note 1" }] as Note[] };
    localStorageMock.setItem("notes-app-settings", JSON.stringify({ appLayout: "compact" }));
    const { result } = renderHook(() => useTabs(notesRef));

    await act(async () => {
      await result.current.restoreTabsFromSession(notesRef.current, true, "home");
    });

    expect(result.current.openTabIds).not.toContain("home");
    expect(result.current.openTabIds).toContain("note-1");
    expect(result.current.activeTabId).toBe("note-1");
  });
});
