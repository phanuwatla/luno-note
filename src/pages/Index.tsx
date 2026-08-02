import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import SplitResizer from "@/components/SplitResizer";
import TabBar from "@/components/TabBar";
import Breadcrumb from "@/components/Breadcrumb";
import type { Note } from "@/hooks/useNotes";
import { useNotes } from "@/hooks/useNotes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTabs } from "@/hooks/useTabs";
import { clearAllStoredFileHandles, getStoredFileHandle, setStoredFileHandle, requestPermissionIfAvailable, unmarkNoteAsDeleted, trackDeletedRelativePath, clearDeletedRelativePath, isRelativePathDeleted, globalDeletedRelativePaths } from "@/lib/fileHandles";
import { marked } from "marked";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function Index() {
  const { t } = useTranslation();
  // ความกว้างฝั่งซ้าย (px) ถ้า split, ค่า default 50%
  const [splitLeftWidth, setSplitLeftWidth] = useState<number | null>(null);
  const { notes, createNote, replaceNotes, updateNote, deleteNote } = useNotes();
  const { openTabIds, activeTabId, openTab, closeTab, removeTabsForDeletedNotes, setActiveTabId } = useTabs();
  const activeTabNote = notes.find((n) => n.id === activeTabId) ?? null;
  const { settings } = useAppSettings();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openedFolderName, setOpenedFolderName] = useState<string | null>(null);
  const [openedRootDirHandle, setOpenedRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [openedFolderPaths, setOpenedFolderPaths] = useState<string[]>([]);
  const [clipboardItem, setClipboardItem] = useState<{ kind: "file" | "file-batch" | "folder"; noteId?: string; noteIds?: string[]; folderPath: string; fileName?: string } | null>(null);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(activeTabNote === null);
    }
  }, [activeTabNote, isMobile]);

  const normalizeNewFileOptions = (options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const raw = (options?.fileName ?? "").trim();
    const safe = raw.replace(/[\\/:*?"<>|]/g, "_");

    if (!safe) {
      return { fileName: "untitled.txt", contentFormat: "plain" as const };
    }

    const dotIndex = safe.lastIndexOf(".");
    const base = dotIndex > 0 ? safe.slice(0, dotIndex) : safe;
    const extFromName = dotIndex > 0 ? safe.slice(dotIndex + 1).toLowerCase() : "";
    const desiredFormat = options?.contentFormat ?? "plain";

    if (extFromName === "md" || extFromName === "markdown") {
      return { fileName: `${base}.md`, contentFormat: "markdown" as const };
    }
    if (extFromName === "txt") {
      return { fileName: `${base}.txt`, contentFormat: "plain" as const };
    }
    if (extFromName === "html" || extFromName === "htm") {
      return { fileName: `${base}.${extFromName}`, contentFormat: "html" as const };
    }

    if (desiredFormat === "markdown") {
      return { fileName: `${base}.md`, contentFormat: "markdown" as const };
    }
    if (desiredFormat === "html") {
      return { fileName: `${base}.html`, contentFormat: "html" as const };
    }

    return { fileName: `${base}.txt`, contentFormat: "plain" as const };
  };

  const resolveUniqueFileName = async (targetDir: FileSystemDirectoryHandle, desiredFileName: string) => {
    const dotIndex = desiredFileName.lastIndexOf(".");
    const base = dotIndex > 0 ? desiredFileName.slice(0, dotIndex) : desiredFileName;
    const ext = dotIndex > 0 ? desiredFileName.slice(dotIndex) : ".txt";

    let index = 0;
    while (true) {
      const candidate = index === 0 ? `${base}${ext}` : `${base}-${index}${ext}`;
      try {
        await targetDir.getFileHandle(candidate, { create: false });
        index += 1;
      } catch (error) {
        if ((error as DOMException)?.name !== "NotFoundError") throw error;
        return candidate;
      }
    }
  };

  const resolveUniqueFolderName = async (targetDir: FileSystemDirectoryHandle, desiredFolderName: string) => {
    let index = 0;
    while (true) {
      const candidate = index === 0 ? desiredFolderName : `${desiredFolderName}-${index}`;
      try {
        await targetDir.getDirectoryHandle(candidate, { create: false });
        index += 1;
      } catch (error) {
        if ((error as DOMException)?.name !== "NotFoundError") throw error;
        return candidate;
      }
    }
  };

  const getDirectoryHandleByPath = async (folderPath: string) => {
    if (!openedRootDirHandle) return null;
    let dir = openedRootDirHandle;
    const segments = folderPath.split("/").filter(Boolean);
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment);
    }
    return dir;
  };

  const copyFileHandleToDirectory = async (sourceFileHandle: FileSystemFileHandle, targetDir: FileSystemDirectoryHandle, targetName: string) => {
    const file = await sourceFileHandle.getFile();
    const writableTarget = await targetDir.getFileHandle(targetName, { create: true });
    const writable = await (writableTarget as unknown as { createWritable: () => Promise<WritableStreamDefaultWriter | { write: (data: unknown) => Promise<void>; close: () => Promise<void> }> }).createWritable();
    await writable.write(file);
    await writable.close();
    return writableTarget;
  };

  const copyDirectoryRecursive = async (sourceDirHandle: FileSystemDirectoryHandle, targetParentDir: FileSystemDirectoryHandle, desiredFolderName: string) => {
    const finalFolderName = await resolveUniqueFolderName(targetParentDir, desiredFolderName);
    const newDir = await targetParentDir.getDirectoryHandle(finalFolderName, { create: true });

    for await (const [entryName, entryHandle] of (sourceDirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
      if (entryHandle.kind === "directory") {
        await copyDirectoryRecursive(entryHandle as FileSystemDirectoryHandle, newDir, entryName);
      } else if (entryHandle.kind === "file") {
        await copyFileHandleToDirectory(entryHandle as FileSystemFileHandle, newDir, entryName);
      }
    }

    return finalFolderName;
  };

  const getRelativePath = (folderPath: string, fileName: string) => (folderPath ? `${folderPath}/${fileName}` : fileName);

  const scanFolderEntries = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".avif"]);
    const TEXT_EXTS = new Set([
      ".txt", ".md", ".markdown",
      ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs",
      ".py", ".rb", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".swift", ".kt",
      ".html", ".htm", ".css", ".scss", ".less",
      ".json", ".yaml", ".yml", ".toml", ".xml", ".csv", ".ini", ".cfg", ".conf", ".env",
      ".sh", ".bash", ".zsh", ".fish",
      ".sql", ".r", ".scala", ".lua", ".vim",
    ]);

    const entries: Array<{
      fileName: string;
      contentFormat: "plain" | "markdown" | "html";
      fileType?: "image" | "binary";
      handle: FileSystemFileHandle;
      folderPath: string;
      relativePath: string;
    }> = [];
    const folderPaths = new Set<string>();

    async function readDir(handle: FileSystemDirectoryHandle, path: string) {
      for await (const [name, childHandle] of (handle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
        if (childHandle.kind === "directory") {
          const subPath = path ? `${path}/${name}` : name;
          folderPaths.add(subPath);
          await readDir(childHandle as FileSystemDirectoryHandle, subPath);
        } else if (childHandle.kind === "file") {
          const lname = name.toLowerCase();
          // Filter out and auto-clean temporary swap files (.crswap, .tmp, .swp, etc.)
          if (lname.endsWith(".crswap") || lname.includes(".crswap") || lname.endsWith(".tmp") || lname.endsWith(".swp")) {
            try {
              await handle.removeEntry(name);
            } catch {
              /* ignore swap cleanup errors */
            }
            continue;
          }
          if (lname.startsWith(".")) {
            continue;
          }

          const dotIdx = lname.lastIndexOf(".");
          const ext = dotIdx >= 0 ? lname.slice(dotIdx) : "";

          let fileType: "image" | "binary" | undefined;
          let contentFormat: "plain" | "markdown" | "html" = "plain";

          if (IMAGE_EXTS.has(ext)) {
            fileType = "image";
          } else if (TEXT_EXTS.has(ext)) {
            contentFormat = ext === ".md" || ext === ".markdown" ? "markdown" : ext === ".html" || ext === ".htm" ? "html" : "plain";
          } else {
            fileType = "binary";
          }

          entries.push({
            fileName: name,
            contentFormat,
            fileType,
            handle: childHandle as FileSystemFileHandle,
            folderPath: path,
            relativePath: getRelativePath(path, name),
          });
        }
      }
    }

    await readDir(dirHandle, "");

    entries.sort((a, b) => {
      const pathCompare = a.folderPath.localeCompare(b.folderPath);
      if (pathCompare !== 0) return pathCompare;
      return a.fileName.localeCompare(b.fileName);
    });

    return { entries, folderPaths: Array.from(folderPaths).sort((a, b) => a.localeCompare(b)) };
  }, []);

  const syncFolderFromDisk = useCallback(async (dirHandle: FileSystemDirectoryHandle, excludeRelativePaths?: Set<string>, selectRelativePath?: string) => {
    const isExcluded = (relPath: string) =>
      isRelativePathDeleted(relPath) || Boolean(excludeRelativePaths && excludeRelativePaths.has(relPath));

    const { entries, folderPaths } = await scanFolderEntries(dirHandle);
    const filteredEntries = entries.filter((e) => !isExcluded(e.relativePath));

    setOpenedFolderPaths(folderPaths);
    const currentNotes = notesRef.current;
    const existingByPath = new Map(
      currentNotes
        .filter((n) => n.fileName && !isExcluded(getRelativePath(n.folderPath || "", n.fileName)))
        .map((n) => [getRelativePath(n.folderPath || "", n.fileName as string), n] as const),
    );

    const activeNoteRef = activeTabId ? currentNotes.find((n) => n.id === activeTabId) : null;
    const activeRelativePath = activeNoteRef?.fileName
      ? getRelativePath(activeNoteRef.folderPath || "", activeNoteRef.fileName)
      : null;

    const nextItems: Array<{ id?: string; content: string; fileName: string; contentFormat: "plain" | "markdown" | "html"; isLinkedFile: true; folderPath: string; fileType?: "image" | "binary" }> = [];

    for (const entry of filteredEntries) {
      const existing = existingByPath.get(entry.relativePath);

      if (existing) {
        nextItems.push({
          id: existing.id,
          content: existing.content,
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
          fileType: entry.fileType,
        });
        continue;
      }

      if (entry.fileType === "image" || entry.fileType === "binary") {
        nextItems.push({
          content: "",
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
          fileType: entry.fileType,
        });
        continue;
      }

      try {
        const file = await entry.handle.getFile();
        const text = await file.text();
        const content = entry.contentFormat === "markdown" ? (marked.parse(text, { async: false, gfm: true, breaks: true }) as string) : text;
        nextItems.push({
          content,
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
        });
      } catch {
        // skip unreadable files
      }
    }

    const handleByRelativePath = new Map(filteredEntries.map((entry) => [entry.relativePath, entry.handle] as const));

    await clearAllStoredFileHandles();
    const nextNotes = replaceNotes(nextItems);
    await Promise.all(
      nextNotes.map((note) => {
        const relPath = note.fileName ? getRelativePath(note.folderPath || "", note.fileName) : "";
        const handle = relPath ? handleByRelativePath.get(relPath) : null;
        return handle ? setStoredFileHandle(note.id, handle) : Promise.resolve();
      }),
    );

    if (nextNotes.length === 0) {
      setActiveTabId(null);
      return nextNotes;
    }

    const targetPathToOpen = selectRelativePath || activeRelativePath;
    if (targetPathToOpen) {
      const nextActive = nextNotes.find((n) => n.fileName && getRelativePath(n.folderPath || "", n.fileName) === targetPathToOpen);
      if (nextActive) {
        openTab(nextActive.id);
        removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
        return nextNotes;
      }
    }

    removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
    return nextNotes;
  }, [activeTabId, replaceNotes, scanFolderEntries, openTab, setActiveTabId, removeTabsForDeletedNotes]);

  const createNoteInFolder = async (folderPath?: string, options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const { fileName: desiredFileName, contentFormat } = normalizeNewFileOptions(options);

    // If no folder is opened, fallback to normal in-app note creation.
    if (!openedRootDirHandle) {
      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName: desiredFileName,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
      return;
    }

    try {
      let targetDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment);
      }

      const fileName = await resolveUniqueFileName(targetDir, desiredFileName);
      const relPath = getRelativePath(normalizedPath, fileName);
      clearDeletedRelativePath(relPath);

      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write("");
      await writable.close();

      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName,
        isLinkedFile: true,
        contentFormat,
      });
      openTab(note.id);
      await setStoredFileHandle(note.id, fileHandle);

      void syncFolderFromDisk(openedRootDirHandle, undefined, relPath);
    } catch (error) {
      console.error("Create file in folder failed", error);
      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName: desiredFileName,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
    }
  };

  const createFolderInFolder = async (folderPath?: string, folderName?: string) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "untitled-folder";

    if (!openedRootDirHandle) return;

    try {
      let parentDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }

      const targetFolderName = await resolveUniqueFolderName(parentDir, safeName);
      await parentDir.getDirectoryHandle(targetFolderName, { create: true });

      const newFolderPath = normalizedPath ? `${normalizedPath}/${targetFolderName}` : targetFolderName;
      for (const p of Array.from(globalDeletedRelativePaths)) {
        if (p === newFolderPath || p.startsWith(`${newFolderPath}/`)) {
          clearDeletedRelativePath(p);
        }
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Create folder failed", error);
    }
  };

  const renameFileInFolder = async (note: Note, nextName: string) => {
    if (!openedRootDirHandle || !note.fileName) return;

    const proposed = nextName.trim();
    if (!proposed || proposed === note.fileName) return;

    const oldRelPath = getRelativePath(note.folderPath || "", note.fileName);
    trackDeletedRelativePath(oldRelPath);

    try {
      const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
      if (!sourceDir) return;

      const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || note.fileName;
      const finalName = await resolveUniqueFileName(sourceDir, safeName);
      const newRelPath = getRelativePath(note.folderPath || "", finalName);
      clearDeletedRelativePath(newRelPath);

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      const newHandle = await copyFileHandleToDirectory(sourceHandle, sourceDir, finalName);

      await setStoredFileHandle(note.id, newHandle);
      updateNote(note.id, { fileName: finalName });

      await sourceDir.removeEntry(note.fileName);
      await syncFolderFromDisk(openedRootDirHandle, undefined, newRelPath);
    } catch (error) {
      console.error("Rename file failed", error);
      clearDeletedRelativePath(oldRelPath);
    }
  };

  const renameFolderInFolder = async (folderPath: string, nextName: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    const segments = folderPath.split("/").filter(Boolean);
    const currentName = segments[segments.length - 1] || "folder";
    const proposed = nextName.trim();
    if (!proposed || proposed === currentName) return;

    const notesInFolder = notes.filter(
      (n) => n.folderPath === folderPath || n.folderPath?.startsWith(`${folderPath}/`)
    );
    notesInFolder.forEach((n) => {
      if (n.fileName) {
        trackDeletedRelativePath(getRelativePath(n.folderPath || "", n.fileName));
      }
    });

    try {
      let parentDir = openedRootDirHandle;
      for (const segment of segments.slice(0, -1)) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }

      const sourceDir = await parentDir.getDirectoryHandle(currentName);
      const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || currentName;
      const newFolderName = await copyDirectoryRecursive(sourceDir, parentDir, safeName);
      await parentDir.removeEntry(currentName, { recursive: true });

      // Keep selection on the renamed folder when possible.
      const parentPath = segments.slice(0, -1).join("/");
      const renamedPath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName;
      notesInFolder.forEach((n) => {
        const suffix = (n.folderPath || "").slice(folderPath.length);
        const updatedPath = `${renamedPath}${suffix}`.replace(/^\/+/, "");
        updateNote(n.id, { folderPath: updatedPath });
      });

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Rename folder failed", error);
    }
  };

  const duplicateFileInFolder = async (note: Note) => {
    if (!openedRootDirHandle || !note.fileName) return;

    try {
      const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
      if (!sourceDir) return;

      const dotIndex = note.fileName.lastIndexOf(".");
      const base = dotIndex > 0 ? note.fileName.slice(0, dotIndex) : note.fileName;
      const ext = dotIndex > 0 ? note.fileName.slice(dotIndex) : ".txt";
      const duplicateName = await resolveUniqueFileName(sourceDir, `${base}-copy${ext}`);

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      await copyFileHandleToDirectory(sourceHandle, sourceDir, duplicateName);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate file failed", error);
    }
  };

  const duplicateFilesInFolder = async (targetNotes: Note[]) => {
    if (!openedRootDirHandle || targetNotes.length === 0) return;

    try {
      for (const note of targetNotes) {
        if (!note.fileName) continue;
        const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
        if (!sourceDir) continue;

        const dotIndex = note.fileName.lastIndexOf(".");
        const base = dotIndex > 0 ? note.fileName.slice(0, dotIndex) : note.fileName;
        const ext = dotIndex > 0 ? note.fileName.slice(dotIndex) : ".txt";
        const duplicateName = await resolveUniqueFileName(sourceDir, `${base}-copy${ext}`);

        const sourceHandle = await sourceDir.getFileHandle(note.fileName);
        await copyFileHandleToDirectory(sourceHandle, sourceDir, duplicateName);
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate files failed", error);
    }
  };

  const duplicateFolderInFolder = async (folderPath: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    try {
      const segments = folderPath.split("/").filter(Boolean);
      const currentName = segments[segments.length - 1] || "folder";
      let parentDir = openedRootDirHandle;
      for (const segment of segments.slice(0, -1)) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }
      const sourceDir = await parentDir.getDirectoryHandle(currentName);
      await copyDirectoryRecursive(sourceDir, parentDir, `${currentName}-copy`);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate folder failed", error);
    }
  };

  const copyFile = (note: Note) => {
    setClipboardItem({ kind: "file", noteId: note.id, folderPath: note.folderPath || "", fileName: note.fileName });
  };

  const copyFiles = (targetNotes: Note[]) => {
    const noteIds = targetNotes.map((n) => n.id);
    if (noteIds.length === 0) return;
    setClipboardItem({ kind: "file-batch", noteIds, folderPath: "" });
  };

  const copyFolder = (folderPath: string) => {
    setClipboardItem({ kind: "folder", folderPath });
  };

  const pasteIntoFolder = async (targetFolderPath?: string) => {
    if (!openedRootDirHandle || !clipboardItem) return;

    const normalizedTarget = targetFolderPath ?? "";
    try {
      const targetDir = await getDirectoryHandleByPath(normalizedTarget);
      if (!targetDir) return;

      if (clipboardItem.kind === "file" && clipboardItem.noteId) {
        const sourceNote = notes.find((n) => n.id === clipboardItem.noteId);
        if (!sourceNote?.fileName) return;

        const sourceDir = await getDirectoryHandleByPath(sourceNote.folderPath || "");
        if (!sourceDir) return;

        const sourceHandle = await sourceDir.getFileHandle(sourceNote.fileName);
        const targetName = await resolveUniqueFileName(targetDir, sourceNote.fileName);
        await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
      }

      if (clipboardItem.kind === "file-batch" && clipboardItem.noteIds?.length) {
        const sourceNotes = clipboardItem.noteIds
          .map((id) => notes.find((n) => n.id === id))
          .filter((n): n is Note => Boolean(n && n.fileName));

        for (const sourceNote of sourceNotes) {
          if (!sourceNote.fileName) continue;
          const sourceDir = await getDirectoryHandleByPath(sourceNote.folderPath || "");
          if (!sourceDir) continue;

          const sourceHandle = await sourceDir.getFileHandle(sourceNote.fileName);
          const targetName = await resolveUniqueFileName(targetDir, sourceNote.fileName);
          await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
        }
      }

      if (clipboardItem.kind === "folder") {
        if (normalizedTarget === clipboardItem.folderPath || normalizedTarget.startsWith(`${clipboardItem.folderPath}/`)) {
          return;
        }

        const segments = clipboardItem.folderPath.split("/").filter(Boolean);
        const sourceName = segments[segments.length - 1];
        if (!sourceName) return;

        const sourceDir = await getDirectoryHandleByPath(clipboardItem.folderPath);
        if (!sourceDir) return;
        await copyDirectoryRecursive(sourceDir, targetDir, sourceName);
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Paste failed", error);
    }
  };

  const moveFileToFolder = async (note: Note, targetFolderPath: string) => {
    if (!openedRootDirHandle || !note.fileName) return;
    const sourcePath = note.folderPath || "";
    if (sourcePath === targetFolderPath) return;

    const oldRelPath = getRelativePath(sourcePath, note.fileName);
    trackDeletedRelativePath(oldRelPath);

    try {
      const sourceDir = await getDirectoryHandleByPath(sourcePath);
      const targetDir = await getDirectoryHandleByPath(targetFolderPath);
      if (!sourceDir || !targetDir) return;

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      const targetName = await resolveUniqueFileName(targetDir, note.fileName);
      const newRelPath = getRelativePath(targetFolderPath, targetName);
      clearDeletedRelativePath(newRelPath);

      await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
      const targetHandle = await targetDir.getFileHandle(targetName);
      await setStoredFileHandle(note.id, targetHandle);
      updateNote(note.id, {
        folderPath: targetFolderPath,
        fileName: targetName,
      });

      await sourceDir.removeEntry(note.fileName);
      await syncFolderFromDisk(openedRootDirHandle, undefined, newRelPath);
    } catch (error) {
      console.error("Move file failed", error);
      clearDeletedRelativePath(oldRelPath);
    }
  };

  const moveFolderToFolder = async (sourceFolderPath: string, targetFolderPath: string) => {
    if (!openedRootDirHandle || !sourceFolderPath) return;
    if (sourceFolderPath === targetFolderPath || targetFolderPath.startsWith(`${sourceFolderPath}/`)) return;

    const notesInFolder = notes.filter(
      (n) => n.folderPath === sourceFolderPath || n.folderPath?.startsWith(`${sourceFolderPath}/`)
    );

    notesInFolder.forEach((n) => {
      if (n.fileName) {
        const oldRelPath = getRelativePath(n.folderPath || "", n.fileName);
        trackDeletedRelativePath(oldRelPath);
      }
    });

    try {
      const sourceSegments = sourceFolderPath.split("/").filter(Boolean);
      const sourceName = sourceSegments[sourceSegments.length - 1];
      if (!sourceName) return;

      let sourceParentDir = openedRootDirHandle;
      for (const segment of sourceSegments.slice(0, -1)) {
        sourceParentDir = await sourceParentDir.getDirectoryHandle(segment);
      }

      const sourceDir = await sourceParentDir.getDirectoryHandle(sourceName);
      const targetDir = await getDirectoryHandleByPath(targetFolderPath);
      if (!targetDir) return;

      await copyDirectoryRecursive(sourceDir, targetDir, sourceName);
      await sourceParentDir.removeEntry(sourceName, { recursive: true });
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Move folder failed", error);
    }
  };

  const deleteFileInFolder = async (note: { id: string; folderPath?: string; fileName?: string; title?: string }) => {
    const deletedFileName = note.fileName || note.title || t("editor.untitled");

    if (note.fileName) {
      const relPath = getRelativePath(note.folderPath || "", note.fileName);
      trackDeletedRelativePath(relPath);
    }

    handleDeleteNote(note.id);

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: deletedFileName }),
    });
  };

  const deleteFilesInFolder = async (targetNotes: Note[]) => {
    if (targetNotes.length === 0) return;

    const count = targetNotes.length;
    targetNotes.forEach((n) => {
      if (n.fileName) {
        trackDeletedRelativePath(getRelativePath(n.folderPath || "", n.fileName));
      }
      handleDeleteNote(n.id);
    });

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: `${count} items` }),
    });
  };

  const deleteFolderInFolder = async (folderPath: string) => {
    if (!folderPath) return;

    const folderName = folderPath.split("/").filter(Boolean).pop() || folderPath;
    const notesInFolder = notes.filter(
      (n) => n.folderPath === folderPath || n.folderPath?.startsWith(`${folderPath}/`)
    );

    const relPaths = new Set<string>();
    notesInFolder.forEach((n) => {
      if (n.fileName) {
        const relPath = getRelativePath(n.folderPath || "", n.fileName);
        relPaths.add(relPath);
        trackDeletedRelativePath(relPath);
      }
      handleDeleteNote(n.id);
    });

    if (openedRootDirHandle) {
      try {
        const segments = folderPath.split("/").filter(Boolean);
        if (segments.length > 0) {
          let parentDir = openedRootDirHandle;
          for (const segment of segments.slice(0, -1)) {
            parentDir = await parentDir.getDirectoryHandle(segment, { create: false });
          }

          await requestPermissionIfAvailable(parentDir, "readwrite");
          const targetName = segments[segments.length - 1];
          await parentDir.removeEntry(targetName, { recursive: true });
        }

        await syncFolderFromDisk(openedRootDirHandle, relPaths);
      } catch (error) {
        console.warn("Delete folder from disk warning:", error);
      }
    }

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: folderName }),
    });
  };

  const createNoteInFolderWithDir = async (
    targetRootDirHandle: FileSystemDirectoryHandle,
    folderPath?: string,
    options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }
  ) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const { fileName: desiredFileName, contentFormat } = normalizeNewFileOptions(options);

    try {
      let targetDir = targetRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment, { create: true });
      }

      const fileName = await resolveUniqueFileName(targetDir, desiredFileName);
      const relPath = getRelativePath(normalizedPath, fileName);
      clearDeletedRelativePath(relPath);

      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write("");
      await writable.close();

      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName,
        isLinkedFile: true,
        contentFormat,
      });
      openTab(note.id);
      await setStoredFileHandle(note.id, fileHandle);

      void syncFolderFromDisk(targetRootDirHandle, undefined, relPath);
    } catch (error) {
      console.error("Create file in target folder failed", error);
    }
  };

  const createFolderInFolderWithDir = async (
    targetRootDirHandle: FileSystemDirectoryHandle,
    folderPath?: string,
    folderName?: string
  ) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "untitled-folder";

    try {
      let parentDir = targetRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment, { create: true });
      }

      const targetFolderName = await resolveUniqueFolderName(parentDir, safeName);
      await parentDir.getDirectoryHandle(targetFolderName, { create: true });

      const newFolderPath = normalizedPath ? `${normalizedPath}/${targetFolderName}` : targetFolderName;
      for (const p of Array.from(globalDeletedRelativePaths)) {
        if (p === newFolderPath || p.startsWith(`${newFolderPath}/`)) {
          clearDeletedRelativePath(p);
        }
      }

      await syncFolderFromDisk(targetRootDirHandle);
    } catch (error) {
      console.error("Create folder in target folder failed", error);
    }
  };

  const handleOpenFolder = async (pending?: { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html"; folderName?: string }) => {
    const w = window as unknown as { showDirectoryPicker?: (options?: unknown) => Promise<FileSystemDirectoryHandle> };
    if (typeof w.showDirectoryPicker !== "function") return;

    try {
      const dirHandle = await w.showDirectoryPicker({ mode: "readwrite" });
      setOpenedFolderName(dirHandle.name ?? null);
      setOpenedRootDirHandle(dirHandle);
      await syncFolderFromDisk(dirHandle);

      if (pending) {
        if (pending.kind === "file") {
          await createNoteInFolderWithDir(dirHandle, undefined, { fileName: pending.fileName, contentFormat: pending.contentFormat });
        } else if (pending.kind === "folder") {
          await createFolderInFolderWithDir(dirHandle, undefined, pending.folderName);
        }
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Open folder failed", error);
      }
    }
  };

  useEffect(() => {
    if (!openedRootDirHandle) return;

    const intervalId = window.setInterval(() => {
      void syncFolderFromDisk(openedRootDirHandle);
    }, 2500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncFolderFromDisk(openedRootDirHandle);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [openedRootDirHandle, syncFolderFromDisk]);

  // Keep open tabs in sync when notes are deleted (non-folder-sync deletions)
  useEffect(() => {
    removeTabsForDeletedNotes(new Set(notes.map((n) => n.id)));
  }, [notes, removeTabsForDeletedNotes]);

  const openTabNotes = openTabIds.map((id) => notes.find((n) => n.id === id)).filter((n): n is Note => Boolean(n));

  const handleDeleteNote = (id: string): boolean => {
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return false;

    if (targetNote.fileName) {
      const relPath = getRelativePath(targetNote.folderPath || "", targetNote.fileName);
      trackDeletedRelativePath(relPath);
    }
    closeTab(id, notes.map((n) => n.id));
    const result = deleteNote(id);

    if (openedRootDirHandle && targetNote.fileName) {
      const relPath = getRelativePath(targetNote.folderPath || "", targetNote.fileName);
      void (async () => {
        try {
          let targetDir = openedRootDirHandle;
          const segments = (targetNote.folderPath ?? "").split("/").filter(Boolean);
          for (const segment of segments) {
            targetDir = await targetDir.getDirectoryHandle(segment, { create: false });
          }
          await requestPermissionIfAvailable(targetDir, "readwrite");
          const fname = targetNote.fileName as string;
          try {
            await targetDir.removeEntry(fname);
          } catch {
            /* ignore main file remove error */
          }

          try {
            for await (const [childName, childHandle] of (targetDir as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
              if (childHandle.kind === "file" && (childName.endsWith(".crswap") || childName.includes(".crswap"))) {
                if (childName.startsWith(fname) || childName.toLowerCase().includes(fname.toLowerCase())) {
                  try {
                    await targetDir.removeEntry(childName);
                  } catch {
                    /* ignore */
                  }
                }
              }
            }
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.warn("Disk file removal warning:", e);
        } finally {
          await syncFolderFromDisk(openedRootDirHandle, new Set([relPath]));
        }
      })();
    }

    return result;
  };

  const handleCreateNote = (
    folderPath?: string,
    options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" },
  ): Note | void => {
    if (openedRootDirHandle) {
      void createNoteInFolder(folderPath, options);
      return;
    }
    const note = createNote(folderPath);
    if (options) {
      updateNote(note.id, {
        fileName: options.fileName,
        contentFormat: options.contentFormat,
      });
    }
    openTab(note.id);
    return note;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar responsive */}
      <div className={sidebarOpen ? (isMobile ? "block md:hidden" : "hidden md:block") : "hidden"}>
        <Sidebar
          notes={notes}
          folderPaths={openedFolderPaths}
          activeNoteId={activeTabId}
          openedFolderName={openedFolderName}
          onSelect={openTab}
          onCreate={createNoteInFolder}
          onCreateFolder={createFolderInFolder}
          onDeleteFile={deleteFileInFolder}
          onDeleteFolder={deleteFolderInFolder}
          onCopyFile={copyFile}
          onCopyFiles={copyFiles}
          onCopyFolder={copyFolder}
          onPasteToFolder={pasteIntoFolder}
          onDuplicateFile={duplicateFileInFolder}
          onDuplicateFiles={duplicateFilesInFolder}
          onDuplicateFolder={duplicateFolderInFolder}
          onRenameFile={renameFileInFolder}
          onRenameFolder={renameFolderInFolder}
          onMoveFile={moveFileToFolder}
          onMoveFolder={moveFolderToFolder}
          onDeleteFiles={deleteFilesInFolder}
          canPaste={Boolean(clipboardItem)}
          onOpenFolder={handleOpenFolder}
          sidebarWidth={settings.sidebarWidth}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          confirmBeforeDelete={settings.confirmBeforeDelete}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* Editor area responsive */}
      <div className="flex-1 flex flex-col min-w-0">
        <TabBar
          tabs={openTabNotes}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={(id) => closeTab(id, notes.map((n) => n.id))}
          onSplitTab={(id) => {
            // ถ้า split อยู่แล้วและกดซ้ำ ให้ toggle ปิด split
            setSplitTabId(prev => prev === id ? null : id);
          }}
        />
        <Breadcrumb note={activeTabNote} rootFolderName={openedFolderName} notes={notes} onSelectNote={setActiveTabId} />
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* ถ้า splitTabId มีค่า ให้ render editor 2 pane ซ้าย-ขวา */}
          {splitTabId && splitTabId !== activeTabId ? (
            <div className="flex flex-1 min-h-0 flex-row w-full">
              <div
                className="min-w-0 border-r border-border overflow-auto"
                style={{ width: splitLeftWidth ? splitLeftWidth : "50%", minWidth: 120 }}
              >
                <Editor
                  note={activeTabNote}
                  notes={notes}
                  onUpdate={updateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onCreateFolder={createFolderInFolder}
                  onOpenFolder={handleOpenFolder}
                  openedFolderName={openedFolderName}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                  settingsOpen={settingsOpen}
                  onSettingsOpenChange={setSettingsOpen}
                />
              </div>
              <SplitResizer
                onResize={delta => {
                  setSplitLeftWidth(prev => {
                    // ถ้า prev ยังไม่เคย set ให้ใช้ 50% ของ container
                    const container = document.querySelector(".flex.flex-1.min-h-0.flex-row.w-full");
                    const total = container instanceof HTMLElement ? container.offsetWidth : 0;
                    const base = prev ?? (total ? total / 2 : 400);
                    let next = base + delta;
                    // จำกัดขนาดขั้นต่ำ/สูงสุด
                    if (next < 120) next = 120;
                    if (total && next > total - 120) next = total - 120;
                    return next;
                  });
                }}
              />
              <div className="min-w-0 overflow-auto flex-1">
                <Editor
                  note={notes.find(n => n.id === splitTabId) ?? null}
                  notes={notes}
                  onUpdate={updateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onCreateFolder={createFolderInFolder}
                  onOpenFolder={handleOpenFolder}
                  openedFolderName={openedFolderName}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                  onCloseSplit={() => setSplitTabId(null)}
                  settingsOpen={settingsOpen}
                  onSettingsOpenChange={setSettingsOpen}
                />
              </div>
            </div>
          ) : (
            <Editor
              note={activeTabNote}
              notes={notes}
              onUpdate={updateNote}
              onDelete={handleDeleteNote}
              onCreate={handleCreateNote}
              onCreateFolder={createFolderInFolder}
              onOpenFolder={handleOpenFolder}
              openedFolderName={openedFolderName}
              onOpenSidebar={() => setSidebarOpen(true)}
              isSidebarOpen={sidebarOpen}
              editorFontSize={settings.editorFontSize}
              isMobile={isMobile}
              rootDirHandle={openedRootDirHandle}
              settingsOpen={settingsOpen}
              onSettingsOpenChange={setSettingsOpen}
            />
          )}
        </div>
      </div>
    </div>
  );
}
