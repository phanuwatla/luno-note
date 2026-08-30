import { useState, useCallback, useRef } from "react";
import type { Note } from "@/hooks/useNotes";

const TABS_STORAGE_KEY = "notes-app-open-tabs";
const ACTIVE_TAB_STORAGE_KEY = "notes-app-active-tab";
const TAB_PATHS_STORAGE_KEY = "notes-app-open-tab-paths";
const ACTIVE_TAB_PATH_STORAGE_KEY = "notes-app-active-tab-path";

function getTabPath(id: string, notes?: Note[]): string {
  if (id === "settings" || id === "luno-ai" || id === "home" || id === "trash" || id === "templates" || id.startsWith("web:")) return id;
  if (!notes) return id;
  const found = notes.find((n) => n.id === id);
  if (found) {
    return found.fileName ? (found.folderPath ? `${found.folderPath}/${found.fileName}` : found.fileName) : found.id;
  }
  return id;
}

function loadSavedTabs(): { openTabIds: string[]; activeTabId: string | null } {
  try {
    const rawSettings = localStorage.getItem("notes-app-settings");
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      if (parsedSettings && parsedSettings.reopenTabs === false) {
        return { openTabIds: [], activeTabId: null };
      }
    }
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

function saveTabs(openTabIds: string[], activeTabId: string | null, notes?: Note[]) {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(openTabIds));
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, JSON.stringify(activeTabId));

    if (notes && notes.length > 0) {
      const paths = openTabIds.map((id) => getTabPath(id, notes));
      const activePath = activeTabId ? getTabPath(activeTabId, notes) : null;
      localStorage.setItem(TAB_PATHS_STORAGE_KEY, JSON.stringify(paths));
      localStorage.setItem(ACTIVE_TAB_PATH_STORAGE_KEY, JSON.stringify(activePath));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function useTabs(notesRef?: React.MutableRefObject<Note[]>) {
  const initial = loadSavedTabs();
  const [openTabIds, setOpenTabIds] = useState<string[]>(initial.openTabIds);
  const [activeTabId, setActiveTabId] = useState<string | null>(initial.activeTabId);
  const openTabIdsRef = useRef<string[]>(initial.openTabIds);
  const activeTabIdRef = useRef<string | null>(initial.activeTabId);

  const syncedSetOpenTabIds = useCallback((updater: (prev: string[]) => string[]) => {
    setOpenTabIds((prev) => {
      const next = updater(prev);
      openTabIdsRef.current = next;
      saveTabs(next, activeTabIdRef.current, notesRef?.current);
      return next;
    });
  }, [notesRef]);

  const syncedSetActiveTabId = useCallback((id: string | null) => {
    activeTabIdRef.current = id;
    setActiveTabId(id);
    saveTabs(openTabIdsRef.current, id, notesRef?.current);
  }, [notesRef]);

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
    const next = openTabIdsRef.current.filter((id) => id === "settings" || id === "luno-ai" || id === "home" || id === "trash" || id === "templates" || id.startsWith("web:") || existingIds.has(id));
    syncedSetOpenTabIds(() => next);
    if (activeTabIdRef.current && activeTabIdRef.current !== "settings" && activeTabIdRef.current !== "luno-ai" && activeTabIdRef.current !== "home" && activeTabIdRef.current !== "trash" && activeTabIdRef.current !== "templates" && !activeTabIdRef.current.startsWith("web:") && !existingIds.has(activeTabIdRef.current)) {
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

  const resetTabs = useCallback(() => {
    openTabIdsRef.current = [];
    activeTabIdRef.current = null;
    setOpenTabIds([]);
    setActiveTabId(null);
    saveTabs([], null, []);
    try {
      localStorage.removeItem(TAB_PATHS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_TAB_PATH_STORAGE_KEY);
    } catch {}
  }, []);

  /**
   * Restores previously opened tabs from localStorage on startup / workspace load.
   * Matches stored paths against the newly loaded notes list so tab IDs match the fresh in-memory note objects.
   * Respects onStartup setting ("home", "lastNote", "blank").
   */
  const restoreTabsFromSession = useCallback((
    notes: Note[],
    reopenTabs: boolean = true,
    onStartup: string = "home"
  ) => {
    if (onStartup === "blank") {
      resetTabs();
      return;
    }

    try {
      const rawPaths = localStorage.getItem(TAB_PATHS_STORAGE_KEY);
      const rawActivePath = localStorage.getItem(ACTIVE_TAB_PATH_STORAGE_KEY);
      const rawTabs = localStorage.getItem(TABS_STORAGE_KEY);
      const rawActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

      const hasStoredSession = rawPaths !== null || rawTabs !== null;

      if (reopenTabs && hasStoredSession) {
        const savedPaths: string[] = rawPaths
          ? JSON.parse(rawPaths)
          : (rawTabs ? JSON.parse(rawTabs) : []);
        const savedActivePath: string | null = rawActivePath
          ? JSON.parse(rawActivePath)
          : (rawActive ? JSON.parse(rawActive) : null);

        const resolvedTabIds: string[] = [];
        for (const item of savedPaths) {
          if (!item) continue;
          if (item === "settings" || item === "luno-ai" || item === "home" || item === "trash" || item === "templates" || item.startsWith("web:")) {
            resolvedTabIds.push(item);
            continue;
          }
          const matched = notes.find((n) => {
            const rel = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
            return rel === item || n.fileName === item || n.id === item;
          });
          if (matched && !resolvedTabIds.includes(matched.id)) {
            resolvedTabIds.push(matched.id);
          }
        }

        if (onStartup === "home") {
          // Ensure "home" is open and set as the active tab
          if (!resolvedTabIds.includes("home")) {
            resolvedTabIds.unshift("home");
          }
          openTabIdsRef.current = resolvedTabIds;
          activeTabIdRef.current = "home";
          setOpenTabIds(resolvedTabIds);
          setActiveTabId("home");
          saveTabs(resolvedTabIds, "home", notes);
          return;
        }

        // onStartup === "lastNote"
        if (resolvedTabIds.length > 0) {
          let resolvedActiveId: string | null = null;
          if (savedActivePath === "settings" || savedActivePath === "luno-ai" || savedActivePath === "home" || savedActivePath === "trash" || savedActivePath === "templates" || (savedActivePath && savedActivePath.startsWith("web:"))) {
            resolvedActiveId = savedActivePath;
          } else if (savedActivePath) {
            const matchedActive = notes.find((n) => {
              const rel = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
              return rel === savedActivePath || n.fileName === savedActivePath || n.id === savedActivePath;
            });
            if (matchedActive && resolvedTabIds.includes(matchedActive.id)) {
              resolvedActiveId = matchedActive.id;
            }
          }
          if (!resolvedActiveId || !resolvedTabIds.includes(resolvedActiveId)) {
            resolvedActiveId = resolvedTabIds[0];
          }

          openTabIdsRef.current = resolvedTabIds;
          activeTabIdRef.current = resolvedActiveId;
          setOpenTabIds(resolvedTabIds);
          setActiveTabId(resolvedActiveId);
          saveTabs(resolvedTabIds, resolvedActiveId, notes);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to restore tabs from session:", e);
    }

    if (onStartup === "home") {
      openTabIdsRef.current = ["home"];
      activeTabIdRef.current = "home";
      setOpenTabIds(["home"]);
      setActiveTabId("home");
      saveTabs(["home"], "home", notes);
      return;
    }

    if (onStartup === "lastNote" && notes.length > 0) {
      openTabIdsRef.current = [notes[0].id];
      activeTabIdRef.current = notes[0].id;
      setOpenTabIds([notes[0].id]);
      setActiveTabId(notes[0].id);
      saveTabs([notes[0].id], notes[0].id, notes);
      return;
    }

    // Default for blank
    resetTabs();
  }, [resetTabs, saveTabs]);

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    removeTabsForDeletedNotes,
    reorderTabs,
    resetTabs,
    restoreTabsFromSession,
    setActiveTabId: syncedSetActiveTabId,
  };
}
