import { useState, useCallback, useRef } from "react";

const TABS_STORAGE_KEY = "notes-app-open-tabs";
const ACTIVE_TAB_STORAGE_KEY = "notes-app-active-tab";

function loadSavedTabs(): { openTabIds: string[]; activeTabId: string | null } {
  try {
    const rawTabs = localStorage.getItem(TABS_STORAGE_KEY);
    const rawActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    const openTabIds = rawTabs ? JSON.parse(rawTabs) : [];
    const activeTabId = rawActive ? JSON.parse(rawActive) : null;
    return {
      openTabIds: Array.isArray(openTabIds) ? openTabIds : [],
      activeTabId: typeof activeTabId === "string" ? activeTabId : null,
    };
  } catch {
    return { openTabIds: [], activeTabId: null };
  }
}

function saveTabs(openTabIds: string[], activeTabId: string | null) {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(openTabIds));
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, JSON.stringify(activeTabId));
  } catch {
    /* ignore storage errors */
  }
}

export function useTabs() {
  const initial = loadSavedTabs();
  const [openTabIds, setOpenTabIds] = useState<string[]>(initial.openTabIds);
  const [activeTabId, setActiveTabId] = useState<string | null>(initial.activeTabId);
  const openTabIdsRef = useRef<string[]>(initial.openTabIds);
  const activeTabIdRef = useRef<string | null>(initial.activeTabId);

  const syncedSetOpenTabIds = useCallback((updater: (prev: string[]) => string[]) => {
    setOpenTabIds((prev) => {
      const next = updater(prev);
      openTabIdsRef.current = next;
      saveTabs(next, activeTabIdRef.current);
      return next;
    });
  }, []);

  const syncedSetActiveTabId = useCallback((id: string | null) => {
    activeTabIdRef.current = id;
    setActiveTabId(id);
    saveTabs(openTabIdsRef.current, id);
  }, []);

  const openTab = useCallback((id: string) => {
    syncedSetOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    syncedSetActiveTabId(id);
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const closeTab = useCallback((id: string, allNoteIds: string[]) => {
    const currentTabs = openTabIdsRef.current;
    const next = currentTabs.filter((t) => t !== id);
    syncedSetOpenTabIds(() => next);

    if (activeTabIdRef.current === id) {
      if (next.length > 0) {
        const idx = currentTabs.indexOf(id);
        syncedSetActiveTabId(next[Math.min(idx, next.length - 1)]);
      } else {
        syncedSetActiveTabId(null);
      }
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const removeTabsForDeletedNotes = useCallback((existingIds: Set<string>) => {
    const next = openTabIdsRef.current.filter((id) => id === "settings" || id === "luno-ai" || existingIds.has(id));
    syncedSetOpenTabIds(() => next);
    if (activeTabIdRef.current && activeTabIdRef.current !== "settings" && activeTabIdRef.current !== "luno-ai" && !existingIds.has(activeTabIdRef.current)) {
      syncedSetActiveTabId(next[0] ?? null);
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    syncedSetOpenTabIds((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length || fromIndex === toIndex) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [syncedSetOpenTabIds]);

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    removeTabsForDeletedNotes,
    reorderTabs,
    setActiveTabId: syncedSetActiveTabId,
  };
}
