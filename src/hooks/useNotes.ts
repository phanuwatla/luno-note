import { useState, useCallback, useEffect } from "react";
import { docxToHtml } from "@/lib/docxUtils";
import { markNoteAsDeleted } from "@/lib/fileHandles";
import {
  parseFrontmatterAndTags,
  updateFrontmatterTags,
  renameTagInMarkdown,
  removeTagFromMarkdown,
  isTiptapJson,
  isMarkdownNote,
} from "@/lib/frontmatter";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  fileName?: string;
  isLinkedFile?: boolean;
  contentFormat?: "plain" | "markdown" | "html";
  folderPath?: string;
  fileType?: "image" | "binary";
  isFavorite?: boolean;
  tags?: string[];
  driveFileId?: string;
  driveSyncedAt?: number;
}

const STORAGE_KEY = "notes-app-data";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const loaded: Note[] = JSON.parse(raw);
    return loaded.map((n) => {
      const isMd = isMarkdownNote(n);
      const extracted = (isMd && n.content && !isTiptapJson(n.content)) ? parseFrontmatterAndTags(n.content).allTags : [];
      return {
        ...n,
        tags: isMd ? Array.from(new Set([...(n.tags || []), ...extracted])) : [],
      };
    });
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function extractBaseTitleFromFileName(fileName?: string): string {
  if (!fileName) return "";
  const name = fileName.trim();
  const lastDot = name.lastIndexOf(".");
  if (lastDot > 0) {
    return name.slice(0, lastDot);
  }
  return name;
}

export function isSystemGeneratedUntitledName(name?: string): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  const dotIdx = trimmed.lastIndexOf(".");
  const baseName = dotIdx > 0 ? trimmed.slice(0, dotIdx) : trimmed;
  // Match "untitled", "untitled-1", "untitled (1)", "untitled_1"
  if (/^untitled([_\-\s]?\d+|\s*\(\d+\))?$/i.test(baseName)) return true;
  // Match "note_YYYY-MM-DD", "note_YYYY-MM-DD (1)", etc.
  if (/^note_\d{4}-\d{2}-\d{2}([_\-\s]?\d+|\s*\(\d+\))?$/i.test(baseName)) return true;
  // Match "daily-YYYY-MM-DD", "daily-YYYY-MM-DD (1)", etc.
  if (/^daily-\d{4}-\d{2}-\d{2}([_\-\s]?\d+|\s*\(\d+\))?$/i.test(baseName)) return true;
  return false;
}

export function getNoteTitleFromFileName(fileName?: string): string {
  if (!fileName) return "";
  const base = extractBaseTitleFromFileName(fileName);
  return isSystemGeneratedUntitledName(base) ? "" : base;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => loadNotes()[0]?.id ?? null
  );

  useEffect(() => {
    if (activeNoteId && !notes.some((n) => n.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id ?? null);
    }
  }, [notes, activeNoteId]);

  const createNote = useCallback((folderPath?: string) => {
    const now = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
      folderPath,
      tags: [],
    };

    setNotes((prev) => {
      const updated = [note, ...prev];
      saveNotes(updated);
      return updated;
    });
    setActiveNoteId(note.id);
    return note;
  }, []);

  const bulkCreateNotes = useCallback(async (items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary" }>) => {
    const now = Date.now();
    const newNotes: Note[] = [];
    for (const item of items) {
      // If .docx file, convert to HTML
      if (item.fileName?.toLowerCase().endsWith('.docx') && typeof window !== 'undefined' && typeof File !== 'undefined' && item.content instanceof ArrayBuffer) {
        try {
          const file = new File([item.content], item.fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const html = await docxToHtml(file);
          newNotes.push({
            id: item.id ?? crypto.randomUUID(),
            title: getNoteTitleFromFileName(item.fileName),
            content: html,
            createdAt: now,
            updatedAt: now,
            fileName: item.fileName,
            isLinkedFile: item.isLinkedFile,
            contentFormat: 'html',
            folderPath: item.folderPath,
            tags: [],
          });
          continue;
        } catch (e) {
          // fallback: treat as binary
        }
      }
      const isMd = isMarkdownNote(item);
      const parsedTags = (isMd && typeof item.content === "string" && !isTiptapJson(item.content)) ? parseFrontmatterAndTags(item.content).allTags : [];
      newNotes.push({
        id: item.id ?? crypto.randomUUID(),
        title: getNoteTitleFromFileName(item.fileName),
        content: typeof item.content === "string" ? item.content : "",
        createdAt: now,
        updatedAt: now,
        fileName: item.fileName,
        isLinkedFile: item.isLinkedFile,
        contentFormat: item.contentFormat,
        folderPath: item.folderPath,
        fileType: item.fileType,
        tags: isMd ? parsedTags : [],
      });
    }
    setNotes((prev) => {
      const updated = [...newNotes, ...prev];
      saveNotes(updated);
      return updated;
    });
    return newNotes;
  }, []);

  const replaceNotes = useCallback((items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary"; tags?: string[] }>) => {
    const now = Date.now();
    let resultNotes: Note[] = [];

    setNotes((prev) => {
      const prevNotesMap = new Map<string, Note>();
      prev.forEach((n) => {
        if (n.id) prevNotesMap.set(n.id, n);
        const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
        if (relPath) prevNotesMap.set(relPath, n);
      });

      resultNotes = items.map((item) => {
        const id = item.id ?? crypto.randomUUID();
        const relPath = item.fileName ? (item.folderPath ? `${item.folderPath}/${item.fileName}` : item.fileName) : "";
        const existingNote = prevNotesMap.get(id) || (relPath ? prevNotesMap.get(relPath) : undefined);

        const isMd = isMarkdownNote(item);
        const extractedTags = (isMd && typeof item.content === "string" && !isTiptapJson(item.content)) ? parseFrontmatterAndTags(item.content).allTags : [];
        const mergedTags = isMd ? (item.tags !== undefined ? item.tags : Array.from(new Set([...(existingNote?.tags || []), ...extractedTags]))) : [];

        return {
          id,
          title: getNoteTitleFromFileName(item.fileName),
          content: typeof item.content === "string" ? item.content : "",
          createdAt: existingNote?.createdAt ?? now,
          updatedAt: now,
          fileName: item.fileName,
          isLinkedFile: item.isLinkedFile,
          contentFormat: item.contentFormat,
          folderPath: item.folderPath,
          fileType: item.fileType,
          tags: mergedTags,
        };
      });

      saveNotes(resultNotes);
      return resultNotes;
    });

    return resultNotes;
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "content" | "fileName" | "isLinkedFile" | "contentFormat" | "folderPath" | "tags" | "driveFileId" | "driveSyncedAt">>) => {
      const normalizedPatch = { ...patch };
      if (patch.fileName && normalizedPatch.title === undefined) {
        normalizedPatch.title = getNoteTitleFromFileName(patch.fileName);
      }

      setNotes((prev) => {
        const updated = prev.map((n) => {
          if (n.id !== id) return n;
          let mergedContent = normalizedPatch.content !== undefined ? normalizedPatch.content : n.content;

          const updatedNoteMeta = {
            fileName: normalizedPatch.fileName !== undefined ? normalizedPatch.fileName : n.fileName,
            contentFormat: normalizedPatch.contentFormat !== undefined ? normalizedPatch.contentFormat : n.contentFormat,
            fileType: normalizedPatch.fileType !== undefined ? normalizedPatch.fileType : n.fileType,
          };
          const isMd = isMarkdownNote(updatedNoteMeta);

          let finalTags: string[] = [];
          if (isMd) {
            finalTags = n.tags || [];
            if (normalizedPatch.tags !== undefined) {
              finalTags = normalizedPatch.tags;
              if (mergedContent && typeof mergedContent === "string" && !isTiptapJson(mergedContent)) {
                mergedContent = updateFrontmatterTags(mergedContent, normalizedPatch.tags);
              }
            } else if (normalizedPatch.content !== undefined) {
              const str = mergedContent || "";
              if (typeof str === "string" && !isTiptapJson(str) && !str.trimStart().startsWith("<")) {
                const extracted = parseFrontmatterAndTags(str).allTags;
                finalTags = Array.from(new Set([...finalTags, ...extracted]));
              }
            }
          }

          return {
            ...n,
            ...normalizedPatch,
            content: mergedContent,
            tags: finalTags,
            updatedAt: Date.now(),
          };
        });
        saveNotes(updated);
        return updated;
      });
    },
    []
  );

  const renameTagGlobally = useCallback((oldTag: string, newTag: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) => {
        if (!isMarkdownNote(n)) return n;
        const newContent = renameTagInMarkdown(n.content || "", oldTag, newTag);
        if (newContent === n.content) return n;
        const newTags = parseFrontmatterAndTags(newContent).allTags;
        return { ...n, content: newContent, tags: newTags, updatedAt: Date.now() };
      });
      saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteTagGlobally = useCallback((tagToDelete: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) => {
        if (!isMarkdownNote(n)) return n;
        const newContent = removeTagFromMarkdown(n.content || "", tagToDelete);
        if (newContent === n.content) return n;
        const newTags = parseFrontmatterAndTags(newContent).allTags;
        return { ...n, content: newContent, tags: newTags, updatedAt: Date.now() };
      });
      saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      markNoteAsDeleted(id);
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        saveNotes(updated);
        return updated;
      });

      return true;
    },
    []
  );

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  return {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    createNote,
    bulkCreateNotes,
    replaceNotes,
    updateNote,
    renameTagGlobally,
    deleteTagGlobally,
    deleteNote,
  };
}
