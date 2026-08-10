import { useState, useCallback, useEffect } from "react";
import { docxToHtml } from "@/lib/docxUtils";
import { markNoteAsDeleted } from "@/lib/fileHandles";

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
}

const STORAGE_KEY = "notes-app-data";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
  return /^untitled([_\-\s]?\d+)?$/i.test(baseName);
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
          });
          continue;
        } catch (e) {
          // fallback: treat as binary
        }
      }
      newNotes.push({
        id: item.id ?? crypto.randomUUID(),
        title: getNoteTitleFromFileName(item.fileName),
        content: item.content,
        createdAt: now,
        updatedAt: now,
        fileName: item.fileName,
        isLinkedFile: item.isLinkedFile,
        contentFormat: item.contentFormat,
        folderPath: item.folderPath,
        fileType: item.fileType,
      });
    }
    setNotes((prev) => {
      const updated = [...newNotes, ...prev];
      saveNotes(updated);
      return updated;
    });
    return newNotes;
  }, []);

  const replaceNotes = useCallback((items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary" }>) => {
    const now = Date.now();
    const newNotes: Note[] = items.map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      title: getNoteTitleFromFileName(item.fileName),
      content: item.content,
      createdAt: now,
      updatedAt: now,
      fileName: item.fileName,
      isLinkedFile: item.isLinkedFile,
      contentFormat: item.contentFormat,
      folderPath: item.folderPath,
      fileType: item.fileType,
    }));

    setNotes(() => {
      saveNotes(newNotes);
      return newNotes;
    });

    return newNotes;
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "content" | "fileName" | "isLinkedFile" | "contentFormat" | "folderPath">>) => {
      const normalizedPatch = { ...patch };
      if (patch.fileName && normalizedPatch.title === undefined) {
        normalizedPatch.title = getNoteTitleFromFileName(patch.fileName);
      }

      setNotes((prev) => {
        const updated = prev.map((n) => {
          if (n.id !== id) return n;
          return { ...n, ...normalizedPatch, updatedAt: Date.now() };
        });
        saveNotes(updated);
        return updated;
      });
    },
    []
  );

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
    deleteNote,
  };
}
