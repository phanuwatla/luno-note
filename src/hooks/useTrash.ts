import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Note } from "@/hooks/useNotes";

export interface TrashedNote extends Note {
  deletedAt: number;
  originalFolderPath?: string;
  originalFileName?: string;
  size?: number;
}

const TRASH_STORAGE_KEY = "notes-app-trash";

export function calculateNoteSize(note: Partial<Note>): number {
  let bytes = 0;
  if (note.title) bytes += new Blob([note.title]).size;
  if (note.content) bytes += new Blob([note.content]).size;
  if (note.fileName) bytes += new Blob([note.fileName]).size;
  if (note.folderPath) bytes += new Blob([note.folderPath]).size;
  if (note.tags && note.tags.length > 0) {
    bytes += new Blob([note.tags.join("")]).size;
  }
  // Minimum baseline metadata size
  return Math.max(bytes, 128);
}

export function formatByteSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadTrash(): TrashedNote[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(TRASH_STORAGE_KEY);
    if (!raw) return [];
    const items: TrashedNote[] = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      ...item,
      size: item.size || calculateNoteSize(item),
    }));
  } catch {
    return [];
  }
}

function saveTrash(trash: TrashedNote[]) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));
    }
  } catch (err) {
    console.warn("Failed to save trash to localStorage:", err);
  }
}

export function useTrash() {
  const [trashedNotes, setTrashedNotes] = useState<TrashedNote[]>(loadTrash);
  const trashRef = useRef<TrashedNote[]>(trashedNotes);

  useEffect(() => {
    trashRef.current = trashedNotes;
  }, [trashedNotes]);

  // Sync when storage event occurs (e.g. multi-tab or workspace updates)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TRASH_STORAGE_KEY) {
        setTrashedNotes(loadTrash());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const moveToTrash = useCallback((items: Note | Note[]) => {
    const noteArray = Array.isArray(items) ? items : [items];
    if (noteArray.length === 0) return;

    const now = Date.now();
    const newTrashItems: TrashedNote[] = noteArray.map((note) => ({
      ...note,
      deletedAt: now,
      originalFolderPath: note.folderPath,
      originalFileName: note.fileName,
      size: calculateNoteSize(note),
    }));

    setTrashedNotes((prev) => {
      // Remove any existing trash item with the same ID before appending
      const existingIds = new Set(newTrashItems.map((n) => n.id));
      const filtered = prev.filter((n) => !existingIds.has(n.id));
      const updated = [...newTrashItems, ...filtered];
      trashRef.current = updated;
      saveTrash(updated);
      return updated;
    });
  }, []);

  const restoreFromTrash = useCallback((ids: string[]): TrashedNote[] => {
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    const freshTrash = loadTrash();
    const sourceTrash = freshTrash.length >= trashRef.current.length ? freshTrash : trashRef.current;
    const restored = sourceTrash.filter((n) => idSet.has(n.id));

    const updated = sourceTrash.filter((n) => !idSet.has(n.id));
    trashRef.current = updated;
    saveTrash(updated);
    setTrashedNotes(updated);

    return restored;
  }, []);

  const deletePermanently = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const freshTrash = loadTrash();
    const sourceTrash = freshTrash.length >= trashRef.current.length ? freshTrash : trashRef.current;
    const updated = sourceTrash.filter((n) => !idSet.has(n.id));
    trashRef.current = updated;
    saveTrash(updated);
    setTrashedNotes(updated);
  }, []);

  const emptyTrash = useCallback(() => {
    saveTrash([]);
    trashRef.current = [];
    setTrashedNotes([]);
  }, []);

  const autoCleanExpired = useCallback((retentionDays: number) => {
    if (!retentionDays || retentionDays <= 0) return;
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    setTrashedNotes((prev) => {
      const updated = prev.filter((n) => now - (n.deletedAt || now) < maxAgeMs);
      if (updated.length !== prev.length) {
        trashRef.current = updated;
        saveTrash(updated);
      }
      return updated;
    });
  }, []);

  const metrics = useMemo(() => {
    const totalBytes = trashedNotes.reduce((acc, n) => acc + (n.size || 0), 0);
    return {
      count: trashedNotes.length,
      totalBytes,
      formattedSize: formatByteSize(totalBytes),
    };
  }, [trashedNotes]);

  return {
    trashedNotes,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    emptyTrash,
    autoCleanExpired,
    metrics,
  };
}
