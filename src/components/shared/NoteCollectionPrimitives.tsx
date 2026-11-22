import { useEffect, useState } from "react";
import type { Note } from "@/hooks/useNotes";

export type NoteCollectionSortBy =
  | "name-asc"
  | "name-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";

export type NoteCollectionViewMode = "list" | "card";
export type NoteCollectionFilterType = "all" | "md" | "txt" | "html" | "image";

const VALID_SORT_VALUES: readonly NoteCollectionSortBy[] = [
  "name-asc",
  "name-desc",
  "modified-desc",
  "modified-asc",
  "created-desc",
  "created-asc",
];

const COLLECTION_IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i;

export function isCollectionImageNote(note: Pick<Note, "fileName" | "fileType">): boolean {
  const name = (note.fileName || "").toLowerCase();
  return note.fileType === "image" || COLLECTION_IMAGE_EXT_RE.test(name);
}

export function isCollectionMarkdownNote(note: Pick<Note, "fileName" | "contentFormat">): boolean {
  const name = (note.fileName || "").toLowerCase();
  return name.endsWith(".md") || name.endsWith(".markdown") || note.contentFormat === "markdown";
}

export function isCollectionHtmlNote(note: Pick<Note, "fileName" | "contentFormat">): boolean {
  const name = (note.fileName || "").toLowerCase();
  return name.endsWith(".html") || name.endsWith(".htm") || note.contentFormat === "html";
}

export function isCollectionTextNote(note: Pick<Note, "fileName" | "contentFormat">): boolean {
  const name = (note.fileName || "").toLowerCase();
  return name.endsWith(".txt") || note.contentFormat === "plain";
}

/**
 * Consistent file-type filter matching across FavoritesTabView and TagsTabView
 * (fixes prior .bmp/.avif mismatch between counts and filtered results).
 */
export function matchesNoteFormatFilter(note: Note, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "md") return isCollectionMarkdownNote(note);
  if (filter === "html") return isCollectionHtmlNote(note);
  if (filter === "txt") return isCollectionTextNote(note);
  if (filter === "image") return isCollectionImageNote(note);
  return true;
}

export function getNoteFormatBadge(note: Pick<Note, "fileName" | "fileType" | "contentFormat">): "IMG" | "HTML" | "TXT" | "MD" {
  if (isCollectionImageNote(note)) return "IMG";
  if (isCollectionHtmlNote(note)) return "HTML";
  if (isCollectionTextNote(note)) return "TXT";
  return "MD";
}

export function sortNoteCollection(notes: Note[], sortBy: NoteCollectionSortBy): Note[] {
  return [...notes].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": {
        const nameA = a.fileName || a.title || "";
        const nameB = b.fileName || b.title || "";
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
      }
      case "name-desc": {
        const nameA = a.fileName || a.title || "";
        const nameB = b.fileName || b.title || "";
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: "base" });
      }
      case "modified-desc":
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      case "modified-asc":
        return (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0);
      case "created-desc":
        return (b.createdAt || 0) - (a.createdAt || 0);
      case "created-asc":
        return (a.createdAt || 0) - (b.createdAt || 0);
      default:
        return 0;
    }
  });
}

export function usePersistedCollectionSort(storageKey: string) {
  const [sortBy, setSortBy] = useState<NoteCollectionSortBy>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(storageKey) as NoteCollectionSortBy;
        if (saved && VALID_SORT_VALUES.includes(saved)) return saved;
      }
    } catch {
      /* ignore storage errors */
    }
    return "name-asc";
  });

  const handleSortChange = (next: NoteCollectionSortBy) => {
    setSortBy(next);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(storageKey, next);
      }
    } catch {
      /* ignore storage errors */
    }
  };

  return [sortBy, handleSortChange] as const;
}

export function usePersistedCollectionViewMode(storageKey: string) {
  const [viewMode, setViewMode] = useState<NoteCollectionViewMode>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(storageKey) as NoteCollectionViewMode;
        if (saved === "list" || saved === "card") return saved;
      }
    } catch {
      /* ignore storage errors */
    }
    return "list";
  });

  const handleViewModeChange = (next: NoteCollectionViewMode) => {
    setViewMode(next);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(storageKey, next);
      }
    } catch {
      /* ignore storage errors */
    }
  };

  return [viewMode, handleViewModeChange] as const;
}

/**
 * Shared Ctrl+F / Ctrl+K focus shortcut for collection views (Favorites, Tags, Trash, Templates).
 */
export function useCollectionSearchShortcut(inputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "f" ||
          e.key.toLowerCase() === "k" ||
          e.code === "KeyF" ||
          e.code === "KeyK" ||
          e.key === "า" ||
          e.key === "ด")
      ) {
        const target = e.target as HTMLElement | null;
        if (
          target !== inputRef.current &&
          (target?.isContentEditable ||
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.closest?.('[role="dialog"], [role="alertdialog"], .ProseMirror, .cm-editor'))
        ) {
          return;
        }
        if (inputRef.current && inputRef.current.offsetParent !== null) {
          e.preventDefault();
          inputRef.current.focus();
          inputRef.current.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);
}
