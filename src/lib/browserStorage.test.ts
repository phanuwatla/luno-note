import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  getBrowserHistory,
  addBrowserHistory,
  removeBrowserHistoryItem,
  clearBrowserHistory,
  getBrowserBookmarks,
  addBrowserBookmark,
  removeBrowserBookmark,
  toggleBrowserBookmark,
  isBookmarked,
} from "./browserStorage";

describe("browserStorage", () => {
  const store: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
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

  describe("Browser History", () => {
    it("returns empty history initially", () => {
      expect(getBrowserHistory()).toEqual([]);
    });

    it("adds history items in reverse-chronological order", () => {
      addBrowserHistory({ url: "https://google.com", title: "Google" });
      addBrowserHistory({ url: "https://github.com", title: "GitHub" });

      const history = getBrowserHistory();
      expect(history.length).toBe(2);
      expect(history[0]?.url).toBe("https://github.com");
      expect(history[1]?.url).toBe("https://google.com");
    });

    it("updates existing latest entry instead of duplicating back-to-back", () => {
      addBrowserHistory({ url: "https://google.com", title: "Google" });
      addBrowserHistory({ url: "https://google.com", title: "Google Search" });

      const history = getBrowserHistory();
      expect(history.length).toBe(1);
      expect(history[0]?.title).toBe("Google Search");
    });

    it("removes a history item by id", () => {
      addBrowserHistory({ url: "https://site1.com", title: "Site 1" });
      addBrowserHistory({ url: "https://site2.com", title: "Site 2" });

      const history = getBrowserHistory();
      const idToRemove = history[0]!.id;

      removeBrowserHistoryItem(idToRemove);
      const updated = getBrowserHistory();
      expect(updated.length).toBe(1);
      expect(updated[0]?.url).toBe("https://site1.com");
    });

    it("clears all history", () => {
      addBrowserHistory({ url: "https://site1.com", title: "Site 1" });
      addBrowserHistory({ url: "https://site2.com", title: "Site 2" });
      clearBrowserHistory();
      expect(getBrowserHistory()).toEqual([]);
    });

    it("ignores about:blank or empty urls", () => {
      addBrowserHistory({ url: "", title: "Empty" });
      addBrowserHistory({ url: "about:blank", title: "Blank" });
      expect(getBrowserHistory()).toEqual([]);
    });
  });

  describe("Browser Bookmarks", () => {
    it("manages bookmarks correctly", () => {
      expect(getBrowserBookmarks()).toEqual([]);
      expect(isBookmarked("https://example.com")).toBe(false);

      addBrowserBookmark({ url: "https://example.com", title: "Example Domain" });
      expect(isBookmarked("https://example.com")).toBe(true);

      const bookmarks = getBrowserBookmarks();
      expect(bookmarks.length).toBe(1);
      expect(bookmarks[0]?.title).toBe("Example Domain");

      // Toggling should remove it
      const res = toggleBrowserBookmark({ url: "https://example.com" });
      expect(res.bookmarked).toBe(false);
      expect(isBookmarked("https://example.com")).toBe(false);
      expect(getBrowserBookmarks().length).toBe(0);

      // Toggling again should re-add it
      const res2 = toggleBrowserBookmark({ url: "https://example.com", title: "Example 2" });
      expect(res2.bookmarked).toBe(true);
      expect(isBookmarked("https://example.com")).toBe(true);
    });
  });
});
