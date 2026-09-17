import { useState, useCallback, useRef } from "react";
import type { Note } from "@/hooks/useNotes";

const TABS_STORAGE_KEY = "notes-app-open-tabs";
const ACTIVE_TAB_STORAGE_KEY = "notes-app-active-tab";
const TAB_PATHS_STORAGE_KEY = "notes-app-open-tab-paths";
const ACTIVE_TAB_PATH_STORAGE_KEY = "notes-app-active-tab-path";

export interface WorkspaceSessionData {
  openTabs: string[];
  activeTab: string | null;
  updatedAt: number;
}

export async function saveWorkspaceSession(
  rootDirHandle: FileSystemDirectoryHandle | null,
  openTabPaths: string[],
  activeTabPath: string | null
) {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  const sessionData: WorkspaceSessionData = {
    openTabs: openTabPaths,
    activeTab: activeTabPath,
    updatedAt: Date.now(),
  };

  if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/session.json`;
        await electronAPI.writeFileContent({ fullPath, content: JSON.stringify(sessionData, null, 2) });
        return;
      }
    } catch (err) {
      console.warn("Failed to write .luno/session.json in Electron", err);
    }
  }

  if (!rootDirHandle) return;

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: true });
    const fileHandle = await metaDir.getFileHandle("session.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(sessionData, null, 2));
    await writable.close();
  } catch (err) {
    console.warn("Failed to write .luno/session.json in Web FS", err);
  }
}

export async function loadWorkspaceSession(
  rootDirHandle: FileSystemDirectoryHandle | null
): Promise<WorkspaceSessionData | null> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/session.json`;
        const content = await electronAPI.readFileContent(fullPath);
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed?.openTabs)) {
            return {
              openTabs: parsed.openTabs,
              activeTab: typeof parsed.activeTab === "string" ? parsed.activeTab : null,
              updatedAt: parsed.updatedAt || Date.now(),
            };
          }
        }
      }
    } catch (err) {
      console.warn("Failed to read .luno/session.json in Electron", err);
    }
  }

  if (!rootDirHandle) return null;

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: false });
    const fileHandle = await metaDir.getFileHandle("session.json", { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.openTabs)) {
      return {
        openTabs: parsed.openTabs,
        activeTab: typeof parsed.activeTab === "string" ? parsed.activeTab : null,
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function isSystemOrWebTab(id: string): boolean {
  return (
    id === "settings" || id.startsWith("settings:") ||
    id === "luno-ai" || id.startsWith("luno-ai:") ||
    id === "home" || id.startsWith("home:") ||
    id === "help" || id.startsWith("help:") ||
    id === "trash" || id.startsWith("trash:") ||
    id === "templates" || id.startsWith("templates:") ||
    id === "relations" || id.startsWith("relations:") ||
    id === "favorites" || id.startsWith("favorites:") ||
    id === "tags" || id.startsWith("tags:") ||
    id.startsWith("web:")
  );
}

export function isTabAllowedInCompactLayout(id: string): boolean {
  if (id === "home" || id.startsWith("home:")) return false;
  if (id === "favorites" || id.startsWith("favorites:")) return false;
  if (id === "tags" || id.startsWith("tags:")) return false;
  if (id === "trash" || id.startsWith("trash:")) return false;
  if (id === "luno-ai" || id.startsWith("luno-ai:")) return false;
  return true;
}

function getTabPath(id: string, notes?: Note[]): string {
  if (isSystemOrWebTab(id)) return id;
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
    let isCompact = false;
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      if (parsedSettings && parsedSettings.reopenTabs === false) {
        return { openTabIds: [], activeTabId: null };
      }
      if (parsedSettings && parsedSettings.appLayout === "compact") {
        isCompact = true;
      }
    }
    const rawTabs = localStorage.getItem(TABS_STORAGE_KEY);
    const rawActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    let openTabIds = rawTabs ? JSON.parse(rawTabs) : [];
    let activeTabId = rawActive ? JSON.parse(rawActive) : null;
    if (!Array.isArray(openTabIds)) openTabIds = [];
    if (typeof activeTabId !== "string") activeTabId = null;

    if (isCompact) {
      openTabIds = openTabIds.filter((id: string) => isTabAllowedInCompactLayout(id));
      if (activeTabId && !isTabAllowedInCompactLayout(activeTabId)) {
        activeTabId = openTabIds[0] ?? null;
      }
    }

    return {
      openTabIds,
      activeTabId,
    };
  } catch {
    return { openTabIds: [], activeTabId: null };
  }
}

let debouncedSaveSessionTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSessionSave: { rootDirHandle: FileSystemDirectoryHandle | null; paths: string[]; activePath: string | null } | null = null;

export function flushWorkspaceSession() {
  if (debouncedSaveSessionTimer) {
    clearTimeout(debouncedSaveSessionTimer);
    debouncedSaveSessionTimer = null;
  }
  if (pendingSessionSave) {
    const { rootDirHandle, paths, activePath } = pendingSessionSave;
    pendingSessionSave = null;
    void saveWorkspaceSession(rootDirHandle, paths, activePath);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushWorkspaceSession);
}

function scheduleSaveWorkspaceSession(
  rootDirHandle: FileSystemDirectoryHandle | null,
  paths: string[],
  activePath: string | null
) {
  pendingSessionSave = { rootDirHandle, paths, activePath };
  if (debouncedSaveSessionTimer) {
    clearTimeout(debouncedSaveSessionTimer);
  }
  debouncedSaveSessionTimer = setTimeout(() => {
    debouncedSaveSessionTimer = null;
    if (pendingSessionSave) {
      const { rootDirHandle: handle, paths: p, activePath: a } = pendingSessionSave;
      pendingSessionSave = null;
      void saveWorkspaceSession(handle, p, a);
    }
  }, 400);
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
      scheduleSaveWorkspaceSession(null, paths, activePath);
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
      if (next.length === prev.length && next.every((val, i) => val === prev[i])) {
        return prev;
      }
      openTabIdsRef.current = next;
      saveTabs(next, activeTabIdRef.current, notesRef?.current);
      return next;
    });
  }, [notesRef]);

  const syncedSetActiveTabId = useCallback((id: string | null) => {
    if (activeTabIdRef.current === id) return;
    activeTabIdRef.current = id;
    setActiveTabId(id);
    saveTabs(openTabIdsRef.current, id, notesRef?.current);
  }, [notesRef]);

  const openTab = useCallback((id: string) => {
    if (!openTabIdsRef.current.includes(id)) {
      syncedSetOpenTabIds((prev) => [...prev, id]);
    }
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

  const closeOtherTabs = useCallback((keepId: string) => {
    const currentTabs = openTabIdsRef.current;
    if (!currentTabs.includes(keepId)) return;
    const next = [keepId];
    syncedSetOpenTabIds(() => next);
    syncedSetActiveTabId(keepId);
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const closeAllTabs = useCallback(() => {
    syncedSetOpenTabIds(() => []);
    syncedSetActiveTabId(null);
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const closeTabsToRight = useCallback((targetId: string) => {
    const currentTabs = openTabIdsRef.current;
    const idx = currentTabs.indexOf(targetId);
    if (idx === -1) return;
    const next = currentTabs.slice(0, idx + 1);
    syncedSetOpenTabIds(() => next);
    if (activeTabIdRef.current && !next.includes(activeTabIdRef.current)) {
      syncedSetActiveTabId(targetId);
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const removeTabsForDeletedNotes = useCallback((existingIds: Set<string>) => {
    const currentTabs = openTabIdsRef.current;
    const next = currentTabs.filter((id) => isSystemOrWebTab(id) || existingIds.has(id));
    if (next.length !== currentTabs.length) {
      syncedSetOpenTabIds(() => next);
    }
    if (activeTabIdRef.current && !isSystemOrWebTab(activeTabIdRef.current) && !existingIds.has(activeTabIdRef.current)) {
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

  const sanitizeTabsForLayout = useCallback((appLayout?: string) => {
    if (appLayout !== "compact") return;
    const currentTabs = openTabIdsRef.current;
    const next = currentTabs.filter((id) => isTabAllowedInCompactLayout(id));
    if (next.length !== currentTabs.length) {
      syncedSetOpenTabIds(() => next);
    }
    if (activeTabIdRef.current && !isTabAllowedInCompactLayout(activeTabIdRef.current)) {
      syncedSetActiveTabId(next[0] ?? null);
    }
  }, [syncedSetOpenTabIds, syncedSetActiveTabId]);

  const resetTabs = useCallback((clearStorage: boolean = false) => {
    openTabIdsRef.current = [];
    activeTabIdRef.current = null;
    setOpenTabIds([]);
    setActiveTabId(null);
    if (clearStorage) {
      saveTabs([], null, []);
      try {
        localStorage.removeItem(TAB_PATHS_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_TAB_PATH_STORAGE_KEY);
      } catch {}
    }
  }, []);

  /**
   * Restores previously opened tabs from workspace .luno/session.json or localStorage on startup / workspace load.
   * Matches stored paths against the newly loaded notes list so tab IDs match the fresh in-memory note objects.
   * Respects onStartup setting ("home", "lastNote", "blank").
   */
  const restoreTabsFromSession = useCallback(async (
    notes: Note[],
    reopenTabs: boolean = true,
    onStartup: string = "home",
    rootDirHandle?: FileSystemDirectoryHandle | null
  ) => {
    if (onStartup === "blank") {
      resetTabs(true);
      return;
    }

    try {
      // 1. Try reading from workspace .luno/session.json
      const fileSession = await loadWorkspaceSession(rootDirHandle ?? null);

      let savedPaths: string[] = [];
      let savedActivePath: string | null = null;

      if (fileSession && Array.isArray(fileSession.openTabs) && fileSession.openTabs.length > 0) {
        savedPaths = fileSession.openTabs;
        savedActivePath = fileSession.activeTab;
      } else {
        // 2. Fallback to localStorage
        const rawPaths = localStorage.getItem(TAB_PATHS_STORAGE_KEY);
        const rawActivePath = localStorage.getItem(ACTIVE_TAB_PATH_STORAGE_KEY);
        const rawTabs = localStorage.getItem(TABS_STORAGE_KEY);
        const rawActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

        savedPaths = rawPaths
          ? JSON.parse(rawPaths)
          : (rawTabs ? JSON.parse(rawTabs) : []);
        savedActivePath = rawActivePath
          ? JSON.parse(rawActivePath)
          : (rawActive ? JSON.parse(rawActive) : null);
      }

      if (reopenTabs && savedPaths.length > 0) {
        let resolvedTabIds: string[] = [];
        for (const item of savedPaths) {
          if (!item) continue;
          if (isSystemOrWebTab(item)) {
            if (!resolvedTabIds.includes(item)) {
              resolvedTabIds.push(item);
            }
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

        const rawSettings = typeof window !== "undefined" ? localStorage.getItem("notes-app-settings") : null;
        const isCompact = rawSettings ? JSON.parse(rawSettings)?.appLayout === "compact" : false;
        if (isCompact) {
          resolvedTabIds = resolvedTabIds.filter((id) => isTabAllowedInCompactLayout(id));
        }

        if (resolvedTabIds.length > 0) {
          if (onStartup === "home" && !isCompact) {
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

          // onStartup === "lastNote" or isCompact
          let resolvedActiveId: string | null = null;
          if (savedActivePath && isSystemOrWebTab(savedActivePath)) {
            if (!isCompact || isTabAllowedInCompactLayout(savedActivePath)) {
              resolvedActiveId = savedActivePath;
            }
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
            resolvedActiveId = resolvedTabIds.find((id) => !isCompact ? id !== "home" : true) || resolvedTabIds[0];
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

    const rawSettings = typeof window !== "undefined" ? localStorage.getItem("notes-app-settings") : null;
    const isCompact = rawSettings ? JSON.parse(rawSettings)?.appLayout === "compact" : false;

    if (onStartup === "home" && !isCompact) {
      openTabIdsRef.current = ["home"];
      activeTabIdRef.current = "home";
      setOpenTabIds(["home"]);
      setActiveTabId("home");
      saveTabs(["home"], "home", notes);
      return;
    }

    if (notes.length > 0) {
      openTabIdsRef.current = [notes[0].id];
      activeTabIdRef.current = notes[0].id;
      setOpenTabIds([notes[0].id]);
      setActiveTabId(notes[0].id);
      saveTabs([notes[0].id], notes[0].id, notes);
      return;
    }

    // Default for blank
    resetTabs(true);
  }, [resetTabs, saveTabs]);

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeTabsToRight,
    removeTabsForDeletedNotes,
    reorderTabs,
    resetTabs,
    sanitizeTabsForLayout,
    restoreTabsFromSession,
    setActiveTabId: syncedSetActiveTabId,
  };
}
