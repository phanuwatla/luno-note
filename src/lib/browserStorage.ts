/**
 * Browser storage utility for managing browsing history, bookmarks, and site preferences
 * Persisted in localStorage and synchronized with CustomEvents across open tabs
 */

export interface BrowserHistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  favicon?: string;
}

export interface BrowserBookmarkItem {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  favicon?: string;
}

const HISTORY_STORAGE_KEY = "luno_browser_history";
const BOOKMARKS_STORAGE_KEY = "luno_browser_bookmarks";
const MAX_HISTORY_ITEMS = 500;

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {}
  return null;
}

function dispatchStorageEvent(name: string, detail: unknown): void {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

function safeGenerateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getBrowserHistory(): BrowserHistoryItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to load browser history from storage:", err);
    return [];
  }
}

export function saveBrowserHistory(items: BrowserHistoryItem[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    dispatchStorageEvent("luno:browser-history-updated", trimmed);
  } catch (err) {
    console.warn("Failed to save browser history:", err);
  }
}

export function addBrowserHistory(item: {
  url: string;
  title?: string;
  timestamp?: number;
  favicon?: string;
}): BrowserHistoryItem[] {
  const cleanUrl = (item.url || "").trim();
  if (!cleanUrl || cleanUrl === "about:blank" || cleanUrl.startsWith("javascript:")) {
    return getBrowserHistory();
  }

  const current = getBrowserHistory();
  const title = (item.title || "").trim() || cleanUrl;
  const timestamp = item.timestamp || Date.now();

  // If the very top item has the same URL, update its timestamp & title instead of creating a duplicate
  if (current.length > 0 && current[0]?.url === cleanUrl) {
    current[0] = {
      ...current[0],
      title: title || current[0].title,
      timestamp,
      favicon: item.favicon || current[0].favicon,
    };
    saveBrowserHistory(current);
    return current;
  }

  // Remove duplicate entries of this exact URL from recent history to keep it clean, then prepend
  const filtered = current.filter((h) => h.url !== cleanUrl);
  const newItem: BrowserHistoryItem = {
    id: safeGenerateId(),
    url: cleanUrl,
    title,
    timestamp,
    favicon: item.favicon,
  };

  const updated = [newItem, ...filtered];
  saveBrowserHistory(updated);
  return updated;
}

export function removeBrowserHistoryItem(id: string): BrowserHistoryItem[] {
  const current = getBrowserHistory();
  const updated = current.filter((item) => item.id !== id);
  saveBrowserHistory(updated);
  return updated;
}

export function clearBrowserHistory(): void {
  saveBrowserHistory([]);
}

export function getBrowserBookmarks(): BrowserBookmarkItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to load browser bookmarks:", err);
    return [];
  }
}

export function saveBrowserBookmarks(items: BrowserBookmarkItem[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(items));
    dispatchStorageEvent("luno:browser-bookmarks-updated", items);
  } catch (err) {
    console.warn("Failed to save browser bookmarks:", err);
  }
}

export function isBookmarked(url: string): boolean {
  if (!url) return false;
  const bookmarks = getBrowserBookmarks();
  return bookmarks.some((b) => b.url === url);
}

export function addBrowserBookmark(item: {
  url: string;
  title?: string;
  favicon?: string;
}): BrowserBookmarkItem[] {
  const cleanUrl = (item.url || "").trim();
  if (!cleanUrl || cleanUrl === "about:blank") return getBrowserBookmarks();

  const current = getBrowserBookmarks();
  const existing = current.find((b) => b.url === cleanUrl);
  if (existing) {
    return current;
  }

  const newBookmark: BrowserBookmarkItem = {
    id: safeGenerateId(),
    url: cleanUrl,
    title: (item.title || "").trim() || cleanUrl,
    createdAt: Date.now(),
    favicon: item.favicon,
  };

  const updated = [newBookmark, ...current];
  saveBrowserBookmarks(updated);
  return updated;
}

export function removeBrowserBookmark(urlOrId: string): BrowserBookmarkItem[] {
  const current = getBrowserBookmarks();
  const updated = current.filter((b) => b.id !== urlOrId && b.url !== urlOrId);
  saveBrowserBookmarks(updated);
  return updated;
}

export function toggleBrowserBookmark(item: {
  url: string;
  title?: string;
  favicon?: string;
}): { bookmarked: boolean; bookmarks: BrowserBookmarkItem[] } {
  if (isBookmarked(item.url)) {
    const bookmarks = removeBrowserBookmark(item.url);
    return { bookmarked: false, bookmarks };
  } else {
    const bookmarks = addBrowserBookmark(item);
    return { bookmarked: true, bookmarks };
  }
}
