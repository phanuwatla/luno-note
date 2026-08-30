/**
 * Persistent Version History Storage
 * Manages snapshots and historical versions of notes with auto-trimming, throttling, and deduplication.
 */

import type { Note } from "@/hooks/useNotes";
import { countWords, countCharacters } from "./wordCount";

export interface NoteVersionSnapshot {
  id: string;
  noteId: string;
  timestamp: number;
  title: string;
  content: string;
  contentFormat?: "plain" | "markdown" | "html";
  wordCount: number;
  charCount: number;
  trigger: "auto" | "manual" | "pre-restore";
  label?: string;
}

const MAX_VERSIONS_PER_NOTE = 50;
const STORAGE_PREFIX = "luno_vhist_";

/** Minimum interval between automatic version snapshots (5 minutes) */
export const AUTO_SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;

/** Minimum characters changed to qualify for an auto snapshot */
export const AUTO_SNAPSHOT_MIN_CHAR_DIFF = 50;

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getStorageKey(noteId: string): string {
  return `${STORAGE_PREFIX}${noteId}`;
}

/**
 * Loads all version snapshots for a given note
 */
export function getNoteVersionHistory(noteId: string): NoteVersionSnapshot[] {
  if (!noteId) return [];
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(getStorageKey(noteId));
    if (!raw) return [];
    const list: NoteVersionSnapshot[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn("Failed to load version history for note:", noteId, err);
    return [];
  }
}

/**
 * Saves a new version snapshot for a note with smart deduplication and interval throttling.
 */
export function saveVersionSnapshot(
  note: Note,
  trigger: "auto" | "manual" | "pre-restore" = "auto",
  label?: string,
  force: boolean = false,
  explicitWordCount?: number,
  explicitCharCount?: number
): NoteVersionSnapshot | null {
  if (!note || !note.id) return null;

  const content = note.content || "";
  const existingHistory = getNoteVersionHistory(note.id);

  // Throttling and Deduplication for automatic snapshots
  if (existingHistory.length > 0 && !force) {
    const latest = existingHistory[0];

    // If identical content, never create a new auto snapshot
    if (latest.content === content && trigger === "auto" && !label) {
      return null;
    }

    // For auto snapshots, enforce minimum time interval (5 minutes)
    if (trigger === "auto" && !label) {
      const timeSinceLastSnapshot = Date.now() - latest.timestamp;
      if (timeSinceLastSnapshot < AUTO_SNAPSHOT_MIN_INTERVAL_MS) {
        return null;
      }

      // If fewer than 50 characters changed and under 10 minutes, skip
      const charDiff = Math.abs(content.length - latest.content.length);
      if (charDiff < AUTO_SNAPSHOT_MIN_CHAR_DIFF && timeSinceLastSnapshot < AUTO_SNAPSHOT_MIN_INTERVAL_MS * 2) {
        return null;
      }
    }
  }

  const wordCount = explicitWordCount !== undefined ? explicitWordCount : countWords(content);
  const charCount = explicitCharCount !== undefined ? explicitCharCount : countCharacters(content);

  const snapshot: NoteVersionSnapshot = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    noteId: note.id,
    timestamp: Date.now(),
    title: note.title || note.fileName || "Untitled",
    content,
    contentFormat: note.contentFormat || "markdown",
    wordCount,
    charCount,
    trigger,
    label: label?.trim() || undefined,
  };

  // Add new snapshot at beginning and trim to max limit
  const updated = [snapshot, ...existingHistory].slice(0, MAX_VERSIONS_PER_NOTE);

  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(getStorageKey(note.id), JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("Failed to save version history to localStorage:", err);
  }

  return snapshot;
}

/**
 * Deletes a single version snapshot
 */
export function deleteVersionSnapshot(noteId: string, versionId: string): void {
  if (!noteId || !versionId) return;
  const history = getNoteVersionHistory(noteId);
  const updated = history.filter((v) => v.id !== versionId);

  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(getStorageKey(noteId), JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("Failed to delete version snapshot from localStorage:", err);
  }
}

/**
 * Clears all version history for a note
 */
export function clearNoteHistory(noteId: string): void {
  if (!noteId) return;
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(getStorageKey(noteId));
    }
  } catch (err) {
    console.warn("Failed to clear version history from localStorage:", err);
  }
}

/**
 * Gets a specific snapshot by ID
 */
export function getVersionSnapshot(noteId: string, versionId: string): NoteVersionSnapshot | null {
  if (!noteId || !versionId) return null;
  const history = getNoteVersionHistory(noteId);
  return history.find((v) => v.id === versionId) || null;
}
