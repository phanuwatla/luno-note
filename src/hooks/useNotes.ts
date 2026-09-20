import { useState, useCallback, useEffect, useRef } from "react";
import { docxToHtml } from "@/lib/docxUtils";
import { markNoteAsDeleted } from "@/lib/fileHandles";
import {
  parseFrontmatterAndTags,
  updateFrontmatterTags,
  updateFrontmatterIcon,
  renameTagInMarkdown,
  removeTagFromMarkdown,
  isTiptapJson,
  isMarkdownNote,
} from "@/lib/frontmatter";
import { isEncryptedNote } from "@/lib/noteCrypto";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  fileName?: string;
  isLinkedFile?: boolean;
  contentFormat?: "plain" | "markdown" | "html" | "css";
  folderPath?: string;
  fileType?: "image" | "binary" | "settings" | "luno-ai" | "web-viewer";
  url?: string;
  faviconUrl?: string;
  isFavorite?: boolean;
  isLocked?: boolean;
  isDecrypted?: boolean;
  encryptedContent?: string;
  tags?: string[];
  icon?: string;
  iconColor?: string;
  driveFileId?: string;
  driveSyncedAt?: number;
  fileSize?: number;
}

const STORAGE_KEY = "notes-app-data";

function sanitizeNotesForStorage(notes: Note[]): Note[] {
  return notes.map((n) => {
    if (n.isLocked) {
      return {
        ...n,
        content: n.encryptedContent || (isEncryptedNote(n.content) ? n.content : ""),
        isDecrypted: false,
      };
    }
    return n;
  });
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const loaded: Note[] = JSON.parse(raw);
    return loaded.map((n) => {
      const isMd = isMarkdownNote(n);
      const isEncrypted = isEncryptedNote(n.content);
      const hasCipher = Boolean(n.encryptedContent && isEncryptedNote(n.encryptedContent));
      const isLocked = isEncrypted || (hasCipher && Boolean(n.isLocked));
      const encContent = hasCipher ? n.encryptedContent : (isEncrypted ? n.content : undefined);
      const parsedFm = (isMd && n.content && !isLocked && !isTiptapJson(n.content)) ? parseFrontmatterAndTags(n.content) : undefined;
      const extracted = parsedFm ? parsedFm.allTags : [];
      const fmIcon = typeof parsedFm?.frontmatterData?.icon === "string" ? parsedFm.frontmatterData.icon : undefined;
      const fmIconColor = typeof (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color) === "string"
        ? (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color)
        : undefined;
      return {
        ...n,
        isLocked,
        isDecrypted: false,
        encryptedContent: encContent,
        tags: isMd ? (parsedFm ? extracted : (n.tags || [])) : [],
        icon: n.icon ?? fmIcon,
        iconColor: n.iconColor ?? fmIconColor,
      };
    });
  } catch {
    return [];
  }
}

let saveNotesTimeout: ReturnType<typeof setTimeout> | null = null;

function saveNotes(notes: Note[], immediate = false) {
  if (saveNotesTimeout) {
    clearTimeout(saveNotesTimeout);
    saveNotesTimeout = null;
  }

  const doSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeNotesForStorage(notes)));
    } catch (err) {
      console.warn("Failed to save notes to LocalStorage (QuotaExceededError or disabled):", err);
    }
  };

  if (immediate) {
    doSave();
  } else {
    saveNotesTimeout = setTimeout(doSave, 300);
  }
}

export function extractBaseTitleFromFileName(fileName?: string): string {
  if (!fileName) return "";
  const name = fileName.trim();
  const dotIndex = name.lastIndexOf(".");
  return dotIndex > 0 ? name.slice(0, dotIndex) : name;
}

export function isSystemGeneratedUntitledName(rawTitle: string): boolean {
  if (!rawTitle) return true;
  const trimmed = rawTitle.trim();
  if (/^untitled(-\d+)?$/i.test(trimmed)) return true;
  if (/^Note_\d{4}-\d{2}-\d{2}(-\d+)?$/i.test(trimmed)) return true;
  if (/^Daily-\d{4}-\d{2}-\d{2}(-\d+)?$/i.test(trimmed)) return true;
  return false;
}

export function getNoteTitleFromFileName(fileName?: string): string {
  if (!fileName) return "";
  const base = extractBaseTitleFromFileName(fileName);
  return isSystemGeneratedUntitledName(base) ? "" : base;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const notesRef = useRef<Note[]>(notes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => loadNotes()[0]?.id ?? null
  );

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

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
      notesRef.current = updated;
      saveNotes(updated);
      return updated;
    });
    setActiveNoteId(note.id);
    return note;
  }, []);

  const bulkCreateNotes = useCallback(async (items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary" | "settings" | "luno-ai"; tags?: string[] }>) => {
    const now = Date.now();
    const newNotes: Note[] = [];
    for (const item of items) {
      // If .docx file, convert to HTML
      if (item.fileName?.toLowerCase().endsWith('.docx') && typeof window !== 'undefined' && typeof File !== 'undefined' && (item.content as unknown) instanceof ArrayBuffer) {
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
      notesRef.current = updated;
      saveNotes(updated);
      return updated;
    });
    return newNotes;
  }, []);

  const replaceNotes = useCallback((items: Array<{ id?: string; content: string; fileName?: string; isLinkedFile?: boolean; contentFormat?: "plain" | "markdown" | "html"; folderPath?: string; fileType?: "image" | "binary" | "settings" | "luno-ai"; tags?: string[] }>, isNewWorkspace: boolean = false) => {
    const now = Date.now();

    const prevNotesMap = new Map<string, Note>();
    if (!isNewWorkspace) {
      notesRef.current.forEach((n) => {
        if (n.id) prevNotesMap.set(n.id, n);
        const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
        if (relPath) prevNotesMap.set(relPath, n);
      });
    }

    const resultNotes: Note[] = items.map((item) => {
      const relPath = item.fileName ? (item.folderPath ? `${item.folderPath}/${item.fileName}` : item.fileName) : "";
      const existingNote = !isNewWorkspace ? ((item.id ? prevNotesMap.get(item.id) : undefined) || (relPath ? prevNotesMap.get(relPath) : undefined)) : undefined;
      const id = item.id ?? existingNote?.id ?? crypto.randomUUID();

      const isMd = isMarkdownNote(item);
      const parsedFm = (isMd && typeof item.content === "string" && !isTiptapJson(item.content)) ? parseFrontmatterAndTags(item.content) : undefined;
      const extractedTags = parsedFm ? parsedFm.allTags : [];
      const fmIcon = typeof parsedFm?.frontmatterData?.icon === "string" ? parsedFm.frontmatterData.icon : undefined;
      const fmIconColor = typeof (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color) === "string"
        ? (parsedFm?.frontmatterData?.iconColor || parsedFm?.frontmatterData?.icon_color)
        : undefined;
      const fmFavorite = typeof parsedFm?.frontmatterData?.favorite === "boolean"
        ? parsedFm.frontmatterData.favorite
        : (typeof parsedFm?.frontmatterData?.isFavorite === "boolean"
          ? parsedFm.frontmatterData.isFavorite
          : undefined);
      const mergedTags = isMd
        ? (item.tags !== undefined
            ? item.tags
            : (parsedFm ? extractedTags : (existingNote?.tags || [])))
        : [];

      const isDiskEncrypted = isEncryptedNote(item.content);
      const hasMemoryCipher = Boolean(
        (existingNote?.encryptedContent && isEncryptedNote(existingNote.encryptedContent)) ||
        ((item as any).encryptedContent && isEncryptedNote((item as any).encryptedContent))
      );
      const isLocked = isDiskEncrypted || hasMemoryCipher;
      const isCurrentlyDecrypted = Boolean(
        existingNote &&
        isLocked &&
        ((item as any).isDecrypted ?? (existingNote?.isDecrypted && !isEncryptedNote(existingNote?.content)))
      );
      const isDecrypted = isLocked ? isCurrentlyDecrypted : false;
      const content = (isCurrentlyDecrypted && isDiskEncrypted && existingNote?.content)
        ? existingNote.content
        : (typeof item.content === "string" ? item.content : "");
      const encryptedContent = isDiskEncrypted
        ? item.content
        : (hasMemoryCipher ? (existingNote?.encryptedContent || (item as any).encryptedContent) : undefined);

      return {
        id,
        title: getNoteTitleFromFileName(item.fileName),
        content,
        createdAt: item.createdAt ?? existingNote?.createdAt ?? now,
        updatedAt: item.updatedAt ?? existingNote?.updatedAt ?? now,
        fileName: item.fileName,
        isLinkedFile: item.isLinkedFile,
        contentFormat: item.contentFormat,
        folderPath: item.folderPath,
        fileType: item.fileType,
        isLocked,
        isDecrypted,
        encryptedContent,
        tags: mergedTags,
        isFavorite: (item as any).isFavorite !== undefined
          ? (item as any).isFavorite
          : (fmFavorite !== undefined ? fmFavorite : (existingNote?.isFavorite ?? false)),
        icon: (item as any).icon !== undefined ? (item as any).icon : (existingNote?.icon ?? fmIcon),
        iconColor: (item as any).iconColor !== undefined ? (item as any).iconColor : (existingNote?.iconColor ?? fmIconColor),
        driveFileId: (item as any).driveFileId ?? existingNote?.driveFileId,
        driveSyncedAt: (item as any).driveSyncedAt ?? existingNote?.driveSyncedAt,
      };
    });

    // When switching to a new workspace, immediately wipe localStorage AND
    // the in-memory ref so no stale notes from the previous workspace can
    // bleed into the new state before React commits the setNotes update.
    if (isNewWorkspace) {
      notesRef.current = [];
      saveNotes([], true);
    }

    notesRef.current = resultNotes;
    setNotes(resultNotes);
    saveNotes(resultNotes);

    return resultNotes;
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>) => {
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

          let finalTags: string[] = isMd ? (n.tags || []) : [];
          if (isMd) {
            if (normalizedPatch.tags !== undefined) {
              finalTags = normalizedPatch.tags;
              if (normalizedPatch.content === undefined && mergedContent && typeof mergedContent === "string" && !isTiptapJson(mergedContent)) {
                const parsed = parseFrontmatterAndTags(mergedContent);
                const inlineSet = new Set(parsed.inlineTags.map((t) => t.toLowerCase()));
                const frontmatterOnlyTags = normalizedPatch.tags.filter((t) => !inlineSet.has(t.toLowerCase()));
                mergedContent = updateFrontmatterTags(mergedContent, frontmatterOnlyTags);
              }
            } else if (normalizedPatch.content !== undefined) {
              const str = mergedContent || "";
              if (typeof str === "string" && !isTiptapJson(str)) {
                const parsed = parseFrontmatterAndTags(str);
                finalTags = parsed.allTags;
              }
            }

            if ("icon" in normalizedPatch || "iconColor" in normalizedPatch) {
              const nextIcon = "icon" in normalizedPatch ? normalizedPatch.icon : n.icon;
              const nextIconColor = "iconColor" in normalizedPatch ? normalizedPatch.iconColor : n.iconColor;
              if (mergedContent && typeof mergedContent === "string" && !isTiptapJson(mergedContent)) {
                mergedContent = updateFrontmatterIcon(
                  mergedContent,
                  nextIcon,
                  nextIconColor
                );
              }
            }
          }

          return {
            ...n,
            ...normalizedPatch,
            icon: "icon" in normalizedPatch ? normalizedPatch.icon : n.icon,
            iconColor: "iconColor" in normalizedPatch ? normalizedPatch.iconColor : n.iconColor,
            content: mergedContent,
            tags: finalTags,
            updatedAt: Date.now(),
          };
        });
        notesRef.current = updated;
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
      notesRef.current = updated;
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
      notesRef.current = updated;
      saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      markNoteAsDeleted(id);
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        notesRef.current = updated;
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
