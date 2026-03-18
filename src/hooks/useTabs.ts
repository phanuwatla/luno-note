import { useState, useCallback, useRef } from "react";

export function useTabs() {
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const openTabIdsRef = useRef<string[]>([]);
  const activeTabIdRef = useRef<string | null>(null);

  const syncedSetOpenTabIds = useCallback((updater: (prev: string[]) => string[]) => {
    setOpenTabIds((prev) => {
      const next = updater(prev);
      openTabIdsRef.current = next;
      return next;
    });
  }, []);

  const syncedSetActiveTabId = useCallback((id: string | null) => {
    activeTabIdRef.current = id;
    setActiveTabId(id);
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
        syncedSetActiveTabId(allNoteIds.find((nid) => nid !== id) ?? null);
      }
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const removeTabsForDeletedNotes = useCallback((existingIds: Set<string>) => {
    const next = openTabIdsRef.current.filter((id) => existingIds.has(id));
    syncedSetOpenTabIds(() => next);
    if (activeTabIdRef.current && !existingIds.has(activeTabIdRef.current)) {
      syncedSetActiveTabId(next[0] ?? null);
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    removeTabsForDeletedNotes,
    setActiveTabId: syncedSetActiveTabId,
  };
}
