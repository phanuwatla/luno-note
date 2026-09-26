/**
 * Persistent Version History Storage
 * Manages snapshots and historical versions of notes with auto-trimming, throttling, deduplication,
 * frontmatter/property preservation, and cross-session persistence across program restarts.
 */

import type { Note } from "@/hooks/useNotes";
import { countWords, countCharacters } from "./wordCount";
import {
  parseFrontmatterAndTags,
  updateFrontmatterTags,
  updateFrontmatterIcon,
  updateFrontmatterFavorite,
  isMarkdownNote,
} from "./frontmatter";
import { isEncryptedNote } from "./noteCrypto";
import { formatDate } from "./dateTimeFormatter";

export interface NoteVersionSnapshot {
  id: string;
  noteId: string;
  relPath?: string;
  timestamp: number;
  title: string;
  content: string;
  contentFormat?: "plain" | "markdown" | "html" | "css";
  wordCount: number;
  charCount: number;
  trigger: "auto" | "manual" | "pre-restore";
  label?: string;
  tags?: string[];
  icon?: string;
  iconColor?: string;
  isFavorite?: boolean;
  frontmatterData?: Record<string, any>;
}

const MAX_VERSIONS_PER_NOTE = 50;
const STORAGE_PREFIX = "luno_vhist_";
const PATH_PREFIX = "luno_vhist_path_";

/** Minimum interval between automatic version snapshots (5 minutes) */
export const AUTO_SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;

/** Minimum characters changed to qualify for an auto snapshot */
export const AUTO_SNAPSHOT_MIN_CHAR_DIFF = 50;

/**
 * Computes canonical relative file path for a note within a workspace
 */
export function getNoteRelativePath(
  note: Pick<Note, "fileName" | "folderPath"> | null | undefined
): string | null {
  if (!note || !note.fileName) return null;
  return note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
}

/**
 * Resolves the content format of a note accurately based on contentFormat or fileName extension.
 */
export function resolveNoteContentFormat(
  note: { contentFormat?: string; fileName?: string } | null | undefined
): "plain" | "markdown" | "html" | "css" {
  if (!note) return "markdown";
  if (note.contentFormat === "css" || note.contentFormat === "html" || note.contentFormat === "plain" || note.contentFormat === "markdown") {
    return note.contentFormat;
  }
  const fn = (note.fileName || "").toLowerCase();
  if (fn.endsWith(".css")) return "css";
  if (fn.endsWith(".html") || fn.endsWith(".htm")) return "html";
  if (fn.endsWith(".txt")) return "plain";
  return "markdown";
}

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

export function getStorageKey(noteId: string): string {
  return `${STORAGE_PREFIX}${noteId}`;
}

export function getPathStorageKey(relPath: string): string {
  return `${PATH_PREFIX}${encodeURIComponent(relPath)}`;
}

/**
 * Loads all version snapshots for a given note (by note object, note ID, and/or relative file path).
 * Automatically links and merges records between ephemeral noteId and persistent relative file path.
 */
export function getNoteVersionHistory(
  noteOrId: string | Note,
  explicitRelPath?: string | null
): NoteVersionSnapshot[] {
  if (!noteOrId) return [];

  let noteId = "";
  let relPath: string | null = explicitRelPath ?? null;

  if (typeof noteOrId === "object") {
    noteId = noteOrId.id || "";
    if (!relPath) {
      relPath = getNoteRelativePath(noteOrId);
    }
  } else {
    noteId = noteOrId;
  }

  const storage = getStorage();
  if (!storage) return [];

  const snapshotsMap = new Map<string, NoteVersionSnapshot>();

  // 1. Read from noteId key
  if (noteId) {
    try {
      const raw = storage.getItem(getStorageKey(noteId));
      if (raw) {
        const list: NoteVersionSnapshot[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const s of list) {
            if (s && s.id) {
              snapshotsMap.set(s.id, s);
              if (!relPath && s.relPath) {
                relPath = s.relPath;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load version history from noteId:", noteId, err);
    }
  }

  // 2. Read from persistent relPath key (retains history across program restarts!)
  if (relPath) {
    try {
      const raw = storage.getItem(getPathStorageKey(relPath));
      if (raw) {
        const list: NoteVersionSnapshot[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const s of list) {
            if (s && s.id) {
              const existing = snapshotsMap.get(s.id);
              if (!existing) {
                snapshotsMap.set(s.id, s);
              } else {
                // Merge in case one has more metadata
                snapshotsMap.set(s.id, { ...existing, ...s });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load version history from relPath:", relPath, err);
    }
  }

  const result = Array.from(snapshotsMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  // Sync back to both keys if one was empty or out-of-sync
  if (result.length > 0) {
    const jsonStr = JSON.stringify(result);
    try {
      if (noteId && storage.getItem(getStorageKey(noteId)) !== jsonStr) {
        storage.setItem(getStorageKey(noteId), jsonStr);
      }
      if (relPath && storage.getItem(getPathStorageKey(relPath)) !== jsonStr) {
        storage.setItem(getPathStorageKey(relPath), jsonStr);
      }
    } catch {
      /* ignore quota errors */
    }
  }

  return result;
}

/**
 * Saves a new version snapshot for a note with smart deduplication, interval throttling,
 * frontmatter/property preservation, and persistent storage.
 */
export function saveVersionSnapshot(
  note: Note,
  trigger: "auto" | "manual" | "pre-restore" = "auto",
  label?: string,
  force: boolean = false,
  explicitWordCount?: number,
  explicitCharCount?: number
): NoteVersionSnapshot | null {
  if (!note || !note.id || note.isLocked || isEncryptedNote(note.content)) return null;

  const relPath = getNoteRelativePath(note) || undefined;
  let content = note.content || "";

  // 1. Ensure frontmatter properties are preserved in Markdown content
  let parsedFm: ReturnType<typeof parseFrontmatterAndTags> | undefined;
  if (isMarkdownNote(note)) {
    parsedFm = parseFrontmatterAndTags(content);
    let updatedContent = content;

    // Ensure tags are in frontmatter if tags exist on note
    if (note.tags && note.tags.length > 0) {
      const currentFmTags = parsedFm.frontmatterTags || [];
      const hasAllTags = note.tags.every((t) => currentFmTags.includes(t));
      if (!hasAllTags || !parsedFm.hasFrontmatter) {
        updatedContent = updateFrontmatterTags(updatedContent, note.tags);
        parsedFm = parseFrontmatterAndTags(updatedContent);
      }
    }

    // Ensure icon / iconColor are in frontmatter if present
    if (note.icon !== undefined || note.iconColor !== undefined) {
      updatedContent = updateFrontmatterIcon(updatedContent, note.icon, note.iconColor);
      parsedFm = parseFrontmatterAndTags(updatedContent);
    }

    // Ensure favorite is in frontmatter if present
    if (note.isFavorite !== undefined) {
      updatedContent = updateFrontmatterFavorite(updatedContent, note.isFavorite);
      parsedFm = parseFrontmatterAndTags(updatedContent);
    }

    content = updatedContent;
  }

  const existingHistory = getNoteVersionHistory(note, relPath);

  // Throttling and Deduplication
  if (existingHistory.length > 0 && !force) {
    const latest = existingHistory[0];

    // For pre-restore, never create duplicate snapshot if identical content
    if (trigger === "pre-restore" && latest.content === content) {
      return null;
    }

    // If identical content, never create a new auto snapshot
    if (latest.content === content && trigger === "auto" && !label) {
      return null;
    }

    // For auto snapshots, enforce minimum time interval and change thresholds
    if (trigger === "auto" && !label) {
      const timeSinceLastSnapshot = Date.now() - latest.timestamp;

      // Minimum cooldown between automatic snapshots: 60 seconds (1 minute)
      if (timeSinceLastSnapshot < 60 * 1000) {
        return null;
      }

      // If under AUTO_SNAPSHOT_MIN_INTERVAL_MS (5 minutes), require meaningful character change (>= 50 chars)
      const charDiff = Math.abs(content.length - latest.content.length);
      if (timeSinceLastSnapshot < AUTO_SNAPSHOT_MIN_INTERVAL_MS && charDiff < AUTO_SNAPSHOT_MIN_CHAR_DIFF) {
        return null;
      }
    }
  }

  const wordCount = explicitWordCount !== undefined ? explicitWordCount : countWords(content);
  const charCount = explicitCharCount !== undefined ? explicitCharCount : countCharacters(content);

  const snapshotTags = (note.tags && note.tags.length > 0)
    ? note.tags
    : (parsedFm ? parsedFm.allTags : []);

  const snapshot: NoteVersionSnapshot = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    noteId: note.id,
    relPath,
    timestamp: Date.now(),
    title: note.title || note.fileName || "Untitled",
    content,
    contentFormat: resolveNoteContentFormat(note),
    wordCount,
    charCount,
    trigger,
    label: label?.trim() || undefined,
    tags: snapshotTags.length > 0 ? snapshotTags : undefined,
    icon: note.icon || (typeof parsedFm?.frontmatterData?.icon === "string" ? parsedFm.frontmatterData.icon : undefined),
    iconColor: note.iconColor || (typeof (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color) === "string"
      ? (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color)
      : undefined),
    isFavorite: note.isFavorite ?? (typeof parsedFm?.frontmatterData?.favorite === "boolean"
      ? parsedFm.frontmatterData.favorite
      : (typeof parsedFm?.frontmatterData?.isFavorite === "boolean" ? parsedFm.frontmatterData.isFavorite : undefined)),
    frontmatterData: parsedFm?.hasFrontmatter ? parsedFm.frontmatterData : undefined,
  };

  // Add new snapshot at beginning and trim to max limit
  const updated = [snapshot, ...existingHistory].slice(0, MAX_VERSIONS_PER_NOTE);

  try {
    const storage = getStorage();
    if (storage) {
      const jsonStr = JSON.stringify(updated);
      storage.setItem(getStorageKey(note.id), jsonStr);
      if (relPath) {
        storage.setItem(getPathStorageKey(relPath), jsonStr);
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("luno:version-snapshot-saved", {
          detail: { noteId: note.id, versionId: snapshot.id },
        })
      );
    }
  } catch (err) {
    console.warn("Failed to save version history to localStorage:", err);
  }

  // Also asynchronously persist to workspace folder if available
  if (relPath) {
    scheduleSaveWorkspaceHistory(relPath, updated);
  }

  return snapshot;
}

/**
 * Deletes a single version snapshot
 */
export function deleteVersionSnapshot(
  noteOrId: string | Note,
  versionId: string,
  explicitRelPath?: string | null
): void {
  if (!noteOrId || !versionId) return;
  const history = getNoteVersionHistory(noteOrId, explicitRelPath);
  const updated = history.filter((v) => v.id !== versionId);

  const noteId = typeof noteOrId === "object" ? noteOrId.id : noteOrId;
  let relPath = explicitRelPath || (typeof noteOrId === "object" ? getNoteRelativePath(noteOrId) : null);
  if (!relPath && history[0]?.relPath) {
    relPath = history[0].relPath;
  }

  try {
    const storage = getStorage();
    if (storage) {
      const jsonStr = JSON.stringify(updated);
      if (noteId) storage.setItem(getStorageKey(noteId), jsonStr);
      if (relPath) storage.setItem(getPathStorageKey(relPath), jsonStr);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("luno:version-snapshot-saved", {
          detail: { noteId, versionId },
        })
      );
    }
  } catch (err) {
    console.warn("Failed to delete version snapshot from localStorage:", err);
  }

  if (relPath) {
    scheduleSaveWorkspaceHistory(relPath, updated);
  }
}

/**
 * Clears all version history for a note
 */
export function clearNoteHistory(
  noteOrId: string | Note,
  explicitRelPath?: string | null
): void {
  if (!noteOrId) return;
  const history = getNoteVersionHistory(noteOrId, explicitRelPath);
  const noteId = typeof noteOrId === "object" ? noteOrId.id : noteOrId;
  let relPath = explicitRelPath || (typeof noteOrId === "object" ? getNoteRelativePath(noteOrId) : null);
  if (!relPath && history[0]?.relPath) {
    relPath = history[0].relPath;
  }

  try {
    const storage = getStorage();
    if (storage) {
      if (noteId) storage.removeItem(getStorageKey(noteId));
      if (relPath) storage.removeItem(getPathStorageKey(relPath));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("luno:version-snapshot-saved", {
          detail: { noteId },
        })
      );
    }
  } catch (err) {
    console.warn("Failed to clear version history from localStorage:", err);
  }

  if (relPath) {
    scheduleSaveWorkspaceHistory(relPath, []);
  }
}

export const clearNoteVersionHistory = clearNoteHistory;

/**
 * Gets a specific snapshot by ID
 */
export function getVersionSnapshot(
  noteOrId: string | Note,
  versionId: string,
  explicitRelPath?: string | null
): NoteVersionSnapshot | null {
  if (!noteOrId || !versionId) return null;
  const history = getNoteVersionHistory(noteOrId, explicitRelPath);
  return history.find((v) => v.id === versionId) || null;
}

// ---------------------------------------------------------------------------
// Workspace Disk Persistence (.luno/history/<file>.json)
// ---------------------------------------------------------------------------

const debouncedHistoryTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleSaveWorkspaceHistory(
  relPath: string,
  history: NoteVersionSnapshot[],
  rootDirHandle: FileSystemDirectoryHandle | null = null
) {
  const existing = debouncedHistoryTimers.get(relPath);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    debouncedHistoryTimers.delete(relPath);
    void saveWorkspaceHistoryToDisk(rootDirHandle, relPath, history);
  }, 1000);

  debouncedHistoryTimers.set(relPath, timer);
}

export async function saveWorkspaceHistoryToDisk(
  rootDirHandle: FileSystemDirectoryHandle | null,
  relPath: string,
  history: NoteVersionSnapshot[]
): Promise<void> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  const jsonStr = JSON.stringify(history, null, 2);

  if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const safeName = encodeURIComponent(relPath).replace(/%/g, "_");
        const fullPath = `${saved.folderPath}/.luno/history/${safeName}.json`;
        await electronAPI.writeFileContent({ fullPath, content: jsonStr });
        return;
      }
    } catch (err) {
      console.warn("Failed to write .luno/history in Electron", err);
    }
  }

  if (!rootDirHandle) return;

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: true });
    const historyDir = await metaDir.getDirectoryHandle("history", { create: true });
    const safeName = encodeURIComponent(relPath).replace(/%/g, "_");
    const fileHandle = await historyDir.getFileHandle(`${safeName}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonStr);
    await writable.close();
  } catch (err) {
    console.warn("Failed to write .luno/history file", err);
  }
}

export async function loadWorkspaceHistoryFromDisk(
  rootDirHandle: FileSystemDirectoryHandle | null,
  relPath: string
): Promise<NoteVersionSnapshot[] | null> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  const safeName = encodeURIComponent(relPath).replace(/%/g, "_");

  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/history/${safeName}.json`;
        const content = await electronAPI.readFileContent(fullPath);
        if (content) {
          const list = JSON.parse(content);
          if (Array.isArray(list)) return list;
        }
      }
    } catch {}
  }

  if (!rootDirHandle) return null;

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: false });
    const historyDir = await metaDir.getDirectoryHandle("history", { create: false });
    const fileHandle = await historyDir.getFileHandle(`${safeName}.json`, { create: false });
    const file = await fileHandle.getFile();
    const content = await file.text();
    if (content) {
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch {}

  return null;
}

export interface HistoryDateGroup {
  id: string;
  title: string;
  items: NoteVersionSnapshot[];
}

/**
 * Groups version snapshots chronologically into categorized subheadings:
 * - Today (วันนี้)
 * - Yesterday (เมื่อวาน)
 * - Specific dates within past 7 days (formatted with user's dateFormat e.g. "2026-09-19" or "19/09/2026")
 * - Last week (สัปดาห์ที่แล้ว)
 * - Last month (เดือนที่แล้ว)
 * - Older (เก่ากว่านี้)
 */
export function groupVersionSnapshots(
  snapshots: NoteVersionSnapshot[],
  dateFormat: string = "YYYY-MM-DD",
  language: string = "en",
  translations?: {
    today?: string;
    yesterday?: string;
    lastWeek?: string;
    lastMonth?: string;
    older?: string;
  }
): HistoryDateGroup[] {
  if (!snapshots || snapshots.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysAgo = todayStart - 6 * 86400000;
  const fourteenDaysAgo = todayStart - 13 * 86400000;
  const thirtyDaysAgo = todayStart - 29 * 86400000;

  const isTh = language === "th";
  const labelToday = translations?.today || (isTh ? "วันนี้" : "Today");
  const labelYesterday = translations?.yesterday || (isTh ? "เมื่อวาน" : "Yesterday");
  const labelLastWeek = translations?.lastWeek || (isTh ? "สัปดาห์ที่แล้ว" : "Last week");
  const labelLastMonth = translations?.lastMonth || (isTh ? "เดือนที่แล้ว" : "Last month");
  const labelOlder = translations?.older || (isTh ? "เก่ากว่านี้" : "Older");

  const groupMap = new Map<string, HistoryDateGroup>();
  const groupOrder: string[] = [];

  for (const item of snapshots) {
    const ts = item.timestamp || 0;
    let groupId: string;
    let groupTitle: string;

    if (ts >= todayStart) {
      groupId = "today";
      groupTitle = labelToday;
    } else if (ts >= yesterdayStart) {
      groupId = "yesterday";
      groupTitle = labelYesterday;
    } else if (ts >= sevenDaysAgo) {
      const d = new Date(ts);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      groupId = `date_${dayKey}`;
      groupTitle = formatDate(ts, dateFormat, language);
    } else if (ts >= fourteenDaysAgo) {
      groupId = "lastWeek";
      groupTitle = labelLastWeek;
    } else if (ts >= thirtyDaysAgo) {
      groupId = "lastMonth";
      groupTitle = labelLastMonth;
    } else {
      groupId = "older";
      groupTitle = labelOlder;
    }

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        id: groupId,
        title: groupTitle,
        items: [],
      });
      groupOrder.push(groupId);
    }

    groupMap.get(groupId)!.items.push(item);
  }

  return groupOrder.map((id) => groupMap.get(id)!);
}


