import { useState, useCallback, useEffect } from "react";

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

function deriveTitleFromContent(content: string): string {
  // Handle Tiptap JSON format
  if (content.trimStart().startsWith('{"type":"doc"')) {
    try {
      const doc = JSON.parse(content);
      const extractText = (node: any): string => {
        if (node.type === "text") return node.text || "";
        if (node.content) return node.content.map(extractText).join("");
        return "";
      };
      const firstBlock = doc.content?.[0];
      const title = firstBlock ? extractText(firstBlock).trim() : "";
      return title;
    } catch {
      return "";
    }
  }

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  let text = content;

  if (hasHtml && typeof document !== "undefined") {
    const parser = document.createElement("div");
    parser.innerHTML = content;
    const firstBlock = parser.firstElementChild;
    text = (firstBlock?.textContent || parser.textContent || parser.innerText || "").trim();
  } else if (hasHtml) {
    text = content.replace(/<[^>]*>/g, " ");
  }

  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ?? "";
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

  const bulkCreateNotes = useCallback((items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary" }>) => {
    const now = Date.now();
    const newNotes: Note[] = items.map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      title: deriveTitleFromContent(item.content),
      content: item.content,
      createdAt: now,
      updatedAt: now,
      fileName: item.fileName,
      isLinkedFile: item.isLinkedFile,
      contentFormat: item.contentFormat,
      folderPath: item.folderPath,
      fileType: item.fileType,
    }));

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
      title: deriveTitleFromContent(item.content),
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
    (id: string, patch: Partial<Pick<Note, "title" | "content" | "fileName" | "isLinkedFile" | "contentFormat">>) => {
      const normalizedPatch = { ...patch };
      if (typeof patch.content === "string") {
        normalizedPatch.title = deriveTitleFromContent(patch.content);
      }

      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, ...normalizedPatch, updatedAt: Date.now() } : n
        );
        saveNotes(updated);
        return updated;
      });
    },
    []
  );

  const deleteNote = useCallback(
    (id: string) => {
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
