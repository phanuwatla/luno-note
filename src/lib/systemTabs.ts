import type { Note } from "@/hooks/useNotes";

export const SYSTEM_TAB_IDS = [
  "home",
  "trash",
  "settings",
  "help",
  "luno-ai",
  "templates",
  "relations",
  "favorites",
  "tags",
  "whats-new",
] as const;

export type SystemTabId = (typeof SYSTEM_TAB_IDS)[number];

const SYSTEM_TAB_SET = new Set<string>(SYSTEM_TAB_IDS);

export function isSystemTabId(id?: string | null): boolean {
  if (!id) return false;
  if (SYSTEM_TAB_SET.has(id)) return true;
  for (const prefix of SYSTEM_TAB_IDS) {
    if (id.startsWith(`${prefix}:`)) return true;
  }
  return false;
}

export function isWebViewerTabId(id?: string | null): boolean {
  return Boolean(id && id.startsWith("web:"));
}

export function isVirtualTabId(id?: string | null): boolean {
  return isSystemTabId(id) || isWebViewerTabId(id);
}

export function isSystemTab(note?: Pick<Note, "id" | "fileType"> | null): boolean {
  if (!note) return false;
  if (note.fileType && SYSTEM_TAB_SET.has(note.fileType)) return true;
  return isSystemTabId(note.id);
}

export function isWebViewerTab(note?: Pick<Note, "id" | "fileType"> | null): boolean {
  if (!note) return false;
  return note.fileType === "web-viewer" || isWebViewerTabId(note.id);
}

export function isVirtualTab(note?: Pick<Note, "id" | "fileType"> | null): boolean {
  return isSystemTab(note) || isWebViewerTab(note);
}
