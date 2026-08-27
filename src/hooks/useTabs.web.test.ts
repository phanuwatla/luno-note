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

  it("should restore web tabs from session", () => {
    const notesRef = { current: [] as Note[] };
    localStorageMock.setItem(
      "notes-app-open-tab-paths",
      JSON.stringify(["web:https://vitejs.dev", "settings"])
    );
    localStorageMock.setItem("notes-app-active-tab-path", JSON.stringify("web:https://vitejs.dev"));

    const { result } = renderHook(() => useTabs(notesRef));

    act(() => {
      result.current.restoreTabsFromSession([], true);
    });

    expect(result.current.openTabIds).toContain("web:https://vitejs.dev");
    expect(result.current.openTabIds).toContain("settings");
    expect(result.current.activeTabId).toBe("web:https://vitejs.dev");
  });
});
